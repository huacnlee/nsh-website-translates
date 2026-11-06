---
title: "アニメーション"
description: "モーション(すぐに使える入場・退場・注目を集める効果・ループ、または独自のキーフレーム)、スタイルトランジションとキーフレームアニメーション、timing・spring・decay・keyframes を使ったアニメーション値、補間、複合アニメーション、イージング、レイアウトアニメーション、そして UI スレッドで実行される処理について、Rust と TSX で解説します。"
order: 43
group: ui
demo: guide-animation
source_hash: 87a276d211b53553
---

# アニメーション

NSH のアニメーションはすべて UI スレッドで実行されます。Rust または TSX で一度記述すれば、プラットフォームがコードを呼び戻すことなくフレームごとに再生します（iOS では Core Animation とディスプレイリンク、Android では UI スレッドのアニメーター）。エンジンスレッドが忙しくてもアニメーションがカクつくことはなく、アニメーションの実行中にあなたのコードのコストはかかりません。

ツールは 6 つあり、手軽なものから柔軟なものの順に並んでいます。

| ツール | 用途 |
|---|---|
| [モーション](#motion) | 登場する、退場する、目を引く、ループするビュー。用意済みのモーション（`fadeInUp`、`shake`、`pulse` など）または独自のキーフレームで、opacity と transform を動かします。 |
| [トランジション](#transitions) | ジャンプせずにアニメーションさせたいスタイルの変更（色、opacity、transform）。 |
| [キーフレームアニメーション](#keyframe-animations) | スピナー、脈打つプレースホルダー、跳ねるヒント。 |
| [キーフレーム](#keyframes) | キーフレームによる任意のアニメーション値。CSS と同様に、オフセット、セグメントごとのイージング、反復回数、方向を指定できます。 |
| [アニメーション値](#animated-values) | 時間とともに変化する値で駆動されるもの全般: スプリング、ジェスチャー、スクロール位置、シーケンス。 |
| [レイアウトアニメーション](#layoutanimation) | 更新後のサイズや位置の変化: 項目の挿入、削除、並べ替え、パネルの展開。 |

<a id="motion"></a>

## モーション

モーションは、ビューの opacity と transform をキーフレームでネイティブに動かします。ビューを所有するコンポーネントで作成し（Rust では `motion()`、TSX では `nsh` の `createMotion()`）、ビューにバインドして、用意済みのモーションまたは独自のモーションを再生します。`enter` はモーションの開始位置からビューを始めてすぐに再生するため、ビューは最初のフレームから登場します。

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let card = motion().entering(MotionPreset::FadeInUp);
    view().flex_1().items_center().justify_center().child(
        view()
            .size(px(120.0))
            .rounded(px(16.0))
            .bg(rgb(0x0969da))
            .bind_motion(&card)
            .on_press(move || {
                card.play(MotionPreset::Shake);
            }),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createMotion } from "nsh";

function App() {
  const card = createMotion({ enter: "fadeInUp" });
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => card.play("shake")}
        style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: "#0969da", ...card.style }}
      />
    </View>
  );
}

mount(App);
```

モーションにはチャンネルごとにアニメーション値があります: `opacity`（0..1）、`translateX` と `translateY`（ポイント）、`rotate`、`rotateX`、`rotateY`（度）、`scale`、`scaleX`、`scaleY`。初期状態は静止状態（opacity とスケールは 1、それ以外は 0）で、移動、回転、スケールの順に、ビューの transform origin を基準として適用されます。モーション自体には見た目がありません。スタイルを付けたものを動かします。

モーションが動かすのは opacity と transform だけです。`m.style` をスプレッドすると、ビューの `opacity` と `transform` が設定されます。独自の opacity を保つには、ステップだけをバインドします（`transform: m.transform`）。色はアニメーション値と [`interpolate`](#interpolation) で動かします。

| TSX | Rust | 説明 |
|---|---|---|
| `createMotion(options?)` | `motion()` | すべてのチャンネルが静止状態のモーション。 |
| `createMotion({ initial: { opacity: 0 } })` | `m.value(MotionChannel::Opacity).set(0.0)` | チャンネルの開始位置。それ以外のチャンネルは静止状態から始まります。 |
| `createMotion({ enter, delay, duration, ... })` | `motion().entering(spec)` | `enter` の開始位置から始めてすぐに再生します。他のオプションでタイミングを変更できます。`enter` は、`initial` をベースに、動かすチャンネルを設定します。 |
| `style={m.style}`、`m.transform` | `.bind_motion(&m)` | チャンネルをバインドします。`m.style` は `{ opacity, transform }` で、その `transform` は 7 つのステップのリストです（`scale` は `scaleX` と `scaleY` にまとめられます）。ビューの `translate`、`rotate`、`scale` の後に適用されます。その前に perspective を置くと 3D フリップに奥行きが生まれます: `transform: [{ perspective: 800 }, ...m.transform]`。Rust では、モーションの transform はビュー自身の transform の後に適用されます。 |
| `m.opacity`、`m.translateX`、... | `m.value(MotionChannel::Opacity)`、... | 1 つのチャンネルのアニメーション値。補間したり、手動で駆動したりできます。 |
| `m.play(motion, options?)` | `m.play(spec)` | プリセットまたは独自のモーションを再生します。新しく再生すると、再生中のものは中断されます。完了すると `{ finished }`、`true` で解決されます（Rust では `AnimationEnd`）。 |
| `m.animation(motion, options?)` | `m.animation(spec)` | 同じモーションを、開始前の [複合アニメーション](#composite-animations) として返します。他のものと組み合わせて、シーケンス、スタッガー、ループができます。 |
| `play(motion, { ignoreReduceMotion: true })` | `m.play_ignoring_reduce_motion(spec)` | ユーザーがモーションの軽減を求めている場合でも再生します。 |
| `m.stop()` | `m.stop()` | その場で停止します。 |
| `m.reset()` | `m.reset()` | 停止して、すべてのチャンネルを静止状態に戻します。 |

<a id="presets"></a>

### プリセット

用意済みのモーションはデータです。TSX では `nsh` の `motions`（`motions.fadeInUp` は `play("fadeInUp")` が再生するもの）、Rust では `MotionPreset`（`MotionPreset::FadeInUp.spec()`）です。距離はポイント単位で、コントロールやカードに合わせたサイズです。より大きなビューでは、モーションの値をスケールするか、独自のキーフレームを書いてください。`swing` などの回転は、ビューの transform origin を中心に回ります。揺れる看板には `transformOrigin: "top"` を指定します（`.origin_top()`）。

**入場**: 非表示または離れた位置から始まり、静止状態で終わります。

| TSX | Rust | 所要時間 | 説明 |
|---|---|---|---|
| `fadeIn` | `MotionPreset::FadeIn` | 300 ms | フェードインします。 |
| `fadeInUp` | `MotionPreset::FadeInUp` | 450 ms | フェードインしながら、せり上がって所定の位置に収まります。 |
| `fadeInDown` | `MotionPreset::FadeInDown` | 450 ms | フェードインしながら、降りて所定の位置に収まります。 |
| `fadeInLeft` | `MotionPreset::FadeInLeft` | 450 ms | フェードインしながら、左から入ってきます。 |
| `fadeInRight` | `MotionPreset::FadeInRight` | 450 ms | フェードインしながら、右から入ってきます。 |
| `zoomIn` | `MotionPreset::ZoomIn` | 350 ms | フェードインしながら、90 % から拡大します。 |
| `popIn` | `MotionPreset::PopIn` | 450 ms | ポップイン: 半分のサイズから元のサイズを超えて拡大し、落ち着きます。 |
| `bounceIn` | `MotionPreset::BounceIn` | 650 ms | バウンドしながら入り、2 回行き過ぎます。 |
| `slideInUp` | `MotionPreset::SlideInUp` | 400 ms | 下からスライドして入ります。フェードなし（シート、トースト）。 |
| `slideInDown` | `MotionPreset::SlideInDown` | 400 ms | 上からスライドして入ります。フェードなし。 |
| `flipInX` | `MotionPreset::FlipInX` | 600 ms | 水平軸を中心に反転して現れます。 |
| `flipInY` | `MotionPreset::FlipInY` | 600 ms | 垂直軸を中心に反転して現れます。 |

**退場**: 静止状態から始まり、非表示または離れた位置で終わります。

| TSX | Rust | 所要時間 | 説明 |
|---|---|---|---|
| `fadeOut` | `MotionPreset::FadeOut` | 250 ms | フェードアウトします。 |
| `fadeOutUp` | `MotionPreset::FadeOutUp` | 300 ms | フェードアウトしながら、上へ離れていきます。 |
| `fadeOutDown` | `MotionPreset::FadeOutDown` | 300 ms | フェードアウトしながら、下へ離れていきます。 |
| `fadeOutLeft` | `MotionPreset::FadeOutLeft` | 300 ms | フェードアウトしながら、左へ消えます。 |
| `fadeOutRight` | `MotionPreset::FadeOutRight` | 300 ms | フェードアウトしながら、右へ消えます。 |
| `zoomOut` | `MotionPreset::ZoomOut` | 250 ms | フェードアウトしながら、90 % まで縮みます。 |
| `popOut` | `MotionPreset::PopOut` | 300 ms | ポップアウト: 少し膨らんでから、縮んで消えます。 |
| `slideOutDown` | `MotionPreset::SlideOutDown` | 300 ms | 下へスライドして見えなくなります。フェードなし。 |
| `slideOutUp` | `MotionPreset::SlideOutUp` | 300 ms | 上へスライドして見えなくなります。フェードなし。 |

**注目**: 静止状態で始まり、静止状態で終わります。

| TSX | Rust | 所要時間 | 説明 |
|---|---|---|---|
| `shake` | `MotionPreset::Shake` | 500 ms | 横に揺れます: パスワードの誤り、無効なフィールドなど。 |
| `headShake` | `MotionPreset::HeadShake` | 800 ms | 首を振ります: より穏やかな「いいえ」。 |
| `wiggle` | `MotionPreset::Wiggle` | 600 ms | 中心を軸に揺れ動きます: 注目してほしいもの。 |
| `swing` | `MotionPreset::Swing` | 900 ms | 看板のように、上端を支点に揺れます。 |
| `pulse` | `MotionPreset::Pulse` | 500 ms | 少し拡大して戻ります: 控えめな強調。 |
| `heartbeat` | `MotionPreset::Heartbeat` | 900 ms | 心臓のように 2 回拍動します: いいね、お気に入り。 |
| `rubberBand` | `MotionPreset::RubberBand` | 800 ms | ゴムのように潰れて伸びます。 |
| `jello` | `MotionPreset::Jello` | 800 ms | ゼリーのようにぷるぷると揺れます。 |
| `tada` | `MotionPreset::Tada` | 900 ms | 縮んでから、揺れながら拡大します: ごほうび。 |
| `jump` | `MotionPreset::Jump` | 700 ms | ジャンプして、潰れながら着地します。 |
| `flash` | `MotionPreset::Flash` | 800 ms | 消えて現れる点滅を 2 回行います。 |

**ループ**: 停止するまで繰り返します。

| TSX | Rust | 所要時間 | 説明 |
|---|---|---|---|
| `spin` | `MotionPreset::Spin` | 1000 ms | 1 回転を永遠に繰り返します。 |
| `float` | `MotionPreset::Float` | 1500 ms | 上下にふわふわと浮かび続けます。 |
| `breathe` | `MotionPreset::Breathe` | 1800 ms | 呼吸するように、少し拡大してフェードする動きを繰り返します。 |
| `sway` | `MotionPreset::Sway` | 1600 ms | 中心を軸に揺れ続けます。 |
| `bob` | `MotionPreset::Bob` | 1000 ms | 弾むボールのように上下し続けます。 |
| `glow` | `MotionPreset::Glow` | 2000 ms | 光が強まったり弱まったりを繰り返します。 |

`play` は、プリセットのタイミングオプションを上書きとして受け取れます（`m.play("shake", { duration: 300 })`）。プリセットは独自のモーションにスプレッドできます（`m.play({ ...motions.fadeInUp, duration: 600 })`）。Rust では、プリセットの spec を変更します: `MotionPreset::FadeInUp.spec().timing(|t| t.delay(100.0))`。

<a id="motions-of-your-own"></a>

### 独自のモーション

独自のモーションは、チャンネルごとのキーフレームと 1 つのタイミングで構成されます（[キーフレーム](#keyframes) のオプション）。TSX では、チャンネルごとのキーフレームを記述するか（`{ opacity: [0, 1] }`）、Web Animations API の形式のフレームのリスト（`[{ opacity: 0, translateY: 24 }, { opacity: 1, translateY: 0 }]`）を記述します。各フレームには `offset` と `easing` があります。フレームのリストでは、offset のないフレームはリスト内の位置に応じた場所に置かれ、各チャンネルはそのチャンネルを指定するフレームに従います。角度は文字列でも指定できます（`"45deg"`、`"0.5turn"`）。Rust では `MotionSpec` を構築します。

```rust tabs
let rise = MotionSpec::new(KeyframeTiming::new(400.0))
    .values(MotionChannel::Opacity, [0.0, 1.0])
    .track(
        MotionChannel::TranslateY,
        [Keyframe::at(0.0, 24.0).ease(Easing::EaseOut), Keyframe::at(1.0, 0.0)],
    );
card.play(rise);

let flip = MotionSpec::new(KeyframeTiming::new(600.0).infinite())
    .values(MotionChannel::RotateY, [0.0, 180.0, 360.0]);
card.play(flip);
```

```tsx tabs
// Channels' keyframes.
card.play({
  duration: 400,
  keyframes: { opacity: [0, 1], translateY: [{ value: 24, easing: "easeOut" }, 0] },
});

// A list of frames.
card.play({
  duration: 400,
  keyframes: [
    { opacity: 0, translateY: 24, easing: "easeOut" },
    { opacity: 1, translateY: 0 },
  ],
});

card.play({ duration: 600, iterations: "infinite", keyframes: { rotateY: ["0deg", "180deg", "360deg"] } });
```

<a id="entrances-and-staggered-lists"></a>

### 入場とスタッガーリスト

各行に入場のモーションを与え、インデックスに応じて大きくなる遅延を設定すると、同時に表示される行が順番に入ってきます。遅延には上限を設け、リストの下の方で追加された行が待たされないようにします。

```rust tabs
each(items, |item: &Item| item.id, |item, index| {
    let delay = index.get_untracked().min(10) as f32 * 60.0;
    let row = motion().entering(MotionPreset::FadeInUp.spec().timing(|t| t.delay(delay)));
    view()
        .rounded_xl()
        .bg(ZINC.shade(100))
        .p_4()
        .bind_motion(&row)
        .child(text(move || item.get().title))
})
```

```tsx tabs
function Row(props: { title: string; index: number }) {
  const row = createMotion({ enter: "fadeInUp", delay: Math.min(props.index, 10) * 60 });
  return (
    <View class="rounded-xl bg-zinc-100 p-4" style={row.style}>
      <Text>{props.title}</Text>
    </View>
  );
}

<Each of={items()} key={(item) => item.id}>
  {(item, index) => <Row title={item().title} index={index()} />}
</Each>
```

モーションは合成もできます。`m.animation(..)` は開始前の [複合アニメーション](#composite-animations) としてのモーションなので、`Animated.stagger` でそれらのグループをネイティブに実行でき、最初の項目、最後の項目、中央、または任意のインデックスから数えて順に開始できます。順番が来る前に何も表示されないよう、非表示の `initial` を与えます（またはモーションの開始位置から始めます）。

```rust tabs
let cards: Vec<Motion> = (0..5)
    .map(|_| {
        let m = motion();
        m.value(MotionChannel::Opacity).set(0.0);
        m
    })
    .collect();
Animation::stagger_from(60.0, StaggerFrom::Center, cards.iter().map(|m| m.animation(MotionPreset::FadeInUp))).start();
```

```tsx tabs
const cards = [0, 1, 2, 3, 4].map(() => createMotion({ initial: { opacity: 0 } }));
Animated.stagger(60, cards.map((m) => m.animation("fadeInUp")), { from: "center" }).start();
```

<a id="exits"></a>

### 退場

退場モーションを再生し、完了を待ってから、ビューを削除します。[レイアウトアニメーション](#layoutanimation) を使うと、周囲のビューが隙間を詰められます。

```rust tabs
let remove = move || {
    spawn(async move {
        row.play(MotionPreset::FadeOutLeft).await;
        animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
        items.update(|items| items.retain(|i| i.id != id));
    });
};
```

```tsx tabs
const remove = async () => {
  await row.play("fadeOutLeft");
  LayoutAnimation.easeInEaseOut();
  items.set(items().filter((i) => i.id !== id));
};
```

モーションは、ユーザーの [モーションの軽減](#reduced-motion) 設定に自動的に従います。ユーザーがモーションの軽減を求めている場合、モーションは動かずに、すぐに終了位置に到達します。

<a id="transitions"></a>

## トランジション

アニメーションさせる対象とその長さを指定すると（Rust では `.transition_all().duration(400.0)`、TSX では `transitionProperty` と `transitionDuration`）、以降それらのプロパティへの変更は、画面上の現在の値から新しい値へネイティブにアニメーションします。

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let on = signal(false);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || on.update(|on| *on = !*on))
            .size(px(100.0))
            .rounded(move || px(if on.get() { 50.0 } else { 16.0 }))
            .bg(move || if on.get() { rgb(0x8250df) } else { rgb(0x0969da) })
            .rotate(move || deg(if on.get() { 45.0 } else { 0.0 }))
            .scale(move || if on.get() { 1.2_f32 } else { 1.0 })
            .transition_all()
            .duration(400.0)
            .ease_in_out(),
    )
}
```

```tsx tabs
import { mount, signal, View } from "nsh";

function App() {
  const on = signal(false);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => on.set(!on())}
        style={{
          width: 100,
          height: 100,
          borderRadius: on() ? 50 : 16,
          backgroundColor: on() ? "#8250df" : "#0969da",
          rotate: on() ? "45deg" : "0deg",
          scale: on() ? 1.2 : 1,
          transitionProperty: "all",
          transitionDuration: 400,
          transitionTimingFunction: "ease-in-out",
        }}
      />
    </View>
  );
}

mount(App);
```

| スタイル | Rust | 型 | 説明 |
|---|---|---|---|
| `transitionProperty` | `.transition()`、`.transition_all()`、`.transition_colors()`、`.transition_opacity()`、`.transition_transform()`、`.transition_shadow()` | `string` | アニメーションの対象。カンマ区切り: `"all"`、`"colors"`、`"opacity"`、`"transform"`、`"box-shadow"`、`"border-radius"` など。 |
| `transitionDuration` | `.duration(ms)` | `number \| "150ms" \| "0.2s"` | 数値のミリ秒、または CSS の時間。 |
| `transitionDelay` | `.delay(ms)` | `number \| "150ms" \| "0.2s"` | 開始までの待ち時間。 |
| `transitionTimingFunction` | `.ease_linear()`、`.ease_in()`、`.ease_out()`、`.ease_in_out()`、`.ease_bezier(..)` | `"linear" \| "ease" \| "ease-in" \| "ease-out" \| "ease-in-out" \| "cubic-bezier(…)"` | カーブ。 |

トランジションするプロパティはグループ別に次のとおりです: **色**（背景色、ボーダー色、アウトライン色、シャドウ色、テキスト色、グラデーションのストップ）、**opacity**、**transform**、**シャドウ**（`box-shadow`）、**形状**（border radius と width）。CSS 名とそのキャメルケース形式のどちらも使えます（`background-color`、`backgroundColor`、`transform`、`scale` など）。レイアウトの変更は [レイアウトアニメーション](#layoutanimation) でアニメーションします。

Tailwind では、同じことを `transition`（色、opacity、シャドウ、transform）、`transition-all`、`transition-colors`、`transition-opacity`、`transition-transform`、`transition-shadow` で行い、`duration-*`、`delay-*`、`ease-*` を組み合わせられます。押下状態（`.active(..)`、`active:`）と組み合わせると、アニメーションする押下状態になります:

```rust tabs
view()
    .on_press(save)
    .rounded_xl()
    .bg(BLUE.shade(600))
    .px_5()
    .py_3()
    .transition()
    .duration(150.0)
    .active(|s| s.scale(0.95).bg(BLUE.shade(800)))
    .child(text("Save").font_weight(FontWeight::SEMIBOLD).text_color(white()))
```

```tsx tabs
<View onPress={save} class="rounded-xl bg-blue-600 px-5 py-3 transition duration-150 active:scale-95 active:bg-blue-800">
  <Text class="font-semibold text-white">Save</Text>
</View>
```

トランジションは画面上の現在の値から始まるため、途中でターゲットを再度変更しても滑らかに向きを変えます。

<a id="keyframe-animations"></a>

## キーフレームアニメーション

4 つの組み込みキーフレームアニメーションがネイティブに実行され、デフォルトでは永遠に繰り返されます: `spin`（時計回りに 1 回転）、`ping`（2 倍まで拡大してフェードアウト）、`pulse`（半分の opacity までフェードして戻る）、`bounce`（高さの 4 分の 1 だけ跳ね上がって着地）。

```rust tabs
view()
    .size_8()
    .rounded_full()
    .border(px(4.0))
    .border_color(ZINC.shade(300))
    .border_t_color(BLUE.shade(600))
    .animate_spin()
view().h_4().w_40().rounded(px(4.0)).bg(ZINC.shade(200)).animate_pulse()
```

```tsx tabs
<View class="size-8 rounded-full border-4 border-zinc-300 border-t-blue-600 animate-spin" />
<View class="h-4 w-40 rounded bg-zinc-200 animate-pulse" />
```

| スタイル | Rust | 型 | 説明 |
|---|---|---|---|
| `animationName` | `.animate_spin()`、`.animate_ping()`、`.animate_pulse()`、`.animate_bounce()`、`.animate_none()`、または `.animation(KeyframeAnimation::new(Keyframes::Spin))` | `"none" \| "spin" \| "ping" \| "pulse" \| "bounce"` | アニメーション。 |
| `animationDuration` | `KeyframeAnimation::duration(ms)` | `number \| "1s" \| …` | 1 回分の長さ。 |
| `animationDelay` | `KeyframeAnimation::delay(ms)` | `number \| "200ms" \| …` | 開始までの待ち時間。 |
| `animationTimingFunction` | `KeyframeAnimation::easing([x1, y1, x2, y2])` | `transitionTimingFunction` と同じ | カーブ。 |
| `animationIterationCount` | `KeyframeAnimation::iterations(n)` | `number \| "infinite"` | デフォルトは `"infinite"`。 |

Tailwind: `animate-spin`、`animate-ping`、`animate-pulse`、`animate-bounce`、`animate-none`。

<a id="animated-values"></a>

## アニメーション値

アニメーション値は、UI スレッド上に存在する数値です。作成し（Rust では `animated_value(..)`、TSX では `nsh` の `createAnimatedValue`）、スタイルにバインドしてアニメーションさせると、バインドされたビューは更新なしで毎フレームそれに追従します。

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let opacity = animated_value(1.0);
    let play = move || {
        spawn(async move {
            x.timing(240.0, 600.0, Easing::Curve(Curve::Cubic, EaseMode::Out)).await;
            opacity.timing(0.3, 200.0, Easing::EaseInOut).await;
            x.spring(0.0, Spring::default());
            opacity.timing_with(1.0, Timing::default());
        });
    };
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .gap_6()
        .child(
            view()
                .size(px(60.0))
                .rounded(px(12.0))
                .bg(rgb(0x0969da))
                .bind_opacity(&opacity)
                .bind_translate_x(&x),
        )
        .child(view().on_press(play).child(text("Play").text_color(rgb(0x0969da))))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { createAnimatedValue, Easing } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const opacity = createAnimatedValue(1);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: "#0969da", opacity, translate: [x, 0] }} />
      <View
        onPress={async () => {
          await x.timing(240, { duration: 600, easing: Easing.out(Easing.cubic) });
          await opacity.timing(0.3, { duration: 200 });
          x.spring(0);
          opacity.timing(1);
        }}
      >
        <Text style={{ color: "#0969da" }}>Play</Text>
      </View>
    </View>
  );
}

