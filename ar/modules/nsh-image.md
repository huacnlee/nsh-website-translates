---
title: "Image"
description: "Image: عنصر الصورة، بالإضافة إلى Image.getSize وImage.prefetch للحصول على معلومات الصورة وتحميلها مسبقًا."
order: 2.2
source_hash: 028257cecdec706c
---

# Image

`nsh` يصدّر `Image`، وهو عنصر [`<Image>`](../elements/image.md) الذي يعرض الصور. وتستعلم الوحدة `Image` نفسها أيضًا من أداة تحميل الصور الأصلية عن الصور دون عرضها: أي عن حجمها، وعن تحميلها قبل عرضها.

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` مكوّن يحمل دالتين: `<Image src=…>` تعرض عنصر الصورة الأصلي (ينشئه المترجم في موضعه، كما يفعل مع `<View>`)، أما `Image.getSize` / `Image.prefetch` فتُستدعيان عليه مباشرة.

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

راجع [الصور والأصول](../docs/images-and-assets.md) للاطلاع على الدليل.

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

تحمّل الصورة وتُنجَز بحجمها بالبكسل (حجم الصورة المصدر، لا نسخة مصغّرة منها؛ أما حجم SVG الأصلي فبالنقاط، [وعلى الويب كما يقيسه المتصفح](../docs/images-and-assets.md#svg-images)). وعند استيراد صورة لها [متغيرات بكثافات بكسل مختلفة](../docs/images-and-assets.md#pixel-densities) تحمّل الدالة المتغير الذي تحمّله العناصر على هذه الشاشة، وتُنجَز بحجم الملف المستورد أيًّا كان المتغير الذي حمّلته (أما `<Image>` التي تعرضها فتُبلغ عن بكسلات المتغير المحمَّل في `onLoad`). تبقى البايتات المحمّلة في الذاكرة، فلا ينزّلها `<Image>` الذي يعرضها بعد ذلك مرة أخرى. ويُرفَض الوعد إذا تعذّر تحميل الصورة.

```tsx
import { Image, signal } from "nsh";

const url = "https://picsum.photos/seed/nsh/1200/800";
const ratio = signal(1);

Image.getSize(url).then(({ width, height }) => ratio.set(width / height));

<Image src={url} style={{ width: "100%", aspectRatio: ratio() }} />;
```

## Image.prefetch

```ts
prefetch(src: string | ImageAsset): Promise<void>;
```

تحمّل صورة قبل عرضها. تُنجَز عندما تصبح بايتاتها في الذاكرة، وتُرفَض مع الخطأ إذا تعذّر تحميل الصورة. وعند استيراد صورة لها متغيرات بكثافات بكسل مختلفة، تحمّل المتغير الذي تحمّله العناصر على هذه الشاشة. استخدمها للصفحة التالية في معرض صور، أو للصورة التي تظهر خلف نقرة.

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

<a id="related"></a>

## ذات صلة

- [`<Image>`](../elements/image.md): `src` و`placeholder` والنمط `objectFit` و`onLoad` و`onProgress` و`onError` وبقية الخصائص.
- استيراد ملف صورة (`import logo from "./logo.png"`) يعطي `ImageAsset` (`{ url, size, scales? }`، بحجم محسوب بالنقاط) تقبله `<Image src>` و`drawImage` الخاصة بالـ canvas.

> [!NOTE]
> عندما يصرّح تطبيقك بـ `capabilities` في `nsh.json`، يجب السماح بـ `getSize` و`prefetch` لعناوين URL البعيدة ضمن `network`، مثل `fetch`. أما عنوان URL خارجها فلا يُطلَب أبدًا: يُرفَض الوعد بـ `Error` قيمة `code` فيه هي `"ERR_ACCESS_DENIED"`، و`permission` `"network"` و`resource` عنوان URL. راجع [Sandbox and capabilities](../docs/sandbox-and-capabilities.md).
