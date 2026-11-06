---
title: "RichEditor"
description: "nsh/base 的富文字編輯器:文件由應用程式的 schema 定義,支援 commands、plugins、history、keymaps、input rules 及 Markdown,架構參考 ProseMirror,狀態則以 Rust 管理。"
group: base
demo: el-rich-editor
source_hash: 7ce7527a59594417
---


# RichEditor

`RichEditor` 是仿照 ProseMirror 架構而建的富文字編輯器。App 以 schema 定義文件由什麼組成（段落、標題、清單、提及，以及所需的任何 node 和 mark 類型），編輯器則確保每份文件都符合該 schema。變更以 step 表示，並組成 transaction，因此可以復原、對應位置，並以 JSON 傳送；行為來自 plugin（歷史記錄、keymap、input rule、Markdown 快捷鍵，以及 app 自己的 plugin）；指令是 toolbar 可以執行及查詢的值。編輯器的狀態、指令和 plugin 都在 Rust 中運行：輸入、按鍵綁定和 input rule 從不等待 JS，app 需要時才以 JSON 讀取狀態。

編輯器分為兩部分：session（`createRichEditor`）擁有狀態，並由 app 的程式碼驅動；視圖（`<RichEditor editor={…} />`）以原生方式渲染 session，並將平台的輸入轉換為 transaction。多個視圖可以顯示同一個 session。

