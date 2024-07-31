//server/models/Outage.js 

const mongoose = require('mongoose');

const outageSchema = new mongoose.Schema ({
	website: {
		type: String,
		rquired: true,
	},

	status: {
		type: String,
		required: true,

	},
	timestamp: {
		type: Data,
		default: Date.now,
	},

});


const Outage = mongoose.model('Outage', outageSchema);

module.exports = Outage;

