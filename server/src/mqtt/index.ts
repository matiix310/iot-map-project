import MqttServer from "./mqttServer";
import Map, { Location } from "./map";

const blacklistTopic = ["Map/Obstacles", "Map/Robot"];

class MapServer {
  mqttPort: number;
  wsPort: number;

  private mqttServer: MqttServer | null;
  private map: Map | null;

  constructor(mqttPort: number, wsPort: number) {
    this.mqttPort = mqttPort;
    this.wsPort = wsPort;
    this.mqttServer = null;
    this.map = null;
  }

  start() {
    // MQTT Server
    this.mqttServer = new MqttServer(this.mqttPort, this.wsPort);

    // Map
    this.map = new Map(this.mqttServer);
    this.map.connectToMqtt();

    this.mqttServer.aedesClient.on("client", (client) => {
      console.log("New client: " + client.id);
    });

    this.mqttServer.aedesClient.on("clientDisconnect", (client) => {
      console.log("Client disconnected: " + client.id);
    });

    this.mqttServer.aedesClient.on("publish", (event, client) => {
      if (event.topic.startsWith("$SYS") || blacklistTopic.includes(event.topic)) return;
      console.log(`[${client?.id ?? "server"}] [${event.topic}]: ${event.payload}`);
    });

    this.mqttServer.aedesClient.on("subscribe", (subscrptions, client) => {
      console.log(
        client.id + " subscribed to: " + subscrptions.map((sub) => sub.topic).join(", ")
      );
    });

    this.mqttServer
      .start(
        () => {
          console.log("Aedes MQTT server listening on port", this.mqttPort);
        },
        () => {
          console.log("Websocket server listening on port", this.wsPort);
        }
      )
      .catch(() =>
        console.error("Map server listneners can't start! Please restart the server.")
      );
  }

  playBadApple(): boolean {
    if (!this.map) return false;
    this.map.playBadApple();
    return true;
  }

  status(): RequestJson<{ position: Location; orientation: number }> {
    if (!this.map)
      return {
        error: true,
        message: "The map is not loaded. Please try again later.",
      };
    return {
      error: false,
      data: {
        position: this.map.position,
        orientation: this.map.orientation,
      },
    };
  }

  obstacles(): RequestJson<Location[]> {
    if (!this.map)
      return {
        error: true,
        message: "The map is not loaded. Please try again later.",
      };
    return {
      error: false,
      data: this.map.obstacles,
    };
  }
}

type RequestJson<T> =
  | {
      error: true;
      message: string;
    }
  | {
      error: false;
      data: T;
    };

export default MapServer;
export type { RequestJson };
