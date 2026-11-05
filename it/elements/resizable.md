---
title: "Resizable"
description: "ResizablePanelGroup e ResizablePanel: pannelli affiancati o impilati, con una maniglia tra due pannelli adiacenti che l'utente trascina per ripartire lo spazio. Il gruppo gestisce il trascinamento, i limiti dei pannelli, il cursore di ridimensionamento e il ruolo delle maniglie per gli screen reader; le dimensioni, l'aspetto delle maniglie e il contenuto dei pannelli spettano all'app."
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---

# Resizable

Un gruppo ridimensionabile dispone i pannelli affiancati o impilati, con una maniglia su ogni confine tra due di essi: una barra laterale accanto a un documento, un editor sopra la sua console, un elenco accanto al suo dettaglio. L'utente trascina una maniglia per spostare il confine, e ogni pannello rimane entro le dimensioni che l'app gli consente. `ResizablePanelGroup` gestisce il comportamento: il trascinamento, che avviene in modo nativo fotogramma per fotogramma, la ripartizione dello spazio, il cursore di ridimensionamento e un'area di tocco più ampia per il dito. L'aspetto è dell'app: una maniglia è una banda senza linea, colore o impugnatura propri, e ciò che disegna è l'indicatore dell'app; i pannelli sono le viste dell'app.

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

