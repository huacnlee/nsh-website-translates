---
title: "Dock"
description: "DockArea: مساحة عمل قابلة للإرساء تتكوّن من أقسام مقسّمة ومجموعات علامات تبويب ومراسي على الحواف اليسرى واليمنى والسفلية، وتكون بنية تخطيطها بيانات يملكها التطبيق. تتولى DockArea سحب علامات التبويب وإفلاتها، وتغيير الحجم، والمراسي، والتكبير، والقفل، وتحتفظ بمحتوى كل لوحة أثناء نقلها، وتتكيّف مع الهواتف؛ أما المظهر ومحتوى اللوحات فهما من مسؤولية التطبيق."
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---

# Dock

منطقة dock هي مساحة عمل يرتبها المستخدم: لوحات في مجموعات تبويب، ومجموعات مقسّمة جنبًا إلى جنب أو متراصة فوق بعضها، وdocks على الحواف اليسرى واليمنى والسفلية تُفتح وتُغلق وتتغير أحجامها. التبويب الذي يُسحب إلى مجموعة أخرى ينضم إليها، وإذا سُحب إلى حافة مجموعة قسّمها، وتحتفظ كل لوحة بما تحمله أثناء انتقالها. `DockArea` هو المسؤول عن السلوك: سحب التبويبات وإفلاتها، وهو يجري أصليًا إطارًا بإطار، وتغيير حجم التقسيمات والـ docks، وفتح الـ docks وإغلاقها، والتكبير والقفل. أما المظهر فهو من شأن التطبيق: التبويبات وأشرطة التبويب والمقابض ومؤشر الإفلات ومحتوى كل لوحة هي ما يرسمه التطبيق وينسّقه، ولا ترسم المنطقة شيئًا من عندها.

```rust tabs
use nsh_base::{
    dock::{DockAreaLayout, DockLayout, DockPanel, DockPlacement, DockRegion, DockTab},
    dock_area, theme,
};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    let layout = signal(
        DockAreaLayout::new(
            DockLayout::h_split()
                .child(DockLayout::tabs().panel("readme").panel("main"), None)
                .child(DockLayout::tabs().panel("preview"), Some(px(320.0))),
        )
        .with_dock(DockPlacement::Left, DockRegion::new(DockLayout::tabs().panel("files")))
        .with_dock(DockPlacement::Bottom, DockRegion::new(DockLayout::tabs().panel("terminal"))),
    );
    dock_area()
        .layout(move || layout.get())
        .on_layout_change(move |next: &DockAreaLayout| layout.set(next.clone()))
        .handle_style(|s| s.bg(move || theme().border()))
        .tab_bar_style(|s| s.flex_row().border_b_1().border_color(move || theme().border()))
        .tab_style(|s| s.px_3().py_1().selected(|s| s.bg(move || theme().muted())))
        .render_tab(|tab: &DockTab| text(tab.panel.to_string()).text_sm().text_color(move || theme().foreground()))
        .render_panel(|panel: &DockPanel| {
            text(format!("{} content", panel.id)).p_4().text_color(move || theme().foreground())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { DockArea, type DockAreaLayout } from "nsh/base";

const titles: Record<string, string> = {
  files: "Files", readme: "README.md", main: "main.rs", preview: "Preview", terminal: "Terminal",
};

function App() {
  const layout = signal<DockAreaLayout>({
    center: {
      type: "split",
      axis: "horizontal",
      children: [
        { type: "tabs", panels: ["readme", "main"] },
        { type: "tabs", panels: ["preview"] },
      ],
      sizes: [null, 320],
    },
    left: { layout: { type: "tabs", panels: ["files"] }, size: 240 },
    bottom: { layout: { type: "tabs", panels: ["terminal"] }, size: 180 },
  });
  return (
    <DockArea
      class="size-full bg-background"
      layout={layout()}
      onLayoutChange={(e) => layout.set(e.layout)}
      handleClass="bg-border group-active:bg-primary"
      tabBarClass="flex-row border-b border-border"
      tabClass="px-3 py-1.5 selected:bg-muted"
      renderTab={(tab) => <Text class="text-sm text-foreground">{titles[tab.panel]}</Text>}
      renderPanel={(panel) => <Text class="p-4 text-foreground">{titles[panel.id]} content</Text>}
    />
  );
}

mount(App);
```

