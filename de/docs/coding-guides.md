---
title: "Coding-Leitfäden"
description: "Architektur- und Coding-Konventionen für wartbare Native Shell Apps und Komponentenbibliotheken in Rust und TSX."
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---


# Coding-Leitfäden

Dieser Leitfaden beschreibt die Anwendungsarchitektur und die Code-Muster, die sich in Native Shell-Apps als beständig erwiesen haben. Er richtet sich sowohl an Entwickler als auch an Coding-Agenten: Entwickler von NSH-Apps (TSX-Module, Rust-Komponenten, native Apps, die NSH einbetten) und Autoren von Komponentenbibliotheken, die auf `nsh/base` aufbauen. Lies zuerst die Design-Leitfäden: Die Code-Struktur soll die Produktabsicht bewahren, nicht ersetzen.

Dies ist ein normativer Leitfaden. **Muss** kennzeichnet Einschränkungen bei Lebenszyklus, Korrektheit oder Ökosystem; **sollte** beschreibt die Standardarchitektur, von der nur mit konkretem Grund abgewichen werden darf. Für exakte Signaturen bleiben der aktuelle Quellcode, die Referenzseiten und die Deklarationen in `.nsh/types` maßgeblich.

<a id="make-the-common-path-inexpensive"></a>

## Den häufigen Weg günstig halten

