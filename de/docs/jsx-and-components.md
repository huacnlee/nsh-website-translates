---
title: "JSX und Komponenten"
description: "Wie NSH UI in Rust und in TSX beschreibt – Elemente, Komponenten, Props, Children, Kontrollfluss, Refs und Spreads – und wie der JSX-Compiler und die Builder von Rust dieselben nativen Elemente erzeugen."
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---


# JSX und Komponenten

NSH-Apps beschreiben ihre UI mit Elementen und Komponenten, in Rust oder in TSX. Rust baut Elemente mit Funktionen und typisierten Builder-Methoden (`view().gap_4().child(..)`). TSX schreibt sie als JSX, das der NSH-Compiler in direkte Aufrufe desselben nativen Renderers übersetzt, ohne React und ohne Virtual DOM. In beiden Fällen ist eine Komponente eine Funktion, die einmal läuft, um ihren Teil des Baums aufzubauen. Danach hält die [Reaktivität](./reactivity.md) die UI aktuell: Die Bindings, die Signals lesen, werden nativ verfolgt, und nur sie laufen erneut.

<a id="elements"></a>

## Elemente

Die **Host-Elemente** werden jeweils von einer nativen View getragen. Rust erzeugt sie mit den Funktionen des Prelude. TSX importiert sie als Komponenten aus `nsh`, und nur `If` und `Each` sind Globals, die keinen Import brauchen:

| Rust | TSX | Native View | Seite |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`: eine Box für Layout, Styling und Touch-Eingaben | [View](../elements/view.md) |
| `text(..)` | `<Text>` | Eine native Text-View; verschachtelte Text-Elemente sind Spans | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | Eine Image-View (lokale Assets und URLs) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | Eine virtualisierte Liste mit Recycling | [List](../elements/list.md) |
| `canvas(..)`, `web_view(url)`, `video(url)` | `<Canvas>`, `<WebView>`, `<Video>` | Eine Zeichnung, eine Webseite, ein Videoplayer | [Elements](../elements/index.md) |
| `nsh_base::dialog()` | `<Dialog>` aus `nsh/base` | Eine eingeblendete Ebene | [Elements](../elements/index.md) |
| `when(..)`, `each(..)` | `<If>`, `<Each>` | Kontrollfluss, keine eigene View | [Kontrollfluss](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

In Rust sind Styles typisierte Methoden, die wie die Utilities von Tailwind heißen (`.px_4()`, `.rounded_lg()`, `.bg(..)`), und auch Listener sind Methoden (`.on_press(..)`). Einstellungen, die nur für eine Plattform gelten, haben eigene Methoden. In TSX behalten die Props ihre camelCase-Namen (`onPress`, `allowFontScaling`, `backgroundColor`). Jedes Element akzeptiert `style`, `class` / `classList` ([Tailwind](./tailwind.md)), `ref`, Touch-Handler, Accessibility-Props und `testID`. Props, die nur für eine Plattform gelten, kommen in `ios={{…}}` und `android={{…}}`, wobei nur das Objekt der aktuellen Plattform gesendet wird:

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

TSX-Tags sind in PascalCase geschrieben, damit TypeScript jeden von ihnen gegen das Binding prüft, das er benennt. Ein Tag in Kleinschreibung wird gegen einen globalen Typ pro Name geprüft. Dadurch könnte eine generische Komponente wie `List` oder `Each` den Typ ihrer Zeilen nicht aus `each` / `of` ableiten, und die eigenen Komponenten einer App wären gar nicht typisiert. Die Imports kosten zur Laufzeit nichts: Der Compiler erkennt die Primitive an ihren Imports (auch bei Aliassen) und erzeugt das native Element an Ort und Stelle. `<View>` ist also ein direkter Aufruf des Renderers, und der Import wird aus dem Bundle entfernt. Ein Tag in Kleinschreibung ist ein Build-Fehler, der angibt, was stattdessen zu schreiben ist:

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> Text wird nur innerhalb eines Text-Elements angezeigt: `text(..)` in Rust, `<Text>` in TSX. Ein String direkt in einem `<View>` erzeugt keine native View und wird nicht angezeigt.

<a id="components"></a>

## Komponenten

Das Aussehen einer App gehört der App selbst. NSH stellt zwei Schichten bereit: die Primitive (die Elemente oben, Styles, Tailwind-Klassen) und die ungestylten Basiskomponenten von [`nsh/base`](../modules/nsh-base.md) (`nsh_base` in Rust), die Verhalten wie Navigation, Dialoge, die Tastatur, die Statusleiste und Safe Areas übernehmen. Die dritte Schicht, die Komponentenbibliothek, gehört Ihnen: Buttons, Cards und jedes andere Teil Ihrer UI sind Komponenten, die Sie auf diesen beiden Schichten schreiben, im Crate Ihrer App ([Building with Rust](./rust.md)) oder in TSX, oder eine Bibliothek aus der Community ([Three layers](./architecture.md#three-layers)).

Eine Rust-Komponente ist ein `#[component] fn`, das seine Props-Struct entgegennimmt (und, wenn es Events hat, einen `Scope`, um sie auszulösen) und seine Elemente zurückgibt. `#[component]` erzeugt außerdem ihren Konstruktor, den Funktionsnamen in Snake Case: `Badge` wird mit `badge()` platziert, so wie `view()` eine View platziert, mit einem Setter pro Prop (`.label(..)`, `.color(..)`: ein Wert, ein Signal oder ein Closure). Eine TSX-Komponente ist eine Funktion, die ein Props-Objekt entgegennimmt und JSX zurückgibt:

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

