/******************************************************************************
 * 
 * The purpose of this script is to fetch a page from the MPC NEOCP records
 * and to extract the observations in obs80 format ready for input to
 * Find_Orb.
 * 
 * Author: Tony Evans July 2019
 */

/* Working variables. */

var neocpid;    // id of object provided by the user
var query;      // query string to send to MPC
var xhr;        // http conection
var neocpdata;  // raw html data returned from the MPC 
var outlines;   // results in obs80 format
var mpclines;   // raw data for dislply
var x;          // pointer to next segment of observation text 
var y;          // pointer to end of observation text segment
var txta;       // web page text area for display of raw html
var txtb;       // web page text area for displa of obs80 data
 


/********
 * Main entry point
 */

function doFetch() {
  /* get the neocp identity and format a query */
   
  neocpid = document.getElementById("neocp").value;
  query = "https://minorplanetcenter.net/cgi-bin/cgipy/dblog?desig="+ neocpid;
  txta = document.getElementById("myText");
  
  /* open a connection */
  xhr = new XMLHttpRequest();
  xhr.open("GET", query);
  xhr.responseType = "text";
  
  /* specify what to do when response is received */
  xhr.onload = function () {
       neocpdata = this.response.toString();
       doConvert();
  };
   
  /* send the query */
  xhr.send();
  txta.value = "Query sent to the MPC, please wait.";
  
}

function doConvert() {
    /* prepare the output textareas and indexes */
    outlines="";
    mpclines="";
    txta = document.getElementById("myText");
    y=0;
    
    /* show the raw results and message if not a full response */
    txta.value = neocpdata;
    if (neocpdata.length < 120) {
        outlines = "NEOCP Not Found";
    }
   
   /* scan the data to extract observations out of the html text */
    while (true) {
        x=neocpdata.indexOf("neocp_obs", y);
        if (x===-1) break;
        x=neocpdata.indexOf("</a>",x);
        if (x===-1) break;
        y=x+82;
        outlines+=neocpdata.slice(x+5,y);
        x=neocpdata.indexOf("</a>", y);
        if (x===-1) break;
        outlines+=neocpdata.slice(x-3, x) + "\n";
        y=x;
        
    }
    
    /* show the results and put them in the clipboard */
    txtb = document.getElementById("yourText");
    txtb.value = outlines;
    txtb.select();
    document.execCommand("copy");
}            
         