`DockArea` والقيم التي يقبلها تأتي من [`nsh/base`](../modules/nsh-base.md)، وهي crate `nsh-base` في Rust (`nsh_base::dock_area()`، والقيم في `nsh_base::dock`). في Rust يُنشئه `dock_area()`، مع دالة ضبط لكل خاصية، ومستمع لكل حدث، ودوال التنسيق ذات الأنواع المحددة؛ ويصف `DockLayout` التخطيط بمفاتيح اللوحات (`h_split()`، `v_split()`، `tabs()`، `.child(layout, size)`، `.panel(key)`).

<a id="the-layout"></a>

## التخطيط

التخطيط قيمة هي `DockAreaLayout`: المركز، وdock على كل حافة من الحواف اليسرى واليمنى والسفلية، وكل منها اختياري. كل منطقة شجرة من نوعين من العقد:

| العقدة | تحتوي | الحقول |
|---|---|---|
| `{ type: "split" }` | عقدًا أخرى، جنبًا إلى جنب (`axis: "horizontal"`) أو متراصة (`"vertical"`) | `children`، و`sizes`: طول كل عنصر فرعي على امتداد المحور بالنقاط، و`null` لاقتسام المتبقي |
| `{ type: "tabs" }` | لوحات بمفاتيحها، تُعرض واحدة في كل مرة | `panels` (المفاتيح بترتيب التبويبات)، و`activeIndex` (اللوحة المعروضة، والافتراضي 0) |

تعيش اللوحة دائمًا في مجموعة تبويب: المنطقة التي فيها لوحة واحدة هي مجموعة تبويب من لوحة واحدة. مفتاح اللوحة هو السلسلة النصية التي يختارها التطبيق لها (`"files"`، أو معرّف مستند)، ويظهر المفتاح مرة واحدة في التخطيط كله. الـ dock (`DockRegion`) هو شجرته (`layout`)، وحجمه عبر حافته (`size`، الافتراضي 200 والحد الأدنى 100)، وهل هو مفتوح (`open`، الافتراضي `true`)، وهل يؤدي سحب حافته إلى ما دون أصغر حجم له إلى إغلاقه (`collapsible`، الافتراضي `true`).

لكل عقدة `id`. يجوز للتخطيط الذي يكتبه التطبيق أن يترك المعرّفات، فتتولى المنطقة إسنادها، ويحمل كل تخطيط تُبلّغ عنه المعرّفات. تمرير تخطيط مُبلَّغ عنه مرة أخرى يحافظ على هوية كل مجموعة، وهي ما تسمّي به دوال الـ ref المجموعات. كما ترتّب المنطقة ما يصلها: تُحذف المجموعة أو التقسيم الفارغ، ويصبح التقسيم ذو العنصر الواحد ذلك العنصر، وينضم التقسيم داخل تقسيم من المحور نفسه إلى أصله، ويبقى `activeIndex` ضمن النطاق، والمفتاح المذكور مرتين يحتفظ بمكانه الأول. والتخطيطات التي تُبلّغ عنها تكون دائمًا بهذه الصيغة القانونية الواحدة.

التخطيط ملك للتطبيق (`layout`): كل تغيير يجريه المستخدم (تحديد تبويب أو سحبه أو إغلاقه، أو تغيير حجم تقسيم أو dock، أو فتح dock أو إغلاقه) يُبلَّغ عنه بوصفه التخطيط الجديد كاملًا (`onLayoutChange`)، وتعرض المنطقة التخطيط الذي يمرره التطبيق في المقابل. ويغيّر التطبيق التخطيط بنفسه بتمرير قيمة جديدة: تخطيط محفوظ يُستعاد، أو أمر يعيد ترتيب مساحة العمل. أما المنطقة التي بلا `layout` فتحتفظ بتخطيطها الخاص، بادئةً من `defaultLayout`، وتبقى تُبلّغ عن كل تغيير.

<a id="panels-content"></a>

## محتوى اللوحات

