---
title: "Barrierefreiheit"
description: "Apps mit VoiceOver und TalkBack nutzbar machen – Labels, Rollen, Zustände, Werte, benutzerdefinierte Aktionen, Gruppierung und Ausblenden, Ansagen und Fokus, Textgröße und reduzierte Bewegung."
order: 48
group: ui
source_hash: 0f504242ebec73ee
---


# Barrierefreiheit

NSH rendert mit nativen Views, daher sehen die Assistenztechnologien der Plattformen (VoiceOver auf iOS und Mac Catalyst, TalkBack auf Android, Switch Control, Voice Control, ...) die echte View-Hierarchie deiner App. Du ergänzt die Beschreibungen, die diese Technologien nicht ableiten können: was ein Element ist, was es sagt, in welchem Zustand es sich befindet und was es tun kann. Jedes Element akzeptiert die folgenden Methoden (Rust) und Props (TSX).

<a id="what-you-get-without-doing-anything"></a>

## Was du ohne Zusatzaufwand bekommst

- **Text wird vorgelesen.** Ein Text-Element ist ein Accessibility-Element, dessen Label sein Text ist. Eine View ohne Label wird als die Texte in ihr vorgelesen.
- **Pressable Views sind Elemente.** Eine View mit einem Press- oder Long-Press-Handler (`.on_press`, `onPress`) ist standardmäßig ein Accessibility-Element, und ihre Aktivierung (Doppeltippen mit VoiceOver oder TalkBack) löst ein Press aus.
- **Inputs sind Textfelder**, mit Placeholder, Wert und Tastatur.
- **Text folgt der Größeneinstellung des Nutzers.** Siehe [Textgröße](#text-size).

<a id="labels-hints-and-roles"></a>

## Labels, Hints und Rollen

```rust tabs
view()
    .on_press(play)
    .role(AccessibilityRole::Button)
    .label("Play")
    .hint("Starts the song")
    .size(px(44.0))
    .items_center()
    .justify_center()
    .child(text("▶"))
```

```tsx tabs
<View
  onPress={play}
  role="button"
  accessibilityLabel="Play"
  accessibilityHint="Starts the song"
  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
>
  <Text>▶</Text>
</View>
```

| Rust | TSX | Typ | Beschreibung |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | Die View ist für Assistenztechnologien ein einzelnes Element; ihre Kinder werden nicht separat bereitgestellt. |
| `.label(..)` | `accessibilityLabel` | `string` | Was Screenreader vorlesen, anstelle der Texte im Inneren. |
| `.hint(..)` | `accessibilityHint` | `string` | Was die Aktivierung des Elements bewirkt, nach einer Pause vorgelesen. |
| `.role(..)` | `role` | `AccessibilityRole` | Was das Element ist. |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | Sein Zustand: disabled, selected, checked, busy, expanded, pressed, current. `selected` wendet zusätzlich den Selected-Style an, `checked` bei true den Checked-Style und bei `"mixed"` den Indeterminate-Style, `pressed` bei true den Pressed-Style. |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | Die Ebene einer Überschrift (1 ist die oberste), die Tiefe eines Tree-Items (1 ist die oberste). |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | Der Wert eines Range- oder Textelements. |
| | `accessibilityActions` | `{ name, label? }[]` | Aktionen, die Assistenztechnologien angeboten werden. |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | Eine Aktion wurde ausgeführt (Rust: ihr Name). |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | Blendet die View und ihren Teilbaum für Assistenztechnologien aus. |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Ob die View (und ihr Teilbaum) bereitgestellt wird. |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android: wie Änderungen der View TalkBack angekündigt werden. |
| `.test_id(..)` | `testID` | `string` | Ein Bezeichner für UI-Tests (der Accessibility Identifier auf iOS, die Resource-ID auf Android); wird nicht vorgelesen. |

Gib jedem Control, das nur ein Icon zeigt, ein Label: Ein Screenreader kann weder ein Glyph noch ein Bild lesen. Halte Labels kurz und nenne nicht die Rolle („Wiedergabe“, nicht „Wiedergabe-Button“): Die Rolle wird separat angesagt.

<a id="roles"></a>

### Rollen

Die Rolle (`.role(AccessibilityRole::Header)`, `role="header"`) sagt dem Nutzer, welche Art von Element vorliegt und wie es zu bedienen ist. In Rust ist sie eine Variante von `AccessibilityRole` (`Button`, `Header`, `Switch`, ...); die TSX-Werte sind `"none"`, `"button"`, `"link"`, `"search"`, `"image"`, `"imagebutton"`, `"keyboardkey"`, `"text"`, `"adjustable"`, `"header"`, `"summary"`, `"alert"`, `"checkbox"`, `"combobox"`, `"menu"`, `"menubar"`, `"menuitem"`, `"progressbar"`, `"radio"`, `"radiogroup"`, `"scrollbar"`, `"spinbutton"`, `"switch"`, `"tab"`, `"tablist"`, `"timer"`, `"toolbar"`, `"list"`, `"grid"`, `"table"`, `"rowgroup"`, `"row"`, `"columnheader"` und `"cell"` (die Rollen der Teile von [`Table`](../elements/table.md)), `"listbox"` und `"option"` (eine Liste von Optionen zur Auswahl, etwa die Liste von [`Select`](../elements/select.md), und ihre Optionen, wobei die gewählte mit `accessibilityState.selected` markiert ist), `"group"` (zusammengehörige verwandte Elemente), `"region"` (ein Abschnitt, der für sich ansteuerbar sein sollte, etwa das Panel eines Accordions), `"navigation"` (Links, die durch die App navigieren, etwa eine Pagination), `"tree"` und `"treeitem"` (Items, die auf- und zugeklappt werden, jeweils auf ihrer `accessibilityLevel`), `"menuitemcheckbox"` und `"menuitemradio"` (Menü-Items, die abgehakt sind, einzeln oder als eine Auswahl einer Gruppe).

Die nützlichsten:

- `"button"` für alles Pressable, das kein Link ist; `"link"` für die Navigation zu Inhalten.
- `"header"` für Abschnittstitel: Screenreader-Nutzer springen zwischen Überschriften, um einen Screen zu überfliegen. `accessibilityLevel` gibt ihre Ebene an (1 ist die oberste), wo die Plattform eine vorliest.
- `"button"` mit `accessibilityState.pressed` für einen Toggle-Button, der an oder aus bleibt (Fett in einer Toolbar).
- `"navigation"` um Links, die zwischen Seiten wechseln, wobei der Link der angezeigten Seite `accessibilityState.current: "page"` erhält.
- `"switch"`, `"checkbox"`, `"radio"` mit `accessibilityState.checked`.
- `"adjustable"` für Slider und Stepper, mit `accessibilityValue` und den Aktionen `increment` / `decrement`
  (jeder Thumb eines [`Slider`](../elements/slider.md) ist einer).
- `"spinbutton"` für ein Feld, das eine Zahl enthält, die der Nutzer auch schrittweise ändern kann, mit demselben Wert und denselben Aktionen (das
  Feld eines [`NumberInput`](../elements/number-input.md)).
- `"image"` für aussagekräftige Bilder, mit einem Label; dekorative Bilder sollten stattdessen ausgeblendet werden.

```rust tabs
text("Settings")
    .role(AccessibilityRole::Header)
    .text_size(px(22.0))
    .font_weight(FontWeight::BOLD)
```

```tsx tabs
<Text role="header" style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
```

<a id="states-and-values"></a>

### Zustände und Werte

Für ein Ein/Aus-Control in einer App verwende [`Switch`](../elements/switch.md) aus `nsh/base`, das Rolle und Zustand selbst setzt. Das Beispiel zeigt, was eine Rolle und ein Zustand auf einer View bewirken.

```rust tabs
use nsh_core::{Checked, prelude::*};

// A toggle drawn with views.
view()
    .on_press(move || on.update(|v| *v = !*v))
    .role(AccessibilityRole::Switch)
    .label("Wi-Fi")
    .accessibility_state(move || AccessibilityState {
        checked: Some(if on.get() { Checked::True } else { Checked::False }),
        ..AccessibilityState::default()
    })
    .hit_slop(EdgeInsets::all(px(8.0)))
    .w(px(51.0))
    .h(px(31.0))
    .rounded_full()
    .p(px(2.0))
    .bg(move || if on.get() { rgb(0x22c55e) } else { rgb(0xd4d4d8) })
    .child(
        view()
            .size(px(27.0))
            .rounded_full()
            .bg(white())
            .style_with(move |s| s.translate_x(px(if on.get() { 20.0 } else { 0.0 }))),
    )
```

```tsx tabs
// A toggle drawn with views.
<View
  onPress={() => on.set(!on())}
  role="switch"
  accessibilityLabel="Wi-Fi"
  accessibilityState={{ checked: on() }}
  hitSlop={8}
  class="h-[31px] w-[51px] rounded-full p-0.5 transition-colors"
  classList={{ "bg-green-500": on(), "bg-zinc-300": !on() }}
>
  <View class="size-[27px] rounded-full bg-white transition-transform" classList={{ "translate-x-5": on() }} />
</View>
```

Der Zustand ist `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }` in Rust und `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }` in TSX. `pressed` macht einen Button zu einem Toggle-Button (ARIAs `aria-pressed`); `current` markiert das aktuelle Item einer Menge (ARIAs `aria-current`): die Seite einer Pagination, den Schritt eines Wizards. `disabled` ist auch impliziert, wenn die View deaktiviert wird (`.disabled(..)`, `disabled`). `accessibilityValue` mit `min`, `max` und `now` wird als Prozentwert vorgelesen; mit `text` wird er wie angegeben vorgelesen („3 von 10“, „Mittel“).

<a id="actions"></a>

## Aktionen

Eine pressable View unterstützt die Aktivierung bereits. Für alles andere deklarierst du Aktionen mit `accessibilityActions` und behandelst sie mit `onAccessibilityAction`; eine Rust-Komponente erhält den Namen der ausgeführten Aktion mit `.on_accessibility_action(|name: &str| ..)`:

```tsx
function Quantity() {
  const n = signal(1);
  return (
    <View
      accessible
      role="adjustable"
      accessibilityLabel="Quantity"
      accessibilityValue={{ text: String(n()) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.actionName === "increment") n.update((v) => v + 1);
        if (e.actionName === "decrement") n.update((v) => Math.max(0, v - 1));
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View onPress={() => n.update((v) => Math.max(0, v - 1))}><Text>−</Text></View>
      <Text>{n()}</Text>
      <View onPress={() => n.update((v) => v + 1)}><Text>+</Text></View>
    </View>
  );
}
```

Einige Aktionsnamen sind standardisiert und entsprechen den eigenen Gesten der Plattformen:

| Name | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | Doppeltippen | Doppeltippen (Klick) |
| `increment`, `decrement` | Nach oben / unten wischen, danach liest VoiceOver den neuen Wert vor | Vorwärts / rückwärts scrollen |
| `longpress` | | Doppeltippen und halten |
| `expand`, `collapse` | | Aufklappen / zuklappen |
| `magicTap` | Doppeltippen mit zwei Fingern | |
| `escape` | Z-Geste mit zwei Fingern | |

Ein Element mit `increment` oder `decrement` ist unabhängig von seiner Rolle einstellbar: Ein Diagramm behält seine Rolle `"image"` und lässt sich mit den Wischgesten von VoiceOver und dem Scrollen von TalkBack Punkt für Punkt durchgehen, wobei nach jedem Schritt sein `accessibilityValue` vorgelesen wird.

Jeder andere Name wird zu einer benutzerdefinierten Aktion, die im Aktionen-Rotor von VoiceOver und im Aktionsmenü von TalkBack mit ihrem `label` (oder ihrem Namen) aufgelistet wird. Benutzerdefinierte Aktionen sind die barrierefreie Form von Swipe-to-delete und ähnlichen Gesten:

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## Gruppieren und Ausblenden

Eine View barrierefrei zu machen (`.accessible(true)`, `accessible`) macht sie zu einem einzigen Element: Eine Karte mit Titel, Untertitel und Preis wird in einem Zug vorgelesen, statt dass der Nutzer durch drei Texte wischen muss.

```rust tabs
view()
    .accessible(true)
    .on_press(open)
    .role(AccessibilityRole::Button)
    .p(px(16.0))
    .child(text("Blue jacket"))
    .child(text("Size M"))
    .child(text("$120"))
```

```tsx tabs
<View accessible onPress={open} role="button" style={{ padding: 16 }}>
  <Text>Blue jacket</Text>
  <Text>Size M</Text>
  <Text>$120</Text>
</View>
```

Blende aus, was nichts beiträgt: dekorative Bilder, Trennlinien, ein Icon neben einem Text, der dasselbe bereits sagt.

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden` (der Name auf iOS) und `importantForAccessibility="no-hide-descendants"` (der Name auf Android) blenden den Teilbaum beide auf beiden Plattformen aus; beide zu setzen ist unschädlich.

<a id="the-screen-reader-and-the-users-settings"></a>

## Der Screenreader und die Einstellungen des Nutzers

In Rust meldet das Prelude die Einstellungen des Nutzers und spricht mit dem Screenreader: `screen_reader()` und `reduce_motion()` sind reaktiv, `announce_for_accessibility(message)` lässt den Screenreader eine Nachricht vorlesen, und das `element_ref()` eines Elements verschiebt den Fokus des Screenreaders mit `set_accessibility_focus()` auf dieses. In TSX meldet die Accessibility-API von `nsh` die Einstellungen des Nutzers und lässt dich mit dem Screenreader sprechen.

| Member | Beschreibung |
|---|---|
| `screenReaderEnabled()` | Ob VoiceOver oder TalkBack läuft (reaktiv). |
| `reduceMotion()` | Ob der Nutzer weniger Bewegung angefordert hat (reaktiv). |
| `announce(message)` | Der Screenreader liest `message` vor. |
| `setAccessibilityFocus(ref)` | Verschiebt den Fokus des Screenreaders auf eine View. |

Die Einstellungen sind Accessors: Lies sie in einem Binding oder einem Effect, und alles, was sie liest, aktualisiert sich, wenn der Nutzer die Einstellung ändert, ohne Cleanup.

```rust tabs
use nsh_core::prelude::*;

fn upload() -> impl IntoElement {
    let done = signal(false);
    let result = element_ref();
    let finish = move || {
        done.set(true);
        announce_for_accessibility("Upload complete");
        result.set_accessibility_focus();
    };
    view()
        .gap(px(12.0))
        // Autoplaying carousels are hard to use with a screen reader: show a list instead.
        .child(when(move || !screen_reader(), photo_carousel).otherwise(photo_list))
        .child(
            text(move || if done.get() { "Uploaded 3 photos" } else { "Uploading…" })
                .element_ref(&result),
        )
}
```

```tsx tabs
import { signal, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Upload() {
  const done = signal(false);
  let result!: ViewRef;
  const finish = () => {
    done.set(true);
    announce("Upload complete");
    setAccessibilityFocus(result);
  };
  return (
    <View style={{ gap: 12 }}>
      {/* Autoplaying carousels are hard to use with a screen reader: show a list instead. */}
      <If when={!screenReaderEnabled()} else={<PhotoList />}>
        <PhotoCarousel />
      </If>
      <Text ref={result}>{done() ? "Uploaded 3 photos" : "Uploading…"}</Text>
    </View>
  );
}
```

Kündige Änderungen an, die der Nutzer sonst verpassen würde: ein abgeschlossenes Speichern im Hintergrund, einen Fehler, der abseits des Fokus erscheint, einen ablaufenden Timer. Auf Android lässt `android={{ accessibilityLiveRegion: "polite" }}` auf einer View TalkBack ihre Änderungen von selbst ankündigen.

<a id="text-size"></a>

## Textgröße

Text und Inputs folgen der Systemtextgröße (Dynamic Type auf iOS, Schriftgröße auf Android), sofern du das nicht abschaltest (`.allow_font_scaling(false)`, `allowFontScaling={false}`). Statt es abzuschalten, plane lieber dafür:

- Lass Text umbrechen: Vermeide feste Höhen bei Views, die Text enthalten.
- Begrenze sehr große Überschriften mit `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier`, statt die Skalierung zu deaktivieren.
- Wechsle die Layouts, wenn der Text groß ist: Lies `font_scale()` (Rust) oder `fontScale()` aus `nsh` (TSX) (stapele zum Beispiel ein Label und seinen Wert oberhalb von 1,3 vertikal).

Siehe [Gerät und Umgebung](./device-and-environment.md#text-size).

<a id="reduced-motion"></a>

## Reduzierte Bewegung

`reduce_motion()` (Rust) und `reduceMotion()` (TSX) sind `true`, wenn der Nutzer unter iOS „Bewegung reduzieren“ oder unter Android die Einstellung zum Entfernen von Animationen aktiviert hat. Deine Animationen laufen so, wie du sie schreibst. Nutze daher diesen Wert oder die Tailwind-Varianten `motion-reduce:` und `motion-safe:`, um große Bewegungen durch eine Überblendung oder einen sofortigen Wechsel zu ersetzen:

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*};

let toggle = move || {
    if !reduce_motion() {
        animate_layout(LayoutAnimation::SPRING);
    }
    expanded.update(|e| *e = !*e);
};

view()
    .on_press(toggle)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.95)))
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";
import { LayoutAnimation } from "nsh";

const toggle = () => {
  if (!reduceMotion()) LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  expanded.set(!expanded());
};

<View onPress={open} class="transition active:scale-95 motion-reduce:transition-none" />
<View class="motion-safe:animate-bounce" />
```

<a id="touch-targets"></a>

## Touch-Ziele

Mache pressable Elemente mindestens 44 × 44 Punkte groß. Wenn ein Control kleiner aussehen muss, vergrößere seine Berührungsfläche mit dem Hit Slop (`.hit_slop(..)`, `hitSlop`) statt mit seiner Größe; siehe [Touch und Gesten](./touch-and-gestures.md#hit-areas-hitslop).

<a id="checking-your-app"></a>

## Die App prüfen

- Aktiviere VoiceOver (iOS-Einstellungen, Bedienungshilfen, oder dreimal die Seitentaste drücken, falls eingerichtet) oder TalkBack und bediene die App, ohne hinzusehen: Jedes Control sollte sagen, was es ist und was es tut.
- In iOS-Simulatoren zeigt der Accessibility Inspector von Xcode Label, Traits und Wert jedes Elements.
- Probiere die größte Textgröße und den Dark Mode aus.
- Eine Test-ID (`.test_id(..)`, `testID`) gibt UI-Tests einen stabilen Anker, der sich nicht mit der Sprache des Labels ändert.

<a id="related"></a>

## Siehe auch

- [Accessibility-API von `nsh`](../modules/nsh.md#accessibility): die Referenz.
- [`View`](../elements/view.md): alle Accessibility-Props.
- [Animation](./animation.md#reduced-motion) und [Gerät und Umgebung](./device-and-environment.md).
