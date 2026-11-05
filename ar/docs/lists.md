---
title: "القوائم"
description: "القوائم الطويلة واللانهائية في Rust وTSX - إعادة التدوير، وهوية الصفوف، والأعمدة، والرؤوس الثابتة، وقوائم الدردشة المعكوسة، والقوائم الأفقية، والقوائم داخل الصفحة، وتحميل المزيد، وقابلية الرؤية، والتمرير إلى عنصر."
order: 40
group: ui
demo: guide-lists
source_hash: fb4ffb925cc99200
---

# القوائم

تعرض القائمة (`virtual_list(..)` في Rust، و`List` من `nsh` في TSX) البيانات الطويلة على scroll view أصلي، مع إنشاء الصفوف القريبة من الشاشة فقط. يتم حساب الصفوف الموجودة ومواضعها والأعمدة والرؤوس اللاصقة والعناصر المرئية كلها على الجانب الأصلي؛ أما شيفرتك فلا تملأ الخلايا بالمحتوى إلا عندما يطلب الجانب الأصلي خلية. تكلّف قائمة من مليون عنصر تقريبًا ما تكلّفه قائمة من ثلاثين عنصرًا.

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let titles: Rc<Vec<String>> = Rc::new((1..=10_000).map(|i| format!("Item {i}")).collect());
    virtual_list(titles.len(), move |at| {
        let titles = titles.clone();
        view()
            .p_4()
            .border_b_1()
            .border_b_color(rgb(0xeaeef2))
            .child(text(move || titles[at.index()].clone()).text_size(px(16.0)))
    })
    .estimated_item_size(px(52.0))
    .flex_1()
    .bg(white())
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: i, title: `Item ${i + 1}` }));

