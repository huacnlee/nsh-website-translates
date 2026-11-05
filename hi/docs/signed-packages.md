---
title: "हस्ताक्षरित पैकेज"
description: "ऐसा ऐप कोड शिप करें जिसे होस्ट ऐप डाउनलोड और सत्यापित करते हैं: कुंजियाँ, प्रमाणपत्र, nsh publish, दोबारा हस्ताक्षर करना, सत्यापन, निरस्तीकरण और रोलबैक सुरक्षा।"
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---

# हस्ताक्षरित पैकेज

हस्ताक्षरित पैकेज (`.nshpkg`) वह तरीका है जिससे कोई host app ऐसा NSH कोड चलाता है जो उसके साथ शिप नहीं हुआ था: अपनी NSH स्क्रीन का अपडेट, या कोई थर्ड-पार्टी मिनी ऐप। `nsh publish` ऐप बनाता है और उस पर हस्ताक्षर करता है; कुछ भी चलने से पहले host app हस्ताक्षर, certificate chain, revocations और build number को सत्यापित करता है।

पैकेज में TSX होता है। host app का Rust कोड (Rust में लिखा ऐप, उसके crates के components, modules और classes) host app का ही हिस्सा है और उसी के साथ डिलीवर होता है, और पैकेज का TSX उसे उसके specifiers से import करता है, जैसा कोई भी TSX करता है ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx))। इस तरह Rust ऐप अपना core Rust में रखता है और जो स्क्रीन अक्सर बदलती हैं उन्हें हस्ताक्षरित पैकेज के रूप में डिलीवर करता है।

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH पैकेज को सत्यापित करता है और चलाता है; वह उन्हें डिलीवर नहीं करता। पैकेज कहाँ से आते हैं (आपका अपडेट सर्वर, CDN, मिनी ऐप्स का स्टोर) और ऐप उन्हें कब डाउनलोड करता है, यह host app पर निर्भर है।

<a id="why-packages-are-signed"></a>

## पैकेज पर हस्ताक्षर क्यों किए जाते हैं

host app जो JS चलाता है, वह उस सब तक पहुँच सकता है जो ऐप को [grant](./sandbox-and-capabilities.md) किया गया है, इसलिए वह ऐसे स्रोत से आना चाहिए जिस पर ऐप भरोसा करता है। एक दूसरा कारण भी है: NSH ऐप्स को QuickJS bytecode के रूप में शिप करता है, जो source से तेज़ लोड होता है, लेकिन QuickJS bytecode को validate नहीं करता, और गढ़ा हुआ bytecode memory को corrupt कर सकता है। इसलिए NSH bytecode केवल ऐप के अपने (system-signed) resources से, उस dev server से जिससे developer जुड़ा है, और सत्यापित पैकेज से लोड करता है। बाकी सब कुछ JS source होना चाहिए।

<a id="keys-two-levels"></a>

## कुंजियाँ: दो स्तर

- **Root key** ऑफ़लाइन रहती है। host apps उसकी public key पर भरोसा करते हैं; वे कई roots पर भरोसा कर सकते हैं, और इसी तरह root को rotate किया जाता है।
- Root **release keys को certify करती है**: certificate में release key, वे app ids जिनके लिए वह हस्ताक्षर कर सकती है, और एक समय-अवधि का नाम होता है।
- **पैकेज पर release key हस्ताक्षर करती है** और वह उसका certificate साथ रखता है। इसलिए release keys को host apps अपडेट किए बिना rotate (या revoke) किया जा सकता है, क्योंकि वे केवल root को जानते हैं।

हर key का एक id होता है जो उसकी public key से निकाला जाता है (उसके SHA-256 के पहले 8 bytes, hex में), जिसे हर कमांड प्रिंट करता है।

<a id="create-the-keys"></a>

### कुंजियाँ बनाएँ

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

