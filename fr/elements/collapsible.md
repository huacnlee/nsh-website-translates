---
title: "Collapsible"
description: "Le composant Collapsible : une région dont le contenu se déploie et se replie, affichée après ses enfants tant que l'application la maintient ouverte, révélée à la demande par une hauteur à effet ressort, le déclencheur et tous les aspects visuels étant ceux de l'application."
group: base
demo: el-collapsible
source_hash: cf0c6bafa8f80920
---

# Collapsible

Un collapsible est une région dont le contenu se déploie et se replie : des détails sous un résumé, un « afficher plus », une section de réglages avancés. Il rend toujours ses enfants et, après eux, son `content` tant que `open`. L'app possède `open` et le déclencheur qui l'inverse (l'un des enfants), et l'apparence relève de l'app : un `Collapsible` n'a ni déclencheur, ni chevron, ni libellé propres. Avec `reveal`, le contenu s'ouvre et se ferme avec du mouvement : la hauteur de sa région passe, comme sur un ressort, de zéro à celle du contenu et inversement, et ce qui suit le collapsible se déplace avec elle.

```rust tabs
use nsh_base::{collapsible, theme};
use nsh_core::{AccessibilityState, prelude::*};

fn storage() -> impl IntoElement {
    let open = signal(false);
    collapsible()
        .open(open)
        .reveal(true)
        .gap_2()
        .child(
            view()
                .role(AccessibilityRole::Button)
                .accessibility_state(move || AccessibilityState {
                    expanded: Some(open.get()),
                    ..AccessibilityState::default()
                })
                .on_press(move || open.update(|o| *o = !*o))
                .flex_row()
                .items_center()
                .justify_between()
                .child(text("Storage"))
                .child(text("›").transition_transform().rotate(move || {
                    if open.get() { deg(90.0) } else { deg(0.0) }
                })),
        )
        .content(text("Photos 120 GB · Apps 54 GB · System 38 GB").text_color(move || theme().muted_foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Collapsible } from "nsh/base";

function App() {
  const open = signal(false);
  return (
    <Collapsible
      open={open()}
      reveal
      class="gap-2"
      content={<Text class="text-muted-foreground">Photos 120 GB · Apps 54 GB · System 38 GB</Text>}
    >
      <View
        role="button"
        accessibilityState={{ expanded: open() }}
        onPress={() => open.set(!open())}
        class="flex-row items-center justify-between active:opacity-70"
      >
        <Text class="font-medium">Storage</Text>
        <Text class={`transition-transform ${open() ? "rotate-90" : ""}`}>›</Text>
      </View>
    </Collapsible>
  );
}

mount(App);
```

`Collapsible` vient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. La valeur appartient à l'app : son déclencheur inverse `open`, et le collapsible affiche la valeur que l'app lui transmet. En Rust, `collapsible()` en construit un avec un setter par prop (`.open(..)`, `.reveal(..)`, `.content(..)`), les méthodes de style typées pour la région et `.child(..)` pour ce qui est toujours affiché.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `open` | `.open(..)` | `boolean` | `false` | Déployé : le `content` est dans l'arbre, après les enfants. L'app possède la valeur. |
| `reveal` | `.reveal(..)` | `boolean` | `false` | S'ouvre et se ferme avec un dévoilement : le contenu se trouve dans une région qui le rogne, dont la hauteur passe en ressort de zéro à celle du contenu lorsque `open` s'active, et revient à zéro lorsqu'il se désactive, avec un amortissement critique (environ 265 ms, sans dépassement). Ce qui suit le collapsible se déplace avec lui, et le contenu reste dans l'arbre jusqu'à la fermeture de la région. Avec la réduction des animations, il s'ouvre et se ferme instantanément. La région fait aussi partie de la mise en page lorsqu'il est fermé, avec une hauteur nulle, de sorte qu'un `gap` du collapsible s'applique aussi avant elle. |
| `content` | `.content(..)` | `JSX.Element` | aucun | Ce qui se déploie. Il est créé une seule fois et conservé pendant le repli, de sorte que son contenu garde son état (le texte d'un champ, une position de défilement, un interrupteur) d'une ouverture à l'autre. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Ce qui est affiché dans tous les cas : un résumé, le déclencheur qui inverse `open`. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La région autour des enfants et du contenu (`gap-2` les espace). |

<a id="events"></a>

## Événements

Un collapsible ne signale rien de lui-même : le déclencheur appartient à l'app, et son appui (`onPress` du `View` avec `role="button"`) est l'endroit où l'app inverse `open`.

<a id="parts"></a>

## Parties

| Partie | Dans | Stylée avec |
|---|---|---|
| La région | | `class`, `style` |
| Les enfants | la région, en premier | leurs propres éléments |
| La région du dévoilement | la région, après les enfants, avec `reveal` | aucun : elle rogne le contenu et prend sa hauteur |
| Le contenu | la région, après les enfants (dans la région du dévoilement avec `reveal`), tant que `open` | ses propres éléments (`content`) |

Sans `reveal`, le contenu apparaît et disparaît instantanément, et chaque plateforme recalcule la mise en page de la région à son arrivée ou à son départ. Avec `reveal`, le changement est une animation de mise en page du commit qui modifie `open` (comme `LayoutAnimation.configureNext`, exécutée nativement, de sorte qu'aucun JavaScript ne s'exécute pendant le mouvement) : la région du dévoilement passe de zéro à la hauteur du contenu puis revient à zéro, et les frames de tout ce que ce même changement déplace, dont les vues situées après le collapsible, se déplacent avec elle. Une transition de l'app l'accompagne : le chevron du déclencheur pivote (`transition-transform`), et le contenu peut apparaître en fondu avec ses propres classes.

<a id="accessibility"></a>

## Accessibilité

- La région n'est pas un élément à part entière pour les lecteurs d'écran : ses enfants et son contenu sont lus tels quels.
- Le déclencheur indique si la région est déployée : donnez-lui `accessibilityState={{ expanded: open }}` et un rôle de bouton (`role="button"` sur un `View`), et les lecteurs d'écran annoncent « déployé » ou « replié » avec son libellé.
- Sur macOS et le web, le déclencheur est un arrêt du focus clavier lorsqu'il prend en charge les appuis : Tab l'atteint, Espace et Entrée inversent la région.

Voir [Accessibility](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes par plateforme

- Chaque plateforme affiche le contenu après les enfants tant que `open`, et le laisse hors de la mise en page sinon.
- Avec `reveal`, chaque plateforme anime la hauteur de la région avec un ressort sur son propre animateur (iOS, Android, macOS, Windows, Linux, GPUI et le web), et l'ouvre et la ferme instantanément lorsque le système demande la réduction des animations.
- iOS, Android et Mac Catalyst : l'appui sur le déclencheur est un tap. Ordinateurs (macOS, Windows, Linux, GPUI) et web : un clic, ainsi qu'Espace ou Entrée sur le déclencheur ayant le focus sur macOS et le web.
