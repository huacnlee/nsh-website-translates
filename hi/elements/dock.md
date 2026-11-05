---
title: "Dock"
description: "DockArea: विभाजनों (splits), टैब समूहों और बाएँ, दाएँ तथा निचले किनारों पर डॉक्स का एक डॉक करने योग्य वर्कस्पेस, जिसका लेआउट वह डेटा है जिसका स्वामित्व ऐप के पास रहता है। यह एरिया टैब को ड्रैग और ड्रॉप करना, आकार बदलना, डॉक्स, ज़ूम और लॉक को संभालता है, हर पैनल की सामग्री को उसके स्थान बदलने पर भी सुरक्षित रखता है, और फ़ोन के अनुरूप ढल जाता है; दिखावट और पैनलों की सामग्री ऐप की ज़िम्मेदारी है।"
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---

# Dock

डॉक एरिया एक ऐसा वर्कस्पेस है जिसे उपयोगकर्ता खुद व्यवस्थित करता है: पैनल टैब समूहों में रहते हैं, समूह अगल-बगल बँटे या ऊपर-नीचे रखे जा सकते हैं, और बाएँ, दाएँ तथा निचले किनारों पर ऐसे डॉक होते हैं जो खुलते, बंद होते और आकार बदलते हैं। किसी टैब को दूसरे समूह पर खींचने से वह उसमें जुड़ जाता है, समूह के किनारे पर खींचने से वह समूह बँट जाता है, और हर पैनल एक जगह से दूसरी जगह जाते समय अपनी सामग्री बनाए रखता है। `DockArea` व्यवहार संभालता है: टैब का ड्रैग और ड्रॉप (जो नेटिव रूप से हर फ़्रेम पर चलते हैं), स्प्लिट और डॉक का आकार बदलना, डॉक खोलना और बंद करना, ज़ूम और लॉक। रूप-रंग ऐप का अपना है: टैब, टैब बार, हैंडल, ड्रॉप इंडिकेटर और हर पैनल की सामग्री को ऐप ही रेंडर और स्टाइल करता है, और एरिया अपनी ओर से कुछ नहीं बनाता।

```rust tabs
use nsh_base::{
    dock::{DockAreaLayout, DockLayout, DockPanel, DockPlacement, DockRegion, DockTab},
    dock_area, theme,
};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    let layout = signal(
        DockAreaLayout::new(
            DockLayout::h_split()
                .child(DockLayout::tabs().panel("readme").panel("main"), None)
                .child(DockLayout::tabs().panel("preview"), Some(px(320.0))),
        )
        .with_dock(DockPlacement::Left, DockRegion::new(DockLayout::tabs().panel("files")))
        .with_dock(DockPlacement::Bottom, DockRegion::new(DockLayout::tabs().panel("terminal"))),
    );
    dock_area()
        .layout(move || layout.get())
        .on_layout_change(move |next: &DockAreaLayout| layout.set(next.clone()))
        .handle_style(|s| s.bg(move || theme().border()))
        .tab_bar_style(|s| s.flex_row().border_b_1().border_color(move || theme().border()))
        .tab_style(|s| s.px_3().py_1().selected(|s| s.bg(move || theme().muted())))
        .render_tab(|tab: &DockTab| text(tab.panel.to_string()).text_sm().text_color(move || theme().foreground()))
        .render_panel(|panel: &DockPanel| {
            text(format!("{} content", panel.id)).p_4().text_color(move || theme().foreground())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { DockArea, type DockAreaLayout } from "nsh/base";

const titles: Record<string, string> = {
  files: "Files", readme: "README.md", main: "main.rs", preview: "Preview", terminal: "Terminal",
};

function App() {
  const layout = signal<DockAreaLayout>({
    center: {
      type: "split",
      axis: "horizontal",
      children: [
        { type: "tabs", panels: ["readme", "main"] },
        { type: "tabs", panels: ["preview"] },
      ],
      sizes: [null, 320],
    },
    left: { layout: { type: "tabs", panels: ["files"] }, size: 240 },
    bottom: { layout: { type: "tabs", panels: ["terminal"] }, size: 180 },
  });
  return (
    <DockArea
      class="size-full bg-background"
      layout={layout()}
      onLayoutChange={(e) => layout.set(e.layout)}
      handleClass="bg-border group-active:bg-primary"
      tabBarClass="flex-row border-b border-border"
      tabClass="px-3 py-1.5 selected:bg-muted"
      renderTab={(tab) => <Text class="text-sm text-foreground">{titles[tab.panel]}</Text>}
      renderPanel={(panel) => <Text class="p-4 text-foreground">{titles[panel.id]} content</Text>}
    />
  );
}

mount(App);
```

