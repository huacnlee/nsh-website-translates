---
title: "RichEditor"
description: "محرر النصوص المنسّقة في nsh/base: مستندات يحدّدها مخطط التطبيق، مع الأوامر والإضافات وسجل التراجع واختصارات لوحة المفاتيح وقواعد الإدخال وMarkdown، وفق بنية ProseMirror، مع إبقاء حالته في Rust."
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---

# RichEditor

`RichEditor` هو محرر نصوص منسّقة مبني على معمارية ProseMirror. يحدد التطبيق مما يتكوّن المستند عبر مخطط (schema) من أنواع العقد والعلامات التي يحتاجها (فقرات، عناوين، قوائم، إشارات، وغيرها)، ويُبقي المحرر كل مستند صالحًا وفق هذا المخطط. التغييرات خطوات مجمّعة في معاملات (transactions)، ولذلك يمكن التراجع عنها وتحويل المواضع عبرها ونقلها بصيغة JSON. أما السلوك فيأتي من الإضافات (plugins): السجل، وربط المفاتيح، وقواعد الإدخال، واختصارات Markdown، وإضافات التطبيق نفسه. والأوامر قيم يشغّلها شريط الأدوات ويستعلم عنها. حالة المحرر وأوامره وإضافاته تعمل في Rust: الكتابة وربط المفاتيح وقواعد الإدخال لا تنتظر JS أبدًا، ويقرأ التطبيق الحالة بصيغة JSON عندما يطلبها.

يتكوّن المحرر من جزأين: الجلسة (`createRichEditor`) التي تملك الحالة ويقودها كود التطبيق، والعرض (`<RichEditor editor={…} />`) الذي يرسم الجلسة بشكل أصلي ويحوّل مدخلات المنصة إلى معاملات. يمكن لعدة عروض أن تعرض جلسة واحدة.

نواة المحرر هي نقل إلى Rust من [ProseMirror](https://prosemirror.net) لمؤلفه Marijn Haverbeke، وتتبع طبقة الامتدادات فيه [Tiptap](https://tiptap.dev): هياكل بياناتهما وأوامرهما وأسماؤهما منقولة كما هي، وكذلك ما تعرفه عنهما. كلاهما مرخّص بترخيص MIT، وتسري تراخيصهما على ما نُقل منهما.

```tsx
import { mount } from "nsh";
import { RichEditor, createRichEditor, history, inputRules, keymap, markdown, markdownRules, starterKeymap, baseKeymap, toggleMark } from "nsh/base";

const editor = createRichEditor({
  content: "# Notes\n\nStart typing…",
  format: "markdown",
  plugins: [
    history(),
    keymap({ "Mod-b": toggleMark("bold"), "Mod-i": toggleMark("italic") }),
    starterKeymap(),
    baseKeymap(),
    inputRules(markdownRules()),
    markdown(),
  ],
});

function App() {
  return <RichEditor editor={editor} class="flex-1" />;
}

mount(App);
```

بدون `schema` يستخدم المحرر المخطط الابتدائي (`starterSchema()`)؛ وبدون `plugins` يحصل على الحزمة الابتدائية (`starterKit()`: قواعد الإدخال وربط المفاتيح الخاصة بالمخطط الابتدائي، وربط المفاتيح الأساسي، والسجل). المصفوفة الفارغة `plugins` تنشئ محررًا بلا أي إضافات.

<a id="styling"></a>

## التنسيق

يرسم المحرر المستند بمظهر التطبيق: `classes` و`styles` ينسّقان أجزاءه (`root`، `content`، `caret`، `selection`، `placeholder`، `composition`، `selectedNode`، `listMarker`، وللجداول `selectedCell`، `tableGrip`، `tableResizeHandle`، `tableDropIndicator`)، وعقده حسب النوع (`nodes: { heading:
"text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`). عناصر القوائم التي تضبط مواصفات عقدتها `extra.listMarker` على `"bullet"` أو `"ordered"` (قوائم المخطط الابتدائي) تعرض علامة في الجزء `listMarker`: `•` أو `◦` أو `▪` بحسب العمق، أو أرقامًا تبدأ من `start` الخاصة بالقائمة، وتوضع قبل العنصر، ضمن إزاحة القائمة (`pl-6` على القائمة، كما يزيح المتصفح `ul`).

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { heading: "text-2xl font-bold", bulletList: "pl-6", codeBlock: "font-mono bg-muted p-3 rounded-md" },
    marks: { bold: "font-bold", italic: "italic", code: "font-mono bg-muted" },
    listMarker: "text-muted-foreground",
  }}
