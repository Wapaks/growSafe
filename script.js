// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAjhSicX7Scd4oITf-EOLue2y_bIxyvd3M",
  authDomain: "growsafe-961d2.firebaseapp.com",
  databaseURL: "https://growsafe-961d2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "growsafe-961d2",
  storageBucket: "growsafe-961d2.appspot.com",
  messagingSenderId: "407294805734",
  appId: "1:407294805734:web:4ad347bc9b9cdc84ac9d27"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Weather icon mapping
const weatherIcons = {
  "Sunny": "☀️",
  "Partly Cloudy": "⛅",
  "Cloudy": "☁️",
  "Fog": "🌫️",
  "Drizzle": "🌦️",
  "Rain": "🌧️",
  "Freezing Rain": "🌧️",
  "Snow": "❄️",
  "Rain Showers": "🌦️",
  "Thunderstorm": "⛈️",
  "Loading...": "🌤️"
};

// Wait until DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // --- HTML Elements ---
  const tempEl = document.getElementById("temp");
  const humEl = document.getElementById("hum");
  const conditionEl = document.getElementById("condition");
  const weatherIconEl = document.getElementById("weatherIcon");
  const roofToggle = document.getElementById("roofToggle");
  const roofStatus = document.getElementById("roofStatus");
  const lightToggle = document.getElementById("lightToggle");
  const lightStatusEl = document.getElementById("lightStatus");
  const servoSlider = document.getElementById("servoSlider");
  const servoValEl = document.getElementById("servoVal");

  let userSliding = false;

  // --- Firebase Listeners ---
  
  // Listen to DHT sensor data
  db.ref("/iot/dht").on("value", snapshot => {
    const data = snapshot.val();
    if (data) {
      const temp = data.temperature.toFixed(1);
      const hum = data.humidity.toFixed(1);
      
      tempEl.textContent = temp + "°C";
      humEl.textContent = hum + "%";
      
      // Update gauge animations
      updateGauge('tempGauge', temp, 0, 50);
      updateGauge('humidityGauge', hum, 0, 100);
    }
  });

  // Listen to weather condition
  db.ref("/iot/weather/condition").on("value", snapshot => {
    const condition = snapshot.val() || "Loading...";
    conditionEl.textContent = condition;
    
    // Update weather icon
    const icon = weatherIcons[condition] || "🌤️";
    weatherIconEl.textContent = icon;
  });

  // Listen to servo angle
  db.ref("/iot/servo/angle").on("value", snapshot => {
    if (!userSliding) {
      const angle = snapshot.val();
      if (angle !== null) {
        servoValEl.textContent = angle;
        servoSlider.value = angle;
        
        // Update roof toggle based on angle
        roofToggle.checked = angle > 90;
        roofStatus.textContent = angle === 0 ? "Closed" : angle === 180 ? "Open" : `${angle}°`;
      }
    }
  });

  // Listen to light status
  db.ref("/iot/lights/status").on("value", snapshot => {
    const status = snapshot.val();
    lightToggle.checked = status === 1;
    lightStatusEl.textContent = status ? "ON" : "OFF";
  });

  // --- Controls ---
  
  // Roof toggle (switch between 0 and 180)
  roofToggle.addEventListener("change", () => {
    const newAngle = roofToggle.checked ? 180 : 0;
    db.ref("/iot/servo/angle").set(newAngle);
  });

  // Light toggle
  lightToggle.addEventListener("change", () => {
    const status = lightToggle.checked ? 1 : 0;
    db.ref("/iot/lights/status").set(status);
  });

  // --- Servo Slider ---
  servoSlider.addEventListener("input", () => {
    userSliding = true;
    const value = Number(servoSlider.value);
    servoValEl.textContent = value;
    roofStatus.textContent = `${value}°`;
    db.ref("/iot/servo/angle").set(value);
    
    // Update toggle state based on slider
    roofToggle.checked = value > 90;
  });

  servoSlider.addEventListener("mouseup", () => userSliding = false);
  servoSlider.addEventListener("touchend", () => userSliding = false);

  // --- Helper Functions ---
  
  // Update circular gauge
  function updateGauge(gaugeId, value, min, max) {
    const gauge = document.getElementById(gaugeId);
    if (!gauge) return;
    
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    const circumference = 502; // 2 * PI * 80 (radius)
    const offset = circumference - (percentage / 100) * circumference;
    
    gauge.style.strokeDashoffset = offset;
  }

  // Initial connection status
  console.log("🌱 GrowSafe initialized and listening for updates...");
});