`DockArea` और उसके मान [`nsh/base`](../modules/nsh-base.md) से आते हैं, जो Rust में `nsh-base` क्रेट है (`nsh_base::dock_area()`, मान `nsh_base::dock` में)। Rust में `dock_area()` इसे बनाता है, जिसमें हर प्रॉप के लिए एक सेटर, हर इवेंट के लिए एक लिस्नर और टाइप्ड स्टाइल मेथड होते हैं; `DockLayout` पैनलों की कुंजियों से लेआउट का वर्णन करता है (`h_split()`, `v_split()`, `tabs()`, `.child(layout, size)`, `.panel(key)`)।

<a id="the-layout"></a>

## लेआउट

लेआउट एक मान है, `DockAreaLayout`: केंद्र, और बाएँ, दाएँ तथा निचले किनारों में से हर एक पर एक डॉक, जिनमें से हर डॉक वैकल्पिक है। हर क्षेत्र दो प्रकार के नोड का एक ट्री है:

| नोड | क्या रखता है | फ़ील्ड |
|---|---|---|
| `{ type: "split" }` | अन्य नोड, अगल-बगल (`axis: "horizontal"`) या ऊपर-नीचे (`"vertical"`) | `children`, और `sizes`: अक्ष के अनुदिश हर चाइल्ड की लंबाई पॉइंट में, `null` बाकी जगह साझा करने के लिए |
| `{ type: "tabs" }` | पैनल, कुंजी के अनुसार, एक समय में एक दिखता है | `panels` (कुंजियाँ, टैब के क्रम में), `activeIndex` (दिखने वाला पैनल, डिफ़ॉल्ट 0) |

पैनल हमेशा किसी टैब समूह में रहता है: एक पैनल वाला क्षेत्र एक पैनल का टैब समूह होता है। पैनल की कुंजी ऐप की ओर से उसके लिए दी गई स्ट्रिंग है (`"files"`, किसी दस्तावेज़ की id), और एक कुंजी पूरे लेआउट में केवल एक बार आती है। डॉक (`DockRegion`) में उसका ट्री (`layout`), उसके किनारे के आर-पार उसका आकार (`size`, डिफ़ॉल्ट 200, कम से कम 100), वह खुला है या नहीं (`open`, डिफ़ॉल्ट `true`), और क्या उसके किनारे को उसके न्यूनतम आकार से नीचे खींचने पर वह बंद हो जाता है (`collapsible`, डिफ़ॉल्ट `true`) शामिल हैं।

हर नोड की एक `id` होती है। ऐप जो लेआउट लिखता है उसमें id छोड़ी जा सकती है: एरिया उन्हें असाइन कर देता है, और वह जो भी लेआउट रिपोर्ट करता है उसमें id होती हैं। रिपोर्ट किया गया लेआउट वापस पास करने से हर समूह की पहचान बनी रहती है, जिसके आधार पर ref के मेथड समूहों को नाम देते हैं। एरिया को दिए गए लेआउट को वह व्यवस्थित भी करता है: खाली समूह या स्प्लिट हटा दिया जाता है, एक चाइल्ड वाला स्प्लिट उसी चाइल्ड में बदल जाता है, उसी अक्ष वाले स्प्लिट के भीतर का स्प्लिट अपने पैरेंट में मिल जाता है, `activeIndex` सीमा में रहता है, और दो बार लिखी गई कुंजी अपनी पहली जगह पर ही रहती है। वह जो लेआउट रिपोर्ट करता है वे हमेशा इसी एक मानक रूप में होते हैं।

लेआउट ऐप का है (`layout`): उपयोगकर्ता का किया हर बदलाव (टैब चुनना, खींचना या बंद करना, स्प्लिट या डॉक का आकार बदलना, डॉक खोलना या बंद करना) पूरे नए लेआउट के रूप में रिपोर्ट होता है (`onLayoutChange`), और एरिया वही लेआउट दिखाता है जो ऐप वापस पास करता है। ऐप खुद लेआउट बदलने के लिए नया मान पास करता है: सहेजा हुआ लेआउट बहाल करना, या वर्कस्पेस को पुनर्व्यवस्थित करने वाला कमांड। `layout` के बिना एरिया अपना लेआउट खुद रखता है, `defaultLayout` से शुरू करके, और फिर भी हर बदलाव रिपोर्ट करता है।

