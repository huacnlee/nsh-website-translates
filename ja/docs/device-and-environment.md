---
title: "デバイスと環境"
description: "ウィンドウサイズ、カラースキーム、フォントスケール、セーフエリア、プラットフォーム、ピクセル密度、レイアウト方向の読み取りと、それらが変化したときの対応方法について説明します。"
order: 47
group: ui
demo: guide-device
source_hash: f61a9081e4276695
---

# デバイスと環境

アプリが動作する環境は、実行中に変化します。ウィンドウのサイズ変更(回転、スプリットビュー、Mac のウィンドウ)、ダークモードや大きな文字サイズへの切り替え、キーボードの表示と非表示などです。NSH はそれぞれを**リアクティブアクセサ**として公開しています。シグナルのように呼び出すと、それを読み取ったもの(スタイル、テキスト、算出値)が変更時に更新されます。リスナーを追加・削除する必要はありません。

Rust ではアクセサは `nsh_core::prelude` の関数です。TSX では記載のモジュールから取得します。

| Rust | TSX | 値 |
|---|---|---|
| `window()` | `windowSize()` (`nsh`) | サーフェスの幅と高さ(ポイント単位)。 |
| `dark()` | `colorScheme()` (`nsh`) | ダークまたはライト。システムのもの、またはアプリ独自のもの(`set_color_scheme`、`setColorScheme`)。 |
| `font_scale()` | `fontScale()` (`nsh`) | ユーザーが希望する文字サイズ(デフォルトに対する相対値。1 がデフォルト)。 |
| `safe_area()` | `safeArea()` (`nsh`) | システム UI に覆われていないサーフェスのインセット(上、右、下、左)。 |
| `cx.insets()` | `safeAreaInsets()` (`nsh`) | 呼び出したコンポーネントが描画される場所のインセット(ページ、ダイアログ)。 |
| `keyboard_height()`、`keyboard_duration()` | `keyboardFrame()` (`nsh`) | ソフトウェアキーボードの高さとアニメーション時間。 |
| `locale()` | `locale()` (`nsh`) | BCP 47 タグで表したユーザーのロケール(`"en-US"`、`"zh-Hans-CN"`)。`Intl` がデフォルトでフォーマットに使用します。 |
| `lifecycle()` | `lifecycle()` (`nsh`) | アプリが使用中かどうか。`active`、`inactive`(表示されているがフォーカスはない)、または `background`([バックグラウンド](#in-the-background))。 |
| `reduce_motion()`、`screen_reader()` | `reduceMotion()`、`screenReaderEnabled()` (`nsh`) | [アクセシビリティ](./accessibility.md)を参照してください。 |

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .pt(move || safe_area().top + px(16.0))
        .px(px(16.0))
        // A light and a dark value: the color follows the appearance natively.
        .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
        .child(
            text(move || {
                let size = window();
                format!(
                    "{} × {} pt, text at {:.2}×",
                    size.width.0.round(),
                    size.height.0.round(),
                    font_scale()
                )
            })
            .text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)),
        )
}
```

```tsx tabs
import { mount, Text, View, safeArea } from "nsh";
import { colorScheme, fontScale, windowSize } from "nsh";

function App() {
  return (
    <View style={{ flex: 1, paddingTop: safeArea().top + 16, paddingHorizontal: 16, backgroundColor: colorScheme() === "dark" ? "#0d1117" : "#ffffff" }}>
      <Text style={{ color: colorScheme() === "dark" ? "#e6edf3" : "#1f2328" }}>
        {Math.round(windowSize().width)} × {Math.round(windowSize().height)} pt, text at {fontScale().toFixed(2)}×
      </Text>
    </View>
  );
}

mount(App);
```

<a id="window-size-and-responsive-layout"></a>

## ウィンドウサイズとレスポンシブレイアウト

`window()`(TSX では `windowSize()`)は、NSH が描画するサーフェスのサイズです。スマートフォンでは画面、iPad のスプリットビューや Mac ではウィンドウ、NSH を組み込んだ場合はホストビューのサイズになります。サイズだけでなく、レイアウトそのものを変えるために使えます。

```rust tabs
use nsh_core::prelude::*;

fn gallery() -> impl IntoElement {
    let columns = || {
        let width = window().width.0;
        if width >= 700.0 { 4.0 } else if width >= 500.0 { 3.0 } else { 2.0 }
    };
    let side = move || px((window().width.0 - 32.0 - (columns() - 1.0) * 8.0) / columns());
    view().flex_row().flex_wrap().gap_2().child(each(
        photos,
        |p| p.id,
        move |p, _| image(move || p.with(|p| p.url.clone())).w(side).aspect_ratio(1.0),
    ))
}
```

```tsx tabs
import { Image, View } from "nsh";
import { windowSize } from "nsh";

