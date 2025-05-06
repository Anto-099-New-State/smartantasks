const mqtt = require('mqtt');
const fs = require('fs');

// MQTT broker settings
const brokerHost = 'broker.hivemq.com';
const brokerPort = 1883;
const publishTopic = 'iot/fitness/data';
const commandTopic = 'iot/device/command';

const locations = ['Adyar', 'T Nagar', 'Besant Nagar', 'Velachery', 'Mylapore'];

function generateRandomUID() {
  const characters = 'abcdef0123456789';
  let uid = '';
  for (let i = 0; i < 4; i++) {
    uid += characters[Math.floor(Math.random() * characters.length)];
  }
  return uid;
}

let intervalHandle = null;

function startPublishing(client) {
  console.log('Starting publisher interval...');
  intervalHandle = setInterval(() => {
    const sensorData = {
      uid: generateRandomUID(),
      timestamp: new Date().toISOString(),
      loc: locations[Math.floor(Math.random() * locations.length)],
      battery_voltage: (Math.random() * (4.2 - 3.5) + 3.5).toFixed(2),
      weight: (Math.random() * (80 - 60) + 60).toFixed(1),
      rep_count: Math.floor(Math.random() * 50) + 10
    };

    const csvLine = `${sensorData.uid},${sensorData.timestamp},${sensorData.loc},${sensorData.battery_voltage},${sensorData.weight},${sensorData.rep_count}\n`;
    fs.appendFileSync('fitnessData.csv', csvLine, 'utf8');

    client.publish(publishTopic, JSON.stringify(sensorData), (err) => {
      if (err) {
        console.error('Publish error:', err);
      } else {
        console.log('Sent:', sensorData);
      }
    });
  }, 5000);
}

function connectMQTT() {
  const clientId = 'fitness_client_' + generateRandomUID();

  const client = mqtt.connect({
    host: brokerHost,
    port: brokerPort,
    clientId,
    keepalive: 60,
    reconnectPeriod: 1000
  });

  client.on('connect', () => {
    console.log(`Connected to MQTT Broker at ${brokerHost}:${brokerPort} with client ID: ${clientId}`);

    client.subscribe(commandTopic, (err) => {
      if (err) console.error('Subscription error:', err);
      else console.log(`Subscribed to command topic: ${commandTopic}`);
    });

    startPublishing(client);
  });

  client.on('message', (topic, message) => {
    if (topic === commandTopic) {
      const command = message.toString().trim().toLowerCase();
      console.log(`Received command: ${command}`);

      if (command === 'stop') {
        if (intervalHandle) {
          console.log('Clearing interval...');
          clearInterval(intervalHandle);
          intervalHandle = null;
          console.log('Publishing stopped due to command.');
        }
      }

      if (command === 'start') {
        if (!intervalHandle) {
          console.log('Restarting publishing due to command.');
          startPublishing(client);
        }
      }
    }
  });

  client.on('error', (err) => console.error('MQTT Error:', err));
  client.on('close', () => console.log('Connection closed'));
  client.on('reconnect', () => console.log('Reconnecting...'));
  client.on('offline', () => console.log('Offline'));
}

// Create CSV header if needed
if (!fs.existsSync('fitnessData.csv') || fs.statSync('fitnessData.csv').size === 0) {
  fs.writeFileSync('fitnessData.csv', 'uid,timestamp,loc,battery_voltage,weight,rep_count\n');
}

connectMQTT();