mount(App);
```

**バインドできるもの:** `opacity`（`.bind_opacity(..)`）、色への補間を通した `backgroundColor`、`borderColor`（すべての辺）とテキストの `color`（テキスト全体）（`.bind_background(..)`、`.bind_border_color(..)`、`.bind_color(..)`）、`translate`（`[x, y]`、軸ごとの値）、`rotate`（度）、`scale`（軸ごとの `[x, y]`、または両軸に 1 つの値）、そして `transform` リストのステップ: `translateX`、`translateY`、`scale`、`scaleX`、`scaleY`、`rotate`、`rotateX`、`rotateY`、`rotateZ`（`.bind_translate_x(..)`、`.bind_translate_y(..)`、`.bind_scale(..)`、`.bind_rotate(..)` は度、Rust では `.bind_transform(kind, ..)`）。シャドウは [トランジション](#transitions) で変化させます。フォーカスリングや緑色に点滅する価格は、ボーダーまたはテキストの色にバインドした色の補間です:

```rust tabs
let flash = animated_value(0.0);
let color = flash.interpolate_colors(&[0.0, 1.0], &[rgb(0x1f2328), rgb(0x1a7f37)]);

text(move || price.get().to_string()).bind_color(&color)
// On a new price: flash.set(1.0); flash.timing(0.0, 600.0, Easing::EaseInOut);
```

```tsx tabs
const flash = createAnimatedValue(0);
const color = flash.interpolate({ inputRange: [0, 1], outputRange: ["#1f2328", "#1a7f37"] });

