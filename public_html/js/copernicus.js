/* 
 *   Cosmos is a web application to display models of the Solar System as
 * envisaged by ancient philosophers such as Ptolemy and Copernicus. 
 *   
 * This script file contains function to define each planet, calculate orbits
 * and control the drawing.This version is based on Copernicus's De 
 * Revolutionibus.
 * 
 * Planet Numbers are:
 * 11 The Tusi Couple as used by Copernicus
 * 
 * 
 */

/* global pi2, display, elapse */
    var planet;                         // the planet currently being processed
    var outer = 75;                  // the radial position of vernal and node symbols
    var xy = new CosmoPoint(0,0,0);      // working areas for calculation
    var planetPosition = new CosmoPoint(0,0,0);
    
 /* ***************************************************************************
 * This function populates the Planets objects and sets planet properties as
 * described in De Revolutionibus.
 * 
 * A deferent, equant and epicycle are created for those planets that 
 * need them. 
 *
 */
function setUpPlanets(n) {
    planet = n;
    
     /* longitude of ascending node, ☊, set up to appear on outer ring */
     ascnd   = new Symbol(" ☊","#ffffff",1);
     ascnd.R = outer;
     
    switch(planet) {   
    case 11: 
        // Tusi Couple is not an actual planet but shows how straight line occillation
        // can be produced by a circle-on-circle rotating with uniform motion.
                   
      rate = 0.05; // default animation rate
      circle1 = new Symbol("A","#aaaa00",1);
      circle1.R = outer; circle1.meanMotion = toRadians(0.9856352784);
      circle2 = new Symbol("B","#00aaaa",1);
      circle2.R = outer/2; circle2.meanMotion = - circle1.meanMotion;
      break;
    }
}
    
/***************************************************************************** 
 * Calculates the positions of the objects in 3D space then call functions 
 * of the display object to show them on the screen.
 * 
 * @param {number} elapse Elapse time in days since the epoch.
 */
function doAnimation(elapse) {
    switch(planet) {
        
        case 11: // Tusi Couple
           // draw the outer circle 
            doAnomaly(circle1, elapse, 1);  doPosition(circle1);
            display.drawOrbit(circle1, 0); // draw deferent orbit and draw radius
            display.drawPlanet(circle1,0);
          
           // calc position of centre of small circle
            circle2.D.copy(circle1.P);
            circle2.D.minus(circle1.D);
            circle2.D.mult(0.5);
            circle2.D.plus(circle1.D);
            
           // draw small circle and lines 
            doAnomaly(circle2, elapse, 1); doPosition(circle2);
            display.drawOrbit(circle2, 0); // draw deferent orbit and draw radius
            display.drawPlanet(circle2,0);
            display.join(circle1.D, circle2.P, "#ffffff");
            display.join(circle2.D, circle2.P, circle2.colour);
            display.join(circle1.D, circle1.P, circle1.colour);
            break;
    }
}

function doAnomaly(p,elapse, method) {
    switch(method)  {
        case 1: // uniform motion round centre
            p.anomaly = (p.longAtEpoch + elapse * p.meanMotion) % pi2;
                break;
        case 2: // round deferent with uniform motion as seen from E
            p.anomaly = equant.anomaly;
            p.anomaly-=Math.asin(p.e*Math.sin(p.anomaly - lamdaA.anomaly)/p.R);
            break;
        case 3: // parallel to Earth->Sun direction
            p.anomaly = meanSun.anomaly;
            break;
        case 4: // go round deferent with uniform motion as seen from Earth 
            p.anomaly = equant.anomaly;
            p.anomaly+=Math.asin(p.e*Math.sin(p.anomaly - lamdaA.anomaly)/p.R);
            break;
        case 5: // uniform relative to vector prosneusis->C
            p.anomaly = (Math.atan2(deferent.P.y-prosneusis.P.y, deferent.P.x-prosneusis.P.x));
            p.anomaly+= (p.longAtEpoch + elapse * p.meanMotion) % pi2;
            break;
        case 6: // uniform relative to vector E-C 
            p.anomaly = Math.atan2(deferent.P.y-equant.D.y, deferent.P.x-equant.D.x);
            p.anomaly+= (p.longAtEpoch + elapse * p.meanMotion) % pi2;
            break;
        case 7: // on deferent with moving centre, uniform seen from E (Mercury)
           // get the length and longitude of E->D
            let ED = equant.D.dist(deferent.D); // length of ED
            let lamED = Math.atan2(deferent.D.y-equant.D.y, deferent.D.x-equant.D.x);
           // use sine rule in triange CED to get longitide of E->C
            let beta =equant.anomaly - lamED; 
            let alpha = Math.asin(ED/deferent.R * Math.sin(beta));
            deferent.anomaly = equant.anomaly + alpha;
            break;
    }
}
    /* calculate 3D position from current anomaly */
function doPosition(p) {
   // distance of current anomaly from ascending node needed for Z coordinate
   let dNode = Math.sin(p.anomaly-ascnd.anomaly);     //distance of node from anomaly
   // calc 3D coordinates from basic trig
    p.P.z = p.R * Math.sin(p.inc) * dNode;             
    p.P.x = p.R * Math.cos(p.anomaly);
    p.P.y = p.R * Math.sin(p.anomaly);
   // shift position for centre not=Earth
    p.P.plus(p.D);   //(this used to be p.D)
}
