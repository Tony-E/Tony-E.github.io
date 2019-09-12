/***************************************************************************************************
 *                             Global Variables
 *
 */
//"use strict";
// TODO put follow and focus objects into parms rather than body numbers
// global variables and objects
var bodies;    // array of bodies in the system
var parms;     // parameter set controlling the behaviour of the integrator
var scrn;      // the display screen
var runTime;   // time simlation has been running or current simulated date
var now;       // current time (MS since 1970) at start of integration step
var then;      // time last time round the loop
var rate;      // speed of simulation i days per millisecond
var step;
var calcStep;  // integration step size
var animate;   // animation handle
var mouseevent =0;   // whic button was pressed for mousedown event
var loopTime = 30;   // number of milliseconds since last integration was done
var showType = 0;    // 0=orbits, 1=trails, 2=both, 3=neither
var running;         // integration is running
var reDraw=true;     // does the trail-display need to be re-drawn?
var displayed=false; // have the planets been drawn previously?
var pi2 = 2*Math.PI; 
// Yoshida 6th order integration steps
var YO6 = [0.784513610477560E0, 0.235573213359357E0, -1.17767998417887E0, 1.31518632068391E0];


function nodefault(event) {
  event.preventDefault();  
   return true;
}   
   
/*********************************************************************************************
 * Function init called from the webpage reads the definition file and sets up global
 * variables containing the bodies and parameters.
 * 
 * @param {url} jdffile file containing the definition of the simulation
 */
function init(jdffile) {
   // set up global variables
 
    scrn = new Screen();                         // set up the screen (canvases)
    scrn.init();      
    bodies = [];                                 // create array of bodies
    parms = new ParameterSet();                  // create a parameter set
    runTime= new Date();                         // start time is now
    then = new Date();                           // initialise now
    
    
   // retrieve and process definition file 
    var jdftext = httpGet("../jdf/"+jdffile); // get definition file
    var jdfarray = jdftext.split(/\s+/gm);          // split into tokens 
    for (var i = 0; i < jdfarray.length; i++) {     // save parameters and body data
        var line = jdfarray[i];
        var pair = line.split(/=/);
        if (pair[0] === "vstep")    parms.vStep = Number(pair[1]); 
        if (pair[0] === "showstep") parms.showStep = Number(pair[1]);
        if (pair[0] === "fixed")    parms.fixed = true;
        if (pair[0] === "sleep")    parms.sleep = Number(pair[1]);
        if (pair[0] === "showtype") parms.showType = Number(pair[1]);
        if (pair[0] === "scale")    scrn.scale = Number(pair[1]);
        if (pair[0] === "up")       scrn.up = Number(pair[1]);
        if (pair[0] === "left")     scrn.left = Number(pair[1]);
        if (pair[0] === "tilt")     scrn.tilt = Number(pair[1]);
        if (pair[0] === "rotate")   scrn.rotate = Number(pair[1]);
        if (pair[0] === "julian") {
            parms.julian = Number(pair[1]); 
            runTime.setTime((parms.julian - 2440587.5)*86400000);
        }
        if (pair[0] === "body")   var b = bodies.push(new JingoBody());
        if (pair[0] === "name")   bodies[b - 1].name = pair[1];
        if (pair[0] === "colour") {
            bodies[b - 1].colour = "#" + pair[1];
            bodies[b - 1].dColour= shadeColor(pair[1], -20);
        }
        if (pair[0] === "mass")   bodies[b - 1].mass = Number(pair[1]);
        if (pair[0] === "size")   bodies[b - 1].size = Number(pair[1]);
        if (pair[0] === "x")      bodies[b - 1].P.x = Number(pair[1]);
        if (pair[0] === "y")      bodies[b - 1].P.y = Number(pair[1]);
        if (pair[0] === "z")      bodies[b - 1].P.z = Number(pair[1]);
        if (pair[0] === "vx")     bodies[b - 1].V.x = Number(pair[1]);
        if (pair[0] === "vy")     bodies[b - 1].V.y = Number(pair[1]);
        if (pair[0] === "vz")     bodies[b - 1].V.z = Number(pair[1]);
        if (pair[0] === "central"){
            bodies[b - 1].central = true;
            parms.centralmass = b-1;
            parms.central=true;
        }
        if (pair[0] === "noorbit") bodies[b - 1].orbit = false;
        if (pair[0] === "notrail") bodies[b - 1].trail = false;
        if (pair[0] === "aster")   bodies[b - 1].aster = true;
        if (pair[0] === "follow"){
            parms.followBody = b - 1;
            parms.follow=true;
        }
        if (pair[0] === "focus") {
            parms.focusBody = b - 1;
            parms.focus = true;
        }
    }
    
    parms.bodyCount = b;                         // save body count
    if (parms.direction < 0)  reverse();         // set direction
    rate = parms.showStep/(parms.sleep + 4);     // set initial simulation rate
    setShowType();
        
    // set all the bodies gmass and asterNames for clones 
    for (var n = 0; n < parms.bodyCount; n++) {
        bodies[n].gmass = bodies[n].mass * parms.G;
        if (bodies[n].aster) {
            if (bodies[n].name.contains("[")) {
                bodies[n].asterName = bodies[n].name.substring(0, bodies[n].name.indexOf("["));
            }
        }
    }
    
    // fix the baricentre. If relativity repeat after adjusting relativistic masses 
    fixbaric(false);
    if (parms.relativity) {
        for (var n = 0; n < parms.bodyCount; n++) {
                bodies[n].relpar = parms.centralmass.gmass / parms.vcc;
                bodies[n].relmass = bodies[n].gmass * (1.0 + bodies[n].V.sqr() / (2 * parms.vcc) - relsum(n) / (2 * parms.vcc));
            }
            fixBaric(true);          // fix relativistic barycentre
        }
  
    // Set body's nP and nV initial values equal to P and V
        for (var n = 0; n < parms.bodyCount; n++) {
            bodies[n].nP.copy(bodies[n].P);
            bodies[n].nV.copy(bodies[n].V);
        }
     
    // doEnergy();           // calculate initial energy (not implemented)
    // eStart = eTot;        // save initial energy
    
    // calculate initial accelerations and integration step   
    accelerate();                                   
    calcStep = doEncounter() / parms.vStep;
    
    //get animationframe and start integration
    running = true;
    animate = requestAnimationFrame(integrate);
}
// set up showType depending on the orbits and trails parameters
function setShowType() {
    switch (parms.showType) {
        case 0:
            parms.orbits=true; parms.trails = false;
            break;
        case 1:
            parms.orbits=false; parms.trails = true;
            break;
        case 2:
            parms.orbits=true; parms.trails = true;
            break;
        case 3:
            parms.orbits=false; parms.trails = false;
            break;      
    }
}

