---
title: "Elements"
description: "Die Primitive und Basiskomponenten, aus denen jede NSH-App aufgebaut ist, in Rust und TSX, sowie die Props, Events und Ref-Methoden, die ihnen allen gemeinsam sind."
order: 1
source_hash: 84e4cb96ec250ab2
---


# Elements

Native Shell baut jeden Screen aus einer kleinen Menge von Elementen: Primitive wie `View`, `Text` und `Image` sowie Basiskomponenten wie `Button`, `Dialog` und `NavStack`. Jedes Primitive ist eine native View (eine UIView-Unterklasse auf iOS und Mac Catalyst, eine Android-`View`, eine AppKit-, GTK- oder Win32-View auf den Desktops), die von der NSH-Runtime erzeugt und angeordnet wird. Alles, was eine App anzeigt, besteht aus ihnen: Die Buttons, Cards, Zeilen und Screens einer App sind ihre eigenen Komponenten, die mit diesen Elementen gezeichnet und von der App gestaltet werden, sodass das Erscheinungsbild vollständig der App gehört.

Jedes Beispiel auf diesen Seiten gibt es in Rust und TSX: Wähle einen Tab, und alle Beispiele der Seite folgen.

```rust tabs
use nsh_core::prelude::*;

fn app() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .items_center()
        .justify_center()
        .gap_3()
        .child(text(move || format!("Tapped {} times", count.get())).text_2xl())
        .child(
            view()
                .rounded_lg()
                .bg(rgb(0x2563eb))
                .px_4()
                .py_2()
                .active(|s| s.opacity(0.6))
                .on_press(move || count.update(|n| *n += 1))
                .child(text("Tap").text_color(white())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24 }}>Tapped {count()} times</Text>
      <View onPress={() => count.update((n) => n + 1)} class="rounded-lg bg-blue-600 px-4 py-2 active:opacity-60">
        <Text class="text-white">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

In Rust sind die Primitive Funktionen von `nsh_core::prelude` (`view()`, `text(..)`, `image(..)`), und die Basiskomponenten stammen aus dem Crate `nsh_base`. Styles sind typisierte Methoden (`.flex_1()`, `.gap_3()`, `.px(px(20.0))`, `.bg(..)`), Zustandsstile nehmen eine Closure (`.active(|s| s.opacity(0.6))`), Listener sind Closures ihres Events (`.on_press(move || ..)`, `.on_change(move |text: &str| ..)`), und `.child(..)` fügt Kinder hinzu. Ein Stück UI ist eine gewöhnliche Funktion, die `impl IntoElement` zurückgibt; sie läuft einmal, und Signals, die sie in Closures liest (`text(move || ..)`, `.bg(move || ..)`), aktualisieren das, woran sie gebunden sind. Siehe [Building with Rust](../docs/rust.md).

In TSX ist jeder Tag in PascalCase geschrieben und benennt ein Binding im Gültigkeitsbereich: Die Primitive kommen aus `nsh`, die Basiskomponenten aus `nsh/base`. Nur `<If>` und `<Each>` sind Globals, die keinen Import brauchen. Ein Tag in Kleinbuchstaben wie `<view>` ist ein Build-Fehler, weil TypeScript ihn gegen einen globalen Typ pro Namen prüfen würde und generische Komponenten wie `List` und `Each` ihre Item-Typen nicht ableiten könnten. Der Compiler erkennt die Elemente anhand ihrer Imports und erzeugt die nativen Views an Ort und Stelle, sodass der Import zur Laufzeit nichts kostet. Siehe [JSX and components](../docs/jsx-and-components.md).

```tsx
import { Canvas, Image, List, Overlay, Scroll, Shader, Text, Video, View, WebView } from "nsh";
import { Button, Dialog, Menu, NavPage, NavStack, Popover, Sheet, Tooltip, Input } from "nsh/base";
```

<a id="primitives"></a>

## Primitive

In TSX aus `nsh` importiert, in Rust aus `nsh_core::prelude`.

| Element | Rust | Native View (iOS / Android) | Seite |
|---|---|---|---|
| `<View>` | `view()` | UIView / ViewGroup; mit `selectable` werden die darin enthaltenen Texte gemeinsam ausgewählt | [View](./view.md), [Text selection](./text-selection.md) |
| `<Text>` | `text(content)` | CoreText-View / StaticLayout-View | [Text](./text.md) |
| `<Image>` | `image(src)` | eine View mit einer Bildebene / eine Image-View | [Image](./image.md) |
| `<Scroll>` | `scroll()` | UIScrollView / ScrollView | [Scroll](./scroll.md) |
| `<List>` | `virtual_list(count, \|at\| row)` | UIScrollView / ScrollView mit wiederverwendeten Zellen | [List](./list.md) |
| `<Canvas>` | `canvas(painter)` | eine View, die eine 2D-Zeichnung wiedergibt | [Canvas](./canvas.md) |
| `<Shader>` | `shader(program)` | eine View, deren Fläche ein WGSL-Programm unter ihren Kindern auf der GPU zeichnet | [Shader](./shader.md) |
| `<WebView>` | `web_view(url)`, `web_view_html(html, base)` | WKWebView / android.webkit.WebView | [WebView](./web-view.md) |
| `<Video>` | `video(url)` | AVPlayerLayer / MediaPlayer auf einer TextureView | [Video](./video.md) |
| `<Overlay>` | `overlay()` | eine View über dem Fenster (oder dem Dialog, in dem sie liegt), platziert an einem Anker | [Overlay](./overlay.md) |
| `<If>`, `<Each>` | `when(..)`, `each(..)`, `dynamic(..)` | Kontrollfluss: die Elemente, die sie auswählen | [Control flow](./control-flow.md) |
| `<InputAccessoryView>` (`nsh/mobile`) | `input_accessory_view(id)` | eine Leiste über der Tastatur auf iOS | [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) |

Padding und Margin halten Inhalte mit dem CSS-Wert `env()` von der System-UI fern: `env(safe-area-inset-top)` und die anderen Kanten ([Safe area](./safe-area.md)) sowie `env(keyboard-inset-height)` ([Keyboard](./keyboard.md)).

<a id="base"></a>

## Basis

In TSX aus `nsh/base` importiert, in Rust aus dem Crate `nsh_base`. Sie übernehmen Verhalten, Zustand, Fokus und Barrierefreiheit und beziehen ihr Aussehen von der App.

| Komponente | Rust | Was sie tut | Seite |
|---|---|---|---|
| `AlertDialog` | `nsh_base::alert_dialog()` | Der System-Alert und das Action Sheet | [AlertDialog](./alert-dialog.md) |
| `<Accordion>` und seine Teile | `nsh_base::accordion()`, `accordion_item()`, ... | Gestapelte Abschnitte, die sich unter ihren Überschriften auf- und zuklappen, einzeln oder mehrere | [Accordion](./accordion.md) |
| `<Avatar>`, `<AvatarGroup>` | `nsh_base::avatar()`, `avatar_group()` | Das Bild einer Person oder ein Fallback, solange es lädt oder wenn es fehlschlägt, und eine Reihe davon, die die ersten zeigt | [Avatar](./avatar.md) |
| `<Button>` | `nsh_base::button()` | Ein drückbares Steuerelement mit seinen Zuständen und seiner Rolle | [Button](./button.md) |
| `<Carousel>` und seine Teile | `nsh_base::carousel()`, `carousel_content()`, ... | Slides, die jeweils an einer Stelle angezeigt und nativ gewischt werden, mit Zurück / Weiter, einer Paginierung, den Tasten und einer nahtlosen Schleife | [Carousel](./carousel.md) |
| `<Checkbox>` | `nsh_base::checkbox()` | Ein markiertes, nicht markiertes oder unbestimmtes Steuerelement mit einem Indikator | [Checkbox](./checkbox.md) |
| `<Collapsible>` | `nsh_base::collapsible()` | Ein Bereich, dessen Inhalt sich auf- und zuklappt | [Collapsible](./collapsible.md) |
| `<Command>` | `nsh_base::command()` | Eine Command Palette: ein Suchfeld über nativ gefilterten Befehlen, eine virtualisierte Liste, die Tasten einer Cmd+K-Palette | [Command](./command.md) |
| `<DataTable>` | `nsh_base::data_table()` | Eine Tabelle mit beliebig vielen Zeilen und Spalten, auswählbar, sortierbar, mit in der Größe veränderbaren und verschiebbaren Spalten | [DataTable](./data-table.md) |
| `<Dialog>` | `nsh_base::dialog()` | Zeigt seine Kinder über allem anderen an | [Dialog](./dialog.md) |
| `<DiffView>` | `nsh_base::diff_view()` | Die Änderungen zwischen zwei Texten oder eines Patches, geteilt oder vereint | [DiffView](./diff-view.md) |
| `<DockArea>` | `nsh_base::dock_area()` | Ein Arbeitsbereich aus Splits, Tab-Gruppen und Edge-Docks, den der Nutzer anordnet | [Dock](./dock.md) |
| `<Editor>` | `nsh_base::editor()` | Ein Code-Editor mit Syntaxhervorhebung, mehreren Carets, Code Folding und Suche | [Editor](./editor.md) |
| `<HoverCard>` | `nsh_base::hover_card()` | Eine Vorschau dessen, worauf sein Trigger zeigt, solange der Zeiger darauf ruht | [HoverCard](./hover-card.md) |
| `<Input>` | `nsh_base::input()` | Die native Texteingabe (UITextField oder UITextView / EditText) | [Input](./input.md) |
| `<Link>` | `nsh_base::link()` | Ein Druckziel, das eine Seite, eine Website oder eine Route der App öffnet | [Link](./link.md) |
| `<Menu>`, `<ContextMenu>`, `<MenuItem>`, `<MenuSeparator>`, `<Submenu>` | `nsh_base::menu()`, ... | Menüs: Popups mit kaskadierenden Untermenüs auf Desktops, Sheets auf Smartphones | [Menu](./menu.md) |
| `<NavStack>`, `<NavPage>` | `nsh_base::nav_stack()`, `nsh_base::nav_page()` | Native Navigation: ein Stapel von Seiten mit dem Header und den Zurück-Gesten der Plattform | [NavStack](./nav-stack.md) |
| `<NumberInput>` | `nsh_base::number_input()` | Eine Zahl, die in ein Feld getippt oder mit Buttons und Tasten schrittweise geändert wird | [NumberInput](./number-input.md) |
| `<OtpInput>` | `nsh_base::otp_input()` | Ein Einmalcode mit fester Stellenzahl, der in Zellen getippt, eingefügt oder automatisch ausgefüllt wird | [OtpInput](./otp-input.md) |
| `<Pagination>` | `nsh_base::pagination()` | Die Seiten einer Menge: Zurück, die Seiten um die aktuelle herum, Auslassungspunkte und Weiter | [Pagination](./pagination.md) |
| `<Tree>` | `nsh_base::tree()` | Items, die Items enthalten, auf- und zugeklappt, eines ausgewählt: virtualisiert, ein Halt des Tastaturfokus | [Tree](./tree.md) |
| `<Plot>`, `<Line>`, `<Area>`, `<Bar>`, `<Grid>`, `<Pie>`, `<Arc>` (`nsh/base/plot`) | `nsh_base::plot::{plot, line, area, bar, grid, pie, arc}` | Der Rahmen eines Diagramms und seine Marks, nativ aus den Zeilen der App gezeichnet | [Plot](./plot.md) |
| `<Popover>` | `nsh_base::popover()` | An einen Trigger gebundener Inhalt, über allem anderen | [Popover](./popover.md) |
| `<Progress>` | `nsh_base::progress()` | Ein Fortschrittsbalken: wie weit eine Aufgabe ist oder dass sie läuft | [Progress](./progress.md) |
| `<Radio>`, `<RadioGroup>` | `nsh_base::radio()`, `radio_group()` | Eine Option aus einer Menge, aus der der Nutzer eine auswählt, und die Menge selbst | [Radio](./radio.md) |
| `<ResizablePanelGroup>`, `<ResizablePanel>` | `nsh_base::h_resizable()`, `resizable_panel()` | Panels nebeneinander oder übereinander, mit Griffen, die ihre Größe ändern | [Resizable](./resizable.md) |
| `<Scrollbar>` | `nsh_base::scrollbar()` | Eine Bildlaufleiste im eigenen Look der App für eine Scroll-View oder eine Liste | [Scrollbar](./scrollbar.md) |
| `<Select>` | `nsh_base::select()` | Ein Wert, der aus einer Liste von Items gewählt wird, mit Tastatur, Suche und Abschnitten | [Select](./select.md) |
| `<Sheet>` | `nsh_base::sheet()` | Ein Panel an einem Bildschirmrand über einem Backdrop | [Sheet](./sheet.md) |
| `<Slider>` | `nsh_base::slider()` | Ein Wert oder ein Bereich aus zwei Werten, der entlang einer Spur gewählt wird | [Slider](./slider.md) |
| `<Switch>` | `nsh_base::switch()` | Ein Ein/Aus-Steuerelement mit Spur und Thumb | [Switch](./switch.md) |
| `<Table>` und seine Teile | `nsh_base::table()`, `table_row()`, ... | Eine Tabelle aus den eigenen Zeilen und Zellen der App, mit den Rollen einer Tabelle | [Table](./table.md) |
| `<Tab>`, `<Tabs>` | `nsh_base::tab()`, `tabs()` | Ein Tab einer Tab-Liste und die Liste selbst | [Tabs](./tabs.md) |
| `<TextView>` | `nsh_base::text_view()` | Zeigt ein Markdown- oder HTML-Dokument mit Texten und Views an | [TextView](./text-view.md) |
| `<Toast>`, `<ToastStack>` | `nsh_base::toast()`, `toast_stack()` | Die semantische Wurzel eines Toasts; Toasts, die als Ebenen von einem Rand aus angeordnet werden | [Toast](./toast.md) |
| `<Toggle>`, `<ToggleGroup>` | `nsh_base::toggle()`, `toggle_group()` | Ein Button, der an oder aus ist, und eine Toolbar davon | [Toggle](./toggle.md) |
| `<Toolbar>`, `<ToolbarGroup>`, `<ToolbarSeparator>` | `nsh_base::toolbar()`, `toolbar_group()`, `toolbar_separator()` | Eine Leiste aus Buttons, Toggles und Links, ein Halt des Tastaturfokus | [Toolbar](./toolbar.md) |
| `<Tooltip>` | `nsh_base::tooltip()` | Ein Hinweis neben seinem Trigger, bei Hover oder gehaltenem Finger | [Tooltip](./tooltip.md) |

> [!NOTE]
> Ein String wird nur innerhalb eines `Text` gezeichnet. Ein String als Kind eines `View` erzeugt keine native View und nimmt nicht am Layout teil.

<a id="common-props"></a>

## Gemeinsame Props

Jedes Primitive akzeptiert die folgenden Props (der Typ `CommonProps` in TSX; die Traits `Styled`, `Interactive` und `Accessible` in Rust). Die Seiten der Elemente listen nur ihre eigenen Props auf. Die Rust-Spalte nennt die Builder-Methode.

### Styling

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `style` | typisierte `Styled`-Methoden; `.inline_style(style)` | `StyleProp<ViewStyle>` (`TextStyle` für `<Text>` und `<Input>`, `ImageStyle` für `<Image>`) | Inline-Style oder ein Array von Styles, die von links nach rechts zusammengeführt werden (falsy-Einträge werden übersprungen; Arrays dürfen verschachtelt sein, daher akzeptiert `style={[base, props.style]}` ein `props.style`, das selbst ein Array ist). Hat Vorrang vor `class`. Siehe die [style reference](../modules/style-reference.md). |
| `class` | typisierte `Styled`-Methoden (`.flex_row().gap_2().p_4()`) | `string` | Tailwind-Klassen, nativ aufgelöst (`"flex-row gap-2 p-4 dark:bg-zinc-900"`). Spätere Klassen haben Vorrang vor früheren. Siehe [Tailwind](../docs/tailwind.md). |
| `classList` | `.style_when(when, \|s\| ..)` | `Record<string, boolean \| null \| undefined>` | Klassen, die angewendet werden, solange ihr Wert truthy ist (`{ "opacity-50": busy() }`). |
| `disabled` | `.disabled(..)` | `boolean` | Ignoriert Drücke (auch ohne Druck-Feedback), wendet `disabled:`-Styles an, deaktiviert Steuerelemente wie Inputs, und Screenreader sagen an, dass es deaktiviert ist (`accessibilityState.disabled`). |

<a id="presses-and-feedback"></a>

### Drücke und Feedback

Die Druckverarbeitung läuft nativ: Die Plattform erkennt den Druck und wendet die Press-Styles der App an, und der Code der App erfährt erst danach davon. Nur die innerste drückbare View reagiert; in Scroll-Views wartet ein Press-in etwa 130 ms, damit zuerst ein Scrollen beginnen kann.

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `onPress` | `.on_press(..)` | `(e: PressEvent) => void` | | Ein Tap endete innerhalb der View. |
| `onLongPress` | `.on_long_press(..)` | `(e: PressEvent) => void` | | Der Finger blieb für `delayLongPress` unten. |
| `onPressDown` | `.on_press_down(..)` | `(e: PressEvent) => void` | | Ein Finger setzte auf der View auf. |
| `onPressUp` | `.on_press_up(..)` | `(e: PressEvent) => void` | | Der Finger wurde angehoben oder verließ die View. |
| `delayLongPress` | `.long_press_delay(ms)` | `number` | `500` | Millisekunden, bevor ein Druck zu einem Long Press wird. |
| `hitSlop` | `.hit_slop(EdgeInsets::all(px(8.0)))` | `number \| Partial<Edges>` | | Erweitert die Touch-Fläche über die Grenzen hinaus, in Punkten. |

`PressEvent` ist `{ position, pagePosition, modifiers, clickCount }`: wo der Zeiger in der View und in ihrer Root-View war (`Point`s), die beim Beginn des Drucks gehaltenen Modifier-Tasten und die aufeinanderfolgenden Klicks (2 bei einem Doppelklick). Wo die Plattform keinen Zeiger meldet, ist es der Ursprung der View ohne Tasten und mit einem Klick.

Der Style-Key `pointerEvents` (`.pointer_events(PointerEvents::BoxNone)` in Rust, die Klassen `pointer-events-*`) bestimmt, welche Touches die View und die Views in ihr erhalten: `"none"` keine von beiden (eine darin liegende View, die `"auto"` setzt, nimmt sie wieder entgegen), `"box-none"` nur die Views in ihr, `"box-only"` nur die View selbst ([touch and gestures](../docs/touch-and-gestures.md#pointerevents)).

Das Press-Feedback gehört der App: `activeStyle` (oder `active:`-Klassen, `.active(..)` in Rust) gilt, solange die View gedrückt ist, nativ und ohne Round Trip zum Code der App (siehe unten).

<a id="state-styles"></a>

### Zustandsstile

Styles, die gelten, solange die View in einem Zustand ist, über ihren eigenen Styles und nativ. Jeder ist die Objektform einer Tailwind-Variante. Spätere Zustände haben Vorrang (selected, checked und indeterminate, dann hover, focus, active); `disabledStyle` hat Vorrang vor allen, und die anderen gelten nicht, solange die View deaktiviert ist. Jeder nimmt den eigenen Style des Elements: einen `TextStyle` bei einem `<Text>`, einen `InputStyle` bei einem `<Input>`, einen `ImageStyle` bei einem `<Image>`, sonst einen `ViewStyle`.

| Prop | Rust | Klassenvariante | Gilt |
|---|---|---|---|
| `activeStyle` | `.active(\|s\| ..)` | `active:` | Solange gedrückt. |
| `hoverStyle` | `.hover(\|s\| ..)` | `hover:` | Solange ein Zeiger über der View ist. |
| `focusStyle` | `.focus(\|s\| ..)` | `focus:` | Solange die View den Fokus hat. |
| `focusWithinStyle` | `.focus_within(\|s\| ..)` | `focus-within:` | Solange die View oder eine View in ihr den Fokus hat (der Inhalt eines `Overlay` zählt als innerhalb der View, in der er liegt). |
| `disabledStyle` | `.disabled_style(\|s\| ..)` | `disabled:` | Solange `disabled`. |
| `checkedStyle` | `.checked(\|s\| ..)`, `.checked_style(style)` | `checked:` | Solange `accessibilityState.checked` `true` ist (eine Checkbox, ein Switch, ein Radio; `"mixed"` ist nicht checked). |
| `indeterminateStyle` | `.indeterminate(\|s\| ..)`, `.indeterminate_style(style)` | `indeterminate:` | Solange `accessibilityState.checked` `"mixed"` ist (eine Checkbox, die weder checked noch unchecked ist). |
| `selectedStyle` | `.selected(\|s\| ..)` | `selected:` | Solange `accessibilityState.selected` `true` ist (ein ausgewähltes `Button`, ein Tab). |
| `expandedStyle` | `.expanded(\|s\| ..)`, `.expanded_style(style)` | `aria-expanded:` | Solange `accessibilityState.expanded` `true` ist (der Trigger eines `Popover` oder `Menu`, solange sein Popup offen ist). |
| `pressedStyle` | `.aria_pressed(\|s\| ..)`, `.pressed_style(style)` | `aria-pressed:` | Solange `accessibilityState.pressed` `true` ist (ein Toggle-Button, der an ist; `"mixed"` ist nicht pressed). Nicht `activeStyle`, ein laufender Druck. |

```rust tabs
view()
    .rounded_lg()
    .bg(rgb(0x2563eb))
    .px_4()
    .py_2()
    .active(|s| s.opacity(0.6))
    .hover(|s| s.bg(rgb(0x1d4ed8)))
    .on_press(save)
    .child(text("Save").text_color(white()))
