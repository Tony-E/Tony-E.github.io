/**************************************************************************************
 * This script contains supporting function for the Candyweb neoFixer site.
 * 
 */ 
 
/* global toRadians, sun, obs,ob,filter */
 
/* define math functions and constants as aid to readability. */
var  twoPI = Math.PI*2,
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
     * when viewed at an observatory located at this position. Zero is returned
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
        this.id = "yyyy xxxx";             // packed or neocp designation
        this.provisional = "";
        this.number = "";
        this.ra = "00";                        // RA
        this.dec =  "00";                    // Dec
        this.v = 0.0;                           // Magnitude
        this.h = 0.0;                           // Size
        this.u = 0;                              // uncertainty parameter
        this.lastob =0;                       // Last ob days ago
        this.score = 99;                    // NEOfixer score
        this.risk = "none";                 // is it at risk?
        this.priority = "";                    // NEODyS priority
        this.motion = 999;                 // motion "/m
        this.neocp = " ";                    // is it a neocp    
        this.show =true;                    // display this object
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
        this.url ="";  //url for neofixer data
        this.targets = [];
    }
   /* ha is the length of astronomical day at this observatory 
    * (-18 refers to the start/end of astronomical twilight) */
    setTime() {
        this.ha = abs(this.position.riseTime(sun.raDec, -18));
    }
    /* filter the objects for display */
    filterTargets() {
        console.log(this.targets);
        for (let i = 0; i<this.targets.length; i++) {
              let b = this.targets[i];
              b.show = true;
              if (b.u < filter.uncLimit) {b.show = false;}
              if (b.v > filter.magLimit) {b.show = false;}
        }
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
    
/******************************************************************************
 * Class Filter contains the filter values from the document. If cookies are 
 * allowed then filter values are saved (for 7 days) and retrieved from the
 * cookie.
 **/
class Filter {
    constructor() {
        this.magLimit = 0;    // magnitude limit
        this.uncLimit = 0;    // uncertainty limit
    }
    
   /* set filter values from the document and place in a cookie (if enabled) */ 
    setFilter() {
       /* get filter values from the document */
        this.magLimit = document.getElementById("mag").value;
        this.uncLimit = document.getElementById("unc").value; 
        
       /* if cookies enabled, save filter values */ 
        var cookie = new Cookie();
        if (cookie.enabled) {
            cookie.setCookie("magLimit", this.magLimit, 7);
            cookie.setCookie("uncLimit", this.uncLimit, 7);
        }
    }
    
    /* retrieve filter values from a cookie (if enabled) */
    getFilter() {
        var cookie = new Cookie();
        if (cookie.enabled) {
            let v = cookie.getCookie("magLimit");
            if ("x" !== v) {this.magLimit = v;} else {this.magLimit = 19.5;}
            v = cookie.getCookie("altLimit");
            if ("x" !== v) {this.altLimit = v;} else {this.altLimit = 30;}
            v = cookie.getCookie("uncLimit");
            if ("x" !== v) {this.uncLimit = v;} else {this.uncLimit = 1;}
            document.getElementById("mag").value = this.magLimit;
            document.getElementById("unc").value = this.uncLimit; 
         
         }
    }
 }
 

 
 /*****************************************************************************
  * A cookie is a small file stored by the browser on the user's machine. It
  * is used to save information from one visit to the next. In this application
  * only the values of the filter are stored in a cookie if the user activates
  * the Filter button.
  */
 class Cookie {
     constructor() {
        this.enabled = navigator.cookieEnabled; //are cookies enabled by user?
        this.magLimit = 0;   // magnitude limit
        this.altLimit =  0;  // altitude limit
        this.uncLimit = 0;   // uncertainty limit
     }
     
    /* set a cookie with name=cname, content=cvalue, expiry in "exdays" */ 
     setCookie(cname, cvalue, exdays) {
         const d = new Date();
         d.setTime(d.getTime() + (exdays*24*60*60*1000));
         let expires = "expires="+ d.toUTCString();
         document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
     }
    /* retrieve and decode cookie (standard code from W3Schools) */ 
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
 
 
         