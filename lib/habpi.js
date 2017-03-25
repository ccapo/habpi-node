'use strict';

const fs = require('fs');
const path = require('path');
const JohnnyFive= require('johnny-five');
const RaspiIO = require('raspi-io');
const Sequelize = require('sequelize');
const Winston = require('winston');
const Constants = require('./constants');

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
    this.db = new Sequelize('habpi', null, null, {
      host: 'localhost',
      dialect: 'sqlite',
      pool: {
        max:  5,
        min:  0,
        idle: 10000
      },
      logging: null, // console.log,
      storage: path.join(__dirname, '../db/habpi.sqlite'), // ':memory:',
      transaction: Sequelize.Transaction.DEFERRED, // 'DEFERRED', 'IMMEDIATE', 'EXCLUSIVE'
      benchmark: true
    });

    // Define Call Sign (tentative)
    this.CALLSIGN = 'VE3AXS';

    // The data payload
    this.payload = {};

    // Broadcast timer
    this.broadcastTimer = null;

    // Define board
    this.board = new JohnnyFive.Board({
      io: new RaspiIO()
    });
  }

  init() {
    let self = this;

    // Check if we are authenicated
    this.db.authenticate().then(() => {
      self.log(`Connection to DB Established`, 'alert');
      // Load models
      return self._loadModels();
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
        // Save outer sensor data to payload
        self.payload.outer = {
          thermometer: this.thermometer.celsius,
          barometer: this.barometer.pressure,
          altimeter: this.altimeter.meters
        };

        // Store sensor data
        self._storeMPL3115A2();
        self.broadcast();
      });

      // Define thermometer, barometer, and altimeter sensor controller
      let bmp = new JohnnyFive.Multi({
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
        self._storeBMP180();
      });

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

      //self.broadCastTimer = setInterval(self.broadcast, 5000);
    });
  }

  // Logging function
  log(msg, type) {
    type = type || 'info';
    this.logger.log(type, msg);
  }

  broadcast() {
    this.log(`Broadcast Sensor Payload: ${JSON.stringify(this.payload)}`, 'alert');
  }

  // Load models
  _loadModels() {
    return new Promise((resolve, reject) => {
      this.log(`Begin Loading DB Models`, 'alert');
      let baseDir = path.join(__dirname, '/models/');
      let files = fs.readdirSync(baseDir);
      for (const file of files) {
        if (fs.lstatSync(path.join(baseDir, file)).isFile()) {
          this.log(`Importing Model: ${file}`, 'notice');
          this.db.import(baseDir + file);
        }
      }

      let models = Object.keys(this.db.models);
      let ops = [];
      for (const model of models) {
        ops.push(this.db.models[model].sync());
      }
      return Promise.all(ops).then(() => {
        this.log(`Completed Loading DB Models`, 'alert');
        resolve();
      }).catch(err => {
        this.log(`_loadModels: ${err.toString()}`, 'error');
        reject(err);
      });
    });
  }

  _storeMPL3115A2() {
    // Log sensor data
    this.db.transaction(t => {
      return this.db.models.message.create({
        sensor_type_id: Constants.SENSOR_TYPE.MPL3115A2,
        message_type_id: Constants.MESSAGE_TYPE.TEMP,
        message: this.payload.outer.thermometer
      }, {
        transaction: t
      }).then(() => {
        return this.db.models.message.create({
          sensor_type_id: Constants.SENSOR_TYPE.MPL3115A2,
          message_type_id: Constants.MESSAGE_TYPE.PRES,
          message: this.payload.outer.barometer
        }, {
          transaction: t
        });
      }).then(() => {
        return this.db.models.message.create({
          sensor_type_id: Constants.SENSOR_TYPE.MPL3115A2,
          message_type_id: Constants.MESSAGE_TYPE.ALT,
          message: this.payload.outer.altimeter
        }, {
          transaction: t
        });
      }).catch(err => {
        this.log(`MPL3115A2: Unable to write sensor data to DB: ${err.toString()}`, 'error');
        throw Error(err);
      });
    }).then(() => {
      this.log(`MPL3115A2: ${this.payload.outer.thermometer} C, ${this.payload.outer.barometer} kPa, ${this.payload.outer.altimeter} m`);
      this.log(`MPL3115A2 sensor data written to DB`, 'notice');
    });
  }

  _storeBMP180() {
    // Log sensor data
    this.db.transaction(t => {
      return this.db.models.message.create({
        sensor_type_id: Constants.SENSOR_TYPE.BMP180,
        message_type_id: Constants.MESSAGE_TYPE.TEMP,
        message: this.payload.inner.thermometer
      }, {
        transaction: t
      }).then(() => {
        return this.db.models.message.create({
          sensor_type_id: Constants.SENSOR_TYPE.BMP180,
          message_type_id: Constants.MESSAGE_TYPE.PRES,
          message: this.payload.inner.barometer
        }, {
          transaction: t
        });
      }).then(() => {
        return this.db.models.message.create({
          sensor_type_id: Constants.SENSOR_TYPE.BMP180,
          message_type_id: Constants.MESSAGE_TYPE.ALT,
          message: this.payload.inner.altimeter
        }, {
          transaction: t
        });
      }).catch(err => {
        this.log(`BMP180: Unable to write sensor data to DB: ${err.toString()}`, 'error');
        throw Error(err);
      });
    }).then(() => {
      this.log(`BMP180: ${this.payload.inner.thermometer} C, ${this.payload.inner.barometer} kPa, ${this.payload.inner.altimeter} m`);
      this.log(`BMP180 sensor data written to DB`, 'notice');
    });
  }
};
