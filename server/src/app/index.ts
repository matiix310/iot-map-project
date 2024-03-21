import express, { Express } from "express";
import MapServer from "../mqtt";
import eiwos from "eiows";
import { Server as socketServer } from "socket.io";

// api route
import getApiRouter from "./routes/api";
import path from "path";

export default class App {
  port: number;
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
  }

  start() {
    // Start the ws server
    this.io.on("connection", (socket) => {
      console.log("New client!");

      socket.on("chatmessage", (author, color, message) => {
        socket.emit("displaymessage", author, color, message);
        socket.broadcast.emit("displaymessage", author, color, message);

        if (message == "!badapple") {
          this.mapServer.playBadApple();
          socket.emit("displaymessage", "Server", "grey", "Playing badapple!");
          socket.broadcast.emit("displaymessage", "Server", "grey", "Playing badapple!");
        }
      });
    });

    this.io.listen(4000, {
      wsEngine: eiwos.Server,
      cors: {
        origin: "http://localhost:" + this.port,
      },
    });
    console.log("Socket.io websocket server listening on port", 4000);

    this.app.use("/api", getApiRouter(this.mapServer));

    this.app.use("/static", express.static(path.resolve("./") + "/src/mqtt/assets"));

    this.app.use("/public", express.static(path.resolve("./") + "/src/public"));

    // twotch
    this.app.use(express.static(path.resolve("./") + "/src/frontend"));

    this.app.listen(this.port, () => {
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
