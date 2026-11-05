---
title: "الصور والأصول"
description: "عرض الصور في Rust وTSX - أصول التطبيق وملفات @2x، وصور SVG، وعناوين URL البعيدة، وأوضاع تغيير الحجم، والعناصر النائبة، والتمويه، والتلوين، وأحداث التحميل، وقراءة حجم الصورة أو تحميلها مسبقًا."
order: 36
group: ui
source_hash: 0ac8dbc4cc613a89
---

# الصور والأصول

يعرض عنصر الصورة (`image(..)` في Rust، `<Image>` في TSX) صورة نقطية أو رسمًا بصيغة SVG: ملفًا مرفقًا مع التطبيق، أو صورة منزّلة من عنوان URL. تُقرأ الصور وتُفك ترميزها خارج الخيط الرئيسي، وتُصغَّر إلى الحجم الذي يعرضها به العرض، وتُخزَّن مؤقتًا؛ ولا يعرض الخيط الرئيسي سوى النتيجة المفكوكة.

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

image(LOGO)
image("https://picsum.photos/seed/nsh/600/400").w_full().h(px(200.0)).rounded(px(12.0))
```

```tsx tabs
import { Image } from "nsh";
import logo from "./assets/logo@2x.png";

<Image src={logo} />
<Image src="https://picsum.photos/seed/nsh/600/400" style={{ width: "100%", height: 200, borderRadius: 12 }} />
```

تُسرد خصائص العنصر في [image](../elements/image.md).

<a id="images-in-the-app"></a>

## الصور داخل التطبيق

تحتفظ حزمة Rust بملفاتها في المجلد `assets/`: `asset!("logo@2x.png")` (المسار نسبةً إلى `assets/`) هو `ImageAsset`، `{ url, size, scales }`، يُقرأ عند ترجمة الحزمة، ويشحن `registry.assets(assets!())` في دالة `#[native_module]` الخاصة بالحزمة كل ملف في المجلد مع التطبيق. في TSX، استورد ملف الصورة كما تستورد وحدة: يعطيك الاستيراد `ImageAsset`، `{ url, size, scales? }`، وتشحن أداة التجميع الملف مع التطبيق:

```rust tabs
const LOGO: ImageAsset = asset!("logo@2x.png");

// LOGO.url: "asset:/@my-app/logo@2x.png", LOGO.size: 64 × 64 points

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}
```

```tsx tabs
import logo from "./assets/logo@2x.png";

logo; // { url: "asset:/assets/logo@2x.png", size: { width: 64, height: 64 } }
```

