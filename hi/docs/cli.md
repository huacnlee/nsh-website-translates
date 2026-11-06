---
title: "CLI"
description: "NSH के हर सबकमांड और फ़्लैग की जानकारी - init, build, test, check, dev, run, package, और साइनिंग कमांड keygen, certify, publish, verify, symbolicate तथा revoke।"
order: 6
group: start
source_hash: 2fe1bbb5b3e5cfb9
---

# CLI

`nsh` वह टूल है जिससे NSH ऐप Rust या TSX में बनाया जाता है। ऐप बनाने वाला हर subcommand `[ENTRY]` लेता है: ऐप की डायरेक्टरी (डिफ़ॉल्ट: वर्तमान डायरेक्टरी, इसलिए `cd my-app && nsh run` काम करता है), जो Rust ऐप का root component (`nsh.json` `"root"`) या TSX ऐप का `App.tsx`, या कोई TSX entry module चलाती है। यह ऐप के root में `nsh.json` पढ़ता है और `.nsh/types` में type declarations को ताज़ा करता है।

```text
nsh <COMMAND>

  init         Create an app in Rust or TSX
  build        Build an app: describe a Rust app's crates, or bundle a TSX app and compile it to QuickJS bytecode
  test         Run an app's tests headless, and its Rust crates' with cargo test
  check        Type check an app with TypeScript's native compiler, and its Rust crates with cargo check
  dev          Serve an app to dev hosts (simulators, devices) and push rebuilds
  run          Like dev, and also run the app in a development host
  package      Package an installable app from the prebuilt runtime
  keygen       Create a signing key
  certify      Certify a release key with a root key
  publish      Build an app in release mode and sign it into a package (.nshpkg)
  verify       Verify a package
  symbolicate  Map the positions in a reported error stack to the app's sources
  revoke       Sign a revocation list
```

`nsh <command> --help` किसी कमांड के flags दिखाता है; `nsh -V` (`--version`) version और वह Git revision दिखाता है जिससे यह बना था।

<a id="output"></a>

## आउटपुट

हर कमांड प्रत्येक चरण के लिए एक पंक्ति प्रिंट करती है, और विवरण केवल तब दिखाती है जब कुछ विफल हो:

```text
✓ built the Rust crate gallery-native (5.0s)
✓ built App.tsx (500 B js, 809 B bytecode, 21ms)
✓ built the development host for the iOS simulator (12.7s)
• iOS Simulator (iPhone 16 Plus) connected, build 1
warn iOS Simulator: image failed: An SSL error has occurred and a secure connection to the server cannot be made.
✓ rebuilt App.tsx (18ms), 1 device
```

`✓` पूरा हुआ चरण है, `→` बताता है कि कहाँ कनेक्ट करना है, `•` बताता है कि किसी डिवाइस ने क्या किया; `warn` और `error` पंक्तियाँ समस्याएँ हैं, और सामान्य पंक्तियाँ आपके ऐप का अपना आउटपुट हैं (`console.log`)। टर्मिनल पर चल रहे चरण को spinner दिखाता है, और पंक्तियाँ रंगीन होती हैं (जब तक `NO_COLOR` सेट न हो); किसी फ़ाइल में redirect करने पर केवल परिणाम वाली पंक्तियाँ बिना रंगों के लिखी जाती हैं। NSH जो टूल चलाता है (ऐप के Rust crate के लिए cargo, development hosts), उनमें से कोई विफल हो तो उसका आउटपुट `error` पंक्ति के नीचे प्रिंट होता है।

`-v, --verbose` (कोई भी कमांड; `NSH_VERBOSE=1` भी) सब कुछ आते ही प्रिंट करता है: हर log पंक्ति अपने level और source के साथ, cargo का आउटपुट और hosts का अपना आउटपुट।

## nsh init

```sh
nsh init [DIR] [--name <NAME>] [--template <ts|rust|mixed>] [--nsh-source <DIR>]
```

टेम्पलेट से `DIR` में एक ऐप बनाता है (डिफ़ॉल्ट: वर्तमान डायरेक्टरी, न हो तो बनाई जाती है)। `--template` के बिना, टर्मिनल पर `nsh init` पूछता है कि कौन-सा टेम्पलेट चाहिए (Enter दबाने पर `ts` चुना जाता है) और अन्यत्र (स्क्रिप्ट, CI) `ts` लेता है।

