---
title: "बैकवर्ड कम्पैटिबिलिटी"
description: "Native Shell रिलीज़ के बीच ऐप्स को कैसे चालू रखता है: एक कम्पैटिबल रिलीज़ क्या वादा करती है, nsh-compat में मौजूद वह रिकॉर्ड जिसमें इसके हर बदलाव दर्ज होते हैं, रिलीज़ फ़्लो, और किसी API को जोड़ने, उसका नाम बदलने या उसे बदलने का तरीका।"
order: 22
group: delivery
source_hash: 431c24b579dd57ba
---

# पश्चगामी संगतता (Backward Compatibility)

Host ऐप्स NSH ऐप्स को [signed packages](./signed-packages.md) के रूप में डाउनलोड करते हैं और उन्हें प्लगइन की तरह चलाते हैं। जो ऐप शिप हो चुका है, वह शायद दोबारा कभी build न हो: उसकी टीम आगे बढ़ चुकी होती है, उसका सोर्स किसी बिज़नेस प्रक्रिया में पड़ा रहता है, और host ऐप अपने समय-क्रम से NSH अपडेट करता है। इसलिए Native Shell हर ऐप से एक वादा निभाता है: **किसी संगत रिलीज़ के लिए बना ऐप हर बाद की रिलीज़ पर, बिना किसी बदलाव के, चलता है।** NSH अपडेट के बाद यदि कोई ऐप काम करना बंद कर दे, तो वह NSH का बग है।

यह पेज इस वादे, उसे लागू करने के तरीके, और उसके दायरे में रहकर NSH में बदलाव करने के तरीके का वर्णन करता है।

<a id="what-an-app-can-rely-on"></a>

## ऐप किस पर भरोसा कर सकता है

यह वादा हर उस चीज़ पर लागू होता है जिसे बना हुआ ऐप छूता है:

| हिस्सा | यह क्यों मायने रखता है |
| --- | --- |
| हर मॉड्यूल (`nsh`, `nsh/*`, `nsh/base`, standard modules) के exports और उनके members | एक bundle उन्हें नाम से import करता है: कोई नाम गायब हो तो ऐप शुरू ही नहीं होता। |
| `nsh:rt`, यानी वे फ़ंक्शन जिन्हें compiled JSX कॉल करता है | हर bundle में उसी compiler का आउटपुट होता है जिसने उसे build किया था। |
| globals (timers, `fetch`, `console`, ...) और उनके members | ऐप उन्हें नाम से कॉल करते हैं। |
| Element props, events और उनके payloads, style keys और उनके values | ऐप इन्हें नाम से पास करते हैं; नाम बदला हुआ prop नज़रअंदाज़ हो जाता है, जिससे ऐप गलत चलता है। |
| Tailwind utilities और variants | Classes रन टाइम पर bundle की strings से resolve होती हैं। |
| व्यवहार: defaults, units, payloads, callbacks का क्रम | ऐप उसी पर निर्भर करता है जो उसने लिखे जाते समय देखा था। |
| TypeScript declarations (`.nsh/types`) | जब किसी पुराने ऐप की टीम कोई बग ठीक करती है, तो उसका सोर्स अब भी type-check होता है। |
| पैकेज फ़ॉर्मैट और उसके signatures | पहले की रिलीज़ के लिए signed पैकेज अब भी verify होता है। |

इसे बनाए रखने वाले नियम:

1. **जो रिलीज़ में शिप हुआ, वह रहता है।** कोई module, export, member, prop, event, payload key, style key या value, Tailwind utility, global या `nsh:rt` फ़ंक्शन हटाया नहीं जाता।
2. **नाम बदलने पर पुराना नाम रहता है**, उसी implementation के alias के रूप में, जिस पर नए नाम के साथ `@deprecated` का चिह्न लगा होता है, हमेशा के लिए। किसी export को दूसरे module में ले जाने पर वह पुराने module में भी बना रहता है।
3. **Types केवल चौड़े होते हैं।** union में विकल्प जुड़ते हैं, फ़ंक्शन में overloads या अंत में वैकल्पिक parameters जुड़ते हैं, कोई parameter वैकल्पिक बन जाता है; ऐप जो कुछ पास करता है (props, styles, options) उसमें केवल वैकल्पिक members जुड़ते हैं। ऐप जो values पढ़ता है, वे भी इसी तरह बढ़ती हैं: `platform.os` में एक platform जुड़ता है, कोई state या reason एक नया case पाता है। ऐप ने जो case देखा था उसका value वही रहता है, और जो value ऐप नहीं जानता उसे वह संभालता है, `switch` के `default` से:

   ```tsx
   switch (platform.os) {
     case "ios":
     case "android":
       return <MobileLayout />;
     default:
       // The desktops, the web, and platforms NSH adds later.
       return <WideLayout />;
   }
   ```
4. **व्यवहार बना रहता है।** नया व्यवहार opt-in होता है, किसी नए prop, option या value के ज़रिए।
5. **`nsh:rt` केवल बढ़ता है**, और हर फ़ंक्शन अपना signature और अर्थ बनाए रखता है।
6. **Formats हमेशा पढ़े जाते हैं।** पहले की रिलीज़ के पैकेज, certificates, revocation lists और `app.json` बाद की रिलीज़ें पढ़ती हैं; पैकेज उस सबसे निचले runtime का नाम बताता है जिसकी उसे ज़रूरत है (`nsh publish --min-runtime`)।
7. **सुरक्षा एकमात्र अपवाद है।** जिस capability को सुरक्षित नहीं रखा जा सकता, उसे बंद कर दिया जाता है, कारण सहित सूचीबद्ध किया जाता है और release notes में नाम दिया जाता है।

यह वादा उस पहली रिलीज़ से शुरू होता है जो संगत के रूप में दर्ज है, और version number जो भी कहे, हमेशा के लिए लागू रहता है। रिलीज़ों के बीच, ऐसा API जो केवल `main` में है, अब भी बदल सकता है।

<a id="how-it-is-enforced"></a>

## इसे कैसे लागू किया जाता है

