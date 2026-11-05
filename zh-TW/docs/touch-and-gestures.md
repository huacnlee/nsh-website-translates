---
title: "觸控與手勢"
description: "按壓與按壓回饋、點擊區域、指標事件、原始觸控、responder 系統、PanResponder,以及原生的拖曳、縮放與旋轉手勢。"
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---

# 觸控與手勢

NSH 有三個層級的觸控處理。**按壓**（Rust 中的 `.on_press`、TSX 中的 `onPress`，以及其同類處理器）涵蓋按鈕、列與連結，並以原生方式繪製按壓回饋。**原生手勢**（平移、縮放與旋轉）在 UI 執行緒上驅動[動畫值](./animation.md#animated-values)，因此即使你的程式碼正忙碌，被拖曳的卡片仍會跟著手指移動。**原始觸控與 responder 系統**（Rust 中的 `.on_touch` 與 `.claim_touches` 搭配 `.on_responder_*` 處理器；TSX 中的 `onTouchStart`、`onResponderMove` 與 `PanResponder`）會把每根手指的位置交給你的程式碼，用於另外兩個層級無法表達的情境，例如繪圖。

請選擇能完成工作的最高層級：層級越高，從 UI 執行緒傳到你程式碼的工作就越少。

<a id="presses"></a>

## 按壓

每個元素都接受按壓處理器；沒有獨立的「touchable」元件。你可以把 `.on_press` / `onPress` 放在視圖、文字、圖片或任何其他元素上。

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | 預設值 | 說明 |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | 手指在視圖內抬起（發生在按壓之後，而非長按之後）。 |
| `.on_long_press(..)` | `onLongPress` | | 手指持續按住達到長按延遲時間。之後不會再觸發按壓處理器。 |
| `.on_press_down(..)` | `onPressDown` | | 按壓開始。 |
| `.on_press_up(..)` | `onPressUp` | | 按壓結束：手指抬起、滑出視圖，或被捲動視圖接管。 |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | 按壓轉為長按之前的毫秒數。 |
| `.disabled(..)` | `disabled` | `false` | 不接收按壓且不顯示回饋；套用停用樣式；螢幕閱讀器會說明其為停用狀態。 |

按壓的行為如下：

- **只有最內層的可按壓視圖會回應。** 包含可按壓按鈕的可按壓列，在按下按鈕時不會收到按壓。
- **在捲動視圖內，按壓會等待約 130 毫秒**才開始（並顯示回饋），因此從按鈕上開始的拖曳會捲動，而不是按下按鈕。
- **滑出會取消按壓。** 手指移出視圖時，會以按壓結束處理器結束按壓，且不會觸發按壓。
- **停用會從已掛載的內容中移除按壓監聽器**，因此視圖完全不顯示回饋，並套用停用樣式（`.disabled_style(..)`、`class="disabled:opacity-40"`）。
- **帶有按壓處理器的巢狀文字片段就是連結。** 段落是單一原生視圖；按壓會交給手指下方的片段。請參閱[文字](./text.md)。

<a id="press-feedback"></a>

## 按壓回饋

按壓回饋由應用程式定義：視圖在被按壓、懸停、取得焦點或停用時所採用的樣式。這些樣式會在狀態改變的瞬間於原生端套用，不需要往返你的程式碼。每種狀態都有對應的 Rust 方法、TSX 樣式屬性與 [Tailwind 變體](./tailwind.md)：

| Rust | TSX 屬性 | 類別 | 說明 |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | 被按壓時。 |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | 指標位於其上方時（桌面、iPad 指標、瀏覽器）。 |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | 取得焦點時。 |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | 它或其內部的視圖取得焦點時：例如包住實際編輯輸入框的欄位外框。 |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | 停用時。 |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | Android 的 material 漣漪效果（`color`、`borderless`、`radius`、`foreground`），與樣式並用。 |

狀態樣式會疊加在視圖自身的樣式之上。較後面的狀態優先（hover、focus、active），停用樣式優先於全部，而視圖停用時其他狀態樣式不會套用。

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

無邊界漣漪會擴散到視圖之外，適合圖示按鈕：`Ripple { borderless: true, radius: Some(px(24.0)), .. }`、`android={{ ripple: { borderless: true, radius: 24 } }}`。請參閱[平台專屬程式碼](./platform-specific.md)。

搭配轉場（`.transition()`，即 `transition` 類別）時，狀態變化會以動畫呈現。`.group()`（`group` 類別）會讓視圖成為群組，而 `.group_active(..)`（`group-active:`）會在群組被按壓時為其子視圖設定樣式：

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## 點擊區域：hitSlop

hit slop（`.hit_slop(..)`、`hitSlop`）會把接收觸控的區域擴展到視圖邊界之外，而不改變其版面配置。適用於關閉按鈕與開關等較小的目標。

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | 說明 |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | 在邊界周圍增加的點數。`EdgeInsets::all(..)` 與 TSX 的數字會套用到四個邊。 |

請讓擴展後的區域保持在父視圖的邊界內（在小視圖周圍留一些 margin 或 padding）：命中測試是透過父視圖到達子視圖的，因此落在父視圖之外的觸控永遠不會到達子視圖的 slop。

<a id="children-outside-their-parent"></a>

## 位於父視圖之外的子視圖

位於父視圖邊界之外的子視圖（以 `overflow` 絕對定位且保持可見，例如欄位下方的下拉選單）會像其他視圖一樣，在它被繪製的位置接收觸控：NSH 會在原生端對超出視圖範圍的子孫視圖進行命中測試。若父視圖裁切其溢出內容，這些子視圖就會被裁切，並且在該處既不會顯示也不會接收觸控。此區域是依據版面配置計算的，因此被 transform 移出父視圖的子視圖，只會在父視圖的邊界內接收觸控。

請留意繪製順序：下拉選單只有在其欄位排在這些同層視圖之後，或具有較高的 `z-index` 時，才會繪製在它們之上，而觸控會交給最上層繪製的視圖。

## pointerEvents

樣式鍵 `pointerEvents`（Rust 中為 `.pointer_events(..)`）決定子樹中的哪些視圖可以成為觸控的目標。它在命中測試期間於原生端求值，因此每次觸控都不會產生額外成本。

| Rust | TSX | 該視圖 | 其子視圖 |
|---|---|---|---|
| `PointerEvents::Auto`（預設） | `"auto"` | 接收觸控 | 接收觸控 |
| `PointerEvents::None` | `"none"` | 永遠不是目標 | 除非其中某個子視圖設定 `"auto"`，否則永遠不是目標：觸控會穿透到後方的內容 |
| `PointerEvents::BoxNone` | `"box-none"` | 永遠不是目標 | 接收觸控 |
| `PointerEvents::BoxOnly` | `"box-only"` | 接收觸控 | 永遠不是目標 |

典型的用法：不應阻擋下方內容的覆蓋層（none）、其空白處應讓觸控穿透到後方內容，但按鈕仍可運作的全螢幕容器（box-none），以及即使手指落在子視圖上也應接收按壓的列（box-only）。

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"` 的繼承方式與 CSS 的 `pointer-events` 相同：其中設定 `"auto"` 的視圖會重新接收觸控。`"box-none"` 與 `"box-only"` 僅作用於設定它們的視圖。Tailwind 類別 `pointer-events-none` 與 `pointer-events-auto` 會設定 `"none"` 與 `"auto"`，而作為樣式鍵時，`pointerEvents` 也接受狀態樣式（`activeStyle`、...）與變體。

<a id="native-gestures-pan-pinch-and-rotation"></a>

## 原生手勢：平移、縮放與旋轉

對於會在畫面上移動內容的拖曳、縮放與旋轉，請將[動畫值](./animation.md#animated-values)綁定到手勢。平台的手勢辨識器會在 UI 執行緒上寫入這些值，綁定到它們的視圖會在同一個影格中移動；你的程式碼只會在手勢開始與結束時收到通知。

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | 說明 |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | 單指拖曳會移動這些值，單位為點。 |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | 雙指縮放會驅動 `scale`（一個倍率）。 |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | 雙指旋轉會驅動 `angle`，單位為度。 |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | 拖曳開始／結束，附帶一個 `PanEvent`。 |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | 縮放開始／結束：其縮放比例與速度（`GestureEvent`）。 |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | 旋轉開始／結束：其角度（Rust：`GestureEvent<Radians>`）與速度。 |

平移事件包含位移（`translation`，一個 `Point`：自開始以來的點數）、速度（`velocity_x` / `velocity_y`；TSX：`velocity`，一個 `Point`：每**秒**的點數），以及該時刻已綁定的值（`value_x` / `value_y`；TSX：`value`、`{ x?, y? }`，包含 `pan` 所綁定的軸）。

原生端會為你處理以下事項：

- **拖曳會從值目前所在處繼續。** 開始時會讀取這些值，並把位移加到其上；抓住仍在動畫中的值（例如正彈回原位的彈簧）會讓動畫停在當下的位置。
- **只綁定一個軸時，另一個軸可以捲動。** 若只綁定水平值，只有當手指的水平移動大於垂直移動時，拖曳才會開始，因此垂直捲動視圖內的水平滑動列仍然可以垂直捲動。這個判斷是在系統詢問手勢是否可以開始時，於原生端做出的。
- **平移、縮放與旋轉會在同一個視圖上同時運作**：同一張卡片可以同時被拖曳、縮放與旋轉。
- **放開時的速度可用於物理效果。** 平移結束時的速度可以直接餵給彈簧或衰減動畫的速度；這些值可讓你選擇吸附點。

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> 只要拖曳僅是移動內容，就請將動畫值綁定到手勢，而不是透過 responder 追蹤手勢。使用綁定值時，繁忙的應用程式碼不會讓拖曳卡頓；使用 responder 時，每次移動都是傳給你程式碼的一個事件，也都需要更新視圖所顯示的內容。

<a id="raw-touches"></a>

## 原始觸控

觸控處理器會回報每根手指的按下、移動與抬起。它們適用於記錄、自訂命中測試以及回應多點觸控；它們不會宣告取得該觸控（按壓與捲動視圖仍會繼續運作）。

在 Rust 中，`.on_touch(..)` 會以 `TouchEvent` 接收每個階段：包含其 `phase`（`TouchPhase::Start`、`Move`、`End`、`Cancel`）、`timestamp` 與 `points`（目前按下的每根手指），每根手指都有其 `id`、在其按下的視圖中的 `location`、在畫面中的 `page` 位置，以及標示該事件所涉及手指的 `changed`。在 TSX 中，每個階段都有各自的處理器：

| TSX | 說明 |
|---|---|
| `onTouchStart` | 有手指按在視圖上或其內部。 |
| `onTouchMove` | 手指移動。移動事件會在每個引擎週期內合併。 |
| `onTouchEnd` | 手指抬起。 |
| `onTouchCancel` | 系統接管了該觸控（捲動視圖開始捲動、來電等）。 |
| `onTouchStartCapture`、`onTouchMoveCapture`、`onTouchEndCapture`、`onTouchCancelCapture` | 同上，但由外向內呼叫，且早於冒泡處理器。 |

每個 TSX 處理器都會收到一個 `GestureResponderEvent`：

| 欄位 | 說明 |
|---|---|
| `identifier` | 在手指按下期間用來識別該手指。 |
| `locationX`、`locationY` | 在手指按下的視圖中的位置（`target`）。 |
| `pageX`、`pageY` | 在畫面中的位置。 |
| `target` | 手指按下的視圖的 id。 |
| `timestamp` | 毫秒。 |
| `touches` | 目前按下的每根手指。 |
| `changedTouches` | 此事件所涉及的手指。 |
| `nativeEvent` | 事件本身，因此 `e.nativeEvent.locationX` 也可以運作。 |
| `stopPropagation()` | 更外層的視圖不會看到這個觸控事件。 |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### 視圖的位置：measure

觸控的位置是相對於手指按下的視圖，而該視圖可能是你所關心之視圖的子視圖（例如滑桿的旋鈕）。測量視圖可以告訴你它的位置，讓你改用頁面位置。在 Rust 中，請在視圖上放置 `element_ref()` 並 await 其 `measure()`；在 TSX 中，請對其 ref 呼叫 `measure()`：

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

它會在目前為止所做的變更都完成版面配置後才解析：在 Rust 中解析為 `Measurement`（`frame`，即版面配置處理器所回報的、在父視圖中的框架，以及 `page`，即左上角），在 TSX 中解析為 `{ bounds, pagePosition }`。該角點位於畫面中，或視圖所在的對話框中，與觸控的頁面位置使用相同的座標。其周圍捲動視圖與清單的偏移量會被納入考量；transform（包括動畫）則不會。對於不在畫面上的視圖，它會解析為 `None` / `null`。
<a id="the-responder-system"></a>

## 回應者系統

當你的程式碼必須掌控一段觸控序列（手指繪圖、自訂滑桿、原生手勢辨識器未提供的手勢）時，請使用手勢回應者系統。同一時間只有一個檢視是**回應者**，負責接收移動事件；檢視之間會協商由誰擔任。

成為回應者：

| Rust | TSX | 說明 |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` 回傳 `true` | 手指按下時詢問，從目標向外依序進行。 |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` 回傳 `true` | 在沒有回應者時（或為了接手時），每次移動都會詢問。 |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | 同上，但由外向內詢問，且先於冒泡階段的詢問。父層可用它從子層手中接管觸控。 |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | 移動版本。 |

宣告（claim）僅憑檢視本身決定，不會執行你的任何程式碼，除非它主動詢問：`TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` 會在監聽器呼叫 `r.claim()` 時宣告，並依據目前為止的手勢（`r.event.gesture`）來決定。TSX 的處理函式會以第二個參數 `gestureState` 取得手勢，其欄位與 [PanResponder 的](#panresponder)相同（`dx`、`dy`、`vx`、`vy`、`moveX`、`moveY`、`x0`、`y0`、`numberActiveTouches`）。只宣告水平移動的滑動手勢：`onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`。這項決定仍會晚一次移動才做出，因此外層的捲動檢視可能會先開始捲動；若是在捲動檢視內的拖曳，請使用[平移啟動](#pans-inside-scroll-views-panactivation)。

成為回應者之後：

| Rust | TSX | 說明 |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | 此檢視現在是回應者。在 Rust 中，預設會阻止原生捲動檢視接手觸控（`TouchClaim::block_native(false)` 則允許它們接手）；在 TSX 中，請回傳 `true` 來達成。 |
| `.on_responder_reject(..)` | `onResponderReject` | 另一個檢視是回應者，且不肯放手。 |
| `.on_responder_start(..)` | `onResponderStart` | 另一根手指按下。 |
| `.on_responder_move(..)` | `onResponderMove` | 手指移動。 |
| `.on_responder_end(..)` | `onResponderEnd` | 一根手指抬起。 |
| `.on_responder_release(..)` | `onResponderRelease` | 最後一根手指抬起：手勢結束。 |
| `.keep_touches(true)` | `onResponderTerminationRequest` 回傳 `false` | 另一個檢視想要接手觸控：保留它們（預設會交出去）。 |
| `.on_responder_terminate(..)` | `onResponderTerminate` | 另一個檢視或原生手勢接手了觸控。 |

Rust 元件的回應者從被授予起到其觸控結束為止，都會維持按下狀態，無論手指或指標移動到哪裡，就像 CSS 的 `:active` 會持續到按鈕放開一樣：它的 `.active(..)` 樣式與其內部的 `group-active:` 類別在整個拖曳過程中都會維持外觀（例如被拖出其區帶的調整大小把手）。

Rust 的處理函式會取得 `ResponderEvent`：手指在其按下的檢視中的 `location`、其 `page` 位置，以及自被授予以來的 `timestamp` 與 `gesture`。

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

運作方式：任何帶有觸控或回應者處理函式的檢視都會以原生方式監聽觸控；平台會回報該檢視上（及其內部）的觸控，並附上監聽檢視的路徑，而協商過程則在 NSH 的 Rust 核心中執行，依序詢問各項宣告並呼叫你的處理函式：先由最外層的檢視向內處理捕獲階段，再從目標向外處理其餘階段。這帶來兩個結果：

- **原生捲動檢視與回應者會互相競爭。** 當回應者阻止它們時，周圍的捲動檢視在回應者結束之前都不會接手觸控。如果原生捲動檢視先開始拖曳，則由它勝出：回應者會收到終止處理函式，而觸控處理函式會收到取消。
- **每次移動都是傳給你程式碼的一個事件。** 由回應者驅動的拖曳，流暢程度取決於你的程式碼有多快；若拖曳只是移動檢視，建議改用[綁定值](#native-gestures-pan-pinch-and-rotation)。

## PanResponder

在 Rust 中，回應者事件本身就帶有手勢資訊：`ResponderEvent::gesture` 是一個 `PanGesture`，包含與起點的距離、速度以及手指數量。在 TSX 中，來自 `nsh` 的 `PanResponder` 包裝了回應者系統，並加上相同的手勢狀態；請將其 `panHandlers` 展開到檢視上。

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

手勢狀態：

| Rust（`PanGesture`） | TSX（`gestureState`） | 說明 |
|---|---|---|
| | `stateID` | 識別該手勢。 |
| `position` | `moveX`、`moveY` | 觸控質心的最新位置，單位為表面點（surface points）。 |
| `origin` | `x0`、`y0` | 回應者被授予時質心所在的位置。 |
| `delta` | `dx`、`dy` | 自被授予以來移動的距離。 |
| `vx`、`vy` | `vx`、`vy` | 速度，單位為每秒點數。 |
| `active_touches` | `numberActiveTouches` | 按下的手指數量。 |

在 Rust 中，`PanGesture::begin` 與 `PanGesture::update` 會根據原始觸控（`.on_touch`）追蹤手勢。TSX 的回呼會取得 `(event, gestureState)`：`onStartShouldSetPanResponder(Capture)`、`onMoveShouldSetPanResponder(Capture)`、`onPanResponderGrant`、`onPanResponderReject`、`onPanResponderStart`、`onPanResponderMove`、`onPanResponderEnd`、`onPanResponderRelease`、`onPanResponderTerminate`、`onPanResponderTerminationRequest` 與 `onShouldBlockNativeResponder`。最後一項預設為 `true`：被授予的 PanResponder 會阻止原生捲動檢視接手它的觸控。

<a id="pans-inside-scroll-views-panactivation"></a>

## 捲動檢視內的平移：panActivation

在垂直捲動檢視內橫向拖曳瀏覽的圖表，必須接手水平拖曳，並把垂直拖曳留給捲動檢視。在開始時就宣告觸控，會從第一個像素起就阻止捲動；而在你的程式碼中依據移動來決定又太遲：等它給出答案時，捲動檢視可能已經接手了觸控。平移啟動（`TouchClaim::on_pan(..)`、`panActivation`）讓平台在主執行緒上隨著手指移動來決定：

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust（`PanActivation`） | TSX | 說明 |
|---|---|---|
| `active_offset_x`、`active_offset_y` | `activeOffsetX`、`activeOffsetY` | 當手指沿該軸（任一方向，單位為點）從按下處移動超過此距離時，平移即啟動。 |
| `fail_offset_x`、`fail_offset_y` | `failOffsetX`、`failOffsetY` | 若手指先移動超過此距離，平移即失敗：觸控由捲動檢視保留。 |

`PanActivation::horizontal(active, fail)` 與 `PanActivation::vertical(active, fail)` 可設定常用的成對值。若未設定啟動偏移量，平移會在任意方向移動 10 點後啟動。在啟動之前，周圍的捲動檢視會等待它（iOS），且不會詢問該檢視的其他宣告。啟動時，捲動檢視就無法再接手這些觸控，而該檢視會成為回應者（先授予，再接收移動）；失敗時，捲動檢視則照常捲動。在 TSX 中，`PanResponder` 的 `panHandlers` 也能搭配使用：將它們展開在該 prop 旁邊，而 `onPanResponderGrant` 會在啟動時執行。

> [!NOTE]
> 所有速度的單位都是每秒點數：回應者手勢的 `vx` / `vy`、平移的速度，以及彈簧或衰減動畫的速度，因此 `vx` 可以原樣傳給彈簧或衰減動畫。

<a id="why-some-answers-are-props"></a>

## 為什麼有些答案是 prop

主執行緒絕不會等待你的程式碼。當系統需要立即得到答案時（這個平移手勢可以開始嗎、這個點是否命中該檢視、這次點擊是否應該收起鍵盤），NSH 會根據事先掛載的內容以原生方式回答：綁定的平移值（其軸向）、縮放值、點擊延伸範圍（hit slop）、指標事件、捲動檢視的鍵盤點擊設定，以及平移啟動。你的處理函式則是在事情發生之後才得知。這就是為什麼這些是宣告式設定而不是回呼，也是為什麼會執行你程式碼的回應者協商，只在各回應者之間做決定，而絕不會阻擋原生手勢。

<a id="related"></a>

## 相關內容

- [`View`](../elements/view.md)：基本元素上的所有觸控 prop。
- [Animation](./animation.md)：用於手勢驅動動態效果的動畫值、彈簧與衰減。
- [Scrolling](./scrolling.md)：鍵盤點擊設定、捲動檢視與巢狀手勢。
- [`PanResponder`](../modules/nsh.md#panresponder)：`PanResponder` 參考文件。
- [Accessibility](./accessibility.md)：可按壓的檢視屬於無障礙元素；請為它們指定角色與標籤。
