import MqttServer from "mqtt";

type Location = {
  x: number;
  y: number;
};

const MAX_OBSTACLE_DISTANCE = 30;

export default class Map {
  private obstacles: Location[];
  private walls: Location[][];
  private orientation: number;
  private position: Location;
  private worstTime: number;

  private vehicleWidth = 100;
  private vehicleHeight = 150;

  constructor() {
    this.obstacles = [];
    this.walls = [];
    this.orientation = 0;
    this.position = { x: 0, y: 0 };
    this.worstTime = 0;
  }

  connectToMqtt(mqttServer: MqttServer) {
    mqttServer.aedesClient.on("publish", (event, client) => {
      if (event.topic.startsWith("$SYS")) return;
      switch (event.topic) {
        case "Lego/Distance":
          {
            const distance = parseInt(event.payload.toString());
            const radOrientation = (this.orientation / 180) * Math.PI;
            const newDistance = distance + this.vehicleHeight / 2;
            this.obstacles.push({
              x: Math.round(this.position.x + Math.sin(radOrientation) * newDistance),
              y: Math.round(this.position.y + Math.cos(radOrientation) * newDistance),
            });
            console.log("New obstacles!");
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

        default:
          break;
      }
    });

    mqttServer.aedesClient.subscribe(
      "Lego/Distance",
      () => {},
      () => {}
    );

    mqttServer.aedesClient.subscribe(
      "Lego/Move",
      () => {},
      () => {}
    );

    mqttServer.aedesClient.subscribe(
      "Lego/Turn",
      () => {},
      () => {}
    );

    setInterval(() => {
      const start = Date.now();
      this.computeWalls();
      console.log(this.walls.length);
      if (this.walls.length !== 0)
        mqttServer.publish(
          "Map/Walls",
          this.walls
            .map((wall) =>
              wall.map((obstacle) => `${obstacle.x}/${obstacle.y}`).join(",")
            )
            .join("|"),
          (err) => {
            if (err) console.error(`Can't send packet: "Map/Walls"!`);
          }
        );
      const elapsedTime = Date.now() - start;
      if (elapsedTime > this.worstTime) {
        this.worstTime = elapsedTime;
        console.log(`Worst elapsed time! (${elapsedTime})`);
      }
    }, 1000);
  }

  private computeWalls() {
    // copy the obstacles to perform the calculation asynchronously
    const obstaclesCopy = this.obstacles.map((x) => x);
    this.obstacles = [];

    // group the points
    while (obstaclesCopy.length > 0) {
      const obstacle = obstaclesCopy.pop()!;
      let added = false;
      for (let wall of this.walls) {
        if (this.obstacleIsInWall(obstacle, wall)) {
          this.walls.push(this.placeObstacleInWall(obstacle, wall));
          added = true;
          break;
        }
      }
      if (!added) {
        this.walls.push([obstacle]);
      }
    }
  }

  private obstacleIsInWall(obstacle: Location, wall: Location[]): Boolean {
    for (let wallObstacle of wall) {
      if (this.distance(obstacle, wallObstacle) < MAX_OBSTACLE_DISTANCE) return true;
    }
    return false;
  }

  private distance(p1: Location, p2: Location): number {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);

    return Math.sqrt(dx * dx + dy * dy);
  }

  private placeObstacleInWall(obstacle: Location, wall: Location[]): Location[] {
    // the wall is to short
    if (wall.length < 2) {
      wall.push(obstacle);
      return [];
    }

    // get the two closest obstacles
    let o1Index = 0;
    let o1Distance = this.distance(wall[0], obstacle);
    let o2Index = 1;
    let o2Distance = this.distance(wall[1], obstacle);

    for (let i = 0; i < wall.length; i++) {
      const distance = this.distance(wall[i], obstacle);
      if (distance <= o1Distance) {
        o2Index = o1Index;
        o2Distance = o1Distance;
        o1Index = i;
        o1Distance = distance;
      } else if (distance < o2Distance) {
        o2Index = i;
        o2Distance = distance;
      }
    }

    const distanceO1O2 = this.distance(wall[o1Index], wall[o2Index]);
    if (Math.abs(o1Index - o2Index) == 1) {
      // check where to the obstacle is going to be:
      //  obstacle - o1 - o2: o1
      //  o1 - obstacle - o2: center
      //  o1 - o2 - obstacle: o2
      if (o1Distance < distanceO1O2 && o2Distance < distanceO1O2) {
        // center
        wall.splice(o1Index < o2Index ? o2Index : o1Index, 0, obstacle);
      } else if (o1Distance < distanceO1O2) {
        // o1
        wall.splice(o1Index < o2Index ? o1Index : o1Index + 1, 0, obstacle);
      } else {
        // o2
        wall.splice(o1Index < o2Index ? o2Index + 1 : o2Index, 0, obstacle);
      }
    } else {
      if (o1Distance < distanceO1O2 && o2Distance < distanceO1O2) {
        // center
        return [wall[o1Index], obstacle, wall[o2Index]];
      } else if (o1Distance < distanceO1O2) {
        // o1
        return [obstacle, wall[o1Index], wall[o2Index]];
      } else {
        // o2
        return [wall[o1Index], wall[o2Index], obstacle];
      }
    }

    return [];
  }
}
