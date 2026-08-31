/**  
 * scripts/configure-android.mjs  
 *  
 * "npx cap sync android" sonrasi calisir. Native Android projesini  
 * NEON SURVIVOR icin yapilandirir ve TUM launcher ikonlarini  
 * www/assets/icons/icon.svg dosyasindan uretir.  
 *  
 * Repoda hicbir PNG tutulmaz — hepsi build sirasinda olusur.  
 *  
 * Yaptiklari:  
 *   1. Portrait orientation kilidi  
 *   2. VIBRATE izni (<application> ONCESINE, konvansiyona uygun)  
 *   3. Uygulama adi: NEON SURVIVOR  
 *   4. Tam ekran: tema + MainActivity immersive mode (Android 15 uyumlu)  
 *   5. SVG -> mipmap PNG (legacy / round / adaptive foreground)  
 *   6. Adaptive icon (cakismayan kendi renk kaynagimizla)  
 *   7. Release imzalama: KEYSTORE_* ortam degiskenleri varsa build.gradle'a  
 *      signingConfigs.release yazar (release CI'da)  
 *   8. Sonda DOGRULAMA: bir sey tutmadiysa build'i durdurur  
 *  
 * Idempotent: ayni duzenlemeyi iki kez uygulamaz.  
 */  
import fs from "node:fs";  
import path from "node:path";  
import sharp from "sharp";  
  
const ANDROID  = "android";  
const APP      = `${ANDROID}/app/src/main`;  
const RES      = `${APP}/res`;  
const MANIFEST = `${APP}/AndroidManifest.xml`;  
const SVG_SRC  = "www/assets/icons/icon.svg";  
const CAP_CFG  = "capacitor.config.json";  
  
const changes = [];  
const log = m => changes.push(m);  
const fail = m => { console.error(`\n!!! YAPILANDIRMA HATASI: ${m}\n`); process.exit(1); };  
  
function edit(file, fn) {  
  if (!fs.existsSync(file)) fail(`beklenen dosya yok: ${file}`);  
  const before = fs.readFileSync(file, "utf8");  
  const after  = fn(before);  
  if (after !== before) fs.writeFileSync(file, after);  
}  
  
/* =====================================================================  
   1 + 2 — AndroidManifest  
   ===================================================================== */  
edit(MANIFEST, src => {  
  // Portrait kilidi — dogru activity (.MainActivity) uzerine  
  if (!src.includes("android:screenOrientation")) {  
    const before = src;  
    src = src.replace(  
      /(<activity\b[^>]*?android:name="\.MainActivity")/,  
      `$1\n            android:screenOrientation="portrait"\n            android:resizeableActivity="false"`  
    );  
    if (src === before) fail('AndroidManifest icinde <activity android:name=".MainActivity"> bulunamadi.');  
    log("portrait");  
  }  
  
  // Izinler <manifest> altinda, <application> ONCESINDE olmali (Android konvansiyonu).  
  if (!src.includes("android.permission.VIBRATE")) {  
    const before = src;  
    src = src.replace(  
      /(\n\s*)(<application\b)/,  
      `$1<uses-permission android:name="android.permission.VIBRATE" />\n$1$2`  
    );  
    if (src === before) fail("AndroidManifest icinde <application> bulunamadi.");  
    log("VIBRATE izni");  
  }  
  return src;  
});  
  
/* =====================================================================
   2b — AdMob APPLICATION_ID meta-data
   cap sync bu meta-data'yi otomatik enjekte etmiyor.
   Google Mobile Ads SDK bu tag olmadan aninda crash yapiyor.
   App ID capacitor.config.json -> plugins.AdMob.appIdAndroid'dan okunur.
   Idempotent: zaten varsa dokunmaz.
   ===================================================================== */
