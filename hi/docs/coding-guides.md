---
title: "कोडिंग गाइड"
description: "Rust और TSX में रखरखाव-योग्य Native Shell ऐप्स और कंपोनेंट लाइब्रेरी के लिए आर्किटेक्चर और कोडिंग परंपराएँ।"
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---

# कोडिंग गाइड

यह गाइड उन एप्लिकेशन आर्किटेक्चर और कोड पैटर्न का वर्णन करती है जो Native Shell ऐप्स में टिकाऊ साबित हुए हैं। इसे इंजीनियरों और कोडिंग एजेंट, दोनों के लिए लिखा गया है: NSH ऐप्स के डेवलपर (TSX मॉड्यूल, Rust कॉम्पोनेंट, NSH को एम्बेड करने वाले नेटिव ऐप्स) और `nsh/base` पर बनी कॉम्पोनेंट लाइब्रेरी के लेखक। पहले Design Guides पढ़ें: कोड की संरचना को प्रोडक्ट के उद्देश्य को सुरक्षित रखना चाहिए, उसकी जगह नहीं लेनी चाहिए।

यह एक मानक (normative) गाइड है। **अनिवार्य (Must)** लाइफसाइकल, शुद्धता या इकोसिस्टम से जुड़ी बाध्यताओं को दर्शाता है; **चाहिए (should)** डिफ़ॉल्ट आर्किटेक्चर है, और इससे हटने के लिए ठोस कारण आवश्यक है। सटीक सिग्नेचर के लिए वर्तमान सोर्स, रेफ़रेंस पेज और `.nsh/types` में दिए गए डिक्लेरेशन ही प्रामाणिक हैं।

<a id="make-the-common-path-inexpensive"></a>

## सामान्य पथ को सस्ता रखें

