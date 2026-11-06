---
title: "Input"
description: "حقل النص الأصلي: النص المتحكَّم به وغير المتحكَّم به، ولوحات المفاتيح، والملء التلقائي، والتحديد، والحقول متعددة الأسطر، والتركيز."
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input` هو حقل نص أصلي: UITextField (سطر واحد) أو UITextView (متعدد الأسطر) على iOS وMac Catalyst، وEditText على Android. الكتابة والمؤشر والتحديد والتصحيح التلقائي والملء التلقائي كلها من المنصة نفسها. في Rust يُنشأ بواسطة `nsh_base::input()`، وفي TSX بواسطة `<Input>` من `nsh/base`.

```rust tabs
use nsh_base::input;
use nsh_core::prelude::*;

fn name_field() -> impl IntoElement {
    let name = signal(String::new());
    input()
        .value(name)
        .on_change(move |text: &str| name.set(text.to_string()))
        .placeholder("Your name")
        .auto_capitalize(AutoCapitalize::Words)
        .return_key_type(ReturnKeyType::Done)
        .text_base()
        .p_3()
        .border_1()
        .border_color(rgb(0xd0d7de))
        .rounded(px(8.0))
}
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

function NameField() {
  const name = signal("");
  return (
    <Input
      value={name()}
      onChange={({ value }) => name.set(value)}
      placeholder="Your name"
      autoCapitalize="words"
      returnKeyType="done"
      style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 8 }}
    />
  );
}
```

<a id="controlled-and-uncontrolled"></a>

## متحكَّم به وغير متحكَّم به

- **متحكَّم به**: مرّر `value` وحدّثه في `onChange`. يستطيع التطبيق إعادة كتابة ما كتبه المستخدم (قصّه أو تنسيقه): يعرض الحقل التعديل فورًا ثم يُصحَّح عند وصول `value` الجديدة. يحمل كل تعديل أصلي عدّادًا، ويُطبَّق `value` القادم من التطبيق عندما يكون مبنيًا على آخر تعديل، لذا تتغلب الكتابة الأحدث دائمًا على التحديث البطيء.
- **غير متحكَّم به**: مرّر `defaultValue` (`.default_value(..)`، أو لا شيء) واقرأ النص من `onChange` أو `onSubmit`.

القواعد التي يجب أن تسري أثناء كتابة المستخدم هي خصائص تُعالَج أصليًا: `maxLength` يحدّ الطول، و`submitBehavior` يحدد ما يفعله زر الإدخال (return). انظر [النماذج ولوحة المفاتيح](../docs/forms-and-keyboard.md).

<a id="props"></a>

## الخصائص

إضافةً إلى [الخصائص المشتركة](./index.md#common-props) (مع `style` من النوع `TextStyle`: تنطبق الخطوط والألوان والمحاذاة وأنماط العرض):

<a id="text"></a>

### النص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | النص، يتحكم به التطبيق. |
| `defaultValue` | `.default_value(..)` | `string` | | النص الابتدائي. |
| `placeholder` | `.placeholder(..)` | `string` | | يظهر ما دام الحقل فارغًا. |
| `multiline` | `.multiline(..)` | `boolean` | `false` | عدة أسطر؛ يُدرج زر الإدخال فاصل سطر ما لم يحدد `submitBehavior` خلاف ذلك. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | شريط التمرير في الحقل المتعدد الأسطر: مؤشر المنصة، أو الشريط المضمّن في التطبيق متى ضبط التطبيق واحدًا ([Scrollbar](./scrollbar.md#built-in-bars))؛ والكائن سمة مستقلة بذاته، و`false` لا شيء. |
| `maxLength` | `.max_length(..)` | `number` | | أقصى عدد من الأحرف يستطيع المستخدم إدخاله. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | يستطيع المستخدم تحديد النص ونسخه لكن لا يستطيع تغييره. |
| `masked` | `.masked(..)` | `boolean` | `false` | النص مخفي (كلمات المرور). |
| `allowFontScaling` | | `boolean` | `true` | اتباع حجم نص النظام. |
| `maxFontSizeMultiplier` | | `number` | `0` | الحد الأعلى لمقياس النظام (القيمة 0 تعني بلا حد). |

<a id="keyboard"></a>

### لوحة المفاتيح

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | تخطيط لوحة المفاتيح ([القيم](../docs/forms-and-keyboard.md#keyboards-and-autofill)؛ يحتوي `numbers-and-punctuation` على علامة الناقص في iOS). |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | تسمية زر الإدخال. |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | الكتابة بالأحرف الكبيرة تلقائيًا. |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | تصحيحات النظام. |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | ما يحتويه الحقل، للملء التلقائي على iOS وAndroid والويب: `"username"`، `"current-password"`، `"new-password"`، `"one-time-code"`، `"email"`، `"tel"`، `"postal-code"`، `"cc-number"`، `"off"`، … |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | ما يفعله اللصق: `"insert"` يُدرج النص الملصوق، و`"report"` لا يُدرج شيئًا، ليعالج التطبيق ما يبلّغ عنه `onPaste`. لا تُدرج الصور والملفات أبدًا. |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"` (سطر واحد)، `"newline"` (متعدد الأسطر) | ما يفعله زر الإدخال: `"submit"` يبلّغ عن `onSubmit` ويُبقي التركيز، و`"blurAndSubmit"` يُزيل التركيز أيضًا، و`"newline"` يُدرج فاصل سطر (متعدد الأسطر؛ أما السطر الواحد فيُرسل). يظل الحقل المتعدد الأسطر الذي يُرسل يقبل فواصل الأسطر من Shift+Return أو Option / Alt+Return على لوحات المفاتيح الفعلية. `"submit"` يُبقي لوحة المفاتيح ظاهرة (مثلًا لإرسال عدة رسائل). |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | يأخذ التركيز عند ظهوره. |

