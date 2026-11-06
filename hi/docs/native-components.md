---
title: "नेटिव कॉम्पोनेंट्स"
description: "होस्ट ऐप के व्यूज़ (मैप्स, प्लेयर, कोई भी UIView या Android View) को props, events, commands और sizing के साथ NSH ऐप के अंदर इस्तेमाल करें।"
order: 18
group: platforms
source_hash: e798ebb6480fceba
---

# Native Components

नेटिव कंपोनेंट वह व्यू है जिसे **एम्बेड करने वाला ऐप** किसी नाम से रजिस्टर करता है: मैप, कैमरा प्रीव्यू, चार्ट लाइब्रेरी, iOS पर कोई भी `UIView`, Android पर `android.view.View`, macOS पर `NSView`, Linux पर `gtk::Widget`, या Windows पर Direct2D ड्रॉइंग या चाइल्ड `HWND`। NSH ऐप इसे किसी भी दूसरे एलिमेंट की तरह इस्तेमाल करता है: Rust ऐप इसे `nsh_core::prelude` के `native(name)` से बनाता है, TSX ऐप इसे [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule) के `nativeComponent()` से घोषित करता है। NSH इसे ऐप के बाकी हिस्सों के साथ लेआउट करता है, इसे props भेजता है, इसके इवेंट हैंडलर तक पहुँचाता है और `ref` से आने वाले कमांड इसे फ़ॉरवर्ड करता है।

क्योंकि NSH सिस्टम के अपने व्यू से रेंडर करता है, नेटिव कंपोनेंट उसी हायरार्की में बस एक और सबव्यू होता है: कोई लेयरिंग समस्या नहीं है, यह `<View>` की तरह क्लिप होता है, स्क्रॉल होता है और टच प्राप्त करता है।