**डिज़ाइन सिद्धांत: फ़्रेमवर्क के टाइप और ओनरशिप ऐसे चुनें कि कॉम्पोनेंट का सामान्य उपयोग डिफ़ॉल्ट रूप से सस्ता रहे।** डेवलपर्स को हर कॉल साइट पर कैश जोड़े बिना UI बनाने और दोबारा इस्तेमाल करने में सक्षम होना चाहिए। एक बार चलने वाले कॉम्पोनेंट और जहाँ उपयोग होते हैं वहीं पढ़े जाने वाले [signals](./reactivity.md) इसके उदाहरण हैं: कॉम्पोनेंट ट्री में अपना हिस्सा एक बार बनाता है, और उसके बाद केवल वही bindings दोबारा चलती हैं जो बदले हुए signal को पढ़ती हैं, इसलिए सामान्य पथ में बार-बार का काम नहीं होता। रिएक्टिव ग्राफ़, रेंडरर, लेआउट और लिस्ट नेटिव हैं, और ऐप के कोड का एक चक्र नेटिव ऑपरेशनों के एक बैच में बदल जाता है। फिर भी छोटी लागतें एलिमेंट और अपडेट के साथ गुणित होती जाती हैं, खासकर TSX में, जिसका अपना कोड एक इंटरप्रेटर में चलता है; कैश जोड़ने से पहले असाधारण हॉट पाथ को मापें ([Performance](./performance.md))। दोनों में से कोई भी विकल्प शून्य लागत का वादा नहीं करता। [state ownership के नियम](#state-ownership) और आगे के रेंडरिंग अनुभाग इसकी कार्यप्रणाली समझाते हैं।

<a id="architecture-at-a-glance"></a>

## आर्किटेक्चर एक नज़र में

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

डिपेंडेंसी नीचे की ओर इंगित करती हैं। ऊपरी लेयर डोमेन का अर्थ और ऑर्केस्ट्रेशन संभालती हैं; निचली लेयर पुन: प्रयोज्य प्रेजेंटेशन या व्यवहार संभालती हैं। किसी पुन: प्रयोज्य कॉम्पोनेंट को ऐप के पेज पर निर्भर न बनाएँ, और किसी कॉम्पोनेंट लाइब्रेरी को किसी एक ऐप की थीम पर निर्भर न बनाएँ ([Three layers](./architecture.md#three-layers))।

इन सीमाओं का उपयोग करें:

- **app shell:** एंट्री (`App.tsx`, या `nsh.json` `"root"`) रूट और नेविगेशन स्टैक को संयोजित करती है, और पेज का लॉजिक अपने से बाहर रखती है;
- **page:** एक `NavPage`, जिसमें उसका कंटेंट, उसके डायलॉग और उसके शुरू किए हुए काम होते हैं;
- **app component:** बार-बार आने वाला, डोमेन-जागरूक पैटर्न;
- **component library:** स्टाइल किया हुआ, सामान्य-उद्देश्य वाला UI, ऐप का अपना या कम्युनिटी का, जो `nsh/base` पर बना हो;
- **`nsh/base`:** प्रोडक्ट की प्रेजेंटेशन के बिना पुन: प्रयोज्य व्यवहार: नेविगेशन, डायलॉग, पॉपओवर, मेन्यू, शीट, प्रेस टारगेट;
- **`nsh`:** प्रिमिटिव, स्टाइल, लेआउट, रिएक्टिविटी और एनवायरनमेंट।

<a id="lay-out-an-apps-files"></a>

### ऐप की फ़ाइलों का लेआउट

ऐप की फ़ाइलें NSH के कन्वेंशन का पालन करती हैं, इसलिए कुछ भी कॉन्फ़िगर करने की आवश्यकता नहीं है: `App.tsx` एंट्री है और `nsh.json` उसके बगल में रहती है, और दोनों कन्वेंशन से मिल जाती हैं।

```text
App.tsx            # the entry, by convention: mount(App)
nsh.json
Cargo.toml         # the app's crate, with Rust components ("rust": ".")
src/
  lib.rs
pages/
  Inbox.tsx
  Compose.tsx
  Settings.tsx
components/
  Card.tsx
store.ts
```

- `pages/` में प्रत्येक `NavPage` के लिए एक फ़ाइल होती है। पेज तभी अधिक फ़ाइलों में बढ़ता है जब उसे ज़रूरत हो।
- `components/` में ऐप के पुन: प्रयोज्य कॉम्पोनेंट होते हैं, जिन्हें कई पेज उपयोग करते हैं।
- `store.ts` में ऐप की स्टेट होती है: उसके signals और उन्हें बदलने वाले फ़ंक्शन। पेज signals को पढ़ते हैं और फ़ंक्शन को कॉल करते हैं।
- टेस्ट `*.test.tsx` फ़ाइलें होते हैं जो जिसे टेस्ट करते हैं उसके बगल में रहती हैं (`App.test.tsx`, `pages/Inbox.test.tsx`)।
- `Cargo.toml` और `src/lib.rs` ऐप का अपना crate हैं, जिसमें उसके Rust कॉम्पोनेंट हैं (`nsh.json` `"rust": "."`); `src/lib.rs` में इसका `#[native_module]` बताता है कि TSX क्या इम्पोर्ट करता है। केवल Rust में लिखा ऐप वही Cargo प्रोजेक्ट होता है, जिसका रूट कॉम्पोनेंट `src/lib.rs` में होता है ([Project structure](./project-structure.md))।

ऐप शेल पेजों को संयोजित करता है लेकिन उसमें पेज का लॉजिक कम होता है। पेज store के signals पढ़ते हैं और उसके फ़ंक्शन को कॉल करते हैं; वे कभी किसी दूसरे पेज की स्टेट में नहीं लिखते। store के signals को निजी रखें और जो उन्हें पढ़ता व बदलता है उसे एक्सपोर्ट करें, ताकि म्यूटेबल स्टेट उसके सार्वजनिक फ़ंक्शन के पीछे रहे:

```rust tabs
/// The app's workspace: its state stays behind these functions.
#[derive(Clone, Copy)]
pub struct Workspace {
    name: Signal<SharedString>,
}

impl Workspace {
    /// A workspace named "Untitled".
    pub fn new() -> Self {
        Self { name: signal(SharedString::from("Untitled")) }
    }

    /// Its name (tracked where it is read).
    pub fn name(&self) -> SharedString {
        self.name.get()
    }

    /// Renames it.
    pub fn rename(&self, name: impl Into<SharedString>) {
        self.name.set(name.into());
    }
}
```

```tsx tabs
// store.ts
import { signal } from "nsh";

const name = signal("Untitled");

/** The workspace's name (tracked where it is read). */
export const workspaceName = () => name();

/** Renames the workspace. */
export function renameWorkspace(next: string) {
  name.set(next);
}
```

एक पेज workspace को रख सकता है और उसकी id search को दे सकता है; search को workspace का पूरा कलेक्शन या उसके निजी signals नहीं चाहिए। एक सरल चक्र-रहित (acyclic) डिपेंडेंसी आकार यह है:

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

पेज store और कॉम्पोनेंट पर निर्भर हो सकते हैं, लेकिन शेल या किसी दूसरे पेज के निजी हिस्सों पर नहीं। यदि किसी पेज को दूसरे पेज में दिखने वाली चीज़ बदलनी हो, तो यह store के माध्यम से करें। ये सीमाएँ अलग-अलग इंजीनियरों या AI एजेंट को अलग पेजों पर समानांतर रूप से काम करने देती हैं, जिससे फ़ाइल टकराव और साझा-स्टेट कपलिंग कम होती है; store के लिए फिर भी समन्वय आवश्यक है।

<a id="bootstrap-and-root-ownership"></a>

## Bootstrap और रूट की ओनरशिप

ऐप को एक बार माउंट करें, और रूट को पूरी सरफ़ेस दें: TSX एंट्री `mount(App)` को कॉल करती है, Rust ऐप अपना रूट कॉम्पोनेंट `nsh.json` (`"root": "App"`) में नामित करता है। रूट सरफ़ेस को `flex: 1` से और थीम के बैकग्राउंड से भरता है:

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    provide_context(Workspace::new());
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(inbox())
}
```

```tsx tabs
import { mount, View } from "nsh";

mount(() => (
  <View class="flex-1 bg-background">
    <App />
  </View>
));
```

रूट उन चीज़ों का समन्वय करता है जो पूरी सरफ़ेस की होती हैं: नेविगेशन स्टैक, उसके ऊपर दिखाए जाने वाले डायलॉग, पॉपओवर, मेन्यू, शीट और टूलटिप, और safe area। एक सरफ़ेस के भीतर हर पेज के लिए दूसरा रूट माउंट न करें। एक सरफ़ेस एक इंजन है: नेटिव ऐप जो भी `NshAppView`, `NshView` या `AppView` एम्बेड करता है, वह अपना VM, अपनी मॉड्यूल स्टेट और अपना रिएक्टिव ग्राफ़ चलाता है, इसलिए एक होस्ट ऐप की कई सरफ़ेस कभी अनजाने में स्टेट साझा नहीं करतीं।

<a id="understand-what-runs-once-and-what-runs-again"></a>

## समझें कि क्या एक बार चलता है और क्या दोबारा

NSH, Solid के मॉडल पर, घोषणात्मक निर्माण के साथ retained state है ([Reactivity](./reactivity.md))। signal अपडेट के पार बना रहता है; कॉम्पोनेंट की बॉडी ट्री में अपने हिस्से का वर्णन एक बार करती है, जब वह बनाया जाता है। इस अंतर को स्पष्ट रखें:

| आप क्या लिखते हैं | कब चलता है | दोबारा कब चलता है |
| --- | --- | --- |
| कॉम्पोनेंट की बॉडी | एक बार, जब वह बनाया जाता है | कभी नहीं |
| एक binding: जहाँ मान जाना है वहाँ क्लोज़र (Rust) या प्रॉपर्टी को कॉल या पढ़ने वाला एक्सप्रेशन (TSX) | एक बार | जब उसका पढ़ा हुआ कोई signal बदलता है; केवल वही prop या child अपडेट होता है |
| `computed(fn)` | जब बनाया जाता है | जब उसका पढ़ा हुआ कोई signal बदलता है |
| `effect(fn)` | पास के एलिमेंट बन जाने के बाद | जब उसका पढ़ा हुआ कोई signal बदलता है |
| `each` / `<Each>` की एक पंक्ति | जब उसकी key पहली बार दिखती है | कभी नहीं; उसके item और index signals बदलते हैं |
| `virtual_list` / `<List>` का एक सेल | प्रति सेल एक बार | कभी नहीं; सेल को अन्य पंक्तियाँ दी जाती हैं |

- जो कॉम्पोनेंट चलता है वह **owner** है: उसके चलते समय बनाए गए effects, computed values, tasks, timers, key bindings और cleanups उसी के होते हैं और उसके साथ ही dispose हो जाते हैं;
- **context** (`provide_context` / `use_context`, `context()` और `<Ctx.Provider>`) किसी सबट्री को मान देता है, यह जताए बिना कि उसे पढ़ने वाले एलिमेंट उसके मालिक हैं;
- Rust कॉम्पोनेंट का **`Scope`** (`cx`) अपने इवेंट उत्सर्जित करता है और उसे दिए गए insets पढ़ता है;
- **refs** (`element_ref()`, `ref`) इम्पेरेटिव कॉल (`focus()`, `scroll_to()`, `measure()`) के लिए होस्ट एलिमेंट को नाम देते हैं;
- लेआउट और मापन बाद के, नेटिव चरण हैं; `onLayout` और `measure()` का उपयोग केवल तभी करें जब हल की गई ज्यामिति (resolved geometry) वास्तव में आवश्यक हो।

event handler या timer में कभी context न पढ़ें, क्योंकि वहाँ उसे खोजने के लिए कोई कॉम्पोनेंट नहीं होता: उसे बॉडी में पढ़ें और जो मिला उसे रखें। टाइप्ड हैंडल (signals, resources, refs, डोमेन id) रखें, जो Rust में `Copy` हैं और उनके owner के जाते ही कुछ करना बंद कर देते हैं।

<a id="choose-the-right-unit"></a>

## सही इकाई चुनें

<a id="use-a-plain-function-for-value-like-elements"></a>

### मान-जैसे एलिमेंट के लिए सादा फ़ंक्शन उपयोग करें

**UI के हल्के, पुन: प्रयोज्य हिस्सों के लिए डिफ़ॉल्ट रूप से सादा फ़ंक्शन उपयोग करें।** कॉलर वर्तमान props और handlers देता है, फ़ंक्शन एलिमेंट लौटाता है, और उसके द्वारा बनाई गई bindings के अलावा उसका कुछ नहीं बचता। उसके आर्गुमेंट ही उसके props हैं; दिखाया जाने वाला लेबल, मान और कॉलबैक कॉलर की वर्तमान स्टेट से आते हैं। वह किसी भी कॉम्पोनेंट की तरह फिर भी एक बार चलता है: बाद में जो बदलता है वह उसकी bindings हैं।

```rust tabs
fn empty_state(title: impl Into<SharedString>) -> impl IntoElement {
    view()
        .gap_2()
        .items_center()
        .child(text(title.into()).text_color(move || theme().muted_foreground))
}
```

```tsx tabs
function EmptyState(props: { title: string }) {
  return (
    <View class="items-center gap-2">
      <Text class="text-muted-foreground">{props.title}</Text>
    </View>
  );
}
```

<a id="use-a-component-for-retained-behavior"></a>

### retained व्यवहार के लिए कॉम्पोनेंट उपयोग करें

जब UI के किसी हिस्से के पास स्थायी स्टेट या स्वतंत्र लाइफसाइकल हो (signals, effects, async काम, timers, key bindings), तब `#[component]` (या signals बनाने वाला TSX कॉम्पोनेंट) उपयोग करें। वह स्टेट कॉम्पोनेंट की बॉडी में एक बार बनाएँ, कभी किसी binding के अंदर नहीं।

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// Shown while the field is empty.
    pub placeholder: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let query = signal(String::new());
    input()
        .value(move || query.get())
        .on_change(move |text: &str| query.set(text.to_owned()))
        .placeholder(move || props.placeholder.get().to_string())
}
```

```tsx tabs
function Search(props: { placeholder: string }) {
  const query = signal("");
  return <Input value={query()} onChange={({ value }) => query.set(value)} placeholder={props.placeholder} />;
}
```

`#[component]` में टाइप्ड props (`#[derive(Props)]`) और events (`#[derive(Event)]`) होते हैं; TSX उनसे जनरेट किए गए डिक्लेरेशन के साथ उसे इम्पोर्ट करता है। जो retained स्टेट TSX `new` के साथ उपयोग करता है (एक ledger, एक parser, एक session) वह `#[class]` है, और फ़ंक्शन `#[module]` हैं ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx))। ऐप जिन हिस्सों का सबसे अधिक उपयोग करता है, कॉम्पोनेंट लाइब्रेरी और भारी लॉजिक को Rust में लिखें, जो शुरू से अंत तक नेटिव कोड है; TSX को उसके लिए रखें जो अक्सर बदलता है या रन टाइम पर पहुँचाया जाता है।

हर दृश्य टुकड़े को कॉम्पोनेंट न बनाएँ। कॉम्पोनेंट की सीमाओं की लाइफसाइकल और समन्वय संबंधी लागतें होती हैं; उनका उपयोग वहीं करें जहाँ retained पहचान मायने रखती है।

<a id="elements-views-and-behavior-systems-are-different"></a>

### एलिमेंट, व्यू और व्यवहार प्रणालियाँ अलग हैं

हर कॉम्पोनेंट को एक ही साँचे में न ढालें। इकोसिस्टम में ये शामिल हैं:

- `Button`, `Switch` और `MenuItem` जैसे सिमैंटिक एलिमेंट;
- `Dialog`, `Popover`, `Menu`, `ContextMenu`, `Sheet` और `NavStack` जैसे संयुक्त (compound) व्यवहार रूट;
- `Input`, `List`, `TextView` और नेविगेशन स्टैक की स्टेट जैसी स्टेटफ़ुल प्रणालियाँ;
- ओवरले और उनकी प्लेसमेंट, वर्चुअलाइज़ेशन, स्क्रॉलिंग, safe area, कीबोर्ड और एनिमेशन जैसा इन्फ्रास्ट्रक्चर।

एक एलिमेंट आंतरिक रूप से जटिल होकर भी अपने कॉलर के लिए मान-जैसा हो सकता है। एक स्टेटफ़ुल प्रणाली render फ़ंक्शन उपलब्ध करा सकती है ताकि ऐप व्यवहार को दोबारा लागू किए बिना प्रेजेंटेशन का मालिक रहे। सार्वजनिक सीम (seam) व्यवहार के आधार पर चुनें, इस आधार पर नहीं कि उसके आउटपुट में कितने व्यू दिखते हैं।

<a id="state-ownership"></a>

## स्टेट की ओनरशिप

<a id="own-persistent-ui-text-with-103"></a>

### स्थायी UI टेक्स्ट को `SharedString` के साथ रखें

**Rust में, अपडेट या कॉलबैक क्लोज़र के पार retained रहने वाले UI टेक्स्ट के लिए `SharedString` को अवश्य प्राथमिकता दें**, जिसमें कॉम्पोनेंट के लेबल, शीर्षक और प्लेसहोल्डर शामिल हैं: props इसे लेते हैं (`Prop<SharedString>`), और इसे binding में क्लोन करने से टेक्स्ट की कॉपी नहीं होती। म्यूटेबल एडिटिंग बफ़र या फ़ॉर्मेटिंग के साथ जोड़े जा रहे टेक्स्ट के लिए `String` उपयोग करें और परिणाम तैयार होने पर कन्वर्ट करें; एक कॉल के दौरान अस्थायी रीड-ओनली एक्सेस के लिए `&str` उपयोग करें। TSX में स्ट्रिंग ऐप के अपने मान हैं; स्टेट से गणना किए गए टेक्स्ट को कई जगह दोबारा बनाने के बजाय `computed` या क्लोज़र में रखें।

जिस अपरिवर्तनीय (immutable) रिस्पॉन्स टेक्स्ट को UI retain करेगा, उसके लिए प्राप्त मान को ज्यों का त्यों रखें और व्युत्पन्न या फ़ॉर्मेट किया हुआ प्रेजेंटेशन टेक्स्ट रिस्पॉन्स को दोबारा लिखने के बजाय अलग डोमेन मान में रखें।

हर स्टेट को उस सबसे संकीर्ण owner में रखें जो उसे सही रख सके:

- डोमेन स्टेट store (`store.ts`) या ऐप के crate की होती है;
- क्षणिक व्यू स्टेट उस कॉम्पोनेंट की होती है जो उसे रेंडर करता है, एक signal के रूप में;
- पुन: प्रयोज्य व्यवहारिक स्टेट उस कॉम्पोनेंट की होती है जो उसके लिए बना है (`open` के बिना `Menu` या `Popover` अपनी स्टेट खुद रखता है);
- सबट्री द्वारा साझा की गई स्टेट [context](./reactivity.md#context) के माध्यम से दिया गया signal है;
- जो एक रन से आगे बना रहता है वह [storage](../modules/nsh.md#storage) में या सर्वर पर होता है।

सामान्य चयन और टॉगल के लिए controlled मानों को प्राथमिकता दें: वर्तमान मान कॉम्पोनेंट में दें, अनुरोधित बदलाव प्राप्त करें, owner को अपडेट करें, और bindings उसका अनुसरण करती हैं। कॉलबैक इरादा बताता है; उसे दूसरा छिपा हुआ सत्य-स्रोत नहीं बनाना चाहिए।

```rust tabs
switch()
    .checked(show_hidden)
    .on_change(move |next: &bool| show_hidden.set(*next))
    .child(text("Show hidden files"))
```

```tsx tabs
<Switch checked={showHidden()} onChange={({ checked }) => showHidden.set(checked)}>
  <Text>Show hidden files</Text>
</Switch>
```

सूचित करने के लिए कुछ नहीं है: signal में लिखना ठीक उन्हीं bindings को अपडेट करता है जो उसे पढ़ती हैं। Rust कॉम्पोनेंट एक सिमैंटिक इवेंट उत्सर्जित करता है जिसे उसके owner को `cx.emit(..)` से संभालना चाहिए; एक effect तब तक signal का अनुसरण करता है जब तक उसका owner जीवित रहता है। जो कई फ़ील्ड एक इनवेरिएंट बनाते हैं उन्हें एक [`batch`](./reactivity.md#batch) में लिखें, ताकि effects और computed values उन्हें एक साथ देखें।

ऐप का अपना controlled कॉम्पोनेंट भी इसी अनुबंध का पालन करता है। एक quantity stepper, यानी Rust में एक बार लिखा गया और Rust व TSX से रखा गया डोमेन कंट्रोल:

```rust tabs
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The props of [`QuantityStepper`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct QuantityStepperProps {
    /// The quantity: the app owns the value.
    #[prop(default)]
    pub value: Prop<u32>,
    /// The smallest quantity (0 when left out).
    #[prop(default)]
    pub min: Prop<u32>,
    /// The largest quantity (99 when left out).
    #[prop(default = 99)]
    pub max: Prop<u32>,
    /// What screen readers say for the button that takes one away.
    pub decrement_label: Prop<SharedString>,
    /// What screen readers say for the button that adds one.
    pub increment_label: Prop<SharedString>,
}

/// What a [`QuantityStepper`] reports.
#[derive(Debug, Clone, PartialEq, Event)]
pub enum QuantityStepperEvent {
    /// The user asked for another quantity; the owner sets `value`.
    Change(u32),
}

/// A quantity with a button to take one away and one to add one.
#[component]
pub fn QuantityStepper(props: QuantityStepperProps, cx: Scope<QuantityStepperEvent>) -> impl IntoElement {
    // Read untracked: the user's act, measured against the owner's current value.
    let step = move |delta: i64| {
        let value = props.value.get_untracked();
        let (min, max) = (props.min.get_untracked(), props.max.get_untracked());
        let next = (i64::from(value) + delta).clamp(i64::from(min), i64::from(max)) as u32;
        if next != value {
            cx.emit(QuantityStepperEvent::Change(next));
        }
    };
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .child(step_button(
            "−",
            move || props.decrement_label.get(),
            move || props.value.get() <= props.min.get(),
            move || step(-1),
        ))
        .child(text(move || props.value.get().to_string()).text_color(move || theme().foreground))
        .child(step_button(
            "+",
            move || props.increment_label.get(),
            move || props.value.get() >= props.max.get(),
            move || step(1),
        ))
}

fn step_button(
    symbol: &'static str,
    label: impl Fn() -> SharedString + 'static,
    disabled: impl Fn() -> bool + 'static,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .disabled(disabled)
        .accessibility_label(move || Some(label()))
        .on_press(on_press)
        .w(px(32.0))
        .h(px(32.0))
        .items_center()
        .justify_center()
        .rounded(move || theme().radius)
        .bg(move || theme().muted)
        .active(|s| s.opacity(0.6))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(symbol).text_color(move || theme().foreground))
}

// The owner:
let quantity = signal(1_u32);
quantity_stepper()
    .value(quantity)
    .min(1)
    .max(10)
    .decrement_label("Fewer")
    .increment_label("More")
    .on_change(move |next: &u32| quantity.set(*next))
```

```tsx tabs
import { signal } from "nsh";
import { QuantityStepper } from "my-app";   // the Rust component: src/lib.rs has #[native_module("my-app")]

function CartRow() {
  const quantity = signal(1);
  return (
    <QuantityStepper
      value={quantity()}
      min={1}
      max={10}
      decrementLabel="Fewer"
      incrementLabel="More"
      onChange={({ value }) => quantity.set(value)}
    />
  );
}
```

TSX में वही अनुबंध, `components/` में एक कॉम्पोनेंट:

```tsx
import { Text, View } from "nsh";
import { Button } from "nsh/base";

export interface QuantityStepperProps {
  /** The quantity: the app owns the value. */
  value: number;
  /** The smallest quantity (0 when left out). */
  min?: number;
  /** The largest quantity (99 when left out). */
  max?: number;
  /** What screen readers say for the button that takes one away. */
  decrementLabel: string;
  /** What screen readers say for the button that adds one. */
  incrementLabel: string;
  /** The user asked for another quantity; the owner sets `value`. */
  onChange?: (e: { value: number }) => void;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 99;
  const step = (delta: number) => {
    const next = Math.min(max(), Math.max(min(), props.value + delta));
    if (next !== props.value) props.onChange?.({ value: next });
  };
  const buttonClass = "size-8 items-center justify-center rounded-(--radius) bg-muted active:opacity-60 disabled:opacity-40";
  return (
    <View class="flex-row items-center gap-3">
      <Button disabled={props.value <= min()} accessibilityLabel={props.decrementLabel} onPress={() => step(-1)} class={buttonClass}>
        <Text class="text-foreground">−</Text>
      </Button>
      <Text class="text-foreground">{props.value}</Text>
      <Button disabled={props.value >= max()} accessibilityLabel={props.incrementLabel} onPress={() => step(1)} class={buttonClass}>
        <Text class="text-foreground">+</Text>
      </Button>
    </View>
  );
}
```
<a id="keep-ownership-links-and-subscriptions-bounded"></a>

### ओनरशिप लिंक और सब्सक्रिप्शन को सीमित रखें

एक कॉम्पोनेंट जो कुछ बनाता है, उसका मालिक वही होता है, और जो कुछ उसने बनाया वह उसी के साथ समाप्त हो जाता है: जब उसकी `<If>` ब्रांच छिप जाती है, उसकी रो हटा दी जाती है या उसका पेज pop हो जाता है। Rust में टास्क, टाइमर और इंटरवल (`spawn`, `set_timeout`, `set_interval`) और की बाइंडिंग (`on_key`) उस ओनर के साथ समाप्त हो जाते हैं जिसके अंतर्गत उन्हें बनाया गया था; TSX में stop को [`cleanup`](./reactivity.md#cleanup) के साथ रजिस्टर करें या उसे effect से return करें। सुनना `on(event, listener)` (`host.on(name, listener)`, `BackHandler.on("press", listener)`) है, जो एक फ़ंक्शन return करता है जो उसे रोकता है (`() => void`, Rust से एक `Stop`), और कॉम्पोनेंट के रेंडर होते समय जो कुछ रजिस्टर होता है वह कॉम्पोनेंट के साथ चला जाता है, जैसा कि `keymap.bind` की बाइंडिंग के साथ होता है।

जब कुछ अप्रत्याशित रूप से चलता रहे, तो सबसे पहले इन्हें जाँचें: कॉम्पोनेंट के बाहर बनाए गए effects और computed मान (किसी इवेंट हैंडलर या टाइमर कॉलबैक में उनका कोई ओनर नहीं होता और वे हमेशा जीवित रहते हैं), बिना अपने stop के रजिस्टर किए गए लिसनर, और ऐसे स्टोर से शुरू किया गया काम जिसका कोई कॉम्पोनेंट ओनर नहीं है। drop किया गया `resource` लोड abort हो जाता है (TSX में `info.signal`); वह अपने कॉम्पोनेंट को जीवित नहीं रखता। ये शुरू करने के सामान्य स्थान हैं, पूरी सूची नहीं।

केवल इसलिए सिग्नल न लिखें कि कोई मान पढ़ा गया या derive किया गया। ऐसी बाइंडिंग या effect से बिना शर्त लिखने से बचें जो उसी सिग्नल को पढ़ता है: वह खुद को फिर से चलाता है जब तक NSH उसे एरर के साथ रोक नहीं देता। अन्य state से गणना किया गया मान `computed` होता है, ऐसा effect नहीं जो दूसरे सिग्नल में लिखे।

<a id="avoid-state-feedback-loops"></a>

### State feedback loops से बचें

टेक्स्ट इनपुट, selection, फ़िल्टर और controlled popup में आमतौर पर दो रास्ते होते हैं: बाहरी ओनर मान को अपडेट करता है, और यूज़र इंटरैक्शन नया मान माँगता है। sync के दौरान ओनर द्वारा दिए गए मान को यूज़र कॉलबैक के ज़रिए वापस न भेजें। यूज़र की क्रिया को हैंडल करते समय ओनर का वर्तमान मान untracked पढ़ें (Rust में `props.value.get_untracked()`, जैसा ऊपर बताया गया; TSX इवेंट हैंडलर पहले से untracked होता है) और उसकी अगले मान से तुलना करें, ताकि हर तार्किक परिवर्तन केवल एक बार रिपोर्ट हो। कॉलबैक को re-entrancy-safe बनाएँ जब कोई कॉलबैक उसी कॉम्पोनेंट को synchronously बंद, बदल या अपडेट कर सकता हो जिसने उसे invoke किया था।

<a id="stable-identity"></a>

## स्थिर पहचान

Key व्यवहार का हिस्सा है। यह रो, पेज या दोहराए गए कंट्रोल को स्थिर पहचान देती है, और तय करती है कि डेटा बदलने पर किसकी state, फ़ोकस और माप सुरक्षित रहते हैं।

- रो, टैब, पेज और दोहराए गए कंट्रोल के लिए स्थिर डोमेन id का उपयोग करें: `each(projects, |p| p.id, ..)`,
  `<Each of={projects()} key={(p) => p.id}>`, किसी लिस्ट का `keyExtractor`।
- जब एक ही कंट्रोल दोहराया जाए, तो test id में उसके ओनर ऑब्जेक्ट का नेमस्पेस जोड़ें (`delete-${project.id}`)।
- जब आइटम डाले या पुनः क्रमित किए जा सकते हों, तब पहचान को कभी अनुवादित लेबल या बदलने वाले लिस्ट इंडेक्स से derive न करें।
- रेंडर करते समय नई रैंडम key या id जनरेट न करें।

```rust tabs
each(projects, |p| p.id, move |project, _index| {
    let id = project.get_untracked().id;
    button()
        .on_press(move || delete(id))
        .child(text("Delete").test_id(&format!("delete-{id}")))
})
```

```tsx tabs
<Each of={projects()} key={(p) => p.id}>
  {(project) => (
    <Button onPress={() => remove(project().id)}>
      <Text testID={`delete-${project().id}`}>Delete</Text>
    </Button>
  )}
</Each>
```

बदली हुई key का अर्थ है बदली हुई UI पहचान। उस रीसेट को जानबूझकर किया गया मानें।

यही नियम नेविगेशन रूट, लिस्ट key, स्टोरेज key और test id पर भी लागू होता है। जो रूट `setRoutes` में बना रहता है वह अपना पेज और अपनी state बनाए रखता है; यदि दो स्वतंत्र रूप से retained व्यवहार एक key साझा करते हैं, तो वे एक-दूसरे की state को overwrite कर सकते हैं; यदि कोई व्यवहार हर अपडेट पर key बदलता है, तो वह कभी state जमा नहीं करता।

<a id="rendering-and-composition"></a>

## रेंडरिंग और कंपोज़िशन

कॉम्पोनेंट की बॉडी को declarative रखें: वर्तमान state पढ़ें, presentation मान derive करें, और एलिमेंट कंपोज़ करें। डोमेन ऑपरेशन, parsing और non-trivial म्यूटेशन को स्टोर या ऐप के crate के नामित फ़ंक्शनों में ले जाएँ।

```rust tabs
#[component]
pub fn ProjectPage() -> impl IntoElement {
    view()
        .flex_1()
        .child(toolbar())
        .child(content())
}
```

```tsx tabs
function ProjectPage() {
  return (
    <View class="flex-1">
      <Toolbar />
      <Content />
    </View>
  );
}
```

हेल्पर तब निकालें जब वह किसी अर्थपूर्ण क्षेत्र को नाम देता हो और पाठक को एक साथ जितनी state याद रखनी पड़े उसे घटाता हो। नया कॉम्पोनेंट तब निकालें जब उस क्षेत्र का अपना पुन: उपयोग योग्य contract या retained lifecycle हो, केवल इसलिए नहीं कि builder chain या JSX ब्लॉक लंबा है।

Rust में typed style मेथड और कॉम्पोनेंट के builders का, और TSX में classes का, एकसमान उपयोग करें। छोटे सशर्त संशोधनों के लिए `.when(..)` / `.when_some(..)` (Rust) और `classList` (TSX) को प्राथमिकता दें; जब शाखाएँ काफ़ी अलग इंटरफ़ेस दर्शाती हों तब `when` / `<If>` का उपयोग करें, क्योंकि क्लोज़र में ternary अपनी शाखा को तब-तब फिर से बनाता है जब भी उसके द्वारा पढ़ी गई कोई चीज़ बदलती है।

कस्टम सतह बनाने से पहले मानक semantic कॉम्पोनेंट से कंपोज़ करें। केवल एक स्क्रीनशॉट से मेल खाने के लिए generic views से मेन्यू, popover, sheet या dialog को दोबारा न बनाएँ: `nsh/base` के `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Tooltip` और `Dialog` प्लेसमेंट, फ़ोकस ट्रांसफ़र, कीबोर्ड नेविगेशन, selection, disabled state, Escape और back पर dismissal, और accessibility contract को सुरक्षित रखते हैं। यदि मानक कॉम्पोनेंट किसी आवर्ती वैध पैटर्न को व्यक्त नहीं कर सकता, तो हर कॉल साइट पर मनमाने descendants को स्टाइल करने के बजाय उसके explicit API को बेहतर बनाएँ।

ऐप कोड द्वारा दिए गए रेंडर फ़ंक्शन side-effect-free होने चाहिए। किसी लिस्ट की रो, किसी `TextView` का `renderCodeBlock` या किसी मेन्यू के आइटम तब-तब चल सकते हैं जब भी उनके ओनर को सेल, पार्ट या ओपनिंग की ज़रूरत हो। उन्हें कोई बिज़नेस ऑपरेशन नहीं करना चाहिए, डेटा append नहीं करना चाहिए या कोई unbounded सब्सक्रिप्शन शुरू नहीं करना चाहिए।

<a id="behavior-and-presentation-boundary"></a>

## व्यवहार और presentation की सीमा

स्थायी Base नियम यह है:

> Base पुन: उपयोग योग्य व्यवहार और उसे लागू करने के लिए आवश्यक संरचना का स्वामी है। Presentation लेयर उत्पाद की विज़ुअल भाषा की स्वामी है।

"Unstyled" का अर्थ "एक खाली view" नहीं है। ओवरले प्लेसमेंट, कीबोर्ड नेविगेशन, एडिटिंग, virtualization, back नेविगेशन, dismissal और safe areas के लिए आंतरिक संरचना और state आवश्यक है। उस काम को हर कॉलर पर डाल देना लचीलापन नहीं लाएगा; यह नाज़ुक व्यवहार की नक़ल करेगा।

इसके विपरीत, Base को ब्रांड रंग, टाइपोग्राफ़ी, डेंसिटी, अंतिम आइकन, कॉम्पोनेंट वेरिएंट, स्ट्रिंग या ऐप कंपोज़िशन नहीं चुननी चाहिए। Presentation को इस तरह expose करें: मुख्य पार्ट पर `class` / `style`, हर अन्य पार्ट के लिए `<part>Class` / `<part>Style`, typed state styles (`active`, `hover`, `focus`, `selected`, `checked`, `disabled`), नामित slots (`trigger`, `header`, `footer`) और रेंडर फ़ंक्शन। शीर्षक, विवरण या close बटन खोजने के लिए मनमाने descendants का निरीक्षण न करें: semantic parts को explicit बनाएँ, और हर लेबल को prop या child के रूप में लें।

<a id="theme-and-styling"></a>

## थीम और स्टाइलिंग

थीम से semantic मान पढ़ें और लेआउट को Rust में typed style मेथड और TSX में Tailwind classes से लागू करें ([Tailwind](./tailwind.md), [थीम टोकन](./tailwind.md#theme-tokens)):

```rust tabs
view()
    .bg(move || theme().background)
    .text_color(move || theme().foreground)
    .border_1()
    .border_color(move || theme().border)
    .rounded(move || theme().radius)
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-background text-foreground" />
```

नियम:

- उत्पाद के रंग, corner radii, spacing या कंट्रोल की ज्यामिति को hard-code न करें;
- ऐप कोड में raw hex, `rgb` / `rgba` या `hsla` मान न डालें; `theme()` से semantic रंग पढ़ें या टोकन class (`bg-primary`) का उपयोग करें, या ऐप की थीम फ़ाइल में छूटा हुआ role जोड़ें;
- ऐप लेआउट में मनमाने मानों (`p-[13px]`, `px(13.0)`) के बजाय spacing और type scales (`p-2`, `gap-3`, `w-64`, `text-sm`; `.p_2()`, `.gap_3()`, `.w_64()`, `.text_sm()`) का उपयोग करना चाहिए;
- classes का ठीक वही अर्थ है जो Tailwind CSS v4 में है, और style मानों का वही जो [स्टाइल संदर्भ](../modules/style-reference.md) उन्हें देता है (CSS वाला, native रूपों में: संख्याएँ points हैं); `unknown class` चेतावनी ऐसी खोज है जिसे ठीक करना चाहिए;
- अर्थ के लिए semantic टोकन का उपयोग करें, पैलेट में स्थिति के लिए नहीं;
- state-स्वतंत्र ज्यामिति को साधारण builder chain या class string में रखें;
- runtime interaction states के लिए `active:`, `hover:` और `focus:` (`.active(..)`, `.hover(..)`, `.focus(..)`) का उपयोग करें; वे ऐप कोड तक round trip के बिना native रूप से लागू होते हैं;
- checked, selected, pressed या disabled रूप के लिए कॉम्पोनेंट की semantic state styles (`selected:`, `checked:`, `disabled:`) का उपयोग करें;
- popup की ओनरशिप को explicit state (`open` के साथ `onOpenChange`) में रखें ताकि उसका trigger dismissal तक open या pressed रूप दिखा सके;
- कॉम्पोनेंट वेरिएंट कम और अर्थपूर्ण रखें, हर कॉल साइट के लिए एक वेरिएंट जोड़ने के बजाय;
- प्राथमिक स्टाइलिंग को निर्णय क्षेत्र के वास्तविक default commit और उसके return-key action से बाँधें; इसे action की संख्या, आवृत्ति या टूलबार में स्थिति से derive न करें;
- badge और alert वेरिएंट को semantic और सीमित रखें। साधारण मेटाडेटा neutral रहता है; केवल इसलिए कि कोई वेरिएंट मौजूद है, हर enum केस या सेक्शन को अलग रंग से न जोड़ें।

प्रभावी वरीयता क्रम यह है: एलिमेंट की अपनी style, फिर state styles (बाद की states जीतती हैं), और सबसे ऊपर `disabled`। बाद की परतें केवल वही फ़ील्ड बदलती हैं जो उन्होंने सेट किए हैं।

ऐप की नई presentation के लिए थीम के semantic टोकन को प्राथमिकता दें। ऐप की थीम फ़ाइल का हर नाम एक टोकन है, ठीक वैसे ही जैसे Tailwind के `@theme` का कोई variable (`"up": "#16a34a"` TSX में `text-up`, `bg-up/30`, `token("up")` और Rust में `theme().color("up")` देता है), और थीम में light और dark मान होते हैं, इसलिए टोकन बिना `dark:` class के appearance का अनुसरण करता है। टोकन के नाम roles के आधार पर रखें, कॉम्पोनेंट के आधार पर नहीं, ताकि वे हर विजेट का extension point न बन जाएँ।

थीम को ऐप की थीम फ़ाइल (`nsh.json` `"theme"`) के ज़रिए बदलें, या embedding ऐप को अपनी देने दें: टोकन को नाम देने वाली classes और `theme()` को पढ़ने वाली Rust बाइंडिंग, थीम बदलने पर बिना किसी JavaScript के चले, native रूप से पुनः स्टाइल हो जाती हैं। जो कोड टोकन के मान को अपने सिग्नल में कॉपी कर लेता है, वह उसका अनुसरण करना बंद कर देता है।

बाहर की ओर वाले फ़ोकस रिंग को भौतिक जगह चाहिए। `overflow: hidden` (`overflow-hidden`) वाला कोई ancestor उसे clip कर देता है। ऐसे लेआउट को प्राथमिकता दें जो जगह छोड़ते हों; यदि किसी उत्पाद को भारी clipping करनी ही है, तो सारा कीबोर्ड फ़ोकस चुपचाप छिपाने के बजाय focused state को कंट्रोल के भीतर बनाएँ।

<a id="the-users-text-size-is-the-apps-zoom"></a>

### यूज़र का टेक्स्ट साइज़ ही ऐप का zoom है

टेक्स्ट यूज़र के टेक्स्ट साइज़ (Dynamic Type, Android का font scale, डेस्कटॉप की सेटिंग्स) का अनुसरण करता है: TSX में `fontScale()`, Rust में `font_scale()`, दोनों reactive। type scale (`text-sm`, `text-base`: 16 points, बॉडी साइज़) संदर्भ तय करता है, और यूज़र की सेटिंग उसे स्केल करती है। यह जानबूझकर Tailwind के मॉडल के उपयोगी हिस्से का अनुसरण करता है: असंबंधित point स्थिरांकों के बजाय नामित type, spacing और size steps।

टेक्स्ट कंटेनरों को उनके टेक्स्ट के साथ बढ़ने दें: उन्हें निश्चित ऊँचाई के बजाय न्यूनतम ऊँचाई और padding दें। जो कस्टम कॉम्पोनेंट स्केल किए गए टेक्स्ट को अपने चारों ओर की निश्चित ज्यामिति के साथ जोड़ता है, उसे दस्तावेज़ में बताना चाहिए कि वह हिस्सा क्यों नहीं बढ़ना चाहिए।

ऐप UI में हर मनमाने point मान और raw color constructor को समीक्षा में पाई गई खोज मानें। इसे केवल किसी दस्तावेज़ित भौतिक या प्लेटफ़ॉर्म सीमा, मापी गई runtime ज्यामिति, raster या डेटा रंग, या स्वयं थीम की परिभाषा के लिए स्वीकार करें। सुविधा और स्क्रीनशॉट से मेल खाना वैध अपवाद नहीं हैं।

हल किए गए लेआउट से cache की गई हर चीज़ की invalidation key में font scale शामिल होना चाहिए, सीधे या ऐसे revision के ज़रिए जो उसके साथ बदलता हो: लिस्ट को बताई गई रो की ऊँचाइयाँ, टेक्स्ट माप, popup ज्यामिति, टेक्स्ट से derive किए गए आइकन साइज़ और कस्टम canvas मेट्रिक्स।
<a id="events-commands-and-focus"></a>

## इवेंट, कमांड और फ़ोकस

सक्रियण (activation) के लिए प्रेस का उपयोग करें: `onPress`, `onLongPress`, `onPressDown` और `onPressUp` का अर्थ उंगली, पेन, माउस या कीबोर्ड, सभी के साथ एक ही है। टच हैंडलर और जेस्चर का उपयोग केवल उन चीज़ों के लिए करें जो उंगली का अनुसरण करती हैं (पैन, ड्रैग)। जिन कमांड को की-बाइंडिंग, मेनू या कई इनपुट से डिस्पैच का समर्थन करना चाहिए, उनके लिए कीबोर्ड शॉर्टकट (`keymap.bind`, `on_key`) और मेनू आइटम का उपयोग करें। हैंडलर को उस पेज के पास रखें जो कमांड का स्वामी है।

एक तार्किक कमांड को केवल एक बार मॉडल करें। `Button`, `Menu` आइटम, `ContextMenu` आइटम, `nsh/desktop` का एक एप्लिकेशन मेनू आइटम और एक कीबोर्ड शॉर्टकट, सभी को पाँच बार म्यूटेशन की नकल करने के बजाय स्टोर के उसी फ़ंक्शन को कॉल करना चाहिए। जहाँ व्यावहारिक हो, उनका लेबल, आइकन, शॉर्टकट और disabled स्थिति एक ही कमांड पॉलिसी से प्राप्त करें (`key_label("mod+s")` शॉर्टकट को प्लेटफ़ॉर्म के तरीके से लिखता है), ताकि एंट्री पॉइंट आपस में असहमत न हों। मेनू नेविगेशन और dismissal का स्वामी है; पेज अब भी तय करता है कि कमांड की अनुमति है या नहीं और वह क्या करती है।

```rust tabs
on_key("mod+s", move |_| save());
view()
    .child(button().on_press(save).child(text("Save")))
    .child(
        menu()
            .trigger(view().px_3().py_2().child(text("File")))
            .child(menu_item().on_select(save).child(text(format!("Save  {}", key_label("mod+s"))))),
    )
```

```tsx tabs
keymap.bind("mod+s", save);

<View>
  <Button onPress={save}><Text>Save</Text></Button>
  <Menu trigger={<View class="px-3 py-2"><Text>File</Text></View>}>
    <MenuItem onSelect={save}><Text>Save  {keymap.label("mod+s")}</Text></MenuItem>
  </Menu>
</View>
```

एलिमेंट चुनते समय सिमेंटिक रोल को बनाए रखें। कमांड के लिए `Button` का उपयोग करें, भले ही वांछित प्रस्तुति शांत हो; उसे लिंक से बदलने के बजाय उसे शांत स्टाइल दें। NSH ऐप्स `link` रोल को उन लक्ष्यों के लिए सुरक्षित रखते हैं जो ऐप के बाहर खुलते हैं, जैसे URL या ईमेल पता; ऐप के भीतर के गंतव्य के लिए नेविगेशन का और कमांड के लिए `Button` का उपयोग करें।

प्रोपेगेशन केवल तभी रोकें (टच इवेंट पर `stopPropagation()`) जब किसी नेस्टेड इंटरैक्शन को अपने पैरेंट को उसी टच को हैंडल करने से रोकना हो। प्रोपेगेशन को हर जगह रोकने से स्क्रॉलिंग, प्रेस और जेस्चर ऐसे तरीकों से टूट जाते हैं जिनका निदान करना कठिन होता है।

**मुख्य थ्रेड कभी ऐप कोड का इंतज़ार नहीं करता।** जब सिस्टम को तुरंत उत्तर चाहिए (क्या यह पेज pop हो सकता है, क्या यह शीट या पॉपओवर बंद हो सकता है, क्या यह टेक्स्ट बदल सकता है), तो NSH पहले से माउंट किए गए props से नेटिव रूप में उत्तर देता है, और इवेंट बाद में ऐप को बताता है। इसलिए निर्णय एक prop होता है, जो पता चलते ही सेट किया जाता है, न कि ऐसा कॉलबैक जो true या false लौटाए: पुष्टि के लिए `popOnBack={!dirty()}` के साथ `onBackPress` ([popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback)), प्रयास की सूचना पाने के लिए `closeOnEscape` और `closeOnBackdropPress` के साथ `onCancel`, इनपुट पर `maxLength`, बटन पर `disabled`।

मेनू आइटम का `shortcut` (`nsh/desktop`) मेनू सेट रहने तक अपनी key को बाइंड करता है, और मेनू उसे प्लेटफ़ॉर्म की शैली में दिखाता है; उसी कीस्ट्रोक की `keymap` बाइंडिंग उससे पहले आती है। हर कीस्ट्रोक का एक ही स्वामी रखें, और जब एप्लिकेशन मेनू के आइटम या शॉर्टकट बदलें तो उसे दोबारा सेट करें।

फ़ोकस का स्वामित्व स्पष्ट रखें:

- `Button`, `Switch` और मेनू आइटम डेस्कटॉप और वेब पर कीबोर्ड फ़ोकस स्टॉप हैं; कंट्रोल उन्हीं पर बनाएँ, सामान्य व्यू पर नहीं;
- फ़ोकस को ref के `focus()` से, किसी इवेंट या state परिवर्तन के बाद चलने वाले इफ़ेक्ट से, ले जाएँ, और स्क्रीन रीडर का फ़ोकस `set_accessibility_focus()` (Rust) या `nsh` से `setAccessibilityFocus` (TSX) द्वारा ले जाएँ;
- दिखाई देने वाली `focus:` स्थिति रेंडर करें;
- रेंडर करते समय बिना शर्त फ़ोकस का अनुरोध न करें।

कंपोज़िट विजेट को कुछ अलग-थलग शॉर्टकट के बजाय पूरा नेविगेशन मॉडल लागू करना चाहिए (तीर कुंजियों से गति, जहाँ उचित हो वहाँ Home / End या पेज मूवमेंट, पुष्टि, रद्दीकरण और Tab व्यवहार)।

ओवरले ऊपर से dismiss होते हैं: Escape और Android का बैक बटन उस शीर्ष ओवरले तक पहुँचते हैं जो सुन रहा है (`onCancel`)। तेज़ी से होने वाले बंद और खोलने के क्रमों को इस तरह हैंडल करें कि बीच की, पहले से बंद होती सतह पर कोई कार्रवाई न हो।

<a id="async-work-and-side-effects"></a>

## Async कार्य और साइड इफ़ेक्ट

Async कार्य किसी इवेंट, किसी इफ़ेक्ट या [`resource`](./reactivity.md#resource) से शुरू करें, कंपोनेंट बॉडी के बिना शर्त साइड इफ़ेक्ट के रूप में नहीं। इफ़ेक्ट केवल वही ट्रैक करता है जो वह synchronously पढ़ता है: पहले signals पढ़ें, फिर कार्य शुरू करें। जब कार्य पूरा हो, तो signals के माध्यम से state अपडेट करें, यह मानकर चलें कि कंपोनेंट जा चुका हो सकता है, और संबंधित बदलाव एक साथ लिखें।

बार-बार चलने वाले कार्य को किसी स्वामी (owner) के अधीन रखें ताकि उसके हटने पर वह रद्द हो जाए: Rust के tasks और timers अपने स्वामी के साथ समाप्त होते हैं, TSX के timers `cleanup` में रुकते हैं। जिस एकबारगी task को स्वतंत्र रूप से पूरा होना है उसे store से शुरू किया जा सकता है, लेकिन वह रद्द होने की सुविधा खो देता है। त्रुटियों और विफल अनुरोधों को स्पष्ट रूप से हैंडल करें।

Async ऑपरेशन को स्पष्ट states के साथ दर्शाएँ: resource का `state()` `unresolved`, `pending`, `ready`, `refreshing` या `errored` होता है। रीफ़्रेश के दौरान पिछला उपयोगी डेटा बनाए रखें: resource दोबारा लोड होते समय अपना मान रखता है। डुप्लिकेट विनाशकारी सबमिशन रोकें और पुनर्प्राप्त की जा सकने वाली त्रुटियाँ UI में दिखाएँ; उपयोगकर्ता फ़ीडबैक के लिए logs पर निर्भर न रहें।

```rust tabs
let results = resource(
    move || {
        let q = query.get();
        (!q.is_empty()).then_some(q)
    },
    |q, _info| async move {
        let response = fetch(format!("https://api.example.com/search?q={q}")).await?;
        if !response.ok() {
            return Err(format!("HTTP {}", response.status()));
        }
        Ok(response.text())
    },
);
```

```tsx tabs
const results = resource(
  () => query() || undefined,
  async (q, { signal }) => {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as SearchHit[];
  },
);
```

महँगी parsing या गणना को TSX हैंडलर से बाहर ले जाएँ: `computed` में, इंटरैक्शन पथ से दूर, या Rust में। परिणाम तब आ सकते हैं जब क्वेरी, पेज या चयन बदल चुका हो: resource पुराने पड़ चुके लोड छोड़ देता है, और आपका अपना कार्य revision या पहचान (identity) जोड़ता है और पुराने परिणामों को नए state पर लागू करने के बजाय अस्वीकार करता है।

<a id="layout-measurement-and-scrolling"></a>

## लेआउट, मापन और स्क्रॉलिंग

व्यू अपने चिल्ड्रन को एक कॉलम में लेआउट करता है, और चिल्ड्रन डिफ़ॉल्ट रूप से उसके आर-पार फैलते हैं; `class="flex"` (`.flex_row()`) CSS की तरह एक रो है। कंट्रोल्स की रो में चिल्ड्रन को केंद्र में रखना चाहिए (`items-center`), जो यही कहता है। पूरी ऊँचाई वाले कॉलमों की रो डिफ़ॉल्ट stretch रखती है, ताकि कॉलम रो की ऊँचाई भर दे और उसका हेडर ऊपर रहे:

```rust tabs
view()
    .flex_row()
    .flex_1()
    .child(sidebar())
    .child(content())
```

```tsx tabs
<View class="flex flex-1">
  <Sidebar />
  <Content />
</View>
```

अधिकांश UI को स्वयं मापने के बजाय लेआउट का उपयोग करना चाहिए ([लेआउट](./layout.md))। मापन (`onLayout`, `measure()`) ओवरले, वर्चुअलाइज़ेशन, एडिटर, चार्ट और ऐसे ही कंपोनेंट के लिए एक गहरा व्यवहार-उपकरण है जिनकी शुद्धता resolved ज्यामिति पर निर्भर करती है।

- मापन और ज्यामिति को उस लेयर में रखें जो व्यवहार का स्वामी है।
- लेआउट को केवल तभी observe करें जब सामान्य लेआउट संबंध व्यक्त न कर सके।
- हर लेआउट इवेंट पर असंबंधित ऐप state कभी न लिखें।
- मापे गए डेटा को revision-scoped मानें; टेक्स्ट आकार, चौड़ाई, थीम या कंटेंट बदलने के बाद वह पुराना हो सकता है।
- `nsh/base` के ओवरले को पॉपअप की स्थिति तय करने दें: उनकी placement, flipping और safe-area मार्जिन एक ही नीति का पालन करते हैं।

संरेखण (alignment) की अपरिवर्तनीय शर्तों के लिए सुधार के बजाय निर्माण को प्राथमिकता दें: सहोदर क्षेत्रों को समान literals दोहराने के बजाय वही spacing token या साझा inset उपयोग करना चाहिए। महत्वपूर्ण दोहराए जाने वाले किनारों, कॉलमों और अंतरालों के लिए वास्तविक प्लेटफ़ॉर्म (`nsh test --target`) पर ज्यामिति जाँचें या स्क्रीनशॉट जोड़ें। केवल डिफ़ॉल्ट विंडो पर न परखें: बड़ा टेक्स्ट आकार और डिस्प्ले स्केलिंग भिन्नात्मक निर्देशांकों को एक-पिक्सेल के खिसकाव में बदल सकते हैं, भले ही डिफ़ॉल्ट स्क्रीनशॉट संरेखित दिखे।

परिशुद्धता की समीक्षा करते समय resolved परिणाम मापें, लेकिन मापे गए सुधार को किसी मनमाने मान के रूप में एन्कोड न करें। असंगति का कारण दोहराई गई padding, नेस्टेड inset, बॉर्डर के स्वामित्व, फ़ॉन्ट मेट्रिक्स या राउंडिंग तक खोजें, फिर संरचनात्मक स्वामी को ठीक करें।

हर स्क्रॉल होने योग्य क्षेत्र का एक ही स्वामी होना चाहिए। एक ही अक्ष पर आकस्मिक नेस्टेड स्क्रॉलिंग से बचें। स्क्रॉल व्यू को वह एलिमेंट दें जो पूरे पेज, पैनल या सूची का स्वामी है, ताकि उसका indicator क्षेत्र के किनारे के सापेक्ष तय हो, और कंटेंट का inset उसके भीतर रखें (`contentClass` / `contentStyle`), स्क्रॉल व्यू को padding वाले कंटेनर में लपेटने के बजाय। कंटेंट और पेज की सीमा के बीच तैरता हुआ indicator आमतौर पर गलत स्क्रॉल स्वामी या गलत लेयर पर padding का संकेत देता है। safe area और कीबोर्ड से दूर रहने के लिए padding और margin में `env(safe-area-inset-*)` और `env(keyboard-inset-height)` का उपयोग करें (मान उनके accessors से पढ़ें), जो रोटेशन और कीबोर्ड का नेटिव रूप से अनुसरण करते हैं।

<a id="lists-tables-and-large-data"></a>

## सूचियाँ, टेबल और बड़ा डेटा

जब डेटा किसी छोटे, सीमित संग्रह से आगे बढ़ सकता हो तो [`List`](./lists.md) (Rust में `virtual_list`) का उपयोग करें। रो की पहचान को दिखाई देने वाली स्थिति से अलग रखें और हर अपडेट पर पूरे डेटा सेट की प्रतिलिपि बनाने से बचें। सूची को recycling, स्क्रॉल समन्वय और दिखाई देने वाली रेंज का स्वामी बनने दें, जबकि रो फ़ंक्शन रो की प्रस्तुति के स्वामी हों।

इन्हें अलग रखें:

- स्रोत डेटा और डोमेन id;
- फ़िल्टरिंग और सॉर्टिंग state;
- चयन state;
- स्क्रॉल state;
- रो रेंडरिंग।

इससे अपडेट स्थानीय रहते हैं और व्यू ट्री डेटा मॉडल बनने से बचता है।

वर्चुअलाइज़ेशन एक व्यवहारगत अनुबंध है, केवल प्रदर्शन का स्विच नहीं। रो फ़ंक्शन प्रति सेल एक बार चलता है, और सेल अन्य रो के लिए दोबारा उपयोग किए जाते हैं:

- **प्रति-आइटम state को id से कुंजीबद्ध डेटा में रखना चाहिए**, रो के भीतर बनाए गए signal में नहीं, जो सेल के साथ अगले आइटम तक चला जाता है;
- **आइटम को वहीं पढ़ना चाहिए जहाँ उसका उपयोग हो**, bindings में: रो फ़ंक्शन के शीर्ष पर कॉपी किया गया मान उस पहली रो का हो जाता है जो सेल ने दिखाई थी;
- TSX में अपडेट immutably करें (नया array, अपरिवर्तित आइटम पुनः उपयोग किए गए, बदला हुआ आइटम नया ऑब्जेक्ट), और सामान्य रो के करीब का `estimatedItemSize` दें;
- किसी आइटम तक स्क्रॉल करना (`scrollToIndex`) डेटा निर्देशांकों में काम करता है, भले ही अधिकांश रो मौजूद न हों।

```rust tabs
let liked = signal(HashSet::<u32>::new());

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
```

```tsx tabs
const liked = signal<Set<number>>(new Set());

<List each={posts()} estimatedItemSize={64} class="flex-1">
  {(post) => (
    <View class="flex-row p-4">
      <Text class="flex-1">{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

<a id="public-api-design"></a>

## सार्वजनिक API डिज़ाइन

पुनः उपयोग योग्य कंपोनेंट के लिए:

- props वैध डिफ़ॉल्ट स्थापित करते हैं: Rust में `#[prop(default)]` या `#[prop(default = …)]`, TSX में जहाँ prop पढ़ा जाता है वहाँ `??`;
- हर prop, इवेंट और export का एक doc comment हो; Rust में वही TypeScript declaration बन जाता है जो TSX को दिखता है;
- कॉलबैक अनुरोधित बदलावों का वर्णन करते हैं और पॉइंटर विवरण केवल तभी शामिल करते हैं जब वे अर्थपूर्ण हों;
- मनमाने descendants का निरीक्षण करने के बजाय स्पष्ट parts, slots और render functions बेहतर हैं;
- पुनः उपयोग योग्य व्यवहार जोड़ने से उत्पाद-स्तर का कोई दृश्य विकल्प थोपा नहीं जाना चाहिए।

ऐप्स host ऐप्स को हस्ताक्षरित पैकेज के रूप में दिए जाते हैं और हो सकता है कि उन्हें दोबारा कभी बिल्ड न किया जाए: NSH का हर परवर्ती रिलीज़ उन्हें जैसा है वैसा ही चलाता है। यही अनुशासन उस पर भी लागू करें जो कोई ऐप या कंपोनेंट लाइब्रेरी दूसरों के लिए उपलब्ध कराती है (उसके कंपोनेंट के props और इवेंट, उसके crate के exports, और वे फ़ंक्शन जो host ऐप के नेटिव कंपोनेंट और मॉड्यूल प्राप्त करते हैं):

- इनपुट में केवल वैकल्पिक सदस्य जुड़ते हैं; टाइप केवल विस्तृत होते हैं; डिफ़ॉल्ट और व्यवहार वही रहते हैं (नया व्यवहार opt-in होता है);
- जिस फ़ंक्शन के पैरामीटर बढ़ सकते हैं वह अपने विकल्प एक ऑब्जेक्ट (`scrollTo({ x, y, animated })`) के रूप में लेता है, कभी अतिरिक्त positional पैरामीटर के रूप में नहीं; जो पैरामीटर कभी नहीं बढ़ेंगे, जैसे रेंज का start और end, positional रहते हैं;
- मोड एक string union होता है, जिसमें मान जुड़ सकते हैं, न कि boolean जिसे बाद में तीसरी स्थिति चाहिए;
- एक मान का एक ही टाइप होता है: `version: string`, कभी `string | number` नहीं;
- फ़ंक्शन जो लौटाता है वह ऑब्जेक्ट होता है, जिसमें फ़ील्ड जुड़ सकती है, न कि tuple या अकेला मान;
- Promise लौटाने वाला फ़ंक्शन हर विफलता को उसे reject करके बताता है, और जिस विफलता को कॉलर हैंडल कर सकता है उसके साथ `code` होता है, जैसा NSH के अपने फ़ंक्शन करते हैं: कॉलर कोड्स पर शाखा बनाते हैं, जबकि संदेश लोगों के लिए हैं और बदल सकते हैं;
- नाम बदलने पर पुराना नाम उसी implementation के `@deprecated` alias के रूप में रहता है।

Rust में, उस व्यवहारगत state के लिए निजी फ़ील्ड डिफ़ॉल्ट हैं जिसे कॉलर को तोड़े बिना विकसित होना है। सार्वजनिक फ़ील्ड जानबूझकर रिकॉर्ड-जैसे कॉन्फ़िगरेशन और serialized डेटा के लिए उपयुक्त हैं। सार्वजनिक फ़ील्ड वाले हर सार्वजनिक struct पर `#[non_exhaustive]` होना चाहिए और उसे `Default` लागू करना चाहिए, ताकि कॉलर पूर्ण struct literal के बिना मान बना सकें और किसी फ़ील्ड को उन्हें तोड़े बिना जोड़ा जा सके।

आंतरिक संरचना को पुनर्गठित करते समय सार्वजनिक import पथ स्थिर रखें: crate का `#[native_module]` specifier और उसके exports, तथा TSX मॉड्यूल के exports, वही हैं जिन्हें अन्य कोड import करता है। वेब-फ्रेमवर्क की शब्दावली के बजाय प्लेटफ़ॉर्म कंट्रोल की शब्दावली और NSH के स्थापित नामकरण को प्राथमिकता दें।
<a id="platform-and-capability-boundaries"></a>

## प्लेटफ़ॉर्म और क्षमताओं की सीमाएँ

यह मानकर न चलें कि हर प्लेटफ़ॉर्म एक ही सुविधा देता है। टाइटल बार और विंडो कंट्रोल, एक्सेसिबिलिटी, क्लिपबोर्ड, हैप्टिक्स, स्क्रोल फ़िज़िक्स, फ़ॉन्ट और टाइमिंग अलग-अलग हो सकते हैं। एक ही बंडल हर जगह चलता है
([Platform-specific code](./platform-specific.md)); प्लेटफ़ॉर्म-विशिष्ट कोड वहीं रखें जहाँ NSH उसके लिए जगह देता है, और
फ़ॉलबैक व्यवहार तय करें:

- किसी एलिमेंट का हर प्लेटफ़ॉर्म पर क्या अर्थ है, यह एक टॉप-लेवल prop होता है; किसी प्लेटफ़ॉर्म की अपनी सिस्टम सुविधा
  `ios={{…}}`, `android={{…}}`, `desktop={{…}}` या `web={{…}}` में जाती है (Rust में builder मेथड), उन सभी प्लेटफ़ॉर्म में जिनमें वह सुविधा है, और केवल मौजूदा प्लेटफ़ॉर्म का ऑब्जेक्ट लागू होता है;
- मोबाइल प्लेटफ़ॉर्म के API `nsh/mobile` से आते हैं, डेस्कटॉप के `nsh/desktop` से;
- प्लेटफ़ॉर्म के अनुसार स्टाइल `ios:`, `android:` और `web:` क्लासेज़ हैं।

प्लेटफ़ॉर्म ब्रांच को सिमैंटिक कॉन्ट्रैक्ट बनाए रखना चाहिए, भले ही प्रस्तुति अलग हो। उदाहरण के लिए, डायलॉग iOS पर शीट होता है और डेस्कटॉप पर विंडो के ऊपर एक लेयर, लेकिन ऐप को फिर भी एक सुसंगत open state चाहिए। साझा व्यवहार को headless टेस्ट करें और प्लेटफ़ॉर्म वाले हिस्से को `nsh test --target` से। NSH जो मान रिपोर्ट करता है
(`platform.os`, कोई state, कोई reason) उस पर हर ब्रांच को एक `default` दें: बाद के रिलीज़ में प्लेटफ़ॉर्म और केस जुड़ते हैं, और आज डिलीवर किया गया ऐप उन पर चलता है ([Compatibility](./compatibility.md))।

ऐप अपनी VM के बाहर जो कुछ भी इस्तेमाल करता है, उसे `nsh.json` `"capabilities"` में घोषित करता है: जिन होस्ट से वह fetch करता है, जो पेज web view दिखाता है, क्लिपबोर्ड, स्टेटस बार ([Sandbox and Capabilities](./sandbox-and-capabilities.md))। जो ऐप दूसरे ऐप्स के भीतर डिलीवर होगा, वह ठीक वही सूचीबद्ध करे जो वह इस्तेमाल करता है, और अस्वीकृत अनुरोध को वैसे ही संभाले जैसे विफल अनुरोध को: होस्ट ऐप उतनी अनुमति दे सकता है जितनी ऐप ने घोषित की है उससे कम। अस्वीकृत कॉल `code` `"ERR_ACCESS_DENIED"` के साथ विफल होती है, जिसका `permission` क्षमता का नाम बताता है और `resource` बताता है कि क्या माँगा गया था।

<a id="file-and-naming-conventions"></a>

## फ़ाइल और नामकरण परंपराएँ

- पेजों और कंपोनेंट्स के नाम प्रोडक्ट की अवधारणाओं पर रखें: `ProjectList`, `ProjectEditor`, `SettingsPage`।
- इवेंट हैंडलर्स के नाम मंशा (intent) पर रखें: `confirmDelete`, `openProject`, `onQueryChange`।
- हर मॉड्यूल की एक मुख्य ज़िम्मेदारी रखें; फ़ाइल को तब बाँटें जब state का स्वामित्व या लाइफ़साइकल असंबंधित व्यवहार को पढ़े बिना समझा न जा सके।
- कंपोनेंट का मॉड्यूल, props, इवेंट और केंद्रित टेस्ट एक साथ रखें, यदि वे एक साथ बदलते हैं।
- इनवेरिएंट्स और चौंकाने वाली लाइफ़साइकल बाधाओं का दस्तावेज़ बनाएँ; स्पष्ट builder कॉल्स का वर्णन न करें।
- Rust में `rustfmt` का उपयोग करें और Clippy को संतुष्ट करें, और TSX में `nsh check`। ऐसे व्यापक `allow` एट्रिब्यूट से बचें जो असंबंधित चेतावनियों को छिपाते हैं।

<a id="vocabulary-is-part-of-the-api"></a>

### शब्दावली API का हिस्सा है

एक ही अवधारणा के लिए सभी कंपोनेंट्स में एक ही शब्द का उपयोग करें। किसी prop या इवेंट का नाम रखने से पहले, वह शब्द पहले NSH के अपने API में खोजें, फिर GPUI Kit के `gpui-base`, GPUI और `gpui-component` में, फिर प्लेटफ़ॉर्म के कंट्रोल्स में। प्रिमिटिव क्या दिखाता है और ग्लोबल API क्या लेते हैं, इनके नाम HTML, DOM और CSS से आते हैं (`src`, `html`, `placeholder`)। Rust नाम `snake_case` होते हैं और TSX में `camelCase` में बदल जाते हैं (`on_open_change` बन जाता है `onOpenChange`); एक शब्द एक ही शब्द रहता है (`readonly`, `multiline`)।

| अवधारणा | नामकरण पैटर्न | उदाहरण |
| --- | --- | --- |
| कंपोनेंट | संज्ञा, `PascalCase` | `Button`, `Dialog`, `QuantityStepper` |
| उसके props और इवेंट (Rust) | `<Component>Props`, `<Component>Event` | `ButtonProps`, `ButtonEvent::Press` → `onPress` |
| किसी व्यवहार का state ऑब्जेक्ट | `<Control>State`, जिसे `create<Control>` बनाता है | `NavStackState`, `createNavStack` |
| मान क्यों बदला | `<Control>ChangeReason`, एक string union | `DialogChangeReason`: `"cancel"`, `"backdropPress"` |
| कोई state | विशेषण, सकारात्मक, `is` उपसर्ग के बिना | `open`, `hidden`, `disabled`, `selected`, `checked`, `readonly` |
| उपयोगकर्ता क्या कर सकता है | विशेषण | `scrollable`, `zoomable`, `selectable`, `resizable` |
| बिना विशेषण वाली सुविधा | `<feature>Enabled` | `pagingEnabled` |
| कोई हिस्सा दिखता है या नहीं | हिस्से के नाम पर एक boolean, डिफ़ॉल्ट `true` | `scrollbar`, `caret` (`scrollbar={false}`) |
| कोई slot दिखता है या नहीं | `<slot>Visible`, डिफ़ॉल्ट `true` | `headerVisible` (`header` पेज का slot है) |
| किसी हिस्से की स्टाइल | `<part>Class`, `<part>Style` | `backdropClass`, `contentStyle` |
| किसी state की स्टाइल | `<state>Style`, `<state>:` क्लासेज़ | `activeStyle`, `disabled:` |
| कोई slot | वह क्या है | `header`, `footer`, `trigger`, `content`, `empty` |
| ऐप की सामग्री | `render<Part>` | `renderCodeBlock` |
| खारिज करने का फ़्लैग | `closeOn<Trigger>`, डिफ़ॉल्ट `true` | `closeOnEscape`, `closeOnBackdropPress` |
| किसी मान का बदलना | `on<Value>Change({ <value>, ... })`, एक ऑब्जेक्ट | `onChange({ value })`, `onOpenChange({ open, reason })` |
| कोई अन्य इवेंट | `on<Event>`, वर्तमान काल, एक ऑब्जेक्ट | `onPress()`, `onSubmit({ text })` |
| कोई चरण (phase) | `<act>Start`, `<act>End` | `onPanStart`, `onLoadStart` |
| किसी व्यू पर माउस | `Enter` / `Move` / `Leave`, DOM के | `onMouseEnter`, `onMouseMove`, `onMouseLeave` |
| सुनना शुरू करना | `on(event, listener)`, `() => void` लौटाता है | `host.on(name, l)`, `BackHandler.on("press", l)` |
| एनवायरनमेंट का कोई मान | एक accessor, उसके बगल में `set<Value>` | `colorScheme()`, `setColorScheme` |
| केवल-पढ़ने योग्य boolean | `is<Adjective>`, `has<Noun>` | `isAvailable` |

Props कभी `is<Adjective>` नहीं होते: यह रूप उसके लिए है जो केवल boolean पढ़ता है (कोई स्थिरांक, payload का कोई फ़ील्ड)। जो हिस्सा दिखता है उसका नाम हिस्से के नाम पर होता है, कभी `<part>Shown`, `<part>Hidden` या `shows<Part>` नहीं।

Rust builder `Self` लेता और लौटाता है और उसका नाम उस prop के नाम पर होता है जिसे वह सेट करता है, `set_` के बिना (`.disabled(..)`, `.checked(..)`, `.on_change(..)`); जगह पर ही बदलाव `set_<field>` है (`setRoutes`, `setColorScheme`)। boolean reader या तो `has<Noun>` होता है, जब मान में कुछ होता है, या `is<Adjective>`, जब वह किसी state या अनुमति का वर्णन करता है। जब भी क्रिया का कोई विशेषण हो, विशेषण चुनें: `isClosable` को `canClose` पर, `isZoomable` को `canZoom` पर। जब क्रिया एक क्रिया-पदबंध हो जिसका विशेषण रूप नहीं है, तो उस चीज़ का नाम रखें जिसकी उसे ज़रूरत है: `hasDefinition`, `canGoToDefinition` नहीं। नए `can` reader न जोड़ें।

<a id="let-the-enclosing-name-carry-the-context"></a>

### संदर्भ को घेरने वाले नाम से आने दें

नाम किसी चीज़ के भीतर पढ़ा जाता है: prop अपने कंपोनेंट के भीतर, फ़ील्ड अपने टाइप के भीतर। कोई भी उसे नहीं दोहराता जो उसे घेरता है (`contentStyle`, `contentContainerStyle` नहीं; `Dialog` का `backdropClass`, `dialogBackdropClass` नहीं)। एक टाइप के फ़ील्ड्स को संक्षिप्तीकरण के एक ही स्तर पर रखें।

<a id="use-precise-domain-words"></a>

### सटीक डोमेन शब्दों का उपयोग करें

- **selected** सदस्यता या मौजूदा आइटम है; **checked** और **pressed** चेकबॉक्स या टॉगल का मान हैं; **focused** कीबोर्ड का लक्ष्य है; **hovered** पॉइंटर की उपस्थिति है। इन्हें कभी एक-दूसरे की जगह इस्तेमाल न करें।
- **open / close** ओवरले की स्थिति है; **show / hide** एक अस्थायी अनुरोध; **expand / collapse** संरचना।
- **disabled** इंटरैक्शन को रोकता है; **readonly** चुनने और नेविगेट करने की अनुमति देता है पर संपादन की नहीं; **loading** किसी ऑपरेशन के चलने के दौरान दोहरे काम को रोकता है।
- **press** किसी भी इनपुट से सक्रियण है, और NSH के इवेंट press कहते हैं (`onPress`); **click** माउस का है।
- **index** एक स्थिति है; **id** पहचान है। क्रम बदलने योग्य डेटा को index से सहेजें या key न करें।
- **value** नियंत्रित डोमेन डेटा है; **state** बनाए रखा गया व्यवहार है।
- **src** वह संसाधन है जिसे कोई एलिमेंट दिखाता है (इमेज, वीडियो, पेज); कोई भी अन्य पता **url** है।
- **role** बताता है कि किसी विकल्प का क्या अर्थ है (`"cancel"`, `"destructive"`); रूप-रंग ऐप का होता है।

`data`, `item2`, `handleAction`, `updateUi`, `process`, `manager` या `config` जैसे अस्पष्ट नामों से बचें, जब कोई अधिक सटीक डोमेन शब्द मौजूद हो।

<a id="type-and-module-style"></a>

### टाइप और मॉड्यूल शैली

- Rust टाइप `UpperCamelCase` होते हैं; मॉड्यूल, फ़ंक्शन, मेथड, फ़ील्ड और लोकल `snake_case`; स्थिरांक `SCREAMING_SNAKE_CASE`। कॉन्टेक्स्ट बाइंडिंग्स का नाम `cx` रखें।
- TSX कंपोनेंट और उनके टैग `PascalCase` होते हैं; props, फ़ंक्शन और लोकल `camelCase`। प्रिमिटिव `nsh` से आते हैं, बेस कंपोनेंट `nsh/base` से।
- किसी कंपोनेंट के नाम वाला मॉड्यूल उसकी सार्वजनिक सीमा का स्वामी होता है; उसके state, हिस्सों और टेस्ट को अलग फ़ाइलों में बाँटें, बिना इस बदलाव के कि दूसरे क्या import करते हैं।
- एक कंपोनेंट अवधारणा के लिए एकवचन मॉड्यूल नाम और परिवारों के लिए स्थापित नाम इस्तेमाल करें (`menu` `Menu`, `MenuItem` और `Submenu` के लिए)।
- आइडेंटिफ़ायर्स में `Id` प्रत्यय लगाएँ, और संग्रहों में सार्थक बहुवचन। एक उप-प्रणाली में `idx`, `index` और `ix` को बारी-बारी से इस्तेमाल न करें।
- जहाँ संभव हो, प्रेडिकेट्स के नाम सकारात्मक रखें। एक सकारात्मक state को कई नकारात्मकों की तुलना में जोड़ना आसान होता है, लेकिन `disabled` जैसे स्थापित शब्द रखें जहाँ वे कंट्रोल के अर्थ से मेल खाते हों।

<a id="callback-and-event-wording"></a>

### कॉलबैक और इवेंट की शब्दावली

- हर इवेंट एक ऑब्जेक्ट पास करता है, भले ही एक ही फ़ील्ड हो और किसी मान के बदलाव के लिए भी, उसके फ़ील्ड्स के नाम उन props के नाम पर जिन्हें वे रिपोर्ट करते हैं: `onChange({ value })`, `onOpenChange({ open, reason })`, `onLinkPress({ url })`। तब बाद का कोई फ़ील्ड एक जोड़ बन जाता है। API का कोई डेटा टाइप फ़ील्ड होता है, कभी स्वयं payload नहीं (`onImagePress({ image })`); जिस इवेंट के पास रिपोर्ट करने को कुछ नहीं, वह कुछ पास नहीं करता।
- क्रिया (act) का नाम रखें, भूतकाल या अनुरोध का नहीं: `onPress`, `onClose`, `onCancel`, `onBackPress`।
- जब क्रिया का कोई नाम हो, तो ज्यामिति के बजाय मंशा का नाम रखें: `onLoadMore`, "अंत तक पहुँच गए" नहीं।
- लाइफ़साइकल जोड़ियाँ `onOpen` / `onClose` हैं; चरण `Start` / `End` हैं, कभी `Begin` नहीं; किसी व्यू पर माउस `onMouseEnter` / `onMouseMove` / `onMouseLeave` है (DOM के नाम), उस पर खींची गई फ़ाइल `Enter` / `Leave`।
- दस्तावेज़ में बताएँ कि कॉलबैक कंपोनेंट के अपने state के बदलने से पहले चलता है या बाद में, और क्या वह कंपोनेंट में दोबारा प्रवेश (re-enter) कर सकता है।

<a id="documentation-and-copy-style"></a>

### दस्तावेज़ीकरण और कॉपी शैली

सार्वजनिक दस्तावेज़ की शुरुआत इससे होनी चाहिए कि कंपोनेंट क्या करता है और उसके state का स्वामी कौन है। उदाहरणों में मौजूदा API का उपयोग होना चाहिए और स्थिर id दिखाने चाहिए। डिफ़ॉल्ट, प्लेटफ़ॉर्म के अंतर, फ़ोकस व्यवहार, कॉलबैक का क्रम, और कौन से props मुख्य थ्रेड नेटिव रूप से पढ़ता है, इनका दस्तावेज़ बनाएँ।

लेबल, कमांड, पुष्टि डायलॉग, कैपिटलाइज़ेशन और एलिप्सिस के लिए Design Guides के इंटरफ़ेस भाषा नियमों का पालन करें। हर डोमेन ऑब्जेक्ट, कमांड और state के लिए एक मानक शब्द रखें।

अनुवाद की कुंजियाँ स्थिर मंशा का वर्णन करती हैं (`dialog.deleteProject.title`), स्रोत-भाषा के किसी वाक्य या स्क्रीन के निर्देशांक का नहीं। अनूदित टुकड़ों से कभी कोई वाक्य न जोड़ें और एक कुंजी को उन अर्थों के लिए दोबारा इस्तेमाल न करें जिनका अंग्रेज़ी पाठ संयोग से एक जैसा है।

सिंटैक्स का नहीं, मंशा का स्थानीयकरण करें। हर लोकेल को शब्द क्रम, बहुवचन, विराम चिह्न और ज़रूरी संदर्भ की मात्रा पर नियंत्रण दें। टेस्ट को गायब कुंजियाँ और असंगत निश्चित शब्द पकड़ने चाहिए; दोहराव संदर्भ से उचित है या नहीं, यह फ़ैसला अब भी मानवीय समीक्षा करती है। हर स्ट्रिंग को उसके कंपोनेंट के भीतर यथार्थवादी सामग्री, टेक्स्ट के फैलाव और बड़े टेक्स्ट आकार के साथ जाँचें।

<a id="testing-strategy"></a>

## टेस्टिंग रणनीति

व्यवहार को साबित कर सकने वाली सबसे निचली परत पर टेस्ट करें ([Testing](./testing-and-trace.md)):

1. state परिवर्तनों, फ़ॉर्मैटिंग, पार्सिंग और क्रम के लिए शुद्ध (pure) टेस्ट (किसी crate के फ़ंक्शन का `cargo test`, store के फ़ंक्शन की एक टेस्ट फ़ाइल);
2. कंपोनेंट, इवेंट और जीवनकाल के लिए headless ऐप टेस्ट: असली इंजन, रेंडरर, लेआउट और सूचियाँ, 60 Hz पर डिस्प्ले फ़्रेम के साथ, `nsh test` (`nsh/test`) या `cargo test` (`nsh_testing::Headless`) में;
3. फ़ोकस, कीबोर्ड, पॉइंटर, लेआउट और रेंडर की गई स्थिति के लिए इंटरैक्शन टेस्ट, उन चरणों के साथ जो उपयोगकर्ता लेता है (`press`, `type`, `scroll`, `drag`, `keyboard.press`), headless और असली प्लेटफ़ॉर्म पर (`nsh test --target macos`, `ios`, `android`, `web`, ...);
4. पूरे वर्कफ़्लो के लिए उदाहरण या ऐप स्मोक टेस्ट, और किसी इंटरैक्शन की लागत के लिए `nsh test --trace`।

```rust tabs
#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open("./App.tsx");
  await app.press("role:button[Tap]");
  expect(app.texts()).toContain("Count: 1");
});
```

किसी इंटरैक्टिव कंपोनेंट के लिए, उसके कार्यान्वयन विवरण के बजाय सिमैंटिक कॉन्ट्रैक्ट को कवर करें: press और कीबोर्ड से सक्रियण, नियंत्रित मान परिवर्तन, disabled व्यवहार, फ़ोकस की गति, इवेंट की संख्या और क्रम, स्थिर पहचान, और महत्वपूर्ण खाली या विफलता की स्थितियाँ। नेटवर्क को stub करें (`network` routes) और समय को नियंत्रित करें (मैन्युअल क्लॉक), असली के इंतज़ार के बजाय। जब भी विफलता को निश्चित रूप से दोहराया जा सके, बग ठीक करने से पहले एक रिग्रेशन टेस्ट जोड़ें।

व्यूज़ को वैसे खोजें जैसे उपयोगकर्ता खोजता है: role और नाम, लेबल या टेक्स्ट से (`role:button[Save]`, `label:Close`), और जहाँ कुछ और उनका नाम नहीं लेता वहाँ एक स्थिर `testID` से। सिलेक्टर हर चरण पर दोबारा पढ़े जाते हैं, ताकि कोई चरण कभी पुराने स्नैपशॉट पर कार्य न करे। उन दृश्य तथ्यों के लिए स्क्रीनशॉट का उपयोग करें जिन्हें सिलेक्टर व्यक्त नहीं कर सकते (`app.screenshot`, असली प्लेटफ़ॉर्म पर); निर्देशांक का उपयोग केवल अंतिम विकल्प के रूप में करें। स्वचालित और मैन्युअल प्रमाण अलग-अलग रिपोर्ट करें।

<a id="performance-rules"></a>

## प्रदर्शन नियम

- किसी बाइंडिंग या उस इफ़ेक्ट से, जो उसे पढ़ता है, state को बिना शर्त न लिखें।
- बाइंडिंग्स या row फ़ंक्शन के भीतर signals, effects, key bindings और महँगी डेटा संरचनाएँ बनाने से बचें।
- Signals को बाइंडिंग्स में पढ़ें, ताकि कोई सुसंगत बदलाव ट्री के सबसे छोटे हिस्से को अपडेट करे।
- लंबे संग्रहों के लिए `List` का उपयोग करें और केवल दिखाई देने वाली रेंज रेंडर करें।
- केवल क्लोज़र को संतुष्ट करने के लिए बड़ी स्ट्रिंग या संग्रहों को क्लोन करने से बचें; `Copy` हैंडल या साझा डेटा कैप्चर करें (`SharedString`, `Rc`)।
- TSX हैंडलर और computed मान हल्के रखें; भारी काम को इंटरैक्शन पाथ से हटाएँ या Rust में ले जाएँ।
- कैश जोड़ने से पहले `nsh test --trace` से मापें। हर कैश का एक स्पष्ट invalidation स्वामी होना चाहिए।
- एनिमेशन का काम सीमित रखें: UI थ्रेड पर एनिमेटेड मान, हर फ़्रेम लिखे जाने वाले signals के बजाय, स्क्रॉल लिसनर के बजाय `scrollValue` ([Animation](./animation.md)), और reduced motion का सम्मान करें (`reduceMotion()`)।
<a id="common-failure-modes"></a>

## सामान्य विफलता पैटर्न

इन पैटर्न से बचें:

- एक ही signal में ऐप की असंबंधित state रखना;
- लंबे component body में business logic और network requests एम्बेड करना;
- पुनः क्रमित किए जा सकने वाले content के लिए random या index-आधारित keys;
- `List` row के अंदर बनाए गए signals में प्रति-row state रखना;
- component body में किसी prop या signal को पढ़कर यह उम्मीद करना कि वह अपडेट होगा;
- ऐसे literal रंग और radii जो custom themes और dark mode को तोड़ते हैं;
- जहाँ कोई semantic component पहले से focus, keyboard, disabled और accessibility व्यवहार देता है, वहाँ custom pressable views बनाना;
- नियंत्रित (controlled) मान से अलग हो जाने वाली duplicated local state;
- ऐसे effects जो एक signal को दूसरे में कॉपी करते हैं, और ऐसे writes जो binding के जरिए loop बनाते हैं;
- सिस्टम को तुरंत चाहिए वाला निर्णय पहले से सेट किए गए prop की जगह callback पर छोड़ देना;
- स्पष्ट ownership के बिना nested scroll views;
- किसी एक-बार की स्क्रीन के लिए नया component variant;
- पलटने योग्य, कम जोखिम वाली क्रियाओं के लिए confirmation dialogs;
- ऐसे tests जो internal functions को कॉल करते हैं लेकिन कभी press, type या scroll नहीं करते।

<a id="rules-for-coding-agents"></a>

## Coding agents के लिए नियम

संपादन से पहले, agent को निकटतम implementation, उसके tests, module के public exports और संबंधित reference page पढ़ना चाहिए। उसे signatures के लिए मौजूदा source और `.nsh/types` खोजना चाहिए, न कि React, React Native, CSS या GPUI के किसी उदाहरण का सादृश्य (analogy) के आधार पर अनुवाद करना चाहिए: NSH components केवल एक बार चलते हैं, और bindings उन signals का अनुसरण करती हैं जिन्हें वे पढ़ती हैं।

हर बदलाव के लिए, agent को यह बताने में सक्षम होना चाहिए:

1. behavior का owner और presentation का owner;
2. बनाए रखी गई identity और state का lifecycle;
3. press, keyboard, focus और accessibility का contract;
4. layout और scrolling का owner;
5. theme tokens और जानबूझकर रखे गए अपवाद;
6. वह test जो व्यवहार में regression होने पर विफल होगा।

जनरेट किए गए कोड की समीक्षा और परीक्षण किसी व्यक्ति द्वारा किया जाना चाहिए। "Compile हो जाना" UI गुणवत्ता का मानक नहीं है, और ऐसा व्यापक refactor जो केवल जनरेट किए गए कोड को साफ-सुथरा दिखाता है, ऐप के architecture से मेल खाने का विकल्प नहीं है।

## Implementation checklist

समीक्षा के लिए बदलाव खोलने से पहले, पुष्टि करें कि:

- state और side-effect का ownership स्पष्ट है;
- plain function बनाम component का चुनाव सोच-समझकर किया गया है, और props तथा signals वहीं पढ़े जाते हैं जहाँ उनका उपयोग होता है;
- दोहराए गए elements में स्थिर, domain-आधारित keys और test ids हैं;
- अलग-थलग visual literals की जगह theme tokens और Tailwind scale का उपयोग किया गया है;
- presses, keyboard shortcuts, focus, disabled state और overlays साथ मिलकर काम करते हैं;
- सिस्टम को तुरंत चाहिए वाले निर्णय props हैं, जो पहले से सेट किए गए हैं;
- loading, empty, error और cancellation पथ दर्शाए गए हैं;
- लंबे data sets `List` का उपयोग करते हैं, और प्रति-item state data में रखी गई है;
- public API में केवल विस्तार होते हैं, और वे dependency direction तथा encapsulation को बनाए रखते हैं;
- tests उपयुक्त layer पर व्यवहार को सिद्ध करते हैं, headless और उन platforms पर जिन्हें बदलाव छूता है;
- formatting, Clippy, `nsh check`, लक्षित tests और संबंधित examples पास होते हैं।

ऐप सेटअप के लिए [Getting started](./getting-started.md) देखें, और वर्तमान API विवरण के लिए [Elements](../elements/index.md) तथा [API](../modules/index.md) references देखें।
