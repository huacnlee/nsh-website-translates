---
title: "코딩 가이드"
description: "Rust와 TSX로 유지보수하기 쉬운 Native Shell 앱과 컴포넌트 라이브러리를 만들기 위한 아키텍처 및 코딩 규칙입니다."
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---

# 코딩 가이드

이 가이드는 Native Shell 앱에서 오래 유지되어 온 애플리케이션 아키텍처와 코드 패턴을 설명합니다. 엔지니어와 코딩 에이전트를 모두 대상으로 하며, NSH 앱 개발자(TSX 모듈, Rust 컴포넌트, NSH를 내장하는 네이티브 앱)와 `nsh/base` 기반 컴포넌트 라이브러리 작성자를 위한 문서입니다. 먼저 디자인 가이드를 읽으세요. 코드 구조는 제품의 의도를 대체하는 것이 아니라 보존해야 합니다.

이 문서는 규범적인 가이드입니다. **must**는 라이프사이클, 정확성 또는 에코시스템 제약을 나타내며, **should**는 기본 아키텍처를 뜻하므로 이를 벗어나려면 구체적인 이유가 필요합니다. 정확한 시그니처는 현재 소스, 레퍼런스 페이지, 그리고 `.nsh/types`의 선언이 여전히 기준이 됩니다.

<a id="make-the-common-path-inexpensive"></a>

## 일반적인 경로의 비용을 낮추기

