const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  uid: String,
  battery_voltage: Number,
  weight: Number,
  rep_count: Number,
  timestamp: Date
});

module.exports = mongoose.model('WorkoutDatas', sensorSchema);
