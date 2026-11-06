---
title: "設計指南"
description: "使用 Native Shell 建置應用程式時的產品與互動設計指引：視覺層級、色彩與 token、間距、資訊密度、元件、互動狀態、浮層、動態效果、資料密集型檢視、介面文案，以及平台適配。"
order: 29
group: ui
source_hash: 4296bdbce6ed3911
---

# 設計指南

在為使用 Native Shell 建構的應用程式選擇元件或撰寫版面程式碼之前，請先閱讀本指南。它記錄了 GPUI Kit 多年來在桌面應用上累積的產品判斷，並延續到 NSH：介面應該有原生感、克制、精確，且不需要猜測就能理解。

本指南為規範性文件。**必須（Must）** 表示正確性或生態系的限制，**應該（should）** 是預設做法，若要覆寫需有具體理由，**可以（may）** 則是選用的技巧。個別 props 與方法仍以 [Elements](../elements/index.md) 與 [API](../modules/index.md) 頁面為準。

這些規則建立在 `nsh/base`（Rust 中為 `nsh_base`）的行為、主題及其 token，以及各平台使用者已經熟悉的互動方式之上。NSH 以各平台自身的 UI 進行渲染，外觀則交由應用程式決定：`nsh/base` 的元件提供行為、狀態、焦點與無障礙支援，而每一種顏色、尺寸、圓角與間距都來自應用程式自己的元件，因此這些規則是用來指引應用程式的設計系統。<a href="https://ui.shadcn.com/docs" target="_blank" rel="noopener noreferrer">shadcn/ui</a> 提供了實用的方法（開放原始碼、組合，以及可靠的預設值），但並不決定 NSH 應用程式應該長什麼樣子。當各種影響來源互相衝突時，請保留平台的行為，以及人們已經理解的互動方式。

<a id="design-thesis"></a>

## 設計主張

打造有原生感、安靜且精確的介面。讓內容、層級與互動來承載體驗；裝飾應該輔助它們，而不是與它們競爭。

