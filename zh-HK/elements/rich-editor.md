---
title: "RichEditor"
description: "nsh/base 的富文字編輯器：文件由應用程式的 schema 定義，支援 commands、plugins、history、keymaps、input rules 與 Markdown，架構參考 ProseMirror，狀態則以 Rust 管理。"
group: base
demo: el-rich-editor
---

# RichEditor

`RichEditor` 是仿照 ProseMirror 架構打造的富文字編輯器。應用程式以 schema 定義文件由什麼組成(段落、標題、清單、提及,以及它需要的任何節點與標記類型),編輯器則確保每份文件都符合該 schema。變更是 step,並以 transaction 為單位分組,因此可以復原、對應位置,也能以 JSON 傳遞;行為來自外掛(history、keymap、input rule、Markdown 捷徑,以及應用程式自己的外掛);command 是工具列可以執行、也可以查詢的值。編輯器的狀態、command 與外掛都在 Rust 中執行:輸入、按鍵綁定與 input rule 從不等待 JS,應用程式需要時再以 JSON 讀取狀態。

編輯器由兩部分組成:session(`createRichEditor`)擁有狀態,由應用程式的程式碼驅動;view(`<RichEditor editor={…} />`)以原生方式渲染 session,並把平台的輸入轉成 transaction。多個 view 可以顯示同一個 session。

