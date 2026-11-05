---
title: "내비게이션"
description: "createNavStack, NavStack, NavPage를 사용한 네이티브 내비게이션 스택, 모든 플랫폼에서의 헤더, popOnBack으로 사용자를 페이지에 유지하는 방법, 대화상자, 그리고 Android 뒤로 가기 버튼."
order: 41
group: ui
source_hash: f7722b75b9e46970
---

# 내비게이션

`nsh_base`(TSX: `nsh/base`)에서 네이티브 내비게이션 스택과 네이티브 다이얼로그를 제공합니다. 내비게이션 스택(Rust에서는 `nav_stack()`, TSX에서는 `NavStack`)은 iOS에서는 헤더, 스와이프 뒤로 가기, 큰 제목을 갖춘 UINavigationController이고, Android에서는 툴바와 predictive back을 갖춘 스택입니다. 데스크톱과 웹에서는 각 페이지가 앱이 그리는 헤더를 표시합니다. 라우트는 앱의 상태에 보관하며, 스택은 각 라우트를 페이지로 렌더링하고 스택에 있는 동안 상태와 함께 마운트된 채로 유지합니다.

Rust에서는 prelude와 함께 빌더를 이름으로 import합니다(`use nsh_base::{dialog, nav_page, nav_stack};`, 시스템 알림은 `nsh_base::alert_dialog()`). 라우트는 시그널이며 스택의 자식은 라우트당 하나씩인 페이지로, 키(`each`)로 구분됩니다. 페이지를 넣으면 push되고 빼면 pop됩니다. TSX에서는 라우트를 `createNavStack`에 보관하고 `NavStack`로 렌더링합니다.

```rust tabs
use nsh_base::{nav_page, nav_stack};
use nsh_core::prelude::*;

#[derive(Debug, Clone, PartialEq)]
enum Route {
    Inbox,
    Message(u32),
}

/// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
fn header(routes: Signal<Vec<Route>>, title: &'static str) -> impl IntoElement {
    view()
        .h(px(48.0))
        .flex_row()
        .items_center()
        .gap_3()
        .border_b_1()
        .border_color(rgb(0xe5e7eb))
        .px_4()
        .child(when(
            move || routes.with(|r| r.len() > 1),
            move || {
                text("Back")
                    .role(AccessibilityRole::Button)
                    .on_press(move || routes.update(|r| { r.pop(); }))
                    .text_color(rgb(0x2563eb))
                    .active(|s| s.opacity(0.6))
            },
        ))
        .child(text(title).text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
}

fn inbox(routes: Signal<Vec<Route>>) -> Screen {
    nav_page()
        .title("Inbox")
        .header(header(routes, "Inbox"))
        .child(scroll().flex_1().children((1..=5).map(move |id| {
            view()
                .on_press(move || routes.update(|r| r.push(Route::Message(id))))
                .p_4()
                .active(|s| s.bg(rgb(0xf3f4f6)))
                .child(text(format!("Message {id}")))
        })))
}

fn message(routes: Signal<Vec<Route>>, id: u32) -> Screen {
    nav_page()
        .title(format!("Message {id}"))
        .header(header(routes, "Message"))
        .child(view().flex_1().p(px(16.0)).child(text(format!("The body of message {id}."))))
}

#[component]
pub fn App() -> impl IntoElement {
    let routes = signal(vec![Route::Inbox]);
    nav_stack().flex_1().child(each(
        move || routes.get(),
        |route: &Route| format!("{route:?}"),
        move |route, index| {
            let page = match route.get_untracked() {
                Route::Inbox => inbox(routes),
                Route::Message(id) => message(routes, id),
            };
            // The user went back natively: drop the route (and those above it).
            page.on_dismiss(move || routes.update(|r| r.truncate(index.get_untracked())))
        },
    ))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "inbox" } | { name: "message"; id: number };

const nav = createNavStack<Route>([{ name: "inbox" }]);

// The page's header on the desktops and the web; iOS and Android show the system's, from `title`.
function Header(props: { title: string }) {
  return (
    <View class="h-12 flex-row items-center gap-3 border-b border-gray-200 px-4">
      <If when={nav.routes().length > 1}>
        <Text role="button" onPress={() => nav.pop()} class="text-blue-600 active:opacity-60">
          Back
        </Text>
      </If>
      <Text style={{ fontSize: 17, fontWeight: "600" }}>{props.title}</Text>
    </View>
  );
}

function Inbox() {
  return (
    <NavPage title="Inbox" header={<Header title="Inbox" />}>
      <Scroll style={{ flex: 1 }}>
        <Each of={[1, 2, 3, 4, 5]}>
          {(id) => (
            <View onPress={() => nav.push({ name: "message", id: id() })} class="p-4 active:bg-gray-100">
              <Text>Message {id()}</Text>
            </View>
          )}
        </Each>
      </Scroll>
    </NavPage>
  );
}

function Message(props: { id: number }) {
  return (
    <NavPage title={`Message ${props.id}`} header={<Header title={`Message ${props.id}`} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The body of message {props.id}.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => {
        switch (route.name) {
          case "inbox":
            return <Inbox />;
          case "message":
            return <Message id={route.id} />;
        }
      }}
    </NavStack>
  );
}

mount(App);
```