function App() {
  return (
    <List each={items} estimatedItemSize={52} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {(item) => (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eaeef2" }}>
          <Text style={{ fontSize: 16 }}>{item().title}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

في Rust، تأخذ `virtual_list(count, row)` عدد الصفوف (قيمة أو signal أو closure) ودالة تبني الصف انطلاقًا من موضعه (`at.index()`)؛ وتقرأ الصفوف بياناتك بواسطة هذا الفهرس. في TSX، تأخذ `each` العناصر، وتتلقى دالة الصف العنصر نفسه. وكما هو الحال مع [scroll view](./scrolling.md)، فإن القائمة هي منفذ العرض (viewport) وتحتاج إلى حجم من عنصرها الأب (`.flex_1()` أو `flex: 1` أو ارتفاع).

<a id="how-recycling-works"></a>

## كيف تعمل إعادة التدوير

لا تُستدعى دالة الصف مرة واحدة لكل عنصر، بل تُستدعى **مرة واحدة لكل خلية**، وتُعاد استخدام الخلايا: عندما يبتعد صف كثيرًا عن الشاشة أثناء التمرير، تُعطى خليته لصف آخر، ويتغير موضعه (`at.index()` في Rust، و`item()` و`index()` في TSX). وكل ما في الصف يقرأ هذا الموضع يتحدث في مكانه، مثل أي [signal](./reactivity.md) آخر.

تنتج عن ذلك قاعدتان:

**اقرأ الموضع في المكان الذي تستخدمه فيه.** القيمة المنسوخة في أعلى دالة الصف تخص الصف الذي عرضته الخلية أولًا، أيًّا كان.

```rust tabs
// Wrong: `title` stays the first row's title when the cell is reused.
virtual_list(count, move |at| {
    let title = titles[at.index()].clone();
    text(title)
})

// Right: the text follows the cell's current row.
virtual_list(count, move |at| {
    let titles = titles.clone();
    text(move || titles[at.index()].clone())
})
```

```tsx tabs
// Wrong: `title` stays the first item's title when the cell is reused.
{(item) => {
  const title = item().title;
  return <Text>{title}</Text>;
}}

// Right: the text follows the cell's current item.
{(item) => <Text>{item().title}</Text>}
```

**احتفظ بالحالة الخاصة بكل عنصر في بياناتك، لا في الصف.** الـ signal الذي يُنشأ داخل الصف يخص الخلية وينتقل معها إلى العنصر التالي. خزّن حالة "هل هذا الصف موسّع / محدد / معجب به" في العناصر نفسها أو في مجموعة مفهرسة بالمعرّف:

```rust tabs
let liked = signal(HashSet::<u32>::new());
let toggle = move |id: u32| {
    liked.update(|s| {
        if !s.remove(&id) {
            s.insert(id);
        }
    })
};

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
.flex_1()
```

```tsx tabs
const liked = signal<Set<number>>(new Set());
const toggle = (id: number) =>
  liked.update((s) => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

<List each={posts()} estimatedItemSize={64} style={{ flex: 1 }}>
  {(post) => (
    <View style={{ flexDirection: "row", padding: 16 }}>
      <Text style={{ flex: 1 }}>{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

يمكن أن تختلف ارتفاعات الصفوف. وإلى أن يتم قياس صف ما، تفترض القائمة حجم العنصر التقديري (الافتراضي 50 نقطة)؛ مرّر قيمة قريبة من صفك المعتاد حتى يكون مؤشر التمرير والقفزات إلى العناصر البعيدة دقيقة منذ البداية.

<a id="changing-the-data"></a>

## تغيير البيانات

في Rust، مرّر العدد على شكل signal أو closure (`move || posts.with(Vec::len)`): تكبر القائمة وتصغر في مكانها. الصفوف المضافة أو المحذوفة في النهاية لا تحتاج إلى شيء آخر؛ أما عندما تظهر الصفوف وتختفي في أماكن أخرى، فحدّد هوياتها باستخدام `.keys(move || posts.with(|p| p.iter().map(|p| p.id).collect::<Vec<_>>()))`، وستحتفظ القائمة بالبداية والنهاية المشتركتين وتعامل ما بينهما على أنه محذوف ومُدرج.

في TSX، مرّر مصفوفة جديدة لتغيير العناصر: `posts.set([...posts(), ...more])`. تقارن القائمة المصفوفة القديمة بالجديدة **بهوية العنصر** (`===`)، وتحتفظ بالبداية والنهاية المشتركتين، وتعامل ما بينهما على أنه محذوف ومُدرج.

في الحالتين، تبقى القياسات مع صفوفها، وعندما تُدرج صفوف فوق الصفوف الظاهرة على الشاشة، تبقى الصفوف الظاهرة في مكانها بدل أن تقفز.

- في TSX، حدّث البيانات بلا تعديل مباشر (immutably): مصفوفة جديدة مع إعادة استخدام كائنات العناصر غير المتغيرة. أما تعديل المصفوفة في مكانها (`push`) فلا يُلاحَظ.
- يجب أن يكون العنصر المتغير كائنًا جديدًا (`{ ...post, title }`)، حتى يعرض صفه التغيير.
- إضافة عناصر في البداية (رسائل جديدة، أو تغذية محدّثة) تحافظ على موضع المستخدم.

`keyExtractor` يسمّي العناصر في رموز القابلية للمشاهدة (viewability tokens) أدناه؛ المفتاح الافتراضي هو `item.key`، ثم `item.id`، ثم الفهرس. ولا يؤثر ذلك في كيفية مطابقة التغييرات في TSX، فهي تتم دائمًا بالهوية.

<a id="props"></a>

## الخصائص

تقبل القائمة كل خصائص التمرير في scroll view التي لها معنى في القائمة (`pagingEnabled`، `snapToInterval`، `snapToOffsets`، `snapToAlignment`، `decelerationRate`، `disableIntervalMomentum`، `bounces`، `scrollable`، `contentInset`، `contentOffset`، `keyboardShouldPersistTaps`، `keyboardDismissMode`، `scrollEventThrottle`، `onScroll`، `onScrollDragStart`، `onScrollDragEnd`، `onMomentumStart`، `onMomentumEnd`، `onScrollEnd`، `scrollValue`، `pullValue`؛ وفي Rust هي الدوال نفسها الخاصة بـ scroll view)، وهي موصوفة في [التمرير](./scrolling.md). تحتفظ القوائم بمقياس 1. أما خصائصها الخاصة فهي:

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | العناصر؛ وفي Rust، عدد الصفوف. |
| `children` | `virtual_list(.., row)` | `(item: () => T, index: () => number) => JSX.Element` | | تعرض خلية؛ تُستدعى مرة واحدة لكل خلية، راجع [إعادة التدوير](#how-recycling-works). |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | حجم الصفوف التي لم تُقَس بعد، بالنقاط. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | يمرّر أفقيًا. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: تتمرر القائمة في scroll view خاص بها. `"parent"`: تمتد القائمة بكامل طولها داخل scroll view المحيط بها، والذي يمرّرها مع بقية الصفحة (راجع [القوائم داخل صفحة](#lists-in-a-page-viewportparent)). يُختار عند إنشاء القائمة. |
| `numColumns` | `.columns(n)` | `number` | `1` | عدد العناصر في كل صف (القوائم العمودية). |
| `inverted` | `.inverted()` | `boolean` | `false` | العنصر 0 في الأسفل (الدردشة)؛ تبدأ القائمة من النهاية وتحافظ على بعدها عن النهاية. |
| `maintainVisibleContentPosition` | `.follow_end(px(..))` | `{ autoscrollToBottomThreshold?: number }` | | القائمة غير المعكوسة تبقى عند النهاية ما دامت ضمن هذا العدد من النقاط منها، أثناء نمو المحتوى (انظر أدناه). |
| `stickyHeaderIndices` | `.sticky_header_indices(..)` | `number[]` | | العناصر التي تلتصق بالأعلى عند تجاوزها بالتمرير (عمود واحد، غير معكوسة). |
| `stickyHeaderOffset` | `.sticky_header_offset(px(..))`، `.bind_sticky_header_offset(&node)` | `number \| AnimatedNode` | `0` | المسافة تحت الأعلى التي تلتصق عندها العناصر اللاصقة، مثل `top` في CSS `position: sticky`؛ ويستمر المحتوى في التمرير تحت المساحة التي فوقها. القيمة المتحركة تحرّكها في كل إطار. |
| `contentStyle` | `.content_padding(..)`، `.content_padding_x(..)`، ...، `.row_gap(..)`، `.column_gap(..)` | `{ padding*, gap, rowGap, columnGap }` | | الحشو (padding) والفجوات (gaps) للمحتوى، أرقام فقط. |
| `contentClass` | | `string` | | مثل classes (`p-*`، `gap-*`)؛ و`contentStyle` له الأولوية عليها. |
| `header` | `.header(..)` | مكوّن أو عنصر | | قبل العناصر. |
| `footer` | `.footer(..)` | مكوّن أو عنصر | | بعد العناصر. |
| `empty` | `.empty(..)` | مكوّن أو عنصر | | يُعرض بدلًا من العناصر عندما لا يوجد أي منها. |
| `separator` | `.separator(\|\| ..)` | مكوّن أو عنصر | | بين العناصر (عمود واحد). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | يمرّر إلى هذا العنصر قبل الإطار الأول. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | النهاية قريبة (انظر أدناه). |
| `loadMoreThreshold` | `.load_more_threshold(..)` | `number` | `1` | مدى القرب من النهاية، بوحدات منفذ العرض، الذي يُطلق عنده `onLoadMore`. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | البداية قريبة، بعد تمرير (انظر أدناه). |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(..)` | `number` | `1` | مدى القرب من البداية، بوحدات منفذ العرض، الذي يُطلق عنده `onLoadMoreAtStart`. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info) => void` | | أصبحت عناصر قابلة للمشاهدة أو توقفت عن ذلك. |
| `viewabilityConfig` | `.viewability(..)`، `.minimum_view_time(..)` | `ViewabilityConfig` | | متى تُعدّ العناصر قابلة للمشاهدة. |
| `keyExtractor` | `.keys(..)` | `(item, index) => string` | | المفتاح في رموز القابلية للمشاهدة؛ وفي Rust، هويات الصفوف. |
| `refreshing` / `onRefresh` | `.refreshing(..)` / `.on_refresh(..)` | `boolean` / `() => void` | | السحب للتحديث. |
| `refreshIndicator` | `.refresh_indicator(..)` | `{ height: number }` | | مؤشر السحب للتحديث الخاص بالتطبيق، بدلًا من مؤشر الدوران الخاص بالمنصة (راجع [التمرير](./scrolling.md#an-indicator-of-your-own)). |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | ظهور مؤشر التمرير: مؤشر المنصة، أو [الشريط المدمج](../elements/scrollbar.md#built-in-bars) في التطبيق متى ضبط سمة؛ والكائن هو سمة خاصة بالعرض نفسه. على سطح المكتب وفي متصفحات سطح المكتب يحتفظ العرض الأفقي بالمؤشر: فهو شريط تمرير الفأرة. |
| `ref` | `.element_ref(&list)` | `ListRef` | | `scrollToIndex`، `scrollToOffset`، `scrollToEnd`، `scrollTo`. |

تقبل خانات الرأس والتذييل والحالة الفارغة عنصرًا (وفي TSX مكوّنًا أيضًا: `header={Header}`). وهي خلايا قائمة بذاتها، لا يُعاد تدويرها أبدًا، وهي تفاعلية مثل أي عنصر آخر.

<a id="columns-and-grids"></a>

## الأعمدة والشبكات

`numColumns` (`.columns(n)`) يرتّب العناصر في صفوف بهذا العدد من الأعمدة؛ ويحيط حشو المحتوى بالمحتوى، مع فجوات بين الصفوف والأعمدة. يمكن أن تختلف ارتفاعات صفوف الشبكة: يكون كل صف بارتفاع أطول عنصر فيه.

```rust tabs
let count = photos.len();
virtual_list(count, move |at| {
    let photos = photos.clone();
    image(move || photos[at.index()].thumb.clone()).aspect_square().rounded(px(8.0))
})
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.flex_1()
```

```tsx tabs
<List
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  style={{ flex: 1 }}
  contentStyle={{ padding: 12, gap: 8 }}
>
  {(photo) => <Image src={photo().thumb} style={{ aspectRatio: 1, borderRadius: 8 }} />}
</List>
```

<a id="sticky-headers"></a>

## الرؤوس اللاصقة

`stickyHeaderIndices` يسرد العناصر التي تلتصق بأعلى منفذ العرض بينما يمرّ المحتوى تحتها، إلى أن يدفعها العنصر اللاصق التالي إلى الخارج. الأقسام هي قائمة واحدة من عناصر الرؤوس وعناصر الصفوف؛ وتلتصق فهارس الرؤوس. يتم التثبيت على الجانب الأصلي في كل إطار تمرير.

```rust tabs
#[derive(Clone, PartialEq)]
enum Row {
    Header(String),
    Name(String),
}

let mut rows = Vec::new();
let mut headers = Vec::new();
for (letter, names) in groups {
    headers.push(rows.len());
    rows.push(Row::Header(letter));
    rows.extend(names.into_iter().map(Row::Name));
}
let count = rows.len();
let rows = Rc::new(rows);

virtual_list(count, move |at| {
    let rows = rows.clone();
    let row = computed(move || rows[at.index()].clone());
    let is_header = computed(move || matches!(row.get(), Row::Header(_)));
    let label = move || match row.get() {
        Row::Header(s) | Row::Name(s) => s,
    };
    when(is_header, move || {
        text(label).p(px(6.0)).bg(rgb(0xeaeef2)).font_weight(FontWeight::BOLD)
    })
    .otherwise(move || text(label).p_3())
})
.sticky_header_indices(headers)
.estimated_item_size(px(44.0))
.flex_1()
```

```tsx tabs
type Row = { header: string } | { name: string };

const rows: Row[] = [];
const headers: number[] = [];
for (const [letter, names] of groups) {
  headers.push(rows.length);
  rows.push({ header: letter });
  for (const name of names) rows.push({ name });
}

<List each={rows} stickyHeaderIndices={headers} estimatedItemSize={44} style={{ flex: 1 }}>
  {(row) => (
    <If
      when={"header" in row()}
      else={<Text style={{ padding: 12 }}>{(row() as { name: string }).name}</Text>}
    >
      <Text style={{ padding: 6, backgroundColor: "#eaeef2", fontWeight: "700" }}>{(row() as { header: string }).header}</Text>
    </If>
  )}
</List>
```

ولأن الخلية قد تعرض رأسًا الآن واسمًا لاحقًا، فإن الصف يقرر ما سيعرضه بواسطة [`when` / `<If>`](../elements/control-flow.md)، الذي يتبدل عندما يتغير الصف. تحتاج الرؤوس اللاصقة إلى عمود واحد وقائمة غير معكوسة.

`stickyHeaderOffset` (`.sticky_header_offset(..)` في Rust) يجعل الرؤوس تلتصق على بعد هذا العدد من النقاط تحت الأعلى بدلًا من ذلك، كما يفعل `top` في CSS `position: sticky`: تحت شريط شبه شفاف ارتفاعه 56 نقطة، يُبقي `stickyHeaderOffset={56}` (`.sticky_header_offset(px(56.0))`) كل رأس تحت الشريط بينما تستمر الصفوف في التمرير تحته، ويدفعه الرأس التالي إلى الخارج من هناك. الإزاحة السالبة تترك جزءًا من الرأس خارج مجال الرؤية.

يمكن أن تكون الإزاحة [قيمة متحركة](./animation.md#animated-values) (`.bind_sticky_header_offset(&node)` في Rust): تتبعها الرؤوس في كل إطار على خيط واجهة المستخدم، فتبقى تحت شريط متحرك. ومع شريط يختفي عندما يتمرر المحتوى للأسفل ويعود عندما يتمرر للأعلى ([`diffClamp`](./animation.md#arithmetic-and-diffclamp))، تلتصق الرؤوس بحافته السفلية أينما كان:

```rust tabs
let offset = animated_value(0.0);
let hidden = offset.diff_clamp(0.0, 56.0);
let shown = hidden.mul(-1.0).add(56.0);

view().flex_1().overflow_hidden().child(
    virtual_list(rows.len(), row)
        .scroll_value(&offset)
        .sticky_header_indices(headers)
        .bind_sticky_header_offset(&shown),
).child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&hidden.mul(-1.0)))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const hidden = scroll.diffClamp(0, 56);
const shown = hidden.mul(-1).add(56);

<View style={{ flex: 1, overflow: "hidden" }}>
  <List each={rows} scrollValue={scroll} stickyHeaderIndices={headers} stickyHeaderOffset={shown}>…</List>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, hidden.mul(-1)] }}>…</View>
