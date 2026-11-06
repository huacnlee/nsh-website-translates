---
title: "प्रोजेक्ट संरचना"
description: "Rust या TSX में बनाए गए NSH ऐप की फ़ाइलें, nsh.json की हर key, .nsh/types में TypeScript सेटअप, assets, और modules तथा packages को import करने का तरीका।"
order: 5
group: start
source_hash: 67da39e1182fc05c
---

# प्रोजेक्ट की संरचना

NSH ऐप एक डायरेक्टरी होती है, जिसमें `nsh.json` और उसका कोड होता है: एक Rust crate, जिसके रूट कंपोनेंट को `nsh.json` नाम देता है, या एक TSX एंट्री मॉड्यूल, या दोनों। बाकी सब कुछ (अन्य मॉड्यूल, इमेज, फ़ॉन्ट, JSON फ़ाइलें) वहीं से खोजा जाता है: crate के मॉड्यूल और उसकी `assets/` डायरेक्टरी, या TSX एंट्री जिन फ़ाइलों को import करती है। इसलिए फ़ाइलों की कोई सूची बनाए रखनी नहीं पड़ती।

Rust में लिखा ऐप एक Cargo प्रोजेक्ट होता है:

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

TSX ऐप एक एंट्री और उसके import किए मॉड्यूल होते हैं:

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

