---
title: "Button"
description: "Button कॉम्पोनेंट: एक प्रेस टारगेट जो प्रेस, disabled और selected स्थितियों तथा स्क्रीन रीडर के लिए अपनी भूमिका (role) को संभालता है, और जिसकी स्टाइलिंग ऐप द्वारा की जाती है।"
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---

# Button

Button एक press target है। व्यवहार इसी का है: presses, ऐप की state styles के ज़रिए press feedback, disabled और selected states, कीबोर्ड फ़ोकस, और स्क्रीन रीडर के लिए इसकी role। रूप-रंग ऐप का है: `Button` के अपने कोई colors, sizes, paddings या label नहीं होते, इसलिए आप जो styles और children देते हैं, उनके आधार पर एक ही component primary button, icon button, tab, toolbar toggle या list की row बन जाता है।

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn counter() -> impl IntoElement {
    let count = signal(0_u32);
    button()
        .on_press(move || count.update(|n| *n += 1))
        .self_center()
        .px_5()
        .py_3()
        .rounded_xl()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .child(
            text(move || format!("Pressed {}", count.get()))
                .text_color(white())
                .font_weight(FontWeight::SEMIBOLD),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button } from "nsh/base";

function App() {
  const count = signal(0);
  return (
    <Button
      onPress={() => count.update((n) => n + 1)}
      class="self-center rounded-xl bg-blue-600 px-5 py-3 active:bg-blue-700"
    >
      <Text class="text-base font-semibold text-white">{`Pressed ${count()}`}</Text>
    </Button>
  );
}

mount(App);
```

`Button` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। TSX में इसका रूप `class` और `style` से तय होता है, और state variants हैं `active:`, `hover:`, `focus:`, `selected:` और `disabled:` (या इनके अनुरूप `activeStyle`, `hoverStyle`, `focusStyle`, `selectedStyle` और `disabledStyle`)। Rust में `button()` उसी तरह Button बनाता है जैसे `view()` view बनाता है: हर prop के लिए एक setter (`.disabled(..)`, `.selected(..)`), हर event के लिए एक listener (`.on_press(..)`), रूप के लिए typed style methods (`.px_4()`, `.bg(..)`), states के लिए state methods (`.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)`, `.disabled_style(..)`) और content के लिए `.child(..)`।

<a id="props"></a>

## प्रॉप्स

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई press नहीं और कोई press feedback नहीं; `disabled:` styles लागू होती हैं और स्क्रीन रीडर इसे dimmed बताते हैं। |
| `selected` | `.selected(..)` | `boolean` | `false` | Selected: चालू toggle, मौजूदा tab। स्क्रीन रीडर यह बताते हैं। वैल्यू ऐप के पास रहती है और ऐप ही इसे style करता है। |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | कोई नहीं | वह style जब `selected` हो और disabled न हो, `selected:` classes के रूप में। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | जब content काफ़ी न हो, जैसे icon के मामले में, तब स्क्रीन रीडर क्या बोलें। |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | जब कोई `nsh/base` component वह control न हो, तब स्क्रीन रीडर के लिए यह क्या है: `"link"` (यह URL खोलता है), ... |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | कोई नहीं | इसकी सीमाओं के बाहर कितनी दूर तक presses अब भी गिने जाते हैं, points में: सभी तरफ़ के लिए एक संख्या, या नाम देकर अलग-अलग तरफ़ें। जैसा view के `hitSlop` में होता है। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | Content: text, icon, कोई भी layout। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | इसका रूप, पूरा का पूरा। |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | कोई नहीं | pressed, hovered, focused या disabled होने पर लागू style, `<state>:` classes के रूप में। बाद वाली states जीतती हैं; `disabled` सब पर भारी है। |

Rust में हर prop एक setter है जो value, signal या closure लेता है; जो props आप छोड़ देते हैं वे अपने डिफ़ॉल्ट पर रहते हैं:

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

<a id="events"></a>

## इवेंट्स

| Event | Rust | विवरण |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | Button दबाया गया: tap, click, कीबोर्ड फ़ोकस होने पर Return या Space, या स्क्रीन रीडर का activation। |
| `onPressDown` | `.on_press_down(\|\| ..)` | इस पर press शुरू हुआ। |
| `onPressUp` | `.on_press_up(\|\| ..)` | Press समाप्त हुआ: छोड़ा गया, हटा लिया गया या रद्द हुआ। |

`onPressDown` और `onPressUp` आपके अपने press feedback के लिए हैं, जैसे spring या highlight, जिसे state styles व्यक्त नहीं कर पातीं। Disabled button इनमें से कुछ भी report नहीं करता।

## Styling

Button का रूप आपके ऐप का है: primary या secondary button क्या है, यह ऐप तय करता है। छोटे components की एक जोड़ी इस निर्णय को एक ही जगह रखती है:

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

/// A filled button, darker while pressed.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .active(|s| s.bg(rgb(0x1d4ed8)))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(label).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// An outlined button.
fn secondary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .px_4()
        .py_3()
        .border_1()
        .border_color(rgb(0xd4d4d4))
        .hover(|s| s.bg(rgb(0xfafafa)))
        .active(|s| s.bg(rgb(0xf5f5f5)))
        .child(text(label).text_color(rgb(0x171717)))
}
```

