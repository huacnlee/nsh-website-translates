---
title: "Tailwind"
description: "在 TSX 中以原生方式解析的 Tailwind CSS class,以及它們在 Rust 中具類型的對應寫法:class 與 classList、用於按下狀態的變體、深色模式與斷點、nsh.json 中的主題,以及建置時的 class 檢查。"
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---


# Tailwind

NSH 的樣式遵循 Tailwind CSS 4。在 Rust 中，Tailwind 的 utility 是名稱和值都相同的具型別樣式方法（`.p_4()` 即 `p-4`，`.rounded_2xl()` 即 `rounded-2xl`，`ZINC.shade(900)` 即 `zinc-900`）；在 TSX 中，每個元素都可在 `class` 中直接接受 class，並以原生方式按 Tailwind 4 的預設主題解析。以下每個範例先列出具型別方法，再列出 class：

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

具型別方法會降階為與 class 編譯結果相同的樣式規則，無需解析任何字串。至於 class，不會產生任何 CSS，也不會在 JavaScript 中執行任何東西：字串會傳給核心，核心對每個不同的 class 字串只解析一次（並加以快取），將其轉換為樣式規則後套用。取決於狀態的變體（按下、深色模式、視窗寬度）會在該狀態改變時由核心重新套用，而按下和聚焦狀態由原生層追蹤，因此 `active:` 回饋（Rust 中為 `.active(..)`）無需往返你的程式碼。

class 與 [`style` prop](./styling.md) 產生相同的原生樣式，並可組合使用；本頁介紹 class 及其具型別對應方法的專有內容。[Tailwind 參考](../modules/tailwind-reference.md)列出所有支援的 utility。

<a id="class-and-classlist"></a>

## class 與 classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** 是由 class 組成的字串，可以是動態的：``class={`h-6 rounded bg-${color()}-500`}`` 可行，因為 class 在執行時解析。
- **`classList`** 將 class 對應到條件：其值為真時，該 class 便會套用。它在 `class` 之後套用。
- **在 Rust 中**，傳入閉包或 signal 的方法會跟隨它（`.bg(move || ..)`），`.style_when(condition, |s| ..)` 在條件成立期間套用樣式，而 `.when(condition, |v| ..)` 則在元素建立時決定一次。

衝突的解決方式：

1. **較後的 class 優先**於同一字串中較前的 class：`"p-2 p-4"` 即 `p-4`。無需 `tailwind-merge`：元件可以附加呼叫者傳入的 `class`。Rust 中較後的方法同樣優先。
2. **變體 class 在一般 class 之後套用**，按 Tailwind 的變體順序排列（`hover:` 在 `active:` 之前，`max-*:` 由最寬者開始，斷點由小到大，`dark:` 最後），與其在字串中的位置無關。如同 Tailwind，class 的最高層變體先決定，其次是次高層變體，多一個變體的 class 排在較後：`dark:hover:bg-a dark:bg-b` 在深色模式下懸停時為 `bg-a`，而 `max-md:p-2 max-lg:p-4` 在 `md` 以下為 `p-2`。如同 CSS，`odd:bg-a last:bg-b` 會令奇數的最後一行得到 `bg-a`，因為 Tailwind 將 `odd` 排在 `last` 之後。
3. **`style` 優先於 class。** style 鍵就是同名的 CSS 屬性，即 class 所設定的那個，因此只會取代該屬性：`style={{ paddingLeft: 8 }}` 取代 `pl-4` 並保留 `pr-4`。
4. `!` 令 class 變為重要：`!p-0`。

Rust 元件（`nsh/base` 的元件及應用程式自身 crate 的元件）也可從 TSX 接受 `class` 和 `classList`；你的 class 會合併在元件自身樣式之後，在同等優先級時勝出。

<a id="variants"></a>

## 變體

