---
title: "RichEditor"
description: "nsh/base का रिच टेक्स्ट एडिटर: ऐप के स्कीमा द्वारा परिभाषित दस्तावेज़, कमांड, प्लगइन, हिस्ट्री, कीमैप, इनपुट रूल और Markdown, ProseMirror के आर्किटेक्चर के अनुरूप, जिसकी स्टेट Rust में रहती है।"
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---

# RichEditor

`RichEditor` ProseMirror के आर्किटेक्चर पर बना एक रिच टेक्स्ट एडिटर है। ऐप स्कीमा के ज़रिए तय करता है कि डॉक्यूमेंट किन चीज़ों से बना है (पैराग्राफ़, हेडिंग, लिस्ट, मेंशन, या जो भी नोड और मार्क टाइप चाहिए), और एडिटर हर डॉक्यूमेंट को उस स्कीमा के अनुसार वैध रखता है। बदलाव स्टेप होते हैं जो ट्रांज़ैक्शन में समूहित होते हैं, इसलिए उन्हें अनडू किया जा सकता है, वे पोज़िशन को मैप करते हैं और JSON के रूप में भेजे जा सकते हैं; व्यवहार प्लगइन से आता है (हिस्ट्री, कीमैप, इनपुट रूल, Markdown शॉर्टकट, और ऐप के अपने प्लगइन); कमांड ऐसी वैल्यू हैं जिन्हें टूलबार चलाता है और जिनसे पूछताछ भी करता है। एडिटर की स्टेट, उसके कमांड और उसके प्लगइन Rust में चलते हैं: टाइपिंग, की बाइंडिंग और इनपुट रूल कभी JS का इंतज़ार नहीं करते, और ऐप स्टेट को तभी JSON के रूप में पढ़ता है जब वह उसे माँगता है।

एडिटर के दो हिस्से होते हैं: सेशन (`createRichEditor`), जो स्टेट का मालिक है और जिसे ऐप का कोड चलाता है, और व्यू (`<RichEditor editor={…} />`), जो सेशन को नेटिव रूप में रेंडर करता है और प्लेटफ़ॉर्म के इनपुट को ट्रांज़ैक्शन में बदलता है। एक सेशन को कई व्यू दिखा सकते हैं।

एडिटर का कर्नेल Marijn Haverbeke के [ProseMirror](https://prosemirror.net) का Rust पोर्ट है, और उसकी एक्सटेंशन लेयर [Tiptap](https://tiptap.dev) का अनुसरण करती है: उनके डेटा स्ट्रक्चर, कमांड और नाम यहाँ भी वही हैं, और उनके बारे में आपका जो ज्ञान है वह भी काम आता है। दोनों MIT-लाइसेंस वाले हैं, और जो कुछ उनसे पोर्ट किया गया है उस पर उनके लाइसेंस लागू होते हैं।

```tsx
import { mount } from "nsh";
import { RichEditor, createRichEditor, history, inputRules, keymap, markdown, markdownRules, starterKeymap, baseKeymap, toggleMark } from "nsh/base";

const editor = createRichEditor({
  content: "# Notes\n\nStart typing…",
  format: "markdown",
  plugins: [
    history(),
    keymap({ "Mod-b": toggleMark("bold"), "Mod-i": toggleMark("italic") }),
    starterKeymap(),
    baseKeymap(),
    inputRules(markdownRules()),
    markdown(),
  ],
});

function App() {
  return <RichEditor editor={editor} class="flex-1" />;
}

mount(App);
```

`schema` के बिना एडिटर स्टार्टर स्कीमा (`starterSchema()`) का उपयोग करता है; `plugins` के बिना उसे स्टार्टर किट (`starterKit()`: स्टार्टर के इनपुट रूल और की बाइंडिंग, बेस की बाइंडिंग और हिस्ट्री) मिलती है। खाली `plugins` ऐरे ऐसा एडिटर बनाता है जिसमें कोई प्लगइन नहीं होता।

<a id="styling"></a>

## स्टाइलिंग

एडिटर डॉक्यूमेंट को ऐप के लुक के साथ ड्रॉ करता है: `classes` और `styles` उसके हिस्सों (`root`, `content`, `caret`, `selection`, `placeholder`, `composition`, `selectedNode`, `listMarker`, और टेबल के लिए `selectedCell`, `tableGrip`, `tableResizeHandle`, `tableDropIndicator`) को स्टाइल करते हैं, और उसके नोड को टाइप के अनुसार (`nodes: { heading:
"text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`)। उन लिस्ट के आइटम, जिनके नोड स्पेक में `extra.listMarker` को `"bullet"` या `"ordered"` पर सेट किया गया है (स्टार्टर स्कीमा की लिस्ट), `listMarker` हिस्से में एक मार्कर दिखाते हैं: गहराई के अनुसार `•`, `◦`, `▪`, या लिस्ट के `start` से शुरू होने वाली संख्याएँ, जो आइटम से पहले, लिस्ट के इंडेंट में रखी जाती हैं (लिस्ट पर `pl-6`, जैसे ब्राउज़र `ul` को इंडेंट करता है)।

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { heading: "text-2xl font-bold", bulletList: "pl-6", codeBlock: "font-mono bg-muted p-3 rounded-md" },
    marks: { bold: "font-bold", italic: "italic", code: "font-mono bg-muted" },
    listMarker: "text-muted-foreground",
  }}
