---
title: "nsh/desktop"
description: "केवल डेस्कटॉप के लिए APIs: विंडो (शीर्षक, टाइटल बार, मैक्सिमाइज़, फ़ुल स्क्रीन), ऐप का अपना टाइटल बार जिसमें खींचने योग्य (draggable) क्षेत्र हों, एप्लिकेशन मेनू, कॉन्टेक्स्ट मेनू और कीबोर्ड शॉर्टकट।"
order: 12.5
source_hash: 460c34aa14353d38
---

# nsh/desktop

`nsh/desktop` में वह सब है जो केवल डेस्कटॉप पर होता है: विंडो और उसका टाइटल बार, एप्लिकेशन मेनू और कॉन्टेक्स्ट मेनू। यह macOS, Windows और Linux पर काम करता है। Rust कोड यही `nsh_core::element::desktop` में पाता है: विंडो के फ़ंक्शन (`set_title`, `set_title_bar`, `title_bar`, `minimize`, … `close_window`), एप्लिकेशन मेनू और कॉन्टेक्स्ट मेनू (`set_application_menu`, `popup_menu`, जो `MenuItem` से बने होते हैं), और ड्रैग किए जा सकने वाले व्यू को `.window_drag(true)` से चिह्नित करना; TSX `nsh/desktop` इम्पोर्ट करता है। इस मॉड्यूल को हर प्लैटफ़ॉर्म पर इम्पोर्ट किया जा सकता है, इसलिए एक ही बंडल हर जगह चलता है: iOS और Android पर इसके फ़ंक्शन कुछ नहीं करते, और `isAvailable` बताता है कि इसकी विंडो और मेनू मौजूद हैं या नहीं।

```rust tabs
use nsh_core::{
    desktop::{MenuRole, TitleBarStyle},
    element::desktop::{
        MenuItem, close_window, popup_menu, set_application_menu, set_title, set_title_bar, title_bar,
    },
    prelude::*,
};
```

```tsx tabs
import { isAvailable, Menu, titleBar, Window } from "nsh/desktop";
```

## isAvailable

```ts
const isAvailable: boolean;
```

`true` वहाँ जहाँ इस मॉड्यूल के विंडो और मेनू API काम करते हैं: macOS, Windows और Linux; अन्यत्र `false`। Rust: `os().is_desktop()`।

