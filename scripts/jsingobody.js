/*
 * This file contains a collection of javascript object definitions 
 * 
 */

"use strict";
/***********************************************************************************************
 *                              JingoBody 
 *                              
 *   Represents one orbiting body in the simulation. Includes the method doElements()
 *   that calculates the body's orbital elements from position and velocity  
 * 
 */
function JingoBody() {
    this.orbit = true;                   // default is orbit can be drawn
    this.trail = true;                   // default is trail can be drawn
    this.central = false;                // default not the central mass
    this.tnext = 0.0;                    // default next move time is start time
    this.ecliptic=false;                 // default this is not the ecliptic
    this.name="noname";                  // body name
    this.aster=false;                    // this is a clone
    this.asterName="noname";             // bod name without the clone number
    this.mass =0;                        // body mass in Solar Masses
    this.gmass =0;                       // body mass times gravitational constant
    this.size =0;                        // body size in AU
    this.bsize = 4;                      // body size to paint
    this.colour = "#FFFFFF";             // colour to paint
    this.dColour = "DDDDDD";             // darker colour for below ecliptic
    
    this.a=0;                            // semi-major axis
    this.b=0;                            // semi-minor axis
    this.c=0;                            // center-focus distance
    this.e=0;                            // eccentricity
    this.tp=0;                           // time of perifocal passage
    this.q=0;                            // perifocal distance (for hyperbolic orbits)
    this.incl=0;                         // inclination
    this.omega=0;                        // logitude of assending node
    this.w=0;                            // argument of perifocus
    this.wbar=0;                         // logitude of perifocus
    this.n=0;                            // mean motion
    this.m=0;                            // mean anomaly
    this.l=0;                            // mean longitude
    this.per=0;                          // orbital period
    this.otype=0;                        // 0=elliptical, 1=parabolic
    
    // current and previous pixel positions on the screen
    this.newxy = new ScreenPoint(0,0);                         
    this.oldxy = new ScreenPoint(0,0);
    
    // sines and cosines of orbital elements pre-calc for performance
    this.sino=0;                         
    this.coso=0;
    this.sinw=0;
    this.cosw=0;
    this.sini=0;
    this.cosi;0;
    
    // Important vectors of position, velocity etc.
    this.P = new JingoPoint(0,0,0);      // position
    this.nP= new JingoPoint(0,0,0);      // new position
    this.V = new JingoPoint(0,0,0);      // velocity
    this.nV= new JingoPoint(0,0,0);      // new velocity
    this.A = new JingoPoint(0,0,0);      // acceleration
    this.hP= new JingoPoint(0,0,0);      // heliocentric coordinates
    this.hV= new JingoPoint(0,0,0);      // heliocentric velocity
    this.E = new JingoPoint(0,0,0);      // eccentricity vector
    this.H = new JingoPoint(0,0,0);      // angular momentum vector
    this.N = new JingoPoint(0,0,0);      // accending node vector
    this.fP= new JingoPoint(0,0,0);      // position adjusted for "follow"
     
    
    /**************************************************************************************************
     * computeElements(centralmass) computes a set of classical elements for this body using formulae 
     * taken from Dan Boulet's book Methods of Orbit Determination chapter 4. Centralmass identifies 
     * the Sun or other central dominant mass.
     * @param {parameterSet} parms   the parameter set
     * @param {body} centralmass     the central mass body (Sun)
     */
    this.computeElements = function(parms, centralmass) {
        // Set up heliocentric coordinates and velocity
        this.hP.copy(this.P);
        this.hP.minus(centralmass.P);
        this.hV.copy(this.V);
        this.hV.minus(centralmass.V);
        this.hV.mult(parms.direction);

        // The base equations use a 'modified time' based on t/gravitational constant, so
        // the velocity must by modified accordingly
        this.hV.mult(1 / parms.gcc);                // scale for 'modified time'

        //tmass = total mass of Sun + object
        var tmass = centralmass.mass + this.mass;
        
        // Equation 4.68 compute interim values
        var r =  this.hP.mag();                     // current radial distance
        var v2 = this.hV.sqr();                     // current velocity squared
        var rv = this.hV.dot(this.hP);              // dot-product of velocity and position

        // Equation 4.71 compute eccentricity vector that points to the perifocus
        this.E.x = (v2 / tmass - 1.0 / r) * this.hP.x - (rv / tmass) * this.hV.x;
        this.E.y = (v2 / tmass - 1.0 / r) * this.hP.y - (rv / tmass) * this.hV.y;
        this.E.z = (v2 / tmass - 1.0 / r) * this.hP.z - (rv / tmass) * this.hV.z;

        // Equation 4.74 compute angular momentum vector (H=P X V) that points 90 degrees to
        // plane of orbit
        this.H.x = this.hP.y * this.hV.z - this.hP.z * this.hV.y;
        this.H.y = this.hP.z * this.hV.x - this.hP.x * this.hV.z;
        this.H.z = this.hP.x * this.hV.y - this.hP.y * this.hV.x;

        // Equation 4.77 compute ascending node vector that points to ascending node
        this.N.x = -this.H.y;
        this.N.y = this.H.x;
        this.N.z = 0.0;

        // Compute conic parameters
        this.a = 1.0 / (2 / r - v2 / tmass);              // Equation 4.78 semi-major axis
        this.e = this.E.mag();                            // Equation 4.79 eccentricity
        var sp = this.H.sqr() / tmass;                    // Equation 4.80-81 semiparameter
        this.q = sp / (1.0 + this.e);                     // Equation 4.82 perifocal distance

        // Compute angular elements
        this.incl = Math.acos(this.H.z / this.H.mag());   // Equation 4.84 inclination
        this.omega = Math.acos(this.N.x / this.N.mag());  // Equation 4.86 ascending node
         // if inclination is zero then set omega zero
        if (this.N.y < 0) {
            this.omega = 2 * Math.PI - this.omega;        // correction for retrograde
        }                                              
        var ne = this.N.dot(this.E);                      // Eqn 4.88 arg of perifocus
        this.w = Math.acos(ne / (this.N.mag() * this.e));
        if (this.E.z < 0) {                               // correction for retrograde
            this.w = 2 * Math.PI - this.w;
        }

        // compute x-bar and y-bar
        var xb = (sp - r) / this.e;                       // Equation 4.91      x-bar
        var yb = rv * Math.sqrt(sp / tmass) / this.e;     // Equation 4.92      y-bar

        // Decide on orbit type (anything near 1 is assumed to be 1 so orbit type does not keep changing for
        // typical Oort Cloud comets)
        if (this.e > 0.998) {           // if > 0.998 assume parabolic
            this.otype = 1;
        }  else  {                     //   else assume elliptica (hyperbolic not implemented)
            this.otype = 0;
        }                      
       
        // compute remaining elements depending on orbit type
        // RECONSTRUCT THIS SECTION FROM JINGO DESKTO VERSION IF REQUIRED
       
        //*********************************************************************************
        // At this point, the orbit is solved. The next section computes stuff required
        // to help draw the ellipse on the screen.
       
        // compute semi-minor axis and centre-to-focus distance 
        this.b = this.a * Math.sqrt(1 - this.e * this.e);
        this.c = this.e * this.a;

        // wbar is needed for drawing the orbits when inclination is zero.
        this.wbar = this.omega + this.w;  // longitude of perifocus
        if (this.wbar > 2 * Math.PI) {
            this.wbar = this.wbar - (2 * Math.PI);
        }
        if (this.incl === 0.0) {          // if incl=0 w-bar is calc from E.x and E.y
            this.wbar = arcSub(this.E.y / e, this.E.x / e);
        }
        // Calculate the sines and cosines that will be needed to draw the orbit
        // if incl is 0.0 then there is no valid omega so use wbar
        if (this.b.incl===0){
            this.sinw = Math.sin(this.wbar); 
            this.cosw = Math.cos(this.wbar);
            this.sino = 0.0;   
            this.coso = 1;
            this.sini = 0.0;   
            this.cosi = 1;
        } else {
            this.sinw = Math.sin(this.w); 
            this.cosw = Math.cos(this.w);
            this.sino = Math.sin(this.omega); 
            this.coso = Math.cos(this.omega);
            this.sini = Math.sin(this.incl);    
            this.cosi = Math.cos(this.incl);
        }
    };
}

