---
title: "التمرير"
description: "عروض التمرير في Rust وTSX - التقسيم إلى صفحات والالتصاق، والتكبير، والسحب للتحديث، وأحداث التمرير، والتأثيرات المرتبطة بالتمرير باستخدام scrollValue، ولوحة المفاتيح داخل عروض التمرير، والتمرير من الكود."
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---

# التمرير

عرض التمرير (`scroll()` في Rust، و`<Scroll>` في TSX) هو عرض التمرير الأصلي للمنصة (UIScrollView على iOS، وScrollView على Android): الدفع السريع (fling) والارتداد ومؤشر التمرير والسحب للتحديث كلها أصلية، وكذلك الالتقاط (snapping). يصلك خبر التمرير عبر الأحداث، ويمكنك ربط الإزاحة بـ[قيمة متحركة](./animation.md#animated-values) لإنتاج تأثيرات تتبع الإصبع إطارًا بإطار.

استخدم عرض التمرير للمحتوى ذي الحجم المعروف والمعتدل: صفحة إعدادات، أو نموذج، أو مقال، أو صف من الشرائح (chips). أما البيانات الطويلة أو غير المحدودة فاستخدم [القائمة](./lists.md)، فهي تعيد تدوير الصفوف وتقبل خصائص التمرير نفسها.

<a id="a-scroll-view"></a>

## عرض تمرير

عرض التمرير هو نافذة العرض (viewport)، وأبناؤه هم المحتوى. تحتاج نافذة العرض إلى حجم من العنصر الأب (عادةً `flex: 1` و`.flex_1()`)، ويُرتَّب المحتوى بعرض نافذة العرض (في الاتجاه العمودي) أو بارتفاعها (في الاتجاه الأفقي)، وبالطول الذي يحتاجه.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

العنصر الابن أعلاه هو حاوية محتوى عرض التمرير؛ وفي TSX تنشئ `contentStyle` (أو `contentClass`) واحدة لك، إذ تلف الأبناء في عنصر عرض بذلك النمط، ويتمرر معهم. يجعل `flexGrow: 1` (`.flex_grow(1.0)`) المحتوى بطول نافذة العرض على الأقل، فيمكن توسيط المحتوى القصير مع بقاء الطويل قابلًا للتمرير:

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

يأخذ عرض التمرير الأفقي `horizontal` (`.horizontal()`) وصفًّا كابن له:

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

في الاتجاه من اليمين إلى اليسار (انظر [الجهاز والبيئة](./device-and-environment.md#right-to-left))، يبدأ عرض التمرير الأفقي من طرفه الأيمن ويحافظ على بعده عنه.

تسحب الأصابع عروض التمرير. على سطح المكتب (macOS وWindows وLinux) وفي المتصفح، يمرر الماوس كما في تطبيقات سطح المكتب: بعجلته (Shift + العجلة للتمرير أفقيًا)، ولوحة اللمس، ولوحة المفاتيح، ومؤشر التمرير الذي يظهر عند تحريك الماوس فوق العرض ويُسحب كشريط تمرير؛ أما سحب الماوس فيذهب إلى إيماءات السحب (pans) والمستجيبات (responders) وتحديد النص في التطبيق. وتسحب شاشات اللمس على أجهزة سطح المكتب عروض التمرير كما تفعل الأصابع. وتحتفظ العروض الأفقية بمؤشرها هناك حتى مع `scrollbar={false}`، لأنه الوسيلة التي يحرّكها بها ماوس بلا عجلة أفقية.

<a id="behavior-props"></a>

### خصائص السلوك

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | يتمرر جانبيًا. |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | يستطيع المستخدم تمريره. ويظل التمرير من الكود يعمل. |
| `bounces` | `.bounces(..)` | `boolean` | `true` | التمرير الزائد (overscroll) خلف الحواف. |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | يظهر مؤشر التمرير. على سطح المكتب وفي متصفحاته يحتفظ به العرض الأفقي: فهو شريط التمرير الخاص بالماوس. |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | مساحة حول المحتوى يمكن التمرير إليها. |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | الموضع الذي يبدأ منه. |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | القيمة الافتراضية للمنصة | سرعة تباطؤ الدفع السريع: `"normal"` أو `"fast"` أو السرعة المحتفظ بها في كل ميلي ثانية (`0.998` عادية و`0.99` سريعة؛ و`0` هي القيمة الافتراضية للمنصة). |

<a id="paging-and-snapping"></a>

## التقليب والالتقاط

يُحسم الالتقاط أصليًا عند رفع الإصبع، اعتمادًا على إزاحة لحظة الرفع والانزلاق المتوقع والسرعة؛ ثم ينزلق عرض التمرير إلى نقطة التوقف المختارة دون أي تدخل من كودك.

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | يتوقف عند مضاعفات حجم نافذة العرض. |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | يتوقف عند مضاعفات هذا الطول (0: معطَّل). |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | يتوقف عند هذه الإزاحات. |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | مع `snapToInterval`: أي نقطة من العنصر تُحاذى مع نافذة العرض. |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | لا يتجاوز الدفع السريع نقطة توقف واحدة. |

مقلِّب صفحات (pager): صفحات بعرض عرض التمرير نفسه، ومؤشر يتحدث عند انتهاء الانزلاق.

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

شريط بطاقات (carousel) تلتقط بطاقاته عند المنتصف، بطاقة واحدة لكل دفع سريع:

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

تقبل القوائم خصائص الالتقاط نفسها، مما يجعلها الخيار الأفضل لشريط بطاقات طويل.

<a id="scroll-events"></a>

## أحداث التمرير

| الخاصية | Rust | الحمولة | متى |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | تغيرت الإزاحة. مرة واحدة كحد أقصى في كل إطار؛ ويباعد `scrollEventThrottle` بينها أكثر. |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | الحد الأدنى بالميلي ثانية بين أحداث `onScroll`. |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | بدأ المستخدم السحب. |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | رفع المستخدم إصبعه. |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | بدأ الانزلاق بعد الدفع السريع. |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | انتهى الانزلاق (وكذلك عندما يوقفه سحب جديد). |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | استقر تمرير المستخدم: بعد الانزلاق، أو عند نهاية سحب دون انزلاق. |

يحمل `ScrollEvent` الإزاحة (`offset`، من النوع `Point`؛ وهي نفسها في Rust)، وحجم المحتوى بعد التكبير (`contentSize`، من النوع `Size`؛ `content_size`)، ونافذة العرض (`size`) و`zoomScale` (`zoom_scale`). أما الأحداث الأخرى فتحمل الإزاحة: `{ offset }` مع `Point` في TSX، و`Point<Points>` في Rust.

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> يشغّل `onScroll` كودك في كل إطار من التمرير (مع مراعاة التقييد الزمني). أما ما يجب أن *يبدو* مرتبطًا بالتمرير فقط، مثل ترويسة تتلاشى أو صورة بتأثير اختلاف المنظر (parallax)، فاستخدم [`scrollValue`](#scroll-linked-effects-scrollvalue) بدلًا منه: فهو يعمل أصليًا بالكامل.

<a id="scroll-linked-effects-scrollvalue"></a>

## التأثيرات المرتبطة بالتمرير: scrollValue

يأخذ `scrollValue` (`.scroll_value(&value)`) [قيمة متحركة](./animation.md#animated-values) ويكتب فيها إزاحة التمرير (على المحور الرئيسي) أصليًا، في الإطار نفسه الذي يتحرك فيه المحتوى. اربط تلك القيمة، أو العقد المشتقة منها باستخدام `interpolate` أو `diffClamp` (`diff_clamp`) أو العمليات الحسابية، بالأنماط.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

ترويسة تنزلق بعيدًا أثناء تمرير المحتوى للأعلى وتعود فور التمرير للأسفل هي `diffClamp` للإزاحة:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

تُقيَّد الاستيفاءات (interpolations) افتراضيًا خارج نطاق مدخلاتها، فعند السحب إلى ما بعد الأعلى (إزاحة سالبة) يبقى التأثير عند نهايته؛ مرّر `extrapolate: "extend"` (`interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))` في Rust) للحصول على ترويسة مطاطية تكبر كلما سحبت.

<a id="pull-to-refresh"></a>

## السحب للتحديث

يضيف `refreshing` و`onRefresh` (`.refreshing(..)` و`.on_refresh(..)`) عنصر السحب للتحديث الخاص بالمنصة. يظهر العنصر ما دام `refreshing` صحيحًا؛ اضبطه في `onRefresh` وأعده إلى الحالة السابقة عند انتهاء العمل.

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

على iOS العنصر هو UIRefreshControl؛ وفي نمط Mac من Mac Catalyst يعرض NSH مؤشر دوران خاصًا به بالسلوك نفسه. تقبل القوائم الخصائص نفسها. على سطح المكتب وفي المتصفح يكون السحب إيماءة شاشة لمس (أو إيماءة لوحة تتبع macOS التي تسحب إلى ما بعد الأعلى)، لأن الماوس يمرر دون سحب؛ فوفّر هناك طريقة أخرى للتحديث، مثل زر أو اختصار لوحة مفاتيح.

<a id="an-indicator-of-your-own"></a>

### مؤشر خاص بك

شكل السحب متروك لاختيار التطبيق. يعني `refreshIndicator={{ height }}` أن التطبيق يرسم مؤشره الخاص، و`height` ارتفاعه بالنقاط: يُخفى مؤشر الدوران الخاص بالمنصة، ويبدأ التحديث بمجرد أن يبلغ السحب `height`، ويُبقي التحديث `height` فوق المحتوى للمؤشر. يغذي `pullValue` قيمة متحركة بمقدار سحب المحتوى إلى ما بعد الأعلى: 0 في حالة السكون، وتزداد مع السحب، و`height` أثناء التحديث. ارسم المؤشر فوق أعلى عرض التمرير واستوفِ أنماطه من القيمة: فهي تتبع الإصبع على خيط واجهة المستخدم (UI thread)، دون أي JS في كل إطار.

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

أبقِ `height` ضمن نصف نافذة العرض: فبعد الأعلى تزداد مقاومة المحتوى للإصبع كلما ابتعد، ولا يمكن بلوغ ارتفاع أبعد من ذلك. على iOS، يحل المؤشر الخاص بالتطبيق محل UIRefreshControl مع السحب الذي يكتشفه NSH بنفسه، كما في نمط Mac.

<a id="zooming"></a>

## التكبير

يكبّر عرض التمرير (تحتفظ القوائم بمقياس 1) المحتوى عندما يكون أقصى مقياس تكبير له أعلى من أدناه: يؤدي القرص (pinch) إلى تحجيم المحتوى، ويتمرر في الاتجاهين أثناء التكبير.

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | أصغر تكبير. |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | أكبر تكبير؛ وإذا كان أعلى من الأدنى فإن القرص يكبّر. |
| `zoomScale` | `.zoom(scale)` | `number` | | يكبّر إلى هذا المقياس عند تغيّر الخاصية؛ ويُحتفظ بتكبير المستخدم فيما عدا ذلك. |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | يمكن للقرص تجاوز الحدود ثم يرتد. |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | يستطيع المستخدم القرص للتكبير. |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | يُوسَّط المحتوى الأصغر من نافذة العرض (بعد التصغير). |

يبلغ حدث التمرير عن مقياس التكبير وحجم المحتوى المكبَّر. ومن الكود، يكبّر `zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` بحيث تقع نقطة المحتوى (بالنقاط غير المكبّرة) في منتصف نافذة العرض؛ والنقر المزدوج للتكبير هو معالج ضغط (press handler) يستدعيه:

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

يُعاد رسم النصوص واللوحات (canvases) داخل عرض تمرير مكبَّر بالدقة الجديدة عند انتهاء التكبير، فتبقى حادة على iOS. أما على Android فيكبّر NSH باستخدام عرض تمرير خاص به، يحجّم حول نقطة تركيز القرص، ويمرر بأي عدد من الأصابع، ويدعم الدفع السريع والارتداد المطاطي عند الحواف وحدود التكبير. ويبدأ Android القرص حين تبعد الأصابع نحو 27 ملم عن بعضها، كما يفعل كاشف الإيماءات في النظام.

<a id="scrolling-from-code"></a>

## التمرير من الكود

امنح عرض التمرير مرجعًا (`element_ref()` و`.element_ref(&scroller)` في Rust، و[`ref`](./jsx-and-components.md) في TSX) واستدعِ دوالّه. تعمل الأوامر بعد بقية التغييرات في التحديث نفسه، لذا يعمل التمرير إلى محتوى أضفته للتو.

| Rust | TSX | الوصف |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | يمرر إلى إزاحة. متحرك افتراضيًا في TSX. |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | عروض التمرير القابلة للتكبير: يكبّر إلى `scale` (مقيَّدًا بالحدود)، حول نقطة المحتوى أو المنتصف. |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

تضيف القوائم `scrollToIndex` و`scrollToOffset` و`scrollToEnd`؛ انظر [القوائم](./lists.md#scrolling-from-code).

<a id="scroll-views-and-the-keyboard"></a>

## عروض التمرير ولوحة المفاتيح

يُبقي NSH الحقل المركَّز مرئيًا من تلقاء نفسه: عند ظهور لوحة المفاتيح، يحصل عرض التمرير المحيط بالحقل على حشوة سفلية (inset) بارتفاع لوحة المفاتيح ويمرر الحقل إلى حيز الرؤية. يحدث هذا أصليًا، دون أي كود في تطبيقك. استخدم `env(keyboard-inset-height)` كحشوة سفلية ([المحتوى خارج عروض التمرير](./forms-and-keyboard.md#content-outside-scroll-views)) للمحتوى الواقع خارج عروض التمرير، مثل شريط رسائل مثبت في الأسفل.

تحدد خاصيتان كيف يتفاعل التمرير والنقرات مع لوحة المفاتيح:

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | هل يخفي سحب المحتوى لوحة المفاتيح. يجعل `"interactive"` لوحة المفاتيح تتبع الإصبع إلى الأسفل على iOS؛ وعلى Android يتصرف مثل `"on-drag"`. |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | ما تفعله النقرة أثناء ظهور لوحة المفاتيح. |

`keyboardShouldPersistTaps`:

- `"never"`: النقرة خارج الحقل المركَّز تخفي لوحة المفاتيح فقط، وتصل النقرة التالية إلى الأزرار. ينقر المستخدم مرة للإخفاء ومرة أخرى للضغط.
- `"handled"`: النقرة على ما يعالجها (زر) تمر وتبقى لوحة المفاتيح؛ والنقرة على مساحة فارغة تخفيها. وهو الخيار الصحيح عادةً للنماذج.
- `"always"`: تبقى لوحة المفاتيح ظاهرة مع كل نقرة.

يُحسم الأمران أصليًا لحظة النقر أو السحب، دون انتظار كودك. لإخفاء لوحة المفاتيح من الكود، استدعِ `dismiss_keyboard()` في Rust أو `Keyboard.dismiss()` من [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) في TSX.

<a id="nested-scroll-views"></a>

## عروض التمرير المتداخلة

يعمل عرض تمرير أفقي داخل عرض عمودي كما هو متوقع: يأخذ كل منهما السحبات على محوره. ويمكن أيضًا تداخل عرضي تمرير على المحور نفسه (يتمرر الداخلي أولًا). أما المستجيبات التي تحتاج إلى الإصبع، مثل لوحة رسم داخل عرض تمرير، فتمنعه عن عروض التمرير المحيطة بها: `.keep_touches(true)` في Rust، و`true` المُعاد من `onResponderGrant` في TSX؛ انظر [اللمس والإيماءات](./touch-and-gestures.md#the-responder-system).

<a id="related"></a>

## ذو صلة

- [Scroll](../elements/scroll.md): مرجع العنصر، بكل خصائصه وأحداثه.
- [القوائم](./lists.md): قوائم افتراضية (virtualized) بخصائص التمرير نفسها.
- [الحركة](./animation.md): القيم المتحركة، و`interpolate` و`diffClamp` للتأثيرات المرتبطة بالتمرير.
- [النماذج ولوحة المفاتيح](./forms-and-keyboard.md): الحقول والتركيز ولوحة المفاتيح.
