/******************************************************************************
 * Cosmos is a web application to display models of the Solar System as
 * envisaged by ancient philosophers such as Ptolemy and Copernicus. 
 *   
 * This script file contains function to define each planet, calculate orbits
 * and control the drawing.This version is based on Ptolemy's Almagest.
 * 
 * Planet Numbers are:
 * 
 * Ptolemy
 * 0 Earth (+  Water, Air & Fire)
 * 1 Mercury
 * 2 Venus
 * 3 Sun
 * 4 Moon
 * 5 Mars
 * 6 Jupiter
 * 7 Saturn
 * 
 */

/* global pi2, display, elapse */
    var planet;                         // the planet currently being processed
    var outer = 75;                     // the radial position of vernal and node symbols
    var xy = new CosmoPoint(0,0,0);     // working areas for calculation
    var planetPosition = new CosmoPoint(0,0,0);
    var mStars = toRadians(0.000027378);    // 1 deg/century for motion of stars.
    
/* ***************************************************************************
 * This function populates the Planets objects and sets planet properties as
 * described in Pedersen (mainly pp 423-429) or from the text.
 * 
 * A deferent, equant and epicycle are created for those planets that 
 * need them. 
 *
 */
function setUpPlanets(n) {
    planet = n;
    
    /* Earth, Water, Air and Fire are always set up with default positions */
     earth = new Symbol("","#663300",1);
     water = new Symbol("","#8888ff",2);
     air   = new Symbol("","#aabbcc",3);
     fire  = new Symbol(" Earth","#ffffff",4);
   
    /* vernal equinox symbol is always set up with fixed position */
     vernal  = new Symbol(" ϒ","#ffffff", 1); vernal.P.setValue(outer,0,0);
        
    /* meanSun is always set up with epoch and mean motion */
     meanSun = new Symbol("λm☉","#ffff00",1);
     meanSun.R=outer;
     meanSun.longAtEpoch = toRadians(330.75); 
     meanSun.meanMotion = toRadians(0.9856352784);
        
    /* longitude of apogee, λa, always set up to appear on outer ring */
     lamdaA  = new Symbol(" λa","#ffffff",1); 
     lamdaA.R = outer;
        
    /* longitude of ascending node, ☊, set up to appear on outer ring */
     ascnd   = new Symbol(" ☊","#ffffff",1);
     ascnd.R = outer;
    
    /* all planets have a deferent with centre D */          
     deferent = new Symbol("D","#00ffff",1);
        
    /* some planets have an equant with centre E */
     equant   = new Symbol("E","55ff55",1);
        
    /* most planets have an epicycle with centre S */
     epicycle = new Symbol("C","#aaaaff",1);
        
    /* point F special point in Mercury diagram */
     pointF = new Symbol("F","#ffffffF",1);
        
    /* point S is a point on an equant circle that defines uniform motion */
     pointS = new Symbol("S","ffaa00",1);
    
    /* depending on which planet is selected, additional symbols are set up and
     * deferent, equant and epicycle symbols are given appropriate parameters
     */ 
    switch(planet) {   
    case 1: // Mercury
      rate = 0.01; // default animation rate
      mercury = new Symbol("Mercury","#aaaaff",4);
      
     /* λa is fixed relative to the stars */
      lamdaA.longAtEpoch = toRadians(181.1666);
      lamdaA.meanMotion = mStars;     // 1 deg/century   
      lamdaA.inc = toRadians(0.166);
     
     /* Ω is fixed reelative to the stars and 90° behind  λa  */
      ascnd.longAtEpoch = lamdaA.longAtEpoch + toRadians(90.0); 
      ascnd.meanMotion = mStars;
     
     /*  deferent with parameters from OP */       
      deferent.longAtEpoch = toRadians(330.61);
      deferent.meanMotion = toRadians(0.9856352784);
      deferent.R=60; deferent.e=3.0; 
      deferent.inc = lamdaA.inc;
     
     /* equant similar to deferent (but different centre) */       
      equant.copyPlane(deferent); equant.inc = lamdaA.inc;
      equant.R=60;  equant.e=3.0;     
     
     /* point F centre of small circle around which deferent centre rotates */
      pointF.copyPlane(deferent);
      pointF.R = 3.0; pointF.size=1; pointF.name="F";
      pointF.longAtEpoch = toRadians(330.75);
      pointF.meanMotion =toRadians(-0.9856352784);
     
     /* epicycle has incl 6.5 greater than deferent */
      epicycle.R=22.5; 
      epicycle.inc = toRadians(6.5 + 0.166); 
      epicycle.longAtEpoch=toRadians(21.916);
      epicycle.meanMotion=toRadians(3.1066990430);
      
      break;
        
    case 2:  //Venus
      rate = 0.02;
      venus = new Symbol("Venus","#aaffff",5);
      
     /* lamdaA fixed relative to stars */ 
 
      lamdaA.longAtEpoch = toRadians(46.1666);
      lamdaA.meanMotion = mStars; // moves with the stars
      lamdaA.incl = toRadians(0.1666); // inclination same as deferent 
      
     /* node is 90 deg behind lamdaA and fixed to stars  */    
      ascnd.longAtEpoch= lamdaA.longAtEpoch + toRadians(90);
      ascnd.meanMotion= mStars;
     
     /* deferent with params from OP */
      deferent.longAtEpoch = toRadians(330.75);
      deferent.meanMotion =toRadians(0.9856352784);
      deferent.R=60; deferent.e=1.25;
      deferent.inc = lamdaA.inc;
      
     /* equant  shown only in outer ring */
      equant.copyPlane(deferent);
      equant.colour = "00ff00";
      equant.e=2*deferent.e; equant.R = 60;
      equant.inc = lamdaA.inc;
     
     /* epicycle with different inclination  */
      epicycle.R=43.1666;
      epicycle.inc=toRadians(3.5 + 0.1666);
      epicycle.longAtEpoch=toRadians(71.1166);
      epicycle.meanMotion=toRadians(0.6165087339);
       
      break;
       
    case 3: //Sun 
      sun  = new Symbol("Sun","#ffff00",8);      
      
     /* λa is fixed at 65°.5 */ 
      lamdaA.longAtEpoch = toRadians(65.5);      
      lamdaA.meanMotion = 0;  
     
     /* the deferent has a fixed centre at 1/24th of deferent radius */ 
      
      deferent.D.setValue(1.036733107,2.274903177,0);  // deferent fixed eccentre
      deferent.longAtEpoch = toRadians(330.75);        // radix of mean Sun - 2°.38.
      deferent.meanMotion = meanSun.meanMotion;        // Sun's mean daily motion
      deferent.R=60;                                   // standard radius
  
      break;
        
    case 4: // Moon
      rate = 10E-4; // default animation rate  for the Moon
      moon = new Symbol("Moon","#b3ffff", 5);
          
     /* the mean moon rotates round Earth in synodic period */
      meanMoon = new Symbol(" λm☾","#b3ffff", 1); 
      meanMoon.longAtEpoch = toRadians(70.61666); // radix in elongation 
      meanMoon.R=outer; 
      meanMoon.meanMotion = toRadians(12.190746937); //synodic rel mean Sun  
      meanMoon.inc = toRadians(5.0);
     
     /* No epoch data for λa. Calculated from λm☾ and λm☉ */
      lamdaA.inc = meanMoon.inc;
      
     /* the ascnding node moves slowly retrograde */
      ascnd.longAtEpoch = toRadians(354.25);
      ascnd.meanMotion = toRadians(-0.0529687836);
      
     /* the deferent */ 
      deferent.copyPlane(meanMoon);
      deferent.R = 49.683333; deferent.e = 10.316666;
      
     /* the Moon's epicycle */ 
      epicycle.R = 5.25; 
      epicycle.longAtEpoch = toRadians(90); //OK
      epicycle.meanMotion = -toRadians(13.0649828601);// anomalistic
      
     /* the Moon also has a prosneusis D' */
      prosneusis = new Symbol("D'","#ffee66", 1);
      prosneusis.inc=toRadians(5.0);
    
      break;
        
        
    case 5: //Mars
        rate = 0.002; // set default animation rate for Mars
        mars = new Symbol("Mars","#ff5555",6);
        
       /* λa is fixed relative to the stars with inclination 1.85° and
        * with the same motion as the stars i.e 1 degree/century              */
        lamdaA.longAtEpoch = toRadians(106.6667); 
        lamdaA.meanMotion = mStars; 
        lamdaA.inc = toRadians(1.83);
      
       /* The node line for inclination also moves with the stars and is 
        * 85°.5 behind λa.                                                 */
        ascnd.longAtEpoch = lamdaA.longAtEpoch - toRadians(85.5);
        ascnd.meanMotion = lamdaA.meanMotion;
        
       /* The deferent has parameters a/c text. */ 
        deferent.R=60; deferent.e=6.0; deferent.inc = lamdaA.inc;
        
       /* The equant motion drives position of epicycle */
        equant.copyPlane(deferent); equant.inc = lamdaA.inc;
        equant.longAtEpoch = toRadians(3.5333); 
        equant.meanMotion = toRadians(0.5240597114);
        equant.R=60;  equant.e=12;
       
       /*epicycle parameters a/c text and plane is parallel to ecliptic */  
        epicycle.R=39.5; epicycle.incl=0; 
        epicycle.longAtEpoch=toRadians(327.2166);
        epicycle.meanMotion=toRadians(-0.4615755671);
       
        break;
        
    case 6: //Jupiter
        rate = 0.04;  // default animation rate for Jupiter
        jupiter = new Symbol("Jupiter","#ffaaff", 8);
        
       /* λa is fixed relative to the stars with inclination 1° and
        * with the same motion as the stars i.e 1 degree/century              */
        lamdaA.longAtEpoch = toRadians(152.15);
        lamdaA.meanMotion = mStars; // 1° per century
        lamdaA.inc = toRadians(1.5); // value from Hypothesis
        
       /* The node line moves with the stars and is 71° behind λa.   */
        ascnd.longAtEpoch = lamdaA.longAtEpoch - toRadians(71.0);
        ascnd.meanMotion = mStars;
        
       /* The deferent has parameters a/c text. */   
        deferent.R=60; deferent.e=2.75; deferent.inc = lamdaA.inc;
       
       /* The equant motion drives positio of epicycle centre */
        equant.copyPlane(deferent); equant.inc = lamdaA.inc;
        equant.longAtEpoch = toRadians(184.68333);
        equant.meanMotion = toRadians(0.0831224364);
        equant.R=60;  equant.e=2*deferent.e;
        
       /* epicycle parameters a/c text and plane is parallel to ecliptic */    
        epicycle.R = 11.5; epicycle.incl=0; epicycle.sini=0;
        epicycle.longAtEpoch=toRadians(146.0666);
        epicycle.meanMotion=toRadians(0.9025128421);
    
        break;    
        
    case 7: //Saturn
        rate = 0.04; // default animation rate for Saturn
        saturn = new Symbol("Saturn","#aaffff", 7);
        
       /* λa is fixed relative to the stars with inclination 1° and
        * with the same motion as the stars i.e 1 degree/century              */
        lamdaA.longAtEpoch = toRadians(224.166);
        lamdaA.meanMotion = toRadians(0.000027378); // 1° per century
        lamdaA.inc = toRadians(2.5); // value from Hypotheses
        
       /* The node line for inclination also moves with the stars and is 
        * 143° behind λa, (from Hypotheses).                       */
        ascnd.longAtEpoch = lamdaA.longAtEpoch - toRadians(143.0);
        ascnd.meanMotion = lamdaA.meanMotion;
        
       /* The deferent has parameters a/c text. */   
        deferent.R=60; deferent.e=3.4166; deferent.inc = lamdaA.inc;
       
        
       /* The equant is similar to the deferent but with different centre */
        equant.copyPlane(deferent); equant.inc = lamdaA.inc;
        equant.R=60;  equant.e=2*deferent.e;
        equant.longAtEpoch = toRadians(296.71666); 
        equant.meanMotion = toRadians(0.0334885402);
        
       /* epicycle parameters a/c text and plane is parallel to ecliptic */    
        epicycle.R = 6.4155; epicycle.incl=0; epicycle.sini=0;
        epicycle.longAtEpoch=toRadians(34.033);
        epicycle.meanMotion=toRadians(0.9521467383);  
   
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
 /* Draw Earth and vernal equinox always */ 
    display.drawPlanet(fire);
    display.drawPlanet(air);
    display.drawPlanet(water);
    display.drawPlanet(earth);
    display.drawPlanet(vernal);
    display.join(earth.P,vernal.P,"#555555");
    
 /* Always calc position of mean Sun and show it */   
    doMean(meanSun,elapse);                   // calc position and show
  
 /* Draw the selected planet */   
    switch(planet) {
        
        case 1: // Mercury
        
         /* show lamdaA and node lines */
            doLamdaA(elapse); // calc position of λa and show 
            doNode(elapse);   // calc longitude ascending node and show  
            
          /* calc location of equant, show it with point S traveling round */ 
            doEquant(elapse); // draw equant 
            pointS.P.copy(equant.P);
            display.drawPlanet(pointS, ascnd.anomaly);
        
          /* point F is in the centre of a small circle carrying point D*/
            doPointF();             
     
          /* deferent centre is rotating round point F  */
            deferent.D.copy(pointF.P);         
            doAnomaly(deferent,elapse,7);
            doPosition(deferent);            // 3D position of planet/epicycle
            display.drawOrbit(deferent, ascnd.anomaly);     
            display.join(deferent.P,deferent.D, deferent.colour);
            
          /* calc and draw epicycle and planet. Save planet position  */       
            doEpicycle(6);
            mercury.P = epicycle.P;
            display.drawPlanet(mercury);
            planetPosition.copy(mercury.P);
            
            break;
            
        case 2: // Venus
            
          /* show lamdaA and node lines */
            doLamdaA(elapse); // calc position of λa and show 
            doNode(elapse);   // calc longitude ascending node and show  
            
          /* calc location of equant, show it with point S traveling round */ 
            doEquant(elapse); // draw equant 
            pointS.P.copy(equant.P);
            display.drawPlanet(pointS, ascnd.anomaly);
            
         /* deferent position based on uniform motion seen from E */
            doDeferent(2);             // calc position of D and draw deferent
            display.join(earth.P, deferent.P, venus.colour);            
            display.join(deferent.P, deferent.D, deferent.colour);
            
         /* epicycle position based on vector E-C  */   
            doEpicycle(6);
         
         /* show and save planet */
            venus.P = epicycle.P;
            display.drawPlanet(venus);
            planetPosition.copy(venus.P);
            
            break;
       
        case 3: // Sun
           /* draw (fixed) lamdaA and join to Earth */
            doLamdaA(elapse);
            
           /* calc position of Sun round deferent  and draw dererent */
            doAnomaly(deferent,elapse,1);   // anomaly of point round deferent
            doPosition(deferent);           // 3D position of Sun on deferent
            display.drawOrbit(deferent, 0); // draw deferent orbit and draw radius
            display.join(deferent.D, deferent.P, deferent.colour);
           
            /* Sun is at position P on the deferent */
            sun.P.copy(deferent.P);         // set position of Sun
            display.drawPlanet(sun);        // display Sun  
            display.join(deferent.P, earth.P, sun.colour);  // join to Earth
            planetPosition.copy(sun.P);     // save position for info display    
            break;
            
        case 4: // Moon
           /* mean Moon provides uniform motion relative to λm☉ */ 
            doAnomaly(meanMoon,elapse,1);      
            meanMoon.anomaly+=meanSun.anomaly;
            doPosition(meanMoon);        
            display.drawPlanet(meanMoon);
            display.join(earth.P, meanMoon.P, "#aaaaaa");  
          
            /* λa calculated from fact λm☉ bisects angle between λa and λm☾ */ 
            lamdaA.anomaly = 2*meanSun.anomaly-meanMoon.anomaly;      
            doPosition(lamdaA);
            display.drawPlanet(lamdaA);
            display.join(earth.P, lamdaA.P, lamdaA.colour);
            
           /* ascending node  */ 
            doNode(elapse);        
           
           /* equant anomaly = meanMoon so that deferent picks up vector from Earth */
            equant.anomaly = meanMoon.anomaly; //this to get the anomaly calc vs meanMoon
            
           /* deferent point on circumference is uniform seen from Earth */
            doDeferent(4);             // calc position of D and draw deferent 
            display.join(earth.P, deferent.D, moon.colour);            
            display.join(deferent.D, deferent.P, deferent.colour);
            
           /* prosneusis defines new vecor as basis for Moon round epicycle */ 
            doProsneusis();            // calc position of D' and show 
            doEpicycle(5);             // set up and draw epicycle
            
           /* draw Moon on epicycle and save */ 
            moon.P.copy(epicycle.P);
            display.drawPlanet(moon);
            display.join(earth.P, moon.P, moon.colour);
            planetPosition.copy(moon.P);
            
            break;
         
         case 5: // Mars
           /* show lamdaA and node lines */
            doLamdaA(elapse); // calc position of λa and show 
            doNode(elapse);   // calc longitude ascending node and show  
            
           /* calc location of equant, show it with pointS traveling round */ 
            doEquant(elapse); // draw equant 
            pointS.P.copy(equant.P);
            display.drawPlanet(pointS, ascnd.anomaly);
           
           /* calc deferent and show radial */ 
            doDeferent(2);    // calc position of D and draw deferent           
            display.join(deferent.D, deferent.P, deferent.colour);
          
            
           /* calc location and show epicycle and Mars */ 
            doEpicycle(3);
            mars.P.copy(epicycle.P);
            display.drawPlanet(mars);
            display.join(earth.P, mars.P, mars.colour);
            
           /* save position of Mars */ 
            planetPosition.copy(mars.P);
            break;
            
        
        
        case 6: // Jupiter
           /* show lamdaA and node lines */
            doLamdaA(elapse); // calc position of λa and show 
            doNode(elapse);   // calc longitude ascending node and show  
            
           /* calc location of equant, show it with pointS traveling round */ 
            doEquant(elapse); // draw equant 
            pointS.P.copy(equant.P);
            display.drawPlanet(pointS, ascnd.anomaly);
           
           /* calc deferent and show radial */ 
            doDeferent(2);    // calc position of D and draw deferent           
            display.join(deferent.D, deferent.P, deferent.colour);
          
            
           /* calc location and show epicycle and Mars */ 
            doEpicycle(3);
            jupiter.P.copy(epicycle.P);
            display.drawPlanet(jupiter);
            display.join(earth.P, jupiter.P, jupiter.colour);
            
           /* save position of Mars */ 
            planetPosition.copy(jupiter.P);
            break;
            
                
        case 7: // Saturn
           /* show lamdaA and node lines */
            doLamdaA(elapse); // calc position of λa and show 
            doNode(elapse);   // calc longitude ascending node and show  
            
           /* calc location of equant, show it with pointS traveling round */ 
            doEquant(elapse); // draw equant 
            pointS.P.copy(equant.P);
            display.drawPlanet(pointS, ascnd.anomaly);
           
           /* calc deferent and show radial */ 
            doDeferent(2);    // calc position of D and draw deferent           
            display.join(deferent.D, deferent.P, deferent.colour);      
            
           /* calc location and show epicycle and Mars */ 
            doEpicycle(3);
            saturn.P.copy(epicycle.P);
            display.drawPlanet(saturn);
            display.join(earth.P, saturn.P, saturn.colour);
            
           /* save position of Mars */ 
            planetPosition.copy(saturn.P);
            break;   
    }
      /* calc longitude for display */  
       let long = Math.atan2(planetPosition.y, planetPosition.x);  
       let dSun = (meanSun.anomaly); 
       if (long<0) long+=2*Math.PI;
      /* calc latitude for display */ 
       let lat = 0.0;
       if (planetPosition.z !== 0.0) 
                 {lat = Math.asin(planetPosition.z/planetPosition.mag());}
       display.drawInfo(elapse,long, lat, dSun, ascnd.anomaly);
}

/* calculate the longitude of the apogee (lamdaA) and draw the position */
function doLamdaA(elapse) { 
    lamdaA.anomaly = (lamdaA.longAtEpoch + lamdaA.meanMotion * elapse) %pi2;
    doPosition(lamdaA);
    display.drawPlanet(lamdaA);
    display.join(earth.P, lamdaA.P, lamdaA.colour);
}

/* calculate position of the eccentre, draw point D and the deferent circle */
function doDeferent(method) {
   // calc centre of deferent (D) direction  λa, distance e
    deferent.D.copy(lamdaA.P);             // D is along the line to λa
    deferent.D.div(outer/ deferent.e);     // D is distance e along line to λa
    doAnomaly(deferent,elapse,method);     // anomaly of point round deferent
    doPosition(deferent);                  // 3D position of planet/epicycle
    display.drawOrbit(deferent, ascnd.anomaly);     // draw deferent orbit
}

/* pre-calculate some trig rations for the planet */
function doTrig(p) {
    p.coso = Math.cos(p.node);
    p.sino = Math.sin(p.node);
    p.cosi = Math.cos(p.incl);
    p.sini = Math.sin(p.incl);
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

/* calculate current longitude of ascending node and draw it*/
function doNode(elapse) {
    ascnd.anomaly = (ascnd.longAtEpoch + elapse * ascnd.meanMotion).mod(pi2);  
    ascnd.P.setValue(Math.cos(ascnd.anomaly), Math.sin(ascnd.anomaly), 0);
    ascnd.P.mult(outer);
    display.drawPlanet(ascnd);
    display.join(earth.P, ascnd.P, "#9999ff");
}

/* calculate and show position of mean Sun or Moon */
function doMean(p,elapse) {
    doAnomaly(p,elapse,1);             // set anomaly of mean Sun
    doPosition(p);                     // calc 3D position of mean Sun
    display.drawPlanet(p);             // draw mean Sun symbol
    display.join(earth.P, p.P, "#999999"); // line Earth to mean Sun symbol
}

/* draw point C and epicycle */
function doEpicycle(method) {
    epicycle.D.copy(deferent.P);       // centre of epicycle is location on deferent
    doAnomaly(epicycle,elapse, method);// calc longitude
    doPosition(epicycle);
    display.drawOrbit(epicycle, ascnd.anomaly);
    display.join(epicycle.D,epicycle.P, epicycle.colour);
}

/* draw point D' for the moon, calc and show position of Moon */
function doProsneusis(p) {
   /* D' is locaded opposite the eccentric */  
    prosneusis.P.copy(deferent.D);
    prosneusis.P.mult(-1);
    
   /* Draw D' and connect it to Earth and the epicycle centre */ 
    display.drawPlanet(prosneusis); // draw the position
    display.join(epicycle.D, prosneusis.P, prosneusis.colour);
    display.join(earth.P, prosneusis.P, prosneusis.colour);
}

/* draw equant circle centre E and circumference S  */
function doEquant(elapse) {
    equant.D.copy(lamdaA.P);             // centre is along the line to λa
    equant.D.div(outer/ equant.e);       // centre is distance e from earth
    doAnomaly(equant,elapse,1);          // anomaly of vector round equant
    doPosition(equant);                  // 3D position of point "S"
    display.drawOrbit(equant,ascnd.anomaly);
    display.join(equant.D,equant.P,equant.colour);
}

/* Establish locations of F and path of point D. Unique to Mercury. */
function doPointF() {
   
   /* point F is centre of circle that point D rotates around 
    * Point F is 2e in direction of lamdaA                        */
    pointF.D.copy(lamdaA.P);           // F is 2e in direction lamdaA
    pointF.D.mult(2*deferent.e/outer);
  
   /* Anomaly of D round F is opposite of λa from equant anomaly */
    pointF.anomaly = lamdaA.anomaly-(equant.anomaly-lamdaA.anomaly);  
    doPosition(pointF);
    
   /* show ppoint F and its connection to D */
    display.drawPlanet(pointF);
    display.drawOrbit(pointF, ascnd.anomaly);
    display.join(earth.P,pointF.D,pointF.colour);
    display.join(pointF.D,pointF.P,pointF.colour);
}

/** anomaly using various methods 
 * Note that Ptolemy uses the word "anomaly" for multiple things. Here is
 * is used simply in the sense of angular distance round a circle. 
 * @param p The entity for which anomaly is to ne calculated.
 * @param elapse The elapse time in days since the epoch.
 * @param method The method of calculation (see doAnomaly).
 **/
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
