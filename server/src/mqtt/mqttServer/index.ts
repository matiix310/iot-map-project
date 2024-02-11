import aedes from "aedes";
import net from "net";
import http from "http";
import ws from "websocket-stream";

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

  async start(mqttCallback: () => void, wsCallback: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      let mqtt = false;
      let ws = false;
      this.mqttServer.listen(this.mqttPort, () => {
        mqtt = true;
        mqttCallback();
        if (ws) resolve();
      });
      this.httpServer.listen(this.wsPort, () => {
        ws = true;
        wsCallback();
        if (mqtt) resolve();
      });

      setTimeout(() => {
        reject();
      }, 5000);
    });
  }

  stop() {
    this.mqttServer.close();
    this.httpServer.close();
  }

  isListening(): { mqtt: Boolean; http: Boolean } {
    return { mqtt: this.mqttServer.listening, http: this.mqttServer.listening };
  }

  private defaultErrCallback(error?: Error | undefined) {
    if (error) console.log(error);
  }

  publish(
    topic: string,
    payload: Buffer | string,
    callback: (error?: Error | undefined) => void = this.defaultErrCallback
  ) {
    this.aedesClient.publish(
      {
        cmd: "publish",
        messageId: Math.round(Math.random() * 1000),
        payload,
        retain: false,
        dup: false,
        topic,
        qos: 1,
      },
      callback
    );
  }

  subscribe(topic: string) {
    this.aedesClient.subscribe(
      topic,
      (e: any) => {
        e();
      },
      () => {}
    );
  }
}