---
title: "タッチとジェスチャー"
description: "プレスとプレスフィードバック、ヒットエリア、ポインターイベント、生のタッチ、レスポンダーシステム、PanResponder、およびネイティブのパン、ピンチ、回転ジェスチャーについて説明します。"
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---

# タッチとジェスチャー

NSH のタッチ処理には 3 つのレベルがあります。**プレス**（Rust の `.on_press`、TSX の `onPress` とその仲間）はボタン、行、リンクを対象とし、プレスのフィードバックはネイティブに描画されます。**ネイティブジェスチャー**（パン、ピンチ、回転）は UI スレッド上で[アニメーション値](./animation.md#animated-values)を動かすため、コードがビジー状態でもドラッグ中のカードは指に追従します。**生のタッチとレスポンダーシステム**（Rust の `.on_touch` と `.claim_touches` および `.on_responder_*` ハンドラー、TSX の `onTouchStart`、`onResponderMove`、`PanResponder`）は、描画のように他の 2 つでは表現できない用途のために、すべての指の位置をコードに渡します。

ジョブをこなせる最も高いレベルを選んでください。レベルが高いほど、UI スレッドからコードへ渡る処理が少なくなります。

<a id="presses"></a>

## プレス

すべての要素がプレスハンドラーを受け付けます。「タッチ可能」な専用コンポーネントはありません。view、text、image など任意の要素に `.on_press` / `onPress` を指定できます。

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | デフォルト | 説明 |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | 指が view の内側で離れた（プレスの後。ロングプレスではない）。 |
| `.on_long_press(..)` | `onLongPress` | | 指がロングプレスの遅延時間のあいだ押され続けた。この場合、プレスハンドラーは呼ばれません。 |
| `.on_press_down(..)` | `onPressDown` | | プレスが始まった。 |
| `.on_press_up(..)` | `onPressUp` | | プレスが終わった（指が離れた、view の外にスライドした、またはスクロールビューに引き継がれた）。 |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | プレスがロングプレスになるまでのミリ秒数。 |
| `.disabled(..)` | `disabled` | `false` | プレスを受け付けず、フィードバックも表示しません。無効時のスタイルが適用され、スクリーンリーダーは無効であると読み上げます。 |

プレスの挙動は次のとおりです。

- **最も内側のプレス可能な view だけが反応します。** プレス可能なボタンを含むプレス可能な行では、ボタンを押しても行にはプレスが届きません。
- **スクロールビュー内では、プレスは開始まで約 130 ms 待ちます**（フィードバックの表示も同様）。そのため、ボタン上から始まったドラッグはボタンを押さずにスクロールになります。
- **スライドして外れるとキャンセルされます。** 指が view の外に出ると、プレスはプレスアップハンドラーで終了し、プレスは発生しません。
- **無効にすると、マウント済みの要素からプレスリスナーが取り除かれます。** そのため view にはフィードバックがまったく表示されず、無効時のスタイル（`.disabled_style(..)`、`class="disabled:opacity-40"`）が適用されます。
- **プレスハンドラーを持つ入れ子のテキストスパンはリンクになります。** 段落は 1 つのネイティブ view であり、プレスは指の下にあるスパンに渡されます。詳しくは [Text](./text.md) を参照してください。

<a id="press-feedback"></a>

## プレスのフィードバック

プレスのフィードバックはアプリ側で定義するものです。view が押されたとき、ホバーされたとき、フォーカスされたとき、無効のときに適用されるスタイルを指定します。状態が変わった瞬間にコードへの往復なしでネイティブに適用されます。各状態には Rust のメソッド、TSX のスタイル prop、[Tailwind バリアント](./tailwind.md)があります。

| Rust | TSX prop | クラス | 説明 |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | 押されている間。 |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | ポインターが上にある間（デスクトップ、iPad のポインター、ブラウザー）。 |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | フォーカスを持っている間。 |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | その view またはその内側の view がフォーカスを持っている間（編集する input を囲むフィールドの枠など）。 |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | 無効の間。 |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | スタイルに加えて、Android のマテリアルリップル（`color`、`borderless`、`radius`、`foreground`）。 |

状態のスタイルは view 自身のスタイルの上に重ねられます。後の状態が優先され（hover、focus、active の順）、無効時のスタイルはすべてに優先します。view が無効の間は、それ以外の状態スタイルは適用されません。

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

ボーダーなしのリップルは view の外側に広がるため、アイコンボタンに適しています: `Ripple { borderless: true, radius: Some(px(24.0)), .. }`、`android={{ ripple: { borderless: true, radius: 24 } }}`。[Platform-specific code](./platform-specific.md) を参照してください。

トランジション（`.transition()`、`transition` クラス）を指定すると、状態の変化がアニメーションします。`.group()`（`group` クラス）は view をグループにし、`.group_active(..)`（`group-active:`）はグループが押されている間、その子をスタイルします。

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## ヒット領域: hitSlop

hit slop（`.hit_slop(..)`、`hitSlop`）は、レイアウトを変えずに、タッチを受け付ける領域を view の境界の外へ広げます。閉じるボタンやトグルのような小さなターゲットに使用します。

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | 説明 |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | 境界の周囲に加えるポイント数。`EdgeInsets::all(..)` と TSX の数値は 4 辺すべてに適用されます。 |

広げた領域は親の境界の内側に収めてください（小さな view の周囲にマージンやパディングを設けます）。ヒットテストは親を通して子に届くため、親の外側へのタッチは子の slop には到達しません。

<a id="children-outside-their-parent"></a>

## 親の外側にある子

親の境界の外に配置された子（`overflow` による絶対配置で表示されたままのもの。フィールドの下に出るドロップダウンなど）は、他の view と同様に、描画されている場所でタッチを受け付けます。NSH は、view の外にはみ出す子孫のヒットテストをネイティブに行います。オーバーフローをクリップする親は子もクリップし、その場合、子はそこに表示されずタッチも受け付けません。この領域はレイアウトから計算されるため、transform で親の外に移動した子は、親の境界の内側でのみタッチを受け付けます。

描画順に注意してください。ドロップダウンがフィールドの兄弟 view より上に描画されるのは、フィールドがそれらより後ろにあるか、より高い `z-index` を持つ場合だけで、タッチは最前面に描画されているものに渡されます。

## pointerEvents

スタイルキー `pointerEvents`（Rust では `.pointer_events(..)`）は、サブツリーのどの view がタッチのターゲットになれるかを決めます。ヒットテスト中にネイティブに評価されるため、タッチごとのコストはかかりません。

| Rust | TSX | view | その子 |
|---|---|---|---|
| `PointerEvents::Auto`（デフォルト） | `"auto"` | タッチを受け付ける | タッチを受け付ける |
| `PointerEvents::None` | `"none"` | ターゲットにならない | `"auto"` を設定した子を除き、ターゲットにならない。タッチは背後のものに通過する |
| `PointerEvents::BoxNone` | `"box-none"` | ターゲットにならない | タッチを受け付ける |
| `PointerEvents::BoxOnly` | `"box-only"` | タッチを受け付ける | ターゲットにならない |

典型的な用途は次のとおりです。下にあるものをブロックしてはならないオーバーレイ（none）、空きスペースでは背後のコンテンツにタッチを通しつつ、ボタンは引き続き動作する全画面コンテナ（box-none）、指が子の上に落ちても行自体にプレスを受け取らせたい行（box-only）。

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"` は CSS の `pointer-events` と同様に継承されます。その内側にあり `"auto"` を設定した view は、再びタッチを受け付けます。`"box-none"` と `"box-only"` は、それを設定した view にのみ適用されます。Tailwind クラス `pointer-events-none` と `pointer-events-auto` は `"none"` と `"auto"` を設定します。また、スタイルキーとしての `pointerEvents` は、状態スタイル（`activeStyle` など）やバリアントも受け付けます。

<a id="native-gestures-pan-pinch-and-rotation"></a>

## ネイティブジェスチャー: パン、ピンチ、回転

画面上で何かを動かすドラッグ、ピンチ、回転には、[アニメーション値](./animation.md#animated-values)をジェスチャーにバインドします。プラットフォームのジェスチャー認識器が UI スレッドで値を書き込み、それにバインドされた view が同じフレームで動きます。コードには、ジェスチャーの開始と終了だけが通知されます。

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | 説明 |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | 1 本指のドラッグがこれらの値をポイント単位で動かします。 |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | 2 本指のピンチが `scale`（係数）を駆動します。 |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | 2 本指の回転が `angle` を度単位で駆動します。 |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | ドラッグの開始 / 終了。`PanEvent` が渡されます。 |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | ピンチの開始 / 終了。そのスケールと速度（`GestureEvent`）が渡されます。 |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | 回転の開始 / 終了。その角度（Rust では `GestureEvent<Radians>`）と速度が渡されます。 |

パンイベントには、移動量（`translation`、`Point`。開始からのポイント数）、速度（`velocity_x` / `velocity_y`。TSX では `velocity`、`Point`。**1 秒あたり**のポイント数）、およびその時点でバインドされている値（`value_x` / `value_y`。TSX では `value`、`{ x?, y? }`。`pan` がバインドする軸を持つ）が含まれます。

ネイティブ側が行ってくれることは次のとおりです。

- **ドラッグは値のある位置から続きます。** 開始時に値が読み取られ、移動量がそれに加算されます。まだアニメーション中の値（元の位置に戻るスプリングなど）をつかむと、アニメーションはその位置で止まります。
- **片方の軸だけの場合、もう一方はスクロールに任せます。** 水平方向の値だけをバインドした場合、ドラッグは指が垂直よりも水平に多く動いたときにのみ始まります。そのため、垂直スクロールビュー内の水平スワイプ行でも、垂直スクロールは引き続き動作します。この判断は、システムがジェスチャーを開始してよいかを尋ねる際に、ネイティブ側で行われます。
- **パン、ピンチ、回転は同じ view で同時に動作します。** 1 枚のカードを、同時にドラッグ、ピンチ、回転できます。
- **リリース速度を物理演算に使えます。** パン終了時の速度は、スプリングやディケイの速度に直接渡せます。値からスナップ位置を選ぶこともできます。

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> ドラッグが何かを動かすだけの場合は、レスポンダー経由で追従するのではなく、アニメーション値をジェスチャーにバインドしてください。値をバインドすれば、アプリのコードがビジーでもドラッグがカクつくことはありません。レスポンダーでは、すべての移動がコードへのイベントとなり、view の表示内容の更新も必要になります。

<a id="raw-touches"></a>

## 生のタッチ

タッチハンドラーは、すべての指が下りたとき、動いたとき、離れたときにそれを報告します。ロギング、独自のヒットテスト、マルチタッチへの反応に役立ちます。タッチを占有しないため、プレスやスクロールビューは引き続き動作します。

Rust では、`.on_touch(..)` がすべてのフェーズを `TouchEvent` として受け取ります。これには、その `phase`（`TouchPhase::Start`、`Move`、`End`、`Cancel`）、その `timestamp`、および `points`（下りているすべての指）が含まれ、それぞれに `id`、指が下りた view 内での `location`、サーフェス内での `page` 位置、そしてイベントの対象となる指を示す `changed` があります。TSX では、フェーズごとに専用のハンドラーがあります。

| TSX | 説明 |
|---|---|
| `onTouchStart` | 指が view 上またはその内側に下りた。 |
| `onTouchMove` | 指が動いた。移動はエンジンのターンごとにまとめられます。 |
| `onTouchEnd` | 指が離れた。 |
| `onTouchCancel` | システムがタッチを奪った（スクロールビューがスクロールを開始した、着信があったなど）。 |
| `onTouchStartCapture`、`onTouchMoveCapture`、`onTouchEndCapture`、`onTouchCancelCapture` | 同じものを、バブリングするハンドラーより前に、外側から内側へ向かって呼び出すもの。 |

各 TSX ハンドラーは `GestureResponderEvent` を受け取ります。

| フィールド | 説明 |
|---|---|
| `identifier` | 指が下りている間、その指を識別します。 |
| `locationX`、`locationY` | 指が下りた view 内での位置（`target`）。 |
| `pageX`、`pageY` | サーフェス内での位置。 |
| `target` | 指が下りた view の id。 |
| `timestamp` | ミリ秒。 |
| `touches` | 下りているすべての指。 |
| `changedTouches` | このイベントの対象となる指。 |
| `nativeEvent` | イベント自身。そのため `e.nativeEvent.locationX` も使えます。 |
| `stopPropagation()` | より外側の view にはこのタッチイベントが届かなくなります。 |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### view の位置: measure

タッチの位置は、指が下りた view を基準とした相対位置であり、それは関心のある view の子（スライダーのつまみなど）である場合があります。view を計測すると、その位置がわかるため、代わりにページ上の位置を使用できます。Rust では view に `element_ref()` を付けてその `measure()` を await し、TSX ではその ref に対して `measure()` を呼び出します。

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

これは、ここまでの変更がレイアウトされた時点で解決されます。Rust では `Measurement`（`frame` はレイアウトハンドラーが報告する親内でのフレーム、`page` は左上隅）に、TSX では `{ bounds, pagePosition }` に解決されます。この隅の座標は、サーフェス内（view がダイアログ内にある場合はそのダイアログ内）のもので、タッチのページ位置と同じ座標系です。周囲のスクロールビューとリストのオフセットは考慮されますが、transform（アニメーションを含む）は考慮されません。画面上にない view に対しては `None` / `null` に解決されます。
<a id="the-responder-system"></a>

## レスポンダーシステム

タッチシーケンスをコード側で管理する必要がある場合（指での描画、カスタムスライダー、ネイティブのジェスチャー認識機構にないジェスチャーなど）は、ジェスチャーレスポンダーシステムを使用します。同時に **レスポンダー** になれるビューは 1 つだけで、そのビューが移動イベントを受け取ります。誰がレスポンダーになるかは、ビュー同士が調停して決めます。

レスポンダーになる:

| Rust | TSX | 説明 |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` が `true` を返す | 指が置かれたときに、ターゲットから外側へ向かって問い合わせられます。 |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` が `true` を返す | レスポンダーがいない間（またはレスポンダーを奪い取るとき）、移動のたびに問い合わせられます。 |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | 上記と同様ですが、バブリングする方より先に、外側から内側へ向かって問い合わせられます。親が子からタッチを奪うために使います。 |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | 移動版です。 |

要求（claim）は、問い合わせを行う設定でない限り、ビューの情報だけで決まり、コードは実行されません。`TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` は、リスナーが `r.claim()` を呼び出したときに要求を行い、ここまでのジェスチャー（`r.event.gesture`）をもとに判断します。TSX のハンドラーは、第 2 引数としてジェスチャー `gestureState` を受け取ります。そのフィールドは [PanResponder の場合](#panresponder)と同じです（`dx`、`dy`、`vx`、`vy`、`moveX`、`moveY`、`x0`、`y0`、`numberActiveTouches`）。水平方向の移動のみを要求するスワイプ: `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`。ただし、この判断は 1 回の移動分だけ遅れるため、周囲のスクロールビューが先にスクロールを開始する場合があります。スクロールビュー内でのドラッグには、[pan activation](#pans-inside-scroll-views-panactivation) を使用してください。

レスポンダーである間:

| Rust | TSX | 説明 |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | このビューがレスポンダーになりました。Rust では、デフォルトでネイティブのスクロールビューがタッチを奪えないようになっています（`TouchClaim::block_native(false)` を使うと奪えるようになります）。TSX では、そのために `true` を返します。 |
| `.on_responder_reject(..)` | `onResponderReject` | 別のビューがレスポンダーであり、手放そうとしませんでした。 |
| `.on_responder_start(..)` | `onResponderStart` | 別の指が置かれました。 |
| `.on_responder_move(..)` | `onResponderMove` | 指が移動しました。 |
| `.on_responder_end(..)` | `onResponderEnd` | 指が離れました。 |
| `.on_responder_release(..)` | `onResponderRelease` | 最後の指が離れました。ジェスチャーは終了です。 |
| `.keep_touches(true)` | `onResponderTerminationRequest` が `false` を返す | 別のビューがタッチを求めています。タッチを保持します（デフォルトでは譲り渡されます）。 |
| `.on_responder_terminate(..)` | `onResponderTerminate` | 別のビュー、またはネイティブのジェスチャーがタッチを奪いました。 |

Rust コンポーネントのレスポンダーは、指やポインターがどこへ移動しても、付与（grant）からタッチが終了するまで押された状態を保ちます。これは、CSS の `:active` がボタンを離すまで保持されるのと同じです。そのため、ドラッグの間ずっと、その `.active(..)` スタイルと内部の `group-active:` クラスの見た目が維持されます（例: 帯の外までドラッグされたリサイズハンドル）。

Rust のハンドラーは `ResponderEvent` を受け取ります。これには、指が置かれたビュー内での指の `location`、その `page` 位置、付与以降の `timestamp` と `gesture` が含まれます。

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

動作の仕組み: タッチまたはレスポンダーのハンドラーを持つビューは、ネイティブでタッチをリッスンします。プラットフォームは、そのビュー上（およびその内側）のタッチを、リッスンしているビューのパスとともに報告します。調停は NSH の Rust コアで実行され、要求を問い合わせ、ハンドラーを順番に呼び出します。キャプチャは最も外側のビューから内側へ、それ以外はターゲットから外側へ向かって呼び出されます。これには 2 つの帰結があります。

- **ネイティブのスクロールビューとレスポンダーは競合します。** レスポンダーがスクロールビューをブロックしている間、周囲のスクロールビューは、レスポンダーが終了するまでタッチを受け取れません。ネイティブのスクロールビューが先にドラッグを開始した場合は、そちらが優先されます。レスポンダーには terminate ハンドラーが呼ばれ、タッチハンドラーにはキャンセルが通知されます。
- **移動ごとにコードへイベントが送られます。** レスポンダー駆動のドラッグの滑らかさは、コードの速さに左右されます。ビューを動かすだけのドラッグには、[bound values](#native-gestures-pan-pinch-and-rotation) を使うことをお勧めします。

## PanResponder

Rust では、レスポンダーイベントがすでにジェスチャーを保持しています。`ResponderEvent::gesture` は `PanGesture` であり、開始位置からの距離、速度、指の数を持ちます。TSX では、`nsh` の `PanResponder` がレスポンダーシステムをラップし、同じジェスチャー状態を追加します。その `panHandlers` をビューにスプレッドしてください。

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

ジェスチャー状態:

| Rust (`PanGesture`) | TSX (`gestureState`) | 説明 |
|---|---|---|
| | `stateID` | ジェスチャーを識別します。 |
| `position` | `moveX`、`moveY` | タッチの重心の最新位置です（サーフェスのポイント単位）。 |
| `origin` | `x0`、`y0` | レスポンダーが付与された時点での重心の位置です。 |
| `delta` | `dx`、`dy` | 付与以降の移動距離です。 |
| `vx`、`vy` | `vx`、`vy` | 速度です（1 秒あたりのポイント数）。 |
| `active_touches` | `numberActiveTouches` | 置かれている指の数です。 |

Rust では、`PanGesture::begin` と `PanGesture::update` が生のタッチ（`.on_touch`）からジェスチャーを追跡します。TSX のコールバックは `(event, gestureState)` を受け取ります。`onStartShouldSetPanResponder(Capture)`、`onMoveShouldSetPanResponder(Capture)`、`onPanResponderGrant`、`onPanResponderReject`、`onPanResponderStart`、`onPanResponderMove`、`onPanResponderEnd`、`onPanResponderRelease`、`onPanResponderTerminate`、`onPanResponderTerminationRequest`、`onShouldBlockNativeResponder` です。最後のものはデフォルトで `true` になります。付与された PanResponder は、ネイティブのスクロールビューにタッチを奪わせません。

<a id="pans-inside-scroll-views-panactivation"></a>

## スクロールビュー内でのパン: panActivation

縦スクロールビューの中で横方向になぞるチャートは、横方向のドラッグを受け取り、縦方向のドラッグはスクロールビューに任せる必要があります。開始時にタッチを要求すると、最初の 1 ピクセルからスクロールがブロックされます。かといって、コード側で移動を見て判断するのでは遅すぎます。応答が返る頃には、スクロールビューがすでにタッチを奪っているかもしれないからです。Pan activation（`TouchClaim::on_pan(..)`、`panActivation`）を使うと、指の動きに合わせて、プラットフォームがメインスレッド上で判断します。

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust (`PanActivation`) | TSX | 説明 |
|---|---|---|
| `active_offset_x`、`active_offset_y` | `activeOffsetX`、`activeOffsetY` | 指が置かれた位置から、その軸方向にこの距離を超えて移動すると、パンがアクティブになります（どちらの方向でも可、単位はポイント）。 |
| `fail_offset_x`、`fail_offset_y` | `failOffsetX`、`failOffsetY` | 指がこの距離を先に超えて移動すると、パンは失敗します。その場合、タッチはスクロールビューが保持します。 |

`PanActivation::horizontal(active, fail)` と `PanActivation::vertical(active, fail)` は、よく使われるペアを設定します。active offset を指定しない場合、パンはいずれかの方向に 10 ポイント移動するとアクティブになります。アクティブになるまで、周囲のスクロールビューはパンを待ち（iOS）、そのビューの他の要求は問い合わせられません。パンがアクティブになると、スクロールビューはこれらのタッチを奪えなくなり、そのビューがレスポンダーになります（付与の後に移動イベントが続きます）。失敗した場合は、スクロールビューが通常どおりスクロールします。TSX では、`PanResponder` の `panHandlers` もこれと併用できます。prop の隣にスプレッドしてください。`onPanResponderGrant` はアクティブ化の時点で実行されます。

> [!NOTE]
> すべての速度の単位は、1 秒あたりのポイント数です。これは、レスポンダージェスチャーの `vx` / `vy`、パンの速度、spring や decay の速度のいずれにも当てはまります。したがって、`vx` はそのまま spring や decay に渡せます。

<a id="why-some-answers-are-props"></a>

## 一部の応答が prop である理由

メインスレッドは、コードの応答を待つことはありません。システムがその場で応答を必要とするとき（このパンジェスチャーを開始してよいか、この点はビューにヒットするか、このタップでキーボードを閉じるべきか、など）、NSH は事前にマウントされた情報からネイティブに応答します。対象は、bound pan value（その軸）、ピンチの値、ヒットスロップ、ポインターイベント、スクロールビューのキーボードタップ設定、pan activation です。ハンドラーには、起きた後の出来事が通知されます。これらがコールバックではなく宣言的な設定になっているのは、そのためです。コードを実行するレスポンダーの調停が、レスポンダー同士の間でのみ判断を行い、ネイティブのジェスチャーをブロックしないのも、同じ理由によります。

<a id="related"></a>

## 関連項目

- [`View`](../elements/view.md): 基本要素で使えるすべてのタッチ prop。
- [Animation](./animation.md): ジェスチャー駆動のモーションのための、アニメーション値、spring、decay。
- [Scrolling](./scrolling.md): キーボードタップ設定、スクロールビュー、ネストされたジェスチャー。
- [`PanResponder`](../modules/nsh.md#panresponder): `PanResponder` リファレンス。
- [Accessibility](./accessibility.md): 押下可能なビューはアクセシビリティ要素です。ロールとラベルを指定してください。
