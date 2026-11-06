---
title: "प्रदर्शन रिपोर्ट"
description: "NSH ऐप्स के मापे गए आँकड़े - NSH की बेसलाइन से commit और फ़्रेम की लागत, और Linux, macOS, Windows और iOS पर पेज दर पेज गैलरी का फ़्रेम रेट, CPU और मेमोरी - साथ में उन्हें दोबारा प्राप्त करने का तरीका।"
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---

# परफ़ॉर्मेंस रिपोर्ट

NSH ऐप्स की लागत, मापी हुई। NSH उन्हें तेज़ कैसे रखता है और अपने ऐप को कैसे मापें, यह [Performance](./performance.md) में है।

<a id="baselines"></a>

## बेसलाइन

NSH के अपने बेसलाइन से (जब तक अन्यथा न लिखा हो, Apple silicon):

| परिदृश्य | आँकड़े |
|---|---|
| Counter ऐप, headless (debug) | पहला फ़्रेम ~0.5–0.65 ms (58 ops / 49 mount items); एक टैप ~0.15 ms |
| Counter ऐप, Mac Catalyst (release) | पहला फ़्रेम ~1.05–1.15 ms (इसमें से लगभग 0.7 ms CoreText से 10 टेक्स्ट को पहली बार लेआउट करने में जाता है); एक टैप ~0.12 ms |
| Gallery फ़ोटो सूची, headless (debug) | पहला फ़्रेम 653 ops / 224 nodes, ~2.7 ms |
| फ़ोटो सूची स्क्रॉल करना, Catalyst (release) | धीरे स्क्रॉल करते समय एक row को दोबारा bind करना ~0.4 ms; तेज़ फ़्लिंग पर ~32 rows की पूरी स्क्रीन 0.9–1.6 ms |
| फ़ोटो सूची स्क्रॉल करना, Android emulator (arm64, release) | एक row को दोबारा bind करना ~0.3–0.4 ms (JS ~60 µs) |
| इंजन स्टार्टअप (release) | ~75–155 µs; ग्लोबल APIs (`fetch`, `URL`, ...) पहली बार उपयोग होने तक कुछ खर्च नहीं करते, फिर ~90 µs |
| Hot reload | फ़ाइल सेव करने से नया संस्करण चलने तक ~120 ms; अपडेट लागू करने में 0.2–0.5 ms |

## Linux (GTK 4)

एक Linux डेस्कटॉप (x86_64, 24 थ्रेड, NVIDIA GPU) पर मापा गया, release बिल्ड, 120 Hz डिस्प्ले पर 1896 × 1030 विंडो में gallery, हर रीडिंग `examples/gallery/tools/perf.py` (`nsh test --target linux --fps`, हर सेकंड एक पंक्ति) द्वारा अपने-आप ली गई; CPU पूरी प्रोसेस का है, एक कोर के प्रतिशत में। *Frame p95* प्रति बनाए गए फ़्रेम पर मुख्य थ्रेड का समय है, 95वें परसेंटाइल पर: 8.3 ms से कम होने पर फ़्रेम 120 Hz रिफ़्रेश में समा जाता है।

<a id="animated-demos"></a>

### एनिमेटेड डेमो

<div class="data-table">

| डेमो | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks: 22 लाइव sparklines, एक intraday चार्ट, order book, tape | 117–120 | 5–6 ms | 25–29% (1200 × 800), 28–32% (1896 × 1030) |
| Stocks, विंडो 1.6× पर 4K 144 Hz डिस्प्ले को भरती हुई | 143–145 | 4.1–4.4 ms | 26–29% |
| Canvas: एक gauge, एक घड़ी, एक dot matrix | 120 | 2.6–4.4 ms | 5–10% |
| Animations: तीन native loops, springs, sequences | 120 | 2.0 ms | 12–13% |

</div>

<a id="every-page"></a>

### हर पेज

Gallery का हर पेज, खुलते समय और टेस्ट द्वारा स्क्रॉल किए जाने के दौरान, 144 Hz डिस्प्ले पर 1200 × 800 विंडो में (वही मशीन)। NSH फ़्रेम तभी बनाता है जब स्क्रीन पर कुछ बदलता है, इसलिए यहाँ *FPS* वह दर है जब कुछ हिल रहा हो: बनाए गए फ़्रेमों के बीच के median अंतराल पर एक फ़्रेम (`perf.py` का `moving`); डिस्प्ले के 144 पर, किसी एनिमेशन या स्क्रॉल का हर फ़्रेम पिछले के एक रिफ़्रेश बाद आता है। *Over one refresh* उन फ़्रेमों का हिस्सा है जिन्होंने एक रिफ़्रेश (6.9 ms) से ज़्यादा समय लिया। Images के GIF और WebP अपनी फ़्रेम दरों पर चलते हैं (यहाँ लगभग 50 FPS), वीडियो भी। Physics, Overlays और Menus छोटे पेज हैं: 1200 × 800 में स्क्रॉल कुछ ही फ़्रेमों में उनके अंत तक पहुँच जाता है, इसलिए उन्हें 900 × 500 विंडो में मापा गया है, जहाँ उनके पास स्क्रॉल करने की जगह है।