<a id="panels-content"></a>

## पैनलों की सामग्री

पैनल क्या दिखाता है, यह ऐप का है: `renderPanel` पैनल की कुंजी से उसे रेंडर करता है (`panel.id`)। किसी समूह के हर पैनल को जगह दी जाती है और केवल दिखने वाला पैनल दिखाया जाता है, इसलिए टैब बदलने पर हर पैनल की सामग्री बनी रहती है; और जब कोई पैनल चलता है (दूसरे समूह में, किसी डॉक में, ज़ूम में और वापस), तो वही सामग्री उसके साथ चलती है: उसके बनाए सिग्नल, इनपुट का टेक्स्ट, स्क्रॉल पोज़िशन, वेब व्यू का पेज, सब बने रहते हैं। एरिया पैनल को पहली बार दिखने पर एक बार रेंडर करता है, और पैनल के लेआउट से हटने पर उसकी सामग्री छोड़ देता है (`onPanelRemove`)।

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` कुंजी के अनुसार तय करता है कि हर पैनल क्या-क्या अनुमति देता है; सूची में न दिया गया पैनल सब कुछ अनुमत करता है:

| फ़ील्ड | डिफ़ॉल्ट | विवरण |
|---|---|---|
| `id` | | पैनल की कुंजी। |
| `closable` | `true` | इसे बंद किया जा सकता है। |
| `zoomable` | `true` | जब यह दिख रहा हो, तब इसका समूह ज़ूम हो सकता है। |
| `visible` | `true` | यह दिखता है। छिपा हुआ पैनल अपनी जगह रखता है और वहीं लौट आता है; जिस समूह या स्प्लिट के सभी पैनल छिपे हों, वह कोई जगह नहीं घेरता। |

<a id="tabs"></a>

## टैब

हर समूह में एक टैब बार होता है जिसमें हर दिखने वाले पैनल के लिए एक टैब होता है, उसके `panels` के क्रम में। `renderTab` रेंडर करता है कि टैब क्या दिखाए (उसका शीर्षक, एक आइकन, ऐप का अपना क्लोज़ बटन); इसके बिना टैब पैनल की कुंजी दिखाता है। एरिया उसे टैब बनाता है: प्रेस करने पर वह चुना जाता है, ड्रैग करने पर उसका पैनल चलता है, स्क्रीन रीडर उसे चुनी हुई स्थिति के साथ टैब के रूप में सुनाते हैं, और `tabClass` की `selected:` क्लासें दिखने वाले टैब को स्टाइल करती हैं। टैब का मान बताता है कि ऐप को उसे बनाने के लिए क्या चाहिए:

| फ़ील्ड | प्रकार | विवरण |
|---|---|---|
| `panel` | `string` | पैनल की कुंजी। |
| `group` | `number` | जिस टैब समूह में वह है उसकी id। |
| `index` | `number` | समूह के दिखने वाले टैबों में उसकी जगह। |
| `active` | `boolean` | यह समूह का दिखता हुआ टैब है। |
| `closable` | `boolean` | एरिया इसे बंद करेगा: यह बंद किया जा सकता है, एरिया लॉक नहीं है, और इसका समूह इसे छोड़ सकता है। |
| `zoomed` | `boolean` | इसका समूह ज़ूम है। |

```tsx
let area!: DockAreaRef;

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderTab={(tab) => (
    <View class="flex-row items-center gap-2">
      <Text class="text-sm">{titles[tab.panel]}</Text>
      <If when={tab.closable}>
        <Button onPress={() => area.closePanel(tab.panel)} accessibilityLabel="Close" class="rounded-sm px-1 hover:bg-muted">
          <Text class="text-xs">×</Text>
        </Button>
      </If>
    </View>
  )}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```

<a id="drag-and-drop"></a>

## ड्रैग और ड्रॉप

किसी समूह पर खींचा गया टैब दिखाता है कि वह कहाँ उतरेगा, और ड्रॉप उसे वहीं रख देता है:

| जहाँ ड्रॉप किया गया | पैनल |
|---|---|
| टैब बार | उस समूह में जुड़ता है, उन टैबों के बीच जिनके पास ड्रॉप किया गया |
| समूह की सामग्री का मध्य भाग | उस समूह में जुड़ता है |
| समूह की सामग्री का किनारा (हर ओर का बाहरी 35%) | उस समूह को बाँटता है: उस ओर उसका अपना एक नया समूह |

ड्रैग के ऊपर मँडराते समय एरिया समूह के उस हिस्से पर ड्रॉप इंडिकेटर दिखाता है जिसे पैनल लेगा (जुड़ने पर पूरी सामग्री, बाँटने पर आधी): यह एक ऐसा पार्ट है जिसे ऐप स्टाइल करता है (`dropIndicatorClass`), और ऐप कुछ रेंडर करे तो उसकी अपनी सामग्री के साथ (`renderDropIndicator`, जिसे `group`, बँटने वाला `side` या टैब बार `index` बताया जाता है)। यह हर नई जगह पर नेटिव रूप से जाता है, वहाँ धीरे-धीरे पहुँचता है और दूसरे समूह पर फ़ेड इन होता है जबकि पिछले पर फ़ेड आउट होता है (उपयोगकर्ता कम मोशन माँगे तो तुरंत)। पॉइंटर या उँगली के पीछे जो चलता है वह भी ऐप का है (`renderDragPreview`)। एक ड्रॉप लेआउट का एक बदलाव है, जो एक बार रिपोर्ट होता है; जो ड्रॉप कुछ नहीं बदलेगा, वह कुछ नहीं बदलता।

लॉक किया हुआ एरिया, ज़ूम किया हुआ एरिया, और ऐसे समूह का आखिरी पैनल जिसके बगल में कुछ न हो, कुछ भी ड्रैग नहीं करते।

<a id="docks"></a>

## डॉक

डॉक अपने पैनल या आकार खोए बिना खुलता और बंद होता है: बंद करने पर उसका ट्री बना रहता है, और खोलने पर वही समूह उसी आकार में दिखते हैं। डॉक और केंद्र के बीच का किनारा एक हैंडल है जिसे उपयोगकर्ता डॉक का आकार बदलने के लिए खींचता है; डॉक कम से कम 100 पॉइंट रहता है और केंद्र भी कम से कम 100 पॉइंट रखता है, और 50 पॉइंट से नीचे छोड़ा गया collapsible डॉक बंद हो जाता है और खुलने के समय के लिए अपना आकार रखता है। एरिया हमेशा अपनी सीमाओं में समाता है: डॉक अपने `size` पर उतनी जगह में दिखता है जितनी एरिया उसके लिए छोड़ता है, और जब वह भी न समाए, तो डॉक बाकी के साथ सिकुड़ते हैं और स्प्लिटों के न्यूनतम आकार झुक जाते हैं। `renderDock` डॉक का अपना क्रोम उसके लेआउट से पहले बनाता है (एक टाइटल स्ट्रिप, एक कोलैप्स बटन), जिसे उसका `placement`, `open`, `size` और `collapsible` बताया जाता है; `dockClass` उसके फ़्रेम को स्टाइल करता है।

ऐप से डॉक खोलें, बंद करें और उनका आकार बदलें ref के ज़रिए (`toggleDock`, `setDockOpen`, `setDockSize`), जो दोनों प्रेज़ेंटेशन में काम करते हैं, या अपने पास किए गए लेआउट में डॉक के `open` और `size` लिखकर (`open` पूर्ण प्रेज़ेंटेशन का है)। `onDockOpenChange` हर बार रिपोर्ट करता है जब कोई डॉक दिखता या छिपता है, जिसे लेआउट के `open` के सापेक्ष मापा जाता है (जो एरिया शुरू से ही compact है वह लेआउट में खुले हर डॉक को छिपा हुआ रिपोर्ट करता है), इसलिए जो टॉगल लेआउट के `open` से शुरू होकर `onDockOpenChange` को फ़ॉलो करता है वह हमेशा डॉक की स्थिति दिखाता है:

```tsx
const terminalOpen = signal(true);

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  onDockOpenChange={({ placement, open }) => placement === "bottom" && terminalOpen.set(open)}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>

