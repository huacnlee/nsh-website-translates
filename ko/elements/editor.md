---
title: "Editor"
description: "Editor 컴포넌트: 구문 강조, 줄 번호, 다중 캐럿, 코드 접기, 자동 줄 바꿈, 찾기 및 바꾸기, 진단, 장식(decorations), 그리고 코드 에디터의 단축키를 지원하는 코드 에디터입니다."
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---

# 편집기

`Editor` 컴포넌트는 코드 편집기입니다. 쉰 개가 넘는 언어의 구문 강조, 줄 번호, 다중 캐럿, 접기, 자동 줄 바꿈, 찾기 및 바꾸기, 진단과 데코레이션을 지원하며, 코드 편집기의 단축키(줄 이동 및 복제, 주석, 들여쓰기, 입력하는 대로 닫히는 괄호와 따옴표)도 갖추고 있습니다. 길이에 상관없이 어떤 파일이든 다룰 수 있습니다. 화면에 보이는 행만 만들고, 강조는 편집할 때마다 줄 단위로 따라가므로 긴 파일도 짧은 파일처럼 스크롤하고 입력할 수 있습니다. 입력은 플랫폼의 입력 기능을 거치므로 입력기(병음, 가나, 데드 키)와 소프트 키보드도 다른 텍스트 필드와 똑같이 동작합니다.

편집기는 동작을 직접 관리하며, 테마의 토큰으로 만든 자체 외형을 갖추고 있습니다. 20pt 높이의 행에 13pt 크기로 표시되는 테마의 `font-mono`, `muted-foreground` 색의 줄 번호, 캐럿이 있는 줄 뒤의 은은한 `muted` 띠, `primary`의 옅은 색조로 표시되는 선택 영역, `border` 색의 들여쓰기 안내선, 그리고 [`TextView`](./text-view.md)의 코드 블록이 사용하는 내장 구문 색상(라이트와 다크 모두)이 그것입니다. 각 부분은 이 기본값 위에 앱의 스타일을 적용합니다(`classes` 및 `styles`). Rust에서는 `nsh_base::editor()`로, TSX에서는 `nsh/base`의 `<Editor>`로 편집기를 만듭니다.

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

편집기는 앱이 지정한 상자(`flex-1`, 높이)를 가득 채우고 그 안에서 텍스트를 스크롤합니다. 세로 스크롤은 항상 가능하고, 줄이 상자보다 길면 가로로도 스크롤됩니다. `softWrap`을 사용하면 가로 스크롤 없이 긴 줄이 편집기 너비에 맞춰 줄 바꿈됩니다.

<a id="the-text"></a>

## 텍스트

- **제어형**: `value`을 전달하고 새 전체 텍스트를 알려 주는 `onChange`에서 다시 설정합니다. 앱이 바꾼 `value`(불러온 파일, 포매터의 출력)은 실행 취소로 되돌릴 수 있는 하나의 편집으로 텍스트를 대체하며, 변경된 곳에서 떨어져 있는 캐럿과 접힌 영역은 그대로 유지됩니다.
- **비제어형**: `defaultValue`을 전달하고 `onChange` 또는 ref의 `value()`로 텍스트를 읽습니다.

줄 바꿈은 `\n`입니다. 들어오는 텍스트의 `\r\n`과 `\r`은 `\n`로 바뀝니다.

<a id="languages"></a>

## 언어

