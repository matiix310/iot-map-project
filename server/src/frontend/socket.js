// const host = "ws://" + window.location.host.split(":")[0] + ":3000";
const socket = io();

socket.on("action", (action) => {
  switch (action) {
    case "playBadapple":
      var audio = new Audio("/public/badapple.aac");
      audio.play();
      break;

    default:
      break;
  }
});