```

```tsx tabs
<View onPress={save} activeStyle={{ opacity: 0.6 }} hoverStyle={{ backgroundColor: "#1d4ed8" }} class="rounded-lg bg-blue-600 px-4 py-2">
  <Text class="text-white">Save</Text>
</View>
```
### Hover

Die App bekommt mit, wenn die Maus über eine View fährt, sich darüber bewegt und sie wieder verlässt: unter macOS, Windows, Linux, im GPUI-Backend und in Desktop-Browsern, mit dem Zeiger eines iPads oder der Maus eines Macs unter iOS sowie mit Maus oder Stylus unter Android. Hover-Stile (`hover:`, `.hover(..)`) gestalten Views unter der Maus an denselben Stellen.

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `onMouseEnter` | `.on_mouse_enter(..)` | `(e: MouseEvent) => void` | Die Maus ist über die View oder eine View darin gefahren (das `mouseenter` des DOM). |
| `onMouseMove` | `.on_mouse_move(..)` | `(e: MouseEvent) => void` | Die Maus hat sich über der View (oder einer View darin) bewegt, mit oder ohne gedrückte Taste, oder eine Modifikatortaste wurde gedrückt oder losgelassen, während die Maus ohne gedrückte Taste dort ruht (das `mousemove` des DOM). |
| `onMouseLeave` | `.on_mouse_leave(..)` | `(e: MouseEvent) => void` | Die Maus hat die View und die Views darin oder das Fenster verlassen; `e` ist ihre letzte Position (das `mouseleave` des DOM). |

Wie CSS `:hover` und das `mouseenter` des DOM gilt eine View als gehovert, solange die Maus über ihr oder über etwas in ihr ist. Die Views um diejenige unter der Maus bekommen also ebenfalls `onMouseEnter` mit (von außen nach innen; `onMouseLeave` von innen nach außen). Die Events kommen im Nachhinein und nie bei Touches. Eine View, die unter der Maus entfernt wird, bekommt `onMouseLeave` mit, unter Linux und Windows bei der nächsten Mausbewegung.

`MouseEvent` gibt an, wo die Maus ist, wie GPUIs `MouseMoveEvent`: `position` in der View (ein `Point` in Punkten, ihre Transformationen rückgängig gemacht), `pagePosition` in der Root-View, in der sie liegt, wie Touches es liefern, die gehaltenen `modifiers` (`control`, `alt`, `shift`, `platform`: Command auf Apple-Plattformen, sonst die Windows-Taste) und `pressedButton`, die gedrückte Maustaste (`"left"`, `"right"`, `"middle"`, `"back"` oder `"forward"`, GPUIs `MouseButton`) oder `null`; in Rust `position`, `page_position`, `modifiers` und `pressed_button`. Auf Desktop und im Web ist ein Drag auch ein Touch (`onTouchMove`, der Responder), und seine Bewegungen erreichen `onMouseMove` mit gesetztem `pressedButton`: Feedback, das nur dem Hover folgt, überspringt diese; unter iOS und Android meldet der Hover den Zeiger ohne gedrückte Taste. Bewegungen kommen höchstens einmal pro Frame, die jeweils letzte, und immer vor dem `onMouseLeave`, das auf sie folgt, sodass ein Handler bei jeder Bewegung neu zeichnen kann:

```rust tabs
// A crosshair over a chart.
let at = signal(None::<Points>);

