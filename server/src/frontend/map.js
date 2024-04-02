// Constants
const obstacleWidth = 7;
const vehicleWidth = 100;
const vehicleHeight = 150;
const frontHeight = 100;
let zoomLevel = 0.44; // 0.44
const zoomSensitivity = 1;

let obstacles = [];
let position = { x: 0, y: 0 };
let vehicleOrientation = 0;

const canvasElement = document.getElementById("videoCanvas");
const videoFrame = document.getElementById("videoFrame");

const onStatus = (status) => {
  const statusArray = status.split("|");
  position.x = statusArray[0];
  position.y = statusArray[1];
  vehicleOrientation = statusArray[2].toString();
};

const onObstacles = (buffer) => {
  const view = new DataView(buffer);

  const tmpObstacles = [];

  for (let i = 0; i < view.byteLength / 2; i += 2) {
    tmpObstacles[i / 2] = { x: view.getInt16(i * 2), y: view.getInt16(i * 2 + 2) };
  }

  obstacles = tmpObstacles;
};

const clearCanvas = () => {
  if (!canvasElement.getContext) return;

  const ctx = canvasElement.getContext("2d");
  // Store the current transformation matrix
  ctx.save();

  // Use the identity matrix while clearing the canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Restore the transform
  ctx.restore();
};

const drawObstacles = () => {
  if (!canvasElement.getContext) return;

  const obstacleOffset = (obstacleWidth * zoomLevel) / 2;
  const realObstacleWidth = obstacleWidth * zoomLevel + 1;
  const ctx = canvasElement.getContext("2d");

  for (let { x, y } of obstacles) {
    ctx.fillRect(
      x * zoomLevel - obstacleOffset,
      -y * zoomLevel - obstacleOffset,
      realObstacleWidth,
      realObstacleWidth
    );
  }
};

// Set canvas size

const resizeCanvas = () => {
  canvasElement.width = videoFrame.clientWidth;
  canvasElement.height = canvasElement.width / 1.78;
};

const placeCanvas = () => {
  if (!canvasElement.getContext) return;

  const ctx = canvasElement.getContext("2d");

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.translate(
    canvasElement.width / 2 - position.x * zoomLevel,
    canvasElement.height / 2 + position.y * zoomLevel
  );
};

const drawVehicle = () => {
  if (!canvasElement.getContext) return;

  const ctx = canvasElement.getContext("2d");

  ctx.save();
  ctx.translate(position.x * zoomLevel, -position.y * zoomLevel);
  ctx.rotate((Math.PI / 180) * vehicleOrientation);
  ctx.translate(-position.x * zoomLevel, position.y * zoomLevel);
  ctx.fillStyle = socket && socket.connected ? "lime" : "red";
  ctx.fillRect(
    (position.x - vehicleWidth / 2) * zoomLevel,
    -position.y * zoomLevel,
    vehicleWidth * zoomLevel,
    vehicleHeight * zoomLevel
  );
  ctx.fillStyle = "blue";
  ctx.fillRect(
    (position.x - vehicleWidth / 2) * zoomLevel,
    (-position.y - frontHeight) * zoomLevel,
    vehicleWidth * zoomLevel,
    frontHeight * zoomLevel
  );
  ctx.fillStyle = "black";
  ctx.restore();
};

const updateCanvas = () => {
  clearCanvas();
  resizeCanvas();
  placeCanvas();
  drawObstacles();
  drawVehicle();
};

// window.onresize = updateCanvas;

const updateOnFrame = () => {
  updateCanvas();
  requestAnimationFrame(updateOnFrame);
};

updateOnFrame();

videoFrame.addEventListener("click", (e) => {
  const clickX = e.layerX;
  const clickY = e.layerY;
  const centerX = e.target.width / 2;
  const centerY = e.target.height / 2;
  const deltaX = Math.abs(centerX - clickX);
  const deltaY = Math.abs(centerY - clickY);

  const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / zoomLevel;

  let angle =
    (180 / Math.PI) * Math.atan2(clickX - centerX, clickY - centerY) +
    180 +
    parseInt(vehicleOrientation);

  if (angle > 360) angle -= 360;
  else if (angle < 0) angle += 360;

  if (socket) {
    socket.emit("legoTurn", Math.round(angle));
    socket.emit("legoStraight", Math.round(dist));
  }
});

videoFrame.addEventListener("wheel", (e) => {
  let delta = (e.wheelDeltaY * zoomSensitivity) / 1000 + 1;
  if (delta < 0) delta = 0;
  else if (delta > 2) delta = 2;

  zoomLevel *= delta;
});
