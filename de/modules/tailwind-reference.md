---
title: "Tailwind-Referenz"
description: "Alle Tailwind-Utilities und -Varianten, die NSH nativ auflöst, die Syntax für beliebige Werte und die Erweiterung des Themes in nsh.json."
order: 17
source_hash: 11bee6a70fb79c0f
---


# Tailwind-Referenz

Jedes Element nimmt Tailwind-CSS-Klassen in seiner `class`-Prop entgegen (und bedingte in `classList`). NSH löst sie in Rust gegen das Standard-Theme von Tailwind 4 auf: JS übergibt nur den String, jeder eindeutige String wird einmal geparst und gecacht, und Varianten wie `dark:` oder `active:` werden nativ neu ausgewertet, wenn sich Darstellung, Fenstergröße oder Press-Zustand ändern, ohne dass JS ausgeführt wird.

Jedes Utility setzt genau das, was Tailwind CSS 4 dafür erzeugt, mit derselben Bedeutung wie im Browser. Diese Seite listet auf, was unterstützt wird. Eine Einführung findest du unter [Tailwind](../docs/tailwind.md); die Style-Keys, die die Utilities setzen, stehen in der [Style-Referenz](./style-reference.md).

Rust-Komponenten nehmen keine Klassen-Strings entgegen: Sie stylen Elemente mit den typisierten Methoden von `Styled` (`nsh_core::prelude`), die nach diesen Utilities benannt sind und zu denselben Werten aufgelöst werden, einschließlich der Standard-Skalen von Tailwind (`px-4` ist `.px_4()`, `rounded-2xl` `.rounded_2xl()`, `shadow-md` `.shadow_md()`, `bg-linear-to-br` `.bg_linear_to_br()`). Farben sind Werte: Theme-Farben oder Tailwinds Palette als `nsh_core::element::palette` (`ZINC.shade(800)` ist `zinc-800`). Varianten sind Methoden, die eine Closure mit Styles entgegennehmen: `.active(|s| …)`, `.hover(…)`, `.focus(…)`, `.disabled_style(…)`, `.dark(…)`, `.group_active(…)` und `.style_when(condition, …)` für alle übrigen. Die [Style-Referenz](./style-reference.md) nennt die Methode jedes Style-Keys.

```rust tabs
use nsh_core::{element::palette::{RED, ZINC}, prelude::*};

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(white())
    .p_4()
    .shadow_md()
    .active(|s| s.scale(0.98))
    .transition()
    .dark(|s| s.bg(ZINC.shade(800)))
    .child(
        text("Inbox")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(ZINC.shade(900))
            .dark(|s| s.text_color(white())),
    )
    .child(
        text(move || unread.get().to_string())
            .text_color(move || if unread.get() > 0 { RED.shade(500) } else { ZINC.shade(400) }),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-md active:scale-[0.98] transition dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Inbox</Text>
  <Text classList={{ "text-red-500": unread() > 0, "text-zinc-400": unread() === 0 }}>{unread()}</Text>
</View>
```

<a id="how-classes-combine"></a>

## Wie Klassen kombiniert werden

- **Das Spätere gewinnt.** Unter Utilities derselben Variantenebene gewinnt das weiter hinten im String: `"p-4 p-2"` ist `p-2`. Eine Komponente kann eine `class`-Prop entgegennehmen und an ihre eigenen Klassen anhängen, ohne `tailwind-merge`.
- **Varianten gelten nach einfachen Utilities**, in der Variantenreihenfolge von Tailwind: `group-*:` (nach ihrem Zustand, dann nach Gruppenname), `selection:`, `placeholder:`, Position (`first:` ...), `checked:`, `indeterminate:`, `selected:`, `focus-within:`, `hover:`, `focus:`, `focus-visible:`, `active:`, `enabled:`, `disabled:`, `aria-busy:`, `aria-checked:`, `aria-expanded:`, `aria-pressed:`, `aria-selected:`, `data-*:` (nach Name), Bewegung, `max-*:`-Breakpoints, breiteste zuerst, dann Breakpoints aufsteigend, Ausrichtung, Richtung, `dark:`, dann Plattform. Die höchste Variante einer Klasse entscheidet, dann die nächsthöhere, und eine zusätzliche Variante kommt später (`dark:hover:` nach `dark:`), so wie Tailwind sie sortiert. So ist `"active:bg-red-500 bg-blue-500"` rot, solange gedrückt wird.
- **`style` gewinnt gegen Klassen.** Das Inline-`style` wird auf die aufgelösten Klassen angewendet. Ein Style-Key ist die CSS-Eigenschaft seines Namens, also dieselbe, die die Utilities setzen, daher ersetzt er genau diese Eigenschaft und nichts sonst: `style={{ paddingLeft: 8 }}` schlägt `pl-4` und behält `pr-4`. Ein Important-Utility (`!p-4` oder `p-4!`) gewinnt auch gegen den Inline-Style.
- **Text-Styles werden vererbt.** Text-Utilities auf einer View (`text-white`, `font-bold`, `text-center`, ...) werden wie in CSS an die `<Text>`- und `<Input>`-Elemente darin weitergegeben.
- **Display folgt CSS.** `flex` und `inline-flex` ergeben eine Zeile, sofern kein Richtungs-Utility etwas anderes vorgibt, egal wo es im String steht (`flex-col flex` ist eine Spalte). Das `display: "flex"` eines Styles ist auf dieselbe Weise eine Zeile; Views ohne Display behalten NSHs Spalten-Standard.

<a id="units-and-the-theme"></a>

## Einheiten und das Theme

Längen sind Punkte (`1` = ein Punkt unter iOS, ein dp unter Android). Tailwinds `1rem` entspricht 16 Punkten, sodass das Theme bei gleicher Dichte dem Web entspricht: Ein Abstandsschritt sind 4 Punkte (`p-4` = 16 Punkte), `text-base` sind 16 Punkte.

<a id="spacing-values"></a>

### Abstandswerte

Utilities, die einen Abstandswert nehmen (Padding, Margin, Gap, Inset, Breite, Höhe, `basis`, `translate`, `leading`), akzeptieren:

| Wert | Beispiel | Ergebnis |
|---|---|---|
| Schritte (Viertelschritte erlaubt) | `p-4`, `gap-1.5`, `m-0.25` | Schritt × 4 Punkte |
| `px` | `p-px`, `-mt-px` | 1 Punkt |
| `0` | `m-0` | 0 |
| Bruch (Inset, Breite, Höhe, `basis`, `translate`) | `w-1/2`, `left-1/3` | Prozentwert des Elternelements |
| `full` (dasselbe) | `w-full`, `inset-full` | 100 % |
| `auto` (Margin, Inset, Breite, Höhe, Basis) | `mx-auto`, `w-auto` | `"auto"` |
| Beliebig | `p-[13px]`, `w-[42%]`, `mt-[1.5rem]` | die angegebene Länge |

