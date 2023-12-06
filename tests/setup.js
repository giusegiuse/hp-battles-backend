require('../models/user');
require('dotenv').config();

const mongoose = require('mongoose');

// di default mongoose non utilizza la global promise, lo specifichiamo noi
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE, { useMongoClient: true });
