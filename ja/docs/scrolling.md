---
title: "スクロール"
description: "RustとTSXでのスクロールビュー - ページングとスナップ、ズーム、プルリフレッシュ、スクロールイベント、scrollValueを使ったスクロール連動エフェクト、スクロールビュー内のキーボード、コードからのスクロール。"
order: 39
group: ui
demo: guide-scrolling
source_hash: 9701cda661979af8
---

# スクロール

スクロールビュー(Rust では `scroll()`、TSX では `<Scroll>`)は、プラットフォーム標準のスクロールビュー(iOS では UIScrollView、Android では ScrollView)です。フリング、バウンス、スクロールインジケーター、プルトゥリフレッシュ、スナップはすべてネイティブで動作します。コードではイベントを通じてスクロールを検知できます。また、オフセットを[アニメーション値](./animation.md#animated-values)にバインドすると、指の動きにフレーム単位で追従するエフェクトを作れます。

スクロールビューは、設定画面、フォーム、記事、チップの横並びなど、サイズが既知で中程度のコンテンツに使います。長いデータや上限のないデータには[リスト](./lists.md)を使ってください。リストは行を再利用し、同じスクロール用 props を受け付けます。

<a id="a-scroll-view"></a>

## スクロールビュー

スクロールビューはビューポートであり、その子要素がコンテンツになります。ビューポートのサイズは親から与える必要があります(通常は `flex: 1` や `.flex_1()`)。コンテンツは、ビューポートの幅(縦スクロール)または高さ(横スクロール)に合わせて配置され、長さは必要なだけ伸びます。

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    scroll().flex_1().bg(rgb(0xf6f8fa)).child(
        view().p_4().gap_3().children((1..=50).map(|n| {
            view().p_4().rounded(px(10.0)).bg(white()).child(text(format!("Row {n}")))
        })),
    )
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";

function App() {
  return (
    <Scroll style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Each of={Array.from({ length: 50 }, (_, i) => i + 1)}>
          {(n) => (
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: "#ffffff" }}>
              <Text>Row {n()}</Text>
            </View>
          )}
        </Each>
      </View>
    </Scroll>
  );
}

mount(App);
```

上の子ビューはスクロールビューのコンテンツコンテナです。TSX では `contentStyle`(または `contentClass`)を指定すると、そのスタイルを持つビューで子要素が自動的にラップされ、一緒にスクロールします。`flexGrow: 1`(`.flex_grow(1.0)`)を指定するとコンテンツの高さがビューポート以上になるため、短いコンテンツは中央に配置でき、長いコンテンツは引き続きスクロールできます。

```rust tabs
scroll().flex_1().child(
    view().flex_grow(1.0).justify_center().p_4().child(
        when(move || messages.with(|m| !m.is_empty()), move || {
            each(messages, |m| m.id, |m, _| text(move || m.with(|m| m.text.clone())))
        })
        .otherwise(|| text("No messages yet")),
    ),
)
```

```tsx tabs
<Scroll style={{ flex: 1 }} contentStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
  <If when={messages().length > 0} else={<Text>No messages yet</Text>}>
    <Each of={messages()}>{(m) => <Text>{m().text}</Text>}</Each>
  </If>
</Scroll>
```

横スクロールのビューには `horizontal`(`.horizontal()`)を指定し、子として行(row)を渡します。

```rust tabs
scroll().horizontal().scrollbar(false).child(
    view().flex_row().gap_2().px_4().children(["Today", "This week", "This month", "This year"].map(|label| {
        text(label).px(px(14.0)).py_2().rounded(px(16.0)).overflow_hidden().bg(white())
    })),
)
```

```tsx tabs
<Scroll horizontal scrollbar={false}>
  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
    <Each of={["Today", "This week", "This month", "This year"]}>
      {(label) => <Text style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: "#ffffff" }}>{label()}</Text>}
    </Each>
  </View>