<div class="data-table">

| पेज | फ़्रेम कहाँ से आते हैं | FPS | Frame p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | लाइव डेटा, native loops | 144 | 4.1 ms | 0% | 26% |
| Stocks, scrolling | लाइव डेटा, स्क्रॉल | 144 | 4.1 ms | 0% | 25% |
| Photos, scrolling | स्क्रॉल | 144 | 2.8 ms | 2% | 9% |
| Lists, scrolling | स्क्रॉल | 143 | 1.7 ms | 0% | 7% |
| Scrolling, scrolling | स्क्रॉल | 144 | 1.6 ms | 1% | 4% |
| Navigation, scrolling | स्क्रॉल | 143 | 1.7 ms | 0% | 2% |
| Form, scrolling | स्क्रॉल | 144 | 1.3 ms | 0% | 4% |
| Resizable, scrolling | स्क्रॉल | 143 | 0.6 ms | 0% | 1% |
| Dock, scrolling | स्क्रॉल | 142 | 0.5 ms | 1% | 1% |
| Gestures | Springs, एक धड़कती रिंग | 144 | 1.6 ms | 0% | 1–5% |
| Physics, scrolling | स्क्रॉल (900 × 500 विंडो) | 144 | 1.6 ms | 1% | 1% |
| Animations | Native loops | 144 | 2.6 ms | 0–1% | 5% |
| Canvas, scrolling | स्क्रॉल, native loops | 144 | 4.2 ms | 0% | 1–4% |
| Styles, scrolling | स्क्रॉल | 144 | 2.3 ms | 2% | 3% |
| Tailwind | `animate-*` utilities | 144 | 1.7 ms | 0% | 3–8% |
| Text, scrolling | स्क्रॉल | 144 | 1.9 ms | 0% | 4% |
| Text View, scrolling | स्क्रॉल | 141 | 1.8 ms | 2% | 7% |
| Images, scrolling | स्क्रॉल, GIF और WebP फ़्रेम | 143 | 2.9 ms | 2% | 8% |
| Components, scrolling | स्क्रॉल | 144 | 1.4 ms | 0% | 3% |
| Overlays, scrolling | स्क्रॉल (900 × 500 विंडो) | 144 | 1.7 ms | 0% | 2% |
| Menus, scrolling | स्क्रॉल (900 × 500 विंडो) | 144 | 1.9 ms | 0% | 2% |
| Controls | Transitions | 144 | 0.9 ms | 0% | 1–4% |
| Web and video | वीडियो फ़्रेम, पेज | 135–142 | 1.0 ms | 0% | 7–8% |

</div>

<a id="memory"></a>

### मेमोरी

आराम की स्थिति में, स्टार्ट के 3 s बाद (release runners, 480 × 640 विंडो)। *Private* वह मेमोरी है जिसकी मालिक अकेली प्रोसेस है (USS); *resident* में साझा लाइब्रेरियों (GTK, GPU ड्राइवर) के पेज भी जुड़ते हैं, जिन्हें मशीन का हर GTK ऐप साझा करता है:

<div class="data-table">

| ऐप | Renderer | Private (USS) | Resident (RSS) |
|---|---|---|---|
| Rust ऐप (`nsh init --template rust`) | GL (`ngl`) | ~49 MB | ~142 MB |
| Rust ऐप | Cairo (`GSK_RENDERER=cairo`) | ~28 MB | ~95 MB |
| TSX counter (`examples/counter`) | GL | ~79 MB | ~166 MB |
| एक label वाली GTK 4 विंडो, संदर्भ के लिए | Vulkan / Cairo | ~62 / ~40 MB | ~132 / ~109 MB |

</div>

किसी पेज पर दोबारा जाने से मेमोरी नहीं बढ़ती; किसी पेज की पहली विज़िट प्रोसेस को उतना बढ़ाती है जितना वह जानबूझकर cache करता है (decoded images, 128 MB तक सीमित) और जितनी लाइब्रेरियाँ वह पहले उपयोग पर लोड करता है (वेब व्यू के लिए WebKitGTK)।

<a id="app-size"></a>

### ऐप का आकार

`nsh init` द्वारा हर template से बनाया गया एक hello world ऐप, और दो ऐसे ऐप जिन्हें लोग उपयोग करते हैं, जैसा `nsh package --target linux` उन्हें x86_64 के लिए बनाता है। Runner ऐप की एकमात्र executable है; archive वह `.tar.gz` है जिसके रूप में वह भेजा जाता है। Hello world को link-time optimization के साथ बनाया गया है और strip किया गया है (`CARGO_PROFILE_RELEASE_LTO=fat`, `CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`, `CARGO_PROFILE_RELEASE_STRIP=true`):

