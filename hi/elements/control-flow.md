---
title: "If / Each"
description: "कंट्रोल फ़्लो: If किसी शर्त के आधार पर एक ब्रांच रेंडर करता है, Each किसी सूची के हर आइटम के लिए एक keyed रो रेंडर करता है, Rust और TSX दोनों में।"
order: 140
group: primitives
demo: el-control-flow
source_hash: f203fe49580cd892
---

# If / Each

`If` और `Each` तय करते हैं कि कौन-से एलिमेंट मौजूद रहेंगे: सशर्त और दोहराई जाने वाली सामग्री। ये अपना कोई नेटिव व्यू नहीं बनाते।
नेटिव रेंडरर केवल वही अपडेट करता है जो बदला है: `If` शर्त पलटने पर ब्रांच बदल देता है, `Each` सूची को दोबारा बनाने के बजाय key के आधार पर पंक्तियाँ जोड़ता, खिसकाता और हटाता है। Rust में `when(..)`, `each(..)` और `dynamic(..)` `nsh_core::prelude` में हैं; TSX में `<If>` और `<Each>` हैं, जो ऐसे ग्लोबल हैं जिन्हें import करने की ज़रूरत नहीं।

```rust tabs
use nsh_core::prelude::*;

view()
    .child(
        when(move || user.with(|u| u.is_some()), move || {
            text(move || format!("Hello, {}", user.with(|u| u.as_ref().map(|u| u.name.clone()).unwrap_or_default())))
        })
        .otherwise(|| text("Signed out")),
    )
    .child(each(todos, |t: &Todo| t.id, |todo, _index| text(move || todo.get().title)))
```

```tsx tabs
<View>
  <If when={user()} else={<Text>Signed out</Text>}>
    {(u) => <Text>Hello, {u().name}</Text>}
  </If>
  <Each of={todos()}>{(todo) => <Text>{todo().title}</Text>}</Each>
</View>
```

TSX में ये ग्लोबल हैं (स्कोप में उसी नाम की कोई बाइंडिंग हो तो वह इनकी जगह ले लेती है)। JSX एक्सप्रेशन के अंदर आप सामान्य JavaScript (`cond ? a : b`, `items.map(…)`) और Rust में `dynamic(move || ..)` अब भी इस्तेमाल कर सकते हैं: ये अपने एलिमेंट हर बार दोबारा बनाते हैं जब भी उनके पढ़े हुए मान बदलते हैं, जबकि `If` और `Each` (Rust में `when` और `each`) वे एलिमेंट बनाए रखते हैं जो बने रहते हैं।

## If

शर्त सही रहने तक अपनी ब्रांच रेंडर करता है, अन्यथा दूसरी ब्रांच (या कुछ नहीं)।

| प्रॉप | Rust | टाइप | विवरण |
|---|---|---|---|
| `when` | `when(cond, ..)` | `T` | शर्त: Rust में एक मान, एक सिग्नल या एक क्लोजर; TSX में उसकी truthiness। |
| `else` | `.otherwise(\|\| ..)` | `JSX.Element` | जब तक `when` सही नहीं होता, तब तक रेंडर होता है। |
| `children` | `when(.., \|\| ..)` | `JSX.Element` \| `(value: () => NonNullable<T>) => JSX.Element` | जब तक `when` सही रहता है, तब तक रेंडर होता है। TSX में, फ़ंक्शन को `when` के मान का एक accessor मिलता है। |

शर्त जिस ब्रांच की ओर पलटती है, वह ब्रांच तभी बनती है, और जो बना था वह शर्त के दूसरी ओर पलटते ही हट जाता है। TSX में जब `when` एक truthy मान से दूसरे truthy मान पर जाता है (`user()` का एक ऑब्जेक्ट से दूसरे में बदलना), तो ब्रांच बनी रहती है और उसके अंदर के एक्सप्रेशन अपने आप अपडेट हो जाते हैं।

```rust tabs
let loading = signal(true);

when(move || !loading.get(), || profile())
    .otherwise(|| text("Loading…").text_color(rgb(0x6e7781)))
```

```tsx tabs
const loading = signal(true);

<If when={!loading()} else={<Text style={{ color: "#6e7781" }}>Loading…</Text>}>
  <Profile />
</If>;
```

TSX में, फ़ंक्शन चाइल्ड वह मान पढ़ता है जो `when` ने दिया, और उसके टाइप में `null` या `undefined` नहीं होता, इसलिए ब्रांच को `!` की ज़रूरत नहीं पड़ती। Rust में, ब्रांच स्वयं सिग्नल को पढ़ती है, या `dynamic` मान को एलिमेंट में मैप करता है:

```rust tabs
let user = signal(None::<User>);

dynamic(move || user.get().map(|u| text(u.name)))
```

```tsx tabs
const user = signal<User | null>(null);

<If when={user()}>{(u) => <Text>{u().name}</Text>}</If>;
```

## Each

सूची के हर आइटम के लिए एक पंक्ति रेंडर करता है।

| प्रॉप | Rust | टाइप | विवरण |
|---|---|---|---|
| `of` | `each(items, ..)` | `readonly any[] \| null \| undefined` | आइटम: Rust में एक `Vec`, उसका एक सिग्नल या उसे लौटाने वाला क्लोजर। `null` और `undefined` कुछ रेंडर नहीं करते। |
| `key` | `each(.., \|item\| key, ..)` | `(item: any) => unknown` | किसी आइटम की पहचान। TSX में डिफ़ॉल्ट: आइटम स्वयं (ऑब्जेक्ट identity से, प्रिमिटिव मान से)। |
| `children` | `each(.., .., \|item, index\| row)` | `(item: () => any, index: () => number) => JSX.Element` | एक पंक्ति रेंडर करता है। |

पंक्ति फ़ंक्शन को मान नहीं, **accessors** मिलते हैं: TSX में `item()` और `index()` को कॉल करें, Rust में `item.get()` और `index.get()` को (दोनों `ReadSignal` हैं)। आइटम बदलने पर, जिन पंक्तियों की key अब भी मौजूद है वे बनी रहती हैं (और स्थिति बदलने पर खिसका दी जाती हैं); उनका आइटम और इंडेक्स अपडेट होता है, और केवल उन्हें पढ़ने वाले एक्सप्रेशन दोबारा चलते हैं। नई key को नई पंक्तियाँ मिलती हैं; जिन पंक्तियों की key नहीं रही, वे हटा दी जाती हैं।

```rust tabs
#[derive(Clone, PartialEq)]
struct Todo {
    id: u32,
    title: String,
    done: bool,
}

let todos = signal(Vec::<Todo>::new());

each(todos, |t: &Todo| t.id, |todo, index| {
    view()
        .flex_row()
        .gap_2()
        .child(text(move || format!("{}.", index.get() + 1)))
        .child(
            text(move || todo.get().title)
                .style_when(move || todo.get().done, |s| s.line_through()),
        )
})
```

```tsx tabs
interface Todo {
  id: number;
  title: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);

<Each of={todos()} key={(t: Todo) => t.id}>
  {(todo, index) => (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text>{index() + 1}.</Text>
      <Text style={{ textDecorationLine: todo().done ? "line-through" : "none" }}>{todo().title}</Text>
    </View>
  )}
</Each>;
```

<a id="choosing-a-key"></a>

### key चुनना

- जिन आइटम को हर अपडेट पर नए ऑब्जेक्ट से बदला जाता है (immutable अपडेट, `{ ...t, done: true }`) उन्हें `key` चाहिए, आमतौर पर एक id।
  इसके बिना हर नया ऑब्जेक्ट एक नई पंक्ति बन जाता है और उसके एलिमेंट दोबारा बनते हैं। Rust में हमेशा key देनी होती है।
- TSX में, स्ट्रिंग या संख्याओं के ऐरे बिना key के भी काम करते हैं: उनकी तुलना मान से होती है।
- हर पंक्ति का अपना owner होता है: पंक्ति में बनाए गए effects और cleanups पंक्ति हटने पर समाप्त हो जाते हैं।

> [!NOTE]
> `Each` और `each` जेनेरिक हैं: TypeScript आइटम का टाइप `of` से और Rust आइटम से अनुमानित करता है, इसलिए पंक्ति का `todo()` और `key` पैरामीटर बिना annotation के टाइप हो जाते हैं।

<a id="each-or-a-list"></a>

## Each या list

`Each` हर पंक्ति बनाता है। दर्जनों या कुछ सौ आइटम के लिए, किसी view या [scroll view](./scroll.md) में, यह सही है।
लंबे या असीमित डेटा के लिए [list](./list.md) इस्तेमाल करें: यह व्यूपोर्ट के पास की पंक्तियाँ बनाती है और उन्हें रीसायकल करती है।

एक्सप्रेशन कैसे अपडेट होते हैं, यह जानने के लिए [JSX और कंपोनेंट](../docs/jsx-and-components.md) तथा [reactivity](../docs/reactivity.md) देखें।
