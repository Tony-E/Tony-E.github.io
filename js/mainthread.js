


/*******************************************************************************
 * This is the main thred of the Candiweb program. It reads the NEOCP, PCCP and 
 * Dates of Last Observation of Unusual Objects from the MPC, stores data 
 * for objects of magnitude down to "limit" in Body objects, checks for 
 * visibility at the selected  observatory, applies a magnitude and altitude
 * filter and writes tables into the document. 
 * 
 * The NEODys NEO Priority list is also obtained and priorities are added to
 * NEOs where available.
 * 
 * Checkboxes are used to select objects and request ephemeris from the MPC.
 * 
 * Author: Tony Evans 2022-2024
 */

/* Global variables */
 var limit = 20.5;              // max mag for downloaded objects
 var comments;                  // text area for display of messages.
 var neocps = [];               // array of NEOCPs    
 var neos = [];                 // array of NEOs
 var priorities = [];           // array of NEODys priority list lines
 var pccp = [];                 // array of PCCPs
 
/* Useful constants */ 
 var toRadians = Math.PI/180;
 var pi2 = Math.PI/2.0;

/* Values and objects */
 var sun;                       // the Sun object
 var now;                       // current date
 var JD;                        // current Julian Day
 var obs = [];                  // array of observatories
 var ob;                        // currently selected observatory
 var filter;                    // filter object 
 
/* Completion flags */ 
 var neocpLoaded = false;       // NEOCP processing complete flag
 var neoLoaded = false;         // NEO processing complete flag
 var priLoaded = false;         // Priority list complete flag
 var pccpLoaded = false;        // PCCP processing complete flag

/***************************************************************************
 * Function called on page load initiates main thread.
 **/
function init() {
       
   /* get pointer to the comments textarea */
    comments = document.getElementById("comments");
    
   /* get current date and Julian Day */
    now = new Date();
    JD = (now/86400000) - (now.getTimezoneOffset()/1440) + 2440587.5;
    
   /* create a Sun and set its position */
    sun = new Sun();          
    sun.setPosition(JD);
    
   /* create a list of Observatories */
    obs.push(new Observatory(-70.5,-33.27,"W88", "Chile, La Dehesa"));
    obs.push(new Observatory(-16.51,28.3,"G40", "Canary Islands, Mt. Teide"));
    obs.push(new Observatory(149.08,-31.28,"E62", "Australia, Coonabarabran"));
    
   /* set up the observatory change button */
    let btn = document.getElementById("obbutton");
    btn.textContent = "W88 > G40 > E62" ;
    
   /* set default observatory, set its time and put its name in the document */
    ob = 0;
    obs[ob].setTime();
    let obname = document.getElementById("obsName");
    obname.innerHTML = "<h2>" + obs[ob].name + "</h2>"; 
    
   /* create a Filter and set values from  a cookies (if enabled) */
    filter = new Filter();
    filter.getFilter();
    
   /* initial announcement */
    comments.value += "Timenow " + now.toString() + "\n";
    let ra = sun.raDec.x / (15*toRadians);
    let dec= sun.raDec.y / toRadians;
    comments.value += "Sun RA/Decl: "+ ra.toFixed(2)+ " hours "+ dec.toFixed(2) + " degrees.\n";
    let cookie = new Cookie();
    if (cookie.enabled) {
        comments.value += "A cookie, recording filter settings for 7 days," +
             "will be written if you use the Filter button.\n";
    }
   /* start importing data */
    doFetch();
}

/*****************************************************************************
 * Fetch the MPC and NEODyS files and call processing functions. Note that
 * the priority list from NEODyS must be obtained via a CORS Proxy server.
 */
