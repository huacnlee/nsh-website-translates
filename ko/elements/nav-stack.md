---
title: "NavStack"
description: "네이티브 내비게이션 스택: NavStack, NavPage, createNavStack, 페이지 푸시와 팝, 헤더 슬롯, 페이지 떠나기, 그리고 각 플랫폼이 스택을 표시하는 방식."
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---

# NavStack

내비게이션 스택은 한 번에 한 페이지만 보여 주고 그 아래의 페이지는 유지합니다. iOS와 Mac Catalyst에서는 `UINavigationController` 기반으로 시스템 헤더와 스와이프 뒤로 가기를 제공하고, Android에서는 툴바와 예측 뒤로 가기(predictive back)를 갖춘 페이지 스택을 사용합니다. 데스크톱(macOS, Windows, Linux, GPUI)과 웹에서는 각 페이지 상단에 앱 고유의 헤더가 표시되며, 뒤로 가기 키와 브라우저의 뒤로 가기 버튼이 페이지를 pop합니다. 스택은 `NavStack`, 그 페이지 하나는 `NavPage`입니다.

스택은 내비게이션 동작(전환, 뒤로 가기 제스처와 버튼, 페이지가 가려져 있는 동안의 상태)을 담당하며, 페이지의 콘텐츠와 데스크톱 헤더는 앱이 직접 구성합니다.

```rust tabs
use nsh_base::{button, nav_page, nav_stack};
use nsh_core::prelude::*;

/// A button with the app's look.
fn action(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text(title).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// The header on the desktops and the web, with a back button over the first page.
fn bar(title: impl Into<SharedString>, routes: Signal<Vec<u32>>) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .px_4()
        .py_3()
        .border_b_1()
        .border_color(rgb(0xe5e5e5))
        .child(when(
            move || !routes.with(Vec::is_empty),
            move || {
                action("Back", move || {
                    routes.update(|r| {
                        r.pop();
                    })
                })
            },
        ))
        .child(text(title.into()).text_lg().font_weight(FontWeight::SEMIBOLD))
}

fn app() -> impl IntoElement {
    // The messages pushed over the inbox, bottom to top.
    let routes = signal(Vec::<u32>::new());
    nav_stack()
        .flex_1()
        .child(
            nav_page()
                .title("Inbox")
                .header(bar("Inbox", routes))
                .child(view().flex_1().p_4().child(action("Open message 1", move || {
                    routes.update(|r| r.push(1))
                }))),
        )
        .child(each(
            move || routes.get(),
            |id: &u32| *id,
            move |id, depth| {
                let title: SharedString = format!("Message {}", id.get_untracked()).into();
                nav_page()
                    .title(title.clone())
                    .header(bar(title, routes))
                    // The user went back natively: this page and those above it are gone.
                    .on_dismiss(move || routes.update(|r| r.truncate(depth.get_untracked())))
                    .child(view().flex_1().p_4().child(text("The message.")))
            },
        ))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { Button, createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "home" } | { name: "detail"; id: number };

const nav = createNavStack<Route>([{ name: "home" }]);

function Action(props: { title: string; onPress: () => void }) {
  return (
    <Button onPress={props.onPress} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center text-base font-semibold text-white">{props.title}</Text>
    </Button>
  );
}

function Bar(props: { title: string }) {
  return (
    <View class="flex-row items-center gap-3 border-b border-neutral-200 px-4 py-3">
      {nav.routes().length > 1 && <Action title="Back" onPress={() => nav.pop()} />}
      <Text class="text-lg font-semibold">{props.title}</Text>
    </View>
  );
}

function Home() {
  return (
    <NavPage title="Inbox" header={<Bar title="Inbox" />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Action title="Open message 1" onPress={() => nav.push({ name: "detail", id: 1 })} />
      </View>
    </NavPage>
  );
}

function Detail(props: { id: number }) {
  const title = `Message ${props.id}`;
  return (
    <NavPage title={title} header={<Bar title={title} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The message.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => (route.name === "home" ? <Home /> : <Detail id={route.id} />)}
    </NavStack>
  );
}

mount(App);
```

