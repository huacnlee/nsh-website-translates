---
title: "Scroll"
description: "عرض التمرير الأصلي: التمرير العمودي والأفقي، والتقسيم إلى صفحات والالتصاق، والسحب للتحديث، والتكبير والتصغير، وأحداث التمرير."
order: 40
group: primitives
demo: el-scroll
source_hash: a0ea652770335f03
---

# التمرير

`Scroll` هو عرض تمرير أصلي (UIScrollView على iOS وMac Catalyst، وScrollView على Android). يعرض جميع عناصره الفرعية بوصفها محتواه ويمرّرها أصليًا: التمرير والقذف (fling) والارتداد والالتصاق تعمل على المنصة نفسها، وبمعدل تحديث الشاشة. في Rust يُنشأ باستخدام `scroll()`، وفي TSX باستخدام `<Scroll>` من `nsh`.

```rust tabs
use nsh_core::prelude::*;

scroll().flex_1().child(
    view().p_4().gap_2().child(each(
        rows,
        |row: &Row| row.id,
        |row, _index| text(move || row.get().title),
    )),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }}>
  <View style={{ padding: 16, gap: 8 }}>
    <Each of={rows}>{(row) => <Text>{row().title}</Text>}</Each>
  </View>
</Scroll>
```

ينشئ عرض التمرير كل العناصر الفرعية، وهذا يناسب الصفحات متوسطة الحجم. أما للبيانات الطويلة أو غير المحدودة فاستخدم [قائمة](./list.md): فهي تنشئ الصفوف القريبة من منطقة العرض وتعيد تدويرها.

يحتاج عرض التمرير إلى حجم محدود على محوره: امنحه `flex: 1` (`.flex_1()`) أو ارتفاعًا داخل حاوية لها ارتفاع محدد. يُعرض محتواه بعرض عرض التمرير (وبارتفاعه عند التمرير الأفقي) وبالطول (العرض) الذي يحتاجه.

<a id="props"></a>

## الخصائص

