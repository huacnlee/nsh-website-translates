---
title: "觸控與手勢"
description: "按壓與按壓回饋、點擊區域、指標事件、原始觸控、responder 系統、PanResponder,以及原生的拖移、捏合和旋轉手勢。"
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---


# 觸控與手勢

NSH 有三個層級的觸控處理。**點按**（Rust 中的 `.on_press`、TSX 中的 `onPress`，以及它們的同類處理器）涵蓋按鈕、列表列和連結，並以原生方式繪製點按回饋。**原生手勢**（平移、縮放和旋轉）在 UI 執行緒上移動[動畫值](./animation.md#animated-values)，因此即使你的程式碼正忙，被拖曳的卡片仍會跟隨手指。**原始觸控與回應者系統**（Rust 中的 `.on_touch` 和 `.claim_touches` 連同 `.on_responder_*` 處理器；TSX 中的 `onTouchStart`、`onResponderMove` 和 `PanResponder`）會把每個手指的位置交給你的程式碼，用於另外兩個層級無法表達的情況，例如繪圖。

請選擇能完成工作的最高層級：層級越高，從 UI 執行緒傳到你的程式碼的工作就越少。

<a id="presses"></a>

## 點按

每個元素都接受點按處理器，沒有獨立的「可觸控」元件。你可以把 `.on_press` / `onPress` 放在 view、text、image 或任何其他元素上。

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
| `.on_press(..)` | `onPress` | | 手指在視圖內抬起（發生在點按之後，而非長按）。 |
| `.on_long_press(..)` | `onLongPress` | | 手指按住達到長按延遲時間。其後不會觸發點按處理器。 |
| `.on_press_down(..)` | `onPressDown` | | 點按開始。 |
| `.on_press_up(..)` | `onPressUp` | | 點按結束：手指抬起、滑出視圖，或被捲動檢視接管。 |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | 點按變成長按之前的毫秒數。 |
| `.disabled(..)` | `disabled` | `false` | 不接受點按，也不顯示回饋；套用停用樣式；螢幕閱讀器會讀出它已停用。 |

點按的行為：

- **只有最內層的可點按視圖會回應。** 當可點按的列中包含可點按的按鈕時，按下該按鈕不會觸發列的點按。
- **在捲動檢視內，點按會等待約 130 毫秒**才開始（並顯示回饋），因此從按鈕上開始的拖曳會捲動內容，而不是按下按鈕。
- **滑出會取消點按。** 手指移出視圖時，會觸發點按結束處理器而不會觸發點按。
- **停用會移除點按監聽器**（針對已掛載的內容），因此視圖完全不會顯示回饋，並套用停用樣式（`.disabled_style(..)`、`class="disabled:opacity-40"`）。
- **帶有點按處理器的巢狀文字片段就是連結。** 整個段落是一個原生視圖；點按會交給手指下方的片段。請參閱 [Text](./text.md)。

<a id="press-feedback"></a>

## 點按回饋

點按回饋由應用程式定義：視圖在被按下、懸停、獲得焦點或停用時所採用的樣式。這些樣式在狀態改變的一刻以原生方式套用，無需與你的程式碼往返溝通。每種狀態都有一個 Rust 方法、一個 TSX 樣式屬性和一個 [Tailwind 變體](./tailwind.md)：

| Rust | TSX 屬性 | 類別 | 說明 |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | 被按下時。 |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | 指標位於其上時（桌面裝置、iPad 指標、瀏覽器）。 |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | 擁有焦點時。 |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | 它或其內部的視圖擁有焦點時：例如欄位的外框，包住負責編輯的輸入框。 |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | 停用時。 |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | Android 的 material 漣漪效果（`color`、`borderless`、`radius`、`foreground`），與各種樣式並用。 |

狀態樣式會疊加在視圖本身的樣式之上。較後的狀態優先（懸停、焦點、按下），停用樣式優先於所有其他樣式，而其他狀態樣式在視圖停用期間不會套用。

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

無邊界漣漪會向視圖外擴散，適合圖示按鈕：`Ripple { borderless: true, radius: Some(px(24.0)), .. }`、`android={{ ripple: { borderless: true, radius: 24 } }}`。請參閱[平台專屬程式碼](./platform-specific.md)。

加上轉場（`.transition()`，即 `transition` 類別）後，狀態變化會以動畫呈現。`.group()`（即 `group` 類別）會讓視圖成為群組，而 `.group_active(..)`（`group-active:`）會在群組被按下時為其子視圖套用樣式：

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

## 觸控區域：hitSlop

hitSlop（`.hit_slop(..)`、`hitSlop`）會把接受觸控的區域擴展到視圖邊界之外，而不會改變其版面配置。適用於較小的目標，例如關閉按鈕和開關。

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
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | 在邊界四周增加的點數。`EdgeInsets::all(..)` 和 TSX 中的數字會套用於四邊。 |

請讓擴展後的區域保持在父視圖的邊界之內（在小視圖四周留出一些外距或內距）：命中測試是透過父視圖到達子視圖的，因此落在父視圖之外的觸控永遠不會到達子視圖的擴展區域。

<a id="children-outside-their-parent"></a>

## 位於父視圖之外的子視圖

放置在父視圖邊界之外的子視圖（以絕對定位放置，且 `overflow` 保持可見，例如欄位下方的下拉選單），會像其他視圖一樣在繪製的位置接受觸控：NSH 會以原生方式對延伸到視圖之外的後代進行命中測試。若父視圖裁切了溢出內容，這些子視圖就會被裁切，既不會顯示，也不會在該處接受觸控。該區域是根據版面配置計算的，因此被變形（transform）移出父視圖的子視圖，只會在父視圖的邊界之內接受觸控。

請留意繪製順序：下拉選單只有在其欄位排在同層其他視圖之後，或擁有較高的 `z-index` 時，才會繪製在它們之上，而觸控會交給繪製在最上層的視圖。

## pointerEvents

樣式鍵 `pointerEvents`（Rust 中為 `.pointer_events(..)`）決定子樹中哪些視圖可以成為觸控的目標。它在命中測試期間以原生方式求值，因此每次觸控都不會產生額外成本。

| Rust | TSX | 該視圖 | 其子視圖 |
|---|---|---|---|
| `PointerEvents::Auto`（預設） | `"auto"` | 接受觸控 | 接受觸控 |
| `PointerEvents::None` | `"none"` | 永遠不是目標 | 永遠不是目標，除非其中一個設定了 `"auto"`：觸控會穿透到後方的內容 |
| `PointerEvents::BoxNone` | `"box-none"` | 永遠不是目標 | 接受觸控 |
| `PointerEvents::BoxOnly` | `"box-only"` | 接受觸控 | 永遠不是目標 |

典型用途：不可阻擋下方內容的覆蓋層（none）、空白處應讓觸控穿透到後方內容但其按鈕仍可使用的全螢幕容器（box-none），以及即使手指落在子視圖上也應接受點按的列（box-only）。

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

`"none"` 的繼承方式與 CSS 的 `pointer-events` 相同：其內部設定了 `"auto"` 的視圖會再次接受觸控。`"box-none"` 和 `"box-only"` 則只套用於設定它們的視圖。Tailwind 類別 `pointer-events-none` 和 `pointer-events-auto` 分別設定 `"none"` 和 `"auto"`，而作為樣式鍵時，`pointerEvents` 也接受狀態樣式（`activeStyle` 等）和變體。

<a id="native-gestures-pan-pinch-and-rotation"></a>

## 原生手勢：平移、縮放與旋轉

對於會移動畫面上某個內容的拖曳、縮放和旋轉，請將[動畫值](./animation.md#animated-values)綁定到手勢。平台的手勢辨識器會在 UI 執行緒上寫入這些值，綁定了這些值的視圖會在同一影格內移動；手勢開始和結束時，你的程式碼會收到通知。

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
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | 雙指縮放會驅動 `scale`（一個倍數）。 |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | 雙指旋轉會驅動 `angle`，單位為度。 |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | 拖曳開始 / 結束，附帶一個 `PanEvent`。 |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | 縮放開始 / 結束：其縮放比例和速度（`GestureEvent`）。 |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | 旋轉開始 / 結束：其角度（Rust：`GestureEvent<Radians>`）和速度。 |

平移事件包含位移（`translation`，一個 `Point`：自開始以來的點數）、速度（`velocity_x` / `velocity_y`；TSX：`velocity`，一個 `Point`：每**秒**的點數），以及當下已綁定的值（`value_x` / `value_y`；TSX：`value`、`{ x?, y? }`，包含 `pan` 所綁定的軸）。

原生端會為你處理以下事項：

- **拖曳會從值目前所在之處繼續。** 開始時會讀取這些值，並把位移加到其上；抓住仍在動畫中的值（例如正彈回原位的彈簧動畫）會讓動畫在當前位置停止。
- **只綁定單一軸時，另一個軸可以捲動。** 如果只綁定了水平值，只有當手指的水平移動多於垂直移動時，拖曳才會開始，因此垂直捲動檢視內的水平滑動列仍可垂直捲動。這項判斷是在系統詢問手勢是否可以開始時，以原生方式作出的。
- **平移、縮放和旋轉會在同一視圖上同時運作：**一張卡片可以同時被拖曳、縮放和旋轉。
- **釋放速度可用於物理效果。** 平移結束時的速度會直接作為彈簧或衰減動畫的速度；這些值可讓你選擇吸附點。

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
> 只要拖曳僅是移動內容，就應把動畫值綁定到手勢，而不是透過回應者來追蹤。綁定了值之後，忙碌的應用程式程式碼不會令拖曳卡頓；若使用回應者，每次移動都是傳給你的程式碼的一個事件，並且需要更新視圖所顯示的內容。

<a id="raw-touches"></a>

## 原始觸控

觸控處理器會回報每個手指的按下、移動和抬起。它們適用於記錄日誌、自訂命中測試和回應多點觸控；它們不會獨佔觸控（點按和捲動檢視仍可正常運作）。

在 Rust 中，`.on_touch(..)` 會以 `TouchEvent` 的形式接收每個階段：其 `phase`（`TouchPhase::Start`、`Move`、`End`、`Cancel`）、其 `timestamp` 和其 `points`（每個按下中的手指），每個都附帶其 `id`、在其按下的視圖中的 `location`、在表面中的 `page` 位置，以及事件所涉及手指的 `changed`。在 TSX 中，每個階段各有自己的處理器：

| TSX | 說明 |
|---|---|
| `onTouchStart` | 有手指按在視圖上或視圖內。 |
| `onTouchMove` | 有手指移動。移動事件會按每個引擎週期合併。 |
| `onTouchEnd` | 有手指抬起。 |
| `onTouchCancel` | 系統接管了觸控（捲動檢視開始捲動、來電等）。 |
| `onTouchStartCapture`、`onTouchMoveCapture`、`onTouchEndCapture`、`onTouchCancelCapture` | 同上，但由外向內呼叫，先於冒泡處理器。 |

每個 TSX 處理器都會收到一個 `GestureResponderEvent`：

| 欄位 | 說明 |
|---|---|
| `identifier` | 在手指按下期間識別該手指。 |
| `locationX`、`locationY` | 在手指按下的視圖中的位置（`target`）。 |
| `pageX`、`pageY` | 在表面中的位置。 |
| `target` | 手指按下的視圖的 id。 |
| `timestamp` | 毫秒。 |
| `touches` | 所有按下中的手指。 |
| `changedTouches` | 此事件所涉及的手指。 |
| `nativeEvent` | 事件本身，因此 `e.nativeEvent.locationX` 同樣可用。 |
| `stopPropagation()` | 更外層的視圖不會看到此觸控事件。 |

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

觸控的位置是相對於手指按下的視圖，而該視圖可能是你所關心的視圖的子視圖（例如滑桿的圓鈕）。測量視圖可得知它的位置，這樣你就可以改用頁面位置。在 Rust 中，為視圖加上 `element_ref()` 並等待其 `measure()`；在 TSX 中，對其 ref 呼叫 `measure()`：

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

它會在目前已作出的變更完成版面配置後才完成：在 Rust 中得到一個 `Measurement`（`frame` 是在父視圖中的影格，與版面配置處理器所回報的相同，`page` 是左上角），在 TSX 中則得到 `{ bounds, pagePosition }`。該角落的座標位於表面中，或位於視圖所在的對話框中，與觸控的頁面位置使用相同的座標。周圍捲動檢視和列表的偏移量會被計算在內；變形（包括動畫）則不會。對於不在畫面上的視圖，它會得到 `None` / `null`。
<a id="the-responder-system"></a>

## Responder 系統

當你的程式碼需要掌控一段觸控序列（例如手指繪圖、自訂滑桿，或原生識別器沒有提供的手勢）時，請使用手勢 responder 系統。同一時間只有一個 view 是 **responder** 並接收移動事件，各 view 會協商由誰擔任。

成為 responder：

| Rust | TSX | 說明 |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder`，返回 `true` | 手指按下時詢問，由目標 view 向外詢問。 |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder`，返回 `true` | 在沒有 responder 時（或要接管時），每次移動都會詢問。 |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | 同上，但由外向內詢問，早於冒泡階段的那些。父 view 可用它從子 view 手上奪取觸控。 |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | 移動事件的版本。 |

申領只憑 view 本身決定，不會執行你的任何程式碼，除非申領時要求詢問：`TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` 會在監聽器呼叫 `r.claim()` 時申領，並根據目前為止的手勢（`r.event.gesture`）作出決定。TSX 的處理函式會以第二個參數 `gestureState` 取得手勢，其欄位與 [PanResponder 的](#panresponder)相同（`dx`、`dy`、`vx`、`vy`、`moveX`、`moveY`、`x0`、`y0`、`numberActiveTouches`）。只在水平移動時申領的滑動手勢：`onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`。這個決定仍會遲一次移動才作出，所以外層的 scroll view 可能會先開始捲動；若是 scroll view 內的拖曳，請使用 [pan activation](#pans-inside-scroll-views-panactivation)。

成為 responder 之後：

| Rust | TSX | 說明 |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | 此 view 現在是 responder。Rust 預設不讓原生 scroll view 接手觸控（`TouchClaim::block_native(false)` 可讓它們接手）；在 TSX 中，則返回 `true` 以達到相同效果。 |
| `.on_responder_reject(..)` | `onResponderReject` | 另一個 view 是 responder，而且不肯放手。 |
| `.on_responder_start(..)` | `onResponderStart` | 另一隻手指按下。 |
| `.on_responder_move(..)` | `onResponderMove` | 有手指移動。 |
| `.on_responder_end(..)` | `onResponderEnd` | 有手指提起。 |
| `.on_responder_release(..)` | `onResponderRelease` | 最後一隻手指提起：手勢結束。 |
| `.keep_touches(true)` | `onResponderTerminationRequest`，返回 `false` | 另一個 view 想接手觸控：選擇保留觸控（預設會交出）。 |
| `.on_responder_terminate(..)` | `onResponderTerminate` | 另一個 view 或原生手勢已接手觸控。 |

Rust 元件的 responder 由獲授權起一直保持按下狀態，直至其觸控結束為止，不論手指或指標移到哪裏，就像 CSS 的 `:active` 會一直保持到放開按鈕一樣：其 `.active(..)` 樣式及其內部的 `group-active:` 類別在整個拖曳過程中都會保持外觀（例如把調整大小的把手拖離其範圍）。

Rust 處理函式會取得 `ResponderEvent`：手指在按下的那個 view 中的 `location`、其 `page` 位置，以及自獲授權以來的 `timestamp` 和 `gesture`。

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

運作方式：任何帶有觸控或 responder 處理函式的 view 都會以原生方式監聽觸控；平台會連同監聽中的 view 路徑，回報該 view（及其內部）上的觸控，然後協商在 NSH 的 Rust 核心中進行，依次詢問各個申領並呼叫你的處理函式：先由最外層的 view 向內處理 capture，再由目標 view 向外處理其餘的。由此帶來兩個結果：

- **原生 scroll view 與 responder 互相競爭。** 當 responder 阻擋它們時，周圍的 scroll view 在其結束前不會再接手觸控。如果原生 scroll view 先開始拖曳，則由它勝出：responder 會收到 terminate 處理函式，而觸控處理函式則會收到取消事件。
- **每次移動都是交給你程式碼的一個事件。** 由 responder 驅動的拖曳，流暢程度取決於你的程式碼有多快；若拖曳只是移動 view，建議改用 [bound values](#native-gestures-pan-pinch-and-rotation)。

## PanResponder

在 Rust 中，responder 事件本身已帶有手勢資料：`ResponderEvent::gesture` 是一個 `PanGesture`，包含與起點的距離、速度及手指數量。在 TSX 中，來自 `nsh` 的 `PanResponder` 封裝了 responder 系統，並加入相同的手勢狀態；請把它的 `panHandlers` 展開到 view 上。

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
| `position` | `moveX`、`moveY` | 觸控點質心的最新位置，以 surface point 為單位。 |
| `origin` | `x0`、`y0` | 獲授權 responder 時質心所在的位置。 |
| `delta` | `dx`、`dy` | 自獲授權以來移動的距離。 |
| `vx`、`vy` | `vx`、`vy` | 速度，單位為每秒點數。 |
| `active_touches` | `numberActiveTouches` | 按下的手指數量。 |

在 Rust 中，`PanGesture::begin` 和 `PanGesture::update` 會根據原始觸控（`.on_touch`）追蹤手勢。TSX 的回呼會取得 `(event, gestureState)`：`onStartShouldSetPanResponder(Capture)`、`onMoveShouldSetPanResponder(Capture)`、`onPanResponderGrant`、`onPanResponderReject`、`onPanResponderStart`、`onPanResponderMove`、`onPanResponderEnd`、`onPanResponderRelease`、`onPanResponderTerminate`、`onPanResponderTerminationRequest` 和 `onShouldBlockNativeResponder`。最後一個的預設值為 `true`：已獲授權的 PanResponder 不會讓原生 scroll view 接手其觸控。

<a id="pans-inside-scroll-views-panactivation"></a>

## Scroll view 內的 pan：panActivation

在垂直 scroll view 內以橫向拖動來掃視的圖表，必須接手橫向拖曳，並把垂直拖曳留給 scroll view。一開始就申領觸控會由第一個像素起阻擋捲動，而在你的程式碼中根據移動來決定又太遲：待程式碼回應時，scroll view 可能已經接手了觸控。Pan activation（`TouchClaim::on_pan(..)`、`panActivation`）讓平台在主執行緒上隨手指移動即時作出決定：

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
| `active_offset_x`、`active_offset_y` | `activeOffsetX`、`activeOffsetY` | 手指沿該軸（任一方向，單位為點）移動超過此距離（相對按下位置）後，pan 便會啟動。 |
| `fail_offset_x`、`fail_offset_y` | `failOffsetX`、`failOffsetY` | 手指若先移動超過此距離，pan 便會失敗：scroll view 保留觸控。 |

`PanActivation::horizontal(active, fail)` 和 `PanActivation::vertical(active, fail)` 用於設定常用的成對數值。若沒有設定 active offset，pan 會在任何方向移動 10 點後啟動。在啟動之前，周圍的 scroll view 會等待它（iOS），而該 view 的其他申領也不會被詢問。啟動後，scroll view 不能再接手這些觸控，而該 view 會成為 responder（先是授權，然後是移動）；若 pan 失敗，scroll view 則照常捲動。在 TSX 中，`PanResponder` 的 `panHandlers` 也能配合使用：把它們與該 prop 一併展開，`onPanResponderGrant` 會在啟動時執行。

> [!NOTE]
> 所有速度的單位都是每秒點數：responder 手勢的 `vx` / `vy`、pan 的速度，以及 spring 或 decay 的速度，因此 `vx` 可以原樣傳給 spring 或 decay。

<a id="why-some-answers-are-props"></a>

## 為何有些回應是 prop

主執行緒從不等待你的程式碼。當系統需要即時回應（這個 pan 手勢是否可以開始、這個點是否命中該 view、這次點按是否應收起鍵盤）時，NSH 會根據事先已掛載的內容以原生方式作答：綁定的 pan 值（其軸向）、pinch 值、hit slop、pointer events、scroll view 的鍵盤點按設定，以及 pan activation。你的處理函式只會在事情發生之後才得知。這就是為何這些都是宣告式設定而非回呼，也是為何會執行你程式碼的 responder 協商，只用來在 responder 之間作決定，而絕不會阻擋原生手勢。

<a id="related"></a>

## 相關內容

- [`View`](../elements/view.md)：基本元素上的所有觸控 prop。
- [Animation](./animation.md)：用於手勢驅動動態效果的 animated value、spring 和 decay。
- [Scrolling](./scrolling.md)：鍵盤點按設定、scroll view 與巢狀手勢。
- [`PanResponder`](../modules/nsh.md#panresponder)：`PanResponder` 參考文件。
- [Accessibility](./accessibility.md)：可按壓的 view 屬於無障礙元素，請為它們提供 role 和 label。