हर key दो फ़ाइलों की होती है: `<name>.secret` (केवल उसके मालिक द्वारा पढ़ने योग्य) और `<name>.pub`, दोनों base64 की एक पंक्ति हैं। `nsh
keygen` किसी मौजूदा key को कभी overwrite नहीं करता।

> [!CAUTION]
> `root.secret` को ऑफ़लाइन रखें, उदाहरण के लिए तिजोरी में रखी encrypted ड्राइव पर। जिसके पास यह है, वह ऐसी keys को certify कर सकता है जिन्हें root पर भरोसा करने वाला हर host app स्वीकार करेगा। Release keys build मशीन पर या CI secrets में रहनी चाहिए।

<a id="certify-a-release-key"></a>

### Release key को certify करें

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| Flag | विवरण |
|---|---|
| `--root <file>` | Root की secret key। |
| `--key <file>` | Release key की public key। |
| `--apps <pattern>` | वे app ids जिनके लिए वह हस्ताक्षर कर सकती है: `*` (कोई भी), `com.example.*` (`com.example.` के अंतर्गत ids) या कोई सटीक id। दोहराया जा सकता है। |
| `--days <n>` | अभी से कितने समय तक वह हस्ताक्षर कर सकती है। डिफ़ॉल्ट 365। |
| `-o, --out <file>` | लिखा जाने वाला certificate। |

Certificate एक छोटी JSON फ़ाइल है; यह गोपनीय नहीं है।

<a id="publish-a-package"></a>