/>
```

`content` हिस्सा एडिटर के स्क्रॉल व्यू के भीतर डॉक्यूमेंट का बॉक्स है: उसकी पैडिंग (`content: "px-6 py-5"`) टेक्स्ट के चारों ओर की जगह है, और स्क्रॉल बार एडिटर के अपने किनारे पर चलता है। एडिटर के ऊपर या नीचे के पार तक सेलेक्ट करने वाला ड्रैग डॉक्यूमेंट को साथ में स्क्रॉल करता है, और पॉइंटर जितना दूर जाता है, स्क्रॉल उतना तेज़ होता है।

### Bubble menu

`bubbleMenu` Tiptap का बबल मेनू है: ऐप का कंटेंट सेलेक्शन के पास दिखाया जाता है, डिफ़ॉल्ट रूप से उसके ऊपर (`bubbleMenuPlacement`, और जहाँ जगह न हो वहाँ दूसरी ओर पलट जाता है), `bubbleMenuOffset` पॉइंट (8) की दूरी पर, एक ओवरले में जो स्क्रॉल होने पर टेक्स्ट के साथ चलता है। ऐप इसे तब तक पास करता है जब तक वह इसे दिखाना चाहता है, सेशन की स्टेट से:

```tsx
const revision = signal(editor.revision);
editor.on("revision", ({ revision: r }) => revision.set(r));
const inLink = () => (revision(), editor.isActive("link"));

<RichEditor
  editor={editor}
  bubbleMenu={inLink() ? <LinkMenu href={editor.getAttributes("link").href} /> : undefined}
  bubbleMenuPlacement="bottom"
/>
```

लिंक मेनू कैरेट के नीचे के लिंक को `chain([extendMarkRange("link"), command("setLink", { href })])` से एडिट करता है और उसी `extendMarkRange` के बाद `command("unsetLink")` से उसे हटाता है।

<a id="schemas"></a>

## स्कीमा

`defineSchema(spec)` ProseMirror के आकार में एक स्कीमा पढ़ता है और उसमें जो गलत है उसके विवरण के साथ एरर फेंकता है। नोड टाइप अपना `content` (कंटेंट एक्सप्रेशन: `"inline*"`, `"paragraph+"`, `"(heading | paragraph) block*"`), अपना `group`, यह कि वे `inline` हैं या `atom`, कौन से `marks` वे अनुमति देते हैं और अपने `attrs` डिफ़ॉल्ट और वैलिडेशन के साथ (`"string"`, `"number"`, `"boolean"`) तय करते हैं। पहला ब्लॉक टाइप डिफ़ॉल्ट होता है: Enter जो बनाता है और जो आवश्यक कंटेंट को भरता है। स्पेक की जो कुंजियाँ अज्ञात हैं उन्हें टाइप के अतिरिक्त डेटा के रूप में रखा जाता है, एडिटर पर बने फ्रेमवर्क के लिए।

```tsx
import { createRichEditor, defineSchema } from "nsh/base";

const schema = defineSchema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    mention: { group: "inline", inline: true, atom: true, attrs: { id: {}, label: { default: "" } } },
    text: { group: "inline" },
  },
  marks: { bold: {}, link: { attrs: { href: {} }, inclusive: false } },
});

const editor = createRichEditor({ schema, doc: schema.parse("Hello") });
```

`RichSchema` डॉक्यूमेंट को पढ़ता और लिखता है: `parse(content, format?)` (डिफ़ॉल्ट रूप से प्लेन टेक्स्ट, `"markdown"`, या JSON), `parseMarkdown(markdown)`, `serialize(doc, format?)` (डिफ़ॉल्ट रूप से Markdown, `"text"`, `"json"`) और `check(doc)`, जो डॉक्यूमेंट को उसके एट्रिब्यूट डिफ़ॉल्ट भरकर लौटाता है। `nodes`, `marks` और `topNode` उसके टाइप के नाम बताते हैं। Markdown स्टार्टर स्कीमा के नामों (`paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, `orderedList`, `listItem`, `bold`, `italic`, `code`, `link`, `strike`) से मैप होता है।

