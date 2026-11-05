---
title: "プラットフォームの概要"
description: "NSH が動作するプラットフォーム: iOS、Android、macOS、Windows、Linux、GPUI、Web。それぞれに専用のバックエンドがあります。各プラットフォームで Rust または TSX アプリを実行、パッケージ化、埋め込む方法と、必要な要件を説明します。"
order: 10
group: platforms
source_hash: 122188df65c9a97c
---

# プラットフォーム概要

NSH は、スマートフォン、デスクトップ、Web で動作します。対応するのは iOS、Android、macOS、Windows、Linux、GPUI、Web ページです。各プラットフォームには独自のバックエンドがあり、そのプラットフォーム自身の UI で描画します。そのため、アプリは iPhone では UIKit のビュー、Mac では AppKit のビュー、Linux では GTK 4 のウィジェット、GPUI アプリでは GPUI の要素、ブラウザーでは HTML になり、テキスト、入力、アクセシビリティ、ダークモードもそのプラットフォームのものが使われます。バックエンドより上の層はすべて共通です。リアクティブグラフ、レンダラー、Taffy レイアウト、コンポーネント、ネイティブモジュールはどこでも同じ Rust コードなので、1 つのアプリがすべてのプラットフォームで動きます。Rust で書かれたアプリは、そのコードとあなたのクレートだけで構成され、JavaScript VM は使いません。TSX アプリは、その上の QuickJS でモジュールを実行します([Rust でのビルド](./rust.md))。

どのプラットフォームでも、アプリの使い方は次の 2 通りです。そのプラットフォーム向けのインストール可能なアプリとしてパッケージ化する(`nsh package`)か、ホストが Rust ルートをリンクするか TSX を実行時に読み込むかを問わず、独自のネイティブアプリに埋め込みます。開発には `nsh run` を使います(Rust の編集はアプリを再ビルドして再起動し、TSX の編集はホットアップデートされます)。

<a id="at-a-glance"></a>

## 概要一覧

| プラットフォーム | バックエンド、テキスト | 動作環境 | 開発 | パッケージ |
|---|---|---|---|---|
| [iOS](./ios.md) | UIKit、CoreText | iOS 15.0 以降、実機とシミュレーター | `nsh run --target ios` | `.app`(シミュレーター)、署名付き `.ipa` |
| [Android](./android.md) | Android ビュー、`StaticLayout` | Android 9(API 28)以降、`arm64-v8a`、`armeabi-v7a`、`x86_64` | `nsh run --target android` | 署名付き `.apk` |
| [macOS](./macos.md) | AppKit と Core Animation、CoreText | macOS 14 以降 | `nsh run --target macos` | アドホック署名付き `.app` |
| [Windows](./windows.md) | Direct2D で描画する Win32 ウィンドウ、DirectWrite | Windows 10 1809 以降、Windows 11 | `nsh run`(Windows でのデフォルト) | ディレクトリと `.zip` |
| [Linux](./linux.md) | GTK 4 ウィジェット、Pango | GTK 4.14 以降 | `nsh run`(Linux でのデフォルト) | ディレクトリと `.tar.gz` |
| [GPUI](./gpui.md) | GPUI、GPUI のテキストシステム | macOS、Windows、Linux(Vulkan) | GPUI アプリ内。TSX は `nsh run --target gpui` でも可 | 埋め込み先の GPUI アプリの中 |
| [Web](./web.md) | HTML と CSS、ブラウザーのフォント | モダンブラウザー、デスクトップとスマートフォン | `nsh run --target web` | 静的サイト |

