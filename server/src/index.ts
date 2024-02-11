import App from "./app";
import MapServer from "./mqtt";

const mapServer = new MapServer(1883, 9001);
const expressServer = new App(3000, mapServer);

mapServer.start();
expressServer.start();
