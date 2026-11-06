---
title: "Collapsible"
description: "Il componente Collapsible: una regione il cui contenuto si espande e si comprime, mostrata dopo i suoi figli finché l'app la mantiene aperta, rivelata su richiesta da un'altezza con animazione a molla, con il trigger e ogni aspetto definiti dall'app."
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---

# Collapsible

Un collapsible è una regione il cui contenuto si espande e si comprime: i dettagli sotto un riepilogo, un "mostra altro", una sezione di impostazioni avanzate. Mostra sempre i suoi figli e, dopo di essi, il suo `content` finché `open`. Lo stato `open` e il trigger che lo inverte (uno dei figli) appartengono all'app, e l'aspetto è deciso dall'app: un `Collapsible` non ha un trigger, un chevron o un'etichetta propri. Con `reveal`, il contenuto si apre e si chiude con movimento: l'altezza della sua regione passa con un effetto molla da zero all'altezza propria del contenuto e viceversa, e ciò che segue il collapsible si sposta di conseguenza.

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible` proviene da [`nsh/base`](../modules/nsh-base.md), il crate `nsh-base` di Rust. Il valore appartiene all'app: il suo trigger inverte `open`, e il collapsible mostra il valore che l'app gli passa. In Rust, `collapsible()` ne crea uno con un setter per ogni prop (`.open(..)`, `.reveal(..)`, `.content(..)`), i metodi di stile tipizzati per la regione e `.child(..)` per ciò che è sempre visibile.

## Props

| Prop | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | Espanso: il `content` è nell'albero, dopo i figli. Il valore appartiene all'app. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | Si apre e si chiude con una rivelazione: il contenuto si trova in una regione che lo ritaglia, la cui altezza passa con un effetto molla da zero all'altezza propria del contenuto quando `open` si attiva e torna a zero quando si disattiva, con smorzamento critico (circa 265 ms, senza overshoot). Ciò che segue il collapsible si sposta insieme ad esso, e il contenuto resta nell'albero finché la regione non si è chiusa. Con movimento ridotto si apre e si chiude all'istante. La regione è nel layout anche da chiusa, con altezza zero, quindi anche un `gap` del collapsible viene prima di essa. |
| `content` | `.content(..)` | `JSX.Element` | nessuno | Ciò che si espande. Viene creato una sola volta e mantenuto mentre è compresso, quindi ciò che contiene conserva il proprio stato (il testo di un input, una posizione di scorrimento, uno switch) da un'apertura alla successiva. |
| `children` | `.child(..)` | `JSX.Element` | nessuno | Ciò che è visibile in ogni caso: un riepilogo, il trigger che inverte `open`. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | La regione attorno ai figli e al contenuto (`gap-2` li distanzia). |

<a id="events"></a>

## Eventi

Un collapsible non riporta alcun evento proprio: il trigger appartiene all'app, e la sua pressione (`onPress` del `View` con `role="button"`) è il punto in cui l'app inverte `open`.

<a id="parts"></a>

## Parti

| Parte | Dentro | Stilizzata con |
|---|---|---|
| La regione | | `class`, `style` |
| I figli | la regione, per primi | i loro elementi |
| La regione della rivelazione | la regione, dopo i figli, con `reveal` | nessuno: ritaglia il contenuto e ne assume l'altezza |
| Il contenuto | la regione, dopo i figli (nella regione della rivelazione con `reveal`), mentre `open` | i suoi elementi (`content`) |

Senza `reveal`, il contenuto compare e scompare all'istante, e ogni piattaforma ricalcola il layout della regione quando arriva o se ne va. Con `reveal`, la modifica è un'animazione di layout del commit che cambia `open` (come `LayoutAnimation.configureNext`, eseguita in modo nativo, quindi nessun JavaScript viene eseguito durante il movimento): la regione della rivelazione cresce da zero all'altezza del contenuto e si restringe di nuovo, e i frame di tutto ciò che la stessa modifica sposta, comprese le viste dopo il collapsible, si muovono con essa. Una transizione dell'app si aggiunge al movimento: il chevron del trigger ruota (`transition-transform`), e il contenuto può comparire in dissolvenza con le proprie classi.

<a id="accessibility"></a>

## Accessibilità

- La regione non è un elemento a sé per gli screen reader: i suoi figli e il suo contenuto vengono letti così come sono.
- Il trigger indica se la regione è espansa: assegnagli `accessibilityState={{ expanded: open }}` e un ruolo di pulsante (`role="button"` su un `View`), e gli screen reader annunciano "espanso" o "compresso" insieme alla sua etichetta.
- Su macOS e sul web il trigger è una tappa del focus da tastiera quando riceve pressioni: Tab lo raggiunge, Spazio e Invio invertono la regione.

Vedi [Accessibilità](../docs/accessibility.md) per etichette, ruoli e annunci in generale.

<a id="platform-notes"></a>

## Note sulle piattaforme

- Ogni piattaforma mostra il contenuto dopo i figli mentre `open`, e altrimenti lo esclude dal layout.
- Con `reveal`, ogni piattaforma fa passare l'altezza della regione con un effetto molla sul proprio animatore (iOS, Android, macOS, Windows, Linux, GPUI e il web), e la apre e la chiude all'istante quando il sistema richiede il movimento ridotto.
- iOS, Android e Mac Catalyst: la pressione del trigger è un tap. Desktop (macOS, Windows, Linux, GPUI) e web: un clic, e Spazio o Invio sul trigger con il focus su macOS e sul web.
