---
title: "パフォーマンス"
description: "NSH がアプリを高速に保つ仕組み(Rust アプリ、ネイティブランタイム、バッチ化された境界越え、ネイティブアニメーション、仮想化リスト)、それがコードに与える影響、そしてヘッドレスおよび画面上での計測方法について説明します。"
order: 62
group: tools
source_hash: f8f220699bc54685
---

# パフォーマンス

パフォーマンスは NSH の最優先事項であり、その大部分はアプリではなくフレームワークによって決まります。ランタイムはネイティブで、各更新はスレッドを一度だけ跨ぎ、アニメーションとリストの仮想化は JS なしで動作し、Rust で書かれたアプリは JS をまったく実行しません。このページでは、NSH が従うルール、それが Rust と TSX で書くコードに何を意味するか、そして計測方法を説明します。

<a id="the-rules"></a>

## ルール

<a id="1-js-does-as-little-as-possible"></a>

### 1. JS の処理を最小限にする

**Rust で書かれたアプリは、最初から最後までネイティブコードです。** コンポーネント、状態、ハンドラーは NSH のエンジンでコンパイルされ、インタープリターは動作しません([Building with Rust](./rust.md))。これはアプリを書く最速の方法であり、要求の厳しいビジネスロジックに適した選択肢です。

TSX アプリでは、QuickJS がインタープリターとして動作します。小さく起動が速い一方で、重い処理ではネイティブコードよりはるかに遅くなります。そのため NSH では、**JS になるのはアプリのコードだけ**です。リアクティブグラフ(シグナル、算出値、エフェクト)、コンパイル済み JSX が呼び出すレンダラー、レイアウトエンジン、リストの仮想化、アニメーション、そしてインポートするすべてのモジュールは Rust です。パース、差分検出、レイアウト、文字列処理はネイティブで行われます。

その効果は計測できます。同じカウンターアプリを、NSH の以前の JS ランタイムとネイティブランタイムで比較しました(リリースビルド)。

| | 以前の JS ランタイム | ネイティブランタイム |
|---|---|---|
| バンドルサイズ | 14 KB JS / 19.6 KB バイトコード | 886 B JS / 1.7 KB バイトコード |
| バンドルの評価 | ~390 µs | ~95 µs |
| 1 回のタップの JS 時間(中央値) | ~14 µs | ~5 µs |
| 1 回のタップのコミット | ~22 µs | ~15 µs |
| 1000 行のリストのスクロール、再バインドフレームあたりの JS | ~150 µs | ~77 µs |

コンポーネントでも同様です。Rust コンポーネントで書いたボタンと、同等の TSX ボタンを 200 個ずつ比較しました。

| | Rust ボタン: JS / コア | TSX ボタン: JS / コア |
|---|---|---|
| 最初のフレーム(ops) | 1.32 ms / 0.77 ms (1015) | 2.32 ms / 0.70 ms (2415) |
| 200 個すべてのタイトルを更新(ops) | 0.42 ms / 0.42 ms (200) | 0.77 ms / 0.36 ms (600) |

(Apple silicon で計測。2 つ目の表は以前のランタイムでの計測です。どちらも NSH のパフォーマンスベースラインによる値です。)

**コードに関して:** イベントハンドラーと算出値は軽く保ってください。重い計算(大きなペイロードのパース、キー入力のたびに数千件をソートするような処理)は、JIT を備えた V8 や JavaScriptCore に慣れている場合に想像するよりも、QuickJS ではコストがかかります。一度だけ実行して `computed` にキャッシュするか、インタラクションの経路から外してください。

<a id="2-cross-threads-in-batches"></a>

### 2. スレッドをバッチで跨ぐ

アプリのコードは Rust でも JS でも、メインスレッドではなくエンジンスレッドで実行されます。1 ターン、たとえば 1 つのイベントハンドラーとそれが変更するすべての内容は、**1 回のコミット**になります。ランタイムはコンポーネントをレンダリングし、レイアウトし、差分を取り、ネイティブビュー操作のバッチを 1 つ生成して、**1 回のホップ**でメインスレッドに届けます。ビューごとのブリッジメッセージも、プロパティごとのシリアライズもありません。

