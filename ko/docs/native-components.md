---
title: "네이티브 컴포넌트"
description: "호스트 앱의 뷰(지도, 플레이어, 모든 UIView 또는 Android View)를 props, 이벤트, 명령, 크기 조정과 함께 NSH 앱 안에서 사용합니다."
order: 18
group: platforms
source_hash: e798ebb6480fceba
---

# 네이티브 컴포넌트

네이티브 컴포넌트는 **임베딩 앱**이 이름으로 등록하는 뷰입니다. 지도, 카메라 미리보기, 차트 라이브러리, iOS의 `UIView`, Android의 `android.view.View`, macOS의 `NSView`, Linux의 `gtk::Widget`, 또는 Windows의 Direct2D 드로잉이나 자식 `HWND` 등 무엇이든 될 수 있습니다. NSH 앱은 이것을 다른 요소와 똑같이 사용합니다. Rust 앱은 `nsh_core::prelude`의 `native(name)`로 만들고, TSX 앱은 [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule)의 `nativeComponent()`로 선언합니다. NSH는 이 컴포넌트를 앱의 나머지 부분과 함께 레이아웃하고, props를 전달하고, 이벤트를 핸들러에 전달하며, `ref`에서 보낸 명령을 넘겨줍니다.

NSH는 시스템 자체의 뷰로 렌더링하므로, 네이티브 컴포넌트는 같은 계층 구조 안의 또 하나의 서브뷰일 뿐입니다. 레이어링 문제가 없으며, `<View>`처럼 클리핑되고, 스크롤되고, 터치를 받습니다.

