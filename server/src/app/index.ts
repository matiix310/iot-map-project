import express, { Express } from "express";
import http from "http";
import MapServer from "../mqtt";
import { Server as socketServer } from "socket.io";

// api route
import getApiRouter from "./routes/api";
import path from "path";

export default class App {
  port: number;
  private server;
  private app: Express;
  private mapServer: MapServer;
  private io: socketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

  constructor(port: number, mapServer: MapServer) {
    this.port = port;
    this.app = express();
    this.mapServer = mapServer;
    this.io = new socketServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >();
    this.server = http.createServer(this.app);
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

    this.app.use("/api", getApiRouter(this.mapServer));

    this.app.use("/static", express.static(path.resolve("./") + "/src/mqtt/assets"));

    this.app.use("/public", express.static(path.resolve("./") + "/src/public"));

    // twotch
    this.app.use(express.static(path.resolve("./") + "/src/frontend"));

    this.server.listen(this.port, () => {
      console.log("Express server listening on port", this.port);
    });
  }
}

// Socket.io mandatory types

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  displaymessage: (author: String, color: String, message: String) => void;
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
