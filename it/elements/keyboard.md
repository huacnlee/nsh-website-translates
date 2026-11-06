---
title: "Tastiera"
description: "La variabile d'ambiente keyboard-inset-height, Keyboard.dismiss e l'altezza della tastiera: contenuti mantenuti sopra la tastiera software, che si muovono insieme a essa."
order: 120
group: primitives
demo: el-keyboard
source_hash: d083e22be8d06de9
---

# Tastiera

`env(keyboard-inset-height)` è l'altezza della tastiera software sopra la superficie, 0 quando è nascosta. Usata come padding o margin inferiore di una view, mantiene il contenuto sopra la tastiera: quando la tastiera appare o scompare, la view fa spazio per la sua altezza e la modifica viene animata nativamente insieme alla tastiera. Usala per i contenuti fuori dalle scroll view, come una barra dei messaggi in fondo a una schermata di chat; gli input dentro una [scroll view](./scroll.md) o una [List](./list.md) vengono portati in vista nativamente. Insieme a essa ci sono `Keyboard.dismiss()`, che nasconde la tastiera, e l'altezza della tastiera, per i layout personalizzati.

```rust tabs
use nsh_core::prelude::*;

fn chat() -> impl IntoElement {
    let draft = signal(String::new());
    view()
        .flex_1()
        .bg(white())
        .pb_keyboard()
        .child(scroll().flex_1().child(text("Messages…").p_4()))
        .child(
            view()
                .flex_row()
                .gap_2()
                .p_2()
                .border_t_1()
                .border_color(rgb(0xe5e5e5))
                .child(
                    input()
                        .value(draft)
                        .on_change(move |v: &str| draft.set(v.to_owned()))
                        .placeholder("Message")
                        .flex_1()
                        .p_2(),
                ),
        )
}
```

```tsx tabs
import { mount, Scroll, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const draft = signal("");
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff", paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        <Text style={{ padding: 16, paddingTop: 48 }}>Messages…</Text>
      </Scroll>
      <View style={{ flexDirection: "row", gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: "#e5e5e5" }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          placeholder="Message"
          style={{ flex: 1, fontSize: 16, padding: 8 }}
        />
      </View>
    </View>
  );
}

mount(App);
```

L'altezza completa della tastiera è adatta a una view che raggiunge il fondo dello schermo, come il contenuto di una schermata. Quando sotto c'è qualcos'altro, come una tab bar, sottrailo con una lunghezza: `calc(env(keyboard-inset-height) + -49px)` mantiene una view sopra una tab bar da 49 pt, e `calc(env(keyboard-inset-height) + 12px)` aggiunge spazio sopra la tastiera. Un padding è almeno 0.

<a id="padding-or-margin"></a>

## Padding o margin

| Stile | Come fa spazio |
|---|---|
| `paddingBottom: "env(keyboard-inset-height)"` (Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) | Il contenuto sopra si riduce; lo sfondo raggiunge comunque il fondo dello schermo. |
| `marginBottom: "env(keyboard-inset-height)"` (Tailwind `mb-[env(keyboard-inset-height)]`, Rust `.mb_keyboard()`) | L'intera view, sfondo compreso, termina in cima alla tastiera. |

L'altezza della tastiera viene aggiunta solo alla lunghezza nella stessa dichiarazione, quindi una view la combina con una spaziatura propria in `calc()`. In Rust, `.pb_keyboard_plus(px(..))` e `.mb_keyboard_plus(px(..))` aggiungono una lunghezza.

```rust tabs
use nsh_core::prelude::*;

fn sign_in() -> impl IntoElement {
    view()
        .mb_keyboard_plus(px(-49.0))
        .flex_1()
        .p_4()
        .gap_3()
        .child(input().placeholder("E-mail").keyboard_type(KeyboardType::Email))
}
```

