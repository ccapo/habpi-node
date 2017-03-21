'use strict';

const HABPi = require('./lib/habpi').HABPi;

// HABPi API
let habpi = new HABPi();

// Check if we are authenicated
habpi._sequelize.authenticate().then(() => {
	habpi.log('Connection has been established successfully', 'alert');
}).catch(err => {
	habpi.log(`Unable to connect to the database: ${JSON.stringify(err)}`, 'error');
});
