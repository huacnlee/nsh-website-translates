---
title: "NumberInput"
description: "Le composant NumberInput : un nombre saisi dans un champ ou incrémenté avec des boutons, les touches fléchées et les lecteurs d'écran, limité aux décimales de son pas ainsi qu'aux valeurs min et max, avec un champ, des boutons et une colonne de commandes que l'application stylise."
group: base
demo: el-number-input
source_hash: 4dd788dd07f8f04a
---

# NumberInput

Un champ numérique contient un nombre que l'utilisateur saisit ou fait varier par pas : une quantité, un prix, une taille. Il gère lui-même son comportement : son champ accepte un nombre, ou le texte en cours de saisie d'un nombre (`-`, `1.`), et refuse tout le reste, y compris les chiffres et les signes d'autres claviers ; ses boutons, les touches Haut et Bas, ainsi que l'incrémentation et la décrémentation d'un lecteur d'écran, font varier le nombre de `step` en conservant ses décimales, et s'arrêtent à `min` et `max` ; quand on quitte le champ, un nombre saisi est ramené dans ces bornes. L'apparence appartient à l'app : un `NumberInput` n'a ni couleurs, ni tailles, ni bordures, ni icônes, ni chaînes de texte qui lui soient propres. Il se compose du bouton de décrémentation, du champ placé entre le `prefix` et le `suffix` de l'app, et du bouton d'incrémentation (ou du champ entre eux et d'une colonne portant les deux boutons, `controlsRight`) ; l'app stylise chaque partie et remplit les boutons.

```rust tabs
use nsh_base::{number_input, theme};
use nsh_core::prelude::*;

fn tickets(count: Signal<Option<f64>>) -> impl IntoElement {
    number_input()
        .value(move || count.get())
        .min(1.0)
        .max(10.0)
        .accessibility_label("Tickets")
        .on_change(move |next: &Option<f64>| count.set(*next))
        .h(px(32.0))
        .flex_row()
        .rounded(px(8.0))
        .border_1()
        .border_color(move || theme().input)
        .input_style(|s| s.flex_1().text_center().text_color(move || theme().foreground))
        .decrement_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .increment_button_style(|s| s.w(px(32.0)).items_center().justify_center())
        .decrement_button(text("−"))
        .increment_button(text("+"))
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { NumberInput } from "nsh/base";

function App() {
  const tickets = signal<number | null>(2);
  return (
    <NumberInput
      value={tickets()}
      onChange={({ value }) => tickets.set(value)}
      min={1}
      max={10}
      accessibilityLabel="Tickets"
      class="h-8 flex-row overflow-hidden rounded-lg border border-input bg-field focus-within:outline-2 focus-within:outline-ring"
      inputClass="flex-1 text-center text-foreground"
      decrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      incrementButtonClass="w-8 items-center justify-center enabled:hover:bg-accent active:bg-muted disabled:opacity-40"
      decrementButton={<Text>−</Text>}
      incrementButton={<Text>+</Text>}
    />
  );
}

mount(App);
```

`NumberInput` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `number_input()` en crée un avec un setter par prop (`.value(..)`, `.input_style(..)`), une méthode d'écoute par événement (`.on_change(..)`), les méthodes de style typées pour le champ numérique lui-même, et `.prefix(..)` / `.suffix(..)` pour ce qui entoure le champ. Sa valeur est un `Option<f64>`.

<a id="value"></a>

## Valeur

La valeur est un nombre, ou `null` pour un champ vide. L'app la possède avec `value` et définit celle que `onChange` signale, comme pour tout contrôle de `nsh/base` ; ou bien elle laisse la valeur au champ numérique avec `defaultValue`, et reçoit quand même les changements.

Le texte du champ et la valeur sont distingués là où il le faut, afin que l'utilisateur puisse taper librement :

- `onChange` signale le nombre que le texte représente chaque fois que ce nombre change : `null` tant que le texte ne représente aucun nombre (vide, `-`, `.`) ; taper `1.` après `1`, ou `1.50` après `1.5`, ne signale rien.
- Le texte reste tel que l'utilisateur le saisit tant qu'il représente la valeur détenue par le champ numérique, de sorte qu'un champ contrôlé qui renvoie chaque valeur signalée conserve `1.` et `2.50`. Une valeur définie par l'app et que le champ numérique n'a pas signalée s'affiche dans le champ sous la forme du texte le plus court qui la représente (`0.3`, `12`).
- Pendant la saisie, un nombre peut être en dehors de `min` et `max` (1 en route vers 15 avec `min={10}`), et il est signalé tel que saisi. Quand on quitte le champ, ou avec Retour / Entrée, il est ramené dans la plage et cette valeur est signalée ; un texte qui ne représente aucun nombre reste tel quel.
- Un pas (un bouton, une touche, une action de lecteur d'écran) demande la valeur suivante avec `onChange` ; avec une valeur contrôlée, le champ ne bouge que lorsque l'app la renvoie, en conservant les décimales du pas (`99.5` augmenté jusqu'à `max={100}` affiche `100.0`), de sorte qu'une app qui refuse un pas laisse le champ où il est. Une modification refusée par l'app reste dans le champ pendant qu'il est en cours d'édition, et disparaît quand on le quitte.

```tsx
const price = signal<number | null>(19.95);

<NumberInput
  value={price()}
  onChange={({ value }) => price.set(value)}
  onSubmit={({ value }) => save(value)}
  min={0}
  step={0.05}
  placeholder="Price"
  accessibilityLabel="Price"
/>;
```

Le champ accepte :

- Des chiffres, un seul point décimal et un signe en premier (`+` ou `-`) ; une lettre, un deuxième point ou signe, ou un signe ailleurs est refusé, et le champ revient à son texte précédent.
- Les chiffres, signes et point pleine largeur, le signe moins (U+2212) et le point final idéographique (`。`), lus comme leurs formes ASCII, tels que les saisissent les méthodes de saisie chinoise et japonaise.
- Une virgule comme point décimal tant que le texte n'a pas de point (`3,25` vaut 3.25), comme la touche décimale des claviers de nombreuses langues la saisit.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `number \| null` | aucun | La valeur (contrôlée) : un nombre, ou `null` pour un champ vide. L'app définit celle que `onChange` signale. |
| `defaultValue` | `.default_value(..)` | `number \| null` | aucun | La valeur initiale tant que `value` n'est pas définie ; le champ numérique conserve alors sa propre valeur. |
| `min` | `.min(..)` | `number` | aucun | La plus petite valeur : les pas s'arrêtent à elle, une valeur saisie en dessous est ramenée à elle quand on quitte le champ. |
| `max` | `.max(..)` | `number` | aucun | La plus grande valeur, comme `min` par le haut ; une valeur inférieure à `min` équivaut à `min`. |
| `step` | `.step(..)` | `number` | `1` | L'amplitude d'un pas (Page précédente / Page suivante : dix pas) ; une valeur qui n'est pas un nombre positif équivaut à `1`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ni saisie, ni pas, ni focus ; les classes `disabled:` s'appliquent au champ numérique et à ses parties. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | Le texte peut être sélectionné et copié mais pas modifié, ni par la saisie ni par les pas ; les boutons sont désactivés. |
| `placeholder` | `.placeholder(..)` | `string` | aucun | Affiché tant que le champ est vide. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent pour le champ, quand aucun libellé visible ne le nomme. |
| `controlsRight` | `.controls_right(..)` | `boolean` | `false` | Les deux boutons dans une colonne à droite du champ, l'incrémentation au-dessus de la décrémentation. Lu à la création du champ numérique. |
| `inputClass`, `inputStyle` | `.input_style(\|s\| ..)` | `string`, `StyleProp<InputStyle>` | aucun | Le champ : sa boîte et son texte (`color`, `fontSize`, `textAlign`, `placeholderColor`, `caretColor`). |
| `decrementButtonClass`, `decrementButtonStyle` | `.decrement_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le bouton de décrémentation. |
| `incrementButtonClass`, `incrementButtonStyle` | `.increment_button_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le bouton d'incrémentation. |
| `decrementButton`, `incrementButton` | `.decrement_button(..)`, `.increment_button(..)` | `JSX.Element` | aucun | Le contenu des boutons : un signe, une icône. |
| `controlsClass`, `controlsStyle` | `.controls_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | La colonne qui contient les deux boutons avec `controlsRight`. |
| `prefix` | `.prefix(..)` | `JSX.Element` | aucun | Ce qui précède le champ, après le bouton de gauche : un signe monétaire, une icône. |
| `suffix` | `.suffix(..)` | `JSX.Element` | aucun | Ce qui suit le champ, avant les boutons de droite : une unité, une devise. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le champ numérique lui-même : la ligne qui entoure le champ et les boutons. |

<a id="events"></a>

## Événements

| Événement | Rust | Données | Quand |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Le nombre que représente le champ a changé (saisie, pas, incrémentation ou décrémentation d'un lecteur d'écran, champ quitté avec une valeur hors plage). |
| `onSubmit` | `.on_submit(\|value: &Option<f64>\| ..)` | `{ value: number \| null }` | Retour / Entrée dans le champ : la valeur, ramenée dans `min` et `max`. |
| `onFocus` | `.on_focus(..)` | aucune | Le champ a reçu le focus clavier. |
| `onBlur` | `.on_blur(..)` | aucune | Le champ a perdu le focus clavier (sa valeur d'abord ramenée dans `min` et `max`). |

<a id="parts"></a>

## Parties

| Partie | Emplacement | Stylée avec |
|---|---|---|
| Le champ numérique | | `class`, `style` |
| Le bouton de décrémentation | dans le champ numérique, en premier (avec `controlsRight` : dans la colonne de contrôles, en second) | `decrementButtonClass`, `decrementButtonStyle` ; son contenu `decrementButton` |
| Le champ | dans le champ numérique | `inputClass`, `inputStyle` |
| Le préfixe | dans le champ numérique, avant le champ | ses propres éléments (`prefix`) |
| Le suffixe | dans le champ numérique, après le champ | ses propres éléments (`suffix`) |
| Le bouton d'incrémentation | dans le champ numérique, en dernier (avec `controlsRight` : dans la colonne de contrôles, en premier) | `incrementButtonClass`, `incrementButtonStyle` ; son contenu `incrementButton` |
| La colonne de contrôles | dans le champ numérique, en dernier, avec `controlsRight` | `controlsClass`, `controlsStyle` |

Le champ numérique est une ligne dont l'app gère la mise en page : `flex-row` sur `class`, et `flex-1` sur le champ pour lui donner la place que laissent les boutons. États que montrent les parties :

- Le champ numérique : `focus-within:` pendant que son champ est en cours d'édition (un anneau autour de l'ensemble), `disabled:`.
- Le champ : `focus:` pendant son édition, `disabled:`.
- Un bouton : `hover:` sous le pointeur, `active:` pendant l'appui, `disabled:` lorsque le champ numérique est désactivé ou en lecture seule et là où un pas ne ferait rien (la décrémentation à `min`, l'incrémentation à `max`). Placez le survol derrière `enabled:` (`enabled:hover:bg-accent`) pour qu'un bouton désactivé ne s'illumine pas.

Le mouvement des états est au choix de l'app (`transition-colors`), et `motion-reduce:` le fige pour les personnes qui demandent moins de mouvement.

<a id="keyboard"></a>

## Clavier

Pendant l'édition du champ, le champ numérique prend en charge les touches du spin button de WAI-ARIA, qui se répètent lorsqu'on les maintient :

| Touche | Action |
|---|---|
| Haut | Un pas vers le haut. |
| Bas | Un pas vers le bas. |
| Page précédente, Page suivante | Dix pas vers le haut ou vers le bas. |

Début et Fin restent ceux du champ : ils déplacent le curseur dans le texte. Les boutons ne sont pas des arrêts du focus clavier : Tab passe du champ à ce qui suit le champ numérique, et un appui sur un bouton laisse le focus dans le champ (sur les ordinateurs, un appui déplace le focus vers le champ s'il était ailleurs ; sur les écrans tactiles, il le laisse en place, afin qu'aucun clavier n'apparaisse).

<a id="accessibility"></a>

## Accessibilité

- Le champ est un spin button (`"spinbutton"`) avec son libellé, sa valeur (le nombre que représente le texte, entre `min` et `max`) et son texte.
- Les actions d'incrémentation et de décrémentation d'un lecteur d'écran (le balayage vers le haut et vers le bas de VoiceOver) le font varier par pas, comme le font Haut et Bas.
- Les boutons sont masqués aux lecteurs d'écran, comme ceux du champ numérique d'un navigateur : l'incrémentation et la décrémentation propres au champ le font varier par pas.
- Lorsque `disabled`, les lecteurs d'écran indiquent que le champ est grisé.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les actions en général.

<a id="platform-notes"></a>

## Notes par plateforme

- Le champ est le champ de texte de la plateforme ([Input](./input.md)) : le clavier, le curseur, la sélection, le copier-coller et les méthodes de saisie sont ceux du système. Les téléphones affichent un clavier décimal, avec un signe lorsque `min` est inférieur à 0 ou non défini.
- Chaque plateforme dessine ce que l'app stylise. Haut / Bas et Page précédente / Page suivante parviennent au champ numérique depuis un clavier physique sur toutes les plateformes.
