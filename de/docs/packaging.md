---
title: "Paketierung"
description: "Erstellen Sie installierbare Rust- und TSX-Apps mit nsh package für iOS-Geräte, den iOS-Simulator, Android, macOS, Windows, Linux und das Web, inklusive App-Metadaten, Symbolen und Signierung."
order: 19
group: platforms
source_hash: 74c2991490481926
---


# Paketierung

`nsh package` macht aus einer App etwas Installierbares: ein `.app` für den iOS-Simulator, ein signiertes `.ipa` für iOS-Geräte, ein signiertes `.apk` für Android, ein ad hoc signiertes `.app` für macOS, ein Verzeichnis und `.tar.gz` für Linux, ein Verzeichnis und `.zip` für Windows oder eine statische Website für das Web. Es braucht weder ein Xcode-Projekt noch Gradle.

- **Eine Rust-App** (`nsh.json` nennt ihr `"root"`) wird aus ihrem Verzeichnis paketiert. `nsh` baut den Runner des Targets im Release-Modus, mit eingebundenem Crate und gemountetem Root, ohne QuickJS: Cargo, das Rust-Target der Plattform (`rustup target add …`) und für Android das NDK.
- **Eine TSX-App** nennt ihren Entry. Ihr Release-Build (minifiziert, zu QuickJS-Bytecode kompiliert, genau so, wie `nsh build --release` ihn baut) kommt neben die **vorgebaute Runtime**, die mit NSH ausgeliefert wird, sodass keine Rust-Toolchain nötig ist. Eine App mit einem eigenen Crate (`"rust"` ohne `"root"`) erhält Runner, die mit ihrem Crate gebaut werden.

```sh
# A Rust app, from its directory
nsh package --target ios-simulator --run     # build, install and launch in the simulator
nsh package --target android --run           # build, install and launch on a device or emulator
nsh package --target macos --run             # build and launch on this Mac
nsh package --target linux --run             # build and launch on this machine
nsh package --target windows --run           # build and launch on this machine
nsh package --target web --run               # build, serve on this machine and open in the browser
nsh package --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile Dev.mobileprovision

# A TSX app: the same with its entry
nsh package App.tsx --target ios-simulator --run
```

Die Ausgabe landet in `.nsh/out/`, sofern du nicht `--out` angibst. Die folgenden Abschnitte nennen den Befehl jedes Targets für eine Rust-App; eine TSX-App fügt ihren Entry hinzu (`nsh package App.tsx --target …`).

