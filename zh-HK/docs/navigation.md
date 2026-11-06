---
title: "導覽"
description: "使用 createNavStack、NavStack 和 NavPage 建立原生導覽堆疊、適用於各平台的標題列、透過 popOnBack 讓使用者停留在目前頁面、對話框,以及 Android 返回按鈕。"
order: 41
group: ui
source_hash: f7722b75b9e46970
---


# 導覽

`nsh_base`（TSX：`nsh/base`）提供原生導覽堆疊和原生對話框。導覽堆疊（Rust 中為 `nav_stack()`，TSX 中為 `NavStack`）在 iOS 上是 UINavigationController，附有標題列、滑動返回和大標題；在 Android 上是附有工具列和預測式返回的堆疊；在桌面平台和網頁上，每個頁面都會顯示由你的應用程式繪製的標題列。路由保存在你自己的狀態中；堆疊會把每個路由渲染成一個頁面，並在該頁面位於堆疊期間保持其掛載和狀態。

在 Rust 中，請按名稱匯入 builder，並與 prelude 一併使用（`use nsh_base::{dialog, nav_page, nav_stack};`；系統警示為 `nsh_base::alert_dialog()`）。路由是一個 signal，堆疊的子項就是它的頁面，每個路由對應一頁，並以 key 識別（`each`）：加入頁面即推入，移除頁面即彈出。在 TSX 中，`createNavStack` 保存路由，`NavStack` 負責渲染。

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

## 堆疊的狀態

在 Rust 中，路由是你自己的 signal（`signal(vec![..])`，或供整個應用程式存取的 `global::<Routes>()`），你透過更新它來推入、彈出和取代：`routes.update(|r| r.push(route))`、`r.pop()`、`r.truncate(1)`、`routes.set(..)`。每個頁面的 key（此處為路由的 `Debug` 文字）讓堆疊分辨各個頁面，因此路由保持不變的頁面會保留其狀態；可能重複的路由，請給予唯一的 key。請處理每個頁面的 `on_dismiss`：使用者以原生方式返回後，該路由（連同其上方的路由）會從你的 signal 中移除。

在 TSX 中，`createNavStack(routes)` 會根據路由陣列（由下至上）建立堆疊的狀態。路由可以是任何值（字串、物件，或如上所示的 discriminated union），每次推入都是獨立的頁面，同一個路由推入兩次也不例外。請只建立一次狀態，放在模組層級或根元件中，並在各頁面需要導覽的地方匯入。

| 成員 | 說明 |
|---|---|
| `routes()` | 路由，由下至上（響應式）。 |
| `push(route)` | 推入一個頁面。 |
| `pop(count?)` | 彈出 `count` 個頁面（預設為 1）；至少會保留一頁。 |
| `popToRoot()` | 彈出至第一頁。 |
| `replace(route)` | 取代最上層的頁面。 |
| `setRoutes(routes)` | 取代所有頁面，例如登入之後；保留下來的路由（相同的值）會保留其頁面和狀態。 |
| `remove(route)` | 移除 `route` 的最上層頁面，不論它位於何處。 |

若要一開始就有多層頁面，請傳入更多路由：`createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`。

當使用者以原生方式離開頁面（標題列的返回按鈕、iOS 的滑動返回、Android 的返回按鈕或手勢、桌面平台的返回鍵和滑鼠按鍵、瀏覽器的返回按鈕）時，TSX 堆疊會自動從其狀態中移除該路由，因此 `routes()` 始終與畫面上顯示的內容一致；Rust 頁面則如上所述，透過 `on_dismiss` 回報。

路由承載頁面所需的資料。示範應用程式會推入帶有頁面組成內容的路由，這樣即使頁面很多，路由類型也能保持精簡：

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

在 Rust 中，`nav_stack()` 是一個 view，其子項就是它的頁面，由下至上排列；可以像其他 view 一樣設定樣式（`.flex_1()`）。在 TSX 中：

| 屬性 | 類型 | 說明 |
|---|---|---|
| `state` | `NavStackState<R>` | 要顯示的路由。 |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | 渲染一個路由；回傳 `<NavPage>` 以設定其標題列。 |
| `style`、`class` | | 堆疊本身的樣式（通常為 `flex: 1`）。 |

