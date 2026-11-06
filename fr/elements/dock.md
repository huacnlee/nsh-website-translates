---
title: "Dock"
description: "DockArea : un espace de travail ancrable composé de divisions, de groupes d'onglets et de docks sur les bords gauche, droit et inférieur, dont la disposition est une donnée que l'application possède. La zone gère le glisser-déposer des onglets, le redimensionnement, les docks, le zoom et le verrouillage, conserve le contenu de chaque panneau lorsqu'il est déplacé, et s'adapte aux téléphones ; l'apparence et le contenu des panneaux relèvent de l'application."
group: base
demo: el-dock
source_hash: 3008b9e4b513c87f
---

# Dock

Une zone de dock est un espace de travail que l'utilisateur organise : des panneaux dans des groupes d'onglets, des groupes divisés côte à côte ou empilés, et des docks sur les bords gauche, droit et inférieur qui s'ouvrent, se ferment et se redimensionnent. Un onglet glissé sur un autre groupe le rejoint, glissé sur le bord d'un groupe il le divise, et chaque panneau conserve son contenu en se déplaçant. `DockArea` gère le comportement : le glisser-déposer des onglets, qui s'exécute nativement image par image, le redimensionnement des divisions et des docks, l'ouverture et la fermeture des docks, le zoom et le verrouillage. L'apparence revient à l'app : les onglets, les barres d'onglets, les poignées, l'indicateur de dépôt et le contenu de chaque panneau sont rendus et stylés par l'app, et la zone ne dessine rien d'elle-même.

```rust tabs
use nsh_base::{
    dock::{DockAreaLayout, DockLayout, DockPanel, DockPlacement, DockRegion, DockTab},
    dock_area, theme,
};
use nsh_core::prelude::*;

fn workspace() -> impl IntoElement {
    let layout = signal(
        DockAreaLayout::new(
            DockLayout::h_split()
                .child(DockLayout::tabs().panel("readme").panel("main"), None)
                .child(DockLayout::tabs().panel("preview"), Some(px(320.0))),
        )
        .with_dock(DockPlacement::Left, DockRegion::new(DockLayout::tabs().panel("files")))
        .with_dock(DockPlacement::Bottom, DockRegion::new(DockLayout::tabs().panel("terminal"))),
    );
    dock_area()
        .layout(move || layout.get())
        .on_layout_change(move |next: &DockAreaLayout| layout.set(next.clone()))
        .handle_style(|s| s.bg(move || theme().border()))
        .tab_bar_style(|s| s.flex_row().border_b_1().border_color(move || theme().border()))
        .tab_style(|s| s.px_3().py_1().selected(|s| s.bg(move || theme().muted())))
        .render_tab(|tab: &DockTab| text(tab.panel.to_string()).text_sm().text_color(move || theme().foreground()))
        .render_panel(|panel: &DockPanel| {
            text(format!("{} content", panel.id)).p_4().text_color(move || theme().foreground())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { DockArea, type DockAreaLayout } from "nsh/base";

const titles: Record<string, string> = {
  files: "Files", readme: "README.md", main: "main.rs", preview: "Preview", terminal: "Terminal",
};

function App() {
  const layout = signal<DockAreaLayout>({
    center: {
      type: "split",
      axis: "horizontal",
      children: [
        { type: "tabs", panels: ["readme", "main"] },
        { type: "tabs", panels: ["preview"] },
      ],
      sizes: [null, 320],
    },
    left: { layout: { type: "tabs", panels: ["files"] }, size: 240 },
    bottom: { layout: { type: "tabs", panels: ["terminal"] }, size: 180 },
  });
  return (
    <DockArea
      class="size-full bg-background"
      layout={layout()}
      onLayoutChange={(e) => layout.set(e.layout)}
      handleClass="bg-border group-active:bg-primary"
      tabBarClass="flex-row border-b border-border"
      tabClass="px-3 py-1.5 selected:bg-muted"
      renderTab={(tab) => <Text class="text-sm text-foreground">{titles[tab.panel]}</Text>}
      renderPanel={(panel) => <Text class="p-4 text-foreground">{titles[panel.id]} content</Text>}
    />
  );
}

mount(App);
```

