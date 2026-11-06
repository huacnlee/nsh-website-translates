---
title: "Avatar"
description: "Les composants Avatar et AvatarGroup : l'image d'une personne, ou un repli pendant son chargement, en cas d'échec ou en l'absence d'image, avec l'état de chargement géré nativement ; et une rangée d'avatars qui affiche les premiers et représente les autres."
group: base
demo: el-avatar
source_hash: 3ec5a888836ebb12
---

# Avatar

Un avatar affiche l'image d'une personne : un membre d'une équipe, l'auteur d'un commentaire, le compte dans un en-tête. Tant que l'image n'est pas chargée, quand elle échoue et quand il n'y en a pas, il affiche un contenu de repli : les initiales du `name` de la personne, ou le contenu propre à l'app (une icône). Il gère l'état de chargement de l'image, exécuté nativement à partir des événements de chargement et d'erreur de l'image elle-même, sans JavaScript, ainsi que ce que reçoivent les lecteurs d'écran : une image étiquetée avec le nom de la personne. L'apparence est celle de l'app : un `Avatar` n'a ni taille, ni forme, ni couleurs, ni police propres. Un `AvatarGroup` affiche les premiers avatars d'une rangée et un débordement qui représente les autres ("+5").

```rust tabs
use nsh_base::{avatar, theme};
use nsh_core::prelude::*;

fn author(name: &'static str, picture: &'static str) -> impl IntoElement {
    avatar()
        .src(picture)
        .name(name)
        .size(px(40.0))
        .image_style(|s| s.rounded_full())
        .fallback_style(|s| {
            s.rounded_full()
                .items_center()
                .justify_center()
                .bg(move || theme().muted)
                .text_color(move || theme().muted_foreground)
                .text_sm()
        })
}
```

```tsx tabs
import { mount } from "nsh";
import { Avatar } from "nsh/base";

function App() {
  return (
    <Avatar
      src="https://example.com/ada.png"
      name="Ada Lovelace"
      class="size-10"
      imageClass="rounded-full"
      fallbackClass="items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
    />
  );
}

mount(App);
```

`Avatar` et `AvatarGroup` proviennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `avatar()` et `avatar_group()` les construisent avec un setter par prop (`.src(..)`, `.fallback_delay(..)`), les méthodes de style typées pour l'avatar lui-même et `.child(..)` pour ce qui se superpose à l'image.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `src` | `.src(..)` | `string \| ImageAsset` | aucun | L'image, telle que la prend le `src` de [`<Image>`](./image.md) : une URL, une URI `asset:/` ou `data:`, une URL `blob:` (une photo choisie par l'utilisateur : `URL.createObjectURL(file)`), ou une image importée. Elle s'affiche une fois chargée ; une chaîne vide signifie aucune image. |
| `name` | `.name(..)` | `string` | aucun | Le nom de la personne : ce que disent les lecteurs d'écran, et les initiales que le repli affiche lorsque l'app ne passe pas de `fallback`. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | `name` | Ce que disent les lecteurs d'écran, prioritaire sur `name`. `""` rend l'avatar décoratif, masqué aux lecteurs d'écran. |
| `fallbackDelay` | `.fallback_delay(..)` | `number` (ms) | `0` | Combien de temps le repli attend pendant le chargement de l'image, afin qu'une image qui se charge rapidement s'affiche sans que le repli clignote d'abord. `Infinity` : pas de repli pendant le chargement, seulement en cas d'échec ou d'absence d'image. |
| `imageClass`, `imageStyle` | `.image_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'image : son ajustement, son rayon et son animation. |
| `fallbackClass`, `fallbackStyle` | `.fallback_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le repli : son arrière-plan, la couleur et la taille de son texte, et l'alignement de son contenu. |
| `fallback` | `.fallback(..)` | `JSX.Element` | les initiales | Le contenu du repli à la place des initiales : une icône, un substitut pour une personne sans nom. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Ce qui s'affiche par-dessus l'image : un point de présence, un badge. Les lecteurs d'écran entendent l'étiquette de l'avatar, pas ces éléments (voir [Accessibilité](#accessibility)). |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | L'avatar lui-même : sa taille et sa forme. |

| Événement | Rust | Données | Description |
|---|---|---|---|
| `onStatusChange` | `.on_status_change(..)` | `{ status: AvatarStatus }` | L'état de l'image a changé : `"idle"` (sans `src`), `"loading"`, `"loaded"` ou `"error"`. |

<a id="parts"></a>

## Parties

| Partie | Contenue dans | Stylée avec |
|---|---|---|
| L'avatar | | `class`, `style` |
| Le repli | l'avatar, en premier, aussi grand que lui ; présent pendant le chargement de l'image (après `fallbackDelay`), en cas d'échec ou d'absence | `fallbackClass`, `fallbackStyle` ; son contenu : les initiales ou `fallback` |
| L'image | l'avatar, au-dessus du repli, qu'elle remplit | `imageClass`, `imageStyle` |
| Le contenu de l'app | l'avatar, en dernier | ses propres éléments (`children`) |

