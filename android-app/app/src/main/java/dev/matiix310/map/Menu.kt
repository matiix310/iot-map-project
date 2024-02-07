package dev.matiix310.map

import android.content.Intent
import android.os.Bundle
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity


class Menu : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_menu)

        val ipInput = findViewById<EditText>(R.id.ipText)

        ipInput.setOnEditorActionListener { v, actionId, event ->
            val ip = v.text;
            val myIntent: Intent = Intent(
                this,
                MainActivity::class.java
            )
            myIntent.putExtra("ip", ip.toString().trim())
            this.startActivity(myIntent)
            true
        }
    }
}