| टेम्पलेट | यह क्या बनाता है |
|---|---|
| `rust` | Rust में लिखा ऐप: एक Cargo प्रोजेक्ट (`Cargo.toml`, root component के साथ `src/lib.rs`, `cargo run` के लिए `src/main.rs`), `"rust": "."` और `"root": "App"` के साथ `nsh.json`, `tsconfig.json` और `.nsh/types` के साथ root का टेस्ट `App.test.tsx`, `.gitignore` और एक README, जो यह भी बताता है कि बाद में TSX entry कैसे जोड़ें। `nsh run` और `nsh package` root को हर target पर बिना QuickJS के mount करते हैं (`nsh test` इसे TypeScript टेस्ट के लिए खोलता है), ब्राउज़र सहित ([Rust के साथ बिल्डिंग](./rust.md)); `cargo run` इसे macOS, Windows या Linux पर सीधे शुरू करता है। |
| `ts` | एक TSX ऐप: `App.tsx`, उसका टेस्ट `App.test.tsx` (`nsh test`), `nsh.json`, `tsconfig.json`, `.gitignore` और `.nsh/types`। जो फ़ाइलें पहले से हैं वे जस की तस रखी जाती हैं; यह केवल तब विफल होता है जब वे सभी पहले से मौजूद हों। |
| `mixed` | एक TSX ऐप, जिसके root पर अपना Rust crate है: `App.tsx`, उसका टेस्ट `App.test.tsx`, `tsconfig.json`, `"rust": "."` के साथ `nsh.json`, `.gitignore`, `.nsh/types`, एक README, और `App.tsx` के बगल में crate (`Cargo.toml`, `src/lib.rs`), जिसका `#[native_module("<name>/native")]` एक component, एक module और एक class export करता है जिन्हें `App.tsx` उपयोग करता है। `"root"` न होने पर `App.tsx` ही entry है। |

| Flag | विवरण |
|---|---|
| `--name <NAME>` | `nsh.json` में लिखा जाने वाला display name। डिफ़ॉल्ट: डायरेक्टरी का नाम। id `com.example.<name>` बन जाता है (केवल अक्षर और अंक, lower case), और crates का import specifier `<name>/native` (lower case, शब्द `-` से जुड़े)। |
| `--template <TEMPLATE>` | `rust`, `ts` या `mixed` (ऊपर)। `rust` और `mixed` के लिए Rust चाहिए; `cargo run` के लिए native desktop backend की development libraries भी चाहिए। |
| `--nsh-source <DIR>` | `rust` या `mixed` के साथ: crates `DIR` में मौजूद checkout के NSH crates पर path द्वारा निर्भर करते हैं, ताकि ऐप NSH के sources के विरुद्ध बने। |

`rust` और `mixed` के crates, CLI के version पर crates.io के NSH crates पर निर्भर करते हैं (`--nsh-source` के साथ, किसी checkout के crates पर), और `nsh` कमांड ऐप के runners और hosts को उन्हीं crates से बनाते हैं। ऐसे ऐप पर हर कमांड से पहले `nsh` ऐप के crates और NSH के core का एक छोटा प्रोग्राम बनाता है जो उनके components, modules और classes का वर्णन करता है, और crates बदलने पर उसे चलाता है; उस वर्णन के आधार पर CLI स्वयं ऐप को bundle, compile, type-check, serve और package करता है। Rust ऐप के builds केवल उसके crates और NSH के core को compile करते हैं। इन्हें नई ऐप डायरेक्टरी में बनाएँ: इनकी कोई भी फ़ाइल पहले से मौजूद हो तो कुछ भी लिखे जाने से पहले उसे conflict के रूप में बताया जाता है।

जिन ऐप्स के Rust crates Git के माध्यम से NSH पर निर्भर करते हैं, वे वही checkout उपयोग करते हैं जिसे Cargo ऐप की lockfile में resolve करता है। बनाए गए hosts उसी checkout को साझा करते हैं, जिसमें ऐप के Cargo patches द्वारा redirect की गई NSH dependencies भी शामिल हैं।

## nsh run

```sh
nsh run [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--port <PORT>] [--release] [--limits [<LIMITS>]] [--trace] [--fps] [--name <NAME>] [--window-size <WIDTHxHEIGHT>] [--display <N>]
```

```sh
nsh run my-app                     # a Rust app's root, or a TSX app's App.tsx, on this machine's backend
nsh run my-app --target ios        # in the iOS simulator
nsh run my-app/App.tsx --target web
```

TSX entry के लिए `nsh run` dev server शुरू करता है (`nsh dev` की तरह), एक development host लॉन्च करता है जो ऐप को उसी से लोड करता है, और हर save पर rebuild करता है। Hot module replacement चल रहे ऐप को उसी जगह patch करता है; ऐप के logs और errors टर्मिनल में प्रिंट होते हैं। इसे Ctrl-C से रोकें (या Catalyst, macOS, Linux, Windows या GPUI विंडो बंद करके)। यह जिस भी तरह समाप्त हो (Ctrl-C, `kill` / `pkill`, कोई error), यह अपने शुरू किए host को रोक देता है: Catalyst ऐप, macOS, Linux, Windows या GPUI host, simulator में development host, या Android डिवाइस पर।

Rust ऐप (`nsh.json` `"root"`, [Rust के साथ बिल्डिंग](./rust.md)) बिना dev server और बिना QuickJS के चलता है: `nsh run` target के लिए ऐप का runner उसके root को mount करके बनाता है और उसे शुरू करता है (desktops पर debug build, उसके logs टर्मिनल में; simulator और Android में, ऐप install किया हुआ), और crate के Rust कोड में बदलाव होने पर उसे फिर से बनाकर restart करता है। `--target web` के साथ यह पेज का पता प्रिंट करता है, और खुला पेज नया runtime अपने आप लोड कर लेता है। इसके बजाय TSX entry चलाने के लिए उसका नाम दें (`nsh run App.tsx`)।

