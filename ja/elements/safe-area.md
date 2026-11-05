---
title: "セーフエリア"
description: "safe-area-inset 環境変数と safeArea および safeAreaInsets アクセサー: ノッチ、ステータスバー、ホームインジケーター、ヘッダーに重ならないようにコンテンツを配置する方法。"
order: 110
group: primitives
demo: el-safe-area
source_hash: b81d3cc1ab15d9ad
---

# セーフエリア

セーフエリアは、ノッチや Dynamic Island、ステータスバー、ホームインジケーター、ナビゲーションヘッダー、Mac Catalyst のタイトルバーからコンテンツを離しておきます。どのビューでも、CSS の `env()` である `env(safe-area-inset-top)`、`env(safe-area-inset-right)`、`env(safe-area-inset-bottom)`、`env(safe-area-inset-left)` を padding や margin に指定することで、その分のパディングを確保できます。これらは、ノードが描画されるルートビューのインセットです。[NavPage](./nav-stack.md) の内側ではページのヘッダーより下のインセット、[Dialog](./dialog.md) の内側ではダイアログのインセット、それ以外ではサーフェスのセーフエリアになります。ブラウザーではページがルートとなり、変数はブラウザー自身のものです。

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    view()
        .flex_1()
        .bg(rgb(0xfff8c5))
        .p_safe_area()
        .child(text("Clear of the notch").text_2xl().font_weight(FontWeight::BOLD))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff8c5",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Clear of the notch</Text>
    </View>
  );
}

mount(App);
```

背景色はステータスバーの背後も含めて領域全体を塗りつぶし、コンテンツはその下から始まります。値はインセットに追従します。回転したときや、別のページやダイアログに移ったときも、パディングはネイティブに更新されます。

<a id="values"></a>

## 値

| 値 | 例 | 意味 |
|---|---|---|
| `env(name)` | `paddingTop: "env(safe-area-inset-top)"` | インセットそのもの。 |
| `env(name, <length>)` | `env(safe-area-inset-top, 20px)` | インセット。CSS と同様に、長さは未知の名前の代わりに指定します。 |
| `calc(env(name) + <length>)` | `calc(env(safe-area-inset-bottom) + 16px)` | インセットに長さを加えた値。独自の余白を保ちたいコンテンツ向け。 |
| `calc(<length> + env(name))` | `calc(16px + env(safe-area-inset-left))` | 同上。 |

これらは `padding`、`paddingHorizontal`、`paddingVertical`、`paddingTop`、`paddingRight`、`paddingBottom`、`paddingLeft`、および同じ `margin` のキーに適用できます。Tailwind では、`p`、`px`、`py`、`pt`、`pr`、`pb`、`pl` と `m` ユーティリティの任意の値として使えます（スペースは省略可能）。例: `pt-[env(safe-area-inset-top)]`、`pb-[calc(env(safe-area-inset-bottom)+16px)]`。これらの値の TypeScript 型は `EnvValue` です。[スタイルリファレンス](../modules/style-reference.md)を参照してください。

Rust では、`Styled` のメソッドで設定します。`.p_safe_area()`、`.px_safe_area()`、`.py_safe_area()`、`.pt_safe_area()`、`.pr_safe_area()`、`.pb_safe_area()`、`.pl_safe_area()`、同じ `m` のメソッド、そしてインセットに長さを加える場合は `.pt_safe_area_plus(px(16.0))`（および `pr`、`pb`、`pl`、`mt`、`mr`、`mb`、`ml`）です。

<a id="choosing-the-edges"></a>

## 辺を選ぶ

たとえば、独自のタブバーやボトムバーが下側のインセットを処理する場合など、必要な辺だけにパディングを指定します。

```rust tabs
view()
    .flex_1()
    .pt_safe_area()
    .px_safe_area()
```

```tsx tabs
<View class="flex-1 pt-[env(safe-area-inset-top)] px-[calc(env(safe-area-inset-left)+16px)]">
  …
</View>
```

<a id="where-to-use-it"></a>

## 使う場面

表示されている不透明なヘッダーを持つ [NavPage](./nav-stack.md) は、すでにコンテンツをヘッダーの下に配置するため、その場合の上側のインセットは 0 です。セーフエリアのインセットは次の場合に使います。

- ナビゲーションスタックを持たないアプリのルート
- `headerVisible={false}` または `headerTransparent` を指定したページ
- フルスクリーンの [Dialog](./dialog.md) のコンテンツ
- 画面の端に置く独自のバー

<a id="safearea-and-safeareainsets"></a>

## safeArea と safeAreaInsets

コード内で数値が必要な場合は、直接読み取れます。TSX のアクセサーはどちらも `nsh` から提供され、`Edges` オブジェクト（`{ top, right, bottom, left }`、単位はポイント）を返し、リアクティブです。これらを読み取るコードは、たとえば回転などで値が変わると再実行されます。

| TSX | Rust | 戻り値 |
|---|---|---|
| `safeArea()` | `safe_area()` | サーフェスのセーフエリア。システム UI（ノッチ、ホームインジケーター、タイトルバー）にかからない部分。 |
| `safeAreaInsets()` | `cx.insets()` | コンポーネントが描画される位置のインセット。最も近いページの（ヘッダーより下の）インセット、最も近いダイアログのインセット、またはそれらがなければサーフェスのセーフエリア。これらは `safe-area-inset-*` 変数の値です。TSX ではコンポーネント内で呼び出すと、アクセサーを返します。お使いのクレートの Rust コンポーネントでは `cx.insets()` で読み取ります。 |

```rust tabs
use nsh_core::prelude::*;

fn bottom_bar() -> impl IntoElement {
    view()
        .flex_row()
        .p_2()
        .pb(move || if safe_area().bottom > Points::ZERO { px(4.0) } else { px(8.0) })
        .child(text("Bottom bar"))
}
```

```tsx tabs
import { Text, View, safeArea } from "nsh";

function BottomBar() {
  const insets = safeArea();
  return (
    <View style={{ flexDirection: "row", padding: 8, paddingBottom: insets().bottom > 0 ? 4 : 8 }}>
      <Text>Bottom bar</Text>
    </View>
  );
}
```

インセットそのものでパディングするだけなら、`env()` のほうが簡単です。コードを実行せずにネイティブに更新されます。

<a id="platform-notes"></a>

## プラットフォーム別の注意

- **iOS**: インセットは UIKit のセーフエリアに由来します。ステータスバー、ノッチまたは Dynamic Island、ホームインジケーターが対象です。
- **Android**: NSH は、NSH ビューに重なるシステムバーとディスプレイカットアウトの部分を報告します。NSH をネイティブのツールバーの下に[埋め込んだ](../docs/android.md)場合、ビューの上側のインセットは 0 です。
- **Mac Catalyst**: 上側のインセットはウィンドウのタイトルバーです。
- **デスクトップ（macOS、Windows、Linux、GPUI）と Web**: ページのコンテンツは `header` の下から始まり、ダイアログはスマートフォンと同様に、コンテンツに独自のインセットを与えます。

<a id="related"></a>

## 関連項目

- [キーボード](./keyboard.md): `env(keyboard-inset-height)`、ソフトウェアキーボードの上に保たれるコンテンツ。
- [デバイスと環境](../docs/device-and-environment.md): デバイスの他の値の中でのセーフエリア。
