const mqtt = require('mqtt');

// MQTT Configuration - same as your ESP32
const brokerUrl = 'mqtt://broker.hivemq.com';
const topicPublish = 'iot/fitness/data';
const topicCommand = 'iot/fitness/command';
const clientId = `fitness_simulator_${Math.random().toString(16).substring(2, 8)}`;

// Simulation configuration
const UPDATE_INTERVAL_MS = 25; // 40Hz, matching your ESP32
let isAcquiring = false;
let analogBaseValue = 2000; // Base analog value
let noiseRange = 100; // Range of random noise to add

// Connect to MQTT broker
console.log(`Connecting to MQTT broker at ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl, {
  clientId: clientId,
  clean: true
});

// Handle connection events
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to the command topic (same as ESP32)
  client.subscribe(topicCommand, (err) => {
    if (!err) {
      console.log(`Subscribed to ${topicCommand}`);
      console.log('\nSimulator ready. Waiting for "start" command...');
      console.log('You can also type commands: "start", "stop", or "exit"');
    }
  });
});

client.on('error', (error) => {
  console.error('MQTT Error:', error);
});

client.on('offline', () => {
  console.log('MQTT client offline');
});

client.on('reconnect', () => {
  console.log('Trying to reconnect to MQTT broker...');
});

// Handle incoming MQTT messages (commands)
client.on('message', (topic, message) => {
  const command = message.toString().toLowerCase();
  console.log(`Received command: ${command}`);
  
  if (topic === topicCommand) {
    if (command === 'start') {
      startAcquisition();
    } else if (command === 'stop') {
      stopAcquisition();
    }
  }
});

// Generate simulated sensor data
function generateSensorData() {
  // Generate a random analog value with some noise
  const analogValue = Math.floor(analogBaseValue + (Math.random() * noiseRange * 2 - noiseRange));
  
  // Calculate voltage (matching ESP32 calculation)
  const voltage = analogValue * (3.3 / 4095);
  
  // Calculate distance (using the same formula as your ESP32)
  const distance = calculateDistance(voltage);
  
  // Create JSON payload
  const payload = {
    analogValue: analogValue,
    voltage: parseFloat(voltage.toFixed(3)),
    distance: parseFloat(distance.toFixed(3))
  };
  
  return payload;
}

// Calculate distance using the same formula as ESP32
function calculateDistance(voltage) {
  if (voltage >= 1.023) {
    return (voltage - 3.354) / -0.042;
  } else {
    return (voltage - 1.416) / -0.007;
  }
}

// Start simulating data
function startAcquisition() {
  if (!isAcquiring) {
    isAcquiring = true;
    console.log('Starting data simulation...');
    
    // Simulate random variation in the base value over time
    let trend = 0;
    
    // Start interval to publish data
    simulationInterval = setInterval(() => {
      // Slowly change the base value to simulate movement
      trend += (Math.random() - 0.5) * 10;
      if (Math.abs(trend) > 500) {
        trend *= -0.9; // Reverse direction if too far from center
      }
      
      analogBaseValue = 2000 + trend;
      
      // Generate and publish data
      const data = generateSensorData();
      client.publish(topicPublish, JSON.stringify(data));
      console.log(`Published: analog=${data.analogValue}, voltage=${data.voltage}V, distance=${data.distance}cm`);
    }, UPDATE_INTERVAL_MS);
  }
}

// Stop simulating data
function stopAcquisition() {
  if (isAcquiring) {
    isAcquiring = false;
    console.log('Stopping data simulation...');
    clearInterval(simulationInterval);
  }
}

// Handle console input for manual control
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  const command = input.trim().toLowerCase();
  
  if (command === 'start') {
    startAcquisition();
  } else if (command === 'stop') {
    stopAcquisition();
  } else if (command === 'exit') {
    console.log('Exiting...');
    if (isAcquiring) {
      stopAcquisition();
    }
    client.end();
    rl.close();
    process.exit(0);
  } else {
    console.log('Unknown command. Available commands: start, stop, exit');
  }
});

// Clean up on exit
process.on('SIGINT', () => {
  console.log('\nExiting...');
  if (isAcquiring) {
    stopAcquisition();
  }
  client.end();
  rl.close();
  process.exit(0);
});