/*****************************************************************************************
 *                              Screen
 * 
 * This is the display screen with methods to draw planets, trails and orbits etc
 * 
 */
function Screen(){
    this.canvas1;   // The two canvas elements in the DOM
    this.canvas2; 
    this.ctx1;      // the two graphic contexts for the canvases
    this.ctx2;
    this.hi;        // height and width and scale (pixels per AU)
    this.wi;
    this.scale=50;    
    this.centx;      // centre x and y pixels
    this.centy;
    this.up=0;        // user control values up, left, tilt, rotate
    this.left=0;
    this.tilt=0;
    this.rotate=0;
    this.sinr;      // sines and cosines of rotate and tilt
    this.cosr;
    this.sint;
    this.cost;
    // working areas for transpositions
    this.W = new JingoPoint(0,0,0); 

    
    // initialise screen variables
    this.init = function () {
        this.canvas1 = document.getElementById("layer1");  
        this.ctx1 = this.canvas1.getContext("2d");                 
        this.canvas2 = document.getElementById("layer2"); 
        this.ctx2 = this.canvas2.getContext("2d"); 
        this.reSize();
    };
    // set up commonly used sines and cosines
    this.doAngles = function () {    
        this.sint = Math.sin(this.tilt);   
        this.cost = Math.cos(this.tilt);  
        this.sinr = Math.sin(this.rotate); 
        this.cosr = Math.cos(this.rotate); 
    };
    // clear the background canvas
    this.clearTrails = function () {
        this.ctx1.fillStyle = "#000000";
        this.ctx1.beginPath();
        this.ctx1.rect(0,0,this.wi,this.hi);
        this.ctx1.fill();
    };
    // scear the foreground canvas
    this.clearPlanets = function () {
        this.ctx2.clearRect(0,0,this.wi,this.hi);
    };
    // convert a 3D space coord to a 2D screen pixel coord
    this.toScreen = function (pix, space) {
        this.W.y = space.y * this.cosr - space.x * this.sinr;     // rotate
        this.W.x = space.x * this.cosr + space.y * this.sinr;
        this.W.z = space.z;  
        pix.x =  this.centx - this.left       // scale, tilt and apply up and left
                + (this.scale * this.W.x);    
        pix.y = this.centy - this.up
                +(-this.scale * (this.cost*this.W.y + this.sint*this.W.z));        
    };
    // draw a trail segment for a body
    this.drawTrail = function (bod) {
        if (bod.incl<0.07 || bod.P.z>0) {
            this.ctx1.fillStyle = bod.colour;
        }  else {
            this.ctx1.fillStyle = bod.dColour;
        }
        this.ctx1.fillRect(bod.newxy.x,bod.newxy.y,1,1);
    };
    // draw a planet with its name
    this.drawPlanet = function (bod) {
        if (bod.incl<0.07 || bod.P.z>0) {
            this.ctx2.fillStyle = bod.colour;
        }  else {
            this.ctx2.fillStyle = bod.dColour;
        }
        this.ctx2.beginPath();
        this.ctx2.arc(bod.newxy.x, bod.newxy.y, bod.bsize, 0, pi2);
        this.ctx2.fill();
        if (parms.showNames) this.ctx2.fillText(bod.name ,bod.newxy.x+5, bod.newxy.y+5);
    };
    // draw current date or days since start of simulation
    this.drawDate = function () {
        this.ctx2.fillStyle = "#ffffcc";
        if (parms.julian>0) {
            var daybit = runTime.getDate() + runTime.getHours()/24;
            var dtString = runTime.getFullYear() + "-" + (runTime.getMonth()+1)
                    + "-" + daybit.toFixed(2);
            this.ctx2.fillText(dtString,20,20);
        } else {
            this.ctx2.fillText(runTime.value/86400000 + " Days",20,20);
        }
        
    };
    // draw an orbit ellipse
    this.drawOrbit = function (bdy, central) {
        // need to consider best value for dt 
        // need to use toScreen raher than repeat code here
        
        var x,y,z,x1,y1,z1,x2,y2,z2,x3,y3,z3,nx,ny;
        var dt=0.02;   
        var a = bdy.a; var b=bdy.b; var c = bdy.c; 
        // default is use lighter colour for orbit.
        var light = true;
        this.ctx2.strokeStyle = bdy.colour;
        //Start drawing
        this.ctx2.beginPath();
        for (var t = 0; t<2*Math.PI; t=t+dt){                       // for all points on the ellipse
          
            x=a*Math.cos(t) - c;  y=b*Math.sin(t);      z=0.0;                      // point in xy plane
            x1=x*bdy.cosw-y*bdy.sinw;     y1=y*bdy.cosw+x*bdy.sinw;     z1=z;       // rotate by w (arg peri)
            x2=x1;                y2=y1*bdy.cosi;       z2=y1*bdy.sini;             // tilt by inclination
            x3=x2*bdy.coso-y2*bdy.sino;   y3=y2*bdy.coso+x2*bdy.sino;   z3=z2;      // rotate by omega (long.asc.node) 
          
           // move orbit to get centralmass at focus
            x3=x3+central.fP.x; y3=y3+central.fP.y; z3=z3+central.fP.z; 
            
           // check if colour change needed (points cross ecliptic)
            if (bdy.incl>0.07) {
                if (light ^ (z2<0))  {
                    this.ctx2.stroke(); 
                    if (light) {this.ctx2.strokeStyle = bdy.colour;} else {this.ctx2.strokeStyle = bdy.dColour;}
                    this.ctx2.beginPath();
                    this.ctx2.moveTo(nx,ny);
                    light = !light;
                }
            } 
                 
           // we now have a point (x3,y3,z3) in 3D space, now draw it on 2D screen
            y=y3*this.cosr-x3*this.sinr;    x=x3*this.cosr+y3*this.sinr;    z=z3; // rotate
            nx =(this.scale*x);  ny =(-this.scale*(y*this.cost+z*this.sint));     // tilt + screen positions
            nx = nx +this.centx - this.left; ny = ny + this.centy - this.up;      // adjust centre point
            if (t===0){
                this.ctx2.moveTo(nx,ny);
            } else {
                this.ctx2.lineTo(nx,ny);
            }  
           
            
        }
        this.ctx2.stroke();
        
    };
    // do focus modifies the rotation sines and cosines to focus on the specified body 
    this.doFocus = function (b) {
      var r, sinf, cosf;
      var bod = bodies[b];
      if (parms.follow){
          var fBody = bodies[parms.followBody];
          this.W.copy(bod.P); this.W.minus(fBody.P);  
          r= this.W.mag();
          sinf=this.W.y/r; cosf=this.W.x/r;
      }else{
          r=bod.P.mag();
          sinf=bod.P.y/r; cosf=bod.P.x/r; 
      }
      this.sinr=Math.sin(this.rotate)*cosf + Math.cos(this.rotate)*sinf; // add rotate and bearing angles
      this.cosr=Math.cos(this.rotate)*cosf - Math.sin(this.rotate)*sinf; // using trig formulae for adding sin and cos
     };
     // canvas has been resized
     this.reSize = function() {
        reDraw = true;
        var winwid = window.innerWidth;
        var winht  = window.innerHeight;
        this.canvas1.width = winwid;
        this.canvas2.width = winwid;
        this.canvas1.height= winht;
        this.canvas2.height= winht; 
        this.hi = this.canvas1.height;                         
        this.wi = this.canvas1.width;
        this.centx = Math.round(this.wi/2);
        this.centy = Math.round(this.hi/2); 
        // note font size needs to be reset after a canvas resize
        this.ctx2.font = "15px Verdana";
     };
     this.showPerf = function () {
         //if (parms.showNames) this.ctx2.fillText(loopTime, 5, 50);
     };
}

