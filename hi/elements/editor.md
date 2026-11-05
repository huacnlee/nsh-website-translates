---
title: "Editor"
description: "Editor कॉम्पोनेंट: सिंटैक्स हाइलाइटिंग, लाइन नंबर, एकाधिक कैरेट, फ़ोल्डिंग, सॉफ्ट रैप, खोजें और बदलें, डायग्नोस्टिक्स और डेकोरेशन वाला एक कोड एडिटर, साथ ही कोड एडिटरों की कीबोर्ड शॉर्टकट कुंजियाँ।"
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---

# Editor

`Editor` एक कोड एडिटर है: पचास से अधिक भाषाओं के लिए सिंटैक्स हाइलाइटिंग, लाइन नंबर, एकाधिक कैरेट, फोल्डिंग, सॉफ्ट रैप, खोजें और बदलें, डायग्नोस्टिक्स और डेकोरेशन, साथ में कोड एडिटरों की कुंजियाँ (पंक्तियों को हिलाना और डुप्लिकेट करना, कमेंट, इंडेंटेशन, और टाइप करते ही बंद होने वाले ब्रैकेट और कोट्स)। यह किसी भी लंबाई की फ़ाइल संभालता है: केवल दिखाई देने वाली पंक्तियाँ बनाई जाती हैं, और हाइलाइटिंग हर संपादन के साथ पंक्ति-दर-पंक्ति आगे बढ़ती है, इसलिए लंबी फ़ाइल भी छोटी फ़ाइल की तरह स्क्रोल होती है और उसमें टाइपिंग उतनी ही सहज रहती है। टाइपिंग प्लेटफ़ॉर्म के इनपुट से होकर जाती है, इसलिए इनपुट मेथड (pinyin, kana, डेड कीज़) और सॉफ्ट कीबोर्ड वैसे ही काम करते हैं जैसे किसी भी टेक्स्ट फ़ील्ड में।

Editor व्यवहार स्वयं संभालता है और थीम के टोकन से बना अपना एक लुक साथ लाता है: थीम का `font-mono` 20pt की पंक्तियों में 13pt पर, `muted-foreground` में लाइन नंबर, कैरेट वाली पंक्तियों के पीछे एक हल्का `muted` बैंड, `primary` की एक छटा में सेलेक्शन, `border` में इंडेंट गाइड, और वे बिल्ट-इन सिंटैक्स रंग जो [`TextView`](./text-view.md) के कोड ब्लॉक इस्तेमाल करते हैं, लाइट और डार्क दोनों में। हर हिस्सा इन डिफ़ॉल्ट मानों के ऊपर ऐप की स्टाइल लेता है (`classes` और `styles`)। Rust में इसे `nsh_base::editor()` से बनाया जाता है, और TSX में `nsh/base` से `<Editor>` के साथ।

```rust tabs
use nsh_base::editor;
use nsh_core::prelude::*;

const MAIN: &str = "fn main() {\n    println!(\"Hello, world!\");\n}\n";

fn code() -> impl IntoElement {
    let source = signal(SharedString::from(MAIN));
    editor()
        .value(move || Some(source.get()))
        .language("rust")
        .on_change(move |value: &SharedString| source.set(value.clone()))
        .flex_1()
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Editor } from "nsh/base";

const MAIN = `fn main() {
    println!("Hello, world!");
}
`;

function App() {
  const source = signal(MAIN);
  return <Editor value={source()} onChange={({ value }) => source.set(value)} language="rust" class="flex-1" />;
}

mount(App);
```

Editor उस बॉक्स को भरता है जो ऐप उसे देता है (`flex-1`, एक ऊँचाई) और अपना टेक्स्ट उसके भीतर स्क्रोल करता है: ऊर्ध्वाधर हमेशा, क्षैतिज तब जब पंक्तियाँ बॉक्स से लंबी हों, या `softWrap` के साथ बिल्कुल नहीं, जहाँ लंबी पंक्तियाँ editor की चौड़ाई पर रैप हो जाती हैं।

<a id="the-text"></a>

## टेक्स्ट

- **नियंत्रित (Controlled)**: `value` दें और इसे `onChange` में फिर से सेट करें, जो पूरा नया टेक्स्ट रिपोर्ट करता है। ऐप जब `value` बदलता है (कोई फ़ाइल लोड हुई, किसी फ़ॉर्मैटर का आउटपुट), तो वह टेक्स्ट को एक ऐसे संपादन के रूप में बदल देता है जिसे undo वापस ले सकता है, और जो कैरेट और फोल्ड बदले हुए हिस्से से दूर हैं वे अपनी जगह रहते हैं।
- **अनियंत्रित (Uncontrolled)**: `defaultValue` दें और टेक्स्ट को `onChange` से या ref के `value()` से पढ़ें।

पंक्ति-विराम `\n` हैं: आने वाले टेक्स्ट में `\r\n` और `\r` को `\n` बना दिया जाता है।

<a id="languages"></a>

## भाषाएँ

