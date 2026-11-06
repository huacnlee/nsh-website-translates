---
title: "Schriftarten"
description: "Die Systemschriftart und generische Familien, Fallback-Listen, das Ausliefern von .ttf-, .otf-, .woff- und .woff2-Dateien aus den Assets eines Rust-Crates oder über TSX-Imports, Familien mit mehreren Schriftschnitten und Kursivvarianten sowie Schriftarten in typisierten Styles und Tailwind-Klassen."
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---


# Schriftarten

Text verwendet die Systemschrift (San Francisco unter iOS, Roboto unter Android), sofern keine Schriftfamilie etwas anderes vorgibt (`.font_family(..)` in Rust, `fontFamily` in TSX). Eine Familie kann eine generische Familie, eine auf dem Gerät installierte Schrift oder eine Schriftdatei sein, die du mit der App auslieferst.

<a id="system-and-generic-families"></a>

## Systemfamilien und generische Familien

| `fontFamily` | Schriftart |
|---|---|
| (keine), `"system-ui"`, `"sans-serif"`, `"ui-sans-serif"`, `"-apple-system"` | Die Systemschrift |
| `"serif"`, `"ui-serif"` | Die System-Serifenschrift (New York unter iOS, Noto Serif unter Android) |
| `"monospace"`, `"ui-monospace"` | Die Monospace-Systemschrift (SF Mono unter iOS) |
| `"ui-rounded"` | Die abgerundete Systemschrift (SF Pro Rounded), nur iOS |

