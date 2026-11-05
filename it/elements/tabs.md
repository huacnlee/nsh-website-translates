---
title: "Tabs"
description: "Tab e Tabs: le schede di una lista di schede e la lista stessa. Ogni scheda gestisce le pressioni, l'attivazione da tastiera, lo stato disabilitato, il proprio ruolo e lo stato di selezione per gli screen reader; la lista è l'insieme, con un indicatore che segue nativamente la scheda selezionata; l'aspetto, il valore e il contenuto mostrato da ciascuna scheda sono a carico dell'app."
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---

# Tabs

Le tab permettono di passare da una sezione all'altra di uno stesso luogo: la panoramica e l'attività di un progetto, le viste di un documento.
Ogni `Tab` gestisce il comportamento di una tab: pressioni, attivazione da tastiera, stato disabilitato, e il ruolo di tab con il relativo stato di selezione per gli screen reader. Un `Tabs` che le racchiude è la lista di tab, che gli screen reader annunciano come un unico insieme. L'aspetto è quello dell'app: una tab non ha colori, dimensioni o etichetta propri. I suoi figli sono l'etichetta dell'app, e le classi `selected:` sulla tab, o le classi `group-selected:` su ciò che contiene, seguono il suo stato. Anche il contenuto di ogni sezione è dell'app: mostra quello che il suo valore indica, accanto alla lista. L'indicatore della lista, una sottolineatura o una pillola con lo stile dell'app, si posiziona sulla tab selezionata e si sposta nativamente su quella successiva ([Indicator](#indicator)).

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

`Tab` e `Tabs` provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. Il valore è dell'app: la lista non ne contiene alcuno. A ogni tab viene comunicato se è selezionata; una pressione riporta `onPress`, l'app imposta il proprio valore e mostra quella sezione, e ogni tab mostra il `selected` che l'app le restituisce. Gli angoli della lista e quelli delle tab sono concentrici: il padding della lista (`p-1`) è la differenza tra `radius.lg` e `radius`. Il riempimento della tab selezionata è l'indicatore della lista (`indicatorClass`, all'interno di quel padding: `inset-y-1`), che scatta con effetto elastico verso la tab selezionata dall'app. In Rust, `tab()` e `tabs()` li creano, con un setter per ogni prop (`.selected(..)`), un listener per ogni evento (`.on_press(..)`), i metodi di stile tipizzati e `.child(..)` per il loro contenuto.

## Props

### Tab

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | La tab corrente della sua lista: gli screen reader la annunciano come selezionata, e si applicano gli stili `selected:`. Una pressione riporta `onPress`; la tab mostra il valore che l'app le restituisce. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Nessuna pressione e nessun feedback di pressione; si applicano gli stili `disabled:`, e gli screen reader la annunciano come attenuata. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile della tab quando è selezionata e non disabilitata, come classi `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader: il nome della tab, quando i suoi figli non hanno testo che lo esprima (un'icona). |
| `children` | `.child(..)` | `JSX.Element` | nessuno | L'etichetta, l'icona o il badge dell'app, che gli screen reader leggono. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La tab stessa: la superficie attorno alla sua etichetta. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile della tab quando è premuta, con il puntatore sopra, con il focus o disabilitata, come classi `<state>:`. |

<a id="tabs-1"></a>

### Tabs

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | nessuno | Le classi Tailwind dell'indicatore sulla tab selezionata: il suo aspetto e la sua posizione attraverso la lista (`bottom-0 h-0.5` per una sottolineatura in una riga, `inset-y-1` per una pillola). Lungo la lista copre la tab selezionata, entro i propri margini su quell'asse. Con `indicatorClass` o `indicatorStyle` la lista ha un indicatore. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile dell'indicatore, sopra `indicatorClass`. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Le tab della lista, e tutto ciò che l'app dispone tra di esse. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout e l'aspetto della lista: una colonna per impostazione predefinita, `flex-row` per una riga. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onPress` (`Tab`) | `.on_press(\|_: &()\| ..)` | La tab è stata premuta: un tap, un clic, Spazio o Invio mentre ha il focus da tastiera, oppure l'attivazione tramite screen reader; oppure un tasto freccia, Home o End della sua lista ha spostato il focus da tastiera su di essa. Viene eseguito prima che cambi qualsiasi cosa: la tab mostra il `selected` che l'app le restituisce. |

Anche la tab selezionata riporta le proprie pressioni, così l'app può reagire a una seconda pressione (ad esempio riportare la sua sezione in cima).
Una tab disabilitata non riporta nulla.

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| La lista | | `Tabs` `class`, `style` | |
| L'indicatore | la lista, dietro le tab | `indicatorClass`, `indicatorStyle` | sulla tab selezionata |
| La tab | la lista | `Tab` `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` (o `selectedStyle`, `disabledStyle`, ...) |
| L'etichetta | la tab | i suoi elementi (`children`) | `group-selected:`, `group-disabled:` e le altre varianti `group-*:` con `group` sul `class` della tab |
| Il contenuto della sezione | accanto alla lista | gli elementi dell'app | il valore dell'app |