`DockArea` et les valeurs qu'il prend viennent de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust (`nsh_base::dock_area()`, les valeurs dans `nsh_base::dock`). En Rust, `dock_area()` le construit, avec un setter par prop, un listener par événement et les méthodes de style typées ; `DockLayout` décrit une disposition par les clés des panneaux (`h_split()`, `v_split()`, `tabs()`, `.child(layout, size)`, `.panel(key)`).

<a id="the-layout"></a>

## La disposition

La disposition est une valeur, `DockAreaLayout` : le centre, et un dock sur chacun des bords gauche, droit et inférieur, chacun optionnel. Chaque région est un arbre composé de deux types de nœuds :

| Nœud | Contient | Champs |
|---|---|---|
| `{ type: "split" }` | D'autres nœuds, côte à côte (`axis: "horizontal"`) ou empilés (`"vertical"`) | `children`, et `sizes` : la longueur de chaque enfant le long de l'axe en points, `null` pour se partager le reste |
| `{ type: "tabs" }` | Des panneaux, par clé, un seul affiché à la fois | `panels` (les clés, dans l'ordre des onglets), `activeIndex` (celui affiché, 0 par défaut) |

Un panneau vit toujours dans un groupe d'onglets : une région avec un seul panneau est un groupe d'onglets d'un seul élément. La clé d'un panneau est la chaîne que l'app lui attribue (`"files"`, l'identifiant d'un document), et une clé n'apparaît qu'une seule fois dans toute la disposition. Un dock (`DockRegion`) est son arbre (`layout`), sa taille perpendiculairement à son bord (`size`, 200 par défaut, au moins 100), son état d'ouverture (`open`, `true` par défaut) et l'indication que faire glisser son bord en dessous de sa taille minimale le ferme (`collapsible`, `true` par défaut).

Chaque nœud possède un `id`. Une disposition écrite par l'app peut omettre les identifiants : la zone les attribue, et toute disposition qu'elle signale les contient. Repasser une disposition signalée conserve l'identité de chaque groupe, que les méthodes de la ref utilisent pour désigner les groupes. La zone remet aussi en ordre ce qu'on lui donne : un groupe ou une division vide disparaît, une division d'un seul enfant devient cet enfant, une division à l'intérieur d'une division de même axe est fusionnée dans son parent, `activeIndex` reste dans les bornes, une clé listée deux fois garde sa première place. Les dispositions qu'elle signale ont toujours cette forme canonique unique.

La disposition appartient à l'app (`layout`) : chaque changement effectué par l'utilisateur (un onglet sélectionné, déplacé ou fermé, une division ou un dock redimensionné, un dock ouvert ou fermé) est signalé sous la forme de la nouvelle disposition complète (`onLayoutChange`), et la zone affiche la disposition que l'app lui repasse. L'app modifie elle-même la disposition en passant une nouvelle valeur : une disposition enregistrée restaurée, une commande qui réorganise l'espace de travail. Une zone sans `layout` conserve la sienne, en partant de `defaultLayout`, et signale tout de même chaque changement.

<a id="panels-content"></a>

## Contenu des panneaux

Ce qu'affiche un panneau revient à l'app : `renderPanel` le rend à partir de la clé du panneau (`panel.id`). Chaque panneau d'un groupe est placé et seul celui affiché est visible, de sorte que changer d'onglet conserve le contenu de chaque panneau ; et lorsqu'un panneau se déplace (vers un autre groupe, dans un dock, dans un zoom et en sens inverse), le même contenu se déplace avec lui : les signaux qu'il a créés, le texte d'un champ de saisie, une position de défilement, la page d'une web view, tout reste. La zone rend un panneau une seule fois, lorsqu'il apparaît pour la première fois, et libère son contenu lorsque le panneau quitte la disposition (`onPanelRemove`).

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderPanel={(panel) => (panel.id === "terminal" ? <Terminal /> : <Editor file={panel.id} />)}
  onPanelActiveChange={({ panel, active }) => active && setTitle(panel)}
  onPanelRemove={({ panel }) => closeFile(panel)}
/>
```

`panels` définit ce que chaque panneau autorise, par clé ; un panneau non listé autorise tout :

| Champ | Défaut | Description |
|---|---|---|
| `id` | | La clé du panneau. |
| `closable` | `true` | Il peut être fermé. |
| `zoomable` | `true` | Son groupe peut être zoomé pendant qu'il est affiché. |
| `visible` | `true` | Il est visible. Un panneau masqué garde sa place et y revient ; un groupe ou une division dont tous les panneaux sont masqués ne prend aucune place. |

<a id="tabs"></a>

## Onglets

Chaque groupe a une barre d'onglets avec un onglet par panneau visible, dans l'ordre de son `panels`. `renderTab` rend ce qu'affiche un onglet (son titre, une icône, un bouton de fermeture propre à l'app) ; sans lui, un onglet affiche la clé du panneau. La zone en fait l'onglet : un appui le sélectionne, un glissement déplace son panneau, les lecteurs d'écran l'annoncent comme un onglet avec son état de sélection, et les classes `selected:` de `tabClass` stylent celui qui est affiché. La valeur d'un onglet indique ce dont l'app a besoin pour le dessiner :

| Champ | Type | Description |
|---|---|---|
| `panel` | `string` | La clé du panneau. |
| `group` | `number` | L'identifiant du groupe d'onglets auquel il appartient. |
| `index` | `number` | Sa position parmi les onglets visibles du groupe. |
| `active` | `boolean` | C'est l'onglet affiché du groupe. |
| `closable` | `boolean` | La zone le fermerait : il est fermable, la zone n'est pas verrouillée, et son groupe peut s'en défaire. |
| `zoomed` | `boolean` | Son groupe est zoomé. |

```tsx
let area!: DockAreaRef;

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  renderTab={(tab) => (
    <View class="flex-row items-center gap-2">
      <Text class="text-sm">{titles[tab.panel]}</Text>
      <If when={tab.closable}>
        <Button onPress={() => area.closePanel(tab.panel)} accessibilityLabel="Close" class="rounded-sm px-1 hover:bg-muted">
          <Text class="text-xs">×</Text>
        </Button>
      </If>
    </View>
  )}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```

<a id="drag-and-drop"></a>

## Glisser-déposer

Un onglet glissé au-dessus d'un groupe montre où il atterrirait, et le dépôt l'y place :

| Déposé sur | Le panneau |
|---|---|
| Une barre d'onglets | Rejoint ce groupe, entre les onglets près desquels il est déposé |
| Le milieu du contenu d'un groupe | Rejoint ce groupe |
| Un bord du contenu d'un groupe (ses 35 % extérieurs de chaque côté) | Divise ce groupe : un nouveau groupe à lui seul de ce côté |

Pendant le survol, la zone affiche l'indicateur de dépôt sur la partie du groupe que le panneau occuperait (tout le contenu pour rejoindre, la moitié pour diviser) : une partie que l'app stylise (`dropIndicatorClass`), avec un contenu propre si l'app en rend un (`renderDropIndicator`, qui reçoit le `group`, le `side` qu'il détache ou la barre d'onglets `index`). Il se déplace nativement vers chaque nouvel emplacement, avec une transition douce, et apparaît en fondu sur un autre groupe tandis que le précédent disparaît (immédiatement lorsque l'utilisateur demande moins d'animations). Ce qui suit le pointeur ou le doigt revient aussi à l'app (`renderDragPreview`). Un dépôt est un seul changement de la disposition, signalé une seule fois ; un dépôt qui ne changerait rien ne change rien.

Une zone verrouillée, une zone zoomée, et le dernier panneau d'un groupe lorsque rien ne se trouve à côté du groupe, ne permettent aucun glissement.

## Docks

Un dock s'ouvre et se ferme sans perdre ses panneaux ni sa taille : le fermer conserve son arbre, et l'ouvrir affiche les mêmes groupes à la même taille. Le bord entre un dock et le centre est une poignée que l'utilisateur fait glisser pour redimensionner le dock ; il reste d'au moins 100 points et le centre conserve au moins 100 points, et un dock repliable relâché en dessous de 50 points se ferme et conserve sa taille pour sa prochaine ouverture. La zone s'ajuste toujours à ses limites : un dock s'affiche à sa `size` dans la place que la zone lui laisse, et lorsque même cela ne tient pas, les docks rétrécissent avec le reste et les tailles minimales des divisions cèdent. `renderDock` dessine le chrome propre à un dock avant sa disposition (une bande de titre, un bouton de repli), et reçoit ses `placement`, `open`, `size` et `collapsible` ; `dockClass` stylise son cadre.

Ouvrez, fermez et redimensionnez les docks depuis l'app via la ref (`toggleDock`, `setDockOpen`, `setDockSize`), qui fonctionnent dans les deux présentations, ou en écrivant les `open` et `size` du dock dans la disposition qu'elle passe (`open` appartient à la présentation complète). `onDockOpenChange` signale chaque fois qu'un dock s'affiche ou se masque, mesuré par rapport au `open` de la disposition (une zone compacte dès le départ signale masqué chaque dock ouvert dans la disposition), de sorte qu'un bouton bascule qui part du `open` de la disposition et suit `onDockOpenChange` reflète toujours l'état du dock :

```tsx
const terminalOpen = signal(true);

<DockArea
  ref={area}
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  onDockOpenChange={({ placement, open }) => placement === "bottom" && terminalOpen.set(open)}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>

<Button selected={terminalOpen()} onPress={() => area.toggleDock("bottom")} class="px-3 py-1.5 selected:bg-muted">
  <Text>Terminal</Text>
</Button>
```

## Zoom

Un groupe zoomé remplit toute la zone jusqu'à ce qu'il soit dézoomé ou quitte la disposition (`area.toggleZoom(group)`, et `area.toggleZoom()` pour dézoomer), et `onZoomChange` signale le panneau qu'il affiche, ou `null`. Le zoom appartient au groupe, il reste donc zoomé lorsque son panneau affiché se ferme et que le suivant prend le relais. Un panneau avec `zoomable: false` empêche son groupe d'être zoomé pendant qu'il est affiché.

<a id="locking"></a>

## Verrouillage

`locked` maintient l'arrangement tel quel : aucun glissement d'onglet, aucun dépôt, aucune fermeture. La sélection des onglets, le redimensionnement et l'ouverture et la fermeture des docks fonctionnent toujours, un espace de travail verrouillé reste donc un espace de travail utilisable.

<a id="methods"></a>

## Méthodes

`ref={area}` donne accès aux méthodes de la zone (`DockAreaRef`), pour les commandes, raccourcis et menus de l'app. Chaque modification est signalée avec `onLayoutChange`, comme celles de l'utilisateur. Une méthode à laquelle on donne un panneau, un groupe, un index d'onglet ou un dock que la disposition n'a pas laisse la disposition telle quelle et journalise un avertissement qui nomme la méthode et la valeur.

| Méthode | Description |
|---|---|
| `layout()` | `Promise<DockAreaLayout>` : la disposition affichée. |
| `addPanel(panel, placement?, size?)` | Ajoute un panneau à une région (`"center"`, la valeur par défaut, `"left"`, `"right"`, `"bottom"`), dans son premier groupe d'onglets, affiché ; un dock manquant est créé, de `size` de large. Un panneau que la zone contient déjà y est déplacé. |
| `removePanel(panel)` | Retire un panneau, quelles que soient ses options. |
| `closePanel(panel)` | Ferme un panneau comme le ferait son onglet : sauf si la zone est verrouillée, si le panneau n'est pas fermable, ou s'il est le dernier panneau d'un groupe sans rien à côté. |
| `movePanel(panel, target)` | Déplace un panneau vers `target` : `{ group, side?, index?, activate?, size? }`, dans le groupe d'onglets `group` (à `index`) ou dans un nouveau groupe sur son `side` (`size` points le long de la nouvelle division). |
| `splitAt(group, panel, side)` | Place un panneau dans un nouveau groupe d'onglets sur un côté (`"left"`, `"right"`, `"top"`, `"bottom"`) d'un conteneur. |
| `selectPanel(panel)` | Affiche un panneau dans son groupe. |
| `selectTab(group, index)` | Affiche un onglet d'un groupe. |
| `toggleDock(placement)`, `setDockOpen(placement, open)` | Ouvre ou ferme un dock. |
| `setDockSize(placement, size)` | Définit la taille d'un dock perpendiculairement à son bord (au moins 100). |
| `toggleZoom(group?)` | Zoome un groupe, ou le dézoome s'il est zoomé ; sans `group`, dézoome le groupe zoomé. |
| `zoomedGroup()` | `Promise<number \| null>` : l'identifiant du groupe zoomé. |
| `groupOf(panel)` | `Promise<number \| null>` : l'identifiant du groupe d'onglets qui contient un panneau. |

En Rust, `component_ref::<DockArea>()` et `.component_ref(&r)` sur la zone donnent une ref dont `r.api::<DockAreaApi>()` a les mêmes méthodes en snake case.

<a id="saving-and-restoring"></a>

## Sauvegarde et restauration

Une disposition signalée est une donnée simple : la sauvegarder revient à appliquer `JSON.stringify(layout)` puis à l'écrire dans le [stockage](../modules/nsh.md#storage), et la restaurer revient à passer la valeur analysée comme `layout`. `onLayoutChange` signale chaque changement, y compris un redimensionnement et une sélection d'onglet, écrivez donc dans le stockage une fois que les changements se sont stabilisés (un court minuteur réinitialisé à chaque signalement).

En Rust, `DockAreaLayout::to_state` et `from_state` lisent et écrivent `DockAreaState`, le format de fichier de disposition que le dock de `gpui-base` utilise aussi.

<a id="phones-and-narrow-windows"></a>

## Téléphones et fenêtres étroites

Le dock s'adapte à sa propre largeur. Une zone large de 600 points ou plus (dans une fenêtre de bureau, sur le web, sur une tablette, un iPad en plein écran, un pliable ouvert) est l'espace de travail complet : divisions, groupes et docks côte à côte, comme dans les apps multi-volets des tablettes. Au doigt sur un téléphone ou une tablette, un glissement d'onglet démarre par un appui long, comme le glisser-déposer d'iPadOS, de sorte qu'une barre d'onglets défile toujours sous un balayage, et les poignées offrent une zone tactile plus large avec la même apparence.

Une zone de moins de 600 points (sur un téléphone, un iPad en Slide Over, dans une fenêtre de bureau ou de navigateur étroite, ou dans une colonne étroite d'une zone plus large) présente la même disposition pour un seul écran, comme les vues scindées de l'iPad replient leurs colonnes et comme le volet de support de Material Design devient une bottom sheet :

- Le centre affiche un groupe à la fois, en taille réelle. Sa barre d'onglets liste chaque panneau visible du centre, et sélectionner un panneau d'un autre groupe fait de ce groupe celui qui est affiché.
- Les docks gauche et droit sont des tiroirs au-dessus du centre depuis leur bord, aussi larges que le dock, et le dock inférieur est une sheet aussi haute que le dock. Un seul s'affiche à la fois, lorsque l'app le présente (`toggleDock`, `setDockOpen`, qui ferment l'autre) ; il glisse pour entrer et sortir, et un appui sur son arrière-plan, Échap ou retour le ferme. Le passage à la présentation compacte n'en affiche aucun.
- Un onglet glissé (au doigt après un appui long, au pointeur immédiatement) se déplace dans la barre d'onglets pour la réordonner.

Chaque panneau reste placé dans les deux présentations, de sorte que le basculement conserve son contenu. Le tiroir ou la sheet affiché relève de la présentation compacte elle-même : le `open` de la disposition appartient à la présentation complète, et présenter ou fermer un tiroir ne signale aucun `onLayoutChange`, de sorte qu'une zone qui s'élargit à nouveau affiche les docks exactement comme ils étaient. `onDockOpenChange` signale les deux : un dock dont le `open` de la disposition change dans la présentation complète, un tiroir ou une sheet affiché ou fermé dans la présentation compacte, et chaque dock dont l'état affiché change lorsque la présentation bascule. Dans `renderDock`, `open` indique si le dock s'affiche dans la présentation courante. La disposition reste aussi la même valeur, de sorte qu'une zone qui franchit 600 points (un pliable qui s'ouvre, un iPad qui rejoint Split View, une fenêtre ou une colonne redimensionnée) garde chaque panneau là où il était, et l'app sauvegarde une seule disposition. La largeur de la zone décide une fois qu'elle est mise en page (la largeur de la fenêtre la remplace avant cela), et `compact` choisit la présentation à la place de la largeur. Les tiroirs, la sheet et l'arrière-plan sont des parties que l'app stylise (`drawerClass`, `sheetClass`, `backdropClass`), comme le reste de la zone.

```tsx
<DockArea
  layout={layout()}
  onLayoutChange={(e) => layout.set(e.layout)}
  drawerClass="bg-background border-r border-border"
  sheetClass="rounded-t-(--radius-lg) bg-background"
  backdropClass="bg-black/40"
  renderTab={(tab) => <Text>{titles[tab.panel]}</Text>}
  renderPanel={(panel) => <Editor file={panel.id} />}
/>
```
## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `layout` | `.layout(..)` | `DockAreaLayout` | aucun | La disposition affichée (contrôlée) : renvoyez ce que `onLayoutChange` signale. |
| `defaultLayout` | `.default_layout(..)` | `DockAreaLayout` | un centre vide | La disposition initiale, quand `layout` n'est pas défini ; ensuite, la zone conserve la sienne. |
| `locked` | `.locked(..)` | `boolean` | `false` | Aucun glissement, dépôt ni fermeture d'onglet. |
| `compact` | `.compact(..)` | `boolean` | selon la largeur | La présentation téléphone (`true`) ou la présentation complète (`false`) ; sans cette prop, compacte tant que la zone fait moins de 600 points de large. |
| `panels` | `.panels(..)` | `DockPanelOptions[]` | `[]` | Ce que chaque panneau autorise, par clé : `closable`, `zoomable`, `visible`. |
| `renderPanel` | `.render_panel(\|panel\| ..)` | `(panel: DockPanel) => JSX.Element` | aucun | Le contenu d'un panneau, selon sa clé (`panel.id`). |
| `renderTab` | `.render_tab(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | la clé | Ce que montre un onglet. |
| `renderDropIndicator` | `.render_drop_indicator(\|drop\| ..)` | `(drop: DockDropIndicator) => JSX.Element` | aucun | Ce que contient l'indicateur de dépôt : `group`, `side`, `index`. |
| `renderDock` | `.render_dock(\|dock\| ..)` | `(dock: DockInfo) => JSX.Element` | aucun | Le chrome propre à un dock, avant sa disposition : `placement`, `open` (affiché dans la présentation courante), `size`, `collapsible`. |
| `renderEmpty` | `.render_empty(\|placement\| ..)` | `(placement: DockPlacement) => JSX.Element` | aucun | Ce que montre un centre vide. |
| `renderDragPreview` | `.render_drag_preview(\|tab\| ..)` | `(tab: DockTab) => JSX.Element` | aucun | Ce qui suit le pointeur ou le doigt pendant le glissement d'un onglet. |
| `groupClass`, `groupStyle` | `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le cadre de chaque groupe d'onglets. |
| `tabBarClass`, `tabBarStyle` | `.tab_bar_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Chaque barre d'onglets (`flex-row` pour une rangée). |
| `tabClass`, `tabStyle` | `.tab_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Chaque onglet ; `selected:` pour celui qui est affiché. |
| `contentClass`, `contentStyle` | `.content_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le cadre de contenu de chaque groupe, où s'affichent ses panneaux. |
| `dropIndicatorClass`, `dropIndicatorStyle` | `.drop_indicator_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'indicateur de dépôt. |
| `handleClass`, `handleStyle` | `.handle_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'indicateur de chaque poignée, entre les groupes d'un split et au bord de chaque dock ; `group-hover:` et `group-active:` suivent la poignée. Il mesure 1 point de large sur la poignée et couvre toute sa longueur sauf indication contraire, donc `bg-border` donne un trait fin dans les deux cas ; `w-[3px]` / `h-[3px]` l'épaississent. |
| `handleThumbClass`, `handleThumbStyle` | `.handle_thumb_class(..)`, `.handle_thumb_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le pouce de chaque poignée : une prise centrée sur la ligne, dessinée à la verticale comme sur une ligne verticale et pivotée d'un quart de tour sur une ligne horizontale, de sorte qu'une seule classe sert les deux axes. Elle reste la même vue quand la poignée est survolée, pressée et glissée ; ce sont donc les classes `group-hover:` et `group-active:` qui la font passer d'un état à l'autre en transition (`h-11 w-[3px] rounded-full bg-muted-foreground opacity-0 scale-y-0 transition group-hover:opacity-40 group-hover:scale-y-[0.45] group-active:opacity-90 group-active:scale-y-100`). |
| `dockClass`, `dockStyle` | `.dock_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le cadre de chaque dock. |
| `drawerClass`, `drawerStyle` | `.drawer_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Compact : les tiroirs des docks latéraux. |
| `sheetClass`, `sheetStyle` | `.sheet_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Compact : la feuille du dock du bas. |
| `backdropClass`, `backdropStyle` | `.backdrop_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Compact : le fond derrière un tiroir ou une feuille ouverts ; appuyer dessus le ferme. |
| `handleAccessibilityLabel` | `.handle_accessibility_label(..)` | `string` | aucun | Ce que disent les lecteurs d'écran pour chaque poignée, entre les groupes d'un split et au bord de chaque dock. |
| `ref` | `.component_ref(&r)` (`component_ref::<DockArea>()`) | `DockAreaRef` | | Les [méthodes](#methods) de la zone. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La zone elle-même : sa taille dans son parent (`flex-1`), son arrière-plan. Elle reste dans ses limites et ne tire aucune taille minimale de son contenu. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onLayoutChange` | `.on_layout_change(\|layout: &DockAreaLayout\| ..)` | La disposition a changé (un glissement, une sélection, un redimensionnement, l'ouverture ou la fermeture d'un dock, une méthode) : `{ layout }`, la nouvelle disposition complète, avec tous ses identifiants. |
| `onPanelActiveChange` | `.on_panel_active_change(\|e: &DockAreaEvent\| ..)` (`PanelActiveChange(panel, active)`) | `{ panel, active }` : un panneau est devenu, ou a cessé d'être, l'onglet affiché de son groupe (un dock fermé n'en affiche aucun). Une seule fois par changement ; un panneau qui part n'est pas prévenu avec `false` : `onPanelRemove` marque sa fin. |
| `onPanelRemove` | `.on_panel_remove(\|panel: &PanelId\| ..)` | `{ panel }` : un panneau a quitté la zone pour de bon : fermé, supprimé ou absent d'une nouvelle disposition. Un panneau qui se déplace ne le reçoit jamais. |
| `onZoomChange` | `.on_zoom_change(\|panel: &Option<PanelId>\| ..)` | Un groupe a été zoomé ou dézoomé : `{ panel }`, le panneau qu'il affiche, ou `null`. |
| `onDockOpenChange` | `.on_dock_open_change(\|e: &DockAreaEvent\| ..)` (`DockOpenChange(placement, open)`) | `{ placement, open }` : un dock s'est affiché ou masqué : sa disposition `open` a changé dans la présentation complète, son tiroir ou sa feuille a été affiché ou fermé dans la présentation compacte, ou la présentation a basculé. |

<a id="parts"></a>

## Parties

| Partie | Contenue dans | Stylée avec | États |
|---|---|---|---|
| La zone | | `class`, `style` | |
| Un groupe d'onglets | une région | `groupClass`, `groupStyle` | |
| Une barre d'onglets | un groupe | `tabBarClass`, `tabBarStyle` | |
| Un onglet | une barre d'onglets | `tabClass`, `tabStyle` ; `renderTab` | `selected:`, `active:`, `hover:` |
| Le contenu d'un groupe | un groupe | `contentClass`, `contentStyle` ; `renderPanel` | |
| L'indicateur d'une poignée | entre les groupes d'un split, au bord d'un dock | `handleClass`, `handleStyle` | `group-hover:`, `group-active:` |
| Le pouce d'une poignée | centré sur la ligne d'une poignée | `handleThumbClass`, `handleThumbStyle` | `group-hover:`, `group-active:` (pressé jusqu'à la fin du glissement) |
| Un dock | un bord | `dockClass`, `dockStyle` ; `renderDock` | |
| L'indicateur de dépôt | au-dessus d'un groupe pendant un glissement | `dropIndicatorClass`, `dropIndicatorStyle` ; `renderDropIndicator` | |
| L'aperçu du glissement | sous le pointeur ou le doigt | `renderDragPreview` | |
| Le centre vide | le centre | `renderEmpty` | |
| Un tiroir, la feuille, le fond | au-dessus du centre, en mode compact | `drawerClass`, `sheetClass`, `backdropClass` (et leurs styles) | |

<a id="accessibility"></a>

## Accessibilité

- Chaque onglet est un onglet avec son état sélectionné pour les lecteurs d'écran, comme [`Tab`](./tabs.md), et l'activer le
  sélectionne. Son libellé est le texte que dessine `renderTab`.
- Chaque poignée, entre les groupes d'un split et au bord de chaque dock, est un élément ajustable libellé
  `handleAccessibilityLabel`. Les poignées entre les groupes d'un split sont celles de [Resizable](./resizable.md) : un lecteur d'écran
  les déplace de 10 points à la fois, annoncés avec `onLayoutChange`.
- Dans la présentation compacte, Échap et le retour ferment le tiroir ou la feuille affichés.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes par plateforme

- Un pointeur (une souris, un trackpad, un stylet qui survole l'écran) fait glisser un onglet dès qu'il se déplace de 4 points
  bouton enfoncé, sur toutes les plateformes : un iPad avec un trackpad et une fenêtre de navigateur étroite pilotée par un
  glissement de souris se comportent comme un poste de bureau. Sur macOS, Windows, Linux et GPUI, chaque appui compte comme
  celui d'un pointeur, y compris celui d'un doigt sur l'écran tactile d'un portable.
- Un doigt sur iOS, iPadOS et Android fait glisser un onglet après un appui long, comme le glisser-déposer d'iPadOS, de sorte
  qu'un balayage sur la barre d'onglets la fait défiler.
- Postes de bureau et web : les poignées affichent le curseur de redimensionnement de leur axe.
- Téléphones et zones étroites : la présentation compacte, avec des tiroirs et une feuille inférieure.
- Chaque plateforme dessine ce que l'app stylise : onglets, barres d'onglets, poignées, indicateur de dépôt, docks, tiroirs et feuille.
