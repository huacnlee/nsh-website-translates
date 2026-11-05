---
title: "सैंडबॉक्स और Capabilities"
description: "वे सीमाएँ जिनके अंतर्गत हर NSH ऐप चलता है (मेमोरी, समय, नोड्स), release builds की भाषा-स्तरीय हार्डनिंग, और nsh.json में घोषित तथा होस्ट ऐप्स द्वारा प्रदान की जाने वाली capabilities।"
order: 21
group: delivery
source_hash: 4659e6a8ee8e724e
---

# सैंडबॉक्स और Capabilities

Rust में लिखा ऐप native code होता है। वह उसी ऐप में compile होकर ship होता है, जैसे ऐप का बाकी हिस्सा होता है, और उसी के trust के साथ चलता है। NSH की services (`fetch`, images, web views, status bar) में उसकी calls भी उन्हीं native checks से गुज़रती हैं जिनसे TSX की calls गुज़रती हैं, उस दायरे में जो host देता है। ऐप जो TSX और JavaScript चलाता है, चाहे वह उसका अपना हो या डाउनलोड किया गया [signed package](./signed-packages.md), प्रति view एक QuickJS VM में चलता है। उस VM के बाहर वे जो कुछ भी कर सकते हैं, वह NSH के native runtime से होकर जाता है। इससे ऐसा code चलाना संभव होता है जो आपने नहीं लिखा, जैसे third-party mini apps या डाउनलोड किए गए updates, उन नियमों के तहत जिन्हें host ऐप नियंत्रित करता है:

- **Limits** एक ऐप द्वारा उपयोग की जा सकने वाली memory, समय और native resources को सीमित करती हैं।
- **Hardening** release builds में strings को code में बदलने के सभी रास्ते हटा देती है।
- **Capabilities** बताती हैं कि ऐप किन चीज़ों तक पहुँच सकता है: वह किन hosts से fetch कर सकता है, web view कौन से पेज दिखा सकता है, और क्या वह status bar बदल सकता है। ऐप इन्हें declare करता है; host ऐप कम अनुमति दे सकता है।

bundle में केवल ऐप का code होता है: reactive graph, renderer और ऐप द्वारा import किया गया हर module native हैं। इसलिए JS में कुछ भी trusted नहीं है, और हर सीमा और check Rust में लागू होता है; ऐसा कोई JS code नहीं है जिसे patch करके ऐप इन्हें बायपास कर सके।

## Limits

Limits एक VM को सीमित करती हैं: ये TSX और JavaScript पर लागू होती हैं। किसी दूसरे ऐप में embed किया गया ऐप उन limits के भीतर चलता है जो उसका host ऐप तय करता है। अकेला चलने वाला ऐप (`nsh package` से package किया गया, web सहित, या `nsh run` से चलाया गया) आपका अपना code है, ठीक native ऐप की तरह: वह उतनी memory और समय इस्तेमाल करता है जितना device उसे देता है, और उसका 4096 KB का interpreter stack गहरी recursion को एक `RangeError` में बदल देता है जिसे ऐप catch कर सकता है।

Embedded ऐप की ये limits होती हैं:

| सीमा | डिफ़ॉल्ट | सीमा पार होने पर |
|---|---|---|
| JS heap | 256 MB | VM रुक जाता है। |
| Interpreter stack | 4096 KB (यही अधिकतम भी है) | गहरी recursion `RangeError` throw करती है, जिसे ऐप catch कर सकता है। |
| bundle को evaluate करने का समय | 10 s | evaluation बीच में काट दिया जाता है। |
| JS में किसी अन्य call का समय | 2 s | call काट दी जाती है; ऐप चलता रहता है। |
| रखे जा सकने वाले nodes | 200 000 | VM रुक जाता है। |
| एक साथ changes (queued operations) | 8 000 000 values | VM रुक जाता है। |
| एक canvas drawing में operations | 1 000 000 | VM रुक जाता है। |

