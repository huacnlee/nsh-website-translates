---
title: "Tailwind 參考"
description: "NSH 原生支援解析的所有 Tailwind 工具類別(utility)與變體(variant)、任意值語法,以及如何在 nsh.json 中擴充主題。"
order: 17
source_hash: 11bee6a70fb79c0f
---


# Tailwind 參考

每個元素都可以在其 `class` prop 中接受 Tailwind CSS 類別(條件類別則放在 `classList`)。NSH 會在 Rust 中根據 Tailwind 4 的預設主題解析這些類別:JS 只傳遞字串,每個不同的字串只會解析一次並加以快取;當外觀、視窗大小或按壓狀態改變時,`dark:` 或 `active:` 等變體會以原生方式重新求值,完全不會執行任何 JS。

每個工具類別所設定的內容,與 Tailwind CSS 4 為它產生的完全一致,意義亦與瀏覽器中相同。本頁列出所支援的項目。入門介紹請參閱 [Tailwind](../docs/tailwind.md);工具類別所設定的樣式鍵,請參閱 [樣式參考](./style-reference.md)。

Rust 元件不接受 class 字串:它們使用 `Styled`(`nsh_core::prelude`)的具型別方法為元素設定樣式,方法名稱取自這些工具類別,解析出的值亦相同,包括 Tailwind 的預設級距(`px-4` 即 `.px_4()`,`rounded-2xl` 即 `.rounded_2xl()`,`shadow-md` 即 `.shadow_md()`,`bg-linear-to-br` 即 `.bg_linear_to_br()`)。顏色是值:可以是主題顏色,或以 `nsh_core::element::palette` 表示的 Tailwind 色板(`ZINC.shade(800)` 即 `zinc-800`)。變體是接受樣式閉包的方法:`.active(|s| …)`、`.hover(…)`、`.focus(…)`、`.disabled_style(…)`、`.dark(…)`、`.group_active(…)`,其餘則使用 `.style_when(condition, …)`。[樣式參考](./style-reference.md)列出了每個樣式鍵對應的方法。

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## 類別如何組合

- **後者優先。** 在同一變體層級的工具類別中,字串中位置較後者優先:`"p-4 p-2"` 即 `p-2`。元件可接受 `class` prop,並將其附加到自身的類別之後,無須使用 `tailwind-merge`。
- **變體在一般工具類別之後套用**,依 Tailwind 的變體順序:`group-*:`(先按其狀態,再按群組名稱)、`selection:`、`placeholder:`、位置(`first:` ……)、`checked:`、`indeterminate:`、`selected:`、`focus-within:`、`hover:`、`focus:`、`focus-visible:`、`active:`、`enabled:`、`disabled:`、`aria-busy:`、`aria-checked:`、`aria-expanded:`、`aria-pressed:`、`aria-selected:`、`data-*:`(按名稱)、動態效果、`max-*:` 斷點(由最寬者起),然後是由小至大的斷點、方向(orientation)、書寫方向(direction)、`dark:`,最後是平台。類別先以其最高的變體決定先後,其次再比較次高的變體,多一個變體者排在較後(`dark:hover:` 排在 `dark:` 之後),與 Tailwind 的排序方式一致。因此 `"active:bg-red-500 bg-blue-500"` 在按下時為紅色。
- **`style` 優先於類別。** 內聯的 `style` 會套用在已解析的類別之上。樣式鍵就是同名的 CSS 屬性,亦即工具類別所設定的那一個,所以它只會取代該屬性,不影響其他:`style={{ paddingLeft: 8 }}` 優先於 `pl-4`,並保留 `pr-4`。重要(important)工具類別(`!p-4` 或 `p-4!`)同樣優先於內聯樣式。
- **文字樣式會繼承。** view 上的文字工具類別(`text-white`、`font-bold`、`text-center` ……)會傳遞給其內的 `<Text>` 和 `<Input>` 元素,與 CSS 相同。
- **Display 依 CSS 而定。** `flex` 和 `inline-flex` 除非有方向工具類別另行指定(不論其在字串中的位置),否則會形成 row(`flex-col flex` 為 column)。樣式的 `display: "flex"` 同樣是 row;未設定 display 的 view 則保持 NSH 預設的 column。

<a id="units-and-the-theme"></a>

## 單位與主題

長度以點為單位(`1` = iOS 上的一點、Android 上的一 dp)。Tailwind 的 `1rem` 為 16 點,因此在相同密度下,主題與網頁一致:一個間距級距為 4 點(`p-4` = 16 點),`text-base` 為 16 點。

<a id="spacing-values"></a>

### 間距值

接受間距值的工具類別(padding、margin、gap、inset、寬度、高度、`basis`、`translate`、`leading`)可使用:

