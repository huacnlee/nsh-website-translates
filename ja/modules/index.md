---
title: "モジュール"
description: "NSH アプリがインポートするモジュール、各モジュールがエクスポートする内容、およびそれらの構成方法について説明します。"
order: 1
source_hash: c212e0667eddb588
---

# モジュール

NSH アプリは、使用するすべてを少数のモジュールからインポートします。これらはすべてネイティブです。リアクティブグラフ、レンダラー、各モジュールはランタイム内部で Rust により実装されており、バンドラーは `import ... from "nsh/..."` をコードとしてバンドルにコピーせず、インポートのまま保持します。バンドルに含まれるのは、あなた自身のコードだけです。

```tsx
import { createAnimatedValue, mount, signal, windowSize } from "nsh";
import { Button } from "nsh/base";
import { TabBar } from "nsh/mobile";
```

<a id="three-layers"></a>

## 3 つのレイヤー

NSH の UI は、GPUI Kit と同様に 3 つのレイヤーで構成されています（`gpui`、`gpui-base`、`gpui-component`）。

| レイヤー | モジュール | アプリに提供するもの |
|---|---|---|
| プリミティブ | `nsh`、`nsh/mobile`、`nsh/desktop` | リアクティビティ、ホスト要素、レイアウト、リスト、キャンバス、アニメーション、ジェスチャー、デバイス情報、各プラットフォーム固有の API |
| ベースコンポーネント | [`nsh/base`](./nsh-base.md) | 動作、状態、フォーカス、アクセシビリティを担う、スタイルのないコンポーネント。ボタン、Markdown と HTML のドキュメント、ナビゲーションスタック、ダイアログ、システムのダイアログを、すべてのプラットフォームで提供します |
| コンポーネントライブラリ | アプリ自身のもの、またはコミュニティのもの | 見た目を備えたボタン、カード、行、画面 |

アプリの見た目は、そのアプリ自身のものです。コンポーネントライブラリは第 3 のレイヤーにあたります。[ホスト要素](../elements/index.md)と `nsh/base` から作成し、`style`、[Tailwind](../docs/tailwind.md) クラス、テーマでスタイルを付けたコンポーネント、[独自の crate](../docs/rust.md) で提供する Rust コンポーネント、あるいは同じ基盤上でコミュニティが公開しているライブラリを使えます。

すべてを含むモジュールはありません。各 API はちょうど 1 か所に置かれています。モバイルプラットフォーム（iOS と Android）の API は `nsh/mobile` に、デスクトップ（macOS、Windows、Linux）の API は `nsh/desktop` にあります。どちらもすべてのプラットフォームでインポートできるため、1 つのバンドルがどこでも動作します（他のプラットフォームでは、これらの呼び出しはただちに戻ります。現在のプラットフォームは `platform.os` で確認できます）。

型はランタイムから生成されます。`nsh init`、`nsh build`、`nsh dev`、`nsh test` がアプリの隣に `.nsh/types` を書き出すため、TypeScript の宣言は、ビルドに使うランタイムと常に一致します（[プロジェクト構成](../docs/project-structure.md)を参照）。

<a id="all-modules"></a>

## すべてのモジュール

| モジュール | エクスポート | ページ |
|---|---|---|
| `nsh` | `signal`、`computed`、`effect`、`batch`、`untracked`、`cleanup`、`context`、`split`、`mount`、`ErrorBoundary`。プリミティブの `View`、`Text`、`Scroll`、[`List`](./nsh-list.md)、[`Image`](./nsh-image.md)（`Image.getSize`、`Image.prefetch` を含む）、[`Canvas`](./nsh-canvas.md)（`Path2D`、`CanvasRenderingContext2D`、`CanvasGradient` を含む）、[`WebView`](./nsh-webview.md)、[`Video`](./nsh-video.md)。`safeArea`、`safeAreaInsets`。`Keyboard`、`keyboardFrame`。[アニメーション](./nsh.md#animation)（`createAnimatedValue`、`AnimatedValue`、`AnimatedNode`、`Animated`、`Easing`、`LayoutAnimation`）。[環境](./nsh.md#device)（`windowSize`、`colorScheme`、`setColorScheme`、`fontScale`、`pixelRatio`、`locale`、`platform`、`openUrl`）。[`PanResponder`](./nsh.md#panresponder)。[`Clipboard`](./nsh.md#clipboard)。[`Picker`](./nsh.md#picker)。[`Storage`](./nsh.md#storage)。[`host`](./nsh.md#host)（`available`、`call`、`on`、およびネイティブ SDK の `params` と `post`）。[`keymap`](./nsh.md#keymap)（キーボードショートカット：`mod+k`、`ctrl+shift+p`、...）。[`nativeComponent`、`nativeModule`](./nsh.md#nativecomponent-and-nativemodule)（埋め込み先のアプリが登録するコンポーネントと関数）。[アクセシビリティ](./nsh.md#accessibility)（`announce`、`setAccessibilityFocus`、`screenReaderEnabled`、`reduceMotion`）。要素、スタイル、イベント、JSX の型（`ViewRef`、`InputRef`、...、`ViewStyle`、...） | [nsh](./nsh.md) |
| `nsh/base` | `Button`、`Input`。`TextView`。`createNavStack`、`NavStack`、`NavPage`、`Dialog`。`AlertDialog` | [nsh/base](./nsh-base.md) |
| `nsh/mobile` | `isAvailable`、`TabBar`（システムのタブバー、iOS と Android）、`InputAccessoryView`（iOS）、`BackHandler`（Android） | [nsh/mobile](./nsh-mobile.md) |
| `nsh/desktop` | `isAvailable`、`Window`（タイトル、タイトルバー、最大化、フルスクリーン）、`titleBar`、`Menu`（アプリケーションメニュー、コンテキストメニュー） | [nsh/desktop](./nsh-desktop.md) |
| 標準モジュール | `buffer`、`console`、`crypto`、`fs/promises`、`net`、`os`、`path`、`process`、`url`、`websocket`、`zlib` | [標準モジュール](./standard-modules.md) |
| グローバル | `fetch`、`URL`、`TextEncoder`、`Blob`、`FormData`、`AbortController`、`Intl`、タイマー、`console`、`requestAnimationFrame`、...（インポート不要） | [グローバル API](./globals.md) |

モジュールではないリファレンスページ：

| ページ | 内容 |
|---|---|
| [スタイルリファレンス](./style-reference.md) | すべてのスタイルキーとその型、意味 |
| [Tailwind リファレンス](./tailwind-reference.md) | `class` が受け付ける Tailwind のユーティリティとバリアント |

<a id="host-elements"></a>

## ホスト要素

ホスト要素は、他のものと同様にインポートして使うコンポーネントです。`View`、`Text`、`Scroll`、`Image`、`List`、`Canvas`、`WebView`、`Video`、`Overlay` は `nsh` から、ベースコンポーネント（`Button`、`Input`、`Dialog`、`NavStack`、`NavPage`）は `nsh/base` から、`InputAccessoryView` は `nsh/mobile` からインポートします。グローバルなのは `If` と `Each` だけです。コンパイラが要素をその場で生成するため、インポートによる実行時のコストはありません。各 props は[要素](../elements/index.md)のページに記載されています。