> [!NOTE]
> 네이티브 컴포넌트는 NSH를 임베딩하는 앱이 등록하거나([iOS](./ios.md), [Android](./android.md), [macOS](./macos.md#embedding-in-a-mac-app), [Linux](./linux.md#embedding-in-a-gtk-app), [Windows](./windows.md#embedding-in-a-win32-app)), Windows, macOS, Linux, iOS에서는 앱 자체의 Rust crate가 등록합니다. 이 crate의 컴포넌트는 개발 호스트와 패키징된 앱(`nsh package`)이 등록합니다([앱의 crate에서 등록하기](#registering-from-the-apps-crate)). 아무것도 등록하지 않은 이름은 빈 뷰로 렌더링됩니다(이름은 알 수 없는 이름으로 한 번 로그에 기록됩니다).

<a id="how-it-fits-together"></a>

## 동작 방식

1. 호스트 앱이 `NshAppView`(iOS) 또는 `NshView`(Android)에 `"embed.badge"` 같은 이름으로 팩토리를 등록합니다. 각 뷰는 자체 레지스트리를 가지며, 전역 레지스트리는 없습니다.
2. NSH 앱이 그 이름에 대한 컴포넌트를 사용하는 props와 이벤트와 함께 선언합니다.
3. 요소가 생성되면 NSH는 컨테이너 뷰를 만들고(다른 뷰와 같이 꾸미고, 프레임을 지정하고, 히트 테스트를 수행합니다), 팩토리에 컴포넌트를 요청한 다음 컴포넌트의 뷰를 컨테이너 안에 가득 채워 넣습니다.
4. 컴포넌트는 생성 직후 모든 prop을 받고, 이후 prop이 변경될 때마다 해당 prop을 다시 받습니다.
5. 컴포넌트는 이벤트를 내보내고 자신의 크기를 보고할 수 있으며, 앱은 `ref`를 통해 컴포넌트의 명령을 호출합니다.

<a id="using-the-component-in-the-app"></a>

## 앱에서 컴포넌트 사용하기

Rust에서는 `native(name)`가 요소를 만듭니다. `.prop(name, value)`는 prop을 지정하고(`serde_json::Value`이거나, 시그널 또는 그 클로저이며, 값이 바뀌면 다시 전송됩니다), `.on_native_event(..)`는 컴포넌트의 이벤트를 `NativeEvent { name, data }`로 수신하며, `.element_ref(&r)`로 요소에 지정한 `element_ref()`의 메서드는 명령을 보냅니다. TSX에서는 `nativeComponent()`가 사용할 props와 이벤트와 함께 해당 이름의 컴포넌트를 선언합니다.

```rust tabs
use nsh_core::prelude::*;
use serde_json::json;

const COLORS: [&str; 4] = ["#8250df", "#0969da", "#1a7f37", "#cf222e"];

#[component]
pub fn App() -> impl IntoElement {
    let taps = signal(0_u64);
    let badge = element_ref();
    view()
        .flex_1()
        .p(px(20.0))
        .pt_safe_area_plus(px(20.0))
        .pb_safe_area_plus(px(20.0))
        .gap(px(16.0))
        .bg(rgb(0xf6f8fa))
        .child(text("Rendered by nsh").text_size(px(22.0)).font_weight(FontWeight::BOLD))
        .child(
            // The host app's badge: a label it draws, sized to its text.
            native("embed.badge")
                .element_ref(&badge)
                .prop("text", move || match taps.get() {
                    0 => json!("Tap the native badge"),
                    n => json!(format!("Tapped {n}×")),
                })
                .prop("color", move || json!(COLORS[taps.get() as usize % COLORS.len()]))
                .on_native_event(move |e: &NativeEvent| {
                    if &*e.name == "tap" {
                        taps.set(e.data["count"].as_u64().unwrap_or(0));
                        badge.command("pulse", json!(null));
                    }
                })
                .self_start()
                .rounded(px(8.0))
                .overflow_hidden(),
        )
        .child(text(move || format!("Rust saw {} taps", taps.get())))
}
```

```tsx tabs
import { mount, type NativeComponentRef, signal, Text, View } from "nsh";
import { nativeComponent } from "nsh";

/** The host app's badge: a label it draws, sized to its text. */
const Badge = nativeComponent<{ text: string; color?: string }, { tap: { count: number } }>("embed.badge", {
  props: ["text", "color"],
  events: ["tap"],
});

const colors = ["#8250df", "#0969da", "#1a7f37", "#cf222e"];

function App() {
  const taps = signal(0);
  let badge: NativeComponentRef | undefined;
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: "calc(env(safe-area-inset-top) + 20px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)", gap: 16, backgroundColor: "#f6f8fa" }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Rendered by nsh</Text>
      <Badge
        ref={(node) => (badge = node)}
        text={taps() === 0 ? "Tap the native badge" : `Tapped ${taps()}×`}
        color={colors[taps() % colors.length]}
        onTap={(e) => {
          taps.set(e.count);
          badge?.command("pulse");
        }}
        style={{ alignSelf: "flex-start", borderRadius: 8, overflow: "hidden" }}
      />
      <Text>{`JS saw ${taps()} taps`}</Text>
    </View>
  );
}

mount(App);
```

TSX 버전은 `examples/embedded/App.tsx`이며, 저장소의 두 임베딩 샘플이 모두 이를 실행합니다.

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `name` | `string` | 호스트 앱이 등록한 이름입니다. 이름이 고유하도록 자신만의 접두사(`"maps.view"`, `"acme.chart"`)를 사용하세요. |
| `spec.props` | `readonly (keyof P & string)[]` | 컴포넌트 고유의 props입니다. 여기에 나열된 props만 네이티브 쪽으로 전송됩니다. |
| `spec.events` | `readonly (keyof E & string)[]` | 컴포넌트가 내보내는 이벤트입니다. 선택 사항입니다. |

타입 매개변수는 props(`P`)와 각 이벤트의 페이로드(`E`)를 설명합니다. 반환된 컴포넌트는 다음을 받습니다.

- 컴포넌트 고유의 props `P`
- 이벤트별 핸들러: 이벤트 `tap`는 `onTap`이, `regionChange`은 `onRegionChange`이 처리합니다(첫 글자를 대문자로 바꾸고 앞에 `on`를 붙입니다).
- children을 제외하고 `<View>`이 받는 모든 것: `style`, `class` / `classList`([Tailwind](./tailwind.md)), 레이아웃, 접근성 props, `testID`, `onLayout`, `ref`. 이들은 컴포넌트가 아니라 NSH가 그리는 컨테이너에 적용됩니다.

네이티브 컴포넌트는 리프이므로 children을 받지 않습니다.

## Props

각 고유 prop은 JSON으로 전송되므로 값은 문자열, 숫자, 불리언, `null`, 배열, 일반 객체 등 어떤 JSON 값이든 될 수 있습니다. Props는 다른 props와 마찬가지로 반응형입니다. Rust prop의 클로저(`.prop("text", move || json!(label.get()))`)나 TSX의 `text={label()}`가 시그널을 읽으면, 시그널이 바뀔 때에만 새 값이 전송됩니다.

| 앱에서 일어나는 일 | 컴포넌트가 받는 것 |
|---|---|
| 요소가 생성됨 | 설정된 모든 고유 prop. 컴포넌트가 만들어진 직후에 받습니다 |
| prop 값이 변경됨 | 새 값을 가진 해당 prop |
| prop이 `undefined`가 됨 | 값이 없는 해당 prop(Swift에서는 `nil`, Java에서는 `null`) |
| 애니메이션 값에 바인딩된 prop이 움직임 | 값이 바뀌는 프레임마다 `setAnimatedNumber` / `setAnimatedColor` |

Props는 JSON 값을 전달하므로 인터페이스는 데이터로 한정하세요(함수와 클래스 인스턴스는 앱에 남습니다).

<a id="animated-props"></a>

### 애니메이션 props

prop은 애니메이션 값일 수도 있습니다. `AnimatedValue`이거나 그로부터 파생된 노드(`interpolate`, 스크롤 뷰의 `scrollValue` 또는 `pullValue`)가 해당합니다. 이 경우 JSON으로 전송되지 않습니다. NSH가 값을 바인딩하고, 컴포넌트는 값이 바뀌는 모든 프레임마다 JS를 거치지 않고 UI 스레드에서 값을 전달받으므로, 드래그나 당겨서 새로고침을 따라갈 수 있습니다.

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

컴포넌트는 숫자를 `setAnimatedNumber(name, value)`로, 색상을 `setAnimatedColor(name, argb)`(`0xAARRGGBB`)로 받습니다. 기본적으로 둘 다 숫자와 함께 `setProp`를 호출하므로, 이를 구현하지 않은 컴포넌트도 값을 받습니다. Rust 컴포넌트는 `set_animated_number`와 `set_animated_color`를 구현하며, Rust 코드는 `native(name).bind_animated_prop("progress", &value)`로 prop을 바인딩합니다. prop에 다시 일반 값을 지정하면 바인딩이 해제되고 그 값이 전송됩니다. 웹에는 등록된 컴포넌트가 없습니다.

<a id="events"></a>

## 이벤트

컴포넌트는 선택적 JSON 페이로드와 함께 이름으로 이벤트를 내보냅니다. NSH는 이를 엔진 스레드로 전달하고 페이로드와 함께 해당 핸들러를 호출합니다(Rust에서는 이벤트의 `name`와 `data`를 가진 `on_native_event` 리스너 하나가 호출됩니다).

```rust tabs
use serde_json::json;

native("acme.map")
    .prop("latitude", json!(52.52))
    .prop("longitude", json!(13.405))
    .on_native_event(move |e: &NativeEvent| match &*e.name {
        "regionChange" => center.set((
            e.data["latitude"].as_f64().unwrap_or_default(),
            e.data["longitude"].as_f64().unwrap_or_default(),
        )),
        "markerPress" => open(e.data["id"].as_str().unwrap_or_default()),
        _ => {}
    })
    .flex_1()
```

```tsx tabs
const MapView = nativeComponent<
  { latitude: number; longitude: number; zoom?: number },
  { regionChange: { latitude: number; longitude: number }; markerPress: { id: string } }
>("acme.map", {
  props: ["latitude", "longitude", "zoom"],
  events: ["regionChange", "markerPress"],
});

<MapView
  latitude={52.52}
  longitude={13.405}
  onRegionChange={(region) => center.set(region)}
  onMarkerPress={({ id }) => open(id)}
  style={{ flex: 1 }}
/>;
```

이벤트는 비동기입니다. 메인 스레드는 앱 코드를 기다리지 않습니다. 그 자리에서 무언가를 결정해야 하는 컴포넌트(이 제스처를 시작해도 되는지, 이 영역을 변경해도 되는지 등)는 이전에 받은 props를 바탕으로 네이티브에서 직접 결정해야 합니다.

<a id="commands"></a>

## 명령

명령형 호출(특정 지점으로 줌, 재생 시작, 애니메이션 펄스 등)은 요소의 ref(Rust에서는 `element_ref()`, TSX에서는 `ref`)를 통해 수행합니다.

```rust tabs
let map = element_ref();

native("acme.map")
    .element_ref(&map)
    .prop("latitude", json!(52.52))
    .prop("longitude", json!(13.405))
    .flex_1()

map.command("zoomTo", json!({ "level": 3 }));
```

```tsx tabs
let map: NativeComponentRef | undefined;

<MapView ref={(node) => (map = node)} latitude={52.52} longitude={13.405} style={{ flex: 1 }} />;

map?.command("zoomTo", { level: 3 });
```

`command(name, args)`(TSX: `command(name, args?)`)은 이름과 인자(임의의 JSON 값)를 컴포넌트의 `command` 메서드로 보냅니다. 명령은 그 이전에 이루어진 변경 사항과 함께 순서대로 적용되므로, prop 변경 직후에 내린 명령은 새 prop을 볼 수 있습니다.

<a id="sizing"></a>

## 크기 지정

컨테이너는 `<View>`처럼 레이아웃됩니다.

- 스타일이 치수(`width`, `height`, `flex: 1`, `alignSelf: "stretch"` 등)를 지정하면 그 치수가 우선합니다.
- 스타일이 치수를 지정하지 않으면, 이미지가 고유 크기를 갖는 것처럼 컨테이너는 컴포넌트가 `setSize`로 보고한 크기를 사용합니다. 크기를 한 번도 보고하지 않는 컴포넌트는 지정되지 않은 치수에서 0으로 측정됩니다.

콘텐츠가 바뀔 때마다 크기를 포인트(iOS) 또는 dp(Android) 단위로 보고하세요. 위의 배지는 `text`가 바뀔 때마다 레이블을 측정해 레이블의 크기에 패딩을 더한 값을 보고하므로, `alignSelf: "flex-start"`는 배지의 너비를 텍스트와 정확히 같게 만듭니다.

<a id="registering-on-ios-swift"></a>

## iOS에서 등록하기 (Swift)

`NshComponent`를 구현하고 `NshAppView`에 팩토리를 등록합니다.

```swift
import NativeShell
import UIKit

/// `embed.badge`: props `text` and `color`; emits `tap`; command `pulse`.
final class Badge: NshComponent {
    let view = UIView()
    private let label = UILabel()
    private let context: NshComponentContext
    private var taps = 0

    init(_ context: NshComponentContext) {
        self.context = context
        label.textColor = .white
        label.font = .boldSystemFont(ofSize: 17)
        label.textAlignment = .center
        label.frame = view.bounds
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(label)
        view.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(tapped)))
    }

    func setProp(_ name: String, _ value: Any?) {
        switch name {
        case "text":
            label.text = value as? String
            let size = label.intrinsicContentSize
            context.setSize(CGSize(width: size.width + 32, height: size.height + 20))
        case "color":
            view.backgroundColor = (value as? String).flatMap(UIColor.init(hex:)) ?? .systemPurple
        default:
            break
        }
    }

    func command(_ name: String, _ args: Any?) {
        guard name == "pulse" else { return }
        view.alpha = 0.3
        UIView.animate(withDuration: 0.6) { self.view.alpha = 1 }
    }

    @objc private func tapped() {
        taps += 1
        context.emit("tap", ["count": taps])
    }
}

// Before loading the bundle:
app.register(component: "embed.badge") { context in Badge(context) }
```

(`UIColor(hex:)`는 샘플의 작은 헬퍼이며 NativeShell의 일부가 아닙니다.)

| API | 설명 |
|---|---|
| `NshAppView.register(component:_:)` | 이름으로 팩토리 `(NshComponentContext) -> NshComponent`를 등록합니다. 이후 생성되는 요소마다 컴포넌트를 하나씩 만듭니다. 같은 이름을 다시 등록하면 팩토리가 교체됩니다. |
| `protocol NshComponent` | `var view: UIView`(컨테이너를 채움), `setProp(_:_:)`, `command(_:_:)`(선택 사항: 기본 구현은 명령을 무시합니다). 메인 액터에 격리됩니다. |
| `setProp(_ name: String, _ value: Any?)` | 값은 Foundation JSON 객체입니다: `String`, `NSNumber`, `[Any]`, `[String: Any]`, `NSNull`. prop이 제거되면 `nil`입니다. |
| `NshComponentContext.emit(_:_:)` | 이벤트를 내보냅니다. 데이터는 `JSONSerialization`가 받아들이는 값(또는 `nil`)이어야 합니다. 스레드 안전합니다. |
| `NshComponentContext.setSize(_:)` | 컴포넌트 자체의 크기를 포인트 단위로 보고합니다. 스레드 안전합니다. |

<a id="registering-on-android-java--kotlin"></a>

## Android에서 등록하기 (Java / Kotlin)

`com.longbridge.nsh.NshComponent`를 구현하고 `NshView`에 팩토리를 등록합니다.

```java
import com.longbridge.nsh.NshComponent;
import com.longbridge.nsh.NshComponentContext;

final class Badge implements NshComponent {
    private final TextView label;
    private final NshComponentContext context;
    private final float density;
    private int taps;

    Badge(Context app, NshComponentContext context) {
        this.context = context;
        density = app.getResources().getDisplayMetrics().density;
        label = new TextView(app);
        label.setTextColor(Color.WHITE);
        label.setTextSize(17);
        label.setGravity(Gravity.CENTER);
        label.setOnClickListener(v -> context.emit("tap", Collections.singletonMap("count", ++taps)));
    }

    @Override
    public View view() {
        return label;
    }

    @Override
    public void setProp(String name, Object value) {
        if (name.equals("text")) {
            label.setText(value instanceof String ? (String) value : "");
            label.measure(0, 0);
            // Sizes are in dp.
            context.setSize(label.getMeasuredWidth() / density + 32, label.getMeasuredHeight() / density + 12);
        } else if (name.equals("color")) {
            label.setBackgroundColor(value instanceof String ? Color.parseColor((String) value) : 0xff8250df);
        }
    }

    @Override
    public void command(String name, Object args) {
        if (!name.equals("pulse")) return;
        label.setAlpha(0.3f);
        label.animate().alpha(1).setDuration(600).start();
    }
}

// Before loading the bundle:
nsh.registerComponent("embed.badge", context -> new Badge(this, context));
```

Kotlin에서도 동일합니다.

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | 설명 |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | 이름으로 팩토리를 등록합니다. 이후 생성되는 요소마다 컴포넌트를 하나씩 만듭니다(UI 스레드). |
| `interface NshComponent` | `View view()`, `void setProp(String, Object)`, `default void command(String, Object)`, `default void destroy()`(요소가 사라진 경우입니다. 제거되었거나, 해당 앱이 `NshView.destroy()`로 중지되었거나, 다른 로드로 교체된 경우이며, 컴포넌트당 한 번 호출됩니다). UI 스레드에서 호출됩니다. |
| `setProp` 값 | `String`, `Number`, `Boolean`, `java.util.List`, `java.util.Map`, 또는 제거된 경우 `null`(또는 JSON `null`). |
| `NshComponentContext.emit(String event, Object data)` | 이벤트를 내보냅니다. `data`는 동일한 Java 타입이거나 `null`입니다. 모든 스레드에서 호출할 수 있습니다. |
| `NshComponentContext.setSize(float width, float height)` | 컴포넌트 자체의 크기를 dp 단위로 보고합니다. 모든 스레드에서 호출할 수 있습니다. |

<a id="registering-from-rust"></a>

## Rust에서 등록하기

Rust에서 iOS 런타임을 임베딩하는 앱(`nsh-platform-ios`)은 `AppView`에 `NativeComponent`를 등록합니다.

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_ios::{AppView, ComponentContext, NativeComponent};
use objc2_ui_kit::UIView;

struct Badge {
    view: objc2::rc::Retained<UIView>,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn view(&self) -> &UIView {
        &self.view
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        // ... update the view, then report its size in points:
        self.context.set_size(120.0, 40.0);
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView, make_view: impl Fn() -> objc2::rc::Retained<UIView> + 'static) {
    app.register_component(
        "embed.badge",
        Rc::new(move |context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { view: make_view(), context })
        }),
    );
}
```

`ComponentContext::emit(name, data)`는 이벤트를 보내고(`data`는 `serde_json::Value`입니다), `set_size(width, height)`는 크기를 보고합니다. 둘 다 모든 스레드에서 동작합니다.

<a id="registering-on-macos-rust"></a>

## macOS에서 등록하기 (Rust)

macOS에서 컴포넌트는 `NSView`이며, `nsh-platform-macos`의 [`AppView`](./macos.md#embedding-in-a-mac-app)에 등록합니다.

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_macos::{
    objc2::{rc::Retained, MainThreadMarker},
    objc2_app_kit::{NSTextField, NSView},
    objc2_foundation::NSString,
    AppView, ComponentContext, NativeComponent,
};

struct Badge {
    label: Retained<NSTextField>,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn view(&self) -> Retained<NSView> {
        Retained::into_super(Retained::into_super(self.label.clone()))
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        if name == "text" {
            let text = value.and_then(|v| v.as_str()).unwrap_or("");
            self.label.setStringValue(&NSString::from_str(text));
            self.context.set_size(120.0, 40.0);
        }
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView, mtm: MainThreadMarker) {
    app.register_component(
        "embed.badge",
        Rc::new(move |context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { label: NSTextField::labelWithString(&NSString::new(), mtm), context })
        }),
    );
}
```

뷰는 NSH가 레이아웃한 컨테이너를 채웁니다. `ComponentContext::emit`와 `set_size`(포인트)는 iOS와 마찬가지로 모든 스레드에서 동작합니다. `AppView::load` 전에 등록하세요. 레지스트리는 하나의 `AppView`에 속합니다(그리고 같은 `AppOptions`에서 만든 뷰들에도 속합니다).

<a id="registering-on-linux-rust"></a>

## Linux에서 등록하기 (Rust)

Linux에서 컴포넌트는 GTK 위젯이며, `nsh-platform-linux`의 [`AppView`](./linux.md#embedding-in-a-gtk-app)에 등록합니다.

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_linux::{gtk4 as gtk, AppView, ComponentContext, NativeComponent};
use gtk::prelude::*;

struct Badge {
    label: gtk::Label,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn widget(&self) -> gtk::Widget {
        self.label.clone().upcast()
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        if name == "text" {
            self.label.set_text(value.and_then(|v| v.as_str()).unwrap_or(""));
            self.context.set_size(120.0, 40.0);
        }
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView) {
    app.register_component(
        "embed.badge",
        Rc::new(|context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { label: gtk::Label::new(None), context })
        }),
    );
}
```

위젯은 NSH가 레이아웃한 컨테이너를 채웁니다. `ComponentContext::emit`와 `set_size`(포인트)는 iOS와 마찬가지로 모든 스레드에서 동작합니다. `AppView::load` 전에 등록하세요. 레지스트리는 하나의 `AppView`에 속합니다(그리고 같은 `AppOptions`에서 만든 뷰들에도 속하며, 레지스트리는 그 `components` 필드입니다).

<a id="registering-on-windows-rust"></a>

## Windows에서 등록하기 (Rust)

Windows에서 NSH는 모든 뷰를 Direct2D로 직접 그리므로, 컴포넌트는 Direct2D로 컨테이너에 직접 그리거나(`draw`) 자체 창을 가져옵니다(`window`: 지도 컨트롤, 서드파티 뷰). 컴포넌트는 `nsh-platform-windows`의 [`AppView`](./windows.md#embedding-in-a-win32-app)에 등록합니다.

```rust
use std::rc::Rc;
use nsh_core::JsonValue;
use nsh_platform_windows::{
    windows::Win32::Graphics::Direct2D::{
        Common::{D2D1_COLOR_F, D2D_RECT_F},
        ID2D1DeviceContext,
    },
    AppView, ComponentContext, NativeComponent,
};

/// A box filled with the color of its `on` prop.
struct Badge {
    on: bool,
    context: ComponentContext,
}

impl NativeComponent for Badge {
    fn draw(&self, dc: &ID2D1DeviceContext, size: (f32, f32)) {
        let color = if self.on {
            D2D1_COLOR_F { r: 0.2, g: 0.7, b: 0.3, a: 1.0 }
        } else {
            D2D1_COLOR_F { r: 0.6, g: 0.6, b: 0.6, a: 1.0 }
        };
        // SAFETY: Direct2D calls on the context nsh draws with.
        unsafe {
            if let Ok(brush) = dc.CreateSolidColorBrush(&color, None) {
                let rect = D2D_RECT_F { left: 0.0, top: 0.0, right: size.0, bottom: size.1 };
                dc.FillRectangle(&rect, &brush);
            }
        }
    }

    fn set_prop(&mut self, name: &str, value: Option<&JsonValue>) {
        if name == "on" {
            self.on = value.and_then(|v| v.as_bool()).unwrap_or(false);
            self.context.set_size(120.0, 40.0);
            self.context.redraw();
        }
    }

    fn command(&mut self, name: &str, args: &JsonValue) {
        // optional
    }
}

fn register(app: &AppView) {
    app.register_component(
        "embed.badge",
        Rc::new(|context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { on: false, context })
        }),
    );
}
```

`draw`는 창의 매 프레임마다 뷰의 좌표(포인트) 기준으로 실행되며 뷰의 경계로 클리핑됩니다. 표시하는 내용이 바뀌면 `ComponentContext::redraw`를 호출하세요. 그려지는 컴포넌트는 다른 뷰와 마찬가지로 가려지고, 클리핑되고, 변형되며, 터치는 컨테이너가 받습니다. `window`에서 자식 창을 반환하는 컴포넌트는 뷰와 함께 이동, 클리핑, 숨김 처리되고, 자체 입력을 받으며, NSH가 그리는 모든 것의 위에 놓입니다(웹 뷰와 마찬가지로 그 위의 NSH 콘텐츠는 가려집니다). `ComponentContext::emit`, `set_size`(포인트), `redraw`는 모든 스레드에서 동작합니다. `AppView::load` 전에 등록하세요. 레지스트리는 하나의 `AppView`에 속합니다(그리고 같은 `AppOptions`에서 만든 뷰들에도 속합니다).

컴포넌트는 `wheel`로 그 위에서 발생한 마우스 휠과 터치패드 스크롤도 받을 수 있습니다(이미지 뷰어는 이를 이용해 확대/축소합니다). 컴포넌트가 받는 `Wheel`에는 포인터(`x`, `y`, 컴포넌트의 포인트 단위), 포인트 단위 거리(`dx`, `dy`, 스크롤 뷰가 콘텐츠를 움직이는 방식과 같이 오른쪽과 아래쪽이 양수), 휠 노치 단위 거리(`notches_x`, `notches_y`, 정밀 터치패드와 고해상도 휠에서는 소수 값 포함), 세밀한 단계로 들어왔는지 여부(`precise`), 눌린 수정자 키(`shift`, `ctrl`, `alt`)가 들어 있습니다. 컴포넌트가 처리한 스크롤에는 `true`을 반환합니다. 그 주변의 스크롤 뷰는 나머지 스크롤을 처리하며, 기본적으로 모든 스크롤을 처리합니다. 스크롤 뷰가 이미 시작한 스크롤은 그 뷰에 계속 남습니다. Ctrl + 휠은 정밀 터치패드의 핀치이기도 하며, Shift + 휠은 휠이 보낸 그대로 도착합니다(`dy`, `shift` 포함).

```rust
use nsh_platform_windows::Wheel;

