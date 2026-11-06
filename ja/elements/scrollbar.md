---
title: "Scrollbar"
description: "Scrollbar コンポーネント: アプリ独自の外観を持つスクロールバーです。すべてのスクロールビューとリスト(テーマで一度設定)、または特定の1つだけに適用でき、アプリが望む位置に配置できます。サムはコンテンツに追従し、ドラッグや押下でスクロールします。スクロール中、ホバー時、または常時表示でき、アプリが指定するタイミングでフェードイン・フェードアウトします。"
group: base
demo: el-scrollbar
source_hash: 961c62cdc9b903d2
---

# Scrollbar

スクロールバーは、スクロールビューやリストに、アプリ独自の見た目のバーを与えます。たとえば、ポインターの下で幅が広がる細いピル型のバー、ブランドの色調のトラック、固定ヘッダーの横や2つのペインに沿って置くバーなどです。アプリのテーマとして一度設定すると、すべてのスクロールビューとリストがプラットフォームのインジケーターの代わりにバーを描画します([組み込みのバー](#built-in-bars))。アプリが配置する場合は、バーが動かすスクロールビューを指定し、アプリが置いた場所に表示されます。バーは自分の挙動を持ちます。サムの長さと位置はコンテンツ、ビューポート、オフセットに追従し(リストが伸びたりウィンドウのサイズが変わったりしている間も同様です)、サムをドラッグするとコンテンツがスクロールし、トラックを押すとサムの中央がその位置に移動します。バーは、コンテンツのスクロール中、ポインターがバー上にある間、または常に表示され、ネイティブにフェードイン・フェードアウトします。見た目とタイミングはアプリが決めます。`Scrollbar` 自体には色、サイズ、角丸の設定がなく、アプリが時間を指定するまでフェードに時間はかかりません。

```rust tabs
use nsh_base::{ScrollbarEntrance, ScrollbarMode, ScrollbarMotion, scrollbar, theme};
use nsh_core::prelude::*;

fn inbox(rows: impl IntoElement) -> impl IntoElement {
    let list = element_ref();
    // In over 300 ms and out over 500 ms, 2 s after the last scroll; pointing
    // at the hidden thumb slides it in from the edge.
    let mut motion = ScrollbarMotion::default();
    motion.enter = 300.0;
    motion.exit = 500.0;
    motion.thumb_hover_entrance = ScrollbarEntrance::SlideAndFade;
    view()
        .relative()
        .flex_1()
        // The scroll view's own indicator gives way to the app's bar.
        .child(scroll().element_ref(&list).flex_1().scrollbar(false).child(rows))
        .child(
            scrollbar()
                .scroll(list)
                .mode(ScrollbarMode::Hover)
                .motion(motion)
                .accessibility_label("Messages")
                // The track over the right edge; the thumb right-aligned in it.
                .absolute()
                .top_0()
                .bottom_0()
                .right_0()
                .w(px(16.0))
                .items_end()
                .p(px(4.0))
                .thumb_style(|s| {
                    s.w(px(6.0))
                        .rounded_full()
                        .bg(move || theme().muted_foreground)
                        .opacity(0.6)
                        .group_hover(|s| s.w(px(8.0)).opacity(0.9))
                }),
        )
}
```

```tsx tabs
import { mount, Scroll, Text, View, type YNode } from "nsh";
import { Scrollbar } from "nsh/base";

function App() {
  let list: YNode | undefined;
  return (
    <View class="relative flex-1">
      <Scroll ref={list} scrollbar={false} class="flex-1">
        {Array.from({ length: 60 }, (_, i) => (
          <Text class="px-4 py-3">{`Message ${i + 1}`}</Text>
        ))}
      </Scroll>
      <Scrollbar
        scroll={list}
        mode="hover"
        motion={{ enter: 300, exit: 500, thumbHoverEntrance: "slideAndFade" }}
        accessibilityLabel="Messages"
        class="absolute inset-y-0 right-0 w-4 items-end p-1"
        thumbClass="w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2 hover:opacity-90 active:w-2 active:opacity-100"
      />
    </View>
  );
}

mount(App);
```

`Scrollbar` は [`nsh/base`](../modules/nsh-base.md) に由来し、Rust では `nsh-base` クレートです。Rust では、`scrollbar()` が prop ごとのセッター(`.scroll(..)`、`.thumb_style(..)`)とバー自体の型付きスタイルメソッドを備えたバーを作ります。その `scroll` は `ElementRef`(または `ScrollbarTarget`)を受け取ります。

<a id="built-in-bars"></a>

## 組み込みのバー

すべてのスクロールビューとリストは、配置すべきバーがなくても、プラットフォームのインジケーターの代わりに `Scrollbar` を描画できます。`Scrollbar.setTheme` は、`scrollbar` が `true` であるすべてのビューのバーにアプリの見た目を、アプリの起動時に一度だけ与えます。各ビューは、ビューポートの上に自分専用のバーを持ちます。このバーはコンテンツがスクロールしてもその場にとどまり(スティッキービューと同様にメインスレッド上で処理されます)、コンテンツより上に描画されます。バーは、配置された `Scrollbar` と同じように追従し、スクロールし、フェードします。

```rust tabs
use nsh_base::{ScrollbarLook, ScrollbarMode, ScrollbarTheme, set_scrollbar_theme};

fn use_app_scrollbars() {
    let mut vertical = ScrollbarLook::default();
    vertical.class = Some("absolute inset-y-0 right-0 w-4 items-end p-1".into());
    vertical.thumb_class = Some("w-1.5 rounded-full bg-muted-foreground opacity-60 hover:w-2".into());
    let mut horizontal = ScrollbarLook::default();
    horizontal.class = Some("absolute inset-x-0 bottom-0 h-4 items-end p-1".into());
    horizontal.thumb_class = Some("h-1.5 rounded-full bg-muted-foreground opacity-60 hover:h-2".into());
    let mut theme = ScrollbarTheme::default();
    theme.mode = ScrollbarMode::Hover;
    theme.motion.enter = 300.0;
    theme.motion.exit = 500.0;
    theme.vertical = Some(vertical);
    theme.horizontal = Some(horizontal);
    set_scrollbar_theme(Some(theme));
}
```

```tsx tabs
import { Scrollbar } from "nsh/base";

Scrollbar.setTheme({
  mode: "hover",
  motion: { enter: 300, exit: 500 },
  vertical: {
    class: "absolute inset-y-0 right-0 w-4 items-end p-1",
    thumbClass: "w-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:w-2",
  },
  horizontal: {
    class: "absolute inset-x-0 bottom-0 h-4 items-end p-1",
    thumbClass: "h-1.5 rounded-full bg-muted-foreground opacity-60 transition-all duration-300 hover:h-2",
  },
});
```

`ScrollbarTheme` は、すべてのビューで共通のバーの prop と、各軸の見た目を持ちます。

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `mode` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | バーが表示されるタイミング: [表示されるタイミング](#when-it-shows)。 |
| `motion` | `ScrollbarMotion` | スナップ、`idle` `2000` | 表示と非表示の方法: [モーション](#motion)。 |
| `minThumbLength` | `number` | `48` | サムの最小の長さ。 |
| `vertical`、`horizontal` | `ScrollbarLook` | なし | 縦方向と横方向のビューのバーの見た目。トラックには `class` と `style` を指定し、ビューのビューポート内に配置されます。そのほかに `thumbClass` と `thumbStyle`、`accessibilityLabel` があります。軸に見た目が指定されていないビューは、プラットフォームのインジケーターのままです。 |

後から `setTheme` を呼ぶとバーのスタイルが変わり、`Scrollbar.setTheme(null)` を呼ぶとビューにプラットフォームのインジケーターが戻ります。アプリがテーマを設定しているかどうかにかかわらず、1つのビューに専用のテーマを `scrollbar` prop(`<Scroll scrollbar={{ mode: "always", vertical: { … } }}>`)として渡すことができます。`scrollbar={false}` を指定したビューにはバーが付きません。親のビューポート内にレイアウトされたリスト(`viewport="parent"`)は、そのビューとそのバーとともにスクロールします。複数行の `Input` にも、縦方向の見た目のバーがテキストの上に付きます。このバーは、テキストビュー自体のインジケーターと同じようにテキストをスクロールします。

<a id="the-scroll-view-it-moves"></a>

## バーが動かすスクロールビュー

`scroll` は、バーが追従するスクロールビューまたはリストである `ref` を指定します。バーは画面に表示された時点でそれを見つけるため、`ref` は同じレンダー内の後ろの要素で設定してもかまいません。バーはスクロールビューの後ろに書いてください(または `ref` をシグナルに保持してください)。スクロールビュー自身のインジケーターは `scrollbar={false}` でオフにし、バーは `class` で配置します。配置先は、両方を囲む `relative` ボックス内のスクロールビューの端の上か、画面上のそれ以外の任意の場所です。

- サムの長さは、ビューポートが表示しているコンテンツの割合に相当し、トラックのコンテンツボックス(パディングの内側)に沿って決まります。ただし `minThumbLength` より短くなることはありません。サムの位置は、コンテンツがどれだけスクロールされたかで決まります。コンテンツが端を越えてバウンスしている間、サムはその端にとどまります。
- サムをドラッグすると、サムが動いた分だけコンテンツがスクロールします。トラックを押すと、サムの中央がポインターの下に移動し、ドラッグはそこから続きます。
- 縦方向のバーは縦方向のスクロールビューに追従します。横方向のスクロールビュー用のバーは `axis="horizontal"` で作ります(下端に沿って配置してください)。バーは1つの軸につき1つです。
- リストも同様に動作します。サムは、行が計測されて追加されるにつれて、リスト全体の長さに追従します。

<a id="when-it-shows"></a>

## 表示されるタイミング

| `mode` | 表示されるとき |
|---|---|
| `"scrolling"`(デフォルト) | コンテンツのスクロール中と、停止してから `motion.idle` が経過するまで。バーが表示されている間にポインターがバー上にあると、表示が維持されます。 |
| `"hover"` | ポインターがバーの上にあるとき(非表示の間も、バーがある場所では有効です)と、`"scrolling"` の場合と同じとき。 |
| `"always"` | 常に。 |

どのモードでも、サムをドラッグしている間は表示され、最後のスクロール、ドラッグ、ホバーの後も `motion.idle` の間は表示されたままになります。コンテンツがビューポートに収まっている間は、非表示のままです。非表示のとき、バーは `opacity: 0` の状態になり、押下はその下にあるものに素通しされます。

<a id="motion"></a>

## モーション

`motion` は、バーのフェードの時間を決めます。フェードはネイティブに実行され、`gpui-base` の `ScrollbarMotion` と同様に動作します。

| フィールド | デフォルト | 説明 |
|---|---|---|
| `idle` | `2000` | 最後のスクロール、ドラッグ、ホバーの後、バーが表示されたままになる時間(ミリ秒)。 |
| `enter` | `0` | 表示されるまでの時間。不透明度は線形に上がり、スライドはイーズアウトします。 |
| `exit` | `0` | `idle` が終わってからフェードアウトするまでの時間。イーズインし、フェードしながらトラックの外へスライドします。 |
| `entrance` | `"fade"` | 表示のされ方。`"fade"` はその場に表示し、`"slideAndFade"` はバーがある端(右または下)から入ってきます。 |
| `thumbHoverEntrance` | `"fade"` | 非表示のサム上のポインターによって表示されるときの入り方(`"hover"`)。 |

時間を指定しない場合、バーは即座に表示・非表示になります。フェードを途中で反転させても速度は維持され、残りの距離に相当する時間だけ実行されます。`"always"` のバーはアニメーションせず、ユーザーがモーションの低減を求めている間もアニメーションしません。スライドするものはトラックでクリップされます。`hover:` で広がる幅のような、サム自体のモーションは、そのスタイルが担当します(`thumbClass` の `transition-all`)。

## Props

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `scroll` | `.scroll(..)` | `YNode` | なし | バーが追従して動かすスクロールビューまたはリスト(その `ref`)。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"vertical"` | スクロールビューの軸。トラックはこの軸に沿って伸びます。バーの作成時に読み取られます。 |
| `mode` | `.mode(..)` | `"scrolling" \| "hover" \| "always"` | `"scrolling"` | バーが表示されるタイミング。 |
| `motion` | `.motion(..)` | `ScrollbarMotion` | スナップ、`idle` `2000` | 表示と非表示の方法: [モーション](#motion)。 |
| `minThumbLength` | `.min_thumb_length(..)` | `number` | `48` | 長いコンテンツでのサムの最小の長さ。つかみやすさを保ちます。 |
| `thumbClass`、`thumbStyle` | `.thumb_style(\|s\| ..)` | `string`、`StyleProp<ViewStyle>` | なし | サム。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがバーについて読み上げる内容。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | バー: そのトラック。アプリが配置する場所。 |

<a id="parts"></a>

## パーツ

| パーツ | 内側 | スタイルの指定 |
|---|---|---|
| トラック | アプリが配置する場所 | `class`、`style` |
| サム | トラックのコンテンツボックス | `thumbClass`、`thumbStyle` |

バーは軸方向のサムのサイズを決めて動かします。サムの太さと、トラック内での横方向の位置はアプリが決めます(トラックに `w-1.5` と `items-end` を指定すると、6ポイントのサムが右側に配置されます)。トラックのパディングによって、サムは端や側面から離れた位置に保たれます。

各パーツが持つ状態は次のとおりです。

- トラック: ポインターの下では `hover:` になります。これは `group` なので、サムはそこから `group-hover:` を受け取ります(ポインターが近づくと幅が広がるサムなど)。
- サム: ポインターの下では `hover:`、ドラッグ中は `active:` になります。

バーの可視性は不透明度で決まります。透明度は、トラックの背景かサムの色に持たせてください。幅が広がるサムには `transition-all` を使います(これはサムの位置を遅らせません。サムの位置はサムのスタイルとは別にバーが設定します)。また、モーションの低減を求めるユーザーに対しては、`motion-reduce:` がサムを静止させます。

<a id="accessibility"></a>

## アクセシビリティ

- スクリーンリーダーがスクロールする対象は、引き続きスクロールビューです。スクリーンリーダーは独自のジェスチャーでスクロールビューを動かし、その内容を読み上げます。
- バーに到達できるスクリーンリーダー向けに、バーには `accessibilityLabel` でラベルが付けられます。

ラベル、ロール、アクションの全般については、[アクセシビリティ](../docs/accessibility.md)を参照してください。

<a id="platform-notes"></a>

## プラットフォームに関する注意

- どのプラットフォームでも、アプリがスタイルを指定したとおりに描画され、サムは各プラットフォームがスクロールビューについて報告するオフセットに追従します。サムのドラッグとトラックの押下は、マウス、ペン、指のいずれでも動作します。
- `"hover"` は、マウスまたはタッチパッドのポインターに追従します(デスクトップとウェブ)。タッチスクリーンでは、バーはコンテンツのスクロール中に表示され、非表示のトラックはタッチを素通しします。
