#!/usr/bin/env pybricks-micropython
from pybricks.hubs import EV3Brick
from pybricks.ev3devices import (Motor, TouchSensor, ColorSensor,
                                 InfraredSensor, UltrasonicSensor, GyroSensor)
from pybricks.parameters import Port, Stop, Direction, Button, Color
from pybricks.tools import wait, StopWatch, DataLog
from pybricks.robotics import DriveBase
from pybricks.media.ev3dev import SoundFile, ImageFile
#import library
from umqtt.robust import MQTTClient
import time


# This program requires LEGO EV3 MicroPython v2.0 or higher.
# Click "Open user guide" on the EV3 extension tab for more information.



#MQTT setup
MQTT_ClientID = "ElRobot"
MQTT_Broker = '192.168.4.1'
MQTT_Topic_Status = 'Lego/Status'
client = MQTTClient(MQTT_ClientID, MQTT_Broker, 1883)




# Create your objects here.
ev3 = EV3Brick()

# Motor
left_motor = Motor(Port.B)
right_motor = Motor(Port.C)

class UltraSensor2:
    def __init__(self, port):
        self.instance = UltrasonicSensor(port)
        self.ancien_time = time.time()
        self.ancienne_distance = self.instance.distance()

    def distance(self):
        if time.time() - self.ancien_time < 0.4:
            if self.instance.distance() - self.ancienne_distance > 50 or self.instance.distance() - self.ancienne_distance < -50:
                return self.ancienne_distance
        self.ancien_time = time.time()
        self.ancienne_distance = self.instance.distance()
        return self.ancienne_distance

UltraSensor = UltrasonicSensor(Port.S4)

class DriveBase2(DriveBase):
    # same as DriveBase but with angle function
    def __init__(self, left_motor, right_motor, wheel_diameter, axle_track):
        super().__init__(left_motor, right_motor, wheel_diameter, axle_track)
        self.ANG = 0
        self.old_angle = 0
        self.old_time = time.time()
        self.angle_speed = 0
        self.DEFAULT_ANGLE_SPEED = 40
        self.DEFAULT_SPEED = 100

    def drive(self, speed, turn):
        super().drive(speed, turn)
        self.angle_speed = turn
    
    def turn(self, angle):
        if angle < 0:
            self.angle_speed = -self.DEFAULT_ANGLE_SPEED
            angle = -angle
        else:
            self.angle_speed = self.DEFAULT_ANGLE_SPEED
        temps = angle / self.DEFAULT_ANGLE_SPEED
        start = time.time()
        self.old_time = start
        self.drive(0, self.angle_speed)
        while time.time() - start < temps:
            dist = UltraSensor.distance()
            if dist != 0 and dist < 2000:
                client.publish("Lego/Distance", str(dist))
            turn = self.angle()
            if turn != 0:
                client.publish("Lego/Turn", str(turn)) 
        self.drive(0,0)
        self.angle_speed = 0
    
    def straight(self, distance):
        start = time.time()
        loop = time.time()
        temps = distance / self.DEFAULT_SPEED
        if distance < 0:
            temps = (-distance) / self.DEFAULT_SPEED
            self.drive(-self.DEFAULT_SPEED, 0)
        else:
            self.drive(self.DEFAULT_SPEED, 0)
        while time.time() - start < temps:
            time.sleep(0.1)
            dist = UltraSensor.distance()
            move = (time.time() - loop) * self.DEFAULT_SPEED
            if dist != 0 and dist < 2000:
                client.publish("Lego/Move", str(move))
                client.publish("Lego/Distance", str(dist))
                loop = time.time()
            elif time.time() - loop > 0.4:
                client.publish("Lego/Move", str(move))
                loop = time.time()
        move = (time.time() - loop) * self.DEFAULT_SPEED
        client.publish("Lego/Move", str(move))
            
        self.drive(0,0)
        self.reset()
        client.publish("Lego/Out", "JE SUIS EN VIE")

        


    def angle(self):
        if super().state()[2] == 0:
            return 0
        start = time.time()
        self.ANG = float(start - self.old_time) * self.angle_speed
        self.old_time = start
        return self.ANG
        

robot = DriveBase2(left_motor, right_motor, wheel_diameter=54, axle_track=105)

#Gyro = GyroSensor(Port.S1)

Arm = Motor(Port.D)



CSensor = ColorSensor(Port.S2)





def send():
    move = robot.distance()
    if move != 0:
        client.publish("Lego/Move", str(move))
    dist = UltraSensor.distance()
    
    if dist != 0 and dist < 2000:
        client.publish("Lego/Distance", str(dist))
    turn = robot.angle()
    if turn != 0:
        client.publish("Lego/Turn", str(turn))
    
    robot.reset()


#callback for listen to topics
def listen(topic,msg):
    client.publish("Lego/Out", "J'ai ENTENDU")
    if topic == MQTT_Topic_Status.encode():
        m = str(msg.decode())
        if m[0] == "D":
            liste = m[1:].split("|")
            robot.drive(int(liste[0]), int(liste[1]))
        elif m[0] == "H":
            ev3.speaker.play_notes(["A2/4", "A2/4"])
        elif m[0] == "B":
            liste = m[1:].split("|")
            Arm.run_angle(int(liste[0]), int(liste[1]))
        elif m[0] == "T":
            angle = float(m[1:])
            if angle > 180 and angle != 360:
                angle = angle - 360
            robot.turn(angle)
            send()
        elif m[0] == "S":
            robot.straight(int(m[1:]))
        elif m[0] == "M":
            robot.turn(360)
        elif m[0] == "F":
            speed = 100
            turn_count = 0
            turn = 1
            turn_mul = 3
            while CSensor.color() != Color.RED:
                cs = CSensor.color()
                send()
                if cs == Color.BLACK:
                    speed = 100
                    turn_count = 0
                    robot.drive(speed, 0)
                elif cs == Color.BLUE:
                    speed = 50
                    turn_count = 0
                    robot.drive(speed, 0)
                else:
                    if turn_count >= 15:
                        turn = -turn
                        robot.turn(turn_count * turn * turn_mul)
                        turn_count = 0
                    robot.stop()
                    robot.turn(turn * turn_mul)
                    turn_count += 1

                ev3.screen.print(cs)
            
        

start = time.time()

# Write your program here.
client.connect()
client.set_callback(listen)
client.subscribe(MQTT_Topic_Status)




while True:
    client.check_msg()

    if time.time() - start > 0.4:
        start = time.time()
        send()
        
    
    
    