</View>
```

<a id="chat-inverted-lists"></a>

## الدردشة: القوائم المعكوسة

`inverted` يرتّب القائمة انطلاقًا من النهاية: العنصر 0 في الأسفل، وتبدأ القائمة ممرَّرة إلى النهاية، وتحافظ على بعدها عن النهاية أثناء تغيّر العناصر. اجعل أحدث رسالة أولًا؛ أضف في البداية لإضافة رسالة، وأضف في النهاية لتحميل الرسائل الأقدم باستخدام `onLoadMore` ("نهاية" القائمة المعكوسة هي أعلاها). وعندما تُفتح الدردشة عند رسالة قديمة، تحمّل الرسائل الأحدث باستخدام [`onLoadMoreAtStart`](#loading-at-the-start-onloadmoreatstart)؛ ومعه تحافظ القائمة على بعدها عن الأسفل ما دامت هناك، وتُبقي الرسائل الظاهرة على الشاشة في مكانها عند التمرير للأعلى.

```rust tabs
#[derive(Clone, PartialEq)]
struct Message {
    id: u32,
    text: String,
    mine: bool,
}

pub fn chat() -> impl IntoElement {
    let next = stored(0_u32);
    let message = move |text: String, mine: bool| Message {
        id: next.with(|n| {
            *n += 1;
            *n
        }),
        text,
        mine,
    };
    // Newest first.
    let messages = signal(
        (0..30)
            .map(|i| message(format!("Message {}", 30 - i), i % 3 == 0))
            .collect::<Vec<_>>(),
    );
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get_untracked();
        if text.trim().is_empty() {
            return;
        }
        let sent = message(text, true);
        messages.update(|m| m.insert(0, sent));
        draft.set(String::new());
    };
    let load_older = move || {
        let older: Vec<_> = (0..20).map(|i| message(format!("Older {i}"), false)).collect();
        messages.update(|m| m.extend(older));
    };
    let list = virtual_list(
        move || messages.with(Vec::len),
        move |at| {
            let mine = computed(move || messages.with(|m| m[at.index()].mine));
            view()
                .style_when(mine, |s| s.self_end().bg(rgb(0x0969da)))
                .style_when(move || !mine.get(), |s| s.self_start().bg(rgb(0xeaeef2)))
                .max_w(relative(0.75))
                .px_3()
                .py_2()
                .rounded(px(14.0))
                .child(
                    text(move || messages.with(|m| m[at.index()].text.clone()))
                        .text_color(move || if mine.get() { rgb(0xffffff) } else { rgb(0x1f2328) }),
                )
        },
    )
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(44.0))
    .content_padding(px(12.0))
    .row_gap(px(6.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .on_load_more(load_older)
    .load_more_threshold(0.5)
    .flex_1();
    view()
        .flex_1()
        .pb_keyboard()
        .child(list)
        .child(
            view().flex_row().gap_2().p_2().child(
                input()
                    .value(move || draft.get())
                    .on_change(move |text: &str| draft.set(text.to_owned()))
                    .on_submit(move |_: &str| send())
                    .multiline(true)
                    .submit_behavior(SubmitBehavior::Submit)
                    .return_key_type(ReturnKeyType::Send)
                    .placeholder("Message")
                    .flex_1()
                    .max_h(px(120.0))
                    .border_1()
                    .border_color(rgb(0xd0d7de))
                    .rounded(px(18.0))
                    .px_3()
                    .py_2(),
            ),
        )
}
```

```tsx tabs
import { List, mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

type Message = { id: number; text: string; mine: boolean };

function Chat() {
  let next = 0;
  const message = (text: string, mine: boolean): Message => ({ id: next++, text, mine });
  const messages = signal(Array.from({ length: 30 }, (_, i) => message(`Message ${30 - i}`, i % 3 === 0)));
  const draft = signal("");
  const send = () => {
    if (!draft().trim()) return;
    messages.update((m) => [message(draft(), true), ...m]); // newest first
    draft.set("");
  };
  const loadOlder = () => messages.update((m) => [...m, ...Array.from({ length: 20 }, (_, i) => message(`Older ${i}`, false))]);
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <List
        each={messages()}
        inverted
        estimatedItemSize={44}
        style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 6 }}
        keyboardDismissMode="interactive"
        onLoadMore={loadOlder}
        loadMoreThreshold={0.5}
      >
        {(m) => (
          <View
            style={{
              alignSelf: m().mine ? "flex-end" : "flex-start",
              maxWidth: "75%",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: m().mine ? "#0969da" : "#eaeef2",
            }}
          >
            <Text style={{ color: m().mine ? "#ffffff" : "#1f2328" }}>{m().text}</Text>
          </View>
        )}
      </List>
      <View style={{ flexDirection: "row", gap: 8, padding: 8 }}>
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          onSubmit={send}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}
        />
      </View>
    </View>
  );
}