[`platform.desktop`](./nsh.md#platform) डेस्कटॉप व्यवहार के लिए व्यापक जाँच है (`desktop={{…}}` props, `platform.select({ desktop })`): यह डेस्कटॉप शैली वाले ब्राउज़रों में भी सही होती है, जो ब्राउज़र की अपनी विंडो में चलते हैं। डेस्कटॉप लेआउट, डेंसिटी और इनपुट को `platform.desktop` पर, तथा `Window` और `Menu` के कॉल को `isAvailable` पर निर्भर रखें।

<a id="window"></a>

## विंडो

```ts
const Window: {
  setTitle(title: string): void;
  setTitleBar(options: { style: "default" | "hidden"; height?: number }): void;
  setMenuBar(mode: "shown" | "autoHide"): void;
  minimize(): void;
  toggleMaximize(): void;
  toggleFullScreen(): void;
  setFrame(frame: {
    origin?: Partial<Point>;
    size?: Partial<Size>;
    animated?: boolean;
  }): void;
  setLevel(level: "normal" | "floating" | "desktopIcon"): void;
  orderFront(): void;
  close(): void;
};
```

Rust कॉलम `nsh_core::element::desktop` के फ़ंक्शन के नाम बताता है।

| सदस्य | Rust | विवरण |
|---|---|---|
| `setTitle(title)` | `set_title(title)` | विंडो का शीर्षक: टाइटल बार, टास्कबार या Dock, विंडो स्विचर। |
| `setTitleBar({ style, height? })` | `set_title_bar(TitleBarStyle::Hidden, Some(px(height)))` | `style: "hidden"` सिस्टम का टाइटल बार हटा देता है: ऐप विंडो के ऊपरी किनारे तक भर जाता है और अपना टाइटल बार खुद बनाता है। सिस्टम के विंडो कंट्रोल बने रहते हैं (macOS के traffic lights, Windows के minimize / maximize / close बटन, GTK के विंडो बटन)। `height` पॉइंट में आपके बार की ऊँचाई है: कंट्रोल उसमें केंद्रित होते हैं (Windows के कैप्शन बटन उसे भर देते हैं; macOS पर `height` 44 पॉइंट तक कॉम्पैक्ट क्रोम और उससे ऊपर रेगुलर क्रोम चुनता है; अपना बार `titleBar().height` की वास्तविक ऊँचाई के अनुसार बनाएँ, और AppKit लाइव रीसाइज़िंग के दौरान traffic lights को रखता है। एम्बेड करने वाले ऐप का मौजूदा टूलबार अपनी शैली और ऊँचाई रखता है); इसके बिना वे प्लैटफ़ॉर्म की ऊँचाई लेते हैं। `style: "default"` सिस्टम का टाइटल बार वापस ले आता है (Rust: `set_title_bar(TitleBarStyle::Default, None)`)। |
| `setMenuBar(mode)` | `set_menu_bar_visibility(mode)` | Windows और Linux पर GPUI ऐप्स में, जहाँ विंडो एप्लिकेशन मेनू को ऐप के ऊपर एक बार के रूप में बनाती है: `"shown"` (डिफ़ॉल्ट) उसे हमेशा दिखाता है; `"autoHide"` उसे तब दिखाता है जब Alt को अकेले दबाकर छोड़ा जाए, और Alt अकेला उसे फिर छिपा देता है, जैसा Windows और GNOME ऐप्स में होता है। F10 और किसी मेनू के प्रारंभिक अक्षर के साथ Alt, दोनों स्थितियों में मेनू खोलते हैं, और मेनू खुला रहने तक बार दिखता है। macOS का मेनू बार सिस्टम का है। |
| `minimize()` | `minimize()` | विंडो को minimize करता है। |
| `toggleMaximize()` | `toggle_maximize()` | विंडो को maximize करता है, या maximize होने पर उसे बहाल करता है। |
| `toggleFullScreen()` | `toggle_full_screen()` | फ़ुल स्क्रीन में जाता है या उससे बाहर आता है। |
| `setFrame(frame)` | `set_frame(WindowFrame { .. })` | विंडो को पॉइंट में खिसकाता और उसका आकार बदलता है; छोड़े गए फ़ील्ड अपने मान रखते हैं। macOS और Windows पर `size` (`width`, `height`) में विंडो डेकोरेशन शामिल हैं; Linux पर यह GTK का डिफ़ॉल्ट विंडो आकार तय करता है। `origin` (`x`, `y`) विंडो का ऊपरी बायाँ कोना है, जो प्राथमिक स्क्रीन (macOS पर मेनू बार वाली) के ऊपरी बाएँ से मापा जाता है और `y` नीचे की ओर बढ़ता है, हर प्लैटफ़ॉर्म पर एक जैसा; जिस `height` के साथ `y` न हो, वह ऊपरी किनारा वहीं रखता है, इसलिए विंडो अपने निचले किनारे पर बढ़ती और घटती है। `animated: true` macOS का रीसाइज़ एनिमेशन चालू करता है (डिफ़ॉल्ट: false)। |
| `setLevel(level)` | `set_level(level)` | macOS और Windows पर `"floating"` विंडो को सामान्य विंडो के ऊपर रखता है और `"normal"` सामान्य स्तर बहाल करता है। `"desktopIcon"` macOS का डेस्कटॉप आइकन स्तर चुनता है (विंडो हर space पर भी रहती है, Mission Control और Cmd+` से बाहर); Windows पर यह विंडो को मौजूदा z-order के सबसे नीचे ले जाता है, जहाँ बाद का एक्टिवेशन उसे ऊपर उठा सकता है। |
| `orderFront()` | `order_front()` | विंडो को उसके स्तर में सबसे आगे लाता है और फ़ोकस देता है (ऐप सक्रिय होता है; macOS में deminiaturize होता है, Windows छोटी की गई विंडो बहाल करता है और foreground सेट करता है, GTK present करता है)। विंडो अपना स्तर बनाए रखती है। macOS पर डेस्कटॉप-स्तर की सतहें अन्य विंडो के पीछे रहती हैं। GPUI अपनी विंडो सक्रिय करता है; Linux पर foreground अनुरोधों को विंडो मैनेजर नियंत्रित करता है। |
| `close()` | `close_window()` | विंडो बंद करता है; ऐप उसके साथ समाप्त हो जाता है। |

विंडो का आकार बदलना macOS, Windows और Linux पर समर्थित है; स्थिति तय करना और स्तर macOS और Windows पर। Linux पर प्लेसमेंट और स्टैकिंग को विंडो मैनेजर नियंत्रित करता है। GPUI ऐप्स में `setFrame` विंडो का आकार तय करता है और प्लैटफ़ॉर्म उसे रखता है; विंडो खोलते समय GPUI का होस्ट उसकी स्थिति और स्तर चुनता है।

`onLayout` से मापी गई सामग्री के आधार पर विंडो का आकार तय करते समय macOS और Windows पर विंडो डेकोरेशन के लिए जगह छोड़ें। `width` और `height` धनात्मक परिमित संख्याएँ स्वीकार करते हैं; `x` और `y` परिमित संख्याएँ स्वीकार करते हैं। अमान्य फ़ील्ड अपने पिछले मान रखते हैं।

<a id="a-title-bar-of-your-own"></a>

## अपना खुद का टाइटल बार

टाइटल बार छिपा होने पर ऐप अपना बार खुद बनाता है और बताता है कि उसके कौन से हिस्से विंडो को हिलाते हैं, Rust में `.window_drag(true)` और TSX में `desktop={{ windowDrag: true }}` से:

```rust tabs
use nsh_core::{
    desktop::TitleBarStyle,
    element::{desktop::{set_title_bar, title_bar}}, prelude::*,
};

#[component]
fn TitleBar() -> impl IntoElement {
    set_title_bar(TitleBarStyle::Hidden, Some(px(40.0))); // a bar 40 points tall
    view()
        .window_drag(true)
        .h(move || match title_bar().top {
            top if top > px(0.0) => top,
            _ => px(40.0),
        })
        .pl(move || title_bar().left + px(8.0)) // macOS's traffic lights
        .pr(move || title_bar().right + px(8.0)) // the caption buttons on Windows, GTK's buttons
        .flex_row()
        .items_center()
        .child(text("My App"))
        .child(view().flex_1())
        .child(input().placeholder("Search").w(px(180.0)))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Input } from "nsh/base";
import { titleBar, Window } from "nsh/desktop";

Window.setTitleBar({ style: "hidden", height: 40 }); // a bar 40 points tall

function TitleBar() {
  return (
    <View
      desktop={{ windowDrag: true }}
      style={{
        height: titleBar().height || 40,
        paddingLeft: titleBar().left + 8, // macOS's traffic lights
        paddingRight: titleBar().right + 8, // the caption buttons on Windows, GTK's buttons
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text>My App</Text>
      <View style={{ flex: 1 }} />
      <Input placeholder="Search" style={{ width: 180 }} />
    </View>
  );
}
```

`windowDrag` वाले व्यू को दबाने पर विंडो वैसे ही ड्रैग होती है जैसे सिस्टम के टाइटल बार से होती: डबल क्लिक उसे maximize करता है (या वही करता है जो उपयोगकर्ता ने सेट किया है: macOS पर "Double-click a window's title bar to"), और Windows व Linux पर राइट क्लिक विंडो मेनू खोलता है।

- `windowDrag` सेट करने वाला सबसे नज़दीकी व्यू तय करता है: `.window_drag(false)` (`desktop={{ windowDrag: false }}`) ड्रैग किए जा सकने वाले व्यू के एक हिस्से को क्लिक योग्य रखता है।
- टेक्स्ट फ़ील्ड और प्रेस या टच हैंडलर वाले व्यू (`onPress`, `onTouch*`, responders) ड्रैग किए जा सकने वाले व्यू के अंदर उसके बिना भी क्लिक योग्य रहते हैं: ऊपर के उदाहरण में सर्च फ़ील्ड और कोई भी बटन सामान्य रूप से काम करते हैं।
- `windowDrag` सिस्टम के टाइटल बार के साथ भी काम करता है: साइडबार या टूलबार भी विंडो को हिला सकता है।

### titleBar

```ts
const titleBar: Accessor<{ height: number; left: number; right: number }>;
```

छिपे हुए टाइटल बार का क्षेत्र, पॉइंट में (reactive): उसकी `height`, और उसके `left` और `right` सिरों पर सिस्टम के विंडो कंट्रोल जितनी चौड़ाई लेते हैं। अपना बार इसी के अनुसार लेआउट करें ताकि कुछ भी कंट्रोल के नीचे न जाए। जब तक सिस्टम अपना टाइटल बार दिखाता है (और फ़ुल स्क्रीन में, और डेस्कटॉप के बाहर), तीनों मान 0 रहते हैं। Rust: `title_bar() -> Edges<Points>`, जिसका `top` ऊँचाई है और `left` व `right` कंट्रोल की चौड़ाइयाँ; इसे पढ़ने से बदलावों की सदस्यता (subscription) हो जाती है।

| | `height` | `left` | `right` |
|---|---|---|---|
| macOS | `height`, अन्यथा टाइटल बार की (macOS संस्करण के अनुसार 28 या 32) | traffic lights की चौड़ाई | 0 |
| Windows | `height`, अन्यथा 32 | 0 | तीन कैप्शन बटन (138) |
| Linux | `height`, अन्यथा हेडर बार की | शुरुआत के विंडो बटन (डेस्कटॉप का बटन लेआउट) | अंत के विंडो बटन |

Windows पर कैप्शन बटन NSH द्वारा Windows 11 की शैली में बनाए जाते हैं और ऐप की appearance का पालन करते हैं; maximize बटन पर होवर करने से Windows 11 के snap layouts दिखते हैं। विंडो हर प्लैटफ़ॉर्म पर अपने रीसाइज़ बॉर्डर, शैडो और गोल कोने बनाए रखती है।

<a id="menu"></a>

## मेनू

```ts
const Menu: {
  setApplicationMenu(items: MenuItem[] | null): void;
  popup(items: MenuItem[], at?: Point): Promise<void>;
};
```

| सदस्य | विवरण |
|---|---|
| `setApplicationMenu(items)` | एप्लिकेशन मेनू सेट करता है: हर टॉप-लेवल आइटम के लिए एक सबमेनू (`File`, `Edit`, ...)। macOS पर यही मेनू बार है, जिसका पहला मेनू ऐप मेनू होता है (AppKit उसे ऐप के नाम से शीर्षक देता है)। Windows और Linux पर यह विंडो का मेनू बार है, जो टाइटल बार छिपा होने पर दिखाई नहीं देता; इसके शॉर्टकट फिर भी काम करते हैं, और ऐप का अपना टाइटल बार इसके मेनू `Menu.popup` से खोल सकता है। `null` प्लैटफ़ॉर्म का डिफ़ॉल्ट मेनू बहाल करता है। |
| `popup(items, at?)` | कॉन्टेक्स्ट मेनू दिखाता है, जिसका ऊपरी बायाँ कोना `at` पर होता है (विंडो के निर्देशांक, पॉइंट में: किसी `onContextMenu` का `e.pagePosition`), या पॉइंटर पर। मेनू बंद होते ही promise resolve हो जाता है, चाहे कोई आइटम चुना गया हो या नहीं: जिस बटन ने उसे खोला था वह तब तक दबा रह सकता है। |

Rust में `set_application_menu(items)` एक `Vec<MenuItem>` लेता है (`None` प्लैटफ़ॉर्म का डिफ़ॉल्ट मेनू बहाल करता है), और `popup_menu(items)` (पॉइंटर पर) तथा `popup_menu_at(items, at)` एक `Answer<()>` लौटाते हैं जो मेनू बंद होने पर आता है (उसे await करना वैकल्पिक है)। किसी आइटम का हैंडलर उस owner के अधीन चलता है जिसने मेनू सेट किया, जब तक वह owner जीवित है।

मेनू बदलने के लिए `setApplicationMenu` को फिर से कॉल करें। `effect` के अंदर यह उन signals का अनुसरण करता है जिन्हें यह पढ़ता है: ऐप की स्थिति पर निर्भर चेक मार्क या disabled स्थिति अद्यतन रहती है।

<a id="menu-items"></a>

### मेनू आइटम

```ts
type MenuItem =
  | { type: "separator" }
  | {
      label?: string;
      role?: MenuRole;
      shortcut?: string;
      when?: "always" | "auto" | "notEditing";
      disabled?: boolean;
      checked?: boolean;
      onSelect?: () => void;
      submenu?: MenuItem[];
    };
```

| फ़ील्ड | विवरण |
|---|---|
| `label` | आइटम क्या दिखाता है। रोल वाले आइटम का इसके बिना अपना लेबल होता है। |
| `onSelect` | आइटम चुने जाने पर कॉल होता है, क्लिक या उसके शॉर्टकट से। |
| `shortcut` | इसका कीबोर्ड शॉर्टकट: मॉडिफ़ायर और एक कुंजी, `+` से जुड़े हुए, जैसे `"mod+n"`, `"mod+shift+z"`, `"alt+f4"` या `"f11"`। मॉडिफ़ायर नीचे की तालिका में हैं। कुंजियाँ अक्षर, अंक और विराम चिह्न हैं, जिन्हें उस वर्ण के रूप में लिखा जाता है जो कुंजी US कीबोर्ड पर Shift के बिना टाइप करती है (`,`, `/`; `?` के लिए `"shift+/"`), या कोई नाम: `plus` (`=` / `+` कुंजी, `=` भी), `minus` (`-` भी), `space`, `enter` (`return`), `escape` (`esc`), `tab`, `backspace`, `delete` (`del`), `insert`, एरो कुंजियाँ `up`, `down`, `left`, `right` (`arrowup`, …), `home`, `end`, `pageup`, `pagedown`, `f1`–`f24`। केस मायने नहीं रखता (`"Mod+Shift+N"` वही है जो `"mod+shift+n"`; बड़ा अक्षर वही कुंजी है, Shift नहीं), और लोअरकेस अनुशंसित शैली है। अमान्य शॉर्टकट (`"mod-n"`, `"mod++"`, `"mod+?"`) एक error फेंकता है जो सही वर्तनी बताता है। `keymap` वही कीस्ट्रोक स्वीकार करता है। मेनू इसे प्लैटफ़ॉर्म की अपनी शैली में दिखाते हैं (macOS पर `⇧⌘N`, Windows पर `Ctrl+Shift+N`)। |
| `when` | GPUI बैकएंड पर, जब किसी टेक्स्ट फ़ील्ड के पास कीबोर्ड फ़ोकस हो, तब शॉर्टकट आइटम को कब चुनता है: `"always"` (डिफ़ॉल्ट), `"auto"` (जब तक फ़ील्ड कुंजी का खुद उपयोग न करे: टाइप करने वाली, कैरेट हिलाने वाली या मिटाने वाली कुंजियाँ, और संपादन शॉर्टकट, जैसा [`keymap`](./nsh.md#keymap) की बाइंडिंग्स के साथ होता है) या `"notEditing"`। जो कुंजी आइटम छोड़ देता है वह फ़ील्ड को जाती है। |
| `disabled` | `true` आइटम को ग्रे कर देता है (डिफ़ॉल्ट `false`)। |
| `checked` | चेक मार्क वाले आइटम के लिए सेट करें (`true` या `false` पर)। |
| `submenu` | आइटम को सबमेनू बनाता है (इसके लिए `label` चाहिए)। |
| `role` | एक मानक आइटम जिसे प्लैटफ़ॉर्म स्वयं करता है (नीचे)। |

`null`, `undefined` और `false` आइटम छोड़ दिए जाते हैं, इसलिए `cond && { … }` सूची में काम करता है।

Rust में आइटम `MenuItem::new(label)`, `MenuItem::role(role)`, `MenuItem::separator()` या `MenuItem::submenu(label, items)` होता है, और फ़ील्ड मेथड के रूप में होते हैं: `.shortcut("mod+n")` (अमान्य शॉर्टकट पर यह सही वर्तनी के साथ panic करता है), `.shortcut_when(When::Auto)`, `.disabled(true)`, `.checked(on)`, `.on_select(f)`, और रोल वाले आइटम के लिए `.label(..)`।

मॉडिफ़ायर:

| मॉडिफ़ायर | macOS | Windows | Linux |
|---|---|---|---|
| `mod` (`cmdorctrl` भी) | Command (⌘) | Ctrl | Ctrl |
| `cmd` (`command`, `meta`, `super`, `win` भी) | Command (⌘) | Windows कुंजी | Super |
| `ctrl` (`control` भी) | Control (⌃) | Ctrl | Ctrl |
| `alt` (`option`, `opt` भी) | Option (⌥) | Alt | Alt |
| `shift` | Shift (⇧) | Shift | Shift |

ऐप के अपने शॉर्टकट के लिए `mod` का उपयोग करें: यही वह कुंजी है जो हर प्लैटफ़ॉर्म के ऐप उनके लिए इस्तेमाल करते हैं (macOS पर ⌘N, Windows और Linux पर Ctrl+N), इसलिए एक ही वर्तनी हर जगह चलती है। Windows कुंजी और Super ज़्यादातर सिस्टम के हैं (Win+E, GNOME overview), इसलिए macOS के बाहर `cmd` शायद ही कभी सही होता है।

रोल:

| रोल | क्या करता है | प्लैटफ़ॉर्म |
|---|---|---|
| `about`, `hide`, `hideOthers`, `showAll` | ऐप मेनू के मानक आइटम | macOS (अन्यत्र छोड़े जाते हैं) |
| `quit` | ऐप को बंद करता है | सभी |
| `undo`, `redo`, `cut`, `copy`, `paste`, `selectAll` | फ़ोकस वाले टेक्स्ट फ़ील्ड को संपादित करते हैं (उसके अपने शॉर्टकट उसी के रहते हैं) | सभी |
| `minimize`, `zoom`, `toggleFullScreen`, `close` | विंडो | सभी |

रोल वाले आइटम का लेबल और शॉर्टकट प्लैटफ़ॉर्म का होता है, जब तक वह अपना खुद का सेट न करे (macOS `about`, `hide` और `quit` में ऐप का नाम जोड़ता है)।

मेनू शॉर्टकट पहले आते हैं, जैसा नेटिव ऐप्स में होता है: जो कुंजी कोई आइटम लेता है वह फ़ोकस वाले टेक्स्ट फ़ील्ड या NSH की अपनी कुंजियों तक कभी नहीं पहुँचती। केवल उसी कीस्ट्रोक की [`keymap`](./nsh.md#keymap) की बाइंडिंग उनसे पहले आती है। इसलिए संपादन शॉर्टकट (`mod+c`, `mod+v`, `mod+x`, `mod+a`, `mod+z`) केवल edit रोल को दें, जो उन्हें टेक्स्ट फ़ील्ड तक पहुँचाते हैं, और बिना मॉडिफ़ायर वाली कुंजियों (`escape`, एरो कुंजियाँ, अक्षर) से बचें, जो उन्हें टेक्स्ट फ़ील्ड और बैक नेविगेशन से छीन लेंगी। GPUI बैकएंड पर `when: "auto"` किसी आइटम को टेक्स्ट फ़ील्ड के साथ कुंजी साझा करने देता है: `delete` या `mod+z` जब किसी फ़ील्ड के पास फ़ोकस न हो तब आइटम चुनते हैं और जब हो तब टेक्स्ट संपादित करते हैं।

GPUI बैकएंड पर, कीबोर्ड फ़ोकस वाला नेटिव कंपोनेंट हर कुंजी को सबसे पहले देखता है। जिस कुंजी को वह खुद संभाल ले, वह keymap या मेनू तक कभी नहीं पहुँचती। जिस कुंजी को वह जाने दे, वह keymap तक ऐसे पहुँचती है मानो कोई टेक्स्ट फ़ील्ड फ़ोकस में हो, फिर मेनू तक।

```rust tabs
use nsh_core::{
    desktop::MenuRole,
    element::desktop::{MenuItem, set_application_menu},
    platform::Os,
    prelude::*,
};

#[component]
fn AppMenu() -> impl IntoElement {
    let mac = os() == Os::MacOs;
    let wrap = signal(true);
    effect(move || {
        let mut menus = Vec::new();
        if mac {
            menus.push(MenuItem::submenu("My App", [
                MenuItem::role(MenuRole::About),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Hide),
                MenuItem::role(MenuRole::HideOthers),
                MenuItem::separator(),
                MenuItem::role(MenuRole::Quit),
            ]));
        }
        let mut file = vec![
            MenuItem::new("New").shortcut("mod+n").on_select(create_document),
            MenuItem::new("Open…").shortcut("mod+o").on_select(open_document),
        ];
        if !mac {
            file.push(MenuItem::separator());
            file.push(MenuItem::role(MenuRole::Quit).label("Exit"));
        }
        menus.push(MenuItem::submenu("File", file));
        menus.push(MenuItem::submenu("Edit", [
            MenuItem::role(MenuRole::Undo),
            MenuItem::role(MenuRole::Redo),
            MenuItem::separator(),
            MenuItem::role(MenuRole::Cut),
            MenuItem::role(MenuRole::Copy),
            MenuItem::role(MenuRole::Paste),
        ]));
        menus.push(MenuItem::submenu("View", [
            MenuItem::new("Word Wrap")
                .checked(wrap.get())
                .on_select(move || wrap.update(|w| *w = !*w)),
            MenuItem::role(MenuRole::ToggleFullScreen),
        ]));
        set_application_menu(menus);
    });
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { platform } from "nsh";
import { Menu } from "nsh/desktop";

const mac = platform.os === "macos";
const wrap = signal(true);

effect(() => {
  Menu.setApplicationMenu([
    mac && {
      label: "My App",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "File",
      submenu: [
        { label: "New", shortcut: "mod+n", onSelect: () => createDocument() },
        { label: "Open…", shortcut: "mod+o", onSelect: () => openDocument() },
        !mac && { type: "separator" },
        !mac && { role: "quit", label: "Exit" },
      ],
    },
    {
      label: "Edit",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "View",
      submenu: [
        { label: "Word Wrap", checked: wrap(), onSelect: () => wrap.update((w) => !w) },
        { role: "toggleFullScreen" },
      ],
    },
  ]);
});
```

बटन के प्रेस से कॉन्टेक्स्ट मेनू:

```rust tabs
text("More").on_press(|| {
    let _ = popup_menu(vec![
        MenuItem::new("Rename").on_select(rename),
        MenuItem::new("Duplicate").on_select(duplicate),
        MenuItem::separator(),
        MenuItem::new("Delete").on_select(remove),
    ]);
})
```

```tsx tabs
<View
  onPress={() =>
    Menu.popup([
      { label: "Rename", onSelect: rename },
      { label: "Duplicate", onSelect: duplicate },
      { type: "separator" },
      { label: "Delete", onSelect: remove },
    ])
  }
>
  <Text>More</Text>
</View>
```

> [!NOTE]
> मेनू सिस्टम के हैं (NSMenu, Win32 menus, GTK popover menus): वे हर दूसरे ऐप के मेनू जैसे दिखते और व्यवहार करते हैं, सिस्टम (या ऐप) की appearance का पालन करते हैं और कीबोर्ड से उपयोग योग्य हैं। `examples/desktop` ऐसा ऐप है जिसका अपना टाइटल बार, एप्लिकेशन मेनू और कॉन्टेक्स्ट मेनू है।