<Text style={{ color }}>{price()}</Text>
// On a new price: flash.set(1); flash.timing(0, { duration: 600 });
```

アニメーション値は、[キャンバス描画](./canvas.md#driving-drawings-with-animated-values) の駆動、スクロールオフセット（[`scrollValue`](./scrolling.md#scroll-linked-effects-scrollvalue)）やジェスチャー（[`pan`、`pinch`、`rotation`](./touch-and-gestures.md#native-gestures-pan-pinch-and-rotation)）の受け取りにも使えます。

値は、それにバインドされたビューと、それを作成したコンポーネントによって生存し続けるため、変数がどう出入りしても、バインディングは接続されたままです。アニメーション値は、それを所有するコンポーネントで作成してください（インスタンスごとに専用のものが必要な場合は、モジュールレベルでは作成しないでください）。
<a id="animatedvalue-methods"></a>

### AnimatedValue のメソッド

| TSX | Rust | 説明 |
|---|---|---|
| `set(value)` | `set(value)` | `value` へ即座にジャンプし、実行中のアニメーションを停止します。 |
| `stop()` | `stop()` | 実行中のアニメーションをその場で停止します。TSX では、その時点の値である `{ value }` で resolve されます。 |
| `getValue()` | `value()` | 現在の値。値が動いている場合は UI スレッドで読み取られます(1 フレーム以内に確定します)。TSX では promise、Rust では await 可能な応答を返します。 |
| `setOffset(offset)` | `set_offset(offset)` | 値の表示に `offset` を加えます。バインディングには value + offset が見え、`set`、アニメーション、ドラッグは value を動かします。 |
| `flattenOffset()` | `flatten_offset()` | オフセットを値に加算し、オフセットを 0 にします。 |
| `extractOffset()` | `extract_offset()` | 値をオフセットに移し、値を 0 にします。これにより、ドラッグは前回のドラッグが終わった位置の上から、0 を起点に始まります。 |
| `timing(to, { duration?, easing?, delay? })` | `timing(to, ms, easing)`、`timing_with(to, Timing { .. })` | `to` へ `duration` ms かけてアニメーションします(デフォルトは 300、イージングは `"easeInOut"`)。 |
| `spring(to, { stiffness?, damping?, mass?, velocity? })` | `spring(to, Spring { .. })` | `to` へスプリングで動きます(デフォルト: stiffness 170、damping 26、mass 1)。 |
| `decay({ velocity?, deceleration?, clamp?, bounce? })` | `decay(velocity, deceleration)`、`decay_within(velocity, deceleration, (min, max), bounce)` | `velocity`(1 秒あたりの単位)から慣性で動き、減速します(デフォルトの減速率は 1 ms あたり 0.998)。`[min, max]` の clamp を指定すると、境界で止まるか、速度の `bounce`(0..1)を保ったまま境界で跳ね返ります。 |

各アニメーションは、完了したかどうかを await できる結果を返します。最後まで再生された場合は `true`、何かに止められた場合(`stop()`、`set()`、または同じ値への新しいアニメーション)は `false` です。TSX では `Promise<{ finished: boolean }>`、Rust では `AnimationEnd` で、タスクが `bool` で await します。動いている値に新しいアニメーションを開始すると、古いものはなめらかに中断されます。速度を指定しないスプリングや decay は、値の現在の速度を引き継ぎます。

```rust tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() });   // wobbly
x.spring(200.0, Spring { stiffness: 400.0, damping: 30.0, ..Spring::default() });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
view().pan_values(Some(&x), None).on_pan_end(move |e: &PanEvent| {
    x.decay(Some(e.velocity_x), 0.998);
})

