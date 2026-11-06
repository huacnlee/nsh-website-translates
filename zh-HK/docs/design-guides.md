---
title: "設計指南"
description: "使用 Native Shell 建構應用程式的產品及互動設計指引:視覺層級、色彩與 token、間距、資訊密度、元件、互動狀態、覆蓋層、動態效果、資料密集型檢視、介面文案,以及平台適配。"
order: 29
group: ui
source_hash: 4296bdbce6ed3911
---


# 設計指南

在為使用 Native Shell 建構的應用程式選擇元件或編寫版面程式碼之前，請先閱讀本指南。本指南記錄了 GPUI Kit 多年桌面應用開發所累積的產品判斷，並延伸至 NSH：介面應該有原生感、克制、精準，而且無需猜測也能理解。

本指南屬規範性文件。**必須**表示正確性或生態系統上的限制，**應該**表示預設做法，要覆寫需有具體理由，**可以**表示可選的技巧。個別屬性與方法，仍以 [Elements](../elements/index.md) 與 [API](../modules/index.md) 頁面為準。

這些規則建基於 `nsh/base`（Rust 中為 `nsh_base`）的行為、主題及其 token，以及各平台使用者已經熟悉的互動方式。NSH 以各平台自身的 UI 進行渲染，外觀則交由應用程式決定：`nsh/base` 的元件提供行為、狀態、焦點和無障礙功能，而每一種顏色、尺寸、圓角和間距，都來自應用程式自己的元件，因此這些規則是用來指引應用程式的設計系統。<a href="https://ui.shadcn.com/docs" target="_blank" rel="noopener noreferrer">shadcn/ui</a> 提供了不少有用的方法（開放程式碼、組合，以及可靠的預設值），但並不決定 NSH 應用程式的外觀。當各種影響因素互相衝突時，應保留平台的行為，以及人們已經理解的互動方式。

<a id="design-thesis"></a>

## 設計理念

建構有原生感、沉靜而精準的介面。讓內容、層級和互動承載整體體驗；裝飾應該輔助它們，而不是與它們競爭。