`language` भाषा को उसके नाम, उपनाम (alias), एक्सटेंशन या फ़ाइल नाम से पहचानता है, किसी भी केस में: `"rust"`, `"rs"`, `"typescript"`, `"tsx"`, `"main.go"`, `"Dockerfile"`, `"Makefile"`। यही तय करता है हाइलाइटिंग, वह कमेंट जिसे `mod+/` टॉगल करता है, मेल खाने और इंडेंट करने वाले ब्रैकेट, टाइप करने पर बंद होने वाले जोड़े, शब्द किन अक्षरों से बनते हैं, और डिफ़ॉल्ट इंडेंटेशन: चार स्पेस, वेब भाषाओं (JavaScript, TypeScript, JSON, HTML, CSS, YAML, ...) के लिए दो, और Go तथा Makefile के लिए टैब। `tabSize` और `hardTabs` हर भाषा के लिए इंडेंटेशन सेट करते हैं। कोई भी अन्य नाम सादा टेक्स्ट माना जाता है, जब तक कि ऐप ने उसे रजिस्टर न किया हो ([अपनी भाषाएँ](#your-own-languages))।

भाषाएँ: Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL और Diff।

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### अपनी भाषाएँ

Rust कोड ऐप के editors को और भाषाएँ सिखाता है, और किसी भी भाषा को उसके अपने हाइलाइटर (tree-sitter ग्रामर, ऐप का अपना पार्सर) से हाइलाइट करता है। `register_language` एक `EditorLanguage` रजिस्टर करता है: उसका नाम, उपनाम, एक्सटेंशन और फ़ाइल नाम, और उसके संपादन नियम (कमेंट, ब्रैकेट, टाइप करने पर बंद होने वाले जोड़े, शब्द के अक्षर, इंडेंटेशन), जिसमें `syntax` उस बिल्ट-इन ग्रामर का नाम बताता है जिससे उसे हाइलाइट किया जाए। `register_highlighter` किसी भी भाषा, बिल्ट-इन या रजिस्टर की हुई, को ऐप का अपना हाइलाइटर देता है: `EditorHighlighter` को लागू करने वाला एक टाइप, जो हर संपादन सुनता है (पंक्तियाँ, बाइट और पोज़िशन, उसी रूप में जैसे tree-sitter के संपादन लेते हैं) और हर पंक्ति के टोकन (`EditorToken`, या `EditorToken::from_scope` के ज़रिए tree-sitter कैप्चर या TextMate स्कोप) एक समय-सीमा के भीतर, UI थ्रेड से बाहर देता है। Editor टोकन को रखता है, संपादन होने पर उन्हें टेक्स्ट के साथ खिसकाता है और दिखाई देने वाली पंक्तियों के लिए फिर से पूछता है, ठीक वैसे ही जैसे वह बिल्ट-इन हाइलाइटर से करता है। `language` रजिस्टर की हुई भाषाओं को पहले खोजता है, नाम, उपनाम, एक्सटेंशन या पाथ से, editors और diff views दोनों में।

हर engine अपनी भाषाएँ अलग रखता है। Rust ऐप उन्हें अपने root में रजिस्टर करता है, editors माउंट करने से पहले; TSX ऐप के लिए ऐप का crate उन्हें अपने UI सेट के setup में रजिस्टर करता है, जिसे ऐप चलाने वाला हर engine सबसे पहले कॉल करता है।

```rust
use nsh_base::editor::{EditorLanguage, register_highlighter, register_language};
use nsh_core::prelude::*;

static NIMBLE: EditorLanguage = EditorLanguage::new("Nimble")
    .extensions(&["nb"])
    .line_comment("#")
    .tab_size(2);

#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.setup(|| {
        register_language(&NIMBLE);
        register_highlighter("nimble", || Box::new(NimbleHighlighter::default()));
    });
}
```

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language="build.nb" class="flex-1" />
```

<a id="editing"></a>

## संपादन

Editor वैसे ही काम करता है जैसे कोड एडिटर करते हैं:

- **एकाधिक कैरेट।** Alt-क्लिक (Option-क्लिक) एक कैरेट जोड़ता है, `mod+d` सेलेक्शन की अगली घटना चुनता है, `mod+shift+l` सभी घटनाएँ चुनता है, और add-caret कुंजियाँ ऊपर या नीचे की पंक्ति पर एक कैरेट जोड़ती हैं। टाइपिंग, डिलीट, मूव और हर कमांड हर कैरेट पर काम करता है; Escape एक कैरेट पर लौटाता है। `undoSelection` (`cmd+u`, `ctrl+u`) पिछली गति से पहले के सेलेक्शन पर लौटाता है।
- **सेलेक्शन इकाइयों में बढ़ते हैं**, `expandSelection` (`ctrl+shift+cmd+right`, `shift+alt+right`) से: शब्द, स्ट्रिंग की सामग्री और फिर स्ट्रिंग, ब्रैकेट जोड़े की सामग्री और फिर जोड़ा, पंक्ति, पूरा टेक्स्ट; `shrinkSelection` उसी रास्ते से वापस ले जाता है। `splitSelectionIntoLines` (`shift+alt+i`) कई पंक्तियों में फैले सेलेक्शन को प्रति पंक्ति एक सेलेक्शन में बदल देता है।
- **इंडेंटेशन।** नई पंक्ति, पंक्ति का इंडेंटेशन रखती है और खुलने वाले ब्रैकेट के बाद एक स्तर जोड़ती है (Python का `:`, Ruby का `do`, ...); ब्रैकेट के जोड़े के बीच Enter दबाने पर बंद करने वाला ब्रैकेट अपनी अलग पंक्ति में चला जाता है। Tab और Shift+Tab चुनी हुई पंक्तियों को इंडेंट और आउटडेंट करते हैं; शुरुआती स्पेस में Backspace पिछले इंडेंट स्टॉप पर लौटता है। `autoIndent` इसे बंद कर देता है।
- **ब्रैकेट और कोट्स** टाइप करते ही बंद होते हैं, सेलेक्शन को घेर लेते हैं, और बंद करने वाला दोबारा टाइप करने पर उसके ऊपर से आगे बढ़ जाते हैं (`autoClose`)। कैरेट वाले ब्रैकेट और उसके जोड़ीदार की आउटलाइन दिखती है।
- **Undo** टाइपिंग की पूरी कड़ी को वापस लेता है: एक शब्द, एक डिलीट, एक कमांड। कोई मूव या प्रेस नया चरण शुरू करता है।
- **फोल्डिंग।** जिस पंक्ति के बाद अधिक गहराई से इंडेंट की हुई पंक्तियाँ आती हैं, वह उन्हें गटर के मार्कर से फोल्ड कर देती है: फोल्ड करने के लिए `⌄`, खोलने के लिए `›` और पंक्ति के बाद का `⋯`। फोल्ड में जाने वाला कैरेट उसे खोल देता है ([फोल्डिंग](#folding))।
- **प्रेस।** पॉइंटर से, क्लिक कैरेट रखता है, डबल क्लिक शब्द चुनता है, ट्रिपल क्लिक पंक्ति, Shift-क्लिक सेलेक्शन बढ़ाता है और ड्रैग उसी इकाई के हिसाब से चुनता है जो क्लिक ने चुनी थी। Alt+Shift ड्रैग (Option+Shift; Linux पर Control+Alt भी) एक ब्लॉक चुनता है: हर पंक्ति में एक सेलेक्शन, उन्हीं कॉलमों के बीच, जो छोटी पंक्तियों के अंत से आगे भी जारी रहते हैं। टच स्क्रीन पर एक टैप कैरेट रखता है, डबल टैप या लॉन्ग प्रेस उँगली के नीचे का शब्द चुनता है, और उस सेलेक्शन के सिरों पर बने हैंडल हर सिरे को तब खिसकाते हैं जब उँगली उन्हें खींचती है (उनके आसपास का टेक्स्ट फिर भी स्क्रोल होता है)।
- **क्लिपबोर्ड।** बिना सेलेक्शन के कॉपी और कट कैरेट वाली पूरी पंक्तियाँ लेते हैं, और वे कैरेट की पंक्ति के ऊपर पूरी पंक्तियों के रूप में पेस्ट होती हैं।

`readOnly` टेक्स्ट को जैसा है वैसा रखता है, जब तक वह चुना हुआ, खोजा हुआ और कॉपी किया हुआ रहता है।

<a id="keys"></a>

## कुंजियाँ

Editor की कुंजियाँ तभी काम करती हैं जब उस पर फ़ोकस हो; अन्य इनपुट अपनी कुंजियाँ रखते हैं। `mod` macOS और iOS पर Command है और अन्य जगह Control (`keymap` की कीस्ट्रोक)।

| कुंजियाँ (macOS) | कुंजियाँ (Windows, Linux) | कमांड |
|---|---|---|
| तीर, चुनने के लिए Shift के साथ | तीर, चुनने के लिए Shift के साथ | अक्षर और पंक्ति के हिसाब से चलना |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | शब्द के हिसाब से चलना |
| `cmd+left` / `cmd+right`, `home` / `end`, `ctrl+a` / `ctrl+e` | `home` / `end` | पंक्ति का पहला गैर-रिक्त अक्षर (फिर उसकी शुरुआत) / पंक्ति का अंत |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | टेक्स्ट की शुरुआत / अंत |
| `pageup` / `pagedown` | `pageup` / `pagedown` | एक पेज ऊपर / नीचे |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | बाएँ / दाएँ एक शब्द मिटाना |
| `cmd+backspace` / `cmd+delete`, `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | पंक्ति की शुरुआत / अंत तक मिटाना |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`, `ctrl+y` | Undo / redo |
| `cmd+a` | `ctrl+a` | सब चुनें |
| `cmd+l` | `ctrl+l` | पंक्ति चुनें (दोबारा: अगली भी) |
| `cmd+d` | `ctrl+d` | अगली घटना चुनें |
| `cmd+shift+l` | `ctrl+shift+l` | हर घटना चुनें |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | ऊपर / नीचे एक कैरेट जोड़ें |
| `escape` | `escape` | एक सेलेक्शन पर लौटें |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | पंक्तियों को ऊपर / नीचे खिसकाएँ |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | पंक्तियों को ऊपर / नीचे डुप्लिकेट करें |
| `cmd+shift+k` | `ctrl+shift+k` | पंक्तियाँ मिटाएँ |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | नीचे / ऊपर नई पंक्ति |
| `tab` / `shift+tab`, `cmd+]` / `cmd+[` | `tab` / `shift+tab`, `ctrl+]` / `ctrl+[` | इंडेंट / आउटडेंट |
| `cmd+/` | `ctrl+/` | लाइन कमेंट टॉगल करें |
| `cmd+shift+\` | `ctrl+shift+\` | मेल खाने वाले ब्रैकेट पर जाएँ |
| `ctrl+j` | `ctrl+j` | पंक्तियाँ जोड़ें |
| `ctrl+t` | | कैरेट के आसपास के अक्षरों की अदला-बदली करें |
| `ctrl+alt+left` / `ctrl+alt+right`, चुनने के लिए Shift के साथ | | शब्द के हिस्से के हिसाब से चलना (camelCase, snake_case) |
| `shift+alt+a` | `shift+alt+a` | ब्लॉक कमेंट टॉगल करें |
| `shift+alt+i` | `shift+alt+i` | सेलेक्शन को पंक्तियों में बाँटें |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | सेलेक्शन फैलाएँ / सिकोड़ें |
| `cmd+u` | `ctrl+u` | पिछले सेलेक्शन पर लौटें |
| `cmd+g` / `cmd+shift+g`, `f3` / `shift+f3` | `f3` / `shift+f3` | अगला / पिछला मैच खोजें |
| `cmd+e` | | सेलेक्शन खोजें (`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | कैरेट की पंक्ति को फोल्ड / अनफोल्ड करें |
| `f12` | `f12` | कैरेट पर परिभाषा पर जाएँ (`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | सेलेक्शन पर कोड एक्शन (`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | कॉपी / कट / पेस्ट |

macOS और iOS में Cocoa की टेक्स्ट कुंजियाँ भी हैं: `ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` चलाती हैं, `ctrl+h` / `ctrl+d` मिटाती हैं।

जिन कमांड की कोई डिफ़ॉल्ट कुंजी नहीं है, और ऐप के अपने कमांड, वे कुंजियाँ लेते हैं जो ऐप [`keymap`](../modules/nsh.md#keymap) से बाइंड करता है, और उन्हें ref के `run` से चलाते हैं:

```tsx
import { keymap } from "nsh";

let editor!: EditorRef;

keymap.bind({
  "f9": () => editor.run("sortLinesAscending"),
  "mod+shift+u": () => editor.run("transformToUppercase"),
  "mod+alt+0": () => editor.run("foldAll"),
  "mod+alt+j": () => editor.run("unfoldAll"),
});
```

<a id="find-and-replace"></a>

## खोजें और बदलें

`search` बताता है कि क्या खोजना है: `{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`। इसके मैच हाइलाइट होते हैं, और जिस मैच पर सेलेक्शन है वह अधिक गहरा दिखता है, और `onSearchChange` `{ result }` रिपोर्ट करता है, जो एक `{ count, current, error }` है: कितने मैच हैं, सेलेक्शन किस मैच पर है (0 से शुरू), और रेगुलर एक्सप्रेशन मान्य क्यों नहीं है। `findNext` और `findPrevious` अगला और पिछला मैच चुनते हैं, घूमकर; `replace(text)` मौजूदा मैच को बदलता है और अगला चुन लेता है, और `replaceAll(text)` हर मैच को एक संपादन के रूप में बदलता है और `{ count }` लौटाता है, यानी कितने बदले। रेगुलर एक्सप्रेशन का रिप्लेसमेंट अपने ग्रुप को `$1` और `${name}` के रूप में संदर्भित करता है।

`inSelection` केवल उसी के भीतर खोजता है जो इसके चालू होते समय चुना गया था (कुछ न चुना हो तो कैरेट की पंक्तियाँ): जब तक यह चालू रहता है, यह दायरा संपादनों के बावजूद बना रहता है, भले ही सेलेक्शन एक मैच से दूसरे मैच पर जाता रहे। `findWithSelection` (macOS पर `cmd+e`) चुना हुआ टेक्स्ट, या कैरेट का शब्द, `onFindWithSelection` के साथ रिपोर्ट करता है, ताकि find bar उसे अपनी क्वेरी बना सके।

Find bar ऐप का अपना होता है:

```tsx
import { signal, Text, View } from "nsh";
import { Button, Editor, type EditorRef, type EditorSearchResult, Input } from "nsh/base";

function Find(props: { source: string; onChange: (value: string) => void }) {
  let editor!: EditorRef;
  const query = signal("");
  const replacement = signal("");
  const result = signal<EditorSearchResult>({ count: 0 });
  const status = () =>
    result().error ?? (result().current != null ? `${result().current! + 1} of ${result().count}` : `${result().count} found`);
  return (
    <View class="flex-1">
      <View class="flex-row items-center gap-2 border-b border-border p-2">
        <Input value={query()} onChange={({ value }) => query.set(value)} onSubmit={() => editor.run("findNext")} placeholder="Find" class="flex-1" />
        <Text class="text-sm text-muted-foreground">{status()}</Text>
        <Button onPress={() => editor.run("findPrevious")} class="px-2"><Text>↑</Text></Button>
        <Button onPress={() => editor.run("findNext")} class="px-2"><Text>↓</Text></Button>
        <Input value={replacement()} onChange={({ value }) => replacement.set(value)} placeholder="Replace" class="flex-1" />
        <Button onPress={() => editor.replace(replacement())} class="px-2"><Text>Replace</Text></Button>
        <Button onPress={async () => console.log("replaced", (await editor.replaceAll(replacement())).count)} class="px-2"><Text>All</Text></Button>
      </View>
      <Editor
        ref={editor}
        value={props.source}
        onChange={(e) => props.onChange(e.value)}
        language="ts"
        search={query() ? { query: query() } : undefined}
        onSearchChange={(e) => result.set(e.result)}
        class="flex-1"
      />
    </View>
  );
}
```

<a id="diagnostics"></a>

## डायग्नोस्टिक्स

`diagnostics` उन समस्याओं को चिह्नित करता है जो कोई language server या linter रिपोर्ट करता है: हर रेंज के नीचे उसकी गंभीरता (severity) के रंग में एक पतली लहरदार रेखा (`error`, `warning`, `info`, `hint`)। पोज़िशन 0 से शुरू होने वाली पंक्तियाँ और UTF-16 कॉलम हैं, जैसे language server की, इसलिए उसके डायग्नोस्टिक्स जैसे आते हैं वैसे ही पास हो जाते हैं। उपयोगकर्ता के टाइप करते समय चिह्न अपने टेक्स्ट पर बने रहते हैं, जब तक ऐप नए नहीं देता; संदेश दिखाना (एक सूची, पंक्ति पर hover कार्ड) ऐप का काम है।

एक डायग्नोस्टिक में language server के `Diagnostic` का बाकी हिस्सा भी होता है। इसके `tags` उसका टेक्स्ट वैसे ही बनाते हैं जैसे language client करते हैं: `unnecessary` कोड (अनयूज़्ड वेरिएबल, अप्राप्य कोड) फीका और `deprecated` कोड पर लकीर खिंची हुई दिखती है, `unnecessaryText` और `deprecatedText` हिस्सों में; टैग वाला hint केवल अपने टेक्स्ट में दिखता है। `codeDescription.href` वह पेज है जो उसके कोड (किसी lint नियम) का वर्णन करता है, और `relatedInformation` उन अन्य जगहों को सूचीबद्ध करता है जो उसके बारे में बताती हैं (`{ location: { uri?, range }, message }`): hover दोनों को ऐप को सौंपता है, जो उन्हें अपने hover कार्ड में दिखाता है और पेज खोलता है। Language server टैग संख्याओं (`1`, `2`) के रूप में भेजता है; editor उनके नाम लेता है।

```tsx
const problems = signal<EditorDiagnostic[]>([]);

async function lint(text: string) {
  // [{ range, severity, message, source?, code?, codeDescription?, tags?, relatedInformation? }]
  problems.set(await check(text));
}

<Editor
  value={source()}
  onChange={({ value }) => {
    source.set(value);
    lint(value);
  }}
  language="ts"
  diagnostics={problems()}
  classes={{ diagnosticWarning: "bg-orange-500", unnecessaryText: "text-zinc-400" }}
  class="flex-1"
/>
```

<a id="decorations"></a>

## डेकोरेशन

`decorations` उन रेंज को स्टाइल करते हैं जिन्हें ऐप चुनता है: language server से सिमैंटिक हाइलाइटिंग, चल रहा स्टेटमेंट, वे पंक्तियाँ जो किसी रिव्यू ने बदलीं। डेकोरेशन के `class` और `style` उसके टेक्स्ट को स्टाइल करते हैं; `lineClass` और `lineStyle` उसकी पंक्तियों की rows को स्टाइल करते हैं, टेक्स्ट के पीछे। डायग्नोस्टिक्स की तरह, वे संपादनों के बावजूद अपने टेक्स्ट पर बने रहते हैं, जब तक ऐप नए सेट नहीं करता।

```tsx
const range = (line: number, start: number, end: number) => ({ start: { line, column: start }, end: { line, column: end } });

<Editor
  value={source()}
  language="sql"
  readOnly
  decorations={[
    { range: range(4, 0, 0), lineClass: "bg-green-500/10" },
    { range: range(7, 6, 18), class: "underline text-blue-600" },
  ]}
  class="flex-1"
/>
```
<a id="gutter-and-overview-ruler-marks"></a>

### गटर और ओवरव्यू रूलर मार्क

किसी डेकोरेशन का `gutter` लाइन नंबरों से पहले की पट्टी में, उसकी रेंज में आने वाली हर लाइन के बगल में एक मार्क लगाता है: वे लाइनें जिन्हें version-control diff ने जोड़ा या बदला, या कोई breakpoint (खाली रेंज अपनी लाइन को कवर करती है, जैसे `lineClass` के साथ)। `placement: "before"` के साथ यह रेंज की शुरुआत से पहले की सीमा पर पट्टी के आर-पार एक रेखा होती है, जहाँ लाइनें हटाई गई थीं। पट्टी `gutterDecorationsWidth` पॉइंट चौड़ी है (डिफ़ॉल्ट रूप से 3) और जब तक किसी डेकोरेशन का गटर मार्क मौजूद है तब तक बनी रहती है, ताकि मार्क आते-जाते रहने पर भी टेक्स्ट अपनी जगह पर रहे। किसी फ़ोल्ड के भीतर की रेंज फ़ोल्ड की पंक्ति को मार्क करती है।

किसी डेकोरेशन का `overviewRuler` ओवरव्यू रूलर पर मार्क लगाता है। यह एडिटर के दाएँ किनारे की पट्टी है, 14 पॉइंट चौड़ी (स्क्रॉल बार जितनी; `overviewRuler` भाग दूसरी चौड़ाई तय करता है), जो पूरे टेक्स्ट को उसकी ऊँचाई पर मैप करती है, जैसा Monaco में होता है। मार्क कम से कम 6 पॉइंट ऊँचा होता है और रूलर का एक `lane` लेता है: `left`, `center` (डिफ़ॉल्ट), `right` या `full`। जब तक किसी डेकोरेशन का वहाँ मार्क है, रूलर दिखता रहता है।

हर मार्क ऐप के `class` और `style` को लेता है, और इनके बिना foreground color में बनता है। दोनों एडिट के साथ वैसे ही चलते हैं जैसे डेकोरेशन की रेंज; जो एडिट किसी मार्क की गई रेंज को मिटा दे, वह उसकी जगह एक खाली रेंज छोड़ देता है।

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  decorations={[
    { range: range(2, 0, 0), gutter: { class: "bg-yellow-500" }, overviewRuler: { lane: "left", class: "bg-yellow-500" } },
    { range: { start: { line: 3, column: 0 }, end: { line: 5, column: 0 } }, gutter: { class: "bg-green-500" } },
    { range: range(6, 0, 0), gutter: { class: "bg-red-500", placement: "before" }, overviewRuler: { lane: "left", class: "bg-red-500" } },
  ]}
  class="flex-1"
/>
```

<a id="your-own-highlighting"></a>

### अपनी हाइलाइटिंग

किसी डेकोरेशन का `token` अपने टेक्स्ट को वैसे रंगता है जैसे बिल्ट-इन हाइलाइटिंग उस प्रकार के टोकन को रंगती है (`comment`, `keyword`, `string`, `number`, `title`, `attr`, `built`, `deletion`), और वहाँ बिल्ट-इन हाइलाइटर ने जो पाया था उसकी जगह लेता है: ऐप का अपना हाइलाइटर (language server के semantic tokens, या ऐप का अपना parser) अपने टोकन को इन पर मैप करता है और लाइट व डार्क दोनों में एडिटर के रंग पाता है। सबसे भीतरी डेकोरेशन का टोकन चलता है; `class` और `style` उसके ऊपर लागू होते हैं। `highlighting={false}` बिल्ट-इन हाइलाइटर को बंद कर देता है, ताकि टेक्स्ट केवल ऐप के टोकन से रंगे, जबकि `language` अब भी comments, brackets और indentation तय करता है।

```tsx
const kinds: Record<string, EditorToken> = { keyword: "keyword", function: "title", string: "string", type: "built" };

<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  highlighting={false}
  decorations={semanticTokens().map((t) => ({ range: range(t.line, t.start, t.end), token: kinds[t.type] }))}
  class="flex-1"
/>
```

<a id="folding"></a>

## फ़ोल्डिंग

फ़ोल्ड वहाँ से शुरू होते हैं जहाँ लाइनें अपनी पिछली लाइन से अधिक indent की गई हों। `foldRanges` एडिटर को इसके बजाय ऐप की अपनी रेंज देता है (`{ startLine, endLine }`, language server की folding ranges का रूप, जो जैसी आती हैं वैसी ही पास हो जाती हैं): लाइन `startLine` फ़ोल्ड दिखाती है और उसके बाद की `endLine` तक की लाइनें फ़ोल्ड होकर छिप जाती हैं। जब तक ऐप नई रेंज न दे, वे एडिट के बाद भी अपनी लाइनों पर बनी रहती हैं।

फ़ोल्ड नेस्ट होते हैं: किसी ब्लॉक को फ़ोल्ड करने पर उसके भीतर के फ़ोल्ड फ़ोल्ड ही रहते हैं, इसलिए ब्लॉक को अनफ़ोल्ड करने पर वे वैसे ही दिखते हैं जैसे थे। `foldRecursive` एक ब्लॉक और उसके भीतर के हर ब्लॉक को फ़ोल्ड करता है, `unfoldRecursive` उन सबको अनफ़ोल्ड करता है, `foldLevel(n)` नेस्टिंग स्तर `n` के हर ब्लॉक को फ़ोल्ड करता है, और `foldSelection` (या `foldRange(range)`) किन्हीं भी लाइनों को फ़ोल्ड करता है, चाहे फ़ोल्ड कहीं भी शुरू होते हों। `onFoldChange` हर बदलाव के बाद फ़ोल्ड की गई रेंज बताता है, और `folds()` / `setFolds(ranges)` उन्हें पढ़ते और बहाल करते हैं, ताकि उन्हें फ़ाइल के साथ रखा जा सके।

```tsx
const ranges = signal<EditorFoldRange[]>([]);
const folded = new Map<string, EditorFoldRange[]>();

<Editor
  ref={editor}
  value={file().text}
  language={file().name}
  foldRanges={ranges()} // from the language server's textDocument/foldingRange
  onFoldChange={({ folds }) => folded.set(file().name, folds)}
  class="flex-1"
/>
<Button onPress={() => editor.foldLevel(2)}><Text>Fold the methods</Text></Button>
```

<a id="breakpoints-and-context-menus"></a>

## Breakpoints और context menus

लाइन नंबर पर प्रेस करने से `onLineNumberPress({ line })` रिपोर्ट होता है, जो उस breakpoint की जगह है जिसे ऐप डेकोरेशन के रूप में खींचता है। सेकेंडरी बटन (राइट क्लिक, Mac पर Control-click) `onContextMenu({ position, x, y })` रिपोर्ट करता है: पॉइंटर के नीचे टेक्स्ट में की स्थिति और root view में वह बिंदु, जहाँ ऐप अपना मेन्यू खोलता है। टच स्क्रीन पर लंबा प्रेस, डबल टैप, हैंडल छोड़ना और सेलेक्शन पर टैप भी इसे रिपोर्ट करते हैं, `selection` के साथ: root view में सेलेक्शन का बॉक्स (`{ x, y, width, height }`), और उसके ऊपरी मध्य पर `x` / `y`, एडिट मेन्यू के लिए।

```tsx
<Editor
  value={source()}
  onContextMenu={({ x, y, selection }) =>
    Menu.popup(selection ? editItems : contextItems, { x, y })
  }
/>
```

```tsx
const breakpoints = signal<number[]>([]);

<Editor
  value={source()}
  language="py"
  onLineNumberPress={({ line }) =>
    breakpoints.set(breakpoints().includes(line) ? breakpoints().filter((l) => l !== line) : [...breakpoints(), line])
  }
  decorations={breakpoints().map((line) => ({ range: range(line, 0, 0), lineClass: "bg-red-500/15" }))}
  class="flex-1"
/>
```

<a id="language-features"></a>

## भाषा सुविधाएँ

सुझाव, hover जानकारी, go to definition और code actions ऐप के language server से आते हैं। एडिटर completion सूची, inline completion और definition link खुद अपनी कुंजियों के साथ बनाता है; बाकी के लिए वह ऐप को क्षण और स्थान देता है, और ऐप अपने popup खुद बनाता है ([`Overlay`](./overlay.md), जो `pageBounds` से जुड़ा होता है)।

### Completion

`completion` के साथ, एडिटर ऐप से सुझाव माँगता है और उन्हें टाइप किए जा रहे शब्द के नीचे सूची के रूप में दिखाता है (विंडो के नीचे के पास होने पर उसके ऊपर):

- शब्द के अंत में कोई अक्षर, अंक या `_` टाइप करने पर `onCompletionRequest(event)` के साथ माँग होती है, trigger `"typing"`: `event` में उसका `id`, कैरेट का `offset` और `position`, `query` (अब तक टाइप किया शब्द) और वह `queryStart` offset होता है जहाँ से वह शुरू होता है। `completionTriggerCharacters` (`["."]`, `["::", "<"]`) में से हर एक के बाद खाली query के साथ माँग होती है, trigger `"character"` (और `character`), और `showCompletions()` या `run("showCompletions")` कैरेट पर माँगता है, trigger `"invoked"`।
- ऐप `presentCompletions(event.id, items)` से उत्तर देता है। हर आइटम language server के `CompletionItem` रूप का है: `label`, और वैकल्पिक रूप से `kind` (`"function"`, `"variable"`, `"class"`, ...), `detail`, `documentation`, `insertText`, `filterText`, `sortText` और `range`। सबसे ताज़ा माँग का उत्तर दिखता है; पहले वाला, या ऐसे शब्द का उत्तर जिसे कैरेट छोड़ चुका है, अलग रख दिया जाता है।
- टाइप करते रहने पर सूची वहीं फ़िल्टर होती रहती है: query हर आइटम के `filterText` (नहीं तो उसके label) से अक्षरों के क्रम में, किसी भी केस में मेल खाती है; पहले वे शब्द जो query से शुरू होते हैं, फिर सबसे नज़दीकी मेल, फिर `sortText` के अनुसार। मेल खाए अक्षर उभरकर दिखते हैं। टाइप करते रहने पर एडिटर दोबारा माँगे, इसके लिए `incomplete: true` (`presentCompletions(id, items, true)`) दें।
- Up और Down (तथा Control+P / Control+N) सूची में चलते हैं, Page Up और Page Down एक पेज के हिसाब से, Enter और Tab स्वीकार करते हैं, Escape बंद करता है। पॉइंटर किसी आइटम को चिह्नित करता है और क्लिक (टच स्क्रीन पर टैप) उसे स्वीकार करता है। चुने गए आइटम का `documentation` सूची के बगल में दिखता है।
- स्वीकार करने पर आइटम का `range` (नहीं तो query) उसके `insertText` (नहीं तो label) से बदल जाता है, एक ऐसे चरण के रूप में जिसे undo वापस ले सकता है, कैरेट पर और हर उस दूसरे कैरेट पर जिसके पहले वही टेक्स्ट है, और `onCompletionAccept({ item })` रिपोर्ट होता है।
- कैरेट के शब्द से बाहर जाने पर, space या अन्य punctuation पर, एडिटर का फ़ोकस खोने पर और कैरेट के दृश्य से बाहर स्क्रॉल होने पर सूची बंद हो जाती है।

टाइपिंग में विराम (`inlineCompletionDelay`, डिफ़ॉल्ट रूप से 300 ms) पर, जब कोई सूची न दिख रही हो, inline completion माँगा जाता है: `onInlineCompletionRequest({ id, offset, position })`। `presentInlineCompletion(id, text)` कैरेट पर `text` को हल्के रंग में दिखाता है, Tab उसे डालता है, और Escape, कोई एडिट या कैरेट का हिलना उसे हटा देता है।

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  completion
  completionTriggerCharacters={["."]}
  onCompletionRequest={async (e) => {
    const items = await server.completion(e.position);
    editor.presentCompletions(e.id, items);
  }}
  onInlineCompletionRequest={async (e) => {
    editor.presentInlineCompletion(e.id, await assistant.suggest(e.offset));
  }}
  class="flex-1"
/>
```

<a id="hovers-and-presses"></a>

### Hovers और presses

- `onHover(event)`: माउस किसी अक्षर पर टिका है और कोई बटन दबा नहीं है (डेस्कटॉप और वेब; ड्रैग करने पर टेक्स्ट सेलेक्ट होता है)। `event` में उसका `position`, उसका UTF-16 `offset`, उसके शब्द का `range`, पॉइंटर का `pagePosition`, शब्द का `pageBounds`, दबे हुए `modifiers` और वहाँ के `diagnostics` होते हैं, जिनके संदेश ऐप दिखाता है। दूसरे शब्द पर जाने पर अगला hover तुरंत रिपोर्ट होता है।
- `onHoverEnd()`: माउस शब्द या एडिटर से बाहर गया, या उसके नीचे टेक्स्ट बदला या स्क्रॉल हुआ।
- `onTextPress(event)`: एडिटर के कैरेट रखने के बाद कोई अक्षर प्रेस किया गया: `{ position, offset, range,
  pagePosition, modifiers, clicks }`।
- `caretBounds()` और `rangeBounds(range)`: कैरेट और कोई रेंज कहाँ हैं, `{ bounds, pageBounds }` (एडिटर में और root view में): वहाँ ऐप का popup खुलता है।

```tsx
const hover = signal<EditorHoverEvent | null>(null);

<Editor
  ref={editor}
  value={source()}
  language="ts"
  onHover={(event) => hover.set(event)}
  onHoverEnd={() => hover.set(null)}
  class="flex-1"
/>
<If when={hover()}>
  {(event) => (
    <Overlay anchor={event().pageBounds} placement="top" class="rounded-md border border-border bg-popover p-2">
      <Text>{event().diagnostics.map((d) => d.message).join("\n") || describe(event().range)}</Text>
    </Overlay>
  )}
</If>
```

<a id="go-to-definition-and-code-actions"></a>

### Go to definition और code actions

Mod दबाए रखने (macOS और iOS पर Command, बाकी जगह Control) से माउस के नीचे के शब्द लिंक बन जाते हैं, जैसे code editors में:

- किसी शब्द पर Mod दबाए रखने पर (माउस के वहाँ टिके रहते दबाया गया, या Mod दबाए हुए माउस वहाँ ले जाया गया), एडिटर `onDefinitionRequest(event)` से माँगता है, trigger `"hover"`: `event` में उसका `id`, अक्षर का `position` और `offset`, और शब्द का `range` होता है। जब language server को definition मिले तो `presentDefinitionLink(event.id, range)` से उत्तर दें: रेंज रेखांकित हो जाती है (`definitionLink` भाग) और उस पर पॉइंटर हाथ बन जाता है। Mod छोड़ने पर, माउस के लिंक से हटने पर, टेक्स्ट बदलने या स्क्रॉल होने पर, या `hideDefinitionLink()` से लिंक हट जाता है। सबसे ताज़ा माँग का उत्तर दिखता है; पहले वाला अलग रख दिया जाता है।
- किसी शब्द पर Mod-click trigger `"press"` के साथ माँगता है; लिंक पर कैरेट वहीं रहता है जहाँ था। F12 (`goToDefinition`, `run("goToDefinition")`) कैरेट वाले शब्द के लिए माँगता है, trigger `"key"`। ऐप definition पर जाता है: उसी टेक्स्ट में हो तो `revealPosition` और `setSelections`, दूसरी फ़ाइल के लिए अपना नेविगेशन।
- Mod+. (`showCodeActions`, `run("showCodeActions")`) `onCodeActionRequest({ range, position, bounds })` रिपोर्ट करता है: प्राथमिक सेलेक्शन (शुरुआत पहले), कैरेट और उसका बॉक्स। ऐप अपने language server से actions माँगता है, अपना मेन्यू `bounds.pageBounds` पर दिखाता है ([`Menu`](./menu.md) या `Overlay`), और चुनी गई action के एडिट `edit(edits)` से लागू करता है।

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  onDefinitionRequest={async (e) => {
    const target = await server.definition(e.position);
    if (!target) return;
    if (e.trigger === "hover") editor.presentDefinitionLink(e.id, target.originRange ?? e.range);
    else editor.revealPosition(target.range.start, true);
  }}
  onCodeActionRequest={async (e) => {
    const actions = await server.codeActions(e.range);
    const picked = await choose(actions, e.bounds?.pageBounds);
    if (picked) editor.edit(picked.edits);
  }}
  class="flex-1"
/>
```

<a id="size-and-scrolling"></a>

## आकार और स्क्रॉलिंग

`minRows` और / या `maxRows` के साथ एडिटर अपने टेक्स्ट के साथ बढ़ता है: वह अपनी पंक्तियों जितना ऊँचा होता है, कम से कम `minRows` पंक्तियाँ, और `maxRows` से आगे उसका टेक्स्ट स्क्रॉल होता है, जैसे message box या notebook का cell। अन्यथा आकार ऐप तय करता है, और `scrollBeyondLastLine` टेक्स्ट को अंतिम लाइन के आगे तक स्क्रॉल होने देता है: एक स्क्रीन तक (`true`, डिफ़ॉल्ट), बिल्कुल नहीं (`false`) या कुछ पंक्तियों तक। कैरेट के हिलने पर उसके आसपास `cursorSurroundingLines` पंक्तियाँ दृश्य में रहती हैं। सेलेक्शन को एडिटर के किनारों के पार खींचने पर स्क्रॉल आगे बढ़ता है, पॉइंटर जितना दूर जाता है उतना तेज़।

`showWhitespaces` हर space के लिए `·` और हर tab के लिए `→` दिखाता है (`whitespace` भाग), और `rulers` अपने हर column पर एक रेखा खींचता है (`ruler` भाग), लाइन की लंबाई के guides के रूप में।

```tsx
<Editor
  defaultValue={message()}
  language="markdown"
  minRows={2}
  maxRows={8}
  rulers={[72]}
  showWhitespaces
/>
```

## Methods

`ref={editor}` एडिटर के methods देता है (`EditorRef`), ऐप के बटनों, मेन्यू और कुंजियों के लिए। जो methods कोई मान लौटाते हैं (`value()`, `selections()`, `replaceAll()`, `canUndo()`, `caretBounds()`, `folds()`, ...) वे JS में उसका `Promise` लौटाते हैं, इसलिए उन्हें `await` करें: `const text = await editor.value()`। जिस method को टेक्स्ट के बाद की लाइन दी जाए (`fold`, `scrollToLine`, `goToLine`, ...) वह कुछ नहीं बदलता और method व लाइन का नाम बताते हुए चेतावनी लॉग करता है।

| Method | विवरण |
|---|---|
| `focus()`, `blur()` | फ़ोकस लेता है, या छोड़ देता है। |
| `value()` | `Promise<string>`: टेक्स्ट। |
| `setValue(value)` | टेक्स्ट बदलता है, एक ऐसे एडिट के रूप में जिसे undo वापस ले सकता है। |
| `insert(text)` | हर सेलेक्शन पर `text` को जैसा है वैसा टाइप करता है (brackets बंद नहीं होते)। |
| `edit(edits)` | `{ range, text }` replacements लागू करता है (वर्तमान टेक्स्ट की रेंज; जो किसी पहले वाली से ओवरलैप करे वह छोड़ दी जाती है) एक ऐसे चरण के रूप में जिसे undo वापस ले सकता है; सेलेक्शन अपने आसपास के टेक्स्ट के साथ चलते हैं। Code actions और formatting edits यहीं जाते हैं। |
| `selections()` | `Promise<EditorSelection[]>`: हर सेलेक्शन, `{ anchor, head }`, प्राथमिक (सबसे नया) अंत में। |
| `setSelections(selections)` | सेलेक्शन सेट करता है (अंतिम वाला प्राथमिक) और प्राथमिक को दृश्य में स्क्रॉल करता है। |
| `run(command)` | कमांड चलाता है, जैसे उसकी कुंजियाँ चलातीं ([कमांड](#commands))। |
| `replace(text)` | वर्तमान मेल को बदलता है और अगला चुनता है। |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`: हर मेल को एक एडिट के रूप में बदलता है; `{ count }`, कितने। |
| `fold(line)`, `unfold(line)` | लाइन `line` (0 से) के नीचे की लाइनों को फ़ोल्ड करता है, या अनफ़ोल्ड करता है। |
| `foldRecursive(line)`, `unfoldRecursive(line)` | लाइन `line` का फ़ोल्ड और उसके भीतर के हर फ़ोल्ड को फ़ोल्ड करता है, या उन सबको अनफ़ोल्ड करता है। |
| `foldLevel(level)` | नेस्टिंग स्तर `level` (1: सबसे बाहरी) के हर फ़ोल्ड को फ़ोल्ड करता है। |
| `foldRange(range)` | `range` (`{ startLine, endLine }`) की लाइनों को फ़ोल्ड करता है, फ़ोल्ड कहीं भी शुरू होते हों। |
| `folds()` | `Promise<EditorFoldRange[]>`: फ़ोल्ड की गई रेंज, नेस्टेड वाली सहित। |
| `setFolds(folds)` | ठीक `folds` को फ़ोल्ड करता है। |
| `scrollToLine(line)` | लाइन `line` को दृश्य में स्क्रॉल करता है, जो उसे छिपा रहा हो उसे अनफ़ोल्ड करते हुए। |
| `canUndo()`, `canRedo()` | `Promise<boolean>`: क्या वापस लेने के लिए, या दोबारा करने के लिए कोई एडिट है। |
| `caretBounds()` | `Promise<EditorBounds \| null>`: प्राथमिक कैरेट का बॉक्स, `{ bounds, pageBounds }`, एडिटर में (उसकी स्क्रॉलिंग लागू करके) और root view में; एडिटर का layout होने से पहले `null`। |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`: `range` के बॉक्स, उसकी हर कवर की गई पंक्ति के लिए एक। |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>`: टेक्स्ट कितना स्क्रॉल हुआ है; उसे `{ x, y }` तक स्क्रॉल करता है। |
| `visibleRange()` | `Promise<EditorRange>`: viewport जो टेक्स्ट दिखाता है, उसकी पहली पंक्ति की शुरुआत से अंतिम पंक्ति के अंत तक। |
| `selectedText()` | `Promise<string>`: प्राथमिक सेलेक्शन का टेक्स्ट। |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`, `Promise<number>`: `value()` के UTF-16 offsets और positions के बीच। |
| `revealPosition(position, center)` | `position` को दृश्य में स्क्रॉल करता है, जो उसे छिपा रहा हो उसे अनफ़ोल्ड करते हुए; `center` के साथ बीच में। |
| `goToLine(line)` | कैरेट को लाइन `line` (0 से) की शुरुआत पर रखता है और उसे बीच में स्क्रॉल करता है। |
| `showCompletions()` | कैरेट पर completions माँगता है, उससे पहले का शब्द query होता है ([Completion](#completion))। |
| `presentCompletions(id, items, incomplete?)` | completion माँग `id` का उत्तर देता है: सूची `items` दिखाती है, उसके बाद टाइप की गई चीज़ से फ़िल्टर होकर; `incomplete` के साथ, टाइप करते रहने पर दोबारा माँगा जाता है। कोई आइटम न हो तो सूची बंद हो जाती है। |
| `hideCompletions()` | completion सूची बंद करता है। |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | inline completion माँग `id` का उत्तर `text` से देता है, जो कैरेट पर दिखता है; उसे हटाता है। |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | definition माँग `id` (trigger `"hover"`) का उत्तर देता है: `range` लिंक के रूप में रेखांकित होता है ([Go to definition](#go-to-definition-and-code-actions)); उसे छिपाता है। |

```tsx
let editor!: EditorRef;

<Button onPress={() => editor.run("toggleComment")}><Text>Comment</Text></Button>
<Button onPress={async () => save(await editor.value())}><Text>Save</Text></Button>
<Button onPress={async () => (await editor.canUndo()) && editor.run("undo")}><Text>Undo</Text></Button>
<Button onPress={() => editor.setSelections([{ anchor: { line: 0, column: 0 }, head: { line: 0, column: 0 } }])}>
  <Text>Go to the top</Text>
</Button>
<Editor ref={editor} value={source()} onChange={({ value }) => source.set(value)} language="rs" class="flex-1" />
```
<a id="commands"></a>

### कमांड

`run` एडिटर के कमांड उनके नाम से लेता है (`EditorCommand`):

| कमांड | ये क्या करते हैं |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | कैरेट को घुमाते हैं। |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | सेलेक्शन को बढ़ाते हैं। |
| `moveToMatchingBracket` | कैरेट वाले ब्रैकेट के मिलान वाले ब्रैकेट पर जाता है। |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | चुनते हैं। |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | शब्द के एक हिस्से के हिसाब से घुमाते या बढ़ाते हैं (camelCase के हम्प, snake_case के हिस्से)। |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | पैराग्राफ़ से पहले या बाद की खाली लाइन तक घुमाते या बढ़ाते हैं। |
| `expandSelection`, `shrinkSelection` | सेलेक्शन को एक इकाई से बढ़ाते हैं, या वापस घटाते हैं। |
| `undoSelection`, `redoSelection` | पिछली मूवमेंट से पहले के सेलेक्शन पर लौटते हैं, या दोबारा आगे जाते हैं। |
| `splitSelectionIntoLines` | हर सेलेक्शन की हर लाइन के लिए एक सेलेक्शन। |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | एक कैरेट जोड़ते हैं; वापस एक सेलेक्शन पर लौटते हैं। |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | हटाते हैं। |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | लाइनें, इंडेंटेशन और कमेंट। |
| `sortLinesAscending`, `sortLinesDescending` | चुनी हुई लाइनों को क्रमबद्ध करते हैं (जिस लाइन में सिर्फ़ कैरेट हो, वह भी हर लाइन)। |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | सेलेक्शन का केस बदलते हैं (कैरेट हो तो उसका शब्द)। |
| `trimTrailingWhitespace` | हर लाइन के अंत की व्हाइटस्पेस हटाता है। |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | फिर से व्यवस्थित करते हैं। |
| `undo`, `redo` | पूर्ववत करें और फिर से करें। |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | कैरेट की लाइन पर, या सब कुछ फ़ोल्ड करते हैं। |
| `foldRecursive`, `unfoldRecursive` | कैरेट का फ़ोल्ड और उसके अंदर के हर फ़ोल्ड को फ़ोल्ड करते हैं, या खोलते हैं। |
| `foldSelection` | हर उस सेलेक्शन की लाइनें फ़ोल्ड करता है जो कई लाइनों में फैला हो। |
| `findNext`, `findPrevious` | `search` का अगला या पिछला मिलान चुनते हैं। |
| `findWithSelection` | फ़ाइंड बार (`onFindWithSelection`) के लिए चुना हुआ टेक्स्ट रिपोर्ट करता है। |
| `copy`, `cut`, `paste` | क्लिपबोर्ड। |
| `showCompletions` | कैरेट पर कम्प्लीशन माँगता है ([कंप्लीशन](#completion))। |
| `goToDefinition` | कैरेट वाले शब्द की डेफ़िनिशन माँगता है (`onDefinitionRequest`, ट्रिगर `"key"`)। |
| `showCodeActions` | सेलेक्शन पर कोड एक्शन माँगता है (`onCodeActionRequest`)। |

<a id="styling-the-parts"></a>

## हिस्सों की स्टाइलिंग

`class` और `style` एडिटर के बॉक्स को स्टाइल करते हैं। `classes` हिस्से के अनुसार Tailwind क्लास लेता है और `styles` हिस्से के अनुसार इनलाइन स्टाइल; किसी हिस्से की क्लास उसकी अपनी डिफ़ॉल्ट स्टाइल के बाद आती हैं, इसलिए वही लागू होती हैं, और उसके `styles` क्लास पर भारी पड़ते हैं। फ़ॉन्ट `fontFamily`, `fontSize` और `lineHeight` से सेट होता है, जिनमें एडिटर अपना टेक्स्ट नापता है।

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="tsx"
  fontFamily="JetBrains Mono"
  fontSize={14}
  lineHeight={22}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineNumber: "text-xs",
    activeLine: "bg-yellow-500/10",
    selection: "bg-blue-500/30",
  }}
  styles={{ caret: { backgroundColor: "#f59e0b", width: 3 } }}
/>
```

| हिस्सा | यह क्या है | डिफ़ॉल्ट |
|---|---|---|
| `gutter` | लाइन नंबरों और फ़ोल्ड मार्करों का कॉलम | नंबरों से पहले 12pt, मार्करों के बाद 4pt |
| `lineNumber` | हर लाइन नंबर | दाएँ संरेखित, `muted-foreground` |
| `activeLineNumber` | कैरेट वाली लाइनों के नंबर, `lineNumber` के बाद | `foreground` |
| `foldMarker` | उस लाइन का मार्कर जहाँ फ़ोल्ड शुरू होता है | `⌄`, फ़ोल्ड होने पर `›`, `muted-foreground` |
| `overviewRuler` | दाएँ किनारे पर ओवरव्यू रूलर, जब वहाँ किसी डेकोरेशन का मार्क हो | कोई नहीं |
| `content` | गटर के बगल का टेक्स्ट क्षेत्र | टेक्स्ट से पहले 4pt |
| `line` | टेक्स्ट की हर पंक्ति | |
| `activeLine` | कैरेट वाली लाइनों की पंक्तियों के पीछे, स्क्रॉल संकेतकों के नीचे | `muted`, हल्का |
| `selection` | चुने हुए टेक्स्ट के पीछे | `primary` की एक झलक |
| `caret` | कैरेट | 2pt चौड़े, `foreground`, झपकते हुए |
| `composition` | वह टेक्स्ट जिसे इनपुट मेथड कंपोज़ कर रहा है | रेखांकित |
| `searchMatch` | `search` के मिलान | पारदर्शी एम्बर |
| `currentSearchMatch` | वह मिलान जिस पर सेलेक्शन है, `searchMatch` के बाद | गाढ़ा एम्बर |
| `matchingBracket` | कैरेट वाला ब्रैकेट और उसका जोड़ीदार | 1pt का बॉर्डर |
| `indentGuide` | हर इंडेंटेशन स्तर के लिए एक गाइड | `border` की 1pt लाइन |
| `foldPlaceholder` | फ़ोल्ड की गई लाइन अपने टेक्स्ट के बाद क्या दिखाती है | ` ⋯ `, `muted-foreground` |
| `placeholder` | टेक्स्ट खाली होने पर दिखता है | `muted-foreground` |
| `diagnosticError` | एरर के नीचे की रेखा | `destructive` |
| `diagnosticWarning` | वॉर्निंग के नीचे की रेखा | एम्बर |
| `diagnosticInfo` | इन्फ़ॉर्मेशन के नीचे की रेखा | नीला |
| `diagnosticHint` | हिंट के नीचे की रेखा | `muted-foreground` |
| `unnecessaryText` | `unnecessary` डायग्नोस्टिक का टेक्स्ट | `muted-foreground` |
| `deprecatedText` | `deprecated` डायग्नोस्टिक का टेक्स्ट | कटा हुआ |
| `whitespace` | स्पेस और टैब के निशान (`showWhitespaces`) | `·` और `→`, 60 % पर `muted-foreground` |
| `ruler` | `rulers` की रेखाएँ | `border` की 1 पॉइंट की रेखा |
| `selectionHandle` | टच सेलेक्शन के सिरों पर हैंडल की घुंडियाँ | `primary` का 10pt का बिंदु |
| `selectionHandleStart`, `selectionHandleEnd` | शुरुआत की घुंडी (उसकी लाइन के ऊपर) और अंत की (नीचे), `selectionHandle` के बाद | |
| `completionMenu` | कम्प्लीशन सूची का बॉक्स | `popover`, 1pt का `border`, गोल कोने, एक शैडो |
| `completionItem` | सूची का हर आइटम | एक पंक्ति जितनी ऊँचाई, 8pt पैडिंग |
| `selectedCompletionItem` | चुना हुआ आइटम, `completionItem` के बाद | `accent` |
| `completionMatch` | लेबल के वे अक्षर जिनसे क्वेरी मिली | सेमीबोल्ड, `primary` |
| `completionDetail` | आइटम का विवरण, उसके लेबल के बाद | दाएँ संरेखित, `muted-foreground` |
| `completionKind` | आइटम की किस्म, उसके लेबल से पहले | एक छोटा नाम (`fn`, `var`, `cls`), `muted-foreground` |
| `completionDocumentation` | चुने हुए आइटम का डॉक्यूमेंटेशन, सूची के बगल में | `completionMenu` जैसा, अधिकतम 320pt चौड़ा |
| `inlineCompletion` | कैरेट पर इनलाइन कम्प्लीशन | `muted-foreground` |
| `definitionLink` | डेफ़िनिशन लिंक की अंडरलाइन | टेक्स्ट के नीचे `primary` की 1pt रेखा |

## Props

| Prop | Rust | टाइप | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | टेक्स्ट, जिसे ऐप नियंत्रित करता है (इसे `onChange` से दोबारा सेट करें)। |
| `defaultValue` | `.default_value(..)` | `string` | | पहला टेक्स्ट, जब एडिटर अपना टेक्स्ट खुद रखता है। |
| `language` | `.language(..)` | `string` | सादा टेक्स्ट | किसी भाषा का नाम, उपनाम, एक्सटेंशन या फ़ाइल नाम ([भाषाएँ](#languages))। |
| `placeholder` | `.placeholder(..)` | `string` | | टेक्स्ट खाली होने पर दिखता है। |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | टेक्स्ट चुना और कॉपी किया जा सकता है, बदला नहीं जा सकता। |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | दिखाई देते ही फ़ोकस ले लेता है। |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | गटर के लाइन नंबर। |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | लंबी लाइनें एडिटर की चौड़ाई पर रैप होती हैं। |
| `tabSize` | `.tab_size(..)` | `number` | भाषा का डिफ़ॉल्ट | एक टैब और एक इंडेंटेशन स्तर के कॉलम। |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | भाषा का डिफ़ॉल्ट | टैब से इंडेंट करता है। |
| `folding` | `.folding(..)` | `boolean` | `true` | इंडेंट की गई लाइनें गटर के मार्करों से फ़ोल्ड होती हैं। |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | इंडेंटेशन के अनुसार | फ़ोल्ड कहाँ शुरू होते हैं, ऐप के अनुसार ([फ़ोल्डिंग](#folding))। |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | अंतर्निहित सिंटैक्स हाइलाइटिंग ([अपनी हाइलाइटिंग](#your-own-highlighting))। |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | ब्रैकेट और कोट टाइप करते ही बंद हो जाते हैं। |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | नई लाइन इंडेंटेशन बनाए रखती है और खुलने वाले ब्रैकेट के बाद इंडेंट करती है। |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | कैरेट वाली लाइनों की पंक्तियाँ हाइलाइट होती हैं। |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | इंडेंटेशन के गाइड। |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | टेक्स्ट अपनी आख़िरी लाइन के आगे भी स्क्रॉल होता है: एक स्क्रीन तक (`true`), बिल्कुल नहीं (`false`) या उतनी पंक्तियों तक। |
| `fontFamily` | `.font_family(..)` | `string` | थीम का `font-mono` | वह फ़ॉन्ट जिसमें टेक्स्ट बनाया और नापा जाता है। |
| `fontSize` | `.font_size(..)` | `number` | `13` | फ़ॉन्ट का आकार, पॉइंट में। |
| `lineHeight` | `.line_height(..)` | `number` | `20` | एक पंक्ति की ऊँचाई, पॉइंट में। |
| `search` | `.search(..)` | `EditorSearch` | | क्या खोजना है ([खोजें और बदलें](#find-and-replace))। |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | चिह्नित की जाने वाली समस्याएँ ([डायग्नोस्टिक्स](#diagnostics))। |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | वे रेंज जिन्हें ऐप स्टाइल करता है ([डेकोरेशन](#decorations))। |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | गटर में डेकोरेशन के मार्क की पट्टी की चौड़ाई, पॉइंट में। |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | हिस्से के अनुसार Tailwind क्लास। |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | हिस्से के अनुसार इनलाइन स्टाइल, क्लास के ऊपर। |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | स्क्रीन रीडर एडिटर को किस नाम से पुकारते हैं। |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | स्पेस और टैब `·` और `→` के रूप में दिखते हैं। |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | वे कॉलम जहाँ खड़ी रेखा खींचनी है। |
| `minRows` | `.min_rows(..)` | `number` | | एडिटर अपने टेक्स्ट के साथ इतनी पंक्तियों से बढ़ना शुरू करता है ([आकार और स्क्रॉलिंग](#size-and-scrolling))। |
| `maxRows` | `.max_rows(..)` | `number` | | एडिटर अपने टेक्स्ट के साथ अधिकतम इतनी पंक्तियों तक बढ़ता है, फिर स्क्रॉल करता है। |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | कैरेट के ऊपर और नीचे दृश्य में रखी जाने वाली पंक्तियाँ। |
| `completion` | `.completion(..)` | `boolean` | `false` | एडिटर सुझाव माँगता है और उन्हें सूची के रूप में दिखाता है ([कंप्लीशन](#completion))। |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | टाइप करते समय और क्या कम्प्लीशन माँगता है। |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | इनलाइन कम्प्लीशन माँगे जाने से पहले टाइपिंग कितने मिलीसेकंड रुकती है। |
| `class`, `style` | स्टाइल मेथड | `string`, `StyleProp<ViewStyle>` | | एडिटर का बॉक्स। |

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | टेक्स्ट बदला: `{ value }`, पूरा नया टेक्स्ट। |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | सेलेक्शन बदले: `{ selections }`, हर एक, प्राइमरी सबसे अंत में। |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | एडिटर को फ़ोकस मिला या उसने फ़ोकस खोया। |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | खोज के मिलान बदले: `{ result }`, एक `{ count, current, error }`। |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | किसी लाइन नंबर को दबाया गया: `{ line }`, वह लाइन, 0 से शुरू। |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | टेक्स्ट के ऊपर सेकेंडरी बटन दबाया गया, या टच से टेक्स्ट चुना गया: `{ position, x, y, selection? }`। |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | माउस किसी अक्षर पर ठहरा है ([भाषा की सुविधाएँ](#language-features))। |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | होवर समाप्त हुआ। |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | कोई अक्षर दबाया गया: उसके शब्द, मॉडिफ़ायर और क्लिक के साथ। |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | `findWithSelection` चला: `{ query }`, फ़ाइंड बार की क्वेरी के लिए टेक्स्ट। |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | फ़ोल्ड की गई रेंज बदलीं: `{ folds }`, हर एक, नेस्टेड सहित। |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | एडिटर कम्प्लीशन माँगता है: `{ id, offset, position, query, queryStart, trigger, character? }` ([कंप्लीशन](#completion))। |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | कोई आइटम स्वीकार किया गया और डाला गया: `{ item }`। |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | टाइपिंग रुकी: `{ id, offset, position }`, इनलाइन कम्प्लीशन के लिए। |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | एडिटर डेफ़िनिशन माँगता है: `{ id, position, offset, range, trigger }` ([डेफ़िनिशन पर जाएँ](#go-to-definition-and-code-actions))। |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | उपयोगकर्ता ने कोड एक्शन माँगे: `{ range, position, bounds? }`। |

<a id="accessibility"></a>

## एक्सेसिबिलिटी

स्क्रीन रीडर एडिटर को उसके `accessibilityLabel` से पुकारते हैं; उसका फ़ोकस एक टेक्स्ट इनपुट जैसा है, इसलिए प्लेटफ़ॉर्म की टेक्स्ट सेवाएँ (इनपुट मेथड, डिक्टेशन, सॉफ़्ट कीबोर्ड) उसमें काम करती हैं।

<a id="related"></a>

## संबंधित

- [TextView](./text-view.md): Markdown और HTML के दस्तावेज़, जिनके कोड ब्लॉक एडिटर के सिंटैक्स रंग साझा करते हैं।
- [DiffView](./diff-view.md): दो टेक्स्ट के बीच के बदलाव, एडिटर के सिंटैक्स रंगों में।
- [Input](./input.md): प्लेटफ़ॉर्म की अपनी एडिटिंग वाले सिंगल और मल्टीलाइन टेक्स्ट फ़ील्ड।
- [`keymap`](../modules/nsh.md#keymap): एडिटर के कमांड के लिए ऐप की कीज़।
- [`nsh/base`](../modules/nsh-base.md): अन्य बेस कॉम्पोनेंट।
