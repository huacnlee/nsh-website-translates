---
title: "nsh/mobile"
description: "iOS और Android में क्या उपलब्ध है: TabBar (सिस्टम का टैब बार), iOS पर InputAccessoryView, Android पर BackHandler, और isAvailable।"
order: 12.2
source_hash: 53d6d77de0d6e9ca
---

# nsh/mobile

`nsh/mobile` में iOS और Android के लिए विशिष्ट क्षमताएँ हैं: दोनों पर सिस्टम का टैब बार, `TabBar`; iOS पर कीबोर्ड के ऊपर का बार, [`InputAccessoryView`](#inputaccessoryview); और Android पर बैक बटन, [`BackHandler`](#backhandler)। Rust कोड `nsh_core::mobile` और `nsh_core::prelude` का उपयोग करता है; TSX `nsh/mobile` इम्पोर्ट करता है। इस मॉड्यूल को हर प्लेटफ़ॉर्म पर इम्पोर्ट किया जा सकता है, इसलिए एक ही बंडल हर जगह चलता है: अन्य प्लेटफ़ॉर्म पर इसके कॉम्पोनेंट कोई जगह नहीं घेरते और इसके कॉल तुरंत लौट आते हैं। `isAvailable` बताता है कि आप iOS या Android पर हैं या नहीं (`nsh` का `platform.os` बताता है कि कौन-सा)। डेस्कटॉप पर क्या उपलब्ध है, यह [nsh/desktop](./nsh-desktop.md) में है।

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## दायरा

यह मॉड्यूल मोबाइल प्लेटफ़ॉर्म के लिए विशिष्ट क्षमताएँ उपलब्ध कराता है, जैसे ऐप के शीर्ष-स्तरीय नेविगेशन के लिए सिस्टम टैब बार। सामान्य कंट्रोल [`nsh/base`](./nsh-base.md) के हैं: उदाहरण के लिए इसका [Switch](../elements/switch.md) फ़ोन, डेस्कटॉप और वेब पर एक ही व्यवहार और API साझा करता है, जबकि ट्रैक, थंब और स्टेट की स्टाइल ऐप देता है। `TabBar` मोबाइल ऐप नेविगेशन के लिए है; `Tabs` सभी प्लेटफ़ॉर्म पर टैब वाली सामग्री के लिए है। यहाँ केवल वही क्षमताएँ आती हैं जिनके इंटरैक्शन अर्थ मोबाइल-विशिष्ट हैं। केवल सिस्टम का रूप, आकार या एनिमेशन किसी सामान्य कंट्रोल की साझा भूमिका नहीं बदलता। यही अंतर तय करता है कि कौन-सी क्षमताएँ यहाँ आती हैं ([लक्ष्य और डिज़ाइन सिद्धांत](../docs/goals.md))।

## isAvailable

```ts
const isAvailable: boolean;
```

iOS, iOS सिमुलेटर, Mac Catalyst और Android पर `true`; अन्य जगह `false`। Rust: `matches!(os(), Os::Ios | Os::Android)`।

## TabBar

टैब बार ऐप के शीर्ष-स्तरीय सेक्शनों के बीच स्विच करता है: रिकॉर्ड और आँकड़े, इनबॉक्स और सेटिंग्स। `TabBar` सिस्टम का अपना बार है, इसलिए यह वैसा ही दिखता और व्यवहार करता है जैसा सिस्टम के ऐप करते हैं: iOS और iPadOS पर `UITabBar` (iOS 26 पर Liquid Glass और उसका सिलेक्शन), Android पर Material 3 का नेविगेशन बार, सिस्टम के रंगों में, लाइट और डार्क दोनों में। ऐप टैब देता है (`items`), बताता है कि कौन-सा चुना गया है (`selectedIndex`), उपयोगकर्ता का चुनाव सुनता है (`onChange`), बार को उसके `class` और `style` से रखता है, और चुने गए सेक्शन की सामग्री खुद दिखाता है। पेज के भीतर टैब के लिए, और हर प्लेटफ़ॉर्म पर, `nsh/base` के [Tabs](../elements/tabs.md) का उपयोग करें।

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar` `nsh/mobile` से आता है, Rust में `nsh_core::mobile`। सिलेक्शन ऐप का होता है: टैप करने पर टैब के इंडेक्स (`{ index }`) के साथ `onChange` रिपोर्ट होता है, बार चुनाव को तुरंत दिखा देता है, जैसा सिस्टम का बार करता है, और ऐप वह सेक्शन दिखाता है तथा इंडेक्स को `selectedIndex` के रूप में वापस देता है। जहाँ स्टाइल ऊँचाई खुली छोड़ती है, वहाँ उसकी ऊँचाई सिस्टम की होती है। Rust में `tab_bar()` एक बार बनाता है, जिसमें हर प्रॉप के लिए एक सेटर (`.items(..)`, `.selected_index(..)`), हर इवेंट के लिए एक लिसनर (`.on_change(..)`) और टाइप्ड स्टाइल मेथड होते हैं; `TabBarItem::new(title).icon(name)` एक टैब बनाता है।

<a id="props"></a>

### प्रॉप्स

| प्रॉप | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | टैब, क्रम में। |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | चुना गया टैब, इंडेक्स से; टैब की संख्या से आगे का इंडेक्स किसी को नहीं चुनता। |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS: बार को ट्रांज़िशन के बिना छिपाता है। push और pop के दौरान यह मान ऐप के पास रहता है। बार तब दिखता है जब यह प्रॉप और दिखाई दे रहे स्टैक का `hidesBottomBarWhenPushed` अनुरोध दोनों false हों। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | बार कहाँ है: उसकी स्थिति और आकार। उसका रूप सिस्टम का है, और चुना गया टैब थीम के `primary` में होता है। |
| `testID` | `.test_id(..)` | `string` | कोई नहीं | टेस्ट और `nsh test --trace` में बार को खोजता है। |

#### TabBarItem

| फ़ील्ड | Rust | टाइप | विवरण |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | टैब का शीर्षक, जिसे स्क्रीन रीडर बोलते हैं। |
| `icon` | `.icon(name)` | `string` | टैब का आइकन, प्लेटफ़ॉर्म के अपने नाम से: iOS पर [SF Symbol](https://developer.apple.com/sf-symbols/) (`"house"`), Android पर ऐप का एक ड्रॉएबल (`res/drawable/home.xml` है `"home"`, `"android:ic_menu_search"` सिस्टम का)। `platform.select` हर प्लेटफ़ॉर्म के लिए एक चुनता है। |

<a id="events"></a>

### इवेंट्स

| इवेंट | Rust | विवरण |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | उपयोगकर्ता ने एक टैब चुना: `{ index }`, उसका इंडेक्स। बार चुनाव को तुरंत दिखा देता है; ऐप टैब की सामग्री दिखाता है और `selectedIndex` सेट करता है। |

<a id="platform-notes"></a>

### प्लेटफ़ॉर्म नोट्स

- **iOS और Mac Catalyst**: `UITabBar`, iOS संस्करण के अनुसार सिस्टम के रूप के साथ: iOS 26 पर तैरता हुआ Liquid Glass बार और उसका सिलेक्शन। आइकन SF Symbols हैं। थीम का `primary` बार का `tintColor` है, यानी चुने गए टैब का रंग; बाकी टैब सिस्टम का रंग रखते हैं।
- **Android**: Material 3 का नेविगेशन बार, जो प्लेटफ़ॉर्म के व्यूज़ से बना है: हर लेबल के ऊपर उसके एक्टिव इंडिकेटर में एक आइकन, दबाने पर रिपल, Android 12 और बाद के संस्करणों पर सिस्टम के डायनामिक रंग और उससे पहले Material के बेसलाइन रंग, ऐप के अपीयरेंस के अनुसार लाइट या डार्क। विंडो के निचले हिस्से में यह नेविगेशन बार के नीचे तक फैलता है, और अपने इनसेट जितना ऊँचा हो जाता है, जैसा Material का करता है। आइकन ऐप के ड्रॉएबल हैं (बार उन्हें टिंट करता है)। चुने गए टैब का आइकन और लेबल थीम का `primary` लेते हैं, उसके 12% ओपैसिटी वाले एक्टिव इंडिकेटर के ऊपर; बाकी टैब सिस्टम का रंग रखते हैं।
- **डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब**: सेक्शन [Tabs](../elements/tabs.md) से, ऐप के अपने रूप में दिखते हैं। `TabBar` वहाँ कोई जगह नहीं घेरता, इसलिए एक ही लेआउट दोनों को सँभालता है, जिसे `platform.os` ([`nsh` का डिवाइस API](./nsh.md#device)) चुनता है।

## InputAccessoryView

iOS और Mac Catalyst पर; Android पर यह एक खाली छिपा हुआ व्यू है।

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

कीबोर्ड के ऊपर का एक बार (UIKit का `inputAccessoryView`), जो तब दिखता है जब ऐसा इनपुट फ़ोकस में हो जिसका `ios={{ inputAccessoryViewID }}` इसके `nativeID` से मेल खाता हो। Rust: `input_accessory_view(native_id)`, उन इनपुट के लिए दिखता है जिनका `.input_accessory(native_id)` मेल खाता है। यह विंडो जितना चौड़ा और अपनी सामग्री जितना ऊँचा होता है, और कीबोर्ड के साथ नेटिव रूप से चलता है।

| प्रॉप | टाइप | Rust | विवरण |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | इस `inputAccessoryViewID` वाले इनपुट बार दिखाते हैं। |
| `style` | `StyleProp<ViewStyle>` | `Styled` मेथड (`.bg(…)`) | बार की स्टाइल (उदाहरण के लिए उसका बैकग्राउंड)। |
| `class` | `string` | | Tailwind क्लासेस। |
| `children` | `JSX.Element` | `.child(…)` | बार की सामग्री। |

ट्री में जहाँ इसे रखा जाता है वहाँ यह कुछ रेंडर नहीं करता, और Android पर बिल्कुल कुछ नहीं करता, इसलिए आप इसे उस इनपुट के बगल में रख सकते हैं जिससे यह संबंधित है।

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

[फ़ॉर्म और कीबोर्ड](../docs/forms-and-keyboard.md) भी देखें।

## BackHandler

Android पर; iOS पर इसके लिसनर रखे जाते हैं पर कभी कॉल नहीं होते, और `exitApp()` तुरंत लौट आता है।

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

सिस्टम का बैक बटन और बैक जेस्चर। बैक प्रेस को सबसे पहले डायलॉग सँभालते हैं (डायलॉग बंद हो जाता है); फिर `BackHandler` के लिसनर चलते हैं, सबसे हाल में जोड़ा गया पहले; जब उनमें से कोई उसे नहीं सँभालता, तो सबसे ऊपर का नेविगेशन स्टैक pop होता है, और अगर वापस जाने के लिए कोई पेज न हो तो ऐप बंद हो जाता है।

| सदस्य | Rust | विवरण |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | `listener` प्रेस को सँभाल लेने पर `true` लौटाता है। एक फ़ंक्शन लौटाता है जो सुनना बंद कर देता है; किसी कॉम्पोनेंट के रेंडर होते समय (या इफ़ेक्ट चलते समय) जोड़ा गया लिसनर उसके साथ बंद हो जाता है, Rust और TSX दोनों में। |
| `exitApp()` | लिसनर `false` लौटाता है | ऐप छोड़ देता है। जो Rust लिसनर `false` लौटाता है वह प्रेस को आगे जाने देता है, इसलिए स्टैक पीछे जाता है या ऐप बंद हो जाता है। |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> लिसनर तब चलता है जब सिस्टम प्रेस पहुँचा चुका होता है: मुख्य थ्रेड कभी ऐप के कोड का इंतज़ार नहीं करता। जब तक कम से कम एक लिसनर रजिस्टर्ड है, NSH वे बैक प्रेस खुद ले लेता है जिन्हें डायलॉग छोड़ देते हैं, और जब कोई लिसनर `true` नहीं लौटाता तो सबसे ऊपरी स्टैक में पीछे जाता है या ऐप से बाहर निकल जाता है।

स्टेटस बार को [पेज और डायलॉग](./nsh-base.md#status-bar) का `statusBar` सेट करता है, `nsh/base` से, iOS और Android दोनों पर समान रूप से।
