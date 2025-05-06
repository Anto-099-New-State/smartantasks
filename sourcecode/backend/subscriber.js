const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const cors = require('cors');
const SensorData = require('./models/SensorData');

const app = express();
const PORT = 3000;

const mongoDB = 'mongodb+srv://abiselvapmc:bGJwGer2GNCIx1e9@cluster0.nurfh.mongodb.net/Desci?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(cors());

const WorkoutData = SensorData;
const subscribeBroker = 'mqtt://broker.hivemq.com';
const subscribeTopic = 'iot/fitness/data';
const subClient = mqtt.connect(subscribeBroker);

subClient.on('connect', () => {
  console.log('Connected to MQTT broker (Subscriber)');
  subClient.subscribe(subscribeTopic, (err) => {
    if (err) console.error('Subscription error:', err);
  });
});

subClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log('Received:', data);

    const newWorkoutData = new WorkoutData({
      uid: data.uid,
      battery_voltage: data.battery_voltage,
      weight: data.weight,
      rep_count: data.rep_count,
      date: new Date(data.timestamp).toISOString().split('T')[0],
      timestamp: new Date(data.timestamp)
    });

    newWorkoutData.save()
      .then(() => console.log('Saved to MongoDB'))
      .catch(err => console.error('Save error:', err));
  } catch (err) {
    console.error('Parse error:', err.message);
  }
});

const publishBroker = 'mqtt://test.mosquitto.org'; 
const publishClientId = 'backend_client_' + Math.random().toString(36).substring(2, 8);
const pubClient = mqtt.connect(publishBroker, {
  clientId: publishClientId,
  clean: true,
  protocolId: 'MQIsdp',
  protocolVersion: 3,
  keepalive: 60,
});

pubClient.on('connect', () => {
  console.log('MQTT client connected (Publisher)');
});

app.get('/api/send-command', (req, res) => {
  const topic = 'iot/device/command';
  const message = 'stop'; 

  pubClient.publish(topic, message, { qos: 0, retain: false }, (err) => {
    if (err) {
      console.error('Publish error:', err);
      return res.status(500).json({ success: false, error: 'Failed to send command' });
    }
    res.json({ success: true, message: 'Command sent' });
  });
});

app.get('/api/data', async (req, res) => {
  try {
    const data = await WorkoutData.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