// A fling that stays on its track and bounces softly off its ends.
x.decay_within(Some(e.velocity_x), 0.998, (0.0, 300.0), 0.3);

// Where a value is now (it moves on the UI thread, so the answer is async).
let at = x.value().await;
```

```tsx tabs
// Spring settings: lower damping overshoots more, higher stiffness is faster.
x.spring(200, { stiffness: 180, damping: 8 });   // wobbly
x.spring(200, { stiffness: 400, damping: 30 });  // stiff, no overshoot

// A fling that coasts to a stop, from a pan's release velocity.
<View pan={{ x }} onPanEnd={(e) => x.decay({ velocity: e.velocity.x })} />

// A fling that stays on its track and bounces softly off its ends.
x.decay({ velocity: e.velocity.x, clamp: [0, 300], bounce: 0.3 });

// Where a value is now (it moves on the UI thread, so the answer is async).
const where = await x.getValue();
```

<a id="keyframes"></a>

### キーフレーム

`keyframes` は、CSS のキーフレームと同じように、値をキーフレームに沿って再生します。TSX では `value.keyframes(frames, options)`、Rust では `value.keyframes(frames, KeyframeTiming)` です(`Animated.keyframes(value, { keyframes, ... })` と `Animation::keyframes(..)` は[複合アニメーション](#composite-animations)のステップとして使います)。キーフレームは、数値(または `"90deg"` のような角度の文字列)で、他のキーフレームと均等に配置されるか、あるいは `{ offset, value, easing }`(Rust では `Keyframe::new(value)`、`Keyframe::at(offset, value)`、`.ease(easing)`)です。

```rust tabs
let y = animated_value(0.0);
y.keyframes(
    [Keyframe::new(0.0), Keyframe::at(0.3, -20.0).ease(Easing::EaseIn), Keyframe::new(0.0)],
    KeyframeTiming::new(600.0).easing(Easing::EaseOut).iterations(Some(3)),
);