/*********
 * Run the integration 
 */
function integrate() {
   
    // process any mousedown requests, calculate orbital elments and draw the planets
    checkMouse();
    doElements();
    draw(); 
    // if showtime is fixed integrate for sowtime else use rate to determin the
    // length of the next integration step
    if (parms.fixed) {
        step = parms.showStep;
    } else {
        // find how many ms since last here
        now = new Date();
        loopTime = now-then;
        if (loopTime>100) {loopTime=100;}    // don't count more than 100ms
        then = now; 
        // find how many simulated days (step) to be processed since last here
        step = loopTime*rate; 
    }
    // advance the screen clock by the step we are about to take
    runTime.setTime(runTime.getTime() + (step * 86400000)*parms.direction);
    // execute calcSteps to complete the step
    do {
        // calcStep must not be bigger than remaining step time
        if (calcStep>step) {calcStep = step;}
        // execute one Yoshida step
        for (var i=0; i<4; i++) {leapFrog(calcStep*YO6[i]);}
        for (var i=0; i<3; i++) {leapFrog(calcStep*YO6[2-i]);}
        // accumulate time integrated
        step-=calcStep;
        // reassess required calcstep
        calcStep = doEncounter() / parms.vStep;
    } while (step>0);
    
    // if running request next animation frame 
    if (running) {animate = requestAnimationFrame(integrate);}
}
/***********************************************************************************************
 * 
 * Check for mousedown events and make the appropriate adjustments
 */