</Scroll>
```

右から左へ表示する言語([デバイスと環境](./device-and-environment.md#right-to-left)を参照)では、横スクロールビューは右端から始まり、右端からの距離を保ちます。

スクロールビューは指のドラッグで操作します。デスクトップ(macOS、Windows、Linux)とブラウザーでは、マウスはデスクトップアプリと同じようにスクロールします。ホイール(Shift + ホイールで横スクロール)、タッチパッド、キーボード、スクロールインジケーターが使えます。インジケーターはマウスがビュー上にあるあいだ表示され、スクロールバーとしてドラッグできます。マウスのドラッグはアプリのパン、レスポンダー、テキスト選択に渡されます。デスクトップのタッチスクリーンでは、指と同じようにスクロールビューをドラッグできます。横スクロールのビューでは、`scrollbar={false}` を指定してもインジケーターが残ります。横ホイールのないマウスでは、これが横スクロールの手段になるためです。

<a id="behavior-props"></a>

### 動作に関する props

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `horizontal` | `.horizontal()` | `boolean` | `false` | 横方向にスクロールします。 |
| `scrollable` | `.scrollable(..)` | `boolean` | `true` | ユーザーがスクロールできるかどうかを指定します。コードからのスクロールは引き続き動作します。 |
| `bounces` | `.bounces(..)` | `boolean` | `true` | 端を越えるオーバースクロールを許可します。 |
| `scrollbar` | `.scrollbar(..)` | `boolean` | `true` | スクロールインジケーターを表示します。デスクトップとデスクトップブラウザーでは、横スクロールのビューはインジケーターを保持します。これはマウス用のスクロールバーです。 |
| `contentInset` | `.content_inset(EdgeInsets { .. })` | `Partial<Edges>` | | コンテンツの周囲の余白で、その中までスクロールできます。 |
| `contentOffset` | `.content_offset(point(..))` | `{ x?, y? }` | | スクロールの開始位置です。 |
| `decelerationRate` | `.deceleration(rate)` | `"normal" \| "fast" \| number` | プラットフォームの値 | フリングが減速する速さです。`"normal"`、`"fast"`、またはミリ秒あたりに保持される速度を指定します(`0.998` が標準、`0.99` が高速、`0` はプラットフォームのデフォルト)。 |

<a id="paging-and-snapping"></a>

## ページングとスナップ

スナップは、指を離した時点で、離した位置のオフセット、予測される慣性移動量、速度をもとにネイティブ側で決定されます。その後、スクロールビューは選ばれた停止位置まで滑らかに移動します。コードの介入は不要です。

| Prop | Rust | 型 | 説明 |
|---|---|---|---|
| `pagingEnabled` | `.paging(true)` | `boolean` | ビューポートのサイズの倍数の位置で停止します。 |
| `snapToInterval` | `.snap_interval(px(..))` | `number` | この長さの倍数の位置で停止します(0 でオフ)。 |
| `snapToOffsets` | `.snap_offsets(vec![..])` | `number[]` | 指定したオフセットで停止します。 |
| `snapToAlignment` | `.snap_alignment(SnapAlignment::Center)` | `"start" \| "center" \| "end"` | `snapToInterval` と併用し、アイテムのどの位置をビューポートに揃えるかを指定します。 |
| `disableIntervalMomentum` | `.disable_interval_momentum(true)` | `boolean` | フリングで移動できるのは最大で 1 つの停止位置までです。 |

ページャーの例です。スクロールビューと同じ幅のページと、スクロールの慣性移動が終わったときに更新されるインジケーターを使います。

```rust tabs
const COLORS: [u32; 4] = [0x0969da, 0x8250df, 0xbf3989, 0x1a7f37];