<a id="commands"></a>

## कमांड

कमांड एक वैल्यू है: `toggleMark("bold")` एक ऑब्जेक्ट बनाता है जिसे ऐप रखता है, की से बाँधता है और एडिटर को पास करता है। `editor.run(command)` उसे चलाता है और बताता है कि वह लागू हुआ या नहीं; `editor.can(command)` बिना कुछ बदले पूछता है, और टूलबार इसी से अपने बटन सक्षम करता है। `editor.isActive(name, attrs?)` बताता है कि सेलेक्शन पर कोई मार्क या नोड सक्रिय है या नहीं (`isActive("heading", { level: 2 })`)।

| कमांड | यह क्या करता है |
| --- | --- |
| `toggleMark(name, attrs?)` | सेलेक्शन में मार्क जोड़ता है, या जहाँ मौजूद हो वहाँ से हटाता है; कर्सर पर होने पर, आगे टाइप किए जाने वाले टेक्स्ट के लिए |
| `setMark(name, attrs?)` / `unsetMark(name)` | मार्क जोड़ता या हटाता है |
| `setBlockType(name, attrs?)` | चुने गए टेक्स्टब्लॉक को किसी टाइप का बनाता है (`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | चुने गए ब्लॉक को किसी नोड में लपेटता है (एक कोट) / उन्हें उनके पैरेंट से बाहर निकालता है |
| `wrapInList(name, attrs?)` | चुने गए ब्लॉक को लिस्ट में लपेटता है |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | लिस्ट आइटम को स्प्लिट, इंडेंट या आउटडेंट करता है |
| `undo()` / `redo()` | किसी बदलाव को अनडू या रीडू करता है (`history()` के साथ) |
| `selectAll()`, `setTextSelection(anchor, head?)`, `setNodeSelection(pos)` | सेलेक्ट करता है |
| `insertText(text)`, `insertContent(content, format?)` | सेलेक्शन के ऊपर टेक्स्ट या कंटेंट डालता है |
| `setNodeAttribute(pos, attr, value)` | किसी पोज़िशन के नोड का एट्रिब्यूट एक अनडू-योग्य बदलाव के रूप में सेट करता है |
| `command(name)` | नाम से बिना पैरामीटर वाला कमांड: `"splitBlock"`, `"joinBackward"`, `"exitCode"`, `"newlineInCode"`, `"selectParentNode"`, … |
| `chain(commands)` | कमांड को एक के बाद एक एक ट्रांज़ैक्शन (एक अनडू स्टेप) के रूप में चलाता है; तभी लागू होता है जब हर कमांड लागू हो |
| `first(commands)` | पहला लागू होने वाला कमांड चलाता है |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## सेशन

| सदस्य | यह क्या है |
| --- | --- |
| `state`, `doc`, `selection` | स्टेट, डॉक्यूमेंट और सेलेक्शन JSON के रूप में, पढ़ते समय बनाए जाते हैं |
| `revision` | स्टेट ने कितने ट्रांज़ैक्शन लागू किए हैं |
| `isEmpty`, `undoDepth`, `redoDepth`, `composing` | UI एडिटर के बारे में जो दिखाता है |
| `setContent(content, format?)` | डॉक्यूमेंट को एक अनडू-योग्य बदलाव के रूप में बदलता है |
| `insertContent(content, format?)` | सेलेक्शन के ऊपर कंटेंट डालता है |
| `getJSON()`, `getMarkdown()`, `getText()`, `textBetween(from?, to?, separator?)` | किसी फ़ॉर्मैट में डॉक्यूमेंट |
| `dispatch(tr)` | JSON के रूप में दिया गया ट्रांज़ैक्शन लागू करता है (उसके स्टेप वर्तमान डॉक्यूमेंट पर) |
| `on(event, listener)` | हर `event` के पेलोड के साथ `listener` को JS की अगली बारी में कॉल करता है: `revision` (`{ revision }`, हर बदलाव के बाद, किसी भी स्रोत से), `update`, `selectionUpdate`, `transaction`, `focus`, `blur`, `delete`। एक फ़ंक्शन लौटाता है जो इसे रोकता है; कंपोनेंट के रेंडर होते समय जोड़ा गया लिसनर कंपोनेंट के साथ रुक जाता है |
| `focus()`, `blur()` | कीबोर्ड फ़ोकस को एडिटर दिखाने वाले व्यू पर ले जाता है या उनसे हटाता है |

पोज़िशन ProseMirror की तरह गिनी जाती हैं: टेक्स्ट अपने UTF-16 कोड यूनिट गिनता है, लीफ़ नोड एक, और कंटेंट वाला नोड अपनी दो सीमाएँ। जिस चीज़ को एडिट के बाद भी बने रहना है, वह नोड के एट्रिब्यूट या मार्क में एक id रखती है। पोज़िशन क्वेरी (`resolve(pos)`, `nodeAt(pos)`, `coordsAtPos(pos)`, `findParentNode(name, pos)`, ...) डॉक्यूमेंट के बाहर की पोज़िशन (`0` से `doc.content.size`) के लिए `RangeError` फेंकती है, जैसा ProseMirror का `resolve` करता है, और जहाँ कुछ नहीं है वहाँ `null` लौटाती है (नोड के अंत पर `nodeAt`, एडिटर दिखाने वाला कोई व्यू न होने पर `coordsAtPos`)। `run` और `can` ऐसे कमांड, नोड या मार्क टाइप के लिए `TypeError` फेंकते हैं जिसे एडिटर नहीं जानता।

<a id="taking-over-transactions"></a>

### ट्रांज़ैक्शन अपने हाथ में लेना

`editor.dispatchTransaction = (tr) => { … }` ऐप से हर ट्रांज़ैक्शन खुद कमिट करवाता है: हैंडलर को हर ट्रांज़ैक्शन JSON के रूप में मिलता है और वह उसे `editor.applyTransaction(tr)` से कमिट करता है, या छोड़ देता है। कोलैबोरेशन, लॉगिंग और ऐसे ट्रांज़ैक्शन जिन्हें ऐप की जाँचों से गुज़रना है, इसका उपयोग करते हैं; `null` कमिट करने का काम वापस एडिटर को सौंप देता है। हैंडलर टाइपिंग को JS की अगली बारी में सुनता है, और डॉक्यूमेंट तब बदलता है जब वह कमिट करता है।

<a id="extensions"></a>

## एक्सटेंशन

एक्सटेंशन Tiptap के हैं: हर एक अपने साथ अपना नोड या मार्क टाइप, की बाइंडिंग, इनपुट और पेस्ट रूल, प्लगइन और नामित कमांड लाता है, और एक्सटेंशन से बना एडिटर अपना स्कीमा, कीमैप, रूल और कमांड टेबल उन्हीं से पाता है। बिल्ट-इन एक्सटेंशन Tiptap जैसे नामों वाली क्लास हैं, जिन्हें जैसा है वैसा या कॉन्फ़िगर करके उपयोग किया जाता है:

```tsx
import { RichEditor, StarterKit, Underline, command, createRichEditor } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false })],
  content: "Hello",
  editable: true,
});

