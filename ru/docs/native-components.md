---
title: "Нативные компоненты"
description: "Используйте представления хост-приложения (карты, плееры, любой UIView или Android View) внутри приложения NSH: свойства, события, команды и определение размеров."
order: 18
group: platforms
source_hash: e798ebb6480fceba
---

# Нативные компоненты

Нативный компонент — это view, которое **встраивающее приложение** регистрирует под именем: карта, предпросмотр камеры, библиотека графиков, любой
`UIView` на iOS, `android.view.View` на Android, `NSView` на macOS, `gtk::Widget` на Linux, либо рисование через Direct2D или дочерний
`HWND` на Windows. Приложение NSH использует его как любой другой элемент: приложение на Rust создаёт его с помощью `native(name)` из
`nsh_core::prelude`, приложение на TSX объявляет его с помощью `nativeComponent()` из [`nsh`](../modules/nsh.md#nativecomponent-and-nativemodule). NSH размещает его вместе с остальным
приложением, отправляет ему props, доставляет его события обработчикам и пересылает команды из `ref`.

Поскольку NSH рендерит системными view, нативный компонент — это просто ещё одно subview в той же иерархии:
проблемы наложения слоёв нет, он обрезается, прокручивается и получает касания так же, как `<View>`.

> [!NOTE]
> Нативные компоненты регистрирует приложение, которое встраивает NSH ([iOS](./ios.md), [Android](./android.md),
> [macOS](./macos.md#embedding-in-a-mac-app), [Linux](./linux.md#embedding-in-a-gtk-app),
> [Windows](./windows.md#embedding-in-a-win32-app)), а на Windows, macOS, Linux и iOS — собственный Rust-крейт приложения,
> компоненты которого регистрируют хост разработки и собранное приложение (`nsh package`)
> ([Регистрация из крейта приложения](#registering-from-the-apps-crate)). Имя, под которым ничего не зарегистрировано, отображается как пустое
> view (имя один раз записывается в лог как неизвестное).

<a id="how-it-fits-together"></a>

## Как это устроено

1. Приложение-хост регистрирует фабрику под именем, например `"embed.badge"`, в своём `NshAppView` (iOS) или `NshView`
   (Android). У каждого view свой реестр; глобального нет.
2. Приложение NSH объявляет компонент для этого имени с теми props и событиями, которые ему нужны.
3. При создании элемента NSH создаёт view-контейнер (с оформлением, рамкой и hit-testing, как у любого view), затем
   запрашивает у фабрики компонент и помещает view компонента внутрь контейнера, заполняя его целиком.
4. Компонент получает каждый prop сразу после создания, а затем снова — при каждом его изменении.
5. Компонент отправляет события и может сообщать свой размер; приложение вызывает его команды через `ref`.

<a id="using-the-component-in-the-app"></a>

## Использование компонента в приложении

В Rust элемент создаёт `native(name)`: `.prop(name, value)` задаёт ему prop (`serde_json::Value`, либо сигнал или
замыкание, возвращающее такое значение; оно отправляется заново при изменении), `.on_native_event(..)` принимает его события как `NativeEvent { name, data }`, а методы
`element_ref()`, подключённого через `.element_ref(&r)`, отправляют его команды. В TSX `nativeComponent()` объявляет компонент
для имени с теми props и событиями, которые он использует.

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

Версия на TSX — это `examples/embedded/App.tsx`, которую запускают оба примера встраивания в репозитории.

### `nativeComponent(name, spec)`

```ts
function nativeComponent<P extends object = {}, E extends object = {}>(
  name: string,
  spec: NativeComponentSpec<P, E>,
): (props: NativeComponentProps<P, E>) => JSX.Element;
```

| Параметр | Тип | Описание |
|---|---|---|
| `name` | `string` | Имя, под которым приложение-хост зарегистрировало компонент. Используйте собственный префикс (`"maps.view"`, `"acme.chart"`), чтобы имена оставались уникальными. |
| `spec.props` | `readonly (keyof P & string)[]` | Собственные props компонента. На нативную сторону отправляются только перечисленные здесь props. |
| `spec.events` | `readonly (keyof E & string)[]` | События, которые он отправляет. Необязательный параметр. |

Параметры типов описывают props (`P`) и полезную нагрузку каждого события (`E`). Возвращаемый компонент принимает:

- собственные props компонента `P`;
- по обработчику на каждое событие: событие `tap` обрабатывается через `onTap`, а `regionChange` — через `onRegionChange` (первая буква
  становится заглавной, и спереди добавляется `on`);
- всё, что принимает `<View>`, кроме children: `style`, `class` / `classList` ([Tailwind](./tailwind.md)), раскладку,
  props доступности, `testID`, `onLayout`, `ref`. Всё это относится к контейнеру, который рисует NSH, а не к компоненту.

Нативный компонент — это лист: children он не принимает.

## Props

Каждый собственный prop отправляется как JSON, поэтому его значением может быть любое значение JSON: строки, числа, булевы значения, `null`, массивы и
простые объекты. Props реактивны, как и любые другие: когда замыкание Rust-prop (`.prop("text", move || json!(label.get()))`)
или TSX-`text={label()}` читает сигнал, новое значение отправляется при изменении сигнала и только тогда.

| Что происходит в приложении | Что получает компонент |
|---|---|
| Элемент создан | Каждый заданный собственный prop сразу после создания компонента |
| Значение prop изменилось | Этот prop с новым значением |
| Prop стал `undefined` | Этот prop без значения (`nil` в Swift, `null` в Java) |
| Prop, привязанный к анимированному значению, меняется | `setAnimatedNumber` / `setAnimatedColor` в тех кадрах, где он меняется |

Props несут значения JSON; ограничивайте интерфейс данными (функции и экземпляры классов остаются в приложении).

<a id="animated-props"></a>

### Анимированные props

Prop может быть и анимированным значением: `AnimatedValue` или узлом, производным от него (`interpolate`, `scrollValue` или
`pullValue` scroll view). Тогда он отправляется не как JSON: NSH привязывает его, и компонент получает значение в потоке UI
в каждом кадре, где оно меняется, минуя JS, поэтому он может следовать за перетаскиванием или pull to refresh.

```tsx
const pull = createAnimatedValue(0);
<Scroll pullValue={pull} refreshIndicator={{ height: 72 }} refreshing={refreshing()} onRefresh={refresh}>
  <Spinner progress={pull.interpolate({ inputRange: [0, 72], outputRange: [0, 1] })} />
</Scroll>
```

Компонент получает числа через `setAnimatedNumber(name, value)`, а цвета через `setAnimatedColor(name, argb)`
(`0xAARRGGBB`); по умолчанию оба вызывают `setProp` с этим числом, поэтому компонент, который их не реализует,
всё равно получает значение. Компоненты на Rust реализуют `set_animated_number` и `set_animated_color`, а код на Rust привязывает prop
с помощью `native(name).bind_animated_prop("progress", &value)`. Если снова задать prop обычное значение, привязка снимается и отправляется
это значение. В вебе зарегистрированных компонентов нет.

<a id="events"></a>

## События

Компонент отправляет событие по имени с необязательной JSON-нагрузкой. NSH доставляет его в поток движка и вызывает
соответствующий обработчик с этой нагрузкой (в Rust — единственный слушатель `on_native_event` с `name` и `data` события):

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

События асинхронны: главный поток никогда не ждёт кода приложения. Компонент, которому нужно что-то решить на месте (можно ли
начать этот жест, можно ли изменить эту область), должен решать это нативно, исходя из ранее полученных props.

<a id="commands"></a>

## Команды

Императивные вызовы (приблизиться к точке, начать воспроизведение, запустить пульсацию анимации) идут через ref элемента (`element_ref()` в Rust, `ref` в TSX):

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

`command(name, args)` (TSX: `command(name, args?)`) отправляет имя и аргументы (любое значение JSON) методу `command` компонента. Команды
применяются по порядку вместе с изменениями, сделанными до них, поэтому команда, выданная сразу после изменения prop, видит новый prop.

<a id="sizing"></a>

## Размеры

Контейнер раскладывается как `<View>`:

- Если стиль задаёт размер (`width`, `height`, `flex: 1`, `alignSelf: "stretch"`, ...), этот размер имеет приоритет.
- Если стиль оставляет размер открытым, контейнер принимает размер, о котором компонент сообщил через `setSize`, подобно тому, как
  изображение принимает свой естественный размер. Компонент, который никогда не сообщает размер, по открытым измерениям имеет размер 0.

Сообщайте размер в points (iOS) или dp (Android) всякий раз, когда меняется содержимое. Бейдж выше измеряет свою подпись при каждом
изменении `text` и сообщает размер подписи плюс отступы, поэтому `alignSelf: "flex-start"` делает бейдж ровно
такой же ширины, как его текст.

<a id="registering-on-ios-swift"></a>

## Регистрация на iOS (Swift)

Реализуйте `NshComponent` и зарегистрируйте фабрику в `NshAppView`:

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

(`UIColor(hex:)` — небольшой вспомогательный код примера, не часть NativeShell.)

| API | Описание |
|---|---|
| `NshAppView.register(component:_:)` | Регистрирует фабрику `(NshComponentContext) -> NshComponent` под именем. Она создаёт один компонент на каждый элемент, создаваемый с этого момента. Повторная регистрация имени заменяет фабрику. |
| `protocol NshComponent` | `var view: UIView` (заполняет контейнер), `setProp(_:_:)`, `command(_:_:)` (необязательно: по умолчанию команды игнорируются). Изолирован главным актором. |
| `setProp(_ name: String, _ value: Any?)` | Значения — это JSON-объекты Foundation: `String`, `NSNumber`, `[Any]`, `[String: Any]`, `NSNull`; `nil`, если prop был удалён. |
| `NshComponentContext.emit(_:_:)` | Отправляет событие; данные должны быть тем, что принимает `JSONSerialization` (или `nil`). Потокобезопасен. |
| `NshComponentContext.setSize(_:)` | Сообщает собственный размер компонента в points. Потокобезопасен. |

<a id="registering-on-android-java--kotlin"></a>

## Регистрация на Android (Java / Kotlin)

Реализуйте `com.longbridge.nsh.NshComponent` и зарегистрируйте фабрику в `NshView`:

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

То же на Kotlin:

```kotlin
nsh.registerComponent("embed.badge") { context -> Badge(this, context) }
```

| API | Описание |
|---|---|
| `NshView.registerComponent(String name, NshComponent.Factory factory)` | Регистрирует фабрику под именем; она создаёт один компонент на каждый элемент, создаваемый с этого момента (поток UI). |
| `interface NshComponent` | `View view()`, `void setProp(String, Object)`, `default void command(String, Object)`, `default void destroy()` (элемента больше нет: он удалён, его приложение остановлено через `NshView.destroy()` или заменено другой загрузкой; вызывается один раз на компонент). Вызывается в потоке UI. |
| Значения `setProp` | `String`, `Number`, `Boolean`, `java.util.List`, `java.util.Map` или `null` при удалении (либо JSON `null`). |
| `NshComponentContext.emit(String event, Object data)` | Отправляет событие; `data` — те же типы Java или `null`. Любой поток. |
| `NshComponentContext.setSize(float width, float height)` | Сообщает собственный размер компонента в dp. Любой поток. |

<a id="registering-from-rust"></a>

## Регистрация из Rust

Приложения, которые встраивают рантайм iOS из Rust (`nsh-platform-ios`), регистрируют `NativeComponent` в `AppView`:

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

`ComponentContext::emit(name, data)` отправляет событие (`data` — это `serde_json::Value`), а `set_size(width, height)`
сообщает размер; оба работают из любого потока.

<a id="registering-on-macos-rust"></a>

## Регистрация на macOS (Rust)

На macOS компонент — это `NSView`, зарегистрированный в [`AppView`](./macos.md#embedding-in-a-mac-app) у
`nsh-platform-macos`:

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

View заполняет контейнер, который раскладывает NSH; `ComponentContext::emit` и `set_size` (points) работают из любого потока, как
на iOS. Регистрируйте до `AppView::load`; реестр принадлежит одному `AppView` (и view, созданным из того же
`AppOptions`).

<a id="registering-on-linux-rust"></a>

## Регистрация на Linux (Rust)

На Linux компонент — это виджет GTK, зарегистрированный в [`AppView`](./linux.md#embedding-in-a-gtk-app) у
`nsh-platform-linux`:

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

Виджет заполняет контейнер, который раскладывает NSH; `ComponentContext::emit` и `set_size` (points) работают из любого потока,
как на iOS. Регистрируйте до `AppView::load`. Реестр принадлежит одному `AppView` (и view, созданным из того же
`AppOptions`, полем которого он является `components`).

<a id="registering-on-windows-rust"></a>

## Регистрация на Windows (Rust)

На Windows NSH рисует каждое view сам через Direct2D, поэтому компонент либо рисует в своём контейнере через Direct2D
(`draw`), либо приносит собственное окно (`window`: элемент управления «карта», сторонний view), и регистрируется в
[`AppView`](./windows.md#embedding-in-a-win32-app) у `nsh-platform-windows`:

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

`draw` выполняется в каждом кадре окна, в координатах view (points), с обрезкой по его границам; вызывайте
`ComponentContext::redraw`, когда меняется то, что он показывает. Рисуемый компонент перекрывается, обрезается и преобразуется, как любое
view, а касания получает его контейнер. Компонент, который возвращает дочернее окно из `window`, перемещается, обрезается и
скрывается вместе со своим view, получает собственный ввод и находится поверх всего, что рисует NSH (содержимое NSH поверх него скрыто, как
у веб-view). `ComponentContext::emit`, `set_size` (points) и `redraw` работают из любого потока. Регистрируйте до
`AppView::load`; реестр принадлежит одному `AppView` (и view, созданным из того же `AppOptions`).

Компонент также принимает прокрутку колесом мыши и тачпадом над ним через `wheel` (просмотрщик изображений масштабирует ими). Получаемый им
`Wheel` содержит положение указателя (`x`, `y`, в points компонента), расстояние в points (`dx`, `dy`, положительное
вправо и вниз, как двигают содержимое scroll view) и в щелчках колеса (`notches_x`, `notches_y`, с
дробными значениями от прецизионных тачпадов и высокоточных колёс), пришла ли прокрутка мелкими шагами (`precise`) и
удерживаемые модификаторы (`shift`, `ctrl`, `alt`). Он возвращает `true` для принятой им прокрутки; окружающие scroll view прокручиваются
вместе с остальными, по умолчанию — все. Прокрутка, которую начал scroll view, остаётся за этим view. Ctrl + колесо — это также щипок
прецизионного тачпада, а Shift + колесо приходит так, как его отправило колесо (`dy`, с `shift`):

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

## Регистрация из крейта приложения

Приложение с собственным Rust-крейтом (`nsh.json` `"rust"`, [Rust](./rust.md)) регистрирует нативные компоненты в этом
крейте, так что они работают в хостах, которые NSH собирает для приложения: хосте разработки `nsh run` и `nsh test --target`, и
в приложении, которое делает `nsh package`. Функция с `#[native_components(<platform>)]` в корне крейта (`lib.rs`) регистрирует
их в `Components` этой платформы, и хост вызывает её для каждого создаваемого view, подобно тому, как встраивающее приложение регистрирует в
своём `AppView`:

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

Платформа — это `windows`, `macos`, `linux` или `ios`, а компоненты — это компоненты
`nsh_platform_windows`, `nsh_platform_macos`, `nsh_platform_linux` или `nsh_platform_ios` (разделы выше). Функция
компилируется только на своей платформе, поэтому в крейте по одной такой функции на каждую поддерживаемую платформу, и все они регистрируют одни и те же имена,
а крейт зависит от крейта каждой платформы только для этой платформы, в той же версии и из того же источника, что и его другие крейты NSH
(`nsh-core` и остальные; CLI проверяет, что все они совпадают):

```toml
[target.'cfg(windows)'.dependencies]
nsh-platform-windows = { version = "0.3", default-features = false }

[target.'cfg(target_os = "macos")'.dependencies]
nsh-platform-macos = { version = "0.3", default-features = false }
```

Хост регистрирует компоненты крейта при создании каждого view, раньше, чем код, которому принадлежит view, регистрирует
свои: имя, зарегистрированное на view после этого (`AppView::register_component`), заменяет имя из крейта.
<a id="rules-and-limits"></a>

## Правила и ограничения

- **Регистрируйте до загрузки.** Фабрики применяются к элементам, созданным после регистрации. Зарегистрируйте все имена
  до вызова `loadBundle` / `loadAssetBundle` / `run`, чтобы первый кадр нашёл их.
- **Контейнер отвечает за оформление и касания.** Фон, границы, радиус скругления, тени, прозрачность, трансформации и
  `overflow: "hidden"` применяются к контейнеру, который рисует NSH. Ваш view заполняет его и получает касания, попадающие внутрь.
- **Capabilities не действуют.** Зарегистрированный компонент — это собственный код приложения-хоста; объявленные приложением
  [capabilities](./sandbox-and-capabilities.md) не ограничивают то, что он делает. Если вы встраиваете приложения,
  которым не доверяете, регистрируйте только те компоненты, которые безопасно им использовать.
- **Передавайте через интерфейс только данные.** Props, полезная нагрузка событий и аргументы команд передаются как JSON-текст; при каждом изменении отправляйте идентификаторы и
  небольшие значения, а не крупные блобы.
- **Один бандл, обе платформы.** Регистрируйте одни и те же имена с одинаковыми props и событиями на iOS и Android, чтобы один
  бандл работал на обеих платформах.
- **Имена в `nsh/` принадлежат NSH.** Собственные компоненты NSH (системная панель вкладок `nsh/mobile` `TabBar`)
  регистрируются под `nsh/`; называйте свои компоненты по имени вашего приложения или компании (`embed.badge`), а регистрация под `nsh/` записывает
  предупреждение в лог и сохраняет компонент NSH.

<a id="see-also"></a>

## См. также

- [Справочник `nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)
- [Встраивание в приложения iOS](./ios.md) и [в приложения Android](./android.md)
- [Architecture](./architecture.md): как props и события передаются между потоками