function doFetch() {
   /* set up URLs for data sources */
    let neocpurl = "https://minorplanetcenter.net/iau/NEO/neocp.txt";
    let unusualurl ="https://minorplanetcenter.net/iau/lists/LastUnusual.html";
    let priorityurl = 'https://corsproxy.io/?' + 
            encodeURIComponent('https://newton.spacedys.com/neodys/priority_list/PLfile.txt');
    let pccpurl = "https://minorplanetcenter.net/iau/NEO/pccp.txt";        
      
   /* Local file urls with copies of data for use during testing */
   // neocpurl = "neocp.txt"; 
   // unusualurl = "unusuals.txt";
   // priorityurl = "priority.txt";
   // pccpurl = "pccp.txt";
    
   /* load the files (using ajax) and call processors when data arrives.*/
    comments.value += "Fetching data.\n";
    $.get(neocpurl,function(data){doNeocp(data);});
    $.get(unusualurl,function(data){doUnusuals(data);});
    $.get(priorityurl,function(data){doPriority(data);});
    $.get(pccpurl,function(data){doPccp(data);});
    
   /* The downloads have been initiated and processing functions will be
    * invoked when each download is complete. Now we wait for all the downloads
    * and processing to complete before populating the tables.  */
   
    setTimeout(checkData, 2000);                       
}

/******************************************************************************
 * Wait for data to arrive and create tables as appropriate, otherwise wait.
 */
