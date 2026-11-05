---
title: "Accordion"
description: "Accordion et ses parties : des sections empilées qui se déplient et se replient sous leurs titres, une à la fois ou plusieurs, ouvertes selon la valeur de l'application, révélées par une hauteur à effet de ressort sur demande, avec une apparence entièrement définie par l'application."
group: base
demo: el-accordion
source_hash: fb5b5e196c111b08
---

# Accordion

Un accordion empile des sections qui se déploient et se replient sous leurs en-têtes : les questions d'une FAQ, les groupes d'une page de réglages, les étapes d'un paiement. Il se compose de cinq parties, dont chacune porte un seul aspect du comportement et aucun du rendu :

- `Accordion`, la pile : elle contient le `value` de l'app, les valeurs des éléments ouverts, et signale le suivant avec
  `onChange`. Un seul élément s'ouvre à la fois, ou plusieurs avec `multiple`.
- `AccordionItem`, une section, identifiée par sa `value`. Elle est ouverte tant que le `value` de l'accordion la contient.
- `AccordionHeader`, l'en-tête de l'élément, d'un `level` que les lecteurs d'écran annoncent.
- `AccordionTrigger`, le bouton de l'en-tête qui déploie et replie son élément, et indique s'il est déployé.
- `AccordionPanel`, le contenu de l'élément, affiché tant qu'il est ouvert ; avec `reveal`, sa hauteur s'ouvre et se ferme avec un effet de ressort.

```rust tabs
use nsh_base::{accordion, accordion_header, accordion_item, accordion_panel, accordion_trigger, theme};
use nsh_core::prelude::*;

const FAQ: [(&str, &str, &str); 2] = [
    ("shipping", "When will my order ship?", "Orders placed before 2 pm leave the same day."),
    ("returns", "How do I return an item?", "Print the label from your order within 30 days."),
];

fn faq() -> impl IntoElement {
    let open = signal(vec![SharedString::from("shipping")]);
    let mut list = accordion()
        .value(open)
        .on_change(move |value: &Vec<SharedString>| open.set(value.clone()));
    for (value, question, answer) in FAQ {
        list = list.child(
            accordion_item()
                .value(value)
                .border_b_1()
                .border_color(move || theme().border)
                .child(
                    accordion_header().child(
                        accordion_trigger()
                            .flex_row()
                            .items_center()
                            .justify_between()
                            .py_3()
                            .child(text(question).font_weight(FontWeight::MEDIUM))
                            .child(text("⌄").transition_transform().rotate(move || {
                                let open = open.get().iter().any(|v| &**v == value);
                                if open { deg(180.0) } else { deg(0.0) }
                            })),
                    ),
                )
                .child(
                    accordion_panel()
                        .reveal(true)
                        .accessibility_label(question)
                        .child(view().pb_3().child(text(answer).text_color(move || theme().muted_foreground))),
                ),
        );
    }
    list
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionTrigger } from "nsh/base";

const FAQ = [
  { value: "shipping", question: "When will my order ship?", answer: "Orders placed before 2 pm leave the same day." },
  { value: "returns", question: "How do I return an item?", answer: "Print the label from your order within 30 days." },
];

function App() {
  const open = signal(["shipping"]);
  return (
    <Accordion value={open()} onChange={({ value }) => open.set(value)}>
      {FAQ.map((item) => (
        <AccordionItem value={item.value} class="border-b border-border">
          <AccordionHeader>
            <AccordionTrigger class="group flex-row items-center justify-between py-3 active:opacity-70">
              <Text class="font-medium">{item.question}</Text>
              <Text class="transition-transform group-aria-expanded:rotate-180">⌄</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel reveal accessibilityLabel={item.question}>
            <View class="pb-3">
              <Text class="text-muted-foreground">{item.answer}</Text>
            </View>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

mount(App);
```

Les parties viennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. La valeur appartient à l'app : l'appui sur un
déclencheur signale le `value` suivant avec `onChange`, et l'accordion ouvre les éléments dont l'app lui renvoie les valeurs.
Chaque partie trouve seule celle qui l'entoure, si bien que l'app les agence librement : des séparateurs entre les éléments, un badge
dans un en-tête, une icône avant un titre. En Rust, `accordion()`, `accordion_item()`, `accordion_header()`,
`accordion_trigger()` et `accordion_panel()` les construisent, avec un setter par prop et `.child(..)` pour leur contenu.

## Props

