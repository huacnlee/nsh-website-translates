---
title: "Packaging"
description: "Crea app Rust e TSX installabili con nsh package per dispositivi iOS, simulatore iOS, Android, macOS, Windows, Linux e web, con metadati dell'app, icone e firma."
order: 19
group: platforms
source_hash: 74c2991490481926
---

# Packaging

`nsh package` trasforma un'app in qualcosa che puoi installare: un `.app` per il simulatore iOS, un `.ipa` firmato per i dispositivi iOS, un `.apk` firmato per Android, un `.app` con firma ad hoc per macOS, una directory e `.tar.gz` per Linux, una directory e `.zip` per Windows, oppure un sito statico per il web. Non servono né un progetto Xcode né Gradle.

- **Un'app Rust** (`nsh.json` indica il suo `"root"`) viene impacchettata dalla sua directory. `nsh` compila il runner del target in modalità release con il tuo crate incluso e la root montata, senza QuickJS. Servono Cargo, il target Rust della piattaforma (`rustup target add …`) e, per Android, l'NDK.
- **Un'app TSX** indica il proprio entry. La sua build di release (minificata, compilata in bytecode QuickJS, esattamente come la produce `nsh build --release`) viene affiancata al **runtime precompilato** fornito con NSH, quindi non richiede una toolchain Rust. Un'app con un crate proprio (`"rust"` senza `"root"`) ottiene runner compilati con il proprio crate.

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

L'output va in `.nsh/out/` a meno che tu non passi `--out`. Le sezioni seguenti riportano il comando di ciascun target per un'app Rust; un'app TSX aggiunge il proprio entry (`nsh package App.tsx --target …`).

> [!NOTE]
> Per integrare NSH *dentro* un'app nativa esistente, vedi [Piattaforme](./platforms.md#embed-in-a-native-app) e, per un'app GPUI o GPUI Kit, [GPUI](./gpui.md#embedding-in-a-gpui-app). Per distribuire aggiornamenti che le app scaricano e verificano, vedi [Pacchetti firmati](./signed-packages.md).

<a id="app-metadata-30"></a>

## Metadati dell'app: `nsh.json`

`nsh package` legge `nsh.json` nella directory dell'app (accanto al file di entry di un'app TSX). `nsh init` ne scrive uno:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| Chiave | Tipo | Predefinito | Usata per |
|---|---|---|---|
| `name` | stringa | il nome della directory dell'entry | Il nome visualizzato sotto l'icona (`CFBundleDisplayName`, `android:label` su Android) e il nome del file di output. |
| `id` | stringa | obbligatorio | Il bundle identifier / nome del package Android, in forma reverse-DNS sotto un dominio di tua proprietà. Indica anche dove l'app conserva il proprio [storage](../modules/nsh.md#storage), così che ogni app abbia il suo. `nsh package` e `nsh publish` segnalano il segnaposto `com.example.`. |
| `version` | stringa | `"1.0.0"` | La versione visibile all'utente (`CFBundleShortVersionString`, `versionName`). |
| `build` | numero | `1` | Il numero di build (`CFBundleVersion`, `versionCode`). Incrementalo a ogni release che carichi. |
| `icon` | stringa | nessuno | Un PNG quadrato, idealmente 1024×1024, relativo a `nsh.json`. |