ما تعرضه اللوحة هو من شأن التطبيق: `renderPanel` يرسمه انطلاقًا من مفتاح اللوحة (`panel.id`). كل لوحات المجموعة موضوعة في أماكنها ولا تُعرض إلا اللوحة المعروضة، فالتبديل بين التبويبات يحفظ محتوى كل لوحة؛ وعندما تنتقل لوحة (إلى مجموعة أخرى، أو إلى dock، أو إلى التكبير والعودة) ينتقل المحتوى نفسه معها: الإشارات التي أنشأها، ونص الحقل، وموضع التمرير، وصفحة عرض الويب، كلها تبقى. ترسم المنطقة اللوحة مرة واحدة عند ظهورها أول مرة، وتترك محتواها يزول عندما تغادر اللوحة التخطيط (`onPanelRemove`).

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` يحدد ما تسمح به كل لوحة، بحسب المفتاح؛ واللوحة غير المدرجة تسمح بكل شيء:

| الحقل | الافتراضي | الوصف |
|---|---|---|
| `id` | | مفتاح اللوحة. |
| `closable` | `true` | يجوز إغلاقها. |
| `zoomable` | `true` | يجوز لمجموعتها أن تُكبَّر ما دامت معروضة. |
| `visible` | `true` | تظهر. اللوحة المخفية تحتفظ بمكانها وتعود إليه؛ والمجموعة أو التقسيم الذي كل لوحاته مخفية لا يشغل مساحة. |

<a id="tabs"></a>

## علامات التبويب

لكل مجموعة شريط تبويب فيه تبويب لكل لوحة ظاهرة، بترتيب `panels`. `renderTab` يرسم ما يعرضه التبويب (عنوانه، وأيقونة، وزر إغلاق من عند التطبيق)؛ وبدونه يعرض التبويب مفتاح اللوحة. وتجعله المنطقة تبويبًا فعليًا: الضغط يحدده، والسحب ينقل لوحته، وقارئات الشاشة تسمعه تبويبًا بحالة تحديده، وفئات `selected:` في `tabClass` تنسّق التبويب المعروض. وقيمة التبويب تبيّن ما يحتاجه التطبيق ليرسمه:

| الحقل | النوع | الوصف |
|---|---|---|
| `panel` | `string` | مفتاح اللوحة. |
| `group` | `number` | معرّف مجموعة التبويب التي هو فيها. |
| `index` | `number` | مكانه بين التبويبات الظاهرة في المجموعة. |
| `active` | `boolean` | هو التبويب المعروض في المجموعة. |
| `closable` | `boolean` | ستغلقه المنطقة: فهو قابل للإغلاق، والمنطقة غير مقفلة، ويجوز لمجموعته أن تتخلى عنه. |
| `zoomed` | `boolean` | مجموعته مكبَّرة. |

```tsx
let area!: DockAreaRef;

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderTab={(tab) => (
    <View class="flex-row items-center gap-2">
      <Text class="text-sm">{titles[tab.panel]}</Text>
      <If when={tab.closable}>
        <Button onPress={() => area.closePanel(tab.panel)} accessibilityLabel="Close" class="rounded-sm px-1 hover:bg-muted">
          <Text class="text-xs">×</Text>
        </Button>
      </If>
    </View>
  )}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```

<a id="drag-and-drop"></a>

## السحب والإفلات

التبويب المسحوب فوق مجموعة يُظهر أين سيستقر، والإفلات يضعه هناك:

| يُفلت على | اللوحة |
|---|---|
| شريط تبويب | تنضم إلى تلك المجموعة، بين التبويبين اللذين أُفلتت بينهما |
| وسط محتوى مجموعة | تنضم إلى تلك المجموعة |
| حافة محتوى مجموعة (نسبة 35% الخارجية من كل جانب) | تقسّم تلك المجموعة: مجموعة جديدة خاصة بها على ذلك الجانب |

أثناء التحويم تُظهر المنطقة مؤشر الإفلات فوق الجزء من المجموعة الذي ستشغله اللوحة (كل محتواها للانضمام، ونصفه للتقسيم): وهو جزء ينسّقه التطبيق (`dropIndicatorClass`)، وله محتوى خاص إن رسم التطبيق شيئًا (`renderDropIndicator`، ويُمرَّر إليه `group` أو `side` الذي ينفصل عنه أو `index` شريط التبويب). وينتقل إلى كل موضع جديد أصليًا، متهاديًا إليه ومتلاشيًا في مجموعة أخرى فيما يتلاشى الأخير (فورًا إذا طلب المستخدم حركة أقل). وما يتبع المؤشر أو الإصبع هو من شأن التطبيق أيضًا (`renderDragPreview`). الإفلات تغيير واحد للتخطيط، يُبلَّغ عنه مرة واحدة؛ والإفلات الذي لا يغيّر شيئًا لا يغيّر شيئًا.

المنطقة المقفلة، والمنطقة المكبَّرة، وآخر لوحة في مجموعة حين لا يوجد شيء بجانب المجموعة، لا تسمح بسحب شيء.

## Docks

يُفتح الـ dock ويُغلق دون أن يفقد لوحاته أو حجمه: إغلاقه يحتفظ بشجرته، وفتحه يعرض المجموعات نفسها بالحجم نفسه. الحافة الفاصلة بين الـ dock والمركز مقبض يسحبه المستخدم لتغيير حجم الـ dock؛ ويبقى حجمه 100 نقطة على الأقل ويحتفظ المركز بـ 100 نقطة على الأقل، والـ dock القابل للطيّ إذا أُفلت دون 50 نقطة يُغلق ويحتفظ بحجمه لحين فتحه. وتتلاءم المنطقة دائمًا مع حدودها: يظهر الـ dock بـ `size` ضمن ما تتركه له المنطقة، وإذا لم يتسع ذلك أيضًا تنكمش الـ docks مع البقية وتتراجع الأحجام الدنيا للتقسيمات. `renderDock` يرسم الإطار الخاص بالـ dock قبل تخطيطه (شريط عنوان، وزر طيّ)، ويُمرَّر إليه `placement` و`open` و`size` و`collapsible`؛ و`dockClass` ينسّق إطاره.

افتح الـ docks وأغلقها وغيّر أحجامها من التطبيق عبر الـ ref (`toggleDock`، `setDockOpen`، `setDockSize`)، وهي تعمل في العرضين كليهما، أو بكتابة `open` و`size` للـ dock في التخطيط الذي يمرره (`open` خاص بالعرض الكامل). `onDockOpenChange` يُبلّغ في كل مرة يظهر فيها dock أو يختفي، مقيسًا بالنسبة إلى `open` في التخطيط (المنطقة التي تكون مضغوطة منذ البداية تُبلّغ بأن كل dock مفتوح في التخطيط مخفي)، فيكون التبديل الذي يبدأ من `open` في التخطيط ويتبع `onDockOpenChange` معبّرًا دائمًا عن حالة الـ dock:

```tsx
const terminalOpen = signal(true);

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  onDockOpenChange={({ placement, open }) => placement === "bottom" && terminalOpen.set(open)}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>