> [!NOTE]
> Wenn du NSH stattdessen *in* eine bestehende native App einbetten möchtest, siehe [Platforms](./platforms.md#embed-in-a-native-app), und für eine GPUI- oder GPUI-Kit-App [GPUI](./gpui.md#embedding-in-a-gpui-app). Informationen dazu, wie du Updates auslieferst, die Apps herunterladen und verifizieren, findest du unter [Signed packages](./signed-packages.md).

<a id="app-metadata-30"></a>

## App-Metadaten: `nsh.json`

`nsh package` liest `nsh.json` im Verzeichnis der App (bei einer TSX-App neben der Entry-Datei). `nsh init` schreibt eine solche Datei:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| Schlüssel | Typ | Standard | Verwendet für |
|---|---|---|---|
| `name` | String | der Verzeichnisname des Entrys | Der Anzeigename unter dem Icon (`CFBundleDisplayName`, Android `android:label`) und der Name der Ausgabedatei. |
| `id` | String | erforderlich | Der Bundle-Identifier bzw. Android-Paketname in Reverse-DNS-Form unter einer Domain, die dir gehört. Er bestimmt auch, wo die App ihren [Speicher](../modules/nsh.md#storage) ablegt, sodass jede App ihren eigenen hat. `nsh package` und `nsh publish` warnen vor dem Platzhalter `com.example.`. |
| `version` | String | `"1.0.0"` | Die für Nutzer sichtbare Version (`CFBundleShortVersionString`, `versionName`). |
| `build` | Zahl | `1` | Die Build-Nummer (`CFBundleVersion`, `versionCode`). Erhöhe sie bei jedem Release, das du hochlädst. |
| `icon` | String | keiner | Ein quadratisches PNG, idealerweise 1024×1024, relativ zu `nsh.json`. |

`nsh.json` enthält außerdem `rust` und `root` (die Crates der App und ihre Root-Komponente, [Building with Rust](./rust.md)), `theme` und `appearance`, `tailwind` (siehe [Tailwind](./tailwind.md)) sowie `capabilities` (siehe [Sandbox and capabilities](./sandbox-and-capabilities.md)); [Project structure](./project-structure.md#nshjson) listet alle Schlüssel auf. Unbekannte Schlüssel sind ein Fehler.

Jeder der oben genannten Schlüssel lässt sich auf der Kommandozeile überschreiben, was in CI praktisch ist:

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## Optionen

| Flag | Beschreibung |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | Wofür gebaut werden soll (erforderlich). |
| `-o, --out <dir>` | Ausgabeverzeichnis. Standard ist `.nsh/out`. |
| `--name <name>` | Anzeigename. |
| `--id <id>` | Bundle-Identifier, zum Beispiel `com.example.app`. |
| `--app-version <version>` | Version, zum Beispiel `1.2.0`. |
| `--build <n>` | Build-Nummer. |
| `--icon <png>` | App-Icon: ein quadratisches PNG, idealerweise 1024×1024. |
| `--sign <identity>` | iOS: die Code-Signing-Identität für Geräte. |
| `--profile <file>` | iOS: das Provisioning-Profil für Geräte (`.mobileprovision`). |
| `--keystore <file>` | Android: ein Release-Keystore (Standard: der Debug-Schlüssel). |
| `--key-alias <alias>` | Android: der Key-Alias im Keystore. |
| `--keystore-password <password>` | Android: das Keystore-Passwort; wird auch aus `NSH_KEYSTORE_PASSWORD` gelesen. |
| `--abi <abi>` | Android: die ABIs des APK, wiederholt angegeben oder durch Kommas getrennt (Standard: `arm64-v8a` und `armeabi-v7a`). |
| `--run` | Anschließend installieren und starten: im iOS-Simulator oder auf dem Android-Gerät bzw. -Emulator, das `adb` sieht; macOS-, Linux- und Windows-Apps werden auf diesem Rechner gestartet; eine Website wird auf diesem Rechner ausgeliefert und im Browser geöffnet. Nicht für `--target ios`. |

## iOS-Simulator

```sh
nsh package --target ios-simulator --run
```

Schreibt `.nsh/out/<Name>.app`, ad hoc signiert (der Simulator braucht eine Signatur, aber keine Identität). Mit `--run` startet es einen Simulator, falls keiner läuft, installiert die App und startet sie. Erfordert Xcode.

<a id="ios-devices"></a>

## iOS-Geräte

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

Schreibt `.nsh/out/<Name>.ipa`, bereit für TestFlight, App-Store-Upload-Tools oder die direkte Installation (je nach Profil). Dabei passiert Folgendes:

- Das Provisioning-Profil wird als `embedded.mobileprovision` in die App kopiert.
- Die Entitlements stammen aus dem Profil. NSH prüft, ob die Application-Identifier des Profils die `id` der App abdeckt (Wildcard-Profile wie `TEAMID.*` oder `TEAMID.com.example.*` funktionieren) und bricht andernfalls mit einem Fehler ab.
- Die App wird mit `codesign` unter Verwendung der Identität signiert und anschließend zu einer `.ipa` gezippt (`Payload/<Name>.app`).

Deine Identitäten findest du so:

```sh
security find-identity -v -p codesigning
```

Ohne `--sign` und `--profile` schreibt NSH eine unsignierte `.nsh/out/<Name>.app` und weist darauf hin; sie lässt sich so nicht auf einem Gerät installieren.

Die App unterstützt iPhone und iPad, Hoch- und Querformat (Hochformat kopfüber nur auf dem iPad) und benötigt iOS 15.0 oder neuer.

## Android

```sh
nsh package --target android --run
```

Schreibt `.nsh/out/<Name>.apk`. Das APK wird direkt mit den Build-Tools des SDK (`aapt2`, `zipalign`, `apksigner`) zusammengesetzt, ohne Gradle. Voraussetzungen:

- Das Android SDK, gefunden über `ANDROID_HOME` (oder `ANDROID_SDK_ROOT` oder `~/Library/Android/sdk`), mit Build-Tools und dem Paket `platforms;android-35`. NSH nennt dir den passenden `sdkmanager`-Befehl, wenn eines fehlt.
- Ein JDK, um beim ersten Mal den Debug-Keystore zu erstellen.
- Für eine Rust-App das Android NDK (`sdkmanager "ndk;<version>"` oder `ANDROID_NDK_HOME`), das ihre `libnsh.so` baut.

Die App zielt auf API 35 und benötigt API 28 (Android 9) oder neuer. Sie enthält nativen Code für die ABIs von Smartphones, `arm64-v8a` und `armeabi-v7a`; mit `--run` auch für die des Geräts, etwa `x86_64` eines Emulators. Mit `--abi` wählst du sie selbst aus, zum Beispiel `--abi arm64-v8a` nur für 64-Bit-Smartphones, das kleinste APK:

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### Signieren für das Release

Ohne `--keystore` wird das APK mit dem Standard-Debug-Schlüssel (`~/.android/debug.keystore`, wird bei Bedarf erstellt) signiert, und NSH warnt, dass es nicht für Store-Releases gedacht ist. Für ein Release erstellst du einmalig einen Keystore und übergibst ihn:

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

Bevorzuge die Umgebungsvariable gegenüber `--keystore-password`, damit das Passwort nicht in deiner Shell-History landet.

## macOS

```sh
nsh package --target macos --run
```

Schreibt `.nsh/out/<Name>.app`: die ausführbare Datei in `Contents/MacOS/` sowie `nsh/assets/…`, `nsh/app.json` (der Fenstertitel und das Erscheinungsbild der App) und das `nsh/bundle.nshc` einer TSX-App in `Contents/Resources/`. Die App ist ad hoc signiert und benötigt macOS 14 oder neuer; zur Verteilung signierst du sie mit einer Developer ID und notarisierst sie. Siehe [macOS](./macos.md#packaging).

## Linux

```sh
nsh package --target linux --run
```

Schreibt `.nsh/out/<Name>/` (die ausführbare Datei `<Name>`, `nsh/assets/…`, `nsh/app.json` mit Fenstertitel und Application-ID, das `nsh/bundle.nshc` einer TSX-App, `<id>.desktop` und das Icon `<id>.png`) und dasselbe wie `.nsh/out/<Name>.tar.gz`. Paketiere unter Linux: Der Runner wird für den Rechner gebaut, auf dem er gebaut wird. GTK 4 (4.14 oder neuer), Pango und WebKitGTK 6.0 (für Web-Views) müssen dort installiert sein, wo die App läuft. Zur Installation und zum Desktop-Eintrag: [Linux](./linux.md#packaging).

## Windows

```sh
nsh package --target windows --run
```

Schreibt `.nsh\out\<Name>\` (die ausführbare Datei `<Name>.exe` mit dem Icon der App, `nsh\assets\…`, `nsh\app.json` mit Fenstertitel, App-ID, Version und Erscheinungsbild sowie das `nsh\bundle.nshc` einer TSX-App) und dasselbe wie `.nsh\out\<Name>.zip`. Eine TSX-App braucht keine Tools; der Runner einer Rust-App wird mit den Visual Studio Build Tools gebaut. Paketiere unter Windows: Der Runner wird für den Rechner gebaut, auf dem er gebaut wird, und nur Windows kann das Icon einbetten. Die App läuft von dort, wohin ihr Verzeichnis kopiert wird; es wird nichts installiert. Siehe [Windows](./windows.md#packaging).

## Web

```sh
nsh package --target web --run
```

Schreibt `.nsh/out/<Name>/`, eine statische Website: `index.html`, `manifest.webmanifest`, das Seitenskript (`nsh.<digest>.js`) und `nsh.<digest>.wasm` (die Engine und das Crate einer Rust-App; bei einer TSX-App die Runtime, neben dem ES-Modul `app.<digest>.js` der App), ihre Assets und Icons, jeweils nach ihrem Inhalt benannt, damit Hosts sie dauerhaft cachen können. Stelle das Verzeichnis auf einem beliebigen Webserver oder CDN bereit; `--run` liefert es unter `http://127.0.0.1:4173/` zum Öffnen aus. Cache-Header und Einbettung: [Web](./web.md#publish-an-app).

## Icons

Gib ein quadratisches PNG an, idealerweise 1024×1024, in `nsh.json` (`"icon": "icon.png"`) oder mit `--icon`:

- **iOS:** Von Xcodes `actool` in den Asset-Katalog der App (`Assets.car`) kompiliert, der jede von iOS benötigte Größe ableitet.
- **Android:** Auf 192×192 skaliert und als Launcher-Icon verwendet (`mipmap-xxxhdpi`).
- **macOS:** Von `sips` in `AppIcon.icns` umgewandelt.
- **Linux:** Als `<id>.png` kopiert, das die Datei `.desktop` als ihr `Icon` nennt.
- **Windows:** Auf 16 bis 64 Pixel und 256 Pixel skaliert und als Icon in die ausführbare Datei eingebettet, das das Fenster, der Explorer und die Taskleiste anzeigen.
- **Web:** Auf 32 Pixel (das Favicon), 180 (`apple-touch-icon`), 192 und 512 (das Web-App-Manifest) skaliert.

Ohne Icon zeigt das System sein Standard-Icon.

<a id="what-is-inside"></a>

## Was enthalten ist

Das Paket einer Rust-App besteht aus ihrem Runner, gebaut mit deinem Crate und gemountetem Root, und den Assets, die ihre Crates registrieren (`assets!()`). Das Paket einer TSX-App enthält ihren Bytecode, ihre `capabilities.json` (wenn sie Capabilities deklariert) und die Assets, die sie importiert, neben der vorgebauten Runtime:

| Target | Runtime | Eine TSX-App |
|---|---|---|
| iOS | die ausführbare Datei `nsh-ios-app` | `<Name>.app/nsh/bundle.nshc`, `nsh/assets/…` |
| Android | `classes.dex`, `lib/<abi>/libnsh.so` (ohne Symbole, unkomprimiert gespeichert, 16 KB ausgerichtet) | `assets/nsh/bundle.nshc`, `assets/nsh/assets/…` |
| macOS | die ausführbare Datei `nsh-macos-app`, umbenannt in `<Name>` | `<Name>.app/Contents/Resources/nsh/bundle.nshc`, `nsh/assets/…` |
| Linux | die ausführbare Datei `nsh-linux-app`, umbenannt in `<Name>` | `<Name>/nsh/bundle.nshc`, `nsh/assets/…` |
| Windows | die ausführbare Datei `nsh-windows-app.exe`, umbenannt in `<Name>.exe` | `<Name>\nsh\bundle.nshc`, `nsh\assets\…` |
| Web | `nsh.<digest>.wasm`, `nsh.<digest>.js` | `<Name>/app.<digest>.js`, `assets/…`, `index.html` |

Eine paketierte App registriert keine [nativen Komponenten](./native-components.md); binde dafür NSH in deine eigene App ein.

<a id="finding-the-runtime"></a>

## Die Runtime finden

Eine Rust-App baut ihre eigenen Runner. Für TSX-Apps sucht `nsh package` die vorgebaute Runtime neben dem CLI (`bin/../runtime` in der Distribution). In einem Checkout von NSH verwendet es `target/<triple>/<profile>` und `target/android/<profile>`, mit dem eigenen Profil des CLI (ein Debug-CLI verwendet Debug-Runtimes): Baue sie mit `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim` (oder `aarch64-apple-ios` für Geräte) und `cargo xtask android` (füge `--release` für ein Release-CLI hinzu); `nsh-macos-app` (unter macOS), `nsh-linux-app` (unter Linux) und `nsh-windows-app` (unter Windows) werden für diesen Rechner in `target/<profile>` gebaut (`cargo build -p nsh-macos-app`, `cargo build -p nsh-linux-app`, `cargo build -p nsh-windows-app`); die Web-Runtime wird unabhängig vom Profil des CLI mit dem Profil `web` nach `target/wasm32-unknown-unknown/web/` gebaut. Die Umgebungsvariable `NSH_RUNTIME` verweist das CLI auf ein anderes Verzeichnis, das wie das `runtime/` der Distribution aufgebaut ist (`ios/iphoneos`, `ios/iphonesimulator`, `android/release`, `macos`, `linux`, `windows`, `gpui`, `web`, ...).

<a id="see-also"></a>

## Siehe auch

- [CLI](./cli.md): alle Befehle
- [Signed packages](./signed-packages.md): Updates, die Apps herunterladen
- [Project structure](./project-structure.md): `nsh.json` und die Dateien einer App
