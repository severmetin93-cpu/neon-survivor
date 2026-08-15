package com.tumes.neonsurvivor;  
  
import android.os.Build;  
import android.os.Bundle;  
import android.view.View;  
import android.view.WindowInsets;  
import android.view.WindowInsetsController;  
  
import com.getcapacitor.BridgeActivity;  
  
/**  
 * NEON SURVIVOR  
 *  
 * Tam ekran (immersive) mod. Tema uzerindeki android:windowFullscreen  
 * Android 15 / targetSdk 35 ile yok sayildigi icin sistem cubuklarini  
 * burada gizliyoruz. Kullanici kenardan kaydirinca cubuklar gecici  
 * olarak geri gelir (BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE).  
 */  
public class MainActivity extends BridgeActivity {  
  
    @Override  
    public void onCreate(Bundle savedInstanceState) {  
        super.onCreate(savedInstanceState);  
        applyImmersiveMode();  
    }  
  
    @Override  
    public void onWindowFocusChanged(boolean hasFocus) {  
        super.onWindowFocusChanged(hasFocus);  
        if (hasFocus) {  
            applyImmersiveMode();  
        }  
    }  
  
    @SuppressWarnings("deprecation")  
    private void applyImmersiveMode() {  
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {  
            getWindow().setDecorFitsSystemWindows(false);  
            WindowInsetsController controller = getWindow().getInsetsController();  
            if (controller != null) {  
                controller.hide(WindowInsets.Type.systemBars());  
                controller.setSystemBarsBehavior(  
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);  
            }  
        } else {  
            getWindow().getDecorView().setSystemUiVisibility(  
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE  
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION  
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN  
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION  
                            | View.SYSTEM_UI_FLAG_FULLSCREEN  
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);  
        }  
    }  
}  
