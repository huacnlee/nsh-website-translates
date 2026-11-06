---
title: "NavStack"
description: "原生導覽堆疊:NavStack、NavPage 及 createNavStack、推入與彈出頁面、標題列插槽、離開頁面,以及各平台如何顯示堆疊。"
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---


# NavStack

導航堆疊（navigation stack）每次顯示一個頁面，並保留其下方的頁面：在 iOS 和 Mac Catalyst 上是 `UINavigationController`，附系統標題列和滑動返回；在 Android 上是一疊附工具列並支援預測式返回的頁面。在桌面平台（macOS、Windows、Linux、GPUI）和網頁上，每個頁面在頂部顯示應用程式自己的標題列，返回鍵和瀏覽器的返回按鈕會彈出頁面。`NavStack` 是堆疊，`NavPage` 是其中一個頁面。

堆疊負責導覽行為（轉場、返回手勢和按鈕、頁面被覆蓋時的狀態）；頁面內容和桌面平台的標題列則由應用程式自行處理。

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

在 iOS 和 Android 上，頁面顯示附有 `title` 和返回按鈕的系統標題列；在桌面平台和網頁上，則顯示 `header`。只針對手機的應用程式不需要 `header`；只針對桌面平台的應用程式則不需要系統標題列的選項。[導航指南](../docs/navigation.md)會逐步講解整個應用程式的導航：堆疊的狀態、對話框、Android 返回按鈕和分頁。

<a id="how-a-stack-works"></a>

## 堆疊的運作方式

- 堆疊中的頁面是**路由（route）**：由你自行決定的值，順序由堆疊底部到頂部。路由通常會標明頁面並攜帶其參數。
- 在 TSX 中，路由存放於 `createNavStack` 建立的狀態中。`NavStack` 會為每次推入呼叫一次其子函式，並將結果顯示為一個頁面。只要其路由仍在堆疊中，它就會保留該頁面，因此頁面在被其他頁面覆蓋期間會保留其狀態（signal、捲動位置、輸入內容）。
- 在 Rust 中，堆疊的子元素就是其頁面：放入 `nav_stack()` 的 `nav_page()` 會被推入，被移除的則會被彈出。請將路由保存在 signal 中，並以 `each(..)` 按路由設定 key 來渲染頁面，這樣下方的頁面才會保留其狀態。
- 每次推入都是獨立的頁面，即使同一個路由值被推入兩次也是如此。
- 當用戶以原生方式離開頁面（返回按鈕、滑動返回、Android 返回、桌面平台的返回鍵、瀏覽器的返回）時，該頁面便會移除。在 TSX 中，堆疊會從狀態中移除其路由，因此 `nav.routes()` 一定與用戶所見相符。在 Rust 中，頁面會回報 `on_dismiss`，你需要在此處移除其路由（以及其上方的路由）。
- 在 TSX 中，若子函式回傳的不是 `<NavPage>`，該頁面會使用預設選項。回傳 `<NavPage>` 即可設定其標題列和其他選項。

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

建立一個堆疊的狀態，初始路由為 `routes`（由底部到頂部）。只需建立一次，例如在模組層級，然後傳給 `<NavStack state>`。任何程式碼都可以匯入它來進行導航。

| 成員 | 說明 |
|---|---|
| `routes: Accessor<readonly R[]>` | 路由，由底部到頂部。具反應性。 |
| `push(route: R): void` | 推入一個頁面。 |
| `pop(count?: number): void` | 彈出 `count` 個頁面（預設為 1）。至少會保留一個頁面。 |
| `popToRoot(): void` | 彈出至第一個頁面。 |
| `replace(route: R): void` | 取代頂部頁面。 |
| `setRoutes(routes: R[]): void` | 取代各頁面；保留下來的路由（相同的值）會保留其頁面和狀態。 |
| `remove(route: R): void` | 移除 `route` 中最上層的頁面（以 `===` 比較），不論它在堆疊中的哪個位置。 |

