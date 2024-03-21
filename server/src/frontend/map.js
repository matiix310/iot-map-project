// Constants
const obstacleWidth = 7;
const zoomLevel = 0.44;

let obstacles = [];
let position = { x: 0, y: 0 };

const canvasElement = document.getElementById("videoCanvas");
const videoFrame = document.getElementById("videoFrame");

const onObstacles = (buffer) => {
  const view = new DataView(buffer);

  const tmpObstacles = [];

  for (let i = 0; i < view.byteLength / 2; i += 2) {
    tmpObstacles[i / 2] = { x: view.getInt16(i * 2), y: view.getInt16(i * 2 + 2) };
  }

  obstacles = tmpObstacles;

  drawObstacles();
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

  ctx.translate(
    canvasElement.width / 2 - position.x,
    canvasElement.height / 2 + position.y
  );
};

const updateCanvas = () => {
  resizeCanvas();
  placeCanvas();
  drawObstacles();
};

window.onresize = updateCanvas;
updateCanvas();