view()
    .h(px(200.0))
    .on_mouse_move(move |e: &MouseEvent| at.set(Some(e.position.x)))
    .on_mouse_leave(move |_: &MouseEvent| at.set(None))
    .child(when(move || at.get().is_some(), move || {
        view()
            .absolute()
            .left(move || at.get().unwrap_or_default())
            .top_0()
            .bottom_0()
            .w(px(1.0))
            .bg(rgb(0x888888))
    }))
```

```tsx tabs
// A crosshair over a chart.
const at = signal<number | null>(null);

<View onMouseMove={(e) => at.set(e.position.x)} onMouseLeave={() => at.set(null)} style={{ height: 200 }}>
  <If when={at() !== null}>
    <View style={{ position: "absolute", left: at()!, top: 0, bottom: 0, width: 1, backgroundColor: "#888" }} />
  </If>
</View>
```

### Tooltips

`tooltip` gibt jedem Element einen Hinweis, der auf dem Desktop (macOS, Windows, Linux, dem GPUI-Backend und Desktop-Browsern) über dem Element erscheint, sobald der Zeiger eine halbe Sekunde darauf geruht hat, und bleibt, bis der Zeiger das Element verlässt oder drückt. Smartphones und Tablets zeigen keinen. Der Hinweis nimmt weder den Zeiger noch Drücke an, daher funktioniert das Element genau wie ohne ihn.

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `tooltip` | `.tooltip(..)` | `JSX.Element` | Der Hinweis, ein Element, das die App selbst gestaltet: Ein [`Tooltip`](tooltip.md) vom Typ `nsh/base` ist der Tooltip selbst, mit eigener Platzierung, Verzögerung und eigenen Events; jedes andere Element wird so angezeigt, wie es ist. |

```rust tabs
view()
    .on_press(save)
    .tooltip(
        tooltip()
            .rounded_md()
            .bg(rgb(0x111827))
            .px_2()
            .py_1()
            .child(text("Save the document").text_color(white())),
    )
    .child(text("💾"))
