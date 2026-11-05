---
title: "النماذج ولوحة المفاتيح"
description: "إدخال النص باستخدام عنصر input - القيم المضبوطة وغير المضبوطة، وأنواع لوحات المفاتيح، ومفتاح الإدخال، والتركيز، والتحديد، وحقول الإدخال متعددة الأسطر القابلة للتوسع - مع إبقاء المحتوى بعيدًا عن لوحة المفاتيح البرمجية."
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---

# النماذج ولوحة المفاتيح

إدخال النص هو عنصر input، `input()` في Rust و`<Input>` في TSX: أي UITextField أو UITextView على iOS، وEditText على Android. الكتابة ومؤشر الإدراج والتحديد والتصحيح التلقائي والملء التلقائي كلها من النظام الأساسي نفسه، ويستلم تطبيقك النص عبر الأحداث ويمكنه التحكم فيه. كما يُبقي NSH الحقول المُركَّز عليها فوق لوحة المفاتيح البرمجية تلقائيًا، ويمنحك ارتفاع لوحة المفاتيح كقيمة تفاعلية للحالات التي لا يستطيع معالجتها بمفرده.

يقبل الحقل الأنماط مثل أي view (دوال أنماط مُنمَّطة بالأنواع في Rust، وأنماط وفئات Tailwind في TSX)، فتأخذ حقول النموذج مظهر تطبيقك الخاص. والحقل ذو التسمية مكوّن قصير تكتبه بنفسك:

```rust tabs
use nsh_core::prelude::*;

fn field(label: &'static str, value: Signal<String>, masked: bool) -> impl IntoElement {
    let focused = signal(false);
    view()
        .gap_1()
        .child(text(label).text_sm().text_color(rgb(0x737373)))
        .child(
            input()
                .value(move || value.get())
                .on_change(move |text: &str| value.set(text.to_owned()))
                .masked(masked)
                .on_focus(move || focused.set(true))
                .on_blur(move || focused.set(false))
                .rounded_lg()
                .border_1()
                .px_3()
                .py_2()
                .text_base()
                .border_color(move || if focused.get() { rgb(0x0969da) } else { rgb(0xd0d7de) }),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function Field(props: { label: string; value: string; onChange: (e: { value: string }) => void; masked?: boolean }) {
  const focused = signal(false);
  return (
    <View class="gap-1">
      <Text class="text-sm text-neutral-500">{props.label}</Text>
      <Input
        value={props.value}
        onChange={props.onChange}
        masked={props.masked}
        onFocus={() => focused.set(true)}
        onBlur={() => focused.set(false)}
        class="rounded-lg border px-3 py-2 text-base"
        style={{ borderColor: focused() ? "#0969da" : "#d0d7de" }}
      />
    </View>
  );
}
```

<a id="controlled-and-uncontrolled-inputs"></a>

## الحقول المتحكَّم بها وغير المتحكَّم بها

يكون الحقل **متحكَّمًا به** عندما تمرّر قيمته (`.value(..)`، وفي TSX `value`): فهو يعرض ما تحمله الإشارة (signal) لديك، وتحدّث الإشارة من حدث التغيير (`.on_change(..)`، وفي TSX `onChange`).

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let name = signal(String::new());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(8.0))
        .child(
            input()
                .value(move || name.get())
                .on_change(move |text: &str| name.set(text.to_owned()))
                .placeholder("Your name")
                .text_size(px(17.0))
                .border_1()
                .border_color(rgb(0xd0d7de))
                .rounded(px(10.0))
                .p(px(12.0)),
        )
        .child(text(move || {
            let name = name.get();
            format!("Hello, {}", if name.is_empty() { "stranger" } else { &name })
        }))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const name = signal("");
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 8 }}>
      <Input
        value={name()}
        onChange={({ value }) => name.set(value)}
        placeholder="Your name"
        style={{ fontSize: 17, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, padding: 12 }}
      />
      <Text>Hello, {name() || "stranger"}</Text>
    </View>
  );
}

mount(App);
```

ولأنك تتحكم في القيمة، يمكنك تحويل ما يكتبه المستخدم: `.on_change(move |t: &str| tag.set(t.to_uppercase()))` يحوّل الأحرف إلى كبيرة، و`onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` يُبقي الأرقام فقط.

<a id="input-methods"></a>

### طرق الإدخال

تؤلّف طرق الإدخال الصينية واليابانية والكورية النص قبل تثبيته: يتحول البينيين (pinyin) إلى 腾 بعد اختيار الحرف. يبلّغ `onCompositionChange` (في Rust `.on_composition_change(..)`) عن التأليف أثناء حدوثه، `{ composing: true, text: "teng" }` أثناء كتابة المستخدم و`{ composing: false, text: "" }` عند انتهائها، ويصل النص المثبَّت إلى `onChange` قبل الانتهاء. على iOS وAndroid وmacOS وweb يبلّغ `onChange` أيضًا عن النص قيد التأليف، لأن هذه الأنظمة تحتفظ به داخل الحقل؛ أما على Windows وLinux وGPUI فيبلّغ عن النص المثبَّت. يُبقي الحقل المتحكَّم به التأليف مستمرًا مهما فعل التطبيق بالقيمة: فالقيمة `value` المضبوطة أثناء تأليف المستخدم تظهر بعد انتهاء التأليف، ولذلك يستقبل الحقل الذي يحوّل نصه إلى أحرف كبيرة أو يفلتره البينيين كما كُتب.

مربع بحث يبحث في النص المثبَّت فقط:

```rust tabs
let query = signal(String::new());
let composing = signal(false);
input()
    .value(move || query.get())
    .on_change(move |text: &str| {
        query.set(text.to_owned());
        if !composing.get() {
            search(text);
        }
    })
    .on_composition_change(move |e: &Composition| {
        composing.set(e.composing);
        if !e.composing {
            search(&query.get());
        }
    })