edit(MANIFEST, src => {
  if (src.includes("com.google.android.gms.ads.APPLICATION_ID")) return src;
  const cfg = JSON.parse(fs.readFileSync(CAP_CFG, "utf8"));
  const admobId = cfg?.plugins?.AdMob?.appIdAndroid;
  if (!admobId) { log("AdMob appIdAndroid tanimli degil, APPLICATION_ID atlaniyor"); return src; }
  const before = src;
  src = src.replace(
    /(<application\b[^>]*>)/,
    `$1\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${admobId}"/>`
  );
  if (src === before) fail("AndroidManifest icinde <application> etiketi bulunamadi (APPLICATION_ID icin).");
  log("AdMob APPLICATION_ID eklendi");
  return src;
});

/* =====================================================================
   3 — Uygulama adi
   ===================================================================== */
edit(`${RES}/values/strings.xml`, src => {  
  const set = (s, key, val) =>  
    s.replace(new RegExp(`(<string name="${key}">)[^<]*(</string>)`), `$1${val}$2`);  
  src = set(src, "app_name", "NEON SURVIVOR");  
  src = set(src, "title_activity_main", "NEON SURVIVOR");  
  log("uygulama adi");  
  return src;  
});  
  
/* =====================================================================  
   4a — Tema  
   Capacitor once AppTheme.NoActionBarLaunch, sonra AppTheme.NoActionBar  
   uygular; ikisine birden yaziyoruz.  
   windowLayoutInDisplayCutoutMode API 27+ oldugu icin tools:targetApi ile  
   isaretleniyor (minSdk 23'te lint NewApi uyarisi cikmasin diye).  
   ===================================================================== */  
edit(`${RES}/values/styles.xml`, src => {  
  if (src.includes("neon-survivor-fullscreen")) return src;  
  
  if (!src.includes("xmlns:tools")) {  
    src = src.replace(/<resources(\s|>)/, `<resources xmlns:tools="http://schemas.android.com/tools"$1`);  
  }  
  
  const items = `  
        <!-- neon-survivor-fullscreen -->  
        <item name="android:windowFullscreen">true</item>  
        <item name="android:windowContentOverlay">@null</item>  
        <item name="android:windowBackground">@color/neonBackground</item>  
        <item name="android:windowLayoutInDisplayCutoutMode" tools:targetApi="o_mr1">shortEdges</item>`;  
  
  const a = src;  
  src = src.replace(/(<style name="AppTheme\.NoActionBar"[^>]*>)/, `$1${items}`);  
  if (src === a) fail('styles.xml icinde <style name="AppTheme.NoActionBar"> bulunamadi.');  
  
  src = src.replace(/(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)/,  
    `$1  
        <item name="android:windowFullscreen">true</item>  
        <item name="android:windowLayoutInDisplayCutoutMode" tools:targetApi="o_mr1">shortEdges</item>`);  
  
  log("tam ekran tema");  
  return src;  
});  
  
/* Kendi renk kaynagimiz — Capacitor sablonundaki isimlerle cakismaz. */  
fs.mkdirSync(`${RES}/values`, { recursive: true });  
fs.writeFileSync(`${RES}/values/neon_colors.xml`,  
`<?xml version="1.0" encoding="utf-8"?>  
<resources>  
    <color name="neonBackground">#04060F</color>  
    <color name="neonLauncherBackground">#04060F</color>  
</resources>  
`);  
log("renkler");  
  
/* =====================================================================  
   4b — MainActivity: gercek immersive mode  
   android:windowFullscreen Android 15 (targetSdk 35) tarafindan YOK SAYILIR.  
   Bu yuzden tam ekrani WindowInsetsController ile kod tarafinda uyguluyoruz.  
   ===================================================================== */  
function patchMainActivity() {  
  const cfg = JSON.parse(fs.readFileSync(CAP_CFG, "utf8"));  
  const pkg = cfg.appId;  
  if (!pkg) fail("capacitor.config.json icinde appId yok.");  
  
  const dir  = path.join(APP, "java", ...pkg.split("."));  
  const file = path.join(dir, "MainActivity.java");  
  if (!fs.existsSync(file)) fail(`MainActivity bulunamadi: ${file}`);  
  
  fs.writeFileSync(file, `package ${pkg};  
  
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
`);  
  log("MainActivity immersive mode");  
  return file;  
}  
const MAIN_ACTIVITY = patchMainActivity();  
  
