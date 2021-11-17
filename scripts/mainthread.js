
/* global fetch */

/*******************************************************************************
 * 
 * This is the main thred of the Candiweb program. It reads the requested data,
 * stores the relevant data in noeObjects or neocpObjects, then writes a table 
 * into the document. 
 * 
 * 
 * Author: Tony Evans November 2021
 */
var neocpdata;  // blob text form of the contents of the NEOCP from the MPC.
var comments;   // text area for display of messages.
var neocpurl = "https://minorplanetcenter.net/iau/NEO/neocp.txt";
var unusualsList ="https://minorplanetcenter.net/iau/lists/LastUnusual.html";
var priorityurl = "https://neo.ssa.esa.int/PSDB-portlet/download?file=esa_priority_neo_list";

//var neocpurl = "neocp.txt"; 
//var unusualsList = "unusuals.txt";
//var priorityurl = "priority.txt";
var pi2 = Math.PI/2.0;

var neocps = [];
var neos = [];
var priorities = [];

var toRadians = Math.PI/180;
var sun;
var now;
var JD;
var comments;
var obs;
var filter; 
var neocpLoaded, neoLoaded, priorityLoaded;

/* Function called on page load */
function init() {
    /* none of the files have been loaded */
    neocpLoaded = false;
    neoLoaded = false;
    priorityLoaded = false;
    
    comments = document.getElementById("comments");
    now = new Date();
    JD = (now/86400000) - (now.getTimezoneOffset()/1440) + 2440587.5;
    
    sun = new Sun();          
    sun.setPosition(JD);
    
    obs = new Observatory(-70.5,-33.27);
    obs.setTimes();
    
    filter = new Filter();
    filter.setFilter();
    
    comments.value += "Timenow " + now.toString() + "\n";
    let ra = sun.raDec.x / (15*toRadians);
    let dec= sun.raDec.y / toRadians;
    comments.value += "RA/Decl: "+ ra+ " hours "+ dec + " degrees.\n";
    
}
/*****************************************************************************
 * Fetch the MPC files data and call processing functions.
 */
function doFetch() {
  /* load the various files required ( in parallel) */
  comments.value = "Fetching NEOCP/PCCS data.\n";
 $.get(neocpurl,function(data){doNeocp(data);});
 $.get(unusualsList,function(data){doUnusuals(data);});
 $.get(priorityurl,function(data){doPriority(data);});
 setTimeout(doMerge,50);
}
  




/****************************************************************************
 * Process NEOCP data, create neocp objects and show neocp table.
 * @param {string} neocpData is text of download neocp.
 */
function doNeocp(neocpData) {
    neocps = [];
    comments.value += "neocp data downloaded.\n";
    let lines = neocpData.split("\n");
    let nLines = lines.length;
    comments.value += (nLines + " NEOCPs downloaded. \n");
    let count = 0;
    for (let i = 0; i < nLines; i++) {
        const item = lines[i];
        if (item.length < 100) continue;
        let vmag = item.slice(43,47);
        let limit = 20.5;
        /* create neocp objects if brighter than mag 20 */
        if (!(vmag>limit)) {
            let n = new Body();
            n.id = item.slice(0,8);
            n.score = item.slice(8,12);
            n.obs = item.slice(79,82) + " obs in arc " + item.slice(84,89) + "°";
            n.coord.x =  item.slice(26,33) * toRadians;
            n.coord.y = item.slice(34,42) * toRadians;
            n.updated = item.slice(48,70);
            n.v = vmag;
            n.h = item.slice(90,94);
            n.type = "neocp";
            neocps.push(n); 
            count++;
        }
    }
    comments.value += (count + " NEOCPs added. \n");
    neocpLoaded = true;
}
/* Call vbisibility checks on all boodies */
function doFilter() {
    filter.setFilter();
    for (let i = 0; i < neocps.length; i++) {
        neocps[i].checkVisible();}
    for (let i = 0; i < neos.length; i++) {
        neos[i].checkVisible();}
}
/* generate table of neocps */
function doTable1() {
    /*Create table headers*/
    let neocpTab = document.getElementById('tbody1');
    let tabBod = "";
    for (let i = 0; i < neocps.length; i++) {
        if (neocps[i].visible === true) {
            tabBod+="<tr>";
            tabBod+="<td>" + neocps[i].id + "</td>";
            tabBod+="<td>" + neocps[i].v + "</td>";
            tabBod+="<td>" + neocps[i].coord.x.toFixed(5) + "</td>";
            tabBod+="<td>" + neocps[i].coord.y.toFixed(5) + "</td>";
            tabBod+="<td>" + neocps[i].score + "</td>";
            tabBod+="<td>" + neocps[i].updated + "</td>";
            tabBod+="<td>" + neocps[i].visible + "</td></tr>";
        }
    }
    neocpTab.innerHTML = tabBod; 
}

