'use strict';

const raspi = require('raspi-io');
const five = require("johnny-five");
const winston = require('winston');
const customLevels = {
  levels: {
    error: 0,
    warning: 1,
    alert: 2,
    notice: 3,
    info: 4,
    debug: 5
  },
  colors: {
    error: 'red',
    warning: 'magenta',
    alert: 'yellow',
    notice: 'cyan',
    info: 'green',
    debug: 'blue'
  }
};

module.exports.HabPi = class HabPi {
  constructor(options) {
    // Define logging
    this.logger = new winston.Logger({
      levels: customLevels.levels,
      colors: customLevels.colors,
      transports: [
        new (winston.transports.Console)({
          level: 'info',
          colorize: true,
          timestamp: function() {
            return new Date().toISOString();
          }
        }),
        new (winston.transports.File)({
          level: 'info',
          filename: 'habpi.log'
        })
      ]
    });

    // Define Call Sign (tentative)
    this.CALLSIGN = 'VE3AXS';

    // The data payload
    this.payload = {};

    // Define board
    this.board = new five.Board({
      io: new raspi()
    });

    // Set board ready state listener
    let self = this;
    this.board.on('ready', function() {
      // Define GPS controller
      /*let gps = new five.GPS({
        breakout: "ADAFRUIT_ULTIMATE_GPS",
        pins: {
          rx: 11,
          tx: 10,
        }
      });

      // Set change state listener for GPS
      gps.on('change', function() {
        // Save GPS data to payload
        self.payload.position = {
          lat: this.latitude,
          lon: this.longitude
        };
        
        // Log GPS data
        self.log('Position:', 'notice');
        self.log(`${this.latitude} Latitude`);
        self.log(`${this.longitude} Longitude`);
        self.log('--------------------------------------');
      });*/

      // Define thermometer, barometer, and altimeter sensor controller
      let sensor = new five.Multi({
        controller: 'MPL3115A2',
        // Change `elevation` with whatever is reported on http://www.whatismyelevation.com/
        // Location: 43.4578917 (Latitude), -80.4921175 (Longitude)
        elevation: 336
      });

      // Set change state listener for thermometer, barometer, and altimeter sensor
      sensor.on('change', function() {
        // Save sensor data to payload
        self.payload.sensor = {
          thermometer: this.thermometer.celsius,
          barometer: this.barometer.pressure,
          altimeter: this.altimeter.meters
        };

        // Log sensor data
        self.log('Thermometer:', 'notice');
        self.log(`${this.thermometer.celsius} C`);
        self.log(`${this.thermometer.kelvin} K`);
        self.log('--------------------------------------');

        self.log('Barometer:', 'notice');
        self.log(`${this.barometer.pressure} Pa`);
        self.log('--------------------------------------');

        self.log('Altimeter:', 'notice');
        self.log(`${this.altimeter.meters} m`);
        self.log(`${this.altimeter.meters/1000.0} km`);
        self.log('--------------------------------------');
      });

      // Define magnetometer/compass controller
      /*let compass = new five.Compass({
        controller: 'HMC5883L'
      });

      // Set change state listener for magnetometer/compass
      compass.on('change', function() {
        // Save magnetometer/compass data to payload
        self.payload.compass = {
          heading: Math.floor(this.heading),
          bearing: this.bearing.name
        };
        
        // Log magnetometer/compass data
        self.log('Compass:', 'notice');
        self.log(`${Math.floor(this.heading)} Heading`);
        self.log(`${this.bearing.name} Bearing`);
        self.log('--------------------------------------');
      });*/
    });
  }
  
  // Logging function
  log(msg, type) {
    type = type || 'info';
    this.logger.log(type, msg);
  }
};
