---
title: "मॉड्यूल"
description: "NSH ऐप द्वारा इम्पोर्ट किए जाने वाले मॉड्यूल, प्रत्येक मॉड्यूल क्या एक्सपोर्ट करता है, और उन्हें कैसे व्यवस्थित किया गया है।"
order: 1
source_hash: c212e0667eddb588
---

# मॉड्यूल

एक NSH ऐप अपनी ज़रूरत की हर चीज़ मॉड्यूल के एक छोटे से समूह से इम्पोर्ट करता है। ये सभी नेटिव हैं: रिएक्टिव ग्राफ़, रेंडरर और हर मॉड्यूल रनटाइम के अंदर Rust में इम्प्लीमेंट किए गए हैं, और बंडलर `import ... from "nsh/..."` को आपके बंडल में कोड कॉपी करने के बजाय इम्पोर्ट के रूप में ही रखता है। आपके बंडल में केवल आपका अपना कोड होता है।

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## तीन लेयर

NSH का UI तीन लेयर में बना है, ठीक GPUI Kit की तरह (`gpui`, `gpui-base`, `gpui-component`):

| लेयर | मॉड्यूल | ऐप को यह क्या देती है |
|---|---|---|
| प्रिमिटिव | `nsh`, `nsh/mobile`, `nsh/desktop` | रिएक्टिविटी, होस्ट एलिमेंट, लेआउट, लिस्ट, कैनवास, एनिमेशन, जेस्चर, डिवाइस की जानकारी और प्लेटफ़ॉर्म के अपने API |
| बेस कंपोनेंट | [`nsh/base`](./nsh-base.md) | बिना स्टाइल वाले कंपोनेंट जो व्यवहार, स्टेट, फ़ोकस और एक्सेसिबिलिटी संभालते हैं: बटन, Markdown और HTML डॉक्यूमेंट, नेविगेशन स्टैक और डायलॉग, तथा सिस्टम के डायलॉग, हर प्लेटफ़ॉर्म पर |
| कंपोनेंट लाइब्रेरी | आपके ऐप की अपनी, या समुदाय की कोई लाइब्रेरी | लुक वाले बटन, कार्ड, रो और स्क्रीन |

ऐप का लुक ऐप का अपना होता है। उसकी कंपोनेंट लाइब्रेरी तीसरी लेयर है: वे कंपोनेंट जो वह [होस्ट एलिमेंट](../elements/index.md) और `nsh/base` से लिखता है और जिन्हें `style`, [Tailwind](../docs/tailwind.md) क्लास और अपनी थीम से स्टाइल करता है, वे Rust कंपोनेंट जो वह [अपने क्रेट](../docs/rust.md) में शिप करता है, या समुदाय द्वारा इसी आधार पर प्रकाशित कोई लाइब्रेरी।

कोई सर्व-समावेशी मॉड्यूल नहीं है: हर API ठीक एक ही जगह रहता है। मोबाइल प्लेटफ़ॉर्म के API `nsh/mobile` (iOS और Android) में हैं और डेस्कटॉप के API `nsh/desktop` (macOS, Windows, Linux) में; दोनों को हर प्लेटफ़ॉर्म पर इम्पोर्ट किया जा सकता है, इसलिए एक ही बंडल हर जगह चलता है (अन्य प्लेटफ़ॉर्म पर इनके कॉल तुरंत लौट आते हैं, और `platform.os` बताता है कि आप किस प्लेटफ़ॉर्म पर हैं)।

टाइप रनटाइम से जनरेट किए जाते हैं: `nsh init`, `nsh build`, `nsh dev` और `nsh test` आपके ऐप के बगल में `.nsh/types` लिखते हैं, इसलिए TypeScript डिक्लेरेशन हमेशा उस रनटाइम से मेल खाते हैं जिसके साथ आप बिल्ड करते हैं ([प्रोजेक्ट संरचना](../docs/project-structure.md) देखें)।

<a id="all-modules"></a>

## सभी मॉड्यूल

