---
title: "DiffView"
description: "DiffView 컴포넌트: 두 텍스트 간의 변경 사항 또는 패치를 나란히 보기나 통합 보기로 표시하며, 줄 내에서 변경된 단어를 강조하고, 변경되지 않은 줄은 펼칠 수 있는 구분선으로 접어 보여 줍니다. 구문 강조, 자동 줄바꿈, 변경 사항별 동작, 줄 선택, 리뷰 주석을 지원합니다."
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---

# DiffView

`DiffView`는 코드 리뷰 도구처럼 두 텍스트 사이의 변경 사항을 보여 줍니다. 왼쪽에 이전 텍스트, 오른쪽에 새 텍스트를 놓고 줄을 맞춰 나란히 보여 주거나(side by side), 삭제된 줄을 추가된 줄 위에 놓는 통합 형식(unified)으로 보여 줍니다. 변경된 줄 안에서는 바뀐 단어가 강조되고, 변경 사이의 변경되지 않은 줄은 펼칠 수 있는 구분선으로 접히며, 텍스트는 [`Editor`](./editor.md)의 구문 색상으로 강조됩니다. 두 텍스트(`oldValue`와 `newValue`)나 통합 diff(`patch`: `git diff`의 diff, 풀 리퀘스트의 diff)에 담긴 파일들을 각각의 헤더 아래에 보여 주며, AI가 제안한 수정을 포함해 변경 사항을 검토하는 용도로 만들어졌습니다. 각 변경에 대한 앱의 동작으로 변경을 유지하거나 되돌릴 수 있습니다. 화면에 보이는 행만 생성되므로 긴 파일도 짧은 파일처럼 스크롤됩니다.

`DiffView`는 동작을 담당하며, 테마의 토큰으로 만든 기본 모양을 함께 제공합니다. 테마의 `font-mono`를 20pt 높이의 행에 13pt로 사용하고, 줄 번호는 `muted-foreground`로 표시하며, 추가된 줄은 녹색, 삭제된 줄은 빨간색으로 칠하고, 바뀐 단어는 더 진한 색조로 표시합니다. 변경된 각 줄의 거터 가장자리에는 막대가 있고, 구분선은 `muted`에 표시됩니다. 각 부분은 이 기본값 위에 앱의 스타일을 적용합니다(`classes`와 `styles`). Rust에서는 `nsh_base::diff_view()`로, TSX에서는 `nsh/base`의 `<DiffView>`로 만듭니다.

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

뷰는 앱이 지정한 상자(`flex-1`, 높이)를 채우고 그 안에서 스크롤됩니다. 세로로는 행을 따라, 가로로는 가장 긴 줄까지 스크롤되며, 분할 보기의 양쪽은 함께 움직입니다. `softWrap`를 사용하면 긴 줄이 가로 스크롤 대신 각 쪽의 너비에서 줄 바꿈되고, 분할 행은 더 높은 쪽의 높이를 따르므로 양쪽이 계속 정렬됩니다.

<a id="two-texts-or-a-patch"></a>

## 두 텍스트 또는 패치