mount(Chat);
```

`scroll_to_end(..)` / `scrollToEnd()` على قائمة معكوسة يمرّر إلى بدايتها: أحدث رسالة.

<a id="following-the-end-of-a-list-that-is-not-inverted"></a>

### متابعة نهاية قائمة غير معكوسة

يمكن للقائمة بترتيب القراءة (الأقدم أولًا) أن تتابع نهايتها أيضًا: مع `.follow_end(px(40.0))` في Rust أو `maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }}` في TSX، ما دام المستخدم عند النهاية (أو ضمن 40 نقطة منها)، تبقى القائمة عند النهاية أثناء نمو المحتوى: رد يتدفق إلى العنصر الأخير، أو رسالة جديدة تُضاف، أو لوحة مفاتيح تصغّر القائمة. وإذا تمرّر المستخدم أبعد إلى الأعلى، يبقى المحتوى المرئي في مكانه ويكبر المحتوى الجديد تحته. العناصر المُدرجة فوق العناصر المرئية لا تحرّكها أبدًا، مع هذا الخيار أو بدونه.

```rust tabs
virtual_list(move || messages.with(Vec::len), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .follow_end(px(40.0))
    .flex_1()
```

```tsx tabs
<List each={messages()} keyExtractor={(m) => m.id} maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 40 }} style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

