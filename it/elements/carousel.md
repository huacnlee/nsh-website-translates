---
title: "Carousel"
description: "Carousel e le sue parti: slide mostrate una posizione alla volta, spostate con lo swipe, la rotella e il touchpad sullo scorrimento nativo della piattaforma, con i controlli precedente e successivo, una paginazione e la tastiera, attraversando le estremità senza interruzioni. Il carousel gestisce quale slide è visibile, lo snapping, il looping, i tasti e l'accessibilità; l'aspetto e ogni etichetta spettano all'app."
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---

# Carousel

Un carousel mostra le slide una alla volta: le foto di un prodotto, i passi di un onboarding, un banner che avanza da solo, una riga di card. `Carousel` gestisce il comportamento: quale slide è mostrata, lo swipe tra le slide, i controlli precedente e successivo, una paginazione, i tasti freccia, il passaggio circolare agli estremi e ciò che sentono gli screen reader. Le sue parti lo trovano tramite il context, quindi l'app le dispone liberamente nel proprio layout. L'aspetto è dell'app: il carousel non ha colori, dimensioni, frecce, punti o etichette propri.

Il contenuto è una scroll view nativa. Un dito, la rotellina e il touchpad spostano le slide sul main thread della piattaforma, nello stesso frame del puntatore, e al rilascio il contenuto si aggancia alla slide più vicina, una slide per fling. Quando si ferma, il carousel segnala la slide con `onChange`. I controlli, la paginazione, i tasti e il `index` dell'app fanno scorrere il contenuto in modo nativo fino alla slide, con animazione.

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel` e le sue parti provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. La slide mostrata è quella dell'app, `index`: uno swipe, un controllo o un tasto segnala la successiva con `onChange`, e il carousel scorre fino al `index` che l'app restituisce. La slide su cui si ferma uno swipe resta visibile finché l'app non ha risposto al suo `onChange`: resta se l'app la restituisce come `index`, e il contenuto torna con effetto elastico alla slide dell'app, con animazione, se l'app mantiene il `index` che aveva. Senza `index` il carousel tiene il proprio, a partire da `defaultIndex`. In Rust, `carousel()`, `carousel_content()`, `carousel_item()`, `carousel_previous()`, `carousel_next()`, `carousel_pagination()` e `carousel_pagination_item()` creano le parti, con un setter per prop (`.index(..)`), un listener per evento (`.on_change(..)`), i metodi di stile tipizzati e `.child(..)` per il loro contenuto.

## Props

<a id="carousel-1"></a>

### Carousel

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | nessuno | La slide mostrata, a partire da 0, limitata al numero di slide presenti. È dell'app: le modifiche vengono segnalate con `onChange`, e un nuovo `index` scorre fino a quella slide, con animazione. |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | La slide mostrata all'inizio, finché `index` non è impostato. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La direzione in cui si susseguono le slide; letta quando il carousel viene creato. I tasti freccia di un carousel verticale sono Su e Giù. |
| `looping` | `.looping(..)` | `boolean` | `false` | Le slide girano in cerchio: dopo l'ultima viene la prima, e prima della prima l'ultima, senza stacchi, sia per uno swipe, sia per precedente, successivo, i tasti e il `index` dell'app ([Ciclo continuo](#looping)). Letta quando il carousel viene creato. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano il carousel, una regione: cosa sono le sue slide (`"Featured products"`). |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il `CarouselContent`, i controlli e tutto ciò che l'app dispone intorno a essi. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout del carousel: dove vanno il contenuto e i controlli. |

### CarouselContent

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | nessuno | I `CarouselItem`, ciascuno figlio del contenuto. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La dimensione del viewport e la traccia che le slide formano al suo interno: un `gap` tra di esse, un padding che mostra un'anteprima delle slide accanto a quella in vista. |

### CarouselItem

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano la slide, un gruppo: la sua posizione tra le altre e ciò che mostra (`"2 of 5: Ocean view"`). |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto della slide. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La sua dimensione lungo l'asse (`w-full` per una slide per vista, `basis-1/3` per tre) e il suo aspetto. In un carousel con ciclo continuo, la sua traslazione è gestita dal carousel: applica un `transform` a una view al suo interno. |

### CarouselPrevious, CarouselNext

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Il nome del controllo, quando i suoi figli non hanno testo che lo esprima (un'icona a freccia). |
| `children` | `.child(..)` | `JSX.Element` | nessuno | L'icona o l'etichetta dell'app. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il suo aspetto e la sua posizione: accanto al contenuto, oppure `absolute` sopra il suo bordo. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nessuno | Il suo stile mentre è premuto, in hover, con il focus, o disabilitato a un estremo, come le classi `<state>:`. |

### CarouselPagination

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano il gruppo di elementi di paginazione (`"Choose a slide"`). |
| `indicatorClass` | `.indicator_class(..)` | `string` | nessuno | Le classi Tailwind dell'indicatore, una view posta sull'elemento della slide mostrata (una pillola dietro i punti, una sottolineatura): il suo aspetto e la sua posizione attraverso la riga (`inset-y-0`, `bottom-0 h-0.5`). Lungo la riga occupa quell'elemento e si sposta con effetto elastico sul successivo in modo nativo. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile dell'indicatore, sopra `indicatorClass`. Se non è impostato nessuno dei due, la paginazione non ha indicatore. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | I `CarouselPaginationItem` e tutto ciò che l'app dispone tra di essi. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout della riga (`flex-row gap-2`). |

### CarouselPaginationItem

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | obbligatorio | La slide che rappresenta, a partire da 0. Un indice oltre l'ultima slide è disabilitato. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Il suo stile mentre la sua slide è mostrata, come classi `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Quale slide rappresenta (`"Slide 3"`), quando i suoi figli non hanno testo che lo esprima (un punto). |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il punto, la miniatura o il numero dell'app. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il suo aspetto; le classi `group-selected:` al suo interno lo seguono sotto `group`. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | L'utente è passato a un'altra slide: uno swipe, la rotellina o il touchpad si sono fermati su di essa, oppure un controllo, un elemento di paginazione o un tasto l'hanno richiesta. `{ index }` è quella slide. Un nuovo `index` da parte dell'app non segnala nulla. |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | L'utente ha iniziato a trascinare il contenuto (un dito, il touchpad). |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | Il contenuto trascinato dall'utente si è fermato. |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | Il focus da tastiera è entrato nel carousel: sulla sua view, sul controllo precedente o successivo, su un elemento di paginazione o su una view focalizzabile in una slide. Gli spostamenti tra di essi non segnalano nulla. |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | Il focus da tastiera ha lasciato il carousel: la sua view, i suoi controlli, i suoi elementi di paginazione e il contenuto delle slide. |

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| Il carousel | | `Carousel` di `class`, `style` | `focus:` |
| Il contenuto | il carousel | `CarouselContent` di `class`, `style` | |
| Una slide | il contenuto | `CarouselItem` di `class`, `style` | |
| Precedente, successivo | il carousel | i loro `class`, `style` | `disabled:`, `active:`, `hover:`, `focus:` |
| La paginazione | il carousel | `CarouselPagination` di `class`, `style` | |
| L'indicatore | la paginazione | `indicatorClass`, `indicatorStyle` | |
| Un elemento di paginazione | la paginazione | il suo `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` |

