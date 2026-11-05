---
title: "التغليف"
description: "أنشئ تطبيقات Rust وTSX قابلة للتثبيت باستخدام nsh package لأجهزة iOS ومحاكي iOS وAndroid وmacOS وWindows وLinux والويب، مع بيانات التطبيق الوصفية والأيقونات والتوقيع."
order: 19
group: platforms
source_hash: 74c2991490481926
---

# التحزيم

يحوّل `nsh package` التطبيق إلى شيء يمكنك تثبيته: `.app` لمحاكي iOS، و`.ipa` موقّع لأجهزة iOS، و`.apk` موقّع لنظام Android، و`.app` موقّع توقيعًا مؤقتًا (ad hoc) لنظام macOS، ومجلد مع `.tar.gz` لنظام Linux، ومجلد مع `.zip` لنظام Windows، أو موقع ثابت للويب. لا يحتاج إلى مشروع Xcode ولا إلى Gradle.

- **تطبيق Rust** (يحدد `nsh.json` اسم `"root"` الخاص به) يُحزَّم من مجلده. يبني `nsh` مشغّل المنصة المستهدفة في وضع الإصدار (release) مع تضمين الـ crate الخاص بك وتركيب المكوّن الجذري، دون QuickJS. ويتطلب ذلك: Cargo، وهدف Rust الخاص بالمنصة (`rustup target add …`)، ولنظام Android الـ NDK.
- **تطبيق TSX** يحدد نقطة دخوله. يوضع إصداره النهائي (مصغَّر، ومُترجم إلى bytecode لـ QuickJS، تمامًا كما يبنيه `nsh build --release`) بجانب **بيئة التشغيل الجاهزة** التي تأتي مع NSH، ولذلك لا يحتاج إلى سلسلة أدوات Rust. أما التطبيق الذي يملك crate خاصًا به (`"rust"` دون `"root"`) فتُبنى له مشغّلات مع الـ crate الخاص به.

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

يُكتب الناتج في `.nsh/out/` ما لم تمرّر `--out`. تعرض الأقسام التالية أمر كل هدف لتطبيق Rust؛ أما تطبيق TSX فيضيف إليه نقطة دخوله (`nsh package App.tsx --target …`).