<div class="data-table">

| ऐप | किसमें लिखा गया | Runner | Archive |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 16.5 MB | 7.5 MB |
| Hello world (`--template ts`) | TSX, QuickJS पर | 25.7 MB | 11.6 MB |
| Hello world (`--template mixed`) | TSX और एक Rust crate | 25.8 MB | 11.7 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20.9 MB stripped | 9.7 MB |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22.3 MB | 9.8 MB |

</div>

TSX runners में QuickJS runtime, native modules और renderer शामिल हैं; ऐप का अपना कोड runner के बगल में उसका bundle है, जो hello world के लिए 1 KB से कम है।

ये आँकड़े किससे बनते हैं:

- **Renderer**: NVIDIA के ड्राइवर पर NSH, GSK के GL renderer से ड्रॉ करता है, जिसके फ़्रेम वहाँ Vulkan renderer के फ़्रेमों की तुलना में बहुत सस्ते हैं (Animations डेमो: प्रति फ़्रेम ~9.5 ms की जगह ~1 ms ड्रॉइंग)। फिर भी चुनाव `GSK_RENDERER` करता है।
- **Canvas rasters**: हर canvas को एक बार 256 px की tiles में raster किया जाता है, जो GPU पर रखी रहती हैं। कोई एनिमेटेड वैल्यू केवल उस क्षेत्र को दोबारा बनाती है जिसे उसे पढ़ने वाले ऑपरेशन ढकते हैं, ड्रॉइंग के स्थिर हिस्से के रखे हुए पिक्सेल के ऊपर; नज़र से बाहर का canvas तब तक रुका रहता है जब तक वह स्क्रॉल होकर दिखाई न दे।
- **Paths एक बार अलग रखे जाते हैं**: लंबे path के बाद `fillRect` और `fillText` उसे अपनी जगह छोड़ देते हैं, जब तक उसका फिर से उपयोग न हो (400-बिंदु की एक लाइन फिर 240 bars: 0.63 ms)।

## macOS (AppKit)

एक MacBook Pro (Apple M3, 24 GB) पर उसके built-in 120 Hz ProMotion डिस्प्ले पर मापा गया, release बिल्ड, 1200 × 800 विंडो में gallery, हर रीडिंग `examples/gallery/tools/perf.py` (`nsh test --target macos --fps`, हर सेकंड एक पंक्ति) द्वारा अपने-आप ली गई; CPU पूरी प्रोसेस का है, एक कोर के प्रतिशत में, GPU उसका GPU में हिस्सा है। चरण प्रति फ़्रेम मुख्य थ्रेड के हैं: *tick* (display link की native animations) और *canvas* (ड्रॉइंग replay करना)।

<a id="animated-demos-1"></a>

### एनिमेटेड डेमो

<div class="data-table">

| डेमो | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks: 22 लाइव sparklines, एक intraday चार्ट, order book, tape | 120 | 2.7–3.7 ms | 33–36% | 18–22% |
| Canvas: एक gauge, एक घड़ी, एक dot matrix | 119–120 | 0.6–0.7 ms | 4–7% | 0% |
| Animations: तीन native loops, springs, sequences | 119–120 | 0.3–1.6 ms | 5–8% | 0% |

</div>

Stocks पर एक फ़्रेम का मुख्य थ्रेड समय ~1.6 ms ticks का है, जिसमें से ~0.45 ms canvases के एनिमेटेड हिस्सों को replay करने में जाता है; हर canvas का बाकी हिस्सा Core Animation अपने थ्रेड्स पर बनाता है।

<a id="every-page-1"></a>

### हर पेज

Gallery का हर पेज, खुलते समय और टेस्ट द्वारा स्क्रॉल किए जाने के दौरान, उसी 1200 × 800 विंडो में। Linux की तरह, *FPS* वह दर है जब कुछ हिल रहा हो (बनाए गए फ़्रेमों के बीच के median अंतराल पर एक फ़्रेम); डिस्प्ले के 120 पर, किसी एनिमेशन या स्क्रॉल का हर फ़्रेम पिछले के एक रिफ़्रेश बाद आता है। *Over one refresh* उन फ़्रेमों का हिस्सा है जिन्होंने एक रिफ़्रेश (8.3 ms) से ज़्यादा समय लिया। आराम की स्थिति में पेज कोई फ़्रेम नहीं बनाता और 2–5% CPU उपयोग करता है। Images के GIF और WebP Core Animation में चलते हैं और वीडियो AVFoundation में, अपनी फ़्रेम दरों पर।

<div class="data-table">