जिस ऐप में दोनों हों, वह अपने crates को `"rust"` में सूचीबद्ध करता है और उसकी TSX एंट्री उन्हें import करती है ([Rust के साथ बनाना](./rust.md#extending-a-rust-app-with-tsx))।

हर कमांड अपने आर्गुमेंट के रूप में ऐप की डायरेक्टरी या उसकी एंट्री लेती है (`nsh run my-app`, `nsh run my-app/App.tsx`)। `nsh.json` और एंट्री की डायरेक्टरी ऐप का रूट है: `nsh.json` वहीं से पढ़ा जाता है, एसेट के पाथ उसके सापेक्ष होते हैं, और `.nsh/` वहीं लिखा जाता है। Rust ऐप (`nsh.json` `"root"`) में डायरेक्टरी रूट कंपोनेंट को चलाती है; TSX एंट्री का नाम देने पर वह चलती है।

<a id="the-root-component"></a>

## रूट कंपोनेंट

Rust ऐप का रूट उसके crate का एक कंपोनेंट होता है, जिसे `nsh.json` का `"root"` crate में उसके पाथ से नाम देता है (`App`, `shell::Gallery`)। TSX एंट्री एक सामान्य मॉड्यूल होती है जो रूट कंपोनेंट को render करके समाप्त होती है:

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

`nsh run` और `nsh package` हर प्लेटफ़ॉर्म पर, QuickJS के बिना, Rust रूट को mount करते हैं। TSX में `mount(component, props?)` कंपोनेंट को ऐप की सरफ़ेस में render करता है और एक फ़ंक्शन लौटाता है जो उसे फिर से हटा देता है; ऐप इसे एक बार ही कॉल करता है। एंट्री के टॉप लेवल का कोड बंडल लोड होने पर, पहले फ़्रेम से पहले चलता है।

## nsh.json

`nsh.json` ऐप के रूट में रहता है। `nsh init` `name`, `id`, `version` और `build` लिखता है, और Rust ऐप के लिए crate और उसका रूट कंपोनेंट भी:

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

बाकी हर कुंजी वैकल्पिक है; TSX ऐप इन चारों को भी छोड़ सकता है। TSX ऐप का `nsh.json` कुछ इस तरह हो सकता है:

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

| कुंजी | टाइप | कौन उपयोग करता है | विवरण |
|---|---|---|---|
| `name` | string | `package` | ऐप आइकन के नीचे दिखने वाला नाम। डिफ़ॉल्ट: एंट्री डायरेक्टरी का नाम। |
| `id` | string | `package`, `publish`, `Storage` | reverse-DNS रूप में बंडल आइडेंटिफ़ायर / एप्लिकेशन आईडी, जैसे `com.yourcompany.app`; `package` और `publish` के लिए ज़रूरी। इसके बिना `nsh run` `com.example.<name>` का उपयोग करता है। |
| `version` | string | `package`, `publish` | उपयोगकर्ता को दिखने वाला वर्शन, जैसे `1.2.0` (`CFBundleShortVersionString`, Android `versionName`)। |
| `build` | number | `package`, `publish` | बिल्ड नंबर (`CFBundleVersion`, Android `versionCode`)। साइन किए गए पैकेज के लिए ज़रूरी है कि यह हर रिलीज़ के साथ बढ़े। |
| `minRuntime` | string | `publish` | सबसे पुराना NSH रनटाइम जो साइन किए गए पैकेज को चला सकता है, जैसे `0.2.0`। डिफ़ॉल्ट: CLI का वर्शन ([साइन किए गए पैकेज](./signed-packages.md#which-runtimes-run-a-package))। |
| `icon` | string | `package` | एक वर्गाकार PNG, आदर्श रूप से 1024×1024, `nsh.json` के सापेक्ष। |
| `tailwind` | object | हर बिल्ड | आपके `class` स्ट्रिंग जिस Tailwind थीम के विरुद्ध resolve होते हैं, उसका विस्तार करता है ([Tailwind](./tailwind.md#theme))। |
| `appearance` | string | हर बिल्ड, `package` | `"light"`, `"dark"` या `"system"` (डिफ़ॉल्ट): जो ऐप हमेशा लाइट या डार्क रहता है, वह यहाँ यह बताता है। `colorScheme()`, `dark:` क्लासेज़, कंपोनेंट की थीम और प्लेटफ़ॉर्म के कंट्रोल शुरू से इसका पालन करते हैं ([डिवाइस और एनवायरनमेंट](./device-and-environment.md#dark-mode))। |
| `theme` | string या object | हर बिल्ड | ऐप के डिज़ाइन टोकन (shadcn/ui का `cssVars`, डिफ़ॉल्ट `neutral` थीम के ऊपर), जिनसे टोकन क्लासेज़, `token()` और Rust कंपोनेंट ड्रॉ करते हैं: `nsh.json` के सापेक्ष थीम फ़ाइल का पाथ, या इनलाइन थीम ([Rust के साथ बनाना](./rust.md#theme), [थीम टोकन](./tailwind.md#theme-tokens))। |
| `statusBar` | object | हर बिल्ड, `package` | हर पेज और डायलॉग के नीचे स्टेटस बार का डिफ़ॉल्ट (iOS और Android): `{ "foreground": "auto" \| "light" \| "dark", "hidden": boolean }`, दोनों वैकल्पिक। पैकेज किए गए iOS ऐप इसे लॉन्च स्क्रीन से ही दिखाते हैं ([स्टेटस बार](../modules/nsh-base.md#status-bar))। |
| `capabilities` | object | हर बिल्ड | ऐप अपने VM के बाहर क्या एक्सेस कर सकता है: नेटवर्क होस्ट, वेब व्यू होस्ट, स्टेटस बार ([सैंडबॉक्स और capabilities](./sandbox-and-capabilities.md))। |
| `resolve` | object | हर बिल्ड | bare imports कैसे resolve होते हैं: npm पैकेजों की export conditions और aliases ([npm पैकेज](#npm-packages))। |
| `rust` | string या string[] | हर कमांड | ऐप का Rust crate, या उनकी सूची, `nsh.json` के सापेक्ष: उनके कंपोनेंट और मॉड्यूल, जिन्हें TSX हर crate के `#[native_module]` specifier से import करता है ([Rust के साथ बनाना](./rust.md#several-crates))। |
| `web` | object | `package` | वेब पैकेज अपने पेज में क्या जोड़ता है। `web.host`: `nsh.json` के सापेक्ष एक JS मॉड्यूल जो `createHost(player)` export करता है, जो ऐप के [`host`](../modules/nsh.md#host) कॉल का जवाब देता है; `web.connect`: वे होस्ट जिन तक उस मॉड्यूल के अपने अनुरोध पहुँचते हैं, `capabilities.network.hosts` के पैटर्न के रूप में, जिन्हें पेज की Content-Security-Policy अनुमति देती है ([Web](./web.md#the-hosts-functions))। |
| `root` | string | `run`, `package` | Rust ऐप का रूट कंपोनेंट, `rust` crate में उसका पाथ, सूची में से पहला (`App`, `shell::Gallery`): ऐप की डायरेक्टरी के `nsh run` और `nsh package` इसे हर प्लेटफ़ॉर्म पर QuickJS के बिना mount करते हैं; `nsh run App.tsx` फिर भी TSX एंट्री चलाता है ([Rust के साथ बनाना](./rust.md))। |

`nsh package` और `nsh publish` के फ़्लैग (`--name`, `--id`, `--app-version`, `--build`, `--icon`, `--min-runtime`) फ़ाइल के मानों को ओवरराइड करते हैं ([CLI](./cli.md))।

`tailwind`, `theme`, `appearance`, `statusBar`, `capabilities` और `resolve` की जाँच ऐप बनाते समय होती है। टाइपो एक बिल्ड एरर होता है, ऐसी सेटिंग नहीं जो चुपचाप कुछ न करे:

```text
error building App.tsx failed
nsh.json: tailwind: unknown theme key `colours`
```


### capabilities

`capabilities` कुंजी के बिना, ऐप नेटवर्क, वेब व्यू और स्टेटस बार का स्वतंत्र रूप से उपयोग कर सकता है: स्टैंडअलोन ऐप उसके डेवलपर का अपना होता है। कुंजी होने पर, जो कुछ सूचीबद्ध नहीं है वह डिनाई हो जाता है, डेवलपमेंट में भी और पैकेज किए गए ऐप में भी:

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

`network` में `fetch`, रिमोट इमेज और वीडियो सोर्स आते हैं; लोकल एसेट हमेशा अनुमत हैं। NSH को एम्बेड करने वाला ऐप, ऐप के घोषित किए से कम अनुमति दे सकता है। विवरण [सैंडबॉक्स और capabilities](./sandbox-and-capabilities.md) में हैं।

<a id="tsconfigjson-and-nshtypes"></a>

## tsconfig.json और .nsh/types

NSH को `node_modules` की ज़रूरत नहीं होती। इसके बजाय, ऐप बनाने वाली हर कमांड (`init`, `build`, `test`, `dev`, `run`, `package`, `publish`, `check`) NSH द्वारा दी जाने वाली हर चीज़ की TypeScript declarations `.nsh/types` में लिखती है, और NSH की TypeScript सेटिंग्स `.nsh/tsconfig.json` में। ऐप का `tsconfig.json` उन्हें extend करता है:

```json
{
  "extends": "./.nsh/tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

`.nsh/tsconfig.json` `nsh` imports और आपके ऐप के crates को `.nsh/types` की ओर इंगित करता है, ग्लोबल्स, एसेट और टोकन declarations को शामिल करता है, और वे कंपाइलर विकल्प सेट करता है जो NSH ऐप इस्तेमाल करते हैं (`lib`, `jsx`, `strict`, ...)। NSH इसे अद्यतन रखता है: जब कोई नया वर्शन कोई लाइब्रेरी या पाथ जोड़ता है, तो अगले बिल्ड के साथ वह आपके ऐप में आ जाता है, और आपका `tsconfig.json` वैसा ही रहता है जैसा आपने लिखा था। `tsconfig.json` में आप जो विकल्प जोड़ते हैं वे NSH के विकल्पों के ऊपर लागू होते हैं।

| `.nsh/types/nsh/` में फ़ाइल | क्या declare करती है |
|---|---|
| `index.d.ts` | `nsh`: `signal`, `computed`, `effect`, `mount`, `View`, `Text`, ... और नीचे के टाइप फिर से export करती है |
| `types.d.ts` | स्टाइल (`ViewStyle`, `TextStyle`, ...), हर एलिमेंट के props और इवेंट, refs (`ViewRef`, `InputRef`, ...: जो `ref` को मिलता है) |
| `jsx-runtime.d.ts` | JSX रनटाइम जिसे TypeScript `jsxImportSource` के ज़रिए resolve करता है (`JSX` namespace) |
| `globals.d.ts` | `If` और `Each`; `console`, टाइमर, `requestAnimationFrame`, `fetch` और अन्य [ग्लोबल API](../modules/globals.md) |
| `assets.d.ts` | इमेज या फ़ॉन्ट import करने पर क्या मिलता है |
| `tokens.d.ts` | `Tokens`: ऐप के डिज़ाइन टोकन, उसके `"theme"` से, जो [`token()`](../modules/nsh.md#token) को टाइप करते हैं |
| `mobile.d.ts`, `desktop.d.ts` | हर मॉड्यूल के लिए एक फ़ाइल (`nsh/mobile`, `nsh/desktop`) |
| `base.d.ts` | `nsh/base` |

`lib` बिना `DOM` के `ES2023` है: इसमें कोई `document` या `window` नहीं है। `.nsh` की फ़ाइलें फिर से जनरेट होती हैं (केवल तब जब उनकी सामग्री बदले), इसलिए उन्हें एडिट न करें और commit न करें; `.gitignore` पहले से `.nsh/` को बाहर रखता है। यदि प्रोजेक्ट क्लोन करने के बाद आपका एडिटर `nsh` को missing दिखाए, तो कोई भी बिल्ड कमांड एक बार चलाएँ, जैसे `nsh check`।

`.nsh/tsconfig.json` `"ESNext.Disposable"` जोड़ता है, जो `using` declarations और `Symbol.dispose` को declare करता है, जो रनटाइम में मौजूद हैं: `using account = new Account()` ब्लॉक के अंत में [Rust क्लास](./rust.md) के मान को मुक्त करता है। इसके `jsxImportSource: "nsh"` और `jsx: "preserve"` केवल एडिटर के लिए मायने रखते हैं: NSH JSX को अपने कंपाइलर से कंपाइल करता है, `tsconfig.json` में जो भी लिखा हो। TypeScript की जाँच आपका एडिटर या `nsh check` करता है; बाकी कमांड टाइप हटा देती हैं, उनकी जाँच नहीं करतीं।

किसी पुराने `nsh init` से बना ऐप अपने अगले बिल्ड के साथ नया `tsconfig.json` पा लेता है, यदि उसका अपना NSH का टेम्पलेट हो, बिना बदला हुआ; NSH ऐसा होने की सूचना देने वाली एक पंक्ति प्रिंट करता है। आपने जो `tsconfig.json` बदला है वह आपका है: जब वह `./.nsh/tsconfig.json` को extend नहीं करता तो `nsh check` इसकी ओर संकेत करता है, और आप `extends` पंक्ति जोड़ते हैं और वे विकल्प हटाते हैं जो वह सेट करता है।

<a id="modules"></a>

## मॉड्यूल

Rust ऐप का कोड उसके crate के मॉड्यूल (`mod screens;`) होते हैं, और उसकी dependencies किसी भी crate की तरह crates.io से आती हैं; NSH के अपने crates `nsh-core` (primitives, signals और typed styles, `use nsh_core::prelude::*`) और `nsh-base` (बेस कंपोनेंट और थीम) हैं।

TSX में, ऐप को जितने चाहें उतने `.ts` और `.tsx` मॉड्यूल में बाँटें और उन्हें relative paths से import करें; एक्सटेंशन छोड़ा जा सकता है:

```tsx
import { Header } from "./components/Header";
import { formatPrice } from "./lib/format";
import strings from "./strings.json";
```

सभी एक ही स्क्रिप्ट में बंडल होते हैं। JSON फ़ाइलें अपने parsed मान के रूप में import होती हैं।

<a id="loading-code-on-demand"></a>

### कोड को ज़रूरत पर लोड करना

ऐप के किसी मॉड्यूल का `import()` उसके exports का promise लौटाता है, जैसा ब्राउज़र में होता है:

```tsx
const open = async () => {
  const { Settings } = await import("./screens/Settings");
  screen.set(() => Settings);
};
```

डिवाइस पर ऐप एक ही बंडल के साथ आते हैं, इसलिए मॉड्यूल पहले से वहीं होता है और promise तुरंत resolve हो जाता है। विभाजित रूप में प्रकाशित वेब ऐप (`nsh build --split`) को मॉड्यूल, और जो केवल वही उपयोग करता है, एक अलग फ़ाइल के रूप में मिलता है, जो पहली बार `import()` के माँगने पर डाउनलोड होती है ([Web](./web.md#split-bundles))। Specifier एक literal relative path होना चाहिए: बंडलर को दिखना चाहिए कि कौन सा मॉड्यूल अभिप्रेत है।

<a id="nshs-modules"></a>

### NSH के मॉड्यूल

`nsh` और `nsh/...` के imports बंडल नहीं होते: रनटाइम उन्हें नेटिव रूप से प्रदान करता है।

| मॉड्यूल | उसमें क्या है |
|---|---|
| `nsh` | रिएक्टिविटी (`signal`, `computed`, `effect`, ...), `mount`, `split`, `context`; primitives `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` (टेक्स्ट सिलेक्शन के लिए `View` का `selectable`); सेफ़ एरिया इनसेट (`safeArea`, `safeAreaInsets`) और सॉफ़्टवेयर कीबोर्ड (`Keyboard`, `keyboardFrame`); नेटिव एनिमेशन; `PanResponder`; एनवायरनमेंट (`platform`, `windowSize`, `colorScheme`, `fontScale`, `pixelRatio`, `locale`); स्क्रीन रीडर और reduce motion की स्थिति, announcements; क्लिपबोर्ड, फ़ोटो पिकर, स्टोरेज, होस्ट चैनल, कीबोर्ड शॉर्टकट; एम्बेड करने वाले ऐप द्वारा रजिस्टर किए कंपोनेंट और फ़ंक्शन ([रेफ़रेंस](../modules/nsh.md)) |
| `nsh/base` | ऐप के UI की unstyled बुनियाद: नेविगेशन स्टैक और उनके पेज (`NavStack`, `NavPage`, `createNavStack`), डायलॉग (`Dialog`), एक प्रेस टारगेट (`Button`), एक टेक्स्ट इनपुट (`Input`) और सिस्टम का अलर्ट डायलॉग (`AlertDialog`); पेज और डायलॉग स्टेटस बार सेट करते हैं (`statusBar`) ([रेफ़रेंस](../modules/nsh-base.md)) |
| `nsh/mobile` | जो iOS और Android के पास है: `TabBar`, `InputAccessoryView` (iOS), `BackHandler` (Android) ([रेफ़रेंस](../modules/nsh-mobile.md)) |
| `nsh/desktop` | जो macOS, Windows और Linux के पास है: `Window`, `titleBar`, `Menu` ([रेफ़रेंस](../modules/nsh-desktop.md)) |

[मॉड्यूल रेफ़रेंस](../modules/index.md) हर एक का दस्तावेज़ देता है। ऐसा मॉड्यूल import करना जो NSH के पास नहीं है (`nsh/foo`) बिल्ड एरर है। वैसे ही वह नाम भी, जो आपका कोड इस्तेमाल करता है पर मॉड्यूल export नहीं करता (`import { Buton } from "nsh/base"`): एरर import की ओर इशारा करता है और सबसे नज़दीकी export का नाम बताता है (``did you mean `Button`?``)। जो नाम केवल टाइप के रूप में उपयोग होते हैं, उनकी जाँच `nsh check` करता है।

<a id="npm-packages"></a>

### npm पैकेज

NSH को npm से कुछ नहीं चाहिए, लेकिन यदि आप पैकेज मैनेजर से पैकेज इंस्टॉल करते हैं, तो बंडलर bare imports को `node_modules` डायरेक्टरी से resolve करता है। पैकेज अपने ब्राउज़र बिल्ड resolve करते हैं, क्योंकि रनटाइम वेब API (`fetch`, streams, `URL`, `TextEncoder`, ...) देता है, Node के (`fs`, `Buffer`, `process`) नहीं। जो पैकेज DOM को छूते हैं वे काम नहीं करते: यहाँ DOM है ही नहीं।

जिस पैकेज का ब्राउज़र बिल्ड DOM का उपयोग करता है, उसका अक्सर workers या React Native के लिए दूसरा बिल्ड होता है। `resolve.conditions` वे export conditions चुनता है जिनसे पैकेज resolve होते हैं, डिफ़ॉल्ट `["browser"]` की जगह: `import`, `require`, `module` और `default` हमेशा लागू होते हैं, और `browser` के बिना पैकेज अपने `module` और `main` फ़ील्ड के ज़रिए resolve होते हैं। `resolve.alias` किसी import को बदल देता है: `nsh.json` के सापेक्ष पाथ (`./` या `../`) से, किसी दूसरे पैकेज से, या खाली मॉड्यूल के लिए `false` से। TypeScript (`nsh check`, एडिटर) import को वैसा ही टाइप करता है जैसा लिखा गया है: जो नाम इंस्टॉल किया हुआ पैकेज नहीं है, उसके टाइप ऐप की `.d.ts` फ़ाइल से मिलते हैं।

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

`solid-js` import नहीं किया जा सकता: बंडलर उसे अस्वीकार करता है और `nsh` के अपने `signal`, `computed` और `effect` की ओर इशारा करता है, जो उसकी जगह लेते हैं।

<a id="assets"></a>

## एसेट

इमेज और फ़ॉन्ट ऐप के साथ शिप होते हैं। Rust crate अपनी `assets/` डायरेक्टरी की हर फ़ाइल को कंपाइल समय पर `asset!` से पढ़ता है, और उन सभी को अपने `#[native_module]` फ़ंक्शन में `registry.assets(assets!())` से शिप करता है; TSX उन्हें मॉड्यूल की तरह import करता है, और बंडलर हर import की गई फ़ाइल (और इमेज के pixel-density वेरिएंट) को दर्ज करता है। `nsh build` उन्हें `.nsh/out/assets/` में कॉपी करता है, `nsh package` उन्हें ऐप में रखता है, और डेवलपमेंट के दौरान वे ऐप को सर्व किए जाते हैं।

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

| एक्सटेंशन | Import से क्या मिलता है |
|---|---|
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic` | एक `ImageAsset`: `{ url, size, scales? }`, points में आकार के साथ। `@2x` / `@3x` प्रत्यय pixel आकार को 2 / 3 से भाग देता है। बिना प्रत्यय वाली फ़ाइल अपने `@1.5x`–`@4x` सहोदर भी शिप करती है, जो `scales` में सूचीबद्ध हैं, और स्क्रीन का वेरिएंट लोड होता है ([pixel densities](./images-and-assets.md#pixel-densities))। |
| `.svg` | एक `ImageAsset` जिसका आकार points में SVG के `width` और `height` (या `viewBox`) से तय होता है। |
| `.ttf`, `.otf`, `.woff`, `.woff2` | फ़ॉन्ट का family नाम, एक string। फ़ॉन्ट पहले फ़्रेम से पहले रजिस्टर हो जाता है। |
| `.json` | Parsed JSON |

[इमेज और एसेट](./images-and-assets.md) और [फ़ॉन्ट](./fonts.md) देखें।
<a id="generated-directories"></a>

## जनरेट की गई डायरेक्टरी

- **`.nsh/`**: वह सब कुछ जो NSH जनरेट करता है: टाइप डिक्लेरेशन (`.nsh/types`), Rust ऐप के रनर्स के सोर्स (`.nsh/rust`), वह जो `nsh run` सिमुलेटर और डिवाइस पर इंस्टॉल करता है (Catalyst होस्ट ऐप, Android डेवलपमेंट APK), और `.nsh/out`, जो `nsh build` का डिफ़ॉल्ट आउटपुट है (`bundle.js`, `bundle.js.map`, `bundle.nshc`, `capabilities.json`, `assets/`; Rust ऐप के लिए `app.json` और `assets/`) तथा `nsh package` का (`.app`, `.ipa`, `.apk`, एक साइट); `-o` कहीं और लिखता है। इसे हटाना सुरक्षित है; यह दोबारा बन जाती है।
- **`target/`**: ऐप के क्रेट्स और रनर्स के लिए Cargo की बिल्ड डायरेक्टरी (या `CARGO_TARGET_DIR`)।