<a id="the-stacks-state"></a>

## 스택의 상태

Rust에서 라우트는 직접 만드는 시그널(`signal(vec![..])`, 앱 전체에서 접근하는 시그널이면 `global::<Routes>()`)이며, 이를 업데이트하여 push, pop, replace를 수행합니다: `routes.update(|r| r.push(route))`, `r.pop()`, `r.truncate(1)`, `routes.set(..)`. 각 페이지의 키(여기서는 라우트의 `Debug` 텍스트)는 스택이 어떤 페이지가 어떤 것인지 구분하게 하므로, 라우트가 그대로 남아 있는 페이지는 상태를 유지합니다. 반복될 수 있는 라우트에는 고유한 키를 지정하세요. 각 페이지의 `on_dismiss` 이벤트를 처리하세요. 사용자가 네이티브 방식으로 뒤로 간 것이며, 해당 라우트(와 그 위의 라우트)가 시그널에서 제거됩니다.

TSX에서는 `createNavStack(routes)`로 라우트 배열(아래에서 위 순서)에서 스택의 상태를 만듭니다. 라우트는 원하는 어떤 값이든 될 수 있으며(문자열, 객체, 위와 같은 discriminated union), 같은 라우트를 두 번 push한 경우를 포함해 push할 때마다 별도의 페이지가 됩니다. 상태는 모듈 수준이나 루트 컴포넌트에서 한 번만 만들고, 페이지가 이동하는 곳 어디서든 import하세요.

| 멤버 | 설명 |
|---|---|
| `routes()` | 라우트(아래에서 위 순서, 반응형). |
| `push(route)` | 페이지를 push합니다. |
| `pop(count?)` | `count`개의 페이지를 pop합니다(기본값 1). 최소 한 페이지는 남습니다. |
| `popToRoot()` | 첫 번째 페이지까지 pop합니다. |
| `replace(route)` | 맨 위 페이지를 교체합니다. |
| `setRoutes(routes)` | 페이지 전체를 교체합니다(예: 로그인 후). 남아 있는 라우트(같은 값)는 페이지와 상태를 유지합니다. |
| `remove(route)` | 위치와 관계없이 `route`에 해당하는 가장 위의 페이지를 제거합니다. |

처음부터 여러 페이지 깊이로 시작하려면 라우트를 더 전달하세요: `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`.

