---
title: "Accordion"
description: "Accordion e le sue parti: sezioni impilate che si espandono e si comprimono sotto le rispettive intestazioni, una alla volta o più insieme, aperte dal valore dell'app, rivelate su richiesta da un'altezza con effetto molla, con ogni aspetto definito dall'app."
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---

# Accordion

Un accordion impila sezioni che si espandono e si comprimono sotto i propri titoli: le domande di una FAQ, i gruppi di una pagina di impostazioni, i passaggi di un checkout. Lo compongono cinque parti, ciascuna responsabile di un solo aspetto del comportamento e di nessun aspetto dell'estetica:

- `Accordion`, la pila: contiene i `value` dell'app, cioè i valori degli elementi aperti, e comunica il successivo con
  `onChange`. Si apre un elemento alla volta, oppure più elementi con `multiple`.
- `AccordionItem`, una sezione, identificata dal suo `value`. È aperta finché il `value` dell'accordion la contiene.
- `AccordionHeader`, il titolo dell'elemento, con un `level` che gli screen reader annunciano.
- `AccordionTrigger`, il pulsante nel titolo che espande e comprime il proprio elemento e indica se è espanso.
- `AccordionPanel`, il contenuto dell'elemento, visibile finché è aperto; con `reveal` la sua altezza si apre e si chiude con un effetto elastico.

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

Le parti provengono da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` in Rust. Il valore appartiene all'app: la pressione di un
trigger comunica il prossimo `value` con `onChange`, e l'accordion apre gli elementi i cui valori l'app gli restituisce.
Ogni parte trova da sola quella che la circonda, quindi l'app le dispone liberamente: divisori tra gli elementi, un badge
in un titolo, un'icona prima di un titolo di sezione. In Rust, `accordion()`, `accordion_item()`, `accordion_header()`,
`accordion_trigger()` e `accordion_panel()` le creano, con un setter per ogni prop e `.child(..)` per ciò che contengono.

## Props

<a id="accordion-1"></a>

### Accordion

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | I `value` degli elementi aperti. Appartengono all'app: la pressione di un trigger comunica i successivi con `onChange`, e l'accordion mostra quelli che l'app gli restituisce. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Più elementi aperti contemporaneamente: aprirne uno lascia aperti gli altri. Senza questa prop, aprire un elemento chiude quello che era aperto. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ogni elemento è disabilitato: nessun trigger accetta pressioni e gli screen reader indicano ciascuno come attenuato. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Gli elementi, e qualunque cosa l'app disponga tra di essi (divisori). |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout e l'aspetto della pila: una card attorno agli elementi, lo spazio tra di essi. |

### AccordionItem

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | obbligatorio | Ciò che identifica l'elemento nel `value` dell'accordion: l'id proprio dell'app, mai il titolo, che cambia con la lingua. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Il suo trigger non accetta pressioni e gli screen reader lo indicano come attenuato. Resta aperto o chiuso secondo il `value` dell'accordion. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | L'header e il panel dell'elemento, e qualunque altra cosa l'app vi disponga. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La sezione: un divisore sotto di essa, una card attorno. |

### AccordionHeader

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | Il livello del titolo tra i titoli della pagina, per gli screen reader (1 è il più alto). |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il trigger dell'elemento, e qualunque altra cosa contenga l'header (un badge, un'azione propria). |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout del titolo. |

### AccordionTrigger

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile del trigger mentre il suo elemento è aperto, come classi `aria-expanded:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Ciò che dicono gli screen reader, quando i children non contengono testo che lo dica. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il titolo e il chevron; le classi `group-aria-expanded:` al loro interno seguono il trigger con `group` sul suo `class`. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il trigger stesso: la riga che l'utente preme. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | nessuno | Lo stile del trigger mentre è premuto, in hover, con il focus o disabilitato, come le classi `<state>:`. |

### AccordionPanel

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | Si apre e si chiude con un effetto di rivelazione, come quello di `Collapsible`: il panel ritaglia il proprio contenuto e la sua altezza passa con un effetto elastico da zero a quella del contenuto e viceversa, con smorzamento critico (circa 265 ms, senza overshoot), mentre gli elementi successivi si spostano di conseguenza. Con il movimento ridotto si apre e si chiude all'istante. |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | Il contenuto resta nell'albero mentre l'elemento è chiuso, fuori dalla vista, dal focus da tastiera e dagli screen reader: un video mantiene la sua posizione, una web view la sua pagina. Senza questa prop il contenuto esce dall'albero quando il panel si chiude (una volta che la rivelazione lo ha chiuso) e ritorna com'era. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | nessuno | Come gli screen reader chiamano la regione: di solito il titolo dell'elemento, così come lo dice il suo header. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Il contenuto. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Il layout e l'aspetto della regione. Con `reveal` il panel resta nel layout anche da chiuso, con altezza zero, quindi padding e bordi vanno messi su una view del suo contenuto. |

