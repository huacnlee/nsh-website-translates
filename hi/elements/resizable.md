---
title: "Resizable"
description: "ResizablePanelGroup और ResizablePanel: पैनल साथ-साथ या एक के ऊपर एक रखे जाते हैं, और हर दो पैनलों के बीच एक हैंडल होता है जिसे उपयोगकर्ता खींचकर उपलब्ध जगह को आपस में बाँटता है। ड्रैग, पैनलों की सीमाएँ, resize कर्सर और स्क्रीन रीडर के लिए हैंडल की भूमिका (role) ग्रुप संभालता है; आकार, हैंडल का रूप और पैनलों की सामग्री ऐप के ज़िम्मे हैं।"
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---

# Resizable

एक resizable group पैनलों को अगल-बगल या ऊपर-नीचे रखता है, और दो पैनलों के बीच की हर सीमा पर एक हैंडल देता है: दस्तावेज़ के बगल में साइडबार, कंसोल के ऊपर एडिटर, डिटेल के बगल में सूची। उपयोगकर्ता हैंडल को खींचकर सीमा को सरकाता है, और हर पैनल उन आकारों के भीतर रहता है जिनकी ऐप उसे अनुमति देती है। `ResizablePanelGroup` व्यवहार को संभालता है: ड्रैग, जो फ़्रेम-दर-फ़्रेम नेटिव रूप से चलता है, जगह का बँटवारा, resize कर्सर और उंगली के लिए बड़ा टच क्षेत्र। रूप-रंग ऐप का है: हैंडल एक बैंड है जिसकी अपनी कोई रेखा, रंग या ग्रिप नहीं होती, और वह जो कुछ बनाता है वह ऐप का इंडिकेटर है; पैनल ऐप के व्यू हैं।

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

