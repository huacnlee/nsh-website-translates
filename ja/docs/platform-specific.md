---
title: "プラットフォーム固有のコード"
description: "スマートフォン、デスクトップ、ブラウザ向けに 1 つのアプリを書く方法。ios={{}} / android={{}} / desktop={{}} / web={{}} 内のプラットフォーム専用 props、nsh/mobile と nsh/desktop モジュール、platform.os と platform.select、プラットフォーム別の Tailwind バリアントを扱います。"
order: 17
group: platforms
source_hash: 3943d421295a93f3
---

# プラットフォーム固有のコード

1 つの NSH バンドルは、iOS、Android、macOS、Windows、Linux（および Mac Catalyst）で動作し、[Web ランタイム](./web.md)を通じてブラウザーでも動作します。アプリの大部分はプラットフォームの判定を必要としません。要素、スタイル、レイアウト、モジュールはどこでも同じように動作し、それらから作るコンポーネントの見た目もどこでも同じです。特定のプラットフォームに固有の処理が本当に必要な場合、NSH はそのための明確な置き場所を用意しているため、プラットフォーム固有のコードは目に見える形で、かつ局所化されます。

| Rust | TSX | 用途 |
|---|---|---|
| [ビルダーメソッド（`.ripple(..)`、`.input_accessory(..)`）](#platform-only-props) | [`ios={{…}}`、`android={{…}}`、`desktop={{…}}`、`web={{…}}`](#platform-only-props) | 1 つのプラットフォームにだけ存在する props。 |
| [`on_back_press`、`nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`、`nsh/desktop`](#platform-modules) | モバイルプラットフォームだけ、またはデスクトップだけにある API。 |
| [`os()`、`idiom()`、`is_desktop()`](#platformos-and-platformselect) | [`platform.os`、`platform.desktop`、`platform.select`](#platformos-and-platformselect) | プラットフォームごとの値やコードの選択。 |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [`ios:` / `android:` / `web:` クラス](#platform-variants-in-tailwind) | プラットフォームごとのスタイル。 |

<a id="desktop-and-mobile"></a>

## デスクトップとモバイル

すべてのプラットフォームは、1 つのルールによってデスクトップかモバイルのどちらかに分類されます。デスクトップは macOS、Windows、Linux、およびデスクトップ向けの操作体系（マウスと広いウィンドウ、[Web](./web.md)）のブラウザーです。モバイルは iOS、Android、およびスマートフォンやタブレット向けの操作体系のブラウザーです。Mac Catalyst は iOS バックエンドで動作するため、これもモバイルであり、`ios={{…}}` props を持ちます。`desktop={{…}}` props、`platform.select({ desktop, mobile })`、`platform.desktop`、`platform.idiom === "desktop"` はすべてこのルールに従います。`nsh/base` のコンポーネントも同様です（メニューはデスクトップではポップアップ、モバイルではシートになります）。Rust では `is_desktop()` も同様です。

`nsh/desktop` の `isAvailable` が答えるのはより限定的な問いで、そのモジュールのウィンドウおよびメニュー API が動作するかどうかです。これらは macOS、Windows、Linux で動作します。レイアウト、密度、入力の分岐には `platform.desktop` を使い、`Window` と `Menu` の呼び出しの分岐には `isAvailable` を使ってください。

<a id="platform-only-props"></a>

## プラットフォーム専用の props

Rust では、1 つのプラットフォームだけが持つ prop も他のものと同じビルダーメソッドです（`.ripple(..)`、Android 向けの `.elevation(..)`、iOS 向けの `.input_accessory(..)`、デスクトップ向けの `.window_drag(..)`）。他のプラットフォームではそれらは無視されます。TSX では、1 つのプラットフォームにのみ存在する props は、そのプラットフォーム名のオブジェクトにまとめられます。各要素は `ios`、`android`、`desktop`（macOS、Windows、Linux、およびデスクトップ向けの操作体系のブラウザー）、`web`（ブラウザー）を受け付けます。他のプラットフォームではそのオブジェクトは無視され、対応するプラットフォームでは、そのキーだけが適用されます。デスクトップのブラウザーでは `desktop` と `web` の両方が適用されます。

```rust tabs
use nsh_base::dialog;
use nsh_core::{
    Ripple,
    element::{AutoFill, Orientation}, prelude::*,
};

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0000001f).into()),
        ..Ripple::default()
    })
    .elevation(px(4.0))
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .child(text("Open"))

input().placeholder("Code").auto_fill(AutoFill::OneTimeCode)

when(shown, || {
    dialog()
        .supported_orientations([Orientation::Portrait])
        .status_bar_translucent(true)
        .child(…)
})
```

```tsx tabs
<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(0,0,0,0.12)" }, elevation: 4 }}
  style={{ padding: 16, borderRadius: 12, backgroundColor: "#ffffff" }}
>
  <Text>Open</Text>
</View>

<Input
  placeholder="Code"
  ios={{ textContentType: "oneTimeCode" }}
/>

<Dialog open={open()} ios={{ supportedOrientations: ["portrait"] }} android={{ statusBarTranslucent: true }}>
  …
</Dialog>
```

TSX のオブジェクトは他の prop と同様にリアクティブです。オブジェクトから削除されたキーはクリアされます。

現在存在するもの:

| Rust | TSX | 対象 | 説明 |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | すべての要素 | 押下中のマテリアルリップル: color、borderless、radius、foreground。 |
| `.elevation(..)` | `android={{ elevation }}` | すべての要素 | ビューの形状から作られるマテリアルシャドウ（単位はポイント）。 |
| | `android={{ accessibilityLiveRegion }}` | すべての要素 | `"none"`、`"polite"`、`"assertive"`: TalkBack がビューの変更を読み上げます。 |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | ダイアログのコンテンツがステータスバーの下まで広がります。 |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | キーボードの上に表示される `InputAccessoryView`。 |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | iOS 独自のオートフィル種別名（Rust の `AutoFill` は両プラットフォームを扱います）。 |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | 許可する画面の向き。 |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | ページ履歴を戻る・進むスワイプ。 |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | ヘッダーの末尾にある UIKit 標準のバーボタンで、押すと `headerRight` が実行されます。 |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | ヘッダーの先頭にある UIKit 標準のバーボタンで、押すと `headerLeft` が実行されます。 |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | ヘッダーの末尾にある、SF Symbol を表示する UIKit 標準のバーボタンで、押すと `headerRight` が実行されます。 |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | ヘッダーの先頭にある、SF Symbol を表示する UIKit 標準のバーボタンで、押すと `headerLeft` が実行されます。 |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS: トラックパッドの 2 本指スワイプでページ履歴を戻る・進む。Windows: タッチスクリーンのスワイプ。Linux: タッチパッドのスワイプ。 |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | すべての要素 | 押すと、システムのタイトルバーと同じようにウィンドウをドラッグできます（[nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own) を参照）。 |

TSX では、`desktop={{…}}` と `web={{…}}` はどこでも受け付けられます。型（`IOSProps`、`AndroidProps`、`DesktopProps` とその要素ごとの形式）によって、各要素が何を受け取るかをエディターが把握できます。

すべてのプラットフォームで意味を持つものはトップレベルの prop です（Rust では同名のメソッド）。それは意味を持つ場所で適用されます。`NavPage` の `title`、`headerStyle`、`headerLargeTitle`、`headerBackTitle` は iOS と Android のシステムヘッダーを設定し、その `header` スロットはデスクトップと Web のヘッダーになります。`Dialog` の `presentation` は iOS のシートを選択します。`AlertDialog.show` の `closeOnBackdropPress`、`pagingEnabled`、`refreshing`、`hitSlop` などはすべてのプラットフォームで動作します。プラットフォーム独自のシステム機能はそのプラットフォームのオブジェクトに置き、複数のプラットフォームにある場合は、それぞれのオブジェクトに同じ名前で置きます。たとえば `WebView` の `allowsBackForwardNavigationGestures`（システムによるページ履歴のスワイプ操作）は `ios={{…}}` と `desktop={{…}}` にあります。

<a id="platform-modules"></a>

## プラットフォームモジュール

Rust では、1 つのプラットフォームにだけある API は、`nsh_core::prelude`（`on_back_press`、`input_accessory_view`）と `nsh_core::element::desktop`（ウィンドウ: `set_title`、`set_title_bar`、`title_bar`、`minimize`、`toggle_maximize`、`toggle_full_screen`、`set_frame`、`set_level`、`order_front`、`close_window`。メニュー: `set_application_menu`、`popup_menu`）の関数です。それ以外のプラットフォームでは何も行いません。TSX では、`nsh/mobile` が iOS と Android の API（一部は一方のプラットフォーム専用）を、`nsh/desktop` がデスクトップの API を提供します。どちらもすべてのプラットフォームでインポートできるため、1 つのバンドルがどこでも動作します。他のプラットフォームでは、それらの関数はすぐに戻り、コンポーネントは領域を取りません。それぞれ `isAvailable` をエクスポートしており、これは対応するプラットフォームで `true` になります。`platform.os` でそれらを区別できます。

### nsh/mobile

`isAvailable` は iOS（Mac Catalyst を含む）と Android で `true` です。両プラットフォームに、システムのタブバーである [`TabBar`](../modules/nsh-mobile.md#tabbar) があります。

#### BackHandler (Android)

| Rust | TSX | 説明 |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | ダイアログの後、スタックの前に、戻るボタンを監視します。処理した場合は `true` を返してください。リスナーは、それを追加したコンポーネント（またはエフェクト）とともに破棄されます。TSX では、この呼び出しはリスナーを早めに停止する関数も返します。 |
| | `BackHandler.exitApp()` | アプリを終了します。 |

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let full_screen = signal(false);
    // Back leaves full screen before it leaves the page. The listener goes
    // with the view.
    on_back_press(move || {
        if !full_screen.get_untracked() {
            return false;
        }
        full_screen.set(false);
        true
    });
    // …
}
```

```tsx tabs
import { BackHandler } from "nsh/mobile";

function Player() {
  // Back leaves full screen before it leaves the page. The listener goes
  // with the component.
  BackHandler.on("press", () => {
    if (!fullScreen()) return false;
    fullScreen.set(false);
    return true;
  });
  // …
}
```

戻るボタンは、最前面のダイアログが最初に処理し、次に戻るリスナー（新しいものから順）、その次に最前面のナビゲーションスタックが処理し、誰も処理しなかった場合はアプリが終了します。[ナビゲーション](./navigation.md#the-android-back-button)を参照してください。

#### InputAccessoryView (iOS)

| Rust | TSX | 説明 |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | ネイティブ ID（`.input_accessory(..)`、`ios={{ inputAccessoryViewID }}`）を指定した入力のキーボードの上に表示されるバー。 |

[フォームとキーボード](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview)を参照してください。

### nsh/desktop

Rust アプリは `nsh_core::element::desktop` で独自のタイトルバーを描画します（[Rust でのビルド](./rust.md#desktop-title-bars)）。TSX のモジュール:

| エクスポート | 説明 |
|---|---|
| `Window` | ウィンドウ: `setTitle`、アプリ独自のタイトルバー用の `setTitleBar({ style: "hidden" })`、`minimize`、`toggleMaximize`、`toggleFullScreen`、`close`。 |
| `titleBar` | 非表示のタイトルバーの高さと、システムのウィンドウコントロールが占める領域（リアクティブ）。 |
| `Menu` | `setApplicationMenu(items)`（ショートカット付きのメニューバー）と `popup(items, at?)`（コンテキストメニュー）。 |
| `isAvailable` | ウィンドウおよびメニュー API が動作する場合（macOS、Windows、Linux）は `true`。デスクトップのブラウザーは `platform.desktop` で、ブラウザー自身のウィンドウとメニューがそのまま使われます。 |

[nsh/desktop](../modules/nsh-desktop.md) を参照してください。

<a id="the-status-bar"></a>

### ステータスバー

両プラットフォームで、ステータスバーは、最前面のビューコントローラーが決定する UIKit と同様に、最前面のページまたはダイアログに属します。[`NavPage` と `Dialog` は `statusBar` を受け取ります](../modules/nsh-base.md#status-bar)（Rust では `.status_bar(StatusBarStyle::Light)`、または他のフィールドには `StatusBarSetting`）。指定できるのは `foreground`（`"auto"`、暗い背景用の `"light"`、明るい背景用の `"dark"`）、`hidden`、`animated` です。最後に表示されたページまたはダイアログがフィールドごとに優先され、それが閉じられると、その下にあるものが再び適用されます。`nsh.json` の `"statusBar"` は、それらの下にあるアプリのデフォルトです。

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> impl IntoElement {
    nav_page()
        .header_visible(false)
        .status_bar(StatusBarStyle::Light)
        .child(view().flex_1().bg(black()))
}
```

```tsx tabs
import { View } from "nsh";
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light" }}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>…</View>
    </NavPage>
  );
}
```

ネイティブアプリに組み込まれたアプリでは、iOS のステータスバーはホストアプリのビューコントローラーが決定します。`nsh.json` で `"capabilities"` を宣言しているアプリでは、ステータスバーを変更するために `"statusBar": true` が必要です。

<a id="platformos-and-platformselect"></a>

## platform.os と platform.select

Rust の `os()` と、TSX の `nsh` からの `platform` 定数は、アプリが動作している場所を示します: `Os::Ios`、`Os::Android`、`Os::MacOs`、`Os::Windows`、`Os::Linux`、`Os::Web`、そして `platform.os` は `"ios"`、`"android"`、`"macos"`、`"windows"`、`"linux"`、`"web"` のいずれかです（Mac Catalyst は `"ios"` で、どちらの操作体系でも `platform.catalyst` です。[macOS バックエンド](./macos.md)は `"macos"`、[Linux バックエンド](./linux.md)は `"linux"`、[Windows バックエンド](./windows.md)は `"windows"` で、それらの要素は `desktop` props を適用します。[ブラウザー](./web.md)は `"web"` で、`platform.desktop` が `true` のときは `desktop` props も適用します）。バージョン、操作体系、その他については[デバイスと環境](./device-and-environment.md#the-platform)を参照してください。

```rust tabs
use nsh_core::{element::Os, prelude::*};

if os() == Os::Android {
    // …
}
```

```tsx tabs
import { platform } from "nsh";

if (platform.os === "android") {
  // …
}
```

### platform.select

Rust では `match os()` が値を選択し、デスクトップ用には `is_desktop()` を使います。TSX では、`platform.select(spec)` がこのプラットフォームに対応する値を返します。まず OS 固有のキーを探し、次に[上記のルール](#desktop-and-mobile)に従って `desktop` または `mobile`（`platform.desktop`）、続いて `native`（Web 以外のすべてのプラットフォーム）、最後に `default` を探します。

```rust tabs
use nsh_core::{element::Os, prelude::*};

fn card() -> View {
    let card = view().rounded(px(12.0)).bg(white());
    match os() {
        Os::Ios => card.shadow_md(),
        Os::Android => card.border_1().border_color(rgb(0xe5e7eb)),
        _ => card,
    }
}

let hint = match os() {
    Os::Ios => "Swipe down to close",
    Os::Android => "Press back to close",
    _ => "Close",
};
```

```tsx tabs
const styles = {
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    ...platform.select({
      ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.12)" },
      android: { borderWidth: 1, borderColor: "#e5e7eb" },
    }),
  },
};

const hint = platform.select({ ios: "Swipe down to close", android: "Press back to close", default: "Close" });
```

何も一致せず `default` もない場合は、`undefined` を返します。

<a id="rendering-different-components"></a>

### 異なるコンポーネントのレンダリング

選択が変わらない場合は、同じ方法で（TSX ではモジュールレベルで）コンポーネントを選択します。

```rust tabs
fn spinner() -> AnyElement {
    if os() == Os::Ios {
        ios_spinner().into_element()
    } else {
        material_spinner().into_element()
    }
}
```

```tsx tabs
const Spinner = platform.select({ ios: IosSpinner, default: MaterialSpinner })!;
```

または [`when` / `<If>`](../elements/control-flow.md) を使ってインラインで選択します。

```rust tabs
when(os() == Os::Ios, || input_accessory_view("bar").child(…))
    .otherwise(|| text("Android has no input accessories."))
```

```tsx tabs
<If when={platform.os === "ios"} else={<Text>Android has no input accessories.</Text>}>
  <InputAccessoryView nativeID="bar">…</InputAccessoryView>
</If>
```

<a id="platform-variants-in-tailwind"></a>

## Tailwind のプラットフォームバリアント

Rust ではプラットフォームごとのスタイルに `.when(os() == Os::Ios, |v| ..)` を使います。TSX では、`ios:`、`android:`、`web:` バリアントによって、1 つのプラットフォームにだけクラスを適用できます。

```rust tabs
view()
    .rounded_xl()
    .bg(white())
    .p_4()
    .when(os() == Os::Ios, |v| v.shadow_md())
    .when(os() == Os::Android, |v| v.border_1().border_color(rgb(0xe4e4e7)))
```

```tsx tabs
<View class="rounded-xl bg-white p-4 ios:shadow-md android:border android:border-zinc-200">…</View>
<Text class="text-base android:font-medium">Title</Text>
```

<a id="prefer-shared-behavior"></a>

## 共通の動作を優先する

プラットフォームの判定に頼る前に、その違いがユーザーにとって重要かどうかを検討してください。要素とスタイルは、違いがあるべき部分（スクロールの物理挙動、テキストレンダリング、キーボード、アクセシビリティ）では各プラットフォームのネイティブな動作にすでに対応づけられており、ユーザーが一貫性を期待する部分（アプリ独自のルック）では同じままです。プラットフォームの判定は、ユーザーが頼りにしているプラットフォームの慣習に限って使うのが最適です。たとえば Android の戻るボタンとトースト、iOS のシートとラージタイトル、オートフィル名、Android のリップルなどです。

<a id="related"></a>

## 関連項目

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)と[`BackHandler`](../modules/nsh-mobile.md#backhandler): リファレンス。
- [`nsh` のデバイス API](../modules/nsh.md#device): `platform`。
- [ネイティブコンポーネント](./native-components.md): ホストアプリが各プラットフォームで提供するビューの使用。
- [Tailwind](./tailwind.md): すべてのバリアント。
