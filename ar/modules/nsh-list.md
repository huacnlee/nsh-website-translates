---
title: "List"
description: "List، قائمة افتراضية (Virtualized) تعيد تدوير عناصرها فوق عرض تمرير أصلي (native scroll view)، مع جميع خصائصها (props) وأحداثها (events) ودوال المرجع (ref methods)."
order: 2.1
source_hash: 6aa08fac2fd24e8c
---

# List

يصدّر `nsh` المكوّن `List`: قائمة افتراضية (virtualized) مبنية على عرض تمرير أصلي. لا يوجد إلا الصفوف القريبة من منفذ العرض، وتُعاد الاستفادة من خلاياها أثناء التمرير. تُحسب أصلياً كل من الصفوف الموجودة ومواضعها والأعمدة والرؤوس الثابتة وقابلية الظهور (viewability)، لذلك لا يشغّل تمرير قائمة من عشرة آلاف عنصر أي JS سوى ارتباطات الصفوف التي تتغير عند إعادة استخدام الخلية.

```ts
import { List, type ListProps, type ViewToken, type ViewabilityConfig } from "nsh";
```

راجع [القوائم](../docs/lists.md) للاطلاع على الدليل، و[`<List>`](../elements/list.md) لخصائص هذا العنصر.

<a id="list-1"></a>

## List

```ts
function List<T>(props: ListProps<T>): JSX.Element;
```

```tsx
import { List, mount, Text, View } from "nsh";

const contacts = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Contact ${i}` }));

function App() {
  return (
    <List each={contacts} estimatedItemSize={48} style={{ flex: 1 }}>
      {(item, index) => (
        <View style={{ height: 48, paddingHorizontal: 16, justifyContent: "center", backgroundColor: index() % 2 ? "#f8fafc" : "#fff" }}>
          <Text>{item().name}</Text>
        </View>
      )}
    </List>
  );
}

