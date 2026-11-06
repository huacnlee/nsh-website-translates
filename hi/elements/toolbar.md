---
title: "Toolbar"
description: "Toolbar, ToolbarGroup और ToolbarSeparator: बटनों, टॉगल और लिंक्स का एक बार, जो कीबोर्ड फ़ोकस का एक ही पड़ाव होता है और जिसमें ऐरो कीज़ उसके साथ-साथ आगे-पीछे चलती हैं; इसमें नामित ग्रुप और सेपरेटर शामिल हैं। हर कंट्रोल का रूप और उसकी स्थिति ऐप के हाथ में होती है।"
group: base
demo: el-toolbar
source_hash: 4c5547977ec8d003
---

# Toolbar

टूलबार नियंत्रणों की एक पट्टी है: टेक्स्ट एडिटर की फ़ॉर्मैटिंग, मीडिया प्लेयर के ट्रांसपोर्ट नियंत्रण, या टूल्स का वर्टिकल पैलेट।
`Toolbar` इसका कीबोर्ड और सिमैंटिक्स संभालता है: स्क्रीन रीडर टूलबार की घोषणा करते हैं (इसे `accessibilityLabel` से नाम मिलता है), और कीबोर्ड एक ही स्टॉप में इस तक पहुँचता है और इसके `axis` की ऐरो कीज़ से इसके आइटमों के बीच चलता है। इसके आइटम वे `Button`, `Toggle` और `Link` हैं जो इसके भीतर, किसी भी गहराई पर हों। `ToolbarGroup` संबंधित आइटमों का एक नामित समूह है (undo और redo, अलाइनमेंट), और `ToolbarSeparator` वह रेखा है जिसे ऐप समूहों के बीच खींचता है। रूप-रंग ऐप का अपना है: टूलबार के अपने कोई रंग, पैडिंग या गैप नहीं होते, और हर नियंत्रण अपनी स्थिति खुद रखता है।

```rust tabs
use nsh_base::{button, theme, toggle, toolbar, toolbar_group, toolbar_separator};
use nsh_core::prelude::*;

fn formatting() -> impl IntoElement {
    let bold = signal(false);
    toolbar()
        .accessibility_label("Formatting")
        .items_center()
        .gap_1()
        .child(
            toolbar_group()
                .accessibility_label("History")
                .child(button().accessibility_label("Undo").size_8().child(text("↶")))
                .child(button().accessibility_label("Redo").size_8().child(text("↷"))),
        )
        .child(toolbar_separator().w(px(1.0)).h_5().bg(move || theme().border))
        .child(
            toggle()
                .pressed(bold)
                .accessibility_label("Bold")
                .on_change(move |pressed: &bool| bold.set(*pressed))
                .size_8()
                .items_center()
                .justify_center()
                .pressed_style(|s| s.bg(move || theme().accent))
                .child(text("B")),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Button, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator } from "nsh/base";

function App() {
  const bold = signal(false);
  return (
    <Toolbar accessibilityLabel="Formatting" class="items-center gap-1 self-start rounded-lg bg-muted p-1">
      <ToolbarGroup accessibilityLabel="History">
        <Button accessibilityLabel="Undo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↶</Text>
        </Button>
        <Button accessibilityLabel="Redo" class="size-8 items-center justify-center rounded-md hover:bg-accent">
          <Text>↷</Text>
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator class="h-5 w-px bg-border" />
      <Toggle
        pressed={bold()}
        accessibilityLabel="Bold"
        onChange={({ pressed }) => bold.set(pressed)}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>B</Text>
      </Toggle>
    </Toolbar>
  );
}

mount(App);
```