الملفات المدعومة: `.png` و`.jpg` و`.jpeg` و`.gif` و`.webp` و`.heic` و`.svg` ([صور SVG](#svg-images)).

**الأحجام بالنقاط.** تدل اللاحقة `@2x` أو `@3x` في اسم الملف على أن الملف يحوي 2 أو 3 بكسلات لكل نقطة، فالملف `logo@2x.png` بأبعاد 128×128 بكسل هو أصل بأبعاد 64×64 نقطة. وبدون لاحقة يساوي كل بكسل نقطة واحدة. الملف الذي يحمل اسمه لاحقة هو الذي يُعرض، أما الملف الذي لا تحمل تسميته لاحقة فتُعرض [متغيرات كثافة البكسلات](#pixel-densities) الخاصة به إن وُجدت.

**الحجم الطبيعي.** تُرتَّب الصورة القادمة من أصل بحجمها الطبيعي حين يترك نمطها العرض أو الارتفاع مفتوحًا، لذا لا يحتاج `image(LOGO)` و`<Image src={logo} />` إلى نمط. اضبط بُعدًا واحدًا مع نسبة الأبعاد، أو البُعدين معًا، لتغيير حجمها.

في Rust، يؤدي الملف المفقود أو التالف إلى فشل البناء، ويؤدي تغيير الملف إلى إعادة بناء الحزمة. في TSX، تُحلَّل مسارات الأصول نسبةً إلى الوحدة المستوردة، ويكون `url` الخاص بها نسبيًا إلى جذر التطبيق (مجلد نقطة الدخول). ينسخها `nsh build` إلى `out/assets/`، ويضعها `nsh package` في التطبيق، وأثناء التطوير يقدّمها خادم التطوير.

> [!TIP]
> في TSX، يقبل `src` أيضًا سلاسل `asset:/path`، والملفات المستوردة هي وحدها المضمون شحنها. المسار الذي لا يُستورد أبدًا يعمل مع خادم التطوير الذي يقدّم مجلد التطبيق كاملًا، لكنه يكون مفقودًا في التطبيقات المحزّمة. استورد كل صورة تستخدمها. أما حزمة Rust فتشحن مجلد `assets/` كاملًا عبر `assets!()`.

<a id="pixel-densities"></a>

### كثافات البكسلات

سمِّ الملف بدون لاحقة وضع نسخه الأعلى كثافة بجانبه، فيحمّل التطبيق النسخة التي تناسب الشاشة:

```text
assets/
├── logo.png       64×64 pixels
├── logo@2x.png    128×128
└── logo@3x.png    192×192
```

```rust tabs
const LOGO: ImageAsset = asset!("logo.png");

// LOGO.size: 64 × 64 points, LOGO.scales: [1.0, 2.0, 3.0]
```

```tsx tabs
import logo from "./assets/logo.png";

logo; // { url: "asset:/assets/logo.png", size: { width: 64, height: 64 }, scales: [1, 2, 3] }
```

- يبحث `asset!` وأداة التجميع عن الملفات المجاورة `@1.5x` و`@2x` و`@3x` و`@4x` لصورة سُمّيت بدون لاحقة. يسردها `scales`، مع 1 للملف المسمّى؛ والصورة التي لا ملفات مجاورة لها ليست لها مقاييس (وتُستورد في TSX على أنها `{ url, size }`). تشحن أداة التجميع الملفات المجاورة التي تجدها، ويشحن `assets!()` المجلد كاملًا.
- تحمّل الصورة أصغر مقياس لا يقل عن نسبة بكسلات الشاشة، وإلا فأكبر مقياس، كما يختار React Native: `logo.png` على شاشة 1×، و`logo@2x.png` على شاشة 2×، و`logo@3x.png` على هاتف 3× (وعند 2.625). في الويب لا يُنزَّل سوى ذلك الملف.
- عندما تتغير نسبة البكسلات (نافذة نُقلت إلى شاشة أخرى، أو تكبير المتصفح)، تُعاد تحميل الصور التي يتغير اختيارها، مع [أحداث التحميل](#load-events) الخاصة بها. ويبقى حجمها هو حجم الملف المسمّى، بالنقاط.
- النسخة التي لا تساوي بكسلاتها حجم الملف المسمّى مضروبًا في مقياسها تنتج تحذيرًا عند البناء في TSX، وتُفشل البناء في Rust.
- الملف الذي يحمل اسمه لاحقة كثافة (`./logo@3x.png`، `asset!("logo@3x.png")`) هو ذلك الملف وحده.
- [صورة SVG](#svg-images) تُرسم للشاشة بأي نسبة، فلا تُشحن لها نسخ.

ملف واحد يكفي أيضًا: صدّره بأعلى كثافة تحتاجها (`@3x` لأوضح نتيجة على كل الهواتف) وسمِّه بلاحقته؛ فالصور تُصغَّر إلى حجم الشاشة عند فك ترميزها. أما النسخ المتعددة فتتيح لكل شاشة أن تنزّل وتفك وتحتفظ بالملف الذي يناسبها.

<a id="svg-images"></a>

## صور SVG

استورد ملف `.svg` مثل أي صورة. حجمه بالنقاط هو `width` و`height` (أو أحدهما، والآخر من نسبة أبعاد `viewBox`)، وإلا فهو `viewBox`: بكسل CSS في SVG يساوي نقطة، وتترك اللاحقات `@2x` ملفات SVG كما هي.

```tsx
import logo from "./assets/logo.svg"; // <svg width="120" height="40" …>
import star from "./assets/star.svg"; // <svg viewBox="0 0 24 24" …>

logo; // { url: "asset:/assets/logo.svg", size: { width: 120, height: 40 } }

<Image src={logo} />
<Image src={star} style={{ width: 36, height: 36, tintColor: "#0969da" }} />
```

صورة SVG واضحة بالحجم الذي تُعرض به. يرسمها المتصفح متجهات؛ وترسمها iOS وmacOS وAndroid بالحجم الذي يعرضها به العرض، بالبكسلات، عند تحميل الصورة (كما تصغّر الصور النقطية؛ والعرض الذي يكبر لاحقًا يكبّر ذلك الرسم إلى أن تُحمَّل الصورة من جديد)؛ وترسمها Windows وLinux وGPUI مرة واحدة بأربعة بكسلات لكل نقطة (حتى 2048 بكسلًا للضلع) ثم تكبّرها أو تصغّرها لكل عرض. وكل ما عدا ذلك يعمل كما في الصور النقطية: `objectFit` و`tintColor` (عبر الأشكال المعتمة في SVG، فتتبع الأيقونات أحادية اللون السمة) والمرشّحات و`blurRadius` والعناصر النائبة وأحداث التحميل و`Image.getSize` و`Image.prefetch`. يُبلغ `onLoad` و`Image.getSize` عن حجم SVG بالنقاط الكاملة؛ أما الصورة فتُرتَّب بحجمها الدقيق. تُحمَّل ملفات SVG البعيدة بالطريقة نفسها، عبر التنزيلات نفسها وفحوص [القدرات](./sandbox-and-capabilities.md)؛ ويتعرّف NSH على SVG من محتواه (ومضغوطًا بـ gzip أيضًا، `.svgz`) أيًّا كان ما ينتهي به عنوان URL.

**ما ترسمه المنصات الأصلية.** ترسم iOS وmacOS وAndroid وWindows وLinux وGPUI ملفات SVG بمصيِّر واحد (resvg)، فيبدو الرسم متطابقًا على كل منها: الأشكال والمسارات، والتعبئات والحدود، والتدرجات والأنماط، ومسارات القص والأقنعة، والشفافية، والمرشّحات والتحويلات. أما النصوص (`<text>`) والحركة (SMIL وCSS) والصور المضمَّنة (`<image>`) وHTML (`<foreignObject>`) فتظهر في المتصفح؛ وترسم المنصات الأصلية بقية SVG ساكنةً، ويسمّي `nsh build` الملفات التي تستخدمها. صدّر النص كخطوط محيطية (مسارات) للحصول على النتيجة نفسها في كل مكان.

**صورة مكتفية بذاتها.** على المنصات الأصلية لا ترسم SVG إلا ما تحويه: الملفات وعناوين URL وصور `data:` والمستندات الأخرى التي تشير إليها تُهمَل. ترسم المنصات الأصلية ملفات SVG، البعيدة منها أيضًا، ضمن حدود تُبقي الذاكرة تحت السيطرة: مستند حتى 16 MiB (والمضغوط بعد فك ضغطه)، ورسم حتى 8192 بكسلًا للضلع و4096 × 4096 بكسلًا في المجموع (64 MiB؛ والأكبر يُرسم أصغر)، وطبقات (مجموعات ذات شفافية وأقنعة ومسارات قص ومرشّحات، يرسمها المصيِّر منفصلة) حتى 256 MiB دفعة واحدة. وملف SVG الذي يتجاوز حد المستند أو الطبقات يفشل تحميله، مع `onError`.

**الأحجام المبلَّغ عنها في الويب.** يقيس المتصفح ملفات SVG بنفسه، المستوردة والبعيدة: يُبلغ `onLoad` و`Image.getSize` عن `width` و`height` الخاصين بـ SVG إن وُجدا، وإلا فعن الحجم الذي يعطيه المتصفح، والذي يشتقه المتصفحون عادةً من القيمة الافتراضية 300 × 150 ونسبة أبعاد `viewBox`. أما ملفات SVG المستوردة فتُرتَّب بحجم أداة التجميع على كل منصة. أعطِ ملفات SVG الخاصة بك `width` و`height` للحصول على الحجم المبلَّغ نفسه في كل مكان.

<a id="remote-images"></a>

## الصور البعيدة

أعطِ العنصر عنوان URL: سلسلة نصية في Rust (ودالة مغلقة closure للعنوان الذي يتغير)، وسلسلة عنوان URL في TSX:

```rust tabs
image(move || user.with(|u| u.avatar_url.clone()))
    .size(px(48.0))
    .rounded(px(24.0))
    .bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={user().avatarUrl} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaeef2" }} />
```

- **حدّد حجمًا للصور البعيدة.** حجمها مجهول إلى أن تُحمَّل، فبدون عرض وارتفاع (أو أحدهما مع نسبة أبعاد) ينهار ارتفاعها إلى صفر.
- **لون الخلفية** يظهر أثناء تحميل الصورة، أو استخدم عنصرًا نائبًا (أدناه).
- التنزيلات مشتركة: عدة عروض تعرض عنوان URL نفسه تنزّله مرة واحدة، حتى لو فكّت ترميزه بأحجام مختلفة. والتنزيل الذي لم يعد أحد ينتظره يُلغى.
- تُخزَّن الصور المفكوكة مؤقتًا في الذاكرة (ويُفرَّغ المخزن عند ضغط الذاكرة)، بمفتاح يتألف من عنوان URL وحجم فك الترميز ونصف قطر التمويه.
- عندما يعلن التطبيق [القدرات](./sandbox-and-capabilities.md)، يجب أن يكون مضيف الصورة مسموحًا به ضمن `network`؛ والصورة المرفوضة تفشل مع حدث الخطأ الخاص بها.

<a id="kept-on-disk"></a>

### الحفظ على القرص

تُحفظ الصور المنزّلة على القرص أيضًا، كما أرسلها الخادم، فالتطبيق الذي يُفتح مرة أخرى (محادثة مليئة بالصور الرمزية والصور، أو خلاصة) يعرض الصور التي عرضها سابقًا دون تنزيلها، حتى بلا اتصال. ولا يحتاج التطبيق إلى أي إعداد: كل صورة بعنوان `http://` أو `https://` تمر عبر الذاكرة المؤقتة على iOS وAndroid وmacOS وWindows وLinux وGPUI، وفي المتصفح تؤدي ذاكرة HTTP المؤقتة الخاصة بالمتصفح الدور نفسه.

تتبع الذاكرة المؤقتة ترويسات التخزين المؤقت في HTTP الخاصة بالخادم:

- تُحفظ الصورة ما لم تقل الاستجابة `Cache-Control: no-store`.
- تُستخدم دون طلب ما دامت صالحة: طوال `max-age`، وإلا حتى `Expires`، وإلا لعُشر الوقت المنقضي منذ `Last-Modified` (بحد أقصى أسبوع).
- بعد ذلك يُتحقق منها مع الخادم (`If-None-Match` مع `ETag`، و`If-Modified-Since` مع `Last-Modified`): الصورة التي لم تتغير (`304`) تُستخدم من جديد دون تنزيلها، والتي تغيرت تحلّ محلها نسخة جديدة.
- عندما يفشل الطلب (لا شبكة) أو يعاني الخادم من خطأ (`5xx`)، تُعرض النسخة المحفوظة، ما لم تقل الاستجابة `must-revalidate` أو `no-cache`.

لكل تطبيق ذاكرة مؤقتة خاصة به بحجم 256 MiB؛ وعند تجاوزه تُحذف الصور الأقل استخدامًا مؤخرًا أولًا. وتتشاركها عدة عروض وأسطح وعمليات تابعة لتطبيق واحد بأمان. وتختار التطبيقات المضيفة موضعها وحجمها، أو تعطّلها:

```rust tabs
// macOS, Windows, Linux and GPUI: the AppView's options (or AppView::set_cache).
let mut cache = CacheOptions::at(CacheLocation::Dir(caches.join("nsh")));  // each app in <dir>/<app id>
cache.images = CachePolicy::MaxSize(ByteSize::mib(64));                     // CachePolicy::Off: none
let view = AppView::new(mtm, AppOptions { cache, ..AppOptions::default() });
```

```swift tabs
// iOS: NshAppView, before loading.
app.cacheOptions = NshCacheOptions(location: .directory(caches.appendingPathComponent("nsh")),
                                   images: .maxSize(megabytes: 64))   // .off: none
```

```java tabs
// Android: NshView, before loading.
nsh.setCacheOptions(NshCacheOptions.builder()
        .location(new File(getCacheDir(), "nsh"))
        .imagesMaxMegabytes(64)          // imagesOff(): none
        .build());
```

لا يحتفظ `CacheLocation::Off` (`.off`، `noDiskCache()`) بشيء على القرص.

افتراضيًا تكون الذاكرة المؤقتة في مجلد التخزين المؤقت للنظام: `Library/Caches/nsh` على iOS، و`nsh` في مجلد التخزين المؤقت على Android، و`~/Library/Caches` على macOS، و`%LOCALAPPDATA%` على Windows، و`$XDG_CACHE_HOME` (`~/.cache`) على Linux، ولكل تطبيق `<app id>/images` خاص به هناك. وقد يمسح النظام هذه المجلدات عندما يحتاج إلى المساحة.

<a id="resize-modes"></a>

## أوضاع تغيير الحجم

يحدد النمط `objectFit`، المقابل لـ `object-fit` في CSS (`.object_fit(..)` في Rust)، كيف تملأ الصورة صندوقًا مختلف الشكل:

| القيمة | النتيجة |
|---|---|
| `"cover"` (`ResizeMode::Cover`، الافتراضي) | تملأ الصندوق مع الحفاظ على نسبة الأبعاد، وتقص ما يفيض |
| `"contain"` (`ResizeMode::Contain`) | تتسع داخل الصندوق مع الحفاظ على نسبة الأبعاد، تاركةً أشرطة فارغة |
| `"fill"` (`ResizeMode::Stretch`) | تملأ الصندوق تمامًا، مشوِّهةً الصورة |
| `"none"` (`ResizeMode::Center`) | الحجم الطبيعي، موضوعة عند `objectPosition` (في المنتصف افتراضيًا) |
| `"scale-down"` (`ResizeMode::ScaleDown`) | الحجم الطبيعي، مصغّرة لتتسع حيث تكون أكبر |

```rust tabs
image(photo).object_fit(ResizeMode::Contain).size(px(140.0)).bg(rgb(0xeaeef2))
```

```tsx tabs
<Image src={photo} style={{ width: 140, height: 140, objectFit: "contain", backgroundColor: "#eaeef2" }} />
```

تضبط فئات Tailwind ‏`object-cover` و`object-contain` و`object-fill` و`object-none` و`object-scale-down` النمط نفسه.

<a id="image-position"></a>

### موضع الصورة

موضع الصورة المضبوطة الحجم داخل صندوقها يحدده النمط `objectPosition` (`.object_position(..)` و`.object_top()`، ... في Rust)، المقابل لـ `object-position` في CSS: المنتصف افتراضيًا. تُقص الصورة التي تغطي الصندوق حول هذا الموضع، وتتحرك الصورة المحتواة ضمن أشرطتها. يقبل كلمات مفتاحية (`"top"`، `"left bottom"`) ونسبًا مئوية وأطوالًا (`"25% 75%"`، `"10px 0"`) وحوافّ مع إزاحات (`"right 10px bottom 20%"`). وبهذه الطريقة تُظهر صورة طويلة في فقاعة محادثة أعلاها:

```rust tabs
image(photo).object_fit(ResizeMode::Cover).object_top().w(px(220.0)).h(px(160.0)).rounded(px(16.0))
```

```tsx tabs
<Image src={photo} style={{ width: 220, height: 160, borderRadius: 16, objectPosition: "top" }} />
```

فئات Tailwind هي فئات Tailwind نفسها: `object-top` و`object-bottom` و`object-left` و`object-right` و`object-center` و`object-top-left` و`object-top-right` و`object-bottom-left` و`object-bottom-right` والقيم التعسفية (`object-[25%_75%]`).

<a id="styling-images"></a>

## تنسيق الصور

الصور عروض: تقبل أنصاف أقطار الزوايا (لكل زاوية أيضًا) والحدود والظلال والشفافية والتحويلات. والزوايا تقص الصورة.

```rust tabs
image(avatar).size(px(90.0)).rounded(px(45.0)).border(px(3.0)).border_color(rgb(0x8250df))
```

```tsx tabs
<Image src={avatar} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#8250df" }} />
```

- **التلوين** (`.tint_color(..)` في Rust، والنمط `tintColor` في TSX) يعيد تلوين البكسلات المعتمة في الصورة: استخدمه للأيقونات أحادية اللون التي تتبع السمة.
- **المرشّحات** (`.grayscale(..)` و`.sepia(..)` و`.blur(..)`؛ `filter` في TSX) تُطبَّق على الصور في المنصتين ([المرشّحات](./styling.md#filters-and-blending)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(AdaptiveColor::rgb(0x0969da, 0x58a6ff))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: active() ? "#0969da" : "#6e7781" }} />
```

<a id="placeholders-fading-and-blur"></a>

## العناصر النائبة والتلاشي والتمويه

| الخاصية | Rust | الوصف |
|---|---|---|
| `placeholder` | `.placeholder(..)` | صورة تُعرض إلى أن يكتمل تحميل `src`، وهي عنوان URL أو أصل؛ والأفضل أن تكون أصلًا محليًا |
| `fadeDuration` | `.fade_duration(ms)` | عدد الميلي ثانية التي تتلاشى خلالها الصورة المحمّلة ظاهرةً. الافتراضي 0 على iOS، و300 على Android |
| `blurRadius` | `.blur_radius(px(..))` | تمويه الصورة بنصف القطر هذا بالنقاط، يُطبَّق مرة واحدة عند فك الترميز |

```rust tabs
image(move || format!("https://picsum.photos/seed/{}/300/300", id.get()))
    .placeholder(PLACEHOLDER)
    .fade_duration(250.0)
    .size(px(100.0))
    .rounded(px(12.0))
image(cover).blur_radius(px(16.0)).absolute().inset_0()
```

```tsx tabs
<Image
  src={`https://picsum.photos/seed/${id()}/300/300`}
  placeholder={placeholder}
  fadeDuration={250}
  style={{ width: 100, height: 100, borderRadius: 12 }}
/>
<Image src={cover} blurRadius={16} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
```

<a id="animated-images"></a>

## الصور المتحركة

تعمل ملفات GIF وWebP وAPNG المتحركة تلقائيًا، سواء كانت أصولًا أو من عناوين URL. وتقبل الأنماط نفسها، بما فيها `objectFit`؛ والصورة المتحركة الملوّنة تعرض إطارها الأول على iOS.

<a id="load-events"></a>

## أحداث التحميل

| الحدث | Rust | الحمولة | متى |
|---|---|---|---|
| `onLoadStart` | `.on_load_start(..)` | | يبدأ التحميل |
| `onProgress` | `.on_progress(..)` | `{ loaded, total }` بالبايتات (`total` يساوي 0 عندما يكون مجهولًا) | أثناء التنزيل، مرة كل 100 ms على الأكثر |
| `onLoad` | `.on_load(..)` | `{ size }` | الصورة جاهزة؛ حجم المصدر بالبكسلات (وحجم SVG بالنقاط، [وفي الويب كما يقيسه المتصفح](#svg-images)) |
| `onError` | `.on_error(..)` | `{ message }` (`&str` في Rust) | فشل التحميل أو فك الترميز |
| `onLoadEnd` | `.on_load_end(..)` | | بعد `onLoad` أو `onError` |

```rust tabs
let status = signal(SharedString::from("loading…"));

image(url)
    .on_load(move |size: &Size<DevicePixels>| status.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| status.set(message.to_owned().into()))
    .w(px(90.0))
    .h(px(60.0))
```

```tsx tabs
const status = signal("loading…");

<Image
  src={url}
  onLoad={({ size }) => status.set(`${size.width}×${size.height}`)}
  onError={(e) => status.set(e.message)}
  style={{ width: 90, height: 60 }}
/>
```

يُبلغ حدث التحميل عن حجم الصورة المصدر، لا عن الحجم الذي فُكَّ ترميزها به.

الصورة ذات [متغيرات كثافة البكسلات](#pixel-densities) تحمّل أحد ملفاتها، ويُبلغ حدث التحميل عن بكسلات ذلك الملف: 192×192 للملف `logo@3x.png` على شاشة 3×، بينما يُحلَّل `Image.getSize(logo)` بأبعاد 64×64 للملف المستورد. وعندما تتغير نسبة البكسلات وتحمّل الصورة متغيرًا آخر، يُبلغ ذلك التحميل عن أحداثه أيضًا: `onLoadStart`، ثم `onLoad` بحجم الملف الجديد (أو `onError`)، ثم `onLoadEnd`.
<a id="an-images-size-and-prefetching"></a>

## حجم الصورة والتحميل المسبق

يمكن قياس الصور التي ليست على الشاشة وتحميلها مسبقًا: `image_size(..)` و`prefetch_image(..)` في Rust، و`Image.getSize` و`Image.prefetch` (على نفس `Image` الذي يعرض العنصر) في TSX:

```rust tabs
spawn(async move {
    // Ok(ImageSize { width, height }), in pixels.
    let size = image_size("https://example.com/photo.jpg").await;
    // Ok(()) once the bytes are in memory.
    let loaded = prefetch_image("https://example.com/next.jpg").await;
});
```

```tsx tabs
import { Image } from "nsh";

const size = await Image.getSize("https://example.com/photo.jpg");   // { width, height } in pixels
await Image.prefetch("https://example.com/next.jpg");                // once the bytes are in memory
```

| Rust | TSX | القيمة المُرجعة |
|---|---|---|
| `image_size(src)` | `Image.getSize(src)` | حجم الصورة بالبكسل (وحجم صورة SVG بالنقاط، [وعلى الويب كما يقيسه المتصفح](#svg-images))؛ وخطأ عند تعذّر تحميلها |
| `prefetch_image(src)` | `Image.prefetch(src)` | لا شيء، بعد تحميل بايتات الصورة؛ وخطأ عند تعذّر تحميلها |

في TSX، تكون `src` سلسلة URL أو صورة مستوردة. وفي حالة الصورة المستوردة التي لها [متغيرات](#pixel-densities)، تحمّل الدالتان المتغير الذي تحمّله العروض على هذه الشاشة، ويُرجع `getSize` حجم الملف المستورد. وتحتفظ كلتاهما بالبايتات التي تم تنزيلها للعروض التي ستعرض الصورة لاحقًا، فتظهر الصورة التي حُمّلت مسبقًا قبل عرضها دون تنزيل.

من الاستخدامات الشائعة تحديد حجم صورة بعيدة وفق نسبة أبعادها:

```rust tabs
fn remote_image(url: &'static str) -> impl IntoElement {
    let ratio = signal(1.0_f32);
    spawn(async move {
        if let Ok(size) = image_size(url).await {
            ratio.set(size.width.0 as f32 / size.height.0 as f32);
        }
    });
    image(url).w_full().aspect_ratio(ratio)
}
```

```tsx tabs
function RemoteImage(props: { url: string }) {
  const ratio = signal(1);
  Image.getSize(props.url).then((s) => ratio.set(s.width / s.height));
  return <Image src={props.url} style={{ width: "100%", aspectRatio: ratio() }} />;
}
```

<a id="other-assets"></a>

## الأصول الأخرى

| الملف | Rust (`asset!`) | الاستيراد في TSX | الصفحة |
|---|---|---|---|
| `.ttf` و`.otf` و`.woff` و`.woff2` | `FontAsset` مع اسم عائلة الخط | اسم عائلة الخط | [الخطوط](./fonts.md) |
| `.json` وغيرها من الملفات | `FileAsset` مع URI الخاص بها | `.json`: القيمة المحلَّلة، مضمّنة في السكريبت | [بنية المشروع](./project-structure.md#modules) |

تُسجَّل الخطوط قبل الإطار الأول في كليهما.

<a id="reading-a-file-at-run-time"></a>

### قراءة ملف أثناء التشغيل

يقرأ `fetch` ملفًا يشحنه التطبيق عبر عنوان `asset:/` الخاص به، في TSX وRust على حد سواء، وعلى جميع المنصات. تحمل الصورة المستوردة عنوانها (`url`)، وتحصل ملفات حزمة Rust على عناوينها من `asset!` (`FileAsset::uri`) و`assets!()`:

```rust tabs
const GREETING: FileAsset = asset!("locales/en.txt");

#[component]
fn Greeting() -> impl IntoElement {
    let greeting = signal(String::new());
    spawn(async move {
        match fetch(GREETING.uri).await {
            Ok(response) => greeting.set(response.text()),
            Err(error) => greeting.set(error),
        }
    });
    text(move || greeting.get())
}
```

```tsx tabs
import flag from "./images/flag.png";

const bytes = await (await fetch(flag.url)).bytes();
```

يقرأ المحرك الملف من ملفات التطبيق خارج خيطه (ومن خادم التطوير أثناء `nsh run`)، دون الحاجة إلى أي صلاحية، لأنها ملفات التطبيق نفسه. ينزّل تطبيق الويب ما لم تحمّله الصفحة مسبقًا من المكان الذي يقدّم منه أصوله. الاستجابة هي `200` تحتوي على بايتات الملف و`Content-Length` الخاص به و`Content-Type` الذي يحدده امتداده (`image/png`، `application/json`، ...)، وتكون `url` الخاصة بها هي عنوان `asset:/` مهما كانت طريقة وصول الملف؛ أما الملف الذي لا يشحنه التطبيق فيُرفض كخطأ شبكة يذكر اسمه. يسمّي العنوان الملف بمساره داخل ملفات التطبيق، ويقرأه الطلب بواسطة `GET` (أو `HEAD`): أما العنوان الذي يخرج مساره منها (`..`، أو مسار مطلق) والطلب الذي يستخدم method آخر فيُرفضان بالطريقة نفسها، قبل قراءة أي شيء أو تنزيله.

<a id="a-modules-own-url"></a>

### عنوان URL الخاص بالوحدة

في TSX، يمثّل `import.meta.url` عنوان URL للوحدة المكتوب فيها، فيسمّي `new URL("./data.json", import.meta.url)` ملفًا بجوارها. تكون عناوين وحدات التطبيق المكتبي المحلي أو المُحزَّم عناوين `file:` في مجلد التطبيق، ويقرؤها `fs/promises` بموجب منح `${pluginDir}`؛ وعناوين وحدات تطبيق الويب هي عناوين الصفحة؛ أما عناوين وحدات تطبيق الجوال المُحزَّم فهي عناوين `asset:/` مثل عناوين الصور المستوردة. استورد الصورة لشحنها: فالعنوان المُنشأ بهذه الطريقة يسمّي الملف ولا يضمّنه في الحزمة.

كما تُرسم الصور النقطية على canvas باستخدام `draw_image` / `drawImage` ([Canvas](./canvas.md))، وتغني التدرجات اللونية عن كثير من الصور الزخرفية ([التنسيق](./styling.md#gradients)).

<a id="related"></a>

## ذات صلة

- [عنصر الصورة](../elements/image.md): جميع الخصائص، مع `getSize` و`prefetch`.
- [القوائم](./lists.md): القوائم الطويلة من الصور تعيد تدوير عروضها.
