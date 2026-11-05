---
title: "ColorPicker"
description: "Le composant ColorPicker et ses parties : une couleur choisie sur une zone de saturation et de luminosité, sur des curseurs pour n'importe quel canal de RGB, HSL, HSB ou OKLCH et pour l'alpha, saisie sous n'importe quelle forme CSS, sélectionnée parmi des échantillons ou prélevée à l'écran avec une pipette, avec les touches WAI-ARIA et des éléments ajustables pour les lecteurs d'écran, mise en page et stylisée par l'application."
group: base
demo: el-color-picker
source_hash: b821e71f23b012af
---

# ColorPicker

Un sélecteur de couleur détient une couleur, et les parties qu'il contient l'affichent et la modifient : une `ColorArea` de saturation et de luminosité, des `ColorSlider` pour n'importe quel canal de RGB, HSL, HSB ou OKLCH et pour l'alpha, des `ColorField` qui prennent la couleur sous forme de texte ou un canal sous forme de nombre, des `ColorSwatch` de couleurs prédéfinies et une `ColorEyeDropper` qui choisit une couleur n'importe où à l'écran. L'app dispose les parties avec ses propres éléments intercalés (une ligne par canal avec sa lettre, l'espace choisi avec `Tabs`, le sélecteur dans un `Popover`), et style chacune d'elles : les parties dessinent les couleurs des canaux, et chaque taille, rayon, bordure et ombre revient à l'app.

```rust tabs
use nsh_base::{
    ColorChannel, ColorPickerEvent, ColorSpace, color_area, color_field, color_picker,
    color_slider, color_swatch, theme,
};
use nsh_core::prelude::*;

fn primary(color: Signal<Hsla>) -> impl IntoElement {
    // A channel of OKLCH: its letter, its slider, its number.
    let channel = move |channel: ColorChannel, letter: &'static str| {
        view()
            .flex_row()
            .items_center()
            .gap_2()
            .child(text(letter).w(px(14.0)).text_sm().text_color(move || theme().muted_foreground))
            .child(
                color_slider()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .flex_1()
                    .h(px(18.0))
                    .justify_center()
                    .px(px(8.0))
                    .track_style(|s| s.h(px(10.0)).rounded_full())
                    .thumb_style(|s| s.size(px(16.0)).rounded_full().border_2().border_color(white()))
                    .fill_thumb(true),
            )
            .child(
                color_field()
                    .color_space(ColorSpace::Oklch)
                    .channel(channel)
                    .accessibility_label(letter)
                    .w(px(64.0))
                    .h(px(28.0))
                    .px_2()
                    .rounded_md()
                    .border_1()
                    .border_color(move || theme().border)
                    .text_sm(),
            )
    };
    color_picker()
        .value(move || Some(color.get()))
        .on_change(move |e: &ColorPickerEvent| {
            if let ColorPickerEvent::Change(value, _) = e {
                color.set(*value);
            }
        })
        .gap_3()
        .child(
            color_area()
                .accessibility_label("Saturation and brightness")
                .h(px(160.0))
                .panel_style(|s| s.rounded_lg())
                .thumb_style(|s| s.size(px(18.0)).rounded_full().border_2().border_color(white()))
                .fill_thumb(true),
        )
        .child(channel(ColorChannel::Lightness, "L"))
        .child(channel(ColorChannel::Chroma, "C"))
        .child(channel(ColorChannel::Hue, "H"))
        .child(color_swatch().size(px(28.0)).rounded_md())
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { type ColorChannel, ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch } from "nsh/base";

const thumb = "rounded-full border-2 border-white";

function Channel(props: { channel: ColorChannel; letter: string }) {
  return (
    <View class="flex-row items-center gap-2">
      <Text class="w-[14px] text-sm text-muted-foreground">{props.letter}</Text>
      <ColorSlider
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="flex-1 h-[18px] justify-center px-2"
        trackClass="h-[10px] rounded-full"
        thumbClass={`size-4 ${thumb}`}
        fillThumb
      />
      <ColorField
        colorSpace="oklch"
        channel={props.channel}
        accessibilityLabel={props.letter}
        class="w-16 h-7 px-2 rounded-md border border-border text-sm text-right"
      />
    </View>
  );
}

function App() {
  const primary = signal("oklch(54.6% 0.215 262.9)");
  return (
    <ColorPicker value={primary()} format="oklch" onChange={({ formatted }) => primary.set(formatted)} class="gap-3">
      <ColorArea accessibilityLabel="Saturation and brightness" class="h-40" panelClass="rounded-lg" thumbClass={`size-[18px] ${thumb}`} fillThumb />
      <Channel channel="lightness" letter="L" />
      <Channel channel="chroma" letter="C" />
      <Channel channel="hue" letter="H" />
      <View class="flex-row items-center gap-2">
        <ColorSwatch class="size-7 rounded-md" />
        <Text class="font-mono text-sm">{`--primary: ${primary()}`}</Text>
      </View>
    </ColorPicker>
  );
}

mount(App);
```

