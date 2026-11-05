---
title: "Link"
description: "Le composant Link : un contenu qui mène quelque part lorsqu'on appuie dessus, une page, un site ou une route de l'application, avec la prise en charge des appuis, de l'activation au clavier, de l'état désactivé et du rôle link pour les lecteurs d'écran, le style étant défini par l'application."
group: base
demo: el-link
source_hash: 8bf5c1d937685ca0
---

# Link

Un lien emmène l'utilisateur quelque part : une page web, une autre app (`mailto:`, `tel:`) ou un écran de l'app elle-même. Il prend en charge le comportement : les appuis, Entrée et Espace lorsqu'il a le focus clavier, l'état désactivé et le rôle de lien pour les lecteurs d'écran. L'apparence revient à l'app : un `Link` n'a ni couleur, ni soulignement, ni libellé propre, et ce sont ses enfants qui s'affichent. `href` indique où il mène ; c'est une donnée destinée à l'ouverture, jamais un texte affiché à l'écran.

```rust tabs
use nsh_base::{link, theme};
use nsh_core::prelude::*;

fn docs() -> impl IntoElement {
    link()
        .href("https://example.com/docs")
        .text_color(move || theme().primary)
        .underline()
        .hover(|s| s.opacity(0.8))
        .focus(|s| s.rounded_sm().outline(px(2.0)).outline_color(move || theme().ring))
        .child(text("Read the docs"))
}
```

```tsx tabs
import { mount, Text } from "nsh";
import { Link } from "nsh/base";

function App() {
  return (
    <Link
      href="https://example.com/docs"
      class="self-start text-primary underline hover:opacity-80 focus:rounded-sm focus:outline-2 focus:outline-ring"
    >
      <Text>Read the docs</Text>
    </Link>
  );
}

mount(App);
```

`Link` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `link()` en crée un avec un setter par prop (`.href(..)`, `.open_with(..)`), un écouteur par événement (`.on_open(..)`, `.on_press(..)`), les méthodes de style typées pour le lien et `.child(..)` pour son contenu.

<a id="opening"></a>

## Ouverture

Un appui, un clic, ou Entrée ou Espace sur le lien qui a le focus ouvre son `href` :

1. `onOpen({ href })` signale où il mène.
2. Avec `openWith="system"` (la valeur par défaut), une URL d'une autre app ou d'un autre site, c'est-à-dire avec un schéma (`https:`, `mailto:`, `tel:`, un schéma enregistré par une autre app), s'ouvre en dehors de l'app, comme [`openUrl`](../modules/nsh.md) l'ouvre : le routeur de l'app hôte la prend d'abord, puis le système. Tout autre `href`, un chemin de l'app (`/orders/42`) ou `#anchor`, est signalé et reste géré par l'app.
3. `onPress()` signale l'appui.

Avec `openWith="app"`, c'est le gestionnaire `onOpen` de l'app qui décide de la façon dont le lien s'ouvre : une route qui lui est propre, une page dans une web view intégrée, une confirmation préalable.

```tsx
import { Link } from "nsh/base";

<Link href={`/orders/${order.id}`} openWith="app" onOpen={({ href }) => router.push(href)} class="text-primary">
  <Text>Order #{order.id}</Text>
</Link>
```

L'ouverture d'une URL en dehors de l'app requiert la capability `openUrl` lorsque l'app déclare ses capabilities dans `nsh.json` (`"openUrl": true` ou `{ "schemes": ["https", "mailto"] }`).

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `href` | `.href(..)` | `string` | aucun | Où mène le lien : une URL ou un chemin de l'app. Signalé avec `onOpen`, jamais affiché. |
| `openWith` | `.open_with(LinkOpenWith::App)` | `"system" \| "app"` (`LinkOpenWith`) | `"system"` | Qui ouvre `href` : le système ouvre une URL d'une autre app ou d'un autre site ; `"app"` en laisse la charge à `onOpen`. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun appui, aucun retour visuel à l'appui, aucun focus clavier ; les styles `disabled:` s'appliquent et les lecteurs d'écran indiquent qu'il est grisé. |
| `current` | `.current(..)` | `boolean` | `false` | Le lien vers la page où se trouve l'utilisateur, dans une navigation ou un fil d'Ariane : les lecteurs d'écran indiquent qu'il s'agit de la page courante. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran, lorsque le contenu en dit trop peu (une icône). |
| `hitSlop` | `.hit_slop(..)` | `number \| Partial<Edges>` | aucun | Jusqu'où, au-delà de ses limites, les appuis comptent encore, en points : un seul nombre pour tous les côtés, ou les côtés nommés. Comme le `hitSlop` d'une vue. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Le contenu : un libellé, une icône, tout ce que l'app affiche. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | L'apparence du lien : sa couleur, son soulignement, son padding ; les propriétés de texte sont transmises aux textes qu'il contient. |
| `activeStyle`, `hoverStyle`, `focusStyle`, `disabledStyle` | `.active(\|s\| ..)`, `.hover(..)`, `.focus(..)`, `.disabled_style(..)` | `StyleProp<ViewStyle>` | aucun | Le style du lien lorsqu'il est pressé, survolé, focalisé ou désactivé, comme les classes `<state>:`. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onOpen` | `.on_open(\|href: &SharedString\| ..)` | Le lien ouvre `href` : avec `openWith="app"`, le gestionnaire l'ouvre ; avec `"system"`, il entend ce que le système a été invité à ouvrir. Il intervient avant `onPress`. |
| `onPress` | `.on_press(\|\| ..)` | Le lien a été pressé : un toucher, un clic, ou Entrée ou Espace lorsqu'il a le focus clavier. |

