import SocketManager from "../../app/socketManager";
import MqttServer from "../mqttServer";
import fs from "fs";
import Jimp from "jimp";
import path from "path";

type Location = {
  x: number;
  y: number;
};

class Map {
  // Map
  obstacles: Location[];

  // Robot
  orientation: number;
  position: Location;

  // Debug
  private worstTime: number;
  private badapple: boolean;
  private badappleTime: number;

  // Constants
  private vehicleWidth = 100;
  private vehicleHeight = 150;
  private obstacleWidth = 7;
  private obstacleMargin = 10;

  // MQTT Server
  private mqttServer: MqttServer;
  private socketManager: SocketManager | null = null;

  constructor(mqttServer: MqttServer) {
    this.obstacles = [{ x: 0, y: 0 }];
    this.orientation = 20;
    this.position = { x: 0, y: -200 };
    this.worstTime = 0;
    this.mqttServer = mqttServer;
    this.badapple = false;
    this.badappleTime = 0;
  }

  connectToMqtt() {
    this.mqttServer.aedesClient.on("publish", (event, _) => {
      if (event.topic.startsWith("$SYS")) return;
      switch (event.topic) {
        case "Lego/Distance":
          {
            const distance = parseFloat(event.payload.toString());
            const radOrientation = (this.orientation / 180) * Math.PI;
            const newDistance = distance + this.vehicleHeight / 2;
            const newObstacle = {
              x: Math.round(this.position.x + Math.sin(radOrientation) * newDistance),
              y: Math.round(this.position.y + Math.cos(radOrientation) * newDistance),
            };

            let i = 0;
            while (
              i < this.obstacles.length &&
              this.distance(this.obstacles[i], newObstacle) >=
                this.obstacleWidth + this.obstacleMargin * 2
            )
              i++;

            if (i === this.obstacles.length) this.obstacles.push(newObstacle);
          }
          break;

        case "Lego/Move":
          {
            const distance = parseFloat(event.payload.toString());
            const radOrientation = (this.orientation / 180) * Math.PI;
            this.position.x += Math.sin(radOrientation) * distance;
            this.position.y += Math.cos(radOrientation) * distance;
          }
          break;

        case "Lego/Turn":
          {
            const degree = parseFloat(event.payload.toString());
            this.orientation += degree;
          }
          break;

        case "Client/Reset":
          {
            this.obstacles = [];
            this.orientation = 0;
            this.position = { x: 0, y: 0 };
            this.worstTime = 0;

            this.mqttServer.publish("Map/Reset", "");
          }
          break;

        default:
          break;
      }
    });

    this.mqttServer.subscribe("Lego/Distance");
    this.mqttServer.subscribe("Lego/Move");
    this.mqttServer.subscribe("Lego/Turn");
    this.mqttServer.subscribe("Client/Reset");

    setInterval(() => {
      const start = Date.now();

      this.orientation %= 360;

      if (!this.badapple) {
        // Robot infos
        this.mqttServer.publish(
          "Map/Robot",
          `${Math.round(this.position.x)}|${Math.round(this.position.y)}|${
            this.orientation
          }`
        );

        // Obstacles list
        const buffer = this.getBufferFromObstacles(this.obstacles);
        this.mqttServer.publish("Map/Obstacles", buffer);
      }

      // Debug
      const elapsedTime = Date.now() - start;
      if (elapsedTime > this.worstTime) {
        this.worstTime = elapsedTime;
        console.log(`Worst elapsed time! (${elapsedTime}ms)`);
      }
    }, 500);
  }

  bindWebsocket(socketManager: SocketManager) {
    this.socketManager = socketManager;
  }

  private distance(p1: Location, p2: Location): number {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);

    return Math.sqrt(dx * dx + dy * dy);
  }

  async playBadApple() {
    const framesPath = path.resolve("./") + "/src/mqtt/assets/badapple/";
    const framesName = fs.readdirSync(framesPath);
    framesName.sort();
    const framesCount = framesName.length;
    const fps = 5;
    const width = 240;
    const height = 180;

    this.badappleTime = 0;
    this.badapple = true;

    this.mqttServer.publish(
      "Map/Robot",
      `${Math.round(width / 2) * this.obstacleWidth}|${
        Math.round(height / 2) * this.obstacleWidth
      }|0`
    );

    this.socketManager?.sendAction("playBadapple");

    let frameIndex = 0;
    while (this.badapple && frameIndex < framesCount) {
      this.badappleTime = frameIndex / fps;
      const frameName = framesName[frameIndex];
      const start = Date.now();

      const buffer = fs.readFileSync(framesPath + frameName);

      this.socketManager?.sendObstacles(buffer);
      const timeout = 1000 / fps;
      await new Promise((r) => {
        const processTime = Date.now() - start;
        if (processTime >= timeout) console.log(`Slow frame render (${frameName})!`);
        return setTimeout(r, timeout - processTime);
      });
      frameIndex++;
    }

    this.socketManager?.sendAction("stopBadapple");
    this.badapple = false;
  }

  private getBufferFromObstacles(obstacles: Location[]): Buffer {
    type Int16 = number & { __brand: "int16" };

    const buffer = Buffer.alloc(4 * obstacles.length);

    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      buffer.writeInt16BE(obstacle.x as Int16, i * 4);
      buffer.writeInt16BE(obstacle.y as Int16, i * 4 + 2);
    }
    return buffer;
  }

  stopBadApple() {
    this.badapple = false;
  }

  badAppleStatus(): number | null {
    return this.badapple ? this.badappleTime : null;
  }
}

export default Map;
export type { Location };