**설계 원칙: 일반적인 컴포넌트 사용이 기본적으로 저렴하도록 프레임워크 타입과 소유권을 선택합니다.** 개발자는 모든 호출 지점에 캐시를 추가하지 않고도 UI를 만들고 재사용할 수 있어야 합니다. 한 번만 실행되는 컴포넌트와, 사용되는 위치에서 읽는 [시그널](./reactivity.md)이 그 예입니다. 컴포넌트는 자신이 담당하는 트리 부분을 한 번만 만들고, 이후에는 변경된 시그널을 읽는 바인딩만 다시 실행되므로 일반적인 경로에서는 반복 작업이 발생하지 않습니다. 반응형 그래프, 렌더러, 레이아웃, 리스트는 네이티브이며, 앱 코드의 한 턴은 네이티브 연산의 한 배치가 됩니다. 그래도 작은 비용은 요소와 업데이트마다 누적되며, 특히 자체 코드가 인터프리터에서 실행되는 TSX에서 두드러집니다. 캐시를 추가하기 전에 예외적인 핫 패스를 측정하세요([성능](./performance.md)). 어느 쪽 선택도 비용이 전혀 없다고 보장하지는 않습니다. [상태 소유권 규칙](#state-ownership)과 이후의 렌더링 섹션에서 동작 원리를 설명합니다.

<a id="architecture-at-a-glance"></a>

## 아키텍처 한눈에 보기

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

의존성은 아래 방향으로 향합니다. 상위 레이어는 도메인 의미와 오케스트레이션을 담당하고, 하위 레이어는 재사용 가능한 프레젠테이션이나 동작을 담당합니다. 재사용 가능한 컴포넌트가 앱 페이지에 의존하게 하거나, 컴포넌트 라이브러리가 특정 앱의 테마에 의존하게 만들지 마세요([세 개의 레이어](./architecture.md#three-layers)).

다음 경계를 사용하세요.

- **앱 셸:** 진입점(`App.tsx` 또는 `nsh.json` `"root"`)이 루트와 내비게이션 스택을 구성하되 페이지 로직은 포함하지 않습니다.
- **페이지:** 콘텐츠, 다이얼로그, 그리고 페이지가 시작하는 작업을 가진 하나의 `NavPage`입니다.
- **앱 컴포넌트:** 도메인을 인식하며 반복되는 패턴입니다.
- **컴포넌트 라이브러리:** 앱 자체 또는 커뮤니티가 만든, 스타일이 적용된 범용 UI로 `nsh/base` 위에 구축됩니다.
- **`nsh/base`:** 제품 프레젠테이션이 없는 재사용 가능한 동작입니다. 내비게이션, 다이얼로그, 팝오버, 메뉴, 시트, 프레스 타깃이 이에 해당합니다.
- **`nsh`:** 프리미티브, 스타일, 레이아웃, 반응성, 그리고 환경입니다.

<a id="lay-out-an-apps-files"></a>

### 앱의 파일 구성하기

앱의 파일은 NSH의 규칙을 따르므로 별도로 설정할 것이 없습니다. `App.tsx`이 진입점이고 `nsh.json`이 그 옆에 위치하며, 둘 다 규칙에 따라 자동으로 인식됩니다.

```text
App.tsx            # the entry, by convention: mount(App)
nsh.json
Cargo.toml         # the app's crate, with Rust components ("rust": ".")
src/
  lib.rs
pages/
  Inbox.tsx
  Compose.tsx
  Settings.tsx
components/
  Card.tsx
store.ts
```

- `pages/`에는 `NavPage`마다 파일 하나가 있습니다. 페이지는 필요할 때만 더 많은 파일로 늘어납니다.
- `components/`에는 앱의 재사용 가능한 컴포넌트, 즉 여러 페이지가 사용하는 컴포넌트가 있습니다.
- `store.ts`에는 앱의 상태, 즉 시그널과 이를 변경하는 함수가 있습니다. 페이지는 시그널을 읽고 함수를 호출합니다.
- 테스트는 테스트 대상 옆에 있는 `*.test.tsx` 파일입니다(`App.test.tsx`, `pages/Inbox.test.tsx`).
- `Cargo.toml`과 `src/lib.rs`은 Rust 컴포넌트(`nsh.json` `"rust": "."`)를 가진 앱 자체의 crate입니다. `src/lib.rs`의 `#[native_module]`은 TSX가 임포트하는 이름을 지정합니다. Rust로만 작성된 앱도 같은 Cargo 프로젝트이며, 루트 컴포넌트는 `src/lib.rs`에 있습니다([프로젝트 구조](./project-structure.md)).

앱 셸은 페이지를 구성하지만 페이지 로직은 거의 포함하지 않습니다. 페이지는 스토어의 시그널을 읽고 스토어의 함수를 호출하며, 다른 페이지의 상태를 직접 쓰지 않습니다. 스토어의 시그널은 비공개로 유지하고 이를 읽고 변경하는 함수만 내보내세요. 그러면 변경 가능한 상태가 공개 함수 뒤에 머뭅니다.

```rust tabs
/// The app's workspace: its state stays behind these functions.
#[derive(Clone, Copy)]
pub struct Workspace {
    name: Signal<SharedString>,
}

impl Workspace {
    /// A workspace named "Untitled".
    pub fn new() -> Self {
        Self { name: signal(SharedString::from("Untitled")) }
    }

    /// Its name (tracked where it is read).
    pub fn name(&self) -> SharedString {
        self.name.get()
    }

    /// Renames it.
    pub fn rename(&self, name: impl Into<SharedString>) {
        self.name.set(name.into());
    }
}
```

```tsx tabs
// store.ts
import { signal } from "nsh";

const name = signal("Untitled");

/** The workspace's name (tracked where it is read). */
export const workspaceName = () => name();

/** Renames the workspace. */
export function renameWorkspace(next: string) {
  name.set(next);
}
```

페이지가 워크스페이스를 보유하고 그 id를 검색에 전달할 수 있습니다. 검색은 워크스페이스의 전체 컬렉션이나 비공개 시그널을 알 필요가 없습니다. 단순한 비순환 의존성 구조는 다음과 같습니다.

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

페이지는 스토어와 컴포넌트에 의존할 수 있지만, 셸이나 다른 페이지의 비공개 부분에는 의존할 수 없습니다. 한 페이지가 다른 페이지에 표시되는 내용을 바꿔야 한다면 스토어를 통해 처리하세요. 이러한 경계 덕분에 여러 엔지니어나 AI 에이전트가 서로 다른 페이지에서 병렬로 작업할 때 파일 충돌과 공유 상태 결합이 줄어듭니다. 다만 스토어는 여전히 조율이 필요합니다.

<a id="bootstrap-and-root-ownership"></a>

## 부트스트랩과 루트 소유권

앱은 한 번만 마운트하고, 루트에 전체 서피스를 줍니다. TSX 진입점은 `mount(App)`를 호출하고, Rust 앱은 `nsh.json`(`"root": "App"`)에서 루트 컴포넌트를 지정합니다. 루트는 `flex: 1`과 테마의 배경으로 서피스를 채웁니다.

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    provide_context(Workspace::new());
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(inbox())
}
```

```tsx tabs
import { mount, View } from "nsh";

mount(() => (
  <View class="flex-1 bg-background">
    <App />
  </View>
));
```

루트는 서피스 전체에 속하는 요소들을 조율합니다. 내비게이션 스택, 그 안의 모든 것 위에 표시되는 다이얼로그, 팝오버, 메뉴, 시트, 툴팁, 그리고 세이프 에어리어가 이에 해당합니다. 하나의 서피스 안에서 페이지마다 두 번째 루트를 마운트하지 마세요. 하나의 서피스는 하나의 엔진입니다. 네이티브 앱이 내장하는 각 `NshAppView`, `NshView`, `AppView`은 자체 VM, 자체 모듈 상태, 자체 반응형 그래프를 실행하므로, 한 호스트 앱 안의 여러 서피스가 실수로 상태를 공유하는 일은 없습니다.

<a id="understand-what-runs-once-and-what-runs-again"></a>

## 한 번 실행되는 것과 다시 실행되는 것 이해하기

NSH는 Solid의 모델을 따라 선언적으로 구성되는 유지형 상태입니다([반응성](./reactivity.md)). 시그널은 업데이트를 거쳐도 유지되고, 컴포넌트 본문은 생성될 때 자신이 담당하는 트리 부분을 한 번만 기술합니다. 이 구분을 명확히 유지하세요.

| 작성하는 것 | 실행 시점 | 다시 실행되는 경우 |
| --- | --- | --- |
| 컴포넌트 본문 | 생성될 때 한 번 | 없음 |
| 바인딩: 값이 들어갈 자리에 쓰는 클로저(Rust) 또는 호출이나 프로퍼티 읽기를 포함한 표현식(TSX) | 한 번 | 읽은 시그널이 변경될 때, 해당 prop 또는 자식만 업데이트됨 |
| `computed(fn)` | 생성될 때 | 읽은 시그널이 변경될 때 |
| `effect(fn)` | 해당 패스의 요소가 존재한 뒤 | 읽은 시그널이 변경될 때 |
| `each` / `<Each>`의 행 | 키가 처음 나타날 때 | 없음. 해당 행의 item과 index 시그널이 변경됨 |
| `virtual_list` / `<List>`의 셀 | 셀마다 한 번 | 없음. 셀에 다른 행이 주어짐 |

- 실행되는 컴포넌트가 **owner**입니다. 컴포넌트가 실행되는 동안 생성된 이펙트, 계산된 값, 태스크, 타이머, 키 바인딩, 클린업은 그 컴포넌트에 속하며 컴포넌트와 함께 폐기됩니다.
- **컨텍스트**(`provide_context` / `use_context`, `context()`, `<Ctx.Provider>`)는 이를 읽는 요소가 값을 소유한다는 의미 없이 서브트리에 값을 제공합니다.
- Rust 컴포넌트의 **`Scope`**(`cx`)는 이벤트를 방출하고 자신에게 주어진 인셋을 읽습니다.
- **ref**(`element_ref()`, `ref`)는 명령형 호출(`focus()`, `scroll_to()`, `measure()`)을 위해 호스트 요소를 가리킵니다.
- 레이아웃과 측정은 이후에 수행되는 네이티브 단계입니다. 확정된 지오메트리가 정말 필요할 때만 `onLayout`과 `measure()`를 사용하세요.

이벤트 핸들러나 타이머처럼 컨텍스트를 조회할 컴포넌트가 없는 곳에서는 컨텍스트를 읽지 마세요. 본문에서 읽고 얻은 값을 보관하세요. 타입이 있는 핸들(시그널, 리소스, ref, 도메인 id)을 보관하세요. 이들은 Rust에서 `Copy`이며, owner가 사라지면 더 이상 아무 동작도 하지 않습니다.

<a id="choose-the-right-unit"></a>

## 적절한 단위 선택하기

<a id="use-a-plain-function-for-value-like-elements"></a>

### 값과 같은 요소에는 일반 함수 사용하기

**가볍고 재사용 가능한 UI 조각에는 기본적으로 일반 함수를 사용하세요.** 호출자가 현재 props와 핸들러를 제공하고, 함수는 요소를 반환하며, 함수가 만든 바인딩 외에는 아무것도 남지 않습니다. 인자가 곧 props이고, 표시되는 레이블, 값, 콜백은 호출자의 현재 상태에서 옵니다. 다른 컴포넌트와 마찬가지로 한 번만 실행되며, 이후에 변하는 것은 바인딩입니다.

```rust tabs
fn empty_state(title: impl Into<SharedString>) -> impl IntoElement {
    view()
        .gap_2()
        .items_center()
        .child(text(title.into()).text_color(move || theme().muted_foreground))
}
```

```tsx tabs
function EmptyState(props: { title: string }) {
  return (
    <View class="items-center gap-2">
      <Text class="text-muted-foreground">{props.title}</Text>
    </View>
  );
}
```

<a id="use-a-component-for-retained-behavior"></a>

### 유지되는 동작에는 컴포넌트 사용하기

UI 조각이 지속되는 상태나 독립적인 라이프사이클(시그널, 이펙트, 비동기 작업, 타이머, 키 바인딩)을 소유할 때는 `#[component]`(또는 시그널을 생성하는 TSX 컴포넌트)를 사용하세요. 이러한 상태는 바인딩 안이 아니라 컴포넌트 본문에서 한 번만 생성하세요.

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// Shown while the field is empty.
    pub placeholder: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let query = signal(String::new());
    input()
        .value(move || query.get())
        .on_change(move |text: &str| query.set(text.to_owned()))
        .placeholder(move || props.placeholder.get().to_string())
}
```

```tsx tabs
function Search(props: { placeholder: string }) {
  const query = signal("");
  return <Input value={query()} onChange={({ value }) => query.set(value)} placeholder={props.placeholder} />;
}
```

`#[component]`는 타입이 있는 props(`#[derive(Props)]`)와 이벤트(`#[derive(Event)]`)를 가지며, TSX는 이로부터 생성된 선언으로 이를 임포트합니다. TSX가 `new`와 함께 사용하는 유지형 상태(원장, 파서, 세션)는 `#[class]`이고, 함수는 `#[module]`입니다([Building with Rust](./rust.md#extending-a-rust-app-with-tsx)). 앱에서 가장 많이 쓰는 부분, 컴포넌트 라이브러리, 부하가 큰 로직은 처음부터 끝까지 네이티브 코드인 Rust로 작성하고, TSX는 자주 바뀌거나 런타임에 전달되는 부분에 사용하세요.

모든 시각적 조각을 컴포넌트로 만들지 마세요. 컴포넌트 경계에는 라이프사이클과 조율 비용이 따르므로, 유지되는 정체성이 중요한 곳에서만 사용하세요.

<a id="elements-views-and-behavior-systems-are-different"></a>

### 요소, 뷰, 동작 시스템은 서로 다릅니다

모든 컴포넌트를 하나의 템플릿에 억지로 맞추지 마세요. 에코시스템에는 다음이 존재합니다.

- `Button`, `Switch`, `MenuItem` 같은 시맨틱 요소
- `Dialog`, `Popover`, `Menu`, `ContextMenu`, `Sheet`, `NavStack` 같은 복합 동작 루트
- `Input`, `List`, `TextView` 및 내비게이션 스택의 상태 같은 상태 기반 시스템
- 오버레이와 그 배치, 가상화, 스크롤, 세이프 에어리어, 키보드, 애니메이션 같은 인프라

요소는 내부적으로 복잡하더라도 호출자에게는 값처럼 보일 수 있습니다. 상태 기반 시스템은 렌더 함수를 노출하여, 앱이 동작을 다시 구현하지 않고도 프레젠테이션을 소유하게 할 수 있습니다. 공개 접점은 출력에 몇 개의 뷰가 나타나는지가 아니라 동작을 기준으로 선택하세요.

<a id="state-ownership"></a>

## 상태 소유권

<a id="own-persistent-ui-text-with-103"></a>

### 지속되는 UI 텍스트는 `SharedString`로 소유하기

**Rust에서는 업데이트나 콜백 클로저를 거쳐 유지되는 UI 텍스트에 `SharedString`를 사용해야 합니다(must).** 여기에는 컴포넌트 레이블, 제목, 플레이스홀더가 포함됩니다. props가 이를 받으며(`Prop<SharedString>`), 바인딩에 복제해도 텍스트는 복사되지 않습니다. 변경 가능한 편집 버퍼나 서식을 적용하며 조립 중인 텍스트에는 `String`를 사용하고 결과가 준비되면 변환하세요. 한 번의 호출 동안 임시로 읽기 전용 접근이 필요하다면 `&str`를 사용하세요. TSX에서 문자열은 앱 자체의 값입니다. 상태로부터 계산되는 텍스트는 여러 곳에서 다시 만들지 말고 `computed` 또는 클로저에 보관하세요.

UI가 유지할 변경 불가능한 응답 텍스트는 받은 값을 그대로 보존하고, 파생되거나 서식이 적용된 프레젠테이션 텍스트는 응답을 고쳐 쓰는 대신 별도의 도메인 값에 두세요.

각 상태는 그것을 올바르게 유지할 수 있는 가장 좁은 owner에 두세요.

- 도메인 상태는 스토어(`store.ts`) 또는 앱의 crate에 속합니다.
- 일시적인 뷰 상태는 이를 렌더링하는 컴포넌트에 시그널로 속합니다.
- 재사용 가능한 동작 상태는 이를 위해 설계된 컴포넌트에 속합니다(`open` 없는 `Menu` 또는 `Popover`는 자체 상태를 가집니다).
- 서브트리가 공유하는 상태는 [컨텍스트](./reactivity.md#context)를 통해 제공되는 시그널입니다.
- 실행 이후에도 남아야 하는 것은 [스토리지](../modules/nsh.md#storage) 또는 서버에 속합니다.

일반적인 선택과 토글에는 제어형 값을 선호하세요. 현재 값을 컴포넌트에 전달하고, 요청된 변경을 받아 owner를 업데이트하면 바인딩이 따라옵니다. 콜백은 의도를 보고할 뿐이며, 숨겨진 두 번째 단일 진실 공급원을 만들어서는 안 됩니다.

```rust tabs
switch()
    .checked(show_hidden)
    .on_change(move |next: &bool| show_hidden.set(*next))
    .child(text("Show hidden files"))
```

```tsx tabs
<Switch checked={showHidden()} onChange={({ checked }) => showHidden.set(checked)}>
  <Text>Show hidden files</Text>
</Switch>
```

알릴 것은 없습니다. 시그널에 쓰면 그 시그널을 읽는 바인딩만 정확히 업데이트됩니다. Rust 컴포넌트는 owner가 `cx.emit(..)`로 처리해야 하는 시맨틱 이벤트를 방출하며, 이펙트는 owner가 존재하는 동안 시그널을 따라갑니다. 하나의 불변 조건을 이루는 여러 필드는 하나의 [`batch`](./reactivity.md#batch)에서 쓰세요. 그러면 이펙트와 계산된 값이 이들을 한꺼번에 봅니다.

앱 자체의 제어형 컴포넌트도 같은 계약을 따릅니다. 수량 스테퍼는 Rust로 한 번 작성하여 Rust와 TSX에서 배치하는 도메인 컨트롤입니다.

```rust tabs
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The props of [`QuantityStepper`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct QuantityStepperProps {
    /// The quantity: the app owns the value.
    #[prop(default)]
    pub value: Prop<u32>,
    /// The smallest quantity (0 when left out).
    #[prop(default)]
    pub min: Prop<u32>,
    /// The largest quantity (99 when left out).
    #[prop(default = 99)]
    pub max: Prop<u32>,
    /// What screen readers say for the button that takes one away.
    pub decrement_label: Prop<SharedString>,
    /// What screen readers say for the button that adds one.
    pub increment_label: Prop<SharedString>,
}

/// What a [`QuantityStepper`] reports.
#[derive(Debug, Clone, PartialEq, Event)]
pub enum QuantityStepperEvent {
    /// The user asked for another quantity; the owner sets `value`.
    Change(u32),
}

/// A quantity with a button to take one away and one to add one.
#[component]
pub fn QuantityStepper(props: QuantityStepperProps, cx: Scope<QuantityStepperEvent>) -> impl IntoElement {
    // Read untracked: the user's act, measured against the owner's current value.
    let step = move |delta: i64| {
        let value = props.value.get_untracked();
        let (min, max) = (props.min.get_untracked(), props.max.get_untracked());
        let next = (i64::from(value) + delta).clamp(i64::from(min), i64::from(max)) as u32;
        if next != value {
            cx.emit(QuantityStepperEvent::Change(next));
        }
    };
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .child(step_button(
            "−",
            move || props.decrement_label.get(),
            move || props.value.get() <= props.min.get(),
            move || step(-1),
        ))
        .child(text(move || props.value.get().to_string()).text_color(move || theme().foreground))
        .child(step_button(
            "+",
            move || props.increment_label.get(),
            move || props.value.get() >= props.max.get(),
            move || step(1),
        ))
}

fn step_button(
    symbol: &'static str,
    label: impl Fn() -> SharedString + 'static,
    disabled: impl Fn() -> bool + 'static,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .disabled(disabled)
        .accessibility_label(move || Some(label()))
        .on_press(on_press)
        .w(px(32.0))
        .h(px(32.0))
        .items_center()
        .justify_center()
        .rounded(move || theme().radius)
        .bg(move || theme().muted)
        .active(|s| s.opacity(0.6))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(symbol).text_color(move || theme().foreground))
}

// The owner:
let quantity = signal(1_u32);
quantity_stepper()
    .value(quantity)
    .min(1)
    .max(10)
    .decrement_label("Fewer")
    .increment_label("More")
    .on_change(move |next: &u32| quantity.set(*next))
```

```tsx tabs
import { signal } from "nsh";
import { QuantityStepper } from "my-app";   // the Rust component: src/lib.rs has #[native_module("my-app")]

function CartRow() {
  const quantity = signal(1);
  return (
    <QuantityStepper
      value={quantity()}
      min={1}
      max={10}
      decrementLabel="Fewer"
      incrementLabel="More"
      onChange={({ value }) => quantity.set(value)}
    />
  );
}
```

TSX에서도 같은 계약이 적용됩니다. 다음은 `components/`에 있는 컴포넌트입니다.

```tsx
import { Text, View } from "nsh";
import { Button } from "nsh/base";

export interface QuantityStepperProps {
  /** The quantity: the app owns the value. */
  value: number;
  /** The smallest quantity (0 when left out). */
  min?: number;
  /** The largest quantity (99 when left out). */
  max?: number;
  /** What screen readers say for the button that takes one away. */
  decrementLabel: string;
  /** What screen readers say for the button that adds one. */
  incrementLabel: string;
  /** The user asked for another quantity; the owner sets `value`. */
  onChange?: (e: { value: number }) => void;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 99;
  const step = (delta: number) => {
    const next = Math.min(max(), Math.max(min(), props.value + delta));
    if (next !== props.value) props.onChange?.({ value: next });
  };
  const buttonClass = "size-8 items-center justify-center rounded-(--radius) bg-muted active:opacity-60 disabled:opacity-40";
  return (
    <View class="flex-row items-center gap-3">
      <Button disabled={props.value <= min()} accessibilityLabel={props.decrementLabel} onPress={() => step(-1)} class={buttonClass}>
        <Text class="text-foreground">−</Text>
      </Button>
      <Text class="text-foreground">{props.value}</Text>
      <Button disabled={props.value >= max()} accessibilityLabel={props.incrementLabel} onPress={() => step(1)} class={buttonClass}>
        <Text class="text-foreground">+</Text>
      </Button>
    </View>
  );
}
```
<a id="keep-ownership-links-and-subscriptions-bounded"></a>

### 소유 관계와 구독을 제한된 범위로 유지하기

컴포넌트는 자신이 만든 것을 소유하며, 만든 것은 모두 컴포넌트와 함께 사라집니다. `<If>` 분기가 숨겨지거나, 해당 행이 제거되거나, 페이지가 pop될 때 그렇습니다. Rust에서는 태스크, 타이머, 인터벌(`spawn`, `set_timeout`, `set_interval`)과 키 바인딩(`on_key`)이 만들어질 때의 소유자와 함께 끝납니다. TSX에서는 중단 함수를 [`cleanup`](./reactivity.md#cleanup)에 등록하거나 effect에서 반환하세요. 리스닝은 `on(event, listener)`(`host.on(name, listener)`, `BackHandler.on("press", listener)`)로 하며, 이는 리스닝을 중단하는 함수를 반환합니다(`() => void`, Rust에서는 `Stop`). 컴포넌트가 렌더링되는 동안 등록된 것은 `keymap.bind`의 바인딩처럼 컴포넌트와 함께 사라집니다.

무언가가 예상치 못하게 계속 실행된다면, 먼저 다음을 점검하세요. 컴포넌트 밖에서 생성된 effect와 computed 값(이벤트 핸들러나 타이머 콜백 안에서 만들면 소유자가 없어 영원히 유지됩니다), 중단 함수 없이 등록된 리스너, 그리고 어떤 컴포넌트도 소유하지 않는 store에서 시작된 작업입니다. 드롭된 `resource` 로드는 중단되며(TSX에서는 `info.signal`), 컴포넌트를 계속 살려 두지 않습니다. 이것들은 흔히 시작하는 지점일 뿐, 전부를 나열한 것은 아닙니다.

값을 읽거나 파생했다는 이유만으로 signal에 쓰지 마세요. 바인딩이나 effect가 자신이 읽는 같은 signal에 무조건 쓰는 일을 피하세요. 그러면 NSH가 오류로 중단시킬 때까지 스스로를 다시 실행합니다. 다른 상태로부터 계산되는 값은 두 번째 signal에 쓰는 effect가 아니라 `computed`입니다.

<a id="avoid-state-feedback-loops"></a>

### 상태 피드백 루프 피하기

텍스트 입력, 선택, 필터, 제어형 팝업에는 흔히 두 경로가 있습니다. 외부 소유자가 값을 갱신하고, 사용자 상호작용이 새 값을 요청합니다. 동기화 중에 소유자가 제공한 값을 사용자 콜백을 통해 다시 보내지 마세요. 사용자의 동작을 처리할 때 소유자의 현재 값을 untracked로 읽고(Rust에서는 위와 같이 `props.value.get_untracked()`, TSX 이벤트 핸들러는 이미 untracked입니다) 다음 값과 비교하여, 각 논리적 변경이 한 번만 보고되도록 하세요. 콜백이 자신을 호출한 컴포넌트를 동기적으로 닫거나 교체하거나 갱신할 수 있다면, 콜백을 재진입에 안전하게 만드세요.

<a id="stable-identity"></a>

## 안정적인 식별

키는 동작의 일부입니다. 키는 행, 페이지, 반복되는 컨트롤에 안정적인 식별을 부여하며, 데이터가 바뀔 때 어느 것이 상태, 포커스, 측정값을 유지할지 결정합니다.

- 행, 탭, 페이지, 반복되는 컨트롤에는 안정적인 도메인 id를 사용하세요: `each(projects, |p| p.id, ..)`,
  `<Each of={projects()} key={(p) => p.id}>`, 리스트의 `keyExtractor`.
- 같은 컨트롤이 반복될 때는 테스트 id에 소유 객체를 네임스페이스로 붙이세요(`delete-${project.id}`).
- 항목이 삽입되거나 재정렬될 수 있다면, 번역된 레이블이나 변경 가능한 리스트 인덱스로 식별을 만들지 마세요.
- 렌더링 중에 새로운 무작위 키나 id를 생성하지 마세요.

```rust tabs
each(projects, |p| p.id, move |project, _index| {
    let id = project.get_untracked().id;
    button()
        .on_press(move || delete(id))
        .child(text("Delete").test_id(&format!("delete-{id}")))
})
```

```tsx tabs
<Each of={projects()} key={(p) => p.id}>
  {(project) => (
    <Button onPress={() => remove(project().id)}>
      <Text testID={`delete-${project().id}`}>Delete</Text>
    </Button>
  )}
</Each>
```

키가 바뀌면 UI 식별이 바뀐 것입니다. 이 초기화는 의도한 것으로 다루세요.

같은 규칙이 내비게이션 라우트, 리스트 키, 저장소 키, 테스트 id에도 적용됩니다. `setRoutes`에 그대로 남아 있는 라우트는 페이지와 상태를 유지합니다. 독립적으로 유지되는 두 동작이 키를 공유하면 서로의 상태를 덮어쓸 수 있습니다. 한 동작이 갱신할 때마다 키를 바꾸면 상태가 절대 누적되지 않습니다.

<a id="rendering-and-composition"></a>

## 렌더링과 합성

컴포넌트 본문은 선언적으로 유지하세요. 현재 상태를 읽고, 표현 값을 파생하고, 엘리먼트를 합성합니다. 도메인 연산, 파싱, 사소하지 않은 변경은 store나 앱 crate의 이름 있는 함수로 옮기세요.

```rust tabs
#[component]
pub fn ProjectPage() -> impl IntoElement {
    view()
        .flex_1()
        .child(toolbar())
        .child(content())
}
```

```tsx tabs
function ProjectPage() {
  return (
    <View class="flex-1">
      <Toolbar />
      <Content />
    </View>
  );
}
```

헬퍼는 의미 있는 영역에 이름을 붙이고 독자가 한 번에 머릿속에 담아야 하는 상태의 양을 줄일 때 추출하세요. 새 컴포넌트는 그 영역이 자체적으로 재사용 가능한 계약이나 유지되는 라이프사이클을 가질 때 추출하세요. 빌더 체인이나 JSX 블록이 길다는 이유만으로 추출하지 마세요.

Rust에서는 타입이 지정된 스타일 메서드와 컴포넌트의 빌더를, TSX에서는 클래스를 일관되게 사용하세요. 작은 조건부 보정에는 `.when(..)` / `.when_some(..)`(Rust)와 `classList`(TSX)를 우선 사용하고, 분기가 상당히 다른 인터페이스를 나타낼 때는 `when` / `<If>`을 사용하세요. 클로저 안의 삼항 연산자는 읽는 값이 바뀔 때마다 해당 분기를 다시 빌드하기 때문입니다.

커스텀 표면을 만들기 전에 표준 시맨틱 컴포넌트로 합성하세요. 스크린샷 하나에 맞추려고 일반 view로 메뉴, 팝오버, 시트, 다이얼로그를 다시 만들지 마세요. `nsh/base`의 `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Tooltip`, `Dialog`은 배치, 포커스 이동, 키보드 내비게이션, 선택, 비활성 상태, Escape와 뒤로 가기에 의한 닫힘, 접근성 계약을 보존합니다. 표준 컴포넌트가 반복되는 유효한 패턴을 표현하지 못한다면, 호출 지점마다 임의의 하위 요소를 스타일링하는 대신 명시적 API를 개선하세요.

앱 코드가 제공하는 렌더 함수는 부수 효과가 없어야 합니다. 리스트의 행, `TextView`의 `renderCodeBlock`, 메뉴의 항목은 소유자가 셀, 파트, 열림을 필요로 할 때마다 실행될 수 있습니다. 이들은 비즈니스 연산을 수행하거나, 데이터를 추가하거나, 제한 없는 구독을 시작해서는 안 됩니다.

<a id="behavior-and-presentation-boundary"></a>

## 동작과 표현의 경계

변하지 않는 Base 규칙은 다음과 같습니다.

> Base는 재사용 가능한 동작과 그것을 구현하는 데 필요한 구조를 소유합니다. 프레젠테이션 레이어는 제품의 시각 언어를 소유합니다.

"Unstyled"는 "비어 있는 view 하나"를 뜻하지 않습니다. 오버레이 배치, 키보드 내비게이션, 편집, 가상화, 뒤로 가기 내비게이션, 닫힘, 안전 영역에는 내부 구조와 상태가 필요합니다. 이 작업을 모든 호출자에게 넘기는 것은 유연성을 만드는 것이 아니라 취약한 동작을 중복시키는 것입니다.

반대로 Base는 브랜드 색상, 타이포그래피, 밀도, 최종 아이콘, 컴포넌트 변형, 문자열, 앱 구성을 선택해서는 안 됩니다. 표현은 다음을 통해 노출하세요. 주요 파트에는 `class` / `style`, 그 밖의 모든 파트에는 `<part>Class` / `<part>Style`, 타입이 지정된 상태 스타일(`active`, `hover`, `focus`, `selected`, `checked`, `disabled`), 이름 있는 슬롯(`trigger`, `header`, `footer`), 렌더 함수입니다. 제목, 설명, 닫기 버튼을 찾으려고 임의의 하위 요소를 검사하지 마세요. 시맨틱 파트를 명시적으로 만들고, 모든 레이블은 prop이나 child로 받으세요.

<a id="theme-and-styling"></a>

## 테마와 스타일링

시맨틱 값은 테마에서 읽고, 레이아웃은 Rust에서는 타입이 지정된 스타일 메서드로, TSX에서는 Tailwind 클래스로 적용하세요([Tailwind](./tailwind.md), [테마 토큰](./tailwind.md#theme-tokens)).

```rust tabs
view()
    .bg(move || theme().background)
    .text_color(move || theme().foreground)
    .border_1()
    .border_color(move || theme().border)
    .rounded(move || theme().radius)
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-background text-foreground" />
```

규칙:

- 제품 색상, 모서리 반경, 간격, 컨트롤 지오메트리를 하드코딩하지 마세요.
- 앱 코드는 원시 hex, `rgb` / `rgba`, `hsla` 값을 도입해서는 안 됩니다. 시맨틱 색상은 `theme()` 또는 토큰 클래스(`bg-primary`)에서 읽거나, 빠진 역할을 앱의 테마 파일에 추가하세요.
- 앱 레이아웃은 임의의 값(`p-[13px]`, `px(13.0)`) 대신 간격 및 타입 스케일(`p-2`, `gap-3`, `w-64`, `text-sm`; `.p_2()`, `.gap_3()`, `.w_64()`, `.text_sm()`)을 사용해야 합니다.
- 클래스는 Tailwind CSS v4에서의 의미와 정확히 같고, 스타일 값은 [스타일 레퍼런스](../modules/style-reference.md)가 정한 의미(CSS의 값을 네이티브 형태로 옮긴 것이며, 숫자는 포인트입니다)와 같습니다. `unknown class` 경고는 고쳐야 할 발견 사항입니다.
- 팔레트상의 위치가 아니라 의미를 나타내는 시맨틱 토큰을 사용하세요.
- 상태와 무관한 지오메트리는 일반 빌더 체인이나 클래스 문자열에 두세요.
- 런타임 상호작용 상태에는 `active:`, `hover:`, `focus:`(`.active(..)`, `.hover(..)`, `.focus(..)`)를 사용하세요. 이는 앱 코드로의 왕복 없이 네이티브로 적용됩니다.
- 체크됨, 선택됨, 눌림, 비활성 모양에는 컴포넌트의 시맨틱 상태 스타일(`selected:`, `checked:`, `disabled:`)을 사용하세요.
- 팝업의 소유권은 명시적 상태(`open`와 `onOpenChange`)로 유지하여, 닫힐 때까지 트리거가 열림 또는 눌림 모양을 렌더링할 수 있게 하세요.
- 호출 지점마다 변형을 추가하지 말고, 컴포넌트 변형은 적고 의미 있게 유지하세요.
- 기본 스타일은 결정 영역의 실제 기본 확정과 그 return-key 동작에 바인딩하세요. 동작의 개수, 빈도, 툴바에서의 위치로 도출하지 마세요.
- badge와 alert 변형은 시맨틱하고 드물게 유지하세요. 일반적인 메타데이터는 중립으로 두고, 변형이 존재한다는 이유만으로 모든 enum 케이스나 섹션을 서로 다른 색에 매핑하지 마세요.

유효한 우선순위는 엘리먼트 자신의 스타일, 그다음 상태 스타일(나중 상태가 우선)이며, `disabled`이 모든 것보다 우선합니다. 나중 레이어는 자신이 설정한 필드만 대체합니다.

앱이 소유하는 새로운 표현에는 테마의 시맨틱 토큰을 우선 사용하세요. 앱의 테마 파일에 있는 모든 이름은 토큰이며, Tailwind의 `@theme` 변수와 같습니다(`"up": "#16a34a"`는 TSX에서 `text-up`, `bg-up/30`, `token("up")`을, Rust에서는 `theme().color("up")`을 제공합니다). 테마에는 라이트와 다크 값이 있으므로 토큰은 `dark:` 클래스 없이도 외관을 따라갑니다. 토큰은 컴포넌트가 아니라 역할을 기준으로 이름 지어, 모든 위젯의 확장 지점이 되지 않도록 하세요.

테마는 앱의 테마 파일(`nsh.json` `"theme"`)을 통해 변경하거나, 임베딩하는 앱이 자체 테마를 제공하게 하세요. 토큰을 지정한 클래스와 `theme()`을 읽는 Rust 바인딩은 테마가 바뀔 때마다 JavaScript 실행 없이 네이티브로 다시 스타일링됩니다. 토큰의 값을 자신만의 signal에 복사하는 코드는 더 이상 토큰을 따라가지 않습니다.

바깥쪽 포커스 링에는 물리적인 여유 공간이 필요합니다. `overflow: hidden`(`overflow-hidden`)이 있는 상위 요소는 포커스 링을 잘라냅니다. 여유를 남기는 레이아웃을 우선하세요. 제품이 강하게 잘라내야 한다면, 모든 키보드 포커스를 조용히 숨기는 대신 포커스된 상태를 컨트롤 안쪽에 그리세요.

<a id="the-users-text-size-is-the-apps-zoom"></a>

### 사용자의 텍스트 크기가 곧 앱의 줌입니다

텍스트는 사용자의 텍스트 크기(Dynamic Type, Android의 글꼴 배율, 데스크톱 설정)를 따릅니다. TSX에서는 `fontScale()`, Rust에서는 `font_scale()`이며, 둘 다 반응형입니다. 타입 스케일(`text-sm`, `text-base`: 본문 크기인 16포인트)이 기준을 정하고, 사용자의 설정이 이를 확대·축소합니다. 이는 서로 무관한 포인트 상수 대신 이름 있는 타입, 간격, 크기 단계를 쓰는 Tailwind 모델의 유용한 부분을 의도적으로 따른 것입니다.

텍스트 컨테이너는 텍스트와 함께 늘어나게 하세요. 고정 높이 대신 최소 높이와 패딩을 지정합니다. 스케일되는 텍스트와 그 주변의 고정 지오메트리를 결합하는 커스텀 컴포넌트는 그 부분이 왜 늘어나지 않아야 하는지 문서화해야 합니다.

앱 UI의 모든 임의 포인트 값과 원시 색상 생성자는 리뷰에서 지적할 사항으로 취급하세요. 문서화된 물리적 또는 플랫폼 경계, 측정된 런타임 지오메트리, 래스터 또는 데이터 색상, 테마 정의 자체에 한해서만 허용하세요. 편의성이나 스크린샷과의 일치는 유효한 예외가 아닙니다.

해석된 레이아웃에서 캐시한 모든 것은 무효화 키에 글꼴 배율을 직접 또는 그와 함께 바뀌는 리비전을 통해 포함해야 합니다. 리스트에 알려 준 행 높이, 텍스트 측정값, 팝업 지오메트리, 텍스트에서 파생된 아이콘 크기, 커스텀 캔버스 메트릭이 여기에 해당합니다.
<a id="events-commands-and-focus"></a>

## 이벤트, 명령, 포커스

활성화에는 press를 사용하세요. `onPress`, `onLongPress`, `onPressDown`, `onPressUp` 모두 손가락, 펜, 마우스, 키보드 중 무엇으로 입력하든 같은 의미입니다. 터치 핸들러와 제스처는 손가락을 따라가는 동작(팬, 드래그)에만 사용하세요. 키 바인딩, 메뉴, 여러 입력에서의 디스패치를 지원해야 하는 명령에는 키보드 단축키(`keymap.bind`, `on_key`)와 메뉴 항목을 사용하세요. 핸들러는 해당 명령을 소유한 페이지 가까이에 두세요.

하나의 논리적 명령은 한 번만 모델링하세요. `Button`, `Menu` 항목, `ContextMenu` 항목, `nsh/desktop`의 애플리케이션 메뉴 항목, 키보드 단축키는 상태 변경 코드를 다섯 번 복사하지 말고 store의 같은 함수를 호출해야 합니다. 가능하면 레이블, 아이콘, 단축키, 비활성 상태를 하나의 명령 정책에서 도출하세요(`key_label("mod+s")`은 플랫폼 방식으로 단축키를 표기합니다). 그러면 각 진입점이 서로 어긋나지 않습니다. 메뉴는 탐색과 닫기를 담당하고, 명령의 허용 여부와 실제 동작은 여전히 페이지가 담당합니다.

```rust tabs
on_key("mod+s", move |_| save());
view()
    .child(button().on_press(save).child(text("Save")))
    .child(
        menu()
            .trigger(view().px_3().py_2().child(text("File")))
            .child(menu_item().on_select(save).child(text(format!("Save  {}", key_label("mod+s"))))),
    )
```

```tsx tabs
keymap.bind("mod+s", save);

<View>
  <Button onPress={save}><Text>Save</Text></Button>
  <Menu trigger={<View class="px-3 py-2"><Text>File</Text></View>}>
    <MenuItem onSelect={save}><Text>Save  {keymap.label("mod+s")}</Text></MenuItem>
  </Menu>
</View>
```

요소를 선택할 때는 시맨틱 역할을 유지하세요. 조용한 표현을 원하더라도 명령에는 `Button`을 사용하고, 링크로 바꾸는 대신 조용한 스타일을 적용하세요. NSH 앱은 `link` 역할을 URL이나 이메일 주소처럼 앱 밖에서 열리는 대상에 예약해 둡니다. 앱 내부 목적지에는 내비게이션을, 명령에는 `Button`을 사용하세요.

중첩된 상호작용이 부모의 같은 터치 처리를 막아야 할 때만 전파를 중단하세요(터치 이벤트의 `stopPropagation()`). 무차별적인 전파 중단은 스크롤, press, 제스처를 진단하기 어려운 방식으로 망가뜨립니다.

**메인 스레드는 앱 코드를 기다리지 않습니다.** 시스템이 즉시 답을 필요로 할 때(이 페이지를 pop해도 되는지, 이 sheet나 popover를 닫아도 되는지, 이 텍스트를 변경해도 되는지) NSH는 미리 마운트된 prop으로 네이티브에서 응답하고, 이후에 이벤트로 앱에 알립니다. 따라서 결정은 true나 false를 반환하는 콜백이 아니라 알게 되는 즉시 설정하는 prop입니다. 예를 들어 확인을 위한 `popOnBack={!dirty()}`과 `onBackPress`([popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback)), 시도를 전달받기 위한 `closeOnEscape`, `closeOnBackdropPress`과 `onCancel`, 입력 요소의 `maxLength`, 버튼의 `disabled`이 있습니다.

메뉴 항목의 `shortcut`(`nsh/desktop`)은 메뉴가 설정되어 있는 동안 해당 키를 바인딩하며, 메뉴는 이를 플랫폼 스타일로 표시합니다. 같은 키 입력에 대한 `keymap` 바인딩이 먼저 처리됩니다. 각 키 입력에는 하나의 소유자만 두고, 항목이나 단축키가 바뀌면 애플리케이션 메뉴를 다시 설정하세요.

포커스 소유권을 명확히 하세요.

- `Button`, `Switch`, 메뉴 항목은 데스크톱과 웹에서 키보드 포커스 정지점입니다. 컨트롤은 단순한 view가 아니라 이들을 기반으로 만드세요.
- 포커스는 상태 변경 뒤에 이어지는 이벤트나 effect에서 ref의 `focus()`로 이동하고, 스크린 리더의 포커스는 `set_accessibility_focus()`(Rust) 또는 `nsh`의 `setAccessibilityFocus`(TSX)로 이동하세요.
- 눈에 보이는 `focus:` 상태를 렌더링하세요.
- 렌더링 중에 무조건 포커스를 요청하지 마세요.

복합 위젯은 몇 가지 단편적인 단축키가 아니라 전체 내비게이션 모델(화살표 이동, 적절한 경우 Home / End 또는 페이지 이동, 확인, 취소, Tab 동작)을 구현해야 합니다.

오버레이는 가장 위에 있는 것부터 닫힙니다. Escape와 Android 뒤로 가기 버튼은 입력을 수신하는 최상위 오버레이로 전달됩니다(`onCancel`). 빠르게 반복되는 닫기와 열기 순서를 처리할 때는 이미 닫히는 중인 중간 surface에서 동작하지 않도록 하세요.

<a id="async-work-and-side-effects"></a>

## 비동기 작업과 부수 효과

비동기 작업은 컴포넌트 본문의 무조건적인 부수 효과로 시작하지 말고 이벤트, effect 또는 [`resource`](./reactivity.md#resource)에서 시작하세요. effect는 동기적으로 읽은 것만 추적합니다. 먼저 signal을 읽은 다음 작업을 시작하세요. 작업이 완료되면 signal을 통해 상태를 갱신하고, 그 시점에 컴포넌트가 이미 사라졌을 수 있음을 감안하며, 일관된 변경은 함께 기록하세요.

반복 작업은 소유자 아래에 두어 소유자가 사라질 때 취소되도록 하세요. Rust의 task와 타이머는 소유자와 함께 종료되고, TSX 타이머는 `cleanup`에서 중지됩니다. 독립적으로 끝나야 하는 일회성 task는 store에서 시작할 수 있지만, 그 경우 취소 기능은 포기하게 됩니다. 오류와 실패한 요청은 명시적으로 처리하세요.

비동기 작업은 명시적인 상태로 표현하세요. resource의 `state()`은 `unresolved`, `pending`, `ready`, `refreshing`, `errored` 중 하나입니다. 새로 고침 중에도 사용 가능한 이전 데이터를 유지하세요. resource는 다시 로드하는 동안에도 값을 유지합니다. 파괴적인 작업의 중복 제출을 막고, 복구 가능한 오류는 UI에 표시하세요. 로그를 사용자 피드백으로 삼지 마세요.

```rust tabs
let results = resource(
    move || {
        let q = query.get();
        (!q.is_empty()).then_some(q)
    },
    |q, _info| async move {
        let response = fetch(format!("https://api.example.com/search?q={q}")).await?;
        if !response.ok() {
            return Err(format!("HTTP {}", response.status()));
        }
        Ok(response.text())
    },
);
```

```tsx tabs
const results = resource(
  () => query() || undefined,
  async (q, { signal }) => {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as SearchHit[];
  },
);
```

비용이 큰 파싱이나 계산은 TSX 핸들러에서 빼내어 `computed`로 옮기거나, 상호작용 경로 밖으로 옮기거나, Rust로 옮기세요. 결과는 쿼리, 페이지, 선택이 바뀐 뒤에 도착할 수 있습니다. resource는 대체된 로드를 버리며, 직접 만든 작업은 revision이나 identity를 붙여 오래된 결과를 새 상태에 적용하지 않고 거부해야 합니다.

<a id="layout-measurement-and-scrolling"></a>

## 레이아웃, 측정, 스크롤

view는 자식을 열(column)로 배치하며, 자식은 기본적으로 열 전체로 늘어납니다. `class="flex"`(`.flex_row()`)은 CSS처럼 행(row)입니다. 컨트롤로 이루어진 행은 자식을 가운데 정렬(`items-center`)하는 것이 맞으며, 이는 그 의도를 명시합니다. 전체 높이 열로 이루어진 행은 기본 stretch를 유지하므로, 열이 행의 높이를 채우고 헤더는 맨 위에 유지됩니다.

```rust tabs
view()
    .flex_row()
    .flex_1()
    .child(sidebar())
    .child(content())
```

```tsx tabs
<View class="flex flex-1">
  <Sidebar />
  <Content />
</View>
```

대부분의 UI는 직접 측정하지 말고 레이아웃을 사용해야 합니다([레이아웃](./layout.md)). 측정(`onLayout`, `measure()`)은 오버레이, 가상화, 에디터, 차트처럼 올바른 동작이 확정된 지오메트리에 달려 있는 컴포넌트를 위한 심화 동작 도구입니다.

- 측정과 지오메트리는 해당 동작을 소유한 레이어에 두세요.
- 일반적인 레이아웃으로 관계를 표현할 수 없을 때만 레이아웃을 관찰하세요.
- 관련 없는 앱 상태를 레이아웃 이벤트마다 기록하지 마세요.
- 측정 데이터는 revision 범위로 다루세요. 텍스트 크기, 너비, 테마, 콘텐츠가 바뀌면 오래된 값이 될 수 있습니다.
- 팝업 배치는 `nsh/base`의 오버레이에 맡기세요. 배치, 뒤집기(flipping), 안전 영역 여백이 하나의 정책을 따릅니다.

정렬 불변 조건은 사후 보정보다 구조적 설계를 우선하세요. 형제 영역은 같은 값을 반복해서 쓰지 말고 같은 간격 토큰이나 공유 inset을 사용해야 합니다. 중요한 반복 가장자리, 열, 간격에는 실제 플랫폼(`nsh test --target`)에서 지오메트리 검사나 스크린샷을 추가하세요. 기본 창만 확인하지 마세요. 큰 텍스트 크기와 디스플레이 배율은 기본 스크린샷이 정렬되어 보이더라도 소수 좌표를 1픽셀 어긋남으로 바꿀 수 있습니다.

정밀도를 검토할 때는 확정된 결과를 측정하되, 측정으로 얻은 보정값을 임의의 값으로 코드에 넣지 마세요. 어긋남의 원인을 중복된 padding, 중첩된 inset, border 소유권, 폰트 메트릭, 반올림으로 추적한 다음 구조상의 소유자를 수정하세요.

스크롤 가능한 모든 영역에는 소유자가 하나여야 합니다. 같은 축에서 의도하지 않은 중첩 스크롤을 피하세요. scroll view에는 전체 페이지, 패널, 목록을 소유하는 요소를 넣어 인디케이터가 영역의 가장자리를 기준으로 표시되게 하고, 콘텐츠의 inset은 padding이 있는 컨테이너로 scroll view를 감싸지 말고 scroll view 안쪽에 두세요(`contentClass` / `contentStyle`). 콘텐츠와 페이지 경계 사이에 인디케이터가 떠 있다면 대개 스크롤 소유자가 잘못되었거나 padding이 엉뚱한 레이어에 있다는 뜻입니다. 안전 영역과 키보드는 padding과 margin에서 `env(safe-area-inset-*)`와 `env(keyboard-inset-height)`으로 피하세요(값은 접근자로 읽으세요). 이 값들은 회전과 키보드에 맞춰 네이티브에서 따라갑니다.

<a id="lists-tables-and-large-data"></a>

## 목록, 테이블, 대용량 데이터

데이터가 작고 제한된 컬렉션을 넘어 커질 수 있다면 [`List`](./lists.md)(Rust에서는 `virtual_list`)을 사용하세요. 행 identity를 화면에 보이는 위치와 분리하고, 업데이트할 때마다 전체 데이터 집합을 복사하지 마세요. 재활용, 스크롤 조정, 보이는 범위는 목록이 소유하고, 행 표현은 행 함수가 소유하게 하세요.

다음을 분리하세요.

- 원본 데이터와 도메인 id
- 필터링과 정렬 상태
- 선택 상태
- 스크롤 상태
- 행 렌더링

이렇게 하면 업데이트가 국소적으로 유지되고 view 트리가 데이터 모델이 되는 것을 막을 수 있습니다.

가상화는 단순한 성능 스위치가 아니라 동작 계약입니다. 행 함수는 셀마다 한 번 실행되고, 셀은 다른 행에 재사용됩니다.

- **항목별 상태는 반드시 id를 키로 하는 데이터에 보관해야 합니다.** 행 안에서 만든 signal에 두면 안 됩니다. 그런 signal은 셀과 함께 다음 항목으로 넘어갑니다.
- **항목은 반드시 사용하는 곳에서, 즉 바인딩 안에서 읽어야 합니다.** 행 함수 맨 위에서 복사한 값은 셀이 처음 보여 준 행에 속하게 됩니다.
- TSX에서는 불변 방식으로 업데이트하고(새 배열을 만들되 변경되지 않은 항목은 재사용하고, 변경된 항목은 새 객체로 만듭니다), `estimatedItemSize`는 일반적인 행에 가까운 값으로 지정하세요.
- 항목으로 스크롤(`scrollToIndex`)은 대부분의 행이 존재하지 않아도 데이터 좌표 기준으로 동작합니다.

```rust tabs
let liked = signal(HashSet::<u32>::new());

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
```

```tsx tabs
const liked = signal<Set<number>>(new Set());

<List each={posts()} estimatedItemSize={64} class="flex-1">
  {(post) => (
    <View class="flex-row p-4">
      <Text class="flex-1">{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

<a id="public-api-design"></a>

## 공개 API 설계

재사용 가능한 컴포넌트에는 다음을 지키세요.

- prop은 유효한 기본값을 정합니다. Rust에서는 `#[prop(default)]` 또는 `#[prop(default = …)]`, TSX에서는 prop을 읽는 곳에서 `??`를 사용합니다.
- 모든 prop, 이벤트, export에는 doc 주석을 작성합니다. Rust에서는 이 주석이 TSX에서 보이는 TypeScript 선언이 됩니다.
- 콜백은 요청된 변경을 설명하며, 포인터 세부 정보는 의미가 있을 때만 포함합니다.
- 임의의 자손을 검사하는 것보다 명시적인 part, slot, render 함수가 낫습니다.
- 재사용 가능한 동작을 추가할 때 제품 수준의 시각적 선택을 강제해서는 안 됩니다.

앱은 서명된 패키지로 호스트 앱에 전달되며 다시 빌드되지 않을 수도 있습니다. 이후 출시되는 모든 NSH 릴리스가 이를 있는 그대로 실행합니다. 앱이나 컴포넌트 라이브러리가 다른 곳에 노출하는 것(컴포넌트의 prop과 이벤트, crate의 export, 호스트 앱의 네이티브 컴포넌트와 모듈이 받는 함수)에도 같은 규율을 적용하세요.

- 입력에는 선택적 멤버만 추가하고, 타입은 넓히기만 하며, 기본값과 동작은 유지합니다(새 동작은 opt-in입니다).
- 매개변수가 늘어날 수 있는 함수는 옵션을 하나의 객체(`scrollTo({ x, y, animated })`)로 받으며, 위치 매개변수를 더 추가하지 않습니다. 범위의 시작과 끝처럼 늘어날 일이 없는 매개변수는 위치 매개변수로 둡니다.
- 모드는 나중에 세 번째 상태가 필요해질 수 있는 boolean이 아니라, 값을 추가할 수 있는 문자열 유니온으로 표현합니다.
- 값의 타입은 하나여야 합니다. `version: string`이며, `string | number`은 안 됩니다.
- 함수의 반환값은 필드를 추가할 수 있는 객체이며, 튜플이나 단일 값이 아닙니다.
- Promise를 반환하는 함수는 모든 실패를 Promise를 reject하는 방식으로 알리고, 호출자가 처리할 수 있는 실패에는 NSH 자체 API처럼 `code`를 담습니다. 호출자는 코드로 분기하고, 메시지는 사람을 위한 것이므로 바뀔 수 있습니다.
- 이름을 바꿀 때는 같은 구현을 가리키는 `@deprecated` 별칭으로 이전 이름을 유지합니다.

Rust에서는 호출자를 깨뜨리지 않고 진화해야 하는 동작 상태에는 비공개 필드가 기본입니다. 공개 필드는 의도적으로 레코드 형태인 설정과 직렬화되는 데이터에 적합합니다. 공개 필드가 있는 모든 공개 struct에는 `#[non_exhaustive]`를 붙이고 `Default`를 구현해야 합니다. 그러면 호출자는 모든 필드를 나열하는 struct 리터럴 없이 값을 만들 수 있고, 호출자를 깨뜨리지 않고 필드를 추가할 수 있습니다.

내부를 재구성하더라도 공개 import 경로는 안정적으로 유지하세요. crate의 `#[native_module]` 지정자와 그 export, 그리고 TSX 모듈의 export는 다른 코드가 import하는 대상입니다. 웹 프레임워크의 어휘보다 플랫폼 컨트롤 용어와 NSH에서 확립된 명명을 우선하세요.
<a id="platform-and-capability-boundaries"></a>

## 플랫폼 및 기능 경계

모든 플랫폼이 동일한 기능을 지원한다고 가정하지 마세요. 제목 표시줄과 창 컨트롤, 접근성, 클립보드, 햅틱, 스크롤 물리, 글꼴, 타이밍은 서로 다를 수 있습니다. 하나의 번들이 모든 곳에서 실행됩니다([플랫폼별 코드](./platform-specific.md)). 플랫폼별 코드는 NSH가 자리를 제공하는 곳에 두고, 대체 동작을 정의하세요.

- 요소가 모든 플랫폼에서 갖는 의미는 최상위 prop으로 둡니다. 특정 플랫폼 고유의 시스템 기능은 해당 기능이 있는 각 플랫폼의 `ios={{…}}`, `android={{…}}`, `desktop={{…}}` 또는 `web={{…}}`(Rust에서는 빌더 메서드)에 두며, 현재 플랫폼의 객체만 적용됩니다.
- 모바일 플랫폼의 API는 `nsh/mobile`에서, 데스크톱의 API는 `nsh/desktop`에서 가져옵니다.
- 플랫폼별 스타일은 `ios:`, `android:`, `web:` 클래스입니다.

플랫폼 분기는 표현 방식이 다르더라도 의미상의 계약을 유지해야 합니다. 예를 들어 대화상자는 iOS에서는 시트이고 데스크톱에서는 창 위의 레이어이지만, 앱은 여전히 일관된 열림 상태를 가져야 합니다. 공유 동작은 headless로, 플랫폼별 부분은 `nsh test --target`로 테스트하세요. NSH가 보고하는 값(`platform.os`, 상태, 이유)에 대한 모든 분기에는 `default`를 두세요. 이후 릴리스에서 플랫폼과 경우가 추가되며, 현재 배포된 앱도 그 위에서 실행되기 때문입니다([호환성](./compatibility.md)).

앱은 VM 밖에서 접근하는 대상을 `nsh.json` `"capabilities"`에 선언합니다. 여기에는 가져오기를 수행하는 호스트, 웹 뷰가 표시하는 페이지, 클립보드, 상태 표시줄이 포함됩니다([샌드박스와 권한](./sandbox-and-capabilities.md)). 다른 앱 안에 전달될 앱은 사용하는 항목을 정확히 나열해야 하며, 거부된 요청도 실패한 요청과 동일하게 처리해야 합니다. 호스트 앱은 앱이 선언한 것보다 적게 허용할 수 있습니다. 거부된 호출은 `code` `"ERR_ACCESS_DENIED"`와 함께 실패하며, `permission`는 해당 권한을, `resource`는 요청된 내용을 나타냅니다.

<a id="file-and-naming-conventions"></a>

## 파일 및 이름 규칙

- 페이지와 컴포넌트는 제품 개념에 따라 이름을 짓습니다: `ProjectList`, `ProjectEditor`, `SettingsPage`.
- 이벤트 핸들러는 의도에 따라 이름을 짓습니다: `confirmDelete`, `openProject`, `onQueryChange`.
- 모듈 하나에는 주된 책임 하나만 둡니다. 관련 없는 동작을 읽지 않고는 상태 소유권이나 생명주기를 더 이상 이해할 수 없게 되면 파일을 분리합니다.
- 컴포넌트의 모듈, props, 이벤트, 그리고 해당 테스트는 함께 변경되는 경우 한곳에 둡니다.
- 불변 조건과 의외의 생명주기 제약은 문서화하고, 당연한 빌더 호출은 설명하지 않습니다.
- Rust에서는 `rustfmt`를 사용하고 Clippy를 만족시키며, TSX에서는 `nsh check`를 사용합니다. 관련 없는 경고를 가리는 광범위한 `allow` 속성은 피합니다.

<a id="vocabulary-is-part-of-the-api"></a>

### 어휘는 API의 일부입니다

같은 개념에는 모든 컴포넌트에서 같은 단어를 사용합니다. prop이나 이벤트의 이름을 짓기 전에 먼저 NSH 자체 API에서 해당 용어를 찾고, 다음으로 GPUI Kit의 `gpui-base`, GPUI와 `gpui-component`, 그다음 플랫폼의 컨트롤에서 찾습니다. 프리미티브가 표시하는 내용과 전역 API는 HTML, DOM, CSS에서 이름을 가져옵니다(`src`, `html`, `placeholder`). Rust 이름은 `snake_case`이며 TSX에서는 `camelCase`로 변환됩니다(`on_open_change`는 `onOpenChange`). 하나의 단어는 하나의 단어로 유지합니다(`readonly`, `multiline`).

| 개념 | 명명 패턴 | 예시 |
| --- | --- | --- |
| 컴포넌트 | 명사, `PascalCase` | `Button`, `Dialog`, `QuantityStepper` |
| props와 이벤트(Rust) | `<Component>Props`, `<Component>Event` | `ButtonProps`, `ButtonEvent::Press` → `onPress` |
| 동작의 상태 객체 | `<Control>State`, `create<Control>`로 생성 | `NavStackState`, `createNavStack` |
| 값이 바뀐 이유 | `<Control>ChangeReason`, 문자열 유니온 | `DialogChangeReason`: `"cancel"`, `"backdropPress"` |
| 상태 | 형용사, 긍정형, `is` 접두사 없음 | `open`, `hidden`, `disabled`, `selected`, `checked`, `readonly` |
| 사용자가 할 수 있는 동작 | 형용사 | `scrollable`, `zoomable`, `selectable`, `resizable` |
| 형용사가 없는 기능 | `<feature>Enabled` | `pagingEnabled` |
| 부분의 표시 여부 | 부분의 이름을 딴 boolean, 기본값 `true` | `scrollbar`, `caret` (`scrollbar={false}`) |
| 슬롯의 표시 여부 | `<slot>Visible`, 기본값 `true` | `headerVisible` (`header`: 페이지의 슬롯) |
| 부분의 스타일 | `<part>Class`, `<part>Style` | `backdropClass`, `contentStyle` |
| 상태의 스타일 | `<state>Style`, `<state>:` 클래스 | `activeStyle`, `disabled:` |
| 슬롯 | 그것이 무엇인지 | `header`, `footer`, `trigger`, `content`, `empty` |
| 앱의 콘텐츠 | `render<Part>` | `renderCodeBlock` |
| 닫기 플래그 | `closeOn<Trigger>`, 기본값 `true` | `closeOnEscape`, `closeOnBackdropPress` |
| 값의 변경 | `on<Value>Change({ <value>, ... })`, 객체 하나 | `onChange({ value })`, `onOpenChange({ open, reason })` |
| 그 밖의 이벤트 | `on<Event>`, 현재형, 객체 하나 | `onPress()`, `onSubmit({ text })` |
| 단계 | `<act>Start`, `<act>End` | `onPanStart`, `onLoadStart` |
| 뷰 위의 마우스 | `Enter` / `Move` / `Leave`, DOM의 이름 | `onMouseEnter`, `onMouseMove`, `onMouseLeave` |
| 수신 시작 | `on(event, listener)`, `() => void` 반환 | `host.on(name, l)`, `BackHandler.on("press", l)` |
| 환경의 값 | 접근자, 그 옆에 `set<Value>` | `colorScheme()`, `setColorScheme` |
| 읽기 전용 boolean | `is<Adjective>`, `has<Noun>` | `isAvailable` |

props에는 `is<Adjective>` 형태를 사용하지 않습니다. 이 형태는 boolean을 읽기만 하는 대상(상수, 페이로드의 필드)에 쓰는 것입니다. 표시되는 부분은 부분의 이름을 따서 짓고, `<part>Shown`, `<part>Hidden` 또는 `shows<Part>`는 사용하지 않습니다.

Rust 빌더는 `Self`를 받아 반환하며, 설정하는 prop의 이름을 따르고 `set_`는 붙이지 않습니다(`.disabled(..)`, `.checked(..)`, `.on_change(..)`). 제자리 변경은 `set_<field>`입니다(`setRoutes`, `setColorScheme`). boolean 리더는 값이 무언가를 담고 있을 때는 `has<Noun>`, 상태나 권한을 나타낼 때는 `is<Adjective>`입니다. 동작에 형용사가 있으면 항상 형용사를 사용하세요: `canClose`보다 `isClosable`, `canZoom`보다 `isZoomable`. 동작이 형용사 형태가 없는 동사구라면 그것이 필요로 하는 대상의 이름을 사용하세요: `canGoToDefinition`가 아니라 `hasDefinition`. 새로운 `can` 리더는 추가하지 마세요.

<a id="let-the-enclosing-name-carry-the-context"></a>

### 둘러싼 이름이 맥락을 담도록 하세요

이름은 무언가의 안에서 읽힙니다. prop은 컴포넌트 안에서, 필드는 타입 안에서 읽힙니다. 어느 쪽도 자신을 둘러싼 이름을 반복하지 않습니다(`contentContainerStyle`가 아니라 `contentStyle`, `dialogBackdropClass`가 아니라 `Dialog`의 `backdropClass`). 한 타입의 필드는 같은 수준의 축약을 유지하세요.

<a id="use-precise-domain-words"></a>

### 정확한 도메인 용어를 사용하세요

- **selected**는 소속 여부 또는 현재 항목입니다. **checked**와 **pressed**는 체크박스나 토글의 값입니다. **focused**는 키보드의 대상입니다. **hovered**는 포인터의 존재입니다. 이들을 서로 바꿔 쓰지 마세요.
- **open / close**는 오버레이의 상태이고, **show / hide**는 일시적인 요청이며, **expand / collapse**는 구조에 대한 것입니다.
- **disabled**는 상호작용을 막습니다. **readonly**는 선택과 탐색은 허용하지만 편집은 허용하지 않습니다. **loading**은 작업이 실행되는 동안 중복 작업을 방지합니다.
- **press**는 모든 입력에 의한 활성화이며 NSH의 이벤트는 press라고 표현합니다(`onPress`). **click**은 마우스의 동작입니다.
- **index**는 위치이고 **id**는 식별자입니다. 순서가 바뀔 수 있는 데이터를 index로 저장하거나 키로 사용하지 마세요.
- **value**는 제어되는 도메인 데이터이고 **state**는 유지되는 동작입니다.
- **src**는 요소가 표시하는 리소스(이미지, 비디오, 페이지)이며, 그 밖의 주소는 **url**입니다.
- **role**은 선택지가 의미하는 바를 나타냅니다(`"cancel"`, `"destructive"`). 외관은 앱의 몫입니다.

더 좁은 도메인 용어가 있다면 `data`, `item2`, `handleAction`, `updateUi`, `process`, `manager`, `config` 같은 모호한 이름은 피하세요.

<a id="type-and-module-style"></a>

### 타입과 모듈 스타일

- Rust 타입은 `UpperCamelCase`, 모듈, 함수, 메서드, 필드, 지역 변수는 `snake_case`, 상수는 `SCREAMING_SNAKE_CASE`입니다. 컨텍스트 바인딩의 이름은 `cx`로 짓습니다.
- TSX 컴포넌트와 그 태그는 `PascalCase`, props, 함수, 지역 변수는 `camelCase`입니다. 프리미티브는 `nsh`에서, 기본 컴포넌트는 `nsh/base`에서 가져옵니다.
- 컴포넌트의 이름을 딴 모듈은 해당 컴포넌트의 공개 경계를 소유합니다. 다른 곳에서 import하는 대상을 바꾸지 않고 상태, 부분, 테스트를 파일로 분리하세요.
- 하나의 컴포넌트 개념에는 단수형 모듈 이름을 사용하고, 패밀리에는 확립된 이름을 사용합니다(`Menu`, `MenuItem`, `Submenu`에 대한 `menu`).
- 식별자에는 `Id` 접미사를 붙이고, 컬렉션에는 의미 있는 복수형을 사용합니다. 한 서브시스템 안에서 `idx`, `index`, `ix`를 번갈아 사용하지 마세요.
- 가능하면 술어는 긍정형으로 이름을 짓습니다. 긍정 상태는 여러 부정형보다 조합하기 쉽지만, 컨트롤의 의미와 일치하는 `disabled` 같은 확립된 용어는 유지하세요.

<a id="callback-and-event-wording"></a>

### 콜백과 이벤트의 표현

- 모든 이벤트는 필드가 하나뿐이거나 값의 변경이더라도 객체 하나를 전달하며, 그 필드는 보고하는 props의 이름을 따릅니다: `onChange({ value })`, `onOpenChange({ open, reason })`, `onLinkPress({ url })`. 이렇게 하면 이후 필드 추가가 단순한 확장이 됩니다. API의 데이터 타입은 페이로드 자체가 아니라 필드입니다(`onImagePress({ image })`). 보고할 내용이 없는 이벤트는 아무것도 전달하지 않습니다.
- 과거형이나 요청이 아니라 행위의 이름을 짓습니다: `onPress`, `onClose`, `onCancel`, `onBackPress`.
- 행위에 이름이 있다면 기하학적 상태가 아니라 의도의 이름을 짓습니다: "끝에 도달했다"가 아니라 `onLoadMore`.
- 생명주기 쌍은 `onOpen` / `onClose`이고, 단계는 `Start` / `End`이며 `Begin`는 사용하지 않습니다. 뷰 위의 마우스는 `onMouseEnter` / `onMouseMove` / `onMouseLeave`(DOM의 이름)이고, 그 위로 끌어온 파일은 `Enter` / `Leave`입니다.
- 콜백이 컴포넌트 자체의 상태 변경 전에 실행되는지 후에 실행되는지, 그리고 컴포넌트에 재진입할 수 있는지 문서화하세요.

<a id="documentation-and-copy-style"></a>

### 문서 및 문구 스타일

공개 문서는 컴포넌트가 하는 일과 상태를 누가 소유하는지로 시작해야 합니다. 예제는 현재의 API를 사용하고 안정적인 id를 보여 주어야 합니다. 기본값, 플랫폼 간 차이, 포커스 동작, 콜백 순서, 그리고 메인 스레드가 네이티브로 읽는 props를 문서화하세요.

레이블, 명령, 확인 대화상자, 대문자 사용, 줄임표에 대해서는 디자인 가이드의 인터페이스 언어 규칙을 따르세요. 각 도메인 객체, 명령, 상태에는 하나의 표준 용어를 유지하세요.

번역 키는 원본 언어의 문장이나 화면 좌표가 아니라 안정적인 의도를 설명합니다(`dialog.deleteProject.title`). 번역된 조각들로 문장을 조립하지 마세요. 영어 텍스트가 우연히 같다는 이유로 의미가 다른 곳에 하나의 키를 재사용하지 마세요.

구문이 아니라 의도를 현지화하세요. 각 로케일이 어순, 복수형, 구두점, 그리고 필요한 맥락의 양을 직접 제어할 수 있게 하세요. 테스트는 누락된 키와 일관되지 않은 고정 용어를 잡아내야 하며, 반복이 맥락상 정당한지는 사람의 검토로 판단합니다. 모든 문자열은 실제와 같은 콘텐츠, 텍스트 길이 증가, 큰 텍스트 크기로 해당 컴포넌트 안에서 검증하세요.

<a id="testing-strategy"></a>

## 테스트 전략

동작을 증명할 수 있는 가장 낮은 계층에서 테스트하세요([테스트](./testing-and-trace.md)).

1. 상태 전이, 포맷팅, 파싱, 정렬에 대한 순수 테스트(크레이트 함수의 `cargo test`, 스토어 함수의 테스트 파일).
2. 컴포넌트, 이벤트, 수명에 대한 headless 앱 테스트: 실제 엔진, 렌더러, 레이아웃, 리스트를 사용하고 디스플레이 프레임은 60 Hz로, `nsh test`(`nsh/test`) 또는 `cargo test`(`nsh_testing::Headless`)에서 수행합니다.
3. 포커스, 키보드, 포인터, 레이아웃, 렌더링된 상태에 대한 상호작용 테스트: 사용자가 취하는 단계(`press`, `type`, `scroll`, `drag`, `keyboard.press`)로, headless와 실제 플랫폼(`nsh test --target macos`, `ios`, `android`, `web`, ...)에서 수행합니다.
4. 전체 워크플로에 대한 예제 또는 앱 스모크 테스트, 그리고 상호작용의 비용을 측정하는 `nsh test --trace`.

```rust tabs
#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open("./App.tsx");
  await app.press("role:button[Tap]");
  expect(app.texts()).toContain("Count: 1");
});
```

상호작용 컴포넌트에서는 구현 세부 사항이 아니라 의미상의 계약을 검증하세요. 누르기와 키보드에 의한 활성화, 제어되는 값의 변경, disabled 동작, 포커스 이동, 이벤트 횟수와 순서, 안정적인 식별자, 중요한 빈 상태와 실패 상태가 그 대상입니다. 실제 네트워크와 시간을 기다리는 대신 네트워크는 스텁 처리하고(`network` 라우트), 시간은 수동 클록으로 제어하세요. 실패를 결정적으로 재현할 수 있다면 버그를 수정하기 전에 회귀 테스트를 추가하세요.

뷰는 사용자가 찾는 방식으로 찾으세요. 역할과 이름, 레이블 또는 텍스트(`role:button[Save]`, `label:Close`)로 찾고, 다른 방법으로 지칭할 수 없는 경우에는 안정적인 `testID`로 찾습니다. 셀렉터는 매 단계마다 다시 읽히므로 단계가 오래된 스냅샷에 대해 동작하는 일이 없습니다. 셀렉터로 표현할 수 없는 시각적 사실에는 스크린샷(`app.screenshot`, 실제 플랫폼에서)을 사용하고, 좌표는 최후의 수단으로만 사용하세요. 자동화된 증거와 수동 증거는 별도로 보고하세요.

<a id="performance-rules"></a>

## 성능 규칙

- 바인딩이나 이펙트에서, 그것이 읽는 상태를 무조건 쓰지 마세요.
- 바인딩이나 행 함수 안에서 시그널, 이펙트, 키 바인딩, 비용이 큰 자료구조를 생성하지 마세요.
- 일관된 변경이 트리의 가장 좁은 부분만 갱신하도록 바인딩에서 시그널을 읽으세요.
- 긴 컬렉션에는 `List`를 사용하고 보이는 범위만 렌더링하세요.
- 클로저를 만족시키기 위한 목적만으로 큰 문자열이나 컬렉션을 복제하지 마세요. `Copy` 핸들이나 공유 데이터(`SharedString`, `Rc`)를 캡처하세요.
- TSX 핸들러와 계산된 값은 가볍게 유지하세요. 무거운 작업은 상호작용 경로 밖으로 옮기거나 Rust로 옮기세요.
- 캐시를 추가하기 전에 `nsh test --trace`로 측정하세요. 캐시에는 명확한 무효화 담당자가 있어야 합니다.
- 애니메이션 작업은 범위를 제한하세요. 프레임마다 시그널에 쓰는 대신 UI 스레드의 애니메이션 값을 사용하고, 스크롤 리스너 대신 `scrollValue`를 사용하며([애니메이션](./animation.md)), 모션 감소 설정(`reduceMotion()`)을 존중하세요.
<a id="common-failure-modes"></a>

## 일반적인 실패 패턴

다음 패턴은 피하세요.

- 앱과 무관한 상태를 하나의 signal에 모두 담는 것
- 비즈니스 로직과 네트워크 요청을 긴 컴포넌트 본문에 직접 넣는 것
- 순서를 바꿀 수 있는 콘텐츠에 무작위 키나 인덱스 기반 키를 사용하는 것
- `List` 행 안에서 생성한 signal에 행별 상태를 두는 것
- 컴포넌트 본문에서 prop이나 signal을 읽고 그 값이 갱신되기를 기대하는 것
- 사용자 지정 테마와 다크 모드를 깨뜨리는 리터럴 색상과 모서리 반경
- 포커스, 키보드, 비활성화, 접근성 동작을 이미 제공하는 시맨틱 컴포넌트가 있는데도 직접 만든 누를 수 있는 뷰를 사용하는 것
- 제어되는 값과 어긋나게 되는 중복된 로컬 상태
- 한 signal을 다른 signal로 복사하는 effect, 그리고 바인딩을 통해 순환하는 쓰기
- 시스템이 즉시 필요로 하는 결정을 미리 설정한 prop이 아니라 콜백에 맡기는 것
- 소유권이 명시되지 않은 중첩 스크롤 뷰
- 일회성 화면을 위해 새로운 컴포넌트 변형을 만드는 것
- 되돌릴 수 있고 위험이 낮은 작업에 확인 대화상자를 띄우는 것
- 내부 함수만 호출하고 누르기, 입력, 스크롤은 전혀 수행하지 않는 테스트

<a id="rules-for-coding-agents"></a>

## 코딩 에이전트를 위한 규칙

에이전트는 편집하기 전에 가장 가까운 구현, 해당 테스트, 모듈의 공개 export, 그리고 관련 레퍼런스 페이지를 읽어야 합니다. React, React Native, CSS 또는 GPUI 예제를 유추로 옮기지 말고, 현재 소스와 `.nsh/types`에서 시그니처를 검색해야 합니다. NSH 컴포넌트는 한 번만 실행되며, 바인딩은 읽은 signal을 따라가기 때문입니다.

에이전트는 각 변경에 대해 다음을 명시할 수 있어야 합니다.

1. 동작 소유자와 프레젠테이션 소유자
2. 유지되는 identity와 상태 수명 주기
3. 누르기, 키보드, 포커스, 접근성에 대한 계약
4. 레이아웃과 스크롤 소유자
5. 테마 토큰과 의도적인 예외
6. 동작이 퇴행하면 실패하게 되는 테스트

생성된 코드는 반드시 사람이 검토하고 테스트해야 합니다. "컴파일된다"는 UI 품질 기준이 아니며, 생성된 코드를 단지 깔끔해 보이게 만드는 광범위한 리팩터링은 앱의 아키텍처에 맞추는 일을 대신할 수 없습니다.

<a id="implementation-checklist"></a>

## 구현 체크리스트

리뷰를 요청하기 전에 다음을 확인하세요.

- 상태와 부수 효과의 소유권이 명확하다.
- 일반 함수와 컴포넌트 중 무엇을 쓸지 의도적으로 선택했고, prop과 signal은 사용하는 위치에서 읽는다.
- 반복되는 요소에는 도메인 기반의 안정적인 키와 테스트 ID가 있다.
- 개별적인 시각적 리터럴 대신 테마 토큰과 Tailwind 스케일을 사용한다.
- 누르기, 키보드 단축키, 포커스, 비활성화 상태, 오버레이가 함께 올바르게 동작한다.
- 시스템이 즉시 필요로 하는 결정은 미리 설정한 prop으로 전달한다.
- 로딩, 빈 상태, 오류, 취소 경로가 모두 표현되어 있다.
- 긴 데이터 집합에는 `List`를 사용하고, 항목별 상태는 데이터에 둔다.
- 공개 API 추가는 범위를 넓히기만 하며, 의존성 방향과 캡슐화를 유지한다.
- 테스트가 적절한 계층에서 동작을 검증하며, 헤드리스 환경과 변경이 영향을 주는 플랫폼에서 모두 실행된다.
- 포매팅, Clippy, `nsh check`, 대상 테스트, 관련 예제가 모두 통과한다.

앱 설정은 [시작하기](./getting-started.md)를, 최신 API 세부 사항은 [Elements](../elements/index.md)와 [API](../modules/index.md) 레퍼런스를 참고하세요.
