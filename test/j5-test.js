'use strict';

const raspi = require('raspi-io');
const five = require("johnny-five");
let board = new five.Board({
  io: new raspi()
});

board.on("ready", function() {
  let multi = new five.Multi({
    controller: "MPL3115A2",
    // Change `elevation` with whatever is reported
    // on http://www.whatismyelevation.com/.
    // `12` is the elevation (meters) for where I live in Brooklyn
    elevation: 336,
  });

  multi.on("change", function() {
    console.log(`${Date.now()}, ${this.thermometer.celsius}, ${this.barometer.pressure}, ${this.altimeter.meters}`);
    /*console.log("Thermometer");
    console.log("  celsius      : ", this.thermometer.celsius);
    console.log("  kelvin       : ", this.thermometer.kelvin);
    console.log("--------------------------------------");

    console.log("Barometer");
    console.log("  pascals      : ", this.barometer.pressure);
    console.log("--------------------------------------");

    console.log("Altimeter");
    console.log("  meters       : ", this.altimeter.meters);
    console.log("--------------------------------------");*/
  });
});