/* =====================================================================  
   5 + 6 — Ikon uretimi (SVG -> PNG)  
   ===================================================================== */  
const DENSITIES     = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };  
const LEGACY_DP     = 48;   // ic_launcher / ic_launcher_round  
const FOREGROUND_DP = 108;  // adaptive icon foreground  
const SAFE_SCALE    = 0.61; // 108dp icinde 66dp guvenli alan  
  
/**
 * SVG'den <defs> ve "mark" (arka plan disindaki cizim) bloklarini ayikla.
 *
 * www/assets/icons/icon.svg bir <g id="mark"> sarmalayicisi KULLANMIYOR --
 * duz bir yapi: <defs> sonra dogrudan <rect> (tam kanvas arka plani) ve
 * ardindan helmet/HUD/text gibi bir dizi kardes eleman. Bu yuzden id'ye
 * gore degil, YAPIYA gore ayikliyoruz:
 *   1) <defs> blogunu al (gradient/filter tanimlari foreground'da da lazim).
 *   2) <svg> govdesinden <defs>'i cikar.
 *   3) Geriye kalanda tam kanvasi kaplayan (viewBox boyutuyla ayni
 *      width/height'a sahip) arka plan <rect>'ini bul ve cikar --
 *      foreground'da arka plan OLMAMALI.
 *   4) Kalan her sey "mark" (asil cizim) olarak foreground'a tasinir.
 * Varsayim tutmazsa (rect bulunamazsa, govde bossa) build burada durur.
 */
function extractParts(svgRaw) {
  // XML yorumlari icinde etiket gecebilir; once temizle.
  const svg = svgRaw.replace(/<!--[\s\S]*?-->/g, "");

  const defsMatch = svg.match(/<defs>[\s\S]*?<\/defs>/);
  const defs = defsMatch ? defsMatch[0] : "";

  const openTag = svg.match(/<svg\b[^>]*>/);
  if (!openTag) fail("icon.svg gecerli bir <svg ...> etiketiyle baslamiyor.");
  const closeIdx = svg.lastIndexOf("</svg>");
  if (closeIdx === -1) fail("icon.svg icinde kapanan </svg> etiketi bulunamadi.");

  let body = svg.slice(openTag.index + openTag[0].length, closeIdx);
  if (defs) body = body.replace(defs, "");
  body = body.trim();
  if (!body) fail("icon.svg icinde <defs> disinda hicbir icerik yok.");

  // viewBox'tan kanvas boyutunu al (orn. "0 0 1024 1024" -> 1024).
  const viewBoxMatch = openTag[0].match(/viewBox="[^"]*?\s(\d+)\s+(\d+)"/);
  const canvasW = viewBoxMatch ? viewBoxMatch[1] : "1024";
  const canvasH = viewBoxMatch ? viewBoxMatch[2] : "1024";

  const bgPattern = new RegExp(
    `<rect\\b(?=[^>]*\\bwidth="${canvasW}")(?=[^>]*\\bheight="${canvasH}")[^>]*/>`
  );
  const bgMatch = body.match(bgPattern);
  if (!bgMatch) fail(`icon.svg icinde tam kanvasi kaplayan arka plan <rect> bulunamadi (beklenen boyut: ${canvasW}x${canvasH}). Varsayim tutmadi, script guncellenmeli.`);

  const mark = body.replace(bgMatch[0], "").trim();
  if (!mark) fail("icon.svg icinde arka plan disinda cizim (mark) bulunamadi.");

  return { defs, mark };
}  
  