1. **先求清晰，再談個性。** 在加入品牌表達之前，先讓主要任務和下一步操作清楚明確。
2. **先組合，後發明。** 從既有元件入手，把它們組合成針對產品的工作流程。只有當行為確實全新時，才建立新的基礎元件。
3. **先用 token，後用數值。** 顏色、圓角、字體和間距應構成一個系統。避免使用無法隨主題變化的孤立字面值。參見 [Styling](./styling.md)、[Tailwind](./tailwind.md) 和 [the theme](./rust.md#theme)。
4. **平台優先於網頁慣例。** 在任務有需要時，於桌面平台上保留鍵盤操作、視窗外框、選單、高密度資料檢視、可調整大小的區域和常駐導覽；在手機和平板上則保留系統的標題列、返回手勢、警示和觸控目標。
5. **狀態必須可見。** 懸停、按下、焦點、選取、停用、載入中、驗證和破壞性操作等狀態，需要有清晰且一致的處理方式。
6. **幾何形狀說明包含關係。** 圓角、內距和邊界應描述同一個連貫的層級，即使各表面互相重疊亦然。
7. **回饋反映真實情況。** 載入指示、工具提示和動態效果應該說明真實的狀態或轉場，而不是為即時操作增添儀式感。

<a id="learning-from-shadcn"></a>

## 向 Shadcn 學習

Shadcn 最有價值的貢獻並非某種特定的邊框顏色，而是一種建構系統的方式：

- 擁有介面的頂層，而不是與封閉的抽象層對抗；
- 把小而可預測的部件組合成針對產品的元件；
- 提供本身已構成同一視覺語言的預設值；
- 讓程式碼和組合方式對人和 AI 都清晰易讀；
- 把行為基礎元件與帶樣式的層級分開。

NSH 透過以下分工來實踐這些想法：`nsh` 的基礎元件、`nsh/base` 的無樣式基礎元件，以及屬於應用程式的樣式層（[Three layers](./architecture.md#three-layers)）。應用程式在 `nsh/base` 之上建構自己的元件，可使用 TSX，或應用程式的 Rust crate；可重用的行為應放在 `nsh/base`，視覺策略則留在其上層。

不要盲目照搬以下這些網頁假設：

| 網頁習慣 | NSH 預設做法 |
| --- | --- |
| 每個按鈕都使用手指指標游標 | 使用預設游標；連結才使用手指指標（`cursor-pointer`） |
| 以頁面導覽作為主要結構 | 桌面平台使用常駐的視窗、窗格、側邊欄、分頁和選單；手機上使用 `NavStack` 配合系統的返回操作 |
| 以瀏覽器的焦點和捲動作為後備 | 明確的焦點擁有權，以及由區域負責的捲動（`Scroll`、`List`） |
| 行動優先的單欄佈局 | 手機使用單欄；桌面平台使用可調整大小、並訂明最小視窗尺寸的外殼 |
| 懸停時才顯示的關鍵操作 | 鍵盤、觸控和指標都能觸及、且不依賴懸停的操作 |
| 一排只在懸停時出現的圖示按鈕 | 一個可見的主要操作，加上 `Menu` 或 `ContextMenu` 承載次要指令 |
| 以連結樣式的文字作為應用程式指令 | 使用 `Button`，採用應用程式的預設、外框或幽靈樣式；連結樣式只用於 URL、網頁資源或電郵地址 |
| 處處使用大型觸控密度 | 觸控螢幕使用符合觸控尺寸的目標；使用指標時採用中等密度，只在資訊工作有需要時才使用緊湊密度 |
| 每個平台都自繪標題列和警示卡片 | iOS 和 Android 使用系統的標題列和 `AlertDialog`；桌面平台和網頁使用頁面的 `header` 插槽 |
| 以 CSS 覆寫所有後代元素 | 應用程式的元件、其部件，以及主題的 token |

<a id="start-from-the-task"></a>

## 從任務出發

在繪製畫面之前，先寫下：

- 使用者的主要任務；
- 正在檢視或修改的對象；
- 必須隨時可用的操作；
- 作出決定所需的資訊；
- 空白、載入中、錯誤、離線、唯讀和權限被拒絕等狀態；
- 工作流程中的鍵盤、觸控和螢幕閱讀器路徑；
- 應用程式的呈現位置：獨立顯示，還是嵌入於宿主應用程式之內。

根據這些答案來組織畫面。不要一開始就設計儀表板網格或元件目錄。好的介面會呈現使用者的心智模型：文件、帳戶、專案、訊息、設定，或其他穩定的對象，而不是內部的服務架構。

在分配控制項之前，先設計好主要任務。它的視覺份量、位置和資訊深度，應與其在產品中的重要性相稱。當次要內容佔據頁面時，核心結果不可被縮減成一個小小的數字、角落的圖示或不顯眼的頁尾操作。當結果集是產品的主要價值所在時，可考慮使用摘要區域或卡片，呈現數量、具代表性的結果、有意義的狀態，以及清晰的下一步操作。

對於每一個擬議的操作，都要說明其可見的對象、目前狀態、範圍和結果。如果介面沒有顯示或清楚暗示這些內容，該操作就仍言之過早。不要僅因為後端具備某項能力就把它暴露出來；應先設計該對象如何進入使用者的心智模型。

<a id="visual-language"></a>

## 視覺語言

<a id="hierarchy"></a>

### 層級

偏好使用少量而清晰的層級：

- **視窗或頁面標題**標明目前的對象或工作區；
- **章節標題**劃分有意義的區域（`role="header"`，讓螢幕閱讀器可以在其間跳轉）；
- **內文**承載工作內容；
- **弱化文字**提供次要的中繼資料和說明；
- **標籤**標明控制項和數值。

在加入顏色或容器之前，先運用大小、字重、間距和分隔線。避免在卡片內再嵌套卡片：大多數區域只需要一個背景、一條細線邊界和有意為之的間距。

要從整個功能的角度評估層級，而不是逐個元件評估。審查時先隱藏強調色和裝飾：主要任務、目前選取項目、結果摘要和下一步操作，仍應從結構上一目了然。即使每個控制項單獨看都合理，只要它們沒有構成同一個閱讀順序和同一條決策路徑，畫面仍然會失敗。

把強調視為有限的預算。一個局部表面只需要一個清晰的焦點，而不是一片互相競爭的高亮。如果所有東西都有顏色、徽章、粗體、方框，或被升級成警示，就沒有任何東西顯得重要。先以結構和鄰近關係確立優先次序；只有當區分會改變使用者的注意或行動時，才使用更強的顏色和元件。

<a id="color-and-themes"></a>

### 顏色與主題

從主題讀取顏色（Rust 中使用 `theme()`，TSX 中使用 token class），並按語意角色使用：

- `background` 和 `foreground` 用於主要表面和文字；
- `card`、`popover`、`sidebar` 及其前景 token 用於各自命名的表面；
- `muted` 和 `muted-foreground` 用於輔助資訊；
- `primary` 用於主要操作或選取強調，`secondary` 和 `accent` 用於較含蓄的強調，以及被懸停或聚焦的列；
- `destructive` 只用於破壞性操作和錯誤，而應用程式加入主題的狀態顏色（`success`、`warning`）只用於其所代表的意義；
- `chart-1` 至 `chart-5` 用於資料系列；
- `border`、`input` 和 `ring` 用於結構和互動。

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().background)
    .p_4()
    .gap_1()
    .child(text("Balance").text_color(move || theme().foreground))
    .child(text("Updated just now").text_sm().text_color(move || theme().muted_foreground))
```

```tsx tabs
<View class="gap-1 rounded-(--radius) border border-border bg-background p-4">
  <Text class="text-foreground">Balance</Text>
  <Text class="text-sm text-muted-foreground">Updated just now</Text>
</View>
```

不要把語意狀態顏色用作裝飾。不要只靠顏色來傳達意義。請在淺色和深色主題下，以及自訂主題值下（包括嵌入你的應用程式的宿主應用程式之主題）驗證每個自訂表面；切勿假設前景是黑色、背景是白色。

徽章適用於簡短的狀態、數量或分類，且有助於快速掃視；不要用於每一個標籤、中繼資料值、篩選條件或章節標題。大多數徽章應保持中性；語意顏色只留給真正帶有成功、警告、破壞性或提示意義的狀態。一排多彩的徽章，通常代表缺少層級或分組的決定。

應用程式 UI 不應包含原始的十六進位值、`rgb()`/`rgba()` 或 `hsl()` 顏色，也不應使用 `bg-zinc-100` 這類調色盤 class。請按語意角色從主題解析顏色。如果所需的角色並不存在，請在應用程式的主題檔案中定義（[Theme tokens](./tailwind.md#theme-tokens)：在其 `light` 和 `dark` 中加入 `"up": "#16a34a"`，會產生 TSX 中的 `text-up`、`bg-up/30`、`token("up")`，以及 Rust 中的 `theme().color("up")`），而不是在呼叫處嵌入調色盤的數值。原始顏色只應出現在主題定義內，或顏色本身即為資料的、經過審核的資料／點陣內容中。

<a id="radius-spacing-and-density"></a>

### 圓角、間距與密度

使用有限的圓角級別，正如字體和控制項尺寸一樣。請從主題的 `radius`（控制項與表面皆適用，`rounded-(--radius)`）、應用程式加入主題的圓角，以及 Tailwind 的 `rounded-sm` … `rounded-2xl`（介乎其間）中選取，而不是為每個元素各自發明圓角。大型容器可以採用比其內部控制項更柔和的級別；緊湊的控制項和浮層則使用更緊的級別。對於一般矩形，圓角應明顯小於其短邊的一半。只有在刻意製作圓形和膠囊形時，才使用 `rounded-full`（`.rounded_full()`）；工具提示不得意外地變成膠囊形。

嵌套的表面應呈現為同心的形狀。請使用 `inner radius ≈ max(0, outer radius − gap)` 來選取最接近的合適圓角；可見的間隙在轉角處應保持均勻。如果重複出現的組合需要中間值，請在主題中加入具名的 token（`"radius-inset": "0.375rem"`、`rounded-(--radius-inset)`）。分段控制項是單一輪廓：兩端的分段跟隨容器的內側轉角，中間的分段保持方角，而且每個邊界只有一條粗細一致的分隔線。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/radius-hierarchy-light.svg" alt="Light theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
<img class="diagram diagram-dark" src="/diagrams/radius-hierarchy-dark.svg" alt="Dark theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
</div>

圓角必須管轄整個可見表面，而不只是它的邊框。外露的轉角須對其後方的表面保持透明；子元素的背景、選取填色和捲動內容也必須跟隨邊界。請為內部表面設定自己的圓角，或以 `overflow-hidden`（`.overflow_hidden()`）裁切容器，然後在兩種主題下以對比強烈的背景檢查該組合。選擇裁切方式時，請保留向外的焦點環。

使用精簡的間距級別並重複使用。相關的標籤／控制項配對之間應比不同群組之間更近；不同群組之間應比不同章節之間更近。優先使用應用程式元件的尺寸（小、預設的中、大），而不是一次性的高度。工具列和資料密集的畫面可使用緊湊變體，但不要用它來把含糊不清的版面硬塞進更少的空間。

共用的語意級別刻意保持精簡：間距大約依 2、4、8、12、16、24 和 32 點遞進，字體則維持在 12、14、16、18 和 20 點左右。請把這些視為彼此之間的關係，而不是容許把它們目前的數值散落在功能程式碼各處。Tailwind 的間距級別已提供這些數值：一個級距為 4 點（`p-4` 即 16pt），無論是 class 還是有型別的 Rust 方法皆然；`nsh.json` 的 `"tailwind"` 中的 `"spacing"` 會改變 class 的級距，而有型別的方法則沿用 Tailwind 的預設級別。如果應用程式需要不同的級別，應在自己的元件或主題 token（`p-(--gap-card)`）中擁有它，並一致地使用。
<a id="spatial-grammar"></a>

### 空間語法

間距表達關係。要從語意級距中選取間隙，先問這兩個元素彼此之間意味着甚麼：

| 關係 | 典型類別 | 目前級距 | 示例 |
| --- | --- | --- | --- |
| 視覺校正 | `gap-0.5` | 2 pt | 圖示基線、緊湊分隔線 |
| 同一控制項的各部分 | `gap-1` | 4 pt | 選單圖示與標籤、標題與描述 |
| 密切相關的控制項 | `gap-2` | 8 pt | 按鈕圖示與標籤、對話框操作 |
| 同一內容群組 | `gap-3` | 12 pt | 通知欄位、緊湊表單列 |
| 同一區段內的不同群組 | `gap-4` | 16 pt | 面板內距、表單群組 |
| 不同區段 | `gap-6` | 24 pt | 頁面或檢視器中的主要區塊 |
| 主要區域邊界 | `gap-8` | 32 pt | 空白狀態的留白、頁面分帶 |

這些數值描述的是預設級距，並非要逐字重複的字面值。請使用間距類別和型別化方法（`gap-2`、
`.gap_2()`、`p-4`、`.p_4()`）或主題的 token。產品自有的級距應保留相同的排序與
關係，並透過應用程式自己的元件傳遞，而不是在每個呼叫處逐一寫出。

在處理水平與垂直空間時，請遵循以下規則：

1. **先內後外。** 元件的內距屬於該元件；元件之間的間隙則屬於它們的父層。
2. **垂直節奏顯示分組。** 標題與其描述之間的間隙，應小於該描述與下一區段之間的間隙。相等的間隙意味着相等的關係。
3. **水平空間有助掃視。** 重複的列應讓圖示、標籤、數值、徽章和尾端操作維持在穩定的欄位上。
4. **前緣與後緣屬於語意。** 以閱讀順序的邊緣思考，並將其寫成起始與結束（`ps-*`、
   `me-*`、`.ps_4()`），讓版面能在由右至左的語系下鏡像。
5. **不要重複加內距。** 放在已有內距的面板中的卡片，不應自動再加上一整份面板內縮。
6. **審慎使用視覺對齊。** 對圖示或字形幾何作出一至兩點的校正是合理的，但須記錄為何它與級距不同。

常見的組合方式可說明這些關係：

- 按鈕內容在小尺寸使用 4 pt，在一般尺寸使用 8 pt；
- 對話框的標題區與頁腳區使用 8 pt 的內部間隙；
- 緊湊的清單與選單列使用 4 pt 垂直內距和 8–12 pt 水平內距；
- 工作表（sheet）標題區的前緣約為 16 pt、後緣約為 12 pt，為關閉操作預留空間，而頁腳區則使用 16 pt 水平和 12 pt 垂直空間；
- 通知使用 16 pt 水平內距和 12 pt 欄位間隙，因為圖示、訊息和操作是各自獨立的群組。

不要將這些當作適用於所有介面的照抄配方。它們揭示的是系統的道理：控制項內部更緊湊、列以利掃視為優先，而容器在邊界處花費的空間多於內容之間。

<a id="proportion-and-layer-hierarchy"></a>

### 比例與層級階層

先從內容需求入手，再設定比例。當某個窗格的角色明顯不同時，避免隨意對半分。

- 導覽側邊欄應寬得足以讓標籤穩定顯示，但在視覺上要明顯從屬於工作區。請為它指定最小、偏好和最大寬度（`min-w-*`、`w-*`、`max-w-*`），而不是只用百分比。
- 在主從式（master–detail）版面中，讓集合保持易於掃視，並將多出的空間分給詳細資料窗格。大約三分之一／三分之二的起始比例通常很有用，但內容限制才是最終依據。在手機上，兩者會變成 `NavStack` 的兩個頁面。
- 檢視器與輔助工作表預設不應遮蓋主要物件。當內容增加時，它們應可調整大小或可關閉；[`Sheet`](../elements/sheet.md) 會隨背景遮罩、Escape 和返回操作而關閉。
- 對話框的寬度取決於要作出的決定：簡短確認用 `AlertDialog`，中等表單，或為複雜工作使用專屬視窗／頁面。不要僅為了製造留白而放大對話框。
- 最強的立體層級（elevation）保留給最上層的決策層。在同一層內，請用背景和細線來顯示層級，而不是使用越來越大的陰影。

為每個主要區域定義三項尺寸限制：其任務仍能運作的最小值、舒適的預設值，以及它如何吸收多餘空間。當使用者控制的分割代表工作流程偏好時，請將其持久保存，並在還原時按目前視窗限制數值範圍。

<a id="alignment-details"></a>

### 對齊細節

對齊是一套結構性系統，而不是最後的修飾步驟。為每個介面建立一小組對齊脊線：共用的前緣與後緣、文字基線、中心線，以及固定的功能欄道。同一層級的元素，即使屬於不同的元件類型，也應由上至下或由前至後貼附於同一條脊線。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/alignment-spines-light.svg" alt="Alignment spines across a content region">
<img class="diagram diagram-dark" src="/diagrams/alignment-spines-dark.svg" alt="Alignment spines across a content region">
</div>

垂直紅線位於共用邊緣或控制項中心旁，用於內容、狀態、時間和尾端操作。水平線位於文字基線下方，或穿過列的中心，以顯示底部對齊和垂直置中對齊。緊湊對照圖則突顯出一個渲染像素的偏移，這必須在其結構擁有者處修正。

- 為同級區域提供共用的內容內縮。描述同一層級的標題、工具列、清單列、空白狀態和頁腳，不應各自創造略有不同的前緣。
- 在整個區域中重複欄位幾何。標頭、列、摘要、載入狀態和行內編輯器，應為身分、中繼資料、狀態、數字和操作預留相同的欄道。
- 跨列與跨區段對齊相關的控制項。由上至下掃視頁面時，表單標籤、欄位、描述和驗證訊息應呈現出穩定的垂直網格。
- 保持水平帶的一致性。共用同一工具列、標頭、狀態列或列的項目，應使用同一條基線或中心線，而不是各自微調偏移。
- 只為真正的階層、包含或展開關係引入縮排。裝飾性的縮排會讓同級項目看起來像從屬項目，並破壞介面的閱讀線。
- 當巢狀層級結束時，要精確回到父層脊線。不要讓累積的內距在巢狀容器之間漂移。
- 即使內容為選用，也要保持脊線。缺少圖示、徽章、描述或尾端操作時，不得使其餘標籤移位；當需要跨列比較時，請使用有意設計的插槽或欄道。
- 在階層相符之處，讓主要區域彼此對齊。側邊欄標頭、內容標題、分割窗格、工具列和底部列不必共用每一個座標，但處於相同層級的部分應形成可見的連續線條。

並非每個邊緣都應對齊。子項可以縮排、主要數值可以領先於其輔助的中繼資料，破壞性的決定也可以加大分隔。這類例外必須傳達階層或意義；不得是各元件內距互不協調所造成的結果。先從共用脊線開始，再明確設定例外。

將精確對齊和重複間隙視為品質不變條件。當兩個邊緣或兩段空間本意相等時，一個渲染像素的差異就是缺陷，而不是可接受的視覺近似。請在具代表性的視窗尺寸、文字大小和顯示縮放比例下，使用量度工具檢查解析後的邊界。比較座標和距離；不要只憑隨意的截圖來核准對齊。

渲染像素容差是驗證規則，而不是以原始點數偏移來修補程式碼的許可。相等的關係應由同一個間距類別或方法、token、網格定義或共用的元件內縮解析而來。當它們不同時，請修正共同的擁有者。要考慮小數佈局和裝置取整（2× 與 3× 手機、小數桌面縮放比例），讓預期的脊線落在同一個實體像素上，而不是在特定縮放比例下漂移。

- 當混合大小的文字共處一列時，按基線對齊文字，而不是按邊界框中心對齊。
- 將圖示置中於固定插槽內，使標籤不會因圖示的固有寬度不同而移動。
- 可比較的數字向結束端對齊，並使用等寬數字（`tabular-nums`）；散文和識別碼則向起始端對齊，除非語系另有要求。
- 讓列的尾端操作和展開指示器停留在固定寬度的欄道中。
- 按互動框架對齊表單控制項，而不是按其下方的說明文字對齊。
- 只有當兩側確實各自擁有相反的邊緣時，才使用 `justify-between`（`.justify_between()`）；它不應用來掩飾中間缺失的結構。
- 細線屬於邊界的擁有者。兩個相鄰區域不得各自繪製同一條分隔線。
- 捲軸屬於會捲動的區域，並貼靠在該面板、編輯器或視窗的後緣。內容內距可以讓文字和列內縮；但不得將捲軸拉進介面中間。應為捲動視圖的內容加內距，而不是為捲動視圖本身加內距。

<a id="density-tiers"></a>

### 密度層級

預設為中等。要為整個局部情境更改密度，而不是只改變單一孤立的控制項：

- **comfortable / large（舒適／大）：** 新手導覽、稀疏的表單、突出的決定；
- **standard / medium（標準／中）：** 大多數應用程式外觀和工作流程，以及所有觸控螢幕；
- **compact / small（緊湊／小）：** 桌面工具列、選單、表格和重複出現的專業資料；
- **extra compact / xsmall（極緊湊／特小）：** 特殊的高密度工具，絕不能自動作為整個應用程式的選擇。

請使用有界限的級距，而不是任意的尺寸。在觸控螢幕上，每個可按下的目標至少為 44 × 44 點
（[觸控目標](./accessibility.md#touch-targets)）。使用指標裝置時，按鈕通常在約 24、28 和 32 pt 的框架之間變化，輸入框在大尺寸時可達約 40 pt，表格列則約為 28、32 和 40 pt。請讓應用程式的元件提供一種尺寸，能同時改變字體、圖示、內距和點擊目標；只改變外框的自訂高度通常並不完整。

<a id="text-size-base-font-and-points"></a>

### 文字大小、基準字體與點數

設計良好的級距能在文字放大時保持層級。當標題與內文、控制項與圖示、內外間距、主要與次要區域之間的關係，在每一種大小下感覺依然相同時，較大的文字才算成功，而不是僅僅讓每個物件都變大。

NSH 的長度單位是點（points），而使用者的文字大小（iOS 上的 Dynamic Type、Android 上的字體大小、桌面系統的文字縮放、宿主應用程式自己的設定）會縮放文字：每一個允許字體縮放的文字和輸入框都會變大，而間距、圓角半徑、邊框和圖像則保持原有大小（[文字大小](./device-and-environment.md#text-size)）。應用程式的基準文字大小（Tailwind 的 `text-base`，16 點）是字型級距所圍繞的內文大小。

以比例來設計：

- 字型級距在基準內文大小周圍保持相同的層級；
- 間距級距在字型周圍保持相同的分組關係；
- 控制項框架和點擊目標隨其標籤一同增長：按其內容和最小值來決定尺寸（`min-h-11`），而不是使用固定高度；
- 窗格的最小值和舒適寬度要考慮到較大的文字；
- 圓角半徑和焦點處理須與控制項框架保持視覺上的一致。

由於文字會自行增長，圍繞它的固定框架就會失效：固定高度按鈕內的較大標籤、固定窗格最小值內的較大文件，或固定列高內的較大列，都會破壞原有的節奏，並可能造成內容被裁切。當文字變大時，讓列換行或改為單欄排列（`fontScale()`、`font_scale()`），並限制本來就很大的文字的縮放比例，例如 34pt 的標題（`maxFontSizeMultiplier`）。

原則上，應用程式佈局不應寫入字面的點數值（`p-[13px]`、`px(13.0)`）。請使用間距級距（`p-2`、`gap-3`、`w-64`、`text-sm` 及其型別化方法）或應用程式的元件尺寸。只有當數值代表實體或點陣邊界時，才使用字面點數：細線、平台視窗內縮、點陣圖尺寸、最小點擊測試容差，或必須與外部介面相符的幾何。這些都是經過審核並有記錄的例外。產品的間距、字型、圖示大小和一般控制項幾何，一律維持在級距上。

請在多種文字大小下測試，而不僅是預設大小。驗證層級、換行、截斷、最小視窗大小、窗格調整大小、焦點環的間距、彈出視窗的位置，以及清單列的量度。
<a id="surfaces-and-elevation"></a>

### 表面與層級

使用層級來說明堆疊關係，而非表示重要程度。基底表面保持平坦，以分隔線和背景對比界定各區域。彈出視窗、選單、面板、對話框和通知由於位於其他內容之上，可以使用逐級加強的陰影。不要為每張卡片都加上陰影。

同類表面應採用同一種處理方式。為各類彈出元件提供一套統一的主題化表面（`popover` 標記、邊框、`radius` 及一種陰影），使 `Popover`、`Menu`、`ContextMenu` 和 `Tooltip` 不會各自走樣。當應用程式自行設計另一種錨定表面時，應重用這套處理方式，而不是用互不相關的邊框和陰影字面值去近似模擬。

<a id="typography-and-icons"></a>

### 字體與圖示

介面文字使用平台的 UI 字體，等寬字體只用於程式碼、識別碼、快捷鍵和需要對齊的數字資料。正文要保持易讀，避免過多的大寫字母或字距，對中日韓（CJK）文字尤其如此。

一個產品只使用一套圖示。圖示用來補充標籤，不應該用來取代標籤，讓使用者去猜測不熟悉的操作。只有圖示的按鈕必須有可存取名稱（`accessibilityLabel`）。其視覺說明依照下文的工具提示政策處理。使用實心或有顏色的圖示來表示狀態，而不是單純為了讓工具列顯得活潑。

<a id="layout-patterns"></a>

## 版面配置模式

<a id="choose-a-stable-shell"></a>

### 選擇穩定的外殼

大多數應用程式應採用以下其中一種外殼：

- **單一工作區：** 一個標題列或工具列，下方是一個主要檢視；
- **導覽堆疊：** 頁面以推入和彈出方式切換（`NavStack`），在手機上配合系統的返回手勢；
- **側邊欄工作區：** 常駐的導覽列位於一側，旁邊是會變換的詳細檢視；
- **主從式（master–detail）：** 可調整大小的集合窗格和詳細窗格，在手機上則為兩個頁面；
- **文件工作區：** 以分頁處理多個長期存在的物件；
- **工具視窗：** 只處理一項集中的任務，操作路徑簡短而固定。

內容變換時，全域導覽應保持穩定。使用 `flex-1`（`.flex_1()`）把剩餘空間交給主要工作區，並在溢出的子元素需要收縮時使用 `min-w-0` / `min-h-0`。使用 `Scroll` 和 `List` 取得其設計的行為，而不要用巢狀檢視重新構建捲動或虛擬化功能。

在桌面平台上，應用程式自行繪製的標題列（[`nsh/desktop`](../modules/nsh-desktop.md)）首先是視窗外框。請保留其拖曳區域（`.window_drag(true)`），並避免把一般的標題點擊綁定到不常用的編輯命令。重新命名應放在明確的物件命令之後，並在適當時提供鍵盤操作路徑。

<a id="responsive-windows"></a>

### 回應式視窗

視窗可以是任何大小：由使用者、分割檢視或宿主應用程式決定。請預先決定視窗變窄時會發生甚麼事：

1. 保住主要任務；
2. 讓可調整大小的區域縮小至已記載的最小值；
3. 收起次要標籤或檢閱面板；
4. 把低頻率的操作移入選單；
5. 只捲動內容確實溢出的區域。

不要在隱藏某項操作時不提供其他途徑。如果只有清單或文件主體需要捲動，就避免讓整個視窗捲動。斷點（`md:`、`lg:`）和 `windowSize()`（Rust 中為 `window()`）應跟隨 NSH 所渲染的表面。

NSH 的彈性版面配置與其他版面配置系統一樣存在固有尺寸的壓力：帶有 `flex-1` 的子元素在內容很長時，仍可能拒絕收縮。設計與實作必須就哪些窗格可以收縮、截斷、換行或捲動達成一致。被裁切的區域也會裁掉向外延伸的焦點環；切勿為了簡化溢出處理而犧牲鍵盤可見性。

<a id="forms-and-settings"></a>

### 表單與設定

每個欄位都要有可見的標籤，說明或驗證訊息應放在其所描述的欄位旁邊。相關欄位要對齊，但不要把較長的標籤硬塞進狹窄的固定欄寬。使用合適的控制項：獨立的選項用 `Checkbox`，少量可見的選項用由 `Radio` 組成的 [`RadioGroup`](../elements/radio.md)，較多的選項用由選項組成的 `Menu`，而即時生效的設定則用 [`Switch`](../elements/switch.md)。它們的各個部件（開關的軌道和滑塊、核取方塊的指示器）由應用程式自行設定樣式，並使用會跟隨控制項變化的 `checked:`、`indeterminate:` 和 `disabled:` 類別：

```rust tabs
use nsh_base::{switch, theme};

fn setting_switch(label: &'static str, on: Signal<bool>) -> impl IntoElement {
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text(label).text_color(move || theme().foreground))
}
```

```tsx tabs
import { Text } from "nsh";
import { Switch } from "nsh/base";

