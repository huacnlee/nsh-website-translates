---
title: "Dialog"
description: "Il componente Dialog: una superficie modale sopra tutto il resto, per flussi a schermo intero, sheet e finestre di dialogo personalizzate dall'app."
group: base
demo: el-dialog
source_hash: a054e14119bef924
---

# Dialog

Un dialog presenta contenuto sopra il resto dell'app nel proprio livello di finestra nativo: un view controller presentato su iOS e Mac Catalyst, un Dialog su Android, un livello sopra l'intera finestra sui desktop e sul web. Si usa per flussi a schermo intero, sheet e dialog. I gesti del sistema (trascinare uno sheet verso il basso, il pulsante indietro di Android, Escape) funzionano e vengono decisi nativamente. In Rust se ne crea uno con `nsh_base::dialog()`, in TSX con `<Dialog>` da `nsh/base`.

Il dialog gestisce il proprio comportamento e lascia l'aspetto all'app: i suoi stili definiscono lo stile del popup (la view che contiene i figli), e in TSX `backdropClass` / `backdropStyle` aggiungono un backdrop dietro di esso.

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

In TSX, il dialog viene mostrato finché `open` non è `false` e chiuso quando diventa `false`. In Rust, viene presentato finché è nella view e chiuso quando ne esce, quindi `when` lo contiene. In entrambi i casi fornisce al proprio contenuto gli inset della safe area del dialog, che le variabili [`env(safe-area-inset-*)`](./safe-area.md) e `safeAreaInsets()` (`cx.insets()` in un componente Rust) al suo interno leggono. [`Button`](./button.md), anch'esso da `nsh/base`, è un target di pressione stilizzato dall'app.

`nsh_core::prelude` ha anche una funzione `dialog` più vecchia e deprecata: importa `nsh_base::dialog` per nome, come sopra, e l'import esplicito ne prende il posto. Per l'alert o l'action sheet del sistema, usa [`AlertDialog`](./alert-dialog.md).

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `open` | nella view finché è aperto (`when(open, ..)`) | `boolean` | `true` | Mostrato finché è true. |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | Come entra ed esce. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | nessuno | Entra ed esce tramite uno shader WGSL al posto della sua `animation`: `shade(uv)` legge ciò che sta dietro come `sample_from` e il dialog come `sample_to` mentre `nsh.progress` va da 0 a 1 in `duration` millisecondi (350 per impostazione predefinita), e da 1 a 0 alla chiusura. Quando il sistema richiede meno movimento, usa la propria `animation`. Vedi [Shader](./shader.md). |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | La sua forma su iOS: `fullScreen` copre lo schermo con uno sfondo trasparente; `pageSheet` e `formSheet` sono sheet di sistema che mantengono visibile ciò che sta dietro (`formSheet` è uno sheet centrato più piccolo sugli schermi grandi). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape e il pulsante indietro di Android lo chiudono nativamente. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Una pressione sul backdrop lo chiude. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | Trascinare uno sheet verso il basso (iOS, browser per telefono) lo chiude nativamente. |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | nessuno | iOS e Android: la barra di stato mentre il dialog è aperto, al posto di quella delle pagine ([Status bar](../modules/nsh-base.md#status-bar)). |
| `onOpen` | `.on_open(..)` | `() => void` | | Ha terminato di apparire. |
| `onClose` | `.on_close(..)` | `() => void` | | È scomparso: l'utente lo ha chiuso, oppure l'app lo ha rimosso. |
| `onCancel` | `.on_cancel(..)` | `() => void` | | L'utente ha tentato di chiuderlo (Escape, indietro, una pressione sul backdrop, un trascinamento verso il basso), indipendentemente dal fatto che un flag `closeOn*` lo abbia permesso. |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | L'utente lo ha chiuso: mantieni qui `open` sincronizzato. In Rust, `on_cancel` rimuove il dialog dalla view. |
| `class`, `style` | metodi `Styled` | `string`, `StyleProp<ViewStyle>` | | Il popup: la view che contiene i figli. |
| `backdropClass`, `backdropStyle` | una view figlia che riempie il dialog | `string`, `StyleProp<ViewStyle>` | | Un backdrop che riempie il dialog dietro il popup, presente quando uno dei due è impostato. |
| `children` | `.child(..)` | `JSX.Element` | | Il contenuto. |

| Chiave `ios` | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | quello del presenter | Gli orientamenti consentiti dal dialog. |

| Chiave `android` | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | Il contenuto si estende sotto la barra di stato; altrimenti inizia sotto di essa. |

<a id="opening-and-closing"></a>

## Apertura e chiusura

Lo stato del dialog appartiene all'app. Quando l'utente chiude il dialog (Escape, il pulsante indietro di Android, una pressione sul backdrop, uno sheet trascinato verso il basso), questo si chiude nativamente e lo comunica all'app, che imposta il proprio stato di conseguenza: `onOpenChange({ open: false, reason })` in TSX, `on_cancel` in Rust. In TSX, finché `open` rimane `true` il dialog resta chiuso, e si riapre quando `open` passa da `false` a `true`.

Ogni flag `closeOn*` viene letto nativamente quando l'utente agisce, poiché il thread principale non attende mai il codice dell'app. Per chiedere conferma prima di chiudere, imposta i flag su `false`: il tentativo chiama allora `onCancel`, e l'app chiude il dialog da sé (in TSX impostando `open` su `false`, in Rust rimuovendolo dalla view):

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

`onCancel` viene chiamato a ogni tentativo, che i flag permettano o meno la chiusura del dialog.

<a id="a-dialog-with-a-backdrop"></a>

## Un dialog con backdrop

Un dialog con la presentazione `fullScreen` predefinita mostra ciò che l'app disegna: qui un backdrop oscurato e una card centrata sopra di esso. Una pressione sul backdrop lo chiude:

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

Per l'alert o l'action sheet del sistema, usa [`AlertDialog`](./alert-dialog.md) da `nsh/base`.

<a id="ref-methods"></a>

## Metodi del ref

Nessuno.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS e Mac Catalyst: `presentation` sceglie la forma. `fullScreen` presenta a schermo intero con uno sfondo trasparente; `pageSheet` e `formSheet` sono sheet di sistema con lo sfondo di sistema, che seguono il dito quando vengono trascinati verso il basso (`closeOnSwipe`).
- Android: il dialog riempie la finestra e mostra il popup e il backdrop dell'app. Il pulsante indietro va prima al dialog più in alto, prima degli stack e dei listener `BackHandler`.
- Desktop (macOS, Windows, Linux, GPUI) e web: il dialog è un livello trasparente sopra l'intera finestra che mostra il popup e il backdrop dell'app. Escape è un tentativo di chiusura.
- `supportedOrientations` è di iOS; `statusBarTranslucent` è di Android. Il contenuto di un dialog Android inizia sotto la barra di stato a meno che `statusBarTranslucent` sia impostato.
