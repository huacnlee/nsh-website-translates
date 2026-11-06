---
title: "Tailwind"
description: "Tailwind-CSS-Klassen, die nativ in TSX aufgelöst werden, und ihre typisierten Entsprechungen in Rust – class und classList, Varianten für gedrückte Zustände, Dark Mode und Breakpoints, das Theme in nsh.json sowie die Klassenprüfung zur Build-Zeit."
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---


# Tailwind

NSHs Styles folgen Tailwind CSS 4. In Rust sind die Utilities von Tailwind typisierte Style-Methoden mit denselben Namen und Werten (`.p_4()` ist `p-4`, `.rounded_2xl()` ist `rounded-2xl`, `ZINC.shade(900)` ist `zinc-900`). In TSX akzeptiert jedes Element die Klassen selbst in `class`, nativ aufgelöst gegen das Standard-Theme von Tailwind 4. Jedes Beispiel unten zeigt zuerst die typisierten Methoden und danach die Klassen:

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

Typisierte Methoden werden in dieselben Style-Regeln übersetzt, zu denen auch die Klassen kompiliert werden, ohne dass ein String geparst werden muss. Bei Klassen wird kein CSS erzeugt und nichts läuft in JavaScript: Der String wird an den Core übergeben, der jeden verschiedenen Klassen-String einmal parst (und cacht), in Style-Regeln umwandelt und anwendet. Varianten, die vom Zustand abhängen (pressed, Dark Mode, Fensterbreite), wendet der Core erneut an, wenn sich dieser Zustand ändert. Pressed- und Focused-Zustand werden nativ verfolgt, sodass das `active:`-Feedback (`.active(..)` in Rust) keinen Round Trip zu deinem Code benötigt.

Klassen und die [`style`-Prop](./styling.md) erzeugen dieselben nativen Styles und lassen sich kombinieren. Diese Seite behandelt, was für Klassen und ihre typisierten Entsprechungen spezifisch ist. Die [Tailwind-Referenz](../modules/tailwind-reference.md) listet jedes unterstützte Utility auf.

## class and classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** ist ein String aus Klassen. Er kann dynamisch sein: ``class={`h-6 rounded bg-${color()}-500`}`` funktioniert, weil Klassen zur Laufzeit aufgelöst werden.
- **`classList`** ordnet Klassen Bedingungen zu: Eine Klasse gilt, solange ihr Wert truthy ist. Sie wird nach `class` angewendet.
- **In Rust** folgt eine Methode, der eine Closure oder ein Signal übergeben wird, diesem (`.bg(move || ..)`). `.style_when(condition, |s| ..)` wendet Styles an, solange eine Bedingung gilt, und `.when(condition, |v| ..)` entscheidet einmal, wenn das Element erzeugt wird.

So werden Konflikte aufgelöst:

1. **Spätere Klassen gewinnen** gegenüber früheren im selben String: `"p-2 p-4"` ist `p-4`. `tailwind-merge` ist nicht nötig: Eine Komponente kann das `class` anhängen, das ihr Aufrufer übergibt. Auch in Rust gewinnen spätere Methoden.
2. **Variantenklassen werden nach einfachen Klassen angewendet**, geordnet nach der Variantenreihenfolge von Tailwind (`hover:` vor `active:`, `max-*:` am weitesten zuerst, Breakpoints aufsteigend, `dark:` zuletzt), unabhängig von ihrer Position im String. Wie in Tailwind entscheidet die höchste Variante einer Klasse, dann ihre nächsthöhere, und eine Klasse mit einer Variante mehr kommt später: `dark:hover:bg-a dark:bg-b` ist `bg-a` bei Hover im Dark Mode, und `max-md:p-2 max-lg:p-4` ist `p-2` unterhalb von `md`. Wie in CSS gibt `odd:bg-a last:bg-b` einer ungeraden letzten Zeile `bg-a`, weil Tailwind `odd` nach `last` sortiert.
3. **`style` gewinnt gegenüber Klassen.** Ein Style-Schlüssel ist die CSS-Eigenschaft seines Namens, also dieselbe, die auch die Klassen setzen, und ersetzt deshalb nur diese Eigenschaft: `style={{ paddingLeft: 8 }}` ersetzt `pl-4` und behält `pr-4`.
4. `!` macht eine Klasse important: `!p-0`.