`ResizablePanelGroup` और `ResizablePanel` [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` crate है। पैनल ग्रुप के सीधे चाइल्ड होते हैं। Rust में `h_resizable()` और `v_resizable()` हर अक्ष पर एक ग्रुप बनाते हैं (`resizable_panel_group().axis(..)` अक्ष को मान के रूप में लेता है) और `resizable_panel()` एक पैनल बनाता है, जिसमें हर prop के लिए एक setter, हर इवेंट के लिए एक listener, टाइप्ड स्टाइल मेथड और उनकी सामग्री के लिए `.child(..)` होता है; `.size_range(min..max)` दोनों सीमाएँ एक साथ सेट करता है।

<a id="sizes"></a>

## आकार

पैनल का `size` वह आकार है जो वह चाहता है, उसके `minSize` और `maxSize` के भीतर। जिन पैनलों में यह नहीं होता वे बची हुई जगह को बराबर बाँटते हैं, उनकी सामग्री चाहे जो हो; जब हर पैनल का आकार तय होता है, तो बची हुई जगह उन्हीं के अनुपात में बाँटी जाती है। जब उपयोगकर्ता किसी हैंडल को खींचता है, तो ग्रुप कोर में ही पैनलों के बीच जगह को खिसकाता है, बीच में JS के बिना:

- हैंडल से पहले वाले पैनल को बढ़ाने पर जगह उसके बाद वाले पैनलों से ली जाती है, सबसे नज़दीकी से शुरू करके, हर एक को उसके `minSize` तक घटाते हुए, और `fixed` पैनलों को छोड़ते हुए।
- उसे उसके `minSize` से नीचे घटाने पर जगह उससे पहले वाले पैनलों से ली जाती है।
- कोई भी पैनल अपने `maxSize` से ज़्यादा नहीं बढ़ता, और पैनलों का योग कभी ग्रुप से अधिक नहीं होता।

जब कोई ड्रैग आकार बदलकर खत्म होता है, तो ग्रुप हर दिखाई देने वाले पैनल का आकार बताता है, उसी क्रम में जिसमें वे लेआउट में हैं (ग्रुप पर `onResize`), और जिस पैनल का आकार बदला वह अपना आकार बताता है (पैनल पर `onResize`)। ड्रैग से हिले पैनल उपयोगकर्ता के आकार तब तक रखते हैं जब तक ऐप नया `size` नहीं देती; ऐप रिपोर्ट किए गए आकारों को `size` के रूप में वापस देकर उन्हें ग्रुप के जीवनकाल के बाद भी बनाए रखती है, ताकि [स्टोरेज](../modules/nsh.md#storage) से बहाल किया गया लेआउट उसी आकार में खुले जिसमें उपयोगकर्ता ने उसे छोड़ा था। केवल ड्रैग और स्क्रीन रीडर के स्टेप रिपोर्ट करते हैं: विंडो का आकार बदलना या किसी पैनल को दिखाना या छिपाना कुछ रिपोर्ट नहीं करता।

जब ग्रुप बढ़ता या घटता है (विंडो का आकार बदलने पर), तो आकार वाले पैनल उसे बनाए रखते हैं और बिना आकार वाले पैनल अंतर को ले लेते हैं। जब ग्रुप आकारों के लिए बहुत छोटा हो, तो पैनल सिकुड़ते हैं, `fixed` पैनलों (साइडबार, इंस्पेक्टर) को छोड़कर, और जगह लौटने पर वे अपने आकार पर वापस आ जाते हैं। `visible={false}` वाला पैनल कोई जगह नहीं लेता: बाकी उसकी जगह बाँट लेते हैं, और दोबारा दिखाए जाने पर वह अपने आकार में लौट आता है।

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

<a id="handles"></a>

## हैंडल

हर दो दिखाई देने वाले पैनलों के बीच की सीमा पर एक हैंडल होता है: अक्ष के आर-पार 9 पॉइंट मोटा एक बैंड, जो सीमा पर केंद्रित होता है, और जिस पर उसके अक्ष का resize कर्सर दिखता है। टच स्क्रीन पर इसका टच क्षेत्र दोनों ओर 10 पॉइंट और आगे तक जाता है, ताकि एक पॉइंट की रेखा भी आसानी से पकड़ी जा सके। हैंडल एक `group` है: वह जो कुछ बनाता है वह ऐप का इंडिकेटर है, जिसे `handleClass` / `handleStyle` से स्टाइल किया जाता है: आर-पार 1 पॉइंट और सीमा की पूरी लंबाई, इसलिए अकेला `bg-border` किसी भी अक्ष पर बाल जैसी पतली रेखा है, और `w-[3px]` या `h-[3px]` उसे मोटा करता है, और उसकी `group-hover:` और `group-active:` क्लासें बैंड के ऊपर पॉइंटर और प्रेस या ड्रैग का अनुसरण करती हैं। केवल एक रेखा से अधिक के लिए (बिंदुओं की ग्रिप, एक आइकन), `renderHandle` इंडिकेटर की सामग्री बनाता है, जिसे हैंडल का `index`, `axis` और `state` बताया जाता है; स्थिति बदलने पर यह दोबारा बनता है, प्रति ड्रैग कुछ ही बार, हर मूवमेंट पर कभी नहीं। एनिमेट होने वाली ग्रिप हैंडल का थंब है (`handleThumbClass` / `handleThumbStyle`): रेखा पर केंद्रित एक व्यू, जो सीधा बनता है और क्षैतिज रेखा पर एक चौथाई घुमा दिया जाता है ताकि एक ही क्लास दोनों अक्षों के लिए काम करे, जिसे `group-hover:` और `group-active:` क्लासें दिखाती और ट्रांज़िशन करती हैं; पूरे ड्रैग के दौरान हैंडल दबा रहता है, पॉइंटर कहीं भी जाए।

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

`disabled` हर हैंडल को उसकी जगह पर रखता है (लॉक किया हुआ लेआउट)।

## Props

### ResizablePanelGroup

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `axis` | `h_resizable()`, `v_resizable()`, `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | अगल-बगल (हैंडल बाएँ-दाएँ खींचे जाते हैं) या ऊपर-नीचे (ऊपर-नीचे खींचे जाते हैं)। |
| `disabled` | `.disabled(..)` | `boolean` | `false` | कोई ड्रैग नहीं: हैंडल अपनी जगह पर रहते हैं। |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | हर हैंडल का इंडिकेटर, सीमा पर हैंडल के बैंड में: अक्ष के आर-पार 1 पॉइंट और सीमा की पूरी लंबाई, जब तक वह कुछ और न कहे (`w-[3px]`, `h-[3px]`); `group-hover:` और `group-active:` बैंड का अनुसरण करते हैं। |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | कोई नहीं | हर हैंडल का थंब: रेखा पर केंद्रित एक ग्रिप, जो ऊर्ध्वाधर रेखा की तरह सीधी बनती है और क्षैतिज रेखा पर एक चौथाई घुमा दी जाती है, ताकि एक ही क्लास दोनों अक्षों के लिए काम करे। हैंडल के होवर, प्रेस और ड्रैग के दौरान यह वही व्यू बना रहता है, इसलिए `group-hover:` और `group-active:` क्लासें इसे ट्रांज़िशन करती हैं (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`)। |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | कोई नहीं | हर इंडिकेटर के अंदर क्या है, जो हैंडल का `state` बदलने पर दोबारा बनता है। |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | कोई नहीं | स्क्रीन रीडर हर हैंडल के लिए क्या बोलते हैं: वह क्या resize करता है। वे इसे एक बार में 10 पॉइंट समायोजित करते हैं। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | `ResizablePanel`, इसके सीधे चाइल्ड। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | `size-full` | ग्रुप स्वयं; यह अपने पैरेंट को भरता है, जब तक उसकी क्लास कुछ और न कहे। |

### ResizablePanel

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | कोई नहीं | ग्रुप के अक्ष के अनुदिश वह लंबाई जो यह चाहता है, पॉइंट में, `minSize` और `maxSize` के भीतर; नया मान इसका आकार बदल देता है। इसके बिना यह बची हुई जगह बाँटता है। |
| `minSize` | `.min_size(..)`, `.size_range(..)` | `number` | `100` | सबसे छोटा आकार जो यह पा सकता है। |
| `maxSize` | `.max_size(..)`, `.size_range(..)` | `number` | कोई सीमा नहीं | सबसे बड़ा आकार जो यह पा सकता है। |
| `fixed` | `.fixed(..)` | `boolean` | `false` | ग्रुप के पैनलों के लिए बहुत छोटा होने पर अपना आकार बनाए रखता है; अपने हैंडल को खींचने पर यह फिर भी resize होता है। यह एक `size` लेता है। |
| `visible` | `.visible(..)` | `boolean` | `true` | छिपा होने पर यह कोई जगह नहीं लेता और बाकी इसकी जगह बाँट लेते हैं। |
| `children` | `.child(..)` | `JSX.Element` | कोई नहीं | इसकी सामग्री। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | कोई नहीं | पैनल की अपनी सतह। अक्ष के अनुदिश इसका आकार ग्रुप तय करता है। |

### ResizeHandleContext

| फ़ील्ड | टाइप | विवरण |
|---|---|---|
| `index` | `number` | `index`वें दिखाई देने वाले पैनल के बाद की सीमा। |
| `axis` | `"horizontal" \| "vertical"` | वह अक्ष जिसके अनुदिश यह resize करता है। |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | पॉइंटर या उंगली इसके साथ कितनी दूर गई है। |

<a id="events"></a>

## इवेंट

| इवेंट | Rust | विवरण |
|---|---|---|
| `onResize` (`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | कोई ड्रैग खत्म हुआ और उसने किसी हैंडल को हिलाया, या किसी स्क्रीन रीडर ने उसे समायोजित किया: `sizes`, हर दिखाई देने वाले पैनल का आकार, उसी क्रम में जिसमें वे लेआउट में हैं (बाएँ से दाएँ, ऊपर से नीचे)। |
| `onResize` (`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | कोई ड्रैग खत्म हुआ और उसने इस पैनल का आकार बदला: `size`, नया आकार, जिसे इसके `size` के रूप में वापस देना है। |

<a id="parts"></a>

## पार्ट्स

| पार्ट | अंदर | स्टाइल | स्टेट |
|---|---|---|---|
| ग्रुप | | `ResizablePanelGroup` का `class`, `style` | |
| पैनल | ग्रुप | `ResizablePanel` का `class`, `style` | |
| हैंडल का इंडिकेटर | हैंडल का बैंड, किसी सीमा पर | `handleClass`, `handleStyle`, `renderHandle` | पॉइंटर के नीचे `group-hover:`, दबे रहने या ड्रैग के दौरान `group-active:`; `renderHandle` में `state` |
| हैंडल का थंब | हैंडल की रेखा पर केंद्रित | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (ड्रैग खत्म होने तक दबा हुआ) |

<a id="accessibility"></a>

## सुगम्यता

- स्क्रीन रीडर के लिए हर हैंडल एक समायोज्य एलिमेंट है, जिसका लेबल `handleAccessibilityLabel` है। इसका मान उससे पहले वाले पैनल का आकार है, उस पैनल के `minSize` और `maxSize` के भीतर।
- VoiceOver में हैंडल पर ऊपर या नीचे स्वाइप करना, या TalkBack की वॉल्यूम कुंजियाँ, उसे 10 पॉइंट हिलाती हैं, ठीक ड्रैग की तरह; ग्रुप इसे `onResize` के साथ रिपोर्ट करता है। `disabled` ग्रुप के हैंडल अपनी जगह पर रहते हैं।
- पैनलों की सामग्री ऐप की है और उसे वैसे ही पढ़ा जाता है जैसे कहीं और।

लेबल, रोल और घोषणाओं के सामान्य विवरण के लिए [Accessibility](../docs/accessibility.md) देखें।

<a id="platform-notes"></a>

## प्लेटफ़ॉर्म नोट्स

- डेस्कटॉप (macOS, Windows, Linux, GPUI) और वेब: हैंडल के ऊपर पॉइंटर कॉलम या रो का resize कर्सर दिखाता है, और माउस या टचपैड से ड्रैग सीमा को हिलाता है।
- iOS, Android और Mac Catalyst: उंगली हैंडल को खींचती है, ऐसे टच क्षेत्र के भीतर जो बैंड से दोनों ओर 10 पॉइंट चौड़ा है।
- दाएँ-से-बाएँ लेआउट में पैनल और उनके आकार लेआउट के क्रम का पालन करते हैं।
- हर प्लेटफ़ॉर्म वही बनाता है जो ऐप स्टाइल करती है: इंडिकेटर और पैनल।
- [Dock](./dock.md) के स्प्लिट resizable ग्रुप हैं: उनका आकार उसी तरह बदला जाता है।
