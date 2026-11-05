---
title: "Link"
description: "مكوّن Link: محتوى ينقل المستخدم إلى وجهة عند الضغط عليه، سواء كانت صفحة أو موقعًا أو مسارًا داخل التطبيق، مع دعم الضغطات والتفعيل عبر لوحة المفاتيح وحالة التعطيل ودور الرابط لقارئات الشاشة، ويتولى التطبيق تنسيقه."
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---

# Link

يأخذ الرابط المستخدم إلى مكان ما: صفحة ويب، أو تطبيقًا آخر (`mailto:`، `tel:`)، أو شاشة من التطبيق نفسه. وهو يتولى السلوك: الضغطات، ومفتاحا Return وSpace أثناء امتلاكه تركيز لوحة المفاتيح، وحالة التعطيل، ودور الرابط لقارئات الشاشة. أما المظهر فمن شأن التطبيق: فـ`Link` لا يملك لونًا ولا خطًا سفليًا ولا تسمية خاصة به، وما يظهر هو عناصره الفرعية. `href` يحدد وجهة الرابط؛ فهو بيانات تُستخدم عند الفتح، وليس نصًا يظهر على الشاشة.

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

يأتي `Link` من [`nsh/base`](../modules/nsh-base.md)، وهي الحزمة `nsh-base` في Rust. في Rust، ينشئ `link()` رابطًا بدالة ضبط لكل خاصية (`.href(..)`، `.open_with(..)`)، ومستمعٍ لكل حدث (`.on_open(..)`، `.on_press(..)`)، ودوال الأنماط المضبوطة الأنواع للرابط، و`.child(..)` لمحتواه.

<a id="opening"></a>

## الفتح

الضغطة أو النقرة، أو Return أو Space على الرابط الذي يملك التركيز، تفتح `href` الخاص به:

1. يُبلّغ `onOpen({ href })` عن وجهة الرابط.
2. مع `openWith="system"` (الافتراضي)، يُفتح عنوان URL لتطبيق آخر أو موقع آخر، أي عنوان له مخطط (`https:`، `mailto:`، `tel:`، أو مخطط سجّله تطبيق آخر)، خارج التطبيق، كما يفتحه [`openUrl`](../modules/nsh.md): يتناوله أولًا موجّه التطبيق المضيف، ثم النظام. أما أي `href` آخر، كمسار من التطبيق (`/orders/42`) أو `#anchor`، فيُبلَّغ عنه ويبقى في عهدة التطبيق.
3. يُبلّغ `onPress()` عن الضغطة.

مع `openWith="app"`، يكون معالج `onOpen` في التطبيق هو الذي يفتح الرابط: مسار خاص به، أو صفحة في عرض ويب داخل التطبيق، أو تأكيد أولًا.

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

يتطلب فتح عنوان URL خارج التطبيق صلاحية `openUrl` عندما يصرّح التطبيق بالصلاحيات في `nsh.json` (`"openUrl": true`، أو `{ "schemes": ["https", "mailto"] }`).

<a id="props"></a>

## الخصائص

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | لا شيء | وجهة الرابط: عنوان URL، أو مسار من التطبيق. يُبلَّغ عنه عبر `onOpen` ولا يُعرض أبدًا. |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | من يفتح `href`: النظام يفتح عنوان URL لتطبيق آخر أو موقع آخر؛ و`"app"` يترك الأمر إلى `onOpen`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | لا ضغطات، ولا استجابة بصرية للضغط، ولا تركيز لوحة مفاتيح؛ وتُطبَّق أنماط `disabled:`، وتذكر قارئات الشاشة أنه معتّم. |
| `current` | `.current(..)` | `boolean` | `false` | الرابط إلى الصفحة التي يتصفحها المستخدم، في قائمة تنقل أو مسار تنقل: تذكر قارئات الشاشة أنها الصفحة الحالية. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | لا شيء | ما تنطق به قارئات الشاشة، عندما يقول المحتوى القليل جدًا (أيقونة). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | لا شيء | المسافة خارج حدوده التي تظل الضغطات فيها محتسبة، بالنقاط: رقم واحد لكل الجهات، أو تسمية الجهات. كما في `hitSlop` الخاص بالعرض. |
| `children` | `.child(..)` | `JSX.Element` | لا شيء | المحتوى: تسمية، أو أيقونة، أو أي شيء يعرضه التطبيق. |
| `class`، `style` | دوال الأنماط | `string`، `StyleProp<ViewStyle>` | لا شيء | مظهر الرابط: لونه وخطه السفلي وحشوه؛ وتنتقل خصائص النص إلى النصوص الموجودة بداخله. |
| `activeStyle`، `hoverStyle`، `focusStyle`، `disabledStyle` | `.active(\|s\| ..)`، `.hover(..)`، `.focus(..)`، `.disabled_style(..)` | `StyleProp<ViewStyle>` | لا شيء | نمط الرابط أثناء الضغط عليه أو تمرير المؤشر فوقه أو تركيزه أو تعطيله، كفئات `<state>:`. |