| पेज | फ़्रेम कहाँ से आते हैं | FPS | Frame p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | लाइव डेटा, native loops | 120 | 3.2 ms | 0% | 35% |
| Stocks, scrolling | लाइव डेटा, स्क्रॉल | 120 | 3.5 ms | 0% | 36% |
| AI Chat, scrolling | स्क्रॉल | 120 | 2.4 ms | 1% | 5% |
| Photos, scrolling | स्क्रॉल | 120 | 1.4 ms | 0% | 10% |
| Lists, scrolling | स्क्रॉल | 120 | 1.6 ms | 0% | 8% |
| Scrolling, scrolling | स्क्रॉल | 120 | 2.7 ms | 0% | 6% |
| Navigation, scrolling | स्क्रॉल | 120 | 0.2 ms | 0% | 4% |
| Form, scrolling | स्क्रॉल | 120 | 0.6 ms | 0% | 5% |
| Resizable, scrolling | स्क्रॉल | 120 | 0.3 ms | 0% | 4% |
| Dock, scrolling | स्क्रॉल | 120 | 0.3 ms | 1% | 5% |
| Gestures | Springs, एक धड़कती रिंग | 120 | 0.4 ms | 0% | 4% |
| Physics, scrolling | स्क्रॉल | 120 | 0.3 ms | 0% | 4% |
| Animations | Native loops | 120 | 0.3 ms | 0% | 5% |
| Canvas, scrolling | स्क्रॉल, native loops | 120 | 1.2 ms | 0% | 7% |
| Styles, scrolling | स्क्रॉल, एक झूलता transform | 120 | 1.0 ms | 0% | 6% |
| Tailwind | `animate-*` utilities | 120 | 0.5 ms | 0% | 4% |
| Text, scrolling | स्क्रॉल | 120 | 0.3 ms | 0% | 5% |
| Text View, scrolling | स्क्रॉल | 120 | 0.7 ms | 0% | 5% |
| Images, scrolling | स्क्रॉल | 120 | 0.4 ms | 0% | 5% |
| Components, scrolling | स्क्रॉल | 120 | 0.3 ms | 0% | 5% |
| Overlays, scrolling | स्क्रॉल | 120 | 0.3 ms | 0% | 4% |
| Menus, scrolling | स्क्रॉल | 120 | 0.3 ms | 0% | 5% |
| Controls | Transitions | 120 | 0.3 ms | 0% | 4% |
| Web and video, scrolling | स्क्रॉल | 120 | 0.2 ms | 0% | 6% |
| System | `requestAnimationFrame`, timers | 120 | 0.2 ms | 0% | 3% |
| Standard APIs, scrolling | स्क्रॉल | 120 | 0.3 ms | 0% | 5% |
| Storage, scrolling | स्क्रॉल | 120 | 0.3 ms | 0% | 5% |

</div>

<a id="memory-1"></a>

### मेमोरी

आराम की स्थिति में, स्टार्ट के 3 s बाद (release runners)। *Footprint* वह मेमोरी है जो macOS प्रोसेस के खाते में गिनता है (जो Activity Monitor दिखाता है); *resident* में सिस्टम की साझा लाइब्रेरियों के पेज भी जुड़ते हैं:

<div class="data-table">

| ऐप | विंडो | Footprint | Resident (RSS) |
|---|---|---|---|
| Rust ऐप (`nsh init --template rust`) | 1200 × 800 | ~19 MB | ~86 MB |
| TSX counter (`examples/counter`) | 1200 × 800 | ~20 MB | ~89 MB |
| एक label वाली AppKit विंडो, संदर्भ के लिए | 480 × 640 | ~17 MB | ~80 MB |

</div>

Gallery के टूर के दौरान प्रोसेस Canvas पेज तक 84–230 MB और Text View पेज से आगे ~350–360 MB रखती है, उस सब के साथ जो वह जानबूझकर cache करती है (decoded images, 128 MB तक सीमित; Text View पेज के दस्तावेज़) और उन frameworks के साथ जिन्हें वह पहले उपयोग पर लोड करती है (वेब व्यू के लिए WebKit); Canvas पेज के rasters, तीनों canvases स्क्रीन पर होने पर ~310 MB तक, पेज बंद होने पर चले जाते हैं।
<a id="app-size-1"></a>

### ऐप का आकार

`nsh init` द्वारा हर टेम्पलेट से बनाए गए hello world ऐप, जैसे `nsh package --target macos` उन्हें Apple silicon (arm64) के लिए बनाता है, link-time optimization के साथ और Linux की तरह stripped, और ऊपर के दोनों ऐप, जैसे वे Apple silicon के लिए शिप होते हैं। executable वह runner है जो `.app` के अंदर होता है; zip वह है जो `.app` को कंप्रेस करने पर मिलता है (`ditto -c -k`):

<div class="data-table">