渲染函式在每個路由被推入時執行一次；`route` 是原始值，`index()` 是它目前的位置。它的回傳值會成為頁面的內容。回傳 `<NavPage>` 即可設定標題列；其他任何回傳值都會被包進一個使用預設選項的頁面中。

只要路由仍在堆疊中，頁面就會保持掛載：返回時，上一頁會完全保持離開時的樣子，包括捲動位置、輸入內容和 signal。頁面的 [`cleanup`](./reactivity.md) 處理常式會在其路由離開堆疊時執行。

<a id="navpage-and-the-header"></a>

## NavPage 與標題列

頁面（Rust 中為 `nav_page()`，TSX 中為 `NavPage`）包裹頁面的內容，並承載其標題列。iOS 和 Android 顯示系統標題列，由標題和標題列選項設定。桌面平台和網頁則在頁面頂部顯示頁面的標題列插槽（`.header(..)`，TSX 為 `header`），內容是你自己的 view：寬度與頁面相同，高度由版面決定，內容則在其下方。如上例所示，同時提供兩者，頁面在各平台上都會顯得自然。所有選項都是響應式的：改變一個 signal，標題列便會隨之更新。

在 Rust 中，以下每個屬性都是 `nav_page()` 的方法，名稱採用 snake case：`.title(..)`、`.header(..)`、`.header_visible(..)`、`.header_transparent(..)`、`.header_style_with(..)`、`.header_style(..)`、`.header_back_visible(..)`、`.header_left(..)`、`.header_right(..)`、`.header_title(..)`、`.header_large_title(..)`、`.header_back_title(..)`、`.animation(ScreenAnimation::Fade)`、`.status_bar(..)`、`.pop_on_swipe(..)`、`.pop_on_back(..)`、`.on_back_press(..)`、`.on_dismiss(..)`；其子項就是頁面的內容。