editor.run(command("toggleHeading", { level: 2 }));
editor.run(command("toggleBold"));
```

`StarterKit` अपने साथ `Document`, `Paragraph`, टेक्स्ट नोड, `Heading`, `Blockquote`, `BulletList`, `OrderedList`, `ListItem`, `TaskList`, `TaskItem`, `CodeBlock`, `HardBreak`, `HorizontalRule`, `RichImage` (Tiptap का `Image`), `Bold`, `Italic`, `Strike`, `Code`, `Underline`, `RichLink` (Tiptap का `Link`), `Highlight`, `Subscript`, `Superscript`, `RichTextStyle` (Tiptap का `TextStyle`), `TextAlign`, `History`, `TrailingNode`, `Typography` और `ListKeymap` लाता है। इनमें से किसी के नाम वाला ऑप्शन `false` पर सेट हो तो वह उसे छोड़ देता है, और ऑब्जेक्ट उसे कॉन्फ़िगर करता है (`heading: { levels }`, `history: { depth }`, `textAlign: { types }`, `codeBlock: { enableTabIndentation }`)। हर क्लास के `configure(options)` और `extend({...})` मिलकर एक `RichExtension` बनाते हैं, जिसमें `name`, `type`, `priority` और `options` होते हैं। हर एडिटर को कोर कीमैप भी मिलता है (Enter, Backspace, Delete, सब सेलेक्ट करें)।

हर एक्सटेंशन Tiptap के कमांड जोड़ता है, जिन्हें `command(name, args)` चलाता है: `toggleBold`, `setItalic`, `unsetStrike`, `toggleHeading({ level })`, `setParagraph`, `toggleBlockquote`, `toggleBulletList`, `toggleOrderedList`, `toggleTaskList`, `toggleCodeBlock({ language })`, `setHardBreak`, `setHorizontalRule`, `setImage({ src })`, `toggleHighlight({ color })`, `setTextAlign("center")`, `unsetTextAlign`, और नीचे दिए गए लिंक, कैरेक्टर काउंट और सजेशन कमांड।

लिस्ट टॉगल पूरी लिस्ट पर काम करते हैं, जैसे वर्ड प्रोसेसर के लिस्ट बटन करते हैं: बुलेट वाली लिस्ट में `toggleOrderedList` उसे हर स्तर पर, नेस्टेड लिस्ट समेत, क्रमांकित कर देता है, और किसी लिस्ट का अपना टॉगल चुने गए ब्लॉक को उनके आसपास की हर लिस्ट से बाहर निकाल देता है।

`extensions` का क्रम बराबर वालों के बीच उनकी प्राथमिकता है: बाद में सूचीबद्ध एक्सटेंशन अपनी कुंजियाँ अपने से पहले वालों से पहले बाँधता है; `priority` (डिफ़ॉल्ट 100) उन्हें अन्यथा रैंक करता है। `extensions` के साथ, एडिटर के `plugins` एक्सटेंशन के प्लगइन के बाद आते हैं।

<a id="the-apps-extensions"></a>

### ऐप के अपने एक्सटेंशन

`defineExtension` एक बनाता है। उसके फ़ंक्शन एक बार चलते हैं, जब उसके साथ कोई एडिटर बनाया जाता है, एक्सटेंशन के ऑप्शन के साथ, और डेटा लौटाते हैं: कमांड, रूल और प्लगइन, जैसे ऊपर की फ़ैक्टरी बनाती हैं।

```tsx
import { StarterKit, command, createRichEditor, defineExtension, insertText, textRule } from "nsh/base";

