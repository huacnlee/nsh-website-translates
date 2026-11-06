---
title: "المنطقة الآمنة"
description: "متغيرات البيئة safe-area-inset والموصِّلان safeArea وsafeAreaInsets: إبقاء المحتوى بعيدًا عن النتوء (notch) وشريط الحالة ومؤشر الصفحة الرئيسية والترويسات."
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---

# المنطقة الآمنة

تُبقي المنطقة الآمنة المحتوى بعيدًا عن النتوء (notch) أو Dynamic Island، وعن شريط الحالة، ومؤشر الشاشة الرئيسية، ورأس التنقل، وشريط عنوان Mac Catalyst. يمكن لأي عرض أن يضيف حشوة بمقدارها باستخدام `env()` في CSS:
`env(safe-area-inset-top)` و`env(safe-area-inset-right)` و`env(safe-area-inset-bottom)` و
`env(safe-area-inset-left)`، ضمن الحشوة (padding) أو الهامش (margin). وهي تمثل الهوامش الداخلية للعرض الجذر الذي تُرسم فيه العقدة: داخل [NavPage](./nav-stack.md) تكون الهوامش الواقعة أسفل رأس الصفحة، وداخل [Dialog](./dialog.md) تكون هوامش مربع الحوار، وفي غير ذلك تكون المنطقة الآمنة للسطح. في المتصفح تكون الصفحة هي الجذر، وتكون المتغيرات هي متغيرات المتصفح نفسه.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    view()
        .flex_1()
        .bg(rgb(0xfff8c5))
        .p_safe_area()
        .child(text("Clear of the notch").text_2xl().font_weight(FontWeight::BOLD))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff8c5",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Clear of the notch</Text>
    </View>
  );
}

mount(App);
```

يملأ لون الخلفية المنطقة كلها، بما في ذلك المنطقة خلف شريط الحالة، ويبدأ المحتوى أسفلها. وتتبع القيم الهوامش: عند التدوير، أو في صفحة أو مربع حوار آخر، تتحدث الحشوة تلقائيًا بصورة أصلية.

<a id="values"></a>

## القيم

| القيمة | مثال | المعنى |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | الهامش الداخلي. |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | الهامش الداخلي؛ يحل الطول محل اسم غير معروف، كما في CSS. |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | الهامش الداخلي مضافًا إليه طول، للمحتوى الذي يحتفظ بتباعده الخاص. |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | مثل السابق. |

تنطبق على `padding` و`paddingHorizontal` و`paddingVertical` و`paddingTop` و`paddingRight` و`paddingBottom`
و`paddingLeft` ومفاتيح `margin` نفسها. في Tailwind هي قيم اعتباطية للأدوات `p` و`px` و`py` و`pt` و`pr` و`pb`
و`pl` و`m` (يمكن حذف المسافات): `pt-[env(safe-area-inset-top)]`،
`pb-[calc(env(safe-area-inset-bottom)+16px)]`. نوع TypeScript لهذه القيم هو `EnvValue`. راجع
[مرجع الأنماط](../modules/style-reference.md).

في Rust تضبطها الدوال `Styled`: `.p_safe_area()` و`.px_safe_area()` و`.py_safe_area()` و`.pt_safe_area()`
و`.pr_safe_area()` و`.pb_safe_area()` و`.pl_safe_area()` ودوال `m` نفسها، و`.pt_safe_area_plus(px(16.0))`
(و`pr` و`pb` و`pl` و`mt` و`mr` و`mb` و`ml`) للهامش الداخلي مضافًا إليه طول.

<a id="choosing-the-edges"></a>

## اختيار الحواف

أضف حشوة للحواف التي تحتاجها فقط، مثلًا عندما يتولى شريط تبويب أو شريط سفلي خاص بك معالجة الهامش السفلي:

```rust tabs
view()
    .flex_1()
    .pt_safe_area()
    .px_safe_area()