<a id="horizontal-lists"></a>

## القوائم الأفقية

`horizontal` يقلب القائمة إلى الوضع الأفقي؛ وتُرتَّب الخلايا بارتفاع القائمة. وعند دمجه مع الالتقاط (snapping) يصنع دوّارة (carousel) بأي طول.

```rust tabs
let count = cards.len();
virtual_list(count, move |at| {
    let cards = cards.clone();
    view()
        .w(px(220.0))
        .h(px(140.0))
        .rounded(px(14.0))
        .bg(move || cards[at.index()].color)
})
.horizontal()
.estimated_item_size(px(232.0))
.snap_interval(px(232.0))
.deceleration(0.99)
.scrollbar(false)
.content_padding_x(px(16.0))
.column_gap(px(12.0))
.h(px(140.0))
```

```tsx tabs
<List
  each={cards}
  horizontal
  estimatedItemSize={232}
  snapToInterval={232}
  decelerationRate="fast"
  scrollbar={false}
  style={{ height: 140 }}
  contentStyle={{ paddingHorizontal: 16, gap: 12 }}
>
  {(card) => <View style={{ width: 220, height: 140, borderRadius: 14, backgroundColor: card().color }} />}
</List>
```

في اتجاه اليمين إلى اليسار، تبدأ القوائم الأفقية من اليمين وتمتد نحو اليسار.

<a id="lists-in-a-page-viewportparent"></a>

## القوائم داخل صفحة: viewport="parent"

غالبًا ما تتمرر الصفحة كوحدة واحدة: رأس، ثم بعض البطاقات، ثم قائمة طويلة، وربما قائمة أخرى تحتها. امنح القائمة `viewport="parent"` (`.viewport(ListViewport::Parent)` في Rust) وضعها في `Scroll` مع بقية الصفحة: تمتد القائمة في الصفحة بكامل طولها، ويمرّرها scroll view الخاص بالصفحة مع كل شيء آخر. وهي لا تزال تنشئ الصفوف القريبة من منفذ عرض الصفحة فقط وتعيد تدوير خلاياها، لذا يمكن لصفحة واحدة أن تحتوي على عدة قوائم طويلة.

```rust tabs
scroll()
    .flex_1()
    .child(header())
    .child(
        virtual_list(count, row)
            .viewport(ListViewport::Parent)
            .estimated_item_size(px(56.0))
            .row_gap(px(6.0)),
    )
    .child(footer())
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <Header />
  <List viewport="parent" each={items} estimatedItemSize={56} contentStyle={{ gap: 6 }}>
    {(item) => <Row item={item()} />}
  </List>
  <Footer />
</Scroll>
```

