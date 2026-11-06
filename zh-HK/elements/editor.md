---
title: "編輯器"
description: "Editor 元件:支援語法突顯、行號、多重游標、程式碼摺疊、自動換行、尋找與取代、診斷資訊及裝飾項目的程式碼編輯器,並提供程式碼編輯器常用的快捷鍵。"
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---


# 編輯器

`Editor` 是一個代碼編輯器:支援五十多種語言的語法突出顯示、行號、多重游標、摺疊、自動換行、尋找與取代、診斷和裝飾,並配備代碼編輯器慣用的按鍵(移動和複製行、註解、縮排、輸入時自動閉合的括號和引號)。它可處理任何長度的檔案:只會建立可見的行,而突出顯示會隨每次編輯逐行更新,因此長檔案的捲動和輸入都與短檔案一樣流暢。輸入經由平台的輸入機制處理,因此輸入法(拼音、假名、組合鍵)和軟鍵盤的運作,與任何文字欄位無異。

編輯器自行負責行為,並附帶以主題 token 建構的預設外觀:主題的 `font-mono`(13pt,行高 20pt)、使用 `muted-foreground` 的行號、游標所在行背後淡淡的 `muted` 色帶、以 `primary` 淡化而成的選取範圍、使用 `border` 的縮排參考線,以及 [`TextView`](./text-view.md) 的代碼區塊所用的內建語法顏色(包括淺色和深色)。每個部分都會以應用程式的樣式覆蓋這些預設值(`classes` 和 `styles`)。Rust 以 `nsh_base::editor()` 建立編輯器,TSX 則以來自 `nsh/base` 的 `<Editor>` 建立。

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

編輯器會填滿應用程式給予它的方框(`flex-1`,即一個高度),並在方框內捲動文字:垂直方向一律可捲動;當行比方框長時可水平捲動,或使用 `softWrap` 完全不水平捲動,此時長行會按編輯器的寬度換行。

<a id="the-text"></a>

## 文字

- **受控**:傳入 `value`,並在 `onChange`(會回報完整的新文字)中重新設定。應用程式更改 `value`(載入檔案、格式化工具的輸出)時,會把文字取代為一次編輯,可由復原撤回;遠離更改處的游標和摺疊則保持原位。
- **非受控**:傳入 `defaultValue`,並從 `onChange` 或 ref 的 `value()` 讀取文字。

換行符一律為 `\n`:傳入文字中的 `\r\n` 和 `\r` 會變成 `\n`。

<a id="languages"></a>

## 語言

