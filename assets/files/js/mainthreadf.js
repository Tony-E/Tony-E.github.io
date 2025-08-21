/****************************************************************************************
 * This is the main thread of the NEOFixer version of the Candiweb program.
 *  It reads the suggested NEOCP, PCCP and NEO target data provided by 
 *  the NEOFixer site for each of the Slooh sites and presents the data in a 
 *  simple format for A-Team members.
 * 
 * Checkboxes are used to select objects and request ephemeris from the MPC.
 * 
 * Author: Tony Evans 2022-2025
 */

/* Global variables */
 var limit = 21.0;              // max mag for downloaded objects
 var comments;               // text area for display of messages
 
/* Useful constants */ 
 var toRadians = Math.PI/180;
 var pi2 = Math.PI/2.0;

/* Values and objects */
 var sun;          // the Sun object
 var now;         // current date
 var JD;           // current Julian Day
 var obs = [];   // array of observatories
 var ob;           // index to currently selected observatory in obs[]
 var filter;        // filter object 
 
/* Completion flag */ 
 var fixerLoaded = 0;       // number of neofixer files received.
 
/*****************************************************************************************
 * Function called on page load initiates main thread.
 **/
function init() {
       
   /* get pointer to the comments textarea in the webpage */
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
    
   /* create a Filter and set values from  a cookie (if enabled) */
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
 * Initiate the fetching of data, for each observatory, from NEOFixer.
 */
function doFetch() {

   /* set up URL for neoFixer API */
    let fixerurl = "https://neofixerapi.arizona.edu/targets/?";
    let fixerQuery ="&num=30&vmag-faint=" + limit;
    for (let ob= 0; ob<obs.length; ob++) {
        obs[ob].url = fixerurl + "site=" + obs[ob].code + fixerQuery;    
    }
      
   /* initiate downloads (using ajax) and call processors when data arrives.*/
    for (let ob= 0; ob<obs.length; ob++) {
        $.get(obs[ob].url,function(data){doFixer(data,ob);});
    }
    
   /* The downloads have been initiated and processing functions will be
    * invoked when each download is complete. Now we wait for all the downloads
    * and processing to complete before populating the tables.  */
    setTimeout(checkData, 2000);                       
}

/******************************************************************************
 * Wait for data to arrive, then create display table.
 */
function checkData() {
   /* if files have arrived and been processed continue, otherwise wait */
    if (fixerLoaded < obs.length) {  
            setTimeout(checkData,500);
        }  else {
            doShowTargets();
        }
    }
    
/***************************************************************************
 * All the data has been imported. Filter and display the relevant objects. 
 */
function doShowTargets() {
     filter.setFilter();                // set up the filter values
     obs[ob].filterTargets();    // filter targets
     doTable();                        // produce table display
}

/***************************************************************************
 * Process data from neoFIXER. Creat a Body for each object listed.
 * @param {string} fixerData JSON object returned from neofixer.
 * @param {number} site Index number of observatory in obs array.
 */
function doFixer(fixerData,site) {
    let n = fixerData.result.num;                           // count objects returned
    const objects = fixerData.result.objects;      
    
   /* extract required fields from each object */
    for (const id in objects) {
            const obj = objects[id];                     // get the next JSON Object
            let target = new Body();                  // create a Body
            target.id = obj.packed;                     // use packed, provisional or
            target.provisional = obj.provisional;    //   number as the identifyer
            target.number = obj.number;
                if (!(target.provisional === null)) {target.id = target.provisional;}
                if (!(target.number === null)) {target.id = target.number;}
            target.ra = obj.ra;
            if (obj.neocp) {target.neocp="Y";} else {target.neocp = "-";}
            target.dec = obj.dec;
            target.v = obj.vmag;
            target.h = obj.h;
            target.u = obj.u;
            target.score = obj.score;
            target.priority = obj.priority;
            target.risk = obj.impact;
            target.lastob = obj["obs last"];
            target.motion = obj.rate;
            obs[site].targets.push(target);
    }
    fixerLoaded++;    // one more file loaded
}

/*******************************************************************************
 * Construct the html code required to list target objects.
 **/
function doTable() {
    
   /* get pointer to table body in the webpage  */
    let neoTab = document.getElementById('tbody');
    let tabBod = "";
    
   /* for each target for the current observatory, create table row html */
    for (let i = 0; i < obs[ob].targets.length; i++) {
        let b = obs[ob].targets[i];             // get the next body
        if (b.show) {                                 // if it has passed the filer..
            // create row
                 tabBod+="<tr>";                 // create a table row
            // create checkbox for selection
                 tabBod+="<td><input type=\"checkbox\" name=\"Obj\"></td>";  
            // create rest of the fields
                 tabBod+="<td>"+b.neocp+"</td>";
                 tabBod+="<td>" + b.id + "</td>";
                 tabBod+="<td>" + b.priority + "</td>";
                 tabBod+="<td>" + b.v + "</td>";
                 tabBod+="<td>" + b.motion + "</td>";
                 tabBod+="<td>" + b.score + "</td>";
                 tabBod+="<td>" + b.u + "</td>";
                 tabBod+="<td>" + b.ra + "</td>";
                 tabBod+="<td>" + b.dec + "</td>";
                 tabBod+="<td>" + b.lastob + "</td>";
        }
    }
   /* write the table into the document */ 
    neoTab.innerHTML = tabBod; 
}


/******************************************************************************
 * Query MPC Ephemeris Service for ephemeris of NEOCPs selected. A URL and 
 * query text is built and presented to the user's default browser. 
 * 
 **/
function doEphem1() {
    
   /* set up query url and fixed parts */ 
     let eText = "http://cgi.minorplanetcenter.net/cgi-bin/confirmeph2.cgi";
     eText += "?mb=-30&mf=30&dl=-90&du=%2B90&nl=0&nu=100&sort=d&W=j";
     let part2 = "&Parallax=1&long=&lat=&alt=&int=1&raty=a&mot=m&dmot=p&out=f&sun=x&oalt=20";
   
   /* get table rows and add object id for those selected */ 
    let table = document.getElementById("table1");      // pointer to table
    let rows = table.rows;                                               // contents of table
    let shrs = document.getElementById("hours").value;   // Hours adjustment
    for (i = 1; i <rows.length; i++) {
         let sel = rows[i].getElementsByTagName("input")[0]; 
         let ncp= rows[i].cells[1].innerHTML;
         if (sel.checked && ncp === "Y") {
             let xid = rows[i].cells[2].innerHTML; 
             eText += "&obj=" + xid;
       }
    }
   /* add dates, times, obs code and final fixed part to query */
     eText += "&start="+shrs;
     eText += "&obscode="+obs[ob].code;
     eText += part2; 
     
   /* open browser window to show MPC ephemeris */ 
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
    let table = document.getElementById("table1"); // pointer to table
    let rows = table.rows;                                        // contents of table
    let select = document.getElementById("hours").value; // Hours adjustment
    let JDE = JD + select/24;                                 // time start of ephems
    /* add object names to query */
    for (i = 1; i < (rows.length); i++) {
        let sel = rows[i].getElementsByTagName("input")[0]; 
        let ncp= rows[i].cells[1].innerHTML;
        if (sel.checked && ncp === "-") {
            let xid = rows[i].cells[2].innerHTML.replace(" ","%20");
            eText += xid + separator;  
       }
    }
    
   /* add dates, times and obs code to query */
    eText += "&d=JD+"+JDE.toFixed(5);        // start time
    let lineCount = obs[ob].ha * 4;                    // number of ephem lines
    eText += "&l="+lineCount.toFixed(0); 
    eText += "&i=30&u=m&uto=0";                  // 30 minute intervals
    eText += "&c=" + obs[ob].code;                // obs code
    eText += part2;                                   // add fixed part of query
    
   /* open new window tab with ephemeris */ 
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
    doShowTargets();
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
   



        