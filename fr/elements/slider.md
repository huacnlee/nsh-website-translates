---
title: "Slider"
description: "Le composant Slider : une valeur, ou une plage de deux valeurs, choisie le long d'une piste, avec des appuis et des glissements sur les écrans tactiles et à la souris, les touches de slider de WAI-ARIA et une valeur pour les lecteurs d'écran sur chaque curseur, ainsi qu'une piste, un indicateur, une plage et des curseurs que l'application peut styliser."
group: base
demo: el-slider
source_hash: 5dfd7ea970e4cd98
---

# Slider

Un Slider choisit une valeur le long d'une piste (un volume, une luminosité), ou un intervalle de deux valeurs avec une poignée chacune (une fourchette de prix). Il possède son comportement : un appui sur la piste y déplace la poignée la plus proche, une poignée suit un glissement, à la souris ou au doigt ; les valeurs s'alignent sur `step` ; chaque poignée est un arrêt du focus clavier et se déplace avec les touches fléchées, et c'est un élément ajustable pour les lecteurs d'écran, avec sa propre valeur. L'apparence revient à l'app : un `Slider` n'a ni couleurs, ni tailles, ni rayons, ni animations propres. Il se compose d'une piste contenant un indicateur, de la plage et des poignées placées sur l'indicateur, puis de ses enfants (un libellé, la valeur sous forme de texte), et l'app style chaque partie.

```rust tabs
use nsh_base::{SliderValue, slider, theme};
use nsh_core::prelude::*;

fn strength(level: Signal<SliderValue>) -> impl IntoElement {
    let percent = move || format!("{}%", level.get().end());
    slider()
        .value(move || level.get())
        .accessibility_label("Option strength")
        .on_change(move |next: &SliderValue| level.set(*next))
        // The value in a column after the rail.
        .flex_row()
        .items_center()
        .gap_2()
        // An 8-point rail; the thumbs travel inside it.
        .track_style(|s| s.h(px(8.0)).flex_1().px(px(8.0)).rounded_full().bg(move || theme().muted))
        .indicator_style(|s| s.h_full())
        // The fill, from the rail's edge, fading into the thumb's tone.
        .range_style(|s| {
            s.ml(-px(8.0))
                .rounded_full()
                .bg_linear_to_r()
                .gradient_from(move || theme().primary)
                .gradient_to(move || theme().muted_foreground)
        })
        // A 16 x 8 pill sitting in the rail.
        .thumb_style(|s| {
            s.w(px(16.0))
                .h(px(8.0))
                .rounded_full()
                .bg(move || theme().muted_foreground)
                .hover(|s| s.brightness(1.1))
                .active(|s| s.brightness(1.25))
        })
        .child(
            text(percent)
                .w(px(42.0))
                .text_right()
                .text_xs()
                .tabular_nums()
                .text_color(move || theme().muted_foreground),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Slider } from "nsh/base";

function App() {
  const strength = signal(64);
  return (
    <Slider
      value={strength()}
      onChange={({ value }) => strength.set(value as number)}
      accessibilityLabel="Option strength"
      class="flex-row items-center gap-2"
      trackClass="h-2 flex-1 px-2 rounded-full bg-muted focus-within:ring-2 focus-within:ring-primary/36 focus-within:ring-offset-2 focus-within:ring-offset-background disabled:opacity-35"
      indicatorClass="h-full"
      rangeClass="-ml-2 rounded-full bg-linear-to-r from-primary via-primary to-muted-foreground"
      thumbClass="h-2 w-4 rounded-full bg-muted-foreground transition hover:brightness-110 active:brightness-125 focus:outline-none disabled:brightness-100 motion-reduce:transition-none"
      thumbStyle={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.42)" }}
    >
      <Text class="w-[42px] text-right font-mono text-[11px] text-muted-foreground">{`${strength()}%`}</Text>
    </Slider>
  );
}

mount(App);
```

`Slider` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `slider()` en crée un avec un setter par prop (`.value(..)`, `.thumb_style(..)`), une méthode d'écoute par événement (`.on_change(..)`), les méthodes de style typées pour le slider lui-même et `.child(..)` pour son libellé. Sa valeur est un `SliderValue` : `Single(f64)` ou `Range(f64, f64)`.

<a id="value"></a>

## Valeur

La valeur est un nombre, ou `[start, end]` pour un intervalle à deux poignées ; la forme de la valeur détermine le nombre de poignées. L'app la possède avec `value` et applique celle que `onChange` signale, comme pour tous les contrôles de `nsh/base` ; ou bien elle laisse la valeur au slider avec `defaultValue`, et entend quand même les changements. Pendant un glissement, les poignées et la plage suivent le pointeur dans la même image, de façon native ; quand le pointeur se relève, le `value` de l'app s'affiche de nouveau, tel que l'app l'a défini pour le dernier changement du glissement ; les lecteurs d'écran entendent les valeurs du glissement au fur et à mesure tant qu'il dure, et sa valeur finale sinon.