pub fn pager() -> impl IntoElement {
    let width = signal(0.0_f32);
    let page = signal(0_usize);
    let settle = move |e: &Point<Points>| {
        let width = width.get_untracked();
        if width > 0.0 {
            page.set((e.x.0 / width).round() as usize);
        }
    };
    let pages = COLORS.iter().enumerate().map(|(i, &color)| {
        view()
            .w(move || px(width.get()))
            .h(px(160.0))
            .bg(rgb(color))
            .items_center()
            .justify_center()
            .child(text(format!("Page {}", i + 1)).text_color(white()).text_2xl().font_weight(FontWeight::BOLD))
    });
    let dots = (0..COLORS.len()).map(|i| {
        view()
            .size_2()
            .rounded(px(4.0))
            .bg(move || if page.get() == i { rgb(0x0969da) } else { rgb(0xd0d7de) })
    });
    view()
        .gap_2()
        .p_4()
        .child(
            scroll()
                .horizontal()
                .paging(true)
                .scrollbar(false)
                .h(px(160.0))
                .rounded(px(12.0))
                .on_layout(move |frame: &Bounds<Points>| width.set(frame.size.width.0))
                .on_scroll_end(settle)
                .child(view().flex_row().children(pages)),
        )
        .child(view().flex_row().justify_center().gap(px(6.0)).children(dots))
}
```

```tsx tabs
import { mount, type Point, Scroll, signal, Text, View } from "nsh";

const colors = ["#0969da", "#8250df", "#bf3989", "#1a7f37"];

function Pager() {
  const width = signal(0);
  const page = signal(0);
  const settle = ({ offset }: { offset: Point }) => page.set(Math.round(offset.x / width()));
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <Scroll
        horizontal
        pagingEnabled
        scrollbar={false}
        style={{ height: 160, borderRadius: 12 }}
        onLayout={({ bounds }) => width.set(bounds.size.width)}
        onScrollEnd={settle}
      >
        <View style={{ flexDirection: "row" }}>
          <Each of={colors}>
            {(color, i) => (
              <View style={{ width: width(), height: 160, backgroundColor: color(), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>Page {i() + 1}</Text>
              </View>
            )}
          </Each>
        </View>
      </Scroll>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <Each of={colors}>
          {(_, i) => <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: page() === i() ? "#0969da" : "#d0d7de" }} />}
        </Each>
      </View>
    </View>
  );
}

mount(Pager);
```

中央にスナップするカードのカルーセルの例です。1 回のフリングで 1 枚ずつ進みます。

```rust tabs
scroll()
    .horizontal()
    .snap_interval(px(232.0))          // card width (220) + gap (12)
    .snap_alignment(SnapAlignment::Center)
    .deceleration(0.99)
    .disable_interval_momentum(true)
    .scrollbar(false)
    .child(view().flex_row().gap_3().px_4().children(cards))
```

```tsx tabs
<Scroll
  horizontal
  snapToInterval={232}          // card width (220) + gap (12)
  snapToAlignment="center"
  decelerationRate="fast"
  disableIntervalMomentum
  scrollbar={false}
>
  <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>…</View>
</Scroll>
```

リストも同じスナップ用 props を受け付けるため、長いカルーセルにはリストのほうが適しています。

<a id="scroll-events"></a>

## スクロールイベント

| Prop | Rust | ペイロード | タイミング |
|---|---|---|---|
| `onScroll` | `.on_scroll(..)` | `ScrollEvent` | オフセットが変化したとき。1 フレームにつき最大 1 回です。`scrollEventThrottle` で間隔をさらに空けられます。 |
| `scrollEventThrottle` | `.event_throttle(ms)` | `number` | `onScroll` イベント間の最小間隔(ミリ秒)です。 |
| `onScrollDragStart` | `.on_scroll_drag_start(..)` | `{ offset }` | ユーザーがドラッグを開始したとき。 |
| `onScrollDragEnd` | `.on_scroll_drag_end(..)` | `{ offset }` | ユーザーが指を離したとき。 |
| `onMomentumStart` | `.on_momentum_start(..)` | `{ offset }` | フリング後の慣性移動が始まったとき。 |
| `onMomentumEnd` | `.on_momentum_end(..)` | `{ offset }` | 慣性移動が終わったとき(新たなドラッグで止められた場合も含みます)。 |
| `onScrollEnd` | `.on_scroll_end(..)` | `{ offset }` | ユーザーによるスクロールが静止したとき。慣性移動の後、または慣性移動なしでドラッグが終わった時点です。 |

`ScrollEvent` には、オフセット(`offset`、型は `Point`。Rust でも同じ)、コンテンツのサイズ、ズーム後のサイズ(`contentSize`、型は `Size`。`content_size`)、ビューポート(`size`)、`zoomScale`(`zoom_scale`)が含まれます。その他のイベントにはオフセットが含まれます。TSX では `{ offset }` が `Point` として、Rust では `Point<Points>` として渡されます。

```rust tabs
let at_bottom = signal(false);

