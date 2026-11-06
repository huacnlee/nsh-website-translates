---
title: "Toast"
description: "Toast, ToastStack और ToastManager: gpui-base की तरह बिना स्टाइल वाले toasts, ट्रांज़िशन स्टेटस के साथ एक सिमैंटिक root, एक स्टैक जो toasts को लेयर्स के रूप में व्यवस्थित करता है, और उनका headless लाइफ़साइकल।"
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---

# Toast

Toasts छोटे संदेश होते हैं जो ऐप के ऊपर कुछ समय के लिए दिखाए जाते हैं: "Copied", "Draft deleted · Undo", "Could not send".
`nsh/base` इनका व्यवहार तीन बिना स्टाइल वाले हिस्सों में देता है, ठीक GPUI Kit के `gpui-base` की तरह:

- **`ToastManager`** toasts को उनके जीवनचक्र के साथ क्रम में रखता है: हर toast पहले `"starting"` होता है, फिर motion की अवधि बीतने पर `"present"`, मौजूद रहने और रोका न जाने के दौरान अपना timeout घटाता है, और हटाए जाने से पहले exit की अवधि तक `"ending"` रहता है।
- **`ToastStack`** अपने toasts को नापता है और उन्हें किसी किनारे से सजाता है, सबसे नया किनारे के सबसे पास: collapsed होने पर परतें एक-दूसरे पर चढ़ी होती हैं, expanded होने पर सूची (जब pointer उस पर हो, या उस पर उँगली रखी हो), और गति springs से होती है।
- **`Toast`** हर toast का root है: `alert` role, ऐप की styles के लिए उसका `transitionStatus`, उसे dismiss करने का अनुरोध करने वाला swipe, और screen reader जो toast दिखते ही उसका label पढ़ता है।

रूप और सामग्री ऐप की होती है, और किसी भी जगह से toast दिखाने की सुविधा भी: ऐप इन्हीं पर अपना `toast(...)` बनाता है, जैसा gallery करती है (`examples/gallery/toast.tsx`) और जैसे GPUI Kit के notifications `gpui-base` के toasts पर बने हैं।

```rust tabs
use std::time::Duration;

use nsh_core::{time::now, prelude::*};

use nsh_base::{
    Anchor, ToastManager, ToastMotion, ToastOptions, ToastStackState, theme, toast, toast_stack,
};

fn toasts() -> impl IntoElement {
    let manager = stored(ToastManager::<u64, SharedString>::new(ToastMotion::sonner()));
    let shown = signal(Vec::new());
    let state = ToastStackState::new();
    let sync = move || {
        shown.set(manager.with(|m| {
            m.visible(3)
                .map(|(id, t, s)| (*id, t.clone(), s))
                .collect::<Vec<_>>()
        }))
    };
    // Advance the lifecycle while toasts are mounted, paused while expanded.
    set_interval(Duration::from_millis(50), move || {
        if manager.with(|m| m.advance(now(), state.is_expanded()).changed) {
            sync();
        }
    });
    manager.with(|m| {
        m.push(
            1,
            "Copied".into(),
            ToastOptions::timeout(Some(Duration::from_secs(5))),
            now(),
        )
    });
    sync();
    toast_stack()
        .placement(Anchor::BottomCenter)
        .state(state)
        .w(px(340.0))
        .child(each(
            shown,
            |(id, _, _)| *id,
            move |item, _| {
                toast()
                    .transition_status(move || item.get().2)
                    .accessibility_label(move || Some(item.get().1))
                    .on_dismiss_request(move || {
                        manager.with(|m| m.dismiss(&item.get().0, now()));
                    })
                    .rounded_xl()
                    .px_4()
                    .py_3()
                    .bg(move || theme().card)
                    .shadow_lg()
                    .transition_all()
                    .duration(200.0)
                    .starting_class("opacity-0 translate-y-4")
                    .ending_class("opacity-0 scale-95")
                    .child(text(move || item.get().1))
            },
        ))
}
```

```tsx tabs
import { Overlay, signal, Text, safeArea } from "nsh";
import { Toast, type ToastEntry, ToastManager, ToastStack } from "nsh/base";

const manager = new ToastManager();
const shown = signal<ToastEntry[]>([]);
const expanded = signal(false);
const sync = () => shown.set(manager.visible(3));
// Advance the lifecycle on a timer, paused while the stack is expanded.
setInterval(() => {
  if (manager.advance(expanded()).changed) sync();
}, 50);

export function toast(title: string) {
  manager.push(crypto.randomUUID(), { title }, { timeout: 5000 });
  sync();
}

export function Toaster() {
  return (
    <Overlay class="inset-x-0 bottom-0 items-center p-4" style={{ paddingBottom: safeArea().bottom + 16 }}>
      <ToastStack placement="bottomCenter" class="w-80" onExpandedChange={(e) => expanded.set(e.expanded)} onCancel={() => {
        const newest = shown().filter((t) => t.status !== "ending").at(-1);
        if (newest) { manager.dismiss(newest.id); sync(); }
      }}>
        <Each of={shown()} key={(t: ToastEntry) => t.id}>
          {(t) => (
            <Toast
              transitionStatus={t().status}
              accessibilityLabel={(t().value as { title: string }).title}
              onDismissRequest={() => { manager.dismiss(t().id); sync(); }}
              class="rounded-xl bg-card px-4 py-3 shadow-lg transition-all duration-200"
              startingClass="opacity-0 translate-y-4"
              endingClass="opacity-0 scale-95"
            >
              <Text class="font-semibold text-card-foreground">{(t().value as { title: string }).title}</Text>
            </Toast>
          )}
        </Each>
      </ToastStack>
    </Overlay>
  );
}
```

