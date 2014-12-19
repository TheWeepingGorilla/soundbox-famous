 // ---------- Sound Params -----------------

var audioContext = new webkitAudioContext();
audioContext.sampleRate = 44100;

var Sound = {
  initialize: function(audioContext){
    this.osc = audioContext.createOscillator();
    this.osc.noteOn(0);
    this.osc.type = 'sawtooth';
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 0;
    this.osc.connect(this.gainNode);
    this.gainNode.connect(audioContext.destination);
    this.amp = 0;
  },
  makeSound: function(audioContext, pitch, wave, amp){
    this.osc.type = wave;
    this.osc.frequency.setValueAtTime(pitch, audioContext.currentTime);
    this.amp = amp;
    this.gainNode.gain.setValueAtTime(this.amp, audioContext.currentTime);
    this.gainNode.connect(audioContext.destination);
  },
  ampControl: function(audioContext, amount) {
    if (this.amp + amount > 1.0) {
      this.amp = 1.0;
      this.gainNode.gain.setValueAtTime(this.amp, audioContext.currentTime);
    }
    else if ((this.amp < .01) && ((this.amp + amount) >= .01)) {
      this.amp = this.amp + amount;
      this.gainNode.gain.setValueAtTime(this.amp, audioContext.currentTime);
      this.gainNode.connect(audioContext.destination);
    }
    else if ((this.amp + amount) < .01) {
      this.amp = 0;
      this.gainNode.gain.setValueAtTime(this.amp, audioContext.currentTime);
      this.gainNode.disconnect();
    }
    else {
      this.amp = this.amp + amount;
      this.gainNode.gain.setValueAtTime(this.amp, audioContext.currentTime);
    }
  }
},

wallSound0 = Object.create(Sound);
wallSound0.initialize(audioContext);
wallSound1 = Object.create(Sound);
wallSound1.initialize(audioContext);
wallSound2 = Object.create(Sound);
wallSound2.initialize(audioContext);
wallSound3 = Object.create(Sound);
wallSound3.initialize(audioContext);

// ----------- famo.us params ----------------

/* global setup */
define(function(require, exports, module) {
  // 'use strict';
  // import dependencies
  var Engine = require('famous/core/Engine');
  var Surface  = require('famous/core/Surface');
  var View = require('famous/core/View');

  var Transform = require('famous/core/Transform');
  var StateModifier = require('famous/modifiers/StateModifier');
  var Timer = require('famous/utilities/Timer');

  var PhysicsEngine = require ('famous/physics/PhysicsEngine');
  var Body = require('famous/physics/bodies/Body');
  var Circle = require('famous/physics/bodies/Circle');
  var Wall = require('famous/physics/constraints/Wall');

  var mainContext = Engine.createContext();
  var physicsEngine = new PhysicsEngine();

  // control panel setup

  var controlPanel = new Surface({
    size: [(window.innerWidth * .382), undefined],
    content: '<h2>Control Panel</h2>',
    properties: {
      color: 'white',
      textAlign: 'center',
      backgroundColor: '#FA5C4F'
    }
  });
  var controlPanelAlign = new StateModifier({
        align: [1,0],
        origin: [1, 0]
    });
  mainContext.add(controlPanelAlign).add(controlPanel);

  // Ball setup

  var ballArray = [];

  var Ball = {
    initialize: function(mag, dir, color) {
      this.surface = new Surface ({
        size: [50,50],
        properties: {
          backgroundColor: color,
          borderRadius: '200px'
        }
      });
      this.state = new StateModifier({origin:[.5,.5]});
      this.particle = new Circle({radius:20});
      physicsEngine.addBody(this.particle);
      this.setMagAndDir(mag, dir);
      mainContext.add(this.state).add(this.surface);
    },
    readMagnitude: function() {
      return Math.sqrt( ((this.particle.getVelocity()[0]) * (this.particle.getVelocity()[0])) + ((this.particle.getVelocity()[1]) * (this.particle.getVelocity()[1])) );
    },
    readDirection: function() {
      var direction = Math.atan2((-1 * this.particle.getVelocity()[1]), this.particle.getVelocity()[0]);
      direction = direction * (180 / Math.PI);
      if (this.particle.getVelocity()[1] > 0) {
        direction = direction + 360;
      }
      console.log("Direction Returned is: " + direction);
      return direction;
    },
    setMagAndDir: function(magnitude, angle) {
      angle = angle * (Math.PI / 180);
      var xComp = magnitude * Math.cos(angle);
      var yComp = -1 * magnitude * Math.sin(angle);
      this.particle.setVelocity([xComp,yComp,0]);
      console.log("Set to " + magnitude + ", " + angle);
    }
  },

  ball0 = Object.create(Ball);
  ball0.initialize(0.8, 220, 'red');
  ballArray.push(ball0);
  ball1 = Object.create(Ball);
  ball1.initialize(0.8, 310, 'blue');
  ballArray.push(ball1);

  // wall setup
  var leftWall = new Wall({normal : [1,0,0], distance : 0, restitution : 0.6});
  var rightWall = new Wall({normal : [-1,0,0], distance : (window.innerWidth * .618), restitution : 0.6});
  var topWall = new Wall({normal : [0,1,0], distance : 0, restitution : 0.6});
  var bottomWall = new Wall({normal : [0,-1,0], distance : window.innerHeight, restitution : 0.6});

  physicsEngine.attach(leftWall,  [ball0.particle]);
  physicsEngine.attach(rightWall, [ball0.particle]);
  physicsEngine.attach(topWall,   [ball0.particle]);
  physicsEngine.attach(bottomWall,[ball0.particle]);
  physicsEngine.attach(leftWall,  [ball1.particle]);
  physicsEngine.attach(rightWall, [ball1.particle]);
  physicsEngine.attach(topWall,   [ball1.particle]);
  physicsEngine.attach(bottomWall,[ball1.particle]);

  rightWall.on('collision',function(){
    wallSound0.makeSound(audioContext, 220, "square", 1);
  });
  leftWall.on('collision',function(){
    wallSound1.makeSound(audioContext, 294, "square", 1);
  });
  topWall.on('collision',function(){
    wallSound2.makeSound(audioContext, 330, "square", 1);
  });
  bottomWall.on('collision',function(){
    wallSound3.makeSound(audioContext, 392, "square", 1);
  });

  //  Update functions (each tick):
  //    Reset balls to set speed
  //    Apply transforms to balls
  //    Apply sound envelope to objects

  Timer.every( function() {
    for (i=0; i<ballArray.length; i++) {
      ballArray[i].setMagAndDir(0.8, ballArray[i].readDirection());
      ballArray[i].state.setTransform(ballArray[i].particle.getTransform());
      wallSound0.ampControl(audioContext, -.01);
      wallSound1.ampControl(audioContext, -.01);
      wallSound2.ampControl(audioContext, -.01);
      wallSound3.ampControl(audioContext, -.01);
    }
  }, 1);

});