```tsx
const price = signal<[number, number]>([200, 800]);

<Slider
  value={price()}
  onChange={({ value }) => price.set(value as [number, number])}
  onChangeEnd={({ value }) => save(value)}
  min={0}
  max={1000}
  step={10}
  accessibilityLabel="Maximum price"
  startAccessibilityLabel="Minimum price"
/>;
```

- `onChange` signale chaque nouvelle valeur demandée par l'utilisateur : lors d'un appui sur la piste, à chaque pas d'un glissement, pour chaque touche. Chaque signalement est une nouvelle valeur.
- `onChangeEnd` signale une seule fois la valeur à laquelle le changement s'est terminé : quand le pointeur se relève après un appui ou un glissement qui a défini une valeur, et après chaque touche ou chaque pas d'un lecteur d'écran (chacun est un changement complet). C'est là qu'il faut enregistrer ou envoyer la valeur.
- Les valeurs s'alignent sur `step`, comptés à partir de `min` (`min={1} step={2}` donne 1, 3, 5, ...), et restent entre `min` et `max` ; `max` est toujours atteignable, donc le dernier pas est plus court quand l'étendue n'est pas un nombre entier de pas. `step={0}` accepte n'importe quelle valeur.
- Les poignées d'un intervalle ne se croisent jamais : une poignée glissée s'arrête à l'autre. Un glissement qui commence sur deux poignées à la même valeur déplace celle qui peut aller dans le sens du pointeur.
- La valeur affichée est celle de l'app, bornée par `min` et `max` (les extrémités d'un intervalle étant remises dans l'ordre), et une valeur hors de la grille des pas s'affiche là où elle se trouve ; le prochain changement de l'utilisateur s'aligne.

<a id="props"></a>

## Propriétés

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| [number, number]` | aucun | La valeur (contrôlée) : un nombre, ou un intervalle à deux poignées. L'app applique celle que `onChange` signale. |
| `defaultValue` | `.default_value(..)` | `number \| [number, number]` | `0` | La valeur initiale tant que `value` n'est pas définie ; le slider garde ensuite la sienne. |
| `min` | `.min(..)` | `number` | `0` | La plus petite valeur. |
| `max` | `.max(..)` | `number` | `100` | La plus grande valeur ; une valeur inférieure à `min` devient `min`. |
| `step` | `.step(..)` | `number` | `1` | Le pas sur lequel les valeurs s'alignent, compté à partir de `min` ; `0` accepte n'importe quelle valeur. |
| `scale` | `.scale(..)` | `"linear" \| "logarithmic"` | `"linear"` | La répartition des valeurs le long de la piste : uniforme, ou par ordres de grandeur (de 1 à 1000, au tiers du chemin on trouve 10). L'échelle logarithmique exige `min` supérieur à 0 ; avec un `min` plus bas, elle est linéaire. |
| `axis` | `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | La direction de la piste : `min` au début (à gauche, à droite dans une disposition de droite à gauche), ou en bas. Lue à la création du slider. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun changement par pointeur, clavier ou lecteur d'écran ; les classes `disabled:` s'appliquent au slider et à ses parties. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent pour la poignée (pour un intervalle, celle de la fin). |
| `startAccessibilityLabel` | `.start_accessibility_label(..)` | `string` | `accessibilityLabel` | Ce que les lecteurs d'écran annoncent pour la poignée de début d'un intervalle. |
| `trackClass`, `trackStyle` | `.track_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | La piste : la zone qui reçoit les appuis et les glissements. |
| `indicatorClass`, `indicatorStyle` | `.indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'indicateur, le rail sur lequel les valeurs sont projetées. |
| `rangeClass`, `rangeStyle` | `.range_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | La plage, de `min` à la poignée (entre les poignées d'un intervalle), placée par le slider. |
| `thumbClass`, `thumbStyle` | `.thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Chaque poignée, centrée sur sa valeur. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu après la piste : un libellé, la valeur sous forme de texte. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le slider lui-même : la colonne (ou la ligne) autour de la piste et du libellé. |

<a id="events"></a>

## Événements

| Événement | Rust | Charge utile | Quand |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | L'utilisateur a demandé une nouvelle valeur : un appui sur la piste, un pas de glissement, une touche, une incrémentation ou décrémentation d'un lecteur d'écran. |
| `onChangeEnd` | `.on_change_end(\|value: &SliderValue\| ..)` | `{ value: number \| [number, number] }` | Le changement est terminé : le pointeur s'est relevé, une touche ou un pas d'un lecteur d'écran a été effectué. Une fois par changement. |

<a id="parts"></a>

## Parties

| Partie | Contenue dans | Stylée avec |
|---|---|---|
| Le slider | | `class`, `style` |
| La piste | le slider, en premier | `trackClass`, `trackStyle` |
| L'indicateur | la piste | `indicatorClass`, `indicatorStyle` |
| La plage | l'indicateur, placée selon les valeurs | `rangeClass`, `rangeStyle` |
| Une poignée (deux pour un intervalle) | l'indicateur, centrée sur sa valeur | `thumbClass`, `thumbStyle` |
| Le libellé | le slider, après la piste | ses propres éléments (`children`) |

