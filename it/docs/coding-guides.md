---
title: "Guide alla programmazione"
description: "Convenzioni di architettura e di codifica per app e librerie di componenti Native Shell manutenibili, in Rust e TSX."
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---

# Guide al codice

Questa guida descrive l'architettura applicativa e i pattern di codice che si sono dimostrati duraturi nelle app Native Shell. È scritta sia per ingegneri sia per coding agent: sviluppatori di app NSH (moduli TSX, componenti Rust, app native che incorporano NSH) e autori di librerie di componenti costruite su `nsh/base`. Leggi prima le Guide di design: la struttura del codice dovrebbe preservare l'intento del prodotto, non sostituirlo.

Questa è una guida normativa. **Deve** indica vincoli di ciclo di vita, di correttezza o di ecosistema; **dovrebbe** indica l'architettura predefinita e richiede un motivo concreto per discostarsene. Il codice sorgente attuale, le pagine di riferimento e le dichiarazioni in `.nsh/types` restano autorevoli per le firme esatte.

<a id="make-the-common-path-inexpensive"></a>

## Rendere economico il percorso comune

**Principio di design: scegli tipi del framework e proprietà (ownership) in modo che l'uso ordinario dei componenti sia economico per impostazione predefinita.** Gli sviluppatori dovrebbero poter costruire e riutilizzare la UI senza aggiungere una cache a ogni punto di chiamata. Ne sono esempi i componenti che vengono eseguiti una sola volta e i [signal](./reactivity.md) letti là dove vengono usati: un componente costruisce una sola volta la sua parte di albero, e in seguito vengono rieseguiti solo i binding che leggono un signal modificato, così il percorso comune evita lavoro ripetuto. Il grafo reattivo, il renderer, il layout e le liste sono nativi, e un turno del codice dell'app diventa un unico batch di operazioni native. I piccoli costi si moltiplicano comunque tra elementi e aggiornamenti, soprattutto in TSX, il cui codice viene eseguito in un interprete; misura i percorsi critici eccezionali prima di aggiungere cache ([Performance](./performance.md)). Nessuna delle due scelte promette costo zero. Le [regole di proprietà dello stato](#state-ownership) e le sezioni successive sul rendering ne spiegano i meccanismi.

<a id="architecture-at-a-glance"></a>

## L'architettura in sintesi

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

Le dipendenze puntano verso il basso. I livelli superiori possiedono il significato di dominio e l'orchestrazione; i livelli inferiori possiedono presentazione o comportamento riutilizzabili. Non fare dipendere un componente riutilizzabile da una pagina dell'app, né una libreria di componenti dal tema di una singola app ([Tre livelli](./architecture.md#three-layers)).

Usa questi confini:

- **app shell:** l'entry (`App.tsx`, oppure `nsh.json` `"root"`) compone la root e gli stack di navigazione tenendo fuori la logica delle pagine;
- **pagina:** un solo `NavPage` con il suo contenuto, i suoi dialoghi e il lavoro che avvia;
- **componente dell'app:** un pattern ripetuto e consapevole del dominio;
- **libreria di componenti:** UI con stile e di uso generale, propria dell'app o della community, costruita su `nsh/base`;
- **`nsh/base`:** comportamento riutilizzabile senza presentazione di prodotto: navigazione, dialoghi, popover, menu, sheet, un target di pressione;
- **`nsh`:** le primitive, gli stili, il layout, la reattività e l'ambiente.

<a id="lay-out-an-apps-files"></a>

### Organizzare i file di un'app

I file di un'app seguono le convenzioni di NSH, quindi non c'è nulla da configurare: `App.tsx` è l'entry e `nsh.json` le sta accanto, ed entrambi vengono trovati per convenzione.

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

- `pages/` contiene un file per ogni `NavPage`. Una pagina si estende in più file solo quando serve.
- `components/` contiene i componenti riutilizzabili dell'app, quelli usati da più pagine.
- `store.ts` contiene lo stato dell'app: i suoi signal e le funzioni che li modificano. Le pagine leggono i signal e chiamano le funzioni.
- I test sono file `*.test.tsx` accanto a ciò che testano (`App.test.tsx`, `pages/Inbox.test.tsx`).
- `Cargo.toml` e `src/lib.rs` sono il crate dell'app, con i suoi componenti Rust (`nsh.json` `"rust": "."`); il suo `#[native_module]` in `src/lib.rs` indica cosa importa TSX. Un'app scritta solo in Rust è lo stesso progetto Cargo, con il suo componente root in `src/lib.rs` ([Struttura del progetto](./project-structure.md)).

L'app shell compone le pagine ma contiene poca logica di pagina. Le pagine leggono i signal dello store e ne chiamano le funzioni; non scrivono mai lo stato di un'altra pagina. Mantieni privati i signal dello store ed esporta ciò che li legge e li modifica, in modo che lo stato mutabile resti dietro le sue funzioni pubbliche:

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

Una pagina può contenere il workspace e passare il suo id alla ricerca; la ricerca non ha bisogno dell'intera collezione del workspace né dei suoi signal privati. Una semplice forma di dipendenze aciclica è:

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

Le pagine possono dipendere dallo store e dai componenti, ma non dalla shell né dalle parti private di un'altra pagina. Se una pagina deve cambiare ciò che ne mostra un'altra, lo faccia tramite lo store. Questi confini permettono a ingegneri o agenti AI diversi di lavorare su pagine separate in parallelo, con meno conflitti tra file e meno accoppiamento dello stato condiviso; lo store richiede comunque coordinamento.

<a id="bootstrap-and-root-ownership"></a>

## Bootstrap e proprietà della root

Monta l'app una sola volta e dai alla root l'intera superficie: un entry TSX chiama `mount(App)`, un'app Rust indica il proprio componente root in `nsh.json` (`"root": "App"`). La root riempie la superficie con `flex: 1` e uno sfondo preso dal tema:

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

La root coordina ciò che appartiene all'intera superficie: lo stack di navigazione, i dialoghi, i popover, i menu, gli sheet e i tooltip mostrati sopra tutto il resto, e la safe area. Non montare una seconda root per ogni pagina all'interno di una superficie. Una superficie è un motore: ogni `NshAppView`, `NshView` o `AppView` che un'app nativa incorpora esegue la propria VM, il proprio stato di modulo e il proprio grafo reattivo, quindi più superfici in una stessa app host non condividono mai stato per sbaglio.

<a id="understand-what-runs-once-and-what-runs-again"></a>

## Capire cosa viene eseguito una volta e cosa di nuovo

NSH è stato retained con costruzione dichiarativa, sul modello di Solid ([Reattività](./reactivity.md)). Un signal sopravvive agli aggiornamenti; il corpo di un componente descrive una sola volta la sua parte di albero, quando viene creato. Mantieni esplicita questa distinzione:

| Cosa scrivi | Viene eseguito | Viene rieseguito quando |
| --- | --- | --- |
| Il corpo di un componente | Una volta, alla creazione | Mai |
| Un binding: una closure (Rust) o un'espressione che chiama o legge una proprietà (TSX) dove va un valore | Una volta | Cambia un signal che ha letto; si aggiorna solo quella prop o quel figlio |
| `computed(fn)` | Alla creazione | Cambia un signal che ha letto |
| `effect(fn)` | Dopo che gli elementi del passaggio esistono | Cambia un signal che ha letto |
| Una riga di `each` / `<Each>` | Quando la sua chiave compare per la prima volta | Mai; cambiano i suoi signal di item e di indice |
| Una cella di `virtual_list` / `<List>` | Una volta per cella | Mai; alla cella vengono date altre righe |

- il componente in esecuzione è l'**owner**: effetti, valori calcolati, task, timer, associazioni di tasti e cleanup creati mentre viene eseguito gli appartengono e vengono eliminati con esso;
- il **contesto** (`provide_context` / `use_context`, `context()` e `<Ctx.Provider>`) fornisce un valore a un sottoalbero senza implicare che gli elementi che lo leggono ne siano proprietari;
- il **`Scope`** di un componente Rust (`cx`) emette i propri eventi e legge gli inset che gli vengono dati;
- i **ref** (`element_ref()`, `ref`) nominano un elemento host per le chiamate imperative (`focus()`, `scroll_to()`, `measure()`);
- layout e misurazione sono fasi successive e native; usa `onLayout` e `measure()` solo quando la geometria risolta è davvero necessaria.

Non leggere mai un contesto in un gestore di eventi o in un timer, dove non c'è alcun componente da cui cercarlo: leggilo nel corpo e conserva ciò che ha restituito. Conserva handle tipizzati (signal, resource, ref, id di dominio), che in Rust sono `Copy` e smettono di fare qualsiasi cosa una volta che il loro owner non esiste più.

<a id="choose-the-right-unit"></a>

## Scegliere l'unità giusta

<a id="use-a-plain-function-for-value-like-elements"></a>

### Usare una funzione semplice per elementi simili a valori

**Usa per impostazione predefinita una funzione semplice per parti di UI leggere e riutilizzabili.** Il chiamante fornisce le prop e i gestori correnti, la funzione restituisce elementi, e di essa non rimane nulla se non i binding che ha creato. I suoi argomenti sono le sue prop; l'etichetta mostrata, il valore e le callback provengono dallo stato corrente del chiamante. Viene comunque eseguita una sola volta, come qualsiasi componente: ciò che cambia in seguito sono i suoi binding.

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

### Usare un componente per il comportamento retained

Usa un `#[component]` (o un componente TSX che crea signal) quando una parte di UI possiede stato persistente o un ciclo di vita indipendente: signal, effetti, lavoro asincrono, timer, associazioni di tasti. Crea quello stato nel corpo del componente, una sola volta, mai dentro un binding.

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

Un `#[component]` ha prop tipizzate (`#[derive(Props)]`) ed eventi (`#[derive(Event)]`); TSX lo importa con dichiarazioni generate da essi. Lo stato retained che TSX usa con `new` (un ledger, un parser, una sessione) è un `#[class]`, e le funzioni sono un `#[module]` ([Sviluppo con Rust](./rust.md#extending-a-rust-app-with-tsx)). Scrivi in Rust, che è codice nativo dall'inizio alla fine, le parti che l'app usa di più, le librerie di componenti e la logica impegnativa; riserva TSX a ciò che cambia spesso o viene consegnato a run time.

Non trasformare ogni frammento visivo in un componente. I confini dei componenti hanno costi di ciclo di vita e di coordinamento; usali dove l'identità retained conta.

<a id="elements-views-and-behavior-systems-are-different"></a>

### Elementi, view e sistemi di comportamento sono cose diverse

Non forzare ogni componente in un unico modello. L'ecosistema comprende:

- elementi semantici come `Button`, `Switch` e `MenuItem`;
- root di comportamento composto come `Dialog`, `Popover`, `Menu`, `ContextMenu`, `Sheet` e `NavStack`;
- sistemi con stato come `Input`, `List`, `TextView` e lo stato di uno stack di navigazione;
- infrastruttura come gli overlay e il loro posizionamento, la virtualizzazione, lo scrolling, le safe area, la tastiera e l'animazione.

Un elemento può essere internamente complesso e restare comunque simile a un valore per il suo chiamante. Un sistema con stato può esporre funzioni di render, così le app possiedono la presentazione senza reimplementare il comportamento. Scegli il punto di separazione pubblico in base al comportamento, non al numero di view presenti nel suo output.

<a id="state-ownership"></a>

## Proprietà dello stato

<a id="own-persistent-ui-text-with-103"></a>

### Possedere il testo persistente della UI con `SharedString`

**In Rust, si deve preferire `SharedString` per il testo della UI conservato tra aggiornamenti o closure di callback**, incluse etichette, titoli e placeholder dei componenti: le prop lo accettano (`Prop<SharedString>`), e clonarlo in un binding non copia il testo. Per un buffer di editing mutabile o per un testo assemblato con formattazione, usa `String` e converti quando il risultato è pronto; per un accesso temporaneo in sola lettura durante una singola chiamata, usa `&str`. In TSX le stringhe sono valori propri dell'app; mantieni il testo calcolato a partire dallo stato in un `computed` o in una closure invece di ricostruirlo in più punti.

Per il testo immutabile di una risposta che la UI conserverà, mantieni intatto il valore ricevuto e inserisci il testo di presentazione derivato o formattato in un valore di dominio separato invece di riscrivere la risposta.

Metti ogni stato nel proprietario più ristretto in grado di mantenerlo corretto:

- lo stato di dominio appartiene allo store (`store.ts`) o al crate dell'app;
- lo stato transitorio della view appartiene al componente che la renderizza, come signal;
- lo stato comportamentale riutilizzabile appartiene al componente progettato per esso (un `Menu` o `Popover` senza `open` mantiene il proprio);
- lo stato condiviso da un sottoalbero è un signal fornito tramite [contesto](./reactivity.md#context);
- ciò che sopravvive a un'esecuzione appartiene allo [storage](../modules/nsh.md#storage) o a un server.

Preferisci valori controllati per la selezione e gli interruttori ordinari: passa il valore corrente al componente, ricevi una richiesta di modifica, aggiorna l'owner e i binding seguono. Una callback segnala un'intenzione; non dovrebbe creare una seconda fonte di verità nascosta.

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

Non c'è nulla da notificare: scrivere un signal aggiorna esattamente i binding che lo leggono. Un componente Rust emette un evento semantico che il suo owner dovrebbe gestire con `cx.emit(..)`; un effetto segue un signal finché il suo owner è in vita. Scrivi più campi che formano un'unica invariante in un solo [`batch`](./reactivity.md#batch), in modo che effetti e valori calcolati li vedano tutti insieme.

Un componente controllato dell'app stessa segue lo stesso contratto. Un quantity stepper, un controllo di dominio scritto una sola volta in Rust e usato sia da Rust sia da TSX:

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

Lo stesso contratto in TSX, un componente in `components/`:

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

### Mantenere limitati i legami di proprietà e le sottoscrizioni

Un componente possiede ciò che crea, e tutto ciò che ha creato scompare insieme a lui: quando il suo ramo `<If>` si nasconde, la sua riga viene rimossa o la sua pagina viene estratta dallo stack. In Rust, task, timer e intervalli (`spawn`, `set_timeout`, `set_interval`) e associazioni di tasti (`on_key`) terminano insieme al proprietario sotto cui sono stati creati; in TSX, registra lo stop con [`cleanup`](./reactivity.md#cleanup) oppure restituiscilo dall'effect. Mettersi in ascolto è `on(event, listener)` (`host.on(name, listener)`, `BackHandler.on("press", listener)`), che restituisce una funzione che lo interrompe (`() => void`, da Rust un `Stop`), e ciò che viene registrato mentre un componente esegue il render scompare insieme al componente, come accade per le associazioni di `keymap.bind`.

Quando qualcosa continua a girare in modo inatteso, ispeziona per prima cosa gli effect e i valori calcolati creati fuori da un componente (in un gestore di eventi o in una callback di un timer non hanno proprietario e vivono per sempre), i listener registrati senza il relativo stop e il lavoro avviato da uno store che nessun componente possiede. Un caricamento `resource` scartato viene interrotto (`info.signal` in TSX); non mantiene in vita il proprio componente. Questi sono punti di partenza comuni, non un elenco esaustivo.

Non scrivere un signal solo perché un valore è stato letto o derivato. Evita scritture incondizionate da un binding o da un effect che legge lo stesso signal: si rieseguirebbe da solo finché NSH non lo ferma con un errore. Un valore calcolato a partire da altro stato è un `computed`, non un effect che scrive un secondo signal.

<a id="avoid-state-feedback-loops"></a>

### Evitare cicli di feedback dello stato

Input di testo, selezione, filtri e popup controllati hanno comunemente due percorsi: un proprietario esterno aggiorna il valore, e l'interazione dell'utente richiede un nuovo valore. Non rimandare un valore fornito dal proprietario attraverso la callback dell'utente durante la sincronizzazione. Leggi il valore corrente del proprietario senza tracciamento quando gestisci l'azione dell'utente (`props.value.get_untracked()` in Rust, come sopra; un gestore di eventi TSX non è già tracciato) e confrontalo con il successivo, così che ogni modifica logica venga notificata una sola volta. Rendi le callback sicure rispetto alla rientranza quando una callback può chiudere, sostituire o aggiornare in modo sincrono il componente che l'ha invocata.

<a id="stable-identity"></a>

## Identità stabile

Una chiave fa parte del comportamento. Dà a una riga, a una pagina o a un controllo ripetuto un'identità stabile, e decide quale di essi conserva il proprio stato, il proprio focus e le proprie misure quando i dati cambiano.

- Usa id di dominio stabili per righe, tab, pagine e controlli ripetuti: `each(projects, |p| p.id, ..)`,
  `<Each of={projects()} key={(p) => p.id}>`, il `keyExtractor` di una lista.
- Dai ai test id un namespace con l'oggetto che li possiede quando lo stesso controllo si ripete (`delete-${project.id}`).
- Non derivare mai l'identità da un'etichetta tradotta o da un indice di lista mutabile quando gli elementi possono essere inseriti o riordinati.
- Non generare una nuova chiave o un nuovo id casuale durante il rendering.

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

Una chiave cambiata significa un'identità di UI cambiata. Considera quel reset come deliberato.

La stessa regola vale per le rotte di navigazione, le chiavi di lista, le chiavi di storage e i test id. Una rotta che resta in `setRoutes` conserva la propria pagina e il proprio stato; se due comportamenti mantenuti indipendentemente condividono una chiave, possono sovrascrivere lo stato l'uno dell'altro; se un comportamento cambia chiave a ogni aggiornamento, non accumula mai stato.

<a id="rendering-and-composition"></a>

## Rendering e composizione

Mantieni dichiarativo il corpo di un componente: leggi lo stato corrente, deriva i valori di presentazione e componi gli elementi. Sposta le operazioni di dominio, il parsing e le mutazioni non banali in funzioni con nome dello store o del crate dell'app.

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

Estrai un helper quando dà un nome a una regione significativa e riduce la quantità di stato che un lettore deve tenere a mente contemporaneamente. Estrai un nuovo componente quando la regione ha un proprio contratto riutilizzabile o un ciclo di vita mantenuto, non semplicemente perché una catena di builder o un blocco JSX è lungo.

Usa in modo coerente i metodi di stile tipizzati e i builder dei componenti in Rust, e le classi in TSX. Preferisci `.when(..)` / `.when_some(..)` (Rust) e `classList` (TSX) per piccoli affinamenti condizionali; usa `when` / `<If>` quando i rami rappresentano interfacce sostanzialmente diverse, poiché un ternario in una closure ricostruisce il proprio ramo ogni volta che cambia qualcosa che legge.

Componi a partire dal componente semantico standard prima di costruire una superficie personalizzata. Non riprodurre un menu, un popover, uno sheet o un dialog a partire da view generiche solo per corrispondere a uno screenshot: `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Tooltip` e `Dialog` di `nsh/base` preservano posizionamento, trasferimento del focus, navigazione da tastiera, selezione, stato disabilitato, chiusura con Escape e con il comando indietro, e il contratto di accessibilità. Se il componente standard non può esprimere un pattern valido ricorrente, migliora la sua API esplicita invece di stilizzare discendenti arbitrari in ogni punto di chiamata.

Le funzioni di render fornite dal codice dell'app devono essere prive di effetti collaterali. La riga di una lista, il `renderCodeBlock` di un `TextView` o gli elementi di un menu possono essere eseguiti ogni volta che il loro proprietario ha bisogno di una cella, di una parte o di un'apertura. Non devono eseguire un'operazione di business, aggiungere dati o avviare una sottoscrizione illimitata.

<a id="behavior-and-presentation-boundary"></a>

## Confine tra comportamento e presentazione

La regola duratura di Base è:

> Base possiede il comportamento riutilizzabile e la struttura necessaria a implementarlo. Il livello di presentazione possiede il linguaggio visivo del prodotto.

"Senza stile" non significa "una sola view vuota". Posizionamento degli overlay, navigazione da tastiera, editing, virtualizzazione, navigazione indietro, chiusura e safe area richiedono struttura e stato interni. Spostare quel lavoro su ogni chiamante non creerebbe flessibilità; duplicherebbe un comportamento fragile.

Viceversa, Base non deve scegliere colori del brand, tipografia, densità, icone finali, varianti dei componenti, stringhe o composizione dell'applicazione. Esponi la presentazione tramite `class` / `style` sulla parte principale, `<part>Class` / `<part>Style` per ogni altra parte, stili di stato tipizzati (`active`, `hover`, `focus`, `selected`, `checked`, `disabled`), slot con nome (`trigger`, `header`, `footer`) e funzioni di render. Non ispezionare discendenti arbitrari per scoprire titoli, descrizioni o pulsanti di chiusura: rendi esplicite le parti semantiche e prendi ogni etichetta come prop o come figlio.

<a id="theme-and-styling"></a>

## Tema e stile

Leggi i valori semantici dal tema e applica il layout con i metodi di stile tipizzati in Rust e con le classi Tailwind in TSX ([Tailwind](./tailwind.md), [token del tema](./tailwind.md#theme-tokens)):

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

Regole:

- non codificare in modo fisso colori di prodotto, raggi degli angoli, spaziature o geometria dei controlli;
- il codice dell'app non deve introdurre valori esadecimali grezzi, `rgb` / `rgba` o `hsla`; leggi un colore semantico da `theme()` o da una classe token (`bg-primary`), oppure aggiungi il ruolo mancante al file del tema dell'app;
- il layout dell'app dovrebbe usare le scale di spaziatura e di tipografia (`p-2`, `gap-3`, `w-64`, `text-sm`; `.p_2()`, `.gap_3()`, `.w_64()`, `.text_sm()`) invece di valori arbitrari (`p-[13px]`, `px(13.0)`);
- le classi significano esattamente ciò che significano in Tailwind CSS v4, e i valori di stile ciò che dà loro il [riferimento degli stili](../modules/style-reference.md) (quelli del CSS, in forme native: i numeri sono punti); un avviso `unknown class` è un problema da correggere;
- usa token semantici per il significato, non per la posizione nella palette;
- mantieni la geometria indipendente dallo stato nella normale catena di builder o nella stringa di classi;
- usa `active:`, `hover:` e `focus:` (`.active(..)`, `.hover(..)`, `.focus(..)`) per gli stati di interazione a runtime; si applicano in modo nativo, senza round trip verso il codice dell'app;
- usa gli stili di stato semantici di un componente (`selected:`, `checked:`, `disabled:`) per l'aspetto di selezionato, premuto o disabilitato;
- mantieni la proprietà del popup in uno stato esplicito (`open` con `onOpenChange`) così che il suo trigger possa mostrare l'aspetto aperto o premuto fino alla chiusura;
- mantieni poche e significative le varianti dei componenti, invece di aggiungere una variante per ogni punto di chiamata;
- associa lo stile primario al vero commit predefinito dell'area decisionale e alla sua azione del tasto invio; non derivarlo dal numero di azioni, dalla frequenza o dalla posizione nella toolbar;
- mantieni semantiche e scarse le varianti di badge e alert. I metadati ordinari restano neutri; non associare ogni caso di enum o ogni sezione a un colore diverso solo perché esiste una variante.

La precedenza effettiva è: lo stile proprio dell'elemento, poi gli stili di stato, con gli stati successivi che prevalgono, con `disabled` sopra tutti. I livelli successivi sostituiscono solo i campi che impostano.

Preferisci i token semantici del tema per la nuova presentazione di proprietà dell'app. Ogni nome nel file del tema dell'app è un token, così come lo è una variabile di `@theme` di Tailwind (`"up": "#16a34a"` produce `text-up`, `bg-up/30`, `token("up")` in TSX e `theme().color("up")` in Rust), e il tema ha valori chiari e scuri, quindi un token segue l'aspetto senza alcuna classe `dark:`. Dai ai token nomi basati sui ruoli, non sui componenti, in modo che non diventino il punto di estensione per ogni widget.

Cambia il tema tramite il file del tema dell'app (`nsh.json` `"theme"`), oppure lascia che sia l'app che lo incorpora a fornirne uno proprio: le classi che nominano token e i binding Rust che leggono `theme()` vengono ristilizzati in modo nativo ogni volta che cambia, senza che venga eseguito JavaScript. Il codice che copia il valore di un token in un signal proprio smette di seguirlo.

Un anello di focus verso l'esterno ha bisogno di spazio fisico. Un antenato con `overflow: hidden` (`overflow-hidden`) lo ritaglia. Preferisci layout che lasciano spazio; se un prodotto deve ritagliare in modo marcato, disegna lo stato di focus all'interno del controllo invece di nascondere silenziosamente tutto il focus da tastiera.

<a id="the-users-text-size-is-the-apps-zoom"></a>

### La dimensione del testo dell'utente è lo zoom dell'app

Il testo segue la dimensione del testo dell'utente (Dynamic Type, la scala dei font di Android, le impostazioni dei desktop): `fontScale()` in TSX, `font_scale()` in Rust, entrambi reattivi. La scala tipografica (`text-sm`, `text-base`: 16 punti, la dimensione del corpo del testo) stabilisce il riferimento, e l'impostazione dell'utente lo scala. Questo segue deliberatamente la parte utile del modello di Tailwind: passi nominati di tipografia, spaziatura e dimensione invece di costanti in punti scollegate tra loro.

Lascia che i contenitori di testo crescano con il loro testo: dai loro altezze minime e padding invece di altezze fisse. Un componente personalizzato che combina testo scalato con una geometria fissa attorno deve documentare perché quella parte non dovrebbe crescere.

Tratta ogni valore in punti arbitrario e ogni costruttore di colore grezzo nella UI dell'app come un rilievo da revisione. Accettalo solo per un confine fisico o di piattaforma documentato, per geometria misurata a runtime, per un colore raster o di dati, o per la definizione del tema stessa. La comodità e la corrispondenza a uno screenshot non sono eccezioni valide.

Tutto ciò che viene messo in cache a partire dal layout risolto deve includere la scala del font nella propria chiave di invalidazione, direttamente o tramite una revisione che cambia con essa: altezze delle righe comunicate a una lista, misure del testo, geometria dei popup, dimensioni delle icone derivate dal testo e metriche personalizzate del canvas.
<a id="events-commands-and-focus"></a>

## Eventi, comandi e focus

Usa le pressioni per l'attivazione: `onPress`, `onLongPress`, `onPressDown` e `onPressUp` hanno lo stesso significato con un dito, una penna, un mouse o la tastiera. Usa i gestori touch e i gesti solo per ciò che segue il dito (un pan, un trascinamento). Usa le scorciatoie da tastiera (`keymap.bind`, `on_key`) e le voci di menu per i comandi che devono supportare combinazioni di tasti, menu o invocazione da più input. Tieni i gestori vicini alla pagina che possiede il comando.

Modella una volta sola ogni comando logico. Un `Button`, una voce di `Menu`, una voce di `ContextMenu`, una voce del menu applicativo di `nsh/desktop` e una scorciatoia da tastiera devono chiamare la stessa funzione dello store, invece di copiare cinque mutazioni. Ove possibile, ricava etichetta, icona, scorciatoia e stato disabilitato da un'unica policy del comando (`key_label("mod+s")` scrive una scorciatoia secondo le convenzioni della piattaforma), così i punti di ingresso non possono divergere. Il menu possiede la navigazione e la chiusura; la pagina decide comunque se il comando è consentito e cosa fa.

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

Preserva i ruoli semantici nella scelta dell'elemento. Usa `Button` per i comandi anche quando il trattamento desiderato è discreto; dagli uno stile discreto invece di sostituirlo con un link. Le app NSH riservano il ruolo `link` ai target aperti fuori dall'app, come un URL o un indirizzo email; usa la navigazione per una destinazione interna all'app e `Button` per un comando.

Interrompi la propagazione (`stopPropagation()` su un evento touch) solo quando un'interazione annidata deve impedire al genitore di gestire lo stesso tocco. Interruzioni generalizzate della propagazione rompono scorrimento, pressioni e gesti in modi difficili da diagnosticare.

**Il main thread non attende mai il codice dell'app.** Quando il sistema ha bisogno di una risposta immediata (questa pagina può essere rimossa dallo stack? questo sheet o popover può chiudersi? questo testo può cambiare?), NSH risponde in modo nativo a partire da prop montate in precedenza, e un evento informa l'app a posteriori. Perciò una decisione è una prop, impostata non appena è nota, non una callback che restituisce true o false: `popOnBack={!dirty()}` con `onBackPress` per confermare ([popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback)), `closeOnEscape` e `closeOnBackdropPress` con `onCancel` per essere informati del tentativo, `maxLength` su un input, `disabled` su un pulsante.

Il `shortcut` (`nsh/desktop`) di una voce di menu associa il suo tasto finché il menu è impostato, e il menu lo mostra nello stile della piattaforma; un'associazione `keymap` della stessa combinazione di tasti ha la precedenza. Assegna a ogni combinazione di tasti un solo proprietario e reimposta il menu applicativo quando cambiano le sue voci o le sue scorciatoie.

Rendi esplicita la proprietà del focus:

- `Button`, `Switch` e le voci di menu sono punti di sosta del focus da tastiera su desktop e web; costruisci i controlli su di essi anziché su view nude;
- sposta il focus con il `focus()` di un ref da un evento o da un effect che segue un cambio di stato, e sposta quello dello screen reader con `set_accessibility_focus()` (Rust) o `setAccessibilityFocus` da `nsh` (TSX);
- renderizza uno stato `focus:` visibile;
- non richiedere il focus in modo incondizionato durante il rendering.

I widget compositi devono implementare il modello di navigazione completo (movimento con le frecce, Home / End o movimento a pagine dove appropriato, conferma, annullamento e comportamento del Tab) anziché poche scorciatoie isolate.

Gli overlay si chiudono dall'alto: Escape e il pulsante Indietro di Android vanno all'overlay più in alto che è in ascolto (`onCancel`). Gestisci sequenze rapide di chiusura e apertura senza agire su una superficie intermedia già in chiusura.

<a id="async-work-and-side-effects"></a>

## Lavoro asincrono ed effetti collaterali

Avvia il lavoro asincrono da un evento, da un effect o da un [`resource`](./reactivity.md#resource), non come effetto collaterale incondizionato del corpo di un componente. Un effect traccia solo ciò che legge in modo sincrono: leggi prima i signal, poi avvia il lavoro. Quando il lavoro termina, aggiorna lo stato tramite signal, tieni conto che il componente potrebbe non esistere più e scrivi insieme le modifiche coerenti.

Mantieni il lavoro ricorrente sotto un proprietario, in modo che la sua scomparsa lo annulli: i task e i timer di Rust terminano con il loro proprietario, i timer TSX si fermano in `cleanup`. Un task one-shot che deve concludersi in modo indipendente può essere avviato dallo store, ma rinuncia a questa cancellazione. Gestisci in modo esplicito errori e richieste fallite.

Rappresenta le operazioni asincrone con stati espliciti: lo `state()` di una risorsa è `unresolved`, `pending`, `ready`, `refreshing` o `errored`. Preserva i dati precedenti utilizzabili durante l'aggiornamento: una risorsa mantiene il proprio valore mentre si ricarica. Impedisci invii distruttivi duplicati ed esponi nella UI gli errori recuperabili; non affidarti ai log come feedback per l'utente.

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

Sposta fuori dai gestori TSX il parsing o il calcolo costoso: in un `computed`, fuori dal percorso di interazione, o in Rust. I risultati possono arrivare dopo che la query, la pagina o la selezione sono cambiate: una risorsa scarta i caricamenti superati, mentre il lavoro che gestisci tu allega una revisione o un'identità e rifiuta i risultati obsoleti anziché applicarli al nuovo stato.

<a id="layout-measurement-and-scrolling"></a>

## Layout, misurazione e scorrimento

Una view dispone i propri figli in colonna e, per impostazione predefinita, i figli si estendono su tutta la larghezza; `class="flex"` (`.flex_row()`) è una riga, come in CSS. Una riga di controlli vuole i figli centrati (`items-center`), che lo dichiara esplicitamente. Una riga di colonne a tutta altezza mantiene lo stretch predefinito, così una colonna riempie l'altezza della riga e la sua intestazione resta in alto:

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

La maggior parte della UI dovrebbe usare il layout anziché misurare da sé ([Layout](./layout.md)). La misurazione (`onLayout`, `measure()`) è uno strumento di comportamento profondo per overlay, virtualizzazione, editor, grafici e componenti simili la cui correttezza dipende dalla geometria risolta.

- Colloca misurazione e geometria nel livello che possiede il comportamento.
- Osserva il layout solo quando il layout ordinario non può esprimere la relazione.
- Non scrivere mai stato dell'app non correlato a ogni evento di layout.
- Tratta i dati misurati come legati a una revisione; possono diventare obsoleti dopo modifiche a dimensione del testo, larghezza, tema o contenuto.
- Lascia che gli overlay di `nsh/base` posizionino i popup: posizionamento, flipping e margini della safe area seguono un'unica policy.

Per gli invarianti di allineamento, preferisci la costruzione alla correzione: le regioni sorelle devono usare lo stesso token di spaziatura o lo stesso inset condiviso invece di ripetere valori letterali uguali. Aggiungi controlli di geometria o screenshot su una piattaforma reale (`nsh test --target`) per bordi, colonne e spazi ripetuti critici. Prova più di una finestra predefinita: una dimensione del testo grande e il ridimensionamento del display possono trasformare coordinate frazionarie in una deriva di un pixel anche quando lo screenshot predefinito sembra allineato.

Misura il risultato risolto quando verifichi la precisione, ma non codificare una correzione misurata come valore arbitrario. Risali la discrepanza fino a padding duplicato, inset annidati, proprietà dei bordi, metriche del font o arrotondamenti, poi correggi il proprietario strutturale.

Ogni regione scorrevole deve avere un solo proprietario. Evita scorrimenti annidati accidentali sullo stesso asse. Dai alla scroll view l'elemento che possiede l'intera pagina, pannello o elenco, in modo che il suo indicatore si risolva rispetto al bordo della regione, e metti l'inset del contenuto al suo interno (`contentClass` / `contentStyle`) invece di avvolgere la scroll view in un contenitore con padding. Un indicatore che fluttua tra il contenuto e il bordo della pagina di solito rivela il proprietario di scorrimento sbagliato o un padding sul livello sbagliato. Evita la safe area e la tastiera con `env(safe-area-inset-*)` e `env(keyboard-inset-height)` in padding e margin (leggi i valori con i rispettivi accessor), che seguono nativamente la rotazione e la tastiera.

<a id="lists-tables-and-large-data"></a>

## Elenchi, tabelle e grandi quantità di dati

Usa [`List`](./lists.md) (`virtual_list` in Rust) quando i dati possono crescere oltre una collezione piccola e limitata. Mantieni l'identità della riga separata dalla posizione visibile ed evita di copiare l'intero set di dati a ogni aggiornamento. Lascia che l'elenco possieda il riciclo, il coordinamento dello scorrimento e l'intervallo visibile, mentre le funzioni di riga possiedono la presentazione della riga.

Separa:

- dati sorgente e id di dominio;
- stato di filtro e ordinamento;
- stato di selezione;
- stato di scorrimento;
- rendering delle righe.

Così gli aggiornamenti restano locali e l'albero delle view non diventa il modello dei dati.

La virtualizzazione è un contratto comportamentale, non solo un interruttore di prestazioni. Una funzione di riga viene eseguita una volta per cella, e le celle vengono riutilizzate per altre righe:

- **deve mantenere lo stato per elemento in dati indicizzati per id**, non in un signal creato all'interno della riga, che viaggia con la cella verso l'elemento successivo;
- **deve leggere l'elemento dove viene usato**, nei binding: un valore copiato all'inizio della funzione di riga appartiene alla prima riga mostrata dalla cella;
- aggiorna in modo immutabile in TSX (un nuovo array, elementi invariati riutilizzati, un elemento modificato come nuovo oggetto) e fornisci un `estimatedItemSize` vicino alla riga tipica;
- lo scorrimento verso un elemento (`scrollToIndex`) funziona in coordinate dei dati anche quando la maggior parte delle righe non esiste.

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

## Progettazione delle API pubbliche

Per i componenti riutilizzabili:

- le prop stabiliscono default validi: `#[prop(default)]` o `#[prop(default = …)]` in Rust, `??` dove la prop viene letta in TSX;
- ogni prop, evento ed export ha un commento di documentazione; in Rust diventa la dichiarazione TypeScript che vede TSX;
- le callback descrivono modifiche richieste e includono dettagli del puntatore solo quando sono significativi;
- parti, slot e funzioni di rendering espliciti sono preferibili all'ispezione di discendenti arbitrari;
- aggiungere un comportamento riutilizzabile non deve imporre una scelta visiva a livello di prodotto.

Le app vengono consegnate alle app host come pacchetti firmati e potrebbero non essere mai ricompilate: ogni versione successiva di NSH le esegue così come sono. Applica la stessa disciplina a ciò che un'app o una libreria di componenti espone ad altri (le prop e gli eventi dei suoi componenti, gli export del suo crate, le funzioni che ricevono i componenti nativi e i moduli di un'app host):

- gli input acquisiscono solo membri opzionali; i tipi possono solo allargarsi; default e comportamento restano invariati (il nuovo comportamento è opt-in);
- una funzione i cui parametri possono aumentare riceve le proprie opzioni come un unico oggetto (`scrollTo({ x, y, animated })`), mai come ulteriore parametro posizionale; i parametri che non cresceranno mai, come inizio e fine di un intervallo, restano posizionali;
- una modalità è un'unione di stringhe, che può acquisire nuovi valori, anziché un booleano che in seguito richiede un terzo stato;
- un valore ha un solo tipo: `version: string`, mai `string | number`;
- ciò che una funzione restituisce è un oggetto, che può acquisire un campo, anziché una tupla o un valore nudo;
- una funzione che restituisce una Promise segnala ogni errore rifiutandola, e un errore che il chiamante può gestire porta un `code`, come fanno quelli di NSH: i chiamanti si ramificano sui codici, mentre i messaggi sono per le persone e possono cambiare;
- una ridenominazione mantiene il vecchio nome come alias `@deprecated` della stessa implementazione.

In Rust, i campi privati sono la scelta predefinita per lo stato comportamentale che deve evolvere senza rompere i chiamanti. I campi pubblici sono appropriati per configurazioni deliberatamente simili a record e per dati serializzati. Ogni struct pubblica con campi pubblici deve riportare `#[non_exhaustive]` e implementare `Default`, in modo che i chiamanti possano creare valori senza letterali di struct esaustivi e che si possa aggiungere un campo senza romperli.

Mantieni stabili i percorsi di import pubblici mentre riorganizzi gli interni: lo specifier `#[native_module]` di un crate e i suoi export, così come gli export di un modulo TSX, sono ciò che il resto del codice importa. Preferisci la terminologia dei controlli della piattaforma e la nomenclatura consolidata di NSH al vocabolario dei framework web.
<a id="platform-and-capability-boundaries"></a>

## Confini di piattaforma e di funzionalità

Non dare per scontato che ogni piattaforma supporti le stesse funzionalità. Barre del titolo e controlli della finestra, accessibilità, appunti, feedback aptico, fisica dello scorrimento, font e temporizzazione possono differire. Un unico bundle gira ovunque ([Codice specifico per piattaforma](./platform-specific.md)); inserisci il codice specifico per piattaforma dove NSH gli riserva un posto e definisci il comportamento di fallback:

- ciò che un elemento significa su ogni piattaforma è una prop di primo livello; una funzionalità di sistema propria di una piattaforma va in `ios={{…}}`, `android={{…}}`, `desktop={{…}}` o `web={{…}}` (un metodo builder in Rust), in ciascuna delle piattaforme che la offrono, e viene applicato solo l'oggetto della piattaforma corrente;
- le API delle piattaforme mobili provengono da `nsh/mobile`, quelle dei desktop da `nsh/desktop`;
- gli stili per piattaforma sono classi `ios:`, `android:` e `web:`.

Un ramo specifico per piattaforma deve preservare il contratto semantico anche se la presentazione differisce. Per esempio, un dialog è un foglio (sheet) su iOS e un livello sopra la finestra sui desktop, ma l'app ha comunque bisogno di uno stato di apertura coerente. Testa il comportamento condiviso in modalità headless e la parte della piattaforma con `nsh test --target`. Fornisci un `default` a ogni ramo su un valore che NSH riporta (`platform.os`, uno stato, un motivo): le release future aggiungono piattaforme e casi, e un'app consegnata oggi gira anche su di essi ([Compatibilità](./compatibility.md)).

Un'app dichiara ciò che raggiunge al di fuori della sua VM in `nsh.json` `"capabilities"`: gli host da cui effettua fetch, le pagine che mostra una web view, gli appunti, la status bar ([Sandbox e capability](./sandbox-and-capabilities.md)). Un'app che sarà distribuita all'interno di altre app elenca esattamente ciò che usa e gestisce una richiesta rifiutata come gestisce una richiesta fallita: un'app host può concedere meno di quanto l'app dichiara. Una chiamata rifiutata fallisce con `code` `"ERR_ACCESS_DENIED"`, il cui `permission` indica la capability e il cui `resource` indica ciò che è stato richiesto.

<a id="file-and-naming-conventions"></a>

## Convenzioni per file e nomi

- Dai a pagine e componenti nomi tratti dai concetti del prodotto: `ProjectList`, `ProjectEditor`, `SettingsPage`.
- Dai agli event handler nomi che riflettano l'intento: `confirmDelete`, `openProject`, `onQueryChange`.
- Mantieni una sola responsabilità principale per modulo; dividi un file quando la proprietà dello stato o il ciclo di vita non si possono più capire senza leggere comportamenti non correlati.
- Tieni insieme modulo, prop, eventi e test mirati di un componente quando cambiano insieme.
- Documenta gli invarianti e i vincoli sorprendenti del ciclo di vita; non commentare le chiamate builder ovvie.
- Usa `rustfmt` e rispetta Clippy in Rust, e `nsh check` in TSX. Evita attributi `allow` troppo ampi che nascondono avvisi non correlati.

<a id="vocabulary-is-part-of-the-api"></a>

### Il vocabolario fa parte dell'API

Usa la stessa parola per lo stesso concetto in tutti i componenti. Prima di nominare una prop o un evento, cerca il termine nell'API di NSH, poi in `gpui-base` di GPUI Kit, in GPUI e in `gpui-component`, quindi nei controlli delle piattaforme. Ciò che mostra una primitiva e le API globali prendono i nomi da HTML, dal DOM e da CSS (`src`, `html`, `placeholder`). I nomi in Rust sono `snake_case` e in TSX si traducono in `camelCase` (`on_open_change` diventa `onOpenChange`); una parola resta una parola (`readonly`, `multiline`).

| Concetto | Schema di denominazione | Esempio |
| --- | --- | --- |
| Un componente | Un sostantivo, `PascalCase` | `Button`, `Dialog`, `QuantityStepper` |
| Le sue prop e i suoi eventi (Rust) | `<Component>Props`, `<Component>Event` | `ButtonProps`, `ButtonEvent::Press` → `onPress` |
| L'oggetto di stato di un comportamento | `<Control>State`, creato da `create<Control>` | `NavStackState`, `createNavStack` |
| Perché un valore è cambiato | `<Control>ChangeReason`, un'unione di stringhe | `DialogChangeReason`: `"cancel"`, `"backdropPress"` |
| Uno stato | Un aggettivo, positivo, senza prefisso `is` | `open`, `hidden`, `disabled`, `selected`, `checked`, `readonly` |
| Ciò che l'utente può fare | L'aggettivo | `scrollable`, `zoomable`, `selectable`, `resizable` |
| Una funzionalità senza aggettivo | `<feature>Enabled` | `pagingEnabled` |
| Se una parte è visibile | Un booleano con il nome della parte, predefinito `true` | `scrollbar`, `caret` (`scrollbar={false}`) |
| Se uno slot è visibile | `<slot>Visible`, predefinito `true` | `headerVisible` (`header` è lo slot di una pagina) |
| Gli stili di una parte | `<part>Class`, `<part>Style` | `backdropClass`, `contentStyle` |
| Gli stili di uno stato | Classi `<state>Style`, `<state>:` | `activeStyle`, `disabled:` |
| Uno slot | Ciò che è | `header`, `footer`, `trigger`, `content`, `empty` |
| Contenuto dell'app | `render<Part>` | `renderCodeBlock` |
| Un flag di chiusura | `closeOn<Trigger>`, predefinito `true` | `closeOnEscape`, `closeOnBackdropPress` |
| Il cambiamento di un valore | `on<Value>Change({ <value>, ... })`, un solo oggetto | `onChange({ value })`, `onOpenChange({ open, reason })` |
| Qualsiasi altro evento | `on<Event>`, al presente, un solo oggetto | `onPress()`, `onSubmit({ text })` |
| Una fase | `<act>Start`, `<act>End` | `onPanStart`, `onLoadStart` |
| Il mouse sopra una vista | `Enter` / `Move` / `Leave`, quelli del DOM | `onMouseEnter`, `onMouseMove`, `onMouseLeave` |
| Iniziare ad ascoltare | `on(event, listener)`, restituisce `() => void` | `host.on(name, l)`, `BackHandler.on("press", l)` |
| Un valore dell'ambiente | Un accessor, con `set<Value>` accanto | `colorScheme()`, `setColorScheme` |
| Un booleano di sola lettura | `is<Adjective>`, `has<Noun>` | `isAvailable` |

Le prop non sono mai `is<Adjective>`: quella forma è riservata a ciò che si limita a leggere un booleano (una costante, un campo di un payload). Una parte che viene mostrata prende il nome dalla parte, mai `<part>Shown`, `<part>Hidden` o `shows<Part>`.

Un builder Rust prende e restituisce `Self` e prende il nome dalla prop che imposta, senza `set_` (`.disabled(..)`, `.checked(..)`, `.on_change(..)`); la modifica sul posto è `set_<field>` (`setRoutes`, `setColorScheme`). Un lettore booleano è `has<Noun>`, quando il valore contiene qualcosa, oppure `is<Adjective>`, quando descrive uno stato o un permesso. Scegli l'aggettivo ogni volta che l'azione ne ha uno: `isClosable` anziché `canClose`, `isZoomable` anziché `canZoom`. Quando l'azione è una locuzione verbale senza forma aggettivale, nomina invece ciò di cui ha bisogno: `hasDefinition`, non `canGoToDefinition`. Non aggiungere nuovi lettori `can`.

<a id="let-the-enclosing-name-carry-the-context"></a>

### Lascia che il nome che racchiude porti il contesto

Un nome viene letto dentro qualcosa: una prop dentro il suo componente, un campo dentro il suo tipo. Nessuno dei due ripete ciò che lo racchiude (`contentStyle`, non `contentContainerStyle`; `backdropClass` di `Dialog`, non `dialogBackdropClass`). Mantieni i campi di uno stesso tipo allo stesso livello di abbreviazione.

<a id="use-precise-domain-words"></a>

### Usa termini di dominio precisi

- **selected** indica l'appartenenza o l'elemento corrente; **checked** e **pressed** sono il valore di una checkbox o di un toggle; **focused** è il bersaglio della tastiera; **hovered** è la presenza del puntatore. Non usarli mai in modo intercambiabile.
- **open / close** è lo stato di un overlay; **show / hide** una richiesta transitoria; **expand / collapse** la struttura.
- **disabled** blocca l'interazione; **readonly** consente di selezionare e navigare ma non di modificare; **loading** impedisce lavoro duplicato mentre un'operazione è in corso.
- **press** è l'attivazione da parte di qualsiasi input, e gli eventi di NSH dicono press (`onPress`); **click** è quella del mouse.
- **index** è una posizione; **id** è l'identità. Non rendere persistenti né indicizzare per index dati riordinabili.
- **value** è un dato di dominio controllato; **state** è un comportamento mantenuto.
- **src** è la risorsa che un elemento mostra (un'immagine, un video, una pagina); qualsiasi altro indirizzo è un **url**.
- **role** indica che cosa significa una scelta (`"cancel"`, `"destructive"`); l'aspetto spetta all'app.

Evita nomi vaghi come `data`, `item2`, `handleAction`, `updateUi`, `process`, `manager` o `config` quando esiste un termine di dominio più preciso.

<a id="type-and-module-style"></a>

### Stile di tipi e moduli

- I tipi Rust sono `UpperCamelCase`; moduli, funzioni, metodi, campi e variabili locali `snake_case`; le costanti `SCREAMING_SNAKE_CASE`. Chiama i binding di contesto `cx`.
- I componenti TSX e i loro tag sono `PascalCase`; prop, funzioni e variabili locali `camelCase`. Le primitive provengono da `nsh`, i componenti di base da `nsh/base`.
- Un modulo che prende il nome da un componente possiede la sua interfaccia pubblica; dividi stato, parti e test in file separati senza cambiare ciò che gli altri importano.
- Usa nomi di modulo al singolare per un singolo concetto di componente e nomi consolidati per le famiglie (`menu` per `Menu`, `MenuItem` e `Submenu`).
- Aggiungi ai identificatori il suffisso `Id`, e usa plurali significativi per le collezioni. Non alternare `idx`, `index` e `ix` nello stesso sottosistema.
- Dai ai predicati nomi positivi quando possibile. Uno stato positivo è più facile da comporre di diversi negativi, ma mantieni termini consolidati come `disabled` dove corrispondono alla semantica del controllo.

<a id="callback-and-event-wording"></a>

### Terminologia di callback ed eventi

- Ogni evento passa un solo oggetto, anche con un solo campo e anche per il cambiamento di un valore, con i campi chiamati come le prop che riportano: `onChange({ value })`, `onOpenChange({ open, reason })`, `onLinkPress({ url })`. Un campo successivo è quindi un'aggiunta. Un tipo di dati dell'API è un campo, mai il payload stesso (`onImagePress({ image })`); un evento senza nulla da riportare non passa nulla.
- Nomina l'atto, non il passato né una richiesta: `onPress`, `onClose`, `onCancel`, `onBackPress`.
- Nomina l'intento anziché la geometria quando l'atto ha un nome: `onLoadMore`, non "è stata raggiunta la fine".
- Le coppie del ciclo di vita sono `onOpen` / `onClose`; le fasi sono `Start` / `End`, mai `Begin`; il mouse sopra una vista è `onMouseEnter` / `onMouseMove` / `onMouseLeave` (i nomi del DOM), un file trascinato sopra di essa `Enter` / `Leave`.
- Documenta se una callback viene eseguita prima o dopo il cambiamento dello stato proprio del componente, e se può rientrare nel componente.

<a id="documentation-and-copy-style"></a>

### Stile della documentazione e dei testi

La documentazione pubblica dovrebbe iniziare spiegando che cosa fa un componente e chi possiede il suo stato. Gli esempi devono usare le API attuali e mostrare id stabili. Documenta i valori predefiniti, le differenze tra piattaforme, il comportamento del focus, l'ordine delle callback e quali prop il thread principale legge in modo nativo.

Segui le regole sul linguaggio dell'interfaccia delle Design Guides per etichette, comandi, dialog di conferma, maiuscole e puntini di sospensione. Mantieni un unico termine canonico per ogni oggetto di dominio, comando e stato.

Le chiavi di traduzione descrivono un intento stabile (`dialog.deleteProject.title`), non una frase nella lingua di origine né una coordinata sullo schermo. Non comporre mai una frase da frammenti tradotti e non riutilizzare una chiave per significati che per caso condividono lo stesso testo inglese.

Localizza l'intento, non la sintassi. Dai a ogni locale il controllo sull'ordine delle parole, sulla pluralizzazione, sulla punteggiatura e sulla quantità di contesto necessaria. I test dovrebbero individuare chiavi mancanti e termini fissi incoerenti; la revisione umana decide comunque se la ripetizione è giustificata dal contesto. Verifica ogni stringa all'interno del suo componente con contenuti realistici, espansione del testo e una dimensione di testo grande.

<a id="testing-strategy"></a>

## Strategia di test

Testa al livello più basso in grado di dimostrare il comportamento ([Test](./testing-and-trace.md)):

1. test puri per transizioni di stato, formattazione, parsing e ordinamento (`cargo test` delle funzioni di un crate, un file di test per le funzioni dello store);
2. test headless dell'app per componenti, eventi e ciclo di vita: il motore reale, il renderer, il layout e le liste, con frame di visualizzazione a 60 Hz, in `nsh test` (`nsh/test`) o `cargo test` (`nsh_testing::Headless`);
3. test di interazione per focus, tastiera, puntatore, layout e stato renderizzato, con i passaggi che compie un utente (`press`, `type`, `scroll`, `drag`, `keyboard.press`), in headless e su una piattaforma reale (`nsh test --target macos`, `ios`, `android`, `web`, ...);
4. smoke test di esempi o app per i flussi di lavoro completi, e `nsh test --trace` per il costo di un'interazione.

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

Per un componente interattivo, copri il contratto semantico anziché i dettagli di implementazione: attivazione tramite press e tastiera, cambiamenti di valore controllati, comportamento disabilitato, spostamento del focus, numero e ordine degli eventi, identità stabile e stati vuoti o di errore importanti. Simula la rete (route `network`) e controlla il tempo (un clock manuale) invece di attendere quelli reali. Aggiungi un test di regressione prima di correggere un bug ogni volta che il malfunzionamento può essere riprodotto in modo deterministico.

Trova le viste come fa un utente: per ruolo e nome, etichetta o testo (`role:button[Save]`, `label:Close`), e tramite un `testID` stabile dove nient'altro le identifica. I selettori vengono riletti a ogni passaggio, così un passaggio non agisce mai su uno snapshot obsoleto. Usa gli screenshot (`app.screenshot`, su una piattaforma reale) per i fatti visivi che i selettori non sanno esprimere; usa le coordinate solo come ripiego. Riporta separatamente le evidenze automatiche e quelle manuali.

<a id="performance-rules"></a>

## Regole di prestazioni

- Non scrivere stato in modo incondizionato da un binding o da un effect che lo legge.
- Evita di creare signal, effect, key binding e strutture dati costose all'interno di binding o funzioni di riga.
- Leggi i signal nei binding, in modo che un cambiamento coerente aggiorni la parte più piccola possibile dell'albero.
- Usa `List` per le collezioni lunghe e renderizza solo l'intervallo visibile.
- Evita di clonare stringhe o collezioni di grandi dimensioni solo per soddisfare una closure; cattura handle `Copy` o dati condivisi (`SharedString`, `Rc`).
- Mantieni leggeri gli handler TSX e i valori calcolati; sposta il lavoro pesante fuori dal percorso di interazione o in Rust.
- Misura con `nsh test --trace` prima di aggiungere cache. Una cache deve avere un responsabile chiaro dell'invalidazione.
- Mantieni limitato il lavoro di animazione: valori animati sul thread UI anziché signal scritti a ogni frame, `scrollValue` anziché un listener di scroll ([Animazione](./animation.md)), e rispetta la riduzione del movimento (`reduceMotion()`).
<a id="common-failure-modes"></a>

## Modalità di errore comuni

Evita questi pattern:

- un solo signal che contiene lo stato non correlato dell'app;
- logica di business e richieste di rete incorporate nel corpo di un componente lungo;
- chiavi casuali o basate sull'indice per contenuti riordinabili;
- stato per riga in signal creati all'interno di una riga `List`;
- lettura di una prop o di un signal nel corpo di un componente aspettandosi che si aggiorni;
- colori e raggi letterali che rompono i temi personalizzati e la dark mode;
- view pressable personalizzate dove un componente semantico fornisce già focus, tastiera, stato disabilitato e comportamento di accessibilità;
- stato locale duplicato che si discosta da un valore controllato;
- effect che copiano un signal in un altro e scritture che vanno in loop attraverso un binding;
- una decisione di cui il sistema ha bisogno all'istante lasciata a una callback, invece che a una prop impostata in anticipo;
- scroll view annidate senza una proprietà esplicita;
- una nuova variante di componente per una schermata isolata;
- finestre di dialogo di conferma per azioni reversibili e a basso rischio;
- test che chiamano funzioni interne ma non premono, non digitano e non scorrono mai.

<a id="rules-for-coding-agents"></a>

## Regole per i coding agent

Prima di modificare, un agente deve leggere l'implementazione più vicina, i relativi test, gli export pubblici del modulo e la pagina di riferimento pertinente. Deve cercare le firme nel sorgente corrente e in `.nsh/types` invece di tradurre per analogia un esempio di React, React Native, CSS o GPUI: i componenti NSH vengono eseguiti una sola volta, e i binding seguono i signal che leggono.

Per ogni modifica, l'agente deve essere in grado di indicare:

1. il responsabile del comportamento e il responsabile della presentazione;
2. l'identità mantenuta e il ciclo di vita dello stato;
3. il contratto di pressione, tastiera, focus e accessibilità;
4. il responsabile del layout e dello scorrimento;
5. i token del tema e le eccezioni intenzionali;
6. il test che fallirebbe se il comportamento regredisse.

Il codice generato deve essere rivisto e testato da una persona. "Compila" non è uno standard di qualità per la UI, e un refactoring ampio che si limita a rendere ordinato il codice generato non sostituisce la coerenza con l'architettura dell'app.

<a id="implementation-checklist"></a>

## Checklist di implementazione

Prima di aprire una modifica per la revisione, verifica che:

- la proprietà dello stato e degli effetti collaterali sia esplicita;
- la scelta tra una funzione semplice e un componente sia deliberata, e le prop e i signal siano letti dove vengono usati;
- gli elementi ripetuti abbiano chiavi stabili basate sul dominio e test id stabili;
- i token del tema e la scala di Tailwind sostituiscano i valori visivi letterali isolati;
- pressioni, scorciatoie da tastiera, focus, stato disabilitato e overlay funzionino insieme;
- le decisioni di cui il sistema ha bisogno all'istante siano prop impostate in anticipo;
- siano rappresentati i percorsi di caricamento, stato vuoto, errore e annullamento;
- i set di dati di grandi dimensioni usino `List`, con lo stato per elemento nei dati;
- le aggiunte all'API pubblica si limitino ad ampliarla e preservino la direzione delle dipendenze e l'incapsulamento;
- i test dimostrino il comportamento al livello appropriato, in modalità headless e sulle piattaforme toccate dalla modifica;
- formattazione, Clippy, `nsh check`, test mirati ed esempi pertinenti siano superati.

Consulta [Introduzione](./getting-started.md) per la configurazione dell'app e i riferimenti [Elements](../elements/index.md) e [API](../modules/index.md) per i dettagli aggiornati dell'API.
