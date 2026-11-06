---
title: "Elements"
description: "वे प्रिमिटिव और बेस कॉम्पोनेंट जिनसे हर NSH ऐप Rust और TSX में बनाया जाता है, साथ ही वे props, events और ref methods जो इन सभी में साझा होते हैं।"
order: 1
source_hash: 84e4cb96ec250ab2
---

# एलिमेंट

Native Shell हर स्क्रीन को एलिमेंट के एक छोटे सेट से बनाता है: `View`, `Text` और `Image` जैसे प्रिमिटिव, और `Button`, `Dialog` और `NavStack` जैसे बेस कंपोनेंट। हर प्रिमिटिव एक नेटिव व्यू है (iOS और Mac Catalyst पर UIView की सबक्लास, Android पर `View`, और डेस्कटॉप पर AppKit, GTK या Win32 व्यू), जिसे NSH रनटाइम बनाता और लेआउट करता है। ऐप जो कुछ भी दिखाता है, वह इन्हीं से बनता है: ऐप के बटन, कार्ड, रो और स्क्रीन उसके अपने कंपोनेंट हैं, जो इन एलिमेंट से बनाए जाते हैं और ऐप द्वारा स्टाइल किए जाते हैं, इसलिए ऐप का लुक पूरी तरह उसका अपना होता है।

इन पेजों का हर उदाहरण Rust और TSX दोनों में दिया गया है: एक टैब चुनें, और पेज के सभी उदाहरण उसी का अनुसरण करेंगे।

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

Rust में, प्रिमिटिव `nsh_core::prelude` (`view()`, `text(..)`, `image(..)`) के फ़ंक्शन हैं और बेस कंपोनेंट `nsh_base` क्रेट से आते हैं। स्टाइल टाइप्ड मेथड हैं (`.flex_1()`, `.gap_3()`, `.px(px(20.0))`, `.bg(..)`), स्टेट स्टाइल एक क्लोज़र लेते हैं (`.active(|s| s.opacity(0.6))`), लिसनर अपने इवेंट के क्लोज़र हैं (`.on_press(move || ..)`, `.on_change(move |text: &str| ..)`) और `.child(..)` चिल्ड्रन जोड़ता है। UI का एक हिस्सा `impl IntoElement` लौटाने वाला साधारण फ़ंक्शन है; यह एक बार चलता है, और क्लोज़र में पढ़े गए सिग्नल (`text(move || ..)`, `.bg(move || ..)`) उन चीज़ों को अपडेट करते हैं जिनसे वे बंधे हैं। देखें [Rust के साथ बनाना](../docs/rust.md)।

TSX में, हर टैग PascalCase में होता है और स्कोप में मौजूद किसी बाइंडिंग का नाम होता है: प्रिमिटिव `nsh` से आते हैं, बेस कंपोनेंट `nsh/base` से। केवल `<If>` और `<Each>` ग्लोबल हैं जिन्हें इम्पोर्ट की ज़रूरत नहीं होती। `<view>` जैसा लोअरकेस टैग बिल्ड एरर है, क्योंकि TypeScript उसे हर नाम के लिए एक ग्लोबल टाइप से जाँचेगा, और `List` और `Each` जैसे जेनेरिक कंपोनेंट अपने आइटम टाइप का अनुमान नहीं लगा पाएँगे। कंपाइलर एलिमेंट को उनके इम्पोर्ट से पहचानता है और नेटिव व्यू को इन-प्लेस बनाता है, इसलिए उन्हें इम्पोर्ट करने की रन टाइम पर कोई लागत नहीं है। देखें [JSX और कंपोनेंट](../docs/jsx-and-components.md)।

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

<a id="primitives"></a>

## प्रिमिटिव

TSX में `nsh` से और Rust में `nsh_core::prelude` से इम्पोर्ट किए जाते हैं।

| एलिमेंट | Rust | नेटिव व्यू (iOS / Android) | पेज |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup; `selectable` के साथ, इसके अंदर के टेक्स्ट एक साथ चुने जाते हैं | [View](./view.md), [टेक्स्ट चयन](./text-selection.md) |
| `<Text>` | `text(content)` | CoreText व्यू / StaticLayout व्यू | [Text](./text.md) |
| `<Image>` | `image(src)` | इमेज लेयर वाला व्यू / इमेज व्यू | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | UIScrollView / रीसायकल किए गए सेल वाला ScrollView | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | 2D ड्रॉइंग को दोबारा चलाने वाला व्यू | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | ऐसा व्यू जिसके बॉक्स को WGSL प्रोग्राम GPU पर, उसके चिल्ड्रन के नीचे, ड्रॉ करता है | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`, `web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / TextureView पर MediaPlayer | [Video](./video.md) |
| `<Overlay>` | `overlay()` | विंडो (या जिस डायलॉग में वह है) के ऊपर का व्यू, जिसे एक एंकर के सापेक्ष रखा जाता है | [Overlay](./overlay.md) |
| `<If>`, `<Each>` | `when(..)`, `each(..)`, `dynamic(..)` | कंट्रोल फ़्लो: वे एलिमेंट जिन्हें ये चुनते हैं | [कंट्रोल फ़्लो](./control-flow.md) |
| `<InputAccessoryView>` (`nsh/mobile`) | `input_accessory_view(id)` | iOS पर कीबोर्ड के ऊपर एक बार | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

