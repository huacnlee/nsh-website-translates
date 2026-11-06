---
title: "بنية المشروع"
description: "ملفات تطبيق NSH بلغة Rust أو TSX، وكل مفتاح في nsh.json، وإعداد TypeScript في .nsh/types، والأصول، وكيفية استيراد الوحدات والحزم."
order: 5
group: start
source_hash: 67da39e1182fc05c
---

# بنية المشروع

تطبيق NSH هو مجلد يضم `nsh.json` وشيفرته: حزمة Rust يسمّي `nsh.json` مكوّنها الجذري، أو وحدة دخول TSX، أو كليهما. أما كل ما عدا ذلك (وحدات إضافية وصور وخطوط وملفات JSON) فيُعثر عليه انطلاقًا من هناك: وحدات الحزمة ومجلد `assets/` الخاص بها، أو الملفات التي تستوردها وحدة دخول TSX، فلا توجد قائمة ملفات تحتاج إلى صيانتها.

التطبيق المكتوب بلغة Rust هو مشروع Cargo:

```text
my-app/
├── nsh.json           name, id, version, icon, the crate ("rust") and its root component ("root"), theme
├── Cargo.toml         the crate: nsh-core, nsh-base and your dependencies
├── src/
│   ├── lib.rs         the root component and the crate's UI set (#[native_module])
│   ├── main.rs        cargo run: the root on this machine's desktop backend
│   └── screens/       your own modules (any layout you like)
├── assets/            files the crate ships: asset!("logo@2x.png"), fonts
├── .gitignore         .nsh/ and target/
├── .nsh/              generated: the runners' sources, test entries, build output (.nsh/out)
└── target/            Cargo's build directory
```

أما تطبيق TSX فهو وحدة دخول والوحدات التي تستوردها:

```text
my-app/
├── App.tsx            the entry module: calls mount()
├── App.test.tsx       its tests (nsh test)
├── nsh.json           name, id, version, icon, Tailwind theme, capabilities
├── tsconfig.json      TypeScript settings for editors
├── .gitignore         .nsh/ and target/
├── components/        your own modules (any layout you like)
│   └── Header.tsx
├── assets/
│   ├── logo@2x.png    imported images
│   └── Inter.ttf      imported fonts
└── .nsh/              generated: type declarations, development host builds, test entries, build output (.nsh/out)
```

