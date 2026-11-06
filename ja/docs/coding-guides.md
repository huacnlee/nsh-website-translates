---
title: "コーディングガイド"
description: "RustとTSXで、保守しやすいNative Shellアプリやコンポーネントライブラリを作成するためのアーキテクチャとコーディング規約。"
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---

# コーディングガイド

このガイドでは、Native Shell アプリで長く通用してきたアプリケーションアーキテクチャとコードパターンを説明します。対象読者はエンジニアとコーディングエージェントの両方です。具体的には、NSH アプリの開発者(TSX モジュール、Rust コンポーネント、NSH を組み込むネイティブアプリ)と、`nsh/base` 上に構築するコンポーネントライブラリの作者を想定しています。最初にデザインガイドを読んでください。コードの構造はプロダクトの意図を保つべきであり、それを置き換えてはなりません。

これは規範的なガイドです。**must** はライフサイクル、正しさ、エコシステム上の制約を示します。**should** は既定のアーキテクチャであり、逸脱するには具体的な理由が必要です。正確なシグネチャについては、現行のソース、リファレンスページ、`.nsh/types` 内の宣言が引き続き正式な情報源です。

<a id="make-the-common-path-inexpensive"></a>

## 一般的な経路を低コストにする

**設計原則: 通常のコンポーネント利用が既定で低コストになるように、フレームワークの型とオーナーシップを選ぶ。**
開発者は、呼び出し箇所ごとにキャッシュを追加しなくても UI を構築し再利用できるべきです。一度だけ実行されるコンポーネントや、使われる場所で読み取られる[シグナル](./reactivity.md)がその例です。コンポーネントは自分の担当部分のツリーを一度だけ構築し、その後は変更されたシグナルを読むバインディングだけが再実行されるため、一般的な経路では重複した処理が発生しません。リアクティブグラフ、レンダラー、レイアウト、リストはネイティブであり、アプリのコードの 1 ターンは 1 回のネイティブ操作のバッチになります。それでも小さなコストは要素や更新ごとに積み重なります。特に、コード自体がインタープリターで動く TSX ではその傾向が顕著です。キャッシュを追加する前に、例外的なホットパスを計測してください([Performance](./performance.md))。どちらの選択もコストがゼロになることを約束するものではありません。仕組みについては、[状態オーナーシップのルール](#state-ownership)と後続のレンダリングのセクションで説明します。

<a id="architecture-at-a-glance"></a>

## アーキテクチャの概要

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

依存関係は下向きです。上位レイヤーはドメインの意味とオーケストレーションを担い、下位レイヤーは再利用可能なプレゼンテーションや振る舞いを担います。再利用可能なコンポーネントをアプリのページに依存させたり、コンポーネントライブラリを特定のアプリのテーマに依存させたりしないでください([Three layers](./architecture.md#three-layers))。

次の境界を使用します。

- **アプリシェル:** エントリ(`App.tsx`、または `nsh.json` `"root"`)がルートとナビゲーションスタックを構成し、ページのロジックは含めません。
- **ページ:** コンテンツ、ダイアログ、開始する処理を持つ 1 つの `NavPage`。
- **アプリコンポーネント:** 繰り返し現れる、ドメインを意識したパターン。
- **コンポーネントライブラリ:** `nsh/base` 上に構築された、スタイル付きの汎用 UI。アプリ独自のものでもコミュニティのものでもかまいません。
- **`nsh/base`:** プロダクト固有のプレゼンテーションを持たない再利用可能な振る舞い。ナビゲーション、ダイアログ、ポップオーバー、メニュー、シート、プレスターゲットなど。
- **`nsh`:** プリミティブ、スタイル、レイアウト、リアクティビティ、環境。

<a id="lay-out-an-apps-files"></a>

### アプリのファイルを配置する

アプリのファイルは NSH の規約に従うため、設定は不要です。`App.tsx` がエントリで、`nsh.json` がその隣に置かれ、どちらも規約によって検出されます。

```text
App.tsx            # the entry, by convention: mount(App)
nsh.json
Cargo.toml         # the app's crate, with Rust components ("rust": ".")
src/
  lib.rs
pages/
  Inbox.tsx
  Compose.tsx
  Settings.tsx
components/
  Card.tsx
store.ts
```

- `pages/` には `NavPage` ごとに 1 ファイルを置きます。ページが複数のファイルに分かれるのは、必要になったときだけです。
- `components/` には、複数のページが使うアプリの再利用可能なコンポーネントを置きます。
- `store.ts` にはアプリの状態、つまりシグナルとそれを変更する関数を置きます。ページはシグナルを読み、関数を呼び出します。
- テストは、テスト対象の隣に置く `*.test.tsx` ファイルです(`App.test.tsx`、`pages/Inbox.test.tsx`)。
- `Cargo.toml` と `src/lib.rs` はアプリ自身のクレートで、Rust コンポーネント(`nsh.json` `"rust": "."`)を持ちます。`src/lib.rs` 内の `#[native_module]` が、TSX がインポートする対象を指定します。Rust のみで書かれたアプリも同じ Cargo プロジェクトで、ルートコンポーネントは `src/lib.rs` にあります([Project structure](./project-structure.md))。

アプリシェルはページを構成しますが、ページのロジックはほとんど持ちません。ページはストアのシグナルを読み、その関数を呼び出します。他のページの状態を書き換えてはいけません。ストアのシグナルは非公開にし、それを読み取り・変更するものだけをエクスポートしてください。これにより、可変状態は公開関数の背後に保たれます。

```rust tabs
/// The app's workspace: its state stays behind these functions.
#[derive(Clone, Copy)]
pub struct Workspace {
    name: Signal<SharedString>,
}

impl Workspace {
    /// A workspace named "Untitled".
    pub fn new() -> Self {
        Self { name: signal(SharedString::from("Untitled")) }
    }

    /// Its name (tracked where it is read).
    pub fn name(&self) -> SharedString {
        self.name.get()
    }

    /// Renames it.
    pub fn rename(&self, name: impl Into<SharedString>) {
        self.name.set(name.into());
    }
}
```

```tsx tabs
// store.ts
import { signal } from "nsh";

const name = signal("Untitled");

/** The workspace's name (tracked where it is read). */
export const workspaceName = () => name();

/** Renames the workspace. */
export function renameWorkspace(next: string) {
  name.set(next);
}
```

ページがワークスペースを保持し、その id を検索に渡すことができます。検索はワークスペースのコレクション全体や非公開のシグナルを必要としません。単純な非循環の依存構造は次のとおりです。

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

ページはストアとコンポーネントに依存してかまいませんが、シェルや他のページの非公開部分に依存してはいけません。あるページが別のページの表示内容を変更する必要がある場合は、ストアを介して行ってください。これらの境界により、異なるエンジニアや AI エージェントが別々のページを並行して作業でき、ファイルの競合や共有状態の結合を減らせます。ただし、ストアについては引き続き調整が必要です。

<a id="bootstrap-and-root-ownership"></a>

## ブートストラップとルートのオーナーシップ

アプリは一度だけマウントし、ルートにサーフェス全体を与えます。TSX のエントリは `mount(App)` を呼び出し、Rust アプリは `nsh.json` でルートコンポーネントを指定します(`"root": "App"`)。ルートは `flex: 1` とテーマの背景でサーフェスを満たします。

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    provide_context(Workspace::new());
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(inbox())
}
```

```tsx tabs
import { mount, View } from "nsh";

mount(() => (
  <View class="flex-1 bg-background">
    <App />
  </View>
));
```

ルートは、サーフェス全体に属するものを調整します。ナビゲーションスタック、その上に重ねて表示されるダイアログ、ポップオーバー、メニュー、シート、ツールチップ、そしてセーフエリアです。1 つのサーフェス内でページごとに 2 つ目のルートをマウントしないでください。1 つのサーフェスは 1 つのエンジンです。ネイティブアプリが組み込む `NshAppView`、`NshView`、`AppView` のそれぞれが独自の VM、モジュール状態、リアクティブグラフを実行するため、1 つのホストアプリ内の複数のサーフェスが誤って状態を共有することはありません。

<a id="understand-what-runs-once-and-what-runs-again"></a>

## 一度だけ実行されるものと再実行されるものを理解する

NSH は、Solid のモデルに基づく、宣言的な構築を伴う保持状態です([Reactivity](./reactivity.md))。シグナルは更新をまたいで存続し、コンポーネント本体は作成時に自分の担当部分のツリーを一度だけ記述します。この区別を明確に保ってください。

| 記述するもの | 実行されるタイミング | 再実行される条件 |
| --- | --- | --- |
| コンポーネント本体 | 作成時に一度だけ | なし |
| バインディング: 値が入る場所にあるクロージャ(Rust)、またはプロパティを呼び出す・読み取る式(TSX) | 一度だけ | 読み取ったシグナルが変更されたとき。更新されるのはその prop または子要素のみ |
| `computed(fn)` | 作成時 | 読み取ったシグナルが変更されたとき |
| `effect(fn)` | そのパスの要素が存在した後 | 読み取ったシグナルが変更されたとき |
| `each` / `<Each>` の行 | そのキーが初めて現れたとき | なし。アイテムとインデックスのシグナルが変更される |
| `virtual_list` / `<List>` のセル | セルごとに一度 | なし。セルには別の行が渡される |

- 実行中のコンポーネントが**オーナー**です。実行中に作成されたエフェクト、算出値、タスク、タイマー、キーバインディング、クリーンアップはそのオーナーに属し、オーナーとともに破棄されます。
- **コンテキスト**(`provide_context` / `use_context`、`context()`、`<Ctx.Provider>`)は、それを読む要素がオーナーであることを意味せずに、サブツリーへ値を渡します。
- Rust コンポーネントの **`Scope`**(`cx`)は、イベントを発行し、渡されたインセットを読み取ります。
- **ref**(`element_ref()`、`ref`)は、命令的な呼び出し(`focus()`、`scroll_to()`、`measure()`)のためにホスト要素を指し示します。
- レイアウトと計測は後続のネイティブフェーズです。`onLayout` と `measure()` は、解決済みのジオメトリが本当に必要な場合にのみ使用してください。

イベントハンドラーやタイマーの中では、参照元となるコンポーネントが存在しないため、コンテキストを読み取ってはいけません。本体で読み取り、得られたものを保持してください。型付きハンドル(シグナル、リソース、ref、ドメイン id)を保持してください。これらは Rust では `Copy` であり、オーナーが破棄されると何も行わなくなります。

<a id="choose-the-right-unit"></a>

## 適切な単位を選ぶ

<a id="use-a-plain-function-for-value-like-elements"></a>

### 値のような要素にはプレーンな関数を使う

**軽量で再利用可能な UI の断片には、既定でプレーンな関数を使ってください。** 呼び出し側が現在の props とハンドラーを渡し、関数は要素を返し、作成したバインディング以外は何も残りません。引数がそのまま props になり、表示されるラベル、値、コールバックは呼び出し側の現在の状態から得られます。他のコンポーネントと同様、一度だけ実行されます。その後に変化するのはバインディングです。

```rust tabs
fn empty_state(title: impl Into<SharedString>) -> impl IntoElement {
    view()
        .gap_2()
        .items_center()
        .child(text(title.into()).text_color(move || theme().muted_foreground))
}
```

```tsx tabs
function EmptyState(props: { title: string }) {
  return (
    <View class="items-center gap-2">
      <Text class="text-muted-foreground">{props.title}</Text>
    </View>
  );
}
```

<a id="use-a-component-for-retained-behavior"></a>

### 保持される振る舞いにはコンポーネントを使う

UI の断片が永続的な状態や独立したライフサイクル(シグナル、エフェクト、非同期処理、タイマー、キーバインディング)を所有する場合は、`#[component]`(またはシグナルを作成する TSX コンポーネント)を使用します。その状態はコンポーネント本体で一度だけ作成し、バインディングの内部では決して作成しないでください。

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// Shown while the field is empty.
    pub placeholder: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let query = signal(String::new());
    input()
        .value(move || query.get())
        .on_change(move |text: &str| query.set(text.to_owned()))
        .placeholder(move || props.placeholder.get().to_string())
}
```

```tsx tabs
function Search(props: { placeholder: string }) {
  const query = signal("");
  return <Input value={query()} onChange={({ value }) => query.set(value)} placeholder={props.placeholder} />;
}
```

`#[component]` は型付きの props(`#[derive(Props)]`)とイベント(`#[derive(Event)]`)を持ち、TSX はそれらから生成された宣言でインポートします。TSX が `new` で使う保持状態(台帳、パーサー、セッション)は `#[class]` であり、関数は `#[module]` です([Building with Rust](./rust.md#extending-a-rust-app-with-tsx))。アプリが最もよく使う部分、コンポーネントライブラリ、負荷の高いロジックは、最初から最後までネイティブコードである Rust で記述してください。TSX は、頻繁に変更されるものや実行時に配信されるものに使用します。

すべての視覚的な断片をコンポーネントにしないでください。コンポーネントの境界にはライフサイクルと調整のコストがあります。保持されるアイデンティティが重要な場所で使用してください。

<a id="elements-views-and-behavior-systems-are-different"></a>

### 要素、ビュー、振る舞いシステムは別物である

すべてのコンポーネントを 1 つのテンプレートに押し込めないでください。エコシステムには次のものが含まれます。

- `Button`、`Switch`、`MenuItem` のようなセマンティックな要素。
- `Dialog`、`Popover`、`Menu`、`ContextMenu`、`Sheet`、`NavStack` のような複合的な振る舞いのルート。
- `Input`、`List`、`TextView`、およびナビゲーションスタックの状態のようなステートフルなシステム。
- オーバーレイとその配置、仮想化、スクロール、セーフエリア、キーボード、アニメーションのようなインフラストラクチャ。

要素は内部的に複雑であっても、呼び出し側にとっては値のように扱えることがあります。ステートフルなシステムは、アプリが振る舞いを再実装せずにプレゼンテーションを所有できるよう、レンダー関数を公開することがあります。公開する境界は、出力に現れるビューの数ではなく、振る舞いから選んでください。

<a id="state-ownership"></a>

## 状態のオーナーシップ

<a id="own-persistent-ui-text-with-103"></a>

### 永続的な UI テキストは `SharedString` で所有する

**Rust では、更新やコールバッククロージャをまたいで保持される UI テキストには `SharedString` を使うこと(must prefer)。** コンポーネントのラベル、タイトル、プレースホルダーなどが該当します。props はこれを受け取り(`Prop<SharedString>`)、バインディングに複製してもテキストはコピーされません。可変の編集バッファや、書式付きで組み立て中のテキストには `String` を使い、結果が準備できた時点で変換してください。1 回の呼び出し中だけの一時的な読み取り専用アクセスには `&str` を使います。TSX では、文字列はアプリ自身の値です。状態から計算されるテキストは、複数の場所で再構築せず、`computed` またはクロージャに保持してください。

UI が保持する不変のレスポンステキストについては、受け取った値をそのまま保持し、派生テキストや整形済みのプレゼンテーションテキストは、レスポンスを書き換えるのではなく別のドメイン値に格納してください。

それぞれの状態は、正しさを保てる最も狭いオーナーに置いてください。

- ドメイン状態はストア(`store.ts`)またはアプリのクレートに属します。
- 一時的なビュー状態は、それを描画するコンポーネントに、シグナルとして属します。
- 再利用可能な振る舞いの状態は、そのために設計されたコンポーネントに属します(`open` のない `Menu` や `Popover` は自身で状態を保持します)。
- サブツリーが共有する状態は、[コンテキスト](./reactivity.md#context)を通じて提供されるシグナルです。
- 実行をまたいで残るものは、[ストレージ](../modules/nsh.md#storage)またはサーバーに属します。

通常の選択やトグルには、制御された値を優先してください。現在の値をコンポーネントに渡し、要求された変更を受け取り、オーナーを更新すれば、バインディングがそれに追従します。コールバックは意図を通知するものであり、隠れた 2 つ目の信頼できる情報源を作ってはいけません。

```rust tabs
switch()
    .checked(show_hidden)
    .on_change(move |next: &bool| show_hidden.set(*next))
    .child(text("Show hidden files"))
```

```tsx tabs
<Switch checked={showHidden()} onChange={({ checked }) => showHidden.set(checked)}>
  <Text>Show hidden files</Text>
</Switch>
```

通知すべきものは何もありません。シグナルに書き込むと、それを読むバインディングだけが正確に更新されます。Rust コンポーネントはセマンティックなイベントを発行し、そのオーナーが `cx.emit(..)` で処理します。エフェクトは、そのオーナーが存続する限りシグナルを追跡します。1 つの不変条件を成す複数のフィールドは 1 つの [`batch`](./reactivity.md#batch) で書き込み、エフェクトや算出値がそれらを同時に参照できるようにしてください。

アプリ独自の制御されたコンポーネントも同じ契約に従います。数量ステッパーは、Rust で一度書き、Rust と TSX から配置されるドメインコントロールの例です。

```rust tabs
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The props of [`QuantityStepper`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct QuantityStepperProps {
    /// The quantity: the app owns the value.
    #[prop(default)]
    pub value: Prop<u32>,
    /// The smallest quantity (0 when left out).
    #[prop(default)]
    pub min: Prop<u32>,
    /// The largest quantity (99 when left out).
    #[prop(default = 99)]
    pub max: Prop<u32>,
    /// What screen readers say for the button that takes one away.
    pub decrement_label: Prop<SharedString>,
    /// What screen readers say for the button that adds one.
    pub increment_label: Prop<SharedString>,
}

/// What a [`QuantityStepper`] reports.
#[derive(Debug, Clone, PartialEq, Event)]
pub enum QuantityStepperEvent {
    /// The user asked for another quantity; the owner sets `value`.
    Change(u32),
}

/// A quantity with a button to take one away and one to add one.
#[component]
pub fn QuantityStepper(props: QuantityStepperProps, cx: Scope<QuantityStepperEvent>) -> impl IntoElement {
    // Read untracked: the user's act, measured against the owner's current value.
    let step = move |delta: i64| {
        let value = props.value.get_untracked();
        let (min, max) = (props.min.get_untracked(), props.max.get_untracked());
        let next = (i64::from(value) + delta).clamp(i64::from(min), i64::from(max)) as u32;
        if next != value {
            cx.emit(QuantityStepperEvent::Change(next));
        }
    };
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .child(step_button(
            "−",
            move || props.decrement_label.get(),
            move || props.value.get() <= props.min.get(),
            move || step(-1),
        ))
        .child(text(move || props.value.get().to_string()).text_color(move || theme().foreground))
        .child(step_button(
            "+",
            move || props.increment_label.get(),
            move || props.value.get() >= props.max.get(),
            move || step(1),
        ))
}

fn step_button(
    symbol: &'static str,
    label: impl Fn() -> SharedString + 'static,
    disabled: impl Fn() -> bool + 'static,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .disabled(disabled)
        .accessibility_label(move || Some(label()))
        .on_press(on_press)
        .w(px(32.0))
        .h(px(32.0))
        .items_center()
        .justify_center()
        .rounded(move || theme().radius)
        .bg(move || theme().muted)
        .active(|s| s.opacity(0.6))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(symbol).text_color(move || theme().foreground))
}

// The owner:
let quantity = signal(1_u32);
quantity_stepper()
    .value(quantity)
    .min(1)
    .max(10)
    .decrement_label("Fewer")
    .increment_label("More")
    .on_change(move |next: &u32| quantity.set(*next))
```

```tsx tabs
import { signal } from "nsh";
import { QuantityStepper } from "my-app";   // the Rust component: src/lib.rs has #[native_module("my-app")]

function CartRow() {
  const quantity = signal(1);
  return (
    <QuantityStepper
      value={quantity()}
      min={1}
      max={10}
      decrementLabel="Fewer"
      incrementLabel="More"
      onChange={({ value }) => quantity.set(value)}
    />
  );
}
```

同じ契約を TSX で表すと、`components/` 内のコンポーネントになります。

```tsx
import { Text, View } from "nsh";
import { Button } from "nsh/base";

export interface QuantityStepperProps {
  /** The quantity: the app owns the value. */
  value: number;
  /** The smallest quantity (0 when left out). */
  min?: number;
  /** The largest quantity (99 when left out). */
  max?: number;
  /** What screen readers say for the button that takes one away. */
  decrementLabel: string;
  /** What screen readers say for the button that adds one. */
  incrementLabel: string;
  /** The user asked for another quantity; the owner sets `value`. */
  onChange?: (e: { value: number }) => void;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 99;
  const step = (delta: number) => {
    const next = Math.min(max(), Math.max(min(), props.value + delta));
    if (next !== props.value) props.onChange?.({ value: next });
  };
  const buttonClass = "size-8 items-center justify-center rounded-(--radius) bg-muted active:opacity-60 disabled:opacity-40";
  return (
    <View class="flex-row items-center gap-3">
      <Button disabled={props.value <= min()} accessibilityLabel={props.decrementLabel} onPress={() => step(-1)} class={buttonClass}>
        <Text class="text-foreground">−</Text>
      </Button>
      <Text class="text-foreground">{props.value}</Text>
      <Button disabled={props.value >= max()} accessibilityLabel={props.incrementLabel} onPress={() => step(1)} class={buttonClass}>
        <Text class="text-foreground">+</Text>
      </Button>
    </View>
  );
}
```
<a id="keep-ownership-links-and-subscriptions-bounded"></a>

### 所有リンクとサブスクリプションの範囲を限定する

コンポーネントは自身が作成したものを所有し、作成されたものはすべてコンポーネントとともに消えます。たとえば、`<If>` ブランチが非表示になるとき、行が削除されるとき、ページが pop されるときです。Rust では、タスク、タイマー、インターバル(`spawn`、`set_timeout`、`set_interval`)とキーバインド(`on_key`)は、作成時のオーナーとともに終了します。TSX では、停止処理を [`cleanup`](./reactivity.md#cleanup) に登録するか、effect から返してください。リッスンは `on(event, listener)`(`host.on(name, listener)`、`BackHandler.on("press", listener)`)で行い、これは停止用の関数(`() => void`、Rust からは `Stop`)を返します。コンポーネントのレンダリング中に登録されたものは、`keymap.bind` のバインディングと同様に、コンポーネントとともに消えます。

何かが予期せず動き続けている場合は、まず次の点を調べてください。コンポーネントの外で作成された effect や computed 値(イベントハンドラやタイマーコールバック内で作成したものにはオーナーがなく、永久に生き続けます)、停止処理なしで登録されたリスナー、どのコンポーネントにも所有されていないストアから開始された処理です。drop された `resource` のロードは中止されます(TSX では `info.signal`)。ロードがコンポーネントを生かし続けることはありません。ただし、これらは調査の出発点としてよくある例であり、網羅的なリストではありません。

値を読み取った、あるいは導出したというだけの理由で signal に書き込まないでください。同じ signal を読む binding や effect から無条件に書き込むことは避けてください。NSH がエラーで停止するまで、自分自身を繰り返し再実行します。他の状態から計算される値は、2 つ目の signal に書き込む effect ではなく `computed` にします。

<a id="avoid-state-feedback-loops"></a>

### 状態のフィードバックループを避ける

テキスト入力、選択、フィルター、制御されたポップアップには、一般に 2 つの経路があります。外部のオーナーが値を更新する経路と、ユーザー操作が新しい値を要求する経路です。同期中に、オーナーから供給された値をユーザーコールバック経由で送り返さないでください。ユーザーの操作を処理するときは、オーナーの現在値を untracked で読み取り(Rust では `props.value.get_untracked()`、上記のとおり。TSX のイベントハンドラはすでに untracked です)、次の値と比較して、論理的な変更ごとに 1 回だけ通知されるようにします。コールバックが、自身を呼び出したコンポーネントを同期的に閉じる、置き換える、更新する可能性がある場合は、コールバックを再入安全にしてください。

<a id="stable-identity"></a>

## 安定した識別子

キーは動作の一部です。キーは行、ページ、繰り返されるコントロールに安定した識別子を与え、データが変化したときにどれが状態、フォーカス、計測値を保持するかを決定します。

- 行、タブ、ページ、繰り返されるコントロールには、安定したドメイン ID を使用します: `each(projects, |p| p.id, ..)`、
  `<Each of={projects()} key={(p) => p.id}>`、リストの `keyExtractor`。
- 同じコントロールが繰り返される場合は、テスト ID に所有オブジェクトの名前空間を付けます(`delete-${project.id}`)。
- 項目が挿入されたり並べ替えられたりしうる場合、翻訳されたラベルや変化しうるリストのインデックスから識別子を導出してはいけません。
- レンダリング中に新しいランダムなキーや ID を生成してはいけません。

```rust tabs
each(projects, |p| p.id, move |project, _index| {
    let id = project.get_untracked().id;
    button()
        .on_press(move || delete(id))
        .child(text("Delete").test_id(&format!("delete-{id}")))
})
```

```tsx tabs
<Each of={projects()} key={(p) => p.id}>
  {(project) => (
    <Button onPress={() => remove(project().id)}>
      <Text testID={`delete-${project().id}`}>Delete</Text>
    </Button>
  )}
</Each>
```

キーが変わることは UI の識別子が変わることを意味します。そのリセットは意図的なものとして扱ってください。

同じルールが、ナビゲーションルート、リストキー、ストレージキー、テスト ID にも当てはまります。`setRoutes` に残っているルートは、そのページと状態を保持します。独立して保持される 2 つの動作が同じキーを共有すると、互いの状態を上書きしうります。1 つの動作が更新のたびにキーを変えると、状態が蓄積されることはありません。

<a id="rendering-and-composition"></a>

## レンダリングと構成

コンポーネント本体は宣言的に保ちます。現在の状態を読み取り、表示用の値を導出し、要素を構成します。ドメイン操作、パース、自明でない変更は、ストアまたはアプリの crate の名前付き関数に移してください。

```rust tabs
#[component]
pub fn ProjectPage() -> impl IntoElement {
    view()
        .flex_1()
        .child(toolbar())
        .child(content())
}
```

```tsx tabs
function ProjectPage() {
  return (
    <View class="flex-1">
      <Toolbar />
      <Content />
    </View>
  );
}
```

ヘルパーを抽出するのは、意味のある領域に名前を付けられ、読み手が一度に把握すべき状態の量を減らせる場合です。新しいコンポーネントを抽出するのは、その領域が独自の再利用可能なコントラクトや保持されるライフサイクルを持つ場合です。ビルダーチェーンや JSX ブロックが長いというだけの理由で抽出してはいけません。

Rust では型付きスタイルメソッドとコンポーネントのビルダーを、TSX ではクラスを、一貫して使用してください。小さな条件付きの調整には `.when(..)` / `.when_some(..)`(Rust)と `classList`(TSX)を使います。分岐が実質的に異なるインターフェースを表す場合は `when` / `<If>` を使います。クロージャ内の三項演算子は、読み取る値のいずれかが変わるたびにその分岐を再構築するためです。

カスタムのサーフェスを作る前に、標準のセマンティックコンポーネントで構成してください。1 枚のスクリーンショットに合わせるためだけに、メニュー、ポップオーバー、シート、ダイアログを汎用ビューから再現してはいけません。`nsh/base` の `Menu`、`ContextMenu`、`Popover`、`Sheet`、`Tooltip`、`Dialog` は、配置、フォーカスの移動、キーボードナビゲーション、選択、無効状態、Escape と戻る操作による閉じる動作、アクセシビリティのコントラクトを保持します。標準コンポーネントが、繰り返し現れる妥当なパターンを表現できない場合は、呼び出しごとに任意の子孫をスタイリングするのではなく、明示的な API を改善してください。

アプリコードが供給するレンダー関数は副作用を持たないようにします。リストの row、`TextView` の `renderCodeBlock`、メニューの項目は、オーナーがセル、パーツ、オープンを必要とするたびに実行されうります。これらの中で、業務処理の実行、データの追加、無制限のサブスクリプションの開始を行ってはいけません。

<a id="behavior-and-presentation-boundary"></a>

## 動作とプレゼンテーションの境界

永続的な Base のルールは次のとおりです。

> Base は再利用可能な動作と、それを実装するために必要な構造を所有する。プレゼンテーションレイヤーは、プロダクトのビジュアル言語を所有する。

「Unstyled」は「空のビュー 1 つ」を意味しません。オーバーレイの配置、キーボードナビゲーション、編集、仮想化、戻るナビゲーション、閉じる動作、セーフエリアには、内部の構造と状態が必要です。この処理をすべての呼び出し側に移しても柔軟性は生まれず、壊れやすい動作が重複するだけです。

逆に、Base はブランドカラー、タイポグラフィ、密度、最終的なアイコン、コンポーネントのバリアント、文字列、アプリケーションの構成を選んではいけません。プレゼンテーションは次の手段で公開します。メインパーツには `class` / `style`、その他のすべてのパーツには `<part>Class` / `<part>Style`、型付きの状態スタイル(`active`、`hover`、`focus`、`selected`、`checked`、`disabled`)、名前付きスロット(`trigger`、`header`、`footer`)、レンダー関数です。タイトル、説明、閉じるボタンを見つけるために任意の子孫を調べてはいけません。セマンティックなパーツを明示し、すべてのラベルを prop または子として受け取ってください。

<a id="theme-and-styling"></a>

## テーマとスタイリング

セマンティックな値はテーマから読み取り、レイアウトは Rust では型付きスタイルメソッド、TSX では Tailwind クラスで適用します([Tailwind](./tailwind.md)、[テーマトークン](./tailwind.md#theme-tokens))。

```rust tabs
view()
    .bg(move || theme().background)
    .text_color(move || theme().foreground)
    .border_1()
    .border_color(move || theme().border)
    .rounded(move || theme().radius)
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-background text-foreground" />
```

ルール:

- プロダクトの色、角丸、スペーシング、コントロールのジオメトリをハードコードしないこと。
- アプリコードで、生の 16 進数、`rgb` / `rgba`、`hsla` の値を導入しないこと。セマンティックカラーは `theme()` またはトークンクラス(`bg-primary`)から読み取るか、不足しているロールをアプリのテーマファイルに追加すること。
- アプリのレイアウトでは、任意の値(`p-[13px]`、`px(13.0)`)ではなく、スペーシングとタイプのスケール(`p-2`、`gap-3`、`w-64`、`text-sm`、`.p_2()`、`.gap_3()`、`.w_64()`、`.text_sm()`)を使うこと。
- クラスは Tailwind CSS v4 での意味とまったく同じ意味を持ち、スタイル値は[スタイルリファレンス](../modules/style-reference.md)が与える意味を持つ(CSS のものをネイティブの形式にしたもので、数値の単位はポイント)。`unknown class` の警告は、修正すべき指摘事項であること。
- 意味にはセマンティックトークンを使い、パレット上の位置は使わないこと。
- 状態に依存しないジオメトリは、通常のビルダーチェーンまたはクラス文字列に記述すること。
- ランタイムのインタラクション状態には `active:`、`hover:`、`focus:`(`.active(..)`、`.hover(..)`、`.focus(..)`)を使うこと。これらはアプリコードへの往復なしにネイティブで適用される。
- checked、selected、pressed、disabled の外観には、コンポーネントのセマンティックな状態スタイル(`selected:`、`checked:`、`disabled:`)を使うこと。
- ポップアップの所有権は明示的な状態(`open` と `onOpenChange`)で保持し、閉じられるまでトリガーが open または pressed の外観を描画できるようにすること。
- コンポーネントのバリアントは、呼び出し箇所ごとに増やすのではなく、少数で意味のあるものに保つこと。
- プライマリのスタイリングは、決定エリアの実際のデフォルトのコミットとそのリターンキーアクションに結び付けること。アクションの数、頻度、ツールバー上の位置から導出しないこと。
- バッジとアラートのバリアントは、セマンティックで控えめに保つこと。通常のメタデータは中立のままにし、バリアントがあるからといって、すべての enum ケースやセクションを異なる色に対応付けないこと。

有効な優先順位は、要素自身のスタイル、次に状態スタイル(後の状態が優先)となり、`disabled` がすべてに優先します。後のレイヤーは、自身が設定したフィールドだけを置き換えます。

アプリが所有する新しいプレゼンテーションには、テーマのセマンティックトークンを優先してください。アプリのテーマファイル内のすべての名前はトークンであり、これは Tailwind の `@theme` の変数と同様です(`"up": "#16a34a"` は TSX では `text-up`、`bg-up/30`、`token("up")` を、Rust では `theme().color("up")` を与えます)。テーマにはライトとダークの値があるため、トークンは `dark:` クラスなしで外観に追従します。トークンにはコンポーネントではなくロールにちなんだ名前を付け、すべてのウィジェットの拡張ポイントにならないようにしてください。

テーマの変更は、アプリのテーマファイル(`nsh.json` `"theme"`)を通じて行うか、組み込み側のアプリに独自のテーマを提供させます。トークンを指定するクラスと、`theme()` を読み取る Rust のバインディングは、テーマが変わるたびに、JavaScript を実行することなくネイティブに再スタイルされます。トークンの値を独自の signal にコピーするコードは、トークンへの追従をやめてしまいます。

外側へのフォーカスリングには物理的な余白が必要です。`overflow: hidden`(`overflow-hidden`)を持つ祖先要素はそれをクリップします。余白を残せるレイアウトを優先してください。プロダクト上どうしても強くクリップする必要がある場合は、キーボードフォーカスを黙ってすべて隠すのではなく、フォーカス状態をコントロールの内側に描画してください。

<a id="the-users-text-size-is-the-apps-zoom"></a>

### ユーザーのテキストサイズはアプリのズームである

テキストはユーザーのテキストサイズ(Dynamic Type、Android のフォントスケール、デスクトップの設定)に従います。TSX では `fontScale()`、Rust では `font_scale()` を使い、どちらもリアクティブです。タイプスケール(`text-sm`、`text-base`: 16 ポイント、本文サイズ)が基準を定め、ユーザーの設定がそれを拡大縮小します。これは Tailwind のモデルの有用な部分、つまり無関係なポイント定数ではなく、名前付きのタイプ、スペーシング、サイズのステップを使うという考え方に意図的に従っています。

テキストコンテナは、テキストとともに大きくなるようにしてください。固定の高さではなく、最小の高さとパディングを与えます。拡大縮小されるテキストとその周囲の固定ジオメトリを組み合わせるカスタムコンポーネントは、その部分を拡大させない理由を文書化しなければなりません。

アプリ UI における任意のポイント値と生の色コンストラクタは、すべてレビューでの指摘事項として扱ってください。許容するのは、文書化された物理的またはプラットフォーム上の境界、実行時に計測されるジオメトリ、ラスターまたはデータの色、テーマ定義そのもの、のいずれかの場合に限ります。利便性やスクリーンショットに合わせることは、妥当な例外ではありません。

解決済みレイアウトからキャッシュされるものはすべて、無効化キーにフォントスケールを、直接またはそれと一緒に変わるリビジョンを通じて含めなければなりません。たとえば、リストに伝えた行の高さ、テキストの計測値、ポップアップのジオメトリ、テキストから導出されるアイコンサイズ、カスタムキャンバスのメトリクスです。
<a id="events-commands-and-focus"></a>

## イベント、コマンド、フォーカス

アクティベーションにはプレスを使います。`onPress`、`onLongPress`、`onPressDown`、`onPressUp`は、指、ペン、マウス、キーボードのいずれでも同じ意味になります。タッチハンドラとジェスチャーは、指に追従する操作(パン、ドラッグ)にのみ使います。キーバインド、メニュー、複数の入力からのディスパッチをサポートすべきコマンドには、キーボードショートカット(`keymap.bind`、`on_key`)とメニュー項目を使います。ハンドラは、そのコマンドを所有するページの近くに置いてください。

1 つの論理コマンドは 1 度だけモデル化します。`Button`、`Menu`項目、`ContextMenu`項目、`nsh/desktop`のアプリケーションメニュー項目、キーボードショートカットは、5 つのミューテーションをコピーするのではなく、store の同じ関数を呼び出すようにします。可能な限り、ラベル、アイコン、ショートカット、無効状態は 1 つのコマンドポリシーから導出し(`key_label("mod+s")`はショートカットをプラットフォーム流の表記で書きます)、エントリポイント間で食い違いが起きないようにします。メニューはナビゲーションと閉じる処理を担当し、コマンドを許可するかどうかとその処理内容は、引き続きページが担当します。

```rust tabs
on_key("mod+s", move |_| save());
view()
    .child(button().on_press(save).child(text("Save")))
    .child(
        menu()
            .trigger(view().px_3().py_2().child(text("File")))
            .child(menu_item().on_select(save).child(text(format!("Save  {}", key_label("mod+s"))))),
    )
```

```tsx tabs
keymap.bind("mod+s", save);

<View>
  <Button onPress={save}><Text>Save</Text></Button>
  <Menu trigger={<View class="px-3 py-2"><Text>File</Text></View>}>
    <MenuItem onSelect={save}><Text>Save  {keymap.label("mod+s")}</Text></MenuItem>
  </Menu>
</View>
```

要素の選択では、セマンティックなロールを保ってください。控えめな見た目にしたい場合でも、コマンドには`Button`を使います。リンクに置き換えるのではなく、控えめなスタイルを与えます。NSH アプリでは、`link`ロールを URL やメールアドレスのようにアプリの外で開かれるターゲット用に予約しています。アプリ内の遷移先にはナビゲーションを、コマンドには`Button`を使ってください。

ネストされたインタラクションが、親に同じタッチを処理させないようにする必要がある場合にのみ、伝播を止めます(タッチイベントでの`stopPropagation()`)。一律に伝播を止めると、スクロール、プレス、ジェスチャーが壊れ、原因の特定が困難になります。

**メインスレッドはアプリコードを待たない。** システムがその場で答えを必要とする場合(このページを pop してよいか、このシートやポップオーバーを閉じてよいか、このテキストを変更してよいか)、NSH は事前にマウントされた props からネイティブに応答し、その後でイベントによってアプリに通知します。したがって、判断は true か false を返すコールバックではなく、わかった時点で設定する prop です。`popOnBack={!dirty()}`と、確認のための`onBackPress`([popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback))、試行を受け取るための`closeOnEscape`および`closeOnBackdropPress`と`onCancel`、入力の`maxLength`、ボタンの`disabled`がその例です。

メニュー項目の`shortcut`(`nsh/desktop`)は、メニューが設定されている間そのキーをバインドし、メニューはそれをプラットフォームのスタイルで表示します。同じキー入力に対する`keymap`のバインディングが優先されます。各キー入力の所有者は 1 つにし、項目やショートカットが変わったらアプリケーションメニューを再設定してください。

フォーカスの所有者を明確にします。

- `Button`、`Switch`、メニュー項目は、デスクトップと Web ではキーボードフォーカスの停止位置になります。素の view ではなく、これらの上にコントロールを構築してください。
- フォーカスは、状態変更に続くイベントまたはエフェクトから ref の`focus()`で移動し、スクリーンリーダーのフォーカスは`set_accessibility_focus()`(Rust)または`nsh`(TSX)の`setAccessibilityFocus`で移動します。
- 目に見える`focus:`状態を描画します。
- レンダリング中に無条件でフォーカスを要求しないでください。

複合ウィジェットでは、いくつかの個別のショートカットだけでなく、完全なナビゲーションモデル(矢印キーによる移動、必要に応じた Home / End やページ移動、確定、キャンセル、Tab の挙動)を実装してください。

オーバーレイは最上位から閉じます。Escape と Android の戻るボタンは、リッスンしている最上位のオーバーレイに渡されます(`onCancel`)。閉じる操作と開く操作が素早く連続しても、すでに閉じつつある中間のサーフェスに対して処理を行わないようにしてください。

<a id="async-work-and-side-effects"></a>

## 非同期処理と副作用

非同期処理は、コンポーネント本体の無条件の副作用としてではなく、イベント、エフェクト、または [`resource`](./reactivity.md#resource) から開始します。エフェクトが追跡するのは同期的に読み取ったものだけです。まず signal を読み取り、それから処理を開始してください。処理が完了したら signal を通じて状態を更新し、コンポーネントがすでに存在しない可能性を考慮して、一貫性のある変更はまとめて書き込みます。

繰り返し実行される処理は所有者の下に置き、所有者がなくなったときにキャンセルされるようにします。Rust のタスクとタイマーは所有者とともに終了し、TSX のタイマーは`cleanup`で停止します。独立して完了する必要があるワンショットのタスクは store から開始できますが、その場合はキャンセルされなくなります。エラーと失敗したリクエストは明示的に処理してください。

非同期操作は明示的な状態で表現します。リソースの`state()`は`unresolved`、`pending`、`ready`、`refreshing`、`errored`のいずれかです。更新中は、使用可能な以前のデータを保持してください。リソースは再読み込み中も値を保持します。破壊的な送信の重複を防ぎ、回復可能なエラーは UI に表示します。ユーザーへのフィードバックとしてログに頼らないでください。

```rust tabs
let results = resource(
    move || {
        let q = query.get();
        (!q.is_empty()).then_some(q)
    },
    |q, _info| async move {
        let response = fetch(format!("https://api.example.com/search?q={q}")).await?;
        if !response.ok() {
            return Err(format!("HTTP {}", response.status()));
        }
        Ok(response.text())
    },
);
```

```tsx tabs
const results = resource(
  () => query() || undefined,
  async (q, { signal }) => {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as SearchHit[];
  },
);
```

負荷の高いパースや計算は、TSX のハンドラから外に出してください。`computed`に移すか、インタラクションのパスから外すか、Rust に移します。結果は、クエリ、ページ、選択が変わった後に到着することがあります。リソースは置き換えられた読み込みを破棄します。独自の処理では、リビジョンまたは識別子を付与し、古い結果は新しい状態に適用せずに拒否してください。

<a id="layout-measurement-and-scrolling"></a>

## レイアウト、計測、スクロール

view は子要素を列(column)として配置し、子要素はデフォルトでその幅いっぱいに引き伸ばされます。`class="flex"`(`.flex_row()`)は、CSS と同様に行(row)です。コントロールの行では子要素を中央揃え(`items-center`)にしたくなります。これは、その意図を明示するものです。全高の列を並べた行ではデフォルトの stretch のままにします。そうすると列が行の高さを満たし、ヘッダーが上端に留まります。

```rust tabs
view()
    .flex_row()
    .flex_1()
    .child(sidebar())
    .child(content())
```

```tsx tabs
<View class="flex flex-1">
  <Sidebar />
  <Content />
</View>
```

ほとんどの UI は、自分で計測するのではなくレイアウトを使うべきです([Layout](./layout.md))。計測(`onLayout`、`measure()`)は、オーバーレイ、仮想化、エディタ、チャートなど、正しさが解決済みのジオメトリに依存するコンポーネント向けの、踏み込んだ挙動用ツールです。

- 計測とジオメトリは、その挙動を所有するレイヤーに置きます。
- 通常のレイアウトでは関係を表現できない場合にのみ、レイアウトを監視します。
- 無関係なアプリの状態を、レイアウトイベントのたびに書き込まないでください。
- 計測データはリビジョンスコープのものとして扱ってください。テキストサイズ、幅、テーマ、コンテンツが変わると古くなることがあります。
- ポップアップの配置は`nsh/base`のオーバーレイに任せます。配置、フリップ、セーフエリアのマージンは 1 つのポリシーに従います。

配置の不変条件では、修正よりも構築を優先します。兄弟リージョンは、同じ値のリテラルを繰り返すのではなく、同じスペーシングトークンや共有のインセットを使うべきです。重要な繰り返しの端、列、ギャップについては、実際のプラットフォーム(`nsh test --target`)でジオメトリのチェックやスクリーンショットを追加してください。デフォルトのウィンドウ以外でも検証します。大きなテキストサイズやディスプレイのスケーリングによって、デフォルトのスクリーンショットでは揃って見えても、小数座標が 1 ピクセルのずれを生むことがあります。

精度をレビューするときは解決済みの結果を計測しますが、計測した補正を任意の値としてコードに埋め込まないでください。ずれの原因を、重複したパディング、ネストされたインセット、ボーダーの所有、フォントメトリクス、丸めまでたどり、構造上の所有者を修正します。

スクロール可能なリージョンには、必ず 1 つの所有者が必要です。同じ軸での意図しないネストしたスクロールは避けてください。スクロールビューには、ページ全体、パネル全体、リスト全体を所有する要素を与え、インジケーターがリージョンの端を基準に解決されるようにします。コンテンツのインセットは、パディング付きのコンテナでスクロールビューをラップするのではなく、スクロールビューの内側に置いてください(`contentClass` / `contentStyle`)。コンテンツとページ境界の間にインジケーターが浮いている場合は、たいていスクロールの所有者が誤っているか、パディングが誤ったレイヤーにあります。セーフエリアとキーボードを避けるには、パディングとマージンで`env(safe-area-inset-*)`と`env(keyboard-inset-height)`を使います(値はそれぞれのアクセサで読み取ります)。これらは回転とキーボードにネイティブに追従します。

<a id="lists-tables-and-large-data"></a>

## リスト、テーブル、大規模データ

データが小さく限られたコレクションを超えて増える可能性がある場合は、[`List`](./lists.md)(Rust では`virtual_list`)を使います。行の識別子は表示位置と分けて管理し、更新のたびにデータセット全体をコピーしないでください。リサイクル、スクロールの調整、可視範囲はリストに任せ、行の表示は row 関数が担当します。

次のものを分離します。

- ソースデータとドメイン id
- フィルタリングとソートの状態
- 選択状態
- スクロール状態
- 行のレンダリング

こうすることで更新が局所的になり、view ツリーがデータモデルになってしまうことを防げます。

仮想化は単なるパフォーマンスのスイッチではなく、挙動上の契約です。row 関数はセルごとに 1 度実行され、セルは他の行のために再利用されます。

- **項目ごとの状態は、id をキーとするデータに保持しなければなりません。** 行の内部で作成した signal に持たせてはいけません。signal はセルとともに次の項目へ引き継がれます。
- **項目は、使う場所であるバインディング内で読み取らなければなりません。** row 関数の先頭でコピーした値は、そのセルが最初に表示した行のものになります。
- TSX では不変な更新を行います(新しい配列を作り、変更されていない項目は再利用し、変更された項目は新しいオブジェクトにします)。また、一般的な行に近い`estimatedItemSize`を指定します。
- 項目へのスクロール(`scrollToIndex`)は、ほとんどの行が存在しない場合でも、データ座標で動作します。

```rust tabs
let liked = signal(HashSet::<u32>::new());

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
```

```tsx tabs
const liked = signal<Set<number>>(new Set());

<List each={posts()} estimatedItemSize={64} class="flex-1">
  {(post) => (
    <View class="flex-row p-4">
      <Text class="flex-1">{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

<a id="public-api-design"></a>

## 公開 API の設計

再利用可能なコンポーネントでは、次のようにします。

- props は有効なデフォルトを確立します。Rust では`#[prop(default)]`または`#[prop(default = …)]`、TSX では prop を読み取る箇所で`??`を使います。
- すべての prop、イベント、エクスポートに doc コメントを付けます。Rust では、それが TSX から見える TypeScript 宣言になります。
- コールバックは要求された変更を表し、ポインターの詳細は意味がある場合にのみ含めます。
- 任意の子孫を調べるよりも、明示的なパーツ、スロット、render 関数を優先します。
- 再利用可能な挙動を追加しても、プロダクトレベルの見た目の選択を強制してはいけません。

アプリは署名付きパッケージとしてホストアプリに配布され、再ビルドされない場合があります。NSH の以降のすべてのリリースは、それらをそのまま実行します。アプリやコンポーネントライブラリが他者に公開するもの(コンポーネントの props とイベント、crate のエクスポート、ホストアプリのネイティブコンポーネントやモジュールが受け取る関数)にも、同じ規律を適用してください。

- 入力にはオプションのメンバーのみを追加し、型は広げる方向にのみ変更します。デフォルトと挙動は維持します(新しい挙動はオプトインにします)。
- パラメーターが増える可能性のある関数は、オプションを 1 つのオブジェクト(`scrollTo({ x, y, animated })`)として受け取り、位置引数を追加しません。範囲の開始と終了のように、増えることのないパラメーターは位置引数のままにします。
- モード(mode)は、後から 3 つ目の状態が必要になる boolean ではなく、値を追加できる文字列ユニオンにします。
- 値の型は 1 つにします。`version: string`とし、`string | number`にはしません。
- 関数の戻り値は、タプルや単体の値ではなく、フィールドを追加できるオブジェクトにします。
- Promise を返す関数は、すべての失敗を Promise の reject で報告し、呼び出し側が処理できる失敗には、NSH 自身のものと同様に`code`を持たせます。呼び出し側はコードで分岐し、メッセージは人間向けで変更される可能性があります。
- 名前を変更する場合は、同じ実装を指す`@deprecated`エイリアスとして古い名前を残します。

Rust では、呼び出し側を壊さずに進化させる必要がある挙動上の状態には、private フィールドをデフォルトにします。public フィールドは、意図的にレコード的な設定やシリアライズされるデータに適しています。public フィールドを持つすべての public struct には、`#[non_exhaustive]`を付け、`Default`を実装する必要があります。これにより、呼び出し側は網羅的な struct リテラルなしで値を作成でき、既存の呼び出し側を壊さずにフィールドを追加できます。

内部を再編成しても、公開されるインポートパスは安定させてください。crate の`#[native_module]`指定子とそのエクスポート、そして TSX モジュールのエクスポートが、他のコードがインポートするものです。Web フレームワークの用語よりも、プラットフォームのコントロールの用語と NSH で確立された命名を優先してください。
<a id="platform-and-capability-boundaries"></a>

## プラットフォームと機能の境界

すべてのプラットフォームが同じ機能をサポートしていると想定しないでください。タイトルバーとウィンドウコントロール、アクセシビリティ、クリップボード、ハプティクス、スクロールの物理挙動、フォント、タイミングは異なる場合があります。1つのバンドルがどこでも動作します（[プラットフォーム固有のコード](./platform-specific.md)）。プラットフォーム固有のコードは NSH が用意した場所に置き、フォールバックの動作を定義してください。

- 要素がすべてのプラットフォームで何を意味するかは、トップレベルの prop で表します。プラットフォーム独自のシステム機能は、それを持つ各プラットフォームの `ios={{…}}`、`android={{…}}`、`desktop={{…}}` または `web={{…}}`（Rust ではビルダーメソッド）に置きます。適用されるのは現在のプラットフォームのオブジェクトだけです。
- モバイルプラットフォームの API は `nsh/mobile` から、デスクトップの API は `nsh/desktop` から提供されます。
- プラットフォームごとのスタイルは `ios:`、`android:`、`web:` クラスで指定します。

プラットフォームごとの分岐では、見せ方が違っても意味上の契約を保たなければなりません。たとえばダイアログは iOS ではシートとして、デスクトップではウィンドウ上のレイヤーとして表示されますが、アプリには一貫した開閉状態が必要です。共通の動作はヘッドレスでテストし、プラットフォーム固有の部分は `nsh test --target` でテストしてください。NSH が報告する値（`platform.os`、状態、理由）に基づく分岐には、必ず `default` を用意してください。今後のリリースでプラットフォームやケースが追加され、今日配信したアプリがそれらの上で動作するためです（[互換性](./compatibility.md)）。

アプリは VM の外部に到達するものを `nsh.json` の `"capabilities"` に宣言します。取得先のホスト、Web ビューが表示するページ、クリップボード、ステータスバーなどです（[サンドボックスと Capabilities](./sandbox-and-capabilities.md)）。他のアプリに組み込まれて配信されるアプリは、使うものだけを正確に列挙し、拒否されたリクエストも失敗したリクエストと同じように扱ってください。ホストアプリは、アプリが宣言した範囲より少ない権限しか与えない場合があります。拒否された呼び出しは `code` `"ERR_ACCESS_DENIED"` で失敗し、その `permission` には機能名が、`resource` には要求された内容が入ります。

<a id="file-and-naming-conventions"></a>

## ファイルと命名の規約

- ページとコンポーネントには、プロダクトの概念に沿った名前を付けます：`ProjectList`、`ProjectEditor`、`SettingsPage`。
- イベントハンドラには、意図に沿った名前を付けます：`confirmDelete`、`openProject`、`onQueryChange`。
- 1つのモジュールには主たる責務を1つだけ持たせます。無関係な動作を読まなければ状態の所有やライフサイクルを理解できなくなったら、ファイルを分割してください。
- コンポーネントのモジュール、props、イベント、対象を絞ったテストは、一緒に変更されるなら同じ場所にまとめます。
- 不変条件や意外なライフサイクル上の制約はドキュメントに書き、自明なビルダー呼び出しを逐一説明するのはやめます。
- Rust では `rustfmt` を使い Clippy を満たし、TSX では `nsh check` を使います。無関係な警告を隠してしまう広範な `allow` 属性は避けてください。

<a id="vocabulary-is-part-of-the-api"></a>

### 語彙は API の一部である

同じ概念には、コンポーネントをまたいで同じ語を使います。prop やイベントに名前を付ける前に、まず NSH 自身の API、次に GPUI Kit の `gpui-base`、GPUI、`gpui-component`、最後にプラットフォームのコントロールの順で用語を探してください。プリミティブが表示するものとグローバル API の名前は、HTML、DOM、CSS に由来します（`src`、`html`、`placeholder`）。Rust の名前は `snake_case` で、TSX では `camelCase` に変換されます（`on_open_change` は `onOpenChange`）。1つの語は1つの語のままにします（`readonly`、`multiline`）。

| 概念 | 命名パターン | 例 |
| --- | --- | --- |
| コンポーネント | 名詞、`PascalCase` | `Button`、`Dialog`、`QuantityStepper` |
| props とイベント（Rust） | `<Component>Props`、`<Component>Event` | `ButtonProps`、`ButtonEvent::Press` → `onPress` |
| 振る舞いの状態オブジェクト | `<Control>State`、`create<Control>` で作成 | `NavStackState`、`createNavStack` |
| 値が変わった理由 | `<Control>ChangeReason`、文字列のユニオン | `DialogChangeReason`：`"cancel"`、`"backdropPress"` |
| 状態 | 形容詞、肯定形、`is` 接頭辞なし | `open`、`hidden`、`disabled`、`selected`、`checked`、`readonly` |
| ユーザーに許可される操作 | 形容詞 | `scrollable`、`zoomable`、`selectable`、`resizable` |
| 形容詞のない機能 | `<feature>Enabled` | `pagingEnabled` |
| パーツを表示するかどうか | パーツ名を付けた boolean、デフォルトは `true` | `scrollbar`、`caret`（`scrollbar={false}`） |
| スロットを表示するかどうか | `<slot>Visible`、デフォルトは `true` | `headerVisible`（`header` はページのスロット） |
| パーツのスタイル | `<part>Class`、`<part>Style` | `backdropClass`、`contentStyle` |
| 状態のスタイル | `<state>Style`、`<state>:` クラス | `activeStyle`、`disabled:` |
| スロット | それが何であるか | `header`、`footer`、`trigger`、`content`、`empty` |
| アプリの内容 | `render<Part>` | `renderCodeBlock` |
| 閉じる操作のフラグ | `closeOn<Trigger>`、デフォルトは `true` | `closeOnEscape`、`closeOnBackdropPress` |
| 値の変更 | `on<Value>Change({ <value>, ... })`、1つのオブジェクト | `onChange({ value })`、`onOpenChange({ open, reason })` |
| その他のイベント | `on<Event>`、現在形、1つのオブジェクト | `onPress()`、`onSubmit({ text })` |
| フェーズ | `<act>Start`、`<act>End` | `onPanStart`、`onLoadStart` |
| ビュー上のマウス | `Enter` / `Move` / `Leave`、DOM の名前 | `onMouseEnter`、`onMouseMove`、`onMouseLeave` |
| リッスンの開始 | `on(event, listener)`、`() => void` を返す | `host.on(name, l)`、`BackHandler.on("press", l)` |
| 環境の値 | アクセサ、隣に `set<Value>` | `colorScheme()`、`setColorScheme` |
| 読み取り専用の boolean | `is<Adjective>`、`has<Noun>` | `isAvailable` |

props に `is<Adjective>` は使いません。この形は boolean を読み取るだけのもの（定数、ペイロードのフィールド）のためのものです。表示されるパーツには、そのパーツの名前を付け、`<part>Shown`、`<part>Hidden`、`shows<Part>` は使いません。

Rust のビルダーは `Self` を受け取って返し、設定する prop の名前をそのまま付けます。`set_` は付けません（`.disabled(..)`、`.checked(..)`、`.on_change(..)`）。その場での変更は `set_<field>` です（`setRoutes`、`setColorScheme`）。boolean のリーダーは、値が何かを保持している場合は `has<Noun>`、状態や許可を表す場合は `is<Adjective>` のいずれかにします。操作に対応する形容詞があるときは、必ず形容詞を使ってください。`canClose` より `isClosable`、`canZoom` より `isZoomable` です。操作が形容詞形のない動詞句の場合は、代わりにそれが必要とするものに名前を付けます。`canGoToDefinition` ではなく `hasDefinition` です。新たに `can` リーダーを追加しないでください。

<a id="let-the-enclosing-name-carry-the-context"></a>

### 囲んでいる名前に文脈を担わせる

名前は何かの内側で読まれます。prop はコンポーネントの内側で、フィールドは型の内側で読まれます。どちらも、それを囲むものを繰り返してはいけません（`contentContainerStyle` ではなく `contentStyle`、`dialogBackdropClass` ではなく `Dialog` の `backdropClass`）。1つの型のフィールドは、省略の度合いをそろえてください。

<a id="use-precise-domain-words"></a>

### 正確なドメイン用語を使う

- **selected** はメンバーシップまたは現在の項目です。**checked** と **pressed** はチェックボックスやトグルの値です。**focused** はキーボードの対象です。**hovered** はポインタの存在です。これらを互換的に使ってはいけません。
- **open / close** はオーバーレイの状態です。**show / hide** は一時的な要求です。**expand / collapse** は構造に対するものです。
- **disabled** は操作をブロックします。**readonly** は選択とナビゲーションを許可しますが、編集は許可しません。**loading** は、処理の実行中に重複した作業が行われるのを防ぎます。
- **press** はあらゆる入力による起動で、NSH のイベントは press を使います（`onPress`）。**click** はマウスによるものです。
- **index** は位置で、**id** は同一性です。並べ替え可能なデータを index で永続化したりキー付けしたりしないでください。
- **value** は制御されるドメインデータで、**state** は保持される振る舞いです。
- **src** は要素が表示するリソース（画像、動画、ページ）です。それ以外のアドレスは **url** です。
- **role** は選択肢が何を意味するかを表します（`"cancel"`、`"destructive"`）。見た目はアプリ側のものです。

より狭いドメイン用語があるときは、`data`、`item2`、`handleAction`、`updateUi`、`process`、`manager`、`config` のような曖昧な名前を避けてください。

<a id="type-and-module-style"></a>

### 型とモジュールのスタイル

- Rust の型は `UpperCamelCase`、モジュール、関数、メソッド、フィールド、ローカル変数は `snake_case`、定数は `SCREAMING_SNAKE_CASE` です。コンテキストのバインディングには `cx` という名前を付けます。
- TSX のコンポーネントとそのタグは `PascalCase`、props、関数、ローカル変数は `camelCase` です。プリミティブは `nsh` から、基本コンポーネントは `nsh/base` から提供されます。
- コンポーネントにちなんで名付けられたモジュールは、その公開インターフェースを所有します。他から import されるものを変えずに、状態、パーツ、テストをファイルに分割してください。
- 1つのコンポーネントの概念には単数形のモジュール名を使い、ファミリーには定着した名前を使います（`Menu`、`MenuItem`、`Submenu` のための `menu`）。
- 識別子には `Id` を接尾辞として付け、コレクションには意味のある複数形を使います。1つのサブシステム内で `idx`、`index`、`ix` を使い分けて混在させないでください。
- 可能なら述語は肯定形で命名します。肯定形の状態は、複数の否定形よりも組み合わせやすくなります。ただし、コントロールの意味論に合致する場合は、`disabled` のような定着した用語を残してください。

<a id="callback-and-event-wording"></a>

### コールバックとイベントの表現

- すべてのイベントは1つのオブジェクトを渡します。フィールドが1つでも、値の変更でも同様で、フィールドは報告する props と同じ名前にします：`onChange({ value })`、`onOpenChange({ open, reason })`、`onLinkPress({ url })`。こうしておけば、後からフィールドを追加できます。API のデータ型はフィールドであり、ペイロードそのものにはしません（`onImagePress({ image })`）。報告するものがないイベントは、何も渡しません。
- 過去形や要求の形ではなく、行為に名前を付けます：`onPress`、`onClose`、`onCancel`、`onBackPress`。
- 行為に名前があるときは、ジオメトリではなく意図に名前を付けます：`onLoadMore`。「末尾に到達した」とは書きません。
- ライフサイクルのペアは `onOpen` / `onClose` です。フェーズは `Start` / `End` で、`Begin` は使いません。ビュー上のマウスは `onMouseEnter` / `onMouseMove` / `onMouseLeave`（DOM の名前）、ビュー上にドラッグされたファイルは `Enter` / `Leave` です。
- コールバックがコンポーネント自身の状態変更の前に実行されるのか後に実行されるのか、またコンポーネントに再入してよいかどうかを文書化してください。

<a id="documentation-and-copy-style"></a>

### ドキュメントと文言のスタイル

公開ドキュメントは、コンポーネントが何をするか、誰が状態を所有するかから書き始めます。例には現在の API を使い、安定した id を示してください。デフォルト値、プラットフォーム間の差異、フォーカスの挙動、コールバックの順序、メインスレッドがネイティブに読み取る props を文書化します。

ラベル、コマンド、確認ダイアログ、大文字小文字の使い方、省略記号については、Design Guides のインターフェース言語のルールに従ってください。各ドメインオブジェクト、コマンド、状態には、正規の用語を1つだけ使います。

翻訳キーは、ソース言語の文や画面上の座標ではなく、安定した意図を表します（`dialog.deleteProject.title`）。翻訳された断片から文を組み立てたり、たまたま英語の文面が同じになる別々の意味に1つのキーを使い回したりしてはいけません。

構文ではなく意図をローカライズします。語順、複数形、句読点、必要な文脈の量について、各ロケールが制御できるようにしてください。テストでは、キーの欠落や固定用語の不整合を検出します。繰り返しが文脈上正当かどうかは、引き続き人間のレビューで判断します。すべての文字列を、現実的な内容、テキストの伸長、大きな文字サイズで、コンポーネント内で検証してください。

<a id="testing-strategy"></a>

## テスト戦略

振る舞いを証明できる最も低いレイヤーでテストします（[テスト](./testing-and-trace.md)）。

1. 状態遷移、フォーマット、パース、順序付けの純粋なテスト（クレートの関数の `cargo test`、ストアの関数のテストファイル）。
2. コンポーネント、イベント、ライフタイムのヘッドレスなアプリテスト。実際のエンジン、レンダラー、レイアウト、リストを使い、表示フレームは 60 Hz で、`nsh test`（`nsh/test`）または `cargo test`（`nsh_testing::Headless`）で実行します。
3. フォーカス、キーボード、ポインタ、レイアウト、レンダリング状態のインタラクションテスト。ユーザーが行う手順（`press`、`type`、`scroll`、`drag`、`keyboard.press`）で、ヘッドレスと実際のプラットフォーム（`nsh test --target macos`、`ios`、`android`、`web` など）の両方で実行します。
4. 完全なワークフローのための example またはアプリのスモークテストと、インタラクションのコストを測る `nsh test --trace`。

```rust tabs
#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open("./App.tsx");
  await app.press("role:button[Tap]");
  expect(app.texts()).toContain("Count: 1");
});
```

インタラクティブなコンポーネントでは、実装の詳細ではなく意味上の契約をカバーしてください。press とキーボードによる起動、制御された値の変更、disabled の挙動、フォーカスの移動、イベントの回数と順序、安定した同一性、重要な空の状態や失敗の状態です。ネットワークはスタブ化し（`network` ルート）、時間は（手動クロックで）制御して、実際のネットワークや時間を待たないようにします。失敗を決定論的に再現できる場合は、バグを修正する前に回帰テストを追加してください。

ビューは、ユーザーと同じようにロールと名前、ラベル、テキスト（`role:button[Save]`、`label:Close`）で探し、他に名前を付けるものがない場合は安定した `testID` で探します。セレクターはステップごとに読み直されるため、ステップが古いスナップショットに対して動作することはありません。セレクターでは表現できない視覚的な事実にはスクリーンショット（`app.screenshot`、実際のプラットフォーム上）を使い、座標はフォールバックとしてのみ使用します。自動化された証拠と手動の証拠は、分けて報告してください。

<a id="performance-rules"></a>

## パフォーマンスのルール

- バインディングやエフェクトから、それ自身が読み取る状態へ無条件に書き込まないでください。
- バインディングや行関数の内部で、シグナル、エフェクト、キーバインディング、高コストなデータ構造を作成しないでください。
- バインディング内でシグナルを読み取ると、まとまった変更がツリーの最も狭い部分だけを更新します。
- 長いコレクションには `List` を使い、見える範囲だけをレンダリングします。
- クロージャを満たすためだけに、大きな文字列やコレクションをクローンしないでください。`Copy` なハンドルや共有データ（`SharedString`、`Rc`）をキャプチャします。
- TSX のハンドラと算出値は軽量に保ち、重い処理はインタラクションの経路から外すか、Rust に移します。
- キャッシュを追加する前に `nsh test --trace` で計測してください。キャッシュには、無効化の責任を持つ所有者が明確に存在しなければなりません。
- アニメーション処理は有界に保ちます。毎フレーム書き込まれるシグナルではなく UI スレッド上のアニメーション値を使い、スクロールリスナーではなく `scrollValue` を使い（[アニメーション](./animation.md)）、reduced motion を尊重します（`reduceMotion()`）。
<a id="common-failure-modes"></a>

## よくある失敗パターン

次のパターンは避けてください。

- 1 つのシグナルがアプリの無関係な状態をすべて抱えている。
- ビジネスロジックやネットワークリクエストが、長いコンポーネント本体に埋め込まれている。
- 並べ替え可能なコンテンツに、ランダムまたはインデックスベースのキーを使っている。
- `List` の行の内部で作成したシグナルに、行ごとの状態を持たせている。
- コンポーネント本体で prop やシグナルを読み取り、それが更新されることを期待している。
- リテラルの色や角丸が、カスタムテーマやダークモードを壊している。
- フォーカス、キーボード、無効状態、アクセシビリティの動作をすでに提供しているセマンティックなコンポーネントがあるのに、独自の押下可能なビューを作っている。
- 制御された値から乖離していく、重複したローカル状態。
- あるシグナルを別のシグナルにコピーするエフェクトや、バインディングを通じてループする書き込み。
- システムがその場で必要とする判断を、事前に設定する prop ではなくコールバックに任せている。
- 所有者が明示されていない、ネストしたスクロールビュー。
- 一度きりの画面のために、新しいコンポーネントのバリアントを作っている。
- 元に戻せて低リスクな操作に対する確認ダイアログ。
- 内部関数は呼び出すが、押下、入力、スクロールを一切行わないテスト。

<a id="rules-for-coding-agents"></a>

## コーディングエージェント向けのルール

編集する前に、エージェントは最も近い実装、そのテスト、モジュールの公開エクスポート、および関連するリファレンスページを読む必要があります。React、React Native、CSS、GPUI のサンプルを類推して置き換えるのではなく、現在のソースと `.nsh/types` でシグネチャを検索してください。NSH のコンポーネントは一度だけ実行され、バインディングは読み取ったシグナルに追従します。

エージェントは、変更ごとに次の項目を挙げられる必要があります。

1. 振る舞いの所有者とプレゼンテーションの所有者。
2. 保持されるアイデンティティと状態のライフサイクル。
3. 押下、キーボード、フォーカス、アクセシビリティの契約。
4. レイアウトとスクロールの所有者。
5. テーマトークンと、意図的な例外。
6. 振る舞いが退行した場合に失敗するテスト。

生成されたコードは、人間がレビューしてテストしなければなりません。「コンパイルが通る」ことは UI 品質の基準ではありません。また、生成されたコードを整って見せるだけの大規模なリファクタリングは、アプリのアーキテクチャに合わせることの代わりにはなりません。

<a id="implementation-checklist"></a>

## 実装チェックリスト

レビューのために変更を提出する前に、次の点を確認してください。

- 状態と副作用の所有者が明示されている。
- プレーンな関数とコンポーネントのどちらを使うかが意図的に選ばれており、prop とシグナルは使用する場所で読み取られている。
- 繰り返される要素に、ドメインに基づく安定したキーとテスト ID がある。
- 孤立した見た目のリテラルが、テーマトークンと Tailwind のスケールに置き換えられている。
- 押下、キーボードショートカット、フォーカス、無効状態、オーバーレイが連携して動作する。
- システムがその場で必要とする判断が、事前に設定される prop になっている。
- 読み込み中、空、エラー、キャンセルの各経路が表現されている。
- 長いデータセットには `List` を使い、項目ごとの状態はデータに持たせている。
- 公開 API の追加は拡張のみで、依存方向とカプセル化が維持されている。
- テストが、適切なレイヤーで、ヘッドレスおよび変更が関わるプラットフォーム上で、振る舞いを検証している。
- フォーマット、Clippy、`nsh check`、対象を絞ったテスト、および関連するサンプルが通る。

アプリのセットアップについては [はじめに](./getting-started.md) を、現在の API の詳細については [Elements](../elements/index.md) と [API](../modules/index.md) のリファレンスを参照してください。
