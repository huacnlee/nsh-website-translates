---
title: "Toast"
description: "Toast、ToastStack、ToastManager: gpui-base と同様のスタイルなしトースト、トランジションステータスを持つセマンティックなルート、トーストをレイヤーとして配置するスタック、そしてヘッドレスなライフサイクルを提供します。"
group: base
demo: el-toast
source_hash: 8e86cb66a9413fab
---

# Toast

トーストは、アプリの上にしばらく表示される短いメッセージです。「コピーしました」「下書きを削除しました · 元に戻す」「送信できませんでした」などがその例です。
`nsh/base` は、GPUI Kit の `gpui-base` と同様に、スタイルを持たない3つの部品としてその動作を提供します。

- **`ToastManager`** はトーストを順序どおりに保持し、ライフサイクルを管理します。各トーストはまず `"starting"` になり、モーションの継続時間が経過すると `"present"` になります。表示中で一時停止されていない間はタイムアウトをカウントダウンし、終了時には、退場の継続時間のあいだ `"ending"` の状態を保ってから削除されます。
- **`ToastStack`** はトーストを計測し、ある端を起点にして、最新のものを端の最も近くに配置します。折りたたみ時は重なり合うレイヤー、展開時(ポインターが載っているとき、または指が触れているとき)はリストとして並べ、スプリングで動かします。
- **`Toast`** は各トーストのルートです。`alert` ロール、アプリのスタイル用の `transitionStatus`、閉じることを要求するスワイプ、そして表示時にラベルを読み上げるスクリーンリーダーの対応を提供します。

見た目と内容はアプリ側のものであり、どこからでもトーストを表示できる利便性もアプリ側で用意します。アプリはこれらの上に独自の `toast(...)` を構築します。ギャラリー(`examples/gallery/toast.tsx`)がそうであり、GPUI Kit の通知が `gpui-base` のトーストの上に構築されているのと同じです。

```rust tabs
use std::time::Duration;

use nsh_core::{time::now, prelude::*};

use nsh_base::{
    Anchor, ToastManager, ToastMotion, ToastOptions, ToastStackState, theme, toast, toast_stack,
};

fn toasts() -> impl IntoElement {
    let manager = stored(ToastManager::<u64, SharedString>::new(ToastMotion::sonner()));
    let shown = signal(Vec::new());
    let state = ToastStackState::new();
    let sync = move || {
        shown.set(manager.with(|m| {
            m.visible(3)
                .map(|(id, t, s)| (*id, t.clone(), s))
                .collect::<Vec<_>>()
        }))
    };
    // Advance the lifecycle while toasts are mounted, paused while expanded.
    set_interval(Duration::from_millis(50), move || {
        if manager.with(|m| m.advance(now(), state.is_expanded()).changed) {
            sync();
        }
    });
    manager.with(|m| {
        m.push(
            1,
            "Copied".into(),
            ToastOptions::timeout(Some(Duration::from_secs(5))),
            now(),
        )
    });
    sync();
    toast_stack()
        .placement(Anchor::BottomCenter)
        .state(state)
        .w(px(340.0))
        .child(each(
            shown,
            |(id, _, _)| *id,
            move |item, _| {
                toast()
                    .transition_status(move || item.get().2)
                    .accessibility_label(move || Some(item.get().1))
                    .on_dismiss_request(move || {
                        manager.with(|m| m.dismiss(&item.get().0, now()));
                    })
                    .rounded_xl()
                    .px_4()
                    .py_3()
                    .bg(move || theme().card)
                    .shadow_lg()
                    .transition_all()
                    .duration(200.0)
                    .starting_class("opacity-0 translate-y-4")
                    .ending_class("opacity-0 scale-95")
                    .child(text(move || item.get().1))
            },
        ))
}
```

```tsx tabs
import { Overlay, signal, Text, safeArea } from "nsh";
import { Toast, type ToastEntry, ToastManager, ToastStack } from "nsh/base";

const manager = new ToastManager();
const shown = signal<ToastEntry[]>([]);
const expanded = signal(false);
const sync = () => shown.set(manager.visible(3));
// Advance the lifecycle on a timer, paused while the stack is expanded.
setInterval(() => {
  if (manager.advance(expanded()).changed) sync();
}, 50);

export function toast(title: string) {
  manager.push(crypto.randomUUID(), { title }, { timeout: 5000 });
  sync();
}

export function Toaster() {
  return (
    <Overlay class="inset-x-0 bottom-0 items-center p-4" style={{ paddingBottom: safeArea().bottom + 16 }}>
      <ToastStack placement="bottomCenter" class="w-80" onExpandedChange={(e) => expanded.set(e.expanded)} onCancel={() => {
        const newest = shown().filter((t) => t.status !== "ending").at(-1);
        if (newest) { manager.dismiss(newest.id); sync(); }
      }}>
        <Each of={shown()} key={(t: ToastEntry) => t.id}>
          {(t) => (
            <Toast
              transitionStatus={t().status}
              accessibilityLabel={(t().value as { title: string }).title}
              onDismissRequest={() => { manager.dismiss(t().id); sync(); }}
              class="rounded-xl bg-card px-4 py-3 shadow-lg transition-all duration-200"
              startingClass="opacity-0 translate-y-4"
              endingClass="opacity-0 scale-95"
            >
              <Text class="font-semibold text-card-foreground">{(t().value as { title: string }).title}</Text>
            </Toast>
          )}
        </Each>
      </ToastStack>
    </Overlay>
  );
}
```

`Toast`、`ToastStack`、`ToastManager` は [`nsh/base`](../modules/nsh-base.md) から提供されます。Rust では `nsh_base` の `toast`、`toast_stack`、`ToastManager` です。

## ToastManager