> [!NOTE]
> لوضع NSH *داخل* تطبيق native موجود بدلًا من ذلك، راجع [المنصات](./platforms.md#embed-in-a-native-app)، ولتطبيق GPUI أو GPUI Kit راجع [GPUI](./gpui.md#embedding-in-a-gpui-app). ولإصدار تحديثات تنزّلها التطبيقات وتتحقق منها، راجع [الحزم الموقّعة](./signed-packages.md).

<a id="app-metadata-30"></a>

## بيانات التطبيق الوصفية: `nsh.json`

يقرأ `nsh package` الملف `nsh.json` في مجلد التطبيق (بجانب ملف نقطة الدخول في تطبيق TSX). ينشئ `nsh init` ملفًا منه:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png"
}
```

| المفتاح | النوع | القيمة الافتراضية | الاستخدام |
|---|---|---|---|
| `name` | string | اسم مجلد نقطة الدخول | الاسم المعروض تحت الأيقونة (`CFBundleDisplayName`، و`android:label` في Android) واسم ملف الناتج. |
| `id` | string | مطلوب | معرّف الحزمة (bundle identifier) / اسم حزمة Android، بصيغة النطاق المعكوس تحت نطاق تملكه. ويحدد أيضًا المكان الذي يحفظ فيه التطبيق [تخزينه](../modules/nsh.md#storage)، فيكون لكل تطبيق تخزينه الخاص. يحذّر `nsh package` و`nsh publish` من القيمة النائبة `com.example.`. |
| `version` | string | `"1.0.0"` | الإصدار الظاهر للمستخدم (`CFBundleShortVersionString`، `versionName`). |
| `build` | number | `1` | رقم البناء (`CFBundleVersion`، `versionCode`). ارفعه مع كل إصدار ترفعه. |
| `icon` | string | لا شيء | ملف PNG مربع، ويفضَّل أن يكون 1024×1024، مسارُه نسبي إلى `nsh.json`. |

يحتوي `nsh.json` أيضًا على `rust` و`root` (الـ crates الخاصة بالتطبيق ومكوّنه الجذري، انظر [البناء باستخدام Rust](./rust.md))، و`theme` و`appearance`، و`tailwind` (انظر [Tailwind](./tailwind.md)) و`capabilities` (انظر [الصندوق الرملي والصلاحيات](./sandbox-and-capabilities.md))؛ وتسرد [بنية المشروع](./project-structure.md#nshjson) جميع المفاتيح. المفاتيح غير المعروفة تسبب خطأ.

يمكن تجاوز كل مفتاح أعلاه من سطر الأوامر، وهو أمر مفيد في CI:

```sh
nsh package --target android --app-version 1.4.0 --build 42
```

<a id="options"></a>

## الخيارات

| الخيار | الوصف |
|---|---|
| `--target <ios \| ios-simulator \| android \| macos \| linux \| windows \| web>` | المنصة المراد البناء لها (مطلوب). |
| `-o, --out <dir>` | مجلد الناتج. الافتراضي `.nsh/out`. |
| `--name <name>` | الاسم المعروض. |
| `--id <id>` | معرّف الحزمة، مثل `com.example.app`. |
| `--app-version <version>` | الإصدار، مثل `1.2.0`. |
| `--build <n>` | رقم البناء. |
| `--icon <png>` | أيقونة التطبيق: ملف PNG مربع، ويفضَّل أن يكون 1024×1024. |
| `--sign <identity>` | iOS: هوية توقيع الشيفرة للأجهزة. |
| `--profile <file>` | iOS: ملف التوفير (provisioning profile) للأجهزة (`.mobileprovision`). |
| `--keystore <file>` | Android: مخزن مفاتيح للإصدار النهائي (الافتراضي: مفتاح التصحيح). |
| `--key-alias <alias>` | Android: اسم المفتاح البديل (alias) في مخزن المفاتيح. |
| `--keystore-password <password>` | Android: كلمة مرور مخزن المفاتيح؛ وتُقرأ أيضًا من `NSH_KEYSTORE_PASSWORD`. |
| `--abi <abi>` | Android: واجهات ABI الخاصة بملف APK، مكررة أو مفصولة بفواصل (الافتراضي: `arm64-v8a` و`armeabi-v7a`). |
| `--run` | التثبيت والتشغيل بعد ذلك: في محاكي iOS، أو على جهاز Android أو المحاكي الذي يراه `adb`؛ وتُشغَّل تطبيقات macOS وLinux وWindows على هذا الجهاز؛ ويُقدَّم موقع الويب على هذا الجهاز ويُفتح في المتصفح. غير متاح لـ `--target ios`. |

<a id="ios-simulator"></a>

## محاكي iOS

```sh
nsh package --target ios-simulator --run
```

يكتب `.nsh/out/<Name>.app`، موقّعًا توقيعًا مؤقتًا (ad hoc) (يحتاج المحاكي إلى توقيع لكن دون هوية). مع `--run` يشغّل محاكيًا إن لم يكن أي محاكٍ قيد التشغيل، ثم يثبّت التطبيق ويشغّله. يتطلب Xcode.

<a id="ios-devices"></a>

## أجهزة iOS

```sh
nsh package --target ios \
  --sign "Apple Distribution: Example Inc (ABCDE12345)" \
  --profile AppStore.mobileprovision