| 值 | 範例 | 結果 |
|---|---|---|
| 級距(可用四分之一級距) | `p-4`、`gap-1.5`、`m-0.25` | 級距 × 4 點 |
| `px` | `p-px`、`-mt-px` | 1 點 |
| `0` | `m-0` | 0 |
| 分數(inset、寬度、高度、`basis`、`translate`) | `w-1/2`、`left-1/3` | 父元素的百分比 |
| `full`(相同) | `w-full`、`inset-full` | 100% |
| `auto`(外距、inset、寬度、高度、basis) | `mx-auto`、`w-auto` | `"auto"` |
| 任意值 | `p-[13px]`、`w-[42%]`、`mt-[1.5rem]` | 指定的長度 |

外距、inset、`translate`、`rotate`、`skew`、`scale`、`z`、`hue-rotate`、`tracking`、`underline-offset`、`outline-offset`、網格線和漸變角度,可在前面加上 `-` 表示負值:`-mt-2`、`-translate-x-1/2`、`-rotate-6`。Tailwind 對其他項目(`-p-4`、`-gap-2`、`-w-4`)沒有負值形式,NSH 亦然。

<a id="colors"></a>

### 顏色

內建完整的 Tailwind 4 色板:`red`、`orange`、`amber`、`yellow`、`lime`、`green`、`emerald`、`teal`、`cyan`、`sky`、`blue`、`indigo`、`violet`、`purple`、`fuchsia`、`pink`、`rose`、`slate`、`gray`、`zinc`、`neutral`、`stone`、`mauve`、`olive`、`mist`、`taupe`,每種顏色都有 `50`、`100`–`900`、`950` 的色階;另有 `black`、`white` 和 `transparent`。自訂顏色來自 `nsh.json`(參閱[主題自訂](#theme-customization))。

每個顏色工具類別都接受:

| 形式 | 範例 |
|---|---|
| 主題顏色 | `bg-sky-500`、`text-brand` |
| 不透明度修飾符(百分比) | `bg-black/50`、`ring-black/5` |
| 任意不透明度 | `text-black/[0.35]` |
| 任意顏色 | `bg-[#0ea5e9]`、`border-[rgb(0_0_0_/_0.1)]`、`text-[oklch(70%_0.2_50)]` |
| 帶修飾符的任意顏色 | `bg-[rgb(0_0_255)]/25` |

`currentColor` 和 `inherit` 不是顏色值。與瀏覽器一樣,沒有顏色類別的邊框、outline 或 ring,會以元素的文字顏色繪製,即其自身設定的或繼承而來的顏色(`<View class="text-white"><View class="border ring-2" /></View>` 兩者都繪成白色);由 `style` prop 設定寬度但沒有指定顏色的邊框亦然。

<a id="arbitrary-values"></a>

## 任意值

方括號可傳入主題中沒有的值:`w-[37px]`、`grid-cols-[200px_1fr]`、`bg-[linear-gradient(45deg,red,blue)]`。

- `_` 代表空格(`grid-cols-[1fr_2fr]`);如需字面的底線,請寫 `\_`。
- 長度:純數字或 `px`(點)、`pt`(一點的 4/3,與 CSS 相同)、`rem`(16 點),以及在百分比有意義之處可用 `%`。
- 角度(`rotate-[...]`、`hue-rotate-[...]`、`bg-linear-[...]`):`deg`、`rad`、`grad`、`turn`。
- 時間(`duration-[...]`、`delay-[...]`):`ms` 或 `s`;純數字為毫秒。
- 型別提示可解決含糊的值:`text-[length:22px]` 為大小,`text-[color:#333]` 為顏色;`border-[length:3px]` 亦同。

不支援任意 CSS 屬性(`[mask-type:luminance]`)。

<a id="layout"></a>

## 佈局

| 類別 | 設定 |
|---|---|
| `flex`、`inline-flex` | `display: "flex"`,除非有方向工具類別,否則為 row |
| `grid`、`inline-grid` | `display: "grid"` |
| `block`、`flow-root` | 區塊佈局,或獨立的區塊格式化脈絡 |
| `box-border`、`box-content` | 尺寸包含邊框與內距,或僅計內容 |
| `w/h/size-min`、`w/h/size-max`、`w/h/size-fit` | Taffy 固有尺寸:`min-content`、`max-content`、`fit-content` |
| `inline`、`inline-block` | `display: "block"`:瀏覽器在 flex 或 grid 父元素中為它們計算的結果 |
| `hidden` | `display: "none"` |
| `relative`、`absolute` | `position` |
| `static` | `position: "static"`:位於文件流中,忽略其 inset;absolute 後代使用最近的已定位祖先 |
| `sticky` | `position: "sticky"`:位於文件流中,當其父元素在可視範圍內時,會黏附於 `top`(在水平捲動視圖中為 `left`),位置限於其周圍的捲動視圖之內 |
| `fixed` | `position: "fixed"`:元素在其根 view 的方框(視窗或其 modal)內佈局,位於該根 view 的子元素之上,周圍內容捲動時它仍留在原位 |
| `inset-<n>`、`inset-x-<n>`、`inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`、`right-<n>`、`bottom-<n>`、`left-<n>` | 對應的偏移量 |
| `start-<n>`、`end-<n>` | `start` / `end`(依方向而定) |
| `z-<n>`、`z-auto`、`z-[<n>]` | `zIndex`(`z-auto` 為 0) |
| `visible` | `visibility: "visible"` |
| `invisible`、`collapse` | `visibility: "hidden"`(保留其空間) |
| `overflow-hidden`、`overflow-clip`、`overflow-x-hidden`、`overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`、`aspect-video`、`aspect-<a>/<b>`、`aspect-[<a>/<b>]`、`aspect-auto` | `aspectRatio`(1、16/9、a/b、none) |

捲動是以元素而非類別實現:不支援 `overflow-auto` 和 `overflow-scroll`;請使用 [scroll](../elements/scroll.md)。

<a id="flexbox-and-grid"></a>

## Flexbox 與 grid

| 類別 | 設定 |
|---|---|
| `flex-row`、`flex-row-reverse`、`flex-col`、`flex-col-reverse` | `flexDirection` |
| `flex-wrap`、`flex-wrap-reverse`、`flex-nowrap` | `flexWrap` |
| `flex-1` | grow 1、shrink 1、basis 0 |
| `flex-<n>` | grow n、shrink 1、basis 0 |
| `flex-auto` | grow 1、shrink 1、basis auto |
| `flex-initial` | grow 0、shrink 1、basis auto |
| `flex-none` | grow 0、shrink 0、basis auto |
| `flex-[<grow>]`、`flex-[<grow>_<shrink>_<basis>]` | CSS 簡寫:`flex-[2]`、`flex-[3_0_50%]` |
| `grow`、`grow-<n>`、`grow-[<n>]` | `flexGrow`(單獨使用:1) |
| `shrink`、`shrink-<n>`、`shrink-[<n>]` | `flexShrink`(單獨使用:1) |
| `basis-<n>` | `flexBasis`(間距、分數、`full`、`auto`、任意值) |
| `justify-start`、`justify-end`、`justify-center`、`justify-between`、`justify-around`、`justify-evenly`、`justify-stretch`、`justify-normal` | `justifyContent` |
| `items-start`、`items-end`、`items-center`、`items-baseline`、`items-stretch` | `alignItems` |
| `self-auto`、`self-start`、`self-end`、`self-center`、`self-stretch`、`self-baseline` | `alignSelf` |
| `content-start`、`content-end`、`content-center`、`content-between`、`content-around`、`content-evenly`、`content-stretch`、`content-normal` | `alignContent` |
| `justify-items-start`、`-end`、`-center`、`-stretch`、`-normal` | `justifyItems` |
| `justify-self-auto`、`-start`、`-end`、`-center`、`-stretch` | `justifySelf` |
| `place-content-center`、`-start`、`-end`、`-between`、`-stretch` | `alignContent` 及 `justifyContent` |
| `place-items-center`、`-start`、`-end`、`-stretch` | `alignItems` 及 `justifyItems` |
| `place-self-auto`、`-center`、`-start`、`-end`、`-stretch` | `alignSelf` 及 `justifySelf` |
| `gap-<n>`、`gap-x-<n>`、`gap-y-<n>` | `gap`、`columnGap`、`rowGap` |
| `space-x-<n>`、`space-y-<n>`(及負值) | 除最後一個子元素外,每個子元素上的外距:結束側外距(`space-x`)或底部外距(`space-y`),位於子元素自身外距之下,與 Tailwind CSS 相同;會疊加於 `gap` 之上 |
| `space-x-reverse`、`space-y-reverse` | 改為設在起始側/頂部的外距(子元素以反向排列) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`、`grid-cols-none` | `gridTemplateColumns`(`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`、`grid-rows-[<tracks>]`、`grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`、`col-span-full`、`col-auto`、`col-<n>`、`col-[<value>]` | `gridColumn` |
| `col-start-<n>`、`col-end-<n>`(及 `-auto`) | `gridColumnStart`、`gridColumnEnd` |
| `row-span-<n>`、`row-span-full`、`row-auto`、`row-<n>`、`row-[<value>]` | `gridRow` |
| `row-start-<n>`、`row-end-<n>`(及 `-auto`) | `gridRowStart`、`gridRowEnd` |
| `grid-flow-row`、`grid-flow-col`、`grid-flow-dense`、`grid-flow-row-dense`、`grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`、`-min`、`-max`、`-fr`、`auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`、`-min`、`-max`、`-fr`、`auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## 間距

| 類別 | 設定 |
|---|---|
| `p-<n>`、`px-<n>`、`py-<n>` | `padding`、`paddingHorizontal`、`paddingVertical` |
| `pt-<n>`、`pr-<n>`、`pb-<n>`、`pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`、`pe-<n>` | `paddingStart`、`paddingEnd`(依方向而定) |
| `m-<n>`、`mx-<n>`、`my-<n>` | `margin`、`marginHorizontal`、`marginVertical` |
| `mt-<n>`、`mr-<n>`、`mb-<n>`、`ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`、`me-<n>` | `marginStart`、`marginEnd`(依方向而定) |

<a id="sizing"></a>

## 尺寸

| 類別 | 設定 |
|---|---|
| `w-<n>`、`h-<n>` | `width`、`height`(間距、分數、`full`、`auto`、任意值) |
| `size-<n>` | `width` 及 `height` |
| `min-w-<n>`、`max-w-<n>`、`min-h-<n>`、`max-h-<n>` | 對應的限制 |
| `w-screen`、`w-dvw`、`w-svw`、`w-lvw` | 視窗寬度(亦適用於 `min-w-` / `max-w-`) |
| `h-screen`、`h-dvh`、`h-svh`、`h-lvh` | 視窗高度(亦適用於 `min-h-` / `max-h-`) |
| `w-auto`、`h-auto` | `auto`(按內容決定大小) |
| `max-w-none`、`max-h-none` | 無限制 |
| `w-<container>`、`min-w-<container>`、`max-w-<container>` | 容器寬度(見下文) |

容器寬度(點):`3xs` 256、`2xs` 288、`xs` 320、`sm` 384、`md` 448、`lg` 512、`xl` 576、`2xl` 672、`3xl` 768、`4xl` 896、`5xl` 1024、`6xl` 1152、`7xl` 1280;`prose` 為元素字型的 `0` 寬度的 65 倍(即 CSS 的 `65ch`),與 Tailwind CSS 相同。

<a id="typography"></a>

## 字體排印

<a id="font"></a>

### 字型

| 類別 | 設定 |
|---|---|
| `font-sans` | 系統字型 |
| `font-serif`、`font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin`(100)、`font-extralight`(200)、`font-light`(300)、`font-normal`(400)、`font-medium`(500)、`font-semibold`(600)、`font-bold`(700)、`font-extrabold`(800)、`font-black`(900) | `fontWeight` |
| `font-[<weight>]`、`font-[<family>]` | 數字則為字重,否則為字型家族(family):`font-[650]`、`font-[Inter]` |
| `italic`、`not-italic` | `fontStyle` |
| `normal-nums`、`small-caps`、`oldstyle-nums`、`lining-nums`、`tabular-nums`、`proportional-nums` | `fontVariant`(可組合使用;`normal-nums` 會重設數字形式) |

<a id="size-color-and-line-height"></a>

### 大小、顏色與行高

`text-<size>` 會設定字體大小及 Tailwind 對應的行高;`leading-*` 類別會取代該行高,不論它在字串中的位置或其變體為何(`leading-tight md:text-lg` 會保留緊湊的行距):

| 類別 | 大小 | 行高 |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| 類別 | 設定 |
|---|---|
| `text-<size>/<leading>` | 大小與行高:`text-sm/6`(24 點)、`text-lg/tight` |
| `text-[<length>]` | `fontSize`:`text-[22px]`、`text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none`(1)、`leading-tight`(1.25)、`leading-snug`(1.375)、`leading-normal`(1.5)、`leading-relaxed`(1.625)、`leading-loose`(2) | `lineHeight`,為字體大小的倍數 |
| `leading-<n>`、`leading-[<length>]` | `lineHeight`,單位為點(`leading-6` = 24) |
| `leading-[<number>]` | `lineHeight`,為字體大小的倍數(`leading-[1.5]`),以該倍數繼承;`em` 和 `%` 會在繼承之前先按元素的字體大小計算出長度 |
| `tracking-tighter`(-0.05em)、`tracking-tight`(-0.025em)、`tracking-normal`(0)、`tracking-wide`(0.025em)、`tracking-wider`(0.05em)、`tracking-widest`(0.1em) | `letterSpacing`,相對於字體大小 |
| `tracking-[<value>]` | `letterSpacing`:`tracking-[0.2em]`、`tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### 對齊、大小寫與換行

| 類別 | 設定 |
|---|---|
| `text-left`、`text-center`、`text-right`、`text-justify` | `textAlign` |
| `text-start`、`text-end` | `textAlign: "start"` / `"end"`:行的起始或結束位置,依佈局方向而定 |
| `align-baseline`、`align-text-top`、`align-text-bottom`、`align-middle` | `verticalAlign`(文字內的 view 與圖片) |
| `uppercase`、`lowercase`、`capitalize`、`normal-case` | `textTransform` |
| `truncate` | 單行、結尾省略號、不換行、`overflow: hidden`(用於 view 時:其內的文字不換行) |
| `line-clamp-<n>`、`line-clamp-none` | `numberOfLines`(`none` 會顯示所有行) |
| `text-ellipsis`、`text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`、`text-nowrap` | 行不會換行;用於 view 時,作用於其內文字的各行(會繼承,與 CSS 的 `white-space` 相同) |
| `whitespace-normal`、`text-wrap`、`text-balance`、`text-pretty` | 行會換行(不進行平衡排版) |
| `select-text`、`select-none` | `userSelect: "text"` / `"none"`;用於 view 時,作用於其內未設定此項的文字 |
| `select-auto` | `userSelect: "auto"`:由其周圍的 view 決定,與 CSS 的 `user-select: auto` 相同(`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### 裝飾與陰影

| Class | 設定 |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | 取自主題的文字陰影（單一圖層：取主題中最闊的一層）；修飾符為各圖層的 alpha：`text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | 其顏色，使用該尺寸的 alpha |
| `text-shadow-none` | 移除 |

Tailwind 的文字陰影有多個圖層；原生端只繪製一個陰影，即最闊的一層。

<a id="inputs"></a>

### 輸入框

| Class | 設定 |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor`（輸入框或可選取文字的選取範圍高亮，以及元素內部同類項目的高亮） |
| `caret-<color>` | 游標顏色 |

<a id="backgrounds"></a>

## 背景

| Class | 設定 |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`：`bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | 朝向某一邊或某一角的線性漸變（`bg-gradient-to-*` 為 v3 的名稱） |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | 指定角度的線性漸變：`bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | 由中心向外的放射漸變 |
| `bg-conic`, `bg-conic-<angle>` | 錐形漸變，可選擇指定起始角度 |
| `from-<color>`, `via-<color>`, `to-<color>` | 漸變的色標（兩端預設為透明） |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | 色標位置：`via-40%`, `from-[15%]` |
| `bg-none` | 移除漸變 |

漸變工具類別以 Oklab 混合顏色，與 Tailwind CSS 的寫法一致（`in oklab`）；在任意位置（`bg-linear-[25deg]`、`bg-conic-[0.25turn]`）時則遵循 CSS 的預設行為：使用調色盤顏色時採用 Oklab，而當每個色標都是十六進位、`rgb()`、`hsl()` 或具名顏色時採用 sRGB。

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## 邊框

| Class | 設定 |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth`（單獨使用：1） |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e`（搭配 `-<n>` 或單獨使用） | 對應各邊的寬度 |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` 及各邊的顏色 |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`：無論寬度類別為何、次序如何，皆不顯示邊框（`md:border-solid` 可令邊框重新顯示） |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius`（單獨使用：`sm`） |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | 對應的各個圓角 |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | 起始／結束圓角（依佈局方向而定）：`borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth`（單獨使用：1），除非字串中任何位置出現樣式類別，否則為實線（`outline-dashed outline-2` 為虛線，`outline-none outline-2` 不繪製任何內容） |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`；單獨使用樣式時為 CSS 的 medium 寬度，即 3 點 |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

圓角尺寸（點）：`xs` 2、`sm` 4、`md` 6、`lg` 8、`xl` 12、`2xl` 16、`3xl` 24、`4xl` 32、`full` 9999。

<a id="rings"></a>

### 外環（Ring）

Ring 是帶有擴展半徑的 box shadow，繪製於邊框外側，不佔用空間。

| Class | 設定 |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | 該寬度的外環（單獨使用：1） |
| `ring-<color>` | 其顏色（預設為元素的文字顏色） |
| `ring-inset` | 將外環繪製於內側 |
| `ring-offset-<n>`, `ring-offset-<color>` | 元素與外環之間的間隙（預設為白色） |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | 內側外環 |

<a id="effects"></a>

## 效果

| Class | 設定 |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | 取自主題的 `boxShadow`；修飾符為各圖層的 alpha：`shadow-xl/20` |
| `shadow-[<box-shadow>]` | 任意陰影：`shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | 為陰影圖層重新著色，使用該尺寸的 alpha：`shadow-indigo-500/40` |
| `shadow-none` | 無陰影 |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | 內陰影 |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`：`opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`：`normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

陰影、ring 和 inset 陰影會如 CSS 一樣合併為單一 `boxShadow` 清單。陰影顏色會取代每個圖層的顏色（包括 alpha），與 Tailwind 的 `--tw-shadow-color` 相同：`shadow-md shadow-red-500` 是不透明的紅色陰影，`shadow-md/20 shadow-red-500` 則是 20% 不透明度的紅色陰影。

<a id="filters"></a>

## 濾鏡

| Class | 設定 |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | 百分比係數：`brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | 單獨使用：100% |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; `/<alpha>`（用於任一者） | 每個圖層一個 `drop-shadow()`，在其他濾鏡之後套用；指定顏色會取代各圖層的顏色，並使用該尺寸的 alpha；web、Linux、Windows 和 GPUI 會繪製每一個圖層，iOS、macOS 和 Android 則只繪製最闊的一層 |
| `drop-shadow-none` | 移除 |
| `filter-none` | 移除所有濾鏡 |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | 模糊檢視後方的內容 |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | 背景濾鏡 |
| `backdrop-filter-none` | 移除這些濾鏡 |

> [!WARNING]
> iOS 只會對檢視套用 `opacity`、最高為 1 的 `brightness` 及 `drop-shadow`；`<Image>` 支援所有色彩濾鏡及 `blur`。Android 的 `blur`、`drop-shadow` 及背景模糊需要 API 31。請參閱[樣式參考](./style-reference.md#filters-and-blending)。

<a id="transforms"></a>

## 變形

| Class | 設定 |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate`（間距、`full`、元素自身尺寸的比例：`-translate-x-1/2`、任意值） |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | 3D 旋轉（以 `transform` 計，在平移、旋轉及縮放之後套用） |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`：`scale-95` = 0.95，`-scale-x-100` 為鏡像 |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | 傾斜，以 `transform` 計（Android 不支援） |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | 元素子項 3D 旋轉的深度，從其中心觀看（CSS 的 `perspective`：`<View class="perspective-near"><View class="rotate-y-45" /></View>`） |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | 清除 3D 旋轉及傾斜（CSS 的 `transform: none`） |
| `translate-none`, `rotate-none`, `scale-none` | 分別清除平移、旋轉、縮放 |

變形工具類別的組合方式與 CSS 相同：`translate-*`、`rotate-*` 和 `scale-*` 分別設定 `translate`、`rotate` 和 `scale` 屬性，且不論次序都會合併，然後再套用 `transform`（`rotate-x-*`、`skew-*`）。`style` prop 中同名的鍵只會取代各自的屬性：`style={{ scale: 1.1 }}` 會取代 `scale-95`，並保留 `rotate-3`。`transform`、`transform-gpu`、`transform-cpu` 和 `transform-flat` 會被接受但不產生作用：NSH 以相同方式（平面）組合所有變形。按尺寸比例進行的平移會依據元素的 frame 解析，並在元素調整大小時隨之變化。

<a id="transitions-and-animation"></a>

## 過渡與動畫

| Class | 設定 |
|---|---|
| `transition` | 顏色、不透明度、陰影及變形；150 ms，`cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | 會產生動畫的屬性 |
| `transition-none` | 無過渡 |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`：`duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | 原生關鍵影格動畫，無限重複 |
| `animate-none` | 停止動畫 |

當數值改變時（包括變體開始或停止匹配時），過渡會在 UI 執行緒上運行，因此 `transition active:scale-95` 無需 JS 即可為按壓動作加上動畫。請將動畫包在 `motion-safe:` 中，以遵從「減少動態效果」設定。

<a id="interactivity"></a>

## 互動

| Class | 設定 |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`：檢視是否為觸控及指標的目標，繼承方式與 CSS 相同：在 `pointer-events-none` 檢視內，`pointer-events-auto` 的檢視會再次成為目標 |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`：`cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ...（所有 CSS cursor 關鍵字） |
| `select-none`, `select-text`, `select-auto` | 文字選取（見「排版」） |

## SVG

| Class | 設定 |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill`（`fill-current` 即 `currentColor`） |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## 圖片

| Class | 設定 |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit`（`fill` 會拉伸，`none` 保持原始尺寸並置於 `objectPosition`，`scale-down` 同樣如此，但較大時會縮小至適合）；適用於圖片及影片 |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition`（`object-left-top` 等同於 `object-top-left` 等） |
| `tint-<color>` | `tintColor`（為範本圖片重新著色） |

<a id="accepted-without-effect"></a>

## 接受但不產生作用

這些工具類別屬於渲染提示，或是每個原生檢視本來就具備的行為；它們會被解析而不產生警告，也不會改變任何東西：`antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`。捲動、對齊及過度捲動是 [scroll](../elements/scroll.md) 的 props。

<a id="not-supported"></a>

## 不支援

`peer-*` 變體、偽元素（`before:`、`after:`）、任意屬性（`[prop:value]`）、`overflow-auto` / `overflow-scroll`、`divide-*`、`columns-*`、`float-*`、`container`、容器查詢、`order-*`、`transform-3d`、`select-all`、`border-double` / `outline-double`、固有最小／最大約束（例如 `max-w-max`）、`snap-*`、`scroll-*`、`overscroll-*`、`touch-*` 及 `isolate` 均屬未知類別。`nsh build` 和 `nsh dev` 會就在原始碼中找到的未知類別發出警告（`file:line:col: unknown class '...'`），而執行階段會為每個未知類別記錄一次日誌。

<a id="variants"></a>

## 變體

變體可讓工具類別附帶條件：`dark:bg-zinc-900`、`md:flex-row`、`active:opacity-70`。變體可以疊加（`dark:active:bg-zinc-700`），並會在其所依賴的條件改變時於原生端重新評估。

<a id="appearance-and-environment"></a>

### 外觀與環境

| 變體 | 套用時機 | Rust |
|---|---|---|
| `dark:` | 外觀為深色 | `.dark(\|s\| …)` |
| `ios:` | 在 iOS 或 Mac Catalyst 上運行 | `.when(os() == Os::Ios, …)` |
| `android:` | 在 Android 上運行 | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | 視窗高度大於寬度／寬度大於高度 | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | 版面方向 | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | 用戶未要求／已要求減少動態效果 | `.style_when(reduce_motion, …)` |

<a id="breakpoints"></a>

### 斷點

斷點會以點為單位比較視窗寬度。

| 變體 | 最小寬度 |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| 形式 | 範例 | 套用時機 |
|---|---|---|
| `<bp>:` | `md:p-8` | 寬度 ≥ 斷點 |
| `max-<bp>:` | `max-md:p-1` | 寬度 < 斷點 |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | 寬度 ≥ 該長度 |
| `max-[<length>]:` | `max-[400px]:text-sm` | 寬度 < 該長度 |

直向的手機（寬 390 點）不符合任何預設斷點；平板電腦或橫向的手機則會符合多個斷點。在 Rust 中，斷點是視窗上的條件：`.style_when(move || window().width >= px(768.0), |s| s.p_8())` 即 `md:p-8`。

<a id="interaction-states"></a>

### 互動狀態

平台只會為類別中用到這些狀態的元素追蹤狀態，變更會在原生端套用，無需往返 JS。

| 變體 | 套用時機 | Rust |
|---|---|---|
| `active:` | 元素被按下 | `.active(\|s\| …)` |
| `hover:` | 指標位於其上（iPad 指標、Mac Catalyst、Android 滑鼠） | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | 輸入框取得焦點 | `.focus(\|s\| …)` |
| `focus-within:` | 元素或其後代取得焦點（`Overlay` 的內容是其所在元素的後代） | `.focus_within(…)` |
| `disabled:` | 元素具有 `disabled` prop | `.disabled_style(\|s\| …)` |
| `enabled:` | 元素不具有 `disabled` prop |  |
| `selected:` | 元素已被選取：`Button` 的 `selected`，或 `accessibilityState.selected` |  |
| `checked:` | 元素已勾選：`accessibilityState.checked` 為 `true`（`"mixed"` 不算已勾選） |  |
| `indeterminate:` | 元素處於不確定狀態：`accessibilityState.checked` 為 `"mixed"` |  |
| `aria-expanded:` | 元素已展開：`accessibilityState.expanded` 為 `true`（`Popover` 或 `Menu` 的觸發器在其彈出層開啟時） |  |
| `aria-pressed:` | 元素是處於開啟狀態的切換按鈕：`accessibilityState.pressed` 為 `true`（`"mixed"` 不算已按下；並非 `active:`，即按壓進行中） | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | 元素處於忙碌狀態：`accessibilityState.busy` 為 `true` |  |
| `aria-checked:` | 元素已勾選：`accessibilityState.checked` 為 `true`，與 `checked:` 相同 |  |
| `aria-selected:` | 元素已被選取：`accessibilityState.selected` 為 `true`，與 `selected:` 相同 |  |
| `data-<name>:` | 元素具有布林值 `data-*` 屬性 `name`（Tailwind 的 `&[data-<name>]`；名稱由小寫字母、數字及 `-` 組成）：用於表達元件的某個部分在其狀態以外所呈現的內容，例如日曆中範圍起始日 `data-range-start` | `Interactive::project_data(name, …)` 可設定其一 |

以樣式物件表示的相同狀態，是每個元素的 `activeStyle`、`hoverStyle`、`focusStyle`、`disabledStyle`、`checkedStyle`、`indeterminateStyle`、`expandedStyle` 和 `pressedStyle` props（以及 `Button` 的 `selectedStyle`）；它們的優先級高於元素的樣式及類別。

`disabled` 適用於任何元素：它會套用 `disabled:` 並移除元素的按壓處理器，因此也不會顯示按壓回饋。

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### 群組

用 `group` 標記祖先元素,再用 `group-<state>:` 按其狀態為後代元素設定樣式。為群組命名即可巢狀使用:`group/card` 和 `group-hover/card:`。

| 變體 | 套用時機(群組處於以下狀態) | Rust |
|---|---|---|
| `group-active:` | 按下 | `.group_active(…)`、`.group_active_named(name, …)` |
| `group-hover:` | 懸停 | `.group_hover(…)`、`.group_hover_named(name, …)` |
| `group-focus:`、`group-focus-visible:` | 取得焦點 |  |
| `group-focus-within:` | 取得焦點或內部含有焦點 | `.group_focus_within(…)`、`.group_focus_within_named(name, …)` |
| `group-disabled:` | 停用 |  |
| `group-selected:` | 已選取 |  |
| `group-checked:` | 已勾選 |  |
| `group-indeterminate:` | 不確定 |  |
| `group-aria-expanded:` | 已展開 |  |
| `group-aria-pressed:` | 處於開啟狀態的切換按鈕 |  |
| `group-aria-busy:`、`group-aria-checked:`、`group-aria-selected:` | 忙碌、已勾選、已選取 |  |
| `group-data-<name>:` | 顯示 `data-*` 屬性 `name` |  |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### 同級元素中的位置

| 變體 | 套用對象 |
|---|---|
| `first:` | 第一個子元素 |
| `last:` | 最後一個子元素 |
| `only:` | 唯一的子元素 |
| `odd:` | 第 1、3⋯⋯個子元素 |
| `even:` | 第 2、4⋯⋯個子元素 |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### 佔位文字與選取

`placeholder:` 套用於 `<Input>` 的佔位文字,只接受文字顏色:`placeholder:text-zinc-400`(樣式鍵 `placeholderColor`)。`selection:` 套用於 `<Input>` 或可選取的 `<Text>` 中被選取的內容;若用在任何元素上,則套用於其內部的內容(即 Tailwind 的 `& *::selection`;以最近的元素為準),並接受背景色,即醒目標示色:`selection:bg-violet-200`(樣式鍵 `selectionColor`,在平台以單一顏色繪製輸入框插入符號的情況下,它同時會為插入符號著色)。

<a id="important"></a>

### 重要

在工具類別(`!p-4`、`p-4!`)之前或之後加上 `!`,可使其優先於所有其他類別以及行內的 `style`。

<a id="theme-customization"></a>

## 主題自訂

在應用程式 `nsh.json` 的 `"tailwind"` 物件中擴充主題。使用新名稱的項目會被新增;使用現有名稱的項目會取代預設值。長度單位為點(points)。主題會在應用程式打包時檢查:未知的鍵或無效的值會導致建置錯誤。

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

使用此主題後,`bg-brand-500`、`bg-brand`(`DEFAULT` 色階)、`text-accent`、`tablet:flex-row`、`font-display`、`text-huge`、`font-heavy`、`rounded-card`、`shadow-card`、`inset-shadow-well`、`drop-shadow-icon`、`tracking-label`、`leading-dense`、`blur-glass`、`perspective-card`、`aspect-photo`、`ease-snappy` 和 `max-w-content` 均可使用。

| 鍵 | 值 | 用於 |
|---|---|---|
| `colors` | `{ name: color }` 或 `{ name: { shade: color } }`;`DEFAULT` 指定不帶色階的顏色。可使用任何 CSS 色彩語法。 | 所有顏色工具類別 |
| `spacing` | 每級的點數(預設為 4) | `p-*`、`m-*`、`gap-*`、`w-*`⋯⋯ |
| `rem` | 每個 `rem` 的點數(預設為 16) | |
| `breakpoints` | `{ name: width }` | 斷點變體(按寬度排序) |
| `container` | `{ name: width }` | `w-*`、`min-w-*`、`max-w-*` |
| `fontFamily` | `{ name: family }`(系統字體系列,或已內置字體的名稱) | `font-*` |
| `fontSize` | `{ name: size }` 或 `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`、`insetShadow`、`dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`、`inset-shadow-*`、`drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`、`backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> Tailwind 主題只會影響應用程式自身的類別。應用程式的設計 token(shadcn/ui 的顏色、`radius`、字體,以及應用程式自訂的 token)屬於其主題,即 `nsh.json` 的 `"theme"` 鍵,Rust 元件會使用它進行繪製;請參閱 [Rust](../docs/rust.md#theme)。類別會以 Tailwind 的名稱 `@theme` 變數(`bg-primary`、`bg-up/30`、`rounded-(--radius)`)來引用這些 token:請參閱[主題 token](../docs/tailwind.md#theme-tokens)。

<a id="related"></a>

## 相關內容

- [Tailwind](../docs/tailwind.md):使用指南。
- [樣式設定](../docs/styling.md):`class`、`classList`、`style` 以及它們如何組合。
- [樣式參考](./style-reference.md):工具類別所設定的樣式鍵。
