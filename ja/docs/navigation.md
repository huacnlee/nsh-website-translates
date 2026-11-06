---
title: "ナビゲーション"
description: "createNavStack、NavStack、NavPage を使ったネイティブのナビゲーションスタック、各プラットフォームのヘッダー、popOnBack でユーザーをページに留める方法、ダイアログ、Android の戻るボタンについて説明します。"
order: 41
group: ui
source_hash: f7722b75b9e46970
---

# Navigation

`nsh_base`(TSX: `nsh/base`)は、ネイティブのナビゲーションスタックとネイティブダイアログを提供します。ナビゲーションスタック(Rust では `nav_stack()`、TSX では `NavStack`)は、iOS ではヘッダー、スワイプバック、ラージタイトルを備えた UINavigationController、Android ではツールバー付きのスタックと予測型戻るにあたります。デスクトップとウェブでは、各ページにアプリが描画したヘッダーが表示されます。ルートはアプリの状態として保持します。スタックは各ルートをページとして描画し、スタックにある間は状態を保ったままマウントし続けます。

Rust では、ビルダーをプレリュード(`use nsh_base::{dialog, nav_page, nav_stack};`。システムアラートは `nsh_base::alert_dialog()`)と並べて名前でインポートします。ルートはシグナルで、スタックの子がそのページです。ページはルートごとに 1 つで、キー(`each`)によって管理されます。ページを加えると push され、取り除くと pop されます。TSX では、`createNavStack` がルートを保持し、`NavStack` がそれを描画します。

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

## スタックの状態

Rust では、ルートは自前のシグナル(`signal(vec![..])`、アプリ全体から参照できるものなら `global::<Routes>()`)で、そのシグナルを更新して push、pop、replace を行います: `routes.update(|r| r.push(route))`、`r.pop()`、`r.truncate(1)`、`routes.set(..)`。各ページのキー(ここではルートの `Debug` テキスト)により、スタックはどのページがどれかを判別します。そのため、ルートが残るページは状態を保持します。重複しうるルートには一意のキーを付けてください。各ページの `on_dismiss` を処理します。これは、ユーザーがネイティブ操作で戻ったことを示し、そのルート(とその上にあるルート)がシグナルから取り除かれます。

TSX では、`createNavStack(routes)` がルートの配列(下から上の順)からスタックの状態を作成します。ルートは任意の値(文字列、オブジェクト、上のような判別可能なユニオン)でよく、push のたびに独立したページになります。同じルートを 2 回 push した場合も同様です。状態はモジュールレベルまたはルートコンポーネントで一度だけ作成し、ページが遷移する場所でインポートして使います。

| メンバー | 説明 |
|---|---|
| `routes()` | ルート(下から上の順、リアクティブ)。 |
| `push(route)` | ページを push します。 |
| `pop(count?)` | `count` ページを pop します(デフォルトは 1)。少なくとも 1 ページは残ります。 |
| `popToRoot()` | 最初のページまで pop して戻ります。 |
| `replace(route)` | 最上位のページを置き換えます。 |
| `setRoutes(routes)` | ページを置き換えます(例: サインイン後)。残るルート(同じ値)は、そのページと状態を保持します。 |
| `remove(route)` | `route` の最上位のページを、どこにあっても取り除きます。 |

何ページも深い状態から開始するには、ルートを複数渡します: `createNavStack<Route>([{ name: "inbox" }, { name: "message", id: 3 }])`。

ユーザーがネイティブ操作でページを離れると(ヘッダーの戻るボタン、iOS のスワイプバック、Android の戻るボタンやジェスチャー、デスクトップの戻るキーやマウスボタン、ブラウザーの戻るボタン)、TSX のスタックは状態からそのルートを自動的に取り除くため、`routes()` は常に画面上の内容と一致します。Rust のページは、上で述べたとおり `on_dismiss` で通知します。

ルートには、ページに必要なものを持たせます。ギャラリーアプリでは、ページを構成するものを保持するルートを push しており、ページが多くてもルートの型を小さく保てます。

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

Rust では、`nav_stack()` は子がそのページ(下から上の順)であるビューで、他のビューと同様にスタイルを指定できます(`.flex_1()`)。TSX では次のとおりです。

| プロパティ | 型 | 説明 |
|---|---|---|
| `state` | `NavStackState<R>` | 表示するルート。 |
| `children` | `(route: R, index: Accessor<number>) => JSX.Element` | ルートを描画します。ヘッダー用に `<NavPage>` を返します。 |
| `style`, `class` | | スタック自体のスタイル(通常は `flex: 1`)。 |