function SettingSwitch(props: { label: string; on: boolean; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Switch
      checked={props.on}
      onChange={props.onChange}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text class="text-foreground">{props.label}</Text>
    </Switch>
  );
}
```

「全選」核取方塊以不確定狀態表示部分選取：

```rust tabs
use nsh_base::{checkbox, theme};

fn select_all(selected: Signal<usize>, total: usize) -> impl IntoElement {
    checkbox()
        .checked(move || selected.get() == total)
        .indeterminate(move || selected.get() > 0 && selected.get() < total)
        .on_change(move |all: &bool| selected.set(if *all { total } else { 0 }))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded(move || theme().radius)
                .border_2()
                .border_color(move || theme().border)
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
                .indeterminate(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || mark(selected.get(), total)).text_color(move || theme().primary_foreground))
        .child(text("Select all").text_color(move || theme().foreground))
}

fn mark(selected: usize, total: usize) -> &'static str {
    if selected == total { "✓" } else if selected > 0 { "–" } else { "" }
}
```

```tsx tabs
import { Text } from "nsh";
import { Checkbox } from "nsh/base";

function SelectAll(props: { selected: number; total: number; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Checkbox
      checked={props.selected === props.total}
      indeterminate={props.selected > 0 && props.selected < props.total}
      onChange={props.onChange}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-(--radius) border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
      indicator={
        <Text class="text-primary-foreground">
          {props.selected === props.total ? "✓" : props.selected > 0 ? "–" : ""}
        </Text>
      }
    >
      <Text class="text-foreground">Select all</Text>
    </Checkbox>
  );
}
```

操作進行期間要停用提交，保留使用者的輸入，並在操作附近顯示結果。確保輸入欄位位於軟鍵盤上方（`env(keyboard-inset-height)`）。對話框只用於簡短而集中的決定；需要探索或涉及大量欄位的工作流程，則使用整頁或面板。

載入處理必須反映實際的等待。切換內容已經可用的設定面板時應即時完成；只有在內容確實正在載入而且其形狀已知時，才適合使用骨架畫面。

<a id="components-and-composition"></a>

## 元件與組合

遵循 Shadcn 的原則：元件是建構材料，而不是封閉的設計系統。`nsh/base` 提供行為；應用程式則在自己的元件中提供一致的預設值，並負責組合方式和產品語意。

- 按意義使用元件變體。主要（primary）樣式只保留給決策區域中明確的預設提交操作，通常是在桌面平台上按 Return 所觸發的操作。單獨出現、使用頻繁或令人期望的操作，不會自動成為主要操作。管理工具列中的 `Add` 命令通常使用預設按鈕；表單中預設的 `Create` 提交則可以使用主要樣式。破壞性的操作使用 destructive，工具列上較不搶眼的操作使用 ghost。
- 優先使用明確的部件和插槽，而不是為任意的子孫元素設定樣式。
- 在整個產品中保持重複出現的模式一致。如果它帶有領域語言或政策，就把它包裝成應用程式元件。
- 依其語意角色使用標準元件。`Menu`、`ContextMenu`、`Popover`、`Sheet`、`Dialog` 和 `AlertDialog` 不是可以互換的方框；它們各自擁有不同的選取、焦點、鍵盤、關閉和版面配置契約，並且在每種裝置上有各自的形式。
- 保持元件系列的幾何形狀一致。選單列共用垂直和水平內距、高度、圖示和勾號的位置、分隔線、圓角半徑及狀態處理。不要用間距只是近似系統選單的自訂彈出視窗去模仿選單。
- 不要僅僅為了重新命名每個屬性，或凍結其所有功能而包裝元件。
- 不帶產品樣式的可重用行為，應移至 `nsh/base`，或應用程式各產品共用的 crate；帶有主題和特定風格的呈現則留在應用程式的元件中。

```rust tabs
use nsh_base::{button, theme};

