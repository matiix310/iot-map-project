import aedes, { Client } from "aedes";
import net from "net";
import http from "http";
import ws from "websocket-stream";

type Listener = "client" | "clientDisconnect" | "subscribe" | "unsubscribe" | "publish";

export default class MqttServer {
  private mqttServer: net.Server;
  private httpServer: http.Server<
    typeof http.IncomingMessage,
    typeof http.ServerResponse
  >;
  private mqttPort: number;
  private wsPort: number;

  public aedesClient: aedes;

  constructor(mqttPort: number, wsPort: number) {
    this.mqttPort = mqttPort;
    this.wsPort = wsPort;
    this.aedesClient = new aedes({
      id: "Server",
    });
    this.mqttServer = net.createServer(this.aedesClient.handle);
    this.httpServer = http.createServer();
    ws.createServer({ server: this.httpServer }, this.aedesClient.handle as any);
  }

  start(mqttCallback: () => void, wsCallback: () => void) {
    this.mqttServer.listen(this.mqttPort, mqttCallback);

    this.httpServer.listen(this.wsPort, wsCallback);
  }

  stop() {
    this.mqttServer.close();
    this.httpServer.close();
  }

  isListening(): { mqtt: Boolean; http: Boolean } {
    return { mqtt: this.mqttServer.listening, http: this.mqttServer.listening };
  }
}