**コードに関して:** パフォーマンスのために書き込みをまとめる必要はありません。1 つのハンドラー内で `set` を 10 回呼び出しても、Rust でも TSX でもコミットは 1 回です。エフェクトや算出値に、書き込みのたびではなくすべての書き込みをまとめて見せたい場合は `batch` を使ってください。

<a id="3-fine-grained-updates"></a>

### 3. きめ細かい更新

コンポーネントは Rust でも TSX でも**一度だけ**実行されます。その後は、シグナルを読み取るバインディングだけが、そのシグナルが変化したときに再実行されます。対象は、テキスト、スタイルプロパティ、`when`(`<If>`)の分岐、`each`(`<Each>`)の行です。何が変わったかを調べるためにサブツリー全体を再レンダリングすることはありません。

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**コードに関して:**

- シグナルは、コンポーネントの先頭ではなく、使用する場所(バインディング内、Rust の `move ||` クロージャー、TSX の JSX 式、そして `computed` と `effect` の中)で読み取ってください。これにより、最も狭いバインディングだけが更新されます。
- コレクションには `each` / `<Each>`(キーで行を保持)または[仮想リスト](./lists.md)を使ってください。コレクション全体から行を作り直す方法(Rust の `dynamic`、JSX の単純な `.map()`)では、変更のたびにすべての行が再作成されます。
- 複数のバインディングが値を使用する場合は、`computed` で値を導出してください。これにより、変更ごとに一度だけ計算されます。

3 項目のリストに 4 つ目の項目を追加した場合を、`nsh test --trace` で表示すると次のようになります。

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

[Reactivity](./reactivity.md) を参照してください。

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. 不要なものを送らない

コアは変更された内容だけを送信します。新しいビューにはデフォルトスタイルも空のイベントマスクも付かず、変更のないスタイルやフレームは送信されず、テキストの色を変更してもテキストのレイアウトはやり直されません。1 つの数値を変更するタップは、1 つのテキスト項目を送信します。これは `nsh test --trace` の出力(下記)で確認できます。

<a id="5-animate-natively"></a>

### 5. ネイティブでアニメーションする