사용자가 네이티브 방식으로 페이지를 떠나면(헤더의 뒤로 가기 버튼, iOS의 스와이프 뒤로 가기, Android의 뒤로 가기 버튼 또는 제스처, 데스크톱의 뒤로 가기 키와 마우스 버튼, 브라우저의 뒤로 가기 버튼), TSX 스택이 해당 라우트를 상태에서 대신 제거하므로 `routes()`는 항상 화면에 보이는 내용과 일치합니다. Rust 페이지는 위에서 설명한 대로 `on_dismiss`로 이를 알립니다.

라우트는 페이지에 필요한 것을 담습니다. 갤러리 앱은 페이지를 구성하는 데 필요한 것을 담은 라우트를 push하며, 이렇게 하면 페이지가 많아도 라우트 타입이 작게 유지됩니다:

```rust tabs
use std::rc::Rc;

use nsh_core::prelude::*;

/// A pushed page: its key (unique in the stack) and what makes it.
#[derive(Clone)]
pub struct Route {
    pub key: SharedString,
    pub page: Rc<dyn Fn() -> Screen>,
}

impl PartialEq for Route {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key
    }
}

/// The pushed pages, bottom to top: one signal for the whole app.
#[derive(Default, Clone)]
pub struct Routes(pub Vec<Route>);

pub fn routes() -> Signal<Routes> {
    global::<Routes>()
}

// Elsewhere: routes().update(|r| r.0.push(Route { key: "settings".into(), page: Rc::new(settings) }));
```

```ts tabs
import { type JSX } from "nsh";
import { createNavStack } from "nsh/base";

export type Route = { name: "home" } | { name: "page"; page: () => JSX.Element };
export const nav = createNavStack<Route>([{ name: "home" }]);

// Elsewhere: nav.push({ name: "page", page: Settings });
```

## NavStack

Rust에서 `nav_stack()`은 자식이 페이지(아래에서 위 순서)인 뷰이며, 다른 뷰처럼 스타일을 지정할 수 있습니다(`.flex_1()`). TSX에서는 다음과 같습니다:

| 속성 | 타입 | 설명 |
|---|---|---|
| `state` | `NavStackState<R>` | 표시할 라우트. |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | 라우트를 렌더링합니다. 헤더를 지정하려면 `<NavPage>` 요소를 반환하세요. |
| `style`, `class` | | 스택 자체의 스타일(보통 `flex: 1`). |

렌더 함수는 라우트가 push될 때 라우트당 한 번 실행됩니다. `route`에는 일반 값이, `index()`에는 현재 위치가 전달됩니다. 함수가 반환한 것이 페이지의 콘텐츠가 됩니다. 헤더를 설정하려면 `<NavPage>` 요소를 반환하세요. 그 외의 값은 기본 옵션의 페이지로 감싸집니다.

라우트가 스택에 있는 동안 페이지는 마운트된 상태를 유지합니다. 뒤로 가면 이전 페이지가 스크롤 위치, 입력값, 시그널을 포함해 떠났을 때 그대로 표시됩니다. 페이지의 [`cleanup`](./reactivity.md) 핸들러는 해당 라우트가 스택을 떠날 때 실행됩니다.

<a id="navpage-and-the-header"></a>

## NavPage와 헤더

페이지(Rust에서는 `nav_page()`, TSX에서는 `NavPage`)는 페이지의 콘텐츠를 감싸고 헤더를 담습니다. iOS와 Android는 제목과 헤더 옵션으로 설정한 시스템 헤더를 표시합니다. 데스크톱과 웹은 페이지의 헤더 슬롯(`.header(..)`, TSX에서는 `header`), 즉 앱이 직접 만든 뷰를 페이지 상단에 표시합니다. 너비는 페이지 전체이고 높이는 레이아웃에 따라 결정되며, 콘텐츠는 그 아래에 놓입니다. 위 예시처럼 페이지에 둘 다 지정하면 모든 플랫폼에서 자연스럽게 보입니다. 모든 옵션은 반응형입니다. 시그널을 바꾸면 헤더도 따라갑니다.