<Button selected={terminalOpen()} onPress={() => area.toggleDock("bottom")} class="px-3 py-1.5 selected:bg-muted">
  <Text>Terminal</Text>
</Button>
```

<a id="zoom"></a>

## التكبير

المجموعة المكبَّرة تملأ المنطقة كلها إلى أن يُلغى تكبيرها أو تغادر التخطيط (`area.toggleZoom(group)`، و`area.toggleZoom()` لإلغاء التكبير)، و`onZoomChange` يُبلّغ عن اللوحة التي تعرضها، أو `null`. التكبير للمجموعة، فتبقى مكبَّرة عندما تُغلق لوحتها المعروضة وتحل التالية محلها. واللوحة التي فيها `zoomable: false` تمنع مجموعتها من التكبير ما دامت معروضة.

<a id="locking"></a>

## القفل

`locked` يُبقي الترتيب كما هو: لا سحب للتبويبات، ولا إفلات، ولا إغلاق. أما تحديد التبويبات وتغيير الأحجام وفتح الـ docks وإغلاقها فتبقى تعمل، فمساحة العمل المقفلة تظل مساحة عمل قابلة للاستخدام.

<a id="methods"></a>

## الدوال

`ref={area}` يعطي دوال المنطقة (`DockAreaRef`)، لأوامر التطبيق واختصاراته وقوائمه. يُبلَّغ عن كل تعديل بـ `onLayoutChange` كما يُبلَّغ عن تعديلات المستخدم. الدالة التي تُعطى لوحة أو مجموعة أو فهرس تبويب أو dock ليس في التخطيط تترك التخطيط كما هو وتسجّل تحذيرًا يسمّي الدالة والقيمة.

| الدالة | الوصف |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`: التخطيط المعروض. |
| `addPanel(panel, placement?, size?)` | تضيف لوحة إلى منطقة (`"center"`، وهي الافتراضية، و`"left"`، و`"right"`، و`"bottom"`)، في أول مجموعة تبويب فيها، وتُعرض؛ والـ dock غير الموجود يُنشأ بعرض `size`. واللوحة التي تحتفظ بها المنطقة تنتقل إلى هناك. |
| `removePanel(panel)` | تزيل لوحة، مهما قالت خياراتها. |
| `closePanel(panel)` | تغلق لوحة كما كان تبويبها سيفعل: ما لم تكن المنطقة مقفلة، أو اللوحة غير قابلة للإغلاق، أو هي آخر لوحة في مجموعة لا شيء بجانبها. |
| `movePanel(panel, target)` | تنقل لوحة إلى `target`: `{ group, side?, index?, activate?, size? }`، إلى مجموعة التبويب `group` (عند `index`) أو إلى مجموعة جديدة على `side` لها (`size` نقاط على امتداد التقسيم الجديد). |
| `splitAt(group, panel, side)` | تضع لوحة في مجموعة تبويب جديدة على جانب (`"left"`، `"right"`، `"top"`، `"bottom"`) من حاوية. |
| `selectPanel(panel)` | تعرض لوحة في مجموعتها. |
| `selectTab(group, index)` | تعرض تبويبًا من مجموعة. |
| `toggleDock(placement)`، `setDockOpen(placement, open)` | تفتح dock أو تغلقه. |
| `setDockSize(placement, size)` | تضبط حجم dock عبر حافته (100 على الأقل). |
| `toggleZoom(group?)` | تكبّر مجموعة، أو تلغي تكبيرها إذا كانت مكبَّرة؛ وبدون `group` تُلغي تكبير المجموعة المكبَّرة. |
| `zoomedGroup()` | `Promise<number \| null>`: معرّف المجموعة المكبَّرة. |
| `groupOf(panel)` | `Promise<number \| null>`: معرّف مجموعة التبويب التي تحوي لوحة. |