// A clock hand that ticks once a second.
let hand = animated_value(0.0);
hand.keyframes(
    [Keyframe::new(0.0), Keyframe::new(360.0)],
    KeyframeTiming::new(60_000.0).easing(Easing::Steps(60, StepPosition::JumpEnd)).infinite(),
);
```

```tsx tabs
const y = createAnimatedValue(0);
y.keyframes([0, { offset: 0.3, value: -20, easing: "easeIn" }, 0], { duration: 600, easing: "easeOut", iterations: 3 });

// A clock hand that ticks once a second.
const hand = createAnimatedValue(0);
hand.keyframes([0, 360], { duration: 60_000, easing: Easing.steps(60), iterations: "infinite" });
```

| オプション | Rust(`KeyframeTiming`) | デフォルト | 説明 |
|---|---|---|---|
| `duration` | `KeyframeTiming::new(ms)` | 300 | 1 回のイテレーションの長さ(ミリ秒)。 |
| `delay` | `.delay(ms)` | 0 | 最初のイテレーションの前の待ち時間。 |
| `easing` | `.easing(easing)` | CSS の `ease` | 独自のイージングを持たない各セグメントのカーブ。 |
| `iterations` | `.iterations(Some(n))`、`.infinite()` | 1 | イテレーションの回数、または `"infinite"`。 |
| `direction` | `.direction(PlaybackDirection::Alternate)` | `"normal"` | `"normal"`、`"reverse"`、`"alternate"`、または `"alternate-reverse"`。 |

再生は CSS や Web Animations API と同じように動作します。

- イージングは全体ではなく各セグメントに適用されます。キーフレームの `easing` はそのキーフレームから始まるセグメントに、タイミングの `easing` はそれ以外のすべてのセグメントに適用されます。
- オフセットのないキーフレームは、隣り合うキーフレームの間に均等に配置されます。最初のキーフレームのデフォルトは 0、最後は 1 です。
- 各イテレーションは、最初のキーフレームへのジャンプから始まります。オフセット 0 のキーフレームがない場合、値は現在の位置から始まります。
- `delay` の間、値はすでに最初のキーフレームの値を保持しているため(CSS の `animation-fill-mode: backwards`)、遅延付きの登場アニメーションでは、静止状態のビューではなく最初のフレームが表示されます。これはモーションにも当てはまります。
- `reverse` と `alternate` の逆方向のイテレーションでは、セグメントが逆順に再生され、それぞれのカーブも反転します。
- 値は最後のイテレーションが終わった位置に留まります。結果は完了したかどうかを表し、完了した場合は `true`、何かに止められた場合は `false` です。

<a id="interpolation"></a>

### 補間

`interpolate` は、区分線形のセグメントによって値を数値、色、角度にマッピングし、バインドできる新しいノードを返します。1 つの値で多数のプロパティを駆動できます。Rust では、`interpolate(&input, &output)` が数値、`interpolate_colors(&input, &colors)` が色にマッピングし、`interpolate_with(&input, output, Interpolation { .. })` は外挿とイージングを受け取ります。TSX では、`value.interpolate({ inputRange, outputRange })` がそのすべてを受け取ります。

```rust tabs
let t = animated_value(0.0);