`Toast`, `ToastStack` और `ToastManager` [`nsh/base`](../modules/nsh-base.md) से आते हैं। Rust में ये `nsh_base` के `toast`, `toast_stack` और `ToastManager` हैं।

## ToastManager

Manager headless है: यह कुछ render नहीं करता और कोई timer नहीं चलाता। ऐप toasts push करती है, `visible(limit)` जो toasts उनकी status के साथ लौटाता है उन्हें render करती है, और कोई भी toast mounted रहने तक timer पर `advance` को कॉल करती है, stack के expanded रहने पर `paused` पास करते हुए। Rust में यह ऐप के ids और values पर `ToastManager<I, T>` है, और हर कॉल के लिए एक `Instant` है; TS में यह string ids और किसी भी JSON value पर एक class है, जो engine की घड़ी पर चलती है (test की manual clock सहित)।

- `push(id, value, options)` सबसे नया toast जोड़ता है, और उसी id वाले toast को बदल देता है (जिसकी value वह लौटाता है); `options.timeout` उसका present समय milliseconds में है (none: वह dismiss होने तक रहता है)।
- `dismiss(id)` किसी toast का exit शुरू करता है; `dismissAll()` हर toast का, और उनके ids लौटाता है।
- `advance(paused)` जीवनचक्र को आगे बढ़ाता है और बताता है कि क्या बदला: `presented`, `ending` (जिनका timeout समाप्त हो गया), `removed` (उनकी values के साथ), और `changed`।
- `visible(limit)` वे सबसे नए `limit` toasts हैं जो खत्म नहीं हो रहे, साथ में खत्म हो रहे toasts, सबसे पुराना पहले; `entries()` (Rust में `iter()`) सभी toasts; `get(id)`, `len()`, `isEmpty()`।

`ToastMotion` में दोनों के tokens हैं: `duration` (400 ms: enter की deadline और stack के spring की response), `exitDuration` (200 ms), `collapsedPeek` (14), `expandedGap` (14), `collapsedScaleStep` (0.05) और `collapsedVisible` (3), जो Sonner के हैं (Rust में `ToastMotion::sonner()`; TS में छोड़े गए fields यही रखते हैं)।

## ToastStack

Stack के children उसके toasts हैं, सबसे पुराना पहले। अपने `placement` किनारे से (डिफ़ॉल्ट रूप से `"topRight"`; नीचे वाले anchors ऊपर की ओर सजाते हैं), collapsed toasts एक-दूसरे से `collapsedPeek` की दूरी पर overlap करते हैं, हर अगला toast `collapsedScaleStep` से संकरा होता है, और केवल `collapsedVisible` दिखते हैं; expanded होने पर वे `expandedGap` की दूरी वाली सूची बन जाते हैं। आने या जाने वाले toasts, और expansion, critically damped springs से गति करते हैं। यह तब expanded होता है जब pointer उस पर हो या उस पर उँगली रखी हो (`onExpandedChange({ expanded })`; Rust में `ToastStackState`, जिसे `is_expanded()` पढ़ता है), ताकि उपयोगकर्ता के toasts पढ़ने या छूने के दौरान ऐप timeouts को रोक सके।

Stack को ऐप रखती है: किनारे पर एक [Overlay](./overlay.md) में, safe area के अंदर। इसके `class` और `style` इसकी चौड़ाई तय करते हैं। जब तक इसमें toasts हैं, यह Escape और Android के back button को सुनता है (`onCancel`; `closeOnEscape={false}` उन्हें ऐप के बाकी हिस्से पर छोड़ देता है): सबसे नए toast को dismiss करें।

<a id="toast-1"></a>

## Toast

Toast ऐप की सामग्री के चारों ओर `alert` role है। इसका `transitionStatus` manager का है, और इसकी state classes `class` पर उसी का अनुसरण करती हैं: `startingClass` अपने पहले frame में जब `"starting"` हो, ताकि इसकी `transition` classes उससे animate हों (Tailwind का `starting:`, CSS का `@starting-style`); `endingClass` जब `"ending"` हो, exit की अवधि तक; `swipingClass` जब कोई pointer इसे swipe कर रहा हो (`transition-none` इसे उँगली के नीचे बनाए रखता है)।

उँगली या mouse को `swipeDirection` की ओर खींचने पर (डिफ़ॉल्ट `"right"`; `null` swipe बंद कर देता है) यह खिसकता है, pointer के हिलने के बाद ही, ताकि इसके buttons buttons ही रहें; `swipeThreshold` points (50) से आगे छोड़ने पर या झटके से, यह आगे बाहर चला जाता है और dismiss होने का अनुरोध करता है (`onDismissRequest`), उससे पहले छोड़ने पर यह वापस लौट जाता है। Screen reader इसका `accessibilityLabel` तब पढ़ता है जब यह दिखता है।

## Toast props

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | इसका जीवनचक्र चरण। |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | कोई नहीं | इसके पहले frame में, खत्म होते समय, और swipe के दौरान की classes। |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | वह दिशा जिसमें इसे swipe करके हटाया जाता है। |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | छोड़ने पर dismiss का अनुरोध होने से पहले swipe कितनी दूर जाता है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | Screen reader इसे दिखते समय क्या पढ़ता है। |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | कोई नहीं | उपयोगकर्ता ने इसे swipe करके हटा दिया। |

## ToastStack props

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | Sonner के | इसके motion tokens। |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | वह किनारा जहाँ से यह सजाता है। |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | toasts होने तक यह Escape और back सुनता है। |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | कोई नहीं | interaction ने इसे expanded या collapsed किया। |
| `onCancel` | `.on_cancel(..)` | `() => void` | कोई नहीं | Escape या back: सबसे नए को dismiss करें। |
