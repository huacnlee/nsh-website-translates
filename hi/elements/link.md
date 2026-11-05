---
title: "Link"
description: "Link कॉम्पोनेंट: ऐसा कंटेंट जो दबाने पर कहीं ले जाता है, जैसे कोई पेज, कोई साइट या ऐप का कोई रूट। इसमें प्रेस, कीबोर्ड एक्टिवेशन, disabled स्टेट और स्क्रीन रीडर के लिए link रोल शामिल हैं, और इसकी स्टाइलिंग ऐप द्वारा की जाती है।"
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---

# Link

Link उपयोगकर्ता को कहीं ले जाता है: किसी वेब पेज पर, किसी दूसरे ऐप (`mailto:`, `tel:`) में, या ऐप की ही किसी स्क्रीन पर। व्यवहार इसी का होता है: प्रेस, कीबोर्ड फ़ोकस मिलने पर Return और Space, disabled स्थिति, और स्क्रीन रीडर के लिए link role। रूप-रंग ऐप का होता है: `Link` का अपना कोई रंग, underline या लेबल नहीं होता, और जो दिखता है वह उसके children ही हैं। `href` बताता है कि वह कहाँ जाता है; यह खोलने के लिए डेटा है, स्क्रीन पर दिखने वाला टेक्स्ट कभी नहीं।

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

`Link` [`nsh/base`](../modules/nsh-base.md) से आता है, जो Rust में `nsh-base` crate है। Rust में `link()` एक ऐसा link बनाता है जिसमें हर prop के लिए एक setter (`.href(..)`, `.open_with(..)`), हर event के लिए एक listener (`.on_open(..)`, `.on_press(..)`), link के लिए typed style methods और उसकी सामग्री के लिए `.child(..)` होता है।

<a id="opening"></a>

## खोलना

प्रेस, क्लिक, या फ़ोकस वाले link पर Return या Space उसका `href` खोलता है:

1. `onOpen({ href })` बताता है कि वह कहाँ जाता है।
2. `openWith="system"` (डिफ़ॉल्ट) के साथ, किसी दूसरे ऐप या साइट का URL, यानी scheme वाला URL (`https:`, `mailto:`, `tel:`, या किसी दूसरे ऐप द्वारा रजिस्टर किया गया scheme), ऐप के बाहर खुलता है, ठीक वैसे जैसे [`openUrl`](../modules/nsh.md) उसे खोलता है: पहले embedding ऐप का router उसे लेता है, फिर सिस्टम। कोई भी अन्य `href`, यानी ऐप का अपना path (`/orders/42`) या `#anchor`, रिपोर्ट किया जाता है और ऐप के पास ही रहता है।
3. `onPress()` प्रेस की रिपोर्ट देता है।

`openWith="app"` के साथ, ऐप का `onOpen` handler ही तय करता है कि link कैसे खुले: उसका अपना कोई route, in-app web view में कोई पेज, या पहले कोई पुष्टि।

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

जब ऐप `nsh.json` (`"openUrl": true`, या `{ "schemes": ["https", "mailto"] }`) में capabilities घोषित करता है, तब ऐप के बाहर URL खोलने के लिए `openUrl` capability चाहिए।

## Props

