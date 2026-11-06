---
title: "JSX e componenti"
description: "Come NSH descrive la UI in Rust e in TSX - elementi, componenti, props, children, flusso di controllo, ref e spread - e come il compilatore JSX e i builder di Rust creano gli stessi elementi nativi."
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---

# JSX e componenti

Le app NSH descrivono la loro UI con elementi e componenti, in Rust o in TSX. Rust costruisce gli elementi con funzioni e metodi builder tipizzati (`view().gap_4().child(..)`); TSX li scrive come JSX, che il compilatore di NSH trasforma in chiamate dirette allo stesso renderer nativo, senza React e senza virtual DOM. In entrambi i casi, un componente è una funzione che viene eseguita una sola volta per costruire la sua parte di albero. Ciò che mantiene la UI aggiornata in seguito è la [reattività](./reactivity.md): i binding che leggono i signal vengono seguiti in modo nativo, e solo loro vengono rieseguiti.

<a id="elements"></a>

## Elementi

Gli **host element** sono ciascuno supportato da una vista nativa. Rust li crea con le funzioni del prelude; TSX li importa da `nsh` come componenti, e solo `If` e `Each` sono globali che non richiedono import:

| Rust | TSX | Vista nativa | Pagina |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`: un contenitore per layout, stile e tocchi | [View](../elements/view.md) |
| `text(..)` | `<Text>` | Una vista di testo nativa; gli elementi di testo annidati sono span | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | Una vista immagine (asset locali e URL) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | Una lista virtualizzata con riciclo delle viste | [List](../elements/list.md) |
| `canvas(..)`, `web_view(url)`, `video(url)` | `<Canvas>`, `<WebView>`, `<Video>` | Un disegno, una pagina web, un video player | [Elementi](../elements/index.md) |
| `nsh_base::dialog()` | `<Dialog>` da `nsh/base` | Un livello presentato | [Elementi](../elements/index.md) |
| `when(..)`, `each(..)` | `<If>`, `<Each>` | Flusso di controllo, senza vista propria | [Flusso di controllo](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

In Rust, gli stili sono metodi tipizzati con gli stessi nomi delle utility di Tailwind (`.px_4()`, `.rounded_lg()`, `.bg(..)`), e anche i listener sono metodi (`.on_press(..)`); le impostazioni specifiche di una piattaforma hanno metodi propri. In TSX, le prop mantengono i nomi in camelCase (`onPress`, `allowFontScaling`, `backgroundColor`); ogni elemento accetta `style`, `class` / `classList` ([Tailwind](./tailwind.md)), `ref`, gestori di tocco, prop di accessibilità e `testID`, mentre le prop specifiche di una piattaforma vanno in `ios={{…}}` e `android={{…}}`, dove viene inviato solo l'oggetto della piattaforma corrente:

```rust tabs
view()
    .rounded(px(12.0))
    .bg(move || theme().background)
    .on_press(move || open.set(true))
    .child(text("Open").font_weight(FontWeight::SEMIBOLD))
```

```tsx tabs
<View android={{ elevation: 4, ripple: { color: "#0001" } }} style={{ borderRadius: 12 }} onPress={() => open.set(true)}>
  <Text style={{ fontWeight: "600" }}>Open</Text>
