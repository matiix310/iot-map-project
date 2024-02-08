import MqttServer from "mqtt";

type Location = {
  x: number;
  y: number;
};

const MAX_OBSTACLE_DISTANCE = 30;

export default class Map {
  // Map
  private newObstacles: Location[];
  private obstacles: Location[];

  // Robot
  private orientation: number;
  private position: Location;

  // Debug
  private worstTime: number;

  // Constants
  private vehicleWidth = 100;
  private vehicleHeight = 150;

  // MQTT Server
  private mqttServer: MqttServer;

  constructor(mqttServer: MqttServer) {
    this.newObstacles = [];
    this.obstacles = [];
    this.orientation = 0;
    this.position = { x: 0, y: 0 };
    this.worstTime = 0;
    this.mqttServer = mqttServer;
  }

  connectToMqtt() {
    this.mqttServer.aedesClient.on("publish", (event, _) => {
      if (event.topic.startsWith("$SYS")) return;
      switch (event.topic) {
        case "Lego/Distance":
          {
            const distance = parseInt(event.payload.toString());
            const radOrientation = (this.orientation / 180) * Math.PI;
            const newDistance = distance + this.vehicleHeight / 2;
            this.newObstacles.push({
              x: Math.round(this.position.x + Math.sin(radOrientation) * newDistance),
              y: Math.round(this.position.y + Math.cos(radOrientation) * newDistance),
            });
          }
          break;

        case "Lego/Move":
          {
            const distance = parseInt(event.payload.toString());
            const radOrientation = (this.orientation / 180) * Math.PI;
            this.position.x += Math.round(Math.sin(radOrientation) * distance);
            this.position.y += Math.round(Math.cos(radOrientation) * distance);
          }
          break;

        case "Lego/Turn":
          {
            const degree = parseInt(event.payload.toString());
            this.orientation += degree;
          }
          break;

        case "Client/Reset":
          {
            this.newObstacles = [];
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

      // Obstacles list
      this.mqttServer.publish(
        "Map/Obstacles",
        this.newObstacles.map((obstacle) => `${obstacle.x}/${obstacle.y}`).join("|")
      );
      this.obstacles.push(...this.newObstacles);
      this.newObstacles = [];

      // Robot infos
      this.mqttServer.publish(
        "Map/Robot",
        `${Math.round(this.position.x)}|${Math.round(this.position.y)}|${
          this.orientation
        }`
      );

      // Debug
      const elapsedTime = Date.now() - start;
      if (elapsedTime > this.worstTime) {
        this.worstTime = elapsedTime;
        console.log(`Worst elapsed time! (${elapsedTime}ms)`);
      }
    }, 500);
  }

  private distance(p1: Location, p2: Location): number {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);

    return Math.sqrt(dx * dx + dy * dy);
  }
}