- تكون القائمة بطول صفوفها: يأتي ارتفاعها (وعرضها في الوضع الأفقي) من محتواها، كما هو الحال مع أي عرض، وتعمل حواشيها وحدودها وهوامشها كما تعمل على العرض.
- تتبع صفوفها أقرب scroll view يحيط بها على محورها، أو الشاشة التي هي عليها.
- تحافظ الصفحة على ما تقرؤه في مكانه، كما يفعل المتصفح: الصفوف التي يتغير حجمها بالكامل فوق أعلى منفذ العرض تحرّك الصفحة بالمقدار نفسه؛ وما دامت بداية القائمة ظاهرة، فإن الصفوف التي تكبر تدفع ما تحتها إلى الأسفل.
- `scrollToIndex` و`scrollToEnd` و`initialScrollIndex` تمرّر الصفحة إلى صفوف القائمة، ضمن محتوى الصفحة؛ و`onLoadMore` يُطلق عندما تقترب نهاية القائمة من منفذ العرض، و`onViewableItemsChange` يبلّغ عن الصفوف الموجودة في منفذ عرض الصفحة.
- `stickyHeaderIndices` و`stickyHeaderOffset` تُلصق الصفوف بأعلى الصفحة: يبقى رأس القسم في الأعلى بينما تتمرر صفوفه تحته، إلى أن يدفعه التالي إلى الخارج، ويغادر الأخير مع نهاية قائمته.
- كيفية تمرير الصفحة تعود إلى scroll view الخاص بها: اضبط `onScroll` وبقية أحداث التمرير، و`scrollValue`، و`refreshing` / `onRefresh`، والتصفح بالصفحات والالتقاط، و`contentInset` و`scrollbar` و`scrollable` و`keyboardDismissMode` على `Scroll`. القوائم المعكوسة و`maintainVisibleContentPosition` هي ميزات للقائمة ذات منفذ العرض الخاص بها (`viewport="own"`، وهو الافتراضي).
- يُختار منفذ العرض عند إنشاء القائمة: للتبديل، اعرض قائمة جديدة.

<a id="loading-more-onloadmore"></a>

## تحميل المزيد: onLoadMore

`onLoadMore` (`.on_load_more(..)`) يُطلق عندما يصبح منفذ العرض ضمن `loadMoreThreshold` من منافذ العرض من النهاية (1 افتراضيًا: شاشة واحدة قبل النهاية). أضف الصفحة التالية؛ وتُطلق القائمة الحدث مجددًا عندما تقترب النهاية الجديدة.

```rust tabs
let posts = signal(Vec::<Post>::new());
let page = stored(0_u32);
let loading = stored(false);

let load_more = move || {
    if loading.replace(true) {
        return;
    }
    let next = page.with(|p| {
        *p += 1;
        *p
    });
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/posts?page={next}")).await {
            let more = parse_posts(&response.text());
            posts.update(|p| p.extend(more));
        }
        loading.replace(false);
    });
};
load_more();

virtual_list(move || posts.with(Vec::len), move |at| post_row(posts, at))
    .estimated_item_size(px(72.0))
    .on_load_more(load_more)
    .load_more_threshold(0.5)
    .footer(text("Loading…").p_4().text_center().text_color(rgb(0x8c959f)))
    .flex_1()
```

```tsx tabs
const posts = signal<Post[]>([]);
let loading = false;
let page = 0;

const loadMore = async () => {
  if (loading) return;
  loading = true;
  try {
    const next: Post[] = await (await fetch(`https://api.example.com/posts?page=${++page}`)).json();
    posts.set([...posts(), ...next]);
  } finally {
    loading = false;
  }
};
loadMore();

<List
  each={posts()}
  estimatedItemSize={72}
  style={{ flex: 1 }}
  onLoadMore={loadMore}
  loadMoreThreshold={0.5}
  footer={<Text style={{ padding: 16, textAlign: "center", color: "#8c959f" }}>Loading…</Text>}
>
  {(post) => <PostRow post={post()} />}
</List>
```

احرص على منع التحميلات المتداخلة كما في المثال أعلاه: فقد يُبلَّغ عن النهاية مرة أخرى بينما صفحة في الطريق.
<a id="loading-at-the-start-onloadmoreatstart"></a>

## التحميل عند البداية: onLoadMoreAtStart

يمكن أيضًا أن تُفتح القائمة في منتصف بياناتها: فمحادثة تُفتح عند رسالة قديمة (نتيجة بحث، أو اقتباس رد) تعرض صفحة حولها، مع بقاء رسائل أحدث لم تُحمَّل بعد. يُستدعى `onLoadMoreAtStart` (`.on_load_more_at_start(..)`) عندما تقترب نافذة العرض من البداية بمقدار `loadMoreAtStartThreshold` من نوافذ العرض (1 افتراضيًا)، والبداية هي جهة العنصر 0: أعلى القائمة، أو أسفل القائمة المعكوسة. أضف الصفحة في بداية البيانات: تحتفظ الصفوف الظاهرة على الشاشة بمكانها أثناء وصول الصفحة قبلها (وكذلك القائمة المعكوسة، متى ابتعد التمرير عن أسفلها)، وتُطلق القائمة الاستدعاء مرة أخرى عند الاقتراب التالي، أو فورًا إن بقيت القائمة قريبة من البداية بعد وصول الصفحة.

يُستدعى عندما يمرر المستخدم إلى هناك، أو عندما يوصل أمر تمرير القائمة إلى هناك (بما في ذلك `initialScrollIndex`)، لذا فالقائمة التي تُفتح عند أحدث عنصر لا تطلب شيئًا، أما التي تُفتح بـ `initialScrollIndex` قرب بدايتها فتطلب الصفحة التي قبله على الفور.

```rust tabs
let messages = signal(page_around(target)); // newest first, ending at an old message
let loading = stored(false);