mount(App);
```

<a id="rows-are-recycled"></a>

### إعادة تدوير الصفوف

`children` دالة تعرض **خلية واحدة**. تعمل مرة واحدة لكل خلية، لا مرة لكل عنصر: عندما تخرج الخلية من نطاق الرؤية تُعاد الاستفادة منها لعنصر آخر، فيتغير `item()` و`index()` (وكلاهما accessor). اقرأهما داخل تعابير JSX (`{item().name}`) لكي تتحدث الخلية عند إعادة استخدامها.

> [!WARNING]
> لا تحتفظ بحالة خاصة بكل عنصر في signals منشأة داخل دالة الصف: فالخلية تُستخدم لعناصر أخرى، وسيتبع الـ signal الخلية لا العنصر. احتفظ بها في بياناتك، مفهرسة بالمعرّف (مثلاً signal يحمل `Set` من معرّفات العناصر المحددة).

<a id="props"></a>

## الخصائص

يجمع `ListProps<T>` بين خصائص القائمة نفسها وخصائص التمرير المشتركة مع `<Scroll>` والخصائص التي يقبلها كل عنصر، وتذهب هذه الأخيرة إلى عرض التمرير الخاص بالقائمة.

<a id="data-and-rendering"></a>

### البيانات والعرض

| الخاصية | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|
| `each` | `readonly T[]` | (مطلوب) | العناصر. مرّر قيمة signal (`each={items()}`) لتتبع التغييرات؛ إدراج عناصر فوق الصفوف المرئية يُبقي تلك الصفوف في مكانها. |
| `children` | `(item: () => T, index: () => number) => JSX.Element` | (مطلوب) | تعرض صفاً واحداً (انظر أعلاه). |
| `estimatedItemSize` | `number` | `50` | حجم الصفوف التي لم تُقَس بعد، بالنقاط (points)، على امتداد محور القائمة. كلما كانت التقديرات أقرب، كان مؤشر التمرير و`scrollToIndex` أدق. |
| `numColumns` | `number` | `1` | عدد العناصر في الصف (للقوائم العمودية): شبكة. |
| `horizontal` | `boolean` | `false` | يتمرر أفقياً. |
| `inverted` | `boolean` | `false` | يرتب المحتوى من النهاية، ويكون العنصر 0 الأخير (نمط الدردشة)؛ يبدأ متمرراً إلى النهاية ويحافظ على بعده عن النهاية عند تغيّر المحتوى. |
| `stickyHeaderIndices` | `number[]` | | عناصر تلتصق بالبداية عند تجاوزها بالتمرير (عمود واحد، دون عكس). |
| `header` | `ListSlot` | | يُعرض قبل العناصر. |
| `footer` | `ListSlot` | | يُعرض بعد العناصر. |
| `empty` | `ListSlot` | | يظهر بدل العناصر عندما يكون `each` فارغاً. |
| `separator` | `ListSlot` | | يُعرض بين العناصر (عمود واحد). |
| `keyExtractor` | `(item: T, index: number) => string` | `item.key` أو `item.id` أو الفهرس | مفتاح العنصر في رموز قابلية الظهور. |
| `initialScrollIndex` | `number` | | يتمرر إلى هذا العنصر قبل الإطار الأول. |
| `contentStyle` | `ListContentStyle` | | الحشو والفجوات للمحتوى: `padding`، `paddingHorizontal`، `paddingVertical`، `paddingTop`، `paddingRight`، `paddingBottom`، `paddingLeft`، `gap`، `rowGap`، `columnGap` (أرقام). |
| `contentClass` | `string` | | الحشو والفجوات للمحتوى على شكل classes (`p-*`، `gap-*`)؛ وتتغلب عليها `contentStyle`. |
| `style` | `StyleProp<ViewStyle>` | | نمط القائمة نفسها (حدّد لها حجماً: `flex: 1` أو ارتفاعاً). |
| `testID` | `string` | | المعرّف الذي تعثر به اختبارات واجهة المستخدم على عرض التمرير الخاص بالقائمة (`id:` في `nsh test`، وXCUITest، وUI Automator). |
| `ref` | `ListRef \| ((node: ListRef) => void)` | | انظر [دوال ref](#ref-methods). |

`ListSlot` إما مكوّن (`Header`) أو عنصر (`<Header />`).

<a id="loading-refreshing-and-viewability"></a>

### التحميل والتحديث وقابلية الظهور

| الخاصية | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|
| `onLoadMore` | `() => void` | | تُستدعى عندما تصبح النهاية ضمن `loadMoreThreshold` من أطوال منفذ العرض: حمّل المزيد. |
| `loadMoreThreshold` | `number` | `1` | مدى القرب من النهاية (بأطوال منفذ العرض) الذي يُطلق عنده `onLoadMore`. |
| `onLoadMoreAtStart` | `() => void` | | تُستدعى عندما تصبح البداية ضمن `loadMoreAtStartThreshold` من أطوال منفذ العرض بعد أن حرّك المستخدم القائمة أو أمر تمرير: حمّل ما يسبق العنصر الأول. |
| `loadMoreAtStartThreshold` | `number` | `1` | مدى القرب من البداية (بأطوال منفذ العرض) الذي يُطلق عنده `onLoadMoreAtStart`. |
| `refreshing` | `boolean` | | يظهر مؤشر السحب للتحديث. |
| `onRefresh` | `() => void` | | يفعّل السحب للتحديث؛ اضبط `refreshing` أثناء التحميل. |
| `refreshIndicator` | `{ height: number }` | | يرسم التطبيق مؤشر السحب للتحديث الخاص به، بارتفاع `height`، بدل المؤشر الافتراضي. |
| `pullValue` | `AnimatedValue` | | تُغذّى بمقدار سحب القائمة إلى ما بعد أعلاها، لاستخدامه في ذلك المؤشر. |
| `onViewableItemsChange` | `(info: { viewableItems: ViewToken<T>[]; changed: ViewToken<T>[] }) => void` | | العناصر التي أصبحت قابلة للظهور أو توقفت عن ذلك. |
| `viewabilityConfig` | `ViewabilityConfig` | | متى يُعدّ العنصر قابلاً للظهور. |

```ts
interface ViewToken<T> {
  item: T;
  key: string;
  index: number;
  isViewable: boolean;
}