التطبيق الذي يجمع الاثنين يسرد حزمه في `"rust"` وله وحدة دخول TSX تستورد تلك الحزم ([البناء باستخدام Rust](./rust.md#extending-a-rust-app-with-tsx)).

يأخذ كل أمر مجلد التطبيق أو وحدة دخوله وسيطًا له (`nsh run my-app`، `nsh run my-app/App.tsx`). مجلد `nsh.json` ووحدة الدخول هو جذر التطبيق: يُقرأ `nsh.json` من هناك، وتكون مسارات الأصول نسبةً إليه، ويُكتب `.nsh/` فيه. في تطبيق Rust (`nsh.json` `"root"`) يشغّل المجلد المكوّن الجذري؛ وتسمية وحدة دخول TSX تشغّلها هي بدلًا منه.

<a id="the-root-component"></a>

## المكوّن الجذري

جذر تطبيق Rust هو مكوّن من حزمته، يسمّيه `"root"` في `nsh.json` بمساره داخل الحزمة (`App`، `shell::Gallery`). أما وحدة دخول TSX فهي وحدة عادية تنتهي بعرض المكوّن الجذري:

```rust tabs
// src/lib.rs; nsh.json: { "rust": ".", "root": "App" }
mod screens;

use nsh_core::prelude::*;

/// What a TSX entry may import from the crate.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>().assets(assets!());
}

#[component]
pub fn App() -> impl IntoElement {
    screens::home()
}
```

```tsx tabs
// App.tsx
import { mount } from "nsh";
import { Home } from "./components/Home";

function App() {
  return <Home />;
}

mount(App);
```

يركّب `nsh run` و`nsh package` جذر Rust على كل منصة، دون QuickJS. في TSX يعرض `mount(component, props?)` المكوّن على سطح التطبيق ويعيد دالة تزيله مجددًا؛ ويستدعيها التطبيق مرة واحدة. تُنفَّذ الشيفرة الواقعة في المستوى الأعلى من وحدة الدخول عند تحميل الحزمة، قبل أول إطار.

## nsh.json

يوجد `nsh.json` في جذر التطبيق. يكتب `nsh init` المفاتيح `name` و`id` و`version` و`build`، وفي تطبيق Rust يكتب أيضًا الحزمة ومكوّنها الجذري:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "rust": ".",
  "root": "App",
  "theme": "theme.json"
}
```

كل مفتاح آخر اختياري؛ ويجوز لتطبيق TSX أن يستغني عن المفاتيح الأربعة أيضًا. قد يبدو `nsh.json` لتطبيق TSX هكذا:

```json
{
  "name": "Gallery",
  "id": "com.example.gallery",
  "version": "1.0.0",
  "build": 1,
  "icon": "icon.png",
  "tailwind": {
    "colors": { "brand": { "500": "#7c3aed", "600": "#6d28d9" } },
    "radius": { "card": 14 }
  },
  "capabilities": {
    "network": { "hosts": ["api.example.com", "*.cdn.example.com"] }
  }
}
```

| المفتاح | النوع | يستخدمه | الوصف |
|---|---|---|---|
| `name` | سلسلة نصية | `package` | الاسم المعروض تحت أيقونة التطبيق. الافتراضي: اسم مجلد الدخول. |
| `id` | سلسلة نصية | `package`، `publish`، `Storage` | معرّف الحزمة (bundle identifier) / معرّف التطبيق بصيغة النطاق المعكوس، مثل `com.yourcompany.app`؛ مطلوب لـ `package` و`publish`. يستخدم `nsh run` القيمة `com.example.<name>` عند غيابه. |
| `version` | سلسلة نصية | `package`، `publish` | إصدار التطبيق الظاهر للمستخدم، مثل `1.2.0` (`CFBundleShortVersionString`، وفي Android `versionName`). |
| `build` | رقم | `package`، `publish` | رقم البناء (`CFBundleVersion`، وفي Android `versionCode`). تشترط الحزم الموقّعة أن يزداد مع كل إصدار. |
| `minRuntime` | سلسلة نصية | `publish` | أدنى إصدار من بيئة تشغيل NSH يشغّل الحزمة الموقّعة، مثل `0.2.0`. الافتراضي: إصدار CLI ([الحزم الموقّعة](./signed-packages.md#which-runtimes-run-a-package)). |
| `icon` | سلسلة نصية | `package` | صورة PNG مربعة، ويُفضَّل أن تكون بحجم 1024×1024، نسبةً إلى `nsh.json`. |
| `tailwind` | كائن | كل بناء | يوسّع سمة Tailwind التي تُحلّ سلاسل `class` الخاصة بك بالاعتماد عليها ([Tailwind](./tailwind.md#theme)). |
| `appearance` | سلسلة نصية | كل بناء، `package` | `"light"` أو `"dark"` أو `"system"` (الافتراضي): التطبيق الذي يكون فاتحًا دائمًا أو داكنًا دائمًا يصرّح بذلك هنا. تتبعه فئات `colorScheme()` و`dark:` وسمة المكوّنات وعناصر التحكم في المنصة منذ البداية ([الجهاز والبيئة](./device-and-environment.md#dark-mode)). |
| `theme` | سلسلة نصية أو كائن | كل بناء | رموز تصميم التطبيق (`cssVars` في shadcn/ui، فوق سمة `neutral` الافتراضية)، التي ترسم بها فئات الرموز و`token()` ومكوّنات Rust: مسار ملف السمة نسبةً إلى `nsh.json`، أو السمة مضمّنة ([البناء باستخدام Rust](./rust.md#theme)، [رموز السمة](./tailwind.md#theme-tokens)). |
| `statusBar` | كائن | كل بناء، `package` | الإعداد الافتراضي لشريط الحالة تحت كل صفحة وحوار (iOS وAndroid): `{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`، وكلاهما اختياري. تعرضه تطبيقات iOS المُحزَّمة منذ شاشة الإطلاق ([شريط الحالة](../modules/nsh-base.md#status-bar)). |
| `capabilities` | كائن | كل بناء | ما يجوز للتطبيق الوصول إليه خارج VM الخاصة به: مضيفو الشبكة، ومضيفو web view، وشريط الحالة ([الصندوق الرملي والقدرات](./sandbox-and-capabilities.md)). |
| `resolve` | كائن | كل بناء | كيفية حلّ الاستيرادات المجرّدة: شروط التصدير لحزم npm والأسماء المستعارة ([حزم npm](#npm-packages)). |
| `rust` | سلسلة نصية أو string[] | كل أمر | حزمة Rust الخاصة بالتطبيق، أو قائمة بها، نسبةً إلى `nsh.json`: مكوّناتها ووحداتها، التي يستوردها TSX عبر معرّف `#[native_module]` لكل حزمة ([البناء باستخدام Rust](./rust.md#several-crates)). |
| `web` | كائن | `package` | ما تضيفه حزمة الويب إلى صفحتها. `web.host`: وحدة JS نسبةً إلى `nsh.json` تصدّر `createHost(player)`، وتجيب عن استدعاءات [`host`](../modules/nsh.md#host) الخاصة بالتطبيق؛ `web.connect`: المضيفون الذين تصل إليهم طلبات تلك الوحدة نفسها، بصيغة أنماط `capabilities.network.hosts`، وتسمح بها Content-Security-Policy الخاصة بالصفحة ([الويب](./web.md#the-hosts-functions)). |
| `root` | سلسلة نصية | `run`، `package` | المكوّن الجذري لتطبيق Rust، ومساره في حزمة `rust`، وهو الأول في القائمة (`App`، `shell::Gallery`): يركّبه `nsh run` و`nsh package` لمجلد التطبيق دون QuickJS، على كل منصة؛ أما `nsh run App.tsx` فما زال يشغّل وحدة دخول TSX ([البناء باستخدام Rust](./rust.md)). |

تتجاوز خيارات `nsh package` و`nsh publish` (`--name`، `--id`، `--app-version`، `--build`، `--icon`، `--min-runtime`) قيم الملف ([CLI](./cli.md)).

يُتحقَّق من `tailwind` و`theme` و`appearance` و`statusBar` و`capabilities` و`resolve` عند بناء التطبيق. الخطأ الإملائي يُعدّ خطأ بناء، لا إعدادًا لا يفعل شيئًا بصمت:

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

عند غياب المفتاح `capabilities`، يجوز للتطبيق استخدام الشبكة وweb views وشريط الحالة بحرية: فالتطبيق المستقل ملك مطوّره. أما مع وجود المفتاح، فكل ما لم يُدرَج يُرفض، في أثناء التطوير وفي التطبيقات المُحزَّمة على حد سواء:

```json
"capabilities": {
  "network": {
    "hosts": ["api.example.com", "*.cdn.example.com"],
    "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }]
  },
  "webview": { "hosts": ["*.example.com"] },
  "statusBar": true
}
```

يشمل `network` كلًّا من `fetch` والصور البعيدة ومصادر الفيديو؛ أما الأصول المحلية فمسموح بها دائمًا. وقد يمنح التطبيق الذي يضمّن NSH أقل مما يصرّح به التطبيق. التفاصيل في [الصندوق الرملي والقدرات](./sandbox-and-capabilities.md).

<a id="tsconfigjson-and-nshtypes"></a>

## tsconfig.json و .nsh/types

لا يحتاج NSH إلى `node_modules`. بدلًا من ذلك، يكتب كل أمر يبني التطبيق (`init`، `build`، `test`، `dev`، `run`، `package`، `publish`، `check`) تصريحات TypeScript لكل ما يوفّره NSH في `.nsh/types`، وإعدادات TypeScript الخاصة بـ NSH في `.nsh/tsconfig.json`. ويمتدّ `tsconfig.json` الخاص بالتطبيق منها:

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

يوجّه `.nsh/tsconfig.json` استيرادات `nsh` وحزم تطبيقك إلى `.nsh/types`، ويضمّ تصريحات المتغيرات العامة والأصول والرموز، ويضبط خيارات المترجم التي تستخدمها تطبيقات NSH (`lib`، `jsx`، `strict`، ...). يُبقيه NSH محدَّثًا: فحين يضيف إصدار جديد مكتبة أو مسارًا، يجده تطبيقك مع البناء التالي، ويبقى `tsconfig.json` كما كتبته. والخيارات التي تضيفها إلى `tsconfig.json` تسري فوق خيارات NSH.

| الملف في `.nsh/types/nsh/` | يصرّح بـ |
|---|---|
| `index.d.ts` | `nsh`: `signal`، `computed`، `effect`، `mount`، `View`، `Text`، ... ويعيد تصدير الأنواع أدناه |
| `types.d.ts` | الأنماط (`ViewStyle`، `TextStyle`، ...)، وخصائص كل عنصر وأحداثه، والمراجع (`ViewRef`، `InputRef`، ...: ما يتلقاه `ref`) |
| `jsx-runtime.d.ts` | بيئة تشغيل JSX التي يحلّها TypeScript عبر `jsxImportSource` (فضاء الأسماء `JSX`) |
| `globals.d.ts` | `If` و`Each`؛ `console`، والمؤقّتات، و`requestAnimationFrame`، و`fetch` و[الواجهات العامة](../modules/globals.md) الأخرى |
| `assets.d.ts` | ما يعطيه استيراد صورة أو خط |
| `tokens.d.ts` | `Tokens`: رموز تصميم التطبيق، من `"theme"`، التي تحدّد أنواع [`token()`](../modules/nsh.md#token) |
| `mobile.d.ts`، `desktop.d.ts` | ملف واحد لكل وحدة (`nsh/mobile`، `nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` هو `ES2023` دون `DOM`: فلا يوجد `document` ولا `window`. تُعاد كتابة الملفات في `.nsh` (فقط عند تغيّر محتواها)، فلا تحرّرها ولا تُودِعها في المستودع؛ فـ `.gitignore` يستثني `.nsh/` أصلًا. إذا أظهر محرّرك `nsh` مفقودًا بعد استنساخ مشروع، فنفّذ أي أمر بناء مرة واحدة، مثل `nsh check`.

يضيف `.nsh/tsconfig.json` الملف `"ESNext.Disposable"`، الذي يصرّح بتصريحات `using` وبـ `Symbol.dispose`، وهو ما تملكه بيئة التشغيل: يحرّر `using account = new Account()` قيمة [صنف Rust](./rust.md) في نهاية الكتلة. أما `jsxImportSource: "nsh"` و`jsx: "preserve"` فيهمّان المحرّر وحده: يترجم NSH صيغة JSX بمترجمه الخاص، مهما قال `tsconfig.json`. يفحص محرّرك أو `nsh check` شيفرة TypeScript؛ أما الأوامر الأخرى فتجرّد الأنواع دون فحصها.

التطبيق الذي أنشأه `nsh init` أقدم يحصل على `tsconfig.json` الجديد مع بنائه التالي إذا كان ملفه الخاص هو قالب NSH دون تعديل؛ ويطبع NSH سطرًا يخبرك بذلك. أما `tsconfig.json` الذي غيّرته فهو ملكك: ينبّهك `nsh check` إذا لم يكن يمتدّ من `./.nsh/tsconfig.json`، وعليك حينها إضافة سطر `extends` وإزالة الخيارات التي يضبطها.

<a id="modules"></a>

## الوحدات

شيفرة تطبيق Rust هي وحدات حزمته (`mod screens;`)، وتأتي اعتماداته من crates.io كأي حزمة؛ وحزم NSH نفسها هي `nsh-core` (العناصر الأساسية والإشارات والأنماط المكتوبة، `use nsh_core::prelude::*`) و`nsh-base` (المكوّنات الأساسية والسمة).

في TSX، قسّم التطبيق إلى ما تشاء من وحدات `.ts` و`.tsx` واستوردها بمسارات نسبية؛ ويجوز حذف الامتداد:

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

تُجمَّع كلها في سكربت واحد. وتُستورد ملفات JSON بقيمتها بعد التحليل.

<a id="loading-code-on-demand"></a>

### تحميل الشيفرة عند الطلب

يعيد `import()` لإحدى وحدات التطبيق وعدًا (promise) بصادراتها، كما في المتصفح:

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

تشحن التطبيقات على الأجهزة حزمة واحدة، فتكون الوحدة موجودة أصلًا ويتحقق الوعد فورًا. أما تطبيق الويب المنشور مجزَّأً (`nsh build --split`) فيحصل على الوحدة، وعلى ما تستخدمه وحدها، في ملف منفصل يُنزَّل أول مرة يطلبه `import()` ([الويب](./web.md#split-bundles)). ويجب أن يكون المعرّف مسارًا نسبيًا حرفيًا: فعلى أداة التجميع أن ترى أي وحدة هي المقصودة.

<a id="nshs-modules"></a>

### وحدات NSH

لا تُجمَّع الاستيرادات من `nsh` و`nsh/...`: توفّرها بيئة التشغيل بشكل أصلي.

| الوحدة | ما تحتويه |
|---|---|
| `nsh` | التفاعلية (`signal`، `computed`، `effect`، ...)، `mount`، `split`، `context`؛ العناصر الأساسية `View` و`Text` و`Scroll` و`Image` و`List` و`Canvas` و`WebView` و`Video` (`selectable` في `View` لتحديد النص)؛ هوامش المنطقة الآمنة (`safeArea`، `safeAreaInsets`) ولوحة المفاتيح البرمجية (`Keyboard`، `keyboardFrame`)؛ الحركات الأصلية؛ `PanResponder`؛ البيئة (`platform`، `windowSize`، `colorScheme`، `fontScale`، `pixelRatio`، `locale`)؛ حالة قارئ الشاشة وتقليل الحركة، والإعلانات؛ الحافظة، ومنتقي الصور، والتخزين، وقناة المضيف، واختصارات لوحة المفاتيح؛ المكوّنات والدوال التي يسجّلها التطبيق المضمِّن ([المرجع](../modules/nsh.md)) |
| `nsh/base` | الأساس غير المنسّق لواجهة التطبيق: مكدسات التنقل وصفحاتها (`NavStack`، `NavPage`، `createNavStack`)، والحوارات (`Dialog`)، وهدف الضغط (`Button`)، وحقل إدخال النص (`Input`) وحوار التنبيه الخاص بالنظام (`AlertDialog`)؛ وتضبط الصفحات والحوارات شريط الحالة (`statusBar`) ([المرجع](../modules/nsh-base.md)) |
| `nsh/mobile` | ما تملكه iOS وAndroid: `TabBar`، `InputAccessoryView` (iOS)، `BackHandler` (Android) ([المرجع](../modules/nsh-mobile.md)) |
| `nsh/desktop` | ما تملكه macOS وWindows وLinux: `Window`، `titleBar`، `Menu` ([المرجع](../modules/nsh-desktop.md)) |

يوثّق [مرجع الوحدات](../modules/index.md) كل وحدة منها. استيراد وحدة لا يملكها NSH (`nsh/foo`) هو خطأ بناء. وكذلك استخدام شيفرتك اسمًا لا تصدّره الوحدة (`import { Buton } from "nsh/base"`): يشير الخطأ إلى الاستيراد ويسمّي أقرب صادر (``did you mean `Button`?``). أما الأسماء المستخدمة أنواعًا فقط فيفحصها `nsh check`.

<a id="npm-packages"></a>

### حزم npm

لا يحتاج NSH إلى شيء من npm، لكن أداة التجميع تحلّ الاستيرادات المجرّدة من مجلد `node_modules` إذا ثبّتَّ حزمًا بمدير حزم. تُحلّ الحزم إلى إصداراتها المخصصة للمتصفح، لأن بيئة التشغيل توفّر واجهات الويب (`fetch`، والتدفقات، و`URL`، و`TextEncoder`، ...) لا واجهات Node (`fs`، `Buffer`، `process`). والحزم التي تلمس DOM لا تعمل: فلا وجود له.

كثيرًا ما يكون للحزمة التي يستخدم إصدارها للمتصفح DOM إصدار آخر للـ workers أو React Native. يختار `resolve.conditions` شروط التصدير التي تُحلّ بها الحزم، بدلًا من `["browser"]` الافتراضي: تسري `import` و`require` و`module` و`default` دائمًا، ومع غياب `browser` تُحلّ الحزم عبر حقلَي `module` و`main`. ويستبدل `resolve.alias` استيرادًا بآخر: بمسار نسبةً إلى `nsh.json` (`./` أو `../`)، أو بحزمة أخرى، أو بـ `false` لوحدة فارغة. ويحدّد TypeScript (`nsh check`، والمحرّرات) نوع الاستيراد كما كُتب: فالاسم الذي ليس حزمة مثبّتة تأتي أنواعه من ملف `.d.ts` في التطبيق.

```json
"resolve": {
  "conditions": ["worker"],
  "alias": { "dom-only-helper": "./shims/helper.ts", "node-polyfill": false }
}
```

```ts
// shims/aliases.d.ts
declare module "node-polyfill";
```

لا يمكن استيراد `solid-js`: ترفضه أداة التجميع وتشير إلى `nsh` و`signal` و`computed` و`effect` الخاصة بـ NSH، وهي التي تحلّ محله.

<a id="assets"></a>

## الأصول

تُشحن الصور والخطوط مع التطبيق. تقرأ حزمة Rust كل ملف في مجلد `assets/` الخاص بها وقت الترجمة بواسطة `asset!`، وتشحنها جميعًا بواسطة `registry.assets(assets!())` في دالتها `#[native_module]`؛ أما TSX فيستوردها كما تُستورد الوحدات، وتسجّل أداة التجميع كل ملف مستورد (ومعه متغيرات كثافة البكسل للصورة). ينسخها `nsh build` إلى `.nsh/out/assets/`، ويضعها `nsh package` في التطبيق، وتُقدَّم إلى التطبيق في أثناء التطوير.

```rust tabs
use nsh_core::element::{FontAsset, ImageAsset, asset};

const LOGO: ImageAsset = asset!("logo@2x.png");      // its url, and its size: 64×64 points
const INTER: FontAsset = asset!("Inter.ttf");        // its uri, and its family: "Inter"

image(LOGO)
text("Hello").font_family(INTER.family)
```

```tsx tabs
import { Image, Text } from "nsh";
import logo from "./assets/logo@2x.png";   // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
import Inter from "./assets/Inter.ttf";     // "Inter"

<Image src={logo} />
<Text style={{ fontFamily: Inter }}>Hello</Text>
```

| الامتداد | ما يعطيه الاستيراد |
|---|---|
| `.png`، `.jpg`، `.jpeg`، `.gif`، `.webp`، `.heic` | `ImageAsset`: `{ url, size, scales? }`، بحجم مقاس بالنقاط. يقسم اللاحق `@2x` / `@3x` حجم البكسل على 2 / 3. والملف دون لاحق يشحن أيضًا نظيراته من `@1.5x` إلى `@4x`، المسرودة في `scales`، ويُحمَّل المتغير الملائم للشاشة ([كثافات البكسل](./images-and-assets.md#pixel-densities)). |
| `.svg` | `ImageAsset` بحجم مقاس بالنقاط بحسب `width` و`height` في ملف SVG (أو `viewBox`). |
| `.ttf`، `.otf`، `.woff`، `.woff2` | اسم عائلة الخط، سلسلة نصية. يُسجَّل الخط قبل أول إطار. |
| `.json` | JSON بعد التحليل |

انظر [الصور والأصول](./images-and-assets.md) و[الخطوط](./fonts.md).
<a id="generated-directories"></a>

## الدلائل المُولَّدة

- **`.nsh/`**: كل ما يولّده NSH: تعريفات الأنواع (`.nsh/types`)، ومصادر المشغّلات الخاصة بتطبيق Rust (`.nsh/rust`)، وما يثبّته `nsh run` على المحاكيات والأجهزة (تطبيق المضيف الخاص بـ Catalyst، وحزمة APK الخاصة بالتطوير على Android)، و`.nsh/out`، وهو المخرج الافتراضي لـ `nsh build` (`bundle.js`، `bundle.js.map`، `bundle.nshc`، `capabilities.json`، `assets/`؛ أما في تطبيق Rust فـ `app.json` و`assets/`) ولـ `nsh package` (`.app`، `.ipa`، `.apk`، وموقع)؛ أما `-o` فيكتب في مكان آخر. يمكن حذفه بأمان؛ إذ تُعاد إنشاؤه.
- **`target/`**: دليل البناء الخاص بـ Cargo لحزم التطبيق (crates) ومشغّلاته (أو `CARGO_TARGET_DIR`).