view()
    .bind_background(&t.interpolate_colors(&[0.0, 1.0, 2.0], &[rgb(0x54aeff), rgb(0x8250df), rgb(0xcf222e)]))
    .bind_opacity(&t.interpolate(&[0.0, 1.0], &[0.4, 1.0]))
    .bind_rotate(&t.interpolate(&[0.0, 1.0], &[0.0, 180.0]))
    .bind_scale(&t.interpolate_with(
        &[0.0, 1.0],
        AnimationOutput::Numbers(vec![0.6, 1.2]),
        Interpolation {
            easing: Easing::Curve(Curve::Back(1.70158), EaseMode::Out),
            ..Interpolation::default()
        },
    ))
```

```tsx tabs
const t = createAnimatedValue(0);

<View
  style={{
    backgroundColor: t.interpolate({ inputRange: [0, 1, 2], outputRange: ["#54aeff", "#8250df", "#cf222e"] }),
    opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }),
    scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2], easing: Easing.out(Easing.back()) }),
  }}
/>
```

| オプション | Rust | 説明 |
|---|---|---|
| `inputRange` | 入力のスライス | 昇順の入力ストップ。 |
| `outputRange` | 出力のスライス、または `AnimationOutput` | ストップごとに 1 つの出力。数値、色(`"#rrggbb"`、`"rgba(…)"`、名前付き)、または角度(`"45deg"`、`"1rad"`)。 |
| `extrapolate` | `Interpolation::extrapolate(Extrapolate::Extend)` | 入力範囲の外側での動作。`"clamp"`(デフォルト)、`"extend"`(両端のセグメントを延長)、または `"identity"`(入力をそのまま通す)。 |
| `extrapolateLeft`、`extrapolateRight` | `extrapolate_left`、`extrapolate_right` | 同じ内容を片側のみに指定します。 |
| `easing` | `easing` | 各セグメントのカーブを決めます。 |

> [!IMPORTANT]
> 補間はデフォルトで **clamp** されます。入力範囲の外側では、出力は最も近い端の値に留まります。そのため、スクロールビューを先頭より先に引っ張っても、スクロール連動のヘッダーは終了状態のままです。線を延長したい場合は `extrapolate: "extend"`(`Extrapolate::Extend`)を指定します。

<a id="arithmetic-and-diffclamp"></a>

### 算術演算と diffClamp

ノードは算術演算で組み合わせることができ、これもネイティブに実行されます。`a.add(b)`、`a.sub(b)`、`a.mul(b)`、`a.div(b)`、`a.mod(b)`(Rust では `a.modulo(b)`。正の `b` に対して結果が負になることはなく、たとえば 0..360 の角度に使えます)で、`b` はノードまたは数値です。TSX では、`Animated.add`、`subtract`、`multiply`、`divide`、`modulo` が同じ機能を関数として提供します。

`diffClamp(min, max)`(`diff_clamp`)は、ノードの*変化量*を追跡しつつ、値を `min..max` の範囲内に保ちます。スクロールオフセットに適用すると、コンテンツを上にスクロールすると隠れ、下にスクロールするとすぐに戻ってくるヘッダーを作れます。

```rust tabs
let offset = animated_value(0.0);
let header = offset.diff_clamp(0.0, 56.0);

scroll().flex_1().scroll_value(&offset)
view().absolute().top_0().left_0().right_0().h(px(56.0)).bind_translate_y(&header.mul(-1.0))
```

```tsx tabs
const scroll = createAnimatedValue(0);
const header = scroll.diffClamp(0, 56);

<Scroll style={{ flex: 1 }} scrollValue={scroll}>…</Scroll>
<View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56, translate: [0, header.mul(-1)] }}>…</View>
```

`{ snap: true }`(`diff_clamp_with(min, max, DiffClamp::snapping())`)を指定すると、スクロールが止まったときにヘッダーが一部だけ表示されていても、その動きが完了します。ヘッダーは、完全に表示された状態か完全に隠れた状態のうち近い方に、UI スレッド上で 200 ms かけて落ち着きます。ヘッダーが隠れるのは、ページが少なくともヘッダーの高さ分スクロールされた後だけなので、それより少ないスクロール量のページではヘッダー全体が表示されます。動きの途中で再びスクロールすると、ヘッダーのその時点の位置から引き継がれます。

```rust tabs
let header = offset.diff_clamp_with(0.0, 56.0, DiffClamp::snapping());
```

```tsx tabs
const header = scroll.diffClamp(0, 56, { snap: true });
```

<a id="composite-animations"></a>

## 複合アニメーション

アニメーションはステップから構築されます(Rust では `Animation`、TSX では `nsh` からの `Animated`)。ツリー全体がネイティブに実行され、各ステップは前のステップが終わった瞬間に UI スレッドで開始されます。間に隙間はなく、あなたのコードも介在しません。

```rust tabs
let ys: Vec<AnimatedValue> = (0..5).map(|_| animated_value(0.0)).collect();
let fade = animated_value(1.0);

let hop = Animation::stagger(
    80.0,
    ys.iter().map(|y| {
        Animation::sequence([
            Animation::timing(y, -30.0, Timing::new(200.0, Easing::Curve(Curve::Quad, EaseMode::Out))),
            Animation::spring(y, 0.0, Spring { stiffness: 300.0, damping: 12.0, ..Spring::default() }),
        ])
    }),
);

let breathe = Animation::sequence([
    Animation::timing(&fade, 0.3, Timing::new(400.0, Easing::EaseInOut)),
    Animation::timing(&fade, 1.0, Timing::new(400.0, Easing::EaseInOut)),
])
.looped(None);

let landed = hop.start();
spawn(async move {
    status.set(if landed.await { "landed" } else { "stopped" });
});
```

```tsx tabs
import { Animated, createAnimatedValue, Easing } from "nsh";

const ys = [0, 1, 2, 3, 4].map(() => createAnimatedValue(0));
const fade = createAnimatedValue(1);

const hop = Animated.stagger(
  80,
  ys.map((y) =>
    Animated.sequence([
      Animated.timing(y, { toValue: -30, duration: 200, easing: Easing.out(Easing.quad) }),
      Animated.spring(y, { toValue: 0, stiffness: 300, damping: 12 }),
    ]),
  ),
);

const breathe = Animated.loop(
  Animated.sequence([
    Animated.timing(fade, { toValue: 0.3, duration: 400 }),
    Animated.timing(fade, { toValue: 1, duration: 400 }),
  ]),
);