function Gallery() {
  const columns = () => (windowSize().width >= 700 ? 4 : windowSize().width >= 500 ? 3 : 2);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Each of={photos}>
        {(p) => <Image src={p().url} style={{ width: (windowSize().width - 32 - (columns() - 1) * 8) / columns(), aspectRatio: 1 }} />}
      </Each>
    </View>
  );
}
```

多くの場合、フレックスボックス、パーセンテージ、`aspect_ratio`(`aspectRatio`)を使えば、サイズを読み取らなくても目的を達成できます。[レイアウト](./layout.md)を参照してください。Rust の `style_when(|| window().width.0 >= 640.0, |s| s.flex_row())` は幅に応じてスタイルを切り替えます。TSX で Tailwind を使う場合は、ブレークポイントバリアント(`sm:`、`md:`、`lg:`、`xl:`、`2xl:`、`max-*:`、`min-[…]:`)と `portrait:` / `landscape:` もウィンドウに追従します。`class="grid grid-cols-2 md:grid-cols-4"`。

<a id="dark-mode"></a>

## ダークモード

外観は、アプリが独自に設定しない限りシステムに従います。Rust でダークモードに対応する最も簡単な方法は、ライト用とダーク用の値を持つ色 `AdaptiveColor::rgb(light, dark)` を使うことです。外観が変わるとネイティブに切り替わり、実行すべき処理はありません。TSX では `dark:` Tailwind バリアントを使います。これは `colorScheme()` が `"dark"` のときに適用されます。

```rust tabs
view()
    .flex_1()
    .p_4()
    .bg(AdaptiveColor::rgb(0xffffff, 0x18181b))
    .child(
        text("Follows the system appearance")
            .text_color(AdaptiveColor::rgb(0x18181b, 0xf4f4f5)),
    )
```

```tsx tabs
<View class="flex-1 bg-white dark:bg-zinc-900 p-4">
  <Text class="text-zinc-900 dark:text-zinc-100">Follows the system appearance</Text>
</View>
```

それ以外の場合は、クロージャや算出値の中で `dark()`(TSX では `colorScheme()`)を読み取ります。TSX で多くの色を扱う場合は、パレットを一度だけ導出します。

```rust tabs
use nsh_core::prelude::*;

// `dark()` is reactive: the closure runs again when the appearance changes.
view()
    .flex_1()
    .bg(move || if dark() { rgb(0x0d1117) } else { rgb(0xf6f8fa) })
    .child(text("Hello"))
```

```tsx tabs
import { computed, Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = computed(() =>
  colorScheme() === "dark"
    ? { background: "#0d1117", surface: "#161b22", text: "#e6edf3", muted: "#8b949e" }
    : { background: "#f6f8fa", surface: "#ffffff", text: "#1f2328", muted: "#57606a" },
);

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Hello</Text>
</View>
```

Rust のコンポーネントも、ライトとダークの値を持つテーマ(`nsh.json` `"theme"`、[Rust でのビルド](./rust.md)を参照)から色を取得するため、システムに合わせて切り替わります。ステータスバーを背景に合わせるには、ページやダイアログに [`statusBar`](../modules/nsh-base.md#status-bar) を指定するか、アプリ全体に対して `nsh.json` で指定します。

<a id="an-app-with-its-own-appearance"></a>

### 独自の外観を持つアプリ

常にダーク(または常にライト)のアプリは `nsh.json` でそのことを宣言します。`dark()` と `colorScheme()`、アダプティブカラー、`dark:` クラス、テーマ、ステータスバーのデフォルトスタイル、アラートは、最初のフレームからそれに従います(パッケージ化されたアプリも、その外観で起動します)。

```json
{ "appearance": "dark" }
```

`set_color_scheme(Appearance::Dark)`(TSX では `nsh` の `setColorScheme`)は、アプリ内の外観設定のために実行時に外観を変更します。`Appearance::System`(`"system"`)は再びシステムに従います。

```rust tabs
use nsh_core::prelude::*;

view()
    .on_press(move || {
        set_color_scheme(if dark() { Appearance::Light } else { Appearance::Dark })
    })
    .role(AccessibilityRole::Button)
    .rounded_lg()
    .px_4()
    .py_2()
    .bg(AdaptiveColor::rgb(0xe5e5e5, 0x262626))
    .child(
        text(|| if dark() { "Light" } else { "Dark" })
            .text_color(AdaptiveColor::rgb(0x171717, 0xfafafa)),
    )
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme, setColorScheme } from "nsh";