function checkData() {
   /* if everything has arrived and been processed continue, otherwise wait */
    if (neocpLoaded && pccpLoaded && neoLoaded && priLoaded) {   
        doPcodes();            // assign priorities to NEOs
        doFilter();            // filter objects and show the tables
    } else {
        setTimeout(checkData,500);
    }
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
    
  /* for each line check for a viable object and get its magnitude */ 
    for (let i = 0; i < nLines; i++) {
        const item = lines[i];
        if (item.length < 100) continue;
        let vmag = item.slice(43,47);
        
       /* create neocp object if brighter than mag limit */
        if (!(vmag>limit)) {
            let n = new Body();
            let nm = item.slice(0,8) + "  ";
            n.id = nm.trim();
            n.score = item.slice(8,11);
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
}

/*****************************************************************************
 * Process Unusuals data, create Body objects.
 * @param {string} unusuals is text of download Unusuals list.
 */
function doUnusuals(unusuals) {
   /* split data to lines */
    neos = [];
    let lines = unusuals.split("\n");
    let nLines = lines.length;
    let count = 0;
    
   /* look for lines with characteristic html containing an object */
    for (let i = 0; i < nLines; i++) {
        let tkn = lines[i];
        if (tkn.startsWith("<input type=\"checkbox\" name=\"Obj\"")) {
            let k = tkn.indexOf(">");
           /* exctract the text containing object data */ 
            tkn=tkn.slice(k+1);
            let v = tkn.slice(43,47);
           /* if within mag limit, create Body */
            if (!(v>limit)) {
                n = new Body();
               /* get number ot designation as appropriate */ 
                if (tkn.startsWith("(")) {
                    n.id = tkn.slice(0,9);
                } else {
                     n.id = tkn.slice(9,19);
                }
               /* get all the other fields */
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
}

/******************************************************************************
 * Process priority data to construct Priority objects, each containing the
 * object designation and its priority code 
 * @param {type} pdata data from fetch.
 */
function doPriority(pdata) {
    let priText = pdata.split("\n");
    for (let i = 3; i<priText.length;i++) {
        priorities.push(new Priority(priText[i]));
    }
    priLoaded = true;
}

/******************************************************************************
 * Store the PCCP data as a set of text lines and flag it has arrived.
 * @param {type} pccpData data from fetch.
 */
function doPccp(pccpData) {
    pccp = pccpData;
    pccpLoaded = true;
}

/******************************************************************************
 * Assign priority codes to those NEOs that are listed by NEODyS. The object
 * designations in the Body object need to have blanks and parenthesis removed
 * to match the format in the priorities text file.
 */
function doPcodes() {
   /* get priority code for each neo */
    for (let i = 0; i < priorities.length; i++) {
        let p=priorities[i];
        for (let j = 0; j < neos.length; j++) {
            let n=neos[j].id;
            let nn = ((n.replace("(","")).replace(")","")).replace(/ /,"");
            if (p.id === nn) { 
                neos[j].priority = p.pCode;
            }
        }
    }
}

/******************************************************************************
 *  Show table of neocps. Construct the html code required to show the 
 *  list of neocps. A "*" is added to the designation if that designation also
 *  appears in the PCCP text.
 **/
function doTable1(){
   /* get pointer to table in document */
    let neocpTab = document.getElementById('tbody1');
    let tabBod = "";
   /* For each visible neocp/pccp construct row */
    for (let i = 0; i < neocps.length; i++) {
        if (neocps[i].visible === true) {
            tabBod+="<tr>";
            tabBod+="<td><input type=\"checkbox\" name=\"Obj\"></td>";
            if (pccp.includes(neocps[i].id)) {
                tabBod+="<td>* " + neocps[i].id + "</td>";
            } else {
                tabBod+="<td>" + neocps[i].id + "</td>";
            }              
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
   /* write table data into document */
    neocpTab.innerHTML = tabBod; 
}

/*******************************************************************************
 * Show table of Unusual Objects. Construct the html code required to list all
 * the visible "unusual" objects.
 **/
function doTable2() {
   /* get pointer table in document  */
    let neoTab = document.getElementById('tbody2');
    let tabBod = "";
   /* for each visible NEO, create table row html */
    for (let i = 0; i < neos.length; i++) {
        if (neos[i].visible === true) {
            tabBod+="<tr>";
            tabBod+="<td><input type=\"checkbox\" name=\"Obj\"></td>";
            tabBod+="<td>" + neos[i].id + "</td>";
            if (neos[i].priority === "") {
                tabBod+="<td> - </td>";
            } else {
                tabBod+="<td>" + [neos[i].priority] + "</td>";
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
   /* write the table in the document */ 
    neoTab.innerHTML = tabBod; 
}


/******************************************************************************
 * Query MPC Ephemeris Service for ephemeris of NEOCPs selected. A URL and 
 * query text is built and presented to the user's default browser. 
 * 
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
           // get object name and remove "* " if PCCP
           let xid = rows[i].getElementsByTagName("td")[1].innerHTML; 
           eText += "&obj=" + xid.replace("* ","");
       }
    }
    
   /* add dates, times, obs code and final fixed part to query */
    eText += "&start="+shrs;
    eText += "&obscode="+obs[ob].code;
    eText += part2; 
    
   /* open new tab with ephemeris query */ 
    window.open(eText,"_blank");
}

/******************************************************************************
 * Query MPC Ephemeris Service for ephemeris of NEO/Unsusual objects. A URL
 * and query text is constructed and presented to the user's default browser.
 **/
function doEphem2() {
   /* query url and fixed parts */
    let eText = "https://minorplanetcenter.net/cgi-bin/mpeph2.cgi?ty=e&TextArea=";
    let part2 = "&long=&lat=&alt=&raty=a&s=t&m=m&adir=S&oed=&e=-2&resoc=&tit=&bu=&ch=c&ce=f&js=f";
    let separator ="%0D%0A";
    
   /* add object ids to query */ 
    let table = document.getElementById("table2"); // pointer to table
    let rows = table.rows;                         // contents of table
    let select = document.getElementById("hours").value; // Hours adjustment
    let JDE = JD + select/24;                     // time start of ephems
    /* add object names to query */
    for (i = 1; i < (rows.length); i++) {
       let sel = rows[i].getElementsByTagName("input")[0]; 
       if (sel.checked) {
           eText += rows[i].getElementsByTagName("td")[1].innerHTML + separator;  
       }
    }
    
   /* add dates, times and obs code to query */
    eText += "&d=JD+"+JDE.toFixed(5);    // start time
    let lineCount = obs[ob].ha * 4;      // number of ephem lines
    eText += "&l="+lineCount.toFixed(0); 
    eText += "&i=30&u=m&uto=0";          // 30 minute intervals
    eText += "&c=" + obs[ob].code;       // obs code
    eText += part2;                      // add fixed part of query
    
   /* open new tab with ephemeris */ 
    window.open(eText,"_blank");
}

/***************************************************************************
 * Change Observatory button was pressed. Cycle through the observatories
 * @returns {undefined}
 **/
function doObservatory() {
   
    /* change observatory */
    ob++;
    if (ob>(obs.length-1)) {ob = 0;}
    obs[ob].setTime();
      
   /* set new title in document */
    let obname = document.getElementById("obsName");
    obname.innerHTML = "<h2>" + obs[ob].name + "</h2>";  
    
   /* Re-do filter and re-show tables */ 
    doFilter();
}

/***************************************************************************
 * Filter NEOCPs and NEOs according to user options and reproduce tables with
 * the resulting visible objects.
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
 * Decimal Formatter. Simple decimal formatter to make columns look neat.
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
   



        