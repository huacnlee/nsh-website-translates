---
title: "文字選取"
description: "可選取的檢視:在檢視內的多段文字之間、跨檢視、Text 元素與 TextView 之間共用同一個選取範圍,就像網頁中的文字選取方式一樣。"
order: 130
group: primitives
demo: el-text-selection
source_hash: d63cc3aa84e5eab5
---

# 文字選取

含有 `selectable` 的 [`View`](./view.md) 會讓其中的文字一起被選取，就像網頁一樣：一次選取可以從某段文字的某處延伸到另一段文字的某處，依閱讀順序橫跨 view、[`Text`](./text.md) 元素與 [`TextView`](./text-view.md)。將聊天記錄設為可選取後，選取範圍可以從一則訊息開始，到下一則訊息結束；Copy 會將選取的文字放入剪貼簿，並排的文字以 Tab 連接，其餘則以換行連接。Rust 以 `view().selectable(true)` 設定，TSX 以 `<View selectable>` 設定；單一文字是否可被選取，則取決於它的 `userSelect` 樣式。

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

此 view 的版面與外觀由應用程式的樣式決定，內容則是它的子元素。選取本身由平台負責：view 本身不會為此繪製任何內容。

<a id="a-chat-transcript"></a>

## 聊天記錄

同一個可選取 view 中的聊天記錄會如同一個頁面般被選取：拖曳可以從某則回覆開始，到另一則回覆結束，Copy 會取得其間每則訊息的文字。

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

| 平台 | 選取的方式 |
|---|---|
| macOS, Windows, Linux, GPUI | 在文字上拖曳；按兩下選取一個字詞，按三下選取一個段落，在這之後繼續拖曳則會以字詞或段落為單位延伸。Shift+click 可延伸選取範圍。Ctrl / Cmd+A 選取 view 中的全部內容，Ctrl / Cmd+C 複製，按 Escape 或在範圍外按一下則會清除選取。 |
| iOS, Android | 長按會選取一個字詞；可用平台提供的控制點延伸選取範圍，其編輯選單提供 Copy 與 Select All。 |
| Web | 使用瀏覽器本身的選取機制，包括其手勢、選單與快速鍵。 |

<a id="what-it-selects"></a>

## 可選取的範圍

- **不參與選取的文字**：含有 `userSelect: "none"` 的文字（Rust 中為 `.select_none()`，class 為 `select-none`；例如標籤、按鈕的文字）會被選取及其手勢略過。
- **巢狀 view**：可選取的 view 若位於另一個可選取的 view 內，就屬於外層 view 的一部分，因此一次選取可涵蓋兩者。
- **TextView**：含有 `selectable` 的 [`TextView`](./text-view.md) 會自成一個選取單位：其中的段落、清單項目、儲存格與程式碼區塊會一起被選取。若位於可選取的 view 內，則會併入外層的選取。
- **單一文字**：含有 `userSelect: "text"` 但不在任何可選取 view 內的文字會獨立選取，詳見 [Text](./text.md#props)。
- **外觀**：採用平台的醒目提示，顯示在每段文字的 `selectionColor`（`selection:text-*`）中。
- **清單**：在虛擬化的 [List](./list.md) 中，選取範圍涵蓋目前已掛載的列；被回收而離開畫面的列則不再屬於選取範圍。

<a id="related"></a>

## 相關內容

- [View](./view.md)：`selectable` prop。
- [Text](./text.md)：`userSelect`、`selectionColor` 以及單一文字的選取。
- [TextView](./text-view.md)：區塊會一起被選取的文件。
