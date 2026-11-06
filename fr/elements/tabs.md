---
title: "Tabs"
description: "Tab et Tabs : les onglets d'une liste d'onglets, et la liste elle-même. Chaque onglet prend en charge les pressions, l'activation au clavier, l'état désactivé ainsi que son rôle et son état sélectionné pour les lecteurs d'écran ; la liste en est l'ensemble, avec un indicateur qui suit nativement l'onglet sélectionné ; l'apparence, la valeur et le contenu affiché par chaque onglet relèvent de l'application."
group: base
demo: el-tabs
source_hash: 31cec668d8fcf6ae
---

# Tabs

Les tabs permettent de passer d'une section à l'autre au sein d'un même endroit : la vue d'ensemble et l'activité d'un projet, les vues d'un document.
Chaque `Tab` gère le comportement d'un onglet : les appuis, l'activation au clavier, l'état désactivé, ainsi que le rôle d'onglet et son état sélectionné pour les lecteurs d'écran. Un `Tabs` placé autour des onglets est la liste d'onglets, que les lecteurs d'écran annoncent comme un seul ensemble. L'apparence relève de l'app : un onglet n'a ni couleurs, ni tailles, ni libellé propres. Ses enfants forment le libellé de l'app, et les classes `selected:` sur l'onglet, ou les classes `group-selected:` sur son contenu, suivent son état. Le contenu de chaque section relève lui aussi de l'app : elle affiche celle que nomme sa valeur, à côté de la liste. L'indicateur de la liste, un soulignement ou une pastille que l'app stylise, se place sur l'onglet sélectionné et se déplace vers le suivant de façon native ([Indicateur](#indicator)).

```rust tabs
use nsh_base::{tab, tabs, theme};
use nsh_core::prelude::*;

fn sections() -> impl IntoElement {
    let section = signal("overview");
    let item = move |value: &'static str, label: &'static str| {
        let selected = move || section.get() == value;
        tab()
            .selected(selected)
            .on_press(move |_: &()| section.set(value))
            .rounded(move || theme().radius)
            .px_3()
            .py_2()
            .child(text(label).text_sm().text_color(move || {
                if selected() { theme().foreground } else { theme().muted_foreground }
            }))
    };
    view()
        .gap_4()
        .child(
            tabs()
                .flex_row()
                .self_start()
                .gap_1()
                .p_1()
                .rounded(move || theme().radius)
                .bg(move || theme().muted)
                .indicator_style(|s| {
                    s.top_1()
                        .bottom_1()
                        .rounded(move || theme().radius)
                        .bg(move || theme().background)
                })
                .child(item("overview", "Overview"))
                .child(item("activity", "Activity")),
        )
        .child(text(move || {
            if section.get() == "overview" {
                "Visitors, sign-ups and conversion this week."
            } else {
                "Deploys, invoices and new members, newest first."
            }
        }).text_color(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Tab, Tabs } from "nsh/base";

function App() {
  const section = signal("overview");
  const item = (value: string, label: string) => (
    <Tab
      selected={section() === value}
      onPress={() => section.set(value)}
      class="group rounded-(--radius) px-3 py-2"
    >
      <Text class="text-sm text-muted-foreground group-selected:text-foreground">{label}</Text>
    </Tab>
  );
  return (
    <View class="gap-4">
      <Tabs
        class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1"
        indicatorClass="inset-y-1 rounded-(--radius) bg-background"
      >
        {item("overview", "Overview")}
        {item("activity", "Activity")}
      </Tabs>
      <Text class="text-foreground">
        {section() === "overview"
          ? "Visitors, sign-ups and conversion this week."
          : "Deploys, invoices and new members, newest first."}
      </Text>
    </View>
  );
}

mount(App);
```

`Tab` et `Tabs` viennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. La valeur appartient à l'app : la liste n'en détient aucune. Chaque onglet sait s'il est sélectionné ; un appui signale `onPress`, l'app définit sa valeur et affiche cette section, et chaque onglet affiche le `selected` que l'app lui renvoie. Les coins de la liste et ceux des onglets sont concentriques : le padding de la liste (`p-1`) est la différence entre `radius.lg` et `radius`. Le fond de l'onglet sélectionné est l'indicateur de la liste (`indicatorClass`, à l'intérieur de ce padding : `inset-y-1`), qui bondit vers l'onglet que l'app sélectionne. En Rust, `tab()` et `tabs()` les créent, avec un setter par prop (`.selected(..)`), un écouteur par événement (`.on_press(..)`), les méthodes de style typées et `.child(..)` pour leur contenu.

## Props

### Tab

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `selected` | `.selected(..)` | `boolean` | `false` | L'onglet courant de sa liste : les lecteurs d'écran indiquent qu'il est sélectionné, et les styles `selected:` s'appliquent. Un appui signale `onPress` ; l'onglet affiche la valeur que l'app lui renvoie. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun appui et aucun retour visuel à l'appui ; les styles `disabled:` s'appliquent, et les lecteurs d'écran indiquent qu'il est grisé. |
| `selectedStyle` | `.selected_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucun | Le style de l'onglet lorsqu'il est sélectionné et non désactivé, sous forme de classes `selected:`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran : le nom de l'onglet, lorsque ses enfants n'ont aucun texte qui le donne (une icône). |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le libellé, l'icône ou le badge de l'app, que les lecteurs d'écran énoncent. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | L'onglet lui-même : la surface autour de son libellé. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style de l'onglet lorsqu'il est pressé, survolé, focalisé ou désactivé, sous forme de classes `<state>:`. |

<a id="tabs-1"></a>

### Tabs

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `indicatorClass` | `.indicator_class(..)` | `string` | aucun | Les classes Tailwind de l'indicateur sur l'onglet sélectionné : son apparence et sa position en travers de la liste (`bottom-0 h-0.5` pour un soulignement dans une ligne, `inset-y-1` pour une pastille). Le long de la liste, il couvre l'onglet sélectionné, à l'intérieur de ses propres marges sur cet axe. Avec `indicatorClass` ou `indicatorStyle`, la liste a un indicateur. |
| `indicatorStyle` | `.indicator_style(\|s\| ..)` | `StyleProp<ViewStyle>` | aucun | Le style de l'indicateur, par-dessus `indicatorClass`. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Les onglets de la liste, et tout ce que l'app dispose entre eux. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La disposition et l'apparence de la liste : une colonne par défaut, `flex-row` pour une ligne. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onPress` (`Tab`) | `.on_press(\|_: &()\| ..)` | L'onglet a été pressé : un tap, un clic, Espace ou Entrée lorsqu'il a le focus clavier, ou l'activation par un lecteur d'écran ; ou bien une flèche, Début ou Fin dans sa liste a déplacé le focus clavier vers lui. Il s'exécute avant tout changement : l'onglet affiche le `selected` que l'app lui renvoie. |

L'onglet sélectionné signale lui aussi ses appuis, afin que l'app puisse réagir à un second appui (remonter sa section en haut, par exemple).
Un onglet désactivé ne signale rien.

<a id="parts"></a>

## Parties

| Partie | Dans | Stylisée avec | États |
|---|---|---|---|
| La liste | | `Tabs` : `class`, `style` | |
| L'indicateur | la liste, derrière les onglets | `indicatorClass`, `indicatorStyle` | sur l'onglet sélectionné |
| L'onglet | la liste | `Tab` : `class`, `style` | `selected:`, `disabled:`, `active:`, `hover:`, `focus:` (ou `selectedStyle`, `disabledStyle`, ...) |
| Le libellé | l'onglet | ses propres éléments (`children`) | `group-selected:`, `group-disabled:` et les autres variantes `group-*:` avec `group` sur le `class` de l'onglet |
| Le contenu de la section | à côté de la liste | les éléments de l'app | la valeur de l'app |

Montrez l'onglet sélectionné par sa propre surface : un fond, un libellé plus marqué, une graisse plus forte (voir
[Guides de conception](../docs/design-guides.md#interaction-states)).

<a id="indicator"></a>

## Indicateur

Un soulignement sous l'onglet sélectionné, une pastille derrière lui ou le segment surélevé d'un contrôle segmenté constituent l'indicateur de la liste : une vue que l'app stylise avec `indicatorClass` et `indicatorStyle`, dessinée derrière les onglets et positionnée de manière absolue dans la liste. Native Shell la place sur l'onglet sélectionné après chaque mise en page. Le long de la liste (la largeur d'une ligne, la hauteur d'une colonne), elle couvre cet onglet, à l'intérieur des marges propres de l'indicateur sur cet axe (`mx-3` pour un soulignement plus court que son onglet) ; en travers de la liste, ses classes la positionnent :

```tsx
// An underline at the bottom of a row of tabs.
<Tabs class="flex-row gap-4 border-b border-border" indicatorClass="bottom-0 h-0.5 bg-foreground">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>

// A pill behind the selected tab, inside the list's padding.
<Tabs class="flex-row self-start gap-1 rounded-(--radius-lg) bg-muted p-1" indicatorClass="inset-y-1 rounded-(--radius) bg-background shadow-sm">
  {item("overview", "Overview")}
  {item("activity", "Activity")}
</Tabs>
```

Lorsque l'app sélectionne un autre onglet, l'indicateur s'y déplace de façon native avec un effet de ressort, comme l'indicateur de la barre d'onglets de GPUI Kit ; avec la réduction des animations, il s'y place instantanément. Tant qu'aucun onglet n'est sélectionné, il est masqué ; si plusieurs le sont, il se place sur le premier. Un redimensionnement ou un changement de largeur d'un onglet le déplace dans la même frame que les onglets. L'indicateur n'a besoin d'aucun événement de mise en page ni d'aucun code de l'app : l'onglet sélectionné est celui dont `selected` est vrai. Dans une liste qui défile, la vue de défilement entoure le `Tabs`, et l'indicateur défile avec les onglets.

<a id="disabled"></a>

## Désactivé

Un onglet désactivé ne reçoit aucun appui, et les lecteurs d'écran l'annoncent comme grisé. Ses classes `disabled:` s'appliquent par-dessus ses classes `selected:`, et les classes `group-disabled:` à l'intérieur suivent :

```tsx
<Tab
  selected={section() === "billing"}
  disabled={!isOwner()}
  onPress={() => section.set("billing")}
  class="group rounded-(--radius) px-3 py-2 selected:bg-background disabled:opacity-50"
>
  <Text class="text-sm text-muted-foreground group-selected:text-foreground">Billing</Text>
</Tab>
```

<a id="accessibility"></a>

## Accessibilité

- Un onglet est un seul élément pour les lecteurs d'écran, avec le rôle `"tab"` et son état sélectionné. Son libellé est le texte de ses enfants, ou `accessibilityLabel`.
- `Tabs` a le rôle `"tablist"` : les lecteurs d'écran entendent les onglets qu'il contient comme un seul ensemble, chacun restant un élément à part entière.
- `disabled` est annoncé comme la plateforme l'annonce (VoiceOver, TalkBack, UI Automation, l'arbre d'accessibilité du navigateur).
- Sur macOS et le web, la liste constitue un seul arrêt du focus clavier, et les flèches se déplacent entre ses onglets (voir ci-dessous).
- L'indicateur est masqué pour les lecteurs d'écran et ne prend pas le focus : seuls les onglets sont les éléments de la liste.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="keyboard"></a>

## Clavier

Sur macOS et le web, où Tab atteint les vues qui reçoivent des appuis, une liste `Tabs` suit le
[motif des onglets WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) :

| Touche | Effet |
|---|---|
| Tab, Shift+Tab | Entre dans la liste sur l'onglet sélectionné (le premier onglet non désactivé si aucun ne l'est), et en sort en une seule étape. |
| Flèche droite, Flèche bas | Déplace le focus vers l'onglet suivant, du dernier au premier. |
| Flèche gauche, Flèche haut | Déplace le focus vers l'onglet précédent, du premier au dernier. |
| Début, Fin | Déplace le focus vers le premier ou le dernier onglet. |
| Espace, Entrée | Appuie sur l'onglet focalisé. |

Les flèches ignorent les onglets désactivés, et l'onglet vers lequel elles se déplacent signale `onPress`, de sorte que l'app le sélectionne au fil du déplacement du focus : la section suit le focus. Les deux paires de flèches déplacent le focus, quelle que soit la disposition de la liste, laquelle relève des classes de l'app. Dans une disposition de droite à gauche, la ligne commence à droite, donc Gauche et Droite s'inversent : Gauche va à l'onglet suivant et Droite au précédent ; Haut, Bas, Début et Fin gardent leur effet. Les styles `focus:` montrent où se trouve le focus. Un `Tab` en dehors d'un `Tabs` constitue un arrêt à part.

<a id="platform-notes"></a>

## Notes sur les plateformes

- iOS, Android et Mac Catalyst : un appui est un tap qui se termine sur l'onglet, libellé compris.
- Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web : un appui est un clic. Sur macOS et le web, Espace et Entrée appuient aussi sur l'onglet qui a le focus clavier, et les flèches, Début et Fin le déplacent ([Clavier](#keyboard)).
- Chaque plateforme dessine ce que l'app stylise : les onglets, la surface de celui qui est sélectionné, l'indicateur et le contenu des sections. Le déplacement de l'indicateur est une animation de mise en page native sur chaque plateforme.