पैडिंग और मार्जिन, CSS के `env()` के साथ, कंटेंट को सिस्टम UI से दूर रखते हैं: `env(safe-area-inset-top)` और अन्य किनारे ([सेफ़ एरिया](./safe-area.md)) और `env(keyboard-inset-height)` ([कीबोर्ड](./keyboard.md))।

<a id="base"></a>

## बेस

TSX में `nsh/base` से और Rust में `nsh_base` क्रेट से इम्पोर्ट किए जाते हैं। ये व्यवहार, स्टेट, फ़ोकस और एक्सेसिबिलिटी संभालते हैं और अपना लुक ऐप से लेते हैं।

| कंपोनेंट | Rust | यह क्या करता है | पेज |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | सिस्टम का अलर्ट और एक्शन शीट | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` और इसके हिस्से | `nsh_base::accordion()`, `accordion_item()`, ... | एक के ऊपर एक रखे सेक्शन जो अपने हेडिंग के नीचे फैलते और सिमटते हैं, एक बार में एक या कई | [Accordion](./accordion.md) |
| `<Avatar>`, `<AvatarGroup>` | `nsh_base::avatar()`, `avatar_group()` | किसी व्यक्ति की तस्वीर, या उसके लोड होने तक या विफल होने पर एक फ़ॉलबैक, और उनकी एक पंक्ति जो शुरू के कुछ दिखाती है | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | अपनी स्टेट और भूमिका वाला दबाने योग्य कंट्रोल | [Button](./button.md) |
| `<Carousel>` और इसके हिस्से | `nsh_base::carousel()`, `carousel_content()`, ... | स्लाइड जो एक बार में एक जगह दिखती हैं, नेटिव तरीके से स्वाइप होती हैं, साथ में पिछला / अगला, पेजिनेशन, कीज़ और सहज लूप | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | इंडिकेटर वाला चेक्ड, अनचेक्ड या इंडेटरमिनेट कंट्रोल | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | एक क्षेत्र जिसका कंटेंट फैलता और सिमटता है | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | एक कमांड पैलेट: नेटिव तरीके से फ़िल्टर होने वाली कमांड पर एक सर्च फ़ील्ड, एक वर्चुअलाइज़्ड लिस्ट, और Cmd+K पैलेट की कीज़ | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | किसी भी संख्या की रो और कॉलम की टेबल, जिसे चुना और सॉर्ट किया जा सकता है, और जिसके कॉलम का आकार बदला और स्थान बदला जा सकता है | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | अपने चिल्ड्रन को बाकी सब के ऊपर दिखाता है | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | दो टेक्स्ट के बीच या किसी पैच के बदलाव, स्प्लिट या यूनिफ़ाइड रूप में | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | स्प्लिट, टैब ग्रुप और एज डॉक का एक वर्कस्पेस जिसे उपयोगकर्ता व्यवस्थित करता है | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | हाइलाइटिंग, कई कैरेट, फ़ोल्डिंग और सर्च वाला कोड एडिटर | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | जब पॉइंटर उसके ट्रिगर पर टिका हो, तब ट्रिगर जिस ओर इशारा करता है उसका प्रीव्यू | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | नेटिव टेक्स्ट इनपुट (UITextField या UITextView / EditText) | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | एक प्रेस टारगेट जो कोई पेज, साइट या ऐप का रूट खोलता है | [Link](./link.md) |
| `<Menu>`, `<ContextMenu>`, `<MenuItem>`, `<MenuSeparator>`, `<Submenu>` | `nsh_base::menu()`, ... | मेन्यू: डेस्कटॉप पर कैस्केडिंग सबमेन्यू वाले पॉपअप, फ़ोन पर शीट | [Menu](./menu.md) |
| `<NavStack>`, `<NavPage>` | `nsh_base::nav_stack()`, `nsh_base::nav_page()` | नेटिव नेविगेशन: प्लेटफ़ॉर्म के हेडर और बैक जेस्चर वाला पेजों का स्टैक | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | एक संख्या जिसे फ़ील्ड में टाइप किया जाता है या बटन और कीज़ से बढ़ाया-घटाया जाता है | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | निश्चित अंकों वाला वन-टाइम कोड, जिसे सेल में टाइप, पेस्ट या ऑटोफ़िल किया जाता है | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | किसी सेट के पेज: Previous, मौजूदा पेज के आसपास के पेज, एलिप्सिस और Next | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | आइटम जो आइटम रखते हैं, फैले और सिमटे हुए, एक चुना हुआ: वर्चुअलाइज़्ड, कीबोर्ड फ़ोकस का एक पड़ाव | [Tree](./tree.md) |
| `<Plot>`, `<Line>`, `<Area>`, `<Bar>`, `<Grid>`, `<Pie>`, `<Arc>` (`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | एक चार्ट का फ़्रेम और उसके मार्क, जिन्हें ऐप की रो से नेटिव तरीके से ड्रॉ किया जाता है | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | ट्रिगर से जुड़ा कंटेंट, बाकी सब के ऊपर | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | एक प्रोग्रेस बार: कोई कार्य कितना आगे बढ़ा है, या यह कि वह जारी है | [Progress](./progress.md) |
| `<Radio>`, `<RadioGroup>` | `nsh_base::radio()`, `radio_group()` | किसी सेट का एक विकल्प जिसमें से उपयोगकर्ता एक चुनता है, और वह सेट | [Radio](./radio.md) |
| `<ResizablePanelGroup>`, `<ResizablePanel>` | `nsh_base::h_resizable()`, `resizable_panel()` | अगल-बगल या एक के ऊपर एक रखे पैनल, जिनका आकार हैंडल से बदला जाता है | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | स्क्रॉल व्यू या लिस्ट के लिए ऐप के अपने लुक वाला स्क्रॉल बार | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | आइटम की सूची से चुना गया एक मान, कीबोर्ड, सर्च और सेक्शन के साथ | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | बैकड्रॉप के ऊपर स्क्रीन के किनारे पर एक पैनल | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | ट्रैक पर चुना गया एक मान, या दो मानों की एक रेंज | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | ट्रैक और थंब वाला ऑन / ऑफ़ कंट्रोल | [Switch](./switch.md) |
| `<Table>` और इसके हिस्से | `nsh_base::table()`, `table_row()`, ... | ऐप की अपनी रो और सेल की टेबल, टेबल की भूमिकाओं के साथ | [Table](./table.md) |
| `<Tab>`, `<Tabs>` | `nsh_base::tab()`, `tabs()` | टैब सूची का एक टैब, और वह सूची | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | टेक्स्ट और व्यू के साथ Markdown या HTML दस्तावेज़ दिखाता है | [TextView](./text-view.md) |
| `<Toast>`, `<ToastStack>` | `nsh_base::toast()`, `toast_stack()` | एक टोस्ट का सिमेंटिक रूट; किनारे से लेयर के रूप में लेआउट किए गए टोस्ट | [Toast](./toast.md) |
| `<Toggle>`, `<ToggleGroup>` | `nsh_base::toggle()`, `toggle_group()` | एक बटन जो ऑन या ऑफ़ होता है, और उनका एक टूलबार | [Toggle](./toggle.md) |
| `<Toolbar>`, `<ToolbarGroup>`, `<ToolbarSeparator>` | `nsh_base::toolbar()`, `toolbar_group()`, `toolbar_separator()` | बटन, टॉगल और लिंक का एक बार, कीबोर्ड फ़ोकस का एक पड़ाव | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | अपने ट्रिगर के पास एक संकेत, होवर पर या उंगली टिकाए रखने पर | [Tooltip](./tooltip.md) |

