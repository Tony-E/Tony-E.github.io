/* ************************************************************************
 * Cosmos is a web application to display models of the Solar System as
 * envisaged by ancient philosophers such as Ptolemy and Copernicus.  
 * 
 * This script file contains the technical infrastructure required for the 
 * running of an animation of the models.
 */

/* Global Variables */

var display;                   // object that generates the drawing
var mouseDown;                 // non-zero when mouse is pressed
var saveX;                     // saved X coordinate when mousedown inside display
var saveY;                     // saved Y coordinate when mousedown inside display
var running;                   // true when animation is running
var lastTime;                  // timestamp at previous time thru the animation
var elapse = 0;                // time (julian days) since start
var rate;                      // run rate in days per millisecond.
var JDEpoch = 1448637.91687527;     // Ptolemy's Epoch date (-747 Feb 26 Noon)

var pi2 = 2*Math.PI;      // useful value


/* Initialisation creates required objects and sets initial values then
 * starts the animation by calling for an AnimationFrame.
 * 
 * @param {number} n the planet number to be displayed:
 * 
 * Ptolemy Planets
 * 0 Earth (Earth, Water, Air & Fire)
 * 1 Mercury
 * 2 Venus
 * 3 Sun
 * 4 Moon
 * 5 Mars
 * 6 Jupiter
 * 7 Saturn
 * 
 * Copernicus Planets
 * 11 Tusi Couple
 */
function init(n) {
    
   /* set up the screen. (The screen object is defined in script cosmoutils.js)*/
    display = new Screen();   // create the screen object
    display.reSize();         // size to current window
    display.doAngles();       // pre-calculte some trig values
    
   /* set listener to resize the display when window changes */
    window.onresize = function(event) {display.reSize();};
   
   /* initial settings */
    running = true;           // animation is running
    elapse = 0;               // elapse time is zero at start
    lastTime = 0;             // no previous timestamp
    rate = 0.01;              // default run rate 100ms "elapse" per day
    drawOrbits = true;        // draw orbits and lines in the display
    showNames = true;         // show object names in the display
    mouseDown = 0;            // no mouse presses yet
    
   /* create planets. The setUpPlanets() function must be provided by another 
    * script file containing details of the diagram to be generated. It 
    * should perform all the one-time set-up actions prior to starting
    * the animation. */
    setUpPlanets(n);
        
   /* start animation. When a frame is ready, execute the show() function. */
    requestAnimationFrame(show);
}

/**
 *  Run the animation.  
 *  @param {number} timeStamp is the current system time in milliseconds and is
 *                  system-generated.  */
 function show(timeStamp) {
   
   /* if running, calc elapse since last time through.*/ 
    if (running) {elapse += (timeStamp - lastTime) * rate;}
    lastTime = timeStamp;
    
   /* clear the screen ready to build new diagram */
    display.clearScreen();
    
   /* check if user has pressed mouse in display area */
    checkMouse();
   
   /* used for testing, freezes the animation at some significant date */ 
   //elapse = 321780.375000;             // Mars calibration obs 70
   //elapse = 322339.2236133;            // Jupiter callibration 136 Sep 2
   // elapse = 321823.3511825;           // Mercury calibration
   //elapse = 318891.395833;             // Saturn calibration            
   // elapse = 323228.7810412;            // Moon clibration
   // elapse = 321411.7604166;            // Venus calibration
   //elapse = 0;                         // Freeze at epoch
   //elapse = 320901.083333333;          // Sun calibration 132SD Sep 25 14:00 LT
   //elapse = 323228.78146973;           // Sun & Moon on 139 Feb 7 6:45
   //elapse = 133605.24;                 // lunar eclipse in 382BC
   //elapse = -5735.09084667;            // Assyrian eclipse in 763 BCE

   
   /* call the function that draws the image. doAnimation(elapse) must be 
    * defined in the javascript file for the object to be displayed.
    */ 
   doAnimation(elapse);
   
  /* display and go to next frame */ 
   requestAnimationFrame(show);
 }
    
/* functions that respond to buttons */
 function stopStart() {
   /* toggle running/notrunning and change symbol on button */ 
    let button = document.getElementById("stopStart");
    running = !running;
    if (running) {
        button.textContent = "\u25A0";
        requestAnimationFrame(show);            // re-start animation
    } else {button.textContent = "\u25B6"; }
 } 
 function reverse() { rate = - rate;}           // reverse direction
 function reSize() { display.reSize();}         // resize display window
 function names() { showNames = !showNames;}    // toggle display of  names
 function msd(n) { mouseDown = n;}              // mouse was pressed
 function msu() { mouseDown = 0;}               // mouse released 
 function trails() {drawOrbits = ! drawOrbits;} // toggle showing orbits

/*
 * When mouse is pressed on some buttons, a value is stored in mouseDown until
 * the mouse is released. This value is checked during animation so that zoom,
 * speed (etc) can be modified gradually. "rate" is not modified when the
 * animation is not "running".
 */
function checkMouse() {
    switch (mouseDown) {
        case 0: break;
        case 1: display.scale *= 1.01; break;                    // zoom+
        case 2: display.scale *= 0.99; break;                    // zoom-
        case 3: display.tilt+=0.005; display.doAngles(); break;  // tilt up
        case 4: display.tilt-=0.005; display.doAngles(); break;  // tilt down
        case 5: display.rotate+=0.01; display.doAngles(); break; // rotate+
        case 6: display.rotate-=0.01; display.doAngles(); break; // rotate-
        case 7: if (running) {rate *= 1.01;}                     // faster
                break;           
        case 8: if (running) {rate *= 0.99;}                     // slower
                break;
    }
}
// Mousedown inside the display area to effect drag, save to coords
function mdown(event) {
    event.preventDefault();
    saveX = event.clientX;
    saveY = event.clientY;
}
// Mouseup inside the display shift relative to saved coordinats
function mup(event) {
    display.up+=  saveY - event.clientY; 
    display.left+= saveX - event.clientX;
    reDraw=true;
}
