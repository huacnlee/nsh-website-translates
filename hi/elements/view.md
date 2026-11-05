---
title: "View"
description: "बुनियादी कंटेनर एलिमेंट: लेआउट, बैकग्राउंड, बॉर्डर, शैडो, प्रेस हैंडलिंग और जेस्चर।"
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---

# View

`View` हर स्क्रीन का बुनियादी बिल्डिंग ब्लॉक है: एक नेटिव कंटेनर (iOS और Mac Catalyst पर UIView, Android पर ViewGroup) जो अपने चाइल्ड को flexbox या grid से लेआउट करता है, बैकग्राउंड, बॉर्डर, शैडो और ग्रेडिएंट बनाता है, और प्रेस को हैंडल करता है। बटन, कार्ड, रो और स्क्रीन, सब views ही हैं। Rust में इसे `view()` से बनाया जाता है, और TSX में `nsh` से `<View>` के ज़रिये।

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let liked = signal(false);
    view()
        .flex_1()
        .p_6()
        .gap_4()
        .bg(rgb(0xf6f8fa))
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_3()
                .p_4()
                .rounded(px(16.0))
                .bg(white())
                .shadow_md()
                .child(view().size(px(40.0)).rounded_full().bg(rgb(0x8250df)))
                .child(text("A card").flex_1().text_base())
                .child(
                    view()
                        .hit_slop(EdgeInsets::all(px(8.0)))
                        .active(|s| s.opacity(0.5))
                        .on_press(move || liked.update(|l| *l = !*l))
                        .child(text(move || if liked.get() { "♥" } else { "♡" }).text_size(px(22.0))),
                ),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const liked = signal(false);
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#8250df" }} />
        <Text style={{ flex: 1, fontSize: 16 }}>A card</Text>
        <View onPress={() => liked.set(!liked())} activeStyle={{ opacity: 0.5 }} hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{liked() ? "♥" : "♡"}</Text>
        </View>
      </View>
    </View>
  );
}

mount(App);
```

## Layout

एक view अपने चाइल्ड को flexbox से लेआउट करता है, इन डिफ़ॉल्ट मानों के साथ: `flexDirection: "column"`, `flexShrink: 0`, `alignContent: "flex-start"`, `position: "relative"`। `display: "grid"` (Rust में `.grid()`) CSS grid पर स्विच करता है और `display: "block"` block लेआउट पर। साइज़ पॉइंट में होते हैं। देखें [layout](../docs/layout.md) और [style reference](../modules/style-reference.md)।

`display: "flex"` CSS का अनुसरण करता है: style में, `flex` क्लास के रूप में और Rust के `.flex()` में, यह एक row होता है जब तक कि कोई direction सेट न हो (`flexDirection: "column"`, `flex-col`, `.flex_col()`)। जो view कोई display सेट नहीं करता, वह अपने चाइल्ड को column में रखता है।

## Props

`View` का अपना एक ही prop है, `selectable` (Rust में `.selectable(true)`): view के अंदर के टेक्स्ट एक साथ, एक ही selection के रूप में सेलेक्ट होते हैं ([Text selection](./text-selection.md))। बाकी सब [common props](./index.md#common-props) हैं: इसके styles (`style`, `class`, `classList`; Rust में `Styled` मेथड), `disabled`, press props (`onPress`, `onLongPress`, `onPressDown`, `onPressUp`, `delayLongPress`, `hitSlop`), state styles (`activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`), `onMouseEnter` / `onMouseMove` / `onMouseLeave`, `onContextMenu`, `onFileDragEnter` / `onFileDragLeave` / `onFileDrop`, `focusable`, `onLayout`, `ref`, `nativeID`, `testID`, gesture props (`pan`, `pinch`, `rotation` और उनके events), touch और responder props, accessibility props और `ios` / `android` / `desktop`।

## Selectable views

`selectable` के साथ, selection view के अंदर मौजूद [`Text`](./text.md) elements और [`TextView`](./text-view.md) पर पढ़ने के क्रम में चलता है; `selectable={false}` वाले टेक्स्ट इससे बाहर रहते हैं, और किसी दूसरे के अंदर मौजूद selectable view बाहरी view का हिस्सा होता है। हर प्लेटफ़ॉर्म पर जेस्चर के लिए [Text selection](./text-selection.md) देखें।

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

## Press feedback

Pressable view वह कोई भी view है जिसमें press handler हो। इसका फ़ीडबैक ऐप का अपना होता है: दबे होने के दौरान एक style, जो उँगली नीचे रहने तक नेटिव रूप से लागू होती है, ऐप के कोड तक किसी round trip के बिना। `hoverStyle`, `focusStyle` और `disabledStyle` बाकी states के लिए यही करते हैं:

```rust tabs
// Fade the whole view.
view().on_press(open).active(|s| s.opacity(0.6))

