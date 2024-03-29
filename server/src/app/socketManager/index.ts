import { Server as socketServer } from "socket.io";
import MapServer from "../../mqtt";
import http from "http";

export default class SocketManager {
  private io: socketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private mapServer: MapServer;
  private server;

  constructor(
    mapServer: MapServer,
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
  ) {
    this.io = new socketServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >();
    this.mapServer = mapServer;
    this.server = server;
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
        }
      });

      socket.on("legoTurn", (angle) => {
        this.mapServer.publish("Lego/Status", "T" + angle);
      });

      socket.on("legoStraight", (distance) => {
        this.mapServer.publish("Lego/Status", "S" + distance);
      });
    });

    this.io.listen(this.server);
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
}

interface ClientToServerEvents {
  chatmessage: (author: String, color: String, message: String) => void;
  // badapple: () => void;
  legoTurn: (angle: number) => void;
  legoStraight: (distance: number) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}
