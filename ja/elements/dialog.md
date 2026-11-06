---
title: "Dialog"
description: "Dialog コンポーネント:他のすべての要素の上に表示されるモーダルサーフェスで、フルスクリーンのフロー、シート、アプリ側でスタイルを指定するダイアログに使用します。"
group: base
demo: el-dialog
source_hash: a054e14119bef924
---

# Dialog

Dialogは、アプリの他の部分の上に、独自のネイティブなウィンドウレイヤーでコンテンツを表示します。iOSとMac CatalystではPresented view controller、AndroidではDialog、デスクトップとWebではウィンドウ全体を覆うレイヤーが使われます。全画面フロー、シート、ダイアログに使用します。システム標準のジェスチャー(シートを下にスワイプする、Androidの戻るボタン、Escape)も動作し、ネイティブ側で処理されます。Rustでは`nsh_base::dialog()`、TSXでは`nsh/base`の`<Dialog>`で作成します。

Dialogは動作を自身で管理し、見た目はアプリに任せます。そのスタイルはポップアップ(子要素を保持するビュー)に適用され、TSXでは`backdropClass` / `backdropStyle`でその背後にバックドロップを追加できます。

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

TSXでは、`open`が`false`でない間はDialogが表示され、`false`になると閉じます。Rustでは、ビューに含まれている間は表示され、ビューから外れると閉じるため、`when`がそれを保持します。いずれの場合も、Dialogのセーフエリアのインセットがコンテンツに渡され、その内側にある[`env(safe-area-inset-*)`](./safe-area.md)変数と`safeAreaInsets()`(Rustコンポーネントでは`cx.insets()`)がそれを読み取ります。同じく`nsh/base`からインポートする[`Button`](./button.md)は、アプリがスタイルを設定する押下ターゲットです。

`nsh_core::prelude`には、非推奨の古い`dialog`関数もあります。上記のように`nsh_base::dialog`を名前でインポートすると、明示的なインポートの方が優先されます。システムのアラートやアクションシートには、[`AlertDialog`](./alert-dialog.md)を使用してください。

## Props

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `open` | 開いている間ビューに含まれる(`when(open, ..)`) | `boolean` | `true` | trueの間表示されます。 |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | 表示と非表示のアニメーション方法。 |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | なし | `animation`の代わりに、WGSLシェーダーを通して表示・非表示を行います。`duration`ミリ秒(デフォルトは350)かけて`nsh.progress`が0から1へ進む間、`shade(uv)`は背後の内容を`sample_from`、Dialogを`sample_to`として読み取り、閉じるときは1から0へ戻ります。システムがモーションの軽減を求めている場合は、代わりに`animation`が使われます。[Shader](./shader.md)を参照してください。 |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | iOSでの形式。`fullScreen`は透明な背景で画面全体を覆います。`pageSheet`と`formSheet`は背後が見えたままになるシステムシートです(`formSheet`は大きな画面で中央に表示される小さめのシートです)。 |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | EscapeとAndroidの戻るボタンでネイティブに閉じます。 |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | バックドロップを押すと閉じます。 |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | シートを下にスワイプ(iOS、スマートフォンのブラウザー)すると、ネイティブに閉じます。 |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | なし | iOSとAndroid: Dialogが開いている間のステータスバーで、各ページの設定より優先されます([Status bar](../modules/nsh-base.md#status-bar))。 |
| `onOpen` | `.on_open(..)` | `() => void` | | 表示が完了しました。 |
| `onClose` | `.on_close(..)` | `() => void` | | 消えました。ユーザーが閉じたか、アプリが削除しました。 |
| `onCancel` | `.on_cancel(..)` | `() => void` | | ユーザーが閉じようとしました(Escape、戻る、バックドロップの押下、下スワイプ)。`closeOn*`フラグで閉じることが許可されているかどうかに関わらず呼ばれます。 |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | ユーザーが閉じました。ここで`open`を同期させてください。Rustでは、`on_cancel`がDialogをビューから削除します。 |
| `class`, `style` | `Styled`メソッド | `string`, `StyleProp<ViewStyle>` | | ポップアップ。子要素を保持するビューです。 |
| `backdropClass`, `backdropStyle` | Dialogを埋める子ビュー | `string`, `StyleProp<ViewStyle>` | | ポップアップの背後でDialogを埋めるバックドロップ。どちらかが設定されている場合に存在します。 |
| `children` | `.child(..)` | `JSX.Element` | | コンテンツ。 |

| `ios`のキー | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | 提示元の設定 | Dialogが許可する画面の向き。 |

| `android`のキー | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | コンテンツがステータスバーの下まで広がります。それ以外の場合は、ステータスバーの下から始まります。 |

## Opening and closing

Dialogの状態はアプリが保持します。ユーザーがDialogを閉じると(Escape、Androidの戻るボタン、バックドロップの押下、シートの下スワイプ)、ネイティブ側で閉じてアプリに通知し、アプリは状態をそれに合わせて設定します。TSXでは`onOpenChange({ open: false, reason })`、Rustでは`on_cancel`です。TSXでは、`open`が`true`のままの間はDialogは閉じたままで、`open`が`false`から`true`に変わると再び開きます。

各`closeOn*`フラグは、ユーザーの操作時にネイティブ側で読み取られます。メインスレッドがアプリのコードを待つことはないためです。閉じる前に確認したい場合は、フラグを`false`に設定してください。すると、閉じようとする操作で`onCancel`が呼ばれ、アプリ自身がDialogを閉じます(TSXでは`open`を`false`に設定し、Rustではビューから取り除きます)。

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

`onCancel`は、フラグでDialogを閉じられるかどうかに関わらず、閉じようとするたびに呼ばれます。

## A dialog with a backdrop

デフォルトの`fullScreen`プレゼンテーションのDialogは、アプリが描画したものを表示します。ここでは、暗くしたバックドロップと、その上に中央配置されたカードです。バックドロップを押すと閉じます。

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

システムのアラートやアクションシートには、`nsh/base`の[`AlertDialog`](./alert-dialog.md)を使用してください。

## Ref methods

なし。

## Platform notes

- iOSとMac Catalyst: `presentation`で形式を選びます。`fullScreen`は透明な背景で画面全体に表示します。`pageSheet`と`formSheet`はシステム背景のシステムシートで、下にスワイプすると指に追従します(`closeOnSwipe`)。
- Android: Dialogはウィンドウ全体を埋め、アプリのポップアップとバックドロップを表示します。戻るボタンは、スタックや`BackHandler`リスナーより先に、最前面のDialogに渡されます。
- デスクトップ(macOS、Windows、Linux、GPUI)とWeb: Dialogはウィンドウ全体を覆う透明なレイヤーで、アプリのポップアップとバックドロップを表示します。Escapeは閉じようとする操作として扱われます。
- `supportedOrientations`はiOS用、`statusBarTranslucent`はAndroid用です。Androidでは、`statusBarTranslucent`を設定しない限り、Dialogのコンテンツはステータスバーの下から始まります。