render 関数はルートが push されたときに、ルートごとに一度だけ実行されます。`route` は素の値、`index()` はその現在位置です。返したものがページの内容になります。ヘッダーを設定するには `<NavPage>` を返します。それ以外は、デフォルトのオプションを持つページに包まれます。

ルートがスタックにある間、ページはマウントされたままです。戻ると、前のページはスクロール位置、入力、シグナルを含め、離れたときのままの状態で表示されます。ページの [`cleanup`](./reactivity.md) ハンドラーは、そのルートがスタックから外れたときに実行されます。

<a id="navpage-and-the-header"></a>

## NavPage とヘッダー

ページ(Rust では `nav_page()`、TSX では `NavPage`)はページの内容を包み、そのヘッダーを持ちます。iOS と Android では、タイトルとヘッダーオプションで設定されたシステムヘッダーが表示されます。デスクトップとウェブでは、ページの上部にヘッダースロット(`.header(..)`、TSX では `header`)、つまりアプリ自身のビューが表示されます。幅はページと同じで、高さはレイアウトに従い、その下に内容が続きます。上の例のようにページに両方を指定すれば、どのプラットフォームでも自然に見えます。すべてのオプションはリアクティブで、シグナルを変更するとヘッダーも追従します。

Rust では、以下の各プロパティは `nav_page()` のスネークケースのメソッドです: `.title(..)`、`.header(..)`、`.header_visible(..)`、`.header_transparent(..)`、`.header_style_with(..)`、`.header_style(..)`、`.header_back_visible(..)`、`.header_left(..)`、`.header_right(..)`、`.header_title(..)`、`.header_large_title(..)`、`.header_back_title(..)`、`.animation(ScreenAnimation::Fade)`、`.status_bar(..)`、`.pop_on_swipe(..)`、`.pop_on_back(..)`、`.on_back_press(..)`、`.on_dismiss(..)`。その子が内容になります。

