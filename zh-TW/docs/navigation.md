---
title: "導覽"
description: "使用 createNavStack、NavStack 與 NavPage 建立原生導覽堆疊,支援各平台的標題列,透過 popOnBack 讓使用者停留在目前頁面,並涵蓋對話框與 Android 返回按鈕。"
order: 41
group: ui
source_hash: f7722b75b9e46970
---

# 導覽

`nsh_base`(TSX:`nsh/base`)提供原生導覽堆疊與原生對話框。導覽堆疊(Rust 中為 `nav_stack()`,TSX 中為 `NavStack`)在 iOS 上是 UINavigationController,具備標頭、滑動返回與大標題;在 Android 上則是帶有工具列與預測性返回的堆疊;在桌面平台與網頁上,每個頁面會顯示由你的應用程式繪製的標頭。路由由你保存在自己的狀態中;堆疊會將每個路由渲染為一個頁面,並在該路由位於堆疊中時保持頁面掛載,連同其狀態。

在 Rust 中,依名稱匯入建構函式,與 prelude 一併引入(`use nsh_base::{dialog, nav_page, nav_stack};`;系統警示為 `nsh_base::alert_dialog()`)。路由是一個 signal,堆疊的子元素就是它的頁面,每個路由對應一個,並依 key 保留(`each`):加入頁面即為 push,移出頁面即為 pop。在 TSX 中,`createNavStack` 保存路由,`NavStack` 負責渲染。

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

在 Rust 中,路由是你自己的 signal(`signal(vec![..])`,若要讓整個應用程式都能存取則用 `global::<Routes>()`),你透過更新它來 push、pop 與 replace:`routes.update(|r| r.push(route))`、`r.pop()`、`r.truncate(1)`、`routes.set(..)`。每個頁面的 key(此處為路由的 `Debug` 文字)讓堆疊辨識各個頁面,因此路由保持不變的頁面會保留其狀態;可能重複的路由請給予唯一的 key。請處理每個頁面的 `on_dismiss`:使用者以原生方式返回時,該路由(以及位於其上方的路由)會從你的 signal 中移除。

在 TSX 中,`createNavStack(routes)` 會從一個路由陣列(由底到頂)建立堆疊的狀態。路由可以是任何你想要的值(字串、物件,或如上所示的 discriminated union),每次 push 都是獨立的頁面,即使是同一個路由被 push 兩次也一樣。請只建立一次狀態,放在模組層級或根元件中,並在各頁面需要導覽的地方匯入它。

| 成員 | 說明 |
|---|---|
| `routes()` | 路由,由底到頂(具反應性)。 |
| `push(route)` | Push 一個頁面。 |
| `pop(count?)` | Pop `count` 個頁面(預設為 1);至少會保留一個。 |
| `popToRoot()` | Pop 回到第一個頁面。 |
| `replace(route)` | 取代最上層的頁面。 |
| `setRoutes(routes)` | 取代所有頁面,例如登入之後;保留下來的路由(相同的值)會保留其頁面與狀態。 |
| `remove(route)` | 移除 `route` 的最上層頁面,無論它位於何處。 |

若要一開始就有多層頁面,請傳入更多路由:`createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`。

當使用者以原生方式離開頁面時(標頭中的返回按鈕、iOS 的滑動返回、Android 的返回鍵或手勢、桌面平台的返回鍵與滑鼠按鈕、瀏覽器的返回按鈕),TSX 堆疊會自動從其狀態中移除該路由,因此 `routes()` 永遠與畫面上顯示的內容一致;Rust 頁面則如上所述,透過 `on_dismiss` 回報。

路由要攜帶頁面所需的資料。範例應用程式(gallery apps)所 push 的路由,攜帶的是組成該頁面所需的內容,這能在頁面很多時讓路由型別保持精簡:

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

在 Rust 中,`nav_stack()` 是一個 view,其子元素就是它的頁面,由底到頂排列;可像任何 view 一樣設定樣式(`.flex_1()`)。在 TSX 中:

| 屬性 | 型別 | 說明 |
|---|---|---|
| `state` | `NavStackState<R>` | 要顯示的路由。 |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | 渲染路由;回傳 `<NavPage>` 以設定其標頭。 |
| `style`、`class` | | 堆疊本身的樣式(通常為 `flex: 1`)。 |