**Entwurfsprinzip: Wähle Framework-Typen und Besitzverhältnisse so, dass die gewöhnliche Verwendung von Komponenten standardmäßig günstig ist.** Entwickler sollen UI bauen und wiederverwenden können, ohne an jeder Aufrufstelle einen Cache hinzufügen zu müssen. Beispiele dafür sind Komponenten, die nur einmal laufen, und [Signale](./reactivity.md), die dort gelesen werden, wo sie verwendet werden: Eine Komponente baut ihren Teil des Baums einmal auf, danach laufen nur noch die Bindings erneut, die ein geändertes Signal gelesen haben, sodass der häufige Weg wiederholte Arbeit vermeidet. Der reaktive Graph, der Renderer, das Layout und die Listen sind nativ, und ein Durchlauf des App-Codes wird zu einem Stapel nativer Operationen. Kleine Kosten summieren sich dennoch über Elemente und Updates hinweg, vor allem in TSX, dessen eigener Code in einem Interpreter läuft; miss außergewöhnliche Hot Paths, bevor du Caches hinzufügst ([Performance](./performance.md)). Keine der beiden Entscheidungen verspricht null Kosten. Die [Regeln zum Besitz von Zustand](#state-ownership) und die späteren Abschnitte zum Rendering erklären die Mechanik.

<a id="architecture-at-a-glance"></a>

## Architektur auf einen Blick

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

Abhängigkeiten zeigen nach unten. Höhere Schichten besitzen die fachliche Bedeutung und die Orchestrierung; niedrigere Schichten besitzen wiederverwendbare Darstellung oder wiederverwendbares Verhalten. Lass keine wiederverwendbare Komponente von einer App-Seite abhängen und keine Komponentenbibliothek vom Theme einer einzelnen App ([Drei Schichten](./architecture.md#three-layers)).

Verwende diese Grenzen:

- **App-Shell:** Der Einstieg (`App.tsx` oder `nsh.json` `"root"`) setzt die Wurzel und die Navigationsstapel zusammen und hält dabei Seitenlogik heraus;
- **Seite:** ein `NavPage` mit seinem Inhalt, seinen Dialogen und der Arbeit, die es startet;
- **App-Komponente:** ein wiederholtes, fachlich informiertes Muster;
- **Komponentenbibliothek:** gestaltete, universell einsetzbare UI, die eigene der App oder die der Community, aufgebaut auf `nsh/base`;
- **`nsh/base`:** wiederverwendbares Verhalten ohne Produktdarstellung: Navigation, Dialoge, Popovers, Menüs, Sheets, ein Press-Target;
- **`nsh`:** die Primitive, Styles, Layout, Reaktivität und die Umgebung.

<a id="lay-out-an-apps-files"></a>

### Dateien einer App anordnen

Die Dateien einer App folgen den Konventionen von NSH, daher ist nichts zu konfigurieren: `App.tsx` ist der Einstiegspunkt und `nsh.json` liegt daneben; beide werden per Konvention gefunden.

```text
App.tsx            # the entry, by convention: mount(App)
nsh.json
Cargo.toml         # the app's crate, with Rust components ("rust": ".")
src/
  lib.rs
pages/
  Inbox.tsx
  Compose.tsx
  Settings.tsx
components/
  Card.tsx
store.ts
```

- `pages/` enthält eine Datei pro `NavPage`. Eine Seite wächst nur dann auf mehrere Dateien an, wenn sie das braucht.
- `components/` enthält die wiederverwendbaren Komponenten der App, also die, die mehrere Seiten nutzen.
- `store.ts` enthält den Zustand der App: ihre Signale und die Funktionen, die sie ändern. Seiten lesen die Signale und rufen die Funktionen auf.
- Tests sind `*.test.tsx`-Dateien neben dem, was sie testen (`App.test.tsx`, `pages/Inbox.test.tsx`).
- `Cargo.toml` und `src/lib.rs` bilden das eigene Crate der App mit ihren Rust-Komponenten (`nsh.json` `"rust": "."`); sein `#[native_module]` in `src/lib.rs` benennt, was TSX importiert. Eine App, die nur in Rust geschrieben ist, ist dasselbe Cargo-Projekt, mit ihrer Wurzelkomponente in `src/lib.rs` ([Projektstruktur](./project-structure.md)).

Die App-Shell setzt Seiten zusammen, enthält aber wenig Seitenlogik. Seiten lesen die Signale des Stores und rufen dessen Funktionen auf; sie schreiben nie den Zustand einer anderen Seite. Halte die Signale des Stores privat und exportiere, was sie liest und ändert, sodass der veränderliche Zustand hinter seinen öffentlichen Funktionen bleibt:

```rust tabs
/// The app's workspace: its state stays behind these functions.
#[derive(Clone, Copy)]
pub struct Workspace {
    name: Signal<SharedString>,
}

impl Workspace {
    /// A workspace named "Untitled".
    pub fn new() -> Self {
        Self { name: signal(SharedString::from("Untitled")) }
    }

    /// Its name (tracked where it is read).
    pub fn name(&self) -> SharedString {
        self.name.get()
    }

    /// Renames it.
    pub fn rename(&self, name: impl Into<SharedString>) {
        self.name.set(name.into());
    }
}
```

```tsx tabs
// store.ts
import { signal } from "nsh";

const name = signal("Untitled");

/** The workspace's name (tracked where it is read). */
export const workspaceName = () => name();

/** Renames the workspace. */
export function renameWorkspace(next: string) {
  name.set(next);
}
```

Eine Seite kann den Workspace halten und dessen ID an die Suche übergeben; die Suche braucht weder die gesamte Sammlung des Workspace noch dessen private Signale. Eine einfache, zyklenfreie Abhängigkeitsstruktur sieht so aus:

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

Seiten dürfen vom Store und von Komponenten abhängen, aber nicht von der Shell oder von den privaten Teilen einer anderen Seite. Muss eine Seite ändern, was eine andere anzeigt, geschieht das über den Store. Diese Grenzen erlauben es verschiedenen Entwicklern oder KI-Agenten, mit weniger Dateikonflikten und weniger gemeinsamer Zustandskopplung parallel an getrennten Seiten zu arbeiten; der Store erfordert weiterhin Abstimmung.

<a id="bootstrap-and-root-ownership"></a>

## Bootstrap und Besitz der Wurzel

Binde die App einmal ein und gib der Wurzel die gesamte Oberfläche: Ein TSX-Einstieg ruft `mount(App)` auf, eine Rust-App benennt ihre Wurzelkomponente in `nsh.json` (`"root": "App"`). Die Wurzel füllt die Oberfläche mit `flex: 1` und einem Hintergrund aus dem Theme:

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    provide_context(Workspace::new());
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(inbox())
}
```

```tsx tabs
import { mount, View } from "nsh";

mount(() => (
  <View class="flex-1 bg-background">
    <App />
  </View>
));
```

Die Wurzel koordiniert, was zur gesamten Oberfläche gehört: den Navigationsstapel, die Dialoge, Popovers, Menüs, Sheets und Tooltips, die über allem darin angezeigt werden, und die Safe Area. Binde nicht für jede Seite innerhalb einer Oberfläche eine zweite Wurzel ein. Eine Oberfläche ist eine Engine: Jedes `NshAppView`, `NshView` oder `AppView`, das eine native App einbettet, führt seine eigene VM, seinen eigenen Modulzustand und seinen eigenen reaktiven Graphen aus, sodass sich mehrere Oberflächen in einer Host-App nie versehentlich Zustand teilen.

<a id="understand-what-runs-once-and-what-runs-again"></a>

## Verstehen, was einmal und was erneut läuft

NSH arbeitet mit beibehaltenem Zustand und deklarativer Konstruktion, nach dem Modell von Solid ([Reaktivität](./reactivity.md)). Ein Signal überdauert Updates; ein Komponentenrumpf beschreibt seinen Teil des Baums einmal, wenn er erzeugt wird. Halte diese Unterscheidung explizit:

| Du schreibst | Läuft | Läuft erneut, wenn |
| --- | --- | --- |
| Ein Komponentenrumpf | Einmal, bei der Erzeugung | Nie |
| Ein Binding: eine Closure (Rust) oder ein Ausdruck, der eine Property aufruft oder liest (TSX), dort, wo ein Wert hingehört | Einmal | Sich ein gelesenes Signal ändert; nur diese Prop oder dieses Kind wird aktualisiert |
| `computed(fn)` | Bei der Erzeugung | Sich ein gelesenes Signal ändert |
| `effect(fn)` | Nachdem die Elemente des Durchlaufs existieren | Sich ein gelesenes Signal ändert |
| Eine Zeile von `each` / `<Each>` | Wenn ihr Schlüssel zum ersten Mal erscheint | Nie; ihre Item- und Index-Signale ändern sich |
| Eine Zelle von `virtual_list` / `<List>` | Einmal pro Zelle | Nie; der Zelle werden andere Zeilen übergeben |

- Die Komponente, die läuft, ist der **Owner**: Effekte, berechnete Werte, Tasks, Timer, Tastenbindungen und Cleanups, die während ihres Laufs erzeugt werden, gehören ihr und werden mit ihr entsorgt;
- **Context** (`provide_context` / `use_context`, `context()` und `<Ctx.Provider>`) gibt einem Teilbaum einen Wert, ohne zu implizieren, dass die Elemente, die ihn lesen, ihn besitzen;
- das **`Scope`** einer Rust-Komponente (`cx`) gibt ihre Events aus und liest die Insets, die ihr übergeben werden;
- **Refs** (`element_ref()`, `ref`) benennen ein Host-Element für imperative Aufrufe (`focus()`, `scroll_to()`, `measure()`);
- Layout und Messung sind spätere, native Phasen; verwende `onLayout` und `measure()` nur, wenn aufgelöste Geometrie wirklich erforderlich ist.

Lies einen Context nie in einem Event-Handler oder einem Timer, wo es keine Komponente gibt, von der aus er nachgeschlagen werden könnte: Lies ihn im Rumpf und behalte, was er geliefert hat. Behalte typisierte Handles (Signale, Resources, Refs, Domain-IDs), die in Rust `Copy` sind und nichts mehr bewirken, sobald ihr Owner weg ist.

<a id="choose-the-right-unit"></a>

## Die richtige Einheit wählen

<a id="use-a-plain-function-for-value-like-elements"></a>

### Eine einfache Funktion für wertartige Elemente verwenden

**Verwende standardmäßig eine einfache Funktion für leichtgewichtige, wiederverwendbare UI-Teile.** Der Aufrufer liefert aktuelle Props und Handler, die Funktion gibt Elemente zurück, und von ihr bleibt nichts außer den Bindings, die sie erzeugt hat. Ihre Argumente sind ihre Props; das angezeigte Label, der Wert und die Callbacks stammen aus dem aktuellen Zustand des Aufrufers. Sie läuft trotzdem nur einmal, wie jede Komponente: Was sich danach ändert, sind ihre Bindings.

```rust tabs
fn empty_state(title: impl Into<SharedString>) -> impl IntoElement {
    view()
        .gap_2()
        .items_center()
        .child(text(title.into()).text_color(move || theme().muted_foreground))
}
```

```tsx tabs
function EmptyState(props: { title: string }) {
  return (
    <View class="items-center gap-2">
      <Text class="text-muted-foreground">{props.title}</Text>
    </View>
  );
}
```

<a id="use-a-component-for-retained-behavior"></a>

### Eine Komponente für beibehaltenes Verhalten verwenden

Verwende eine `#[component]` (oder eine TSX-Komponente, die Signale erzeugt), wenn ein UI-Teil persistenten Zustand oder einen unabhängigen Lebenszyklus besitzt: Signale, Effekte, asynchrone Arbeit, Timer, Tastenbindungen. Erzeuge diesen Zustand im Komponentenrumpf, einmal, nie innerhalb eines Bindings.

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// Shown while the field is empty.
    pub placeholder: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let query = signal(String::new());
    input()
        .value(move || query.get())
        .on_change(move |text: &str| query.set(text.to_owned()))
        .placeholder(move || props.placeholder.get().to_string())
}
```

```tsx tabs
function Search(props: { placeholder: string }) {
  const query = signal("");
  return <Input value={query()} onChange={({ value }) => query.set(value)} placeholder={props.placeholder} />;
}
```

Eine `#[component]` hat typisierte Props (`#[derive(Props)]`) und Events (`#[derive(Event)]`); TSX importiert sie mit daraus generierten Deklarationen. Beibehaltener Zustand, den TSX mit `new` verwendet (ein Ledger, ein Parser, eine Session), ist ein `#[class]`, und Funktionen sind ein `#[module]` ([Mit Rust entwickeln](./rust.md#extending-a-rust-app-with-tsx)). Schreibe die Teile, die eine App am meisten nutzt, Komponentenbibliotheken und anspruchsvolle Logik in Rust, das von Anfang bis Ende nativer Code ist; verwende TSX für das, was sich oft ändert oder zur Laufzeit ausgeliefert wird.

Mache nicht jedes visuelle Fragment zu einer Komponente. Komponentengrenzen verursachen Kosten bei Lebenszyklus und Koordination; setze sie dort ein, wo beibehaltene Identität wichtig ist.

<a id="elements-views-and-behavior-systems-are-different"></a>

### Elemente, Views und Verhaltenssysteme sind verschieden

Zwänge nicht jede Komponente in eine einzige Vorlage. Das Ökosystem umfasst:

- semantische Elemente wie `Button`, `Switch` und `MenuItem`;
- zusammengesetzte Verhaltenswurzeln wie `Dialog`, `Popover`, `Menu`, `ContextMenu`, `Sheet` und `NavStack`;
- zustandsbehaftete Systeme wie `Input`, `List`, `TextView` und den Zustand eines Navigationsstapels;
- Infrastruktur wie Overlays und ihre Platzierung, Virtualisierung, Scrollen, Safe Areas, die Tastatur und Animation.

Ein Element kann intern komplex und für seinen Aufrufer dennoch wertartig sein. Ein zustandsbehaftetes System kann Render-Funktionen bereitstellen, damit Apps die Darstellung besitzen, ohne das Verhalten neu zu implementieren. Wähle die öffentliche Schnittstelle anhand des Verhaltens, nicht danach, wie viele Views in seiner Ausgabe erscheinen.

<a id="state-ownership"></a>

## Besitz von Zustand

<a id="own-persistent-ui-text-with-103"></a>

### Persistenten UI-Text mit `SharedString` besitzen

**In Rust muss `SharedString` für UI-Text bevorzugt werden, der über Updates oder Callback-Closures hinweg beibehalten wird**, darunter Labels, Titel und Platzhalter von Komponenten: Props nehmen ihn entgegen (`Prop<SharedString>`), und ihn in ein Binding zu klonen kopiert den Text nicht. Verwende für einen veränderlichen Bearbeitungspuffer oder für Text, der mit Formatierung zusammengesetzt wird, `String` und konvertiere, wenn das Ergebnis bereit ist; verwende für temporären, lesenden Zugriff während eines Aufrufs `&str`. In TSX sind Strings die eigenen Werte der App; halte Text, der aus Zustand berechnet wird, in einem `computed` oder einer Closure, statt ihn an mehreren Stellen neu aufzubauen.

Bei unveränderlichem Antworttext, den die UI beibehält, belasse den empfangenen Wert unverändert und lege abgeleiteten oder formatierten Darstellungstext in einem separaten Domain-Wert ab, statt die Antwort umzuschreiben.

Lege jeden Zustand beim engsten Owner ab, der ihn korrekt halten kann:

- Domain-Zustand gehört dem Store (`store.ts`) oder dem Crate der App;
- flüchtiger View-Zustand gehört der Komponente, die ihn rendert, als Signal;
- wiederverwendbarer Verhaltenszustand gehört der Komponente, die dafür entworfen wurde (ein `Menu` oder `Popover` ohne `open` hält seinen eigenen);
- Zustand, den sich ein Teilbaum teilt, ist ein Signal, das über [Context](./reactivity.md#context) bereitgestellt wird;
- was einen Lauf überdauert, gehört in den [Speicher](../modules/nsh.md#storage) oder auf einen Server.

Bevorzuge kontrollierte Werte für gewöhnliche Auswahl und Schalter: Übergib der Komponente den aktuellen Wert, empfange eine angeforderte Änderung, aktualisiere den Owner, und die Bindings folgen. Ein Callback meldet eine Absicht; er sollte keine zweite versteckte Quelle der Wahrheit schaffen.

```rust tabs
switch()
    .checked(show_hidden)
    .on_change(move |next: &bool| show_hidden.set(*next))
    .child(text("Show hidden files"))
```

```tsx tabs
<Switch checked={showHidden()} onChange={({ checked }) => showHidden.set(checked)}>
  <Text>Show hidden files</Text>
</Switch>
```

Es gibt nichts zu benachrichtigen: Das Schreiben eines Signals aktualisiert genau die Bindings, die es lesen. Eine Rust-Komponente gibt ein semantisches Event aus, das ihr Owner mit `cx.emit(..)` behandeln sollte; ein Effekt folgt einem Signal, solange sein Owner lebt. Schreibe mehrere Felder, die eine Invariante bilden, in einem [`batch`](./reactivity.md#batch), damit Effekte und berechnete Werte sie gleichzeitig sehen.

Eine kontrollierte Komponente der App selbst folgt demselben Vertrag. Ein Mengen-Stepper, ein einmal in Rust geschriebenes Domain-Control, platziert aus Rust und TSX:

```rust tabs
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The props of [`QuantityStepper`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct QuantityStepperProps {
    /// The quantity: the app owns the value.
    #[prop(default)]
    pub value: Prop<u32>,
    /// The smallest quantity (0 when left out).
    #[prop(default)]
    pub min: Prop<u32>,
    /// The largest quantity (99 when left out).
    #[prop(default = 99)]
    pub max: Prop<u32>,
    /// What screen readers say for the button that takes one away.
    pub decrement_label: Prop<SharedString>,
    /// What screen readers say for the button that adds one.
    pub increment_label: Prop<SharedString>,
}

/// What a [`QuantityStepper`] reports.
#[derive(Debug, Clone, PartialEq, Event)]
pub enum QuantityStepperEvent {
    /// The user asked for another quantity; the owner sets `value`.
    Change(u32),
}

/// A quantity with a button to take one away and one to add one.
#[component]
pub fn QuantityStepper(props: QuantityStepperProps, cx: Scope<QuantityStepperEvent>) -> impl IntoElement {
    // Read untracked: the user's act, measured against the owner's current value.
    let step = move |delta: i64| {
        let value = props.value.get_untracked();
        let (min, max) = (props.min.get_untracked(), props.max.get_untracked());
        let next = (i64::from(value) + delta).clamp(i64::from(min), i64::from(max)) as u32;
        if next != value {
            cx.emit(QuantityStepperEvent::Change(next));
        }
    };
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .child(step_button(
            "−",
            move || props.decrement_label.get(),
            move || props.value.get() <= props.min.get(),
            move || step(-1),
        ))
        .child(text(move || props.value.get().to_string()).text_color(move || theme().foreground))
        .child(step_button(
            "+",
            move || props.increment_label.get(),
            move || props.value.get() >= props.max.get(),
            move || step(1),
        ))
}

fn step_button(
    symbol: &'static str,
    label: impl Fn() -> SharedString + 'static,
    disabled: impl Fn() -> bool + 'static,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .disabled(disabled)
        .accessibility_label(move || Some(label()))
        .on_press(on_press)
        .w(px(32.0))
        .h(px(32.0))
        .items_center()
        .justify_center()
        .rounded(move || theme().radius)
        .bg(move || theme().muted)
        .active(|s| s.opacity(0.6))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(symbol).text_color(move || theme().foreground))
}

// The owner:
let quantity = signal(1_u32);
quantity_stepper()
    .value(quantity)
    .min(1)
    .max(10)
    .decrement_label("Fewer")
    .increment_label("More")
    .on_change(move |next: &u32| quantity.set(*next))
```

```tsx tabs
import { signal } from "nsh";
import { QuantityStepper } from "my-app";   // the Rust component: src/lib.rs has #[native_module("my-app")]

function CartRow() {
  const quantity = signal(1);
  return (
    <QuantityStepper
      value={quantity()}
      min={1}
      max={10}
      decrementLabel="Fewer"
      incrementLabel="More"
      onChange={({ value }) => quantity.set(value)}
    />
  );
}
```

Derselbe Vertrag in TSX, eine Komponente in `components/`:

```tsx
import { Text, View } from "nsh";
import { Button } from "nsh/base";

export interface QuantityStepperProps {
  /** The quantity: the app owns the value. */
  value: number;
  /** The smallest quantity (0 when left out). */
  min?: number;
  /** The largest quantity (99 when left out). */
  max?: number;
  /** What screen readers say for the button that takes one away. */
  decrementLabel: string;
  /** What screen readers say for the button that adds one. */
  incrementLabel: string;
  /** The user asked for another quantity; the owner sets `value`. */
  onChange?: (e: { value: number }) => void;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 99;
  const step = (delta: number) => {
    const next = Math.min(max(), Math.max(min(), props.value + delta));
    if (next !== props.value) props.onChange?.({ value: next });
  };
  const buttonClass = "size-8 items-center justify-center rounded-(--radius) bg-muted active:opacity-60 disabled:opacity-40";
  return (
    <View class="flex-row items-center gap-3">
      <Button disabled={props.value <= min()} accessibilityLabel={props.decrementLabel} onPress={() => step(-1)} class={buttonClass}>
        <Text class="text-foreground">−</Text>
      </Button>
      <Text class="text-foreground">{props.value}</Text>
      <Button disabled={props.value >= max()} accessibilityLabel={props.incrementLabel} onPress={() => step(1)} class={buttonClass}>
        <Text class="text-foreground">+</Text>
      </Button>
    </View>
  );
}
```
<a id="keep-ownership-links-and-subscriptions-bounded"></a>

### Eigentumsbeziehungen und Abonnements begrenzt halten

Eine Komponente besitzt, was sie erzeugt, und alles, was sie erzeugt hat, verschwindet mit ihr: wenn ihr `<If>`-Zweig ausgeblendet, ihre Zeile entfernt oder ihre Seite per Pop vom Stack genommen wird. In Rust enden Tasks, Timer und Intervalle (`spawn`, `set_timeout`, `set_interval`) sowie Tastenbelegungen (`on_key`) mit dem Owner, unter dem sie erzeugt wurden. In TSX registrierst du das Beenden mit [`cleanup`](./reactivity.md#cleanup) oder gibst es aus dem Effect zurück. Das Lauschen erfolgt mit `on(event, listener)` (`host.on(name, listener)`, `BackHandler.on("press", listener)`); es liefert eine Funktion zurück, die das Lauschen beendet (`() => void`, aus Rust heraus ein `Stop`). Was während des Renderns einer Komponente registriert wird, verschwindet mit der Komponente, so wie die Bindings von `keymap.bind`.

Wenn etwas unerwartet weiterläuft, prüfe zuerst Effects und berechnete Werte, die außerhalb einer Komponente erzeugt wurden (in einem Event-Handler oder einem Timer-Callback haben sie keinen Owner und leben für immer), Listener, die ohne ihren Stopp registriert wurden, und Arbeit, die von einem Store gestartet wurde, den keine Komponente besitzt. Ein verworfener `resource`-Ladevorgang wird abgebrochen (`info.signal` in TSX); er hält seine Komponente nicht am Leben. Das sind häufige Ausgangspunkte, keine vollständige Liste.

Schreibe kein Signal, nur weil ein Wert gelesen oder abgeleitet wurde. Vermeide unbedingte Schreibzugriffe aus einem Binding oder einem Effect, der dasselbe Signal liest: Er löst sich selbst erneut aus, bis NSH ihn mit einem Fehler stoppt. Ein Wert, der aus anderem Zustand berechnet wird, ist ein `computed` und kein Effect, der ein zweites Signal schreibt.

<a id="avoid-state-feedback-loops"></a>

### Zustandsrückkopplungsschleifen vermeiden

Texteingabe, Auswahl, Filter und gesteuerte Popups haben häufig zwei Pfade: Ein externer Owner aktualisiert den Wert, und die Benutzerinteraktion fordert einen neuen Wert an. Sende einen vom Owner gelieferten Wert während der Synchronisierung nicht über den Benutzer-Callback zurück. Lies den aktuellen Wert des Owners untracked, wenn du die Aktion des Benutzers verarbeitest (`props.value.get_untracked()` in Rust, wie oben; ein TSX-Event-Handler ist bereits untracked), und vergleiche ihn mit dem nächsten Wert, damit jede logische Änderung genau einmal gemeldet wird. Mache Callbacks reentranzsicher, wenn ein Callback die Komponente, die ihn aufgerufen hat, synchron schließen, ersetzen oder aktualisieren kann.

<a id="stable-identity"></a>

## Stabile Identität

Ein Key ist Teil des Verhaltens. Er gibt einer Zeile, einer Seite oder einem wiederholten Steuerelement eine stabile Identität und entscheidet, welches seinen Zustand, seinen Fokus und seine Messwerte behält, wenn sich die Daten ändern.

- Verwende stabile Domain-IDs für Zeilen, Tabs, Seiten und wiederholte Steuerelemente: `each(projects, |p| p.id, ..)`, `<Each of={projects()} key={(p) => p.id}>`, den `keyExtractor` einer Liste.
- Versieh Test-IDs mit dem Namensraum des besitzenden Objekts, wenn sich dasselbe Steuerelement wiederholt (`delete-${project.id}`).
- Leite die Identität niemals aus einem übersetzten Label oder einem veränderlichen Listenindex ab, wenn Elemente eingefügt oder umsortiert werden können.
- Erzeuge beim Rendern keinen neuen zufälligen Key und keine neue zufällige ID.

```rust tabs
each(projects, |p| p.id, move |project, _index| {
    let id = project.get_untracked().id;
    button()
        .on_press(move || delete(id))
        .child(text("Delete").test_id(&format!("delete-{id}")))
})
```

```tsx tabs
<Each of={projects()} key={(p) => p.id}>
  {(project) => (
    <Button onPress={() => remove(project().id)}>
      <Text testID={`delete-${project().id}`}>Delete</Text>
    </Button>
  )}
</Each>
```

Ein geänderter Key bedeutet eine geänderte UI-Identität. Behandle dieses Zurücksetzen als bewusste Entscheidung.

Dieselbe Regel gilt für Navigationsrouten, Listen-Keys, Storage-Keys und Test-IDs. Eine Route, die in `setRoutes` bleibt, behält ihre Seite und ihren Zustand; wenn sich zwei unabhängig voneinander erhaltene Verhaltensweisen einen Key teilen, können sie gegenseitig ihren Zustand überschreiben; wenn eine Verhaltensweise bei jedem Update den Key wechselt, sammelt sie nie Zustand an.

<a id="rendering-and-composition"></a>

## Rendering und Komposition

Halte den Body einer Komponente deklarativ: aktuellen Zustand lesen, Darstellungswerte ableiten und Elemente zusammensetzen. Verlagere Domain-Operationen, Parsing und nicht triviale Mutationen in benannte Funktionen des Stores oder des Crates der App.

```rust tabs
#[component]
pub fn ProjectPage() -> impl IntoElement {
    view()
        .flex_1()
        .child(toolbar())
        .child(content())
}
```

```tsx tabs
function ProjectPage() {
  return (
    <View class="flex-1">
      <Toolbar />
      <Content />
    </View>
  );
}
```

Extrahiere einen Helper, wenn er einen sinnvollen Bereich benennt und die Menge an Zustand verringert, die ein Leser gleichzeitig im Kopf halten muss. Extrahiere eine neue Komponente, wenn der Bereich einen eigenen wiederverwendbaren Vertrag oder einen eigenen erhaltenen Lebenszyklus hat, nicht bloß weil eine Builder-Kette oder ein JSX-Block lang ist.

Verwende in Rust durchgängig die typisierten Style-Methoden und die Builder der Komponenten, in TSX Klassen. Bevorzuge `.when(..)` / `.when_some(..)` (Rust) und `classList` (TSX) für kleine bedingte Anpassungen; verwende `when` / `<If>`, wenn die Zweige wesentlich unterschiedliche Oberflächen darstellen, denn ein Ternary in einer Closure baut seinen Zweig jedes Mal neu auf, wenn sich etwas ändert, das er liest.

Komponiere aus der semantischen Standardkomponente, bevor du eine eigene Oberfläche baust. Bilde kein Menü, kein Popover, kein Sheet und keinen Dialog aus generischen Views nach, nur um einem einzelnen Screenshot zu entsprechen: `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Tooltip` und `Dialog` aus `nsh/base` gewährleisten Platzierung, Fokusübergabe, Tastaturnavigation, Auswahl, deaktivierten Zustand, Schließen per Escape und Zurück sowie den Accessibility-Vertrag. Wenn die Standardkomponente ein wiederkehrendes gültiges Muster nicht ausdrücken kann, verbessere ihre explizite API, anstatt an jeder Aufrufstelle beliebige Nachfahren zu stylen.

Von App-Code gelieferte Render-Funktionen sollten frei von Seiteneffekten sein. Die Zeile einer Liste, der `renderCodeBlock` eines `TextView` oder die Einträge eines Menüs können jedes Mal laufen, wenn ihr Owner eine Zelle, einen Part oder eine Öffnung benötigt. Sie dürfen keine Geschäftsoperation ausführen, keine Daten anhängen und kein unbegrenztes Abonnement starten.

<a id="behavior-and-presentation-boundary"></a>

## Grenze zwischen Verhalten und Darstellung

Die dauerhafte Base-Regel lautet:

> Base besitzt wiederverwendbares Verhalten und die Struktur, die zu dessen Umsetzung nötig ist. Die Präsentationsschicht besitzt die visuelle Sprache des Produkts.

„Unstyled“ bedeutet nicht „eine einzige leere View“. Overlay-Platzierung, Tastaturnavigation, Bearbeitung, Virtualisierung, Zurück-Navigation, Schließen und Safe Areas erfordern interne Struktur und internen Zustand. Diese Arbeit auf jeden Aufrufer zu verlagern, schafft keine Flexibilität, sondern dupliziert fragiles Verhalten.

Umgekehrt darf Base keine Markenfarben, Typografie, Dichte, finalen Icons, Komponentenvarianten, Strings oder Anwendungskomposition festlegen. Stelle die Darstellung über `class` / `style` am Hauptteil, `<part>Class` / `<part>Style` für jeden anderen Part, typisierte Zustandsstile (`active`, `hover`, `focus`, `selected`, `checked`, `disabled`), benannte Slots (`trigger`, `header`, `footer`) und Render-Funktionen bereit. Untersuche keine beliebigen Nachfahren, um Titel, Beschreibungen oder Schließen-Buttons zu finden: Mache semantische Parts explizit und übernimm jedes Label als Prop oder Child.

<a id="theme-and-styling"></a>

## Theme und Styling

Lies semantische Werte aus dem Theme und wende das Layout mit den typisierten Style-Methoden in Rust und mit Tailwind-Klassen in TSX an ([Tailwind](./tailwind.md), [Theme-Tokens](./tailwind.md#theme-tokens)):

```rust tabs
view()
    .bg(move || theme().background)
    .text_color(move || theme().foreground)
    .border_1()
    .border_color(move || theme().border)
    .rounded(move || theme().radius)
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-background text-foreground" />
```

Regeln:

- keine Produktfarben, Eckenradien, Abstände oder Steuerelement-Geometrie fest codieren;
- App-Code darf keine rohen Hex-, `rgb` / `rgba`- oder `hsla`-Werte einführen; lies eine semantische Farbe aus `theme()` oder einer Token-Klasse (`bg-primary`) oder ergänze die fehlende Rolle in der Theme-Datei der App;
- App-Layout sollte die Abstands- und Typskalen (`p-2`, `gap-3`, `w-64`, `text-sm`; `.p_2()`, `.gap_3()`, `.w_64()`, `.text_sm()`) statt beliebiger Werte (`p-[13px]`, `px(13.0)`) verwenden;
- Klassen bedeuten genau das, was sie in Tailwind CSS v4 bedeuten, und Style-Werte das, was die [Style-Referenz](../modules/style-reference.md) ihnen zuweist (die von CSS, in nativen Formen: Zahlen sind Punkte); eine `unknown class`-Warnung ist ein Befund, der behoben werden muss;
- verwende semantische Tokens für Bedeutung, nicht für die Position in der Palette;
- halte zustandsunabhängige Geometrie in der gewöhnlichen Builder-Kette oder im Klassenstring;
- verwende `active:`, `hover:` und `focus:` (`.active(..)`, `.hover(..)`, `.focus(..)`) für Interaktionszustände zur Laufzeit; sie werden nativ angewendet, ohne Umweg über den App-Code;
- verwende die semantischen Zustandsstile einer Komponente (`selected:`, `checked:`, `disabled:`) für das Erscheinungsbild von markiert, ausgewählt, gedrückt oder deaktiviert;
- halte die Popup-Ownership in explizitem Zustand (`open` mit `onOpenChange`), damit sein Trigger bis zum Schließen das geöffnete oder gedrückte Erscheinungsbild darstellen kann;
- halte Komponentenvarianten wenige und sinnvoll, statt für jede Aufrufstelle eine Variante hinzuzufügen;
- binde das primäre Styling an den tatsächlichen Standard-Commit des Entscheidungsbereichs und seine Return-Taste-Aktion; leite es nicht aus der Anzahl der Aktionen, ihrer Häufigkeit oder der Position in der Toolbar ab;
- halte Badge- und Alert-Varianten semantisch und sparsam. Gewöhnliche Metadaten bleiben neutral; ordne nicht jedem Enum-Fall oder Abschnitt eine andere Farbe zu, nur weil eine Variante existiert.

Die effektive Rangfolge ist: der eigene Stil des Elements, dann die Zustandsstile, wobei spätere Zustände gewinnen, und `disabled` über allem. Spätere Ebenen ersetzen nur die Felder, die sie setzen.

Bevorzuge die semantischen Tokens des Themes für neue, von der App verantwortete Darstellung. Jeder Name in der Theme-Datei der App ist ein Token, ebenso wie eine Variable von Tailwinds `@theme` (`"up": "#16a34a"` ergibt `text-up`, `bg-up/30`, `token("up")` in TSX und `theme().color("up")` in Rust), und das Theme hat helle und dunkle Werte, sodass ein Token dem Erscheinungsbild ohne `dark:`-Klasse folgt. Benenne Tokens nach Rollen, nicht nach Komponenten, damit sie nicht zum Erweiterungspunkt für jedes Widget werden.

Ändere das Theme über die Theme-Datei der App (`nsh.json` `"theme"`) oder lass die einbettende App ihr eigenes mitgeben: Klassen, die Tokens benennen, und Rust-Bindings, die `theme()` lesen, werden nativ neu gestylt, sobald es sich ändert, ohne dass JavaScript läuft. Code, der den Wert eines Tokens in ein eigenes Signal kopiert, folgt ihm nicht mehr.

Ein nach außen gezeichneter Fokusring braucht physischen Platz. Ein Vorfahre mit `overflow: hidden` (`overflow-hidden`) beschneidet ihn. Bevorzuge Layouts, die Platz lassen; wenn ein Produkt stark beschneiden muss, zeichne den Fokuszustand innerhalb des Steuerelements, anstatt stillschweigend jeden Tastaturfokus zu verbergen.

<a id="the-users-text-size-is-the-apps-zoom"></a>

### Die Textgröße des Benutzers ist der Zoom der App

Text folgt der Textgröße des Benutzers (Dynamic Type, Androids Schriftskalierung, die Einstellungen der Desktops): `fontScale()` in TSX, `font_scale()` in Rust, beide reaktiv. Die Typskala (`text-sm`, `text-base`: 16 Punkte, die Fließtextgröße) legt die Referenz fest, und die Einstellung des Benutzers skaliert sie. Das folgt bewusst dem nützlichen Teil des Tailwind-Modells: benannte Schrift-, Abstands- und Größenstufen statt unzusammenhängender Punktkonstanten.

Lass Textcontainer mit ihrem Text wachsen: Gib ihnen Mindesthöhen und Padding statt fester Höhen. Eine eigene Komponente, die skalierten Text mit fester Geometrie um ihn herum kombiniert, muss dokumentieren, warum dieser Teil nicht mitwachsen soll.

Behandle jeden beliebigen Punktwert und jeden rohen Farbkonstruktor in der App-UI als Review-Befund. Akzeptiere sie nur für eine dokumentierte physische oder plattformbedingte Grenze, gemessene Laufzeitgeometrie, Raster- oder Datenfarben oder die Theme-Definition selbst. Bequemlichkeit und die Übereinstimmung mit einem Screenshot sind keine gültigen Ausnahmen.

Alles, was aus aufgelöstem Layout zwischengespeichert wird, muss die Schriftskalierung in seinem Invalidierungsschlüssel enthalten, direkt oder über eine Revision, die sich mit ihr ändert: Zeilenhöhen, die einer Liste mitgeteilt wurden, Textmessungen, Popup-Geometrie, aus Text abgeleitete Icon-Größen und benutzerdefinierte Canvas-Metriken.
<a id="events-commands-and-focus"></a>

## Ereignisse, Befehle und Fokus

Verwende Presses zur Aktivierung: `onPress`, `onLongPress`, `onPressDown` und `onPressUp` bedeuten mit einem Finger, einem Stift, einer Maus oder der Tastatur dasselbe. Nutze Touch-Handler und Gesten nur für das, was dem Finger folgt (ein Pan, ein Drag). Verwende Tastenkürzel (`keymap.bind`, `on_key`) und Menüeinträge für Befehle, die Tastenbelegungen, Menüs oder den Aufruf aus mehreren Eingaben unterstützen sollen. Halte die Handler nah an der Seite, der der Befehl gehört.

Modelliere jeden logischen Befehl nur einmal. Ein `Button`, ein `Menu`-Eintrag, ein `ContextMenu`-Eintrag, ein Anwendungsmenüeintrag von `nsh/desktop` und ein Tastenkürzel sollten dieselbe Funktion des Stores aufrufen, statt fünf Mutationen zu kopieren. Leite Label, Icon, Tastenkürzel und Disabled-Zustand, wo sinnvoll, aus einer einzigen Command-Policy ab (`key_label("mod+s")` schreibt ein Tastenkürzel in der Schreibweise der Plattform), damit die Einstiegspunkte nicht voneinander abweichen können. Das Menü verantwortet Navigation und Schließen; die Seite entscheidet weiterhin, ob der Befehl erlaubt ist und was er bewirkt.

```rust tabs
on_key("mod+s", move |_| save());
view()
    .child(button().on_press(save).child(text("Save")))
    .child(
        menu()
            .trigger(view().px_3().py_2().child(text("File")))
            .child(menu_item().on_select(save).child(text(format!("Save  {}", key_label("mod+s"))))),
    )
```

```tsx tabs
keymap.bind("mod+s", save);

<View>
  <Button onPress={save}><Text>Save</Text></Button>
  <Menu trigger={<View class="px-3 py-2"><Text>File</Text></View>}>
    <MenuItem onSelect={save}><Text>Save  {keymap.label("mod+s")}</Text></MenuItem>
  </Menu>
</View>
```

Bewahre die semantischen Rollen bei der Elementwahl. Verwende `Button` für Befehle, auch wenn die gewünschte Darstellung zurückhaltend ist; gib ihm einen zurückhaltenden Stil, statt es durch einen Link zu ersetzen. NSH-Apps reservieren die Rolle `link` für Ziele, die außerhalb der App geöffnet werden, etwa eine URL oder eine E-Mail-Adresse; nutze Navigation für ein Ziel innerhalb der App und `Button` für einen Befehl.

Stoppe die Propagation (`stopPropagation()` bei einem Touch-Ereignis) nur dann, wenn eine verschachtelte Interaktion verhindern muss, dass ihr Parent denselben Touch verarbeitet. Pauschale Propagation-Stopps beeinträchtigen Scrollen, Presses und Gesten auf eine Weise, die schwer zu diagnostizieren ist.

**Der Main-Thread wartet nie auf App-Code.** Braucht das System sofort eine Antwort (darf diese Seite gepoppt werden, darf dieses Sheet oder Popover schließen, darf sich dieser Text ändern), antwortet NSH nativ anhand von Props, die vorher gemountet wurden, und ein Ereignis informiert die App anschließend. Eine Entscheidung ist daher ein Prop, der gesetzt wird, sobald sie feststeht, und kein Callback, der true oder false zurückgibt: `popOnBack={!dirty()}` mit `onBackPress` zur Bestätigung ([popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback)), `closeOnEscape` und `closeOnBackdropPress` mit `onCancel`, um den Versuch mitzubekommen, `maxLength` bei einem Input, `disabled` bei einem Button.

Das `shortcut` (`nsh/desktop`) eines Menüeintrags bindet seine Taste, solange das Menü gesetzt ist, und das Menü zeigt es im Stil der Plattform an; eine `keymap`-Bindung desselben Tastenanschlags hat Vorrang. Gib jedem Tastenanschlag genau einen Besitzer und setze das Anwendungsmenü erneut, wenn sich seine Einträge oder Tastenkürzel ändern.

Mache die Fokusverwaltung explizit:

- `Button`, `Switch` und Menüeinträge sind auf den Desktop-Plattformen und im Web Stationen des Tastaturfokus; baue Controls darauf auf statt auf bloßen Views;
- verschiebe den Fokus mit dem `focus()` einer Ref aus einem Ereignis oder einem Effect, der auf eine Zustandsänderung folgt, und den des Screenreaders mit `set_accessibility_focus()` (Rust) bzw. `setAccessibilityFocus` aus `nsh` (TSX);
- rendere einen sichtbaren `focus:`-Zustand;
- fordere den Fokus nicht bedingungslos während des Renderns an.

Zusammengesetzte Widgets sollten das vollständige Navigationsmodell umsetzen (Pfeiltasten, Home / End oder seitenweise Bewegung, wo passend, Bestätigen, Abbrechen und Tab-Verhalten) statt nur einiger vereinzelter Tastenkürzel.

Overlays werden von oben geschlossen: Escape und die Zurück-Taste von Android gehen an das oberste Overlay, das zuhört (`onCancel`). Behandle schnelle Abfolgen von Schließen und Öffnen, ohne auf einer dazwischenliegenden, bereits schließenden Oberfläche zu agieren.

<a id="async-work-and-side-effects"></a>

## Asynchrone Arbeit und Seiteneffekte

Starte asynchrone Arbeit aus einem Ereignis, einem Effect oder einem [`resource`](./reactivity.md#resource), nicht als bedingungslosen Seiteneffekt des Komponentenkörpers. Ein Effect verfolgt nur das, was er synchron liest: Lies zuerst die Signals und starte dann die Arbeit. Wenn die Arbeit abgeschlossen ist, aktualisiere den Zustand über Signals, rechne damit, dass die Komponente nicht mehr existiert, und schreibe zusammengehörige Änderungen gemeinsam.

Halte wiederkehrende Arbeit unter einem Owner, damit sie abgebrochen wird, sobald er verschwindet: Rust-Tasks und -Timer enden mit ihrem Owner, TSX-Timer stoppen in `cleanup`. Ein einmaliger Task, der unabhängig abschließen muss, kann aus dem Store gestartet werden, verzichtet dadurch aber auf diese Abbruchgarantie. Behandle Fehler und fehlgeschlagene Anfragen explizit.

Bilde asynchrone Operationen mit expliziten Zuständen ab: Der `state()` einer Resource ist `unresolved`, `pending`, `ready`, `refreshing` oder `errored`. Bewahre beim Aktualisieren brauchbare vorherige Daten: Eine Resource behält ihren Wert, während sie erneut lädt. Verhindere doppelte destruktive Übermittlungen und zeige behebbare Fehler in der UI an; verlasse dich nicht auf Logs als Rückmeldung an Nutzer.

```rust tabs
let results = resource(
    move || {
        let q = query.get();
        (!q.is_empty()).then_some(q)
    },
    |q, _info| async move {
        let response = fetch(format!("https://api.example.com/search?q={q}")).await?;
        if !response.ok() {
            return Err(format!("HTTP {}", response.status()));
        }
        Ok(response.text())
    },
);
```

```tsx tabs
const results = resource(
  () => query() || undefined,
  async (q, { signal }) => {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as SearchHit[];
  },
);
```

Verlagere aufwendiges Parsen oder Berechnen aus TSX-Handlern: in einen `computed`, weg vom Interaktionspfad, oder nach Rust. Ergebnisse können eintreffen, nachdem sich die Abfrage, die Seite oder die Auswahl geändert hat: Eine Resource verwirft überholte Ladevorgänge, und eigene Arbeit versieht sich mit einer Revision oder Identität und weist veraltete Ergebnisse ab, statt sie auf den neuen Zustand anzuwenden.

<a id="layout-measurement-and-scrolling"></a>

## Layout, Messung und Scrolling

Eine View ordnet ihre Kinder in einer Spalte an, und die Kinder werden standardmäßig über diese Spalte gestreckt; `class="flex"` (`.flex_row()`) ist eine Zeile, wie in CSS. Eine Zeile aus Controls will ihre Kinder zentriert haben (`items-center`), was das ausdrücklich sagt. Eine Zeile aus Spalten in voller Höhe behält den Standard-Stretch, sodass eine Spalte die Höhe der Zeile ausfüllt und ihr Header oben bleibt:

```rust tabs
view()
    .flex_row()
    .flex_1()
    .child(sidebar())
    .child(content())
```

```tsx tabs
<View class="flex flex-1">
  <Sidebar />
  <Content />
</View>
```

Die meiste UI sollte Layout nutzen, statt selbst zu messen ([Layout](./layout.md)). Messung (`onLayout`, `measure()`) ist ein tiefgreifendes Verhaltenswerkzeug für Overlays, Virtualisierung, Editoren, Diagramme und ähnliche Komponenten, deren Korrektheit von aufgelöster Geometrie abhängt.

- Lege Messung und Geometrie in die Schicht, der das Verhalten gehört.
- Beobachte das Layout nur, wenn gewöhnliches Layout die Beziehung nicht ausdrücken kann.
- Schreibe niemals bei jedem Layout-Ereignis nicht zusammenhängenden App-Zustand.
- Behandle gemessene Daten als revisionsgebunden; sie können nach Änderungen von Textgröße, Breite, Theme oder Inhalt veralten.
- Überlasse die Platzierung von Popups den Overlays von `nsh/base`: Platzierung, Flipping und Safe-Area-Abstände folgen einer einzigen Policy.

Bei Ausrichtungsinvarianten ist Konstruktion der Korrektur vorzuziehen: Benachbarte Bereiche sollten dasselbe Spacing-Token oder denselben gemeinsamen Inset verwenden, statt gleiche Literale zu wiederholen. Füge Geometrieprüfungen oder Screenshots auf einer echten Plattform (`nsh test --target`) für kritische wiederkehrende Kanten, Spalten und Abstände hinzu. Teste mehr als das Standardfenster: Eine große Textgröße und Display-Skalierung können aus Bruchkoordinaten einen Versatz von einem Pixel machen, selbst wenn der Standard-Screenshot ausgerichtet aussieht.

Miss das aufgelöste Ergebnis, wenn du die Präzision prüfst, kodiere eine gemessene Korrektur aber nicht als beliebigen Wert. Führe die Abweichung auf doppeltes Padding, verschachtelte Insets, Border-Zuständigkeit, Schriftmetriken oder Rundung zurück und behebe dann den strukturell verantwortlichen Ort.

Jede scrollbare Region muss genau einen Owner haben. Vermeide versehentliches verschachteltes Scrollen auf derselben Achse. Gib der Scroll-View das Element, das die gesamte Seite, das Panel oder die Liste besitzt, damit sich ihr Indikator am Rand der Region orientiert, und lege den Inset des Inhalts in sie hinein (`contentClass` / `contentStyle`), statt die Scroll-View in einen Container mit Padding zu packen. Ein Indikator, der zwischen Inhalt und Seitenrand schwebt, deutet meist auf den falschen Scroll-Owner oder Padding auf der falschen Ebene hin. Halte Abstand zur Safe Area und zur Tastatur mit `env(safe-area-inset-*)` und `env(keyboard-inset-height)` in Padding und Margin (lies die Werte über ihre Accessors), die Rotation und Tastatur nativ folgen.

<a id="lists-tables-and-large-data"></a>

## Listen, Tabellen und große Datenmengen

Verwende [`List`](./lists.md) (`virtual_list` in Rust), wenn Daten über eine kleine, begrenzte Sammlung hinauswachsen können. Halte die Zeilenidentität getrennt von der sichtbaren Position und vermeide es, bei jeder Aktualisierung den gesamten Datensatz zu kopieren. Lass die Liste Recycling, Scroll-Koordination und den sichtbaren Bereich verantworten, während die Zeilenfunktionen die Darstellung der Zeilen verantworten.

Trenne:

- Quelldaten und Domain-IDs;
- Filter- und Sortierzustand;
- Auswahlzustand;
- Scroll-Zustand;
- Zeilen-Rendering.

So bleiben Aktualisierungen lokal, und der View-Baum wird nicht zum Datenmodell.

Virtualisierung ist ein Verhaltensvertrag, nicht bloß ein Performance-Schalter. Eine Zeilenfunktion läuft einmal pro Zelle, und Zellen werden für andere Zeilen wiederverwendet:

- **Zustand pro Element muss in Daten liegen, die nach ID indiziert sind**, nicht in einem Signal, das innerhalb der Zeile erzeugt wird und mit der Zelle zum nächsten Element wandert;
- **das Element muss dort gelesen werden, wo es verwendet wird**, in Bindings: Ein Wert, der am Anfang der Zeilenfunktion kopiert wird, gehört zur ersten Zeile, die die Zelle angezeigt hat;
- aktualisiere in TSX immutabel (ein neues Array, unveränderte Elemente wiederverwendet, ein geändertes Element als neues Objekt) und gib einen `estimatedItemSize` nahe an der typischen Zeile an;
- das Scrollen zu einem Element (`scrollToIndex`) funktioniert in Datenkoordinaten, auch wenn die meisten Zeilen nicht existieren.

```rust tabs
let liked = signal(HashSet::<u32>::new());

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
```

```tsx tabs
const liked = signal<Set<number>>(new Set());

<List each={posts()} estimatedItemSize={64} class="flex-1">
  {(post) => (
    <View class="flex-row p-4">
      <Text class="flex-1">{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

<a id="public-api-design"></a>

## Design der öffentlichen API

Für wiederverwendbare Komponenten gilt:

- Props legen gültige Standardwerte fest: `#[prop(default)]` oder `#[prop(default = …)]` in Rust, `??` dort, wo der Prop in TSX gelesen wird;
- jeder Prop, jedes Ereignis und jeder Export hat einen Doc-Kommentar; in Rust wird daraus die TypeScript-Deklaration, die TSX sieht;
- Callbacks beschreiben angeforderte Änderungen und enthalten Pointer-Details nur, wenn sie aussagekräftig sind;
- explizite Parts, Slots und Render-Funktionen sind dem Inspizieren beliebiger Nachfahren vorzuziehen;
- das Hinzufügen wiederverwendbaren Verhaltens darf keine visuelle Entscheidung auf Produktebene erzwingen.

Apps werden als signierte Pakete an Host-Apps ausgeliefert und werden womöglich nie wieder gebaut: Jedes spätere Release von NSH führt sie unverändert aus. Wende dieselbe Disziplin auf das an, was eine App oder eine Komponentenbibliothek anderen zur Verfügung stellt (die Props und Ereignisse ihrer Komponenten, die Exporte ihres Crates, die Funktionen, die die nativen Komponenten und Module einer Host-App erhalten):

- Eingaben erhalten nur optionale Member; Typen werden nur weiter gefasst; Standardwerte und Verhalten bleiben bestehen (neues Verhalten ist Opt-in);
- eine Funktion, deren Parameter wachsen können, nimmt ihre Optionen als ein Objekt entgegen (`scrollTo({ x, y, animated })`), niemals als weiteren Positionsparameter; Parameter, bei denen das nie der Fall sein wird, etwa Anfang und Ende eines Bereichs, bleiben positional;
- ein Modus ist eine String-Union, die neue Werte aufnehmen kann, und kein Boolean, der später einen dritten Zustand braucht;
- ein Wert hat genau einen Typ: `version: string`, niemals `string | number`;
- eine Funktion gibt ein Objekt zurück, das ein Feld hinzugewinnen kann, und kein Tupel und keinen nackten Wert;
- eine Funktion, die ein Promise zurückgibt, meldet jeden Fehler durch Ablehnen des Promise, und ein Fehler, den der Aufrufer behandeln kann, trägt einen `code`, so wie die von NSH selbst: Aufrufer verzweigen anhand von Codes, während Meldungen für Menschen gedacht sind und sich ändern können;
- bei einer Umbenennung bleibt der alte Name als `@deprecated`-Alias derselben Implementierung erhalten.

In Rust sind private Felder der Standard für Verhaltenszustand, der sich weiterentwickeln muss, ohne Aufrufer zu brechen. Öffentliche Felder sind für bewusst datensatzartige Konfiguration und serialisierte Daten angemessen. Jede öffentliche Struct mit öffentlichen Feldern muss `#[non_exhaustive]` tragen und `Default` implementieren, damit Aufrufer Werte ohne vollständige Struct-Literale erzeugen können und ein Feld hinzugefügt werden kann, ohne sie zu brechen.

Halte öffentliche Importpfade stabil, während du Interna umorganisierst: Der `#[native_module]`-Specifier eines Crates und seine Exporte sowie die Exporte eines TSX-Moduls sind das, was anderer Code importiert. Bevorzuge die Terminologie der Plattform-Controls und die etablierte Namensgebung von NSH gegenüber dem Vokabular von Web-Frameworks.
<a id="platform-and-capability-boundaries"></a>

## Grenzen von Plattformen und Fähigkeiten

Gehe nicht davon aus, dass jede Plattform dieselben Möglichkeiten unterstützt. Titelleisten und Fenstersteuerung, Barrierefreiheit, Zwischenablage, Haptik, Scroll-Physik, Schriften und Timing können sich unterscheiden. Ein Bundle läuft überall ([Plattformspezifischer Code](./platform-specific.md)); platziere plattformspezifischen Code dort, wo NSH ihm einen Platz gibt, und definiere das Fallback-Verhalten:

- Was ein Element auf jeder Plattform bedeutet, ist eine Prop auf oberster Ebene; ein plattformeigenes Systemfeature gehört in `ios={{…}}`, `android={{…}}`, `desktop={{…}}` oder `web={{…}}` (in Rust eine Builder-Methode), und zwar in jeder Plattform, die es hat; angewendet wird nur das Objekt der aktuellen Plattform;
- APIs der mobilen Plattformen kommen aus `nsh/mobile`, die der Desktops aus `nsh/desktop`;
- Styles pro Plattform sind die Klassen `ios:`, `android:` und `web:`.

Ein Plattformzweig muss den semantischen Vertrag einhalten, auch wenn die Darstellung abweicht. Ein Dialog ist zum Beispiel unter iOS ein Sheet und auf den Desktops eine Ebene über dem Fenster, die App braucht aber trotzdem einen kohärenten Open-Zustand. Teste das gemeinsame Verhalten headless und den plattformspezifischen Teil mit `nsh test --target`. Versieh jede Verzweigung über einen von NSH gemeldeten Wert (`platform.os`, einen Zustand, einen Grund) mit `default`: Spätere Releases fügen Plattformen und Fälle hinzu, und eine heute ausgelieferte App läuft auch auf ihnen ([Kompatibilität](./compatibility.md)).

Eine App deklariert in `nsh.json` `"capabilities"`, worauf sie außerhalb ihrer VM zugreift: die Hosts, von denen sie lädt, die Seiten, die eine Web View anzeigt, die Zwischenablage, die Statusleiste ([Sandbox und Capabilities](./sandbox-and-capabilities.md)). Eine App, die in andere Apps ausgeliefert wird, listet genau auf, was sie verwendet, und behandelt eine abgelehnte Anfrage wie eine fehlgeschlagene: Eine Host-App darf weniger gewähren, als die App deklariert. Ein abgelehnter Aufruf schlägt mit `code` `"ERR_ACCESS_DENIED"` fehl, wobei `permission` die Capability nennt und `resource` angibt, was angefragt wurde.

<a id="file-and-naming-conventions"></a>

## Datei- und Namenskonventionen

- Benenne Seiten und Komponenten nach Produktkonzepten: `ProjectList`, `ProjectEditor`, `SettingsPage`.
- Benenne Event-Handler nach der Absicht: `confirmDelete`, `openProject`, `onQueryChange`.
- Gib jedem Modul eine Hauptverantwortung; teile eine Datei auf, wenn sich Zustandsbesitz oder Lebenszyklus nicht mehr verstehen lassen, ohne unverwandtes Verhalten zu lesen.
- Halte Modul, Props, Events und fokussierte Tests einer Komponente zusammen, wenn sie sich gemeinsam ändern.
- Dokumentiere Invarianten und überraschende Lebenszyklus-Einschränkungen; erzähle offensichtliche Builder-Aufrufe nicht nach.
- Verwende `rustfmt` und erfülle Clippy in Rust sowie `nsh check` in TSX. Vermeide breite `allow`-Attribute, die unverwandte Warnungen verdecken.

<a id="vocabulary-is-part-of-the-api"></a>

### Vokabular ist Teil der API

Verwende für dasselbe Konzept in allen Komponenten dasselbe Wort. Suche den Begriff, bevor du eine Prop oder ein Event benennst, zuerst in der eigenen API von NSH, dann in `gpui-base` von GPUI Kit, in GPUI und `gpui-component`, danach in den Controls der Plattformen. Was ein Primitive anzeigt und die globalen APIs übernehmen ihre Namen aus HTML, DOM und CSS (`src`, `html`, `placeholder`). Rust-Namen sind `snake_case` und werden in TSX zu `camelCase` (`on_open_change` wird zu `onOpenChange`); ein Wort bleibt ein Wort (`readonly`, `multiline`).

| Konzept | Namensmuster | Beispiel |
| --- | --- | --- |
| Eine Komponente | Ein Substantiv, `PascalCase` | `Button`, `Dialog`, `QuantityStepper` |
| Ihre Props und Events (Rust) | `<Component>Props`, `<Component>Event` | `ButtonProps`, `ButtonEvent::Press` → `onPress` |
| Das State-Objekt eines Verhaltens | `<Control>State`, erzeugt von `create<Control>` | `NavStackState`, `createNavStack` |
| Warum sich ein Wert geändert hat | `<Control>ChangeReason`, eine String-Union | `DialogChangeReason`: `"cancel"`, `"backdropPress"` |
| Ein Zustand | Ein Adjektiv, positiv, ohne Präfix `is` | `open`, `hidden`, `disabled`, `selected`, `checked`, `readonly` |
| Was der Nutzer tun darf | Das Adjektiv | `scrollable`, `zoomable`, `selectable`, `resizable` |
| Ein Feature ohne Adjektiv | `<feature>Enabled` | `pagingEnabled` |
| Ob ein Teil angezeigt wird | Ein Boolean, benannt nach dem Teil, Standardwert `true` | `scrollbar`, `caret` (`scrollbar={false}`) |
| Ob ein Slot angezeigt wird | `<slot>Visible`, Standardwert `true` | `headerVisible` (`header` ist der Slot einer Seite) |
| Die Styles eines Teils | `<part>Class`, `<part>Style` | `backdropClass`, `contentStyle` |
| Die Styles eines Zustands | `<state>Style`, `<state>:`-Klassen | `activeStyle`, `disabled:` |
| Ein Slot | Was er ist | `header`, `footer`, `trigger`, `content`, `empty` |
| Inhalt der App | `render<Part>` | `renderCodeBlock` |
| Ein Dismissal-Flag | `closeOn<Trigger>`, Standardwert `true` | `closeOnEscape`, `closeOnBackdropPress` |
| Die Änderung eines Werts | `on<Value>Change({ <value>, ... })`, ein Objekt | `onChange({ value })`, `onOpenChange({ open, reason })` |
| Jedes andere Event | `on<Event>`, Präsens, ein Objekt | `onPress()`, `onSubmit({ text })` |
| Eine Phase | `<act>Start`, `<act>End` | `onPanStart`, `onLoadStart` |
| Die Maus über einer View | `Enter` / `Move` / `Leave`, wie im DOM | `onMouseEnter`, `onMouseMove`, `onMouseLeave` |
| Mit dem Lauschen beginnen | `on(event, listener)`, gibt `() => void` zurück | `host.on(name, l)`, `BackHandler.on("press", l)` |
| Ein Wert der Umgebung | Ein Accessor, daneben `set<Value>` | `colorScheme()`, `setColorScheme` |
| Ein schreibgeschützter Boolean | `is<Adjective>`, `has<Noun>` | `isAvailable` |

Props lauten nie `is<Adjective>`: Diese Form ist für alles, was nur einen Boolean liest (eine Konstante, ein Feld eines Payloads). Ein Teil, das angezeigt wird, ist nach dem Teil benannt, nie `<part>Shown`, `<part>Hidden` oder `shows<Part>`.

Ein Rust-Builder nimmt `Self` entgegen und gibt es zurück, und er ist nach der Prop benannt, die er setzt, ohne `set_` (`.disabled(..)`, `.checked(..)`, `.on_change(..)`); Mutation an Ort und Stelle ist `set_<field>` (`setRoutes`, `setColorScheme`). Ein Boolean-Reader ist entweder `has<Noun>`, wenn der Wert etwas enthält, oder `is<Adjective>`, wenn er einen Zustand oder eine Berechtigung beschreibt. Greife zum Adjektiv, wann immer die Aktion eines hat: `isClosable` statt `canClose`, `isZoomable` statt `canZoom`. Hat die Aktion eine Verbalphrase ohne Adjektivform, benenne stattdessen das, was sie braucht: `hasDefinition`, nicht `canGoToDefinition`. Füge keine neuen `can`-Reader hinzu.

<a id="let-the-enclosing-name-carry-the-context"></a>

### Der umgebende Name trägt den Kontext

Ein Name wird innerhalb von etwas gelesen: eine Prop innerhalb ihrer Komponente, ein Feld innerhalb seines Typs. Keiner von beiden wiederholt, was ihn umgibt (`contentStyle`, nicht `contentContainerStyle`; `Dialog` mit `backdropClass`, nicht `dialogBackdropClass`). Halte die Felder eines Typs auf derselben Abkürzungsebene.

<a id="use-precise-domain-words"></a>

### Präzise Fachbegriffe verwenden

- **selected** ist Zugehörigkeit oder das aktuelle Element; **checked** und **pressed** sind der Wert einer Checkbox oder eines Toggles; **focused** ist das Ziel der Tastatur; **hovered** ist die Anwesenheit des Zeigers. Verwende sie nie austauschbar.
- **open / close** ist der Zustand eines Overlays; **show / hide** eine vorübergehende Anfrage; **expand / collapse** betrifft die Struktur.
- **disabled** blockiert Interaktion; **readonly** erlaubt Auswählen und Navigieren, aber kein Bearbeiten; **loading** verhindert doppelte Arbeit, während eine Operation läuft.
- **press** ist die Aktivierung durch beliebige Eingabe, und die Events von NSH heißen press (`onPress`); **click** gehört zur Maus.
- **index** ist eine Position; **id** ist Identität. Persistiere oder indiziere umsortierbare Daten nicht über den Index.
- **value** sind kontrollierte Domänendaten; **state** ist beibehaltenes Verhalten.
- **src** ist die Ressource, die ein Element anzeigt (ein Bild, ein Video, eine Seite); jede andere Adresse ist eine **url**.
- **role** sagt, was eine Auswahl bedeutet (`"cancel"`, `"destructive"`); das Aussehen bestimmt die App.

Vermeide vage Namen wie `data`, `item2`, `handleAction`, `updateUi`, `process`, `manager` oder `config`, wenn es einen engeren Fachbegriff gibt.

<a id="type-and-module-style"></a>

### Stil für Typen und Module

- Rust-Typen sind `UpperCamelCase`; Module, Funktionen, Methoden, Felder und lokale Variablen `snake_case`; Konstanten `SCREAMING_SNAKE_CASE`. Benenne Context-Bindings `cx`.
- TSX-Komponenten und ihre Tags sind `PascalCase`; Props, Funktionen und lokale Variablen `camelCase`. Primitives kommen aus `nsh`, Basiskomponenten aus `nsh/base`.
- Ein nach einer Komponente benanntes Modul besitzt ihre öffentliche Schnittstelle; teile Zustand, Teile und Tests in Dateien auf, ohne zu ändern, was andere importieren.
- Verwende Modulnamen im Singular für ein Komponentenkonzept und etablierte Namen für Familien (`menu` für `Menu`, `MenuItem` und `Submenu`).
- Hänge `Id` als Suffix an Bezeichner und verwende für Collections sinnvolle Plurale. Wechsle in einem Subsystem nicht zwischen `idx`, `index` und `ix`.
- Benenne Prädikate möglichst positiv. Ein positiver Zustand lässt sich leichter komponieren als mehrere Negationen, behalte aber etablierte Begriffe wie `disabled` bei, wo sie zur Semantik des Controls passen.

<a id="callback-and-event-wording"></a>

### Formulierung von Callbacks und Events

- Jedes Event übergibt ein Objekt, auch bei nur einem Feld und auch bei der Änderung eines Werts; seine Felder heißen wie die Props, über die sie berichten: `onChange({ value })`, `onOpenChange({ open, reason })`, `onLinkPress({ url })`. Ein späteres Feld ist dann eine Ergänzung. Ein Datentyp der API ist ein Feld, nie der Payload selbst (`onImagePress({ image })`); ein Event ohne etwas zu berichten übergibt nichts.
- Benenne die Handlung, nicht Vergangenheitsform oder Anfrage: `onPress`, `onClose`, `onCancel`, `onBackPress`.
- Benenne die Absicht statt der Geometrie, wenn die Handlung einen Namen hat: `onLoadMore`, nicht „das Ende wurde erreicht“.
- Lifecycle-Paare sind `onOpen` / `onClose`; Phasen sind `Start` / `End`, nie `Begin`; die Maus über einer View ist `onMouseEnter` / `onMouseMove` / `onMouseLeave` (die Namen des DOM), eine darüber gezogene Datei `Enter` / `Leave`.
- Dokumentiere, ob ein Callback vor oder nach der Zustandsänderung der Komponente läuft und ob er die Komponente erneut betreten (re-enter) darf.

<a id="documentation-and-copy-style"></a>

### Stil von Dokumentation und Texten

Öffentliche Dokumentation sollte damit beginnen, was eine Komponente tut und wem ihr Zustand gehört. Beispiele müssen aktuelle APIs verwenden und stabile Ids zeigen. Dokumentiere Standardwerte, Plattformunterschiede, Fokusverhalten, Reihenfolge von Callbacks und welche Props der Main Thread nativ liest.

Befolge für Labels, Befehle, Bestätigungsdialoge, Groß- und Kleinschreibung und Auslassungspunkte die Regeln zur Oberflächensprache der Design Guides. Verwende für jedes Domänenobjekt, jeden Befehl und jeden Zustand genau einen kanonischen Begriff.

Übersetzungsschlüssel beschreiben eine stabile Absicht (`dialog.deleteProject.title`), nicht einen Satz der Ausgangssprache oder eine Position auf dem Bildschirm. Setze nie einen Satz aus übersetzten Fragmenten zusammen und verwende einen Schlüssel nicht für Bedeutungen, die zufällig denselben englischen Text haben.

Lokalisiere die Absicht, nicht die Syntax. Gib jeder Locale Kontrolle über Wortstellung, Pluralbildung, Zeichensetzung und die benötigte Menge an Kontext. Tests sollten fehlende Schlüssel und uneinheitliche feste Begriffe finden; ob eine Wiederholung durch den Kontext gerechtfertigt ist, entscheidet weiterhin die menschliche Prüfung. Prüfe jeden String innerhalb seiner Komponente mit realistischem Inhalt, Textverlängerung und großer Textgröße.

<a id="testing-strategy"></a>

## Teststrategie

Teste auf der niedrigsten Ebene, die das Verhalten beweisen kann ([Testing](./testing-and-trace.md)):

1. reine Tests für Zustandsübergänge, Formatierung, Parsing und Sortierung (`cargo test` der Funktionen eines Crates, eine Testdatei für die Funktionen des Stores);
2. Headless-App-Tests für Komponenten, Events und Lebensdauern: die echte Engine, der Renderer, Layout und Listen, mit Display-Frames bei 60 Hz, in `nsh test` (`nsh/test`) oder `cargo test` (`nsh_testing::Headless`);
3. Interaktionstests für Fokus, Tastatur, Zeiger, Layout und gerenderten Zustand, mit den Schritten, die ein Nutzer ausführt (`press`, `type`, `scroll`, `drag`, `keyboard.press`), headless und auf einer echten Plattform (`nsh test --target macos`, `ios`, `android`, `web`, ...);
4. Smoke-Tests von Beispielen oder Apps für vollständige Workflows und `nsh test --trace` für die Kosten einer Interaktion.

```rust tabs
#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open("./App.tsx");
  await app.press("role:button[Tap]");
  expect(app.texts()).toContain("Count: 1");
});
```

Decke bei einer interaktiven Komponente den semantischen Vertrag ab statt ihrer Implementierungsdetails: Aktivierung per Press und Tastatur, kontrollierte Wertänderungen, Disabled-Verhalten, Fokuswechsel, Anzahl und Reihenfolge der Events, stabile Identität sowie wichtige leere Zustände und Fehlerzustände. Stubbe das Netzwerk (`network`-Routen) und steuere die Zeit (eine manuelle Uhr), statt auf echte zu warten. Füge einen Regressionstest hinzu, bevor du einen Fehler behebst, sobald sich der Fehler deterministisch reproduzieren lässt.

Finde Views so, wie ein Nutzer es tut: über Rolle und Name, Label oder Text (`role:button[Save]`, `label:Close`) und über eine stabile `testID`, wo sie sonst nichts benennt. Selektoren werden bei jedem Schritt neu ausgewertet, sodass ein Schritt nie auf einem veralteten Snapshot agiert. Verwende Screenshots (`app.screenshot`, auf einer echten Plattform) für visuelle Fakten, die Selektoren nicht ausdrücken können; verwende Koordinaten nur als Fallback. Berichte automatisierte und manuelle Nachweise getrennt.

<a id="performance-rules"></a>

## Performance-Regeln

- Schreibe keinen Zustand bedingungslos aus einem Binding oder einem Effect, der ihn liest.
- Vermeide es, Signals, Effects, Key Bindings und teure Datenstrukturen innerhalb von Bindings oder Row-Funktionen zu erzeugen.
- Lies Signals in Bindings, damit eine kohärente Änderung den kleinstmöglichen Teil des Baums aktualisiert.
- Verwende `List` für lange Collections und rendere nur den sichtbaren Bereich.
- Vermeide es, große Strings oder Collections allein deshalb zu klonen, um einen Closure zufriedenzustellen; erfasse stattdessen `Copy`-Handles oder geteilte Daten (`SharedString`, `Rc`).
- Halte TSX-Handler und berechnete Werte leichtgewichtig; verlagere schwere Arbeit weg vom Interaktionspfad oder nach Rust.
- Miss mit `nsh test --trace`, bevor du Caches hinzufügst. Ein Cache braucht einen klaren Besitzer der Invalidierung.
- Halte Animationsarbeit begrenzt: animierte Werte im UI Thread statt Signals, die in jedem Frame geschrieben werden, `scrollValue` statt eines Scroll-Listeners ([Animation](./animation.md)), und berücksichtige reduzierte Bewegung (`reduceMotion()`).
<a id="common-failure-modes"></a>

## Häufige Fehlerbilder

Vermeiden Sie diese Muster:

- ein Signal, das den unabhängigen Zustand der App enthält;
- Geschäftslogik und Netzwerkanfragen, die in einem langen Component-Body eingebettet sind;
- zufällige oder indexbasierte Keys für umsortierbare Inhalte;
- Zustand pro Zeile in Signals, die innerhalb einer `List`-Zeile erzeugt werden;
- eine Prop oder ein Signal im Component-Body zu lesen und zu erwarten, dass es sich aktualisiert;
- feste Farben und Radien, die benutzerdefinierte Themes und den Dark Mode brechen;
- eigene anklickbare Views, wo eine semantische Komponente bereits Fokus, Tastatur, Disabled-Zustand und Barrierefreiheit bereitstellt;
- doppelten lokalen Zustand, der von einem kontrollierten Wert abweicht;
- Effects, die ein Signal in ein anderes kopieren, und Schreibvorgänge, die über ein Binding eine Schleife bilden;
- eine Entscheidung, die das System sofort benötigt, aber einem Callback überlassen wird, statt einer vorab gesetzten Prop;
- verschachtelte Scroll-Views ohne explizite Zuständigkeit;
- eine neue Komponentenvariante für einen einmaligen Screen;
- Bestätigungsdialoge für umkehrbare Aktionen mit geringem Risiko;
- Tests, die interne Funktionen aufrufen, aber nie drücken, tippen oder scrollen.

<a id="rules-for-coding-agents"></a>

## Regeln für Coding-Agents

Vor dem Bearbeiten muss ein Agent die nächstgelegene Implementierung, deren Tests, die öffentlichen Exporte des Moduls und die relevante Referenzseite lesen. Er muss den aktuellen Quellcode und `.nsh/types` nach Signaturen durchsuchen, anstatt ein Beispiel aus React, React Native, CSS oder GPUI per Analogie zu übertragen: NSH-Komponenten laufen nur einmal, und Bindings folgen den Signals, die sie lesen.

Bei jeder Änderung sollte der Agent Folgendes benennen können:

1. den Verantwortlichen für das Verhalten und den Verantwortlichen für die Darstellung;
2. die beibehaltene Identität und den Lebenszyklus des Zustands;
3. den Vertrag für Drücken, Tastatur, Fokus und Barrierefreiheit;
4. den Verantwortlichen für Layout und Scrollen;
5. die Theme-Tokens und bewusste Ausnahmen;
6. den Test, der fehlschlagen würde, wenn das Verhalten regrediert.

Generierter Code muss von einer Person geprüft und getestet werden. „Kompiliert“ ist kein Qualitätsmaßstab für die UI, und ein umfassendes Refactoring, das generierten Code lediglich aufgeräumt aussehen lässt, ist kein Ersatz dafür, zur Architektur der App zu passen.

<a id="implementation-checklist"></a>

## Checkliste für die Implementierung

Bevor Sie eine Änderung zur Prüfung einreichen, vergewissern Sie sich, dass:

- die Zuständigkeit für Zustand und Seiteneffekte explizit ist;
- bewusst zwischen einer einfachen Funktion und einer Komponente gewählt wurde und Props und Signals dort gelesen werden, wo sie verwendet werden;
- wiederholte Elemente stabile, domänenbasierte Keys und Test-IDs haben;
- Theme-Tokens und die Tailwind-Skala isolierte visuelle Literale ersetzen;
- Drücken, Tastaturkürzel, Fokus, Disabled-Zustand und Overlays zusammenarbeiten;
- Entscheidungen, die das System sofort benötigt, Props sind, die vorab gesetzt werden;
- Lade-, Leer-, Fehler- und Abbruchpfade abgebildet sind;
- lange Datensätze `List` verwenden, wobei der Zustand pro Element in den Daten liegt;
- Erweiterungen der öffentlichen API nur erweitern und die Abhängigkeitsrichtung sowie die Kapselung bewahren;
- Tests das Verhalten auf der passenden Ebene belegen, headless und auf den von der Änderung betroffenen Plattformen;
- Formatierung, Clippy, `nsh check`, gezielte Tests und relevante Beispiele erfolgreich durchlaufen.

Siehe [Getting started](./getting-started.md) für die App-Einrichtung sowie die Referenzen zu [Elements](../elements/index.md) und [API](../modules/index.md) für aktuelle API-Details.