/>
```

الجزء `content` هو صندوق المستند داخل عرض التمرير الخاص بالمحرر: حشوته (`content: "px-6 py-5"`) هي المساحة المحيطة بالنص، ويمتد شريط التمرير على حافة المحرر نفسها. السحب الذي يحدد نصًا متجاوزًا أعلى المحرر أو أسفله يمرّر المستند معه، بسرعة تزداد كلما ابتعد المؤشر.

<a id="bubble-menu"></a>

### قائمة الفقاعة

`bubbleMenu` هي قائمة الفقاعة (bubble menu) في Tiptap: محتوى التطبيق يظهر بجانب التحديد، وفوقه افتراضيًا (`bubbleMenuPlacement`، ويقلب إلى الجهة الأخرى حيث لا توجد مساحة) على مسافة `bubbleMenuOffset` نقاط (8)، داخل طبقة علوية تتبع النص أثناء تمريره. يمرّرها التطبيق ما دام يريد إظهارها، انطلاقًا من حالة الجلسة:

```tsx
const revision = signal(editor.revision);
editor.on("revision", ({ revision: r }) => revision.set(r));
const inLink = () => (revision(), editor.isActive("link"));

<RichEditor
  editor={editor}
  bubbleMenu={inLink() ? <LinkMenu href={editor.getAttributes("link").href} /> : undefined}
  bubbleMenuPlacement="bottom"
/>
```

تعدّل قائمة الروابط الرابط الواقع تحت المؤشر باستخدام `chain([extendMarkRange("link"), command("setLink", { href })])` وتزيله باستخدام `command("unsetLink")` بعد `extendMarkRange` نفسها.

<a id="schemas"></a>

## المخططات

`defineSchema(spec)` يقرأ مخططًا بصيغة ProseMirror ويرمي خطأً يصف ما فيه من مشكلة. تحدد أنواع العقد `content` (تعبير المحتوى: `"inline*"`، `"paragraph+"`، `"(heading | paragraph) block*"`)، و`group`، وهل هي `inline` أو `atom`، و`marks` التي تسمح بها، و`attrs` مع القيم الافتراضية والتحقق (`"string"`، `"number"`، `"boolean"`). أول نوع كتلة هو النوع الافتراضي: ما ينشئه Enter وما يملأ المحتوى المطلوب. المفاتيح التي لا تعرفها المواصفات تُحفظ كبيانات إضافية للنوع، لتستفيد منها الأطر المبنية على المحرر.

```tsx
import { createRichEditor, defineSchema } from "nsh/base";

const schema = defineSchema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    mention: { group: "inline", inline: true, atom: true, attrs: { id: {}, label: { default: "" } } },
    text: { group: "inline" },
  },
  marks: { bold: {}, link: { attrs: { href: {} }, inclusive: false } },
});

