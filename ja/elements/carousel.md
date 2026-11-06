---
title: "Carousel"
description: "Carousel とその構成要素: スライドを一度に1つずつ表示し、スワイプ、ホイール、タッチパッド（プラットフォーム本来のスクロール）、前へ・次へのコントロール、ページネーション、キーボードで移動できます。端ではシームレスにループします。どのスライドを表示するか、スナップ、ループ、キー操作、アクセシビリティは Carousel が管理し、見た目とすべてのラベルはアプリ側で用意します。"
group: base
demo: el-carousel
source_hash: 9feb40f13fbb43b0
---

# Carousel

カルーセルは、スライドを一度に一つずつ表示します。商品の写真、オンボーディングの各ステップ、自動で切り替わるバナー、カードの列などに使えます。`Carousel`が動作を担います。どのスライドを表示するか、スライド間のスワイプ、前へ・次へのコントロール、ページネーション、矢印キー、端での循環、スクリーンリーダーが読み上げる内容です。各パーツはコンテキストを通じてカルーセルを見つけるので、アプリは自分のレイアウトの中で自由に配置できます。見た目はアプリ側が決めます。色、サイズ、矢印、ドット、ラベルは一切持ちません。

コンテンツはネイティブのスクロールビューです。指、ホイール、タッチパッドの操作は、プラットフォームのメインスレッド上でポインターと同じフレームでスライドを動かし、離すと最も近いスライドにスナップします。1回のフリングで動くのは1スライドです。静止すると、カルーセルは`onChange`でそのスライドを通知します。コントロール、ページネーション、キー、アプリの`index`は、コンテンツをネイティブにそのスライドまでアニメーション付きでスクロールさせます。

```rust tabs
use nsh_base::{
    carousel, carousel_content, carousel_item, carousel_next, carousel_pagination,
    carousel_pagination_item, carousel_previous, theme,
};
use nsh_core::prelude::*;

fn photos() -> impl IntoElement {
    let index = signal(0u32);
    let names = ["Harbor", "Dunes", "Glacier"];
    carousel()
        .index(move || Some(index.get()))
        .on_change(move |i: &u32| index.set(*i))
        .accessibility_label("Photos")
        .gap_3()
        .child(
            carousel_content().w_full().h(px(180.0)).gap_3().child(
                names
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        carousel_item()
                            .accessibility_label(format!("{} of 3: {name}", i + 1))
                            .w_full()
                            .rounded(move || theme().radius)
                            .bg(move || theme().muted)
                            .items_center()
                            .justify_center()
                            .child(text(*name))
                    })
                    .collect::<Vec<_>>(),
            ),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap_2()
                .child(carousel_previous().accessibility_label("Previous photo").child(text("‹")))
                .child(
                    carousel_pagination()
                        .flex_row()
                        .gap_1()
                        .child(
                            (0..3)
                                .map(|i| {
                                    carousel_pagination_item()
                                        .index(i)
                                        .accessibility_label(format!("Photo {}", i + 1))
                                        .size_2()
                                        .rounded_full()
                                        .bg(move || theme().border)
                                        .selected_style(|s| s.bg(move || theme().primary))
                                })
                                .collect::<Vec<_>>(),
                        ),
                )
                .child(carousel_next().accessibility_label("Next photo").child(text("›"))),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPagination,
  CarouselPaginationItem,
  CarouselPrevious,
} from "nsh/base";

const NAMES = ["Harbor", "Dunes", "Glacier"];

function App() {
  const index = signal(0);
  return (
    <Carousel index={index()} onChange={({ index: next }) => index.set(next)} accessibilityLabel="Photos" class="gap-3">
      <CarouselContent class="h-[180px] w-full gap-3">
        {NAMES.map((name, i) => (
          <CarouselItem
            accessibilityLabel={`${i + 1} of ${NAMES.length}: ${name}`}
            class="w-full items-center justify-center rounded-(--radius) bg-muted"
          >
            <Text>{name}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <View class="flex-row items-center gap-2">
        <CarouselPrevious accessibilityLabel="Previous photo" class="disabled:opacity-40">
          <Text>‹</Text>
        </CarouselPrevious>
        <CarouselPagination class="flex-row gap-1">
          {NAMES.map((_, i) => (
            <CarouselPaginationItem
              index={i}
              accessibilityLabel={`Photo ${i + 1}`}
              class="size-2 rounded-full bg-border selected:bg-primary"
            />
          ))}
        </CarouselPagination>
        <CarouselNext accessibilityLabel="Next photo" class="disabled:opacity-40">
          <Text>›</Text>
        </CarouselNext>
      </View>
    </Carousel>
  );
}

mount(App);
```