Rust에서 아래의 각 prop은 `nav_page()`의 snake case 메서드입니다: `.title(..)`, `.header(..)`, `.header_visible(..)`, `.header_transparent(..)`, `.header_style_with(..)`, `.header_style(..)`, `.header_back_visible(..)`, `.header_left(..)`, `.header_right(..)`, `.header_title(..)`, `.header_large_title(..)`, `.header_back_title(..)`, `.animation(ScreenAnimation::Fade)`, `.status_bar(..)`, `.pop_on_swipe(..)`, `.pop_on_back(..)`, `.on_back_press(..)`, `.on_dismiss(..)`. 자식은 페이지의 콘텐츠입니다.

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `header` | `JSX.Element` | | 데스크톱과 웹: 앱이 그리는 페이지의 헤더(제목, 뒤로 가기 버튼, 툴바 버튼). |
| `title` | `string` | | iOS와 Android: 시스템 헤더의 제목. |
| `headerVisible` | `boolean` | `true` | iOS와 Android: 시스템 헤더를 표시합니다. |
| `headerTransparent` | `boolean` | `false` | iOS와 Android: 콘텐츠가 헤더 아래까지 확장됩니다. |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS와 Android: 헤더의 배경, 제목의 색(`color`), 버튼의 색(`tintColor`). |
| `headerClass` | `string` | | classes와 동일합니다: `bg-*`, 제목에는 `text-*`, 버튼에는 `tint-*`. 이들보다 우선하는 것은 `headerStyle`입니다. |
| `headerBackVisible` | `boolean` | `true` | iOS와 Android: 뒤로 가기 버튼을 표시합니다. |
| `headerLeft` | `JSX.Element` | | iOS와 Android: 헤더 시작 부분의 뷰(뒤로 가기 버튼을 대체합니다). |
| `headerRight` | `JSX.Element` | | iOS와 Android: 헤더 끝 부분의 뷰. |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS: 헤더 끝에 표시되는 UIKit 고유의 바 버튼으로, 시스템 고유의 모양과 심볼 또는 레이블을 가지며 `headerRight`의 뷰를 대체합니다. 이 버튼을 누르면 `headerRight`의 첫 번째 pressable 뷰를 누른 것으로 처리되므로 그곳에 하나를 두세요. Android에서는 `headerRight` 항목을 그대로 표시합니다. |
| `ios={{ headerLeftSystemItem }}` | 동일: `headerRightSystemItem` | | iOS: 위와 같지만 헤더의 시작 부분에 표시되며, 눌렀을 때 대상은 `headerLeft`입니다. |
| `ios={{ headerRightSymbol }}` | `string` | | iOS: 해당 이름(`"slider.horizontal.3"`)의 SF Symbol을 표시하는 UIKit 고유의 바 버튼으로, `headerRight`의 뷰를 대체합니다. 이 버튼을 누르면 `headerRight`의 첫 번째 pressable 뷰를 누른 것으로 처리되며, VoiceOver는 해당 뷰의 레이블을 읽습니다. 이보다 우선하는 것은 `headerRightSystemItem`입니다. SF Symbols에 없는 이름이면 `headerRight` 항목을 그대로 표시합니다. Android에서는 `headerRight` 항목을 그대로 표시합니다. |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS: 위와 같지만 헤더의 시작 부분에 표시되며, 눌렀을 때 대상은 `headerLeft`입니다. |
| `headerTitle` | `JSX.Element` | | iOS와 Android: 제목을 대체하는 뷰. |
| `headerLargeTitle` | `boolean` | `false` | iOS: 콘텐츠를 스크롤하면 바 안으로 줄어드는 큰 제목. |
| `headerBackTitle` | `string` | | 이 페이지로 돌아오게 하는 뒤로 가기 버튼의 레이블입니다(iOS. Android에서는 위로 가기 화살표가 스크린 리더에 이를 알려 줍니다). |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | 페이지가 들어오고 나가는 방식. |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS와 Android: 페이지가 맨 위에 있는 동안의 상태 표시줄([상태 표시줄](../modules/nsh-base.md#status-bar)). |
| `popOnSwipe` | `boolean` | `true` | 인터랙티브 뒤로 가기 제스처(iOS 스와이프 뒤로 가기, Android predictive back)로 페이지가 pop됩니다. 뒤로 가기 버튼은 어느 경우든 pop합니다. |
| `popOnBack` | `boolean` | `true` | 뒤로 가는 모든 방법으로 페이지가 pop됩니다: 뒤로 가기 버튼, Android의 뒤로 가기, 데스크톱의 뒤로 가기 키, 브라우저의 뒤로 가기 버튼, 스와이프. |
| `onBackPress` | `() => void` | | 사용자가 페이지에서 뒤로 가기를 눌렀음을 알립니다. pop 허용 여부(`popOnBack`)와 관계없이 발생합니다. |
| `onDismiss` | `() => void` | | 사용자가 페이지를 pop했습니다. 해당 라우트는 이미 제거된 상태입니다. |
| `style`, `class` | | | 페이지의 콘텐츠 뷰. |

헤더 항목은 일반 뷰이므로 pressable하게 만들 수 있고 반응형으로 동작합니다:

```rust tabs
fn compose(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let cancel = move || {
        text("Cancel")
            .on_press(move || routes.update(|r| { r.pop(); }))
            .text_size(px(17.0))
            .text_color(rgb(0x0969da))
    };
    let send_button = move || {
        text("Send")
            .on_press(move || send(draft.get()))
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(move || if draft.with(String::is_empty) { rgb(0x8c959f) } else { rgb(0x0969da) })
    };
    nav_page()
        .title("New message")
        .header_left(cancel())
        .header_right(send_button())
        .header(
            view()
                .h(px(48.0))
                .flex_row()
                .items_center()
                .justify_between()
                .px_4()
                .child(cancel())
                .child(text("New message").text_size(px(17.0)).font_weight(FontWeight::SEMIBOLD))
                .child(send_button()),
        )
        .child(
            input()
                .multiline(true)
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .flex_1()
                .p(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
function Compose() {
  const text = signal("");
  const cancel = () => (
    <Text onPress={() => nav.pop()} style={{ fontSize: 17, color: "#0969da" }}>
      Cancel
    </Text>
  );
  const sendButton = () => (
    <Text
      onPress={() => send(text())}
      style={{ fontSize: 17, fontWeight: "600", color: text() ? "#0969da" : "#8c959f" }}
    >
      Send
    </Text>
  );
  return (
    <NavPage
      title="New message"
      headerLeft={cancel()}
      headerRight={sendButton()}
      header={
        <View class="h-12 flex-row items-center justify-between px-4">
          {cancel()}
          <Text style={{ fontSize: 17, fontWeight: "600" }}>New message</Text>
          {sendButton()}
        </View>
      }
    >
      <Input multiline value={text()} onChange={({ value }) => text.set(value)} style={{ flex: 1, padding: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

색을 입힌 시스템 헤더입니다. Rust에서는 `header_style_with`에 타입이 지정된 스타일을 전달합니다: `bg`, `text_color`, 그리고 헤더 버튼의 색인 `tint_color`. 테마 색은 외관을 따릅니다.

```rust tabs
nav_page()
    .title("Profile")
    .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(rgb(0xffffff)).tint_color(rgb(0xffffff)))
```

```tsx tabs
<NavPage title="Profile" headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}>
  …