scroll()
    .flex_1()
    .event_throttle(100.0)
    .on_scroll(move |e: &ScrollEvent| {
        at_bottom.set(e.offset.y + e.size.height >= e.content_size.height - px(20.0))
    })
    .child(content)
```

```tsx tabs
const atBottom = signal(false);

<Scroll
  style={{ flex: 1 }}
  scrollEventThrottle={100}
  onScroll={(e) => atBottom.set(e.offset.y + e.size.height >= e.contentSize.height - 20)}
>
  …
</Scroll>
```

> [!TIP]
> `onScroll` は、スクロールのたびに毎フレームコードを実行します(スロットル設定に従います)。ヘッダーのフェードやパララックス画像のように、スクロールに連動して*見える*だけでよいものには、代わりに [`scrollValue`](#scroll-linked-effects-scrollvalue) を使ってください。完全にネイティブ側で動作します。

<a id="scroll-linked-effects-scrollvalue"></a>

## スクロール連動エフェクト: scrollValue

`scrollValue`(`.scroll_value(&value)`)は[アニメーション値](./animation.md#animated-values)を受け取り、コンテンツが動くのと同じフレームで、(主軸方向の)スクロールオフセットをネイティブ側でその値に書き込みます。この値、またはそこから `interpolate`、`diffClamp`(`diff_clamp`)や算術演算で派生させたノードを、スタイルにバインドします。

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let offset = animated_value(0.0);
    view()
        .flex_1()
        .child(
            view()
                .h(px(56.0))
                .justify_center()
                .px_4()
                // Transparent at the top, white after 80 points.
                .bind_background(&offset.interpolate_colors(&[0.0, 80.0], &[rgba(0xffffff00), rgba(0xffffffff)]))
                .child(
                    text("Inbox")
                        .text_size(px(22.0))
                        .font_weight(FontWeight::BOLD)
                        .origin_left()
                        .bind_scale(&offset.interpolate(&[0.0, 80.0], &[1.0, 0.8])),
                ),
        )
        .child(scroll().flex_1().scroll_value(&offset).child(view().p_4().gap_2()))
}
```

```tsx tabs
import { mount, Scroll, Text, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const offset = createAnimatedValue(0);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 56,
          justifyContent: "center",
          paddingHorizontal: 16,
          // Transparent at the top, white after 80 points.
          backgroundColor: offset.interpolate({ inputRange: [0, 80], outputRange: ["rgba(255,255,255,0)", "#ffffff"] }),
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            transformOrigin: "left center",
            scale: offset.interpolate({ inputRange: [0, 80], outputRange: [1, 0.8] }),
          }}
        >
          Inbox
        </Text>
      </View>
      <Scroll style={{ flex: 1 }} scrollValue={offset}>
        <View style={{ padding: 16, gap: 8 }}>…</View>
      </Scroll>
    </View>
  );
}

mount(App);
```

上方向にスクロールすると隠れ、下方向にスクロールするとすぐに戻るヘッダーは、オフセットの `diffClamp` で実現できます。

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

view()
    .flex_1()
    .child(scroll().flex_1().scroll_value(&offset).child(view().pt(px(56.0))))
    .child(view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0)))
```

```tsx tabs
const offset = createAnimatedValue(0);
const header = offset.diffClamp(0, 56);