Die Systemschrift unterstützt jede Stärke von 100 bis 900. Die Tailwind-Klassen `font-sans`, `font-serif` und `font-mono` entsprechen den ersten drei Zeilen, `font-sans` und `font-mono` den Schriftarten des Themes, sofern es sie festlegt ([Eine Standardschrift für die App](#a-default-font-for-the-app)).

Eine auf dem Gerät installierte Familie kann direkt benannt werden (`"Georgia"`, `"Avenir Next"` unter iOS). Die installierten Schriftarten unterscheiden sich zwischen Plattformen und Versionen. Liefere daher die Schriftarten mit, von denen dein Design abhängt. Unter iOS fällt eine nicht vorhandene Familie mit einer Warnung im Log (`font family 'X' is not available`) auf die Systemschrift zurück. Gib eine Liste an, um festzulegen, was stattdessen verwendet wird ([Fallback-Listen](#fallback-lists)).

<a id="shipping-a-font"></a>

## Eine Schriftart mitliefern

Ein Rust-Crate liefert die Dateien seines Verzeichnisses `assets/` aus: `registry.assets(assets!())` in seiner Funktion `#[native_module]` liefert sie alle aus, und `asset!("fonts/Pacifico-Regular.ttf")` ist ein `FontAsset`, dessen `family` der Familienname der Schrift ist, der beim Kompilieren des Crates aus der Datei gelesen wird. In TSX importierst du eine `.ttf`-, `.otf`-, `.woff`- oder `.woff2`-Datei: Der Import wird zum Familiennamen der Schrift ausgewertet. In beiden Fällen wird die Schrift vor dem ersten Frame registriert und steht somit bereit, wenn Text zum ersten Mal gerendert wird. WOFF- und WOFF2-Dateien sind komprimierte TrueType- oder OpenType-Schriften (eine WOFF2-Datei ist oft nur halb so groß wie ihr TrueType-Pendant, was Paketgröße der App und Downloads im Web spart). NSH liest sie auf jeder Plattform als die Schriften, die sie enthalten:

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` und der TSX-Import `Pacifico` sind der String `"Pacifico"`: der in der Schriftdatei gespeicherte Familienname (ihr typografischer Familienname, ersatzweise ihr Familienname), nicht der Dateiname. Wenn du den Wert des Assets verwendest, statt den Namen von Hand zu schreiben, bleiben beide synchron. Eine fehlende oder defekte Datei lässt den Rust-Build fehlschlagen, und eine importierte Datei wird garantiert gebündelt.

Die Dateien werden wie jedes andere [Asset](./images-and-assets.md) mit der App ausgeliefert. Schriftarten werden nur für den Prozess der App registriert; sie werden nicht auf dem Gerät installiert.

> [!WARNING]
> In TSX wird ein Import, dessen Wert nie verwendet wird, durch das Import Elision von TypeScript entfernt, und mit ihm die Schrift. Wenn du eine Familie nur über ihren Namen referenzierst (zum Beispiel im Tailwind-Theme), importiere die Datei wegen ihres Seiteneffekts: `import "./fonts/Inter-Bold.ttf";`. Ein Rust-Crate liefert jede Datei aus `assets/` über `assets!()` aus.

<a id="fallback-lists"></a>

## Fallback-Listen

`fontFamily` nimmt wie CSS eine Liste entgegen: Familien durch Kommas getrennt, die bevorzugte zuerst, ein Name mit Leerzeichen mit oder ohne Anführungszeichen (`"Brand, 'Noto Sans SC', sans-serif"`), ein Name in Anführungszeichen behält seine Kommas (`'ACME, Inc'`). Text wird in der ersten Familie gesetzt, die die Plattform kennt. Ein Zeichen, das diese Familie nicht enthält (eine andere Schrift, ein Symbol), stammt aus der nächsten Familie der Liste, die es hat, danach aus den Fallback-Schriften des Systems. Mit einer Liste kann eine Markenschrift, die nur Latein abdeckt, chinesische Zeichen in einer passenden Schrift anzeigen, oder eine Schrift, die die App herunterlädt, kann mit einer Systemschrift kombiniert werden, die bis zu ihrem Eintreffen angezeigt wird:

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

Jede Plattform behält die Reihenfolge der Liste mit ihrer eigenen Schriftverarbeitung bei: eine Cascade-Liste unter iOS und macOS, ein Font Fallback unter Windows (einer pro Absatz: die Liste seines ersten Stils), eine Pango-Familienliste unter Linux, die des Browsers im Web, die Fallbacks von GPUI. Unter Android wird Text in der ersten Familie gesetzt, die vorhanden ist. Ist diese eine von der App registrierte Schrift, sind die in der Liste folgenden registrierten Schriften ihre Fallbacks (Android 10 und höher).

<a id="weights-and-italics"></a>

## Schriftstärken und Kursivschrift

Eine Familie besteht meist aus mehreren Dateien, je eine pro Stärke und Stil. Liefere jede davon aus (in Rust legst du sie in `assets/` ab, in TSX importierst du jede einzeln). Sie werden unter demselben Familiennamen registriert, und Stärke und Stil wählen die Schnittvariante aus:

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

Wenn keine registrierte Variante exakt die angeforderte Stärke hat, wird die nächstliegende verwendet. Fehlt eine Variante, verhalten sich die Plattformen unterschiedlich:

| | iOS | Android |
|---|---|---|
| Stärke ohne passende Variante | Die nächstliegende registrierte Variante | Die nächstliegende Variante, mit Androids synthetischem Fett, wo es zutrifft |
| Kursiv ohne kursive Variante | Die aufrechte Variante (keine Schrägstellung) | Eine geneigte Version der aufrechten Variante |

Liefere die Varianten aus, die du verwendest, um auf beiden Plattformen dasselbe Ergebnis zu erhalten.

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## Schriftarten in typisierten Styles und Tailwind-Klassen

In Rust akzeptiert `.font_family(..)` überall dort die Familie des Assets, wo ein Style stehen kann, und die Methoden für die Stärke (`.font_weight(FontWeight::SEMIBOLD)`) wählen die Varianten aus. Für Klassen benennst du deine Familien im Tailwind-Theme in `nsh.json`, um sie als `font-*`-Klassen zu verwenden:

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

Eine beliebige Familie funktioniert auch ohne Theme-Eintrag: `font-[Pacifico]`. Stärkeklassen (`font-light`, `font-semibold`, `font-bold`, ...) wählen Varianten so aus wie `fontWeight`. Textstile auf einer View werden an die darin enthaltenen Texte weitergegeben, sodass `.font_family(INTER.family)` auf einer View oder `<View class="font-body">` die Familie für einen ganzen Screen festlegt.

<a id="a-default-font-for-the-app"></a>

## Eine Standardschrift für die App

Das `font-sans` des Themes ist die Schrift der App: Jeder Text, der keine eigene Familie festlegt, wird damit gezeichnet, in Rust-Komponenten wie in TSX, so wie eine Webseite mit Tailwinds `--font-sans`. `font-mono` ist die Monospace-Schrift der Klasse `font-mono` und von Code in `TextView`. Lege sie im Theme der App fest (`"theme"` in `nsh.json`, [Rust](./rust.md#theme)) und liefere die Schriftdateien wie oben beschrieben aus:

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

Die erste Familie der Liste, die nicht generisch ist, ist die Schrift. Eine generische erste Familie (`system-ui`, `sans-serif`) ist die Systemschrift. Die Schrift kann auch auf einem Container festgelegt werden: Die darin enthaltenen Texte erben sie.

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## Schriftfeatures

`fontVariant` aktiviert OpenType-Features der Schrift: `"tabular-nums"`, `"proportional-nums"`, `"lining-nums"`, `"oldstyle-nums"` und `"small-caps"` (`.tabular_nums()`, `.small_caps()`, ... in Rust; [Text](./text.md#text-styles)). Die Schrift muss sie enthalten; Systemschriften tun das.

<a id="related"></a>

## Siehe auch

- [Text](./text.md): Textstile, Größen und die Texteinstellung des Systems für die Schriftgröße.
- [Tailwind](./tailwind.md#theme): die Theme-Schlüssel.
- [Images and assets](./images-and-assets.md): wie die Dateien der App ausgeliefert werden.