| Prop | Rust | Type | Default | विवरण |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | none | link कहाँ जाता है: कोई URL, या ऐप का अपना path। `onOpen` के साथ रिपोर्ट होता है, कभी दिखाया नहीं जाता। |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | `href` को कौन खोलता है: सिस्टम किसी दूसरे ऐप या साइट का URL खोलता है; `"app"` इसे `onOpen` पर छोड़ देता है। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई प्रेस नहीं, प्रेस फ़ीडबैक नहीं, कीबोर्ड फ़ोकस नहीं; `disabled:` styles लागू होते हैं, और स्क्रीन रीडर बताते हैं कि यह dimmed है। |
| `current` | `.current(..)` | `boolean` | `false` | उस पेज का link जिस पर उपयोगकर्ता है, किसी navigation या breadcrumb में: स्क्रीन रीडर बताते हैं कि यह वर्तमान पेज है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | none | स्क्रीन रीडर क्या बोलें, जब सामग्री बहुत कम बताती हो (जैसे कोई icon)। |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | none | इसकी सीमाओं के बाहर कितनी दूर तक प्रेस अब भी गिने जाते हैं, points में: सभी तरफ़ के लिए एक संख्या, या नाम वाली तरफ़ें। जैसा view के `hitSlop` में होता है। |
| `children` | `.child(..)` | `JSX.Element` | none | सामग्री: कोई लेबल, कोई icon, ऐप जो भी दिखाए। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | none | link का रूप: उसका रंग, underline, padding; टेक्स्ट प्रॉपर्टीज़ उसके अंदर के texts तक पहुँचती हैं। |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | none | pressed, hovered, focused या disabled होने पर link की style, `<state>:` classes की तरह। |

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | link `href` खोलता है: `openWith="app"` के साथ handler उसे खोलता है, `"system"` के साथ वह सुनता है कि सिस्टम से क्या खोलने को कहा गया। यह `onPress` से पहले आता है। |
| `onPress` | `.on_press(\|\| ..)` | link को दबाया गया: tap, क्लिक, या कीबोर्ड फ़ोकस होने पर Return या Space। |

Disabled link कुछ भी रिपोर्ट नहीं करता, और उस पर किया गया प्रेस उसके आसपास के किसी pressable view तक नहीं पहुँचता।

## States

ऐप हर state को classes या style props से style करता है:

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

Visited link को याद रखना ऐप का काम है: वह जो hrefs खोल चुका है उन्हें रखता है और उन links को अपनी state के अनुसार style करता है।

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## टेक्स्ट के अंदर

`<Text>` के अंदर `Link` पैराग्राफ़ का एक inline box होता है, जैसा टेक्स्ट के अंदर हर view होता है: यह लाइन में बैठता है, अपनी states, फ़ोकस और role रखता है, और एक ही लाइन पर रहता है। `align-text-bottom` एक लाइन के टेक्स्ट वाले link को पैराग्राफ़ की baseline पर रखता है:

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

जो link पैराग्राफ़ की लाइनों के साथ wrap होता है, वह `role="link"` और `onPress` के साथ nested `<Text>` होता है ([Text](./text.md) देखें), जैसे [TextView](./text-view.md) किसी document के links बनाता है।

<a id="a-small-target-with-hitslop"></a>

## hitSlop के साथ छोटा target

Link उँगली से छोटा हो सकता है: कोई icon, कोई छोटा शब्द। `hitSlop` उसके पास पड़ने वाले प्रेस को गिनने योग्य बनाता है, हर तरफ़ से points में, उसके layout या रूप को बदले बिना: सभी तरफ़ के लिए एक संख्या, या नाम वाली तरफ़ें (`{ top: 8, bottom: 8 }`), जैसे [view का `hitSlop`](./index.md#presses-and-feedback) उन्हें लेता है।

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

## Accessibility

- स्क्रीन रीडर के लिए link एक ही element है, जिसका role `"link"` है; उसका लेबल उसके children का टेक्स्ट है, या `accessibilityLabel`। `href` डेटा ही रहता है: स्क्रीन रीडर लेबल बोलते हैं।
- `current` को वर्तमान पेज के रूप में बोला जाता है (ARIA का `aria-current="page"`), और `disabled` को वैसे बोला जाता है जैसे प्लेटफ़ॉर्म dimmed element को बोलता है।
- macOS और web पर link कीबोर्ड फ़ोकस का एक पड़ाव होता है: Tab उस तक पहुँचता है, Return और Space उसे खोलते हैं, और `focus:` styles दिखाते हैं कि फ़ोकस कहाँ है।

सामान्य रूप से लेबल, roles और announcements के लिए [Accessibility](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- iOS, Android और Mac Catalyst: प्रेस वह tap है जो link पर समाप्त होता है।
- डेस्कटॉप (macOS, Windows, Linux, GPUI) और web: प्रेस एक क्लिक है। macOS और web पर Return और Space भी कीबोर्ड फ़ोकस वाले link को खोलते हैं।
- Web link को `role="link"` वाले element के रूप में रेंडर करता है।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप style करता है।