```

```tsx tabs
const query = signal("");
let composing = false;
<Input
  value={query()}
  onChange={({ value }) => {
    query.set(value);
    if (!composing) search(value);
  }}
  onCompositionChange={(e) => {
    composing = e.composing;
    if (!e.composing) search(query());
  }}
/>
```

يكون الحقل **غير متحكَّم به** عندما لا تعطيه قيمة: فهو يحتفظ بنصه الخاص، ويبدأ من قيمته الافتراضية (`.default_value(..)`، وفي TSX `defaultValue`)، وتقرأ النص من حدث التغيير أو الإرسال عند الحاجة. استخدم هذا للحقول التي تقرؤها عند الإرسال فقط، مثل كلمة المرور.

> [!NOTE]
> لا يفقد الحقل المتحكَّم به أي ضغطة مفتاح. يحمل كل تعديل أصلي عدّاد تعديلات، ولا تُطبَّق قيمة `value` العائدة من JS إلا إذا كانت ردًّا على آخر تعديل. فإذا كان JS بطيئًا وكتب المستخدم المزيد في هذه الأثناء، تُهمَل القيمة القديمة بدلًا من أن تحل محل النص الأحدث.

<a id="props"></a>

## الخصائص

في Rust، كل خاصية (prop) هي دالة في `input()` باسم بصيغة snake case (`.placeholder(..)`، `.masked(true)`، `.max_length(6)`، `.return_key_type(ReturnKeyType::Next)`، `.selected_range((0, 4))`)، مع هذه الأسماء الخاصة: `.keyboard_type(KeyboardType::Email)` وبقية متغيرات `KeyboardType`، و`.auto_fill(AutoFill::Email)` لـ`autoComplete`، و`.keyboard_appearance(..)` و`.input_accessory(..)` لخصائص `ios={{ … }}`. وكل حدث هو دالة في `on_`: `.on_change(|text: &str| ..)`، `.on_submit(|text: &str| ..)`، `.on_focus(..)`، `.on_blur(..)`، `.on_selection_change(|s: &Selection| ..)`، `.on_key_press(|key: &str| ..)`، `.on_content_size_change(|size: &Size<Points>| ..)`.

| الخاصية | النوع | الافتراضي | الوصف |
|---|---|---|---|
| `value` | `string` | | النص، ويتحكم به JS. |
| `defaultValue` | `string` | | النص الابتدائي لحقل غير متحكَّم به. |
| `placeholder` | `string` | | يظهر ما دام الحقل فارغًا. |
| `masked` | `boolean` | `false` | يخفي النص (كلمات المرور). |
| `keyboardType` | `KeyboardType` | `"default"` | تخطيط لوحة المفاتيح. |
| `returnKeyType` | `ReturnKeyType` | `"default"` | تسمية زر الإدخال (return). |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | الأحرف الكبيرة التلقائية. |
| `autoCorrect` | `boolean` | `true` | تصحيحات النظام. |
| `autoComplete` | `AutoComplete` | | ما يحتويه الحقل، للملء التلقائي. |
| `multiline` | `boolean` | `false` | عدة أسطر؛ يُدرج زر الإدخال فاصل سطر ما لم يحدد `submitBehavior` غير ذلك. |
| `maxLength` | `number` | | أقصى عدد من الأحرف يمكن للمستخدم إدخاله. |
| `readonly` | `boolean` | `false` | يستطيع المستخدم تحديد النص ونسخه لكن لا يستطيع تغييره. |
| `autoFocus` | `boolean` | `false` | يُركَّز عليه عند ظهوره. |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | سطر واحد `"blurAndSubmit"`، متعدد الأسطر `"newline"` | ما يفعله زر الإدخال: إرسال مع إبقاء التركيز، أو إرسال مع إزالة التركيز، أو إدراج فاصل سطر (للحقول متعددة الأسطر فقط). |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | ما يفعله اللصق: إدراج نصه، أو لا شيء ([اللصق](#pasting-images-and-files)). |
| `caret` | `boolean` | `true` | يُرسم المؤشر؛ و`false` يخفيه. |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | مظهر لوحة المفاتيح (iOS). |
| `selectedRange` | `{ start: number; end?: number }` | | التحديد المتحكَّم به، بوحدات UTF-16. |
| `allowFontScaling` | `boolean` | `true` | اتباع حجم نص النظام. |
| `maxFontSizeMultiplier` | `number` | | الحد الأعلى لمقياس النظام (0: بلا حد). |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS: الشريط الظاهر فوق لوحة المفاتيح (انظر أدناه). |
| `ios={{ textContentType }}` | `TextContentType` | | أسماء iOS لقيم `autoComplete`. |

الأحداث:

| الحدث | البيانات المرسلة | متى |
|---|---|---|
| `onChange` | `{ value }` | تغيّر النص: `value` هو النص الآن. |
| `onSubmit` | `{ text }` | ضُغط زر الإدخال في حقل يرسل (سطر واحد، أو `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | | حصل الحقل على التركيز / فقده. |
| `onSelectionChange` | `{ start, end }` | تحرك المؤشر أو التحديد (بوحدات UTF-16). |
| `onPaste` | `{ text, html, files, uris }` | لصق المستخدم: النص، وHTML الخاص به (Linux وweb)، والصور على هيئة `File`، وعناوين URL للملفات المحلية ([اللصق](#pasting-images-and-files)). |
| `onCaretMove` | `{ bounds, pageBounds }` | تحرك المؤشر: موضعه في الحقل وفي النافذة ([المؤشر](#the-caret)). |
| `onKeyPress` | `{ key }` | قبل تغيّر النص: `key` هو النص المكتوب، `"Backspace"` أو `"Enter"`. |
| `onContentSizeChange` | `{ size }` | تغيّر حجم النص (`size`) (بعرض الحقل عندما يكون متعدد الأسطر) أثناء الكتابة؛ ويبلّغ الحقل الفارغ عن سطر فارغ واحد مهما كان نص placeholder. |
| `onCompositionChange` | `{ composing, text }` | بدأ تأليف طريقة إدخال أو تغيّر أو انتهى (انظر [طرق الإدخال](#input-methods)). |

يُنمَّط الحقل مثل النص: `fontSize`، `color`، `fontFamily`، `textAlign`، `letterSpacing` وبقية [أنماط النص](./text.md)، إضافةً إلى الحدود والحشو والخلفيات. ويُطبَّق نمط التركيز (`.focus(|s| ..)` في Rust، أو متغير Tailwind ‏`focus:` أو `focusStyle` في TSX) ما دام الحقل مركَّزًا عليه. لون placeholder هو `.placeholder_color(..)` (مفتاح النمط
`placeholderColor`، `placeholder:text-*`)، ولون المؤشر `.caret_color(..)` (`caretColor`، `caret-*`)، ولون تمييز التحديد `.selection_color(..)`
(`selectionColor`، `selection:text-*`)؛ يلوّن UIKit المؤشر والتحديد بلون واحد، هو لون المؤشر إذا حُدِّد:

```rust tabs
input()
    .placeholder("Search")
    .rounded_lg()
    .border_1()
    .border_color(rgb(0xd4d4d8))
    .px_3()
    .py_2()
    .text_base()
    .focus(|s| s.border_color(rgb(0x3b82f6)))
    .placeholder_color(rgb(0xa1a1aa))
    .selection_color(rgb(0x2563eb))
```

```tsx tabs
<Input
  class="rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-blue-500 placeholder:text-zinc-400 selection:text-blue-600"
  placeholder="Search"
/>
```

<a id="keyboards-and-autofill"></a>

## لوحات المفاتيح والملء التلقائي

يحدد نوع لوحة المفاتيح (`.keyboard_type(..)`، وفي TSX `keyboardType`) التخطيط:

| Rust | TSX | لوحة المفاتيح |
|---|---|---|
| `KeyboardType::Default` | `"default"` | نص. |
| `KeyboardType::Email` | `"email-address"` | نص مع `@` و`.` في المتناول. |
| `KeyboardType::Url` | `"url"` | نص مع `/` و`.com`. |
| `KeyboardType::Number` | `"number-pad"` | أرقام فقط: بلا إشارة ولا فاصل عشري (الرموز، أرقام PIN). |
| `KeyboardType::Decimal` | `"decimal-pad"` | أرقام وفاصل عشري. |
| `KeyboardType::Numeric` | `"numeric"` | كما في React Native: لوحة الأرقام العشرية في iOS؛ وعلى Android أرقام مع إشارة وفاصل عشري. |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | أرقام وعلامة ناقص وعلامات ترقيم (لوحة الأرقام وعلامات الترقيم في iOS؛ وعلى Android أرقام مع إشارة وفاصل عشري). استخدمها للأرقام السالبة على iOS. |
| `KeyboardType::Phone` | `"phone-pad"` | لوحة اتصال هاتفية. |

على iOS يمنح `.keyboard_appearance(KeyboardAppearance::Dark)` (وفي TSX `ios={{ keyboardAppearance: "dark" }}`؛ أو light، وهو الافتراضي) لوحة المفاتيح مظهرًا فاتحًا أو داكنًا بغض النظر عن مظهر النظام، لتطبيق داكن في الوضع الفاتح. أما لوحات مفاتيح Android فتتبع سمة النظام دائمًا.

يخبر الملء التلقائي (`.auto_fill(AutoFill::Email)`، وفي TSX `autoComplete`) النظام بما يحتويه الحقل، فيقترح الأسماء والعناوين وكلمات المرور المحفوظة ورموز المرور لمرة واحدة من الرسائل. يحتوي `AutoFill` في Rust على متغير لكل نوع (`Name`، `GivenName`، `FamilyName`، `Email`، `Tel`، `Username`، `Password`، `NewPassword`، `OneTimeCode`، `StreetAddress`، `PostalCode`، `Country`، `CreditCardNumber`، `Url`، `Birthdate`، ...، و`Off`). ويقبل TSX هذه القيم: `"name"`، `"given-name"`، `"family-name"`، `"email"`، `"tel"`، `"username"`، `"current-password"`، `"new-password"`، `"one-time-code"`، `"street-address"`، `"postal-code"`، `"country"`، `"cc-number"`، `"cc-exp"`، `"cc-csc"`، `"url"`، `"birthdate-full"` وغيرها، أو `"off"`؛ كما تُقبل أسماء iOS نفسها (`"emailAddress"`، `"oneTimeCode"`، ...) في `autoComplete` أو `ios={{ textContentType }}`.

```rust tabs
use nsh_core::element::AutoFill;

input()
    .keyboard_type(KeyboardType::Email)
    .auto_capitalize(AutoCapitalize::None)
    .auto_correct(false)
    .auto_fill(AutoFill::Email)
    .placeholder("E-mail")
input().masked(true).auto_fill(AutoFill::NewPassword).placeholder("Password")
input()
    .keyboard_type(KeyboardType::Number)
    .auto_fill(AutoFill::OneTimeCode)
    .max_length(6)
    .placeholder("Code")
```

```tsx tabs
<Input keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" placeholder="E-mail" />
<Input masked autoComplete="new-password" placeholder="Password" />
<Input keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="Code" />
```

<a id="the-return-key-and-moving-between-fields"></a>

## زر الإدخال والانتقال بين الحقول

يضع نوع زر الإدخال (`.return_key_type(ReturnKeyType::Next)`، وفي TSX `returnKeyType`) تسمية على الزر: default أو done أو go أو next أو search أو send. ويحدد سلوك الإرسال (`.submit_behavior(..)`، وفي TSX `submitBehavior`) ما يفعله الضغط عليه:

| Rust | TSX | زر الإدخال | الافتراضي لـ |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | يُطلق حدث الإرسال، ثم يفقد الحقل التركيز | الحقول ذات السطر الواحد |
| `SubmitBehavior::Submit` | `"submit"` | يُطلق حدث الإرسال؛ ويبقى التركيز على الحقل | |
| `SubmitBehavior::Newline` | `"newline"` | يُدرج فاصل سطر (للحقول متعددة الأسطر فقط) | الحقول متعددة الأسطر |

الحقل متعدد الأسطر مع `"submit"` أو `"blurAndSubmit"` يرسل عند الضغط على زر الإدخال، كما تفعل خانات كتابة المحادثات، ويظل يلتف أسطره؛ وعلى لوحة مفاتيح فعلية (أجهزة سطح المكتب، وMac، ولوحة مفاتيح جهاز لوحي) يُدرج Shift+Return أو Option / Alt+Return فاصل سطر. أما زر الإدخال الذي يثبّت تأليف طريقة إدخال (مثل الإدخال الصيني أو الياباني) فيثبّته فقط ولا يرسل أبدًا.

للانتقال إلى الحقل التالي، احتفظ بمراجع (refs) إلى الحقول (`element_ref()` و`.element_ref(&r)` في Rust، `ref` في TSX) واستدعِ `focus()`:

```rust tabs
use nsh_core::prelude::*;

pub fn sign_in() -> impl IntoElement {
    let email = signal(String::new());
    let password = element_ref();
    let submit = move || log::info!("sign in {}", email.get());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(12.0))
        .child(
            input()
                .value(move || email.get())
                .on_change(move |t: &str| email.set(t.to_owned()))
                .keyboard_type(KeyboardType::Email)
                .auto_capitalize(AutoCapitalize::None)
                .return_key_type(ReturnKeyType::Next)
                .submit_behavior(SubmitBehavior::Submit)
                .on_submit(move |_: &str| password.focus())
                .placeholder("E-mail"),
        )
        .child(
            input()
                .element_ref(&password)
                .masked(true)
                .return_key_type(ReturnKeyType::Go)
                .on_submit(move |_: &str| submit())
                .placeholder("Password"),
        )
}
```

```tsx tabs
import { type InputRef, mount, signal, View } from "nsh";
import { Input } from "nsh/base";

function SignIn() {
  const email = signal("");
  let password!: InputRef;
  const submit = () => console.log("sign in", email());
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12 }}>
      <Input
        value={email()}
        onChange={({ value }) => email.set(value)}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmit={() => password.focus()}
        placeholder="E-mail"
      />
      <Input ref={password} masked returnKeyType="go" onSubmit={submit} placeholder="Password" />
    </View>
  );
}

mount(SignIn);
```

الإرسال دون إزالة التركيز (`SubmitBehavior::Submit`، `submitBehavior="submit"`) على الحقل الأول يُبقي لوحة المفاتيح ظاهرة أثناء انتقال التركيز، فلا تختفي ثم تظهر من جديد. وحقل محادثة يرسل عند الضغط على زر الإدخال ويبقى مركَّزًا عليه يرسل بالطريقة نفسها (انظر خانة الكتابة [أدناه](#content-outside-scroll-views)).

يُفرض كل من الحد الأقصى للطول وسلوك الإرسال أصليًا: يسأل النظام الأساسي «هل يجوز إضافة هذا الحرف؟» و«هل ينبغي أن ينهي زر الإدخال التحرير؟» أثناء كتابة المستخدم، ويجيب NSH من الخصائص دون انتظار JS.

<a id="focus-from-code"></a>

## التركيز من الشيفرة

لمرجع الحقل ما يلي:

| Rust | TSX | الوصف |
|---|---|---|
| `focus()` | `focus()` | يركّز على الحقل ويُظهر لوحة المفاتيح. |
| `blur()` | `blur()` | يزيل التركيز عنه. |
| `set_selection(start, end)` | `setSelection(start, end?)` | يحدد `start..end` (بوحدات UTF-16)؛ ويكون مؤشرًا عندما يتساويان (في TSX: دون `end`). |

على macOS وweb، يحرّك `focus()` و`blur()` على مرجع view يقبل الضغطات تركيز لوحة المفاتيح كما يفعل Tab ([تركيز لوحة المفاتيح](../elements/index.md#keyboard-focus)).

يزيل `dismiss_keyboard()` في Rust و`Keyboard.dismiss()` من `nsh` في TSX التركيز عن أي حقل مركَّز عليه:

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## التحديد

يبلّغ حدث التحديد (`.on_selection_change(..)`، وفي TSX `onSelectionChange`) عن المؤشر والتحديد؛ ويضبطهما `set_selection` الخاص بالمرجع أو النطاق المحدد (`.selected_range(..)`، وفي TSX `selectedRange`). المواضع هي وحدات شيفرة UTF-16، كما هي فهارس السلاسل في JavaScript، ولذلك فإن `text.slice(start, end)` في TSX هو النص المحدد؛ وفي Rust اقتطع وحدات UTF-16 من النص.

```rust tabs
/// `start..end` of `text` in UTF-16 units, as inputs count.
fn utf16_slice(text: &str, start: u32, end: u32) -> String {
    let units: Vec<u16> = text.encode_utf16().collect();
    let end = (end as usize).min(units.len());
    String::from_utf16_lossy(&units[(start as usize).min(end)..end])
}

let content = signal("Select part of this text".to_owned());
let range = signal(Selection::default());
let field = element_ref();

view()
    .child(
        input()
            .element_ref(&field)
            .value(move || content.get())
            .on_change(move |t: &str| content.set(t.to_owned()))
            .on_selection_change(move |r: &Selection| range.set(*r)),
    )
    .child(text(move || {
        let r = range.get();
        format!("Selected: \"{}\"", content.with(|t| utf16_slice(t, r.start, r.end)))
    }))
    .child(
        view()
            .on_press(move || {
                let len = content.with(|t| t.encode_utf16().count()) as u32;
                field.set_selection(0, len);
            })
            .child(text("Select all")),
    )
```

```tsx tabs
const text = signal("Select part of this text");
const range = signal({ start: 0, end: 0 });
const selection = signal<{ start: number; end?: number } | undefined>(undefined);

<Input
  value={text()}
  onChange={({ value }) => text.set(value)}
  selectedRange={selection()}
  onSelectionChange={(r) => range.set(r)}
/>
<Text>Selected: "{text().slice(range().start, range().end)}"</Text>
<View onPress={() => selection.set({ start: 0, end: text().length })}><Text>Select all</Text></View>
```

<a id="the-caret"></a>

## المؤشر

يخبر حدث المؤشر (`.on_caret_move(..)`، وفي TSX `onCaretMove`) بموضع المؤشر، حتى يمكن فتح ما يخصّ موضعه هناك: اقتراحات لإشارة `@`، أو قائمة أمر مائل (slash command)، أو منتقي إيموجي. `bounds` هو `Bounds`
في الحقل (`origin` و`size`، مع تطبيق حشو الحقل وتمريره)، بعرض ما يرسمه النظام الأساسي
للمؤشر وبارتفاع سطره؛ أما `pageBounds` فهو الصندوق نفسه في النافذة (أو في الحوار الذي يوجد فيه الحقل)، وتأخذه
طبقة علوية (overlay) على أنه `anchor`. يصل الحدث ما دام الحقل مركَّزًا عليه، كلما تحرك المؤشر: مع
التحديد، وعندما يتمرر نص الحقل أو يلتف على أسطر أخرى. وفي Rust توضع الطبقة العلوية قياسًا إلى صندوق
باستخدام `.anchor_bounds(..)`.

```rust tabs
let draft = signal(String::new());
let end = signal(0u32);
let caret = signal(None::<Bounds<Points>>);

view()
    .child(
        input()
            .multiline(true)
            .value(move || draft.get())
            .on_change(move |t: &str| draft.set(t.to_owned()))
            .on_selection_change(move |s: &Selection| end.set(s.end))
            .on_caret_move(move |e: &CaretEvent| {
                // Suggestions while the word before the caret starts with "@".
                let typed = draft.with(|t| utf16_slice(t, 0, end.get()));
                let word = typed.rsplit(char::is_whitespace).next().unwrap_or("");
                caret.set(word.starts_with('@').then_some(e.page_bounds));
            })
            .p_2(),
    )
    .child(when(
        move || caret.get().is_some(),
        move || {
            overlay()
                .anchor_bounds(move || caret.get().unwrap_or_default())
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(4.0))
                .child(text("@ada"))
                .child(text("@grace"))
        },
    ))
```

```tsx tabs
import { type Bounds, Overlay, Text, View, signal } from "nsh";
import { Input } from "nsh/base";

const draft = signal("");
const end = signal(0);
const caret = signal<Bounds | null>(null);

<View>
  <Input
    multiline
    value={draft()}
    onChange={({ value }) => draft.set(value)}
    onSelectionChange={(e) => end.set(e.end)}
    onCaretMove={(e) => {
      // Suggestions while the word before the caret starts with "@".
      const word = draft().slice(0, end()).split(/\s/).pop() ?? "";
      caret.set(word.startsWith("@") ? e.pageBounds : null);
    }}
    class="p-2"
  />
  <If when={caret()}>
    <Overlay anchor={caret()} placement="bottom" align="start" offset={4}>
      <Text>@ada</Text>
      <Text>@grace</Text>
    </Overlay>
  </If>
</View>;
```

`pageBounds` هو موضع المؤشر عند وصول الحدث: فالصفحة التي تتمرر تحت الحقل تحرّك الحقل
لكنها لا ترسل حدثًا، ولذلك أغلق الاقتراحات عندما تتمرر، أو ثبّتها على الحقل نفسه.

<a id="pasting-images-and-files"></a>

## لصق الصور والملفات

يخبر حدث اللصق (`.on_paste(..)`، وفي TSX `onPaste`) بما لصقه المستخدم، سواء من اختصار لوحة المفاتيح، أو من
أمر «لصق» في قائمة، أو من صورة في لوحة مفاتيح: `text` و`html` و`files` و`uris`. `html` هو المحتوى نفسه مع تنسيقه، كما نسخه
متصفح أو حزمة مكتبية أو محرر نصوص منسّقة (على Linux وweb). `files` هي ما احتوته الحافظة على هيئة بيانات، مثل
لقطة شاشة أو صورة منسوخة من صفحة أو من تطبيق آخر: عناصر `File` يستطيع التطبيق رفع بايتاتها أو عرضها، وتسمى
`image.png` (أو بالنوع الذي هي عليه). `uris` هي عناوين `file:` للملفات المنسوخة في مدير ملفات، كما في إسقاط ملف.
يقرأ النظام الأساسي الحافظة لحظة اللصق، ولا يقرؤها إلا حينها.

يُدرج الحقل النص الملصوق بنفسه، كما يفعل دائمًا: ويصل الحدث قبل `onChange` الخاص بذلك النص.
أما الصور والملفات فلا تُدرج أبدًا، لأن الحقل يحمل نصًا. ومع `pasteBehavior` `"report"` لا يُدرج الحقل
شيئًا، ويقرر التطبيق ما يفعله اللصق: إرسال نص طويل كمرفق، أو إدراج نسخة منقّحة.
يقرر الحقل ذلك فورًا، من الخاصية، لأن النظام يسأله في اللحظة نفسها.

```rust tabs
let attachments = signal(Vec::<PastedFile>::new());

input()
    .multiline(true)
    .placeholder("Message")
    .on_paste(move |e: &PasteEvent| {
        // A screenshot pasted into the message goes along as an image.
        attachments.update(|a| a.extend(e.files.iter().cloned()));
    })
    .p_2()
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

const attachments = signal<File[]>([]);

<Input
  multiline
  placeholder="Message"
  onPaste={(e) => {
    // A screenshot pasted into the message goes along as an image.
    attachments.update((a) => [...a, ...e.files]);
  }}
  class="p-2"
/>;
```

ارفع الملف الملصوق كأي `File`، باستخدام `fetch` و`FormData` (`form.append("image", file)`)؛ وتبقى بايتاته
أصلية إلى أن تُرسل. على Android، تبلّغ لوحات المفاتيح التي تُدرج الصور (GIF والملصقات) عنها بالطريقة نفسها. وعلى
Linux تُقرأ الحافظة بشكل غير متزامن، فقد يصل الحدث بعد `onChange` الخاص بالنص الذي يُدرجه.
تحتفظ الحقول المقنَّعة على macOS بلصق AppKit الخاص ولا تبلّغ عن شيء.

<a id="multiline-inputs-that-grow"></a>

## الحقول متعددة الأسطر التي تنمو

يمرّر الحقل متعدد الأسطر (`.multiline(true)`، وفي TSX `multiline`) نصه داخل ارتفاعه الخاص. ولتنميته مع محتواه، أعِد ارتفاع حدث حجم المحتوى (`.on_content_size_change(..)`، وفي TSX `onContentSizeChange`) إلى نمطه، مع حد أقصى:

```rust tabs
let height = signal(px(0.0));

input()
    .multiline(true)
    .placeholder("Write a comment")
    .on_content_size_change(move |e: &Size<Points>| height.set(e.height.min(px(120.0))))
    .text_size(px(16.0))
    .p(px(10.0))
    .border_1()
    .border_color(rgb(0xd0d7de))
    .rounded(px(10.0))
    .h(move || height.get().max(px(20.0)) + px(20.0))
```

```tsx tabs
const height = signal(0);

<Input
  multiline
  placeholder="Write a comment"
  onContentSizeChange={({ size }) => height.set(Math.min(size.height, 120))}
  style={{ fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, height: Math.max(height(), 20) + 20 }}
/>
```

الارتفاع المُبلَّغ عنه هو ارتفاع النص (بعرض الحقل)، لذا أضف الحشو العمودي بنفسك، كما في الأعلى.
<a id="keeping-inputs-above-the-keyboard"></a>

## إبقاء حقول الإدخال فوق لوحة المفاتيح

<a id="inside-scroll-views-automatic"></a>

### داخل عروض التمرير: تلقائي

عندما تظهر لوحة المفاتيح فوق حقل إدخال ذي تركيز موجود داخل عرض تمرير أو قائمة، يمنح NSH عرض التمرير هامشًا داخليًا سفليًا بارتفاع لوحة المفاتيح ويمرّر حقل الإدخال إلى مجال الرؤية. هذا يتم أصليًا ولا يحتاج إلى أي شيفرة. النموذج الطويل ليس سوى عرض تمرير يضم حقول إدخال:

```rust tabs
scroll()
    .flex_1()
    .keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)
    .keyboard_taps(KeyboardTaps::Handled)
    .child(view().p(px(16.0)).gap(px(12.0)) /* inputs */)
```

```tsx tabs
<Scroll style={{ flex: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
  <View style={{ padding: 16, gap: 12 }}>
    {/* inputs */}
  </View>
</Scroll>
```

يتيح وضع الإغلاق (`.keyboard_dismiss_mode(..)`، وفي TSX `keyboardDismissMode`: none وon drag وinteractive) أن يؤدي سحب النموذج إلى إخفاء لوحة المفاتيح، بينما تتيح النقرات المعالَجة (`.keyboard_taps(KeyboardTaps::Handled)`، وفي TSX `keyboardShouldPersistTaps="handled"`) أن تصل النقرة على زر أثناء ظهور لوحة المفاتيح بدلًا من أن تقتصر على إغلاقها. راجع [التمرير](./scrolling.md#scroll-views-and-the-keyboard).

<a id="content-outside-scroll-views"></a>

### المحتوى خارج عروض التمرير

على iOS، عندما تغطي لوحة المفاتيح حقل إدخال ذا تركيز لا يوجد داخل أي عرض تمرير، يرفع NSH محتوى شاشته (أو مربع حواره) إلى أن يصبح حقل الإدخال فوق لوحة المفاتيح مباشرة، وفق منحنى حركة لوحة المفاتيح، ثم يعيده إلى الأسفل عندما تختفي لوحة المفاتيح أو يفقد الحقل التركيز، كما يفعل SwiftUI (وعلى Android يقوم النظام بإزاحة النافذة التي تعمل بوضع `adjustPan`). ولا يفعل ذلك إلا لما يبقى مغطى بعد تخطيط التطبيق نفسه: التطبيق الذي يوفر المساحة بنفسه، كما يلي، لا يُزاح مرة أخرى.

وهذا يحرّك الصفحة كلها. أما شريط الرسائل المثبّت أسفل الشاشة فينبغي أن يرتفع مع لوحة المفاتيح بينما يتقلص المحتوى فوقه: أضف إلى أسفل الشاشة حشوة بقيمة `env(keyboard-inset-height)` في CSS (`paddingBottom: "env(keyboard-inset-height)"`، وفي Tailwind `pb-[env(keyboard-inset-height)]`، وفي Rust `.pb_keyboard()`)، فهي توفّر مساحة في الأسفل بارتفاع لوحة المفاتيح، وتتحرك بتحريك أصلي متزامن مع لوحة المفاتيح.

```rust tabs
use nsh_core::prelude::*;

pub fn chat_screen() -> impl IntoElement {
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get();
        if !text.trim().is_empty() {
            log::info!("send {text}");
        }
        draft.set(String::new());
    };
    view()
        .flex_1()
        .pb_keyboard()
        .child(scroll().flex_1().keyboard_dismiss_mode(KeyboardDismissMode::Interactive) /* messages */)
        .child(
            view()
                .flex_row()
                .p(px(8.0))
                // Above the home indicator, unless the keyboard covers it.
                .pb(move || {
                    px(8.0) + if keyboard_height() > px(0.0) { px(0.0) } else { safe_area().bottom }
                })
                .child(
                    input()
                        .value(move || draft.get())
                        .on_change(move |t: &str| draft.set(t.to_owned()))
                        .multiline(true)
                        .submit_behavior(SubmitBehavior::Submit)
                        .return_key_type(ReturnKeyType::Send)
                        .on_submit(move |_: &str| send())
                        .placeholder("Message")
                        .flex_1()
                        .max_h(px(120.0)),
                ),
        )
}
```

```tsx tabs
import { Scroll, signal, View, keyboardFrame, safeAreaInsets } from "nsh";
import { Input } from "nsh/base";

function ChatScreen() {
  const insets = safeAreaInsets();
  const draft = signal("");
  const send = () => {
    if (draft().trim()) console.log("send", draft());
    draft.set("");
  };
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        {/* messages */}
      </Scroll>
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          // Above the home indicator, unless the keyboard covers it.
          paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
        }}
      >
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          onSubmit={send}
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120 }}
        />
      </View>
    </View>
  );
}
```

تقلّص الحشوة (`.pb_keyboard()`) المحتوى الذي فوقها بينما تمتد الخلفية إلى أسفل الشاشة؛ أما الهامش السفلي (`marginBottom: "env(keyboard-inset-height)"`، `.mb_keyboard()`) فيُنهي العرض كله عند أعلى لوحة المفاتيح. ويضيف `calc(env(keyboard-inset-height) + <length>)` (وفي Rust `.pb_keyboard_plus(..)`، `.mb_keyboard_plus(..)`) طولًا، مثل طرح ارتفاع شريط تبويب أسفل العرض.

الارتفاع الكامل يناسب عرضًا يصل إلى أسفل السطح، كما هو حال محتوى الشاشة. وعلى مضيف Android الذي يُعاد تحجيم نافذته من أجل لوحة المفاتيح، تتقلص النافذة نفسها وتكون قيمة المتغير 0. راجع [لوحة المفاتيح](../elements/keyboard.md).

<a id="the-keyboard-accessor"></a>

### موصِّل لوحة المفاتيح

`keyboard_height()` و`keyboard_duration()` في Rust، و`keyboardFrame()` من `nsh` في TSX (وهو `{ height, duration }`)، تفاعلية: تعبّر عن مدى امتداد لوحة المفاتيح داخل السطح (0 عند إخفائها، مع احتساب المنطقة الآمنة السفلية تحتها) ومدة حركتها بالميلي ثانية. استخدمهما لأي شيء مخصص: أخفِ زرًّا عائمًا أثناء الكتابة، أو غيّر حجم لوحة. أي شيء يتغير معهما في التحديث الذي تبدأ فيه حركة لوحة المفاتيح يتحرك مع لوحة المفاتيح، وفق منحناها وبتوقيت يبدأ من لحظة بدء حركتها (`LayoutCurve::Keyboard`)، كما يفعل `env(keyboard-inset-height)`؛ أما الحركة التي يضبطها التطبيق لذلك التحديث (`LayoutAnimation.configureNext`) فتكون لها الأولوية.

```rust tabs
view().child(when(
    || keyboard_height() == px(0.0),
    || view().absolute().right(px(16.0)).bottom(px(16.0)), /* … */
))
```

```tsx tabs
import { View, keyboardFrame } from "nsh";

<If when={keyboardFrame().height === 0}>
  <View style={{ position: "absolute", right: 16, bottom: 16 }}>…</View>
</If>
```

<a id="a-bar-over-the-keyboard-ios-inputaccessoryview"></a>

## شريط فوق لوحة المفاتيح (iOS): InputAccessoryView

يعرض `input_accessory_view(id)` في Rust و`InputAccessoryView` من `nsh/mobile` في TSX شريطًا ملتصقًا بأعلى لوحة المفاتيح ما دام حقل إدخال يسمّيه ممسكًا بالتركيز: وهو `inputAccessoryView` في iOS. يتحرك مع لوحة المفاتيح أصليًا، بما في ذلك أثناء الإغلاق التفاعلي. ولا يشغل مساحة في الموضع الذي يوضع فيه ضمن الشجرة؛ وتشير إليه حقول الإدخال بمعرّفه (`.input_accessory(id)`، وفي TSX `ios={{ inputAccessoryViewID }}` و`nativeID`):

```rust tabs
use nsh_core::prelude::*;

pub fn note() -> impl IntoElement {
    let content = signal(String::new());
    let field = element_ref();
    view()
        .p(px(16.0))
        .child(
            input()
                .element_ref(&field)
                .value(move || content.get())
                .on_change(move |t: &str| content.set(t.to_owned()))
                .input_accessory("note-bar")
                .placeholder("A note"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf6f8fa)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(8.0))
                    .child(
                        text(move || format!("{} characters", content.with(|t| t.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x57606a)),
                    )
                    .child(
                        text("Done")
                            .on_press(move || field.blur())
                            .text_color(rgb(0x0969da))
                            .font_weight(FontWeight::SEMIBOLD),
                    ),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input!: InputRef;
  return (
    <View style={{ padding: 16 }}>
      <Input
        ref={input}
        value={text()}
        onChange={({ value }) => text.set(value)}
        ios={{ inputAccessoryViewID: "note-bar" }}
        placeholder="A note"
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f6f8fa" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
          <Text style={{ flex: 1, color: "#57606a" }}>{text().length} characters</Text>
          <Text onPress={() => input.blur()} style={{ color: "#0969da", fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

عرض الشريط يساوي عرض النافذة وارتفاعه يساوي ارتفاع محتواه. ملحقات الإدخال خاصة بـ iOS: وعلى Android يكون الشريط عرضًا فارغًا مخفيًا، لذا ضع هذه عناصر التحكم في مكان آخر هناك، مثل أن تضعها فوق حقل الإدخال (`os() == Os::Android` في Rust، `platform.os === "android"` في TSX).

<a id="related"></a>

## ذو صلة

- [`Input`](../elements/input.md): مرجع العنصر.
- [لوحة المفاتيح](../elements/keyboard.md) و[`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe).
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview): `InputAccessoryView`.
- [التمرير](./scrolling.md#scroll-views-and-the-keyboard): إغلاق لوحة المفاتيح والنقرات في عروض التمرير.
