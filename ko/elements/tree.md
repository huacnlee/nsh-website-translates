---
title: "Tree"
description: "Tree: 항목이 다른 항목을 포함하고, 펼치거나 접을 수 있으며, 그중 하나를 선택할 수 있는 컴포넌트입니다. 프로젝트의 파일, 설정 사이드바, 개요 등에 사용합니다. 가상화(virtualized)를 지원하고, 키보드 포커스가 한 곳에만 머물며, 스크린 리더에는 트리 구조로 전달됩니다. 각 행의 모양은 앱에서 정합니다."
group: base
demo: el-tree
source_hash: db7f601c01cf83b3
---

# Tree

Tree는 항목을 담은 항목을 보여 줍니다. 프로젝트의 파일과 폴더, 설정 사이드바의 섹션, 문서의 개요 등이 그 예입니다. `Tree`가 트리의 동작을 맡습니다. 어떤 항목이 펼쳐져 있는지, 어떤 항목이 선택되어 있는지, 키보드 동작, 그리고 스크린 리더가 읽어 주는 내용이 여기에 속합니다. 행은 가상화됩니다. 보이는 행만 만들어지고 접힌 항목의 자식은 아예 만들어지지 않으므로, 수천 개의 항목이 있는 트리도 즉시 열리고 스크롤됩니다. 모양은 앱의 몫입니다. Tree는 자체적으로 아무것도 그리지 않으며, 앱이 각 행의 스타일(`itemClass`)을 지정하고 내용(`renderItem`: 아이콘, 항목의 깊이만큼 들여쓴 레이블, 쉐브론, 배지)을 그립니다.

```rust tabs
use nsh_base::{TreeEntry, TreeItem, theme, tree};
use nsh_core::prelude::*;

fn files() -> impl IntoElement {
    let items = vec![
        TreeItem::new("src", "src")
            .child(TreeItem::new("src/main.rs", "main.rs"))
            .child(TreeItem::new("src/ui", "ui").child(TreeItem::new("src/ui/tree.rs", "tree.rs"))),
        TreeItem::new("Cargo.toml", "Cargo.toml"),
    ];
    let selected = signal(None::<SharedString>);
    tree()
        .items(items)
        .default_expanded(vec!["src".into()])
        .selected(move || selected.get())
        .on_selected_change(move |id: &SharedString| selected.set(Some(id.clone())))
        .accessibility_label("Files")
        .h(px(320.0))
        .list_class("p-1")
        .item_class(
            "group rounded-md hover:bg-accent selected:bg-primary/10 \
             focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50",
        )
        .render_item(|entry: &TreeEntry| {
            view()
                .flex_row()
                .gap_2()
                .h_8()
                .items_center()
                .rounded_md()
                .pl(px(8.0 + 16.0 * entry.depth as f32))
                .child(text(if entry.folder { "▸" } else { " " }).text_color(move || theme().muted_foreground))
                .child(text(entry.label.clone()))
        })
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tree, type TreeItem } from "nsh/base";

const files: TreeItem[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/main.rs", label: "main.rs" },
      { id: "src/ui", label: "ui", children: [{ id: "src/ui/tree.rs", label: "tree.rs" }] },
    ],
  },
  { id: "Cargo.toml", label: "Cargo.toml" },
];

function App() {
  const expanded = signal(["src"]);
  const selected = signal<string | null>(null);
  return (
    <Tree
      items={files}
      expanded={expanded()}
      selected={selected()}
      onExpandedChange={({ expanded: next }) => expanded.set(next)}
      onSelectedChange={({ selected: next }) => selected.set(next)}
      accessibilityLabel="Files"
      class="h-80 w-64 rounded-lg border border-border"
      listClass="p-1"
      itemClass="group h-8 rounded-md hover:bg-accent selected:bg-primary/10 focus:outline-2 focus:-outline-offset-2 focus:outline-ring disabled:opacity-50"
      renderItem={(entry) => (
        <View class="h-8 flex-row items-center gap-2" style={{ paddingLeft: 8 + entry.depth * 16 }}>
          <Text class="w-3 text-muted-foreground transition-transform group-aria-expanded:rotate-90">
            {entry.folder ? "›" : ""}
          </Text>
          <Text class="text-sm text-foreground">{entry.label}</Text>
        </View>
      )}
    />
  );
}

mount(App);
```