<View onPress={() => setColorScheme(colorScheme() === "dark" ? "light" : "dark")} role="button" class="rounded-lg px-4 py-2 bg-neutral-200 dark:bg-neutral-800">
  <Text class="text-neutral-900 dark:text-neutral-50">{colorScheme() === "dark" ? "Light" : "Dark"}</Text>
</View>
```

> [!TIP]
> 開発中は両方の外観をテストしてください。`xcrun simctl ui booted appearance dark` で iOS シミュレーターを切り替えられ、Android ではクイック設定にダークテーマの切り替えがあります。変更はリロードなしで、すぐにアプリへ反映されます。

<a id="text-size"></a>

## 文字サイズ

`font_scale()`(TSX では `fontScale()`)は、デフォルトに対する相対値で表したユーザーの文字サイズ設定(iOS では Dynamic Type、Android ではフォントサイズ)です。テキストと入力は自動的にこれに従います。ユーザーが大きな文字を希望すれば、`fontSize: 16` はより大きく描画されます。要素ごとに、これを無効にしたり上限を設けたりできます。

| Rust(`text` と `input` に指定) | TSX(`<Text>` と `<Input>` に指定) | デフォルト | 説明 |
|---|---|---|---|
| `.allow_font_scaling(..)` | `allowFontScaling` | `true` | システムの文字サイズに従います。 |
| `.max_font_size_multiplier(..)` | `maxFontSizeMultiplier` | `0`(なし) | このテキストに適用される最大のスケール。 |

```rust tabs
text("Today")
    .text_size(px(34.0))
    .font_weight(FontWeight::BOLD)
    .max_font_size_multiplier(1.4)
```

```tsx tabs
<Text style={{ fontSize: 34, fontWeight: "700" }} maxFontSizeMultiplier={1.4}>Today</Text>
```

テキストに自動では追従しないレイアウトを調整するには、`font_scale()` を読み取ります。たとえば、文字が大きくなったときに行を列へ切り替える場合は、Rust では `.style_when(|| font_scale() > 1.3, |s| s.flex_col())`、TSX では `flexDirection: fontScale() > 1.3 ? "column" : "row"` を使います。

文字サイズによって拡大縮小されるのは、フォントのスケーリングを許可しているすべてのテキストと入力、およびプラットフォームのアラートとトーストです。長さはそのままのサイズを保ちます。ポイントまたはクラス(`p-4`、`rounded-lg`、`w-[2rem]`)で指定した余白、幅と高さ、角丸、枠線、画像が該当します。内容に合わせてサイズが決まるボックスは、テキストとともに大きくなります。

<a id="language-and-region"></a>

## 言語と地域

`locale()` は、BCP 47 タグで表したユーザーのロケール(Rust では `locale().as_str()`)です。TSX では、`Intl` がデフォルトでそのロケールに合わせて数値と日付をフォーマットするため、`new Intl.NumberFormat().format(1234.5)` は `en-US` では `1,234.5`、`de-DE` では `1.234,5` になります。独自の翻訳の文字列を選ぶには `locale()` を読み取ります。これを読み取っているテキストは、ロケールが変わると更新されます。

```rust tabs
use nsh_core::prelude::*;

fn greeting() -> &'static str {
    match locale().as_str().split('-').next() {
        Some("de") => "Willkommen",
        Some("zh") => "欢迎",
        _ => "Welcome",
    }
}

text(greeting)
```

```tsx tabs
import { Text } from "nsh";
import { locale } from "nsh";

const greetings: Record<string, string> = { en: "Welcome", de: "Willkommen", zh: "欢迎" };

