---
title: "Image"
description: "العنصر الذي يعرض صورة مضمّنة أو بعيدة، مع دعم العناصر النائبة والتمويه والتلاشي والتلوين وأحداث التحميل."
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---

# Image

`Image` يعرض صورة من أصول التطبيق (assets) أو من عنوان URL. تُنزَّل الصور وتُفكّ ترميزها خارج الخيط الرئيسي، وتُصغَّر
إلى الحجم الذي يعرضها به العنصر، وتُخزَّن مؤقتًا في الذاكرة. تُشغَّل صور GIF المتحركة وWebP وAPNG. في Rust
تُنشأ الصورة بـ `image(src)`، وفي TSX بـ `<Image>` من `nsh`.

```rust tabs
use nsh_core::prelude::*;

// assets/logo.png in the app's crate.
const LOGO: ImageAsset = asset!("logo.png");

view()
    .flex_row()
    .gap_3()
    .child(image(LOGO))
    .child(
        image("https://example.com/avatar.jpg")
            .placeholder(LOGO)
            .object_fit(ResizeMode::Cover)
            .size(px(64.0))
            .rounded_full(),
    )
```

```tsx tabs
import { Image, View } from "nsh";
import logo from "./assets/logo.png";

<View style={{ flexDirection: "row", gap: 12 }}>
  <Image src={logo} />
  <Image
    src="https://example.com/avatar.jpg"
    placeholder={logo}
    style={{ width: 64, height: 64, borderRadius: 32 }}
  />
</View>;
```

الأصل (asset) يعرف حجمه: فإذا لم تحدد عرضًا ولا ارتفاعًا أخذت الصورة حجمه، وإذا حددت أحدهما اتبعه الآخر
وفق نسبة أبعاد الأصل. أما حجم الصورة من URL فلا يُعرف إلا بعد تحميلها، لذا حدّد للصور البعيدة عرضًا وارتفاعًا (أو
نسبة أبعاد مع أحدهما).

<a id="sources"></a>

## المصادر

يقبل المصدر (`src` و`placeholder`؛ `image(..)` و`.placeholder(..)` في Rust) ما يلي:

