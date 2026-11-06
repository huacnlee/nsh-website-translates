---
title: "JSX और कंपोनेंट"
description: "NSH Rust और TSX में UI का वर्णन कैसे करता है - एलिमेंट, कंपोनेंट, प्रॉप्स, चिल्ड्रन, कंट्रोल फ़्लो, रेफ़ और स्प्रेड - और JSX कंपाइलर तथा Rust के बिल्डर एक ही नेटिव एलिमेंट कैसे बनाते हैं।"
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---

# JSX और कॉम्पोनेंट्स

NSH ऐप्स अपना UI elements और components से बयान करते हैं, Rust या TSX में। Rust में elements functions और typed builder methods (`view().gap_4().child(..)`) से बनते हैं। TSX में उन्हें JSX की तरह लिखा जाता है, जिसे NSH का compiler उसी native renderer के सीधे calls में बदल देता है, बिना React और बिना virtual DOM के। दोनों में component एक function है जो अपने हिस्से का tree बनाने के लिए एक बार चलता है। इसके बाद UI को अप-टू-डेट रखने का काम [reactivity](./reactivity.md) करती है: signals को पढ़ने वाली bindings को native स्तर पर ट्रैक किया जाता है, और केवल वही दोबारा चलती हैं।

## Elements

**Host elements** में से हर एक किसी native view पर आधारित है। Rust इन्हें prelude के functions से बनाता है। TSX इन्हें `nsh` से components के रूप में import करता है, और केवल `If` और `Each` globals हैं जिन्हें import की ज़रूरत नहीं:

| Rust | TSX | Native view | पेज |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup`: layout, styling और touches के लिए एक box | [View](../elements/view.md) |
| `text(..)` | `<Text>` | एक native text view; nested text elements spans होते हैं | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | एक image view (local assets और URLs) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | एक virtualized, recycling list | [List](../elements/list.md) |
| `canvas(..)`, `web_view(url)`, `video(url)` | `<Canvas>`, `<WebView>`, `<Video>` | एक drawing, एक web page, एक video player | [Elements](../elements/index.md) |
| `nsh_base::dialog()` | `nsh/base` से `<Dialog>` | एक presented layer | [Elements](../elements/index.md) |
| `when(..)`, `each(..)` | `<If>`, `<Each>` | Control flow, इनका अपना कोई view नहीं होता | [Control flow](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

Rust में styles typed methods हैं जिनके नाम Tailwind की utilities जैसे हैं (`.px_4()`, `.rounded_lg()`, `.bg(..)`), और listeners भी methods हैं (`.on_press(..)`); केवल किसी platform के लिए settings के अपने अलग methods हैं। TSX में props अपने camelCase नाम रखते हैं (`onPress`, `allowFontScaling`, `backgroundColor`)। हर element `style`, `class` / `classList` ([Tailwind](./tailwind.md)), `ref`, touch handlers, accessibility props और `testID` स्वीकार करता है, और केवल किसी platform के लिए props `ios={{…}}` और `android={{…}}` में जाते हैं, जहाँ से सिर्फ़ मौजूदा platform का object भेजा जाता है:

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

TSX के tags PascalCase में होते हैं ताकि TypeScript हर tag को उस binding के विरुद्ध जाँच सके जिसका वह नाम है। lowercase tag की जाँच हर नाम के लिए एक global type के विरुद्ध होती है, इसलिए `List` या `Each` जैसा generic component `each` / `of` से अपनी rows का type infer नहीं कर पाता, और ऐप के अपने components का तो कोई type ही नहीं होता। imports का run time पर कोई खर्च नहीं है: compiler primitives को उनके imports (aliases सहित) से पहचानता है और native element वहीं बना देता है, इसलिए `<View>` renderer का सीधा call है और import bundle से हट जाता है। lowercase tag एक build error है जो बताता है कि क्या लिखना है:

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> Text केवल text element के अंदर दिखाया जाता है: Rust में `text(..)`, TSX में `<Text>`। किसी `<View>` में सीधे रखी गई string कोई native view नहीं बनाती और दिखाई नहीं देती।

## Components

ऐप का रूप-रंग ऐप का अपना होता है। NSH दो layers देता है: primitives (ऊपर के elements, styles, Tailwind classes) और [`nsh/base`](../modules/nsh-base.md) (Rust में `nsh_base`) के unstyled base components, जो navigation, dialogs, keyboard, status bar और safe areas जैसे व्यवहार संभालते हैं। तीसरी layer, यानी component library, आपकी अपनी है: buttons, cards और आपके UI का हर अन्य हिस्सा ऐसे components हैं जिन्हें आप इन दो layers पर अपने ऐप के crate ([Rust के साथ निर्माण](./rust.md)) में या TSX में लिखते हैं, या community की कोई library ([तीन layers](./architecture.md#three-layers)) इस्तेमाल करते हैं।

Rust component एक `#[component] fn` है जो अपना props struct लेता है (और events होने पर उन्हें emit करने के लिए एक `Scope`) और अपने elements लौटाता है। `#[component]` इसका constructor भी बनाता है, जो function का snake case नाम होता है: `Badge` को `badge()` से रखा जाता है, जैसे `view()` किसी view को रखता है, और हर prop के लिए एक setter होता है (`.label(..)`, `.color(..)`: एक value, एक signal या एक closure)। TSX component एक function है जो props object लेता है और JSX लौटाता है:

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

