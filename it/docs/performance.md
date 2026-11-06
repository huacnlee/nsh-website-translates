---
title: "Prestazioni"
description: "Come NSH mantiene veloci le app (app Rust, un runtime nativo, attraversamenti raggruppati, animazioni native, liste virtualizzate), cosa significa per il tuo codice e come misurare sia in modalità headless sia a schermo."
order: 62
group: tools
source_hash: f8f220699bc54685
---

# Performance

La performance è la prima priorità di NSH, e la maggior parte delle scelte è presa dal framework e non dalla tua app: il runtime è nativo, ogni aggiornamento attraversa i thread una sola volta, le animazioni e la virtualizzazione delle liste girano senza JS, e un'app scritta in Rust non esegue alcun JS. Questa pagina spiega le regole che NSH segue, cosa significano per il codice che scrivi, sia in Rust sia in TSX, e come misurare.

<a id="the-rules"></a>

## Le regole

<a id="1-js-does-as-little-as-possible"></a>

### 1. JS fa il minimo indispensabile

**Un'app scritta in Rust è codice nativo dall'inizio alla fine**: i suoi componenti, il suo stato e i suoi handler sono compilati con il motore di NSH e non gira alcun interprete ([Building with Rust](./rust.md)). È il modo più veloce di scrivere un'app, e quello da scegliere per la logica di business più esigente.

In un'app TSX, QuickJS è un interprete: piccolo, rapido all'avvio, ma molto più lento del codice nativo per i lavori pesanti. Per questo in NSH **solo il codice della tua app è JS**. Il grafo reattivo (signal, valori computed, effect), il renderer che il tuo JSX compilato chiama, il motore di layout, la virtualizzazione delle liste, le animazioni e ogni modulo che importi sono Rust. Parsing, diffing, layout ed elaborazione delle stringhe avvengono in modo nativo.

L'effetto è misurabile. La stessa app contatore sul precedente runtime JS di NSH e sul runtime nativo (build release):

| | Runtime JS precedente | Runtime nativo |
|---|---|---|
| Dimensione del bundle | 14 KB JS / 19.6 KB bytecode | 886 B JS / 1.7 KB bytecode |
| Valutazione del bundle | ~390 µs | ~95 µs |
| Tempo JS di un tap (mediana) | ~14 µs | ~5 µs |
| Commit di un tap | ~22 µs | ~15 µs |
| Scorrimento di una lista da 1000 righe, JS per frame di rebinding | ~150 µs | ~77 µs |

Lo stesso vale per i componenti: un pulsante scritto come componente Rust a confronto con un pulsante TSX equivalente, 200 istanze:

| | Pulsante Rust: JS / core | Pulsante TSX: JS / core |
|---|---|---|
| Primo frame (ops) | 1.32 ms / 0.77 ms (1015) | 2.32 ms / 0.70 ms (2415) |
| Aggiornamento di tutti i 200 titoli (ops) | 0.42 ms / 0.42 ms (200) | 0.77 ms / 0.36 ms (600) |

(Misurato su Apple silicon; la seconda tabella sul runtime precedente. Entrambe provengono dalle baseline di performance di NSH.)

**Per il tuo codice:** mantieni leggeri gli event handler e i valori computed. Il calcolo pesante (parsing di payload grandi, ordinamento di migliaia di elementi a ogni tasto premuto) costa in QuickJS più di quanto potresti essere abituato in V8 o JavaScriptCore con un JIT. Eseguilo una sola volta, mettilo in cache in un `computed`, oppure spostalo fuori dal percorso dell'interazione.

<a id="2-cross-threads-in-batches"></a>

### 2. Attraversa i thread in batch

Il codice della tua app, Rust o JS, gira su un thread del motore, mai sul thread principale. Un turno, ad esempio un event handler con tutto ciò che modifica, diventa **un solo commit**: il runtime esegue il render dei componenti, il layout, il diff e produce un unico batch di operazioni native sulle view, che raggiunge il thread principale in **un solo passaggio**. Non c'è un messaggio di bridge per ogni view né una serializzazione per ogni prop.