// Show a background; group_active styles the children.
view()
    .group()
    .on_press(open)
    .active(|s| s.bg(rgb(0xe5e7eb)))
    .child(text("Open").group_active(|s| s.opacity(0.7)))

// Change any style while pressed.
view().on_press(open).bg(rgb(0x2563eb)).active(|s| s.bg(rgb(0x1e40af)).scale(0.95))
```

```tsx tabs
// Fade the whole view.
<View onPress={open} activeStyle={{ opacity: 0.6 }}>…</View>

// Show a background; group-active: styles the children.
<View onPress={open} class="group" activeStyle={{ backgroundColor: "#e5e7eb" }}>
  <Text class="group-active:opacity-70">Open</Text>
</View>

// Change any style while pressed with active: classes.
<View onPress={open} class="bg-blue-600 active:bg-blue-800 active:scale-95">…</View>
```

Android पर, `android={{ ripple: { color: "#0000001f" } }}` (Rust में `.ripple(Ripple { .. })`) material ripple जोड़ता है (`borderless`, `radius` और `foreground` इसे समायोजित करते हैं)।

`disabled` नेटिव view से press listeners हटा देता है (न press, न फ़ीडबैक) और disabled styles लागू करता है:

```rust tabs
view()
    .on_press(submit)
    .disabled(move || !valid.get())
    .bg(rgb(0x16a34a))
    .disabled_style(|s| s.opacity(0.4))
```

```tsx tabs
<View onPress={submit} disabled={!valid()} class="bg-green-600 disabled:opacity-40">…</View>
```

## Events

| Event | Rust | Payload | कब |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent` (Rust में कोई नहीं) | view के अंदर एक tap समाप्त हुआ। |
| `onLongPress` | `.on_long_press` | `PressEvent` (Rust में कोई नहीं) | उँगली `delayLongPress` (500 ms) तक नीचे रही। |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent` (Rust में कोई नहीं) | उँगली नीचे गई / उठी या बाहर चली गई। |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | माउस view (या उसके अंदर के किसी view) के ऊपर आया / उससे या विंडो से बाहर गया ([hover](./index.md#hover)); `onMouseLeave` वाला वह स्थान है जहाँ वह आखिरी बार था। |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | माउस view (या उसके अंदर के किसी view) के ऊपर हिला, बटन दबे होने के साथ या बिना, या कोई modifier key दबाई या छोड़ी गई जबकि माउस वहाँ बिना किसी बटन के टिका है: `position`, `pagePosition` (`Point`s), `modifiers` और `pressedButton` (`"left"`, `"right"`, `"middle"`, `"back"`, `"forward"` या `null`); प्रति फ़्रेम अधिकतम एक बार। |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | view के ऊपर secondary बटन दबाया गया ([context menus](./index.md#context-menus))। |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | कोई नहीं | लोकल फ़ाइल का drag सक्रिय डेस्कटॉप destination में आया / उससे बाहर गया। |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }` (`FileDropEvent`) | डेस्कटॉप destination पर लोकल फ़ाइलें या डायरेक्टरी drop की गईं। |
| `onLayout` | `.on_layout` | `{ bounds }` (`Bounds<Points>`) | पैरेंट के सापेक्ष फ़्रेम बदल गया। |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | `pan` से बाँधा गया drag शुरू / समाप्त हुआ; सिस्टम द्वारा रद्द किए जाने पर `cancelled` true होता है। |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | `pinch` से बाँधा गया pinch शुरू / समाप्त हुआ। |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | `rotation` से बाँधा गया rotation शुरू / समाप्त हुआ। |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | एक custom accessibility action चली। |

