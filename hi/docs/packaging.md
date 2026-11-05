---
title: "पैकेजिंग"
description: "app metadata, icons और signing के साथ iOS devices, iOS simulator, Android, macOS, Windows, Linux और web के लिए nsh package की मदद से इंस्टॉल करने योग्य Rust और TSX apps बनाएँ।"
order: 19
group: platforms
source_hash: 74c2991490481926
---

# पैकेजिंग

`nsh package` किसी ऐप को ऐसी चीज़ में बदल देता है जिसे आप इंस्टॉल कर सकते हैं: iOS सिमुलेटर के लिए `.app`, iOS डिवाइसों के लिए हस्ताक्षरित `.ipa`, Android के लिए हस्ताक्षरित `.apk`, macOS के लिए ad hoc हस्ताक्षरित `.app`, Linux के लिए एक डायरेक्टरी और `.tar.gz`, Windows के लिए एक डायरेक्टरी और `.zip`, या वेब के लिए एक स्टैटिक साइट। इसके लिए न किसी Xcode प्रोजेक्ट की ज़रूरत है और न Gradle की।

- **Rust ऐप** (`nsh.json` में उसका `"root"` दिया होता है) को उसकी डायरेक्टरी से पैकेज किया जाता है। `nsh` टारगेट का runner release मोड में बनाता है, जिसमें आपका crate कंपाइल होकर शामिल होता है और root माउंट होता है। इसमें QuickJS नहीं होता। इसके लिए Cargo, प्लैटफ़ॉर्म का Rust टारगेट (`rustup target add …`) और Android के लिए NDK चाहिए।
- **TSX ऐप** अपनी एंट्री का नाम देता है। उसका release बिल्ड (minified, QuickJS bytecode में कंपाइल किया हुआ, ठीक वैसे जैसे `nsh build --release` उसे बनाता है) NSH के साथ आने वाले **prebuilt runtime** के बगल में रखा जाता है, इसलिए इसे Rust toolchain की ज़रूरत नहीं पड़ती। जिस ऐप का अपना crate है (`"rust"` बिना `"root"` के), उसके लिए runners उसी के crate के साथ बनाए जाते हैं।

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

आउटपुट `.nsh/out/` में जाता है, जब तक आप `--out` न दें। नीचे के सेक्शन हर टारगेट के लिए Rust ऐप का कमांड देते हैं; TSX ऐप में उसकी एंट्री (`nsh package App.tsx --target …`) जुड़ जाती है।