Margins, Insets, `translate`, `rotate`, `skew`, `scale`, `z`, `hue-rotate`, `tracking`, `underline-offset`, `outline-offset`, Grid-Linien und Verlaufswinkel nehmen für negative Werte ein vorangestelltes `-`: `-mt-2`, `-translate-x-1/2`, `-rotate-6`. Tailwind kennt für die übrigen keine negative Form (`-p-4`, `-gap-2`, `-w-4`), und NSH ebenso wenig.

<a id="colors"></a>

### Farben

Die vollständige Tailwind-4-Palette ist eingebaut: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`, `gray`, `zinc`, `neutral`, `stone`, `mauve`, `olive`, `mist`, `taupe`, jeweils in den Abstufungen `50`, `100`–`900`, `950`; dazu `black`, `white` und `transparent`. Eigene Farben kommen aus `nsh.json` (siehe [Theme-Anpassung](#theme-customization)).

Jedes Farb-Utility akzeptiert:

| Form | Beispiel |
|---|---|
| Eine Theme-Farbe | `bg-sky-500`, `text-brand` |
| Ein Deckkraft-Modifikator (Prozent) | `bg-black/50`, `ring-black/5` |
| Eine beliebige Deckkraft | `text-black/[0.35]` |
| Eine beliebige Farbe | `bg-[#0ea5e9]`, `border-[rgb(0_0_0_/_0.1)]`, `text-[oklch(70%_0.2_50)]` |
| Eine beliebige Farbe mit Modifikator | `bg-[rgb(0_0_255)]/25` |

`currentColor` und `inherit` sind keine Farbwerte. Wie im Browser wird ein Rahmen, eine Outline oder ein Ring ohne Farbklasse in der Textfarbe des Elements gezeichnet, in seiner eigenen oder der geerbten (`<View class="text-white"><View class="border ring-2" /></View>` zeichnet beides weiß), und ebenso ein Rahmen, dessen Breite die `style`-Prop ohne Farbe setzt.

<a id="arbitrary-values"></a>

## Beliebige Werte

Eckige Klammern übergeben einen Wert, den das Theme nicht hat: `w-[37px]`, `grid-cols-[200px_1fr]`, `bg-[linear-gradient(45deg,red,blue)]`.

- `_` steht für ein Leerzeichen (`grid-cols-[1fr_2fr]`); schreibe `\_` für einen echten Unterstrich.
- Längen: eine nackte Zahl oder `px` (Punkte), `pt` (4/3 Punkt, wie in CSS), `rem` (16 Punkte) und `%`, wo Prozentwerte sinnvoll sind.
- Winkel (`rotate-[...]`, `hue-rotate-[...]`, `bg-linear-[...]`): `deg`, `rad`, `grad`, `turn`.
- Zeiten (`duration-[...]`, `delay-[...]`): `ms` oder `s`; eine nackte Zahl sind Millisekunden.
- Typ-Hinweise lösen mehrdeutige Werte auf: `text-[length:22px]` ist eine Größe, `text-[color:#333]` eine Farbe; `border-[length:3px]` entsprechend.

Beliebige CSS-Eigenschaften (`[mask-type:luminance]`) werden nicht unterstützt.

## Layout

| Klasse | Setzt |
|---|---|
| `flex`, `inline-flex` | `display: "flex"` und eine Zeile, sofern kein Richtungs-Utility vorhanden ist |
| `grid`, `inline-grid` | `display: "grid"` |
| `block`, `flow-root` | Block-Layout oder ein unabhängiger Block-Formatierungskontext |
| `box-border`, `box-content` | Abmessungen schließen Rahmen und Padding ein, oder nur den Inhalt |
| `w/h/size-min`, `w/h/size-max`, `w/h/size-fit` | intrinsische Größen von Taffy: `min-content`, `max-content`, `fit-content` |
| `inline`, `inline-block` | `display: "block"`: was ein Browser dafür in einem Flex- oder Grid-Elternelement berechnet |
| `hidden` | `display: "none"` |
| `relative`, `absolute` | `position` |
| `static` | `position: "static"`: im Fluss, seine Insets werden ignoriert; absolut positionierte Nachfahren nutzen ihren nächsten positionierten Vorfahren |
| `sticky` | `position: "sticky"`: im Fluss, haftet es `top` (`left` in einer horizontalen Scroll-View) innerhalb der umgebenden Scroll-View, solange sein Elternelement sichtbar ist |
| `fixed` | `position: "fixed"`: ein Element, das in der Box seiner Root-View (dem Fenster oder seinem Modal) über den Kindern dieser Root-View angeordnet wird und an Ort und Stelle bleibt, während die Umgebung scrollt |
| `inset-<n>`, `inset-x-<n>`, `inset-y-<n>` | `top` / `right` / `bottom` / `left` |
| `top-<n>`, `right-<n>`, `bottom-<n>`, `left-<n>` | der passende Offset |
| `start-<n>`, `end-<n>` | `start` / `end` (richtungsabhängig) |
| `z-<n>`, `z-auto`, `z-[<n>]` | `zIndex` (`z-auto` ist 0) |
| `visible` | `visibility: "visible"` |
| `invisible`, `collapse` | `visibility: "hidden"` (behält seinen Platz) |
| `overflow-hidden`, `overflow-clip`, `overflow-x-hidden`, `overflow-y-hidden` | `overflow: "hidden"` |
| `overflow-visible` | `overflow: "visible"` |
| `aspect-square`, `aspect-video`, `aspect-<a>/<b>`, `aspect-[<a>/<b>]`, `aspect-auto` | `aspectRatio` (1, 16/9, a/b, keines) |

Scrollen ist ein Element, keine Klasse: `overflow-auto` und `overflow-scroll` werden nicht unterstützt; verwende [scroll](../elements/scroll.md).

<a id="flexbox-and-grid"></a>

## Flexbox und Grid

| Klasse | Setzt |
|---|---|
| `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse` | `flexDirection` |
| `flex-wrap`, `flex-wrap-reverse`, `flex-nowrap` | `flexWrap` |
| `flex-1` | Grow 1, Shrink 1, Basis 0 |
| `flex-<n>` | Grow n, Shrink 1, Basis 0 |
| `flex-auto` | Grow 1, Shrink 1, Basis auto |
| `flex-initial` | Grow 0, Shrink 1, Basis auto |
| `flex-none` | Grow 0, Shrink 0, Basis auto |
| `flex-[<grow>]`, `flex-[<grow>_<shrink>_<basis>]` | die CSS-Kurzschreibweise: `flex-[2]`, `flex-[3_0_50%]` |
| `grow`, `grow-<n>`, `grow-[<n>]` | `flexGrow` (ohne Wert: 1) |
| `shrink`, `shrink-<n>`, `shrink-[<n>]` | `flexShrink` (ohne Wert: 1) |
| `basis-<n>` | `flexBasis` (Abstand, Bruch, `full`, `auto`, beliebig) |
| `justify-start`, `justify-end`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`, `justify-stretch`, `justify-normal` | `justifyContent` |
| `items-start`, `items-end`, `items-center`, `items-baseline`, `items-stretch` | `alignItems` |
| `self-auto`, `self-start`, `self-end`, `self-center`, `self-stretch`, `self-baseline` | `alignSelf` |
| `content-start`, `content-end`, `content-center`, `content-between`, `content-around`, `content-evenly`, `content-stretch`, `content-normal` | `alignContent` |
| `justify-items-start`, `-end`, `-center`, `-stretch`, `-normal` | `justifyItems` |
| `justify-self-auto`, `-start`, `-end`, `-center`, `-stretch` | `justifySelf` |
| `place-content-center`, `-start`, `-end`, `-between`, `-stretch` | `alignContent` und `justifyContent` |
| `place-items-center`, `-start`, `-end`, `-stretch` | `alignItems` und `justifyItems` |
| `place-self-auto`, `-center`, `-start`, `-end`, `-stretch` | `alignSelf` und `justifySelf` |
| `gap-<n>`, `gap-x-<n>`, `gap-y-<n>` | `gap`, `columnGap`, `rowGap` |
| `space-x-<n>`, `space-y-<n>` (und negativ) | ein Margin an jedem Kind außer dem letzten: der End-Margin (`space-x`) oder der untere (`space-y`), unter den eigenen Margins des Kindes, wie in Tailwind CSS; er wird zu einem `gap` addiert |
| `space-x-reverse`, `space-y-reverse` | stattdessen der Margin auf der Start- bzw. oberen Seite (Kinder in umgekehrter Reihenfolge) |
| `grid-cols-<n>` | `gridTemplateColumns: "repeat(n, minmax(0, 1fr))"` |
| `grid-cols-[<tracks>]`, `grid-cols-none` | `gridTemplateColumns` (`grid-cols-[200px_1fr]`) |
| `grid-rows-<n>`, `grid-rows-[<tracks>]`, `grid-rows-none` | `gridTemplateRows` |
| `col-span-<n>`, `col-span-full`, `col-auto`, `col-<n>`, `col-[<value>]` | `gridColumn` |
| `col-start-<n>`, `col-end-<n>` (und `-auto`) | `gridColumnStart`, `gridColumnEnd` |
| `row-span-<n>`, `row-span-full`, `row-auto`, `row-<n>`, `row-[<value>]` | `gridRow` |
| `row-start-<n>`, `row-end-<n>` (und `-auto`) | `gridRowStart`, `gridRowEnd` |
| `grid-flow-row`, `grid-flow-col`, `grid-flow-dense`, `grid-flow-row-dense`, `grid-flow-col-dense` | `gridAutoFlow` |
| `auto-cols-auto`, `-min`, `-max`, `-fr`, `auto-cols-[<track>]` | `gridAutoColumns` |
| `auto-rows-auto`, `-min`, `-max`, `-fr`, `auto-rows-[<track>]` | `gridAutoRows` |

<a id="spacing"></a>

## Abstände

| Klasse | Setzt |
|---|---|
| `p-<n>`, `px-<n>`, `py-<n>` | `padding`, `paddingHorizontal`, `paddingVertical` |
| `pt-<n>`, `pr-<n>`, `pb-<n>`, `pl-<n>` | `paddingTop` / `Right` / `Bottom` / `Left` |
| `ps-<n>`, `pe-<n>` | `paddingStart`, `paddingEnd` (richtungsabhängig) |
| `m-<n>`, `mx-<n>`, `my-<n>` | `margin`, `marginHorizontal`, `marginVertical` |
| `mt-<n>`, `mr-<n>`, `mb-<n>`, `ml-<n>` | `marginTop` / `Right` / `Bottom` / `Left` |
| `ms-<n>`, `me-<n>` | `marginStart`, `marginEnd` (richtungsabhängig) |

<a id="sizing"></a>

## Größen

| Klasse | Setzt |
|---|---|
| `w-<n>`, `h-<n>` | `width`, `height` (Abstand, Bruch, `full`, `auto`, beliebig) |
| `size-<n>` | `width` und `height` |
| `min-w-<n>`, `max-w-<n>`, `min-h-<n>`, `max-h-<n>` | die passende Grenze |
| `w-screen`, `w-dvw`, `w-svw`, `w-lvw` | die Fensterbreite (auch bei `min-w-` / `max-w-`) |
| `h-screen`, `h-dvh`, `h-svh`, `h-lvh` | die Fensterhöhe (auch bei `min-h-` / `max-h-`) |
| `w-auto`, `h-auto` | `auto` (nach Inhalt dimensioniert) |
| `max-w-none`, `max-h-none` | keine Begrenzung |
| `w-<container>`, `min-w-<container>`, `max-w-<container>` | eine Container-Breite (siehe unten) |

Container-Breiten (Punkte): `3xs` 256, `2xs` 288, `xs` 320, `sm` 384, `md` 448, `lg` 512, `xl` 576, `2xl` 672, `3xl` 768, `4xl` 896, `5xl` 1024, `6xl` 1152, `7xl` 1280; `prose` ist das 65-Fache der Breite von `0` in der Schrift des Elements (CSS-`65ch`), wie in Tailwind CSS.

<a id="typography"></a>

## Typografie

<a id="font"></a>

### Schrift

| Klasse | Setzt |
|---|---|
| `font-sans` | die Systemschrift |
| `font-serif`, `font-mono` | `fontFamily: "serif"` / `"monospace"` |
| `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800), `font-black` (900) | `fontWeight` |
| `font-[<weight>]`, `font-[<family>]` | ein numerisches Gewicht, sonst eine Familie: `font-[650]`, `font-[Inter]` |
| `italic`, `not-italic` | `fontStyle` |
| `normal-nums`, `small-caps`, `oldstyle-nums`, `lining-nums`, `tabular-nums`, `proportional-nums` | `fontVariant` (sie lassen sich kombinieren; `normal-nums` setzt die Zahlenformen zurück) |