`Toolbar`, `ToolbarGroup` और `ToolbarSeparator` [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` crate है। टूलबार कोई मान नहीं रखता: इसके भीतर के toggle को बताया जाता है कि वह दबा हुआ है या नहीं और वह `onChange` रिपोर्ट करता है, बटन `onPress` रिपोर्ट करता है, और स्थिति ऐप रखता है। Rust में `toolbar()`, `toolbar_group()` और `toolbar_separator()` इन्हें बनाते हैं, हर prop के लिए एक setter (`.axis(..)`, `.disabled(..)`), टाइप्ड स्टाइल मेथड और इनकी सामग्री के लिए `.child(..)` के साथ।

## Props

<a id="toolbar-1"></a>

### Toolbar

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | वह दिशा जिसमें इसके आइटम चलते हैं: उसके अनुसार चलने वाली ऐरो कीज़ (Left और Right, या Up और Down) और वह दिशा जिसमें यह अपने चाइल्ड लेआउट करता है (पंक्ति, या स्तंभ)। इसे टूलबार बनते समय पढ़ा जाता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | टूलबार का हर आइटम disabled हो जाता है, चाहे उसका अपना `disabled` कुछ भी हो: कोई प्रेस नहीं, कीबोर्ड फ़ोकस का कोई स्टॉप नहीं, और स्क्रीन रीडर के लिए धुँधला (dimmed)। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर टूलबार को किस नाम से पुकारते हैं ("Formatting"), ऐसे पेज के लिए जिसमें एक से अधिक टूलबार हों। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | आइटम, उनके समूह और विभाजक, और बाकी सब कुछ जिसे ऐप उनके बीच लेआउट करता है (शीर्षक, स्पेसर, इनपुट)। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पट्टी का लेआउट और रूप: अलाइनमेंट, गैप, पैडिंग, इसकी सतह। |

### ToolbarGroup

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | समूह का हर आइटम disabled हो जाता है, चाहे उसका अपना `disabled` कुछ भी हो। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर समूह को किस नाम से पुकारते हैं ("History", "Alignment")। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | समूह के आइटम, और बाकी सब कुछ जिसे ऐप उनके बीच लेआउट करता है। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | समूह का लेआउट और रूप। यह टूलबार की धुरी (axis) के साथ चलता है। |

### ToolbarSeparator

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | कोई नहीं | रेखा: पंक्ति (`h-5 w-px bg-border`) या स्तंभ (`h-px self-stretch bg-border`) के आर-पार एक बारीक रेखा। |

## Items

टूलबार के आइटम इसके भीतर के `Button`, `Toggle` और `Link` हैं, चाहे वे इसके समूहों में हों या इसके भीतर के [`ToggleGroup`](./toggle.md) में। [`Menu`](./menu.md) या [`Popover`](./popover.md) का ट्रिगर भी एक आइटम है: उसके `trigger` स्लॉट का व्यू, जिसे popup अपने प्रेस, अपना फ़ोकस और अपनी `expanded` स्थिति देता है। जो टूल ऐप खुद बनाता है, वह ऐप की अपनी क्लासेज़ वाला `Button` है: `Button` का अपना कोई रूप नहीं होता, इसलिए वह वैसा ही दिखता है जैसा ऐप उसे स्टाइल करता है, और वह एक आइटम है (`onPress` वाला `View` अपना अलग स्टॉप बना रहता है, ऐरो कीज़ से बाहर)। टूलबार के भीतर का `ToggleGroup` उसके समूहों में से एक है: उसके toggle टूलबार के आइटम हैं, स्क्रीन रीडर एक समूह सुनाते हैं, और उसका `disabled` फिर भी उसके अपने toggle को disable करता है। अन्य नियंत्रण (`Input`, `Select`, `Slider`) अपने अलग स्टॉप बने रहते हैं और अपनी ऐरो कीज़ रखते हैं; उन्हें पट्टी के अंत में रखें। किसी आइटम द्वारा खोला गया popup जो कुछ दिखाता है (popover के फ़ील्ड और बटन, menu के आइटम, hover card के लिंक) वह टूलबार का हिस्सा नहीं है। ऐरो कीज़ आइटमों से उसी क्रम में गुज़रती हैं जिसमें पट्टी उन्हें लेआउट करती है, चाहे हर आइटम कितनी भी गहराई पर हो, और जिस आइटम को ऐप बाद में दिखाता है वह उनके बीच अपनी जगह ले लेता है।

## Parts

| Part | Inside | Styled with | States |
|---|---|---|---|
| पट्टी | | `Toolbar` के `class`, `style` | |
| समूह | पट्टी | `ToolbarGroup` के `class`, `style` | |
| विभाजक | पट्टी, समूह | `ToolbarSeparator` के `class`, `style` | |
| आइटम | पट्टी, समूह | आइटम के अपने `class`, `style` | इसकी अपनी: `aria-pressed:`, `disabled:`, `hover:`, `focus:`, `active:` |

जिस आइटम पर कीबोर्ड है उसे `focus:` स्टाइल से दिखाएँ, और दबे हुए toggle को उसकी अपनी सतह से (देखें [Design guides](../docs/design-guides.md#interaction-states))।

## Vertical

टूल्स का पैलेट एक स्तंभ है: `axis="vertical"` आइटमों को ऊपर से नीचे लेआउट करता है, और Up और Down उनके साथ चलते हैं।

```tsx
<Toolbar axis="vertical" accessibilityLabel="Tools" class="gap-1 self-start rounded-lg bg-muted p-1">
  <Each of={["select", "pen", "shape", "text"]}>
    {(t) => (
      <Toggle
        pressed={tool() === t()}
        accessibilityLabel={t()}
        onChange={({ pressed }) => pressed && tool.set(t())}
        class="size-8 items-center justify-center rounded-md aria-pressed:bg-accent"
      >
        <Text>{t()[0].toUpperCase()}</Text>
      </Toggle>
    )}
  </Each>
</Toolbar>
```

## Disabled

टूलबार पर `disabled` उसके हर आइटम को disable कर देता है, यानी ऐसी पट्टी जिसे ऐप लॉक करता है; समूह पर यह उस समूह के आइटमों को disable करता है। disabled आइटम कोई प्रेस नहीं लेता, ऐरो कीज़ उसे छोड़कर आगे बढ़ जाती हैं, और स्क्रीन रीडर उसे धुँधला (dimmed) बताते हैं:

```tsx
<Toolbar disabled={readonly()} accessibilityLabel="Review" class="flex-row gap-1">
  <Button onPress={approve} class="h-8 px-3 disabled:opacity-50">
    <Text>Approve</Text>
  </Button>
</Toolbar>
```

## Accessibility

- `Toolbar` की भूमिका (role) `"toolbar"` है, जिसे `accessibilityLabel` नाम देता है; इसके आइटम अपने अलग एलिमेंट बने रहते हैं। iOS पर टूलबार एक सिमैंटिक समूह है जिसमें VoiceOver प्रवेश करता है।
- `ToolbarGroup` की भूमिका `"group"` है, जिसे इसका `accessibilityLabel` नाम देता है, ताकि आइटमों की एक शृंखला एक इकाई की तरह पढ़ी जाए। टूलबार के भीतर का `ToggleGroup` भी एक समूह है।
- `ToolbarSeparator` स्क्रीन रीडर के लिए कोई एलिमेंट नहीं है।
- `disabled` की घोषणा वैसे ही होती है जैसे प्लेटफ़ॉर्म उसकी घोषणा करता है (VoiceOver, TalkBack, UI Automation, ब्राउज़र का accessibility tree)।

लेबल, भूमिकाओं और घोषणाओं की सामान्य जानकारी के लिए [Accessibility](../docs/accessibility.md) देखें।

## Keyboard

macOS और वेब पर, जहाँ Tab उन व्यू तक पहुँचता है जो प्रेस लेते हैं, `Toolbar` [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) का पालन करता है:

| Key | What it does |
|---|---|
| Tab, Shift+Tab | टूलबार में उस आइटम पर प्रवेश करता है जिसे फ़ोकस ने आख़िरी बार छोड़ा था (शुरू में, पहला आइटम जो disabled नहीं है), और एक ही चरण में इससे बाहर निकल जाता है। |
| Right, Left (`axis="horizontal"`) | फ़ोकस को अगले या पिछले आइटम पर ले जाता है, आख़िरी से पहले पर और वापस। |
| Down, Up (`axis="vertical"`) | फ़ोकस को अगले या पिछले आइटम पर ले जाता है, आख़िरी से पहले पर और वापस। |
| Home, End | फ़ोकस को पहले या आख़िरी आइटम पर ले जाता है। |
| Space, Return | फ़ोकस वाले आइटम को दबाता है। |

ऐरो कीज़ disabled आइटमों को छोड़ देती हैं और कुछ नहीं दबातीं: toggle तभी बदलता है जब उसे दबाया जाए। ऐरो की दूसरी जोड़ी आइटमों के लिए छोड़ दी जाती है (menu का ट्रिगर Down से अपना menu खोलता है)। right-to-left लेआउट में क्षैतिज टूलबार दाईं ओर से चलता है, इसलिए Left अगले आइटम पर और Right पिछले आइटम पर जाता है; वर्टिकल टूलबार में Down और Up वैसे ही रहते हैं।

## Platform notes

- iOS, Android और Mac Catalyst: हर आइटम टैप से दबाया जाता है; टूलबार एक समूह है जिसकी घोषणा स्क्रीन रीडर करते हैं।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: प्रेस एक क्लिक है। macOS और वेब पर टूलबार Tab का एक ही स्टॉप है, और ऐरो कीज़, Home और End इसके आइटमों के बीच चलते हैं ([Keyboard](#keyboard))।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करता है: पट्टी, उसके समूह, उसके विभाजक और उसके आइटम।
