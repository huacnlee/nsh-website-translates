---
title: "Command"
description: "Command: 명령 팔레트로, 사용자가 입력하는 대로 앱의 명령을 필터링하는 검색 필드입니다. 대화상자 안의 Cmd+K 팔레트, 인라인 명령 메뉴, 앱이 응답하는 검색 등으로 사용할 수 있습니다. 가상화되어 있고 키보드 중심으로 동작하며, 스크린 리더를 위한 리스트 박스를 제공합니다. 각 부분의 모양은 앱이 직접 정합니다."
group: base
demo: el-command
source_hash: b1a002e27d282723
---

# Command

명령 팔레트는 명령 목록 위에 검색 필드가 놓인 컴포넌트입니다. 사용자가 몇 글자를 입력하면 목록이 일치하는 명령으로 좁혀지고, 화살표 키로 강조 표시를 옮기며, Return을 누르면 강조된 명령이 실행됩니다. 팔레트의 동작(필터링, 섹션, 강조 표시, 키보드, 스크린 리더가 읽는 내용)은 `Command`에서 담당합니다. 필터링은 네이티브로 실행되고 행은 가상화됩니다. 보이는 행만 만들어지므로 수천 개의 명령, 파일, 이모지가 있는 팔레트도 키를 입력할 때마다 필터링됩니다. 외형은 앱의 몫입니다. 명령 팔레트 자체는 아무것도 그리지 않으며, 앱이 각 파트(`itemClass`, `groupClass`, `searchClass`, ...)의 스타일을 지정하고 행의 내용(`renderItem`: 아이콘, 레이블, 단축키의 키)을 그립니다.

```rust tabs
use nsh_base::{CommandEntry, CommandItem, command, theme};
use nsh_core::prelude::*;

fn palette() -> impl IntoElement {
    let items = vec![
        CommandItem::new("new", "New File").group("File").shortcut("mod+n"),
        CommandItem::new("open", "Open…").group("File").shortcut("mod+o"),
        CommandItem::new("theme", "Toggle Theme").group("View").keywords(["dark", "light"]),
        CommandItem::new("settings", "Settings").group("View").shortcut("mod+,"),
    ];
    let chosen = signal(SharedString::from("none"));
    command()
        .items(items)
        .placeholder("Type a command or search…")
        .accessibility_label("Commands")
        .auto_focus(true)
        .on_select(move |id: &SharedString| chosen.set(id.clone()))
        .empty(text("No results.").text_color(move || theme().muted_foreground))
        .h(px(360.0))
        .render_item(|entry: &CommandEntry| {
            view()
                .flex_row()
                .items_center()
                .h_8()
                .px_2()
                .child(text(entry.label.clone()).flex_1())
                .child(
                    text(entry.shortcut_label.clone().unwrap_or_default())
                        .text_color(move || theme().muted_foreground),
                )
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Command, type CommandItem } from "nsh/base";

const commands: CommandItem[] = [
  { id: "new", label: "New File", group: "File", shortcut: "mod+n" },
  { id: "open", label: "Open…", group: "File", shortcut: "mod+o" },
  { id: "theme", label: "Toggle Theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Settings", group: "View", shortcut: "mod+," },
];

function App() {
  const chosen = signal("none");
  return (
    <Command
      items={commands}
      placeholder="Type a command or search…"
      accessibilityLabel="Commands"
      searchAccessibilityLabel="Search commands"
      autoFocus
      onSelect={({ id }) => chosen.set(id)}
      class="w-96 overflow-hidden rounded-lg border border-border bg-popover"
      searchBarClass="flex-row items-center gap-2 border-b border-border px-3"
      searchClass="h-11 flex-1 text-sm text-foreground placeholder:text-muted-foreground"
      listClass="max-h-80 p-1"
      groupClass="px-2 py-1.5 text-xs font-medium text-muted-foreground"
      separatorClass="-mx-1 my-1 h-px bg-border"
      itemClass="group h-8 flex-row items-center rounded-md px-2 focus:bg-accent disabled:opacity-50"
      empty={<Text class="py-6 text-center text-sm text-muted-foreground">No results.</Text>}
      renderItem={(entry) => (
        <View class="flex-1 flex-row items-center gap-2">
          <Text class="flex-1 text-sm text-foreground group-focus:text-accent-foreground">{entry.label}</Text>
          <Text class="text-xs text-muted-foreground">{entry.shortcutLabel ?? ""}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Command`의 동작은 [`nsh/base`](../modules/nsh-base.md)에서 가져오며, Rust에서는 `nsh-base` 크레이트입니다. 앱이 `query` 속성을 설정하면 쿼리는 앱의 것이 되고, 앱은 `onQueryChange`에서 이를 갱신합니다. 설정하지 않으면 검색 필드가 자체 쿼리를 유지하며 `defaultQuery` 값에서 시작합니다. 항목은 레이블이 아니라 앱이 정한 `id` 값으로 식별되며, 사용자가 어떤 항목을 선택했는지는 `onSelect({ id })` 이벤트가 알려 줍니다. Rust에서는 `command()` 호출로 생성하며, 속성마다 setter(`.items(..)`, `.query(..)`, `.render_item(..)`), 이벤트마다 리스너 메서드, 그리고 타입이 지정된 스타일 메서드가 제공됩니다.