| ऐप | किसमें लिखा गया | Executable | Zip किया हुआ `.app` |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 12.4 MB | 6.0 MB |
| Hello world (`--template ts`) | TSX, QuickJS पर | 19.8 MB | 9.5 MB |
| Hello world (`--template mixed`) | TSX और एक Rust crate | 19.8 MB | 9.5 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21.6 MB | 8.4 MB (इसकी रिलीज़ का `.tar.gz`) |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18.4 MB | 9.7 MB (इसकी रिलीज़ का `.tar.gz`) |

</div>

ये संख्याएँ किन बातों से बनती हैं:

- **फ्रेम केवल बदलावों के लिए**: display link तब तक टिक करता है जब तक कोई नेटिव एनिमेशन चलता है और उसके साथ ही रुक जाता है; एनिमेशन अपने पेज के साथ रुकता है (उसके view के हटने पर उसकी keyframes खत्म हो जाती हैं, और लूप अपने कॉम्पोनेंट के `cleanup` में रुक जाता है)।
- **Canvas वहाँ ड्रॉ होते हैं जहाँ लागत सबसे कम है**: जो canvas अक्सर पेंट होता है (एनिमेशन, लाइव डेटा) वह Core Animation के थ्रेड्स (`drawsAsynchronously`) पर ड्रॉ होता है, जिससे मुख्य थ्रेड खाली रहता है; जो कभी-कभार दोबारा बनता है वह तुरंत ड्रॉ होता है, और उस ग्राफ़िक्स मेमोरी के बिना जो asynchronous ड्रॉइंग रोकती है। एनिमेटेड वैल्यू केवल उतना क्षेत्र दोबारा ड्रॉ करती है जितना उसे पढ़ने वाले ऑपरेशन कवर करते हैं।
- **Canvas के स्थिर हिस्से सुरक्षित रखे जाते हैं**: जब कोई ड्रॉइंग अपरिवर्तित रहती है, तो पहले एनिमेटेड ऑपरेशन से पहले का लंबा हिस्सा एक layer के रूप में रखा जाता है; हर फ्रेम उस layer को ड्रॉ करता है और केवल बाकी एनिमेटेड हिस्से को दोहराता है, मुख्य थ्रेड पर तुरंत (Canvas पेज का gauge, clock और dot matrix: कोई GPU काम नहीं और आधी मेमोरी)।
- **कंटेंट तब ड्रॉ होता है जब वह बदलता है**: टेक्स्ट और canvas अपनी-अपनी layers में ड्रॉ होते हैं, और तभी दोबारा ड्रॉ होते हैं जब उनका कंटेंट या आकार बदलता है, न कि जब वे हिलते या स्क्रॉल होते हैं।

## Windows (Win32, Direct2D)

Windows 11 डेस्कटॉप (Intel Core i7-13700KF, 32 GB, NVIDIA GeForce RTX 3060 Ti) पर, 150% पर 4K 144 Hz डिस्प्ले पर मापा गया, release builds, gallery 1200 × 800 की विंडो (1800 × 1200 पिक्सेल) में, हर रीडिंग `examples/gallery/tools/perf.py` (`nsh test --target windows --fps`, प्रति सेकंड एक पंक्ति; CPU पूरी प्रोसेस का है, एक कोर के प्रतिशत में) द्वारा अपने-आप ली गई। फेज़ मुख्य थ्रेड के प्रति फ्रेम हैं: *paint* (Direct2D द्वारा विंडो ड्रॉ करना) और उसके भीतर *canvas* (ड्रॉइंग को रिकॉर्ड और रीप्ले करना)।

<a id="animated-demos-2"></a>

### एनिमेटेड डेमो

<div class="data-table">

| डेमो | FPS | Frame p95 | प्रति फ्रेम Paint / canvas | CPU |
|---|---|---|---|---|
| Stocks: 22 लाइव sparklines, एक intraday चार्ट, order book, tape | 144 | 3.7–4.3 ms | 1.4 / 0.13 ms | 36–43% |
| Canvas: एक gauge, एक clock, एक dot matrix | 144 | 1.0–2.0 ms | 0.8–1.4 / 0.05 ms | 21–35% |
| Animations: तीन नेटिव लूप, springs, sequences | 144 | 1.0–3.6 ms | 0.9–1.9 ms | 20–41% |

</div>

Stocks प्रति सेकंड 16–17 बार commit करता है, हर commit में engine थ्रेड पर अधिकतम 2.1 ms JS और 1.7 ms core लगता है (p95)।