Touch और responder events: देखें [common props](./index.md#raw-touches-and-the-responder-system)।

## Desktop file drops

AppKit, GTK, Win32 और GPUI पर, `onFileDrop` वाला view किसी दूसरे एप्लिकेशन से खींची गई लोकल फ़ाइलें और डायरेक्टरी प्राप्त करता है। `onFileDragEnter` और `onFileDragLeave` सक्रिय destination को ट्रैक करते हैं; `onFileDrop` नेटिव फ़ाइल-सूची के क्रम में `{ uris: string[] }` प्राप्त करता है। हर एंट्री एक absolute `file:` URL है जिसमें स्पेस और non-ASCII अक्षर escape किए गए होते हैं। फ़ाइलसिस्टम पाथ पाने के लिए URL को पार्स करें, prefix को हाथ से हटाने के बजाय।

```rust tabs
let hovering = signal(false);
let files = signal(Vec::<String>::new());

view()
    .min_h(px(160.0))
    .p_6()
    .on_file_drag_enter(move || hovering.set(true))
    .on_file_drag_leave(move || hovering.set(false))
    .on_file_drop(move |event: &FileDropEvent| {
        files.set(event.uris.clone());
        hovering.set(false);
    })
    .child(text(move || if hovering.get() { "Release files here" } else { "Drop files here" }))
    .child(text(move || files.get().join("\n")))
```

```tsx tabs
const hovering = signal(false);
const files = signal<string[]>([]);

<View
  onFileDragEnter={() => hovering.set(true)}
  onFileDragLeave={() => hovering.set(false)}
  onFileDrop={(event) => {
    files.set(event.uris);
    hovering.set(false);
  }}
  style={{ minHeight: 160, padding: 24 }}
>
  <Text>{hovering() ? "Release files here" : "Drop files here"}</Text>
  <Text>{files().join("\n")}</Text>
</View>
```

`onFileDrop` को सुनने वाला निकटतम enabled ancestor drop प्राप्त करता है। modal root इस खोज की सीमा तय करता है। `disabled` फ़ाइल-drag/drop listeners हटा देता है; बाहर जाना, रद्द होना, पूरा होना और destination का हटाया जाना सक्रिय स्थिति को साफ़ कर देते हैं। स्वीकृति Copy ऑपरेशन और mounted नेटिव state का उपयोग करती है। प्राप्त फ़ाइलों को पढ़ना, खोलना या ट्रांसफ़र करना है या नहीं, यह ऐप तय करता है।

## Ref methods

एक सामान्य view का ref `ViewRef` होता है: `focus()`, `blur()` और `measure()`। `ref` (Rust में `.element_ref(&handle)`) आपको इसका node देता है, जैसे `setAccessibilityFocus` को पास करने के लिए ([`nsh` की accessibility API](../modules/nsh.md#accessibility)), या इसे मापने के लिए (Rust में `handle.measure()`)।

## Views inside text

टेक्स्ट के अंदर रखा गया view एक inline attachment होता है: यह baseline पर बैठता है, शब्दों के साथ wrap होता है, और अपने खुद के प्रेस लेता है। देखें [text](./text.md#inline-views-and-images)।

## Platform notes

- `boxShadow` हर प्लेटफ़ॉर्म पर बनता है; `android={{ elevation }}` इसके बजाय Android का material shadow देता है। Android पर शैडो के लिए बैकग्राउंड कलर ज़रूरी है (पारदर्शी बैकग्राउंड वाला view कोई शैडो नहीं डालता)।
- views पर `filter`: iOS `opacity()`, 1 तक `brightness()` और `drop-shadow()` को सपोर्ट करता है (images सभी कलर फ़िल्टर और `blur()` लेती हैं); Android इन सभी को API 31 से सपोर्ट करता है, और उससे नीचे कलर फ़िल्टर।
- `backdropFilter: "blur(…)"` iOS पर एक सिस्टम material है (एक अनुमान) और Android पर API 31 चाहिए।
- Android `translate`, `scale` और `rotate` transforms बनाता है; skews (`skew()`, `skewX()`, `skewY()`) बाकी प्लेटफ़ॉर्म पर लागू होते हैं।
- `borderCurve: "continuous"` (`.border_curve(BorderCurve::Continuous)`) ऐसे कोने बनाता है जो किनारों में घुल जाते हैं (जैसे iOS ऐप आइकन), दोनों प्लेटफ़ॉर्म पर।
- `cursor` style वहाँ लागू होती है जहाँ पॉइंटर हो (Mac Catalyst, पॉइंटर वाला iPad, डेस्कटॉप)।