impl NativeComponent for ImageView {
    // draw, set_prop, ...

    fn wheel(&mut self, event: &Wheel) -> bool {
        if !event.ctrl {
            return false; // the scroll views around it scroll
        }
        // √2 per notch, about the pointer.
        let factor = 2f32.powf(-event.notches_y / 2.0);
        self.zoom_about(event.x, event.y, factor);
        self.context.redraw();
        true
    }
}
```

<a id="registering-from-the-apps-crate"></a>

## 앱의 crate에서 등록하기

자체 Rust crate가 있는 앱(`nsh.json` `"rust"`, [Rust](./rust.md))은 그 crate에서 네이티브 컴포넌트를 등록하므로, NSH가 앱을 위해 빌드하는 호스트, 즉 `nsh run`와 `nsh test --target`의 개발 호스트와 `nsh package`이 만드는 앱에서 동작합니다. crate 루트에서 `#[native_components(<platform>)]`가 붙은 함수(`lib.rs`)가 해당 플랫폼의 `Components`에 컴포넌트를 등록하며, 임베딩 앱이 `AppView`에 등록하는 것처럼 호스트가 만드는 모든 뷰마다 이 함수를 호출합니다.

```rust
use std::rc::Rc;
use nsh_core::prelude::*;

#[native_components(windows)]
fn components(components: &nsh_platform_windows::Components) {
    use nsh_platform_windows::{ComponentContext, NativeComponent};
    components.register(
        "embed.badge",
        Rc::new(|context: ComponentContext| -> Box<dyn NativeComponent> {
            Box::new(Badge { on: false, context })
        }),
    );
}
```