`Tree`는 Rust의 `nsh-base` crate인 [`nsh/base`](../modules/nsh-base.md)에서 제공됩니다. 앱이 `expanded`과 `selected`을 설정하면 펼쳐진 항목과 선택된 항목은 앱이 관리하며, 앱은 `onExpandedChange`과 `onSelectedChange`에서 이를 갱신합니다. 설정하지 않으면 Tree가 자체 상태를 유지하며 `defaultExpanded`와 `defaultSelected`에서 시작합니다. 항목은 레이블이 아니라 앱이 정한 `id`(경로, 레코드의 키 등)로 식별합니다. Rust에서는 `tree()`로 만들며, prop마다 setter(`.items(..)`, `.expanded(..)`, `.render_item(..)`)가 있고, 이벤트마다 리스너 메서드가 있으며, 타입이 지정된 스타일 메서드를 사용할 수 있습니다.

<a id="items"></a>

## 항목

`items`은 최상위 항목들이며, 각 항목은 `TreeItem`입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | `string` | `expanded`, `selected` 및 이벤트에서 항목을 식별하는 값입니다. 트리 안에서 고유해야 합니다(같은 id가 두 번 주어지면 로그에 기록되며, 처음 나온 항목만 펼쳐지거나 선택됩니다). |
| `label` | `string` | `renderItem`이 그리지 않을 때 행에 표시되는 내용이며, 스크린 리더가 읽는 내용이자 typeahead가 일치시키는 대상입니다. |
| `children` | `TreeItem[]` | 항목 아래에 순서대로 놓이는 항목들입니다. 하나라도 있으면 폴더가 되어 펼치고 접을 수 있습니다. |
| `disabled` | `boolean` | 사용자가 선택, 펼치기, 접기를 할 수 없습니다. 누르기와 키 입력은 이 항목을 건너뛰며, `disabled:` 스타일이 적용됩니다. 자식은 `expanded`이 정한 대로 유지됩니다. |

`renderItem`은 보이는 각 행마다 `TreeEntry`을 받습니다. 항목의 `id`, `label`, `disabled`, `depth`(최상위는 0, 최상위 항목 아래는 1, …), 그리고 `folder`인지 여부입니다. 이것은 항목이 무엇인지를 나타내며, 행의 상태는 클래스로 표현됩니다. 그리기는 항목마다 한 번만 이루어지고 행이 선택되거나 펼쳐지거나 접혀도 뷰가 유지되므로, 쉐브론이 트랜지션과 함께 회전합니다.

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `items` | `.items(..)` | `TreeItem[]` | `[]` | 최상위 항목들이며, 각 항목은 자신의 하위 항목을 가집니다. |
| `expanded` | `.expanded(..)` | `string[]` | 없음 | 펼쳐진 항목의 id들입니다(제어 방식). 항목은 그 위의 모든 항목이 펼쳐져 있을 때 표시됩니다. |
| `defaultExpanded` | `.default_expanded(..)` | `string[]` | `[]` | `expanded`이 설정되지 않았을 때, 처음에 펼쳐져 있는 항목들입니다. |
| `selected` | `.selected(..)` | `string \| null` | 없음 | 선택된 항목의 id입니다(제어 방식). 없으면 `null`입니다. |
| `defaultSelected` | `.default_selected(..)` | `string` | 없음 | `selected`이 설정되지 않았을 때, 처음에 선택되어 있는 항목입니다. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 읽기 전용 트리입니다. 누르기도 키 입력도 받지 않고, 키보드 포커스 정지 지점도 없으며, 모든 행에 `disabled:`이 적용됩니다. `expanded`과 `selected`이 나타내는 상태를 보여 줍니다. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | 펼치거나 접을 때 해당 항목 뒤의 행들이 스프링 애니메이션과 함께 새 위치로 이동하며, 네이티브로 실행됩니다. 동작 줄이기 설정에서는 꺼집니다. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | 없음 | 스크린 리더가 트리를 부르는 이름입니다("Files"). |
| `renderItem` | `.render_item(..)` | `(entry: TreeEntry) => JSX.Element` | 없음 | 보이는 행의 내용입니다. 없으면 행은 항목의 레이블을 표시합니다. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | 없음 | 각 행의 높이, 패딩, 표면, 상태(아래 참조)입니다. 텍스트 스타일은 레이블에 적용됩니다. |
| `listClass`, `listStyle` | `.list_class(..)`, `.list_style(..)` | `string`, `StyleProp<ViewStyle>` | 없음 | 트리 안에서 행을 담는 스크롤 뷰의 패딩과 간격입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | 없음 | 트리 자체입니다. 높이를 지정하세요(또는 높이가 있는 부모 안에서 `flex-1`을 사용하세요). 행은 그 안에서 스크롤되며, 보이는 행만 만들어집니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 페이로드 | 시점 |
|---|---|---|---|
| `onExpandedChange` | `.on_expanded_change(..)` | `{ expanded: string[] }` | 사용자가 항목을 펼치거나 접었습니다(누르기, Return, Space, Right 또는 Left, `revealItem`). 변경 후 펼쳐질 id들이 전달됩니다. |
| `onSelectedChange` | `.on_selected_change(..)` | `{ selected: string }` | 사용자가 다른 항목을 선택했습니다(누르기, 화살표 키, Home, End, typeahead). |
| `onExpand` | `.on_expand(..)` | `{ id: string }` | 사용자가 `id`의 항목을 펼쳤으며, `onExpandedChange` 뒤에 발생합니다. |
| `onCollapse` | `.on_collapse(..)` | `{ id: string }` | 사용자가 `id`의 항목을 접었으며, `onExpandedChange` 뒤에 발생합니다. |
| `onAction` | `.on_action(..)` | `{ id: string }` | 사용자가 `id`의 항목에 대해 동작을 실행했습니다. 자식이 없는 선택된 항목에서 Return을 누르거나, 아무 항목에서나 더블 클릭 또는 더블 탭을 한 경우이며, 누르기 자체의 이벤트 뒤에 발생합니다. 비활성화된 항목과 비활성화된 트리는 이 이벤트를 보고하지 않습니다. |