La piste reçoit les appuis et les glissements. La longueur de l'indicateur correspond à l'étendue des valeurs, à partir de `min` sur son bord d'attaque (en bas lorsqu'il est vertical) ; le slider y place la plage et les poignées, une poignée étant centrée sur sa valeur quelle que soit sa taille. Deux façons de les disposer :

- La piste est le rail (l'exemple ci-dessus) : `h-2 px-2 rounded-full bg-muted` avec un indicateur `h-full`. Le remplissage garde les poignées à l'intérieur du rail aux deux extrémités, et le `-ml-2` de la plage fait commencer le remplissage au bord même du rail.
- La piste est une bande autour du rail, plus haute pour qu'un doigt la trouve sur un écran tactile : `h-8 justify-center` avec un indicateur `h-2 rounded-full` (`w-8 items-center` et `w-2 h-full` sur un slider vertical).

États affichés par les parties :

- Une poignée : `hover:` sous le pointeur, `active:` pendant qu'elle est glissée, `focus:` avec le focus clavier, `disabled:`.
- La piste : `active:` pendant qu'un appui sur elle déclenche un glissement ; c'est un `group`, donc l'indicateur, la plage et les poignées en reçoivent `group-hover:` et `group-active:`.
- Chaque partie : `disabled:` quand le slider l'est.

Les poignées se déplacent au fil des changements de valeur et suivent immédiatement un glissement. L'animation des états des poignées est au choix de l'app (`transition` pour une poignée qui s'éclaircit avec `hover:` et `active:`), et `motion-reduce:` la supprime pour les personnes qui demandent moins d'animations. Le focus clavier appartient à une poignée : `focus-within:` sur la piste entoure tout le rail tant qu'une poignée l'a, et le `focus:outline-none` de la poignée remplace le contour de focus propre à la plateforme.

<a id="keyboard"></a>

## Clavier

Sur macOS et le web, chaque poignée est un arrêt du focus clavier (Tab), et la poignée ayant le focus répond aux touches de slider de WAI-ARIA :

| Touche | Action |
|---|---|
| Droite, Haut | Un pas vers le haut (aussi sur un slider vertical). |
| Gauche, Bas | Un pas vers le bas. |
| Page précédente, Page suivante | Un dixième de l'étendue vers le haut ou le bas (le long de l'échelle), d'au moins un pas. |
| Début, Fin | Aussi bas ou aussi haut que la poignée peut aller (pour le début d'un intervalle, jusqu'à sa fin). |

Dans une disposition de droite à gauche, un slider horizontal part de la droite, son `min` à l'extrémité droite : Gauche est un pas vers le haut et Droite un pas vers le bas, et un glissement vers la gauche augmente la valeur. Un slider vertical conserve Droite et Haut comme pas vers le haut.

Chaque touche qui change la valeur signale `onChange` puis `onChangeEnd`. Les flèches et les pages se répètent tant qu'elles sont maintenues. Les touches n'atteignent le slider que lorsqu'aucun champ de texte n'est en cours d'édition.

<a id="accessibility"></a>

## Accessibilité

- Chaque poignée est un élément ajustable (`"adjustable"`, un slider dans le navigateur) avec son libellé, sa valeur et les valeurs qu'elle peut prendre : le début d'un intervalle de `min` jusqu'à la fin, sa fin du début jusqu'à `max`, de sorte que les lecteurs d'écran lisent et définissent les deux. La valeur est énoncée comme le nombre avec les décimales du pas (`2.5`).
- Les actions d'incrémentation et de décrémentation d'un lecteur d'écran (le balayage vers le haut et vers le bas de VoiceOver) font avancer la poignée d'un pas, comme les touches fléchées.
- Les poignées sont les éléments du slider pour les lecteurs d'écran, nommées par `accessibilityLabel` (et le début d'un intervalle par `startAccessibilityLabel`) ; un libellé visible parmi ses enfants est lu là où il se trouve.
- Tant que `disabled`, les lecteurs d'écran indiquent que les poignées sont atténuées, et elles n'acceptent aucune action.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les actions en général.

<a id="platform-notes"></a>

## Notes par plateforme

- Chaque plateforme dessine ce que l'app style. Les appuis et les glissements sont suivis dans le cœur, pour une souris, un stylet ou un doigt, et une vue défilante autour du slider ne prend pas un glissement qui a commencé sur lui.
- Tab déplace le focus clavier entre les poignées sur macOS et le web, où la poignée ayant le focus répond aux touches du slider.
- Lecteurs d'écran : VoiceOver (iOS, macOS) et TalkBack ajustent chaque poignée ; UI Automation (Windows), l'accessibilité de GTK (Linux) et le navigateur (`role="slider"`, `aria-valuenow`, `aria-valuetext`) reçoivent son intervalle et sa valeur.
