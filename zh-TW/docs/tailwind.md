---
title: "Tailwind"
description: "在 TSX 中以原生方式解析 Tailwind CSS 類別,以及在 Rust 中對應的具型別寫法:class 與 classList、用於按下狀態的 variants、深色模式與斷點、nsh.json 中的主題,以及建置時的類別檢查。"
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---

# Tailwind

NSH 的樣式遵循 Tailwind CSS 4。在 Rust 中,Tailwind 的 utility 是具型別的樣式方法,名稱與值都相同(`.p_4()` 對應 `p-4`、`.rounded_2xl()` 對應 `rounded-2xl`、`ZINC.shade(900)` 對應 `zinc-900`);在 TSX 中,每個元素都能在 `class` 中接受 class 本身,並依 Tailwind 4 的預設主題在原生端解析。以下每個範例先列出具型別的方法,再列出 class:

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

具型別的方法會轉換成與 class 編譯結果相同的樣式規則,無需解析字串。至於 class,不會產生任何 CSS,也不會在 JavaScript 中執行任何程式:字串會傳給核心,核心對每個不同的 class 字串只解析一次(並快取),將其轉成樣式規則後套用。依賴狀態的變體(按下、深色模式、視窗寬度)會在狀態改變時由核心重新套用,而按下與焦點狀態由原生端追蹤,因此 `active:` 回饋(Rust 中為 `.active(..)`)不需要往返你的程式碼。

class 與 [`style` prop](./styling.md) 會產生相同的原生樣式,且可以合併使用;本頁說明 class 特有的內容及其具型別的對應方法。[Tailwind 參考文件](../modules/tailwind-reference.md)列出所有支援的 utility。

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

- **`class`** 是由 class 組成的字串。它可以是動態的:``class={`h-6 rounded bg-${color()}-500`}`` 可以運作,因為 class 是在執行時解析的。
- **`classList`** 將 class 對應到條件:當其值為真值時,該 class 就會套用。它在 `class` 之後套用。
- **在 Rust 中**,接受閉包或 signal 的方法會隨之更新(`.bg(move || ..)`),`.style_when(condition, |s| ..)` 在條件成立期間套用樣式,而 `.when(condition, |v| ..)` 則在元素建立時一次決定。

衝突的解決方式:

1. **較後面的 class 優先**於同一字串中較前面的 class:`"p-2 p-4"` 等同於 `p-4`。不需要 `tailwind-merge`:元件可以附加呼叫端傳入的 `class`。在 Rust 中,較後面的方法同樣優先。
2. **變體 class 在一般 class 之後套用**,依 Tailwind 的變體順序排列(`hover:` 在 `active:` 之前,`max-*:` 由寬到窄,斷點由小到大,`dark:` 在最後),與其在字串中的位置無關。與 Tailwind 相同,class 的最高層變體先決定,接著是次高層,變體多一個的 class 排在較後:`dark:hover:bg-a dark:bg-b` 表示在深色模式下被懸停時為 `bg-a`,而 `max-md:p-2 max-lg:p-4` 表示在 `md` 以下為 `p-2`。如同 CSS,`odd:bg-a last:bg-b` 會讓奇數的最後一列變成 `bg-a`,因為 Tailwind 將 `odd` 排在 `last` 之後。
3. **`style` 優先於 class。** 樣式鍵(style key)就是其名稱對應的 CSS 屬性,也就是 class 所設定的那個屬性,因此只會取代該屬性:`style={{ paddingLeft: 8 }}` 取代 `pl-4`,並保留 `pr-4`。
4. `!` 會讓 class 變成 important:`!p-0`。

Rust 元件(`nsh/base` 的元件以及應用程式自身 crate 的元件)也能從 TSX 接受 `class` 與 `classList`;你的 class 會合併在元件自身樣式之後,並在優先順序相同時勝出。

<a id="variants"></a>

## 變體

