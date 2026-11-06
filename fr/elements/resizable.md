---
title: "Resizable"
description: "ResizablePanelGroup et ResizablePanel : des panneaux côte à côte ou empilés, avec une poignée entre chaque paire que l'utilisateur fait glisser pour se partager l'espace. Le groupe gère le glissement, les limites des panneaux, le curseur de redimensionnement et le rôle des poignées pour les lecteurs d'écran ; les tailles, l'apparence des poignées et le contenu des panneaux relèvent de l'application."
group: base
demo: el-resizable
source_hash: 44f050b3e406c215
---

# Resizable

Un groupe redimensionnable dispose des panneaux côte à côte ou empilés, avec une poignée sur chaque frontière entre deux d'entre eux : une barre latérale à côté d'un document, un éditeur au-dessus de sa console, une liste à côté de son détail. L'utilisateur fait glisser une poignée pour déplacer la frontière, et chaque panneau reste dans les tailles que l'app lui autorise. `ResizablePanelGroup` gère le comportement : le glissement, qui s'exécute nativement image par image, la répartition de l'espace, le curseur de redimensionnement et une zone tactile plus large pour un doigt.
L'apparence appartient à l'app : une poignée est une bande sans trait, sans couleur ni prise propres, et ce qu'elle dessine est l'indicateur de l'app ; les panneaux sont les vues de l'app.

```rust tabs
use nsh_base::{h_resizable, resizable_panel, theme};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    h_resizable()
        .handle_style(|s| s.bg(move || theme().border()))
        .handle_accessibility_label("Resize the sidebar")
        .on_resize(|sizes: &Vec<Points>| log::info!("sizes: {sizes:?}"))
        .child(
            resizable_panel()
                .size(px(240.0))
                .size_range(px(160.0)..px(480.0))
                .p_4()
                .child(text("Files").text_color(move || theme().muted_foreground())),
        )
        .child(
            resizable_panel()
                .p_4()
                .child(text("Editor").text_color(move || theme().foreground())),
        )
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { ResizablePanel, ResizablePanelGroup } from "nsh/base";

function App() {
  const sidebar = signal(240);
  return (
    <ResizablePanelGroup
      axis="horizontal"
      handleClass="bg-border group-hover:bg-ring group-active:bg-primary"
      handleAccessibilityLabel="Resize the sidebar"
    >
      <ResizablePanel size={sidebar()} minSize={160} maxSize={480} onResize={({ size }) => sidebar.set(size)} class="p-4">
        <Text class="text-muted-foreground">Files</Text>
      </ResizablePanel>
      <ResizablePanel class="p-4">
        <Text class="text-foreground">Editor</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

mount(App);
```