Donnez sa taille à l'avatar (`class="size-10"`) : le repli et l'image le remplissent, de sorte que la disparition du repli ne redéclenche aucune mise en page. L'image est mise en page dès le départ, transparente, et devient opaque une fois chargée ; le repli disparaît alors. Un `transition-opacity` dans `imageClass` la fait apparaître en fondu (avec le mouvement réduit, elle s'affiche immédiatement). Arrondissez l'image et le repli (`rounded-full` sur chacun) plutôt que de rogner l'avatar, afin qu'un point de présence placé à son bord (`absolute bottom-0 right-0`) reste entier.

Les initiales sont les premières lettres des deux premiers mots du nom, en majuscules ("Ada Lovelace" donne "AL") ; un mot unique donne ses deux premières lettres ("huacnlee" donne "HU"), et un nom dans une écriture sans casse donne son premier caractère ("王小明" donne "王").

<a id="groups"></a>

## Groupes

```tsx
import { Text } from "nsh";
import { Avatar, AvatarGroup } from "nsh/base";

<AvatarGroup
  limit={3}
  total={members.length}
  accessibilityLabel={`${members.length} members`}
  class="flex-row"
  overflowClass="-ml-2 size-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
  overflowAccessibilityLabel={`${members.length - 3} more people`}
  overflow={<Text class="text-xs">{`+${members.length - 3}`}</Text>}
>
  <Each of={members.slice(0, 3)} key={(m) => m.id}>
    {(m, i) => <Avatar src={m().picture} name={m().name} class={i() > 0 ? "-ml-2 size-8" : "size-8"} />}
  </Each>
</AvatarGroup>
```

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `limit` | `.limit(..)` | `number` | `3` | Au plus ce nombre de ses avatars s'affichent, les premiers ; les autres ne créent aucune vue. |
| `total` | `.total(..)` | `number` | le nombre d'enfants | Le nombre de personnes que représente le groupe, lorsque l'app ne passe que les premières d'entre elles. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran du groupe. |
| `overflowClass`, `overflowStyle` | `.overflow_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | La partie de débordement, après les avatars affichés. |
| `overflow` | `.overflow(..)` | `JSX.Element` | aucun | Ce qui représente les personnes non affichées ("+5", "⋯"), présent tant que le groupe compte plus de personnes que d'avatars affichés. |
| `overflowAccessibilityLabel` | `.overflow_accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran du débordement à la place de son contenu : "5 personnes de plus" pour un "+5". |
| `children` | `.child(..)` | `JSX.Element` | aucun | Les avatars, dans l'ordre. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La rangée : sa direction (`flex-row`) et son espacement. |

Le chevauchement, les anneaux et la forme du débordement relèvent de l'app : une marge négative sur chaque avatar après le premier (`-ml-2`) les empile, et un anneau de la couleur de l'arrière-plan les sépare. Pour une longue liste, passez les `limit` premières personnes et `total` : seuls les avatars affichés sont créés. Le nombre que représente le débordement est `total` moins les avatars affichés, c'est-à-dire le plus petit nombre entre les enfants et `limit` : `total={8}` avec deux enfants affiche deux avatars et "+6".

<a id="accessibility"></a>

## Accessibilité

- Un avatar est une seule image pour les lecteurs d'écran, étiquetée avec `accessibilityLabel` ou `name` : le nom n'est dit qu'une fois. Le repli et l'image leur sont masqués, si bien que les initiales ne sont pas lues séparément. Un avatar sans aucun des deux, ou avec `accessibilityLabel=""`, est décoratif : masqué aux lecteurs d'écran, comme doit l'être un avatar placé à côté du nom qu'il représente.
- Un groupe est un groupe, étiqueté avec son `accessibilityLabel` ("Ada, Grace et 5 autres") ; les avatars affichés sont des images à l'intérieur. Le débordement est lu comme son contenu ("+5"), ou comme `overflowAccessibilityLabel` ("5 personnes de plus") lorsque l'app en fournit un : NSH n'écrit aucun mot de son cru.
- Un avatar est un seul élément pour les lecteurs d'écran, donc ce qu'affichent ses enfants n'est pas lu séparément, et sur iOS un bouton ou un lien parmi eux est tout simplement inaccessible. Indiquez ce que signifie un point de présence ou un badge dans `accessibilityLabel` ("Ada Lovelace, en ligne"), et placez ce sur quoi l'on peut appuyer à côté de l'avatar, pas à l'intérieur.
- Ni l'un ni l'autre ne reçoit d'appuis ni le focus clavier : placez un avatar dans un `Button` pour en faire un élément interactif.

Voir [Accessibilité](../docs/accessibility.md) pour les étiquettes, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes sur les plateformes

- Chaque plateforme charge l'image avec son propre chargeur d'images et ses propres caches (voir [Image](./image.md)) ; ses événements de chargement et d'erreur modifient l'état de l'avatar en Rust, de sorte qu'une image en cours de chargement ou en échec modifie l'image et le repli, et rien d'autre.
- L'image commence à se charger dès qu'elle a un cadre, elle reste donc mise en page tout en étant transparente.