編輯器的核心是 Marijn Haverbeke 所作 [ProseMirror](https://prosemirror.net) 的 Rust 移植版,其擴充層則依循 [Tiptap](https://tiptap.dev):它們的資料結構、command 與命名都沿用下來,你對它們的既有認識也同樣適用。兩者皆採用 MIT 授權,移植自它們的部分適用其授權條款。

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

未提供 `schema` 時,編輯器使用 starter schema(`starterSchema()`);未提供 `plugins` 時,則使用 starter kit(`starterKit()`:starter 的 input rule 與按鍵綁定、基礎按鍵綁定,以及 history)。空的 `plugins` 陣列會建立完全沒有外掛的編輯器。

<a id="styling"></a>

## 樣式

編輯器以應用程式的外觀繪製文件:`classes` 與 `styles` 為各個部分設定樣式(`root`、`content`、`caret`、`selection`、`placeholder`、`composition`、`selectedNode`、`listMarker`,表格則有 `selectedCell`、`tableGrip`、`tableResizeHandle`、`tableDropIndicator`),並依類型為節點設定樣式(`nodes: { heading:
"text-2xl font-bold", "heading[level=2]": "text-xl" }`) and its marks (`marks: { bold: "font-bold" }`)。node spec 將 `extra.listMarker` 設為 `"bullet"` 或 `"ordered"` 的清單(starter schema 的清單),其項目會在 `listMarker` 部分顯示標記:依深度顯示 `•`、`◦`、`▪`,或從清單的 `start` 起算的數字,標記位於項目之前、清單的縮排之內(縮排由清單上的 `pl-6` 決定,如同瀏覽器縮排 `ul`)。

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

`content` 部分是文件在編輯器捲動檢視內的方框:其 padding(`content: "px-6 py-5"`)是文字周圍的空間,捲軸則沿著編輯器自身的邊緣。拖曳選取超過編輯器頂端或底端時,文件會跟著捲動,指標離得越遠捲得越快。

### Bubble menu

`bubbleMenu` 是 Tiptap 的 bubble menu:應用程式的內容顯示在選取範圍旁,預設位於上方(`bubbleMenuPlacement`,沒有空間時翻到另一側),距離 `bubbleMenuOffset` 點(8),位於隨文字捲動而移動的 overlay 中。應用程式在需要顯示時才傳入,並依據 session 的狀態決定:

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

連結選單以 `chain([extendMarkRange("link"), command("setLink", { href })])` 編輯游標所在的連結,並在同一個 `extendMarkRange` 之後以 `command("unsetLink")` 移除它。

## Schemas

`defineSchema(spec)` 讀取 ProseMirror 格式的 schema,若其中有錯誤,會丟出說明問題的例外。節點類型指定其 `content`(content expression:`"inline*"`、`"paragraph+"`、`"(heading | paragraph) block*"`)、`group`、屬於 `inline` 還是 `atom`、允許的 `marks`,以及帶有預設值與驗證的 `attrs`(`"string"`、`"number"`、`"boolean"`)。第一個區塊類型是預設類型:Enter 建立的就是它,填補必要內容的也是它。spec 不認得的鍵會保留為該類型的額外資料,供建構於編輯器之上的框架使用。

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

`RichSchema` 負責讀取與寫入文件:`parse(content, format?)`(預設為純文字,另有 `"markdown"` 或 JSON)、`parseMarkdown(markdown)`、`serialize(doc, format?)`(預設為 Markdown,另有 `"text"`、`"json"`)以及 `check(doc)`,後者會回傳已填入屬性預設值的文件。`nodes`、`marks` 與 `topNode` 指定其類型。Markdown 對應到 starter schema 的名稱(`paragraph`、`heading`、`blockquote`、`codeBlock`、`bulletList`、`orderedList`、`listItem`、`bold`、`italic`、`code`、`link`、`strike`)。

## Commands

command 是一個值:`toggleMark("bold")` 會建立一個物件,由應用程式保存、綁定到按鍵,並傳給編輯器。`editor.run(command)` 執行它並回傳是否生效;`editor.can(command)` 只詢問而不更動任何內容,工具列便是以此啟用按鈕。`editor.isActive(name, attrs?)` 會告知某個標記或節點在選取範圍是否啟用(`isActive("heading", { level: 2 })`)。

| Command | 作用 |
| --- | --- |
| `toggleMark(name, attrs?)` | 將標記加到選取範圍,若已存在則移除;在游標處則作用於接下來輸入的文字 |
| `setMark(name, attrs?)` / `unsetMark(name)` | 加入或移除標記 |
| `setBlockType(name, attrs?)` | 將選取的 textblock 設為某個類型(`setBlockType("heading", { level: 2 })`) |
| `wrapIn(name, attrs?)` / `lift()` | 將選取的區塊包進一個節點(例如引用區塊)/ 將它們從父節點中提出 |
| `wrapInList(name, attrs?)` | 將選取的區塊包進清單 |
| `splitListItem(name)` / `sinkListItem(name)` / `liftListItem(name)` | 分割、縮排或取消縮排清單項目 |
| `undo()` / `redo()` | 復原或重做變更(搭配 `history()`) |
| `selectAll()`、`setTextSelection(anchor, head?)`、`setNodeSelection(pos)` | 選取 |
| `insertText(text)`、`insertContent(content, format?)` | 在選取範圍上插入文字或內容 |
| `setNodeAttribute(pos, attr, value)` | 設定某個位置上節點的屬性,視為一次可復原的變更 |
| `command(name)` | 以名稱呼叫的無參數 command:`"splitBlock"`、`"joinBackward"`、`"exitCode"`、`"newlineInCode"`、`"selectParentNode"`、… |
| `chain(commands)` | 依序執行多個 command,視為單一 transaction(一個復原步驟);僅在每一個都生效時才生效 |
| `first(commands)` | 執行第一個生效的 command |

```tsx
editor.run(chain([setBlockType("heading", { level: 1 }), toggleMark("bold")]));
const canIndent = editor.can(sinkListItem("listItem"));
```

<a id="the-session"></a>

## Session

| 成員 | 說明 |
| --- | --- |
| `state`、`doc`、`selection` | 以 JSON 表示的狀態、文件與選取範圍,於讀取時產生 |
| `revision` | 狀態已套用的 transaction 數量 |
| `isEmpty`、`undoDepth`、`redoDepth`、`composing` | UI 顯示的編輯器相關資訊 |
| `setContent(content, format?)` | 取代文件,視為一次可復原的變更 |
| `insertContent(content, format?)` | 在選取範圍上插入內容 |
| `getJSON()`、`getMarkdown()`、`getText()`、`textBetween(from?, to?, separator?)` | 以某種格式表示的文件 |
| `dispatch(tr)` | 套用以 JSON 給定的 transaction(其 step 作用於目前的文件) |
| `on(event, listener)` | 在 JS 的下一輪,以每個 `event` 的 payload 呼叫 `listener`:`revision`(`{ revision }`,每次變更後觸發,不論來源)、`update`、`selectionUpdate`、`transaction`、`focus`、`blur`、`delete`。回傳一個用來停止監聽的函式;在元件渲染期間加入的 listener 會隨該元件一併停止 |
| `focus()`、`blur()` | 將鍵盤焦點移到或移出顯示該編輯器的 view |

位置的計算方式與 ProseMirror 相同:文字以 UTF-16 code unit 計,leaf 節點計 1,有內容的節點則計其兩個邊界。任何需要在編輯後仍保留的東西,都應把 id 存在節點的屬性或標記中。位置查詢(`resolve(pos)`、`nodeAt(pos)`、`coordsAtPos(pos)`、`findParentNode(name, pos)` 等)遇到文件之外的位置(`0` 到 `doc.content.size`)時,會如同 ProseMirror 的 `resolve` 一樣丟出 `RangeError`,而在該處沒有東西時回傳 `null`(節點結尾處的 `nodeAt`,以及沒有 view 顯示編輯器時的 `coordsAtPos`)。對於編輯器不認得的 command、節點或標記類型,`run` 與 `can` 會丟出 `TypeError`。

<a id="taking-over-transactions"></a>

### 接管 transaction

`editor.dispatchTransaction = (tr) => { … }` 讓應用程式自行提交每一個 transaction:handler 會以 JSON 取得每個 transaction,並以 `editor.applyTransaction(tr)` 提交,或將它丟棄。協作、記錄,以及必須通過應用程式檢查的 transaction 都會用到它;`null` 則把提交權交還給編輯器。handler 在 JS 的下一輪才會收到輸入事件,而文件在它提交時才會變更。

## Extensions

Extension 沿用 Tiptap 的做法:每個 extension 會一併帶來其節點或標記類型、按鍵綁定、input rule 與 paste rule、外掛,以及具名 command,而由 extension 組成的編輯器會從中取得其 schema、keymap、rule 與 command 表。內建的 extension 是與 Tiptap 同名的類別,可以直接使用,也可以加以設定:

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

`StarterKit` 帶來 `Document`、`Paragraph`、text 節點、`Heading`、`Blockquote`、`BulletList`、`OrderedList`、`ListItem`、`TaskList`、`TaskItem`、`CodeBlock`、`HardBreak`、`HorizontalRule`、`RichImage`(即 Tiptap 的 `Image`)、`Bold`、`Italic`、`Strike`、`Code`、`Underline`、`RichLink`(即 Tiptap 的 `Link`)、`Highlight`、`Subscript`、`Superscript`、`RichTextStyle`(即 Tiptap 的 `TextStyle`)、`TextAlign`、`History`、`TrailingNode`、`Typography` 與 `ListKeymap`。與其同名的選項若設為 `false`,就會略過該 extension;設為物件則加以設定(`heading: { levels }`、`history: { depth }`、`textAlign: { types }`、`codeBlock: { enableTabIndentation }`)。各類別的 `configure(options)` 與 `extend({...})` 會建立一個 `RichExtension`,它具有 `name`、`type`、`priority` 與 `options`。每個編輯器還會取得核心 keymap(Enter、Backspace、Delete、全選)。

每個 extension 都會加入 Tiptap 的 command,由 `command(name, args)` 執行:`toggleBold`、`setItalic`、`unsetStrike`、`toggleHeading({ level })`、`setParagraph`、`toggleBlockquote`、`toggleBulletList`、`toggleOrderedList`、`toggleTaskList`、`toggleCodeBlock({ language })`、`setHardBreak`、`setHorizontalRule`、`setImage({ src })`、`toggleHighlight({ color })`、`setTextAlign("center")`、`unsetTextAlign`,以及下方的連結、字元計數與 suggestion command。

清單的切換作用於整份清單,如同文書處理軟體的清單按鈕:在項目符號清單中使用 `toggleOrderedList`,會把它的每一層(包括巢狀清單)都轉為編號清單,而清單自己的切換則會把選取的區塊從周圍所有清單中取出。

`extensions` 的順序決定同等條件下的優先順序:排在後面的 extension 會比排在前面的先綁定其按鍵;`priority`(預設為 100)則用於其他情況下的排序。有 `extensions` 時,編輯器的 `plugins` 會排在 extension 的外掛之後。

<a id="the-apps-extensions"></a>

### 應用程式自己的 extension

`defineExtension` 會建立一個 extension。它的函式在以它建立編輯器時執行一次,帶入 extension 的選項,並回傳資料:由上述工廠函式產生的 command、rule 與外掛。

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

`node` 或 `mark`(以 `defineSchema` 的形式)會讓它成為節點或標記 extension;`addGlobalAttributes` 為其他類型加入屬性;`addProseMirrorPlugins` 回傳外掛,包括各個 `RichEditorPlugin`;`addPasteRules` 回傳用於貼上文字的 `textRule` 與 `markRule` rule。內建類別的 `extend({...})` 會取代它所提供的部分:`Underline.extend({ addKeyboardShortcuts: () => ({ "Mod-Alt-u": toggleMark("underline") }) })`。

應用程式的 crate 透過其 UI set 註冊以 Rust 撰寫的 extension,JS 則依名稱取用:

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

`richExtension(name, options)` 也能依名稱找到每個內建 extension(`"text"`、`"bold"` 等)。

<a id="plugins"></a>

## 外掛

| 工廠函式 | 新增內容 |
| --- | --- |
| `history({ depth?, newGroupDelay? })` | 復原歷史;`newGroupDelay` 毫秒內(預設 500)的變更會一併復原 |
| `keymap(bindings)` | 依按鍵名稱綁定 command:`"Mod-b"`(Apple 平台為 Cmd,其他平台為 Ctrl)、`"Shift-Enter"`、`"Alt-ArrowUp"` |
| `baseKeymap()` | Enter、Backspace、Delete、全選與平台的文字編輯按鍵 |
| `starterKeymap()` | starter schema 的綁定:標記、標題、清單、程式碼區塊、硬換行 |
| `inputRules(rules)` | 游標前輸入的文字若符合某條 rule,就會轉成該 rule 產生的內容;緊接著按 Backspace 可還原 |
| `markdown(options?)` | 邊輸入邊轉換 Markdown、Markdown 貼上與 Markdown 複製(`blockRules`、`inlineRules`、`paste`、`copyAsMarkdown`) |
| `starterKit()` | starter 的 input rule 與綁定、基礎綁定與 history |

外掛在清單中的位置就是它的優先順序:清單中較前面的 keymap 與 input rule 會先處理按鍵或文字。input rule 來自 `markdownRules()`(標題、引用、清單、程式碼圍欄、分隔線、常見標記)、`typographyRules()`(智慧引號、刪節號、破折號)、`textRule(match, replacement)`、`markRule(match, mark)`、`wrappingRule(match, node)` 與 `textblockRule(match, node)`。rule 的 `match` 是以 `$` 結尾的正規表示式,用來比對游標前的文字。

<a id="the-apps-plugins"></a>

### 應用程式自己的外掛

`new RichEditorPlugin(key)` 會建立一個行為由應用程式決定的外掛,以串接呼叫來設定:

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

- `captureKeys(keys, handler)`:當 `capturing` 為 true 時,編輯器會攔截這些按鍵,並在隨後告知 `handler` 按下的是哪一個;鍵盤的反應速度與沒有外掛時一樣快。
- `editor.setDecorations(key, decorations)`:由 view 繪製在文件上、但不更動文件的行內屬性、節點屬性與 widget。它們會隨每次變更而更新,直到再次設定。
- `filterTransaction(hook)` 與 `appendTransaction(hook)` 會看到應用程式自己的呼叫(`run`、`dispatch`、`setContent` 等)在該次呼叫中產生的 transaction:`filterTransaction` 可以丟棄其中一個,`appendTransaction` 可以多回傳一個一併套用。`on("revision", …)` 會聽到每一次變更,包括輸入。
<a id="links-character-counts-and-suggestions"></a>

## 連結、字元計數與建議

三個外掛程式承載了 Tiptap 的 Link、CharacterCount 與 Suggestion 行為，全部皆為原生實作：

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

- `link(options?)`：在空格或 Enter 之前輸入的 URL 會變成連結，貼上文字中的 URL 也一樣（`autolink`）；
  將 URL 貼到選取範圍上時，會把該選取範圍設為連結（`linkOnPaste`）；按住 Mod 點按連結，或編輯器處於唯讀狀態時點按連結，
  會透過應用程式的 URL 處理機制開啟（`openOnClick`）；`enableClickSelection` 在點按時會選取整個連結。
  無論有無通訊協定，URL 都能被找到（`nsh.dev`、`https://nsh.dev/docs`、電子郵件地址），而僅有主機名稱的 URL 會被補上的通訊協定為 `defaultProtocol`（`http`）。
  連結接受的通訊協定有 `http`、`https`、`ftp`、`ftps`、`mailto`、`tel`、`callto`、`sms`、`cid`、`xmpp`，以及 `protocols` 中的通訊協定，
  因此 `setLink({ href })`、`toggleLink(attrs?)` 與自動連結都會將指令碼（`javascript:`）和 data URL 擋在外面。
  `unsetLink()` 會移除選取範圍周圍的連結。
- `characterCount(options?)`：`editor.characters(mode?)` 計算文字的字元數（`"textSize"`，以 UTF-16 單位計算，與 JS 的 `length` 相同）
  或文件的位置數（`"nodeSize"`）；`editor.words()` 計算字數（依 Unicode 單字邊界）。設定 `limit` 後，
  會超出上限的變更會被拒絕，貼上的內容也會被裁切到可容納的範圍；
  超出上限的初始文件會被裁切（`autoTrim`）。`setCharacterLimit(limit)` 用來變更上限，`editor.characterLimit` 用來讀取上限。
- `suggestion(options?)`：追蹤在游標前輸入的觸發字元（`char`，預設為 `@`）。`allowSpaces` 讓查詢可以包含空格，
  `allowedPrefixes` 列出可以出現在觸發字元之前的字元（預設為空格；`anyPrefix` 接受任何字元），
  `startOfLine` 要求觸發字元必須位於行首（`/` 指令選單）。`editor.suggestion(key)` 提供
  `{ active, range, query, text, lastKey, keyCount }`；作用中的範圍帶有應用程式的 `decorationClass`（查詢為空時還會帶有
  `decorationEmptyClass`）。建議處於作用中時，`captureKeys` 中的按鍵歸應用程式的清單所有：
  編輯器會接收這些按鍵，並將最後一個按鍵記錄在狀態中，而 Escape 會關閉該建議（`exitSuggestion(key)` 也會）。
  `replaceSuggestion(content, key?)` 會以文字或 JSON 內容取代觸發字元與查詢。
- `withMention(schema, { name?, char? })` 加入了 Tiptap 的 mention 節點：這是一個行內 atom，帶有 `id`、`label` 及其觸發字元，
  在文字中寫作 `@label`，在 HTML 中寫作 `<span data-type="mention">`。`insertMention(range, id, label?)`
  會以一個 mention 加上一個空格取代建議的範圍。

彈出視窗由應用程式負責：它讀取建議的狀態，將自己放置在 `coordsAtPos(range.from)`，並以自己的方式繪製各個項目。

<a id="tables"></a>

## 表格

`TableKit` 帶來了 Tiptap 的表格功能：`RichTable`（Tiptap 的 `Table`）、`RichTableRow`、`RichTableHeader` 與
`RichTableCell`。它會加在 `StarterKit` 旁邊：

```tsx
import { RichEditor, StarterKit, TableKit, addRowAfter, createRichEditor, insertTable, mergeCells } from "nsh/base";

const editor = createRichEditor({
  extensions: [StarterKit, TableKit.configure({ table: { cellMinWidth: 40 } })],
});

editor.run(insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
editor.run(addRowAfter());
```

表格接受的選項有 `resizable`（true）、`cellMinWidth`（25）、`lastColumnResizable`（true）、
`allowTableNodeSelection`（false）與 `HTMLAttributes`；`TableKit.configure({ tableHeader: false })` 可以省略其中一個
擴充功能。儲存格可容納區塊，並具有 `colspan`、`rowspan` 與 `colwidth`（其跨越的每一欄各有一個以點為單位的寬度）；
列則具有 `height`。

Tab 與 Shift-Tab 可在儲存格之間移動，在最後一個儲存格按 Tab 會新增一列。在儲存格邊緣按方向鍵會繼續移往下一個儲存格；
Shift 加方向鍵，或拖曳跨越儲存格，會選取一個矩形範圍的儲存格（選取類型為
`"cell"`，其 `anchor` 與 `head` 為第一個與最後一個儲存格之前的位置）。Backspace 與 Delete 會清空
所選的儲存格，而在所有儲存格皆被選取時會刪除整個表格。

在編輯器中，表格是由其儲存格組成的網格：每一欄的寬度等於其儲存格的 `colwidth`，沒有設定寬度的欄
則共用剩餘空間（寬度至少為 `cellMinWidth`），每一列的高度至少為其 `height`。其外觀以主題為基礎：
1 點的 `border` 網格線、位於 `muted` 上的標題儲存格、帶有內距的儲存格，以及每個被選取的儲存格都會在 `selectedCell` part 下
以選取顏色呈現。`classes.nodes`（`table`、`tableCell`、`tableHeader`）與各個 part 可重新設定
這一切的樣式。在儲存格的第一行或最後一行按上或下方向鍵，會移往上方或下方的儲存格。

在文件可編輯時：

- 在桌面平台上，每一欄的右邊框與每一列的下邊框可用來調整大小：指標會顯示調整大小的游標與 `tableResizeHandle` 線，
  表格會跟隨拖曳，放開時會一次設定 `colwidth` 或
  `height`，且可由復原一次還原。`resizable: false` 可關閉此功能，`lastColumnResizable: false` 則保留
  最後一欄的寬度。
- 選取範圍所在的表格會顯示握把（`tableGrip`）：每一欄的上邊框上方各有一個，每一列的左邊框旁各有一個。
  按下握把會選取該欄或該列；在桌面平台上拖曳握把會顯示放置位置
  （`tableDropIndicator`），並在放開時將其移到該處。

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

以下為各項指令，每個都是 `nsh/base` 的輔助函式：

- `insertTable({ rows, cols, withHeaderRow })`（預設為含標題列的 3 × 3）與 `deleteTable()`。
- `addColumnBefore()`、`addColumnAfter()`、`deleteColumn()`、`addRowBefore()`、`addRowAfter()`、`deleteRow()`。
- `mergeCells()`、`splitCell()` 與 `mergeOrSplit()`。
- `toggleHeaderRow()`、`toggleHeaderColumn()` 與 `toggleHeaderCell()`。
- `setCellAttribute(name, value)`、`setCellSelection({ anchorCell, headCell })`、`goToNextCell()`、
  `goToPreviousCell()` 與 `fixTables()`，後者可修復缺少儲存格或儲存格重疊的表格。
- `moveTableRow({ from, to, select })` 與 `moveTableColumn({ from, to, select })` 會移動列或欄，連同
  其合併儲存格所跨越的列或欄一起移動；`setColumnWidth({ col, width })` 與
  `setRowHeight({ row, height })` 用來設定其大小（`null` 會依內容調整大小）。這些指令接受 `table`，也就是
  表格之前的位置，以便對選取範圍以外的表格進行操作。

表格可讀取自 HTML 並寫入 HTML（`<table>` 搭配 `<th>` / `<td>`、`colspan`、`rowspan` 與 `data-colwidth`），也支援
Markdown：具有標題列且每個儲存格都只含一個段落的表格會寫成 GFM 管線表格，其他任何表格則
寫成其 HTML，讀回時內容相同。在純文字中，一列是一行文字，其儲存格以 Tab 分隔。