/************************************************************************************************
 * Function arcSub - compute correct + or - value of x given sin(x) and cos(x)
 * @param {number} sinx sin of x
 * @param {number} cosx cos of x
 */
function arcSub(sinx, cosx) {
    var x = 0.0;
    if (Math.abs(sinx) <= 0.707107) {
        x = Math.asin(Math.abs(sinx));
    }
    if (Math.abs(cosx) <= 0.707107) {
        x = Math.acos(Math.abs(cosx));
    }
    //if (cosx>=0.0 && sinx>=0.0)   {}
    if (cosx < 0.0 && sinx >= 0.0) {
        x = Math.PI - x;
    }
    if (cosx < 0.0 && sinx < 0.0) {
        x = Math.PI + x;
    }
    if (cosx >= 0.0 && sinx < 0.0) {
        x = 2 * Math.PI - x;
    }
    return x;
}
/***********************************************************************************************
 *                             JingoPoint 
 * 
 * This is a general purpose 3D point or vector with a selection of computational methods.
 * @param {number} x          x,y,z coordinates of a point in space or space vector
 * @param {number} y
 * @param {number} z  
 */
function JingoPoint(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.minus = function (p) {
        this.x -= p.x;
        this.y -= p.y;
        this.z -= p.z;
    };
    this.plus = function (p) {
        this.x += p.x;
        this.y += p.y;
        this.z += p.z;
    };
    this.mag = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };
    this.sqr = function () {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    };
    this.mult = function (a) {
        this.x *= a;
        this.y *= a;
        this.z *= a;
    };
    this.div = function (a) {
        this.x /= a;
        this.y /= a;
        this.z /= a;
    };
    this.zero = function () {
        this.x = 0.0;
        this.y = 0.0;
        this.z = 0.0;
    };
    this.dot = function (p) {
        return p.x * this.x + p.y * this.y + p.z * this.z;
    };
    this.copy = function (p) {
        this.x = p.x;
        this.y = p.y;
        this.z = p.z;
    };
    this.dist = function (p) {
        return Math.sqrt(Math.pow(p.x-this.x,2)+Math.pow(p.y-this.y,2)+Math.pow(p.z-this.z,2));
    };
    // comlex operations implemented to avoid need for multiple method calls
    this.copyMPlus = function (p1, p2, a) {   // copy and multiply, this = p1+a*p2
        this.x = p1.x + (p2.x * a);
        this.y = p1.y + (p2.y * a);
        this.z = p1.z + (p2.z * a);
    };
    this.MPlus = function (p, a) {            // multiply and add, this = this+a*p
        this.x += (p.x * a);
        this.y += (p.y * a);
        this.z += (p.z * a);
    };
}
/************************************************************************************************
 *                             ScreenPoint
 *                
 * This is a 2D point being the x, y pixel positions on the screen.
 * @param {type} x
 * @param {type} y
 */