## पैकेज प्रकाशित करें

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` ऐप को release mode में बनाता है और उस पर हस्ताक्षर करता है। App id, नाम, version और build entry के बगल की `nsh.json` से आते हैं, और flags उन्हें override करते हैं:

| Flag | विवरण |
|---|---|
| `--key <file>` | Release key की secret key। |
| `--cert <file>` | उसका certificate। |
| `-o, --out <file>` | लिखा जाने वाला पैकेज। डिफ़ॉल्ट `.nsh/out/<id>-<build>.nshpkg`। |
| `--id <id>` | App id, जैसे `com.example.app`। |
| `--app-version <version>` | Version, जैसे `1.2.0`। |
| `--build <n>` | Build number। आवश्यक (यहाँ या `nsh.json` में); हर release के साथ इसे बढ़ना चाहिए। |
| `--source-map <where>` | `package` (डिफ़ॉल्ट): पैकेज में। `file`: उसके बगल की `<package>.map` में, पैकेज में नहीं। `none`: छोड़ दिया जाता है। देखें [Errors from published packages](#errors-from-published-packages)। |
| `--strip-debug` | Bytecode से line और column tables हटा दें: छोटा पैकेज, जिसके error stacks में positions नहीं होंगे। |
| `--min-runtime <version>` | सबसे पुराना runtime जो पैकेज चलाता है, जैसे `0.2.0` (`nsh.json` `minRuntime`)। डिफ़ॉल्ट: इस CLI का version। देखें [Which runtimes run a package](#which-runtimes-run-a-package)। |

`nsh publish` ऐसी किसी भी चीज़ पर हस्ताक्षर करने से मना कर देता है जिसे कोई डिवाइस ठुकरा देगा: certificate को app id और वर्तमान समय को कवर करना चाहिए।

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### कौन से runtimes पैकेज चलाते हैं

पैकेज सबसे पुराने NSH runtime का नाम बताता है जो उसे चलाता है, और पुराने runtime वाले host apps कुछ भी चलने से पहले उसे अस्वीकार कर देते हैं:

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

डिफ़ॉल्ट रूप से यह उस CLI का version है जिसने पैकेज बनाया: bundle उस CLI के modules के विरुद्ध compile होता है, इसलिए वही runtime ज्ञात रूप से उसे चलाता है। जब फ़ील्ड में host apps का runtime पुराना हो और ऐप केवल वही उपयोग करता हो जो उस runtime में है, तो उसके लिए `--min-runtime` (या `nsh.json` में `minRuntime`) से प्रकाशित करें:

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

Version `MAJOR.MINOR.PATCH` है; pre-release suffix (`0.2.0-beta.1`) को उसके बिना वाले version के रूप में गिना जाता है। यह CLI से नया नहीं हो सकता। पैकेज अपलोड करने से पहले उसे उस runtime वाले host app पर आज़माएँ: कोई import या फ़ंक्शन जो पुराने runtime में नहीं है, module लोड होते समय विफल होता है।

<a id="what-a-package-holds"></a>

### पैकेज में क्या होता है

पैकेज एक फ़ाइल है: एक JSON header (app id, नाम, version, build, घोषित capabilities, bytecode version, न्यूनतम runtime, हस्ताक्षर का समय, release key का certificate और फ़ाइलों की एक तालिका उनके SHA-256 के साथ), फिर फ़ाइलें, फिर उससे पहले की हर चीज़ पर release key का Ed25519 हस्ताक्षर। फ़ाइलें ये हैं:

- ऐप का JS source (हमेशा),
- उसका bytecode, जो केवल तब उपयोग होता है जब डिवाइस के runtime का bytecode version वही हो (अन्यथा source चलता है, इसलिए पैकेज नए runtimes पर भी काम करता रहता है),
- उसका source map (जब तक उसे `--source-map file` या `none` के साथ प्रकाशित न किया गया हो),
- वे assets जिन्हें वह import करता है (images, fonts)।

पैकेज की पहचान, जो revocation के लिए उपयोग होती है, पूरी फ़ाइल का SHA-256 है।

<a id="packages-from-newer-versions-of-nsh"></a>

### NSH के नए versions के पैकेज

host app ऐसे पैकेज चलाता है जिन पर NSH के किसी नए `nsh publish` ने हस्ताक्षर किए हों, जब तक उसका runtime पैकेज के [न्यूनतम runtime](#which-runtimes-run-a-package) के बराबर या उससे नया हो। नया version जो कुछ जोड़ता है और host का runtime जिसे नहीं जानता, उसे छोड़ दिया जाता है, और वह पैकेज जो कर सकता है उसे कभी नहीं बढ़ाता:

- जिन header fields और फ़ाइलों को वह नहीं जानता उन्हें अनदेखा किया जाता है (वे फिर भी हस्ताक्षर और उनके hashes से कवर रहती हैं), जब तक पैकेज किसी field को ऐसा चिह्नित न करे जिसे उसके runtime को समझना ही होगा: तब पुराने runtimes उसे अस्वीकार कर देते हैं;
- जो [capabilities](./sandbox-and-capabilities.md) वह नहीं जानता उन्हें grant नहीं किया जाता, और ऐसी key वाला capability या `http` grant जिसे वह नहीं जानता, पूरा हटा दिया जाता है, क्योंकि वह key उसे सीमित कर सकती है।

जो छोड़ा गया, वह पैकेज लोड होते समय log किया जाता है।

<a id="sign-a-package-again"></a>

## पैकेज पर दोबारा हस्ताक्षर करें

कई ऐप्स के पैकेज वितरित करने वाला कोई प्लेटफ़ॉर्म उन सभी पर अपनी एक key से हस्ताक्षर कर सकता है: CI हर पैकेज बनाता है और उस पर ऐसी key से हस्ताक्षर करता है जिस पर उसके test apps भरोसा करते हैं, और प्लेटफ़ॉर्म उस पर उस key से दोबारा हस्ताक्षर करता है जिस पर production apps भरोसा करते हैं।

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| Flag | विवरण |
|---|---|
| `--key <file>` | Release key की secret key। |
| `--cert <file>` | उसका certificate। |
| `-o, --out <file>` | लिखा जाने वाला पैकेज। यह वही पैकेज हो सकता है जो पढ़ा गया। डिफ़ॉल्ट: `.nsh/out/<id>-<build>.nshpkg`। |

पैकेज वह सब रखता है जो CI ने उसमें डाला: फ़ाइलें, app id, version और build, घोषित capabilities, [न्यूनतम runtime](#which-runtimes-run-a-package) और जो [NSH के नए version](#packages-from-newer-versions-of-nsh) ने लिखा। Certificate, हस्ताक्षर का समय और हस्ताक्षर नई key के हो जाते हैं, इसलिए पैकेज का अपना एक SHA-256 होता है, जिसके द्वारा उसे [revoke](#revoke-keys-and-packages) किया जाता है।

हस्ताक्षर करने से पहले `nsh publish` जाँचता है कि पैकेज अक्षुण्ण है (उस key से हस्ताक्षरित जिसका नाम उसका certificate बताता है, उसकी file table डेटा को कवर करती है, हर फ़ाइल अपने hash से मेल खाती है) और कि नया certificate app id और वर्तमान समय को कवर करता है। उसके बाद से नया हस्ताक्षर पैकेज की, उसके bytecode सहित, गारंटी देता है, इसलिए प्लेटफ़ॉर्म केवल उन्हीं पैकेजों पर दोबारा हस्ताक्षर करे जो उसके अपने builds ने बनाए हैं। Rust टूल `nsh_package::resign(&bytes, &key, &certificate)` से दोबारा हस्ताक्षर करते हैं।

<a id="verify-a-package"></a>

## पैकेज सत्यापित करें

`nsh verify` पैकेज को ठीक वैसे जाँचता है जैसे दिए गए roots पर भरोसा करने वाला host app जाँचता:

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| Flag | विवरण |
|---|---|
| `--root <file>` | किसी भरोसेमंद root की public key। दोहराया जा सकता है। किसी के बिना, केवल पैकेज का अपना हस्ताक्षर जाँचा जाता है। |
| `--revocations <file>` | पहले लागू करने के लिए revocation list। |

डिवाइस क्रम से ये जाँचता है:

1. certificate का किसी भरोसेमंद root द्वारा हस्ताक्षर;
2. कि release key revoke नहीं की गई है;
3. release key द्वारा पैकेज का हस्ताक्षर;
4. कि certificate app id और हस्ताक्षर के समय को कवर करता है;
5. पैकेज को आवश्यक न्यूनतम runtime;
6. कि file table डेटा को ठीक-ठीक कवर करती है और हर फ़ाइल अपने hash से मेल खाती है;
7. कि पैकेज स्वयं revoke नहीं किया गया है;
8. कि उसका build उस ऐप के पहले स्वीकार किए गए सबसे ऊँचे build से पुराना नहीं है (rollback protection)।

अस्वीकार किया गया पैकेज एक error उठाता है जो बताता है कि कौन सी जाँच विफल हुई; जो ऐप चल रहा था वह चलता रहता है।

<a id="revoke-keys-and-packages"></a>

## Keys और पैकेज revoke करें

Root **revocation lists** पर हस्ताक्षर करता है: वे release keys और पैकेज जो अब लोड नहीं होने चाहिए।

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| Flag | विवरण |
|---|---|
| `--root <file>` | Root की secret key। |
| `--extend <file>` | इस सूची की प्रविष्टियाँ रखें (सबसे हाल में प्रकाशित सूची)। |
| `--sequence <n>` | सूची का क्रमांक, पहले प्रकाशित किसी भी सूची से ऊँचा। `--extend` के साथ, डिफ़ॉल्ट उस सूची का क्रमांक जमा एक होता है। |
| `--key <id>` | Revoke करने के लिए release key id। दोहराया जा सकता है। |
| `--package <sha256>` | Revoke करने के लिए पैकेज का SHA-256 (जैसा `nsh verify` प्रिंट करता है)। दोहराया जा सकता है। |
| `-o, --out <file>` | लिखी जाने वाली सूची। |

Trust store केवल वही सूची स्वीकार करता है जिसका sequence number उसके पास मौजूद सूची से ऊँचा हो, ताकि पुरानी सूची replay करके किसी चीज़ का revoke हटाया न जा सके। सबसे नई सूची वहाँ प्रकाशित करें जहाँ से आपके ऐप्स उसे fetch करते हैं, और पैकेज खोलने से पहले उसे `updateRevocations` से लागू करें।

## Rollback protection

जब कोई host app पैकेज स्वीकार करता है, तो उसका trust store उस app id का build number दर्ज करता है और उसके बाद पुराने builds को अस्वीकार करता है। जिस हमलावर के पास ज्ञात vulnerability वाला पुराना, हस्ताक्षरित पैकेज हो, वह ऐप को उसे चलाने पर मजबूर नहीं कर सकता। यह रिकॉर्ड store की state directory (`nsh-trust.json`) में बना रहता है, इसलिए restart के बाद भी रहता है। GPUI पर host app इसे बाद में दर्ज कर सकता है, जब नया पैकेज स्वस्थ साबित हो जाए (`verify_package`, फिर `accept_package`; नीचे देखें)।

<a id="loading-packages-in-a-host-app"></a>

## Host app में पैकेज लोड करना

सत्यापन पूरे पैकेज का hash निकालता है और उसके assets निकालता है (प्रति पैकेज एक बार, trust store की directory के अंतर्गत), इसलिए यह UI thread से बाहर चलता है; परिणाम को चलाना उसी पर होता है।

**GPUI (Rust)**, जहाँ host app पैकेज को तभी स्वीकार भी कर सकता है जब वह स्वस्थ साबित हो जाए:

```rust
use nsh_platform_gpui::{accept_package, package::{PublicKey, TrustStore}, verify_package};