في Rust، `component_ref::<DockArea>()` و`.component_ref(&r)` على المنطقة يعطيان ref تملك `r.api::<DockAreaApi>()` فيه الدوال نفسها بصيغة snake case.

<a id="saving-and-restoring"></a>

## الحفظ والاستعادة

التخطيط المُبلَّغ عنه بيانات بسيطة، فحفظه هو `JSON.stringify(layout)` في [التخزين](../modules/nsh.md#storage)، واستعادته هي تمرير القيمة المحلَّلة بوصفها `layout`. `onLayoutChange` يُبلّغ عن كل تغيير، بما فيه تغيير الحجم وتحديد التبويب، فاكتب في التخزين بعد أن تهدأ التغييرات (مؤقّت قصير يُعاد ضبطه عند كل تبليغ).

في Rust، `DockAreaLayout::to_state` و`from_state` تقرآن `DockAreaState` وتكتبانه، وهو صيغة ملف التخطيط التي يستخدمها dock في `gpui-base` أيضًا.

<a id="phones-and-narrow-windows"></a>

## الهواتف والنوافذ الضيقة

يتكيّف الـ dock مع عرضه. المنطقة بعرض 600 نقطة فأكثر (في نافذة على سطح المكتب، أو الويب، أو جهاز لوحي، أو iPad بملء الشاشة، أو جهاز قابل للطيّ مفتوح) هي مساحة العمل كاملة: تقسيمات ومجموعات وdocks جنبًا إلى جنب، كما في تطبيقات الأجهزة اللوحية متعددة الأجزاء. وبالإصبع على الهاتف أو الجهاز اللوحي يبدأ سحب التبويب بضغطة مطوّلة، كما يفعل السحب والإفلات في iPadOS، فيبقى شريط التبويب قابلًا للتمرير بالسحب الخفيف، وتأخذ المقابض مساحة لمس أوسع بالمظهر نفسه.

المنطقة الأضيق من 600 نقطة (على هاتف، أو iPad في Slide Over، أو في نافذة سطح مكتب أو متصفح ضيقة، أو في عمود ضيق من منطقة أعرض) تعرض التخطيط نفسه لشاشة واحدة، كما تنطوي أعمدة العرض المقسّم في iPad ويتحول الجزء المساند في Material Design إلى ورقة سفلية:

- يعرض المركز مجموعة واحدة في كل مرة، بالحجم الكامل. ويسرد شريط تبويبه كل لوحة ظاهرة في المركز، وتحديد لوحة من مجموعة أخرى يجعل تلك المجموعة هي المعروضة.
- الـ docks اليسرى واليمنى أدراج فوق المركز من حافتها، بعرض الـ dock، والـ dock السفلي ورقة بارتفاع الـ dock. يظهر واحد منها في كل مرة، حين يعرضه التطبيق (`toggleDock`، `setDockOpen`، وكلاهما يُغلق الآخر)؛ وينزلق داخلًا وخارجًا، والضغط على خلفيته أو Escape أو الرجوع يُغلقه. والدخول في العرض المضغوط لا يُظهر أيًا منها.
- التبويب المسحوب (بإصبع بعد ضغطة مطوّلة، أو بمؤشر فورًا) يتحرك داخل شريط التبويب لإعادة ترتيبه.

تبقى كل لوحة موضوعة في العرضين كليهما، فالتبديل يحفظ محتواها. الدرج أو الورقة المعروضة خاصة بالعرض المضغوط: `open` في التخطيط يخص العرض الكامل، وعرض درج أو إغلاقه لا يُبلّغ عنه بـ `onLayoutChange`، فالمنطقة التي تتسع من جديد تُظهر الـ docks تمامًا كما كانت. `onDockOpenChange` يُبلّغ عن الأمرين: عن dock يتغير `open` فيه في العرض الكامل، وعن درج أو ورقة يُعرضان أو يُغلقان في العرض المضغوط، وعن كل dock تتغير حالة ظهوره عند تبديل العرض. في `renderDock`، `open` هو ما إذا كان الـ dock يظهر في العرض الحالي. ويبقى التخطيط القيمة نفسها كذلك، فالمنطقة التي تتجاوز 600 نقطة (جهاز قابل للطيّ يُفتح، أو iPad ينضم إلى Split View، أو نافذة أو عمود يتغير حجمه) تُبقي كل لوحة في مكانها، ويحفظ التطبيق تخطيطًا واحدًا. عرض المنطقة هو الذي يحسم بعد أن تُوضع (وعرض النافذة ينوب عنه قبل ذلك)، و`compact` يختار العرض بدلًا من العرض الفعلي. والأدراج والورقة والخلفية أجزاء ينسّقها التطبيق (`drawerClass`، `sheetClass`، `backdropClass`)، كبقية المنطقة.

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  drawerClass="bg-background border-r border-border"
  sheetClass="rounded-t-(--radius-lg) bg-background"
  backdropClass="bg-black/40"
  renderTab={(tab) => <Text>{titles[tab.panel]}</Text>}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```
<a id="props"></a>

## الخصائص (Props)

| الخاصية | Rust | النوع | القيمة الافتراضية | الوصف |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | لا شيء | التخطيط المعروض (متحكَّم به): أعد تمرير ما يبلغ عنه `onLayoutChange`. |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | مركز فارغ | التخطيط في البداية، عندما لا يكون `layout` مضبوطًا؛ وتحتفظ المنطقة بتخطيطها الخاص بعد ذلك. |
| `locked` | `.locked(..)` | `boolean` | `false` | لا سحب للتبويبات ولا إفلات ولا إغلاق. |
| `compact` | `.compact(..)` | `boolean` | حسب العرض | العرض الخاص بالهاتف (`true`) أو العرض الكامل (`false`)؛ وبدونه يكون مضغوطًا ما دامت المنطقة أضيق من 600 نقطة. |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | ما تسمح به كل لوحة، حسب المفتاح: `closable`، `zoomable`، `visible`. |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | لا شيء | محتوى اللوحة، حسب مفتاحها (`panel.id`). |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | المفتاح | ما يعرضه التبويب. |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | لا شيء | ما بداخل مؤشر الإفلات: `group`، `side`، `index`. |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | لا شيء | الإطار الخاص بالرصيف (dock)، قبل تخطيطه: `placement`، `open` (يظهر في العرض الحالي)، `size`، `collapsible`. |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | لا شيء | ما يعرضه المركز الفارغ. |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | لا شيء | ما يتبع المؤشر أو الإصبع أثناء سحب تبويب. |
| `groupClass`، `groupStyle` | `.group_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | إطار كل مجموعة تبويبات. |
| `tabBarClass`، `tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | كل شريط تبويبات (`flex-row` للصف). |
| `tabClass`، `tabStyle` | `.tab_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | كل تبويب؛ و`selected:` للتبويب المعروض. |
| `contentClass`، `contentStyle` | `.content_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | إطار المحتوى لكل مجموعة، حيث تظهر لوحاتها. |
| `dropIndicatorClass`، `dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مؤشر الإفلات. |
| `handleClass`، `handleStyle` | `.handle_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | مؤشر كل مقبض، بين مجموعات التقسيم وعند حافة كل رصيف؛ ويتبع `group-hover:` و`group-active:` المقبض. عرضه نقطة واحدة عبر المقبض ويمتد على طوله الكامل ما لم يُحدَّد غير ذلك، لذا فإن `bg-border` خط رفيع في الحالتين؛ و`w-[3px]` / `h-[3px]` تزيدان سماكته. |
| `handleThumbClass`، `handleThumbStyle` | `.handle_thumb_class(..)`، `.handle_thumb_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | إبهام كل مقبض: مقبض إمساك متمركز على الخط، يُرسم عموديًا كما على خط رأسي ويُدار ربع دورة على الخط الأفقي، فيخدم صنف واحد المحورين. يبقى العنصر نفسه أثناء التمرير فوق المقبض والضغط عليه وسحبه، لذا تنتقل به الأصناف `group-hover:` و`group-active:` (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `dockClass`، `dockStyle` | `.dock_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | إطار كل رصيف. |
| `drawerClass`، `drawerStyle` | `.drawer_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المضغوط: أدراج الأرصفة الجانبية. |
| `sheetClass`، `sheetStyle` | `.sheet_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المضغوط: الورقة السفلية للرصيف السفلي. |
| `backdropClass`، `backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`، `StyleProp<ViewStyle>` | لا شيء | المضغوط: الخلفية خلف الدرج أو الورقة المفتوحة، ويؤدي الضغط عليها إلى إغلاقها. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة لكل مقبض، بين مجموعات التقسيم وعند حافة كل رصيف. |
| `ref` | `.component_ref(&r)` (`component_ref::<DockArea>()`) | `DockAreaRef` | | [طرق](#methods) المنطقة. |
| `class`، `style` | طرق التنسيق | `string`، `StyleProp<ViewStyle>` | لا شيء | المنطقة نفسها: حجمها داخل أصلها (`flex-1`)، وخلفيتها. تبقى ضمن حدودها ولا تأخذ حدًّا أدنى للحجم من محتواها. |

<a id="events"></a>

## الأحداث (Events)

| الحدث | Rust | الوصف |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | تغيّر التخطيط (سحب، أو تحديد، أو تغيير حجم، أو فتح رصيف أو إغلاقه، أو طريقة): `{ layout }`، أي التخطيط الجديد بالكامل، وكل معرّف فيه. |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)` (`PanelActiveChange(panel, active)`) | `{ panel, active }`: أصبحت لوحة التبويب المعروض في مجموعتها، أو توقفت عن كونه كذلك (الرصيف المغلق لا يعرض أي تبويب). مرة واحدة لكل تغيير؛ واللوحة التي تغادر لا يُبلَّغ لها `false`: فنهايتها هي `onPanelRemove`. |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`: غادرت لوحة المنطقة نهائيًا: أُغلقت، أو أُزيلت، أو غابت عن تخطيط جديد. اللوحة التي تنتقل لا تسمعه أبدًا. |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | تم تكبير مجموعة أو تصغيرها: `{ panel }`، أي اللوحة التي تعرضها، أو `null`. |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)` (`DockOpenChange(placement, open)`) | `{ placement, open }`: أُظهر رصيف أو أُخفي: تغيّر تخطيطه `open` في العرض الكامل، أو أُظهر درجه أو ورقته أو أُغلق في العرض المضغوط، أو تبدّل العرض. |

<a id="parts"></a>

## الأجزاء (Parts)

| الجزء | بداخل | يُنسَّق بواسطة | الحالات |
|---|---|---|---|
| المنطقة | | `class`، `style` | |
| مجموعة تبويبات | منطقة | `groupClass`، `groupStyle` | |
| شريط تبويبات | مجموعة | `tabBarClass`، `tabBarStyle` | |
| تبويب | شريط تبويبات | `tabClass`، `tabStyle`؛ `renderTab` | `selected:`، `active:`، `hover:` |
| محتوى مجموعة | مجموعة | `contentClass`، `contentStyle`؛ `renderPanel` | |
| مؤشر مقبض | بين مجموعات التقسيم، وعند حافة رصيف | `handleClass`، `handleStyle` | `group-hover:`، `group-active:` |
| إبهام مقبض | في منتصف خط المقبض | `handleThumbClass`، `handleThumbStyle` | `group-hover:`، `group-active:` (مضغوط حتى ينتهي السحب) |
| رصيف | حافة | `dockClass`، `dockStyle`؛ `renderDock` | |
| مؤشر الإفلات | فوق مجموعة أثناء السحب | `dropIndicatorClass`، `dropIndicatorStyle`؛ `renderDropIndicator` | |
| معاينة السحب | تحت المؤشر أو الإصبع | `renderDragPreview` | |
| المركز الفارغ | المركز | `renderEmpty` | |
| درج، الورقة السفلية، الخلفية | فوق المركز، في العرض المضغوط | `drawerClass`، `sheetClass`، `backdropClass` (وأنماطها) | |

<a id="accessibility"></a>

## إمكانية الوصول (Accessibility)

- كل تبويب هو تبويب بحالة التحديد لقارئات الشاشة، كما هو الحال في [`Tab`](./tabs.md)، ويؤدي تفعيله إلى
  تحديده. وتسميته هي النص الذي يرسمه `renderTab`.
- كل مقبض، بين مجموعات التقسيم وعند حافة كل رصيف، هو عنصر قابل للضبط وتسميته
  `handleAccessibilityLabel`. والمقابض بين مجموعات التقسيم هي مقابض [Resizable](./resizable.md): وتحرّكها قارئة الشاشة
  10 نقاط في كل مرة، ويُبلَّغ عن ذلك باستخدام `onLayoutChange`.
- في العرض المضغوط، يغلق Escape وزر الرجوع الدرج أو الورقة المعروضة.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- يسحب المؤشر (فأرة، أو لوحة تتبع، أو قلم يحوم فوق الشاشة) التبويب بمجرد تحركه 4 نقاط والزر
  مضغوط، على كل المنصات: فجهاز iPad مع لوحة تتبع، ونافذة متصفح ضيقة تُقاد بسحب الفأرة، تعمل كما يعمل سطح المكتب.
  وعلى macOS وWindows وLinux وGPUI تُعدّ كل ضغطة ضغطة مؤشر، بما فيها إصبع على شاشة لمس في حاسوب محمول.
- يسحب الإصبع على iOS وiPadOS وAndroid التبويب بعد ضغطة مطوّلة، كما يفعل السحب والإفلات في iPadOS، لذا فإن
  التمرير بالسحب فوق شريط التبويبات يمرّره.
- أجهزة سطح المكتب والويب: تعرض المقابض مؤشر تغيير الحجم الخاص بمحورها.
- الهواتف والمناطق الضيقة: العرض المضغوط، بأدراج وورقة سفلية.
- ترسم كل منصة ما ينسّقه التطبيق: التبويبات وأشرطة التبويبات والمقابض ومؤشر الإفلات والأرصفة والأدراج والورقة السفلية.