<a id="size-color-and-line-height"></a>

### Größe, Farbe und Zeilenhöhe

`text-<size>` setzt die Schriftgröße und die dazu passende Zeilenhöhe von Tailwind, die eine `leading-*`-Klasse ersetzt, egal wo sie im String steht und welche Variante sie hat (`leading-tight md:text-lg` behält den engen Zeilenabstand):

| Klasse | Größe | Zeilenhöhe |
|---|---|---|
| `text-xs` | 12 | 16 |
| `text-sm` | 14 | 20 |
| `text-base` | 16 | 24 |
| `text-lg` | 18 | 28 |
| `text-xl` | 20 | 28 |
| `text-2xl` | 24 | 32 |
| `text-3xl` | 30 | 36 |
| `text-4xl` | 36 | 40 |
| `text-5xl` | 48 | 1× |
| `text-6xl` | 60 | 1× |
| `text-7xl` | 72 | 1× |
| `text-8xl` | 96 | 1× |
| `text-9xl` | 128 | 1× |

| Klasse | Setzt |
|---|---|
| `text-<size>/<leading>` | Größe und Zeilenhöhe: `text-sm/6` (24 Punkte), `text-lg/tight` |
| `text-[<length>]` | `fontSize`: `text-[22px]`, `text-[length:22px]` |
| `text-<color>` | `color` |
| `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625), `leading-loose` (2) | `lineHeight` als Vielfaches der Schriftgröße |
| `leading-<n>`, `leading-[<length>]` | `lineHeight` in Punkten (`leading-6` = 24) |
| `leading-[<number>]` | `lineHeight` als Vielfaches der Schriftgröße (`leading-[1.5]`), wird als dieser Multiplikator vererbt; `em` und `%` berechnen vor der Vererbung eine Länge bei der Schriftgröße des Elements |
| `tracking-tighter` (-0.05em), `tracking-tight` (-0.025em), `tracking-normal` (0), `tracking-wide` (0.025em), `tracking-wider` (0.05em), `tracking-widest` (0.1em) | `letterSpacing` relativ zur Schriftgröße |
| `tracking-[<value>]` | `letterSpacing`: `tracking-[0.2em]`, `tracking-[1px]` |

<a id="alignment-case-and-wrapping"></a>

### Ausrichtung, Schreibweise und Umbruch

| Klasse | Setzt |
|---|---|
| `text-left`, `text-center`, `text-right`, `text-justify` | `textAlign` |
| `text-start`, `text-end` | `textAlign: "start"` / `"end"`: Anfang bzw. Ende der Zeile in Layout-Richtung |
| `align-baseline`, `align-text-top`, `align-text-bottom`, `align-middle` | `verticalAlign` (Views und Bilder innerhalb eines Textes) |
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `textTransform` |
| `truncate` | eine Zeile, Auslassungspunkte am Ende, kein Umbruch, `overflow: hidden` (bei einer View: ihre Texte brechen nicht um) |
| `line-clamp-<n>`, `line-clamp-none` | `numberOfLines` (`none` zeigt jede Zeile) |
| `text-ellipsis`, `text-clip` | `textOverflow: "ellipsis"` / `"clip"` |
| `whitespace-nowrap`, `text-nowrap` | Zeilen brechen nie um; bei einer View die Zeilen der darin enthaltenen Texte (vererbt, wie CSS-`white-space`) |
| `whitespace-normal`, `text-wrap`, `text-balance`, `text-pretty` | Zeilen brechen um (ein Ausgleichen findet nicht statt) |
| `select-text`, `select-none` | `userSelect: "text"` / `"none"`; bei einer View für die darin enthaltenen Texte, die keinen setzen |
| `select-auto` | `userSelect: "auto"`: die umgebende View entscheidet, wie bei CSS-`user-select: auto` (`select-none md:select-auto`) |
<a id="decoration-and-shadow"></a>

### Dekoration und Schatten

| Klasse | Setzt |
|---|---|
| `underline`, `line-through`, `no-underline` | `textDecorationLine` |
| `decoration-solid`, `decoration-double`, `decoration-dotted`, `decoration-dashed`, `decoration-wavy` | `textDecorationStyle` |
| `decoration-<n>`, `decoration-[<length>]` | `textDecorationThickness` |
| `decoration-auto`, `decoration-from-font` | `textDecorationThickness: "auto"` |
| `decoration-<color>` | `textDecorationColor` |
| `underline-offset-<n>`, `underline-offset-[<length>]`, `underline-offset-auto` | `textUnderlineOffset` |
| `text-shadow-2xs`, `-xs`, `-sm`, `-md`, `-lg`; `/<alpha>` | einen Textschatten aus dem Theme (eine Ebene: die breiteste der Ebenen des Themes); der Modifikator ist das Alpha der Ebenen: `text-shadow-md/20` |
| `text-shadow-<color>`, `text-shadow-current` | seine Farbe, mit dem Alpha der Größe |
| `text-shadow-none` | entfernt ihn |

Die Textschatten von Tailwind haben mehrere Ebenen; nativ wird ein Schatten gezeichnet, nämlich die breiteste Ebene.

<a id="inputs"></a>

### Eingaben

| Klasse | Setzt |
|---|---|
| `placeholder:text-<color>` | `placeholderColor` |
| `selection:bg-<color>` | `selectionColor` (die Hervorhebung der Auswahl in einer Eingabe oder einem auswählbaren Text sowie in denen innerhalb des Elements) |
| `caret-<color>` | die Cursorfarbe |

<a id="backgrounds"></a>

## Hintergründe

| Klasse | Setzt |
|---|---|
| `bg-<color>` | `backgroundColor` |
| `bg-[<gradient>]` | `backgroundImage`: `bg-[linear-gradient(45deg,red,blue)]`, `bg-[radial-gradient(...)]` |
| `bg-linear-to-t`, `-tr`, `-r`, `-br`, `-b`, `-bl`, `-l`, `-tl` | einen linearen Verlauf zu einer Seite oder Ecke (`bg-gradient-to-*` ist der Name in v3) |
| `bg-linear-<angle>`, `bg-linear-[<angle>]` | einen linearen Verlauf in einem Winkel: `bg-linear-45`, `-bg-linear-12`, `bg-linear-[0.25turn]` |
| `bg-radial` | einen radialen Verlauf vom Mittelpunkt aus |
| `bg-conic`, `bg-conic-<angle>` | einen konischen Verlauf, optional mit einem Startwinkel |
| `from-<color>`, `via-<color>`, `to-<color>` | die Stopps des Verlaufs (standardmäßig an den Enden transparent) |
| `from-<p>%`, `via-<p>%`, `to-<p>%` | Stopp-Positionen: `via-40%`, `from-[15%]` |
| `bg-none` | entfernt den Verlauf |

Gradient-Utilities mischen ihre Farben in Oklab, so wie Tailwind CSS sie schreibt (`in oklab`); bei einer beliebigen Position (`bg-linear-[25deg]`, `bg-conic-[0.25turn]`) folgen sie dem CSS-Standard: Oklab mit den Farben der Palette und sRGB, wenn jeder Stopp eine Hex-Farbe, eine `rgb()`-Farbe, eine `hsl()`-Farbe oder eine benannte Farbe ist.

```rust tabs
view()
    .h_32()
    .rounded_2xl()
    .bg_linear_to_br()
    .gradient_from(INDIGO.shade(500))
    .gradient_via(PURPLE.shade(500))
    .gradient_via_position(percentage(0.4))
    .gradient_to(PINK.shade(500))