선택은 화살표 키를 따라 움직이므로, 파일 탐색기는 `onAction`에서 파일을 열고 `onSelectedChange`에서는 열지 않습니다. 파일 사이를 이동하면 하나씩 미리보기가 되고, Return이나 더블 클릭으로 사용자가 원하는 파일을 엽니다.

```tsx
<Tree
  items={files}
  onSelectedChange={({ selected }) => preview.set(selected)}
  onAction={({ id }) => openFile(id)}
/>
```

<a id="parts"></a>

## 파트

| 파트 | 포함 위치 | 스타일 지정 | 상태 |
|---|---|---|---|
| 트리 | | `class`, `style` | |
| 목록 | 트리 | `listClass`, `listStyle` | |
| 행 | 목록 | `itemClass`, `itemStyle` | `selected:`, `aria-expanded:`(열려 있는 폴더), `focus:`(트리가 키보드 포커스를 가진 동안 키가 동작하는 대상 행으로, 선택된 행, 숨겨진 선택이 속한 접힌 항목, 또는 선택이 없을 때 첫 번째 행), `disabled:`, `hover:`, `active:` |
| 행의 내용 | 행 | `renderItem` | `itemClass`의 `group` 아래: `group-selected:`, `group-aria-expanded:`, `group-focus:`, `group-disabled:` |