interface ViewabilityConfig {
  /** How much of the viewport an item must cover to count as viewable, from 0 to 1. */
  viewAreaCoverageThreshold?: number;
  /** How much of an item must be visible, from 0 to 1. Without either threshold, any visible pixel counts. */
  itemVisibleThreshold?: number;
  /** Milliseconds items must stay viewable before they are reported. */
  minimumViewTime?: number;
}
```

<a id="scrolling"></a>

### التمرير

| الخاصية | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|
| `scrollbar` | `boolean \| ScrollbarTheme` | `true` | يظهر مؤشر التمرير: مؤشر المنصة، أو [الشريط المدمج](../elements/scrollbar.md#built-in-bars) في التطبيق؛ والكائن يمثل سمة (theme) خاصة بالعرض نفسه. |
| `scrollable` | `boolean` | `true` | يستطيع المستخدم تمريره. |
| `bounces` | `boolean` | `true` | التمرير الزائد (overscroll) إلى ما بعد الحواف. |
| `pagingEnabled` | `boolean` | `false` | يتوقف عند مضاعفات منفذ العرض. |
| `snapToInterval` | `number` | `0` | يتوقف عند مضاعفات هذا الطول (0: معطّل). |
| `snapToOffsets` | `number[]` | | يتوقف عند هذه الإزاحات. |
| `snapToAlignment` | `"start" \| "center" \| "end"` | `"start"` | أي نقطة من العنصر تتحاذى مع منفذ العرض عند استخدام `snapToInterval`. |
| `disableIntervalMomentum` | `boolean` | `false` | تتحرك الحركة السريعة (fling) نقطة توقف واحدة على الأكثر. |
| `decelerationRate` | `"normal" \| "fast" \| number` | حسب المنصة | سرعة تباطؤ الحركة السريعة (`0.998` / `0.99`، أو السرعة المتبقية لكل ميلي ثانية). |
| `contentInset` | `Partial<Edges>` | | مساحة حول المحتوى. |
| `contentOffset` | `{ x?, y? }` | | موضع البداية. |
| `keyboardShouldPersistTaps` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | هل تُخفي النقرة لوحة المفاتيح (`"never"`: النقرة تخفيها فقط). |
| `keyboardDismissMode` | `"none" \| "on-drag" \| "interactive"` | `"none"` | هل يُخفي السحب لوحة المفاتيح. |
| `scrollEventThrottle` | `number` | | الحد الأدنى بالميلي ثانية بين أحداث `onScroll` (حدث واحد على الأكثر لكل إطار في جميع الأحوال). |
| `scrollValue` | `AnimatedValue` | | [قيمة متحركة](./nsh.md#animation) تُغذّى بإزاحة التمرير (المحور الرئيسي) على خيط واجهة المستخدم، للتأثيرات المرتبطة بالتمرير. |

<a id="scroll-events"></a>

### أحداث التمرير

| الحدث | البيانات المرسلة | متى |
|---|---|---|
| `onScroll` | `ScrollEvent`: `{ offset, contentSize, size, zoomScale }` | أثناء التمرير. |
| `onScrollDragStart` | `{ offset }` | يبدأ السحب. |
| `onScrollDragEnd` | `{ offset }` | يُرفع الإصبع. |
| `onMomentumStart` | `{ offset }` | تبدأ حركة انسيابية بعد السحب. |
| `onMomentumEnd` | `{ offset }` | تنتهي الحركة الانسيابية (وكذلك عندما يوقفها سحب جديد). |
| `onScrollEnd` | `{ offset }` | استقر التمرير. |

تقبل القوائم أيضاً الخصائص التي يقبلها كل عنصر ([الخصائص المشتركة](../elements/index.md)).

<a id="ref-methods"></a>

## دوال ref

يتلقى `ref` الخاص بالقائمة `ListRef`، مع الدوال التالية إضافة إلى دوال `ViewRef`:

| الدالة | الوصف |
|---|---|
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | تمرّر العنصر `index` إلى نطاق الرؤية. يحدد `viewPosition` موضعه: `0` عند بداية منفذ العرض (الافتراضي)، `0.5` في المنتصف، `1` عند النهاية؛ ويزيحه `viewOffset` أكثر. تُحسم أصلياً باستخدام أحجام الصفوف المقيسة (أو المقدّرة). |
| `scrollToOffset({ offset, animated? })` | تمرّر إلى إزاحة في المحتوى على امتداد محور القائمة. |
| `scrollToEnd({ animated? })` | تمرّر إلى نهاية المحتوى (بداية القائمة المعكوسة). |
| `scrollTo({ x?, y?, animated? })` | تمرّر إلى إزاحة. |

```tsx
import { List, type ListRef, Text, View } from "nsh";

let list!: ListRef;

<View style={{ flex: 1 }}>
  <Text onPress={() => list.scrollToIndex({ index: 60, viewPosition: 0.5 })}>Jump to 60</Text>
  <List ref={list} each={items} numColumns={3} estimatedItemSize={90} style={{ flex: 1 }}
        contentStyle={{ padding: 12, gap: 8 }}>
    {(item) => <View style={{ height: 90, backgroundColor: "#e0e7ff" }}><Text>{item().title}</Text></View>}
  </List>
</View>
```

<a id="examples"></a>

## أمثلة

دردشة: أحدث رسالة في الأسفل، وتُحمَّل الرسائل الأقدم عند التمرير للأعلى.

```tsx
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
    <View style={{ alignSelf: m().mine ? "flex-end" : "flex-start", maxWidth: "75%", padding: 10, borderRadius: 14, backgroundColor: m().mine ? "#6366f1" : "#e2e8f0" }}>
      <Text style={{ color: m().mine ? "#fff" : "#0f172a" }}>{m().text}</Text>
    </View>
  )}
</List>
```

السحب للتحديث:

```tsx
const refreshing = signal(false);
const refresh = async () => {
  refreshing.set(true);
  items.set(await load());
  refreshing.set(false);
};

<List each={items()} refreshing={refreshing()} onRefresh={refresh} style={{ flex: 1 }}>
  {(item) => <Text style={{ padding: 16 }}>{item().title}</Text>}
</List>
```

## ListItemsProps

```ts
type ListItemsProps<T> = Pick<ListProps<T>,
  "each" | "children" | "keyExtractor" | "stickyHeaderIndices" | "initialScrollIndex"
  | "onViewableItemsChange" | "viewabilityConfig" | "refreshing" | "onRefresh"
  | "onLoadMore" | "loadMoreThreshold"
  | "header" | "footer" | "empty">;
```

هو نصف `ListProps` المعني بالبيانات والصفوف: ما تمرره إلى مكوّن خاص بك يرتب القائمة بنفسه، مثل قائمة إعدادات تغلّف `List` بحشوها وفواصلها الخاصة.
