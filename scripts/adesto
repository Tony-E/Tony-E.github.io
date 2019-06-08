

/* Working variables. */

var txtA;               // text box for the input
var txtB;               // text box for the output
var txt80;              // the resulting observations
var fields;             // the set of field names listed in the header line
var field;              // the name of the field currently being processed 
var thisField;          // the value of the field currently being processed
var lines;              // the lines of ADES text from the text box 
var headFound;          // set true when the header line has been process
var hml;                // half month letter if any
var nn;                 // pointer to start of numeric part of designation

 /* string used to convert designations to compressed form */
 
var alpha = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz   ";
 
/* Pro forma for the 80-col observation */ 

var number;
var desig;
var discovery = " ";
note1 = "K";
note2 = "C";
var obsDate;
var ra;
var dec;
var blank1 = "          ";
var mag;
var band;
var blank2 = "      ";
var obs;
var obs;
var net;

/********
 * Main entry point and overall control.
 */

function doConvert() {
   /* initialise */
   
    txt80="NET \n";
    headFound = false;
    
   /* get the contents of the textbox and split it into lines */
   
    txtA = document.getElementById("myText");
    lines= txtA.value.split("\n");
    
   /* scan the input lines and... */
   
    for (line =0; line<lines.length; line++) {
        
       /* save the field names from the heading line */ 
        if (lines[line].startsWith("permID")) {
            fields = lines[line].split("|");
            headFound = true;
            
       /* convert the observation lines */
        } else {
            if (headFound) {doTranslate(line);}
        } 
    }
    
  /* set the textarea to show the original and converted observations. */ 
   txtB = document.getElementById("yourText");
   txtB.value = txt80;
   txtB.select();
   document.execCommand("copy");
}
    
/*****
 * Converts line numer l of the input text into an 80-col observation.
 * @param  l  Line number.
 */
function doTranslate(l) {
    
  /* split the line into a list of values */
  
   fValues = lines[l].split("|");
   if (fValues.length<10) {return;}
   
  /* process each value according to its field name. */
  
   for (f=0; f<fValues.length; f++) {
       thisField = fields[f].toString().trim();
       thisValue = fValues[f].toString().trim();
       vLength = thisValue.length;
       
       switch (thisField) {
           case "permID":
                if (vLength === 0) {number = "     ";} else {packNumber(thisValue);}
                break;
           case "provID":
                if (vLength === 0) {desig = "       ";} else {packDesig(thisValue);}
                break;
           case "trkSub":
                if (vLength !== 0) {
                    var temp = thisValue+"       ";
                    desig = temp.substring(0,7);
                }
                break;
           case "stn":
                obs = thisValue;
                break;
           case "obsTime":
                packDate(thisValue);
                break; 
            case "ra":
                packRa(thisValue);
                break;
            case "dec":
                packDec(thisValue);
                break;
            case "band":
                band = thisValue;
                break;
            case "mag":
                mag = thisValue;
                break;
            case "notes":
                note2 = "C";
                if (vLength === 0) {note1 = " ";} else {note1 = thisValue.substring(0,1);}
               
        }
   }
   makeObservation();
}

function packNumber(t) {
        var nonly;
       /* if its a comet ... */ 
        if (t.endsWith("P")) {
            nonly = t.substring(0,t.indexOf("P"));
            number = decimalFormat(nonly,4,0) + "P";
        } else {
       /* else if its an asteroid... */
          /* if over 5-digits replace first two with one alpha else just format the numver. */
           if (t>99999) {
               var n1=t%10000;
               var n2=t/10000;
               number = alpha.substring(n2,n2+1) + decimalFormat(n1,4,0);
            } else {
               number  = t;
            }
        }
}

function packDesig(t) {
   /* prov will contain only the year, month, sequence information */ 
    var prov;
    
   /* set up comet related codes and strip off any C/ etc */
    switch (t.substring(0,2)) {
        case "C/":
            number = "    C";
            prov = t.substring(2);
            break;
        case "P/":
            number = "    P";
            prov = t.substring(2);
            break;
        case "A/":
            number = "    A";
            prov = t.substring(2);
            break;
        default:
            prov = t;
    }
    
    
    /* set first character J or K depending on century */
        switch (prov.substring(0,2)) {
            case "19":
                desig = "J";
                break;
            case "20":
                desig = "K";
                break;
         
            /* return error if no valid century found */
            default:
                desig = "Error  ";
                return;
        }
        
       /* set next two characters according to year in century */       
        desig+= prov.substring(2,4);

       /* set first half-month character */
        desig+= prov.substring(5,6);
        
       /* see if we have a half-month letter */
        if (prov.substring(6,7) > "9") {
            hml = prov.substring(6,7);
            nn = 7;
        } else {
            hml = "0";
            nn = 6;
        }

      /* test if there is any number and pack it, else set to 00 */
       if (prov.length > nn) {
            num = prov.substring(nn).toString().trim();
            r1 = num%10;
            r2 = num/10;
            desig+= alpha.substring(r2,r2+1) + alpha.substring(r1,r1+1);
       } else {
           desig+= "00";
       }
    
       /* set second half-month character */
        desig+= hml;
       
    }
   

 function packDate(t) {
        
        d = Number(t.substring(8,10));
        d+= Number(t.substring(11,13)) / Number(24);
        d+= Number(t.substring(14,16)) / Number(1440);
        d+= Number(t.substring(17,19)) / Number(86400);
        obsDate = t.substring(0,4) + " " + t.substring(5,7) + " ";
        obsDate+= decimalFormat(d,2,5);
        }   
   
function packRa(t) {
        num = Number(t);
        num /= 15;
        hh = Math.floor(num);
        num = (num-hh)*60;
        mm = Math.floor(num);
        ss = (num-mm)*60;
        ra = decimalFormat(hh,2,0) + " " + decimalFormat(mm,2,0) + " " + decimalFormat(ss,2,2);
    }
    
function packDec(t){
        num = Number(t.substring(1));
        dd = Math.floor(num);
        num = (num-dd)*60;
        mm = Math.floor(num);
        ss = (num-mm)*60;
        dec = t.substring(0,1) + decimalFormat(dd,2,0) + " " + decimalFormat(mm,2,0) + " " + decimalFormat(ss,2,1);
    } 

function decimalFormat(value, pre, post) {
   num = Number(value).toFixed(post).toString();
   if (post>0) {
       pad = pre+post+1-num.length;
   } else {
       pad = pre-num.length;
   }
     return "0".repeat(pad) + num; 
    
}

function makeObservation() {
    txt80+=number+desig+discovery+note1+note2+obsDate+" "+ra+" "+dec+blank1+mag+" "+band+blank2+obs+"\n";
}