/// The footer of a form: a default Cancel and the primary commit.
fn form_actions(cancel: impl Fn() + 'static, create: impl Fn() + 'static) -> impl IntoElement {
    view()
        .flex_row()
        .justify_end()
        .gap_2()
        .child(
            button()
                .on_press(cancel)
                .rounded(move || theme().radius)
                .border_1()
                .border_color(move || theme().border)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().muted))
                .child(text("Cancel").text_color(move || theme().foreground)),
        )
        .child(
            button()
                .on_press(create)
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .child(text("Create").text_color(move || theme().primary_foreground)),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Button } from "nsh/base";

// The footer of a form: a default Cancel and the primary commit.
function FormActions(props: { onCancel: () => void; onCreate: () => void }) {
  return (
    <View class="flex-row justify-end gap-2">
      <Button onPress={props.onCancel} class="rounded-(--radius) border border-border px-4 py-2 active:bg-muted">
        <Text class="text-foreground">Cancel</Text>
      </Button>
      <Button onPress={props.onCreate} class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
        <Text class="text-primary-foreground">Create</Text>
      </Button>
    </View>
  );
}
```

<a id="interaction-states"></a>

## 互動狀態

<a id="make-the-result-understandable-before-the-click"></a>

### 讓結果在點擊前就能被理解

控制項應能預示其結果。使用使用者熟悉的平台控制項和位置，讓人無須先學習介面也能操作。控制項的標籤說明操作和對象，其狀態顯示是否可用，而回饋則確認相同的結果。

如果 Button 會開啟設定流程，就不要把它標為 `Save`；如果它只是把項目從群組中移除，就不要標為 `Delete`。當上下文不足以說明範圍時，要明確指出範圍。啟動時立即回應，在較長的工作期間防止重複提交，並在發生變化的物件附近顯示結果。只有在結果本身不可見時，才加入成功訊息。

每個互動控制項都應針對以下狀態設計：

| 狀態 | NSH | 設計要求 |
| --- | --- | --- |
| 靜止 | | 清晰的可操作提示，不帶視覺雜訊 |
| 懸停 | `hover:` | 細微的指標回饋，絕不是唯一的提示 |
| 按下 | `active:` | 即時的按下回饋，由應用程式設定樣式 |
| 開啟／按下 | 彈出視窗的 `open` | 附屬彈出視窗開啟期間持續的回饋 |
| 可見焦點 | `focus-visible:` | 高對比的鍵盤焦點環 |
| 已選取／已勾選 | `selected:`、`checked:` | 與懸停有所區別的持續狀態 |
| 停用 | `disabled:` | 降低強調程度，且不會出現具誤導性的懸停或按下回應 |
| 載入中 | | 保留上下文、防止重複操作、說明較長的等待 |
| 錯誤 | | 說明發生了甚麼事，以及如何復原 |

在桌面平台和網頁上，應使用 [`keymap`](../modules/nsh.md#keymap) 綁定應能以鍵盤操作的命令。配合使用者熟悉的平台快捷鍵（`"mod+k"` 在 macOS 上是 Command，在其他平台上是 Control），在選單或工具提示中顯示快捷鍵，並在開啟或關閉覆蓋層之後，讓焦點停留在合理的位置。

選取是資訊模型的一部分，而不是可有可無的修飾。分頁、分段選項、可選取的列、篩選器和導覽目的地，都必須顯示持續的已選取狀態（`selected`，螢幕閱讀器會朗讀此狀態）。擁有選單的按鈕必須在彈出視窗關閉前保持明顯的按下或開啟狀態；單靠懸停無法說明觸發元件與表面之間的關係。

```rust tabs
use nsh_base::{tab, theme};