```tsx tabs
<View class="flex-1 gap-3 p-4 mb-[calc(env(keyboard-inset-height)+-49px)]">
  <Input placeholder="E-mail" keyboardType="email-address" class="rounded-lg border border-neutral-300 px-3 py-2" />
</View>
```

Qui una tab bar da 49 pt sotto la view copre già parte dell'altezza della tastiera. Per disattivare lo spazio, ometti la variabile dallo stile, ad esempio con una condizione su un signal.

<a id="hiding-the-keyboard"></a>

## Nascondere la tastiera

`Keyboard.dismiss()`, da `nsh`, rimuove il focus dall'input attivo, e questo nasconde la tastiera. Se nessun input ha il focus, lascia tutto invariato. I componenti Rust chiamano `dismiss_keyboard()`.

```rust tabs
use nsh_base::button;
use nsh_core::prelude::*;

fn done() -> impl IntoElement {
    button()
        .on_press(|| dismiss_keyboard())
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text("Done").text_color(white()))
}
```

```tsx tabs
import { Text, Keyboard } from "nsh";
import { Button } from "nsh/base";

function Done() {
  return (
    <Button onPress={() => Keyboard.dismiss()} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center font-semibold text-white">Done</Text>
    </Button>
  );
}
```

> [!TIP]
> Per nascondere la tastiera quando l'utente trascina una scroll view, imposta `keyboardDismissMode="on-drag"` o `"interactive"` sulla [scroll view](./scroll.md) o sulla [List](./list.md).

<a id="the-keyboards-height"></a>

## L'altezza della tastiera

| TSX | Rust | Restituisce |
|---|---|---|
| `keyboardFrame()` | `keyboard_height()`, `keyboard_duration()` | L'altezza della tastiera software sopra la superficie NSH, in punti (0 quando è nascosta), e la durata della sua animazione di comparsa o scomparsa, in millisecondi. |

Entrambi sono reattivi: un effect, un'espressione JSX o una closure di stile che li legge viene rieseguita quando la tastiera appare, scompare o cambia altezza.

```rust tabs
use nsh_core::prelude::*;

fn message_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || {
            // The home indicator's inset only matters while the keyboard is hidden.
            let home = if keyboard_height() > Points::ZERO {
                Points::ZERO
            } else {
                safe_area().bottom
            };
            px(8.0) + home
        })
        .child(input().placeholder("Message").flex_1())
}
```

```tsx tabs
import { View, keyboardFrame, safeArea } from "nsh";
import { Input } from "nsh/base";

function MessageBar() {
  const insets = safeArea();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 8,
        // The home indicator's inset only matters while the keyboard is hidden.
        paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
      }}
    >
      <Input placeholder="Message" style={{ flex: 1 }} />
    </View>
  );
}
```

L'altezza è la parte della tastiera che si sovrappone alla superficie NSH. Quando la finestra stessa si riduce per la tastiera (un'activity Android che si ridimensiona), o quando NSH è incorporato in una view che termina sopra la tastiera, l'altezza è 0.

> [!NOTE]
> Per mantenere il contenuto sopra la tastiera, `env(keyboard-inset-height)` è la forma più semplice: si anima nativamente con la tastiera, senza eseguire codice.

<a id="platform-notes"></a>

## Note sulle piattaforme

- **iOS**: lo spazio si anima con la durata propria della tastiera e una curva ease-in-ease-out.
- **Android**: dove la finestra si riduce per la tastiera (un'activity che si ridimensiona), il contenuto termina già sopra la tastiera e la variabile è 0. Dove la tastiera si sovrappone alla view, fa spazio come su iOS.
- **Desktop e Mac Catalyst** usano una tastiera hardware: la variabile è 0 e la view mantiene il proprio layout.
- **Web**: la variabile è quella propria del browser (quella della VirtualKeyboard API).

Consulta [Moduli e tastiera](../docs/forms-and-keyboard.md) per ordine del focus, tasti di invio e accessori degli input, e [Safe area](./safe-area.md) per le altre variabili d'ambiente.
