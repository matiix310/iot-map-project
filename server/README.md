
# Server

The core of our project. The server uses Express to create an MQTT brocker and an HTML static website wich is connected to the Express backend using Socket.IO. Using this architecture, we can communicate with our MQTT brocker from any device connected to the same network as the server or even host the server on a VPS and allow our system to be controlled from anywhere. The server also handle the computation tasks using its Express backend.

## Features

- Create a custom MQTT Broker and a static HTML server
- Live feed of the MQTT Broker events
- Compute Unit of the project

## Deployment

### Requirements
- [Node.js](https://nodejs.org)
- [PNPM](https://pnpm.io/) (optional, can be replaced by [NPM](https://www.npmjs.com/))

### Build and Run

To setup your local installation, you need to install all the dependencies first with the command
```shell
$ pnpm install
```

Then build the project (compile the typescript):

```shell
$ pnpm build
```

And finally run the compiled sources from ./build with the command:
```shell
$ pnpm start
```

By default the server should run an HTTP server on the port 80 and an MQTT Broker on the ports 9001 (websockets) and 1883 (mqtt).

### Developement

To build the project for a developement purpose run the command:
```shell
$ pnpm start:dev
```

It will automaticaly restart the project after each file change using [nodemon](https://github.com/remy/nodemon) and [ts-node](https://github.com/TypeStrong/ts-node).

## Screenshots

🚧 Under construction, come back later.

## 🛠️ Tech

The server contains three main parts:

- [**ExpressJs**](https://expressjs.com/): Node.js web application framework. It serves the front end and the back end of the web server.
- [**Aedes**](https://github.com/moscajs/aedes): A barebone MQTT server that can run on any stream servers. It can handle MQTT and WS protocols.
- [**Socket.IO**](https://github.com/socketio/socket.io): Enables real-time bidirectional event-based communication. It allows the **Express** server to communicate with the web clients and provide live updates (to display the live feeds or the MQTT Broker state).

Every thing is powered by [**Node.js**](https://nodejs.org) and [**PNPM**](https://pnpm.io/).