</View>
```

I tag TSX sono in PascalCase in modo che TypeScript verifichi ciascuno rispetto al binding che nomina: un tag in minuscolo viene verificato rispetto a un unico tipo globale per nome, quindi un componente generico come `List` o `Each` non potrebbe dedurre il tipo delle sue righe da `each` / `of`, e i componenti propri di un'app non sarebbero tipizzati affatto. Gli import non costano nulla a run time: il compilatore riconosce le primitive tramite i loro import (anche con alias) e crea l'elemento nativo sul posto, quindi `<View>` è una chiamata diretta al renderer e l'import viene rimosso dal bundle. Un tag in minuscolo è un errore di build che indica cosa scrivere:

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> Il testo viene mostrato solo all'interno di un elemento di testo: `text(..)` in Rust, `<Text>` in TSX. Una stringa direttamente in un `<View>` non crea alcuna vista nativa e non viene mostrata.

<a id="components"></a>

## Componenti

L'aspetto di un'app è dell'app stessa. NSH offre due livelli: le primitive (gli elementi qui sopra, gli stili, le classi Tailwind) e i componenti base senza stile di [`nsh/base`](../modules/nsh-base.md) (`nsh_base` in Rust), che gestiscono comportamenti come navigazione, dialog, tastiera, status bar e safe area. Il terzo livello, la libreria di componenti, è vostro: pulsanti, card e ogni altro pezzo della vostra UI sono componenti che scrivete su quei due livelli, nel crate della vostra app ([Sviluppare con Rust](./rust.md)) o in TSX, oppure una libreria della community ([Tre livelli](./architecture.md#three-layers)).

Un componente Rust è un `#[component] fn` che riceve la sua struct di props (e, quando ha eventi, un `Scope` per emetterli) e restituisce i suoi elementi. `#[component]` crea anche il suo costruttore, con il nome della funzione in snake case: `Badge` si posiziona con `badge()`, come `view()` posiziona una vista, con un setter per ogni prop (`.label(..)`, `.color(..)`: un valore, un signal o una closure). Un componente TSX è una funzione che riceve un oggetto di props e restituisce JSX:

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct BadgeProps {
    /// The text.
    pub label: Prop<SharedString>,
    /// The background (light blue when left out).
    #[prop(default = Hsla::from(rgb(0xddf4ff)))]
    pub color: Prop<Hsla>,
}

/// A small rounded label.
#[component]
pub fn Badge(props: BadgeProps) -> impl IntoElement {
    view()
        .rounded_full()
        .px(px(10.0))
        .py_1()
        .bg(move || props.color.get())
        .child(text(props.label).text_size(px(13.0)).font_weight(FontWeight::SEMIBOLD))
}

// Placed in another component's view:
badge()
    .label(move || format!("{} new", unread.get()))
    .color(rgb(0xfff8c5))
```

```tsx tabs
function Badge(props: { label: string; color?: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: props.color ?? "#ddf4ff" }}>
      <Text style={{ fontSize: 13, fontWeight: "600" }}>{props.label}</Text>
    </View>
  );
}

<Badge label={`${unread()} new`} color="#fff8c5" />
```

La funzione viene eseguita **una sola volta**, quando il componente viene creato, e non traccia ciò che legge: non esiste re-rendering. Il codice nel suo corpo (creare signal, avviare effect, calcolare costanti) viene eseguito una volta sola. Gli elementi che restituisce restano collegati alle prop e ai signal che leggono, quindi `Badge` qui sopra aggiorna il suo testo ogni volta che `unread` cambia, senza rieseguire `Badge`.

Scrivete un `#[component]` quando la UI ha prop o eventi propri, o quando un entry TSX lo importa: un componente Rust viene registrato con il suo tipo (`registry.register::<Badge>()`), con le prop tipizzate a partire dalla struct ([Sviluppare con Rust](./rust.md#extending-a-rust-app-with-tsx)). Per un pezzo di UI usato solo da Rust basta una semplice funzione che restituisce `impl IntoElement`, con le prop come argomenti. In TSX, un componente può restituire un elemento, una stringa o un numero, un array, `null`, o una funzione che restituisce uno di questi (che il renderer segue); il tipo `Component<P>` da `nsh` ne descrive uno:

```rust tabs
fn row(title: impl Into<SharedString>, content: impl IntoElement) -> impl IntoElement {
    view()
        .flex_row()
        .gap_2()
        .child(text(title.into()))
        .child(content)
}
```

```tsx tabs
import type { Component, JSX } from "nsh";
import { Text, View } from "nsh";

const Row: Component<{ title: string; children?: JSX.Element }> = (props) => (
  <View style={{ flexDirection: "row", gap: 8 }}>
    <Text>{props.title}</Text>
    {props.children}
  </View>
);
```