`nsh.json` contiene anche `rust` e `root` (i crate dell'app e il suo componente root, [Sviluppare con Rust](./rust.md)), `theme` e `appearance`, `tailwind` (vedi [Tailwind](./tailwind.md)) e `capabilities` (vedi [Sandbox e capability](./sandbox-and-capabilities.md)); [Struttura del progetto](./project-structure.md#nshjson) elenca tutte le chiavi. Le chiavi sconosciute causano un errore.

Ogni chiave qui sopra può essere sovrascritta da riga di comando, comodo in CI:

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## Opzioni

| Flag | Descrizione |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | Cosa compilare (obbligatorio). |
| `-o, --out <dir>` | Directory di output. Predefinita: `.nsh/out`. |
| `--name <name>` | Nome visualizzato. |
| `--id <id>` | Bundle identifier, ad esempio `com.example.app`. |
| `--app-version <version>` | Versione, ad esempio `1.2.0`. |
| `--build <n>` | Numero di build. |
| `--icon <png>` | Icona dell'app: un PNG quadrato, idealmente 1024×1024. |
| `--sign <identity>` | iOS: l'identità di firma del codice per i dispositivi. |
| `--profile <file>` | iOS: il provisioning profile per i dispositivi (`.mobileprovision`). |
| `--keystore <file>` | Android: un keystore di release (predefinito: la chiave di debug). |
| `--key-alias <alias>` | Android: l'alias della chiave nel keystore. |
| `--keystore-password <password>` | Android: la password del keystore; letta anche da `NSH_KEYSTORE_PASSWORD`. |
| `--abi <abi>` | Android: gli ABI dell'APK, ripetuti o separati da virgole (predefiniti: `arm64-v8a` e `armeabi-v7a`). |
| `--run` | Installa e avvia al termine: nel simulatore iOS, oppure sul dispositivo o emulatore Android che `adb` vede; le app macOS, Linux e Windows vengono avviate su questa macchina; un sito web viene servito su questa macchina e aperto nel browser. Non disponibile per `--target ios`. |

<a id="ios-simulator"></a>

## Simulatore iOS

```sh
nsh package --target ios-simulator --run
```

Scrive `.nsh/out/<Name>.app`, con firma ad hoc (il simulatore richiede una firma ma nessuna identità). Con `--run` avvia un simulatore se non ne è in esecuzione nessuno, installa l'app e la avvia. Richiede Xcode.

<a id="ios-devices"></a>

## Dispositivi iOS

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

Scrive `.nsh/out/<Name>.ipa`, pronto per TestFlight, gli strumenti di caricamento su App Store o l'installazione diretta (a seconda del profilo). Cosa succede:

- Il provisioning profile viene copiato nell'app come `embedded.mobileprovision`.
- Gli entitlement provengono dal profilo. NSH verifica che l'application identifier del profilo copra il `id` dell'app (funzionano profili wildcard come `TEAMID.*` o `TEAMID.com.example.*`) e, in caso contrario, si ferma con un errore.
- L'app viene firmata con `codesign` usando l'identità, poi compressa in zip come `.ipa` (`Payload/<Name>.app`).

Trova le tue identità con:

```sh
security find-identity -v -p codesigning
```

Senza `--sign` e `--profile`, NSH scrive un `.nsh/out/<Name>.app` non firmato e te lo segnala; così com'è non può essere installato su un dispositivo.

L'app supporta iPhone e iPad, in verticale e in orizzontale (verticale capovolto solo su iPad), e richiede iOS 15.0 o successivo.

## Android

```sh
nsh package --target android --run
```

Scrive `.nsh/out/<Name>.apk`. L'APK viene assemblato direttamente con i build tool dell'SDK (`aapt2`, `zipalign`, `apksigner`), senza Gradle. Requisiti:

- L'Android SDK, individuato tramite `ANDROID_HOME` (o `ANDROID_SDK_ROOT`, o `~/Library/Android/sdk`), con i build tool e il package `platforms;android-35`. NSH ti indica il comando `sdkmanager` quando ne manca uno.
- Un JDK, per creare il debug keystore la prima volta.
- Per un'app Rust, l'Android NDK (`sdkmanager "ndk;<version>"`, o `ANDROID_NDK_HOME`), che compila il suo `libnsh.so`.

L'app ha come target l'API 35 e richiede l'API 28 (Android 9) o successiva. Contiene codice nativo per gli ABI dei telefoni, `arm64-v8a` e `armeabi-v7a`; con `--run` anche quello del dispositivo, come l'`x86_64` di un emulatore. Con `--abi` li scegli tu, ad esempio `--abi arm64-v8a` solo per i telefoni a 64 bit, l'APK più piccolo:

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### Firma per la release

Senza `--keystore`, l'APK viene firmato con la chiave di debug standard (`~/.android/debug.keystore`, creata se assente) e NSH avvisa che non è adatto alle release per gli store. Per una release, crea una volta un keystore e passalo:

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

Preferisci la variabile d'ambiente a `--keystore-password`, in modo che la password non finisca nella cronologia della shell.

## macOS

```sh
nsh package --target macos --run
```

Scrive `.nsh/out/<Name>.app`: l'eseguibile in `Contents/MacOS/`, e `nsh/assets/…`, `nsh/app.json` (il titolo della finestra e l'aspetto dell'app) e il `nsh/bundle.nshc` di un'app TSX in `Contents/Resources/`. L'app è firmata ad hoc e richiede macOS 14 o successivo; per distribuirla, firmala con un Developer ID ed eseguine la notarizzazione. Vedi [macOS](./macos.md#packaging).

## Linux

```sh
nsh package --target linux --run
```

Scrive `.nsh/out/<Name>/` (l'eseguibile `<Name>`, `nsh/assets/…`, `nsh/app.json` con il titolo della finestra e l'application id, il `nsh/bundle.nshc` di un'app TSX, `<id>.desktop` e l'icona `<id>.png`) e lo stesso contenuto come `.nsh/out/<Name>.tar.gz`. Esegui il packaging su Linux: il runner viene compilato per la macchina su cui si lavora. GTK 4 (4.14 o successivo), Pango e WebKitGTK 6.0 (per le web view) devono essere installati dove l'app viene eseguita. Installazione e desktop entry: [Linux](./linux.md#packaging).

## Windows

```sh
nsh package --target windows --run
```

Scrive `.nsh\out\<Name>\` (l'eseguibile `<Name>.exe` con l'icona dell'app, `nsh\assets\…`, `nsh\app.json` con il titolo della finestra, l'app id, la versione e l'aspetto, e il `nsh\bundle.nshc` di un'app TSX) e lo stesso contenuto come `.nsh\out\<Name>.zip`. Un'app TSX non richiede alcuno strumento; il runner di un'app Rust viene compilato con Visual Studio Build Tools. Esegui il packaging su Windows: il runner viene compilato per la macchina su cui si lavora e solo Windows può incorporare l'icona. L'app viene eseguita da qualunque posizione in cui venga copiata la sua directory; non viene installato nulla. Vedi [Windows](./windows.md#packaging).

## Web

```sh
nsh package --target web --run
```

Scrive `.nsh/out/<Name>/`, un sito statico: `index.html`, `manifest.webmanifest`, lo script della pagina (`nsh.<digest>.js`) e `nsh.<digest>.wasm` (il motore e il crate di un'app Rust; per un'app TSX il runtime, accanto al modulo ES dell'app `app.<digest>.js`), i suoi asset e le sue icone, ciascuno chiamato in base al proprio contenuto, in modo che gli host possano metterli in cache a tempo indefinito. Distribuisci la directory su qualsiasi web server o CDN; `--run` la serve su `http://127.0.0.1:4173/` perché tu possa aprirla. Header di cache e incorporamento: [Web](./web.md#publish-an-app).

<a id="icons"></a>

## Icone

Fornisci un unico PNG quadrato, idealmente 1024×1024, in `nsh.json` (`"icon": "icon.png"`) oppure con `--icon`:

- **iOS:** compilato da `actool` di Xcode nell'asset catalog dell'app (`Assets.car`), che ricava tutte le dimensioni necessarie a iOS.
- **Android:** ridimensionato a 192×192 e usato come icona del launcher (`mipmap-xxxhdpi`).
- **macOS:** convertito da `sips` in `AppIcon.icns`.
- **Linux:** copiato come `<id>.png`, che il file `.desktop` indica come `Icon`.
- **Windows:** ridimensionato da 16 a 64 pixel e a 256 pixel e incorporato nell'eseguibile come icona, che vengono mostrate dalla finestra, da Explorer e dalla barra delle applicazioni.
- **Web:** ridimensionato a 32 pixel (la favicon), 180 (`apple-touch-icon`), 192 e 512 (il web app manifest).

Senza icona, il sistema mostra quella predefinita.

<a id="what-is-inside"></a>

## Contenuto del pacchetto

Il pacchetto di un'app Rust è il suo runner, compilato con il tuo crate e la sua root montata, più gli asset che i suoi crate registrano (`assets!()`). Il pacchetto di un'app TSX contiene il suo bytecode, il suo `capabilities.json` (quando dichiara capability) e gli asset che importa, accanto al runtime precompilato:

| Target | Runtime | App TSX |
|---|---|---|
| iOS | l'eseguibile `nsh-ios-app` | `<Name>.app/nsh/bundle.nshc`, `nsh/assets/…` |
| Android | `classes.dex`, `lib/<abi>/libnsh.so` (senza simboli, archiviati senza compressione, allineati a 16 KB) | `assets/nsh/bundle.nshc`, `assets/nsh/assets/…` |
| macOS | l'eseguibile `nsh-macos-app`, rinominato `<Name>` | `<Name>.app/Contents/Resources/nsh/bundle.nshc`, `nsh/assets/…` |
| Linux | l'eseguibile `nsh-linux-app`, rinominato `<Name>` | `<Name>/nsh/bundle.nshc`, `nsh/assets/…` |
| Windows | l'eseguibile `nsh-windows-app.exe`, rinominato `<Name>.exe` | `<Name>\nsh\bundle.nshc`, `nsh\assets\…` |
| Web | `nsh.<digest>.wasm`, `nsh.<digest>.js` | `<Name>/app.<digest>.js`, `assets/…`, `index.html` |

Un'app impacchettata non registra [componenti nativi](./native-components.md); per quelli, incorpora NSH nella tua app.

<a id="finding-the-runtime"></a>

## Trovare il runtime

Un'app Rust compila i propri runner. Per le app TSX, `nsh package` cerca il runtime precompilato accanto alla CLI (`bin/../runtime` nella distribuzione). In un checkout di NSH usa `target/<triple>/<profile>` e `target/android/<profile>`, con il profilo della CLI stessa (una CLI debug usa runtime debug): compilali con `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim` (o `aarch64-apple-ios` per i dispositivi) e `cargo xtask android` (aggiungi `--release` per una CLI release); `nsh-macos-app` (su macOS), `nsh-linux-app` (su Linux) e `nsh-windows-app` (su Windows) vengono compilati per questa macchina in `target/<profile>` (`cargo build -p nsh-macos-app`, `cargo build -p nsh-linux-app`, `cargo build -p nsh-windows-app`); il runtime web viene compilato con il profilo `web`, a prescindere da quello della CLI, in `target/wasm32-unknown-unknown/web/`. La variabile d'ambiente `NSH_RUNTIME` indirizza la CLI a un'altra directory organizzata come il `runtime/` della distribuzione (`ios/iphoneos`, `ios/iphonesimulator`, `android/release`, `macos`, `linux`, `windows`, `gpui`, `web`, ...).

<a id="see-also"></a>

## Vedi anche

- [CLI](./cli.md): tutti i comandi
- [Pacchetti firmati](./signed-packages.md): gli aggiornamenti che le app scaricano
- [Struttura del progetto](./project-structure.md): `nsh.json` e i file di un'app
