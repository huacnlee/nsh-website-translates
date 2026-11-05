---
title: "المحرر (Editor)"
description: "مكوّن Editor: محرر شيفرة يدعم تلوين الصياغة، وأرقام الأسطر، والمؤشرات المتعددة، وطيّ الشيفرة، والتفاف النص التلقائي، والبحث والاستبدال، والتشخيصات والزخارف، ومفاتيح محررات الشيفرة."
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---

# المحرر

`Editor` محرر شيفرة برمجية يوفّر: تلوين الصياغة لأكثر من خمسين لغة، وأرقام الأسطر، وعدة مؤشرات إدراج، والطي، والالتفاف التلقائي للأسطر، والبحث والاستبدال، والتشخيصات والزخارف، مع اختصارات محررات الشيفرة (نقل الأسطر ونسخها، والتعليقات، والمسافات البادئة، والأقواس وعلامات الاقتباس التي تُغلق أثناء الكتابة). ويتعامل مع ملفات بأي طول: إذ تُنشأ الصفوف الظاهرة فقط، ويتابع التلوين كل تعديل سطرًا بسطر، فيتمرّر الملف الطويل ويُكتب فيه كما يحدث في الملف القصير. تمر الكتابة عبر مدخلات المنصة، لذا تعمل طرق الإدخال (pinyin وkana والمفاتيح الميتة) ولوحات المفاتيح اللمسية كما تعمل في أي حقل نصي.

يملك المحرر السلوك، ويأتي بمظهر خاص به مبني على رموز السمة: فيستخدم `font-mono` الخاص بالسمة بحجم 13pt في صفوف ارتفاعها 20pt، وأرقام الأسطر بلون `muted-foreground`، وشريطًا خافتًا بلون `muted` خلف الأسطر التي فيها مؤشر إدراج، والتحديدات بدرجة من `primary`، وأدلة المسافات البادئة بلون `border`، وألوان الصياغة المضمّنة التي تستخدمها كتل الشيفرة في [`TextView`](./text-view.md)، في الوضعين الفاتح والداكن. يأخذ كل جزء أنماط التطبيق بدل هذه القيم الافتراضية (`classes` و`styles`). في Rust يُنشأ المحرر باستخدام `nsh_base::editor()`، وفي TSX باستخدام `<Editor>` من `nsh/base`.

```rust tabs
use nsh_base::editor;
use nsh_core::prelude::*;

const MAIN: &str = "fn main() {\n    println!(\"Hello, world!\");\n}\n";

fn code() -> impl IntoElement {
    let source = signal(SharedString::from(MAIN));
    editor()
        .value(move || Some(source.get()))
        .language("rust")
        .on_change(move |value: &SharedString| source.set(value.clone()))
        .flex_1()
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Editor } from "nsh/base";

const MAIN = `fn main() {
    println!("Hello, world!");
}
`;

function App() {
  const source = signal(MAIN);
  return <Editor value={source()} onChange={({ value }) => source.set(value)} language="rust" class="flex-1" />;
}

mount(App);
```

يملأ المحرر الصندوق الذي يمنحه التطبيق إياه (`flex-1`، وارتفاع)، ويمرّر نصه داخله: عموديًا دائمًا، وأفقيًا عندما تكون الأسطر أطول من الصندوق، أو لا يمرّره إطلاقًا مع `softWrap`، حيث تلتف الأسطر الطويلة عند عرض المحرر.

<a id="the-text"></a>

## النص

- **متحكَّم به**: مرّر `value` وعيّنه من جديد في `onChange`، الذي يبلّغ بالنص الجديد كاملًا. أي `value` يغيّره التطبيق (ملف حُمِّل، أو مخرجات أداة تنسيق) يستبدل النص كتعديل واحد يتراجع عنه التراجع، وتبقى مؤشرات الإدراج والطيّات البعيدة عن موضع التغيير في أماكنها.
- **غير متحكَّم به**: مرّر `defaultValue` واقرأ النص من `onChange` أو من `value()` الخاص بالمرجع.

فواصل الأسطر هي `\n`: فكل `\r\n` و`\r` في نص وارد تصبح `\n`.

<a id="languages"></a>

## اللغات