const editor = createRichEditor({ schema, doc: schema.parse("Hello") });
```

`RichSchema` يقرأ المستندات ويكتبها: `parse(content, format?)` (نص عادي افتراضيًا، أو `"markdown"`، أو JSON)، و`parseMarkdown(markdown)`، و`serialize(doc, format?)` (Markdown افتراضيًا، أو `"text"`، أو `"json"`) و`check(doc)` الذي يعيد المستند بعد ملء القيم الافتراضية لسماته. `nodes` و`marks` و`topNode` تسمّي أنواعه. يطابق Markdown أسماء المخطط الابتدائي (`paragraph`، `heading`، `blockquote`، `codeBlock`، `bulletList`، `orderedList`، `listItem`، `bold`، `italic`، `code`، `link`، `strike`).

<a id="commands"></a>

## الأوامر

الأمر قيمة: `toggleMark("bold")` ينشئ كائنًا يحتفظ به التطبيق ويربطه بالمفاتيح ويمرره إلى المحرر. `editor.run(command)` ينفذه ويعيد ما إذا كان قد طُبّق؛ و`editor.can(command)` يسأل دون تغيير أي شيء، وهكذا يفعّل شريط الأدوات أزراره. `editor.isActive(name, attrs?)` يخبر ما إذا كانت علامة أو عقدة فعّالة عند التحديد (`isActive("heading", { level: 2 })`).

| الأمر | ما يفعله |
| --- | --- |
| `toggleMark(name, attrs?)` | يضيف العلامة إلى التحديد، أو يزيلها حيث توجد؛ وعند المؤشر يسري على النص المكتوب لاحقًا |
| `setMark(name, attrs?)` / `unsetMark(name)` | يضيف علامة أو يزيلها |
| `setBlockType(name, attrs?)` | يجعل كتل النص المحددة من نوع معيّن (`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | يلف الكتل المحددة في عقدة (اقتباس) / يرفعها خارج أصلها |
| `wrapInList(name, attrs?)` | يلف الكتل المحددة في قائمة |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | يقسّم عناصر القائمة أو يزيح إزاحة للداخل أو للخارج |
| `undo()` / `redo()` | يتراجع عن تغيير أو يعيده (مع `history()`) |
| `selectAll()`، `setTextSelection(anchor, head?)`، `setNodeSelection(pos)` | يحدد |
| `insertText(text)`، `insertContent(content, format?)` | يُدرج نصًا أو محتوى فوق التحديد |
| `setNodeAttribute(pos, attr, value)` | يضبط سمة عقدة عند موضع ما، كتغيير واحد يمكن التراجع عنه |
| `command(name)` | أمر بلا معاملات حسب الاسم: `"splitBlock"`، `"joinBackward"`، `"exitCode"`، `"newlineInCode"`، `"selectParentNode"`، … |
| `chain(commands)` | ينفذ أوامر الواحد تلو الآخر كمعاملة واحدة (خطوة تراجع واحدة)؛ ولا يُطبّق إلا إذا طُبّقت كلها |
| `first(commands)` | ينفذ أول أمر ينطبق |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## الجلسة

| العضو | ما هو |
| --- | --- |
| `state`، `doc`، `selection` | الحالة والمستند والتحديد بصيغة JSON، تُنشأ عند القراءة |
| `revision` | عدد المعاملات التي طبّقتها الحالة |
| `isEmpty`، `undoDepth`، `redoDepth`، `composing` | ما تعرضه واجهة المستخدم عن المحرر |
| `setContent(content, format?)` | يستبدل المستند، كتغيير واحد يمكن التراجع عنه |
| `insertContent(content, format?)` | يُدرج محتوى فوق التحديد |
| `getJSON()`، `getMarkdown()`، `getText()`، `textBetween(from?, to?, separator?)` | المستند بصيغة معيّنة |
| `dispatch(tr)` | يطبّق معاملة معطاة بصيغة JSON (خطواتها على المستند الحالي) |
| `on(event, listener)` | يستدعي `listener` بحمولة كل `event`، في الدورة التالية من JS: `revision` (`{ revision }`، بعد كل تغيير ومن أي مصدر)، `update`، `selectionUpdate`، `transaction`، `focus`، `blur`، `delete`. يعيد دالة توقفه؛ والمستمع المضاف أثناء رسم مكوّن يتوقف مع المكوّن |
| `focus()`، `blur()` | ينقل تركيز لوحة المفاتيح إلى العروض التي تعرض المحرر أو منها |

تُحتسب المواضع كما في ProseMirror: النص يحسب وحدات UTF-16 البرمجية، والعقدة الورقية تحسب واحدًا، والعقدة ذات المحتوى تحسب حديها. أي شيء يجب أن يبقى بعد التعديلات يحتفظ بمعرّف في سمات عقدة أو في علامة. استعلام الموضع (`resolve(pos)`، `nodeAt(pos)`، `coordsAtPos(pos)`، `findParentNode(name, pos)`، ...) يرمي `RangeError` لموضع خارج المستند (`0` إلى `doc.content.size`)، كما يفعل `resolve` في ProseMirror، ويجيب بـ`null` حيث لا يوجد شيء (`nodeAt` في نهاية عقدة، `coordsAtPos` عندما لا يوجد عرض يعرض المحرر). `run` و`can` يرميان `TypeError` لأمر أو نوع عقدة أو علامة لا يعرفها المحرر.

