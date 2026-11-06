---
title: "nsh/mobile"
description: "Was iOS und Android bieten: TabBar, die Tab-Leiste des Systems, InputAccessoryView unter iOS, BackHandler unter Android und isAvailable."
order: 12.2
source_hash: 53d6d77de0d6e9ca
---


# nsh/mobile

`nsh/mobile` enthält die Fähigkeiten speziell für iOS und Android: die Tab-Leiste des Systems, `TabBar`, auf beiden Plattformen; [`InputAccessoryView`](#inputaccessoryview), eine Leiste über der Tastatur, auf iOS; und [`BackHandler`](#backhandler), die Zurück-Taste, auf Android. Rust-Code verwendet `nsh_core::mobile` und `nsh_core::prelude`; TSX importiert `nsh/mobile`. Das Modul lässt sich auf jeder Plattform importieren, sodass ein Bundle überall läuft: Auf den anderen Plattformen beanspruchen seine Komponenten keinen Platz und seine Aufrufe kehren sofort zurück. `isAvailable` verrät, ob die App auf iOS oder Android läuft (`platform.os` aus `nsh` sagt, auf welchem von beiden). Was Desktops bieten, steht in [nsh/desktop](./nsh-desktop.md).

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## Geltungsbereich

Dieses Modul stellt Fähigkeiten bereit, die speziell für mobile Plattformen gelten, etwa die System-Tab-Leiste für die Navigation auf oberster Ebene einer App. Gemeinsame Steuerelemente gehören zu [`nsh/base`](./nsh-base.md): Dessen [Switch](../elements/switch.md) etwa teilt Verhalten und API über Smartphones, Desktops und das Web hinweg, wobei Track, Thumb und Zustandsstile von der App geliefert werden. `TabBar` dient der Navigation mobiler Apps; `Tabs` dient tabulatorbasierten Inhalten über Plattformen hinweg. Hierher gehören nur Fähigkeiten mit mobilspezifischer Interaktionssemantik. Ein System-Erscheinungsbild, eine Größe oder eine Animation allein ändert nichts an der gemeinsamen Rolle eines allgemeinen Steuerelements. Diese Unterscheidung bestimmt, welche Fähigkeiten hierher gehören ([Ziele und Designprinzipien](../docs/goals.md)).

## isAvailable

```ts
const isAvailable: boolean;
```

`true` auf iOS, im iOS-Simulator, auf Mac Catalyst und Android; `false` andernorts. Rust:
`matches!(os(), Os::Ios | Os::Android)`.

## TabBar

Eine Tab-Leiste wechselt zwischen den Bereichen auf oberster Ebene einer App: Aufzeichnungen und Statistiken, Posteingang und Einstellungen. `TabBar` ist die systemeigene Leiste, sieht also aus und verhält sich wie die Apps des Systems: `UITabBar` auf iOS und iPadOS (Liquid Glass und dessen Auswahl ab iOS 26), die Navigationsleiste von Material 3 auf Android, in den Systemfarben, hell und dunkel. Die App liefert die Tabs (`items`), gibt an, welcher ausgewählt ist (`selectedIndex`), erfährt die Wahl des Nutzers (`onChange`), platziert die Leiste mit `class` und `style` und zeigt den Inhalt des ausgewählten Bereichs selbst an. Für Tabs innerhalb einer Seite und auf jeder Plattform verwende [Tabs](../elements/tabs.md) von `nsh/base`.

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar` stammt aus `nsh/mobile`, in Rust aus `nsh_core::mobile`. Die Auswahl gehört der App: Ein Tippen meldet `onChange` mit dem Index des Tabs (`{ index }`), die Leiste zeigt die Wahl sofort an, wie es die des Systems tut, und die App zeigt den entsprechenden Bereich an und gibt den Index als `selectedIndex` zurück. Die Höhe entspricht der des Systems, sofern der Stil sie offenlässt. In Rust erzeugt `tab_bar()` eine Leiste, mit einem Setter pro Prop (`.items(..)`, `.selected_index(..)`), einem Listener pro Event (`.on_change(..)`) und den typisierten Stilmethoden; `TabBarItem::new(title).icon(name)` erzeugt einen Tab.

### Props

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | Die Tabs in ihrer Reihenfolge. |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | Der ausgewählte Tab, per Index; ein Index hinter den Tabs wählt keinen aus. |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS: Blendet die Leiste ohne Übergang aus. Die App besitzt diesen Wert über Pushes und Pops hinweg. Die Leiste wird angezeigt, wenn sowohl dieser Prop als auch die `hidesBottomBarWhenPushed`-Anforderung des sichtbaren Stacks false sind. |
| `class`, `style` | Stilmethoden | `string`, `StyleProp<ViewStyle>` | keiner | Wo die Leiste liegt: Position und Größe. Ihr Aussehen ist das des Systems, wobei der ausgewählte Tab die `primary` des Themes verwendet. |
| `testID` | `.test_id(..)` | `string` | keiner | Findet die Leiste in Tests und `nsh test --trace`. |

#### TabBarItem

| Feld | Rust | Typ | Beschreibung |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | Der Titel des Tabs, den Screenreader vorlesen. |
| `icon` | `.icon(name)` | `string` | Das Symbol des Tabs, über den plattformeigenen Namen: ein [SF Symbol](https://developer.apple.com/sf-symbols/) auf iOS (`"house"`), ein Drawable der App auf Android (`res/drawable/home.xml` ist `"home"`, `"android:ic_menu_search"` das des Systems). `platform.select` wählt eines pro Plattform aus. |

### Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | Der Nutzer hat einen Tab gewählt: `{ index }`, dessen Index. Die Leiste zeigt die Wahl sofort an; die App zeigt den Inhalt des Tabs an und setzt `selectedIndex`. |

<a id="platform-notes"></a>

### Plattformhinweise

- **iOS und Mac Catalyst**: `UITabBar` mit dem Erscheinungsbild des Systems für die jeweilige iOS-Version: die schwebende Liquid-Glass-Leiste und deren Auswahl ab iOS 26. Symbole sind SF Symbols. Die `primary` des Themes ist der `tintColor` der Leiste, die Farbe des ausgewählten Tabs; die anderen Tabs behalten die Farbe des Systems.
- **Android**: Die Navigationsleiste von Material 3, aufgebaut aus den Views der Plattform: ein Symbol in seinem aktiven Indikator über jedem Label, ein Ripple beim Drücken, die dynamischen Farben des Systems ab Android 12 und davor die Basisfarben von Material, hell oder dunkel gemäß dem Erscheinungsbild der App. Am unteren Fensterrand reicht sie unter die Navigationsleiste und ist um deren Inset höher, wie bei Material. Symbole sind Drawables der App (von der Leiste eingefärbt). Symbol und Label des ausgewählten Tabs verwenden die `primary` des Themes, über einem aktiven Indikator in dieser Farbe mit 12 % Deckkraft; die anderen Tabs behalten die Farbe des Systems.
- **Desktops (macOS, Windows, Linux, GPUI) und das Web**: Die Bereiche werden mit [Tabs](../elements/tabs.md) im Look der App angezeigt. `TabBar` beansprucht dort keinen Platz, sodass ein Layout beide Fälle abdeckt, ausgewählt durch `platform.os` ([Geräte-API von `nsh`](./nsh.md#device)).

## InputAccessoryView

Auf iOS und Mac Catalyst; auf Android ist sie eine leere, versteckte View.

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

Eine Leiste über der Tastatur (`inputAccessoryView` von UIKit), die angezeigt wird, solange ein Eingabefeld den Fokus hat, dessen `ios={{ inputAccessoryViewID }}` zu ihrer `nativeID` passt. Rust: `input_accessory_view(native_id)`, angezeigt für die Eingabefelder, deren `.input_accessory(native_id)` passt. Sie ist so breit wie das Fenster und so hoch wie ihr Inhalt und bewegt sich nativ mit der Tastatur.

| Prop | Typ | Rust | Beschreibung |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | Eingabefelder mit dieser `inputAccessoryViewID` zeigen die Leiste an. |
| `style` | `StyleProp<ViewStyle>` | `Styled`-Methoden (`.bg(…)`) | Der Stil der Leiste (zum Beispiel ihr Hintergrund). |
| `class` | `string` | | Tailwind-Klassen. |
| `children` | `JSX.Element` | `.child(…)` | Der Inhalt der Leiste. |

Sie rendert an der Stelle im Baum, an der sie platziert wird, nichts, und auf Android überhaupt nichts, sodass du sie neben dem Eingabefeld platzieren kannst, zu dem sie gehört.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

Siehe auch [Formulare und Tastatur](../docs/forms-and-keyboard.md).

## BackHandler

Auf Android; auf iOS werden die Listener behalten, aber nie aufgerufen, und `exitApp()` kehrt sofort zurück.

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

Die Zurück-Taste und die Zurück-Geste des Systems. Dialoge behandeln den Zurück-Druck zuerst (ein Dialog wird geschlossen); danach laufen die Listener von `BackHandler`, der zuletzt hinzugefügte zuerst; behandelt ihn keiner von ihnen, wird der oberste Navigationsstack zurückgenommen, und gibt es keine Seite mehr, zu der man zurückkehren kann, wird die App beendet.

| Member | Rust | Beschreibung |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | `listener` gibt `true` zurück, wenn er den Druck behandelt hat. Gibt eine Funktion zurück, die das Lauschen beendet; ein Listener, der hinzugefügt wird, während eine Komponente rendert (oder ein Effekt läuft), endet mit ihr, in Rust wie in TSX. |
| `exitApp()` | der Listener gibt `false` zurück | Verlässt die App. Ein Rust-Listener, der `false` zurückgibt, lässt den Druck weiterlaufen, sodass der Stack zurückgeht oder die App beendet wird. |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> Der Listener läuft, nachdem das System den Druck zugestellt hat: Der Main-Thread wartet nie auf den Code der App. Solange mindestens ein Listener registriert ist, übernimmt NSH Zurück-Drücke, die Dialoge übrig lassen, und geht im obersten Stack zurück oder beendet die App selbst, wenn kein Listener `true` zurückgibt.

Die Statusleiste wird auf iOS und Android gleichermaßen von `statusBar` der [Seiten und Dialoge](./nsh-base.md#status-bar) aus `nsh/base` gesetzt.
