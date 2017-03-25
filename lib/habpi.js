'use strict';

const fs = require('fs');
const path = require('path');
const JohnnyFive= require('johnny-five');
const RaspiIO = require('raspi-io');
const Sequelize = require('sequelize');
const Winston = require('winston');
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

module.exports.HABPi = class HABPi {
  constructor(options) {
    // Define logging
    this.logger = new Winston.Logger({
      levels: customLevels.levels,
      colors: customLevels.colors,
      transports: [
        new (Winston.transports.Console)({
          level: 'info',
          colorize: true,
          timestamp: function() {
            return new Date().toISOString();
          }
        }),
        new (Winston.transports.File)({
          level: 'info',
          filename: path.join(__dirname, '../logs/habpi.log')
        })
      ]
    });

    // Define sequelize
    this._sequelize = new Sequelize('habpi', null, null, {
      host: 'localhost',
      dialect: 'sqlite',
      pool: {
        max:  5,
        min:  0,
        idle: 10000
      },
      logging: null, // console.log,
      storage: path.join(__dirname, '../db/habpi.sqlite'), // ':memory:',
      transaction: Sequelize.Transaction.EXCLUSIVE, // 'DEFERRED', 'IMMEDIATE', 'EXCLUSIVE'
      benchmark: true
    });

    // Define Call Sign (tentative)
    this.CALLSIGN = 'VE3AXS';

    // The data payload
    this.payload = {};

    // Define board
    this.board = new JohnnyFive.Board({
      io: new RaspiIO()
    });
  }

  init() {
    let self = this;

    // Check if we are authenicated
    this._sequelize.authenticate().then(() => {
      self.log(`Connection to DB Established`, 'alert');
      // Load models
      return self._loadModels().then(() => {
        self.log(`Loaded DB Models`, 'alert');
        return null;
      });
    }).catch(err => {
      self.log(`Unable to Connect to the Database: ${err.toString()}`, 'error');
      throw Error(err);
    });

    // Set board ready state listener
    this.board.on('ready', function() {
      // Define GPS controller
      /*let gps = new JohnnyFive.GPS({
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
          lon: this.longitude,
          alt: this.altitude
        };

        // Log GPS data
        self.log('Position:', 'notice');
        self.log(`${this.latitude} Degrees Latitude`);
        self.log(`${this.longitude} Degrees Longitude`);
        self.log(`${this.altitude} m Altitude`);
        self.log('--------------------------------------');
      });*/

      // Define thermometer, barometer, and altimeter sensor controller
      let mpl = new JohnnyFive.Multi({
        controller: 'MPL3115A2',
        // Change `elevation` with whatever is reported on http://www.whatismyelevation.com/
        // Location: 43.4578917 (Latitude), -80.4921175 (Longitude)
        elevation: 336
      });

      // Set change state listener for outer thermometer, barometer, and altimeter sensor
      mpl.on('change', function() {
        //console.log(`MPL: ${Date.now()}, ${this.thermometer.celsius}, ${this.barometer.pressure}, ${this.altimeter.meters}`);
        // Save outer sensor data to payload
        self.payload.outer = {
          thermometer: this.thermometer.celsius,
          barometer: this.barometer.pressure,
          altimeter: this.altimeter.meters
        };

        // Log sensor data
        self.log(`MPL3115A2: ${this.thermometer.celsius} C, ${this.barometer.pressure} kPa, ${this.altimeter.meters} m`);
        self._sequelize.models.message_type.findAll().then(messageTypes => {
          for(let messageType of messageTypes) {
            self.log(messagesType.dataValues, 'warning');
          }
        });
      });

      // Define thermometer, barometer, and altimeter sensor controller
      /*let bmp = new JohnnyFive.Multi({
        controller: "BMP180",
        // Change `elevation` with whatever is reported on http://www.whatismyelevation.com/
        // Location: 43.4578917 (Latitude), -80.4921175 (Longitude)
        elevation: 336,
        freq: 1000
      });

      // Set change state listener for inner thermometer, barometer, and altimeter sensor
      bmp.on("change", function() {
        //console.log(`BMP: ${Date.now()}, ${this.thermometer.celsius}, ${this.barometer.pressure}, ${this.altimeter.meters}`);
        // Save inner sensor data to payload
        self.payload.inner = {
          thermometer: this.thermometer.celsius,
          barometer: this.barometer.pressure,
          altimeter: this.altimeter.meters
        };

        // Log sensor data
        self.log(`BMP180: ${this.thermometer.celsius} C, ${this.barometer.pressure} kPa, ${this.altimeter.meters} m`);
      });*/

      // Define absolute orientation (accelerometer, gyroscope and magnetometer) controller
      /*let bno = new JohnnyFive.IMU({
        controller: "BNO055",
        enableExternalCrystal: true
      });

      // Set change state listener for absolute orientation (accelerometer, gyroscope and ) sensor
      bno.on("change", function() {
        console.log("Thermometer");
        console.log("  celsius      : ", this.thermometer.celsius);
        console.log("--------------------------------------");

        console.log("Accelerometer");
        console.log("  x            : ", this.accelerometer.x);
        console.log("  y            : ", this.accelerometer.y);
        console.log("  z            : ", this.accelerometer.z);
        console.log("  pitch        : ", this.accelerometer.pitch);
        console.log("  roll         : ", this.accelerometer.roll);
        console.log("  acceleration : ", this.accelerometer.acceleration);
        console.log("  inclination  : ", this.accelerometer.inclination);
        console.log("  orientation  : ", this.accelerometer.orientation);
        console.log("--------------------------------------");

        console.log("Gyroscope");
        console.log("  x            : ", this.gyro.x);
        console.log("  y            : ", this.gyro.y);
        console.log("  z            : ", this.gyro.z);
        console.log("  pitch        : ", this.gyro.pitch);
        console.log("  roll         : ", this.gyro.roll);
        console.log("  yaw          : ", this.gyro.yaw);
        console.log("  rate         : ", this.gyro.rate);
        console.log("  isCalibrated : ", this.gyro.isCalibrated);
        console.log("--------------------------------------");

        console.log("magnetometer");
        console.log("  heading : ", Math.floor(this.magnetometer.heading));
        console.log("  bearing : ", this.magnetometer.bearing.name);
        console.log("--------------------------------------");
      });

      bno.orientation.on("change", function() {
        console.log("orientation");
        console.log("  w            : ", this.quarternion.w);
        console.log("  x            : ", this.quarternion.x);
        console.log("  y            : ", this.quarternion.y);
        console.log("  z            : ", this.quarternion.z);

        console.log("  heading      : ", this.euler.heading);
        console.log("  roll         : ", this.euler.roll);
        console.log("  pitch        : ", this.euler.pitch);

        console.log("--------------------------------------");
      });*/
    });
  }

  // Logging function
  log(msg, type) {
    type = type || 'info';
    this.logger.log(type, msg);
  }

  // Load models
  _loadModels() {
    let baseDir = path.join(__dirname, '/models/');
    let files = fs.readdirSync(baseDir);
    for (const file of files) {
      if (fs.lstatSync(path.join(baseDir, file)).isFile()) {
        this.log(`Importing Model: ${file}`, 'notice');
        this._sequelize.import(baseDir + file);
      }
    }

    let models = Object.keys(this._sequelize.models);
    let ops = [];
    for (const model of models) {
      ops.push(this._sequelize.models[model].sync());
    }
    return Promise.all(ops);
  }
};