`ResizablePanelGroup` et `ResizablePanel` proviennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en
Rust. Les panneaux sont les enfants directs du groupe. En Rust, `h_resizable()` et `v_resizable()` créent un groupe selon chaque
axe (`resizable_panel_group().axis(..)` prend l'axe comme valeur) et `resizable_panel()` un panneau, avec un setter par
prop, un écouteur par événement, les méthodes de style typées et `.child(..)` pour leur contenu ; `.size_range(min..max)` définit
les deux limites à la fois.

<a id="sizes"></a>

## Tailles

Le `size` d'un panneau est la taille qu'il souhaite, dans les limites de son `minSize` et de son `maxSize`. Les panneaux sans taille se partagent équitablement ce qui reste, quel que soit leur contenu ; lorsque chaque panneau a une taille, l'espace restant est réparti proportionnellement à ces tailles.
Pendant que l'utilisateur fait glisser une poignée, le groupe déplace l'espace entre les panneaux dans le cœur, sans aucun JS sur le chemin :

- Agrandir le panneau situé avant la poignée prend de la place aux panneaux situés après elle, en commençant par le plus proche, chacun jusqu'à son `minSize`, en ignorant ceux qui sont `fixed`.
- Le réduire en dessous de son `minSize` prend de la place aux panneaux situés avant lui.
- Aucun panneau ne dépasse son `maxSize`, et la somme des panneaux ne dépasse jamais celle du groupe.

Lorsqu'un glissement se termine après avoir modifié les tailles, le groupe signale la taille de chaque panneau visible, dans l'ordre de leur disposition (`onResize` sur le groupe), et chaque panneau dont la taille a changé signale la sienne (`onResize` sur le panneau). Les panneaux déplacés par un glissement conservent les tailles de l'utilisateur jusqu'à ce que l'app transmette un nouveau `size` ; l'app les conserve au-delà de la vie du groupe en renvoyant les tailles signalées sous forme de `size`, de sorte qu'une disposition restaurée depuis le [stockage](../modules/nsh.md#storage) s'ouvre aux tailles où l'utilisateur l'avait laissée. Seuls les glissements et les pas des lecteurs d'écran déclenchent un signalement : une fenêtre redimensionnée ou un panneau affiché ou masqué ne signale rien.

Lorsque le groupe s'agrandit ou se réduit (la fenêtre est redimensionnée), les panneaux ayant une taille la conservent et les panneaux sans taille absorbent la différence. Lorsque le groupe est trop petit pour les tailles, les panneaux rétrécissent, à l'exception des panneaux `fixed` (une barre latérale, un inspecteur), et ils retrouvent leurs tailles lorsque l'espace revient. Un panneau avec `visible={false}` ne prend aucune place : les autres se partagent son espace, et il retrouve sa taille lorsqu'il est de nouveau affiché.

```tsx
<ResizablePanelGroup axis="vertical" handleClass="bg-border">
  <ResizablePanel>
    <Editor />
  </ResizablePanel>
  <ResizablePanel size={180} minSize={120} fixed visible={consoleOpen()}>
    <Console />
  </ResizablePanel>
</ResizablePanelGroup>
```

<a id="handles"></a>

## Poignées

Il y a une poignée sur chaque frontière entre deux panneaux visibles : une bande de 9 points d'épaisseur dans le sens transversal à l'axe, centrée sur la frontière, avec le curseur de redimensionnement de son axe. Sur les écrans tactiles, sa zone tactile s'étend de 10 points supplémentaires de chaque côté, de sorte qu'un trait d'un point reste facile à saisir. La poignée est un `group` : ce qu'elle dessine est l'indicateur de l'app, stylé avec `handleClass` / `handleStyle` : 1 point d'épaisseur et toute la longueur de la frontière, de sorte que `bg-border` seul donne un trait fin sur n'importe quel axe, et `w-[3px]` ou `h-[3px]` l'épaissit, et ses classes `group-hover:` et `group-active:` suivent le pointeur au-dessus de la bande ainsi que l'appui ou le glissement. Pour plus qu'un trait (une prise en points, une icône), `renderHandle` affiche le contenu de l'indicateur, en recevant le `index`, le `axis` et le `state` de la poignée ; il est redessiné lorsque l'état change, quelques fois par glissement, jamais à chaque mouvement. Une prise animée est le pouce de la poignée (`handleThumbClass` /
`handleThumbStyle`) : une vue centrée sur la ligne, dessinée droite et pivotée d'un quart de tour sur une ligne horizontale afin qu'une seule classe serve les deux axes, que les classes `group-hover:` et `group-active:` affichent et animent ; la poignée reste enfoncée pendant tout le glissement, où que aille le pointeur.

```tsx
<ResizablePanelGroup
  handleClass="w-[3px] items-center justify-center bg-border"
  renderHandle={(handle) => (
    <View class={handle.state === "dragging" ? "h-8 w-1 rounded-full bg-primary" : "h-6 w-1 rounded-full bg-muted-foreground"} />
  )}
>
  {/* panels */}
</ResizablePanelGroup>
```

`disabled` maintient chaque poignée à sa place (une disposition verrouillée).

## Props

### ResizablePanelGroup