| القيمة | مثال | الوصف |
|---|---|---|
| أصل (asset) | Rust `asset!("logo.png")`، TSX `import logo from "./logo.png"` | `ImageAsset` `{ url, size, scales? }` يُقاس حجمه بالنقاط: ملف `@2x` يُحسب بنصف عدد بكسلاته. عند وجود `logo@2x.png` / `logo@3x.png` بجانب `logo.png` يُحمَّل المتغير المناسب لنسبة بكسلات الشاشة ([كثافات البكسل](../docs/images-and-assets.md#pixel-densities)). يمكن استيراد `.png` و`.jpg` و`.jpeg` و`.gif` و`.webp` و`.heic`، وكذلك `.svg` بحجم يحدده `width` و`height` أو `viewBox` ([صور SVG](../docs/images-and-assets.md#svg-images)). |
| عنوان URL | `"https://example.com/a.jpg"` | يُنزَّل ويُخزَّن مؤقتًا. تُشارَك عمليات تنزيل عنوان URL نفسه بين العناصر. |
| مسار أصل | `"asset:/images/a.png"` | ملف من أصول التطبيق. |
| معرّف URI من نوع `data:` | `"data:image/png;base64,iVBOR…"` | بايتات داخل المعرّف، بترميز base64 أو بالترميز النسبي المئوي (`data:image/svg+xml,%3Csvg…`). |
| عنوان URL من نوع `blob:` | `URL.createObjectURL(blob)` | بايتات `Blob` أو `File` (في TSX). تحتفظ الصورة بالبايتات: فإلغاء العنوان يترك صورة تُعرض كاملة. |

تُعرض الصورة المبنية من بايتات يملكها التطبيق أصلًا دون أي طلب. فمحادثة تعرض صورة اختارها المستخدم من الـ blob الخاص بها أثناء
رفعها، ثم تبدّل `src` إلى عنوان URL الخاص بالصورة:

```rust tabs
// Bytes in a `data:` URI (an image the app made or received inline).
image(format!("data:image/png;base64,{encoded}")).size(px(64.0))
```

```tsx tabs
import { Image, signal } from "nsh";

const preview = URL.createObjectURL(photo); // the picked `File`
const src = signal(preview);
upload(photo).then((url) => {
  src.set(url);
  URL.revokeObjectURL(preview);
});

<Image src={src()} style={{ width: 240, height: 180 }} />;
```

البايتات المتطابقة صورة واحدة: فالصورة نفسها بوصفها معرّف URI من نوع `data:` وبوصفها blob تُفكّ مرة واحدة وتتشارك الذاكرة المؤقتة.

أثناء التطوير تُقدَّم الأصول من خادم التطوير؛ ويقوم `nsh build` و`nsh package` بنسخها إلى التطبيق (وتشحن حزمة Rust
المجلد `assets/` الخاص بها مع `registry.assets(assets!())`). راجع
[الصور والأصول](../docs/images-and-assets.md).

> [!NOTE]
> عندما يعلن التطبيق عن [القدرات (capabilities)](../docs/sandbox-and-capabilities.md)، تُحمَّل الصور البعيدة من المضيفات
> المدرجة فيها فقط؛ أما الصورة من أي مضيف آخر فلا تُطلب وتفشل بالخطأ `onError` الذي يكون `code` فيه `"ERR_ACCESS_DENIED"`. تُحمَّل معرّفات `asset:` و`data:` وعناوين `blob:` دائمًا.

<a id="props"></a>

## الخصائص

إضافةً إلى [الخصائص المشتركة](./index.md#common-props) (مع `style` من النوع `ImageStyle`):

| الخاصية | Rust | النوع | الافتراضي | الوصف |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | الصورة. |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | تُعرض إلى أن يكتمل تحميل `src`؛ والأفضل أن تكون أصلًا محليًا. |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | تُطمِس الصورة بنصف القطر هذا بالنقاط (يُطبَّق مرة واحدة أثناء فك الترميز، خارج الخيط الرئيسي). |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`، Android `300` | مدة ظهور الصورة المحمَّلة تدريجيًا، بالميلي ثانية. |
| `tintColor` (style) | `.tint_color(..)` | `ColorValue` | | تعيد تلوين صورة القالب (أيقونة مرسومة بلون واحد). |
| `objectFit` (style) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | كيف تلائم الصورة صندوقها، كما في `object-fit` في CSS (فئات `object-*`): `"cover"` تملؤه وتقص الزائد، `"contain"` تلائمها داخله، `"fill"` تمطّها، `"none"` تعرضها بحجمها الطبيعي، `"scale-down"` مثلها لكنها تُصغَّر لتلائم الصندوق حين تكون أكبر منه. |
| `objectPosition` (style) | `.object_position(..)`، `.object_top()`، ... | `string` | `"center"` | موضع الصورة في صندوقها بعد أن يحدد `objectFit` حجمها، كما في `object-position` في CSS (`"top"`، `"25% 75%"`، `"right 10px bottom 20%"`)؛ وتُقصّ الصورة المغطّية للصندوق حول هذا الموضع. |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | بدأ التحميل. |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | تقدّم التنزيل بالبايتات (`total` تساوي 0 عندما يكون غير معروف)، مرة كل 100 ملّي ثانية على الأكثر. |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | اكتمل التحميل؛ وحجم الصورة المصدر بالبكسل (لا حجم الصورة بعد فك الترميز والتصغير؛ وحجم SVG بالنقاط، [وعلى الويب كما يقيسه المتصفح](../docs/images-and-assets.md#svg-images))؛ وفي حالة الصورة ذات المتغيرات، حجم المتغير المحمَّل. |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | فشل التحميل؛ و`code` تكون `"ERR_ACCESS_DENIED"` لعنوان URL لا تمنحه قدرات التطبيق. |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | بعد `onLoad` أو `onError`. |

`ImageStyle` يضيف `tintColor` إلى أنماط العنصر، وهي تعيد تلوين صورة القالب (أيقونة مرسومة بلون واحد)، وكذلك `objectPosition` الذي يضع الصورة في صندوقها ([موضع الصورة](../docs/images-and-assets.md#image-position)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

<a id="events"></a>

## الأحداث

| الحدث | Rust | الحمولة | متى |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | لا شيء | بدأ التحميل. |
| `onProgress` | `.on_progress` | `{ loaded, total }` (`ImageProgress`) | وصلت بايتات (مرة كل 100 ملّي ثانية على الأكثر). |
| `onLoad` | `.on_load` | `{ size }` (`Size<DevicePixels>`) | عُرضت الصورة؛ وحجمها المصدر بالبكسل (وحجم SVG بالنقاط، [وعلى الويب كما يقيسه المتصفح](../docs/images-and-assets.md#svg-images)). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`، الرسالة) | فشل التحميل أو فك الترميز، أو أن المضيف خارج قدرات التطبيق (`code` `"ERR_ACCESS_DENIED"`). |
| `onLoadEnd` | `.on_load_end` | لا شيء | بعد `onLoad` أو `onError`. |

```rust tabs
let state = signal(SharedString::from("loading"));

image(url)
    .w_full()
    .aspect_ratio(16.0 / 9.0)
    .on_load(move |size: &Size<DevicePixels>| state.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| state.set(message.to_string().into()))
```

```tsx tabs
const state = signal("loading");
<Image
  src={url}
  style={{ width: "100%", aspectRatio: 16 / 9 }}
  onLoad={({ size }) => state.set(`${size.width}×${size.height} px`)}
  onError={(e) => state.set(e.message)}
/>;
```

الصورة ذات [متغيرات كثافة البكسل](../docs/images-and-assets.md#pixel-densities) تحمّل أحد ملفاتها، و
`onLoad` يبلّغ عن بكسلات ذلك الملف: 192×192 لـ `logo@3x.png` على شاشة 3×، في حالة `logo.png` بقياس 64×64 نقطة. وعندما
تتغير نسبة البكسل وتحمّل الصورة متغيرًا آخر، فإنها تبلّغ عن ذلك التحميل أيضًا: `onLoadStart`، ثم `onLoad` مع حجم
الملف الجديد (أو `onError`)، ثم `onLoadEnd`.

لمعرفة حجم الصورة أو لتحميلها قبل عرضها، يستدعي TSX ‏`Image.getSize(src)` و`Image.prefetch(src)` (فالـ
`Image` نفسه الذي يرسم العنصر يحملهما؛ راجع [واجهة Image البرمجية](../modules/nsh-image.md))، ويستدعي Rust
‏`image_size(src)` و`prefetch_image(src)` مع انتظارهما داخل مهمة (task). وعند تمرير صورة مستوردة ذات متغيرات، يحمّل `Image.getSize`
و`Image.prefetch` المتغير الذي تعرضه هذه الشاشة، بينما يعيد `getSize` حجم الملف المستورد (64×64
لـ `logo.png`).

<a id="ref-methods"></a>

## دوال Ref

لا يوجد لهذا المكوّن دوال خاصة به.

<a id="platform-notes"></a>

## ملاحظات المنصات

- يتضمن مفتاح الذاكرة المؤقتة حجم فك الترميز ونصف قطر الطمس: فعنوان URL نفسه المعروض بحجمين يُفكّ ترميزه مرتين
  لكنه يُنزَّل مرة واحدة.
- يشغّل iOS الصور المتحركة كرسوم متحركة بالإطارات المفتاحية (حتى 600 إطار)؛ أما الصورة المتحركة الملوّنة فتعرض إطارها الأول.
- يشغّل Android الصور المتحركة ابتداءً من API 28 (`AnimatedImageDrawable`)، دون تخزين مؤقت ودون طمس.
- في Android تُرسم الحدود فوق الصورة، كما في iOS.