iOS와 Android에서는 `title` 및 뒤로 가기 버튼이 있는 시스템 헤더가 표시되고, 데스크톱과 웹에서는 `header` 영역이 표시됩니다. 휴대폰만 대상으로 하는 앱은 `header` 속성을 생략하고, 데스크톱만 대상으로 하는 앱은 시스템 헤더 옵션을 생략합니다. [내비게이션 가이드](../docs/navigation.md)에서는 스택의 상태, 다이얼로그, Android 뒤로 가기 버튼, 탭 등 앱 전체의 내비게이션을 차근차근 설명합니다.

<a id="how-a-stack-works"></a>

## 스택의 동작 방식

- 스택의 페이지는 **라우트**입니다. 라우트는 스택의 맨 아래부터 맨 위까지 순서대로 놓이는, 원하는 값입니다. 라우트는 보통 페이지를 가리키는 이름과 그 파라미터를 담습니다.
- TSX에서 라우트는 `createNavStack` 함수가 만드는 상태에 저장됩니다. `NavStack` 컴포넌트는 push마다 자식 함수를 한 번씩 호출하고 그 결과를 페이지로 표시합니다. 라우트가 스택에 있는 동안 해당 페이지를 유지하므로, 다른 페이지가 덮고 있는 동안에도 페이지는 상태(시그널, 스크롤 위치, 입력값)를 유지합니다.
- Rust에서 스택의 자식은 곧 페이지입니다. `nav_stack()` 안에 넣은 `nav_page()` 항목은 push되고, 빠진 항목은 pop됩니다. 라우트는 시그널에 보관하고, 아래쪽 페이지가 상태를 유지하도록 페이지를 렌더링하세요(`each(..)` 사용, 라우트를 키로 지정).
- push마다 독립된 페이지가 하나씩 생기며, 같은 라우트 값을 두 번 push한 경우도 마찬가지입니다.
- 사용자가 네이티브 방식으로 페이지를 떠나면(뒤로 가기 버튼, 스와이프 뒤로 가기, Android 뒤로 가기, 데스크톱의 뒤로 가기 키, 브라우저의 뒤로 가기) 해당 페이지는 사라집니다. TSX에서는 스택이 상태에서 그 라우트를 제거하므로 `nav.routes()` 값은 항상 사용자가 보는 화면과 일치합니다. Rust에서는 페이지가 `on_dismiss` 이벤트를 보고하며, 여기서 해당 라우트(와 그 위의 라우트)를 제거합니다.
- TSX에서 자식 함수가 `<NavPage>` 이외의 값을 반환하면 기본 옵션의 페이지가 만들어집니다. 헤더와 그 밖의 옵션을 설정하려면 `<NavPage>` 요소를 반환하세요.

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

초기 라우트 `routes` (아래에서 위 순서)로 시작하는 스택의 상태를 만듭니다. 한 번만 만들고(예: 모듈 수준에서) `<NavStack state>` 에 전달하세요. 어떤 코드에서든 이를 import하여 내비게이션할 수 있습니다.

| 멤버 | 설명 |
|---|---|
| `routes: Accessor<readonly R[]>` | 라우트(아래에서 위 순서). 반응형입니다. |
| `push(route: R): void` | 페이지를 push합니다. |
| `pop(count?: number): void` | `count`개의 페이지를 pop합니다(기본값 1). 최소 한 페이지는 항상 남습니다. |
| `popToRoot(): void` | 첫 페이지로 돌아갈 때까지 pop합니다. |
| `replace(route: R): void` | 맨 위 페이지를 교체합니다. |
| `setRoutes(routes: R[]): void` | 페이지들을 교체합니다. 그대로 남는 라우트(같은 값)는 페이지와 상태를 유지합니다. |
| `remove(route: R): void` | 스택 내 위치와 관계없이 `route`에 해당하는 가장 위쪽 페이지를 제거합니다(비교 기준: `===`). |

Rust에서는 라우트 시그널을 변경하면 같은 동작이 됩니다. `routes.update(|r| r.push(route))`: push, `r.pop()`: pop, `r.truncate(1)`: 시그널에 유지할 첫 페이지까지 pop, `routes.set(..)`: 페이지 교체.

