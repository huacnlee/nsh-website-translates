---
title: "Toast"
description: "Toast وToastStack وToastManager: إشعارات Toast بلا تنسيق مثل تلك الموجودة في gpui-base، مع عنصر جذر دلالي يحمل حالة الانتقال، ومكدس يرتّب الإشعارات على شكل طبقات، ودورة حياتها بدون واجهة (headless)."
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---

# Toast

الـ Toasts رسائل قصيرة تظهر لفترة وجيزة فوق التطبيق: "تم النسخ"، "تم حذف المسودة · تراجع"، "تعذّر الإرسال".
`nsh/base` يوفّر سلوكها في ثلاث قطع غير مصمَّمة الشكل، تماماً مثل `gpui-base` في GPUI Kit:

- **`ToastManager`** يحافظ على ترتيب الـ toasts مع دورة حياتها: كل واحد منها `"starting"`، ثم `"present"` بعد انقضاء مدة الحركة، ويعدّ مهلته تنازلياً ما دام ظاهراً وغير متوقف مؤقتاً، ويبقى `"ending"` طوال مدة الخروج قبل أن تتم إزالته.
- **`ToastStack`** يقيس الـ toasts ويرتّبها انطلاقاً من إحدى الحواف، بحيث يكون الأحدث أقربها إليها: طبقات متراكبة في حالة الطي، وقائمة في حالة التوسيع (عندما يكون المؤشر فوقها أو إصبع مضغوط عليها)، وتتحرك بنوابض.
- **`Toast`** هو الجذر لكل toast: الدور `alert`، و`transitionStatus` الخاص به لأنماط التطبيق، وسحبة (swipe) تطلب إغلاقه، وقارئ الشاشة الذي يقرأ تسميته عند ظهوره.

الشكل والمحتوى من شأن التطبيق، وكذلك سهولة عرض toast من أي مكان: يبني التطبيق
`toast(...)` الخاص به فوق هذه القطع، كما يفعل المعرض (`examples/gallery/toast.tsx`)، وكما بُنيت إشعارات GPUI Kit
فوق toasts الخاصة بـ `gpui-base`.

```rust tabs
use std::time::Duration;

use nsh_core::{time::now, prelude::*};

use nsh_base::{
    Anchor, ToastManager, ToastMotion, ToastOptions, ToastStackState, theme, toast, toast_stack,
};

fn toasts() -> impl IntoElement {
    let manager = stored(ToastManager::<u64, SharedString>::new(ToastMotion::sonner()));
    let shown = signal(Vec::new());
    let state = ToastStackState::new();
    let sync = move || {
        shown.set(manager.with(|m| {
            m.visible(3)
                .map(|(id, t, s)| (*id, t.clone(), s))
                .collect::<Vec<_>>()
        }))
    };
    // Advance the lifecycle while toasts are mounted, paused while expanded.
    set_interval(Duration::from_millis(50), move || {
        if manager.with(|m| m.advance(now(), state.is_expanded()).changed) {
            sync();
        }
    });
    manager.with(|m| {
        m.push(
            1,
            "Copied".into(),
            ToastOptions::timeout(Some(Duration::from_secs(5))),
            now(),
        )
    });
    sync();
    toast_stack()
        .placement(Anchor::BottomCenter)
        .state(state)
        .w(px(340.0))
        .child(each(
            shown,
            |(id, _, _)| *id,
            move |item, _| {
                toast()
                    .transition_status(move || item.get().2)
                    .accessibility_label(move || Some(item.get().1))
                    .on_dismiss_request(move || {
                        manager.with(|m| m.dismiss(&item.get().0, now()));
                    })
                    .rounded_xl()
                    .px_4()
                    .py_3()
                    .bg(move || theme().card)
                    .shadow_lg()
                    .transition_all()
                    .duration(200.0)
                    .starting_class("opacity-0 translate-y-4")
                    .ending_class("opacity-0 scale-95")
                    .child(text(move || item.get().1))
            },
        ))
}
```

