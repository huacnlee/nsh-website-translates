---
title: "Dialog"
description: "Die Dialog-Komponente: eine modale Oberfläche über allen anderen Inhalten, für Vollbild-Abläufe, Sheets und Dialoge, die die App selbst gestaltet."
group: base
demo: el-dialog
source_hash: a054e14119bef924
---


# Dialog

Ein Dialog stellt Inhalte über dem Rest der App in einer eigenen nativen Fensterebene dar: ein präsentierter View Controller unter iOS und Mac Catalyst, ein Dialog unter Android, eine Ebene über dem gesamten Fenster auf den Desktop-Plattformen und im Web. Er wird für Vollbild-Abläufe, Sheets und Dialoge verwendet. Die systemeigenen Gesten (ein Sheet nach unten wischen, die Zurück-Taste unter Android, Escape) funktionieren und werden nativ entschieden. In Rust erzeugt man einen Dialog mit `nsh_base::dialog()`, in TSX mit `<Dialog>` aus `nsh/base`.

Der Dialog bestimmt sein Verhalten selbst und überlässt sein Aussehen der App: Seine Styles gestalten das Popup (die View, die die Kinder enthält), und in TSX fügen `backdropClass` / `backdropStyle` dahinter einen Backdrop hinzu.

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

In TSX wird der Dialog angezeigt, solange `open` nicht `false` ist, und geschlossen, sobald es `false` wird. In Rust wird er präsentiert, solange er in der View ist, und entfernt, sobald er sie verlässt, sodass `when` ihn hält. In beiden Fällen gibt er seinem Inhalt die Safe-Area-Insets des Dialogs, die die [`env(safe-area-inset-*)`](./safe-area.md)-Variablen und `safeAreaInsets()` (`cx.insets()` in einer Rust-Komponente) darin auslesen. [`Button`](./button.md), ebenfalls aus `nsh/base`, ist ein von der App gestaltetes Press-Ziel.

`nsh_core::prelude` hat außerdem eine ältere, veraltete Funktion `dialog`: Importiere `nsh_base::dialog` wie oben beim Namen, dann ersetzt der explizite Import sie. Für den System-Alert oder das Action Sheet verwende [`AlertDialog`](./alert-dialog.md).

## Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `open` | in der View, solange offen (`when(open, ..)`) | `boolean` | `true` | Wird angezeigt, solange der Wert true ist. |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | Wie er eingeblendet und ausgeblendet wird. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | keine | Er wird anstelle seines `animation` über einen WGSL-Shader ein- und ausgeblendet: `shade(uv)` liest den Hintergrund als `sample_from` und den Dialog als `sample_to`, während `nsh.progress` über `duration` Millisekunden (standardmäßig 350) von 0 bis 1 läuft und beim Schließen von 1 zurück auf 0. Wenn das System weniger Bewegung anfordert, verwendet er sein eigenes `animation`. Siehe [Shader](./shader.md). |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | Seine Form unter iOS: `fullScreen` bedeckt den Bildschirm mit einem transparenten Hintergrund; `pageSheet` und `formSheet` sind System-Sheets, die den Hintergrund sichtbar lassen (`formSheet` ist auf großen Bildschirmen ein kleineres, zentriertes Sheet). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape und die Zurück-Taste unter Android schließen ihn nativ. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Ein Druck auf den Backdrop schließt ihn. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | Ein Sheet nach unten zu wischen (iOS, Browser auf Smartphones) schließt ihn nativ. |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | keine | iOS und Android: die Statusleiste, solange der Dialog offen ist, mit Vorrang vor der der Seiten ([Status bar](../modules/nsh-base.md#status-bar)). |
| `onOpen` | `.on_open(..)` | `() => void` | | Das Einblenden ist abgeschlossen. |
| `onClose` | `.on_close(..)` | `() => void` | | Er ist verschwunden: Der Benutzer hat ihn geschlossen, oder die App hat ihn entfernt. |
| `onCancel` | `.on_cancel(..)` | `() => void` | | Der Benutzer hat versucht, ihn zu schließen (Escape, Zurück, ein Druck auf den Backdrop, ein Wischen nach unten), unabhängig davon, ob ein `closeOn*`-Flag das Schließen erlaubt hat. |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | Der Benutzer hat ihn geschlossen: Halte `open` hier synchron. In Rust entfernt `on_cancel` den Dialog aus der View. |
| `class`, `style` | `Styled`-Methoden | `string`, `StyleProp<ViewStyle>` | | Das Popup: die View, die die Kinder enthält. |
| `backdropClass`, `backdropStyle` | eine Kind-View, die den Dialog ausfüllt | `string`, `StyleProp<ViewStyle>` | | Ein Backdrop, der den Dialog hinter dem Popup ausfüllt und vorhanden ist, sobald eines von beiden gesetzt ist. |
| `children` | `.child(..)` | `JSX.Element` | | Der Inhalt. |