يسمّي `language` اللغة باسمها أو باسم مستعار أو بامتداد أو باسم ملف، بأي حالة أحرف: `"rust"` و`"rs"` و`"typescript"` و`"tsx"` و`"main.go"` و`"Dockerfile"` و`"Makefile"`. وهو يحدّد التلوين، والتعليق الذي يبدّله `mod+/`، والأقواس التي تتطابق وتحدّد المسافة البادئة، والأزواج التي تغلقها الكتابة، والأحرف التي تتكوّن منها الكلمات، والمسافة البادئة الافتراضية: أربع مسافات، ومسافتان للغات الويب (JavaScript وTypeScript وJSON وHTML وCSS وYAML، ...)، وعلامات جدولة (tabs) للغة Go وملفات Makefile. ويضبط `tabSize` و`hardTabs` المسافة البادئة لكل اللغات. أي اسم آخر يُعامل كنص عادي، ما لم يسجّله التطبيق ([لغاته الخاصة](#your-own-languages)).

اللغات: Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL وDiff.

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### لغاتك الخاصة

تستطيع شيفرة Rust أن تعلّم محررات التطبيق لغات أخرى، وأن تلوّن أي لغة بملوّن خاص بها (قواعد tree-sitter، أو محلل خاص بالتطبيق). يسجّل `register_language` كائن `EditorLanguage`: اسمه وأسماؤه المستعارة وامتداداته وأسماء ملفاته، وقواعد التحرير فيه (التعليقات والأقواس والأزواج التي تغلقها الكتابة وأحرف الكلمات والمسافة البادئة)، مع `syntax` الذي يسمّي قواعد مضمّنة تُستخدم لتلوينه. ويعطي `register_highlighter` لغةً، مضمّنة أو مسجّلة، ملوّن التطبيق: نوعًا يطبّق `EditorHighlighter`، يسمع كل تعديل (الأسطر والبايتات والمواضع، كما تستقبل تعديلات tree-sitter) ويعطي رموز كل سطر (`EditorToken`، أو التقاط tree-sitter أو نطاق TextMate عبر `EditorToken::from_scope`) ضمن ميزانية زمنية، بعيدًا عن خيط واجهة المستخدم. يحتفظ المحرر بالرموز، ويحرّكها مع النص عند تعديله، ويطلبها من جديد للأسطر الظاهرة، كما يفعل مع الملوّن المضمّن. يجد `language` اللغات المسجّلة أولًا، بالاسم أو الاسم المستعار أو الامتداد أو المسار، في المحررات وعروض الفروق على حد سواء.

يحتفظ كل محرك بلغاته الخاصة. يسجّلها تطبيق Rust في جذره قبل أن يركّب محرراته؛ وتسجّلها حزمة (crate) التطبيق لتطبيق TSX في إعداد مجموعة واجهته، الذي يستدعيه أولًا كل محرك يشغّل التطبيق.

```rust
use nsh_base::editor::{EditorLanguage, register_highlighter, register_language};
use nsh_core::prelude::*;

static NIMBLE: EditorLanguage = EditorLanguage::new("Nimble")
    .extensions(&["nb"])
    .line_comment("#")
    .tab_size(2);

#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.setup(|| {
        register_language(&NIMBLE);
        register_highlighter("nimble", || Box::new(NimbleHighlighter::default()));
    });
}
```

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language="build.nb" class="flex-1" />
```

<a id="editing"></a>

## التحرير

يعمل المحرر كما تعمل محررات الشيفرة:

- **عدة مؤشرات إدراج.** النقر مع Alt (Option) يضيف مؤشرًا، ويحدّد `mod+d` التكرار التالي للتحديد، و`mod+shift+l` كل التكرارات، وتضيف مفاتيح إضافة المؤشر مؤشرًا في الصف الأعلى أو الأسفل. تعمل الكتابة والحذف والتحريك وكل أمر عند كل مؤشر؛ ويعيد Escape إلى مؤشر واحد. يعيد `undoSelection` (`cmd+u`، `ctrl+u`) إلى التحديدات التي كانت قبل آخر حركة.
- **توسيع التحديدات** بالوحدات باستخدام `expandSelection` (`ctrl+shift+cmd+right`، `shift+alt+right`): الكلمة، ومحتوى السلسلة النصية ثم السلسلة بأكملها، ومحتوى زوج الأقواس ثم الزوج، والسطر، ثم النص كله؛ ويعود `shrinkSelection` بالطريقة نفسها. يحوّل `splitSelectionIntoLines` (`shift+alt+i`) تحديدًا يمتد على عدة أسطر إلى تحديد لكل سطر.
- **المسافة البادئة.** يحافظ السطر الجديد على مسافة السطر البادئة ويضيف مستوى بعد قوس فتح (`:` في Python، و`do` في Ruby، ...)؛ والضغط على Enter بين زوج من الأقواس يضع قوس الإغلاق في سطر مستقل. يزيد Tab وينقص Shift+Tab المسافة البادئة للأسطر المحددة؛ ويعود Backspace داخل المسافات البادئة إلى موضع المسافة البادئة السابق. يوقف `autoIndent` هذا السلوك.
- **الأقواس وعلامات الاقتباس** تُغلق أثناء الكتابة، وتحيط بالتحديد، وتتخطى قوس الإغلاق عند كتابته مرة أخرى (`autoClose`). يُحاط القوس عند المؤشر وقرينه بإطار.
- **التراجع** يتراجع عن دفعات كاملة من الكتابة: كلمة، أو حذف، أو أمر. وأي حركة أو ضغطة تبدأ خطوة جديدة.
- **الطي.** السطر الذي تتبعه أسطر ذات مسافة بادئة أعمق يطويها بعلامة في الهامش: `⌄` للطي، و`›` و`⋯` بعد السطر لإلغاء الطي. والمؤشر الذي ينتقل إلى موضع مطوي يفتحه ([الطي](#folding)).
- **الضغطات.** مع المؤشر، النقرة تضع مؤشر الإدراج، والنقر المزدوج يحدّد كلمة، والنقر الثلاثي يحدّد سطرًا، والنقر مع Shift يوسّع التحديد، والسحب يحدّد بحسب ما حدّدته النقرة. والسحب مع Alt+Shift (Option+Shift؛ وControl+Alt أيضًا على Linux) يحدّد كتلة: تحديدًا لكل صف، بين العمودين نفسيهما، ويستمر بعد نهاية الأسطر القصيرة. على شاشات اللمس، اللمسة تضع المؤشر، واللمسة المزدوجة أو الضغط المطوّل يحدّد الكلمة تحت الإصبع، وتتحرك المقابض عند طرفي ذلك التحديد مع سحب الإصبع لها (ويستمر النص حولها في التمرير).
- **الحافظة.** النسخ والقص دون تحديد يأخذان الأسطر الكاملة التي عليها المؤشرات، وتُلصق هذه كأسطر كاملة فوق سطر المؤشر.

يُبقي `readOnly` النص كما هو بينما يظل محدَّدًا ويمكن البحث فيه ونسخه.

<a id="keys"></a>

## المفاتيح

تعمل مفاتيح المحرر ما دام عليه التركيز؛ وتحتفظ المدخلات الأخرى بمفاتيحها. `mod` هو Command على macOS وiOS وControl في غيرهما (ضغطات مفاتيح `keymap`).

| المفاتيح (macOS) | المفاتيح (Windows وLinux) | الأمر |
|---|---|---|
| الأسهم، مع Shift للتحديد | الأسهم، مع Shift للتحديد | التحرك بالحرف والصف |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | التحرك بالكلمة |
| `cmd+left` / `cmd+right`، `home` / `end`، `ctrl+a` / `ctrl+e` | `home` / `end` | أول حرف غير فارغ في السطر (ثم بداية السطر) / نهاية السطر |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | بداية / نهاية النص |
| `pageup` / `pagedown` | `pageup` / `pagedown` | صفحة للأعلى / للأسفل |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | حذف كلمة إلى اليسار / اليمين |
| `cmd+backspace` / `cmd+delete`، `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | الحذف حتى بداية / نهاية السطر |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`، `ctrl+y` | تراجع / إعادة |
| `cmd+a` | `ctrl+a` | تحديد الكل |
| `cmd+l` | `ctrl+l` | تحديد السطر (مرة أخرى: السطر التالي أيضًا) |
| `cmd+d` | `ctrl+d` | تحديد التكرار التالي |
| `cmd+shift+l` | `ctrl+shift+l` | تحديد كل التكرارات |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | إضافة مؤشر إدراج في الأعلى / الأسفل |
| `escape` | `escape` | العودة إلى تحديد واحد |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | نقل الأسطر للأعلى / للأسفل |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | نسخ الأسطر للأعلى / للأسفل |
| `cmd+shift+k` | `ctrl+shift+k` | حذف الأسطر |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | سطر جديد في الأسفل / الأعلى |
| `tab` / `shift+tab`، `cmd+]` / `cmd+[` | `tab` / `shift+tab`، `ctrl+]` / `ctrl+[` | زيادة / إنقاص المسافة البادئة |
| `cmd+/` | `ctrl+/` | تبديل تعليق السطر |
| `cmd+shift+\` | `ctrl+shift+\` | الانتقال إلى القوس المطابق |
| `ctrl+j` | `ctrl+j` | دمج الأسطر |
| `ctrl+t` | | تبديل الحرفين حول مؤشر الإدراج |
| `ctrl+alt+left` / `ctrl+alt+right`، مع Shift للتحديد | | التحرك بجزء من الكلمة (camelCase وsnake_case) |
| `shift+alt+a` | `shift+alt+a` | تبديل تعليق الكتلة |
| `shift+alt+i` | `shift+alt+i` | تقسيم التحديد إلى أسطر |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | توسيع / تقليص التحديد |
| `cmd+u` | `ctrl+u` | العودة إلى التحديدات السابقة |
| `cmd+g` / `cmd+shift+g`، `f3` / `shift+f3` | `f3` / `shift+f3` | البحث عن التطابق التالي / السابق |
| `cmd+e` | | البحث عن التحديد (`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | طي / إلغاء طي سطر المؤشر |
| `f12` | `f12` | الانتقال إلى التعريف عند المؤشر (`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | إجراءات الشيفرة عند التحديد (`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | نسخ / قص / لصق |

لدى macOS وiOS كذلك مفاتيح النص الخاصة بـ Cocoa: `ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` للتحريك، و`ctrl+h` / `ctrl+d` للحذف.

الأوامر التي لا مفاتيح افتراضية لها، وأوامر التطبيق الخاصة، تأخذ المفاتيح التي يربطها التطبيق باستخدام [`keymap`](../modules/nsh.md#keymap)، وتُشغَّل عبر `run` الخاص بالمرجع:

```tsx
import { keymap } from "nsh";

let editor!: EditorRef;

keymap.bind({
  "f9": () => editor.run("sortLinesAscending"),
  "mod+shift+u": () => editor.run("transformToUppercase"),
  "mod+alt+0": () => editor.run("foldAll"),
  "mod+alt+j": () => editor.run("unfoldAll"),
});
```

<a id="find-and-replace"></a>

## البحث والاستبدال

`search` هو ما يُراد العثور عليه: `{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`. تُميَّز تطابقاته، ويكون التمييز أقوى للتطابق الذي عليه التحديد، ويبلّغ `onSearchChange` بـ `{ result }`، وهو `{ count, current, error }`: عدد التطابقات، وأيها عليه التحديد (بدءًا من 0)، وسبب عدم صلاحية التعبير النمطي. يحدّد `findNext` و`findPrevious` التطابق التالي والسابق، مع الالتفاف من الطرف الآخر؛ ويستبدل `replace(text)` التطابق الحالي ويحدّد التالي، ويستبدل `replaceAll(text)` كل التطابقات كتعديل واحد ويعيد `{ count }`، أي عددها. يشير استبدال التعبير النمطي إلى مجموعاته بـ `$1` و`${name}`.

يبحث `inSelection` فقط داخل ما كان محدَّدًا عند تشغيله (أسطر المؤشرات إن لم يكن هناك تحديد): ويبقى النطاق ما دام الخيار مفعّلًا، عبر التعديلات، بينما ينتقل التحديد من تطابق إلى آخر. يبلّغ `findWithSelection` (`cmd+e` على macOS) بالنص المحدد، أو بالكلمة عند المؤشر، عبر `onFindWithSelection`، ليأخذه شريط البحث كاستعلام.

شريط البحث من صنع التطبيق:

```tsx
import { signal, Text, View } from "nsh";
import { Button, Editor, type EditorRef, type EditorSearchResult, Input } from "nsh/base";

function Find(props: { source: string; onChange: (value: string) => void }) {
  let editor!: EditorRef;
  const query = signal("");
  const replacement = signal("");
  const result = signal<EditorSearchResult>({ count: 0 });
  const status = () =>
    result().error ?? (result().current != null ? `${result().current! + 1} of ${result().count}` : `${result().count} found`);
  return (
    <View class="flex-1">
      <View class="flex-row items-center gap-2 border-b border-border p-2">
        <Input value={query()} onChange={({ value }) => query.set(value)} onSubmit={() => editor.run("findNext")} placeholder="Find" class="flex-1" />
        <Text class="text-sm text-muted-foreground">{status()}</Text>
        <Button onPress={() => editor.run("findPrevious")} class="px-2"><Text>↑</Text></Button>
        <Button onPress={() => editor.run("findNext")} class="px-2"><Text>↓</Text></Button>
        <Input value={replacement()} onChange={({ value }) => replacement.set(value)} placeholder="Replace" class="flex-1" />
        <Button onPress={() => editor.replace(replacement())} class="px-2"><Text>Replace</Text></Button>
        <Button onPress={async () => console.log("replaced", (await editor.replaceAll(replacement())).count)} class="px-2"><Text>All</Text></Button>
      </View>
      <Editor
        ref={editor}
        value={props.source}
        onChange={(e) => props.onChange(e.value)}
        language="ts"
        search={query() ? { query: query() } : undefined}
        onSearchChange={(e) => result.set(e.result)}
        class="flex-1"
      />
    </View>
  );
}
```

<a id="diagnostics"></a>

## التشخيصات

يعلّم `diagnostics` المشكلات التي يبلّغ عنها خادم اللغة أو أداة فحص الشيفرة (linter): خط تحتي رفيع متموّج تحت كل نطاق بلون درجة خطورته (`error`، `warning`، `info`، `hint`). المواضع هي أسطر وأعمدة UTF-16 تبدأ من 0، كما في خادم اللغة، فتمرّ تشخيصاته كما هي. تبقى العلامات على نصها بينما يكتب المستخدم، إلى أن يمرّر التطبيق علامات جديدة؛ أما عرض الرسائل (قائمة، أو بطاقة تظهر عند التمرير فوق السطر) فهو من شأن التطبيق.

ويحمل التشخيص أيضًا بقية `Diagnostic` الخاص بخادم اللغة. تَرسم `tags` الخاصة به نصه كما تفعل عملاء اللغة: فشيفرة `unnecessary` (متغير غير مستخدم، أو شيفرة لا يمكن الوصول إليها) تُخفَّف، وشيفرة `deprecated` يُرسم عليها خط شطب، ضمن الجزأين `unnecessaryText` و`deprecatedText`؛ أما التلميح الذي له وسم فيظهر في نصه وحده. `codeDescription.href` هي الصفحة التي تصف رمزه (مثل قاعدة فحص)، ويسرد `relatedInformation` الأماكن الأخرى التي تتحدث عنه (`{ location: { uri?, range }, message }`): يسلّم التمرير فوق التشخيص كليهما إلى التطبيق، الذي يعرضهما في بطاقته ويفتح الصفحة. يرسل خادم اللغة الوسوم كأرقام (`1`، `2`)؛ ويأخذ المحرر أسماءها.

```tsx
const problems = signal<EditorDiagnostic[]>([]);

async function lint(text: string) {
  // [{ range, severity, message, source?, code?, codeDescription?, tags?, relatedInformation? }]
  problems.set(await check(text));
}

<Editor
  value={source()}
  onChange={({ value }) => {
    source.set(value);
    lint(value);
  }}
  language="ts"
  diagnostics={problems()}
  classes={{ diagnosticWarning: "bg-orange-500", unnecessaryText: "text-zinc-400" }}
  class="flex-1"
/>
```

<a id="decorations"></a>

## الزخارف

تنسّق `decorations` نطاقات يختارها التطبيق: تلوين دلالي من خادم لغة، أو العبارة قيد التنفيذ، أو الأسطر التي غيّرتها مراجعة. يُنسّق `class` و`style` الخاصان بالزخرفة نصها؛ وينسّق `lineClass` و`lineStyle` صفوف أسطرها، خلف النص. وكما هو الحال مع التشخيصات، تبقى على نصها عبر التعديلات إلى أن يعيّن التطبيق زخارف جديدة.

```tsx
const range = (line: number, start: number, end: number) => ({ start: { line, column: start }, end: { line, column: end } });

<Editor
  value={source()}
  language="sql"
  readOnly
  decorations={[
    { range: range(4, 0, 0), lineClass: "bg-green-500/10" },
    { range: range(7, 6, 18), class: "underline text-blue-600" },
  ]}
  class="flex-1"
/>
```
<a id="gutter-and-overview-ruler-marks"></a>

### علامات الهامش وشريط النظرة العامة

تضع الخاصية `gutter` في أي تزيين (decoration) علامةً في شريط يسبق أرقام الأسطر، بجانب كل سطر يغطيه نطاقه: الأسطر التي أضافها فرق نسخ الإصدارات أو عدّلها، أو نقطة توقف (النطاق الفارغ يغطي سطره، كما في `lineClass`). مع `placement: "before"` تكون العلامة خطًا يعبر الشريط عند الحد الذي يسبق بداية النطاق، حيث حُذفت أسطر. عرض الشريط `gutterDecorationsWidth` نقطة (3 افتراضيًا) ويبقى ما دام لأي تزيين علامة في الهامش، فيحتفظ النص بمكانه كلما ظهرت العلامات واختفت. النطاق داخل طيّ يعلّم صف الطيّ.

تضع الخاصية `overviewRuler` في التزيين علامةً على شريط النظرة العامة، وهو الشريط الممتد على الحافة اليمنى للمحرر، بعرض 14 نقطة (عرض شريط التمرير؛ ويحدد الجزء `overviewRuler` عرضًا آخر)، ويُسقط النص كله على ارتفاعه، كما يفعل Monaco. ارتفاع العلامة 6 نقاط على الأقل، وتشغل `lane` من الشريط: `left` أو `center` (الافتراضي) أو `right` أو `full`. يظهر الشريط ما دام لأي تزيين علامة فيه.

تأخذ كل علامة `class` و`style` الخاصين بالتطبيق، وتُرسم بلون المقدمة من دونهما. كلتاهما تتبع التعديلات كما يتبعها نطاق التزيين؛ والتعديل الذي يحذف نطاقًا معلَّمًا يترك نطاقًا فارغًا في مكانه.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  decorations={[
    { range: range(2, 0, 0), gutter: { class: "bg-yellow-500" }, overviewRuler: { lane: "left", class: "bg-yellow-500" } },
    { range: { start: { line: 3, column: 0 }, end: { line: 5, column: 0 } }, gutter: { class: "bg-green-500" } },
    { range: range(6, 0, 0), gutter: { class: "bg-red-500", placement: "before" }, overviewRuler: { lane: "left", class: "bg-red-500" } },
  ]}
  class="flex-1"
/>
```

<a id="your-own-highlighting"></a>

### التلوين الخاص بك

يلوّن `token` في التزيين نصَّه كما يلوّن التلوين المدمج هذا النوع من الرموز (`comment`، `keyword`، `string`، `number`، `title`، `attr`، `built`، `deletion`)، بدلًا مما وجده المُلوِّن المدمج هناك: يربط مُلوِّن التطبيق نفسه (الرموز الدلالية لخادم اللغة، أو محلل خاص) رموزه بهذه الأنواع فيحصل على ألوان المحرر في الوضعين الفاتح والداكن. تفوز رموز أعمق تزيين؛ ويُطبَّق `class` و`style` فوقها. يوقف `highlighting={false}` المُلوِّن المدمج، فتلوّن رموز التطبيق النص وحدها، بينما يظل `language` يحدد التعليقات والأقواس والمسافة البادئة.

```tsx
const kinds: Record<string, EditorToken> = { keyword: "keyword", function: "title", string: "string", type: "built" };

<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  highlighting={false}
  decorations={semanticTokens().map((t) => ({ range: range(t.line, t.start, t.end), token: kinds[t.type] }))}
  class="flex-1"
/>
```

<a id="folding"></a>

## الطيّ

تبدأ الطيّات حيث تكون الأسطر ذات مسافة بادئة أعمق من السطر الذي قبلها. يعطي `foldRanges` المحرر نطاقات التطبيق نفسه بدلًا من ذلك (`{ startLine, endLine }`، وهي بشكل نطاقات الطيّ في خادم اللغة، وتمر كما هي): يُظهر السطر `startLine` الطيّ، وتُطوى الأسطر التي بعده حتى `endLine`. تبقى على أسطرها عبر التعديلات إلى أن يمرر التطبيق نطاقات جديدة.

الطيّات متداخلة: طيّ كتلة يُبقي الطيّات داخلها مطوية، فيُظهرها فتحُ الكتلة كما كانت. يطوي `foldRecursive` كتلة وكل كتلة داخلها، ويفتحها `unfoldRecursive` جميعًا، ويطوي `foldLevel(n)` كل كتلة عند مستوى التداخل `n`، ويطوي `foldSelection` (أو `foldRange(range)`) أي أسطر، أينما بدأت الطيّات. يبلغ `onFoldChange` عن النطاقات المطوية بعد كل تغيير، ويقرأ `folds()` / `setFolds(ranges)` هذه النطاقات ويستعيدها، لحفظها مع الملف.

```tsx
const ranges = signal<EditorFoldRange[]>([]);
const folded = new Map<string, EditorFoldRange[]>();

<Editor
  ref={editor}
  value={file().text}
  language={file().name}
  foldRanges={ranges()} // from the language server's textDocument/foldingRange
  onFoldChange={({ folds }) => folded.set(file().name, folds)}
  class="flex-1"
/>
<Button onPress={() => editor.foldLevel(2)}><Text>Fold the methods</Text></Button>
```

<a id="breakpoints-and-context-menus"></a>

## نقاط التوقف وقوائم السياق

يبلغ الضغط على رقم سطر عن `onLineNumberPress({ line })`، وهو مكان نقطة التوقف التي يرسمها التطبيق كتزيين. يبلغ الزر الثانوي (النقر الأيمن، أو Control+نقر على Mac) عن `onContextMenu({ position, x, y })`: الموضع في النص تحت المؤشر والنقطة في العرض الجذر، حيث يفتح التطبيق قائمته الخاصة. على شاشات اللمس يبلغ عنه أيضًا الضغط المطوّل، والنقر المزدوج، وترك المقبض، والنقر على التحديد، مع `selection`: صندوق التحديد في العرض الجذر (`{ x, y, width, height }`)، و`x` / `y` عند منتصفه العلوي، لقائمة التحرير.

```tsx
<Editor
  value={source()}
  onContextMenu={({ x, y, selection }) =>
    Menu.popup(selection ? editItems : contextItems, { x, y })
  }
/>
```

```tsx
const breakpoints = signal<number[]>([]);

<Editor
  value={source()}
  language="py"
  onLineNumberPress={({ line }) =>
    breakpoints.set(breakpoints().includes(line) ? breakpoints().filter((l) => l !== line) : [...breakpoints(), line])
  }
  decorations={breakpoints().map((line) => ({ range: range(line, 0, 0), lineClass: "bg-red-500/15" }))}
  class="flex-1"
/>
```

<a id="language-features"></a>

## ميزات اللغة

تأتي الاقتراحات ومعلومات التحويم والانتقال إلى التعريف وإجراءات الشيفرة من خادم اللغة الخاص بالتطبيق. يرسم المحرر بنفسه قائمة الإكمال والإكمال المضمَّن ورابط التعريف، بمفاتيحها؛ أما في الباقي فيعطي التطبيق اللحظات والأماكن، ويرسم التطبيق نوافذه المنبثقة (مثل [`Overlay`](./overlay.md) مثبّت على `pageBounds`).

<a id="completion"></a>

### الإكمال

مع `completion`، يطلب المحرر الاقتراحات من التطبيق ويعرضها قائمةً تحت الكلمة التي تُكتب (فوقها قرب أسفل النافذة):

- كتابة حرف أو رقم أو `_` في نهاية كلمة تطلب الاقتراحات بـ`onCompletionRequest(event)`، والمشغّل `"typing"`: لـ`event` الخاصية `id`، و`offset` و`position` الخاصان بمؤشر الكتابة، و`query` (الكلمة المكتوبة حتى الآن) والإزاحة `queryStart` التي تبدأ منها. وكل من `completionTriggerCharacters` (`["."]`، `["::", "<"]`) يطلب باستعلام فارغ بعده، والمشغّل `"character"` (و`character`)، ويطلب `showCompletions()` أو `run("showCompletions")` عند مؤشر الكتابة، والمشغّل `"invoked"`.
- يجيب التطبيق بـ`presentCompletions(event.id, items)`. كل عنصر بشكل `CompletionItem` في خادم اللغة: `label`، واختياريًا `kind` (`"function"`، `"variable"`، `"class"`، ...)، `detail`، `documentation`، `insertText`، `filterText`، `sortText` و`range`. تظهر الإجابة عن أحدث طلب؛ أما إجابة أقدم، أو إجابة عن كلمة غادرها مؤشر الكتابة، فتُهمل.
- متابعة الكتابة تصفّي القائمة في مكانها: يطابق الاستعلامُ `filterText` كل عنصر (أو تسميته إن لم يوجد) حروفًا بالترتيب، بأي حالة أحرف، وتأتي أولًا الكلمات التي تبدأ بالاستعلام، ثم الأقرب تطابقًا، ثم الترتيب حسب `sortText`. وتبرز الحروف المطابقة. مرّر `incomplete: true` (`presentCompletions(id, items, true)`) ليطلب المحرر من جديد مع متابعة الكتابة.
- السهمان للأعلى والأسفل (وControl+P / Control+N) يتنقلان في القائمة، وPage Up وPage Down بمقدار صفحة، وEnter وTab تقبلان، وEscape تغلق. يعلّم المؤشر عنصرًا، والنقر (أو اللمس على شاشات اللمس) يقبله. تظهر `documentation` العنصر المحدد بجانب القائمة.
- يستبدل القبول `range` العنصر (أو الاستعلام) بـ`insertText` (أو تسميته)، في خطوة واحدة يتراجع عنها التراجع، عند مؤشر الكتابة وعند كل مؤشر آخر له النص نفسه قبله، ويبلغ عن `onCompletionAccept({ item })`.
- تُغلق القائمة عندما يغادر مؤشر الكتابة الكلمة، وعند مسافة أو علامة ترقيم أخرى، وعندما يفقد المحرر التركيز، وعندما يخرج مؤشر الكتابة من العرض بالتمرير.

التوقف عن الكتابة (`inlineCompletionDelay`، 300 مللي ثانية افتراضيًا) من دون قائمة ظاهرة يطلب إكمالًا مضمَّنًا: `onInlineCompletionRequest({ id, offset, position })`. يعرض `presentInlineCompletion(id, text)` الخاصية `text` عند مؤشر الكتابة بلون خافت، ويدرجها Tab، ويمسحها Escape أو تعديل أو حركة.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  completion
  completionTriggerCharacters={["."]}
  onCompletionRequest={async (e) => {
    const items = await server.completion(e.position);
    editor.presentCompletions(e.id, items);
  }}
  onInlineCompletionRequest={async (e) => {
    editor.presentInlineCompletion(e.id, await assistant.suggest(e.offset));
  }}
  class="flex-1"
/>
```

<a id="hovers-and-presses"></a>

### التحويم والضغط

- `onHover(event)`: يستقر الفأرة فوق حرف من دون زر مضغوط (على سطح المكتب والويب؛ والسحب يحدد النص). لـ`event` الخاصية `position`، و`offset` بوحدات UTF-16، و`range` كلمته، و`pagePosition` المؤشر، و`pageBounds` الكلمة، و`modifiers` المضغوطة، و`diagnostics` هناك، ويعرض التطبيق رسائلها. الانتقال إلى كلمة أخرى يبلغ عن التحويم التالي فورًا.
- `onHoverEnd()`: غادر الفأرة الكلمة أو المحرر، أو تغيّر النص أو تمرر من تحته.
- `onTextPress(event)`: ضُغط على حرف، بعد أن وضع المحرر مؤشر كتابته: `{ position, offset, range,
  pagePosition, modifiers, clicks }`.
- `caretBounds()` و`rangeBounds(range)`: موضع مؤشر الكتابة ونطاق، `{ bounds, pageBounds }` (في المحرر وفي العرض الجذر): تُفتح هناك نافذة منبثقة للتطبيق.

```tsx
const hover = signal<EditorHoverEvent | null>(null);

<Editor
  ref={editor}
  value={source()}
  language="ts"
  onHover={(event) => hover.set(event)}
  onHoverEnd={() => hover.set(null)}
  class="flex-1"
/>
<If when={hover()}>
  {(event) => (
    <Overlay anchor={event().pageBounds} placement="top" class="rounded-md border border-border bg-popover p-2">
      <Text>{event().diagnostics.map((d) => d.message).join("\n") || describe(event().range)}</Text>
    </Overlay>
  )}
</If>
```

<a id="go-to-definition-and-code-actions"></a>

### الانتقال إلى التعريف وإجراءات الشيفرة

الضغط على Mod (Command على macOS وiOS، وControl في غيرهما) يحوّل الكلمات تحت الفأرة إلى روابط، كما في محررات الشيفرة:

- مع Mod مضغوطًا فوق كلمة (ضُغط والفأرة مستقرة هناك، أو انتقلت الفأرة إليها وهو مضغوط)، يطلب المحرر بـ`onDefinitionRequest(event)`، والمشغّل `"hover"`: لـ`event` الخاصية `id`، و`position` الحرف و`offset`، و`range` الكلمة. أجب بـ`presentDefinitionLink(event.id, range)` عندما يجد خادم اللغة تعريفًا: يُوضع خط تحت النطاق (الجزء `definitionLink`) ويصبح المؤشر يدًا فوقه. يزول الرابط عند ترك Mod، أو مغادرة الفأرة له، أو تغيّر النص أو تمرره، أو بـ`hideDefinitionLink()`. تظهر الإجابة عن أحدث طلب؛ أما الأقدم فتُهمل.
- النقر مع Mod على كلمة يطلب بالمشغّل `"press"`؛ وعلى الرابط يبقى مؤشر الكتابة مكانه. يطلب F12 (`goToDefinition`، `run("goToDefinition")`) الكلمة عند مؤشر الكتابة، والمشغّل `"key"`. ينتقل التطبيق إلى التعريف: `revealPosition` و`setSelections` لتعريف في النص نفسه، وتنقّله الخاص لملف آخر.
- يبلغ Mod+. (`showCodeActions`، `run("showCodeActions")`) عن `onCodeActionRequest({ range, position, bounds })`: التحديد الأساسي (البداية أولًا)، ومؤشر الكتابة وصندوقه. يسأل التطبيق خادم اللغة عن الإجراءات، ويعرض قائمته عند `bounds.pageBounds` ([`Menu`](./menu.md) أو `Overlay`)، ويطبّق تعديلات الإجراء المختار بـ`edit(edits)`.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  onDefinitionRequest={async (e) => {
    const target = await server.definition(e.position);
    if (!target) return;
    if (e.trigger === "hover") editor.presentDefinitionLink(e.id, target.originRange ?? e.range);
    else editor.revealPosition(target.range.start, true);
  }}
  onCodeActionRequest={async (e) => {
    const actions = await server.codeActions(e.range);
    const picked = await choose(actions, e.bounds?.pageBounds);
    if (picked) editor.edit(picked.edits);
  }}
  class="flex-1"
/>
```

<a id="size-and-scrolling"></a>

## الحجم والتمرير

مع `minRows` و/أو `maxRows` ينمو المحرر مع نصه: يكون بارتفاع صفوفه، `minRows` منها على الأقل، ومن `maxRows` فصاعدًا يتمرر نصه، كما في مربع رسالة أو خلية دفتر. وإلا فالتطبيق يحدد حجمه، ويتيح `scrollBeyondLastLine` تمرير النص إلى ما بعد آخر سطر: حتى شاشة (`true`، الافتراضي)، أو لا إطلاقًا (`false`)، أو عدد من الصفوف. عند تحرك مؤشر الكتابة تبقى `cursorSurroundingLines` صفوف ظاهرة حوله. سحب تحديد إلى ما بعد حواف المحرر يواصل التمرير، وبسرعة أكبر كلما ابتعد المؤشر.

يعرض `showWhitespaces` `·` لكل مسافة و`→` لكل علامة جدولة (الجزء `whitespace`)، ويرسم `rulers` خطًا عند كل عمود من أعمدته (الجزء `ruler`)، كمرشدات لطول السطر.

```tsx
<Editor
  defaultValue={message()}
  language="markdown"
  minRows={2}
  maxRows={8}
  rulers={[72]}
  showWhitespaces
/>
```

<a id="methods"></a>

## الدوال

يعطي `ref={editor}` دوال المحرر (`EditorRef`)، لأزرار التطبيق وقوائمه ومفاتيحه. الدوال التي تعيد قيمة (`value()`، `selections()`، `replaceAll()`، `canUndo()`، `caretBounds()`، `folds()`، ...) تعيد `Promise` لها في JS، فاستخدم `await` معها: `const text = await editor.value()`. الدالة التي تُعطى سطرًا بعد نهاية النص (`fold`، `scrollToLine`، `goToLine`، ...) لا تغيّر شيئًا وتسجل تحذيرًا يسمي الدالة والسطر.

| الدالة | الوصف |
|---|---|
| `focus()`، `blur()` | يأخذ التركيز، أو يتخلى عنه. |
| `value()` | `Promise<string>`: النص. |
| `setValue(value)` | يستبدل النص، كتعديل يتراجع عنه التراجع. |
| `insert(text)` | يكتب `text` عند كل تحديد كما هو (لا تُغلق الأقواس). |
| `edit(edits)` | يطبّق استبدالات `{ range, text }` (نطاقات من النص الحالي؛ ويُتخطى ما يتداخل مع سابق) كخطوة واحدة يتراجع عنها التراجع؛ وتتحرك التحديدات مع النص حولها. تُمرَّر هنا إجراءات الشيفرة وتعديلات التنسيق. |
| `selections()` | `Promise<EditorSelection[]>`: كل تحديد، `{ anchor, head }`، والأساسي (الأحدث) أخيرًا. |
| `setSelections(selections)` | يضبط التحديدات (الأخير أساسي) ويمرر التحديد الأساسي إلى العرض. |
| `run(command)` | يشغّل أمرًا، كما تفعل مفاتيحه ([الأوامر](#commands)). |
| `replace(text)` | يستبدل المطابقة الحالية ويحدد التالية. |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`: يستبدل كل مطابقة كتعديل واحد؛ `{ count }`، عددها. |
| `fold(line)`، `unfold(line)` | يطوي الأسطر تحت السطر `line` (من 0)، أو يفتحه. |
| `foldRecursive(line)`، `unfoldRecursive(line)` | يطوي الطيّ عند السطر `line` وكل طيّ داخله، أو يفتحها جميعًا. |
| `foldLevel(level)` | يطوي كل طيّ عند مستوى التداخل `level` (1: الأعلى). |
| `foldRange(range)` | يطوي أسطر `range` (`{ startLine, endLine }`)، أينما بدأت الطيّات. |
| `folds()` | `Promise<EditorFoldRange[]>`: النطاقات المطوية، بما فيها المتداخلة. |
| `setFolds(folds)` | يطوي `folds` بالضبط. |
| `scrollToLine(line)` | يمرر السطر `line` إلى العرض، ويفتح ما يخفيه. |
| `canUndo()`، `canRedo()` | `Promise<boolean>`: هل هناك تعديل للتراجع عنه، أو لإعادته. |
| `caretBounds()` | `Promise<EditorBounds \| null>`: صندوق مؤشر الكتابة الأساسي، `{ bounds, pageBounds }`، في المحرر (مع تطبيق تمريره) وفي العرض الجذر؛ `null` قبل تخطيط المحرر. |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`: صناديق `range`، واحد لكل صف يغطيه. |
| `scrollOffset()`، `setScrollOffset(offset)` | `Promise<Point>`: مقدار تمرير النص؛ يمرره إلى `{ x, y }`. |
| `visibleRange()` | `Promise<EditorRange>`: النص الذي تعرضه نافذة العرض، من بداية صفها الأول إلى نهاية صفها الأخير. |
| `selectedText()` | `Promise<string>`: نص التحديد الأساسي. |
| `offsetToPosition(offset)`، `positionToOffset(position)` | `Promise<EditorPosition>`، `Promise<number>`: بين إزاحات UTF-16 في `value()` والمواضع. |
| `revealPosition(position, center)` | يمرر `position` إلى العرض، ويفتح ما يخفيه؛ وإلى المنتصف مع `center`. |
| `goToLine(line)` | يضع مؤشر الكتابة عند بداية السطر `line` (من 0) ويمرره إلى المنتصف. |
| `showCompletions()` | يطلب الإكمال عند مؤشر الكتابة، والكلمة قبله هي الاستعلام ([الإكمال](#completion)). |
| `presentCompletions(id, items, incomplete?)` | يجيب عن طلب الإكمال `id`: تعرض القائمة `items`، مصفّاة بما كُتب منذئذ؛ ومع `incomplete`، يطلب المحرر من جديد مع متابعة الكتابة. وإذا لم تكن هناك عناصر أُغلقت القائمة. |
| `hideCompletions()` | يغلق قائمة الإكمال. |
| `presentInlineCompletion(id, text)`، `hideInlineCompletion()` | يجيب عن طلب الإكمال المضمَّن `id` بـ`text`، يظهر عند مؤشر الكتابة؛ يمسحه. |
| `presentDefinitionLink(id, range)`، `hideDefinitionLink()` | يجيب عن طلب التعريف `id` (المشغّل `"hover"`): يوضع خط تحت `range` كرابط ([الانتقال إلى التعريف](#go-to-definition-and-code-actions))؛ يخفيه. |

```tsx
let editor!: EditorRef;

<Button onPress={() => editor.run("toggleComment")}><Text>Comment</Text></Button>
<Button onPress={async () => save(await editor.value())}><Text>Save</Text></Button>
<Button onPress={async () => (await editor.canUndo()) && editor.run("undo")}><Text>Undo</Text></Button>
<Button onPress={() => editor.setSelections([{ anchor: { line: 0, column: 0 }, head: { line: 0, column: 0 } }])}>
  <Text>Go to the top</Text>
</Button>
<Editor ref={editor} value={source()} onChange={({ value }) => source.set(value)} language="rs" class="flex-1" />
```
<a id="commands"></a>

### الأوامر

يقبل `run` أوامر المحرر بأسمائها (`EditorCommand`):

| الأوامر | وظيفتها |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | نقل المؤشرات. |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | توسيع التحديدات. |
| `moveToMatchingBracket` | الانتقال إلى القوس المطابق للقوس الذي عند المؤشر. |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | تحديد. |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | النقل أو التوسيع بمقدار جزء من كلمة (أجزاء camelCase، وأجزاء snake_case). |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | النقل أو التوسيع إلى السطر الفارغ قبل الفقرة أو بعدها. |
| `expandSelection`, `shrinkSelection` | تكبير التحديدات بوحدة واحدة، أو التراجع عن ذلك. |
| `undoSelection`, `redoSelection` | العودة إلى التحديدات التي سبقت آخر حركة، أو التقدم إليها مجددًا. |
| `splitSelectionIntoLines` | تحديد واحد لكل سطر من أسطر كل تحديد. |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | إضافة مؤشر؛ والعودة إلى تحديد واحد. |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | حذف. |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | الأسطر والإزاحة والتعليقات. |
| `sortLinesAscending`, `sortLinesDescending` | فرز الأسطر المحددة (كل الأسطر عندما لا يوجد سوى مؤشر). |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | تغيير حالة أحرف التحديدات (المؤشر: كلمته). |
| `trimTrailingWhitespace` | إزالة المسافات البيضاء من نهاية كل سطر. |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | إعادة الترتيب. |
| `undo`, `redo` | التراجع والإعادة. |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | الطي عند سطر المؤشر، أو طي كل شيء. |
| `foldRecursive`, `unfoldRecursive` | طي المنطقة المطوية عند المؤشر وكل ما بداخلها، أو فتحها. |
| `foldSelection` | طي أسطر كل تحديد يمتد على عدة أسطر. |
| `findNext`, `findPrevious` | تحديد المطابقة التالية أو السابقة لـ `search`. |
| `findWithSelection` | إبلاغ شريط البحث بالنص المحدد (`onFindWithSelection`). |
| `copy`, `cut`, `paste` | الحافظة. |
| `showCompletions` | طلب اقتراحات الإكمال عند المؤشر ([الإكمال](#completion)). |
| `goToDefinition` | طلب تعريف الكلمة التي عند المؤشر (`onDefinitionRequest`، المشغّل `"key"`). |
| `showCodeActions` | طلب إجراءات الشيفرة عند التحديد (`onCodeActionRequest`). |

<a id="styling-the-parts"></a>

## تنسيق الأجزاء

يضبط `class` و`style` تنسيق صندوق المحرر. يقبل `classes` أصناف Tailwind لكل جزء، ويقبل `styles` أنماطًا مضمّنة لكل جزء؛ وتأتي أصناف الجزء بعد أنماطه الافتراضية فتتغلب عليها، وتتغلب `styles` الخاصة به على أصنافه. يُضبط الخط بواسطة `fontFamily` و`fontSize` و`lineHeight`، وبها يقيس المحرر نصه.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="tsx"
  fontFamily="JetBrains Mono"
  fontSize={14}
  lineHeight={22}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineNumber: "text-xs",
    activeLine: "bg-yellow-500/10",
    selection: "bg-blue-500/30",
  }}
  styles={{ caret: { backgroundColor: "#f59e0b", width: 3 } }}
/>
```

| الجزء | ما هو | الافتراضي |
|---|---|---|
| `gutter` | عمود أرقام الأسطر وعلامات الطي | 12pt قبل الأرقام، و4pt بعد العلامات |
| `lineNumber` | كل رقم سطر | محاذاة لليمين، `muted-foreground` |
| `activeLineNumber` | أرقام الأسطر التي فيها مؤشر، بعد `lineNumber` | `foreground` |
| `foldMarker` | علامة السطر الذي يبدأ عنده طي | `⌄`، `›` عند الطي، `muted-foreground` |
| `overviewRuler` | مسطرة النظرة العامة على الحافة اليمنى، ما دام فيها علامة لأحد الزخارف | لا شيء |
| `content` | منطقة النص بجانب الهامش | 4pt قبل النص |
| `line` | كل صف من النص | |
| `activeLine` | خلف صفوف الأسطر التي فيها مؤشر، أسفل مؤشرات التمرير | `muted`، خافت |
| `selection` | خلف النص المحدد | درجة لونية من `primary` |
| `caret` | المؤشرات | بعرض 2pt، `foreground`، وامضة |
| `composition` | النص الذي تكتبه طريقة إدخال | مسطّر |
| `searchMatch` | مطابقات `search` | كهرماني شبه شفاف |
| `currentSearchMatch` | المطابقة التي عليها التحديد، بعد `searchMatch` | كهرماني أقوى |
| `matchingBracket` | القوس الذي عند المؤشر ونظيره | حد بسماكة 1pt |
| `indentGuide` | دليل لكل مستوى إزاحة | خط بسماكة 1pt بلون `border` |
| `foldPlaceholder` | ما يظهره السطر المطوي بعد نصه | ` ⋯ `، `muted-foreground` |
| `placeholder` | يظهر ما دام النص فارغًا | `muted-foreground` |
| `diagnosticError` | الخط تحت الخطأ | `destructive` |
| `diagnosticWarning` | الخط تحت التحذير | كهرماني |
| `diagnosticInfo` | الخط تحت المعلومة | أزرق |
| `diagnosticHint` | الخط تحت التلميح | `muted-foreground` |
| `unnecessaryText` | نص تشخيص `unnecessary` | `muted-foreground` |
| `deprecatedText` | نص تشخيص `deprecated` | يتوسطه خط |
| `whitespace` | علامات المسافات والتبويبات (`showWhitespaces`) | `·` و`→`، `muted-foreground` بنسبة 60 % |
| `ruler` | خطوط `rulers` | خط بسماكة 1 point بلون `border` |
| `selectionHandle` | مقابض أطراف التحديد باللمس | نقطة بقطر 10pt بلون `primary` |
| `selectionHandleStart`، `selectionHandleEnd` | مقبض البداية (فوق سطره) ومقبض النهاية (تحته)، بعد `selectionHandle` | |
| `completionMenu` | صندوق قائمة الإكمال | `popover`، وحد `border` بسماكة 1pt، وزوايا مستديرة، وظل |
| `completionItem` | كل عنصر في القائمة | ارتفاع صف، وحشوة 8pt |
| `selectedCompletionItem` | العنصر المحدد، بعد `completionItem` | `accent` |
| `completionMatch` | حروف التسمية التي طابقها الاستعلام | سميك جزئيًا، `primary` |
| `completionDetail` | تفاصيل العنصر، بعد تسميته | محاذاة لليمين، `muted-foreground` |
| `completionKind` | نوع العنصر، قبل تسميته | اسم قصير (`fn`، `var`، `cls`)، `muted-foreground` |
| `completionDocumentation` | توثيق العنصر المحدد، بجانب القائمة | مثل `completionMenu`، بعرض لا يزيد على 320pt |
| `inlineCompletion` | الإكمال المضمّن عند المؤشر | `muted-foreground` |
| `definitionLink` | الخط تحت رابط التعريف | خط بسماكة 1pt بلون `primary` تحت النص |

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | النص، ويتحكم به التطبيق (اضبطه مجددًا من `onChange`). |
| `defaultValue` | `.default_value(..)` | `string` | | النص الأول، عندما يحتفظ المحرر بنصه بنفسه. |
| `language` | `.language(..)` | `string` | نص عادي | اسم لغة أو اسمها المستعار أو امتدادها أو اسم ملف ([اللغات](#languages)). |
| `placeholder` | `.placeholder(..)` | `string` | | يظهر ما دام النص فارغًا. |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | يمكن تحديد النص ونسخه دون تغييره. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | يأخذ التركيز عند ظهوره. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | أرقام الأسطر في الهامش. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | تلتف الأسطر الطويلة عند عرض المحرر. |
| `tabSize` | `.tab_size(..)` | `number` | حسب اللغة | عدد أعمدة التبويب ومستوى الإزاحة. |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | حسب اللغة | الإزاحة بالتبويبات. |
| `folding` | `.folding(..)` | `boolean` | `true` | تُطوى الأسطر المزاحة بعلامات الهامش. |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | حسب الإزاحة | مواضع بدء الطي، يحددها التطبيق ([الطي](#folding)). |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | تمييز الصياغة المدمج ([تمييز الصياغة الخاص بك](#your-own-highlighting)). |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | تُغلق الأقواس وعلامات الاقتباس أثناء كتابتها. |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | يحتفظ السطر الجديد بالإزاحة ويُزاح بعد قوس فتح. |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | تُمَيَّز صفوف الأسطر التي فيها مؤشر. |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | أدلة الإزاحة. |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | يتابع النص تمريره بعد سطره الأخير: حتى شاشة كاملة (`true`)، أو لا تمرير إطلاقًا (`false`)، أو بعدد الصفوف المحدد. |
| `fontFamily` | `.font_family(..)` | `string` | `font-mono` الخاص بالسمة | الخط الذي يُرسم به النص ويُقاس. |
| `fontSize` | `.font_size(..)` | `number` | `13` | حجم الخط، بالنقاط. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | ارتفاع الصف، بالنقاط. |
| `search` | `.search(..)` | `EditorSearch` | | ما يُبحث عنه ([البحث والاستبدال](#find-and-replace)). |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | المشكلات المطلوب وضع علامات عليها ([التشخيصات](#diagnostics)). |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | النطاقات التي ينسّقها التطبيق ([الزخارف](#decorations)). |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | عرض شريط علامات الزخارف في الهامش، بالنقاط. |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | أصناف Tailwind لكل جزء. |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | أنماط مضمّنة لكل جزء، تتغلب على الأصناف. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | الاسم الذي تطلقه قارئات الشاشة على المحرر. |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | تظهر المسافات والتبويبات على هيئة `·` و`→`. |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | الأعمدة التي يُرسم عندها خط عمودي. |
| `minRows` | `.min_rows(..)` | `number` | | ينمو المحرر مع نصه ابتداءً من هذا العدد من الصفوف ([الحجم والتمرير](#size-and-scrolling)). |
| `maxRows` | `.max_rows(..)` | `number` | | ينمو المحرر مع نصه حتى هذا العدد من الصفوف، ثم يبدأ التمرير. |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | عدد الصفوف التي تبقى ظاهرة فوق المؤشر وتحته. |
| `completion` | `.completion(..)` | `boolean` | `false` | يطلب المحرر الاقتراحات ويعرضها في قائمة ([الإكمال](#completion)). |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | ما الذي يطلب الإكمال أيضًا أثناء الكتابة. |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | عدد المللي ثانية التي تتوقف فيها الكتابة قبل طلب إكمال مضمّن. |
| `class`, `style` | دوال الأنماط | `string`, `StyleProp<ViewStyle>` | | صندوق المحرر. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | تغيّر النص: `{ value }`، النص الجديد كاملًا. |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | تغيّرت التحديدات: `{ selections }`، جميعها، والأساسي أخيرًا. |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | أخذ المحرر التركيز أو فقده. |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | تغيّرت مطابقات البحث: `{ result }`، من النوع `{ count, current, error }`. |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | ضُغط رقم سطر: `{ line }`، السطر، بدءًا من 0. |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | ضُغط الزر الثانوي فوق النص، أو حدّد لمس نصًا: `{ position, x, y, selection? }`. |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | يستقر الفأرة فوق حرف ([ميزات اللغة](#language-features)). |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | انتهى التمرير فوق الحرف. |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | ضُغط حرف: مع كلمته والمفاتيح المُعدِّلة وعدد النقرات. |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | نُفّذ `findWithSelection`: `{ query }`، نص استعلام شريط البحث. |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | تغيّرت النطاقات المطوية: `{ folds }`، جميعها، بما فيها المتداخلة. |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | يطلب المحرر اقتراحات الإكمال: `{ id, offset, position, query, queryStart, trigger, character? }` ([الإكمال](#completion)). |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | قُبل عنصر وأُدرج: `{ item }`. |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | توقفت الكتابة: `{ id, offset, position }`، لطلب إكمال مضمّن. |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | يطلب المحرر تعريفًا: `{ id, position, offset, range, trigger }` ([الانتقال إلى التعريف](#go-to-definition-and-code-actions)). |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | طلب المستخدم إجراءات الشيفرة: `{ range, position, bounds? }`. |

<a id="accessibility"></a>

## إمكانية الوصول

تطلق قارئات الشاشة على المحرر اسم `accessibilityLabel`؛ وتركيزه هو تركيز حقل إدخال نصي، ولذلك تعمل فيه خدمات النص في المنصة (طرق الإدخال، والإملاء، ولوحات المفاتيح على الشاشة).

<a id="related"></a>

## ذو صلة

- [TextView](./text-view.md): مستندات Markdown وHTML، وتشترك كتل الشيفرة فيها مع المحرر في ألوان الصياغة.
- [DiffView](./diff-view.md): التغييرات بين نصين، بألوان الصياغة نفسها في المحرر.
- [Input](./input.md): حقول نصية بسطر واحد وبعدة أسطر مع التحرير الأصلي للمنصة.
- [`keymap`](../modules/nsh.md#keymap): مفاتيح التطبيق لأوامر المحرر.
- [`nsh/base`](../modules/nsh-base.md): المكونات الأساسية الأخرى.