```

```tsx tabs
<View class="flex-1 pt-[env(safe-area-inset-top)] px-[calc(env(safe-area-inset-left)+16px)]">
  …
</View>
```

<a id="where-to-use-it"></a>

## متى تستخدمها

تضع [NavPage](./nav-stack.md) ذات الرأس المرئي والمعتم محتواها أصلًا أسفل الرأس، لذا يكون الهامش العلوي هناك 0. وتُستخدم هوامش المنطقة الآمنة في:

- جذر تطبيق بلا مكدس تنقل،
- صفحة تستخدم `headerVisible={false}` أو `headerTransparent`،
- محتوى [Dialog](./dialog.md) بملء الشاشة،
- أشرطة خاصة بك عند حواف الشاشة.

<a id="safearea-and-safeareainsets"></a>

## safeArea وsafeAreaInsets

عندما تحتاج إلى الأرقام في الشيفرة، اقرأها مباشرة. تأتي دالتا الوصول في TSX من `nsh`، وتُرجعان كائن `Edges`
(`{ top, right, bottom, left }` بالنقاط)، وهما تفاعليتان: الشيفرة التي تقرؤهما تُعاد عند تغيّرهما، مثلًا عند التدوير.

| TSX | Rust | القيمة المُرجعة |
|---|---|---|
| `safeArea()` | `safe_area()` | المنطقة الآمنة للسطح: الأجزاء الخالية من واجهة النظام (النتوء، مؤشر الشاشة الرئيسية، شريط العنوان). |
| `safeAreaInsets()` | `cx.insets()` | الهوامش في الموضع الذي يُرسم فيه المكوّن: هوامش أقرب صفحة (أسفل رأسها)، أو أقرب مربع حوار، وإلا فالمنطقة الآمنة للسطح. وهذه هي قيم متغيرات `safe-area-inset-*`. في TSX استدعها داخل مكوّن؛ فهي تُرجع دالة وصول (accessor). ويقرؤها مكوّن Rust في الحزمة (crate) الخاصة بك باستخدام `cx.insets()`. |

```rust tabs
use nsh_core::prelude::*;

fn bottom_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || if safe_area().bottom > Points::ZERO { px(4.0) } else { px(8.0) })
        .child(text("Bottom bar"))
}
```

```tsx tabs
import { Text, View, safeArea } from "nsh";

function BottomBar() {
  const insets = safeArea();
  return (
    <View style={{ flexDirection: "row", padding: 8, paddingBottom: insets().bottom > 0 ? 4 : 8 }}>
      <Text>Bottom bar</Text>
    </View>
  );
}
```

لإضافة حشوة بمقدار الهامش نفسه، يُعد `env()` الصيغة الأبسط: فهو يتحدث بصورة أصلية دون تشغيل شيفرة.

<a id="platform-notes"></a>

## ملاحظات المنصات

- **iOS**: تأتي الهوامش من المنطقة الآمنة في UIKit: شريط الحالة، والنتوء أو Dynamic Island، ومؤشر الشاشة الرئيسية.
- **Android**: يُبلغ NSH عن أجزاء أشرطة النظام وقصّة الشاشة (display cutout) التي تتداخل مع عرض NSH. وعندما يكون NSH
  [مضمَّنًا](../docs/android.md) أسفل شريط أدوات أصلي، يكون الهامش العلوي للعرض 0.
- **Mac Catalyst**: الهامش العلوي هو شريط عنوان النافذة.
- **أنظمة سطح المكتب (macOS وWindows وLinux وGPUI) والويب**: يبدأ محتوى الصفحة أسفل `header`، ويمنح مربع الحوار محتواه هوامش خاصة به، كما في الهواتف.

<a id="related"></a>

## ذو صلة

- [لوحة المفاتيح](./keyboard.md): `env(keyboard-inset-height)`، إبقاء المحتوى فوق لوحة المفاتيح البرمجية.
- [الجهاز والبيئة](../docs/device-and-environment.md): المنطقة الآمنة بين قيم الجهاز الأخرى.