hop.start(({ finished }) => console.log(finished ? "landed" : "stopped"));
```

| TSX | Rust | 説明 |
|---|---|---|
| `Animated.timing(value, { toValue, duration?, easing?, delay? })` | `Animation::timing(&value, to, Timing { .. })` | タイミングのステップ。 |
| `Animated.spring(value, { toValue, stiffness?, damping?, mass?, velocity? })` | `Animation::spring(&value, to, Spring { .. })` | スプリングのステップ。 |
| `Animated.decay(value, { velocity?, deceleration?, clamp?, bounce? })` | `Animation::decay(&value, velocity, deceleration)`、`Animation::decay_within(..)` | decay のステップ。 |
| `Animated.sequence(list)` | `Animation::sequence(list)` | 順番に実行します。 |
| `Animated.parallel(list, { stopTogether? })` | `Animation::parallel(list)`、`.stop_together(..)` | すべてを同時に実行します。 |
| `Animated.stagger(ms, list, { from? })` | `Animation::stagger(ms, list)`、`Animation::stagger_from(ms, StaggerFrom::Center, list)` | すべてを同時に実行し、それぞれ前のものから `ms` ずつ遅れて開始します。起点は `from` で数えます。`"first"`(デフォルト)、`"last"`、`"center"`(中央から外へ波紋のように広がる)、またはインデックス(`StaggerFrom::First`、`Last`、`Center`、`Index(i)`)。 |
| `Animated.keyframes(value, { keyframes, ...timing })` | `Animation::keyframes(&value, frames, KeyframeTiming)` | [キーフレーム](#keyframes)のステップ。 |
| `Animated.delay(ms)` | `Animation::delay(ms)` | 待機します。 |
| `Animated.loop(animation, { iterations?, resetBeforeIteration? })` | `.looped(iterations)`、`.reset_before_iteration(..)` | 繰り返します(デフォルトでは無限。Rust では `None`)。 |

複合アニメーションには、`start()`(TSX ではコールバックと promise も使え、どちらにも `{ finished }` が渡されます。Rust では await 可能な `bool`。再度呼び出すと再び実行されます)、`stop()`(その場で停止)、`reset()`(停止し、値を開始時の状態に戻す)があります。コールバックはツリー全体で 1 回だけ実行されます。

実行中のアニメーションは、その値を存続させません。値を所有するコンポーネント(そのビューと変数)がなくなると、無限ループもそれと一緒に停止し、結果は完了しなかったこと(`false`)になります。

<a id="easing"></a>

## イージング

イージングカーブはデータであり、ネイティブに評価されます。TSX では `nsh` からの `Easing`、Rust では `Easing` enum です。

| TSX | Rust | 説明 |
|---|---|---|
| `Easing.linear`、`Easing.ease` | `Easing::Linear`、`Easing::Bezier(0.25, 0.1, 0.25, 1.0)` | 一定の速度。CSS の `ease`。 |
| `Easing.quad`、`Easing.cubic`、`Easing.poly(n)` | `Curve::Quad`、`Curve::Cubic`、`Curve::Poly(n)` | `t²`、`t³`、`tⁿ`。 |
| `Easing.sin`、`Easing.circle`、`Easing.exp` | `Curve::Sin`、`Curve::Circle`、`Curve::Exp` | 正弦、円、指数。 |
| `Easing.back(s?)` | `Curve::Back(s)` | 動き出す前に一度引き戻されます(オーバーシュート `s`、デフォルトは 1.70158)。 |
| `Easing.elastic(bounciness?)` | `Curve::Elastic(bounciness)` | 弾むようなオーバーシュート。 |
| `Easing.bounce` | `Curve::Bounce` | 終端で跳ね返ります。 |
| `Easing.bezier(x1, y1, x2, y2)` | `Easing::Bezier(x1, y1, x2, y2)` | CSS と同じ 3 次ベジェ曲線。 |
| `Easing.steps(count, position?)` | `Easing::Steps(count, StepPosition::JumpEnd)` | 連続的に動く代わりに、`count` 段階の間をジャンプします(CSS の `steps()` と同様)。コマ送りのスプライトや、時を刻む針などに使えます。`position` は `"jump-end"`(デフォルト、`"end"` も同じ)、`"jump-start"`(`"start"`)、`"jump-none"`、または `"jump-both"` です。 |
| `Easing.in(e)`、`Easing.out(e)`、`Easing.inOut(e)` | `Easing::Curve(curve, EaseMode::In)`、`EaseMode::Out`、`EaseMode::InOut` | これらのカーブは「in」カーブです。`out` と `inOut` で反転できます。 |

TSX では、イージングを受け付ける場所ならどこでも、名前(`"linear"`、`"ease"`、`"easeIn"`、`"easeOut"`、`"easeInOut"`)やベジェの配列 `[x1, y1, x2, y2]` も渡せます。Rust では、`Easing::EaseIn`、`Easing::EaseOut`、`Easing::EaseInOut` が CSS のカーブです。

```rust tabs
x.timing(1.0, 300.0, Easing::Curve(Curve::Back(1.70158), EaseMode::Out));
x.timing(1.0, 300.0, Easing::EaseOut);
x.timing(1.0, 300.0, Easing::Bezier(0.2, 0.8, 0.2, 1.0));
```

```tsx tabs
x.timing(1, { easing: Easing.out(Easing.back()) });
x.timing(1, { easing: "easeOut" });
x.timing(1, { easing: [0.2, 0.8, 0.2, 1] });
```

`Easing.sample(easing, count)`(Rust では `sample_easing`)は、0 から 1 までを `count` 個の等間隔の点でサンプリングしたカーブを返します。`Animated.sampleSpring(config, fps?)` / `Animated.sampleDecay(config, fps?)`(`sample_spring`、`sample_decay`)は、スプリングや decay が通る値を、`config.from`(0)から終了するまで 1 フレームにつき 1 つ(デフォルトは毎秒 60)返します。これらはアニメーションが実行するのと同じネイティブコードで計算されるため、カーブのグラフはアニメーションの実際の動きをそのまま示します。

```rust tabs
use nsh_core::element::{sample_easing, sample_spring};

let curve = sample_easing(Easing::Curve(Curve::Back(1.70158), EaseMode::Out), 50); // 50 progress values
let spring = sample_spring(0.0, 1.0, Spring { stiffness: 180.0, damping: 8.0, ..Spring::default() }, 60.0);
```

```ts tabs
const curve = Easing.sample(Easing.out(Easing.back()), 50); // 50 progress values
const spring = Animated.sampleSpring({ toValue: 1, stiffness: 180, damping: 8 });
```

## LayoutAnimation

レイアウトアニメーションは、**次の**更新で起きるフレームの変化をネイティブにアニメーションします。移動またはリサイズするビューは新しいフレームへ滑らかに動き、新しいビューはフェード(またはスケール)インし、削除されるビューはフェードアウトします。状態を変更する直前に呼び出します。Rust では `animate_layout(..)`、TSX では `LayoutAnimation.configureNext(config)` です。

```rust tabs
use nsh_core::element::LayoutAnimation;

let items = signal(vec![1, 2, 3]);
let next = stored(4);

let add = move || {
    animate_layout(LayoutAnimation::SPRING);
    let n = next.with(|n| {
        *n += 1;
        *n - 1
    });
    items.update(|i| i.insert(0, n));
};
let remove = move || {
    animate_layout(LayoutAnimation::EASE_IN_EASE_OUT);
    items.update(|i| {
        i.remove(0);
    });
};
```

```tsx tabs
import { signal } from "nsh";
import { LayoutAnimation } from "nsh";

const items = signal([1, 2, 3]);
let next = 4;

