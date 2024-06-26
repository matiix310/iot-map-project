package dev.matiix310.map

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.util.Log
import android.view.MotionEvent
import android.view.View
import org.eclipse.paho.client.mqttv3.IMqttActionListener
import org.eclipse.paho.client.mqttv3.IMqttToken
import java.math.BigInteger
import kotlin.experimental.and
import kotlin.experimental.or
import kotlin.math.atan
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

class Canvas(context: Context, attrSet: android.util.AttributeSet): View(context, attrSet) {

    private val paint = Paint()

    private val vehicleWidth = 100
    private val vehicleHeight = 150
    private val obstacleWidth = 7f
    private val frontHeight = 100;

    private val obstacles = ArrayList<PointF>()
    private var orientation = 0f
    private val position: Point = Point(0f, 0f)
    private var vehicleColor = Color.RED;

    override fun onTouchEvent(event: MotionEvent?): Boolean {
        if (event != null) {
            val dx = event.x - width / 2
            val dy = -event.y + height / 2

            Log.d("dx", dx.toString())
            Log.d("dy", dy.toString())
            var angle = (((atan(dx / dy)) / Math.PI) * 180).toFloat()
            val distance = sqrt(dx * dx + dy * dy).toInt()

            if (dy < 0) {
                if (dx > 0) {
                    angle += 180
                } else {
                    angle -= 180
                }
            }

            angle = (angle - orientation) % 360;

            if (angle > 180) {
                angle = 180 - angle
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
        paint.style = Paint.Style.FILL
        paint.strokeWidth = obstacleWidth

        for (obstacle in obstacles) {
            val obstacleRelativePosition = absoluteToRelativePosition(obstacle)
            canvas.drawPoint(
                obstacleRelativePosition.x.toFloat(),
                obstacleRelativePosition.y.toFloat(),
                paint)
        }

        // Draw the vehicle

        val x = (width - vehicleWidth) / 2
        val y = (height) / 2
        val vehicleRect = Rect(x, y, x + vehicleWidth, y + vehicleHeight)

        // Draw the front of the vehicle
        val frontRect = Rect(x, y - frontHeight, x + vehicleWidth, y)

        canvas.save()
        canvas.rotate(
            orientation,
            width / 2f,
            height / 2f)
        paint.color = vehicleColor
        paint.style = Paint.Style.FILL
        canvas.drawRect(vehicleRect, paint)
        paint.color = Color.BLUE
        paint.style = Paint.Style.FILL
        canvas.drawRect(frontRect, paint)
        canvas.restore()
    }

    private fun absoluteToRelativePosition(point: PointF): Point {
        return Point(
            width / 2 - position.x + point.x,
            height / 2 + position.y - point.y
        )
    }

    fun setVehicle(vehicleInfo: String) {
        val data = vehicleInfo.split('|')
        this.position.x = data[0].toFloat()
        this.position.y = data[1].toFloat()
        this.orientation = data[2].toFloat()
        invalidate()
    }

    fun changeVehicleColor(color: Int) {
        vehicleColor = color
        invalidate()
    }

    fun reset() {
        position.x = 0f
        position.y = 0f
        orientation = 0f
        obstacles.clear()
        invalidate()
    }

    @OptIn(ExperimentalStdlibApi::class)
    fun addObstacles(rowObstacles: ByteArray) {
        this.obstacles.clear()
        val obstaclesCount = rowObstacles.size / 4

        for (i in 0..<obstaclesCount) {
            this.obstacles.add(
                PointF(
                    BigInteger(rowObstacles.slice(i*4..i*4+1).toByteArray()).toInt(),
                    BigInteger(rowObstacles.slice(i*4+2..i*4+3).toByteArray()).toInt()
                )
            )
        }

        /* this.obstacles.addAll(rowObstacles.split('|').map {
            val position = it.split('/')
            Point(position[0].toInt(), position[1].toInt())
        }) */
        invalidate()
    }
}

class Point(var x: Float, var y: Float)
class PointF(var x: Int, var y: Int)