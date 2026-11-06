---
title: "TextView"
description: "مكوّن TextView: عرض Markdown أو HTML أو مستند مكوّن من كتل باستخدام نصوص وعناصر عرض أصلية، مع تنسيق كل جزء على حدة، ويُستخدم في ردود الدردشة المدعومة بالذكاء الاصطناعي والمقالات وصفحات المساعدة."
group: base
demo: text-view
source_hash: d73c7be1682f9cf4
---

# TextView

`TextView` يعرض مستندًا مكتوبًا بصيغة Markdown أو HTML أو ككتل يبنيها التطبيق: عناوين، وفقرات، وتأكيدًا، وروابط، وقوائم وقوائم مهام، واقتباسات وتنبيهات GitHub، وشيفرة، وجداول، وصورًا، ومعادلات، وهوامش، وعناصر قابلة للطي. صُمّم لردود نماذج الذكاء الاصطناعي في المحادثة: يصل الرد تدفقًا بصيغة Markdown، وتعرض كل دفعة النص مع تنسيقه في مكانه. يجري التحليل في Rust، ويُرسم المستند بعناصر وواجهات [`Text`](./text.md).

يملك السلوك، ويأتي بطباعة قراءة خاصة به: نص بحجم 15pt في أسطر رحبة بارتفاع 25.5pt، وعناوين semibold مع مساحة فوقها، وروابط مسطّرة بلون `primary` من السمة، وشيفرة بـ `font-mono` من السمة داخل صندوق بحدود وزوايا مستديرة، وجداول بخطوط على كل جوانبها وصف رأس ملوّن، واقتباسات بخط على جانبها، وتنبيهات على هيئة صناديق ملوّنة بأيقونة بألوان تنبيهات GitHub. ألوانه هي رموز السمة (`foreground` و`muted-foreground` و`border` و`muted` و`primary` و`destructive` للتحذير)، لذا يصل إليه أثر السمة والمظهر الداكن. يأخذ كل جزء أنماط التطبيق فوق هذه القيم الافتراضية: `classes` و`styles` في TSX، وأنماطًا مكتوبة الأنواع حسب الجزء (`TextViewParts`) في Rust. ينشئه Rust بـ `nsh_base::text_view()`، وينشئه TSX بـ `<TextView>` من `nsh/base`.

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view, theme};
use nsh_core::prelude::*;

const README: &str = "# Release notes

**Faster lists** and a new `TextView`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with `TextViewParts`.";

fn release_notes() -> impl IntoElement {
    scroll().flex_1().child(
        text_view()
            .markdown(README)
            .on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| log::info!("open {url}"))
            .p_5()
            .text_base()
            .text_color(theme().foreground),
    )
}
```

```tsx tabs
import { mount, Scroll } from "nsh";
import { TextView } from "nsh/base";

const README = `# Release notes

**Faster lists** and a new \`TextView\`:

- Markdown and HTML
- [x] Streaming replies
- [ ] Your own syntax

> [!TIP]
> Style every part with \`classes\`.`;

function App() {
  return (
    <Scroll class="flex-1" contentClass="p-5">
      <TextView
        markdown={README}
        class="text-base text-neutral-900 dark:text-neutral-100"
        classes={{
          heading1: "text-3xl",
          code: "rounded bg-neutral-100 dark:bg-neutral-800",
          link: "text-blue-600",
          alertTip: "border-l-4 border-green-600 pl-3",
        }}
        onLinkPress={({ url }) => console.log("open", url)}
      />
    </Scroll>
  );
}

mount(App);
```

في Rust، ينشئ `text_view()` عنصرًا كما ينشئ `view()` واجهة: دالة ضبط لكل خاصية (`.markdown(..)` و`.options(..)` و`.selectable(..)`)، ودالة إغلاق لكل دالة عرض (`.render_image(|image| ..)`)، ومستمعًا لكل حدث (`.on_link_press(..)`)، ودوال الأنماط المكتوبة الأنواع لجذره (`.p_5()` و`.text_color(..)`) التي تنتقل أنماط النص فيها إلى كل جزء.

<a id="built-on-text"></a>

## مبني على Text

يتكوّن `TextView` من عناصر [`Text`](./text.md)، ويتصرف نصه تمامًا كما تصفه صفحة Text. كل فقرة وعنوان وخلية جدول وكتلة شيفرة هي `Text` أصلي واحد: كتلة واحدة تُنسَّق وتلتف وتتبع مقياس الخط، ومع `selectable` تُحدَّد وتُنسخ. النص العريض والمائل والمشطوب وسائر العلامات المضمَّنة هي [امتداداتها](./text.md#spans)؛ والشيفرة المضمَّنة امتداد بـ [خلفية امتداد](./text.md#span-backgrounds)، لذا يمنحها `code: "rounded bg-neutral-100"` خلفية مستديرة؛ والروابط [امتدادات قابلة للضغط](./text.md#links)؛ والصور والعقد المخصصة المضمَّنة [مرفقات مضمَّنة](./text.md#inline-views-and-images). تنتقل أنماط النص في الجذر إلى كل جزء، كما تنتقل [أنماط النص](./text.md#text-styles) من `Text` إلى امتداداته.

مع `selectable` يُحدَّد المستند كله كوحدة واحدة، كما في صفحة الويب: يمتد السحب (أو الضغط المطوّل ثم المقابض على شاشات اللمس) من فقرة أو عنصر قائمة أو خلية أو كتلة شيفرة إلى التالية، وينسخ أمر النسخ نصوصها كلها. يُحدَّد `selectable` `TextView` بمفرده؛ وداخل [عرض قابل للتحديد](./text-selection.md) يمتد تحديده أيضًا إلى النصوص وعناصر `TextView` الأخرى حوله.

ما يضيفه `TextView` هو الباقي: قراءة Markdown أو HTML أو مستند إلى كتل، والواجهات المحيطة بالنصوص (القوائم والاقتباسات والجداول وكتل الشيفرة والعناصر القابلة للطي والهوامش)، والبث، والأنماط حسب الجزء، ودوال العرض، والامتدادات.

<a id="the-document"></a>

## المستند

المحتوى هو واحدة من ثلاث خصائص، تُقرأ بهذا الترتيب:

- **`markdown`**: CommonMark مع إضافات GitHub (الجداول وقوائم المهام والتشطيب والروابط التلقائية والهوامش والتنبيهات)، والمعادلات (`$…$` و`$$…$$`)، وHTML داخل Markdown.
- **`html`**: HTML كما يعرضه القارئ. يمرّ النص والبنية والتنسيق المضمَّن؛ أما النصوص البرمجية والأنماط وعناصر النماذج والعناصر المخفية فتُستبعد. يعمل مقطع HTML وصفحة كاملة على السواء (تعرض الصفحة جسمها).
- **`document`**: كتل يبنيها التطبيق أو يحتفظ بها: كائنات عادية في TSX، و`nsh_base::text_view::Document` في Rust ([نموذج المستند](#the-document-model)).

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{Block, Document, Inline};
use nsh_core::prelude::*;

fn shipping() -> impl IntoElement {
    text_view().html(r#"<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>"#)
}

fn total() -> impl IntoElement {
    text_view().document(Document::new(vec![
        Block::Heading { level: 2, content: vec![Inline::text("Total")], anchor: None },
        Block::paragraph(vec![Inline::Strong { content: vec![Inline::text("$42.00")] }]),
    ]))
}
```