<a id="taking-over-transactions"></a>

### تولّي المعاملات

`editor.dispatchTransaction = (tr) => { … }` يجعل التطبيق يُثبّت كل معاملة بنفسه: يتلقى المعالج كل واحدة بصيغة JSON ويثبتها باستخدام `editor.applyTransaction(tr)`، أو يتجاهلها. يُستخدم هذا في التعاون والتسجيل والمعاملات التي يجب أن تمر بفحوص التطبيق؛ و`null` يعيد مهمة التثبيت إلى المحرر. يسمع المعالج الكتابة في الدورة التالية من JS، ويتغير المستند عندما يثبّت المعاملة.

<a id="extensions"></a>

## الامتدادات

الامتدادات (extensions) هي امتدادات Tiptap: كل واحد منها يجلب معًا نوع عقدته أو علامته، وربط مفاتيحه، وقواعد الإدخال واللصق، والإضافات والأوامر المسمّاة، والمحرر المصنوع من امتدادات يحصل على مخططه وخريطة مفاتيحه وقواعده وجدول أوامره منها. الامتدادات المدمجة أصناف (classes) بأسماء Tiptap نفسها، تُستخدم كما هي أو مهيأة:

```tsx
import { RichEditor, StarterKit, Underline, command, createRichEditor } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false })],
  content: "Hello",
  editable: true,
});

editor.run(command("toggleHeading", { level: 2 }));
editor.run(command("toggleBold"));
```

`StarterKit` يجلب `Document`، `Paragraph`، عقدة النص، `Heading`، `Blockquote`، `BulletList`، `OrderedList`، `ListItem`، `TaskList`، `TaskItem`، `CodeBlock`، `HardBreak`، `HorizontalRule`، `RichImage` (`Image` في Tiptap)، `Bold`، `Italic`، `Strike`، `Code`، `Underline`، `RichLink` (`Link` في Tiptap)، `Highlight`، `Subscript`، `Superscript`، `RichTextStyle` (`TextStyle` في Tiptap)، `TextAlign`، `History`، `TrailingNode`، `Typography` و`ListKeymap`. الخيار الذي يحمل اسم واحد منها ومضبوط على `false` يستبعده، والكائن يهيّئه (`heading: { levels }`، `history: { depth }`، `textAlign: { types }`، `codeBlock: { enableTabIndentation }`). `configure(options)` و`extend({...})` لكل صنف ينشئان `RichExtension`، وله `name` و`type` و`priority` و`options`. كل محرر يحصل أيضًا على خريطة المفاتيح الأساسية (Enter وBackspace وDelete وتحديد الكل).

كل امتداد يضيف أوامر Tiptap، التي ينفذها `command(name, args)`: `toggleBold`، `setItalic`، `unsetStrike`، `toggleHeading({ level })`، `setParagraph`، `toggleBlockquote`، `toggleBulletList`، `toggleOrderedList`، `toggleTaskList`، `toggleCodeBlock({ language })`، `setHardBreak`، `setHorizontalRule`، `setImage({ src })`، `toggleHighlight({ color })`، `setTextAlign("center")`، `unsetTextAlign`، وأوامر الروابط وعدّ الأحرف والاقتراحات أدناه.

تعمل مفاتيح تبديل القوائم على القوائم كاملة، كما تفعل أزرار القوائم في معالج النصوص: `toggleOrderedList` داخل قائمة نقطية يرقّمها على كل المستويات، بما فيها القوائم المتداخلة، وتبديل القائمة نفسها يُخرج الكتل المحددة من كل قائمة تحيط بها.