<View style={{ flex: 1 }}>
  <Scroll style={{ flex: 1 }} scrollValue={offset}>
    <View style={{ paddingTop: 56 }}>…</View>
  </Scroll>
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
</View>
```

補間はデフォルトで入力範囲の外側をクランプします。そのため、上端を越えて引っ張った場合(負のオフセット)でも、エフェクトは終端の状態のままです。引っ張ると伸びるヘッダーにしたい場合は `extrapolate: "extend"`(Rust では `interpolate_with(.., Interpolation::extrapolate(Extrapolate::Extend))`)を渡してください。

<a id="pull-to-refresh"></a>

## プルトゥリフレッシュ

`refreshing` と `onRefresh`(`.refreshing(..)` と `.on_refresh(..)`)を指定すると、プラットフォーム標準のプルトゥリフレッシュコントロールが追加されます。コントロールは `refreshing` が true のあいだ表示されます。`onRefresh` 内で true に設定し、処理が終わったら解除してください。

```rust tabs
let refreshing = signal(false);
let reload = move || {
    refreshing.set(true);
    spawn(async move {
        if let Ok(response) = fetch("https://api.example.com/items").await {
            items.set(parse_items(&response.text()));
        }
        refreshing.set(false);
    });
};

scroll().flex_1().refreshing(refreshing).on_refresh(reload).child(content)
```

```tsx tabs
const refreshing = signal(false);
const reload = async () => {
  refreshing.set(true);
  try {
    items.set(await (await fetch("https://api.example.com/items")).json());
  } finally {
    refreshing.set(false);
  }
};

<Scroll style={{ flex: 1 }} refreshing={refreshing()} onRefresh={reload}>…</Scroll>
```

iOS ではコントロールとして UIRefreshControl が使われます。Mac Catalyst の Mac イディオムでは、NSH が同じ動作を持つ独自のスピナーを表示します。リストも同じ props を受け付けます。デスクトップとブラウザーでは、マウスはドラッグせずにスクロールするため、プルはタッチスクリーン(または上端を越えて引っ張れる macOS のトラックパッド)のジェスチャーになります。そのため、ボタンやキーボードショートカットなど、別の更新手段も用意してください。

<a id="an-indicator-of-your-own"></a>

### 独自のインジケーター

プルの見た目はアプリ側で自由に決められます。`refreshIndicator={{ height }}` を指定すると、アプリが独自のインジケーターを描画することになります。`height` はポイント単位の高さです。プラットフォームのスピナーは非表示になり、プルが `height` に達すると更新が行われ、更新中はインジケーター用に `height` がコンテンツの上に確保されます。`pullValue` は、コンテンツが上端を越えて引っ張られた距離をアニメーション値に供給します。静止時は 0、引っ張るにつれて増加し、更新中は `height` になります。インジケーターはスクロールビューの上端に重ねて描画し、その値からスタイルを補間してください。スタイルは UI スレッド上で指に追従し、フレームごとの JS 実行は不要です。

```rust tabs
let pull = animated_value(0.0);

view()
    .flex_1()
    .child(
        scroll()
            .flex_1()
            .refreshing(refreshing)
            .on_refresh(reload)
            .pull_value(&pull)
            .refresh_indicator(Some(px(72.0)))
            .child(content),
    )
    .child(
        view()
            .pointer_events(PointerEvents::None)
            .absolute()
            .top_0()
            .left_0()
            .right_0()
            .h(px(72.0))
            .items_center()
            .justify_center()
            .bind_opacity(&pull.interpolate(&[0.0, 36.0], &[0.0, 1.0]))
            .bind_rotate(&pull.interpolate(&[36.0, 72.0], &[0.0, 180.0]))
            .child(arrow()),
    )
```

```tsx tabs
const pull = createAnimatedValue(0);

<View style={{ flex: 1 }}>
  <Scroll
    style={{ flex: 1 }}
    refreshing={refreshing()}
    onRefresh={reload}
    pullValue={pull}
    refreshIndicator={{ height: 72 }}
  >
    …
  </Scroll>
  <View
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      opacity: pull.interpolate({ inputRange: [0, 36], outputRange: [0, 1] }),
      transform: [{ rotate: pull.interpolate({ inputRange: [36, 72], outputRange: ["0deg", "180deg"] }) }],
    }}
  >
    <Arrow />
  </View>
