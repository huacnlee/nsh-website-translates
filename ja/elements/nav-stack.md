---
title: "NavStack"
description: "ネイティブのナビゲーションスタック: NavStack、NavPage、createNavStack、ページのプッシュとポップ、ヘッダースロット、ページの離脱、そして各プラットフォームでのスタックの表示方法。"
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---

# NavStack

ナビゲーションスタックは一度に1ページを表示し、その下のページを保持します。iOS と Mac Catalyst では `UINavigationController` を使い、システムヘッダーとスワイプバックを備えます。Android ではツールバーと予測型戻る操作を備えたページのスタックになります。
デスクトップ (macOS、Windows、Linux、GPUI) と Web では、各ページが上部にアプリ独自のヘッダーを表示し、戻るキーとブラウザーの戻るボタンでページが取り除かれます。`NavStack` がスタックで、`NavPage` がそのページの1つです。

スタックはナビゲーションの動作 (遷移、戻るジェスチャーとボタン、覆われている間のページの状態) を担います。ページの内容とデスクトップのヘッダーはアプリ側のものです。

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

iOS と Android では、ページは `title` と戻るボタンを持つシステムヘッダーを表示します。デスクトップと Web では `header` を表示します。スマートフォンのみを対象とするアプリでは `header` を省略し、デスクトップのみを対象とするアプリではシステムヘッダーのオプションを省略します。[ナビゲーションガイド](../docs/navigation.md)では、アプリ全体のナビゲーション (スタックの状態、ダイアログ、Android の戻るボタン、タブ) を順に説明しています。

<a id="how-a-stack-works"></a>

## スタックの仕組み

- スタックのページは **ルート** です。ルートは任意の値で、スタックの最下部から最上部の順に並びます。通常、ルートはページを指す名前とそのパラメーターを持ちます。
- TSX では、ルートは `createNavStack` が作る状態に保持されます。`NavStack` は push ごとに子関数を1回呼び出し、その結果をページとして表示します。ルートがスタックにある間はそのページを保持するため、他のページに覆われていてもページの状態 (シグナル、スクロール位置、入力) は維持されます。
- Rust では、スタックの子がそのページです。`nav_stack()` に入れた `nav_page()` は push され、外したものは pop されます。ルートはシグナルに保持し、下にあるページが状態を保てるよう、ルートをキーにして `each(..)` でページを描画します。
- push ごとに独立したページになります。同じルート値を2回 push した場合も同様です。
- ユーザーがネイティブの操作でページを離れると (戻るボタン、スワイプバック、Android の戻る、デスクトップの戻るキー、ブラウザーの戻る)、そのページは取り除かれます。TSX ではスタックが状態からそのルートを削除するため、`nav.routes()` は常にユーザーが見ているものと一致します。Rust ではページが `on_dismiss` を通知するので、そこでルート (とその上のルート) を削除します。
- TSX では、子関数が `<NavPage>` 以外を返した場合、既定のオプションを持つページになります。ヘッダーなどのオプションを設定するには `<NavPage>` を返してください。

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

`routes` から始まるスタック (最下部から最上部の順) の状態を作成します。モジュールレベルなどで一度だけ作成し、`<NavStack state>` に渡してください。どのコードからもインポートしてナビゲートできます。

| メンバー | 説明 |
|---|---|
| `routes: Accessor<readonly R[]>` | ルートの一覧 (最下部から最上部)。リアクティブです。 |
| `push(route: R): void` | ページを push します。 |
| `pop(count?: number): void` | `count` ページを pop します (既定は 1)。少なくとも1ページは常に残ります。 |
| `popToRoot(): void` | 最初のページまで pop します。 |
| `replace(route: R): void` | 最上部のページを置き換えます。 |
| `setRoutes(routes: R[]): void` | ページを置き換えます。残るルート (同じ値) は、そのページと状態を保持します。 |
| `remove(route: R): void` | `route` (`===` で比較) に一致する最上位のページを、スタック内の位置にかかわらず削除します。 |

