---
title: "Image"
description: "वह एलिमेंट जो बंडल की गई या रिमोट इमेज दिखाता है, जिसमें प्लेसहोल्डर, ब्लर, फ़ेड, टिंटिंग और लोड इवेंट की सुविधा है।"
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---

# Image

`Image` ऐप के assets या किसी URL से एक चित्र दिखाता है। चित्र मुख्य थ्रेड के बाहर डाउनलोड और डिकोड किए जाते हैं, उन्हें उस आकार में डाउनसैंपल किया जाता है जिसमें व्यू उन्हें दिखाता है, और मेमोरी में कैश किया जाता है। एनिमेटेड GIF, WebP और APNG चित्र चलते हैं। Rust में इसे `image(src)` से बनाया जाता है, TSX में `nsh` से `<Image>` द्वारा।

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

एक asset अपना आकार जानता है: चौड़ाई या ऊँचाई न देने पर चित्र वही आकार लेता है, और इनमें से किसी एक के देने पर दूसरी asset के aspect ratio के अनुसार तय हो जाती है। URL का आकार लोड होने के बाद ही पता चलता है, इसलिए रिमोट चित्रों को चौड़ाई और ऊँचाई दें (या इनमें से किसी एक के साथ aspect ratio)।

## Sources

source (`src` और `placeholder`; Rust में `image(..)` और `.placeholder(..)`) ये मान लेता है:

