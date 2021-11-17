 
/* global toRadians, sun, obs, filter */
 
/* define math function ans constants as aid to readability. */
var    twoPI = Math.PI*2,
       PI   =  Math.PI,
       sin  =  Math.sin,
       cos  =  Math.cos,
       tan  =  Math.tan,
       asin =  Math.asin,
       atan2 = Math.atan2,
       abs =   Math.abs,
       acos =  Math.acos;
/* Ecliptic                                                     */
var eps = 23.4373*toRadians; // eclip+tic

/******************************************************************
 * Class Coord is a point on a sphere (ra,dec) or (long,lat).     
 **/
class Coord {
    constructor(x,y)    {
        this.x = x;
        this.y = y;
    }
    
    /* Sky angle between this and coordinate c. */
    getAngle(c) {
        return acos(sin(c.y)*sin(this.y)+cos(c.y)*cos(this.y)*cos(c.x-this.x));
    }
    
    /* Hours either side of meridian object at p is above altitude alt. */
    riseTime(p, alt) {
        let zRad = alt * toRadians;       
        let HARad = acos((sin(zRad)-sin(p.y)*sin(this.y))/(cos(p.y)*cos(this.y)));
        if (isNaN(HARad)) return 0;
        return (HARad/toRadians)/15;
    }
    
    /* Galactic latitude of this object */
    galLat(){
        let gpRA = 3.366;   // Galactic pole RA (radians)
        let gpDec = 0.4734; // Galactic pole Dec(radians)
        let d = sin(gpDec) * sin(this.y) + cos(gpDec) *
                cos(this.y) * cos(this.x-gpRA);
        return asin(d)/toRadians;
    }
    
    /* Get equatorial coord equivalent to this ecliptic coord */
    getEquatorial() {
        let eq = new Coord();
        eq.y= asin(sin(this.y)*cos(eps) + cos(this.y)*sin(eps)*sin(this.x) );     
        let sinRA = (cos(this.y)*cos(eps)*sin(this.x)-sin(this.y)*sin(eps))/cos(eq.y);
        let cosRA = (cos(this.x)*cos(this.y))/cos(eq.y);
        eq.x = atan2(sinRA,cosRA);
        if (eq.x<0) {eq.x+=twoPI;}
        return eq;
    }
}

/********************************************************************
 * Class Neocp is a NEOCP object.                               
 **/
class Body {
    constructor() {
        this.id = "yyyy xxxx";
        this.coord = new Coord(0,0);
        this.v = 0.0;
        this.h = 0.0;
        this.type = "undef";
        this.updated = "1/1/2000";  //updated or last ob
        this.score = 99;
        this.pha = false;
        this.risk = false;
        this.priority = "";
        this.motion = 999;
        this.visible = false;
        
    }   
    /* check if this object is visible from current observatory. */
    checkVisible() {
        this.visible = false;
        let h = obs.position.riseTime(this.coord, filter.altLimit);
        if ((!(h>0)) || this.v>filter.magLimit) return;
        if (this.type !== "neocp" && this.score < filter.uncLimit) return;
        let diff = abs(this.coord.x - sun.raMidnight)/(toRadians * 15);
        if ( diff< h) {this.visible = true;}
    }
} 

/*****************************************************************
 * Class Observatory is an observatory                           
 **/
class Observatory {
    constructor(long,lat) {
        this.position = new Coord(long*toRadians,lat*toRadians);
        this.ha = 0; // half astronomical day
    }
    setTimes() {
        this.ha = abs(this.position.riseTime(sun.raDec, -15));
    }
}

/************************************************************
 * Class Sun is the Sun.
 **/
class Sun {
    constructor() {
        this.raDec = new Coord();
        this.raMidnight = 0;
    }
    setPosition(JD) {
        let n= JD - 2451545.0;
        let L = toRadians * (280.460 + 0.9856474 * n); 
        let g = toRadians * (357.528 + 0.9856003 * n);
        L%= twoPI;
        g%= twoPI;
        this.raDec.x=L+0.020856685*sin(g) + 0.0003490659*sin(2*g);
        this.raDec.y=0.0;
        this.raDec = this.raDec.getEquatorial();
        this.raMidnight = (this.raDec.x + PI)%twoPI;
    }
}
    
/***********************************************************
 * Class Filter is the flter values from the DOM.
 */
class Filter {
    constructor() {
        this.magLimit = 0;
        this.altLimit =  0;
        this.uncLimit = 0;
    }
    setFilter() {
        this.magLimit = document.getElementById("mag").value;
        this.altLimit =  document.getElementById("alt").value;
        this.uncLimit = document.getElementById("unc").value;
    }
 }

 
 
         