<a id="events"></a>

## Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | Un trigger è stato premuto: un tap, un clic, Spazio o Invio mentre ha il focus da tastiera, oppure l'attivazione da parte di uno screen reader. `value` contiene i valori degli elementi aperti così come sarebbero: il valore di un elemento aperto lo abbandona, quello di un elemento chiuso si aggiunge in coda oppure, senza `multiple`, lo sostituisce. Viene eseguito prima che cambi qualsiasi cosa: imposta `value` per seguirlo. |

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con | Stati |
|---|---|---|---|
| La pila | | `Accordion`: `class`, `style` | |
| Un elemento | la pila | `AccordionItem`: `class`, `style` | il valore dell'app |
| Il titolo | l'elemento | `AccordionHeader`: `class`, `style` | |
| Il trigger | il titolo | `AccordionTrigger`: `class`, `style` | `aria-expanded:`, `disabled:`, `active:`, `hover:`, `focus:` (oppure `expandedStyle`, `disabledStyle`, ...) |
| Il titolo di sezione e il chevron | il trigger | i loro elementi (`children`) | `group-aria-expanded:`, `group-disabled:` con `group` sul `class` del trigger |
| Il panel | l'elemento, dopo il titolo | `AccordionPanel`: `class`, `style` | |
| Il contenuto | il panel | i suoi elementi (`children`) | |

Senza `reveal`, un panel chiuso è fuori dal layout e il suo contenuto fuori dall'albero. Con `reveal`, il cambiamento è un'animazione di layout del commit che modifica `value` (come `LayoutAnimation.configureNext`, eseguita in modo nativo, quindi nessun
JavaScript viene eseguito mentre si muove): il panel che si apre cresce da zero all'altezza del proprio contenuto, quello che si chiude si riduce
fino a zero, entrambi con la stessa molla, e gli elementi successivi si spostano di conseguenza. Con essa va una transizione dell'app: il
chevron ruota (`transition-transform group-aria-expanded:rotate-180`).

<a id="disabled"></a>

## Disabilitato

Il trigger di un elemento disabilitato non accetta pressioni e gli screen reader lo annunciano come attenuato; le classi `disabled:` sul
trigger e `group-disabled:` al suo interno ne seguono lo stato. Il `disabled` dell'accordion disabilita ogni elemento. Un elemento disabilitato
mostra comunque ciò che dice il `value` dell'app: l'app può aprirlo.

<a id="accessibility"></a>

## Accessibilità

- La pila è un gruppo, ogni header è un titolo del proprio `level` e ogni trigger è un pulsante al suo interno che indica se
  il suo elemento è espanso. Gli screen reader possono spostarsi da un titolo all'altro.
- Un panel aperto è una regione, denominata dal proprio `accessibilityLabel`; uno chiuso è nascosto agli screen reader, compreso il
  contenuto mantenuto.
- L'aspetto dell'elemento aperto spetta all'app e non dovrebbe basarsi solo sul colore: ruota il chevron, come fanno gli esempi.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="keyboard"></a>

## Tastiera

Dove le view che accettano pressioni sono tappe del focus da tastiera (macOS e web), ogni trigger è una tappa, nell'
ordine della pagina, e Spazio e Invio lo premono. I trigger disabilitati vengono saltati, così come il contenuto di un
panel chiuso. Tab passa da un trigger ai controlli del suo panel aperto e poi al trigger successivo.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Ogni piattaforma mostra il panel di un elemento aperto sotto il suo titolo e lascia fuori dal layout quello di un elemento chiuso (altezza zero
  con `reveal`).
- Con `reveal`, ogni piattaforma anima con effetto elastico l'altezza dei panel tramite il proprio animatore (iOS, Android, macOS, Windows, Linux,
  GPUI e web), e li apre e li chiude all'istante quando il sistema richiede il movimento ridotto.
- Lo screen reader di ogni piattaforma legge il titolo e il suo livello quando legge i titoli, e il trigger al suo interno come
  pulsante con il suo stato di espansione; su iOS, VoiceOver legge il trigger stesso.
- iOS, Android e Mac Catalyst: la pressione di un trigger è un tap. Desktop (macOS, Windows, Linux, GPUI) e web: un
  clic, e Spazio o Invio sul trigger con il focus su macOS e sul web.
