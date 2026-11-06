---
title: "Styling"
description: "Typisierte Style-Methoden in Rust und die Style-Prop in TSX – Flexbox, Grid und CSS-Effekte – Farben, Rahmen, Ecken, Schatten, Verläufe, Filter, Transformationen und Übergänge, mit Plattformunterschieden."
order: 32
group: ui
demo: guide-styling
source_hash: c3b673df4846a333
---


# Styling

Jedes Element wird mit denselben nativen Styles gestaltet, die sich auf zwei Arten schreiben lassen. In Rust sind Styles typisierte Methoden, die an das Element gekettet werden (`.p_4()`, `.rounded(px(12.0))`, `.bg(color)`); in TSX sind es ein `style`-Prop mit Properties in camelCase oder [Tailwind-Klassen](./tailwind.md). Beide umfassen CSS-Features wie Box-Shadows, Verläufe, Filter, Outlines, Transitions und Grid, und nur die geänderten Properties werden an die native View gesendet.

Die drei Schreibweisen setzen dieselben Properties und bedeuten dasselbe. Ihre Namen sind die von CSS (einige tragen die schlichteren Namen, die Apps verwenden, etwa `paddingHorizontal`, `marginStart` und `numberOfLines`). CSS-Werte (Farben, Verläufe, Filter, Schatten, Transformationen, Ausrichtungs-Keywords) und Tailwind-Utilities bedeuten dasselbe wie im Web, wobei jede Rust-Methode und jede Utility das setzt, was Tailwind CSS 4 dafür generiert. Das Wissen aus dem Web lässt sich also übertragen: `paddingLeft` ist `padding-left` und `pl-4`, `boxShadow` ist `box-shadow`, `display: "flex"` ist eine Zeile, so wie die Klasse `flex`. Der Rest ist auf native Apps zugeschnitten: Längen sind Punkte (`16`, `"50%"`, `"auto"`; Klassen akzeptieren `rem` und die anderen Einheiten von CSS), die Standardwerte sind die des nativen Layouts (unten aufgeführt), ein Wert, der sich ändert, nimmt Zahlen statt eines Strings (`translate: [x, 0]`, die Ebenen eines Schattens), und was die Plattformen über CSS hinaus leisten, hat eigene [Erweiterungen](#extensions).

```rust tabs
view()
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .border_1()
    .border_color(rgb(0xd0d7de))
    .shadow([BoxShadow {
        offset_y: px(4.0),
        blur: px(12.0),
        color: rgba(0x0000001f).into(),
        ..BoxShadow::default()
    }])
    .child(
        text("Card")
            .text_size(px(17.0))
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(rgb(0x1f2328)),
    )
```

```tsx tabs
<View
  style={{
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d7de",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  }}
>
  <Text style={{ fontSize: 17, fontWeight: "600", color: "#1f2328" }}>Card</Text>
</View>
```

Diese Seite behandelt, wie Styles kombiniert werden, und die visuellen Properties. Layout-Properties (Flexbox, Grid, Größen, Positionen) stehen unter [Layout](./layout.md), Text-Properties unter [Text](./text.md), und jede Property mit ihrem Typ ist in der [Style-Referenz](../modules/style-reference.md) aufgeführt.

<a id="combining-styles"></a>

## Styles kombinieren

In Rust sind gemeinsame Styles Funktionen, die ein Element entgegennehmen und es gestaltet zurückgeben, und Bedingungen sind gewöhnliches Rust: `.when(condition, |v| ..)` für das, was beim Erstellen des Elements bekannt ist, `.style_when(signal, |s| ..)` für Styles, die während der Laufzeit der App wechseln. In TSX nimmt `style` ein Objekt oder ein Array von Objekten, die von links nach rechts zusammengeführt werden; falsy-Einträge (`false`, `null`, `undefined`) werden übersprungen, was bedingte Styles kurz macht:

```rust tabs
fn button(danger: bool, busy: Signal<bool>) -> View {
    view()
        .px_4()
        .py(px(10.0))
        .rounded(px(10.0))
        .bg(rgb(0x0969da))
        .when(danger, |v| v.bg(rgb(0xcf222e)))
        .style_when(busy, |s| s.opacity(0.4))
}
```

```tsx tabs
const styles = {
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0969da" },
  disabled: { opacity: 0.4 },
  danger: { backgroundColor: "#cf222e" },
} as const;

<View style={[styles.button, props.danger && styles.danger, busy() && styles.disabled]} />
```

Definiere in TSX gemeinsame Styles als Konstanten außerhalb von Komponenten (mit `as const`, damit TypeScript Literaltypen wie `"row"` beibehält). Ein einfaches Objekt genügt: Styles werden in Rust bei jedem Setzen geparst, aus Objekten, die niemand registrieren muss.

Ein Style, der Signals liest, folgt ihnen: In Rust übergibst du der Methode eine Closure (`.bg(move || ..)`), und nur diese eine Property wird neu gesetzt, wenn sich die Signals ändern; in TSX wird ein Style-Ausdruck, der Signals liest, neu aufgebaut, und NSH sendet nur die Properties, deren Werte sich unterscheiden:

```rust tabs
view()
    .p_3()
    .bg(move || if selected.get() { rgb(0xddf4ff) } else { rgb(0xffffff) })
```

```tsx tabs
<View style={{ backgroundColor: selected() ? "#ddf4ff" : "#ffffff", padding: 12 }} />
```

Hat ein TSX-Element beides, gewinnt `style` gegenüber `class`: Zuerst werden die Klassen angewendet, dann der Inline-Style darüber. Ein Key mit dem Wert `undefined` setzt nichts (`backgroundColor: active ? accent : undefined` behält die Klassenfarbe, wenn inaktiv); `null` setzt den Standardwert. In Rust gewinnt für dieselbe Property eine spätere Methode gegenüber einer früheren.

Innerhalb eines Styles (eines Objekts oder eines zu einem zusammengeführten Arrays) spielt die Reihenfolge der Keys keine Rolle: Eine spezifischere Property gewinnt gegenüber ihrer Kurzform, `borderTopWidth` gegenüber `borderWidth`, `borderLeftColor` gegenüber `borderColor`, `marginTop` gegenüber `marginVertical` gegenüber `margin` (ebenso beim Padding), `rowGap` gegenüber `gap`, `flexGrow` gegenüber `flex`, `gridColumnStart` gegenüber `gridColumn`. Eine dort auf `null` gesetzte spezifische Property zeigt den Wert der Kurzform.

<a id="units-and-values"></a>

## Einheiten und Werte

- **Längen sind Punkte** (dichteunabhängige Pixel): `px(100.0)` in Rust und `width: 100` in TSX sind 100pt, also 200 oder 300 physische Pixel auf einem 2×- oder 3×-Bildschirm.
- **Prozentwerte** (`relative(0.5)` in Rust, `"50%"` in TSX) beziehen sich auf das Parent-Element, bei Größen, Positionen, Margins und Paddings ([Layout](./layout.md)).
- **Winkel** sind in Rust `deg(45.0)`, `radians(0.5)` oder `turn(0.25)`, in TSX Grad als Zahlen oder Strings mit Einheit: `45`, `"45deg"`, `"0.5rad"`; `rotate` und `transform` von CSS akzeptieren auch `"0.25turn"`, und innerhalb eines `transform`-Strings hat jeder Winkel seine Einheit.
- **Dauern** sind Millisekunden: `.duration(150.0)` in Rust, Zahlen oder Strings (`"150ms"`, `"0.2s"`) in TSX.

<a id="defaults"></a>

## Standardwerte

Wo nichts eine Property setzt, gelten die Standardwerte von NSH:

| | Standard |
|---|---|
| Layout der Children einer View | eine Spalte (ein Flex-Container mit `flexDirection: "column"`); `display: "flex"` ergibt eine Zeile, sofern `flexDirection` nicht gesetzt ist, wie in CSS |
| `flexShrink` | `0` (Children schrumpfen nicht, außer man verlangt es) |
| `alignContent` | `"flex-start"` (in Grids das `"normal"` von CSS) |
| `position` | `"relative"` |
| `minWidth` / `minHeight` | `0` |
| `backgroundColor` | transparent |
| Text | schwarz, 14pt, Stärke 400 |
| Rahmen- und Outline-Farbe | die Textfarbe (das `currentColor` von CSS) |

Neue Views tragen überhaupt keinen Style, bis du ihnen einen gibst, daher kosten ungestylte Wrapper auf der nativen Seite nichts.

<a id="colors"></a>

## Farben

In Rust sind Farben typisierte Werte: `rgb(0x0099ff)`, `rgba(0x0099ffcc)`, `hsla(..)`, `white()`, `black()` und die Palette von Tailwind als `nsh_core::element::palette` (`BLUE.shade(500)`). Farbmethoden nehmen einen `AdaptiveColor`, einen hellen und einen dunklen Wert: `AdaptiveColor::rgb(0xffffff, 0x0d1117)` wechselt nativ mit dem Erscheinungsbild des Systems, ohne Render. Farben aus dem Theme der App (`theme().primary` aus `nsh_base`) sind ebenfalls adaptiv ([Rust](./rust.md#theme)).

In TSX akzeptieren Farb-Properties CSS-Farbstrings:

| Form | Beispiel |
|---|---|
| Hex | `"#09f"`, `"#09fc"`, `"#0099ff"`, `"#0099ffcc"` |
| `rgb()` / `rgba()` | `"rgb(0, 153, 255)"`, `"rgba(0, 0, 0, 0.5)"`, `"rgb(0 0 0 / 10%)"` |
| `hsl()` / `hsla()` | `"hsl(210 100% 50%)"` |
| `oklch()` / `oklab()` | `"oklch(62.3% 0.214 259.8)"` |
| Benannt | `"white"`, `"black"`, `"transparent"`, `"rebeccapurple"`, ... |
| `currentColor` | `"currentColor"`: die Textfarbe, auch innerhalb eines Verlaufs, eines Schattens, eines `drop-shadow()` oder eines `color-mix()` (`"color-mix(in srgb, currentColor 50%, transparent)"`); Klassen schreiben es `bg-current`, `border-current/50`, `bg-[color-mix(in_srgb,currentColor_50%,transparent)]` |

Für den Dark Mode in TSX liest du [`colorScheme()`](../modules/nsh.md#device) aus `nsh`, einem Accessor, der dem Erscheinungsbild des Systems folgt, oder verwendest die `dark:`-Variante von Tailwind:

```rust tabs
view()
    .flex_1()
    .bg(AdaptiveColor::rgb(0xffffff, 0x0d1117))
    .child(text("Follows the system appearance").text_color(AdaptiveColor::rgb(0x1f2328, 0xe6edf3)))
```

```tsx tabs
import { Text, View } from "nsh";
import { colorScheme } from "nsh";

const palette = () =>
  colorScheme() === "dark"
    ? { background: "#0d1117", text: "#e6edf3" }
    : { background: "#ffffff", text: "#1f2328" };

<View style={{ flex: 1, backgroundColor: palette().background }}>
  <Text style={{ color: palette().text }}>Follows the system appearance</Text>
</View>
```

Für Styles, die keine Farben sind, wendet `.dark(|s| ..)` in Rust Styles im dunklen Erscheinungsbild an, und `dark()` liest das Erscheinungsbild. Die Standardtextfarbe ist in beiden Erscheinungsbildern schwarz: Setze Farben in Apps mit Dark-Mode-Unterstützung explizit.

<a id="borders-and-corners"></a>

## Rahmen und Ecken

```rust tabs
view()
    .border_1()
    .border_color(rgb(0xd0d7de))
    .border_dashed()               // .border_solid() | .border_dashed() | .border_dotted()
    .rounded(px(12.0))
    .rounded_tl(px(24.0))          // per corner, overrides .rounded(..)
    .border_b(px(3.0))             // per side
    .border_b_color(rgb(0x0969da))
```

```tsx tabs
<View
  style={{
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderStyle: "dashed",          // "solid" | "dashed" | "dotted"
    borderRadius: 12,
    borderTopLeftRadius: 24,        // per corner, overrides borderRadius
    borderBottomWidth: 3,           // per side
    borderBottomColor: "#0969da",
  }}
/>
```

- **Breiten und Farben** pro Seite: `borderTopWidth`, `borderRightWidth`, ..., `borderTopColor`, ..., die in beiden Schreibrichtungen bei ihrer Seite bleiben; und `borderStartWidth`, `borderEndWidth`, `borderStartColor`, `borderEndColor`, die der [Layout-Richtung](./layout.md#right-to-left) folgen (in Rust `.border_t(..)`, `.border_t_color(..)`, `.border_s(..)`, `.border_e_color(..)`, ...).
- **Die Farbe** einer Seite, deren Breite gesetzt ist, deren Farbe aber nicht, ist die Textfarbe, wie beim `currentColor` von CSS: `{ borderWidth: 1, color: "#0969da" }` zeichnet einen blauen Rahmen.
- **Radien** pro Ecke: `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius` sowie `borderTopStartRadius` / `borderTopEndRadius` / `borderBottomStartRadius` / `borderBottomEndRadius` (oben Anfang, oben Ende, unten Anfang, unten Ende), die der [Layout-Richtung](./layout.md#right-to-left) folgen (in Rust `.rounded_tl(..)`, ..., `.rounded_ss(..)`, `.rounded_se(..)`, `.rounded_es(..)`, `.rounded_ee(..)` und die Presets `.rounded_lg()`, `.rounded_full()`, ...).
- **`borderCurve: "continuous"`** (`.border_curve(BorderCurve::Continuous)`) zeichnet Ecken, deren Krümmung weich in die Kanten übergeht, wie bei den App-Icons von iOS, auf beiden Plattformen. Eine Pille (`borderRadius` mit der halben Höhe) bleibt eine Pille.
- **`overflow: "hidden"`** (`.overflow_hidden()`) beschneidet Children auf die abgerundete Form. Was dabei abgeschnitten wird, wird auch im Layout abgeschnitten: Es fließt nicht in die Content-Größe einer umgebenden Scroll-View ein, sodass eine Box, die ein Child breiter als sich selbst anordnet und es mit einem `transform` verkleinert (Transformationen wirken sich nicht auf das Layout aus), die Scroll-View unberührt lässt.

Radien, die größer als die halbe Seite sind, werden begrenzt, sodass `borderRadius: 9999` (`.rounded_full()`) einen Kreis oder eine Pille ergibt.

<a id="shadows"></a>

## Schatten

Views werfen die `boxShadow` von CSS, und Android fügt seine Material-Elevation hinzu:

```rust tabs
// CSS box-shadow: several layers, with spread and inset.
view().shadow([
    BoxShadow { offset_y: px(1.0), blur: px(2.0), color: rgba(0x00000014).into(), ..BoxShadow::default() },
    BoxShadow { offset_y: px(8.0), blur: px(24.0), color: rgba(0x0000001f).into(), ..BoxShadow::default() },
])
view().shadow([BoxShadow { offset_y: px(2.0), blur: px(4.0), color: rgba(0x00000026).into(), inset: true, ..BoxShadow::default() }])

// A preset in a color of its own.
view().shadow_lg().shadow_color(rgba(0x0969da66))

// Android's material elevation.
view().elevation(px(6.0)).bg(white()).rounded(px(12.0))
```

```tsx tabs
// CSS box-shadow: several, comma separated, with spread and inset
<View style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)" }} />
<View style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }} />

// Android's material elevation (a prop, not a style)
<View android={{ elevation: 6 }} style={{ backgroundColor: "#ffffff", borderRadius: 12 }} />
```

`boxShadow` folgt CSS: `offsetX offsetY blur spread color`, `inset` für innere Schatten. Es nimmt seine Ebenen auch als Zahlen, die Form für Werte, die sich ändern und die keinen String aufbaut: `boxShadow: [{ x: 0, y: 6, blur: 18, spread: 0, color: "#0000004d", inset: false }]` (nur `x` und `y` sind erforderlich; eine Ebene ohne Farbe hat die Textfarbe). Rust nimmt die Ebenen, `.shadow([BoxShadow { .. }])`. Schatten folgen der abgerundeten Form der View, und eine Transition animiert sie (`transitionProperty: "boxShadow"`, `.transition_shadow()`). Die Presets von Tailwind sind `.shadow_sm()`, `.shadow_md()`, `.shadow_lg()`, ... in Rust, und `.shadow_color(..)` färbt ihre Ebenen um. Ein Schatten, der dem Inhalt einer transparenten View folgt (etwa den Glyphen eines Icons), ist ein `filter: "drop-shadow(...)"` ([Filter](#filters-and-blending)); Text hat `textShadow` ([Text](./text.md)).

> [!NOTE]
> Auf Android benötigen Schatten einen Hintergrund: Eine View mit transparentem Hintergrund (zum Beispiel ein Text ohne Hintergrund) wirft keinen Schatten.

<a id="gradients"></a>

## Verläufe

`backgroundImage` nimmt CSS-Verläufe, die über der Hintergrundfarbe gezeichnet werden; in Rust `.bg_linear(angle)`, `.bg_radial()` und `.bg_conic(angle)` mit den Stopps `.gradient_from(..)`, `.gradient_via(..)` und `.gradient_to(..)`, wie das `bg-linear-*` von Tailwind mit `from-*`, `via-*` und `to-*`. In TSX werden mehrere Verläufe durch Kommas getrennt.

```rust tabs
view().h(px(120.0)).rounded(px(16.0)).bg_linear(deg(135.0)).gradient_from(rgb(0x54aeff)).gradient_to(rgb(0x8250df))
view().bg_radial().gradient_from(rgb(0xfff8c5)).gradient_to(rgb(0xfd8c73))
view().bg_conic(deg(0.0)).gradient_from(rgb(0xff0000)).gradient_via(rgb(0x00ff00)).gradient_to(rgb(0x0000ff))
view()
    .bg_linear_to_r()
    .gradient_from(rgb(0x8250df))
    .gradient_from_position(percentage(0.3))
    .gradient_to(rgb(0x54aeff))
    .gradient_to_position(percentage(0.3))
```

```tsx tabs
<View style={{ height: 120, borderRadius: 16, backgroundImage: "linear-gradient(135deg, #54aeff, #8250df)" }} />
<View style={{ backgroundImage: "radial-gradient(circle at top left, #fff8c5, #fd8c73)" }} />
<View style={{ backgroundImage: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
<View style={{ backgroundImage: "linear-gradient(90deg, #8250df 0 12px, #54aeff 12px)" }} />
```

Farbstopps werden bei linearen und radialen Verläufen durch Prozentwerte oder Längen (`px`, `pt`, `rem`; einfache Zahlen sind Punkte) entlang des Verlaufs platziert, bei konischen durch Prozentwerte oder Winkel (`deg`, `turn`, `rad`, `grad`) rund um den Mittelpunkt. Ein Stopp mit zwei Positionen (`#8250df 0 12px`) ist ein Band einer einzigen Farbe, ebenso zwei Stopps an derselben Position. Längen werden entlang der Verlaufslinie bei der aktuellen Größe der View gemessen, sodass ein 12px-Band auch beim Ändern der Größe der View 12px breit bleibt.

Farben werden zwischen Stopps wie in CSS gemischt: in dem Farbraum, den ein Verlauf nennt (`linear-gradient(in oklab, …)`; außerdem `srgb`, `srgb-linear`, `xyz`, `oklch` mit einer Hue-Methode wie `longer hue` und `hsl`), sonst in sRGB, wenn jede Farbe eine Hex-, `rgb()`-, `hsl()`- oder benannte Farbe ist, und in Oklab, wenn eine davon `oklch()`, `oklab()`, `lab()`, `lch()` oder `color()` ist.

Text-Elemente zeichnen auf iOS keine Verläufe.

<a id="filters-and-blending"></a>

## Filter und Überblendung

| Property | Wert | Rust |
|---|---|---|
| `filter` | CSS-Filter der View und ihres Inhalts: `brightness()`, `contrast()`, `grayscale()`, `hue-rotate()`, `invert()`, `saturate()`, `sepia()`, `opacity()`, `blur()`, `drop-shadow()` (ohne Farbe in der Textfarbe, wie in CSS); mehrere durch Leerzeichen getrennt | `.brightness(n)`, `.contrast(n)`, `.grayscale(n)`, `.hue_rotate(angle)`, `.invert(n)`, `.saturate(n)`, `.sepia(n)`, `.blur(px(..))` |
| `backdropFilter` | Filter dessen, was hinter der View liegt: `"blur(10px)"` (Milchglas) | `.backdrop_blur(px(10.0))`, `.backdrop_saturate(n)`, ... |
| `glassEffect` | `"regular"` oder `"clear"` für Apples Liquid Glass ab iOS 26 und macOS 26; `"none"` (der Standard) verwendet `backdropFilter` | `.glass_effect(GlassEffect::Regular)` |
| `mixBlendMode` | Wie die View mit dem überblendet, was hinter ihr liegt: `"multiply"`, `"screen"`, `"overlay"`, ... | `.mix_blend_mode(BlendMode::Multiply)` |

```rust tabs
image(photo).size(px(120.0)).grayscale(1.0).contrast(1.2)
view()
    .absolute()
    .bottom_0()
    .left_0()
    .right_0()
    .p_3()
    .bg(rgba(0xffffff66))
    .backdrop_blur(px(12.0))
```

```tsx tabs
<Image src={photo} style={{ width: 120, height: 120, filter: "grayscale(1) contrast(1.2)" }} />
<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }} />
```

Die Unterstützung unterscheidet sich je nach Plattform:

| | iOS | Android |
|---|---|---|
| `filter` auf Views | `opacity`, `brightness` bis 1 und nur `drop-shadow` | Alle, ab Android 12 (API 31); darunter nur Farbfilter |
| `filter` auf Images | Jeder Farbfilter und `blur` | Wie bei Views |
| `backdropFilter` | Ein System-Blur-Material, das den Radius annähert | Ab Android 12 (API 31) |
| `mixBlendMode` | Ja | Ab Android 10 (API 29) |

Das Web, Windows und Linux wenden jeden Filter auf Views an, macOS wie iOS; GPUI zeichnet die Farbfilter und `drop-shadow()`. Der Backdrop-Filter ist auf iOS, macOS und Android ein Blur, im Web und unter Windows jeder Filter; Linux und GPUI zeichnen keinen, und GPUI zeichnet Views im normalen Blend-Modus. Von einem `filter` mit mehreren `drop-shadow()`s zeichnen iOS, macOS und Android den letzten. `mixBlendMode` überblendet die View mit allem, was dahinter gezeichnet wurde.

Auf iOS wählt `ios={{ backdropMaterial: "regular" }}` das System-Material aus, das von einem `backdropFilter`-Blur verwendet wird. Mögliche Werte sind `"ultraThin"` (der Standard), `"thin"`, `"regular"`, `"thick"` und `"chrome"`. Kombiniere das Prop mit einem positiven Blur-Radius, damit das Material angezeigt wird. Rust verwendet `.backdrop_material(BackdropMaterial::Regular)` zusammen mit `.backdrop_blur(px(30.0))`. Der Radius nähert die Stärke des Materials an: NSH wendet einen Bruchteil des gewählten Materials an und erreicht bei 30 Punkten die volle Stärke. Die helle oder dunkle Variante folgt der Hintergrundfarbe der View. Diese Auswahlmöglichkeiten entsprechen den [System-Blur-Materialien](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial) von Apple.

```rust tabs
view().backdrop_blur(px(30.0)).backdrop_material(BackdropMaterial::Regular)
```

```tsx tabs
<View ios={{ backdropMaterial: "regular" }} style={{ height: 64, backdropFilter: "blur(30px)" }} />
```

`glassEffect` zeichnet ab iOS 26 und macOS 26 Liquid Glass hinter dem Inhalt einer View. `"regular"` verwendet das Standardmaterial; `"clear"` übernimmt weniger Farbe vom Hintergrund. Kombiniere es mit `backdropFilter` für den Blur, der auf früheren iOS-Versionen und anderen Plattformen angezeigt wird. Das Glas folgt der Größe und den abgerundeten Ecken der View.

```tsx
<View style={{ height: 80, borderRadius: 16, backdropFilter: "blur(12px)", glassEffect: "regular" }} />
```

<a id="outlines-opacity-and-visibility"></a>

## Outlines, Deckkraft und Sichtbarkeit

- `outlineWidth`, `outlineColor`, `outlineStyle`, `outlineOffset` (`.outline(..)`, `.outline_color(..)`, `.outline_dashed()`, `.outline_offset(..)`): eine Linie außerhalb des Rahmens, die keinen Platz einnimmt (negative Offsets zeichnen innen). `outlineStyle: "none"` (oder `"hidden"`, `.outline_none()`) blendet die Outline unabhängig von ihrer Breite aus, wie in CSS.
- `opacity` (`.opacity(n)`): 0 bis 1, angewendet auf die View und ihre Children.
- `visibility: "hidden"` (`.invisible()` in Rust): Die View wird nicht gezeichnet, behält aber ihren Platz, und Screenreader überspringen sie und ihren Teilbaum, wie in einem Browser. `display: "none"` (`.hidden()`) entfernt sie aus dem Layout.
- `zIndex` (`.z_index(n)`): die Reihenfolge unter Siblings, zugleich die native Stapelreihenfolge (stabil bei gleichen Werten).
- `cursor` (`.cursor(..)`, `.cursor_pointer()`): die Form des Mauszeigers über der View, für Zeigergeräte und Desktops.
<a id="transforms"></a>

## Transformationen

Transformationen entsprechen denen von CSS. In TSX sind `translate`, `rotate` und `scale` eigene Properties, und `transform` nimmt den String aus Funktionen von CSS oder eine Liste von Schritten; sie werden in der Reihenfolge von CSS zusammengesetzt, `translate`, dann `rotate`, dann `scale`, dann `transform`, unabhängig von der Reihenfolge der Keys. In Rust sind Transformationen Methoden (`.translate_x(..)`, `.rotate(..)`, `.scale(..)`, ...), die in derselben Reihenfolge zusammengesetzt werden:

```rust tabs
view().translate_x(px(20.0)).rotate(deg(-8.0)).scale(0.9)
view().perspective(px(600.0)).child(view().rotate_y(deg(35.0)).backface_hidden())
view().origin_top_left().rotate(deg(30.0))
```

```tsx tabs
<View style={{ translate: "20px 0", rotate: "-8deg", scale: 0.9 }} />
<View style={{ transform: "perspective(600px) rotateY(35deg)", backfaceVisibility: "hidden" }} />
<View style={{ transformOrigin: "top left", rotate: "30deg" }} />
```

| Property | Wert |
|---|---|
| `translate` | `"10px 20px"`, `"-50% 0"` (Prozentwerte der eigenen Größe der View), eine Zahl (Punkte entlang x) oder `[x, y]` mit einer Zahl, einem String oder einem animierten Wert pro Achse |
| `rotate` | `"45deg"`, `"0.25turn"`, um eine Achse `"x 90deg"`, eine Zahl (Grad) oder ein animierter Wert (Grad) |
| `scale` | `1.5`, `"150%"`, `"1 2"` (x und y), ein animierter Wert (beide Achsen) oder `[x, y]` |
| `transform` | Funktionen von CSS: `translate()`, `translateX()`, `translateY()`, `scale()`, `scaleX()`, `scaleY()`, `rotate()` / `rotateZ()`, `rotateX()`, `rotateY()`, `skew()`, `skewX()`, `skewY()`, `perspective()`; Längen in `px` (Translationen auch `%`), Winkel in `deg`, `rad` oder `turn`; `"none"`; oder eine Liste von Schritten (`[{ perspective: 800 }, { rotateY: angle }]`), deren Beträge animierte Werte sein dürfen |

Jede ist eine eigene Property, wie bei Klassen: das `scale` eines Styles ersetzt eine `scale-95`-Klasse und behält deren `rotate-3`. Animierte Werte bewegen `translate`, `rotate` und `scale` nativ; für das, was der String von CSS mit einem animierten Betrag nicht fassen kann, etwa eine 3D-Rotation, gib `transform` eine Liste von Schritten: `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, `rotate` (`rotateZ`), `rotateX`, `rotateY`, `skewX`, `skewY` und `perspective` ([Animation](./animation.md)). Das `transform` eines Styles ist die eine oder die andere Form, daher ist eine Perspektive vor animierten Schritten ein Schritt der Liste.

Rusts `.perspective(..)` ist die `perspective`-Property von CSS, wie Tailwinds `perspective-*`: Sie gibt den Children der View ihre Tiefe, während die `perspective()`-Funktion eines `transform` auf die eigene Transformation der View wirkt. `transformOrigin` nimmt Keywords, Prozentwerte und Längen (`"top left"`, `"50% 0"`, `[10, 20]`; `.origin_top_left()`, `.transform_origin(..)` in Rust); der Standard ist die Mitte. Transformationen beeinflussen das Layout nicht: Geschwister werden platziert, als wäre die View nicht transformiert.

Android unterstützt keine Skew-Transformationen.

## Transitions

Eine View animiert Änderungen ihres eigenen Styles, wenn du angibst, was animiert werden soll. Die Animation läuft nativ; kein Code von dir läuft pro Frame.

```rust tabs
let open = signal(false);

view()
    .on_press(move || open.update(|o| *o = !*o))
    .w(px(150.0))
    .h(px(72.0))
    .rounded(move || px(if open.get() { 36.0 } else { 12.0 }))
    .bg(move || if open.get() { rgb(0x8250df) } else { rgb(0x54aeff) })
    .translate_x(move || px(if open.get() { 120.0 } else { 0.0 }))
    .transition_all()
    .duration(300.0)
    .ease_in_out()
```

```tsx tabs
<View
  onPress={() => open.set(!open())}
  style={{
    width: 150,
    height: 72,
    borderRadius: open() ? 36 : 12,
    backgroundColor: open() ? "#8250df" : "#54aeff",
    translate: open() ? 120 : 0,
    transitionProperty: "all",
    transitionDuration: 300,
    transitionTimingFunction: "ease-in-out",
  }}
/>
```

| Property | Wert | Rust |
|---|---|---|
| `transitionProperty` | Was animiert wird: `"all"` oder durch Kommas getrennte Namen: Farben (`"colors"`, `"backgroundColor"`, `"borderColor"`, ...), `"opacity"`, `"transform"` (jede Transform-Property), `"boxShadow"`, `"borderRadius"` / `"borderWidth"` | `.transition()`, `.transition_all()`, `.transition_colors()`, `.transition_opacity()`, `.transition_transform()`, `.transition_shadow()` |
| `transitionDuration` | `300`, `"300ms"`, `"0.3s"` | `.duration(300.0)` |
| `transitionDelay` | Wie bei der Dauer | `.delay(100.0)` |
| `transitionTimingFunction` | `"linear"`, `"ease"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"cubic-bezier(x1, y1, x2, y2)"` | `.ease_linear()`, `.ease_in()`, `.ease_out()`, `.ease_in_out()`, `.ease_bezier(x1, y1, x2, y2)` |

Größen und Positionen gehören zum Layout, nicht zum Style, und werden nicht per Transition animiert; animiere Layout-Änderungen mit `LayoutAnimation` oder steuere Werte mit nativen Animationen ([Animation](./animation.md)).

<a id="keyframe-animations"></a>

### Keyframe-Animationen

`animationName` führt eine der eingebauten Keyframe-Animationen von Tailwind nativ aus: `"spin"`, `"ping"`, `"pulse"` oder `"bounce"`, mit `animationDuration`, `animationDelay`, `animationTimingFunction` und `animationIterationCount` (eine Zahl oder `"infinite"`), in beliebiger Reihenfolge. In Rust führen `.animate_spin()`, `.animate_ping()`, `.animate_pulse()` und `.animate_bounce()` sie mit dem Timing von Tailwind aus, und `.animation(KeyframeAnimation::new(..))` mit deinem eigenen:

```rust tabs
view()
    .size(px(24.0))
    .rounded(px(4.0))
    .bg(rgb(0x0969da))
    .animation(KeyframeAnimation::new(Keyframes::Spin).duration(1000.0).easing([0.0, 0.0, 1.0, 1.0]))
```

```tsx tabs
<View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#0969da", animationName: "spin", animationDuration: 1000, animationIterationCount: "infinite", animationTimingFunction: "linear" }} />
```

## Press-Feedback

Press-Feedback sind die Styles der App für den gedrückten Zustand, nativ angewendet ohne Round Trip zu deinem Code; der Hover-, der Fokus- und der Disabled-Zustand nehmen Styles auf dieselbe Weise an (`.hover(..)`, `.focus(..)`, `.disabled_style(..)` in Rust; `hoverStyle`, `focusStyle` und `disabledStyle` oder `hover:`, `focus:`, `disabled:` in TSX):

| Rust | TSX | Effekt im gedrückten Zustand |
|---|---|---|
| `.active(\|s\| s.opacity(0.6))` | `activeStyle={{ opacity: 0.6 }}` | Die View blendet zu dieser Opacity über |
| `.active(\|s\| s.bg(rgb(0xeaeef2)))` | `activeStyle={{ backgroundColor: "#eaeef2" }}` | Der Hintergrund nimmt diese Farbe an |
| `.ripple(Ripple { color: Some(rgba(0x00000022).into()), ..Ripple::default() })` | `android={{ ripple: { color: "#0002" } }}` | Material-Ripple von Android |
| `.active(\|s\| s.bg(ZINC.shade(100)).scale(0.95))` | `class="active:bg-zinc-100 active:scale-95"` | Beliebiger Style |

Siehe [Touch und Gesten](./touch-and-gestures.md).

<a id="extensions"></a>

## Erweiterungen

Diese Keys und Klassen bieten, was native Plattformen über CSS hinaus leisten:

| Key | Klasse | Was sie bewirken |
|---|---|---|
| `placeholderColor` | `placeholder:text-*` | Die Placeholder-Farbe eines `<Input>` |
| `selectionColor` | `selection:bg-*` | Die Auswahlhervorhebung eines `<Input>` oder eines auswählbaren `<Text>` |
| `tintColor` | `tint-*` | Färbt die opaken Pixel eines `<Image>` um (Template-Images, Icons) |
| `borderCurve` | | `"continuous"`: Ecken, die weich in die Kanten übergehen, wie die des Systems (Apples Continuous Corners) |
| `glassEffect` | | Apples Liquid Glass hinter der View unter iOS 26 und macOS 26, andernfalls `backdropFilter` |
| `writingDirection` | | Die Basisrichtung eines Textes, `"auto"` (der Standard: aus seinem Inhalt, wie es die Text-Views der Plattformen tun), `"ltr"` oder `"rtl"`; `direction` legt die des Layouts fest |
| `textAlignVertical` | | Wo Text sitzt, der kürzer als seine `<Text>`-Box ist: `"top"` (der Standard), `"center"` oder `"bottom"` |
| `textAlign: "auto"` | | Die natürliche Seite des Textes, abhängig von seiner Richtung (der Standard) |
| `selectedStyle` | `selected:` | Der Style, solange `accessibilityState.selected` `true` ist (ein ausgewählter `Button`, ein Tab) |
| | `ios:`, `android:`, `web:` | Klassen für eine Plattform (`ios:pt-2`) |

Werte, die sich ändern, nehmen auch Zahlen an, wo CSS einen String erwartet: `transform` als Liste von Schritten, `translate` und `scale` als `[x, y]`, `boxShadow` und `textShadow` als Layer.

<a id="related"></a>

## Siehe auch

- [Tailwind](./tailwind.md): dieselben Styles als Klassen, mit Varianten für Dark Mode, gedrückte Zustände und Breakpoints sowie deren typisierte Entsprechungen.
- [Layout](./layout.md) und [Text](./text.md).
- [Style-Referenz](../modules/style-reference.md): jede Style-Property und ihr Typ.
