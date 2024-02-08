import MqttServer from "./mqtt";
import Map from "./map";

const mqttPort = 1883;
const wsPort = 9001;

// MQTT Server
const mqttServer = new MqttServer(mqttPort, wsPort);

// Map
const map = new Map();
map.connectToMqtt(mqttServer);

mqttServer.aedesClient.on("client", (client) => {
  console.log("New client: " + client.id);
});

mqttServer.aedesClient.on("clientDisconnect", (client) => {
  console.log("Client disconnected: " + client.id);
});

mqttServer.aedesClient.on("publish", (event, client) => {
  if (event.topic.startsWith("$SYS")) return;
  console.log(`[${client?.id}] [${event.topic}]: ${event.payload}`);
});

mqttServer.aedesClient.on("subscribe", (subscrptions, client) => {
  console.log(
    client.id + "subscribed to: " + subscrptions.map((sub) => sub.topic).join(", ")
  );
});

mqttServer
  .start(
    () => {
      console.log("Aedes MQTT server started and listening on port", mqttPort);
    },
    () => {
      console.log("Websocket server listening on port ", wsPort);
    }
  )
  .catch(() =>
    console.error("Server listneners can't start! Please restart the server.")
  );
