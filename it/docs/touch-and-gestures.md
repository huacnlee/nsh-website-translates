---
title: "Tocco e gesti"
description: "Pressioni e feedback della pressione, aree di hit, eventi del puntatore, tocchi raw, sistema dei responder, PanResponder e gesti nativi di pan, pinch e rotazione."
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---

# Tocco e gesti

NSH ha tre livelli di gestione del tocco. Le **pressioni** (`.on_press` in Rust, `onPress` in TSX e i loro analoghi) coprono pulsanti, righe e link, con il feedback di pressione disegnato in modo nativo. I **gesti nativi** (pan, pinch e rotazione) muovono dei [valori animati](./animation.md#animated-values) sul thread UI, quindi una card trascinata segue il dito anche mentre il tuo codice è occupato. I **tocchi grezzi e il sistema dei responder** (`.on_touch` e `.claim_touches` con i gestori `.on_responder_*` in Rust; `onTouchStart`, `onResponderMove` e `PanResponder` in TSX) danno al tuo codice la posizione di ogni dito per tutto ciò che gli altri due livelli non possono esprimere, come il disegno.

Scegli il livello più alto che svolge il compito: più il livello è alto, meno lavoro passa dal thread UI al tuo codice.

<a id="presses"></a>

## Pressioni

Ogni elemento accetta i gestori di pressione; non esiste un componente "touchable" separato. Metti `.on_press` / `onPress` su una view, un testo, un'immagine o qualsiasi altro elemento.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | Predefinito | Descrizione |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | Il dito si è sollevato all'interno della view (dopo una pressione, non una pressione lunga). |
| `.on_long_press(..)` | `onLongPress` | | Il dito è rimasto premuto per il ritardo della pressione lunga. Il gestore di pressione non viene chiamato. |
| `.on_press_down(..)` | `onPressDown` | | La pressione è iniziata. |
| `.on_press_up(..)` | `onPressUp` | | La pressione è terminata: dito sollevato, scivolato fuori o rilevato da una scroll view. |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | Millisecondi prima che una pressione diventi una pressione lunga. |
| `.disabled(..)` | `disabled` | `false` | Non accetta pressioni e non mostra feedback; applica lo stile disabilitato; gli screen reader lo annunciano come disabilitato. |

Come si comportano le pressioni:

- **Risponde solo la view pressabile più interna.** Una riga pressabile che contiene un pulsante pressabile non riceve la pressione quando si preme il pulsante.
- **All'interno di una scroll view, la pressione attende circa 130 ms** prima di iniziare (e di mostrare il feedback), così un trascinamento che parte da un pulsante scorre invece di premerlo.
- **Scivolare fuori annulla.** Spostare il dito fuori dalla view termina la pressione con il gestore di rilascio e senza alcuna pressione.
- **Disabilitare rimuove i listener di pressione** da ciò che è montato, quindi la view non mostra alcun feedback e si applica lo stile disabilitato (`.disabled_style(..)`, `class="disabled:opacity-40"`).
- **Gli span di testo annidati con un gestore di pressione sono link.** Il paragrafo è una singola view nativa; la pressione va allo span sotto il dito. Vedi [Text](./text.md).

<a id="press-feedback"></a>

## Feedback di pressione

Il feedback di pressione è dell'app: sono gli stili che la view assume mentre è premuta, sotto il puntatore, con il focus o disabilitata. Vengono applicati in modo nativo nel momento in cui lo stato cambia, senza andata e ritorno verso il tuo codice. Ogni stato ha un metodo Rust, una prop di stile TSX e una [variante Tailwind](./tailwind.md):

| Rust | Prop TSX | Classe | Descrizione |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | Mentre è premuta. |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | Mentre un puntatore si trova sopra di essa (desktop, puntatori su iPad, browser). |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | Mentre ha il focus. |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | Mentre essa o una view al suo interno ha il focus: la cornice di un campo attorno all'input che modifica. |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | Mentre è disabilitata. |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | Il ripple material di Android (`color`, `borderless`, `radius`, `foreground`), in aggiunta agli stili. |

Gli stili di stato si sovrappongono agli stili propri della view. Gli stati successivi prevalgono (hover, focus, active), lo stile disabilitato prevale su tutti e gli altri non si applicano mentre la view è disabilitata.

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

Un ripple senza bordo si espande fuori dalla view, il che si adatta ai pulsanti con icona: `Ripple { borderless: true, radius: Some(px(24.0)), .. }`, `android={{ ripple: { borderless: true, radius: 24 } }}`. Vedi [Codice specifico per piattaforma](./platform-specific.md).

Con una transizione (`.transition()`, la classe `transition`) il cambio di stato è animato. `.group()` (la classe `group`) rende una view un gruppo, e `.group_active(..)` (`group-active:`) stilizza i suoi figli mentre è premuta:

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## Aree di tocco: hitSlop

Lo hit slop (`.hit_slop(..)`, `hitSlop`) estende l'area che accetta i tocchi oltre i limiti della view, senza modificarne il layout. Usalo per bersagli piccoli come pulsanti di chiusura e interruttori.

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | Descrizione |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | Punti aggiunti attorno ai limiti. `EdgeInsets::all(..)` e un numero in TSX si applicano a tutti e quattro i lati. |

Mantieni l'area estesa all'interno dei limiti del genitore (lascia un po' di margin o padding attorno alla view piccola): l'hit testing raggiunge un figlio attraverso il suo genitore, quindi un tocco fuori dal genitore non arriva mai allo slop del figlio.

<a id="children-outside-their-parent"></a>

## Figli fuori dal genitore

Un figlio posizionato fuori dai limiti del suo genitore (posizionato in modo assoluto con `overflow` lasciato visibile, come un dropdown sotto il suo campo) accetta i tocchi dove viene disegnato, come qualsiasi altra view: NSH esegue in modo nativo l'hit test dei discendenti che escono dai limiti di una view. Un genitore che ritaglia l'overflow li ritaglia, e in quel caso non vengono mostrati né accettano tocchi in quell'area. L'area è calcolata dal layout, quindi un figlio spostato fuori dal genitore da una transform accetta i tocchi solo all'interno dei limiti del genitore.

Attenzione all'ordine di disegno: un dropdown viene disegnato sopra i fratelli del suo campo solo se il campo viene dopo di loro o ha un `z-index` più alto, e i tocchi vanno a ciò che è disegnato sopra.

## pointerEvents

La chiave di stile `pointerEvents` (`.pointer_events(..)` in Rust) decide quali view di un sottoalbero possono essere il bersaglio di un tocco. Viene valutata in modo nativo durante l'hit testing, quindi non costa nulla per ogni tocco.

| Rust | TSX | La view | I suoi figli |
|---|---|---|---|
| `PointerEvents::Auto` (predefinito) | `"auto"` | Accetta i tocchi | Accettano i tocchi |
| `PointerEvents::None` | `"none"` | Mai il bersaglio | Mai il bersaglio, a meno che uno imposti `"auto"`: i tocchi passano a ciò che sta dietro |
| `PointerEvents::BoxNone` | `"box-none"` | Mai il bersaglio | Accettano i tocchi |
| `PointerEvents::BoxOnly` | `"box-only"` | Accetta i tocchi | Mai il bersaglio |

Gli usi tipici: un overlay che non deve bloccare ciò che c'è sotto (none), un contenitore a schermo intero il cui spazio vuoto deve lasciar passare i tocchi al contenuto dietro mentre i suoi pulsanti continuano a funzionare (box-none), e una riga che deve ricevere una pressione anche quando il dito cade su un figlio (box-only).

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"` viene ereditato come `pointer-events` in CSS: una view al suo interno che imposta `"auto"` torna ad accettare i tocchi. `"box-none"` e `"box-only"` si applicano alla view che li imposta. Le classi Tailwind `pointer-events-none` e `pointer-events-auto` impostano `"none"` e `"auto"`, e come chiave di stile `pointerEvents` accetta anche stili di stato (`activeStyle`, ...) e varianti.

<a id="native-gestures-pan-pinch-and-rotation"></a>

## Gesti nativi: pan, pinch e rotazione

Per trascinamenti, pinch e rotazioni che spostano qualcosa sullo schermo, associa dei [valori animati](./animation.md#animated-values) al gesto. Il riconoscitore di gesti della piattaforma scrive i valori sul thread UI e le view associate ad essi si muovono nello stesso frame; il tuo codice viene avvisato quando il gesto inizia e termina.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | Descrizione |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | I trascinamenti con un dito muovono questi valori, in punti. |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | I pinch con due dita guidano `scale` (un fattore). |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | Le rotazioni con due dita guidano `angle`, in gradi. |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | Il trascinamento è iniziato / terminato, con un `PanEvent`. |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | Il pinch è iniziato / terminato: la sua scala e velocità (`GestureEvent`). |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | La rotazione è iniziata / terminata: il suo angolo (Rust: `GestureEvent<Radians>`) e la velocità. |

Un evento pan contiene la traslazione (`translation`, un `Point`: punti dall'inizio), la velocità (`velocity_x` / `velocity_y`; TSX: `velocity`, un `Point`: punti al **secondo**) e i valori associati in quel momento (`value_x` / `value_y`; TSX: `value`, `{ x?, y? }` con gli assi che `pan` associa).

Cosa fa per te il lato nativo:

- **Un trascinamento continua da dove si trova il valore.** All'inizio i valori vengono letti e la traslazione viene sommata ad essi; afferrare un valore ancora in animazione (una molla che sta tornando a casa) ferma l'animazione dov'è.
- **Un solo asse lascia scorrere l'altro.** Con un solo valore orizzontale associato il trascinamento inizia solo quando il dito si muove più in orizzontale che in verticale, quindi una riga con swipe orizzontale dentro una scroll view verticale continua a scorrere in verticale. Questa decisione viene presa in modo nativo quando il sistema chiede se il gesto può iniziare.
- **Pan, pinch e rotazione funzionano insieme** sulla stessa view: una card può essere trascinata, pizzicata e ruotata contemporaneamente.
- **Velocità di rilascio per la fisica.** La velocità alla fine del pan alimenta direttamente la velocità di una molla o di un decadimento; i valori ti permettono di scegliere un punto di aggancio.

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> Associa i valori animati al gesto invece di seguirlo tramite il responder ogni volta che il trascinamento si limita a spostare elementi. Con i valori associati, il codice dell'app occupato non può far scattare il trascinamento; con il responder, ogni movimento è un evento verso il tuo codice e un aggiornamento di ciò che la view mostra.

<a id="raw-touches"></a>

## Tocchi grezzi

I gestori dei tocchi riportano ogni dito mentre si appoggia, si muove e si solleva. Sono utili per il logging, l'hit testing personalizzato e per reagire al multi-touch; non rivendicano il tocco (le pressioni e le scroll view continuano a funzionare).

In Rust, `.on_touch(..)` riceve ogni fase come un `TouchEvent`: il suo `phase` (`TouchPhase::Start`, `Move`, `End`, `Cancel`), il suo `timestamp` e il suo `points`, ogni dito appoggiato, ciascuno con il proprio `id`, la propria `location` nella view su cui si è appoggiato, la propria posizione `page` nella surface, e `changed` per le dita a cui si riferisce l'evento. In TSX, ogni fase ha il proprio gestore:

| TSX | Descrizione |
|---|---|
| `onTouchStart` | Un dito si è appoggiato sulla view o al suo interno. |
| `onTouchMove` | Un dito si è mosso. I movimenti vengono uniti per ogni turno del motore. |
| `onTouchEnd` | Un dito si è sollevato. |
| `onTouchCancel` | Il sistema ha preso il tocco (una scroll view ha iniziato a scorrere, è arrivata una chiamata). |
| `onTouchStartCapture`, `onTouchMoveCapture`, `onTouchEndCapture`, `onTouchCancelCapture` | Gli stessi, chiamati dall'esterno verso l'interno, prima dei gestori di bubbling. |

Ogni gestore TSX riceve un `GestureResponderEvent`:

| Campo | Descrizione |
|---|---|
| `identifier` | Identifica il dito finché è appoggiato. |
| `locationX`, `locationY` | Posizione nella view su cui il dito si è appoggiato (`target`). |
| `pageX`, `pageY` | Posizione nella surface. |
| `target` | L'id della view su cui il dito si è appoggiato. |
| `timestamp` | Millisecondi. |
| `touches` | Ogni dito appoggiato. |
| `changedTouches` | Le dita a cui si riferisce questo evento. |
| `nativeEvent` | L'evento stesso, quindi funziona anche `e.nativeEvent.locationX`. |
| `stopPropagation()` | Le view più esterne non vedono questo evento di tocco. |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### Dove si trova una view: measure

La posizione di un tocco è relativa alla view su cui il dito si è appoggiato, che può essere un figlio della view che ti interessa (il cursore di uno slider). Misurare una view ti dice dove si trova, così puoi usare invece la posizione nella pagina. In Rust, metti un `element_ref()` sulla view e attendi il suo `measure()`; in TSX, chiama `measure()` sul suo ref:

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

Si risolve una volta che le modifiche fatte finora sono state impaginate: in Rust in un `Measurement` (`frame`, il frame nel genitore come lo riporta il gestore del layout, e `page`, l'angolo in alto a sinistra), in TSX in `{ bounds, pagePosition }`. L'angolo è nella surface, o nel dialog in cui si trova la view, le stesse coordinate delle posizioni nella pagina dei tocchi. Gli offset delle scroll view e delle liste che la circondano vengono presi in considerazione; le transform (animazioni incluse) no. Si risolve in `None` / `null` per una view che non è sullo schermo.
<a id="the-responder-system"></a>

## Il sistema responder

Quando il tuo codice deve gestire in prima persona una sequenza di tocchi (disegno con il dito, uno slider personalizzato, un gesto che i recognizer nativi non offrono), usa il sistema gesture responder. Una vista alla volta è il **responder** e riceve i movimenti; le viste negoziano chi debba esserlo.

Diventare il responder:

| Rust | TSX | Descrizione |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` che restituisce `true` | Richiesto quando un dito tocca lo schermo, dal bersaglio verso l'esterno. |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` che restituisce `true` | Richiesto a ogni movimento finché non c'è un responder (o per subentrare). |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | Come sopra, ma richiesto dall'esterno verso l'interno, prima di quelli in bubbling. Un genitore lo usa per sottrarre un tocco ai figli. |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | La versione per il movimento. |

Una richiesta viene decisa dalla sola vista, senza eseguire il tuo codice, a meno che non lo chiami in causa: `TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` la effettua quando il listener chiama `r.claim()`, decidendo in base al gesto compiuto finora (`r.event.gesture`). Gli handler TSX ricevono il gesto come secondo argomento, `gestureState`, con gli stessi campi di quello di [PanResponder](#panresponder) (`dx`, `dy`, `vx`, `vy`, `moveX`, `moveY`, `x0`, `y0`, `numberActiveTouches`). Uno swipe che rivendica solo i movimenti orizzontali: `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`. Questa decisione arriva comunque con un movimento di ritardo, quindi una scroll view circostante potrebbe iniziare a scorrere per prima; per i trascinamenti all'interno delle scroll view usa la [pan activation](#pans-inside-scroll-views-panactivation).

Durante la risposta:

| Rust | TSX | Descrizione |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | Questa vista è ora il responder. Per impostazione predefinita Rust impedisce alle scroll view native di prendere i tocchi (`TouchClaim::block_native(false)` glielo consente); in TSX, per questo restituisci `true`. |
| `.on_responder_reject(..)` | `onResponderReject` | Un'altra vista è il responder e non intende cederlo. |
| `.on_responder_start(..)` | `onResponderStart` | Un altro dito ha toccato lo schermo. |
| `.on_responder_move(..)` | `onResponderMove` | Un dito si è mosso. |
| `.on_responder_end(..)` | `onResponderEnd` | Un dito si è sollevato. |
| `.on_responder_release(..)` | `onResponderRelease` | L'ultimo dito si è sollevato: il gesto è terminato. |
| `.keep_touches(true)` | `onResponderTerminationRequest` che restituisce `false` | Un'altra vista vuole i tocchi: mantienili (per impostazione predefinita vengono ceduti). |
| `.on_responder_terminate(..)` | `onResponderTerminate` | Un'altra vista, o un gesto nativo, ha preso i tocchi. |

Il responder di un componente Rust resta premuto dalla concessione fino al termine dei suoi tocchi, ovunque vada il dito o il puntatore, come `:active` di CSS resta attivo finché il pulsante non viene rilasciato: i suoi stili `.active(..)` e le classi `group-active:` al suo interno mantengono il loro aspetto per tutto il trascinamento (una maniglia di ridimensionamento trascinata fuori dalla propria fascia).

Gli handler Rust ricevono un `ResponderEvent`: il `location` del dito nella vista su cui ha toccato lo schermo, la sua posizione `page`, il `timestamp` e il `gesture` dalla concessione.

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

Come funziona: una vista con un qualsiasi handler di tocco o di responder ascolta i tocchi in modo nativo; la piattaforma riporta i tocchi su di essa (e al suo interno) insieme al percorso delle viste in ascolto, e la negoziazione avviene nel core Rust di NSH, che interroga le richieste e chiama i tuoi handler in ordine: prima le capture dalla vista più esterna verso l'interno, poi le altre dal bersaglio verso l'esterno. Ne derivano due conseguenze:

- **Le scroll view native e i responder competono.** Finché un responder le blocca, le scroll view circostanti smettono di prendere i tocchi fino alla sua conclusione. Se una scroll view nativa inizia a trascinare per prima, vince: il responder riceve l'handler di terminazione e gli handler di tocco ricevono un annullamento.
- **Ogni movimento è un evento per il tuo codice.** I trascinamenti guidati dal responder sono fluidi quanto è veloce il tuo codice; per i trascinamenti che si limitano a spostare viste, preferisci i [valori associati](#native-gestures-pan-pinch-and-rotation).

## PanResponder

In Rust, gli eventi del responder trasportano già il gesto: `ResponderEvent::gesture` è un `PanGesture` con la distanza dall'inizio, la velocità e il numero di dita. In TSX, `PanResponder` da `nsh` incapsula il sistema responder e aggiunge lo stesso stato del gesto; applica con lo spread il suo `panHandlers` su una vista.

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

Lo stato del gesto:

| Rust (`PanGesture`) | TSX (`gestureState`) | Descrizione |
|---|---|---|
| | `stateID` | Identifica il gesto. |
| `position` | `moveX`, `moveY` | L'ultima posizione del centroide dei tocchi, in punti della superficie. |
| `origin` | `x0`, `y0` | Dove si trovava il centroide quando il responder è stato concesso. |
| `delta` | `dx`, `dy` | Distanza percorsa dalla concessione. |
| `vx`, `vy` | `vx`, `vy` | Velocità, in punti al secondo. |
| `active_touches` | `numberActiveTouches` | Dita appoggiate. |

`PanGesture::begin` e `PanGesture::update` seguono un gesto a partire dai tocchi grezzi (`.on_touch`) in Rust. Le callback TSX ricevono `(event, gestureState)`: `onStartShouldSetPanResponder(Capture)`, `onMoveShouldSetPanResponder(Capture)`, `onPanResponderGrant`, `onPanResponderReject`, `onPanResponderStart`, `onPanResponderMove`, `onPanResponderEnd`, `onPanResponderRelease`, `onPanResponderTerminate`, `onPanResponderTerminationRequest` e `onShouldBlockNativeResponder`. L'ultimo ha come valore predefinito `true`: un PanResponder concesso impedisce alle scroll view native di prendere i suoi tocchi.

<a id="pans-inside-scroll-views-panactivation"></a>

## Pan all'interno delle scroll view: panActivation

Un grafico scorso lateralmente all'interno di una scroll view verticale deve prendere i trascinamenti orizzontali e lasciare quelli verticali alla scroll view. Rivendicare il tocco all'inizio blocca lo scorrimento fin dal primo pixel, e decidere sui movimenti nel tuo codice è troppo tardi: quando risponde, la scroll view potrebbe aver già preso il tocco. La pan activation (`TouchClaim::on_pan(..)`, `panActivation`) lascia decidere alla piattaforma sul main thread, mentre il dito si muove:

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust (`PanActivation`) | TSX | Descrizione |
|---|---|---|
| `active_offset_x`, `active_offset_y` | `activeOffsetX`, `activeOffsetY` | Il pan si attiva quando il dito si è spostato, lungo quell'asse, più di questo valore rispetto al punto in cui ha toccato lo schermo (in entrambe le direzioni, in punti). |
| `fail_offset_x`, `fail_offset_y` | `failOffsetX`, `failOffsetY` | Il pan fallisce quando il dito si è spostato più di questo valore per primo: le scroll view mantengono i tocchi. |

`PanActivation::horizontal(active, fail)` e `PanActivation::vertical(active, fail)` impostano le coppie più comuni. Senza offset attivi, il pan si attiva dopo 10 punti in qualsiasi direzione. Finché non si attiva, le scroll view circostanti lo attendono (iOS) e le altre richieste della vista non vengono interrogate. Quando si attiva, le scroll view non possono più prendere questi tocchi e la vista diventa il responder (la concessione, poi i movimenti); quando fallisce, la scroll view scorre normalmente. In TSX, anche i `panHandlers` di `PanResponder` funzionano con essa: applicali con lo spread accanto alla prop, e `onPanResponderGrant` viene eseguito all'attivazione.

> [!NOTE]
> Ogni velocità è in punti al secondo: `vx` / `vy` del gesto del responder, la velocità di un pan e quella di una spring o di un decay, quindi `vx` passa a una spring o a un decay così com'è.

<a id="why-some-answers-are-props"></a>

## Perché alcune risposte sono prop

Il main thread non attende mai il tuo codice. Quando il sistema ha bisogno di una risposta immediata (questo gesto pan può iniziare, questo punto colpisce la vista, questo tap deve chiudere la tastiera), NSH risponde in modo nativo in base a ciò che è stato montato in precedenza: i valori pan associati (i loro assi), il valore pinch, lo hit slop, i pointer events, l'impostazione dei tap sulla tastiera delle scroll view, la pan activation. I tuoi handler vengono a sapere solo in seguito di ciò che è accaduto. Per questo si tratta di impostazioni dichiarative anziché di callback, e per questo la negoziazione del responder, che esegue il tuo codice, decide soltanto tra responder e non blocca mai un gesto nativo.

<a id="related"></a>

## Vedi anche

- [`View`](../elements/view.md): ogni prop di tocco dell'elemento di base.
- [Animation](./animation.md): valori animati, spring e decay per il movimento guidato dai gesti.
- [Scrolling](./scrolling.md): l'impostazione dei tap sulla tastiera, le scroll view e i gesti annidati.
- [`PanResponder`](../modules/nsh.md#panresponder): il riferimento di `PanResponder`.
- [Accessibility](./accessibility.md): le viste pressable sono elementi di accessibilità; assegna loro un ruolo e un'etichetta.