> [!NOTE]
> स्ट्रिंग केवल `Text` के अंदर ड्रॉ होती है। `View` का स्ट्रिंग चाइल्ड कोई नेटिव व्यू नहीं बनाता और लेआउट में कोई हिस्सा नहीं लेता।

<a id="common-props"></a>

## सामान्य props

हर प्रिमिटिव नीचे दिए गए props स्वीकार करता है (TSX में `CommonProps` टाइप; Rust में `Styled`, `Interactive` और `Accessible` ट्रेट)। एलिमेंट के पेज केवल अपने props सूचीबद्ध करते हैं। Rust कॉलम बिल्डर मेथड का नाम बताता है।

<a id="styling"></a>

### स्टाइलिंग

| Prop | Rust | टाइप | विवरण |
|---|---|---|---|
| `style` | टाइप्ड `Styled` मेथड; `.inline_style(style)` | `StyleProp<ViewStyle>` (`<Text>` और `<Input>` के लिए `TextStyle`, `<Image>` के लिए `ImageStyle`) | इनलाइन स्टाइल, या स्टाइल की एक ऐरे जिन्हें बाएँ से दाएँ मर्ज किया जाता है (falsy एंट्री छोड़ दी जाती हैं; ऐरे नेस्ट हो सकती हैं, इसलिए `style={[base, props.style]}` एक ऐसा `props.style` ले सकता है जो खुद एक ऐरे हो)। `class` पर प्राथमिकता पाता है। देखें [स्टाइल संदर्भ](../modules/style-reference.md)। |
| `class` | टाइप्ड `Styled` मेथड (`.flex_row().gap_2().p_4()`) | `string` | Tailwind क्लास, जिन्हें नेटिव तरीके से रिज़ॉल्व किया जाता है (`"flex-row gap-2 p-4 dark:bg-zinc-900"`)। बाद की क्लास पहले वाली क्लास पर प्राथमिकता पाती हैं। देखें [Tailwind](../docs/tailwind.md)। |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | वे क्लास जो तब तक लागू रहती हैं जब तक उनका मान truthy हो (`{ "opacity-50": busy() }`)। |
| `disabled` | `.disabled(..)` | `boolean` | प्रेस को अनदेखा करता है (कोई प्रेस फ़ीडबैक भी नहीं), `disabled:` स्टाइल लागू करता है, इनपुट जैसे कंट्रोल को डिसेबल करता है, और स्क्रीन रीडर बताते हैं कि यह डिसेबल है (`accessibilityState.disabled`)। |