**समय प्रति call के हिसाब से तय होता है, प्रति ऐप के हिसाब से नहीं।** "Call" वह एक काम है जो runtime JS से करवाता है: एक event संभालना (उससे होने वाली rendering सहित), एक list row bind करना, एक timer चलाना, एक frame के `requestAnimationFrame` callbacks चलाना, microtask queue को खाली करना। लंबे समय तक चलने वाला ऐप कभी सीमा की ओर समय जमा नहीं करता; केवल वही एक call बाधित होती है जो समय पर return नहीं करती। किसी दूसरी call के भीतर की गई calls बाहरी call का budget साझा करती हैं।

बाधित call एक ऐसे exception के साथ समाप्त होती है जिसे कोई `catch` निगल नहीं सकता, और error के साथ वह budget बताया जाता है जो पार हुआ:

```text
the script was interrupted: a call into JS exceeded its budget of 2000 ms
```

VM चलता रहता है: अगला event, timer या frame सामान्य रूप से चलता है।

**Memory खत्म होने या किसी quota के पार होने पर VM रुक जाता है।** error एक बार report होता है (host ऐप के error handler को, और development builds में ऐप के ऊपर), उसके बाद कोई JS नहीं चलता, और views जैसे थे वैसे ही रहते हैं। node और operation quotas इसलिए हैं क्योंकि native views और queued changes native memory में रहते हैं, जिसे JS heap limit कवर नहीं करती: इनके बिना कोई ऐप UI के ज़रिए device की memory खत्म कर सकता था।

> [!TIP]
> सामान्य ऐप्स के लिए ये limits काफ़ी उदार हैं। अगर आप 2 s के call budget तक पहुँचते हैं, तो वह काम वैसे भी एक event के लिए बहुत लंबा है: वह उतनी देर तक ऐप के updates को फ़्रीज़ कर देगा। उसे `setTimeout` से बाँटें, या event handler से बाहर ले जाएँ।