編輯器的核心是 Marijn Haverbeke 的 [ProseMirror](https://prosemirror.net) 的 Rust 移植版，其擴充層則依循 [Tiptap](https://tiptap.dev)：資料結構、指令和命名都沿用下來，你對它們的認識也同樣適用。兩者均採用 MIT 授權，移植自它們的部分適用其授權條款。

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

沒有 `schema` 時，編輯器使用 starter schema（`starterSchema()`）；沒有 `plugins` 時，編輯器會得到 starter kit（`starterKit()`：starter 的 input rule 和按鍵綁定、基本按鍵綁定及歷史記錄）。空的 `plugins` 陣列會建立完全沒有 plugin 的編輯器。

<a id="styling"></a>

## 樣式

編輯器以 app 的外觀繪製文件：`classes` 和 `styles` 為其各個部分設定樣式（`root`、`content`、`caret`、`selection`、`placeholder`、`composition`、`selectedNode`、`listMarker`，表格則有 `selectedCell`、`tableGrip`、`tableResizeHandle`、`tableDropIndicator`），並按類型為 node 和 mark 設定樣式（`nodes: { heading: "text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`）。在 node spec 中將 `extra.listMarker` 設為 `"bullet"` 或 `"ordered"` 的清單（starter schema 的清單），其項目會在 `listMarker` 部分顯示標記：按深度顯示 `•`、`◦`、`▪`，或從清單的 `start` 起計的數字，標記置於項目之前，位於清單的縮排內（清單上的 `pl-6`，如同瀏覽器縮排 `ul`）。

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

`content` 部分是編輯器捲動視圖內文件的方框：其 padding（`content: "px-6 py-5"`）是文字四周的空間，捲軸則沿編輯器自身的邊緣顯示。拖曳選取超出編輯器頂部或底部時，文件會隨之捲動，指標越遠，速度越快。

<a id="bubble-menu"></a>

### 氣泡選單

`bubbleMenu` 是 Tiptap 的 bubble menu：app 的內容顯示在選取範圍旁邊，預設在上方（`bubbleMenuPlacement`，空間不足時翻到另一側），距離 `bubbleMenuOffset` points（8），並位於隨文字捲動的 overlay 中。App 在需要顯示時才傳入它，並根據 session 的狀態決定：

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

連結選單以 `chain([extendMarkRange("link"), command("setLink", { href })])` 編輯游標所在的連結，並在同一個 `extendMarkRange` 之後以 `command("unsetLink")` 移除連結。

<a id="schemas"></a>

## Schema

`defineSchema(spec)` 讀取 ProseMirror 格式的 schema，若有錯誤會拋出並說明問題所在。Node 類型指明其 `content`（content expression：`"inline*"`、`"paragraph+"`、`"(heading | paragraph) block*"`）、其 `group`、它們是 `inline` 還是 `atom`、允許的 `marks`，以及帶有預設值和驗證的 `attrs`（`"string"`、`"number"`、`"boolean"`）。第一個 block 類型是預設類型：Enter 建立的是它，填補必要內容的也是它。Spec 不認識的鍵會保留為該類型的額外資料，供建基於編輯器的框架使用。

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

`RichSchema` 負責讀寫文件：`parse(content, format?)`（預設為純文字，亦可用 `"markdown"` 或 JSON）、`parseMarkdown(markdown)`、`serialize(doc, format?)`（預設為 Markdown，亦可用 `"text"`、`"json"`）和 `check(doc)`，後者返回已填入屬性預設值的文件。`nodes`、`marks` 和 `topNode` 指明其類型。Markdown 對應到 starter schema 的名稱（`paragraph`、`heading`、`blockquote`、`codeBlock`、`bulletList`、`orderedList`、`listItem`、`bold`、`italic`、`code`、`link`、`strike`）。

<a id="commands"></a>

## 指令

指令是一個值：`toggleMark("bold")` 建立一個物件，app 可以保存它、綁定到按鍵，並傳給編輯器。`editor.run(command)` 執行指令並返回是否已套用；`editor.can(command)` 只查詢而不作任何更改，toolbar 正是以此啟用或停用按鈕。`editor.isActive(name, attrs?)` 告知某個 mark 或 node 在選取範圍是否生效（`isActive("heading", { level: 2 })`）。

| 指令 | 作用 |
| --- | --- |
| `toggleMark(name, attrs?)` | 為選取範圍加上 mark，若已存在則移除；在游標處則作用於接著輸入的文字 |
| `setMark(name, attrs?)` / `unsetMark(name)` | 加上或移除 mark |
| `setBlockType(name, attrs?)` | 將選取的 textblock 變為某類型（`setBlockType("heading", { level: 2 })`） |
| `wrapIn(name, attrs?)` / `lift()` | 將選取的 block 包進 node（例如引用）／將它們從父節點中提出 |
| `wrapInList(name, attrs?)` | 將選取的 block 包進清單 |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | 拆分、縮排或取消縮排清單項目 |
| `undo()` / `redo()` | 復原或重做變更（配合 `history()`） |
| `selectAll()`、`setTextSelection(anchor, head?)`、`setNodeSelection(pos)` | 選取 |
| `insertText(text)`、`insertContent(content, format?)` | 在選取範圍上插入文字或內容 |
| `setNodeAttribute(pos, attr, value)` | 設定某個位置上 node 的屬性，作為一次可復原的變更 |
| `command(name)` | 以名稱表示的無參數指令：`"splitBlock"`、`"joinBackward"`、`"exitCode"`、`"newlineInCode"`、`"selectParentNode"`、… |
| `chain(commands)` | 將多個指令依次作為一個 transaction 執行（一個復原步驟）；只有全部指令都成功才算套用 |
| `first(commands)` | 執行第一個可套用的指令 |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## Session

| 成員 | 說明 |
| --- | --- |
| `state`、`doc`、`selection` | 以 JSON 表示的狀態、文件和選取範圍，讀取時才生成 |
| `revision` | 狀態已套用的 transaction 數目 |
| `isEmpty`、`undoDepth`、`redoDepth`、`composing` | UI 顯示的編輯器資訊 |
| `setContent(content, format?)` | 取代文件，作為一次可復原的變更 |
| `insertContent(content, format?)` | 在選取範圍上插入內容 |
| `getJSON()`、`getMarkdown()`、`getText()`、`textBetween(from?, to?, separator?)` | 以某種格式表示的文件 |
| `dispatch(tr)` | 套用以 JSON 給出的 transaction（其 step 針對目前的文件） |
| `on(event, listener)` | 以每個 `event` 的 payload 呼叫 `listener`，在 JS 的下一輪執行：`revision`（`{ revision }`，每次變更後觸發，不論來源）、`update`、`selectionUpdate`、`transaction`、`focus`、`blur`、`delete`。返回一個用來停止監聽的函式；在元件渲染期間加入的 listener 會隨該元件一併停止 |
| `focus()`、`blur()` | 將鍵盤焦點移到或移離顯示該編輯器的視圖 |

位置的計算方式與 ProseMirror 相同：文字按 UTF-16 code unit 計算，leaf node 計一，有內容的 node 則計其兩個邊界。任何需要在編輯後仍然保留的東西，都應在 node 的屬性或 mark 中保存 id。位置查詢（`resolve(pos)`、`nodeAt(pos)`、`coordsAtPos(pos)`、`findParentNode(name, pos)` 等）遇到文件以外的位置（`0` 至 `doc.content.size`）會拋出 `RangeError`，一如 ProseMirror 的 `resolve`；而在該處沒有內容時則回應 `null`（`nodeAt` 表示在 node 末端，`coordsAtPos` 表示沒有視圖顯示該編輯器）。`run` 和 `can` 遇到編輯器不認識的指令、node 或 mark 類型時，會拋出 `TypeError`。

<a id="taking-over-transactions"></a>

### 接管 transaction

`editor.dispatchTransaction = (tr) => { … }` 讓 app 自行提交每個 transaction：handler 會以 JSON 取得每個 transaction，並以 `editor.applyTransaction(tr)` 提交，或將它捨棄。協作、記錄，以及必須通過 app 檢查的 transaction 都會用到這個做法；`null` 則把提交的工作交還編輯器。Handler 在 JS 的下一輪才得知輸入，文件則在 handler 提交時才會變更。

<a id="extensions"></a>

## Extension

Extension 沿用 Tiptap 的設計：每個 extension 會一併帶來其 node 或 mark 類型、按鍵綁定、input rule 和 paste rule、plugin 及具名指令，而由 extension 組成的編輯器會從它們取得其 schema、keymap、rule 和指令表。內建的 extension 是與 Tiptap 同名的 class，可以直接使用，也可以加以設定：

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

`StarterKit` 帶來 `Document`、`Paragraph`、text node、`Heading`、`Blockquote`、`BulletList`、`OrderedList`、`ListItem`、`TaskList`、`TaskItem`、`CodeBlock`、`HardBreak`、`HorizontalRule`、`RichImage`（Tiptap 的 `Image`）、`Bold`、`Italic`、`Strike`、`Code`、`Underline`、`RichLink`（Tiptap 的 `Link`）、`Highlight`、`Subscript`、`Superscript`、`RichTextStyle`（Tiptap 的 `TextStyle`）、`TextAlign`、`History`、`TrailingNode`、`Typography` 和 `ListKeymap`。名稱與其中一項相同的選項若設為 `false`，便會略去該 extension；設為物件則加以設定（`heading: { levels }`、`history: { depth }`、`textAlign: { types }`、`codeBlock: { enableTabIndentation }`）。每個 class 的 `configure(options)` 和 `extend({...})` 會組成一個 `RichExtension`，其具有 `name`、`type`、`priority` 和 `options`。每個編輯器還會得到核心 keymap（Enter、Backspace、Delete、全選）。

每個 extension 都會加入 Tiptap 的指令，由 `command(name, args)` 執行：`toggleBold`、`setItalic`、`unsetStrike`、`toggleHeading({ level })`、`setParagraph`、`toggleBlockquote`、`toggleBulletList`、`toggleOrderedList`、`toggleTaskList`、`toggleCodeBlock({ language })`、`setHardBreak`、`setHorizontalRule`、`setImage({ src })`、`toggleHighlight({ color })`、`setTextAlign("center")`、`unsetTextAlign`，以及下文的連結、字數統計和 suggestion 指令。

清單切換作用於整個清單，一如文書處理器的清單按鈕：在項目符號清單中使用 `toggleOrderedList`，會將該清單在每一層都轉為編號清單，包括巢狀清單；而清單自己的切換，會將選取的 block 從其周圍的每個清單中取出。

`extensions` 的順序是它們在同等級之間的優先次序：後列出的 extension 會比前面的更先綁定其按鍵；`priority`（預設為 100）則另行決定排序。使用 `extensions` 時，編輯器的 `plugins` 排在 extension 的 plugin 之後。

<a id="the-apps-extensions"></a>

### App 的 extension

`defineExtension` 用來建立 extension。其中的函式在以它建立編輯器時執行一次，並帶有該 extension 的選項，然後返回資料：即上文各工廠函式所建立的指令、rule 和 plugin。

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

`node` 或 `mark`（以 `defineSchema` 的形式）會使它成為 node 或 mark extension；`addGlobalAttributes` 為其他類型加入屬性；`addProseMirrorPlugins` 返回 plugin，包括 `RichEditorPlugin`；`addPasteRules` 為貼上的文字返回 `textRule` 和 `markRule` rule。內建 class 的 `extend({...})` 會取代它所提供的部分：`Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`。

App 的 crate 透過其 UI set 註冊以 Rust 編寫的 extension，JS 則按名稱取用：

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

`richExtension(name, options)` 亦可按名稱找到每個內建 extension（`"text"`、`"bold"` 等）。

<a id="plugins"></a>

## Plugin

| 工廠函式 | 加入的內容 |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | 復原歷史；`newGroupDelay` 毫秒（500）內的變更會一併復原 |
| `keymap(bindings)` | 按按鍵名稱綁定指令：`"Mod-b"`（Apple 平台為 Cmd，其他平台為 Ctrl）、`"Shift-Enter"`、`"Alt-ArrowUp"` |
| `baseKeymap()` | Enter、Backspace、Delete、全選，以及平台的文字編輯按鍵 |
| `starterKeymap()` | starter schema 的綁定：mark、標題、清單、程式碼區塊、hard break |
| `inputRules(rules)` | 在游標前輸入的文字若符合某個 rule，會變成該 rule 所產生的內容；緊接著按 Backspace 可還原 |
| `markdown(options?)` | 輸入時的 Markdown、Markdown 貼上及 Markdown 複製（`blockRules`、`inlineRules`、`paste`、`copyAsMarkdown`） |
| `starterKit()` | starter 的 input rule 和綁定、基本綁定及歷史記錄 |

Plugin 在列表中的位置就是其優先次序：列表中較前的 keymap 和 input rule 會先處理按鍵或文字。Input rule 來自 `markdownRules()`（標題、引用、清單、程式碼圍欄、分隔線、常用 mark）、`typographyRules()`（智能引號、省略號、破折號）、`textRule(match, replacement)`、`markRule(match, mark)`、`wrappingRule(match, node)` 和 `textblockRule(match, node)`。Rule 的 `match` 是以 `$` 結尾的正規表達式，用來比對游標前的文字。

<a id="the-apps-plugins"></a>

### App 的 plugin

`new RichEditorPlugin(key)` 建立行為由 app 決定的 plugin，以鏈式呼叫設定：

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

- `captureKeys(keys, handler)`：當 `capturing` 為 true 時，編輯器會消耗這些按鍵，並隨即告知 `handler` 按下了哪一個；鍵盤的反應與沒有 plugin 時一樣迅速。
- `editor.setDecorations(key, decorations)`：視圖繪製在文件之上、而不更改文件的行內屬性、node 屬性和 widget。它們會隨每次變更而更新，直到再次設定為止。
- `filterTransaction(hook)` 和 `appendTransaction(hook)` 可看到 app 自己的呼叫（`run`、`dispatch`、`setContent`、…）在該次呼叫中所產生的 transaction：`filterTransaction` 可以捨棄其中一個，`appendTransaction` 可以多返回一個一併套用。`on("revision", …)` 會聽到每一次變更，包括輸入。
<a id="links-character-counts-and-suggestions"></a>

## 連結、字數統計與建議

三個外掛程式承載 Tiptap 的 Link、CharacterCount 及 Suggestion 行為，全部為原生實作：

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

- `link(options?)`：在空格或 Enter 之前輸入的 URL 會變成連結，貼上文字中的 URL 亦然（`autolink`）；將 URL 貼在選取內容上，會把該選取內容設為連結（`linkOnPaste`）；按住 Mod 點按連結，或編輯器處於唯讀時點按連結，會透過應用程式的 URL 處理機制開啟（`openOnClick`）；`enableClickSelection` 會在點按時選取整個連結。URL 不論有否協定都能被找到（`nsh.dev`、`https://nsh.dev/docs`、電郵地址），而裸主機名稱所獲補上的協定是 `defaultProtocol`（`http`）。連結接受的協定有 `http`、`https`、`ftp`、`ftps`、`mailto`、`tel`、`callto`、`sms`、`cid`、`xmpp` 以及 `protocols` 中的協定，因此 `setLink({ href })`、`toggleLink(attrs?)` 及自動連結都會拒絕指令碼（`javascript:`）和 data URL。`unsetLink()` 會移除選取範圍周圍的連結。
- `characterCount(options?)`：`editor.characters(mode?)` 計算文字的字元數（`"textSize"`，按 UTF-16 單元計算，與 JS 的 `length` 相同）或文件的位置數（`"nodeSize"`）；`editor.words()` 計算字數（依 Unicode 詞語邊界）。設定 `limit` 後，會拒絕超出上限的變更，貼上的內容會裁切至符合上限；首份超出上限的文件會被裁切（`autoTrim`）。`setCharacterLimit(limit)` 變更上限，`editor.characterLimit` 讀取上限。
- `suggestion(options?)`：追蹤在游標前輸入的觸發字元（`char`，預設為 `@`）。`allowSpaces` 讓查詢可包含空格，`allowedPrefixes` 列出可置於觸發字元之前的字元（預設為空格；`anyPrefix` 接受任何字元），`startOfLine` 要求觸發字元位於行首（`/` 指令選單）。`editor.suggestion(key)` 提供 `{ active, range, query, text, lastKey, keyCount }`；作用中的範圍帶有應用程式的 `decorationClass`（查詢為空時還帶有 `decorationEmptyClass`）。建議作用中時，`captureKeys` 內的按鍵歸應用程式的清單所有：編輯器會接收這些按鍵並將最後一個記錄在狀態中，Escape 會關閉建議（`exitSuggestion(key)` 同樣可以）。`replaceSuggestion(content, key?)` 以文字或 JSON 內容取代觸發字元和查詢。
- `withMention(schema, { name?, char? })` 加入 Tiptap 的 mention 節點：一個行內 atom，具有 `id`、`label` 及其觸發字元，在文字中寫作 `@label`，在 HTML 中寫作 `<span data-type="mention">`。`insertMention(range, id, label?)` 會以一個 mention 加一個空格取代建議的範圍。

彈出視窗由應用程式負責：它讀取建議的狀態，將自己置於 `coordsAtPos(range.from)`，並以自己的方式繪製各個項目。

<a id="tables"></a>

## 表格

`TableKit` 引入 Tiptap 的表格：`RichTable`（Tiptap 的 `Table`）、`RichTableRow`、`RichTableHeader` 及 `RichTableCell`。它加在 `StarterKit` 旁邊：

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

表格接受選項 `resizable`（true）、`cellMinWidth`（25）、`lastColumnResizable`（true）、`allowTableNodeSelection`（false）及 `HTMLAttributes`；`TableKit.configure({ tableHeader: false })` 會略去其中一個擴充。儲存格可包含區塊，並具有 `colspan`、`rowspan` 及 `colwidth`（所跨每一欄各有一個以點為單位的寬度）；列具有 `height`。

Tab 和 Shift-Tab 在儲存格之間移動，在最後一個儲存格按 Tab 會新增一列。在儲存格邊緣按方向鍵會繼續移至下一個儲存格；Shift 加方向鍵，或跨儲存格拖曳，會選取一個矩形範圍的儲存格（類型為 `"cell"` 的選取範圍，其 `anchor` 和 `head` 分別是第一個和最後一個儲存格之前的位置）。Backspace 和 Delete 會清空所選儲存格，當所有儲存格都被選取時則會刪除整個表格。

在編輯器中，表格是由其儲存格組成的格線：每一欄的寬度與其儲存格的 `colwidth` 相同，沒有該值的欄則平分餘下空間（寬度至少為 `cellMinWidth`），每一列的高度至少為其 `height`。外觀以主題為起點：1 點的 `border` 格線、位於 `muted` 之上的標題儲存格、帶有內距的儲存格，以及每個選取的儲存格會以選取顏色顯示在 `selectedCell` 部件之下。`classes.nodes`（`table`、`tableCell`、`tableHeader`）和各部件可重新設定這一切的樣式。在儲存格的第一行或最後一行按上或下方向鍵，會移至上方或下方的儲存格。

在文件可編輯時：

- 在桌面平台上，每一欄的右邊框和每一列的下邊框可用來調整大小：指標會顯示調整大小的游標和 `tableResizeHandle` 線，表格會跟隨拖曳，放開時會一步設定 `colwidth` 或 `height`，而復原可一次還原。`resizable: false` 會關閉此功能，`lastColumnResizable: false` 會保留最後一欄的寬度。
- 選取範圍所在的表格，會在每一欄上方的頂部邊框和每一列旁邊的左側邊框顯示控點（`tableGrip`）。按下控點會選取該欄或該列；在桌面平台上拖曳控點會顯示放置位置（`tableDropIndicator`），放開時會將其移至該處。

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

以下是各項命令，每項都是 `nsh/base` 的輔助函式：

- `insertTable({ rows, cols, withHeaderRow })`（預設為 3 × 3 並帶標題列）和 `deleteTable()`。
- `addColumnBefore()`、`addColumnAfter()`、`deleteColumn()`、`addRowBefore()`、`addRowAfter()`、`deleteRow()`。
- `mergeCells()`、`splitCell()` 和 `mergeOrSplit()`。
- `toggleHeaderRow()`、`toggleHeaderColumn()` 和 `toggleHeaderCell()`。
- `setCellAttribute(name, value)`、`setCellSelection({ anchorCell, headCell })`、`goToNextCell()`、`goToPreviousCell()` 和 `fixTables()`，後者會修復缺少儲存格或儲存格重疊的表格。
- `moveTableRow({ from, to, select })` 和 `moveTableColumn({ from, to, select })` 會移動一列或一欄，連同其合併儲存格所跨的列或欄一併移動；`setColumnWidth({ col, width })` 和 `setRowHeight({ row, height })` 設定它們的大小（`null` 會按內容調整大小）。這些命令接受 `table`（表格之前的位置），以便對選取範圍以外的表格操作。

表格可讀取及寫入 HTML（`<table>` 搭配 `<th>` / `<td>`、`colspan`、`rowspan` 和 `data-colwidth`）和 Markdown：帶標題列且每個儲存格都只有一個段落的表格，會寫成 GFM 管線表格，其他表格則寫成其 HTML，讀回時內容相同。在純文字中，一列是一行文字，各儲存格以 Tab 分隔。