```

```tsx tabs
<View
  onPress={save}
  tooltip={
    <Tooltip class="rounded-md bg-gray-900 px-2 py-1">
      <Text class="text-white">Save the document</Text>
    </Tooltip>
  }
>
  <Text>💾</Text>
</View>
```

Das `Tooltip` legt sein Aussehen, seine Platzierung, Verzögerung und Events selbst fest, so wie auch GPUIs `.tooltip(..)` eines annimmt. Eine App mit vielen Tooltips hält eine kleine eigene Komponente bereit, die einen Text in ihrem `Tooltip` einbettet.

<a id="context-menus"></a>

### Kontextmenüs

`onContextMenu` teilt einer View mit, dass die sekundäre Taste über ihr gedrückt wurde: ein Rechtsklick, Control-Klick unter macOS, ein Zweifingerklick auf einem Touchpad, der sekundäre Klick des Zeigers eines iPads; in Browsern auch die Menütaste der Tastatur. Öffne dort das eigene Menü der App; in TSX zeigt [`Menu.popup`](../modules/nsh-desktop.md) das des Systems:

```rust tabs
// The app's own menu, placed where the click was.
let menu_at = signal(None::<Point<Points>>);

view()
    .on_context_menu(move |e: &ContextMenuEvent| menu_at.set(Some(e.page_position)))
    .child(text(row.name.clone()))