| 變體 | 套用時機 | Rust |
|---|---|---|
| `active:` | view 被按下 | `.active(\|s\| ..)` |
| `hover:` | 指標位於 view 上方(iPad 與 Mac 的指標) | `.hover(\|s\| ..)` |
| `focus:`、`focus-visible:` | 輸入元件取得焦點 | `.focus(\|s\| ..)` |
| `focus-within:` | view 或其子孫元素取得焦點(`Overlay` 的內容是其所在 view 的子孫元素) | `.focus_within(..)` |
| `disabled:`、`enabled:` | 元素的 `disabled` prop 為 true / false | `.disabled_style(\|s\| ..)` |
| `selected:` | 元素被選取(`Button` 的 `selected`、`accessibilityState.selected`) | `.selected_style(..)` |
| `checked:` | 元素已勾選(`accessibilityState.checked` 為 `true`;`"mixed"` 表示未勾選) | `.checked_style(..)` |
| `indeterminate:` | 元素處於不確定狀態(`accessibilityState.checked` 為 `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | 元素已展開(`accessibilityState.expanded` 為 `true`):`Popover` 或 `Menu` 的觸發元件,在其彈出視窗開啟期間 | `.expanded_style(..)` |
| `aria-pressed:` | 元素是已開啟的切換按鈕(`accessibilityState.pressed` 為 `true`;`"mixed"` 表示未按下)。不是 `active:`,即進行中的按壓 | `.aria_pressed(..)`、`.pressed_style(..)` |
| `aria-busy:`、`aria-checked:`、`aria-selected:` | `accessibilityState.busy`、`checked`(`true`,而非 `"mixed"`)或 `selected` 為 `true`,與 Tailwind 的 `aria-*` 變體相同:排在偽類別之後,依名稱順序排列 | |
| `data-<name>:` | 元素具有 `data-*` 屬性 `name`,與 Tailwind 的布林 `data-*` 變體(`&[data-range-start]`)相同:用於元件的某個部件在狀態之外呈現的內容,例如日曆中範圍起點的日期(`data-range-start:`)。排在 `aria-*` 變體之後,依名稱順序排列 | `Interactive::project_data(name, ..)` 在元件的部件上設定一個 |
| `group-active:`、`group-hover:`、`group-focus:`、`group-focus-within:`、`group-disabled:`、`group-selected:`、`group-checked:`、`group-indeterminate:`、`group-aria-expanded:`、`group-aria-pressed:`、`group-aria-busy:`、`group-aria-checked:`、`group-aria-selected:`、`group-data-<name>:` | 最近的具有 `group` class 的祖先元素處於該狀態,或具有該 `data-*` 屬性 | 在祖先元素上使用 `.group()`;在內部使用 `.group_active(..)`、`.group_hover(..)`、`.group_focus_within(..)` |
| `group-active/name:` ... | 同上,對象為標記了 `group/name` 的祖先元素 | `.group_named("name")`;`.group_active_named("name", ..)`、... |
| `first:`、`last:`、`odd:`、`even:`、`only:` | 元素本身在其同層元素中的位置。若要依列的位置為該列的標籤上色,請將 `last:text-*` 放在該列上:標籤會繼承它 | 在 Rust 中依列的索引使用一般程式碼(`at.is_first()`、`at.is_last()`、`at.index() % 2`) |
| `placeholder:` | 為輸入元件的預留文字設定樣式(`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | 為輸入元件或可選取文字,以及位於該元素內的這些元件的選取反白上色(`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | 系統外觀為深色 | `AdaptiveColor`,或 `.dark(\|s\| ..)` |
| `sm:`、`md:`、`lg:`、`xl:`、`2xl:` | 視窗寬度至少為 640、768、1024、1280、1536 point | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`、`max-md:`、... | 視窗窄於該斷點 | 相同,搭配 `<` |
| `min-[600px]:`、`max-[600px]:` | 任意斷點 | 相同 |
| `portrait:`、`landscape:` | 視窗的方向 | `window().width > window().height` |
| `ios:`、`android:`、`web:` | 平台 | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`、`ltr:` | [版面方向](./layout.md#right-to-left) | view 上的 `.direction(LayoutDirection::..)` |
| `motion-safe:`、`motion-reduce:` | 使用者的減少動態效果設定 | `reduce_motion()` |

變體可以組合:`dark:active:bg-zinc-700`、`md:landscape:flex-row`。在 Rust 中,`.active(..)` 樣式中的 `AdaptiveColor` 就是 `dark:active:`。

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

任何元素上的 `disabled`(Rust 中為 `.disabled(..)`)會套用 `disabled:` class(`.disabled_style(..)`),並從已掛載的內容中移除其按壓處理常式,因此也不會顯示按壓回饋:

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

斷點是與視窗(NSH 繪製所在的表面)比較,而不是與裝置比較:在 iPad 分割檢視或可調整大小的視窗中,斷點會跟隨視窗的寬度,與 `window()` 相同。

<a id="what-differs-from-tailwind-on-the-web"></a>

## 與網頁版 Tailwind 的差異

- **單位是 point。** `p-4`(`.p_4()`)為 16 point(1 個間距級距 = 4pt,1rem = 16pt)。`px` 中的任意值也以 point 為單位:`p-[13px]`(`.p(px(13.0))`)為 13pt。
- **`flex` 是橫向排列**,與 CSS 相同:`class="flex"` 會將子元素橫向排列,除非有方向 class 另行指定(可在字串中的任何位置:`flex-col flex` 是縱向)。樣式的 `display: "flex"` 與 Rust 的 `.flex()` 同樣是橫向排列,而未設定 display 的 view 則維持 NSH 預設的縱向。`block` 與 `flow-root` 使用區塊排版,`inline` 與 `inline-block` 亦然,與瀏覽器在 flex 或 grid 父層中排版的方式相同。在 Rust 中,由 `.flex_row()` 與 `.flex_col()` 設定方向。
- **view 上的文字 class 會被繼承。** view 上的 `text-*`、`font-*`、`leading-*`、`tracking-*` 與其他文字 utility(Rust 中為 `.text_color(..)`、`.font_weight(..)`、...)會傳遞給其內部的文字與輸入元素,與 CSS 繼承相同:`<View class="text-white">` 會讓其標籤變成白色。
- **每個 view 都是獨立的盒子。** `overflow-x-hidden` 與 `overflow-y-hidden` 會裁切兩個軸向,與 `overflow-hidden` 相同(捲動由 [scroll](../elements/scroll.md) 元素負責);`invisible` 會隱藏該 view 及其中所有內容;`mix-blend-*` 會將 view 與其後方繪製的所有內容混合;`block` 盒子會讓自己的邊距與其子元素的邊距彼此分開;`absolute` view 會放置在其最近的已定位祖先元素中,與 CSS 相同;`fixed` 會將 view 排版在其根 view 中(其他元素則以 `absolute` 方式放置)。
- **文字會保留其空白字元。** 字串中的空格與換行會照原樣繪製,並由 `whitespace-*` 設定換行方式;JSX 編譯器會壓縮字面 JSX 文字中的空白,與 JSX 的行為相同。
- **轉場動畫以屬性群組為單位**:`transition` 會對顏色、不透明度、陰影與變形做動畫,`transition-all` 還包含圓角半徑與邊框寬度;濾鏡、背景濾鏡、漸層與版面則會立即採用新值。
- **`focus-visible:` 即 `focus:`**:只要元素取得焦點就會套用。
- **狀態背景會顯示在漸層之上。** 在 CSS 中,漸層會覆蓋 `background-color`,因此 `bg-linear-*` 表面上的 `active:bg-*` 永遠不會被看到;在 NSH 中,來自 `active:`、`hover:`、`focus:` 或 `group-*:` 的背景色會在該狀態成立期間取代漸層(除非該狀態自己設定了漸層,例如 `active:from-*`)。`activeStyle` 與其他狀態樣式,以及有動畫的背景色也是如此。
- **文字與觸控設定是樣式鍵**:`line-clamp-*` 設定 `numberOfLines`,`text-ellipsis` 與 `text-clip` 設定 `textOverflow`,`truncate` 則同時設定兩者,`select-*` 設定 `userSelect`,`pointer-events-*` 設定 `pointerEvents`,因此它們可用於狀態變體,並且與所有 class 一樣會輸給內嵌的 `style`;`caret-*`、`placeholder:text-*` 與 `selection:bg-*` 以同樣方式設定 `caretColor`、`placeholderColor` 與 `selectionColor` 樣式。在 Rust 中,這些是 `Styled` 方法(`.number_of_lines(..)`、`.truncate()`、`.text_overflow(..)`、`.select_text()`、`.pointer_events(..)`、...)。`whitespace-nowrap` 以 class 的形式讓文字維持在單行。`object-*` 會設定圖片與影片的 `objectFit` 與 `objectPosition` 樣式,樣式的鍵會像其他鍵一樣取代它們。
- **支援的範圍**:Tailwind 4 中具有原生意義的 utility 與變體。`peer-*` 變體、偽元素(`before:`、`after:`)與任意屬性(`[mask-type:luminance]`)會被回報為未知的 class,NSH 沒有原生意義的 utility 也一樣,因此 class 的意義絕不會與在瀏覽器中不同。渲染提示(`antialiased`、`will-change-transform`、`appearance-none`、`box-border`、...)會被接受,但不會產生任何效果。

其他一切都如 Tailwind 4 的文件所述運作:色彩調色盤、不透明度修飾符(`bg-black/40`)、任意值(`bg-[#34c759]`、`w-[72px]`、`grid-cols-[1fr_2fr]`;在 `p`、`px`、`py`、`pt`、`pr`、`pb`、`pl` 與 `m` utility 上還可使用環境變數 `pt-[env(safe-area-inset-top)]`、`pb-[calc(env(keyboard-inset-height)+49px)]`,請見[安全區域](../elements/safe-area.md)與[鍵盤](../elements/keyboard.md))、分數(`w-1/2`、`translate-x-1/2`)、陰影與光環、漸層(`bg-linear-to-r`、`bg-radial`、`bg-conic` 搭配 `from-` / `via-` / `to-`)、濾鏡、`backdrop-blur-*`、`mix-blend-*`、變形、`transition-*` 與 `duration-*`、`animate-spin` / `ping` / `pulse` / `bounce`,以及 grid,在 Rust 中各有對應的具型別方法。[濾鏡與混合](./styling.md#filters-and-blending)的平台限制同樣適用於 class。

<a id="theme"></a>

## 主題

class 會依 Tailwind 4 的預設主題解析。請在 `nsh.json` 的 `"tailwind"` 下擴充主題;你的項目會加入預設值中(或取代同名的預設值):

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

使用此主題時,`bg-brand-500`、`text-brand`(`DEFAULT` 色階)、`border-ink`、`rounded-card`、`font-display` 與 `tablet:flex-row` 都是有效的 class。

| 鍵 | 值 | 產生 |
|---|---|---|
| `colors` | CSS 顏色,或色階物件(`"DEFAULT"` 代表不含色階的名稱) | `bg-*`、`text-*`、`border-*`、`from-*`、`ring-*`、... |
| `spacing` | 每個間距級距的 point 數(預設為 4) | `p-*`、`m-*`、`gap-*`、`w-*`、... |
| `rem` | 任意值中每個 `rem` 的 point 數(預設為 16) | |
| `breakpoints` | Point | `name:` 變體 |
| `container` | Point | `max-w-*` 尺寸 |
| `fontSize` | Point,或 `[size, lineHeight]`,其行高為字級的倍數 | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | 字型家族名稱(系統字型家族或[匯入字型](./fonts.md)的名稱) | `font-*` |
| `tracking` | Em | `tracking-*` |
| `leading` | 字級的倍數 | `leading-*` |
| `radius` | Point | `rounded-*` |
| `shadow`、`insetShadow`、`dropShadow` | CSS `box-shadow` | `shadow-*`、`inset-shadow-*`、`drop-shadow-*` |
| `blur` | Point | `blur-*`、`backdrop-blur-*` |
| `perspective` | Point | `perspective-*` |
| `aspect` | 比例(`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

未知的鍵與無效的值會造成建置錯誤(`nsh.json: tailwind: unknown theme key 'colours'`)。主題會編譯進套件中,並在第一個影格之前套用。

Tailwind 主題決定你的 class 的外觀。具型別的方法維持 Tailwind 的預設級距,因此 Rust 元件在每個應用程式中看起來都相同,並從其主題的設計 token 取得應用程式的外觀,即 `nsh.json` 中的 `"theme"`([Rust](./rust.md#theme))。
<a id="theme-tokens"></a>

## 主題 token

應用程式的主題（`nsh.json` 中的 `"theme"`）保存其設計 token：shadcn/ui 的顏色（`background`、`foreground`、`primary`、`muted-foreground`、`border`、`ring`、`chart-1`、`sidebar` 等）、其 `radius`、字型 `font-sans` 與 `font-mono`，以及應用程式新增的任何 token。類別以 Tailwind 命名 CSS `@theme` 變數的方式來指稱這些 token；Rust 元件透過 `nsh_base` 中的 `theme()` 讀取，TSX 則透過 `nsh` 中的 `token()` 讀取，因此 TSX 畫面與 Rust 元件遵循同一套主題：

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

token 的名稱就是其 CSS 變數名稱去掉 `--`，與主題檔的寫法相同：`muted-foreground`、`radius`、`chart-1`。在 Rust 中，shadcn 的 token 是 `theme()` 的方法（`primary()`、`muted_foreground()`、`radius()`、`font_mono()`），而每個 token 都是 `theme().color("up")`、`theme().number("radius-card")` 或 `theme().font("font-display")`。

| 形式 | 接受 | 範例 |
|---|---|---|
| 任何顏色 utility 中的顏色名稱 | 主題顏色，也可加上不透明度 | `bg-primary`、`text-muted-foreground/70`、`bg-up/30`、`border-t-border`、`ring-ring`、`from-accent`、`placeholder:text-muted-foreground` |
| `(--name)`，Tailwind 4 的變數簡寫 | 主題顏色或數值 | `bg-(--primary)`、`rounded-(--radius)`、`p-(--gap-card)` |
| `(color:--name)`、`(length:--name)`、`(number:--name)`、`(family-name:--name)` | 同上，用於 utility 可接受多種型別的場合，需明確指定型別 | `text-(color:--up)`、`text-(length:--text-title)`、`font-(family-name:--font-mono)` |
| `font-sans`、`font-mono` | 主題的字型（當主題有設定時） | `font-mono` |

- **自訂 token。** 主題檔中的每個名稱都是 token，就像 CSS `@theme` 的每個變數一樣：`"up": "#16a34a"` 會產生 `bg-up`、`text-up` 與 `bg-up/30`；`"radius-card": "14px"` 會產生 `rounded-(--radius-card)`；`"font-display": "Pacifico"` 會產生 `font-(family-name:--font-display)`。長度的單位為 point；`(number:--name)` 傳入的是純數字。
- **字型。** `font-sans` 是應用程式的字型：每個未自行設定字型家族的文字都以它繪製，就如同網頁使用 Tailwind 的 `--font-sans` 一般。`font-mono` 是 `font-mono` 以及 `TextView` 中程式碼所使用的字型。若未設定，兩者皆使用系統字型。
- **兩種外觀。** token 同時具有主題的淺色與深色值：`bg-primary`、`theme().primary` 與 `token("primary")` 會自動隨外觀切換，無需 `dark:` 類別。若主題只在其中一種外觀設定了某個顏色，則兩種外觀都使用該顏色。
- **你的 Tailwind 顏色優先。** `"tailwind"` 的 `colors` 或 Tailwind 色盤中的名稱即代表該顏色，因此只有在 Tailwind 主題沒有 `primary` 這個顏色時，`bg-primary` 才是主題 token。
- **主題可在應用程式執行時變更。** 當嵌入原生應用程式中的應用程式取得該應用程式的主題，以及每當主題變更時，指稱 token 的類別、讀取 `theme()` 的 Rust 綁定，以及讀取 `token()` 的 TSX 程式碼都會更新，其中類別與綁定是以原生方式更新。嵌入端應用程式的主題所沒有的 token，會保留應用程式自身 `"theme"` 的值（若也沒有，則使用預設主題的值）。僅需加入自家品牌的宿主可提供主題覆寫，也就是以相同的檔案格式列出其品牌所更動的 token（[iOS](./ios.md#theme-overrides)、[Android](./android.md#theme-overrides)，桌面平台上為 `AppView::set_theme_overrides`）。
- **與其他類別一樣會被檢查。** 若名稱既不是預設主題的 token，也不是應用程式 `"theme"` 的 token，建置時會視為未知類別（`unknown class 'bg-chart-up'`）。若要使用僅由嵌入端應用程式提供的 token，也請在應用程式的 `"theme"` 中為它提供一個值：應用程式獨立執行時會顯示該值。

指稱 token 的類別與其他類別一樣，每個主題只解析一次：繪製它們的成本與使用色盤顏色相同。

<a id="445-in-tsx"></a>

### TSX 中的 `token()`

來自 `nsh` 的 `token(name)` 會回傳 token 在目前外觀下的值：顏色為 `#rrggbbaa`，長度為以 point 為單位的數字，字型則為其家族名稱。它具有響應性，因此在元件、memo 或 effect 中讀取它的程式碼，會在主題或外觀變更時重新執行，適合用於無法使用類別的地方，例如 canvas 或圖表：

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

名稱具有型別：NSH 會根據主題將應用程式的 token 寫入 `.nsh/types/nsh/tokens.d.ts`，因此只要主題中有 `"up"`，`token("up")` 就是 `string`；主題中沒有的名稱則會產生型別錯誤。

<a id="the-class-check"></a>

## 類別檢查

`nsh build`、`nsh dev`、`nsh run` 與 `nsh test` 會使用與執行階段相同的解析器和主題，檢查 JSX 中的靜態類別名稱（`class` 中的字串字面值與 `classList` 的鍵），並對不存在的類別發出警告：

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

警告不會使建置失敗。在執行階段才組出的類別（``bg-${color()}-500``）會在執行階段第一次遇到時檢查，每個未知類別只會記錄一次（`unknown classes: ...`）。具型別的方法則由 Rust 編譯器檢查。

<a id="classes-or-styles"></a>

## 類別還是樣式？

兩者都以原生方式解析，成本大致相同。類別較簡短，且無需撰寫程式碼就能使用變體（按下狀態、深色模式、斷點）。行內樣式則接受在 JavaScript 中計算出的值，也接受[原生動畫值](./animation.md)（`opacity: fade`、`translate: [x, 0]`）。大多數 TSX 應用程式以類別處理靜態外觀，並以 `style` 處理需要計算或帶有動畫的部分。Rust 元件兩者都使用具型別的方法，並以 `.bind_opacity(..)`、`.bind_translate_x(..)` 及其他綁定來綁定動畫值。

<a id="related"></a>

## 相關內容

- [樣式](./styling.md)：style 屬性、具型別的方法，以及效果在各平台上的限制。
- [Tailwind 參考](../modules/tailwind-reference.md)：所有 utility 與變體。
- [版面配置](./layout.md)：flexbox 與 grid，同樣可用類別來使用。