<Text>{greetings[locale().split("-")[0]] ?? greetings.en}</Text>
```

<a id="in-an-embedding-app"></a>

## 組み込みアプリでの動作

ネイティブアプリの内部に表示されるアプリは、そのアプリが独自の設定を行っている場合、その設定に従います。組み込み API のロケールと文字サイズ(Rust では [GPUI](./gpui.md)、[macOS](./macos.md)、[Linux](./linux.md)、[Windows](./windows.md) 向けの `AppView::set_locale` と `set_font_scale`、Swift では [iOS](./ios.md) 向けの `locale` と `fontScale`、Java では [Android](./android.md) 向けの `setLocale` と `setFontScale`)は、システムの言語と文字サイズの代わりに使われます。`locale()`、`Intl`、`fontScale()` とテキストは、システムの変更に追従するのと同様に、これらにすぐ追従します。組み込み元のアプリがそれらを解除すると、システムの設定に戻ります。ネイティブアプリがユーザーに独自の言語や文字サイズを選ばせる場合に使ってください。

<a id="in-the-background"></a>

## バックグラウンド時

`lifecycle()`(TSX でも同じ)は、ユーザーがアプリを使用中かどうかを表します。フォアグラウンドでは `active`、アプリがまだ表示されているものの別のアプリやウィンドウにフォーカスがある間(またはアプリスイッチャーや着信など、システムが上に何かを表示している間)は `inactive`、表示されていない間は `background` になります。表示されていない状態とは、スマートフォンではバックグラウンド、デスクトップでは最小化、Web では非表示のタブを指します。他のアクセサと同様に、これを読み取ったものが更新されるため、エフェクトでライブフィード、ポーリング、動画をバックグラウンドで一時停止し、ユーザーが戻ったときに再開できます。

```rust tabs
effect(move || {
    if lifecycle() == Lifecycle::Background {
        feed.pause();
    } else {
        feed.resume();
    }
});
```

```tsx tabs
effect(() => {
  if (lifecycle() === "background") feed.pause();
  else feed.resume();
});
```

`background` は処理の一時停止に使い、ユーザーが変更した内容は変更のたびに保存してください。システムは、アプリがバックグラウンドに移ってから数秒で、その変更を読み取るエフェクトが実行される前にアプリを中断することがあります。ネイティブアプリの内部に表示されるアプリは、そのアプリの状態に従います。アプリが複数のウィンドウを持つ場合(iPad やデスクトップ)、ビューはそれが属するウィンドウに従います。テストでは、`nsh/test` の `app.setLifecycle("background")` でアプリをその状態にできます([テスト](./testing-and-trace.md#steps))。

<a id="safe-areas"></a>

## セーフエリア

ノッチ、ホームインジケーター、ステータスバー、Android のナビゲーションバー、Mac Catalyst のタイトルバーは、サーフェスの一部を覆います。NSH アプリはすべてのプラットフォームで端から端まで描画し、覆われた部分をインセットとして取得します。

- `safe_area()`(TSX では `safeArea()`)は、サーフェスのインセットを返します。
- コンポーネントの `cx.insets()`(TSX では `safeAreaInsets()`)は、**そのコンポーネントが描画される場所**のインセットを返します。ナビゲーションの[ページ](./navigation.md#safe-areas-under-the-header)内ではヘッダーより下で測定され、[ダイアログ](../elements/dialog.md)内ではダイアログのインセットになります。複数の場所に表示される可能性があるコンポーネントでは、こちらを優先してください。
- CSS の `env(safe-area-inset-top)`、`-right`、`-bottom`、`-left` は、`padding*` と `margin*` で、ビューが描画される場所のインセットに応じて任意のビューにパディングや間隔を設定します(`calc(env(safe-area-inset-bottom) + 8px)` は長さを加算します。Tailwind では `pt-[env(safe-area-inset-top)]`、Rust では `.p_safe_area()`、`.pt_safe_area()`、`.pb_safe_area_plus(px(8.0))` など)。パディングは、インセットが変わるとネイティブに更新されます([セーフエリア](../elements/safe-area.md))。

```rust tabs
use nsh_core::prelude::*;

fn screen() -> impl IntoElement {
    view()
        .pt_safe_area()
        .px_safe_area()
        .flex_1()
        .bg(white())
        .child(content())
        .child(bottom_bar())
}

// A component, for its `Scope`: the insets where it renders.
#[component]
fn BottomBar(cx: Scope<NoEvent>) -> impl IntoElement {
    // `cx.insets()`: the insets where the component renders.
    view()
        .flex_row()
        .pt(px(8.0))
        .pb(move || cx.insets().bottom + px(8.0))
}
```

```tsx tabs
import { View, safeAreaInsets } from "nsh";

function Screen() {
  return (
    <View class="flex-1 bg-white pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <Content />
      <BottomBar />
    </View>
  );
}

