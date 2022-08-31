/* ****************************************************************************
 * These are some utility routines that support Cosmos
 */

/* global pi2, showNames, drawOrbits, year */

/******************************************************************************
 *                             CosmoPoint 
 * 
 * General purpose 3D point or vector with a selection of computational methods.
 * @param {number} x      x,y,z coordinates of a point in space or space vector
 * @param {number} y
 * @param {number} z  
 */
function CosmoPoint(x, y, z) {
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
    this.setValue = function (x,y,z) {
        this.x = x;
        this.y = y;
        this.z = z;
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
    this.set = function(x,y) {
        this.x=x;
        this.y=y; 
    };
}

/******************************************************************************
 *                              Screen
 * 
 *     The display screen with methods to draw circles, lines and planets
 * 
 */
function Screen() {
    this.canvas = document.getElementById("layer1"); // The canvas in the DOM
    this.ctx = this.canvas.getContext("2d"); // drawing coontxt
    this.starImage = new Image(); // get image used to represent stars.
    this.starImage.src = "star.jpg";
    
    this.reDraw = true;  // everything needs to be redrawn (to start)
    
    this.hi2 = 0;        // height/2, width/2 and scale (pixels per AU)
    this.wi2 = 0;
    this.scale=200;  
    
    this.centx;          // centre x and y pixels
    this.centy;
    
    this.up=0;           // user control values up, left, tilt, rotate
    this.left=0;
    this.tilt=0;
    this.rotate=0;
    
    this.sinr;           // sin and cos of rotate and tilt pre-calculated.
    this.cosr;
    this.sint;
    this.cost;
    
    
    // working areas for transpositions
    this.ds = new CosmoPoint(0,0,0);   // 3d space position of orbit point
    this.d3 = new CosmoPoint(0,0,0);   // rotated 3d space position
    this.d2 = new ScreenPoint(0,0);    // screen projected position
  
    // set up commonly used sines and cosines
    this.doAngles = function () {    
        this.sint = Math.sin(this.tilt);   
        this.cost = Math.cos(this.tilt);  
        this.sinr = Math.sin(this.rotate); 
        this.cosr = Math.cos(this.rotate); 
    };
    
    // clear the background canvas
    this.clearScreen = function () {
        this.ctx.fillStyle = "#000022";
        this.ctx.beginPath();
        this.ctx.rect(0,0,this.width,this.height);
        this.ctx.fill();
    };
  
    // convert a 3D space coord to a 2D screen pixel coord
    this.toScreen = function (space) {
        this.d3.y = space.y * this.cosr - space.x * this.sinr;     // rotate
        this.d3.x = space.x * this.cosr + space.y * this.sinr;
        this.d3.z = space.z;  
        
        this.d2.x =  this.centx - this.left    // scale, tilt and apply up and left
                + (this.scale * this.d3.x);    
        this.d2.y = this.centy - this.up
                -(this.scale * (this.cost*this.d3.y + this.sint*this.d3.z));  
      
    };
    
    // draw a planet with its name
    this.drawPlanet = function (bod) {
        this.ctx.fillStyle = bod.colour;
        this.ctx.beginPath();
        this.toScreen(bod.position);
        let pSize = bod.size; // * this.scale * 0.01;
        this.ctx.arc(this.d2.x, this.d2.y, pSize, 0, pi2);
        this.ctx.fill();
        if (showNames) {
            this.ctx.strokeStyle  = bod.tColour;
            this.ctx.fillText(bod.name ,this.d2.x+2 + pSize, this.d2.y+2);
            this.ctx.globalCompositeOperation = "source-over";
        }
    };
    
    // draw circle deferent or epicycle
    this.drawOrbit = function (bod) {
       if (!drawOrbits) return;
       this.ctx.strokeStyle = bod.colour;
       this.ctx.beginPath();
       
       /* the circle is constructed with a set of short lines so that the entire
        * figure can be transposed to the screen viewing angle */
       let dt = 0.05;
       for (let t=0; t<(pi2+dt); t=t+dt) {
          this.ds.z = bod.distance * bod.sini * Math.sin(t - bod.ascend);
          let xy = Math.sqrt(bod.distance * bod.distance - this.ds.z * this.ds.z);
          this.ds.x = xy * Math.cos(t);
          this.ds.y = xy * Math.sin(t);
          if (bod.method === 1) {this.ds.plus(bod.eccentre);}
          this.toScreen(this.ds);
          if (t===0) {this.ctx.moveTo(this.d2.x, this.d2.y);} else {this.ctx.lineTo(this.d2.x,this.d2.y);}
       }
       this.ctx.stroke(); 
       /* if eccentre method, draw vector from eccentre to planet */
       if (bod.method === 1) {
           this.ctx.strokeStyle = "#999999";
           this.ctx.beginPath();
           this.toScreen(bod.eccentre);
           this.ctx.moveTo(this.d2.x,this.d2.y);
           this.toScreen(bod.position);
           this.ctx.lineTo(this.d2.x, this.d2.y);
           this.ctx.stroke();
       }
    };    
    
    /* draw a line from a to b colour c */
    this.join = function (a, b, c) {
       this.ctx.strokeStyle = c;
       this.ctx.beginPath();
       this.toScreen(a);
       this.ctx.moveTo(this.d2.x,this.d2.y);
       this.toScreen(b);
       this.ctx.lineTo(this.d2.x, this.d2.y);
       this.ctx.stroke();
    };
        
    /* draw celestial sphere */
    this.doStars = function(r) {
        this.ctx.beginPath(); 
        let pat = this.ctx.createPattern(this.starImage, "repeat");
        this.ctx.strokeStyle = pat;
        this.ctx.lineWidth = "9";
        this.ctx.arc(this.centx, this.centy, r*this.scale/2, 0, 2 * Math.PI);
        this.ctx.stroke(); 
        this.ctx.lineWidth = "1";
        
    };
    
     // canvas has been resized
     this.reSize = function() {
        reDraw = true;                      // everything will have to be redrawn
        
       /* get current size of window */
        var winwid = window.innerWidth;
        var winht  = window.innerHeight;
       /* set display a bit smaller than window */
        this.canvas.width = winwid;
        this.canvas.height= winht;
        this.ctx = this.canvas.getContext("2d");
       /* set width and height */ 
        this.width = this.canvas.width;
        this.height = this.canvas.height;
       /* set default centre */ 
        this.centy = (this.canvas.height/2);                         
        this.centx = (this.canvas.width/2); 
       /* set font size (needs to be reset after a canvas resize) */
        this.ctx.font = "12px Verdana";
     };
     
}

/* Planet object hold properties of planet and may used for other symbols
 * that need to be drawn.
 * @param {type} name
 * @param {type} colour
 * @param {type} size
 * @param {type} rad
 * @param {type} per
 * @param {type} inc
 * @param {type} ascen
 * @returns {Planet}
 */
function Planet (name, colour, size, rad, per, inc, ascen) {
    this.name = name;
    this.colour = colour;
    this.tColour = colour;
    this.tOffset = new ScreenPoint(8,8);
    this.size = size;
    this.position = new CosmoPoint(0,0,0);
    this.eccentre = new CosmoPoint(0,0,0);
    this.method = 1;               // 1 has eccentre
    this.period = per;             // orbital period in years
    this.distance = rad;           // radialus deferent(R)
    this.e;                        // eccentricity
    this.ga;                       // eccentric angle
    this.incl = inc;               // inclination
    this.ascend = ascen;           // ascending node;
    this.anomaly;                  // current anomaly (radians)
    this.longAtEpoch;              // mean longitude at epoch
    this.meanDailyMotion;          // Mean daily motion
    this.orbit = new Circle();
    /* trig functions pre-calculated */
    this.coso = Math.cos(this.ascend);
    this.sino = Math.sin(this.ascend);
    this.cosi = Math.cos(this.incl);
    this.sini = Math.sin(this.incl);
  
    /* Calculate position of this object */
    this.doPosition = function (elapseYears, adjust) {    
        this.anomaly = (adjust + this.longAtEpoch + elapseYears * year * this.meanDailyMotion) % pi2;       
        if (this.method === 1) {
            this.position.z = this.distance * this.sini * Math.sin(this.anomaly - this.ascend);
            let xy = Math.sqrt(this.distance * this.distance - this.position.z * this.position.z);
            this.position.x = xy * Math.cos(this.anomaly);
            this.position.y = xy * Math.sin(this.anomaly);
            this.position.plus(this.eccentre);
        }
    };
}

/***********************************************************************
 * 
 *        Objects to be drawn on the screen.
 * @param {char} name 
 * @param {#rrggbb} colour
 * @param {integer} size of planet drawing
 * 
 */


function Line (start, end, colour) {
    this.x = start;
    this.y = end;
    this.colour = colour;
}
 
function Circle () {
    this.centre = new CosmoPoint(0,0,0);
    this.radius;
    this.colour;
}

function toRadians (deg) {
    return deg*Math.PI/180;
}
  