**Per il tuo codice:** non hai bisogno di raggruppare le scritture per ragioni di performance; dieci chiamate a `set` in un handler producono comunque un solo commit, in Rust e in TSX. Usa `batch` quando vuoi che effect e valori computed vedano tutte le scritture insieme, invece di essere eseguiti dopo ciascuna.

<a id="3-fine-grained-updates"></a>

### 3. Aggiornamenti a grana fine

I componenti vengono eseguiti **una sola volta**, sia in Rust sia in TSX. In seguito, quando un signal cambia, vengono rieseguiti solo i binding che lo leggono: un testo, una proprietà di stile, un ramo di `when` (`<If>`), le righe di `each` (`<Each>`). Niente rifà il render di un intero sottoalbero per scoprire cosa è cambiato.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**Per il tuo codice:**

- Leggi i signal dove vengono usati (dentro i binding, nelle closure `move ||` in Rust e nelle espressioni JSX in TSX, e in `computed` e `effect`), non all'inizio di un componente, così si aggiorna il binding più ristretto possibile.
- Usa `each` / `<Each>` (righe mantenute per chiave) o una [lista virtuale](./lists.md) per le collezioni; le righe ricreate a partire dall'intera collezione (`dynamic` in Rust, un semplice `.map()` in JSX) vengono tutte create di nuovo a ogni modifica.
- Deriva i valori con `computed` quando più binding li usano, in modo che vengano calcolati una sola volta per modifica.

Aggiunta di un quarto elemento a una lista di tre, come la mostra `nsh test --trace`:

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

Vedi [Reactivity](./reactivity.md).

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. Non inviare ciò che non serve

Il core invia solo ciò che è cambiato: le nuove view non ricevono stile predefinito né maschera di eventi vuota, stili e frame invariati non vengono inviati, e un cambio di colore del testo non ripete il layout del testo. Un tap che cambia un numero invia un solo elemento di testo. Puoi verificarlo nell'output di `nsh test --trace` (qui sotto).

<a id="5-animate-natively"></a>

### 5. Anima in modo nativo