エンジンスレッドから駆動するアニメーション(フレームごとにシグナルへ書き込む方法)は、フレームごとにコミットが発生し、TSX では JS 呼び出しも発生し、エンジンスレッドが混雑しているとコマ落ちします。アニメーション値([Animation](./animation.md): Rust では `animated_value`、TSX では [`nsh` のアニメーション API](../modules/nsh.md#animation))を使うと、アニメーションはネイティブで実行されます。

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing`、`spring`、`decay` はプラットフォームの UI スレッドでフレームごとに実行され、フレームごとのエンジンスレッドでの処理はありません。
- `scroll_value`(`scrollValue`)は、同じフレーム内でスクロールオフセットをアニメーション値に書き込みます。パン(`pan={{ x, y }}`)を使うと、ドラッグでビューを直接動かせます。コードには終了が通知されます(アニメーションの完了、パンの終了時の速度)。
- `Animated.sequence` / `parallel` / `stagger` / `loop` は 1 つのネイティブツリーとして実行されます。各ステップは前のステップが終了した瞬間に開始され、JS を待つ間の隙間はありません。
- `LayoutAnimation.configureNext` は、次のコミットのフレーム、挿入、削除をネイティブでアニメーションします。

<a id="6-virtualize-long-lists"></a>

### 6. 長いリストを仮想化する

[`List`](./lists.md) は、ビューポート付近の行だけを保持し、セルをリサイクルし、位置、列、スティッキーヘッダー、可視状態をネイティブで計算します。新しい行が現れないスクロールフレームでは、アプリのコードは一切実行されず、バッチも生成されません。ギャラリーの写真リストで新しい行を 1 つバインドするフレームは、4 つの操作と 4 つのマウント項目です。

**コードに関して:**

- `estimated_item_size`(`estimatedItemSize`)には、実際の行の高さに近い値を指定してください。
- 項目ごとの状態は、行の内部で作成したシグナルではなく、データ(id をキーとするもの)に持たせてください。セルは他の項目のために再利用され、再利用されると行の位置(`at.index()`、TSX では `item()` / `index()`)も変化します。
- 行は軽く保ってください。行はリサイクルのたびに一度バインドされるため、そのコードはユーザーがスクロールしている間に実行されます。
- スクロール位置に追従するエフェクトには、`on_scroll`(`onScroll`)ではなく `scroll_value`(`scrollValue`)を使ってください。スクロールリスナーが受け取るイベントは 1 エンジンターンにつき最大 1 回ですが、それでも 1 回ごとにアプリのコード(TSX では JS)への呼び出しになります。

<a id="measuring"></a>

## 計測

<a id="headless-50"></a>

### ヘッドレス: `--trace`

Rust のテストでは、`EngineConfig::trace` が同じ `perf` 行をログに出力し、`Headless::observe` がすべてのバッチを確認できます([Testing](./testing-and-trace.md#tracing-with-trace))。TSX では `nsh test --trace` がそれらを出力します。

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

注目すべき点:

- **ops**(JS がキューに入れた操作)と **mount items**(ネイティブビュー操作): これらは決定的です。1 つのラベルを変更するはずのタップが 40 個の項目を生成する場合は、更新すべきビューを再作成している箇所があります。
- **event js**: ハンドラーとそれが引き起こした処理の JS コスト。
- **commit**: コンポーネントのレンダリング、レイアウト、差分検出に対するコアのコスト。
- **list js**: そのコミット中にリスト行のバインドに費やされた JS 時間。

詳しいガイド: [Testing](./testing-and-trace.md)

<a id="on-a-device-55"></a>

### デバイス上: `--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

これは、TSX アプリの実際のホストから、プラットフォーム固有のテキストエンジンを使って同じコミット行をログに出力します。`NshAppView(trace: true)` と `new NshView(context, true)` は、組み込みアプリで同じことを行います。

<a id="on-screen-58"></a>

### 画面上: `--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

(Rust アプリの `run_app` では `AppOptions { fps: true, .. }`)実行中のアプリの上に、フレームレートと、フレームおよびコミットのコストを、CPU、GPU、メモリとともに表示します([macOS: performance monitor](./macos.md#performance-monitor))。Linux と Windows では、`--target linux --fps` と `--target windows --fps` が、フレームの各フェーズの時間とともに同じ計測値を 1 秒ごとにログに出力します。`nsh test --target linux --fps -v`(または `windows`)は、テストがアプリを操作している間にそれらを取得します。

> [!TIP]
> 単発の計測値は CPU のクロック状態に大きく左右されます。スリープ直後のスレッドは、しばらくの間遅く動作します。同じマシンで複数回実行した結果の最小値を比較し、タイミングの計測にはリリースビルドを使ってください。

<a id="reference-numbers"></a>

## 参考値

計測値、NSH のベースライン、Linux でのギャラリーのページごとの結果は、[パフォーマンスレポート](./performance-report.md)にあります。

<a id="checklist"></a>

## チェックリスト

- 言語: アプリ、または最もよく使う部分を Rust で書いてください([Building with Rust](./rust.md))。TSX は、頻繁に変わるものや実行時に配信されるものに使ってください。
- インタラクション: タップで変わるマウント項目は数十個ではなく、ごく少数にしてください。
- リスト: 長いものには、推定項目サイズを指定した仮想リスト(`virtual_list`、`List`)を使い、項目ごとの状態はデータに持たせてください。
- アニメーション: フレームごとに書き込むシグナルではなく、アニメーション値を使ってください。
- スクロールエフェクト: スクロールリスナーではなく `scroll_value`(`scrollValue`)を使ってください。
- ハンドラー: キー入力ごと、スクロールイベントごとに重い処理をしないでください。キャッシュには `computed` を使ってください。

<a id="see-also"></a>

## 関連項目

- [パフォーマンスレポート](./performance-report.md)
- [Architecture](./architecture.md)
- [Testing](./testing-and-trace.md)
- [Lists](./lists.md)、[Animation](./animation.md)、[Reactivity](./reactivity.md)