<a id="accordion-1"></a>

### Accordion

| Prop | Rust | Type | Valeur par défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `string[]` | `[]` | Les `value`s des éléments ouverts. Ils appartiennent à l'app : l'appui sur un déclencheur signale les suivants avec `onChange`, et l'accordion affiche ceux que l'app lui renvoie. |
| `multiple` | `.multiple(..)` | `boolean` | `false` | Plusieurs éléments ouverts à la fois : en ouvrir un laisse les autres ouverts. Sans cette prop, ouvrir un élément ferme celui qui l'était. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Tous les éléments sont désactivés : aucun déclencheur ne reçoit d'appuis, et les lecteurs d'écran indiquent que chacun est grisé. |
| `children` | `.child(..)` | `JSX.Element` | aucune | Les éléments, et tout ce que l'app place entre eux (séparateurs). |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | La mise en page et le rendu de la pile : une carte autour des éléments, l'espace entre eux. |

### AccordionItem

| Prop | Rust | Type | Valeur par défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | requis | Ce qui identifie l'élément dans le `value` de l'accordion : l'identifiant propre à l'app, jamais son titre, qui change avec la langue. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Son déclencheur ne reçoit aucun appui, et les lecteurs d'écran indiquent qu'il est grisé. Il reste ouvert ou fermé selon le `value` de l'accordion. |
| `children` | `.child(..)` | `JSX.Element` | aucune | L'en-tête et le panneau de l'élément, et tout ce que l'app y place d'autre. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | La section : un séparateur en dessous, une carte autour. |

### AccordionHeader

| Prop | Rust | Type | Valeur par défaut | Description |
|---|---|---|---|---|
| `level` | `.level(..)` | `number` | `3` | Le niveau de l'en-tête parmi les titres de la page, pour les lecteurs d'écran (1 étant le plus haut). |
| `children` | `.child(..)` | `JSX.Element` | aucune | Le déclencheur de l'élément, et tout ce que l'en-tête contient d'autre (un badge, une action qui lui est propre). |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | La mise en page de l'en-tête. |

### AccordionTrigger

| Prop | Rust | Type | Valeur par défaut | Description |
|---|---|---|---|---|
| `expandedStyle` | `.expanded_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucune | Le style du déclencheur tant que son élément est ouvert, sous forme de classes `aria-expanded:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucune | Ce que disent les lecteurs d'écran, lorsque les enfants ne contiennent aucun texte qui le dise. |
| `children` | `.child(..)` | `JSX.Element` | aucune | Le titre et le chevron ; les classes `group-aria-expanded:` à l'intérieur suivent le déclencheur grâce à `group` sur son `class`. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | Le déclencheur lui-même : la ligne sur laquelle l'utilisateur appuie. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | aucune | Le style du déclencheur lorsqu'il est pressé, survolé, ciblé par le focus ou désactivé, sous forme de classes `<state>:`. |

### AccordionPanel