`ResizablePanelGroup` e `ResizablePanel` provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. I pannelli sono i figli diretti del gruppo. In Rust, `h_resizable()` e `v_resizable()` creano un gruppo lungo ciascun asse (`resizable_panel_group().axis(..)` accetta l'asse come valore) e `resizable_panel()` un pannello, con un setter per ogni prop, un listener per ogni evento, i metodi di stile tipizzati e `.child(..)` per il loro contenuto; `.size_range(min..max)` imposta entrambi i limiti contemporaneamente.

<a id="sizes"></a>

## Dimensioni

Il `size` di un pannello è la dimensione che desidera, entro `minSize` e `maxSize`. I pannelli che non ne hanno una si dividono equamente lo spazio rimasto, indipendentemente dal contenuto; quando ogni pannello ha una dimensione, lo spazio residuo viene ripartito in proporzione a esse. Mentre l'utente trascina una maniglia, il gruppo sposta lo spazio tra i pannelli nel core, senza passare da JS:

- Se il pannello prima della maniglia cresce, sottrae spazio ai pannelli successivi, partendo dal più vicino, ciascuno fino al proprio `minSize`, saltando quelli `fixed`.
- Se si riduce sotto il proprio `minSize`, sottrae spazio ai pannelli precedenti.
- Nessun pannello cresce oltre il proprio `maxSize`, e la somma dei pannelli non supera mai la dimensione del gruppo.

Quando un trascinamento termina avendo modificato le dimensioni, il gruppo notifica la dimensione di ogni pannello visibile, nell'ordine in cui sono disposti (`onResize` sul gruppo), e ogni pannello la cui dimensione è cambiata notifica la propria (`onResize` sul pannello). I pannelli spostati da un trascinamento mantengono le dimensioni scelte dall'utente finché l'app non passa un nuovo `size`; l'app le conserva oltre la vita del gruppo restituendo le dimensioni notificate come `size`, così un layout che ripristina dallo [storage](../modules/nsh.md#storage) si apre con le dimensioni lasciate dall'utente. Notificano solo i trascinamenti e i passi dei lettori di schermo: una finestra ridimensionata o un pannello mostrato o nascosto non notifica nulla.

Quando il gruppo cresce o si riduce (la finestra viene ridimensionata), i pannelli con una dimensione la mantengono e i pannelli senza dimensione assorbono la differenza. Quando il gruppo è troppo piccolo per le dimensioni, i pannelli si riducono, esclusi quelli `fixed` (una barra laterale, un inspector), e tornano alle loro dimensioni quando lo spazio ritorna. Un pannello con `visible={false}` non occupa spazio: gli altri si dividono il suo spazio, e torna alla sua dimensione quando viene mostrato di nuovo.

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

<a id="handles"></a>

## Maniglie

C'è una maniglia su ogni confine tra due pannelli visibili: una banda spessa 9 punti lungo l'asse, centrata sul confine, con il cursore di ridimensionamento del suo asse. Sugli schermi touch la sua area di tocco si estende di altri 10 punti per lato, così anche una linea di un punto è facile da afferrare. La maniglia è un `group`: ciò che disegna è l'indicatore dell'app, stilizzato con `handleClass` / `handleStyle`: 1 punto di spessore e l'intera lunghezza del confine, quindi `bg-border` da solo è una linea sottilissima su entrambi gli assi, mentre `w-[3px]` o `h-[3px]` la ispessisce, e le sue classi `group-hover:` e `group-active:` seguono il puntatore sulla banda e la pressione o il trascinamento. Per qualcosa di più di una linea (un'impugnatura di puntini, un'icona), `renderHandle` renderizza il contenuto dell'indicatore, ricevendo `index`, `axis` e `state` della maniglia; viene ridisegnato quando lo stato cambia, poche volte per trascinamento, mai a ogni movimento. Un'impugnatura animata è il thumb della maniglia (`handleThumbClass` / `handleThumbStyle`): una vista centrata sulla linea, disegnata in verticale e ruotata di un quarto su una linea orizzontale, così una sola classe serve entrambi gli assi, e le classi `group-hover:` e `group-active:` la mostrano e ne gestiscono la transizione; la maniglia resta premuta per tutta la durata del trascinamento, ovunque vada il puntatore.

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

`disabled` mantiene ogni maniglia dov'è (un layout bloccato).

## Props

### ResizablePanelGroup

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `axis` | `h_resizable()`, `v_resizable()`, `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Affiancati (le maniglie si trascinano a sinistra e a destra) o impilati (in alto e in basso). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessun trascinamento: le maniglie restano dove sono. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | L'indicatore di ogni maniglia, sul confine nella banda della maniglia: 1 punto di spessore lungo l'asse e l'intera lunghezza del confine, salvo diversa indicazione (`w-[3px]`, `h-[3px]`); `group-hover:` e `group-active:` seguono la banda. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il thumb di ogni maniglia: un'impugnatura centrata sulla linea, disegnata in verticale come su una linea verticale e ruotata di un quarto su una orizzontale, così una sola classe serve entrambi gli assi. Resta la stessa vista mentre la maniglia è in hover, premuta e trascinata, quindi le classi `group-hover:` e `group-active:` ne gestiscono la transizione (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | nessuno | Il contenuto di ogni indicatore, ridisegnato quando cambia il `state` della maniglia. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | nessuno | Ciò che i lettori di schermo dicono per ogni maniglia: che cosa ridimensiona. Le regolano di 10 punti alla volta. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | I suoi `ResizablePanel`, figli diretti. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | `size-full` | Il gruppo stesso; riempie il suo genitore a meno che la sua classe non indichi altro. |

### ResizablePanel

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | nessuno | La lunghezza desiderata lungo l'asse del gruppo, in punti, entro `minSize` e `maxSize`; un nuovo valore lo ridimensiona. Senza valore, condivide lo spazio rimasto. |
| `minSize` | `.min_size(..)`, `.size_range(..)` | `number` | `100` | La dimensione minima. |
| `maxSize` | `.max_size(..)`, `.size_range(..)` | `number` | nessun limite | La dimensione massima. |
| `fixed` | `.fixed(..)` | `boolean` | `false` | Mantiene la propria dimensione quando il gruppo è troppo piccolo per i pannelli; trascinare la sua maniglia lo ridimensiona comunque. Accetta un `size`. |
| `visible` | `.visible(..)` | `boolean` | `true` | Se nascosto, non occupa spazio e gli altri si dividono il suo spazio. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il suo contenuto. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La superficie propria del pannello. La sua dimensione lungo l'asse è quella decisa dal gruppo. |

### ResizeHandleContext

| Campo | Tipo | Descrizione |
|---|---|---|
| `index` | `number` | Il confine dopo il pannello visibile in posizione `index`. |
| `axis` | `"horizontal" \| "vertical"` | L'asse lungo il quale ridimensiona. |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | Quanto si è spostato il puntatore o il dito insieme ad essa. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onResize` (`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | Un trascinamento è terminato e ha spostato una maniglia, oppure un lettore di schermo ne ha regolata una: `sizes`, la dimensione di ogni pannello visibile, nell'ordine in cui sono disposti (da sinistra a destra, dall'alto in basso). |
| `onResize` (`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | Un trascinamento è terminato e ha cambiato la dimensione di questo pannello: `size`, la nuova, da restituire come `size`. |

<a id="parts"></a>

## Parti

| Parte | Contenuta in | Stilizzata con | Stati |
|---|---|---|---|
| Il gruppo | | `ResizablePanelGroup` di `class`, `style` | |
| Un pannello | il gruppo | `ResizablePanel` di `class`, `style` | |
| L'indicatore di una maniglia | la banda della maniglia, su un confine | `handleClass`, `handleStyle`, `renderHandle` | `group-hover:` sotto un puntatore, `group-active:` mentre è premuta o trascinata; `state` in `renderHandle` |
| Il thumb di una maniglia | centrato sulla linea di una maniglia | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (premuto fino alla fine del trascinamento) |

<a id="accessibility"></a>

## Accessibilità

- Ogni maniglia è un elemento regolabile per i lettori di schermo, con `handleAccessibilityLabel` come etichetta. Il suo valore è la dimensione del pannello che la precede, entro il `minSize` e il `maxSize` di quel pannello.
- Scorrere verso l'alto o verso il basso su una maniglia con VoiceOver, oppure usare i tasti del volume di TalkBack, la sposta di 10 punti, come farebbe un trascinamento; il gruppo lo notifica con `onResize`. Le maniglie di un gruppo `disabled` restano dove sono.
- Il contenuto dei pannelli è dell'app e viene letto come in qualsiasi altro punto.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Desktop (macOS, Windows, Linux, GPUI) e web: il puntatore sopra una maniglia mostra il cursore di ridimensionamento di colonna o di riga, e un trascinamento con il mouse o il touchpad sposta il confine.
- iOS, Android e Mac Catalyst: un dito trascina la maniglia, all'interno di un'area di tocco più ampia di 10 punti per lato rispetto alla banda.
- Nei layout da destra a sinistra, i pannelli e le loro dimensioni seguono l'ordine del layout.
- Ogni piattaforma disegna ciò che l'app stilizza: gli indicatori e i pannelli.
- Le suddivisioni di [Dock](./dock.md) sono gruppi ridimensionabili: si ridimensionano allo stesso modo.
