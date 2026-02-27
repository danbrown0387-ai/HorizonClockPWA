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
  ctx.moveTo(centerX - radius, centerY