플랫폼은 `windows`, `macos`, `linux`, `ios` 중 하나이며, 컴포넌트는 각각 `nsh_platform_windows`, `nsh_platform_macos`, `nsh_platform_linux`, `nsh_platform_ios`의 것입니다(위의 각 섹션 참고). 이 함수는 해당 플랫폼에서만 컴파일되므로, crate는 지원하는 플랫폼마다 함수를 하나씩 두고 각각 같은 이름을 등록하며, 각 플랫폼의 crate에는 해당 플랫폼에 대해서만 의존합니다. 버전과 소스는 다른 NSH crate(`nsh-core` 등)와 같아야 합니다(CLI가 모두 일치하는지 확인합니다).

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

호스트는 뷰를 만들 때 해당 뷰를 가진 코드가 자신의 컴포넌트를 등록하기 전에 crate의 컴포넌트를 먼저 등록합니다. 그 이후에 뷰에 등록한 같은 이름(`AppView::register_component`)은 crate의 것을 대체합니다.
<a id="rules-and-limits"></a>

## 규칙과 제한

- **로드하기 전에 등록하세요.** Factory는 등록 이후에 생성되는 element에만 적용됩니다. 첫 프레임에서 찾을 수 있도록 `loadBundle` / `loadAssetBundle` / `run` 전에 모든 이름을 등록하세요.
- **컨테이너가 장식과 터치를 담당합니다.** 배경, 테두리, 모서리 반경, 그림자, 불투명도, 변형(transform), `overflow: "hidden"`은 NSH가 그리는 컨테이너에 적용됩니다. 여러분의 뷰는 컨테이너를 채우고, 컨테이너 안쪽에 닿는 터치를 전달받습니다.
- **Capabilities는 적용되지 않습니다.** 등록된 컴포넌트는 호스트 앱 자체의 코드이므로, 앱이 선언한 [capabilities](./sandbox-and-capabilities.md)는 해당 컴포넌트의 동작을 제한하지 않습니다. 신뢰할 수 없는 앱을 임베드하는 경우에는 해당 앱이 사용해도 안전한 컴포넌트만 등록하세요.
- **인터페이스는 데이터로 유지하세요.** Props, 이벤트 페이로드, 커맨드 인자는 JSON 텍스트로 전달됩니다. 변경이 있을 때마다 큰 blob을 보내지 말고 식별자와 작은 값만 보내세요.
- **하나의 번들, 두 플랫폼.** iOS와 Android에서 동일한 이름을 동일한 props와 이벤트로 등록하면, 하나의 번들이 두 플랫폼에서 실행됩니다.
- **`nsh/` 아래의 이름은 NSH의 것입니다.** NSH의 자체 컴포넌트(`nsh/mobile`의 `TabBar`인 시스템 탭 바)는 `nsh/` 아래에 등록되어 있습니다. 여러분의 컴포넌트에는 앱이나 회사 이름을 사용하세요(`embed.badge`). `nsh/` 아래에 등록하면 경고가 기록되고 NSH의 컴포넌트가 유지됩니다.

## See also

- [`nativeComponent` reference](../modules/nsh.md#nativecomponent-and-nativemodule)
- [Embedding in iOS apps](./ios.md) 및 [in Android apps](./android.md)
- [Architecture](./architecture.md): props와 이벤트가 스레드를 넘나드는 방식