render 函式在每個路由被 push 時執行一次;`route` 是原始值,`index()` 是它目前的位置。它回傳的內容會成為頁面的內容。回傳 `<NavPage>` 即可設定標頭;其他任何回傳值都會以預設選項包裝成一個頁面。

只要路由還在堆疊中,頁面就會保持掛載:返回時會顯示上一個頁面離開時的原樣,包含捲動位置、輸入內容與 signal。頁面的 [`cleanup`](./reactivity.md) 處理常式會在其路由離開堆疊時執行。

<a id="navpage-and-the-header"></a>

## NavPage 與標頭

頁面(Rust 中為 `nav_page()`,TSX 中為 `NavPage`)包裹頁面的內容並承載其標頭。iOS 與 Android 顯示系統標頭,由標題與標頭選項設定。桌面平台與網頁則在頁面頂端顯示頁面的標頭插槽(`.header(..)`,TSX 為 `header`),即你自己的 view:寬度與頁面相同,高度依其版面配置而定,內容位於其下方。若如上述範例同時提供兩者,頁面在各平台上看起來都很自然。所有選項都具反應性:改變 signal,標頭就會跟著更新。

在 Rust 中,下列每個屬性都是 `nav_page()` 的方法,採用 snake case:`.title(..)`、`.header(..)`、`.header_visible(..)`、`.header_transparent(..)`、`.header_style_with(..)`、`.header_style(..)`、`.header_back_visible(..)`、`.header_left(..)`、`.header_right(..)`、`.header_title(..)`、`.header_large_title(..)`、`.header_back_title(..)`、`.animation(ScreenAnimation::Fade)`、`.status_bar(..)`、`.pop_on_swipe(..)`、`.pop_on_back(..)`、`.on_back_press(..)`、`.on_dismiss(..)`;其子元素即為內容。

