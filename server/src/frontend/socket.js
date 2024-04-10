let audio = new Audio();

const host = "ws://" + window.location.host.split(":")[0] + ":4000";
var socket = null;

const connectSocket = () => {
  socket = io(host);

  socket.on("displaymessage", (author, color, message) => {
    displayMessage(author, message, color);
  });

  socket.on("action", (action) => {
    switch (action) {
      case "playBadapple":
        audio = new Audio("/public/badapple.aac");
        audio.play();
        break;

      case "stopBadapple":
        audio.pause();
        audio = new Audio();
        break;

      default:
        break;
    }
  });

  socket.on("setBadAppleTime", (time) => {
    audio = new Audio("/public/badapple.aac");
    audio.play();
    audio.currentTime = time;
  });

  socket.on("obstacles", onObstacles);

  socket.on("status", onStatus);
};
