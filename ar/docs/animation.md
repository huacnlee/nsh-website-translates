---
title: "الرسوم المتحركة"
description: "الحركات (مداخل ومخارج جاهزة، وعناصر لجذب الانتباه، وحركات متكررة، أو إطارات مفتاحية خاصة بك)، وانتقالات الأنماط والرسوم المتحركة بالإطارات المفتاحية، والقيم المتحركة مع التوقيت timing والنابض spring والتباطؤ decay والإطارات المفتاحية keyframes، والاستيفاء، والرسوم المتحركة المركبة، ومنحنيات التسارع، ورسوم التخطيط المتحركة، وما يعمل على خيط واجهة المستخدم، في Rust وTSX."
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---

# الرسوم المتحركة

تعمل كل رسوم متحركة في NSH على خيط واجهة المستخدم. تصفها مرة واحدة، من Rust أو TSX، ثم تشغّلها المنصة إطارًا تلو آخر (Core Animation وdisplay link على iOS، ومحرّك الرسوم على خيط واجهة المستخدم على Android) دون استدعاء شيفرتك. لذلك لا يمكن لانشغال خيط المحرّك أن يجعل الرسوم تتقطع، ولا تكلّف الرسوم المتحركة شيفرتك شيئًا أثناء تشغيلها.

هناك ست أدوات، من الأسهل استخدامًا إلى الأكثر مرونة:

| الأداة | متى تستخدمها |
|---|---|
| [الحركة (Motion)](#motion) | عرض (view) يدخل أو يخرج أو يلفت الانتباه أو يتكرر: حركات جاهزة (`fadeInUp`، `shake`، `pulse`، ...) أو إطارات مفتاحية من تصميمك، على opacity و transform. |
| [الانتقالات (Transitions)](#transitions) | تغيير في النمط ينبغي أن يتحرك بدلًا من أن يقفز: لون، أو شفافية، أو تحويل. |
| [الرسوم المتحركة بالإطارات المفتاحية المدمجة](#keyframe-animations) | مؤشر دوران، أو عنصر نائب ينبض، أو تلميح يقفز. |
| [الإطارات المفتاحية (Keyframes)](#keyframes) | أي قيمة متحركة عبر إطارات مفتاحية، كما تُشغَّل في CSS: إزاحات، ومنحنى تسارع لكل مقطع، وتكرارات، واتجاه. |
| [القيم المتحركة](#animated-values) | كل ما تحرّكه قيمة عبر الزمن: النوابض، والإيماءات، وموضع التمرير، والتسلسلات. |
| [رسوم التخطيط المتحركة](#layoutanimation) | تغييرات الحجم والموضع بعد التحديث: عناصر تُدرج أو تُزال أو يُعاد ترتيبها، ولوحة تتمدد. |

<a id="motion"></a>

## الحركة (Motion)

تحرّك الحركة opacity و transform للعرض عبر إطارات مفتاحية، بشكل أصلي. أنشئ واحدة في المكوّن الذي يملك العرض (`motion()` في Rust، و`createMotion()` من `nsh` في TSX)، واربطها بالعرض، ثم شغّل عليها حركة جاهزة أو حركة من تصميمك. يبدأ `enter` العرض من النقطة التي تبدأ منها الحركة ويشغّلها فورًا، فيدخل العرض من إطاره الأول.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let card = motion().entering(MotionPreset::FadeInUp);
    view().flex_1().items_center().justify_center().child(
        view()
            .size(px(120.0))
            .rounded(px(16.0))
            .bg(rgb(0x0969da))
            .bind_motion(&card)
            .on_press(move || {
                card.play(MotionPreset::Shake);
            }),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createMotion } from "nsh";

function App() {
  const card = createMotion({ enter: "fadeInUp" });
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => card.play("shake")}
        style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }}
      />
    </View>
  );
}

mount(App);
```

للحركة قيمة متحركة لكل قناة: `opacity` (من 0 إلى 1)، `translateX` و`translateY` (بالنقاط)، `rotate` و`rotateX` و`rotateY` (بالدرجات)، `scale` و`scaleX` و`scaleY`. تبدأ في حالة السكون (opacity والمقاييس تساوي 1، والباقي 0) وتُطبَّق بهذا الترتيب: الإزاحات، ثم الدورانات، ثم المقاييس، حول نقطة أصل التحويل (transform origin) للعرض. ليس للحركة مظهر خاص بها: إنها تحرّك ما صمّمته.

تحرّك الحركة opacity و transform فقط. يضبط نشر `m.style` قيمتي `opacity` و`transform` للعرض؛ وللاحتفاظ بـ opacity الخاصة بك اربط الخطوات فقط (`transform: m.transform`). أما الألوان فتتحرك بقيمة متحركة و[`interpolate`](#interpolation).

| TSX | Rust | الوصف |
|---|---|---|
| `createMotion(options?)` | `motion()` | حركة تكون كل قنواتها في حالة السكون. |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | المواضع التي تبدأ منها القنوات؛ وتبدأ الباقية في حالة السكون. |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | تبدأ من حيث يبدأ `enter` وتشغّله فورًا؛ وتغيّر الخيارات الأخرى توقيته. يحدد `enter` القنوات التي يحرّكها، عبر `initial`. |
| `style={m.style}`، `m.transform` | `.bind_motion(&m)` | يربط القنوات: `m.style` هو `{ opacity, transform }`، و`transform` فيه قائمة من سبع خطوات (يُدمج `scale` في `scaleX` و`scaleY`). تُطبَّق بعد `translate` و`rotate` و`scale` الخاصة بالعرض؛ ويمنح المنظور (perspective) الموضوع قبلها القلبَ ثلاثي الأبعاد عمقه: `transform: [{ perspective: 800 }, ...m.transform]`. في Rust يُطبَّق تحويل الحركة بعد تحويل العرض نفسه. |
| `m.opacity`، `m.translateX`، ... | `m.value(MotionChannel::Opacity)`، ... | القيمة المتحركة لقناة واحدة، لتستكمل بينها بالاستيفاء أو تحرّكها يدويًا. |
| `m.play(motion, options?)` | `m.play(spec)` | يشغّل حركة جاهزة أو حركة من تصميمك؛ والحركة الجديدة تقاطع الحركة الجارية. يُحَل الوعد بالقيمة `{ finished }`، `true` عند انتهائها (`AnimationEnd` في Rust). |
| `m.animation(motion, options?)` | `m.animation(spec)` | الحركة نفسها بوصفها [رسمًا متحركًا مركّبًا](#composite-animations)، غير مبدوءة، لتسلسلها أو توزّعها زمنيًا أو تكرّرها مع غيرها. |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | يشغّلها حتى عندما يطلب المستخدم حركة أقل. |
| `m.stop()` | `m.stop()` | يوقفها حيث هي. |
| `m.reset()` | `m.reset()` | يوقفها ويعيد كل قناة إلى حالة السكون. |

<a id="presets"></a>

### الحركات الجاهزة

الحركات الجاهزة بيانات: `motions` من `nsh` (`motions.fadeInUp` هو ما يشغّله `play("fadeInUp")`) و`MotionPreset` في Rust (`MotionPreset::FadeInUp.spec()`). المسافات بالنقاط، ومقاسة للعناصر الصغيرة والبطاقات؛ وللعروض الأكبر حجمًا غيّر مقياس قيم الحركة أو اكتب إطاراتك المفتاحية. يدور `swing` وبقية الدورانات حول نقطة أصل التحويل للعرض: امنح اللافتة المتأرجحة `transformOrigin: "top"` (`.origin_top()`).

**الدخول**: تبدأ مخفية أو بعيدة وتنتهي في حالة السكون.

| TSX | Rust | المدة | الوصف |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | يظهر تدريجيًا. |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | يظهر تدريجيًا، صاعدًا إلى مكانه. |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | يظهر تدريجيًا، نازلًا إلى مكانه. |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | يظهر تدريجيًا، قادمًا من اليسار. |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | يظهر تدريجيًا، قادمًا من اليمين. |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | يظهر تدريجيًا، ويكبر من 90 %. |
| `popIn` | `MotionPreset::PopIn` | 450 ms | يظهر بانفجار: يكبر من نصف حجمه إلى ما يتجاوز حجمه ثم يستقر. |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | يدخل مرتدًّا، متجاوزًا حجمه مرتين. |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | ينزلق صاعدًا من الأسفل، دون تلاشٍ (الصفحات السفلية، والإشعارات المنبثقة). |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | ينزلق نازلًا من الأعلى، دون تلاشٍ. |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | ينقلب داخلًا حول محوره الأفقي. |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | ينقلب داخلًا حول محوره العمودي. |

**الخروج**: تبدأ في حالة السكون وتنتهي مخفية أو بعيدة.

| TSX | Rust | المدة | الوصف |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | يتلاشى. |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | يتلاشى، صاعدًا بعيدًا. |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | يتلاشى، نازلًا بعيدًا. |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | يتلاشى نحو اليسار. |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | يتلاشى نحو اليمين. |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | يتلاشى، ويتقلص إلى 90 %. |
| `popOut` | `MotionPreset::PopOut` | 300 ms | يخرج بانفجار: ينتفخ قليلًا ثم يتقلص ويختفي. |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | ينزلق نازلًا خارج الرؤية، دون تلاشٍ. |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | ينزلق صاعدًا خارج الرؤية، دون تلاشٍ. |

**لفت الانتباه**: تبدأ وتنتهي في حالة السكون.

| TSX | Rust | المدة | الوصف |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | يهتز جانبيًا: كلمة مرور خاطئة، أو حقل غير صالح. |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | يهزّ رأسه: رفض ألطف. |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | يتمايل حول مركزه: شيء يستحق الانتباه. |
| `swing` | `MotionPreset::Swing` | 900 ms | يتأرجح من حافته العليا، مثل لافتة. |
| `pulse` | `MotionPreset::Pulse` | 500 ms | يكبر قليلًا ثم يعود: تأكيد خفيف. |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | ينبض مرتين، مثل قلب: إعجاب، أو عنصر مفضّل. |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | ينضغط ويتمدد مثل المطاط. |
| `jello` | `MotionPreset::Jello` | 800 ms | يهتز مثل الجيلي. |
| `tada` | `MotionPreset::Tada` | 900 ms | يتقلص ثم يكبر مع تمايل: مكافأة. |
| `jump` | `MotionPreset::Jump` | 700 ms | يقفز ويهبط مع انضغاط. |
| `flash` | `MotionPreset::Flash` | 800 ms | يومض اختفاءً وظهورًا مرتين. |

**التكرار**: تتكرر حتى تُوقَف.

| TSX | Rust | المدة | الوصف |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | يدور دورة كاملة، إلى الأبد. |
| `float` | `MotionPreset::Float` | 1500 ms | يطفو صعودًا ونزولًا، إلى الأبد. |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | يتنفس: يكبر ويشحب قليلًا، إلى الأبد. |
| `sway` | `MotionPreset::Sway` | 1600 ms | يتمايل حول مركزه، إلى الأبد. |
| `bob` | `MotionPreset::Bob` | 1000 ms | يرتفع وينخفض مثل كرة مرتدة، إلى الأبد. |
| `glow` | `MotionPreset::Glow` | 2000 ms | يتوهج ويخفت، إلى الأبد. |

يقبل `play` خيارات التوقيت الخاصة بحركة جاهزة فوقها (`m.play("shake", { duration: 300 })`)، ويمكن نشر الحركة الجاهزة داخل حركة من تصميمك (`m.play({ ...motions.fadeInUp, duration: 600 })`). في Rust غيّر مواصفات الحركة الجاهزة: `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`.

<a id="motions-of-your-own"></a>

### حركات من تصميمك

الحركة من تصميمك هي إطارات مفتاحية لكل قناة وتوقيت واحد (خيارات [الإطارات المفتاحية](#keyframes)). في TSX اكتب الإطارات المفتاحية لكل قناة (`{ opacity: [0, 1] }`)، أو قائمة إطارات كما يكتبها Web Animations API (`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`)، لكل إطار `offset` و`easing`. في قائمة الإطارات، يقع الإطار الذي بلا إزاحة (offset) حيث يضعه موضعه في القائمة، وتتبع القناةُ الإطاراتِ التي تذكرها. يمكن أن تكون الزوايا سلاسل نصية (`"45deg"`، `"0.5turn"`). في Rust ابنِ `MotionSpec`.

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(
        MotionChannel::TranslateY,
        [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)],
    );
card.play(rise);

let flip = MotionSpec::new(KeyframeTiming::new(600.0).infinite())
    .values(MotionChannel::RotateY, [0.0, 180.0, 360.0]);
card.play(flip);
```

```tsx tabs
// Channels' keyframes.
card.play({
  duration: 400,
  keyframes: { opacity: [0, 1], translateY: [{ value: 24, easing: "easeOut" }, 0] },
});

// A list of frames.
card.play({
  duration: 400,
  keyframes: [
    { opacity: 0, translateY: 24, easing: "easeOut" },
    { opacity: 1, translateY: 0 },
  ],
});

card.play({ duration: 600, iterations: "infinite", keyframes: { rotateY: ["0deg", "180deg", "360deg"] } });
```

<a id="entrances-and-staggered-lists"></a>

### الدخول والقوائم المتتابعة

امنح كل صف حركة دخول، بتأخير يزداد مع فهرسه: فالصفوف التي تظهر معًا تدخل واحدًا تلو الآخر. حدّد سقفًا للتأخير حتى لا ينتظر صف أُضيف في أسفل القائمة طويلًا.

```rust tabs
each(items, |item: &Item| item.id, |item, index| {
    let delay = index.get_untracked().min(10) as f32 * 60.0;
    let row = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(delay)));
    view()
        .rounded_xl()
        .bg(ZINC.shade(100))
        .p_4()
        .bind_motion(&row)
        .child(text(move || item.get().title))
})
```

```tsx tabs
function Row(props: { title: string; index: number }) {
  const row = createMotion({ enter: "fadeInUp", delay: Math.min(props.index, 10) * 60 });
  return (
    <View class="rounded-xl bg-zinc-100 p-4" style={row.style}>
      <Text>{props.title}</Text>
    </View>
  );
}

<Each of={items()} key={(item) => item.id}>
  {(item, index) => <Row title={item().title} index={index()} />}
</Each>
```

كما يمكن تركيب الحركات: `m.animation(..)` هو حركة بوصفها [رسمًا متحركًا مركّبًا](#composite-animations)، غير مبدوء، فيشغّل `Animated.stagger` مجموعة منها بشكل أصلي، بالعدّ من العنصر الأول أو الأخير أو الوسط أو أي فهرس. امنحها `initial` مخفيًا (أو ابدأها من حيث تبدأ الحركة) حتى لا يظهر شيء قبل دوره.

```rust tabs
let cards: Vec<Motion> = (0..5)
    .map(|_| {
        let m = motion();
        m.value(MotionChannel::Opacity).set(0.0);
        m
    })
    .collect();
Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(|m| m.animation(MotionPreset::FadeInUp))).start();
```

```tsx tabs
const cards = [0, 1, 2, 3, 4].map(() => createMotion({ initial: { opacity: 0 } }));
Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" }).start();
```

<a id="exits"></a>

### الخروج

شغّل حركة الخروج، وانتظر انتهاءها، ثم أزل العرض. وتتيح [رسوم التخطيط المتحركة](#layoutanimation) للعروض المحيطة به أن تسدّ الفراغ.

```rust tabs
let remove = move || {
    spawn(async move {
        row.play(MotionPreset::FadeOutLeft).await;
        animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
        items.update(|items| items.retain(|i| i.id != id));
    });
};
```

```tsx tabs
const remove = async () => {
  await row.play("fadeOutLeft");
  LayoutAnimation.easeInEaseOut();
  items.set(items().filter((i) => i.id !== id));
};
```

تتبع الحركات إعداد [الحركة المخفَّضة](#reduced-motion) لدى المستخدم من تلقاء نفسها: فعندما يطلب المستخدم حركة أقل، تصل الحركة إلى نهايتها فورًا دون أن تتحرك.

<a id="transitions"></a>

## الانتقالات (Transitions)

سمِّ ما يجب تحريكه ومدة التحريك (`.transition_all().duration(400.0)` في Rust، و`transitionProperty` و`transitionDuration` في TSX)، فتتحرك التغييرات اللاحقة على تلك الخصائص بشكل أصلي من القيمة الظاهرة على الشاشة إلى القيمة الجديدة.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let on = signal(false);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || on.update(|on| *on = !*on))
            .size(px(100.0))
            .rounded(move || px(if on.get() { 50.0 } else { 16.0 }))
            .bg(move || if on.get() { rgb(0x8250df) } else { rgb(0x0969da) })
            .rotate(move || deg(if on.get() { 45.0 } else { 0.0 }))
            .scale(move || if on.get() { 1.2_f32 } else { 1.0 })
            .transition_all()
            .duration(400.0)
            .ease_in_out(),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";

function App() {
  const on = signal(false);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => on.set(!on())}
        style={{
          width: 100,
          height: 100,
          borderRadius: on() ? 50 : 16,
          backgroundColor: on() ? "#8250df" : "#0969da",
          rotate: on() ? "45deg" : "0deg",
          scale: on() ? 1.2 : 1,
          transitionProperty: "all",
          transitionDuration: 400,
          transitionTimingFunction: "ease-in-out",
        }}
      />
    </View>
  );
}

mount(App);
```

| النمط | Rust | النوع | الوصف |
|---|---|---|---|
| `transitionProperty` | `.transition()`، `.transition_all()`، `.transition_colors()`، `.transition_opacity()`، `.transition_transform()`، `.transition_shadow()` | `string` | ما الذي يتحرك، مفصولًا بفواصل: `"all"`، `"colors"`، `"opacity"`، `"transform"`، `"box-shadow"`، `"border-radius"`، ... |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | بالمللي ثانية كرقم، أو زمن بصيغة CSS. |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | قبل أن تبدأ. |
| `transitionTimingFunction` | `.ease_linear()`، `.ease_in()`، `.ease_out()`، `.ease_in_out()`، `.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | المنحنى. |

الخصائص التي تنتقل، حسب المجموعة: **الألوان** (ألوان الخلفية والحدود والإطار الخارجي والظل والنص، ونقاط التدرج)، و**الشفافية**، و**التحويل**، و**الظلال** (`box-shadow`)، و**الشكل** (نصف قطر الحدود وعرضها). تعمل أسماء CSS وصيغها بنمط camel-case معًا (`background-color`، `backgroundColor`، `transform`، `scale`، ...). أما تغييرات التخطيط فتتحرك عبر [رسوم التخطيط المتحركة](#layoutanimation).

مع Tailwind، الأمر نفسه هو `transition` (الألوان والشفافية والظلال والتحويلات)، `transition-all`، `transition-colors`، `transition-opacity`، `transition-transform`، `transition-shadow`، مع `duration-*` و`delay-*` و`ease-*`. وبدمجها مع حالة الضغط (`.active(..)`، `active:`) تحصل على حالات ضغط متحركة:

```rust tabs
view()
    .on_press(save)
    .rounded_xl()
    .bg(BLUE.shade(600))
    .px_5()
    .py_3()
    .transition()
    .duration(150.0)
    .active(|s| s.scale(0.95).bg(BLUE.shade(800)))
    .child(text("Save").font_weight(FontWeight::SEMIBOLD).text_color(white()))
```

```tsx tabs
<View onPress={save} class="rounded-xl bg-blue-600 px-5 py-3 transition duration-150 active:scale-95 active:bg-blue-800">
  <Text class="font-semibold text-white">Save</Text>
</View>
```

يبدأ الانتقال من القيمة الظاهرة حاليًا على الشاشة، فإذا غيّرت الهدف مرة أخرى في منتصف الطريق انعطف الانتقال بسلاسة.

<a id="keyframe-animations"></a>

## الرسوم المتحركة بالإطارات المفتاحية المدمجة

تعمل أربعة رسوم مدمجة بالإطارات المفتاحية بشكل أصلي، وتتكرر إلى الأبد افتراضيًا: `spin` (دورة واحدة باتجاه عقارب الساعة)، `ping` (يكبر إلى ضعفين ويتلاشى)، `pulse` (يشحب إلى نصف الشفافية ثم يعود) و`bounce` (يقفز بمقدار ربع ارتفاعه ويهبط).

```rust tabs
view()
    .size_8()
    .rounded_full()
    .border(px(4.0))
    .border_color(ZINC.shade(300))
    .border_t_color(BLUE.shade(600))
    .animate_spin()
view().h_4().w_40().rounded(px(4.0)).bg(ZINC.shade(200)).animate_pulse()
```

```tsx tabs
<View class="size-8 rounded-full border-4 border-zinc-300 border-t-blue-600 animate-spin" />
<View class="h-4 w-40 rounded bg-zinc-200 animate-pulse" />
```

| النمط | Rust | النوع | الوصف |
|---|---|---|---|
| `animationName` | `.animate_spin()`، `.animate_ping()`، `.animate_pulse()`، `.animate_bounce()`، `.animate_none()`، أو `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | الرسم المتحرك. |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | تكرار واحد. |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | قبل أن يبدأ. |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | مثل `transitionTimingFunction` | المنحنى. |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | القيمة الافتراضية `"infinite"`. |

Tailwind: `animate-spin`، `animate-ping`، `animate-pulse`، `animate-bounce`، `animate-none`.

<a id="animated-values"></a>

## القيم المتحركة

القيمة المتحركة رقم يعيش على خيط واجهة المستخدم. أنشئ واحدة (`animated_value(..)` في Rust، و`createAnimatedValue` من `nsh` في TSX)، واربطها بالأنماط، وحرّكها؛ وتتبعها العروض المرتبطة بها في كل إطار دون تحديث.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let opacity = animated_value(1.0);
    let play = move || {
        spawn(async move {
            x.timing(240.0, 600.0, Easing::Curve(Curve::Cubic, EaseMode::Out)).await;
            opacity.timing(0.3, 200.0, Easing::EaseInOut).await;
            x.spring(0.0, Spring::default());
            opacity.timing_with(1.0, Timing::default());
        });
    };
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .gap_6()
        .child(
            view()
                .size(px(60.0))
                .rounded(px(12.0))
                .bg(rgb(0x0969da))
                .bind_opacity(&opacity)
                .bind_translate_x(&x),
        )
        .child(view().on_press(play).child(text("Play").text_color(rgb(0x0969da))))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue, Easing } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const opacity = createAnimatedValue(1);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#0969da", opacity, translate: [x, 0] }} />
      <View
        onPress={async () => {
          await x.timing(240, { duration: 600, easing: Easing.out(Easing.cubic) });
          await opacity.timing(0.3, { duration: 200 });
          x.spring(0);
          opacity.timing(1);
        }}
      >
        <Text style={{ color: "#0969da" }}>Play</Text>
      </View>
    </View>
  );
}

mount(App);
```

**ما يمكن ربطه:** `opacity` (`.bind_opacity(..)`)؛ و`backgroundColor` و`borderColor` (كل الجوانب) و`color` للنص (النص كله)، عبر استيفاء إلى الألوان (`.bind_background(..)`، `.bind_border_color(..)`، `.bind_color(..)`)؛ و`translate` (`[x, y]`، بقيمة لكل محور)، و`rotate` (بالدرجات)، و`scale` (`[x, y]` لكل محور، أو قيمة واحدة للمحورين)؛ وخطوات قائمة `transform`: `translateX`، `translateY`، `scale`، `scaleX`، `scaleY`، `rotate`، `rotateX`، `rotateY` و`rotateZ` (`.bind_translate_x(..)`، `.bind_translate_y(..)`، `.bind_scale(..)`، `.bind_rotate(..)` بالدرجات، `.bind_transform(kind, ..)` في Rust). تتغير الظلال عبر [الانتقالات](#transitions). وحلقة التركيز أو السعر الذي يومض بالأخضر هو استيفاء لوني مربوط بلون الحدود أو النص:

```rust tabs
let flash = animated_value(0.0);
let color = flash.interpolate_colors(&[0.0, 1.0], &[rgb(0x1f2328), rgb(0x1a7f37)]);

text(move || price.get().to_string()).bind_color(&color)
// On a new price: flash.set(1.0); flash.timing(0.0, 600.0, Easing::EaseInOut);
```

```tsx tabs
const flash = createAnimatedValue(0);
const color = flash.interpolate({ inputRange: [0, 1], outputRange: ["#1f2328", "#1a7f37"] });

<Text style={{ color }}>{price()}</Text>
// On a new price: flash.set(1); flash.timing(0, { duration: 600 });
```

تقود القيم المتحركة أيضًا [رسومات canvas](./canvas.md#driving-drawings-with-animated-values)، وتستقبل إزاحات التمرير ([`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)) والإيماءات ([`pan`، `pinch`، `rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)).

تبقى القيمة حيّة بفضل العروض المرتبطة بها والمكوّن الذي أنشأها، فيظل الربط متصلًا مهما جاءت متغيراتك وذهبت. أنشئ القيم المتحركة في المكوّن الذي يملكها (وليس على مستوى الوحدة (module) حين يحتاج كل نسخة إلى قيمتها الخاصة).
<a id="animatedvalue-methods"></a>

### دوال AnimatedValue

| TSX | Rust | الوصف |
|---|---|---|
| `set(value)` | `set(value)` | ينتقل فورًا إلى `value` ويوقف أي رسم متحرك. |
| `stop()` | `stop()` | يوقف الرسم المتحرك الجاري عند موضعه الحالي؛ وفي TSX يُحَلّ الوعد بالقيمة `{ value }`، أي القيمة عند ذلك الموضع. |
| `getValue()` | `value()` | القيمة الحالية، وتُقرأ على خيط واجهة المستخدم (UI thread) حيث تتحرك (وتستقر خلال إطار واحد): وعد (promise) في TSX، ونتيجة قابلة للانتظار في Rust. |
| `setOffset(offset)` | `set_offset(offset)` | يضيف `offset` إلى ما تعرضه القيمة: فترى الارتباطات (bindings) القيمة + الإزاحة، بينما `set` والرسوم المتحركة وعمليات السحب تحرّك القيمة نفسها. |
| `flattenOffset()` | `flatten_offset()` | يضيف الإزاحة إلى القيمة ويجعل الإزاحة 0. |
| `extractOffset()` | `extract_offset()` | ينقل القيمة إلى الإزاحة ويجعل القيمة 0: فيبدأ السحب التالي من 0، فوق الموضع الذي تركه السحب السابق. |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`، `timing_with(to, Timing { .. })` | يحرّك القيمة إلى `to` خلال `duration` مللي ثانية (الافتراضي 300، ومنحنى التسهيل `"easeInOut"`). |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | ينتقل بنمط الزنبرك إلى `to` (القيم الافتراضية: الصلابة 170، والتخميد 26، والكتلة 1). |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`، `decay_within(velocity, deceleration, (min, max), bounce)` | ينساب بدءًا من `velocity` (وحدات في الثانية) ثم يتباطأ (التباطؤ الافتراضي 0.998 لكل مللي ثانية). مع القيد `[min, max]` يتوقف عند حد، أو يرتد عنه محتفظًا بنسبة `bounce` (من 0 إلى 1) من سرعته. |

يعطي كل رسم متحرك نتيجة يمكنك انتظارها تبيّن هل انتهى: `true` إذا اكتمل حتى النهاية، و`false` إذا أوقفه شيء ما (`stop()` أو `set()` أو رسم متحرك جديد على القيمة نفسها). وهي `Promise<{ finished: boolean }>` في TSX و`AnimationEnd` في Rust، وتنتظرها المهمة (task) باستخدام `bool`. يؤدي بدء رسم متحرك جديد على قيمة متحركة إلى مقاطعة القديم بسلاسة: فالزنبرك أو الانزلاق دون سرعة ابتدائية يتابع بالسرعة الحالية للقيمة.

```rust tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() });   // wobbly
x.spring(200.0, Spring { stiffness: 400.0, damping: 30.0, ..Spring::default() });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
view().pan_values(Some(&x), None).on_pan_end(move |e: &PanEvent| {
    x.decay(Some(e.velocity_x), 0.998);
})

// A fling that stays on its track and bounces softly off its ends.
x.decay_within(Some(e.velocity_x), 0.998, (0.0, 300.0), 0.3);

// Where a value is now (it moves on the UI thread, so the answer is async).
let at = x.value().await;
```

```tsx tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200, { stiffness: 180, damping: 8 });   // wobbly
x.spring(200, { stiffness: 400, damping: 30 });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
<View pan={{ x }} onPanEnd={(e) => x.decay({ velocity: e.velocity.x })} />

// A fling that stays on its track and bounces softly off its ends.
x.decay({ velocity: e.velocity.x, clamp: [0, 300], bounce: 0.3 });

// Where a value is now (it moves on the UI thread, so the answer is async).
const where = await x.getValue();
```

<a id="keyframes"></a>

### الإطارات المفتاحية

يشغّل `keyframes` القيمة عبر إطارات مفتاحية (keyframes) كما تعمل إطارات CSS المفتاحية: `value.keyframes(frames, options)` في TSX، و`value.keyframes(frames, KeyframeTiming)` في Rust (`Animated.keyframes(value, { keyframes, ... })` و`Animation::keyframes(..)` بوصفها خطوة في [رسم متحرك مركّب](#composite-animations)). الإطار المفتاحي إما رقم (أو سلسلة زاوية مثل `"90deg"`) يُوزَّع بالتساوي مع بقية الإطارات، أو `{ offset, value, easing }` (`Keyframe::new(value)` و`Keyframe::at(offset, value)` و`.ease(easing)` في Rust).

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).easing(Easing::EaseOut).iterations(Some(3)),
);

// A clock hand that ticks once a second.
let hand = animated_value(0.0);
hand.keyframes(
    [Keyframe::new(0.0), Keyframe::new(360.0)],
    KeyframeTiming::new(60_000.0).easing(Easing::Steps(60, StepPosition::JumpEnd)).infinite(),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, easing: "easeOut", iterations: 3 });

// A clock hand that ticks once a second.
const hand = createAnimatedValue(0);
hand.keyframes([0, 360], { duration: 60_000, easing: Easing.steps(60), iterations: "infinite" });
```

| الخيار | Rust (`KeyframeTiming`) | الافتراضي | الوصف |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | مدة تكرار واحد، بالمللي ثانية. |
| `delay` | `.delay(ms)` | 0 | التأخير قبل التكرار الأول. |
| `easing` | `.easing(easing)` | قيمة CSS `ease` | منحنى كل مقطع ليس له تسهيل خاص به. |
| `iterations` | `.iterations(Some(n))`، `.infinite()` | 1 | عدد التكرارات، أو `"infinite"`. |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"` أو `"reverse"` أو `"alternate"` أو `"alternate-reverse"`. |

تعمل كما في CSS وWeb Animations API:

- يشكّل التسهيل كل مقطع على حدة، لا الحركة كلها: فـ`easing` الخاص بالإطار المفتاحي يشكّل المقطع الذي يبدأ عنده، و`easing` الخاص بالتوقيت يشكّل كل مقطع آخر.
- تتوزع الإطارات المفتاحية التي بلا إزاحة (offset) بالتساوي بين جاراتها؛ ويكون الأول افتراضيًا عند 0 والأخير عند 1.
- يبدأ كل تكرار بقفزة إلى إطاره المفتاحي الأول. وإذا لم يوجد إطار مفتاحي عند الإزاحة 0، تنطلق القيمة من موضعها الحالي.
- أثناء `delay` تحمل القيمة الإطار المفتاحي الأول فعلًا (`animation-fill-mode: backwards` في CSS)، فيعرض الدخول المتأخر إطاره الأول بدلًا من العرض في حالة السكون. وينطبق هذا على الحركات (motions) أيضًا.
- `reverse` والتكرارات العكسية في `alternate` تشغّل المقاطع بالعكس، مع عكس منحنى كل منها.
- تبقى القيمة حيث يتركها التكرار الأخير. وتبيّن النتيجة هل انتهت: `true` إذا انتهت، و`false` إذا أوقفها شيء ما.

<a id="interpolation"></a>

### الاستيفاء

يحوّل `interpolate` قيمةً عبر مقاطع خطية متعددة إلى أرقام أو ألوان أو زوايا، ويعيد عقدة جديدة يمكنك ربطها. ويمكن لقيمة واحدة أن تتحكم في خصائص كثيرة. في Rust يحوّل `interpolate(&input, &output)` إلى أرقام، و`interpolate_colors(&input, &colors)` إلى ألوان، ويقبل `interpolate_with(&input, output, Interpolation { .. })` الاستقراء (extrapolation) والتسهيل؛ أما في TSX فيقبلها `value.interpolate({ inputRange, outputRange })` جميعًا.

```rust tabs
let t = animated_value(0.0);

view()
    .bind_background(&t.interpolate_colors(&[0.0, 1.0, 2.0], &[rgb(0x54aeff), rgb(0x8250df), rgb(0xcf222e)]))
    .bind_opacity(&t.interpolate(&[0.0, 1.0], &[0.4, 1.0]))
    .bind_rotate(&t.interpolate(&[0.0, 1.0], &[0.0, 180.0]))
    .bind_scale(&t.interpolate_with(
        &[0.0, 1.0],
        AnimationOutput::Numbers(vec![0.6, 1.2]),
        Interpolation {
            easing: Easing::Curve(Curve::Back(1.70158), EaseMode::Out),
            ..Interpolation::default()
        },
    ))
```

```tsx tabs
const t = createAnimatedValue(0);

<View
  style={{
    backgroundColor: t.interpolate({ inputRange: [0, 1, 2], outputRange: ["#54aeff", "#8250df", "#cf222e"] }),
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }),
    scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2], easing: Easing.out(Easing.back()) }),
  }}
/>
```

| الخيار | Rust | الوصف |
|---|---|---|
| `inputRange` | شريحة المدخلات | نقاط إدخال متزايدة. |
| `outputRange` | شريحة المخرجات، أو `AnimationOutput` | مخرج واحد لكل نقطة: أرقام، أو ألوان (`"#rrggbb"` أو `"rgba(…)"` أو بالاسم)، أو زوايا (`"45deg"` أو `"1rad"`). |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | خارج نطاق المدخلات: `"clamp"` (الافتراضي)، أو `"extend"` (متابعة المقطعين الطرفيين)، أو `"identity"` (تمرير المدخل كما هو). |
| `extrapolateLeft`، `extrapolateRight` | `extrapolate_left`، `extrapolate_right` | الأمر نفسه، لجانب واحد. |
| `easing` | `easing` | يشكّل كل مقطع. |

> [!IMPORTANT]
> **تقيّد** عمليات الاستيفاء القيمة افتراضيًا: خارج نطاق المدخلات يبقى المخرج عند أقرب طرف. لذلك فإن سحب عرض التمرير (scroll view) إلى ما بعد أعلاه يُبقي الترويسة المرتبطة بالتمرير في حالتها النهائية. مرّر `extrapolate: "extend"` (`Extrapolate::Extend`) عندما تريد أن يستمر الخط.

<a id="arithmetic-and-diffclamp"></a>

### العمليات الحسابية وdiffClamp

تُدمج العقد بعمليات حسابية، وبشكل أصلي (native) أيضًا: `a.add(b)` و`a.sub(b)` و`a.mul(b)` و`a.div(b)` و`a.mod(b)` (`a.modulo(b)` في Rust؛ لا يكون الناتج سالبًا أبدًا عندما يكون `b` موجبًا، مثل الزوايا في النطاق 0..360)، حيث `b` عقدة أو رقم. وفي TSX، `Animated.add` و`subtract` و`multiply` و`divide` و`modulo` هي نفسها في صورة دوال.

يتتبع `diffClamp(min, max)` (`diff_clamp`) *تغيّرات* العقدة مع البقاء ضمن `min..max`. وعند تطبيقه على إزاحة التمرير، يصنع ترويسة تختفي عندما يُمرَّر المحتوى لأعلى وتعود بمجرد التمرير لأسفل:

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

scroll().flex_1().scroll_value(&offset)
view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 56);

<Scroll style={{ flex: 1 }} scrollValue={scroll}>…</Scroll>
<View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
```

مع `{ snap: true }` (`diff_clamp_with(min, max, DiffClamp::snapping())`)، إذا توقف التمرير والترويسة ظاهرة جزئيًا، فإنها تُكمل الحركة: تستقر ظاهرة بالكامل أو مخفية بالكامل، أيهما أقرب، خلال 200 مللي ثانية على خيط واجهة المستخدم. ولا تختفي إلا بعد أن تُمرَّر الصفحة بمقدار ارتفاعها على الأقل، فالصفحة التي تُمرَّر بأقل من ذلك تُظهر الترويسة كاملة. وإذا عاد التمرير أثناء الحركة، تتولى الترويسة من موضعها الحالي.

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

<a id="composite-animations"></a>

## الرسوم المتحركة المركّبة

تُبنى الرسوم المتحركة من خطوات (`Animation` في Rust، و`Animated` من `nsh` في TSX) وتعمل الشجرة كلها بشكل أصلي: تبدأ كل خطوة على خيط واجهة المستخدم لحظة انتهاء سابقتها، دون أي فجوة ودون أن تتدخل أي شيفرة من عندك بينهما.

```rust tabs
let ys: Vec<AnimatedValue> = (0..5).map(|_| animated_value(0.0)).collect();
let fade = animated_value(1.0);

let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -30.0, Timing::new(200.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);

let breathe = Animation::sequence([
    Animation::timing(&fade, 0.3, Timing::new(400.0, Easing::EaseInOut)),
    Animation::timing(&fade, 1.0, Timing::new(400.0, Easing::EaseInOut)),
])
.looped(None);

let landed = hop.start();
spawn(async move {
    status.set(if landed.await { "landed" } else { "stopped" });
});
```

```tsx tabs
import { Animated, createAnimatedValue, Easing } from "nsh";

const ys = [0, 1, 2, 3, 4].map(() => createAnimatedValue(0));
const fade = createAnimatedValue(1);

const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -30, duration: 200, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);

const breathe = Animated.loop(
  Animated.sequence([
    Animated.timing(fade, { toValue: 0.3, duration: 400 }),
    Animated.timing(fade, { toValue: 1, duration: 400 }),
  ]),
);

hop.start(({ finished }) => console.log(finished ? "landed" : "stopped"));
```

| TSX | Rust | الوصف |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | خطوة توقيت. |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | خطوة زنبرك. |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`، `Animation::decay_within(..)` | خطوة انزلاق (decay). |
| `Animated.sequence(list)` | `Animation::sequence(list)` | واحدة بعد أخرى. |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`، `.stop_together(..)` | جميعها في وقت واحد. |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`، `Animation::stagger_from(ms, StaggerFrom::Center, list)` | جميعها في وقت واحد، وتبدأ كل واحدة بعد `ms` من سابقتها، محسوبةً من `from`: `"first"` (الافتراضي)، أو `"last"`، أو `"center"` (تموّج يمتد من المنتصف إلى الخارج)، أو فهرس (`StaggerFrom::First` أو `Last` أو `Center` أو `Index(i)`). |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | خطوة [إطارات مفتاحية](#keyframes). |
| `Animated.delay(ms)` | `Animation::delay(ms)` | تنتظر. |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`، `.reset_before_iteration(..)` | تكرّر (إلى الأبد افتراضيًا؛ `None` في Rust). |

للرسم المتحرك المركّب `start()` (وفي TSX أيضًا مع دالة رد نداء ووعد، وكلاهما يُمرَّر إليه `{ finished }`؛ وفي Rust نتيجة قابلة للانتظار `bool`؛ واستدعاؤه مرة أخرى يشغّله من جديد)، و`stop()` (يتوقف عند موضعه)، و`reset()` (يتوقف ويعيد قيمه إلى ما كانت عليه عند بدئه). وتعمل دالة رد النداء مرة واحدة للشجرة كلها.

لا يُبقي الرسم المتحرك الجاري قيمَه حية: فعندما يزول المكوّن الذي يملكها (بعروضه ومتغيراته)، تتوقف معه أي حلقة لا نهائية، وتكون نتيجتها أنها لم تنتهِ (`false`).

<a id="easing"></a>

## التسهيل

منحنيات التسهيل (easing) بيانات تُقيَّم بشكل أصلي: `Easing` من `nsh` في TSX، والتعداد `Easing` في Rust.

| TSX | Rust | الوصف |
|---|---|---|
| `Easing.linear`، `Easing.ease` | `Easing::Linear`، `Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | سرعة ثابتة؛ ما يقابل `ease` في CSS. |
| `Easing.quad`، `Easing.cubic`، `Easing.poly(n)` | `Curve::Quad`، `Curve::Cubic`، `Curve::Poly(n)` | `t²`، `t³`، `tⁿ`. |
| `Easing.sin`، `Easing.circle`، `Easing.exp` | `Curve::Sin`، `Curve::Circle`، `Curve::Exp` | جيبي، ودائري، وأسّي. |
| `Easing.back(s?)` | `Curve::Back(s)` | يتراجع قبل الانطلاق (التجاوز `s`، والافتراضي 1.70158). |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | تجاوز مرن كالزنبرك. |
| `Easing.bounce` | `Curve::Bounce` | يرتد عند النهاية. |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | منحنى بيزييه تكعيبي، كما في CSS. |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | يقفز بين `count` من المستويات بدل أن يتحرك بسلاسة، كما يفعل `steps()` في CSS: صورة متحركة إطارًا بإطار، أو عقرب يدقّ. وقيمة `position` هي `"jump-end"` (الافتراضي، وكذلك `"end"`)، أو `"jump-start"` (`"start"`)، أو `"jump-none"` أو `"jump-both"`. |
| `Easing.in(e)`، `Easing.out(e)`، `Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`، `EaseMode::Out`، `EaseMode::InOut` | هذه المنحنيات هي منحنيات «الدخول» (in)؛ و`out` و`inOut` يعكسانها. |

في TSX يمكنك، في أي موضع يُقبل فيه تسهيل، تمرير اسم (`"linear"` أو `"ease"` أو `"easeIn"` أو `"easeOut"` أو `"easeInOut"`) أو مصفوفة بيزييه `[x1, y1, x2, y2]`؛ وفي Rust، `Easing::EaseIn` و`Easing::EaseOut` و`Easing::EaseInOut` هي منحنيات CSS.

```rust tabs
x.timing(1.0, 300.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
x.timing(1.0, 300.0, Easing::EaseOut);
x.timing(1.0, 300.0, Easing::Bezier(0.2, 0.8, 0.2, 1.0));
```

```tsx tabs
x.timing(1, { easing: Easing.out(Easing.back()) });
x.timing(1, { easing: "easeOut" });
x.timing(1, { easing: [0.2, 0.8, 0.2, 1] });
```

يعيد `Easing.sample(easing, count)` (`sample_easing` في Rust) المنحنى عند `count` من النقاط المتباعدة بالتساوي من 0 إلى 1، ويعيد `Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)` (`sample_spring`، `sample_decay`) القيم التي يمرّ بها الزنبرك أو الانزلاق، قيمة لكل إطار (60 في الثانية افتراضيًا) بدءًا من `config.from` (0) حتى النهاية. وتُحسب بالشيفرة الأصلية نفسها التي تعمل بها الرسوم المتحركة، لذا فإن رسم المنحنى البياني يعرض بالضبط ما يفعله الرسم المتحرك:

```rust tabs
use nsh_core::element::{sample_easing, sample_spring};

let curve = sample_easing(Easing::Curve(Curve::Back(1.70158), EaseMode::Out), 50); // 50 progress values
let spring = sample_spring(0.0, 1.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() }, 60.0);
```

```ts tabs
const curve = Easing.sample(Easing.out(Easing.back()), 50); // 50 progress values
const spring = Animated.sampleSpring({ toValue: 1, stiffness: 180, damping: 8 });
```

## LayoutAnimation

تحرّك الرسوم المتحركة للتخطيط (layout animation) تغيّرات الإطارات في التحديث **التالي** بشكل أصلي: العروض التي تتحرك أو يتغير حجمها تنزلق إلى إطاراتها الجديدة، والعروض الجديدة تظهر تدريجيًا (أو بتكبير)، والعروض المحذوفة تتلاشى. استدعِها قبل تغيير الحالة مباشرة: `animate_layout(..)` في Rust، و`LayoutAnimation.configureNext(config)` في TSX.

```rust tabs
use nsh_core::element::LayoutAnimation;

let items = signal(vec![1, 2, 3]);
let next = stored(4);

let add = move || {
    animate_layout(LayoutAnimation::SPRING);
    let n = next.with(|n| {
        *n += 1;
        *n - 1
    });
    items.update(|i| i.insert(0, n));
};
let remove = move || {
    animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
    items.update(|i| {
        i.remove(0);
    });
};
```

```tsx tabs
import { signal } from "nsh";
import { LayoutAnimation } from "nsh";

const items = signal([1, 2, 3]);
let next = 4;

const add = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  items.set([next++, ...items()]);
};
const remove = () => {
  LayoutAnimation.easeInEaseOut();
  items.set(items().slice(1));
};
```

| TSX | Rust | الوصف |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | يحرّك تغيّرات الالتزام (commit) التالي؛ وفي TSX يعمل `onEnd` عند الانتهاء. |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | إعداد بمنحنى واحد للمراحل الثلاث. |
| `Presets.easeInEaseOut`، `Presets.linear`، `Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`، `LINEAR`، `SPRING` | إعدادات جاهزة. |
| `easeInEaseOut(onEnd?)`، `linear(onEnd?)`، `spring(onEnd?)` | `animate_layout` مع إعداد مسبق | `configureNext` مع إعداد مسبق. |
| `Types`، `Properties` | `LayoutCurve`، `LayoutProperty` | الأسماء، لبناء الإعدادات. |

الإعداد هو `{ duration, create?, update?, delete? }` (`LayoutAnimation { create, update, delete }` في Rust): `create` للعروض المُدرَجة، و`update` للعروض التي نُقلت أو تغيّر حجمها، و`delete` للعروض المحذوفة. وكل مرحلة هي `{ type?, property?, duration?, delay?, springDamping? }` (`LayoutTransition { curve, property, duration_ms, delay_ms }`)، حيث `type` هو `"easeInEaseOut"` أو `"spring"` أو `"linear"` أو `"easeIn"` أو `"easeOut"` أو `"keyboard"` (منحنى لوحة المفاتيح البرمجية نفسها، ويُحتسب توقيته من لحظة بدء حركة لوحة المفاتيح، ليتحرك معها ما يُفسح لها المكان؛ `LayoutCurve::Keyboard`)، و`property` هي الخاصية التي تتحرك عند ظهور العروض واختفائها (`"opacity"` أو `"scaleXY"` أو `"scale"`)، و`springDamping` (من 0 إلى 1، والافتراضي 0.7؛ `LayoutCurve::Spring { damping }`) يحدد مقدار تجاوز الزنبرك.

```rust tabs
use nsh_core::element::{LayoutAnimation, LayoutCurve, LayoutProperty, LayoutTransition};

animate_layout(LayoutAnimation {
    create: Some(LayoutTransition::new(LayoutCurve::EaseOut, 300.0)),
    update: Some(LayoutTransition::new(LayoutCurve::Spring { damping: 0.8 }, 300.0)),
    delete: Some(LayoutTransition {
        property: LayoutProperty::Scale,
        ..LayoutTransition::new(LayoutCurve::EaseIn, 300.0)
    }),
});
```

```tsx tabs
LayoutAnimation.configureNext({
  duration: 300,
  create: { type: "easeOut", property: "opacity" },
  update: { type: "spring", springDamping: 0.8 },
  delete: { type: "easeIn", property: "scaleXY" },
});
```

تشمل الرسوم المتحركة للتخطيط كل إطار يغيّره التحديث، في أي مكان على الشاشة: فالقائمة التي تتحدث، أو البيانات الحية التي تصل في التحديث نفسه، تتحرك معه. وفي مكوّن Rust، حرّك فقط ما يتحرك مع تغيّر عنصر واحد باستخدام `ElementRef::animate_layout(transition)`: إطار العنصر نفسه وإطار محتواه، وإطارات العروض التي يدفعها حجمه (أشقاؤه وأبناؤهم، وصولًا إلى الشاشة). أما بقية إطارات التحديث فتتغير دفعة واحدة. وهكذا يكشف `nsh/base` عن محتوى `Collapsible` و`AccordionPanel`.

```rust
use nsh_core::element::{LayoutCurve, LayoutTransition};

let region = element_ref();
let open = signal(false);
let toggle = move || {
    region.animate_layout(LayoutTransition::new(LayoutCurve::Spring { damping: 1.0 }, 265.0));
    open.update(|o| *o = !*o);
};
view()
    .element_ref(&region)
    .overflow_hidden()
    .style_with(move |s| if open.get() { s } else { s.h(px(0.0)) })
```

<a id="what-runs-where"></a>

## ما يعمل وأين

| | يعمل على | شيفرتك في كل إطار |
|---|---|---|
| الانتقالات، والرسوم المتحركة بالإطارات المفتاحية | خيط واجهة المستخدم | لا شيء |
| الحركات، والإطارات المفتاحية، و`timing` / `spring` / `decay`، والرسوم المركّبة | خيط واجهة المستخدم | لا شيء؛ تعرف شيفرتك فقط عند انتهائها |
| `interpolate`، والعمليات الحسابية، و`diffClamp` | خيط واجهة المستخدم | لا شيء |
| `scrollValue`، و`pan` / `pinch` / `rotation` | خيط واجهة المستخدم | لا شيء؛ تعرف شيفرتك البداية والنهاية |
| الرسوم المتحركة للتخطيط | خيط واجهة المستخدم | لا شيء |
| حلقات `requestAnimationFrame` (`request_animation_frame` في Rust)، ومعالجات `onScroll`، و`PanResponder` | شيفرتك، ثم تحديث | كل إطار |

لا تلجأ إلى `requestAnimationFrame` (دالة عامة في TSX، وتتبع معدل تحديث الشاشة) إلا لما لا يمكن وصفه مسبقًا، مثل محاكاة فيزيائية في شيفرتك. وكل ما يمكن أن يكون قيمة متحركة ينبغي أن يكون كذلك.

<a id="reduced-motion"></a>

## تقليل الحركة

عندما يطلب المستخدم حركة أقل (iOS «Reduce Motion»، وAndroid «Remove animations»)، تكون قيمة `reduce_motion()` في Rust و`reduceMotion()` من `nsh` في TSX هي `true`، وتُطبَّق متغيرات Tailwind ‏`motion-reduce:` / `motion-safe:`.

[الحركات](#motion) تتبع هذا الإعداد من تلقاء نفسها: فـ`play` و`enter` يصلان فورًا إلى حيث تنتهي الحركة، دون أن يتحركا، وتكون النتيجة أنها انتهت (`true`)، كما في حركة اكتمل تشغيلها. ويظل الخروج ينتهي بالإخفاء، ويظل الدخول ينتهي في حالة السكون. مرّر `ignoreReduceMotion: true` (`play_ignoring_reduce_motion` في Rust) للحركة التي تحمل معنى يحتاجه المستخدم، مثل مؤشر التقدم الدوّار.

أما الانتقالات، والرسوم المتحركة بالإطارات المفتاحية، والقيم المتحركة، والإطارات المفتاحية، والرسوم المركّبة فتعمل كما كُتبت؛ استخدم ما يلي لاختيار بديل أهدأ:

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        panel.spring(0.0, Spring::default());
    }
};

view().style_when(|| !reduce_motion(), |s| s.animate_bounce())
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";

const open = () => (reduceMotion() ? panel.set(0) : panel.spring(0));

<View class="motion-safe:animate-bounce" />
```

راجع [إمكانية الوصول](./accessibility.md#reduced-motion).

<a id="related"></a>

## ذات صلة

- [واجهة الرسوم المتحركة في `nsh`](../modules/nsh.md#animation): مرجع TSX.
- [اللمس والإيماءات](./touch-and-gestures.md): التحكم في القيم المتحركة بالإصبع.
- [التمرير](./scrolling.md#scroll-linked-effects-scrollvalue): `scrollValue`.
- [Canvas](./canvas.md#driving-drawings-with-animated-values): القيم المتحركة في الرسومات.
- [مرجع الأنماط](../modules/style-reference.md): المفتاحان `transition*` و`animation*`.