선택된 행은 `selected:`으로, 키보드의 위치는 `focus:`으로 표시하세요([Design guides](../docs/design-guides.md#interaction-states) 참조). 포커스는 행 안쪽에 그리세요(`focus:outline-2 focus:-outline-offset-2`). 목록은 양쪽 가장자리를 넘어가는 부분을 잘라 냅니다.

## Ref

| 메서드 | 설명 |
|---|---|
| `focus()` | Tab으로 트리에 도달했을 때처럼 키보드 포커스를 가져옵니다. |
| `revealItem(id)` | `id`의 항목 위에 있는 항목들을 펼치고(`onExpandedChange`과 `onExpand`으로 보고되며, 가장 바깥쪽부터), 해당 행이 표시되면 그 행을 보이도록 스크롤합니다. 앱이 변경을 따르는 경우에는 즉시 스크롤하고, 따르지 않는 경우에는 요청이 거기서 끝납니다. |

```tsx
let files: TreeRef | undefined;

<Tree ref={(r) => (files = r)} items={items} />;
files?.revealItem("src/ui/tree.rs");
```

<a id="disabled"></a>

## 비활성화

비활성화된 항목은 누르기를 받지 않고, 화살표 키는 이를 건너뛰며, 스크린 리더는 흐리게 표시된 항목으로 안내합니다. 트리에 `disabled`을 적용하면 읽기 전용이 되어, 앱의 상태가 나타내는 내용을 보여 주기만 하고 입력은 받지 않습니다.

```tsx
<Tree items={items} disabled={locked()} itemClass="h-8 px-2 disabled:opacity-50" />
```

<a id="accessibility"></a>

## 접근성

- 트리의 역할은 `"tree"`이며 `accessibilityLabel`으로 이름이 지정됩니다. 각 행은 항목의 레이블을 이름으로 하는 `"treeitem"`이고, 레벨(깊이 + 1), 펼침 여부(폴더인 경우), 선택 여부, 비활성화 여부를 가집니다.
- 트리가 키보드 포커스를 받을 때와 키로 선택이 이동할 때, 키가 동작하는 대상 행이 스크린 리더의 포커스를 받습니다.

레이블, 역할, 안내 방송에 대한 일반적인 내용은 [Accessibility](../docs/accessibility.md)를 참조하세요.

<a id="keyboard"></a>

## 키보드

Tab으로 누르기를 받는 뷰에 도달할 수 있는 데스크톱과 웹에서는, `Tree`이 [WAI-ARIA tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)을 따릅니다.

| 키 | 동작 |
|---|---|
| Tab, Shift+Tab | 한 번에 트리로 들어가고, 한 번에 트리를 벗어납니다. 다시 돌아오면 키 동작은 선택된 행에서 이어집니다. 선택된 항목이 없으면 포커스가 첫 번째 행에 표시되며, Down을 누르면 그 행이 선택됩니다. |
| Down, Up | 비활성화된 항목을 건너뛰어 다음 행 또는 이전 행을 선택하며, 마지막에서 처음으로, 처음에서 마지막으로 순환합니다. |
| Right | 접힌 폴더를 펼칩니다. 이미 펼쳐진 폴더에서는 활성화된 첫 번째 자식을 선택합니다. |
| Left | 펼쳐진 폴더를 접습니다. 그 외의 항목에서는 부모를 선택합니다. |
| Home, End | 첫 번째 행 또는 마지막 행을 선택합니다. |
| Return | 선택된 폴더를 펼치거나 접습니다. 자식이 없는 항목에서는 해당 항목에 대해 동작을 실행합니다(`onAction`). |
| Space | 선택된 폴더를 펼치거나 접습니다. |
| 문자, 숫자 | 입력한 내용으로 레이블이 시작하는 다음 행을 선택합니다. |

선택이 접힌 항목 아래에 숨겨져 있는 동안(앱이 그 항목을 접은 경우)에는 키가 그 항목의 행에 대해 동작합니다. Right나 Return은 그 항목을 펼치고, Down은 그 뒤의 행을 선택합니다.

오른쪽에서 왼쪽으로 배치되는 레이아웃에서는 행이 오른쪽에서부터 나열되므로, 패턴에서 정한 대로 Left와 Right의 역할이 서로 바뀝니다. Left는 폴더를 펼치고 그 안으로 들어가며, Right는 폴더를 접고 부모를 선택합니다. Up, Down, Home, End는 그대로입니다.

<a id="platform-notes"></a>

## 플랫폼 참고 사항

- iOS, Android, Mac Catalyst: 탭하면 행이 선택되고 폴더가 펼쳐지거나 접힙니다. 더블 탭하면 해당 항목에 대해 동작을 실행합니다(`onAction`).
- 데스크톱(macOS, Windows, Linux, GPUI)과 웹: 클릭하면 같은 동작을 하고 트리에 키보드 포커스를 주며, 위의 키로 트리 안에서 이동할 수 있습니다. 더블 클릭하면 해당 항목에 대해 동작을 실행합니다.
- 모든 플랫폼은 앱이 스타일을 지정한 내용, 즉 트리, 행, 행의 내용을 그립니다.
