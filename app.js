const canvas = document.getElementById("clockCanvas");
const ctx = canvas.getContext("2d");

let orientationMode = "earth";
let compassHeading = 0;
let latitude = 0;
let longitude = 0;
let horizonFlipped = false;

// Resize canvas
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Get location
navigator.geolocation.getCurrentPosition(pos => {
  latitude = pos.coords.latitude;
  longitude = pos.coords.longitude;
});

// Enable compass
function enableCompass() {
  if (window.DeviceOrientationEvent) {

    // For iOS permission model (safe on Android too)
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
  }
}

function handleOrientation(e) {
  if (e.absolute === true || e.webkitCompassHeading) {
    compassHeading = e.webkitCompassHeading || e.alpha || 0;
  } else {
    compassHeading = e.alpha || 0;
  }
}

// Convert SunCalc azimuth to north-based degrees
function convertAzimuth(rad) {
  let deg = rad * 180 / Math.PI;
  deg = (deg + 180) % 360; // convert from south-based to north-based
  return deg;
}

// Get positions
function getPositions() {
  const now = new Date();

  const sun = SunCalc.getPosition(now, latitude, longitude);
  const moon = SunCalc.getMoonPosition(now, latitude, longitude);

  let sunAz = convertAzimuth(sun.azimuth);
  let moonAz = convertAzimuth(moon.azimuth);

  if (orientationMode === "body") {
    sunAz -= compassHeading;
    moonAz -= compassHeading;
  }

  if (horizonFlipped) {
    sunAz = (sunAz + 180) % 360;
    moonAz = (moonAz + 180) % 360;
  }

  return {
    sunAz,
    moonAz,
    sunAlt: sun.altitude,
    moonAlt: moon.altitude
  };
}

// Draw hand
function drawHand(cx, cy, radius, azimuth, altitude, color, width) {
  const rad = (azimuth - 90) * Math.PI / 180;

  const x = cx + radius * Math.cos(rad);
  const y = cy + radius * Math.sin(rad);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x, y);

  // If below horizon, dim
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

  // Horizon line (3–9)
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.strokeStyle = "#888";
  ctx.stroke();

  const { sunAz, moonAz, sunAlt, moonAlt } = getPositions();

  drawHand(cx, cy, radius, sunAz, sunAlt, "orange", 6);
  drawHand(cx, cy, radius, moonAz, moonAlt, "lightblue", 4);

  requestAnimationFrame(draw);
}

// Button binding AFTER load
window.addEventListener("load", () => {

  const modeBtn = document.getElementById("modeBtn");
  const compassBtn = document.getElementById("compassBtn");
  const flipBtn = document.getElementById("flipBtn");

  modeBtn.addEventListener("click", () => {
    orientationMode = orientationMode === "earth" ? "body" : "earth";
    modeBtn.textContent =
      orientationMode === "earth"
        ? "Orientation: Earth"
        : "Orientation: Body";
  });

  compassBtn.addEventListener("click", enableCompass);

  flipBtn.addEventListener("click", () => {
    horizonFlipped = !horizonFlipped;
  });

  draw();
});

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