```

```tsx tabs
import { Menu } from "nsh/desktop";

<View onContextMenu={(e) => Menu.popup(rowMenu(row), e.pagePosition)}>…</View>
```

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `onContextMenu` | `.on_context_menu(..)` | `(e: ContextMenuEvent) => void` | Die sekundäre Taste wurde über der View oder einer View darin gedrückt. |

`ContextMenuEvent` enthält `position` in der View, `pagePosition` in ihrer Root-View (wo `Menu.popup` ein Menü platziert: `Menu.popup(items, e.pagePosition)`) und die `modifiers`; in Rust `position`, `page_position` und `modifiers`. Die nächste View, die zuhört, von der unter dem Zeiger nach außen, bekommt es mit. Ein Texteingabefeld oder auswählbarer Text mit Bearbeitungsmenü (Windows, das GPUI-Backend, Browser), das näher liegt als diese View, zeigt stattdessen sein eigenes Menü. Die Plattform entscheidet das, während die Taste gedrückt wird, anhand dessen, was eingebunden ist; der Handler erfährt es also im Nachhinein, und nichts muss abgebrochen werden. Eine `disabled` View überlässt den Klick dem nächsten aktivierten Listener um sie herum. Auf Touchscreens öffnet ein langer Druck Menüs: Behandle `onLongPress` mit derselben Funktion.

<a id="keyboard-focus"></a>

### Tastaturfokus

Unter macOS und im Web bewegt Tab den Tastaturfokus zwischen seinen Stopps in Baumreihenfolge: den Eingabefeldern, den Views, die Drücke annehmen, und jeder `focusable` View. Fokus-Stile (`focus:`, `.focus(..)`) gestalten die fokussierte View, und Return oder Leertaste drückt sie, wenn sie Drücke annimmt. Ein Klick drückt eine View, ohne sie zu fokussieren, daher erscheinen Fokus-Stile nur beim Tastaturfokus.

Fokus und Drücke sind getrennt. Eine View, die Tasten annimmt, solange sie den Fokus hat (ein Diagramm, ein Slider, eine Liste, die ihre Auswahl mit den Pfeiltasten bewegt), setzt `focusable` und bindet ihre Tasten, solange sie fokussiert ist (`onFocus` / `onBlur` mit [`keymap`](../modules/nsh.md#keymap)); ein Drücken darauf erreicht weiterhin ein drückbares Element um sie herum, etwa eine Karte, die eine Seite öffnet.

Das `focus()` einer Ref verschiebt den Tastaturfokus auf einen Stopp, so wie Tab es tut (seine Fokus-Stile erscheinen und `onFocus` wird ausgelöst), etwa um ihn dem Auslöser eines geschlossenen Popups zurückzugeben, und `blur()` nimmt ihn weg.

Eine View um den Fokus gestaltet sich selbst mit `focus-within:` (`focusWithinStyle`, `.focus_within(..)`), solange der Fokus auf ihr oder auf einer View darin liegt: der Rahmen eines Feldes um das Eingabefeld, das bearbeitet, eine Toolbar, während einer ihrer Buttons den Fokus hat. Der Inhalt eines `Overlay` liegt in der View, in der das Overlay ist, wo auch immer es angezeigt wird, sodass ein Popup als Teil der View zählt, die seinen Auslöser enthält. In Rust bekommt eine Komponente mit dem `on_focus_in(..)` und `on_focus_out(..)` ihrer Ref mit, wie der Fokus in ein Element hineinkommt und es verlässt: Der Wechsel zwischen Views darin ist keines von beidem.

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `focusable` | `.focusable(..)` | `boolean` | `true` für Views, die Drücke annehmen | Ob die View ein Stopp von Tab ist. `true` macht jede View zu einem, egal ob sie Drücke annimmt oder den Views um sie herum überlässt; `false` überlässt ein drückbares Element dem Zeiger (ein Backdrop, das ein Popover schließt, Zeilen, zwischen denen die Pfeiltasten wechseln). |
| `onFocus` | `.on_focus(..)` | `() => void` | | Tab (oder `focus()`) hat der View den Tastaturfokus gegeben. |
| `onBlur` | `.on_blur(..)` | `() => void` | | Der Tastaturfokus hat die View verlassen. |

```rust tabs
view()
    .rounded_lg()
    .p_3()
    .focus(|s| s.bg(rgb(0xe0f2fe)))
    .on_press(open)
    .child(text("Open"))