ترتيب `extensions` هو أولويتها بين المتساويات: الامتداد المدرج لاحقًا يربط مفاتيحه قبل الامتدادات التي قبله؛ و`priority` (100 افتراضيًا) يرتّبها بطريقة أخرى. مع `extensions`، تأتي `plugins` الخاصة بالمحرر بعد إضافات الامتدادات.

<a id="the-apps-extensions"></a>

### امتدادات التطبيق

`defineExtension` ينشئ واحدًا. تعمل دوالّه مرة واحدة، عندما يُنشأ محرر به، مع خيارات الامتداد، وتعيد بيانات: أوامر وقواعد وإضافات كما تصنعها المصانع أعلاه.

```tsx
import { StarterKit, command, createRichEditor, defineExtension, insertText, textRule } from "nsh/base";

const Signature = defineExtension({
  name: "signature",
  priority: 200,
  addOptions: () => ({ text: "— Sent from NSH" }),
  addCommands: (options) => ({ insertSignature: insertText(options.text) }),
  addKeyboardShortcuts: () => ({ "Mod-Alt-s": command("insertSignature") }),
  addInputRules: () => [textRule("\\(sig\\)$", "✍")],
});

const editor = createRichEditor({ extensions: [StarterKit, Signature.configure({ text: "Best, Ana" })] });
```

`node` أو `mark` (بصيغة `defineSchema`) يجعله امتداد عقدة أو علامة؛ و`addGlobalAttributes` يضيف سمات إلى أنواع أخرى؛ و`addProseMirrorPlugins` يعيد إضافات، بما فيها `RichEditorPlugin`؛ و`addPasteRules` يعيد قواعد `textRule` و`markRule` للنص الملصوق. `extend({...})` في صنف مدمج يستبدل الأجزاء التي يقدمها: `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`.

تسجّل حزمة (crate) التطبيق الامتدادات المكتوبة بـ Rust عبر مجموعة واجهتها، ويأخذها JS بالاسم:

```rust
use nsh_base::rich_editor::extensions::{Extension, RichExtensionRegistry};

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.rich_extension("mention", || Extension::new("mention") /* .add_plugins(...) */);
}
```

```tsx
const editor = createRichEditor({ extensions: [StarterKit, richExtension("mention", { char: "@" })] });
```

`richExtension(name, options)` يجد أيضًا كل امتداد مدمج باسمه (`"text"`، `"bold"`، ...).

<a id="plugins"></a>

## الإضافات

| المصنع | ما يضيفه |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | سجل التراجع؛ التغييرات خلال `newGroupDelay` ميلي ثانية (500) يُتراجع عنها معًا |
| `keymap(bindings)` | أوامر حسب اسم المفتاح: `"Mod-b"` (Cmd على منصات Apple، وCtrl في غيرها)، `"Shift-Enter"`، `"Alt-ArrowUp"` |
| `baseKeymap()` | Enter وBackspace وDelete وتحديد الكل ومفاتيح تحرير النص الخاصة بالمنصة |
| `starterKeymap()` | ربط المخطط الابتدائي: العلامات والعناوين والقوائم وكتل الكود وفواصل الأسطر |
| `inputRules(rules)` | النص المكتوب قبل المؤشر والمطابق لقاعدة يتحوّل إلى ما تنتجه القاعدة؛ وBackspace مباشرة بعده يتراجع عنه |
| `markdown(options?)` | Markdown أثناء الكتابة، ولصق Markdown، ونسخ Markdown (`blockRules`، `inlineRules`، `paste`، `copyAsMarkdown`) |
| `starterKit()` | قواعد الإدخال وربط المفاتيح الابتدائيان، وربط المفاتيح الأساسي، والسجل |

مكان الإضافة في القائمة هو أولويتها: خرائط المفاتيح وقواعد الإدخال الأسبق في القائمة تعالج المفتاح أو النص أولًا. تأتي قواعد الإدخال من `markdownRules()` (العناوين والاقتباسات والقوائم وأسوار الكود والقواعد والعلامات الشائعة)، و`typographyRules()` (علامات الاقتباس الذكية، والحذف، والشرطة الطويلة)، و`textRule(match, replacement)`، و`markRule(match, mark)`، و`wrappingRule(match, node)` و`textblockRule(match, node)`. `match` في القاعدة تعبير نمطي ينتهي بـ`$`، يُطابَق مع النص الواقع قبل المؤشر.