`language` 以名稱、別名、副檔名或檔案名稱指定語言,不分大小寫:`"rust"`、`"rs"`、`"typescript"`、`"tsx"`、`"main.go"`、`"Dockerfile"`、`"Makefile"`。它決定突出顯示、`mod+/` 切換的註解、配對和縮排的括號、輸入時自動閉合的符號對、組成單字的字元,以及預設縮排:四個空格,網頁語言(JavaScript、TypeScript、JSON、HTML、CSS、YAML 等)為兩個空格,Go 和 Makefile 則使用 Tab。`tabSize` 和 `hardTabs` 可為所有語言設定縮排。任何其他名稱都視為純文字,除非應用程式已註冊該語言([自訂語言](#your-own-languages))。

支援的語言:Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL 和 Diff。

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### 自訂語言

Rust 代碼可讓應用程式的編輯器支援更多語言,並可用自備的突出顯示器(tree-sitter grammar,或應用程式自己的解析器)為任何語言突出顯示。`register_language` 註冊一個 `EditorLanguage`:包括它的名稱、別名、副檔名和檔案名稱,以及編輯規則(註解、括號、輸入時自動閉合的符號對、單字字元、縮排),並以 `syntax` 指定用來突出顯示它的內建 grammar。`register_highlighter` 為任何語言(內建或已註冊)指定應用程式的突出顯示器:即實作 `EditorHighlighter` 的型別,它會接收每次編輯(行、位元組和位置,格式與 tree-sitter 的編輯相同),並在時間預算內於 UI 執行緒以外的地方提供每一行的 token(`EditorToken`,或透過 `EditorToken::from_scope` 提供 tree-sitter capture 或 TextMate scope)。編輯器會保存這些 token,在文字被編輯時讓它們隨文字移動,並像對待內建突出顯示器一樣,再次為可見的行索取 token。`language` 會先找出已註冊的語言(依名稱、別名、副檔名或路徑),在編輯器和 diff 檢視中皆然。

每個引擎各自保存自己的語言。Rust 應用程式須在掛載編輯器之前,於其根部註冊這些語言;對於 TSX 應用程式,則由應用程式的 crate 在其 UI set 的設定階段註冊,而每個運行該應用程式的引擎都會先呼叫這個設定。

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

編輯器的運作方式與一般代碼編輯器相同:

- **多重游標。** Alt-click(Option-click)可新增游標,`mod+d` 選取選取範圍的下一個出現位置,`mod+shift+l` 選取所有出現位置,而新增游標的按鍵則在上一行或下一行新增游標。輸入、刪除、移動和每個指令都會在每個游標處執行;按 Escape 會回到單一游標。`undoSelection`(`cmd+u`、`ctrl+u`)會回到上一次移動之前的選取範圍。
- **選取範圍逐級擴展**,可用 `expandSelection`(`ctrl+shift+cmd+right`、`shift+alt+right`)按單位擴展:單字、字串的內容與整個字串、括號對的內容與整個括號對、整行、整段文字;`shrinkSelection` 則以相同方式逐級縮回。`splitSelectionIntoLines`(`shift+alt+i`)會把跨越多行的選取範圍變成每行一個選取範圍。
- **縮排。** 新的一行會沿用該行的縮排,並在左括號之後增加一級縮排(Python 的 `:`、Ruby 的 `do` 等);在一對括號之間按 Enter,會把右括號放到獨立的一行。Tab 和 Shift+Tab 可縮排和取消縮排所選的行;在前導空格中按 Backspace 會回到上一個縮排停駐點。`autoIndent` 可關閉此行為。
- **括號和引號** 會在輸入時自動閉合,可包住選取範圍,並在再次輸入右括號或右引號時跳過已有的那一個(`autoClose`)。游標所在的括號及其配對括號會以外框標示。
- **復原** 會撤回整段輸入:一個單字、一次刪除、一個指令。移動或按下滑鼠會開始新的一步。
- **摺疊。** 後面接著縮排更深的行的一行,可把那些行摺疊起來,並在邊欄顯示標記:`⌄` 摺疊,`›` 和該行之後的 `⋯` 展開。游標移入摺疊範圍時會將其展開([摺疊](#folding))。
- **按下操作。** 使用指標裝置時,按一下會放置游標,按兩下選取單字,按三下選取整行,Shift-click 擴展選取範圍,拖曳則依按下時選取的單位進行選取。Alt+Shift 拖曳(Option+Shift;Linux 上亦可用 Control+Alt)會選取區塊:每行一個選取範圍,位於相同的欄之間,並會延伸越過較短行的行尾。在觸控螢幕上,輕按一下會放置游標,輕按兩下或長按會選取手指下的單字,而選取範圍兩端的控點可隨手指拖曳移動各端(控點周圍的文字仍會捲動)。
- **剪貼簿。** 沒有選取範圍時複製和剪下,會取得游標所在的整行,貼上時這些內容會以整行形式貼到游標所在行的上方。

`readOnly` 會保持文字原樣,同時仍可選取、搜尋和複製。

<a id="keys"></a>

## 按鍵

編輯器的按鍵只在其取得焦點時有效;其他輸入元件保留各自的按鍵。`mod` 在 macOS 和 iOS 上是 Command,在其他平台是 Control(`keymap` 的按鍵操作)。

| 按鍵(macOS) | 按鍵(Windows、Linux) | 指令 |
|---|---|---|
| 方向鍵,配合 Shift 選取 | 方向鍵,配合 Shift 選取 | 按字元和行移動 |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | 按單字移動 |
| `cmd+left` / `cmd+right`、`home` / `end`、`ctrl+a` / `ctrl+e` | `home` / `end` | 行的第一個非空白字元(再按則到行首)/ 行尾 |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | 文字的開頭 / 結尾 |
| `pageup` / `pagedown` | `pageup` / `pagedown` | 向上 / 向下一頁 |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | 向左 / 向右刪除一個單字 |
| `cmd+backspace` / `cmd+delete`、`ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | 刪除至行首 / 行尾 |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`、`ctrl+y` | 復原 / 重做 |
| `cmd+a` | `ctrl+a` | 全選 |
| `cmd+l` | `ctrl+l` | 選取整行(再按:連同下一行) |
| `cmd+d` | `ctrl+d` | 選取下一個出現位置 |
| `cmd+shift+l` | `ctrl+shift+l` | 選取所有出現位置 |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | 在上方 / 下方新增游標 |
| `escape` | `escape` | 回到單一選取範圍 |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | 向上 / 向下移動行 |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | 向上 / 向下複製行 |
| `cmd+shift+k` | `ctrl+shift+k` | 刪除行 |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | 在下方 / 上方新增一行 |
| `tab` / `shift+tab`、`cmd+]` / `cmd+[` | `tab` / `shift+tab`、`ctrl+]` / `ctrl+[` | 縮排 / 取消縮排 |
| `cmd+/` | `ctrl+/` | 切換行註解 |
| `cmd+shift+\` | `ctrl+shift+\` | 跳到配對的括號 |
| `ctrl+j` | `ctrl+j` | 合併行 |
| `ctrl+t` | | 對調游標前後的字元 |
| `ctrl+alt+left` / `ctrl+alt+right`,配合 Shift 選取 | | 按單字的部分移動(camelCase、snake_case) |
| `shift+alt+a` | `shift+alt+a` | 切換區塊註解 |
| `shift+alt+i` | `shift+alt+i` | 把選取範圍拆分為多行 |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | 擴展 / 縮小選取範圍 |
| `cmd+u` | `ctrl+u` | 回到上一個選取範圍 |
| `cmd+g` / `cmd+shift+g`、`f3` / `shift+f3` | `f3` / `shift+f3` | 尋找下一個 / 上一個符合項 |
| `cmd+e` | | 尋找選取內容(`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | 摺疊 / 展開游標所在行 |
| `f12` | `f12` | 跳到游標處的定義(`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | 選取範圍處的 code actions(`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | 複製 / 剪下 / 貼上 |

macOS 和 iOS 還支援 Cocoa 的文字按鍵:`ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` 用於移動,`ctrl+h` / `ctrl+d` 用於刪除。

沒有預設按鍵的指令以及應用程式自訂的指令,會使用應用程式以 [`keymap`](../modules/nsh.md#keymap) 綁定的按鍵,並透過 ref 的 `run` 執行:

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

`search` 是要尋找的內容:`{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`。符合項會被突出顯示,選取範圍所在的那一個會更為顯眼,而 `onSearchChange` 會回報 `{ result }`,即一個 `{ count, current, error }`:符合項的數量、選取範圍位於哪一個(從 0 開始),以及正規表達式無效的原因。`findNext` 和 `findPrevious` 會選取下一個和上一個符合項,並會循環回繞;`replace(text)` 會取代目前的符合項並選取下一個,`replaceAll(text)` 則把所有符合項作為一次編輯取代,並回傳 `{ count }`,即取代的數量。正規表達式的取代內容以 `$1` 和 `${name}` 引用其群組。

`inSelection` 只會在開啟時已選取的範圍內尋找(若沒有選取內容,則為游標所在的行):只要它保持開啟,這個範圍就會在編輯過程中保持不變,選取範圍則由一個符合項移到另一個。`findWithSelection`(macOS 上為 `cmd+e`)會以 `onFindWithSelection` 回報所選的文字或游標處的單字,供尋找列用作搜尋內容。

尋找列由應用程式自行提供:

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

`diagnostics` 標示語言伺服器或 linter 所回報的問題:在每個範圍下方以細波浪底線標示,顏色按嚴重程度而定(`error`、`warning`、`info`、`hint`)。位置以行和 UTF-16 欄表示(從 0 開始),與語言伺服器相同,因此其診斷可原樣傳入。在應用程式傳入新的診斷之前,標記會在使用者輸入時留在原本的文字上;顯示訊息(清單、行上的懸停卡片)則由應用程式負責。

診斷也帶有語言伺服器 `Diagnostic` 的其餘欄位。其 `tags` 會像語言用戶端一般繪製文字:`unnecessary` 代碼(未使用的變數、無法到達的代碼)會淡化,`deprecated` 代碼則加上刪除線,涵蓋 `unnecessaryText` 和 `deprecatedText` 部分;帶有標籤的 hint 只會顯示其文字。`codeDescription.href` 是說明其代碼(例如 lint 規則)的頁面,`relatedInformation` 則列出其他說明此診斷的位置(`{ location: { uri?, range }, message }`):懸停時兩者都會交給應用程式,由應用程式在其懸停卡片中顯示並開啟該頁面。語言伺服器會以數字傳送標籤(`1`、`2`);編輯器會接受它們的名稱。

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

`decorations` 為應用程式所選的範圍設定樣式:來自語言伺服器的語意突出顯示、正在執行的語句、審閱時更改過的行。裝飾的 `class` 和 `style` 為其文字設定樣式;`lineClass` 和 `lineStyle` 則為其所在行的列設定樣式,位於文字後方。與診斷一樣,在應用程式設定新的裝飾之前,它們會在編輯過程中留在原本的文字上。

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

### 邊欄與概覽尺標記

裝飾的 `gutter` 會在行號前的欄帶中，於其範圍涵蓋的每一行旁邊加上標記：例如版本控制 diff 新增或修改的行，或斷點（空範圍涵蓋它所在的行，`lineClass` 亦然）。使用 `placement: "before"` 時，標記是橫跨欄帶的一條線，位於範圍起點之前的邊界，表示有行被刪除。欄帶寬 `gutterDecorationsWidth` 點（預設為 3），只要有裝飾帶有邊欄標記便會保留，因此標記出現或消失時，文字的位置都不會移動。摺疊內的範圍會標記在該摺疊所在的列上。

裝飾的 `overviewRuler` 會在概覽尺上加上標記。概覽尺是編輯器右邊緣的欄帶，寬 14 點（與捲動軸相同；`overviewRuler` 部分可設定其他寬度），把整段文字對應到其高度，與 Monaco 的做法一樣。標記高度至少 6 點，佔概覽尺的一個 `lane`：`left`、`center`（預設）、`right` 或 `full`。只要有裝飾在該處帶有標記，概覽尺便會顯示。

每個標記採用應用程式的 `class` 和 `style`，沒有它們時以前景色繪製。兩者都會像裝飾的範圍一樣隨編輯而移動；若編輯刪除了已標記的範圍，原處會留下一個空範圍。

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

### 自訂語法突顯

裝飾的 `token` 會以內建語法突顯為該類 token 上色的方式為其文字上色（`comment`、`keyword`、`string`、`number`、`title`、`attr`、`built`、`deletion`），取代內建突顯器在該處找到的結果：應用程式自己的突顯器（語言伺服器的 semantic tokens，或自行編寫的解析器）把其 token 對應到這些類別，便能在淺色和深色模式下得到編輯器的顏色。最內層裝飾的 token 優先；`class` 和 `style` 會套用在其上。`highlighting={false}` 會關閉內建突顯器，讓文字只由應用程式的 token 上色，而 `language` 仍會決定註解、括號和縮排。

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

摺疊從縮排比上一行深的行開始。`foldRanges` 則改為向編輯器提供應用程式自己的範圍（`{ startLine, endLine }`，即語言伺服器摺疊範圍的格式，原樣傳入）：第 `startLine` 行顯示摺疊，其後直至 `endLine` 的各行會被摺起。在應用程式傳入新的範圍之前，它們會在編輯過程中停留在原來的行上。

摺疊可以巢狀：摺疊一個區塊時，其內的摺疊會保持摺起，因此展開該區塊時會看到它們原來的狀態。`foldRecursive` 會摺疊一個區塊及其內所有區塊，`unfoldRecursive` 會全部展開，`foldLevel(n)` 會摺疊巢狀層級 `n` 的每個區塊，`foldSelection`（或 `foldRange(range)`）會摺疊任何行，不論摺疊從哪裡開始。`onFoldChange` 在每次變更後回報已摺疊的範圍，`folds()` / `setFolds(ranges)` 則讀取和還原它們，以便與檔案一併保存。

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

## 斷點與快捷選單

按下行號會回報 `onLineNumberPress({ line })`，這是應用程式以裝飾繪製斷點的位置。次要按鈕（右鍵點按，Mac 上為 Control 加點按）會回報 `onContextMenu({ position, x, y })`：即指標下文字中的位置，以及根視圖中的點，應用程式在該處開啟自己的選單。在觸控螢幕上，長按、雙擊、放開控點和點按選取範圍同樣會回報它，並附帶 `selection`：選取範圍在根視圖中的方框（`{ x, y, width, height }`），以及位於其頂部中間的 `x` / `y`，供編輯選單使用。

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

建議、懸停資訊、跳至定義和程式碼操作來自應用程式的語言伺服器。編輯器自行繪製補全清單、行內補全和定義連結，並處理它們的按鍵；其餘部分，編輯器會向應用程式提供時機和位置，由應用程式繪製彈出視窗（錨定在 `pageBounds` 上的 [`Overlay`](./overlay.md)）。

<a id="completion"></a>

### 補全

設定 `completion` 後，編輯器會向應用程式索取建議，並以清單顯示在正在輸入的單詞下方（接近視窗底部時則顯示在上方）：

- 在單詞末尾輸入字母、數字或 `_` 時，會以 `onCompletionRequest(event)` 發出請求，觸發方式為 `"typing"`：`event` 含有其 `id`、插入點的 `offset` 和 `position`、`query`（至目前為止輸入的單詞）以及其起始的 `queryStart` 偏移量。`completionTriggerCharacters`（`["."]`、`["::", "<"]`）中的每一個之後，會以空查詢發出請求，觸發方式為 `"character"`（以及 `character`），而 `showCompletions()` 或 `run("showCompletions")` 會在插入點處發出請求，觸發方式為 `"invoked"`。
- 應用程式以 `presentCompletions(event.id, items)` 回應。每個項目採用語言伺服器的 `CompletionItem` 格式：`label`，並可選用 `kind`（`"function"`、`"variable"`、`"class"` 等）、`detail`、`documentation`、`insertText`、`filterText`、`sortText` 和 `range`。只會顯示最新請求的回應；較早的回應，或針對插入點已離開的單詞的回應，會被擱置。
- 繼續輸入會就地篩選清單：查詢字串以按順序出現的字母（不分大小寫）比對每個項目的 `filterText`（否則比對其 label），以查詢開頭的單詞排在最前，其次是最接近的匹配，再按 `sortText` 排序。匹配的字母會突出顯示。傳入 `incomplete: true`（`presentCompletions(id, items, true)`）可讓編輯器在繼續輸入時再次請求。
- 上、下方向鍵（以及 Control+P / Control+N）在清單中移動，Page Up 和 Page Down 按頁移動，Enter 和 Tab 接受，Escape 關閉。指標會標示項目，點按（觸控螢幕上為輕觸）即接受。所選項目的 `documentation` 會顯示在清單旁邊。
- 接受時，會把項目的 `range`（否則為查詢字串）替換為其 `insertText`（否則為其 label），作為可由復原還原的一個步驟，套用於插入點，以及前面有相同文字的每個其他插入點，並回報 `onCompletionAccept({ item })`。
- 清單會在插入點離開單詞、輸入空格或其他標點、編輯器失去焦點，以及插入點捲出視野時關閉。

輸入暫停（`inlineCompletionDelay`，預設 300 毫秒）而沒有顯示清單時，會請求行內補全：`onInlineCompletionRequest({ id, offset, position })`。`presentInlineCompletion(id, text)` 以柔和的顏色在插入點顯示 `text`，Tab 會插入它，而 Escape、編輯或移動則會清除它。

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

- `onHover(event)`：滑鼠停在某個字元上且沒有按下任何按鈕（桌面和網頁；拖曳會選取文字）。`event` 含有其 `position`、UTF-16 `offset`、其單詞的 `range`、指標的 `pagePosition`、單詞的 `pageBounds`、按住的 `modifiers` 以及該處的 `diagnostics`，應用程式會顯示其訊息。移到另一個單詞時會立即回報下一次懸停。
- `onHoverEnd()`：滑鼠離開了單詞或編輯器，或文字在其下變更或捲動。
- `onTextPress(event)`：按下了某個字元，在編輯器放置插入點之後：`{ position, offset, range, pagePosition, modifiers, clicks }`。
- `caretBounds()` 和 `rangeBounds(range)`：插入點和範圍所在之處，`{ bounds, pageBounds }`（在編輯器和根視圖中）：應用程式的彈出視窗在該處開啟。

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

### 跳至定義與程式碼操作

按住 Mod（macOS 和 iOS 上為 Command，其他平台為 Control）會把滑鼠下的單詞變成連結，與程式碼編輯器一樣：

- 在單詞上按住 Mod（滑鼠停在該處時按下，或按住 Mod 把滑鼠移到該處），編輯器會以 `onDefinitionRequest(event)` 請求，觸發方式為 `"hover"`：`event` 含有其 `id`、字元的 `position` 和 `offset`，以及單詞的 `range`。語言伺服器找到定義時，以 `presentDefinitionLink(event.id, range)` 回應：該範圍會加上底線（`definitionLink` 部分），指標在其上變為手形。放開 Mod、滑鼠離開、文字變更或捲動，或使用 `hideDefinitionLink()`，連結便會消失。只會顯示最新請求的回應；較早的回應會被擱置。
- 按住 Mod 點按單詞會以觸發方式 `"press"` 請求；在連結上點按時，插入點保持原位。F12（`goToDefinition`、`run("goToDefinition")`）會為插入點處的單詞請求，觸發方式為 `"key"`。應用程式負責跳至定義：同一文字內的定義使用 `revealPosition` 和 `setSelections`，另一個檔案則使用應用程式自己的導覽。
- Mod+.（`showCodeActions`、`run("showCodeActions")`）會回報 `onCodeActionRequest({ range, position, bounds })`：主要選取範圍（起點在前）、插入點及其方框。應用程式向語言伺服器索取操作，在 `bounds.pageBounds` 顯示其選單（[`Menu`](./menu.md) 或 `Overlay`），並以 `edit(edits)` 套用所選操作的編輯。

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

設定 `minRows` 和／或 `maxRows` 時，編輯器會隨文字增高：高度等於其列數，至少 `minRows` 列，從 `maxRows` 起其文字會捲動，就像訊息方塊或筆記本的儲存格一樣。否則由應用程式決定大小，而 `scrollBeyondLastLine` 讓文字可捲動超過最後一行：最多一個螢幕高度（`true`，預設）、完全不可（`false`），或指定列數。插入點移動時，其周圍會保持 `cursorSurroundingLines` 列在視野內。把選取範圍拖出編輯器邊緣會繼續捲動，指標愈遠，速度愈快。

`showWhitespaces` 為每個空格顯示 `·`，為每個定位字元顯示 `→`（`whitespace` 部分），而 `rulers` 會在其各個欄位畫一條線（`ruler` 部分），作為一行長度的參考線。

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

`ref={editor}` 提供編輯器的方法（`EditorRef`），供應用程式的按鈕、選單和按鍵使用。會傳回值的方法（`value()`、`selections()`、`replaceAll()`、`canUndo()`、`caretBounds()`、`folds()` 等）在 JS 中會傳回該值的 `Promise`，所以要對它們 `await`：`const text = await editor.value()`。若方法收到超出文字範圍的行（`fold`、`scrollToLine`、`goToLine` 等），不會有任何改動，並會記錄一則警告，指出方法名稱和該行。

| 方法 | 說明 |
|---|---|
| `focus()`, `blur()` | 取得焦點，或放棄焦點。 |
| `value()` | `Promise<string>`：文字。 |
| `setValue(value)` | 替換文字，作為可由復原還原的編輯。 |
| `insert(text)` | 在每個選取範圍處輸入 `text`，原樣輸入（括號不會自動閉合）。 |
| `edit(edits)` | 套用 `{ range, text }` 替換（目前文字的範圍；與較早者重疊的會被略過），作為可由復原還原的一個步驟；選取範圍會隨周圍文字移動。程式碼操作和格式化的編輯都在這裡處理。 |
| `selections()` | `Promise<EditorSelection[]>`：每個選取範圍，`{ anchor, head }`，主要（最新）的排在最後。 |
| `setSelections(selections)` | 設定選取範圍（最後一個為主要），並把主要選取範圍捲動到視野內。 |
| `run(command)` | 執行命令，效果與其按鍵相同（[命令](#commands)）。 |
| `replace(text)` | 替換目前的匹配並選取下一個。 |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`：以一次編輯替換所有匹配；`{ count }`，匹配數目。 |
| `fold(line)`, `unfold(line)` | 摺疊第 `line` 行（從 0 起）之下的行，或將其展開。 |
| `foldRecursive(line)`, `unfoldRecursive(line)` | 摺疊第 `line` 行的摺疊及其內所有摺疊，或全部展開。 |
| `foldLevel(level)` | 摺疊巢狀層級 `level`（1：最外層）的每個摺疊。 |
| `foldRange(range)` | 摺疊 `range`（`{ startLine, endLine }`）的行，不論摺疊從哪裡開始。 |
| `folds()` | `Promise<EditorFoldRange[]>`：已摺疊的範圍，包括巢狀的。 |
| `setFolds(folds)` | 精確摺疊 `folds`。 |
| `scrollToLine(line)` | 把第 `line` 行捲動到視野內，並展開遮住它的摺疊。 |
| `canUndo()`, `canRedo()` | `Promise<boolean>`：是否有可復原或可重做的編輯。 |
| `caretBounds()` | `Promise<EditorBounds \| null>`：主要插入點的方框，`{ bounds, pageBounds }`，在編輯器中（已套用其捲動）及根視圖中；編輯器完成版面配置前為 `null`。 |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`：`range` 的方框，所涵蓋的每一列一個。 |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>`：文字已捲動多遠；把它捲動到 `{ x, y }`。 |
| `visibleRange()` | `Promise<EditorRange>`：視口顯示的文字，從其第一列的開頭到最後一列的結尾。 |
| `selectedText()` | `Promise<string>`：主要選取範圍的文字。 |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`、`Promise<number>`：在 `value()` 的 UTF-16 偏移量與位置之間。 |
| `revealPosition(position, center)` | 把 `position` 捲動到視野內，並展開遮住它的摺疊；使用 `center` 時捲到中間。 |
| `goToLine(line)` | 把插入點放在第 `line` 行（從 0 起）的開頭，並捲動到中間。 |
| `showCompletions()` | 在插入點請求補全，其前的單詞為查詢字串（[補全](#completion)）。 |
| `presentCompletions(id, items, incomplete?)` | 回應補全請求 `id`：清單顯示 `items`，並按其後輸入的內容篩選；使用 `incomplete` 時，繼續輸入會再次請求。沒有項目則關閉清單。 |
| `hideCompletions()` | 關閉補全清單。 |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | 以 `text` 回應行內補全請求 `id`，在插入點顯示；清除它。 |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | 回應定義請求 `id`（觸發方式 `"hover"`）：`range` 會以連結加上底線（[跳至定義](#go-to-definition-and-code-actions)）；隱藏它。 |

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

`run` 按名稱接受編輯器的指令（`EditorCommand`）：

| 指令 | 作用 |
|---|---|
| `moveLeft`、`moveRight`、`moveUp`、`moveDown`、`moveWordLeft`、`moveWordRight`、`moveLineStart`、`moveLineEnd`、`movePageUp`、`movePageDown`、`moveDocumentStart`、`moveDocumentEnd` | 移動游標。 |
| `selectLeft`、`selectRight`、`selectUp`、`selectDown`、`selectWordLeft`、`selectWordRight`、`selectLineStart`、`selectLineEnd`、`selectPageUp`、`selectPageDown`、`selectDocumentStart`、`selectDocumentEnd` | 延伸選取範圍。 |
| `moveToMatchingBracket` | 跳至與游標所在括號配對的括號。 |
| `selectAll`、`selectLine`、`selectWord`、`selectNextOccurrence`、`selectPreviousOccurrence`、`selectAllOccurrences` | 選取。 |
| `moveSubwordLeft`、`moveSubwordRight`、`selectSubwordLeft`、`selectSubwordRight` | 按單字的一部分移動或延伸（camelCase 的駝峰、snake_case 的各段）。 |
| `moveParagraphUp`、`moveParagraphDown`、`selectParagraphUp`、`selectParagraphDown` | 移動或延伸至段落前或後的空行。 |
| `expandSelection`、`shrinkSelection` | 按單位擴大選取範圍，或還原。 |
| `undoSelection`、`redoSelection` | 返回上一次移動前的選取範圍，或再次前進。 |
| `splitSelectionIntoLines` | 將每個選取範圍的每一行各變成一個選取範圍。 |
| `addCaretAbove`、`addCaretBelow`、`singleSelection` | 新增游標；返回單一選取範圍。 |
| `deleteBackward`、`deleteForward`、`deleteWordLeft`、`deleteWordRight`、`deleteToLineStart`、`deleteToLineEnd`、`deleteLine` | 刪除。 |
| `newline`、`newlineBelow`、`newlineAbove`、`indent`、`outdent`、`toggleComment`、`toggleBlockComment` | 行、縮排和註解。 |
| `sortLinesAscending`、`sortLinesDescending` | 排序所選的行（只有游標時，則排序每一行）。 |
| `transformToUppercase`、`transformToLowercase`、`transformToTitleCase` | 更改選取內容的大小寫（只有游標時，則更改游標所在的單字）。 |
| `trimTrailingWhitespace` | 移除每一行末尾的空白字元。 |
| `moveLinesUp`、`moveLinesDown`、`duplicateLinesUp`、`duplicateLinesDown`、`joinLines`、`transposeCharacters` | 重新排列。 |
| `undo`、`redo` | 復原和重做。 |
| `fold`、`unfold`、`foldAll`、`unfoldAll` | 摺疊游標所在行，或摺疊全部。 |
| `foldRecursive`、`unfoldRecursive` | 摺疊游標所在的摺疊區及其內所有摺疊區，或將它們展開。 |
| `foldSelection` | 摺疊每個跨越多行的選取範圍所包含的行。 |
| `findNext`、`findPrevious` | 選取 `search` 的下一個或上一個符合項目。 |
| `findWithSelection` | 向尋找列回報所選文字（`onFindWithSelection`）。 |
| `copy`、`cut`、`paste` | 剪貼簿。 |
| `showCompletions` | 在游標處要求自動完成建議（[自動完成](#completion)）。 |
| `goToDefinition` | 要求游標所在單字的定義（`onDefinitionRequest`，觸發方式 `"key"`）。 |
| `showCodeActions` | 要求選取範圍的程式碼操作（`onCodeActionRequest`）。 |

<a id="styling-the-parts"></a>

## 為各部分設定樣式

`class` 和 `style` 為編輯器的外框設定樣式。`classes` 按部分接受 Tailwind class，`styles` 則按部分接受行內樣式；某部分的 class 排在其自身預設樣式之後，因此優先於預設樣式，而其 `styles` 又優先於其 class。字型以 `fontFamily`、`fontSize` 和 `lineHeight` 設定，編輯器依此量度文字。

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

| 部分 | 說明 | 預設值 |
|---|---|---|
| `gutter` | 顯示行號和摺疊標記的欄 | 行號前 12pt，標記後 4pt |
| `lineNumber` | 每個行號 | 靠右對齊，`muted-foreground` |
| `activeLineNumber` | 有游標的行的行號，套用於 `lineNumber` 之後 | `foreground` |
| `foldMarker` | 摺疊起始行的標記 | `⌄`，摺疊時 `›`，`muted-foreground` |
| `overviewRuler` | 沿右邊緣的概覽尺，當有裝飾項目在該處留有標記時顯示 | 無 |
| `content` | 位於行號欄旁的文字區域 | 文字前 4pt |
| `line` | 每一行文字 | |
| `activeLine` | 有游標的行的底層，位於捲動指示器之下 | `muted`，淡色 |
| `selection` | 所選文字的底層 | `primary` 的淡色調 |
| `caret` | 游標 | 2pt 闊，`foreground`，閃爍 |
| `composition` | 輸入法正在組字的文字 | 加底線 |
| `searchMatch` | `search` 的符合項目 | 半透明琥珀色 |
| `currentSearchMatch` | 選取範圍所在的符合項目，套用於 `searchMatch` 之後 | 較深的琥珀色 |
| `matchingBracket` | 游標處的括號及其配對括號 | 1pt 邊框 |
| `indentGuide` | 每個縮排層級一條參考線 | `border` 的 1pt 線 |
| `foldPlaceholder` | 摺疊行在其文字之後顯示的內容 | ` ⋯ `、`muted-foreground` |
| `placeholder` | 文字為空時顯示 | `muted-foreground` |
| `diagnosticError` | 錯誤下方的線 | `destructive` |
| `diagnosticWarning` | 警告下方的線 | 琥珀色 |
| `diagnosticInfo` | 資訊下方的線 | 藍色 |
| `diagnosticHint` | 提示下方的線 | `muted-foreground` |
| `unnecessaryText` | `unnecessary` 診斷的文字 | `muted-foreground` |
| `deprecatedText` | `deprecated` 診斷的文字 | 加刪除線 |
| `whitespace` | 空格和 Tab 的標記（`showWhitespaces`） | `·` 和 `→`，`muted-foreground` 於 60 % |
| `ruler` | `rulers` 的線 | `border` 的 1 point 線 |
| `selectionHandle` | 觸控選取範圍兩端把手的圓鈕 | `primary` 的 10pt 圓點 |
| `selectionHandleStart`、`selectionHandleEnd` | 起點的圓鈕（在其行之上）和終點的圓鈕（在其行之下），套用於 `selectionHandle` 之後 | |
| `completionMenu` | 自動完成清單的外框 | `popover`、1pt `border`、圓角、陰影 |
| `completionItem` | 清單的每個項目 | 一行的高度，8pt 內距 |
| `selectedCompletionItem` | 所選項目，套用於 `completionItem` 之後 | `accent` |
| `completionMatch` | 標籤中與查詢相符的字母 | 半粗體，`primary` |
| `completionDetail` | 項目的詳細資料，位於其標籤之後 | 靠右對齊，`muted-foreground` |
| `completionKind` | 項目的種類，位於其標籤之前 | 簡短名稱（`fn`、`var`、`cls`），`muted-foreground` |
| `completionDocumentation` | 所選項目的文件說明，顯示於清單旁 | 與 `completionMenu` 相同，最闊 320pt |
| `inlineCompletion` | 游標處的行內自動完成 | `muted-foreground` |
| `definitionLink` | 定義連結的底線 | 文字下方 `primary` 的 1pt 線 |

<a id="props"></a>

## 屬性

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | 文字，由應用程式控制（從 `onChange` 再次設定）。 |
| `defaultValue` | `.default_value(..)` | `string` | | 初始文字，適用於編輯器自行保存文字的情況。 |
| `language` | `.language(..)` | `string` | 純文字 | 語言的名稱、別名、副檔名或檔案名稱（[語言](#languages)）。 |
| `placeholder` | `.placeholder(..)` | `string` | | 文字為空時顯示。 |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | 文字可選取和複製，但不可更改。 |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 出現時取得焦點。 |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | 行號欄的行號。 |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | 長行按編輯器的闊度換行。 |
| `tabSize` | `.tab_size(..)` | `number` | 該語言的設定 | 一個 Tab 和一個縮排層級的欄數。 |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | 該語言的設定 | 以 Tab 縮排。 |
| `folding` | `.folding(..)` | `boolean` | `true` | 縮排的行可用行號欄的標記摺疊。 |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | 按縮排 | 摺疊的起點位置，由應用程式決定（[摺疊](#folding)）。 |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | 內建的語法醒目顯示（[自訂語法醒目顯示](#your-own-highlighting)）。 |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | 輸入時自動補上括號和引號的另一半。 |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | 新的一行會保留縮排，並在左括號後縮排。 |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | 醒目顯示有游標的行。 |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | 縮排參考線。 |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | 文字可捲動超過最後一行：最多一個畫面（`true`）、完全不可（`false`），或指定的行數。 |
| `fontFamily` | `.font_family(..)` | `string` | 主題的 `font-mono` | 繪製和量度文字所用的字型。 |
| `fontSize` | `.font_size(..)` | `number` | `13` | 字型大小，單位為 point。 |
| `lineHeight` | `.line_height(..)` | `number` | `20` | 每一行的高度，單位為 point。 |
| `search` | `.search(..)` | `EditorSearch` | | 要尋找的內容（[尋找與取代](#find-and-replace)）。 |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | 要標示的問題（[診斷](#diagnostics)）。 |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | 由應用程式設定樣式的範圍（[裝飾](#decorations)）。 |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | 行號欄中顯示裝飾項目標記的區域闊度，單位為 point。 |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | 按部分設定的 Tailwind class。 |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | 按部分設定的行內樣式，優先於 class。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | 螢幕閱讀器對編輯器的稱呼。 |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | 空格和 Tab 分別顯示為 `·` 和 `→`。 |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | 在這些欄位置繪製垂直線。 |
| `minRows` | `.min_rows(..)` | `number` | | 編輯器隨文字增長，由這個行數開始（[大小與捲動](#size-and-scrolling)）。 |
| `maxRows` | `.max_rows(..)` | `number` | | 編輯器隨文字增長，最多至這個行數，之後便會捲動。 |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | 在游標上方和下方保持可見的行數。 |
| `completion` | `.completion(..)` | `boolean` | `false` | 編輯器要求建議並以清單顯示（[自動完成](#completion)）。 |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | 輸入時還有哪些字元會觸發自動完成要求。 |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | 停止輸入多少毫秒後，才要求行內自動完成。 |
| `class`、`style` | 樣式方法 | `string`、`StyleProp<ViewStyle>` | | 編輯器的外框。 |

<a id="events"></a>

## 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | 文字已更改：`{ value }`，即完整的新文字。 |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | 選取範圍已更改：`{ selections }`，即所有選取範圍，主要選取範圍在最後。 |
| `onFocus`、`onBlur` | `.on_focus(\|\| ..)`、`.on_blur(\|\| ..)` | 編輯器取得或失去焦點。 |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | 搜尋的符合項目已更改：`{ result }`，即一個 `{ count, current, error }`。 |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | 按下了行號：`{ line }`，即該行，由 0 開始計算。 |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | 在文字上按下次要按鈕，或觸控選取了文字：`{ position, x, y, selection? }`。 |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | 滑鼠停留在某個字元上（[語言功能](#language-features)）。 |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | 停留結束。 |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | 按下了某個字元：附帶其單字、修飾鍵和點按次數。 |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | `findWithSelection` 已執行：`{ query }`，即供尋找列查詢使用的文字。 |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | 摺疊範圍已更改：`{ folds }`，即所有摺疊範圍，包括巢狀的摺疊範圍。 |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | 編輯器要求自動完成建議：`{ id, offset, position, query, queryStart, trigger, character? }`（[自動完成](#completion)）。 |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | 已接受並插入一個項目：`{ item }`。 |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | 輸入暫停：`{ id, offset, position }`，用於行內自動完成。 |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | 編輯器要求定義：`{ id, position, offset, range, trigger }`（[跳至定義](#go-to-definition-and-code-actions)）。 |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | 使用者要求程式碼操作：`{ range, position, bounds? }`。 |

<a id="accessibility"></a>

## 無障礙功能

螢幕閱讀器以編輯器的 `accessibilityLabel` 稱呼它；其焦點與文字輸入欄相同，因此平台的文字服務（輸入法、語音輸入、軟鍵盤）都可在其中使用。

<a id="related"></a>

## 相關內容

- [TextView](./text-view.md)：Markdown 和 HTML 文件，其程式碼區塊與編輯器共用語法顏色。
- [DiffView](./diff-view.md)：兩段文字之間的差異，使用編輯器的語法顏色。
- [Input](./input.md)：單行和多行文字欄位，使用平台原生的編輯功能。
- [`keymap`](../modules/nsh.md#keymap)：應用程式為編輯器指令設定的按鍵。
- [`nsh/base`](../modules/nsh-base.md)：其他基礎元件。