| 變體 | 套用時機 | Rust |
|---|---|---|
| `active:` | 視圖被按下 | `.active(\|s\| ..)` |
| `hover:` | 指標位於視圖上方（iPad 和 Mac 的指標） | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | 輸入框獲得焦點 | `.focus(\|s\| ..)` |
| `focus-within:` | 視圖或其後代獲得焦點（`Overlay` 的內容是其所在視圖的後代） | `.focus_within(..)` |
| `disabled:`, `enabled:` | 元素的 `disabled` prop 為 true / false | `.disabled_style(\|s\| ..)` |
| `selected:` | 元素已選取（`Button` 的 `selected`、`accessibilityState.selected`） | `.selected_style(..)` |
| `checked:` | 元素已勾選（`accessibilityState.checked` 為 `true`；`"mixed"` 不算已勾選） | `.checked_style(..)` |
| `indeterminate:` | 元素處於不確定狀態（`accessibilityState.checked` 為 `"mixed"`） | `.indeterminate_style(..)` |
| `aria-expanded:` | 元素已展開（`accessibilityState.expanded` 為 `true`）：`Popover` 或 `Menu` 的觸發元素在其彈出層開啟期間 | `.expanded_style(..)` |
| `aria-pressed:` | 元素是處於開啟狀態的切換按鈕（`accessibilityState.pressed` 為 `true`；`"mixed"` 不算已按下）。不同於 `active:`，後者指進行中的按下動作 | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`、`checked`（`true`，而非 `"mixed"`）或 `selected` 為 `true`，如同 Tailwind 的 `aria-*` 變體：排在偽類之後，按名稱順序排列 | |
| `data-<name>:` | 元素具有 `data-*` 屬性 `name`，如同 Tailwind 的布林 `data-*` 變體（`&[data-range-start]`）：用於元件的部件在狀態以外所呈現的內容，例如日曆中位於範圍起點的日子（`data-range-start:`）。排在 `aria-*` 變體之後，按名稱順序排列 | `Interactive::project_data(name, ..)` 在元件的部件上設定一個 |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | 最近的、帶有 `group` class 的祖先處於該狀態，或具有該 `data-*` 屬性 | 祖先上用 `.group()`；內部用 `.group_active(..)`、`.group_hover(..)`、`.group_focus_within(..)` |
| `group-active/name:` ... | 同上，適用於標記為 `group/name` 的祖先 | `.group_named("name")`；`.group_active_named("name", ..)`、... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | 元素在同層元素中的位置。若要按列的位置為該列的標籤上色，請將 `last:text-*` 放在該列上：標籤會繼承它 | 直接用 Rust 依列的索引判斷（`at.is_first()`、`at.is_last()`、`at.index() % 2`） |
| `placeholder:` | 為輸入框的預留位置文字設定樣式（`placeholder:text-zinc-400`） | `.placeholder_color(..)` |
| `selection:` | 為輸入框或可選取文字的選取反白上色，也包括元素內部的此類元件（`selection:bg-violet-200`） | `.selection_color(..)` |
| `dark:` | 系統外觀為深色 | 一個 `AdaptiveColor`，或 `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | 視窗寬度至少為 640、768、1024、1280、1536 點 | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | 視窗窄於該斷點 | 相同，配合 `<` |
| `min-[600px]:`, `max-[600px]:` | 任意斷點 | 相同 |
| `portrait:`, `landscape:` | 視窗的方向 | `window().width > window().height` |
| `ios:`, `android:`, `web:` | 平台 | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | [版面方向](./layout.md#right-to-left) | 視圖上的 `.direction(LayoutDirection::..)` |
| `motion-safe:`, `motion-reduce:` | 使用者的減少動態效果設定 | `reduce_motion()` |

變體可以組合：`dark:active:bg-zinc-700`、`md:landscape:flex-row`。在 Rust 中，`.active(..)` 樣式中的 `AdaptiveColor` 即 `dark:active:`。

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

任何元素上的 `disabled`（Rust 中為 `.disabled(..)`）會套用 `disabled:` class（`.disabled_style(..)`），並從已掛載的內容中移除其按下處理器，因此也不會顯示按下回饋：

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

斷點是與視窗（NSH 渲染所在的介面）比較，而非與裝置比較：在 iPad 分割視圖或可調整大小的視窗中，斷點會跟隨視窗寬度，與 `window()` 的行為相同。

<a id="what-differs-from-tailwind-on-the-web"></a>

## 與網頁版 Tailwind 的差異

- **單位是點（point）。** `p-4`（`.p_4()`）為 16 點（1 個間距級 = 4pt，1rem = 16pt）。`px` 中的任意值同樣以點計：`p-[13px]`（`.p(px(13.0))`）為 13pt。
- **`flex` 是橫向排列**，與 CSS 相同：`class="flex"` 會將子元素橫向排列，除非有方向 class 另作指定（在字串中任何位置：`flex-col flex` 為縱向）。style 的 `display: "flex"` 與 Rust 的 `.flex()` 同樣是橫向排列，而未設定 display 的視圖則維持 NSH 預設的縱向排列。`block` 和 `flow-root` 使用區塊版面，`inline` 和 `inline-block` 也一樣，這與瀏覽器在 flex 或 grid 父元素中排列它們的方式相同。在 Rust 中，由 `.flex_row()` 和 `.flex_col()` 設定方向。
- **視圖上的文字 class 會被繼承。** 視圖上的 `text-*`、`font-*`、`leading-*`、`tracking-*` 及其他文字 utility（Rust 中為 `.text_color(..)`、`.font_weight(..)`、...）會傳遞給其內部的文字和輸入元素，與 CSS 繼承的方式相同：`<View class="text-white">` 會令其標籤變成白色。
- **每個視圖都是獨立的盒子。** `overflow-x-hidden` 和 `overflow-y-hidden` 會裁切兩個軸向，與 `overflow-hidden` 相同（捲動由 [scroll](../elements/scroll.md) 元素負責）；`invisible` 會隱藏視圖及其內所有內容；`mix-blend-*` 會將視圖與其後方繪製的所有內容混合；`block` 盒子會將自身的外邊距與其子元素的外邊距分隔開；`absolute` 視圖會相對於其最近的定位祖先放置，與 CSS 相同；`fixed` 會在視圖的根視圖中排版（其他元素則按 `absolute` 放置）。
- **文字會保留空白。** 字串中的空格和換行會按原樣繪製，並由 `whitespace-*` 設定換行方式；JSX 編譯器會如 JSX 一樣，合併字面 JSX 文字中的空白。
- **過渡動畫以屬性群組為單位**：`transition` 會為顏色、不透明度、陰影和變形製作動畫，`transition-all` 還包括圓角半徑和邊框寬度；濾鏡、背景濾鏡、漸層和版面則會立即採用新值。
- **`focus-visible:` 即 `focus:`**：只要元素獲得焦點便會套用。
- **狀態背景會顯示在漸層之上。** 在 CSS 中，漸層會覆蓋 `background-color`，因此 `bg-linear-*` 表面上的 `active:bg-*` 永遠不會被看到；在 NSH 中，來自 `active:`、`hover:`、`focus:` 或 `group-*:` 的背景色會在該狀態成立期間取代漸層（除非該狀態自行設定了漸層，例如 `active:from-*`）。`activeStyle` 和其他狀態樣式，以及動畫背景色，也是如此。
- **文字和觸控設定是 style 鍵**：`line-clamp-*` 設定 `numberOfLines`，`text-ellipsis` 和 `text-clip` 設定 `textOverflow`，`truncate` 則兩者皆設定，`select-*` 設定 `userSelect`，`pointer-events-*` 設定 `pointerEvents`，因此它們可用於狀態變體中，並如所有 class 一樣，優先級低於行內的 `style`；`caret-*`、`placeholder:text-*` 和 `selection:bg-*` 以同樣方式設定 `caretColor`、`placeholderColor` 和 `selectionColor` 樣式。在 Rust 中，這些是 `Styled` 方法（`.number_of_lines(..)`、`.truncate()`、`.text_overflow(..)`、`.select_text()`、`.pointer_events(..)`、...）。`whitespace-nowrap` 作為 class 時會令文字保持在單行。`object-*` 設定圖片和影片的 `objectFit` 和 `objectPosition` 樣式，style 的鍵可以像取代其他樣式一樣取代它們。
- **支援的範圍**：Tailwind 4 中具有原生意義的 utility 和變體。`peer-*` 變體、偽元素（`before:`、`after:`）和任意屬性（`[mask-type:luminance]`）會被報告為未知 class，NSH 沒有原生意義的每個 utility 亦然，因此 class 的含義絕不會與在瀏覽器中不同。渲染提示（`antialiased`、`will-change-transform`、`appearance-none`、`box-border`、...）會被接受，但不會產生任何效果。

其餘一切均按 Tailwind 4 的文件所述運作：色彩調色板、不透明度修飾符（`bg-black/40`）、任意值（`bg-[#34c759]`、`w-[72px]`、`grid-cols-[1fr_2fr]`；在 `p`、`px`、`py`、`pt`、`pr`、`pb`、`pl` 和 `m` utility 上，還可使用環境變數 `pt-[env(safe-area-inset-top)]`、`pb-[calc(env(keyboard-inset-height)+49px)]`，參見[安全區域](../elements/safe-area.md)和[鍵盤](../elements/keyboard.md)）、分數（`w-1/2`、`translate-x-1/2`）、陰影和 ring、漸層（`bg-linear-to-r`、`bg-radial`、`bg-conic` 配合 `from-` / `via-` / `to-`）、濾鏡、`backdrop-blur-*`、`mix-blend-*`、變形、`transition-*` 和 `duration-*`、`animate-spin` / `ping` / `pulse` / `bounce`，以及 grid，在 Rust 中各有對應的具型別方法。[濾鏡與混合](./styling.md#filters-and-blending)的平台限制同樣適用於 class。

<a id="theme"></a>

## 主題

class 按 Tailwind 4 的預設主題解析。可在 `nsh.json` 的 `"tailwind"` 下擴充主題；你的項目會加入預設值中（或取代同名的預設值）：

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

使用此主題後，`bg-brand-500`、`text-brand`（`DEFAULT` 色階）、`border-ink`、`rounded-card`、`font-display` 和 `tablet:flex-row` 都是有效的 class。

| 鍵 | 值 | 產生 |
|---|---|---|
| `colors` | 一個 CSS 顏色，或色階物件（`"DEFAULT"` 用於不帶後綴的名稱） | `bg-*`, `text-*`, `border-*`, `from-*`, `ring-*`, ... |
| `spacing` | 每個間距級的點數（預設為 4） | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | 任意值中每個 `rem` 的點數（預設為 16） | |
| `breakpoints` | 點數 | `name:` 變體 |
| `container` | 點數 | `max-w-*` 尺寸 |
| `fontSize` | 點數，或 `[size, lineHeight]`，其行高為字級大小的倍數 | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | 字型家族名稱（系統字型家族或[匯入字型](./fonts.md)的名稱） | `font-*` |
| `tracking` | em | `tracking-*` |
| `leading` | 字型大小的倍數 | `leading-*` |
| `radius` | 點數 | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | 一個 CSS `box-shadow` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | 點數 | `blur-*`, `backdrop-blur-*` |
| `perspective` | 點數 | `perspective-*` |
| `aspect` | 比例（`1.5`） | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

未知的鍵和無效的值會造成建置錯誤（`nsh.json: tailwind: unknown theme key 'colours'`）。主題會編譯進 bundle，並在第一個影格之前套用。

Tailwind 主題決定你的 class 的外觀。具型別方法沿用 Tailwind 的預設級距，因此 Rust 元件在每個應用程式中看起來都一樣，並從其主題的設計 token（即 `nsh.json` 中的 `"theme"`）取得應用程式的外觀（[Rust](./rust.md#theme)）。
<a id="theme-tokens"></a>

## 主題 token

應用程式的主題（`"theme"`，位於 `nsh.json`）存放其設計 token：shadcn/ui 的顏色（`background`、`foreground`、`primary`、`muted-foreground`、`border`、`ring`、`chart-1`、`sidebar`⋯⋯）、其 `radius`、字體 `font-sans` 和 `font-mono`，以及應用程式自行加入的任何 token。Class 以 Tailwind 的方式命名這些 token，一如 CSS `@theme` 的變數；Rust 組件以 `nsh_base` 的 `theme()` 讀取，TSX 則以 `nsh` 的 `token()` 讀取，因此 TSX 畫面與 Rust 組件遵循同一個主題：

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

Token 的名稱是其 CSS 變數去掉 `--` 後的名稱，與主題檔案的寫法相同：`muted-foreground`、`radius`、`chart-1`。在 Rust 中，shadcn 的 token 是 `theme()` 的方法（`primary()`、`muted_foreground()`、`radius()`、`font_mono()`），而每個 token 都是 `theme().color("up")`、`theme().number("radius-card")` 或 `theme().font("font-display")`。

| 形式 | 接受 | 範例 |
|---|---|---|
| 任何顏色 utility 中的顏色名稱 | 主題顏色，亦可附帶不透明度 | `bg-primary`、`text-muted-foreground/70`、`bg-up/30`、`border-t-border`、`ring-ring`、`from-accent`、`placeholder:text-muted-foreground` |
| `(--name)`，Tailwind 4 的變數簡寫 | 主題顏色或數字 | `bg-(--primary)`、`rounded-(--radius)`、`p-(--gap-card)` |
| `(color:--name)`、`(length:--name)`、`(number:--name)`、`(family-name:--name)` | 同上，用於 utility 可接受多種類型時，需指明類型 | `text-(color:--up)`、`text-(length:--text-title)`、`font-(family-name:--font-mono)` |
| `font-sans`、`font-mono` | 主題的字體（如主題有設定） | `font-mono` |

- **自訂 token。** 主題檔案中的每個名稱都是 token，一如 CSS `@theme` 的每個變數：`"up": "#16a34a"` 會產生 `bg-up`、`text-up` 和 `bg-up/30`；`"radius-card": "14px"` 會產生 `rounded-(--radius-card)`；`"font-display": "Pacifico"` 會產生 `font-(family-name:--font-display)`。長度以 point 為單位；`(number:--name)` 傳入純數字。
- **字體。** `font-sans` 是應用程式的字體：所有沒有自行設定字體家族的文字都以它繪製，就像網頁使用 Tailwind 的 `--font-sans` 一樣。`font-mono` 是 `font-mono` 以及 `TextView` 中程式碼所用的字體。未設定時，兩者都使用系統字體。
- **兩種外觀。** Token 具有主題的淺色與深色數值：`bg-primary`、`theme().primary` 和 `token("primary")` 會自動隨外觀切換，無需 `dark:` class。如果主題只在其中一種外觀中設定某個顏色，則兩種外觀都使用該顏色。
- **你的 Tailwind 顏色優先。** `"tailwind"` `colors` 或 Tailwind 色板中的名稱即該顏色，因此只有在 Tailwind 主題沒有顏色 `primary` 時，`bg-primary` 才是主題 token。
- **主題可在應用程式執行期間改變。** 當嵌入原生應用程式的應用程式取得該應用程式的主題時，以及每當主題改變時，引用 token 的 class、讀取 `theme()` 的 Rust 綁定，以及讀取 `token()` 的 TSX 程式碼都會更新，其中 class 與綁定以原生方式更新。嵌入應用程式的主題所沒有的 token，會保留應用程式自身 `"theme"` 的數值（其次才是預設主題的數值）。如果宿主只是加入其品牌，則提供主題覆寫，即以相同檔案格式寫出其品牌所更改的 token（[iOS](./ios.md#theme-overrides)、[Android](./android.md#theme-overrides)，桌面平台則為 `AppView::set_theme_overrides`）。
- **與其他 class 一樣會被檢查。** 如果某個名稱既不是預設主題的 token，也不是應用程式 `"theme"` 的 token，建置時會被視為未知 class（`unknown class 'bg-chart-up'`）。若要使用只有嵌入應用程式才提供的 token，請同時在應用程式的 `"theme"` 中為它設定數值：應用程式獨立執行時會顯示該數值。

引用 token 的 class 與其他 class 一樣，每個主題只解析一次：繪製它們的成本與使用色板顏色相同。

<a id="445-in-tsx"></a>

### TSX 中的 `token()`

`token(name)`（來自 `nsh`）是 token 在當前外觀下的數值：顏色為 `#rrggbbaa`，長度為 point 數字，字體為其家族名稱。它具有響應性，因此在組件、memo 或 effect 中讀取它的程式碼，會在主題或外觀改變時重新執行，適用於 class 無法套用的地方，例如 canvas 或圖表：

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

名稱帶有型別：NSH 會根據主題把應用程式的 token 寫入 `.nsh/types/nsh/tokens.d.ts`，因此只要 `"up"` 在主題中，`token("up")` 就是 `string`；主題中沒有的名稱則會產生型別錯誤。

<a id="the-class-check"></a>

## Class 檢查

`nsh build`、`nsh dev`、`nsh run` 和 `nsh test` 會檢查 JSX 中的靜態 class 名稱（`class` 中的字串字面值及 `classList` 的鍵），所用的解析器和主題與執行階段相同，並對不存在的 class 發出警告：

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

警告不會令建置失敗。於執行期間組合出來的 class（``bg-${color()}-500``）會在執行階段首次遇到時檢查，並為每個未知 class 記錄一次（`unknown classes: ...`）。有型別的方法則由 Rust 編譯器檢查。

<a id="classes-or-styles"></a>

## 使用 class 還是 style？

兩者都以原生方式解析，成本相約。Class 較簡短，並且無需撰寫程式碼即可使用變體（按下狀態、深色模式、斷點）。內聯 style 接受在 JavaScript 中計算出來的數值，也接受[原生動畫值](./animation.md)（`opacity: fade`、`translate: [x, 0]`）。大多數 TSX 應用程式以 class 處理靜態外觀，以 `style` 處理計算值或動畫。Rust 組件則兩者都使用有型別的方法，並以 `.bind_opacity(..)`、`.bind_translate_x(..)` 及其他綁定來綁定動畫值。

<a id="related"></a>

## 相關內容

- [樣式](./styling.md)：style prop、有型別的方法，以及效果的平台限制。
- [Tailwind 參考](../modules/tailwind-reference.md)：所有 utility 與變體。
- [版面配置](./layout.md)：flexbox 與 grid，同樣可用作 class。