1. **先求清晰，再談個性。** 在加入品牌表達之前，先讓主要任務與下一步動作清楚明確。
2. **先組合，再發明。** 從既有元件開始，將它們組合成產品專屬的工作流程。只有在行為真正全新時，才建立新的基礎元件。
3. **先用 token，再用數值。** 顏色、圓角、字型與間距應構成一個系統。避免使用無法隨主題變化的孤立字面值。請參閱 [Styling](./styling.md)、[Tailwind](./tailwind.md) 與 [the theme](./rust.md#theme)。
4. **平台優先於網頁慣例。** 在桌面平台上，當任務能從中受益時，請保留鍵盤操作、視窗外框、選單、高密度資料檢視、可調整大小的區域與常駐導覽；在手機與平板上，則保留系統的標頭、返回手勢、警示與觸控目標。
5. **狀態必須可見。** 懸停、按下、焦點、選取、停用、載入中、驗證與破壞性狀態，都需要明確且一致的呈現。
6. **幾何形狀說明包含關係。** 圓角、內縮與邊界應描述同一個連貫的層級，即使各表面互相重疊也是如此。
7. **回饋反映真實狀況。** 載入、工具提示與動態效果應釐清真實的狀態或轉場，而不是為即時的動作增添儀式感。

<a id="learning-from-shadcn"></a>

## 從 Shadcn 學到的事

Shadcn 最有價值的貢獻並不是某種特定的邊框顏色，而是一種建構系統的方式：

- 掌握介面的最上層，而不是與封閉的抽象層對抗；
- 將小而可預期的部件組合成產品專屬的元件；
- 提供本身就構成單一視覺語言的預設值；
- 讓程式碼與組合方式對人與 AI 都清晰易讀；
- 將行為基礎元件與樣式層分開。

NSH 透過 `nsh` 的基礎元件、`nsh/base` 的無樣式基底元件，以及屬於應用程式的樣式層，這三者的劃分來落實這些理念（[Three layers](./architecture.md#three-layers)）。應用程式以 `nsh/base` 為基礎建構自己的元件，無論是用 TSX 還是在應用程式的 Rust crate 中；可重用的行為屬於 `nsh/base`，而視覺策略則維持在其上層。

請不要盲目照搬這些網頁假設：

| 網頁慣例 | NSH 預設做法 |
| --- | --- |
| 每個按鈕都使用手指指標游標 | 預設游標；只有連結使用手指指標（`cursor-pointer`） |
| 以頁面導覽作為主要結構 | 桌面平台使用常駐的視窗、窗格、側邊欄、分頁與選單；手機上使用搭配系統返回的 `NavStack` |
| 以瀏覽器的焦點與捲動作為備援 | 明確的焦點歸屬與由區域掌管的捲動（`Scroll`、`List`） |
| 行動優先的單欄版面 | 手機上為單欄；桌面平台上為可調整大小、且定義了最小視窗尺寸的殼層 |
| 懸停時才顯示關鍵動作 | 不依賴懸停，可透過鍵盤、觸控與指標觸及的動作 |
| 一排僅在懸停時出現的圖示按鈕 | 一個可見的主要動作，加上用於次要指令的 `Menu` 或 `ContextMenu` |
| 以連結樣式的文字作為應用程式指令 | 使用應用程式預設、outline 或 ghost 樣式的 `Button`；連結樣式僅用於 URL、網路資源或電子郵件地址 |
| 處處使用大尺寸的觸控密度 | 觸控螢幕使用觸控尺寸的目標；使用指標時採中等密度，只有在資訊作業能受益之處才採緊湊密度 |
| 每個平台都自行繪製標頭與警示卡片 | iOS 與 Android 使用系統的標頭與 `AlertDialog`；桌面平台與網頁使用頁面的 `header` 插槽 |
| 以 CSS 覆寫所有後代元素 | 應用程式的元件、其組成部件，以及主題的 token |

<a id="start-from-the-task"></a>

## 從任務出發

在繪製畫面之前，請先寫下：

- 使用者的主要任務；
- 被檢視或被修改的物件；
- 必須隨時可立即使用的動作；
- 做出決定所需的資訊；
- 空白、載入中、錯誤、離線、唯讀與權限不足等狀態；
- 工作流程中的鍵盤、觸控與螢幕閱讀器路徑；
- 應用程式的呈現位置：獨立顯示，或嵌入在宿主應用程式中。

請圍繞這些答案來組織畫面。不要從儀表板格線或元件目錄開始。好的介面會呈現使用者的心智模型：文件、帳號、專案、訊息、設定，或其他穩定的物件，而不是內部的服務架構。

在分配控制項之前，先設計主要任務。它的視覺份量、位置與資訊深度，應與它在產品中的重要性相稱。核心結果不應被縮減成一個小小的數字、角落的圖示或薄弱的頁尾動作，而次要內容卻占滿頁面。當結果集合是產品的主要價值時，可考慮設置一個摘要區域或卡片，呈現數量、代表性的結果、有意義的狀態，以及明確的下一步動作。

對於每一個提議的動作，請說明它可見的物件、目前狀態、範圍與結果。如果介面沒有顯示或明確暗示這些內容，這個動作就還為時過早。不要只因為後端具備某項能力就把它暴露出來；請先設計該物件如何進入使用者的心智模型。

<a id="visual-language"></a>

## 視覺語言

<a id="hierarchy"></a>

### 層級

偏好少數幾個清楚的層級：

- **視窗或頁面標題** 標示目前的物件或工作區；
- **區段標題** 區隔有意義的區域（`role="header"`，讓螢幕閱讀器可以在其間跳轉）；
- **內文** 承載實際的工作內容；
- **弱化文字** 提供次要的中繼資料與說明；
- **標籤** 標示控制項與數值。

在加入顏色或容器之前，先運用大小、字重、間距與分隔線。避免在卡片中再巢狀放置卡片：大多數區域只需要一個背景、一條細線邊界，以及經過考量的間距。

請從整個功能的角度評估層級，而不是逐個元件評估。審查時先隱藏強調色與裝飾：僅憑結構，主要任務、目前的選取項、結果摘要與下一步動作仍應一目了然。一個畫面即使包含各自看來合理的控制項，若它們沒有構成單一的閱讀順序與單一的決策路徑，仍然是失敗的。

請把強調視為有限的預算。局部的表面只需要一個明確的焦點，而不是一片互相競爭的高亮。如果所有東西都上色、加徽章、加粗、加框，或被提升為警示，就沒有任何東西顯得重要。先以結構與鄰近性建立優先順序；只有當某個區別會改變使用者的注意或行動時，才動用更強的顏色與元件。

<a id="color-and-themes"></a>

### 顏色與主題

從主題讀取顏色（Rust 中使用 `theme()`，TSX 中使用 token class），並依語意角色使用：

- 主要表面與文字使用 `background` 與 `foreground`；
- 各自命名的表面使用 `card`、`popover`、`sidebar` 及其前景 token；
- 輔助資訊使用 `muted` 與 `muted-foreground`；
- 主要動作或選取強調使用 `primary`，較安靜的強調，以及被懸停或聚焦的列，使用 `secondary` 與 `accent`；
- `destructive` 僅用於破壞性動作與錯誤，而應用程式加入主題的狀態色（`success`、`warning`）僅用於其對應的意義；
- 資料數列使用 `chart-1` 到 `chart-5`；
- 結構與互動使用 `border`、`input` 與 `ring`。

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

不要把語意狀態色當作裝飾使用。不要只靠顏色來傳達意義。請在淺色與深色主題下，以及自訂主題值下（包括嵌入你應用程式的宿主應用程式之主題），驗證每個自訂表面；永遠不要假設前景是黑色或背景是白色。

徽章適用於簡短的狀態、數量或分類，且這些資訊能受益於快速掃視；不要用於每個標籤、中繼資料值、篩選條件或區段標題。多數徽章應保持中性；語意色只保留給真正帶有成功、警告、破壞性或資訊意義的狀態。一排多彩的徽章，通常意味著缺少層級或分組的決策。

應用程式 UI 不應包含原始的十六進位值、`rgb()`/`rgba()` 或 `hsl()` 顏色，也不應包含 `bg-zinc-100` 之類的調色盤 class。請依語意角色從主題解析顏色。如果所需的角色不存在，請在應用程式的主題檔中定義它（[Theme tokens](./tailwind.md#theme-tokens)：在其 `light` 中的 `"up": "#16a34a"` 與 `dark`，會在 TSX 中產生 `text-up`、`bg-up/30`、`token("up")`，在 Rust 中產生 `theme().color("up")`），而不是在呼叫處嵌入調色盤的值。原始顏色只應出現在主題定義內，或顏色本身即為資料、且經過審核的資料／點陣內容中。

<a id="radius-spacing-and-density"></a>

### 圓角、間距與密度

使用有限的圓角比例，就像字型與控制項尺寸一樣。請從主題的 `radius`（控制項與表面皆適用，`rounded-(--radius)`）、應用程式加入主題的圓角，以及 Tailwind 的 `rounded-sm` … `rounded-2xl` 之間的值中選擇，而不是為每個元素各自發明圓角。大型容器可以使用比其內含控制項更柔和的層級；緊湊的控制項與浮層則使用更緊的層級。對於一般的矩形，圓角應明顯小於其短邊的一半。`rounded-full`（`.rounded_full()`）只用於刻意設計的圓形與膠囊形；工具提示不應意外變成膠囊形。

巢狀的表面應呈現為同心的形狀。請使用 `inner radius ≈ max(0, outer radius − gap)` 來選擇最接近且合適的圓角；可見的間隔帶在轉角處應保持均勻。如果重複出現的組合需要中間值，請在主題中加入具名的 token（`"radius-inset": "0.375rem"`、`rounded-(--radius-inset)`）。分段控制項是單一的輪廓：兩端的分段依循容器的內側圓角，中間的分段保持方正，且每個邊界只有一條粗細一致的分隔線。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/radius-hierarchy-light.svg" alt="Light theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
<img class="diagram diagram-dark" src="/diagrams/radius-hierarchy-dark.svg" alt="Dark theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
</div>

圓角必須管轄整個可見的表面，而不只是它的邊框。露出的轉角要保持對其後方表面透明；子元素的背景、選取填色與捲動內容也必須依循該邊界。請為內部表面指定自己的圓角，或以 `overflow-hidden`（`.overflow_hidden()`）裁切容器，然後在兩種主題下，對照對比強烈的背景檢查該組合。選擇裁切方式時，請保留向外的焦點環。

請使用精簡的間距比例並重複使用。相關的標籤／控制項配對應比不同的群組更靠近；不同的群組應比不同的區段更靠近。優先採用應用程式元件的尺寸（小、預設的中、大），而不是一次性的高度。緊湊變體用於工具列與資料密集的畫面，不要用它來把不清楚的版面硬塞進更小的空間。

共用的語意比例刻意保持精簡：間距大致依 2、4、8、12、16、24 與 32 點遞進，而字型大小則維持在約 12、14、16、18 與 20 點附近。請將這些視為彼此之間的關係，而不是允許把它們目前的數值散落在功能程式碼各處。Tailwind 的間距比例提供了這些值：一級為 4 點（`p-4` 即 16pt），在 class 與具型別的 Rust 方法中皆然；`nsh.json` 的 `"tailwind"` 中的 `"spacing"` 會改變 class 的級距，而具型別的方法則沿用 Tailwind 的預設比例。需要不同比例的應用程式，應在自己的元件或主題 token（`p-(--gap-card)`）中擁有該比例，並一致地使用它。
<a id="spatial-grammar"></a>

### 空間語法

間距用來表達關係。判斷兩個元素彼此之間的意義，再從語意化的級距中選擇間隙：

| 關係 | 典型 class | 目前級距 | 範例 |
| --- | --- | --- | --- |
| 視覺修正 | `gap-0.5` | 2 pt | 圖示基線、精簡分隔線 |
| 同一控制項的各部分 | `gap-1` | 4 pt | 選單圖示/標籤、標題/說明 |
| 密切相關的控制項 | `gap-2` | 8 pt | 按鈕圖示/標籤、對話框動作 |
| 同一內容群組 | `gap-3` | 12 pt | 通知的欄位、精簡表單列 |
| 同一區段中的不同群組 | `gap-4` | 16 pt | 面板內距、表單群組 |
| 不同區段 | `gap-6` | 24 pt | 頁面或 inspector 中的主要區塊 |
| 主要區域邊界 | `gap-8` | 32 pt | 空狀態的留白、頁面分帶 |

這些數值描述的是預設級距，而不是要逐字重複使用的常值。請使用間距 class 與具型別的方法（`gap-2`、`.gap_2()`、`p-4`、`.p_4()`）或主題的 token。產品自有的級距應保留順序與關係，並透過應用程式自己的元件傳遞，而不是寫在每個呼叫處。

解析水平與垂直空間時，請遵循以下規則：

1. **先內後外。** 元件的內距屬於該元件；元件之間的間隙屬於它們的父層。
2. **垂直節奏顯示分組。** 標題與其說明之間的間隙，小於該說明與下一個區段之間的間隙。相等的間隙意味著相等的關係。
3. **水平空間有助於掃視。** 重複的列應讓圖示、標籤、數值、徽章與尾端動作維持在穩定的欄位上。
4. **前端與尾端具有語意。** 以閱讀順序的邊緣思考，並以 start 與 end 撰寫（`ps-*`、`me-*`、`.ps_4()`），使版面能在由右至左的語系中鏡像。
5. **不要重複內距。** 放在已有內距之面板中的卡片，不應自動再加上一整份面板內縮。
6. **謹慎使用視覺對齊。** 對圖示或字形幾何做一到兩點的修正是合理的，但需記錄其與級距不同的原因。

常見的組合說明了這些關係：

- 按鈕內容在小尺寸使用 4 pt，在一般尺寸使用 8 pt；
- 對話框的標頭與頁尾使用 8 pt 的內部間隙；
- 精簡的清單與選單列使用 4 pt 垂直內距與 8–12 pt 水平內距；
- sheet 標頭使用約 16 pt 的前端與 12 pt 的尾端空間，為關閉按鈕留出位置，而頁尾使用 16 pt 水平與 12 pt 垂直空間；
- 通知使用 16 pt 水平內距與 12 pt 欄間距，因為圖示、訊息與動作是各自獨立的群組。

不要把這些當成適用於每個介面的複製貼上範本。它們揭示的是系統：控制項內部較緊湊，列以便於掃視為優先，而容器在邊界處花費的空間多於內容之間。

<a id="proportion-and-layer-hierarchy"></a>

### 比例與層級階層

先從內容需求出發，再設定比例。當某個窗格的角色明顯不同時，避免任意對半分。

- 導覽側邊欄應寬到足以穩定顯示標籤，但在視覺上明顯從屬於工作區。請提供最小、偏好與最大寬度（`min-w-*`、`w-*`、`max-w-*`），而不要只使用百分比。
- 在主從式版面中，讓集合維持易於掃視，並把多餘空間給予詳細資料窗格。大約三分之一／三分之二的起始比例通常很實用，但內容限制才是最終依據。在手機上，兩者會變成 `NavStack` 的兩個頁面。
- Inspector 與輔助 sheet 預設不應遮蓋主要物件。當其內容增長時，它們應可調整大小或可關閉；[`Sheet`](../elements/sheet.md) 會隨著背景遮罩、Escape 與返回而關閉。
- 對話框寬度取決於決策：簡短確認使用 `AlertDialog`、中等大小的表單，或為複雜工作使用專用視窗／頁面。不要只為了製造留白而加大對話框。
- 把最強的 elevation 保留給最上層的決策圖層。在同一圖層內，使用背景與細線，而不是逐漸加大的陰影，來表現階層。

為每個主要區域定義三項尺寸限制：任務仍能運作的最小值、舒適的預設值，以及如何吸收多餘空間。當分割比例代表工作流程偏好時，請將使用者控制的分割持久化，並依目前視窗對還原的值進行限制。

<a id="alignment-details"></a>

### 對齊細節

對齊是一套結構性系統，而不是最後的修飾步驟。為每個介面建立一小組對齊軸線：共用的前端與尾端邊緣、文字基線、中心線，以及固定的功能欄位。同一層級的元素，即使是不同的元件類型，也應從上到下或從前端到尾端貼齊同一條軸線。

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/alignment-spines-light.svg" alt="Alignment spines across a content region">
<img class="diagram diagram-dark" src="/diagrams/alignment-spines-dark.svg" alt="Alignment spines across a content region">
</div>

垂直紅線位於內容、狀態、時間與尾端動作的共用邊緣或控制項中心旁。水平線位於文字基線下方，或穿過列的中心，以顯示底部對齊與垂直置中對齊。精簡比較圖則單獨呈現一個渲染像素的偏移，這種偏移必須在其結構擁有者處修正。

- 讓同層的區域共用內容內縮。描述同一層級的標題、工具列、清單列、空狀態與頁尾，不應各自發明略有不同的前端邊緣。
- 在整個區域中重複欄位幾何。標頭、列、摘要、載入狀態與行內編輯器，應為身分、中繼資料、狀態、數字與動作保留相同的欄位。
- 跨列與跨區段對齊相關的控制項。由上到下掃視頁面時，表單標籤、欄位、說明與驗證訊息應呈現穩定的垂直格線。
- 保持水平帶的一致性。共用同一個工具列、標頭、狀態列或列的項目，應使用同一條基線或中心線，而不是各自微調偏移。
- 只有在真正具有階層、包含或展開關係時才使用縮排。裝飾性的縮排會讓同層項目看起來像從屬關係，並破壞介面的閱讀線。
- 當巢狀層級結束時，要精確地回到父層的軸線。不要讓累積的內距在巢狀容器間漂移。
- 即使內容是選用的，也要保留軸線。缺少圖示、徽章、說明或尾端動作時，不得移動其餘的標籤；當跨列比較很重要時，請使用刻意設計的插槽或欄位。
- 當階層相符時，讓主要區域彼此對齊。側邊欄標頭、內容標題、分割窗格、工具列與底部列不必共用每個座標，但處於相同層級的部分應形成連續可見的線條。

並非每個邊緣都應該對齊。子項可以縮排，主要數值可以領先其輔助中繼資料，具破壞性的決策也可以增加間隔。這些例外必須傳達階層或意義，而不能是各元件內距未經協調的結果。先從共用軸線開始，再明確地設定例外。

將精確對齊與重複的間隙視為品質不變條件。當兩個邊緣或兩段空間應該相等時，一個渲染像素的差異就是缺陷，而不是可接受的視覺近似。請在具代表性的視窗大小、文字大小與顯示縮放比例下，使用量測工具檢查解析後的邊界。比較座標與距離，不要只憑隨意的螢幕截圖就認可對齊。

渲染像素的容許誤差是一條驗證規則，並不是允許以原始的點數偏移來修補程式碼。相等的關係應從同一個間距 class 或方法、token、格線定義，或共用的元件內縮解析而來。當它們不同時，請修正共同的擁有者。要考慮小數的版面配置與裝置捨入（2× 與 3× 的手機、小數的桌面縮放），讓預期的軸線落在同一個實體像素上，而不是在特定縮放比例下漂移。

- 當不同大小的文字共處一列時，以基線對齊，而不是以邊界框中心對齊。
- 將圖示置中於固定的插槽中，使標籤不會因圖示的固有寬度不同而移動。
- 可比較的數字向 end 對齊並使用等寬數字（`tabular-nums`）；散文與識別碼向 start 對齊，除非語系另有要求。
- 讓列尾端的動作與展開指示器維持在固定寬度的欄位中。
- 以控制項的互動框架對齊表單控制項，而不是以其下方的說明文字對齊。
- 只有在兩側確實各自擁有相對的邊緣時，才使用 `justify-between`（`.justify_between()`）；它不應用來掩飾中間缺少的結構。
- 細線屬於邊界的擁有者。兩個相鄰的區域不得各自繪製同一條分隔線。
- 捲軸屬於會捲動的區域，並貼靠在該面板、編輯器或視窗的尾端邊緣。內容內距可以讓文字與列內縮；但不得把捲軸拉到介面中間。請為捲動視圖的內容加上內距，而不是為捲動視圖本身。

<a id="density-tiers"></a>

### 密度層級

Medium 是預設值。請為整個區域性情境一併調整密度，而不是只調整單一孤立的控制項：

- **comfortable / large：** 新手引導、稀疏的表單、需要突顯的決策；
- **standard / medium：** 大多數應用程式 chrome 與工作流程，以及所有觸控螢幕；
- **compact / small：** 桌面工具列、選單、表格與重複的專業資料；
- **extra compact / xsmall：** 例外的高密度工具，絕不是整個應用程式的自動選擇。

請使用有界的級距，而不是任意的尺寸。在觸控螢幕上，每個可按壓的目標至少為 44 × 44 點（[Touch targets](./accessibility.md#touch-targets)）。使用指標裝置時，按鈕通常在約 24、28 與 32 pt 的框架間變化，輸入框在 large 尺寸下延伸到約 40 pt，而表格列約為 28、32 與 40 pt。請讓應用程式元件的尺寸同時改變字型、圖示、內距與點擊目標；只改變外框高度的自訂高度通常並不完整。

<a id="text-size-base-font-and-points"></a>

### 文字大小、基準字型與點數

設計良好的級距能在文字變大時保留階層。當標題與內文、控制項與圖示、內外間距、主要與次要區域之間的關係，在每個大小下感覺都相同時，放大文字才算成功，而不僅僅是所有物件都變大。

NSH 的長度單位是點數，而使用者的文字大小（iOS 上的 Dynamic Type、Android 上的字型大小、桌面系統的文字縮放，或宿主應用程式自己的設定）會縮放文字：每個允許字型縮放的文字與輸入框都會變大，而間距、圓角半徑、邊框與影像則維持原本大小（[Text size](./device-and-environment.md#text-size)）。應用程式的基準文字大小（Tailwind 的 `text-base`，16 點）是型別級距所圍繞的內文大小。

以比例來設計：

- 型別級距圍繞基準內文大小，維持相同的階層；
- 間距級距圍繞文字，維持相同的分組關係；
- 控制項框架與點擊目標隨其標籤成長：依其內容與最小值（`min-h-11`）決定大小，而不是使用固定高度；
- 窗格的最小值與舒適寬度要考量較大的文字；
- 圓角半徑與焦點樣式與控制項框架保持視覺一致。

由於文字會自行放大，圍繞它的固定框架就會失效：固定高度按鈕內較大的標籤、固定窗格最小值內較大的文件，或固定列高內較大的列，都會破壞原有的節奏，甚至可能裁切內容。當文字變大時，讓列換行或切換為單欄（`fontScale()`、`font_scale()`），並對本來就很大的文字限制其縮放比例，例如 34pt 的標題（`maxFontSizeMultiplier`）。

原則上，應用程式版面不應寫入字面的點數值（`p-[13px]`、`px(13.0)`）。請使用間距級距（`p-2`、`gap-3`、`w-64`、`text-sm` 及其具型別的方法）或應用程式的元件尺寸。只有當數值代表實體或點陣的邊界時，才使用字面點數：細線、平台視窗內縮、點陣圖尺寸、最小點擊測試容差，或必須與外部介面相符的幾何。這些屬於經過稽核並有文件記錄的例外。產品的間距、字型、圖示大小與一般控制項幾何都應維持在級距上。

請在多種文字大小下測試，而不只是預設大小。驗證階層、換行、截斷、最小視窗大小、窗格調整大小、焦點環的間隙、彈出視窗的位置，以及清單列的量測。
<a id="surfaces-and-elevation"></a>

### 表面與層級

使用層級來說明堆疊關係，而非重要性。基底表面是平的，以分隔線與背景對比來界定各區域。Popover、選單、Sheet、對話框與通知因為位於其他內容之上，可以使用逐級加強的陰影。不要為每張卡片都加上陰影。

同類的表面應共用同一種處理方式。為彈出類元件提供同一套主題化表面（`popover` token、邊框、`radius` 以及一種陰影），使 `Popover`、`Menu`、`ContextMenu` 與 `Tooltip` 不會各走各的樣式。當應用程式自行設計另一種錨定表面時，請重用這套處理方式，而不是用無關的邊框與陰影字面值去近似它。

<a id="typography-and-icons"></a>

### 字體與圖示

介面文字使用平台的 UI 字體，等寬字體僅用於程式碼、識別字、快速鍵與需要對齊的數字資料。保持內文易讀，避免過度使用大寫或字距調整，對中日韓文字尤其如此。

一個產品只使用一套圖示。圖示是標籤的補充，不應以猜測的方式取代不熟悉的操作。僅有圖示的按鈕一律需要無障礙名稱（`accessibilityLabel`），其視覺說明則依下方的 tooltip 政策處理。使用實心或有色圖示來傳達狀態，而不只是為了讓工具列顯得活潑。

<a id="layout-patterns"></a>

## 版面配置模式

<a id="choose-a-stable-shell"></a>

### 選擇穩定的外殼

大多數應用程式應採用下列其中一種外殼：

- **單一工作區：** 一個標頭或工具列位於一個主要檢視之上；
- **導覽堆疊：** 頁面以推入與彈出的方式切換（`NavStack`），在手機上搭配系統的返回手勢；
- **側邊欄工作區：** 常駐導覽位於不斷變換的詳細檢視旁；
- **主從式（master–detail）：** 可調整大小的集合窗格與詳細窗格，在手機上則為兩個頁面；
- **文件工作區：** 以分頁呈現多個長期存在的物件；
- **工具視窗：** 專注於單一任務，操作路徑簡短且固定。

內容變動時，全域導覽應保持穩定。使用 `flex-1`（`.flex_1()`）讓主要工作區取得剩餘空間，並在溢出的子元素必須收縮時搭配 `min-w-0` / `min-h-0`。請依 `Scroll` 與 `List` 的設計用途使用它們，而不是以巢狀檢視重新打造捲動或虛擬化機制。

在桌面平台上，應用程式自訂的標題列（[`nsh/desktop`](../modules/nsh-desktop.md)）首先是視窗外框。請保留其拖曳區域（`.window_drag(true)`），並避免將一般的標題點擊綁定到不常用的編輯命令。重新命名應放在明確的物件命令之後，並在適當時提供鍵盤路徑。

<a id="responsive-windows"></a>

### 響應式視窗

視窗可以是任何大小：由使用者、分割檢視或宿主應用程式決定。請決定視窗變窄時會發生什麼事：

1. 保留主要任務；
2. 允許可調整大小的區域縮小到文件中載明的最小值；
3. 收合次要標籤或檢查器；
4. 將低頻率的操作移入選單；
5. 只讓內容確實溢出的區域捲動。

不要在隱藏某個操作時卻不提供其他途徑。當只有清單或文件本文應該捲動時，避免讓整個視窗捲動。斷點（`md:`、`lg:`）與 `windowSize()`（Rust 中為 `window()`）會依 NSH 所渲染的表面而定。

NSH 的 flex 版面配置與其他版面系統一樣存在固有尺寸的壓力：`flex-1` 子元素仍可能因為內容過長而拒絕收縮。設計與實作必須對哪些窗格可以收縮、截斷、換行或捲動達成一致。被裁切的區域也會裁掉向外延伸的焦點環；切勿只為了簡化溢出處理而犧牲鍵盤可見性。

<a id="forms-and-settings"></a>

### 表單與設定

每個欄位都應有可見的標籤，並將說明或驗證訊息放在它所描述的欄位旁。讓相關欄位對齊，但不要把較長的標籤硬塞進狹窄的固定欄寬。選用合適的控制項：獨立選項使用 `Checkbox`，少量可見選項使用由 `Radio` 組成的 [`RadioGroup`](../elements/radio.md)，較多選項使用包含各選項的 `Menu`，而會立即生效的設定則使用 [`Switch`](../elements/switch.md)。它們的各個部分（開關的軌道與滑塊、核取方塊的指示器）可由應用程式自行設計樣式，並使用隨控制項變化的 `checked:`、`indeterminate:` 與 `disabled:` class：

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

「全選」核取方塊以不確定（indeterminate）狀態表示部分選取：

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

操作進行期間請停用提交，保留使用者的輸入，並在操作附近顯示結果。讓輸入欄位保持在軟體鍵盤之上（`env(keyboard-inset-height)`）。對話框只用於簡短、專注的決定；需要探索或包含大量欄位的工作流程，請使用整頁或 Sheet。

載入處理必須代表實際的等待。切換內容已經就緒的設定面板時應立即完成；骨架畫面只適用於內容確實正在載入且其形狀已知的情況。

<a id="components-and-composition"></a>

## 元件與組合

請遵循 Shadcn 的原則：元件是建構材料，而不是封閉的設計系統。`nsh/base` 提供行為；應用程式在自己的元件中提供一致的預設值，並負責組合與產品語意。

- 依語意使用元件變體。Primary 保留給決策區域中明確的預設提交動作，在桌面平台上通常就是按下 Return 所觸發的動作。單獨、頻繁或令人期待的操作不會自動成為 primary。管理工具列中的 `Add` 命令通常使用預設按鈕；表單的預設 `Create` 提交則可使用 primary。破壞性提交使用 destructive，安靜的工具列操作使用 ghost。
- 優先採用明確的部件（part）與插槽（slot），而不是為任意的子孫元素設計樣式。
- 讓重複的模式在整個產品中保持一致。當它承載領域語言或政策時，請將它包裝成應用程式元件。
- 依語意角色使用標準元件。`Menu`、`ContextMenu`、`Popover`、`Sheet`、`Dialog` 與 `AlertDialog` 並不是可互換的方框；它們各自擁有不同的選取、焦點、鍵盤、關閉與版面配置契約，並在每種裝置上呈現各自的形式。
- 保留元件家族的幾何結構。選單列共用相同的垂直與水平內距、高度、圖示與勾號欄位、分隔線、圓角與狀態處理方式。不要以間距僅是近似系統的自訂彈出視窗來模仿選單。
- 不要僅為了重新命名每個 prop 或凍結其所有功能而包裝元件。
- 不含產品樣式的可重用行為，請移至 `nsh/base`，或移至應用程式各產品共用的 crate；帶有主題且具主見的呈現方式則留在應用程式的元件中。

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

### 讓使用者在點擊之前就能理解結果

控制項應能預告其結果。使用熟悉的平台控制項與擺放位置，讓人無須先學習介面就能操作。它的標籤要指出動作與對象，狀態要顯示是否可用，回饋則要確認相同的結果。

若 Button 會開啟設定流程，就不要標示為 `Save`；若只是將項目從群組中移除，就不要標示為 `Delete`。當上下文無法清楚說明時，請標明範圍。對操作立即回應，在較長的工作期間防止重複提交，並在發生變化的物件附近顯示結果。只有在結果本身不可見時，才加入成功訊息。

每個互動控制項都應針對以下狀態進行設計：

| 狀態 | NSH | 設計要求 |
| --- | --- | --- |
| 靜止 | | 清楚的可操作暗示，且不造成視覺雜訊 |
| 懸停 | `hover:` | 細微的指標回饋，絕不是唯一的提示 |
| 按下 | `active:` | 立即的按下回饋，由應用程式設計樣式 |
| 開啟／按下 | 彈出視窗的 `open` | 附屬彈出視窗開啟期間持續顯示回饋 |
| 鍵盤焦點可見 | `focus-visible:` | 高對比的鍵盤焦點環 |
| 已選取／已勾選 | `selected:`、`checked:` | 與懸停有所區別的持續狀態 |
| 停用 | `disabled:` | 降低強調程度，且不產生誤導性的懸停／按下回應 |
| 載入中 | | 保留上下文、防止重複操作、說明較長的等待 |
| 錯誤 | | 說明發生了什麼事以及如何復原 |

在桌面平台與網頁上，請使用 [`keymap`](../modules/nsh.md#keymap) 綁定應能以鍵盤操作的命令。配合熟悉的平台快速鍵（`"mod+k"` 在 macOS 上是 Command，其他平台則是 Control），在選單或 tooltip 中顯示快速鍵，並在開啟或關閉浮層之後，讓焦點停留在合乎邏輯的位置。

選取是資訊模型的一部分，而不是可有可無的修飾。分頁、分段選項、可選取的列、篩選器與導覽目的地都必須顯示持續的選取狀態（`selected`，螢幕閱讀器會朗讀它）。擁有選單的按鈕在彈出視窗關閉之前，必須保持明顯的按下或開啟狀態；光靠懸停無法說明觸發器與表面之間的關係。

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

在分段控制項中，選取的填色與未選取的表面必須共用容器的輪廓。兩者都不可使末端圓角變方，也不可讓某條邊界看起來比其他邊界更粗。

請透過項目本身的表面來呈現已選取的導覽項目、清單列或分頁：使用選取填色、較強的前景色或較粗的字重。不要加入前緣長條或單側邊框作為選取標記。那是網頁範本的習慣，不是原生慣例；它會破壞項目的圓角輪廓，並在原本已依文字對齊的欄位中加入第二條相互競爭的邊緣。

對於破壞性操作，請區分可逆與不可逆的工作。可逆的變更優先採用復原或暫時性通知。當後果嚴重且無法復原時，請使用 [`AlertDialog`](../elements/alert-dialog.md)；並在確認文案中指明具體的物件與後果。

<a id="pointer-conventions"></a>

### 指標慣例

按鈕、核取方塊、選單項目、分頁與其他控制項使用預設游標。連結以及行為類似連結的內容則使用手指指標（`cursor-pointer`）。文字、調整大小、抓取與禁止游標，僅在它們描述正在進行的操作時才使用。游標用來強化可操作暗示，而不是取代控制項的可見狀態或無障礙角色。

請讓懸停效果保持適度，因為觸控、鍵盤與無障礙互動都沒有懸停。不要把破壞性或必要操作的唯一副本放在懸停時才顯示。若相同的命令仍可透過選取、鍵盤或右鍵選單取得，情境式的列操作在靜止時可以較不顯眼。

<a id="prefer-command-surfaces-over-hover-toolbars"></a>

### 優先採用命令表面，而非懸停工具列

請依命令的頻率與範圍來決定操作放在哪裡：

- 將主要或頻繁的操作以附有標籤的按鈕或熟悉的工具列控制項保持可見；
- 將目前區域的次要操作放在可見的 [`Menu`](../elements/menu.md) 觸發器之後；
- 將作用於指標或手指所在物件的命令放在 `ContextMenu` 中：桌面平台上是按右鍵，觸控螢幕上則是長按；
- 當命令具有自然的鍵盤形式時，也透過快速鍵（[`keymap`](../modules/nsh.md#keymap)）提供同一個重要命令，並放在應用程式選單中（來自 [`nsh/desktop`](../modules/nsh-desktop.md) 的 `Menu.setApplicationMenu`）；
- 僅將懸停時顯示的圖示當作捷徑，且該命令必須能在其他地方取得。

這不只是視覺偏好。`nsh/base` 的選單已經處理了在觸發器位置的定位、桌面平台上的階層式子選單、手機上就地展開子選單的 Sheet、透過選擇項目、在外部按壓、Escape 或返回來關閉，以及供螢幕閱讀器使用的選單與選單項目角色。自訂的懸停按鈕列必須重新建立這些行為，而且對觸控、僅使用鍵盤以及許多輔助技術的工作流程而言是看不見的。

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

當使用者需要明顯看出還有更多命令時，請選擇 `Menu`，例如工具列溢出、文件操作或帳號選單。對於以選取項目或物件為範圍的命令，例如重新命名、複製、顯示位置或移除，請選擇 `ContextMenu`。右鍵選單不可以是執行必要命令的唯一方式；請視情況提供選單列、工具列、鍵盤或詳細檢視的路徑。

不要為了讓畫面看起來簡約而把所有操作都放進選單。可探索性與速度很重要：主要操作維持可見，危險項目保持清楚標示並加以分隔，而選單項目無論出現在何處，都應使用相同的動詞、圖示、快速鍵、啟用狀態與結果。
<a id="button-means-application-action-link-means-external-resource"></a>

### Button 代表應用程式動作；Link 代表外部資源

當啟動控制項會變更應用程式狀態、確認決定、開啟工具、提交資料或執行指令時，請使用 `Button`。依區域內的層級選擇其樣式：

- 主要按鈕（primary button）：用於決策區域中唯一需要強調的承諾動作；
- 預設按鈕（default button）：用於一般可見的動作；
- 外框按鈕（outline button）：用於需要清楚邊界但強調程度較低的動作；
- 幽靈按鈕（ghost button）：用於大家熟悉、低強調的工具列與行內動作；
- 圖示按鈕（icon button）：僅用於廣為人知的符號，並提供無障礙名稱；當意義或範圍不明確時，另外加上工具提示。

不要因為按鈕是畫面上唯一的動作、位於右上角，或團隊希望提高點擊率，就將它設為主要按鈕。主要按鈕代表預設的承諾動作，並帶有對應的鍵盤行為。如果啟動後只是一般指令，例如新增項目、開啟工具或重新整理檢視，請依其區域內的層級使用預設、外框或幽靈按鈕。

底線連結（`role="link"`）只用於外部資源目標：URL、網頁、線上文件或電子郵件地址。它使用手指指標游標，因為其約定是離開目前的應用程式脈絡前往該資源。不要為了讓功能性指令看起來不那麼突兀而使用連結樣式。外觀像連結的「刪除」、「儲存」、「重新整理」、「新增」、「開啟選單」或 App 內導覽動作，會隱藏控制項的可操作提示，並暴露錯誤的無障礙角色。

「檢視」二字不會讓 App 內的目的地變成連結。完整報告、分析、詳細資料面板或本機記錄，仍應透過按鈕、列、卡片、分頁或展開控制項開啟。當所在的卡片已經說明了開啟的內容時，請使用簡潔且符合脈絡的標籤，例如 `Full analysis`；底線則保留給實際會在瀏覽器或郵件用戶端中開啟的資源。

所有內部導覽，包括側邊欄的列、分頁、麵包屑、清單項目、開啟本機檢視或切換工作區，都必須使用導覽堆疊（navigation stack）、`Button` 或對應的元件。視覺上的強調，應透過按鈕的 variant 或導覽元件的選取狀態來呈現，絕不能以錯誤的語意來達成。

<a id="feedback-and-overlays"></a>

## 回饋與浮層

選擇最小且符合該決策的呈現方式：

- 工具提示：簡短的說明或快速鍵（[`Tooltip`](../elements/tooltip.md)，或任何元素的 `tooltip`）；
- Popover：不會打斷工作的情境式控制項（[`Popover`](../elements/popover.md)）；
- 選單：精簡的動作清單（[`Menu`](../elements/menu.md)）；
- 通知：不需要使用者做決定的非同步狀態；
- 對話框：需要專注處理的決定或簡短表單（[`Dialog`](../elements/dialog.md)）；
- 警示對話框：對具有重大後果的動作進行明確確認（[`AlertDialog`](../elements/alert-dialog.md)）；
- 面板（sheet）：需要較持久空間的輔助工作（[`Sheet`](../elements/sheet.md)）。

每一種都會採用裝置所預期的形式，且來自同一個由應用程式設定樣式的結構（`popupClass`、`backdropClass`）：

| | 桌面裝置 | 手機與平板 |
| --- | --- | --- |
| `Tooltip` | 指標停留在元素上之後 | 僅在應用程式開啟時 |
| `Popover` | 錨定於觸發元素；在外部按下會關閉它，並繼續執行該操作 | 錨定於觸發元素；在外部按下只會關閉它 |
| `Menu` | 位於觸發元素處的彈出視窗，子選單以階層方式展開 | 位於底部的面板；子選單會取代原本的項目 |
| `ContextMenu` | 在指標位置按下次要按鈕 | 長按手指開啟面板 |
| `Sheet` | 位於背景遮罩之上的邊緣面板 | 相同 |
| `AlertDialog` | 採用平台對話框樣式的警示 | 系統的警示或動作面板 |

工具提示用來補足缺少的意義，而不是重述顯而易見的動作。請僅在遇到不熟悉的符號、範圍不明確，或有需要揭露的隱藏快速鍵時使用。訊息頁尾中重複出現且易於辨識的指令，例如「複製」與「下載」，需要有無障礙名稱與鍵盤操作，但它們的懸停標籤只會增加干擾，而不會讓意思更清楚。手機只有在應用程式開啟時才會顯示工具提示，因此工具提示絕不能承載觸控使用者所需的資訊。

警示即使沒有開啟互動視窗，也會打斷視覺層級。請將它用於重要、例外且需要在目前工作中立即注意的資訊，不要把它當作用來裝飾一般說明、提示或空白區域的容器。當內容不需要立即注意或處理時，請優先使用行內說明、淡色文字或一般區塊。

避免堆疊浮層。Escape 與 Android 的返回鍵會關閉最上層可關閉的圖層；請透過 `onOpenChange` 讓應用程式狀態保持同步，並將焦點返回觸發元素或下一個合理的目標。

浮層中的動作必須對應到該浮層實際顯示的物件或狀態。例如，只有在畫面上出現獨立的最近記錄區段且其中有項目時，才提供 `Clear history`。搜尋結果、最近項目與我的最愛是不同的集合；請為它們加上標籤並分開呈現，而不要合併成一份沒有說明的清單。隱藏不適用的動作，或將它停用並提供有用的原因，不要在頁尾放一個意義不明的垃圾桶圖示。

頁尾空間不是用來收容設計中找不到位置的功能。頁尾可以呈現適用於整個介面的快速鍵、狀態或動作，但每個項目都必須回答：它的對象是什麼、為什麼現在可用、影響的範圍是什麼，以及啟動後哪些可見狀態會改變？

<a id="motion"></a>

## 動態效果

動態效果是用來說明變化，而不是環境裝飾。請在出現、關閉、展開與空間連續性上使用簡短的轉場。若透明度或 transform 就能傳達相同的關係，請避免為大幅度的版面變化加上動畫。請遵循減少動態效果的偏好設定（`motion-reduce:`、`reduceMotion()`），絕不要求使用者必須看動畫才能理解狀態，也不要為每個元件加上預設動畫。

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

動態效果的策略屬於應用程式層。`nsh/base` 負責轉場所需的生命週期機制或幾何資訊，但不會決定每個產品都要淡入淡出或滑動。請為各自獨立產生動畫的值提供穩定的識別，並讓中斷時從目前取樣到的值平順地反向，而不是從舊的終點重新開始。

動態效果應順應互動的連續性。當指標或捲動位置在相關目標之間移動時，請保持預覽介面穩定，並就地更新其內容或位置。只有在互動結束後才將它關閉；每次更新都重複淡出再重新進入，看起來會像閃爍。

<a id="designing-data-heavy-interfaces"></a>

## 設計資料密集的介面

密集不等於擁擠。在表格、樹狀結構、長清單與編輯器中：

- 讓標題與主要列的識別在視覺上保持穩定；
- 對齊可比較的數值，並在適當時使用等寬數字；
- 區分焦點、懸停、作用中的列與多重選取；
- 讓排序與篩選保持可見且可還原；
- 在篩選與重新排序時，依領域識別保留選取狀態；
- 對大型集合進行虛擬化（`List`），且不改變鍵盤語意；
- 對次要欄位與檢視面板採用漸進式揭露；
- 提供有用的空狀態，說明下一步該怎麼做。

需要在一致的欄位之間進行比較時，請選擇表格；需要瀏覽異質項目時，請選擇清單；存在真正的階層關係時，請選擇樹狀結構。不要把複雜的資料版面當作一種視覺風格。

<a id="interface-language"></a>

## 介面語言

文字是介面架構的一部分。請將功能的詞彙當作一個系統來撰寫，涵蓋目的地、物件、指令、狀態與結果，而不是把實作功能一個個孤立地翻譯。在實際脈絡中，優先採用仍然準確的最短措辭。

<a id="let-context-carry-context"></a>

### 讓脈絡承載脈絡

不要重複周圍介面已經建立的資訊。側邊欄的目的地通常就是物件或領域本身：使用 `Users`，而不是 `User Management`；使用 `Shortcuts`，而不是 `Shortcut Configuration Management`。若某一欄的每一列已包含動作，可以省略通用的 `Operation` 標題。標題為 `Delete “Roadmap”?` 的對話框，不需要在內文中再問一次相同的問題。

這是脈絡上的精簡，而不是為了刪減而刪減。當文字會改變決定時才加入，例如指出受影響的範圍、不可逆的後果、不尋常的前置條件或復原方式。每多一個字，都應該回答目前版面尚未回答的問題。

目的地與物件使用名詞（`Users`、`Appearance`、`Orders`），指令使用動詞（`Save`、`Duplicate`、`Export`），狀態使用形容詞或簡短片語（`Offline`、`Up to date`、`Pending review`）。除非某個詞能區分真正的領域概念，否則請避免使用 `Management`、`Module`、`Page`、`Function`、`Operation` 與 `System` 這類包裝詞。

<a id="write-each-language-do-not-translate-its-shape"></a>

### 寫出每種語言，而不是翻譯它的形狀

從共同的意圖、層級與術語出發，再為每個語系撰寫自然的介面語言。不要保留來源語言的語序、字數、客套的禮貌用語或文法類別。英文的 `Users` 可以表達一個中文功能概念，而該概念若逐字展開會變成「使用者管理」；忠實是指保留目的，而不是保留詞彙。

移除已由外層資訊架構提供的詞語。在 `Settings` 介面中，目的地通常直接是 `Account`，而不是 `Account Settings`，更絕不是不自然的單數形 `Account Setting`。正確的英文標籤是依據其角色與相鄰項目來決定的，而不是依據獨立的來源片語。

請為反覆出現的物件、指令與狀態維護一份小型產品詞彙表。除非脈絡確實改變了意義，否則在工具列、選單、右鍵選單、對話框、快速鍵搜尋與文件中使用相同的術語。請在實際繪製出的介面中檢視文案：相鄰的標籤往往會揭露重複或範圍不一致的問題，而這些問題在語系檔中很難發現。

在在地化的技術寫作中，若翻譯會降低精確度，請保留已確立的框架術語。API 識別碼請維持原樣，並以程式碼格式呈現。不要只為了顯得專業而保留一般的外來詞。必要時在首次出現時解釋保留的術語，之後在介面、文件與 API 範例中一律使用相同的形式。

在文件中，連結文字中的具名 API、元件、原始碼檔案或指南，請使用其確切的英文名稱，在地化頁面也一樣。例如，請寫 `View`、`Button`、`Menu` 與 `Text`，而不要翻譯它們的名稱，或加上多餘的 `NSH` 前綴。周圍的說明則使用頁面的語言。只將具名目標設為連結；若「原始碼」之類的字詞是在說明引用的原因，請放在連結之外。

在跨語系共用的技術比較表中，請以既定的英文形式保留功能名稱、框架名稱、API 名稱與模型名稱。請翻譯表格周圍的說明，而不是表格中的技術標籤。在該比較脈絡之外，已有既定在地名稱的一般介面用語仍可在地化。
<a id="buttons-and-confirmation-dialogs"></a>

### 按鈕與確認對話框

按鈕標籤預設應簡短，通常是一到兩個詞，並描述結果，而不是手勢或元件。
優先使用 `Save`、`Move` 或 `Delete`，而非 `Click to save`、`Perform move` 或 `Confirm deletion`。對於不提交變更就離開的動作，請一律使用 `Cancel`。`OK` 僅用於確認純資訊性的內容。

簡短是預設值，而非字數上限。當較長的標籤能點明後果，或能區分使用者可能混淆的選項時，刻意使用較長的標籤會更好，例如 `Delete from this group` 與 `Delete everywhere`, or `Restart without saving` 的對照。長度必須換來對決策至關重要的資訊，不得重複對話框的標題或內文。

可能的話，請使用最具體且簡潔的結果作為確認標籤：

| 情境 | 較弱 | 建議 |
| --- | --- | --- |
| 刪除對話框 | `Yes`、`Sure`、`Confirm deletion` | `Delete` |
| 未儲存的變更 | `Confirm`、`Yes` | `Discard changes` |
| 純粹確認 | `Confirm operation` | `OK` 或 `Done` |
| 結果沒有明確動詞的複雜同意事項 | `Yes` | `Confirm` |

當周圍的對話框已完整說明一項複雜的承諾，且沒有更短的結果動詞足以準確表達時，`Confirm` 是可用的備選。它不應取代明確的指令。`Sure` 屬於口語表達，並非穩定的英文指令，意義過於模糊，不適合納入標準詞彙。

確認對話框應構成一個精簡的決策：

- 標題：決策或條件，例如 `Delete “Roadmap”?`；
- 內文：僅包含新的範圍、後果或復原資訊；
- 動作：`Cancel` 以及結果，例如 `Delete`；
- 破壞性樣式：套用於破壞性的結果（具有 `destructive` 角色的 `AlertDialog` 動作），而不是用來取代精確的措辭。

當能指明實際條件時，請避免使用 `Notice`、`Warning`、`Error` 和 `Confirmation` 這類泛用標題。
當結構或狀態已經傳達出意思時，請避免使用「你確定要……嗎」、「你是否想要……」、「請注意……」和「成功」等儀式性用語。禮貌應來自沉穩、尊重的語氣，而不是反覆出現的 `please`。

<a id="capitalization-punctuation-and-symbols"></a>

### 大小寫、標點與符號

英文 UI 預設使用句首大寫（sentence case）：使用 `Reset layout`，而不是 `Reset Layout` 或 `RESET LAYOUT`。專有名詞與既定的縮寫應保留原樣。僅在平台整合能從中受益時，才遵循平台慣例（例如原生選單指令使用標題式大寫），並在同一元件類別中一致地套用。

全大寫可為極短的區段標籤、眉標、狀態、既定縮寫以及類程式碼的識別碼提供節制的排版強調。其緊湊的外形與適度的字距可形成類似粗體的層級，但不適用於按鈕、長標題、句子或密集的清單。請勿在同一區域同時使用大寫、強烈色彩與粗體字重，也不要自動轉換每一個字串：產品名稱、縮寫與在地化內容必須保留其原本的大小寫。

標籤、按鈕、選單項目、分頁、標題、預留位置文字與簡短狀態不加句尾句號。完整的說明、警告與錯誤句子則要加。在一般的成功與失敗訊息中避免使用驚嘆號。在中文中，句子使用全形標點，簡短的控制項標籤則依相同的語意規則省略句尾標點。

使用單一省略號字元（`…`），而不是三個句點。凡是會開啟對話框、工作表或獨立視窗的按鈕或選單項目，以及需要更多輸入或選擇才能完成的指令，例如 `Settings…` 或 `Export…`，都要加上省略號。立即執行的指令則不加省略號。請使用不確定式進度指示器，而不是裝飾性的點點，來表示正在進行的工作。

錯誤訊息應說明發生了什麼事，並在有用時說明下一步的復原動作。成功回饋僅在結果狀態尚未顯示於畫面時，才需點明該狀態。優先使用 `Couldn’t save. Check your connection and try again.`，而不是技術代碼或冗長的致歉；當文件已明顯顯示為已儲存時，請省略 `Saved successfully` 提示訊息。

<a id="internationalization-and-platform-fit"></a>

## 國際化與平台適配

無障礙（A11y）的名稱與標籤可以維持英文；這些字串不需要在地化。當為作用於某個項目的控制項命名時，請保留該項目本身的標籤，即使該標籤已經在地化。此例外不適用於可見的 UI 文案。

文案必須能承受文字膨脹、CJK 排版、由右至左的文字以及不同的快捷鍵表示法。請勿依據單一英文標籤來決定控制項的大小。不要把文字放進點陣圖資源，避免串接已翻譯的片段，並且僅在產品定義了復原途徑（例如工具提示）的情況下，才讓標籤換行或截斷。

請尊重具有意義的平台差異：Command 與 Control、原生視窗裝飾、系統外觀、捲軸行為、選單、通知功能，以及在手機上的系統標頭、返回手勢與警示。請保持產品資訊架構在各平台間的穩定，但不要為了表面上的像素一致而抹去使用者熟悉的平台行為。

NSH 應用程式可在手機、平板、桌面與網頁上執行，且經常運行於宿主應用程式之內。請針對每一種環境進行設計：

- **系統 UI 保持平台的外觀。** 在 iOS 與 Android 上，頁面的標頭由系統提供（`NavPage` 的 `title` 與標頭選項）；桌面與網頁則顯示由應用程式繪製的頁面 `header` 插槽。請為每個頁面同時提供兩者（[導覽](./navigation.md#navpage-and-the-header)）。確認操作使用 `AlertDialog`；狀態列會跟隨最上層的頁面或對話框（`statusBar`）。
- **宿主的主題。** 內嵌的應用程式可以取得其宿主的主題；讀取 token 的類別與 Rust 繫結會原生地跟隨該主題（[主題 token](./tailwind.md#theme-tokens)）。
- **安全區域與鍵盤。** 讓內容保持在安全區域內（`env(safe-area-inset-*)`、`safeAreaInsets()`），並讓輸入欄位位於軟體鍵盤上方（`env(keyboard-inset-height)`）（[裝置與環境](./device-and-environment.md)）。
- **外觀、文字大小與動態效果。** 每個介面都必須能在淺色與深色模式下運作（`dark:`、`colorScheme()`）、配合使用者的文字大小，並支援減少動態效果（`motion-reduce:`、`reduceMotion()`）。
- **由右至左。** 版面方向會跟隨語系，`direction` 樣式可為某個視圖及其子樹設定方向；起始與結束屬性會鏡像翻轉（[由右至左](./layout.md#right-to-left)）。
- **觸控與指標。** 觸控目標至少為 44 × 44 點；懸停與工具提示僅在有指標時才存在。

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

AI 在修改 NSH 介面時，應先檢視最近的功能、應用程式的元件與主題 token，以及元件文件與宣告（`.nsh/types`）。在產生程式碼之前，應先說明主要任務、狀態擁有者、元件組合，以及鍵盤與觸控操作路徑。不得從 React、React Native 或 Shadcn 的範例推斷 API，也不得因為名稱看起來合理就憑空創造 NSH 的 prop 或方法；`nsh check` 與建置時的類別檢查會回報不存在的項目。

除非人類能夠解釋層級、密度、元件選擇以及例外的字面值為何適合這個產品，否則 AI 的輸出就不算完成。看起來合理的截圖不能作為證明：鍵盤與觸控行為、焦點、動態內容、主題、調整大小、文字大小與失敗狀態，都是設計的一部分。

<a id="accessibility-checklist"></a>

## 無障礙檢查清單

在認定畫面完成之前，請確認：

- 每個動作都能透過鍵盤、觸控與螢幕閱讀器觸及並操作；
- 焦點順序符合視覺順序與任務順序；
- 焦點保持可見，並在覆蓋層關閉後恢復；
- 控制項具有無障礙名稱；當僅有圖示的控制項其意義、範圍或快捷鍵需要說明時，使用工具提示；
- 文字與有意義的邊界具有足夠的對比；
- 狀態不僅以顏色傳達；
- 停用與唯讀狀態可以區分；
- 標籤、錯誤與說明保持在其控制項附近；
- 在較長的翻譯、由右至左與較大文字下，內容仍可使用；
- 觸控目標至少為 44 × 44 點，而指標目標即使在密集的版面中也有舒適的大小。

<a id="design-review-checklist"></a>

## 設計審查檢查清單

審查不是盤點元件，而是判斷介面是否做出了正確的決策。請依序詢問：

1. **任務是否清楚？** 新使用者是否無需學習、猜測或試誤，就能辨識目的、主要動作與下一步？
2. **每個動作是否都信守承諾？** 標籤、控制項、狀態、範圍、回饋與結果，是否描述同一個一致的結果？
3. **層級是否明確且節制？** 核心功能是否獲得應有的空間，而強烈色彩、粗體字、徽章、警示與主要按鈕是否保持稀少？
4. **介面能否少做一點，做得更好？** 是否能在不削弱完整任務的前提下，移除、合併或延後某個入口、選項或狀態？
5. **結構是否精確？** 同級元素是否共用對齊基準線，相等的間距是否在渲染後的像素上仍然相等，捲軸是否位於實際捲動區域的邊緣？
6. **是否遵循元件系統？** 標準控制項是否保留其幾何形狀、狀態、鍵盤行為與關閉模型，且外觀由主題與縮放 token 提供？
7. **在每種狀態與限制下是否仍可使用？** 請驗證鍵盤、觸控與焦點行為、空白／載入中／失敗／權限狀態、較長的翻譯、較大的文字、由右至左、兩種外觀、最小視窗大小以及減少動態效果。
8. **是否已在真實平台上測試？** 請在其發佈的每個平台上，使用真實的元件、文案與具代表性的內容完成任務（`nsh run --target …`、`nsh test --target …`），而不僅僅是理想的截圖。