<a id="caret-and-selection"></a>

### المؤشر والتحديد

| الخاصية | Rust | النوع | الوصف |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | يُرسم المؤشر (الافتراضي `true`؛ و`false` يخفيه). |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | التحديد المتحكَّم به، بوحدات UTF-16؛ القيمة الافتراضية لـ `end` هي `start` (مؤشر). |

يومض المؤشر ما دامت نافذته ظاهرة ونشطة. في نوافذ GPUI على Linux يبقى ظاهرًا بعد عشر ثوانٍ من دون كتابة أو تحريك، كما في تطبيقات GTK، فلا يكلّف الحقل المركَّز المتروك أي إطارات.

<a id="colors"></a>

### الألوان

ألوان النص البديل والمؤشر وتمييز التحديد هي مفاتيح أنماط، مع أصناف Tailwind الخاصة بها، وطرق في Rust (يلوّن UIKit المؤشر والتحديد بلون واحد، هو لون المؤشر إن ضُبط):

| مفتاح النمط | Rust | الصنف | الوصف |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | لون النص البديل. |
| `caretColor` | `.caret_color(..)` | `caret-*` | لون المؤشر. |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | لون تمييز التحديد. |

```rust tabs
input()
    .placeholder("Search")
    .text_color(rgb(0x18181b))
    .placeholder_color(rgb(0x9ca3af))
    .caret_color(rgb(0x2563eb))
    .selection_color(rgb(0x93c5fd))
```

```tsx tabs
<Input placeholder="Search" class="text-zinc-900 placeholder:text-zinc-400 selection:text-blue-600" />
<Input placeholder="Search" style={{ placeholderColor: "#9ca3af", caretColor: "#2563eb", selectionColor: "#93c5fd" }} />
```

### iOS

| مفتاح `ios` | Rust | النوع | الوصف |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | أسماء iOS لـ `autoComplete` (`"oneTimeCode"`، `"newPassword"`، …). |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | `nativeID` لـ `InputAccessoryView` ([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)) يظهر فوق لوحة المفاتيح ما دام الحقل مركَّزًا. |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | مظهر لوحة المفاتيح؛ `"default"` يتبع مظهر النظام. تتبع لوحات مفاتيح Android سمة النظام. |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

<a id="events"></a>

## الأحداث