> [!NOTE]
> नेटिव कंपोनेंट उस ऐप द्वारा रजिस्टर किए जाते हैं जो NSH को एम्बेड करता है ([iOS](./ios.md), [Android](./android.md), [macOS](./macos.md#embedding-in-a-mac-app), [Linux](./linux.md#embedding-in-a-gtk-app), [Windows](./windows.md#embedding-in-a-win32-app)), या Windows, macOS, Linux और iOS पर ऐप के अपने Rust crate द्वारा, जिसके कंपोनेंट डेवलपमेंट होस्ट और पैकेज्ड ऐप (`nsh package`) रजिस्टर करते हैं ([ऐप के crate से रजिस्टर करना](#registering-from-the-apps-crate))। जिस नाम को किसी ने रजिस्टर नहीं किया, वह खाली व्यू रेंडर करता है (नाम को एक बार unknown के रूप में लॉग किया जाता है)।

<a id="how-it-fits-together"></a>

## यह सब कैसे जुड़ता है

1. होस्ट ऐप अपने `NshAppView` (iOS) या `NshView` (Android) पर किसी नाम, जैसे `"embed.badge"`, के तहत एक फ़ैक्टरी रजिस्टर करता है। हर व्यू की अपनी रजिस्ट्री होती है; कुछ भी ग्लोबल नहीं है।
2. NSH ऐप उस नाम के लिए एक कंपोनेंट घोषित करता है, जिसमें वे props और इवेंट होते हैं जिनका वह उपयोग करता है।
3. जब एलिमेंट बनता है, NSH एक कंटेनर व्यू बनाता है (जो किसी भी व्यू की तरह सजाया जाता है, फ़्रेम किया जाता है और हिट-टेस्ट किया जाता है), फिर फ़ैक्टरी से एक कंपोनेंट माँगता है और कंपोनेंट का व्यू कंटेनर के अंदर रख देता है, जो उसे पूरा भर देता है।
4. कंपोनेंट बनने के तुरंत बाद हर prop प्राप्त करता है, फिर किसी prop के बदलने पर वह prop दोबारा प्राप्त करता है।
5. कंपोनेंट इवेंट भेजता है और अपना साइज़ रिपोर्ट कर सकता है; ऐप उसके कमांड `ref` के ज़रिए कॉल करता है।

<a id="using-the-component-in-the-app"></a>

## ऐप में कंपोनेंट का उपयोग

Rust में, `native(name)` एलिमेंट बनाता है: `.prop(name, value)` उसे एक prop देता है (`serde_json::Value`, या सिग्नल, या उसका क्लोज़र, जो बदलने पर दोबारा भेजा जाता है), `.on_native_event(..)` उसके इवेंट `NativeEvent { name, data }` के रूप में सुनता है, और `.element_ref(&r)` से उस पर लगाए गए `element_ref()` के मेथड उसके कमांड भेजते हैं। TSX में, `nativeComponent()` उस नाम के लिए कंपोनेंट घोषित करता है, जिसमें वे props और इवेंट होते हैं जिनका वह उपयोग करता है।

```rust tabs
use nsh_core::prelude::*;
use serde_json::json;

const COLORS: [&str; 4] = ["#8250df", "#0969da", "#1a7f37", "#cf222e"];

#[component]
pub fn App() -> impl IntoElement {
    let taps = signal(0_u64);
    let badge = element_ref();
    view()
        .flex_1()
        .p(px(20.0))
        .pt_safe_area_plus(px(20.0))
        .pb_safe_area_plus(px(20.0))
        .gap(px(16.0))
        .bg(rgb(0xf6f8fa))
        .child(text("Rendered by nsh").text_size(px(22.0)).font_weight(FontWeight::BOLD))
        .child(
            // The host app's badge: a label it draws, sized to its text.
            native("embed.badge")
                .element_ref(&badge)
                .prop("text", move || match taps.get() {
                    0 => json!("Tap the native badge"),
                    n => json!(format!("Tapped {n}×")),
                })
                .prop("color", move || json!(COLORS[taps.get() as usize % COLORS.len()]))
                .on_native_event(move |e: &NativeEvent| {
                    if &*e.name == "tap" {
                        taps.set(e.data["count"].as_u64().unwrap_or(0));
                        badge.command("pulse", json!(null));
                    }
                })
                .self_start()
                .rounded(px(8.0))
                .overflow_hidden(),
        )
        .child(text(move || format!("Rust saw {} taps", taps.get())))
}
```

```tsx tabs
import { mount, type NativeComponentRef, signal, Text, View } from "nsh";
import { nativeComponent } from "nsh";

/** The host app's badge: a label it draws, sized to its text. */
const Badge = nativeComponent<{ text: string; color?: string }, { tap: { count: number } }>("embed.badge", {
  props: ["text", "color"],
  events: ["tap"],
});

const colors = ["#8250df", "#0969da", "#1a7f37", "#cf222e"];

function App() {
  const taps = signal(0);
  let badge: NativeComponentRef | undefined;
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: "calc(env(safe-area-inset-top) + 20px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)", gap: 16, backgroundColor: "#f6f8fa" }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Rendered by nsh</Text>
      <Badge
        ref={(node) => (badge = node)}
        text={taps() === 0 ? "Tap the native badge" : `Tapped ${taps()}×`}
        color={colors[taps() % colors.length]}
        onTap={(e) => {
          taps.set(e.count);
          badge?.command("pulse");
        }}
        style={{ alignSelf: "flex-start", borderRadius: 8, overflow: "hidden" }}
      />
      <Text>{`JS saw ${taps()} taps`}</Text>
    </View>
  );
}

mount(App);
```

TSX वर्शन `examples/embedded/App.tsx` है, जिसे रिपॉज़िटरी के दोनों एम्बेडिंग सैंपल चलाते हैं।

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| पैरामीटर | टाइप | विवरण |
|---|---|---|
| `name` | `string` | होस्ट ऐप ने जो नाम रजिस्टर किया। नामों को यूनीक रखने के लिए अपना प्रीफ़िक्स इस्तेमाल करें (`"maps.view"`, `"acme.chart"`)। |
| `spec.props` | `readonly (keyof P & string)[]` | कंपोनेंट के अपने props। नेटिव साइड को केवल यहाँ सूचीबद्ध props भेजे जाते हैं। |
| `spec.events` | `readonly (keyof E & string)[]` | वे इवेंट जो यह भेजता है। वैकल्पिक। |

टाइप पैरामीटर props (`P`) और हर इवेंट के पेलोड (`E`) का वर्णन करते हैं। लौटाया गया कंपोनेंट ये स्वीकार करता है:

- कंपोनेंट के अपने props `P`;
- हर इवेंट के लिए एक हैंडलर: इवेंट `tap` को `onTap` हैंडल करता है, `regionChange` को `onRegionChange` (पहला अक्षर कैपिटल किया जाता है और आगे `on` जोड़ा जाता है);
- वह सब कुछ जो `<View>` लेता है, children को छोड़कर: `style`, `class` / `classList` ([Tailwind](./tailwind.md)), लेआउट, accessibility props, `testID`, `onLayout`, `ref`। ये उस कंटेनर के हैं जिसे NSH बनाता है, कंपोनेंट के नहीं।

नेटिव कंपोनेंट एक लीफ़ है: यह कोई children नहीं लेता।

## Props

हर अपना prop JSON के रूप में भेजा जाता है, इसलिए उसका मान कोई भी JSON मान हो सकता है: स्ट्रिंग, नंबर, बूलियन, `null`, ऐरे और सादे ऑब्जेक्ट। Props किसी भी दूसरे prop की तरह रिएक्टिव हैं: जब Rust prop का क्लोज़र (`.prop("text", move || json!(label.get()))`) या TSX का `text={label()}` कोई सिग्नल पढ़ता है, तो सिग्नल बदलने पर नया मान भेजा जाता है, और केवल तभी।

| ऐप में क्या होता है | कंपोनेंट को क्या मिलता है |
|---|---|
| एलिमेंट बनता है | हर वह अपना prop जो सेट है, कंपोनेंट बनने के तुरंत बाद |
| किसी prop का मान बदलता है | वह prop अपने नए मान के साथ |
| कोई prop `undefined` हो जाता है | वह prop बिना मान के (Swift में `nil`, Java में `null`) |
| एनिमेटेड वैल्यू से बंधा prop हिलता है | `setAnimatedNumber` / `setAnimatedColor`, उन फ़्रेम में जिनमें वह बदलता है |

Props JSON मान ले जाते हैं; इंटरफ़ेस को डेटा तक सीमित रखें (फ़ंक्शन और क्लास इंस्टेंस ऐप में ही रहते हैं)।

### Animated props

कोई prop एनिमेटेड वैल्यू भी हो सकता है: एक `AnimatedValue`, या उससे निकला कोई नोड (`interpolate`, स्क्रॉल व्यू का `scrollValue` या `pullValue`)। तब वह JSON के रूप में नहीं भेजा जाता: NSH उसे बाइंड करता है, और कंपोनेंट को हर उस फ़्रेम पर UI थ्रेड में मान सौंपा जाता है जिसमें वह बदलता है, JS से गुज़रे बिना, ताकि वह ड्रैग या पुल टू रिफ़्रेश का अनुसरण कर सके।

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

कंपोनेंट नंबर `setAnimatedNumber(name, value)` से और रंग `setAnimatedColor(name, argb)` (`0xAARRGGBB`) से प्राप्त करता है; डिफ़ॉल्ट रूप से दोनों नंबर के साथ `setProp` कॉल करते हैं, इसलिए जो कंपोनेंट इन्हें लागू नहीं करता उसे भी मान मिल जाता है। Rust कंपोनेंट `set_animated_number` और `set_animated_color` लागू करते हैं, और Rust कोड prop को `native(name).bind_animated_prop("progress", &value)` से बाइंड करता है। prop को फिर से सादा मान देने पर वह अनबाइंड हो जाता है और वह मान भेजा जाता है। वेब पर कोई रजिस्टर किया हुआ कंपोनेंट नहीं होता।

## Events

कंपोनेंट नाम से और वैकल्पिक JSON पेलोड के साथ इवेंट भेजता है। NSH उसे इंजन थ्रेड तक पहुँचाता है और मेल खाने वाले हैंडलर को पेलोड के साथ कॉल करता है (Rust में, वह एक `on_native_event` लिसनर जिसमें इवेंट का `name` और `data` होता है):

```rust tabs
use serde_json::json;

native("acme.map")
    .prop("latitude", json!(52.52))
    .prop("longitude", json!(13.405))
    .on_native_event(move |e: &NativeEvent| match &*e.name {
        "regionChange" => center.set((
            e.data["latitude"].as_f64().unwrap_or_default(),
            e.data["longitude"].as_f64().unwrap_or_default(),
        )),
        "markerPress" => open(e.data["id"].as_str().unwrap_or_default()),
        _ => {}
    })
    .flex_1()
```

```tsx tabs
const MapView = nativeComponent<
  { latitude: number; longitude: number; zoom?: number },
  { regionChange: { latitude: number; longitude: number }; markerPress: { id: string } }
>("acme.map", {
  props: ["latitude", "longitude", "zoom"],
  events: ["regionChange", "markerPress"],
});

<MapView
  latitude={52.52}
  longitude={13.405}
  onRegionChange={(region) => center.set(region)}
  onMarkerPress={({ id }) => open(id)}
  style={{ flex: 1 }}
/>;
```

इवेंट एसिंक्रोनस होते हैं: मुख्य थ्रेड कभी ऐप के कोड का इंतज़ार नहीं करता। जिस कंपोनेंट को तुरंत कुछ तय करना है (क्या यह जेस्चर शुरू हो सकता है, क्या यह क्षेत्र बदल सकता है), उसे यह नेटिव रूप से, पहले प्राप्त props के आधार पर, तय करना होगा।

## Commands

इम्पेरेटिव कॉल (किसी बिंदु पर ज़ूम करना, प्लेबैक शुरू करना, एनिमेशन पल्स करना) एलिमेंट के ref से जाते हैं (Rust में `element_ref()`, TSX में `ref`):

```rust tabs
let map = element_ref();

native("acme.map")
    .element_ref(&map)
    .prop("latitude", json!(52.52))
    .prop("longitude", json!(13.405))
    .flex_1()

map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
let map: NativeComponentRef | undefined;

<MapView ref={(node) => (map = node)} latitude={52.52} longitude={13.405} style={{ flex: 1 }} />;

map?.command("zoomTo", { level: 3 });
```

`command(name, args)` (TSX: `command(name, args?)`) नाम और आर्ग्युमेंट (कोई भी JSON मान) कंपोनेंट के `command` मेथड को भेजता है। कमांड उनसे पहले किए गए बदलावों के साथ क्रम में लागू होते हैं, इसलिए prop बदलने के तुरंत बाद जारी किया गया कमांड नया prop देखता है।

## Sizing

कंटेनर `<View>` की तरह लेआउट होता है:

- जहाँ स्टाइल कोई आयाम देती है (`width`, `height`, `flex: 1`, `alignSelf: "stretch"`, ...), वही आयाम मान्य होता है।
- जहाँ स्टाइल कोई आयाम खुला छोड़ती है, कंटेनर वह साइज़ लेता है जो कंपोनेंट ने `setSize` से रिपोर्ट किया, जैसे इमेज अपना प्राकृतिक साइज़ लेती है। जो कंपोनेंट कभी साइज़ रिपोर्ट नहीं करता, वह खुले आयामों में 0 नापा जाता है।

जब भी कंटेंट बदले, साइज़ points (iOS) या dp (Android) में रिपोर्ट करें। ऊपर का बैज हर बार जब `text` बदलता है तो अपना लेबल नापता है और लेबल का साइज़ और पैडिंग रिपोर्ट करता है, इसलिए `alignSelf: "flex-start"` बैज को ठीक उसके टेक्स्ट जितना चौड़ा बना देता है।

<a id="registering-on-ios-swift"></a>

## iOS पर रजिस्टर करना (Swift)

`NshComponent` लागू करें और `NshAppView` पर एक फ़ैक्टरी रजिस्टर करें:

```swift
import NativeShell
import UIKit

/// `embed.badge`: props `text` and `color`; emits `tap`; command `pulse`.
final class Badge: NshComponent {
    let view = UIView()
    private let label = UILabel()
    private let context: NshComponentContext
    private var taps = 0

    init(_ context: NshComponentContext) {
        self.context = context
        label.textColor = .white
        label.font = .boldSystemFont(ofSize: 17)
        label.textAlignment = .center
        label.frame = view.bounds
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(label)
        view.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(tapped)))
    }

    func setProp(_ name: String, _ value: Any?) {
        switch name {
        case "text":
            label.text = value as? String
            let size = label.intrinsicContentSize
            context.setSize(CGSize(width: size.width + 32, height: size.height + 20))
        case "color":
            view.backgroundColor = (value as? String).flatMap(UIColor.init(hex:)) ?? .systemPurple
        default:
            break
        }
    }

    func command(_ name: String, _ args: Any?) {
        guard name == "pulse" else { return }
        view.alpha = 0.3
        UIView.animate(withDuration: 0.6) { self.view.alpha = 1 }
    }

    @objc private func tapped() {
        taps += 1
        context.emit("tap", ["count": taps])
    }
}

// Before loading the bundle:
app.register(component: "embed.badge") { context in Badge(context) }
```

(`UIColor(hex:)` सैंपल का एक छोटा हेल्पर है, NativeShell का हिस्सा नहीं।)

| API | विवरण |
|---|---|
| `NshAppView.register(component:_:)` | किसी नाम के तहत फ़ैक्टरी `(NshComponentContext) -> NshComponent` रजिस्टर करता है। यह उसके बाद बनाए गए हर एलिमेंट के लिए एक कंपोनेंट बनाता है। वही नाम दोबारा रजिस्टर करने पर फ़ैक्टरी बदल जाती है। |
| `protocol NshComponent` | `var view: UIView` (कंटेनर को भरता है), `setProp(_:_:)`, `command(_:_:)` (वैकल्पिक: डिफ़ॉल्ट कमांड को अनदेखा करता है)। Main-actor isolated। |
| `setProp(_ name: String, _ value: Any?)` | मान Foundation JSON ऑब्जेक्ट हैं: `String`, `NSNumber`, `[Any]`, `[String: Any]`, `NSNull`; prop हटाए जाने पर `nil`। |
| `NshComponentContext.emit(_:_:)` | इवेंट भेजता है; डेटा ऐसा होना चाहिए जिसे `JSONSerialization` स्वीकार करे (या `nil`)। Thread-safe। |
| `NshComponentContext.setSize(_:)` | कंपोनेंट का अपना साइज़ points में रिपोर्ट करता है। Thread-safe। |

<a id="registering-on-android-java--kotlin"></a>

## Android पर रजिस्टर करना (Java / Kotlin)

`com.longbridge.nsh.NshComponent` लागू करें और `NshView` पर एक फ़ैक्टरी रजिस्टर करें:

```java
import com.longbridge.nsh.NshComponent;
import com.longbridge.nsh.NshComponentContext;

final class Badge implements NshComponent {
    private final TextView label;
    private final NshComponentContext context;
    private final float density;
    private int taps;

    Badge(Context app, NshComponentContext context) {
        this.context = context;
        density = app.getResources().getDisplayMetrics().density;
        label = new TextView(app);
        label.setTextColor(Color.WHITE);
        label.setTextSize(17);
        label.setGravity(Gravity.CENTER);
        label.setOnClickListener(v -> context.emit("tap", Collections.singletonMap("count", ++taps)));
    }

    @Override
    public View view() {
        return label;
    }

    @Override
    public void setProp(String name, Object value) {
        if (name.equals("text")) {
            label.setText(value instanceof String ? (String) value : "");
            label.measure(0, 0);
            // Sizes are in dp.
            context.setSize(label.getMeasuredWidth() / density + 32, label.getMeasuredHeight() / density + 12);
        } else if (name.equals("color")) {
            label.setBackgroundColor(value instanceof String ? Color.parseColor((String) value) : 0xff8250df);
        }
    }

    @Override
    public void command(String name, Object args) {
        if (!name.equals("pulse")) return;
        label.setAlpha(0.3f);
        label.animate().alpha(1).setDuration(600).start();
    }
}

// Before loading the bundle:
nsh.registerComponent("embed.badge", context -> new Badge(this, context));
```

Kotlin में वही:

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | विवरण |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | किसी नाम के तहत फ़ैक्टरी रजिस्टर करता है; यह उसके बाद बनाए गए हर एलिमेंट के लिए एक कंपोनेंट बनाता है (UI थ्रेड)। |
| `interface NshComponent` | `View view()`, `void setProp(String, Object)`, `default void command(String, Object)`, `default void destroy()` (एलिमेंट जा चुका है: हटाया गया, या उसका ऐप `NshView.destroy()` से रोका गया या किसी दूसरे लोड से बदला गया; हर कंपोनेंट के लिए एक बार कॉल होता है)। UI थ्रेड पर कॉल होता है। |
| `setProp` मान | `String`, `Number`, `Boolean`, `java.util.List`, `java.util.Map`, या हटाए जाने पर `null` (या JSON `null`)। |
| `NshComponentContext.emit(String event, Object data)` | इवेंट भेजता है; `data` वही Java टाइप, या `null`। किसी भी थ्रेड से। |
| `NshComponentContext.setSize(float width, float height)` | कंपोनेंट का अपना साइज़ dp में रिपोर्ट करता है। किसी भी थ्रेड से। |

<a id="registering-from-rust"></a>

## Rust से रजिस्टर करना

जो ऐप iOS रनटाइम को Rust से एम्बेड करते हैं (`nsh-platform-ios`), वे `AppView` पर `NativeComponent` रजिस्टर करते हैं:

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_ios::{AppView, ComponentContext, NativeComponent};
use objc2_ui_kit::UIView;

struct Badge {
    view: objc2::rc::Retained<UIView>,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn view(&self) -> &UIView {
        &self.view
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        // ... update the view, then report its size in points:
        self.context.set_size(120.0, 40.0);
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView, make_view: impl Fn() -> objc2::rc::Retained<UIView> + 'static) {
    app.register_component(
        "embed.badge",
        Rc::new(move |context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { view: make_view(), context })
        }),
    );
}
```

`ComponentContext::emit(name, data)` इवेंट भेजता है (`data` एक `serde_json::Value` है) और `set_size(width, height)` साइज़ रिपोर्ट करता है; दोनों किसी भी थ्रेड से काम करते हैं।

<a id="registering-on-macos-rust"></a>

## macOS पर रजिस्टर करना (Rust)

macOS पर कंपोनेंट एक `NSView` है, जो `nsh-platform-macos` की [`AppView`](./macos.md#embedding-in-a-mac-app) पर रजिस्टर होता है:

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_macos::{
    objc2::{rc::Retained, MainThreadMarker},
    objc2_app_kit::{NSTextField, NSView},
    objc2_foundation::NSString,
    AppView, ComponentContext, NativeComponent,
};

struct Badge {
    label: Retained<NSTextField>,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn view(&self) -> Retained<NSView> {
        Retained::into_super(Retained::into_super(self.label.clone()))
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        if name == "text" {
            let text = value.and_then(|v| v.as_str()).unwrap_or("");
            self.label.setStringValue(&NSString::from_str(text));
            self.context.set_size(120.0, 40.0);
        }
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView, mtm: MainThreadMarker) {
    app.register_component(
        "embed.badge",
        Rc::new(move |context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { label: NSTextField::labelWithString(&NSString::new(), mtm), context })
        }),
    );
}
```

व्यू उस कंटेनर को भरता है जिसे NSH लेआउट करता है; `ComponentContext::emit` और `set_size` (points) iOS की तरह किसी भी थ्रेड से काम करते हैं। `AppView::load` से पहले रजिस्टर करें; एक रजिस्ट्री एक `AppView` की होती है (और उन व्यू की जो उसी `AppOptions` से बने हों)।

<a id="registering-on-linux-rust"></a>

## Linux पर रजिस्टर करना (Rust)

Linux पर कंपोनेंट एक GTK विजेट है, जो `nsh-platform-linux` की [`AppView`](./linux.md#embedding-in-a-gtk-app) पर रजिस्टर होता है:

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_linux::{gtk4 as gtk, AppView, ComponentContext, NativeComponent};
use gtk::prelude::*;

struct Badge {
    label: gtk::Label,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn widget(&self) -> gtk::Widget {
        self.label.clone().upcast()
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        if name == "text" {
            self.label.set_text(value.and_then(|v| v.as_str()).unwrap_or(""));
            self.context.set_size(120.0, 40.0);
        }
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView) {
    app.register_component(
        "embed.badge",
        Rc::new(|context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { label: gtk::Label::new(None), context })
        }),
    );
}
```

विजेट उस कंटेनर को भरता है जिसे NSH लेआउट करता है; `ComponentContext::emit` और `set_size` (points) iOS की तरह किसी भी थ्रेड से काम करते हैं। `AppView::load` से पहले रजिस्टर करें। एक रजिस्ट्री एक `AppView` की होती है (और उन व्यू की जो उसी `AppOptions` से बने हों, जिसका `components` फ़ील्ड वह है)।

<a id="registering-on-windows-rust"></a>

## Windows पर रजिस्टर करना (Rust)

Windows पर NSH हर व्यू को स्वयं Direct2D से ड्रॉ करता है, इसलिए कंपोनेंट या तो अपने कंटेनर में Direct2D से ड्रॉ करता है (`draw`) या अपनी खुद की विंडो लाता है (`window`: मैप कंट्रोल, थर्ड-पार्टी व्यू), जो `nsh-platform-windows` की [`AppView`](./windows.md#embedding-in-a-win32-app) पर रजिस्टर होता है:

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_windows::{
    windows::Win32::Graphics::Direct2D::{
        Common::{D2D1_COLOR_F, D2D_RECT_F},
        ID2D1DeviceContext,
    },
    AppView, ComponentContext, NativeComponent,
};

/// A box filled with the color of its `on` prop.
struct Badge {
    on: bool,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn draw(&self, dc: &ID2D1DeviceContext, size: (f32, f32)) {
        let color = if self.on {
            D2D1_COLOR_F { r: 0.2, g: 0.7, b: 0.3, a: 1.0 }
        } else {
            D2D1_COLOR_F { r: 0.6, g: 0.6, b: 0.6, a: 1.0 }
        };
        // SAFETY: Direct2D calls on the context nsh draws with.
        unsafe {
            if let Ok(brush) = dc.CreateSolidColorBrush(&color, None) {
                let rect = D2D_RECT_F { left: 0.0, top: 0.0, right: size.0, bottom: size.1 };
                dc.FillRectangle(&rect, &brush);
            }
        }
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        if name == "on" {
            self.on = value.and_then(|v| v.as_bool()).unwrap_or(false);
            self.context.set_size(120.0, 40.0);
            self.context.redraw();
        }
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView) {
    app.register_component(
        "embed.badge",
        Rc::new(|context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { on: false, context })
        }),
    );
}
```

`draw` विंडो के हर फ़्रेम के साथ चलता है, व्यू के निर्देशांकों (points) में, उसकी सीमाओं तक क्लिप होकर; जब वह जो दिखाता है बदले तो `ComponentContext::redraw` कॉल करें। ड्रॉ किया गया कंपोनेंट किसी भी व्यू की तरह ढका, क्लिप और ट्रांसफ़ॉर्म किया जाता है, और टच उसका कंटेनर पाता है। जो कंपोनेंट `window` से चाइल्ड विंडो लौटाता है, वह अपने व्यू के साथ हिलाया, क्लिप और छिपाया जाता है, अपना इनपुट खुद पाता है, और NSH जो कुछ भी ड्रॉ करता है उसके ऊपर रहता है (उसके ऊपर का NSH कंटेंट छिप जाता है, जैसे वेब व्यू के साथ)। `ComponentContext::emit`, `set_size` (points) और `redraw` किसी भी थ्रेड से काम करते हैं। `AppView::load` से पहले रजिस्टर करें; एक रजिस्ट्री एक `AppView` की होती है (और उन व्यू की जो उसी `AppOptions` से बने हों)।

कंपोनेंट अपने ऊपर माउस व्हील और टचपैड स्क्रॉल भी `wheel` से ले सकता है (इमेज व्यूअर इनसे ज़ूम करता है)। उसे मिलने वाले `Wheel` में पॉइंटर (`x`, `y`, कंपोनेंट के points में), points में दूरी (`dx`, `dy`, दाईं और नीचे की ओर धनात्मक, जैसे स्क्रॉल व्यू अपना कंटेंट हिलाते हैं) और व्हील नॉच में दूरी (`notches_x`, `notches_y`, प्रिसिशन टचपैड और हाई-रिज़ॉल्यूशन व्हील से आने वाले अंशों के साथ), यह कि वह छोटे चरणों में आया या नहीं (`precise`) और दबे हुए मॉडिफ़ायर (`shift`, `ctrl`, `alt`) होते हैं। जो स्क्रॉल उसने लिया उसके लिए वह `true` लौटाता है; उसके आसपास के स्क्रॉल व्यू बाकी स्क्रॉल के साथ स्क्रॉल होते हैं, और डिफ़ॉल्ट रूप से सभी के साथ। जो स्क्रॉल किसी स्क्रॉल व्यू ने शुरू कर दिया, वह उसी व्यू पर रहता है। Ctrl + व्हील प्रिसिशन टचपैड की पिंच भी है, और Shift + व्हील वैसे ही आता है जैसे व्हील ने भेजा (`dy`, `shift` के साथ):

```rust
use nsh_platform_windows::Wheel;

impl NativeComponent for ImageView {
    // draw, set_prop, ...

    fn wheel(&mut self, event: &Wheel) -> bool {
        if !event.ctrl {
            return false; // the scroll views around it scroll
        }
        // √2 per notch, about the pointer.
        let factor = 2f32.powf(-event.notches_y / 2.0);
        self.zoom_about(event.x, event.y, factor);
        self.context.redraw();
        true
    }
}
```

<a id="registering-from-the-apps-crate"></a>

## ऐप के crate से रजिस्टर करना

जिस ऐप का अपना Rust crate है (`nsh.json` `"rust"`, [Rust](./rust.md)), वह नेटिव कंपोनेंट उसी crate में रजिस्टर करता है, ताकि वे उन होस्ट में काम करें जिन्हें NSH ऐप के लिए बनाता है: `nsh run` और `nsh test --target` का डेवलपमेंट होस्ट, और वह ऐप जो `nsh package` बनाता है। crate के रूट पर `#[native_components(<platform>)]` वाला एक फ़ंक्शन (`lib.rs`) उन्हें उस प्लेटफ़ॉर्म के `Components` पर रजिस्टर करता है, और होस्ट उसे हर बनाए गए व्यू के लिए कॉल करता है, जैसे एम्बेड करने वाला ऐप अपने `AppView` पर रजिस्टर करता है:

```rust
use std::rc::Rc;
use nsh_core::prelude::*;

#[native_components(windows)]
fn components(components: &nsh_platform_windows::Components) {
    use nsh_platform_windows::{ComponentContext, NativeComponent};
    components.register(
        "embed.badge",
        Rc::new(|context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { on: false, context })
        }),
    );
}
```

प्लेटफ़ॉर्म `windows`, `macos`, `linux` या `ios` है, और कंपोनेंट `nsh_platform_windows`, `nsh_platform_macos`, `nsh_platform_linux` या `nsh_platform_ios` के हैं (ऊपर के सेक्शन)। फ़ंक्शन केवल अपने प्लेटफ़ॉर्म पर कंपाइल होता है, इसलिए crate में हर समर्थित प्लेटफ़ॉर्म के लिए एक फ़ंक्शन होता है, जो सब एक ही नाम रजिस्टर करते हैं, और वह हर प्लेटफ़ॉर्म के crate पर केवल उसी प्लेटफ़ॉर्म के लिए निर्भर करता है, उसी वर्शन और उसी स्रोत से जो उसके अन्य NSH crate (`nsh-core` और बाकी) के हैं (CLI जाँचता है कि सब मेल खाते हैं):

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

होस्ट crate के कंपोनेंट तब रजिस्टर करता है जब वह हर व्यू बनाता है, उस कोड से पहले जो व्यू को पकड़े हुए है और अपने कंपोनेंट रजिस्टर करता है: उसके बाद व्यू पर रजिस्टर किया गया नाम (`AppView::register_component`) crate के नाम को बदल देता है।
<a id="rules-and-limits"></a>

## नियम और सीमाएँ

- **लोड करने से पहले रजिस्टर करें।** Factories केवल रजिस्ट्रेशन के बाद बनाए गए elements पर लागू होती हैं। हर नाम को
  `loadBundle` / `loadAssetBundle` / `run` से पहले रजिस्टर करें, ताकि पहला frame उन्हें खोज सके।
- **कंटेनर सजावट और touches का स्वामी है।** Background, borders, corner radius, shadows, opacity, transforms और
  `overflow: "hidden"` उस कंटेनर पर लागू होते हैं जिसे NSH draw करता है। आपका view उसे भरता है और उसके भीतर पड़ने वाले touches प्राप्त करता है।
- **Capabilities लागू नहीं होतीं।** रजिस्टर किया गया component host app का अपना कोड होता है; किसी app द्वारा घोषित
  [capabilities](./sandbox-and-capabilities.md) उसके कार्यों को सीमित नहीं करतीं। यदि आप ऐसे apps embed करते हैं जिन पर आप भरोसा नहीं करते, तो केवल वही components रजिस्टर करें जो उनके उपयोग के लिए सुरक्षित हों।
- **इंटरफ़ेस को डेटा तक सीमित रखें।** Props, event payloads और command arguments JSON text के रूप में पार होते हैं; हर बदलाव पर बड़े blobs नहीं, बल्कि identifiers और छोटे मान भेजें।
- **एक bundle, दोनों platforms।** iOS और Android पर वही नाम, वही props और वही events रजिस्टर करें, ताकि एक ही bundle दोनों पर चले।
- **`nsh/` के अंतर्गत आने वाले नाम NSH के हैं।** NSH के अपने components (`nsh/mobile` के `TabBar` का system tab bar) `nsh/` के अंतर्गत रजिस्टर होते हैं; अपने नाम अपने app या कंपनी के नाम पर रखें (`embed.badge`), और `nsh/` के अंतर्गत किया गया रजिस्ट्रेशन warning log करता है और NSH वाले को ही बनाए रखता है।

<a id="see-also"></a>

## यह भी देखें

- [`nativeComponent` reference](../modules/nsh.md#nativecomponent-and-nativemodule)
- [iOS apps में embed करना](./ios.md) और [Android apps में](./android.md)
- [Architecture](./architecture.md): props और events threads के पार कैसे जाते हैं