| 屬性 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `header` | `JSX.Element` | | 桌面平台與網頁:頁面的標頭,由應用程式繪製(標題、返回按鈕、工具列按鈕)。 |
| `title` | `string` | | iOS 與 Android:系統標頭的標題。 |
| `headerVisible` | `boolean` | `true` | iOS 與 Android:是否顯示系統標頭。 |
| `headerTransparent` | `boolean` | `false` | iOS 與 Android:內容是否延伸到標頭下方。 |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS 與 Android:標頭的背景、標題的顏色(`color`)與按鈕的顏色(`tintColor`)。 |
| `headerClass` | `string` | | 與 classes 相同:`bg-*`、標題用的 `text-*`、按鈕用的 `tint-*`;`headerStyle` 的優先順序高於它們。 |
| `headerBackVisible` | `boolean` | `true` | iOS 與 Android:是否顯示返回按鈕。 |
| `headerLeft` | `JSX.Element` | | iOS 與 Android:位於標頭起始側的 view(會取代返回按鈕)。 |
| `headerRight` | `JSX.Element` | | iOS 與 Android:位於標頭結尾側的 view。 |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS:位於標頭結尾側的 UIKit 原生列按鈕,具有系統的外觀、符號或標籤,取代 `headerRight` 的 view;按下它等同於按下 `headerRight` 中第一個可按壓的 view,因此請在其中保留一個。Android 則照原樣顯示 `headerRight`。 |
| `ios={{ headerLeftSystemItem }}` | 與 `headerRightSystemItem` 相同 | | iOS:同上,但位於標頭起始側,按下時觸發 `headerLeft`。 |
| `ios={{ headerRightSymbol }}` | `string` | | iOS:UIKit 原生列按鈕,顯示該名稱的 SF Symbol(`"slider.horizontal.3"`),取代 `headerRight` 的 view;按下它等同於按下 `headerRight` 中第一個可按壓的 view,VoiceOver 會朗讀該 view 的標籤。`headerRightSystemItem` 的優先順序高於它;若 SF Symbols 沒有該名稱,則照原樣顯示 `headerRight`。Android 照原樣顯示 `headerRight`。 |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS:同上,但位於標頭起始側,按下時觸發 `headerLeft`。 |
| `headerTitle` | `JSX.Element` | | iOS 與 Android:取代標題的 view。 |
| `headerLargeTitle` | `boolean` | `false` | iOS:大標題,會隨內容捲動而縮小並收進導覽列。 |
| `headerBackTitle` | `string` | | 通往此頁面的返回按鈕的標籤(iOS;Android 的向上箭頭則會將它告知螢幕閱讀器)。 |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | 頁面進入與離開的方式。 |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS 與 Android:頁面位於最上層時的狀態列([Status bar](../modules/nsh-base.md#status-bar))。 |
| `popOnSwipe` | `boolean` | `true` | 互動式返回手勢(iOS 滑動返回、Android 預測性返回)是否會 pop。無論如何,返回按鈕都會 pop。 |
| `popOnBack` | `boolean` | `true` | 所有返回方式是否都會 pop 此頁面:返回按鈕、Android 的返回鍵、桌面平台的返回鍵、瀏覽器的返回按鈕與滑動手勢。 |
| `onBackPress` | `() => void` | | 使用者在頁面上按下返回,無論 `popOnBack` 是否允許 pop。 |
| `onDismiss` | `() => void` | | 使用者 pop 了頁面;其路由已被移除。 |
| `style`、`class` | | | 頁面的內容 view。 |

標頭項目都是一般的 view,因此可以被按壓,也具有反應性:

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

帶有顏色的系統標頭(在 Rust 中,`header_style_with` 接受具型別的樣式:`bg`、`text_color` 與 `tint_color`,即標頭按鈕的顏色;主題顏色會跟隨外觀):

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

不顯示標頭的頁面,四周仍然有系統列;請以[安全區域](../elements/safe-area.md)的 inset 為其內容加上 padding:

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

### 標頭下方的安全區域

在頁面內,`env(safe-area-inset-*)` 變數與頁面的 inset(Rust 中為 `Scope::insets`,TSX 中為 `safeAreaInsets()`)指的是頁面內、系統標頭下方的部分。使用透明標頭時,內容從頁面頂端開始,頂部 inset 即為標頭的高度,因此以 `env(safe-area-inset-top)` 設定 padding 可讓文字避開標頭,同時讓背景圖片鋪滿整個頁面。使用大標題時,請將捲動 view 直接放在頁面中,標題才能隨捲動而收合。在桌面平台與網頁上,內容從頁面的標頭插槽下方開始。

<a id="keeping-the-user-on-a-page-poponback"></a>

## 讓使用者留在頁面上:popOnBack

若要在捨棄未儲存的變更前先詢問使用者,請在有內容可能遺失時將 `pop_on_back`(TSX 為 `popOnBack`)設為 false,處理返回事件(`.on_back_press(..)`,TSX 為 `onBackPress`),並在使用者同意後再 pop:

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

當 `pop_on_back(false)`(`popOnBack={false}`)時,頁面在所有返回方式下都會留在原地(返回按鈕、Android 的返回鍵與手勢、桌面平台的返回鍵、瀏覽器的返回按鈕、滑動手勢),而返回事件會告訴你使用者嘗試過返回。從程式碼 pop(移除路由,`nav.pop()`)則一如往常地 pop。

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` 是屬性,而不是回傳 true 或 false 的回呼,因為主執行緒絕不會等待應用程式的程式碼。當使用者開始滑動或按下返回時,系統會立即詢問頁面是否可以離開,而 NSH 會根據它已有的屬性在原生端直接回答。請在有內容可能遺失時(如上例,依文字內容)盡早設定,在使用者嘗試離開之前完成。

`pop_on_swipe(false)`(`popOnSwipe={false}`)是較輕量的選項:它只關閉互動式手勢(iOS 滑動返回、Android 預測性返回動畫),返回按鈕仍然會 pop。

<a id="dialogs"></a>

## 對話框

對話框(Rust 中為 `nsh_base` 的 `dialog()`,TSX 中為 `Dialog`)會將內容呈現在其他所有內容之上,位於它自己的原生視窗圖層中:iOS 上是被 present 的 view controller,Android 上是對話框視窗,桌面平台與網頁上則是覆蓋整個視窗的圖層。它的外觀由你決定。在 Rust 中,對話框在位於 view 內(`when` 之中)時就會被呈現,其子元素會填滿它:請將背景遮罩與彈出視窗都以 view 繪製。在 TSX 中,`class` 與 `style` 為承載其子元素的彈出視窗設定樣式,`backdropClass` 或 `backdropStyle` 會在其後方加入背景遮罩,而 `open` 負責控制它:

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

Escape、Android 的返回鍵、按下背景遮罩(TSX 的背景遮罩,Rust 中則為原生 sheet 的背景遮罩)以及在 sheet 上向下滑動,都會以原生方式關閉它(`close_on_escape`、`close_on_backdrop_press` 與 `close_on_swipe`,TSX 為 `closeOnEscape`、`closeOnBackdropPress` 與 `closeOnSwipe`,預設皆為 true)。在 Rust 中,`on_cancel` 會回報每一次嘗試,`on_close` 回報關閉,因此請在該處把對話框從 view 中移除;由你的應用程式繪製的背景遮罩,則以它自己的按壓處理常式關閉對話框,如上所示。在 TSX 中,`onOpenChange({ open: false, reason })` 會通知你,因此請在該處將 `open` 設為 `false`。若要先確認,請將旗標設為 false 並處理取消事件(`on_cancel`、`onCancel`),它會回報每一次嘗試,然後再自行關閉對話框。在 iOS 上,`.presentation(ModalPresentation::PageSheet)` 或 `FormSheet`(`presentation="pageSheet"` 或 `"formSheet"`)會呈現一個讓後方內容仍然可見的 sheet。

所有屬性請參閱 [Dialog](../elements/dialog.md)。在對話框內,`env(safe-area-inset-*)` 變數與 inset 屬於對話框本身。若要使用系統對話框(帶有動作的警示、action sheet),請使用 `nsh_base` 的 [`AlertDialog`](../modules/nsh-base.md#alertdialog)(TSX:`nsh/base`)。

<a id="the-android-back-button"></a>

## Android 的返回鍵

在 Android 上,返回鍵(或手勢)依以下順序處理:

1. 最上層的對話框:它會回報取消(`on_cancel`、`onCancel`),並在 `close_on_escape` / `closeOnEscape` 為 true(預設值)時關閉。
2. 你的返回監聽器(Rust 中為 `on_back_press`,TSX 中為 `nsh/mobile` 的 `BackHandler`),最近加入的最先處理。
3. 最上層的堆疊:其最上層頁面會回報返回事件,並在 `pop_on_back` / `popOnBack` 為 true 時 pop。
4. 若都沒有處理:應用程式結束。

監聽器在處理了該次按壓時回傳 `true`,這會讓堆疊不進行 pop。只要有監聽器已註冊,Android 的返回手勢就不會預覽 pop(應用程式要等到手勢結束後才回應),因此請只在監聽器可能攔截按壓時才加入它:

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

在 effect 中建立的監聽器會持續到該 effect 再次執行或其元件消失為止;在 TSX 中,`BackHandler.on` 所回傳的函式也能停止它。在 TSX 中,`BackHandler.exitApp()` 會離開應用程式;`nsh/mobile` 在 iOS 上也可以匯入,`BackHandler` 的呼叫在那裡會立即回傳,因此相同的程式碼可在兩個平台上執行。請參閱[平台專屬程式碼](./platform-specific.md)。

<a id="tabs-and-other-layouts"></a>

## 分頁標籤與其他版面配置

分頁標籤列是你自己的 UI,由基本元件繪製而成:一列可按壓的 view,加上一個保存所選分頁的 signal;請以 [`when` / `<If>`](../elements/control-flow.md)(或 TSX 中的函式子元素)渲染所選分頁的內容。若要在切換時保留各分頁的狀態,請讓每個分頁擁有自己的堆疊與路由,並讓它們全部保持掛載,再以 `display: none` 隱藏未啟用的分頁。

<a id="related"></a>

## 相關內容

- [`nsh/base`](../modules/nsh-base.md):`nav_stack`、`nav_page`、`dialog`、`createNavStack`、`NavStack`、`NavPage` 與 `Dialog` 的參考文件;inset 請見 [Safe area](../elements/safe-area.md)。
- 頁面與對話框的[狀態列](../modules/nsh-base.md#status-bar)。
- [`AlertDialog`](../modules/nsh-base.md#alertdialog)。
- [`BackHandler`](../modules/nsh-mobile.md#backhandler):`BackHandler`。