fn section_tab(label: &'static str, id: Section, current: Signal<Section>) -> impl IntoElement {
    let selected = move || current.get() == id;
    tab()
        .selected(selected)
        .on_press(move || current.set(id))
        .rounded(move || theme().radius)
        .px_3()
        .py_2()
        .selected_style(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || {
            if selected() { theme().foreground } else { theme().muted_foreground }
        }))
}
```

```tsx tabs
import { Text } from "nsh";
import { Tab } from "nsh/base";

function SectionTab(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Tab
      selected={props.selected}
      onPress={props.onPress}
      class="group rounded-(--radius) px-3 py-2 selected:bg-muted"
    >
      <Text class="text-muted-foreground group-selected:text-foreground">{props.label}</Text>
    </Tab>
  );
}
```

在分段控制項中，被選取的填色與未選取的表面必須與容器共用同一輪廓。兩者都不可使末端的圓角變成直角，也不可使任何邊界看起來比其他邊界更粗。

要顯示已選取的導覽項目、清單列或分頁，應透過該項目本身的表面：選取的填色、較強的前景色，或較粗的字重。不要加入前緣直條或單側邊框作為選取標記。這是網頁範本的習慣，不是原生慣例；它會破壞項目的圓角輪廓，並為本來已按文字對齊的欄位多加一條互相競爭的邊緣。

對於破壞性操作，要區分可還原和不可還原的工作。可還原的更改，優先使用復原或暫時性通知。當後果嚴重而且無法復原時，使用 [`AlertDialog`](../elements/alert-dialog.md)；並在確認文字中指出具體的物件和後果。

<a id="pointer-conventions"></a>

### 指標慣例

按鈕、核取方塊、選單項目、分頁和其他控制項使用預設游標。連結和行為像連結的內容則使用手指指標（`cursor-pointer`）。文字、調整大小、抓取和禁止游標，只在描述正在進行的操作時使用。游標用來強化操作提示，但不能取代控制項的可見狀態或可存取角色。

懸停效果要適度，因為觸控、鍵盤和輔助功能的互動都沒有懸停。不要讓破壞性或必要操作唯一的一份入口只在懸停時才顯示。情境式的列操作在靜止時可以變得較不顯眼，前提是相同的命令仍可透過選取、鍵盤或右鍵選單使用。

<a id="prefer-command-surfaces-over-hover-toolbars"></a>

### 優先使用命令表面，而非懸停工具列

按命令的使用頻率和範圍，決定操作放在哪裏：

- 主要或常用的操作，以帶標籤的按鈕或使用者熟悉的工具列控制項保持可見；
- 目前區域的次要操作，放在可見的 [`Menu`](../elements/menu.md) 觸發元件之後；
- 作用於指標或手指所指物件的命令，放入 `ContextMenu`：在桌面平台上是按右鍵，在觸控螢幕上是長按；
- 如果重要命令有自然的鍵盤形式，就同時透過鍵盤快捷鍵（[`keymap`](../modules/nsh.md#keymap)）提供，並放在應用程式選單中（來自 [`nsh/desktop`](../modules/nsh-desktop.md) 的 `Menu.setApplicationMenu`）；
- 只有在命令於其他地方仍可使用時，才把懸停時顯示的圖示當作它的捷徑。

這不只是視覺上的偏好。`nsh/base` 的選單已經處理了在觸發元件處的定位、桌面平台上的層疊子選單、手機上以面板就地展開子選單、透過選擇項目、在外部按下、Escape 或返回來關閉，以及供螢幕閱讀器使用的選單和選單項目角色。自訂的懸停按鈕條必須重新構建這些行為，而且對觸控、純鍵盤和許多輔助技術的工作流程來說是不可見的。

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, theme};
use nsh_core::{color::black, element::StyleRefinement};

/// The app's popup surface, shared by its menus, popovers and tooltips.
fn popup(s: StyleRefinement) -> StyleRefinement {
    s.min_w(px(192.0))
        .p_1()
        .rounded(move || theme().radius)
        .border_1()
        .border_color(move || theme().border)
        .bg(move || theme().popover)
        .shadow_lg()
}

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded(move || theme().radius)
        .hover(|s| s.bg(move || theme().muted))
        .active(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || theme().foreground))
}

fn more_menu(rename: impl Fn() + 'static, duplicate: impl Fn() + 'static, delete: impl Fn() + 'static) -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .popup_style(popup)
        .backdrop_style(|s| s.bg(black().opacity(0.5)))
        .trigger(
            view()
                .label("More actions")
                .size(px(44.0))
                .items_center()
                .justify_center()
                .rounded_full()
                .active(|s| s.bg(move || theme().muted))
                .child(text("⋯").text_color(move || theme().foreground)),
        )
        .child(item("Rename…", rename))
        .child(item("Duplicate", duplicate))
        .child(menu_separator().h(px(1.0)).my_1().bg(move || theme().border))
        .child(item("Delete…", delete))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator } from "nsh/base";

/** The app's popup surface, shared by its menus, popovers and tooltips. */
export const popup = "min-w-48 rounded-(--radius) border border-border bg-popover p-1 shadow-lg";
const item = "rounded-(--radius) px-3 py-2 hover:bg-muted active:bg-muted";

function MoreMenu(props: { onRename: () => void; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <Menu
      offset={4}
      popupClass={popup}
      backdropClass="bg-black/50"
      trigger={
        <View accessibilityLabel="More actions" class="size-11 items-center justify-center rounded-full active:bg-muted">
          <Text class="text-foreground">⋯</Text>
        </View>
      }
    >
      <MenuItem onSelect={props.onRename} class={item}><Text class="text-foreground">Rename…</Text></MenuItem>
      <MenuItem onSelect={props.onDuplicate} class={item}><Text class="text-foreground">Duplicate</Text></MenuItem>
      <MenuSeparator class="my-1 h-px bg-border" />
      <MenuItem onSelect={props.onDelete} class={item}><Text class="text-foreground">Delete…</Text></MenuItem>
    </Menu>
  );
}
```

