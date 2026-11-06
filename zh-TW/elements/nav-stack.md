---
title: "NavStack"
description: "原生導覽堆疊:NavStack、NavPage 與 createNavStack、推入與彈出頁面、標題列插槽、離開頁面,以及各平台如何呈現堆疊。"
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---

# NavStack

導覽堆疊（navigation stack）一次顯示一個頁面，並保留其下方的頁面：在 iOS 與 Mac Catalyst 上為 `UINavigationController`，具備系統標頭與滑動返回；在 Android 上則是帶有工具列與預測式返回（predictive back）的頁面堆疊。在桌面平台（macOS、Windows、Linux、GPUI）與網頁上，每個頁面會在頂部顯示應用程式自己的標頭，返回鍵與瀏覽器的返回按鈕則會彈出頁面。`NavStack` 是堆疊，`NavPage` 是其中的一個頁面。

堆疊負責導覽行為（轉場、返回手勢與按鈕、頁面被覆蓋時的狀態）；頁面內容與桌面標頭則由應用程式自行處理。

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

在 iOS 與 Android 上，頁面會顯示帶有 `title` 與返回按鈕的系統標頭；在桌面平台與網頁上則顯示 `header`。只針對手機的應用程式可省略 `header`；只針對桌面平台的應用程式則可省略系統標頭的選項。[導覽指南](../docs/navigation.md)會完整介紹應用程式的導覽：堆疊的狀態、對話框、Android 返回按鈕與分頁。

<a id="how-a-stack-works"></a>

## 堆疊的運作方式

- 堆疊中的頁面是**路由（route）**：由你自行選擇的值，從堆疊底部排到頂部。路由通常會指明頁面並攜帶其參數。
- 在 TSX 中，路由存放於 `createNavStack` 建立的狀態中。`NavStack` 會針對每次 push 呼叫一次其子函式，並將結果顯示為頁面。只要其路由仍在堆疊中，就會保留該頁面，因此頁面在被其他頁面覆蓋時會保有自己的狀態（signal、捲動位置、輸入內容）。
- 在 Rust 中，堆疊的子元素就是它的頁面：放入 `nav_stack()` 的 `nav_page()` 會被 push，被移除的則會被 pop。請將路由保存在 signal 中，並使用 `each(..)` 依路由作為 key 來渲染頁面，這樣下方的頁面才能保有狀態。
- 每次 push 都是獨立的頁面，即使同一個路由值被 push 兩次也一樣。
- 當使用者以原生方式離開頁面時（返回按鈕、滑動返回、Android 返回、桌面平台的返回鍵、瀏覽器的返回），該頁面就會消失。在 TSX 中，堆疊會從狀態中移除其路由，因此 `nav.routes()` 始終與使用者所見一致。在 Rust 中，頁面會回報 `on_dismiss`，你可在此處移除其路由（以及其上方的路由）。
- 在 TSX 中，若子函式回傳的不是 `<NavPage>`，則該頁面會使用預設選項。回傳 `<NavPage>` 即可設定其標頭與其他選項。

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

建立一個以 `routes`（由底部到頂部）開始的堆疊狀態。請只建立一次，例如在模組層級，並將其傳給 `<NavStack state>`。任何程式碼都可以匯入它來進行導覽。

| 成員 | 說明 |
|---|---|
| `routes: Accessor<readonly R[]>` | 路由，由底部到頂部。具反應性。 |
| `push(route: R): void` | Push 一個頁面。 |
| `pop(count?: number): void` | Pop `count` 個頁面（預設為 1）。始終至少會保留一個頁面。 |
| `popToRoot(): void` | Pop 回到第一個頁面。 |
| `replace(route: R): void` | 取代頂部頁面。 |
| `setRoutes(routes: R[]): void` | 取代這些頁面；保留下來的路由（相同的值）會保有其頁面與狀態。 |
| `remove(route: R): void` | 移除 `route` 中最上方的頁面（以 `===` 比較），無論它位於堆疊中的哪個位置。 |

