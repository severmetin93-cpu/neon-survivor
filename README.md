# NORYVX

**Hyper-casual endless survival** — HTML5 Canvas + Capacitor (Android).

Neon enerji çekirdeğiyle hayatta kal. Koşu içi upgrade kartları, 3 kahraman, silah mastery ve kalıcı skill ilerlemesi.

## Hızlı bakış

| | |
|---|---|
| **App name** | NORYVX |
| **Package** | `com.tumes.neonsurvivor` |
| **Web root** | `www/` |
| **Stack** | HTML5 Canvas, Capacitor 7, AdMob |
| **Version** | V20.3.x (Week-1 sprint) |

## Oynanış çekirdeği

- Endless survival arenası (wave / elite / boss)
- 4 otomatik silah: PULSE · PLASMA · ARC · NOVA
- 3 hero: Vanguard · Striker · Controller
- Run-içi kart upgrade + Weapon Mastery + Skill Matrix
- TR / EN dil desteği, PWA + offline

## Repo yapısı

```
www/                 → oyun (index.html ana runtime)
www/assets/          → atlas, ikonlar, hero PNG
docs/                → mvp-scope, economy, design, sprint
scripts/             → android config, version sync
.github/workflows/   → APK build
```

## Geliştirme (Week-1 Sprint)

Detay: [`docs/sprint-week1.md`](docs/sprint-week1.md)  
Tasarım tokenları: [`docs/design-system.md`](docs/design-system.md)

```bash
npm install
npx cap sync android
npm run android:configure
```

## Notlar

- Pay-to-win yok: satışlar kozmetik / convenience odaklı.
- AdMob şu an test ID ile yapılandırılmış; production öncesi değiştirilmeli.
- Ana runtime monolitik `www/index.html` — sprint içinde kademeli sadeleştirme hedefleniyor.