Mostra la tab selezionata attraverso la sua superficie: un riempimento, un'etichetta più marcata, uno spessore maggiore (vedi [Design guides](../docs/design-guides.md#interaction-states)).

## Indicator

Una sottolineatura sotto la tab selezionata, una pillola dietro di essa o il segmento in rilievo di un controllo segmentato è l'indicatore della lista: una vista che l'app stilizza con `indicatorClass` e `indicatorStyle`, disegnata dietro le tab e posizionata in modo assoluto nella lista. Native Shell la posiziona sulla tab selezionata dopo ogni layout. Lungo la lista (la larghezza di una riga, l'altezza di una colonna) copre quella tab, entro i margini dell'indicatore stesso su quell'asse (`mx-3` per una sottolineatura più corta della sua tab); attraverso la lista sono le sue classi a posizionarla:

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

Quando l'app seleziona un'altra tab, l'indicatore vi scatta nativamente con effetto elastico, come fa l'indicatore della tab bar di GPUI Kit; con il movimento ridotto si sposta all'istante. Finché nessuna tab è selezionata è nascosto; se ne sono selezionate diverse, sta sulla prima. Un ridimensionamento o una variazione della larghezza di una tab lo sposta nello stesso frame delle tab. L'indicatore non richiede eventi di layout né codice da parte dell'app: la tab selezionata è quella il cui `selected` è true. In una lista che scorre, la vista di scorrimento va attorno a `Tabs`, e l'indicatore scorre insieme alle tab.

## Disabled

Una tab disabilitata non accetta pressioni, e gli screen reader la annunciano come attenuata. Le sue classi `disabled:` si applicano sopra quelle `selected:`, e le classi `group-disabled:` al suo interno ne seguono lo stato:

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

<a id="accessibility"></a>

## Accessibilità

- Una tab è un unico elemento per gli screen reader, con il ruolo `"tab"` e il suo stato di selezione. La sua etichetta è il testo dei suoi figli, oppure `accessibilityLabel`.
- `Tabs` ha il ruolo `"tablist"`: gli screen reader sentono le tab al suo interno come un unico insieme, ciascuna comunque un elemento a sé.
- `disabled` viene annunciato come lo annuncia la piattaforma (VoiceOver, TalkBack, UI Automation, l'albero di accessibilità del browser).
- Su macOS e sul web la lista è un'unica sosta del focus da tastiera, e i tasti freccia si spostano tra le sue tab (vedi sotto).
- L'indicatore è nascosto agli screen reader e non riceve il focus: solo le tab sono gli elementi della lista.

Vedi [Accessibility](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="keyboard"></a>

## Tastiera

Su macOS e sul web, dove Tab raggiunge le viste che accettano pressioni, una lista `Tabs` segue il [pattern WAI-ARIA per le tab](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):

| Tasto | Cosa fa |
|---|---|
| Tab, Shift+Tab | Entra nella lista sulla tab selezionata (la prima tab non disabilitata se nessuna è selezionata), e ne esce in un solo passaggio. |
| Destra, Giù | Sposta il focus sulla tab successiva, dall'ultima alla prima. |
| Sinistra, Su | Sposta il focus sulla tab precedente, dalla prima all'ultima. |
| Home, End | Sposta il focus sulla prima o sull'ultima tab. |
| Spazio, Invio | Preme la tab con il focus. |

I tasti freccia saltano le tab disabilitate, e la tab su cui si spostano riporta `onPress`, così l'app la seleziona mentre il focus si sposta: la sezione segue il focus. Entrambe le coppie di frecce si spostano, qualunque sia il layout della lista, che è una classe dell'app. In un layout da destra a sinistra la riga parte da destra, quindi Sinistra e Destra si scambiano: Sinistra passa alla tab successiva e Destra a quella precedente; Su, Giù, Home e End mantengono il proprio comportamento. Gli stili `focus:` mostrano dove si trova il focus. Un `Tab` al di fuori di un `Tabs` è una sosta a sé stante.

<a id="platform-notes"></a>

## Note sulle piattaforme

- iOS, Android e Mac Catalyst: una pressione è un tap che termina sulla tab, etichetta inclusa.
- Desktop (macOS, Windows, Linux, GPUI) e web: una pressione è un clic. Su macOS e sul web, Spazio e Invio premono anche la tab che ha il focus da tastiera, e i tasti freccia, Home e End lo spostano ([Tastiera](#keyboard)).
- Ogni piattaforma disegna ciò che l'app stilizza: le tab, la superficie di quella selezionata, l'indicatore e il contenuto delle sezioni. Lo spostamento dell'indicatore è un'animazione di layout nativa su ogni piattaforma.