```

يكتب `.nsh/out/<Name>.ipa`، جاهزًا لـ TestFlight أو أدوات الرفع إلى App Store أو التثبيت المباشر (بحسب ملف التوفير). ما يحدث:

- يُنسخ ملف التوفير إلى التطبيق باسم `embedded.mobileprovision`.
- تأتي الاستحقاقات (entitlements) من ملف التوفير. يتحقق NSH من أن معرّف التطبيق في ملف التوفير يغطي `id` الخاص بالتطبيق (تعمل ملفات التوفير ذات الرموز البديلة مثل `TEAMID.*` أو `TEAMID.com.example.*`) ويتوقف بخطأ في غير ذلك.
- يُوقَّع التطبيق بالأمر `codesign` باستخدام الهوية، ثم يُضغط في `.ipa` (`Payload/<Name>.app`).

اعثر على هوياتك بالأمر:

```sh
security find-identity -v -p codesigning
```

من دون `--sign` و`--profile`، يكتب NSH ملف `.nsh/out/<Name>.app` غير موقّع ويخبرك بذلك؛ ولا يمكن تثبيته على جهاز كما هو.

يدعم التطبيق iPhone وiPad، بالاتجاهين الرأسي والأفقي (الرأسي المقلوب على iPad فقط)، ويتطلب iOS 15.0 أو أحدث.

## Android

```sh
nsh package --target android --run
```

يكتب `.nsh/out/<Name>.apk`. يُجمَّع ملف APK مباشرة بأدوات البناء الخاصة بـ SDK (`aapt2`، `zipalign`، `apksigner`)، دون Gradle. المتطلبات:

- Android SDK، يُعثر عليه عبر `ANDROID_HOME` (أو `ANDROID_SDK_ROOT`، أو `~/Library/Android/sdk`)، مع أدوات البناء وحزمة `platforms;android-35`. يخبرك NSH بأمر `sdkmanager` عند غياب أي منها.
- JDK، لإنشاء مخزن مفاتيح التصحيح في المرة الأولى.
- لتطبيق Rust، Android NDK (`sdkmanager "ndk;<version>"`، أو `ANDROID_NDK_HOME`)، الذي يبني `libnsh.so` الخاص به.

يستهدف التطبيق API 35 ويتطلب API 28 (Android 9) أو أحدث. يحتوي على شيفرة native لواجهات ABI الخاصة بالهواتف، `arm64-v8a` و`armeabi-v7a`؛ ومع `--run` يحتوي أيضًا على واجهة الجهاز، مثل `x86_64` في المحاكي. يتيح `--abi` اختيارها بنفسك، مثل `--abi arm64-v8a` للهواتف ذات 64 بت فقط، وهو أصغر APK:

```sh
nsh package --target android --abi arm64-v8a
```

<a id="signing-for-release"></a>

### التوقيع للإصدار النهائي

من دون `--keystore`، يُوقَّع APK بمفتاح التصحيح القياسي (`~/.android/debug.keystore`، ويُنشأ إن لم يكن موجودًا)، ويحذّر NSH من أنه غير مخصص لإصدارات المتجر. للإصدار النهائي، أنشئ مخزن مفاتيح مرة واحدة ومرّره:

```sh
keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

NSH_KEYSTORE_PASSWORD=… nsh package --target android \
  --keystore release.jks --key-alias upload