- **[GPUI](./gpui.md)** は、姉妹プロジェクトである GPUI Kit のフレームワーク [GPUI](https://gpui-kit.com) でアプリを描画します。macOS、Windows、Linux のいずれでも同じです。GPUI アプリや GPUI Kit アプリに埋め込むためのバックエンドであり、それらのアプリは `AppView` を自身の要素ツリーに配置します。スタンドアロンのデスクトップアプリは、各 OS 固有のバックエンド(AppKit、Win32、GTK 4)で実行とパッケージ化を行います。
- **[Web](./web.md)** は、アプリをブラウザーのページ内で HTML として描画します。`nsh package --target web` は、任意の Web サーバーや CDN 向けに静的サイトを公開します。その際、Rust アプリのエンジンとクレートは WebAssembly にコンパイルされます。独自のページには `createPlayer` または iframe でアプリを埋め込めます。このサイトのライブデモと[プレイグラウンド](/playground)も Web バックエンドで動いています。
- **Mac Catalyst** は、開発用に、Mac 上の iPhone サイズ(390×844)のウィンドウで iOS バックエンドを実行します。アプリがスマートフォンでどう見えるかを確認するには、`--target catalyst` で選択します。

<a id="develop-and-package"></a>

## 開発とパッケージ化

`nsh run` は、`--target` を指定しない場合、そのマシン自身のプラットフォームを選びます。macOS では AppKit、Linux では GTK ウィンドウ、Windows では Win32 ウィンドウです。スマートフォンへはコンピューターから接続します。iOS は Xcode を入れた Mac から、Android は Android SDK を入れた macOS、Linux、Windows から利用できます([インストール](./installation.md#what-works-where))。

Rust アプリ(その `nsh.json` が `"root"` コンポーネントを指定するもの)は、そのディレクトリから実行とパッケージ化を行います。`nsh` は、あなたのクレートを使い、QuickJS なしで、対象ターゲット向けのアプリ専用ランナーをビルドします。TSX アプリはエントリーを指定します。

```sh
# A Rust app, from its directory
nsh run --target macos             # or ios, android, windows, linux, web, catalyst
nsh package --target macos         # or ios, ios-simulator, android, windows, linux, web

# A TSX app
nsh run App.tsx --target macos     # or ios, android, windows, linux, gpui, web, catalyst
nsh package App.tsx --target macos
```

各デスクトップ OS は、実行するマシン向けにビルドされた自身のバックエンドでアプリをパッケージ化します。Mac アプリは Mac で、Windows アプリは Windows で、Linux アプリは Linux でパッケージ化してください。各ターゲットの出力、署名、アイコンについては[パッケージング](./packaging.md)を参照してください。

<a id="embed-in-a-native-app"></a>

## ネイティブアプリへの埋め込み

| プラットフォーム | ホストビュー | 実行内容 | 提供形態 | ホスト言語 |
|---|---|---|---|---|
| macOS | `AppView`(`NSView`) | Rust ルート、TSX バンドル | `nsh-platform-macos` クレート | Rust |
| Windows | `AppView`(子ウィンドウ) | Rust ルート、TSX バンドル | `nsh-platform-windows` クレート | Rust |
| Linux | `AppView`(GTK ウィジェット) | Rust ルート、TSX バンドル | `nsh-platform-linux` クレート | Rust |
| GPUI(macOS、Windows、Linux) | `AppView`(GPUI ビュー) | Rust ルート、TSX バンドル、署名付きパッケージ | `nsh-platform-gpui` クレート | Rust |
| iOS | `AppView`(`UIView`) | Rust ルート、TSX バンドル | `nsh-platform-ios` クレート | Rust |
| iOS | `NshAppView`(`UIView`) | TSX バンドル、署名付きパッケージ | `NativeShell.xcframework` | Swift |
| Android | `NshView`(`FrameLayout`) | TSX バンドル、署名付きパッケージ | `nsh.aar` | Java または Kotlin |
| Web | `createPlayer`(ページ要素)または iframe | TSX バンドル。Rust アプリは公開されたサイトとして | `nsh package --target web` のランタイムファイル | JavaScript または HTML |

Rust ホストは、Rust ルート(`Root::of::<App>()`)を `AppSource::Rust` または `App::Rust` としてマウントし、`set_ui_sets` でアプリの UI セットをエンジンに渡します。これにより、ホストが読み込む TSX はアプリ独自のコンポーネントとモジュールをインポートできます。各ビューは 1 つのエンジンであり、1 つのアプリが複数のビューを表示できます。ホストは、アプリが使えるように独自のネイティブビューをすべてのプラットフォームで登録します([ネイティブコンポーネント](./native-components.md))。

> [!NOTE]
> Rust ホストは、NSH リポジトリのプラットフォームクレートを使って NSH を埋め込みます。macOS、Windows、Linux の `AppView` は、デフォルトの制限のもとで、アプリ自身のファイル(またはソースコード)からバンドルを読み込みます。GPUI クレートと iOS および Android の SDK は、[署名付きパッケージ](./signed-packages.md)も読み込み、ビューごとに制限とケイパビリティを設定します([サンドボックスとケイパビリティ](./sandbox-and-capabilities.md))。

<a id="writing-for-every-platform"></a>

## すべてのプラットフォーム向けの書き方

アプリの大部分はプラットフォームのチェックを必要としません。要素、スタイル、レイアウト、モジュールはどこでも同じように動作します。プラットフォームごとに違いがある部分については、NSH がその違いを 1 か所にまとめています([プラットフォーム固有のコード](./platform-specific.md))。

- **環境がアプリの実行場所を示します**。Rust では `os()`、`idiom()`、`is_desktop()`(`nsh_core::prelude`)、TSX では `nsh` から `platform.os`、`platform.idiom`、`platform.desktop`、`platform.select` を使います。OS は iOS、Android、macOS、Windows、Linux、Web のいずれかです。
- **プラットフォーム専用の props** は、TSX では `ios={{…}}`、`android={{…}}`、`web={{…}}`、`desktop={{…}}` に記述します(`desktop`: macOS、Windows、Linux、デスクトップブラウザー)。
- **入力はプラットフォームに従います**。スマートフォンではタッチとソフトウェアキーボード、デスクトップではマウス、トラックパッド、キーボードを使います。

アプリのコンポーネントは NSH のプリミティブで描画されるため、スマートフォンでもデスクトップでも動作し、どちらでも同じ見た目になります。デスクトップ向けレイアウトは、プリミティブ(`view`、`text`、`scroll`、`virtual_list` など。TSX では `View`、`Text`、`Scroll`、`List` など)とデスクトップかどうかのチェックで構築します。ギャラリーのデスクトップレイアウトがその例です。

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn Shell() -> impl IntoElement {
    // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
    view()
        .flex_1()
        .child(if is_desktop() { sidebar_layout() } else { tab_layout() })
}

fn sidebar_layout() -> AnyElement {
    view().flex_1().flex_row().into_element()
}

fn tab_layout() -> AnyElement {
    view().flex_1().flex_col().into_element()
}
```

```tsx tabs
import { View } from "nsh";
import { platform } from "nsh";

export function Shell() {
  // macOS, Windows, Linux and desktop browsers get a sidebar; phones get tabs.
  return <View class="flex-1">{platform.desktop ? <SidebarLayout /> : <TabLayout />}</View>;
}

function SidebarLayout() {
  return <View class="flex-1 flex-row" />;
}

function TabLayout() {
  return <View class="flex-1 flex-col" />;
}
```

各バックエンドが独自の方法で行う処理は、[macOS](./macos.md#what-differs-on-macos)、[Windows](./windows.md#what-differs-on-windows)、[Linux](./linux.md#what-differs-on-linux)、[GPUI](./gpui.md#differences) にまとめられています。

<a id="see-also"></a>

## 関連項目

- [はじめに](./getting-started.md): 最初のアプリを各プラットフォームで実行します。
- [Rust でのビルド](./rust.md): Rust で書くアプリと、Rust と TSX の組み合わせ。
- [インストール](./installation.md): 各プラットフォームで必要なツール。
- [アーキテクチャ](./architecture.md): 何が共通で、各バックエンドが何を行うか。