<a id="presses-and-feedback"></a>

### प्रेस और फ़ीडबैक

प्रेस हैंडलिंग नेटिव तरीके से चलती है: प्लेटफ़ॉर्म प्रेस को पहचानता है और ऐप की प्रेस स्टाइल लागू करता है, और ऐप का कोड इसके बारे में केवल बाद में सुनता है। केवल सबसे अंदरूनी दबाने योग्य व्यू प्रतिक्रिया देता है; स्क्रॉल व्यू के अंदर प्रेस-इन लगभग 130 ms प्रतीक्षा करता है ताकि पहले स्क्रॉल शुरू हो सके।

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | एक टैप व्यू के अंदर समाप्त हुआ। |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | उंगली `delayLongPress` तक नीचे रही। |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | व्यू पर एक उंगली नीचे गई। |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | उंगली उठ गई या बाहर चली गई। |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | प्रेस के लॉन्ग प्रेस बनने से पहले के मिलीसेकंड। |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | टच एरिया को बाउंड्स से आगे, पॉइंट में, बढ़ाता है। |

`PressEvent` है `{ position, pagePosition, modifiers, clickCount }`: पॉइंटर व्यू में और उसके रूट व्यू में कहाँ था (`Point`), प्रेस शुरू होने पर दबी हुई मॉडिफ़ायर कीज़ और लगातार क्लिक (डबल क्लिक के लिए 2)। जहाँ प्लेटफ़ॉर्म कोई पॉइंटर रिपोर्ट नहीं करता, वहाँ यह व्यू का ऑरिजिन होता है, बिना कीज़ और एक क्लिक के साथ।

