'use strict';

const raspi = require('raspi-io');
const five = require("johnny-five");
let board = new five.Board({
  io: new raspi()
});

board.on("ready", function() {
  var layout = `
  Board layout:
      +----------+
      |         *| RST   PITCH  ROLL  HEADING
  ADR |*        *| SCL
  INT |*        *| SDA     ^            /->
  PS1 |*        *| GND     |            |
  PS0 |*        *| 3VO     Y    Z-->    \-X
      |         *| VIN
      +----------+
  `;

  console.log(layout);

  /*var gps = new five.GPS({
    breakout: "ADAFRUIT_ULTIMATE_GPS",
    pins: {
      rx: 11,
      tx: 10,
    }
  });

  // If latitude, longitude change log it
  gps.on("change", function() {
    console.log("position");
    console.log("  latitude   : ", this.latitude);
    console.log("  longitude  : ", this.longitude);
    console.log("  altitude   : ", this.altitude);
    console.log("--------------------------------------");
  });

  // If speed, course change log it
  gps.on("navigation", function() {
    console.log("navigation");
    console.log("  speed   : ", this.speed);
    console.log("  course  : ", this.course);
    console.log("--------------------------------------");
  });*/

  var mpl = new five.Multi({
    controller: "MPL3115A2",
    // Change `elevation` with whatever is reported on http://www.whatismyelevation.com/
    // Location: 43.4578917 (Latitude), -80.4921175 (Longitude)
    elevation: 336
  });

  mpl.on("change", function() {
    console.log(`MPL: ${Date.now()}, ${this.thermometer.celsius}, ${this.barometer.pressure}, ${this.altimeter.meters}`);
    /*console.log("Thermometer");
    console.log("  celsius      : ", this.thermometer.celsius);
    console.log("--------------------------------------");

    console.log("Barometer");
    console.log("  pascals      : ", this.barometer.pressure);
    console.log("--------------------------------------");

    console.log("Altimeter");
    console.log("  meters       : ", this.altimeter.meters);
    console.log("--------------------------------------");*/
  });
  
  var bmp = new five.Multi({
    controller: "BMP180",
    // Change `elevation` with whatever is reported on http://www.whatismyelevation.com/
    // Location: 43.4578917 (Latitude), -80.4921175 (Longitude)
    elevation: 336
  });

  bmp.on("change", function() {
    console.log(`BMP: ${Date.now()}, ${this.thermometer.celsius}, ${this.barometer.pressure}, ${this.altimeter.meters}`);
    /*console.log("Thermometer");
    console.log("  celsius      : ", this.thermometer.celsius);
    console.log("--------------------------------------");

    console.log("Barometer");
    console.log("  pascals      : ", this.barometer.pressure);
    console.log("--------------------------------------");

    console.log("Altimeter");
    console.log("  meters       : ", this.altimeter.meters);
    console.log("--------------------------------------");*/
  });

  /*var bno = new five.IMU({
    controller: "BNO055",
    enableExternalCrystal: true // this can be turned on for better performance if you are using the Adafruit board
  });

  bno.on("change", function() {
    console.log("Thermometer");
    console.log("  celsius      : ", this.thermometer.celsius);
    console.log("  fahrenheit   : ", this.thermometer.fahrenheit);
    console.log("  kelvin       : ", this.thermometer.kelvin);
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
