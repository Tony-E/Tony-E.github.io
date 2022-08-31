/* ************************************************************************
 * Cosmos is used to generate animated diagrams showing various geometric
 * schemes used to represent the movement of planets in historical times. 
 * 
 * This script file contains the technical infrastructure of 
 * running an animation.
 */

/* Global Variables */

var display;             // object that generates the drawing
var showNames;           // show Names or not
var drawOrbits;          // draw orbits or not
var mouseDown;           // non-zero when mouse is pressed
var saveX;               // saved coordinates when mosedown inside display
var saveY;               // -"-

var running;             // true when animation is running
var lastTime;            // timestamp last time thru the show loop
var elapse = 0;          // time (ms) since start
var rate;                // run rate in radians per millisecond.

var pi2 = 2*Math.PI;     // useful value


/* Initialisation */
function init() {
    
  
    
   /* set up the screen. The screen object is defined in the cosmoutils
    * script. */
    display = new Screen();
    display.reSize();
    display.doAngles();
    
   /* set listener to resize the display when window changes */
    window.onresize = function(event) {display.reSize();};
   
   /* initial settings */
    running = true;         // animation is running
    elapse = 0;             // elapse time is zero at start
    lastTime = 0;           // no previous timestamp
    rate = pi2/100000;     // initial run rate 20 seconds per year
    drawOrbits = true;      // draw orbits and lines
    showNames = true;       // show object names
    mouseDown = 0;          // no mouse presses
    
   /* create planets. The setUpPlanets() function must be provided by the 
    * script file containing details of the diagram to be generated. It 
    * should perform all the on-time set-up actions prior to starting
    * the animation. */
    setUpPlanets();
        
   /* start animation */
    requestAnimationFrame(show);
}

/* run the animation */
 function show(timeStamp) {
   /* check if simulation is running */
    if (!running) return;
    
   /* track elapse time */ 
    elapse += (timeStamp - lastTime) * rate;
    lastTime = timeStamp;
    
   /* clear the screen and check for mouse actions */
    display.clearScreen();
    checkMouse();
   
   /* call the function that builds the image. This must be defined in
    * @returns {undefined}another script.
    */ 
   doAnimation(elapse);
   
  /* display and go to next frame */ 
   requestAnimationFrame(show);
 }
    
    
/* functions that respond to buttons */
 function stopStart() {
    running = !running;
    if (running) {
        lastTime = performance.now();  // discount time while !running
        requestAnimationFrame(show);   // start animation
    }
 } 
 function reverse() { rate = - rate;}
 function reSize() { display.reSize();}
 function names() { showNames = !showNames;}
 function msd(n) { mouseDown = n;}
 function msu() { mouseDown = 0;}
 function trails() {drawOrbits = ! drawOrbits;}
 /*
 * When mouse is pressed on some buttons, a value is stored in mouseDown until
 * the mouse is released. This value is checked during animation so that zoom,
 * speed (etc) can be modified gradually.
 */
function checkMouse() {
    switch (mouseDown) {
        case 0: break;
        case 1: display.scale *= 1.01; break;
        case 2: display.scale *= 0.99; break;
        case 3: display.tilt+=0.01; display.doAngles(); break;
        case 4: display.tilt-=0.01; display.doAngles(); break;
        case 5: display.rotate+=0.01; display.doAngles(); break;
        case 6: display.rotate-=0.01; display.doAngles(); break;
        case 7: rate *= 1.01; break;
        case 8: rate *= 0.99; break;
            
    }
}
// Mousedown innside the display area to effect drag
function mdown(event) {
    event.preventDefault();
    saveX = event.clientX;
    saveY = event.clientY;
}
function mup(event) {
    display.up+=  saveY - event.clientY; 
    display.left+= saveX - event.clientX;
    reDraw=true;
}
