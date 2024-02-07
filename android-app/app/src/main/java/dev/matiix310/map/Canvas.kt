package dev.matiix310.map

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.util.Log
import android.view.View
import android.view.WindowManager
import kotlin.math.cos
import kotlin.math.sin

class Canvas(context: Context, private var windowManager: WindowManager): View(context) {

    private val paint = Paint()
    private val vehicleWidth = 100
    private val vehicleHeight = 150
    private val obstacleWidth = 20f

    private val obstacles = ArrayList<Point>()
    private var orientation = 0f
    private val position: Point = Point(200, -100)
    private var vehicleColor = Color.RED;

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        Log.d("coucou", "Draw is called!")

        // Draw the obstacles
        paint.color = Color.RED
        paint.strokeWidth = obstacleWidth

        for (obstacle in obstacles) {
            canvas.drawPoint(
                windowManager.defaultDisplay.width / 2 - position.x + obstacle.x.toFloat(),
                windowManager.defaultDisplay.height / 2 + position.y - obstacle.y.toFloat(),
                paint)
        }

        // Draw the vehicle
        paint.color = vehicleColor
        val x = (windowManager.defaultDisplay.width - vehicleWidth) / 2
        val y = (windowManager.defaultDisplay.height - vehicleHeight) / 2
        val rect = Rect(x, y, x + vehicleWidth, y + vehicleHeight)

        canvas.save()
        canvas.rotate(orientation, windowManager.defaultDisplay.width / 2f, windowManager.defaultDisplay.height / 2f)
        canvas.drawRect(rect, paint)
        canvas.restore()
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
}

class Point(var x: Int, var y: Int)