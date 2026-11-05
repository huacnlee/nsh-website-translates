---
title: "Avatar"
description: "Avatar और AvatarGroup कॉम्पोनेंट: किसी व्यक्ति की तस्वीर, या जब तस्वीर लोड हो रही हो, लोड होने में विफल हो जाए या उपलब्ध ही न हो तब दिखाया जाने वाला फ़ॉलबैक, जिसमें लोडिंग स्टेट नेटिव रूप से चलती है; और अवतारों की एक पंक्ति जो पहले कुछ अवतार दिखाती है और बाकी का प्रतिनिधित्व करती है।"
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---

# Avatar

Avatar किसी व्यक्ति की तस्वीर दिखाता है: टीम का कोई सदस्य, किसी कमेंट का लेखक, हेडर में दिखने वाला अकाउंट। जब तक तस्वीर लोड नहीं हो जाती, जब वह लोड होने में विफल रहती है और जब कोई तस्वीर होती ही नहीं, तब यह एक फ़ॉलबैक दिखाता है: व्यक्ति के `name` के आद्याक्षर, या ऐप की अपनी सामग्री (एक आइकन)। यह तस्वीर की लोडिंग स्थिति को स्वयं संभालता है, जो बिना JavaScript के, इमेज के अपने load और error इवेंट से नेटिव रूप से चलती है। साथ ही यह स्क्रीन रीडर को वह देता है जो उन्हें चाहिए: व्यक्ति के नाम का लेबल लगी एक इमेज। रूप-रंग ऐप का अपना होता है: `Avatar` का अपना कोई आकार, शेप, रंग या फ़ॉन्ट नहीं होता। `AvatarGroup` किसी पंक्ति के पहले कुछ avatar दिखाता है, और बाकी लोगों के लिए एक ओवरफ़्लो ("+5") दिखाता है।

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`Avatar` और `AvatarGroup` [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` क्रेट है। Rust में `avatar()` और `avatar_group()` इन्हें हर prop के लिए एक सेटर (`.src(..)`, `.fallback_delay(..)`) के साथ बनाते हैं; avatar के लिए टाइप्ड स्टाइल मेथड और तस्वीर के ऊपर दिखने वाली चीज़ों के लिए `.child(..)` उपलब्ध हैं।

## Props

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | कोई नहीं | तस्वीर, उसी रूप में जैसे [`<Image>`](./image.md) का `src` उसे लेता है: एक URL, एक `asset:/` या `data:` URI, एक `blob:` URL (उपयोगकर्ता की चुनी हुई फ़ोटो: `URL.createObjectURL(file)`), या इम्पोर्ट की गई इमेज। यह लोड हो जाने के बाद दिखती है; खाली स्ट्रिंग का मतलब है कि कोई तस्वीर नहीं है। |
| `name` | `.name(..)` | `string` | कोई नहीं | व्यक्ति का नाम: स्क्रीन रीडर यही बोलते हैं, और जब ऐप कोई `fallback` नहीं देता तो फ़ॉलबैक इसी के आद्याक्षर दिखाता है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | स्क्रीन रीडर क्या बोलें, `name` के ऊपर। `""` avatar को सजावटी बना देता है, जो स्क्रीन रीडर से छिपा रहता है। |
| `fallbackDelay` | `.fallback_delay(..)` | `number` (ms) | `0` | तस्वीर लोड होने के दौरान फ़ॉलबैक कितनी देर प्रतीक्षा करता है, ताकि जल्दी लोड होने वाली तस्वीर बिना फ़ॉलबैक के पहले झलकने के दिखे। `Infinity`: लोड होने के दौरान कोई फ़ॉलबैक नहीं, केवल तब जब वह विफल हो या तस्वीर न हो। |
| `imageClass`, `imageStyle` | `.image_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | तस्वीर: उसका फ़िट, रेडियस और मोशन। |
| `fallbackClass`, `fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | फ़ॉलबैक: उसका बैकग्राउंड, टेक्स्ट का रंग और आकार, और वह अपनी सामग्री को कैसे अलाइन करता है। |
| `fallback` | `.fallback(..)` | `JSX.Element` | आद्याक्षर | आद्याक्षर की जगह फ़ॉलबैक की सामग्री: एक आइकन, या बिना नाम वाले व्यक्ति के लिए प्लेसहोल्डर। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | तस्वीर के ऊपर क्या दिखता है: एक प्रेज़ेंस डॉट, एक बैज। स्क्रीन रीडर avatar का लेबल सुनाते हैं, इन्हें नहीं ([एक्सेसिबिलिटी](#accessibility) देखें)। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | स्वयं avatar: उसका आकार और शेप। |

| इवेंट | Rust | पेलोड | विवरण |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | तस्वीर की स्थिति बदली: `"idle"` (कोई `src` नहीं), `"loading"`, `"loaded"` या `"error"`। |

<a id="parts"></a>

## भाग

| भाग | भीतर | स्टाइल करने के लिए |
|---|---|---|
| Avatar | | `class`, `style` |
| फ़ॉलबैक | avatar के भीतर, सबसे पहले, उसी जितना बड़ा; तब मौजूद रहता है जब तस्वीर लोड हो रही हो (`fallbackDelay` के बाद), विफल हो या न हो | `fallbackClass`, `fallbackStyle`; उसकी सामग्री आद्याक्षर या `fallback` |
| तस्वीर | avatar के भीतर, फ़ॉलबैक के ऊपर, उसे भरती हुई | `imageClass`, `imageStyle` |
| ऐप की सामग्री | avatar के भीतर, सबसे अंत में | उसके अपने एलिमेंट (`children`) |

avatar को उसका आकार दें (`class="size-10"`): फ़ॉलबैक और तस्वीर उसे भर देते हैं, इसलिए फ़ॉलबैक के हटने पर लेआउट दोबारा नहीं बनता। तस्वीर शुरू से ही पारदर्शी रूप में लेआउट में रहती है, और लोड होने पर अपारदर्शी हो जाती है; तब फ़ॉलबैक हट जाता है। `imageClass` में `transition-opacity` उसे फ़ेड-इन करता है (रिड्यूस्ड मोशन में वह तुरंत दिखती है)। avatar को क्लिप करने के बजाय तस्वीर और फ़ॉलबैक को राउंड करें (हर एक पर `rounded-full`), ताकि उसके किनारे पर रखा प्रेज़ेंस डॉट (`absolute bottom-0 right-0`) पूरा दिखता रहे।

आद्याक्षर नाम के पहले दो शब्दों के पहले अक्षर होते हैं, अपर केस में ("Ada Lovelace" का "AL"); एक शब्द हो तो उसके पहले दो अक्षर ("huacnlee" का "HU"), और ऐसी लिपि में लिखा नाम जिसमें अक्षरों के केस नहीं होते, उसका पहला अक्षर ("王小明" का "王")।

<a id="groups"></a>

## समूह

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | इसके अधिकतम इतने ही avatar दिखते हैं, पहले वाले; बाकी कोई व्यू नहीं बनाते। |
| `total` | `.total(..)` | `number` | चाइल्ड की संख्या | समूह कितने लोगों का प्रतिनिधित्व करता है, जब ऐप उनमें से केवल पहले कुछ ही देता है। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर समूह के बारे में क्या बोलें। |
| `overflowClass`, `overflowStyle` | `.overflow_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | ओवरफ़्लो भाग, दिखाए गए avatar के बाद। |
| `overflow` | `.overflow(..)` | `JSX.Element` | कोई नहीं | जो लोग दिखाए नहीं गए उनका प्रतिनिधित्व करने वाली चीज़ ("+5", "⋯"), जो तब मौजूद रहती है जब समूह में दिखाए गए avatar से अधिक लोग हों। |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर ओवरफ़्लो की सामग्री की जगह उसके बारे में क्या बोलें: "+5" के लिए "5 और लोग"। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | avatar, क्रम से। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पंक्ति: उसकी दिशा (`flex-row`) और स्पेसिंग। |

ओवरलैप, रिंग और ओवरफ़्लो का शेप ऐप तय करता है: पहले के बाद हर avatar पर नेगेटिव मार्जिन (`-ml-2`) उन्हें एक के ऊपर एक रखता है, और बैकग्राउंड के रंग की रिंग उन्हें अलग करती है। लंबी सूची के लिए पहले `limit` लोगों को और `total` दें: केवल दिखाए गए avatar ही बनाए जाते हैं। ओवरफ़्लो जितने लोगों का प्रतिनिधित्व करता है, वह संख्या `total` में से दिखाए गए avatar घटाने पर मिलती है, और दिखाए गए avatar चाइल्ड की संख्या और `limit` में से जो कम हो उतने होते हैं: दो चाइल्ड के साथ `total={8}` दो avatar और "+6" दिखाता है।

## Accessibility

- स्क्रीन रीडर के लिए avatar एक इमेज है, जिसका लेबल `accessibilityLabel` या `name` होता है: नाम एक ही बार बोला जाता है। फ़ॉलबैक और तस्वीर उनसे छिपे रहते हैं, इसलिए आद्याक्षर अलग से नहीं पढ़े जाते। जिस avatar में इनमें से कुछ न हो, या जिसमें `accessibilityLabel=""` हो, वह सजावटी है: स्क्रीन रीडर से छिपा हुआ, जैसा कि अपने दिखाए नाम के बगल में रखे avatar को होना चाहिए।
- समूह एक group है, जिसका लेबल उसका `accessibilityLabel` होता है ("Ada, Grace और 5 अन्य"); दिखाए गए avatar उसके भीतर इमेज हैं। ओवरफ़्लो को उसकी सामग्री ("+5") के रूप में पढ़ा जाता है, या ऐप द्वारा `overflowAccessibilityLabel` ("5 और लोग") दिए जाने पर उसके रूप में: NSH अपने कोई शब्द नहीं लिखता।
- स्क्रीन रीडर के लिए avatar एक ही एलिमेंट है, इसलिए उसके चाइल्ड जो दिखाते हैं वह अलग से नहीं पढ़ा जाता, और iOS पर उनके बीच के बटन या लिंक तक पहुँचा ही नहीं जा सकता। प्रेज़ेंस डॉट या बैज का अर्थ `accessibilityLabel` में बताएँ ("Ada Lovelace, ऑनलाइन"), और जिसे दबाया जा सके उसे avatar के भीतर नहीं, उसके बगल में रखें।
- दोनों में से कोई भी प्रेस या कीबोर्ड फ़ोकस नहीं लेता: avatar को दबाने योग्य बनाने के लिए उसे `Button` में रखें।

सामान्य रूप से लेबल, रोल और घोषणाओं के लिए [एक्सेसिबिलिटी](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- हर प्लेटफ़ॉर्म तस्वीर को अपने इमेज लोडर और कैश से लोड करता है ([Image](./image.md) देखें); उसके load और error इवेंट Rust में avatar की स्थिति बदलते हैं, इसलिए लोड हो रही या विफल तस्वीर केवल तस्वीर और फ़ॉलबैक को बदलती है, और कुछ नहीं।
- तस्वीर तब लोड होना शुरू करती है जब उसे फ़्रेम मिल जाता है, इसलिए पारदर्शी रहते हुए भी वह लेआउट में बनी रहती है।
