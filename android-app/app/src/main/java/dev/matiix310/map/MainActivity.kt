package dev.matiix310.map

import MQTTClient
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.Toast
import androidx.activity.ComponentActivity
import org.eclipse.paho.client.mqttv3.IMqttActionListener
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken
import org.eclipse.paho.client.mqttv3.IMqttToken
import org.eclipse.paho.client.mqttv3.MqttCallback
import org.eclipse.paho.client.mqttv3.MqttMessage


class MainActivity : ComponentActivity() {
    lateinit var canvas: Canvas;
    val context: Context = this;

    companion object {
        lateinit var mqttClient: MQTTClient
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_canvas);
        canvas = findViewById(R.id.canvas)

        val intent = intent
        val ip = intent.getStringExtra("ip")

        mqttClient = MQTTClient(this, "ws://$ip:9001", "Android.Map")

        mqttClient.connect(
            object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.d(this.javaClass.name, "Connection success")

                    Toast.makeText(context, "MQTT Connection success", Toast.LENGTH_SHORT).show()
                    canvas.changeVehicleColor(Color.GREEN)

                    mqttClient.subscribe("Lego/Distance", cbSubscribe = object: IMqttActionListener {
                        override fun onSuccess(asyncActionToken: IMqttToken?) {
                            Log.d(this.javaClass.name, "Subscribed to Lego/Distance")
                        }

                        override fun onFailure(
                            asyncActionToken: IMqttToken?,
                            exception: Throwable?
                        ) {
                            Log.d(this.javaClass.name, "Failed to subscribed to Lego/Distance: " + exception.toString())
                        }
                    });

                    mqttClient.subscribe("Lego/Turn", cbSubscribe = object: IMqttActionListener {
                        override fun onSuccess(asyncActionToken: IMqttToken?) {
                            Log.d(this.javaClass.name, "Subscribed to Lego/Turn")
                        }

                        override fun onFailure(
                            asyncActionToken: IMqttToken?,
                            exception: Throwable?
                        ) {
                            Log.d(this.javaClass.name, "Failed to subscribed to Lego/Turn: " + exception.toString())
                        }
                    });

                    mqttClient.subscribe("Lego/Move", cbSubscribe = object: IMqttActionListener {
                        override fun onSuccess(asyncActionToken: IMqttToken?) {
                            Log.d(this.javaClass.name, "Subscribed to Lego/Move")
                        }

                        override fun onFailure(
                            asyncActionToken: IMqttToken?,
                            exception: Throwable?
                        ) {
                            Log.d(this.javaClass.name, "Failed to subscribed to Lego/Move: " + exception.toString())
                        }
                    });

                    mqttClient.subscribe("Map/Walls", cbSubscribe = object: IMqttActionListener {
                        override fun onSuccess(asyncActionToken: IMqttToken?) {
                            Log.d(this.javaClass.name, "Subscribed to Map/Walls")
                        }

                        override fun onFailure(
                            asyncActionToken: IMqttToken?,
                            exception: Throwable?
                        ) {
                            Log.d(this.javaClass.name, "Failed to subscribed to Map/Walls: " + exception.toString())
                        }
                    });
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.d(this.javaClass.name, "Connection failure: ${exception.toString()}")

                    Toast.makeText(context, "MQTT Connection fails: ${exception.toString()}",
                        Toast.LENGTH_LONG).show()
                }
            },
            object : MqttCallback {
                override fun messageArrived(topic: String?, message: MqttMessage?) {
                    val msg = "Receive message: ${message.toString()} from topic: $topic"
                    Log.d(this.javaClass.name, msg)

                    when (topic) {
                        "Lego/Distance" -> canvas.placeObstacle(message.toString().toInt())
                        "Lego/Turn" -> canvas.turnVehicle(message.toString().toFloat())
                        "Lego/Move" -> canvas.moveVehicle(message.toString().toInt())
                        "Map/Walls" -> canvas.setWalls(message.toString())
                    }
                }

                override fun connectionLost(cause: Throwable?) {
                    Log.d(this.javaClass.name, "Connection lost ${cause.toString()}")
                    canvas.changeVehicleColor(Color.RED)

                    val mainHandler = Handler(Looper.getMainLooper())

                    mainHandler.post(object : Runnable {
                        override fun run() {
                            if (mqttClient.isConnected()) {
                                canvas.changeVehicleColor(Color.GREEN)
                            } else {
                                canvas.changeVehicleColor(Color.RED)
                                mainHandler.postDelayed(this, 1000)
                            }
                        }
                    })

                }

                override fun deliveryComplete(token: IMqttDeliveryToken?) {
                    Log.d(this.javaClass.name, "Delivery complete")
                }
            })

        val resetButton = findViewById<Button>(R.id.reset_button)

        resetButton.setOnClickListener { canvas.reset() }

    }

    override fun onDestroy() {
        super.onDestroy()
        mqttClient.disconnect(object: IMqttActionListener {
            override fun onSuccess(asyncActionToken: IMqttToken?) {
            }

            override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
            }
        })
    }
}