```

```tsx tabs
<View class="h-32 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 via-40% to-pink-500" />
```

<a id="borders"></a>

## Rahmen

| Klasse | Setzt |
|---|---|
| `border`, `border-<n>`, `border-[<length>]` | `borderWidth` (ohne Wert: 1) |
| `border-x`, `border-y`, `border-t`, `border-r`, `border-b`, `border-l`, `border-s`, `border-e` (mit `-<n>` oder ohne Wert) | die Breiten der jeweiligen Seiten |
| `border-<color>`, `border-t-<color>`, ... | `borderColor` und die Farben der einzelnen Seiten |
| `border-solid`, `border-dashed`, `border-dotted` | `borderStyle` |
| `border-none`, `border-hidden` | `borderStyle: "none"` / `"hidden"`: kein Rahmen, unabhängig von den Breitenklassen und deren Reihenfolge (`md:border-solid` zeigt ihn wieder an) |
| `rounded`, `rounded-<size>`, `rounded-none`, `rounded-full`, `rounded-[<length>]` | `borderRadius` (ohne Wert: `sm`) |
| `rounded-t-`, `-r-`, `-b-`, `-l-`, `-tl-`, `-tr-`, `-br-`, `-bl-` | die jeweiligen Ecken |
| `rounded-s-`, `-e-`, `-ss-`, `-se-`, `-es-`, `-ee-` | Start- / End-Ecken (richtungsabhängig): `borderTopStartRadius`, `borderTopEndRadius`, `borderBottomStartRadius`, `borderBottomEndRadius` |
| `outline`, `outline-<n>`, `outline-[<length>]` | `outlineWidth` (ohne Wert: 1), durchgezogen, sofern nicht irgendwo im String eine Stilklasse steht (`outline-dashed outline-2` ist gestrichelt, `outline-none outline-2` zeichnet nichts) |
| `outline-<color>` | `outlineColor` |
| `outline-solid`, `outline-dashed`, `outline-dotted`, `outline-none`, `outline-hidden` | `outlineStyle`; ein Stil allein ergibt die mittlere Breite von CSS, 3 Punkte |
| `outline-offset-<n>`, `outline-offset-[<length>]` | `outlineOffset` |

Radius-Größen (Punkte): `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `3xl` 24, `4xl` 32, `full` 9999.

