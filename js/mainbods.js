 
/* global toRadians, sun, obs, filter */
 
/* define math functions and constants as aid to readability. */
var    twoPI = Math.PI*2,
       PI   =  Math.PI,
       sin  =  Math.sin,
       cos  =  Math.cos,
       tan  =  Math.tan,
       asin =  Math.asin,
       atan2 = Math.atan2,
       abs =   Math.abs,
       acos =  Math.acos;
/* Ecliptic */
var eps = 23.4373*toRadians; // eclip+tic

/*************************************************************************
 * Class Coord is a point on a sphere (ra,dec) or (long,lat).     
 **/
class Coord {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
   /* Sky angle between this coord and another coord c. */
    getAngle(c) {
        return acos(sin(c.y)*sin(this.y)+cos(c.y)*cos(this.y)*cos(c.x-this.x));
    }
   /* Hours either side of meridian object p is above altitude alt. degrees 
     * when viewed at an observatory located a this position. Zero is returned
     * if the object does not rise above alt. when at meridian.*/
    riseTime(p, alt) {
        let zRad = alt * toRadians;       
        let HARad = acos((sin(zRad)-sin(p.y)*sin(this.y))/(cos(p.y)*cos(this.y)));
        if (isNaN(HARad)) return 0;
        return (HARad/toRadians)/15;
    }
   /* Galactic latitude of this RA/Dec coordinate. */
    galLat(){
        let gpRA = 3.366;   // Galactic pole RA (radians)
        let gpDec = 0.4734; // Galactic pole Dec(radians)
        let d = sin(gpDec) * sin(this.y) + cos(gpDec) *
                cos(this.y) * cos(this.x-gpRA);
        return asin(d)/toRadians;
    }
   /* Equatorial coord equivalent to this ecliptic coord */
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
 * Class Body is a NEO or NEOCP object.                               
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
       /* number of hours above altitude at observatory */
        let h = obs.position.riseTime(this.coord, filter.altLimit);
       /* not visible if never above altitude limit or too faint */
        if ((!(h>0)) || this.v>filter.magLimit) return;
       /* not visible if score/uncertainty too low */
        if (this.type !== "neocp" && this.score < filter.uncLimit) return;
       /* visible if HA from midnight meridian is less than time above horizon.*/
        let diff = abs(this.coord.x - sun.raMidnight)/(toRadians * 15);
        if ( diff< h) {this.visible = true;}
    }
} 

/*****************************************************************
 * Class Observatory is an observatory.                       
 **/
class Observatory {
    constructor(long,lat,code,name) {
        this.position = new Coord(long*toRadians,lat*toRadians);
        this.ha = 0; 
        this.code = code;
        this.name =name;
    }
   /* ha is the length of astronomical day at this observatory */
    setTimes() {
        this.ha = abs(this.position.riseTime(sun.raDec, -18));
    }
}

/************************************************************
 * Class Sun is the Sun. Position based on  
 *  http://www.stjarnhimlen.se/comp/tutorial.html.
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
 * Class Filter contains the flter values from the DOM.
 **/
class Filter {
    constructor() {
        this.magLimit = 0;
        this.altLimit =  0;
        this.uncLimit = 0;
    }
    setFilter() {
       /* get filter values from the document */
        this.magLimit = document.getElementById("mag").value;
        this.altLimit =  document.getElementById("alt").value;
        this.uncLimit = document.getElementById("unc").value; 
       /* if cookies enabled, save filter values */ 
        var cookie = new Cookie();
        if (cookie.enabled) {
            cookie.setCookie("magLimit", this.magLimit, 7);
            cookie.setCookie("altLimit", this.altLimit, 7);
            cookie.setCookie("uncLimit", this.uncLimit, 7);
        }
    }
    /* if cookies enabled, load filter cookies */
    getFilter() {
        var cookie = new Cookie();
        if (cookie.enabled) {
            let v = cookie.getCookie("magLimit");
            if ("x" !== v) this.magLimit = v;
            v = cookie.getCookie("altLimit");
            if ("x" !== v) this.altLimit = v;
            v = cookie.getCookie("uncLimit");
            if ("x" !== v) this.uncLimit = v;
            document.getElementById("mag").value = this.magLimit;
            document.getElementById("alt").value = this.altLimit;
            document.getElementById("unc").value = this.uncLimit; 
         
         }
    }
 }
 
/**************************************************************
 * Translate orbit codes to orbit names.
 * @param {String} x Orbit code
 * @returns {String} Orbit name
 **/
 function translate(x) {
     if (x === "Apo") return "Apollo";
     if (x === "Amo") return "Amor";
     if (x === "Ate") return "Aten";
     if (x === "VI ") return "Risk(VI)";
     if (x === "TNO") return "TNO";
     if (x === "Cen") return "Centaur";
     return "unknown";
 }
 class Cookie {
     constructor() {
        this.enabled = navigator.cookieEnabled;
        this.magLimit = 0;
        this.altLimit =  0;
        this.uncLimit = 0;
     }
     setCookie(cname, cvalue, exdays) {
         const d = new Date();
         d.setTime(d.getTime() + (exdays*24*60*60*1000));
         let expires = "expires="+ d.toUTCString();
         document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
     }
     getCookie(cname) {
         let name = cname + "=";
         let decodedCookie = decodeURIComponent(document.cookie);
         let ca = decodedCookie.split(';');
         for(let i = 0; i <ca.length; i++) {
             let c = ca[i];
             while (c.charAt(0) === ' ') {
                 c = c.substring(1);
             }
         if (c.indexOf(name) === 0) {
             return c.substring(name.length, c.length);
         }
       }
       return "x";
     }
    
}
 
 
         
