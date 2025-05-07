from flask import Flask, jsonify
from flask_cors import CORS
import paho.mqtt.client as mqtt
import threading
import json
import time

# --- Configuration ---
BROKER_ADDRESS = "broker.hivemq.com"
TOPIC_COMMAND = "iot/fitness/command"
TOPIC_DATA = "iot/fitness/data"
CLIENT_ID = f"fitness_controller_{int(time.time())}"

# --- Global Variables ---
latest_data = None
data_lock = threading.Lock()
is_collecting = False

# --- MQTT Callbacks ---
def on_connect(client, userdata, flags, rc, properties=None):
    print(f"[MQTT] Connected with result code {rc}")
    client.subscribe(TOPIC_DATA)
    print(f"[MQTT] Subscribed to {TOPIC_DATA}")

def on_message(client, userdata, msg):
    global latest_data
    try:
        payload = msg.payload.decode()
        data = json.loads(payload)

        with data_lock:
            latest_data = data

        print(f"[MQTT] Received → Analog={data['analogValue']}, Voltage={data['voltage']:.3f}V, Distance={data['distance']:.3f}cm")

    except json.JSONDecodeError:
        print(f"[MQTT] JSON Decode Error: {msg.payload.decode()}")
    except Exception as e:
        print(f"[MQTT] Error processing message: {e}")

# --- MQTT Client Setup ---
mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)  # Allow cross-origin from frontend

@app.route("/start", methods=["POST"])
def start_acquisition():
    global is_collecting
    if is_collecting:
        return jsonify({"message": "Already collecting data."}), 200

    mqtt_client.publish(TOPIC_COMMAND, "start")
    is_collecting = True
    print("[FLASK] Sent START command via MQTT")
    return jsonify({"message": "Data acquisition started."}), 200

@app.route("/stop", methods=["POST"])
def stop_acquisition():
    global is_collecting
    if not is_collecting:
        return jsonify({"message": "Already stopped."}), 200

    mqtt_client.publish(TOPIC_COMMAND, "stop")
    is_collecting = False
    print("[FLASK] Sent STOP command via MQTT")
    return jsonify({"message": "Data acquisition stopped."}), 200

@app.route("/latest", methods=["GET"])
def get_latest_data():
    with data_lock:
        if latest_data:
            return jsonify(latest_data)
        else:
            return jsonify({"message": "No data received yet."}), 404

# --- Thread to run MQTT loop ---
def run_mqtt():
    try:
        print(f"[MQTT] Connecting to {BROKER_ADDRESS}...")
        mqtt_client.connect(BROKER_ADDRESS)
        mqtt_client.loop_forever()
    except Exception as e:
        print(f"[MQTT] Connection Error: {e}")

# --- Main App Runner ---
if __name__ == "__main__":
    mqtt_thread = threading.Thread(target=run_mqtt)
    mqtt_thread.daemon = True
    mqtt_thread.start()

    print("[FLASK] Starting Flask API server...")
    app.run(host="0.0.0.0", port=5000)
