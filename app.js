importScripts('https://cdnjs.cloudflare.com/ajax/libs/suncalc/1.9.0/suncalc.min.js');

const canvas = document.getElementById("clockCanvas");
const ctx = canvas.getContext("2d");

let orientationMode = "earth";
let compassHeading = 0;
let userLat = 0;
let userLon = 0;

// Resize canvas
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Toggle orientation
function toggleMode() {
  orientationMode = orientationMode === "earth" ? "body" : "earth";
}

// Compass
function requestCompass() {
  if (typeof DeviceOrientationEvent !== "undefined") {
    window.addEventListener("deviceorientation", (event) => {
      compassHeading = event.alpha || 0;
    });
  }
}

// Get user location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((pos) => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;
  });
}

// Compute Sun & Moon angles
function getSunMoonAngles() {
  const now = new Date();
  const sunPos = SunCalc.getPosition(now, userLat, userLon);
  const moonPos = SunCalc.getMoonPosition(now, userLat, userLon);

  // Convert azimuth (-π..π) to degrees (0..360) for canvas
  let sunAngle = ((sunPos.azimuth * 180/Math.PI) + 180) % 360;
  let moonAngle = ((moonPos.azimuth * 180/Math.PI) + 180) % 360;

  if (orientationMode === "body") {
    sunAngle -= compassHeading;
    moonAngle -= compassHeading;
  }

  return { sunAngle, moonAngle };
}

// Draw function
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 10;

  // Outer circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Horizon line
  ctx.beginPath();
  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.strokeStyle = "#888";
  ctx.stroke();

  const { sunAngle, moonAngle } = getSunMoonAngles();

  drawHand(centerX, centerY, radius, sunAngle, "orange", 6);
  drawHand(centerX, centerY, radius, moonAngle, "lightblue", 4);

  requestAnimationFrame(draw);
}

// Draw hand
function drawHand(cx, cy, radius, angle, color, width) {
  const rad = (angle - 90) * (Math.PI / 180);
  const x = cx + radius * Math.cos(rad);
  const y = cy + radius * Math.sin(rad);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// Start animation
window.onload = () => {
  draw();
  requestCompass();
};

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