/** Arka plansiz, guvenli alana olceklenmis adaptive foreground SVG'si. */  
function buildForegroundSvg(svg) {  
  const { defs, mark } = extractParts(svg);  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">  
${defs}  
<g transform="translate(512,512) scale(${SAFE_SCALE}) translate(-512,-512)">  
${mark}  
</g>  
</svg>`;  
}  
  
/** Dairesel maske (ic_launcher_round icin). */  
function circleMask(size) {  
  return Buffer.from(  
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +  
    `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`  
  );  
}  
  
async function generateIcons() {  
  if (!fs.existsSync(SVG_SRC)) fail(`Kaynak ikon yok: ${SVG_SRC}`);  
  
  const svg   = fs.readFileSync(SVG_SRC, "utf8");  
  const full  = Buffer.from(svg);  
  const fgSvg = Buffer.from(buildForegroundSvg(svg));  
  let written = 0;  
  
  for (const [density, mul] of Object.entries(DENSITIES)) {  
    const dir = path.join(RES, `mipmap-${density}`);  
    fs.mkdirSync(dir, { recursive: true });  
  
    const legacy = Math.round(LEGACY_DP * mul);  
    const fore   = Math.round(FOREGROUND_DP * mul);  
  
    // ic_launcher.png — kare  
    await sharp(full, { density: 512 })  
      .resize(legacy, legacy)  
      .png()  
      .toFile(path.join(dir, "ic_launcher.png"));  
  
    // ic_launcher_round.png — dairesel maske  
    await sharp(full, { density: 512 })  
      .resize(legacy, legacy)  
      .composite([{ input: circleMask(legacy), blend: "dest-in" }])  
      .png()  
      .toFile(path.join(dir, "ic_launcher_round.png"));  
  
    // ic_launcher_foreground.png — seffaf, adaptive  
    await sharp(fgSvg, { density: 512 })  
      .resize(fore, fore)  
      .png()  
      .toFile(path.join(dir, "ic_launcher_foreground.png"));  
  
    written += 3;  
  }  
  
  // Capacitor sablonu ayni isimde .webp birakir; PNG ile cakismasin.  
  for (const dir of fs.readdirSync(RES)) {  
    if (!dir.startsWith("mipmap-") || dir.includes("anydpi")) continue;  
    const d = path.join(RES, dir);  
    for (const f of fs.readdirSync(d)) {  
      if (f.endsWith(".webp") && f.startsWith("ic_launcher")) fs.unlinkSync(path.join(d, f));  
    }  
  }  
  
  // Adaptive icon tanimlari — kendi renk kaynagimiza isaret ediyor.  
  const anydpi = path.join(RES, "mipmap-anydpi-v26");  
  fs.mkdirSync(anydpi, { recursive: true });  
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>  
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">  
    <background android:drawable="@color/neonLauncherBackground"/>  
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>  
</adaptive-icon>  
`;  
  fs.writeFileSync(path.join(anydpi, "ic_launcher.xml"), adaptive);  
  fs.writeFileSync(path.join(anydpi, "ic_launcher_round.xml"), adaptive);  
  
  log(`${written} ikon uretildi (SVG -> PNG)`);  
}  
  
await generateIcons();  

/* =====================================================================  
   7 — RELEASE IMZALAMA (signing)  
   KEYSTORE_PATH / KEYSTORE_PASSWORD / KEY_ALIAS ortam degiskenleri  
   TANIMLIYSA (release workflow'unda oldugu gibi) android/app/build.gradle  
   icine bir signingConfigs.release blogu ekler ve release buildType'ini  
   ona baglar. Bu degiskenler olmadan (lokal/debug calistirma) hicbir sey  
   degistirmez -- Android'in varsayilan debug imzalama davranisi korunur.  
   Idempotent: signingConfigs.release zaten varsa tekrar eklenmez.  
   ===================================================================== */  
