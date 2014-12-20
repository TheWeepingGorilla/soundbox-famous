define(function(require, exports, module) {

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

  /*  For some bizarre reason, this program will not compile without
      at least one sound being defined here (ahead of the famo.us requires).
      Since there will always be walls it is safe enough for now to predefine the
      sound objects for them here and add them later, clumsy as that is.
      First person to explain lucidly to me what's going on will get a
      beverage :-) */

  wallSound0 = Object.create(Sound);
  wallSound0.initialize(audioContext);
  wallSound1 = Object.create(Sound);
  wallSound1.initialize(audioContext);
  wallSound2 = Object.create(Sound);
  wallSound2.initialize(audioContext);
  wallSound3 = Object.create(Sound);
  wallSound3.initialize(audioContext);

  'use strict';
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
      return direction;
    },
    setMagAndDir: function(magnitude, angle) {
      angle = angle * (Math.PI / 180);
      var xComp = magnitude * Math.cos(angle);
      var yComp = -1 * magnitude * Math.sin(angle);
      this.particle.setVelocity([xComp,yComp,0]);
    }
  },

  ball0 = Object.create(Ball);
  ball0.initialize(0.8, 220, 'red');
  ballArray.push(ball0);
  ball1 = Object.create(Ball);
  ball1.initialize(0.8, 310, 'blue');
  ballArray.push(ball1);

  // wall setup

  var Wally = {
    initialize: function(norm, dist, rest, ballArr, physEng, audioCon, freq, wav, initAmp) {
      this.wall = new Wall({normal : norm, distance : dist, restitution : rest});
      this.audioContext = audioCon;
      this.frequency = freq;
      this.waveform = wav;
      this.initAmplitude = initAmp;
      for (i=0; i< ballArr.length; i++) {
        physEng.attach(this.wall, [ballArr[i].particle]);
      };
    }
  },

  rightWall = Object.create(Wally);
  rightWall.initialize([-1,0,0], (window.innerWidth * .618), 0.6, ballArray, physicsEngine, audioContext, 294, "square", 1);
  rightWall.wall.on('collision',function(){
    wallSound0.makeSound(rightWall.audioContext, rightWall.frequency, rightWall.waveform, rightWall.initAmplitude);
  });

  leftWall = Object.create(Wally);
  leftWall.initialize([1,0,0], 0, 0.6, ballArray, physicsEngine, audioContext, 220, "square", 1);
  leftWall.wall.on('collision',function(){
    wallSound1.makeSound(leftWall.audioContext, leftWall.frequency, leftWall.waveform, leftWall.initAmplitude);
  });

  topWall = Object.create(Wally);
  topWall.initialize([0,1,0], 0, 0.6, ballArray, physicsEngine, audioContext, 330, "square", 1);
  topWall.wall.on('collision',function(){
    wallSound2.makeSound(topWall.audioContext, topWall.frequency, topWall.waveform, topWall.initAmplitude);
  });

  bottomWall = Object.create(Wally);
  bottomWall.initialize([0,-1,0], window.innerHeight, 0.6, ballArray, physicsEngine, audioContext, 392, "square", 1);
  bottomWall.wall.on('collision',function(){
    wallSound3.makeSound(bottomWall.audioContext, bottomWall.frequency, bottomWall.waveform, bottomWall.initAmplitude);
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