Host ऐप limits प्रति view सेट करते हैं: [iOS](./ios.md#limits) पर `NshAppView.limits`, [Android](./android.md#limits) पर `NshView.setLimits`, [GPUI app](./gpui.md#embedding-in-a-gpui-app) में `AppOptions::limits` / `AppView::set_limits`। ये अगले load से लागू होती हैं।

Development में यह देखने के लिए कि TSX ऐप किसी host ऐप की limits के भीतर क्या करता है, उसे [`--limits`](./cli.md#nsh-run) के साथ चलाएँ: `nsh run App.tsx --limits` ऊपर दिए गए defaults इस्तेमाल करता है, और `nsh run --limits memory=128MB,call=500ms` उन दोनों को वैसे सेट करता है जैसे host ऐप करता है, बाकी अपने defaults पर रहती हैं।

## Hardening

Release builds (वह सब कुछ जो dev server से load नहीं होता) load होते समय hardened किए जाते हैं:

- `eval` हटा दिया जाता है, और `Function`, `AsyncFunction`, `GeneratorFunction` तथा `AsyncGeneratorFunction` constructors throw करते हैं। NSH strings से बना कोई code नहीं चलाता:

  ```text
  TypeError: the Function constructor is disabled: nsh runs no code from strings (development builds allow it)
  ```

- वे prototypes जो सभी modules साझा करते हैं (`Object`, `Array`, `Function`, `String`, `Number`, `Promise`, `Map`, typed arrays और बाकी) frozen होते हैं, ताकि कोई एक module (या एक library) बाकी सबके लिए `Array.prototype` न बदल सके। `Error.prototype` writable रहता है, ताकि error subclasses `this.name` सेट कर सकें।

Prototypes को freeze करने से सामान्यतः एक आम pattern टूट जाता, यानी "override mistake": जब inherited property frozen हो, तब `Sub.prototype.constructor = Sub` या `obj.toString = …` असाइन करना throw करता है। NSH आम तौर पर override किए जाने वाले members (`constructor`, `toString`, `valueOf`, `toJSON`, ...) को accessors में बदल देता है, जिनका setter उसी object पर property define करता है जिसे असाइन किया जा रहा है। इस तरह ऐसा code (और axios जैसी libraries जो इसका उपयोग करती हैं) काम करता रहता है।

`nsh dev` / `nsh run` (`--release` के साथ या बिना) द्वारा serve किए गए bundles hardened नहीं होते, इसलिए आप `eval` से debug कर सकते हैं। dynamic code पर निर्भर code ship करने से पहले release behavior को `nsh test` (जो harden करता है) या packaged build से test करें।

## Capabilities

ऐप `nsh.json` में declare करता है कि वह अपने VM के बाहर किन चीज़ों तक पहुँच सकता है:

```json
{
  "name": "Quotes",
  "id": "com.example.quotes",
  "version": "1.0.0",
  "build": 3,
  "capabilities": {
    "network": {
      "hosts": ["api.example.com", "*.cdn.example.com"],
      "http": [{ "host": "quotes.example.com", "methods": ["GET"], "pathPrefix": "/v1/" }],
      "sockets": ["feed.example.com:7000"]
    },
    "webview": { "hosts": ["*.example.com"], "input": true },
    "statusBar": true,
    "clipboard": true,
    "picker": true,
    "speech": true,
    "host": ["getUserInfo", "bridge.*"],
    "openUrl": { "schemes": ["https", "mailto"] }
  }
}
```

**`"capabilities"` के बिना ऐप सब कुछ कर सकता है**: standalone ऐप उसके developer का अपना होता है, और कुछ भी प्रतिबंधित नहीं होता। Raw TCP sockets हर ऐप में नाम से दिए जाते हैं, `network.sockets` के ज़रिए, और host के functions `host` के ज़रिए। **`"capabilities"` वाला ऐप केवल वही कर सकता है जो वह सूचीबद्ध करता है**: बाकी सब अस्वीकृत है। अज्ञात keys build errors हैं, इसलिए typo build के समय पकड़ी जाती है, बजाय runtime पर किसी गायब permission में बदलने के। नए NSH से आया [signed package](./signed-packages.md#packages-from-newer-versions-of-nsh) ऐसी capabilities declare कर सकता है जिन्हें पुराना runtime नहीं जानता: वहाँ वे नहीं दी जातीं।

### `network`

इसमें `fetch` (हर redirect सहित), WebSockets, remote images (`<Image>`, `placeholder`, canvas images, `Image.getSize` / `Image.prefetch`), video sources और raw TCP sockets (`net.connect`) आते हैं।

| कुंजी | प्रकार | विवरण |
|---|---|---|
| `hosts` | `string[]` | वे hosts जिन तक ऐप किसी भी method और scheme से पहुँच सकता है (`http`, `https`, `ws`, `wss`)। |
| `http` | `object[]` | बारीक अनुमतियाँ: एक host, जिसे नीचे की किसी भी key से सीमित किया गया हो। |
| `http[].host` | `string` | host या host pattern (अनिवार्य)। |
| `http[].methods` | `string[]` | अनुमत methods, जैसे `["GET", "HEAD"]`। न हो तो: कोई भी। |
| `http[].schemes` | `string[]` | अनुमत schemes (`scheme`: एक, string के रूप में)। न हो तो: `http`, `https`, `ws`, `wss` में से कोई भी। |
| `http[].port` | `number` | port; बिना port वाले URL का port उसके scheme का default होता है (`https` के लिए 443)। न हो तो: कोई भी। |
| `http[].paths` | `string[]` | सटीक paths, जैसे `["/v1/quote"]` (query path का हिस्सा नहीं है)। |
| `http[].pathPrefixes` | `string[]` | पूरे segments को कवर करने वाले path prefixes: `/v1` `/v1` और `/v1/quote` को कवर करता है, `/v1/` उसके बाद आने वाली हर चीज़ को। `pathPrefix` (एक, string के रूप में) और `path_prefixes` एक जैसे पढ़े जाते हैं। |
| `sockets` | `string[]` | [`net.connect`](../modules/standard-modules.md) के लिए raw TCP destinations, हर एक सटीक `"host:port"` (IPv6 के लिए `"[::1]:9000"`)। |

अगर किसी `http` rule में `paths` या `pathPrefixes` सूचीबद्ध नहीं है, तो वह हर path को कवर करता है, और दोनों होने पर उनमें से किसी से भी मेल खाने वाला path कवर होता है।

Host patterns `*` (कोई भी host), `*.example.com` (`example.com` का कोई भी subdomain, `example.com` स्वयं नहीं) या सटीक host name होते हैं। मिलान में case और port को अनदेखा किया जाता है। host आखिरी `@` के बाद से लिया जाता है, इसलिए `https://api.example.com@evil.io/` को `evil.io` के रूप में जाँचा जाता है।

WebSocket handshake एक HTTP GET है: `ws://` को `http://` और `wss://` को `https://` के रूप में जाँचा जाता है, इसलिए वे hosts और `http` अनुमतियाँ जो URL के GET की अनुमति देती हैं, WebSocket की भी अनुमति देती हैं। Raw socket हर HTTP rule के पार पहुँच जाता है, इसलिए `sockets` हर host और port को सटीक रूप से सूचीबद्ध करता है, और केवल `sockets` उन्हें अनुमति देता है।

`asset:` URIs (ऐप की अपनी files) हमेशा अनुमत हैं; images और videos `data:` URIs और relative paths भी इस्तेमाल कर सकते हैं।

### `webview`

| कुंजी | प्रकार | विवरण |
|---|---|---|
| `hosts` | `string[]` | वे hosts जिन्हें [web view](./web-view-and-video.md) दिखा सकता है और जिन पर navigate कर सकता है (`http` और `https`)। `webview` के बिना ऐप web pages बिल्कुल नहीं दिखा सकता। |
| `input` | `boolean` | web view का ref उसके पेज को trusted input दे सकता है ([`sendInput`](./web-view-and-video.md#input-as-the-users-own))। declare किए बिना कभी नहीं दिया जाता, `"capabilities"` के बिना वाले ऐप के लिए भी नहीं। |

Web view के भीतर top-level navigations भी, load होने से पहले, platform के navigation delegate द्वारा जाँची जाती हैं। पेज के अपने subresources (उसके scripts, images, XHRs) web content का मामला हैं और जाँचे नहीं जाते। `about:blank` और inline HTML (`html`) को अनुमत होने के लिए केवल web views की अनुमति चाहिए: `"webview": { "hosts": [] }` उन्हें बिना किसी remote पेज की अनुमति दिए सक्षम करता है।

`input` को `hosts` से अलग रखा गया है क्योंकि trusted input के साथ user activation आता है, जो `injectJavaScript` को कभी नहीं मिलता: तब पेज windows खोल सकता है, clipboard में लिख सकता है, system का file panel खोल सकता है, WebAuthn या permission prompts शुरू कर सकता है और `isTrusted` जाँचने वाला कोई भी बटन दबा सकता है। इसके बिना core `sendInput` को छोड़ देता है और log करता है कि कौन सी key जोड़नी है।

### `statusBar`

`"statusBar": true` ऐप को status bar बदलने देता है ([`nsh/base`](../modules/nsh-base.md#status-bar) में pages और dialogs का `statusBar`, और `nsh.json` का `"statusBar"` default)।

### `clipboard`

`"clipboard": true` ऐप को system clipboard पढ़ने और लिखने देता है ([`Clipboard`](../modules/nsh.md#clipboard))। selectable text के edit menu से copy करना user का अपना कार्य है और इसके लिए किसी capability की ज़रूरत नहीं।

### `picker`

`"picker": true` ऐप को photos के लिए system का picker दिखाने देता है ([`Picker`](../modules/nsh.md#picker)): user जो चुनता है वही ऐप तक पहुँचता है।

### `speech`

`"speech": true` ऐप को यह पहचानने देता है कि user क्या बोलता है ([`Speech`](../modules/nsh.md#speech)): microphone और system का speech recognizer, जिसका transcript ऐप तक पहुँचता है। system फिर भी user से एक बार पूछता है।

### `openUrl`

ऐप को अपने बाहर URLs खोलने देता है ([`openUrl`](../modules/nsh.md#openurl), `links="open"` वाले `TextView` के links): हर scheme के लिए `"openUrl": true`, सूचीबद्ध schemes के लिए `"openUrl": { "schemes": ["https", "mailto"] }`। जिस URL का scheme अनुमत नहीं है, वह `ERR_ACCESS_DENIED` (`permission` `"openUrl"`, `resource` URL) के साथ reject होता है। जो URLs code चलाएँगे या ऐप के अपने data तक पहुँचेंगे (`javascript:`, `data:`, `file:`, ...) वे capability चाहे जो हो, कभी नहीं खोले जाते।

### Storage

हर ऐप [`Storage`](../modules/nsh.md#storage) से device पर अपना data रख सकता है, किसी capability के बिना: storage में केवल उसी ऐप का data होता है, और embedding ऐप तय करता है कि वह कहाँ रखा जाए।

### `host`

`host` उस NSH को embed करने वाले ऐप के वे functions सूचीबद्ध करता है जिन्हें `nsh` का `host.call(name, args)` call कर सकता है: सटीक names (`"getUserInfo"`) या `*` पर समाप्त होने वाले prefixes (`"bridge.*"` `bridge.call` और `bridge.share` से मेल खाता है)। `"host": true` हर function की अनुमति देता है। सूचीबद्ध न किया गया function अस्वीकार कर दिया जाता है, `"capabilities"` के बिना वाले ऐप में भी: host के functions कभी default रूप से नहीं दिए जाते, और `nsh` से `host` import करने वाले ऐप को `host` के बिना build करने पर चेतावनी मिलती है कि हर call अस्वीकार होगी। Names 1 से 128 characters के होते हैं, जो `A`–`Z`, `a`–`z`, `0`–`9`, `_`, `.`, `:` और `-` में से हों, `..` के बिना; किसी अन्य name की call अनुमतियाँ पढ़ने से पहले ही अस्वीकार कर दी जाती है। prefix को separator (`"bridge.*"`) पर समाप्त करें: `"bridge*"` `bridgeAdmin` से भी मेल खाता है। host के events (`host.on(event, listener)`) ऐप के listeners तक वैसे ही पहुँचते हैं जैसे host उन्हें भेजता है।

```ts
import { host } from "nsh";

if (host.available()) {
  const user = await host.call("getUserInfo");
  const stop = host.on("loginChanged", (payload) => console.log(payload));
  stop();
}
```

`host.available()` उन platforms पर true है जो host को embed करते हैं; अन्यत्र `host.call` `code` `"ERR_FEATURE_UNAVAILABLE_ON_PLATFORM"` के साथ reject होता है।
<a id="what-a-refusal-looks-like"></a>

### अस्वीकृति कैसी दिखती है

| अनुरोध | परिणाम |
|---|---|
| `fetch` | प्रॉमिस एक `TypeError` के साथ reject होता है, जैसा हर विफल अनुरोध में होता है; इसका `code` `ERR_ACCESS_DENIED` होता है, `permission` `"network"` है और `resource` में URL होता है (अनुरोध का, या रीडायरेक्ट का); अनुरोध कभी नेटवर्क तक नहीं पहुँचता। |
| `Image.getSize`, `Image.prefetch` | प्रॉमिस `ERR_ACCESS_DENIED` के साथ reject होता है, `permission` `"network"` है और `resource` में URL होता है; इमेज कभी अनुरोध नहीं की जाती। |
| रिमोट इमेज, वीडियो सोर्स, वेब व्यू सोर्स या `html` | कुछ नहीं दिखाया जाता, और एलिमेंट का `onError` इसे `code` `"ERR_ACCESS_DENIED"` के साथ रिपोर्ट करता है। किसी ऐसे host पर वेब व्यू का नेविगेशन जिसकी अनुमति नहीं दी गई, रद्द कर दिया जाता है और उसी तरह रिपोर्ट किया जाता है। |
| स्टेटस बार में बदलाव, कैनवास इमेज | कुछ नहीं बदलता या बनाया जाता; अस्वीकृति लॉग की जाती है। |
| क्लिपबोर्ड | `Clipboard` का हर फ़ंक्शन `ERR_ACCESS_DENIED` के साथ reject होता है, `permission` `"clipboard"` है और `resource` `""` है; सिस्टम क्लिपबोर्ड को कभी छुआ नहीं जाता। |
| पिकर | `pickImages` कुछ नहीं दिखाता और `ERR_ACCESS_DENIED` के साथ reject होता है, `permission` `"picker"` है और `resource` `""` है। |
| स्पीच | `Speech.start` `ERR_ACCESS_DENIED` throw करता है, `permission` `"speech"` है और `resource` `""` है; माइक्रोफ़ोन बंद रहता है। |
| `openUrl` | प्रॉमिस `ERR_ACCESS_DENIED` के साथ reject होता है, `permission` `"openUrl"` है और `resource` में URL होता है; कुछ नहीं खुलता। |
| होस्ट कॉल | `host.call` `ERR_ACCESS_DENIED` के साथ reject होता है (`host.post` इसे throw करता है), `permission` `"host"` है और `resource` में फ़ंक्शन का नाम होता है; कॉल कभी host तक नहीं पहुँचता। |
| फ़ाइलें (`fs/promises`) | प्रॉमिस `ERR_ACCESS_DENIED` के साथ reject होता है, `permission` `"fs"` है और `resource` में पाथ होता है; डिस्क को कभी छुआ नहीं जाता। |
| प्रोसेस (`process`) | `run` reject होता है, और `spawn` तथा `exit` throw करते हैं, `ERR_ACCESS_DENIED` के साथ, `permission` `"process"` है और `resource` में कमांड होता है (`exit` के लिए `"exit"`); कोई चाइल्ड प्रोसेस शुरू नहीं होता। |
| TCP सॉकेट (`net.connect`) | प्रॉमिस `ERR_ACCESS_DENIED` के साथ reject होता है, `permission` `"network"` है और `resource` में `"host:port"` होता है, किसी भी DNS लुकअप से पहले। |
| WebSocket | `websocket` मॉड्यूल का `connect` `ERR_ACCESS_DENIED` के साथ reject होता है, `permission` `"network"` है और `resource` में URL होता है; ग्लोबल `WebSocket` पहले `error` और फिर `close` (कोड 1006) फ़ायर करता है, जैसा विफल होने वाला कनेक्शन करता है। |

[स्टैंडर्ड मॉड्यूल](../modules/standard-modules.md#failures) की एरर में `code` `"ERR_ACCESS_DENIED"` होता है, ताकि ऐप अस्वीकृति को विफल ऑपरेशन से अलग पहचान सके, और उनके `permission` तथा `resource` में कैपेबिलिटी और जो माँगा गया था, उसका नाम होता है। [`nsh`](../modules/nsh.md) के मॉड्यूल भी इसी तरह अस्वीकार करते हैं: उनके प्रॉमिस `ERR_ACCESS_DENIED`, `permission` और `resource` के साथ reject होते हैं (`fetch` एक `TypeError` के साथ, जो हर विफल अनुरोध की क्लास है)।

```ts
import { Clipboard } from "nsh";

try {
  await Clipboard.writeText(link);
} catch (error) {
  if (error.code !== "ERR_ACCESS_DENIED") throw error;
  console.warn(`${error.permission} is not granted`); // "clipboard"
}
```

Rust कॉम्पोनेंट को वही अस्वीकृतियाँ Rust की शैली में मिलती हैं: अस्वीकृत क्लिपबोर्ड रीड वही उत्तर देता है जो खाली क्लिपबोर्ड देता है, अस्वीकृत पिक कोई फ़ाइल नहीं लौटाता, अस्वीकृत `open_url` `false` लौटाता है और अस्वीकृत `fetch` संदेश के साथ एक `Err` लौटाता है।

हर अस्वीकृति एक बार लॉग की जाती है, और बताती है कि कौन सी की जोड़नी है:

```text
fetch GET https://evil.example.org/x is not granted: add `evil.example.org` to capabilities.network in nsh.json
```

रीडायरेक्ट को प्लेटफ़ॉर्म का HTTP स्टैक नहीं, बल्कि NSH फ़ॉलो करता है, इसलिए हर हॉप की जाँच कैपेबिलिटी के विरुद्ध की जाती है। (स्ट्रीम की गई रिक्वेस्ट बॉडी दो बार नहीं भेजी जाती, इसलिए स्ट्रीम किए गए अपलोड का `307` / `308` रीडायरेक्ट विफल हो जाता है।)

<a id="where-capabilities-travel"></a>

### कैपेबिलिटी कहाँ-कहाँ साथ जाती हैं

घोषणा ऐप के साथ वहाँ-वहाँ जाती है जहाँ ऐप जाता है:

- `nsh build` और `nsh package` इसे बंडल के बगल में `capabilities.json` के रूप में लिखते हैं;
- `nsh publish` इसे [साइन किए गए पैकेज](./signed-packages.md) के हेडर में रखता है, जो सिग्नेचर से कवर होता है;
- `nsh dev` इसे हर बिल्ड के साथ भेजता है, इसलिए डेवलपमेंट में भी वही नियम लागू होते हैं। `capabilities` बदलने पर ऐप हॉट-पैच होने के बजाय रीलोड होता है।

<a id="grants-what-a-host-app-allows"></a>

## ग्रांट: होस्ट ऐप क्या अनुमति देता है

NSH को एम्बेड करने वाला होस्ट ऐप उसी JSON रूप में कुछ कैपेबिलिटी **अधिकतम** ग्रांट कर सकता है:

```rust
// iOS, in Rust (nsh_platform_ios::AppView)
let grant = nsh_engine::Capabilities::from_json(&serde_json::json!({
    "network": { "hosts": ["api.example.com"] }
}))?;
app.set_granted_capabilities(Some(grant));
```

```swift
// iOS
try app.grantCapabilities(#"{ "network": { "hosts": ["api.example.com"] } }"#)
```

```java
// Android
nsh.setGrantedCapabilities("{ \"network\": { \"hosts\": [\"api.example.com\"] } }");
```

किसी अनुरोध को ऐप की घोषणा **और** होस्ट की ग्रांट, दोनों से अनुमति मिलनी चाहिए। ऊपर दी गई ग्रांट के साथ, जो ऐप `"hosts": ["*"]` घोषित करता है वह भी केवल `api.example.com` तक पहुँच सकता है, और वेब पेज नहीं दिखा सकता या स्टेटस बार नहीं बदल सकता। ग्रांट के बिना (`nil` / `null`, डिफ़ॉल्ट), हर ऐप जो घोषित करता है वही लागू होता है।

ग्रांट अगले लोड से लागू होती हैं। थर्ड-पार्टी मिनी ऐप के लिए एक सामान्य सेटअप: हर ऐप को केवल उसका अपना API host ग्रांट करें, उसे [साइन किए गए पैकेज](./signed-packages.md) से चलाएँ जिसकी घोषणा आपने समीक्षा की हो, और डिफ़ॉल्ट लिमिट रखें या उन्हें घटा दें।

> [!WARNING]
> होस्ट ऐप द्वारा रजिस्टर किए गए [नेटिव कॉम्पोनेंट](./native-components.md) होस्ट का अपना कोड होते हैं: उन पर कैपेबिलिटी लागू नहीं होतीं। केवल वही कॉम्पोनेंट रजिस्टर करें जो हर उस ऐप के लिए सुरक्षित हों जिसे व्यू चला सकता है।

<a id="summary"></a>

## सारांश

| लेयर | कौन लागू करता है | कौन सेट करता है |
|---|---|---|
| लिमिट (heap, stack, समय, नोड) | रनटाइम, प्रति VM | होस्ट ऐप, प्रति व्यू (एम्बेड किए गए ऐप) |
| हार्डनिंग | रनटाइम, लोड पर | डेवलपमेंट के बाहर हमेशा चालू |
| कैपेबिलिटी | रनटाइम (fetch, इमेज, वीडियो, वेब व्यू, स्टेटस बार, फ़ाइलें, प्रोसेस, सॉकेट) | ऐप (`nsh.json`) और होस्ट ऐप (ग्रांट) |
| कोड इंटीग्रिटी | सिग्नेचर सत्यापन | `nsh publish`; होस्ट ऐप के ट्रस्टेड रूट |

<a id="see-also"></a>

## यह भी देखें

- [साइन किए गए पैकेज](./signed-packages.md)
- [नेटवर्किंग](./networking.md)
- [iOS ऐप में एम्बेड करना](./ios.md), [Android ऐप में एम्बेड करना](./android.md)