const Signature = defineExtension({
  name: "signature",
  priority: 200,
  addOptions: () => ({ text: "— Sent from NSH" }),
  addCommands: (options) => ({ insertSignature: insertText(options.text) }),
  addKeyboardShortcuts: () => ({ "Mod-Alt-s": command("insertSignature") }),
  addInputRules: () => [textRule("\\(sig\\)$", "✍")],
});

const editor = createRichEditor({ extensions: [StarterKit, Signature.configure({ text: "Best, Ana" })] });
```

`node` या `mark` (`defineSchema` के रूप में) उसे नोड या मार्क एक्सटेंशन बनाता है; `addGlobalAttributes` दूसरे टाइप में एट्रिब्यूट जोड़ता है; `addProseMirrorPlugins` प्लगइन लौटाता है, `RichEditorPlugin` समेत; `addPasteRules` पेस्ट किए गए टेक्स्ट के लिए `textRule` और `markRule` रूल लौटाता है। बिल्ट-इन क्लास का `extend({...})` उन हिस्सों को बदल देता है जो वह देती है: `Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`।

ऐप का क्रेट अपने UI सेट के ज़रिए Rust में लिखे एक्सटेंशन रजिस्टर करता है, और JS उन्हें नाम से लेता है:

```rust
use nsh_base::rich_editor::extensions::{Extension, RichExtensionRegistry};

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.rich_extension("mention", || Extension::new("mention") /* .add_plugins(...) */);
}
```

```tsx
const editor = createRichEditor({ extensions: [StarterKit, richExtension("mention", { char: "@" })] });
```

`richExtension(name, options)` हर बिल्ट-इन एक्सटेंशन को उसके नाम से भी ढूँढता है (`"text"`, `"bold"`, ...)।

<a id="plugins"></a>

## प्लगइन

| फ़ैक्टरी | यह क्या जोड़ती है |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | अनडू हिस्ट्री; `newGroupDelay` मिलीसेकंड (500) के भीतर के बदलाव एक साथ अनडू होते हैं |
| `keymap(bindings)` | की नाम से कमांड: `"Mod-b"` (Apple प्लेटफ़ॉर्म पर Cmd, अन्यत्र Ctrl), `"Shift-Enter"`, `"Alt-ArrowUp"` |
| `baseKeymap()` | Enter, Backspace, Delete, सब सेलेक्ट करें और प्लेटफ़ॉर्म की टेक्स्ट एडिटिंग कुंजियाँ |
| `starterKeymap()` | स्टार्टर स्कीमा की बाइंडिंग: मार्क, हेडिंग, लिस्ट, कोड ब्लॉक, हार्ड ब्रेक |
| `inputRules(rules)` | कर्सर से पहले टाइप किया गया टेक्स्ट जो किसी रूल से मेल खाता है, उसी में बदल जाता है जो रूल बनाता है; तुरंत बाद Backspace उसे अनडू कर देता है |
| `markdown(options?)` | टाइप करते समय Markdown, Markdown पेस्ट और Markdown कॉपी (`blockRules`, `inlineRules`, `paste`, `copyAsMarkdown`) |
| `starterKit()` | स्टार्टर के इनपुट रूल और बाइंडिंग, बेस बाइंडिंग और हिस्ट्री |

सूची में प्लगइन की जगह ही उसकी प्राथमिकता है: सूची में पहले आने वाले कीमैप और इनपुट रूल किसी कुंजी या टेक्स्ट को पहले संभालते हैं। इनपुट रूल `markdownRules()` (हेडिंग, कोट, लिस्ट, कोड फ़ेंस, रूल, आम मार्क), `typographyRules()` (स्मार्ट कोट, एलिप्सिस, em dash), `textRule(match, replacement)`, `markRule(match, mark)`, `wrappingRule(match, node)` और `textblockRule(match, node)` से आते हैं। रूल का `match` एक रेगुलर एक्सप्रेशन है जो `$` पर समाप्त होता है, और कर्सर से पहले के टेक्स्ट से मिलाया जाता है।

<a id="the-apps-plugins"></a>

### ऐप के अपने प्लगइन

`new RichEditorPlugin(key)` ऐसा प्लगइन बनाता है जिसका व्यवहार ऐप का अपना होता है, चेन्ड कॉल से सेट किया जाता है:

```tsx
import { RichEditorPlugin, createRichEditor, starterKit } from "nsh/base";

