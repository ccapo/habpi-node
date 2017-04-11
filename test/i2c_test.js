const slave_addr = 0x04;
const Raspi = require('raspi-io');
const five = require('johnny-five');
const I2C = require('raspi-i2c').I2C;
var i2c = null;
const board = new five.Board({
  io: new Raspi()
});
const nmin = 48;
const nmax = 122;

function arduinoWrite(msg) {
  if(msg.length > 30) {
    console.log('Message length must be less then 30 characters');
    return null;
  }

  var bytes = [];
  bytes.push(2);
  for (var i = 0; i < msg.length; ++i) {
    bytes.push(msg.charCodeAt(i));
  }
  bytes.push(3);
  var buffer = new Buffer(bytes);
  i2c.write(slave_addr, buffer, err => {
    if(err) {
      console.log(`Error: ${err.toString()}`);
    } else {
      console.log('arduinoWrite Success');
    }
  });
}

board.on('ready', () => {
  i2c = new I2C();
  setInterval(() => {
    var msg = '';
    var nlength = Math.floor(30*Math.random() + 1);
    for(var i = 0; i < nlength; i++) {
      var r = Math.floor((nmax - nmin + 1)*Math.random()) + nmin;
      msg = msg + String.fromCharCode(r);
    }
    console.log(msg);
    arduinoWrite(msg);
  }, 5000);
});