let load_newer = move |_: &()| {
    if loading.replace(true) {
        return;
    }
    let newest = messages.with(|m| m[0].id);
    spawn(async move {
        if let Ok(response) = fetch(format!("https://api.example.com/messages?after={newest}")).await {
            let newer = parse_messages(&response.text());
            messages.update(|m| {
                m.splice(0..0, newer);
            });
        }
        loading.replace(false);
    });
};

virtual_list(move || messages.with(Vec::len), move |at| message_row(messages, at))
    .inverted(true)
    .on_load_more(load_older)
    .on_load_more_at_start(load_newer)
    .load_more_at_start_threshold(0.5)
    .flex_1()
```

```tsx tabs
const messages = signal<Message[]>(pageAround(target)); // newest first, ending at an old message
let loading = false;

const loadNewer = async () => {
  if (loading) return;
  loading = true;
  try {
    const newest = messages()[0].id;
    const newer: Message[] = await (await fetch(`https://api.example.com/messages?after=${newest}`)).json();
    messages.set([...newer, ...messages()]);
  } finally {
    loading = false;
  }
};

<List
  each={messages()}
  inverted
  style={{ flex: 1 }}
  onLoadMore={loadOlder}
  onLoadMoreAtStart={loadNewer}
  loadMoreAtStartThreshold={0.5}
>
  {(message) => <Bubble message={message()} />}
</List>
```

بمجرد وصول أحدث رسالة، أوقف التحميل: فتصل الرسائل الجديدة عندئذٍ عند البداية كما في أي محادثة.

## Viewability

يُبلغ `onViewableItemsChange` (`.on_viewable_items_change(..)`) عن العناصر الظاهرة على الشاشة، لأغراض التحليلات، أو التشغيل التلقائي للفيديو المرئي، أو وسم الرسائل كمقروءة. في TSX يستلم `{ viewableItems, changed }`، وهي مصفوفات من العناصر `{ item, key, index, isViewable }`؛ وفي Rust يستلم `ViewableItems` مع أول صف مرئي وآخر صف مرئي (`viewable`) والصفوف التي تغيرت حالتها (`changed()`). تُحسب قابلية الظهور في الجانب الأصلي (native)؛ ولا يصل إلى شيفرتك سوى التغييرات.

| `viewabilityConfig` | Rust | الوصف |
|---|---|---|
| `itemVisibleThreshold` | `Viewability { item_visible_threshold, .. }` | مقدار الجزء الذي يجب أن يكون مرئيًا من العنصر، من 0 إلى 1. |
| `viewAreaCoverageThreshold` | `Viewability { view_area_coverage_threshold, .. }` | مقدار الجزء من نافذة العرض الذي يجب أن يغطيه العنصر، من 0 إلى 1. |
| `minimumViewTime` | `.minimum_view_time(Duration)` | عدد الميلي ثانية التي يجب أن يبقى فيها العنصر قابلًا للظهور قبل الإبلاغ عنه. |

من دون عتبة، يُحتسب أي بكسل مرئي.

```rust tabs
let playing = signal(None::<usize>);

virtual_list(count, move |at| video_card(videos.clone(), at))
    .estimated_item_size(px(300.0))
    .viewability(Viewability {
        item_visible_threshold: Some(Percentage(0.6)),
        ..Viewability::default()
    })
    .minimum_view_time(Duration::from_millis(250))
    .on_viewable_items_change(move |rows: &ViewableItems| {
        playing.set(rows.viewable.map(|(first, _)| first))
    })
    .flex_1()
```

```tsx tabs
<List
  each={videos}
  estimatedItemSize={300}
  style={{ flex: 1 }}
  keyExtractor={(v) => v.slug}
  viewabilityConfig={{ itemVisibleThreshold: 0.6, minimumViewTime: 250 }}
  onViewableItemsChange={({ viewableItems }) => playing.set(viewableItems[0]?.key ?? null)}
>
  {(v) => <VideoCard video={v()} />}
</List>
```

<a id="scrolling-from-code"></a>

## التمرير من الشيفرة

أعطِ القائمة مرجعًا (ref) (`element_ref()` و`.element_ref(&list)` في Rust، و`ref` في TSX):

| Rust | TSX | الوصف |
|---|---|---|
| `scroll_to_index(index, view_position, view_offset, animated)` | `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | يمرر العنصر `index` إلى المجال المرئي. يحدد موضع العرض مكانه: 0 عند بداية نافذة العرض (الافتراضي)، و0.5 في المنتصف، و1 عند النهاية؛ ويزيحه إزاحة العرض أكثر. |
| `scroll_to_offset(offset, animated)` | `scrollToOffset({ offset, animated? })` | يمرر إلى إزاحة في المحتوى على امتداد محور القائمة. |
| `scroll_to_end(animated)` | `scrollToEnd({ animated? })` | يمرر إلى نهاية المحتوى (بداية القائمة المعكوسة). |
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | يمرر إلى إزاحة، كما في scroll view. |