`ColorPicker`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatch` et `ColorEyeDropper` proviennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `color_picker()` et les fonctions de ses parties les construisent avec un setter par prop (`.channel(..)`, `.thumb_style(..)`), une méthode d'écoute par événement (`.on_change(..)`) et les méthodes de style typées ; la couleur est un `Hsla`, les espaces, canaux et formats sont des `ColorSpace`, `ColorChannel` et `ColorFormat`.

<a id="value"></a>

## Valeur

La couleur est une couleur CSS : hexadécimal (`#3b82f6`, `#3b82f680` avec son alpha), `rgb()`, `hsl()`, `hsb()`, `oklch()` ou un nom CSS ; en Rust, un `Hsla`. L'app la possède avec `value` et définit celle que `onChange` signale, comme pour tout contrôle de `nsh/base` ; ou bien elle laisse la couleur au sélecteur avec `defaultValue` et entend malgré tout les changements.

- `onChange({ value, formatted })` signale chaque couleur que l'utilisateur demande : à chaque étape d'un glissement sur la zone ou sur un curseur, à chaque touche, au fil de la saisie du nombre d'un champ, à l'appui sur un échantillon. `value` est la couleur, `formatted` la même couleur écrite comme l'indique `format` (`"hex"`, `"rgb"`, `"hsl"`, `"hsb"` ou `"oklch"`), prête à être enregistrée ou définie comme token.
- `onChangeEnd({ value, formatted })` signale la couleur à laquelle le changement s'est terminé, une seule fois : quand le pointeur se relève, après chaque touche, quand un champ est quitté ou validé, quand un échantillon est pressé.
- Le sélecteur conserve la couleur dans chaque espace telle que l'utilisateur l'a définie. Un gris garde sa teinte et sa saturation, de sorte que le curseur de teinte reste là où l'utilisateur l'a laissé ; une couleur modifiée en OKLCH garde sa luminosité, sa chroma et sa teinte telles que saisies, y compris au-delà de ce que sRGB affiche (la couleur signalée est la plus proche que sRGB affiche, et `formatted` dans `"oklch"` conserve les canaux).
- Une `value` définie par l'app et que le sélecteur n'a pas signalée remplace la couleur dans tous les espaces.

<a id="spaces-and-channels"></a>

## Espaces et canaux

| `colorSpace` | Canaux (`channel`) | Plages |
|---|---|---|
| `"rgb"` | `"red"`, `"green"`, `"blue"` | 0 à 255 |
| `"hsl"` | `"hue"`, `"saturation"`, `"lightness"` | teinte 0 à 360, les autres 0 à 100 |
| `"hsb"` | `"hue"`, `"saturation"`, `"brightness"` | teinte 0 à 360, les autres 0 à 100 |
| `"oklch"` | `"lightness"`, `"chroma"`, `"hue"` | luminosité 0 à 100 (par pas de 0,1), chroma 0 à 0,4 (par pas de 0,001), teinte 0 à 360 (par pas de 0,1) |
| tous | `"alpha"` | 0 à 100 |

La piste d'un curseur dessine les couleurs de son canal, les autres canaux restant fixes, afin de montrer où mène chaque valeur. Un canal que son espace n'a pas est remplacé par le premier canal de l'espace (un avertissement le signale).

## Props

<a id="colorpicker-1"></a>

### ColorPicker

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | aucun | La couleur (contrôlée). L'app définit celle que `onChange` signale. |
| `defaultValue` | `.default_value(..)` | `string` | `"#000000"` | La couleur initiale tant que `value` n'est pas définie ; le sélecteur garde alors la sienne. |
| `format` | `.format(..)` | `"hex" \| "rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hex"` | La façon dont `formatted` écrit la couleur. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun changement depuis aucune partie ; les classes `disabled:` s'appliquent au sélecteur et à ses parties. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Les parties et les éléments de l'app placés entre elles. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le sélecteur lui-même : la colonne (ou la ligne) autour de ses parties. |

