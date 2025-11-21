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
  "Loading...": "🌍"
};

// Wait until DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // --- HTML Elements ---
  const tempEl = document.getElementById("temp");
  const humEl = document.getElementById("hum");
  const conditionEl = document.getElementById("condition");
  const weatherIconEl = document.getElementById("weatherIcon");
  const roofBtn = document.getElementById("roofBtn");
  const toggleLightBtn = document.getElementById("toggleLight");
  const lightStatusEl = document.getElementById("lightStatus");
  const servoSlider = document.getElementById("servoSlider");
  const servoValEl = document.getElementById("servoVal");
  const tempGauge = document.getElementById("tempGauge");
  const humidityGauge = document.getElementById("humidityGauge");

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
      
      // Update gauge colors based on values
      updateGauge(tempGauge, temp, 0, 50, "#38bdf8");
      updateGauge(humidityGauge, hum, 0, 100, "#10b981");
    }
  });

  // Listen to weather condition
  db.ref("/iot/weather/condition").on("value", snapshot => {
    const condition = snapshot.val() || "Loading...";
    conditionEl.textContent = condition;
    
    // Update weather icon
    const icon = weatherIcons[condition] || "🌍";
    weatherIconEl.textContent = icon;
    weatherIconEl.style.fontSize = "80px";
  });

  // Listen to servo angle
  db.ref("/iot/servo/angle").on("value", snapshot => {
    if (!userSliding) {
      const angle = snapshot.val();
      if (angle !== null) {
        servoValEl.textContent = angle;
        servoSlider.value = angle;
      }
    }
  });

  // Listen to light status
  db.ref("/iot/lights/status").on("value", snapshot => {
    const status = snapshot.val();
    lightStatusEl.textContent = status ? "ON" : "OFF";
    lightStatusEl.style.color = status ? "#10b981" : "#ef4444";
  });

  // --- Controls ---
  
  // Roof button (toggle between 0 and 180)
  roofBtn.addEventListener("click", () => {
    db.ref("/iot/servo/angle").get().then(snapshot => {
      const current = snapshot.val() ?? 90;
      const newAngle = current === 0 ? 180 : 0;
      db.ref("/iot/servo/angle").set(newAngle);
    });
  });

  // Light toggle button
  toggleLightBtn.addEventListener("click", () => {
    db.ref("/iot/lights/status").get().then(snapshot => {
      const status = snapshot.val() ?? 0;
      db.ref("/iot/lights/status").set(status ? 0 : 1);
    });
  });

  // --- Servo Slider ---
  servoSlider.addEventListener("input", () => {
    userSliding = true;
    const value = Number(servoSlider.value);
    servoValEl.textContent = value;
    db.ref("/iot/servo/angle").set(value);
  });

  servoSlider.addEventListener("mouseup", () => userSliding = false);
  servoSlider.addEventListener("touchend", () => userSliding = false);

  // --- Helper Functions ---
  function updateGauge(gaugeEl, value, min, max, color) {
    const percentage = ((value - min) / (max - min)) * 100;
    const degrees = (percentage / 100) * 360;
    gaugeEl.style.background = `conic-gradient(${color} ${degrees}deg, #1e293b ${degrees}deg)`;
  }

  // Initial connection status
  console.log("Firebase initialized and listening for updates...");
});