function BottomBar() {
  const insets = safeAreaInsets();
  return <View style={{ paddingBottom: insets().bottom + 8, paddingTop: 8, flexDirection: "row" }}>…</View>;
}
```

Android では、ツールバーの下に組み込まれたビューは、UIKit のセーフエリアと同様に、システムバーのうち自分と重なる部分だけを取得します。ステータスバーまで届かない場合、上のインセットはありません。

<a id="the-platform"></a>

## プラットフォーム

Rust の `os()`、`os_version()`、`idiom()`、`is_desktop()`、`is_catalyst()` と、TSX の `nsh` からの `platform` 定数は、アプリが動作している環境を表します。アプリの実行中は変化しません。

| Rust | TSX | 説明 |
|---|---|---|
| `os()` | `platform.os` | `Os::Ios`、`Os::Android`、`Os::MacOs`、`Os::Windows`、`Os::Linux`、または `Os::Web`(`os().name()` は TSX の文字列)。Mac Catalyst は iOS として扱われます。 |
| `os_version()` | `platform.version` | メジャーとマイナー。Android では API レベルと 0。 |
| `idiom()` | `platform.idiom` | `Idiom::Phone`、`Pad`、`Mac`、`Tv`、または `Desktop`。`Desktop` は `is_desktop()` が成り立つ場合に限ります。 |
| `is_desktop()` | `platform.desktop` | macOS、Windows、Linux、またはデスクトップブラウザー([デスクトップとモバイル](./platform-specific.md#desktop-and-mobile))。 |
| `is_catalyst()` | `platform.catalyst` | Mac Catalyst(どちらのイディオムでも)。 |

TSX の `platform` の全メンバーは次のとおりです。

| メンバー | 説明 |
|---|---|
| `platform.os` | `"ios"`、`"android"`、`"macos"`、`"windows"`、`"linux"`、または `"web"`。Mac Catalyst は `"ios"` を返します。 |
| `platform.version` | 文字列。iOS とデスクトップ: OS のバージョン(`"17.5"`)、Android: API レベル(`"35"`)、Web: `"0.0"`。 |
| `platform.idiom` | `"phone"`、`"pad"`、`"mac"`、`"tv"`、または `"desktop"`。`"desktop"` は `platform.desktop` が `true` の場合に限ります。`"mac"` は Mac Catalyst における UIKit の Mac イディオムで、モバイルのイディオムです。 |
| `platform.desktop` | デスクトップの動作が適用されます(macOS、Windows、Linux、デスクトップブラウザー)。`desktop={{…}}` props と `platform.select({ desktop })` はこれに従います。 |
| `platform.catalyst` | アプリが Mac Catalyst(`os` `"ios"`)で、Mac または iPad のイディオムで動作しています。 |
| `platform.select(spec)` | このプラットフォーム向けの値。[プラットフォーム固有のコード](./platform-specific.md#platformselect)を参照してください。 |

```rust tabs
use nsh_core::{element::Os, prelude::*};

let haptics_supported = os() == Os::Ios || (os() == Os::Android && os_version().0 >= 30);
```

```tsx tabs
import { platform } from "nsh";

