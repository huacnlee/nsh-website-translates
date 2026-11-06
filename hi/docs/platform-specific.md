---
title: "प्लैटफ़ॉर्म-विशिष्ट कोड"
description: "फ़ोन, डेस्कटॉप और ब्राउज़र के लिए एक ही ऐप लिखना - ios={{}} / android={{}} / desktop={{}} / web={{}} में प्लैटफ़ॉर्म-विशिष्ट props, nsh/mobile और nsh/desktop मॉड्यूल, platform.os और platform.select, तथा प्लैटफ़ॉर्म Tailwind वेरिएंट।"
order: 17
group: platforms
source_hash: 3943d421295a93f3
---

# प्लेटफ़ॉर्म-विशिष्ट कोड

एक ही NSH बंडल iOS, Android, macOS, Windows और Linux (और Mac Catalyst) पर चलता है, और ब्राउज़र में [वेब रनटाइम](./web.md) के ज़रिए। ऐप के अधिकांश हिस्से को किसी प्लेटफ़ॉर्म जाँच की ज़रूरत नहीं होती: एलिमेंट, स्टाइल, लेआउट और मॉड्यूल हर जगह एक जैसा व्यवहार करते हैं, और इनसे बनाए गए कॉम्पोनेंट भी हर जगह एक जैसे दिखते हैं। जब कोई चीज़ सचमुच किसी एक प्लेटफ़ॉर्म की हो, तो NSH उसे एक स्पष्ट जगह देता है, ताकि प्लेटफ़ॉर्म कोड दिखाई दे और सीमित रहे:

| Rust | TSX | किसलिए |
|---|---|---|
| [Builder मेथड (`.ripple(..)`, `.input_accessory(..)`)](#platform-only-props) | [`ios={{…}}`, `android={{…}}`, `desktop={{…}}`, `web={{…}}`](#platform-only-props) | वे props जो सिर्फ़ एक प्लेटफ़ॉर्म पर होते हैं। |
| [`on_back_press`, `nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`, `nsh/desktop`](#platform-modules) | वे API जो सिर्फ़ मोबाइल प्लेटफ़ॉर्म या सिर्फ़ डेस्कटॉप पर होते हैं। |
| [`os()`, `idiom()`, `is_desktop()`](#platformos-and-platformselect) | [`platform.os`, `platform.desktop`, `platform.select`](#platformos-and-platformselect) | प्लेटफ़ॉर्म के अनुसार मान या कोड चुनना। |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [`ios:` / `android:` / `web:` क्लासेस](#platform-variants-in-tailwind) | प्लेटफ़ॉर्म के अनुसार स्टाइल। |

<a id="desktop-and-mobile"></a>

## डेस्कटॉप और मोबाइल

हर प्लेटफ़ॉर्म एक ही नियम से डेस्कटॉप या मोबाइल होता है। डेस्कटॉप में macOS, Windows, Linux और डेस्कटॉप idiom वाले ब्राउज़र आते हैं (माउस और चौड़ी विंडो, [वेब](./web.md))। मोबाइल में iOS, Android और फ़ोन या टैबलेट idiom वाले ब्राउज़र आते हैं; Mac Catalyst iOS बैकएंड चलाता है, इसलिए वह भी मोबाइल है, और उसमें `ios={{…}}` props लागू होते हैं। `desktop={{…}}` props, `platform.select({ desktop, mobile })`, `platform.desktop` और `platform.idiom === "desktop"` सब इसी नियम का पालन करते हैं, और `nsh/base` के कॉम्पोनेंट भी (मेन्यू डेस्कटॉप पर पॉपअप और मोबाइल पर शीट होता है), और Rust में `is_desktop()` भी।

`nsh/desktop` का `isAvailable` एक संकरे प्रश्न का उत्तर देता है: क्या उस मॉड्यूल के विंडो और मेन्यू API काम करते हैं, जो macOS, Windows और Linux पर करते हैं। लेआउट, घनत्व और इनपुट को `platform.desktop` पर गेट करें, और `Window` व `Menu` की कॉल को `isAvailable` पर।

<a id="platform-only-props"></a>

## प्लेटफ़ॉर्म-विशिष्ट props

Rust में, जो prop किसी एक प्लेटफ़ॉर्म का होता है वह दूसरे builder मेथड की तरह ही एक builder मेथड है (`.ripple(..)`, Android के लिए `.elevation(..)`, iOS के लिए `.input_accessory(..)`, डेस्कटॉप के लिए `.window_drag(..)`); बाकी प्लेटफ़ॉर्म उसे छोड़ देते हैं। TSX में, जो props सिर्फ़ एक प्लेटफ़ॉर्म पर होते हैं उन्हें उसी के नाम वाले ऑब्जेक्ट में समूहित किया जाता है। हर एलिमेंट `ios`, `android`, `desktop` (macOS, Windows, Linux, और डेस्कटॉप idiom वाले ब्राउज़र) और `web` (ब्राउज़र) स्वीकार करता है; अन्य प्लेटफ़ॉर्म पर ऑब्जेक्ट अनदेखा कर दिया जाता है, और अपने प्लेटफ़ॉर्म पर सिर्फ़ उसकी keys लागू होती हैं। डेस्कटॉप ब्राउज़र `desktop` और `web` दोनों लागू करता है।

```rust tabs
use nsh_base::dialog;
use nsh_core::{
    Ripple,
    element::{AutoFill, Orientation}, prelude::*,
};

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0000001f).into()),
        ..Ripple::default()
    })
    .elevation(px(4.0))
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .child(text("Open"))

input().placeholder("Code").auto_fill(AutoFill::OneTimeCode)

when(shown, || {
    dialog()
        .supported_orientations([Orientation::Portrait])
        .status_bar_translucent(true)
        .child(…)
})
```

```tsx tabs
<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(0,0,0,0.12)" }, elevation: 4 }}
  style={{ padding: 16, borderRadius: 12, backgroundColor: "#ffffff" }}
>
  <Text>Open</Text>
</View>

<Input
  placeholder="Code"
  ios={{ textContentType: "oneTimeCode" }}
/>

<Dialog open={open()} ios={{ supportedOrientations: ["portrait"] }} android={{ statusBarTranslucent: true }}>
  …
</Dialog>
```

TSX ऑब्जेक्ट किसी भी prop की तरह रिएक्टिव होते हैं; ऑब्जेक्ट से हटाई गई key साफ़ हो जाती है।

आज क्या उपलब्ध है:

| Rust | TSX | कहाँ | विवरण |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | हर एलिमेंट | दबाए जाने के दौरान material ripple: color, borderless, radius, foreground। |
| `.elevation(..)` | `android={{ elevation }}` | हर एलिमेंट | व्यू के आकार से बनी material shadow, points में। |
| | `android={{ accessibilityLiveRegion }}` | हर एलिमेंट | `"none"`, `"polite"` या `"assertive"`: TalkBack व्यू के बदलावों की घोषणा करता है। |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | डायलॉग की सामग्री स्टेटस बार के नीचे तक पहुँचती है। |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | कीबोर्ड के ऊपर दिखाया जाने वाला `InputAccessoryView`। |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | ऑटोफ़िल प्रकारों के iOS के नाम (Rust का `AutoFill` दोनों प्लेटफ़ॉर्म को कवर करता है)। |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | जिन ओरिएंटेशन की यह अनुमति देता है। |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | पेज हिस्ट्री में स्वाइप करके पीछे और आगे जाना। |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | हेडर के अंत में UIKit का अपना बार बटन, जो दबाने पर `headerRight` चलाता है। |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | हेडर की शुरुआत में UIKit का अपना बार बटन, जो दबाने पर `headerLeft` चलाता है। |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | हेडर के अंत में SF Symbol दिखाने वाला UIKit का अपना बार बटन, जो दबाने पर `headerRight` चलाता है। |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | हेडर की शुरुआत में SF Symbol दिखाने वाला UIKit का अपना बार बटन, जो दबाने पर `headerLeft` चलाता है। |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS: दो उंगलियों के ट्रैकपैड स्वाइप से पेज हिस्ट्री में पीछे और आगे जाना; Windows: टचस्क्रीन स्वाइप; Linux: टचपैड स्वाइप। |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | हर एलिमेंट | इसे दबाने पर विंडो खिंचती है, जैसा सिस्टम का टाइटल बार करता (देखें [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own))। |

TSX में `desktop={{…}}` और `web={{…}}` हर जगह स्वीकार किए जाते हैं। टाइप (`IOSProps`, `AndroidProps`, `DesktopProps` और उनके प्रति-एलिमेंट रूप) आपके एडिटर को बताते हैं कि हर एलिमेंट क्या लेता है।

कोई एलिमेंट हर प्लेटफ़ॉर्म पर जो अर्थ रखता है, वह टॉप-लेवल prop होता है (Rust में उसी नाम का मेथड), और वहीं लागू होता है जहाँ उसका अर्थ बनता है: `NavPage` के `title`, `headerStyle`, `headerLargeTitle` और `headerBackTitle` iOS और Android का सिस्टम हेडर सेट करते हैं, उसका `header` स्लॉट डेस्कटॉप और वेब का हेडर है, और `Dialog` का `presentation` iOS की शीट चुनता है। `AlertDialog.show` के `closeOnBackdropPress`, `pagingEnabled`, `refreshing`, `hitSlop` और बाकी हर प्लेटफ़ॉर्म पर काम करते हैं। किसी प्लेटफ़ॉर्म की अपनी सिस्टम सुविधा उसके ऑब्जेक्ट में जाती है, और जब कई प्लेटफ़ॉर्म में वह हो, तो हर एक में उसी नाम से: `WebView` का `allowsBackForwardNavigationGestures`, यानी पेज हिस्ट्री में सिस्टम के स्वाइप, `ios={{…}}` और `desktop={{…}}` में है।

<a id="platform-modules"></a>

## प्लेटफ़ॉर्म मॉड्यूल

Rust में, जो API सिर्फ़ एक प्लेटफ़ॉर्म पर होते हैं वे `nsh_core::prelude` (`on_back_press`, `input_accessory_view`) और `nsh_core::element::desktop` के फ़ंक्शन हैं (विंडो: `set_title`, `set_title_bar`, `title_bar`, `minimize`, `toggle_maximize`, `toggle_full_screen`, `set_frame`, `set_level`, `order_front`, `close_window`; मेन्यू: `set_application_menu`, `popup_menu`); अन्यत्र वे कुछ नहीं करते। TSX में, `nsh/mobile` में iOS और Android के API हैं (उनमें से कुछ किसी एक प्लेटफ़ॉर्म के), और `nsh/desktop` में डेस्कटॉप के। दोनों को हर प्लेटफ़ॉर्म पर इम्पोर्ट किया जा सकता है, इसलिए एक ही बंडल हर जगह चलता है: अन्य प्लेटफ़ॉर्म पर उनके फ़ंक्शन तुरंत लौट जाते हैं और उनके कॉम्पोनेंट कोई जगह नहीं घेरते। हर एक `isAvailable` एक्सपोर्ट करता है, जो अपने प्लेटफ़ॉर्म पर `true` होता है; `platform.os` उन्हें अलग पहचानता है।

### nsh/mobile

`isAvailable` iOS (Mac Catalyst सहित) और Android पर `true` है। दोनों प्लेटफ़ॉर्म में [`TabBar`](../modules/nsh-mobile.md#tabbar), यानी सिस्टम का टैब बार, होता है।

#### BackHandler (Android)

| Rust | TSX | विवरण |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | डायलॉग के बाद और स्टैक से पहले बैक बटन को सुनता है; संभाल लेने पर `true` लौटाएँ। लिसनर उस कॉम्पोनेंट (या effect) के साथ चला जाता है जिसने उसे जोड़ा था; TSX में यह कॉल एक फ़ंक्शन भी लौटाती है जो उसे पहले ही रोक देता है। |
| | `BackHandler.exitApp()` | ऐप से बाहर निकलता है। |

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let full_screen = signal(false);
    // Back leaves full screen before it leaves the page. The listener goes
    // with the view.
    on_back_press(move || {
        if !full_screen.get_untracked() {
            return false;
        }
        full_screen.set(false);
        true
    });
    // …
}
```

```tsx tabs
import { BackHandler } from "nsh/mobile";

function Player() {
  // Back leaves full screen before it leaves the page. The listener goes
  // with the component.
  BackHandler.on("press", () => {
    if (!fullScreen()) return false;
    fullScreen.set(false);
    return true;
  });
  // …
}
```

बैक बटन को सबसे पहले सबसे ऊपर का डायलॉग संभालता है, फिर बैक लिसनर (सबसे हाल का पहले), फिर सबसे ऊपर का नेविगेशन स्टैक, और अगर किसी ने नहीं संभाला तो ऐप बंद हो जाता है। देखें [Navigation](./navigation.md#the-android-back-button)।

#### InputAccessoryView (iOS)

| Rust | TSX | विवरण |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | अपना नेटिव id (`.input_accessory(..)`, `ios={{ inputAccessoryViewID }}`) बताने वाले इनपुट के कीबोर्ड के ऊपर एक बार। |

देखें [Forms and the keyboard](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview)।

### nsh/desktop

Rust ऐप अपने टाइटल बार `nsh_core::element::desktop` से खुद बनाते हैं ([Building with Rust](./rust.md#desktop-title-bars))। TSX का मॉड्यूल:

| Export | विवरण |
|---|---|
| `Window` | विंडो: `setTitle`, ऐप के अपने टाइटल बार के लिए `setTitleBar({ style: "hidden" })`, `minimize`, `toggleMaximize`, `toggleFullScreen`, `close`। |
| `titleBar` | छिपे हुए टाइटल बार की ऊँचाई और सिस्टम के विंडो कंट्रोल जितनी जगह घेरते हैं (रिएक्टिव)। |
| `Menu` | `setApplicationMenu(items)` (शॉर्टकट वाला मेन्यू बार) और `popup(items, at?)` (कॉन्टेक्स्ट मेन्यू)। |
| `isAvailable` | `true` जहाँ विंडो और मेन्यू API काम करते हैं: macOS, Windows और Linux। डेस्कटॉप ब्राउज़र में `platform.desktop` होता है और वे ब्राउज़र की अपनी विंडो और मेन्यू रखते हैं। |

देखें [nsh/desktop](../modules/nsh-desktop.md)।

<a id="the-status-bar"></a>

### स्टेटस बार

दोनों प्लेटफ़ॉर्म पर स्टेटस बार सबसे ऊपर के पेज या डायलॉग का होता है, जैसा UIKit में, जहाँ सबसे ऊपर का व्यू कंट्रोलर उसे तय करता है: [`NavPage` और `Dialog` `statusBar` लेते हैं](../modules/nsh-base.md#status-bar) (Rust में `.status_bar(StatusBarStyle::Light)`, या बाकी फ़ील्ड के लिए `StatusBarSetting`) जिसमें `foreground` (`"auto"`, गहरी पृष्ठभूमि के लिए `"light"`, हल्की के लिए `"dark"`), `hidden` और `animated` होते हैं। सबसे हाल में दिखाया गया पेज या डायलॉग, फ़ील्ड दर फ़ील्ड, जीतता है, और उसके हटने पर उसके नीचे वाला फिर लागू हो जाता है। `nsh.json` का `"statusBar"` उनके नीचे ऐप का डिफ़ॉल्ट है।

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> impl IntoElement {
    nav_page()
        .header_visible(false)
        .status_bar(StatusBarStyle::Light)
        .child(view().flex_1().bg(black()))
}
```

```tsx tabs
import { View } from "nsh";
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light" }}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>…</View>
    </NavPage>
  );
}
```

किसी नेटिव ऐप में एम्बेड किए गए ऐप में, iOS पर स्टेटस बार का फ़ैसला होस्ट ऐप का व्यू कंट्रोलर करता है। जो ऐप `nsh.json` में `"capabilities"` घोषित करता है, उसे इसे बदलने के लिए `"statusBar": true` चाहिए।

<a id="platformos-and-platformselect"></a>

## platform.os और platform.select

Rust में `os()` और TSX में `nsh` से आने वाला `platform` कॉन्स्टेंट बताता है कि ऐप कहाँ चल रहा है: `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` या `Os::Web`, और `platform.os` `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` या `"web"` (Mac Catalyst `"ios"` है, और उसके किसी भी idiom में `platform.catalyst` होता है; [macOS बैकएंड](./macos.md) `"macos"` है, [Linux बैकएंड](./linux.md) `"linux"` और [Windows बैकएंड](./windows.md) `"windows"`, और उनके एलिमेंट अपने `desktop` props लागू करते हैं; [ब्राउज़र](./web.md) `"web"` हैं, और जब `platform.desktop`, `true` हो तब `desktop` props भी लागू करते हैं)। वर्ज़न, idiom और बाकी के लिए देखें [Device and environment](./device-and-environment.md#the-platform)।

```rust tabs
use nsh_core::{element::Os, prelude::*};

if os() == Os::Android {
    // …
}
```

```tsx tabs
import { platform } from "nsh";

if (platform.os === "android") {
  // …
}
```

### platform.select

Rust में `match os()` मान चुनता है, डेस्कटॉप के लिए `is_desktop()` के साथ। TSX में `platform.select(spec)` इस प्लेटफ़ॉर्म का मान लौटाता है। यह पहले OS की अपनी key खोजता है, फिर [ऊपर के नियम](#desktop-and-mobile) के अनुसार `desktop` या `mobile` (`platform.desktop`), फिर `native` (वेब को छोड़कर हर प्लेटफ़ॉर्म), फिर `default`:

```rust tabs
use nsh_core::{element::Os, prelude::*};

fn card() -> View {
    let card = view().rounded(px(12.0)).bg(white());
    match os() {
        Os::Ios => card.shadow_md(),
        Os::Android => card.border_1().border_color(rgb(0xe5e7eb)),
        _ => card,
    }
}

let hint = match os() {
    Os::Ios => "Swipe down to close",
    Os::Android => "Press back to close",
    _ => "Close",
};
```

```tsx tabs
const styles = {
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    ...platform.select({
      ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.12)" },
      android: { borderWidth: 1, borderColor: "#e5e7eb" },
    }),
  },
};

const hint = platform.select({ ios: "Swipe down to close", android: "Press back to close", default: "Close" });
```

कुछ भी मेल न खाने और `default` न होने पर यह `undefined` लौटाता है।

<a id="rendering-different-components"></a>

### अलग-अलग कॉम्पोनेंट रेंडर करना

जब चुनाव कभी बदलता नहीं, तो कॉम्पोनेंट भी इसी तरह चुनें, मॉड्यूल स्तर पर (TSX):

```rust tabs
fn spinner() -> AnyElement {
    if os() == Os::Ios {
        ios_spinner().into_element()
    } else {
        material_spinner().into_element()
    }
}
```

```tsx tabs
const Spinner = platform.select({ ios: IosSpinner, default: MaterialSpinner })!;
```

या [`when` / `<If>`](../elements/control-flow.md) के साथ इनलाइन:

```rust tabs
when(os() == Os::Ios, || input_accessory_view("bar").child(…))
    .otherwise(|| text("Android has no input accessories."))
```

```tsx tabs
<If when={platform.os === "ios"} else={<Text>Android has no input accessories.</Text>}>
  <InputAccessoryView nativeID="bar">…</InputAccessoryView>
</If>
```

<a id="platform-variants-in-tailwind"></a>

## Tailwind में प्लेटफ़ॉर्म वेरिएंट

Rust में प्लेटफ़ॉर्म के अनुसार स्टाइल `.when(os() == Os::Ios, |v| ..)` से होती है; TSX में `ios:`, `android:` और `web:` वेरिएंट एक प्लेटफ़ॉर्म पर क्लासेस लागू करते हैं:

```rust tabs
view()
    .rounded_xl()
    .bg(white())
    .p_4()
    .when(os() == Os::Ios, |v| v.shadow_md())
    .when(os() == Os::Android, |v| v.border_1().border_color(rgb(0xe4e4e7)))
```

```tsx tabs
<View class="rounded-xl bg-white p-4 ios:shadow-md android:border android:border-zinc-200">…</View>
<Text class="text-base android:font-medium">Title</Text>
```

<a id="prefer-shared-behavior"></a>

## साझा व्यवहार को प्राथमिकता दें

प्लेटफ़ॉर्म जाँच अपनाने से पहले सोचें कि क्या यह अंतर आपके उपयोगकर्ताओं के लिए मायने रखता है। एलिमेंट और स्टाइल पहले से ही हर प्लेटफ़ॉर्म के नेटिव व्यवहार से मेल खाते हैं जहाँ उन्हें अलग होना चाहिए (स्क्रॉल फ़िज़िक्स, टेक्स्ट रेंडरिंग, कीबोर्ड, एक्सेसिबिलिटी), और वहाँ एक जैसे रहते हैं जहाँ उपयोगकर्ता एकरूपता की अपेक्षा करते हैं (आपके ऐप का अपना लुक)। प्लेटफ़ॉर्म जाँच उन प्लेटफ़ॉर्म परंपराओं के लिए रखना सबसे अच्छा है जिन पर उपयोगकर्ता निर्भर करते हैं: Android का बैक बटन और टोस्ट, iOS की शीट और बड़े टाइटल, ऑटोफ़िल के नाम, Android का ripple।

<a id="related"></a>

## संबंधित

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) और [`BackHandler`](../modules/nsh-mobile.md#backhandler): रेफ़रेंस।
- [`nsh` का डिवाइस API](../modules/nsh.md#device): `platform`।
- [Native components](./native-components.md): हर प्लेटफ़ॉर्म पर आपके होस्ट ऐप द्वारा दिए गए व्यू का उपयोग।
- [Tailwind](./tailwind.md): हर वेरिएंट।
