---
title: "List"
description: "قائمة افتراضية تعيد تدوير العناصر: الصفوف والأعمدة والرؤوس الثابتة وقوائم الدردشة المعكوسة وقابلية الرؤية والتمرير إلى العناصر."
order: 50
group: primitives
demo: el-list
source_hash: 6e5480c9dd9e1df4
---

# القائمة

يعرض `List` بيانات طويلة أو غير محدودة. الصفوف القريبة من منطقة العرض فقط هي الموجودة: عندما يمرّر المستخدم، تُعاد تدوير الصفوف التي تغادر لتحل محلها الصفوف الداخلة. تُحسب أيضًا الصفوف الموجودة ومواضعها وأعمدتها والرؤوس الثابتة وقابلية المشاهدة كلها بشكل أصلي، لذا فإن تمرير قائمة من آلاف العناصر لا يكلّف أكثر من تمرير قائمة من عشرين عنصرًا. في Rust تُنشأ القائمة باستخدام `virtual_list(count, |at| row)`، وفي TSX باستخدام `<List>` من `nsh`.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Contact {
    id: usize,
    name: String,
}

fn app() -> impl IntoElement {
    let contacts = signal(
        (0..1000).map(|i| Contact { id: i, name: format!("Contact {}", i + 1) }).collect::<Vec<_>>(),
    );
    virtual_list(move || contacts.with(|c| c.len()), move |at| {
        view().h(px(56.0)).px_4().justify_center().child(
            text(move || contacts.with(|c| format!("{}. {}", at.index() + 1, c[at.index()].name)))
                .text_base(),
        )
    })
    .estimated_item_size(px(56.0))
    .flex_1()
}
```

```tsx tabs
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Contact ${i + 1}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={56} style={{ flex: 1 }}>
      {(contact, index) => (
        <View style={{ height: 56, paddingHorizontal: 16, justifyContent: "center" }}>
          <Text style={{ fontSize: 16 }}>
            {index() + 1}. {contact().name}
          </Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

في TSX، المكوّن `List` عام (generic): يتحقق `List<T>` من أن `each` ودالة الصف متفقان على نوع العنصر، والذي يستنتجه TypeScript من `each` (راجع [واجهة List البرمجية](../modules/nsh-list.md)). في Rust، تأخذ `virtual_list` عدد الصفوف (قيمة أو إشارة signal أو إغلاقًا closure: تنمو القائمة وتتقلص في مكانها) والدالة التي تبني الصف عند `Position` معيّن؛ وتقرأ الصفوف بيانات المكوّن عبر `at.index()`.

للقوائم القصيرة التي يجب أن تكون صفوفها كلها موجودة (صفحة إعدادات، نموذج)، يكون استخدام [`Each`](./control-flow.md) داخل [scroll view](./scroll.md) أبسط. أما للقائمة المنسّقة كجدول مجمّع، فراجع [قائمة بنمط الإعدادات](../docs/lists.md#a-settings-style-list). ويتناول [دليل القوائم](../docs/lists.md) الأنماط الشائعة: التحميل اللانهائي، والمحادثة، والأقسام.

<a id="rows-are-recycled"></a>

## إعادة تدوير الصفوف

تُنفَّذ دالة الصف مرة واحدة لكل خلية، لا مرة لكل عنصر. وعند إعادة استخدام خلية لعنصر آخر يتغير موضعها (في TSX: الموصّلان `item()` و`index()`؛ وفي Rust: `at.index()`) ويتحدّث كل ما يقرأه:

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| {
    text(move || messages.with(|m| m[at.index()].body.clone()))
})
```

```tsx tabs
<List each={messages()}>
  {(message) => <Text>{message().body}</Text>}
</List>
```

لذلك احتفظ بحالة كل عنصر في بياناتك (مفهرسة بالمعرّف id)، لا في إشارات signals تُنشأ داخل دالة الصف: فمثل هذه الإشارة تبقى مع الخلية وتظهر على عنصر آخر.

تُخفى الخلايا التي تنتظر عنصرها التالي ما دام صفّها قد اختفى أو ظهر عبر خلية أخرى، بحيث تصادف قارئات الشاشة واللمسات واختبارات واجهة المستخدم كل صف مرة واحدة فقط.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `each` | `virtual_list(count, ..)` | `readonly T[]` | | العناصر. |
| `children` | `virtual_list(.., \|at\| row)` | `(item: () => T, index: () => number) => JSX.Element` | | يعرض صفًا واحدًا. |
| `estimatedItemSize` | `.estimated_item_size(px(..))` | `number` | `50` | حجم العناصر التي لم تُقَس بعد، بالنقاط. التقديرات القريبة تُبقي شريط التمرير ثابتًا. |
| `horizontal` | `.horizontal()` | `boolean` | `false` | يمرّر أفقيًا. |
| `viewport` | `.viewport(ListViewport::..)` | `"own" \| "parent"` | `"own"` | `"own"`: تتمرّر القائمة داخل scroll view خاص بها. `"parent"`: تمتد القائمة بطولها الكامل ضمن تخطيط عنصرها الأب، وتعرض الصفوف القريبة من منطقة عرض scroll view المحيط بها، والذي يمرّرها مع بقية الصفحة (راجع [القوائم داخل صفحة](../docs/lists.md#lists-in-a-page-viewportparent)). يُحدَّد عند إنشاء القائمة. |
| `numColumns` | `.columns(n)` | `number` | `1` | عدد العناصر في كل صف (القوائم العمودية). |
| `inverted` | `.inverted()` | `boolean` | `false` | تُرتَّب من النهاية، والعنصر 0 أخيرًا (نمط المحادثة): تبدأ ممرَّرة إلى النهاية وتحافظ على بعدها عن النهاية عند تغيّر المحتوى. |
| `maintainVisibleContentPosition` | `.follow_end(px(threshold))` | `{ autoscrollToBottomThreshold?: number }` | | للقوائم غير المعكوسة: عند نهاية المحتوى أو ضمن هذا العدد من النقاط منها، تبقى القائمة عند النهاية مع نمو المحتوى أو تقلّص منطقة العرض؛ وإذا مُرّرت إلى أعلى أكثر، يبقى المحتوى المرئي في مكانه. |
| `stickyHeaderIndices` | `.sticky_header_indices([..])` | `number[]` | | عناصر تلتصق بالبداية عند تجاوزها بالتمرير (عمود واحد، غير معكوسة). |
| `contentStyle` | `.content_padding(..)`، `.content_padding_x(..)`، `.row_gap(..)`، `.column_gap(..)`، … | `ListContentStyle` | | الحشو والفجوات للمحتوى، بالنقاط: `padding`، `paddingHorizontal`، `paddingVertical`، `paddingTop`، `paddingRight`، `paddingBottom`، `paddingLeft`، `gap`، `rowGap`، `columnGap`. |
| `contentClass` | | `string` | | الحشو والفجوات للمحتوى على شكل فئات classes (`p-*`، `gap-*`)؛ وتتغلّب عليها `contentStyle`. |
| `header` | `.header(el)` | `ListSlot` | | قبل العناصر: مكوّن (`Header`) أو عنصر (`<Header />`). |
| `footer` | `.footer(el)` | `ListSlot` | | بعد العناصر. |
| `empty` | `.empty(el)` | `ListSlot` | | يُعرض بدلًا من العناصر عندما تكون `each` فارغة. |
| `separator` | `.separator(\|\| el)` | `ListSlot` | | بين العناصر (عمود واحد). |
| `initialScrollIndex` | `.initial_scroll_index(i)` | `number` | | يمرّر إلى هذا العنصر قبل الإطار الأول. |
| `keyExtractor` | `.keys(\|\| ids)` | `(item: T, index: number) => string` | `item.key` أو `item.id` أو الفهرس | مفتاح العنصر في رموز قابلية المشاهدة. في Rust، هوية الصفوف، بحيث تحتفظ الصفوف بخلاياها وأحجامها عندما تأتي صفوف قبلها أو تذهب. |
| `onLoadMore` | `.on_load_more(..)` | `() => void` | | النهاية قريبة: حمّل المزيد. |
| `loadMoreThreshold` | `.load_more_threshold(viewports)` | `number` | `1` | مدى القرب من النهاية (بوحدات منطقة العرض) الذي يُطلق عنده `onLoadMore`. |
| `onLoadMoreAtStart` | `.on_load_more_at_start(..)` | `() => void` | | البداية قريبة، بعد أن حرّك المستخدم القائمة أو أمر تمرير: حمّل ما يسبق العنصر الأول. |
| `loadMoreAtStartThreshold` | `.load_more_at_start_threshold(viewports)` | `number` | `1` | مدى القرب من البداية (بوحدات منطقة العرض) الذي يُطلق عنده `onLoadMoreAtStart`. |
| `onViewableItemsChange` | `.on_viewable_items_change(..)` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | أصبحت عناصر قابلة للمشاهدة أو توقفت عن كونها كذلك. |
| `viewabilityConfig` | `.viewability(..)`، `.minimum_view_time(..)` | `ViewabilityConfig` | | متى تُعدّ العناصر قابلة للمشاهدة (أدناه). |
| `refreshing` | `.refreshing(..)` | `boolean` | | يظهر مؤشر السحب للتحديث. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | | سحب المستخدم للتحديث. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | | يرسم التطبيق مؤشره الخاص بارتفاع `height` نقطة: يُخفى مؤشر المنصة، ويحدث التحديث عندما يبلغ السحب `height`، ويُبقي التحديث `height` فوق المحتوى. الارتفاع 0 أو أقل يعني عدم وجود مؤشر. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | | قيمة متحركة تُغذّى بمقدار سحب القائمة إلى ما بعد أعلاها (0 في حالة السكون، وتزداد مع السحب؛ والمساحة المحجوزة فوق المحتوى أثناء التحديث: `height` مع `refreshIndicator`)، لمؤشر التطبيق. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | يظهر مؤشر التمرير: مؤشر المنصة، أو [الشريط المدمج](./scrollbar.md#built-in-bars) للتطبيق متى ضبط سمة theme؛ والكائن هو سمة خاصة بالعرض نفسه. على سطح المكتب وفي متصفحات سطح المكتب يحتفظ العرض الأفقي به: فهو شريط التمرير الخاص بالفأرة. |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | قيمة متحركة تُغذّى بإزاحة التمرير، للرسوم المتحركة المرتبطة بالتمرير. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(..)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | هل يؤدي السحب إلى إخفاء لوحة المفاتيح. |
| `style` | دوال `Styled` | `StyleProp<ViewStyle>` | | النمط الخاص بالقائمة (تحتاج إلى حجم محدود: `flex: 1` أو ارتفاع). |
| `testID` | `.test_id(id)` | `string` | | المعرّف الذي تجد به اختبارات واجهة المستخدم scroll view الخاص بالقائمة (`nsh test` الخاص بـ `id:`، وXCUITest، وUI Automator). |
| `ref` | `.element_ref(&handle)` | `ListRef \| (node: ListRef) => void` | | مرجع ref القائمة (راجع [دوال ref](#ref-methods)). |

تقبل القوائم أيضًا خصائص التمرير الخاصة بـ [`Scroll`](./scroll.md#scrolling) (دوال `Scrollable` في Rust):
`pagingEnabled`، `snapToInterval`، `snapToOffsets`، `snapToAlignment`، `disableIntervalMomentum`، `decelerationRate`،
`bounces`، `contentInset`، `contentOffset`، `keyboardShouldPersistTaps`، `scrollEventThrottle` و`scrollable`.
تحافظ القوائم على مقياسها.

الخصائص التي يقبلها كل عنصر ([الخصائص المشتركة](./index.md#common-props)) تنتقل إلى scroll view الخاص بالقائمة كما هي:
`testID` و`accessibilityLabel` وبقية خصائص إمكانية الوصول، والأنماط، و`onLayout`، وخصائص اللمس والمستجيب responder.
تجد اختبارات واجهة المستخدم القائمة عبر `testID` كما تجد أي عرض آخر.

`ViewabilityConfig` (في Rust: `Viewability { item_visible_threshold, view_area_coverage_threshold }` و`.minimum_view_time(..)`):

| الحقل | النوع | الوصف |
|---|---|---|
| `itemVisibleThreshold` | `number` | مقدار ما يجب أن يظهر من العنصر، من 0 إلى 1. |
| `viewAreaCoverageThreshold` | `number` | مقدار ما يجب أن يغطيه العنصر من منطقة العرض، من 0 إلى 1. وبدون أي من العتبتين، يُحتسب أي بكسل مرئي. |
| `minimumViewTime` | `number` | عدد المللي ثانية التي يجب أن تبقى فيها العناصر قابلة للمشاهدة قبل الإبلاغ عنها. |

`ViewToken<T>` هو `{ item, key, index, isViewable }`. يتلقى مستمع Rust `ViewableItems`: `indices()` هو نطاق الصفوف القابلة للمشاهدة، و`changed()` الصفوف التي أتت أو ذهبت.

<a id="events"></a>

## الأحداث

| الحدث | Rust | البيانات المرافقة | متى |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | تغيّرت الإزاحة. |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` | بدأ السحب / توقف. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | بدأ الانزلاق / توقف. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | استقر التمرير. |
| `onLoadMore` | `.on_load_more` | لا شيء | ضمن `loadMoreThreshold` من وحدات منطقة العرض من النهاية. |
| `onLoadMoreAtStart` | `.on_load_more_at_start` | لا شيء | ضمن `loadMoreAtStartThreshold` من وحدات منطقة العرض من البداية، مرة واحدة لكل اقتراب بعد تمرير. |
| `onViewableItemsChange` | `.on_viewable_items_change` | `{ viewableItems, changed }` (`ViewableItems`) | تغيّرت قابلية المشاهدة. |
| `onRefresh` | `.on_refresh` | لا شيء | سُحبت القائمة للتحديث. |

<a id="ref-methods"></a>

## دوال ref

| الدالة | Rust | الوصف |
|---|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, percentage(0.5), px(0.0), animated)` | يمرّر العنصر `index` إلى المجال المرئي. `viewPosition` يحدّد موضعه: 0 عند بداية منطقة العرض (الافتراضي)، و0.5 في المنتصف، و1 عند النهاية؛ و`viewOffset` يزيحه أكثر. يُحسم بشكل أصلي باستخدام أحجام العناصر الحالية (المقيسة أو المقدَّرة). |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(px(..), animated)` | يمرّر إلى إزاحة على طول محور القائمة. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | يمرّر إلى نهاية المحتوى (بداية القائمة المعكوسة). |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(..), animated)` | يمرّر إلى إزاحة. |

<a id="examples"></a>

## أمثلة

شبكة مع رأس وقابلية مشاهدة:

```rust tabs
let visible = signal(SharedString::default());
let list = element_ref();