function patchReleaseSigning() {  
  const hasSigningEnv = process.env.KEYSTORE_PATH && process.env.KEYSTORE_PASSWORD && process.env.KEY_ALIAS;  
  if (!hasSigningEnv) {  
    log("release imzalama atlandi (KEYSTORE_PATH/KEYSTORE_PASSWORD/KEY_ALIAS tanimli degil)");  
    return;  
  }  
  
  const gradleFile = `${ANDROID}/app/build.gradle`;  
  if (!fs.existsSync(gradleFile)) fail(`beklenen dosya yok: ${gradleFile}`);  
  let src = fs.readFileSync(gradleFile, "utf8");  
  
  if (src.includes("signingConfigs.release")) {  
    log("release imzalama zaten yapilandirilmis (idempotent, degisiklik yok)");  
    return;  
  }  
  
  const signingConfigsBlock = `  
    signingConfigs {  
        release {  
            storeFile file(System.getenv("KEYSTORE_PATH"))  
            storePassword System.getenv("KEYSTORE_PASSWORD")  
            keyAlias System.getenv("KEY_ALIAS")  
            keyPassword System.getenv("KEYSTORE_PASSWORD")  
        }  
    }  
`;  
  
  const androidBlockMatch = src.match(/android\s*\{/);  
  if (!androidBlockMatch) fail(`${gradleFile} icinde "android {" blogu bulunamadi.`);  
  const insertAt = androidBlockMatch.index + androidBlockMatch[0].length;  
  src = src.slice(0, insertAt) + signingConfigsBlock + src.slice(insertAt);  
  
  const releaseTypeMatch = src.match(/buildTypes\s*\{\s*release\s*\{/);  
  if (!releaseTypeMatch) fail(`${gradleFile} icinde "buildTypes { release {" blogu bulunamadi.`);  
  src = src.replace(releaseTypeMatch[0], `${releaseTypeMatch[0]}\n            signingConfig signingConfigs.release`);  
  
  fs.writeFileSync(gradleFile, src);  
  log("release imzalama yapilandirildi (build.gradle -> signingConfigs.release)");  
}  
patchReleaseSigning();

/* =====================================================================
   8 — DOGRULAMA  
   Regex'lerden biri tutmadiysa build'i burada durdur; yatay donen ya da  
   varsayilan Capacitor ikonuyla cikan bir APK uretmekten iyidir.  
   ===================================================================== */  
function verify() {  
  const manifest = fs.readFileSync(MANIFEST, "utf8");  
  const styles   = fs.readFileSync(`${RES}/values/styles.xml`, "utf8");  
  const strings  = fs.readFileSync(`${RES}/values/strings.xml`, "utf8");  
  const activity = fs.readFileSync(MAIN_ACTIVITY, "utf8");  
  
  const checks = [
    ["portrait kilidi",        /android:screenOrientation="portrait"/.test(manifest)],
    ["VIBRATE izni",           manifest.includes("android.permission.VIBRATE")],
    ["izin <application> oncesinde",
                               manifest.indexOf("android.permission.VIBRATE") < manifest.indexOf("<application")],
    ["AdMob APPLICATION_ID",  manifest.includes("com.google.android.gms.ads.APPLICATION_ID")],
    ["tam ekran tema",         styles.includes("neon-survivor-fullscreen")],
    ["tools namespace",        styles.includes("xmlns:tools")],
    ["uygulama adi",           strings.includes(">NEON SURVIVOR<")],
    ["immersive mode",         activity.includes("BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE")],
    ["adaptive icon xml",      fs.existsSync(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`)],
    ["launcher background",    fs.readFileSync(`${RES}/values/neon_colors.xml`, "utf8")
                                 .includes("neonLauncherBackground")]
  ];  
  
  for (const d of Object.keys(DENSITIES)) {  
    for (const f of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {  
      checks.push([`mipmap-${d}/${f}`, fs.existsSync(path.join(RES, `mipmap-${d}`, f))]);  
    }  
  }  
  
  // Release imzalama sadece KEYSTORE_* ortam degiskenleri tanimliysa  
  // (release CI workflow'u) beklenir; lokal/debug calistirmada bu  
  // degiskenler yok, o yuzden kontrol de kosullu.  
  if (process.env.KEYSTORE_PATH && process.env.KEYSTORE_PASSWORD && process.env.KEY_ALIAS) {  
    checks.push(["release signing config", fs.readFileSync(`${ANDROID}/app/build.gradle`, "utf8")  
                                              .includes("signingConfigs.release")]);  
  }  
  
  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);  
  for (const [name, ok] of checks) console.log(`  ${ok ? "OK " : "HATA"}  ${name}`);  
  if (failed.length) fail(`dogrulama basarisiz: ${failed.join(", ")}`);  
}  
  
console.log("\nDogrulama:");  
verify();  
console.log("\nAndroid yapilandirmasi tamam ->", changes.join(", "));  
