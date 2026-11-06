---
title: "الوحدات"
description: "الوحدات التي يستوردها تطبيق NSH، وما تصدّره كل وحدة، وكيفية تنظيمها."
order: 1
source_hash: c212e0667eddb588
---

# الوحدات

يستورد تطبيق NSH كل ما يستخدمه من مجموعة صغيرة من الوحدات. وكلها أصلية: فالرسم البياني التفاعلي ومحرك العرض وكل وحدة منفذة بلغة Rust داخل بيئة التشغيل، ويُبقي المُجمِّع `import ... from "nsh/..."` كاستيرادات بدلًا من نسخ الشيفرة إلى الحزمة الناتجة. لذلك لا تحتوي حزمتك إلا على شيفرتك أنت.

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## ثلاث طبقات

تُبنى واجهة المستخدم في NSH على ثلاث طبقات، كما هو الحال في GPUI Kit (`gpui`، `gpui-base`، `gpui-component`):

| الطبقة | الوحدات | ما تقدمه للتطبيق |
|---|---|---|
| العناصر الأولية | `nsh`، `nsh/mobile`، `nsh/desktop` | التفاعلية، والعناصر المضيفة، والتخطيط، والقوائم، وcanvas، والرسوم المتحركة، والإيماءات، ومعلومات الجهاز، وواجهات API الخاصة بالمنصات |
| المكونات الأساسية | [`nsh/base`](./nsh-base.md) | مكونات بلا تنسيق تتولى السلوك والحالة والتركيز وإمكانية الوصول: زر، ومستندات Markdown وHTML، ومكدسات التنقل، والحوارات وحوارات النظام، على كل منصة |
| مكتبة المكونات | مكتبة تطبيقك، أو مكتبة من المجتمع | أزرار وبطاقات وصفوف وشاشات ذات مظهر محدد |

مظهر التطبيق شأن خاص به. ومكتبة المكونات هي الطبقة الثالثة: مكونات يكتبها التطبيق انطلاقًا من [العناصر المضيفة](../elements/index.md) و`nsh/base`، وينسقها باستخدام `style` وفئات [Tailwind](../docs/tailwind.md) وسمته، أو مكونات Rust يشحنها في [crate خاص به](../docs/rust.md)، أو مكتبة ينشرها المجتمع على الأساس نفسه.

لا توجد وحدة شاملة: فكل واجهة API موجودة في مكان واحد فقط. وتوجد واجهات API الخاصة بالمنصات المحمولة في `nsh/mobile` (iOS وAndroid)، وواجهات أنظمة سطح المكتب في `nsh/desktop` (macOS وWindows وLinux)؛ ويمكن استيراد الوحدتين على كل منصة، ولذلك تعمل حزمة واحدة في كل مكان (وعلى المنصات الأخرى تعود استدعاءاتهما فورًا، ويخبرك `platform.os` بالمنصة التي تعمل عليها).

تُولَّد الأنواع من بيئة التشغيل: إذ يكتب `nsh init` و`nsh build` و`nsh dev` و`nsh test` الملف `.nsh/types` بجوار تطبيقك، فتطابق تصريحات TypeScript دائمًا بيئة التشغيل التي تبني بها (انظر [هيكل المشروع](../docs/project-structure.md)).

<a id="all-modules"></a>

## جميع الوحدات

| الوحدة | الصادرات | الصفحة |
|---|---|---|
| `nsh` | `signal`، `computed`، `effect`، `batch`، `untracked`، `cleanup`، `context`، `split`، `mount`، `ErrorBoundary`؛ والعناصر الأولية `View`، `Text`، `Scroll`، [`List`](./nsh-list.md)، [`Image`](./nsh-image.md) (مع `Image.getSize`، `Image.prefetch`)، [`Canvas`](./nsh-canvas.md) (مع `Path2D`، `CanvasRenderingContext2D`، `CanvasGradient`)، [`WebView`](./nsh-webview.md)، [`Video`](./nsh-video.md)؛ `safeArea`، `safeAreaInsets`؛ `Keyboard`، `keyboardFrame`؛ [الرسوم المتحركة](./nsh.md#animation) (`createAnimatedValue`، `AnimatedValue`، `AnimatedNode`، `Animated`، `Easing`، `LayoutAnimation`)؛ [البيئة](./nsh.md#device) (`windowSize`، `colorScheme`، `setColorScheme`، `fontScale`، `pixelRatio`، `locale`، `platform`، `openUrl`)؛ [`PanResponder`](./nsh.md#panresponder)؛ [`Clipboard`](./nsh.md#clipboard)؛ [`Picker`](./nsh.md#picker)؛ [`Storage`](./nsh.md#storage)؛ [`host`](./nsh.md#host) (`available`، `call`، `on`، بالإضافة إلى حزمتي SDK الأصليتين `params` و`post`)؛ [`keymap`](./nsh.md#keymap) (اختصارات لوحة المفاتيح: `mod+k`، `ctrl+shift+p`، ...)؛ [`nativeComponent`، `nativeModule`](./nsh.md#nativecomponent-and-nativemodule) (مكونات ودوال يسجلها التطبيق المضمِّن)؛ [إمكانية الوصول](./nsh.md#accessibility) (`announce`، `setAccessibilityFocus`، `screenReaderEnabled`، `reduceMotion`)؛ وأنواع العناصر والأنماط والأحداث وJSX (`ViewRef`، `InputRef`، ...، `ViewStyle`، ...) | [nsh](./nsh.md) |
| `nsh/base` | `Button`، `Input`؛ `TextView`؛ `createNavStack`، `NavStack`، `NavPage`، `Dialog`؛ `AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`، `TabBar` (شريط علامات التبويب الخاص بالنظام، على iOS وAndroid)، `InputAccessoryView` (iOS)، `BackHandler` (Android) | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`، `Window` (العنوان، وشريط العنوان، والتكبير، وملء الشاشة)، `titleBar`، `Menu` (قائمة التطبيق، والقوائم السياقية) | [nsh/desktop](./nsh-desktop.md) |
| الوحدات القياسية | `buffer`، `console`، `crypto`، `fs/promises`، `net`، `os`، `path`، `process`، `url`، `websocket`، `zlib` | [الوحدات القياسية](./standard-modules.md) |
| العناصر العامة | `fetch`، `URL`، `TextEncoder`، `Blob`، `FormData`، `AbortController`، `Intl`، المؤقتات، `console`، `requestAnimationFrame`، ... (دون استيراد) | [واجهات API العامة](./globals.md) |

صفحات مرجعية ليست وحدات:

| الصفحة | ما تغطيه |
|---|---|
| [مرجع الأنماط](./style-reference.md) | كل مفتاح نمط ونوعه ومعناه |
| [مرجع Tailwind](./tailwind-reference.md) | أدوات Tailwind المساعدة ومتغيراتها التي يقبلها `class` |

<a id="host-elements"></a>

## العناصر المضيفة

العناصر المضيفة مكونات تُستورد مثل أي شيء آخر: `View` و`Text` و`Scroll` و`Image` و`List` و`Canvas` و`WebView` و`Video` و`Overlay` من `nsh`، والمكونات الأساسية (`Button` و`Input` و`Dialog` و`NavStack` و`NavPage`) من `nsh/base`، و`InputAccessoryView` من `nsh/mobile`. أما `If` و`Each` فهما وحدهما العنصران العامان. ينشئ المُجمِّع العناصر في موضعها، فلا تكلّف الاستيرادات شيئًا وقت التشغيل. وتُوثَّق خصائصها ضمن [العناصر](../elements/index.md).
