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
  // --- Configuration ---
  // IMPORTANT: These values must match your ESP32 code!
  const ROOF_CLOSED = 0;     // Must match ROOF_CLOSED_ANGLE (0°)
  const ROOF_OPEN = 180;     // Must match ROOF_OPEN_ANGLE (180°)
  
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
  const roofPanelTop = document.getElementById("roofPanelTop");
  const plant = document.getElementById("plant");

  // Debug: Check if elements exist
  console.log("Roof Panel Element:", roofPanelTop);
  console.log("Plant Element:", plant);

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
      const angle = snapshot.val() ?? ROOF_CLOSED;
      servoSlider.value = angle;
      
      // Update roof sliding animation (top view)
      // Map 90-120° to 0-100% slide (roof slides to the right)
      const slidePercentage = ((angle - ROOF_CLOSED) / (ROOF_OPEN - ROOF_CLOSED)) * 100;
      roofPanelTop.style.transform = `translateX(${slidePercentage}%)`;
      
      // Show/hide plant based on opening
      if (slidePercentage > 30) {
        plant.classList.add('visible');
      } else {
        plant.classList.remove('visible');
      }
      
      // Update toggle and status
      roofToggle.checked = angle >= ROOF_OPEN;
      if (angle <= ROOF_CLOSED) {
        roofStatus.textContent = "Closed";
      } else if (angle >= ROOF_OPEN) {
        roofStatus.textContent = "Open";
      } else {
        const openPercent = Math.round(slidePercentage);
        roofStatus.textContent = `${openPercent}% Open`;
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
  
  // Roof toggle (Quick open/close)
  roofToggle.addEventListener("change", () => {
    const newAngle = roofToggle.checked ? ROOF_OPEN : ROOF_CLOSED;
    db.ref("/iot/servo/angle").set(newAngle);
  });

  // Light toggle
  lightToggle.addEventListener("change", () => {
    const status = lightToggle.checked ? 1 : 0;
    db.ref("/iot/lights/status").set(status);
  });

  // --- Servo Slider (Fine control) ---
  servoSlider.addEventListener("input", () => {
    userSliding = true;
    const value = Number(servoSlider.value);
    
    // Update roof sliding animation
    const slidePercentage = ((value - ROOF_CLOSED) / (ROOF_OPEN - ROOF_CLOSED)) * 100;
    roofPanelTop.style.transform = `translateX(${slidePercentage}%)`;
    
    // Show/hide plant
    if (slidePercentage > 30) {
      plant.classList.add('visible');
    } else {
      plant.classList.remove('visible');
    }
    
    // Update status
    if (value <= ROOF_CLOSED) {
      roofStatus.textContent = "Closed";
      roofToggle.checked = false;
    } else if (value >= ROOF_OPEN) {
      roofStatus.textContent = "Open";
      roofToggle.checked = true;
    } else {
      const openPercent = Math.round(slidePercentage);
      roofStatus.textContent = `${openPercent}% Open`;
      roofToggle.checked = false;
    }
    
    db.ref("/iot/servo/angle").set(value);
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