<a id="items"></a>

## 항목

`items` 속성은 명령을 순서대로 담으며, 각 명령은 `CommandItem` 형식입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | `string` | `onSelect` 및 `onHighlightChange`에서 항목을 식별하는 값으로, 항목 간에 고유해야 합니다. |
| `label` | `string` | 행에 표시되는 내용(`renderItem` 사용 시 제외), 스크린 리더가 읽는 내용, 쿼리가 일치를 검사하는 대상입니다. |
| `keywords` | `string[]` | 쿼리가 일치를 검사하는 추가 단어: 동의어, 번역된 레이블 옆에 두는 영어 이름 등입니다. |
| `group` | `string` | 항목이 속한 섹션: 같은 그룹의 인접한 항목은 이 제목을 가진 헤더 아래에 표시됩니다. |
| `shortcut` | `string` | 같은 명령의 키 입력으로, [`keymap`](../modules/nsh.md#keymap)의 표기 방식(`"mod+shift+p"`)을 따르며 행에 표시됩니다. 바인딩(`keymap.bind`)은 앱이 담당합니다. |
| `disabled` | `boolean` | 선택할 수 없음: 키 이동 시 건너뛰고, 눌러도 아무 일도 일어나지 않으며, `disabled:` 스타일이 적용됩니다. |
| `checked` | `boolean` | 현재 적용 중인 항목(테마, 언어): `checked:` 스타일이 적용되고 스크린 리더는 체크된 항목으로 읽습니다. |

항목의 레이블이나 키워드 중 하나에 쿼리가 포함되면 해당 항목이 일치하며, 대소문자와 쿼리 앞뒤 공백은 무시합니다. 항목의 순서는 유지되고, 일치하는 항목이 없는 섹션은 헤더와 함께 사라집니다. `renderItem`에는 보이는 행마다 `CommandEntry` 값이 전달됩니다. 여기에는 항목의 필드와, 힌트가 여기서 표시하는 방식의 `shortcut`인 `shortcutLabel`(Apple 플랫폼에서는 `⇧⌘P`, 그 외에는 `Ctrl+Shift+P`)이 들어 있습니다. 이는 항목이 무엇인지를 나타내고, 강조 표시는 행의 `focus:`입니다. 그리기는 항목마다 한 번만 이루어지며 강조 표시가 이동하는 동안에도 뷰를 그대로 유지합니다.

<a id="props"></a>

## 속성

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `items` | `.items(..)` | `CommandItem[]` | `[]` | 명령 목록, 순서대로. |
| `query` | `.query(..)` | `string` | 없음 | 쿼리(제어 방식). 앱이 `onQueryChange`에서 설정합니다. |
| `defaultQuery` | `.default_query(..)` | `string` | 없음 | 초기 쿼리. `query` 미설정 시에 사용됩니다. |
| `searchable` | `.searchable(..)` | `boolean` | `true` | 행 위의 검색 필드. 없으면 모든 항목이 표시되며, 명령 팔레트는 타이프어헤드를 지원하는 키보드 포커스 정지점 하나가 됩니다. |
| `filterable` | `.filterable(..)` | `boolean` | `true` | 쿼리가 항목을 필터링합니다. 끄면 모든 항목이 표시됩니다. 앱이 직접 응답하는 검색(`items` 속성에 설정한 서버 결과)에 쓰입니다. 새 쿼리는 여전히 첫 번째 항목을 강조합니다. |
| `loading` | `.loading(..)` | `boolean` | `false` | 검색이 진행 중임을 나타냅니다. 이때 `empty` 처리는 대기하며, 스크린 리더에는 목록이 사용 중(busy)으로 전달됩니다. 표시기는 `searchSuffix`에 표시하세요. |
| `placeholder` | `.placeholder(..)` | `string` | 없음 | 검색 필드의 플레이스홀더. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | 표시되면 검색 필드가 키보드 포커스를 받습니다. 열리자마자 입력하게 되는 팔레트용입니다. |
| `separator` | `.separator(..)` | `boolean` | `true` | 표시된 두 섹션 사이의 구분선 행(스타일 지정: `separatorClass`). 맨 앞, 맨 뒤, 연속으로는 나타나지 않습니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 목록을 부르는 이름("Commands")이며, `searchAccessibilityLabel` 미설정 시 검색 필드의 이름으로도 쓰입니다. |
| `searchAccessibilityLabel` | `.search_accessibility_label(..)` | `string` | `accessibilityLabel` | 스크린 리더가 검색 필드를 부르는 이름: 무엇을 검색하는지("Search commands"). |
| `header`, `footer` | `.header(..)`, `.footer(..)` | `JSX.Element` | 없음 | 검색 필드 위(제목)와 행 아래(키 힌트, 개수)에 표시되는 내용. |
| `empty` | `.empty(..)` | `JSX.Element` | 없음 | 표시할 항목이 없을 때 보이는 내용: 일치하는 항목이 없는 쿼리, 항목 없음. |
| `searchPrefix`, `searchSuffix` | `.search_prefix(..)`, `.search_suffix(..)` | `JSX.Element` | 없음 | 검색 바에서 검색 필드 앞뒤에 표시되는 내용: 검색 아이콘, `loading` 동안의 스피너. |
| `renderItem` | `.render_item(..)` | `(entry: CommandEntry) => JSX.Element` | 없음 | 보이는 행의 내용. 없으면 행에 항목의 레이블이 표시됩니다. |
| `renderGroup` | `.render_group(..)` | `(group: CommandGroup) => JSX.Element` | 없음 | 섹션의 헤더(`{ heading }`). 없으면 헤더에 제목이 표시됩니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 명령 팔레트 자체: 크기, 프레임, 표면. |
| `searchBarClass`, `searchBarStyle` | `.search_bar_class(..)`, `.search_bar_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 검색 바의 행(`searchPrefix`, 검색 필드, `searchSuffix`). |
| `searchClass`, `searchStyle` | `.search_class(..)`, `.search_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 검색 필드. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 행의 스크롤 뷰. 높이를 지정하세요(`max-h-80` 또는 크기가 지정된 명령 팔레트). 행은 그 안에서 스크롤되며, 보이는 행만 만들어집니다. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 항목의 행과 그 상태(아래 참고). 텍스트 스타일은 레이블에 적용됩니다. |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 섹션의 헤더. |
| `separatorClass`, `separatorStyle` | `.separator_class(..)`, `.separator_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 각 구분선: 선의 높이와 색상. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 페이로드 | 시점 |
|---|---|---|---|
| `onSelect` | `.on_select(..)` | `{ id: string }` | 사용자가 항목을 선택했습니다: Return 또는 해당 행을 누름. |
| `onHighlightChange` | `.on_highlight_change(..)` | `{ highlighted: string \| null }` | 강조 표시가 이동했습니다(키, 포인터, 새 쿼리나 새 항목, `highlight`). Return을 눌렀을 때 실행될 항목을 미리 보는 데 씁니다. |
| `onQueryChange` | `.on_query_change(..)` | `{ query: string }` | 사용자가 검색 필드에 입력했거나 Escape로 비웠습니다. |
| `onCancel` | `.on_cancel(..)` | 없음 | 쿼리가 빈 상태에서 Escape: 명령 팔레트를 담고 있는 요소를 닫습니다(대화상자의 `open`). |

<a id="parts"></a>

## 파트

| 파트 | 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 명령 팔레트 | | `class`, `style` | |
| `header` | 명령 팔레트 | 앱의 요소 | |
| 검색 바 | 명령 팔레트 | `searchBarClass`, `searchBarStyle` | |
| `searchPrefix`, 검색 필드, `searchSuffix` | 검색 바 | 앱의 요소; `searchClass`, `searchStyle` | 필드의 `focus:` |
| 목록 | 명령 팔레트 | `listClass`, `listStyle` | |
| 섹션 헤더 | 목록 | `groupClass`, `groupStyle`, `renderGroup` | |
| 구분선 | 목록 | `separatorClass`, `separatorStyle` | |
| 행 | 목록 | `itemClass`, `itemStyle` | `focus:`(강조됨), `checked:`, `disabled:`, `hover:`, `active:` |
| 행의 내용 | 행 | `renderItem` | `itemClass` 안의 `group` 아래에 `group-focus:`, `group-checked:`, `group-disabled:` |
| `empty` | 명령 팔레트 | 앱의 요소 | |
| `footer` | 명령 팔레트 | 앱의 요소 | |

강조된 행은 다음으로 표시합니다: `focus:`([디자인 가이드](../docs/design-guides.md#interaction-states) 참고).

## Ref

| 메서드 | 설명 |
|---|---|
| `focus()` | 검색 필드에 키보드 포커스를 줍니다(검색 필드가 없으면 명령 팔레트에 줍니다). |
| `highlight(id)` | `id`에 해당하는 항목을 강조하고 해당 행이 보이도록 스크롤합니다. 표시되지 않거나 비활성화된 항목은 그대로 유지됩니다. |
| `matchedCount()` | `Promise<number>`: 쿼리가 표시하는 항목 수(비활성화된 항목 포함). |

```tsx
let palette: CommandRef | undefined;

<Command ref={(r) => (palette = r)} items={items} />;
palette?.focus();
```

<a id="a-palette-in-a-dialog"></a>

## 대화상자 안의 팔레트

명령 팔레트를 [`Dialog`](./dialog.md) 안에 넣고 앱의 단축키로 엽니다. Escape는 먼저 쿼리를 비우고, 쿼리가 비어 있으면 `onCancel` 이벤트가 발생하며 여기서 앱이 대화상자를 닫습니다.

```tsx
import { keymap } from "nsh";

const open = signal(false);
keymap.bind("mod+k", () => open.set(!open()));

<Dialog open={open()} onOpenChange={({ open: next }) => open.set(next)}>
  <Command
    items={commands}
    autoFocus
    onCancel={() => open.set(false)}
    onSelect={({ id }) => {
      open.set(false);
      run(id);
    }}
  />
</Dialog>;
```

<a id="a-search-the-app-answers"></a>

## 앱이 응답하는 검색

`filterable={false}` 사용 시 앱이 전달하는 모든 항목이 표시됩니다. 앱이 `onQueryChange`에서(서버, 데이터베이스) 검색한 뒤 결과를 `items` 속성에 설정하고, 기다리는 동안에는 `loading` 속성을 설정합니다.

```tsx
<Command
  items={results()}
  filterable={false}
  loading={searching()}
  onQueryChange={({ query }) => search(query)}
  searchSuffix={searching() ? <Spinner /> : undefined}
  empty={<Text>No matches</Text>}
/>
```

<a id="accessibility"></a>

## 접근성

- 목록의 역할은 `"listbox"`이고 이름은 `accessibilityLabel`에서 가져옵니다. 각 행은 항목의 레이블을 이름으로 갖는 `"option"`이며, 체크 상태와 비활성 상태는 항목을 따릅니다. 섹션 헤더는 `"header"`이고, 구분선은 숨겨집니다.
- 검색 필드는 텍스트 필드이며 이름은 `searchAccessibilityLabel`에서 가져옵니다(없으면 `accessibilityLabel`). 플레이스홀더는 필드가 비어 있는 동안 표시되는 힌트입니다.
- 화살표 키로 강조 표시를 옮기는 동안에도 검색 필드가 키보드 포커스를 유지하며, 스크린 리더는 강조된 레이블을 읽어 줍니다. 검색 필드가 없으면 강조된 행이 스크린 리더의 포커스를 받습니다.
- `loading` 동안 목록은 사용 중(busy) 상태입니다.

레이블, 역할, 알림 전반에 대해서는 [접근성](../docs/accessibility.md)을 참고하세요.

<a id="keyboard"></a>

## 키보드

| 키 | 동작 |
|---|---|
| 입력 | 항목을 필터링하며, 일치하는 첫 번째 활성 항목이 강조됩니다. |
| Down, Up | 다음 또는 이전 항목을 강조하며, 비활성 항목은 건너뛰고 마지막에서 처음으로, 처음에서 마지막으로 순환합니다. |
| Page Down, Page Up | 보이는 행 수만큼 강조 표시를 이동합니다. |
| Return | 강조된 항목을 선택합니다(`onSelect`). |
| Escape | 쿼리를 비웁니다. 쿼리가 비어 있으면 `onCancel` 이벤트를 발생시킵니다. |
| Home, End | 검색 필드가 없을 때: 첫 번째 또는 마지막 항목(필드 안에서는 캐럿을 이동합니다). |
| Space, 문자, 숫자 | 검색 필드가 없을 때: Space는 선택하고, 문자와 숫자는 타이프어헤드로 강조합니다. |

<a id="platform-notes"></a>

## 플랫폼 참고

- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 포인터가 지나가는 행이 강조되고, 클릭은 버튼을 누르는 순간 선택되므로 검색 필드가 키보드 포커스를 유지합니다.
- iOS, Android, Mac Catalyst: 탭하면 행이 선택되고, 키보드의 return 키는 강조된 항목을 선택하며 다음 쿼리를 위해 필드를 유지합니다.
- 모든 플랫폼은 앱이 스타일을 지정한 것을 그립니다: 명령 팔레트, 검색 바, 행, 그리고 행의 내용.