</NavPage>
```

헤더를 표시하지 않는 페이지에도 주변에는 시스템 바가 있습니다. 콘텐츠에는 [안전 영역](../elements/safe-area.md) inset만큼 패딩을 주세요:

```rust tabs
use nsh_base::nav_page;

nav_page()
    .header_visible(false)
    .child(view().flex_1().p_safe_area() /* … */)
```

```tsx tabs
<NavPage headerVisible={false}>
  <View class="flex-1 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+16px)] px-4">…</View>
</NavPage>
```

<a id="safe-areas-under-the-header"></a>

### 헤더 아래의 안전 영역

페이지 안에서 `env(safe-area-inset-*)` 변수와 페이지의 inset(Rust에서는 `Scope::insets`, TSX에서는 `safeAreaInsets()`)은 페이지 내부에서 시스템 헤더 아래 영역을 기준으로 합니다. 투명한 헤더에서는 콘텐츠가 페이지 맨 위에서 시작하고 상단 inset이 헤더의 높이가 되므로, `env(safe-area-inset-top)`만큼 패딩을 주면 배경 이미지가 페이지 전체를 채우는 동안에도 텍스트가 헤더와 겹치지 않습니다. 큰 제목을 사용할 때는 스크롤할 때 제목이 접히도록 스크롤 뷰를 페이지 안에 바로 두세요. 데스크톱과 웹에서는 콘텐츠가 페이지의 헤더 슬롯 아래에서 시작합니다.

<a id="keeping-the-user-on-a-page-poponback"></a>

## 사용자를 페이지에 머무르게 하기: popOnBack

저장하지 않은 변경 사항을 버리기 전에 확인하려면, 잃을 것이 있는 동안 `pop_on_back`(TSX에서는 `popOnBack`) 값을 false로 설정하고, 뒤로 가기 누름(`.on_back_press(..)`, TSX에서는 `onBackPress`)을 처리한 뒤, 사용자가 동의하면 pop하세요:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<Route>>) -> Screen {
    let draft = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| { r.pop(); });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || draft.with(String::is_empty))
        .on_back_press(move || {
            if !draft.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(move || draft.get())
                .on_change(move |t: &str| draft.set(t.to_owned()))
                .placeholder("A note")
                .m(px(16.0))
                .text_size(px(17.0)),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
  const dirty = () => text().length > 0;
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
    <NavPage title="Edit" popOnBack={!dirty()} onBackPress={() => dirty() && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" style={{ margin: 16, fontSize: 17 }} />
    </NavPage>
  );
}
```

