---
title: "View"
description: "L'elemento contenitore di base: layout, sfondi, bordi, ombre, gestione della pressione e gesti."
order: 10
group: primitives
demo: el-view
source_hash: 4d3ed9aca6dda87e
---

# View

`View` è il blocco fondamentale di ogni schermata: un contenitore nativo (una UIView su iOS e Mac Catalyst, un ViewGroup su
Android) che dispone i propri figli con flexbox o grid, disegna sfondo, bordi, ombre e gradienti, e gestisce le
pressioni. Pulsanti, card, righe e schermate sono tutti view. Rust ne crea una con `view()`, TSX con `<View>` da `nsh`.

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

Una view dispone i propri figli con flexbox, con questi valori predefiniti: `flexDirection: "column"`, `flexShrink: 0`,
`alignContent: "flex-start"`, `position: "relative"`. `display: "grid"` (`.grid()` in Rust) passa al CSS grid e
`display: "block"` al layout a blocchi. Le dimensioni sono in punti. Vedi [layout](../docs/layout.md) e il
[riferimento degli stili](../modules/style-reference.md).

`display: "flex"` segue il CSS: in uno stile, come classe `flex` e come `.flex()` di Rust, è una riga a meno che non sia impostata una direzione
(`flexDirection: "column"`, `flex-col`, `.flex_col()`). Una view che non imposta alcun display dispone i propri figli in colonna.

## Props

`View` ha una prop propria, `selectable` (`.selectable(true)` in Rust): i testi all'interno della view si selezionano insieme, come un'unica selezione ([Selezione del testo](./text-selection.md)). Le altre sono le [prop comuni](./index.md#common-props): gli stili (`style`, `class`,
`classList`; i metodi `Styled` in Rust), `disabled`, le prop di pressione (`onPress`, `onLongPress`, `onPressDown`,
`onPressUp`, `delayLongPress`, `hitSlop`), gli stili di stato (`activeStyle`, `hoverStyle`,
`focusStyle`, `disabledStyle`, `checkedStyle`), `onMouseEnter` / `onMouseMove` / `onMouseLeave`, `onContextMenu`,
`onFileDragEnter` / `onFileDragLeave` / `onFileDrop`, `focusable`, `onLayout`, `ref`, `nativeID`, `testID`, le
prop dei gesti (`pan`, `pinch`, `rotation` e i relativi eventi), le prop di touch e responder, le prop di accessibilità
e `ios` / `android` / `desktop`.

<a id="selectable-views"></a>

## View selezionabili

Con `selectable`, una selezione attraversa gli elementi [`Text`](./text.md) e i [`TextView`](./text-view.md) all'interno
della view, in ordine di lettura; i testi con `selectable={false}` restano esclusi, e una view selezionabile dentro un'altra fa parte
di quella esterna. Vedi [Selezione del testo](./text-selection.md) per i gesti su ogni piattaforma.

```tsx
<View selectable class="gap-3 p-4">
  <Text>One selection runs from here…</Text>
  <Text>…to here.</Text>
</View>
```

<a id="press-feedback"></a>

## Feedback alla pressione

Una view premibile è qualsiasi view con un gestore di pressione. Il suo feedback è definito dall'app: uno stile mentre è premuta, applicato in modo nativo
finché il dito è appoggiato, senza passare dal codice dell'app. `hoverStyle`, `focusStyle` e `disabledStyle` fanno lo
stesso per gli altri stati:

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

Su Android, `android={{ ripple: { color: "#0000001f" } }}` (`.ripple(Ripple { .. })` in Rust) aggiunge l'effetto ripple
di Material (`borderless`, `radius` e `foreground` lo regolano).