### ColorArea

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `panelClass`, `panelStyle` | `.panel_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le panneau, qui remplit la zone : les couleurs de la teinte, la saturation de gauche à droite (de droite à gauche dans une disposition de droite à gauche) et la luminosité de bas en haut, rognées à ses coins. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le pouce, centré sur la couleur. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | L'arrière-plan du pouce est la couleur. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun changement par pointeur, clavier ou lecteur d'écran. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent pour le pouce. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La zone : sa taille revient à l'app. |

### ColorSlider

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `colorSpace` | `.color_space(..)` | `"rgb" \| "hsl" \| "hsb" \| "oklch"` | `"hsb"` | L'espace du canal. |
| `channel` | `.channel(..)` | `ColorChannel` | `"hue"` | Le canal qu'il modifie : l'un de ceux de l'espace, ou `"alpha"`. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La direction de la piste : la plus petite valeur au début (à gauche, à droite dans une disposition de droite à gauche), ou en bas. Lue à la création du curseur. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | La piste : les couleurs du canal le long de celle-ci, rognées à ses coins ; le pouce y est placé. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le pouce, centré sur la valeur. |
| `fillThumb` | `.fill_thumb(..)` | `boolean` | `false` | L'arrière-plan du pouce est la couleur (avec son alpha sur un curseur d'alpha). |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | aucun | La couleur d'un damier sous la piste, qui transparaît à travers les couleurs d'un curseur d'alpha. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | Le côté des carrés du damier. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun changement par pointeur, clavier ou lecteur d'écran. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent pour le pouce. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le curseur : la bande autour de la piste qui reçoit les appuis et les glissements. |

### ColorField

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `channel` | `.channel(..)` | `ColorChannel` | aucun | Le canal qu'il prend sous forme de nombre. Sans cette prop, le champ prend la couleur entière sous forme de texte. |
| `colorSpace` | `.color_space(..)` | `ColorSpace` | `"hsb"` | L'espace de `channel`. |
| `format` | `.format(..)` | `ColorFormat` | `"hex"` | La façon dont le champ écrit la couleur entière. Il lit toute forme CSS. |
| `placeholder` | `.placeholder(..)` | `string` | aucun | Affiché tant que le champ est vide. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucune saisie. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent pour le champ. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<TextStyle>` | aucun | Le champ, une zone de saisie de texte. |

Le champ d'un canal modifie la couleur au fil de la saisie d'un nombre, borné à la plage du canal ; le champ de la couleur entière la modifie quand il est quitté ou validé, si le texte se lit comme une couleur. Quitter un champ réécrit sa valeur dans sa forme.

### ColorSwatch

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `color` | `.color(..)` | `string` | aucun | La couleur qu'il montre ; un appui la choisit dans le sélecteur qui l'entoure. Sans cette prop, la couleur propre du sélecteur : un aperçu. |
| `selectedStyle` | `.selected_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style appliqué quand il porte la couleur du sélecteur, sous forme de classes `selected:`. |
| `checkerboardColor` | `.checkerboard_color(..)` | `string` | aucun | Un damier sous une couleur translucide. |
| `checkerboardSize` | `.checkerboard_size(..)` | `number` | `4` | Le côté de ses carrés. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun appui. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | la couleur en hexadécimal | Ce que les lecteurs d'écran annoncent. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Contenu par-dessus la couleur : une coche sur l'échantillon sélectionné (`group-selected:`). |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | L'échantillon : sa taille, sa forme et sa bordure ; ses coins rognent la couleur. |

### ColorEyeDropper

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun appui. Il est aussi désactivé là où la plateforme n'a pas de pipette. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Son contenu : l'icône ou le libellé de l'app. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le bouton. |

Un appui affiche la pipette du système : le sélecteur de couleur d'AppKit sur macOS, `EyeDropper` du navigateur sur le web (Chrome et Edge). La couleur choisie devient celle du sélecteur (`onChange`, puis `onChangeEnd`) ; Escape n'en choisit aucune. Là où la plateforme n'a pas de pipette, le bouton est désactivé, et `disabled:hidden` le masque.

<a id="events"></a>

## Événements

| Événement | De | Rust | Charge utile | Quand |
|---|---|---|---|---|
| `onChange` | `ColorPicker` | `.on_change(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | L'utilisateur a changé la couleur. |
| `onChangeEnd` | `ColorPicker` | `.on_change_end(\|e: &ColorPickerEvent\| ..)` | `({ value: string, formatted: string })` | Le changement est terminé. Une fois par changement. |
| `onPress` | `ColorSwatch` | `.on_press(\|color: &Hsla\| ..)` | `({ color: string })` | L'échantillon a été pressé ; il fonctionne aussi seul, comme pastille d'une palette. |
| `onPick` | `ColorEyeDropper` | `.on_pick(\|color: &Hsla\| ..)` | `({ color: string })` | L'utilisateur a choisi une couleur à l'écran ; fonctionne aussi seul. |

En Rust, `ColorPickerEvent::Change(Hsla, SharedString)` et `ColorPickerEvent::ChangeEnd(Hsla, SharedString)` portent la couleur et son texte `formatted`.

<a id="parts"></a>

## Parties

| Partie | Dans | Stylée avec |
|---|---|---|
| `ColorArea` | le sélecteur | `class`, `style` |
| Le panneau de la zone | la zone, qu'il remplit | `panelClass`, `panelStyle` |
| Le pouce de la zone | la zone, centré sur la couleur | `thumbClass`, `thumbStyle` |
| `ColorSlider` | le sélecteur | `class`, `style` |
| La piste du curseur | le curseur | `trackClass`, `trackStyle` |
| Le pouce du curseur | le curseur, centré sur la valeur sur la piste | `thumbClass`, `thumbStyle` |
| `ColorField` | le sélecteur | `class`, `style` |
| `ColorSwatch` | le sélecteur, ou seul | `class`, `style`, `selectedStyle` |
| `ColorEyeDropper` | le sélecteur, ou seul | `class`, `style` |

Le pouce d'un curseur est centré sur les extrémités de la piste aux extrémités du canal. Un padding sur le curseur égal à la moitié de la largeur du pouce (`h-6 justify-center px-2.5` autour d'une piste `h-3`) garde le pouce entier à l'intérieur du curseur, où il reçoit les appuis aux deux extrémités. États que montrent les parties : `active:` d'un pouce pendant qu'il est glissé et `focus:` avec le focus clavier, `selected:` d'un échantillon, et `disabled:` de chaque partie.

