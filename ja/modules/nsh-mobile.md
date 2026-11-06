---
title: "nsh/mobile"
description: "iOS と Android が備えるもの: システムのタブバーである TabBar、iOS の InputAccessoryView、Android の BackHandler、そして isAvailable。"
order: 12.2
source_hash: 53d6d77de0d6e9ca
---

# nsh/mobile

`nsh/mobile` は iOS と Android 固有の機能を提供します。両プラットフォーム共通のシステムタブバー `TabBar`、iOS のキーボード上のバー [`InputAccessoryView`](#inputaccessoryview)、Android の戻るボタン [`BackHandler`](#backhandler) です。Rust コードでは `nsh_core::mobile` と `nsh_core::prelude` を使い、TSX では `nsh/mobile` をインポートします。このモジュールはすべてのプラットフォームでインポートできるため、1 つのバンドルをどこでも実行できます。他のプラットフォームでは、コンポーネントは領域を占有せず、呼び出しはすぐに戻ります。`isAvailable` で iOS か Android かを判定でき、どちらかは `nsh` の `platform.os` で分かります。デスクトップ向けの機能は [nsh/desktop](./nsh-desktop.md) を参照してください。

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## スコープ

このモジュールは、アプリのトップレベルのナビゲーションに使うシステムタブバーなど、モバイルプラットフォーム固有の機能を提供します。一般的なコントロールは [`nsh/base`](./nsh-base.md) に属します。たとえば [Switch](../elements/switch.md) は、スマートフォン、デスクトップ、Web で動作と API を共有し、トラック、サム、状態のスタイルはアプリが与えます。`TabBar` はモバイルアプリのナビゲーション向け、`Tabs` はプラットフォームをまたぐタブ付きコンテンツ向けです。ここに属するのは、モバイル固有のインタラクションの意味を持つ機能だけです。システム標準の外観、サイズ、アニメーションというだけでは、共通コントロールの共有された役割は変わりません。この区別が、どの機能をここに置くかの指針になります（[目標と設計原則](../docs/goals.md)）。

## isAvailable

```ts
const isAvailable: boolean;
```

iOS、iOS シミュレーター、Mac Catalyst、Android では `true`、それ以外では `false` です。Rust では `matches!(os(), Os::Ios | Os::Android)` を使います。

## TabBar

タブバーは、記録と統計、受信トレイと設定のように、アプリのトップレベルのセクションを切り替えます。`TabBar` はシステム自身のバーなので、システムのアプリと同じ見た目と動作になります。iOS と iPadOS では `UITabBar`（iOS 26 では Liquid Glass とその選択表示）、Android では Material 3 のナビゲーションバーで、ライトとダークのシステムカラーを使います。アプリはタブ（`items`）を渡し、選択中のタブ（`selectedIndex`）を指定し、ユーザーの選択（`onChange`）を受け取り、`class` と `style` でバーを配置し、選択中のセクションのコンテンツ自体を表示します。ページ内のタブや、すべてのプラットフォームで使うタブには、`nsh/base` の [Tabs](../elements/tabs.md) を使用してください。

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar` は `nsh/mobile` から取得でき、Rust では `nsh_core::mobile` です。選択状態はアプリが管理します。タップすると、タブのインデックス（`{ index }`）を伴う `onChange` が通知され、システムのバーと同様に、バーは選択を即座に反映します。アプリはそのセクションを表示し、インデックスを `selectedIndex` として渡し直します。高さは、スタイルで指定されていなければシステムの値になります。Rust では、`tab_bar()` でバーを作成します。プロパティごとのセッター（`.items(..)`、`.selected_index(..)`）、イベントごとのリスナー（`.on_change(..)`）、型付きのスタイルメソッドが用意されています。タブの作成には `TabBarItem::new(title).icon(name)` を使います。

<a id="props"></a>

### プロパティ

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | タブを順番に指定します。 |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | 選択中のタブをインデックスで指定します。タブの数を超えるインデックスを指定すると、どのタブも選択されません。 |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS: トランジションなしでバーを非表示にします。この値は push と pop をまたいでアプリが管理します。この prop と、表示中のスタックの `hidesBottomBarWhenPushed` リクエストの両方が false のときにバーが表示されます。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | バーの位置とサイズです。見た目はシステム標準で、選択中のタブにはテーマの `primary` が使われます。 |
| `testID` | `.test_id(..)` | `string` | なし | テストや `nsh test --trace` でバーを見つけるために使います。 |

#### TabBarItem

| フィールド | Rust | 型 | 説明 |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | タブのタイトルです。スクリーンリーダーが読み上げます。 |
| `icon` | `.icon(name)` | `string` | タブのアイコンです。プラットフォームごとの名前で指定します。iOS では [SF Symbol](https://developer.apple.com/sf-symbols/)（`"house"`）、Android ではアプリの drawable（`res/drawable/home.xml` は `"home"`、`"android:ic_menu_search"` はシステムのもの）です。`platform.select` でプラットフォームごとに 1 つ選べます。 |

<a id="events"></a>

### イベント

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | ユーザーがタブを選択しました。`{ index }` はそのインデックスです。バーは選択を即座に反映します。アプリはタブのコンテンツを表示し、`selectedIndex` を設定します。 |

<a id="platform-notes"></a>

### プラットフォーム別の注意

- **iOS と Mac Catalyst**: `UITabBar` で、iOS のバージョンに応じたシステムの外観になります。iOS 26 では、フローティングの Liquid Glass バーとその選択表示です。アイコンは SF Symbols です。テーマの `primary` がバーの `tintColor`、つまり選択中のタブの色になります。他のタブはシステムの色のままです。
- **Android**: プラットフォームのビューで構成された Material 3 のナビゲーションバーです。各ラベルの上にアクティブインジケーター内のアイコンが表示され、押下時にはリップルが出ます。色は、Android 12 以降ではシステムのダイナミックカラー、それより前では Material のベースラインカラーが使われ、アプリの外観に合わせてライトまたはダークになります。ウィンドウの下端ではナビゲーションバーの下まで広がり、Material と同様にそのインセット分だけ高くなります。アイコンはアプリの drawable です（バーが着色します）。選択中のタブのアイコンとラベルにはテーマの `primary` が使われ、その 12% の不透明度のアクティブインジケーターが重なります。他のタブはシステムの色のままです。
- **デスクトップ（macOS、Windows、Linux、GPUI）と Web**: セクションはアプリの外観の [Tabs](../elements/tabs.md) で表示されます。ここでは `TabBar` は領域を占有しないため、1 つのレイアウトで両方に対応でき、`platform.os`（[`nsh` のデバイス API](./nsh.md#device)）で切り替えます。

## InputAccessoryView

iOS と Mac Catalyst で動作します。Android では空の非表示ビューです。

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

キーボードの上に表示されるバー（UIKit の `inputAccessoryView`）で、`nativeID` と一致する `ios={{ inputAccessoryViewID }}` を持つ入力欄にフォーカスがある間、表示されます。Rust では `input_accessory_view(native_id)` を使い、`.input_accessory(native_id)` が一致する入力欄に対して表示されます。幅はウィンドウと同じ、高さはコンテンツと同じで、キーボードに合わせてネイティブに移動します。

| プロパティ | 型 | Rust | 説明 |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | この `inputAccessoryViewID` を持つ入力欄がバーを表示します。 |
| `style` | `StyleProp<ViewStyle>` | `Styled` メソッド（`.bg(…)`） | バーのスタイルです（たとえば背景）。 |
| `class` | `string` | | Tailwind クラスです。 |
| `children` | `JSX.Element` | `.child(…)` | バーのコンテンツです。 |

ツリー内で配置した場所には何も描画せず、Android ではまったく何も描画しません。そのため、対応する入力欄の隣に置いても問題ありません。

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

[フォームとキーボード](../docs/forms-and-keyboard.md)も参照してください。

## BackHandler

Android で動作します。iOS ではリスナーは保持されるだけで呼び出されず、`exitApp()` はすぐに戻ります。

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

システムの戻るボタンと戻るジェスチャーを扱います。戻る操作はまずダイアログが処理し（ダイアログが閉じます）、次に `BackHandler` のリスナーが、最後に追加されたものから順に実行されます。どれも処理しなかった場合は最上位のナビゲーションスタックが pop され、戻るページがなければアプリが終了します。

| メンバー | Rust | 説明 |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | `listener` は、操作を処理した場合に `true` を返します。リスナーの登録を解除する関数を返します。コンポーネントのレンダリング中（またはエフェクトの実行中）に追加されたリスナーは、Rust でも TSX でも、そのコンポーネントとともに停止します。 |
| `exitApp()` | リスナーが `false` を返す | アプリを終了します。Rust のリスナーが `false` を返すと、操作がそのまま続行され、スタックが戻るか、アプリが終了します。 |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> リスナーは、システムが戻る操作を配信した後に実行されます。メインスレッドがアプリのコードを待つことはありません。リスナーが 1 つ以上登録されている間、NSH はダイアログが処理しなかった戻る操作を引き受け、どのリスナーも `true` を返さなければ、最上位のスタックで戻るか、アプリを終了します。

ステータスバーは、iOS でも Android でも、`nsh/base` の[ページとダイアログ](./nsh-base.md#status-bar)の `statusBar` で設定します。