const suggestions = new RichEditorPlugin("suggestions")
  .captureKeys(["ArrowUp", "ArrowDown", "Enter", "Escape"], (key) => moveSuggestion(key))
  .filterTransaction((tr) => tr.meta?.locked !== true)
  .appendTransaction((trs, state) => null);

const editor = createRichEditor({ plugins: [starterKit(), suggestions] });

// While the suggestion list is open, its keys are the list's.
suggestions.capturing = true;
editor.setDecorations("suggestions", [{ from: 5, to: 9, kind: "inline", attrs: { class: "bg-accent" } }]);
```

- `captureKeys(keys, handler)`: जब तक `capturing` true है, एडिटर इन कुंजियों को खुद ले लेता है और तुरंत बाद `handler` को बताता है कि कौन सी दबाई गई थी; कीबोर्ड उतना ही तेज़ रहता है जितना किसी प्लगइन के बिना।
- `editor.setDecorations(key, decorations)`: इनलाइन एट्रिब्यूट, नोड एट्रिब्यूट और विजेट जिन्हें व्यू डॉक्यूमेंट के ऊपर बिना उसे बदले ड्रॉ करता है। वे हर बदलाव का अनुसरण करते हैं जब तक उन्हें दोबारा सेट न किया जाए।
- `filterTransaction(hook)` और `appendTransaction(hook)` उन ट्रांज़ैक्शन को देखते हैं जो ऐप के अपने कॉल (`run`, `dispatch`, `setContent`, …) उस कॉल में बनाते हैं: `filterTransaction` किसी को छोड़ सकता है, `appendTransaction` एक और ट्रांज़ैक्शन लौटा सकता है जो उसके साथ लागू हो। `on("revision", …)` हर बदलाव सुनता है, टाइपिंग समेत।
<a id="links-character-counts-and-suggestions"></a>

## लिंक, अक्षर गणना और सुझाव

तीन प्लगइन Tiptap के Link, CharacterCount और Suggestion व्यवहार को संभालते हैं, और ये सभी नेटिव हैं:

```tsx
import { RichEditor, characterCount, createRichEditor, insertMention, link, starterKit, starterSchema, suggestion, withMention } from "nsh/base";

const editor = createRichEditor({
  schema: withMention(starterSchema()),
  plugins: [
    starterKit(),
    link({ defaultProtocol: "https" }),
    characterCount({ limit: 280 }),
    suggestion({ key: "mention", char: "@", decorationClass: "text-primary", captureKeys: ["ArrowUp", "ArrowDown", "Enter"] }),
  ],
});

editor.on("transaction", () => {
  const s = editor.suggestion("mention");
  if (s?.active) showPeople(s.query, editor.coordsAtPos(s.range.from), s.lastKey);
  setCount(`${editor.characters()} / ${editor.characterLimit}`);
});

// The list picked someone:
editor.run(insertMention(editor.suggestion("mention")!.range, "u1", "Joan"));
```

- `link(options?)`: स्पेस या Enter से पहले टाइप किया गया URL लिंक बन जाता है, और पेस्ट किए गए टेक्स्ट के URL भी (`autolink`);
  चयन के ऊपर पेस्ट किया गया URL उस चयन को लिंक कर देता है (`linkOnPaste`); Mod दबाकर रखते हुए, या editor के रीड-ओनली होने पर, लिंक पर प्रेस करने से वह ऐप के URL हैंडलिंग के ज़रिए खुलता है (`openOnClick`); प्रेस करने पर `enableClickSelection` पूरे
  लिंक को चुन लेता है। URL प्रोटोकॉल के साथ या उसके बिना भी पहचाने जाते हैं (`nsh.dev`, `https://nsh.dev/docs`, ई-मेल
  पते), और केवल होस्ट वाले URL को जो प्रोटोकॉल मिलता है वह `defaultProtocol` है (`http`)। लिंक ये प्रोटोकॉल स्वीकार करते हैं: `http`,
  `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp` और वे जो `protocols` में हैं, इसलिए
  `setLink({ href })`, `toggleLink(attrs?)` और ऑटोलिंकिंग स्क्रिप्ट (`javascript:`) और data URL को बाहर रखते हैं।
  `unsetLink()` चयन के आसपास का लिंक हटा देता है।
