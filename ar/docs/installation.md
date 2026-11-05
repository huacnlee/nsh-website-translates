---
title: "التثبيت"
description: "احصل على أمر NSH، سواء من توزيعة جاهزة أو من نسخة مصدرية، مع الأدوات التي تحتاجها كل منصة - iOS وAndroid وmacOS وWindows وLinux."
order: 3
group: start
source_hash: ee1dd93b8166b092
---

# التثبيت

كل ما تقوم به NSH يمر عبر أمر واحد، `nsh`. فهو يبني التطبيقات المكتوبة بلغة Rust أو TSX، ويشغّلها على كل منصة، ويقدّم TSX إلى مضيفات التطوير مع تحديثات فورية، ويحزّم التطبيقات القابلة للتثبيت. يمكنك استخدامه من توزيعة مبنية مسبقًا أو بناؤه من نسخة مستنسخة من المستودع.

تحتاج التطبيقات المكتوبة بلغة Rust أيضًا إلى سلسلة أدوات Rust ([أدناه](#for-apps-written-in-rust))، أما تطبيقات TSX فتحتاج إلى `nsh` وحده. وفوق ذلك، تحتاج كل منصة إلى أدواتها الخاصة:

| المنصة | التطوير والتحزيم على | المتطلبات |
|---|---|---|
| iOS | macOS | Xcode وبيئة تشغيل محاكي iOS |
| Android | macOS أو Windows أو Linux | Android SDK وJDK؛ ومحاكٍ أو جهاز |
| macOS | macOS | أدوات سطر الأوامر في Xcode؛ وتعمل التطبيقات على macOS 14+ |
| Windows | Windows | Windows 10 1809+؛ وWebView2 Runtime لعروض الويب |
| Linux | Linux | GTK 4.14+ (وحزم التطوير الخاصة بها لبناء بيئة التشغيل) |
| [GPUI](./gpui.md) (التضمين في تطبيقات GPUI) | macOS أو Windows أو Linux | وحدة معالجة رسومية (Metal أو DirectX أو Vulkan)؛ وعلى Linux، Wayland أو X11 |

مضيف AppKit هو الافتراضي على macOS. ويحتاج Mac Catalyst (`--target catalyst`) إلى Xcode مثل iOS. التفاصيل في [أدوات المنصات](#platform-tools).

<a id="installing-a-release"></a>

## تثبيت إصدار جاهز

يتضمن كل [إصدار على GitHub](https://github.com/longbridge/nsh/releases) التوزيعة المبنية مسبقًا (أدناه) لأنظمة macOS (Apple silicon) وLinux x86_64 وWindows x86_64. كل طريقة تثبيت تضع الأمر `nsh` نفسه في `PATH`.

**macOS وLinux**، باستخدام سكربت التثبيت:

```sh
curl -fsSL https://nsh.dev/install.sh | sh
```

يثبّت التوزيعة في `~/.nsh` وينشئ الرابط `~/.local/bin/nsh` إليها؛ وإعادة تشغيله تحدّثها. يثبّت `NSH_VERSION=v0.1.0` إصدارًا محددًا، ويختار `NSH_INSTALL_DIR` مجلدًا آخر.

**Windows**، في PowerShell:

```powershell
irm https://nsh.dev/install.ps1 | iex
```

يثبّت في `%LOCALAPPDATA%\nsh` ويضيف `bin` الخاص به إلى `PATH` للمستخدم (افتح طرفية جديدة بعد ذلك). يعمل `$env:NSH_VERSION` و`$env:NSH_INSTALL_DIR` كما سبق.

**Homebrew** (macOS وLinux):

```sh
brew install longbridge/tap/nsh
```

**Scoop** (Windows):

```powershell
scoop install https://github.com/longbridge/nsh/releases/latest/download/nsh.json
```

**mise** (الأنظمة الثلاثة):

```sh
mise use -g github:longbridge/nsh
```

لا تحمل الأرشيفات (`nsh-macos-arm64.tar.gz` و`nsh-linux-x86_64.tar.gz` و`nsh-windows-x86_64.zip`، ومع كل منها `.sha256`) رقم إصدار في أسمائها، لذا يجلب `https://github.com/longbridge/nsh/releases/latest/download/<archive>` دائمًا أحدث إصدار. وتصدر حزم SDK للتضمين منفردة أيضًا، للتطبيقات الأصلية التي لا تحتاج إلى CLI: `nsh-embed-ios.zip` و`nsh-embed-android.zip`.

> [!NOTE]
> الملفات التنفيذية غير موقّعة بعد. يضع macOS الملفات التي تنزّلها المتصفحات في الحجر الصحي؛ أما سكربت التثبيت وHomebrew وmise فتنزّل باستخدام `curl` ولا تتأثر بذلك، وفي غير ذلك شغّل `xattr -dr com.apple.quarantine <dir>`. تحتاج بيئة تشغيل Linux إلى glibc 2.39 وGTK 4.14 أو أحدث (Ubuntu 24.04 وما بعده). لا توجد نسخة لـ Mac بمعالج Intel ولا لـ Linux / Windows بمعمارية arm64: ابنِ هذه من نسخة مستنسخة.

<a id="for-apps-written-in-rust"></a>

## للتطبيقات المكتوبة بلغة Rust

ثبّت Rust عبر [rustup](https://rustup.rs). يبني `nsh` المشغّل الخاص بتطبيق Rust لكل هدف باستخدام Cargo، من حزمتك (crate) وحزم NSH على crates.io بإصدار CLI نفسه، لذا أضف أهداف Rust للمنصات التي تعمل عليها:

```sh
rustup target add aarch64-apple-ios-sim aarch64-apple-ios aarch64-apple-ios-macabi   # iOS simulator, devices, Mac Catalyst
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android # Android (with the SDK's NDK)
rustup target add wasm32-unknown-unknown                                             # the web
```

تُبنى تطبيقات سطح المكتب للجهاز الذي تعمل عليه. وتشغيل `cargo run` في مجلد تطبيق Rust يبدأه مباشرة على واجهة سطح المكتب الخلفية، وهو يُبنى باستخدام مكتبات التطوير الخاصة بها ([أدوات المنصات](#platform-tools)). تستخدم عمليات بناء Android أيضًا **NDK** من SDK، كما في [بناء بيئة تشغيل Android](#building-the-android-runtime).

<a id="the-prebuilt-distribution"></a>

## التوزيعة المبنية مسبقًا

التوزيعة عبارة عن مجلد، `dist/nsh`، يحتوي على CLI وبيئات التشغيل الأصلية المبنية مسبقًا التي يحزّم بها التطبيقات:

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

ضع `dist/nsh/bin` في `PATH` (أو استدعِ `dist/nsh/bin/nsh` مباشرة) وأبقِ المجلد متكاملًا: يجد `nsh` بيئات التشغيل بجواره، في `bin/../runtime` (وكذلك عبر رابط رمزي إليه، كما تفعل برامج التثبيت).

```sh
export PATH="$PWD/dist/nsh/bin:$PATH"
nsh --version
```

تُنشأ التوزيعة باستخدام `cargo xtask dist` في نسخة مستنسخة (أدناه). والملف التنفيذي `nsh` الموجود فيها مبني لذلك الجهاز. على جهاز Mac مع Xcode تتضمن بيئتي تشغيل iOS وmacOS (Apple Silicon)؛ وعلى Linux تتضمن بيئة تشغيل Linux بدلًا منهما، مبنية لذلك الجهاز؛ وعلى Windows تتضمن بيئة تشغيل Windows، مع `bin\nsh.exe`. وتتضمن كل منها أيضًا مضيف تطوير [GPUI](./gpui.md)، مبنيًا لذلك الجهاز. وجميعها تتضمن بيئة تشغيل Android (على Windows فقط عند العثور على Android SDK).

<a id="installing-the-latest-source"></a>

## تثبيت أحدث إصدار من المصدر

على macOS وLinux، ثبّت أحدث `main` باستخدام Git وRust وتبعيات بناء المنصة الواردة أدناه:

```sh
curl -fsSL https://nsh.dev/install.sh | sh -s -- --source
nsh -V # nsh 0.1.1 (abcdef0)
```

يحتفظ المثبّت بالنسخة المستنسخة في `~/.nsh/source`، ويبني CLI بنمط الإصدار (release) ويربطه في `~/.local/bin`. أعد تشغيل الأمر للتحديث؛ ويجب حفظ تغييرات المصدر المحلية أولًا. وتتيح النسخة المحتفظ بها لـ NSH بناء بيئات التشغيل الأصلية عند الطلب. يستخدم Cargo إعداداته الحالية ومجلد الهدف الموجود لديه. يغيّر `NSH_INSTALL_DIR` بادئة التثبيت؛ ويختار `NSH_VERSION` الإصدارات الجاهزة فقط. يعرض كل من `-V` و`--version` رقم الإصدار ومراجعة المصدر المكوّنة من سبعة أحرف.

<a id="building-from-a-checkout"></a>

## البناء من نسخة مستنسخة

تحتاج إلى Rust عبر [rustup](https://rustup.rs). يحدد الملف `rust-toolchain.toml` في المستودع سلسلة الأدوات المستقرة (stable) ويثبّت أهداف iOS وAndroid عند أول استخدام.

```sh
git clone https://github.com/longbridge/nsh.git
cd nsh
cargo build -p nsh-cli          # ./target/debug/nsh
```

ثم ابنِ مضيف التطوير لكل هدف تريد التشغيل عليه، مرة واحدة، ومرة أخرى بعد كل تحديث للنسخة المستنسخة:

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

من أجل `nsh package`، ابنِ مشغّلات الإصدار (release) أيضًا:

```sh
cargo build -p nsh-ios-app --target aarch64-apple-ios-sim       # nsh package --target ios-simulator
cargo build -p nsh-ios-app --target aarch64-apple-ios           # nsh package --target ios
cargo xtask android                                             # nsh package --target android
cargo build -p nsh-macos-app                                    # nsh package --target macos
cargo build -p nsh-linux-app                                    # nsh package --target linux
cargo build -p nsh-windows-app                                  # nsh package --target windows
# nsh package --target web uses the same web runtime as nsh run --target web
```

يبحث CLI المبني من نسخة مستنسخة عن بيئات التشغيل في `target/<triple>/<profile>` (بيئات macOS وLinux وWindows وGPUI، المبنية لهذا الجهاز، في `target/<profile>`) وفي `target/android/<profile>[-dev]`، مستخدمًا ملف البناء (profile) الخاص به: يستخدم `./target/debug/nsh` بيئات تشغيل debug، ويستخدم `./target/release/nsh` بيئات release. ابنِ الاثنتين بالملف نفسه (أضف `--release` إلى كل منها للحصول على تطبيقات أسرع).

> [!TIP]
> يجعل `NSH_RUNTIME=/path/to/runtime` الأمر `nsh` يستخدم مجلد بيئات تشغيل مرتبًا مثل `runtime/` في التوزيعة، أينما كان CLI نفسه.

<a id="platform-tools"></a>

## أدوات المنصات

<a id="ios-and-mac-catalyst"></a>

### iOS وMac Catalyst

- **Xcode** (مع أدوات سطر الأوامر الخاصة به). يستخدم `nsh run` الأداة `xcrun simctl` لتشغيل المحاكيات وتثبيت مضيف التطوير؛ ويستخدم `nsh package` الأداة `actool` لأيقونات التطبيق والأداة `codesign` للتوقيع.
- بيئة تشغيل محاكي iOS. إن لم تكن إحداها مثبتة، فثبّت واحدة باستخدام `xcodebuild -downloadPlatform iOS`.
- تستهدف التطبيقات iOS 15.0 وما بعده.

### Android

- **Android SDK**، يُعثر عليه عبر `ANDROID_HOME` أو `ANDROID_SDK_ROOT` أو المكان الافتراضي في Android Studio (`~/Library/Android/sdk`، و`%LOCALAPPDATA%\Android\Sdk` على Windows)، مع:
  - `platforms;android-35` و`build-tools` حديث (تستخدم NSH الأدوات `aapt2` و`zipalign` و`apksigner` منه، دون Gradle)؛
  - `platform-tools` (`adb`).
- **JDK** (ينشئ `keytool` مخزن مفاتيح التصحيح في `~/.android/debug.keystore` أول مرة تحزّم فيها، ويحتاج `apksigner` إلى Java).
- محاكٍ قيد التشغيل أو جهاز متصل عبر `adb`. تحتاج التطبيقات إلى Android 9 (API 28) أو أحدث.

```sh
sdkmanager "platforms;android-35" "build-tools;35.0.1" "platform-tools"
```

### macOS

- **أدوات سطر الأوامر في Xcode** (`xcode-select --install`): الـ SDK وclang لبناء بيئة التشغيل، و`codesign` و`sips` لتحزيم التطبيقات.
- تحتاج التطبيقات إلى macOS 14 أو أحدث.

انظر [macOS](./macos.md).

### Linux

- **GTK 4.14** أو أحدث، مع حزم التطوير الخاصة بها وclang لبناء بيئة التشغيل: `libgtk-4-dev clang` (Debian وUbuntu 24.04 أو أحدث)، `gtk4 clang` (Arch)، `gtk4-devel clang` (Fedora).
- **WebKitGTK 6.0** (الإصدار 2.40 أو أحدث) لعروض الويب: `libwebkitgtk-6.0-dev` (Debian وUbuntu)، `webkitgtk-6.0` (Arch)، `webkitgtk6.0-devel` (Fedora) لبناء بيئة التشغيل؛ ثم تحتاجها التطبيقات في المكان الذي تعمل فيه. وبدونها، يبني `cargo xtask dist` بيئة التشغيل مع عناصر نائبة لعروض الويب.
- إضافات **GStreamer** لصيغ الفيديو التي تشغّلها التطبيقات.

انظر [Linux](./linux.md).

### Windows

- **Windows 10 1809** أو أحدث، أو Windows 11. وWebView2 Runtime (جزء من Windows 11، ويُثبَّت مع Edge على Windows 10) لعروض الويب.
- لبناء بيئة التشغيل: **Visual Studio Build Tools** مع حِمل العمل "Desktop development with C++" وWindows SDK، و**LLVM** (libclang، لربط QuickJS؛ يُعثر عليه في `C:\Program Files\LLVM`، وإلا فاضبط `LIBCLANG_PATH`).

انظر [Windows](./windows.md).

<a id="building-the-android-runtime"></a>

### بناء بيئة تشغيل Android

يحتاج بناء بيئة تشغيل Android من نسخة مستنسخة (`cargo xtask android`) إضافةً إلى **NDK** من SDK (`ndk;<version>`؛ اضبط `ANDROID_NDK_HOME` إن كان أحدث إصدار مثبت غير مكتمل) وإلى `javac`.

<a id="what-works-where"></a>

## ما يعمل وأين

| الأمر | macOS | Linux | Windows |
|---|---|---|---|
| `nsh init`، `nsh build`، `nsh test`، `nsh dev`، `nsh check` | نعم | نعم | نعم |
| `nsh run --target catalyst` (Mac Catalyst) | نعم | لا | لا |
| `nsh run --target macos`، `nsh package --target macos` | نعم | لا | لا |
| `nsh run --target linux` (الافتراضي على Linux)، `nsh package --target linux` | لا | نعم | لا |
| `nsh run --target windows` (الافتراضي على Windows)، `nsh package --target windows` | لا | لا | نعم |
| `nsh run --target gpui` (الواجهة الخلفية التي تضمّنها تطبيقات GPUI) | نعم | نعم | نعم |
| `nsh run --target ios`، `nsh package --target ios` / `ios-simulator` | نعم، مع Xcode | لا | لا |
| `nsh run --target android`، `nsh package --target android` | نعم | نعم، من نسخة مستنسخة | نعم، مع بيئة تشغيل Android |
| `nsh keygen`، `certify`، `publish`، `verify`، `revoke` | نعم | نعم | نعم |

على Linux، ابنِ CLI وبيئة تشغيل Android من نسخة مستنسخة (`cargo build -p nsh-cli` و`cargo xtask android --dev`)؛ وتُستخدم سلسلة أدوات Linux في NDK تلقائيًا. وعلى Windows تُستخدم سلسلة أدوات Windows في NDK بالطريقة نفسها، ويتضمن `cargo xtask dist` بيئة تشغيل Android عندما يعثر على Android SDK.

<a id="editor-setup"></a>

## إعداد المحرر

تطبيق Rust هو مشروع Cargo: يفحصه rust-analyzer (في VS Code وZed وNeovim وRustRover) ويكمل واجهة NSH البرمجية، مع تعليقات التوثيق الخاصة بها، كما في أي حزمة أخرى.

بالنسبة إلى TSX، لا تحتاج NSH إلى NPM. يكتب `nsh init` الملف `tsconfig.json` وتصريحات الأنواع لكل ما توفره NSH في `.nsh/types`، وكل أمر يبني التطبيق يُبقيها محدّثة. وأي محرر يستخدم خادم لغة TypeScript (VS Code وZed وNeovim وWebStorm) يفحص أنواع التطبيق بها. انظر [بنية المشروع](./project-structure.md#tsconfigjson-and-nshtypes).

<a id="next-steps"></a>

## الخطوات التالية

تابع إلى [البدء](./getting-started.md) لإنشاء تطبيق وتشغيله.