<a id="the-apps-plugins"></a>

### إضافات التطبيق

`new RichEditorPlugin(key)` ينشئ إضافة سلوكها من التطبيق، تُضبط باستدعاءات متسلسلة:

```tsx
import { RichEditorPlugin, createRichEditor, starterKit } from "nsh/base";

const suggestions = new RichEditorPlugin("suggestions")
  .captureKeys(["ArrowUp", "ArrowDown", "Enter", "Escape"], (key) => moveSuggestion(key))
  .filterTransaction((tr) => tr.meta?.locked !== true)
  .appendTransaction((trs, state) => null);

const editor = createRichEditor({ plugins: [starterKit(), suggestions] });

// While the suggestion list is open, its keys are the list's.
suggestions.capturing = true;
editor.setDecorations("suggestions", [{ from: 5, to: 9, kind: "inline", attrs: { class: "bg-accent" } }]);
```

- `captureKeys(keys, handler)`: ما دام `capturing` صحيحًا، يستهلك المحرر هذه المفاتيح ويخبر `handler` بالمفتاح الذي ضُغط، مباشرة بعد ذلك؛ وتبقى لوحة المفاتيح سريعة كما لو لم تكن هناك إضافة.
- `editor.setDecorations(key, decorations)`: سمات مضمّنة وسمات عقد وعناصر واجهة (widgets) يرسمها العرض فوق المستند دون تغييره. وهي تتبع كل تغيير حتى تُضبط من جديد.
- `filterTransaction(hook)` و`appendTransaction(hook)` يريان المعاملات التي تنتجها استدعاءات التطبيق نفسه (`run`، `dispatch`، `setContent`، …) في ذلك الاستدعاء: `filterTransaction` يمكنه إسقاط معاملة، و`appendTransaction` يمكنه إعادة معاملة إضافية تُطبَّق معها. `on("revision", …)` يسمع كل تغيير، بما فيه الكتابة.
<a id="links-character-counts-and-suggestions"></a>

## الروابط وعدّ الأحرف والاقتراحات

ثلاث إضافات تحمل سلوك Link وCharacterCount وSuggestion من Tiptap، وكلها أصلية (native):

```tsx
import { RichEditor, characterCount, createRichEditor, insertMention, link, starterKit, starterSchema, suggestion, withMention } from "nsh/base";

const editor = createRichEditor({
  schema: withMention(starterSchema()),
  plugins: [
    starterKit(),
    link({ defaultProtocol: "https" }),
    characterCount({ limit: 280 }),
    suggestion({ key: "mention", char: "@", decorationClass: "text-primary", captureKeys: ["ArrowUp", "ArrowDown", "Enter"] }),
  ],
});

editor.on("transaction", () => {
  const s = editor.suggestion("mention");
  if (s?.active) showPeople(s.query, editor.coordsAtPos(s.range.from), s.lastKey);
  setCount(`${editor.characters()} / ${editor.characterLimit}`);
});

// The list picked someone:
editor.run(insertMention(editor.suggestion("mention")!.range, "u1", "Joan"));
```

- `link(options?)`: أي عنوان URL يُكتب قبل مسافة أو Enter يتحول إلى رابط، وكذلك عناوين URL في النص الملصوق (`autolink`)؛
  وعنوان URL يُلصق فوق تحديد يحوّل التحديد إلى رابط (`linkOnPaste`)؛ والضغط على رابط مع الإبقاء على Mod مضغوطًا، أو أثناء كون
  المحرر للقراءة فقط، يفتحه عبر معالجة عناوين URL في التطبيق (`openOnClick`)؛ و`enableClickSelection` يحدد
  الرابط كاملًا عند الضغط عليه. تُكتشف عناوين URL مع بروتوكول أو بدونه (`nsh.dev`، `https://nsh.dev/docs`، وعناوين
  البريد الإلكتروني)، والبروتوكول الذي يُمنح للمضيف المجرد هو `defaultProtocol` (`http`). تقبل الروابط البروتوكولات `http`،
  `https`، `ftp`، `ftps`، `mailto`، `tel`، `callto`، `sms`، `cid`، `xmpp` وتلك الموجودة في `protocols`، لذا
  فإن `setLink({ href })` و`toggleLink(attrs?)` والربط التلقائي تُبقي السكربتات (`javascript:`) وعناوين data URL خارج الروابط.
  `unsetLink()` يزيل الرابط المحيط بالتحديد.