let mut trust = TrustStore::open(state_dir)?;
trust.add_root(PublicKey::from_base64(ROOT_PUB)?);

// Off the main thread: verified as strictly as ever, but the build is not recorded yet.
let package = verify_package(&trust, &bytes, &packages_dir)?;
view.read(cx).run_package(&package);
// Later, once its first frame showed and no fatal error came for a while:
accept_package(&mut trust, &package)?;
```

**iOS (Swift)**:

```swift
let trust = try NshTrust(stateDirectory: applicationSupport.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)                // the contents of root.pub
try trust.updateRevocations(latestListJSON)     // when you have one

let info = try await app.loadPackage(at: downloaded, trust: trust)   // verify off the main thread, then run
```

**Android (Java)**:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);
trust.updateRevocations(latestListJson);

NshPackage pkg = trust.openPackage(downloaded);   // off the UI thread; throws NshPackage.RefusedException
runOnUiThread(() -> nsh.runPackage(pkg));
```

जब तक कोई पैकेज स्वीकार नहीं होता, पहले स्वीकार किया गया build अब भी सत्यापित होता है, इसलिए जिस host app का नया पैकेज विफल हो, वह उस पर लौट सकता है जो वह चला रहा था (`AppView::on_error` की fatal errors, या स्वीकार करने से पहले crash, संकेत हैं)। स्वीकार किए गए build से पुराने builds अस्वीकृत रहते हैं, और बीच में revoke हुआ पैकेज स्वीकार नहीं किया जाता। `load_package` एक साथ सत्यापित और स्वीकार करता है, जैसा iOS और Android पर `openPackage` करता है।

