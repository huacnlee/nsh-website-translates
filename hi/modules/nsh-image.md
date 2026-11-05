---
title: "Image"
description: "Image: इमेज एलिमेंट, साथ ही इमेज की जानकारी प्राप्त करने और उसे पहले से लोड करने के लिए Image.getSize और Image.prefetch।"
order: 2.2
source_hash: 028257cecdec706c
---

# Image

`nsh` `Image` को एक्सपोर्ट करता है, जो इमेज दिखाने वाला [`<Image>`](../elements/image.md) एलिमेंट है। यही `Image` नेटिव इमेज लोडर से इमेज के बारे में जानकारी भी माँगता है, उन्हें दिखाए बिना: उनका आकार, और उन्हें दिखाए जाने से पहले लोड करना।

```ts
import { Image, type PixelSize } from "nsh";
```

`Image` एक कॉम्पोनेंट है जिसमें दो फ़ंक्शन हैं: `<Image src=…>` नेटिव इमेज व्यू को रेंडर करता है (कंपाइलर इसे उसी जगह बनाता है, जैसे वह `<View>` को बनाता है), और `Image.getSize` / `Image.prefetch` को सीधे उसी पर कॉल किया जाता है।

```ts
const Image: ((props: ImageProps) => JSX.Element) & {
  getSize(src: string | ImageAsset): Promise<PixelSize>;
  prefetch(src: string | ImageAsset): Promise<void>;
};
```

गाइड के लिए [Images and assets](../docs/images-and-assets.md) देखें।

## Image.getSize

```ts
getSize(src: string | ImageAsset): Promise<PixelSize>;

interface PixelSize {
  width: number;   // pixels (an SVG's: points)
  height: number;
}
```

इमेज को लोड करता है और उसका आकार पिक्सेल में लेकर resolve होता है (स्रोत इमेज का आकार, न कि डाउनसैंपल की गई कॉपी का; SVG का इंट्रिंसिक आकार पॉइंट्स में, [वेब पर वैसे जैसे ब्राउज़र उसे मापता है](../docs/images-and-assets.md#svg-images))। [पिक्सेल-डेंसिटी वैरिएंट](../docs/images-and-assets.md#pixel-densities) वाली इंपोर्ट की गई इमेज के लिए, यह वही वैरिएंट लोड करता है जो व्यू इस स्क्रीन पर लोड करते हैं, और इंपोर्ट की गई फ़ाइल के आकार के साथ resolve होता है, चाहे उसने कोई भी वैरिएंट लोड किया हो (उसे दिखाने वाला `<Image>` `onLoad` में लोड किए गए वैरिएंट के पिक्सेल रिपोर्ट करता है)। लोड किए गए बाइट्स मेमोरी में रहते हैं, इसलिए उसे अगला दिखाने वाला `<Image>` उसे दोबारा डाउनलोड नहीं करता। अगर इमेज लोड नहीं हो पाती, तो promise reject हो जाता है।

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

इमेज को दिखाने से पहले ही लोड कर लेता है। जैसे ही उसके बाइट्स मेमोरी में आ जाते हैं, resolve हो जाता है, और इमेज लोड न हो पाने पर एरर के साथ reject हो जाता है। पिक्सेल-डेंसिटी वैरिएंट वाली इंपोर्ट की गई इमेज के लिए, यह वही वैरिएंट लोड करता है जो व्यू इस स्क्रीन पर लोड करते हैं। इसका उपयोग गैलरी के अगले पेज या टैप के पीछे मौजूद इमेज के लिए करें।

```ts
const next = photos.slice(index + 1, index + 4);
next.forEach((p) => Image.prefetch(p.url).catch(() => {})); // the <Image> reports its own error later
```

## Related

- [`<Image>`](../elements/image.md): `src`, `placeholder`, `objectFit` स्टाइल, `onLoad`, `onProgress`, `onError` और अन्य props।
- इमेज फ़ाइल को इंपोर्ट करने (`import logo from "./logo.png"`) पर एक `ImageAsset` (`{ url, size, scales? }`, पॉइंट्स में आकार वाला) मिलता है, जिसे `<Image src>` और कैनवास `drawImage` स्वीकार करते हैं।

> [!NOTE]
> जब आपका ऐप `nsh.json` में `capabilities` घोषित करता है, तो रिमोट URL के `getSize` और `prefetch` को `network` के अंतर्गत अनुमति मिलनी चाहिए, जैसे `fetch`। इनके बाहर के URL का कभी अनुरोध नहीं किया जाता: promise एक `Error` के साथ reject हो जाता है जिसका `code` `"ERR_ACCESS_DENIED"` होता है, `permission` `"network"` और `resource` URL। [Sandbox and capabilities](../docs/sandbox-and-capabilities.md) देखें।