`pop_on_back(false)`(`popOnBack={false}`) 설정 시 페이지는 모든 뒤로 가기 방법(뒤로 가기 버튼, Android의 뒤로 가기 버튼과 제스처, 데스크톱의 뒤로 가기 키, 브라우저의 뒤로 가기 버튼, 스와이프)에서 그대로 남으며, 뒤로 가기 누름 이벤트로 사용자가 시도했음을 알 수 있습니다. 코드에서 pop하는 것(라우트 제거, `nav.pop()`)은 평소처럼 pop됩니다.

> [!IMPORTANT]
> pop 허용 여부는 true나 false를 반환하는 콜백이 아니라 prop(`pop_on_back` / `popOnBack`)으로 지정합니다. 메인 스레드는 앱 코드를 기다리지 않기 때문입니다. 사용자가 스와이프를 시작하거나 뒤로 가기를 누르면 시스템이 즉시 페이지가 떠나도 되는지 묻고, NSH는 이미 가지고 있는 prop으로 네이티브에서 바로 답합니다. 잃을 것이 생기는 즉시(위 예시처럼 텍스트가 입력되는 시점에), 사용자가 떠나려 하기 전에 설정하세요.

더 가벼운 옵션으로 `pop_on_swipe(false)`(`popOnSwipe={false}`)이 있습니다. 인터랙티브 제스처(iOS 스와이프 뒤로 가기, Android의 predictive back 애니메이션)만 끄며, 뒤로 가기 버튼은 계속 pop합니다.

<a id="dialogs"></a>

## 다이얼로그

