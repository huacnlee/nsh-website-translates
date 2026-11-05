---
title: "इंस्टॉलेशन"
description: "NSH कमांड प्राप्त करें, प्रीबिल्ट डिस्ट्रीब्यूशन से या सोर्स चेकआउट से, साथ ही हर प्लेटफ़ॉर्म के लिए आवश्यक टूल - iOS, Android, macOS, Windows और Linux।"
order: 3
group: start
source_hash: ee1dd93b8166b092
---

# इंस्टॉलेशन

NSH जो कुछ भी करता है, वह एक ही कमांड `nsh` से होता है। यह Rust या TSX में लिखे ऐप्स बनाता है, उन्हें हर प्लेटफ़ॉर्म पर चलाता है, हॉट अपडेट के साथ डेवलपमेंट होस्ट को TSX उपलब्ध कराता है, और इंस्टॉल करने योग्य ऐप्स पैकेज करता है। आप इसे प्रीबिल्ट डिस्ट्रीब्यूशन से इस्तेमाल कर सकते हैं या रिपॉज़िटरी के चेकआउट से बना सकते हैं।

Rust में लिखे ऐप्स के लिए Rust टूलचेन भी चाहिए ([नीचे](#for-apps-written-in-rust)); TSX ऐप्स को केवल `nsh` चाहिए। इसके अलावा, हर प्लेटफ़ॉर्म को अपने टूल चाहिए:

| प्लेटफ़ॉर्म | डेवलप और पैकेज करने का स्थान | ज़रूरतें |
|---|---|---|
| iOS | macOS | Xcode और iOS सिम्युलेटर रनटाइम |
| Android | macOS, Windows या Linux | Android SDK और JDK; एक एमुलेटर या डिवाइस |
| macOS | macOS | Xcode के कमांड लाइन टूल; ऐप्स macOS 14+ पर चलते हैं |
| Windows | Windows | Windows 10 1809+; वेब व्यू के लिए WebView2 Runtime |
| Linux | Linux | GTK 4.14+ (और रनटाइम बनाने के लिए इसके डेवलपमेंट पैकेज) |
| [GPUI](./gpui.md) (GPUI ऐप्स में एम्बेड करने के लिए) | macOS, Windows या Linux | एक GPU (Metal, DirectX या Vulkan); Linux पर Wayland या X11 |

macOS पर AppKit होस्ट डिफ़ॉल्ट है। Mac Catalyst (`--target catalyst`) को iOS की तरह Xcode चाहिए। विवरण [प्लेटफ़ॉर्म टूल](#platform-tools) में हैं।

<a id="installing-a-release"></a>

## रिलीज़ इंस्टॉल करना

हर [GitHub release](https://github.com/longbridge/nsh/releases) में macOS (Apple silicon), Linux x86_64 और Windows x86_64 के लिए प्रीबिल्ट डिस्ट्रीब्यूशन (नीचे) होता है। इंस्टॉल करने का हर तरीका आपके `PATH` पर वही `nsh` कमांड रखता है।

**macOS और Linux**, इंस्टॉल स्क्रिप्ट से:

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

यह डिस्ट्रीब्यूशन को `~/.nsh` में इंस्टॉल करती है और `~/.local/bin/nsh` को उससे लिंक करती है; इसे दोबारा चलाने पर अपडेट हो जाता है। `NSH_VERSION=v0.1.0` किसी रिलीज़ को पिन करता है, `NSH_INSTALL_DIR` कोई दूसरी डायरेक्टरी चुनता है।

**Windows**, PowerShell में:

```powershell
irm https://nsh.dev/install.ps1 | iex
```

यह `%LOCALAPPDATA%\nsh` में इंस्टॉल होती है और इसका `bin` आपके उपयोगकर्ता के `PATH` में जोड़ देती है (बाद में नया टर्मिनल खोलें)। `$env:NSH_VERSION` और `$env:NSH_INSTALL_DIR` ऊपर की तरह काम करते हैं।

**Homebrew** (macOS और Linux):

```sh
brew install longbridge/tap/nsh
```

**Scoop** (Windows):

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise** (तीनों के लिए):

```sh
mise use -g github:longbridge/nsh
```

आर्काइव (`nsh-macos-arm64.tar.gz`, `nsh-linux-x86_64.tar.gz`, `nsh-windows-x86_64.zip`, हर एक के साथ एक `.sha256`) के नामों में वर्ज़न नहीं होता, इसलिए `https://github.com/longbridge/nsh/releases/latest/download/<archive>` हमेशा नवीनतम वर्ज़न लाता है। एम्बेडिंग SDK अलग से भी जारी किए जाते हैं, उन नेटिव ऐप्स के लिए जिन्हें CLI की ज़रूरत नहीं: `nsh-embed-ios.zip` और `nsh-embed-android.zip`।

> [!NOTE]
> बाइनरी अभी साइन नहीं की गई हैं। macOS ब्राउज़र से डाउनलोड की गई फ़ाइलों को क्वारंटीन कर देता है; इंस्टॉल स्क्रिप्ट, Homebrew और mise `curl` से डाउनलोड करते हैं और इससे प्रभावित नहीं होते, अन्यथा `xattr -dr com.apple.quarantine <dir>` चलाएँ। Linux रनटाइम को glibc 2.39 और GTK 4.14 या नया वर्ज़न चाहिए (Ubuntu 24.04 और बाद के)। Intel Mac या arm64 Linux / Windows के लिए कोई बिल्ड नहीं है: उन्हें चेकआउट से बनाएँ।

<a id="for-apps-written-in-rust"></a>

## Rust में लिखे ऐप्स के लिए

Rust को [rustup](https://rustup.rs) से इंस्टॉल करें। `nsh` आपके क्रेट और crates.io पर CLI के वर्ज़न वाले NSH के क्रेट से, Cargo के ज़रिए हर टारगेट के लिए Rust ऐप का रनर बनाता है, इसलिए जिन प्लेटफ़ॉर्म पर आप चलाते हैं उनके Rust टारगेट जोड़ें:

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

डेस्कटॉप उसी मशीन के लिए बनते हैं जिस पर आप काम कर रहे हैं। Rust ऐप की डायरेक्टरी में `cargo run` उसे सीधे डेस्कटॉप बैकएंड पर शुरू करता है, जो बैकएंड की डेवलपमेंट लाइब्रेरी के साथ बनता है ([प्लेटफ़ॉर्म टूल](#platform-tools))। Android बिल्ड भी SDK से एक **NDK** इस्तेमाल करते हैं, जैसा [Android रनटाइम बनाना](#building-the-android-runtime) करता है।

<a id="the-prebuilt-distribution"></a>

## प्रीबिल्ट डिस्ट्रीब्यूशन

डिस्ट्रीब्यूशन एक डायरेक्टरी `dist/nsh` है, जिसमें CLI और वे प्रीबिल्ट नेटिव रनटाइम होते हैं जिनसे यह ऐप्स पैकेज करता है:

```sh
dist/nsh/bin/nsh                                             # the CLI
dist/nsh/runtime/ios/iphoneos/nsh-ios-app                    # runs packaged apps on iOS devices
dist/nsh/runtime/ios/iphonesimulator/{nsh-ios-app,nsh-ios-host}
dist/nsh/runtime/ios/maccatalyst/nsh-ios-host                # the Mac Catalyst development host
dist/nsh/runtime/android/{release,dev}/                      # classes.dex, lib/<abi>/libnsh.so, symbols/<abi>/libnsh.so
dist/nsh/runtime/macos/{nsh-macos-host,nsh-macos-app}        # the macOS (AppKit) development host and release runner
dist/nsh/runtime/linux/{nsh-linux-host,nsh-linux-app}        # the Linux development host and release runner
dist/nsh/runtime/windows/{nsh-windows-host,nsh-windows-app}.exe  # the Windows development host and release runner
dist/nsh/runtime/gpui/nsh-gpui-host[.exe]                    # the GPUI development host, for this OS
dist/nsh/runtime/web/{nsh.wasm,nsh-dev.wasm,nsh.js}          # the web runtimes (nsh package / run --target web)
dist/nsh/embed/ios/{NativeShell,NativeShellDev}.xcframework  # embedding in iOS apps
dist/nsh/embed/android/{nsh,nsh-dev}.aar                     # embedding in Android apps
```

`dist/nsh/bin` को अपने `PATH` में रखें (या `dist/nsh/bin/nsh` को सीधे कॉल करें) और डायरेक्टरी को एक साथ रखें: `nsh` रनटाइम को अपने बगल में, `bin/../runtime` में खोजता है (उसके सिमलिंक के ज़रिए भी, जैसा इंस्टॉलर बनाते हैं)।

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

डिस्ट्रीब्यूशन चेकआउट में `cargo xtask dist` से बनता है (नीचे)। इसमें मौजूद `nsh` बाइनरी उसी मशीन के लिए बनी होती है। Xcode वाले Mac पर इसमें iOS और macOS रनटाइम (Apple Silicon) शामिल होते हैं; Linux पर इनकी जगह उसी मशीन के लिए बना Linux रनटाइम शामिल होता है; Windows पर Windows रनटाइम, `bin\nsh.exe` के साथ। हर एक में उसी मशीन के लिए बना [GPUI](./gpui.md) डेवलपमेंट होस्ट भी शामिल होता है। सभी में Android रनटाइम शामिल है (Windows पर केवल तब, जब Android SDK मिल जाए)।

<a id="installing-the-latest-source"></a>

## नवीनतम सोर्स इंस्टॉल करना

macOS और Linux पर, Git, Rust और नीचे दी गई प्लेटफ़ॉर्म बिल्ड डिपेंडेंसी के साथ नवीनतम `main` इंस्टॉल करें:

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

इंस्टॉलर चेकआउट को `~/.nsh/source` में रखता है, रिलीज़ CLI बनाता है और उसे `~/.local/bin` में लिंक करता है। अपडेट करने के लिए कमांड फिर से चलाएँ; स्थानीय सोर्स बदलाव पहले सेव होने चाहिए। रखा गया चेकआउट NSH को ज़रूरत पड़ने पर नेटिव रनटाइम बनाने देता है। Cargo अपना मौजूदा कॉन्फ़िगरेशन और टारगेट डायरेक्टरी इस्तेमाल करता है। `NSH_INSTALL_DIR` इंस्टॉलेशन प्रीफ़िक्स बदलता है; `NSH_VERSION` केवल प्रीबिल्ट रिलीज़ चुनता है। `-V` और `--version` दोनों वर्ज़न और सात अक्षरों वाला सोर्स रिविज़न दिखाते हैं।

<a id="building-from-a-checkout"></a>

## चेकआउट से बनाना

आपको [rustup](https://rustup.rs) से Rust चाहिए। रिपॉज़िटरी की `rust-toolchain.toml` stable टूलचेन चुनती है और पहली बार इस्तेमाल पर iOS और Android टारगेट इंस्टॉल करती है।

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

फिर जिस भी टारगेट पर चलाना चाहते हैं, उसका डेवलपमेंट होस्ट एक बार बनाएँ, और चेकआउट अपडेट करने के बाद दोबारा बनाएँ:

```sh
cargo build -p nsh-ios-host --target aarch64-apple-ios-macabi   # nsh run (Mac Catalyst window)
cargo build -p nsh-ios-host --target aarch64-apple-ios-sim      # nsh run --target ios
cargo xtask android --dev                                       # nsh run --target android
cargo build -p nsh-macos-host                                   # nsh run --target macos (built for you in a checkout)
cargo build -p nsh-linux-host                                   # nsh run on Linux (built for you in a checkout)
cargo build -p nsh-windows-host                                 # nsh run on Windows (built for you in a checkout)
cargo build --manifest-path crates/gpui/Cargo.toml --target-dir target -p nsh-gpui-host   # nsh run --target gpui (built for you in a checkout)
cargo build --profile web -p nsh-platform-web --target wasm32-unknown-unknown   # nsh run --target web (built for you in a checkout)
```

`nsh package` के लिए रिलीज़ रनर भी बनाएँ:

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

चेकआउट से बना CLI रनटाइम को `target/<triple>/<profile>` में (macOS, Linux, Windows और GPUI वाले, इस मशीन के लिए बने, `target/<profile>` में) और `target/android/<profile>[-dev]` में खोजता है, अपनी प्रोफ़ाइल के साथ: `./target/debug/nsh` डीबग रनटाइम इस्तेमाल करता है, `./target/release/nsh` रिलीज़ वाले। दोनों को एक ही प्रोफ़ाइल से बनाएँ (तेज़ ऐप्स के लिए सभी में `--release` जोड़ें)।

> [!TIP]
> `NSH_RUNTIME=/path/to/runtime` `nsh` को ऐसी रनटाइम डायरेक्टरी इस्तेमाल करवाता है जिसका लेआउट डिस्ट्रीब्यूशन के `runtime/` जैसा हो, चाहे CLI खुद कहीं भी हो।

<a id="platform-tools"></a>

## प्लेटफ़ॉर्म टूल

<a id="ios-and-mac-catalyst"></a>

### iOS और Mac Catalyst

- **Xcode** (अपने कमांड लाइन टूल के साथ)। `nsh run` सिम्युलेटर बूट करने और डेवलपमेंट होस्ट इंस्टॉल करने के लिए `xcrun simctl` इस्तेमाल करता है; `nsh package` ऐप आइकन के लिए `actool` और साइनिंग के लिए `codesign` इस्तेमाल करता है।
- iOS सिम्युलेटर रनटाइम। यदि कोई इंस्टॉल नहीं है, तो `xcodebuild -downloadPlatform iOS` से इंस्टॉल करें।
- ऐप्स iOS 15.0 और उसके बाद के वर्ज़न को टारगेट करते हैं।

### Android

- **Android SDK**, जो `ANDROID_HOME`, `ANDROID_SDK_ROOT` या Android Studio की डिफ़ॉल्ट जगह (`~/Library/Android/sdk`, Windows पर `%LOCALAPPDATA%\Android\Sdk`) से मिलता है, जिसमें:
  - `platforms;android-35` और हाल का `build-tools` (NSH इससे `aapt2`, `zipalign` और `apksigner` इस्तेमाल करता है, Gradle नहीं);
  - `platform-tools` (`adb`)।
- **JDK** (`keytool` पहली बार पैकेज करने पर `~/.android/debug.keystore` में डीबग कीस्टोर बनाता है, `apksigner` को Java चाहिए)।
- चालू एमुलेटर या `adb` के ज़रिए जुड़ा डिवाइस। ऐप्स को Android 9 (API 28) या उसके बाद का वर्ज़न चाहिए।

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **Xcode के कमांड लाइन टूल** (`xcode-select --install`): रनटाइम बनाने के लिए SDK और clang, ऐप्स पैकेज करने के लिए `codesign` और `sips`।
- ऐप्स को macOS 14 या उसके बाद का वर्ज़न चाहिए।

[macOS](./macos.md) देखें।

### Linux

- **GTK 4.14** या उसके बाद का वर्ज़न, रनटाइम बनाने के लिए इनके डेवलपमेंट पैकेज और clang के साथ: `libgtk-4-dev clang` (Debian, Ubuntu 24.04 या बाद का), `gtk4 clang` (Arch), `gtk4-devel clang` (Fedora)।
- वेब व्यू के लिए **WebKitGTK 6.0** (2.40 या बाद का): रनटाइम बनाने के लिए `libwebkitgtk-6.0-dev` (Debian, Ubuntu), `webkitgtk-6.0` (Arch), `webkitgtk6.0-devel` (Fedora); फिर ऐप्स को यह वहाँ चाहिए जहाँ वे चलते हैं। इसके बिना `cargo xtask dist` वेब व्यू के लिए प्लेसहोल्डर के साथ रनटाइम बनाता है।
- ऐप्स जिन वीडियो फ़ॉर्मेट को चलाते हैं, उनके लिए **GStreamer** प्लगइन।

[Linux](./linux.md) देखें।

### Windows

- **Windows 10 1809** या उसके बाद का वर्ज़न, या Windows 11। वेब व्यू के लिए WebView2 Runtime (Windows 11 का हिस्सा, Windows 10 पर Edge के साथ इंस्टॉल होता है)।
- रनटाइम बनाने के लिए: "Desktop development with C++" वर्कलोड और Windows SDK के साथ **Visual Studio Build Tools**, और **LLVM** (libclang, QuickJS की बाइंडिंग के लिए; `C:\Program Files\LLVM` में मिलता है, अन्यथा `LIBCLANG_PATH` सेट करें)।

[Windows](./windows.md) देखें।

<a id="building-the-android-runtime"></a>

### Android रनटाइम बनाना

चेकआउट से Android रनटाइम बनाने (`cargo xtask android`) के लिए SDK से एक **NDK** (`ndk;<version>`; यदि इंस्टॉल किया गया सबसे नया NDK अधूरा हो तो `ANDROID_NDK_HOME` सेट करें) और `javac` भी चाहिए।

<a id="what-works-where"></a>

## कहाँ क्या काम करता है

| कमांड | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`, `nsh build`, `nsh test`, `nsh dev`, `nsh check` | हाँ | हाँ | हाँ |
| `nsh run --target catalyst` (Mac Catalyst) | हाँ | नहीं | नहीं |
| `nsh run --target macos`, `nsh package --target macos` | हाँ | नहीं | नहीं |
| `nsh run --target linux` (Linux पर डिफ़ॉल्ट), `nsh package --target linux` | नहीं | हाँ | नहीं |
| `nsh run --target windows` (Windows पर डिफ़ॉल्ट), `nsh package --target windows` | नहीं | नहीं | हाँ |
| `nsh run --target gpui` (GPUI ऐप्स जो बैकएंड एम्बेड करते हैं) | हाँ | हाँ | हाँ |
| `nsh run --target ios`, `nsh package --target ios` / `ios-simulator` | हाँ, Xcode के साथ | नहीं | नहीं |
| `nsh run --target android`, `nsh package --target android` | हाँ | हाँ, चेकआउट से | हाँ, Android रनटाइम के साथ |
| `nsh keygen`, `certify`, `publish`, `verify`, `revoke` | हाँ | हाँ | हाँ |

Linux पर CLI और Android रनटाइम चेकआउट से बनाएँ (`cargo build -p nsh-cli` और `cargo xtask android --dev`); NDK का Linux टूलचेन अपने-आप इस्तेमाल होता है। Windows पर NDK का Windows टूलचेन उसी तरह इस्तेमाल होता है, और Android SDK मिलने पर `cargo xtask dist` में Android रनटाइम शामिल हो जाता है।

<a id="editor-setup"></a>

## एडिटर सेटअप

Rust ऐप एक Cargo प्रोजेक्ट है: rust-analyzer (VS Code, Zed, Neovim, RustRover) इसे जाँचता है और किसी भी क्रेट की तरह NSH की API को, उसकी डॉक कमेंट के साथ, ऑटो-कम्प्लीट करता है।

TSX के लिए NSH को NPM की ज़रूरत नहीं है। `nsh init` एक `tsconfig.json` और NSH जो कुछ भी उपलब्ध कराता है उसकी टाइप डिक्लेरेशन `.nsh/types` में लिखता है, और ऐप बनाने वाला हर कमांड उन्हें अप-टू-डेट रखता है। TypeScript language server इस्तेमाल करने वाला कोई भी एडिटर (VS Code, Zed, Neovim, WebStorm) इनके सहारे ऐप को टाइप-चेक करता है। [प्रोजेक्ट संरचना](./project-structure.md#tsconfigjson-and-nshtypes) देखें।

<a id="next-steps"></a>

## अगले चरण

ऐप बनाने और चलाने के लिए [शुरुआत करें](./getting-started.md) से आगे बढ़ें।