function checkMouse() {
    if (mouseevent===0) {return;}
    // loopMod is used to adjust the rate of change of parameter according to the
    // speed of the refesh rate
    var loopMod = loopTime/1000;
    switch (mouseevent) {
        case 1:
            scrn.scale*= (1+ loopMod);
            reDraw=true;
            break;
        case 2:
            scrn.scale*= (1-loopMod);
            reDraw=true;
            break;
        case 3:
            scrn.tilt += loopMod;
            reDraw=true;
            break;
        case 4:
            scrn.tilt -= loopMod;
            reDraw=true;
            break;
        case 5:
            scrn.rotate += loopMod;
            reDraw=true;
            break;
        case 6:
            scrn.rotate -= loopMod;
            reDraw=true;
            break;
        case 7:
            rate *= (1 + loopMod);
            break;
        case 8:
            rate *=  (1 - loopMod);
            break;
    }
    
    
} 


/**
 * Draw the planets on the canvas
 */
function draw() {
    var fmass, cmass;
    // clear the trails display if necessary
    if (reDraw) {
        scrn.doAngles();
        scrn.clearTrails();
        reDraw = false;
        displayed = false;
    }
    // clear the planet display
    scrn.clearPlanets();
    
    if (parms.focus){scrn.doFocus(parms.focusBody);}     
   
    // set position of central mass relative to follow body
    cmass = bodies[parms.centralmass];
    cmass.fP.copy(cmass.P);                       
    if (parms.follow){
        fmass = bodies[parms.followBody];
        cmass.fP.minus(fmass.P); }              
    
    // draw stuff for each body
    for (var i=0; i<parms.bodyCount; i++) {                             
        var bod = bodies[i];                                          
           
        // set body.fP relative to body being followed
        bod.fP.copy(bod.P);                                     // copy of true position
        if (parms.follow){
            bod.fP.minus(fmass.P); }   // if "follow"ing adjust position
        
        // get new screen position
        scrn.toScreen(bod.newxy, bod.fP);

        // if trail required draw it 
        if (displayed && parms.trails && bod.trail) {
           scrn.drawTrail(bod); 
        }
        // if orbit required draw it
        if (parms.orbits && bod.orbit) {
            scrn.drawOrbit(bod, cmass);
        }
  
        // always draw the body
        scrn.drawPlanet(bod);
        
        // show date
        scrn.drawDate();
        
        //store the xy positions for next time round
        bod.oldxy.copy(bod.newxy);
        bod.oldxy.copy(bod.newxy);  
     }
    displayed=true;
    scrn.drawDate();
}