<a id="several-slides-per-view"></a>

## Più slide per vista

La larghezza di una slide dipende dalla sua classe, quindi una riga di card equivale a più slide nel viewport. Ogni slide è un punto di snap nel punto in cui inizia: il contenuto si ferma con quella slide dove si ferma la prima, quindi un padding prima della prima viene mantenuto prima di ciascuna. Alla fine dell'intervallo le slide che non possono raggiungere quel punto si fermano con l'ultima, e next si arresta lì. `index` indica la slide nella prima posizione; le slide che si fermano con l'ultima mostrano la stessa posizione, e uno swipe in quel punto segnala la prima di esse:

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

`basis-1/2` alla larghezza di un telefono, oppure `basis-[85%]`, mostra un'anteprima della card successiva. Un carousel verticale (`axis="vertical"`) dimensiona le slide in base alla loro altezza.

<a id="looping"></a>

## Ciclo continuo

Con `looping`, le slide girano in cerchio senza stacchi: dopo l'ultima viene la prima, che si tratti di uno swipe, di un passo con next o con i tasti, o di un valore impostato dal `index` dell'app, senza riavvolgere le slide intermedie. Il contenuto mantiene lo spazio di un giro completo di slide prima e dopo di esse, e disegna ogni slide dove è più vicina al centro della vista; l'animazione lo esegue sui frame propri della piattaforma, insieme allo scroll. Ogni slide è presente una sola volta: gli screen reader e la paginazione la vedono una sola volta.

