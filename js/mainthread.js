
/* global fetch */

/*******************************************************************************
 * This is the main thred of the Candiweb program. It reads the NEOCP and 
 * Dates of Last Observation of Unusual Objects from the MPC, stores data 
 * for objects of magnitude <20.5 in in Body objects, checks for visibility at
 * the selected  observatory, applies a magnitude and altitude filter and 
 * writes tables into the document. Functions also link to the MPC Ephemeris 
 * pages for selected objects.
 * The ESA NEO Priority list is also obtained and priorities show.
 * 
 * Author: Tony Evans November 2021
 */

/* Global variables */
 var comments;       // text area for display of messages.
 var neocps = [];    // array of NEOCPs    
 var neos = [];      // array of NEOs
 var priorities = [];// array of ESA priority list lines
 
 var toRadians = Math.PI/180;
 var pi2 = Math.PI/2.0;
 
 var sun;            // the Sun object
 var now;            // current date
 var JD;             // current Julian Day
 var obs;            // currently selected observatory
 var filter;         // Filter object 
 var neocpLoaded;    // NEOCP processing complete flag
 
 var neoLoaded;      // NEO processing complete flag
 var priLoaded;      // Priority list complete flag
 var priCodes = ["Urg","Need","Use","Low"]; //Priority codes

/***************************************************************************
 * Function called on page load initiates main thread.
 **/
function init() {
   /* none of the files have been loaded */
    neocpLoaded = false;
    neoLoaded = false;
    priLoaded = false;
   /* get the comments textarea */
    comments = document.getElementById("comments");
   /* get current date and Julian Day */
    now = new Date();
    JD = (now/86400000) - (now.getTimezoneOffset()/1440) + 2440587.5;
   /* create a Sun and set its position */
    sun = new Sun();          
    sun.setPosition(JD);
   /* create an Observatory and set its default position and title in the DOM */
    obs = new Observatory(-70.5,-33.27,"W88", "Chile, La Dehesa");
    obs.setTimes();
    let obname = document.getElementById("obsname");
    obname.innerHTML = obs.name;  
   /* create a Filter and set values from the document */
    filter = new Filter();
    filter.getFilter();
   /* create a cookie handler and show warning */
    let cookie = new Cookie();
    
   /* initial announcement */
    comments.value += "Timenow " + now.toString() + "\n";
    let ra = sun.raDec.x / (15*toRadians);
    let dec= sun.raDec.y / toRadians;
    comments.value += "Sun RA/Decl: "+ ra.toFixed(2)+ " hours "+ dec.toFixed(2) + " degrees.\n";
    if (cookie.enabled) {
        comments.value += "NOTE: A cookie, recording filter settings for 7 days," +
                      "will be written if you use the Filter button.\n";
    }
    doFetch();
}
/*****************************************************************************
 * Fetch the MPC and ESA files and call processing functions.
 */
function doFetch() {
   /* URLs for data */
    let neocpurl = "https://minorplanetcenter.net/iau/NEO/neocp.txt";
    let unusualurl ="https://minorplanetcenter.net/iau/lists/LastUnusual.html";
    let priorityurl = "https://api.codetabs.com/v1/proxy?quest=https://neo.ssa.esa.int/PSDB-portlet/download?file=esa_priority_neo_list";
               /*priority list must be obtained via a CORS Proxy*/
      
   /* Local copies of data for use during testing */
    //var neocpurl = "neocp.txt"; 
    //var unusualurl = "unusuals.txt";
    //var priorityurl = "priority.txt";
    
   /* load the files and call appropriate processors.*/
    comments.value += "Fetching data.\n";
    $.get(neocpurl,function(data){doNeocp(data);});
    $.get(unusualurl,function(data){doUnusuals(data);});
    $.get(priorityurl,function(data){doPriority(data);});
    // The processing functions are automatically called once the 
    // Fetches have obtained the data.                            
}

/****************************************************************************
 * Process NEOCP data, create Body objects and show neocp table.
 * @param {string} neocpData is text of download neocp list.
 */
function doNeocp(neocpData) {
  /* split data to lines, extract data and create Bodies */
    neocps = [];
    let lines = neocpData.split("\n");
    let nLines = lines.length;
    let count = 0;
  /* for each line check for a viable object */ 
    for (let i = 0; i < nLines; i++) {
        const item = lines[i];
        if (item.length < 100) continue;
        let vmag = item.slice(43,47);
        let limit = 20.5;
       /* create neocp object if brighter than mag 20.5 */
        if (!(vmag>limit)) {
            let n = new Body();
            let nm = item.slice(0,8) + "  ";
            n.id = nm.trim();
            n.score = item.slice(8,12);
            n.obs = item.slice(80,82) + " obs in arc " + item.slice(84,89) + "°";
            n.coord.x =  item.slice(26,33) * 15 * toRadians;
            n.coord.y = item.slice(34,42) * toRadians;
            n.updated = item.slice(48,70);
            n.v = vmag;
            n.h = item.slice(90,94);
            n.type = "neocp";
            neocps.push(n); 
            count++;
        }
    }
   /* report neocps complete */ 
    comments.value += (count + " NEOCPs added. \n");
    neocpLoaded = true;
   /* Check visibility of NEOCPs at selected observatory */
    filter.setFilter();
    for (let i = 0; i < neocps.length; i++) {
        neocps[i].checkVisible();
    }
   /* show NEOCP table */
    doTable1();
}
/***
 *  Show table of neocps 
 **/
