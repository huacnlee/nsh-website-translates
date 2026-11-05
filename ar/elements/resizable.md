---
title: "Resizable"
description: "ResizablePanelGroup و ResizablePanel: لوحات متجاورة أو متراصة فوق بعضها، وبين كل لوحتين مقبض يسحبه المستخدم لتقاسم المساحة. تتولى المجموعة السحب، وحدود اللوحات، ومؤشر تغيير الحجم، ودور المقابض لقارئات الشاشة؛ أما الأحجام ومظهر المقابض ومحتوى اللوحات فهي من مسؤولية التطبيق."
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---

# Resizable

تضع المجموعة القابلة لتغيير الحجم اللوحات جنبًا إلى جنب أو فوق بعضها، مع مقبض عند كل حد بين لوحتين: شريط جانبي بجوار مستند، ومحرر فوق وحدة التحكم الخاصة به، وقائمة بجوار تفاصيلها. يسحب المستخدم المقبض لتحريك الحد، وتبقى كل لوحة ضمن الأحجام التي يسمح بها التطبيق لها. يتولى `ResizablePanelGroup` السلوك: السحب، الذي يعمل أصليًا إطارًا بإطار، وكيفية توزيع المساحة، ومؤشر تغيير الحجم، ومنطقة لمس أكبر للإصبع. أما المظهر فهو من مسؤولية التطبيق: المقبض شريط بلا خط أو لون أو مقبض إمساك خاص به، وما يرسمه هو مؤشر التطبيق؛ واللوحات هي واجهات التطبيق.

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

يأتي `ResizablePanelGroup` و`ResizablePanel` من [`nsh/base`](../modules/nsh-base.md)، وهي حزمة `nsh-base` (crate) في Rust. اللوحات هي الأبناء المباشرون للمجموعة. في Rust، ينشئ `h_resizable()` و`v_resizable()` مجموعة على كل محور (يأخذ `resizable_panel_group().axis(..)` المحور كقيمة)، وينشئ `resizable_panel()` لوحة، مع دالة ضبط لكل خاصية، ومستمع لكل حدث، ودوال الأنماط المضبوطة الأنواع، و`.child(..)` لمحتواها؛ ويضبط `.size_range(min..max)` الحدّين معًا.

<a id="sizes"></a>

## الأحجام

`size` للوحة هو الحجم الذي تريده، ضمن `minSize` و`maxSize`. اللوحات التي لا تملك حجمًا تتقاسم المتبقي بالتساوي مهما كان محتواها؛ وعندما يكون لكل لوحة حجم، تُقسَّم المساحة المتبقية بنسبتها. وأثناء سحب المستخدم لمقبض، تنقل المجموعة المساحة بين اللوحات داخل النواة، دون المرور بـ JS:

- عند تكبير اللوحة التي قبل المقبض، تُؤخذ المساحة من اللوحات التي بعده، الأقرب أولًا، كلٌّ حتى `minSize` الخاص بها، مع تجاوز اللوحات `fixed`.
- عند تصغيرها إلى ما دون `minSize` الخاص بها، تُؤخذ المساحة من اللوحات التي قبلها.
- لا تكبر أي لوحة فوق `maxSize` الخاص بها، ولا يتجاوز مجموع اللوحات حجم المجموعة أبدًا.