<Button selected={terminalOpen()} onPress={() => area.toggleDock("bottom")} class="px-3 py-1.5 selected:bg-muted">
  <Text>Terminal</Text>
</Button>
```

<a id="zoom"></a>

## ज़ूम

ज़ूम किया गया समूह पूरे एरिया को भर देता है, जब तक उसे ज़ूम आउट न किया जाए या वह लेआउट से न हट जाए (`area.toggleZoom(group)`, और ज़ूम आउट करने के लिए `area.toggleZoom()`), और `onZoomChange` उस पैनल को रिपोर्ट करता है जिसे वह दिखाता है, या `null`। ज़ूम समूह का होता है, इसलिए जब उसका दिखता हुआ पैनल बंद होता है और अगला पैनल उसकी जगह लेता है, तब भी वह ज़ूम रहता है। `zoomable: false` वाला पैनल, जब तक वह दिख रहा हो, अपने समूह को ज़ूम होने से रोकता है।

<a id="locking"></a>

## लॉकिंग

`locked` व्यवस्था को जैसी है वैसी रखता है: न टैब ड्रैग, न ड्रॉप, न क्लोज़। टैब चुनना, आकार बदलना, और डॉक खोलना व बंद करना फिर भी काम करते हैं, इसलिए लॉक किया हुआ वर्कस्पेस भी उपयोग करने लायक वर्कस्पेस रहता है।

<a id="methods"></a>

## मेथड

`ref={area}` एरिया के मेथड देता है (`DockAreaRef`), ऐप के कमांड, शॉर्टकट और मेनू के लिए। हर संपादन `onLayoutChange` के साथ रिपोर्ट होता है, ठीक वैसे ही जैसे उपयोगकर्ता के संपादन होते हैं। जिस मेथड को ऐसा पैनल, समूह, टैब इंडेक्स या डॉक दिया जाए जो लेआउट में नहीं है, वह लेआउट को जैसा है वैसा छोड़ देता है और मेथड का नाम तथा मान बताते हुए एक चेतावनी लॉग करता है।

| मेथड | विवरण |
|---|---|
| `layout()` | `Promise<DockAreaLayout>`: दिखाया गया लेआउट। |
| `addPanel(panel, placement?, size?)` | किसी क्षेत्र में पैनल जोड़ता है (`"center"`, डिफ़ॉल्ट, `"left"`, `"right"`, `"bottom"`), उसके पहले टैब समूह में, दिखता हुआ; जो डॉक मौजूद नहीं है वह बनाया जाता है, `size` आर-पार। एरिया में पहले से मौजूद पैनल वहाँ चला जाता है। |
| `removePanel(panel)` | पैनल को हटाता है, उसके विकल्प कुछ भी कहें। |
| `closePanel(panel)` | पैनल को वैसे बंद करता है जैसे उसका टैब करता: जब तक एरिया लॉक न हो, पैनल बंद करने योग्य हो, और वह ऐसे समूह का आखिरी पैनल न हो जिसके बगल में कुछ नहीं है। |
| `movePanel(panel, target)` | पैनल को `target` पर ले जाता है: `{ group, side?, index?, activate?, size? }`, टैब समूह `group` में (`index` पर) या उसके `side` पर नए समूह में (`size` नए स्प्लिट के अनुदिश पॉइंट)। |
| `splitAt(group, panel, side)` | पैनल को किसी कंटेनर की एक ओर (`"left"`, `"right"`, `"top"`, `"bottom"`) नए टैब समूह में रखता है। |
| `selectPanel(panel)` | पैनल को उसके समूह में दिखाता है। |
| `selectTab(group, index)` | किसी समूह का एक टैब दिखाता है। |
| `toggleDock(placement)`, `setDockOpen(placement, open)` | डॉक खोलता या बंद करता है। |
| `setDockSize(placement, size)` | डॉक के किनारे के आर-पार उसका आकार तय करता है (कम से कम 100)। |
| `toggleZoom(group?)` | समूह को ज़ूम इन करता है, या ज़ूम होने पर ज़ूम आउट करता है; `group` के बिना, ज़ूम किए गए समूह को ज़ूम आउट करता है। |
| `zoomedGroup()` | `Promise<number \| null>`: ज़ूम किए गए समूह की id। |
| `groupOf(panel)` | `Promise<number \| null>`: पैनल को रखने वाले टैब समूह की id। |

Rust में एरिया पर `component_ref::<DockArea>()` और `.component_ref(&r)` एक ref देते हैं जिसके `r.api::<DockAreaApi>()` में वही मेथड snake case में होते हैं।

<a id="saving-and-restoring"></a>

## सहेजना और बहाल करना

रिपोर्ट किया गया लेआउट सादा डेटा है, इसलिए उसे सहेजना [storage](../modules/nsh.md#storage) में `JSON.stringify(layout)` करना है, और बहाल करना पार्स किए गए मान को `layout` के रूप में पास करना है। `onLayoutChange` हर बदलाव रिपोर्ट करता है, आकार बदलना और टैब चुनना भी शामिल, इसलिए storage में तब लिखें जब बदलाव थम जाएँ (हर रिपोर्ट पर रीसेट होने वाला छोटा टाइमर)।

Rust में `DockAreaLayout::to_state` और `from_state` `DockAreaState` को पढ़ते और लिखते हैं, जो वही लेआउट फ़ाइल फ़ॉर्मैट है जिसे `gpui-base` का डॉक भी उपयोग करता है।

<a id="phones-and-narrow-windows"></a>

## फ़ोन और संकरी विंडो

डॉक अपनी चौड़ाई के अनुसार ढल जाता है। 600 पॉइंट या उससे चौड़ा एरिया (डेस्कटॉप की विंडो, वेब, टैबलेट, फ़ुल स्क्रीन iPad, खुले फ़ोल्डेबल में) पूरा वर्कस्पेस है: स्प्लिट, समूह और डॉक अगल-बगल, जैसे टैबलेट के मल्टी-पेन ऐप्स में। फ़ोन या टैबलेट पर उँगली से टैब ड्रैग लॉन्ग प्रेस पर शुरू होता है, जैसा iPadOS के ड्रैग और ड्रॉप में होता है, इसलिए टैब बार स्वाइप पर फिर भी स्क्रॉल होता है, और हैंडल उसी रूप के साथ ज़्यादा चौड़ा टच एरिया लेते हैं।

600 पॉइंट से संकरा एरिया (फ़ोन पर, Slide Over में iPad पर, संकरी डेस्कटॉप या ब्राउज़र विंडो में, या चौड़ी विंडो के संकरे कॉलम में) उसी लेआउट को एक स्क्रीन के लिए प्रस्तुत करता है, जैसे iPad के स्प्लिट व्यू अपने कॉलम समेट लेते हैं और Material Design का सपोर्टिंग पेन बॉटम शीट बन जाता है:

- केंद्र एक समय में एक समूह पूरे आकार में दिखाता है। उसका टैब बार केंद्र के हर दिखने वाले पैनल को सूचीबद्ध करता है, और दूसरे समूह का पैनल चुनने पर वह समूह दिखने वाला समूह बन जाता है।
- बाएँ और दाएँ डॉक केंद्र के ऊपर उनके किनारे से निकलने वाले ड्रॉअर हैं, डॉक जितने चौड़े, और निचला डॉक डॉक जितनी ऊँचाई की शीट है। एक समय में एक दिखता है, जब ऐप उसे प्रस्तुत करे (`toggleDock`, `setDockOpen`, जो दूसरे को बंद कर देते हैं); वह अंदर और बाहर स्लाइड होता है, और उसके बैकड्रॉप पर प्रेस, Escape या back उसे बंद कर देता है। compact प्रेज़ेंटेशन में प्रवेश करने पर कोई नहीं दिखता।
- खींचा गया टैब (लॉन्ग प्रेस के बाद उँगली, या पॉइंटर तुरंत) टैब बार के भीतर चलकर उसका क्रम बदलता है।

हर पैनल दोनों प्रेज़ेंटेशन में जगह पर रहता है, इसलिए बदलने पर उसकी सामग्री बनी रहती है। दिखाया गया ड्रॉअर या शीट compact प्रेज़ेंटेशन की अपनी चीज़ है: लेआउट का `open` पूर्ण प्रेज़ेंटेशन का है, और ड्रॉअर को प्रस्तुत करना या बंद करना कोई `onLayoutChange` रिपोर्ट नहीं करता, इसलिए जो एरिया फिर चौड़ा होता है वह डॉक को ठीक वैसे ही दिखाता है जैसे वे थे। `onDockOpenChange` दोनों को रिपोर्ट करता है: वह डॉक जिसके लेआउट का `open` पूर्ण प्रेज़ेंटेशन में बदलता है, compact में दिखाया या बंद किया गया ड्रॉअर या शीट, और प्रेज़ेंटेशन बदलने पर हर वह डॉक जिसकी दिखाई देने की स्थिति बदलती है। `renderDock` में `open` यह है कि डॉक मौजूदा प्रेज़ेंटेशन में दिखता है या नहीं। लेआउट भी वही मान रहता है, इसलिए जो एरिया 600 पॉइंट को पार करता है (फ़ोल्डेबल का खुलना, iPad का Split View में जुड़ना, विंडो या कॉलम का आकार बदलना) वह हर पैनल को उसकी जगह पर रखता है, और ऐप एक ही लेआउट सहेजता है। एरिया की चौड़ाई तब तय करती है जब वह लेआउट हो जाता है (उससे पहले विंडो की चौड़ाई उसकी जगह लेती है), और `compact` चौड़ाई की जगह प्रेज़ेंटेशन चुनता है। ड्रॉअर, शीट और बैकड्रॉप ऐसे पार्ट हैं जिन्हें ऐप स्टाइल करता है (`drawerClass`, `sheetClass`, `backdropClass`), जैसे एरिया का बाकी हिस्सा।

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  drawerClass="bg-background border-r border-border"
  sheetClass="rounded-t-(--radius-lg) bg-background"
  backdropClass="bg-black/40"
  renderTab={(tab) => <Text>{titles[tab.panel]}</Text>}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```
