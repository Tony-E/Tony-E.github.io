
/* 
 * This script shows the Sun according to Ptolemy's Almagest.
 */
/* global pi2, display, elapse */
var year = 365.246667;           // Days in tropical year

/* Planet object takes parameters:  (name, colour, size, rad, per, inc, ascen)*/
function setUpPlanets() {
   /* Earth spheres */
    earth = new Planet("", "#663300", 3, 0,0,0);
    water = new Planet("", "#8888ff", 6, 0,0,0);
    air   = new Planet("", "#aabbcc", 8,0,0,0);
    fire  = new Planet("Earth", "#f58f00", 10,0,0,0);
  
    /* Sun has eccentre 1/24 of radius and Aspsides at 65.5 degrees */
    sun   = new Planet("Sun","#ffff00", 8, 1, 1, 0, 0);
    sun.eccentre.setValue(0.017276,0.037915,0);
    sun.longAtEpoch = 5.764061;       // Sun longitude at epoch t0 (radians)
    sun.meanDailyMotion = 0.01718376; // Mean daily motion radians per day
 
    /* ec is a dummy planet to draw the eccentre */
    ec = new Planet("E","#ffff00",1,0,0,0);
    ec.position = sun.eccentre;
    
    /* longa is a dummy planet to draw longitude of eccentre */
    longa = new Planet("λa", "#ffffff",0,0,0,0);
    longa.position.setValue(0.49762, 1.1995, 0);
    
    /* eq is a dummy planet for the vernal equinox */
    eq = new Planet("ϒ","ffffff",0,0,0,0);
    eq.position.setValue(1.2,0,0);
    
    //moon  = new Planet("Moon","#fffddd",6,0.4,0.078,0.087,0);
    //mercury = new Planet("Mercury", "#dddddd", 6, 0.8 ,0.24,0,0);
    //venus = new Planet("Venus","#eeeeff", 7, 1.2, 0.62,0,0);
    //mars  = new Planet("Mars", "#ff0033", 6, 2.0, 1.88, 0.003, 0.495 );
    //jupiter = new Planet("Jupiter", "#aaddff", 7, 2.4, 11.9,0,0);
    //saturn = new Planet("Saturn", "#ddddff", 7, 2.8, 29.44,0,0);
    //stars
    planets = [ sun];
    
    
}


   /* draw the animation */     
    function doAnimation(elapse) {
       /* Draw Earth */
        display.drawPlanet(fire);
        display.drawPlanet(air);
        display.drawPlanet(water);
        display.drawPlanet(earth);
       /* Draw Longitude alpha and eccentre */
        display.drawPlanet(longa);
        display.drawPlanet(ec);
        display.join(earth.position, longa.position,"#999999");
        display.drawPlanet(eq);
        display.drawOrbit(eq);
       /* Draw Sun */ 
        sun.doPosition(elapse,0);
        display.drawPlanet(sun);
        display.drawOrbit(sun);
       /* Draw Earth-Sun vector */
        display.join(earth.position, sun.position, sun.colour);
    }
    
    /* Function to show multiple planets */
        function doShow(bod) {
            bod.doPosition(elapse);
            display.drawPlanet(bod);
            display.drawOrbit(bod);
    }
      