पैकेज की घोषित [capabilities](./sandbox-and-capabilities.md) उसके साथ चलती हैं: पैकेज केवल वही कर सकता है जो वह घोषित करता है, और केवल वही जो host app उसके ऊपर grant करता है।

पूरा API: [GPUI](./gpui.md#embedding-in-a-gpui-app), [Embedding in iOS apps](./ios.md#signed-packages), [Embedding in Android apps](./android.md#signed-packages)।

<a id="errors-from-published-packages"></a>

## प्रकाशित पैकेज की errors

पैकेज का bytecode अपनी line और column tables रखता है, इसलिए उसकी errors में positions होती हैं, और runtime उन्हें host app के error handler को सौंपने से पहले पैकेज के source map की मदद से आपके sources से मैप करता है:

```text
Error: boom
    at n (App.tsx:5:3)
```

Source map में आपके ऐप के मूल sources होते हैं और वह अक्सर पैकेज की सबसे बड़ी फ़ाइल होता है: gallery उदाहरण के 2.6 MB का लगभग आधा। इसे अपने पास रखने के लिए, इसे पैकेज की जगह उसके बगल में प्रकाशित करें:

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

तब डिवाइस bundle के positions (`at n (bundle.js:1:80)`) रिपोर्ट करते हैं। map को उस पैकेज के साथ रखें जिसका वह है, और host app ने जो रिपोर्ट किया उसे `nsh symbolicate` से मैप करें:

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` error text को फ़ाइल या standard input से पढ़ता है और ऐसी map फ़ाइल या पैकेज लेता है जिसमें map हो। Line tables bytecode में लगभग पाँचवाँ हिस्सा जोड़ती हैं (map सहित पैकेज का 3–5%); `--strip-debug` उन्हें हटा देता है, और तब stacks `at n (<null>:0:1)` पढ़ते हैं, जिसमें मैप करने को कुछ नहीं होता।

<a id="trying-a-package-in-development"></a>

## Development में पैकेज आज़माना

`nsh run` जो development hosts इंस्टॉल करता है, वे पैकेज को उसी तरह चला सकते हैं जैसे कोई embedding ऐप चलाता।

iOS पर, host executable `--package <file>` और एक या अधिक `--root <root.pub>` लेता है। `nsh run` द्वारा simulator में host इंस्टॉल कर देने के बाद (`--target ios`):

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

Android पर, development host (`DevActivity`, जिसे `nsh run --target android` इंस्टॉल करता है) extras `package` (डिवाइस पर एक path) और `root` (base64 public keys, अल्पविराम से अलग) लेता है:

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

उनकी trust state temporary (iOS) या cache (Android) directory में रहती है, इसलिए जिस build को उन्होंने स्वीकार किया उससे पुराने builds वहाँ भी अस्वीकृत रहते हैं।
<a id="a-release-checklist"></a>

## रिलीज़ चेकलिस्ट

1. रूट की (root key) को ऑफ़लाइन रखें; हर टीम या हर ऐप परिवार के लिए एक रिलीज़ की प्रमाणित करें, जिसकी वैधता एक वर्ष या उससे कम हो।
2. हर रिलीज़ के लिए `nsh.json` में `build` बढ़ाएँ; `nsh publish` बिना इसके पैकेज को अस्वीकार कर देता है।
3. पैकेज अपलोड करने से पहले उस पर `nsh verify --root root.pub` चलाएँ।
4. `root.pub` को होस्ट ऐप के अंदर शिप करें; रिवोकेशन सूचियों को अलग से शिप करें, ताकि ऐप अपडेट के बिना भी आप रद्द कर सकें।
5. यदि कोई रिलीज़ की लीक हो जाए, तो उसे रद्द करें (`nsh revoke --extend … --key <id>`), नई की प्रमाणित करें और दोबारा प्रकाशित करें।
6. ऐसे प्लेटफ़ॉर्म के साथ जो अपने ऐप्स के लिए साइन करता है, CI को अपना एक अलग रूट दें जिस पर केवल टेस्ट ऐप्स भरोसा करें, और प्लेटफ़ॉर्म का रूट प्रोडक्शन ऐप्स में शिप करें; प्लेटफ़ॉर्म CI के पैकेजों पर दोबारा साइन करता है (`nsh publish <package>`)।

<a id="see-also"></a>

## यह भी देखें

- [Sandbox और capabilities](./sandbox-and-capabilities.md)
- [iOS ऐप्स में एम्बेड करना](./ios.md), [Android ऐप्स में एम्बेड करना](./android.md)
- [CLI](./cli.md)