// An overlay's backdrop: a click closes it, Tab goes past it to the content.
view().absolute().inset_0().focusable(false).on_press(close)

// A chart in a card: Tab stops at the chart, a click opens the card's page.
view().on_press(open_page).child(
    view()
        .h(px(160.0))
        .focusable(true)
        .focus(|s| s.bg(rgb(0xe0f2fe)))
        .on_focus(move || focused.set(true))
        .on_blur(move || focused.set(false)),
)
```

```tsx tabs
<View class="rounded-lg p-3 focus:bg-sky-100" onPress={open}>
  <Text>Open</Text>
</View>

{/* An overlay's backdrop: a click closes it, Tab goes past it to the content. */}
<View class="absolute inset-0" focusable={false} onPress={close} />

{/* A chart in a card: Tab stops at the chart, a click opens the card's page. */}
<View onPress={openPage}>
  <View
    class="h-40 focus:bg-sky-100"
    focusable
    onFocus={() => focused.set(true)}
    onBlur={() => focused.set(false)}
  />
</View>
```

<a id="layout-and-identity"></a>

### Layout und Identität

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `onLayout` | `.on_layout(\|frame: &Bounds<Points>\| ..)` | `(e: { bounds: Bounds }) => void` | `bounds` ist der Frame der View relativ zu ihrem Parent, `{ origin, size }`, nach jedem Layout, das ihn ändert. |
| `ref` | `.element_ref(&handle)` | `ViewRef \| (node: ViewRef) => void` | Die Ref des Elements (siehe [Ref-Methoden](#ref-methods)): `ViewRef` oder der eigene Typ des Elements darüber. `ref={el}` weist eine Variable zu, `ref={fn}` ruft eine Funktion auf. |
| `nativeID` | `.native_id(id)` | `string` | Benennt die View für andere, z. B. das `InputAccessoryView`, auf das sich ein Eingabefeld bezieht. |
| `testID` | `.test_id(id)` | `string` | Ein Bezeichner für UI-Tests (unter Android die Resource-ID der View). |
| `key` | `.key(key)` | `string` | Die Identität des Elements unter seinen Geschwistern. |

<a id="gestures-driving-animated-values"></a>

### Gesten, die animierte Werte steuern

Diese Props binden eine Geste an [native animierte Werte](../modules/nsh.md#animation), die sich auf dem UI-Thread bewegen, ohne dass der Code der App pro Frame etwas tun muss. Siehe [Touch und Gesten](../docs/touch-and-gestures.md).

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `pan` | `.pan_values(Some(&x), Some(&y))` | `{ x?: AnimatedValue; y?: AnimatedValue }` | Drags steuern diese Werte (Punkte). |
| `onPanStart` | `.on_pan_start(..)` | `(e: PanEvent) => void` | Ein Drag hat begonnen. |
| `onPanEnd` | `.on_pan_end(..)` | `(e: PanEvent) => void` | Ein Drag ist beendet, mit der Geschwindigkeit beim Loslassen (z. B. um ein `decay` zu starten). |
| `pinch` | `.pinch_value(&scale)` | `{ scale?: AnimatedValue }` | Zwei-Finger-Pinches steuern `scale`. |
| `onPinchStart` / `onPinchEnd` | `.on_pinch_start(..)` / `.on_pinch_end(..)` | `(e: { scale: number; velocity: number }) => void` | Ein Pinch hat begonnen / ist beendet. |
| `rotation` | `.rotation_value(&angle)` | `{ angle?: AnimatedValue }` | Zwei-Finger-Rotationen steuern `angle` (Grad). |
| `onRotationStart` / `onRotationEnd` | `.on_rotation_start(..)` / `.on_rotation_end(..)` | `(e: { rotation: number; velocity: number }) => void` | Eine Rotation hat begonnen / ist beendet. |

`PanEvent` ist `{ cancelled, translation, velocity, value? }` (in Rust `cancelled`, `translation`, `velocity_x`, `velocity_y`, `value_x`, `value_y`): ob das System den Drag abgebrochen hat, die Verschiebung seit dem Start und die Geschwindigkeit in Punkten pro Sekunde (`Point`s) sowie die gebundenen Werte in diesem Moment, `{ x?, y? }` für die Achsen, die `pan` bindet (ein Drag kann einen Wert mitten in einer Animation greifen).

<a id="raw-touches-and-the-responder-system"></a>

### Rohe Touches und das Responder-System

Für Gesten, die die obigen Props nicht abdecken, nimmt jedes Element die Touch- und Responder-Props an: `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel` (und ihre `…Capture`-Formen), `onStartShouldSetResponder`, `onMoveShouldSetResponder` (und `…Capture`), `onResponderGrant`, `onResponderReject`, `onResponderStart`, `onResponderMove`, `onResponderEnd`, `onResponderRelease`, `onResponderTerminate` und `onResponderTerminationRequest`. Jeder Handler erhält ein `GestureResponderEvent` (`{ identifier, locationX, locationY, pageX, pageY, target, timestamp, touches, changedTouches, nativeEvent,
stopPropagation() }`); the `…ShouldSetResponder` handlers also get a `gestureState` (`dx`, `dy`, `vx`, `vy`, ...). Wenn `onResponderGrant` den Wert `true` zurückgibt, nehmen native Scroll-Views die Touches nicht an. `panActivation` (`{ activeOffsetX, activeOffsetY, failOffsetX, failOffsetY }`) macht die View erst dann zum Responder, wenn die Plattform ihren Pan aktiviert, sodass Drags in Scroll-Views die andere Achse ihnen überlassen ([Touch und Gesten](../docs/touch-and-gestures.md#pans-inside-scroll-views-panactivation)). `PanResponder` in [`PanResponder`](../modules/nsh.md#panresponder) baut darauf auf. In Rust bekommt `.on_touch(..)` jeden Touch mit (`TouchEvent`), `.claim_touches(..)` entscheidet, wann die View sie annimmt, und `.on_responder_grant(..)`, `.on_responder_move(..)`, `.on_responder_release(..)` und die anderen folgen dem Responder.

<a id="accessibility"></a>

### Barrierefreiheit

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `accessible` | `.accessible(..)` | `boolean` | Die View ist für assistive Technologien ein einziges Element; ihre Kinder werden nicht einzeln bereitgestellt. |
| `accessibilityLabel` | `.label(..)` | `string` | Was Screenreader vorlesen. Views ohne Label lesen ihre Texte vor. |
| `accessibilityHint` | `.hint(..)` | `string` | Was das Aktivieren des Elements bewirkt. |
| `role` | `.role(AccessibilityRole::Button)` | `AccessibilityRole` | Was das Element ist (`"button"`, `"header"`, `"link"`, `"switch"`, …). |
| `accessibilityState` | `.accessibility_state(..)` | `{ disabled?, selected?, checked?, busy?, expanded?, pressed?, current? }` | Der Zustand, den assistive Technologien melden (`checked` und `pressed` können `"mixed"` sein; `current` ist `true` oder `"page"`, `"step"`, `"location"`, `"date"`, `"time"`). |
| `accessibilityLevel` | `.accessibility_level(..)` | `number` | Die Ebene einer Überschrift (1 ist die oberste), die Tiefe eines Baumelements (1 ist die oberste). |
| `accessibilityValue` | `.accessibility_value(..)` | `{ min?, max?, now?, text? }` | Der Wert eines Bereichs- oder Textelements. |
| `accessibilityElementsHidden` | | `boolean` | Verbirgt die View und ihren Teilbaum vor assistiven Technologien. |
| `importantForAccessibility` | | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Ob die View bereitgestellt wird. |
| `accessibilityActions` | | `{ name: string; label?: string }[]` | Benutzerdefinierte Aktionen, die assistiven Technologien angeboten werden. |
| `onAccessibilityAction` | `.on_accessibility_action(..)` | `(e: { actionName: string }) => void` | Der Benutzer hat eine der `accessibilityActions` ausgelöst. |

Siehe [Barrierefreiheit](../docs/accessibility.md).

<a id="platform-only-props"></a>

### Plattformspezifische Props

Props, die nur auf einer Plattform existieren, stehen in TSX in einem nach ihr benannten Objekt, sodass die gemeinsamen Props überall gleich bleiben. Nur das Objekt der aktuellen Plattform wird gesendet; die anderen werden ignoriert. Rust-Builder nehmen sie als Methoden an, die auf ihrer Plattform wirken.

| Prop | Beschreibung |
|---|---|
| `ios={{…}}` | iOS und Mac Catalyst. `<Input>`, `Dialog` und `WebView` fügen eigene Schlüssel hinzu. |
| `android={{…}}` | Android. Jedes Element nimmt `ripple`, `elevation` und `accessibilityLiveRegion` an (siehe unten). |
| `desktop={{…}}` | Desktop-Plattformen und Desktop-Browser; auf Mobilgeräten ignoriert. Jedes Element nimmt `windowDrag` an (siehe unten). |
| `web={{…}}` | Browser; anderswo ignoriert. |

| `android`-Schlüssel | Rust | Typ | Beschreibung |
|---|---|---|---|
| `ripple` | `.ripple(Ripple { .. })` | `{ color?, borderless?, radius?, foreground? }` | Der Material-Ripple beim Drücken. |
| `elevation` | `.elevation(px(2.0))` | `number` | Der Material-Schatten (Punkte), aus der Form der View. |
| `accessibilityLiveRegion` | | `"none" \| "polite" \| "assertive"` | Wie Änderungen der View an TalkBack gemeldet werden. |

| `desktop`-Schlüssel | Rust | Typ | Beschreibung |
|---|---|---|---|
| `windowDrag` | `.window_drag(..)` | `boolean` | Das Drücken der View zieht das Fenster, so wie es seine Titelleiste täte; `false` hält einen Teil einer ziehbaren View klickbar. Siehe [eine eigene Titelleiste](../modules/nsh-desktop.md#a-title-bar-of-your-own). |

```rust tabs
use nsh_core::Ripple;

