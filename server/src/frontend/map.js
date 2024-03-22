// Constants
const obstacleWidth = 7;
let zoomLevel = 0.44; // 0.44
const zoomSensitivity = 1;

let obstacles = [];
let position = { x: 0, y: 0 };
let orientation = 0;

const canvasElement = document.getElementById("videoCanvas");
const videoFrame = document.getElementById("videoFrame");

const onStatus = (status) => {
  const statusArray = status.split("|");
  position.x = statusArray[0];
  position.y = statusArray[1];
  orientation = statusArray[2];
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

  clearCanvas();

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

const updateCanvas = () => {
  resizeCanvas();
  placeCanvas();
  drawObstacles();
};

window.onresize = updateCanvas;

const updateOnFrame = () => {
  updateCanvas();
  requestAnimationFrame(updateOnFrame);
};

updateOnFrame();

videoFrame.addEventListener("click", (e) => {
  const clickPosition = {
    x: e.layerX,
    y: e.layerY,
  };

  console.log(clickPosition.x, clickPosition.y);
});

videoFrame.addEventListener("wheel", (e) => {
  let delta = (e.wheelDeltaY * zoomSensitivity) / 1000 + 1;
  if (delta < 0) delta = 0;
  else if (delta > 2) delta = 2;

  zoomLevel *= delta;
});
