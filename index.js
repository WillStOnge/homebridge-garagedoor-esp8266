/* jshint node: true */
"use strict";
var Service;
var Characteristic;
var DoorState;

const request = require('request');
        
module.exports = function(homebridge) 
{
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  DoorState = homebridge.hap.Characteristic.CurrentDoorState;

  homebridge.registerAccessory("homebridge-garagedoor-esp8266", "GarageDoorESP8266", GarageDoorESP8266);
};

function GarageDoorESP8266(log, config) {
  this.log = log;
  this.version = require('./package.json').version;
  log("Starting GarageDoorESP8266 version " + this.version);

  this.triggerUrl = config.triggerUrl;
  this.openUrl = config.openUrl;
  this.closeUrl = config.closedUrl;
  this.pollingTime = config.pollingTime;
  this.doorOpeningTime = config.doorOpeningTime;

  this.initService();
}

GarageDoorESP8266.prototype = 
{
  determineCurrentDoorState: function() 
  {
    if (this.isClosed())
      return DoorState.CLOSED;
    return this.isOpen() ? DoorState.OPEN : DoorState.STOPPED; 
  },
  
  doorStateToString: function(state) 
  {
    switch (state) 
    {
      case DoorState.OPEN:
        return "OPEN";
      case DoorState.CLOSED:
        return "CLOSED";
      case DoorState.STOPPED:
        return "STOPPED";
      case DoorState.CLOSING:
        return "CLOSING";
      case DoorState.OPENING:
        return "OPENING";
      default:
        return "UNKNOWN";
    }
  },

  monitorDoorState: function() 
  {
    var isClosed = this.isClosed();
    if (isClosed != this.wasClosed) 
    {
      var state = this.determineCurrentDoorState();
      if (!this.operating) 
      {
        this.log("Door state changed to " + this.doorStateToString(state));
        this.wasClosed = isClosed;
        this.currentDoorState.updateValue(state);
        this.targetState = state;
      }
    }
    setTimeout(this.monitorDoorState.bind(this), this.sensorPollInMs);
  },

  initService: function() 
  {
    this.garageDoorOpener = new Service.GarageDoorOpener(this.name,this.name);
    this.currentDoorState = this.garageDoorOpener.getCharacteristic(DoorState);
    this.currentDoorState.on('get', this.getState.bind(this));
    this.targetDoorState = this.garageDoorOpener.getCharacteristic(Characteristic.TargetDoorState);
    this.targetDoorState.on('set', this.setState.bind(this));
    this.targetDoorState.on('get', this.getTargetState.bind(this));
    var isClosed = this.isClosed();

    this.wasClosed = isClosed;
    this.operating = false;
    this.infoService = new Service.AccessoryInformation();
    this.infoService
      .setCharacteristic(Characteristic.Manufacturer, "Opensource Community")
      .setCharacteristic(Characteristic.Model, "RaspPi GPIO GarageDoor")
      .setCharacteristic(Characteristic.SerialNumber, "Version 1.0.0");
  
    setTimeout(this.monitorDoorState.bind(this), this.sensorPollInMs);

    this.log("Initial Door State: " + (isClosed ? "CLOSED" : "OPEN"));
    this.currentDoorState.updateValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
    this.targetDoorState.updateValue(isClosed ? DoorState.CLOSED : DoorState.OPEN);
  },

  getTargetState: function(callback) 
  {
    callback(null, this.targetState);
  },

  isClosed: function() 
  {
    request(this.closedUrl, { json: true }, (err, res, body) => 
    {
      if (err)
        Error(err);
      return body.state == 1;
    });
  },

  isOpen: function() 
  {
    request(this.openUrl, { json: true }, (err, res, body) => 
    {
      if (err)
        Error(err);
      return body.state == 1;
    });
  },

  triggerDoor: function() 
  {
    request(this.triggerUrl, { json: false }, (err, res, body) => 
    {
      if (err)
        console.log(err);
    });
  },

  setFinalDoorState: function() 
  {  
    var isClosed = this.isClosed();
    var isOpen = this.isOpen();

    if ((this.targetState == DoorState.CLOSED && !isClosed) || (this.targetState == DoorState.OPEN && !isOpen)) 
    {
      this.log("Was trying to " + (this.targetState == DoorState.CLOSED ? "close" : "open") + " the door, but it is still " + (isClosed ? "CLOSED":"OPEN"));
      this.currentDoorState.updateValue(DoorState.STOPPED);
    } 
    else 
    {
      this.log("Set current state to " + (this.targetState == DoorState.CLOSED ? "CLOSED" : "OPEN"));
      this.wasClosed = this.targetState == DoorState.CLOSED;
      this.currentDoorState.updateValue(this.targetState);
    }
    this.operating = false;
  },

  setState: function(state, callback) 
  {
    this.log("Setting state to " + state);
    this.targetState = state;
    var isClosed = this.isClosed();
    
    if ((state == DoorState.OPEN && isClosed) || (state == DoorState.CLOSED && !isClosed)) 
    {
        this.log("Triggering relay");
        this.operating = true;

        if (state == DoorState.OPEN)
            this.currentDoorState.updateValue(DoorState.OPENING);
        else
            this.currentDoorState.updateValue(DoorState.CLOSING);

	     setTimeout(this.setFinalDoorState.bind(this), this.doorOpeningTime);
	     this.triggerDoor();
    }

    callback();
    return true;
  },

  getState: function(callback)
  {
    var isClosed = this.isClosed();
    var isOpen = this.isOpen();
    var state = isClosed ? DoorState.CLOSED : isOpen ? DoorState.OPEN : DoorState.STOPPED;
    
    callback(null, state);
  },

  getServices: function() 
  {
    return [this.infoService, this.garageDoorOpener];
  }
};