Il ciclo è continuo finché le slide coprono il viewport più una slide (tre slide a larghezza piena, o cinque larghe un terzo). Con meno slide, precedente, successivo e i tasti continuano comunque a girare in cerchio, scorrendo all'indietro attraverso le slide.

<a id="slides-that-move-on-by-themselves"></a>

## Slide che avanzano da sole

Un banner che scorre è responsabilità dell'app: un timer che imposta `index`. Il carousel segnala quando l'utente lo sta usando, quindi il timer attende in quel momento, come richiede il [pattern carousel di WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/): `onDragStart` / `onDragEnd` attorno a un trascinamento, `onFocus` / `onBlur` mentre il focus da tastiera è nel carousel (su di esso, sui suoi controlli, sulla sua paginazione o sul contenuto delle slide), e il puntatore sopra una view che lo circonda. Disattivalo con il movimento ridotto e offri agli utenti un pulsante che lo fermi (il controllo di rotazione):

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

Leggere `index()` nell'effect fa ripartire un intero intervallo dopo ogni cambiamento, compreso quello dell'utente. Con `looping`, il passaggio dall'ultima slide alla prima avanza attraverso la giuntura.

<a id="accessibility"></a>

## Accessibilità

- Il carousel è una regione con nome dato da `accessibilityLabel`; ogni slide è un gruppo con un nome proprio (la sua posizione tra le altre e ciò che mostra).
- Precedente e successivo sono pulsanti, disabilitati agli estremi a meno che il carousel non sia in ciclo continuo; ogni elemento di paginazione è un pulsante, selezionato mentre la sua slide è mostrata.
- Ogni etichetta è dell'app, nella lingua dell'app.
- Le slide di un carousel in ciclo continuo sono presenti ciascuna una sola volta, ovunque vengano disegnate.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="keyboard"></a>

## Tastiera

Su macOS e sul web, dove Tab raggiunge le view che accettano le pressioni, il carousel è una tappa del focus da tastiera, così come i suoi controlli e i suoi elementi di paginazione. Mentre uno di essi ha il focus:

| Tasto | Cosa fa |
|---|---|
| Sinistra, Destra (Su, Giù se verticale) | Passa alla slide precedente o successiva, girando in cerchio agli estremi in ciclo continuo. |
| Home, End | Passa alla prima o all'ultima slide. |
| Spazio, Invio | Preme il controllo o l'elemento di paginazione con il focus. |

In un layout da destra a sinistra le slide di un carousel orizzontale scorrono da destra, quindi Sinistra passa alla slide successiva e Destra alla precedente; un carousel verticale mantiene Su e Giù. Un controllo che diventa disabilitato mentre ha il focus (successivo sull'ultima slide) passa il focus al carousel, così i tasti continuano a funzionare lì. Le view focalizzabili dell'app nelle slide mantengono i propri tasti: le frecce di un input spostano il suo cursore.

<a id="motion"></a>

## Movimento

- Uno swipe, la rotellina e il touchpad spostano le slide insieme al puntatore, nello stesso frame: è la piattaforma a farle scorrere.
- Al rilascio il contenuto scivola fino alla slide più vicina, una slide per fling, secondo lo snap della piattaforma.
- Precedente, successivo, un elemento di paginazione, un tasto e il `index` dell'app fanno scorrere il contenuto fino alla slide, con animazione; con il movimento ridotto, istantaneamente.
- L'indicatore della paginazione si sposta con effetto elastico sull'elemento della slide mostrata; con il movimento ridotto si sposta istantaneamente.
- `looping` passa dall'ultima slide alla prima con un passo in avanti, attraverso la giuntura; quando il contenuto si ferma, torna indietro di un giro completo senza animazione, il che non cambia nulla sullo schermo.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: un dito fa scorrere le slide con lo swipe; un tap preme un controllo.
- Desktop (macOS, Windows, Linux, GPUI) e web: la rotellina e il touchpad fanno scorrere le slide, e un clic preme un controllo. Il trascinamento con il mouse sul contenuto spetta all'app, come su ogni scroll view in quei contesti.
- Ogni piattaforma disegna ciò che l'app stilizza: le slide, i controlli, la paginazione e il suo indicatore.