<a id="keyboard"></a>

## Clavier

Sur macOS et le web, chaque pouce est un arrêt du focus clavier (Tab) :

| Touche | Sur un curseur | Sur la zone |
|---|---|---|
| Droite, Haut | Un pas en plus | Droite : plus de saturation ; Haut : plus de luminosité |
| Gauche, Bas | Un pas en moins | Gauche : moins de saturation ; Bas : moins de luminosité |
| Maj avec une flèche | Dix pas | Dix pas |
| Page Up, Page Down | Dix pas | Dix pas de luminosité |
| Début, Fin | Les extrémités du canal | |

Dans une disposition de droite à gauche, un curseur horizontal et la zone vont à partir de la droite, la plus petite valeur (la moindre saturation) se trouvant à l'extrémité droite : Gauche est un pas en plus et Droite un pas en moins, et un appui ou un glissement choisit la valeur sous le pointeur telle qu'elle est dessinée. Un curseur vertical garde Droite et Haut comme un pas en plus ; Haut et Bas sur la zone gardent la luminosité.

Un échantillon réagit à Espace et Retour. Chaque touche signale `onChange` puis `onChangeEnd` ; les flèches se répètent tant qu'elles sont maintenues.

<a id="accessibility"></a>

## Accessibilité

- Le pouce de la zone et celui de chaque curseur sont des éléments ajustables (`"adjustable"`, un slider dans le navigateur) avec leur libellé, leur valeur et leur plage ; l'incrémentation et la décrémentation des lecteurs d'écran les font avancer par pas.
- Chaque champ est un champ de texte avec son libellé ; chaque échantillon est un bouton, sélectionné tant qu'il porte la couleur du sélecteur, nommé par sa couleur en hexadécimal sauf si `accessibilityLabel` le nomme. La pipette est un bouton avec le libellé de l'app.
- Lorsqu'elles sont désactivées, les lecteurs d'écran annoncent les parties comme grisées, et elles n'acceptent aucune action.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les actions en général.

<a id="platform-notes"></a>

## Notes sur les plateformes

- Chaque plateforme dessine ce que l'app style ; les couleurs des pistes et du panneau sont des dégradés dessinés par la plateforme. Les appuis et les glissements sont suivis dans le cœur, pour une souris, un stylet ou un doigt, et une vue défilante autour du sélecteur conserve son défilement pour les glissements qui commencent ailleurs.
- `ColorEyeDropper` choisit avec le sélecteur de couleur d'AppKit sur macOS et `EyeDropper` du navigateur sur le web ; la couleur arrive en sRGB.
