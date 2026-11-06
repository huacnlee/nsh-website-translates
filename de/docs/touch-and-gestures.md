---
title: "Touch und Gesten"
description: "Drücken und Druck-Feedback, Trefferbereiche, Pointer-Events, rohe Touches, das Responder-System, PanResponder sowie native Pan-, Pinch- und Rotationsgesten."
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---


# Touch und Gesten

NSH kennt drei Ebenen der Touch-Verarbeitung. **Presses** (`.on_press` in Rust, `onPress` in TSX und ihre Verwandten) decken Buttons, Zeilen und Links ab, wobei das Feedback beim Drücken nativ gezeichnet wird. **Native Gesten** (Pan, Pinch und Rotation) bewegen [animierte Werte](./animation.md#animated-values) im UI-Thread, sodass eine gezogene Karte dem Finger folgt, selbst wenn dein Code gerade beschäftigt ist. **Rohe Touches und das Responder-System** (`.on_touch` und `.claim_touches` mit den `.on_responder_*`-Handlern in Rust; `onTouchStart`, `onResponderMove` und `PanResponder` in TSX) geben deinem Code jede Fingerposition für alles, was die beiden anderen Ebenen nicht ausdrücken können, etwa Zeichnen.

Wähle die höchste Ebene, die die Aufgabe erfüllt: Je höher die Ebene, desto weniger Arbeit wandert vom UI-Thread zu deinem Code.

## Presses

Jedes Element akzeptiert die Press-Handler; es gibt keine separate „Touchable"-Komponente. Setze `.on_press` / `onPress` auf eine View, einen Text, ein Bild oder irgendein anderes Element.

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

| Rust | TSX | Standard | Beschreibung |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | Der Finger wurde innerhalb der View angehoben (nach einem Press, nicht nach einem Long Press). |
| `.on_long_press(..)` | `onLongPress` | | Der Finger blieb für die Long-Press-Verzögerung unten. Der Press-Handler wird danach nicht aufgerufen. |
| `.on_press_down(..)` | `onPressDown` | | Der Press hat begonnen. |
| `.on_press_up(..)` | `onPressUp` | | Der Press ist beendet: angehoben, weggerutscht oder von einer Scroll View übernommen. |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | Millisekunden, bevor ein Press zum Long Press wird. |
| `.disabled(..)` | `disabled` | `false` | Nimmt keine Presses an und zeigt kein Feedback; wendet den Disabled-Style an; Screenreader melden es als deaktiviert. |

So verhalten sich Presses:

- **Nur die innerste pressable View reagiert.** Eine pressable Zeile, die einen pressable Button enthält, erhält keinen Press, wenn der Button gedrückt wird.
- **In einer Scroll View wartet der Press etwa 130 ms**, bevor er beginnt (und Feedback zeigt), sodass ein Drag, der auf einem Button beginnt, scrollt, statt ihn zu drücken.
- **Wegrutschen bricht ab.** Bewegt sich der Finger aus der View heraus, endet der Press mit dem Press-up-Handler und ohne Press.
- **Deaktivieren entfernt die Press-Listener** von dem, was gemountet ist, sodass die View überhaupt kein Feedback zeigt und der Disabled-Style gilt (`.disabled_style(..)`, `class="disabled:opacity-40"`).
- **Verschachtelte Text-Spans mit Press-Handler sind Links.** Der Absatz ist eine einzige native View; der Press geht an den Span unter dem Finger. Siehe [Text](./text.md).

## Press-Feedback

Das Press-Feedback gehört der App: Styles, die die View annimmt, solange sie gedrückt, überfahren, fokussiert oder deaktiviert ist. Sie werden nativ in dem Moment angewendet, in dem sich der Zustand ändert, ohne Round Trip zu deinem Code. Jeder Zustand hat eine Rust-Methode, eine TSX-Style-Prop und eine [Tailwind-Variante](./tailwind.md):

| Rust | TSX-Prop | Klasse | Beschreibung |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | Solange sie gedrückt wird. |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | Solange ein Zeiger darüber ist (Desktops, iPad-Zeiger, Browser). |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | Solange sie den Fokus hat. |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | Solange sie oder eine View in ihr den Fokus hat: der Rahmen eines Feldes um die Eingabe, die bearbeitet wird. |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | Solange sie deaktiviert ist. |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | Androids Material-Ripple (`color`, `borderless`, `radius`, `foreground`), zusätzlich zu den Styles. |

Die Zustands-Styles legen sich über die eigenen Styles der View. Spätere Zustände gewinnen (hover, focus, active), der Disabled-Style gewinnt über alle, und die anderen gelten nicht, solange die View deaktiviert ist.

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

Ein randloser Ripple breitet sich außerhalb der View aus, was zu Icon-Buttons passt: `Ripple { borderless: true, radius: Some(px(24.0)), .. }`, `android={{ ripple: { borderless: true, radius: 24 } }}`. Siehe [Plattformspezifischer Code](./platform-specific.md).

Mit einer Transition (`.transition()`, die Klasse `transition`) wird der Zustandswechsel animiert. `.group()` (die Klasse `group`) macht eine View zu einer Gruppe, und `.group_active(..)` (`group-active:`) stylt ihre Kinder, solange sie gedrückt wird:

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

## Trefferbereiche: hitSlop

Der Hit Slop (`.hit_slop(..)`, `hitSlop`) erweitert den Bereich, der Touches annimmt, über die Grenzen der View hinaus, ohne ihr Layout zu ändern. Nutze ihn für kleine Ziele wie Schließen-Buttons und Toggles.

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

| Rust | TSX | Beschreibung |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | Punkte, die rund um die Grenzen hinzugefügt werden. `EdgeInsets::all(..)` und eine TSX-Zahl gelten für alle vier Seiten. |

Halte den erweiterten Bereich innerhalb der Grenzen des Elternelements (gib der kleinen View etwas Margin oder Padding drumherum): Das Hit Testing erreicht ein Kind über sein Elternelement, daher gelangt ein Touch außerhalb des Elternelements nie zum Slop des Kindes.

<a id="children-outside-their-parent"></a>

## Kinder außerhalb ihres Elternelements

Ein Kind, das außerhalb der Grenzen seines Elternelements platziert ist (absolut positioniert mit sichtbarem `overflow`, etwa ein Dropdown unter seinem Feld), nimmt Touches dort an, wo es gezeichnet wird, wie jede andere View: NSH führt das Hit Testing für die Nachfahren, die über eine View hinausragen, nativ durch. Ein Elternelement, das seinen Überlauf abschneidet, schneidet sie ab, und dann werden sie dort weder angezeigt noch nehmen sie Touches an. Der Bereich wird aus dem Layout berechnet, daher nimmt ein Kind, das per Transform aus seinem Elternelement verschoben wurde, nur Touches innerhalb der Grenzen des Elternelements an.

Beachte die Zeichenreihenfolge: Ein Dropdown wird nur dann über den Geschwistern seines Feldes gezeichnet, wenn das Feld nach ihnen kommt oder ein höheres `z-index` hat, und Touches gehen an das, was oben gezeichnet wird.

## pointerEvents

Der Style-Key `pointerEvents` (`.pointer_events(..)` in Rust) bestimmt, welche Views eines Teilbaums das Ziel eines Touches sein können. Er wird nativ beim Hit Testing ausgewertet und kostet daher nichts pro Touch.

| Rust | TSX | Die View | Ihre Kinder |
|---|---|---|---|
| `PointerEvents::Auto` (Standard) | `"auto"` | Nimmt Touches an | Nehmen Touches an |
| `PointerEvents::None` | `"none"` | Nie das Ziel | Nie das Ziel, außer eines setzt `"auto"`: Touches gehen durch zu dem, was dahinter liegt |
| `PointerEvents::BoxNone` | `"box-none"` | Nie das Ziel | Nehmen Touches an |
| `PointerEvents::BoxOnly` | `"box-only"` | Nimmt Touches an | Nie das Ziel |

Typische Anwendungen: ein Overlay, das nicht blockieren darf, was darunter liegt (none), ein bildschirmfüllender Container, dessen leerer Raum Touches an den dahinterliegenden Inhalt durchlassen soll, während seine Buttons weiterhin funktionieren (box-none), und eine Zeile, die einen Press annehmen soll, auch wenn der Finger auf einem Kind landet (box-only).

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

`"none"` wird wie CSS-`pointer-events` vererbt: Eine View darin, die `"auto"` setzt, nimmt wieder Touches an. `"box-none"` und `"box-only"` gelten für die View, die sie setzt. Die Tailwind-Klassen `pointer-events-none` und `pointer-events-auto` setzen `"none"` und `"auto"`, und als Style-Key akzeptiert `pointerEvents` auch Zustands-Styles (`activeStyle`, ...) und Varianten.

<a id="native-gestures-pan-pinch-and-rotation"></a>

## Native Gesten: Pan, Pinch und Rotation

Binde für Drags, Pinches und Rotationen, die etwas auf dem Bildschirm bewegen, [animierte Werte](./animation.md#animated-values) an die Geste. Der Gesten-Recognizer der Plattform schreibt die Werte im UI-Thread, und die daran gebundenen Views bewegen sich im selben Frame; dein Code wird informiert, wenn die Geste beginnt und endet.

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

| Rust | TSX | Beschreibung |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | Drags mit einem Finger bewegen diese Werte, in Punkten. |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | Pinches mit zwei Fingern steuern `scale` (ein Faktor). |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | Rotationen mit zwei Fingern steuern `angle`, in Grad. |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | Der Drag hat begonnen / ist beendet, mit einem `PanEvent`. |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | Der Pinch hat begonnen / ist beendet: seine Skalierung und Geschwindigkeit (`GestureEvent`). |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | Die Rotation hat begonnen / ist beendet: ihr Winkel (Rust: `GestureEvent<Radians>`) und ihre Geschwindigkeit. |

Ein Pan-Event enthält die Translation (`translation`, ein `Point`: Punkte seit dem Start), die Geschwindigkeit (`velocity_x` / `velocity_y`; TSX: `velocity`, ein `Point`: Punkte pro **Sekunde**) und die gebundenen Werte in diesem Moment (`value_x` / `value_y`; TSX: `value`, `{ x?, y? }` mit den Achsen, die `pan` bindet).

Das erledigt die native Seite für dich:

- **Ein Drag setzt dort an, wo der Wert steht.** Beim Start werden die Werte gelesen und die Translation wird zu ihnen addiert; greifst du einen Wert, der noch animiert wird (eine Spring auf dem Weg zurück), stoppt die Animation an der aktuellen Stelle.
- **Nur eine Achse lässt die andere scrollen.** Ist nur ein horizontaler Wert gebunden, beginnt der Drag erst, wenn sich der Finger stärker horizontal als vertikal bewegt, sodass eine horizontale Swipe-Zeile in einer vertikalen Scroll View weiterhin vertikal scrollt. Diese Entscheidung fällt nativ, wenn das System fragt, ob die Geste beginnen darf.
- **Pan, Pinch und Rotation laufen gemeinsam** auf derselben View: Eine Karte kann gleichzeitig gezogen, gepincht und gedreht werden.
- **Loslass-Geschwindigkeit für Physik.** Die Geschwindigkeit am Ende des Pans speist direkt die Geschwindigkeit einer Spring oder eines Decay; mit den Werten kannst du einen Snap-Punkt wählen.

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
> Binde animierte Werte an die Geste, statt ihr über den Responder zu folgen, wann immer der Drag nur Dinge bewegt. Mit gebundenen Werten kann beschäftigter App-Code den Drag nicht ruckeln lassen; beim Responder ist jede Bewegung ein Event für deinen Code und eine Aktualisierung dessen, was die View zeigt.

<a id="raw-touches"></a>

## Rohe Touches

Die Touch-Handler melden jeden Finger, wenn er aufsetzt, sich bewegt und abhebt. Sie sind nützlich für Logging, eigenes Hit Testing und das Reagieren auf Multi-Touch; sie beanspruchen den Touch nicht (Presses und Scroll Views funktionieren weiter).

In Rust hört `.on_touch(..)` jede Phase als `TouchEvent`: ihre `phase` (`TouchPhase::Start`, `Move`, `End`, `Cancel`), ihre `timestamp` und ihre `points`, jeden Finger, der unten ist, jeweils mit seiner `id`, seiner `location` in der View, auf der er aufgesetzt hat, seiner `page`-Position in der Surface und `changed` für die Finger, um die es im Event geht. In TSX hat jede Phase ihren eigenen Handler:

| TSX | Beschreibung |
|---|---|
| `onTouchStart` | Ein Finger hat auf der View oder in ihr aufgesetzt. |
| `onTouchMove` | Ein Finger hat sich bewegt. Bewegungen werden pro Engine-Turn zusammengefasst. |
| `onTouchEnd` | Ein Finger wurde angehoben. |
| `onTouchCancel` | Das System hat den Touch übernommen (eine Scroll View hat zu scrollen begonnen, ein Anruf kam herein). |
| `onTouchStartCapture`, `onTouchMoveCapture`, `onTouchEndCapture`, `onTouchCancelCapture` | Dasselbe, von außen nach innen aufgerufen, vor den Bubbling-Handlern. |

Jeder TSX-Handler erhält ein `GestureResponderEvent`:

| Feld | Beschreibung |
|---|---|
| `identifier` | Identifiziert den Finger, solange er unten ist. |
| `locationX`, `locationY` | Position in der View, auf der der Finger aufgesetzt hat (`target`). |
| `pageX`, `pageY` | Position in der Surface. |
| `target` | Die ID der View, auf der der Finger aufgesetzt hat. |
| `timestamp` | Millisekunden. |
| `touches` | Jeder Finger, der unten ist. |
| `changedTouches` | Die Finger, um die es in diesem Event geht. |
| `nativeEvent` | Das Event selbst, sodass auch `e.nativeEvent.locationX` funktioniert. |
| `stopPropagation()` | Weiter außen liegende Views sehen dieses Touch-Event nicht. |

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

### Wo sich eine View befindet: measure

Die Position eines Touches ist relativ zu der View, auf der der Finger aufgesetzt hat, und das kann ein Kind der View sein, die dich interessiert (der Knopf eines Sliders). Das Messen einer View sagt dir, wo sie sich befindet, sodass du stattdessen die Seitenposition verwenden kannst. In Rust setzt du ein `element_ref()` auf die View und wartest auf dessen `measure()`; in TSX rufst du `measure()` auf ihrer Ref auf:

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

Es wird aufgelöst, sobald die bisher vorgenommenen Änderungen ins Layout gebracht wurden: in Rust zu einem `Measurement` (`frame`, der Frame im Elternelement, wie ihn der Layout-Handler meldet, und `page`, die obere linke Ecke), in TSX zu `{ bounds, pagePosition }`. Die Ecke liegt in der Surface oder in dem Dialog, in dem sich die View befindet, in denselben Koordinaten wie die Seitenpositionen der Touches. Die Offsets der Scroll Views und Listen darum herum werden berücksichtigt; Transforms (einschließlich Animationen) nicht. Für eine View, die nicht auf dem Bildschirm ist, wird es zu `None` / `null` aufgelöst.
<a id="the-responder-system"></a>

## Das Responder-System

Wenn Ihr Code eine Touch-Sequenz selbst steuern muss (Zeichnen mit dem Finger, ein benutzerdefinierter Slider, eine Geste, die die nativen Recognizer nicht bieten), verwenden Sie das Gesture-Responder-System. Jeweils eine View ist der **Responder** und erhält die Bewegungen; die Views handeln untereinander aus, wer das ist.

Zum Responder werden:

| Rust | TSX | Beschreibung |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` mit Rückgabe von `true` | Wird abgefragt, wenn ein Finger aufsetzt, vom Ziel nach außen. |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` mit Rückgabe von `true` | Wird bei jeder Bewegung abgefragt, solange es keinen Responder gibt (oder um ihn zu übernehmen). |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | Wie oben, wird aber von außen nach innen abgefragt, noch vor den aufsteigenden (Bubbling-)Varianten. Ein Parent nutzt es, um seinen Children einen Touch abzunehmen. |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | Die Variante für Bewegungen. |

Ein Anspruch wird allein anhand der View entschieden, ohne dass Ihr Code läuft, es sei denn, er fragt nach: `TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` beansprucht den Touch, wenn der Listener `r.claim()` aufruft, und entscheidet anhand der bisherigen Geste (`r.event.gesture`). Die TSX-Handler erhalten die Geste als zweites Argument, `gestureState`, mit denselben Feldern wie bei [PanResponder](#panresponder) (`dx`, `dy`, `vx`, `vy`, `moveX`, `moveY`, `x0`, `y0`, `numberActiveTouches`). Ein Swipe, der nur horizontale Bewegungen beansprucht: `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`. Diese Entscheidung kommt dennoch eine Bewegung zu spät, sodass eine umgebende Scroll View möglicherweise zuerst zu scrollen beginnt; verwenden Sie für Drags innerhalb von Scroll Views die [Pan-Aktivierung](#pans-inside-scroll-views-panactivation).

Während des Antwortens:

| Rust | TSX | Beschreibung |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | Diese View ist jetzt der Responder. Rust hindert native Scroll Views standardmäßig daran, die Touches zu übernehmen (`TouchClaim::block_native(false)` erlaubt es ihnen); in TSX geben Sie dafür `true` zurück. |
| `.on_responder_reject(..)` | `onResponderReject` | Eine andere View ist der Responder und gibt ihn nicht ab. |
| `.on_responder_start(..)` | `onResponderStart` | Ein weiterer Finger ist aufgesetzt. |
| `.on_responder_move(..)` | `onResponderMove` | Ein Finger hat sich bewegt. |
| `.on_responder_end(..)` | `onResponderEnd` | Ein Finger wurde abgehoben. |
| `.on_responder_release(..)` | `onResponderRelease` | Der letzte Finger wurde abgehoben: Die Geste ist beendet. |
| `.keep_touches(true)` | `onResponderTerminationRequest` mit Rückgabe von `false` | Eine andere View möchte die Touches: Behalten Sie sie (standardmäßig werden sie abgegeben). |
| `.on_responder_terminate(..)` | `onResponderTerminate` | Eine andere View oder eine native Geste hat die Touches übernommen. |

Der Responder einer Rust-Komponente bleibt von der Zuweisung (Grant) bis zum Ende seiner Touches gedrückt, egal wohin sich der Finger oder Pointer bewegt, so wie CSS' `:active` gehalten wird, bis die Maustaste losgelassen wird: Seine `.active(..)`-Styles und die darin enthaltenen `group-active:`-Klassen behalten ihr Aussehen während des gesamten Drags (etwa bei einem Resize-Handle, das über seinen Bereich hinausgezogen wird).

Die Rust-Handler erhalten ein `ResponderEvent`: die `location` des Fingers in der View, auf der er aufgesetzt hat, seine `page`-Position sowie `timestamp` und `gesture` seit dem Grant.

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

So läuft es ab: Eine View mit einem beliebigen Touch- oder Responder-Handler lauscht nativ auf Touches; die Plattform meldet die Touches auf ihr (und in ihr) zusammen mit dem Pfad der lauschenden Views, und die Aushandlung läuft im Rust-Core von NSH, der die Ansprüche abfragt und Ihre Handler der Reihe nach aufruft: zuerst die Captures von der äußersten View nach innen, dann die übrigen vom Ziel nach außen. Daraus ergeben sich zwei Konsequenzen:

- **Native Scroll Views und Responder konkurrieren.** Solange ein Responder sie blockiert, übernehmen die umgebenden Scroll Views keine Touches, bis er endet. Beginnt eine native Scroll View zuerst zu ziehen, gewinnt sie: Der Responder erhält den Terminate-Handler und die Touch-Handler ein Cancel.
- **Jede Bewegung ist ein Event für Ihren Code.** Responder-gesteuerte Drags sind nur so flüssig, wie Ihr Code schnell ist; für Drags, die lediglich Views verschieben, sind [gebundene Werte](#native-gestures-pan-pinch-and-rotation) vorzuziehen.

## PanResponder

In Rust tragen die Responder-Events die Geste bereits in sich: `ResponderEvent::gesture` ist ein `PanGesture` mit der Distanz zum Start, der Geschwindigkeit und der Anzahl der Finger. In TSX umschließt `PanResponder` aus `nsh` das Responder-System und ergänzt denselben Gestenzustand; verteilen Sie dessen `panHandlers` per Spread auf eine View.

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

Der Gestenzustand:

| Rust (`PanGesture`) | TSX (`gestureState`) | Beschreibung |
|---|---|---|
| | `stateID` | Identifiziert die Geste. |
| `position` | `moveX`, `moveY` | Die jüngste Position des Schwerpunkts der Touches, in Surface-Punkten. |
| `origin` | `x0`, `y0` | Wo der Schwerpunkt war, als der Responder zugewiesen wurde. |
| `delta` | `dx`, `dy` | Seit dem Grant zurückgelegte Distanz. |
| `vx`, `vy` | `vx`, `vy` | Geschwindigkeit, in Punkten pro Sekunde. |
| `active_touches` | `numberActiveTouches` | Aufgesetzte Finger. |

`PanGesture::begin` und `PanGesture::update` verfolgen in Rust eine Geste anhand roher Touches (`.on_touch`). Die TSX-Callbacks erhalten `(event, gestureState)`: `onStartShouldSetPanResponder(Capture)`, `onMoveShouldSetPanResponder(Capture)`, `onPanResponderGrant`, `onPanResponderReject`, `onPanResponderStart`, `onPanResponderMove`, `onPanResponderEnd`, `onPanResponderRelease`, `onPanResponderTerminate`, `onPanResponderTerminationRequest` und `onShouldBlockNativeResponder`. Der letzte ist standardmäßig `true`: Ein zugewiesener PanResponder hindert native Scroll Views daran, seine Touches zu übernehmen.

<a id="pans-inside-scroll-views-panactivation"></a>

## Pans innerhalb von Scroll Views: panActivation

Ein Diagramm, das innerhalb einer vertikalen Scroll View seitlich abgetastet wird, muss horizontale Drags übernehmen und vertikale der Scroll View überlassen. Den Touch beim Start zu beanspruchen, blockiert das Scrollen vom ersten Pixel an, und die Entscheidung anhand der Bewegungen in Ihrem Code kommt zu spät: Bis sie vorliegt, hat die Scroll View den Touch möglicherweise schon übernommen. Die Pan-Aktivierung (`TouchClaim::on_pan(..)`, `panActivation`) lässt die Plattform auf dem Main Thread entscheiden, während sich der Finger bewegt:

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

| Rust (`PanActivation`) | TSX | Beschreibung |
|---|---|---|
| `active_offset_x`, `active_offset_y` | `activeOffsetX`, `activeOffsetY` | Der Pan wird aktiviert, sobald sich der Finger entlang dieser Achse weiter als dieser Wert von der Stelle entfernt hat, an der er aufgesetzt wurde (in beide Richtungen, in Punkten). |
| `fail_offset_x`, `fail_offset_y` | `failOffsetX`, `failOffsetY` | Der Pan schlägt fehl, sobald sich der Finger zuvor weiter als dieser Wert bewegt hat: Die Scroll Views behalten die Touches. |

`PanActivation::horizontal(active, fail)` und `PanActivation::vertical(active, fail)` setzen die üblichen Paare. Ohne aktive Offsets wird der Pan nach 10 Punkten in beliebiger Richtung aktiviert. Bis zur Aktivierung warten die umgebenden Scroll Views darauf (iOS), und die übrigen Ansprüche der View werden nicht abgefragt. Mit der Aktivierung können die Scroll Views diese Touches nicht mehr übernehmen, und die View wird zum Responder (erst der Grant, dann die Bewegungen); schlägt er fehl, scrollt die Scroll View wie gewohnt. In TSX funktionieren auch die `panHandlers` von `PanResponder` damit: Verteilen Sie sie per Spread neben der Prop, und `onPanResponderGrant` läuft bei der Aktivierung.

> [!NOTE]
> Jede Geschwindigkeit wird in Punkten pro Sekunde angegeben: `vx` / `vy` der Responder-Geste, die Geschwindigkeit eines Pans sowie die eines Springs oder Decay, sodass `vx` unverändert an einen Spring oder Decay übergeben werden kann.

<a id="why-some-answers-are-props"></a>

## Warum manche Antworten Props sind

Der Main Thread wartet nie auf Ihren Code. Wenn das System sofort eine Antwort benötigt (darf diese Pan-Geste beginnen, trifft dieser Punkt die View, soll dieser Tap die Tastatur schließen), antwortet NSH nativ anhand dessen, was zuvor gemountet wurde: die gebundenen Pan-Werte (ihre Achsen), der Pinch-Wert, der Hit Slop, die Pointer Events, die Keyboard-Taps-Einstellung von Scroll Views, die Pan-Aktivierung. Ihre Handler erfahren erst im Nachhinein, was passiert ist. Deshalb sind dies deklarative Einstellungen statt Callbacks, und deshalb entscheidet die Responder-Aushandlung, die Ihren Code tatsächlich ausführt, nur zwischen Respondern und blockiert nie eine native Geste.

<a id="related"></a>

## Siehe auch

- [`View`](../elements/view.md): jede Touch-Prop des Basiselements.
- [Animation](./animation.md): animierte Werte, Springs und Decay für gestengesteuerte Bewegungen.
- [Scrolling](./scrolling.md): die Keyboard-Taps-Einstellung, Scroll Views und verschachtelte Gesten.
- [`PanResponder`](../modules/nsh.md#panresponder): die Referenz zu `PanResponder`.
- [Accessibility](./accessibility.md): Pressable Views sind Accessibility-Elemente; geben Sie ihnen eine Rolle und ein Label.