<a id="what-runs-again"></a>

### Cosa viene rieseguito

Un valore passato a un elemento viene impostato una sola volta; un binding segue ciò che legge. In Rust un binding è una closure (oppure un signal, un memo, una prop) passata dove va un valore. In TSX, il compilatore decide per ogni espressione nel JSX: un'espressione cambia quando **chiama una funzione o legge una proprietà** (al di fuori delle funzioni annidate), e tutto il resto viene impostato una volta sola:

```rust tabs
text(move || format!("{}", count.get()))     // follows count
text(props.title)                            // follows the prop
text(label.clone())                          // a plain value: set once
view().opacity(move || if busy.get() { 0.5_f32 } else { 1.0 })   // follows busy
```

```tsx tabs
<Text>{count()}</Text>              // follows count
<Text>{props.title}</Text>          // follows the prop
<Text>{user.name}</Text>            // re-read when something it depends on changes
<Text>{label}</Text>                // a plain variable: set once
<View style={{ opacity: busy() ? 0.5 : 1 }} />   // the style object is rebuilt when busy changes
```

Una prop o un figlio che cambia è un piccolo effect nativo che imposta quella singola prop o sostituisce quel singolo figlio. In Rust gli stili vengono confrontati con un diff, quindi uno stile che cambia invia solo le proprietà modificate.

I gestori di eventi vengono impostati una sola volta: una closure in Rust, una funzione o un nome in TSX (`onPress={() => …}`, `onPress={save}`). In TSX, le altre espressioni vengono seguite (`onPress={props.onPress}` segue la prop).

### Props

Le props di un componente Rust sono i campi della sua struct `#[derive(Props)]`, ciascuno un `Prop<T>`: un valore, oppure un binding passato dal genitore. Leggetene una in un binding (`text(props.title)`, `move || props.title.get()`) per seguirla; `props.title.get()` nel corpo la legge una sola volta. I campi con `#[prop(default)]` o `#[prop(default = …)]`, e gli `Option`, sono opzionali. Il costruttore parte con ogni prop al suo valore predefinito, e un genitore chiama i setter di quelle che gli servono: `badge().label("New")`.

Una prop TSX a cui viene passata un'espressione che cambia viene passata come getter: leggere `props.title` lo chiama, ed è questo che permette al JSX che la legge di seguirla. Le prop statiche sono valori semplici. In entrambi i casi, le props vengono lette dove sono usate:

```rust tabs
// Wrong: reads the prop once, when the component runs.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    let content = props.text.get();
    text(content)
}

// Right: binds the text to the prop.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    text(props.text)
}
```

```tsx tabs
// Wrong: reads the prop once, when the component runs.
function Title(props: { text: string }) {
  const { text } = props;
  return <Text>{text}</Text>;
}

// Right: reads it in JSX, which follows it.
function Title(props: { text: string }) {
  return <Text>{props.text}</Text>;
}
```

Un componente TSX che scompone le sue props nel parametro, `function Title({ text }: …)`, le legge allo stesso modo una volta sola, e la build lo segnala indicando le props da leggere al suo posto:

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

Una prop che il componente vuole solo una volta, come un id con cui parte, si legge nel corpo (`props.id.get_untracked()`, `const { id } = props;`), che lo rende esplicito.

