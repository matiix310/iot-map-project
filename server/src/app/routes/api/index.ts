import MapServer from "mqtt";
import App from "../../";
import express from "express";
const router = express.Router();

const routesList = ["/badapple"];

export default function (mapServer: MapServer) {
  router.get("/", (req, res) => {
    res.json({ endpoints: routesList });
  });

  router.get("/badapple", async (req, res) => {
    if (mapServer.playBadApple()) {
      await new Promise((r) => setTimeout(r, 1000));
      res.redirect("/static/badapple.mp4");
    } else res.send("Error, can't start Bad Apple!");
  });

  return router;
}
