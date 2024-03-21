import MapServer from "mqtt";
import express from "express";
const router = express.Router();

const routesList = ["badapple", "status", "obstacles"];

export default function (mapServer: MapServer) {
  router.get("/", (_, res) => {
    res.send(
      routesList.map((link) => `<a href="/api/${link}">${link}</a>`).join("<br/>")
    );
  });

  router.get("/badapple", async (_, res) => {
    if (mapServer.playBadApple()) {
      await new Promise((r) => setTimeout(r, 1000));
      res.redirect("/public/badapple.mp4");
    } else res.send("Error, can't start Bad Apple!");
  });

  router.get("/status", (_, res) => {
    res.json(mapServer.status());
  });

  router.get("/obstacles", (_, res) => {
    res.json(mapServer.obstacles());
  });

  return router;
}
