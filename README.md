
# Map Project

Map is a group final project for the *Fundamentals of IOT* course at *Centria UAS*
## 📜 Documentation

### Android app: **Map**
**Map** is connected to the mqtt server and receive all the messages related to the robot sensors. It dispays the robot position, the obstacles and colors it has detected on the ground.

-> [Documentation](https://github.com/matiix310/iot-map-project/tree/main/android-app)

### Controller
The custom shell scripts we use to debug our robot and the mqtt comunication.

### Server
The core of our project. The server uses Express to create an MQTT brocker and an HTML static website wich is connected to the Express backend using Socket.IO. Using this architecture, we can communicate with our MQTT brocker from any device connected to the same network as the server or even host the server on a VPS and allow our system to be controlled from anywhere. The server also handle the computation tasks using its Express backend.

-> [Documentation](https://github.com/matiix310/iot-map-project/tree/main/server)


## 👑 Authors

- [@matiix310](https://github.com/matiix310)
- [@flavienhr](https://github.com/flavienhr)
