import SocketManager from "../../app/socketManager";
import MqttServer from "../mqttServer";
import fs from "fs";
import path from "path";

type Location = {
  x: number;
  y: number;
};

class Map {
  // Map
  obstacles: Location[];
  pings: Location[];
  currentPing: Location | null;

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
    this.obstacles = [
      // { x: 200, y: 200 },
      // { x: 200, y: 210 },
      // { x: 200, y: 220 },
      // { x: 200, y: 230 },
      // { x: 210, y: 240 },
      // { x: 220, y: 250 },
      // { x: 220, y: 260 },
      // { x: 220, y: 270 },
      // { x: 220, y: 290 },
      // { x: 100, y: 300 },
      // { x: 120, y: 300 },
      // { x: 120, y: 300 },
      // { x: 110, y: 300 },
      // { x: 110, y: 300 },
      // { x: 130, y: 320 },
      // { x: 130, y: 330 },
      // { x: 140, y: 320 },
      // { x: 150, y: 310 },
      // { x: 160, y: 310 },
      // { x: 170, y: 310 },
      // { x: 180, y: 310 },
      // { x: 190, y: 310 },
      // { x: 200, y: 310 },
      // { x: 210, y: 300 },
    ];
    this.pings = [];
    this.currentPing = null;
    this.orientation = 0;
    this.position = { x: 0, y: 0 };
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
            this.reset();
          }
          break;

        case "Lego/Ping":
          {
            if (this.currentPing) {
              this.socketManager?.removePing(this.currentPing.x, this.currentPing.y);
              this.currentPing = null;
            } else {
              console.error(
                "Euuuh, y'a clairement un problème! currentPing est null et on me demande de le supprimer. Le robot est complétement désynchronisé!"
              );
            }
          }
          break;

        default:
          break;
      }
    });

    this.mqttServer.subscribe("Lego/Distance");
    this.mqttServer.subscribe("Lego/Move");
    this.mqttServer.subscribe("Lego/Turn");
    this.mqttServer.subscribe("Lego/Ping");
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

        // manage pings
        if (this.pings.length > 0 && !this.currentPing) {
          this.currentPing = this.pings.splice(0, 1)[0];
          // compute the angle and the distance
          const deltaX = this.currentPing.x - this.position.x;
          const deltaY = this.currentPing.y - this.position.y;
          const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          let angle =
            360 - ((180 / Math.PI) * Math.atan2(deltaY, deltaX) - 90) - this.orientation;

          // home made modulo
          if (angle >= 360) angle -= 360;
          else if (angle < 0) angle += 360;

          this.mqttServer.publish("Lego/Status", "T" + Math.round(angle));
          this.mqttServer.publish("Lego/Status", "S" + Math.round(dist));
        }
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
    const fps = 20;
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

  reset() {
    this.obstacles = [];
    this.pings = [];
    this.currentPing = null;
    this.orientation = 0;
    this.position = { x: 0, y: 0 };
    this.worstTime = 0;

    this.mqttServer.publish("Map/Reset", "");
  }
}

export default Map;
export type { Location };
