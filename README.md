# IOT FITNESS DASHBOARD

## OVERVIEW

This project is a web-based dashboard built using **Next.js**, designed to visualize real-time fitness data collected from an IoT device. The data, such as weight measurements and the number of reps completed, is published over MQTT and stored in **MongoDB Atlas**. The frontend fetches this data via a backend and displays it using charts. 

The UI also features control functionality allowing the user to start or stop the data flow from the IoT device using MQTT control commands.

---

## TECHNOLOGIES USED

### Frontend

- **Next.js (App Router structure)**
- **Tailwind CSS** – utility-first CSS framework
- **shadcn/ui** – component library for building accessible UI
- **Recharts** – charting library for data visualization

### Backend

- **MQTT** – message protocol used for publishing and subscribing to device data
- **MongoDB Atlas** – cloud-hosted NoSQL database

---

## PROJECT STRUCTURE

src/
├── app/ # Application routes and pages
├── _components/ # All reusable UI components
├── styles/ # Tailwind and global CSS
├── utils/ # Utility and helper functions

yaml
Copy
Edit

---

## DEPENDENCIES

Ensure you have **Node.js** installed on your system.

Install all project dependencies using:

npm install
STARTING THE DEVELOPMENT SERVER
To start the application locally:

npm run dev
The app will be served on http://localhost:3000.

MQTT INTEGRATION
Data Flow
Channel: iot/fitness/data
The IoT device publishes data (e.g., weight, reps) to this channel.

Control Flow
Channel: iot/fitness/control
The frontend sends start or stop commands to this channel to control the device’s data stream.

FRONTEND FEATURES
Real-time data visualization using Recharts

Start and Stop buttons to control the device data stream

Clean and responsive design using Tailwind CSS

Modular UI components built with shadcn/ui, stored under _components

BACKEND FUNCTIONALITY
Subscribes to the MQTT iot/fitness/data channel to receive incoming sensor data

Listens to iot/fitness/control for start/stop command signals

Stores incoming data in MongoDB

Provides a REST API endpoint to fetch data for the frontend

FUTURE IMPROVEMENTS
Add filtering and sorting options for data

Support multiple devices and sessions

Enable data export (CSV/JSON)

Implement user authentication for secure access

