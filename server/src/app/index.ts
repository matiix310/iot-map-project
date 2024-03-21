import express, { Express } from "express";
import http from "http";
import MapServer from "../mqtt";
import SocketManager from "./socketManager";

// api route
import getApiRouter from "./routes/api";
import path from "path";

export default class App {
  port: number;
  socketManager: SocketManager;

  private server;
  private app: Express;
  private mapServer: MapServer;

  constructor(port: number, mapServer: MapServer) {
    this.port = port;
    this.app = express();
    this.mapServer = mapServer;
    this.server = http.createServer(this.app);
    this.socketManager = new SocketManager(mapServer, this.server);
  }

  start() {
    this.socketManager.start();

    this.app.use("/api", getApiRouter(this.mapServer));

    this.app.use("/static", express.static(path.resolve("./") + "/src/mqtt/assets"));

    this.app.use("/public", express.static(path.resolve("./") + "/src/public"));

    // twotch
    this.app.use(express.static(path.resolve("./") + "/src/frontend"));

    this.server.listen(this.port, () => {
      console.log("Express server listening on port", this.port);
    });
  }

  sendPixels() {}
}