| मॉड्यूल | एक्सपोर्ट | पेज |
|---|---|---|
| `nsh` | `signal`, `computed`, `effect`, `batch`, `untracked`, `cleanup`, `context`, `split`, `mount`, `ErrorBoundary`; प्रिमिटिव `View`, `Text`, `Scroll`, [`List`](./nsh-list.md), [`Image`](./nsh-image.md) (`Image.getSize`, `Image.prefetch` के साथ), [`Canvas`](./nsh-canvas.md) (`Path2D`, `CanvasRenderingContext2D`, `CanvasGradient` के साथ), [`WebView`](./nsh-webview.md), [`Video`](./nsh-video.md); `safeArea`, `safeAreaInsets`; `Keyboard`, `keyboardFrame`; [एनिमेशन](./nsh.md#animation) (`createAnimatedValue`, `AnimatedValue`, `AnimatedNode`, `Animated`, `Easing`, `LayoutAnimation`); [एनवायरनमेंट](./nsh.md#device) (`windowSize`, `colorScheme`, `setColorScheme`, `fontScale`, `pixelRatio`, `locale`, `platform`, `openUrl`); [`PanResponder`](./nsh.md#panresponder); [`Clipboard`](./nsh.md#clipboard); [`Picker`](./nsh.md#picker); [`Storage`](./nsh.md#storage); [`host`](./nsh.md#host) (`available`, `call`, `on`, साथ ही नेटिव SDK `params` और `post`); [`keymap`](./nsh.md#keymap) (कीबोर्ड शॉर्टकट: `mod+k`, `ctrl+shift+p`, ...); [`nativeComponent`, `nativeModule`](./nsh.md#nativecomponent-and-nativemodule) (वे कंपोनेंट और फ़ंक्शन जिन्हें एम्बेड करने वाला ऐप रजिस्टर करता है); [एक्सेसिबिलिटी](./nsh.md#accessibility) (`announce`, `setAccessibilityFocus`, `screenReaderEnabled`, `reduceMotion`); एलिमेंट, स्टाइल, इवेंट और JSX के टाइप (`ViewRef`, `InputRef`, ..., `ViewStyle`, ...) | [nsh](./nsh.md) |
| `nsh/base` | `Button`, `Input`; `TextView`; `createNavStack`, `NavStack`, `NavPage`, `Dialog`; `AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`, `TabBar` (सिस्टम का टैब बार, iOS और Android), `InputAccessoryView` (iOS), `BackHandler` (Android) | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`, `Window` (टाइटल, टाइटल बार, मैक्सिमाइज़, फ़ुल स्क्रीन), `titleBar`, `Menu` (एप्लिकेशन मेनू, कॉन्टेक्स्ट मेनू) | [nsh/desktop](./nsh-desktop.md) |
| स्टैंडर्ड मॉड्यूल | `buffer`, `console`, `crypto`, `fs/promises`, `net`, `os`, `path`, `process`, `url`, `websocket`, `zlib` | [स्टैंडर्ड मॉड्यूल](./standard-modules.md) |
| ग्लोबल | `fetch`, `URL`, `TextEncoder`, `Blob`, `FormData`, `AbortController`, `Intl`, टाइमर, `console`, `requestAnimationFrame`, ... (इम्पोर्ट की ज़रूरत नहीं) | [ग्लोबल API](./globals.md) |

वे रेफ़रेंस पेज जो मॉड्यूल नहीं हैं:

| पेज | क्या कवर करता है |
|---|---|
| [स्टाइल रेफ़रेंस](./style-reference.md) | हर स्टाइल की, उसका टाइप और अर्थ |
| [Tailwind रेफ़रेंस](./tailwind-reference.md) | वे Tailwind यूटिलिटी और वेरिएंट जिन्हें `class` स्वीकार करता है |

<a id="host-elements"></a>

## होस्ट एलिमेंट

होस्ट एलिमेंट ऐसे कंपोनेंट हैं जिन्हें बाकी सब की तरह ही इम्पोर्ट किया जाता है: `View`, `Text`, `Scroll`, `Image`, `List`, `Canvas`, `WebView`, `Video` और `Overlay` `nsh` से, बेस कंपोनेंट (`Button`, `Input`, `Dialog`, `NavStack`, `NavPage`) `nsh/base` से, `InputAccessoryView` `nsh/mobile` से। केवल `If` और `Each` ग्लोबल हैं। कंपाइलर एलिमेंट को उसी जगह बना देता है, इसलिए इम्पोर्ट पर रनटाइम में कोई लागत नहीं आती। इनके प्रॉप्स [एलिमेंट](../elements/index.md) के अंतर्गत डॉक्यूमेंट किए गए हैं।
