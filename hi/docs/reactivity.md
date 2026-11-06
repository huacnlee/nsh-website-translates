---
title: "रिएक्टिविटी"
description: "Rust और TSX में signals, computed values, effects, resources, batch, untracked, cleanup और context - NSH ठीक वही हिस्सा कैसे अपडेट करता है जो बदला है, और किन गलतियों से बचना चाहिए।"
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---

# Reactivity

NSH, **signals** से UI अपडेट करता है: ऐसे मान जो जानते हैं कि उन्हें कौन पढ़ता है। जब कोई signal बदलता है, तो NSH ठीक उन्हीं computations को दोबारा चलाता है जिन्होंने उसे पढ़ा था (कोई text, कोई style, कोई effect), और कुछ नहीं। Components दोबारा render नहीं होते। मॉडल Solid का है, और reactive graph खुद native है: Rust components और TSX एक ही graph पर चलते हैं, जो Rust में लिखा है, इसलिए TSX में भी scheduling, dependency tracking और cleanup सब interpreter के बाहर होता है।

Rust components इस पेज की हर चीज़ prelude से लेते हैं; TSX इसे `nsh` से import करता है:

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

## Signals

`signal(value)` एक signal बनाता है। Rust में इसे `get()` से पढ़ें, TSX में उसे call करके; `set` और `update` उसे लिखते हैं:

```rust tabs
let count = signal(0);

count.get();                    // 0, and tracks the read
count.set(5);
count.update(|n| *n += 1);      // 6
```

```tsx tabs
const count = signal(0);

count();                     // 0, and tracks the read
count.set(5);
count.update((n) => n + 1);  // 6
```

Tracking scope (binding, `computed`, `effect`) के अंदर किया गया read उस scope को signal का subscriber बना देता है। मान बदलने पर write subscribers को सूचित करता है: Rust में तुलना `PartialEq` से होती है, TSX में `===` से।

```rust tabs
fn counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Tapped {} times", count.get())))
}
```

```tsx tabs
function Counter() {
  const count = signal(0);
  return (
    <View onPress={() => count.update((n) => n + 1)}>
      <Text>Tapped {count()} times</Text>
    </View>
  );
}
```

Tap करने पर सिर्फ वही एक text node अपडेट होता है जो `count` को पढ़ता है। `counter()` / `Counter` खुद सिर्फ एक बार चलता है। Rust signal एक `Copy` handle है, इसलिए closures उसे `move` से लेते हैं और खुलकर इस्तेमाल करते हैं।

एक signal हर write को बदलाव गिन सकता है, और TSX मानों की तुलना अपने तरीके से कर सकता है:

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

TSX में, बिना मान वाला `signal<T>()` `undefined` से शुरू होता है और उसका type `Signal<T | undefined>` होता है; Rust में `Option` यही बात कहता है (`signal(None::<User>)`)।

<a id="objects-and-arrays"></a>

### Objects और arrays

Rust में `update` मान को वहीं बदलता है और readers को सूचित करता है; `set` उसे बदल देता है। TSX में signals `===` से तुलना करते हैं, इसलिए जगह पर बदला गया मान कोई बदलाव नहीं माना जाता: नया object या array लिखें।

```rust tabs
let todos = signal(Vec::<Todo>::new());

todos.update(|list| list.push(Todo { id: 3, title: "New".into(), done: false }));   // notifies
todos.update(|list| {
    if let Some(todo) = list.iter_mut().find(|t| t.id == id) {
        todo.done = true;
    }
});
```

```tsx tabs
const todos = signal<Todo[]>([]);

todos.update((list) => [...list, { id: 3, title: "New" }]);                 // notifies
todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: true } : t)));

todos().push(item);    // does not notify anyone
todos.set(todos());    // still the same array: no change
```