> [!NOTE]
> जिन पेजों के एनिमेशन बड़े क्षेत्रों में views को हिलाते हैं, वे यहाँ Linux और macOS की तुलना में अधिक CPU लेते हैं (Animations 20–41% बनाम 5–13%, Gestures 36% बनाम 1–5%)। Windows का फ्रेम, मुख्य थ्रेड पर Direct2D के साथ, बदले हुए क्षेत्रों के ऊपर हर view को दोबारा ड्रॉ करता है: बढ़ती हुई ring हर फ्रेम में अपने नीचे के card को दोबारा ड्रॉ करती है। macOS पर Core Animation अपनी रखी हुई layers को GPU पर बिना दोबारा ड्रॉ किए हिलाता, स्केल करता और fade करता है, और Linux पर GSK उन चीज़ों के render nodes रखता है जो नहीं बदलीं। इन संख्याओं में 1800 × 1200 पिक्सेल पर प्रति सेकंड 144 फ्रेम भी गिने गए हैं।

<a id="every-page-2"></a>

### हर पेज

Gallery का हर पेज, जैसे वह खुलता है और जब टेस्ट उसे स्क्रॉल करता है, उसी 1200 × 800 की विंडो में। Linux और macOS की तरह, *FPS* वह दर है जब कुछ हिल रहा हो (ड्रॉ किए गए फ्रेमों के बीच के मध्यक अंतराल पर एक फ्रेम); डिस्प्ले के 144 पर, किसी एनिमेशन या स्क्रॉल का हर फ्रेम पिछले के एक रिफ्रेश बाद आता है। *एक रिफ्रेश से ऊपर* उन फ्रेमों का अनुपात है जिन्होंने एक रिफ्रेश (6.9 ms) से अधिक समय लिया। स्थिर पड़ा पेज कोई फ्रेम ड्रॉ नहीं करता और 0–2% CPU लेता है। Images के GIF और WebP अपनी फ्रेम दरों पर चलते हैं (यहाँ लगभग 40 FPS)। Physics, Overlays, Menus और Storage 900 × 500 की विंडो में मापे गए हैं, जहाँ उनके पास स्क्रॉल करने की जगह है।

<div class="data-table">

| पेज | फ्रेम का स्रोत | FPS | Frame p95 | एक रिफ्रेश से ऊपर | CPU |
|---|---|---|---|---|---|
| Stocks | लाइव डेटा, नेटिव लूप | 144 | 3.9 ms | 0% | 36% |
| Stocks, स्क्रॉलिंग | लाइव डेटा, स्क्रॉल | 144 | 4.3 ms | 0% | 43% |
| Photos, स्क्रॉलिंग | स्क्रॉल | 143 | 2.1 ms | 0% | 9% |
| Lists, स्क्रॉलिंग | स्क्रॉल | 144 | 2.0 ms | 1% | 19% |
| Scrolling, स्क्रॉलिंग | स्क्रॉल | 143 | 2.1 ms | 0% | 7% |
| Navigation, स्क्रॉलिंग | स्क्रॉल | 144 | 0.8 ms | 0% | 9% |
| Form, स्क्रॉलिंग | स्क्रॉल | 144 | 0.8 ms | 0% | 12% |
| Resizable, स्क्रॉलिंग | स्क्रॉल | 143 | 0.4 ms | 0% | 4% |
| Dock, स्क्रॉलिंग | स्क्रॉल | 144 | 0.5 ms | 1% | 5% |
| Gestures | Springs, धड़कती हुई ring | 144 | 1.8 ms | 0% | 36% |
| Physics, स्क्रॉलिंग | स्क्रॉल (900 × 500 की विंडो) | 144 | 0.8 ms | 0% | 4% |
| Animations | नेटिव लूप | 144 | 1.0 ms | 0% | 28% |
| Canvas, स्क्रॉलिंग | स्क्रॉल, नेटिव लूप | 144 | 2.0 ms | 0% | 35% |
| Styles, स्क्रॉलिंग | स्क्रॉल, डोलता हुआ transform | 144 | 2.1 ms | 0% | 39% |
| Tailwind | `animate-*` utilities | 144 | 0.6 ms | 0% | 19% |
| Text, स्क्रॉलिंग | स्क्रॉल | 144 | 1.6 ms | 0% | 8% |
| Text View, स्क्रॉलिंग | स्क्रॉल | 144 | 1.1 ms | 0% | 10% |
| Images, स्क्रॉलिंग | स्क्रॉल, GIF और WebP फ्रेम | 143 | 4.8 ms | 2% | 23% |
| Components, स्क्रॉलिंग | स्क्रॉल | 144 | 1.0 ms | 1% | 11% |
| Overlays, स्क्रॉलिंग | स्क्रॉल (900 × 500 की विंडो) | 144 | 0.6 ms | 0% | 1% |
| Menus, स्क्रॉलिंग | स्क्रॉल (900 × 500 की विंडो) | 144 | 0.6 ms | 0% | 2% |
| Controls | ट्रांज़िशन | 117–144 | 1.5 ms | 0% | 22% |
| Web and video, स्क्रॉलिंग | स्क्रॉल | 144 | 1.6 ms | 0% | 15% |
| System | `requestAnimationFrame`, टाइमर | 144 | < 0.1 ms | 0% | 1% |
| Storage, स्क्रॉलिंग | स्क्रॉल (900 × 500 की विंडो) | 144 | 0.5 ms | 0% | 1% |

