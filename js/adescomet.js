

/* Pointers to the text baxes in the webpage */
var txtA;                   // text box for the input
var txtB;                   // text box for the output

/* The text in the text boxes */
var inLines;                // the ADES text from the input 
var outLines;               // the ADES text after processing

/* Line and field processing */
var thisLine;               // current observation being read
var thisLineValues;         // the field values in the current observation line
var fields;                 // the set of field names listed in the header line
var line;                   // the text line number currently being processed
var headLine;               // the line number containing the field headings
var obsLine;                // line number within the observations
var posLine;                // the RA/Dec line being processed
var magLine;                // the magnitude line being processed
var notesValue;             // the notes value of the line being processed
var values = new Array();   // the complete set of observations values

/* indexes to the various fields of interest */
var notesIdx;
var obsTimeIdx;
var magIdx;
var rmsMagIdx;
var bandIdx;
var photCatIdx;
var photApIdx;


/**
 * Main entry point and overall control.
 */
function doConvert() {
    
   /* initialise */
    outLines = "";
    
   /* get the contents of the input textbox and split it into lines */ 
    txtA = document.getElementById("myText");
    inLines= txtA.value.split("\n");
    
   /* copy input lines up to and including the header. */
    for (line = 0; line<inLines.length; line++) {
        outLines+= inLines[line] + "\n";
        if (inLines[line].startsWith("permID")) { 
            headLine = line;
            break;
        } 
    }
    
   /* extract the field list and set indexes to interesting fields */
    fields = inLines[line].split("|");
    notesIdx =   getFieldIndex("notes");
    obsTimeIdx = getFieldIndex("obsTime");
    magIdx =     getFieldIndex("mag");
    rmsMagIdx =  getFieldIndex("rmsMag"); 
    bandIdx =    getFieldIndex("band");
    photCatIdx = getFieldIndex("photCat");
    photApIdx =  getFieldIndex("photAp");
    
   /* read the observation lines into an array of values */ 
    obsLine = 0;
    for (line = headLine+1; line<inLines.length; line++) {
       if (thisLine !== "") {
           thisLine = inLines[line];
           thisLineValues = thisLine.split("|");
           values[obsLine] = thisLineValues;
           obsLine++;
       }
    }   
    
    
   /* for each line, if it's a RA/Dec line... */
    for (posLine = 0; posLine < obsLine-1; posLine++) {
         notesValue = values[posLine][notesIdx].toString().trim();
         if (notesValue === "" || notesValue === "K") {
             
            /* ...search for corresponding photo line... */
             for (magLine = 0; magLine < obsLine-1; magLine++) {
                 if ((values[posLine][obsTimeIdx] === values[magLine][obsTimeIdx]) 
                         && (values[posLine][notesIdx] !== values[magLine][notesIdx])) {
            
                    /* ...replace the phot fields in the obs line and publish it */
                     values[posLine][magIdx] = values[magLine][magIdx];
                     values[posLine][rmsMagIdx] = values[magLine][rmsMagIdx];
                     values[posLine][bandIdx] = values[magLine][bandIdx];
                     values[posLine][photCatIdx] = values[magLine][photCatIdx];
                     values[posLine][photApIdx] = values[magLine][photApIdx];
                     magLine = magLine + 0;
                     append(values[posLine]);
                     break;
                }  
             }
         }
     }
    
    
   /* display the results and put them on the clipboard */ 
    
    txtB = document.getElementById("yourText");
    txtB.value = outLines;
    txtB.select();
    document.execCommand("copy");
    txtB.selectionStart = 0;
    txtB.selectionEnd = 0;
    }    
/**
 * Get the index of the specified field.
 * @param {type} fieldName Name of the field.
 * @returns {fields|Number} Index of the field.
 */
function getFieldIndex(fieldName) {
        var f;
        for (f in fields) {
            if (fields[f].includes(fieldName)) {return f;}
        }
        return 0;
    }
/**
 * Add an observation to the output text.
 * @param {type} data An array of field values for an observation line.
 */
function append(data) {
    var txt;
    for (field = 0; field < data.length; field++) {
       txt = data[field].toString();
       if (txt !== "") {outLines+= txt + "|";}
    }
    outLines += "\n";
}
 