在 Rust 中，相同的操作就是修改你的路由 signal：`routes.update(|r| r.push(route))` 推入，`r.pop()` 彈出，`r.truncate(1)` 彈出至其中保留的第一個頁面，`routes.set(..)` 則取代各頁面。

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

## NavStack 屬性

| 屬性 | Rust | 類型 | 說明 |
|---|---|---|---|
| `state` | 頁面即其子元素 | `NavStackState<R>` | 存放路由的狀態（`createNavStack`）。必填。 |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | 渲染一個路由。回傳 `<NavPage>` 以設定其選項。必填。 |
| `style`、`class` | 樣式方法 | | 堆疊的樣式；通常為 `flex: 1`。 |
| `testID` | `.test_id(..)` | `string` | 在測試和 `nsh test --trace` 中尋找該堆疊。 |

TSX 的子函式會接收路由值本身，以及其在堆疊中位置的 accessor。

<a id="navpage-props"></a>

## NavPage 屬性

`NavPage` 是堆疊中的一個頁面。它包含頁面的內容、在桌面平台和網頁上的 `header`，以及 iOS 和 Android 上系統標題列的選項。在 Rust 中，`nav_page()` 回傳該頁面，其 builder 方法就是各屬性的 snake-case 名稱。

| 屬性 | Rust | 類型 | 預設值 | 說明 |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | 無 | 桌面平台和網頁：頁面的標題列，置於頁面頂部，寬度與頁面相同，高度按其佈局而定，內容在其下方。 |
| `title` | `.title(..)` | `string` | 無 | iOS 和 Android：系統標題列的標題。 |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS 和 Android：是否顯示系統標題列。 |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS 和 Android：內容延伸至透明的系統標題列下方。 |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS：此頁面位於頂部時，系統分頁列會隨轉場移出，動畫與頁面相同，分頁列不會被重建；頁面彈出時它會回來。 |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS：大標題會隨內容捲動而縮入列中；內容會在標題列下方捲動。 |
| `headerBackTitle` | `.header_back_title(..)` | `string` | 無 | iOS 和 Android：返回此頁面的返回按鈕的標籤（在 Android 上則是供螢幕閱讀器使用的說明）。 |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS 和 Android：是否顯示返回按鈕。 |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | 無 | iOS 和 Android：系統標題列前端的內容，取代返回按鈕。 |
| `headerRight` | `.header_right(..)` | `JSX.Element` | 無 | iOS 和 Android：系統標題列後端的內容。 |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | 無 | iOS 和 Android：取代標題的內容。 |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | 平台預設 | iOS 和 Android：系統標題列的顏色：其背景、標題（`color`）和按鈕（`tintColor`）。 |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | 無 | 以 class 表示的相同顏色：`bg-*`，標題用 `text-*`，按鈕用 `tint-*`（在 Rust 中為 `.bg(..)`、`.text_color(..)`、`.tint_color(..)`，主題顏色會跟隨外觀）。`headerStyle` 的優先級高於它們。 |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | 返回按鈕和滑動返回會彈出頁面。見[離開頁面](#leaving-a-page)。 |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | 互動式返回手勢會彈出頁面：iOS 的滑動返回、跟隨手指的 Android 預測式返回。無論如何，返回按鈕都會彈出頁面。 |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | 頁面進入和離開的方式。 |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | 無 | 頁面透過 WGSL shader 進入和離開，取代其 `animation`：當 `nsh.progress` 在 `duration` 毫秒內（預設 350）由 0 運行至 1 時，`shade(uv)` 會將下方頁面讀作 `sample_from`，將此頁面讀作 `sample_to`；頁面離開時則由 1 回到 0。當系統要求減少動態效果時，頁面會改用其自身的 `animation`。見 [Shader](./shader.md)。 |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | 無 | iOS 和 Android：頁面位於頂部時的狀態列。見 [Status bar](../modules/nsh-base.md#status-bar)。 |
| `style`、`class` | 樣式方法 | | 無 | 頁面的樣式。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容。 |
| `testID` | `.test_id(..)` | `string` | 無 | 在測試和 `nsh test --trace` 中尋找該頁面。 |

<a id="navpage-events"></a>

## NavPage 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | 用戶在頁面上按下返回（標題列的返回按鈕、Android 返回、桌面平台的 Escape、Alt+Left 或滑鼠的返回按鈕、瀏覽器的返回），不論 `popOnBack` 是否允許彈出。 |
| `onDismiss` | `.on_dismiss(..)` | 用戶彈出了頁面（返回按鈕、滑動）；在 TSX 中其路由已被移除，在 Rust 中則於此處移除。 |

<a id="header-slots"></a>

## 標題列插槽

`header`、`headerLeft`、`headerRight` 和 `headerTitle` 是插槽（slot）：即一般元素，可讀取 signal、處理按下事件，並在頁面顯示期間更新。`header` 是桌面平台和網頁上應用程式的整個標題列；其餘三個則放入 iOS 和 Android 的系統標題列。

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

頁面內容從標題列下方開始：在 iOS 和 Android 上位於不透明的系統標題列下方，在桌面平台和網頁上則位於 `header` 下方。使用 `headerTransparent`、`headerLargeTitle` 或 `headerVisible={false}` 時，內容在 iOS 和 Android 上會從頁面頂部開始；請使用 [`env(safe-area-inset-top)`](./safe-area.md) 或 `safeAreaInsets()`，讓內容避開標題列和狀態列。

在 iOS 上，當 `popOnSwipe` 和 `popOnBack` 為 true 時，`headerVisible={false}` 會讓滑動返回保持啟用。一旦接受互動式返回手勢，編輯狀態會在轉場開始時結束，因此鍵盤會在拖動期間收起。取消轉場時，若沒有其他控制項取得焦點，則會還原同一個編輯器的焦點。

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

## 離開頁面

`popOnBack={false}` 可讓用戶留在頁面上，例如表單有未儲存的更改時。當它為 false 時，滑動返回會停用，返回按鈕和返回鍵會呼叫 `onBackPress` 但不會彈出頁面。請先詢問用戶，然後自行彈出：

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
> 系統會在用戶操作的一刻於主執行緒詢問用戶是否可以返回，而主執行緒絕不會等待 JS 或你的 Rust 程式碼。因此 NSH 會根據已掛載的 `popOnBack` 值作答。請在有內容可能遺失時盡早設定 `popOnBack={false}`，不要等到用戶返回之後。

`onBackPress` 在每次按下返回時都會被呼叫，頁面彈出時也一樣，因此它同時能告訴你用戶已經返回。若只想停用滑動手勢而保留返回按鈕，請使用 `popOnSwipe={false}`。確認本身則使用 [AlertDialog](./alert-dialog.md)。

<a id="platform-notes"></a>

## 平台說明

- **iOS**：`UINavigationController`，附系統標題列、返回按鈕和滑動返回；`headerLargeTitle` 是 UIKit 的大標題。在轉場進行期間收到的堆疊變更，會在轉場結束時套用。
- **Android**：附工具列的堆疊。系統返回按鈕會彈出頂部頁面，在支援的 Android 版本上採用預測式返回；向上箭嘴供螢幕閱讀器使用的說明是下一層頁面的 `headerBackTitle`，否則使用系統預設。若要自行處理返回按鈕，請參閱 [`BackHandler`](../modules/nsh-mobile.md#backhandler) 中的 `BackHandler`。
- **Mac Catalyst**：與 iOS 相同。
- **桌面平台（macOS、Windows、Linux、GPUI）和網頁**：每個頁面在頂部顯示其 `header`，內容在其下方。在桌面平台上，Escape、Alt+Left 和滑鼠的返回按鈕可返回上一頁；在網頁上則使用瀏覽器的返回按鈕。

若要在堆疊及其標題列之上顯示內容，例如 sheet 或全螢幕流程，請使用 [Dialog](./dialog.md)。