</View>;
```

`height` はビューポートの半分以内に収めてください。上端を越えると、引っ張るほどコンテンツが指に対して強く抵抗するため、遠すぎる高さには到達できません。iOS では、アプリ独自のインジケーターは UIRefreshControl に代わり、Mac イディオムと同様に NSH 自身が検出したプルを使います。

<a id="zooming"></a>

## ズーム

スクロールビュー(リストのスケールは 1 のままです)は、最大ズームスケールが最小ズームスケールより大きい場合にズームできます。ピンチ操作でコンテンツが拡大縮小され、拡大中は縦横両方向にスクロールできます。

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `minimumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最小のズームです。 |
| `maximumZoomScale` | `.zoom_range(min, max)` | `number` | `1` | 最大のズームです。最小より大きい場合、ピンチでズームできます。 |
| `zoomScale` | `.zoom(scale)` | `number` | | この prop が変化したときに、このスケールへズームします。それ以外のときは、ユーザーが設定したズームが保持されます。 |
| `bouncesZoom` | `.bounces_zoom(..)` | `boolean` | `true` | ピンチ操作で上限・下限を越えることができ、離すと元に戻ります。 |
| `zoomable` | `.zoomable(..)` | `boolean` | `true` | ユーザーがピンチでズームできるかどうかを指定します。 |
| `centerContent` | `.center_content(..)` | `boolean` | `false` | ビューポートより小さいコンテンツ(縮小時)を中央に配置します。 |

スクロールイベントは、ズームスケールとズーム後のコンテンツサイズを報告します。コードからは、`zoom_to(scale, center, animated)` / `zoomTo({ scale, x, y, animated })` を使うと、(ズームしていない状態のポイント単位の)コンテンツ上の点がビューポートの中央に来るようにズームできます。ダブルタップでズームする処理は、これを呼び出す press ハンドラーとして実装します。

```rust tabs
pub fn photo() -> impl IntoElement {
    let photo = element_ref();
    let scale = signal(1.0_f32);
    scroll()
        .flex_1()
        .bg(black())
        .zoom_range(1.0, 4.0)
        .center_content(true)
        .on_scroll(move |e: &ScrollEvent| scale.set(e.zoom_scale))
        .element_ref(&photo)
        .child(
            image("https://picsum.photos/id/1015/1200/800")
                .w(px(390.0))
                .h(px(260.0))
                .on_press(move || photo.zoom_to(if scale.get_untracked() > 1.5 { 1.0 } else { 3.0 }, None, true)),
        )
}
```

```tsx tabs
import { Image, mount, Scroll, type ScrollRef, signal } from "nsh";

function Photo() {
  let scroll!: ScrollRef;
  const scale = signal(1);
  return (
    <Scroll
      ref={scroll}
      style={{ flex: 1, backgroundColor: "#000000" }}
      minimumZoomScale={1}
      maximumZoomScale={4}
      centerContent
      onScroll={(e) => scale.set(e.zoomScale)}
    >
      <Image
        src="https://picsum.photos/id/1015/1200/800"
        style={{ width: 390, height: 260 }}
        onPress={() => scroll.zoomTo({ scale: scale() > 1.5 ? 1 : 3 })}
      />
    </Scroll>
  );
}

mount(Photo);
```

ズームされたスクロールビュー内のテキストやキャンバスは、ズームの終了時に新しい解像度で再描画されるため、iOS では鮮明さが保たれます。Android では、NSH は独自のスクロールビューでズームを実装しています。ピンチの焦点を中心に拡大縮小し、任意の本数の指でパンでき、フリングや、端およびズーム限界でのラバーバンドにも対応します。Android では、システムのジェスチャー検出器と同様に、指の間隔が約 27 mm になった時点でピンチが始まります。

<a id="scrolling-from-code"></a>

## コードからのスクロール

スクロールビューに ref を与え(Rust では `element_ref()` と `.element_ref(&scroller)`、TSX では [`ref`](./jsx-and-components.md))、そのメソッドを呼び出します。コマンドは同じ更新内のほかの変更が反映された後に実行されるため、追加したばかりのコンテンツへもスクロールできます。

| Rust | TSX | 説明 |
|---|---|---|
| `scroll_to(point, animated)` | `scrollTo({ x?, y?, animated? })` | 指定したオフセットへスクロールします。TSX ではデフォルトでアニメーションします。 |
| `zoom_to(scale, center, animated)` | `zoomTo({ scale, x?, y?, animated? })` | ズーム可能なスクロールビュー用です。`scale` へ(限界値の範囲内に収めて)、コンテンツ上の点またはビューポートの中央を基準にズームします。 |