當使用者需要明顯看到還有更多命令時，例如工具列溢出選單、文件操作或帳戶選單，請選用 `Menu`。對於以選取項目或物件為範圍的命令，例如重新命名、複製、顯示位置或移除，請選用 `ContextMenu`。右鍵選單不可以是執行必要命令的唯一方法；應視情況提供選單列、工具列、鍵盤或詳細檢視的途徑。

不要為了讓畫面看起來簡約而把所有操作都放進選單。可發現性和速度很重要：主要操作保持可見，危險的項目要清楚標示並加以分隔，而同一個選單項目無論出現在何處，都應使用相同的動詞、圖示、快捷鍵、啟用狀態和結果。
<a id="button-means-application-action-link-means-external-resource"></a>

### Button 代表應用程式操作；Link 代表外部資源

當啟動後會改變應用程式狀態、確認決定、開啟工具、提交資料或執行指令時，請使用 `Button`。按所在位置的層級決定其樣式：

- 主要按鈕（primary）：用於決策區域內唯一需要強調的確認操作；
- 預設按鈕（default）：用於一般可見的操作；
- 外框按鈕（outline）：用於需要清晰邊界但強調程度較低的操作；
- 幽靈按鈕（ghost）：用於大家熟悉、強調程度低的工具列及行內操作；
- 圖示按鈕（icon）：只用於廣為人知的符號，並須設定無障礙名稱；若含義或作用範圍不明確，亦須加上 tooltip。

不要因為按鈕是畫面上唯一的操作、位於右上角，或團隊希望提高點擊率，就把它設為主要按鈕。主要按鈕代表預設的確認操作及其鍵盤行為。如果啟動後只是普通指令，例如新增項目、開啟工具或重新整理檢視，請按其所在層級使用預設、外框或幽靈按鈕。

只有在目標為外部資源時，才使用帶底線的連結（`role="link"`），例如 URL、網頁、線上文件或電郵地址。它使用手指指標游標，因為其約定是離開目前的應用程式環境前往該資源。不要為了讓功能性指令看起來低調而使用連結樣式。外觀像連結的刪除、儲存、重新整理、新增、開啟選單或應用程式內導覽操作，會隱藏控制項的可操作提示，並暴露錯誤的無障礙角色。

「檢視」二字不會令應用程式內的目的地變成連結。完整報告、分析、詳細資料面板或本機記錄，仍須透過按鈕、列、卡片、分頁或展開控制項開啟。當所在卡片已經說明會開啟甚麼內容時，請使用簡潔且配合情境的標籤，例如 `Full analysis`；底線只保留給確實會在瀏覽器或郵件程式中開啟的資源。

所有內部導覽，包括側邊欄項目、分頁、麵包屑、清單項目、開啟本機檢視或切換工作區，都必須使用導覽堆疊、`Button` 或相應的元件。視覺強調應透過按鈕的 variant 或導覽元件的選取狀態來設定，切勿以錯誤的語意來達到效果。

<a id="feedback-and-overlays"></a>

## 回饋與覆疊層

選擇最小而又適合該決策的介面：

- tooltip：簡短說明或快速鍵（[`Tooltip`](../elements/tooltip.md)，或任何元素的 `tooltip`）；
- popover：不打斷任務的情境控制項（[`Popover`](../elements/popover.md)）；
- 選單：精簡的操作清單（[`Menu`](../elements/menu.md)）；
- 通知：不需要作決定的非同步狀態；
- 對話框：需要專注處理的決定或簡短表單（[`Dialog`](../elements/dialog.md)）；
- 警示對話框：對影響重大的操作作明確確認（[`AlertDialog`](../elements/alert-dialog.md)）；
- sheet：需要更持久空間的輔助工作（[`Sheet`](../elements/sheet.md)）。

每種介面都會以裝置慣用的形式呈現，並源自應用程式所設計樣式的同一個結構（`popupClass`、`backdropClass`）：

| | 桌面電腦 | 手機及平板電腦 |
| --- | --- | --- |
| `Tooltip` | 指標停留在元素上之後 | 只在應用程式開啟時才顯示 |
| `Popover` | 錨定顯示；在外部按下會關閉它，而該次按下會繼續傳遞 | 錨定顯示；在外部按下只會關閉它 |
| `Menu` | 在觸發元素處彈出，支援層疊子選單 | 從底部彈出的 sheet；子選單會取代原有項目 |
| `ContextMenu` | 按滑鼠次要按鈕，在指標位置開啟 | 長按手指開啟 sheet |
| `Sheet` | 覆蓋在背景遮罩上的邊緣面板 | 相同 |
| `AlertDialog` | 平台對話框樣式的警示 | 系統的警示或動作 sheet |

tooltip 用來補充缺少的含義，而不是重複顯而易見的操作。只在符號不熟悉、作用範圍含糊，或有一個原本隱藏的實用快速鍵時才使用。訊息頁尾中重複出現、容易辨認的指令（例如複製和下載）需要無障礙名稱及鍵盤操作支援，但懸停標籤只會增加干擾而不會更清楚。手機只會在應用程式開啟時才顯示 tooltip，因此 tooltip 絕不可承載觸控用戶所需的資訊。

即使警示不會開啟強制回應視窗，也會打斷視覺層級。請只將它用於目前任務中需要注意的重要或特殊資訊，不要把它當作裝飾性容器來放置一般說明、提示或填補空白。若內容不需要立即留意或處理，請優先使用行內說明、淡色文字或一般區段。

避免疊加多個覆疊層。Escape 鍵和 Android 返回鍵會關閉最上層可關閉的圖層；請透過 `onOpenChange` 讓應用程式狀態保持同步，並將焦點移回觸發元素或下一個合理的目標。