Un lien désactivé ne signale rien, et un appui sur celui-ci n'atteint aucune vue pressable qui l'entoure.

<a id="states"></a>

## États

L'app stylise chaque état avec des classes ou des props de style :

```tsx
<Link
  href="https://example.com/changelog"
  class="self-start text-primary underline decoration-primary/40 transition-colors hover:decoration-primary active:opacity-70 focus:outline-2 focus:outline-ring disabled:text-muted-foreground disabled:no-underline"
>
  <Text>Changelog</Text>
</Link>
```

Se souvenir d'un lien visité revient à l'app : elle conserve les href qu'elle a ouverts et stylise ces liens selon son propre état.

```tsx
const visited = signal(new Set<string>());

<Link
  href={href}
  onOpen={({ href }) => visited.set(new Set(visited()).add(href))}
  class={visited().has(href) ? "text-violet-600 underline" : "text-primary underline"}
>
  <Text>{label}</Text>
</Link>
```

<a id="inside-text"></a>

## Dans un texte

Un `Link` dans un `<Text>` est une boîte en ligne du paragraphe, comme toute vue placée dans un texte : il s'insère dans la ligne, conserve ses propres états, son focus et son rôle, et reste sur une seule ligne. `align-text-bottom` place un lien d'une seule ligne de texte sur la ligne de base du paragraphe :

```tsx
<Text class="text-[15px] text-foreground">
  By continuing you accept the{" "}
  <Link href="https://example.com/terms" class="align-text-bottom">
    <Text class="text-[15px] text-primary underline">terms of service</Text>
  </Link>
  .
</Text>
```

Un lien qui passe à la ligne avec les lignes du paragraphe est un `<Text>` imbriqué avec `role="link"` et `onPress` (voir [Text](./text.md)), comme [TextView](./text-view.md) dessine les liens d'un document.

<a id="a-small-target-with-hitslop"></a>

## Une petite cible avec hitSlop

Un lien peut être plus petit qu'un doigt : une icône, un mot court. `hitSlop` fait compter les appuis qui tombent près du lien, en points au-delà de chaque côté, sans changer sa mise en page ni son apparence : un seul nombre pour tous les côtés, ou les côtés nommés (`{ top: 8, bottom: 8 }`), comme le [`hitSlop` d'une vue](./index.md#presses-and-feedback) les accepte.

```tsx
<Link href="https://example.com/help" hitSlop={12} accessibilityLabel="Help" class="size-5 items-center justify-center">
  <Text>?</Text>
</Link>
```

<a id="accessibility"></a>

## Accessibilité

- Un lien est un seul élément pour les lecteurs d'écran, avec le rôle `"link"` ; son libellé est le texte de ses enfants, ou `accessibilityLabel`. `href` reste une donnée : les lecteurs d'écran énoncent le libellé.
- `current` est énoncé comme la page courante (`aria-current="page"` d'ARIA), et `disabled` comme la plateforme énonce un élément grisé.
- Sur macOS et le web, un lien est un arrêt du focus clavier : Tab l'atteint, Entrée et Espace l'ouvrent, et les styles `focus:` montrent où se trouve le focus.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes par plateforme

- iOS, Android et Mac Catalyst : un appui est un toucher qui se termine sur le lien.
- Bureau (macOS, Windows, Linux, GPUI) et web : un appui est un clic. Sur macOS et le web, Entrée et Espace ouvrent aussi le lien qui a le focus clavier.
- Le web rend un lien sous la forme d'un élément avec `role="link"`.
- Chaque plateforme dessine ce que l'app stylise.