`each` / `<Each>` पंक्तियों को item के आधार पर key करता है, इसलिए एक item बदलने पर सिर्फ वही पंक्ति दोबारा बनती है ([JSX और components](./jsx-and-components.md#control-flow))।

## computed

`computed(fn)` दूसरे signals से कोई मान निकालता है। यह `fn` को चलाता है, नतीजा याद रखता है, और जब इसका पढ़ा हुआ कोई signal बदलता है तो इसे फिर चलाता है। इसे पढ़ना signal पढ़ने जैसा ही है:

```rust tabs
let price = signal(12);
let quantity = signal(2);
let total = computed(move || price.get() * quantity.get());

text(move || format!("Total: {}", total.get()))
```

```tsx tabs
const price = signal(12);
const quantity = signal(2);
const total = computed(() => price() * quantity());

<Text>Total: {total()}</Text>
```

`computed` तब इस्तेमाल करें जब निकाला गया मान कई जगह पढ़ा जाता हो या महँगा हो: चाहे कितने भी readers हों, यह हर बदलाव पर एक बार चलता है, और readers को तभी सूचित किया जाता है जब इसका नतीजा बदलता है। एक बार पढ़े जाने वाले सस्ते मान के लिए साधारण closure काफ़ी है:

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

TSX में `fn` को पिछला मान मिलता है (पहली बार `undefined`), ताकि जमा होने वाले मान बनाए जा सकें:

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` `fn` को चलाता है, और जब भी इसका पढ़ा हुआ कोई signal बदलता है तो फिर चलाता है। Effects side effects के लिए हैं: logging, timers, network requests, [refs](./jsx-and-components.md#refs) पर imperative calls।

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// What to search for.
    pub query: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let results = signal(Vec::<SharedString>::new());
    effect(move || {
        let q = props.query.get();          // tracked: runs again when the prop changes
        if q.is_empty() {
            return;
        }
        spawn(async move {
            if let Ok(response) = fetch(format!("https://api.example.com/search?q={q}")).await {
                results.set(response.text().lines().map(|line| SharedString::from(line.to_owned())).collect());
            }
        });
    });
    view().child(each(results, |item| item.clone(), |item, _| text(item)))
}
```

```tsx tabs
function Search(props: { query: string }) {
  const results = signal<string[]>([]);
  effect(() => {
    const q = props.query;          // tracked: runs again when the prop changes
    if (!q) return;
    fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => results.set(data.items));
  });
  return <Each of={results()}>{(item) => <Text>{item()}</Text>}</Each>;
}
```

Effect उन्हीं reads को track करता है जो वह synchronous रूप से चलते समय करता है। किसी task में, `.then` callback में या `await` के बाद किए गए reads track नहीं होते।

जो effect किसी [ref](./jsx-and-components.md#refs) को call करता है, वह उसी element पर काम करता है जिस पर ref लगा है; TSX में effects उसी pass में बने elements के मौजूद होने के बाद चलते हैं, इसलिए refs सेट होते हैं:

```rust tabs
let input = element_ref();
effect(move || {
    if editing.get() {
        input.focus();
    }
});
```

```tsx tabs
let input: InputRef | undefined;
effect(() => {
  if (editing()) input?.focus();
});
```

> [!TIP]
> एक signal को दूसरे के साथ sync रखने के लिए effects का इस्तेमाल न करें (`effect(() => b.set(a() * 2))`)। `computed` इस्तेमाल करें: यह कभी पुराना नहीं होता और दूसरा pass नहीं चलवाता। जो effect किसी signal को लिखता भी है और पढ़ता भी है, वह बार-बार खुद को चलाता रहता है जब तक NSH उसे error के साथ रोक नहीं देता।

## resource

`resource(source, fetcher)` किसी मान को asynchronous रूप से load करता है और यह भी याद रखता है कि load किस स्थिति में है, ताकि component बिना खुद सब संभाले data, spinner या error दिखा सके:

```rust tabs
let url = signal(SharedString::from("https://api.example.com/quote"));
let quote = resource(move || Some(url.get()), |url, _info| async move {
    let response = fetch(url.to_string()).await?;
    if !response.ok() {
        return Err(format!("HTTP {}", response.status()));
    }
    Ok(response.text())
});

view()
    .child(text(move || match (quote.get(), quote.error()) {
        (_, Some(error)) => format!("Failed: {error}"),
        (Some(quote), None) => quote,
        (None, None) => "Loading…".to_owned(),
    }))
    .child(text("Reload").on_press(move || quote.refetch()))
```

```tsx tabs
import { List, resource, signal, Text } from "nsh";

type Post = { id: number; title: string };

const url = signal("https://jsonplaceholder.typicode.com/posts?_limit=20");
const posts = resource(url, async (u, { signal }) => {
  const response = await fetch(u, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Post[];
});

<If when={posts.error()}>
  <Text>Failed: {String(posts.error())}</Text>
</If>
<List
  each={posts() ?? []}
  refreshing={posts.state() === "refreshing"}
  onRefresh={posts.refetch}
>
  {(post) => <Text>{post().title}</Text>}
</List>
```

`source` tracked है: जब भी वह नया मान देता है, `fetcher(value, info)` फिर से load करता है। Rust में यह एक closure है जो `Option` लौटाता है, और `None` कुछ load नहीं करता; TSX में यह एक accessor (signal, function) या मान है, और `undefined`, `null` या `false` कुछ load नहीं करते: ऐसे user के लिए जो अभी sign in नहीं है या जब कुछ चुना नहीं गया। source न होने पर Rust `|| Some(())` पास करता है, और TSX का `resource(fetcher)` एक बार load करता है, `fetcher(info)` को call करके। Rust का fetcher `Result` लौटाता है; TSX का fetcher मान या promise लौटाता है, और throw करना विफलता है।

| Rust | TSX | यह क्या है |
|---|---|---|
| `quote.get()` | `posts()` | सबसे नया मान: पहला load खत्म होने से पहले कोई नहीं, दोबारा load होते समय और विफलता के बाद भी बना रहता है। |
| `quote.loading()` | `posts.loading()` | क्या कोई load चल रहा है। |
| `quote.error()` | `posts.error()` | आखिरी load की error, जब कोई load मान दे दे तो कोई नहीं। |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"` (load करने को कुछ नहीं), `Pending` (पहला load), `Ready`, `Refreshing` (दोबारा load हो रहा है, मान बना हुआ है), `Errored`। |
| `quote.refetch()` | `posts.refetch()` | उसी source से फिर load करता है: retry, pull to refresh। |
| `quote.mutate(value)` | `posts.mutate(value)` | बिना load किए यहीं मान सेट करता है, यानी optimistic update, और error साफ़ कर देता है। |

Rust का resource signals की तरह एक `Copy` handle है; TSX के members bound हैं, इसलिए `onRefresh={posts.refetch}` और `const loading = posts.loading` जैसे हैं वैसे काम करते हैं।

सिर्फ सबसे नया load गिना जाता है। नया load चल रहे load को छोड़ देता है, और component के हटने पर भी यही होता है; TSX में `info.signal` को दिए गए `fetch` को abort कर देता है। जो load अपने superseded होने के बाद खत्म होता है, वह कुछ नहीं बदलता। `info.refetching` बताता है कि load `refetch()` ने शुरू किया था। Rust में `resource_with_value(value, source, fetcher)` और TSX में `{ initialValue }` resource को शुरू से ही एक मान देते हैं।

## cleanup

`cleanup(fn)` `fn` को register करता है, जो मौजूदा effect के दोबारा चलने से पहले, या जिस component या effect का वह हिस्सा है उसके हटने पर चलता है:

```rust tabs
effect(move || {
    if !running.get() {
        return;
    }
    let ticker = spawn(async move {
        loop {
            timer(Duration::from_millis(100)).await;
            tick();
        }
    });
    cleanup(move || ticker.cancel());   // before the next run, or on removal
});
```

```tsx tabs
function Clock() {
  const now = signal(Date.now());
  const id = setInterval(() => now.set(Date.now()), 1000);
  cleanup(() => clearInterval(id));       // when Clock is removed
  return <Text>{new Date(now()).toLocaleTimeString()}</Text>;
}

effect(() => {
  if (!running()) return;
  const id = setInterval(tick, 100);
  cleanup(() => clearInterval(id));       // before the next run, or on removal
});
```

Rust में tasks, timers और intervals (`spawn`, `set_timeout`, `set_interval`) अपने बनाने वाले owner के साथ अपने आप खत्म हो जाते हैं, इसलिए view की अपनी clock को cleanup की ज़रूरत नहीं:

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

TSX effect अपना cleanup return भी कर सकता है, React की तरह: `fn` जो function लौटाता है, वह उन्हीं मौकों पर चलता है जिन पर `cleanup` को दिया गया function चलता।

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

Component तब हट जाता है जब वह render नहीं होता: उसकी `when` / `<If>` branch छिप जाती है, उसकी `each` / `<Each>` पंक्ति हटा दी जाती है, या उसका page pop हो जाता है। उसने जो कुछ भी बनाया था (effects, computed values, tasks, cleanups, nested components), वह सब उसके साथ dispose हो जाता है।

## batch

हर write अपने subscribers को तुरंत सूचित करता है। कई writes को एक बदलाव गिनाने के लिए उन्हें `batch` में लपेटें: dependants आखिरी write के बाद सिर्फ एक बार चलते हैं।

```rust tabs
let save = move || {
    batch(|| {
        first_name.set(form.first.clone());
        last_name.set(form.last.clone());
        dirty.set(false);
    })
};
```

```tsx tabs
const save = () =>
  batch(() => {
    firstName.set(form.first);
    lastName.set(form.last);
    dirty.set(false);
  });
```

Event handlers अपने आप batch नहीं होते: press handler में दो writes उस effect को दो बार चलाते हैं जो दोनों signals को पढ़ता है। `batch` वही लौटाता है जो उसका function लौटाता है।

## untracked

`untracked(fn)` `fn` को इस तरह चलाता है कि वह जो पढ़ता है उसका subscribe नहीं होता। इसे tracking scope में तब इस्तेमाल करें जब किसी मान को पढ़ना हो लेकिन उस पर निर्भर नहीं होना हो:

```rust tabs
effect(move || {
    let q = query.get();                          // runs again when query changes
    let filters = untracked(|| active_filters.get());   // read, but not a reason to run again
    search(q, filters);
});
```

```tsx tabs
effect(() => {
  const q = query();                     // runs again when query changes
  const filters = untracked(activeFilters); // read, but not a reason to run again
  search(q, filters);
});
```

Rust का `get_untracked()` एक signal को इसी तरह पढ़ता है। Component body पहले से untracked है: वहाँ signal पढ़ने पर वह एक बार ही पढ़ा जाता है।

## context

Context वह मान है जो कोई component अपने render किए हर हिस्से को देता है, चाहे वह कितना भी गहरा हो। Rust में `provide_context(value)` अपने type का मान provide करता है, और `use_context::<T>()` सबसे नज़दीकी मान खोजता है; TSX में `context(defaultValue)` एक context बनाता है, उसे call करने पर सबसे नज़दीकी provided मान (या default) पढ़ा जाता है, और `<Ctx.Provider value>` एक मान provide करता है:

```rust tabs
#[derive(Clone, Copy)]
struct Dark(bool);

fn label(content: &'static str) -> impl IntoElement {
    let dark = use_context::<Dark>().is_some_and(|d| d.0);
    text(content).text_color(if dark { rgb(0xffffff) } else { rgb(0x1f2328) })
}

fn screen() -> impl IntoElement {
    provide_context(Dark(true));
    view().child(label("Hello"))
}
```

```tsx tabs
const Theme = context<"light" | "dark">("light");

function Label(props: { children: string }) {
  const theme = Theme();
  return <Text style={{ color: theme === "dark" ? "#ffffff" : "#1f2328" }}>{props.children}</Text>;
}

mount(() => (
  <Theme.Provider value="dark">
    <Label>Hello</Label>
  </Theme.Provider>
));
```

Provided मान एक बार पढ़ा जाता है, जब उसे खोजा जाता है। जो चीज़ बदलती है उसे provide करने के लिए, एक signal (या signals का struct) provide करें और उसे binding में पढ़ें:

```rust tabs
#[derive(Clone, Copy)]
struct Accent(Signal<Hsla>);

#[component]
fn App() -> impl IntoElement {
    provide_context(Accent(signal(rgb(0x0969da).into())));
    view().child(swatch())
}

fn swatch() -> impl IntoElement {
    let Accent(accent) = use_context::<Accent>().expect("an accent");
    view()
        .w(px(40.0))
        .h(px(40.0))
        .bg(move || accent.get())
        .on_press(move || accent.set(rgb(0x8250df).into()))
}
```

```tsx tabs
const Accent = context(signal("#0969da"));

function App() {
  const accent = signal("#0969da");
  return (
    <Accent.Provider value={accent}>
      <Swatch />
    </Accent.Provider>
  );
}

function Swatch() {
  const accent = Accent();
  return <View onPress={() => accent.set("#8250df")} style={{ width: 40, height: 40, backgroundColor: accent() }} />;
}
```

Context को component body में (या ऐसे code में जो components बनते समय चलता है) पढ़ें, event handler या timer में नहीं, जहाँ उसे खोजने के लिए कोई component नहीं होता। Rust components app का theme भी इसी तरह लेते हैं: `nsh_base` से `theme()` ([Theme](./rust.md#theme))।

## Error boundaries

Error boundary किसी view के एक हिस्से की विफलता को उसी हिस्से तक सीमित रखती है। जब उसके नीचे कुछ render होते या चलते समय throw करता है (Rust में: panic), जैसे component की body, कोई binding, कोई effect या कोई event handler, तो विफल हिस्सा हटा दिया जाता है और boundary उसकी जगह अपना fallback दिखाती है; view का बाकी हिस्सा जैसा है वैसा रहता है। Rust में यह `catch_error(view, fallback)` है; TSX में `nsh` से `<ErrorBoundary fallback>`। Fallback को error मिलता है (TSX में throw किया गया मान ही, आम तौर पर `Error`) और एक reset मिलता है जो view को दोबारा render करता है:

```rust tabs
fn profile_card(user: Signal<Option<User>>) -> impl IntoElement {
    catch_error(
        move || profile(user),
        |error, reset| {
            view()
                .child(text(format!("Something went wrong: {error}")))
                .child(text("Try again").on_press(move || reset.reset()))
        },
    )
}
```

```tsx tabs
import { ErrorBoundary, Text, View } from "nsh";

function ProfileCard(props: { user: User | undefined }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>Something went wrong: {error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Profile user={props.user} />
    </ErrorBoundary>
  );
}
```

विफलता उस जगह के ऊपर की सबसे नज़दीकी boundary के पास जाती है, और fallback में हुई विफलता उससे ऊपर की boundary के पास। बिना boundary के विफलता uncaught error की तरह रिपोर्ट होती है (development error overlay, log)। TSX में `fallback` element जैसा है वैसा दिखाया जाता है (`fallback={<Text>Unavailable</Text>}`), और function को error और `reset` के साथ call किया जाता है, चाहे वह कोई भी parameters declare करे।

<a id="what-runs-and-when"></a>

## क्या चलता है, और कब

| आप क्या लिखते हैं | कब चलता है | कब दोबारा चलता है |
|---|---|---|
| Component body | एक बार, बनते समय | कभी नहीं (hot reload को छोड़कर) |
| Binding: Rust में `text`, style या prop को दिया गया closure; TSX में `{expr}` या `prop={expr}` जो call या property read करता है | एक बार, element बनते समय | जब उसका पढ़ा हुआ कोई signal बदलता है; सिर्फ वही prop या child अपडेट होता है |
| `computed(fn)` | बनते समय | जब उसका पढ़ा हुआ कोई signal बदलता है |
| `effect(fn)` | मौजूदा pass के elements बन जाने के बाद | जब उसका पढ़ा हुआ कोई signal बदलता है |
| `when(cond, ..)` / `<If when>` | बनते समय | जब condition का सही या गलत होना बदलता है |
| `each(..)` / `<Each of>` पंक्ति | जब उसकी key पहली बार दिखती है | कभी नहीं; इसके बजाय उसके item और index signals बदलते हैं |

Environment भी इसी तरह reactive है: Rust में `window()`, `dark()`, `font_scale()`, `safe_area()` और `keyboard_height()`, TSX में [`nsh`](../modules/nsh.md#device) से `windowSize()`, `colorScheme()` और `fontScale()` तथा [`nsh`](../modules/nsh.md) से `safeArea()` और `keyboardFrame()`, इसलिए इन्हें पढ़ने वाली bindings rotation, dark mode या keyboard के साथ बदलती हैं।

<a id="common-mistakes"></a>

## आम गलतियाँ

**Component body में signal पढ़ना और अपडेट की उम्मीद करना।**

```rust tabs
fn bad() -> impl IntoElement {
    let n = count.get();                       // read once
    text(format!("{n}"))                       // never changes
}

fn good() -> impl IntoElement {
    text(move || format!("{}", count.get()))   // a binding: follows count
}
```

```tsx tabs
function Bad() {
  const n = count();           // read once
  return <Text>{n}</Text>;     // never changes
}

function Good() {
  return <Text>{count()}</Text>;
}
```

**Props को एक बार पढ़ना।** Body में `props.title.get()` से पढ़ा गया Rust prop एक बार पढ़ा जाता है; उसे binding में पढ़ें (`text(props.title)`, `move || props.title.get()`)। TSX में `const { title } = props`, `title` को एक बार पढ़ता है: `props.title` को वहीं पढ़ें जहाँ उसका इस्तेमाल करना है, या props को [`split`](./jsx-and-components.md#spreading-props) से बाँटें।

**TSX में set करने की जगह mutate करना।** `list().push(x)` array को बदल देता है पर किसी को सूचित नहीं करता। नया array लिखें, जैसा Rust का `update` आपके लिए करता है।

**Effects से state निकालना।** `effect(() => total.set(price() * qty()))` काम तो करता है, पर write और effect के बीच `total` पुराना रह जाता है, और एक अतिरिक्त pass लगता है। `computed` इस्तेमाल करें।

**Components के बाहर effects बनाना।** Effects और computed values उसी component के होते हैं जिसने उन्हें बनाया और उसी के साथ dispose होते हैं। Event handler या timer callback में बनाए जाने पर उनका कोई owner नहीं होता और वे हमेशा चलते रहते हैं। उन्हें component body में बनाएँ और उन्हें वे signals पढ़ने दें जो बदलते हैं।

**Asynchronous code के track होने की उम्मीद करना।** सिर्फ वही reads track होते हैं जो effect या computed value के चलते समय synchronous रूप से किए जाते हैं। पहले signals पढ़ें, फिर asynchronous काम शुरू करें।

<a id="related"></a>

## संबंधित

- [JSX और components](./jsx-and-components.md): Rust और TSX में components, props, `when` / `<If>` और `each` / `<Each>`।
- [Building with Rust](./rust.md): Rust apps, tasks और theme।
- [`nsh` module reference](../modules/nsh.md): TSX के हर function का signature।
- [Animation](./animation.md): animated values जो signals के बिना UI thread पर animate होते हैं।