Un'animazione guidata dal thread del motore (un signal scritto a ogni frame) costa un commit per frame, e una chiamata JS in TSX, e scatta quando il thread del motore è occupato. I valori animati ([Animation](./animation.md): `animated_value` in Rust, l'[API di animazione di `nsh`](../modules/nsh.md#animation) in TSX) eseguono invece le animazioni in modo nativo:

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing`, `spring` e `decay` girano sul thread UI della piattaforma, frame dopo frame, senza alcun lavoro sul thread del motore per ogni frame.
- `scroll_value` (`scrollValue`) scrive un offset di scroll in un valore animato nello stesso frame; un pan (`pan={{ x, y }}`) permette ai trascinamenti di muovere direttamente una view. Il tuo codice viene informato della fine (l'animazione termina, la fine del pan riceve la velocità).
- `Animated.sequence` / `parallel` / `stagger` / `loop` girano come un unico albero nativo: ogni passo parte nel momento in cui il precedente finisce, senza attese di JS.
- `LayoutAnimation.configureNext` anima in modo nativo i frame, gli inserimenti e le rimozioni del commit successivo.

<a id="6-virtualize-long-lists"></a>

### 6. Virtualizza le liste lunghe

[`List`](./lists.md) mantiene solo le righe vicine al viewport, ricicla le loro celle e calcola in modo nativo posizioni, colonne, header sticky e viewability. I frame di scorrimento che non rivelano nuove righe non eseguono alcun codice tuo e non producono alcun batch; un frame che associa una nuova riga della lista di foto della gallery costa 4 operazioni e 4 mount item.

**Per il tuo codice:**

- Fornisci a `estimated_item_size` (`estimatedItemSize`) un valore vicino all'altezza reale delle righe.
- Mantieni lo stato per elemento nei tuoi dati (indicizzato per id), non in signal creati dentro la riga: le celle vengono riutilizzate per altri elementi, e la posizione della riga (`at.index()`; `item()` / `index()` in TSX) cambia quando ciò avviene.
- Mantieni le righe leggere: una riga viene associata a ogni riciclo, quindi il suo codice gira mentre l'utente scorre.
- Usa `scroll_value` (`scrollValue`) invece di `on_scroll` (`onScroll`) per gli effetti che seguono la posizione di scroll. Un listener di scroll riceve al massimo un evento per turno del motore, ma ciascuno è comunque una chiamata nel tuo codice (in JS, in TSX).

<a id="measuring"></a>

## Misurare

### Headless: `--trace`

In un test Rust, `EngineConfig::trace` registra le stesse righe `perf` e `Headless::observe` vede ogni batch ([Testing](./testing-and-trace.md#tracing-with-trace)). `nsh test --trace` le stampa per TSX:

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

Cosa osservare:

- **ops** (operazioni accodate dal tuo JS) e **mount items** (operazioni native sulle view): sono deterministici. Se un tap che dovrebbe cambiare una sola etichetta produce 40 elementi, qualcosa ricrea view che dovrebbe aggiornare.
- **event js**: il costo JS di un handler e di ciò che ha innescato.
- **commit**: il costo del core per il render dei componenti, il layout e il diff.
- **list js**: il tempo JS speso ad associare le righe della lista durante quel commit.

Guida completa: [Testing](./testing-and-trace.md).

<a id="on-a-device-55"></a>

### Su un dispositivo: `--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

registra le stesse righe di commit dall'host reale di un'app TSX, con il motore di testo della piattaforma. `NshAppView(trace: true)` e `new NshView(context, true)` fanno lo stesso in un'app che incorpora NSH.

<a id="on-screen-58"></a>

### Su schermo: `--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

(`AppOptions { fps: true, .. }` in `run_app` di un'app Rust) mostra il frame rate e il costo di frame e commit sopra l'app in esecuzione, insieme a CPU, GPU e memoria ([macOS: performance monitor](./macos.md#performance-monitor)). Su Linux e Windows, `--target linux --fps` e `--target windows --fps` registrano le stesse letture una volta al secondo, con il tempo di ogni fase di un frame; `nsh test --target linux --fps -v` (o `windows`) le rileva mentre un test guida l'app.

> [!TIP]
> Le singole misurazioni sono dominate dallo stato del clock della CPU: un thread che ha appena dormito per un po' gira più lentamente. Confronta il minimo di più esecuzioni, sulla stessa macchina, e preferisci le build release per le misure di tempo.

<a id="reference-numbers"></a>

## Numeri di riferimento

I numeri misurati, le baseline di NSH e la gallery pagina per pagina su Linux sono nel [report di performance](./performance-report.md).

## Checklist

- Linguaggio: scrivi l'app, o le parti che usa di più, in Rust ([Building with Rust](./rust.md)); lascia TSX per ciò che cambia spesso o viene consegnato a runtime.
- Interazioni: un tap cambia una manciata di mount item, non decine.
- Liste: una lista virtuale (`virtual_list`, `List`) per tutto ciò che è lungo, con una dimensione stimata degli elementi; stato per elemento nei dati.
- Animazioni: valori animati, non signal scritti a ogni frame.
- Effetti di scroll: `scroll_value` (`scrollValue`), non un listener di scroll.
- Handler: nessun lavoro pesante per tasto premuto o per evento di scroll; usa la cache in `computed`.

<a id="see-also"></a>

## Vedi anche

- [Report di performance](./performance-report.md)
- [Architecture](./architecture.md)
- [Testing](./testing-and-trace.md)
- [Lists](./lists.md), [Animation](./animation.md), [Reactivity](./reactivity.md)