```rust tabs
let scroller = element_ref();

scroll().flex_1().element_ref(&scroller).child(content)
view().on_press(move || scroller.scroll_to(point(px(0.0), px(0.0)), true))
```

```tsx tabs
let scroll!: ScrollRef;

<Scroll ref={scroll} style={{ flex: 1 }}>…</Scroll>
<View onPress={() => scroll.scrollTo({ y: 0 })}>…</View>
```

リストには `scrollToIndex`、`scrollToOffset`、`scrollToEnd` が追加されます。[リスト](./lists.md#scrolling-from-code)を参照してください。

<a id="scroll-views-and-the-keyboard"></a>

## スクロールビューとキーボード

NSH は、フォーカスされた入力欄が見える状態を自動的に保ちます。キーボードが表示されると、入力欄を囲むスクロールビューにキーボードと同じ高さの下インセットが設定され、入力欄が見える位置までスクロールされます。この処理はネイティブ側で行われ、アプリ側のコードは不要です。画面下部に固定されたメッセージバーなど、スクロールビューの外にあるコンテンツには、`env(keyboard-inset-height)` を下パディングとして使ってください([スクロールビュー外のコンテンツ](./forms-and-keyboard.md#content-outside-scroll-views))。

スクロールやタップがキーボードとどう連動するかは、2 つの props で決まります。

| Prop | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `keyboardDismissMode` | `.keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)` | `"none" \| "on-drag" \| "interactive"` | `"none"` | コンテンツのドラッグでキーボードを隠すかどうかを指定します。`"interactive"` は、iOS ではキーボードが指に追従して下がります。Android では `"on-drag"` と同じ動作になります。 |
| `keyboardShouldPersistTaps` | `.keyboard_taps(KeyboardTaps::Handled)` | `"never" \| "always" \| "handled"` | `"never"` | キーボードが表示されているときのタップの動作を指定します。 |

`keyboardShouldPersistTaps`:

- `"never"`: フォーカスされた入力欄の外をタップするとキーボードが隠れるだけで、ボタンは次のタップを受け取ります。ユーザーは、閉じるために 1 回、押すためにもう 1 回タップする必要があります。
- `"handled"`: タップを処理する要素(ボタンなど)へのタップはそのまま通り、キーボードは表示されたままです。何もない場所をタップするとキーボードが隠れます。フォームでは通常これが適切です。
- `"always"`: どのタップでもキーボードは表示されたままです。

どちらも、タップやドラッグが発生した時点でコードを待たずにネイティブ側で判断されます。コードからキーボードを隠すには、Rust では `dismiss_keyboard()` を、TSX では [`nsh`](../modules/nsh.md#keyboard-and-keyboardframe) の `Keyboard.dismiss()` を呼び出します。

<a id="nested-scroll-views"></a>

## スクロールビューの入れ子

縦スクロールのビューの中に横スクロールのビューを置いても、期待どおりに動作します。それぞれが自分の軸方向のドラッグを受け取ります。同じ軸のスクロールビューも入れ子にできます(内側が先にスクロールします)。スクロールビュー内の描画キャンバスなど、指の操作を必要とするレスポンダーは、周囲のスクロールビューからその操作を奪えます。Rust では `.keep_touches(true)`、TSX では `onResponderGrant` から返す `true` を使います。[タッチとジェスチャー](./touch-and-gestures.md#the-responder-system)を参照してください。

<a id="related"></a>

## 関連項目

- [Scroll](../elements/scroll.md): エレメントリファレンス。すべての props とイベントを掲載しています。
- [リスト](./lists.md): 同じスクロール用 props を持つ仮想化リストです。
- [アニメーション](./animation.md): アニメーション値、およびスクロール連動エフェクト用の `interpolate` と `diffClamp` です。
- [フォームとキーボード](./forms-and-keyboard.md): 入力欄、フォーカス、キーボードについて説明します。