- **두 텍스트**: `oldValue`와 `newValue`. 줄은 있는 그대로 비교되므로, git과 마찬가지로 마지막 줄바꿈이 추가되거나 제거되면 변경으로 간주됩니다.
- **패치**: `patch`, 파일 하나 또는 여러 개의 통합 diff입니다(`git diff`, `git format-patch`, `diff -u`. 이름 변경, 모드, 새 파일, 삭제된 파일, 바이너리 파일, 그리고 그 앞의 커밋 메시지를 git이 쓰는 형식 그대로 읽습니다). 뷰는 hunk의 줄을 파일에서의 번호 그대로 보여 주며, 각 hunk 위에는 해당 hunk 헤더(그 hunk가 속한 함수)의 구분선이 표시되고, 여러 파일이면 각 파일마다 자체 헤더가 표시됩니다([패치의 파일](#files-of-a-patch)). `language`가 설정되지 않은 경우 각 파일의 경로로 언어를 결정합니다.

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

`language`는 `Editor`와 같은 방식으로 언어를 지정합니다. 이름, 별칭, 확장자, 파일 이름을 사용할 수 있습니다(`"rust"`, `"tsx"`, `"main.go"`, `"Dockerfile"`).

<a id="files-of-a-patch"></a>

## 패치의 파일

여러 파일의 패치는 각 파일을 헤더 행 아래에 보여 줍니다. 기본 헤더에는 경로(이름이 바뀐 경우 `old → new`), 추가·삭제된 줄 수, `▾`가 표시되며, 헤더를 누르면 파일이 헤더만 남기고 접히거나(`▸`) 다시 펼쳐집니다. `renderFileHeader`는 앱이 원하는 방식으로 헤더를 그리며(파일이 하나뿐인 패치에도 헤더를 위에 표시합니다), 파일 정보(`DiffFile`)를 전달받습니다. 전달되는 항목은 `index`, `path`, `oldPath`(이름 변경 또는 복사 원본), `status`(`"modified"`, `"added"`, `"deleted"`, `"renamed"`, `"copied"`), `binary`(패치에 해당 파일의 줄이 없음), `added`, `deleted`, `hunks`, `firstHunk`, `collapsed`입니다. 앱의 헤더는 ref의 `toggleFile(path)`를 호출하며, `collapseFile`와 `expandFile`가 상태를 설정하고, 모든 변경은 `onFileToggle({ file })`로 보고됩니다. 접힌 파일은 새 `patch`에 그 파일이 여전히 있는 동안 접힌 상태를 유지합니다.

변경은 파일을 가로질러 순서대로 셉니다. 한 파일의 변경은 `firstHunk`부터 `firstHunk + hunks - 1`까지이며, `goToHunk`, `renderHunkActions`, `hunks()`가 이를 사용합니다(`DiffHunk`의 `file`는 해당 파일의 인덱스이고, 그 줄은 해당 파일 안에서 셉니다). `stats()`는 모든 파일의 변경을 합산합니다. `goToHunk`는 접힌 파일을 먼저 펼칩니다.

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

## 레이아웃과 인라인 변경

`layout`는 `"split"`(기본값: 나란히 보기이며, 삭제된 각 줄을 가장 비슷한 추가된 줄 옆에 놓음) 또는 `"unified"`(한 열이며, 변경의 삭제된 줄을 추가된 줄 위에 놓고 두 줄 번호를 모두 표시)입니다. `inline`는 변경된 줄 안에서 무엇을 강조할지 결정합니다.

| `inline` | 강조되는 대상 |
|---|---|
| `"wordAlt"` (기본값) | 바뀐 단어. 한 글자 간격이면 하나로 합쳐서, 바뀐 구절이 하나로 읽히게 합니다 |
| `"word"` | 바뀐 각 단어 |
| `"char"` | 바뀐 각 문자 |
| `"none"` | 없음: 줄의 색조만 표시 |

단어는 문자, 숫자, `_`의 연속입니다. CJK 문자, 가나, 한글 음절은 각각 하나의 단어로 취급되므로, 문장에서 바뀐 글자 하나는 그 글자만 표시됩니다. 거의 전체가 바뀐 줄은 색조만 표시됩니다.

`indicators`는 줄 번호 옆에 변경된 줄을 표시합니다. `"bars"`(기본값, 거터 가장자리의 막대), `"classic"`(텍스트 앞의 `+`와 `−`), 또는 `"none"`를 사용할 수 있습니다. `background={false}`는 변경된 줄에 색조를 입히지 않고, `lineNumbers={false}`는 번호를 숨깁니다.

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## 접힌 줄

각 변경 주위에는 변경되지 않은 줄이 `contextLines`개 표시됩니다(기본값 3). 변경 사이의 변경되지 않은 줄과 첫 변경 앞, 마지막 변경 뒤의 줄은 숨겨진 줄 수를 알려 주는 구분선으로 접힙니다. 구분선을 누르면 숨겨진 줄이 모두 표시됩니다. `expandAll`는 모든 줄을 표시하며, ref의 `expand`, `expandAll()`, `collapseAll()`로 앱에서 줄을 펼치거나 접을 수 있습니다.

`renderSeparator`는 앱이 원하는 방식으로 구분선을 그립니다. 구분선 정보(`DiffSeparator`)를 전달받으며, 여기에는 `gap`, 접힌 구간의 인덱스(첫 변경 앞은 0, 변경 `i - 1`와 `i` 사이는 `i`), `lines`(숨겨진 줄 수), `first`, `last`가 있으며, 패치의 경우 hunk의 `header`도 포함됩니다. `expand(gap, direction, lines)`는 `"all"`에 따라 숨겨진 줄을 모두 보여 주거나(기본값), 구분선 아래 변경 바로 위의 `lines`줄(기본값 20) `"up"`, 또는 위쪽 변경 바로 아래의 `"down"`를 보여 줍니다. 첫 번째 구분선은 위쪽으로, 마지막 구분선은 아래쪽으로 펼쳐집니다.

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

## 변경 유지 및 되돌리기

`renderHunkActions`는 화면에 보이는 각 변경의 오른쪽 위에 앱의 동작을 배치하며, 변경 정보(`DiffHunk`: `index`, `oldStart`, `oldLines`, `newStart`, `newLines`는 0부터 시작하는 줄, 패치에서 해당 파일의 인덱스인 `file`)를 전달받습니다. 이 동작들은 ref를 호출합니다. `revertHunk(index)`는 변경의 이전 줄을 새 텍스트에 되돌려 놓고, `acceptHunk(index)`는 변경의 새 줄을 이전 텍스트의 내용으로 만듭니다. 뷰는 결과를 즉시 표시하고 두 텍스트를 `onChange({ change })`(`{ oldValue, newValue }`)로 보고하며, 앱은 이를 props로 설정합니다. AI의 수정을 변경 하나씩 유지하거나 되돌리는 방법은 다음과 같습니다.

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

여기서 이전 텍스트는 현재 상태의 파일입니다. 변경을 유지하면 파일에 적용되고(`onApply`), 되돌리면 제안에서 제거됩니다. `patch`를 보여 주는 뷰는 파일의 발췌만 보여 주므로 변경은 그대로 유지됩니다.

<a id="methods"></a>

## 메서드

`ref={diff}`는 뷰의 메서드(`DiffViewRef`)를 제공합니다. 값을 반환하는 메서드(`hunks()`, `stats()`)는 JS에서 그 값의 `Promise`를 반환하므로 `await`해야 합니다: `const changes = await diff.hunks()`. 화면에 표시되는 개수는 `onStatsChange`가 변경될 때마다 보고합니다. diff에 없는 변경, 구분선 또는 파일을 전달받은 메서드는 아무것도 변경하지 않으며, 메서드 이름과 값을 알리는 경고를 기록합니다.

| 메서드 | 설명 |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>`: 변경 목록(순서대로). |
| `stats()` | `Promise<DiffStats>`: `{ added, deleted, hunks }`, 추가·삭제된 줄 수와 변경 수. |
| `goToHunk(index)` | 변경 `index`를 화면에 스크롤하여 첫 행이 맨 위에 오게 합니다. |
| `revertHunk(index)` | 변경 `index`의 이전 줄을 새 텍스트에 되돌려 놓고 텍스트를 보고합니다(`onChange`). |
| `acceptHunk(index)` | 변경 `index`의 새 줄을 이전 텍스트의 내용으로 만들고 텍스트를 보고합니다(`onChange`). |
| `expand(gap, direction?, lines?)` | 구분선 `gap`가 숨기는 줄을 표시합니다: `"all"`(기본값), 또는 `lines`(기본값 20) `"up"` 또는 `"down"`. |
| `expandAll()` | 변경되지 않은 모든 줄을 표시합니다. |
| `collapseAll()` | 변경되지 않은 줄을 다시 접습니다. |
| `nextHunk()` | `Promise<number \| null>`: 다음 변경을 맨 위로 스크롤하고 그 인덱스를 반환합니다(마지막 다음은 첫 번째). |
| `previousHunk()` | `Promise<number \| null>`: 이전 변경을 맨 위로 스크롤하고 그 인덱스를 반환합니다(첫 번째 이전은 마지막). |
| `currentHunk()` | `Promise<number \| null>`: 뷰가 그 위치에 머무는 동안에는 마지막으로 이동한 변경, 그렇지 않으면 뷰 맨 위의 변경 또는 화면에 보이는 첫 변경. |
| `selectedLines()` | `Promise<DiffLineRange \| null>`: 줄 번호에서 선택된 줄. |
| `setSelectedLines(range)` | 한쪽의 줄을 선택합니다(`null`: 선택 없음). `onLineSelectionChange`는 발생하지 않습니다. |
| `selectedText()` | `Promise<string>`: 선택된 줄의 텍스트. |
| `files()` | `Promise<DiffFile[]>`: 패치의 파일 목록(순서대로)과 각 개수(두 텍스트이면 없음). |
| `scrollToFile(path)` | `path` 위치에 있는 파일의 헤더를 맨 위로 스크롤합니다. |
| `collapseFile(path)` | `path` 위치에 있는 파일의 헤더만 표시합니다. |
| `expandFile(path)` | `path` 위치에 있는 파일의 줄을 다시 표시합니다. |
| `toggleFile(path)` | `path` 위치의 파일을 접고, 이미 접혀 있으면 펼칩니다. |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>`: 각 변경이 행에서 차지하는 위치(순서대로)([개요 눈금자](#an-overview-ruler)). |
| `scrollOffset()` | `Promise<Point>`: 행이 스크롤된 정도(`x`는 0). |
| `setScrollOffset(offset)` | 행을 `offset.y`로, 갈 수 있는 곳까지 즉시 스크롤합니다. 드래그하는 포인터를 썸(thumb)이 따라가는 방식입니다. |

`nextHunk()`와 `previousHunk()`는 뷰가 그 자리에 머무는 동안에는 이동했던 변경에서 이어서 진행하고, 그렇지 않으면 뷰의 맨 위에서 이어서 진행하므로, 맨 위로 스크롤할 수 없는 끝부분 근처의 변경도 계산에 포함됩니다. `onStatsChange`의 개수를 사용하는 다음/이전 변경 버튼은 다음과 같습니다.

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

## 개요 눈금자

`onScroll({ offset, contentSize, size })`는 [`Scroll`](./scroll.md)와 같은 키로 행의 위치를 보고합니다. `offset.y`는 스크롤된 정도입니다(행은 뷰의 너비만큼 세로로 스크롤되고, 양쪽은 각자 가로로 스크롤됩니다. `offset.x`는 0). `contentSize`는 모든 행을 합친 크기이고, `size`는 뷰포트의 크기입니다. 이 이벤트는 뷰가 레이아웃된 직후 한 번 발생하고, 이후 값 중 하나가 바뀔 때마다 다시 발생합니다. 즉 행이 스크롤될 때, 뷰의 크기가 바뀔 때, 행의 높이가 바뀔 때(다른 텍스트, `layout`, `softWrap`, 파일이나 구분선이 펼쳐지거나 접힐 때, 주석이 레이아웃될 때)입니다. `hunkBounds()`는 각 변경이 행에서 차지하는 위치를 제공합니다(`DiffHunkBounds`: `{ index, bounds }`, 첫 행 상단부터 마지막 행 하단까지의 `bounds`이며, 그 아래의 주석과 뷰 전체 너비를 포함). 표시되는 변경만 포함되며, 접힌 파일의 변경에는 행이 없습니다. `onHunkBoundsChange({ hunkBounds })`는 뷰가 레이아웃된 직후 같은 목록을 제공하고, 행의 높이가 그대로여도(변경된 한 줄이 다른 줄로 바뀌는 경우) 변경이 이동하거나 크기가 바뀔 때마다 다시 제공합니다. 눈금자는 `onScroll`에서 값을 읽는 대신 이 목록으로 표시를 그립니다. `scrollOffset()`는 행이 스크롤된 정도를 읽고, `setScrollOffset({ x, y })`는 행을 `y`로 즉시 스크롤하므로, 드래그하는 썸이 같은 프레임에서 포인터를 따라갑니다.

이들을 함께 사용하면 코드 편집기처럼 뷰 옆에 개요 눈금자를 만들 수 있습니다. 각 변경에 대한 표시, 화면에 보이는 행 위의 썸, 그리고 해당 위치로 스크롤하는 누르기 또는 드래그로 구성됩니다. 다음은 뷰와 같은 높이의 눈금자입니다.

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

표시의 `index`는 `hunks()`에 있는 변경의 것이며, `oldLines`와 `newLines`로 추가된 변경(이전 줄 없음)과 삭제된 변경(새 줄 없음)을 구분하여 표시 색을 정합니다.

<a id="review-comments"></a>

## 리뷰 코멘트

줄 번호로 한쪽의 줄을 선택합니다. 누르면 한 줄이 선택되고, Shift를 누른 채 누르면 선택 범위가 그 줄까지 확장되며, 번호 위로 마우스를 드래그하면 지나간 줄이 선택됩니다. `onLineSelectionChange`는 선택된 줄을 `range`로 보고하며(`DiffLineRange`: `{ side, start, end }`, 줄은 0부터 시작, 선택이 없으면 `null`), 번호를 누르면 `onLineNumberPress({ line })`(`{ side, line }`)도 보고합니다. ref는 선택을 읽고(`selectedLines()`, `selectedText()`) 설정할 수 있습니다.

`annotations`는 앱의 콘텐츠를 줄 아래에 배치합니다. 각 `{ id, side, line }`는 해당 줄이 속한 쪽의 전체 너비(통합 보기에서는 뷰 전체)에 걸쳐 `renderAnnotation`가 그리며, 레이아웃된 만큼의 높이를 차지하고, 해당 줄이 표시되는 동안 표시됩니다. `renderAddAnnotation`는 코멘트를 추가하는 앱의 컨트롤로, 포인터가 위에 있는 줄과 마지막으로 선택된 줄의 거터 오른쪽에 나타납니다. 그 줄이 선택된 줄 중 하나이면 선택된 줄들을, 아니면 그 줄을 전달받습니다.

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

## 파트 스타일링

뷰의 박스는 `class` 및 `style` 로 스타일링합니다. `classes` 는 파트별 Tailwind 클래스를, `styles` 는 파트별 인라인 스타일을 받습니다.
파트의 클래스는 해당 파트의 기본 스타일 뒤에 적용되므로 기본 스타일보다 우선하고, 파트의 `styles` 는 클래스보다 우선합니다. 글꼴은
`fontFamily`, `fontSize`, `lineHeight` 로 설정합니다.

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

| 파트 | 설명 | 기본값 |
|---|---|---|
| `side` | 각 측면(split) 또는 단일 열(unified) | 양쪽 측면 사이의 `border` 선 |
| `gutter` | 한 측면의 줄 번호와 표시기 | |
| `lineNumber` | 모든 줄 번호 | 오른쪽 정렬, `muted-foreground` |
| `lineNumberAdded` | 추가된 줄의 번호, `lineNumber` 뒤에 적용 | |
| `lineNumberDeleted` | 삭제된 줄의 번호, `lineNumber` 뒤에 적용 | |
| `content` | 거터 옆에 있는 한 측면의 텍스트 | 텍스트 앞뒤로 8pt |
| `line` | 한 측면의 모든 행 | |
| `lineAdded` | 추가된 줄의 행, `line` 뒤에 적용 | 녹색 틴트 |
| `lineDeleted` | 삭제된 줄의 행, `line` 뒤에 적용 | 빨간색 틴트 |
| `filler` | 반대편에 없는 줄 옆에 있는 split 행의 빈 절반 | 옅은 `muted` 채우기 |
| `wordAdded` | 추가된 줄 안에서 변경된 단어 | 더 진한 녹색 |
| `wordDeleted` | 삭제된 줄 안에서 변경된 단어 | 더 진한 빨간색 |
| `indicatorAdded` | 추가된 줄의 막대(`"bars"`) 또는 `+`(`"classic"`) | 녹색, 너비 3pt |
| `indicatorDeleted` | 삭제된 줄의 막대 또는 `−` | 빨간색, 너비 3pt |
| `separator` | 접힌 줄의 구분선 또는 패치의 hunk 헤더 | `⋯` 와 `muted` 의 개수 |
| `hunkActions` | 변경 사항에 대한 앱 동작의 박스 | 변경 사항의 오른쪽 위 |
| `lineSelected` | 해당 측면에서 선택된 줄의 행 위 | 테마의 선택 색상(`Editor` 의 선택 영역과 동일) |
| `annotation` | 줄 아래에 표시되는 주석의 박스 | 해당 줄이 속한 측면 전체 너비 |
| `addAnnotation` | 추가 컨트롤의 박스, 거터 너비에 한 줄 높이 | 오른쪽에 있는 컨트롤 |
| `fileHeader` | 패치에 포함된 파일의 헤더 | `secondary` 의 경로와 개수, 아래에 `border` 선 |

## Props

| Prop | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | 이전 텍스트입니다. |
| `newValue` | `.new_value(..)` | `string` | | 새 텍스트입니다. |
| `patch` | `.patch(..)` | `string` | | 하나 또는 여러 파일의 unified diff이며, `oldValue` 와 `newValue` 가 설정되지 않았을 때 표시됩니다. |
| `language` | `.language(..)` | `string` | 일반 텍스트(패치: 각 파일의 언어) | 언어의 이름, 별칭, 확장자 또는 파일 이름입니다. |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | 좌우 나란히 표시할지, 한 열로 표시할지를 정합니다. |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | 변경된 줄 안에서 강조 표시할 대상입니다. |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | 변경된 줄을 줄 번호 옆에 표시하는 방식입니다. |
| `contextLines` | `.context_lines(..)` | `number` | `3` | 각 변경 사항 주변에 표시되는 변경되지 않은 줄입니다. |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | 변경되지 않은 모든 줄을 표시합니다. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | 줄 번호입니다. |
| `background` | `.background(..)` | `boolean` | `true` | 변경된 줄에 틴트를 적용합니다. |
| `fontFamily` | `.font_family(..)` | `string` | 테마의 `font-mono` | 텍스트의 글꼴입니다. |
| `fontSize` | `.font_size(..)` | `number` | `13` | 글꼴 크기(포인트 단위)입니다. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | 행의 높이(포인트 단위)입니다. |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | 접힌 줄의 구분선을 그립니다. |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | 각 변경 사항에 대한 앱의 동작입니다. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | 긴 줄을 측면의 너비에서 줄바꿈합니다. |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | 줄 아래에 표시되는 앱의 콘텐츠입니다: `{ id, side, line }`. |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | 줄 아래에 주석을 그립니다. |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | 주석을 추가하기 위한 앱의 컨트롤이며, 호버된 줄과 마지막으로 선택된 줄 옆에 표시됩니다. |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | 패치에 포함된 각 파일의 헤더를 한 행 높이로 그립니다. |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | 파트별 Tailwind 클래스입니다. |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | 클래스보다 우선하는 파트별 인라인 스타일입니다. |
| `class`, `style` | 스타일 메서드 | `string`, `StyleProp<ViewStyle>` | | 뷰의 박스입니다. |

<a id="events"></a>

## 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | 변경 사항이 유지되거나 되돌려졌습니다: `{ change }`, 현재 텍스트(`{ oldValue, newValue }`). |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | 줄 번호가 눌렸습니다: `{ line }`, `{ side, line }`. |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | 선택된 줄이 변경되었습니다: `{ range }`, `{ side, start, end }` 또는 `null`. |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | 개수가 변경되었습니다: `{ stats }`, `{ added, deleted, hunks }`. 뷰가 만들어질 때 한 번 발생하고, 텍스트가 다른 개수로 diff될 때마다 다시 발생하며, "+8 −8 · 5 changes" 같은 줄을 표시하는 데 사용할 수 있습니다. |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | 패치의 파일이 접히거나 펼쳐졌습니다(헤더 또는 ref를 통해): `{ file }`, 현재의 `DiffFile`. |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | 행이 스크롤되었거나, 행 또는 뷰포트의 크기가 변경되었습니다: `{ offset, contentSize, size }`, `Scroll` 의 값과 같음(Rust에서는 `DiffViewEvent::Scroll(offset, content_size, size)`). 뷰의 레이아웃이 완료되면 한 번 발생하고, 이 중 하나가 변경될 때마다 다시 발생합니다. |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | 행에서 변경 사항의 위치가 바뀌었습니다: `{ hunkBounds }`, `hunkBounds()` 가 제공하는 목록. 뷰의 레이아웃이 완료되면 한 번 발생하고, 행 높이의 유지 여부와 관계없이 변경 사항이 이동하거나 크기가 바뀔 때마다 다시 발생하며, 오버뷰 룰러의 표시에 사용할 수 있습니다. |

<a id="related"></a>

## 관련 항목

- [Editor](./editor.md): `DiffView` 가 사용하는 구문 색상과 언어를 제공하는 코드 에디터입니다.
- [TextView](./text-view.md): 리뷰 주변의 텍스트를 위한 Markdown 및 HTML 문서입니다.
- [`nsh/base`](../modules/nsh-base.md): 그 밖의 기본 컴포넌트입니다.