In TSX lo stesso vale per i valori predefiniti: scrivete `props.color ?? "#ddf4ff"` nel JSX invece di scomporre con un valore predefinito. Per calcolare qualcosa a partire dalle props, usate una closure o [`computed`](./reactivity.md#computed):

```rust tabs
#[component]
fn Price(props: PriceProps) -> impl IntoElement {
    let formatted = move || format!("${:.2}", props.cents.get() as f64 / 100.0);
    text(formatted)
}
```

```tsx tabs
function Price(props: { cents: number }) {
  const formatted = () => `$${(props.cents / 100).toFixed(2)}`;
  return <Text>{formatted()}</Text>;
}
```

### Children

Ciò che un genitore inserisce in un componente arriva come i suoi children: un campo `children: Prop<Children>` in Rust, che il genitore riempie con `.child(..)`; `props.children` in TSX, un getter che costruisce quegli elementi quando viene letto:

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct CardProps {
    /// The title.
    pub title: Prop<SharedString>,
    /// The content.
    pub children: Prop<Children>,
}

#[component]
pub fn Card(props: CardProps) -> impl IntoElement {
    view()
        .p(px(14.0))
        .rounded(px(12.0))
        .bg(move || theme().background)
        .gap_2()
        .child(text(props.title).font_weight(FontWeight::SEMIBOLD))
        .child(props.children)
}

card()
    .title("Account")
    .child(text(move || format!("Signed in as {}", user.get().name)))
```

```tsx tabs
function Card(props: { title: string; children?: JSX.Element }) {
  return (
    <View style={{ padding: 14, borderRadius: 12, backgroundColor: "#ffffff", gap: 8 }}>
      <Text style={{ fontWeight: "600" }}>{props.title}</Text>
      {props.children}
    </View>
  );
}

<Card title="Account">
  <Text>Signed in as {user().name}</Text>
</Card>
```

In TSX, ogni lettura di `props.children` ricostruisce i children (nuove viste native): leggetelo una sola volta, nel punto in cui vanno i children. Tra più children, quello che cambia (un `<If>`, un `<Each>`, `{cond() ? a : b}`) arriva come funzione, e `{props.children}` aggiorna solo quello: i suoi fratelli mantengono le loro viste, un input il suo testo e il focus. I fragment (`<>…</>`) raggruppano elementi senza una vista.

I children possono anche essere creati da una funzione che il componente chiama con degli argomenti, una render callback:

```rust tabs
fn repeat<E: IntoElement>(times: usize, row: impl Fn(usize) -> E) -> impl IntoElement {
    view().child((0..times).map(row))
}

repeat(3, |i| text(format!("Row {i}")))
```

```tsx tabs
function Repeat(props: { times: number; children: (i: number) => JSX.Element }) {
  return <View>{Array.from({ length: props.times }, (_, i) => props.children(i))}</View>;
}

<Repeat times={3}>{(i) => <Text>Row {i}</Text>}</Repeat>
```

<a id="control-flow"></a>

## Flusso di controllo

`when` e `each` in Rust, `<If>` e `<Each>` in TSX, sono costrutti di flusso di controllo integrati. Non renderizzano alcuna vista propria.

```rust tabs
when(move || user.get().is_some(), move || {
    text(move || format!("Hello, {}", user.get().map(|u| u.name).unwrap_or_default()))
})
.otherwise(|| text("Signed out"))

each(todos, |todo| todo.id, |todo, index| {
    text(move || format!("{}. {}", index.get() + 1, todo.get().title))
})
```

```tsx tabs
<If when={user()} else={<Text>Signed out</Text>}>
  {(u) => <Text>Hello, {u().name}</Text>}
</If>

<Each of={todos()} key={(t) => t.id}>
  {(todo, index) => (
    <Text>
      {index() + 1}. {todo().title}
    </Text>
  )}
</Each>
```

- **`when`** / **`<If>`** mostra il suo ramo finché la condizione è vera, altrimenti il ramo `otherwise` / `else`. Renderizza di nuovo un ramo solo quando cambia il fatto che la condizione sia vera, non ogni volta che la condizione viene rivalutata. In TSX, un figlio funzione riceve un accessor del valore di `when`, tipizzato senza `null` e `undefined`: `u()` è l'utente finché il ramo è mostrato, e lo segue quando cambia.
- **`each`** / **`<Each>`** renderizza una riga per elemento, creata dalla sua funzione di riga. Le righe vengono mantenute per chiave (Rust: la funzione key; TSX: `key`, per impostazione predefinita l'elemento stesso, gli oggetti per identità e i primitivi per valore): quando la lista cambia, le righe mantenute vengono spostate anziché ricostruite, e nuove righe vengono create solo per le chiavi nuove. La funzione di riga riceve i **signal** dell'elemento e del suo indice (`todo.get()` e `index.get()` in Rust, `todo()` e `index()` in TSX), perché l'elemento e la posizione di una riga mantenuta possono cambiare. In TSX, `key="index"` (o `key={(item, i) => i}`) mantiene invece le righe per posizione: una lista di stringhe che cambia sul posto, come un testo ricevuto in streaming, mantiene le sue righe e cambia solo il loro `item()`.

Una scelta fatta in una closure (`dynamic(move || if busy.get() { … } else { … })` in Rust, un ternario o `&&` in TSX) ricostruisce il suo ramo ogni volta che cambia qualcosa che legge. Preferite `when` / `<If>` quando un ramo è composto da più di pochi elementi.

Per liste lunghe o infinite, usate [`List`](./lists.md) (`virtual_list` in Rust): crea viste solo per le righe a schermo e le ricicla. Vedere [Flusso di controllo](../elements/control-flow.md) per i dettagli.

<a id="refs"></a>

## Ref

Un ref identifica un host element per le chiamate imperative: `focus()`, `blur()`, `scroll_to()` / `scrollTo()`, `scroll_to_index()` / `scrollToIndex()`, `measure()` ([dove si trova una vista](./touch-and-gestures.md#where-a-view-is-measure)), ... In Rust, `element_ref()` ne crea uno e `.element_ref(&handle)` lo applica a un elemento; in TSX, `ref` fornisce il ref dell'elemento, il cui tipo è quello dell'elemento stesso (`InputRef` qui, `ViewRef` per un `View`; vedere [metodi dei ref](../elements/index.md#ref-methods)):

```rust tabs
fn search() -> impl IntoElement {
    let field = element_ref();
    view()
        .child(input().element_ref(&field).placeholder("Search"))
        .child(text("Focus").on_press(move || field.focus()))
}
```

```tsx tabs
import type { InputRef } from "nsh";
import { Text, View } from "nsh";
import { Input } from "nsh/base";

function Search() {
  let input: InputRef | undefined;
  return (
    <View>
      <Input ref={input} placeholder="Search" />
      <View onPress={() => input?.focus()}>
        <Text>Focus</Text>
      </View>
    </View>
  );
}
```

Un ref Rust è un handle `Copy`; le sue chiamate vanno all'elemento che lo porta, e non fanno nulla una volta che il suo proprietario non c'è più. In TSX, ciò che `ref={…}` nomina riceve il nodo:

- una variabile dichiarata con `let` lo riceve per assegnazione;
- un campo (`ref={refs.input}`, `ref={refs[name]}`) lo riceve per assegnazione;
- un [signal](./reactivity.md) viene impostato con esso, così ciò che legge il signal lo segue;
- una funzione viene chiamata con esso (`<Scroll ref={(node) => (scroller = node)} />`).

Un `const` o un import contiene un signal o una funzione, come in `const input = signal<InputRef>()` con `<Input ref={input} />` e `input()?.focus()`; uno che contiene altro viene segnalato quando l'elemento viene creato, con ciò che bisogna scrivere.

Il ref viene impostato quando l'elemento viene creato, prima che il componente ritorni, quindi è disponibile negli [effect](./reactivity.md#effect) e nei gestori di eventi. Le chiamate vengono inviate alla vista in ordine insieme alle modifiche fatte prima di esse. Anche i componenti base e i componenti Rust del vostro crate accettano `ref` (in Rust `component_ref()`, applicato all'elemento con `.component_ref(&r)`: `dialog().component_ref(&r)`).

<a id="spreading-props"></a>

## Spread delle props

In Rust, un genitore chiama i setter delle props che gli servono e le altre mantengono i loro valori predefiniti, e un wrapper passa le proprie `Prop` così come sono (`card().title(props.title)`): un `Prop` continua a seguire ciò che gli è stato dato.

In TSX, fate lo spread di un oggetto di props su un elemento o su un componente con `{...props}`. I getter restano getter, quindi le props passate con lo spread continuano a seguire ciò che leggono. Per prendere alcune props per sé e passare le altre, usate `split`:

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function Field(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} {...rest} />
    </View>
  );
}

<Field label="Email" value={email()} onChange={({ value }) => email.set(value)} keyboardType="email-address" />
```

`split(props, keys)` restituisce `[picked, rest]`, entrambi ancora in lettura diretta dalle props originali (scomporre `{ label, ...rest } = props` leggerebbe ogni prop una volta sola). Le props dell'elemento che compaiono più avanti nel JSX hanno la precedenza su quelle precedenti.

`<If>` e `<Each>` non accettano props con spread, e i children con spread (`{...items}`) non sono supportati: usate `<Each>` o un'espressione array.

<a id="tags-and-names"></a>

## Tag e nomi

Un elemento Rust è ciò che il codice chiama: la funzione di una primitiva, il costruttore di un componente (`badge()`, `nsh_base::button()`), o una funzione vostra. Un tag TSX nomina un binding nello scope, come di consueto: `<Badge />`, `<Theme.Provider>`, un `<Button>` vostro. Un tag che non nomina nulla nello scope è un errore di build, tranne `<If>` e `<Each>`, che sono globali.

```rust tabs
/// The app's button: a press target styled by the app.
fn primary_button(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_5()
        .py_3()
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text(title).text_base().font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

primary_button("Save", save)
```

```tsx tabs
import { Text, View } from "nsh";

function Button(props: { title: string; onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} role="button" class="rounded-lg bg-blue-600 px-5 py-3">
      <Text class="text-base font-semibold text-white">{props.title}</Text>
    </View>
  );
}

<Button title="Save" onPress={save} />
```

Il `Button` di `nsh_base` (`button()` in Rust, `<Button>` da `nsh/base`) è il target di pressione senza stile con gli stati disabled e selected e la relativa accessibilità; è l'app a dargli il suo aspetto: `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`.

In TSX, i vostri binding hanno la precedenza sui globali: un componente chiamato `Each` nello scope fa sì che `<Each>` sia quel componente. Una primitiva viene riconosciuta dal suo import, quindi `import { View as Box } from "nsh"` fa di `<Box>` una vista, e un componente vostro chiamato `Text` è semplicemente il vostro componente. Anche le primitive sono veri componenti: `const Tag = inline ? Text : View;` e poi `<Tag>…</Tag>` funziona.

I componenti sono tipizzati dalle proprie dichiarazioni: le struct di props di Rust sono verificate dal compilatore, e TypeScript verifica le props di un componente TSX ovunque venga usato, senza nulla da generare. Un componente Rust importato da un entry TSX ottiene dichiarazioni TypeScript generate dalla sua struct.

<a id="mounting-and-the-root"></a>

## Montaggio e root

La root di un'app Rust è il componente nominato da `"root"` di `nsh.json`; `nsh run` e `nsh package` lo montano. Un entry TSX chiama `mount(App)` per renderizzare il componente root (`mount(App, props)` gli passa le props). La vista root riempie la superficie (la finestra, o la vista in cui un'app incorpora NSH). Date alla root `flex: 1` in modo che riempia lo schermo, e un colore di sfondo: lo sfondo della superficie dipende dalla piattaforma.

```rust tabs
// nsh.json: { "rust": ".", "root": "App" }
#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(home())
}
```

```tsx tabs
mount(() => (
  <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
    <App />
  </View>
));
```
<a id="related"></a>

## Correlati

- [Reactivity](./reactivity.md): signals, effect, context.
- [Elements](../elements/index.md): ogni elemento host e le sue prop.
- [Styling](./styling.md) e [Tailwind](./tailwind.md): l'aspetto dei tuoi componenti.
- [Building with Rust](./rust.md): app Rust, componenti nel crate della tua app e TSX sopra.