<a id="rings"></a>

### Ringe

Ringe sind Box-Schatten mit einer Ausbreitung (Spread); sie werden außerhalb des Rahmens gezeichnet, ohne Platz zu beanspruchen.

| Klasse | Setzt |
|---|---|
| `ring`, `ring-<n>`, `ring-[<length>]` | einen Ring dieser Breite (ohne Wert: 1) |
| `ring-<color>` | seine Farbe (standardmäßig die Textfarbe des Elements) |
| `ring-inset` | zeichnet den Ring innen |
| `ring-offset-<n>`, `ring-offset-<color>` | einen Abstand zwischen Element und Ring (standardmäßig weiß) |
| `inset-ring`, `inset-ring-<n>`, `inset-ring-<color>` | einen inneren Ring |

<a id="effects"></a>

## Effekte

| Klasse | Setzt |
|---|---|
| `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`; `/<alpha>` | `boxShadow` aus dem Theme; der Modifikator ist das Alpha der Ebenen: `shadow-xl/20` |
| `shadow-[<box-shadow>]` | einen beliebigen Schatten: `shadow-[0_8px_24px_rgb(0_0_0_/_0.12)]` |
| `shadow-<color>`, `shadow-current` | färbt die Schattenebenen um, mit dem Alpha der Größe: `shadow-indigo-500/40` |
| `shadow-none` | kein Schatten |
| `inset-shadow-2xs`, `-xs`, `-sm`, `inset-shadow`, `inset-shadow-[...]`, `inset-shadow-<color>`, `inset-shadow-none` | einen inneren Schatten |
| `opacity-<n>`, `opacity-[<value>]` | `opacity`: `opacity-50` = 0.5 |
| `mix-blend-<mode>` | `mixBlendMode`: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |

Schatten, Ringe und innere Schatten werden wie in CSS zu einer einzigen `boxShadow`-Liste kombiniert. Eine Schattenfarbe ersetzt die Farbe jeder Ebene, ebenso das Alpha, wie bei Tailwinds `--tw-shadow-color`: `shadow-md shadow-red-500` ist ein deckend roter Schatten, `shadow-md/20 shadow-red-500` einer mit 20 %.

<a id="filters"></a>

## Filter

