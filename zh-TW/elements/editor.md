---
title: "Editor"
description: "Editor 元件:一個程式碼編輯器,支援語法醒目提示、行號、多游標、程式碼摺疊、自動換行、尋找與取代、診斷資訊與裝飾,以及程式碼編輯器常見的快捷鍵。"
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---

# Editor

`Editor` 是程式碼編輯器：支援五十多種語言的語法醒目提示、行號、多游標、摺疊、自動換行、尋找與取代、診斷與裝飾，並提供程式碼編輯器慣用的按鍵（移動與複製行、註解、縮排、輸入時自動補上的括號與引號）。它能處理任意長度的檔案：只建立畫面內可見的列，醒目提示隨每次編輯逐行更新，因此長檔案的捲動與輸入就像短檔案一樣流暢。輸入透過平台的輸入機制處理，因此輸入法（拼音、假名、組合鍵）與軟鍵盤的運作方式與一般文字欄位相同。

編輯器自行負責行為，並附帶一套以佈景主題 token 建構的預設外觀：佈景主題的 `font-mono` 以 13pt 字級、20pt 列高顯示，行號使用 `muted-foreground`，有游標的行後方有一條淡淡的 `muted` 色帶，選取範圍使用 `primary` 的淡色調，縮排參考線使用 `border`，並採用 [`TextView`](./text-view.md) 程式碼區塊所用的內建語法色彩（含淺色與深色）。每個部分都可以用應用程式的樣式覆寫這些預設值（`classes` 與 `styles`）。Rust 以 `nsh_base::editor()` 建立，TSX 則從 `nsh/base` 使用 `<Editor>`。

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

編輯器會填滿應用程式提供的方框（`flex-1`、一個高度），並在內部捲動文字：垂直方向永遠可捲動；當行比方框長時可水平捲動，或使用 `softWrap` 完全不水平捲動，此時長行會在編輯器的寬度處換行。

<a id="the-text"></a>

## 文字內容

- **受控**：傳入 `value`，並在 `onChange`（回報整份新文字）中再次設定。應用程式變更 `value`（載入檔案、格式化工具的輸出）時，會以一次可由復原取消的編輯取代文字，離變更處較遠的游標與摺疊維持原位。
- **非受控**：傳入 `defaultValue`，並從 `onChange` 或 ref 的 `value()` 讀取文字。

換行字元統一為 `\n`：傳入文字中的 `\r\n` 與 `\r` 會變成 `\n`。

<a id="languages"></a>

## 語言