| Flag | डिफ़ॉल्ट | विवरण |
|---|---|---|
| `--target <TARGET>` | macOS पर `macos`, Linux पर `linux`, Windows पर `windows` | `catalyst`: Mac Catalyst host, iPhone आकार की विंडो (390×844)। `ios`: iOS simulator में host। `android`: Android डिवाइस या emulator पर host। `macos`: AppKit host, 1200×800 की विंडो ([macOS](./macos.md))। `linux`: GTK host, 390×844 की विंडो ([Linux](./linux.md))। `windows`: Win32 host, 1200×800 की विंडो ([Windows](./windows.md))। `gpui`: GPUI host, 1200×800 की विंडो, macOS, Windows या Linux पर, जो TSX ऐप को वैसे दिखाता है जैसे उसे embed करने वाले GPUI ऐप्स दिखाते हैं ([GPUI](./gpui.md))। `web`: dev server का पेज, उस पते पर जो वह प्रिंट करता है ([Web](./web.md#develop-in-the-browser))। |
| `--device <DEVICE>` | | उपयोग किया जाने वाला iOS simulator, नाम (`"iPhone 16 Pro"`) या UDID से। डिफ़ॉल्ट: कोई booted simulator, नहीं तो सबसे नया iPhone, जिसे boot किया जाता है। |
| `--port <PORT>` | `8790` | Dev server का port। इस port पर पिछले NSH development session को उसकी cleanup पूरी होने के बाद बदल देता है। |
| `--release` | | Minify करता है और debug info हटाता है। Release bundles में hot module replacement नहीं होता: हर save पर ऐप reload होता है। |
| `--limits [<LIMITS>]` | | ऐप को दूसरे ऐप में embedded ऐप के रूप में चलाता है, उन सीमाओं के भीतर जो उसका host ऐप तय करता है: `memory` और `stack` (`KB`, `MB` या `GB` में), `load` और `call` (`ms` या `s` में) और `nodes`, जैसे `--limits memory=128MB,call=500ms`। जो छोड़े गए हैं वे embedding के डिफ़ॉल्ट रखते हैं, जिनके साथ अकेला `--limits` चलता है ([Sandbox और capabilities](./sandbox-and-capabilities.md#limits))। इसके बिना ऐप अकेले चलता है, जैसे packaged ऐप चलता है। TSX entries। |
| `--trace` | | Host हर commit का समय (JS, layout, mount items) टर्मिनल में log करता है। |
| `--fps` | | Performance monitor: frame rate, frames और commits की लागत, CPU, GPU और memory, जो macOS पर ऐप के ऊपर दिखाए जाते हैं ([macOS](./macos.md#performance-monitor)) और macOS, Linux, Windows और iOS पर हर सेकंड log किए जाते हैं। |
| `--name <NAME>` | `nsh.json` नाम | मेन्यू बार में ऐप का display name और विंडो का शुरुआती शीर्षक (`--target macos`, TSX entries)। |
| `--window-size <WIDTHxHEIGHT>` | Host का डिफ़ॉल्ट | points में विंडो का शुरुआती आकार, जैसे `800x600` (`--target macos`, `linux`, `windows` और `gpui`, TSX entries)। |
| `--display <N>` | मुख्य display | वह display जिस पर विंडो केंद्र में खुलती है: `1` primary display है (जिस पर मेन्यू बार होता है), `2` अगला, और इसी तरह; जिस संख्या का कोई display न हो उस पर विंडो मुख्य display पर खुलती है (`--target macos`, TSX entries)। |

`--target android` के साथ, `adb devices` द्वारा सूचीबद्ध पहला डिवाइस उपयोग किया जाता है; dev server का port `adb reverse` से उस पर forward किया जाता है। [शुरू करना](./getting-started.md#run-it) और [Dev server और debugging](./dev-server-and-debugging.md) देखें।

Replacement पिछले session की cleanup पूरी होने तक अधिकतम दस सेकंड प्रतीक्षा करता है। किसी अन्य प्रोग्राम या पुराने NSH CLI द्वारा घेरा गया port एक error देता है जिसमें port का नाम होता है। कई ऐप्स को साथ चलाने के लिए अलग-अलग `--port` मान उपयोग करें; `--port 0` OS से खाली port माँगता है।

## nsh dev

```sh
nsh dev [ENTRY] [--target catalyst|ios|android|macos|linux|windows|gpui|web] [--device <DEVICE>] [--server-only] [--port <PORT>] [--release] [--limits [<LIMITS>]]
```

Dev server शुरू करता है और इस सिस्टम का native host खोलता है: macOS पर AppKit, Linux पर GTK, Windows पर Win32। मोबाइल development के लिए `--target ios` या `--target android` स्पष्ट रूप से चुनें। `--server-only` उन hosts को serve करता है जिन्हें आप स्वयं शुरू करते हैं। Server ऐप बनाता है, entry की डायरेक्टरी पर नज़र रखता है, और हर rebuild जुड़े हुए hosts को भेजता है। `--server-only` के साथ, यह इस मशीन के hosts के लिए URL प्रिंट करता है और devices के लिए हर LAN पते का एक URL, और जब web runtime मौजूद हो, वह पेज भी जिसे ब्राउज़र ऐप चलाने के लिए खोलते हैं ([Web](./web.md#develop-in-the-browser)):

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  browsers: http://127.0.0.1:8790/
  devices on this network: ws://192.168.1.20:8790/ws
  browsers on this network: http://192.168.1.20:8790/
```

`nsh dev --server-only` का उपयोग ऐसे ऐप के साथ करें जो development SDK को embed करता है (`NativeShellDev.xcframework`, `nsh-dev.aar`)। `--target`, `--device`, `--port`, `--release` और `--limits` वैसे ही काम करते हैं जैसे `nsh run` के लिए; `--server-only` बिना लॉन्च किए host वाला server चुनता है।

## nsh test

```sh
nsh test [PATH] [--filter <NAME>] [--trace] [--fps] [--junit <FILE>] [--target <TARGET>] [--browser <PATH>] [--web-host <JS>] [--display <N>]
```

ऐप के टेस्ट headless चलाता है ([Testing](./testing-and-trace.md)): `PATH` में टेस्ट फ़ाइलें (`*.test.tsx`, `*.test.ts`, `nsh/test` import करती हुई), या कोई डायरेक्टरी (डिफ़ॉल्ट: वर्तमान डायरेक्टरी; छिपी डायरेक्टरियाँ, `node_modules` और `target` छोड़ दी जाती हैं), या टेस्ट फ़ाइल `PATH`। ऐसे ऐप की डायरेक्टरी दिए जाने पर जिसके अपने Rust crates हैं (`nsh.json` `"rust"`: Rust ऐप या crate वाला TSX ऐप), यह पहले डायरेक्टरी के हर crate के लिए, crate की अपनी डायरेक्टरी में, `cargo test` चलाता है, और हर Rust टेस्ट को TypeScript टेस्ट के साथ उसके टेस्ट target की फ़ाइल (`src/lib.rs › tests::adds`) के अंतर्गत दिखाता और गिनता है; केवल Rust टेस्ट वाला Rust ऐप भी इसी तरह टेस्ट होता है। हर टेस्ट फ़ाइल अपने अलग engine पर चलती है और टेस्ट जिस ऐप को खोलते हैं वह एक और नए engine पर। यह हर टेस्ट के लिए एक पंक्ति प्रिंट करता है, और विफलता के लिए यह कि क्या throw हुआ, टेस्ट फ़ाइल में कहाँ, और स्क्रीन पर क्या लिखा था; कोई भी विफलता होने पर यह non-zero कोड के साथ बाहर निकलता है। ऐप की entry दिए जाने पर (`nsh test App.tsx`; Rust ऐप की: `nsh test nsh.json`), यह ऐप को network पर खोलता है, उसे 1.2 s चलने देता है और standard input से मिलने वाले चरण लेता है (`await app.press("Add")`, जहाँ `app` ऐप है)। TSX ऐप CLI की अपनी process में चलता है; अपने Rust crates वाला ऐप उनके साथ बने headless runner में चलता है, जिसके लिए CLI entries बनाता है। Headless runs iOS की तरह व्यवहार करते हैं, जब तक कोई टेस्ट ऐप को Android के रूप में न खोले (`open` का `platform`): `platform.os` `"ios"` है, और `ios:` classes और `ios={{…}}` props लागू होते हैं।

```text
✓ App.test.tsx › counts taps (321ms)
✓ 1 test: 1 passed, 0 failed (343ms)
```

| Flag | विवरण |
|---|---|
| `--filter <NAME>` | केवल वे टेस्ट चलाता है जिनके नाम में (उन `describe` blocks के नामों के बाद जिनमें वह है) `NAME` शामिल हो; crates के लिए, `cargo test <NAME>`। |
| `--trace` | टेस्ट जिन ऐप्स को खोलते हैं उनका हर mount batch उस चरण के अंतर्गत प्रिंट करता है जिसमें वह आया (`── press(Add): 7 items`), और हर commit का समय: पहला frame, कोई चरण या scrolling का कोई frame कितना खर्च करता है। `--target` के साथ, host के batches और timings। |
| `--fps` | `--target linux`, `macos`, `windows` या `ios` के साथ: host अपने performance monitor की रीडिंग हर सेकंड log करता है (frame rate, frame phases, commits, CPU, memory), जो `-v` के साथ दिखाई जाती हैं। |
| `--junit <FILE>` | परिणाम `FILE` में JUnit XML रिपोर्ट के रूप में भी लिखता है, वह format जिससे CI services टेस्ट परिणाम दिखाती हैं: हर टेस्ट फ़ाइल के लिए एक `testsuite`, हर टेस्ट के लिए एक `testcase`। |
| `--target <TARGET>` | टेस्ट जिन ऐप्स को खोलते हैं उन्हें headless के बजाय इस platform के development host पर चलाता है (`macos`, `linux`, `windows`, `gpui`, `web`, `ios` और `android`; `web` उन्हें headless Chrome, Edge या Chromium में चलाता है): चरण platform के अपने input से काम करते हैं ([Testing](./testing-and-trace.md#on-a-real-platform)), और `open` अपने options को platform के विरुद्ध जाँचता है, और जिसे वह निभा नहीं सकता उसे अस्वीकार करता है (`ERR_NSH_TEST_UNSUPPORTED`: iOS और Android पर `width` और `height`, किसी दूसरी तरह के डिवाइस का `platform`)। crates के Rust टेस्ट इसी मशीन पर चलते हैं, उन runs में जिनमें `--target` नहीं है। |
| `--browser <PATH>` | वह Chrome, Edge या Chromium executable जिसमें `--target web` ऐप्स चलाता है (डिफ़ॉल्ट: इस मशीन पर installed वाला)। |
| `--display <N>` | `--target macos` के साथ: वह display जिस पर ऐप्स की विंडो केंद्र में खुलती हैं: `1` primary display है (जिस पर मेन्यू बार होता है), `2` अगला, और इसी तरह; जिस संख्या का कोई display न हो उस पर वे मुख्य display पर खुलती हैं। डिफ़ॉल्ट रूप से वे secondary display पर खुलती हैं (primary के अलावा पहला, जो उसका mirror न हो), ताकि टेस्ट run अपनी अलग स्क्रीन पर रहे, और जब वही एकमात्र display हो तो primary पर। टेस्ट हर display पर एक जैसे चलते हैं। |
| `--web-host <JS>` | वेब पेज का host module जो headless खोले गए ऐप्स को मिलता है (डिफ़ॉल्ट: `nsh.json` `web.host`; यह `createHost(player)` export करता है): यह उनके [`host`](../modules/nsh.md#host) calls का उत्तर देता है और इसका `player.hostEvent` `host.on` तक पहुँचता है ([Testing](./testing-and-trace.md#the-pages-host))। केवल headless runs; `--target web` `nsh.json` का `web.host` चलाता है। |
## nsh check

```sh
nsh check [ENTRY] [--tsc <TSC>] [-- <TSC ARGS>...]
```

ऐप को टाइप चेक करता है। जिस ऐप के अपने Rust crates हैं (`nsh.json` `"rust"`), उसमें पहले हर crate को उसकी डायरेक्टरी में `cargo check --all-targets` से चेक किया जाता है, उसके टेस्ट भी शामिल हैं; Cargo की त्रुटियों पर यह शून्य से अलग कोड के साथ बाहर निकलता है। इसके बाद Rust ऐप (`"root"`) को उतना चेक किया जाता है जितना उसमें TypeScript है: `tsconfig.json` के साथ (वही जिसे `nsh init --template rust` `App.test.tsx` के लिए लिखता है) उसकी टेस्ट फ़ाइलें भी टाइप चेक होती हैं। TypeScript चेक पहले `.nsh/types` और `.nsh/tsconfig.json` को रीफ़्रेश करता है, फिर ऐप के `tsconfig.json` के साथ `tsc -p <app directory> --noEmit` चलाता है। यह TypeScript 7, यानी नेटिव कंपाइलर, का उपयोग करता है, जिसे Node की ज़रूरत नहीं है: पहली बार चलाने पर यह उसे npm रजिस्ट्री से डाउनलोड करता है (लगभग 9 MB), NSH द्वारा दर्ज चेकसम से उसकी जाँच करता है, और उसे NSH की कैश में रखता है (macOS पर `~/Library/Caches/nsh`, Linux पर `~/.cache/nsh`, Windows पर `%LOCALAPPDATA%\nsh`, या `NSH_CACHE`)। टाइप त्रुटियों पर यह शून्य से अलग कोड के साथ बाहर निकलता है। यदि `tsconfig.json` `./.nsh/tsconfig.json` को extend नहीं करता, जहाँ NSH अपनी TypeScript सेटिंग्स रखता है ([Project structure](./project-structure.md#tsconfigjson-and-nshtypes)), तो यह चेतावनी देता है।

| फ़्लैग | विवरण |
|---|---|
| `--tsc <TSC>` | इसके बजाय यह `tsc` चलाएँ (`NSH_TSC` भी), उदाहरण के लिए `node_modules` से कोई एक, या नेटवर्क रहित मशीनों के लिए एक कॉपी। |
| `-- <TSC ARGS>` | `tsc` को आगे भेजा जाता है, जैसे `nsh check -- --pretty false`। |

NSH द्वारा बनाई गई फ़ाइलें `.nsh/` के अंतर्गत रहती हैं: declarations, runner सोर्स, और `.nsh/out/` में डिफ़ॉल्ट build/package आउटपुट। Cargo अपनी सामान्य `target/` कैश और मौजूदा `CARGO_TARGET_DIR` व्यवहार बनाए रखता है; NSH उसे अन्यत्र ले जाने के लिए Cargo कॉन्फ़िगरेशन नहीं जोड़ता। `--out` फिर भी आउटपुट स्थान को override करता है।

## nsh build

```sh
nsh build [ENTRY] [-o <OUT>] [--release] [--split]
```

ऐप को बिल्ड करता है। Rust ऐप (`nsh.json` `"root"`) के लिए यह ऐप के crates को बिल्ड और वर्णित करता है, और `app.json` तथा उनके साथ भेजी जाने वाली फ़ाइलें (`assets/`) लिखता है: इसके runners रूट को माउंट करते हैं। TSX ऐप के लिए यह ऐप को बंडल करता है और QuickJS bytecode में कंपाइल करता है, उन ऐप्स के लिए जो NSH को एम्बेड करते हैं और बंडल स्वयं भेजते हैं।

| फ़्लैग | डिफ़ॉल्ट | विवरण |
|---|---|---|
| `-o, --out <OUT>` | `.nsh/out` | आउटपुट डायरेक्टरी। |
| `--release` | | Minify करें और डीबग जानकारी हटाएँ। |
| `--split` | | `import()` जो कुछ लोड करता है, उसे अपनी अलग chunk फ़ाइलों में रखें, जो पहली बार इम्पोर्ट होने पर डाउनलोड होती हैं (वेब ऐप्स, देखें [Split bundles](./web.md#split-bundles))। इसके बिना बंडल में पूरा ऐप होता है। |

यह ये लिखता है:

| फ़ाइल | सामग्री |
|---|---|
| `bundle.js` | JavaScript के रूप में बंडल |
| `bundle.js.map` | उसका source map (stack traces आपके सोर्स तक वापस मैप होते हैं) |
| `bundle.nshc` | कंपाइल किए गए bytecode के रूप में बंडल: ऐप्स यही लोड करते हैं |
| `<Chunk>.js`, `<Chunk>.js.map`, `<Chunk>.nshc` | `--split` के साथ: हर chunk, उसका source map और उसका bytecode (`import("./Screen")` के लिए `Screen.js`) |
| `capabilities.json` | `nsh.json` का `capabilities`, यदि घोषित हो (अन्यथा हटा दिया जाता है) |
| `assets/` | इम्पोर्ट की गई हर इमेज और फ़ॉन्ट, ऐप रूट के सापेक्ष उसके पाथ पर |

## nsh package

```sh
nsh package [ENTRY] --target ios|ios-simulator|android|macos|linux|windows|web [-o <OUT>] [flags]
```

इंस्टॉल करने योग्य ऐप को release मोड में बिल्ड करता है। Rust ऐप (`nsh.json` `"root"`) को उसके अपने runner के साथ पैकेज किया जाता है, जिसे Cargo से आपके crates और NSH के crates से बिल्ड किया जाता है, और जिसका रूट बिना QuickJS के माउंट होता है ([Building with Rust](./rust.md)); TSX ऐप को पहले से बने runtime के साथ। इसमें कोई Xcode प्रोजेक्ट या Gradle बिल्ड शामिल नहीं है: NSH ऐप बंडल स्वयं असेंबल करता है और Xcode के `actool` और `codesign` (iOS) या SDK के `aapt2`, `zipalign` और `apksigner` (Android) का उपयोग करता है; macOS के लिए यह `codesign` के साथ ad hoc signed `.app` असेंबल करता है (और आइकन के लिए `sips`); Linux के लिए यह runner को कॉपी करता है और `tar` के साथ `.tar.gz` लिखता है; Windows के लिए यह runner को कॉपी करता है, आइकन एम्बेड करता है और `.zip` लिखता है, बिना किसी टूल के; वेब के लिए यह एक static साइट लिखता है, बिना किसी टूल के। मेटाडेटा `nsh.json` से आता है, जिसे फ़्लैग override करते हैं।

| फ़्लैग | विवरण |
|---|---|
| `--target <TARGET>` | आवश्यक। `ios`: iOS डिवाइस, एक signed `.ipa` (या `--sign` के बिना एक unsigned `.app`)। `ios-simulator`: एक ad hoc signed `.app`। `android`: एक signed `.apk`। `macos`: एक ad hoc signed `.app` ([macOS](./macos.md#packaging))। `linux`: एक डायरेक्टरी `<Name>/` (executable, `nsh/`, एक `.desktop` फ़ाइल) और `<Name>.tar.gz` ([Linux](./linux.md#packaging))। `windows`: एक डायरेक्टरी `<Name>\` (`<Name>.exe`, `nsh\`) और `<Name>.zip` ([Windows](./windows.md#packaging))। `web`: एक डायरेक्टरी `<Name>/`, एक static साइट (`index.html` और अपनी सामग्री के नाम वाली फ़ाइलें) ([Web](./web.md#publish-an-app))। |
| `-o, --out <OUT>` | आउटपुट डायरेक्टरी (डिफ़ॉल्ट `.nsh/out`)। |
| `--name <NAME>` | प्रदर्शित नाम। |
| `--id <ID>` | Bundle identifier, जैसे `com.example.app`। |
| `--app-version <VERSION>` | वर्शन, जैसे `1.2.0`। |
| `--build <BUILD>` | बिल्ड नंबर। |
| `--icon <ICON>` | ऐप आइकन: एक वर्गाकार PNG, आदर्श रूप से 1024×1024। |
| `--sign <IDENTITY>` | iOS डिवाइस: code signing identity, जैसे `"Apple Development: …"`। |
| `--profile <FILE>` | iOS डिवाइस: provisioning profile (`.mobileprovision`)। Entitlements इसी से आते हैं। |
| `--keystore <FILE>` | Android: release keystore। डिफ़ॉल्ट: `~/.android/debug.keystore` में debug key (अनुपस्थित होने पर बनाई जाती है)। |
| `--key-alias <ALIAS>` | Android: keystore में key alias। |
| `--keystore-password <PASSWORD>` | Android: keystore पासवर्ड। `NSH_KEYSTORE_PASSWORD` से भी पढ़ा जाता है। |
| `--abi <ABI>` | Android: APK के ABIs (`arm64-v8a`, `armeabi-v7a`, `x86_64`), दोहराकर या कॉमा से अलग करके। डिफ़ॉल्ट: `arm64-v8a` और `armeabi-v7a`, साथ ही `--run` के साथ डिवाइस का ABI। |
| `--run` | बाद में ऐप को इंस्टॉल और लॉन्च करें: सिमुलेटर में (`ios-simulator`) या कनेक्टेड Android डिवाइस पर; `macos`, `linux` और `windows` उसे लॉन्च करते हैं; `web` साइट को इसी मशीन पर उस पते पर सर्व करता है जो वह प्रिंट करता है। |

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target ios --sign "Apple Development: Jane Doe (ABCDE12345)" --profile dev.mobileprovision
nsh package my-app --target android --keystore release.jks --key-alias upload
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

देखें [Packaging](./packaging.md)।

## Signing commands

ये कमांड signed packages (`.nshpkg`) बनाते और जाँचते हैं: ऐप बंडल जिन्हें NSH एम्बेड करने वाले ऐप्स चलाने से पहले डाउनलोड और सत्यापित करते हैं। [Signed packages](./signed-packages.md) मॉडल को समझाता है (एक ऑफ़लाइन root key कुछ ऐप ids के लिए release keys को प्रमाणित करती है)।

### nsh keygen

```sh
nsh keygen <NAME>
```

एक Ed25519 key pair बनाता है: `<NAME>.secret` और `<NAME>.pub` (जैसे `nsh keygen keys/root`)। root की `.secret` को ऑफ़लाइन रखें; ऐप्स उसकी `.pub` पर भरोसा करते हैं।

### nsh certify

```sh
nsh certify --root <ROOT.secret> --key <KEY.pub> --apps <PATTERN>... [--days <DAYS>] -o <OUT>
```

किसी release key को root key से कुछ ऐप ids और एक समय सीमा के लिए प्रमाणित करता है; पैकेज प्रमाणपत्र साथ रखते हैं।

| फ़्लैग | विवरण |
|---|---|
| `--root <ROOT>` | root की secret key। |
| `--key <KEY>` | release key की public key। |
| `--apps <APPS>` | वे ऐप ids जिनके लिए वह साइन कर सकती है: `*`, `com.example.*` या कोई id। दोहराया जा सकता है। |
| `--days <DAYS>` | अभी से कितने समय तक वह साइन कर सकती है (डिफ़ॉल्ट 365)। |
| `-o, --out <OUT>` | लिखा जाने वाला प्रमाणपत्र। |

### nsh publish

```sh
nsh publish [ENTRY] --key <KEY.secret> --cert <CERT> [-o <OUT>] [--id <ID>] [--app-version <V>] [--build <N>]
            [--source-map package|file|none] [--strip-debug] [--min-runtime <VERSION>]
```

ऐप को release मोड में बिल्ड करता है और उसे साइन करके पैकेज बनाता है। मेटाडेटा `nsh.json` से आता है, जिसे फ़्लैग override करते हैं।

कोई पैकेज दिए जाने पर (`ENTRY` एक `.nshpkg` फ़ाइल है), यह उस पैकेज को इस key से दोबारा साइन करता है, जैसा कोई प्लेटफ़ॉर्म करता है जो अपने ऐप्स के पैकेज अपनी एक key से साइन करता है। पैकेज की फ़ाइलें और हेडर जस के तस रहते हैं; उसका प्रमाणपत्र, साइनिंग समय और हस्ताक्षर नई key के हो जाते हैं ([Signed packages](./signed-packages.md#sign-a-package-again))। `-o` पढ़े जाने वाले पैकेज को नाम दे सकता है, और केवल `--key`, `--cert` और `-o` लागू होते हैं।

| फ़्लैग | विवरण |
|---|---|
| `--key <KEY>` | release key की secret key। |
| `--cert <CERT>` | उसका प्रमाणपत्र (`nsh certify`)। |
| `-o, --out <OUT>` | लिखा जाने वाला पैकेज। डिफ़ॉल्ट: `.nsh/out/<id>-<build>.nshpkg`। |
| `--id <ID>` | ऐप id। |
| `--app-version <VERSION>` | वर्शन। |
| `--build <BUILD>` | बिल्ड नंबर: हर release के साथ बढ़ना चाहिए। |
| `--source-map <WHERE>` | source map कहाँ जाए: `package` (डिफ़ॉल्ट), `file` (पैकेज के बगल में `<package>.map`) या `none` ([Signed packages](./signed-packages.md#errors-from-published-packages))। |
| `--strip-debug` | bytecode से line और column तालिकाएँ हटा दें: छोटा आकार, लेकिन error stacks में स्थान नहीं होते। |
| `--min-runtime <VERSION>` | सबसे पुराना runtime जो पैकेज चलाता है, जैसे `0.2.0`; पुराने runtime इसे अस्वीकार करते हैं। डिफ़ॉल्ट: इस CLI का वर्शन ([Signed packages](./signed-packages.md#which-runtimes-run-a-package))। |

### nsh verify

```sh
nsh verify <PACKAGE> [--root <ROOT.pub>]... [--revocations <LIST>]
```

किसी पैकेज को वैसे सत्यापित करता है जैसे दिए गए roots पर भरोसा करने वाला ऐप करता। `--root` के बिना केवल पैकेज का अपना हस्ताक्षर जाँचा जाता है। यह पैकेज का SHA-256 प्रिंट करता है, जिसे `nsh revoke --package` लेता है।

### nsh symbolicate

```sh
nsh symbolicate <MAP> [INPUT]
```

किसी पैकेज द्वारा रिपोर्ट की गई त्रुटि के बंडल स्थानों (`bundle.js:LINE:COL`) को आपके सोर्स के अनुसार दोबारा लिखता है और परिणाम प्रिंट करता है। `MAP` एक source map है (`nsh publish --source-map file`, `bundle.js.map` से `<package>.map`) या ऐसा पैकेज जिसमें एक हो; `INPUT` त्रुटि का टेक्स्ट है (डिफ़ॉल्ट: standard input)।

### nsh revoke

```sh
nsh revoke --root <ROOT.secret> [--extend <LIST>] [--sequence <N>] [--key <ID>]... [--package <SHA256>]... -o <OUT>
```

एक revocation list साइन करता है: वे release keys और पैकेज जिन्हें अब लोड नहीं होना चाहिए।

| फ़्लैग | विवरण |
|---|---|
| `--root <ROOT>` | root की secret key। |
| `--extend <EXTEND>` | इस सूची की प्रविष्टियाँ रखें (अंतिम प्रकाशित सूची)। |
| `--sequence <N>` | सूची की संख्या, जो पहले प्रकाशित किसी भी सूची से अधिक हो। `--extend` के साथ डिफ़ॉल्ट: उस सूची की संख्या में एक जोड़कर। |
| `--key <ID>` | रद्द करने के लिए एक release key id। दोहराया जा सकता है। |
| `--package <SHA256>` | रद्द करने के लिए एक पैकेज SHA-256। दोहराया जा सकता है। |
| `-o, --out <OUT>` | लिखी जाने वाली सूची। |

## Environment variables

| वेरिएबल | इनके द्वारा उपयोग | विवरण |
|---|---|---|
| `ANDROID_HOME`, `ANDROID_SDK_ROOT` | Android targets | Android SDK। विकल्प: `~/Library/Android/sdk`। |
| `CARGO_TARGET_DIR` | Rust crates वाले ऐप्स | ऐप के runners कहाँ बिल्ड होते हैं। डिफ़ॉल्ट: ऐप का `target/`। |
| `NSH_KEYSTORE_PASSWORD` | `package --target android` | keystore पासवर्ड। |
| `NSH_RUNTIME` | `run`, `package` | CLI के बगल वाली डायरेक्टरी के बजाय उपयोग की जाने वाली runtime डायरेक्टरी। |
| `NSH_VERBOSE` | हर कमांड | `1`: `--verbose` की तरह। |
| `NSH_WASM_BINDGEN` | `run`, `package` (`--target web`) | उस ऐप के लिए `wasm-bindgen` CLI जिसके crates [browser APIs को कॉल करते हैं](./web.md#browser-apis-from-rust)। डिफ़ॉल्ट: `PATH` पर मौजूद CLI। |
| `NO_COLOR` | हर कमांड | सेट होने पर: टर्मिनल में रंग नहीं। |