```tsx tabs
import { Overlay, signal, Text, safeArea } from "nsh";
import { Toast, type ToastEntry, ToastManager, ToastStack } from "nsh/base";

const manager = new ToastManager();
const shown = signal<ToastEntry[]>([]);
const expanded = signal(false);
const sync = () => shown.set(manager.visible(3));
// Advance the lifecycle on a timer, paused while the stack is expanded.
setInterval(() => {
  if (manager.advance(expanded()).changed) sync();
}, 50);

export function toast(title: string) {
  manager.push(crypto.randomUUID(), { title }, { timeout: 5000 });
  sync();
}

export function Toaster() {
  return (
    <Overlay class="inset-x-0 bottom-0 items-center p-4" style={{ paddingBottom: safeArea().bottom + 16 }}>
      <ToastStack placement="bottomCenter" class="w-80" onExpandedChange={(e) => expanded.set(e.expanded)} onCancel={() => {
        const newest = shown().filter((t) => t.status !== "ending").at(-1);
        if (newest) { manager.dismiss(newest.id); sync(); }
      }}>
        <Each of={shown()} key={(t: ToastEntry) => t.id}>
          {(t) => (
            <Toast
              transitionStatus={t().status}
              accessibilityLabel={(t().value as { title: string }).title}
              onDismissRequest={() => { manager.dismiss(t().id); sync(); }}
              class="rounded-xl bg-card px-4 py-3 shadow-lg transition-all duration-200"
              startingClass="opacity-0 translate-y-4"
              endingClass="opacity-0 scale-95"
            >
              <Text class="font-semibold text-card-foreground">{(t().value as { title: string }).title}</Text>
            </Toast>
          )}
        </Each>
      </ToastStack>
    </Overlay>
  );
}
```

`Toast` و`ToastStack` و`ToastManager` تأتي من [`nsh/base`](../modules/nsh-base.md). في Rust هي
`toast` و`toast_stack` و`ToastManager` من `nsh_base`.

## ToastManager

المدير بلا واجهة (headless): لا يعرض شيئاً ولا يشغّل أي مؤقّت. يدفع التطبيق الـ toasts إليه، ويعرض تلك التي
يعيدها `visible(limit)` مع حالتها، ويستدعي `advance` على مؤقّت ما دام أي منها مثبّتاً، مع تمرير `paused`
أثناء توسيع المكدّس. في Rust هو `ToastManager<I, T>` فوق معرّفات التطبيق وقيمه، مع `Instant` لكل
استدعاء؛ وفي TS هو صنف (class) فوق معرّفات نصية وأي قيمة JSON، على ساعة المحرك (بما في ذلك الساعة اليدوية
في الاختبارات).

- `push(id, value, options)` يضيف أحدث toast، ويستبدل أي toast يحمل المعرّف نفسه (ويعيد قيمته)؛
  و`options.timeout` هي مدة بقائه بالمللي ثانية (بدونها: يبقى حتى يُغلق).
- `dismiss(id)` يبدأ خروج toast؛ و`dismissAll()` يبدأ خروج كل الـ toasts، ويعيد معرّفاتها.
- `advance(paused)` يقدّم دورة الحياة ويبلغ بما تغيّر: `presented`، و`ending` (انتهت مهلتها)،
  و`removed` (مع قيمها)، و`changed`.
- `visible(limit)` هي أحدث `limit` من الـ toasts التي لا تخرج حالياً، إضافة إلى الخارجة منها، الأقدم أولاً؛ و`entries()`
  (في Rust `iter()`) كلها؛ ثم `get(id)` و`len()` و`isEmpty()`.

`ToastMotion` يحمل قيم (tokens) الاثنين معاً: `duration` (400 مللي ثانية: الموعد النهائي للدخول واستجابة نابض المكدّس)،
`exitDuration` (200 مللي ثانية)، `collapsedPeek` (14)، `expandedGap` (14)، `collapsedScaleStep` (0.05)، و
`collapsedVisible` (3)، وهي قيم Sonner (`ToastMotion::sonner()` في Rust؛ الحقول المحذوفة في TS تحتفظ بها).