view()
    .rounded_lg()
    .bg(white())
    .p_4()
    .elevation(px(2.0))
    .ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })
    .on_press(save)
    .child(text("Save"))
```

```tsx tabs
<View onPress={save} android={{ ripple: { color: "#00000022" }, elevation: 2 }} class="rounded-lg bg-white p-4">
  <Text>Save</Text>
</View>
```

Siehe [plattformspezifischer Code](../docs/platform-specific.md).
<a id="ref-methods"></a>

## Ref-Methoden

In TSX erhält `ref` die Ref des Elements, deren Typ der eigene Typ des Elements ist: `ViewRef` (`focus`, `blur`, `measure`) für
`View`, `Text`, `Image`, `Canvas`, `Overlay` und `Shader`, und ein Typ über `ViewRef` mit den Methoden des Elements für die
übrigen: `InputRef` (`Input`), `ScrollRef` (`Scroll`), `ListRef` (`List`), `WebViewRef` (`WebView`), `VideoRef`
(`Video`) und `NativeComponentRef` (native Komponenten). In Rust erzeugt `element_ref()` ein `ElementRef`-Handle, das
`.element_ref(&handle)` anhängt. Ihre Methoden senden Befehle an die native View, und zwar in der Reihenfolge der Änderungen, die im selben Turn vor ihnen vorgenommen wurden. Die Seite des jeweiligen Elements gibt an, welche Methoden für es gelten. Typisiere eine Ref-Variable mit dem eigenen Typ ihres Elements (`let field!: InputRef` für ein `<Input>`): Eine Variable vom Typ `ViewRef` passt nicht zu einem Element, dessen Ref eigene Methoden hat.

| Methode | Rust | Ref | Beschreibung |
|---|---|---|---|
| `focus()` / `blur()` | `focus()` / `blur()` | `ViewRef` | Setzt den Fokus auf ein `<Input>` (zeigt die Tastatur) oder gibt einer View, die Berührungen entgegennimmt, den Tastaturfokus bzw. entzieht ihn. |
| `measure()` | `measure()` | `ViewRef` | [Wo sich die View befindet](../docs/touch-and-gestures.md#where-a-view-is-measure). |
| `setSelection(start, end?)` | `set_selection(start, end)` | `InputRef` | Wählt `start..end` in UTF-16-Einheiten aus; ein Cursor ohne `end`. |
| `scrollTo({ x?, y?, animated? })` | `scroll_to(point, animated)` | `ScrollRef`, `ListRef` | Scrollt zu einem Offset. |
| `zoomTo({ scale, x?, y?, animated? })` | `zoom_to(scale, center, animated)` | `ScrollRef` (ein zoombares `<Scroll>`) | Zoomt auf `scale` um einen Inhaltspunkt. |
| `scrollToOffset({ offset, animated? })` | `scroll_to_offset(offset, animated)` | `ListRef` | Scrollt zu einem Offset entlang der Achse der Liste. |
| `scrollToIndex({ index, animated?, viewPosition?, viewOffset? })` | `scroll_to_index(index, position, offset, animated)` | `ListRef` | Scrollt ein Element in den sichtbaren Bereich. |
| `scrollToEnd({ animated? })` | `scroll_to_end(animated)` | `ScrollRef`, `ListRef` | Scrollt zum Ende des Inhalts. |
| `reload()`, `goBack()`, `goForward()`, `stopLoading()`, `injectJavaScript(script)`, `postMessage(data)` | `reload()`, `go_back()`, `go_forward()`, `stop_loading()`, `inject_java_script(..)`, `post_message(..)` | `WebViewRef` | Steuert die Seite. |
| `seek(seconds)` | `seek(seconds)` | `VideoRef` | Springt zu einem Zeitpunkt. |
| `command(name, args?)` | `command(name, args)` | `NativeComponentRef` | Ruft einen Befehl einer registrierten nativen Komponente auf ([`nativeComponent`](../modules/nsh.md#nativecomponent-and-nativemodule)). |

```rust tabs
let field = element_ref();

view()
    .on_press(move || field.focus())
    .child(input().element_ref(&field).placeholder("Tap the row to type"))
```

```tsx tabs
import { type InputRef, View } from "nsh";
import { Input } from "nsh/base";

let input!: InputRef;
<View onPress={() => input.focus()}>
  <Input ref={input} placeholder="Tap the row to type" />
</View>;
```

<a id="why-handlers-never-block-the-ui"></a>

## Warum Handler die UI nie blockieren

Der Main-Thread wartet nie auf den Code der App. Wenn das System sofort eine Antwort braucht (darf sich dieser Text ändern, darf der Zurück-Button die Seite entfernen, darf dieses Sheet geschlossen werden), beantwortet NSH das nativ anhand von Props, die vorher gesetzt wurden (`maxLength`,
`popOnBack`, `closeOnSwipe`, …), und das Ereignis erreicht die App erst danach. Deshalb ist ein solches Verhalten
eine Prop und kein Rückgabewert eines Handlers.