function leapFrog(s) {
    
    var halfS=0.5*s;
        for (var n=0; n<parms.bodyCount; n++) {
            var b = bodies[n];
            b.nV.copyMPlus(b.V,b.A,halfS);     // nV=V+0.5*A*s
            b.nP.copyMPlus(b.P, b.nV, s);      // nP = P+nV*s
        }
        accelerate();                         // redo accelerations
        for (var n=0; n<parms.bodyCount; n++)  {               // for each body set P and V to nP and nV
            var b = bodies[n];
            b.V.copyMPlus(b.nV, b.A, halfS);  // V=nV+0.5*A*s
            b.P.copy(b.nP);             // P=nP
        }
}

/**
 * calculate the acceleration experienced by eac body due to the gravity of all the other bodies. 
 */
function accelerate() {
    /* define indexes */
    var i, j, k, l;           // working indexes
    var nn = parms.bodyCount;   // number of bodies
    var R = new JingoPoint(0,0,0);   // relative position between two bodies
    var r = 0;                  // relative distance between two bodies
    var r3=0;
    var temp = new JingoPoint(0,0,0);// working store

    /* clear all the acceleration values in the bodies*/
    for (i = 0; i <nn; i++) {
        bodies[i].A.zero();
    }

    /* for each combination of bodies where at least one has non-zero mass, calculate and
     * accumulate accelerations in the bodies  */

    for (i = 0; i < (nn - 1); i++) {
        for (j = i + 1; j < nn; j++) {
            if ((bodies[i].gmass > 0.0) || (bodies[j].gmass > 0.0)) {

                /* calculate relative positions and velocoties */
                R.copy(bodies[j].nP);
                R.minus(bodies[i].nP);    //  vector of relative positions
                //V.copy(bodies[j].nV);  V.minus(bodies[i].nV);    //  vector of relative velocity

                /* calculate distances */
                r = R.mag();
                r3 = r * r * r;                   //  scalar distance and cube

                /* calculate acceleration on body i */
                bodies[i].A.MPlus(R, bodies[j].gmass / r3);

                /* relativistic adjustment made a/c formula in A.V's SOLEX.
                 * Adjusment only made in relation to cental body and if the body being processed
                 * has had it's orbit calculated. Otherwise Newtonian value is used.
                 */
                if (bodies[i].central && parms.relativity && bodies[j].orbit) {
                    temp.copy(R);
                    temp.mult(bodies[i].gmass / r3);
                    temp.mult(1 - 9 * bodies[j].relpar / bodies[j].a + 6 * bodies[j].relpar / r);
                    bodies[j].A.minus(temp);                                               // relativistic accel on body j
                } else {
                    temp.copy(R);
                    temp.mult(bodies[i].gmass / r3);
                    bodies[j].A.minus(temp);  // Newtonian accel on body j
                }
            }
        }
    }
}

function reverse() {
    for (var i = 0; i < parms.bodyCount; i++) {
        bodies[i].V.mult(-1);
    }
    parms.direction = -parms.direction;
}
/**
 * calculate the baricentre of system and adjust positions and velocities accordingly
 * @param {boolean} rel whether to use relativity
 **/