| Klasse | Setzt |
|---|---|
| `blur`, `blur-xs` (4), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (40), `-3xl` (64), `blur-none`, `blur-[<length>]` | `blur()` |
| `brightness-<n>`, `contrast-<n>`, `saturate-<n>` | prozentuale Faktoren: `brightness-125` = 1.25 |
| `grayscale`, `grayscale-<n>`, `invert`, `invert-<n>`, `sepia`, `sepia-<n>` | ohne Wert: 100 % |
| `hue-rotate-<deg>`, `-hue-rotate-<deg>` | `hue-rotate()` |
| `drop-shadow`, `drop-shadow-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `drop-shadow-[...]`, `drop-shadow-none`; `drop-shadow-<color>`, `drop-shadow-current`; `/<alpha>` bei beiden | ein `drop-shadow()` pro Ebene, nach den anderen Filtern; eine Farbe ersetzt die der Ebenen, mit dem Alpha der Größe; Web, Linux, Windows und GPUI zeichnen jede Ebene, iOS, macOS und Android die breiteste |
| `drop-shadow-none` | entfernt ihn |
| `filter-none` | entfernt alle Filter |
| `backdrop-blur`, `backdrop-blur-<size>`, `backdrop-blur-[<length>]` | weichzeichnet, was sich hinter der View befindet |
| `backdrop-brightness-<n>`, `backdrop-contrast-<n>`, `backdrop-grayscale`, `backdrop-hue-rotate-<deg>`, `backdrop-invert`, `backdrop-opacity-<n>`, `backdrop-saturate-<n>`, `backdrop-sepia` | Backdrop-Filter |
| `backdrop-filter-none` | entfernt sie |

> [!WARNING]
> iOS wendet nur `opacity`, `brightness` bis 1 und `drop-shadow` auf Views an; `<Image>` übernimmt jeden Farbfilter und `blur`. Android benötigt API 31 für `blur`, `drop-shadow` und Backdrop-Blur. Siehe die [Style-Referenz](./style-reference.md#filters-and-blending).

<a id="transforms"></a>

## Transformationen

| Klasse | Setzt |
|---|---|
| `translate-x-<n>`, `translate-y-<n>`, `translate-<n>` | `translate` (Abstand, `full`, Bruchteile der eigenen Größe des Elements: `-translate-x-1/2`, beliebig) |
| `rotate-<deg>`, `rotate-[<angle>]` | `rotate` |
| `rotate-x-<deg>`, `rotate-y-<deg>`, `rotate-z-<deg>` | 3D-Rotation (in `transform`, nach der Translation, der Rotation und der Skalierung) |
| `scale-<pct>`, `scale-x-<pct>`, `scale-y-<pct>`, `scale-[<factor>]` | `scale`: `scale-95` = 0.95, `-scale-x-100` spiegelt |
| `skew-<deg>`, `skew-x-<deg>`, `skew-y-<deg>` | Skew (Neigung), in `transform` (nicht unter Android) |
| `perspective-dramatic` (100), `-near` (300), `-normal` (500), `-midrange` (800), `-distant` (1200), `perspective-[<length>]`, `perspective-none` | Tiefe für die 3D-Rotationen der Kinder des Elements, von dessen Mittelpunkt aus gesehen (`perspective` in CSS: `<View class="perspective-near"><View class="rotate-y-45" /></View>`) |
| `origin-center`, `-top`, `-top-right`, `-right`, `-bottom-right`, `-bottom`, `-bottom-left`, `-left`, `-top-left`, `origin-[<value>]` | `transformOrigin` |
| `backface-hidden`, `backface-visible` | `backfaceVisibility` |
| `transform-none` | setzt die 3D-Rotationen und die Skews zurück (`transform: none` in CSS) |
| `translate-none`, `rotate-none`, `scale-none` | setzt die Translation, die Rotation, die Skalierung zurück |

Transform-Utilities lassen sich wie in CSS kombinieren: `translate-*`, `rotate-*` und `scale-*` setzen die Properties `translate`, `rotate` und `scale` und werden unabhängig von der Reihenfolge kombiniert; anschließend greift `transform` (`rotate-x-*`, `skew-*`). Die gleichnamigen Schlüssel der Prop `style` ersetzen nur ihre eigene Property: `style={{ scale: 1.1 }}` ersetzt `scale-95` und behält `rotate-3`. `transform`, `transform-gpu`, `transform-cpu` und `transform-flat` werden akzeptiert und bewirken nichts: NSH setzt jede Transformation gleich zusammen, flach. Translationen um einen Bruchteil der Größe werden gegen den Frame des Elements aufgelöst und folgen ihm bei einer Größenänderung.

<a id="transitions-and-animation"></a>

## Übergänge und Animation

| Klasse | Setzt |
|---|---|
| `transition` | Farben, Deckkraft, Schatten und Transformation; 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition-all`, `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` | die animierten Properties |
| `transition-none` | kein Übergang |
| `duration-<ms>`, `duration-[<time>]` | `transitionDuration`: `duration-300`, `duration-[0.4s]` |
| `delay-<ms>`, `delay-[<time>]` | `transitionDelay` |
| `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`, `ease-initial`, `ease-[cubic-bezier(...)]` | `transitionTimingFunction` |
| `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` | eine native Keyframe-Animation, die endlos wiederholt wird |
| `animate-none` | stoppt sie |

Übergänge laufen auf dem UI-Thread, wenn sich ein Wert ändert, auch wenn eine Variante zu greifen beginnt oder aufhört. So animiert `transition active:scale-95` das Drücken ohne JS. Packe Animationen in `motion-safe:`, um die Einstellung „Bewegung reduzieren“ zu respektieren.

<a id="interactivity"></a>

## Interaktivität

| Klasse | Setzt |
|---|---|
| `pointer-events-none`, `pointer-events-auto` | `pointerEvents: "none"` / `"auto"`: ob die View ein Ziel für Touches und den Zeiger ist, vererbt wie in CSS: innerhalb einer `pointer-events-none`-View ist eine `pointer-events-auto`-View wieder ein Ziel |
| `cursor-<name>`, `cursor-[<name>]` | `cursor`: `cursor-pointer`, `cursor-grab`, `cursor-not-allowed`, ... (jedes CSS-Cursor-Schlüsselwort) |
| `select-none`, `select-text`, `select-auto` | Textauswahl (siehe Typografie) |

## SVG

| Klasse | Setzt |
|---|---|
| `fill-<color>`, `fill-none`, `fill-current`, `fill-inherit` | `fill` (`fill-current` ist `currentColor`) |
| `stroke-<color>`, `stroke-none`, `stroke-current`, `stroke-inherit` | `stroke` |
| `stroke-<number>`, `stroke-[<length>]` | `strokeWidth` |

<a id="images"></a>

## Bilder

| Klasse | Setzt |
|---|---|
| `object-cover`, `object-contain`, `object-fill`, `object-none`, `object-scale-down` | `objectFit` (`fill` streckt, `none` behält die natürliche Größe bei und platziert bei `objectPosition`, `scale-down` ist dasselbe, verkleinert, sodass es passt, wo es größer ist); Bilder und Videos |
| `object-top`, `object-bottom`, `object-left`, `object-right`, `object-center`, `object-top-left`, `object-top-right`, `object-bottom-left`, `object-bottom-right`, `object-[<position>]` | `objectPosition` (`object-left-top`, ... entsprechen `object-top-left`, ...) |
| `tint-<color>` | `tintColor` (färbt Template-Bilder um) |

<a id="accepted-without-effect"></a>

## Akzeptiert ohne Wirkung

Diese Utilities sind Rendering-Hinweise oder beschreiben, was jede native View ohnehin ist; sie werden ohne Warnung geparst und ändern nichts: `antialiased`, `subpixel-antialiased`, `isolation-auto`, `box-border`, `appearance-none`, `appearance-auto`, `will-change-auto`, `will-change-scroll`, `will-change-contents`, `will-change-transform`, `will-change-[<value>]`, `transform`, `transform-gpu`, `transform-cpu`, `transform-flat`. Scrollen, Snapping und Overscroll sind Props von [scroll](../elements/scroll.md).

<a id="not-supported"></a>

## Nicht unterstützt

`peer-*`-Varianten, Pseudo-Elemente (`before:`, `after:`), beliebige Properties (`[prop:value]`), `overflow-auto` / `overflow-scroll`, `divide-*`, `columns-*`, `float-*`, `container`, Container Queries, `order-*`, `transform-3d`, `select-all`, `border-double` / `outline-double`, intrinsische Min-/Max-Constraints (wie `max-w-max`), `snap-*`, `scroll-*`, `overscroll-*`, `touch-*` und `isolate` sind unbekannte Klassen. `nsh build` und `nsh dev` warnen vor unbekannten Klassen, die sie in deinem Quellcode finden (`file:line:col: unknown class '...'`), und die Runtime protokolliert jede unbekannte Klasse einmal.

<a id="variants"></a>

## Varianten

Varianten machen ein Utility bedingt: `dark:bg-zinc-900`, `md:flex-row`, `active:opacity-70`. Sie lassen sich stapeln (`dark:active:bg-zinc-700`) und werden nativ ausgewertet, sobald sich ändert, wovon sie abhängen.

<a id="appearance-and-environment"></a>

### Darstellung und Umgebung