function ScreenPoint(x,y) {
    this.x=x;
    this.y=y;
    this.copy = function(p) {
        this.x=p.x;
        this.y=p.y;
    };
}
/***********************************************************************************
 * Colour change function obtained from stackoverflow.com 5560248
 * @param {type} color      the #RRGGBB colour to be changed
 * @param {type} percent    the percentage of change required
 * @returns {String}        the modified colour
 */
function shadeColor(color, percent) {

    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    var RR = (R.toString(16).length < 2)?'0'+R.toString(16):R.toString(16);
    var GG = (G.toString(16).length < 2)?'0'+G.toString(16):G.toString(16);
    var BB = (B.toString(16).length < 2)?'0'+B.toString(16):B.toString(16);

    return "#"+RR+GG+BB;
}

/****************************************************************************************
 *                             ParameterSet
 * 
 * This contains a set of parameters that determine the behaviour of the interation
 */
function ParameterSet() {
    this.vStep=100;                      // variable step size parameter
    this.sleep=20;                       // notional time between displays 
    this.orbits=false;                   // draw orbis? 
    this.info = true;                    // (not used in the javascript version)
    this.julian=0;                       // julian date of simulation start
    this.followBody= 0;                  // the body to hold centrally
    this.follow=false;                   // is there a body to hold centrally?
    this.focusBody=0;                    // the body to focus on with rotating coordinates
    this.focus = false;                  // is there a body requiring rotating coordinates?
    this.bodyCount=0;                    // number of bodies
    this.relativity=false;               // use relativity?
    this.simTitle="undefined";           // title text from definition file
    this.showStep=1;                     // number of integration days between display updates
    this.showType = 0;                   // 0=orbits, 1=trails, 2=both, 3=neither
    this.showNames = true;               // whether to show object names
    this.fixed = false;                  // fix the showstep
    this.direction=1;                    // 1 is forward, -1 is backward
    this.D3=true;                        // 3D simulation
    this.trails=false;                   // should draw trails?
    this.gcc =0.01720209895;             // Gaussian gravitational constant
    this.G =0.01720209895*0.01720209895; // gcc squared
    this.centralmass = 0;                // the body number of the central mass
    this.central=false;                  // has a body been specified as central?
    this.cv = 173.1446;                  // velocity of light in AU/day
    this.vcc = 173.1446*173.1446;        // light speed squared
        
}
 