覆疊層中的操作必須指向該覆疊層實際顯示的物件或狀態。例如，只有在可見獨立的最近記錄區段而且其中有項目時，才提供 `Clear history`。搜尋結果、最近項目和我的最愛是不同的集合；請為它們加上標籤並分隔開來，不要合併成一個沒有說明的清單。對不適用的操作，請將其隱藏，或停用並提供有用的原因，不要在頁尾放置含義不明的垃圾桶圖示。

頁尾空間並不是設計中沒有安排位置的功能的收容所。頁尾可以顯示快速鍵、狀態或適用於整個介面的操作，但每個項目都必須回答：它的對象是甚麼、為何現在可用、影響範圍是甚麼，以及啟動後哪些可見狀態會改變。

<a id="motion"></a>

## 動態效果

動態效果用來解釋變化，而不是環境裝飾。請使用簡短的轉場來表現出現、關閉、展開和空間連續性。如果以不透明度或 transform 已足以表達相同關係，就避免為大幅度的版面變化加上動畫。請遵從減少動態效果的偏好設定（`motion-reduce:`、`reduceMotion()`），絕不要求必須透過動畫才能理解狀態，也不要為每個元件加入預設動畫。

```rust tabs
view()
    .on_press(open)
    .transition_transform()
    .duration(150.0)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.97)))
```

```tsx tabs
<View onPress={open} class="transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100" />
```

動態效果的策略屬於應用程式層。`nsh/base` 負責轉場所需的生命週期機制或幾何資訊，但不會決定每個產品都要淡入淡出或滑動。請為各自獨立產生動畫的數值提供穩定的識別，並讓中斷的動畫從目前取樣的數值平滑反向，而不是從舊的終點重新開始。

動態效果須配合互動的連續性。當指標或捲動位置在相關目標之間移動時，請保持預覽介面穩定，並就地更新其內容或位置。只在互動結束後才關閉它；每次更新都重複淡出再進入，看起來會像閃爍。

<a id="designing-data-heavy-interfaces"></a>

## 設計資料密集的介面

密集不等於擠迫。在表格、樹狀結構、長清單和編輯器中：

- 保持標題及主要列識別在視覺上穩定；
- 對齊可作比較的數值，並在適當時使用等寬數字；
- 區分焦點、懸停、作用中的列和多選狀態；
- 讓排序和篩選保持可見且可還原；
- 在篩選和重新排序時，按領域識別保留選取狀態；
- 對大型集合進行虛擬化（`List`），同時不改變鍵盤語意；
- 對次要欄位和檢視器使用漸進式揭露；
- 提供實用的空狀態，說明下一步操作。

需要在一致的欄位之間作比較時，請選擇表格；需要瀏覽性質不同的項目時，選擇清單；具有真正的階層關係時，選擇樹狀結構。不要把複雜的資料版面當作視覺風格。

<a id="interface-language"></a>

## 介面語言

文字是介面架構的一部分。請把一項功能的詞彙當作一個系統來撰寫，涵蓋目的地、物件、指令、狀態和結果，而不是把實作功能逐一孤立地翻譯。在實際情境中，優先採用仍然準確的最短措辭。

<a id="let-context-carry-context"></a>

### 讓情境承載情境

不要重複周圍介面已經交代的資訊。側邊欄的目的地通常就是物件或領域本身：使用 `Users`，而不是 `User Management`；使用 `Shortcuts`，而不是 `Shortcut Configuration Management`。若某一欄的每一列已包含操作，可以省略籠統的 `Operation` 標題。標題為 `Delete “Roadmap”?` 的對話框，不需要在內文再次重複相同的提問。

這是情境精簡，並非為刪而刪。當文字會影響決定時就應加上，例如指出受影響的範圍、不可還原的後果、不尋常的前置條件，或復原的方法。每多一個字，都應回答目前版面尚未回答的問題。

目的地和物件使用名詞（`Users`、`Appearance`、`Orders`），指令使用動詞（`Save`、`Duplicate`、`Export`），狀態則使用形容詞或短語（`Offline`、`Up to date`、`Pending review`）。除非某個詞能區分真正的領域概念，否則避免使用 `Management`、`Module`、`Page`、`Function`、`Operation` 和 `System` 這類包裝詞。

<a id="write-each-language-do-not-translate-its-shape"></a>

### 撰寫每種語言，而不是翻譯其句式

從共同的意圖、層級和術語出發，再為每個語言地區撰寫自然的介面語言。不要保留來源語言的詞序、字數、客套的禮貌用語或語法類別。英文的 `Users` 可以表達一個中文功能概念，而該概念若按字面展開會變成「用戶管理」；忠實是指保留目的，而不是保留每個詞語。

刪去由所屬資訊架構已提供的詞語。在 `Settings` 介面中，目的地往往直接是 `Account`，而不是 `Account Settings`，更絕不會是不自然的單數 `Account Setting`。正確的英文標籤，是根據其角色和鄰近項目來選擇，而不是根據獨立的來源短語。

為反覆出現的物件、指令和狀態維護一個精簡的產品詞彙表。除非情境確實改變了含義，否則在工具列、選單、右鍵選單、對話框、快速鍵搜尋和文件中，都使用相同的術語。請在實際呈現的介面中檢視文案：相鄰的標籤往往會顯露出重複或範圍不一致的問題，這些問題單看語言檔案是發現不到的。

在本地化的技術文章中，當翻譯會降低精確度時，請保留已確立的框架術語。API 識別符須保持原樣，並以程式碼格式呈現。不要僅僅為了顯得專業而保留普通的外語詞彙。如有需要，在首次使用時解釋所保留的術語，然後在介面、文件和 API 範例中一律使用相同的形式。

在文件中，連結文字須使用具名 API、元件、原始碼檔案或指南的準確英文名稱，包括本地化頁面。例如，寫成 `View`、`Button`、`Menu` 和 `Text`，而不要翻譯其名稱，或加上多餘的 `NSH` 前綴。周圍的解釋文字則使用頁面所用的語言。只為具名目標加上連結；描述引用原因的詞語（例如「原始碼」）請放在連結之外。

在各語言版本共用的技術比較表中，功能名稱、框架名稱、API 名稱和模型名稱須保持其既定的英文形式。請翻譯表格周圍的說明，而不是表格內的技術標籤。在該比較表以外，已有既定本地名稱的常用介面詞彙仍可本地化。
<a id="buttons-and-confirmation-dialogs"></a>

### 按鈕與確認對話框

按鈕標籤預設應簡短，通常只有一兩個字，並描述結果，而不是操作手勢或元件本身。
優先使用 `Save`、`Move` 或 `Delete`，而非 `Click to save`、`Perform move` 或 `Confirm deletion`。對於離開而不提交的操作，請一律使用 `Cancel`。`OK` 僅用於確認純資訊性的內容。

簡短是預設做法，並非字數上限。當較長的標籤能說明後果，或能區分用戶原本可能混淆的選項時，刻意使用較長的標籤會更好，例如 `Delete from this group` 相對於 `Delete everywhere`, or `Restart without saving`。標籤的長度必須換來對決定有關鍵作用的資訊，不可重複對話框的標題或內文。

盡可能使用最具體而簡潔的結果作為確認標籤：

| 情境 | 較弱 | 建議 |
| --- | --- | --- |
| 刪除對話框 | `Yes`、`Sure`、`Confirm deletion` | `Delete` |
| 未儲存的變更 | `Confirm`、`Yes` | `Discard changes` |
| 純確認 | `Confirm operation` | `OK` 或 `Done` |
| 結果沒有明確動詞的複雜同意事項 | `Yes` | `Confirm` |

當周邊的對話框已完整說明某項複雜的承諾，而又沒有更短而準確的結果動詞時，`Confirm` 是可用的後備選項。它不應取代明確的指令。`Sure` 屬於口語，並非穩定的英文指令，意思過於含糊，不適合納入標準詞彙。

確認對話框應構成一個精簡的決定：

- 標題：決定或條件，例如 `Delete “Roadmap”?`；
- 內文：只提供新的範圍、後果或復原資訊；
- 操作：`Cancel` 與結果，例如 `Delete`；
- 破壞性樣式：套用於具破壞性的結果（即帶有 `destructive` 角色的 `AlertDialog` 操作），而不是用來取代精確的措辭。