```tsx tabs
<TextView html={`<h2>Shipping</h2><p>Orders ship in <b>2 days</b>. <a href="/faq">FAQ</a></p>`} />

<TextView document={{
  blocks: [
    { type: "heading", level: 2, content: [{ type: "text", text: "Total" }] },
    { type: "paragraph", content: [{ type: "strong", content: [{ type: "text", text: "$42.00" }] }] },
  ],
}} />
```

يتمدد `TextView` مع محتواه. ضعه في [`Scroll`](./scroll.md) (أو في صف من [`List`](./list.md)) للمستندات الطويلة.

<a id="styling-the-parts"></a>

## تنسيق الأجزاء

يُنسّق `class` و`style` الجذر، وهو عمود من الكتل؛ وأنماط النص المضبوطة هناك (اللون والحجم والخط) تنتقل إلى كل جزء. والجذر هو أيضًا الجزء `root`: يقبل `styles.root` أنماط نص بأنواعها (`style` مكتوب النوع كما في الواجهة)، ويقبل `classes.root` الفئات. يقبل `classes` فئات Tailwind حسب الجزء، ويقبل `styles` أنماطًا مضمَّنة حسب الجزء. تأتي فئات الجزء بعد أنماطه الافتراضية، لذا تتغلب عليها؛ وتتغلب `styles` الخاصة به على فئاته. في Rust تقبل الأجزاء أنماطًا مكتوبة الأنواع: يمنح `TextViewParts` كل `TextViewPart` دالة تصقل نمطه، لكل `TextView` تحت الواجهة التي توفّره ([أنماط الأجزاء المكتوبة الأنواع](#typed-part-styles))، ويقبل الجذر دوال الأنماط. ارتفاعات الأسطر في القيم الافتراضية مضبوطة بالنقاط: فالفئة التي تغيّر حجم جزء تضبط ارتفاع سطره أيضًا (كما تفعل فئات `text-*` في Tailwind).

```rust tabs
use nsh_base::{TextViewPart, TextViewParts, text_view, theme};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading, |s| s.text_color(rgb(0x0a0a0a)))
            .part(TextViewPart::Heading2, |s| s.text_xl().mt_2())
            .part(TextViewPart::Blockquote, |s| {
                s.border_l(px(2.0)).border_color(rgb(0xd4d4d4)).pl_3().text_color(rgb(0x525252))
            })
            .part(TextViewPart::CodeBlock, |s| s.rounded_lg().bg(rgb(0xf5f5f5)))
            .part(TextViewPart::CodeBlockHeader, |s| s.px_3().pt_2())
            .part(TextViewPart::CodeBlockCode, |s| s.p_3().text_size(px(13.0)))
            .part(TextViewPart::Table, |s| s.rounded_lg().border_1().border_color(rgb(0xe5e5e5)))
            .part(TextViewPart::TableHead, |s| s.bg(rgb(0xfafafa)))
            .part(TextViewPart::TableCell, |s| {
                s.px_3().py_2().border_t_1().border_color(rgb(0xe5e5e5))
            })
            .part(TextViewPart::TaskMarkerChecked, |s| s.text_color(rgb(0x16a34a)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
    text_view()
        .markdown(move || markdown.get())
        .gap_3()
        .text_size(px(15.0))
        .line_height(px(24.0))
        .text_color(rgb(0x262626))
        .font_family("Inter")
}
```

```tsx tabs
<TextView
  markdown={reply()}
  class="gap-3 text-[15px] leading-6 text-neutral-800"
  classes={{
    heading: "text-neutral-950",
    heading2: "text-xl mt-2",
    blockquote: "border-l-2 border-neutral-300 pl-3 text-neutral-600",
    codeBlock: "rounded-lg bg-neutral-100",
    codeBlockHeader: "px-3 pt-2",
    codeBlockCode: "p-3 text-[13px]",
    table: "rounded-lg border border-neutral-200",
    tableHead: "bg-neutral-50",
    tableCell: "px-3 py-2 border-t border-neutral-200",
    taskMarkerChecked: "text-green-600",
  }}
  styles={{ root: { fontFamily: "Inter" }, link: { color: "#2563eb" } }}
/>
```

بعض العقد عدة أجزاء تُطبَّق بالترتيب: عنوان المستوى 2 هو `heading` ثم `heading2`؛ والتنبيه هو `blockquote` ثم `alert` ثم نوعه (`alertNote` ...)؛ وعلامة المهمة هي `listMarker` ثم `taskMarker` ثم `taskMarkerChecked` عند إنجازها؛ وصف الرأس هو `tableRow` ثم `tableHead`، وخلاياه `tableCell` ثم `tableHeaderCell`.

| الجزء | Rust | ما هو |
|---|---|---|
| `root` | `Root` | عرض النص نفسه، عمود من كتله؛ وأنماط النص هنا تنتقل إلى كل جزء. |
| `paragraph` | `Paragraph` | كل فقرة. |
| `heading` | `Heading` | كل عنوان، قبل جزء مستواه. |
| `heading1` … `heading6` | `Heading1` … `Heading6` | عناوين ذلك المستوى (27 ثم 20 ثم 17 ثم 15pt، بوزن semibold). |
| `blockquote` | `Blockquote` | الاقتباسات والتنبيهات: عمود من كتلها بخط على جانبه. |
| `alert` | `Alert` | كل تنبيه (`> [!NOTE]`)، بعد `blockquote`: صندوق ملوّن، وهو صف من أيقونته وكتله. |
| `alertNote` و`alertTip` و`alertImportant` و`alertWarning` و`alertCaution` | `AlertNote` و`AlertTip` و`AlertImportant` و`AlertWarning` و`AlertCaution` | تنبيهات ذلك النوع. |
| `alertIcon` | `AlertIcon` | أيقونة التنبيه: حلقة برمز بلون التنبيه. |
| `list` | `List` | كل قائمة: عمود من عناصرها. |
| `orderedList` و`unorderedList` | `OrderedList` و`UnorderedList` | القوائم المرقّمة والنقطية، بعد `list`. |
| `listItem` | `ListItem` | كل عنصر: صف من علامته وكتله. |
| `listMarker` | `ListMarker` | علامة العنصر (`•` و`◦` و`▪` حسب العمق، أو `1.`)، محاذاة لليمين في المسافة البادئة قبل العنصر. |
| `taskMarker` | `TaskMarker` | علامة عنصر المهمة: مربع مرسوم كواجهة، يمتلئ بـ `✓` عند الإنجاز؛ بعد `listMarker`. |
| `taskMarkerChecked` | `TaskMarkerChecked` | علامة عنصر المهمة المنجزة، بعد `taskMarker`. |
| `listItemContent` | `ListItemContent` | عمود كتل العنصر. |
| `codeBlock` | `CodeBlock` | كتل الشيفرة: صندوق بحدود وزوايا مستديرة للشيفرة، مع الترويسة فوقه. |
| `codeBlockHeader` | `CodeBlockHeader` | صف إجراءات كتلة الشيفرة (`codeBlockActions`)، يطفو فوق ركنها العلوي الأيمن. |
| `codeBlockScroll` | `CodeBlockScroll` | عرض التمرير الأفقي حول شيفرة كتلة الشيفرة. |
| `codeBlockCode` | `CodeBlockCode` | شيفرة كتلة الشيفرة (بخط أحادي المسافة، كما كُتبت). |
| `code` | `Code` | الشيفرة داخل النص (بخط أحادي المسافة، على خلفية مستديرة). |
| `keyboard` | `Keyboard` | المفاتيح (`<kbd>`، كشيفرة). |
| `strong` | `Strong` | النص القوي (semibold). |
| `emphasis` | `Emphasis` | النص المؤكَّد (مائل). |
| `strikethrough` | `Strikethrough` | النص المشطوب. |
| `underline` | `Underline` | النص المسطَّر (`<u>` و`<ins>`). |
| `highlight` | `Highlight` | النص المميَّز (`<mark>`، على أصفر مستدير). |
| `superscript` و`subscript` | `Superscript` و`Subscript` | الرمز العلوي والسفلي (أصغر حجمًا). |
| `link` | `Link` | الروابط (بلون `primary` من السمة، مسطّرة). |
| `image` | `Image` | الصور. |
| `math` | `Math` | المعادلات داخل النص، تُصفّ عند غياب `renderMath`. |
| `mathBlock` | `MathBlock` | كتل المعادلات، تُصفّ وتتوسّط عند غياب `renderMath`. |
| `table` | `Table` | الجداول: محتوى `renderTableActions`، ثم عرض تمرير الخلايا. |
| `tableScroll` | `TableScroll` | عرض التمرير الأفقي لخلايا الجدول: تلائم الأعمدة محتواها عند توفر المساحة، وتلتف حتى حدّ أدنى حين يضيق العرض، وبعد ذلك يتمرر الجدول. |
| `tableRow` | `TableRow` | كل صف في الجدول: واجهة خلف خلاياه، للخلفيات والحدود (وتوضع أنماط النص على `tableCell`). |
| `tableHead` | `TableHead` | صف الرأس، بعد `tableRow`. |
| `tableCell` | `TableCell` | كل خلية. |
| `tableHeaderCell` | `TableHeaderCell` | خلايا صف الرأس (أصغر حجمًا وباهتة)، بعد `tableCell`. |
| `rule` | `Rule` | الفواصل الموضوعية: خط مرسوم كحدّ علوي. |
| `details` | `Details` | العناصر القابلة للطي (`<details>`). |
| `summary` | `Summary` | ملخص العنصر القابل للطي؛ والضغط عليه يفتحه ويغلقه. |
| `summaryMarker` | `SummaryMarker` | علامة الملخص (`▸` و`▾`). |
| `footnotes` | `Footnotes` | الهوامش بعد الكتل: عمود. |
| `footnote` | `Footnote` | هامش: صف من رقمه وكتله. |
| `footnoteLabel` | `FootnoteLabel` | رقم الهامش. |
| `footnoteReference` | `FootnoteReference` | إشارة إلى هامش داخل النص (رقمه، بحجم أصغر). |
| `custom` | `Custom` | العقد المخصصة المعروضة بمحتواها (حين لا تعرضها دالة عرض). |

<a id="streaming-ai-replies"></a>

## بث ردود الذكاء الاصطناعي

مرّر الرد وهو ينمو، بـ `options={{ streaming: true }}` (`MarkdownOptions { streaming: true, .. }` في Rust). غالبًا ما تترك نهاية النص الذي ما زال يصل صيغة مفتوحة (`**bold` و`` `code ``, `[a link](htt`, a table whose header just arrived)؛ فيعرضها البث كما ستبدو بعد إغلاقها، فلا يرى القارئ `**` أو `[` شاردة. تُحفظ الكتل بموضعها: تحتفظ الكتل المكتملة بواجهاتها، وتُنشأ من جديد الكتلة التي تُكتب وحدها، فيبقى تحديث الرد الطويل رخيصًا.

يتبع `streamingCaret` نهاية المستند: ضمن السطر عند نهاية آخر نص، حيثما تنتهي آخر كتلة (فقرة أو عنصر قائمة أو كتلة شيفرة أو آخر خلية في جدول)، وإلا ففي سطر مستقل بعد آخر كتلة (فاصل أو محتوى دالة عرض). أزله عند اكتمال الرد.

```rust tabs
use nsh_base::{MarkdownOptions, text_view};
use nsh_core::prelude::*;

/// A reply the app appends to as chunks arrive, with `done` set at the end.
fn reply(text: Signal<SharedString>, done: Signal<bool>) -> impl IntoElement {
    text_view()
        .markdown(move || text.get())
        .options(move || MarkdownOptions { streaming: !done.get(), ..Default::default() })
        .streaming_caret(when(
            move || !done.get(),
            || view().ml_0p5().h_4().w_2().rounded_sm().bg(rgb(0xa3a3a3)),
        ))
}
```

```tsx tabs
import { signal, View } from "nsh";
import { TextView } from "nsh/base";

function Reply(props: { stream: AsyncIterable<string> }) {
  const text = signal("");
  const done = signal(false);
  (async () => {
    for await (const chunk of props.stream) text.update((t) => t + chunk);
    done.set(true);
  })();
  return (
    <TextView
      markdown={text()}
      options={{ streaming: !done() }}
      streamingCaret={done() ? undefined : <View class="ml-0.5 h-4 w-2 rounded-sm bg-neutral-400" />}
    />
  );
}
```

المؤشر واجهة من التطبيق نفسه، لذا يمكن أن يومض أو ينبض عبر [واجهة الرسوم المتحركة في `nsh`](../modules/nsh.md#animation)، ويمكن أن تظهر الكتل الجديدة بتلاشٍ تدريجي بفضل رسوم التطبيق المتحركة.

<a id="links"></a>

## الروابط

الروابط [امتدادات قابلة للضغط](./text.md#links). يستدعي الضغط على أحدها `onLinkPress` مع `{ url }`؛ ويقرر التطبيق ما يفتحه (صفحة خاصة به، أو [`WebView`](./web-view.md)، أو تمريرًا إلى عنوان). للعناوين مراسٍ (على طريقة GitHub: `## Getting started` هو `#getting-started`)، لذا يصل الرابط إلى `#getting-started` على شكل تلك السلسلة، وتصل إشارة الهامش على شكل `#footnote-<label>`.

```rust tabs
use nsh_base::{TextViewLinkPressEvent, text_view};
use nsh_core::prelude::*;

fn doc(markdown: &'static str) -> impl IntoElement {
    text_view().markdown(markdown).on_link_press(|TextViewLinkPressEvent { url, .. }: &TextViewLinkPressEvent| {
        match url.strip_prefix('#') {
            Some(anchor) => scroll_to_anchor(anchor),
            None => open_web(url),
        }
    })
}
```

```tsx tabs
<TextView
  markdown={doc}
  onLinkPress={({ url }) => {
    if (url.startsWith("#")) scrollToAnchor(url.slice(1));
    else nav.push({ name: "web", url });
  }}
/>
```

`scroll_to_anchor` و`open_web` (`scrollToAnchor` و`nav` في TSX) تمثّلان دوال التطبيق الخاصة.

مع `links="open"`، يفتح الضغط على رابط إلى موقع أو تطبيق آخر (عنوان URL بمخطط: `https:` و`mailto:` ...) الوجهةَ خارج التطبيق أيضًا عبر [`openUrl`](../modules/nsh.md#openurl)، ضمن صلاحية `openUrl` في التطبيق، بعد أن يبلّغ عنه `onLinkPress`؛ أما المراسي داخل المستند (`#…`) فيُبلَّغ عنها فقط. القيمة الافتراضية `"report"` لا تفتح شيئًا.

```rust tabs
use nsh_base::{TextViewLinks, text_view};

text_view().markdown(doc).links(TextViewLinks::Open)
```

```tsx tabs
<TextView markdown={doc} links="open" />
```

<a id="render-functions"></a>

## دوال العرض

تضع دوال العرض محتوى التطبيق الخاص في المستند. تأخذ كل منها قيمة جزء وتعيد محتواه (JSX في TSX، وعنصرًا في Rust)؛ ويحتفظ الجزء بما عُرض له ما دامت قيمته كما هي، لذا لا يُعاد أثناء البث عرض سوى الجزء الذي يُكتب.

| الخاصية | Rust | القيمة | ما تستبدله أو تضيفه |
|---|---|---|---|
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `TextViewCodeBlock` (`CodeBlock`) | تستبدل كتلة شيفرة (تلوين صياغة خاص بك). |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `TextViewCodeAction` | أيقونة إجراء في كتلة الشيفرة من إجراءات التطبيق (`codeBlockActions`)؛ والزر المحيط بها من `TextView`. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `TextViewTable` (`Table`) | تضيف محتوى فوق جدول (نسخ، تصدير). |
| `renderMath` | `.render_math(\|math\| ..)` | `TextViewMath` | تستبدل معادلة: `{ tex, display }`، و`display` لكتلة `$$…$$`. |
| `renderImage` | `.render_image(\|image\| ..)` | `TextViewImage` (`Image`) | تستبدل صورة (`{ src, alt, title }`): تحميل وتحجيم خاصان بك، وعارض عند الضغط. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `TextViewCustomNode` (`CustomNode`) | تعرض عقدة مخصصة، بحسب `name` ([امتدادات Markdown](#markdown-extensions)). |

تحمل كتل الشيفرة إجراءات فوق ركنها العلوي الأيمن، وكلها مرسومة بالشكل نفسه: أزرار شفافة تظهر خلفيتها عند التحويم أو الضغط، وتظهر ما دام المؤشر فوق الكتلة على أجهزة سطح المكتب، وتظهر دائمًا على شاشات اللمس. `copy` مدمج: ينسخ الشيفرة ويعرض علامة صح للحظة. أما الإجراءات الأخرى فمن التطبيق: `renderCodeBlockAction` ترسم أيقونتها و`onCodeBlockAction` تبلّغ عن ضغطاتها (وعن ضغطة `copy` المدمج أيضًا، بعد أن ينسخ). يكتب `copy` في الحافظة كما يفعل `Clipboard`، لذا يحتاج إلى صلاحية `clipboard` في التطبيق (`nsh.json`).

```rust tabs
use nsh_base::{TextViewCodeAction, TextViewCodeActionEvent, text_view};
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .code_block_actions(vec![
            TextViewCodeAction::new("copy").with_label("Copy code"),
            TextViewCodeAction::new("run").with_label("Run"),
        ])
        .render_code_block_action(|_action: &TextViewCodeAction| text("▶").text_xs())
        .on_code_block_action(|event: &TextViewCodeActionEvent| {
            if event.id == "run" {
                run(&event.code.code);
            }
        })
}
```

```tsx tabs
import { Text } from "nsh";
import { TextView } from "nsh/base";

<TextView
  markdown={reply()}
  codeBlockActions={[
    { id: "copy", label: "Copy code" },
    { id: "run", label: "Run" },
  ]}
  renderCodeBlockAction={(action) => <Text class="text-xs">▶</Text>}
  onCodeBlockAction={({ id, code }) => id === "run" && run(code.code)}
/>
```

تُلوَّن كتل الشيفرة جاهزةً دون إعداد: فللغة المسمّاة على السياج (`ts` و`tsx` و`rust` و`python` و`bash` و`json` و`toml` و`yaml` و`diff` ونحو مئتين غيرها) تظهر الشيفرة بلوحة ألوان الشيفرة في Allsum، فاتحة أو داكنة بحسب المظهر؛ وتظهر الكتلة بلا لغة عادية. أما التطبيق الذي له تلوين خاص فيعرض شيفرته بـ `renderCodeBlock`، من مكوّنه الخاص أو من إحدى حزم Rust لديه؛ وتمنح واجهة Rust `TextView` ملوّنها بـ [`CodeHighlighter`](#syntax-highlighting). هنا شيفرة بتلوين من التطبيق نفسه، وصورة تملأ العرض:

```rust tabs
use nsh_base::text_view;
use nsh_base::text_view::{CodeBlock, Image};
use nsh_base::TextViewMath;
use nsh_core::prelude::*;

fn reply(markdown: Signal<SharedString>) -> impl IntoElement {
    text_view()
        .markdown(move || markdown.get())
        .render_code_block(|code: &CodeBlock| highlighted(code.language.clone(), code.code.clone()))
        .render_image(|img: &Image| {
            image(img.src.clone())
                .label(img.alt.clone())
                .aspect_ratio(16.0 / 9.0)
                .w_full()
                .rounded_lg()
        })
        .render_math(|math: &TextViewMath| math_view(math.tex.to_string(), math.display))
}
```

```tsx tabs
import { Image, View } from "nsh";

<TextView
  markdown={reply()}
  renderCodeBlock={(code) => <Highlighted language={code.language} code={code.code} />}
  renderImage={(image) => (
    <Image src={image.src} accessibilityLabel={image.alt} class="aspect-video w-full rounded-lg" />
  )}
  renderMath={(math) => <MathView tex={math.tex} display={math.display} />}
/>
```

`Highlighted` و`MathView` (`highlighted` و`math_view` في Rust) تمثّلان مكوّنات التطبيق الخاصة (ملوِّنًا، أو عارض معادلات، أو مكوّنًا من حزمة Rust لديه). وبدون `renderMath` يصفّ `TextView` المعادلة بنفسه (الجزآن `math` و`mathBlock`) بدعم TeX وخطوط KaTeX، بلون النص، وبالشكل نفسه على كل منصة؛ أما TeX التي لا يستطيع قراءتها فتظهر مصدرًا بخط أحادي المسافة.
<a id="markdown-extensions"></a>

## امتدادات Markdown

`extensions` يحوّل صيغة التطبيق الخاصة إلى عقد مخصصة، يعرضها `renderCustom`. لكل امتداد `name` (`name` العقد التي ينشئها) وواحد من أربعة أنواع من الصيغ:

| النوع | Rust | ما يطابقه | العقدة |
|---|---|---|---|
| `pattern` | `MarkdownExtension::pattern(name, regex)` | تعبير نمطي في النص (صيغة `regex` في Rust)، خارج الشيفرة والروابط | داخل السطر؛ `text` هو المطابقة، و`attributes` مجموعاتها: `"1"` و`"2"` و… والمجموعات المسماة بأسمائها |
| `language` | `MarkdownExtension::language(name, language)` | كتل الشيفرة المسوّرة بتلك اللغة (```` ```chart ````) | A block; `text` is the code, `attributes.meta` هو باقي سلسلة المعلومات |
| `tag` | `MarkdownExtension::tag(name, tag)` | عناصر HTML أو MDX بتلك الوسم، بأي حالة أحرف (`<Callout kind="tip">`) | سماتها، ومحتواها بعد تحليله: `children` (كتل) للعنصر الموجود على أسطره الخاصة، و`content` (داخل السطر) داخل النص |
| `container` | `MarkdownExtension::container(name, container)` | الحاويات `:::name` … `:::` | كتلة من Markdown في داخلها (`children`)؛ `:::note[Heads up]` يعطي `attributes.label`، و`{key=value}` السمات الأخرى |

````rust tabs
use nsh_base::text_view::{CustomNode, Document};
use nsh_base::{MarkdownExtension, text_view};
use nsh_core::prelude::*;

const MESSAGE: &str = r#"Thanks @ada! Here are the numbers:

```chart
12, 19, 7, 25
```

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::"#;

fn custom(node: &CustomNode) -> AnyElement {
    match node.name.as_str() {
        "mention" => text(node.text.clone())
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x2563eb))
            .into_element(),
        "chart" => bar_chart(node.text.split(',').filter_map(|v| v.trim().parse().ok()).collect())
            .into_element(),
        "callout" => view()
            .rounded_lg()
            .bg(rgb(0xfffbeb))
            .p_3()
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
        _ => view()
            .gap_1()
            .border_l(px(4.0))
            .border_color(rgb(0x3b82f6))
            .pl_3()
            .child(
                text(node.attributes.get("label").cloned().unwrap_or_else(|| "Note".into()))
                    .font_weight(FontWeight::SEMIBOLD),
            )
            .child(text_view().document(Document::new(node.children.clone())))
            .into_element(),
    }
}

fn message() -> impl IntoElement {
    text_view()
        .markdown(MESSAGE)
        .extensions(vec![
            MarkdownExtension::pattern("mention", r"@(\w+)"),
            MarkdownExtension::language("chart", "chart"),
            MarkdownExtension::tag("callout", "callout"),
            MarkdownExtension::container("note", "note"),
        ])
        .render_custom(custom)
}
````

````tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";
import type { MarkdownExtension, TextViewCustomNode } from "nsh/base";

const extensions: MarkdownExtension[] = [
  { name: "mention", pattern: "@(\\w+)" },
  { name: "chart", language: "chart" },
  { name: "callout", tag: "callout" },
  { name: "note", container: "note" },
];

const message = `Thanks @ada! Here are the numbers:

\`\`\`chart
12, 19, 7, 25
\`\`\`

<Callout kind="tip">Charts update live.</Callout>

:::note[Heads up]
Numbers are in thousands.
:::`;

function Custom(props: { node: TextViewCustomNode }) {
  const node = props.node;
  switch (node.name) {
    case "mention":
      return <Text class="font-semibold text-blue-600">{node.text}</Text>;
    case "chart":
      return <BarChart values={node.text!.split(",").map(Number)} />;
    case "callout":
      return (
        <View class="rounded-lg bg-amber-50 p-3">
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
    default:
      return (
        <View class="gap-1 border-l-4 border-blue-500 pl-3">
          <Text class="font-semibold">{node.attributes?.label ?? "Note"}</Text>
          <TextView document={{ blocks: node.children ?? [] }} />
        </View>
      );
  }
}

<TextView markdown={message} extensions={extensions} renderCustom={(node) => <Custom node={node} />} />;
````

`BarChart` (`bar_chart` في Rust) يمثل مخطط التطبيق الخاص. مجموعة نمط الإشارة موجودة في `node.attributes?.["1"]` (`node.attributes["1"]` في Rust: `ada`) والمطابقة كاملة في `node.text` (`@ada`). العقدة المخصصة التي لا تملك دالة عرض تعرض محتواها. العرض المُعاد لعقدة داخل السطر (شارة) يوضع في سطره بحسب `verticalAlign` الخاص به: `align-middle` (`verticalAlign: "middle"`) يوسّطه على النص، ويحتفظ سطره بقيمة `lineHeight` الخاصة بالفقرة ما لم يكن العرض أطول.

<a id="options"></a>

### الخيارات

`options` يحدد صيغة Markdown التي تُقرأ إضافةً إلى CommonMark وGitHub؛ وفي Rust هو `MarkdownOptions` بالحقول نفسها (`MarkdownOptions { streaming: true, ..Default::default() }`):

| المفتاح | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `math` | `boolean` | `true` | الصيغ الرياضية: `$…$` داخل النص، وكتل `$$…$$`. |
| `html` | `boolean` | `true` | يُقرأ HTML داخل Markdown كما تقرؤه الخاصية `html`؛ و`false` يعرضه كنص. |
| `alerts` | `boolean` | `true` | تنبيهات GitHub: `> [!NOTE]` و`[!TIP]` و`[!IMPORTANT]` و`[!WARNING]` و`[!CAUTION]`. |
| `frontmatter` | `boolean` | `false` | تتحول YAML front matter (`---` … `---` في البداية) إلى عقدة مخصصة `frontmatter` قيمة `text` فيها هي YAML. |
| `mdx` | `boolean` | `false` | MDX: عناصر JSX عقد مخصصة تُسمّى بوسمها، و`{expressions}` عقد مخصصة `expression`؛ ويُقرأ HTML الخام حينئذٍ كنص. |
| `streaming` | `boolean` | `false` | النص ما زال يصل: الصيغة التي تتركها نهايته مفتوحة تُعرض كما لو كانت مغلقة. |

<a id="the-document-model"></a>

## نموذج المستند

الخاصية `document` وقيم دوال العرض كائنات عادية، وكل عقدة موسومة بـ`type`. الأنواع تأتي من `nsh/base`: `TextViewDocument` و`TextViewBlock` و`TextViewInline` و`TextViewCodeBlock` و`TextViewTable` و`TextViewListItem` و`TextViewImage` و`TextViewFootnote` و`TextViewAlert` و`TextViewCustomNode`. وفي Rust هي أنواع `nsh_base::text_view` (`Document` و`Block` و`Inline` و`CodeBlock` و`Table` و`ListItem` و`Image` و`Footnote` و`Alert` و`CustomNode`): `Block` و`Inline` تعدادات (enums) متغيراتها هي الأنواع أدناه بنمط PascalCase (`Block::Heading { level, content, anchor }`، `Inline::Strong { content }`)، بالحقول نفسها بنمط snake case.

| الكتلة `type` | الحقول |
|---|---|
| `paragraph` | `content` |
| `heading` | `level` (1–6)، `content`، `anchor?` |
| `blockquote` | `children`، `alert?` (`"note"`، `"tip"`، `"important"`، `"warning"`، `"caution"`) |
| `list` | `ordered?`، `start?`، `loose?`، `items` (`{ checked?, children }`) |
| `codeBlock` | `language?`، `meta?`، `code` |
| `math` | `tex` |
| `table` | `align?` (`"none"`، `"left"`، `"center"`، `"right"` لكل عمود)، `head` (الخلايا)، `rows?` (صفوف من الخلايا)؛ والخلية هي `{ content }` |
| `rule` | |
| `details` | `open?`، `summary` (داخل السطر)، `children` |
| `custom` | `name`، `attributes?`، `text?`، `data?`، `children?`، `content?` |

| العنصر داخل السطر `type` | الحقول |
|---|---|
| `text` | `text` |
| `strong`، `emphasis`، `strikethrough`، `underline`، `highlight`، `superscript`، `subscript` | `content` |
| `code` | `code` |
| `keyboard` | `text` |
| `link` | `url`، `title?`، `content` |
| `image` | `src`، `alt?`، `title?` |
| `math` | `tex` |
| `break` | |
| `footnoteReference` | `label`، `index` |
| `custom` | كما في الكتلة |

للمستند أيضًا `footnotes?`: `{ label, index, children }`، وتُعرض بعد الكتل بحسب ترتيب أول إشارة إليها. يمكن للتطبيق أن يخزّن الردود كمستندات، أو يبنيها من بياناته الخاصة، أو يضيف إليها عقدًا مخصصة يعرضها `renderCustom`.

<a id="parsing-and-plain-text"></a>

### التحليل والنص العادي

`TextView` يقرأ المستندات أيضًا دون عرضها، بشكل متزامن:

| الدالة | Rust | القيمة المُعادة |
|---|---|---|
| `TextView.parse(markdown, options?, extensions?)` | `TextView::parse(markdown, options, extensions)` | `TextViewDocument` الذي كانت الخاصية `markdown` ستعرضه. |
| `TextView.parseHtml(html, extensions?)` | `TextView::parse_html(html, extensions)` | `TextViewDocument` الذي كانت الخاصية `html` ستعرضه. |
| `TextView.plainText(document)` | `TextView::plain_text(document)`، `Document::plain_text()` | نص المستند بلا وسوم: الكتل مفصولة بأسطر فارغة، وعناصر القوائم وصفوف الجداول بفواصل أسطر، والخلايا بمسافات جدولة. |

زر نسخ لرد كامل:

```rust tabs
use nsh_base::{TextView, button};
use nsh_core::prelude::*;

fn copy_reply(reply: Signal<SharedString>) -> impl IntoElement {
    button()
        .on_press(move || {
            let document = TextView::parse(reply.get().to_string(), None, None);
            set_clipboard(TextView::plain_text(document));
        })
        .child(text("Copy"))
}
```

```tsx tabs
<Button onPress={() => Clipboard.writeText(TextView.plainText(TextView.parse(reply())))}>
  <Text>Copy</Text>
</Button>
```

يمكن للتطبيق أيضًا أن يحلل مرة واحدة ويحتفظ بالمستند (`document={doc}`)، أو يعدّله قبل عرضه.

<a id="in-rust"></a>

## في Rust

تستخدم عروض Rust المكوّن نفسه من الحزمة `nsh-base`، مع الأمثلة أعلاه في تبويبات Rust الخاصة بها. ثلاثة أمور خاصة بـ Rust: مُلوِّن الشيفرة الخاص بالتطبيق، والأنماط المكتوبة حسب الجزء، وإضافات Markdown، ويُعطى كل منها لكل `TextView` تحت عرض ما بواسطة `provide_context`. أنواع المستند موجودة ضمن `nsh_base::text_view`، حيث يقرأ `Parser` المستندات أيضًا مع الإضافات (`Parser::new().plugin(..).markdown(source)`).

<a id="syntax-highlighting"></a>

### تلوين الشيفرة

`TextView` يلوّن الشيفرة باستخدام syntect بلوحة ألوان الشيفرة في Allsum (الميزة `highlight` في `nsh-base`، مفعّلة افتراضيًا)؛ وتُعرض الكتلة الكبيرة عادية فورًا ثم تأخذ ألوانها عندما ينتهي خيط في الخلفية من تلوينها. `CodeHighlighter` هو مُلوِّن التطبيق بدلًا منه، ويُعطى لكل `TextView` تحت عرض ما بواسطة `provide_context`. يستلم كل كتلة شيفرة ويعيد أنماط نطاقات البايتات في شيفرتها (مرتبة وغير متداخلة؛ وما يتركه خارجها يبقى عاديًا)؛ و`TextView` يعرض الشيفرة كمقاطع بتلك الأنماط، داخل كتلة الشيفرة المعتادة (الترويسة، والإجراءات، وعرض التمرير، والأجزاء). يمكن أن يكون المُلوِّن أي شيء يحوّل الشيفرة إلى نطاقات منسّقة: `tree-sitter`، أو syntect بسمة خاصة بالتطبيق، ...

```rust
use std::ops::Range;

use nsh_base::{CodeHighlighter, text_view::CodeBlock};
use nsh_core::{element::StyleRefinement, prelude::*};

/// The app's highlighter (here with syntect, set up once by the app).
fn highlight(code: &CodeBlock) -> Vec<(Range<usize>, StyleRefinement)> {
    my_syntect::ranges(code.language.as_deref(), &code.code)
        .map(|(range, color, bold)| {
            let style = StyleRefinement::default().text_color(color);
            (range, if bold { style.font_weight(FontWeight::BOLD) } else { style })
        })
        .collect()
}

fn chat() -> impl IntoElement {
    provide_context(CodeHighlighter::new(highlight));
    view().child(messages())
}
```

`my_syntect::ranges` يمثل وصلة التطبيق بمُلوِّنه، و`messages` يمثل عرض التطبيق للمحادثة. `renderCodeBlock`، إن أُعطي، يعرض كتلة الشيفرة بدلًا من كل هذا.

<a id="typed-part-styles"></a>

### أنماط الأجزاء المكتوبة

`TextViewParts` ينسّق الأجزاء بأنماط مكتوبة بدلًا من سلاسل الأصناف، لعروض Rust: كل `TextViewPart` (واحد لكل جزء من [الجدول أعلاه](#styling-the-parts)) يحصل على دالة تُحسّن `StyleRefinement` الخاص به. وعند إعطائها بواسطة `provide_context` تُطبَّق على كل `TextView` تحته، قبل `classes` و`styles` الخاصين به؛ وألوان السمة المقروءة فيها تتبع المظهر الفاتح والداكن.

```rust
use nsh_base::{TextViewPart, TextViewParts, theme};
use nsh_core::prelude::*;

fn chat_parts() {
    provide_context(
        TextViewParts::new()
            .part(TextViewPart::Heading1, |s| s.text_2xl().font_weight(FontWeight::BOLD))
            .part(TextViewPart::Code, |s| s.bg(theme().muted).rounded(px(4.0)))
            .part(TextViewPart::Link, |s| s.text_color(theme().primary)),
    );
}
```

<a id="markdown-plugins"></a>

### إضافات Markdown

`MarkdownPlugin` يقرأ صيغة Markdown في Rust: يستلم كل عقدة من الشجرة النحوية (`mdast` في markdown-rs) قبل أن يقرأها المحلل، ويعيد كتلة أو محتوى داخل السطر خاصًا به، وعادةً ما يكون `CustomNode`؛ ويمكنه أيضًا عرض العقد المخصصة التي ينشئها. يوفّر العرض الإضافات لكل `TextView` تحته:

```rust
use nsh_base::text_view::{mdast, CustomNode, Inline, MarkdownPlugin, MarkdownPlugins, ParseContext};
use nsh_core::prelude::*;

struct Tickers;

impl MarkdownPlugin for Tickers {
    fn name(&self) -> &str {
        "tickers"
    }

    /// `$AAPL` in inline code becomes a ticker node.
    fn inline(&self, node: &mdast::Node, _cx: &mut ParseContext<'_>) -> Option<Inline> {
        let mdast::Node::InlineCode(code) = node else { return None };
        let symbol = code.value.strip_prefix('$')?;
        Some(Inline::Custom(CustomNode::new("ticker").with_text(symbol)))
    }

    fn render(&self, node: &CustomNode) -> Option<AnyElement> {
        (node.name == "ticker").then(|| text(node.text.clone()).font_weight(FontWeight::BOLD).into_element())
    }
}

fn chat() -> impl IntoElement {
    provide_context(MarkdownPlugins::new().with(Tickers));
    view().child(messages())
}
```

`render` الخاص بالإضافة يأتي أولًا، ثم `renderCustom`، ثم محتوى العقدة. `configure` يفعّل مزيدًا من صيغة markdown-rs، و`ParseContext` يقرأ أبناء العقدة كما يقرؤهم المحلل.

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `markdown` | `.markdown(..)` | `string` | | المستند بصيغة Markdown. |
| `html` | `.html(..)` | `string` | | المستند بصيغة HTML، عند عدم إعطاء `markdown`. |
| `document` | `.document(..)` | `TextViewDocument` | | المستند ككتل، عند عدم إعطاء `markdown` ولا `html`. |
| `options` | `.options(..)` | `MarkdownOptions` | كل القيم الافتراضية | صيغة Markdown المقروءة ([الخيارات](#options)). |
| `extensions` | `.extensions(..)` | `MarkdownExtension[]` | `[]` | صيغة التطبيق الخاصة، كعقد مخصصة ([امتدادات Markdown](#markdown-extensions)). |
| `classes` | `.classes(..)` | `TextViewClasses` | `{}` | أصناف Tailwind حسب الجزء. |
| `styles` | `.styles(..)` | `TextViewStyles` | `{}` | أنماط داخل السطر حسب الجزء (كل منها `StyleProp<TextStyle>`)، فوق الأصناف. |
| `selectable` | `.selectable(..)` | `boolean` | `false` | المستند قابل للتحديد كوحدة واحدة: يمتد التحديد عبر فقراته وعناوينه وخلاياه وكتل الشيفرة فيه ([تحديد النص](./text-selection.md)). |
| `links` | `.links(..)` | `"report" \| "open"` | `"report"` | ما يفعله الضغط على رابط: يبلّغ عنه (`onLinkPress`)، ومع `"open"` يفتح أيضًا الرابط المؤدي إلى موقع أو تطبيق آخر خارج التطبيق ([الروابط](#links)). |
| `codeBlockScrollbar` | `.code_block_scrollbar(..)` | `boolean` | `true` | تعرض كتل الشيفرة مؤشر التمرير الأفقي. |
| `tableScrollbar` | `.table_scrollbar(..)` | `boolean` | `true` | تعرض الجداول مؤشر التمرير الأفقي. |
| `streamingCaret` | `.streaming_caret(..)` | `JSX.Element` | | يُعرض في نهاية المستند: داخل السطر بعد آخر نص، وإلا ففي سطر خاص به. |
| `renderCustom` | `.render_custom(\|node\| ..)` | `(node: TextViewCustomNode) => JSX.Element` | | يعرض العقد المخصصة. |
| `renderCodeBlock` | `.render_code_block(\|code\| ..)` | `(code: TextViewCodeBlock) => JSX.Element` | | يعرض كتل الشيفرة. |
| `codeBlockActions` | `.code_block_actions(..)` | `TextViewCodeAction[]` | `[]` | الإجراءات فوق الزاوية العلوية اليمنى لكل كتلة شيفرة: `{ id: "copy" }` مدمج، والبقية من التطبيق. |
| `renderCodeBlockAction` | `.render_code_block_action(\|action\| ..)` | `(action: TextViewCodeAction) => JSX.Element` | | أيقونة أحد إجراءات التطبيق. |
| `renderTableActions` | `.render_table_actions(\|table\| ..)` | `(table: TextViewTable) => JSX.Element` | | محتوى فوق كل جدول. |
| `renderMath` | `.render_math(\|math\| ..)` | `(math: TextViewMath) => JSX.Element` | | يعرض الصيغ الرياضية. |
| `renderImage` | `.render_image(\|image\| ..)` | `(image: TextViewImage) => JSX.Element` | | يعرض الصور. |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | | الجذر، وهو عمود من الكتل؛ وتنتقل أنماط نصه إلى كل جزء (أنماط النص المكتوبة: `styles.root`). |

في Rust تكون الأصناف والأنماط حسب الجزء `TextViewClasses` و`TextViewStyles`؛ وعادةً ما ينسّق عرض Rust الأجزاء بواسطة [`TextViewParts`](#typed-part-styles).

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onLinkPress` | `.on_link_press(\|event: &TextViewLinkPressEvent\| ..)` | تم الضغط على رابط: `{ url }`: عنوانه URL، و`#anchor` للعنوان الرئيسي، و`#footnote-<label>` للحاشية. |
| `onCodeBlockAction` | `.on_code_block_action(\|event: &TextViewCodeActionEvent\| ..)` | تم الضغط على إجراء في كتلة شيفرة (بعد أن نسخ `copy`). |
| `onImagePress` | `.on_image_press(\|image: &Image\| ..)` | تم الضغط على صورة ليست داخل رابط: `{ image }`، ليعرضها التطبيق بحجم أكبر (عارض قابل للتكبير خاص به). |

<a id="accessibility"></a>

## إمكانية الوصول

تقرأ قارئات الشاشة المستند بالترتيب، نصًا بعد نص. `TextView` يمنح البنية أدوارها: العناوين الرئيسية هي ترويسات، والروابط هي روابط (عنوانها هو التلميح)، وعلامات المهام هي مربعات اختيار مع حالة تحديدها، وملخص الإفصاح زر يخبر ما إذا كان موسّعًا، وتُقرأ الصور بنص بديلها.

<a id="related"></a>

## ذو صلة

- [Text](./text.md): العنصر الذي يمثّله كل نص في `TextView`، مع مقاطعه وروابطه ومرفقاته داخل السطر وتحديده.
- [تحديد النص](./text-selection.md): تحديد واحد عبر عدة `TextView` ونصوص.
- [`nsh/base`](../modules/nsh-base.md): المكونات الأساسية الأخرى.
- [التنسيق](../docs/styling.md) و[Tailwind](../docs/tailwind.md).