マネージャーはヘッドレスです。何も描画せず、タイマーも動かしません。アプリがトーストを push し、`visible(limit)` が返すトーストをそのステータスとともに描画し、いずれかがマウントされている間はタイマーで `advance` を呼び出します。スタックが展開されている間は `paused` を渡します。Rust ではアプリの ID と値に対する `ToastManager<I, T>` で、各呼び出しに `Instant` があります。TS では文字列の ID と任意の JSON 値に対するクラスで、エンジンのクロック(テストの手動クロックを含む)で動作します。

- `push(id, value, options)` は最新のトーストを追加します。同じ ID のトーストがあれば置き換え、その値を返します。`options.timeout` はその表示時間(ミリ秒)で、指定しない場合は閉じられるまで表示され続けます。
- `dismiss(id)` はトーストの退場を開始し、`dismissAll()` はすべてのトーストの退場を開始してその ID を返します。
- `advance(paused)` はライフサイクルを進め、変化した内容を報告します。`presented`、`ending`(タイムアウトが尽きたもの)、`removed`(その値とともに)、そして `changed` です。
- `visible(limit)` は、退場中でないトーストのうち最新の `limit` 件と退場中のトーストを、古い順に並べたものです。`entries()`(Rust では `iter()`)はそのすべてです。ほかに `get(id)`、`len()`、`isEmpty()` があります。

`ToastMotion` は両者のトークンを保持します。`duration`(400 ms:登場の期限とスタックのスプリングの応答時間)、`exitDuration`(200 ms)、`collapsedPeek`(14)、`expandedGap`(14)、`collapsedScaleStep`(0.05)、`collapsedVisible`(3)で、いずれも Sonner の値です(Rust では `ToastMotion::sonner()`。TS では省略したフィールドがこれらの値になります)。

## ToastStack

スタックの子は、古い順に並んだトーストです。`placement` の端(デフォルトは `"topRight"`。下側のアンカーでは上方向に配置されます)を起点に、折りたたみ時のトーストは `collapsedPeek` ずつずらして重なり、後ろのものほど `collapsedScaleStep` ずつ狭くなり、表示されるのは `collapsedVisible` のみです。展開時は `expandedGap` 間隔のリストになります。トーストの到着や退場、および展開は、臨界減衰のスプリングで動きます。ポインターがスタックの上にある間、または指が触れている間は展開状態になります(`onExpandedChange({ expanded })`。Rust では `ToastStackState` で、`is_expanded()` がそれを読み取ります)。これにより、ユーザーがトーストを読んだり触れたりしている間、アプリはタイムアウトを一時停止できます。

スタックの配置はアプリが行います。セーフエリアの内側で、端に置いた [Overlay](./overlay.md) の中に配置します。幅は `class` と `style` で決まります。トーストを保持している間は、Escape と Android の戻るボタンを受け取り(`onCancel`。`closeOnEscape={false}` ではアプリの他の部分に任せます)、最新のトーストを閉じます。

<a id="toast-1"></a>

## Toast

トーストは、アプリのコンテンツを囲む `alert` ロールです。その `transitionStatus` はマネージャーのものであり、状態クラスは `class` に従って付与されます。`"starting"` の間は最初のフレームで `startingClass` が付き、その `transition` クラスがそこからアニメーションします(Tailwind の `starting:`、CSS の `@starting-style`)。`"ending"` の間は退場の継続時間のあいだ `endingClass` が付きます。ポインターでスワイプされている間は `swipingClass` が付きます(`transition-none` により指に追従し続けます)。

指またはマウスで `swipeDirection`(デフォルトは `"right"`。`null` でスワイプを無効化)の方向にドラッグすると、ポインターが動いた後にトーストが動くため、内部のボタンはボタンとして機能します。`swipeThreshold` ポイント(50)を超えて離すか、フリックすると、そのまま外へ移動し、閉じることを要求します(`onDismissRequest`)。届かなければ元の位置に戻ります。スクリーンリーダーは、表示時に `accessibilityLabel` を読み上げます。

## Toast props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `transitionStatus` | `.transition_status(..)` | `"starting" \| "present" \| "ending"` | `"starting"` | ライフサイクルのフェーズ。 |
| `startingClass`, `endingClass`, `swipingClass` | `.starting_class(..)`, ... | `string` | なし | 最初のフレーム、退場中、スワイプ中のクラス。 |
| `swipeDirection` | `.swipe_direction(..)` | `"right" \| "left" \| "up" \| "down" \| null` | `"right"` | スワイプで取り除く方向。 |
| `swipeThreshold` | `.swipe_threshold(..)` | `number` | `50` | スワイプを離したときに閉じることを要求するまでの移動量。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | 表示時にスクリーンリーダーが読み上げる内容。 |
| `onDismissRequest` | `.on_dismiss_request(..)` | `() => void` | なし | ユーザーがスワイプして取り除いた。 |

## ToastStack props

| Prop | Rust | Type | Default | Description |
|---|---|---|---|---|
| `motion` | `.motion(..)` | `ToastMotion` | Sonner の値 | モーションのトークン。 |
| `placement` | `.placement(..)` | `"topLeft" \| "topCenter" \| "topRight" \| "bottomLeft" \| "bottomCenter" \| "bottomRight" \| "leftCenter" \| "rightCenter"` | `"topRight"` | レイアウトの起点となる端。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | トーストを保持している間、Escape と戻るを受け取る。 |
| `onExpandedChange` | `.on_expanded_change(..)`, `.state(..)` | `(e: { expanded: boolean }) => void` | なし | 操作によって展開または折りたたまれた。 |
| `onCancel` | `.on_cancel(..)` | `() => void` | なし | Escape または戻る:最新のトーストを閉じる。 |