Die Funktion läuft **einmal**, wenn die Komponente erstellt wird, und verfolgt nicht, was sie liest: Es gibt kein Re-Rendering. Code in ihrem Body (Signals erstellen, Effects starten, Konstanten berechnen) läuft genau einmal. Die Elemente, die sie zurückgibt, bleiben mit den Props und Signals verbunden, die sie lesen. So aktualisiert `Badge` oben seinen Text, wann immer sich `unread` ändert, ohne dass `Badge` erneut läuft.

Schreiben Sie ein `#[component]`, wenn die UI eigene Props oder Events hat oder wenn ein TSX-Entry es importiert: Eine Rust-Komponente wird unter ihrem Typ registriert (`registry.register::<Badge>()`), mit Props, die aus der Struct typisiert werden ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx)). Für ein Stück UI, das nur Rust verwendet, genügt eine einfache Funktion, die `impl IntoElement` zurückgibt, wobei ihre Argumente die Props sind. In TSX darf eine Komponente ein Element, einen String oder eine Zahl, ein Array, `null` oder eine Funktion zurückgeben, die eines davon zurückgibt (der der Renderer folgt). Der Typ `Component<P>` aus `nsh` beschreibt so einen Wert:

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

### Was erneut ausgeführt wird

Ein Wert, den man einem Element gibt, wird einmal gesetzt, ein Binding hingegen folgt dem, was es liest. In Rust ist ein Binding ein Closure (oder ein Signal, ein Memo, ein Prop), das dort übergeben wird, wo ein Wert hingehört. In TSX entscheidet der Compiler für jeden Ausdruck im JSX: Ein Ausdruck ändert sich, wenn er **eine Funktion aufruft oder eine Property liest** (außerhalb verschachtelter Funktionen), und alles andere wird einmal gesetzt:

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

Ein sich ändernder Prop oder ein sich änderndes Child ist ein kleiner nativer Effect, der genau diesen einen Prop setzt oder genau dieses eine Child ersetzt. Styles werden in Rust per Diff verglichen, sodass ein Style, der sich ändert, nur die geänderten Properties sendet.

Event-Handler werden einmal gesetzt: ein Closure in Rust, eine Funktion oder ein Name in TSX (`onPress={() => …}`, `onPress={save}`). In TSX werden andere Ausdrücke verfolgt (`onPress={props.onPress}` folgt dem Prop).

### Props

Die Props einer Rust-Komponente sind die Felder ihrer `#[derive(Props)]`-Struct, jedes ein `Prop<T>`: ein Wert oder ein Binding, das der Parent übergeben hat. Wer einen Prop in einem Binding liest (`text(props.title)`, `move || props.title.get()`), folgt ihm; `props.title.get()` im Body liest ihn einmal. Felder mit `#[prop(default)]` oder `#[prop(default = …)]` sowie `Option`s sind optional. Der Konstruktor setzt jeden Prop auf seinen Default, und ein Parent ruft die Setter der Props auf, die er braucht: `badge().label("New")`.

Ein TSX-Prop, dem ein sich ändernder Ausdruck übergeben wird, wird als Getter weitergereicht: Das Lesen von `props.title` ruft ihn auf, und genau dadurch kann das JSX, das ihn liest, ihm folgen. Statische Props sind einfache Werte. In beiden Fällen werden Props dort gelesen, wo sie verwendet werden:

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

Eine TSX-Komponente, die ihre Props bereits im Parameter zerlegt, `function Title({ text }: …)`, liest sie ebenso einmalig, und der Build warnt davor und nennt die Props, die stattdessen zu lesen sind:

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

Ein Prop, den die Komponente nur einmal braucht, etwa eine ID, mit der sie startet, wird im Body gelesen (`props.id.get_untracked()`, `const { id } = props;`), was das ausdrücklich zeigt.