function doTable1(){
    let neocpTab = document.getElementById('tbody1');
    let tabBod = "";
   /* build contents of table body */
    for (let i = 0; i < neocps.length; i++) {
        if (neocps[i].visible === true) {
            tabBod+="<tr>";
            tabBod+="<td><input type=\"checkbox\" name=\"Obj\"></td>";
            tabBod+="<td>" + neocps[i].id + "</td>";
            tabBod+="<td>" + neocps[i].v + "</td>";
            tabBod+="<td>" + neocps[i].score + "</td>";
            let ra = neocps[i].coord.x/(toRadians * 15);
            tabBod+="<td>" + ra.toFixed(3) + "</td>";
            let dec = neocps[i].coord.y/toRadians;
            tabBod+="<td>" + dec.toFixed(2) + "</td>";
            tabBod+="<td>" + neocps[i].updated + "</td>";
            tabBod+="<td>" + neocps[i].obs + "</td></tr>";
        }
    }
    neocpTab.innerHTML = tabBod; 
}
/***
 * Query MPC Ephemeris Service for ephemeris of NEOCPs selected.
 * @returns {undefined}
 **/
function doEphem1() {
   /* query url and fixed part */ 
    let eText = "http://cgi.minorplanetcenter.net/cgi-bin/confirmeph2.cgi";
    eText += "?mb=-30&mf=30&dl=-90&du=%2B90&nl=0&nu=100&sort=d&W=j";
    let part2 = "&Parallax=1&long=&lat=&alt=&int=1&raty=a&mot=m&dmot=p&out=f&sun=x&oalt=20";
   /* get table rows and add object id for those selected */ 
    let table = document.getElementById("table1"); // pointer to table
    let rows = table.rows;                         // contents of table
    let shrs = document.getElementById("hours").value; // Hours adjustment
    for (i = 1; i < (rows.length); i++) {
       let sel = rows[i].getElementsByTagName("input")[0]; 
       if (sel.checked) {
           eText += "&obj=" + rows[i].getElementsByTagName("td")[1].innerHTML;  
       }
    }
   /* add dates, times, obs code and final fixed part to query */
    eText += "&start="+shrs;
    eText += "&obscode="+obs.code;
    eText += part2; 
   /* open new tab with ephemeris */ 
    window.open(eText,"_blank");
}

/*****************************************************************************
 * Process Unusuals data, create Body objects.
 * @param {string} unusuals is text of download Unusuals list.
 */
function doUnusuals(unusuals) {
   /* split data to lines, extract data and create bodies    */
    neos = [];
    let lines = unusuals.split("\n");
    let nLines = lines.length;
    let count = 0;
    for (let i = 0; i < nLines; i++) {
        let tkn = lines[i];
        if (tkn.startsWith("<input type=\"checkbox\" name=\"Obj\"")) {
            let k = tkn.indexOf(">");
            tkn=tkn.slice(k+1);
            let v = tkn.slice(43,47);
           /* if within mag limit, create Body */
            if (!(v>20.5)) {
                n = new Body();
                n.id = tkn.slice(9,19);
                n.id = n.id.trim();
                n.v = v;
                n.updated = tkn.slice(60,72);
                n.visible = true;
                n.type = translate(tkn.slice(29,32));
                n.coord.x = tkn.slice(34,38) * 15 * toRadians;
                n.coord.y = tkn.slice(39,42) * toRadians;
                n.motion = tkn.slice(52,57);
                n.score = tkn.charAt(87);
                neos.push(n);
                count++;
            }
        }
    }
   /* report unusuals complete */
    comments.value+= count + " Other objects added.\n";
    neoLoaded = true;
   /* go to check if priority data has arrived yet */
    checkPriority();   
}

/***
 * Produce table of Unusual Objects.
 * @returns {undefined}
 **/
