---
title: "Toast"
description: "Toast, ToastStack und ToastManager: unstylisierte Toasts wie bei gpui-base, ein semantisches Root mit Übergangsstatus, ein Stack, der Toasts als Ebenen anordnet, sowie ihr Headless-Lebenszyklus."
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---


# Toast

Toasts sind kurze Meldungen, die für eine Weile über der App eingeblendet werden: „Kopiert“, „Entwurf gelöscht · Rückgängig“, „Senden fehlgeschlagen“.
`nsh/base` stellt ihr Verhalten in drei ungestylten Teilen bereit, genau wie `gpui-base` von GPUI Kit:

- **`ToastManager`** hält die Toasts in Reihenfolge und verwaltet ihren Lebenszyklus: Jeder ist zunächst `"starting"`, dann `"present"`, sobald die Dauer der Bewegung verstrichen ist, zählt seinen Timeout herunter, solange er präsent und nicht pausiert ist, und bleibt für die Dauer des Exits `"ending"`, bevor er entfernt wird.
- **`ToastStack`** misst ihre Toasts und ordnet sie von einem Rand aus an, der neueste am nächsten: als überlappende Ebenen im eingeklappten Zustand, als Liste im ausgeklappten (Zeiger darauf oder ein Finger darauf), bewegt mit Springs.
- **`Toast`** ist die Wurzel jedes Toasts: die Rolle `alert`, sein `transitionStatus` für die Styles der App, ein Swipe, der um das Schließen bittet, und der Screenreader, der sein Label beim Einblenden vorliest.

Das Aussehen und der Inhalt gehören der App, ebenso die Bequemlichkeit, einen Toast von überall aus zu zeigen: Eine App baut ihren eigenen `toast(...)` darauf auf, wie es die Gallery tut (`examples/gallery/toast.tsx`) und wie die Notifications von GPUI Kit auf den Toasts von `gpui-base` aufbauen.

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

`Toast`, `ToastStack` und `ToastManager` stammen aus [`nsh/base`](../modules/nsh-base.md). In Rust sind es `toast`, `toast_stack` und `ToastManager` von `nsh_base`.

## ToastManager

Der Manager ist headless: Er rendert nichts und führt keinen Timer aus. Die App fügt Toasts hinzu, rendert die Toasts, die `visible(limit)` zurückgibt, mit ihrem Status und ruft `advance` auf einem Timer auf, solange einer gemountet ist, und übergibt `paused`, während der Stack ausgeklappt ist. In Rust ist er `ToastManager<I, T>` über die IDs und Werte der App, mit einem `Instant` für jeden Aufruf; in TS ist er eine Klasse über String-IDs und beliebige JSON-Werte, auf der Uhr der Engine (einschließlich der manuellen Uhr eines Tests).

- `push(id, value, options)` fügt den neuesten Toast hinzu und ersetzt dabei einen mit derselben ID (dessen Wert es zurückgibt); `options.timeout` ist seine Anzeigedauer in Millisekunden (keine Angabe: Er bleibt, bis er geschlossen wird).
- `dismiss(id)` beginnt den Exit eines Toasts; `dismissAll()` den von jedem Toast und gibt deren IDs zurück.
- `advance(paused)` schaltet den Lebenszyklus weiter und meldet, was sich geändert hat: `presented`, `ending` (ihr Timeout ist abgelaufen), `removed` (mit ihren Werten) und `changed`.
- `visible(limit)` sind die neuesten `limit` Toasts, die nicht gerade enden, plus die endenden, älteste zuerst; `entries()` (Rust `iter()`) alle; `get(id)`, `len()`, `isEmpty()`.

`ToastMotion` enthält die Tokens von beiden: `duration` (400 ms: die Deadline des Enters und die Spring-Response des Stacks), `exitDuration` (200 ms), `collapsedPeek` (14), `expandedGap` (14), `collapsedScaleStep` (0,05) und `collapsedVisible` (3), die von Sonner (`ToastMotion::sonner()` in Rust; in TS weggelassene Felder behalten sie).

## ToastStack

Die Kinder des Stacks sind seine Toasts, älteste zuerst. Von seinem Rand `placement` aus (standardmäßig `"topRight"`; die unteren Anker ordnen nach oben an) überlappen eingeklappte Toasts im Abstand von `collapsedPeek`, jeder weitere ist um `collapsedScaleStep` schmaler, und nur `collapsedVisible` werden angezeigt; ausgeklappt bilden sie eine Liste im Abstand von `expandedGap`. Toasts, die ankommen oder verschwinden, sowie das Ausklappen bewegen sie mit kritisch gedämpften Springs. Er ist ausgeklappt, solange der Zeiger auf ihm ist oder ein Finger darauf liegt (`onExpandedChange({ expanded })`; Rust `ToastStackState`, dessen `is_expanded()` es liest), sodass die App die Timeouts pausiert, während der Nutzer die Toasts liest oder berührt.

Die App platziert den Stack: in einem [Overlay](./overlay.md) am Rand, innerhalb der Safe Area. Seine `class` und `style` bestimmen seine Breite. Solange er Toasts enthält, reagiert er auf Escape und die Android-Zurück-Taste (`onCancel`; `closeOnEscape={false}` überlässt sie dem Rest der App): den neuesten schließen.

## Toast

Ein Toast ist die Rolle `alert` um den Inhalt der App. Seine `transitionStatus` stammt vom Manager, und seine State-Klassen folgen ihr über seine `class`: `startingClass` in seinem ersten Frame, solange `"starting"`, sodass seine `transition`-Klassen davon aus animieren (Tailwinds `starting:`, CSS' `@starting-style`); `endingClass`, solange `"ending"`, für die Dauer des Exits; `swipingClass`, solange ein Zeiger ihn wischt (`transition-none` hält ihn unter dem Finger).

Ein Finger oder die Maus, gezogen in Richtung `swipeDirection` (standardmäßig `"right"`; `null` schaltet das Wischen aus), bewegt ihn, sobald sich der Zeiger bewegt hat, sodass seine Buttons Buttons bleiben; wird er jenseits von `swipeThreshold` Punkten (50) losgelassen oder weggeschnippt, bewegt er sich weiter hinaus und bittet darum, geschlossen zu werden (`onDismissRequest`), davor geht er zurück. Der Screenreader liest sein `accessibilityLabel` beim Einblenden vor.

## Toast-Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | Seine Lebenszyklus-Phase. |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | keiner | Seine Klassen in seinem ersten Frame, beim Enden, beim Wischen. |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | Die Richtung, in die er weggewischt wird. |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | Wie weit ein Wischen geht, bevor ein Loslassen darum bittet, ihn zu schließen. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | keiner | Was der Screenreader beim Einblenden vorliest. |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | keiner | Der Nutzer hat ihn weggewischt. |

## ToastStack-Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | die von Sonner | Seine Motion-Tokens. |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | Der Rand, von dem aus er anordnet. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Er reagiert auf Escape und Zurück, solange er Toasts enthält. |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | keiner | Eine Interaktion hat ihn aus- oder eingeklappt. |
| `onCancel` | `.on_cancel(..)` | `() => void` | keiner | Escape oder Zurück: den neuesten schließen. |