다이얼로그(Rust에서는 `nsh_base`의 `dialog()`, TSX에서는 `Dialog`)는 자체 네이티브 윈도우 레이어에서 다른 모든 것 위에 콘텐츠를 표시합니다. iOS에서는 presented view controller, Android에서는 dialog window, 데스크톱과 웹에서는 전체 윈도우 위의 레이어입니다. 모양은 직접 정합니다. Rust에서는 다이얼로그가 뷰 안(`when` 내부)에 있는 동안 표시되며, 자식이 다이얼로그를 채웁니다. 백드롭과 팝업을 뷰로 그리세요. TSX에서는 `class`, `style`로 자식을 담는 팝업의 스타일을 지정하고, `backdropClass` 또는 `backdropStyle`로 그 뒤에 백드롭을 추가하며, `open`로 제어합니다:

```rust tabs
use nsh_base::dialog;
use nsh_core::prelude::*;

pub fn files() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .child(view().on_press(move || open.set(true)).p(px(16.0)).child(text("Delete the file")))
        .child(when(
            move || open.get(),
            move || {
                dialog()
                    .animation(ModalAnimation::Fade)
                    // Escape, Android's back button, a swipe down on a sheet.
                    .on_cancel(move || open.set(false))
                    .child(
                        // The backdrop and the popup are the app's views.
                        view()
                            .flex_1()
                            .bg(rgba(0x00000066))
                            .items_center()
                            .justify_center()
                            .on_press(move || open.set(false))
                            .child(
                                view()
                                    .w(px(320.0))
                                    .gap_3()
                                    .rounded_2xl()
                                    .bg(white())
                                    .p_5()
                                    .on_press(|| {})
                                    .child(text("Delete the file?").text_size(px(20.0)).font_weight(FontWeight::BOLD))
                                    .child(
                                        view()
                                            .on_press(move || open.set(false))
                                            .child(text("Delete").text_color(rgb(0xcf222e))),
                                    ),
                            ),
                    )
            },
        ))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Dialog } from "nsh/base";

function Files() {
  const open = signal(false);
  return (
    <View style={{ flex: 1 }}>
      <View onPress={() => open.set(true)} style={{ padding: 16 }}>
        <Text>Delete the file</Text>
      </View>
      <Dialog
        open={open()}
        animation="fade"
        onOpenChange={(e) => open.set(e.open)}
        backdropClass="bg-black/40"
        class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
      >
        <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete the file?</Text>
        <View onPress={() => open.set(false)}>
          <Text style={{ color: "#cf222e" }}>Delete</Text>
        </View>
      </Dialog>
    </View>
  );
}
```

Escape, Android의 뒤로 가기 버튼, 백드롭 누르기(TSX의 백드롭, Rust에서는 네이티브 시트의 백드롭), 시트를 아래로 스와이프하는 동작은 네이티브에서 다이얼로그를 닫습니다(`close_on_escape`, `close_on_backdrop_press`, `close_on_swipe`. TSX에서는 `closeOnEscape`, `closeOnBackdropPress`, `closeOnSwipe`. 기본값은 모두 true). Rust에서는 모든 시도를 `on_cancel`로, 닫힘을 `on_close`로 알려 주므로 거기서는 뷰에서 다이얼로그를 제거하세요. 앱이 그리는 백드롭은 위와 같이 자체 press 핸들러로 닫습니다. TSX에서는 `onOpenChange({ open: false, reason })`로 알 수 있으므로 거기서는 `open` prop을 `false` 값으로 설정하세요. 먼저 확인하려면 플래그를 false로 설정하고 취소 이벤트(`on_cancel`, `onCancel`)를 처리한 뒤(모든 시도를 알립니다), 다이얼로그를 직접 닫으세요. iOS에서는 `.presentation(ModalPresentation::PageSheet)` 또는 `FormSheet`(`presentation="pageSheet"` 또는 `"formSheet"`)을 설정하면 뒤쪽이 계속 보이는 시트가 표시됩니다.