| Prop | Rust | Type | Valeur par défaut | Description |
|---|---|---|---|---|
| `reveal` | `.reveal(..)` | `boolean` | `false` | S'ouvre et se ferme avec un effet de révélation, comme celui de `Collapsible` : le panneau rogne son contenu et sa hauteur passe de zéro à celle du contenu, et inversement, avec un amortissement critique (environ 265 ms, sans dépassement), et les éléments qui le suivent se déplacent avec lui. Avec la réduction des animations, il s'ouvre et se ferme instantanément. |
| `keepMounted` | `.keep_mounted(..)` | `boolean` | `false` | Le contenu reste dans l'arbre tant que l'élément est fermé, hors de vue, du focus clavier et des lecteurs d'écran : une vidéo garde sa position, une web view sa page. Sans cette prop, le contenu quitte l'arbre à la fermeture du panneau (une fois l'effet de révélation terminé) et revient tel qu'il était. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucune | Le nom que les lecteurs d'écran donnent à la région : en général le titre de l'élément, tel que son en-tête l'énonce. |
| `children` | `.child(..)` | `JSX.Element` | aucune | Le contenu. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | La mise en page et le rendu de la région. Avec `reveal`, le panneau reste dans la mise en page lorsqu'il est fermé, avec une hauteur nulle : son remplissage et ses bordures vont donc sur une vue de son contenu. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange({ value })` (`Accordion`) | `.on_change(\|value: &Vec<SharedString>\| ..)` | Un déclencheur a été pressé : un toucher, un clic, Espace ou Entrée lorsqu'il a le focus clavier, ou une activation par un lecteur d'écran. `value` contient les valeurs des éléments ouverts telles qu'elles seraient : la valeur d'un élément ouvert la quitte, celle d'un élément fermé la rejoint à la fin ou, sans `multiple`, la remplace. Il s'exécute avant tout changement : définissez `value` pour le suivre. |

<a id="parts"></a>

## Parties

| Partie | Dans | Stylée avec | États |
|---|---|---|---|
| La pile | | `Accordion` : `class`, `style` | |
| Un élément | la pile | `AccordionItem` : `class`, `style` | la valeur de l'app |
| L'en-tête | l'élément | `AccordionHeader` : `class`, `style` | |
| Le déclencheur | l'en-tête | `AccordionTrigger` : `class`, `style` | `aria-expanded:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `expandedStyle`, `disabledStyle`, ...) |
| Le titre et le chevron | le déclencheur | leurs propres éléments (`children`) | `group-aria-expanded:`, `group-disabled:` avec `group` sur le `class` du déclencheur |
| Le panneau | l'élément, après l'en-tête | `AccordionPanel` : `class`, `style` | |
| Le contenu | le panneau | ses propres éléments (`children`) | |

Sans `reveal`, un panneau fermé est hors de la mise en page et son contenu hors de l'arbre. Avec `reveal`, le changement est une
animation de mise en page du commit qui modifie `value` (comme `LayoutAnimation.configureNext`, exécutée nativement : aucun
JavaScript ne s'exécute pendant le mouvement) : le panneau qui s'ouvre passe de zéro à la hauteur de son contenu, celui qui se ferme
se rétracte, tous deux avec le même ressort, et les éléments qui les suivent se déplacent avec eux. Une transition propre à l'app l'accompagne : le
chevron pivote (`transition-transform group-aria-expanded:rotate-180`).

<a id="disabled"></a>

## Désactivation

Le déclencheur d'un élément désactivé ne reçoit aucun appui, et les lecteurs d'écran l'annoncent comme grisé ; les classes `disabled:` sur le
déclencheur et `group-disabled:` à l'intérieur suivent. La prop `disabled` de l'accordion désactive chaque élément. Un élément désactivé
affiche toujours ce que dit le `value` de l'app : l'app peut l'ouvrir.

<a id="accessibility"></a>

## Accessibilité

- La pile est un groupe, chaque en-tête un titre de son `level`, et chaque déclencheur un bouton qui s'y trouve et indique si
  son élément est déployé. Les lecteurs d'écran peuvent passer d'un en-tête à l'autre.
- Un panneau ouvert est une région, nommée par son `accessibilityLabel` ; un panneau fermé est masqué aux lecteurs d'écran, y compris son contenu
  conservé.
- Le rendu de l'élément ouvert relève de l'app, et ne devrait pas reposer sur la seule couleur : faites pivoter le chevron, comme le font les exemples.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="keyboard"></a>

## Clavier

Là où les vues qui reçoivent des appuis sont des arrêts du focus clavier (macOS et le web), chaque déclencheur est un arrêt, dans
l'ordre de la page, et Espace et Entrée l'activent. Les déclencheurs désactivés sont ignorés, tout comme le contenu d'un panneau
fermé. Tab passe d'un déclencheur aux contrôles de son panneau ouvert, puis au déclencheur suivant.

<a id="platform-notes"></a>

## Notes par plateforme

- Chaque plateforme affiche le panneau d'un élément ouvert sous son en-tête et laisse un panneau fermé hors de la mise en page (hauteur nulle
  avec `reveal`).
- Avec `reveal`, chaque plateforme anime la hauteur des panneaux avec un ressort sur son propre animateur (iOS, Android, macOS, Windows, Linux,
  GPUI et le web), et les ouvre et les ferme instantanément lorsque le système demande de réduire les animations.
- Le lecteur d'écran de chaque plateforme lit l'en-tête et son niveau comme il lit les titres, et le déclencheur qu'il contient comme
  un bouton avec son état déployé ; sur iOS, VoiceOver lit le déclencheur lui-même.
- iOS, Android et Mac Catalyst : l'appui sur un déclencheur est un toucher. Ordinateurs (macOS, Windows, Linux, GPUI) et web : un
  clic, ainsi qu'Espace ou Entrée sur le déclencheur ciblé par le focus sous macOS et sur le web.