<a id="events"></a>

## الأحداث

| الحدث | Rust | الوصف |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | الرابط يفتح `href`: مع `openWith="app"` يفتحه المعالج، ومع `"system"` يعرف المعالج ما طُلب من النظام فتحه. ويأتي قبل `onPress`. |
| `onPress` | `.on_press(\|\| ..)` | تم الضغط على الرابط: نقرة لمسية، أو نقرة بالفأرة، أو Return أو Space أثناء امتلاكه تركيز لوحة المفاتيح. |

الرابط المعطّل لا يُبلّغ عن شيء، ولا تصل الضغطة عليه إلى أي عرض قابل للضغط يحيط به.

<a id="states"></a>

## الحالات

يضبط التطبيق نمط كل حالة بالفئات أو بخصائص النمط:

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

الرابط الذي سبقت زيارته يتولى التطبيق تذكّره: فهو يحتفظ بقيم href التي فتحها، ويضبط نمط تلك الروابط وفق حالته الخاصة.

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## داخل النص

يُعدّ `Link` داخل `<Text>` صندوقًا مضمّنًا في الفقرة، شأنه شأن كل عرض داخل نص: فهو يقع ضمن السطر، ويحتفظ بحالاته وتركيزه ودوره، ويبقى على سطر واحد. ويضع `align-text-bottom` الرابط الذي يحتوي سطرًا واحدًا من النص على خط أساس الفقرة:

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

أما الرابط الذي ينتقل مع أسطر الفقرة فهو `<Text>` متداخل مع `role="link"` و`onPress` (راجع [Text](./text.md))، كما يرسم [TextView](./text-view.md) روابط المستند.

<a id="a-small-target-with-hitslop"></a>

## هدف صغير مع hitSlop

قد يكون الرابط أصغر من الإصبع: أيقونة، أو كلمة قصيرة. يجعل `hitSlop` الضغطات التي تقع قربه محتسبة، بالنقاط خلف كل جهة، دون تغيير تخطيطه ولا مظهره: رقم واحد لكل الجهات، أو تسمية الجهات (`{ top: 8, bottom: 8 }`)، كما يقبلها [`hitSlop` الخاص بالعرض](./index.md#presses-and-feedback).

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## إمكانية الوصول

- الرابط عنصر واحد لقارئات الشاشة، بالدور `"link"`؛ وتسميته هي نص عناصره الفرعية، أو `accessibilityLabel`. ويبقى `href` بيانات فقط: فقارئات الشاشة تنطق التسمية.
- يُنطق `current` على أنه الصفحة الحالية (`aria-current="page"` في ARIA)، ويُنطق `disabled` كما تنطق المنصة العنصر المعتّم.
- على macOS والويب يكون الرابط إحدى محطات تركيز لوحة المفاتيح: يصل إليه Tab، ويفتحه Return وSpace، وتُظهر أنماط `focus:` موضع التركيز.

راجع [إمكانية الوصول](../docs/accessibility.md) للاطلاع على التسميات والأدوار والإعلانات بوجه عام.

<a id="platform-notes"></a>

## ملاحظات المنصات

- iOS وAndroid وMac Catalyst: الضغطة هي لمسة تنتهي على الرابط.
- أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب: الضغطة هي نقرة. وعلى macOS والويب، يفتح Return وSpace أيضًا الرابط الذي يملك تركيز لوحة المفاتيح.
- يعرض الويب الرابط كعنصر له `role="link"`.
- ترسم كل منصة ما يضبطه التطبيق من أنماط.