`language` 以名稱、別名、副檔名或檔名指定語言，不分大小寫：`"rust"`、`"rs"`、`"typescript"`、`"tsx"`、`"main.go"`、`"Dockerfile"`、`"Makefile"`。它決定醒目提示、`mod+/` 切換的註解、比對與縮排的括號、輸入時自動補上的成對符號、構成單字的字元，以及預設縮排：四個空格，網頁語言（JavaScript、TypeScript、JSON、HTML、CSS、YAML 等）為兩個空格，Go 與 Makefile 則使用 Tab。`tabSize` 與 `hardTabs` 可為所有語言設定縮排。其他名稱視為純文字，除非應用程式已註冊該語言（[自訂語言](#your-own-languages)）。

支援的語言：Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL 與 Diff。

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### 自訂語言

Rust 程式碼可以讓應用程式的編輯器認識更多語言，並能以自有的醒目提示器（tree-sitter 文法、應用程式自己的解析器）為任何語言醒目提示。`register_language` 註冊一個 `EditorLanguage`：包含名稱、別名、副檔名與檔名，以及編輯規則（註解、括號、輸入時自動補上的成對符號、單字字元、縮排），並以 `syntax` 指定用來醒目提示的內建文法。`register_highlighter` 為內建或已註冊的語言提供應用程式的醒目提示器：這是一個實作 `EditorHighlighter` 的型別，它會收到每一次編輯（行、位元組與位置，格式與 tree-sitter 的編輯相同），並在時間預算內、於 UI 執行緒之外，提供每一行的 token（`EditorToken`，或透過 `EditorToken::from_scope` 提供 tree-sitter capture 或 TextMate scope）。編輯器會保留這些 token，隨文字編輯而移動它們，並對畫面內的行再次請求，做法與內建醒目提示器相同。`language` 會優先尋找已註冊的語言，依名稱、別名、副檔名或路徑比對，編輯器與差異檢視皆然。

每個引擎各自保存自己的語言。Rust 應用程式在掛載編輯器之前，於其根元件中註冊；TSX 應用程式則由應用程式的 crate 在其 UI set 的 setup 中註冊，執行該應用程式的每個引擎都會先呼叫它。

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

## 編輯

編輯器的運作方式與一般程式碼編輯器相同：

- **多游標。** Alt-click（Option-click）新增游標，`mod+d` 選取目前選取內容的下一個出現處，`mod+shift+l` 選取所有出現處，新增游標的按鍵則在上一列或下一列新增一個。輸入、刪除、移動與每個命令都會作用在每個游標上；Escape 回到單一游標。`undoSelection`（`cmd+u`、`ctrl+u`）回到上一次移動之前的選取範圍。
- **選取範圍擴大**：以 `expandSelection`（`ctrl+shift+cmd+right`、`shift+alt+right`）逐級擴大：單字、字串內容與整個字串、括號對的內容與整個括號對、整行、全部文字；`shrinkSelection` 以相同層級退回。`splitSelectionIntoLines`（`shift+alt+i`）把跨越多行的選取範圍變成每行一個選取範圍。
- **縮排。** 新的一行會沿用該行的縮排，並在左括號之後增加一層（Python 的 `:`、Ruby 的 `do` 等）；在一對括號之間按 Enter，會把右括號放到獨立的一行。Tab 與 Shift+Tab 對選取的行增加與減少縮排；在行首空白中按 Backspace 會退到前一個縮排停駐點。`autoIndent` 可關閉此行為。
- **括號與引號**在輸入時自動補上，可包住選取內容，再次輸入右括號或右引號時會跳過已存在的那一個（`autoClose`）。游標處的括號與其配對的括號會以外框標示。
- **復原**會一次取消整段輸入：一個單字、一次刪除、一個命令。移動或按下滑鼠會開始新的一步。
- **摺疊。** 後面接著縮排更深的行的那一行，可以用邊欄中的標記把它們摺疊起來：`⌄` 摺疊，`›` 與該行之後的 `⋯` 展開。游標移入摺疊區時會將其展開（[Folding](#folding)）。
- **按壓操作。** 使用指標裝置時，按一下放置游標，按兩下選取單字，按三下選取整行，Shift-click 延伸選取範圍，拖曳則依所按下時選取的單位來選取。Alt+Shift 拖曳（Option+Shift；Linux 上也可用 Control+Alt）選取矩形區塊：每列一個選取範圍，欄位相同，且超出較短行的末端時仍會延續。在觸控螢幕上，輕點放置游標，輕點兩下或長按選取手指下的單字，選取範圍兩端的控制把手可隨手指拖曳移動各端（把手周圍的文字仍可捲動）。
- **剪貼簿。** 沒有選取內容時，複製與剪下會取走游標所在的整行，貼上時這些內容會以整行的形式貼到游標所在行的上方。

`readOnly` 讓文字在仍被選取、搜尋與複製時維持原樣。

<a id="keys"></a>

## 按鍵

編輯器的按鍵在取得焦點時才生效；其他輸入元件保有各自的按鍵。`mod` 在 macOS 與 iOS 上是 Command，其他平台上是 Control（`keymap` 的按鍵組合）。

| 按鍵（macOS） | 按鍵（Windows、Linux） | 命令 |
|---|---|---|
| 方向鍵，搭配 Shift 選取 | 方向鍵，搭配 Shift 選取 | 以字元與列為單位移動 |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | 以單字為單位移動 |
| `cmd+left` / `cmd+right`、`home` / `end`、`ctrl+a` / `ctrl+e` | `home` / `end` | 該行第一個非空白字元（再按一次則到行首）/ 行尾 |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | 文字開頭 / 結尾 |
| `pageup` / `pagedown` | `pageup` / `pagedown` | 向上 / 向下翻一頁 |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | 向左 / 向右刪除一個單字 |
| `cmd+backspace` / `cmd+delete`、`ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | 刪除到行首 / 行尾 |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`、`ctrl+y` | 復原 / 重做 |
| `cmd+a` | `ctrl+a` | 全選 |
| `cmd+l` | `ctrl+l` | 選取該行（再按一次：連下一行一起選取） |
| `cmd+d` | `ctrl+d` | 選取下一個出現處 |
| `cmd+shift+l` | `ctrl+shift+l` | 選取所有出現處 |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | 在上方 / 下方新增游標 |
| `escape` | `escape` | 回到單一選取範圍 |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | 向上 / 向下移動行 |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | 向上 / 向下複製行 |
| `cmd+shift+k` | `ctrl+shift+k` | 刪除行 |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | 在下方 / 上方插入新行 |
| `tab` / `shift+tab`、`cmd+]` / `cmd+[` | `tab` / `shift+tab`、`ctrl+]` / `ctrl+[` | 增加 / 減少縮排 |
| `cmd+/` | `ctrl+/` | 切換行註解 |
| `cmd+shift+\` | `ctrl+shift+\` | 跳到配對的括號 |
| `ctrl+j` | `ctrl+j` | 合併行 |
| `ctrl+t` | | 交換游標前後的字元 |
| `ctrl+alt+left` / `ctrl+alt+right`，搭配 Shift 選取 | | 以單字的一部分為單位移動（camelCase、snake_case） |
| `shift+alt+a` | `shift+alt+a` | 切換區塊註解 |
| `shift+alt+i` | `shift+alt+i` | 將選取範圍拆成多行 |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | 擴大 / 縮小選取範圍 |
| `cmd+u` | `ctrl+u` | 回到上一個選取範圍 |
| `cmd+g` / `cmd+shift+g`、`f3` / `shift+f3` | `f3` / `shift+f3` | 尋找下一個 / 上一個符合項目 |
| `cmd+e` | | 尋找選取內容（`onFindWithSelection`） |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | 摺疊 / 展開游標所在行 |
| `f12` | `f12` | 跳到游標處的定義（`onDefinitionRequest`） |
| `cmd+.` | `ctrl+.` | 對選取範圍執行程式碼動作（`onCodeActionRequest`） |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | 複製 / 剪下 / 貼上 |

macOS 與 iOS 另外支援 Cocoa 的文字按鍵：`ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` 用於移動，`ctrl+h` / `ctrl+d` 用於刪除。

沒有預設按鍵的命令與應用程式自己的命令，使用應用程式以 [`keymap`](../modules/nsh.md#keymap) 繫結的按鍵，並透過 ref 的 `run` 執行：

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

## 尋找與取代

`search` 是要尋找的內容：`{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`。符合的項目會被醒目提示，選取範圍所在的那一個以更強的方式顯示，`onSearchChange` 回報 `{ result }`，也就是一個 `{ count, current, error }`：符合項目的數量、選取範圍位於第幾個（從 0 起算），以及正規表達式無效的原因。`findNext` 與 `findPrevious` 選取下一個與上一個符合項目，並會循環；`replace(text)` 取代目前的符合項目並選取下一個，`replaceAll(text)` 則以一次編輯取代所有符合項目，並傳回 `{ count }`，即取代的數量。正規表達式的取代內容以 `$1` 與 `${name}` 引用其群組。

`inSelection` 只在開啟時所選取的範圍內尋找（沒有選取時則為游標所在的行）：只要保持開啟，這個範圍就會持續存在，即使經過編輯，或選取範圍在符合項目之間移動也一樣。`findWithSelection`（macOS 上為 `cmd+e`）以 `onFindWithSelection` 回報選取的文字，或游標處的單字，供尋找列作為查詢內容。

尋找列由應用程式自行提供：

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

## 診斷

`diagnostics` 標示語言伺服器或 linter 回報的問題：在每個範圍下方，以對應嚴重程度的顏色（`error`、`warning`、`info`、`hint`）畫上細波浪底線。位置為從 0 起算的行與 UTF-16 欄，與語言伺服器相同，因此其診斷可以原樣傳入。使用者輸入時，標記會留在原本的文字上，直到應用程式傳入新的標記；顯示訊息（清單、行上的懸浮卡片）則由應用程式負責。

診斷也帶有語言伺服器 `Diagnostic` 的其餘欄位。其 `tags` 的文字繪製方式與語言用戶端相同：`unnecessary` 程式碼（未使用的變數、無法到達的程式碼）會變淡，`deprecated` 程式碼會加上刪除線，分別位於 `unnecessaryText` 與 `deprecatedText` 部分；帶有標籤的提示只會顯示其文字本身。`codeDescription.href` 是說明其代碼（例如 lint 規則）的頁面，`relatedInformation` 列出其他說明該診斷的位置（`{ location: { uri?, range }, message }`）：懸浮時會把這兩者交給應用程式，由應用程式在其懸浮卡片中顯示並開啟該頁面。語言伺服器以數字傳送標籤（`1`、`2`）；編輯器則使用其名稱。

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

## 裝飾

`decorations` 為應用程式選定的範圍設定樣式：來自語言伺服器的語意醒目提示、正在執行的陳述式、審查中變更過的行。裝飾的 `class` 與 `style` 為其文字設定樣式；`lineClass` 與 `lineStyle` 為其所在行的列設定樣式，位於文字後方。與診斷一樣，它們在編輯後仍會留在原本的文字上，直到應用程式設定新的裝飾。

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

### 邊欄與概覽尺規標記

裝飾的 `gutter` 會在行號前的欄帶中，於其範圍涵蓋的每一行旁放置標記：版本控制差異新增或修改的行，或中斷點（空範圍涵蓋其所在行，如同 `lineClass`）。搭配 `placement: "before"` 時，則是在範圍起點之前的邊界上橫跨欄帶畫一條線，表示該處有行被刪除。欄帶寬 `gutterDecorationsWidth` 點（預設為 3），只要有裝飾帶有邊欄標記就會保留，因此標記出現或消失時文字不會移位。位於摺疊內的範圍會標記在摺疊所在的列。

裝飾的 `overviewRuler` 會在概覽尺規上放置標記。概覽尺規是編輯器右緣的欄帶，寬 14 點（與捲軸同寬；`overviewRuler` 部分可設定其他寬度），將整段文字對應到其高度，如同 Monaco 的做法。標記至少 6 點高，並佔尺規的一個 `lane`：`left`、`center`（預設）、`right` 或 `full`。只要有裝飾在尺規上有標記，尺規就會顯示。

每個標記採用應用程式的 `class` 與 `style`，沒有它們時以前景色繪製。兩者都會如同裝飾的範圍一樣跟隨編輯；刪除已標記範圍的編輯會在原處留下一個空範圍。

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

### 自訂語法醒目提示

裝飾的 `token` 會讓其文字以內建醒目提示為該類 token 所使用的顏色著色（`comment`、`keyword`、`string`、`number`、`title`、`attr`、`built`、`deletion`），取代內建醒目提示器在該處找到的結果：應用程式自己的醒目提示器（語言伺服器的語意 token、自行撰寫的剖析器）把它的 token 對應到這些種類，就能在淺色與深色模式下得到編輯器的顏色。最內層裝飾的 token 優先；`class` 與 `style` 會套用在其上。`highlighting={false}` 會關閉內建醒目提示器，使文字只由應用程式的 token 著色，而 `language` 仍決定註解、括號與縮排。

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

## 摺疊

摺疊從縮排比前一行更深的行開始。`foldRanges` 改為提供編輯器應用程式自己的範圍（`{ startLine, endLine }`，即語言伺服器摺疊範圍的形式，會原樣傳入）：第 `startLine` 行顯示摺疊，其後直到 `endLine` 的行會被摺起。它們會在編輯過程中保持在原來的行上，直到應用程式傳入新的範圍。

摺疊可以巢狀：摺疊一個區塊時，其內部的摺疊仍保持摺疊，因此展開該區塊時會顯示它們原本的樣子。`foldRecursive` 會摺疊一個區塊及其內所有區塊，`unfoldRecursive` 會全部展開，`foldLevel(n)` 會摺疊巢狀層級 `n` 的每個區塊，`foldSelection`（或 `foldRange(range)`）會摺疊任意行，不論摺疊從何處開始。`onFoldChange` 會在每次變更後回報已摺疊的範圍，`folds()` / `setFolds(ranges)` 則讀取並還原它們，以便與檔案一併保存。

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

## 中斷點與內容選單

按下行號會回報 `onLineNumberPress({ line })`，這是應用程式以裝飾繪製中斷點的位置。次要按鈕（右鍵，Mac 上為 Control 點按）會回報 `onContextMenu({ position, x, y })`：指標下文字中的位置，以及根視圖中的點，應用程式在此開啟自己的選單。在觸控螢幕上，長按、連點兩下、放開控點以及輕點選取範圍也會回報它，並附帶 `selection`：選取範圍在根視圖中的方框（`{ x, y, width, height }`），以及位於其上緣中間的 `x` / `y`，用於編輯選單。

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

## 語言功能

建議、懸停資訊、跳至定義與程式碼動作來自應用程式的語言伺服器。編輯器自行繪製自動完成清單、行內自動完成與定義連結，以及它們的按鍵；其餘部分則把時機與位置交給應用程式，由應用程式繪製自己的彈出視窗（錨定於 `pageBounds` 的 [`Overlay`](./overlay.md)）。

<a id="completion"></a>

### 自動完成

設定 `completion` 後，編輯器會向應用程式請求建議，並以清單顯示在正在輸入的字詞下方（接近視窗底部時顯示在上方）：

- 在字詞結尾輸入字母、數字或 `_` 時，以 `onCompletionRequest(event)` 請求，觸發為 `"typing"`：`event` 含有其 `id`、游標的 `offset` 與 `position`、`query`（目前已輸入的字詞）以及其起點的 `queryStart` 偏移量。`completionTriggerCharacters`（`["."]`、`["::", "<"]`）中的每一個都會在其後以空查詢請求，觸發為 `"character"`（以及 `character`），而 `showCompletions()` 或 `run("showCompletions")` 會在游標處請求，觸發為 `"invoked"`。
- 應用程式以 `presentCompletions(event.id, items)` 回應。每個項目都是語言伺服器的 `CompletionItem` 形式：`label`，以及選用的 `kind`（`"function"`、`"variable"`、`"class"`……）、`detail`、`documentation`、`insertText`、`filterText`、`sortText` 與 `range`。最新請求的回應會顯示；較早的回應，或針對游標已離開之字詞的回應，會被擱置。
- 繼續輸入會就地篩選清單：查詢字串會以依序出現的字母比對每個項目的 `filterText`（否則比對其 label），不分大小寫，以查詢字串開頭的字詞優先，其次是最接近的符合，再依 `sortText` 排序。符合的字母會醒目顯示。傳入 `incomplete: true`（`presentCompletions(id, items, true)`）可讓編輯器在持續輸入時重新請求。
- 上下鍵（以及 Control+P / Control+N）在清單中移動，Page Up 與 Page Down 以頁為單位移動，Enter 與 Tab 接受，Escape 關閉。指標會標示一個項目，點按（觸控螢幕上為輕點）即接受。所選項目的 `documentation` 顯示在清單旁。
- 接受時，會將項目的 `range`（否則為查詢字串）替換為其 `insertText`（否則為其 label），作為可由復原一步取消的單一步驟，在游標處以及每個其前方文字相同的其他游標處執行，並回報 `onCompletionAccept({ item })`。
- 當游標離開字詞、輸入空白或其他標點、編輯器失去焦點，以及游標捲出視野時，清單會關閉。

輸入暫停（`inlineCompletionDelay`，預設 300 毫秒）且沒有顯示清單時，會請求行內自動完成：`onInlineCompletionRequest({ id, offset, position })`。`presentInlineCompletion(id, text)` 會以柔和的顏色在游標處顯示 `text`，Tab 會插入它，Escape、編輯或移動則會清除它。

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

### 懸停與按下

- `onHover(event)`：滑鼠停在某個字元上且沒有按鈕按下（桌面與網頁；拖曳會選取文字）。`event` 含有其 `position`、其 UTF-16 `offset`、其字詞的 `range`、指標的 `pagePosition`、字詞的 `pageBounds`、按住的 `modifiers` 以及該處的 `diagnostics`，應用程式會顯示其訊息。移到另一個字詞會立即回報下一個懸停。
- `onHoverEnd()`：滑鼠離開了字詞或編輯器，或文字在其下方變更或捲動。
- `onTextPress(event)`：某個字元被按下，發生在編輯器放置游標之後：`{ position, offset, range,
  pagePosition, modifiers, clicks }`。
- `caretBounds()` 與 `rangeBounds(range)`：游標與範圍所在之處，`{ bounds, pageBounds }`（在編輯器與根視圖中）：應用程式的彈出視窗會在此開啟。

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

### 跳至定義與程式碼動作

按住 Mod（macOS 與 iOS 上為 Command，其他平台為 Control）會把滑鼠下的字詞變成連結，如同程式碼編輯器：

- 按住 Mod 於字詞上時（滑鼠停在該處時按下，或按住時滑鼠移到該處），編輯器以 `onDefinitionRequest(event)` 請求，觸發為 `"hover"`：`event` 含有其 `id`、字元的 `position` 與 `offset`，以及字詞的 `range`。當語言伺服器找到定義時，以 `presentDefinitionLink(event.id, range)` 回應：該範圍會加上底線（`definitionLink` 部分），指標在其上會變成手形。放開 Mod、滑鼠離開、文字變更或捲動，或以 `hideDefinitionLink()`，連結就會消失。最新請求的回應會顯示；較早的回應會被擱置。
- 在字詞上按住 Mod 點按時，以觸發 `"press"` 請求；點在連結上時，游標維持原位。F12（`goToDefinition`、`run("goToDefinition")`）會針對游標處的字詞請求，觸發為 `"key"`。應用程式負責前往定義：同一份文字內的定義用 `revealPosition` 與 `setSelections`，其他檔案則用應用程式自己的導覽。
- Mod+.（`showCodeActions`、`run("showCodeActions")`）會回報 `onCodeActionRequest({ range, position, bounds })`：主要選取範圍（起點在前）、游標及其方框。應用程式向其語言伺服器請求動作，在 `bounds.pageBounds` 顯示自己的選單（[`Menu`](./menu.md) 或 `Overlay`），並以 `edit(edits)` 套用所選動作的編輯。

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

## 大小與捲動

使用 `minRows` 和／或 `maxRows` 時，編輯器會隨文字增長：高度等於其列數，至少 `minRows` 列，從 `maxRows` 起其文字會捲動，如同訊息方塊或筆記本的儲存格。否則由應用程式決定其大小，而 `scrollBeyondLastLine` 讓文字可以捲動超過最後一行：最多一個螢幕（`true`，預設）、完全不行（`false`）或指定的列數。游標移動時，其周圍會保持 `cursorSurroundingLines` 列在視野內。將選取範圍拖曳超出編輯器邊緣時會繼續捲動，指標越遠，速度越快。

`showWhitespaces` 會為每個空白顯示 `·`，為每個 Tab 顯示 `→`（`whitespace` 部分），`rulers` 則在其每個欄位畫一條線（`ruler` 部分），作為一行長度的參考線。

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

<a id="methods"></a>

## 方法

`ref={editor}` 提供編輯器的方法（`EditorRef`），供應用程式的按鈕、選單與按鍵使用。會回傳值的方法（`value()`、`selections()`、`replaceAll()`、`canUndo()`、`caretBounds()`、`folds()`、……）在 JS 中回傳其 `Promise`，因此要 `await` 它們：`const text = await editor.value()`。若方法收到超出文字範圍的行（`fold`、`scrollToLine`、`goToLine`、……），不會變更任何內容，並記錄一則指出該方法與該行的警告。

| 方法 | 說明 |
|---|---|
| `focus()`、`blur()` | 取得焦點，或放棄焦點。 |
| `value()` | `Promise<string>`：文字。 |
| `setValue(value)` | 取代文字，作為可由復原取消的編輯。 |
| `insert(text)` | 在每個選取範圍處輸入 `text`，照原樣輸入（括號不會自動閉合）。 |
| `edit(edits)` | 套用 `{ range, text }` 取代項（目前文字的範圍；與較早者重疊的會被略過），作為可由復原取消的一步；選取範圍會隨周圍的文字移動。程式碼動作與格式化編輯由此處理。 |
| `selections()` | `Promise<EditorSelection[]>`：每個選取範圍，`{ anchor, head }`，主要（最新）者在最後。 |
| `setSelections(selections)` | 設定選取範圍（最後一個為主要），並將主要選取範圍捲動到視野內。 |
| `run(command)` | 執行命令，如同其按鍵所觸發（[命令](#commands)）。 |
| `replace(text)` | 取代目前的符合項並選取下一個。 |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`：將每個符合項取代為一次編輯；`{ count }`，數量。 |
| `fold(line)`、`unfold(line)` | 摺疊第 `line` 行（從 0 起）下方的行，或將其展開。 |
| `foldRecursive(line)`、`unfoldRecursive(line)` | 摺疊第 `line` 行上的摺疊及其內所有摺疊，或全部展開。 |
| `foldLevel(level)` | 摺疊巢狀層級 `level`（1：最外層）的每個摺疊。 |
| `foldRange(range)` | 摺疊 `range`（`{ startLine, endLine }`）的行，不論摺疊從何處開始。 |
| `folds()` | `Promise<EditorFoldRange[]>`：已摺疊的範圍，包含巢狀者。 |
| `setFolds(folds)` | 精確地摺疊 `folds`。 |
| `scrollToLine(line)` | 將第 `line` 行捲動到視野內，並展開遮住它的摺疊。 |
| `canUndo()`、`canRedo()` | `Promise<boolean>`：是否有可復原的編輯，或可重做的編輯。 |
| `caretBounds()` | `Promise<EditorBounds \| null>`：主要游標的方框 `{ bounds, pageBounds }`，在編輯器中（已套用其捲動）與在根視圖中；編輯器完成版面配置前為 `null`。 |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`：`range` 的方框，其涵蓋的每一列各一個。 |
| `scrollOffset()`、`setScrollOffset(offset)` | `Promise<Point>`：文字已捲動的距離；將其捲動到 `{ x, y }`。 |
| `visibleRange()` | `Promise<EditorRange>`：視區所顯示的文字，從其第一列的開頭到最後一列的結尾。 |
| `selectedText()` | `Promise<string>`：主要選取範圍的文字。 |
| `offsetToPosition(offset)`、`positionToOffset(position)` | `Promise<EditorPosition>`、`Promise<number>`：在 `value()` 的 UTF-16 偏移量與位置之間轉換。 |
| `revealPosition(position, center)` | 將 `position` 捲動到視野內並展開遮住它的摺疊；使用 `center` 時捲動到中間。 |
| `goToLine(line)` | 將游標放在第 `line` 行（從 0 起）的開頭，並捲動到中間。 |
| `showCompletions()` | 在游標處請求自動完成，其前的字詞作為查詢字串（[自動完成](#completion)）。 |
| `presentCompletions(id, items, incomplete?)` | 回應自動完成請求 `id`：清單顯示 `items`，並依之後輸入的內容篩選；使用 `incomplete` 時，繼續輸入會再次請求。沒有項目則關閉清單。 |
| `hideCompletions()` | 關閉自動完成清單。 |
| `presentInlineCompletion(id, text)`、`hideInlineCompletion()` | 以 `text` 回應行內自動完成請求 `id`，顯示在游標處；清除它。 |
| `presentDefinitionLink(id, range)`、`hideDefinitionLink()` | 回應定義請求 `id`（觸發 `"hover"`）：`range` 會加上底線作為連結（[跳至定義](#go-to-definition-and-code-actions)）；將其隱藏。 |

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

### 指令

`run` 依名稱接收編輯器的指令（`EditorCommand`）：

| 指令 | 作用 |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | 移動游標。 |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | 擴展選取範圍。 |
| `moveToMatchingBracket` | 跳到與游標處括號相配對的括號。 |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | 選取。 |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | 依單字的一部分移動或擴展選取範圍（camelCase 駝峰、snake_case 片段）。 |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | 移動或擴展至段落前或後的空白行。 |
| `expandSelection`, `shrinkSelection` | 依單位擴大選取範圍，或縮回。 |
| `undoSelection`, `redoSelection` | 回到上次移動前的選取範圍，或再次前進。 |
| `splitSelectionIntoLines` | 將每個選取範圍的每一行各設為一個選取範圍。 |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | 新增游標；回到單一選取範圍。 |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | 刪除。 |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | 行、縮排與註解。 |
| `sortLinesAscending`, `sortLinesDescending` | 排序選取的行（若僅有游標，則為每一行）。 |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | 變更選取範圍的大小寫（游標：其所在的單字）。 |
| `trimTrailingWhitespace` | 移除每一行結尾的空白字元。 |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | 重新排列。 |
| `undo`, `redo` | 復原與重做。 |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | 摺疊游標所在行，或全部摺疊。 |
| `foldRecursive`, `unfoldRecursive` | 摺疊游標所在的摺疊區塊及其內所有摺疊區塊，或將其展開。 |
| `foldSelection` | 摺疊每個跨越多行的選取範圍的各行。 |
| `findNext`, `findPrevious` | 選取 `search` 的下一個或上一個符合項目。 |
| `findWithSelection` | 將選取的文字回報給尋找列（`onFindWithSelection`）。 |
| `copy`, `cut`, `paste` | 剪貼簿。 |
| `showCompletions` | 在游標處請求自動完成（[自動完成](#completion)）。 |
| `goToDefinition` | 請求游標處單字的定義（`onDefinitionRequest`，觸發方式 `"key"`）。 |
| `showCodeActions` | 請求選取範圍的程式碼動作（`onCodeActionRequest`）。 |

<a id="styling-the-parts"></a>

## 為各部位設定樣式

`class` 與 `style` 用於設定編輯器外框的樣式。`classes` 依部位接收 Tailwind 類別，`styles` 依部位接收行內樣式；部位的類別會接在其預設樣式之後，因此優先於預設樣式，而其 `styles` 又優先於類別。字型由 `fontFamily`、`fontSize` 與 `lineHeight` 設定，編輯器以此測量文字。

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

| 部位 | 說明 | 預設值 |
|---|---|---|
| `gutter` | 行號與摺疊標記所在的欄 | 行號前 12pt，標記後 4pt |
| `lineNumber` | 每個行號 | 靠右對齊，`muted-foreground` |
| `activeLineNumber` | 有游標之行的行號，套用於 `lineNumber` 之後 | `foreground` |
| `foldMarker` | 摺疊起始行的標記 | `⌄`，摺疊時為 `›`，`muted-foreground` |
| `overviewRuler` | 沿右側邊緣的概覽尺規，當裝飾在該處有標記時顯示 | 無 |
| `content` | 邊欄旁的文字區域 | 文字前 4pt |
| `line` | 每一列文字 | |
| `activeLine` | 位於有游標之行的列後方、捲動指示器下方 | `muted`，淡色 |
| `selection` | 位於選取文字後方 | `primary` 的淡色調 |
| `caret` | 游標 | 寬 2pt，`foreground`，閃爍 |
| `composition` | 輸入法正在組字的文字 | 底線 |
| `searchMatch` | `search` 的符合項目 | 半透明琥珀色 |
| `currentSearchMatch` | 選取範圍所在的符合項目，套用於 `searchMatch` 之後 | 較濃的琥珀色 |
| `matchingBracket` | 游標處的括號及與其配對的括號 | 1pt 邊框 |
| `indentGuide` | 每個縮排層級一條參考線 | 1pt 的 `border` 線 |
| `foldPlaceholder` | 摺疊行在其文字之後顯示的內容 | ` ⋯ `，`muted-foreground` |
| `placeholder` | 文字為空時顯示 | `muted-foreground` |
| `diagnosticError` | 錯誤下方的線 | `destructive` |
| `diagnosticWarning` | 警告下方的線 | 琥珀色 |
| `diagnosticInfo` | 資訊下方的線 | 藍色 |
| `diagnosticHint` | 提示下方的線 | `muted-foreground` |
| `unnecessaryText` | `unnecessary` 診斷的文字 | `muted-foreground` |
| `deprecatedText` | `deprecated` 診斷的文字 | 刪除線 |
| `whitespace` | 空格與 Tab 的標記（`showWhitespaces`） | `·` 與 `→`，`muted-foreground` 60 % |
| `ruler` | `rulers` 的線 | 1 point 的 `border` 線 |
| `selectionHandle` | 觸控選取範圍兩端控制把手的圓鈕 | 10pt 的 `primary` 圓點 |
| `selectionHandleStart`, `selectionHandleEnd` | 起點的圓鈕（位於其行上方）與終點的圓鈕（位於下方），套用於 `selectionHandle` 之後 | |
| `completionMenu` | 自動完成清單的外框 | `popover`、1pt 的 `border`、圓角、陰影 |
| `completionItem` | 清單中的每個項目 | 一列的高度，8pt 內距 |
| `selectedCompletionItem` | 選取的項目，套用於 `completionItem` 之後 | `accent` |
| `completionMatch` | 標籤中與查詢相符的字母 | 半粗體，`primary` |
| `completionDetail` | 項目的詳細資訊，位於其標籤之後 | 靠右對齊，`muted-foreground` |
| `completionKind` | 項目的種類，位於其標籤之前 | 簡短名稱（`fn`、`var`、`cls`），`muted-foreground` |
| `completionDocumentation` | 選取項目的文件，位於清單旁 | 同 `completionMenu`，寬度最多 320pt |
| `inlineCompletion` | 游標處的行內完成 | `muted-foreground` |
| `definitionLink` | 定義連結的底線 | 文字下方 1pt 的 `primary` 線 |

<a id="props"></a>

## 屬性

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | 由應用程式控制的文字（請從 `onChange` 再次設定）。 |
| `defaultValue` | `.default_value(..)` | `string` | | 編輯器自行保存文字時的初始文字。 |
| `language` | `.language(..)` | `string` | 純文字 | 語言的名稱、別名、副檔名或檔案名稱（[語言](#languages)）。 |
| `placeholder` | `.placeholder(..)` | `string` | | 文字為空時顯示。 |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | 文字可選取與複製，但無法變更。 |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 出現時取得焦點。 |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | 邊欄的行號。 |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | 過長的行會依編輯器寬度換行。 |
| `tabSize` | `.tab_size(..)` | `number` | 該語言的預設值 | 一個 Tab 與一個縮排層級的欄數。 |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | 該語言的預設值 | 以 Tab 縮排。 |
| `folding` | `.folding(..)` | `boolean` | `true` | 縮排的行可透過邊欄標記摺疊。 |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | 依縮排 | 由應用程式提供的摺疊起點（[摺疊](#folding)）。 |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | 內建的語法醒目提示（[自訂醒目提示](#your-own-highlighting)）。 |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | 輸入時自動補上成對的括號與引號。 |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | 換行時保留縮排，並在左括號後縮排。 |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | 醒目提示有游標之行的列。 |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | 縮排參考線。 |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | 文字可捲動超過最後一行：最多一個畫面（`true`）、完全不可（`false`），或指定的列數。 |
| `fontFamily` | `.font_family(..)` | `string` | 主題的 `font-mono` | 繪製與測量文字所用的字型。 |
| `fontSize` | `.font_size(..)` | `number` | `13` | 字型大小，單位為 point。 |
| `lineHeight` | `.line_height(..)` | `number` | `20` | 一列的高度，單位為 point。 |
| `search` | `.search(..)` | `EditorSearch` | | 要尋找的內容（[尋找與取代](#find-and-replace)）。 |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | 要標記的問題（[診斷](#diagnostics)）。 |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | 由應用程式設定樣式的範圍（[裝飾](#decorations)）。 |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | 邊欄中裝飾標記區帶的寬度，單位為 point。 |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | 依部位指定的 Tailwind 類別。 |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | 依部位指定的行內樣式，優先於類別。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | 螢幕閱讀器對編輯器的稱呼。 |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | 空格與 Tab 顯示為 `·` 與 `→`。 |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | 要繪製垂直線的欄位。 |
| `minRows` | `.min_rows(..)` | `number` | | 編輯器隨文字增長，起始為此列數（[大小與捲動](#size-and-scrolling)）。 |
| `maxRows` | `.max_rows(..)` | `number` | | 編輯器隨文字增長至此列數，之後開始捲動。 |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | 游標上下方保持可見的列數。 |
| `completion` | `.completion(..)` | `boolean` | `false` | 編輯器請求建議並以清單顯示（[自動完成](#completion)）。 |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | 輸入時，還有哪些內容會觸發自動完成請求。 |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | 輸入暫停多少毫秒後，才請求行內完成。 |
| `class`, `style` | 樣式方法 | `string`, `StyleProp<ViewStyle>` | | 編輯器的外框。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | 文字已變更：`{ value }`，即完整的新文字。 |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | 選取範圍已變更：`{ selections }`，即全部選取範圍，主要選取範圍在最後。 |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | 編輯器取得或失去焦點。 |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | 搜尋的符合項目已變更：`{ result }`，一個 `{ count, current, error }`。 |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | 按下行號：`{ line }`，即該行，從 0 起算。 |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | 在文字上按下次要按鈕，或觸控選取了文字：`{ position, x, y, selection? }`。 |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | 滑鼠停留在某個字元上（[語言功能](#language-features)）。 |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | 懸停結束。 |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | 按下某個字元：附帶其所在單字、修飾鍵與點擊次數。 |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | `findWithSelection` 已執行：`{ query }`，即供尋找列查詢使用的文字。 |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | 摺疊範圍已變更：`{ folds }`，即全部範圍，包含巢狀範圍。 |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | 編輯器請求自動完成：`{ id, offset, position, query, queryStart, trigger, character? }`（[自動完成](#completion)）。 |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | 已接受並插入項目：`{ item }`。 |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | 輸入暫停：`{ id, offset, position }`，用於行內完成。 |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | 編輯器請求定義：`{ id, position, offset, range, trigger }`（[前往定義](#go-to-definition-and-code-actions)）。 |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | 使用者請求程式碼動作：`{ range, position, bounds? }`。 |

<a id="accessibility"></a>

## 無障礙功能

螢幕閱讀器以編輯器的 `accessibilityLabel` 稱呼它；其焦點行為與文字輸入相同，因此平台的文字服務（輸入法、聽寫、軟體鍵盤）都能在其中運作。

<a id="related"></a>

## 相關內容

- [TextView](./text-view.md)：Markdown 與 HTML 文件，其程式碼區塊與編輯器共用語法色彩。
- [DiffView](./diff-view.md)：兩段文字之間的差異，以編輯器的語法色彩顯示。
- [Input](./input.md)：單行與多行文字欄位，使用平台原生的編輯功能。
- [`keymap`](../modules/nsh.md#keymap)：應用程式為編輯器指令設定的按鍵。
- [`nsh/base`](../modules/nsh-base.md)：其他基礎元件。