`disabled` rimuove i listener di pressione dalla view nativa (nessuna pressione, nessun feedback) e applica gli stili disabilitati:

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

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onPress` | `.on_press` | `PressEvent` (nessuno in Rust) | Un tap è terminato all'interno della view. |
| `onLongPress` | `.on_long_press` | `PressEvent` (nessuno in Rust) | Il dito è rimasto appoggiato per `delayLongPress` (500 ms). |
| `onPressDown` / `onPressUp` | `.on_press_down` / `.on_press_up` | `PressEvent` (nessuno in Rust) | Un dito si è appoggiato / sollevato o è uscito. |
| `onMouseEnter` / `onMouseLeave` | `.on_mouse_enter` / `.on_mouse_leave` | `MouseEvent` | Il mouse è entrato nella view (o in una view al suo interno) / l'ha lasciata o ha lasciato la finestra ([hover](./index.md#hover)); quello di `onMouseLeave` è dove si trovava per ultimo. |
| `onMouseMove` | `.on_mouse_move` | `MouseEvent` | Il mouse si è mosso sulla view (o su una view al suo interno), con o senza un pulsante premuto, oppure un tasto modificatore è stato premuto o rilasciato mentre il mouse sosta sulla view senza pulsanti premuti: `position`, `pagePosition` (`Point`), `modifiers` e `pressedButton` (`"left"`, `"right"`, `"middle"`, `"back"`, `"forward"` o `null`); al massimo una volta per frame. |
| `onContextMenu` | `.on_context_menu` | `ContextMenuEvent` | Il pulsante secondario è stato premuto sulla view ([menu contestuali](./index.md#context-menus)). |
| `onFileDragEnter` / `onFileDragLeave` | `.on_file_drag_enter` / `.on_file_drag_leave` | nessuno | Un trascinamento di file locali è entrato nella / uscito dalla destinazione desktop attiva. |
| `onFileDrop` | `.on_file_drop` | `{ uris: string[] }` (`FileDropEvent`) | File o directory locali sono stati rilasciati sulla destinazione desktop. |
| `onLayout` | `.on_layout` | `{ bounds }` (`Bounds<Points>`) | Il frame relativo al genitore è cambiato. |
| `onPanStart` / `onPanEnd` | `.on_pan_start` / `.on_pan_end` | `PanEvent` | Un trascinamento associato con `pan` è iniziato / terminato; `cancelled` è true quando il sistema lo annulla. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start` / `.on_pinch_end` | `{ scale, velocity }` | Un pinch associato con `pinch` è iniziato / terminato. |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start` / `.on_rotation_end` | `{ rotation, velocity }` | Una rotazione associata con `rotation` è iniziata / terminata. |
| `onAccessibilityAction` | `.on_accessibility_action` | `{ actionName }` | È stata eseguita un'azione di accessibilità personalizzata. |

Per gli eventi di touch e responder, vedi le [prop comuni](./index.md#raw-touches-and-the-responder-system).

<a id="desktop-file-drops"></a>

## Rilascio di file su desktop

Su AppKit, GTK, Win32 e GPUI, una view con `onFileDrop` riceve file e directory locali trascinati da un'altra
applicazione. `onFileDragEnter` e `onFileDragLeave` tengono traccia della destinazione attiva; `onFileDrop` riceve
`{ uris: string[] }` nell'ordine della lista di file nativa. Ogni voce è un URL `file:` assoluto con spazi e
caratteri non ASCII con escape. Analizza l'URL per ottenere un percorso del filesystem, invece di rimuovere il prefisso a mano.

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

Il discendente abilitato più vicino in ascolto di `onFileDrop` riceve il rilascio. Una radice modale delimita questa ricerca. `disabled`
rimuove i listener di trascinamento/rilascio dei file; l'uscita, l'annullamento, il completamento e la rimozione della destinazione azzerano lo stato attivo.
L'accettazione usa l'operazione Copy e lo stato nativo montato. Spetta all'app decidere se leggere, aprire o trasferire i
file ricevuti.

<a id="ref-methods"></a>

## Metodi del ref

Il ref di una view semplice è un `ViewRef`: `focus()`, `blur()` e `measure()`. `ref` (`.element_ref(&handle)` in Rust) restituisce il suo nodo, ad esempio da passare a
`setAccessibilityFocus` ([API di accessibilità di `nsh`](../modules/nsh.md#accessibility)), oppure per misurarla
(`handle.measure()` in Rust).

<a id="views-inside-text"></a>

## View dentro il testo

Una view posta dentro un testo è un allegato inline: si colloca sulla linea di base, va a capo insieme alle parole e riceve
pressioni proprie. Vedi [testo](./text.md#inline-views-and-images).

<a id="platform-notes"></a>

## Note sulle piattaforme

- `boxShadow` viene disegnata su ogni piattaforma; `android={{ elevation }}` fornisce invece l'ombra material di Android. Su Android un'ombra richiede un
  colore di sfondo (una view con sfondo trasparente nonproietta alcuna ombra).
- `filter` sulle view: iOS supporta `opacity()`, `brightness()` fino a 1 e `drop-shadow()` (le immagini accettano ogni filtro
  colore e `blur()`); Android li supporta tutti da API 31, e i filtri colore sotto tale livello.
- `backdropFilter: "blur(…)"` è un materiale di sistema su iOS (un'approssimazione) e richiede API 31 su Android.
- Android disegna le trasformazioni `translate`, `scale` e `rotate`; le inclinazioni (`skew()`, `skewX()`, `skewY()`) si applicano sulle altre piattaforme.
- `borderCurve: "continuous"` (`.border_curve(BorderCurve::Continuous)`) disegna angoli che si raccordano dolcemente ai bordi (come
  le icone delle app iOS), su entrambe le piattaforme.
- Lo stile `cursor` si applica dove è presente un puntatore (Mac Catalyst, iPad con puntatore, desktop).