## ToastStack

أبناء المكدّس هم الـ toasts الخاصة به، الأقدم أولاً. انطلاقاً من حافته `placement` (`"topRight"` افتراضياً؛ وتُرتَّب
الحواف السفلية صعوداً)، تتراكب الـ toasts المطوية بمسافة `collapsedPeek` بينها، وكل toast إضافي أضيق
بمقدار `collapsedScaleStep`، ولا يظهر إلا `collapsedVisible`؛ وعند التوسيع تصبح قائمة بمسافة `expandedGap` بينها. الـ toasts التي
تصل أو تغادر، وكذلك التوسيع، تتحرك بنوابض مخمَّدة حرجياً. يكون المكدّس موسَّعاً ما دام المؤشر فوقه
أو إصبع مضغوط عليه (`onExpandedChange({ expanded })`؛ في Rust `ToastStackState`، الذي تقرؤه `is_expanded()`)، وبذلك
يوقف التطبيق المهل مؤقتاً أثناء قراءة المستخدم للـ toasts أو لمسها.

التطبيق هو من يضع المكدّس: في [Overlay](./overlay.md) عند الحافة، داخل المنطقة الآمنة. `class` و`style` الخاصان به
يحددان عرضه. وما دام يحتوي على toasts فإنه يستمع إلى Escape وزر الرجوع في Android (`onCancel`؛ و`closeOnEscape={false}`
يتركهما لبقية التطبيق): فيغلق الأحدث.

<a id="toast-1"></a>

## Toast

الـ toast هو الدور `alert` حول محتوى التطبيق. `transitionStatus` الخاص به يأتي من المدير، وتتبعه فئات الحالة (state classes)
عبر `class`: `startingClass` في إطاره الأول أثناء `"starting"`، بحيث تتحرك فئات `transition` الخاصة به
منها (`starting:` في Tailwind، و`@starting-style` في CSS)؛ و`endingClass` أثناء `"ending"`، طوال مدة الخروج؛
و`swipingClass` بينما يسحبه مؤشر (`transition-none` يبقيه تحت الإصبع).

سحب الإصبع أو الفأرة نحو `swipeDirection` (`"right"` افتراضياً؛ و`null` يعطّل السحب) يحرّكه، بعد
أن يتحرك المؤشر فعلاً، وبذلك تبقى أزراره أزراراً؛ وعند الإفلات بعد تجاوز `swipeThreshold` نقطة (50) أو بحركة خاطفة، يتابع
خروجه ويطلب إغلاقه (`onDismissRequest`)، وإن كان دون ذلك يعود إلى مكانه. ويقرأ قارئ الشاشة
`accessibilityLabel` الخاص به عند ظهوره.

<a id="toast-props"></a>

## خصائص Toast

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | مرحلة دورة حياته. |
| `startingClass`، `endingClass`، `swipingClass` | `.starting_class(..)`، ... | `string` | لا شيء | فئاته في إطاره الأول، وأثناء الخروج، وأثناء السحب. |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | الاتجاه الذي يُسحب نحوه لإبعاده. |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | المسافة التي تقطعها السحبة قبل أن يطلب الإفلات إغلاقه. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما يقرؤه قارئ الشاشة عند ظهوره. |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | لا شيء | سحبه المستخدم بعيداً. |

<a id="toaststack-props"></a>

## خصائص ToastStack

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | قيم Sonner | قيم الحركة الخاصة به. |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | الحافة التي يرتّب منها. |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | يستمع إلى Escape والرجوع ما دام يحتوي على toasts. |
| `onExpandedChange` | `.on_expanded_change(..)`، `.state(..)` | `(e: { expanded: boolean }) => void` | لا شيء | التفاعل وسّعه أو طواه. |
| `onCancel` | `.on_cancel(..)` | `() => void` | لا شيء | Escape أو الرجوع: إغلاق الأحدث. |