| Variante | Gilt, wenn | Rust |
|---|---|---|
| `dark:` | die Darstellung dunkel ist | `.dark(\|s\| …)` |
| `ios:` | auf iOS oder Mac Catalyst ausgeführt | `.when(os() == Os::Ios, …)` |
| `android:` | auf Android ausgeführt | `.when(os() == Os::Android, …)` |
| `portrait:`, `landscape:` | das Fenster höher als breit / breiter als hoch ist | `.style_when(move \|\| window().height > window().width, …)` |
| `ltr:`, `rtl:` | die Layout-Richtung | `.style_when(rtl, …)` |
| `motion-safe:`, `motion-reduce:` | der Nutzer reduzierte Bewegung nicht / angefordert hat | `.style_when(reduce_motion, …)` |

### Breakpoints

Breakpoints vergleichen die Fensterbreite in Punkten.

| Variante | Mindestbreite |
|---|---|
| `sm:` | 640 |
| `md:` | 768 |
| `lg:` | 1024 |
| `xl:` | 1280 |
| `2xl:` | 1536 |

| Form | Beispiel | Gilt, wenn |
|---|---|---|
| `<bp>:` | `md:p-8` | Breite ≥ Breakpoint |
| `max-<bp>:` | `max-md:p-1` | Breite < Breakpoint |
| `min-[<length>]:` | `min-[600px]:grid-cols-3` | Breite ≥ die Länge |
| `max-[<length>]:` | `max-[400px]:text-sm` | Breite < die Länge |

Ein Smartphone im Hochformat (390 Punkte breit) entspricht keinem der Standard-Breakpoints; ein Tablet oder ein Smartphone im Querformat entspricht mehreren. In Rust ist ein Breakpoint eine Bedingung auf dem Fenster: `.style_when(move || window().width >= px(768.0), |s| s.p_8())` ist `md:p-8`.

<a id="interaction-states"></a>

### Interaktionszustände

Zustände werden von der Plattform nur für Elemente verfolgt, deren Klassen sie verwenden, und Änderungen werden nativ angewendet, ohne JS-Roundtrip.

| Variante | Gilt, wenn | Rust |
|---|---|---|
| `active:` | das Element gedrückt wird | `.active(\|s\| …)` |
| `hover:` | ein Zeiger darüber ist (iPad-Zeiger, Mac Catalyst, Android-Maus) | `.hover(\|s\| …)` |
| `focus:`, `focus-visible:` | die Eingabe den Fokus hat | `.focus(\|s\| …)` |
| `focus-within:` | das Element oder ein Nachfahre den Fokus hat (der Inhalt eines `Overlay` ist ein Nachfahre des Elements, in dem er sich befindet) | `.focus_within(…)` |
| `disabled:` | das Element die Prop `disabled` hat | `.disabled_style(\|s\| …)` |
| `enabled:` | das Element die Prop `disabled` nicht hat |  |
| `selected:` | das Element ausgewählt ist: das `selected` eines `Button` oder `accessibilityState.selected` |  |
| `checked:` | das Element aktiviert (checked) ist: `accessibilityState.checked` ist `true` (`"mixed"` ist nicht aktiviert) |  |
| `indeterminate:` | das Element unbestimmt (indeterminate) ist: `accessibilityState.checked` ist `"mixed"` |  |
| `aria-expanded:` | das Element aufgeklappt (expanded) ist: `accessibilityState.expanded` ist `true` (der Trigger eines `Popover` oder `Menu`, solange sein Popup geöffnet ist) |  |
| `aria-pressed:` | das Element ein Toggle-Button ist, der eingeschaltet ist: `accessibilityState.pressed` ist `true` (`"mixed"` ist nicht gedrückt; nicht `active:`, ein laufender Druck) | `.aria_pressed(\|s\| …)` |
| `aria-busy:` | das Element beschäftigt (busy) ist: `accessibilityState.busy` ist `true` |  |
| `aria-checked:` | das Element aktiviert (checked) ist: `accessibilityState.checked` ist `true`, wie `checked:` |  |
| `aria-selected:` | das Element ausgewählt ist: `accessibilityState.selected` ist `true`, wie `selected:` |  |
| `data-<name>:` | das Element das boolesche Attribut `data-*` mit dem Namen `name` hat (Tailwinds `&[data-<name>]`; Namen aus Kleinbuchstaben, Ziffern und `-`): was der Teil einer Komponente über ihre Zustände hinaus anzeigt, etwa der Tag eines Kalenders am Anfang eines Bereichs `data-range-start` | `Interactive::project_data(name, …)` setzt eines |

Dieselben Zustände als Style-Objekte sind die Props `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle`, `checkedStyle`, `indeterminateStyle`, `expandedStyle` und `pressedStyle` jedes Elements (und das `selectedStyle` eines `Button`); sie haben Vorrang vor dem Style und den Klassen des Elements.

`disabled` funktioniert bei jedem Element: Es wendet `disabled:` an und entfernt die Press-Handler des Elements, sodass es auch kein Feedback beim Drücken zeigt.

```rust tabs
view()
    .on_press(save)
    .disabled(saving)
    .rounded_lg()
    .bg(BLUE.shade(600))
    .px_4()
    .py_2()
    .transition()
    .active(|s| s.scale(0.95).bg(BLUE.shade(700)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View
  onPress={save}
  disabled={saving()}
  class="rounded-lg bg-blue-600 px-4 py-2 transition active:scale-95 active:bg-blue-700 disabled:opacity-40"
>
  <Text class="font-medium text-white">Save</Text>
</View>
```
<a id="groups"></a>

### Gruppen

Markiere ein Vorfahrenelement mit `group` und style Nachkommen abhängig von dessen Zustand mit `group-<state>:`. Benenne Gruppen, um sie zu verschachteln: `group/card` und `group-hover/card:`.

| Variante | Gilt, wenn die Gruppe | Rust |
|---|---|---|
| `group-active:` | gedrückt ist | `.group_active(…)`, `.group_active_named(name, …)` |
| `group-hover:` | mit dem Zeiger überfahren wird | `.group_hover(…)`, `.group_hover_named(name, …)` |
| `group-focus:`, `group-focus-visible:` | fokussiert ist |  |
| `group-focus-within:` | fokussiert ist oder den Fokus enthält | `.group_focus_within(…)`, `.group_focus_within_named(name, …)` |
| `group-disabled:` | deaktiviert ist |  |
| `group-selected:` | ausgewählt ist |  |
| `group-checked:` | angehakt ist |  |
| `group-indeterminate:` | unbestimmt ist |  |
| `group-aria-expanded:` | aufgeklappt ist |  |
| `group-aria-pressed:` | ein eingeschalteter Toggle-Button ist |  |
| `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:` | beschäftigt, angehakt, ausgewählt ist |  |
| `group-data-<name>:` | das Attribut `data-*` `name` zeigt |  |

