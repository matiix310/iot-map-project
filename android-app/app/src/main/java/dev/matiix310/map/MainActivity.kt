package dev.matiix310.map

import MQTTClient
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.activity.ComponentActivity
import org.eclipse.paho.client.mqttv3.BufferedMessage
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

                    subscribe()
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.d(this.javaClass.name, "Connection failure: ${exception.toString()}")

                    Toast.makeText(context, "MQTT Connection fails: ${exception.toString()}",
                        Toast.LENGTH_LONG).show()
                }
            },
            object : MqttCallback {
                override fun messageArrived(topic: String?, message: MqttMessage?) {
                    val msg = "Receive message: '${message.toString()}' from topic: $topic"
                    // Log.d(this.javaClass.name, msg)

                    if (message == null)
                        return;

                    when (topic) {
                        "Map/Robot" -> canvas.setVehicle(message.toString())
                        "Map/Obstacles" -> canvas.addObstacles(message.payload)
                        "Map/Reset" -> canvas.reset();
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
                                subscribe()
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
        resetButton.setOnClickListener { mqttClient.publish("Client/Reset", "") }

        val rotateButton = findViewById<Button>(R.id.rotate_button)
        rotateButton.setOnClickListener { mqttClient.publish("Lego/Status", "T360") }

        val upButton = findViewById<Button>(R.id.up_button)
        upButton.setOnClickListener { mqttClient.publish("Lego/Status", "B100|90") }

        val downButton = findViewById<Button>(R.id.down_button)
        downButton.setOnClickListener { mqttClient.publish("Lego/Status", "B-100|90") }
    }

    private fun subscribe() {
        mqttClient.subscribe("Map/Robot")
        mqttClient.subscribe("Map/Obstacles")
        mqttClient.subscribe("Map/Reset")
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