عندما ينتهي سحب غيّر الأحجام، تبلّغ المجموعة بحجم كل لوحة مرئية، بالترتيب الذي تُرتَّب به (`onResize` على المجموعة)، وتبلّغ كل لوحة تغيّر حجمها بحجمها (`onResize` على اللوحة). تحتفظ اللوحات التي حرّكها السحب بأحجام المستخدم إلى أن يمرر التطبيق قيمة `size` جديدة؛ ويحتفظ التطبيق بها بعد انتهاء عمر المجموعة بتمرير الأحجام المُبلَّغ عنها مجددًا بوصفها `size`، بحيث يُفتح التخطيط الذي يستعيده من [التخزين](../modules/nsh.md#storage) بالأحجام التي تركها المستخدم. لا يُبلَّغ إلا عن السحب وخطوات قارئات الشاشة: تغيير حجم النافذة أو إظهار لوحة أو إخفاؤها لا يبلّغ عن شيء.

عندما تكبر المجموعة أو تصغر (تغيير حجم النافذة)، تحتفظ اللوحات ذات الحجم بحجمها وتتحمل اللوحات التي بلا حجم الفرق. وعندما تكون المجموعة أصغر من الأحجام المطلوبة، تتقلص اللوحات، باستثناء اللوحات `fixed` (شريط جانبي، لوحة فحص)، وتعود إلى أحجامها عندما تعود المساحة. اللوحة التي عليها `visible={false}` لا تشغل أي مساحة: تتقاسم اللوحات الأخرى مساحتها، وتعود بحجمها عندما تظهر من جديد.

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

<a id="handles"></a>

## المقابض

يوجد مقبض عند كل حد بين لوحتين مرئيتين: شريط سمكه 9 نقاط عبر المحور، متمركز على الحد، مع مؤشر تغيير الحجم الخاص بمحوره. على شاشات اللمس تمتد منطقة اللمس الخاصة به 10 نقاط إضافية على كل جانب، فيبقى الإمساك بخط سمكه نقطة واحدة سهلًا. المقبض هو `group`: وما يرسمه هو مؤشر التطبيق، ويُنسَّق باستخدام `handleClass` / `handleStyle`: نقطة واحدة عبر المحور وبكامل طول الحد، فيكون `bg-border` وحده خطًا رفيعًا على أي من المحورين، ويزيد `w-[3px]` أو `h-[3px]` من سمكه، وتتبع فئتاه `group-hover:` و`group-active:` المؤشر فوق الشريط والضغط أو السحب. وللحصول على أكثر من خط (مقبض إمساك من نقاط، أو أيقونة)، يعرض `renderHandle` محتوى المؤشر، مع إبلاغه بـ `index` و`axis` و`state` الخاصة بالمقبض؛ ويُرسم من جديد عندما تتغير الحالة، بضع مرات في كل سحب، وليس مع كل حركة. أما مقبض الإمساك المتحرك فهو إبهام المقبض (`handleThumbClass` / `handleThumbStyle`): واجهة واحدة متمركزة على الخط، تُرسم قائمة وتُدار ربع دورة على الخط الأفقي بحيث تخدم فئة واحدة المحورين معًا، وتعرضها وتنتقل بها فئتا `group-hover:` و`group-active:`؛ ويبقى المقبض مضغوطًا طوال السحب، أينما ذهب المؤشر.

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

يُبقي `disabled` كل مقبض في مكانه (تخطيط مقفل).

<a id="props"></a>

## الخصائص

### ResizablePanelGroup

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `axis` | `h_resizable()`, `v_resizable()`, `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | جنبًا إلى جنب (تُسحب المقابض يمينًا ويسارًا) أو فوق بعضها (أعلى وأسفل). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا سحب: تبقى المقابض في أماكنها. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | لا شيء | مؤشر كل مقبض، على الحد داخل شريط المقبض: نقطة واحدة عبر المحور وبكامل طول الحد ما لم يُحدَّد غير ذلك (`w-[3px]`, `h-[3px]`)؛ ويتبع `group-hover:` و`group-active:` الشريط. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | لا شيء | إبهام كل مقبض: مقبض إمساك متمركز على الخط، يُرسم قائمًا كما على خط عمودي ويُدار ربع دورة على الخط الأفقي، بحيث تخدم فئة واحدة المحورين. يبقى الواجهة نفسها أثناء تمرير المؤشر فوق المقبض وضغطه وسحبه، ولذلك تنتقل به فئتا `group-hover:` و`group-active:` (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | لا شيء | ما بداخل كل مؤشر، ويُرسم من جديد عندما يتغير `state` الخاص بالمقبض. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | لا شيء | ما تقوله قارئات الشاشة عن كل مقبض: ما الذي يغيّر حجمه. تضبطه بمقدار 10 نقاط في كل مرة. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | عناصر `ResizablePanel`، وهي أبناؤها المباشرون. |
| `class`, `style` | دوال الأنماط | `string`, `StyleProp<ViewStyle>` | `size-full` | المجموعة نفسها؛ تملأ الأصل الخاص بها ما لم تقل فئتها غير ذلك. |

### ResizablePanel

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | لا شيء | الطول الذي تريده على محور المجموعة، بالنقاط، ضمن `minSize` و`maxSize`؛ وتؤدي القيمة الجديدة إلى تغيير حجمها. وبدونها تتقاسم المتبقي. |
| `minSize` | `.min_size(..)`, `.size_range(..)` | `number` | `100` | أصغر حجم تبلغه. |
| `maxSize` | `.max_size(..)`, `.size_range(..)` | `number` | بلا حد | أكبر حجم تبلغه. |
| `fixed` | `.fixed(..)` | `boolean` | `false` | تحتفظ بحجمها عندما تكون المجموعة أصغر من اللوحات؛ ويظل سحب مقبضها يغيّر حجمها. تأخذ `size`. |
| `visible` | `.visible(..)` | `boolean` | `true` | عند إخفائها لا تشغل أي مساحة وتتقاسم اللوحات الأخرى مساحتها. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | محتواها. |
| `class`, `style` | دوال الأنماط | `string`, `StyleProp<ViewStyle>` | لا شيء | سطح اللوحة الخاص بها. حجمها على المحور تحدده المجموعة. |

### ResizeHandleContext

| الحقل | النوع | الوصف |
|---|---|---|
| `index` | `number` | الحد الذي يلي اللوحة المرئية رقم `index`. |
| `axis` | `"horizontal" \| "vertical"` | المحور الذي يغيّر حجمه. |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | المسافة التي قطعها المؤشر أو الإصبع معه. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onResize` (`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | انتهى سحب وحرّك مقبضًا، أو ضبط قارئ شاشة أحد المقابض: `sizes`، أي حجم كل لوحة مرئية، بالترتيب الذي تُرتَّب به (من اليسار إلى اليمين، ومن الأعلى إلى الأسفل). |
| `onResize` (`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | انتهى سحب وغيّر حجم هذه اللوحة: `size`، أي الحجم الجديد، ليُمرَّر مجددًا بوصفه `size` الخاص بها. |

<a id="parts"></a>

## الأجزاء

| الجزء | داخل | يُنسَّق باستخدام | الحالات |
|---|---|---|---|
| المجموعة | | `class`، `style` الخاصة بـ `ResizablePanelGroup` | |
| لوحة | المجموعة | `class`، `style` الخاصة بـ `ResizablePanel` | |
| مؤشر المقبض | شريط المقبض، على حد | `handleClass`, `handleStyle`, `renderHandle` | `group-hover:` تحت المؤشر، `group-active:` أثناء الضغط أو السحب؛ `state` في `renderHandle` |
| إبهام المقبض | متمركز على خط المقبض | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (مضغوط حتى ينتهي السحب) |

<a id="accessibility"></a>

## إمكانية الوصول

- كل مقبض عنصر قابل للضبط بالنسبة إلى قارئات الشاشة، وتسميته `handleAccessibilityLabel`. وقيمته هي حجم اللوحة التي قبله، ضمن `minSize` و`maxSize` الخاصين بتلك اللوحة.
- يؤدي التمرير لأعلى أو لأسفل على المقبض باستخدام VoiceOver، أو مفاتيح الصوت في TalkBack، إلى تحريكه 10 نقاط، كما يفعل السحب؛ وتبلّغ المجموعة بذلك عبر `onResize`. وتبقى مقابض المجموعة `disabled` في أماكنها.
- محتوى اللوحات من مسؤولية التطبيق، ويُقرأ كما يُقرأ في أي مكان آخر.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات حول المنصات

- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: يُظهر المؤشر فوق المقبض مؤشر تغيير حجم العمود أو الصف، ويحرّك السحب بالفأرة أو لوحة اللمس الحد.
- iOS وAndroid وMac Catalyst: يسحب الإصبع المقبض، ضمن منطقة لمس أعرض بمقدار 10 نقاط على كل جانب من الشريط.
- في التخطيطات من اليمين إلى اليسار، تتبع اللوحات وأحجامها ترتيب التخطيط.
- تعرض كل منصة ما ينسّقه التطبيق: المؤشرات واللوحات.
- انقسامات [Dock](./dock.md) هي مجموعات قابلة لتغيير الحجم: ويُغيَّر حجمها بالطريقة نفسها.