In TSX gilt dasselbe für Default-Werte: Schreiben Sie `props.color ?? "#ddf4ff"` im JSX, anstatt mit einem Default zu destrukturieren. Um etwas aus Props zu berechnen, verwenden Sie ein Closure oder [`computed`](./reactivity.md#computed):

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

Was ein Parent in eine Komponente setzt, kommt als deren Children an: in Rust als `children: Prop<Children>`-Feld, das der Parent mit `.child(..)` füllt; in TSX als `props.children`, ein Getter, der diese Elemente beim Lesen aufbaut:

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

In TSX baut jedes Lesen von `props.children` die Children erneut auf (neue native Views): Lesen Sie es einmal, an der Stelle, an der die Children hingehören. Unter mehreren Children kommt eines, das sich ändert (ein `<If>`, ein `<Each>`, `{cond() ? a : b}`), als Funktion an, und `{props.children}` aktualisiert nur dieses eine: Seine Geschwister behalten ihre Views, ein Input behält seinen Text und seinen Fokus. Fragmente (`<>…</>`) gruppieren Elemente ohne eine View.

Children können auch von einer Funktion erzeugt werden, die die Komponente mit Argumenten aufruft, einem Render-Callback:

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

## Kontrollfluss

`when` und `each` in Rust, `<If>` und `<Each>` in TSX, sind eingebauter Kontrollfluss. Sie rendern keine eigene View.

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

- **`when`** / **`<If>`** zeigt seinen Zweig, solange die Bedingung gilt, sonst den `otherwise`- / `else`-Zweig. Ein Zweig wird nur dann erneut gerendert, wenn sich ändert, ob die Bedingung gilt, nicht bei jeder erneuten Auswertung der Bedingung. In TSX erhält ein Funktions-Child einen Accessor auf den Wert von `when`, typisiert ohne `null` und `undefined`: `u()` ist der User, solange der Zweig angezeigt wird, und folgt ihm, wenn er sich ändert.
- **`each`** / **`<Each>`** rendert pro Item eine Zeile, die von der Zeilenfunktion erzeugt wird. Zeilen werden über einen Key beibehalten (Rust: die Key-Funktion; TSX: `key`, standardmäßig das Item selbst, Objekte per Identität und Primitive per Wert): Wenn sich die Liste ändert, werden beibehaltene Zeilen verschoben statt neu aufgebaut, und neue Zeilen werden nur für neue Keys erzeugt. Die Zeilenfunktion erhält **Signals** für das Item und seinen Index (`todo.get()` und `index.get()` in Rust, `todo()` und `index()` in TSX), weil sich Item und Position einer beibehaltenen Zeile ändern können. In TSX behält `key="index"` (oder `key={(item, i) => i}`) die Zeilen stattdessen nach Position: Eine Liste von Strings, die sich an Ort und Stelle ändert, etwa gestreamter Text, behält ihre Zeilen, und nur deren `item()` ändert sich.

Eine Auswahl, die in einem Closure getroffen wird (`dynamic(move || if busy.get() { … } else { … })` in Rust, ein ternärer Ausdruck oder `&&` in TSX), baut ihren Zweig jedes Mal neu auf, wenn sich irgendetwas ändert, was sie liest. Bevorzugen Sie `when` / `<If>`, wenn ein Zweig aus mehr als ein paar Elementen besteht.

Für lange oder unendliche Listen verwenden Sie [`List`](./lists.md) (`virtual_list` in Rust): Es erzeugt Views nur für die Zeilen auf dem Bildschirm und recycelt sie. Details finden Sie unter [Kontrollfluss](../elements/control-flow.md).

## Refs

Ein Ref benennt ein Host-Element für imperative Aufrufe: `focus()`, `blur()`, `scroll_to()` / `scrollTo()`, `scroll_to_index()` / `scrollToIndex()`, `measure()` ([wo sich eine View befindet](./touch-and-gestures.md#where-a-view-is-measure)), ... In Rust erzeugt `element_ref()` einen Ref und `.element_ref(&handle)` setzt ihn auf ein Element. In TSX liefert `ref` den Ref des Elements, dessen Typ der des Elements selbst ist (hier `InputRef`, `ViewRef` für ein `View`; siehe [Ref-Methoden](../elements/index.md#ref-methods)):

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

Ein Rust-Ref ist ein `Copy`-Handle. Seine Aufrufe gehen an das Element, das ihn trägt, und tun nichts mehr, sobald sein Owner weg ist. In TSX erhält das, was `ref={…}` benennt, den Node:

- eine mit `let` deklarierte Variable wird ihm zugewiesen;
- ein Feld (`ref={refs.input}`, `ref={refs[name]}`) wird ihm zugewiesen;
- ein [Signal](./reactivity.md) wird darauf gesetzt, sodass das, was das Signal liest, ihm folgt;
- eine Funktion wird mit ihm aufgerufen (`<Scroll ref={(node) => (scroller = node)} />`).

Ein `const` oder ein Import enthält ein Signal oder eine Funktion, wie in `const input = signal<InputRef>()` mit `<Input ref={input} />` und `input()?.focus()`. Alles andere wird beim Erzeugen des Elements gemeldet, zusammen mit dem, was stattdessen zu schreiben ist.

Der Ref wird beim Erzeugen des Elements gesetzt, bevor die Komponente zurückkehrt, sodass er in [Effects](./reactivity.md#effect) und Event-Handlern verfügbar ist. Aufrufe werden in der Reihenfolge, zusammen mit den Änderungen, die vor ihnen vorgenommen wurden, an die View gesendet. Die Basiskomponenten und die Rust-Komponenten Ihres eigenen Crates akzeptieren ebenfalls `ref` (in Rust `component_ref()`, mit `.component_ref(&r)` auf das Element gesetzt: `dialog().component_ref(&r)`).

<a id="spreading-props"></a>

## Props weitergeben (Spread)

In Rust ruft ein Parent die Setter der Props auf, die er braucht, und die übrigen behalten ihre Defaults. Ein Wrapper reicht seine eigenen `Prop`s unverändert weiter (`card().title(props.title)`): Ein `Prop` folgt weiterhin dem, was ihm übergeben wurde.

In TSX verteilen Sie ein Objekt mit Props per `{...props}` auf ein Element oder eine Komponente. Getter bleiben Getter, sodass gespreadete Props weiterhin dem folgen, was sie lesen. Um einige Props für sich zu behalten und den Rest weiterzureichen, verwenden Sie `split`:

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

`split(props, keys)` gibt `[picked, rest]` zurück, die beide weiterhin an die ursprünglichen Props durchlesen (das Destrukturieren von `{ label, ...rest } = props` würde jeden Prop einmal lesen). Element-Props, die im JSX später stehen, haben Vorrang vor früheren.

`<If>` und `<Each>` nehmen keine gespreadeten Props entgegen, und gespreadete Children (`{...items}`) werden nicht unterstützt: Verwenden Sie `<Each>` oder einen Array-Ausdruck.

<a id="tags-and-names"></a>

## Tags und Namen

Ein Rust-Element ist alles, was der Code aufruft: die Funktion eines Primitivs, der Konstruktor einer Komponente (`badge()`, `nsh_base::button()`) oder eine eigene Funktion. Ein TSX-Tag benennt wie üblich ein Binding im Scope: `<Badge />`, `<Theme.Provider>`, ein eigenes `<Button>`. Ein Tag, der nichts im Scope benennt, ist ein Build-Fehler, außer `<If>` und `<Each>`, die Globals sind.

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

`nsh_base`s `Button` (`button()` in Rust, `<Button>` aus `nsh/base`) ist das ungestylte Press-Target mit den Zuständen disabled und selected samt ihrer Accessibility. Das Aussehen gibt ihm die App: `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`.

In TSX haben Ihre Bindings Vorrang vor den Globals: Eine Komponente namens `Each` im Scope macht aus `<Each>` diese Komponente. Ein Primitiv wird an seinem Import erkannt, sodass `import { View as Box } from "nsh"` aus `<Box>` eine View macht, und eine eigene Komponente namens `Text` ist einfach Ihre Komponente. Die Primitive sind ebenfalls echte Komponenten: `const Tag = inline ? Text : View;` und danach funktioniert `<Tag>…</Tag>`.

Komponenten werden über ihre eigenen Deklarationen typisiert: Die Props-Structs von Rust werden vom Compiler geprüft, und TypeScript prüft die Props einer TSX-Komponente überall dort, wo sie verwendet wird, ohne dass etwas generiert werden muss. Für eine Rust-Komponente, die ein TSX-Entry importiert, werden TypeScript-Deklarationen aus ihrer Struct generiert.

<a id="mounting-and-the-root"></a>

## Einbinden und die Root

Die Root einer Rust-App ist die Komponente, die `nsh.json`s `"root"` benennt; `nsh run` und `nsh package` binden sie ein. Ein TSX-Entry ruft `mount(App)` auf, um die Root-Komponente zu rendern (`mount(App, props)` übergibt ihr Props). Die Root-View füllt die Surface (das Fenster oder die View, in die eine App NSH einbettet). Geben Sie der Root `flex: 1`, damit sie den Bildschirm füllt, und eine Hintergrundfarbe: Der eigene Hintergrund der Surface hängt von der Plattform ab.

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

## Verwandte Themen

- [Reactivity](./reactivity.md): Signals, Effects, Context.
- [Elements](../elements/index.md): jedes Host-Element und seine Props.
- [Styling](./styling.md) und [Tailwind](./tailwind.md): das Erscheinungsbild deiner Komponenten.
- [Building with Rust](./rust.md): Rust-Apps, Komponenten im eigenen Crate deiner App und TSX obendrauf.
