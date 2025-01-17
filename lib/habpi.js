'use strict';

const fs = require('fs');
const path = require('path');
const JohnnyFive= require('johnny-five');
const RaspiIO = require('raspi-io');
const Sequelize = require('sequelize');
const Winston = require('winston');
const Constants = require('./constants');
const BROADCAST_INTERVAL = 5000;

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
      transaction: Sequelize.Transaction.TYPES.IMMEDIATE, // DEFERRED, IMMEDIATE, EXCLUSIVE
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE, // READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE
      retry: {max: 5, match: [new RegExp('SQLITE_BUSY'), Error, Sequelize.TimeoutError, Sequelize.ConnectionError]} // report: console.log
    });

    // Define Call Sign (tentative)
    this.CALLSIGN = 'VE3AXS';

    // The data payload
    this.payload = {bmp: {}, mpl: {}, gps: {}, bat: {}, cam: {}};

    // Broadcast timer
    this.broadcastTimer = null;

    // Define board
    this.board = new JohnnyFive.Board({
      io: new RaspiIO(),
      repl: false,
      debug: false
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
      // Startup message
      self.log(`Number 5 is alive!`, 'warning');

      // Shutdown message
      this.on("exit", function() {
        self.log(`No disassemble Number Five!`, 'warning');
      });

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
        self.payload.gps = {
          lat: this.latitude,
          lon: this.longitude,
          alt: this.altitude
        };
      });*/

      // Define thermometer, barometer, and altimeter sensor controller
      let mpl = new JohnnyFive.Multi({
        controller: 'MPL3115A2',
        // Change `elevation` with whatever is reported on http://www.whatismyelevation.com/
        // Location: 43.4578917 (Latitude), -80.4921175 (Longitude)
        elevation: 336,
        freq: 1000
      });

      // Set change state listener for outer thermometer, barometer, and altimeter sensor
      mpl.on('data', function() {
        // Save outer sensor data to payload
        self.payload.mpl = {
          thermometer: this.thermometer.celsius,
          barometer: this.barometer.pressure,
          altimeter: this.altimeter.meters
        };
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
      bmp.on("data", function() {
        // Save inner sensor data to payload
        self.payload.bmp = {
          thermometer: this.thermometer.celsius,
          barometer: this.barometer.pressure,
          altimeter: this.altimeter.meters
        };
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

      self.initBroadcast();
    });
  }

  // Logging function
  log(msg, type) {
    type = type || 'info';
    this.logger.log(type, msg);
  }

  // Initialize broadcast function
  initBroadcast() {
    let self = this;
    this.broadCastTimer = setInterval(() => {
      this._storeSensorData().then(() => {
        self.log(`Broadcast Sensor Payload`, 'alert');
        return null;
      });
    }, BROADCAST_INTERVAL);
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

  // Store sensor data
  _storeSensorData() {
    // Log sensor data
    return new Promise((resolve, reject) => {
      return this.db.transaction(t => {
        let records = [];

        if(this.payload.bmp.hasOwnProperty('thermometer')) {
          records.push({
            sensor_type_id: Constants.SENSOR_TYPE.BMP180,
            message_type_id: Constants.MESSAGE_TYPE.TEMP,
            message: this.payload.bmp.thermometer
          });
        }

        if(this.payload.bmp.hasOwnProperty('barometer')) {
          records.push({
            sensor_type_id: Constants.SENSOR_TYPE.BMP180,
            message_type_id: Constants.MESSAGE_TYPE.PRES,
            message: this.payload.bmp.barometer
          });
        }

        if(this.payload.bmp.hasOwnProperty('altimeter')) {
          records.push({
            sensor_type_id: Constants.SENSOR_TYPE.BMP180,
            message_type_id: Constants.MESSAGE_TYPE.ALT,
            message: this.payload.bmp.altimeter
          });
        }

        if(this.payload.mpl.hasOwnProperty('thermometer')) {
          records.push({
            sensor_type_id: Constants.SENSOR_TYPE.MPL3115A2,
            message_type_id: Constants.MESSAGE_TYPE.TEMP,
            message: this.payload.mpl.thermometer
          });
        }

        if(this.payload.mpl.hasOwnProperty('barometer')) {
          records.push({
            sensor_type_id: Constants.SENSOR_TYPE.MPL3115A2,
            message_type_id: Constants.MESSAGE_TYPE.PRES,
            message: this.payload.mpl.barometerS
          });
        }

        if(this.payload.mpl.hasOwnProperty('altimeter')) {
          records.push({
            sensor_type_id: Constants.SENSOR_TYPE.MPL3115A2,
            message_type_id: Constants.MESSAGE_TYPE.ALT,
            message: this.payload.mpl.altimeter
          });
        }

        return this.db.models.message.bulkCreate(records, {
          transaction: t
        }).then(() => {
          this.log(`Sensor data written to DB`, 'notice');
          resolve();
        }).catch(err => {
          this.log(`Unable to write sensor data to DB: ${err.toString()}`, 'error');
          this.log(JSON.stringify(records));
          reject(err);
        });
      });
    });
  }
};