| Prop | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `axis` | `h_resizable()`, `v_resizable()`, `.axis(..)` | `"horizontal" \| "vertical"` | `"horizontal"` | Côte à côte (les poignées se font glisser vers la gauche et la droite) ou empilés (vers le haut et le bas). |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Aucun glissement : les poignées restent où elles sont. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'indicateur de chaque poignée, sur la frontière dans la bande de la poignée : 1 point d'épaisseur et toute la longueur de la frontière, sauf indication contraire (`w-[3px]`, `h-[3px]`) ; `group-hover:` et `group-active:` suivent la bande. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le pouce de chaque poignée : une prise centrée sur la ligne, dessinée droite comme sur une ligne verticale et pivotée d'un quart de tour sur une ligne horizontale, de sorte qu'une seule classe serve les deux axes. Elle reste la même vue lorsque la poignée est survolée, enfoncée et glissée, de sorte que les classes `group-hover:` et `group-active:` lui appliquent une transition (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `renderHandle` | `.render_handle(\|handle\| ..)` | `(handle: ResizeHandleContext) => JSX.Element` | aucun | Ce qui se trouve dans chaque indicateur, redessiné lorsque le `state` de la poignée change. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent pour chaque poignée : ce qu'elle redimensionne. Ils l'ajustent de 10 points à la fois. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Les `ResizablePanel`, ses enfants directs. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | `size-full` | Le groupe lui-même ; il remplit son parent, sauf si sa classe en décide autrement. |

### ResizablePanel

| Prop | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `size` | `.size(..)` | `number` | aucun | La longueur souhaitée selon l'axe du groupe, en points, dans les limites de `minSize` et `maxSize` ; une nouvelle valeur le redimensionne. Sans valeur, il se partage ce qui reste. |
| `minSize` | `.min_size(..)`, `.size_range(..)` | `number` | `100` | La plus petite taille qu'il peut avoir. |
| `maxSize` | `.max_size(..)`, `.size_range(..)` | `number` | aucune limite | La plus grande taille qu'il peut avoir. |
| `fixed` | `.fixed(..)` | `boolean` | `false` | Conserve sa taille lorsque le groupe est trop petit pour les panneaux ; faire glisser sa propre poignée le redimensionne toujours. Il accepte un `size`. |
| `visible` | `.visible(..)` | `boolean` | `true` | Masqué, il ne prend aucune place et les autres se partagent son espace. |
| `children` | `.child(..)` | `JSX.Element` | aucun | Son contenu. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La surface propre du panneau. Sa taille selon l'axe est celle du groupe. |

### ResizeHandleContext

| Champ | Type | Description |
|---|---|---|
| `index` | `number` | La frontière située après le `index`e panneau visible. |
| `axis` | `"horizontal" \| "vertical"` | L'axe selon lequel elle redimensionne. |
| `state` | `"idle" \| "hovered" \| "pressed" \| "dragging"` | La distance parcourue avec elle par le pointeur ou le doigt. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onResize` (`ResizablePanelGroup`) | `.on_resize(\|sizes: &Vec<Points>\| ..)` | Un glissement s'est terminé et a déplacé une poignée, ou un lecteur d'écran en a ajusté une : `sizes`, la taille de chaque panneau visible, dans l'ordre de leur disposition (de gauche à droite, de haut en bas). |
| `onResize` (`ResizablePanel`) | `.on_resize(\|size: &Points\| ..)` | Un glissement s'est terminé et a modifié la taille de ce panneau : `size`, la nouvelle, à renvoyer comme son `size`. |

<a id="parts"></a>

## Parties

| Partie | À l'intérieur de | Stylée avec | États |
|---|---|---|---|
| Le groupe | | `ResizablePanelGroup` : `class`, `style` | |
| Un panneau | le groupe | `ResizablePanel` : `class`, `style` | |
| L'indicateur d'une poignée | la bande de la poignée, sur une frontière | `handleClass`, `handleStyle`, `renderHandle` | `group-hover:` sous un pointeur, `group-active:` pendant l'appui ou le glissement ; `state` dans `renderHandle` |
| Le pouce d'une poignée | centré sur la ligne d'une poignée | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (enfoncé jusqu'à la fin du glissement) |

<a id="accessibility"></a>

## Accessibilité

- Chaque poignée est un élément ajustable pour les lecteurs d'écran, avec `handleAccessibilityLabel` comme libellé. Sa valeur
  est la taille du panneau qui la précède, dans les limites du `minSize` et du `maxSize` de ce panneau.
- Balayer vers le haut ou vers le bas sur une poignée avec VoiceOver, ou utiliser les touches de volume de TalkBack, la déplace de 10 points, comme le ferait un glissement ; le
  groupe le signale avec `onResize`. Les poignées d'un groupe `disabled` restent où elles sont.
- Le contenu des panneaux appartient à l'app et est lu comme partout ailleurs.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes sur les plateformes

- Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web : le pointeur au-dessus d'une poignée affiche le curseur de redimensionnement de colonne ou de ligne, et un glissement à la souris ou au pavé tactile déplace la frontière.
- iOS, Android et Mac Catalyst : un doigt fait glisser la poignée, dans une zone tactile plus large de 10 points de chaque côté que la bande.
- Dans les dispositions de droite à gauche, les panneaux et leurs tailles suivent l'ordre de la disposition.
- Chaque plateforme dessine ce que l'app style : les indicateurs et les panneaux.
- Les divisions de [Dock](./dock.md) sont des groupes redimensionnables : elles se redimensionnent de la même manière.
