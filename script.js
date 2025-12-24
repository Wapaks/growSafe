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
  const ROOF_CLOSED = 0;
  const ROOF_OPEN = 180;
  
  // --- HTML Elements ---
  const tempEl = document.getElementById("temp");
  const humEl = document.getElementById("hum");
  const soilEl = document.getElementById("soil");
  const conditionEl = document.getElementById("condition");
  const weatherIconEl = document.getElementById("weatherIcon");
  const roofToggle = document.getElementById("roofToggle");
  const roofStatus = document.getElementById("roofStatus");
  const lightToggle = document.getElementById("lightToggle");
  const lightStatusEl = document.getElementById("lightStatus");
  const pumpToggle = document.getElementById("pumpToggle");
  const pumpStatusEl = document.getElementById("pumpStatus");
  const fanToggle = document.getElementById("fanToggle");
  const fanStatusEl = document.getElementById("fanStatus");
  const servoSlider = document.getElementById("servoSlider");
  const roofPanelTop = document.getElementById("roofPanelTop");
  const plant = document.getElementById("plant");

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
      
      updateGauge('tempGauge', temp, 0, 50);
      updateGauge('humidityGauge', hum, 0, 100);
    }
  });

  // Listen to soil moisture
  db.ref("/iot/soil/moisture").on("value", snapshot => {
    const moisture = snapshot.val() ?? 0;
    soilEl.textContent = moisture + "%";
    updateGauge('soilGauge', moisture, 0, 100);
  });

  // Listen to weather condition
  db.ref("/iot/weather/condition").on("value", snapshot => {
    const condition = snapshot.val() || "Loading...";
    conditionEl.textContent = condition;
    
    const icon = weatherIcons[condition] || "🌤️";
    weatherIconEl.textContent = icon;
  });

  // Listen to servo angle
  db.ref("/iot/servo/angle").on("value", snapshot => {
    if (!userSliding) {
      const angle = snapshot.val() ?? ROOF_CLOSED;
      servoSlider.value = angle;
      
      const slidePercentage = ((angle - ROOF_CLOSED) / (ROOF_OPEN - ROOF_CLOSED)) * 100;
      roofPanelTop.style.transform = `translateX(${slidePercentage}%)`;
      
      if (slidePercentage > 30) {
        plant.classList.add('visible');
      } else {
        plant.classList.remove('visible');
      }
      
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

  // Listen to grow light status
  db.ref("/iot/lights/status").on("value", snapshot => {
    const status = snapshot.val();
    lightToggle.checked = status === 1;
    lightStatusEl.textContent = status ? "ON" : "OFF";
  });

  // Listen to pump status
  db.ref("/iot/pump/status").on("value", snapshot => {
    const status = snapshot.val();
    pumpToggle.checked = status === 1;
    pumpStatusEl.textContent = status ? "ON" : "OFF";
  });

  // Listen to fan status
  db.ref("/iot/fan/status").on("value", snapshot => {
    const status = snapshot.val();
    fanToggle.checked = status === 1;
    fanStatusEl.textContent = status ? "ON" : "OFF";
  });

  // --- Controls ---
  
  // Roof toggle (Quick open/close)
  roofToggle.addEventListener("change", () => {
    const newAngle = roofToggle.checked ? ROOF_OPEN : ROOF_CLOSED;
    db.ref("/iot/servo/angle").set(newAngle);
  });

  // Grow Light toggle
  lightToggle.addEventListener("change", () => {
    const status = lightToggle.checked ? 1 : 0;
    db.ref("/iot/lights/status").set(status);
  });

  // Pump toggle
  pumpToggle.addEventListener("change", () => {
    const status = pumpToggle.checked ? 1 : 0;
    db.ref("/iot/pump/status").set(status);
  });

  // Fan toggle
  fanToggle.addEventListener("change", () => {
    const status = fanToggle.checked ? 1 : 0;
    db.ref("/iot/fan/status").set(status);
  });

  // --- Servo Slider (Fine control) ---
  servoSlider.addEventListener("input", () => {
    userSliding = true;
    const value = Number(servoSlider.value);
    
    const slidePercentage = ((value - ROOF_CLOSED) / (ROOF_OPEN - ROOF_CLOSED)) * 100;
    roofPanelTop.style.transform = `translateX(${slidePercentage}%)`;
    
    if (slidePercentage > 30) {
      plant.classList.add('visible');
    } else {
      plant.classList.remove('visible');
    }
    
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
    const circumference = 502;
    const offset = circumference - (percentage / 100) * circumference;
    
    gauge.style.strokeDashoffset = offset;
  }

  console.log("🌱 GrowSafe initialized and listening for updates...");
});