virtual_list(move || photos.with(|p| p.len()), move |at| {
    image(move || photos.with(|p| p[at.index()].url.clone())).h(px(120.0)).rounded(px(8.0))
})
.element_ref(&list)
.columns(3)
.estimated_item_size(px(120.0))
.content_padding(px(12.0))
.row_gap(px(8.0))
.column_gap(px(8.0))
.viewability(Viewability { item_visible_threshold: Some(Percentage(0.5)), ..Viewability::default() })
.on_viewable_items_change(move |items: &ViewableItems| {
    visible.set(format!("{} visible", items.indices().count()).into())
})
.header(
    text("Jump to 60")
        .on_press(move || list.scroll_to_index(60, percentage(0.5), px(0.0), true)),
)
.flex_1()
```

```tsx tabs
const visible = signal("");
let list!: ListRef;

<List
  ref={list}
  each={photos}
  numColumns={3}
  estimatedItemSize={120}
  contentStyle={{ padding: 12, gap: 8 }}
  viewabilityConfig={{ itemVisibleThreshold: 0.5 }}
  onViewableItemsChange={({ viewableItems }) => visible.set(`${viewableItems.length} visible`)}
  header={<Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>}
  style={{ flex: 1 }}
>
  {(photo) => <Image src={photo().url} style={{ height: 120, borderRadius: 8 }} />}
</List>;
```

محادثة:

```rust tabs
virtual_list(move || messages.with(|m| m.len()), move |at| bubble(messages, at))
    .keys(move || messages.with(|m| m.iter().map(|m| m.id).collect::<Vec<_>>()))
    .inverted()
    .estimated_item_size(px(64.0))
    .keyboard_dismiss_mode(KeyboardDismissMode::Interactive)
    .flex_1()
```

```tsx tabs
<List each={messages()} inverted estimatedItemSize={64} keyboardDismissMode="interactive" style={{ flex: 1 }}>
  {(m) => <Bubble message={m()} />}
</List>
```

العنصر 0 هو أحدث رسالة، ويُرسم في الأسفل؛ والرسائل الجديدة المضافة في بداية العناصر تظهر دون أن تحرّك ما يقرأه المستخدم.

<a id="platform-notes"></a>

## ملاحظات المنصات

- إدراج عناصر فوق الصفوف المرئية يُبقي الصفوف المرئية في مكانها على المنصتين.
- القوائم الأفقية في التخطيطات من اليمين إلى اليسار تُعكس بشكل أصلي.
- الرؤوس الثابتة تُثبَّت بشكل أصلي في كل إطار تمرير.
