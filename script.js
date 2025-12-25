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

// Helper Functions
function getTemperatureStatus(temp) {
  if (temp < 15) return { text: "Too Cold - Risk of Frost", class: "danger" };
  if (temp < 20) return { text: "Cool - Acceptable", class: "warning" };
  if (temp <= 28) return { text: "Optimal - Perfect Growth", class: "optimal" };
  if (temp <= 32) return { text: "Warm - Monitor Closely", class: "warning" };
  return { text: "Too Hot - Needs Cooling", class: "danger" };
}

function getHumidityStatus(hum) {
  if (hum < 30) return { text: "Very Low - Add Moisture", class: "danger" };
  if (hum < 40) return { text: "Low - Increase Humidity", class: "warning" };
  if (hum <= 70) return { text: "Ideal - Perfect Balance", class: "optimal" };
  if (hum <= 80) return { text: "High - Reduce Humidity", class: "warning" };
  return { text: "Too High - Risk of Mold", class: "danger" };
}

function getSoilStatus(moisture) {
  if (moisture < 20) return { text: "Very Dry - Needs Water Now", class: "danger" };
  if (moisture < 30) return { text: "Dry - Irrigation Needed", class: "warning" };
  if (moisture <= 70) return { text: "Perfect - Well Hydrated", class: "optimal" };
  if (moisture <= 80) return { text: "Moist - Good Condition", class: "optimal" };
  return { text: "Saturated - Reduce Watering", class: "danger" };
}

// Wait until DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const ROOF_CLOSED = 0;
  const ROOF_OPEN = 180;
  
  // --- HTML Elements ---
  const tempEl = document.getElementById("temp");
  const tempStatus = document.getElementById("tempStatus");
  const tempProgress = document.getElementById("tempProgress");
  
  const humEl = document.getElementById("hum");
  const humStatus = document.getElementById("humStatus");
  const humProgress = document.getElementById("humProgress");
  
  const soilEl = document.getElementById("soil");
  const soilStatus = document.getElementById("soilStatus");
  const soilProgress = document.getElementById("soilProgress");
  
  const conditionEl = document.getElementById("condition");
  const weatherIconEl = document.getElementById("weatherIcon");
  
  const autoModeToggle = document.getElementById("autoModeToggle");
  const modeIcon = document.getElementById("modeIcon");
  const modeTitle = document.getElementById("modeTitle");
  const modeDescription = document.getElementById("modeDescription");
  const controlsBadge = document.getElementById("controlsBadge");
  const manualControls = document.getElementById("manualControls");
  
  const roofToggle = document.getElementById("roofToggle");
  const roofStatus = document.getElementById("roofStatus");
  const roofPercentage = document.getElementById("roofPercentage");
  
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
  
  // Listen to automation mode
  db.ref("/iot/automation/mode").on("value", snapshot => {
    const mode = snapshot.val() ?? 1;
    autoModeToggle.checked = mode === 1;
    
    if (mode === 1) {
      modeIcon.textContent = "🤖";
      modeTitle.textContent = "Automation Mode";
      modeDescription.textContent = "System controls all functions automatically";
      controlsBadge.textContent = "Locked in Auto Mode";
      controlsBadge.style.background = "rgba(255, 159, 10, 0.2)";
      controlsBadge.style.color = "var(--accent-orange)";
      manualControls.classList.add('disabled');
    } else {
      modeIcon.textContent = "👤";
      modeTitle.textContent = "Manual Mode";
      modeDescription.textContent = "You have full control over all systems";
      controlsBadge.textContent = "Manual Control Active";
      controlsBadge.style.background = "rgba(10, 132, 255, 0.2)";
      controlsBadge.style.color = "var(--accent-blue)";
      manualControls.classList.remove('disabled');
    }
  });
  
  // Listen to DHT sensor data
  db.ref("/iot/dht").on("value", snapshot => {
    const data = snapshot.val();
    if (data) {
      const temp = parseFloat(data.temperature.toFixed(1));
      const hum = parseFloat(data.humidity.toFixed(1));
      
      // Update temperature
      tempEl.textContent = temp + "°C";
      const tempInfo = getTemperatureStatus(temp);
      tempStatus.textContent = tempInfo.text;
      tempStatus.className = "sensor-status " + tempInfo.class;
      
      const tempPercent = Math.min((temp / 50) * 100, 100);
      tempProgress.style.width = tempPercent + "%";
      
      // Update humidity
      humEl.textContent = hum + "%";
      const humInfo = getHumidityStatus(hum);
      humStatus.textContent = humInfo.text;
      humStatus.className = "sensor-status " + humInfo.class;
      
      humProgress.style.width = hum + "%";
    }
  });

  // Listen to soil moisture
  db.ref("/iot/soil/moisture").on("value", snapshot => {
    const moisture = snapshot.val() ?? 0;
    soilEl.textContent = moisture + "%";
    
    const soilInfo = getSoilStatus(moisture);
    soilStatus.textContent = soilInfo.text;
    soilStatus.className = "sensor-status " + soilInfo.class;
    
    soilProgress.style.width = moisture + "%";
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
      roofPercentage.textContent = Math.round(slidePercentage) + "%";
      
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
        roofStatus.textContent = Math.round(slidePercentage) + "% Open";
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
  
  // Auto Mode toggle
  autoModeToggle.addEventListener("change", () => {
    const mode = autoModeToggle.checked ? 1 : 0;
    db.ref("/iot/automation/mode").set(mode);
  });
  
  // Roof toggle
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

  // Servo Slider
  servoSlider.addEventListener("input", () => {
    userSliding = true;
    const value = Number(servoSlider.value);
    
    const slidePercentage = ((value - ROOF_CLOSED) / (ROOF_OPEN - ROOF_CLOSED)) * 100;
    roofPanelTop.style.transform = `translateX(${slidePercentage}%)`;
    roofPercentage.textContent = Math.round(slidePercentage) + "%";
    
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
      roofStatus.textContent = Math.round(slidePercentage) + "% Open";
      roofToggle.checked = false;
    }
    
    db.ref("/iot/servo/angle").set(value);
  });

  servoSlider.addEventListener("mouseup", () => userSliding = false);
  servoSlider.addEventListener("touchend", () => userSliding = false);

  console.log("🌱 GrowSafe Dashboard Initialized");
});