當可以點出實際情況時，請避免使用 `Notice`、`Warning`、`Error` 和 `Confirmation` 這類泛用標題。
當結構或狀態已經傳達相關意思時，請避免使用「Are you sure you want to…」、「Would you like to…」、「Please note that…」和「successfully」等儀式性用語。禮貌應來自平靜而尊重的語氣，而不是重複的 `please`。

<a id="capitalization-punctuation-and-symbols"></a>

### 大小寫、標點與符號

英文 UI 預設使用句首大寫：應為 `Reset layout`，而非 `Reset Layout` 或 `RESET LAYOUT`。專有名詞和既定的縮寫須保留原樣。只有在平台整合能從中受益時，才為原生選單命令遵循平台慣例（例如標題式大寫），並在同一類元件內一致套用。

全大寫可為極短的區段標籤、眉題、狀態、既定縮寫及類似程式碼的識別名稱提供克制的字體強調。其緊湊的外形和適度的字距可形成與粗體相近的層級，但不適用於按鈕、長標題、句子或密集的清單。請勿在同一區域同時使用大寫、強烈色彩和粗體字重，也不要自動轉換每一個字串：產品名稱、縮寫和本地化內容必須保留其預期的大小寫。

標籤、按鈕、選單項目、分頁、標題、佔位文字和簡短狀態不加句號。完整的說明、警告和錯誤句子則要加。在一般的成功與失敗訊息中避免使用感嘆號。在中文中，句子使用全形標點，而簡短的控制項標籤則依相同的語意規則省略句末標點。

使用單一省略號字元（`…`），而不是三個句點。凡是會開啟對話框、面板或獨立視窗的按鈕或選單項目，以及需要更多輸入或選擇才能完成的命令，例如 `Settings…` 或 `Export…`，都要加上省略號。立即執行的命令則不加省略號。請使用不確定進度指示器來表示正在進行的工作，而不是裝飾性的點點。

錯誤訊息應說明發生了甚麼事，並在有用時提供下一步的復原操作。成功回饋只有在該狀態尚未顯示於畫面時，才需要說明結果狀態。優先使用 `Couldn’t save. Check your connection and try again.`，而非技術代碼或冗長的道歉；當文件已明顯變為已儲存時，請省略 `Saved successfully` 提示訊息。

<a id="internationalization-and-platform-fit"></a>

## 國際化與平台適配

無障礙（A11y）名稱和標籤可保留英文；這些字串不必本地化。當為作用於某個項目的控制項命名時，即使該項目的標籤已本地化，也請沿用該項目本身的標籤。此例外不適用於可見的 UI 文案。

文案必須能應付文字擴展、CJK 排版、由右至左的文字，以及不同的快捷鍵標記方式。不要只依據一個英文標籤來決定控制項的大小。不要把文字放進點陣圖資源，避免串接已翻譯的片段，並且只在產品定義了復原途徑（例如工具提示）的情況下，才讓標籤換行或截斷。

請尊重帶有意義的平台差異：Command 與 Control、原生視窗裝飾、系統外觀、捲軸行為、選單、通知功能，以及在手機上的系統標題列、返回手勢和提示框。保持產品的資訊架構在各平台之間穩定，但不要為了表面上的像素一致而抹去用戶熟悉的平台行為。

NSH 應用程式可在手機、平板、桌面和網頁上運行，而且經常嵌入在宿主應用程式之內。請為每一種環境設計：

- **系統 UI 保持平台的外觀。** 在 iOS 和 Android 上，頁面的標題列由系統提供（`NavPage` 的 `title` 及標題列選項）；桌面和網頁則顯示由應用程式繪製的頁面 `header` 插槽。每個頁面兩者都要提供（[導覽](./navigation.md#navpage-and-the-header)）。確認操作使用 `AlertDialog`；狀態列跟隨最上層的頁面或對話框（`statusBar`）。
- **宿主的主題。** 嵌入式應用程式可以採用其宿主的主題；讀取 token 的類別和 Rust bindings 會原生地跟隨該主題（[主題 token](./tailwind.md#theme-tokens)）。
- **安全區域與鍵盤。** 讓內容保持在安全區域之內（`env(safe-area-inset-*)`、`safeAreaInsets()`），並讓輸入欄位位於軟鍵盤之上（`env(keyboard-inset-height)`）（[裝置與環境](./device-and-environment.md)）。
- **外觀、文字大小與動態效果。** 每個介面都要在淺色和深色模式下（`dark:`、`colorScheme()`）、在用戶設定的文字大小下，以及在減少動態效果的設定下（`motion-reduce:`、`reduceMotion()`）正常運作。
- **由右至左。** 版面方向跟隨地區設定，而 `direction` 樣式可為某個視圖及其子樹設定方向；起始與結尾屬性會鏡像翻轉（[由右至左](./layout.md#right-to-left)）。
- **觸控與指標。** 觸控目標至少為 44 × 44 點；懸停和工具提示只在有指標時才存在。

```rust tabs
use nsh_base::nav_page;

nav_page()
    .title("Inbox")
    .header(page_header("Inbox"))
    .child(inbox())
```

```tsx tabs
import { NavPage } from "nsh/base";

<NavPage title="Inbox" header={<PageHeader title="Inbox" />}>
  <Inbox />
</NavPage>
```

<a id="guidance-for-ai-generated-interfaces"></a>

## AI 生成介面的指引

AI 在修改 NSH 介面時，應先檢視最相近的功能、應用程式的元件和主題 token，以及元件文件和宣告（`.nsh/types`）。在產生程式碼之前，它應先說明主要任務、狀態擁有者、元件組合，以及鍵盤和觸控的操作路徑。它不得從 React、React Native 或 Shadcn 的範例推斷 API，也不得因為名稱看似合理就自行創造 NSH 的 prop 或方法；`nsh check` 和建置時的類別檢查會報告不存在的項目。

在人類能夠解釋層級、密度、元件選擇和特殊字面值為何適合本產品之前，AI 的輸出都不算完整。外觀看似合理的截圖並不能作為證明：鍵盤與觸控行為、焦點、動態內容、主題、調整大小、文字大小和失敗狀態，全都屬於設計的一部分。

<a id="accessibility-checklist"></a>

## 無障礙檢查清單

在認定畫面完成之前，請確認：

- 每個操作都可透過鍵盤、觸控和螢幕閱讀器到達並操作；
- 焦點順序符合視覺順序和任務順序；
- 焦點保持可見，並在覆蓋層關閉後恢復；
- 控制項具有無障礙名稱；當僅有圖示的控制項其意義、範圍或快捷鍵需要說明時，使用工具提示；
- 文字和具意義的邊界有足夠的對比度；
- 狀態不僅以顏色傳達；
- 停用和唯讀狀態可以區分；
- 標籤、錯誤和說明保持在其控制項附近；
- 在較長的譯文、由右至左及較大的文字下，內容仍可使用；
- 觸控目標至少為 44 × 44 點，而即使在密集的版面中，指標目標的大小也要舒適。

<a id="design-review-checklist"></a>

## 設計審查檢查清單

審查並不是列出元件清單，而是判斷介面是否作出了正確的決定。請依序提問：

1. **任務是否清晰？** 新用戶是否無需學習、猜測或試誤，就能辨識用途、主要操作和下一步？
2. **每個操作是否都兌現承諾？** 標籤、控制項、狀態、範圍、回饋和結果，是否描述同一個一致的結果？
3. **層級是否果斷而克制？** 核心功能是否獲得應有的空間，而強烈的色彩、粗體字、徽章、警示和主要按鈕仍然稀少？
4. **介面能否做得更少、更好？** 能否在不削弱完整任務的前提下，移除、合併或延後某個入口、選項或狀態？
5. **結構是否精確？** 同級元素是否共用對齊基準線、相等的間距是否在渲染後的像素上仍然相等，以及捲軸是否位於其實際捲動區域的邊緣？
6. **是否遵循元件系統？** 標準控制項是否保留其幾何形狀、狀態、鍵盤行為和關閉模式，而外觀由主題和比例 token 提供？
7. **在每種狀態和限制下是否仍可使用？** 請驗證鍵盤、觸控和焦點行為、空白／載入中／失敗／權限狀態、較長的譯文、較大的文字、由右至左、兩種外觀、最小視窗大小和減少動態效果。
8. **是否已在真實平台上測試？** 請在每個發佈平台上，使用真實的元件、文案和具代表性的內容完成任務（`nsh run --target …`、`nsh test --target …`），而不只是理想中的截圖。