| `ios`-Schlüssel | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | die des Presenters | Die Ausrichtungen, die der Dialog erlaubt. |

| `android`-Schlüssel | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | Der Inhalt reicht unter die Statusleiste; andernfalls beginnt er darunter. |

<a id="opening-and-closing"></a>

## Öffnen und Schließen

Der Zustand des Dialogs gehört der App. Wenn der Benutzer den Dialog schließt (Escape, die Zurück-Taste unter Android, ein Druck auf den Backdrop, ein nach unten gewischtes Sheet), schließt er sich nativ und teilt es der App mit, die ihren Zustand entsprechend setzt: in TSX `onOpenChange({ open: false, reason })`, in Rust `on_cancel`. In TSX bleibt der Dialog geschlossen, solange `open` auf `true` bleibt, und er öffnet sich erneut, wenn `open` von `false` auf `true` wechselt.

Jedes `closeOn*`-Flag wird nativ gelesen, wenn der Benutzer handelt, da der Main-Thread nie auf den Code der App wartet. Um vor dem Schließen eine Bestätigung einzuholen, setze die Flags auf `false`: Der Versuch ruft dann `onCancel` auf, und die App schließt den Dialog selbst (in TSX, indem sie `open` auf `false` setzt, in Rust, indem sie ihn aus der View nimmt):

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

`onCancel` wird bei jedem Versuch aufgerufen, unabhängig davon, ob die Flags das Schließen des Dialogs erlauben.

<a id="a-dialog-with-a-backdrop"></a>

## Ein Dialog mit Backdrop

Ein Dialog mit der Standard-Präsentation `fullScreen` zeigt, was die App zeichnet: hier einen abgedunkelten Backdrop und eine darüber zentrierte Karte. Ein Druck auf den Backdrop schließt ihn:

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

Für den System-Alert oder das Action Sheet verwende [`AlertDialog`](./alert-dialog.md) aus `nsh/base`.

<a id="ref-methods"></a>

## Ref-Methoden

Keine.

<a id="platform-notes"></a>

## Plattformhinweise

- iOS und Mac Catalyst: `presentation` bestimmt die Form. `fullScreen` präsentiert über dem gesamten Bildschirm mit einem transparenten Hintergrund; `pageSheet` und `formSheet` sind System-Sheets mit dem Systemhintergrund, die beim Wischen nach unten dem Finger folgen (`closeOnSwipe`).
- Android: Der Dialog füllt das Fenster und zeigt das Popup und den Backdrop der App. Die Zurück-Taste geht zuerst an den obersten Dialog, noch vor Stacks und `BackHandler`-Listenern.
- Desktop-Plattformen (macOS, Windows, Linux, GPUI) und das Web: Der Dialog ist eine transparente Ebene über dem gesamten Fenster, die das Popup und den Backdrop der App zeigt. Escape ist ein Schließversuch.
- `supportedOrientations` gehört zu iOS, `statusBarTranslucent` zu Android. Der Inhalt eines Android-Dialogs beginnt unterhalb der Statusleiste, sofern nicht `statusBarTranslucent` gesetzt ist.