```

فضّل متغير البيئة على `--keystore-password` حتى لا تنتهي كلمة المرور في سجل الأوامر في الطرفية.

## macOS

```sh
nsh package --target macos --run
```

يكتب `.nsh/out/<Name>.app`: الملف التنفيذي في `Contents/MacOS/`، و`nsh/assets/…`، و`nsh/app.json` (عنوان النافذة ومظهر التطبيق)، وملف `nsh/bundle.nshc` الخاص بتطبيق TSX في `Contents/Resources/`. يُوقَّع التطبيق توقيعًا مؤقتًا (ad hoc) ويتطلب macOS 14 أو أحدث؛ ولتوزيعه، وقّعه بهوية Developer ID ووثّقه (notarize). انظر [macOS](./macos.md#packaging).

## Linux

```sh
nsh package --target linux --run
```

يكتب `.nsh/out/<Name>/` (الملف التنفيذي `<Name>`، و`nsh/assets/…`، و`nsh/app.json` مع عنوان النافذة ومعرّف التطبيق، وملف `nsh/bundle.nshc` الخاص بتطبيق TSX، و`<id>.desktop` والأيقونة `<id>.png`) ومثل ما يكتبه `.nsh/out/<Name>.tar.gz`. التحزيم على Linux: يُبنى المشغّل للجهاز الذي يُبنى عليه. يجب تثبيت GTK 4 (الإصدار 4.14 أو أحدث) وPango وWebKitGTK 6.0 (لعروض الويب) حيث يعمل التطبيق. لتثبيته وتثبيت ملف سطح المكتب: [Linux](./linux.md#packaging).

## Windows

```sh
nsh package --target windows --run
```

يكتب `.nsh\out\<Name>\` (الملف التنفيذي `<Name>.exe` بأيقونة التطبيق، و`nsh\assets\…`، و`nsh\app.json` مع عنوان النافذة ومعرّف التطبيق والإصدار والمظهر، وملف `nsh\bundle.nshc` الخاص بتطبيق TSX) ومثل ما يكتبه `.nsh\out\<Name>.zip`. لا يحتاج تطبيق TSX إلى أي أدوات؛ أما مشغّل تطبيق Rust فيُبنى باستخدام Visual Studio Build Tools. التحزيم على Windows: يُبنى المشغّل للجهاز الذي يُبنى عليه، وWindows وحده يستطيع تضمين الأيقونة. يعمل التطبيق من أي مكان يُنسخ إليه مجلده؛ ولا شيء يُثبَّت. انظر [Windows](./windows.md#packaging).

<a id="web"></a>

## الويب

```sh
nsh package --target web --run
```

يكتب `.nsh/out/<Name>/`، وهو موقع ثابت: `index.html`، و`manifest.webmanifest`، وسكربت الصفحة (`nsh.<digest>.js`)، و`nsh.<digest>.wasm` (محرّك تطبيق Rust والـ crate الخاص به؛ وفي تطبيق TSX بيئة التشغيل، بجانب وحدة ES الخاصة بالتطبيق `app.<digest>.js`)، وأصوله وأيقوناته، ويُسمّى كل منها بحسب محتواه ليتمكن المضيفون من تخزينه مؤقتًا إلى أجل غير محدد. انشر المجلد على أي خادم ويب أو CDN؛ ويقدّمه `--run` على `http://127.0.0.1:4173/` لتفتحه. ترويسات التخزين المؤقت والتضمين: [الويب](./web.md#publish-an-app).

<a id="icons"></a>

## الأيقونات

قدّم ملف PNG مربعًا واحدًا، ويفضَّل أن يكون 1024×1024، في `nsh.json` (`"icon": "icon.png"`) أو باستخدام `--icon`:

- **iOS:** يترجمه `actool` التابع لـ Xcode إلى كتالوج أصول التطبيق (`Assets.car`)، الذي يشتق كل الأحجام التي يحتاجها iOS.
- **Android:** يُغيَّر حجمه إلى 192×192 ويُستخدم أيقونةً للمشغّل (`mipmap-xxxhdpi`).
- **macOS:** يحوّله `sips` إلى `AppIcon.icns`.
- **Linux:** يُنسخ باسم `<id>.png`، الذي يسمّيه ملف `.desktop` بوصفه `Icon`.
- **Windows:** يُغيَّر حجمه من 16 إلى 64 بكسل وإلى 256 بكسل ويُضمَّن في الملف التنفيذي أيقونةً له، وهي التي تعرضها النافذة ومستكشف الملفات (Explorer) وشريط المهام.
- **الويب:** يُغيَّر حجمه إلى 32 بكسل (favicon)، و180 (`apple-touch-icon`)، و192 و512 (manifest تطبيق الويب).

