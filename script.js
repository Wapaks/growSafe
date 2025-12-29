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
  "Showers": "🌦️",
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
  let isAutoMode = true;

  // --- Firebase Listeners ---
  
  // Listen to automation mode from /iot/controls/autoMode
  db.ref("/iot/controls/autoMode").on("value", snapshot => {
    const autoMode = snapshot.val() ?? true;
    isAutoMode = autoMode;
    autoModeToggle.checked = autoMode;
    
    if (autoMode) {
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
  
  // Listen to sensor data - Temperature & Humidity from /iot/sensors/
  db.ref("/iot/sensors/temperature").on("value", snapshot => {
    const temp = snapshot.val() ?? 0;
    const tempFixed = parseFloat(temp.toFixed(1));
    
    tempEl.textContent = tempFixed + "°C";
    const tempInfo = getTemperatureStatus(tempFixed);
    tempStatus.textContent = tempInfo.text;
    tempStatus.className = "sensor-status " + tempInfo.class;
    
    const tempPercent = Math.min((tempFixed / 50) * 100, 100);
    tempProgress.style.width = tempPercent + "%";
  });

  db.ref("/iot/sensors/humidity").on("value", snapshot => {
    const hum = snapshot.val() ?? 0;
    const humFixed = parseFloat(hum.toFixed(1));
    
    humEl.textContent = humFixed + "%";
    const humInfo = getHumidityStatus(humFixed);
    humStatus.textContent = humInfo.text;
    humStatus.className = "sensor-status " + humInfo.class;
    
    humProgress.style.width = humFixed + "%";
  });

  // Listen to soil moisture from /iot/sensors/soilMoisture
  db.ref("/iot/sensors/soilMoisture").on("value", snapshot => {
    const moisture = snapshot.val() ?? 0;
    soilEl.textContent = moisture + "%";
    
    const soilInfo = getSoilStatus(moisture);
    soilStatus.textContent = soilInfo.text;
    soilStatus.className = "sensor-status " + soilInfo.class;
    
    soilProgress.style.width = moisture + "%";
  });

  // Listen to weather condition from /iot/weather/condition
  db.ref("/iot/weather/condition").on("value", snapshot => {
    const condition = snapshot.val() || "Loading...";
    conditionEl.textContent = condition;
    
    const icon = weatherIcons[condition] || "🌤️";
    weatherIconEl.textContent = icon;
  });

  // Listen to roof status from /iot/controls/roofOpen
  db.ref("/iot/controls/roofOpen").on("value", snapshot => {
    const roofOpen = snapshot.val() ?? false;
    
    roofToggle.checked = roofOpen;
    
    if (roofOpen) {
      roofStatus.textContent = "Open";
      if (!userSliding) {
        servoSlider.value = ROOF_OPEN;
        roofPanelTop.style.transform = `translateX(100%)`;
        roofPercentage.textContent = "100%";
        plant.classList.add('visible');
      }
      
      // ROOF OPEN: Disable lights toggle and show as automatic
      lightToggle.disabled = true;
      lightToggle.style.opacity = '0.5';
      lightToggle.style.cursor = 'not-allowed';
      lightStatusEl.textContent = "AUTO OFF (Roof Open)";
      lightStatusEl.style.color = "var(--text-secondary)";
      
    } else {
      roofStatus.textContent = "Closed";
      if (!userSliding) {
        servoSlider.value = ROOF_CLOSED;
        roofPanelTop.style.transform = `translateX(0%)`;
        roofPercentage.textContent = "0%";
        plant.classList.remove('visible');
      }
      
      // ROOF CLOSED: Enable lights toggle for manual control
      lightToggle.disabled = false;
      lightToggle.style.opacity = '1';
      lightToggle.style.cursor = 'pointer';
      lightStatusEl.style.color = "";
    }
  });

  // Listen to grow light status from /iot/controls/growlightsOn
  db.ref("/iot/controls/growlightsOn").on("value", snapshot => {
    const status = snapshot.val() ?? false;
    lightToggle.checked = status;
    
    // Only update status text if toggle is enabled (roof closed)
    if (!lightToggle.disabled) {
      lightStatusEl.textContent = status ? "ON" : "OFF";
      lightStatusEl.style.color = "";
    }
    // If disabled (roof open), status is already set by roof listener
  });

  // Listen to fan status from /iot/controls/fanOn
  db.ref("/iot/controls/fanOn").on("value", snapshot => {
    const status = snapshot.val() ?? false;
    fanToggle.checked = status;
    fanStatusEl.textContent = status ? "ON" : "OFF";
  });

  // Pump doesn't have persistent status in Firebase (it's a momentary action)
  // We'll just show OFF by default and briefly show ON when activated
  pumpStatusEl.textContent = "OFF";
  pumpToggle.checked = false;

  // --- Controls (Only work in MANUAL mode) ---
  
  // Auto Mode toggle (always works)
  autoModeToggle.addEventListener("change", () => {
    const mode = autoModeToggle.checked;
    db.ref("/iot/controls/autoMode").set(mode);
  });
  
  // Roof toggle - sends command to /iot/commands/roof (only in manual mode)
  roofToggle.addEventListener("change", () => {
    if (!isAutoMode) {
      const newState = roofToggle.checked;
      db.ref("/iot/commands/roof").set(newState);
    } else {
      // Revert toggle if in auto mode
      db.ref("/iot/controls/roofOpen").once("value", snapshot => {
        roofToggle.checked = snapshot.val() ?? false;
      });
    }
  });

  // Grow Light toggle - sends command (only in manual mode)
  lightToggle.addEventListener("change", () => {
    if (!isAutoMode) {
      const status = lightToggle.checked;
      db.ref("/iot/commands/lights").set(status);
    } else {
      // Revert toggle if in auto mode
      db.ref("/iot/controls/growlightsOn").once("value", snapshot => {
        lightToggle.checked = snapshot.val() ?? false;
      });
    }
  });

  // Fan toggle - sends command (only in manual mode)
  fanToggle.addEventListener("change", () => {
    if (!isAutoMode) {
      const status = fanToggle.checked;
      db.ref("/iot/commands/fan").set(status);
    } else {
      // Revert toggle if in auto mode
      db.ref("/iot/controls/fanOn").once("value", snapshot => {
        fanToggle.checked = snapshot.val() ?? false;
      });
    }
  });

  // Pump toggle - momentary activation (works in both modes)
  pumpToggle.addEventListener("change", () => {
    if (pumpToggle.checked) {
      // Send pump command
      db.ref("/iot/commands/pump").set(true);
      pumpStatusEl.textContent = "RUNNING";
      
      // Auto turn off after 5 seconds
      setTimeout(() => {
        pumpToggle.checked = false;
        pumpStatusEl.textContent = "OFF";
        db.ref("/iot/commands/pump").set(false);
      }, 5000);
    }
  });

  // Servo Slider - provides fine control (only in manual mode)
  servoSlider.addEventListener("input", () => {
    if (!isAutoMode) {
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
      }
      
      // Send command to ESP32
      const roofOpen = value >= ROOF_OPEN;
      db.ref("/iot/commands/roof").set(roofOpen);
      
      // Note: ESP32 will automatically handle lights based on roof
    } else {
      // Revert slider if in auto mode
      db.ref("/iot/controls/roofOpen").once("value", snapshot => {
        const roofOpen = snapshot.val() ?? false;
        servoSlider.value = roofOpen ? ROOF_OPEN : ROOF_CLOSED;
      });
    }
  });

  servoSlider.addEventListener("mouseup", () => userSliding = false);
  servoSlider.addEventListener("touchend", () => userSliding = false);

  // Prevent slider interaction in auto mode
  servoSlider.addEventListener("mousedown", (e) => {
    if (isAutoMode) {
      e.preventDefault();
    }
  });

  console.log("🌱 GrowSafe Dashboard Initialized");
  console.log("📡 Listening to Firebase paths:");
  console.log("  - /iot/controls/autoMode");
  console.log("  - /iot/sensors/temperature");
  console.log("  - /iot/sensors/humidity");
  console.log("  - /iot/sensors/soilMoisture");
  console.log("  - /iot/weather/condition");
  console.log("  - /iot/controls/roofOpen");
  console.log("  - /iot/controls/growlightsOn");
  console.log("  - /iot/controls/fanOn");
  console.log("📤 Sending commands to:");
  console.log("  - /iot/commands/roof");
  console.log("  - /iot/commands/lights");
  console.log("  - /iot/commands/fan");
  console.log("  - /iot/commands/pump");
});