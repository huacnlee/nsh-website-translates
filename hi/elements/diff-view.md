---
title: "DiffView"
description: "DiffView कॉम्पोनेंट: दो टेक्स्ट या किसी पैच के बीच के बदलाव, साइड-बाय-साइड या यूनिफाइड रूप में, लाइनों के भीतर बदले गए शब्द हाइलाइट किए जाते हैं, अपरिवर्तित लाइनें ऐसे सेपरेटर में समेट दी जाती हैं जिन्हें फैलाया जा सकता है, साथ में सिंटैक्स हाइलाइटिंग, सॉफ्ट रैप, प्रति-बदलाव एक्शन, लाइन चयन और रिव्यू एनोटेशन उपलब्ध हैं।"
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---

# DiffView

`DiffView` दो टेक्स्ट के बीच के बदलाव उसी तरह दिखाता है जैसे कोड रिव्यू टूल दिखाते हैं: या तो साथ-साथ (split), जिसमें पुराना टेक्स्ट बाईं ओर और नया दाईं ओर होता है और उनकी पंक्तियाँ संरेखित रहती हैं, या unified, जिसमें हटाई गई पंक्तियाँ जोड़ी गई पंक्तियों के ऊपर होती हैं। बदली हुई पंक्ति के भीतर बदले हुए शब्द हाइलाइट होते हैं, बदलावों के बीच की अपरिवर्तित पंक्तियाँ ऐसे सेपरेटरों में समेट दी जाती हैं जिन्हें फैलाया जा सकता है, और टेक्स्ट को [`Editor`](./editor.md) के सिंटैक्स रंगों में हाइलाइट किया जाता है। यह दो टेक्स्ट (`oldValue` और `newValue`) या एक unified diff की फ़ाइलें (`patch`: `git diff` का, किसी pull request का) दिखाता है, हर एक अपने हेडर के नीचे। यह बदलावों की समीक्षा के लिए बना है, जिनमें AI के सुझाए गए संपादन भी शामिल हैं: हर बदलाव पर ऐप की क्रियाएँ उसे रखती हैं या पलट देती हैं। केवल दिखने वाली पंक्तियाँ बनाई जाती हैं, इसलिए लंबी फ़ाइल भी छोटी फ़ाइल की तरह स्क्रॉल होती है।

`DiffView` व्यवहार को संभालता है और थीम के टोकन से बने अपने डिफ़ॉल्ट रूप के साथ आता है: थीम का `font-mono` 20pt की पंक्तियों में 13pt पर, पंक्ति संख्याएँ `muted-foreground` में, जोड़ी गई पंक्तियों पर हरा और हटाई गई पंक्तियों पर लाल टिंट, बदले हुए शब्दों पर गहरा टिंट, हर बदली पंक्ति के गटर के किनारे पर एक बार, और `muted` पर सेपरेटर। हर हिस्सा इन डिफ़ॉल्ट पर ऐप की स्टाइल लेता है (`classes` और `styles`)। Rust में इसे `nsh_base::diff_view()` से बनाते हैं, TSX में `nsh/base` से आने वाले `<DiffView>` से।

```rust tabs
use nsh_base::diff_view;
use nsh_core::prelude::*;

const OLD: &str = "fn total(prices: &[u32]) -> u32 {\n    prices.iter().sum()\n}\n";
const NEW: &str = "fn total(prices: &[u64]) -> u64 {\n    prices.iter().copied().sum()\n}\n";

fn review() -> impl IntoElement {
    diff_view().old_value(OLD).new_value(NEW).language("rust").flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DiffView } from "nsh/base";

const OLD = `fn total(prices: &[u32]) -> u32 {
    prices.iter().sum()
}
`;
const NEW = `fn total(prices: &[u64]) -> u64 {
    prices.iter().copied().sum()
}
`;

function App() {
  return <DiffView oldValue={OLD} newValue={NEW} language="rust" class="flex-1" />;
}

mount(App);
```

व्यू उस बॉक्स को भरता है जो ऐप उसे देता है (`flex-1`, एक ऊँचाई) और उसके भीतर स्क्रॉल होता है: पंक्तियों में लंबवत, और सबसे लंबी पंक्ति तक क्षैतिज, split व्यू के दोनों पक्ष साथ-साथ। `softWrap` के साथ लंबी पंक्तियाँ पक्ष की चौड़ाई पर रैप हो जाती हैं, और split पंक्ति अपने ऊँचे पक्ष जितनी ऊँची होती है, ताकि दोनों पक्ष संरेखित रहें।

<a id="two-texts-or-a-patch"></a>

## दो टेक्स्ट या एक पैच