स्टाइल की `pointerEvents` (Rust में `.pointer_events(PointerEvents::BoxNone)`, क्लास `pointer-events-*`) तय करती है कि व्यू और उसके अंदर के व्यू को कौन से टच मिलते हैं: `"none"` कोई नहीं (अंदर का कोई व्यू जो `"auto"` सेट करता है, उन्हें फिर से ले लेता है), `"box-none"` केवल उसके अंदर के व्यू, `"box-only"` केवल व्यू खुद ([टच और जेस्चर](../docs/touch-and-gestures.md#pointerevents))।

प्रेस फ़ीडबैक ऐप का अपना होता है: `activeStyle` (या `active:` क्लास, Rust में `.active(..)`) तब लागू होता है जब व्यू दबा हुआ हो, नेटिव तरीके से, ऐप के कोड तक गए बिना (नीचे)।

<a id="state-styles"></a>

### स्टेट स्टाइल

वे स्टाइल जो व्यू के किसी स्टेट में होने पर, उसकी अपनी स्टाइल के ऊपर, नेटिव तरीके से लागू होती हैं। हर एक Tailwind वेरिएंट का ऑब्जेक्ट रूप है। बाद की स्टेट को प्राथमिकता मिलती है (selected, checked और indeterminate, फिर hover, focus, active); `disabledStyle` सब पर भारी पड़ता है, और व्यू के डिसेबल होने पर बाकी लागू नहीं होतीं। हर एक एलिमेंट की अपनी स्टाइल लेता है: `<Text>` पर `TextStyle`, `<Input>` पर `InputStyle`, `<Image>` पर `ImageStyle`, और अन्य जगह `ViewStyle`।

| Prop | Rust | क्लास वेरिएंट | कब लागू होता है |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | दबे होने पर। |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | जब कोई पॉइंटर व्यू के ऊपर हो। |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | जब व्यू के पास फ़ोकस हो। |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | जब व्यू या उसके अंदर के किसी व्यू के पास फ़ोकस हो (`Overlay` का कंटेंट उस व्यू के अंदर माना जाता है जिसमें वह है)। |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | जब `disabled`। |
| `checkedStyle` | `.checked(\|s\| ..)`, `.checked_style(style)` | `checked:` | जब `accessibilityState.checked` का मान `true` हो (चेकबॉक्स, स्विच, रेडियो; `"mixed"` चेक्ड नहीं है)। |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`, `.indeterminate_style(style)` | `indeterminate:` | जब `accessibilityState.checked` का मान `"mixed"` हो (एक चेकबॉक्स जो न चेक्ड है न अनचेक्ड)। |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | जब `accessibilityState.selected` का मान `true` हो (एक चुना हुआ `Button`, एक टैब)। |
| `expandedStyle` | `.expanded(\|s\| ..)`, `.expanded_style(style)` | `aria-expanded:` | जब `accessibilityState.expanded` का मान `true` हो (किसी `Popover` या `Menu` का ट्रिगर, जब उसका पॉपअप खुला हो)। |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`, `.pressed_style(style)` | `aria-pressed:` | जब `accessibilityState.pressed` का मान `true` हो (एक टॉगल बटन जो ऑन है; `"mixed"` दबा हुआ नहीं है)। `activeStyle` नहीं, जो जारी प्रेस है। |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
### Hover

ऐप को पता चलता है कि माउस किसी view के ऊपर आया, उस पर चला और उसे छोड़कर गया। यह macOS, Windows, Linux, GPUI backend और डेस्कटॉप ब्राउज़रों में होता है। iOS पर iPad के पॉइंटर या Mac के माउस से, और Android पर माउस या स्टाइलस से भी होता है। Hover स्टाइल (`hover:`, `.hover(..)`) इन्हीं जगहों पर hover किए गए views को स्टाइल करते हैं।

| Prop | Rust | Type | विवरण |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | माउस view पर या उसके भीतर के किसी view पर आया (DOM का `mouseenter`)। |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | माउस view पर (या उसके भीतर के किसी view पर) चला, चाहे कोई बटन दबा हो या नहीं। या फिर माउस वहाँ बिना कोई बटन दबाए टिका था और कोई modifier key दबाई या छोड़ी गई (DOM का `mousemove`)। |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | माउस view और उसके भीतर के views से, या विंडो से, बाहर चला गया; `e` वह जगह है जहाँ वह आख़िरी बार था (DOM का `mouseleave`)। |

CSS `:hover` और DOM के `mouseenter` की तरह, कोई view तब तक hover किया हुआ गिना जाता है जब तक माउस उस पर या उसके भीतर किसी भी चीज़ पर हो। इसलिए माउस के नीचे वाले view के आसपास के views भी `onMouseEnter` सुनते हैं (बाहर से भीतर की ओर; `onMouseLeave` भीतर से बाहर की ओर)। इवेंट बाद में आते हैं और touches पर कभी नहीं आते। माउस के नीचे से हटाया गया view `onMouseLeave` सुनता है, Linux और Windows पर अगली माउस मूवमेंट पर।

`MouseEvent` बताता है कि माउस कहाँ है, जैसा GPUI का `MouseMoveEvent` करता है। इसमें view में `position` है (points में `Point`, उसके transforms पूर्ववत किए हुए) और उस root view में `pagePosition` है जिसमें वह है, जैसा touches देते हैं। इसमें दबे हुए `modifiers` भी हैं (`control`, `alt`, `shift`, `platform`: Apple प्लेटफ़ॉर्म पर Command, अन्यत्र Windows key) और `pressedButton` भी, यानी दबा हुआ बटन (`"left"`, `"right"`, `"middle"`, `"back"` या `"forward"`, GPUI का `MouseButton`) या `null`; Rust में `position`, `page_position`, `modifiers` और `pressed_button`। डेस्कटॉप और वेब पर drag एक touch भी है (`onTouchMove`, रिस्पॉन्डर), और उसकी moves `onMouseMove` तक `pressedButton` सेट के साथ पहुँचती हैं। जो फ़ीडबैक केवल hover को फ़ॉलो करता है, वह इन्हें छोड़ देता है; iOS और Android पर hover बिना किसी बटन दबे पॉइंटर को रिपोर्ट करता है। Moves प्रति फ़्रेम अधिकतम एक बार आती हैं, सबसे ताज़ा वाली, और हमेशा उस `onMouseLeave` से पहले जो उनके बाद आता है, इसलिए हैंडलर हर move पर redraw कर सकता है:

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

### Tooltips

`tooltip` किसी भी element को एक संकेत (hint) देता है। यह डेस्कटॉप (macOS, Windows, Linux, GPUI backend और डेस्कटॉप ब्राउज़र) पर element के ऊपर तब दिखता है जब पॉइंटर उस पर आधा सेकंड टिका रहे। यह तब तक रहता है जब तक पॉइंटर हट न जाए या उसे दबा न दे। फ़ोन और टैबलेट कोई संकेत नहीं दिखाते। संकेत कभी पॉइंटर या प्रेस नहीं लेता, इसलिए element ठीक वैसे ही काम करता है जैसे उसके बिना करता।

| Prop | Rust | Type | विवरण |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | संकेत, यानी ऐसा element जिसे ऐप स्टाइल करता है। `nsh/base` का [`Tooltip`](tooltip.md) स्वयं tooltip है, अपने placement, delay और events के साथ; कोई भी अन्य element जैसा है वैसा ही दिखाया जाता है। |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

`Tooltip` अपना रूप, placement, delay और events खुद तय करता है, जैसे GPUI का `.tooltip(..)` करता है। बहुत से tooltips वाला ऐप अपना एक छोटा component रखता है, जो किसी टेक्स्ट को उसके `Tooltip` में लपेटता है।

### Context menus

`onContextMenu` view को बताता है कि उस पर secondary बटन दबाया गया। यह right click, macOS पर Control-click, touchpad पर दो-उँगली click या iPad के पॉइंटर का secondary click हो सकता है; ब्राउज़रों में कीबोर्ड की menu key भी। वहाँ ऐप का अपना मेनू खोलें; TSX में [`Menu.popup`](../modules/nsh-desktop.md) सिस्टम का मेनू दिखाता है:

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| Prop | Rust | Type | विवरण |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | Secondary बटन view पर या उसके भीतर के किसी view पर दबाया गया। |

`ContextMenuEvent` में view में `position`, उसके root view में `pagePosition` (जहाँ `Menu.popup` मेनू रखता है: `Menu.popup(items, e.pagePosition)`) और `modifiers` होते हैं; Rust में `position`, `page_position` और `modifiers`। जो सबसे नज़दीकी view इसे सुनता है, पॉइंटर के नीचे वाले से बाहर की ओर गिनते हुए, उसे यह मिलता है। उस view से नज़दीक कोई text input, या edit मेनू वाला selectable text (Windows, GPUI backend, ब्राउज़र), इसके बजाय अपना मेनू दिखाता है। प्लेटफ़ॉर्म यह बटन दबते ही, जो कुछ mount है उसके आधार पर तय करता है। इसलिए हैंडलर को बाद में बताया जाता है और कुछ रद्द नहीं करना पड़ता। `disabled` view क्लिक को अपने आसपास के सबसे नज़दीकी enabled listener पर छोड़ देता है। टचस्क्रीन पर long press मेनू खोलता है: `onLongPress` को उसी function से हैंडल करें।

### Keyboard focus

macOS और वेब पर Tab कीबोर्ड फ़ोकस को उसके stops के बीच tree order में ले जाता है: inputs, प्रेस लेने वाले views, और हर `focusable` view। Focus स्टाइल (`focus:`, `.focus(..)`) फ़ोकस वाले view को स्टाइल करते हैं, और प्रेस लेने वाले view को Return या Space दबाता है। क्लिक view को फ़ोकस किए बिना उसे दबाता है, इसलिए focus स्टाइल केवल कीबोर्ड फ़ोकस पर दिखते हैं।

Focus और प्रेस अलग-अलग हैं। जो view फ़ोकस रहते हुए keys लेता है (चार्ट, slider, या ऐसी सूची जो तीर कुंजियों से अपना selection हिलाती है), वह `focusable` सेट करता है और फ़ोकस रहते हुए अपनी keys bind करता है (`onFocus` / `onBlur` के साथ [`keymap`](../modules/nsh.md#keymap))। उस पर प्रेस फिर भी उसके आसपास के pressable तक पहुँचता है, जैसे कोई कार्ड जो पेज खोलता है।

ref का `focus()` कीबोर्ड फ़ोकस को किसी stop पर ले जाता है, जैसे Tab करता है (उसके focus स्टाइल दिखते हैं और `onFocus` चलता है)। इसका उपयोग, जैसे, बंद हुए popup के trigger को फ़ोकस वापस देने के लिए किया जा सकता है। `blur()` फ़ोकस को हटा देता है।

आसपास का view `focus-within:` (`focusWithinStyle`, `.focus_within(..)`) से फ़ोकस को स्टाइल करता है, जब फ़ोकस उस पर या उसके भीतर के किसी view पर हो। जैसे edit करने वाले input के चारों ओर फ़ील्ड का frame, या टूलबार जब उसका कोई बटन फ़ोकस में हो। `Overlay` की सामग्री उस view के भीतर मानी जाती है जिसमें overlay है, चाहे वह कहीं भी दिखे, इसलिए popup को उस view का हिस्सा गिना जाता है जिसमें उसका trigger है। Rust में, component फ़ोकस के element में आने और उससे जाने को उसके ref के `on_focus_in(..)` और `on_focus_out(..)` से सुनता है: उसके भीतर के views के बीच फ़ोकस जाना इनमें से कुछ नहीं है।

| Prop | Rust | Type | Default | विवरण |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | प्रेस लेने वाले views के लिए `true` | view Tab का stop है या नहीं। `true` किसी भी view को stop बना देता है, चाहे वह प्रेस ले या उन्हें आसपास के views पर छोड़े; `false` pressable को केवल पॉइंटर के लिए छोड़ता है (popover बंद करने वाला backdrop, या ऐसी rows जिनके बीच तीर कुंजियाँ चलती हैं)। |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab (या `focus()`) ने view को कीबोर्ड फ़ोकस दिया। |
| `onBlur` | `.on_blur(..)` | `() => void` | | कीबोर्ड फ़ोकस view से चला गया। |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

### Layout and identity

| Prop | Rust | Type | विवरण |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` parent के सापेक्ष view का frame है, `{ origin, size }`, हर उस layout के बाद जो उसे बदलता है। |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | element का ref ([ref methods](#ref-methods) देखें): `ViewRef`, या उस पर element का अपना type। `ref={el}` variable को असाइन करता है, `ref={fn}` function को कॉल करता है। |
| `nativeID` | `.native_id(id)` | `string` | view को दूसरों के लिए नाम देता है, जैसे वह `InputAccessoryView` जिसका कोई input उल्लेख करता है। |
| `testID` | `.test_id(id)` | `string` | UI tests के लिए identifier (Android पर view की resource id)। |
| `key` | `.key(key)` | `string` | siblings के बीच element की पहचान। |

<a id="gestures-driving-animated-values"></a>

### Animated values को चलाने वाले gestures

ये props किसी gesture को [native animated values](../modules/nsh.md#animation) से बाँधते हैं, जो UI thread पर चलते हैं और इनके लिए ऐप के कोड में प्रति फ़्रेम कोई काम नहीं करना पड़ता। [touch and gestures](../docs/touch-and-gestures.md) देखें।

| Prop | Rust | Type | विवरण |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | Drags इन values को चलाते हैं (points)। |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | Drag शुरू हुआ। |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | Drag समाप्त हुआ, release velocity के साथ (जैसे `decay` शुरू करने के लिए)। |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | दो-उँगली pinches `scale` को चलाते हैं। |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | Pinch शुरू हुआ / समाप्त हुआ। |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | दो-उँगली rotations `angle` को चलाते हैं (degrees)। |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | Rotation शुरू हुआ / समाप्त हुआ। |

`PanEvent` है `{ cancelled, translation, velocity, value? }` (Rust में `cancelled`, `translation`, `velocity_x`, `velocity_y`, `value_x`, `value_y`)। इसमें यह होता है कि सिस्टम ने drag रद्द किया या नहीं, शुरुआत से अब तक translation, points प्रति सेकंड में velocity (`Point`s), और उस क्षण के bound values। `{ x?, y? }` उन axes के लिए होता है जिन्हें `pan` बाँधता है (drag animation के बीच किसी value को पकड़ सकता है)।

<a id="raw-touches-and-the-responder-system"></a>

### Raw touches और responder सिस्टम

जिन gestures को ऊपर के props कवर नहीं करते, उनके लिए हर element touch और responder props लेता है: `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel` (और उनके `…Capture` रूप), `onStartShouldSetResponder`, `onMoveShouldSetResponder` (और `…Capture`), `onResponderGrant`, `onResponderReject`, `onResponderStart`, `onResponderMove`, `onResponderEnd`, `onResponderRelease`, `onResponderTerminate` और `onResponderTerminationRequest`। हर हैंडलर को एक `GestureResponderEvent`
(`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...) मिलता है।
`onResponderGrant` से `true` लौटाना native scroll views को touches लेने से रोकता है। `panActivation`
(`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`) view को responder तभी बनाता है जब प्लेटफ़ॉर्म
उसका pan सक्रिय करता है, इसलिए scroll views के भीतर drags दूसरे axis को उन्हीं पर छोड़ देते हैं
([Touch and gestures](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation))।
[`PanResponder`](../modules/nsh.md#panresponder) में `PanResponder` इन्हीं पर बना है। Rust में, `.on_touch(..)` हर touch सुनता है
(`TouchEvent`), `.claim_touches(..)` तय करता है कि view उन्हें कब ले, और `.on_responder_grant(..)`,
`.on_responder_move(..)`, `.on_responder_release(..)` और बाकी responder को फ़ॉलो करते हैं।

### Accessibility

| Prop | Rust | Type | विवरण |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | view assistive technologies के लिए एक element है; उसके children अलग से expose नहीं होते। |
| `accessibilityLabel` | `.label(..)` | `string` | Screen readers जो पढ़ते हैं। बिना label वाले views अपने texts पढ़ते हैं। |
| `accessibilityHint` | `.hint(..)` | `string` | element को activate करने पर क्या होता है। |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | element क्या है (`"button"`, `"header"`, `"link"`, `"switch"`, …)। |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | वह state जो assistive technologies रिपोर्ट करती हैं (`checked` और `pressed` `"mixed"` हो सकते हैं; `current` `true` या `"page"`, `"step"`, `"location"`, `"date"`, `"time"` है)। |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | heading का level (1 सबसे ऊपर), tree item की depth (1 सबसे ऊपर)। |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | range या textual element की value। |
| `accessibilityElementsHidden` | | `boolean` | view और उसके subtree को assistive technologies से छिपाता है। |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | view expose है या नहीं। |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | Assistive technologies को दिए जाने वाले custom actions। |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | उपयोगकर्ता ने `accessibilityActions` में से किसी एक को invoke किया। |

[accessibility](../docs/accessibility.md) देखें।

<a id="platform-only-props"></a>

### केवल एक प्लेटफ़ॉर्म के props

जो props किसी एक प्लेटफ़ॉर्म पर ही होते हैं, वे TSX में उसी प्लेटफ़ॉर्म के नाम वाले object में जाते हैं, इसलिए साझा props हर जगह एक जैसे रहते हैं। केवल मौजूदा प्लेटफ़ॉर्म का object भेजा जाता है; बाकी अनदेखे किए जाते हैं। Rust builders इन्हें ऐसे methods के रूप में लेते हैं जो अपने प्लेटफ़ॉर्म पर लागू होते हैं।

| Prop | विवरण |
|---|---|
| `ios={{…}}` | iOS और Mac Catalyst। `<Input>`, `Dialog` और `WebView` अपनी keys जोड़ते हैं। |
| `android={{…}}` | Android। हर element `ripple`, `elevation` और `accessibilityLiveRegion` लेता है (नीचे)। |
| `desktop={{…}}` | डेस्कटॉप प्लेटफ़ॉर्म और डेस्कटॉप ब्राउज़र; मोबाइल पर अनदेखा। हर element `windowDrag` लेता है (नीचे)। |
| `web={{…}}` | ब्राउज़र; अन्यत्र अनदेखा। |

| `android` key | Rust | Type | विवरण |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | दबे रहने पर material ripple। |
| `elevation` | `.elevation(px(2.0))` | `number` | view के आकार से बनी material shadow (points)। |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | view के बदलावों की TalkBack को घोषणा कैसे की जाए। |

| `desktop` key | Rust | Type | विवरण |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | view को दबाने से विंडो drag होती है, जैसा उसका title bar करता; `false` drag किए जा सकने वाले view के किसी हिस्से को क्लिक योग्य रखता है। [अपना खुद का title bar](../modules/nsh-desktop.md#a-title-bar-of-your-own) देखें। |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

[platform-specific code](../docs/platform-specific.md) देखें।
<a id="ref-methods"></a>

## Ref मेथड

TSX में, `ref` को एलिमेंट का ref मिलता है, जिसका टाइप एलिमेंट का अपना होता है: `View`, `Text`, `Image`, `Canvas`, `Overlay` और `Shader` के लिए `ViewRef` (`focus`, `blur`, `measure`), और बाकी के लिए `ViewRef` के ऊपर एक टाइप, जिसमें एलिमेंट के अपने मेथड होते हैं: `InputRef` (`Input`), `ScrollRef` (`Scroll`), `ListRef` (`List`), `WebViewRef` (`WebView`), `VideoRef` (`Video`) और `NativeComponentRef` (नेटिव कॉम्पोनेंट)। Rust में, `element_ref()` एक `ElementRef` हैंडल बनाता है जिसे `.element_ref(&handle)` अटैच करता है। इनके मेथड नेटिव व्यू को कमांड भेजते हैं, और उसी टर्न में उनसे पहले किए गए बदलावों के क्रम में ही भेजते हैं। हर एलिमेंट के पेज पर बताया गया है कि उस पर कौन-से लागू होते हैं। ref वेरिएबल को उसके एलिमेंट के अपने टाइप से टाइप करें (`<Input>` के लिए `let field!: InputRef`): `ViewRef` टाइप वाला वेरिएबल ऐसे एलिमेंट के साथ फिट नहीं होता जिसके ref में अपने मेथड हों।

| मेथड | Rust | Ref | विवरण |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | किसी `<Input>` को फ़ोकस करता है (कीबोर्ड दिखाता है), या प्रेस स्वीकार करने वाले व्यू को कीबोर्ड फ़ोकस देता है / अनफ़ोकस करता है। |
| `measure()` | `measure()` | `ViewRef` | [व्यू कहाँ है](../docs/touch-and-gestures.md#where-a-view-is-measure)। |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | UTF-16 यूनिट में `start..end` को सेलेक्ट करता है; `end` के बिना कैरेट रखता है। |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`, `ListRef` | किसी ऑफ़सेट तक स्क्रोल करता है। |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef` (ज़ूम किया जा सकने वाला `<Scroll>`) | कंटेंट के किसी पॉइंट के आसपास `scale` तक ज़ूम करता है। |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | लिस्ट की अक्ष (axis) के साथ किसी ऑफ़सेट तक स्क्रोल करता है। |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | किसी आइटम को व्यू में स्क्रोल करके लाता है। |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`, `ListRef` | कंटेंट के अंत तक स्क्रोल करता है। |
| `reload()`, `goBack()`, `goForward()`, `stopLoading()`, `injectJavaScript(script)`, `postMessage(data)` | `reload()`, `go_back()`, `go_forward()`, `stop_loading()`, `inject_java_script(..)`, `post_message(..)` | `WebViewRef` | पेज को नियंत्रित करता है। |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | किसी समय पर जाता है। |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | रजिस्टर किए गए नेटिव कॉम्पोनेंट के कमांड को कॉल करता है ([`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule))। |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## हैंडलर UI को कभी ब्लॉक क्यों नहीं करते

मुख्य थ्रेड ऐप के कोड का इंतज़ार कभी नहीं करता। जब सिस्टम को उसी समय जवाब चाहिए होता है (क्या यह टेक्स्ट बदल सकता है, क्या बैक बटन पेज को पॉप कर सकता है, क्या यह शीट बंद हो सकती है), तब NSH पहले से सेट किए गए प्रॉप्स (`maxLength`, `popOnBack`, `closeOnSwipe`, …) के आधार पर उसका जवाब नेटिव रूप से देता है, और इवेंट ऐप तक बाद में पहुँचता है। इसीलिए ऐसा व्यवहार प्रॉप होता है, हैंडलर का रिटर्न वैल्यू नहीं।