```rust tabs
routes.update(|r| r.push(7));
routes.update(|r| r.truncate(r.len().saturating_sub(2)));
routes.set(vec![1, 2]);
let depth = move || routes.with(Vec::len);
```

```tsx tabs
nav.push({ name: "detail", id: 7 });
nav.pop(2);
nav.setRoutes([{ name: "home" }, { name: "detail", id: 1 }]);
const depth = () => nav.routes().length;
```

<a id="navstack-props"></a>

## NavStack 속성

| 속성 | Rust | 타입 | 설명 |
|---|---|---|---|
| `state` | 페이지가 곧 자식입니다 | `NavStackState<R>` | 라우트를 보관하는 상태(`createNavStack`). 필수. |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | 라우트를 렌더링합니다. 옵션을 지정하려면 `<NavPage>` 요소를 반환합니다. 필수. |
| `style`, `class` | 스타일 메서드 | | 스택의 스타일입니다. 보통 `flex: 1` 값을 사용합니다. |
| `testID` | `.test_id(..)` | `string` | 테스트와 `nsh test --trace`에서 스택을 찾는 데 사용합니다. |

TSX의 자식 함수는 라우트 값 자체와, 스택에서의 위치를 가져오는 접근자(accessor)를 받습니다.

<a id="navpage-props"></a>

## NavPage 속성

`NavPage` 컴포넌트는 스택의 한 페이지입니다. 페이지의 콘텐츠, 데스크톱과 웹에서의 `header`, iOS와 Android에서의 시스템 헤더 옵션을 담습니다. Rust에서는 `nav_page()` 함수가 페이지를 반환하며, 빌더 메서드 이름은 속성 이름을 snake_case로 바꾼 것입니다.