- **दो टेक्स्ट**: `oldValue` और `newValue`। पंक्तियों की तुलना जैसी हैं वैसी ही होती है, इसलिए अंत में जोड़ा या हटाया गया line break एक बदलाव है, जैसा git दिखाता है।
- **एक पैच**: `patch`, एक या कई फ़ाइलों का unified diff (`git diff`, `git format-patch`, `diff -u`; rename, mode, नई, हटाई गई और बाइनरी फ़ाइलें, और उससे पहले एक commit message, जैसा git लिखता है वैसा पढ़ा जाता है)। व्यू उसके hunk की पंक्तियाँ दिखाता है, फ़ाइल की तरह क्रमांकित, हर hunk अपने हेडर (जिस फ़ंक्शन में वह है) के सेपरेटर के नीचे, और कई में से हर फ़ाइल अपने हेडर के नीचे ([पैच की फ़ाइलें](#files-of-a-patch))। `language` सेट न होने पर हर फ़ाइल का पाथ उसकी भाषा तय करता है।

```tsx
const PATCH = `diff --git a/src/total.rs b/src/total.rs
--- a/src/total.rs
+++ b/src/total.rs
@@ -10,3 +10,3 @@ impl Cart {
-    fn total(&self) -> u32 {
+    fn total(&self) -> u64 {
         self.prices.iter().sum()
     }
`;

<DiffView patch={PATCH} layout="unified" class="flex-1" />
```

`language` भाषा का नाम वैसे ही देता है जैसे `Editor` का: नाम, उपनाम, एक्सटेंशन या फ़ाइल का नाम (`"rust"`, `"tsx"`, `"main.go"`, `"Dockerfile"`)।

<a id="files-of-a-patch"></a>

## पैच की फ़ाइलें

कई फ़ाइलों का पैच हर फ़ाइल को एक हेडर पंक्ति के नीचे दिखाता है: डिफ़ॉल्ट रूप में उसका पाथ (rename होने पर `old → new`), जोड़ी और हटाई गई पंक्तियों की संख्या, और `▾`, और उस पर प्रेस करने से फ़ाइल अपने हेडर तक सिमट जाती है (`▸`) या फैल जाती है। `renderFileHeader` हेडर को ऐप के तरीके से बनाता है (और एक फ़ाइल के पैच के ऊपर भी एक दिखाता है), उसे फ़ाइल बताई जाती है (`DiffFile`): `index`, `path`, `oldPath` (जहाँ से rename या copy हुई), `status` (`"modified"`, `"added"`, `"deleted"`, `"renamed"`, `"copied"`), `binary` (पैच उसकी कोई पंक्ति नहीं दिखाता), `added`, `deleted`, `hunks`, `firstHunk` और `collapsed`। ऐप का हेडर ref के `toggleFile(path)` को कॉल करता है; `collapseFile` और `expandFile` स्थिति सेट करते हैं, और हर बदलाव `onFileToggle({ file })` से रिपोर्ट होता है। सिमटी हुई फ़ाइल तब तक सिमटी रहती है जब तक नए `patch` में वह मौजूद है।

बदलाव फ़ाइलों के पार क्रम से गिने जाते हैं: किसी फ़ाइल के बदलाव `firstHunk` से `firstHunk + hunks - 1` तक होते हैं, जिन्हें `goToHunk`, `renderHunkActions` और `hunks()` इस्तेमाल करते हैं (`DiffHunk` का `file` उसकी फ़ाइल का इंडेक्स है और उसकी पंक्तियाँ उसी फ़ाइल में गिनी जाती हैं), और `stats()` हर फ़ाइल के बदलाव जोड़ देता है। `goToHunk` पहले सिमटी हुई फ़ाइल को फैलाता है।

```tsx
let diff!: DiffViewRef;
const files = signal<DiffFile[]>([]);

<View class="flex-1 flex-row">
  <View class="w-48">
    <Each of={files()}>
      {(file) => (
        <Button onPress={() => diff.scrollToFile(file().path)} class="px-2 py-1">
          <Text class="text-sm">{file().path} +{file().added} −{file().deleted}</Text>
        </Button>
      )}
    </Each>
  </View>
  <DiffView
    ref={(r) => {
      diff = r;
      r.files().then((list) => files.set(list));
    }}
    patch={PULL_REQUEST}
    renderFileHeader={(file) => (
      <Button onPress={() => diff.toggleFile(file.path)} class="flex-1 flex-row items-center gap-2 bg-muted px-2">
        <Text>{file.collapsed ? "▸" : "▾"}</Text>
        <Text class="flex-1 text-sm font-medium">{file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}</Text>
        <Text class="text-xs text-muted-foreground">{file.binary ? "Binary" : file.status}</Text>
      </Button>
    )}
    class="flex-1"
  />
</View>
```

<a id="layout-and-inline-changes"></a>

## लेआउट और इनलाइन बदलाव

`layout` या तो `"split"` है (डिफ़ॉल्ट: साथ-साथ, हर हटाई गई पंक्ति उस जोड़ी गई पंक्ति के बगल में जो उससे सबसे ज़्यादा मिलती है) या `"unified"` (एक कॉलम, बदलाव की हटाई गई पंक्तियाँ जोड़ी गई पंक्तियों के ऊपर, दोनों पंक्ति संख्याओं के साथ)। `inline` तय करता है कि बदली हुई पंक्ति के भीतर क्या हाइलाइट होगा:

| `inline` | क्या हाइलाइट होता है |
|---|---|
| `"wordAlt"` (डिफ़ॉल्ट) | बदले हुए शब्द, एक अक्षर की दूरी पर हों तो जुड़े हुए, ताकि बदला हुआ वाक्यांश एक की तरह दिखे |
| `"word"` | हर बदला हुआ शब्द |
| `"char"` | हर बदला हुआ अक्षर |
| `"none"` | कुछ नहीं: केवल पंक्तियों के टिंट |

शब्द अक्षरों, अंकों और `_` के रन होते हैं; हर CJK अक्षर, kana और hangul अक्षरांश अपने आप में एक शब्द है, इसलिए वाक्य में बदला हुआ एक अक्षर केवल खुद को चिह्नित करता है। जो पंक्ति लगभग पूरी बदल गई हो वह केवल अपना टिंट दिखाती है।

`indicators` बदली हुई पंक्तियों को उनकी संख्याओं के बगल में चिह्नित करता है: `"bars"` (डिफ़ॉल्ट, गटर के किनारे पर बार), `"classic"` (टेक्स्ट से पहले `+` और `−`) या `"none"`। `background={false}` बदली हुई पंक्तियों को बिना टिंट के छोड़ देता है, और `lineNumbers={false}` संख्याएँ छिपा देता है।

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## समेटी गई पंक्तियाँ

हर बदलाव के आसपास `contextLines` अपरिवर्तित पंक्तियाँ दिखती हैं (डिफ़ॉल्ट 3); बदलावों के बीच की, और पहले बदलाव से पहले तथा आख़िरी के बाद की अपरिवर्तित पंक्तियाँ एक सेपरेटर में सिमट जाती हैं जो बताता है कि वह कितनी पंक्तियाँ छिपाए है। उस पर प्रेस करने से वे सब दिख जाती हैं। `expandAll` हर पंक्ति दिखाता है; ref के `expand`, `expandAll()` और `collapseAll()` ऐप से उन्हें दिखाते और समेटते हैं।

`renderSeparator` सेपरेटरों को ऐप के तरीके से बनाता है। उसे सेपरेटर मिलता है (`DiffSeparator`): `gap`, सिमटे हुए रन का इंडेक्स (पहले बदलाव से पहले 0, बदलावों `i - 1` और `i` के बीच `i`), `lines`, वह कितनी पंक्तियाँ छिपाता है, `first` और `last`, और पैच के लिए hunk का `header`। `expand(gap, direction, lines)` उसकी पंक्तियाँ `"all"` दिखाता है (डिफ़ॉल्ट), या `lines` (डिफ़ॉल्ट 20) `"up"`, सेपरेटर के नीचे वाले बदलाव के ठीक ऊपर, या `"down"`, ऊपर वाले बदलाव के ठीक नीचे। पहला सेपरेटर ऊपर की ओर और आख़िरी नीचे की ओर फैलता है।

```tsx
let diff!: DiffViewRef;

<DiffView
  ref={diff}
  oldValue={before()}
  newValue={after()}
  language="ts"
  renderSeparator={(sep) => (
    <View class="flex-1 flex-row items-center gap-1 bg-muted px-2">
      <If when={!sep.first}>
        <Button onPress={() => diff.expand(sep.gap, "down")} class="px-1"><Text>↓</Text></Button>
      </If>
      <If when={!sep.last}>
        <Button onPress={() => diff.expand(sep.gap, "up")} class="px-1"><Text>↑</Text></Button>
      </If>
      <Button onPress={() => diff.expand(sep.gap)} class="flex-1">
        <Text class="text-xs text-muted-foreground">{sep.header ?? `${sep.lines} unchanged lines`}</Text>
      </Button>
    </View>
  )}
  class="flex-1"
/>
```

<a id="keeping-and-reverting-changes"></a>

## बदलाव रखना और पलटना

`renderHunkActions` दिखने वाले हर बदलाव के ऊपरी दाएँ कोने में ऐप की क्रियाएँ रखता है, उन्हें बदलाव बताया जाता है (`DiffHunk`: `index`, `oldStart`, `oldLines`, `newStart`, `newLines`, पंक्तियाँ 0 से, और `file`, पैच में उसकी फ़ाइल का इंडेक्स)। वे ref को कॉल करती हैं: `revertHunk(index)` बदलाव की पुरानी पंक्तियाँ नए टेक्स्ट में वापस रख देता है, `acceptHunk(index)` उसकी नई पंक्तियों को पुराना टेक्स्ट बना देता है। व्यू नतीजा तुरंत दिखाता है और दोनों टेक्स्ट `onChange({ change })` (`{ oldValue, newValue }`) से रिपोर्ट करता है, जिन्हें ऐप props के रूप में सेट करता है। AI के संपादन को एक-एक बदलाव करके रखना या पलटना यह है:

```tsx
import { signal, Text, View } from "nsh";
import { Button, DiffView, type DiffViewRef } from "nsh/base";

function Proposal(props: { file: string; current: string; proposed: string; onApply: (text: string) => void }) {
  let diff!: DiffViewRef;
  const current = signal(props.current);
  const proposed = signal(props.proposed);
  return (
    <View class="flex-1">
      <DiffView
        ref={diff}
        oldValue={current()}
        newValue={proposed()}
        language={props.file}
        onChange={({ change: { oldValue, newValue } }) => {
          current.set(oldValue);
          proposed.set(newValue);
          props.onApply(oldValue);
        }}
        renderHunkActions={(hunk) => (
          <View class="flex-row gap-1">
            <Button onPress={() => diff.revertHunk(hunk.index)} class="rounded bg-background px-2 py-0.5 border border-border">
              <Text class="text-xs">Revert</Text>
            </Button>
            <Button onPress={() => diff.acceptHunk(hunk.index)} class="rounded bg-primary px-2 py-0.5">
              <Text class="text-xs text-primary-foreground">Keep</Text>
            </Button>
          </View>
        )}
        class="flex-1"
      />
    </View>
  );
}
```

यहाँ पुराना टेक्स्ट वह फ़ाइल है जैसी वह है: बदलाव रखने का मतलब उसे फ़ाइल पर लागू करना है (`onApply`), उसे पलटना उसे प्रस्ताव से हटा देता है। `patch` दिखाने वाला व्यू फ़ाइलों के अंश दिखाता है, और उसके बदलाव जैसे हैं वैसे ही रहते हैं।

## Methods

`ref={diff}` व्यू के मेथड देता है (`DiffViewRef`)। जो मेथड मान लौटाते हैं (`hunks()`, `stats()`) वे JS में उसका `Promise` लौटाते हैं, इसलिए उन्हें `await` करें: `const changes = await diff.hunks()`। स्क्रीन पर दिखाई जाने वाली संख्याओं के लिए `onStatsChange` उन्हें बदलते ही रिपोर्ट करता है। ऐसा बदलाव, सेपरेटर या फ़ाइल जो diff में नहीं है, किसी मेथड को देने पर कुछ नहीं बदलता और मेथड और मान का नाम बताती चेतावनी लॉग होती है।

| मेथड | विवरण |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`: बदलाव, क्रम से। |
| `stats()` | `Promise<DiffStats>`: `{ added, deleted, hunks }`, जोड़ी और हटाई गई पंक्तियाँ और बदलावों की संख्या। |
| `goToHunk(index)` | बदलाव `index` को व्यू में स्क्रॉल करता है, उसकी पहली पंक्ति सबसे ऊपर। |
| `revertHunk(index)` | बदलाव `index` की पुरानी पंक्तियाँ नए टेक्स्ट में वापस रखता है और टेक्स्ट रिपोर्ट करता है (`onChange`)। |
| `acceptHunk(index)` | बदलाव `index` की नई पंक्तियों को पुराना टेक्स्ट बनाता है और टेक्स्ट रिपोर्ट करता है (`onChange`)। |
| `expand(gap, direction?, lines?)` | सेपरेटर `gap` जो पंक्तियाँ छिपाता है उन्हें दिखाता है: `"all"` (डिफ़ॉल्ट), या `lines` (डिफ़ॉल्ट 20) `"up"` या `"down"`। |
| `expandAll()` | हर अपरिवर्तित पंक्ति दिखाता है। |
| `collapseAll()` | अपरिवर्तित पंक्तियों को फिर से समेट देता है। |
| `nextHunk()` | `Promise<number \| null>`: अगले बदलाव को ऊपर तक स्क्रॉल करता है और उसका इंडेक्स देता है (आख़िरी के बाद, पहला)। |
| `previousHunk()` | `Promise<number \| null>`: पिछले बदलाव को ऊपर तक स्क्रॉल करता है और उसका इंडेक्स देता है (पहले से पहले, आख़िरी)। |
| `currentHunk()` | `Promise<number \| null>`: जिस बदलाव पर आख़िरी बार गए और व्यू वहीं टिका है वह, वरना व्यू के ऊपर वाला या व्यू में दिखने वाला पहला। |
| `selectedLines()` | `Promise<DiffLineRange \| null>`: पंक्ति संख्याओं पर चुनी गई पंक्तियाँ। |
| `setSelectedLines(range)` | किसी पक्ष की पंक्तियाँ चुनता है (`null`: कोई नहीं), `onLineSelectionChange` के बिना। |
| `selectedText()` | `Promise<string>`: चुनी गई पंक्तियों का टेक्स्ट। |
| `files()` | `Promise<DiffFile[]>`: पैच की फ़ाइलें, क्रम से, उनकी संख्याओं के साथ (दो टेक्स्ट के लिए कोई नहीं)। |
| `scrollToFile(path)` | `path` पर मौजूद फ़ाइल के हेडर को ऊपर तक स्क्रॉल करता है। |
| `collapseFile(path)` | `path` पर मौजूद फ़ाइल का केवल हेडर दिखाता है। |
| `expandFile(path)` | `path` पर मौजूद फ़ाइल की पंक्तियाँ फिर दिखाता है। |
| `toggleFile(path)` | `path` पर मौजूद फ़ाइल को समेटता है, या समेटी हुई हो तो फैलाता है। |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`: हर बदलाव पंक्तियों में कहाँ है, क्रम से ([ओवरव्यू रूलर](#an-overview-ruler))। |
| `scrollOffset()` | `Promise<Point>`: पंक्तियाँ कितनी स्क्रॉल हुई हैं (`x` 0 है)। |
| `setScrollOffset(offset)` | पंक्तियों को तुरंत `offset.y` तक स्क्रॉल करता है, जहाँ तक वे जाती हैं, जैसे थंब उस पॉइंटर का पीछा करता है जो उसे खींचता है। |

`nextHunk()` और `previousHunk()` उस बदलाव से आगे बढ़ते हैं जिस पर वे गए थे, जब तक व्यू वहीं रहता है, और नहीं तो व्यू के ऊपर से, इसलिए अंत के पास का बदलाव जो ऊपर तक स्क्रॉल नहीं हो सकता, फिर भी गिना जाता है। `onStatsChange` की संख्याओं के साथ अगला और पिछला बदलाव बटन:

```tsx
let diff!: DiffViewRef;
const stats = signal<DiffStats>({ added: 0, deleted: 0, hunks: 0 });

<View class="flex-row items-center gap-2 p-2">
  <Text class="text-sm text-green-600">+{stats().added}</Text>
  <Text class="text-sm text-red-600">−{stats().deleted}</Text>
  <Text class="text-sm text-muted-foreground">{stats().hunks} changes</Text>
  <Button onPress={() => diff.previousHunk()}><Text>Previous</Text></Button>
  <Button onPress={() => diff.nextHunk()}><Text>Next</Text></Button>
</View>
<DiffView ref={diff} oldValue={before()} newValue={after()} onStatsChange={(e) => stats.set(e.stats)} class="flex-1" />
```

<a id="an-overview-ruler"></a>

## ओवरव्यू रूलर

`onScroll({ offset, contentSize, size })` रिपोर्ट करता है कि पंक्तियाँ कहाँ हैं, [`Scroll`](./scroll.md) की कुंजियों के साथ: `offset.y`, कितनी स्क्रॉल हुई हैं (पंक्तियाँ लंबवत स्क्रॉल होती हैं, व्यू जितनी चौड़ी, और पक्ष अपने आप क्षैतिज: `offset.x` 0 है), `contentSize`, सभी पंक्तियों का कुल आकार, और `size`, व्यूपोर्ट का। यह व्यू का लेआउट होने पर एक बार और उनमें से किसी के बदलने पर फिर ट्रिगर होता है: पंक्तियों के स्क्रॉल होने पर, व्यू का आकार बदलने पर, और पंक्तियों की ऊँचाई बदलने पर (अन्य टेक्स्ट, `layout`, `softWrap`, फैली या सिमटी फ़ाइल या सेपरेटर, लेआउट हुआ annotation)। `hunkBounds()` बताता है कि हर बदलाव पंक्तियों में कहाँ है (`DiffHunkBounds`: `{ index, bounds }`, `bounds` उसकी पहली पंक्ति के ऊपर से आख़िरी के नीचे तक, उनके नीचे annotation के साथ, पूरे व्यू में), यानी वे बदलाव जो दिखते हैं: सिमटी फ़ाइल के बदलावों की कोई पंक्ति नहीं होती। `onHunkBoundsChange({ hunkBounds })` व्यू का लेआउट होने पर वही सूची एक बार और फिर तब देता है जब कोई बदलाव खिसके या आकार बदले, तब भी जब पंक्तियों की ऊँचाई वही रहे (एक बदली पंक्ति का दूसरी बन जाना): रूलर अपने निशान इसी से बनाता है, उन्हें `onScroll` पर पढ़ने के बजाय। `scrollOffset()` पढ़ता है कि पंक्तियाँ कितनी स्क्रॉल हुई हैं, और `setScrollOffset({ x, y })` पंक्तियों को तुरंत `y` तक स्क्रॉल करता है, ताकि खींचा गया थंब उसी फ़्रेम में पॉइंटर का पीछा करे।

ये सब मिलकर व्यू के बगल में एक ओवरव्यू रूलर बनाते हैं, जैसा कोड एडिटरों में होता है: हर बदलाव के लिए एक निशान, दिखने वाली पंक्तियों पर एक थंब, और एक प्रेस या ड्रैग जो वहाँ स्क्रॉल करता है। यहाँ रूलर व्यू जितना ऊँचा है:

```rust tabs
use nsh_base::{DiffHunkBounds, DiffView, DiffViewApi, DiffViewEvent, diff_view, theme};
use nsh_core::prelude::*;

fn review(old: SharedString, new: SharedString) -> impl IntoElement {
    let diff = component_ref::<DiffView>();
    let ruler = element_ref();
    let ruler_top = stored(px(0.0));
    // How far the rows are scrolled, their height and the viewport's.
    let rows = signal((px(0.0), px(0.0), px(0.0)));
    let marks = signal(Vec::<DiffHunkBounds>::new());
    // Points of the rows per point of the ruler.
    let scale = move || {
        let (_, height, view) = rows.get();
        height.max(px(1.0)) / view.max(px(1.0))
    };
    // The thumb's middle at the pointer.
    let follow = move |page_y: Points| {
        let view = rows.get_untracked().2;
        let y = (page_y - ruler_top.get()) * scale() - view / 2.0;
        if let Some(api) = diff.api::<DiffViewApi>() {
            api.set_scroll_offset(point(px(0.0), y));
        }
    };
    view()
        .flex_1()
        .flex_row()
        .child(
            diff_view()
                .old_value(old)
                .new_value(new)
                .on_scroll(move |e: &DiffViewEvent| {
                    if let DiffViewEvent::Scroll(offset, content, size) = e {
                        rows.set((offset.y, content.height, size.height));
                    }
                })
                .on_hunk_bounds_change(move |list: &Vec<DiffHunkBounds>| marks.set(list.clone()))
                .component_ref(&diff)
                .flex_1(),
        )
        .child(
            view()
                .element_ref(&ruler)
                .w(px(12.0))
                .bg(move || theme().muted)
                .claim_touches(TouchClaim::on_start())
                .on_responder_grant(move |e: &ResponderEvent| {
                    let y = e.page.y;
                    spawn(async move {
                        ruler_top.replace(ruler.measure().await.map_or(px(0.0), |m| m.page.y));
                        follow(y);
                    });
                })
                .on_responder_move(move |e: &ResponderEvent| follow(e.page.y))
                .child(each(
                    marks,
                    |mark: &DiffHunkBounds| mark.index,
                    move |mark, _| {
                        view()
                            .absolute()
                            .left(px(0.0))
                            .right(px(0.0))
                            .bg(rgb(0xf59e0b))
                            .top(move || mark.get().bounds.origin.y / scale())
                            .h(move || (mark.get().bounds.size.height / scale()).max(px(2.0)))
                    },
                ))
                .child(
                    view()
                        .absolute()
                        .left(px(0.0))
                        .right(px(0.0))
                        .bg(move || theme().foreground.opacity(0.2))
                        .top(move || rows.get().0 / scale())
                        .h(move || rows.get().2 / scale()),
                ),
        )
}
```

```tsx tabs
import { Each, signal, View, type ViewRef } from "nsh";
import { DiffView, type DiffHunkBounds, type DiffViewRef } from "nsh/base";

let diff!: DiffViewRef;
let ruler!: ViewRef;
let rulerTop = 0;
const rows = signal({ y: 0, height: 0, view: 0 });
const marks = signal<DiffHunkBounds[]>([]);
// Points of the rows per point of the ruler.
const scale = () => Math.max(rows().height, 1) / Math.max(rows().view, 1);
// The thumb's middle at the pointer.
const follow = (pageY: number) => diff.setScrollOffset({ x: 0, y: (pageY - rulerTop) * scale() - rows().view / 2 });

<View class="flex-1 flex-row">
  <DiffView
    ref={diff}
    oldValue={before()}
    newValue={after()}
    onScroll={({ offset, contentSize, size }) => rows.set({ y: offset.y, height: contentSize.height, view: size.height })}
    onHunkBoundsChange={({ hunkBounds }) => marks.set(hunkBounds)}
    class="flex-1"
  />
  <View
    ref={ruler}
    class="w-3 bg-muted"
    onStartShouldSetResponder={() => true}
    onResponderGrant={async (e) => {
      const y = e.pageY;
      rulerTop = (await ruler.measure())?.pagePosition.y ?? 0;
      follow(y);
    }}
    onResponderMove={(e) => follow(e.pageY)}
  >
    <Each of={marks()}>
      {(mark) => (
        <View
          class="absolute inset-x-0 bg-amber-500"
          style={{ top: mark().bounds.origin.y / scale(), height: Math.max(mark().bounds.size.height / scale(), 2) }}
        />
      )}
    </Each>
    <View class="absolute inset-x-0 bg-foreground/20" style={{ top: rows().y / scale(), height: rows().view / scale() }} />
  </View>
</View>
```

निशान का `index` `hunks()` में बदलाव का होता है, जिसके `oldLines` और `newLines` जोड़े गए बदलाव (कोई पुरानी पंक्ति नहीं) को हटाए गए बदलाव (कोई नई पंक्ति नहीं) से अलग बताते हैं, ताकि निशान को रंगा जा सके।

<a id="review-comments"></a>

## रिव्यू कमेंट

पंक्ति संख्याएँ किसी पक्ष की पंक्तियाँ चुनती हैं: प्रेस एक को चुनता है, Shift-प्रेस चुनाव को वहाँ तक बढ़ाता है, और संख्याओं पर माउस खींचने से वे सब चुनी जाती हैं जिन पर वह जाता है। `onLineSelectionChange` पंक्तियों को `range` के रूप में रिपोर्ट करता है (`DiffLineRange`: `{ side, start, end }`, पंक्तियाँ 0 से, कोई नहीं के लिए `null`), और संख्या का प्रेस `onLineNumberPress({ line })` (`{ side, line }`) भी रिपोर्ट करता है। ref चुनाव पढ़ता है (`selectedLines()`, `selectedText()`) और उसे सेट करता है।

`annotations` ऐप की सामग्री को पंक्तियों के नीचे रखता है: हर `{ id, side, line }` को `renderAnnotation` उसकी पंक्ति के पक्ष की चौड़ाई में बनाता है (unified में पूरा व्यू), उतना ऊँचा जितना वह लेआउट होता है, और वह तब तक दिखता है जब तक उसकी पंक्ति दिखती है। `renderAddAnnotation` एक जोड़ने के लिए ऐप का नियंत्रण है, उस पंक्ति के गटर के दाएँ जिस पर पॉइंटर है और आख़िरी चुनी गई पंक्ति के; उसे चुनी गई पंक्तियाँ मिलती हैं जब उसकी पंक्ति उनमें से एक हो, वरना वही पंक्ति।

```tsx
type Comment = { id: string; side: "old" | "new"; line: number; text: string };
const comments = signal<Comment[]>([]);
const drafting = signal<DiffLineRange | null>(null);

<DiffView
  oldValue={before()}
  newValue={after()}
  annotations={comments().map(({ id, side, line }) => ({ id, side, line }))}
  renderAnnotation={(a) => (
    <View class="m-2 rounded-md border border-border bg-card p-2">
      <Text class="text-sm">{comments().find((c) => c.id === a.id)?.text}</Text>
    </View>
  )}
  renderAddAnnotation={(range) => (
    <Button onPress={() => drafting.set(range)} class="size-4 items-center justify-center rounded bg-primary">
      <Text class="text-xs text-primary-foreground">+</Text>
    </Button>
  )}
  class="flex-1"
/>
```
<a id="styling-the-parts"></a>

## भागों की स्टाइलिंग

`class` और `style` view के box को स्टाइल करते हैं। `classes` भाग के अनुसार Tailwind क्लासेस लेता है और `styles` भाग के अनुसार इनलाइन स्टाइल; किसी भाग की क्लासेस उसकी अपनी डिफ़ॉल्ट स्टाइल के बाद आती हैं, इसलिए वही प्रभावी होती हैं, और उसके `styles` उसकी क्लासेस पर भारी पड़ते हैं। फ़ॉन्ट `fontFamily`, `fontSize` और `lineHeight` से सेट होता है।

```tsx
<DiffView
  oldValue={before()}
  newValue={after()}
  language="py"
  fontSize={12}
  lineHeight={18}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineAdded: "bg-blue-500/10",
    wordAdded: "bg-blue-500/30",
    indicatorAdded: "bg-blue-500",
    separator: "bg-transparent",
  }}
/>
```

| भाग | यह क्या है | डिफ़ॉल्ट |
|---|---|---|
| `side` | हर साइड (split) या एकमात्र कॉलम (unified) | साइड्स के बीच एक `border` लाइन |
| `gutter` | किसी साइड के लाइन नंबर और इंडिकेटर | |
| `lineNumber` | हर लाइन नंबर | दाईं ओर संरेखित, `muted-foreground` |
| `lineNumberAdded` | जोड़ी गई लाइनों के नंबर, `lineNumber` के बाद | |
| `lineNumberDeleted` | हटाई गई लाइनों के नंबर, `lineNumber` के बाद | |
| `content` | किसी साइड का टेक्स्ट, उसके gutter के बगल में | टेक्स्ट के पहले और बाद में 8pt |
| `line` | किसी साइड की हर रो | |
| `lineAdded` | जोड़ी गई लाइनों की रो, `line` के बाद | हल्का हरा रंग |
| `lineDeleted` | हटाई गई लाइनों की रो, `line` के बाद | हल्का लाल रंग |
| `filler` | split रो का खाली आधा हिस्सा, उस लाइन के बगल में जो दूसरी साइड में नहीं है | हल्का `muted` फ़िल |
| `wordAdded` | जोड़ी गई लाइन के भीतर बदले गए शब्द | गहरा हरा |
| `wordDeleted` | हटाई गई लाइन के भीतर बदले गए शब्द | गहरा लाल |
| `indicatorAdded` | जोड़ी गई लाइन का बार (`"bars"`) या `+` (`"classic"`) | हरा, 3pt चौड़ा |
| `indicatorDeleted` | हटाई गई लाइन का बार या `−` | लाल, 3pt चौड़ा |
| `separator` | सिमटी हुई लाइनों का विभाजक, या patch का hunk हेडर | `⋯` और गिनती `muted` पर |
| `hunkActions` | किसी बदलाव पर ऐप की actions का box | बदलाव के ऊपरी दाएँ कोने पर |
| `lineSelected` | अपनी साइड की चयनित लाइनों की रो के ऊपर | थीम का selection रंग (जैसे `Editor` के selections) |
| `annotation` | annotation का box, उसकी लाइन के नीचे | उसकी लाइन की साइड में पूरी चौड़ाई में |
| `addAnnotation` | add control का box, gutter जितना चौड़ा और एक लाइन जितना ऊँचा | उसके दाईं ओर control |
| `fileHeader` | patch की किसी फ़ाइल का हेडर | पाथ और गिनती `secondary` पर, नीचे एक `border` लाइन |

## Props

| Prop | Rust | प्रकार | डिफ़ॉल्ट | विवरण |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | पुराना टेक्स्ट। |
| `newValue` | `.new_value(..)` | `string` | | नया टेक्स्ट। |
| `patch` | `.patch(..)` | `string` | | एक या कई फ़ाइलों का unified diff, जो तब दिखता है जब `oldValue` और `newValue` सेट नहीं होते। |
| `language` | `.language(..)` | `string` | सादा टेक्स्ट (patch में: हर फ़ाइल की भाषा) | किसी भाषा का नाम, alias, एक्सटेंशन या फ़ाइल का नाम। |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | अगल-बगल या एक कॉलम में। |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | बदली हुई लाइनों के भीतर क्या हाइलाइट होता है। |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | बदली हुई लाइनों को उनके नंबरों के बगल में कैसे चिह्नित किया जाता है। |
| `contextLines` | `.context_lines(..)` | `number` | `3` | हर बदलाव के आसपास दिखने वाली अपरिवर्तित लाइनें। |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | हर अपरिवर्तित लाइन दिखती है। |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | लाइन नंबर। |
| `background` | `.background(..)` | `boolean` | `true` | बदली हुई लाइनों पर रंग चढ़ाया जाता है। |
| `fontFamily` | `.font_family(..)` | `string` | थीम का `font-mono` | टेक्स्ट का फ़ॉन्ट। |
| `fontSize` | `.font_size(..)` | `number` | `13` | फ़ॉन्ट का आकार, points में। |
| `lineHeight` | `.line_height(..)` | `number` | `20` | एक रो की ऊँचाई, points में। |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | सिमटी हुई लाइनों के विभाजक बनाता है। |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | हर बदलाव पर ऐप की actions। |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | लंबी लाइनें साइड की चौड़ाई पर रैप होती हैं। |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | लाइनों के नीचे ऐप का कंटेंट: `{ id, side, line }`। |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | किसी annotation को उसकी लाइन के नीचे बनाता है। |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | annotation जोड़ने के लिए ऐप का control, जो hover की गई लाइन और आख़िरी चयनित लाइन के बगल में दिखता है। |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | patch की हर फ़ाइल का हेडर बनाता है, जो एक रो जितना ऊँचा होता है। |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | भाग के अनुसार Tailwind क्लासेस। |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | भाग के अनुसार इनलाइन स्टाइल, जो क्लासेस पर प्रभावी होती हैं। |
| `class`, `style` | style methods | `string`, `StyleProp<ViewStyle>` | | view का box। |

## Events

| Event | Rust | विवरण |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | कोई बदलाव रखा या वापस किया गया: `{ change }`, अब के टेक्स्ट (`{ oldValue, newValue }`)। |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | किसी लाइन नंबर को दबाया गया: `{ line }`, एक `{ side, line }`। |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | चयनित लाइनें बदलीं: `{ range }`, एक `{ side, start, end }` या `null`। |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | गिनती बदली: `{ stats }`, एक `{ added, deleted, hunks }`। यह view बनने पर एक बार चलता है और हर बार तब फिर से, जब टेक्स्ट का diff दूसरी गिनती पर पहुँचता है, ताकि "+8 −8 · 5 changes" जैसी लाइन दिखाई जा सके। |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | patch की कोई फ़ाइल collapse या expand की गई (उसके हेडर से, या ref से): `{ file }`, अब का `DiffFile`। |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | रो स्क्रोल हुईं, या उनका या viewport का आकार बदला: `{ offset, contentSize, size }`, जैसा किसी `Scroll` का होता है (Rust में `DiffViewEvent::Scroll(offset, content_size, size)`)। यह view का layout होने पर एक बार चलता है और इनमें से किसी के बदलने पर फिर से। |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | रो में बदलाव कहाँ हैं, यह बदला: `{ hunkBounds }`, वह सूची जो `hunkBounds()` देता है। यह view का layout होने पर एक बार चलता है और हर बार तब फिर से, जब कोई बदलाव खिसकता है या उसका आकार बदलता है, चाहे रो की ऊँचाई वही रहे या नहीं, ताकि overview ruler के निशान बनाए जा सकें। |

<a id="related"></a>

## संबंधित

- [Editor](./editor.md): वह कोड एडिटर जिसके सिंटैक्स रंग और भाषाएँ `DiffView` उपयोग करता है।
- [TextView](./text-view.md): Markdown और HTML के दस्तावेज़, रिव्यू के आसपास के टेक्स्ट के लिए।
- [`nsh/base`](../modules/nsh-base.md): अन्य बेस कंपोनेंट।