- `characterCount(options?)`: `editor.characters(mode?)` يعدّ أحرف النص (`"textSize"`، بوحدات UTF-16 كما
  يفعل `length` في JS) أو مواضع المستند (`"nodeSize"`)؛ و`editor.words()` يعدّ كلماته (وفق حدود الكلمات في Unicode). مع `limit`، تُرفض التغييرات التي ستتجاوز الحد ويُقتطع المحتوى الملصوق بما يتسع له؛
  والمستند الأول الذي يتجاوز الحد يُقتطع (`autoTrim`). `setCharacterLimit(limit)` يغيّر الحد و
  `editor.characterLimit` يقرؤه.
- `suggestion(options?)`: يتتبع مُحفِّزًا (`char`، `@` افتراضيًا) يُكتب قبل المؤشر. `allowSpaces` يتيح أن
  يحتوي الاستعلام على مسافات، و`allowedPrefixes` يسرد ما يجوز أن يسبق المُحفِّز (مسافة افتراضيًا؛ و`anyPrefix` يقبل
  أي شيء)، و`startOfLine` يشترط وجوده في بداية السطر (قائمة أوامر `/`). `editor.suggestion(key)` يعطي
  `{ active, range, query, text, lastKey, keyCount }`؛ والنطاق النشط يحمل `decorationClass` الخاص بالتطبيق (و
  `decorationEmptyClass` ما دام الاستعلام فارغًا). وما دام الاقتراح نشطًا فإن المفاتيح الموجودة في `captureKeys` تخص
  قائمة التطبيق: يلتقطها المحرر ويسجل آخرها في الحالة، ويُغلق Escape
  الاقتراح (وكذلك `exitSuggestion(key)`). `replaceSuggestion(content, key?)` يستبدل المُحفِّز
  والاستعلام بنص أو بمحتوى JSON.
- `withMention(schema, { name?, char? })` يضيف عقدة mention من Tiptap: ذرّة (atom) داخل السطر مع `id` و`label` ومُحفِّزها،
  وتُكتب على الشكل `@label` في النص وعلى الشكل `<span data-type="mention">` في HTML. `insertMention(range, id, label?)`
  يستبدل نطاق الاقتراح بإشارة (mention) ومسافة.

النافذة المنبثقة من مسؤولية التطبيق: يقرأ حالة الاقتراح، ويضع نفسه عند `coordsAtPos(range.from)`، ويرسم
العناصر بطريقته الخاصة.

<a id="tables"></a>

## الجداول

`TableKit` يجلب جداول Tiptap: `RichTable` (`Table` في Tiptap)، و`RichTableRow`، و`RichTableHeader`، و
`RichTableCell`. ويُضاف بجانب `StarterKit`:

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

يقبل الجدول الخيارات `resizable` (true)، و`cellMinWidth` (25)، و`lastColumnResizable` (true)،
و`allowTableNodeSelection` (false)، و`HTMLAttributes`؛ و`TableKit.configure({ tableHeader: false })` يترك
امتدادًا واحدًا خارجًا. تحتوي الخلايا على كتل ولها `colspan` و`rowspan` و`colwidth` (عرض بالنقاط لكل عمود
تمتد عبره)؛ وللصفوف `height`.

ينقل Tab وShift-Tab بين الخلايا، ويضيف Tab في الخلية الأخيرة صفًا. تنتقل مفاتيح الأسهم عند حافة الخلية إلى
الخلية التالية؛ ويحدد Shift مع سهم، أو السحب عبر الخلايا، مستطيلًا من الخلايا (تحديد من النوع
`"cell"`، حيث `anchor` و`head` هما الموضعان قبل أول خلية وقبل آخر خلية فيه). يفرّغ Backspace وDelete
الخلايا المحددة، ويحذفان الجدول عندما تكون كل خلاياه محددة.