모든 prop은 [Dialog](../elements/dialog.md)를 참고하세요. 다이얼로그 안에서 `env(safe-area-inset-*)` 변수와 inset은 다이얼로그 자체의 것입니다. 시스템 다이얼로그(액션이 있는 알림, 액션 시트)에는 `nsh_base`(TSX: `nsh/base`)의 [`AlertDialog`](../modules/nsh-base.md#alertdialog)을 사용하세요.

<a id="the-android-back-button"></a>

## Android 뒤로 가기 버튼

Android에서 뒤로 가기 버튼(또는 제스처)은 다음 순서로 처리됩니다:

1. 최상단 다이얼로그: 취소를 알리고(`on_cancel`, `onCancel`), `close_on_escape` / `closeOnEscape` 값이 true인 동안(기본값) 닫힙니다.
2. 앱의 뒤로 가기 리스너(Rust에서는 `on_back_press`, TSX에서는 `nsh/mobile`의 `BackHandler`). 가장 최근에 추가된 것부터 처리됩니다.
3. 최상단 스택: 맨 위 페이지가 뒤로 가기 누름을 알리고, `pop_on_back` / `popOnBack` 값이 true인 동안 pop됩니다.
4. 아무도 처리하지 않으면 앱이 종료됩니다.

리스너가 누름을 처리했으면 `true` 값을 반환하며, 이로써 스택이 pop되지 않습니다. 리스너가 등록되어 있는 동안 Android의 뒤로 가기 제스처는 pop 미리보기를 표시하지 않으므로(앱은 제스처가 끝난 뒤에야 응답합니다), 누름을 가로챌 수 있는 동안에만 리스너를 추가하세요:

```rust tabs
use nsh_core::prelude::*;

pub fn editor() -> impl IntoElement {
    let selecting = signal(false);
    // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
    effect(move || {
        if selecting.get() {
            on_back_press(move || {
                selecting.set(false);
                true
            });
        }
    });
    // …
    view()
}
```

```tsx tabs
import { effect, signal } from "nsh";
import { BackHandler } from "nsh/mobile";

function Editor() {
  const selecting = signal(false);
  // Listening only while selecting: otherwise the stack pops, with the gesture's preview.
  effect(() => {
    if (selecting()) {
      BackHandler.on("press", () => {
        selecting.set(false);
        return true;
      });
    }
  });
  // …
}
```

effect에서 만든 리스너는 effect가 다시 실행되거나 컴포넌트가 사라질 때까지 유지됩니다. TSX에서는 `BackHandler.on` 호출이 반환하는 함수로도 리스너를 중지할 수 있습니다. TSX에서 `BackHandler.exitApp()` 호출은 앱을 종료합니다. iOS에서도 `nsh/mobile` import가 가능하며, iOS에서 `BackHandler` 호출은 즉시 반환되므로 두 플랫폼에서 같은 코드가 실행됩니다. [플랫폼별 코드](./platform-specific.md)를 참고하세요.

<a id="tabs-and-other-layouts"></a>

## 탭과 기타 레이아웃

탭 바는 프리미티브로 직접 그리는 앱 자체의 UI입니다. pressable 뷰의 행과 선택된 탭을 담은 시그널로 구성하고, 선택된 탭의 콘텐츠는 [`when` / `<If>`](../elements/control-flow.md)로 렌더링하세요(TSX에서는 함수 자식도 가능). 전환 중에 각 탭의 상태를 유지하려면 탭마다 자체 스택과 라우트를 두고 모두 마운트된 채로 유지하면서, 비활성 탭은 `display: none`로 숨기세요.

<a id="related"></a>

## 관련 문서

- [`nsh/base`](../modules/nsh-base.md): `nav_stack`, `nav_page`, `dialog`, `createNavStack`, `NavStack`, `NavPage`, `Dialog` 레퍼런스. inset은 [안전 영역](../elements/safe-area.md)을 참고하세요.
- 페이지와 다이얼로그의 [상태 표시줄](../modules/nsh-base.md#status-bar).
- [`AlertDialog`](../modules/nsh-base.md#alertdialog).
- [`BackHandler`](../modules/nsh-mobile.md#backhandler): `BackHandler`.
