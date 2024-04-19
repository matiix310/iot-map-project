import { Server as socketServer } from "socket.io";
import MapServer from "../../mqtt";
import { App as uwsApp } from "uWebSockets.js";

export default class SocketManager {
  private io: socketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private mapServer: MapServer;
  private server = uwsApp();

  constructor(mapServer: MapServer) {
    this.io = new socketServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >({
      cors: {
        origin: "*",
      },
    });
    this.mapServer = mapServer;
  }

  start() {
    // Start the ws server
    this.io.on("connection", (socket) => {
      console.log("New client!");

      const sendMessage = (message: String) => {
        this.io.emit("displaymessage", "Server", "grey", message);
      };

      // check for badapple
      // ...
      // Allways check for badapple
      // ...
      const badAppleStatus = this.mapServer.badAppleStatus();
      if (badAppleStatus) {
        socket.emit("setBadAppleTime", badAppleStatus);
      }

      socket.on("chatmessage", (author, color, message) => {
        if (message == "") return;

        this.io.emit("displaymessage", author, color, message);

        if (message == "!badapple") {
          this.mapServer.playBadApple();
          sendMessage("Playing badapple!");
        } else if (message == "!status") {
          const status = this.mapServer.status();
          if (status.error) sendMessage("error! Can't read the status");
          else
            sendMessage(
              `Position> x: ${status.data.position.x}, y: ${status.data.position.y} | Orientation> ${status.data.orientation}°`
            );
        } else if (message == "!stop") {
          if (this.mapServer.badAppleStatus()) {
            this.mapServer.stopBadApple();
            sendMessage("Badapple has been stopped!");
          } else {
            sendMessage("Badapple is not currently playing... sad :'{");
          }
        } else if (message == "!reset") {
          this.mapServer.reset();
        }
      });

      socket.on("legoTurn", (angle) => {
        this.mapServer.publish("Lego/Status", "T" + angle);
      });

      socket.on("legoStraight", (distance) => {
        this.mapServer.publish("Lego/Status", "S" + distance);
      });

      socket.on("moveTo", (x, y) => {
        if (this.mapServer.addPing(x, y)) this.io.emit("addPing", x, y);
      });
    });

    this.io.attachApp(this.server);
    this.server.listen(4000, (token) => {
      if (!token) {
        console.warn("port already in use");
      }
      console.log("uWS server listening on port", 4000);
    });
  }

  sendMessage(message: String) {
    this.io.emit("displaymessage", "server", "grey", message);
  }

  sendObstacles(buffer: Buffer) {
    this.io.emit("obstacles", buffer);
  }

  sendStatus(status: String) {
    this.io.emit("status", status);
  }

  sendAction(action: String) {
    this.io.emit("action", action);
  }

  removePing(x: number, y: number) {
    this.io.emit("removePing", x, y);
  }
}

// Socket.io mandatory types

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  displaymessage: (author: String, color: String, message: String) => void;
  obstacles: (buffer: Buffer) => void;
  action: (action: String) => void;
  setBadAppleTime: (time: number) => void;
  status: (status: String) => void;
  addPing: (x: number, y: number) => void;
  removePing: (x: number, y: number) => void;
}

interface ClientToServerEvents {
  chatmessage: (author: String, color: String, message: String) => void;
  // badapple: () => void;
  legoTurn: (angle: number) => void;
  legoStraight: (distance: number) => void;
  moveTo: (x: number, y: number) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}