إضافةً إلى [الخصائص المشتركة](./index.md#common-props) (مع كتابة `style` بوصفها `ViewStyle`). في Rust، خصائص التمرير هي دوال في السمة `Scrollable` التي تشترك فيها القوائم.

<a id="scrolling"></a>

### التمرير

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | يمرّر أفقيًا. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | يمكن للمستخدم تمريره. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | يظهر مؤشر التمرير: مؤشر المنصة، أو [الشريط المدمج](./scrollbar.md#built-in-bars) في التطبيق متى عيّن التطبيق سمة؛ والكائن هو سمة خاصة بالعرض نفسه. على سطح المكتب وفي متصفحات سطح المكتب يحتفظ العرض الأفقي به: فهو شريط تمرير الفأرة. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | التمرير الزائد خلف الحواف. |
| `pagingEnabled` | `.paging(..)` | `boolean` | `false` | يتوقف عند مضاعفات منطقة العرض. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | `0` | يتوقف عند مضاعفات هذا الطول (0: معطّل). |
| `snapToOffsets` | `.snap_offsets(..)` | `number[]` | | يتوقف عند هذه الإزاحات. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `"start"` | أي نقطة من العنصر تتماشى مع منطقة العرض عند استخدام `snapToInterval`. |
| `disableIntervalMomentum` | `.disable_interval_momentum(..)` | `boolean` | `false` | لا يتجاوز القذف نقطة التصاق واحدة. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | المنصة | سرعة تباطؤ القذف: السرعة المحتفظ بها لكل ميلي ثانية (`normal` 0.998، `fast` 0.99). |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | مسافة حول المحتوى. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | موضع البداية. |
| `contentStyle` | أنماط عرض المحتوى نفسه | `ViewStyle` | | نمط عرض يحيط بالعناصر الفرعية ويتمرر معها؛ `flexGrow: 1` يجعله بارتفاع منطقة العرض على الأقل (حالة فارغة متمركزة). |
| `contentClass` | أنماط عرض المحتوى نفسه | `string` | | مثل classes، مثلًا `"grow justify-center p-4"`. |
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | هل يؤدي السحب إلى إخفاء لوحة المفاتيح. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled" \| boolean` | `"never"` | هل تؤدي النقرة إلى إخفاء لوحة المفاتيح: `never` (النقرة تخفيها فقط)، `always` (تبقى ظاهرة)، `handled` (تبقى ظاهرة عندما يعالج شيء ما النقرة). |
| `scrollValue` | `.scroll_value(&value)` | `AnimatedValue` | | قيمة متحركة تُغذّى بإزاحة التمرير (على المحور الرئيسي)، للرسوم المتحركة المرتبطة بالتمرير. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | | الحد الأدنى للميلي ثانية بين أحداث `onScroll` (حدث واحد على الأكثر لكل إطار على أي حال). |

<a id="pull-to-refresh"></a>

### السحب للتحديث

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `refreshing` | `.refreshing(..)` | `boolean` | يظهر مؤشر التحديث الدوار. |
| `onRefresh` | `.on_refresh(..)` | `() => void` | سحب المستخدم للتحديث: ابدأ التحميل وعيّن `refreshing` حتى ينتهي. |
| `refreshIndicator` | `.refresh_indicator(Some(height))` | `{ height: number }` | يرسم التطبيق مؤشره الخاص بارتفاع `height` نقطة: يُخفى المؤشر الدوار الخاص بالمنصة، ويبدأ التحديث عندما يصل السحب إلى `height`، ويُبقي التحديث `height` فوق المحتوى. الارتفاع 0 أو أقل يعني عدم وجود مؤشر. |
| `pullValue` | `.pull_value(&value)` | `AnimatedValue` | قيمة متحركة تُغذّى بمقدار سحب العرض إلى ما بعد أعلاه (0 في حالة السكون، وتزداد مع السحب؛ والمسافة المحفوظة فوق المحتوى أثناء التحديث: `height` مع `refreshIndicator`)، لمؤشر التطبيق. |

```rust tabs
let refreshing = signal(false);

scroll()
    .flex_1()
    .refreshing(refreshing)
    .on_refresh(move || {
        refreshing.set(true);
        spawn(async move {
            load().await;
            refreshing.set(false);
        });
    })
    .child(content())
```

```tsx tabs
const refreshing = signal(false);
async function reload() {
  refreshing.set(true);
  await load();
  refreshing.set(false);
}

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>
  …
</Scroll>;
```

<a id="zooming"></a>

### التكبير

عند تعيين `maximumZoomScale` إلى قيمة أكبر من `minimumZoomScale` (`.zoom_range(min, max)` في Rust) يصبح المحتوى قابلًا للتكبير بالقرص (pinch)؛ وعند التكبير يتمرر في الاتجاهين. القوائم تحتفظ بمقياسها.

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | أصغر تكبير. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | أكبر تكبير. |
| `zoomScale` | `.zoom(..)` | `number` | | يكبّر إلى هذا المقياس عند تغيّره؛ وإلا يُحتفظ بتكبير المستخدم. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | يمكن للقرص تجاوز الحدود ثم يرتد. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | يمكن للمستخدم القرص للتكبير. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | المحتوى الأصغر من منطقة العرض (بعد التصغير) يُوسَّط. |

```rust tabs
let photo = element_ref();

scroll()
    .element_ref(&photo)
    .zoom_range(1.0, 4.0)
    .center_content(true)
    .flex_1()
    .bg(black())
    .child(
        image(PICTURE)
            .w(px(390.0))
            .h(px(520.0))
            .on_press(move || photo.zoom_to(1.0, None, true)),
    )
```

```tsx tabs
let photo!: ScrollRef;
<Scroll ref={photo} maximumZoomScale={4} centerContent style={{ flex: 1, backgroundColor: "#000" }}>
  <Image src={picture} style={{ width: 390, height: 520 }} onPress={() => photo.zoomTo({ scale: 1, animated: true })} />
</Scroll>;
```

<a id="events"></a>

## الأحداث

| الحدث | Rust | البيانات | متى يقع |
|---|---|---|---|
| `onScroll` | `.on_scroll` | `ScrollEvent` | تغيّرت الإزاحة (مرة واحدة على الأكثر لكل إطار، وبما لا يزيد على وتيرة `scrollEventThrottle`). |
| `onScrollDragStart` / `onScrollDragEnd` | `.on_scroll_drag_start` / `.on_scroll_drag_end` | `{ offset }` (`Point<Points>`) | بدأ المستخدم السحب / توقف عنه. |
| `onMomentumStart` / `onMomentumEnd` | `.on_momentum_start` / `.on_momentum_end` | `{ offset }` | بدأ الانزلاق بعد السحب / توقف. الانزلاق الذي يقطعه سحب جديد ينتهي مع ذلك بـ `onMomentumEnd`. |
| `onScrollEnd` | `.on_scroll_end` | `{ offset }` | استقر التمرير. |
| `onRefresh` | `.on_refresh` | لا شيء | سُحب للتحديث. |

`ScrollEvent` هو `{ offset: Point; contentSize: Size; size: Size; zoomScale }` (في Rust `offset`، `content_size`، `size`، `zoom_scale`): الإزاحة، وحجم المحتوى (المكبَّر)، وحجم منطقة العرض، ومقياس التكبير (1 ما لم يكن العرض يكبّر).

> [!TIP]
> لتحريك شيء مع موضع التمرير (ترويسة تنكمش، صورة بتأثير بارالاكس)، اربط `scrollValue` بقيمة أصلية (native) واستوفِها (interpolate) في نمط. يعمل ذلك على خيط الواجهة بمعدل تحديث الشاشة، بينما `onScroll` حدث لكل إطار في كود التطبيق. راجع [الرسوم المتحركة](../docs/animation.md).

<a id="ref-methods"></a>

## دوال المرجع

| الدالة | Rust | الوصف |
|---|---|---|
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point(x, y), animated)` | يمرّر إلى إزاحة. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, Some(point(x, y)), animated)` | يكبّر إلى `scale` (مقيّدًا بالحدود) مع وضع نقطة المحتوى (`x`، `y`، بنقاط غير مكبَّرة) في منتصف منطقة العرض، أو حول المنتصف. مثلًا نقرتان للتكبير عند النقطة المنقورة. |

```rust tabs
let scroller = element_ref();
scroll().element_ref(&scroller).child(content());

scroller.scroll_to(point(px(0.0), px(0.0)), true);
```

```tsx tabs
let scroller!: ScrollRef;
<Scroll ref={scroller}>…</Scroll>;
scroller.scrollTo({ y: 0, animated: true });
```

<a id="keyboard"></a>

## لوحة المفاتيح

تُبقى حقول الإدخال داخل عرض التمرير بعيدة عن لوحة المفاتيح أصليًا: يحصل عرض التمرير على إزاحة سفلية ويمرّر إلى حقل الإدخال المركَّز من تلقاء نفسه. أما للمحتوى خارج عروض التمرير فاستخدم [`env(keyboard-inset-height)`](./keyboard.md) في حشوة أو هامش سفلي. راجع [النماذج ولوحة المفاتيح](../docs/forms-and-keyboard.md).

<a id="right-to-left"></a>

## من اليمين إلى اليسار

تبدأ عروض التمرير الأفقية من الطرف الأيمن في تخطيطات اليمين إلى اليسار وتحافظ على بعدها عنه عند تغيّر المحتوى؛ وتنعكس عناصرها الفرعية.

<a id="platform-notes"></a>

## ملاحظات المنصات

- Android: يرسم NSH السحب للتحديث (ويبقى التمرير الزائد أصليًا)، ويُطبَّق `contentInset` بوصفه حشوة، و`decelerationRate` يشكّل انزلاقات الالتصاق.
- يكبّر Android باستخدام عرض التمرير الخاص بـ NSH، الذي يقيس المحتوى حول زاويته العلوية اليسرى ويتمرر في الاتجاهين. يبدأ القرص بعد الحد الأدنى للمسافة بين الإصبعين في Android (نحو 27 مم).
- على Mac Catalyst (نمط Mac)، يكتشف NSH السحب ويعرض مؤشره الدوار.
- يعيد iOS رسم النصوص واللوحات (canvases) بدقة التكبير عند انتهائه.