- `characterCount(options?)`: `editor.characters(mode?)` टेक्स्ट के अक्षरों की गिनती करता है (`"textSize"`, UTF-16 यूनिट, जैसे
  JS का `length`) या दस्तावेज़ की पोज़िशन की (`"nodeSize"`); `editor.words()` उसके शब्द गिनता है (Unicode शब्द
  सीमाएँ)। `limit` के साथ, सीमा से आगे जाने वाले बदलाव अस्वीकार कर दिए जाते हैं और पेस्ट की गई सामग्री उतनी ही रखी जाती है जितनी समा सके;
  सीमा से बड़ा पहला दस्तावेज़ काट दिया जाता है (`autoTrim`)। `setCharacterLimit(limit)` सीमा बदलता है और
  `editor.characterLimit` उसे पढ़ता है।
- `suggestion(options?)`: कर्सर से पहले टाइप किए गए ट्रिगर (`char`, डिफ़ॉल्ट रूप से `@`) का अनुसरण करता है। `allowSpaces` क्वेरी में
  स्पेस की अनुमति देता है, `allowedPrefixes` बताता है कि ट्रिगर से पहले क्या आ सकता है (डिफ़ॉल्ट रूप से स्पेस; `anyPrefix` कुछ भी
  स्वीकार करता है), `startOfLine` ट्रिगर को पंक्ति की शुरुआत में माँगता है (`/` कमांड मेनू)। `editor.suggestion(key)`
  `{ active, range, query, text, lastKey, keyCount }` देता है; सक्रिय रेंज में ऐप का `decorationClass` रहता है (और क्वेरी खाली होने पर
  `decorationEmptyClass`)। सुझाव सक्रिय होने पर `captureKeys` की कुंजियाँ ऐप की सूची की हो जाती हैं:
  editor उन्हें ले लेता है और आख़िरी कुंजी को state में दर्ज करता है, और Escape सुझाव को
  बंद कर देता है (`exitSuggestion(key)` भी ऐसा ही करता है)। `replaceSuggestion(content, key?)` ट्रिगर और क्वेरी को
  टेक्स्ट या JSON सामग्री से बदल देता है।
- `withMention(schema, { name?, char? })` Tiptap का mention नोड जोड़ता है: एक इनलाइन atom, जिसमें `id`, `label` और उसका
  ट्रिगर होता है, जो टेक्स्ट में `@label` और HTML में `<span data-type="mention">` के रूप में लिखा जाता है। `insertMention(range, id, label?)`
  सुझाव की रेंज को mention और एक स्पेस से बदल देता है।

पॉपअप ऐप का होता है: वह सुझाव की state पढ़ता है, `coordsAtPos(range.from)` पर खुद को रखता है और
आइटम अपने तरीके से बनाता है।

<a id="tables"></a>

## टेबल

`TableKit` Tiptap की टेबल लाता है: `RichTable` (Tiptap का `Table`), `RichTableRow`, `RichTableHeader` और
`RichTableCell`। इसे `StarterKit` के साथ जोड़ा जाता है:

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

टेबल ये विकल्प लेती है: `resizable` (true), `cellMinWidth` (25), `lastColumnResizable` (true),
`allowTableNodeSelection` (false) और `HTMLAttributes`; `TableKit.configure({ tableHeader: false })` किसी एक
extension को छोड़ देता है। सेल में ब्लॉक रहते हैं और उनमें `colspan`, `rowspan` और `colwidth` होते हैं (वे जितने कॉलम में फैली हों, उनमें से प्रत्येक की चौड़ाई पॉइंट में); पंक्तियों में `height` होता है।

Tab और Shift-Tab सेल के बीच जाते हैं, और आख़िरी सेल में Tab एक पंक्ति जोड़ता है। सेल के किनारे पर तीर कुंजियाँ अगली
सेल में चली जाती हैं; तीर के साथ Shift, या सेल के आर-पार ड्रैग, सेल का एक आयत चुनता है (प्रकार
`"cell"` का चयन, जिसके `anchor` और `head` उसकी पहली और आख़िरी सेल से पहले की पोज़िशन हैं)। Backspace और Delete
चुनी हुई सेल को खाली करते हैं, और सभी सेल चुनी होने पर टेबल को हटा देते हैं।

