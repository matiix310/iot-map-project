import express, { Express } from "express";
import MapServer from "../mqtt";

// api route
import getApiRouter from "./routes/api";

export default class App {
  port: number;
  private app: Express;
  private mapServer: MapServer;

  constructor(port: number, mapServer: MapServer) {
    this.port = port;
    this.app = express();
    this.mapServer = mapServer;
  }

  start() {
    this.app.get("/", (req, res) => {
      res.send("Hi there");
    });

    this.app.use("/api", getApiRouter(this.mapServer));

    this.app.use("/static", express.static("src/mqtt/assets"));

    this.app.listen(this.port, () => {
      console.log("Express server listening on port", this.port);
    });
  }
}