| 속성 | Rust | 타입 | 기본값 | 설명 |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | 없음 | 데스크톱과 웹: 페이지의 헤더로, 페이지 상단에 배치되며 너비는 페이지 전체, 높이는 레이아웃된 만큼이고 콘텐츠는 그 아래에 놓입니다. |
| `title` | `.title(..)` | `string` | 없음 | iOS와 Android: 시스템 헤더의 제목. |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS와 Android: 시스템 헤더를 표시합니다. |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS와 Android: 콘텐츠가 투명한 시스템 헤더 아래까지 확장됩니다. |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS: 이 페이지가 맨 위에 있는 동안 시스템 탭 바가 사라지며, 전환 중에 페이지와 같은 애니메이션으로 이동합니다. 탭 바는 다시 만들어지지 않고, 페이지가 pop되면 돌아옵니다. |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS: 콘텐츠가 스크롤되면 바 안으로 줄어드는 큰 제목. 콘텐츠는 헤더 아래에서 스크롤됩니다. |
| `headerBackTitle` | `.header_back_title(..)` | `string` | 없음 | iOS와 Android: 이 페이지로 돌아오는 뒤로 가기 버튼의 레이블(Android에서는 스크린 리더용 설명). |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS와 Android: 뒤로 가기 버튼을 표시합니다. |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | 없음 | iOS와 Android: 뒤로 가기 버튼 대신 시스템 헤더의 앞쪽(leading) 가장자리에 표시되는 콘텐츠. |
| `headerRight` | `.header_right(..)` | `JSX.Element` | 없음 | iOS와 Android: 시스템 헤더의 뒤쪽(trailing) 가장자리에 표시되는 콘텐츠. |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | 없음 | iOS와 Android: 제목을 대체하는 콘텐츠. |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | 플랫폼 기본값 | iOS와 Android: 시스템 헤더의 색상. 배경, 제목(`color`), 버튼(`tintColor`)의 색상입니다. |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | 없음 | 같은 색상을 클래스로 지정합니다. `bg-*`, 제목용 `text-*`, 버튼용 `tint-*`(Rust: `.bg(..)`, `.text_color(..)`, `.tint_color(..)`. 외형에 따라 바뀌는 테마 색상). `headerStyle` 값이 이들보다 우선합니다. |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | 뒤로 가기 버튼과 스와이프 뒤로 가기로 페이지가 pop됩니다. [페이지 떠나기](#leaving-a-page)를 참고하세요. |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | 인터랙티브 뒤로 가기 제스처로 페이지가 pop됩니다. iOS의 스와이프 뒤로 가기, 손가락을 따라가는 Android 예측 뒤로 가기가 해당합니다. 뒤로 가기 버튼은 어느 쪽이든 페이지를 pop합니다. |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | 페이지가 나타나고 사라지는 방식. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | 없음 | 페이지가 `animation` 대신 WGSL 셰이더를 통해 나타나고 사라집니다. `shade(uv)` 함수는 아래 페이지(`sample_from`)와 이 페이지(`sample_to`)를 읽으며, 이때 `nsh.progress` 값은 `duration` 밀리초(기본값 350) 동안 0에서 1까지 변하고 페이지가 사라질 때는 1에서 0으로 돌아갑니다. 시스템이 모션 줄이기를 요청하면 페이지는 자체 `animation` 값을 사용합니다. [Shader](./shader.md)를 참고하세요. |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | 없음 | iOS와 Android: 페이지가 맨 위에 있는 동안의 상태 표시줄. [상태 표시줄](../modules/nsh-base.md#status-bar)을 참고하세요. |
| `style`, `class` | 스타일 메서드 | | 없음 | 페이지의 스타일. |
| `children` | `.child(..)` | `JSX.Element` | 없음 | 콘텐츠. |
| `testID` | `.test_id(..)` | `string` | 없음 | 테스트와 `nsh test --trace`에서 페이지를 찾는 데 사용합니다. |

<a id="navpage-events"></a>

## NavPage 이벤트

| 이벤트 | Rust | 설명 |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | 사용자가 페이지에서 뒤로 가기를 눌렀습니다(헤더의 뒤로 가기 버튼, Android 뒤로 가기, 데스크톱의 Escape, Alt+Left 또는 마우스 뒤로 가기 버튼, 브라우저의 뒤로 가기). `popOnBack` 값이 pop을 허용했는지와 관계없이 발생합니다. |
| `onDismiss` | `.on_dismiss(..)` | 사용자가 페이지를 pop했습니다(뒤로 가기 버튼, 스와이프). TSX에서는 해당 라우트가 이미 제거되며, Rust에서는 여기서 라우트를 제거합니다. |

<a id="header-slots"></a>

## 헤더 슬롯

다음은 슬롯입니다: `header`, `headerLeft`, `headerRight`, `headerTitle`. 슬롯은 시그널을 읽고, 누름을 처리하며, 페이지가 표시되는 동안 갱신되는 일반 요소입니다. 데스크톱과 웹에서는 `header` 슬롯이 앱의 전체 헤더이고, 나머지 셋은 iOS와 Android의 시스템 헤더에 들어갑니다.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn profile(edit: impl Fn() + 'static) -> Screen {
    nav_page()
        .title("Profile")
        .header(profile_bar())
        .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(white()).tint_color(white()))
        .header_right(text("Edit").text_color(white()).on_press(move || edit()))
        .child(scroll().flex_1())
}
```

```tsx tabs
<NavPage
  title="Profile"
  header={<ProfileBar />}
  headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}
  headerRight={<Text onPress={edit} style={{ color: "#ffffff", fontSize: 17 }}>Edit</Text>}
>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

페이지의 콘텐츠는 헤더 아래에서 시작합니다. iOS와 Android에서는 불투명한 시스템 헤더 아래, 데스크톱과 웹에서는 `header` 아래입니다. `headerTransparent`, `headerLargeTitle`, `headerVisible={false}` 중 하나를 사용하면 iOS와 Android에서 콘텐츠가 페이지 맨 위에서 시작하므로, 헤더와 상태 표시줄을 피하게 하려면 [`env(safe-area-inset-top)`](./safe-area.md) 또는 `safeAreaInsets()` 중 하나를 사용하세요.

iOS에서 `headerVisible={false}` 사용 시 `popOnSwipe` 및 `popOnBack` 값이 모두 true인 동안 스와이프 뒤로 가기가 활성 상태로 유지됩니다. 수락된 인터랙티브 뒤로 가기 제스처는 전환이 시작될 때 편집을 종료하므로 드래그하는 동안 키보드가 내려갑니다. 전환을 취소하면, 다른 컨트롤이 포커스를 가져가지 않은 경우 같은 에디터의 포커스가 복원됩니다.