在 Rust 中，相同的操作就是對你的路由 signal 進行修改：`routes.update(|r| r.push(route))` 為 push，`r.pop()` 為 pop，`r.truncate(1)` 為 pop 回到其中保留的第一個頁面，`routes.set(..)` 則是取代這些頁面。

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

| 屬性 | Rust | 型別 | 說明 |
|---|---|---|---|
| `state` | 頁面即為其子元素 | `NavStackState<R>` | 保存路由的狀態（`createNavStack`）。必填。 |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | 渲染一個路由。回傳 `<NavPage>` 以設定其選項。必填。 |
| `style`、`class` | 樣式方法 | | 堆疊的樣式；通常為 `flex: 1`。 |
| `testID` | `.test_id(..)` | `string` | 在測試與 `nsh test --trace` 中尋找該堆疊。 |

TSX 的子函式會接收路由值本身，以及一個表示其在堆疊中位置的 accessor。

<a id="navpage-props"></a>

## NavPage 屬性

`NavPage` 是堆疊中的一個頁面。它包含頁面的內容、在桌面平台與網頁上的 `header`，以及 iOS 與 Android 上系統標頭的選項。在 Rust 中，`nav_page()` 會回傳該頁面，其 builder 方法即為屬性名稱的 snake_case 形式。

