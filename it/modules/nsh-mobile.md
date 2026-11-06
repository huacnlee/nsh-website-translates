---
title: "nsh/mobile"
description: "Cosa offrono iOS e Android: TabBar, la barra delle schede di sistema, InputAccessoryView su iOS, BackHandler su Android e isAvailable."
order: 12.2
source_hash: 53d6d77de0d6e9ca
---

# nsh/mobile

`nsh/mobile` contiene le funzionalità specifiche di iOS e Android: la tab bar di sistema, `TabBar`, su entrambe; [`InputAccessoryView`](#inputaccessoryview), una barra sopra la tastiera, su iOS; e [`BackHandler`](#backhandler), il pulsante indietro, su Android. Il codice Rust usa `nsh_core::mobile` e `nsh_core::prelude`; TSX importa `nsh/mobile`. Il modulo può essere importato su ogni piattaforma, quindi un unico bundle funziona ovunque: sulle altre piattaforme i suoi componenti non occupano spazio e le sue chiamate ritornano subito, e `isAvailable` indica se ci si trova su iOS o Android (`platform.os` da `nsh` indica quale). Ciò che offrono i desktop è in [nsh/desktop](./nsh-desktop.md).

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## Ambito

Questo modulo espone funzionalità specifiche delle piattaforme mobile, come la tab bar di sistema per la navigazione di primo livello dell'app. I controlli comuni appartengono a [`nsh/base`](./nsh-base.md): il suo [Switch](../elements/switch.md), per esempio, condivide comportamento e API tra telefoni, desktop e web, con traccia, cursore e stili di stato forniti dall'app. `TabBar` serve la navigazione delle app mobile; `Tabs` serve i contenuti a schede su tutte le piattaforme. Qui rientrano solo le funzionalità con una semantica di interazione specifica del mobile. Un aspetto, una dimensione o un'animazione di sistema, da soli, non cambiano il ruolo condiviso di un controllo comune. Questa distinzione guida la scelta delle funzionalità che appartengono a questo modulo ([Obiettivi e principi di progettazione](../docs/goals.md)).

## isAvailable

```ts
const isAvailable: boolean;
```

`true` su iOS, sul simulatore iOS, su Mac Catalyst e su Android; `false` altrove. Rust: `matches!(os(), Os::Ios | Os::Android)`.

## TabBar

Una tab bar permette di passare tra le sezioni di primo livello di un'app: registrazioni e statistiche, posta in arrivo e impostazioni. `TabBar` è la barra nativa del sistema, quindi ha l'aspetto e il comportamento delle app di sistema: `UITabBar` su iOS e iPadOS (Liquid Glass e la sua selezione su iOS 26), la navigation bar di Material 3 su Android, con i colori del sistema, chiari e scuri. L'app fornisce le schede (`items`), indica quale è selezionata (`selectedIndex`), riceve la scelta dell'utente (`onChange`), posiziona la barra con `class` e `style`, e mostra da sé il contenuto della sezione selezionata. Per le schede all'interno di una pagina, e su ogni piattaforma, usa [Tabs](../elements/tabs.md) di `nsh/base`.

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar` proviene da `nsh/mobile`, `nsh_core::mobile` in Rust. La selezione appartiene all'app: un tocco segnala `onChange` con l'indice della scheda (`{ index }`), la barra mostra subito la scelta, come fa quella di sistema, e l'app mostra quella sezione e ritrasmette l'indice come `selectedIndex`. La sua altezza è quella del sistema dove lo stile la lascia aperta. In Rust, `tab_bar()` ne crea una, con un setter per ogni prop (`.items(..)`, `.selected_index(..)`), un listener per ogni evento (`.on_change(..)`) e i metodi di stile tipizzati; `TabBarItem::new(title).icon(name)` crea una scheda.

<a id="props"></a>

### Proprietà

| Proprietà | Rust | Tipo | Predefinito | Descrizione |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | Le schede, in ordine. |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | La scheda selezionata, per indice; un indice oltre le schede non ne seleziona nessuna. |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS: nasconde la barra senza transizione. L'app possiede questo valore attraverso push e pop. La barra viene mostrata quando sia questa prop sia la richiesta `hidesBottomBarWhenPushed` dello stack visibile sono false. |
| `class`, `style` | metodi di stile | `string`, `StyleProp<ViewStyle>` | nessuno | Dove si trova la barra: posizione e dimensione. Il suo aspetto è quello del sistema, con la scheda selezionata nel `primary` del tema. |
| `testID` | `.test_id(..)` | `string` | nessuno | Trova la barra nei test e in `nsh test --trace`. |

#### TabBarItem

| Campo | Rust | Tipo | Descrizione |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | Il titolo della scheda, letto dagli screen reader. |
| `icon` | `.icon(name)` | `string` | L'icona della scheda, indicata con il nome che la piattaforma le dà: un [SF Symbol](https://developer.apple.com/sf-symbols/) su iOS (`"house"`), un drawable dell'app su Android (`res/drawable/home.xml` è `"home"`, `"android:ic_menu_search"` quello del sistema). `platform.select` ne sceglie una per piattaforma. |

<a id="events"></a>

### Eventi

| Evento | Rust | Descrizione |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | L'utente ha scelto una scheda: `{ index }`, il suo indice. La barra mostra subito la scelta; l'app mostra il contenuto della scheda e imposta `selectedIndex`. |

<a id="platform-notes"></a>

### Note sulle piattaforme

- **iOS e Mac Catalyst**: `UITabBar`, con l'aspetto di sistema per la versione di iOS: la barra flottante Liquid Glass e la sua selezione su iOS 26. Le icone sono SF Symbols. Il `primary` del tema è il `tintColor` della barra, il colore della scheda selezionata; le altre schede mantengono quello del sistema.
- **Android**: la navigation bar di Material 3, composta dalle view della piattaforma: un'icona nel suo indicatore attivo sopra ogni etichetta, un ripple alla pressione, i colori dinamici del sistema su Android 12 e successivi e i colori di base di Material nelle versioni precedenti, chiari o scuri secondo l'aspetto dell'app. In fondo alla finestra si estende sotto la barra di navigazione, più alta del suo inset, come fa quella di Material. Le icone sono drawable dell'app (tinti dalla barra). L'icona e l'etichetta della scheda selezionata assumono il `primary` del tema, su un indicatore attivo dello stesso colore con opacità al 12%; le altre schede mantengono quello del sistema.
- **Desktop (macOS, Windows, Linux, GPUI) e web**: le sezioni vengono mostrate con [Tabs](../elements/tabs.md), con l'aspetto dell'app. `TabBar` non occupa spazio, quindi un unico layout le gestisce entrambe, scelto da `platform.os` ([l'API dei dispositivi di `nsh`](./nsh.md#device)).

## InputAccessoryView

Su iOS e Mac Catalyst; su Android è una view vuota e nascosta.

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

Una barra sopra la tastiera (`inputAccessoryView` di UIKit), mostrata mentre ha il focus un input il cui `ios={{ inputAccessoryViewID }}` corrisponde al suo `nativeID`. Rust: `input_accessory_view(native_id)`, mostrata per gli input il cui `.input_accessory(native_id)` corrisponde. È larga quanto la finestra e alta quanto il suo contenuto, e si muove con la tastiera in modo nativo.

| Proprietà | Tipo | Rust | Descrizione |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | Gli input con questo `inputAccessoryViewID` mostrano la barra. |
| `style` | `StyleProp<ViewStyle>` | metodi `Styled` (`.bg(…)`) | Lo stile della barra (per esempio lo sfondo). |
| `class` | `string` | | Classi Tailwind. |
| `children` | `JSX.Element` | `.child(…)` | Il contenuto della barra. |

Non renderizza nulla nel punto in cui è collocata nell'albero, e nulla del tutto su Android, quindi puoi collocarla accanto all'input a cui appartiene.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

Vedi anche [Moduli e tastiera](../docs/forms-and-keyboard.md).

## BackHandler

Su Android; su iOS i suoi listener vengono conservati e mai chiamati, e `exitApp()` ritorna subito.

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

Il pulsante indietro di sistema e il gesto indietro. Le finestre di dialogo gestiscono per prime la pressione indietro (una finestra di dialogo si chiude); poi vengono eseguiti i listener di `BackHandler`, a partire dal più recente; se nessuno di essi la gestisce, lo stack di navigazione in primo piano esegue un pop e, se non c'è nessuna pagina a cui tornare, l'app termina.

| Membro | Rust | Descrizione |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | `listener` restituisce `true` quando ha gestito la pressione. Restituisce una funzione che interrompe l'ascolto; un listener aggiunto durante il rendering di un componente (o l'esecuzione di un effect) si interrompe insieme a esso, sia in Rust sia in TSX. |
| `exitApp()` | il listener restituisce `false` | Esce dall'app. Un listener Rust che restituisce `false` lascia proseguire la pressione, così lo stack torna indietro oppure l'app termina. |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> Il listener viene eseguito dopo che il sistema ha consegnato la pressione: il thread principale non attende mai il codice dell'app. Finché è registrato almeno un listener, NSH prende in carico le pressioni indietro che le finestre di dialogo lasciano passare, e torna indietro nello stack in primo piano o esce dall'app da sé quando nessun listener restituisce `true`.

La barra di stato è impostata da `statusBar` di [pagine e finestre di dialogo](./nsh-base.md#status-bar) tramite `nsh/base`, sia su iOS sia su Android.