`Carousel`とそのパーツは、Rust の`nsh-base`クレートである[`nsh/base`](../modules/nsh-base.md)から提供されます。表示中のスライドはアプリの`index`です。スワイプ、コントロール、キーのいずれかが次のスライドを`onChange`で通知し、カルーセルはアプリが返す`index`までスクロールします。スワイプで止まったスライドは、アプリが`onChange`に応答するまで表示され続けます。アプリがそれを`index`として返せばそのまま残り、アプリが元の`index`を保持した場合は、コンテンツがアニメーション付きでアプリのスライドに戻ります。`index`がなければ、カルーセルは`defaultIndex`をもとに自身で値を保持します。Rust では、`carousel()`、`carousel_content()`、`carousel_item()`、`carousel_previous()`、`carousel_next()`、`carousel_pagination()`、`carousel_pagination_item()`がパーツを作り、プロパティごとのセッター(`.index(..)`)、イベントごとのリスナー(`.on_change(..)`)、型付きのスタイルメソッド、そしてコンテンツ用の`.child(..)`を備えています。

## Props

<a id="carousel-1"></a>

### Carousel

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | なし | 表示中のスライド。0から始まり、スライド数の範囲に収められます。アプリが所有し、変更は`onChange`で通知されます。新しい`index`を渡すと、そこへアニメーション付きでスクロールします。 |
| `defaultIndex` | `.default_index(..)` | `number` | `0` | `index`が未設定のときに、最初に表示するスライド。 |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | スライドが並ぶ方向。カルーセルの作成時に読み取られます。縦方向のカルーセルでは、矢印キーは上と下です。 |
| `looping` | `.looping(..)` | `boolean` | `false` | スライドが循環します。最後の次は最初、最初の前は最後になり、スワイプ、前へ、次へ、キー、アプリの`index`のいずれでも途切れなくつながります([ループ](#looping))。カルーセルの作成時に読み取られます。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがカルーセルを呼ぶ名前。リージョンとして、スライドが何であるかを示します(`"Featured products"`)。 |
| `children` | `.child(..)` | `JSX.Element` | なし | `CarouselContent`、コントロール、およびアプリがそれらの周りに配置するもの。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | カルーセルのレイアウト。コンテンツとコントロールの配置先。 |

### CarouselContent

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `children` | `.child(..)` | `JSX.Element` | なし | `CarouselItem`。それぞれがコンテンツの子になります。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | ビューポートのサイズと、その中でスライドが作るトラック。スライド間の`gap`や、表示中のスライドの隣のスライドをのぞかせるパディングを指定できます。 |

### CarouselItem

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがスライドを呼ぶ名前。グループとして、他のスライドの中での位置と表示内容を示します(`"2 of 5: Ocean view"`)。 |
| `children` | `.child(..)` | `JSX.Element` | なし | スライドの内容。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 軸方向のサイズ(1ビューに1スライドなら`w-full`、3スライドなら`basis-1/3`)と見た目。ループするカルーセルでは、その平行移動(translation)はカルーセルが管理します。内側のビューに`transform`を指定してください。 |

### CarouselPrevious, CarouselNext

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | コントロールの名前。子要素にそれを表すテキストがない場合(矢印アイコンなど)に使います。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アプリのアイコンまたはラベル。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 見た目と配置。コンテンツの横に置くか、その端に重ねて`absolute`で配置します。 |
| `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle` | `.active(\|s\| ..)`、`.hover(..)`、`.focus(..)`、`.disabled_style(..)` | `StyleProp<ViewStyle>` | なし | 押下中、ホバー中、フォーカス中、端で無効のときのスタイル。`<state>:`クラスとして指定します。 |

### CarouselPagination

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | スクリーンリーダーがページネーション項目のグループを呼ぶ名前(`"Choose a slide"`)。 |
| `indicatorClass` | `.indicator_class(..)` | `string` | なし | インジケーターの Tailwind クラス。インジケーターは、表示中のスライドの項目に重なるビューです(ドットの背後のピル形や下線など)。見た目と、行を横切る方向の配置(`inset-y-0`、`bottom-0 h-0.5`)を指定します。行に沿った方向では、その項目の幅に広がり、次の項目へネイティブにバネのように移動します。 |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | `indicatorClass`に重ねて適用される、インジケーターのスタイル。どちらも指定しない場合、ページネーションにインジケーターは表示されません。 |
| `children` | `.child(..)` | `JSX.Element` | なし | `CarouselPaginationItem`と、アプリがそれらの間に配置するもの。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 行のレイアウト(`flex-row gap-2`)。 |

### CarouselPaginationItem

| プロパティ | Rust | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `index` | `.index(..)` | `number` | 必須 | この項目が示すスライド。0から始まります。最後のスライドを超えるインデックスは無効になります。 |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | なし | 対応するスライドが表示されている間のスタイル。`selected:`クラスとして指定します。 |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | なし | どのスライドを示すか(`"Slide 3"`)。子要素にそれを表すテキストがない場合(ドットなど)に使います。 |
| `children` | `.child(..)` | `JSX.Element` | なし | アプリのドット、サムネイル、または番号。 |
| `class`、`style` | スタイルメソッド | `string`、`StyleProp<ViewStyle>` | なし | 見た目。その内側の`group-selected:`クラスは、`group`のもとでこの項目に追従します。 |

## Events

| イベント | Rust | 説明 |
|---|---|---|
| `onChange` (`Carousel`) | `.on_change(\|index: &u32\| ..)` | ユーザーが別のスライドに移動しました。スワイプ、ホイール、タッチパッドの操作がそのスライドで静止したか、コントロール、ページネーション項目、キーがそれを要求したときです。`{ index }`がそのスライドです。アプリから新しい`index`を渡しても、何も通知されません。 |
| `onDragStart` (`Carousel`) | `.on_drag_start(\|\| ..)` | ユーザーがコンテンツのドラッグを開始しました(指、タッチパッド)。 |
| `onDragEnd` (`Carousel`) | `.on_drag_end(\|\| ..)` | ユーザーがドラッグしたコンテンツが静止しました。 |
| `onFocus` (`Carousel`) | `.on_focus(\|\| ..)` | キーボードフォーカスがカルーセルに入りました。対象は、カルーセル自身のビュー、前へ・次へのコントロール、ページネーション項目、スライド内のフォーカス可能なビューです。これらの間の移動では何も通知されません。 |
| `onBlur` (`Carousel`) | `.on_blur(\|\| ..)` | キーボードフォーカスがカルーセルから離れました。対象は、カルーセル自身のビュー、コントロール、ページネーション項目、スライドの内容です。 |

## Parts

| パーツ | 内側 | スタイル指定 | 状態 |
|---|---|---|---|
| カルーセル | | `Carousel`の`class`、`style` | `focus:` |
| コンテンツ | カルーセル | `CarouselContent`の`class`、`style` | |
| スライド | コンテンツ | `CarouselItem`の`class`、`style` | |
| 前へ、次へ | カルーセル | それぞれの`class`、`style` | `disabled:`、`active:`、`hover:`、`focus:` |
| ページネーション | カルーセル | `CarouselPagination`の`class`、`style` | |
| インジケーター | ページネーション | `indicatorClass`、`indicatorStyle` | |
| ページネーション項目 | ページネーション | その`class`、`style` | `selected:`、`disabled:`、`active:`、`hover:`、`focus:` |

## Several slides per view

スライドの幅は、そのスライド自身のクラスで決まるため、カードの列のようにビューポート内に複数のスライドを並べられます。各スライドは、その開始位置がスナップポイントになります。コンテンツは、最初のスライドが静止する位置に、そのスライドが来る形で静止するため、最初のスライドの前に置いたパディングは、各スライドの前にも保たれます。範囲の終端では、その位置に届かないスライドは最後のスライドとともに静止し、次へはそこで止まります。`index`は最初の位置にあるスライドを指します。最後のスライドとともに静止するスライドは同じ位置を示し、そこでのスワイプは、それらのうち最初のスライドを通知します。

```tsx
<Carousel accessibilityLabel="Collections">
  <CarouselContent class="w-full gap-4 px-4">
    <Each of={collections()}>
      {(c) => (
        <CarouselItem class="basis-1/3">
          <Card collection={c()} />
        </CarouselItem>
      )}
    </Each>
  </CarouselContent>
</Carousel>
```

スマートフォンの幅での`basis-1/2`や`basis-[85%]`では、次のカードが少しのぞきます。縦方向のカルーセル(`axis="vertical"`)では、スライドのサイズは高さで決まります。

## Looping

`looping`を指定すると、スライドは途切れなく循環します。スワイプ、次へやキーによるステップ、アプリの`index`による設定のいずれでも、最後の次は最初になり、間のスライドを巻き戻すことはありません。コンテンツは、スライドの前後にそれぞれ1周分の余白を確保し、各スライドを、ビューの中央に最も近い位置に描画します。アニメーションは、スクロールとともに、プラットフォーム自身のフレームでこれを実行します。各スライドは1つだけ存在するため、スクリーンリーダーとページネーションからも1つに見えます。

ループが途切れないのは、スライドがビューポートに加えてさらに1スライド分以上を満たす場合です(全幅のスライドなら3枚、幅が3分の1のスライドなら5枚)。それより少ない場合でも、前へ、次へ、キーは循環しますが、間のスライドを横切って戻るようにスクロールします。

## Slides that move on by themselves

自動で進むバナーはアプリ側の実装です。`index`を設定するタイマーを用意します。カルーセルはユーザーが操作中であることを通知するので、[WAI-ARIA カルーセルパターン](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)が求めるとおり、タイマーはそのあいだ待機します。ドラッグの前後には`onDragStart`と`onDragEnd`、キーボードフォーカスがカルーセル内(カルーセル自身、コントロール、ページネーション、スライドの内容)にあるあいだは`onFocus`と`onBlur`、さらにその周囲のビュー上のポインターを使います。モーション低減が有効な場合はオフにし、停止するためのボタン(ローテーションコントロール)をユーザーに用意してください。

```tsx
import { cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { Button, Carousel, CarouselContent } from "nsh/base";

const index = signal(0);
const playing = signal(true);
const held = signal(0);
const hold = (on: boolean) => held.set(held() + (on ? 1 : -1));

effect(() => {
  index();
  if (!playing() || held() > 0 || reduceMotion()) return;
  const timer = setInterval(() => index.set((index() + 1) % SLIDES.length), 4000);
  cleanup(() => clearInterval(timer));
});

<View onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)}>
  <Carousel
    looping
    index={index()}
    onChange={({ index: next }) => index.set(next)}
    onDragStart={() => hold(true)}
    onDragEnd={() => hold(false)}
    onFocus={() => hold(true)}
    onBlur={() => hold(false)}
    accessibilityLabel="Highlights"
  >
    <CarouselContent class="w-full">{/* the slides */}</CarouselContent>
    <Button onPress={() => playing.set(!playing())} class="self-start px-3 py-1">
      <Text>{playing() ? "Pause slides" : "Play slides"}</Text>
    </Button>
  </Carousel>
</View>
```

エフェクト内で`index()`を読み取ると、ユーザーによる変更を含め、変更のたびにインターバルが最初からやり直されます。`looping`を指定すると、最後のスライドから最初のスライドへは、継ぎ目を越えて前方へ移動します。

## Accessibility

- カルーセルは`accessibilityLabel`で名前が付けられたリージョンです。各スライドは、それぞれ固有の名前(他のスライドの中での位置と表示内容)を持つグループです。
- 前へと次へはボタンで、カルーセルがループしない限り、端では無効になります。各ページネーション項目もボタンで、対応するスライドが表示されている間は選択状態になります。
- すべてのラベルはアプリが用意し、アプリの言語で表示されます。
- ループするカルーセルのスライドは、どこに描画されていても、それぞれ1つだけ存在します。

ラベル、ロール、通知に関する一般的な内容は、[アクセシビリティ](../docs/accessibility.md)を参照してください。

## Keyboard

macOS と Web では、Tab が押下を受け付けるビューに到達するため、カルーセルはキーボードフォーカスの停止位置となり、そのコントロールやページネーション項目も同様です。いずれかにフォーカスがあるあいだは、次のキーが使えます。

| キー | 動作 |
|---|---|
| 左、右(縦方向では上、下) | 前または次のスライドに移動します。ループ時は端を越えて循環します。 |
| Home、End | 最初または最後のスライドに移動します。 |
| Space、Return | フォーカス中のコントロールまたはページネーション項目を押します。 |

右から左へのレイアウトでは、横方向のカルーセルのスライドは右から並ぶため、左キーで次のスライドへ、右キーで前のスライドへ移動します。縦方向のカルーセルでは、上と下のままです。フォーカス中に無効になったコントロール(最後のスライドでの次へ)は、フォーカスをカルーセルに渡すので、キー操作はそこで引き続き機能します。スライド内にあるアプリのフォーカス可能なビューは、それぞれ独自のキー操作を保ちます。たとえば入力欄の矢印キーはキャレットを動かします。

## Motion

- スワイプ、ホイール、タッチパッドの操作は、ポインターと同じフレームでスライドを動かします。スクロールするのはプラットフォームです。
- 離すと、プラットフォームのスナップによって、コンテンツは最も近いスライドへ滑らかに移動します。1回のフリングで動くのは1スライドです。
- 前へ、次へ、ページネーション項目、キー、アプリの`index`は、コンテンツをそのスライドまでアニメーション付きでスクロールします。モーション低減が有効な場合は、即座に移動します。
- ページネーションのインジケーターは、表示中のスライドの項目へバネのように移動します。モーション低減が有効な場合は、即座に移動します。
- `looping`は、最後のスライドから最初のスライドへ、継ぎ目を越えて1ステップ前方へ進みます。コンテンツが静止すると、アニメーションなしで1周分戻りますが、画面上の見た目は変わりません。

## Platform notes

- iOS、Android、Mac Catalyst: 指でスライドをスワイプし、タップでコントロールを押します。
- デスクトップ(macOS、Windows、Linux、GPUI)と Web: ホイールとタッチパッドでスライドをスクロールし、クリックでコントロールを押します。コンテンツ上のマウスドラッグはアプリ側の扱いで、これらのプラットフォームのすべてのスクロールビューと同様です。
- どのプラットフォームでも、アプリがスタイルしたものが描画されます。スライド、コントロール、ページネーション、そのインジケーターです。
