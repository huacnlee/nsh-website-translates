---
title: "Button"
description: "Il componente Button: un elemento premibile che gestisce le pressioni, gli stati disabilitato e selezionato e il proprio ruolo per gli screen reader, con stile definito dall'app."
group: base
demo: el-button
source_hash: ae28f575931a4fe9
---

# Button

Un button è un bersaglio di pressione. Possiede il comportamento: le pressioni, il feedback di pressione tramite gli stili di stato dell'app, gli stati disabled e selected, il focus da tastiera e il suo ruolo per gli screen reader. L'aspetto è quello dell'app: un `Button` non ha colori, dimensioni, padding o etichetta propri, quindi un solo componente diventa un button primario,
un button con icona, una scheda, un toggle della toolbar o la riga di una lista, a seconda degli stili e dei figli che gli fornisci.

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

`Button` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In TSX il suo aspetto è definito da `class` e
`style`, con le varianti di stato `active:`, `hover:`, `focus:`, `selected:` e `disabled:` (oppure le corrispondenti
`activeStyle`, `hoverStyle`, `focusStyle`, `selectedStyle` e `disabledStyle`). In Rust, `button()` ne crea uno
come `view()` crea una view: un setter per ogni prop (`.disabled(..)`, `.selected(..)`), un listener per ogni evento (`.on_press(..)`),
i metodi di stile tipizzati (`.px_4()`, `.bg(..)`) per l'aspetto, i metodi di stato (`.active(..)`, `.hover(..)`,
`.focus(..)`, `.selected_style(..)`, `.disabled_style(..)`) per i suoi stati e `.child(..)` per il contenuto.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna pressione e nessun feedback di pressione; si applicano gli stili `disabled:` e gli screen reader lo annunciano come attenuato. |
| `selected` | `.selected(..)` | `boolean` | `false` | Selezionato: un toggle attivo, la scheda corrente. Gli screen reader lo annunciano. Il valore è gestito dall'app, che ne definisce anche lo stile. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile mentre `selected` e non disabled, come classi `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader leggono quando il contenuto non basta, ad esempio per un'icona. |
| `role` | `.role(..)` | `AccessibilityRole` | `"button"` | Cos'è per gli screen reader quando nessun componente `nsh/base` è quel controllo: `"link"` (apre un URL), ... |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | nessuno | Di quanto, fuori dai suoi limiti, le pressioni vengono ancora considerate, in punti: un solo numero per tutti i lati, oppure i lati indicati per nome. Come `hitSlop` di una view. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto: testo, un'icona, qualsiasi layout. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il suo aspetto, per intero. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile mentre è premuto, in hover, con il focus o disabilitato, come classi `<state>:`. Gli stati successivi prevalgono; `disabled` prevale su tutti. |

In Rust ogni prop è un setter che accetta un valore, un signal o una closure; le prop omesse mantengono i valori predefiniti:

```rust
button()
    .disabled(move || saving.get())
    .accessibility_label("Save")
```

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onPress` | `.on_press(\|\| ..)` | Il button è stato premuto: un tap, un clic, Invio o Spazio mentre ha il focus da tastiera, oppure l'attivazione da parte di uno screen reader. |
| `onPressDown` | `.on_press_down(\|\| ..)` | Una pressione è iniziata su di esso. |
| `onPressUp` | `.on_press_up(\|\| ..)` | La pressione è terminata: rilasciata, spostata altrove o annullata. |

`onPressDown` e `onPressUp` servono per un feedback di pressione personalizzato, ad esempio una molla o un'evidenziazione che gli stili di stato
non permettono di esprimere. Un button disabilitato non ne segnala nessuno.

<a id="styling"></a>

## Stile

L'aspetto di un button è quello della tua app: è l'app a decidere cosa sia un button primario o secondario. Una coppia di piccoli componenti mantiene
questa decisione in un unico punto:

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

Le varianti di stato vengono applicate in modo nativo: una pressione scurisce il button sul main thread senza eseguire JS o Rust.
In Rust i metodi di stato sono le stesse varianti: `.active(..)`, `.hover(..)`, `.focus(..)`, `.selected_style(..)` e
`.disabled_style(..)` seguono gli stati del button stesso. I colori del tuo tema funzionano allo stesso modo: `bg-primary` in TSX,
`theme().primary` in Rust (vedi [Theme tokens](../docs/tailwind.md#theme-tokens)).

## Disabled

Un button disabilitato non accetta pressioni e non dà feedback, e gli screen reader lo annunciano come attenuato. Il suo aspetto quando
è disabilitato dipende da te, con le classi `disabled:` oppure `disabledStyle`:

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

## Un toggle con selected

`selected` trasforma un button in un toggle: il button del grassetto di una toolbar, un chip di filtro, la scheda corrente. L'app mantiene il valore,
lo inverte in `onPress` e definisce lo stile dello stato selezionato; gli screen reader annunciano il button come selezionato.

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

Una riga di schede è [`Tabs`](./tabs.md) e un controllo on / off è [`Switch`](./switch.md), da `nsh/base`: possiedono il ruolo, lo stato selezionato e la gestione della tastiera del proprio tipo, cosa che un `Button` con `role="tab"` o `role="switch"` non fa.

<a id="a-small-target-with-hitslop"></a>

## Un bersaglio piccolo con hitSlop

Un button con icona può essere più piccolo di un dito. `hitSlop` fa sì che le pressioni che cadono nelle sue vicinanze vengano considerate, in punti oltre ciascun lato,
senza modificarne il layout o l'aspetto: un solo numero per tutti i lati, oppure i lati indicati per nome (`{ top: 8, bottom: 8 }`), nello stesso modo in cui
li accetta [`hitSlop` di una view](./index.md#presses-and-feedback).

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

<a id="accessibility"></a>

## Accessibilità

- Un button è un unico elemento per gli screen reader, con il ruolo `"button"` a meno che `role` non indichi diversamente. La sua etichetta è il
  contenuto testuale; fornisci `accessibilityLabel` quando il contenuto è un'icona o dice troppo poco.
- `disabled` e `selected` vengono annunciati come li annuncia la piattaforma (VoiceOver, TalkBack, UI Automation, l'albero di
  accessibilità del browser).
- Su macOS e sul web un button è una tappa del focus da tastiera: Tab lo raggiunge, Invio e Spazio lo premono e
  gli stili `focus:` mostrano dove si trova il focus.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: una pressione è un tap che termina sul button; spostarsi altrove la annulla, come con i
  button di sistema.
- Desktop (macOS, Windows, Linux, GPUI) e web: una pressione è un clic. Su macOS e sul web, Invio e Spazio premono anche
  il button che ha il focus da tastiera. Gli stili `hover:` si applicano con il puntatore di un mouse o di un trackpad.
- Ogni piattaforma disegna ciò che lo stile dell'app definisce: il feedback di pressione è `active:` / `activeStyle` oppure un'animazione personalizzata.