function doTable2() {
   /* geneate table of neos  */
    let neoTab = document.getElementById('tbody2');
    let tabBod = "";
    for (let i = 0; i < neos.length; i++) {
        if (neos[i].visible === true) {
            tabBod+="<tr>";
            tabBod+="<td><input type=\"checkbox\" name=\"Obj\"></td>";
            tabBod+="<td>" + neos[i].id + "</td>";
            if (neos[i].priority === "") {
                tabBod+="<td> - </td>";
            } else {
                tabBod+="<td>" + priCodes[neos[i].priority] + "</td>";
            }
            tabBod+="<td>" + neos[i].v + "</td>";
            tabBod+="<td>" + neos[i].score + "</td>";
            tabBod+="<td>" + neos[i].motion + "</td>";
            tabBod+="<td>" + neos[i].type + "</td>";
            let ra = doFormat((neos[i].coord.x)/(toRadians * 15),2,1);
            tabBod+="<td>" + ra + "</td>";
            let dec = doFormat(neos[i].coord.y/toRadians,2,0);
            tabBod+="<td>" + dec + "</td>";
            tabBod+="<td>" + neos[i].updated + "</td>";
        }
    }
    neoTab.innerHTML = tabBod; 
}

/***********************************************************
 * Store the priority list data and signal it has arrived.
 * @param {type} pdata data from fetch.
 */
function doPriority(pdata) {
    priorities = pdata.split("\n");
    priLoaded = true;
}
/***
 * Check if priority list available else wait.
 */
function checkPriority() {
    if (priLoaded){
        doPcodes();
        return;
    } else {
        setTimeout(checkPriority,500);
    }
}
/***
 * Get priority levels for neos, check visibility and show table-
 */
function doPcodes() {
   /* get priority code for each neo */
    for (let i = 0; i < priorities.length; i++) {
        let p=priorities[i];
        for (let j = 0; j < neos.length; j++) {
            let n=neos[j].id;
            if (p.includes(n)) {
                neos[j].priority = p.slice(0,1);
            }
        }
    }
   /* Filter  for visibility at observatory */
    filter.setFilter();
    for (let i = 0; i < neos.length; i++) {
        neos[i].checkVisible();}  
   /* show table */
    doTable2();  
}

/***
 * Query MPC Ephemeris Service for ephemeris of NEO/Unsusual objects
 * @returns {undefined}
 **/
function doEphem2() {
   /* query url and fixed parts */
    let eText = "http://www.minorplanetcenter.net/cgi-bin/mpeph2.cgi?ty=e&TextArea=";
    let part2 = "&long=&lat=&alt=&raty=a&s=t&m=m&adir=S&oed=&e=-2&resoc=&tit=&bu=&ch=c&ce=f&js=f";
    let separator ="%0D%0A";
   /* add object ids to query */ 
    let table = document.getElementById("table2"); // pointer to table
    let rows = table.rows;                         // contents of table
    let select = document.getElementById("hours").value; // Hours adjustment
    let JDE = JD + select/24;                // time start of ephems
    /* add object names to query */
    for (i = 1; i < (rows.length); i++) {
       let sel = rows[i].getElementsByTagName("input")[0]; 
       if (sel.checked) {
           eText += rows[i].getElementsByTagName("td")[1].innerHTML + separator;  
       }
    }
   /* add dates, times and obs code to query */
    eText += "&d=JD+"+JDE.toFixed(5);   // start time
    let lineCount = obs.ha * 4;         // number of ephem lines
    eText += "&l="+lineCount.toFixed(0);
    eText += "&i=30&u=m&uto=0";         // 30 minute intervals
    eText += "&c=" + obs.code;          // obs code
    eText += part2;                     // add fixed part of query
   /* open new tab with ephemeris */ 
    window.open(eText,"_blank");
}
/***************************************************************************
 * Change Observatory
 * @returns {undefined}
 **/
function doObservatory() {
   /*Change observatory name on button */
    let btn = document.getElementById("obbutton");
    btn.textContent = "Go to " + obs.code;
   /* toogle which observatory is being used */
    if (obs.code === "W88") {
        obs = new Observatory(-16.51,28.3,"G40", "Canary Islands, Mt. Teide");
        obs.setTimes();
    } else {
        obs = new Observatory(-70.5,-33.27,"W88", "Chile, La Dehesa");
        obs.setTimes();}
   /* set new title in DOM */
    let obname = document.getElementById("obsname");
    obname.innerHTML = obs.name;  
   /* Re-do filter and re-show tables */ 
    doFilter();
}
/***************************************************************************
 * Filter NEOCPs and NEOs according to user options and reproduce tables
 * @returns {undefined}
 */
function doFilter() {
    filter.setFilter();
    for (let i = 0; i < neos.length; i++) {
        neos[i].checkVisible();}   
    for (let i = 0; i < neocps.length; i++) {
        neocps[i].checkVisible();}
    doTable1();
    doTable2();
}
/***************************************************************************
 * Decimal Formatter. Simple decimal formatter to make columns look neater.
 * @param {type} n the number to be formatted.
 * @param {type} i the number of places befor decimal point
 * @param {type} d the number of decimal places
 * @returns {String}
 */
function doFormat(n,i,d) {
    let r="";
    if (n<0) {r="-";} else {r="+";}
    n=abs(n);
    let p = "00000" + n.toFixed(d);
    return r+p.slice(-(1+i+d));
}
   



        