```rust tabs
let list = element_ref();

virtual_list(count, row).estimated_item_size(px(48.0)).flex_1().element_ref(&list)

list.scroll_to_index(120, percentage(0.5), px(0.0), true);
```

```tsx tabs
import { List, type ListRef } from "nsh";

let list!: ListRef;

<List ref={list} each={items} estimatedItemSize={48} style={{ flex: 1 }}>…</List>

list.scrollToIndex({ index: 120, viewPosition: 0.5 });
```

يُحَل التمرير إلى فهرس (وإلى النهاية) في الجانب الأصلي (native) بالأحجام المعروفة في تلك اللحظة: الصفوف المقيسة حيث قيست، والحجم المقدَّر في غيرها. ثم تتبع القائمة هدفها بينما تُقاس الصفوف المحيطة به، فتستقر عليه بدقة، إلى أن يمرر المستخدم أو تتغير العناصر. لفتح قائمة عند عنصر معيّن، استخدم `initialScrollIndex` (`.initial_scroll_index(..)`) بدلًا من التمرير بعد الإطار الأول.

<a id="a-settings-style-list"></a>

## قائمة بنمط الإعدادات

مظهر القائمة من شأن التطبيق: تضع القائمة الصفوف وتعيد تدويرها، أما الصفوف والفواصل والأسطح فهي عروضك (views). القائمة المجمّعة بنمط الإعدادات هي قائمة بحشوة وفاصل وصفين أول وأخير بحواف مستديرة. اجعلها مكونًا خاصًا بك واستخدمها في كل موضع يعرض فيه التطبيق إعدادات:

```rust tabs
use std::rc::Rc;

use nsh_core::{element::palette::NEUTRAL, prelude::*};

pub struct Setting {
    pub id: &'static str,
    pub label: &'static str,
}

pub fn settings_list(settings: Rc<Vec<Setting>>, on_select: impl Fn(&Setting) + 'static) -> impl IntoElement {
    let surface = AdaptiveColor::new(white(), NEUTRAL.shade(900));
    let on_select = Rc::new(on_select);
    let count = settings.len();
    view().flex_1().bg(AdaptiveColor::new(NEUTRAL.shade(100), NEUTRAL.shade(950))).child(
        virtual_list(count, move |at| {
            let (pressed, shown, on_select) = (settings.clone(), settings.clone(), on_select.clone());
            view()
                .on_press(move || on_select(&pressed[at.index()]))
                .role(AccessibilityRole::Button)
                .h_12()
                .justify_center()
                .bg(surface)
                .px_4()
                .active(|s| s.bg(NEUTRAL.shade(200)))
                .rounded_t(move || px(if at.is_first() { 12.0 } else { 0.0 }))
                .rounded_b(move || px(if at.is_last() { 12.0 } else { 0.0 }))
                .child(text(move || shown[at.index()].label))
        })
        .estimated_item_size(px(48.0))
        .content_padding(px(16.0))
        .separator(move || {
            view()
                .bg(surface)
                .child(view().ml_4().h(px(1.0)).bg(AdaptiveColor::new(NEUTRAL.shade(200), NEUTRAL.shade(800))))
        })
        .flex_1(),
    )
}
```

```tsx tabs
import { List, Text, View } from "nsh";

type Setting = { id: string; label: string };

function SettingsList(props: { each: Setting[]; onSelect: (s: Setting) => void }) {
  return (
    <View class="flex-1 bg-neutral-100 dark:bg-neutral-950">
      <List
        each={props.each}
        estimatedItemSize={48}
        style={{ flex: 1 }}
        contentStyle={{ padding: 16 }}
        separator={() => (
          <View class="bg-white dark:bg-neutral-900">
            <View class="ml-4 h-px bg-neutral-200 dark:bg-neutral-800" />
          </View>
        )}
      >
        {(s, i) => (
          <View
            onPress={() => props.onSelect(s())}
            role="button"
            class="h-12 justify-center bg-white px-4 active:bg-neutral-200 dark:bg-neutral-900"
            classList={{ "rounded-t-xl": i() === 0, "rounded-b-xl": i() === props.each.length - 1 }}
          >
            <Text>{s().label}</Text>
          </View>
        )}
      </List>
    </View>
  );
}
```

<a id="performance-notes"></a>

## ملاحظات الأداء

- تُوزَّع كل خلية بمفردها، لذا لا يعيد التمرير توزيع سوى الخلايا التي تغيرت. أبقِ الصفوف ضحلة وتجنب قراءة signals في الصفوف التي تتغير في كل إطار.
- يطلب الجانب الأصلي (native) الخلايا على دفعات، بحد أقصى عدة جولات في الإطار الواحد، تُدمج في تحديث واحد؛ فتربط الحركة السريعة (fling) خلايا كثيرة في إطار واحد دون استدعاء لشيفرتك لكل خلية. أما صفوف Rust فتُربط في النواة نفسها، ضمن commit الذي يحتاج إليها.
- استخدم [`nsh test --trace` مع خطوة `scroll`](./testing-and-trace.md#scrolling) لقياس كلفة صفوفك في كل إطار.

<a id="related"></a>

## ذات صلة

- [عنصر `List`](../elements/list.md): المرجع.
- [التمرير](./scrolling.md): خصائص التمرير التي تشترك فيها القوائم مع scroll views.
- [التفاعلية](./reactivity.md): لماذا تقرأ الصفوف موضعها في الارتباطات (bindings).
- [الأداء](./performance.md): قياس القوائم.