```rust tabs
view()
    .on_press(open)
    .group_named("row")
    .flex_row()
    .items_center()
    .gap_3()
    .p_3()
    .active(|s| s.bg(ZINC.shade(100)))
    .child(
        text("Settings")
            .flex_1()
            .text_color(ZINC.shade(900))
            .group_active_named("row", |s| s.text_color(BLUE.shade(600))),
    )
    .child(
        text("›")
            .text_color(ZINC.shade(400))
            .group_active_named("row", |s| s.translate_x(px(4.0)))
            .transition_transform(),
    )
```

```tsx tabs
<View onPress={open} class="group/row flex-row items-center gap-3 p-3 active:bg-zinc-100">
  <Text class="flex-1 text-zinc-900 group-active/row:text-blue-600">Settings</Text>
  <Text class="text-zinc-400 group-active/row:translate-x-1 transition-transform">›</Text>
</View>
```

<a id="position-among-siblings"></a>

### Position unter Geschwisterelementen

| Variante | Gilt für |
|---|---|
| `first:` | das erste Kind |
| `last:` | das letzte Kind |
| `only:` | das einzige Kind |
| `odd:` | das 1., 3., ... Kind |
| `even:` | das 2., 4., ... Kind |

```rust tabs
each(items, |item: &Item| item.id, move |item, index| {
    text(move || item.with(|i| i.name.clone()))
        .border_b(px(1.0))
        .border_color(ZINC.shade(200))
        .py_3()
        .style_when(move || index.get() + 1 == items.with(Vec::len), |s| s.border_b(px(0.0)))
})
```

```tsx tabs
<Each of={items()}>{(item) => <Text class="border-b border-zinc-200 py-3 last:border-b-0">{item().name}</Text>}</Each>
```

<a id="placeholder-and-selection"></a>

### Platzhalter und Auswahl

`placeholder:` gilt für den Platzhalter eines `<Input>` und akzeptiert nur eine Textfarbe: `placeholder:text-zinc-400` (der Style-Key `placeholderColor`). `selection:` gilt für die Auswahl eines `<Input>` oder eines auswählbaren `<Text>` und bei jedem Element auch für die darin enthaltenen Elemente (Tailwinds `& *::selection`; das nächstgelegene Element gewinnt). Es akzeptiert eine Hintergrundfarbe, die Hervorhebung: `selection:bg-violet-200` (der Style-Key `selectionColor`, der auch den Cursor eines Eingabefelds einfärbt, wenn die Plattform ihn einfarbig zeichnet).

<a id="important"></a>

### Wichtig

`!` vor oder nach einem Utility (`!p-4`, `p-4!`) sorgt dafür, dass es sich gegenüber jeder anderen Klasse und dem Inline-`style` durchsetzt.

<a id="theme-customization"></a>

## Theme-Anpassung

Erweitere das Theme im Objekt `"tailwind"` der `nsh.json` deiner App. Einträge mit neuem Namen werden hinzugefügt; Einträge mit einem bereits vorhandenen Namen ersetzen den Standardwert. Längen sind in Punkten angegeben. Das Theme wird beim Bundling der App geprüft: Ein unbekannter Schlüssel oder ein ungültiger Wert führt zu einem Build-Fehler.

```json
{
  "name": "My App",
  "id": "com.example.myapp",
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "accent": "#f59e0b"
    },
    "spacing": 4,
    "breakpoints": { "tablet": 600 },
    "fontFamily": { "display": "Inter" },
    "fontSize": { "huge": [48, 1.1] },
    "fontWeight": { "heavy": 850 },
    "radius": { "card": 14 },
    "shadow": { "card": "0 2px 8px rgb(0 0 0 / 0.12)" },
    "insetShadow": { "well": "inset 0 2px 6px rgb(0 0 0 / 0.1)" },
    "dropShadow": { "icon": "0 2px 4px rgb(0 0 0 / 0.2)" },
    "tracking": { "label": 0.08 },
    "leading": { "dense": 1.15 },
    "blur": { "glass": 20 },
    "perspective": { "card": 700 },
    "aspect": { "photo": 1.5 },
    "ease": { "snappy": [0.2, 0, 0, 1] },
    "container": { "content": 680 }
  }
}
```

Mit diesem Theme funktionieren `bg-brand-500`, `bg-brand` (die Abstufung `DEFAULT`), `text-accent`, `tablet:flex-row`, `font-display`, `text-huge`, `font-heavy`, `rounded-card`, `shadow-card`, `inset-shadow-well`, `drop-shadow-icon`, `tracking-label`, `leading-dense`, `blur-glass`, `perspective-card`, `aspect-photo`, `ease-snappy` und `max-w-content`.

| Schlüssel | Wert | Verwendet von |
|---|---|---|
| `colors` | `{ name: color }` oder `{ name: { shade: color } }`; `DEFAULT` benennt die reine Farbe. Beliebige CSS-Farbsyntax. | jedem Farb-Utility |
| `spacing` | Punkte pro Stufe (Standard 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | Punkte pro `rem` (Standard 16) | |
| `breakpoints` | `{ name: width }` | Breakpoint-Varianten (nach Breite sortiert) |
| `container` | `{ name: width }` | `w-*`, `min-w-*`, `max-w-*` |
| `fontFamily` | `{ name: family }` (eine Systemschriftfamilie oder der Name einer gebündelten Schrift) | `font-*` |
| `fontSize` | `{ name: size }` oder `{ name: [size, lineHeightMultiple] }` | `text-*` |
| `fontWeight` | `{ name: 1–1000 }` | `font-*` |
| `tracking` | `{ name: em }` | `tracking-*` |
| `leading` | `{ name: multiple }` | `leading-*` |
| `radius` | `{ name: points }` | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | `{ name: "CSS box-shadow" }` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | `{ name: points }` | `blur-*`, `backdrop-blur-*` |
| `perspective` | `{ name: points }` | `perspective-*` |
| `aspect` | `{ name: ratio }` | `aspect-*` |
| `ease` | `{ name: [x1, y1, x2, y2] }` | `ease-*` |

> [!NOTE]
> Das Tailwind-Theme formt nur die Klassen deiner App. Die Design-Tokens der App (die Farben von shadcn/ui, `radius`, die Schriften und die eigenen Tokens der App) bilden ihr Theme, den Schlüssel `"theme"` von `nsh.json`, mit dem Rust-Komponenten zeichnen; siehe [Rust](../docs/rust.md#theme). Klassen benennen diese Tokens als Tailwind-Namen für `@theme`-Variablen (`bg-primary`, `bg-up/30`, `rounded-(--radius)`): siehe [Theme-Tokens](../docs/tailwind.md#theme-tokens).

<a id="related"></a>

## Siehe auch

- [Tailwind](../docs/tailwind.md): die Anleitung.
- [Styling](../docs/styling.md): `class`, `classList`, `style` und wie sie zusammenspielen.
- [Style-Referenz](./style-reference.md): die Style-Keys, die Utilities setzen.