</div>

<a id="memory-2"></a>

### मेमोरी

स्थिर अवस्था में, शुरू होने के 3 s बाद (release runners, 1200 × 800 की विंडो)। *Private working set* वह मेमोरी है जो अकेली प्रोसेस इस्तेमाल करती है (Task Manager का Memory कॉलम); *private bytes* वह जो उसने commit की है; *working set* में सिस्टम की उन लाइब्रेरी के पेज भी जुड़ते हैं जिन्हें वह अन्य प्रोसेस के साथ साझा करती है (Direct3D, Direct2D, DirectWrite, GPU ड्राइवर):

<div class="data-table">

| ऐप | Private working set | Private bytes | Working set |
|---|---|---|---|
| Rust ऐप (`nsh init --template rust`) | ~14 MB | ~60 MB | ~53–71 MB |
| TSX counter (`examples/counter`) | ~15 MB | ~61 MB | ~56–71 MB |

</div>

Gallery के टूर के दौरान working set Stocks पर ~108–115 MB, Canvas पेज से ~230 MB, Text View पेज से ~320–340 MB और Web and video द्वारा WebView2 खोलने के बाद ~390–405 MB हो जाता है (इसके पेज WebView2 की अपनी प्रोसेस में चलते हैं), इसमें वह भी शामिल है जिसे वह जान-बूझकर cache करता है (डिकोड की गई images, 128 MB तक सीमित; Text View पेज के documents)।

<a id="app-size-2"></a>

### ऐप का आकार

`nsh init` द्वारा हर टेम्पलेट से बनाए गए hello world ऐप, जैसे `nsh package --target windows` उन्हें x86_64 के लिए बनाता है (Rust runners link-time optimization के साथ और stripped, जैसा Linux पर)। executable ऐप का `<Name>.exe` है; zip वह `.zip` है जो उसकी डायरेक्टरी के बगल में लिखा जाता है:

<div class="data-table">

| ऐप | किसमें लिखा गया | Executable | Zip |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 15.0 MB | 6.7 MB |
| Hello world (`--template ts`) | TSX, QuickJS पर | 28.6 MB | 12.4 MB |
| Hello world (`--template mixed`) | TSX और एक Rust crate | 26.3 MB | 11.5 MB |

</div>

ये संख्याएँ किन बातों से बनती हैं:

- **फ्रेम केवल बदलावों के लिए, केवल वहीं ड्रॉ होते हैं जहाँ बदलाव हुआ**: compositor की गति से चलने वाला ticker तब तक चलता है जब तक कोई नेटिव एनिमेशन, ट्रांज़िशन या frame callback चलता है। एक फ्रेम उन views के क्षेत्र ड्रॉ करता है जो बदले (जहाँ वे थे और जहाँ वे हैं), उन पिक्सेल के ऊपर जो विंडो रखती है, और केवल उन्हीं को compositor के सामने प्रस्तुत करता है (Stocks: प्रति फ्रेम ~34 views)।
- **Canvas अपना एनिमेटेड हिस्सा रिकॉर्ड करते हैं**: एक ड्रॉइंग Direct2D command lists के रूप में रिकॉर्ड होती है, किसी भी स्केल पर vector और तीखी। जब कोई एनिमेटेड वैल्यू बदलती है, तो केवल वे ऑपरेशन दोबारा रिकॉर्ड होते हैं जो एनिमेटेड वैल्यू पढ़ने वाले पहले ऑपरेशन से आगे हैं; उससे पहले का हिस्सा रखा जाता है (Stocks: 22 धड़कती sparklines और चार्ट के लिए प्रति सेकंड ~26 ms की रिकॉर्डिंग)।
- **केवल वही ड्रॉ होता है जो दिखता है**: scroll view या clipping view के जो children नज़र से बाहर हैं उन्हें फ्रेम से बाहर रखा जाता है, और जिन views का अपना कोई कंटेंट नहीं है वे अपनी background और border से ज़्यादा ड्रॉ नहीं करते।

## iOS (UIKit)

iOS simulator (ऊपर वाले MacBook Pro पर एक iPhone 18 Pro Max) में मापा गया, release builds, उसी टूर के साथ (`perf.py --target ios`: `nsh test --target ios --fps`, उँगली के touches जैसे UIKit को मिलते हैं)। simulator 60 Hz पर प्रस्तुत करता है; ProMotion स्क्रीन वाले iPhone पर NSH के display links स्क्रीन के 120 Hz पर चलते हैं (जो ऐप `nsh package` बनाता है और development host इसे `CADisableMinimumFrameDurationOnPhone` के साथ माँगते हैं)। फेज़ हैं *tick* (नेटिव एनिमेशन), *drain* (engine के batches लागू करना) और *scroll* (scroll view के पीछे जो चलता है: lists, sticky cells, bound values)।

