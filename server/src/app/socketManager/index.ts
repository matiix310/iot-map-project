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

      const sendMessage = (author: String, color: String, message: String) => {
        socket.emit("displaymessage", author, color, message);
        socket.broadcast.emit("displaymessage", author, color, message);
      };

      socket.on("chatmessage", (author, color, message) => {
        sendMessage(author, color, message);

        if (message == "!badapple") {
          this.mapServer.playBadApple();
          sendMessage("Server", "grey", "Playing badapple!");
        }
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
}

interface ClientToServerEvents {
  chatmessage: (author: String, color: String, message: String) => void;
  badapple: () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}
