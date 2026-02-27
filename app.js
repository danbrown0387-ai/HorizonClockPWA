const canvas = document.getElementById("clockCanvas");
const ctx = canvas.getContext("2d");

let orientationMode = "earth";
let compassHeading = 0;

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function toggleMode() {
  orientationMode = orientationMode === "earth" ? "body" : "earth";
}

function requestCompass() {
  if (typeof DeviceOrientationEvent !== "undefined") {
    window.addEventListener("deviceorientation", (event) => {
      compassHeading = event.alpha || 0;
    });
  }
}

function getSunAngle() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  return (hours / 24) * 360;
}

function getMoonAngle() {
  const now = new Date();
  const dayOfMonth = now.getDate();
  return (dayOfMonth / 29.5) * 360;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 10;

  // Draw outer circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Horizon line (3–9)
  ctx.beginPath();
  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.strokeStyle = "#888";
  ctx.stroke();

  let sunAngle = getSunAngle();
  let moonAngle = getMoonAngle();

  if (orientationMode === "body") {
    sunAngle -= compassHeading;
    moonAngle -= compassHeading;
  }

  drawHand(centerX, centerY, radius, sunAngle, "orange", 6);
  drawHand(centerX, centerY, radius, moonAngle, "lightblue", 4);

  requestAnimationFrame(draw);
}

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

draw();

// Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