Rust では、同じ操作はルートのシグナルの変更で行います。`routes.update(|r| r.push(route))` は push、`r.pop()` は pop、`r.truncate(1)` は保持している最初のページまで pop、`routes.set(..)` はページの置き換えです。

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

## NavStack props

| プロパティ | Rust | 型 | 説明 |
|---|---|---|---|
| `state` | ページが子要素になる | `NavStackState<R>` | ルートを保持する状態 (`createNavStack`)。必須です。 |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | ルートを描画します。オプションを指定するには `<NavPage>` を返します。必須です。 |
| `style`、`class` | スタイルメソッド | | スタックのスタイル。通常は `flex: 1` です。 |
| `testID` | `.test_id(..)` | `string` | テストと `nsh test --trace` でスタックを見つけます。 |

TSX の子関数は、ルートの値そのものと、スタック内での位置を返すアクセサーを受け取ります。

## NavPage props

`NavPage` はスタックの1ページです。ページの内容、デスクトップと Web での `header`、iOS と Android でのシステムヘッダーのオプションを保持します。Rust では `nav_page()` がページを返し、そのビルダーメソッドはプロパティ名をスネークケースにしたものです。

| プロパティ | Rust | 型 | 既定値 | 説明 |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | なし | デスクトップと Web: ページのヘッダー。ページの上部に、ページと同じ幅、レイアウトで決まる高さで配置され、その下に内容が続きます。 |
| `title` | `.title(..)` | `string` | なし | iOS と Android: システムヘッダーのタイトル。 |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS と Android: システムヘッダーを表示します。 |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS と Android: 内容が透明なシステムヘッダーの下まで広がります。 |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS: このページが最上部にある間、システムのタブバーが退場します。遷移の中でページと同じアニメーションで動き、バーが再構築されることはありません。ページが pop されると戻ってきます。 |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS: 内容のスクロールに合わせてバーに縮小するラージタイトル。内容はヘッダーの下でスクロールします。 |
| `headerBackTitle` | `.header_back_title(..)` | `string` | なし | iOS と Android: このページに戻る戻るボタンのラベル (Android ではスクリーンリーダー向けの説明)。 |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS と Android: 戻るボタンを表示します。 |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | なし | iOS と Android: 戻るボタンの代わりに、システムヘッダーの先頭側に置かれる内容。 |
| `headerRight` | `.header_right(..)` | `JSX.Element` | なし | iOS と Android: システムヘッダーの末尾側に置かれる内容。 |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | なし | iOS と Android: タイトルの代わりに表示される内容。 |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | プラットフォーム依存 | iOS と Android: システムヘッダーの色。背景、タイトル (`color`)、ボタン (`tintColor`) の色です。 |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | なし | 同じ色をクラスで指定します。`bg-*`、タイトル用の `text-*`、ボタン用の `tint-*` です (Rust では `.bg(..)`、`.text_color(..)`、`.tint_color(..)`。外観に追従するテーマカラー)。`headerStyle` が優先されます。 |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | 戻るボタンとスワイプバックでページを pop します。[ページを離れる](#leaving-a-page)を参照してください。 |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | インタラクティブな戻るジェスチャーでページを pop します。iOS ではスワイプバック、Android では指に追従する予測型戻る操作です。戻るボタンはどちらの設定でも pop します。 |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | ページの出入りの方法。 |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | なし | `animation` の代わりに、WGSL シェーダーでページが出入りします。`shade(uv)` は、下のページを `sample_from`、このページを `sample_to` として読み取ります。`nsh.progress` は `duration` ミリ秒 (既定は 350) かけて 0 から 1 に変化し、ページが退場するときは 1 から 0 に戻ります。システムが動きの軽減を求めている場合、ページは自身の `animation` を使います。[Shader](./shader.md)を参照してください。 |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | なし | iOS と Android: ページが最上部にある間のステータスバー。[Status bar](../modules/nsh-base.md#status-bar)を参照してください。 |
| `style`、`class` | スタイルメソッド | | なし | ページのスタイル。 |
| `children` | `.child(..)` | `JSX.Element` | なし | 内容。 |
| `testID` | `.test_id(..)` | `string` | なし | テストと `nsh test --trace` でページを見つけます。 |

## NavPage events

| イベント | Rust | 説明 |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | ユーザーがページで戻る操作をしました (ヘッダーの戻るボタン、Android の戻る、デスクトップでの Escape、Alt+Left、マウスの戻るボタン、ブラウザーの戻る)。`popOnBack` が pop を許可したかどうかにかかわらず発生します。 |
| `onDismiss` | `.on_dismiss(..)` | ユーザーがページを pop しました (戻るボタン、スワイプ)。TSX ではそのルートはすでに削除されており、Rust ではここで削除します。 |

<a id="header-slots"></a>

## ヘッダースロット

`header`、`headerLeft`、`headerRight`、`headerTitle` はスロットです。シグナルを読み取り、押下を処理し、ページの表示中に更新される通常の要素です。`header` はデスクトップと Web ではアプリのヘッダー全体になり、残りの3つは iOS と Android のシステムヘッダーに入ります。

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

ページの内容はヘッダーの下から始まります。iOS と Android では不透明なシステムヘッダーの下、デスクトップと Web では `header` の下です。`headerTransparent`、`headerLargeTitle`、`headerVisible={false}` を使うと、iOS と Android では内容がページの最上部から始まります。ヘッダーとステータスバーを避けるには、[`env(safe-area-inset-top)`](./safe-area.md) または `safeAreaInsets()` を使ってください。

iOS では、`headerVisible={false}` は `popOnSwipe` と `popOnBack` が true の間、スワイプバックを有効に保ちます。インタラクティブな戻るジェスチャーが受理されると、遷移の開始とともに編集が終了するため、ドラッグ中にキーボードが閉じます。遷移をキャンセルすると、ほかのコントロールがフォーカスを取っていない場合に限り、同じエディターのフォーカスが復元されます。

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

## ページを離れる

`popOnBack={false}` は、たとえばフォームに未保存の変更があるときなどに、ユーザーをページにとどめます。false の間はスワイプバックが無効になり、戻るボタンとキーは pop せずに `onBackPress` を呼び出します。ユーザーに確認し、そのあとで自分で pop してください。

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
> ユーザーが戻れるかどうかは、操作の瞬間にシステムがメインスレッドで問い合わせます。メインスレッドが JS や Rust コードを待つことはありません。そのため NSH は、すでにマウントされている `popOnBack` の値で応答します。失うものができた時点で、ユーザーが戻る前に `popOnBack={false}` を設定してください。

`onBackPress` は、ページが pop される場合も含め、戻る操作のたびに呼び出されるため、ユーザーが戻ったことの通知にもなります。スワイプジェスチャーだけを無効にして戻るボタンは残すには、`popOnSwipe={false}` を使います。確認自体は [AlertDialog](./alert-dialog.md) で行います。

<a id="platform-notes"></a>

## プラットフォームごとの注意

- **iOS**: システムヘッダー、戻るボタン、スワイプバックを備えた `UINavigationController`。`headerLargeTitle` は UIKit のラージタイトルです。遷移の実行中に届いたスタックの変更は、遷移の終了時に適用されます。
- **Android**: ツールバー付きのスタックです。システムの戻るボタンで最上部のページが pop され、対応する Android バージョンでは予測型戻る操作が使われます。上矢印のスクリーンリーダー向けの説明は、下のページの `headerBackTitle`、またはシステムのものです。戻るボタンを自分で処理するには、[`BackHandler`](../modules/nsh-mobile.md#backhandler) の `BackHandler` を参照してください。
- **Mac Catalyst**: iOS と同じです。
- **デスクトップ (macOS、Windows、Linux、GPUI) と Web**: 各ページは上部に `header`、その下に内容を表示します。デスクトップでは Escape、Alt+Left、マウスの戻るボタンで戻り、Web ではブラウザーの戻るボタンで戻ります。

シートやフルスクリーンのフローなど、スタックとそのヘッダーの上に表示する内容には、[Dialog](./dialog.md) を使ってください。