function **एक बार** चलता है, जब component बनाया जाता है, और जो कुछ पढ़ता है उसे ट्रैक नहीं करता: कोई re-rendering नहीं होती। इसकी body का code (signals बनाना, effects शुरू करना, constants निकालना) एक ही बार चलता है। यह जो elements लौटाता है वे उन props और signals से जुड़े रहते हैं जिन्हें वे पढ़ते हैं, इसलिए ऊपर `Badge` अपना text तब-तब अपडेट करता है जब `unread` बदलता है, और `Badge` को दोबारा चलाने की ज़रूरत नहीं पड़ती।

`#[component]` तब लिखें जब UI के अपने props या events हों, या जब कोई TSX entry उसे import करती हो: Rust component अपने type (`registry.register::<Badge>()`) के नाम से register होता है, और उसके props struct से typed होते हैं ([Rust के साथ निर्माण](./rust.md#extending-a-rust-app-with-tsx))। केवल Rust द्वारा इस्तेमाल होने वाले UI के टुकड़े के लिए `impl IntoElement` लौटाने वाला एक सादा function काफ़ी है, जिसके arguments ही props हैं। TSX में component एक element, एक string या number, एक array, `null`, या इनमें से कुछ भी लौटाने वाला function (जिसे renderer फ़ॉलो करता है) लौटा सकता है; `nsh` का `Component<P>` type ऐसे ही किसी एक का वर्णन करता है:

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

### क्या दोबारा चलता है

element को दी गई value एक बार सेट होती है; binding उसे फ़ॉलो करती है जो वह पढ़ती है। Rust में binding एक closure है (या एक signal, एक memo, एक prop) जो वहाँ दिया जाता है जहाँ value जाती है। TSX में compiler JSX के हर expression के लिए तय करता है: कोई expression तब बदलता है जब वह **कोई function call करता है या कोई property पढ़ता है** (nested functions के बाहर), और बाकी सब एक बार सेट होता है:

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

बदलने वाला prop या child एक छोटा native effect है जो ठीक उसी एक prop को सेट करता है या उसी एक child को बदलता है। Rust में styles का diff लिया जाता है, इसलिए बदलने वाली style केवल बदली हुई properties भेजती है।

Event handlers एक बार सेट होते हैं: Rust में एक closure, TSX में एक function या एक नाम (`onPress={() => …}`, `onPress={save}`)। TSX में दूसरे expressions फ़ॉलो किए जाते हैं (`onPress={props.onPress}` prop को फ़ॉलो करता है)।

### Props

Rust component के props उसके `#[derive(Props)]` struct के fields हैं, जिनमें से हर एक `Prop<T>` है: एक value, या parent द्वारा दी गई binding। किसी binding (`text(props.title)`, `move || props.title.get()`) में पढ़ने पर वह फ़ॉलो होता है; body में `props.title.get()` उसे एक बार पढ़ता है। `#[prop(default)]` या `#[prop(default = …)]` वाले fields, और `Option`s, optional हैं। constructor हर prop को उसके default से शुरू करता है, और parent उन्हीं के setters बुलाता है जिनकी उसे ज़रूरत है: `badge().label("New")`।

बदलते expression वाला TSX prop getter के रूप में पास होता है: `props.title` पढ़ना उसे call करता है, और इसी से उसे पढ़ने वाला JSX उसे फ़ॉलो कर पाता है। static props सादी values होते हैं। दोनों में props वहीं पढ़े जाते हैं जहाँ उनका उपयोग होता है:

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

जो TSX component अपने parameter में props को अलग-अलग निकाल लेता है, `function Title({ text }: …)`, वह उन्हें वैसे ही एक बार पढ़ता है, और build इसकी चेतावनी देता है और बताता है कि इसके बजाय कौन से props पढ़ने चाहिए:

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

जो prop component को केवल एक बार चाहिए, जैसे कोई id जिससे वह शुरू होता है, उसे body में पढ़ा जाता है (`props.id.get_untracked()`, `const { id } = props;`), जो यह साफ़ बताता है।

TSX में default values पर भी यही लागू होता है: default के साथ destructure करने के बजाय JSX में `props.color ?? "#ddf4ff"` लिखें। props से कुछ निकालने के लिए closure या [`computed`](./reactivity.md#computed) इस्तेमाल करें:

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

parent किसी component में जो कुछ रखता है वह उसके children के रूप में पहुँचता है: Rust में `children: Prop<Children>` field, जिसे parent `.child(..)` से भरता है; TSX में `props.children`, एक getter जो पढ़े जाने पर वे elements बनाता है:

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

TSX में `props.children` का हर बार पढ़ना children को दोबारा बनाता है (नए native views): इसे एक बार, उसी जगह पढ़ें जहाँ children जाते हैं। कई children में से जो बदलता है (एक `<If>`, एक `<Each>`, `{cond() ? a : b}`) वह function के रूप में पहुँचता है, और `{props.children}` केवल उसी को अपडेट करता है: उसके siblings अपने views रखते हैं, और input अपना text और focus। Fragments (`<>…</>`) बिना view के elements को समूहित करते हैं।

Children को ऐसे function से भी बनाया जा सकता है जिसे component arguments के साथ call करता है, यानी render callback:

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

## Control flow

Rust में `when` और `each`, TSX में `<If>` और `<Each>`, बिल्ट-इन control flow हैं। ये अपना कोई view नहीं बनाते।

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

- **`when`** / **`<If>`** शर्त सही रहने तक अपनी branch दिखाता है, नहीं तो `otherwise` / `else` branch। यह branch को तभी दोबारा render करता है जब यह बदलता है कि शर्त सही है या नहीं, हर बार शर्त दोबारा evaluate होने पर नहीं। TSX में function child को `when` की value का accessor मिलता है, जो `null` और `undefined` के बिना typed होता है: branch दिखने के दौरान `u()` वह user है, और बदलने पर उसे फ़ॉलो करता है।
- **`each`** / **`<Each>`** हर item के लिए एक row बनाता है, जो उसके row function से बनती है। Rows key से रखी जाती हैं (Rust: key function; TSX: `key`, डिफ़ॉल्ट रूप से item स्वयं, objects identity से और primitives value से): list बदलने पर बची हुई rows दोबारा बनाई नहीं जातीं बल्कि खिसकाई जाती हैं, और नई rows केवल नई keys के लिए बनती हैं। row function को item और उसके index के **signals** मिलते हैं (Rust में `todo.get()` और `index.get()`, TSX में `todo()` और `index()`), क्योंकि बची हुई row का item और स्थान बदल सकता है। TSX में `key="index"` (या `key={(item, i) => i}`) rows को स्थान के आधार पर रखता है: जो strings की list जगह पर ही बदलती है, जैसे stream होकर आता text, वह अपनी rows रखती है और केवल उनका `item()` बदलता है।

closure में किया गया चुनाव (Rust में `dynamic(move || if busy.get() { … } else { … })`, TSX में ternary या `&&`) अपनी branch को हर बार दोबारा बनाता है जब भी वह कुछ ऐसा बदलता है जिसे वह पढ़ता है। जब branch कुछ elements से ज़्यादा की हो तो `when` / `<If>` को प्राथमिकता दें।

लंबी या अनंत lists के लिए [`List`](./lists.md) (Rust में `virtual_list`) इस्तेमाल करें: यह केवल स्क्रीन पर मौजूद rows के लिए views बनाता है और उन्हें recycle करता है। विवरण के लिए [Control flow](../elements/control-flow.md) देखें।

## Refs

ref imperative calls के लिए किसी host element को नाम देता है: `focus()`, `blur()`, `scroll_to()` / `scrollTo()`, `scroll_to_index()` / `scrollToIndex()`, `measure()` ([view कहाँ है](./touch-and-gestures.md#where-a-view-is-measure)), ... Rust में `element_ref()` एक ref बनाता है और `.element_ref(&handle)` उसे element पर रखता है; TSX में `ref` आपको element का ref देता है, जिसका type element का अपना होता है (यहाँ `InputRef`, `View` के लिए `ViewRef`; [ref methods](../elements/index.md#ref-methods) देखें):

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

Rust का ref एक `Copy` handle है; उसके calls उस element तक जाते हैं जो उसे धारण करता है, और उसका owner हट जाने पर कुछ नहीं करते। TSX में `ref={…}` जिसे नाम देता है उसे node मिलता है:

- `let` से घोषित variable को वह assign होता है;
- एक field (`ref={refs.input}`, `ref={refs[name]}`) को वह assign होता है;
- एक [signal](./reactivity.md) उस पर सेट होता है, ताकि जो signal को पढ़ता है वह उसे फ़ॉलो करे;
- एक function उसके साथ call होता है (`<Scroll ref={(node) => (scroller = node)} />`)।

`const` या import एक signal या function रखता है, जैसे `<Input ref={input} />` और `input()?.focus()` के साथ `const input = signal<InputRef>()` में; कुछ और रखने वाला element बनने के समय report किया जाता है, साथ में यह कि क्या लिखना है।

ref element के बनने पर, component के लौटने से पहले सेट होता है, इसलिए यह [effects](./reactivity.md#effect) और event handlers में उपलब्ध रहता है। Calls उससे पहले किए गए बदलावों के साथ क्रम से view तक भेजे जाते हैं। Base components और आपके अपने crate के Rust components भी `ref` स्वीकार करते हैं (Rust में `component_ref()`, जिसे `.component_ref(&r)` से element पर रखा जाता है: `dialog().component_ref(&r)`)।

<a id="spreading-props"></a>

## Props को spread करना

Rust में parent अपनी ज़रूरत के props के setters बुलाता है और बाकी अपने defaults रखते हैं, और wrapper अपने `Prop`s को जैसे हैं वैसे आगे दे देता है (`card().title(props.title)`): `Prop` उसे फ़ॉलो करता रहता है जो उसे दिया गया था।

TSX में props के object को किसी element या component पर `{...props}` से spread करें। Getters getters ही रहते हैं, इसलिए spread किए गए props वही फ़ॉलो करते रहते हैं जो वे पढ़ते हैं। कुछ props अपने लिए लेने और बाकी आगे देने के लिए `split` इस्तेमाल करें:

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

`split(props, keys)` `[picked, rest]` लौटाता है, दोनों अब भी मूल props से पढ़ते हैं (`{ label, ...rest } = props` को destructure करने से हर prop एक बार पढ़ा जाता)। JSX में बाद में आने वाले element props पहले वालों पर भारी पड़ते हैं।

`<If>` और `<Each>` spread props नहीं लेते, और spread children (`{...items}`) समर्थित नहीं हैं: `<Each>` या array expression इस्तेमाल करें।

<a id="tags-and-names"></a>

## Tags और नाम

Rust में element वह है जिसे code call करता है: किसी primitive का function, किसी component का constructor (`badge()`, `nsh_base::button()`), या आपका अपना function। TSX का tag, हमेशा की तरह, scope में मौजूद किसी binding का नाम लेता है: `<Badge />`, `<Theme.Provider>`, आपका अपना `<Button>`। scope में कुछ भी न नाम देने वाला tag build error है, सिवाय `<If>` और `<Each>` के, जो globals हैं।

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

`nsh_base` का `Button` (Rust में `button()`, `nsh/base` से `<Button>`) unstyled press target है जिसमें disabled और selected states और उनकी accessibility होती है; उसे रूप-रंग ऐप देता है: `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`।

TSX में आपकी bindings globals पर भारी पड़ती हैं: scope में `Each` नाम का component `<Each>` को वही component बना देता है। primitive की पहचान उसके import से होती है, इसलिए `import { View as Box } from "nsh"` `<Box>` को view बनाता है, और `Text` नाम का आपका अपना component बस आपका component है। Primitives असल components भी हैं: `const Tag = inline ? Text : View;` और फिर `<Tag>…</Tag>` काम करता है।

Components अपनी घोषणाओं से typed होते हैं: Rust के props structs की जाँच compiler करता है, और TypeScript TSX component के props की जाँच वहाँ करता है जहाँ भी वह इस्तेमाल हो, कुछ generate किए बिना। TSX entry जिस Rust component को import करती है, उसके struct से उसके लिए TypeScript declarations generate होते हैं।

<a id="mounting-and-the-root"></a>

## Mounting और root

Rust ऐप का root वह component है जिसका नाम `nsh.json` का `"root"` देता है; `nsh run` और `nsh package` उसे mount करते हैं। TSX entry root component को render करने के लिए `mount(App)` call करती है (`mount(App, props)` उसे props देता है)। root view surface को भर देता है (window, या वह view जिसमें ऐप NSH को embed करता है)। root को `flex: 1` दें ताकि वह स्क्रीन भरे, और एक background color भी: surface का अपना background platform पर निर्भर करता है।

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

## संबंधित

- [Reactivity](./reactivity.md): signals, effects, context।
- [Elements](../elements/index.md): हर host element और उसके props।
- [Styling](./styling.md) और [Tailwind](./tailwind.md): आपके components का रूप-रंग।
- [Building with Rust](./rust.md): Rust ऐप्स, आपके ऐप के अपने crate में components, और उनके ऊपर TSX।
