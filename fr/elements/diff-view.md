---
title: "DiffView"
description: "Le composant DiffView : les modifications entre deux textes ou d'un patch, en vue côte à côte ou unifiée, avec les mots modifiés au sein des lignes mis en évidence, les lignes inchangées regroupées en séparateurs dépliables, la coloration syntaxique, le retour à la ligne automatique, des actions par modification, la sélection de lignes et des annotations de revue."
group: base
demo: el-diff-view
source_hash: 2004ab3c0d854626
---

# DiffView

`DiffView` affiche les modifications entre deux textes comme le font les outils de revue de code : côte à côte, l'ancien texte à gauche et le nouveau à droite avec leurs lignes alignées, ou en mode unifié, les lignes supprimées au-dessus des lignes ajoutées. Dans une ligne modifiée, les mots qui ont changé sont surlignés, les lignes inchangées entre les modifications se replient en séparateurs dépliables, et le texte est coloré avec les couleurs de syntaxe du [`Editor`](./editor.md). Il affiche deux textes (`oldValue` et `newValue`) ou les fichiers d'un diff unifié (`patch` : celui de `git diff`, d'une pull request), chacun sous son en-tête, et il est conçu pour la revue de modifications, y compris les modifications proposées par une IA : les actions de l'app sur chaque modification la conservent ou l'annulent. Seules les lignes visibles sont créées, de sorte qu'un long fichier défile comme un court.

`DiffView` gère le comportement et vient avec une apparence propre construite à partir des tokens du thème : le `font-mono` du thème à 13pt dans des lignes de 20pt, les numéros de ligne en `muted-foreground`, les lignes ajoutées teintées en vert et les lignes supprimées en rouge, les mots modifiés dans une teinte plus forte, une barre au bord de la gouttière de chaque ligne modifiée, et des séparateurs sur `muted`. Chaque partie accepte les styles de l'app par-dessus ces valeurs par défaut (`classes` et `styles`). Rust en crée un avec `nsh_base::diff_view()`, TSX avec `<DiffView>` depuis `nsh/base`.

```rust tabs
use nsh_base::diff_view;
use nsh_core::prelude::*;

const OLD: &str = "fn total(prices: &[u32]) -> u32 {\n    prices.iter().sum()\n}\n";
const NEW: &str = "fn total(prices: &[u64]) -> u64 {\n    prices.iter().copied().sum()\n}\n";

fn review() -> impl IntoElement {
    diff_view().old_value(OLD).new_value(NEW).language("rust").flex_1()
}
```

```tsx tabs
import { mount } from "nsh";
import { DiffView } from "nsh/base";

const OLD = `fn total(prices: &[u32]) -> u32 {
    prices.iter().sum()
}
`;
const NEW = `fn total(prices: &[u64]) -> u64 {
    prices.iter().copied().sum()
}
`;

function App() {
  return <DiffView oldValue={OLD} newValue={NEW} language="rust" class="flex-1" />;
}

mount(App);
```

La vue remplit la boîte que l'app lui donne (`flex-1`, une hauteur) et défile à l'intérieur : verticalement à travers les lignes, et horizontalement jusqu'à la ligne la plus longue, les deux côtés d'une vue côte à côte ensemble. Avec `softWrap`, les longues lignes passent à la ligne à la largeur du côté, et une ligne en vue côte à côte a la hauteur de son côté le plus haut, ce qui garde les côtés alignés.

<a id="two-texts-or-a-patch"></a>

## Deux textes ou un patch

- **Deux textes** : `oldValue` et `newValue`. Les lignes sont comparées telles quelles, de sorte qu'un saut de ligne final ajouté ou supprimé est une modification, comme git l'affiche.
- **Un patch** : `patch`, un diff unifié d'un ou de plusieurs fichiers (`git diff`, `git format-patch`, `diff -u` ; renommages, modes, fichiers nouveaux, supprimés et binaires, et un message de commit placé avant, lus tels que git les écrit). La vue affiche les lignes de ses hunks, numérotées comme dans le fichier, chaque hunk sous un séparateur portant son en-tête (la fonction dans laquelle il se trouve), et chaque fichier d'un patch multi-fichiers sous un en-tête qui lui est propre ([Fichiers d'un patch](#files-of-a-patch)). Le chemin de chaque fichier désigne son langage lorsque `language` n'est pas défini.

```tsx
const PATCH = `diff --git a/src/total.rs b/src/total.rs
--- a/src/total.rs
+++ b/src/total.rs
@@ -10,3 +10,3 @@ impl Cart {
-    fn total(&self) -> u32 {
+    fn total(&self) -> u64 {
         self.prices.iter().sum()
     }
`;

<DiffView patch={PATCH} layout="unified" class="flex-1" />
```

`language` désigne le langage comme le fait `Editor` : un nom, un alias, une extension ou un nom de fichier (`"rust"`, `"tsx"`, `"main.go"`, `"Dockerfile"`).

<a id="files-of-a-patch"></a>

## Fichiers d'un patch

Un patch de plusieurs fichiers affiche chaque fichier sous une ligne d'en-tête : par défaut son chemin (`old → new` lorsqu'il est renommé), ses nombres de lignes ajoutées et supprimées, et `▾`, et un appui dessus replie le fichier sur son en-tête (`▸`) ou le déplie. `renderFileHeader` dessine les en-têtes à la manière de l'app (et en affiche aussi un au-dessus d'un patch d'un seul fichier), en recevant le fichier (`DiffFile`) : `index`, `path`, `oldPath` (renommé ou copié depuis), `status` (`"modified"`, `"added"`, `"deleted"`, `"renamed"`, `"copied"`), `binary` (le patch n'en montre aucune ligne), `added`, `deleted`, `hunks`, `firstHunk` et `collapsed`. L'en-tête de l'app appelle `toggleFile(path)` de la ref ; `collapseFile` et `expandFile` définissent l'état, et chaque changement est signalé avec `onFileToggle({ file })`. Un fichier replié reste replié tant qu'un nouveau `patch` le contient encore.

Les modifications sont comptées d'un fichier à l'autre, dans l'ordre : les modifications d'un fichier vont de `firstHunk` à `firstHunk + hunks - 1`, ce qu'utilisent `goToHunk`, `renderHunkActions` et `hunks()` (le `file` d'un `DiffHunk` est l'index de son fichier et ses lignes sont comptées dans ce fichier), et `stats()` additionne celles de tous les fichiers. `goToHunk` déplie d'abord un fichier replié.

```tsx
let diff!: DiffViewRef;
const files = signal<DiffFile[]>([]);

<View class="flex-1 flex-row">
  <View class="w-48">
    <Each of={files()}>
      {(file) => (
        <Button onPress={() => diff.scrollToFile(file().path)} class="px-2 py-1">
          <Text class="text-sm">{file().path} +{file().added} −{file().deleted}</Text>
        </Button>
      )}
    </Each>
  </View>
  <DiffView
    ref={(r) => {
      diff = r;
      r.files().then((list) => files.set(list));
    }}
    patch={PULL_REQUEST}
    renderFileHeader={(file) => (
      <Button onPress={() => diff.toggleFile(file.path)} class="flex-1 flex-row items-center gap-2 bg-muted px-2">
        <Text>{file.collapsed ? "▸" : "▾"}</Text>
        <Text class="flex-1 text-sm font-medium">{file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}</Text>
        <Text class="text-xs text-muted-foreground">{file.binary ? "Binary" : file.status}</Text>
      </Button>
    )}
    class="flex-1"
  />
</View>
```

<a id="layout-and-inline-changes"></a>

## Disposition et modifications intra-ligne

`layout` vaut `"split"` (la valeur par défaut : côte à côte, chaque ligne supprimée à côté de la ligne ajoutée qui lui ressemble le plus) ou `"unified"` (une seule colonne, les lignes supprimées d'une modification au-dessus de ses lignes ajoutées, avec les deux numéros de ligne). `inline` décide de ce qui est surligné dans une ligne modifiée :

| `inline` | Ce qui est surligné |
|---|---|
| `"wordAlt"` (par défaut) | Les mots qui ont changé, réunis lorsqu'ils sont distants d'un seul caractère, de sorte qu'une expression modifiée se lit comme un tout |
| `"word"` | Chaque mot qui a changé |
| `"char"` | Chaque caractère qui a changé |
| `"none"` | Rien : les teintes des lignes seules |

Les mots sont des suites de lettres, de chiffres et de `_` ; chaque caractère CJK, kana et syllabe hangul est un mot à part entière, de sorte qu'un caractère modifié dans une phrase ne marque que lui-même. Une ligne presque entièrement modifiée n'affiche que sa teinte.

`indicators` marque les lignes modifiées à côté de leurs numéros : `"bars"` (par défaut, une barre au bord de la gouttière), `"classic"` (`+` et `−` avant le texte) ou `"none"`. `background={false}` laisse les lignes modifiées sans teinte, et `lineNumbers={false}` masque les numéros.

```tsx
<DiffView oldValue={before()} newValue={after()} language="md" layout="unified" inline="word" indicators="classic" class="flex-1" />
```

<a id="collapsed-lines"></a>

## Lignes repliées

Autour de chaque modification, `contextLines` lignes inchangées sont affichées (3 par défaut) ; les lignes inchangées entre les modifications, ainsi que celles avant la première et après la dernière, se replient en un séparateur qui indique combien de lignes il masque. Un appui dessus les affiche toutes. `expandAll` affiche chaque ligne ; `expand`, `expandAll()` et `collapseAll()` de la ref les révèlent et les replient depuis l'app.

`renderSeparator` dessine les séparateurs à la manière de l'app. Il reçoit le séparateur (`DiffSeparator`) : `gap`, l'index de la suite repliée (0 avant la première modification, `i` entre les modifications `i - 1` et `i`), `lines`, le nombre de lignes qu'il masque, `first` et `last`, et pour un patch le `header` du hunk. `expand(gap, direction, lines)` lui fait afficher `"all"` ses lignes (par défaut), ou `lines` (20 par défaut) `"up"`, juste au-dessus de la modification située sous le séparateur, ou `"down"`, juste sous la modification située au-dessus. Le premier séparateur se déplie vers le haut et le dernier vers le bas.

```tsx
let diff!: DiffViewRef;

<DiffView
  ref={diff}
  oldValue={before()}
  newValue={after()}
  language="ts"
  renderSeparator={(sep) => (
    <View class="flex-1 flex-row items-center gap-1 bg-muted px-2">
      <If when={!sep.first}>
        <Button onPress={() => diff.expand(sep.gap, "down")} class="px-1"><Text>↓</Text></Button>
      </If>
      <If when={!sep.last}>
        <Button onPress={() => diff.expand(sep.gap, "up")} class="px-1"><Text>↑</Text></Button>
      </If>
      <Button onPress={() => diff.expand(sep.gap)} class="flex-1">
        <Text class="text-xs text-muted-foreground">{sep.header ?? `${sep.lines} unchanged lines`}</Text>
      </Button>
    </View>
  )}
  class="flex-1"
/>
```

<a id="keeping-and-reverting-changes"></a>

## Conserver et annuler des modifications

`renderHunkActions` place les actions de l'app en haut à droite de chaque modification visible, en recevant la modification (`DiffHunk` : `index`, `oldStart`, `oldLines`, `newStart`, `newLines`, lignes à partir de 0, et `file`, l'index de son fichier dans un patch). Elles appellent la ref : `revertHunk(index)` remet les anciennes lignes de la modification dans le nouveau texte, `acceptHunk(index)` fait de ses nouvelles lignes celles de l'ancien texte. La vue affiche aussitôt le résultat et signale les deux textes avec `onChange({ change })` (`{ oldValue, newValue }`), que l'app redéfinit comme props. Conserver ou annuler la modification d'une IA, une modification à la fois, donne ceci :

```tsx
import { signal, Text, View } from "nsh";
import { Button, DiffView, type DiffViewRef } from "nsh/base";

function Proposal(props: { file: string; current: string; proposed: string; onApply: (text: string) => void }) {
  let diff!: DiffViewRef;
  const current = signal(props.current);
  const proposed = signal(props.proposed);
  return (
    <View class="flex-1">
      <DiffView
        ref={diff}
        oldValue={current()}
        newValue={proposed()}
        language={props.file}
        onChange={({ change: { oldValue, newValue } }) => {
          current.set(oldValue);
          proposed.set(newValue);
          props.onApply(oldValue);
        }}
        renderHunkActions={(hunk) => (
          <View class="flex-row gap-1">
            <Button onPress={() => diff.revertHunk(hunk.index)} class="rounded bg-background px-2 py-0.5 border border-border">
              <Text class="text-xs">Revert</Text>
            </Button>
            <Button onPress={() => diff.acceptHunk(hunk.index)} class="rounded bg-primary px-2 py-0.5">
              <Text class="text-xs text-primary-foreground">Keep</Text>
            </Button>
          </View>
        )}
        class="flex-1"
      />
    </View>
  );
}
```

Ici, l'ancien texte est le fichier tel qu'il est : conserver une modification l'applique au fichier (`onApply`), l'annuler la retire de la proposition. Une vue affichant un `patch` montre des extraits des fichiers, et ses modifications restent telles quelles.

<a id="methods"></a>

## Méthodes

`ref={diff}` donne les méthodes de la vue (`DiffViewRef`). Les méthodes qui renvoient une valeur (`hunks()`, `stats()`) renvoient en JS une `Promise` de celle-ci, il faut donc les `await` : `const changes = await diff.hunks()`. Pour les compteurs affichés à l'écran, `onStatsChange` les signale à mesure qu'ils changent. Une méthode à laquelle on donne une modification, un séparateur ou un fichier que le diff n'a pas ne change rien et consigne un avertissement nommant la méthode et la valeur.

| Méthode | Description |
|---|---|
| `hunks()` | `Promise<DiffHunk[]>` : les modifications, dans l'ordre. |
| `stats()` | `Promise<DiffStats>` : `{ added, deleted, hunks }`, les lignes ajoutées et supprimées et le nombre de modifications. |
| `goToHunk(index)` | Fait défiler la modification `index` dans la vue, sa première ligne en haut. |
| `revertHunk(index)` | Remet les anciennes lignes de la modification `index` dans le nouveau texte et signale les textes (`onChange`). |
| `acceptHunk(index)` | Fait des nouvelles lignes de la modification `index` celles de l'ancien texte et signale les textes (`onChange`). |
| `expand(gap, direction?, lines?)` | Affiche les lignes que masque le séparateur `gap` : `"all"` (par défaut), ou `lines` (20 par défaut) `"up"` ou `"down"`. |
| `expandAll()` | Affiche chaque ligne inchangée. |
| `collapseAll()` | Replie à nouveau les lignes inchangées. |
| `nextHunk()` | `Promise<number \| null>` : fait défiler la modification suivante en haut et donne son index (après la dernière, la première). |
| `previousHunk()` | `Promise<number \| null>` : fait défiler la modification précédente en haut et donne son index (avant la première, la dernière). |
| `currentHunk()` | `Promise<number \| null>` : la dernière modification atteinte tant que la vue y reste, sinon celle en haut de la vue ou la première visible. |
| `selectedLines()` | `Promise<DiffLineRange \| null>` : les lignes sélectionnées sur les numéros de ligne. |
| `setSelectedLines(range)` | Sélectionne des lignes d'un côté (`null` : aucune), sans `onLineSelectionChange`. |
| `selectedText()` | `Promise<string>` : le texte des lignes sélectionnées. |
| `files()` | `Promise<DiffFile[]>` : les fichiers du patch, dans l'ordre, avec leurs compteurs (aucun pour deux textes). |
| `scrollToFile(path)` | Fait défiler l'en-tête du fichier à `path` en haut. |
| `collapseFile(path)` | Affiche seulement l'en-tête du fichier à `path`. |
| `expandFile(path)` | Affiche à nouveau les lignes du fichier à `path`. |
| `toggleFile(path)` | Replie le fichier à `path`, ou le déplie lorsqu'il est replié. |
| `hunkBounds()` | `Promise<DiffHunkBounds[]>` : où se trouve chaque modification dans les lignes, dans l'ordre ([Une règle d'aperçu](#an-overview-ruler)). |
| `scrollOffset()` | `Promise<Point>` : de combien les lignes sont défilées (`x` vaut 0). |
| `setScrollOffset(offset)` | Fait défiler les lignes jusqu'à `offset.y` immédiatement, aussi loin qu'elles vont, comme un curseur suit le pointeur qui le fait glisser. |

`nextHunk()` et `previousHunk()` continuent depuis la modification atteinte tant que la vue y reste, et sinon depuis le haut de la vue, de sorte qu'une modification proche de la fin qui ne peut pas défiler jusqu'en haut compte quand même. Boutons de modification suivante et précédente, avec les compteurs de `onStatsChange` :

```tsx
let diff!: DiffViewRef;
const stats = signal<DiffStats>({ added: 0, deleted: 0, hunks: 0 });

<View class="flex-row items-center gap-2 p-2">
  <Text class="text-sm text-green-600">+{stats().added}</Text>
  <Text class="text-sm text-red-600">−{stats().deleted}</Text>
  <Text class="text-sm text-muted-foreground">{stats().hunks} changes</Text>
  <Button onPress={() => diff.previousHunk()}><Text>Previous</Text></Button>
  <Button onPress={() => diff.nextHunk()}><Text>Next</Text></Button>
</View>
<DiffView ref={diff} oldValue={before()} newValue={after()} onStatsChange={(e) => stats.set(e.stats)} class="flex-1" />
```

<a id="an-overview-ruler"></a>

## Une règle d'aperçu

`onScroll({ offset, contentSize, size })` signale où se trouvent les lignes, avec les clés de celles d'un [`Scroll`](./scroll.md) : `offset.y`, de combien elles sont défilées (les lignes défilent verticalement, aussi larges que la vue, et les côtés horizontalement de leur côté : `offset.x` vaut 0), `contentSize`, la taille de toutes les lignes ensemble, et `size`, celle de la zone visible. Il se déclenche une fois la vue mise en page, puis à chaque changement de l'une de ces valeurs : lorsque les lignes défilent, lorsque la vue est redimensionnée, et lorsque les lignes changent de hauteur (autres textes, `layout`, `softWrap`, un fichier ou un séparateur déplié ou replié, une annotation mise en page). `hunkBounds()` donne l'emplacement de chaque modification dans les lignes (`DiffHunkBounds` : `{ index, bounds }`, `bounds` du haut de sa première ligne au bas de sa dernière, avec les annotations en dessous, sur toute la largeur de la vue), pour les modifications qui s'affichent : celles d'un fichier replié n'ont pas de lignes. `onHunkBoundsChange({ hunkBounds })` donne la même liste une fois la vue mise en page, puis à chaque déplacement ou changement de taille d'une modification, même lorsque les lignes gardent leur hauteur (une ligne modifiée en remplaçant une autre) : une règle en dessine les repères au lieu de les lire sur `onScroll`. `scrollOffset()` lit de combien les lignes sont défilées, et `setScrollOffset({ x, y })` fait défiler les lignes jusqu'à `y` immédiatement, de sorte qu'un curseur glissé suit le pointeur dans la même image.

Ensemble, ils forment une règle d'aperçu à côté de la vue, comme dans les éditeurs de code : un repère pour chaque modification, un curseur sur les lignes visibles, et un appui ou un glissement qui y fait défiler. Ici, la règle a la hauteur de la vue :

```rust tabs
use nsh_base::{DiffHunkBounds, DiffView, DiffViewApi, DiffViewEvent, diff_view, theme};
use nsh_core::prelude::*;

fn review(old: SharedString, new: SharedString) -> impl IntoElement {
    let diff = component_ref::<DiffView>();
    let ruler = element_ref();
    let ruler_top = stored(px(0.0));
    // How far the rows are scrolled, their height and the viewport's.
    let rows = signal((px(0.0), px(0.0), px(0.0)));
    let marks = signal(Vec::<DiffHunkBounds>::new());
    // Points of the rows per point of the ruler.
    let scale = move || {
        let (_, height, view) = rows.get();
        height.max(px(1.0)) / view.max(px(1.0))
    };
    // The thumb's middle at the pointer.
    let follow = move |page_y: Points| {
        let view = rows.get_untracked().2;
        let y = (page_y - ruler_top.get()) * scale() - view / 2.0;
        if let Some(api) = diff.api::<DiffViewApi>() {
            api.set_scroll_offset(point(px(0.0), y));
        }
    };
    view()
        .flex_1()
        .flex_row()
        .child(
            diff_view()
                .old_value(old)
                .new_value(new)
                .on_scroll(move |e: &DiffViewEvent| {
                    if let DiffViewEvent::Scroll(offset, content, size) = e {
                        rows.set((offset.y, content.height, size.height));
                    }
                })
                .on_hunk_bounds_change(move |list: &Vec<DiffHunkBounds>| marks.set(list.clone()))
                .component_ref(&diff)
                .flex_1(),
        )
        .child(
            view()
                .element_ref(&ruler)
                .w(px(12.0))
                .bg(move || theme().muted)
                .claim_touches(TouchClaim::on_start())
                .on_responder_grant(move |e: &ResponderEvent| {
                    let y = e.page.y;
                    spawn(async move {
                        ruler_top.replace(ruler.measure().await.map_or(px(0.0), |m| m.page.y));
                        follow(y);
                    });
                })
                .on_responder_move(move |e: &ResponderEvent| follow(e.page.y))
                .child(each(
                    marks,
                    |mark: &DiffHunkBounds| mark.index,
                    move |mark, _| {
                        view()
                            .absolute()
                            .left(px(0.0))
                            .right(px(0.0))
                            .bg(rgb(0xf59e0b))
                            .top(move || mark.get().bounds.origin.y / scale())
                            .h(move || (mark.get().bounds.size.height / scale()).max(px(2.0)))
                    },
                ))
                .child(
                    view()
                        .absolute()
                        .left(px(0.0))
                        .right(px(0.0))
                        .bg(move || theme().foreground.opacity(0.2))
                        .top(move || rows.get().0 / scale())
                        .h(move || rows.get().2 / scale()),
                ),
        )
}
```

```tsx tabs
import { Each, signal, View, type ViewRef } from "nsh";
import { DiffView, type DiffHunkBounds, type DiffViewRef } from "nsh/base";

let diff!: DiffViewRef;
let ruler!: ViewRef;
let rulerTop = 0;
const rows = signal({ y: 0, height: 0, view: 0 });
const marks = signal<DiffHunkBounds[]>([]);
// Points of the rows per point of the ruler.
const scale = () => Math.max(rows().height, 1) / Math.max(rows().view, 1);
// The thumb's middle at the pointer.
const follow = (pageY: number) => diff.setScrollOffset({ x: 0, y: (pageY - rulerTop) * scale() - rows().view / 2 });

<View class="flex-1 flex-row">
  <DiffView
    ref={diff}
    oldValue={before()}
    newValue={after()}
    onScroll={({ offset, contentSize, size }) => rows.set({ y: offset.y, height: contentSize.height, view: size.height })}
    onHunkBoundsChange={({ hunkBounds }) => marks.set(hunkBounds)}
    class="flex-1"
  />
  <View
    ref={ruler}
    class="w-3 bg-muted"
    onStartShouldSetResponder={() => true}
    onResponderGrant={async (e) => {
      const y = e.pageY;
      rulerTop = (await ruler.measure())?.pagePosition.y ?? 0;
      follow(y);
    }}
    onResponderMove={(e) => follow(e.pageY)}
  >
    <Each of={marks()}>
      {(mark) => (
        <View
          class="absolute inset-x-0 bg-amber-500"
          style={{ top: mark().bounds.origin.y / scale(), height: Math.max(mark().bounds.size.height / scale(), 2) }}
        />
      )}
    </Each>
    <View class="absolute inset-x-0 bg-foreground/20" style={{ top: rows().y / scale(), height: rows().view / scale() }} />
  </View>
</View>
```

Le `index` d'un repère est celui de la modification dans `hunks()`, dont `oldLines` et `newLines` distinguent une modification ajoutée (sans anciennes lignes) d'une modification supprimée (sans nouvelles lignes), pour colorer son repère.

<a id="review-comments"></a>

## Commentaires de revue

Les numéros de ligne sélectionnent des lignes d'un côté : un appui en sélectionne une, un appui avec Shift étend la sélection jusqu'à elle, et un glissement de la souris sur les numéros sélectionne ceux qu'elle survole. `onLineSelectionChange` signale les lignes sous la forme `range` (`DiffLineRange` : `{ side, start, end }`, lignes à partir de 0, `null` pour aucune), et un appui sur un numéro signale aussi `onLineNumberPress({ line })` (`{ side, line }`). La ref lit la sélection (`selectedLines()`, `selectedText()`) et la définit.

`annotations` place le contenu de l'app sous des lignes : chaque `{ id, side, line }` est dessinée par `renderAnnotation` sur toute la largeur du côté de sa ligne (toute la vue en mode unifié), aussi haute que sa mise en page l'exige, et s'affiche tant que sa ligne s'affiche. `renderAddAnnotation` est le contrôle de l'app pour en ajouter une, à droite de la gouttière de la ligne survolée par le pointeur et de la dernière ligne sélectionnée ; il reçoit les lignes sélectionnées lorsque sa ligne en fait partie, sinon cette ligne.

```tsx
type Comment = { id: string; side: "old" | "new"; line: number; text: string };
const comments = signal<Comment[]>([]);
const drafting = signal<DiffLineRange | null>(null);

<DiffView
  oldValue={before()}
  newValue={after()}
  annotations={comments().map(({ id, side, line }) => ({ id, side, line }))}
  renderAnnotation={(a) => (
    <View class="m-2 rounded-md border border-border bg-card p-2">
      <Text class="text-sm">{comments().find((c) => c.id === a.id)?.text}</Text>
    </View>
  )}
  renderAddAnnotation={(range) => (
    <Button onPress={() => drafting.set(range)} class="size-4 items-center justify-center rounded bg-primary">
      <Text class="text-xs text-primary-foreground">+</Text>
    </Button>
  )}
  class="flex-1"
/>
```
<a id="styling-the-parts"></a>

## Style des parties

`class` et `style` stylent la boîte de la vue. `classes` accepte des classes Tailwind par partie et `styles` des styles en ligne par partie ; les classes d'une partie viennent après ses propres styles par défaut, elles l'emportent donc, et ses `styles` l'emportent sur ses classes. La police se définit avec `fontFamily`, `fontSize` et `lineHeight`.

```tsx
<DiffView
  oldValue={before()}
  newValue={after()}
  language="py"
  fontSize={12}
  lineHeight={18}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineAdded: "bg-blue-500/10",
    wordAdded: "bg-blue-500/30",
    indicatorAdded: "bg-blue-500",
    separator: "bg-transparent",
  }}
/>
```

| Partie | Description | Par défaut |
|---|---|---|
| `side` | Chaque côté (split) ou l'unique colonne (unified) | Une ligne `border` entre les côtés |
| `gutter` | Les numéros de ligne et les indicateurs d'un côté | |
| `lineNumber` | Chaque numéro de ligne | Aligné à droite, `muted-foreground` |
| `lineNumberAdded` | Les numéros des lignes ajoutées, appliqués après `lineNumber` | |
| `lineNumberDeleted` | Les numéros des lignes supprimées, appliqués après `lineNumber` | |
| `content` | Le texte d'un côté, à côté de sa gouttière | 8pt avant et après le texte |
| `line` | Chaque rangée d'un côté | |
| `lineAdded` | Les rangées des lignes ajoutées, après `line` | Une teinte verte |
| `lineDeleted` | Les rangées des lignes supprimées, après `line` | Une teinte rouge |
| `filler` | La moitié vide d'une rangée split, à côté d'une ligne que l'autre côté n'a pas | Un remplissage `muted` discret |
| `wordAdded` | Les mots modifiés dans une ligne ajoutée | Un vert plus soutenu |
| `wordDeleted` | Les mots modifiés dans une ligne supprimée | Un rouge plus soutenu |
| `indicatorAdded` | La barre (`"bars"`) ou `+` (`"classic"`) d'une ligne ajoutée | Vert, 3pt de large |
| `indicatorDeleted` | La barre ou `−` d'une ligne supprimée | Rouge, 3pt de large |
| `separator` | Un séparateur de lignes repliées, ou l'en-tête de hunk d'un patch | `⋯` et le compte sur `muted` |
| `hunkActions` | La boîte des actions de l'app sur une modification | En haut à droite de la modification |
| `lineSelected` | Par-dessus les rangées des lignes sélectionnées de leur côté | La couleur de sélection du thème (comme les sélections de `Editor`) |
| `annotation` | La boîte d'une annotation, sous sa ligne | Sur toute la largeur du côté de sa ligne |
| `addAnnotation` | La boîte du contrôle d'ajout, de la largeur de la gouttière et haute d'une ligne | Le contrôle est à sa droite |
| `fileHeader` | L'en-tête d'un fichier d'un patch | Le chemin et les compteurs sur `secondary`, une ligne `border` en dessous |

## Props

| Prop | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `oldValue` | `.old_value(..)` | `string` | | L'ancien texte. |
| `newValue` | `.new_value(..)` | `string` | | Le nouveau texte. |
| `patch` | `.patch(..)` | `string` | | Un diff unifié d'un ou de plusieurs fichiers, affiché quand `oldValue` et `newValue` ne sont pas définis. |
| `language` | `.language(..)` | `string` | texte brut (pour un patch : celui de chaque fichier) | Le nom, l'alias, l'extension ou le nom de fichier d'un langage. |
| `layout` | `.layout(..)` | `"split" \| "unified"` | `"split"` | Côte à côte ou sur une seule colonne. |
| `inline` | `.inline(..)` | `"wordAlt" \| "word" \| "char" \| "none"` | `"wordAlt"` | Ce qui est mis en évidence dans les lignes modifiées. |
| `indicators` | `.indicators(..)` | `"bars" \| "classic" \| "none"` | `"bars"` | La manière dont les lignes modifiées sont marquées à côté de leurs numéros. |
| `contextLines` | `.context_lines(..)` | `number` | `3` | Les lignes inchangées affichées autour de chaque modification. |
| `expandAll` | `.expand_all(..)` | `boolean` | `false` | Toutes les lignes inchangées sont affichées. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Les numéros de ligne. |
| `background` | `.background(..)` | `boolean` | `true` | Les lignes modifiées sont teintées. |
| `fontFamily` | `.font_family(..)` | `string` | `font-mono` du thème | La police du texte. |
| `fontSize` | `.font_size(..)` | `number` | `13` | La taille de la police, en points. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | La hauteur d'une rangée, en points. |
| `renderSeparator` | `.render_separator(..)` | `(separator: DiffSeparator) => JSX.Element` | | Dessine les séparateurs de lignes repliées. |
| `renderHunkActions` | `.render_hunk_actions(..)` | `(hunk: DiffHunk) => JSX.Element` | | Les actions de l'app sur chaque modification. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Les longues lignes passent à la ligne à la largeur du côté. |
| `annotations` | `.annotations(..)` | `DiffAnnotation[]` | `[]` | Le contenu de l'app sous les lignes : `{ id, side, line }`. |
| `renderAnnotation` | `.render_annotation(..)` | `(annotation: DiffAnnotation) => JSX.Element` | | Dessine une annotation sous sa ligne. |
| `renderAddAnnotation` | `.render_add_annotation(..)` | `(range: DiffLineRange) => JSX.Element` | | Le contrôle de l'app pour ajouter une annotation, à côté de la ligne survolée et de la dernière ligne sélectionnée. |
| `renderFileHeader` | `.render_file_header(..)` | `(file: DiffFile) => JSX.Element` | | Dessine l'en-tête de chaque fichier d'un patch, d'une rangée de hauteur. |
| `classes` | `.classes(..)` | `DiffViewClasses` | `{}` | Classes Tailwind par partie. |
| `styles` | `.styles(..)` | `DiffViewStyles` | `{}` | Styles en ligne par partie, prioritaires sur les classes. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | | La boîte de la vue. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|change: &DiffChange\| ..)` | Une modification a été conservée ou annulée : `{ change }`, les textes actuels (`{ oldValue, newValue }`). |
| `onLineNumberPress` | `.on_line_number_press(\|line: &DiffLine\| ..)` | Un numéro de ligne a été pressé : `{ line }`, un `{ side, line }`. |
| `onLineSelectionChange` | `.on_line_selection_change(\|range: &Option<DiffLineRange>\| ..)` | Les lignes sélectionnées ont changé : `{ range }`, un `{ side, start, end }` ou `null`. |
| `onStatsChange` | `.on_stats_change(\|stats: &DiffStats\| ..)` | Les compteurs ont changé : `{ stats }`, un `{ added, deleted, hunks }`. Il se déclenche une fois à la création de la vue, puis à chaque fois que les textes sont comparés avec d'autres compteurs, pour une ligne « +8 −8 · 5 changes ». |
| `onFileToggle` | `.on_file_toggle(\|file: &DiffFile\| ..)` | Un fichier du patch a été replié ou déplié (son en-tête, ou la ref) : `{ file }`, le `DiffFile` actuel. |
| `onScroll` | `.on_scroll(\|e: &DiffViewEvent\| ..)` | Les rangées ont défilé, ou leur taille ou celle du viewport a changé : `{ offset, contentSize, size }`, comme celui d'un `Scroll` (`DiffViewEvent::Scroll(offset, content_size, size)` en Rust). Il se déclenche une fois la vue mise en page, puis à chaque changement de l'un d'eux. |
| `onHunkBoundsChange` | `.on_hunk_bounds_change(\|bounds: &Vec<DiffHunkBounds>\| ..)` | La position des modifications dans les rangées a changé : `{ hunkBounds }`, la liste que donne `hunkBounds()`. Il se déclenche une fois la vue mise en page, puis quand une modification se déplace ou change de taille, que la hauteur des rangées soit conservée ou non, pour les repères d'une règle de vue d'ensemble. |

<a id="related"></a>

## Voir aussi

- [Editor](./editor.md) : l'éditeur de code dont `DiffView` utilise les couleurs syntaxiques et les langages.
- [TextView](./text-view.md) : documents Markdown et HTML, pour le texte autour d'une revue.
- [`nsh/base`](../modules/nsh-base.md) : les autres composants de base.