function fixbaric(rel) {

    var sm = 0;
    var SMP = new JingoPoint(0.0, 0.0, 0.0);
    var SMV = new JingoPoint(0.0, 0.0, 0.0);
    var BariP = new JingoPoint(0,0,0);
    var BariV = new JingoPoint(0,0,0);
    var temp = new JingoPoint(0,0,0);
    var xmass;
    /* accumulate positions and velocities weighted by masses */
    for (var i = 0; i < parms.bodyCount; i++)
    {
       
        /* if relativity use relativistic mass */
        if (rel) {
            xmass = bodies[i].relmass;
        } else {
            // recalculate energy
            xmass = bodies[i].gmass;
        }
        /* summ position and velocity weighted by mass */
        sm = sm + xmass;
        temp.copy(bodies[i].P);
        temp.mult(xmass);
        SMP.plus(temp);
        temp.copy(bodies[i].V);
        temp.mult(xmass);
        SMV.plus(temp);
    }

    /* calculate position and velocity of baycentre */
    BariP.copy(SMP);
    BariP.mult(1 / sm);
    BariV.copy(SMV);
    BariV.mult(1 / sm);

    /* adjust positions and velocities of all bodies to be barcentric */
    for (var i = 0; i < parms.bodyCount; i++)
    {
        bodies[i].P.minus(BariP);
        bodies[i].V.minus(BariV);
    }

}
/**
 * Returns value related to relativity for a selected body
 * @param {type} n body number
 * @returns {Number} sum of gmass/distance for other modies
 */
function relsum(n) {
      // subroutine used above during calculation of relativistic mass
    var sum = 0;
    var dist = new JingoPoint(0.0,0.0,0.0);
    for (var jj=0; jj<parms.bodycount; jj++) {
            if (jj!==n) {
                dist.copy(bodies[n].P); dist.minus(bodies[jj].P);
                var ddist = dist.mag();
                if (ddist>0.9) {sum=sum+bodies[jj].gmass/ddist;}
            }
        }
        return sum;
    }
/**
 * Connect to the source URL and download the contents
 * @param {type} theUrl  URL of the definition file
 * @returns {String} contents of the defiition file
 */
/**
 * instructs each of the bodies to calculate its orbital elements
 */
function doElements()  {
    for (var n=0; n<parms.bodyCount; n++){
            if (parms.central && (!bodies[n].central) && bodies[n].orbit) {
                bodies[n].computeElements(parms, bodies[parms.centralmass]);
            }
        }
    }
/**
 * calculate the minimum close encounter times for all the bodies as a basis for step time
 **/
function doEncounter() {
        var enc;
        var clenc = Number.MAX_VALUE;
        var r2 =0;
        var v2=0;
        var i,j;
        
        var R = new JingoPoint(0,0,0);
        var V = new JingoPoint(0,0,0);
        for (i = 0; i < (parms.bodyCount - 1); i++) {
            // for each combination of bodies, evaluate only if at least one has non-zero mass
            for (j = i + 1; j < parms.bodyCount; j++) {
                if ((bodies[i].gmass > 0.0) || (bodies[j].gmass > 0.0)) {
                    R.copy(bodies[j].nP);
                    R.minus(bodies[i].nP);       // vector of relative positions
                    V.copy(bodies[j].nV);
                    V.minus(bodies[i].nV);       // vector of relative velocity
                    r2 = R.sqr();
                    v2 = V.sqr();             
                    enc = r2 / v2;            // sqr of encounter time based on velocity
                    if (enc < clenc) {
                        clenc = enc;                     
                    } 
                }
            }      
        }
        return Math.sqrt(clenc);
    }


function httpGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}
/********************************************************************************************
 * 
 * Button event processors
 */
function stopStart() {
    if (running) {
        running=false;
        document.getElementById("stopStart").innerHTML = "Start";
        cancelAnimationFrame(animate);
    } else {
        running = true;
        document.getElementById("stopStart").innerHTML = "Stop";
        animate = requestAnimationFrame(integrate);
    }
}
function trails() {
    parms.showType += 1;
    if (parms.showType>3) parms.showType = 0;
    setShowType();
    reDraw = true;
}
function names() {
    parms.showNames = !parms.showNames;
}
function reverse() {
    // reverse by reversing the direction of velocities
    for (var i = 0; i < parms.bodyCount; i++) {
        bodies[i].V.mult(-1);
    }
    parms.direction = -parms.direction;
}
// Generic mousedown on a button sets the mouserequest number
function msd(m) {
    mouseevent=m;
}
// Generic mouseup from a button clears the mouserequest number
function msu() {
    mouseevent=0;
}
// Called when the window (DOM) is resized.
function resizeCanvas() {
    scrn.reSize();
}
// Mousedown innside the display
function mdown(event) {
    event.preventDefault();
    saveX = event.clientX;
    saveY = event.clientY;
}
function mup(evt) {
    scrn.up+=  saveY - event.clientY; 
    scrn.left+= saveX - event.clientX;
    reDraw=true;
}