Rust-Komponenten (die von `nsh/base` und die aus dem eigenen Crate einer App) akzeptieren `class` und `classList` auch aus TSX. Deine Klassen werden nach den eigenen Styles der Komponente zusammengeführt und gewinnen bei gleichem Rang.

<a id="variants"></a>

## Varianten

| Variante | Gilt, wenn | Rust |
|---|---|---|
| `active:` | Die View gedrückt wird | `.active(\|s\| ..)` |
| `hover:` | Ein Zeiger über der View ist (Zeiger von iPad und Mac) | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | Ein Input den Fokus hat | `.focus(\|s\| ..)` |
| `focus-within:` | Die View oder ein Nachfahre den Fokus hat (der Inhalt eines `Overlay` ist ein Nachfahre der View, in der er sich befindet) | `.focus_within(..)` |
| `disabled:`, `enabled:` | Die `disabled`-Prop des Elements true / false ist | `.disabled_style(\|s\| ..)` |
| `selected:` | Das Element ausgewählt ist (`selected`, `accessibilityState.selected` eines `Button`) | `.selected_style(..)` |
| `checked:` | Das Element angehakt ist (`accessibilityState.checked` ist `true`; `"mixed"` ist nicht angehakt) | `.checked_style(..)` |
| `indeterminate:` | Das Element unbestimmt ist (`accessibilityState.checked` ist `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | Das Element aufgeklappt ist (`accessibilityState.expanded` ist `true`): der Trigger eines `Popover` oder `Menu`, solange sein Popup geöffnet ist | `.expanded_style(..)` |
| `aria-pressed:` | Das Element ein Toggle-Button ist, der eingeschaltet ist (`accessibilityState.pressed` ist `true`; `"mixed"` ist nicht pressed). Nicht `active:`, ein laufender Druck | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`, `checked` (`true`, nicht `"mixed"`) oder `selected` ist `true`, wie die `aria-*`-Varianten von Tailwind: nach den Pseudoklassen, in der Reihenfolge ihrer Namen | |
| `data-<name>:` | Das Element das `data-*`-Attribut `name` hat, wie die booleschen `data-*`-Varianten von Tailwind (`&[data-range-start]`): was ein Part einer Komponente über seine Zustände hinaus zeigt, etwa der Tag eines Kalenders am Anfang eines Bereichs (`data-range-start:`). Nach den `aria-*`-Varianten, in der Reihenfolge ihrer Namen | `Interactive::project_data(name, ..)` setzt eines auf einem Part einer Komponente |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | Der nächste Vorfahre mit der Klasse `group` in diesem Zustand ist oder dieses `data-*`-Attribut hat | `.group()` am Vorfahren; `.group_active(..)`, `.group_hover(..)`, `.group_focus_within(..)` innen |
| `group-active/name:` ... | Dasselbe für einen Vorfahren, der mit `group/name` markiert ist | `.group_named("name")`; `.group_active_named("name", ..)`, ... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | Die eigene Position des Elements unter seinen Geschwistern. Um das Label einer Zeile nach der Position der Zeile einzufärben, setze `last:text-*` auf die Zeile: Das Label erbt es | Einfaches Rust anhand des Index der Zeile (`at.is_first()`, `at.is_last()`, `at.index() % 2`) |
| `placeholder:` | Gestaltet den Platzhalter eines Inputs (`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | Färbt die Auswahlhervorhebung eines Inputs oder eines auswählbaren Texts sowie die der Inputs und Texte innerhalb des Elements (`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | Die Systemdarstellung dunkel ist | Ein `AdaptiveColor` oder `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | Das Fenster mindestens 640, 768, 1024, 1280, 1536 Punkte breit ist | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | Das Fenster schmaler als der Breakpoint ist | Dasselbe, mit `<` |
| `min-[600px]:`, `max-[600px]:` | Beliebige Breakpoints | Dasselbe |
| `portrait:`, `landscape:` | Die Ausrichtung des Fensters | `window().width > window().height` |
| `ios:`, `android:`, `web:` | Die Plattform | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | Die [Layoutrichtung](./layout.md#right-to-left) | `.direction(LayoutDirection::..)` auf einer View |
| `motion-safe:`, `motion-reduce:` | Die Einstellung „Bewegung reduzieren“ des Nutzers | `reduce_motion()` |

Varianten lassen sich kombinieren: `dark:active:bg-zinc-700`, `md:landscape:flex-row`. In Rust ist ein `AdaptiveColor` in einem `.active(..)`-Style `dark:active:`.

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

`disabled` auf einem beliebigen Element (`.disabled(..)` in Rust) wendet `disabled:`-Klassen an (`.disabled_style(..)`) und entfernt seine Press-Handler aus dem, was gemountet ist, sodass es auch kein Press-Feedback zeigt:

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

Breakpoints werden mit dem Fenster verglichen (der Fläche, in die NSH rendert), nicht mit dem Gerät: In einer iPad-Split-View oder einem in der Größe veränderbaren Fenster folgen sie der Fensterbreite, wie es `window()` tut.

<a id="what-differs-from-tailwind-on-the-web"></a>

## Was sich von Tailwind im Web unterscheidet

- **Einheiten sind Punkte.** `p-4` (`.p_4()`) sind 16 Punkte (1 Spacing-Schritt = 4 pt, 1rem = 16 pt). Beliebige Werte in `px` sind ebenfalls Punkte: `p-[13px]` (`.p(px(13.0))`) sind 13 pt.
- **`flex` ist eine Zeile**, wie in CSS: `class="flex"` ordnet seine Kinder in einer Zeile an, sofern keine Richtungsklasse etwas anderes vorgibt (an beliebiger Stelle im String: `flex-col flex` ist eine Spalte). Das `display: "flex"` eines Styles und `.flex()` in Rust sind auf dieselbe Weise Zeilen, und eine View, die kein display setzt, behält NSHs Standard-Spalte. `block` und `flow-root` verwenden Block-Layout, ebenso `inline` und `inline-block`, so wie ein Browser sie in einem Flex- oder Grid-Parent layoutet. In Rust legen `.flex_row()` und `.flex_col()` die Richtung fest.
- **Textklassen auf Views werden vererbt.** `text-*`, `font-*`, `leading-*`, `tracking-*` und die anderen Text-Utilities auf einer View (`.text_color(..)`, `.font_weight(..)`, ... in Rust) werden an die Text- und Input-Elemente darin weitergegeben, wie es die CSS-Vererbung tut: `<View class="text-white">` macht seine Labels weiß.
- **Jede View ist eine eigene Box.** `overflow-x-hidden` und `overflow-y-hidden` beschneiden beide Achsen, wie es `overflow-hidden` tut (Scrollen ist Sache des [scroll](../elements/scroll.md)-Elements). `invisible` blendet die View und alles darin aus. `mix-blend-*` vermischt eine View mit allem, was dahinter gezeichnet ist. `block`-Boxen halten ihre eigenen Margins und die ihrer Kinder getrennt. Eine `absolute`-View wird in ihrem nächsten positionierten Vorfahren platziert, wie in CSS. `fixed` layoutet eine View in ihrer Root-View (andere Elemente werden wie `absolute` platziert).
- **Text behält seine Leerraumzeichen.** Leerzeichen und Zeilenumbrüche in einem String werden so gezeichnet, wie sie geschrieben sind, und `whitespace-*` legt den Umbruch fest. Der JSX-Compiler reduziert den Leerraum von literalem JSX-Text, wie es JSX tut.
- **Transitions animieren Eigenschaftsgruppen**: `transition` animiert Farben, Opacity, Schatten und Transforms, `transition-all` zusätzlich Eckenradien und Rahmenbreiten. Filter, Backdrop-Filter, Verläufe und Layout übernehmen ihre neuen Werte sofort.
- **`focus-visible:` ist `focus:`**: Es gilt, sobald das Element den Fokus hat.
- **State-Hintergründe werden über Verläufen angezeigt.** In CSS bedeckt ein Verlauf `background-color`, sodass `active:bg-*` auf einer `bg-linear-*`-Fläche nie zu sehen wäre. In NSH ersetzt eine Hintergrundfarbe aus `active:`, `hover:`, `focus:` oder `group-*:` den Verlauf, solange dieser Zustand gilt (es sei denn, der Zustand setzt einen eigenen Verlauf, etwa `active:from-*`). Dasselbe gilt für `activeStyle` und die anderen State-Styles sowie für animierte Hintergrundfarben.
- **Text- und Touch-Einstellungen sind Style-Schlüssel**: `line-clamp-*` setzt `numberOfLines`, `text-ellipsis` und `text-clip` setzen `textOverflow`, `truncate` beides, `select-*` setzt `userSelect` und `pointer-events-*` setzt `pointerEvents`. Sie funktionieren daher in State-Varianten und unterliegen wie jede Klasse dem Inline-`style`. `caret-*`, `placeholder:text-*` und `selection:bg-*` setzen die Styles `caretColor`, `placeholderColor` und `selectionColor` auf dieselbe Weise. In Rust sind dies `Styled`-Methoden (`.number_of_lines(..)`, `.truncate()`, `.text_overflow(..)`, `.select_text()`, `.pointer_events(..)`, ...). `whitespace-nowrap` hält einen Text als Klasse in einer Zeile. `object-*` setzen die Styles `objectFit` und `objectPosition` von Bildern und Videos, die die Schlüssel eines Styles wie jeden anderen ersetzen.
- **Der unterstützte Umfang**: Utilities und Varianten von Tailwind 4, die eine native Bedeutung haben. `peer-*`-Varianten, Pseudo-Elemente (`before:`, `after:`) und beliebige Eigenschaften (`[mask-type:luminance]`) werden als unbekannte Klassen gemeldet, ebenso jedes Utility, für das NSH keine native Bedeutung hat. So bedeutet eine Klasse nie etwas anderes als im Browser. Rendering-Hinweise (`antialiased`, `will-change-transform`, `appearance-none`, `box-border`, ...) werden akzeptiert und ändern nichts.

Alles andere funktioniert wie in Tailwind 4 dokumentiert: die Farbpalette, Opacity-Modifier (`bg-black/40`), beliebige Werte (`bg-[#34c759]`, `w-[72px]`, `grid-cols-[1fr_2fr]`; bei `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` und den `m`-Utilities auch die Umgebungsvariablen, `pt-[env(safe-area-inset-top)]`, `pb-[calc(env(keyboard-inset-height)+49px)]`, siehe [Safe Area](../elements/safe-area.md) und [Tastatur](../elements/keyboard.md)), Brüche (`w-1/2`, `translate-x-1/2`), Schatten und Ringe, Verläufe (`bg-linear-to-r`, `bg-radial`, `bg-conic` mit `from-` / `via-` / `to-`), Filter, `backdrop-blur-*`, `mix-blend-*`, Transforms, `transition-*` und `duration-*`, `animate-spin` / `ping` / `pulse` / `bounce` und Grid, jeweils mit ihrer typisierten Methode in Rust. Die Plattformgrenzen von [Filtern und Blending](./styling.md#filters-and-blending) gelten auch für Klassen.

## Theme

Klassen werden gegen das Standard-Theme von Tailwind 4 aufgelöst. Erweitere es in `nsh.json` unter `"tailwind"`. Deine Einträge werden zu den Standardwerten hinzugefügt (oder ersetzen den Standardwert gleichen Namens):

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

Mit diesem Theme sind `bg-brand-500`, `text-brand` (der `DEFAULT`-Farbton), `border-ink`, `rounded-card`, `font-display` und `tablet:flex-row` gültige Klassen.

| Schlüssel | Werte | Erzeugt |
|---|---|---|
| `colors` | Eine CSS-Farbe oder ein Objekt aus Farbtönen (`"DEFAULT"` für den bloßen Namen) | `bg-*`, `text-*`, `border-*`, `from-*`, `ring-*`, ... |
| `spacing` | Punkte pro Spacing-Schritt (Standard 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | Punkte pro `rem` in beliebigen Werten (Standard 16) | |
| `breakpoints` | Punkte | `name:`-Varianten |
| `container` | Punkte | `max-w-*`-Größen |
| `fontSize` | Punkte oder `[size, lineHeight]`, wobei die Zeilenhöhe ein Vielfaches der Größe ist | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | Ein Familienname (eine Systemfamilie oder der Name einer [importierten Schrift](./fonts.md)) | `font-*` |
| `tracking` | Ems | `tracking-*` |
| `leading` | Vielfache der Schriftgröße | `leading-*` |
| `radius` | Punkte | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | Ein CSS-`box-shadow` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | Punkte | `blur-*`, `backdrop-blur-*` |
| `perspective` | Punkte | `perspective-*` |
| `aspect` | Ein Verhältnis (`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

Unbekannte Schlüssel und ungültige Werte sind Build-Fehler (`nsh.json: tailwind: unknown theme key 'colours'`). Das Theme wird in das Bundle kompiliert und vor dem ersten Frame angewendet.

Das Tailwind-Theme prägt deine Klassen. Typisierte Methoden behalten die Standardskalen von Tailwind, sodass eine Rust-Komponente in jeder App gleich aussieht, und übernehmen den Look der App aus den Design-Tokens ihres Themes, `"theme"` in `nsh.json` ([Rust](./rust.md#theme)).
## Theme-Tokens

Das Theme der App (`"theme"` in `nsh.json`) enthält ihre Design-Tokens: die Farben von shadcn/ui (`background`, `foreground`, `primary`, `muted-foreground`, `border`, `ring`, `chart-1`, `sidebar`, ...), ihr `radius`, ihre Schriften `font-sans` und `font-mono` sowie jedes Token, das die App hinzufügt. Klassen benennen sie als Tailwind-Namen der Variablen eines CSS-`@theme`, Rust-Komponenten lesen sie mit `theme()` aus `nsh_base`, und TSX liest sie mit `token()` aus `nsh`, sodass ein TSX-Screen und die Rust-Komponenten demselben Theme folgen:

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

Der Name eines Tokens entspricht dem Namen seiner CSS-Variable ohne `--`, so wie ihn die Theme-Datei schreibt: `muted-foreground`, `radius`, `chart-1`. In Rust sind die Tokens von shadcn Methoden von `theme()` (`primary()`, `muted_foreground()`, `radius()`, `font_mono()`), und jedes Token ist `theme().color("up")`, `theme().number("radius-card")` oder `theme().font("font-display")`.

| Form | Nimmt | Beispiel |
|---|---|---|
| Ein Farbname in einer beliebigen Farb-Utility | Eine Theme-Farbe, auch mit Deckkraft | `bg-primary`, `text-muted-foreground/70`, `bg-up/30`, `border-t-border`, `ring-ring`, `from-accent`, `placeholder:text-muted-foreground` |
| `(--name)`, die Variablen-Kurzschreibweise von Tailwind 4 | Eine Theme-Farbe oder eine Zahl | `bg-(--primary)`, `rounded-(--radius)`, `p-(--gap-card)` |
| `(color:--name)`, `(length:--name)`, `(number:--name)`, `(family-name:--name)` | Dasselbe, mit Typangabe, wo eine Utility mehrere Arten akzeptiert | `text-(color:--up)`, `text-(length:--text-title)`, `font-(family-name:--font-mono)` |
| `font-sans`, `font-mono` | Die Schriften des Themes, sofern es sie setzt | `font-mono` |

- **Eigene Tokens.** Jeder Name in der Theme-Datei ist ein Token, so wie jede Variable eines CSS-`@theme`: `"up": "#16a34a"` erzeugt `bg-up`, `text-up` und `bg-up/30`; `"radius-card": "14px"` erzeugt `rounded-(--radius-card)`; `"font-display": "Pacifico"` erzeugt `font-(family-name:--font-display)`. Längen sind in Punkten angegeben; `(number:--name)` übergibt die reine Zahl.
- **Schriften.** `font-sans` ist die Schrift der App: Jeder Text, der keine eigene Schriftfamilie setzt, wird damit gezeichnet, so wie eine Seite mit Tailwinds `--font-sans`. `font-mono` ist die Schrift von `font-mono` und von Code in `TextView`. Sind sie nicht gesetzt, sind beide die Systemschriften.
- **Beide Darstellungen.** Ein Token hat den hellen und den dunklen Wert des Themes: `bg-primary`, `theme().primary` und `token("primary")` wechseln von selbst mit der Darstellung, ohne `dark:`-Klasse. Eine Farbe, die das Theme nur in einer Darstellung setzt, wird in beiden verwendet.
- **Deine Tailwind-Farben haben Vorrang.** Ein Name in `"tailwind"` `colors` oder in der Tailwind-Palette ist diese Farbe, sodass `bg-primary` nur dann ein Theme-Token ist, wenn das Tailwind-Theme keine Farbe `primary` hat.
- **Das Theme kann sich ändern, während die App läuft.** Wenn eine in eine native App eingebettete App das Theme dieser App erhält und jedes Mal, wenn sich das Theme ändert, werden die Klassen, die Tokens benennen, die Rust-Bindings, die `theme()` lesen, und der TSX-Code, der `token()` liest, aktualisiert, die Klassen und Bindings nativ. Tokens, die das Theme der einbettenden App nicht hat, behalten die Werte des eigenen `"theme"` der App (danach die des Standard-Themes). Ein Host, der nur seine Marke ergänzt, liefert Theme-Overrides, also die Tokens, die seine Marke ändert, im selben Dateiformat ([iOS](./ios.md#theme-overrides), [Android](./android.md#theme-overrides), `AppView::set_theme_overrides` auf den Desktop-Plattformen).
- **Geprüft wie andere Klassen.** Ein Name, der kein Token des Standard-Themes oder des `"theme"` der App ist, ist beim Build eine unbekannte Klasse (`unknown class 'bg-chart-up'`). Um ein Token zu verwenden, das nur die einbettende App bereitstellt, gib ihm zusätzlich einen Wert im `"theme"` der App: Dieser Wert wird angezeigt, wenn die App eigenständig läuft.

Klassen, die Tokens benennen, werden wie alle anderen Klassen einmal pro Theme aufgelöst: Sie zu zeichnen kostet so viel wie eine Palettenfarbe.

### `token()` in TSX

`token(name)` aus `nsh` ist der Wert eines Tokens in der aktuell angezeigten Darstellung: eine Farbe als `#rrggbbaa`, eine Länge als Anzahl von Punkten, eine Schrift als ihr Familienname. Der Wert ist reaktiv: Code, der ihn in einer Komponente, einem Memo oder einem Effect liest, läuft erneut, wenn sich das Theme oder die Darstellung ändert. Das eignet sich für Werte, die dorthin gehen, wo keine Klasse hinpasst, etwa für ein Canvas oder ein Diagramm:

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

Die Namen sind typisiert: NSH schreibt die Tokens der App aus ihrem Theme in `.nsh/types/nsh/tokens.d.ts`, sodass `token("up")` ein `string` ist, sobald `"up"` im Theme steht, und ein Name, den das Theme nicht hat, ein Typfehler ist.

<a id="the-class-check"></a>

## Die Klassenprüfung

`nsh build`, `nsh dev`, `nsh run` und `nsh test` prüfen die statischen Klassennamen in deinem JSX (String-Literale in `class` und die Schlüssel von `classList`) mit demselben Parser und demselben Theme wie die Laufzeit und warnen vor Klassen, die nicht existieren:

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

Warnungen lassen den Build nicht fehlschlagen. Klassen, die zur Laufzeit zusammengesetzt werden (``bg-${color()}-500``), werden geprüft, wenn die Laufzeit sie zum ersten Mal sieht; sie protokolliert jede unbekannte Klasse einmal (`unknown classes: ...`). Typisierte Methoden werden vom Rust-Compiler geprüft.

<a id="classes-or-styles"></a>

## Klassen oder Styles?

Beide werden nativ aufgelöst und kosten etwa gleich viel. Klassen sind kürzer und bieten Varianten (gedrückte Zustände, Dark Mode, Breakpoints) ohne Code. Inline-Styles nehmen in JavaScript berechnete Werte und akzeptieren [native animierte Werte](./animation.md) (`opacity: fade`, `translate: [x, 0]`). Die meisten TSX-Apps verwenden Klassen für das statische Aussehen und `style` für alles Berechnete oder Animierte. Rust-Komponenten verwenden für beides typisierte Methoden und binden animierte Werte mit `.bind_opacity(..)`, `.bind_translate_x(..)` und den anderen Bindings.

<a id="related"></a>

## Siehe auch

- [Styling](./styling.md): die Style-Prop, die typisierten Methoden und die plattformspezifischen Grenzen von Effekten.
- [Tailwind-Referenz](../modules/tailwind-reference.md): jede Utility und jede Variante.
- [Layout](./layout.md): Flexbox und Grid, auch als Klassen verfügbar.