editor में टेबल अपनी सेल का एक ग्रिड होती है: प्रत्येक कॉलम उतना चौड़ा होता है जितनी उसकी सेल का `colwidth`, और जिन कॉलम में यह नहीं होता वे जगह आपस में बाँट लेते हैं (कम से कम `cellMinWidth` चौड़े), और प्रत्येक पंक्ति कम से कम अपने `height` जितनी ऊँची होती है। इसका रूप थीम से शुरू होता है: 1-पॉइंट का `border` ग्रिड, `muted` पर हेडर सेल, पैडिंग वाली सेल, और प्रत्येक चुनी हुई सेल `selectedCell` भाग के अंतर्गत चयन के रंग में। `classes.nodes` (`table`, `tableCell`, `tableHeader`) और भाग
इन सबकी शैली बदल देते हैं। सेल की पहली या आख़िरी पंक्ति पर Up और Down ऊपर या नीचे की सेल में ले जाते हैं।

जब दस्तावेज़ संपादन योग्य हो:

- डेस्कटॉप पर, प्रत्येक कॉलम की दायीं सीमा और प्रत्येक पंक्ति की निचली सीमा उनका आकार बदलती हैं: पॉइंटर रीसाइज़ कर्सर और `tableResizeHandle` रेखा दिखाता है, टेबल ड्रैग का अनुसरण करती है, और छोड़ने पर `colwidth` या
  `height` एक ही चरण में सेट हो जाता है जिसे undo वापस ले सकता है। `resizable: false` इसे बंद करता है, `lastColumnResizable: false` आख़िरी
  कॉलम की चौड़ाई को बनाए रखता है।
- जिस टेबल में चयन है, वह अपनी ऊपरी सीमा पर प्रत्येक कॉलम के ऊपर और बायीं सीमा पर प्रत्येक पंक्ति के बगल में ग्रिप (`tableGrip`) दिखाती है। किसी एक को दबाने से वह कॉलम या पंक्ति चुनी जाती है; डेस्कटॉप पर उसे ड्रैग करने पर दिखता है कि वह कहाँ गिरेगी
  (`tableDropIndicator`) और छोड़ने पर वह वहीं पहुँच जाती है।

```tsx
<RichEditor
  editor={editor}
  classes={{
    nodes: { tableHeader: "font-semibold", tableCell: "px-3 py-2" },
    selectedCell: "bg-primary/10",
    tableGrip: "bg-muted-foreground/60 rounded-full",
  }}
/>
```

कमांड, जिनमें से प्रत्येक `nsh/base` का हेल्पर है:

- `insertTable({ rows, cols, withHeaderRow })` (डिफ़ॉल्ट रूप से हेडर पंक्ति के साथ 3 × 3) और `deleteTable()`।
- `addColumnBefore()`, `addColumnAfter()`, `deleteColumn()`, `addRowBefore()`, `addRowAfter()`, `deleteRow()`।
- `mergeCells()`, `splitCell()` और `mergeOrSplit()`।
- `toggleHeaderRow()`, `toggleHeaderColumn()` और `toggleHeaderCell()`।
- `setCellAttribute(name, value)`, `setCellSelection({ anchorCell, headCell })`, `goToNextCell()`,
  `goToPreviousCell()` और `fixTables()`, जो गुम या ओवरलैप होने वाली सेल वाली टेबल को ठीक करता है।
- `moveTableRow({ from, to, select })` और `moveTableColumn({ from, to, select })` किसी पंक्ति या कॉलम को उन पंक्तियों या कॉलम के साथ
  हिलाते हैं जिनमें उसकी मर्ज की गई सेल फैली हैं; `setColumnWidth({ col, width })` और
  `setRowHeight({ row, height })` उनका आकार तय करते हैं (`null` उन्हें उनकी सामग्री के अनुसार आकार देता है)। ये `table` लेते हैं, यानी
  टेबल से पहले की पोज़िशन, ताकि चयन वाली टेबल के अलावा किसी दूसरी टेबल पर काम किया जा सके।

टेबल HTML (`<table>` के साथ `<th>` / `<td>`, `colspan`, `rowspan` और `data-colwidth`) और
Markdown से पढ़ी और उनमें लिखी जाती हैं: हेडर पंक्ति वाली टेबल, जिसकी प्रत्येक सेल एक पैराग्राफ़ हो, GFM pipe टेबल होती है, और कोई भी अन्य टेबल
अपने HTML के रूप में लिखी जाती है, जो वापस पढ़ने पर वैसी ही आती है। सादे टेक्स्ट में एक पंक्ति उसकी सेल की एक लाइन होती है, जो टैब से अलग की गई होती हैं।