| 屬性 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `header` | `JSX.Element` | | 桌面平台和網頁：頁面的標題列，由應用程式繪製（標題、返回按鈕、工具列按鈕）。 |
| `title` | `string` | | iOS 和 Android：系統標題列的標題。 |
| `headerVisible` | `boolean` | `true` | iOS 和 Android：是否顯示系統標題列。 |
| `headerTransparent` | `boolean` | `false` | iOS 和 Android：內容是否延伸至標題列下方。 |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS 和 Android：標題列的背景、標題的顏色（`color`）和按鈕的顏色（`tintColor`）。 |
| `headerClass` | `string` | | 與 classes 相同：`bg-*`、標題用的 `text-*`、按鈕用的 `tint-*`；`headerStyle` 的優先順序高於它們。 |
| `headerBackVisible` | `boolean` | `true` | iOS 和 Android：是否顯示返回按鈕。 |
| `headerLeft` | `JSX.Element` | | iOS 和 Android：標題列起始處的 view（會取代返回按鈕）。 |
| `headerRight` | `JSX.Element` | | iOS 和 Android：標題列末端的 view。 |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS：標題列末端使用 UIKit 原生的列按鈕，具系統外觀、符號或標籤，取代 `headerRight` 的 view；按下它等同於按下 `headerRight` 中第一個可按下的 view，因此請在其中保留一個。Android 會照原樣顯示 `headerRight`。 |
| `ios={{ headerLeftSystemItem }}` | 與 `headerRightSystemItem` 相同 | | iOS：同上，但位於標題列起始處，按下 `headerLeft`。 |
| `ios={{ headerRightSymbol }}` | `string` | | iOS：UIKit 原生的列按鈕，顯示該名稱的 SF Symbol（`"slider.horizontal.3"`），取代 `headerRight` 的 view；按下它等同於按下 `headerRight` 中第一個可按下的 view，VoiceOver 會朗讀該 view 的標籤。`headerRightSystemItem` 的優先順序高於它；SF Symbols 中沒有的名稱，會照原樣顯示 `headerRight`。Android 會照原樣顯示 `headerRight`。 |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS：同上，但位於標題列起始處，按下 `headerLeft`。 |
| `headerTitle` | `JSX.Element` | | iOS 和 Android：取代標題的 view。 |
| `headerLargeTitle` | `boolean` | `false` | iOS：大標題，會隨內容捲動而縮進標題列。 |
| `headerBackTitle` | `string` | | 返回此頁面的返回按鈕上的標籤（iOS；Android 的向上箭頭則會向螢幕閱讀器說出該標籤）。 |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | 頁面進入和離開的方式。 |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS 和 Android：頁面位於最上層時的狀態列（[狀態列](../modules/nsh-base.md#status-bar)）。 |
| `popOnSwipe` | `boolean` | `true` | 互動式返回手勢（iOS 滑動返回、Android 預測式返回）是否彈出頁面。無論如何，返回按鈕都會彈出。 |
| `popOnBack` | `boolean` | `true` | 所有返回方式是否都會彈出頁面：返回按鈕、Android 的返回、桌面平台的返回鍵、瀏覽器的返回按鈕和滑動。 |
| `onBackPress` | `() => void` | | 使用者在頁面上按下返回，不論 `popOnBack` 是否讓它彈出。 |
| `onDismiss` | `() => void` | | 使用者彈出了頁面；其路由已被移除。 |
| `style`、`class` | | | 頁面的內容 view。 |

標題列項目都是普通的 view，因此可以按下，也可以是響應式的：

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

有顏色的系統標題列（在 Rust 中，`header_style_with` 接受具類型的樣式：`bg`、`text_color` 和 `tint_color`，即標題列按鈕的顏色；主題顏色會跟隨外觀）：

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

不顯示標題列的頁面，周圍仍然有系統列；請按[安全區域](../elements/safe-area.md)的 inset 為其內容加上內距：

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

### 標題列下方的安全區域

在頁面內，`env(safe-area-inset-*)` 變數和頁面的 inset（Rust 中為 `Scope::insets`，TSX 中為 `safeAreaInsets()`）指的是系統標題列下方、頁面範圍內的部分。標題列透明時，內容從頁面頂部開始，頂部 inset 就是標題列的高度，因此以 `env(safe-area-inset-top)` 加上內距可讓文字避開標題列，同時讓背景圖片填滿整個頁面。使用大標題時，請把捲動 view 直接放在頁面中，標題才能隨捲動而收合。在桌面平台和網頁上，內容從頁面的標題列插槽下方開始。

<a id="keeping-the-user-on-a-page-poponback"></a>

## 讓使用者停留在頁面：popOnBack

若要在捨棄未儲存的變更前先詢問使用者，請在有內容可能遺失時，把 `pop_on_back`（TSX 為 `popOnBack`）設為 false，處理返回事件（`.on_back_press(..)`，TSX 為 `onBackPress`），並在使用者同意後再彈出頁面：

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

設定 `pop_on_back(false)`（`popOnBack={false}`）後，無論使用者採用哪種返回方式（返回按鈕、Android 的返回按鈕和手勢、桌面平台的返回鍵、瀏覽器的返回按鈕、滑動），頁面都會留在原處，而返回事件會告知你使用者曾嘗試返回。從程式碼彈出（移除路由，`nav.pop()`）則一如以往會彈出頁面。

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` 是屬性，而不是回傳 true 或 false 的回呼，因為主執行緒絕不會等待應用程式的程式碼。使用者開始滑動或按下返回時，系統會立即詢問頁面是否可以離開，NSH 則根據已有的屬性在原生層回答。請在有內容可能遺失時（如上例，由文字輸入觸發）盡快設定它，並且要在使用者嘗試離開之前設定。

`pop_on_swipe(false)`（`popOnSwipe={false}`）是較輕量的選項：它只關閉互動式手勢（iOS 滑動返回、Android 的預測式返回動畫），返回按鈕仍然會彈出頁面。

<a id="dialogs"></a>

## 對話框

對話框（Rust 中為 `nsh_base` 的 `dialog()`，TSX 中為 `Dialog`）會在其自身的原生視窗層中，將內容呈現於其他所有內容之上：iOS 上是被呈現的 view controller，Android 上是對話框視窗，桌面平台和網頁上則是覆蓋整個視窗的一層。其外觀由你決定。在 Rust 中，對話框在它位於 view 內時（置於 `when` 之內）就會呈現，其子項填滿對話框：背景遮罩和彈出內容都請以 view 繪製。在 TSX 中，`class` 和 `style` 為容納其子項的彈出內容設定樣式，`backdropClass` 或 `backdropStyle` 在其後方加入背景遮罩，而 `open` 則負責控制它：

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

Escape 鍵、Android 的返回按鈕、按下背景遮罩（TSX 的背景遮罩，Rust 中則為原生 sheet 的背景遮罩），以及在 sheet 上向下滑動，都會以原生方式關閉對話框（`close_on_escape`、`close_on_backdrop_press` 和 `close_on_swipe`，TSX 為 `closeOnEscape`、`closeOnBackdropPress` 和 `closeOnSwipe`，預設皆為 true）。在 Rust 中，`on_cancel` 會回報每一次嘗試，`on_close` 則回報關閉，因此請在那裡把對話框從 view 中移除；由應用程式自行繪製的背景遮罩，則如上所示以自己的按下處理常式關閉對話框。在 TSX 中，由 `onOpenChange({ open: false, reason })` 通知你，因此請在那裡把 `open` 設為 `false`。若要先確認，請把旗標設為 false 並處理取消事件（`on_cancel`、`onCancel`），它會回報每一次嘗試，然後再自行關閉對話框。在 iOS 上，`.presentation(ModalPresentation::PageSheet)` 或 `FormSheet`（`presentation="pageSheet"` 或 `"formSheet"`）會呈現一個讓後方內容保持可見的 sheet。

所有屬性請參閱 [Dialog](../elements/dialog.md)。在對話框內，`env(safe-area-inset-*)` 變數和 inset 屬於對話框本身。至於系統對話框（附有操作的警示、操作表），請使用 `nsh_base` 中的 [`AlertDialog`](../modules/nsh-base.md#alertdialog)（TSX：`nsh/base`）。

<a id="the-android-back-button"></a>

## Android 的返回按鈕

在 Android 上，返回按鈕（或手勢）按以下順序處理：

1. 最上層的對話框：它會回報取消（`on_cancel`、`onCancel`），並在 `close_on_escape` / `closeOnEscape` 為 true（預設值）時關閉。
2. 你的返回監聽器（Rust 中為 `on_back_press`，TSX 中為 `nsh/mobile` 的 `BackHandler`），最近加入的最先處理。
3. 最上層的堆疊：其最上層頁面會回報返回事件，並在 `pop_on_back` / `popOnBack` 為 true 時彈出。
4. 沒有任何處理者處理：應用程式結束。

監聽器在處理了該次按下時回傳 `true`，這會阻止堆疊彈出。只要有監聽器已註冊，Android 的返回手勢就不會預覽彈出效果（應用程式要等手勢結束後才回應），因此請只在監聽器可能處理該次按下時才加入它：

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

在 effect 中建立的監聽器會持續到該 effect 再次執行或其元件消失為止；在 TSX 中，`BackHandler.on` 回傳的函式也可以停止它。在 TSX 中，`BackHandler.exitApp()` 會離開應用程式；`nsh/mobile` 在 iOS 上同樣可以匯入，而 `BackHandler` 的呼叫在 iOS 上會立即回傳，因此相同的程式碼可在兩個平台上執行。請參閱[平台專屬程式碼](./platform-specific.md)。

<a id="tabs-and-other-layouts"></a>

## 分頁列與其他版面

分頁列是你自己的 UI，由基本元件繪製：一列可按下的 view，加上一個保存所選分頁的 signal；請以 [`when` / `<If>`](../elements/control-flow.md)（或 TSX 中的函式子項）渲染所選分頁的內容。若要在切換時保留各分頁的狀態，請為每個分頁提供各自的堆疊和路由，讓它們全部保持掛載，並以 `display: none` 隱藏未啟用的分頁。

<a id="related"></a>

## 相關內容

- [`nsh/base`](../modules/nsh-base.md)：`nav_stack`、`nav_page`、`dialog`、`createNavStack`、`NavStack`、`NavPage` 和 `Dialog` 的參考資料；inset 請參閱[安全區域](../elements/safe-area.md)。
- 頁面和對話框的[狀態列](../modules/nsh-base.md#status-bar)。
- [`AlertDialog`](../modules/nsh-base.md#alertdialog)。
- [`BackHandler`](../modules/nsh-mobile.md#backhandler)：`BackHandler`。
