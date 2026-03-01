const canvas = document.getElementById("clockCanvas");
const ctx = canvas.getContext("2d");

let orientationMode = "earth";
let compassHeading = 0;
let latitude = 0;
let longitude = 0;
let horizonFlipped = false;

// Fallback state
let manualAngle = 0;
let usingFallback = false;

// Resize canvas
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Get location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(pos => {
    latitude = pos.coords.latitude;
    longitude = pos.coords.longitude;
  });
}

// Fallback enable
function enableFallbackMode() {
  if (usingFallback) return;
  usingFallback = true;

  const controls = document.getElementById("fallback-controls");
  const warning = document.getElementById("no-sensor-warning");
  const slider = document.getElementById("manual-rotation");

  if (controls) controls.style.display = "block";
  if (warning) warning.style.display = "block";

  if (slider) {
    slider.addEventListener("input", e => {
      manualAngle = Number(e.target.value);
    });
  }
}

// Sensor detection
function detectSensors() {
  const hasOrientation = "DeviceOrientationEvent" in window;

  if (!hasOrientation) {
    enableFallbackMode();
    return;
  }

  let received = false;

  const testHandler = () => {
    received = true;
    window.removeEventListener("deviceorientation", testHandler);
  };

  window.addEventListener("deviceorientation", testHandler);

  setTimeout(() => {
    if (!received) enableFallbackMode();
  }, 1000);
}

detectSensors();

// Enable compass
function enableCompass() {
  if (usingFallback) return;

  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener("deviceorientationabsolute", handleOrientation, true);
      window.addEventListener("deviceorientation", handleOrientation, true);
    }
  } else {
    enableFallbackMode();
  }
}

function handleOrientation(e) {
  if (usingFallback) return;

  if (e.absolute === true || e.webkitCompassHeading) {
    compassHeading = e.webkitCompassHeading || e.alpha || 0;
  } else {
    compassHeading = e.alpha || 0;
  }
}

// Convert SunCalc azimuth to north-based degrees
function convertAzimuth(rad) {
  let deg = (rad * 180) / Math.PI;
  deg = (deg + 180) % 360;
  return deg;
}

// Get positions
function getPositions() {
  const now = new Date();

  const sun = SunCalc.getPosition(now, latitude, longitude);
  const moon = SunCalc.getMoonPosition(now, latitude, longitude);

  let sunAz = convertAzimuth(sun.azimuth);
  let moonAz = convertAzimuth(moon.azimuth);

  if (orientationMode === "body" && !usingFallback) {
    sunAz -= compassHeading;
    moonAz -= compassHeading;
  }

  if (horizonFlipped) {
    sunAz = (360 - sunAz) % 360;
    moonAz = (360 - moonAz) % 360;
  }

  return {
    sunAz,
    moonAz,
    sunAlt: sun.altitude,
    moonAlt: moon.altitude
  };
}

// Compass rose
function drawCompassRose(cx, cy, radius) {
  ctx.save();

  if (orientationMode === "body" && !usingFallback) {
    ctx.translate(cx, cy);
    ctx.rotate((-compassHeading * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  const directions = [
    { label: "N", angle: 0 },
    { label: "E", angle: 90 },
    { label: "S", angle: 180 },
    { label: "W", angle: 270 }
  ];

  ctx.fillStyle = "white";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  directions.forEach(dir => {
    const rad = ((dir.angle - 90) * Math.PI) / 180;
    const x = cx + (radius + 20) * Math.cos(rad);
    const y = cy + (radius + 20) * Math.sin(rad);
    ctx.fillText(dir.label, x, y);
  });

  ctx.restore();
}

// Draw hand
function drawHand(cx, cy, radius, azimuth, altitude, color, width) {
  const rad = ((azimuth - 90) * Math.PI) / 180;

  const x = cx + radius * Math.cos(rad);
  const y = cy + radius * Math.sin(rad);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x, y);

  ctx.strokeStyle = altitude < 0 ? "#333" : color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// Draw loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = canvas.width / 2 - 10;

  // Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawCompassRose(cx, cy, radius);

  // Horizon line rotated by manualAngle
  const horizonRad = (manualAngle * Math.PI) / 180;
  const hx1 = cx - radius * Math.cos(horizonRad);
  const hy1 = cy - radius * Math.sin(horizonRad);
  const hx2 = cx + radius * Math.cos(horizonRad);
  const hy2 = cy + radius * Math.sin(horizonRad);

  ctx.beginPath();
  ctx.moveTo(hx1, hy1);
  ctx.lineTo(hx2, hy2);
  ctx.strokeStyle = "#888";
  ctx.stroke();

  const { sunAz, moonAz, sunAlt, moonAlt } = getPositions();

  drawHand(cx, cy, radius, sunAz, sunAlt, "orange", 6);
  drawHand(cx, cy, radius, moonAz, moonAlt, "lightblue", 4);

  requestAnimationFrame(draw);
}

// Buttons
window.addEventListener("load", () => {
  const modeBtn = document.getElementById("modeBtn");
  const compassBtn = document.getElementById("compassBtn");
  const flipBtn = document.getElementById("flipBtn");

  if (modeBtn) {
    modeBtn.addEventListener("click", () => {
      orientationMode = orientationMode === "earth" ? "body" : "earth";
      modeBtn.textContent =
        orientationMode === "earth"
          ? "Orientation: Earth"
          : "Orientation: Body";
    });
  }

  if (compassBtn) compassBtn.addEventListener("click", enableCompass);
  if (flipBtn) flipBtn.addEventListener("click", () => (horizonFlipped = !horizonFlipped));

  draw();
});

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}