`language`은 언어를 이름, 별칭, 확장자 또는 파일 이름으로 지정하며 대소문자는 구분하지 않습니다: `"rust"`, `"rs"`, `"typescript"`, `"tsx"`, `"main.go"`, `"Dockerfile"`, `"Makefile"`. 이 값은 구문 강조, `mod+/`이 토글하는 주석, 짝을 맞추고 들여쓰기에 쓰이는 괄호, 입력 시 닫히는 쌍, 단어를 이루는 문자, 기본 들여쓰기를 결정합니다. 기본 들여쓰기는 공백 네 칸이며, 웹 언어(JavaScript, TypeScript, JSON, HTML, CSS, YAML 등)는 두 칸, Go와 Makefile은 탭입니다. `tabSize`과 `hardTabs`은 모든 언어에 대해 들여쓰기를 지정합니다. 그 밖의 이름은 앱이 등록하지 않는 한 일반 텍스트로 처리됩니다([자체 언어](#your-own-languages)).

지원 언어: Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C, Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown, YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R, Julia, Nix, Terraform, Protocol Buffers, GraphQL, Diff.

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### 자체 언어

Rust 코드로 앱의 편집기에 더 많은 언어를 가르칠 수 있으며, 자체 강조기(tree-sitter 문법이나 앱의 파서)가 있는 모든 언어를 강조할 수 있습니다. `register_language`은 `EditorLanguage`을 등록합니다. 여기에는 이름, 별칭, 확장자, 파일 이름과 편집 규칙(주석, 괄호, 입력 시 닫히는 쌍, 단어 문자, 들여쓰기)이 들어 있으며, `syntax`은 강조에 사용할 내장 문법을 지정합니다. `register_highlighter`은 내장 언어든 등록된 언어든 앱의 강조기를 지정합니다. 이 강조기는 `EditorHighlighter`을 구현하는 타입으로, 모든 편집(tree-sitter의 편집 방식과 같은 줄, 바이트, 위치)을 전달받아 UI 스레드와 별개로 제한 시간 안에 각 줄의 토큰(`EditorToken`, 또는 `EditorToken::from_scope`을 통한 tree-sitter 캡처나 TextMate 스코프)을 돌려줍니다. 편집기는 토큰을 보관하고, 텍스트가 편집될 때 토큰을 함께 이동시키며, 내장 강조기를 쓸 때와 마찬가지로 화면에 보이는 줄에 대해서만 다시 요청합니다. `language`은 편집기와 diff 뷰 모두에서 이름, 별칭, 확장자 또는 경로로 등록된 언어를 먼저 찾습니다.

각 엔진은 자신의 언어를 따로 관리합니다. Rust 앱은 편집기를 마운트하기 전에 루트에서 언어를 등록합니다. TSX 앱의 경우 앱의 crate가 UI 세트의 설정 단계에서 언어를 등록하며, 앱을 실행하는 모든 엔진이 이 설정을 가장 먼저 호출합니다.

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

## 편집

편집기는 코드 편집기처럼 동작합니다.

- **다중 캐럿.** Alt-클릭(Option-클릭)으로 캐럿을 추가하고, `mod+d`은 선택 영역의 다음 일치 항목을, `mod+shift+l`은 모든 일치 항목을 선택하며, 캐럿 추가 키는 위나 아래 행에 캐럿을 추가합니다. 입력, 삭제, 이동과 모든 명령이 각 캐럿에서 실행되고, Escape를 누르면 캐럿이 하나로 돌아갑니다. `undoSelection`(`cmd+u`, `ctrl+u`)은 마지막 이동 이전의 선택 상태로 되돌립니다.
- **선택 확장**은 `expandSelection`(`ctrl+shift+cmd+right`, `shift+alt+right`)으로 단위별로 이루어집니다. 단어, 문자열의 내용과 문자열 전체, 괄호 쌍의 내용과 괄호 쌍 전체, 줄, 텍스트 전체 순으로 넓어지며, `shrinkSelection`은 같은 순서로 되돌립니다. `splitSelectionIntoLines`(`shift+alt+i`)은 여러 줄에 걸친 선택 영역을 줄마다 하나의 선택 영역으로 바꿉니다.
- **들여쓰기.** 새 줄은 현재 줄의 들여쓰기를 유지하며, 여는 괄호 뒤에서는 한 단계를 더합니다(Python의 `:`, Ruby의 `do` 등). 괄호 쌍 사이에서 Enter를 누르면 닫는 괄호가 별도의 줄에 놓입니다. Tab과 Shift+Tab은 선택한 줄을 들여쓰기 및 내어쓰기하며, 앞쪽 공백에서 Backspace를 누르면 이전 들여쓰기 위치로 돌아갑니다. `autoIndent`은 이 동작을 끕니다.
- **괄호와 따옴표**는 입력하는 대로 닫히고, 선택 영역을 감싸며, 닫는 문자를 다시 입력하면 그 위를 건너뜁니다(`autoClose`). 캐럿 위치의 괄호와 그 짝은 윤곽선으로 표시됩니다.
- **실행 취소**는 단어, 삭제, 명령 같은 일련의 입력 전체를 한 번에 되돌립니다. 이동이나 누르기는 새 단계를 시작합니다.
- **접기.** 더 깊게 들여쓴 줄이 뒤따르는 줄은 거터의 마커로 그 줄들을 접을 수 있습니다. `⌄`으로 접고, `›`과 줄 뒤의 `⋯`으로 펼칩니다. 접힌 영역으로 캐럿이 이동하면 그 영역이 열립니다([접기](#folding)).
- **누르기.** 포인터에서는 클릭이 캐럿을 놓고, 더블 클릭은 단어를, 트리플 클릭은 줄을 선택하며, Shift-클릭은 선택 영역을 확장하고, 드래그는 클릭이 선택한 단위로 선택합니다. Alt+Shift 드래그(Option+Shift, Linux에서는 Control+Alt도 가능)는 블록을 선택합니다. 같은 열 사이에서 행마다 하나의 선택 영역이 만들어지며, 짧은 줄의 끝을 넘어서도 계속 이어집니다. 터치 화면에서는 탭이 캐럿을 놓고, 더블 탭이나 길게 누르기는 손가락 아래의 단어를 선택하며, 선택 영역 양 끝의 핸들을 손가락으로 끌면 각 끝이 이동합니다(그 주변의 텍스트는 계속 스크롤됩니다).
- **클립보드.** 선택 영역이 없을 때의 복사와 잘라내기는 캐럿이 있는 줄 전체를 가져가며, 이를 붙여 넣으면 캐럿이 있는 줄 위에 줄 전체로 붙습니다.

`readOnly`은 텍스트가 선택, 검색, 복사되는 동안에도 텍스트를 그대로 유지합니다.

<a id="keys"></a>

## 키

편집기의 키는 편집기에 포커스가 있을 때 동작하며, 다른 입력 요소는 각자의 키를 유지합니다. `mod`는 macOS와 iOS에서는 Command, 그 외에서는 Control입니다(`keymap`의 키 입력).

| 키 (macOS) | 키 (Windows, Linux) | 명령 |
|---|---|---|
| 화살표, Shift와 함께 누르면 선택 | 화살표, Shift와 함께 누르면 선택 | 문자 및 행 단위 이동 |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | 단어 단위 이동 |
| `cmd+left` / `cmd+right`, `home` / `end`, `ctrl+a` / `ctrl+e` | `home` / `end` | 줄의 첫 번째 공백이 아닌 문자(다시 누르면 줄의 시작) / 줄의 끝 |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | 텍스트의 시작 / 끝 |
| `pageup` / `pagedown` | `pageup` / `pagedown` | 한 페이지 위 / 아래 |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | 왼쪽 / 오른쪽 단어 삭제 |
| `cmd+backspace` / `cmd+delete`, `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | 줄의 시작 / 끝까지 삭제 |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`, `ctrl+y` | 실행 취소 / 다시 실행 |
| `cmd+a` | `ctrl+a` | 전체 선택 |
| `cmd+l` | `ctrl+l` | 줄 선택(다시 누르면 다음 줄도 선택) |
| `cmd+d` | `ctrl+d` | 다음 일치 항목 선택 |
| `cmd+shift+l` | `ctrl+shift+l` | 모든 일치 항목 선택 |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | 위 / 아래에 캐럿 추가 |
| `escape` | `escape` | 하나의 선택 영역으로 되돌리기 |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | 줄을 위 / 아래로 이동 |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | 줄을 위 / 아래로 복제 |
| `cmd+shift+k` | `ctrl+shift+k` | 줄 삭제 |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | 아래 / 위에 새 줄 |
| `tab` / `shift+tab`, `cmd+]` / `cmd+[` | `tab` / `shift+tab`, `ctrl+]` / `ctrl+[` | 들여쓰기 / 내어쓰기 |
| `cmd+/` | `ctrl+/` | 줄 주석 토글 |
| `cmd+shift+\` | `ctrl+shift+\` | 짝이 되는 괄호로 이동 |
| `ctrl+j` | `ctrl+j` | 줄 합치기 |
| `ctrl+t` | | 캐럿 양옆의 문자 맞바꾸기 |
| `ctrl+alt+left` / `ctrl+alt+right`, Shift와 함께 누르면 선택 | | 단어의 일부(camelCase, snake_case) 단위 이동 |
| `shift+alt+a` | `shift+alt+a` | 블록 주석 토글 |
| `shift+alt+i` | `shift+alt+i` | 선택 영역을 줄 단위로 분할 |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | 선택 영역 확장 / 축소 |
| `cmd+u` | `ctrl+u` | 이전 선택 상태로 되돌리기 |
| `cmd+g` / `cmd+shift+g`, `f3` / `shift+f3` | `f3` / `shift+f3` | 다음 / 이전 일치 항목 찾기 |
| `cmd+e` | | 선택 영역 찾기(`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | 캐럿이 있는 줄 접기 / 펼치기 |
| `f12` | `f12` | 캐럿 위치의 정의로 이동(`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | 선택 영역의 코드 액션(`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | 복사 / 잘라내기 / 붙여넣기 |

macOS와 iOS에는 Cocoa의 텍스트 키도 있습니다. `ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n`은 이동, `ctrl+h` / `ctrl+d`은 삭제입니다.

기본 키가 없는 명령과 앱 자체의 명령은 앱이 [`keymap`](../modules/nsh.md#keymap)으로 바인딩한 키를 사용하며, ref의 `run`를 통해 실행됩니다.

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

## 찾기 및 바꾸기

`search`은 찾을 대상이며, 그 값은 `{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`입니다. 일치 항목은 강조 표시되고, 선택 영역이 놓인 항목은 더 강하게 표시됩니다. `onSearchChange`은 `{ result }`, 즉 `{ count, current, error }`를 알려 줍니다. 여기에는 일치 항목 수, 선택 영역이 놓인 항목(0부터 시작), 정규식이 유효하지 않은 이유가 담겨 있습니다. `findNext`과 `findPrevious`은 처음과 끝에서 순환하며 다음 및 이전 일치 항목을 선택하고, `replace(text)`는 현재 일치 항목을 바꾼 뒤 다음 항목을 선택하며, `replaceAll(text)`는 모든 일치 항목을 하나의 편집으로 바꾸고 바꾼 개수인 `{ count }`를 반환합니다. 정규식의 치환 문자열은 그룹을 `$1`와 `${name}`로 참조합니다.

`inSelection`은 켜는 시점에 선택되어 있던 범위(선택된 것이 없었다면 캐럿이 있는 줄들) 안에서만 찾습니다. 이 범위는 켜져 있는 동안 편집을 거쳐도 유지되며, 선택 영역은 일치 항목에서 일치 항목으로 이동합니다. `findWithSelection`(macOS에서는 `cmd+e`)은 선택한 텍스트 또는 캐럿 위치의 단어를 `onFindWithSelection`와 함께 알려 주며, 찾기 바가 이를 검색어로 가져갈 수 있습니다.

찾기 바는 앱이 직접 만듭니다.

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

## 진단

`diagnostics`은 언어 서버나 린터가 보고하는 문제를 표시합니다. 각 범위 아래에 심각도 색상(`error`, `warning`, `info`, `hint`)의 가는 물결 밑줄이 그려집니다. 위치는 언어 서버와 같은 방식으로 0부터 시작하는 줄과 UTF-16 열이므로, 진단 정보를 받은 그대로 전달하면 됩니다. 표시는 앱이 새 진단을 전달할 때까지 사용자가 입력하는 동안에도 해당 텍스트에 그대로 붙어 있습니다. 메시지를 보여 주는 일(목록, 해당 줄의 호버 카드)은 앱이 담당합니다.

진단에는 언어 서버의 `Diagnostic`가 가진 나머지 정보도 담을 수 있습니다. `tags`은 언어 클라이언트와 같은 방식으로 텍스트를 그립니다. `unnecessary` 코드(사용되지 않는 변수, 도달할 수 없는 코드)는 흐리게, `deprecated` 코드는 취소선으로 표시되며, 이는 `unnecessaryText`과 `deprecatedText` 부분에 적용됩니다. 태그가 있는 힌트는 텍스트만 표시됩니다. `codeDescription.href`는 해당 코드(린트 규칙 등)를 설명하는 페이지이고, `relatedInformation`는 그에 대해 알려 주는 다른 위치들(`{ location: { uri?, range }, message }`)을 나열합니다. 호버는 두 가지를 모두 앱에 넘기며, 앱은 이를 호버 카드에 표시하고 페이지를 엽니다. 언어 서버는 태그를 숫자(`1`, `2`)로 보내며, 편집기는 그 이름을 받아들입니다.

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

## 데코레이션

`decorations`은 앱이 선택하는 스타일 범위입니다. 언어 서버의 시맨틱 강조, 실행 중인 문장, 리뷰에서 변경된 줄 등이 그 예입니다. 데코레이션의 `class`와 `style`는 텍스트의 스타일을 지정하고, `lineClass`과 `lineStyle`은 텍스트 뒤에 있는 해당 줄들의 행 스타일을 지정합니다. 진단과 마찬가지로, 앱이 새 데코레이션을 설정할 때까지 편집을 거쳐도 해당 텍스트에 그대로 붙어 있습니다.

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

### 거터와 개요 눈금자 표시

데코레이션의 `gutter` 속성은 줄 번호 앞의 띠에서 범위가 덮는 모든 줄 옆에 표시를 넣습니다. 버전 관리 diff가 추가하거나 수정한 줄이나 중단점이 그 예입니다(빈 범위는 `lineClass`처럼 해당 줄 하나를 덮습니다). `placement: "before"`를 사용하면 줄이 삭제된 위치, 즉 범위 시작 바로 앞 경계에 띠를 가로지르는 선으로 표시됩니다. 띠의 너비는 `gutterDecorationsWidth` 포인트(기본값 3)이며, 거터 표시가 있는 데코레이션이 있는 동안 유지되므로 표시가 생기고 사라져도 텍스트 위치가 바뀌지 않습니다. 접힌 영역 안의 범위는 접힌 영역의 행에 표시됩니다.

데코레이션의 `overviewRuler` 속성은 개요 눈금자에 표시를 놓습니다. 개요 눈금자는 에디터 오른쪽 가장자리를 따라 있는 너비 14포인트(스크롤 막대의 너비이며, `overviewRuler` 부분에서 다른 너비를 지정할 수 있음)의 띠로, Monaco의 것과 마찬가지로 전체 텍스트를 그 높이에 대응시킵니다. 표시는 높이가 최소 6포인트이고 눈금자의 `lane` 하나를 차지합니다: `left`, `center`(기본값), `right` 또는 `full`. 눈금자는 표시가 있는 데코레이션이 있는 동안 나타납니다.

각 표시는 앱의 `class` 및 `style` 값을 사용하며, 이 값이 없으면 전경색으로 그려집니다. 둘 다 데코레이션의 범위처럼 편집을 따라가며, 표시된 범위를 삭제하는 편집은 그 자리에 빈 범위를 남깁니다.

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

### 사용자 정의 하이라이팅

데코레이션의 `token` 속성은 내장 하이라이팅이 해당 종류의 토큰(`comment`, `keyword`, `string`, `number`, `title`, `attr`, `built`, `deletion`)에 색을 입히는 방식 그대로 텍스트에 색을 입히며, 내장 하이라이터가 그 자리에서 찾은 결과를 대체합니다. 앱 자체의 하이라이터(언어 서버의 시맨틱 토큰, 자체 파서)는 자신의 토큰을 이 값들에 대응시켜 라이트와 다크 모드 모두에서 에디터의 색을 얻습니다. 가장 안쪽 데코레이션의 토큰이 우선하며, `class` 및 `style`는 그 위에 적용됩니다. `highlighting={false}`은 내장 하이라이터를 끄므로 앱의 토큰만 텍스트에 색을 입히고, `language`은 여전히 주석, 괄호, 들여쓰기를 결정합니다.

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

## 접기

접기는 바로 앞 줄보다 더 깊게 들여쓴 줄에서 시작됩니다. 대신 `foldRanges`을 사용하면 에디터에 앱 자체의 범위를 지정할 수 있습니다(`{ startLine, endLine }`, 언어 서버의 접기 범위 형태이며 받은 그대로 전달됩니다). `startLine`번째 줄에 접기가 표시되고, 그 뒤부터 `endLine`까지의 줄이 접힙니다. 접기는 앱이 새 범위를 전달할 때까지 편집을 거쳐도 각자의 줄에 유지됩니다.

접기는 중첩됩니다. 블록을 접어도 그 안의 접기는 접힌 상태로 유지되므로, 블록을 펼치면 이전 상태 그대로 보입니다. `foldRecursive`은 블록과 그 안의 모든 블록을 접고, `unfoldRecursive`은 모두 펼치며, `foldLevel(n)`는 중첩 수준 `n`의 모든 블록을 접고, `foldSelection`(또는 `foldRange(range)`)은 접기가 시작되는 위치와 관계없이 임의의 줄을 접습니다. `onFoldChange`은 변경될 때마다 접힌 범위를 알리고, `folds()` / `setFolds(ranges)`은 이를 읽고 복원하여 파일과 함께 보관할 수 있게 합니다.

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

## 중단점과 컨텍스트 메뉴

줄 번호를 누르면 `onLineNumberPress({ line })`이 보고되며, 앱은 이를 데코레이션으로 그리는 중단점의 위치로 사용합니다. 보조 버튼(오른쪽 클릭, Mac에서는 Control-클릭)은 `onContextMenu({ position, x, y })`을 보고합니다. 여기에는 포인터 아래 텍스트의 위치와 루트 뷰에서의 지점이 담기며, 앱은 그 지점에서 자체 메뉴를 엽니다. 터치 화면에서는 길게 누르기, 두 번 탭, 핸들 놓기, 선택 영역 탭도 `selection`과 함께 이를 보고합니다. 담기는 값은 루트 뷰에서의 선택 영역 상자(`{ x, y, width, height }`)와, 편집 메뉴를 위한 상단 중앙의 `x` / `y`입니다.

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

## 언어 기능

제안, 호버 정보, 정의로 이동, 코드 액션은 앱의 언어 서버에서 제공됩니다. 에디터는 자동 완성 목록, 인라인 자동 완성, 정의 링크를 해당 키와 함께 직접 그리고, 나머지는 앱에 시점과 위치를 전달하며 앱이 팝업을 그립니다(`pageBounds`에 고정된 [`Overlay`](./overlay.md)).

<a id="completion"></a>

### 자동 완성

`completion` 사용 시 에디터는 앱에 제안을 요청하고, 입력 중인 단어 아래에(창 하단 근처에서는 위에) 목록으로 표시합니다.

- 단어 끝에서 글자, 숫자 또는 `_` 문자를 입력하면 요청(`onCompletionRequest(event)`)을 보내며 트리거는 `"typing"`입니다. `event`에는 `id`, 캐럿의 `offset`과 `position`, `query`(지금까지 입력한 단어), 단어가 시작되는 `queryStart` 오프셋이 담깁니다. `completionTriggerCharacters`(`["."]`, `["::", "<"]`) 각각은 그 뒤에 빈 쿼리로 요청하며 트리거는 `"character"`(및 `character`)입니다. `showCompletions()` 또는 `run("showCompletions")`는 캐럿 위치에서 요청하며 트리거는 `"invoked"`입니다.
- 앱은 응답(`presentCompletions(event.id, items)`)을 돌려줍니다. 각 항목은 언어 서버의 `CompletionItem` 형태입니다: `label`, 그리고 선택적으로 `kind`(`"function"`, `"variable"`, `"class"`, ...), `detail`, `documentation`, `insertText`, `filterText`, `sortText`, `range`. 가장 최근 요청에 대한 응답이 표시되며, 이전 요청의 응답이나 캐럿이 떠난 단어에 대한 응답은 무시됩니다.
- 계속 입력하면 목록이 그 자리에서 필터링됩니다. 쿼리는 각 항목의 `filterText`(없으면 label)과 대소문자 구분 없이 글자 순서대로 일치시키며, 쿼리로 시작하는 단어가 먼저, 그다음 가장 가까운 일치, 그다음 `sortText` 순으로 정렬됩니다. 일치한 글자는 강조 표시됩니다. 입력이 계속될 때 에디터가 다시 요청하게 하려면 `incomplete: true`(`presentCompletions(id, items, true)`)을 전달하세요.
- Up과 Down(및 Control+P / Control+N)으로 목록을 이동하고, Page Up과 Page Down은 한 페이지씩 이동하며, Enter와 Tab은 수락하고, Escape는 목록을 닫습니다. 포인터는 항목을 표시하고, 클릭(터치 화면에서는 탭)하면 수락됩니다. 선택된 항목의 `documentation`은 목록 옆에 표시됩니다.
- 수락하면 항목의 `range`(없으면 쿼리)를 `insertText`(없으면 label)로 바꾸며, 이는 실행 취소로 되돌릴 수 있는 하나의 단계입니다. 캐럿 위치와, 앞에 같은 텍스트가 있는 다른 모든 캐럿 위치에서 바뀌고, `onCompletionAccept({ item })`을 보고합니다.
- 목록은 캐럿이 단어를 벗어날 때, 공백이나 다른 구두점을 입력할 때, 에디터가 포커스를 잃을 때, 캐럿이 스크롤되어 보이지 않게 될 때 닫힙니다.

목록이 표시되지 않은 상태에서 입력이 잠시 멈추면(`inlineCompletionDelay`, 기본값 300ms) 인라인 자동 완성을 요청합니다: `onInlineCompletionRequest({ id, offset, position })`. `presentInlineCompletion(id, text)`은 캐럿 위치에 `text`을 흐린 색으로 표시하고, Tab은 이를 삽입하며, Escape, 편집 또는 이동은 이를 지웁니다.

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

### 호버와 누르기

- `onHover(event)`: 버튼을 누르지 않은 채 마우스가 문자 위에 머뭅니다(데스크톱과 웹. 드래그하면 텍스트가 선택됩니다). `event`에는 `position`, UTF-16 `offset`, 해당 단어의 `range`, 포인터의 `pagePosition`, 단어의 `pageBounds`, 누르고 있는 `modifiers`, 그 위치의 `diagnostics`이 담기며, 앱은 그 메시지를 표시합니다. 다른 단어로 이동하면 다음 호버가 즉시 보고됩니다.
- `onHoverEnd()`: 마우스가 단어나 에디터를 벗어났거나, 그 아래에서 텍스트가 변경되거나 스크롤되었습니다.
- `onTextPress(event)`: 에디터가 캐럿을 놓은 뒤 문자가 눌렸습니다: `{ position, offset, range, pagePosition, modifiers, clicks }`.
- `caretBounds()` 및 `rangeBounds(range)`: 캐럿과 범위의 위치로, `{ bounds, pageBounds }`(에디터 안과 루트 뷰 안)입니다. 앱의 팝업이 그곳에 열립니다.

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

### 정의로 이동과 코드 액션

Mod(macOS와 iOS에서는 Command, 그 외에서는 Control)를 누르고 있으면 코드 에디터처럼 마우스 아래의 단어가 링크로 바뀝니다.

- 단어 위에서 Mod를 누른 상태가 되면(마우스가 그 위에 있을 때 누르거나, Mod를 누른 채 마우스를 그 위로 옮김) 에디터가 요청(`onDefinitionRequest(event)`)을 보내며 트리거는 `"hover"`입니다. `event`에는 `id`, 문자의 `position`과 `offset`, 단어의 `range`가 담깁니다. 언어 서버가 정의를 찾으면 `presentDefinitionLink(event.id, range)`으로 응답하세요. 그러면 범위에 밑줄이 그어지고(`definitionLink` 부분) 그 위에서 포인터가 손 모양이 됩니다. 링크는 Mod를 놓거나, 마우스가 링크를 벗어나거나, 텍스트가 변경되거나 스크롤되거나, 또는 `hideDefinitionLink()`로 사라집니다. 가장 최근 요청의 응답이 표시되며 이전 응답은 무시됩니다.
- 단어를 Mod-클릭하면 요청하며 트리거는 `"press"`입니다. 링크 위에서는 캐럿이 있던 자리에 그대로 있습니다. F12(`goToDefinition`, `run("goToDefinition")`)는 캐럿 위치의 단어에 대해 요청하며 트리거는 `"key"`입니다. 앱이 정의로 이동합니다. 같은 텍스트 안의 정의는 `revealPosition`과 `setSelections`로, 다른 파일의 정의는 앱 자체의 내비게이션으로 이동합니다.
- Mod+.(`showCodeActions`, `run("showCodeActions")`)는 다음을 보고합니다(`onCodeActionRequest({ range, position, bounds })`): 주 선택 영역(시작이 먼저), 캐럿과 그 상자. 앱은 언어 서버에 액션을 요청하고, `bounds.pageBounds`에 메뉴([`Menu`](./menu.md) 또는 `Overlay`)를 표시하며, 선택된 액션의 편집을 `edit(edits)`로 적용합니다.

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

## 크기와 스크롤

`minRows` 및/또는 `maxRows`을 사용하면 에디터가 텍스트에 맞춰 커집니다. 높이는 행의 높이만큼이며 최소 `minRows` 행이고, `maxRows`부터는 메시지 상자나 노트북 셀처럼 텍스트가 스크롤됩니다. 그렇지 않으면 앱이 크기를 정하며, `scrollBeyondLastLine`은 텍스트를 마지막 줄 너머까지 스크롤할 수 있게 합니다: 한 화면까지(`true`, 기본값), 전혀 안 함(`false`), 또는 지정한 행 수입니다. 캐럿이 움직일 때 그 주위로 `cursorSurroundingLines` 행이 계속 보입니다. 선택 영역을 에디터 가장자리 밖으로 드래그하면 계속 스크롤되며, 포인터가 멀어질수록 빨라집니다.

`showWhitespaces`은 공백마다 `·`을, 탭마다 `→`을 표시하고(`whitespace` 부분), `rulers`은 지정한 각 열에 선을 그려(`ruler` 부분) 줄 길이의 가이드로 삼습니다.

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

## 메서드

`ref={editor}`은 앱의 버튼, 메뉴, 키에서 쓸 수 있도록 에디터의 메서드(`EditorRef`)를 제공합니다. 값을 반환하는 메서드(`value()`, `selections()`, `replaceAll()`, `canUndo()`, `caretBounds()`, `folds()`, ...)는 JS에서 그 값의 `Promise`을 반환하므로 이를 `await`하세요: `const text = await editor.value()`. 텍스트 범위를 벗어난 줄이 전달된 메서드(`fold`, `scrollToLine`, `goToLine`, ...)는 아무것도 변경하지 않으며, 메서드와 줄을 명시한 경고를 로그에 남깁니다.

| 메서드 | 설명 |
|---|---|
| `focus()`, `blur()` | 포커스를 가져오거나 내려놓습니다. |
| `value()` | `Promise<string>`: 텍스트. |
| `setValue(value)` | 텍스트를 바꾸며, 실행 취소로 되돌릴 수 있는 편집으로 처리됩니다. |
| `insert(text)` | 각 선택 영역에 `text`을 그대로 입력합니다(괄호는 자동으로 닫히지 않음). |
| `edit(edits)` | `{ range, text }` 교체(현재 텍스트의 범위이며, 앞선 범위와 겹치는 것은 건너뜀)를 실행 취소로 되돌릴 수 있는 하나의 단계로 적용하며, 선택 영역은 주변 텍스트와 함께 이동합니다. 코드 액션과 포맷팅 편집은 여기에 사용합니다. |
| `selections()` | `Promise<EditorSelection[]>`: 모든 선택 영역(`{ anchor, head }`)이며, 주(가장 최근) 선택 영역이 마지막입니다. |
| `setSelections(selections)` | 선택 영역을 설정하고(마지막이 주 선택 영역) 주 선택 영역이 보이도록 스크롤합니다. |
| `run(command)` | 단축키를 눌렀을 때와 같이 명령을 실행합니다([명령](#commands)). |
| `replace(text)` | 현재 일치 항목을 바꾸고 다음 항목을 선택합니다. |
| `replaceAll(text)` | `Promise<EditorReplaceAll>`: 모든 일치 항목을 하나의 편집으로 바꾸며, `{ count }`은 그 개수입니다. |
| `fold(line)`, `unfold(line)` | 줄 `line`(0부터 시작) 아래의 줄을 접거나 펼칩니다. |
| `foldRecursive(line)`, `unfoldRecursive(line)` | 줄 `line`의 접기와 그 안의 모든 접기를 접거나, 모두 펼칩니다. |
| `foldLevel(level)` | 중첩 수준 `level`(1: 가장 바깥쪽)의 모든 접기를 접습니다. |
| `foldRange(range)` | 접기가 시작되는 위치와 관계없이 `range`(`{ startLine, endLine }`)의 줄을 접습니다. |
| `folds()` | `Promise<EditorFoldRange[]>`: 접힌 범위(중첩된 범위 포함). |
| `setFolds(folds)` | 정확히 `folds`만 접습니다. |
| `scrollToLine(line)` | 줄 `line`이 보이도록 스크롤하며, 이를 가리는 접기를 펼칩니다. |
| `canUndo()`, `canRedo()` | `Promise<boolean>`: 되돌릴 편집 또는 다시 실행할 편집이 있는지 여부. |
| `caretBounds()` | `Promise<EditorBounds \| null>`: 주 캐럿의 상자 `{ bounds, pageBounds }` — 에디터 기준(스크롤 적용)과 루트 뷰 기준. 에디터가 레이아웃되기 전에는 `null`. |
| `rangeBounds(range)` | `Promise<EditorBounds[]>`: `range`의 상자들로, 덮는 행마다 하나씩입니다. |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>`: 텍스트가 스크롤된 거리. `{ x, y }` 위치로 스크롤합니다. |
| `visibleRange()` | `Promise<EditorRange>`: 뷰포트에 보이는 텍스트로, 첫 행의 시작부터 마지막 행의 끝까지입니다. |
| `selectedText()` | `Promise<string>`: 주 선택 영역의 텍스트. |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`, `Promise<number>`: `value()`의 UTF-16 오프셋과 위치 사이의 변환. |
| `revealPosition(position, center)` | `position`이 보이도록 스크롤하며, 이를 가리는 접기를 펼칩니다. `center` 사용 시 가운데로 스크롤합니다. |
| `goToLine(line)` | 캐럿을 줄 `line`(0부터 시작)의 시작에 놓고 가운데로 스크롤합니다. |
| `showCompletions()` | 캐럿 위치의 자동 완성을 요청하며, 캐럿 앞의 단어가 쿼리가 됩니다([자동 완성](#completion)). |
| `presentCompletions(id, items, incomplete?)` | 자동 완성 요청 `id`에 응답합니다. 목록에는 `items`이 표시되며 이후 입력한 내용으로 필터링됩니다. `incomplete`를 사용하면 입력을 이어갈 때 다시 요청합니다. 항목이 없으면 목록이 닫힙니다. |
| `hideCompletions()` | 자동 완성 목록을 닫습니다. |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | 인라인 자동 완성 요청 `id`에 응답하며(`text`), 캐럿 위치에 표시됩니다. 두 번째는 이를 지웁니다. |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | 정의 요청 `id`(트리거 `"hover"`)에 응답합니다. `range`이 링크로 밑줄 표시됩니다([정의로 이동](#go-to-definition-and-code-actions)). 두 번째는 이를 숨깁니다. |

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

### 명령

`run`에 편집기 명령을 이름으로 전달할 수 있습니다(`EditorCommand`):

| 명령 | 동작 |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | 캐럿을 이동합니다. |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | 선택 영역을 확장합니다. |
| `moveToMatchingBracket` | 캐럿 위치의 괄호와 짝이 맞는 괄호로 이동합니다. |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | 선택합니다. |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | 단어의 일부(camelCase의 마디, snake_case의 부분) 단위로 이동하거나 선택을 확장합니다. |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | 문단 앞 또는 뒤의 빈 줄까지 이동하거나 선택을 확장합니다. |
| `expandSelection`, `shrinkSelection` | 선택 영역을 한 단위씩 넓히거나 되돌립니다. |
| `undoSelection`, `redoSelection` | 마지막 이동 이전의 선택 영역으로 돌아가거나 다시 앞으로 이동합니다. |
| `splitSelectionIntoLines` | 각 선택 영역의 줄마다 선택 영역을 하나씩 만듭니다. |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | 캐럿을 추가합니다. 선택 영역 하나로 되돌립니다. |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | 삭제합니다. |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | 줄, 들여쓰기, 주석을 다룹니다. |
| `sortLinesAscending`, `sortLinesDescending` | 선택한 줄을 정렬합니다(캐럿만 있으면 모든 줄). |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | 선택 영역의 대소문자를 바꿉니다(캐럿만 있으면 해당 단어). |
| `trimTrailingWhitespace` | 모든 줄 끝의 공백을 제거합니다. |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | 재배열합니다. |
| `undo`, `redo` | 실행 취소와 다시 실행. |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | 캐럿이 있는 줄 또는 전체를 접거나 펼칩니다. |
| `foldRecursive`, `unfoldRecursive` | 캐럿 위치의 접기와 그 안의 모든 접기를 접거나 펼칩니다. |
| `foldSelection` | 여러 줄에 걸친 각 선택 영역의 줄을 접습니다. |
| `findNext`, `findPrevious` | `search`의 다음 또는 이전 일치 항목을 선택합니다. |
| `findWithSelection` | 찾기 막대에 사용할 선택된 텍스트를 보고합니다(`onFindWithSelection`). |
| `copy`, `cut`, `paste` | 클립보드. |
| `showCompletions` | 캐럿 위치의 자동 완성을 요청합니다([자동 완성](#completion)). |
| `goToDefinition` | 캐럿 위치 단어의 정의를 요청합니다(`onDefinitionRequest`, 트리거 `"key"`). |
| `showCodeActions` | 선택 영역의 코드 액션을 요청합니다(`onCodeActionRequest`). |

<a id="styling-the-parts"></a>

## 부분 스타일링

`class`와 `style`는 편집기의 박스를 스타일링합니다. `classes`는 부분별 Tailwind 클래스를, `styles`는 부분별 인라인 스타일을 받습니다. 부분의 클래스는 해당 부분의 기본 스타일 뒤에 적용되므로 기본 스타일보다 우선하고, `styles`는 클래스보다 우선합니다. 글꼴은 `fontFamily`, `fontSize`, `lineHeight`로 설정하며, 편집기는 이 글꼴로 텍스트를 측정합니다.

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

| 부분 | 설명 | 기본값 |
|---|---|---|
| `gutter` | 줄 번호와 접기 마커의 열 | 숫자 앞 12pt, 마커 뒤 4pt |
| `lineNumber` | 모든 줄 번호 | 오른쪽 정렬, `muted-foreground` |
| `activeLineNumber` | 캐럿이 있는 줄의 번호, `lineNumber` 뒤에 적용 | `foreground` |
| `foldMarker` | 접기가 시작되는 줄의 마커 | `⌄`, 접힌 상태 `›`, `muted-foreground` |
| `overviewRuler` | 오른쪽 가장자리의 개요 눈금자, 데코레이션에 표시가 있는 동안 나타남 | 없음 |
| `content` | 거터 옆의 텍스트 영역 | 텍스트 앞 4pt |
| `line` | 텍스트의 모든 행 | |
| `activeLine` | 캐럿이 있는 줄의 행 뒤, 스크롤 표시기 아래 | `muted`, 옅게 |
| `selection` | 선택된 텍스트 뒤 | `primary`의 옅은 색조 |
| `caret` | 캐럿 | 너비 2pt, `foreground`, 깜박임 |
| `composition` | 입력기가 조합 중인 텍스트 | 밑줄 |
| `searchMatch` | `search`의 일치 항목 | 반투명 호박색 |
| `currentSearchMatch` | 선택 영역이 위치한 일치 항목, `searchMatch` 뒤에 적용 | 더 진한 호박색 |
| `matchingBracket` | 캐럿 위치의 괄호와 그 짝 | 1pt 테두리 |
| `indentGuide` | 들여쓰기 수준마다 하나의 가이드 | `border`의 1pt 선 |
| `foldPlaceholder` | 접힌 줄의 텍스트 뒤에 표시되는 내용 | ` ⋯ `, `muted-foreground` |
| `placeholder` | 텍스트가 비어 있는 동안 표시 | `muted-foreground` |
| `diagnosticError` | 오류 아래의 선 | `destructive` |
| `diagnosticWarning` | 경고 아래의 선 | 호박색 |
| `diagnosticInfo` | 정보 아래의 선 | 파란색 |
| `diagnosticHint` | 힌트 아래의 선 | `muted-foreground` |
| `unnecessaryText` | `unnecessary` 진단의 텍스트 | `muted-foreground` |
| `deprecatedText` | `deprecated` 진단의 텍스트 | 취소선 |
| `whitespace` | 공백과 탭의 표시(`showWhitespaces`) | `·`와 `→`, 60%의 `muted-foreground` |
| `ruler` | `rulers`의 선 | `border`의 1pt 선 |
| `selectionHandle` | 터치 선택 양 끝 핸들의 손잡이 | `primary`의 10pt 점 |
| `selectionHandleStart`, `selectionHandleEnd` | 시작 손잡이(줄 위)와 끝 손잡이(줄 아래), `selectionHandle` 뒤에 적용 | |
| `completionMenu` | 자동 완성 목록의 박스 | `popover`, 1pt `border`, 둥근 모서리, 그림자 |
| `completionItem` | 목록의 모든 항목 | 한 행의 높이, 8pt 패딩 |
| `selectedCompletionItem` | 선택된 항목, `completionItem` 뒤에 적용 | `accent` |
| `completionMatch` | 쿼리와 일치한 레이블의 글자 | Semibold, `primary` |
| `completionDetail` | 항목의 상세 정보, 레이블 뒤 | 오른쪽 정렬, `muted-foreground` |
| `completionKind` | 항목의 종류, 레이블 앞 | 짧은 이름(`fn`, `var`, `cls`), `muted-foreground` |
| `completionDocumentation` | 선택된 항목의 문서, 목록 옆 | `completionMenu`와 같음, 최대 너비 320pt |
| `inlineCompletion` | 캐럿 위치의 인라인 자동 완성 | `muted-foreground` |
| `definitionLink` | 정의 링크의 밑줄 | 텍스트 아래 `primary`의 1pt 선 |

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | 앱이 제어하는 텍스트(`onChange`에서 다시 설정). |
| `defaultValue` | `.default_value(..)` | `string` | | 편집기가 자체적으로 텍스트를 유지할 때의 초기 텍스트. |
| `language` | `.language(..)` | `string` | 일반 텍스트 | 언어의 이름, 별칭, 확장자 또는 파일 이름([언어](#languages)). |
| `placeholder` | `.placeholder(..)` | `string` | | 텍스트가 비어 있는 동안 표시됩니다. |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | 텍스트를 선택하고 복사할 수 있지만 변경할 수 없습니다. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 나타날 때 포커스를 받습니다. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | 거터의 줄 번호. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | 긴 줄이 편집기 너비에서 줄바꿈됩니다. |
| `tabSize` | `.tab_size(..)` | `number` | 언어 기본값 | 탭과 들여쓰기 수준 하나의 열 수. |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | 언어 기본값 | 탭으로 들여씁니다. |
| `folding` | `.folding(..)` | `boolean` | `true` | 들여쓴 줄을 거터의 마커로 접을 수 있습니다. |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | 들여쓰기 기준 | 접기가 시작되는 위치, 앱이 지정([접기](#folding)). |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | 내장 구문 강조([직접 만든 강조](#your-own-highlighting)). |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | 괄호와 따옴표가 입력되는 대로 닫힙니다. |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | 새 줄이 들여쓰기를 유지하며, 여는 괄호 뒤에서는 들여씁니다. |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | 캐럿이 있는 줄의 행이 강조됩니다. |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | 들여쓰기 가이드. |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | 텍스트가 마지막 줄을 지나서도 스크롤됩니다. 한 화면까지(`true`), 전혀 안 됨(`false`), 또는 지정한 행 수만큼. |
| `fontFamily` | `.font_family(..)` | `string` | 테마의 `font-mono` | 텍스트를 그리고 측정하는 글꼴. |
| `fontSize` | `.font_size(..)` | `number` | `13` | 글꼴 크기(포인트). |
| `lineHeight` | `.line_height(..)` | `number` | `20` | 행의 높이(포인트). |
| `search` | `.search(..)` | `EditorSearch` | | 찾을 대상([찾기 및 바꾸기](#find-and-replace)). |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | 표시할 문제([진단](#diagnostics)). |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | 앱이 스타일을 지정하는 범위([데코레이션](#decorations)). |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | 거터에서 데코레이션 표시를 담는 영역의 너비(포인트). |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | 부분별 Tailwind 클래스. |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | 부분별 인라인 스타일, 클래스보다 우선합니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | 스크린 리더가 편집기를 부르는 이름. |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | 공백과 탭이 `·`와 `→`로 표시됩니다. |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | 세로선을 그릴 열. |
| `minRows` | `.min_rows(..)` | `number` | | 편집기가 이 행 수부터 텍스트에 맞춰 커집니다([크기와 스크롤](#size-and-scrolling)). |
| `maxRows` | `.max_rows(..)` | `number` | | 편집기가 이 행 수까지 텍스트에 맞춰 커진 뒤 스크롤됩니다. |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | 캐럿의 위아래로 화면에 유지되는 행 수. |
| `completion` | `.completion(..)` | `boolean` | `false` | 편집기가 제안을 요청하고 목록으로 표시합니다([자동 완성](#completion)). |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | 입력하는 동안 자동 완성을 요청하는 그 밖의 트리거. |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | 인라인 자동 완성을 요청하기 전에 입력이 멈춰 있어야 하는 시간(밀리초). |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | | 편집기의 박스. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | 텍스트가 변경되었습니다. `{ value }`는 전체 새 텍스트입니다. |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | 선택 영역이 변경되었습니다. `{ selections }`는 모든 선택 영역이며 기본 선택 영역이 마지막입니다. |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | 편집기가 포커스를 얻거나 잃었습니다. |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | 검색의 일치 항목이 변경되었습니다. `{ result }`는 `{ count, current, error }`입니다. |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | 줄 번호를 눌렀습니다. `{ line }`는 0부터 시작하는 줄 번호입니다. |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | 텍스트 위에서 보조 버튼을 눌렀거나 터치로 텍스트를 선택했습니다: `{ position, x, y, selection? }`. |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | 마우스가 문자 위에 머물러 있습니다([언어 기능](#language-features)). |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | 호버가 끝났습니다. |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | 문자를 눌렀습니다. 해당 단어, 수정자 키, 클릭 수가 함께 전달됩니다. |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | `findWithSelection`가 실행되었습니다. `{ query }`는 찾기 막대의 쿼리로 쓸 텍스트입니다. |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | 접힌 범위가 변경되었습니다. `{ folds }`는 중첩된 범위를 포함한 모든 범위입니다. |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | 편집기가 자동 완성을 요청합니다: `{ id, offset, position, query, queryStart, trigger, character? }`([자동 완성](#completion)). |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | 항목이 수락되어 삽입되었습니다: `{ item }`. |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | 입력이 멈췄습니다. 인라인 자동 완성을 위한 `{ id, offset, position }`입니다. |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | 편집기가 정의를 요청합니다: `{ id, position, offset, range, trigger }`([정의로 이동](#go-to-definition-and-code-actions)). |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | 사용자가 코드 액션을 요청했습니다: `{ range, position, bounds? }`. |

<a id="accessibility"></a>

## 접근성

스크린 리더는 편집기를 `accessibilityLabel`로 부릅니다. 편집기의 포커스는 텍스트 입력과 같으므로 플랫폼의 텍스트 서비스(입력기, 음성 받아쓰기, 소프트 키보드)가 편집기에서 동작합니다.

<a id="related"></a>

## 관련 항목

- [TextView](./text-view.md): Markdown 및 HTML 문서로, 코드 블록이 편집기의 구문 색상을 공유합니다.
- [DiffView](./diff-view.md): 두 텍스트 사이의 변경 사항을 편집기의 구문 색상으로 보여줍니다.
- [Input](./input.md): 플랫폼 고유의 편집 기능을 갖춘 한 줄 및 여러 줄 텍스트 필드.
- [`keymap`](../modules/nsh.md#keymap): 편집기 명령에 대한 앱의 키 바인딩.
- [`nsh/base`](../modules/nsh-base.md): 그 밖의 기본 컴포넌트.