रिलीज़ों ने जो कुछ freeze किया, वह NSH के कोड से अलग अपनी ही repository में रहता है, [longbridge/nsh-compat](https://github.com/longbridge/nsh-compat)। NSH में कोई बदलाव उसके विरुद्ध चलता है और उसे edit नहीं कर सकता: जो pull request किसी API का नाम बदलता है, वह उसी API के record को दोबारा नहीं लिख सकता।

```
nsh                                       nsh-compat
├─ crates/          the code              ├─ releases/v<version>/   one per compatible release, never changed
└─ tests/compat/    apps that test the    │  ├─ runtime.txt         every export, global and nsh:rt function
   ├─ cases/        API being written     │  ├─ types/              the declarations apps build against
   └─ examples/                           │  ├─ tailwind.txt        every Tailwind class and what it sets
                                          │  └─ apps/               the test apps as that release built them
                                          ├─ closed.txt             security closures, each with its reason
                                          └─ src/                   the checks
```

NSH की हर pull request पर `nsh-compat` की checks उसके checkout के विरुद्ध चलती हैं (**Compat** workflow, या स्थानीय रूप से `cargo xtask compat`):

| Check | क्या पास होता है |
| --- | --- |
| `checkout_apps_run` | `tests/compat/` के ऐप्स, इस checkout से build होने पर, वही करते हैं जो उनकी scripts कहती हैं, और API का जो भी हिस्सा कोई script जाँचने का दावा करती है वह सचमुच जाँचा जाता है। |
| `nothing_released_is_removed` | हर दर्ज रिलीज़ ने जो कुछ दिया था (exports, members और उनके kinds, declarations, Tailwind classes और वे क्या सेट करती हैं) वह अब भी उपलब्ध है, वैसा ही या और चौड़ा। |
| `released_apps_run` | हर दर्ज रिलीज़ ने जो ऐप्स build किए थे, अपने compiler द्वारा build किए गए रूप में, इस runtime पर शुरू होते हैं और वही करते हैं जो उनकी scripts कहती हैं। |

पहली check उस API को परखती है जो लिखा जा रहा है; बाकी दो हर दर्ज रिलीज़ को थामे रखती हैं। किसी released API का नाम बदलने पर वह इस तरह fail होता है:

```
v0.2.0: runtime [nsh] Platform: removed
Keep it: a rename keeps the old name as a @deprecated alias of the new one, a type only widens.
```

`nsh-compat` की समीक्षा NSH के maintainers करते हैं, और उसकी अपनी CI उसे NSH के `main` के विरुद्ध चलाती है।

<a id="the-release-flow"></a>

## रिलीज़ का प्रवाह

1. **Develop।** कोई API `main` पर `tests/compat/` के एक case के साथ आता है जिसकी script उसे जाँचती है। जब तक कोई रिलीज़ उसे दर्ज नहीं करती, उसका नाम बदला जा सकता है या उसका रूप बदला जा सकता है; case भी उसके साथ बदलता है।
2. **Record।** रिलीज़ के समय, `cargo xtask compat record <version>` `releases/v<version>/` को `nsh-compat` के एक checkout में लिखता है: रिलीज़ जो surface देती है और `tests/compat/` का हर ऐप जो उसके compiler से build हुआ, उनकी scripts के साथ। यह केवल उसी API को दर्ज करता है जिसका हर हिस्सा कोई script जाँचती है।
3. **Freeze।** record को `nsh-compat` की pull request के ज़रिए merge किया जाता है। उसके बाद से NSH का हर बदलाव उसके, और हर पहले के record के, अधीन रहता है।

<a id="developing-within-the-promise"></a>

## वादे के दायरे में विकसित करना

<a id="adding-an-api"></a>

### API जोड़ना

हर नया export, global, prop, event या style key एक case के साथ आता है:

1. एक module `tests/compat/cases/<domain>/<case>.tsx` लिखें जिसका default export एक component हो जो API का उपयोग करे और उसका परिणाम दिखाए। domains हैं `base`, `core`, `events`, `layout`, `paint`, `props`, `modules` और `web`, साथ ही `android`, `macos` और `browser` उन चीज़ों के लिए जिन्हें कोई एक platform या कोई एक `nsh.json` setting तय करती है।
2. उसे domain के `App.tsx` में जोड़ें, जो एक समय में एक case दिखाता है।
3. domain के `script.txt` में steps जोड़ें: `tap id:case-<case>`, फिर वे steps जो जाँचते हैं कि API क्या करता है, और उसके द्वारा जोड़े गए हर हिस्से के लिए एक `covers <item>` step।
4. `cargo xtask compat` चलाएँ (`NSH_COMPAT_APP=<domain>` एक domain चलाता है)।

```txt
# props-media-video
tap id:case-props-media-video
prop id:clip src https://example.com/clip.mp4
prop id:clip paused true
tap id:play
prop id:clip paused false
covers [props] src
covers [props] paused
```

`covers` step सत्यापित होता है: ऐप को उस item का उपयोग करना होगा, और prop, event या style key के लिए, उसे build किए गए ऐप से हटाने पर script का कोई step fail होना चाहिए। Items के नाम इस प्रकार हैं: `[<module>] <export>`, `[globals] <name>`, `[props] <name>`, `[events] <name>`, `[styles] <name>`, किसी component के अपने items `[props] <Component>.<name>` के रूप में, और किसी platform के props `ios.<name>`, `android.<name>`, `desktop.<name>`, `web.<name>` के रूप में।

<a id="renaming-or-moving-an-api"></a>

### API का नाम बदलना या उसे ले जाना

नया नाम जोड़ें और पुराने को उसी implementation के alias के रूप में रखें, जिसे नए नाम के साथ `@deprecated` घोषित किया गया हो। case और उसकी script को नए नाम पर अपडेट करें। जिस API को अभी किसी रिलीज़ ने दर्ज नहीं किया, उसका बस नाम बदल दिया जाता है।

<a id="changing-a-type"></a>

### Type बदलना

उसे चौड़ा करें: union में और विकल्प, और overloads, अंत में वैकल्पिक parameters, ऐप जो पास करते हैं उसके वैकल्पिक नए members। ऐप जिस union को पढ़ते हैं उसमें भी इसी तरह members जुड़ते हैं, हर नया member एक नए case के लिए। Parameter के नाम बदलने के लिए स्वतंत्र हैं; उनकी गिनती, वैकल्पिकता और types वही रहते हैं।

<a id="changing-behavior"></a>

### व्यवहार बदलना

पुराना व्यवहार रखें और नया व्यवहार किसी नए prop, option या value के पीछे जोड़ें। जो बग फ़िक्स किसी चालू ऐप को दिखने वाली चीज़ बदल दे, वह भी व्यवहार का बदलाव है: उसे opt-in के पीछे रखें, या सुनिश्चित करें कि कोई ऐप पुराने परिणाम पर निर्भर नहीं कर सकता। व्यवहार को किसी case में एक step दें, ताकि वह जैसा है वैसा बना रहे।

<a id="changing-the-compiler"></a>

### Compiler बदलना

कुछ अतिरिक्त नहीं: हर रिलीज़ के ऐप वैसे ही रहते हैं जैसे उस रिलीज़ के compiler ने उन्हें build किया था, और cases आपके compiler से नए सिरे से build होते हैं। जो फ़ंक्शन वह bundles में emit करता है (`nsh:rt`) केवल बढ़ते हैं।

<a id="closing-an-api-for-security"></a>

### सुरक्षा के लिए API बंद करना

`nsh-compat` की एक pull request उसके `closed.txt` में कारण के साथ entry जोड़ती है (`<entry> -- <reason>`, वह entry जैसी check रिपोर्ट करती है), और पहले merge होती है; उसके बाद API हटाने वाला NSH का बदलाव पास हो जाता है। Release notes बताते हैं कि ऐसा क्यों किया गया।

## Scripts

`script.txt` में प्रति पंक्ति एक step होता है। कार्य करने वाले steps: `tap <selector>`, `type <selector> <text>`, `key <selector> <key>`, `scroll <selector> <x> <y>`, `touch start|move|end|cancel`, `event <selector> <onEvent>
[<key>=<value>...]`, `wait <ms>`, `keyboard <height> <duration>`, `pixelratio <ratio>`। जाँच करने वाले steps: `expect <text>`, `absent <text>`, `frame <selector> <x> <y> <width> <height>`, `origin`, `prop` / `noprop`, `style` / `nostyle`, `listens`, `state`, `statusbar`, `log <text>`। पहली पंक्तियाँ screen सेट कर सकती हैं: `viewport <w> <h>`, `platform <os> [desktop]`, `fontscale <scale>`। Selector `id:<testID>`, `label:<label>`, `text:<text>` या `span:<text>` होता है; props और styles वैसे ही लिखे जाते हैं जैसे ऐप लिखते हैं (`style id:card backgroundColor #3366ffff`)। `NSH_COMPAT_DUMP=1` प्रिंट करता है कि हर step screen में क्या जोड़ता और क्या हटाता है, ताकि script लिखना आसान हो।

## Commands

```sh
cargo xtask compat                      # the checks against this checkout
NSH_COMPAT_APP=props cargo xtask compat -v
cargo xtask compat record 0.2.0         # at a release: record it in nsh-compat, then open a pull request there
```

`cargo xtask compat` `target/nsh-compat/` में `nsh-compat` का एक checkout रखता है और हर रन पर उसे अद्यतन करता है; जिस checkout में अपने बदलाव हों, उसे जैसा है वैसा ही उपयोग किया जाता है, ताकि checks में किसी बदलाव को उसकी pull request से पहले NSH के विरुद्ध आज़माया जा सके।
