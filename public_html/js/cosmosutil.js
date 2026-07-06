/*****************************************************************************
 * Cosmos is a web application to display models of the Solar System as
 * envisaged by ancient philosophers such as Ptolemy and Copernicus. 
 * 
 * This script file contains utility function related to calculation of
 * orbits and drawing images.
 */ 
/* global pi2, planets, earth, JDEpoch, outer */
var showNames;              // show planet Names in the display or not
var drawOrbits;             // draw orbits or not

/******************************************************************************
 *                             CosmoPoint 
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
/*******************************************************************************
 *                             ScreenPoint        
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
 * This is the display screen with methods to draw circles, lines and planets
 */
function Screen() {
    this.canvas = document.getElementById("layer1"); // The canvas in the DOM
    this.ctx = this.canvas.getContext("2d");         // The drawing contxt  
    this.reDraw = true;         // when true everything needs to be redrawn
    
   /* width & height of canvas should be based on screen width. The html page 
    * should be designed to have the diagram occupying about 70% of the width */ 
    this.width = Math.round(0.70 * window.innerWidth);
    this.height = this.width;      // diagram is square
    this.oldWidth = this.width;  // record screen size at startup
    
    this.scale=3  ;           // default scale in pixels per Ptolemy's "parte" 
    this.oldScale=this.scale; // scale when we started 
    
    this.centx;           // centre of the animation x and y pixels
    this.centy;
    
    this.up=0;            // user control values up, left, tilt, rotate
    this.left=0;
    this.tilt=0;
    this.rotate=0;
    
    this.sinr;            // sin and cos of rotate and tilt angles 
    this.cosr;            // are pre-calculated by the doAngles function
    this.sint;
    this.cost;
    
    
    // working areas for transpositions of 3D and 2D points. 
    this.ds = new CosmoPoint(0,0,0);   // 3d space position of orbit or point
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
        this.ctx.fillStyle = "#05052f";
        this.ctx.beginPath();
        this.ctx.rect(0,0,this.width,this.height);
        this.ctx.fill();
    };
  
    // convert a 3D space coord to a 2D screen pixel coord
    this.toScreen = function (space) {
       // rotate 3D space coord according to user rotate control
        this.d3.y = space.y * this.cosr - space.x * this.sinr;     
        this.d3.x = space.x * this.cosr + space.y * this.sinr;
        this.d3.z = space.z;  
       
        // convert 3D space to 2d screen point with scale, tilt, up and left. 
        this.d2.x =  this.centx - this.left + (this.scale * this.d3.x);    
        this.d2.y = this.centy - this.up 
                -(this.scale * (this.cost*this.d3.y + this.sint*this.d3.z));  
    };  
    
    /** draw a point with name and optional line from Earth.
     * @param {string} name Name of the entity.
     * @param {object} position 3D space position of entity.
     * @param {colour} colour to draw entity.
     * @param {boolean] join if true draw a line from Earth to the entity. 
     */
    this.drawPoint = function(name,position,colour,join) {
        this.ctx.fillStyle = colour;   
        this.ctx.beginPath();             
        this.toScreen(position);   // position of body to screen coords
        this.ctx.arc(this.d2.x, this.d2.y, 2, 0, pi2);
        this.ctx.fill();
        if (showNames) {        // draw body name if required
            this.ctx.strokeStyle  = colour;
            this.ctx.fillText(name ,this.d2.x+2+2, this.d2.y+2);
            this.ctx.globalCompositeOperation = "source-over";
        }
        if (join) {
            this.ctx.beginPath();
            this.toScreen(planets[earth].P);
            this.ctx.moveTo(this.d2.x,this.d2.y);
            this.toScreen(position);
            this.ctx.lineTo(this.d2.x, this.d2.y);
            this.ctx.stroke();
        }
    };
    
    /**
     * Draw a planet with its name (also used to draw any point or node that
     * needs to have body or name). Position, colour etc are obtained from
     * the Symbol object.
     * 
     * @param {object} bod The Symbol object to be drawn.
     * */
    this.drawPlanet = function (bod) {
       /* convert bod.P to screen position and scale body size */
        this.toScreen(bod.P); 
        let pSize = Math.max(bod.size * this.scale/this.oldScale,1); 
        
       /* draw body using bod.colour */ 
        this.ctx.fillStyle = bod.colour;   
        this.ctx.beginPath();              
        this.ctx.arc(this.d2.x, this.d2.y, pSize, 0, pi2);         
        this.ctx.fill();
        
       /* draw body name if required */ 
        if (showNames) {    
          this.ctx.strokeStyle  = bod.colour;
          this.ctx.fillText(bod.name ,this.d2.x+2 + pSize, this.d2.y+2);
          this.ctx.globalCompositeOperation = "source-over";
        }
    };
    
    /**   
     * Draw a deferent, equant or epicycle circle and the name of its 
     * central point.
     * @param {object} bod The Entity object owning the circle.
     * @param node Longitude of ascending node.
     **/
    this.drawOrbit = function (bod, node) {
       if (!drawOrbits) return;           // quit of no orbit required
       bod.sini = Math.sin(bod.inc);
       this.ctx.strokeStyle = bod.colour; // using body colour
       this.ctx.beginPath();              // start drawing
       
        /* the circle is constructed with a set of short lines so that the entire
         * figure can be transposed to the screen viewing angle with rotate, 
         * tilt, up, left and scale. */
      
       let dt = 0.1;   // this should be small enough that the circles look OK
       for (let t=0; t<(pi2+dt); t=t+dt) {
          // space Z is based on distance and ascending node
           this.ds.z = bod.R * bod.sini * Math.sin(t - node);
          // space X, Y are based on sin and cos of angle round the circle
           let xy = Math.sqrt(bod.R * bod.R - this.ds.z * this.ds.z);
           this.ds.x = xy * Math.cos(t);
           this.ds.y = xy * Math.sin(t);
          // the circle is centred on point D
           this.ds.plus(bod.D);  
          // convert to screen coordinate and draw the arc (except first point)
           this.toScreen(this.ds);
           if (t===0) {this.ctx.moveTo(this.d2.x, this.d2.y);
           } else {this.ctx.lineTo(this.d2.x,this.d2.y);}
       }
       this.ctx.stroke(); // draw the circle
       if (showNames) {   
          this.toScreen(bod.D);
          this.ctx.fillStyle  = bod.colour;
          this.ctx.fillText(bod.name ,this.d2.x+2 + 2, this.d2.y+2);
          this.ctx.globalCompositeOperation = "source-over";
        }
    };    
    
    /** draw a line from the centre of a to the planet of b 
     * @param {Entity} a The centre of the deferent of a is one end of the line.
     * @param {Entity} b The location of the planet of b is other end of line. 
     * @param {strokestyle} c The style of stroke to draw.
     * */
    this.join = function (a, b, c) {
       this.ctx.strokeStyle = c;
       this.ctx.beginPath();
       this.toScreen(a);
       this.ctx.moveTo(this.d2.x,this.d2.y);
       this.toScreen(b);
       this.ctx.lineTo(this.d2.x, this.d2.y);
       this.ctx.stroke();
    };
        
    
    // canvas has been resized 
    this.reSize = function() {
        reDraw = true;         // everything will have to be redrawn
       /* get new window size */ 
        this.width = Math.round(0.65 * innerWidth);
        this.height = Math.round(0.75 * innerHeight);
        
       /* align canvas, graphics and text to the same size */
        this.ctx.width = this.width;
        this.ctx.height = this.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
       /* set scale to fit canvas */
        this.scale = this.oldScale * this.width/this.oldWidth;
        
       /* set default centre */ 
        this.centy = (this.ctx.height/2);                         
        this.centx = (this.ctx.width/2); 
        
       /* set font size (needs to be reset after a canvas resize) */
        this.ctx.font = "12px Verdana";      
     };
    
    // Draw the Julian Day number, longitude and latitude 
    this.drawInfo = function (elapse, long, lat, q, n) {
       this.ctx.fillStyle  = "#ffffaa";
       let text = "Elapse: ";
       let jd = elapse;
       text += jd.toFixed(5);
       text += " Long: " + toDegrees(long).toFixed(2) + "° ";
       text += " Lat: " + toDegrees(lat).toFixed(2) + "° ";
       text += " MeanSun: " + toDegrees(q).toFixed(2) + "° ";
       text += "\n Node: " + toDegrees(n).toFixed(2) + "° ";
       this.ctx.fillText(text,20, this.height-20);
    };
}