| الحدث | Rust | البيانات | متى |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | غيّر المستخدم النص: `value` هو النص الآن. |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | ضُغط زر الإدخال في حقل يُرسل (سطر واحد، أو `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | لا شيء | اكتسب الحقل التركيز / فقده. |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | تحرك المؤشر أو التحديد (بوحدات UTF-16). |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | لصق المستخدم: النص، وتنسيقه بصيغة HTML (Linux، الويب)، والصور (لقطة شاشة) على شكل `File`، وعناوين URL من النوع `file:` للملفات المحلية. يقع قبل `onChange` للنص الذي يُدرجه ([النماذج ولوحة المفاتيح](../docs/forms-and-keyboard.md#pasting-images-and-files)). |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | تحرك المؤشر، مع التحديد أو مع تمرير النص أو التفافه: `bounds` هو موضعه في الحقل، و`pageBounds` موضعه في النافذة، وهو `anchor` لـ `Overlay` ([النماذج ولوحة المفاتيح](../docs/forms-and-keyboard.md#the-caret)). |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | قبل تغيّر النص: `key` هو النص المكتوب، `"Backspace"` أو `"Enter"`. |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | تغيّر حجم النص (بعرض الحقل إن كان متعدد الأسطر) أثناء كتابته؛ ويبلّغ الحقل الفارغ عن سطر فارغ واحد مهما كان نصه البديل. |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | بدأ تركيب طريقة إدخال أو تغيّر أو انتهى: `text` هو ما يجري تركيبه (البينيين قبل اختيار حرف، والكانا قبل التحويل)، و`""` عند انتهائه. يصل النص المثبَّت إلى `onChange` قبل الانتهاء. |

حقل متعدد الأسطر ينمو مع نصه:

```rust tabs
let height = signal(px(40.0));

input()
    .multiline(true)
    .on_content_size_change(move |size: &Size<Points>| {
        height.set(px((size.height.0 + 16.0).clamp(40.0, 120.0)));
    })
    .h(move || height.get())
    .px_3()
    .py_2()
```

```tsx tabs
const height = signal(40);
<Input
  multiline
  onContentSizeChange={({ size }) => height.set(Math.min(120, Math.max(40, size.height + 16)))}
  style={{ height: height(), paddingHorizontal: 12, paddingVertical: 8 }}
/>;
```

<a id="ref-methods"></a>

## طرق المرجع (Ref)

| الطريقة | Rust | الوصف |
|---|---|---|
| `focus()` | `focus()` | يركّز الحقل ويُظهر لوحة المفاتيح. |
| `blur()` | `blur()` | يُزيل التركيز عنه. |
| `setSelection(start, end?)` | `set_selection(start, end)` | يحدد `start..end` (بوحدات UTF-16)؛ ويكون مؤشرًا عندما يتساويان. |

نقل التركيز إلى الحقل التالي عند الضغط على زر الإدخال:

```rust tabs
use nsh_core::element::AutoFill;

let password = element_ref();

view()
    .child(input().return_key_type(ReturnKeyType::Next).on_submit(move |_: &str| password.focus()))
    .child(input().element_ref(&password).masked(true).auto_fill(AutoFill::Password))
```

```tsx tabs
let password!: InputRef;
<>
  <Input returnKeyType="next" onSubmit={() => password.focus()} />
  <Input ref={password} masked autoComplete="current-password" />
</>;
```

`Keyboard.dismiss()` من `nsh` (`dismiss_keyboard()` في Rust) يُخفي لوحة المفاتيح أيًّا كان الحقل الذي يحملها.

<a id="platform-notes"></a>

## ملاحظات المنصات

- على macOS، يتشارك النص ذو السطر الواحد والنصوص البديلة والمؤشرات مقاييس خط الحقل الأصلي، وتُوسَّط معًا داخل صندوق المحتوى. `lineHeight` يشارك في التخطيط؛ وتستخدمه المحررات المتعددة الأسطر أيضًا للتباعد بين الفقرات.
- تُبعَد الحقول داخل [scroll view](./scroll.md#keyboard) عن لوحة المفاتيح أصليًا. في غير ذلك استخدم حشوة سفلية أو هامشًا سفليًا بقيمة [`env(keyboard-inset-height)`](./keyboard.md).
- `disabled` يعطّل الحقل (بلا تركيز) إضافةً إلى تطبيق أنماط التعطيل؛ أما الحقل `readonly` فيحتفظ بتركيزه وتحديده.
- `inputAccessoryViewID` ينطبق على iOS، حيث تحتوي لوحة المفاتيح على شريط ملحقات.