> [!NOTE]
> NSH को किसी मौजूदा नेटिव ऐप *के अंदर* डालने के लिए [Platforms](./platforms.md#embed-in-a-native-app) देखें, और GPUI या GPUI Kit ऐप के लिए [GPUI](./gpui.md#embedding-in-a-gpui-app)। ऐसे अपडेट भेजने के लिए जिन्हें ऐप डाउनलोड करके सत्यापित करते हैं, [हस्ताक्षरित पैकेज](./signed-packages.md) देखें।

<a id="app-metadata-30"></a>

## ऐप मेटाडेटा: `nsh.json`

`nsh package` ऐप की डायरेक्टरी में `nsh.json` पढ़ता है (TSX ऐप में एंट्री फ़ाइल के बगल में)। `nsh init` एक फ़ाइल लिख देता है:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| कुंजी | प्रकार | डिफ़ॉल्ट | उपयोग |
|---|---|---|---|
| `name` | string | एंट्री की डायरेक्टरी का नाम | आइकन के नीचे दिखने वाला नाम (`CFBundleDisplayName`, Android `android:label`) और आउटपुट फ़ाइल का नाम। |
| `id` | string | अनिवार्य | bundle identifier / Android पैकेज नाम, reverse-DNS रूप में, ऐसे डोमेन के अंतर्गत जो आपका अपना हो। यह इसे भी नाम देता है कि ऐप अपना [storage](../modules/nsh.md#storage) कहाँ रखता है, ताकि हर ऐप का अपना storage हो। `nsh package` और `nsh publish` `com.example.` प्लेसहोल्डर के बारे में चेतावनी देते हैं। |
| `version` | string | `"1.0.0"` | उपयोगकर्ता को दिखने वाला वर्शन (`CFBundleShortVersionString`, `versionName`)। |
| `build` | number | `1` | बिल्ड नंबर (`CFBundleVersion`, `versionCode`)। हर उस रिलीज़ के लिए इसे बढ़ाएँ जो आप अपलोड करते हैं। |
| `icon` | string | कोई नहीं | एक वर्गाकार PNG, आदर्श रूप से 1024×1024, `nsh.json` के सापेक्ष। |

`nsh.json` में `rust` और `root` (ऐप के crates और उसका root component, [Rust के साथ बिल्ड करना](./rust.md)), `theme` और `appearance`, `tailwind` ([Tailwind](./tailwind.md) देखें) तथा `capabilities` ([Sandbox और capabilities](./sandbox-and-capabilities.md) देखें) भी होते हैं; सभी कुंजियों की सूची [प्रोजेक्ट संरचना](./project-structure.md#nshjson) में है। अज्ञात कुंजियाँ त्रुटि मानी जाती हैं।

ऊपर की हर कुंजी को कमांड लाइन पर ओवरराइड किया जा सकता है, जो CI में काम आता है:

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## विकल्प

| फ़्लैग | विवरण |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | किसके लिए बिल्ड करना है (अनिवार्य)। |
| `-o, --out <dir>` | आउटपुट डायरेक्टरी। डिफ़ॉल्ट `.nsh/out`। |
| `--name <name>` | प्रदर्शित नाम। |
| `--id <id>` | Bundle identifier, जैसे `com.example.app`। |
| `--app-version <version>` | वर्शन, जैसे `1.2.0`। |
| `--build <n>` | बिल्ड नंबर। |
| `--icon <png>` | ऐप आइकन: एक वर्गाकार PNG, आदर्श रूप से 1024×1024। |
| `--sign <identity>` | iOS: डिवाइसों के लिए code signing identity। |
| `--profile <file>` | iOS: डिवाइसों के लिए provisioning profile (`.mobileprovision`)। |
| `--keystore <file>` | Android: release keystore (डिफ़ॉल्ट: debug key)। |
| `--key-alias <alias>` | Android: keystore में key alias। |
| `--keystore-password <password>` | Android: keystore का पासवर्ड; इसे `NSH_KEYSTORE_PASSWORD` से भी पढ़ा जाता है। |
| `--abi <abi>` | Android: APK के ABIs, दोहराकर या कॉमा से अलग करके दें (डिफ़ॉल्ट: `arm64-v8a` और `armeabi-v7a`)। |
| `--run` | बाद में इंस्टॉल करके लॉन्च करें: iOS सिमुलेटर में, या उस Android डिवाइस या एमुलेटर पर जिसे `adb` देखता है; macOS, Linux और Windows ऐप इसी मशीन पर लॉन्च होते हैं; वेब साइट इसी मशीन पर सर्व की जाती है और ब्राउज़र में खुलती है। `--target ios` के लिए नहीं। |

<a id="ios-simulator"></a>

## iOS सिमुलेटर

```sh
nsh package --target ios-simulator --run
```

`.nsh/out/<Name>.app` लिखता है, जो ad hoc हस्ताक्षरित होता है (सिमुलेटर को हस्ताक्षर चाहिए, identity नहीं)। `--run` के साथ, अगर कोई सिमुलेटर नहीं चल रहा तो यह एक बूट करता है, ऐप इंस्टॉल करता है और उसे लॉन्च करता है। Xcode ज़रूरी है।

<a id="ios-devices"></a>

## iOS डिवाइस

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

`.nsh/out/<Name>.ipa` लिखता है, जो TestFlight, App Store अपलोड टूल या सीधे इंस्टॉलेशन के लिए तैयार होता है (profile पर निर्भर करता है)। इसमें यह होता है:

- Provisioning profile को ऐप में `embedded.mobileprovision` के रूप में कॉपी किया जाता है।
- Entitlements profile से आते हैं। NSH जाँचता है कि profile का application identifier ऐप के `id` को कवर करता है (`TEAMID.*` या `TEAMID.com.example.*` जैसे wildcard profile काम करते हैं), और ऐसा न होने पर त्रुटि के साथ रुक जाता है।
- ऐप पर identity के साथ `codesign` से हस्ताक्षर किए जाते हैं, फिर उसे zip करके `.ipa` (`Payload/<Name>.app`) बनाया जाता है।

अपनी identities इससे खोजें:

```sh
security find-identity -v -p codesigning
```

`--sign` और `--profile` के बिना, NSH बिना हस्ताक्षर वाला `.nsh/out/<Name>.app` लिखता है और आपको बता देता है; इसे जैसा है वैसा किसी डिवाइस पर इंस्टॉल नहीं किया जा सकता।

ऐप iPhone और iPad को सपोर्ट करता है, portrait और landscape में (portrait upside down केवल iPad पर), और इसे iOS 15.0 या नया चाहिए।

## Android

```sh
nsh package --target android --run
```

`.nsh/out/<Name>.apk` लिखता है। APK सीधे SDK के build tools (`aapt2`, `zipalign`, `apksigner`) से असेंबल किया जाता है, Gradle के बिना। आवश्यकताएँ:

- Android SDK, जो `ANDROID_HOME` (या `ANDROID_SDK_ROOT`, या `~/Library/Android/sdk`) से मिलता है, build tools और `platforms;android-35` पैकेज के साथ। कोई चीज़ न मिलने पर NSH आपको `sdkmanager` कमांड बताता है।
- एक JDK, पहली बार debug keystore बनाने के लिए।
- Rust ऐप के लिए, Android NDK (`sdkmanager "ndk;<version>"`, या `ANDROID_NDK_HOME`), जो उसका `libnsh.so` बनाता है।

ऐप API 35 को टारगेट करता है और उसे API 28 (Android 9) या नया चाहिए। इसमें फ़ोन के ABIs, `arm64-v8a` और `armeabi-v7a` के लिए नेटिव कोड होता है; `--run` के साथ डिवाइस का ABI भी जुड़ता है, जैसे एमुलेटर का `x86_64`। `--abi` से आप इन्हें खुद चुनते हैं, उदाहरण के लिए केवल 64-बिट फ़ोन के लिए `--abi arm64-v8a`, जो सबसे छोटा APK देता है:

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### Release के लिए हस्ताक्षर

`--keystore` के बिना, APK पर मानक debug key (`~/.android/debug.keystore`, न हो तो बनाई जाती है) से हस्ताक्षर होते हैं, और NSH चेतावनी देता है कि यह store releases के लिए नहीं है। Release के लिए एक बार keystore बनाएँ और उसे पास करें:

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

`--keystore-password` के बजाय environment variable को प्राथमिकता दें, ताकि पासवर्ड आपकी shell history में न पहुँचे।

## macOS

```sh
nsh package --target macos --run
```

`.nsh/out/<Name>.app` लिखता है: एक्ज़ीक्यूटेबल `Contents/MacOS/` में, और `nsh/assets/…`, `nsh/app.json` (विंडो का शीर्षक और ऐप का appearance) तथा TSX ऐप का `nsh/bundle.nshc` `Contents/Resources/` में। ऐप पर ad hoc हस्ताक्षर होते हैं और उसे macOS 14 या बाद का चाहिए; उसे वितरित करने के लिए Developer ID से हस्ताक्षर करें और notarize करें। [macOS](./macos.md#packaging) देखें।

## Linux

```sh
nsh package --target linux --run
```

`.nsh/out/<Name>/` लिखता है (एक्ज़ीक्यूटेबल `<Name>`, `nsh/assets/…`, `nsh/app.json` जिसमें विंडो का शीर्षक और application id होता है, TSX ऐप का `nsh/bundle.nshc`, `<id>.desktop` और आइकन `<id>.png`) और `.nsh/out/<Name>.tar.gz` के समान ही सब कुछ। Package on Linux: runner उसी मशीन के लिए बनता है जिस पर उसे बनाया जाता है। जहाँ ऐप चले, वहाँ GTK 4 (4.14 या बाद का), Pango और WebKitGTK 6.0 (web views के लिए) इंस्टॉल होने चाहिए। इसे और desktop entry को इंस्टॉल करने के बारे में: [Linux](./linux.md#packaging)।

## Windows

```sh
nsh package --target windows --run
```

`.nsh\out\<Name>\` लिखता है (एक्ज़ीक्यूटेबल `<Name>.exe` ऐप के आइकन के साथ, `nsh\assets\…`, `nsh\app.json` जिसमें विंडो का शीर्षक, app id, वर्शन और appearance होते हैं, और TSX ऐप का `nsh\bundle.nshc`) और `.nsh\out\<Name>.zip` के समान ही सब कुछ। TSX ऐप को किसी टूल की ज़रूरत नहीं; Rust ऐप का runner Visual Studio Build Tools से बनता है। Package on Windows: runner उसी मशीन के लिए बनता है जिस पर उसे बनाया जाता है, और आइकन केवल Windows ही एम्बेड कर सकता है। ऐप उस जगह से चलता है जहाँ उसकी डायरेक्टरी कॉपी की गई हो; कुछ इंस्टॉल नहीं होता। [Windows](./windows.md#packaging) देखें।

## Web

```sh
nsh package --target web --run
```

`.nsh/out/<Name>/` लिखता है, जो एक स्टैटिक साइट है: `index.html`, `manifest.webmanifest`, पेज स्क्रिप्ट (`nsh.<digest>.js`) और `nsh.<digest>.wasm` (Rust ऐप का engine और crate; TSX ऐप के लिए runtime, ऐप के ES module `app.<digest>.js` के बगल में), उसके assets और आइकन, हर एक का नाम उसकी सामग्री के आधार पर रखा गया है ताकि होस्ट उन्हें हमेशा के लिए cache कर सकें। डायरेक्टरी को किसी भी वेब सर्वर या CDN पर डिप्लॉय करें; `--run` उसे `http://127.0.0.1:4173/` पर सर्व करता है ताकि आप उसे खोल सकें। Cache headers और embedding: [Web](./web.md#publish-an-app)।

<a id="icons"></a>

## आइकन

`nsh.json` (`"icon": "icon.png"`) में या `--icon` के साथ एक वर्गाकार PNG दें, आदर्श रूप से 1024×1024:

- **iOS:** Xcode के `actool` द्वारा ऐप के asset catalog (`Assets.car`) में कंपाइल किया जाता है, जो iOS के लिए ज़रूरी हर साइज़ खुद बना लेता है।
- **Android:** 192×192 में resize करके launcher आइकन (`mipmap-xxxhdpi`) के रूप में उपयोग किया जाता है।
- **macOS:** `sips` द्वारा `AppIcon.icns` में बदला जाता है।
- **Linux:** `<id>.png` के रूप में कॉपी किया जाता है, जिसे `.desktop` फ़ाइल अपने `Icon` के रूप में नाम देती है।
- **Windows:** 16 से 64 पिक्सेल और 256 पिक्सेल में resize करके एक्ज़ीक्यूटेबल में उसके आइकन के रूप में एम्बेड किया जाता है, जिसे विंडो, Explorer और taskbar दिखाते हैं।
- **Web:** 32 पिक्सेल (favicon), 180 (`apple-touch-icon`), 192 और 512 (web app manifest) में resize किया जाता है।

आइकन न हो तो सिस्टम अपना डिफ़ॉल्ट दिखाता है।

<a id="what-is-inside"></a>

## अंदर क्या होता है

Rust ऐप का पैकेज उसका runner होता है, जो आपके crate के साथ और उसके root को माउंट करके बना होता है, साथ में वे assets जो उसके crates रजिस्टर करते हैं (`assets!()`)। TSX ऐप के पैकेज में उसका bytecode, उसका `capabilities.json` (जब वह capabilities घोषित करता है) और वे assets होते हैं जो वह import करता है, prebuilt runtime के बगल में:

| टारगेट | Runtime | TSX ऐप |
|---|---|---|
| iOS | `nsh-ios-app` एक्ज़ीक्यूटेबल | `<Name>.app/nsh/bundle.nshc`, `nsh/assets/…` |
| Android | `classes.dex`, `lib/<abi>/libnsh.so` (symbols के बिना, बिना compress किए संग्रहीत, 16 KB aligned) | `assets/nsh/bundle.nshc`, `assets/nsh/assets/…` |
| macOS | `nsh-macos-app` एक्ज़ीक्यूटेबल, जिसका नाम बदलकर `<Name>` किया गया | `<Name>.app/Contents/Resources/nsh/bundle.nshc`, `nsh/assets/…` |
| Linux | `nsh-linux-app` एक्ज़ीक्यूटेबल, जिसका नाम बदलकर `<Name>` किया गया | `<Name>/nsh/bundle.nshc`, `nsh/assets/…` |
| Windows | `nsh-windows-app.exe` एक्ज़ीक्यूटेबल, जिसका नाम बदलकर `<Name>.exe` किया गया | `<Name>\nsh\bundle.nshc`, `nsh\assets\…` |
| Web | `nsh.<digest>.wasm`, `nsh.<digest>.js` | `<Name>/app.<digest>.js`, `assets/…`, `index.html` |

पैकेज किया हुआ ऐप कोई [नेटिव components](./native-components.md) रजिस्टर नहीं करता; उनके लिए NSH को अपने ऐप में एम्बेड करें।

<a id="finding-the-runtime"></a>

## Runtime ढूँढना

Rust ऐप अपने runners खुद बनाता है। TSX ऐप के लिए, `nsh package` prebuilt runtime को CLI के बगल में खोजता है (वितरण में `bin/../runtime`)। NSH के checkout में यह `target/<triple>/<profile>` और `target/android/<profile>` का उपयोग करता है, CLI की अपनी profile के साथ (debug CLI debug runtimes का उपयोग करता है): इन्हें `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim` (या डिवाइसों के लिए `aarch64-apple-ios`) और `cargo xtask android` (release CLI के लिए `--release` जोड़ें) से बनाएँ; `nsh-macos-app` (macOS पर), `nsh-linux-app` (Linux पर) और `nsh-windows-app` (Windows पर) इसी मशीन के लिए `target/<profile>` (`cargo build -p nsh-macos-app`, `cargo build -p nsh-linux-app`, `cargo build -p nsh-windows-app`) में बनते हैं; वेब runtime CLI की profile चाहे जो हो, `web` profile से `target/wasm32-unknown-unknown/web/` में बनता है। Environment variable `NSH_RUNTIME` CLI को किसी दूसरी डायरेक्टरी की ओर इंगित करता है, जो वितरण के `runtime/` (`ios/iphoneos`, `ios/iphonesimulator`, `android/release`, `macos`, `linux`, `windows`, `gpui`, `web`, ...) की तरह व्यवस्थित हो।

<a id="see-also"></a>

## यह भी देखें

- [CLI](./cli.md): हर कमांड
- [हस्ताक्षरित पैकेज](./signed-packages.md): ऐप द्वारा डाउनलोड किए जाने वाले अपडेट
- [प्रोजेक्ट संरचना](./project-structure.md): `nsh.json` और ऐप की फ़ाइलें