/*******************************************************************************
 * A Symbol is any object to be drawn on the screen. It can be a planet, 
 * the vernal equinox or other symbol in the outer ring or any of the various
 * circular constructs in the orbit diagram.
 * * 
 * @param n Name or text of the symbol.
 * @param c Colour of the symbol.
 * @param s Size of displayed planet or object in pixels.
 * @returns (Symbol)
 */
function Symbol(n,c,s) {
    /* general attributes */
     this.name = n;                       // name or text of symbol/planet
     this.colour = c;                      // colour
     this.size = s;                          // size of planet/point symbol
    
    /* attributes of a circular construct */ 
     this.P = new CosmoPoint(0,0,0); // 3D position of point on circumference 
     this.D = new CosmoPoint(0,0,0); // 3D coordinates of centre
     this.R = outer;                 // radius of circlular construct
     
    /* relates to motion of a point around the circle */ 
     this.anomaly = 0;                      // current longitude
     this.longAtEpoch =0;;               // longitude at epoch
     this.meanMotion = 0;;               // daily motion of longitude
     
    /* relates the inclination of the plane of the symbol */
     this.inc = 0;                   // inclination to  plane of ecliptic
    
 
    /* function to copy the plane of symbol s */
     this.copyPlane = function(s) {
         this.anomaly = s.anomaly;
         this.longAtEpoch = s.longAtEpoch;
         this.meanMotion = s.meanMotion;
         this.inc = s.inc;
     } ;
}



// funtions to convert to/from degrees/radians
    function toRadians (deg) { return deg*Math.PI/180;}
    function toDegrees (rad) { return rad*180/Math.PI;}

// override the % funtion to handle negative numbers correctly
Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};
  