<div class="data-table">

| पेज | फ्रेम का स्रोत | FPS | Frame p95 | CPU |
|---|---|---|---|---|
| Home, स्क्रॉलिंग | स्क्रॉल | 60 | 0.1 ms | 6% |
| Stocks | लाइव डेटा, नेटिव लूप | 60 | 0.3 ms | 22% |
| Stocks, स्क्रॉलिंग | लाइव डेटा, स्क्रॉल | 60 | 0.3 ms | 25% |
| Photos, स्क्रॉलिंग | स्क्रॉल | 60 | 1.2 ms | 6% |
| Lists, स्क्रॉलिंग | स्क्रॉल | 60 | 1.1 ms | 8% |
| Scrolling, स्क्रॉलिंग | स्क्रॉल | 60 | 0.1 ms | 7% |
| Navigation, स्क्रॉलिंग | स्क्रॉल | 60 | 0.2 ms | 7% |
| Form, स्क्रॉलिंग | स्क्रॉल | 60 | 0.3 ms | 7% |
| Gestures | Springs, धड़कती हुई ring | 60 | 0.3 ms | 3% |
| Animations | नेटिव लूप | 60 | 0.7 ms | 6% |
| Canvas | नेटिव लूप | 60 | 0.4 ms | 16% |
| Styles | डोलता हुआ transform | 60 | 0.4 ms | 4% |
| Tailwind, स्क्रॉलिंग | स्क्रॉल | 60 | 0.2 ms | 7% |
| Text, स्क्रॉलिंग | स्क्रॉल | 60 | 0.1 ms | 7% |
| Text View, स्क्रॉलिंग | स्क्रॉल | 60 | 0.1 ms | 6% |
| Images, स्क्रॉलिंग | स्क्रॉल | 60 | 0.1 ms | 5% |
| Components, स्क्रॉलिंग | स्क्रॉल | 60 | 0.2 ms | 6% |
| Overlays, स्क्रॉलिंग | स्क्रॉल | 60 | 0.1 ms | 6% |
| Menus, स्क्रॉलिंग | स्क्रॉल | 60 | 0.2 ms | 7% |
| Controls, स्क्रॉलिंग | स्क्रॉल, ट्रांज़िशन | 60 | 0.2 ms | 5% |
| Web and video, स्क्रॉलिंग | स्क्रॉल | 60 | 0.1 ms | 8% |
| System | `requestAnimationFrame`, टाइमर | 60 | 0.3 ms | 4% |
| Standard APIs, स्क्रॉलिंग | स्क्रॉल | 60 | 0.1 ms | 7% |
| Storage, स्क्रॉलिंग | स्क्रॉल | 60 | 0.1 ms | 8% |

</div>

*FPS* वह दर है जब कुछ हिल रहा हो, जैसा ऊपर बताया गया: simulator के 60 पर, हर फ्रेम पिछले के एक रिफ्रेश बाद आता है। जिस पेज पर कुछ नहीं हिलता वह कोई फ्रेम ड्रॉ नहीं करता और स्थिर अवस्था में 1–2% CPU लेता है। प्रोसेस gallery के होम पेज पर 40 MB और पूरे टूर के बाद ~180 MB रखती है (जान-बूझकर cache की गई images, Text View पेज के documents)।

iPhone 17 Pro (ProMotion, 120 Hz) पर, development host और स्क्रीन पर एक डेमो के साथ, एनिमेटेड पेज हर रिफ्रेश पर ड्रॉ करते हैं:

<div class="data-table">

| पेज | फ्रेम का स्रोत | FPS | Frame p95 | एक रिफ्रेश से ऊपर | CPU | मेमोरी |
|---|---|---|---|---|---|---|
| Stocks | लाइव डेटा, नेटिव लूप | 120 | 0.2–0.3 ms | 0% | 46–70% | 41–43 MB |
| Canvas | नेटिव लूप | 120 | 0.1 ms | 0% | 25–36% | 37–38 MB |
| Animations | नेटिव लूप | 120 | 0.2 ms | 0% | 3–11% | 37 MB |

</div>

Stocks प्रति सेकंड 20 बार commit करता है (हर 50 ms पर एक tick), हर commit में engine थ्रेड पर 1.5 ms JS और 1.4 ms core लगता है (p95 क्रमशः 2.2 और 2.0 ms), और वह थ्रेड 4–6% समय व्यस्त रहता है।

<a id="measuring-an-app"></a>

## ऐप को मापना

किसी ऐप को उसी तरह मापने के लिए, उसके टेस्ट या स्टेप `--fps` और `-v` के साथ `--target linux`, `macos`, `windows` या `ios` पर चलाएँ:

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