const hapticsSupported = platform.os === "ios" || (platform.os === "android" && Number(platform.version) >= 30);
```

`nsh test` は iOS としてヘッドレスで動作します。

[Linux](./linux.md) では、`platform.os` は `"linux"`、イディオムは `"desktop"` で、`platform.version` はカーネルのメジャーバージョンとマイナーバージョン(`"6.12"`)です。ディストリビューションごとにリリースの番号付けが異なり、比較できないためです。この環境では、セーフエリアとキーボードの高さは 0 で、`colorScheme()` はデスクトップの設定(XDG settings portal)にリアルタイムで追従し、`fontScale()` はデスクトップのテキストスケーリング、`pixelRatio()` はディスプレイのスケール(小数を含む)に追従します。

[macOS](./macos.md)(AppKit バックエンド)では、`platform.os` は `"macos"`、イディオムは `"desktop"` で、`platform.version` は macOS のバージョンです。セーフエリアとキーボードの高さは 0 で、`colorScheme()` はシステムの外観にリアルタイムで追従し、`fontScale()` は 1、`pixelRatio()` はディスプレイのバッキングスケールです。

[Windows](./windows.md) では、`platform.os` は `"windows"`、イディオムは `"desktop"` で、`platform.version` は `"10.0"` です(Windows 11 でも同じです。Windows はバージョン番号を維持しています)。セーフエリアとキーボードの高さは 0 で、`colorScheme()` は「設定 > 個人用設定 > 色」にリアルタイムで追従し、`fontScale()` は「テキストのサイズ」設定(1 から 2.25)、`reduceMotion()` は「アニメーション効果」設定、`pixelRatio()` はモニターのスケールに追従し、`Intl` はユーザーの地域の形式でフォーマットします。

ブラウザー([Web ランタイム](./web.md))では、`platform.os` は `"web"`、`platform.version` は `"0.0"` です。イディオムは、マウスがあり、ウィンドウの幅が 600 ポイント以上の場合は `"desktop"`、タブレットでは `"pad"`、スマートフォンでは `"phone"` となり、アプリの起動時に決まります。ロケール、`reduceMotion()`、`fontScale()`(ブラウザーの文字サイズ)、`pixelRatio()`、セーフエリア、キーボードの高さはブラウザーから取得され、リアルタイムで追従します。

<a id="pixel-density"></a>

## ピクセル密度

Rust の `pixel_ratio()` と `round_to_nearest_pixel(points)`、TSX の `nsh` からの `pixelRatio()` は、ポイントとデバイスピクセルを相互に変換します。

| Rust | TSX | 説明 |
|---|---|---|
| `pixel_ratio()` | `pixelRatio()` | ポイントあたりのデバイスピクセル数(ほとんどのスマートフォンでは 2 または 3)。リアクティブです。 |
| `round_to_nearest_pixel(points)` | `Math.round(x * pixelRatio()) / pixelRatio()` | ポイントを最も近いデバイスピクセルに丸めた値。 |

デバイスピクセル 1 つ分の高さのヘアライン:

```rust tabs
view()
    .h(move || px(1.0 / pixel_ratio()))
    .bg(rgb(0xd0d7de))
```

```tsx tabs
import { View } from "nsh";
import { pixelRatio } from "nsh";

<View style={{ height: 1 / pixelRatio(), backgroundColor: "#d0d7de" }} />
```

`pixel_ratio()` と `pixelRatio()` はリアクティブなので、ウィンドウを別の密度の画面に移動すると、ヘアラインもそれに追従します。

<a id="right-to-left"></a>

## 右から左への表記

デバイスの言語が右から左に書かれる言語(アラビア語、ヘブライ語、ペルシア語など)の場合、NSH はアプリを右から左にレイアウトします。行は右から始まり、論理スタイルプロパティは右から左の側を採用し、テキストは右揃えになり、ネイティブウィジェットは反転します。レイアウトの方向は、ユーザーの言語に自動的に従います。ビューの `direction` スタイル(`"ltr"`、`"rtl"`、または `"inherit"`。Rust では `.direction(LayoutDirection::..)`)は、そのサブツリーの方向を設定します。ルートビューに指定すると、アプリ全体の方向を設定します。

変更はアプリを再起動せずにすぐに適用されます。このページのデモでは `direction` スタイルを切り替えています。

どちらの方向でも動作するレイアウトを書くには、論理プロパティを使います。Rust では `ms` / `me` と `ps` / `pe`(Tailwind の名前)、TSX では `marginStart` / `marginEnd`、`paddingStart` / `paddingEnd`、`start` / `end`、`borderTopStartRadius`、`textAlign: "start"` などを使います。これらは、左から右のレイアウトでは左と右を、右から左では逆を意味します。`left` と `right`(`marginLeft`、`paddingRight`、`left`、`textAlign: "left"` など)は、CSS と同様にどちらの方向でも側が変わりません。`direction` スタイル(`"inherit"`、`"ltr"`、`"rtl"`)は、サブツリーの方向を上書きします。たとえば、電話番号やメディアプレーヤーのコントロールを左から右のままにしたい場合に使います。`rtl:` と `ltr:` の Tailwind バリアントは、方向ごとに適用されます。

横スクロールビューとリストは、右から左のレイアウトでは右端から始まります。Android では、ネイティブウィジェットを反転させるために、ホストアプリがマニフェストで `android:supportsRtl="true"` を宣言する必要があります。

<a id="related"></a>

## 関連項目

- [`nsh` のデバイス API](../modules/nsh.md#device): リファレンス。
- [プラットフォーム固有のコード](./platform-specific.md): `platform.select`、プラットフォーム props、モジュール。
- [アクセシビリティ](./accessibility.md): スクリーンリーダーとモーションの軽減。
- [セーフエリア](../elements/safe-area.md)、[キーボード](../elements/keyboard.md)、[ステータスバー](../modules/nsh-base.md#status-bar)。
- [Tailwind](./tailwind.md): `dark:`、ブレークポイントとオリエンテーションのバリアント。