| プロパティ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `header` | `JSX.Element` | | デスクトップとウェブ: アプリが描画するページのヘッダー(タイトル、戻るボタン、ツールバーボタン)。 |
| `title` | `string` | | iOS と Android: システムヘッダーのタイトル。 |
| `headerVisible` | `boolean` | `true` | iOS と Android: システムヘッダーを表示します。 |
| `headerTransparent` | `boolean` | `false` | iOS と Android: 内容がヘッダーの下まで広がります。 |
| `headerStyle` | `{ backgroundColor?, color?, tintColor? }` | | iOS と Android: ヘッダーの背景、タイトルの色(`color`)、ボタンの色(`tintColor`)。 |
| `headerClass` | `string` | | classes と同じです: `bg-*`、タイトル用の `text-*`、ボタン用の `tint-*`。`headerStyle` が優先されます。 |
| `headerBackVisible` | `boolean` | `true` | iOS と Android: 戻るボタンを表示します。 |
| `headerLeft` | `JSX.Element` | | iOS と Android: ヘッダーの先頭に置くビュー(戻るボタンの代わりになります)。 |
| `headerRight` | `JSX.Element` | | iOS と Android: ヘッダーの末尾に置くビュー。 |
| `ios={{ headerRightSystemItem }}` | `"add" \| "done" \| "close" \| "edit" \| "compose" \| "search" \| "share" \| "trash" \| "save" \| "cancel"` | | iOS: ヘッダー末尾に置く UIKit 自身のバーボタンで、`headerRight` のビューの代わりに、システムの見た目、シンボルまたはラベルで表示されます。これを押すと `headerRight` の最初の押下可能なビューが押されたことになるため、そこに 1 つ置いてください。Android では `headerRight` がそのまま表示されます。 |
| `ios={{ headerLeftSystemItem }}` | `headerRightSystemItem` と同じ | | iOS: 同様のものをヘッダーの先頭に置き、`headerLeft` を押します。 |
| `ios={{ headerRightSymbol }}` | `string` | | iOS: その名前の SF Symbol(`"slider.horizontal.3"`)を表示する UIKit 自身のバーボタンで、`headerRight` のビューの代わりになります。これを押すと `headerRight` の最初の押下可能なビューが押されたことになり、VoiceOver はそのビューのラベルを読み上げます。`headerRightSystemItem` が優先されます。SF Symbols にない名前の場合は `headerRight` がそのまま表示されます。Android では `headerRight` がそのまま表示されます。 |
| `ios={{ headerLeftSymbol }}` | `string` | | iOS: 同様のものをヘッダーの先頭に置き、`headerLeft` を押します。 |
| `headerTitle` | `JSX.Element` | | iOS と Android: タイトルの代わりになるビュー。 |
| `headerLargeTitle` | `boolean` | `false` | iOS: 内容のスクロールに合わせてバーに縮小されるラージタイトル。 |
| `headerBackTitle` | `string` | | このページへ戻る戻るボタンのラベル(iOS。Android では上矢印がスクリーンリーダーにこれを伝えます)。 |
| `animation` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | ページの表示と退場のしかた。 |
| `statusBar` | `{ foreground?, hidden?, animated? }` | | iOS と Android: ページが最上位にある間のステータスバー([ステータスバー](../modules/nsh-base.md#status-bar))。 |
| `popOnSwipe` | `boolean` | `true` | インタラクティブな戻るジェスチャー(iOS のスワイプバック、Android の予測型戻る)で pop されます。戻るボタンはどちらの場合も pop します。 |
| `popOnBack` | `boolean` | `true` | あらゆる戻る操作でページが pop されます: 戻るボタン、Android の戻る、デスクトップの戻るキー、ブラウザーの戻るボタン、スワイプ。 |
| `onBackPress` | `() => void` | | ユーザーがページで戻るを押しました。`popOnBack` により pop されたかどうかは問いません。 |
| `onDismiss` | `() => void` | | ユーザーがページを pop しました。そのルートはすでに取り除かれています。 |
| `style`, `class` | | | ページの内容ビュー。 |

ヘッダーの項目は通常のビューなので、押下可能にもリアクティブにもできます。

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

色付きのシステムヘッダー(Rust では `header_style_with` は型付きスタイルを受け取ります: `bg`、`text_color`、ヘッダーのボタンの色である `tint_color`。テーマカラーは外観に追従します):

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

ヘッダーを表示しないページにも、周囲にはシステムバーがあります。内容には[セーフエリア](../elements/safe-area.md)のインセットでパディングを付けてください。

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

### ヘッダー下のセーフエリア

ページ内では、`env(safe-area-inset-*)` 変数とページのインセット(Rust では `Scope::insets`、TSX では `safeAreaInsets()`)は、ページ内のシステムヘッダーより下の領域を指します。ヘッダーが透明な場合、内容はページの最上部から始まり、上のインセットはヘッダーの高さになります。そのため、`env(safe-area-inset-top)` でパディングすればテキストがヘッダーに重ならず、背景画像はページ全体に広がります。ラージタイトルを使う場合は、スクロール時にタイトルが折りたたまれるよう、スクロールビューをページの直下に置いてください。デスクトップとウェブでは、内容はページのヘッダースロットの下から始まります。

<a id="keeping-the-user-on-a-page-poponback"></a>

## ユーザーをページに留める: popOnBack

未保存の変更を破棄する前に確認するには、失うものがある間は `pop_on_back`(TSX では `popOnBack`)を false に設定し、戻る操作(`.on_back_press(..)`、TSX では `onBackPress`)を処理して、ユーザーが同意したら pop します。

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

`pop_on_back(false)`(`popOnBack={false}`)を指定すると、ページはあらゆる戻る操作(戻るボタン、Android の戻るボタンとジェスチャー、デスクトップの戻るキー、ブラウザーの戻るボタン、スワイプ)で留まり、戻る操作のイベントがユーザーの試行を知らせます。コードからの pop(ルートの削除、`nav.pop()`)は、これまでどおり pop されます。

> [!IMPORTANT]
> `pop_on_back` / `popOnBack` は、true か false を返すコールバックではなくプロパティです。メインスレッドはアプリのコードを決して待たないためです。ユーザーがスワイプを始めたり戻るを押したりすると、システムはそのページを離れてよいかをすぐに問い合わせ、NSH はすでに持っているプロパティからネイティブに回答します。失うものができた時点(上の例ではテキストから)で、ユーザーが離れようとする前に設定してください。

`pop_on_swipe(false)`(`popOnSwipe={false}`)はより軽いオプションです。インタラクティブなジェスチャー(iOS のスワイプバック、Android の予測型戻るアニメーション)だけを無効にし、戻るボタンは引き続き pop します。

<a id="dialogs"></a>

## ダイアログ

ダイアログ(Rust では `nsh_base` の `dialog()`、TSX では `Dialog`)は、他のすべての上に、専用のネイティブウィンドウレイヤーで内容を表示します。iOS では表示されたビューコントローラー、Android ではダイアログウィンドウ、デスクトップとウェブではウィンドウ全体を覆うレイヤーです。見た目はアプリ側で決めます。Rust では、ダイアログはビュー内(`when` の中)にある間表示され、その子がダイアログを満たします。バックドロップとポップアップはビューとして描画してください。TSX では、`class` と `style` が子を保持するポップアップをスタイルし、`backdropClass` または `backdropStyle` がその背後にバックドロップを加え、`open` がそれを制御します。

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

Escape、Android の戻るボタン、バックドロップの押下(TSX ではバックドロップ、Rust ではネイティブシート)、シートの下スワイプは、ネイティブにダイアログを閉じます(`close_on_escape`、`close_on_backdrop_press`、`close_on_swipe`。TSX では `closeOnEscape`、`closeOnBackdropPress`、`closeOnSwipe`。いずれもデフォルトは true)。Rust では、`on_cancel` がすべての試行を通知し、`on_close` が閉じたことを通知するため、そこではダイアログをビューから外してください。アプリが描画するバックドロップは、上のように自身の押下ハンドラーで閉じます。TSX では、`onOpenChange({ open: false, reason })` が通知するため、そこでは `open` を `false` に設定してください。先に確認するには、フラグを false に設定し、キャンセルイベント(`on_cancel`、`onCancel`。すべての試行を通知します)を処理してから、自分でダイアログを閉じます。iOS では、`.presentation(ModalPresentation::PageSheet)` または `FormSheet`(`presentation="pageSheet"` または `"formSheet"`)により、背後の内容が見えたままのシートが表示されます。

すべてのプロパティは [Dialog](../elements/dialog.md) を参照してください。ダイアログ内では、`env(safe-area-inset-*)` 変数とインセットはダイアログ自身のものです。システムダイアログ(アクション付きのアラート、アクションシート)には、`nsh_base`(TSX: `nsh/base`)の [`AlertDialog`](../modules/nsh-base.md#alertdialog) を使ってください。

<a id="the-android-back-button"></a>

## Android の戻るボタン

Android では、戻るボタン(またはジェスチャー)は次の順で処理されます。

1. 最上位のダイアログ: キャンセルを通知し(`on_cancel`、`onCancel`)、`close_on_escape` / `closeOnEscape` が true(デフォルト)の間は閉じます。
2. アプリの戻るリスナー(Rust では `on_back_press`、TSX では `nsh/mobile` の `BackHandler`)。最後に追加されたものから順に呼ばれます。
3. 最上位のスタック: その最上位のページが戻る操作を通知し、`pop_on_back` / `popOnBack` が true の間は pop します。
4. 誰も処理しなかった場合: アプリが終了します。

リスナーは、操作を処理したときに `true` を返します。これによりスタックの pop が防がれます。リスナーが登録されている間、Android の戻るジェスチャーは pop のプレビューを表示しません(アプリはジェスチャーの終了後にのみ応答します)。そのため、リスナーは操作を横取りする可能性がある間だけ追加してください。

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

エフェクト内で作成したリスナーは、エフェクトが再実行されるか、そのコンポーネントが破棄されるまで有効です。TSX では、`BackHandler.on` が返す関数でも停止できます。TSX では、`BackHandler.exitApp()` でアプリを終了します。`nsh/mobile` は iOS でもインポートでき、その場合 `BackHandler` の呼び出しはすぐに戻るため、同じコードが両方のプラットフォームで動作します。[プラットフォーム固有のコード](./platform-specific.md)を参照してください。

<a id="tabs-and-other-layouts"></a>

## タブとその他のレイアウト

タブバーはアプリ独自の UI で、プリミティブから描画します。押下可能なビューの行と、選択中のタブを保持するシグナルで構成し、選択中のタブの内容は [`when` / `<If>`](../elements/control-flow.md)(TSX では関数の子)で描画します。切り替え中も各タブの状態を保つには、タブごとに専用のスタックとルートを用意してすべてマウントしたままにし、非アクティブなものは `display: none` で隠します。

<a id="related"></a>

## 関連項目

- [`nsh/base`](../modules/nsh-base.md): `nav_stack`、`nav_page`、`dialog`、`createNavStack`、`NavStack`、`NavPage`、`Dialog` のリファレンス。インセットについては[セーフエリア](../elements/safe-area.md)。
- ページとダイアログの[ステータスバー](../modules/nsh-base.md#status-bar)。
- [`AlertDialog`](../modules/nsh-base.md#alertdialog)。
- [`BackHandler`](../modules/nsh-mobile.md#backhandler): `BackHandler`。