| 屬性 | Rust | 型別 | 預設值 | 說明 |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | 無 | 桌面平台與網頁：頁面的標頭，位於頁面頂部，寬度與頁面相同，高度依其排版而定，內容位於其下方。 |
| `title` | `.title(..)` | `string` | 無 | iOS 與 Android：系統標頭的標題。 |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS 與 Android：是否顯示系統標頭。 |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS 與 Android：內容延伸到透明的系統標頭之下。 |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS：此頁面位於頂部時，系統分頁列會離開，並在轉場中移動——與頁面使用相同的動畫，且分頁列不會被重建；頁面 pop 後它會回來。 |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS：大標題，會隨內容捲動而縮小進導覽列；內容會捲動到標頭之下。 |
| `headerBackTitle` | `.header_back_title(..)` | `string` | 無 | iOS 與 Android：返回到此頁面的返回按鈕標籤（在 Android 上則是供螢幕閱讀器使用的說明）。 |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS 與 Android：是否顯示返回按鈕。 |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | 無 | iOS 與 Android：位於系統標頭前緣的內容，取代返回按鈕。 |
| `headerRight` | `.header_right(..)` | `JSX.Element` | 無 | iOS 與 Android：位於系統標頭後緣的內容。 |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | 無 | iOS 與 Android：取代標題的內容。 |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | 平台預設 | iOS 與 Android：系統標頭的顏色：其背景、標題（`color`）與按鈕（`tintColor`）。 |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | 無 | 以 class 表示的相同顏色：`bg-*`、標題用的 `text-*`、按鈕用的 `tint-*`（在 Rust 中為 `.bg(..)`、`.text_color(..)`、`.tint_color(..)`，為隨外觀變化的主題色）。`headerStyle` 的優先順序高於它們。 |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | 返回按鈕與滑動返回會 pop 該頁面。請參閱[離開頁面](#leaving-a-page)。 |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | 互動式返回手勢會 pop 該頁面：iOS 的滑動返回、跟隨手指的 Android 預測式返回。無論如何，返回按鈕都會 pop。 |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | 頁面進入與離開的方式。 |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | 無 | 頁面透過 WGSL shader 進入與離開，取代其 `animation`：`shade(uv)` 會將下方頁面讀取為 `sample_from`、此頁面讀取為 `sample_to`，而 `nsh.progress` 會在 `duration` 毫秒內（預設 350）從 0 變化到 1，並在頁面離開時從 1 回到 0。當系統要求減少動態效果時，頁面會改用自己的 `animation`。請參閱 [Shader](./shader.md)。 |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | 無 | iOS 與 Android：頁面位於頂部時的狀態列。請參閱[狀態列](../modules/nsh-base.md#status-bar)。 |
| `style`、`class` | 樣式方法 | | 無 | 頁面的樣式。 |
| `children` | `.child(..)` | `JSX.Element` | 無 | 內容。 |
| `testID` | `.test_id(..)` | `string` | 無 | 在測試與 `nsh test --trace` 中尋找該頁面。 |

<a id="navpage-events"></a>

## NavPage 事件

| 事件 | Rust | 說明 |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | 使用者在該頁面按下返回（標頭的返回按鈕、Android 返回、桌面平台上的 Escape、Alt+Left 或滑鼠的返回按鈕、瀏覽器的返回），無論 `popOnBack` 是否允許 pop。 |
| `onDismiss` | `.on_dismiss(..)` | 使用者 pop 了該頁面（返回按鈕、滑動）；在 TSX 中其路由已被移除，在 Rust 中則於此處移除。 |

<a id="header-slots"></a>

## 標頭插槽

`header`、`headerLeft`、`headerRight` 與 `headerTitle` 是插槽（slot）：即普通元素，可讀取 signal、處理按下事件，並在頁面顯示期間更新。`header` 是桌面平台與網頁上應用程式的完整標頭；其他三個則放入 iOS 與 Android 的系統標頭中。

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

頁面內容從標頭下方開始：在 iOS 與 Android 上位於不透明系統標頭之下，在桌面平台與網頁上則位於 `header` 之下。使用 `headerTransparent`、`headerLargeTitle` 或 `headerVisible={false}` 時，內容在 iOS 與 Android 上會從頁面頂部開始；請使用 [`env(safe-area-inset-top)`](./safe-area.md) 或 `safeAreaInsets()` 讓內容避開標頭與狀態列。

在 iOS 上，當 `popOnSwipe` 與 `popOnBack` 為 true 時，`headerVisible={false}` 會保持滑動返回啟用。一旦接受互動式返回手勢，編輯狀態會在轉場開始時結束，因此鍵盤會在拖曳期間收起。取消轉場後，若沒有其他控制項取得焦點，則會恢復同一個編輯器的焦點。

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

`popOnBack={false}` 會讓使用者停留在頁面上，例如表單有未儲存的變更時。當它為 false 時，滑動返回會關閉，而返回按鈕與按鍵會呼叫 `onBackPress` 但不會 pop。請先詢問使用者，再自行 pop：

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
> 系統會在使用者操作的當下，於主執行緒詢問使用者是否可以返回，而主執行緒絕不會等待 JS 或你的 Rust 程式碼。因此 NSH 會根據已掛載的 `popOnBack` 值來回答。請在有可能遺失的內容出現時，於使用者返回之前就設定 `popOnBack={false}`。

`onBackPress` 會在每次按下返回時被呼叫，包括頁面被 pop 時，因此它也會告訴你使用者已返回。若只想關閉滑動手勢而保留返回按鈕，請使用 `popOnSwipe={false}`。確認本身則是 [AlertDialog](./alert-dialog.md)。

<a id="platform-notes"></a>

## 平台說明

- **iOS**：`UINavigationController` 搭配系統標頭、返回按鈕與滑動返回；`headerLargeTitle` 是 UIKit 的大標題。在轉場進行期間送達的堆疊變更，會在轉場結束時套用。
- **Android**：帶有工具列的堆疊。系統返回按鈕會 pop 頂部頁面，在支援的 Android 版本上採用預測式返回；向上箭頭供螢幕閱讀器使用的說明為下層頁面的 `headerBackTitle`，或系統預設值。若要自行處理返回按鈕，請參閱 [`BackHandler`](../modules/nsh-mobile.md#backhandler) 中的 `BackHandler`。
- **Mac Catalyst**：與 iOS 相同。
- **桌面平台（macOS、Windows、Linux、GPUI）與網頁**：每個頁面在頂部顯示其 `header`，內容位於其下方。在桌面平台上，Escape、Alt+Left 與滑鼠的返回按鈕可返回上一頁；在網頁上則使用瀏覽器的返回按鈕。

若要在堆疊及其標頭之上顯示內容，例如 sheet 或全螢幕流程，請使用 [Dialog](./dialog.md)。