const add = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  items.set([next++, ...items()]);
};
const remove = () => {
  LayoutAnimation.easeInEaseOut();
  items.set(items().slice(1));
};
```

| TSX | Rust | 説明 |
|---|---|---|
| `configureNext(config, onEnd?)` | `animate_layout(config)` | 次のコミットの変更をアニメーションします。TSX では、完了時に `onEnd` が実行されます。 |
| `create(duration, type?, property?)` | `LayoutAnimation::all(LayoutTransition::new(curve, ms))` | 3 つのフェーズすべてに 1 つのカーブを使う設定。 |
| `Presets.easeInEaseOut`、`Presets.linear`、`Presets.spring` | `LayoutAnimation::EASE_IN_EASE_OUT`、`LINEAR`、`SPRING` | 用意済みの設定。 |
| `easeInEaseOut(onEnd?)`、`linear(onEnd?)`、`spring(onEnd?)` | プリセット付きの `animate_layout` | プリセット付きの `configureNext`。 |
| `Types`、`Properties` | `LayoutCurve`、`LayoutProperty` | 設定を組み立てるための名前。 |

設定は `{ duration, create?, update?, delete? }`(Rust では `LayoutAnimation { create, update, delete }`)で、挿入されるビューには `create`、移動またはリサイズされるビューには `update`、削除されるビューには `delete` を使います。各フェーズは `{ type?, property?, duration?, delay?, springDamping? }`(`LayoutTransition { curve, property, duration_ms, delay_ms }`)で、`type` は `"easeInEaseOut"`、`"spring"`、`"linear"`、`"easeIn"`、`"easeOut"`、または `"keyboard"`(ソフトウェアキーボード自身のカーブ。キーボードが動き始めた時点から計時されるため、キーボードのために場所を空けるものがキーボードと一緒に動きます。`LayoutCurve::Keyboard`)です。`property` は、表示・非表示になるビューがアニメーションする対象(`"opacity"`、`"scaleXY"`、`"scale"`)で、`springDamping`(0..1、デフォルトは 0.7。`LayoutCurve::Spring { damping }`)はスプリングのオーバーシュートを設定します。

```rust tabs
use nsh_core::element::{LayoutAnimation, LayoutCurve, LayoutProperty, LayoutTransition};

animate_layout(LayoutAnimation {
    create: Some(LayoutTransition::new(LayoutCurve::EaseOut, 300.0)),
    update: Some(LayoutTransition::new(LayoutCurve::Spring { damping: 0.8 }, 300.0)),
    delete: Some(LayoutTransition {
        property: LayoutProperty::Scale,
        ..LayoutTransition::new(LayoutCurve::EaseIn, 300.0)
    }),
});
```

```tsx tabs
LayoutAnimation.configureNext({
  duration: 300,
  create: { type: "easeOut", property: "opacity" },
  update: { type: "spring", springDamping: 0.8 },
  delete: { type: "easeIn", property: "scaleXY" },
});
```

レイアウトアニメーションは、画面上のどこであっても、その更新で変わるすべてのフレームを対象にします。同じ更新で更新されるリストや、到着したライブデータも一緒に動きます。Rust のコンポーネントでは、1 つの要素の変更に伴って動くものだけを `ElementRef::animate_layout(transition)` でアニメーションします。対象は、その要素自身のフレームとその内容のフレーム、およびその要素のサイズによって押し出されるビュー(兄弟要素とその子孫、画面まで)です。更新のそれ以外のフレームは即座に変わります。`nsh/base` の `Collapsible` と `AccordionPanel` がコンテンツを表示するのは、この仕組みによるものです。

```rust
use nsh_core::element::{LayoutCurve, LayoutTransition};

let region = element_ref();
let open = signal(false);
let toggle = move || {
    region.animate_layout(LayoutTransition::new(LayoutCurve::Spring { damping: 1.0 }, 265.0));
    open.update(|o| *o = !*o);
};
view()
    .element_ref(&region)
    .overflow_hidden()
    .style_with(move |s| if open.get() { s } else { s.h(px(0.0)) })
```

<a id="what-runs-where"></a>

## 実行される場所

| | 実行場所 | フレームごとのあなたのコード |
|---|---|---|
| トランジション、キーフレームアニメーション | UI スレッド | なし |
| モーション、キーフレーム、`timing` / `spring` / `decay`、複合アニメーション | UI スレッド | なし。終了時にコードへ通知されます |
| `interpolate`、算術演算、`diffClamp` | UI スレッド | なし |
| `scrollValue`、`pan` / `pinch` / `rotation` | UI スレッド | なし。開始時と終了時にコードへ通知されます |
| レイアウトアニメーション | UI スレッド | なし |
| `requestAnimationFrame` ループ(Rust では `request_animation_frame`)、`onScroll` ハンドラー、`PanResponder` | あなたのコード、その後に更新 | 毎フレーム |

`requestAnimationFrame`(TSX ではグローバルで、ディスプレイに同期します)は、物理シミュレーションをコード内で行う場合など、事前に記述できないものにだけ使ってください。アニメーション値にできるものは、すべてアニメーション値にしてください。

<a id="reduced-motion"></a>

## モーションの軽減

ユーザーがモーションを減らすよう設定している場合(iOS の「視差効果を減らす」、Android の「アニメーションを削除」)、Rust の `reduce_motion()` と、TSX の `nsh` からの `reduceMotion()` は `true` になり、`motion-reduce:` / `motion-safe:` の Tailwind バリアントが適用されます。

[モーション](#motion)は、この設定に自動的に従います。`play` と `enter` は、動かさずにモーションの終了位置へ即座に到達し、結果は、再生されたモーションと同様に完了した(`true`)ことになります。退場は引き続き非表示で終わり、登場は引き続き静止状態で終わります。進行状況を示すスピナーのように、ユーザーに必要な意味を持つモーションには `ignoreReduceMotion: true`(Rust では `play_ignoring_reduce_motion`)を指定します。

トランジション、キーフレームアニメーション、アニメーション値、キーフレーム、複合アニメーションは、記述どおりに再生されます。より穏やかな代替手段を選ぶには、次のようにします。

```rust tabs
let open = move || {
    if reduce_motion() {
        panel.set(0.0);
    } else {
        panel.spring(0.0, Spring::default());
    }
};

view().style_when(|| !reduce_motion(), |s| s.animate_bounce())
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";

const open = () => (reduceMotion() ? panel.set(0) : panel.spring(0));

<View class="motion-safe:animate-bounce" />
```

[アクセシビリティ](./accessibility.md#reduced-motion)を参照してください。

<a id="related"></a>

## 関連項目

- [`nsh` のアニメーション API](../modules/nsh.md#animation): TSX リファレンス。
- [タッチとジェスチャー](./touch-and-gestures.md): 指でアニメーション値を駆動する。
- [スクロール](./scrolling.md#scroll-linked-effects-scrollvalue): `scrollValue`。
- [Canvas](./canvas.md#driving-drawings-with-animated-values): 描画におけるアニメーション値。
- [スタイルリファレンス](../modules/style-reference.md): `transition*` と `animation*` キー。
