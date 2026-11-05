---
title: "Scroll"
description: "La scroll view nativa: scorrimento verticale e orizzontale, paginazione e snapping, pull to refresh, zoom ed eventi di scroll."
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---

# Scroll

`Scroll` è una scroll view nativa (UIScrollView su iOS e Mac Catalyst, una ScrollView su Android). Dispone tutti i suoi
figli come contenuto e li fa scorrere in modo nativo: lo scorrimento, il fling, il rimbalzo e lo snapping vengono eseguiti dalla piattaforma, alla
frequenza del display. In Rust se ne crea una con `scroll()`, in TSX con `<Scroll>` da `nsh`.

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

Una scroll view crea tutti i figli, il che è adatto a pagine di dimensioni moderate. Per dati lunghi o illimitati usa una
[list](./list.md): crea le righe vicino al viewport e le ricicla.

Una scroll view ha bisogno di una dimensione limitata lungo il suo asse: assegnale `flex: 1` (`.flex_1()`) oppure un'altezza all'interno di un contenitore che
ne abbia una. Il suo contenuto viene disposto alla larghezza della scroll view (all'altezza, se è orizzontale) e con l'altezza (larghezza) che gli serve.

## Props

Oltre alle [common props](./index.md#common-props) (con `style` di tipo `ViewStyle`). In Rust, le props di scorrimento
sono metodi del trait `Scrollable`, che le list condividono.

### Scrolling

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | Scorre in orizzontale. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | L'utente può farla scorrere. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | L'indicatore di scorrimento è visibile: quello della piattaforma, oppure la [barra integrata](./scrollbar.md#built-in-bars) dell'app una volta impostato un tema; un oggetto è un tema proprio della vista. Su desktop e nei browser desktop una vista orizzontale lo mantiene: è la barra di scorrimento del mouse. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | Overscroll oltre i bordi. |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | Si ferma ai multipli del viewport. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | Si ferma ai multipli di questa lunghezza (0: disattivato). |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | Si ferma a questi offset. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | Quale punto di un elemento si allinea al viewport con `snapToInterval`. |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | Un fling si sposta al massimo di un punto di snap. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | piattaforma | Quanto velocemente rallenta un fling: la velocità mantenuta per millisecondo (`normal` 0.998, `fast` 0.99). |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | Spazio attorno al contenuto. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | Da dove parte. |
| `contentStyle` | gli stili propri della vista del contenuto | `ViewStyle` | | Lo stile di una vista attorno ai figli che scorre insieme a loro; `flexGrow: 1` la rende alta almeno quanto il viewport (uno stato vuoto centrato). |
| `contentClass` | gli stili propri della vista del contenuto | `string` | | Come classes, ad es. `"grow justify-center p-4"`. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | Indica se il trascinamento chiude la tastiera. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | Indica se un tap chiude la tastiera: `never` (il tap la chiude soltanto), `always` (rimane aperta), `handled` (rimane aperta se qualcosa gestisce il tap). |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | Un valore animato alimentato con l'offset di scorrimento (asse principale), per animazioni collegate allo scorrimento. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | Millisecondi minimi tra gli eventi `onScroll` (comunque al massimo uno per frame). |

### Pull to refresh

| Prop | Rust | Tipo | Descrizione |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | Lo spinner di aggiornamento è visibile. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | L'utente ha trascinato per aggiornare: avvia il caricamento e imposta `refreshing` finché non termina. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | L'app disegna un proprio indicatore, alto `height` punti: lo spinner della piattaforma è nascosto, un pull aggiorna una volta raggiunto `height`, e durante l'aggiornamento `height` resta sopra il contenuto. Un'altezza pari o inferiore a 0 equivale a nessuno. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | Un valore animato alimentato con quanto la vista è trascinata oltre il suo bordo superiore (0 a riposo, in crescita con il pull; lo spazio mantenuto sopra il contenuto durante l'aggiornamento: `height` con `refreshIndicator`), per l'indicatore dell'app. |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

### Zooming

Impostare `maximumZoomScale` sopra `minimumZoomScale` (`.zoom_range(min, max)` in Rust) rende il contenuto ingrandibile con un
pinch; con lo zoom attivo, scorre in entrambe le direzioni. Le list mantengono la loro scala.

| Prop | Rust | Tipo | Default | Descrizione |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Lo zoom minimo. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | Lo zoom massimo. |
| `zoomScale` | `.zoom(..)` | `number` | | Esegue lo zoom a questa scala quando cambia; altrimenti lo zoom dell'utente viene mantenuto. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | Il pinch può superare i limiti e poi torna indietro con un effetto elastico. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | L'utente può usare il pinch per lo zoom. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | Il contenuto più piccolo del viewport (con zoom ridotto) viene centrato. |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

<a id="events"></a>

## Eventi

| Evento | Rust | Payload | Quando |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | L'offset è cambiato (al massimo una volta per frame, e non più spesso di `scrollEventThrottle`). |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` (`Point<Points>`) | L'utente ha iniziato / smesso di trascinare. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | Uno scivolamento dopo il trascinamento è iniziato / terminato. Uno scivolamento interrotto da un nuovo trascinamento termina comunque con `onMomentumEnd`. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | Lo scorrimento si è fermato. |
| `onRefresh` | `.on_refresh` | nessuno | Trascinato per aggiornare. |

`ScrollEvent` è `{ offset: Point; contentSize: Size; size: Size; zoomScale }` (in Rust `offset`, `content_size`,
`size`, `zoom_scale`): l'offset, la dimensione del contenuto (con zoom), la dimensione del viewport e la scala di zoom (1 se la vista
non esegue zoom).

> [!TIP]
> Per spostare qualcosa in base alla posizione di scorrimento (un header che si restringe, un'immagine parallax), collega `scrollValue` a un valore
> nativo e interpolalo in uno stile. Viene eseguito sul thread della UI alla frequenza del display, mentre `onScroll` è un evento per
> frame nel codice dell'app. Vedi [animation](../docs/animation.md).

<a id="ref-methods"></a>

## Metodi del ref

| Metodo | Rust | Descrizione |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | Scorre fino a un offset. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | Esegue lo zoom a `scale` (limitato ai limiti) con il punto del contenuto (`x`, `y`, punti senza zoom) al centro del viewport, oppure attorno al centro. Ad es. un doppio tap che ingrandisce sul punto toccato. |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

<a id="keyboard"></a>

## Tastiera

Gli input all'interno di una scroll view vengono tenuti liberi dalla tastiera in modo nativo: la scroll view riceve un inset inferiore e scorre
da sola fino all'input con il focus. Per il contenuto fuori dalle scroll view usa [`env(keyboard-inset-height)`](./keyboard.md)
in un padding o margin inferiore. Vedi [forms and the keyboard](../docs/forms-and-keyboard.md).

<a id="right-to-left"></a>

## Da destra a sinistra

Le scroll view orizzontali partono dall'estremità destra nei layout da destra a sinistra e mantengono la loro distanza da essa quando il contenuto
cambia; i loro figli sono specchiati.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Android: il pull to refresh è disegnato da NSH (l'overscroll resta nativo), `contentInset` viene applicato come padding, e
  `decelerationRate` dà forma agli scivolamenti di snapping.
- Android esegue lo zoom con la scroll view propria di NSH, che scala il contenuto attorno all'angolo in alto a sinistra e scorre in entrambe le direzioni.
  I pinch iniziano dopo la distanza minima tra le dita di Android (circa 27 mm).
- Su Mac Catalyst (idioma Mac), NSH rileva il pull e mostra il proprio spinner.
- iOS ridisegna testi e canvas alla risoluzione dello zoom quando uno zoom termina.
