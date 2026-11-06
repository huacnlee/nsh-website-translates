---
title: "文字選取"
description: "可選取檢視：在檢視內的多段文字之間、跨檢視、跨 Text 元素與 TextView 進行單一連續選取，就像網頁上的文字選取一樣。"
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---


# 文字選取

設有 `selectable` 的 [`View`](./view.md) 會讓其中的文字像網頁一樣一同被選取:一次選取可以從某段文字中的一處延伸到另一段文字中的一處,按閱讀順序跨越 View、[`Text`](./text.md) 元素和 [`TextView`](./text-view.md)。把聊天記錄設為可選取後,選取範圍可以從一則訊息開始,到下一則訊息結束;「複製」會把選取的文字放到剪貼簿,並排的文字以 Tab 分隔,其餘的以換行分隔。Rust 以 `view().selectable(true)` 設定,TSX 以 `<View selectable>` 設定;單一文字是否可被選取,則由其 `userSelect` 樣式決定。

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn release_notes(notes: &'static str) -> impl IntoElement {
    view()
        .selectable(true)
        .gap_3()
        .p_4()
        .child(text("Release notes").font_weight(FontWeight::SEMIBOLD))
        .child(text_view().markdown(notes))
        .child(
            view()
                .flex_row()
                .gap_2()
                .child(text("Updated").select_none().text_color(rgb(0x737373)))
                .child(text("October 21")),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { TextView } from "nsh/base";

function ReleaseNotes(props: { notes: string }) {
  return (
    <View selectable class="gap-3 p-4">
      <Text class="font-semibold">Release notes</Text>
      <TextView markdown={props.notes} />
      <View class="flex-row gap-2">
        <Text style={{ userSelect: "none" }} class="text-neutral-500">Updated</Text>
        <Text>October 21</Text>
      </View>
    </View>
  );
}
```

此 View 的版面和外觀由應用程式的樣式決定,內容則是它的子元素。選取本身由平台處理:此 View 不會為選取繪製任何自有的內容。

<a id="a-chat-transcript"></a>

## 聊天記錄

放在同一個可選取 View 中的聊天記錄會如同一頁般被選取:拖曳可以從一則回覆開始,到另一則回覆結束,「複製」會取得兩者之間每則訊息的文字。

```rust tabs
use nsh_base::text_view;
use nsh_core::prelude::*;

fn transcript(replies: Signal<Vec<SharedString>>) -> impl IntoElement {
    scroll().flex_1().child(
        view().selectable(true).p_4().gap_4().child(each(
            replies,
            |reply: &SharedString| reply.clone(),
            |reply, _index| text_view().markdown(move || reply.get()),
        )),
    )
}
```

```tsx tabs
import { Scroll, View } from "nsh";
import { TextView } from "nsh/base";

<Scroll class="flex-1">
  <View selectable class="gap-4 p-4">
    <Each of={replies}>{(reply) => <TextView markdown={reply()} />}</Each>
  </View>
</Scroll>
```

<a id="how-a-selection-is-made"></a>

## 選取的方式

| Platform | 選取的方式 |
|---|---|
| macOS, Windows, Linux, GPUI | 在文字上拖曳;雙擊選取一個字詞,三擊選取一個段落,之後繼續拖曳則按字詞或段落延伸。Shift+click 可延伸選取範圍。Ctrl / Cmd+A 選取 View 中的全部內容,Ctrl / Cmd+C 複製,按 Escape 或在範圍外點按可清除選取。 |
| iOS, Android | 長按選取一個字詞;可用平台的控點延伸選取範圍,其編輯選單提供「複製」和「全選」。 |
| Web | 使用瀏覽器本身的選取功能,包括其手勢、選單和快速鍵。 |

<a id="what-it-selects"></a>

## 可選取的內容

- **不參與選取的文字**:設有 `userSelect: "none"`(Rust 中為 `.select_none()`,class 為 `select-none`;例如標籤、按鈕的標題)的文字會被選取及其手勢略過。
- **巢狀 View**:位於另一個可選取 View 內的可選取 View 屬於外層 View 的一部分,因此一次選取可涵蓋兩者。
- **TextView**:設有 `selectable` 的 [`TextView`](./text-view.md) 本身會作為一個整體被選取:其段落、列表項目、儲存格和程式碼區塊會一同被選取。在可選取的 View 內,它會加入外層的選取。
- **單一文字**:不在任何可選取 View 內、設有 `userSelect: "text"` 的文字會自行選取,詳見 [Text](./text.md#props)。
- **外觀**:由平台在每段文字的 `selectionColor`(`selection:text-*`)中繪製highlight。
- **列表**:在虛擬化的 [List](./list.md) 中,選取範圍涵蓋已掛載的列;被回收而移出視圖的列會離開選取範圍。

<a id="related"></a>

## 相關內容

- [View](./view.md):`selectable` prop。
- [Text](./text.md):`userSelect`、`selectionColor`,以及單一文字的選取。
- [TextView](./text-view.md):其區塊會作為一個整體被選取的文件。
