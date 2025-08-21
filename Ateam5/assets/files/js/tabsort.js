/*******************************************************************************
 * Table sort function adapted from examples in W3schools.Strategy is to scan
 * rows, compare this row to next row and swap if not in correct sequence. 
 * Continue this until complete scan causes no swaps. Initially sort ascending
 * but if no swaps needed (i.e. already ascending) then sort descending.
 * 
 * @param {type} col column number to sort
 * @param {type} tab table number
 * @param {type} chr 0=numeric, 1=alphabetic
 * @returns {undefined} void
 */
function tabsort(col, tab, chr) { 
    var table, rows, switching, i, x, y;      // working variables and flags
    var dir, switchcount = 0, comp, shouldSwitch;
    let tabName = "table" + tab;              // id of table
    table = document.getElementById(tabName); // pointer to table
    switching = true;                         // sort in progress
    dir = ">";                                // ascending to start
  
/* Repeated scan of table as long a 'switching' is true. */
  while (switching) { 
    switching = false;     // flag, gets put true again if swap done
    rows = table.rows;     // get array of rows as they currently are
 
 
    for (i = 1; i < (rows.length - 1); i++) {     //for each rows except header
        shouldSwitch = false;  //initially assume no switch needed                   
        x = rows[i].getElementsByTagName("TD")[col];     // get data this row
        y = rows[i + 1].getElementsByTagName("TD")[col]; // and next row
      
       /* compare x and y depending on asc or desc, num or alpha */
        if (chr === 0)  {comp = eval("Number(x.innerHTML)" + dir + "Number(y.innerHTML)");}
                   else {comp = eval("x.innerHTML.toLowerCase()" + dir + "y.innerHTML.toLowerCase()");} 
       /* set switch if a swap is needed and quit the scan */            
        if (comp) {
            shouldSwitch = true;
             break;
        }  
    }
    
    /* At end of scan, if switch needed, do it and record switch done */
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount ++;
    } else {
      /* If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again. */
      if (switchcount === 0 && dir === ">") {
        dir = "<";
        switching = true; 
      }
    }
  }
}


