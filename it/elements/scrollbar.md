---
title: "Scrollbar"
description: "Il componente Scrollbar: una barra di scorrimento con l'aspetto proprio dell'app per ogni scroll view e lista (un tema impostato una sola volta) o per una sola, posizionata dove l'app preferisce, il cui thumb segue il contenuto e le cui azioni di trascinamento e pressione lo fanno scorrere, mostrata durante lo scorrimento, al passaggio del mouse o sempre, con dissolvenza in entrata e in uscita secondo i tempi dell'app."
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---

# Scrollbar

Una scrollbar dà a una scroll view o a una lista una barra con l'aspetto proprio dell'app: una sottile pillola che si allarga sotto il puntatore, una traccia nel tono del brand, una barra accanto a un'intestazione fissa o lungo due pannelli. Impostata una volta come tema dell'app, ogni scroll view e ogni lista ne disegna una al posto dell'indicatore della piattaforma ([Barre integrate](#built-in-bars)); posizionata dall'app, indica la scroll view che muove e si trova dove l'app la mette. Gestisce da sé il proprio comportamento: la lunghezza e la posizione del thumb seguono il contenuto, il viewport e l'offset (anche mentre una lista cresce o la finestra viene ridimensionata); trascinare il thumb fa scorrere il contenuto, e una pressione sulla traccia porta lì il centro del thumb; compare mentre il contenuto scorre, mentre il puntatore è sopra di essa, oppure sempre, e appare e scompare con dissolvenze native. L'aspetto e le tempistiche spettano all'app: una `Scrollbar` non ha colori, dimensioni o raggi propri, e le sue dissolvenze non richiedono tempo finché l'app non gliene assegna.

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

`Scrollbar` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. In Rust, `scrollbar()` ne crea una con un setter per ogni prop (`.scroll(..)`, `.thumb_style(..)`) e i metodi di stile tipizzati per la barra stessa; il suo `scroll` accetta un `ElementRef` (o un `ScrollbarTarget`).

<a id="built-in-bars"></a>

## Barre integrate

Ogni scroll view e ogni lista può disegnare una `Scrollbar` al posto dell'indicatore della piattaforma, senza alcuna barra da posizionare: `Scrollbar.setTheme` dà l'aspetto dell'app alla barra di ogni vista il cui `scrollbar` è `true`, una sola volta, ovunque l'app si avvii. Ogni vista ottiene una propria barra sopra il suo viewport, che vi resta mentre il contenuto scorre (sul main thread, come avviene per le sticky view) e viene disegnata sopra il contenuto; segue, scorre e si dissolve come fa una `Scrollbar` posizionata.

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

Un `ScrollbarTheme` contiene le prop della barra che sono uguali per ogni vista e l'aspetto di ciascun asse:

| Campo | Tipo | Predefinito | Descrizione |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Quando compaiono le barre: [Quando compare](#when-it-shows). |
| `motion` | `ScrollbarMotion` | scatto, `idle` `2000` | Come compaiono e scompaiono: [Movimento](#motion). |
| `minThumbLength` | `number` | `48` | La lunghezza minima di un thumb. |
| `vertical`, `horizontal` | `ScrollbarLook` | nessuno | L'aspetto delle barre delle viste verticali e orizzontali: `class` e `style` per la traccia, posizionata nel viewport della vista; `thumbClass` e `thumbStyle`; `accessibilityLabel`. Una vista il cui asse non ha un aspetto mantiene l'indicatore della piattaforma. |

Un `setTheme` successivo ridefinisce lo stile delle barre, e `Scrollbar.setTheme(null)` restituisce alle viste l'indicatore della piattaforma. Una singola vista può avere un tema proprio tramite la prop `scrollbar` (`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`), che l'app ne abbia impostato uno o no; `scrollbar={false}` lascia una vista senza barra. Una lista disposta nel viewport del suo genitore (`viewport="parent"`) scorre con quella vista e con la sua barra. Anche un `Input` multilinea ottiene la barra del proprio aspetto verticale, sopra il testo, che fa scorrere come farebbe l'indicatore proprio della vista di testo.

<a id="the-scroll-view-it-moves"></a>

## La scroll view che muove

`scroll` indica la scroll view o la lista che la barra segue: il suo `ref`. La barra la trova una volta che è sullo schermo, quindi il `ref` può essere impostato da un elemento successivo nello stesso render; scrivi la barra dopo la sua scroll view (oppure conserva il `ref` in un signal). Disattiva l'indicatore proprio della scroll view con `scrollbar={false}`, e posiziona la barra con `class`: sul bordo della scroll view in un box `relative` che le racchiude entrambe, o in qualsiasi altro punto dello schermo.

- Il thumb è lungo quanto la quota di contenuto mostrata dal viewport, lungo il content box della traccia (all'interno del suo padding), e non più corto di `minThumbLength`. La sua posizione indica quanto il contenuto è scorso; mentre il contenuto rimbalza oltre un'estremità, il thumb resta a quell'estremità.
- Un trascinamento del thumb fa scorrere il contenuto di quanto si muove il thumb. Una pressione sulla traccia porta il centro del thumb sotto il puntatore, e il trascinamento prosegue da lì.
- Una barra verticale segue una scroll view verticale; `axis="horizontal"` crea una barra per una orizzontale (posizionala lungo il bordo inferiore). Una barra per asse.
- Le liste funzionano allo stesso modo: il thumb segue l'intera lunghezza della lista man mano che le righe vengono misurate e aggiunte.

<a id="when-it-shows"></a>

## Quando compare

| `mode` | Compare |
|---|---|
| `"scrolling"` (predefinito) | Mentre il contenuto scorre, e fino a `motion.idle` dopo che si ferma; il puntatore sulla barra mentre è visibile la mantiene visibile. |
| `"hover"` | Mentre il puntatore è sopra la barra (dove compare, anche mentre è nascosta), e come fa `"scrolling"`. |
| `"always"` | Sempre. |

In ogni modalità compare mentre il suo thumb viene trascinato, e resta per `motion.idle` dopo l'ultimo scorrimento, trascinamento o hover. Finché il contenuto sta nel viewport, resta nascosta. Quando è nascosta, la barra è a `opacity: 0` e lascia passare le pressioni a ciò che le sta sotto.

<a id="motion"></a>

## Movimento

`motion` regola i tempi delle dissolvenze della barra, che vengono eseguite in modo nativo, come fa `ScrollbarMotion` di `gpui-base`:

| Campo | Predefinito | Descrizione |
|---|---|---|
| `idle` | `2000` | Per quanto la barra resta visibile dopo l'ultimo scorrimento, trascinamento o hover, in millisecondi. |
| `enter` | `0` | Quanto impiega ad apparire: la sua opacità cresce in modo lineare, uno slide usa un easing in uscita. |
| `exit` | `0` | Quanto impiega a dissolversi una volta terminato `idle`, con easing in entrata; mentre si dissolve esce scorrendo dalla sua traccia. |
| `entrance` | `"fade"` | Come entra: `"fade"` sul posto, oppure `"slideAndFade"` dal bordo su cui si trova (destra, basso). |
| `thumbHoverEntrance` | `"fade"` | Come entra quando il puntatore sul suo thumb nascosto la fa comparire (`"hover"`). |

Senza durate la barra compare e scompare di scatto. Una dissolvenza invertita a metà mantiene la propria velocità: dura per la quota della sua durata ancora da percorrere. Una barra `"always"` non viene mai animata, e nessuna lo è mentre l'utente chiede meno movimento. La traccia ritaglia ciò che scorre. Il movimento proprio del thumb, come una larghezza che cresce con `hover:`, spetta al suo stile (`transition-all` su `thumbClass`).

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | nessuno | La scroll view o la lista che la barra segue e muove (il suo `ref`). |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | L'asse della scroll view: la traccia corre lungo di esso. Letto quando la barra viene creata. |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | Quando la barra compare. |
| `motion` | `.motion(..)` | `ScrollbarMotion` | scatto, `idle` `2000` | Come compare e scompare: [Movimento](#motion). |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | La lunghezza minima del thumb su un contenuto lungo, così resta facile da afferrare. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | nessuno | Il thumb. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che gli screen reader dicono della barra. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La barra: la sua traccia, dove l'app la posiziona. |

<a id="parts"></a>

## Parti

| Parte | Dentro | Stile con |
|---|---|---|
| La traccia | dove l'app la posiziona | `class`, `style` |
| Il thumb | il content box della traccia | `thumbClass`, `thumbStyle` |

La barra dimensiona il thumb lungo l'asse e lo muove; il suo spessore e la sua posizione attraverso la traccia spettano all'app (`w-1.5` e `items-end` sulla traccia pongono un thumb di 6 punti a destra). Il padding della traccia tiene il thumb lontano dalle sue estremità e dai suoi lati.

Gli stati che le parti mostrano:

- La traccia: `hover:` sotto il puntatore; è un `group`, quindi il thumb ottiene `group-hover:` da essa (un thumb che si allarga quando il puntatore si avvicina).
- Il thumb: `hover:` sotto il puntatore, `active:` mentre viene trascinato.

La visibilità della barra è la sua opacità: applica la trasparenza dei colori allo sfondo della traccia o al thumb. Un thumb che si allarga usa `transition-all` (che non ritarda mai la posizione del thumb, impostata dalla barra indipendentemente dagli stili del thumb), e `motion-reduce:` lo mantiene fermo per le persone che chiedono meno movimento.

<a id="accessibility"></a>

## Accessibilità

- La scroll view resta ciò che gli screen reader fanno scorrere: la muovono con i propri gesti e ne leggono il contenuto.
- La barra è etichettata da `accessibilityLabel` per gli screen reader che la raggiungono.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e azioni in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Ogni piattaforma disegna ciò che l'app stila, e il thumb segue l'offset che ogni piattaforma riporta per la scroll view. I trascinamenti del thumb e le pressioni sulla traccia funzionano con un mouse, una penna o un dito.
- `"hover"` segue un puntatore di mouse o touchpad (desktop e web); su un touch screen la barra compare mentre il contenuto scorre, e la sua traccia nascosta lascia passare i tocchi.