| मान | उदाहरण | विवरण |
|---|---|---|
| एक asset | Rust `asset!("logo.png")`, TSX `import logo from "./logo.png"` | एक `ImageAsset` `{ url, size, scales? }`, जिसका आकार points में है: एक `@2x` फ़ाइल अपने पिक्सेल का आधा गिनी जाती है। `logo.png` के साथ `logo@2x.png` / `logo@3x.png` होने पर स्क्रीन के pixel ratio वाला वेरिएंट लोड होता है ([pixel densities](../docs/images-and-assets.md#pixel-densities))। `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` और `.heic` इम्पोर्ट किए जा सकते हैं, और `.svg` भी, जिसका आकार उसके `width` और `height` या `viewBox` से तय होता है ([SVG images](../docs/images-and-assets.md#svg-images))। |
| एक URL | `"https://example.com/a.jpg"` | डाउनलोड और कैश किया जाता है। एक ही URL के डाउनलोड व्यूज़ के बीच साझा होते हैं। |
| एक asset path | `"asset:/images/a.png"` | ऐप के assets की एक फ़ाइल। |
| एक `data:` URI | `"data:image/png;base64,iVBOR…"` | URI में मौजूद bytes, base64 या percent-encoded (`data:image/svg+xml,%3Csvg…`)। |
| एक `blob:` URL | `URL.createObjectURL(blob)` | किसी `Blob` या `File` (TSX) के bytes। चित्र उन्हें अपने पास रखता है: URL को revoke करने पर भी चित्र पूरा दिखता रहता है। |

जिन bytes से चित्र बनता है यदि वे ऐप के पास पहले से हैं, तो वह बिना किसी request के दिखता है। एक चैट चुनी गई फ़ोटो को अपलोड होने के दौरान उसके blob से दिखाती है, फिर `src` को फ़ोटो के URL पर बदल देती है:

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

समान bytes एक ही चित्र हैं: वही तस्वीर `data:` URI के रूप में और blob के रूप में एक बार ही डिकोड होती है और कैश साझा करती है।

डेवलपमेंट के दौरान assets dev server से परोसे जाते हैं; `nsh build` और `nsh package` उन्हें ऐप में कॉपी करते हैं (एक Rust crate अपनी `assets/` डायरेक्टरी को `registry.assets(assets!())` के साथ भेजता है)। देखें [images and assets](../docs/images-and-assets.md)।

> [!NOTE]
> जब ऐप [capabilities](../docs/sandbox-and-capabilities.md) घोषित करता है, तो रिमोट चित्र केवल उन होस्ट से लोड होते हैं जो उसमें सूचीबद्ध हैं; किसी अन्य होस्ट का चित्र request नहीं किया जाता और `onError` के साथ विफल होता है, जिसका `code` `"ERR_ACCESS_DENIED"` होता है। `asset:` URI, `data:` URI और `blob:` URL हमेशा लोड होते हैं।

## Props

[common props](./index.md#common-props) के अतिरिक्त (`style` का type `ImageStyle` है):

| Prop | Rust | Type | Default | विवरण |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | चित्र। |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | `src` के लोड होने तक दिखाया जाता है; बेहतर है कि यह एक लोकल asset हो। |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | चित्र को points में दी गई इस त्रिज्या से धुंधला करता है (डिकोड करते समय एक बार लागू होता है, मुख्य थ्रेड के बाहर)। |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`, Android `300` | लोड हुआ चित्र कितनी देर में fade in होता है, मिलीसेकंड में। |
| `tintColor` (style) | `.tint_color(..)` | `ColorValue` | | एक template चित्र (एक रंग में बना आइकन) का रंग बदलता है। |
| `objectFit` (style) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | चित्र अपने बॉक्स में कैसे बैठता है, CSS के `object-fit` की तरह (`object-*` क्लासेस): `"cover"` उसे भरता है और क्रॉप करता है, `"contain"` उसके अंदर फ़िट करता है, `"fill"` खींचता है, `"none"` उसे उसके प्राकृतिक आकार में दिखाता है, `"scale-down"` वही, पर जहाँ वह बड़ा है वहाँ सिकोड़कर फ़िट करता है। |
| `objectPosition` (style) | `.object_position(..)`, `.object_top()`, ... | `string` | `"center"` | `objectFit` द्वारा आकार तय होने के बाद चित्र अपने बॉक्स में कहाँ रहता है, CSS के `object-position` की तरह (`"top"`, `"25% 75%"`, `"right 10px bottom 20%"`); पूरे बॉक्स को ढकने वाला चित्र इसके आसपास से क्रॉप होता है। |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | लोडिंग शुरू हुई। |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | bytes में डाउनलोड की प्रगति (अज्ञात होने पर `total` 0 होता है), अधिकतम हर 100 ms पर। |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | लोड हो गया; स्रोत चित्र का आकार पिक्सेल में (डिकोड या डाउनसैंपल किया हुआ नहीं; SVG का आकार points में, [वेब पर वैसा जैसा ब्राउज़र मापता है](../docs/images-and-assets.md#svg-images)); variants वाले चित्र के लिए, लोड हुए variant का आकार। |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | लोडिंग विफल हुई; ऐप की capabilities जिस URL की अनुमति नहीं देतीं, उसके लिए `code` `"ERR_ACCESS_DENIED"` होता है। |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | `onLoad` या `onError` के बाद। |

`ImageStyle` व्यू styles में `tintColor` जोड़ता है, जो एक template चित्र (एक रंग में बना आइकन) का रंग बदलता है, और `objectPosition`, जो चित्र को उसके बॉक्स में रखता है ([Image position](../docs/images-and-assets.md#image-position))।

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

## Events

| Event | Rust | Payload | कब |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | कोई नहीं | लोडिंग शुरू हुई। |
| `onProgress` | `.on_progress` | `{ loaded, total }` (`ImageProgress`) | bytes आए (अधिकतम हर 100 ms पर)। |
| `onLoad` | `.on_load` | `{ size }` (`Size<DevicePixels>`) | चित्र दिखाया गया; उसका स्रोत आकार पिक्सेल में (SVG का points में, [वेब पर वैसा जैसा ब्राउज़र मापता है](../docs/images-and-assets.md#svg-images))। |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, संदेश) | लोडिंग या डिकोडिंग विफल हुई, या होस्ट ऐप की capabilities के बाहर है (`code` `"ERR_ACCESS_DENIED"`)। |
| `onLoadEnd` | `.on_load_end` | कोई नहीं | `onLoad` या `onError` के बाद। |

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

[pixel-density variants](../docs/images-and-assets.md#pixel-densities) वाला चित्र अपनी फ़ाइलों में से एक लोड करता है, और `onLoad` उसी फ़ाइल के पिक्सेल बताता है: 3× स्क्रीन पर `logo@3x.png` के लिए 192×192, जो 64×64 points के `logo.png` के लिए है। जब pixel ratio बदलता है और चित्र कोई दूसरा variant लोड करता है, तो वह उस लोड की भी सूचना देता है: `onLoadStart`, फिर नई फ़ाइल के आकार के साथ `onLoad` (या `onError`), फिर `onLoadEnd`।

किसी चित्र का आकार जानने या उसे दिखाने से पहले लोड करने के लिए, TSX में `Image.getSize(src)` और `Image.prefetch(src)` को कॉल किया जाता है (वही `Image` जो एलिमेंट को रेंडर करता है, इन्हें भी रखता है; देखें [Image API](../modules/nsh-image.md)), और Rust में `image_size(src)` और `prefetch_image(src)` को, किसी task में await करके। variants वाला इम्पोर्ट किया हुआ चित्र देने पर `Image.getSize` और `Image.prefetch` वही variant लोड करते हैं जो यह स्क्रीन दिखाती है, और `getSize` इम्पोर्ट की गई फ़ाइल के आकार के साथ resolve होता है (`logo.png` के लिए 64×64)।

## Ref methods

इसके अपने कोई नहीं।

## Platform notes

- कैश key में डिकोड आकार और blur त्रिज्या शामिल हैं: एक ही URL को दो आकारों में दिखाने पर वह दो बार डिकोड होता है पर एक बार डाउनलोड होता है।
- iOS एनिमेटेड चित्रों को keyframe animation के रूप में चलाता है (अधिकतम 600 फ़्रेम); tint किया हुआ एनिमेटेड चित्र अपना पहला फ़्रेम दिखाता है।
- Android एनिमेटेड चित्रों को API 28 (`AnimatedImageDrawable`) से चलाता है, बिना कैश और बिना blur के।
- Android पर borders चित्र के ऊपर बनाए जाते हैं, जैसा iOS पर।
