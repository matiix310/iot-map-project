import App from "./app";
import MapServer from "./mqtt";

const mapServer = new MapServer(1883, 9001);
const expressServer = new App(3000, mapServer);

mapServer.bindWebsocket(expressServer.socketManager);

mapServer.start();
expressServer.start();