من دون أيقونة، يعرض النظام أيقونته الافتراضية.

<a id="what-is-inside"></a>

## ما بداخل الحزمة

حزمة تطبيق Rust هي مشغّله، مبنيًا مع الـ crate الخاص بك ومكوّنه الجذري مركّبًا، والأصول التي تسجّلها الـ crates الخاصة به (`assets!()`). أما حزمة تطبيق TSX فتحتوي على bytecode الخاص به، وملف `capabilities.json` (عندما يعلن عن صلاحيات)، والأصول التي يستوردها، بجانب بيئة التشغيل الجاهزة:

| الهدف | بيئة التشغيل | تطبيق TSX |
|---|---|---|
| iOS | الملف التنفيذي `nsh-ios-app` | `<Name>.app/nsh/bundle.nshc`، `nsh/assets/…` |
| Android | `classes.dex`، `lib/<abi>/libnsh.so` (بلا رموز، ومخزَّنة دون ضغط، ومحاذاة 16 KB) | `assets/nsh/bundle.nshc`، `assets/nsh/assets/…` |
| macOS | الملف التنفيذي `nsh-macos-app`، مُعاد تسميته `<Name>` | `<Name>.app/Contents/Resources/nsh/bundle.nshc`، `nsh/assets/…` |
| Linux | الملف التنفيذي `nsh-linux-app`، مُعاد تسميته `<Name>` | `<Name>/nsh/bundle.nshc`، `nsh/assets/…` |
| Windows | الملف التنفيذي `nsh-windows-app.exe`، مُعاد تسميته `<Name>.exe` | `<Name>\nsh\bundle.nshc`، `nsh\assets\…` |
| الويب | `nsh.<digest>.wasm`، `nsh.<digest>.js` | `<Name>/app.<digest>.js`، `assets/…`، `index.html` |

لا يسجّل التطبيق المحزَّم أي [مكونات native](./native-components.md)؛ ولاستخدامها، ضمّن NSH في تطبيقك.

<a id="finding-the-runtime"></a>

## العثور على بيئة التشغيل

يبني تطبيق Rust مشغّلاته بنفسه. أما تطبيقات TSX فيبحث `nsh package` عن بيئة التشغيل الجاهزة بجانب CLI (`bin/../runtime` في التوزيعة). وفي نسخة مستنسخة (checkout) من NSH يستخدم `target/<triple>/<profile>` و`target/android/<profile>`، بملف البناء (profile) الخاص بـ CLI نفسه (يستخدم CLI بوضع التصحيح بيئات تشغيل بوضع التصحيح): ابنِها باستخدام `cargo build -p nsh-ios-app --target aarch64-apple-ios-sim` (أو `aarch64-apple-ios` للأجهزة) و`cargo xtask android` (أضف `--release` لـ CLI بوضع الإصدار)؛ أما `nsh-macos-app` (على macOS) و`nsh-linux-app` (على Linux) و`nsh-windows-app` (على Windows) فتُبنى لهذا الجهاز في `target/<profile>` (`cargo build -p nsh-macos-app`، `cargo build -p nsh-linux-app`، `cargo build -p nsh-windows-app`)؛ وتُبنى بيئة تشغيل الويب بملف البناء `web` أيًّا كان ملف CLI، في `target/wasm32-unknown-unknown/web/`. ويوجّه متغير البيئة `NSH_RUNTIME` أداة CLI إلى مجلد آخر مرتّب مثل `runtime/` في التوزيعة (`ios/iphoneos`، `ios/iphonesimulator`، `android/release`، `macos`، `linux`، `windows`، `gpui`، `web`، ...).

<a id="see-also"></a>

## انظر أيضًا

- [CLI](./cli.md): جميع الأوامر
- [الحزم الموقّعة](./signed-packages.md): التحديثات التي تنزّلها التطبيقات
- [بنية المشروع](./project-structure.md): `nsh.json` وملفات التطبيق