```tsx tabs
import { Text } from "nsh";
import { Button } from "nsh/base";

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      onPress={props.onPress}
      disabled={props.disabled}
      class="items-center rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700 disabled:opacity-40"
    >
      <Text class="font-semibold text-white">{props.label}</Text>
    </Button>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  return (
    <Button
      onPress={props.onPress}
      class="items-center rounded-lg border border-neutral-300 px-4 py-3 active:bg-neutral-100 hover:bg-neutral-50"
    >
      <Text class="text-neutral-900">{props.label}</Text>
    </Button>
  );
}
```

State variants native रूप से लागू होते हैं: press पर button main thread पर गहरा हो जाता है, बिना JS या Rust चले। Rust में state methods वही variants हैं: `.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)` और `.disabled_style(..)` button की अपनी states का अनुसरण करते हैं। आपकी theme के colors भी इसी तरह काम करते हैं: TSX में `bg-primary`, Rust में `theme().primary` ([Theme tokens](../docs/tailwind.md#theme-tokens) देखें)।

## Disabled

Disabled button कोई press नहीं लेता और कोई feedback नहीं देता, और स्क्रीन रीडर इसे dimmed बताते हैं। Disabled होने पर इसका रूप आपका है, `disabled:` classes या `disabledStyle` के साथ:

```rust tabs
fn save(saving: Signal<bool>) -> impl IntoElement {
    button()
        .disabled(saving)
        .on_press(move || saving.set(true))
        .rounded_lg()
        .px_4()
        .py_3()
        .bg(rgb(0x2563eb))
        .disabled_style(|s| s.opacity(0.4))
        .child(text("Save").text_color(white()))
}
```

```tsx tabs
<Button disabled={saving()} onPress={save} class="rounded-lg bg-blue-600 px-4 py-3 disabled:opacity-40">
  <Text class="text-white">Save</Text>
</Button>
```

<a id="a-toggle-with-selected"></a>

## selected के साथ Toggle

`selected` button को toggle बना देता है: toolbar का bold button, filter chip, मौजूदा tab। वैल्यू ऐप रखता है, इसे `onPress` में पलटता है और selected state को style करता है; स्क्रीन रीडर button को selected बताते हैं।

```rust tabs
fn bold(on: Signal<bool>) -> impl IntoElement {
    button()
        .selected(on)
        .accessibility_label("Bold")
        .on_press(move || on.update(|on| *on = !*on))
        .size(px(40.0))
        .items_center()
        .justify_center()
        .rounded_md()
        .selected_style(|s| s.bg(rgb(0xdbeafe)))
        .child(text("B").font_weight(FontWeight::BOLD))
}
```

```tsx tabs
<Button
  selected={bold()}
  onPress={() => bold.set(!bold())}
  accessibilityLabel="Bold"
  class="size-10 items-center justify-center rounded-md selected:bg-blue-100"
>
  <Text class="font-bold">B</Text>
</Button>
```

Tabs की पंक्ति [`Tabs`](./tabs.md) है और on / off control [`Switch`](./switch.md) है, जो `nsh/base` से आते हैं: ये अपनी तरह की role, selected state और कीबोर्ड व्यवहार खुद संभालते हैं, जो `role="tab"` या `role="switch"` वाला `Button` नहीं करता।

<a id="a-small-target-with-hitslop"></a>

## hitSlop के साथ छोटा target

Icon button उँगली से छोटा हो सकता है। `hitSlop` इसके पास पड़ने वाले presses को गिनता है, हर तरफ़ के आगे points में, इसके layout या रूप को बदले बिना: सभी तरफ़ के लिए एक संख्या, या नाम देकर अलग-अलग तरफ़ें (`{ top: 8, bottom: 8 }`), जैसे [view का `hitSlop`](./index.md#presses-and-feedback) इन्हें लेता है।

```rust tabs
fn close(open: Signal<bool>) -> impl IntoElement {
    button()
        .hit_slop(EdgeInsets::all(px(12.0)))
        .accessibility_label("Close")
        .on_press(move || open.set(false))
        .size(px(20.0))
        .items_center()
        .justify_center()
        .child(text("×"))
}
```

```tsx tabs
<Button hitSlop={12} accessibilityLabel="Close" onPress={() => open.set(false)} class="size-5 items-center justify-center">
  <Text>×</Text>
</Button>
```

## Accessibility

- स्क्रीन रीडर के लिए button एक ही element है, जिसकी role `"button"` है, जब तक `role` कुछ और न कहे। इसका label इसका text content है; जब content icon हो या बहुत कम कहता हो, तब `accessibilityLabel` दें।
- `disabled` और `selected` उसी तरह घोषित होते हैं जैसे प्लेटफ़ॉर्म उन्हें घोषित करता है (VoiceOver, TalkBack, UI Automation, ब्राउज़र का accessibility tree)।
- macOS और web पर button कीबोर्ड फ़ोकस का एक पड़ाव है: Tab इस तक पहुँचता है, Return और Space इसे दबाते हैं, और `focus:` styles दिखाती हैं कि फ़ोकस कहाँ है।

Labels, roles और announcements के बारे में सामान्य जानकारी के लिए [Accessibility](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- iOS, Android और Mac Catalyst: press वह tap है जो button पर समाप्त होता है; दूर हटने पर वह रद्द हो जाता है, जैसा सिस्टम के अपने buttons में होता है।
- Desktops (macOS, Windows, Linux, GPUI) और web: press एक click है। macOS और web पर Return और Space भी उस button को दबाते हैं जिस पर कीबोर्ड फ़ोकस है। `hover:` styles माउस या trackpad के pointer के नीचे लागू होती हैं।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप style करता है: press feedback `active:` / `activeStyle` या आपका अपना animation है।