/*****************************************************************************
 * Process unusuals list for possible targets.
 * @param {type} unusuals
 */
function doUnusuals(unusuals) {
    neos = [];
    let lines = unusuals.split("\n");
    let nLines = lines.length;
    comments.value += (nLines + " Lines in Unusuals Page. \n");
    let count = 0;
    for (let i = 0; i < nLines; i++) {
        let tkn = lines[i];
        if (tkn.startsWith("<input type=\"checkbox\" name=\"Obj\"")) {
            let k = tkn.indexOf(">");
            tkn=tkn.slice(k+1);
            /* get V mag */
            let v = tkn.slice(43,47);
            /* if within mag limit, get name and candidate */
            if (!(v>filter.magLimit)) {
                n = new Body();
                n.id = tkn.slice(9,19).trim();
                n.v = v;
                n.updated = tkn.slice(60,72);
                n.visible = true;
                n.type = tkn.slice(29,31);
                n.coord.x = tkn.slice(34,37) * 15 * toRadians;
                n.coord.y = tkn.slice(39,41) * toRadians;
                n.motion = tkn.slice(52,56);
                n.score = tkn.charAt(87);
                neos.push(n);
                count++;
                }
            }
        }
        comments.value+= count + " objects added.\n";
        neoLoaded = true;
        
    }
    /* geneate table of neos  */
    function doTable2() {
    /*Create table headers*/
    let neoTab = document.getElementById('tbody2');
    let tabBod = "";
    for (let i = 0; i < neos.length; i++) {
        if (neos[i].visible === true) {
            tabBod+="<tr>";
            tabBod+="<td>" + neos[i].id + "</td>";
            tabBod+="<td>" + neos[i].priority + "</td>";
            tabBod+="<td>" + neos[i].v + "</td>";
            tabBod+="<td>" + ((neos[i].coord.x)/(toRadians * 15)).toFixed(1) + "</td>";
            tabBod+="<td>" + (neos[i].coord.y/toRadians).toFixed(0) + "</td>";
            tabBod+="<td>" + neos[i].score + "</td>";
            tabBod+="<td>" + neos[i].updated + "</td>";
            tabBod+="<td>" + neos[i].visible + "</td></tr>";
        }
    }
    neoTab.innerHTML = tabBod; 
}
/* Process priority list */
function doPriority(plist) {
    priorities = [];
    let lines = plist.split("\n");
    let nLines = lines.length;
    comments.value += (nLines + " Lines in Priority List. \n");
    let count = 0;
    for (let i = 4; i < nLines; i++) {
        let tkn = lines[i];
        if  (tkn.length < 40) continue;
        /* get V mag and process object only if not beyond limit */
        let vmag = tkn.slice(100,104);
        if (!(vmag>20.5)) {
                let n = new Body();
                let id = tkn.slice(0,4);
                id += " ";
                id += tkn.slice(4,8);
                n.id = id.trim();
                n.v = vmag;
                let updated = (tkn.slice(14,23));
                n.updated = updated.trim();
                if (tkn.slice(54,56) === "Yes") n.pha = true;
                n.ra = (tkn.slice(81,82) * 15 + tkn.slice(86,87) * 0.25) * toRadians;
                n.dec = ((tkn.slice(90,91)) + tkn.slice(95,96)/60) * toRadians;
                if (tkn.charAt(89) === "-") n.dec= -n.dec;
                priorities.push(n);
            }
    }
    priorityLoaded = true;
}
/* test if all the files have been loaded */
function allLoaded() {
    if (neocpLoaded && neoLoaded && priorityLoaded)
    {return true;} else {return false;}
}

/* Merge adds priority-related data to the list of neos */
function doMerge() {
    // wait until all the files are loaded
    let done = allLoaded();
    comments.value+= done + " Ready to merge. \n";
    
    if (!done){setTimeout(doMerge,500); } else {
    // merge neo and priority data into neos.
    for (let i = 0; i < priorities.length; i++) { 
          for (let j = 0; j < neos.length; j++) {
              if (priorities[i].id === neos[j].id) {
                  neos[j].priority = priorities[i].updated;
              }
          }
     } 
     
    /* filter objects visible and produce tables */
    doFilter();
    doTable1();
    doTable2();
    }
}


        




