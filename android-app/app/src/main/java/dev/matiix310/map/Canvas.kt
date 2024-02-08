package dev.matiix310.map

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.widget.Button
import org.eclipse.paho.client.mqttv3.IMqttActionListener
import org.eclipse.paho.client.mqttv3.IMqttToken
import kotlin.math.atan
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

class Canvas(context: Context, attrSet: android.util.AttributeSet): View(context, attrSet) {

    private val paint = Paint()
    private val path = Path()

    private val vehicleWidth = 100
    private val vehicleHeight = 150
    private val obstacleWidth = 20f

    private val obstacles = ArrayList<Point>()
    private var walls: List<List<Point>> = emptyList();
    private var orientation = 0f
    private val position: Point = Point(0, 0)
    private var vehicleColor = Color.RED;

    override fun onTouchEvent(event: MotionEvent?): Boolean {
        if (event != null) {
            val dx = event.x - width / 2
            val dy = -event.y + height / 2

            Log.d("dx", dx.toString())
            Log.d("dy", dy.toString())
            var angle = (((atan(dx / dy) - orientation) / Math.PI) * 180).toInt()
            val distance = sqrt(dx * dx + dy * dy).toInt()

            if (dy < 0) {
                if (dx > 0) {
                    angle += 180
                } else {
                    angle -= 180
                }
            }


            MainActivity.mqttClient.publish("Lego/Status", msg = "T${angle}", cbPublish = object: IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                }
            })

            MainActivity.mqttClient.publish("Lego/Status", msg = "S${distance}", cbPublish = object: IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                }
            })

            // Turn: T`angle`
            // Move: D`distance`
        }
        return this.performClick()
    }

    override fun performClick(): Boolean {
        return super.performClick()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        // Draw the obstacles
        paint.color = Color.RED
        paint.strokeWidth = obstacleWidth

        for (obstacle in obstacles) {
            canvas.drawPoint(
                width / 2 - position.x + obstacle.x.toFloat(),
                height / 2 + position.y - obstacle.y.toFloat(),
                paint)
        }

        // draw the walls
        paint.color = Color.BLUE

        for (wall in walls) {
            val start = absoluteToRelativePosition(wall[0])
            path.moveTo(start.x.toFloat(), start.y.toFloat())
            for (i in 1..wall.size) {
                val destination = absoluteToRelativePosition(wall[i])
                path.lineTo(destination.x.toFloat(), destination.y.toFloat())
            }
        }

        // Draw the vehicle
        paint.color = vehicleColor
        val x = (width - vehicleWidth) / 2
        val y = (height - vehicleHeight) / 2
        val rect = Rect(x, y, x + vehicleWidth, y + vehicleHeight)

        canvas.save()
        canvas.rotate(
            orientation,
            width / 2f,
            height / 2f)
        canvas.drawRect(rect, paint)
        canvas.restore()
    }

    private fun absoluteToRelativePosition(point: Point): Point {
        return Point(
            width / 2 + point.x - position.x,
            height / 2 - point.y - position.y
        )
    }

    fun placeObstacle(distance: Int) {
        val radOrientation = 2f * (orientation / 360f) * Math.PI
        val newDistance = distance + vehicleHeight / 2
        obstacles.add(Point(
            position.x + (sin(radOrientation) * newDistance).toInt(),
            position.y + (cos(radOrientation) * newDistance).toInt()
        ))
        invalidate()
    }

    fun moveVehicle(distance: Int) {
        val radOrientation = 2f * (orientation / 360f) * Math.PI;
        position.x += (sin(radOrientation) * distance).toInt();
        position.y += (cos(radOrientation) * distance).toInt();
        invalidate()
    }

    fun turnVehicle(degree: Float) {
        orientation += degree
        invalidate()
    }

    fun changeVehicleColor(color: Int) {
        vehicleColor = color
        invalidate()
    }

    fun reset() {
        position.x = 0
        position.y = 0
        orientation = 0f
        obstacles.clear()
        invalidate()
    }

    fun setWalls(rowWalls: String) {
        this.walls = rowWalls.split("|").map {
            it.split(",").map {
                val position = it.split("/")
                Point(position[0].toInt(), position[1].toInt());
            }
        };
        this.obstacles.clear()
    }
}

class Point(var x: Int, var y: Int)