## Props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | none | दिखाया गया layout (controlled): `onLayoutChange` जो report करता है, उसे वापस पास करें। |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | एक खाली center | शुरुआती layout, जब `layout` सेट नहीं होता; इसके बाद area अपना layout खुद बनाए रखता है। |
| `locked` | `.locked(..)` | `boolean` | `false` | कोई tab drag, drop या close नहीं होता। |
| `compact` | `.compact(..)` | `boolean` | चौड़ाई के अनुसार | फ़ोन presentation (`true`) या पूर्ण presentation (`false`); इसके बिना, जब तक area 600 points से संकरा है, compact रहता है। |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | हर panel key के अनुसार क्या अनुमति देता है: `closable`, `zoomable`, `visible`। |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | none | किसी panel की सामग्री, उसकी key (`panel.id`) द्वारा। |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | key | tab क्या दिखाता है। |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | none | drop indicator के अंदर क्या है: `group`, `side`, `index`। |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | none | dock का अपना chrome, उसके layout से पहले: `placement`, `open` (वर्तमान presentation में दिखाया गया), `size`, `collapsible`। |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | none | खाली center क्या दिखाता है। |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | none | tab को drag करते समय pointer या उंगली के साथ क्या चलता है। |
| `groupClass`, `groupStyle` | `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | हर tab group का frame। |
| `tabBarClass`, `tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | हर tab bar (पंक्ति के लिए `flex-row`)। |
| `tabClass`, `tabStyle` | `.tab_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | हर tab; प्रदर्शित tab के लिए `selected:`। |
| `contentClass`, `contentStyle` | `.content_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | हर group का content frame, जहाँ उसके panels दिखते हैं। |
| `dropIndicatorClass`, `dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | drop indicator। |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | हर handle का indicator, split के groups के बीच और हर dock के किनारे पर; `group-hover:` और `group-active:` handle का अनुसरण करते हैं। यह handle के आर-पार 1 point का होता है और जब तक अन्यथा न कहा जाए, पूरी लंबाई में चलता है, इसलिए `bg-border` दोनों स्थितियों में एक बारीक रेखा है; `w-[3px]` / `h-[3px]` इसे मोटा करते हैं। |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | हर handle का thumb: रेखा पर केंद्रित एक grip, जो ऊर्ध्वाधर रेखा की तरह सीधा बनता है और क्षैतिज रेखा पर एक चौथाई घुमा दिया जाता है, ताकि एक ही class दोनों axes के लिए काम करे। handle के hover, press और drag होने के दौरान यह वही view रहता है, इसलिए `group-hover:` और `group-active:` classes इसे transition करती हैं (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`)। |
| `dockClass`, `dockStyle` | `.dock_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | हर dock का frame। |
| `drawerClass`, `drawerStyle` | `.drawer_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | Compact: side docks के drawers। |
| `sheetClass`, `sheetStyle` | `.sheet_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | Compact: bottom dock की sheet। |
| `backdropClass`, `backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | none | Compact: खुले drawer या sheet के पीछे का backdrop, जिसे दबाने पर वह बंद हो जाता है। |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | none | split के groups के बीच और हर dock के किनारे पर, हर handle के लिए screen readers क्या बोलते हैं। |
| `ref` | `.component_ref(&r)` (`component_ref::<DockArea>()`) | `DockAreaRef` | | area के [methods](#methods)। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | none | स्वयं area: उसके parent में उसका आकार (`flex-1`), उसका background। यह अपनी सीमाओं के भीतर रहता है और अपनी सामग्री से कोई न्यूनतम आकार नहीं लेता। |

## Events

| Event | Rust | Description |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | layout बदला (drag, चयन, resize, dock का खुलना या बंद होना, कोई method): `{ layout }`, पूरा नया layout, उसमें मौजूद हर id। |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)` (`PanelActiveChange(panel, active)`) | `{ panel, active }`: कोई panel अपने group का प्रदर्शित tab बना, या नहीं रहा (बंद dock कोई tab प्रदर्शित नहीं करता)। हर बदलाव पर एक बार; जो panel हट जाता है उसे `false` नहीं बताया जाता: `onPanelRemove` ही उसका अंत है। |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }`: कोई panel area को हमेशा के लिए छोड़ गया: बंद हुआ, हटाया गया, या नए layout में अनुपस्थित है। जो panel केवल स्थानांतरित होता है, उसे यह कभी नहीं मिलता। |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | कोई group zoom in या zoom out हुआ: `{ panel }`, वह panel जिसे वह प्रदर्शित करता है, या `null`। |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)` (`DockOpenChange(placement, open)`) | `{ placement, open }`: कोई dock दिखा या छिपा: full presentation में उसका layout `open` बदला, compact में उसका drawer या sheet दिखाया या हटाया गया, या presentation बदल गया। |

## Parts

| Part | Inside | Styled with | States |
|---|---|---|---|
| The area | | `class`, `style` | |
| A tab group | एक region | `groupClass`, `groupStyle` | |
| A tab bar | एक group | `tabBarClass`, `tabBarStyle` | |
| A tab | एक tab bar | `tabClass`, `tabStyle`; `renderTab` | `selected:`, `active:`, `hover:` |
| A group's content | एक group | `contentClass`, `contentStyle`; `renderPanel` | |
| A handle's indicator | split के groups के बीच, dock के किनारे पर | `handleClass`, `handleStyle` | `group-hover:`, `group-active:` |
| A handle's thumb | handle की रेखा पर केंद्रित | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (drag समाप्त होने तक pressed) |
| A dock | एक किनारा | `dockClass`, `dockStyle`; `renderDock` | |
| The drop indicator | drag के दौरान किसी group के ऊपर | `dropIndicatorClass`, `dropIndicatorStyle`; `renderDropIndicator` | |
| The drag preview | pointer या उंगली के नीचे | `renderDragPreview` | |
| The empty center | center | `renderEmpty` | |
| A drawer, the sheet, the backdrop | center के ऊपर, compact | `drawerClass`, `sheetClass`, `backdropClass` (और उनकी styles) | |

## Accessibility

- हर tab screen readers के लिए अपनी selected state के साथ एक tab है, जैसा कि [`Tab`](./tabs.md) है, और उसे सक्रिय करने पर वह चुना जाता है। उसका label वही text है जो `renderTab` बनाता है।
- split के groups के बीच और हर dock के किनारे पर मौजूद हर handle एक adjustable element है, जिसका label `handleAccessibilityLabel` है। split के groups के बीच के handles [Resizable](./resizable.md) के हैं: screen reader उन्हें एक बार में 10 points खिसकाता है, जिसकी रिपोर्ट `onLayoutChange` के साथ की जाती है।
- compact presentation में, Escape और back दिखाए गए drawer या sheet को हटा देते हैं।

labels, roles और announcements के बारे में सामान्य रूप से [Accessibility](../docs/accessibility.md) देखें।

## Platform notes

- pointer (माउस, trackpad, स्क्रीन के ऊपर मंडराता pen) button दबे होने पर 4 points हिलने के बाद tab को drag करता है, हर platform पर: trackpad वाला iPad और माउस drag से चलाई जा रही संकरी browser window, desktop की तरह ही। macOS, Windows, Linux और GPUI पर हर press pointer की मानी जाती है, touchscreen वाले laptop की उंगली भी।
- iOS, iPadOS और Android पर उंगली लंबे press के बाद tab को drag करती है, जैसा iPadOS का drag and drop करता है, इसलिए tab bar पर swipe करने से वह scroll होता है।
- Desktops और web: handles अपने axis का resize cursor दिखाते हैं।
- Phones और संकरे areas: compact presentation, drawers और एक bottom sheet के साथ।
- हर platform वही बनाता है जो app style करता है: tabs, tab bars, handles, drop indicator, docks, drawers और sheet।