يظهر الجدول في المحرر كشبكة من خلاياه: كل عمود بعرض `colwidth` لخلاياه، والأعمدة التي لا تملكه
تتقاسم المساحة (بعرض لا يقل عن `cellMinWidth`)، وكل صف بارتفاع لا يقل عن `height`. يبدأ مظهره من السمة (theme): شبكة
`border` بسماكة نقطة واحدة، وخلايا الرأس على `muted`، وخلايا ذات حشوة، وكل خلية محددة تحت الجزء `selectedCell` بلون
التحديد. `classes.nodes` (`table`، `tableCell`، `tableHeader`) والأجزاء تعيد تنسيق
كل ذلك. يؤدي السهمان لأعلى ولأسفل في السطر الأول أو الأخير من الخلية إلى الانتقال إلى الخلية التي فوقها أو تحتها.

أثناء إمكانية تحرير المستند:

- على أجهزة سطح المكتب، تتيح الحافة اليمنى لكل عمود والحافة السفلية لكل صف تغيير حجمها: يعرض المؤشر
  مؤشر تغيير الحجم وخط `tableResizeHandle`، ويتبع الجدول السحب، ويضبط الإفلات `colwidth` أو
  `height` في خطوة واحدة يمكن التراجع عنها. `resizable: false` يوقف هذا، و`lastColumnResizable: false` يُبقي
  عرض العمود الأخير.
- يعرض الجدول الذي يوجد فيه التحديد مقابض (`tableGrip`) على حافته العلوية فوق كل عمود وعلى حافته اليسرى
  بجانب كل صف. يحدد الضغط على أحدها ذلك العمود أو الصف؛ وسحبه على أجهزة سطح المكتب يُظهر موضع الإفلات
  (`tableDropIndicator`) وينقله إليه عند الإفلات.

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { tableHeader: "font-semibold", tableCell: "px-3 py-2" },
    selectedCell: "bg-primary/10",
    tableGrip: "bg-muted-foreground/60 rounded-full",
  }}
/>
```

الأوامر، وكلٌّ منها مساعد (helper) من `nsh/base`:

- `insertTable({ rows, cols, withHeaderRow })` (3 × 3 مع صف رأس افتراضيًا) و`deleteTable()`.
- `addColumnBefore()`، `addColumnAfter()`، `deleteColumn()`، `addRowBefore()`، `addRowAfter()`، `deleteRow()`.
- `mergeCells()` و`splitCell()` و`mergeOrSplit()`.
- `toggleHeaderRow()` و`toggleHeaderColumn()` و`toggleHeaderCell()`.
- `setCellAttribute(name, value)`، `setCellSelection({ anchorCell, headCell })`، `goToNextCell()`،
  `goToPreviousCell()` و`fixTables()`، الذي يصلح الجداول ذات الخلايا الناقصة أو المتداخلة.
- `moveTableRow({ from, to, select })` و`moveTableColumn({ from, to, select })` ينقلان صفًا أو عمودًا، مع
  الصفوف أو الأعمدة التي تمتد عبرها خلاياه المدمجة؛ و`setColumnWidth({ col, width })` و
  `setRowHeight({ row, height })` يضبطان حجمها (`null` يضبطه وفق محتواها). وتقبل هذه `table`، وهو الموضع
  قبل جدول، للعمل على جدول غير جدول التحديد.

تُقرأ الجداول من HTML وتُكتب إليه (`<table>` مع `<th>` / `<td>`، و`colspan`، و`rowspan` و`data-colwidth`) ومن
Markdown وإليه: الجدول الذي له صف رأس وكل خلية فيه فقرة واحدة هو جدول GFM بالأعمدة العمودية (pipe table)، وأي جدول آخر
يُكتب بصيغة HTML الخاصة به، وتُقرأ بالشكل نفسه. وفي النص العادي يكون الصف سطرًا من خلاياه مفصولة بعلامات Tab.