```rust tabs
nav_page()
    .title("Large title")
    .header_large_title(true)
    .child(scroll().flex_1())
```

```tsx tabs
<NavPage title="Large title" headerLargeTitle>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

<a id="leaving-a-page"></a>

## 페이지 떠나기

`popOnBack={false}` 속성은 사용자를 페이지에 머물게 합니다. 예를 들어 폼에 저장되지 않은 변경 사항이 있는 경우입니다. 이 값이 false인 동안에는 스와이프 뒤로 가기가 꺼지고, 뒤로 가기 버튼과 키는 pop하지 않고 `onBackPress` 핸들러를 호출합니다. 사용자에게 확인한 다음, 직접 pop하세요:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<u32>>) -> Screen {
    let note = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| {
                    r.pop();
                });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || note.with(String::is_empty))
        .on_back_press(move || {
            if !note.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(note)
                .on_change(move |v: &str| note.set(v.to_owned()))
                .placeholder("A note"),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
  const confirm = async () => {
    const { action } = await AlertDialog.show({
      title: "Discard your changes?",
      actions: [
        { label: "Keep editing", role: "cancel", id: "keep" },
        { label: "Discard", role: "destructive", id: "discard" },
      ],
    });
    if (action === "discard") nav.pop();
  };
  return (
    <NavPage title="Edit" popOnBack={text().length === 0} onBackPress={() => text().length > 0 && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" />
    </NavPage>
  );
}
```

> [!IMPORTANT]
> 시스템은 사용자가 동작하는 순간 메인 스레드에서 뒤로 갈 수 있는지 묻는데, 메인 스레드는 JS나 Rust 코드를 기다리지 않습니다. 그래서 NSH는 이미 마운트된 `popOnBack` 값으로 답합니다. 사용자가 뒤로 가기 전에, 잃을 내용이 생기는 즉시 `popOnBack={false}` 값을 설정하세요.

`onBackPress` 이벤트는 뒤로 가기를 누를 때마다 호출되며 페이지가 pop될 때도 호출되므로, 사용자가 뒤로 갔다는 사실도 알려 줍니다. 스와이프 제스처만 끄고 뒤로 가기 버튼은 유지하려면 `popOnSwipe={false}` 속성을 사용하세요. 확인 대화상자 자체는 [AlertDialog](./alert-dialog.md)입니다.

<a id="platform-notes"></a>

## 플랫폼별 참고 사항

- **iOS**: 시스템 헤더, 뒤로 가기 버튼, 스와이프 뒤로 가기를 갖춘 `UINavigationController`. `headerLargeTitle` 값은 UIKit의 large title입니다. 전환이 진행되는 동안 도착한 스택 변경은 전환이 끝날 때 적용됩니다.
- **Android**: 툴바가 있는 스택입니다. 시스템 뒤로 가기 버튼은 맨 위 페이지를 pop하며, 지원하는 Android 버전에서는 예측 뒤로 가기가 적용됩니다. 위로 가기 화살표의 스크린 리더용 설명은 아래 페이지의 `headerBackTitle` 값이거나 시스템 기본 설명입니다. 뒤로 가기 버튼을 직접 처리하려면 [`BackHandler`](../modules/nsh-mobile.md#backhandler)의 `BackHandler` 항목을 참고하세요.
- **Mac Catalyst**: iOS와 같습니다.
- **데스크톱(macOS, Windows, Linux, GPUI)과 웹**: 각 페이지는 상단에 `header` 영역을, 그 아래에 콘텐츠를 표시합니다. 데스크톱에서는 Escape, Alt+Left, 마우스 뒤로 가기 버튼으로, 웹에서는 브라우저의 뒤로 가기 버튼으로 뒤로 갑니다.

스택과 그 헤더 위에 표시되는 콘텐츠(예: 시트나 전체 화면 플로우)에는 [Dialog](./dialog.md)를 사용하세요.
