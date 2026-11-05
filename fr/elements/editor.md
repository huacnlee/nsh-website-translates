---
title: "Editor"
description: "Le composant Editor : un éditeur de code avec coloration syntaxique, numéros de ligne, curseurs multiples, repliement de code, retour à la ligne automatique, recherche et remplacement, diagnostics et décorations, ainsi que les raccourcis clavier des éditeurs de code."
group: base
demo: el-editor
source_hash: 27f9d0cbb9ff5dd4
---

# Editor

`Editor` est un éditeur de code : coloration syntaxique pour plus de cinquante langages, numéros de ligne, curseurs multiples, repli de code,
retour à la ligne automatique, recherche et remplacement, diagnostics et décorations, avec les raccourcis des éditeurs de code (déplacer et dupliquer des lignes,
commentaires, indentation, parenthèses et guillemets qui se ferment à la frappe). Il gère des fichiers de n'importe quelle longueur : seules les lignes
visibles sont créées, et la coloration suit chaque modification ligne par ligne, de sorte qu'un long fichier défile et se saisit comme un court. La saisie passe par l'entrée de la plateforme, donc les méthodes de saisie (pinyin, kana, touches mortes) et les claviers virtuels fonctionnent
comme dans n'importe quel champ de texte.

L'éditeur gère le comportement et vient avec une apparence propre construite à partir des tokens du thème : le `font-mono` du thème à
13pt dans des lignes de 20pt, les numéros de ligne en `muted-foreground`, une bande discrète `muted` derrière les lignes portant un curseur, les sélections
dans une teinte de `primary`, les repères d'indentation en `border`, et les couleurs syntaxiques intégrées que les blocs de code de [`TextView`](./text-view.md)
utilisent, en clair et en sombre. Chaque partie prend les styles de l'app par-dessus ces valeurs par défaut (`classes` et `styles`).
Rust en crée un avec `nsh_base::editor()`, TSX avec `<Editor>` depuis `nsh/base`.

```rust tabs
use nsh_base::editor;
use nsh_core::prelude::*;

const MAIN: &str = "fn main() {\n    println!(\"Hello, world!\");\n}\n";

fn code() -> impl IntoElement {
    let source = signal(SharedString::from(MAIN));
    editor()
        .value(move || Some(source.get()))
        .language("rust")
        .on_change(move |value: &SharedString| source.set(value.clone()))
        .flex_1()
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { Editor } from "nsh/base";

const MAIN = `fn main() {
    println!("Hello, world!");
}
`;

function App() {
  const source = signal(MAIN);
  return <Editor value={source()} onChange={({ value }) => source.set(value)} language="rust" class="flex-1" />;
}

mount(App);
```

L'éditeur remplit la boîte que l'app lui donne (`flex-1`, une hauteur) et fait défiler son texte à l'intérieur : verticalement toujours,
latéralement quand les lignes sont plus longues que la boîte, ou pas du tout avec `softWrap`, où les longues lignes passent à la ligne à la largeur de l'éditeur.

<a id="the-text"></a>

## Le texte

- **Contrôlé** : passez `value` et redéfinissez-le dans `onChange`, qui rapporte le nouveau texte entier. Un `value` que l'app
  modifie (un fichier chargé, la sortie d'un formateur) remplace le texte en une seule modification que l'annulation peut défaire, et les curseurs et les replis éloignés de ce qui a changé
  restent où ils sont.
- **Non contrôlé** : passez `defaultValue` et lisez le texte depuis `onChange` ou le `value()` de la ref.

Les sauts de ligne sont `\n` : `\r\n` et `\r` dans un texte entrant deviennent `\n`.

<a id="languages"></a>

## Langages

`language` désigne le langage par son nom, un alias, une extension ou un nom de fichier, sans distinction de casse : `"rust"`, `"rs"`,
`"typescript"`, `"tsx"`, `"main.go"`, `"Dockerfile"`, `"Makefile"`. Il détermine la coloration, le commentaire que
`mod+/` bascule, les parenthèses qui s'apparient et indentent, les paires que la frappe ferme, les caractères dont les mots sont faits, et
l'indentation par défaut : quatre espaces, deux pour les langages web (JavaScript, TypeScript, JSON, HTML, CSS, YAML, ...), des tabulations
pour Go et les Makefiles. `tabSize` et `hardTabs` fixent l'indentation pour tous les langages. Tout autre nom est du texte brut,
sauf si l'app l'a enregistré ([ses propres langages](#your-own-languages)).

Les langages : Rust, JavaScript, JSX, TypeScript, TSX, JSON, Python, Go, C, C++, C#, Java, Kotlin, Swift, Objective-C,
Objective-C++, Ruby, PHP, Lua, Shell, Fish, PowerShell, SQL, HTML, XML, Vue, Svelte, CSS, SCSS, Sass, Less, Markdown,
YAML, TOML, INI, Dockerfile, Makefile, CMake, Dart, Scala, Elixir, Erlang, Haskell, OCaml, F#, Clojure, Zig, Perl, R,
Julia, Nix, Terraform, Protocol Buffers, GraphQL et Diff.

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language={file().name} tabSize={2} softWrap class="flex-1" />
```

<a id="your-own-languages"></a>

### Vos propres langages

Du code Rust apprend à l'éditeur de l'app d'autres langages, et colore tout langage avec un colorateur propre (une
grammaire tree-sitter, un analyseur de l'app). `register_language` enregistre un `EditorLanguage` : son nom, ses alias,
ses extensions et noms de fichiers, et ses règles d'édition (commentaires, parenthèses, paires que la frappe ferme, caractères de mot,
indentation), avec `syntax` nommant une grammaire intégrée pour le colorer. `register_highlighter` donne à un langage,
intégré ou enregistré, le colorateur de l'app : un type implémentant `EditorHighlighter`, qui entend chaque modification (lignes,
octets et positions, comme les prennent les modifications de tree-sitter) et donne les tokens de chaque ligne (`EditorToken`, ou une capture tree-sitter
ou une portée TextMate via `EditorToken::from_scope`) dans un budget de temps, hors du thread d'UI. L'éditeur conserve
les tokens, les déplace avec le texte au fil des modifications et redemande les lignes visibles, comme il le fait pour le colorateur
intégré. `language` trouve d'abord les langages enregistrés, par nom, alias, extension ou chemin, dans les éditeurs comme dans les vues
de diff.

Chaque moteur garde ses propres langages. Une app Rust les enregistre dans sa racine avant de monter ses éditeurs ; pour l'app TSX, le crate de l'app
les enregistre dans le setup de son jeu d'UI, que chaque moteur exécutant l'app appelle en premier.

```rust
use nsh_base::editor::{EditorLanguage, register_highlighter, register_language};
use nsh_core::prelude::*;

static NIMBLE: EditorLanguage = EditorLanguage::new("Nimble")
    .extensions(&["nb"])
    .line_comment("#")
    .tab_size(2);

#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.setup(|| {
        register_language(&NIMBLE);
        register_highlighter("nimble", || Box::new(NimbleHighlighter::default()));
    });
}
```

```tsx
<Editor value={source()} onChange={({ value }) => source.set(value)} language="build.nb" class="flex-1" />
```

<a id="editing"></a>

## Édition

L'éditeur fonctionne comme les éditeurs de code :

- **Plusieurs curseurs.** Alt-clic (Option-clic) ajoute un curseur, `mod+d` sélectionne l'occurrence suivante de la sélection,
  `mod+shift+l` toutes, et les touches d'ajout de curseur en ajoutent un sur la ligne au-dessus ou en dessous. La saisie, la suppression, les déplacements et
  chaque commande agissent à chacun ; Escape revient à un seul. `undoSelection` (`cmd+u`, `ctrl+u`) revient aux
  sélections d'avant le dernier déplacement.
- **La sélection s'étend** par unités avec `expandSelection` (`ctrl+shift+cmd+right`, `shift+alt+right`) : le mot, le contenu d'une
  chaîne puis la chaîne, le contenu d'une paire de parenthèses puis la paire, la ligne, le texte ; `shrinkSelection`
  revient de la même façon. `splitSelectionIntoLines` (`shift+alt+i`) transforme une sélection sur plusieurs lignes en une
  sélection par ligne.
- **Indentation.** Une nouvelle ligne conserve l'indentation de la ligne et ajoute un niveau après une parenthèse ouvrante (le `:` de Python,
  le `do` de Ruby, ...) ; Enter entre une paire de parenthèses place la fermante sur sa propre ligne. Tab et Shift+Tab indentent
  et désindentent les lignes sélectionnées ; Backspace dans des espaces de tête revient à la tabulation d'indentation précédente. `autoIndent` désactive
  cela.
- **Parenthèses et guillemets** se ferment à la frappe, entourent une sélection, et enjambent la fermante quand elle est retapée
  (`autoClose`). La parenthèse au curseur et sa partenaire sont encadrées.
- **Annuler** défait des séquences entières de frappe : un mot, une suppression, une commande. Un déplacement ou un appui démarre une nouvelle étape.
- **Repli.** Une ligne suivie de lignes plus indentées les replie avec le marqueur dans la gouttière : `⌄` pour replier,
  `›` et le `⋯` après la ligne pour déplier. Un curseur qui entre dans un repli l'ouvre ([Repli](#folding)).
- **Appuis.** Avec un pointeur, un clic place le curseur, un double-clic sélectionne un mot, un triple-clic une ligne,
  Shift-clic étend la sélection et un glisser sélectionne selon ce que le clic a sélectionné. Un glisser Alt+Shift
  (Option+Shift ; aussi Control+Alt sous Linux) sélectionne un bloc : une sélection par ligne, entre les mêmes colonnes, qui
  se prolongent au-delà de la fin des lignes courtes. Sur écran tactile, un toucher place le curseur, un double toucher ou un appui long sélectionne
  le mot sous le doigt, et des poignées aux extrémités de cette sélection déplacent chaque extrémité quand un doigt les fait glisser (le
  texte autour défile toujours).
- **Presse-papiers.** Copier et couper sans sélection prennent les lignes entières des curseurs, et celles-ci se collent comme lignes
  entières au-dessus de la ligne du curseur.

`readOnly` conserve le texte tel quel tout en le laissant sélectionnable, cherchable et copiable.

<a id="keys"></a>

## Touches

Les touches de l'éditeur fonctionnent tant qu'il a le focus ; les autres champs gardent les leurs. `mod` est Command sur macOS et iOS et Control
ailleurs (les frappes de `keymap`).

| Touches (macOS) | Touches (Windows, Linux) | Commande |
|---|---|---|
| Flèches, avec Shift pour sélectionner | Flèches, avec Shift pour sélectionner | Déplacer par caractère et par ligne |
| `alt+left` / `alt+right` | `ctrl+left` / `ctrl+right` | Déplacer par mot |
| `cmd+left` / `cmd+right`, `home` / `end`, `ctrl+a` / `ctrl+e` | `home` / `end` | Premier caractère non blanc de la ligne (puis son début) / fin de la ligne |
| `cmd+up` / `cmd+down` | `ctrl+home` / `ctrl+end` | Début / fin du texte |
| `pageup` / `pagedown` | `pageup` / `pagedown` | Page précédente / suivante |
| `alt+backspace` / `alt+delete` | `ctrl+backspace` / `ctrl+delete` | Supprimer un mot à gauche / à droite |
| `cmd+backspace` / `cmd+delete`, `ctrl+k` | `ctrl+shift+backspace` / `ctrl+shift+delete` | Supprimer jusqu'au début / à la fin de la ligne |
| `cmd+z` / `cmd+shift+z` | `ctrl+z` / `ctrl+shift+z`, `ctrl+y` | Annuler / rétablir |
| `cmd+a` | `ctrl+a` | Tout sélectionner |
| `cmd+l` | `ctrl+l` | Sélectionner la ligne (de nouveau : la suivante aussi) |
| `cmd+d` | `ctrl+d` | Sélectionner l'occurrence suivante |
| `cmd+shift+l` | `ctrl+shift+l` | Sélectionner toutes les occurrences |
| `cmd+alt+up` / `cmd+alt+down` | `ctrl+alt+up` / `ctrl+alt+down` | Ajouter un curseur au-dessus / en dessous |
| `escape` | `escape` | Revenir à une seule sélection |
| `alt+up` / `alt+down` | `alt+up` / `alt+down` | Déplacer les lignes vers le haut / le bas |
| `alt+shift+up` / `alt+shift+down` | `alt+shift+up` / `alt+shift+down` | Dupliquer les lignes vers le haut / le bas |
| `cmd+shift+k` | `ctrl+shift+k` | Supprimer les lignes |
| `cmd+enter` / `cmd+shift+enter` | `ctrl+enter` / `ctrl+shift+enter` | Nouvelle ligne en dessous / au-dessus |
| `tab` / `shift+tab`, `cmd+]` / `cmd+[` | `tab` / `shift+tab`, `ctrl+]` / `ctrl+[` | Indenter / désindenter |
| `cmd+/` | `ctrl+/` | Basculer le commentaire de ligne |
| `cmd+shift+\` | `ctrl+shift+\` | Aller à la parenthèse correspondante |
| `ctrl+j` | `ctrl+j` | Joindre les lignes |
| `ctrl+t` | | Échanger les caractères autour du curseur |
| `ctrl+alt+left` / `ctrl+alt+right`, avec Shift pour sélectionner | | Déplacer par partie de mot (camelCase, snake_case) |
| `shift+alt+a` | `shift+alt+a` | Basculer le commentaire de bloc |
| `shift+alt+i` | `shift+alt+i` | Scinder la sélection en lignes |
| `ctrl+shift+cmd+right` / `ctrl+shift+cmd+left` | `shift+alt+right` / `shift+alt+left` | Étendre / réduire la sélection |
| `cmd+u` | `ctrl+u` | Revenir aux sélections précédentes |
| `cmd+g` / `cmd+shift+g`, `f3` / `shift+f3` | `f3` / `shift+f3` | Trouver la correspondance suivante / précédente |
| `cmd+e` | | Rechercher la sélection (`onFindWithSelection`) |
| `cmd+alt+[` / `cmd+alt+]` | `ctrl+shift+[` / `ctrl+shift+]` | Replier / déplier la ligne du curseur |
| `f12` | `f12` | Aller à la définition au curseur (`onDefinitionRequest`) |
| `cmd+.` | `ctrl+.` | Actions de code sur la sélection (`onCodeActionRequest`) |
| `cmd+c` / `cmd+x` / `cmd+v` | `ctrl+c` / `ctrl+x` / `ctrl+v` | Copier / couper / coller |

macOS et iOS ont aussi les touches de texte de Cocoa : `ctrl+b` / `ctrl+f` / `ctrl+p` / `ctrl+n` déplacent, `ctrl+h` / `ctrl+d`
suppriment.

Les commandes sans touches par défaut, et celles propres à l'app, prennent les touches que l'app associe avec
[`keymap`](../modules/nsh.md#keymap), en les exécutant via le `run` de la ref :

```tsx
import { keymap } from "nsh";

let editor!: EditorRef;

keymap.bind({
  "f9": () => editor.run("sortLinesAscending"),
  "mod+shift+u": () => editor.run("transformToUppercase"),
  "mod+alt+0": () => editor.run("foldAll"),
  "mod+alt+j": () => editor.run("unfoldAll"),
});
```

<a id="find-and-replace"></a>

## Rechercher et remplacer

`search` est ce qu'il faut trouver : `{ query, caseSensitive?, wholeWord?, regex?, inSelection? }`. Ses correspondances sont surlignées, celle où se trouve la
sélection plus fortement, et `onSearchChange` rapporte `{ result }`, un `{ count, current, error }` : combien de correspondances, laquelle contient
la sélection (à partir de 0), et pourquoi une expression régulière n'est pas valide. `findNext` et `findPrevious` sélectionnent la correspondance
suivante et la précédente, en bouclant ; `replace(text)` remplace la correspondance courante et sélectionne la suivante, et
`replaceAll(text)` remplace toutes les correspondances en une seule modification et renvoie `{ count }`, leur nombre. Le remplacement d'une expression régulière désigne
ses groupes par `$1` et `${name}`.

`inSelection` ne cherche qu'à l'intérieur de ce qui était sélectionné à son activation (les lignes des curseurs si rien ne l'était) : la portée
reste tant qu'il reste activé, à travers les modifications, pendant que la sélection passe de correspondance en correspondance. `findWithSelection` (`cmd+e` sur
macOS) rapporte le texte sélectionné, ou le mot au curseur, avec `onFindWithSelection`, pour que la barre de recherche le prenne comme
requête.

La barre de recherche est celle de l'app :

```tsx
import { signal, Text, View } from "nsh";
import { Button, Editor, type EditorRef, type EditorSearchResult, Input } from "nsh/base";

function Find(props: { source: string; onChange: (value: string) => void }) {
  let editor!: EditorRef;
  const query = signal("");
  const replacement = signal("");
  const result = signal<EditorSearchResult>({ count: 0 });
  const status = () =>
    result().error ?? (result().current != null ? `${result().current! + 1} of ${result().count}` : `${result().count} found`);
  return (
    <View class="flex-1">
      <View class="flex-row items-center gap-2 border-b border-border p-2">
        <Input value={query()} onChange={({ value }) => query.set(value)} onSubmit={() => editor.run("findNext")} placeholder="Find" class="flex-1" />
        <Text class="text-sm text-muted-foreground">{status()}</Text>
        <Button onPress={() => editor.run("findPrevious")} class="px-2"><Text>↑</Text></Button>
        <Button onPress={() => editor.run("findNext")} class="px-2"><Text>↓</Text></Button>
        <Input value={replacement()} onChange={({ value }) => replacement.set(value)} placeholder="Replace" class="flex-1" />
        <Button onPress={() => editor.replace(replacement())} class="px-2"><Text>Replace</Text></Button>
        <Button onPress={async () => console.log("replaced", (await editor.replaceAll(replacement())).count)} class="px-2"><Text>All</Text></Button>
      </View>
      <Editor
        ref={editor}
        value={props.source}
        onChange={(e) => props.onChange(e.value)}
        language="ts"
        search={query() ? { query: query() } : undefined}
        onSearchChange={(e) => result.set(e.result)}
        class="flex-1"
      />
    </View>
  );
}
```

## Diagnostics

`diagnostics` marque les problèmes qu'un serveur de langage ou un linter rapporte : un fin soulignement ondulé sous chaque plage dans la couleur de sa
gravité (`error`, `warning`, `info`, `hint`). Les positions sont des lignes et des colonnes UTF-16 à partir de 0, comme celles d'un serveur de langage, donc
ses diagnostics passent tels quels. Les marques restent sur leur texte pendant que l'utilisateur tape, jusqu'à ce que l'app en passe
de nouvelles ; afficher les messages (une liste, une carte au survol de la ligne) revient à l'app.

Un diagnostic porte aussi le reste du `Diagnostic` d'un serveur de langage. Ses `tags` dessinent son texte comme le font les clients de langage :
le code `unnecessary` (une variable inutilisée, du code inatteignable) est estompé et le code `deprecated` barré, dans les
parties `unnecessaryText` et `deprecatedText` ; une suggestion avec une balise s'affiche dans son seul texte. `codeDescription.href` est la
page qui décrit son code (celle d'une règle de lint), et `relatedInformation` liste les autres endroits qui en parlent
(`{ location: { uri?, range }, message }`) : le survol transmet les deux à l'app, qui les affiche dans sa carte de survol et
ouvre la page. Un serveur de langage envoie les balises sous forme de nombres (`1`, `2`) ; l'éditeur accepte aussi leurs noms.

```tsx
const problems = signal<EditorDiagnostic[]>([]);

async function lint(text: string) {
  // [{ range, severity, message, source?, code?, codeDescription?, tags?, relatedInformation? }]
  problems.set(await check(text));
}

<Editor
  value={source()}
  onChange={({ value }) => {
    source.set(value);
    lint(value);
  }}
  language="ts"
  diagnostics={problems()}
  classes={{ diagnosticWarning: "bg-orange-500", unnecessaryText: "text-zinc-400" }}
  class="flex-1"
/>
```

<a id="decorations"></a>

## Décorations

`decorations` stylent des plages que l'app choisit : coloration sémantique d'un serveur de langage, l'instruction en cours d'exécution, les
lignes qu'une revue a modifiées. Les `class` et `style` d'une décoration stylent son texte ; `lineClass` et `lineStyle` stylent les lignes
qu'elle couvre, derrière le texte. Comme les diagnostics, elles restent sur leur texte à travers les modifications jusqu'à ce que l'app en définisse de nouvelles.

```tsx
const range = (line: number, start: number, end: number) => ({ start: { line, column: start }, end: { line, column: end } });

<Editor
  value={source()}
  language="sql"
  readOnly
  decorations={[
    { range: range(4, 0, 0), lineClass: "bg-green-500/10" },
    { range: range(7, 6, 18), class: "underline text-blue-600" },
  ]}
  class="flex-1"
/>
```
<a id="gutter-and-overview-ruler-marks"></a>

### Marques de la gouttière et de la règle d'aperçu

Le `gutter` d'une décoration place une marque dans une bande située avant les numéros de ligne, à côté de chaque ligne que couvre sa plage : les lignes qu'un diff de gestion de versions a ajoutées ou modifiées, ou un point d'arrêt (une plage vide couvre sa ligne, comme avec `lineClass`). Avec `placement: "before"`, c'est un trait en travers de la bande, à la limite avant le début de la plage, là où des lignes ont été supprimées. La bande fait `gutterDecorationsWidth` points de large (3 par défaut) et reste présente tant qu'une décoration a une marque de gouttière, afin que le texte garde sa place quand les marques apparaissent et disparaissent. Une plage située à l'intérieur d'un repli marque la ligne du repli.

Le `overviewRuler` d'une décoration place une marque sur la règle d'aperçu, la bande le long du bord droit de l'éditeur, large de 14 points (comme une barre de défilement ; la partie `overviewRuler` définit une autre largeur), qui projette tout le texte sur sa hauteur, comme celle de Monaco. Une marque fait au moins 6 points de haut et occupe une `lane` de la règle : `left`, `center` (par défaut), `right` ou `full`. La règle s'affiche tant qu'une décoration y a une marque.

Chaque marque prend les `class` et `style` de l'app, et est dessinée dans la couleur de premier plan en leur absence. Les deux suivent les modifications comme la plage de la décoration ; une modification qui supprime une plage marquée laisse à sa place une plage vide.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  decorations={[
    { range: range(2, 0, 0), gutter: { class: "bg-yellow-500" }, overviewRuler: { lane: "left", class: "bg-yellow-500" } },
    { range: { start: { line: 3, column: 0 }, end: { line: 5, column: 0 } }, gutter: { class: "bg-green-500" } },
    { range: range(6, 0, 0), gutter: { class: "bg-red-500", placement: "before" }, overviewRuler: { lane: "left", class: "bg-red-500" } },
  ]}
  class="flex-1"
/>
```

<a id="your-own-highlighting"></a>

### Votre propre coloration syntaxique

Le `token` d'une décoration colore son texte comme la coloration intégrée colore ce type de jeton (`comment`, `keyword`, `string`, `number`, `title`, `attr`, `built`, `deletion`), à la place de ce que le surligneur intégré y a trouvé : le surligneur propre à l'app (les jetons sémantiques d'un serveur de langage, un analyseur maison) associe ses jetons à ceux-ci et obtient les couleurs de l'éditeur en clair et en sombre. Le jeton de la décoration la plus interne l'emporte ; `class` et `style` s'appliquent par-dessus. `highlighting={false}` désactive le surligneur intégré, de sorte que les jetons de l'app colorent seuls le texte, tandis que `language` décide toujours des commentaires, des parenthèses et de l'indentation.

```tsx
const kinds: Record<string, EditorToken> = { keyword: "keyword", function: "title", string: "string", type: "built" };

<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  highlighting={false}
  decorations={semanticTokens().map((t) => ({ range: range(t.line, t.start, t.end), token: kinds[t.type] }))}
  class="flex-1"
/>
```

<a id="folding"></a>

## Repli

Les replis commencent là où des lignes sont plus indentées que la ligne qui les précède. `foldRanges` donne à l'éditeur les plages propres à l'app à la place (`{ startLine, endLine }`, la forme des plages de repli d'un serveur de langage, qui sont transmises telles quelles) : la ligne `startLine` affiche le repli, et les lignes qui suivent jusqu'à `endLine` sont repliées. Elles restent attachées à leurs lignes au fil des modifications jusqu'à ce que l'app en transmette de nouvelles.

Les replis s'imbriquent : replier un bloc garde repliés les replis qu'il contient, si bien que le déplier les montre tels qu'ils étaient. `foldRecursive` replie un bloc et tous les blocs qu'il contient, `unfoldRecursive` les déplie tous, `foldLevel(n)` replie chaque bloc du niveau d'imbrication `n`, et `foldSelection` (ou `foldRange(range)`) replie des lignes quelconques, où que commencent les replis. `onFoldChange` signale les plages repliées après chaque changement, et `folds()` / `setFolds(ranges)` les lisent et les restaurent, pour les conserver avec le fichier.

```tsx
const ranges = signal<EditorFoldRange[]>([]);
const folded = new Map<string, EditorFoldRange[]>();

<Editor
  ref={editor}
  value={file().text}
  language={file().name}
  foldRanges={ranges()} // from the language server's textDocument/foldingRange
  onFoldChange={({ folds }) => folded.set(file().name, folds)}
  class="flex-1"
/>
<Button onPress={() => editor.foldLevel(2)}><Text>Fold the methods</Text></Button>
```

<a id="breakpoints-and-context-menus"></a>

## Points d'arrêt et menus contextuels

Un appui sur un numéro de ligne signale `onLineNumberPress({ line })`, l'endroit où placer un point d'arrêt que l'app dessine comme une décoration. Le bouton secondaire (un clic droit, Control-clic sur un Mac) signale `onContextMenu({ position, x, y })` : la position dans le texte sous le pointeur et le point dans la vue racine, où l'app ouvre son propre menu. Sur les écrans tactiles, un appui long, un double appui, une poignée relâchée et un appui sur la sélection le signalent aussi, avec `selection` : la boîte de la sélection dans la vue racine (`{ x, y, width, height }`), et `x` / `y` en son milieu supérieur, pour le menu d'édition.

```tsx
<Editor
  value={source()}
  onContextMenu={({ x, y, selection }) =>
    Menu.popup(selection ? editItems : contextItems, { x, y })
  }
/>
```

```tsx
const breakpoints = signal<number[]>([]);

<Editor
  value={source()}
  language="py"
  onLineNumberPress={({ line }) =>
    breakpoints.set(breakpoints().includes(line) ? breakpoints().filter((l) => l !== line) : [...breakpoints(), line])
  }
  decorations={breakpoints().map((line) => ({ range: range(line, 0, 0), lineClass: "bg-red-500/15" }))}
  class="flex-1"
/>
```

<a id="language-features"></a>

## Fonctionnalités de langage

Les suggestions, les informations au survol, l'accès à la définition et les actions de code viennent du serveur de langage de l'app. L'éditeur dessine lui-même la liste de complétion, la complétion en ligne et le lien de définition, avec leurs touches ; pour le reste, il donne à l'app les moments et les emplacements, et l'app dessine ses propres popups (un [`Overlay`](./overlay.md) ancré à un `pageBounds`).

<a id="completion"></a>

### Complétion

Avec `completion`, l'éditeur demande des suggestions à l'app et les affiche sous forme de liste sous le mot en cours de saisie (au-dessus près du bas de la fenêtre) :

- Saisir une lettre, un chiffre ou `_` à la fin d'un mot déclenche une demande avec `onCompletionRequest(event)`, déclencheur `"typing"` : `event` a son `id`, le `offset` et le `position` du curseur, la `query` (le mot saisi jusque-là) et le décalage `queryStart` où il commence. Chacun de `completionTriggerCharacters` (`["."]`, `["::", "<"]`) déclenche une demande avec une requête vide après lui, déclencheur `"character"` (et le `character`), et `showCompletions()` ou `run("showCompletions")` déclenche une demande au niveau du curseur, déclencheur `"invoked"`.
- L'app répond avec `presentCompletions(event.id, items)`. Chaque élément a la forme du `CompletionItem` d'un serveur de langage : `label`, et éventuellement `kind` (`"function"`, `"variable"`, `"class"`, ...), `detail`, `documentation`, `insertText`, `filterText`, `sortText` et `range`. La réponse à la dernière demande s'affiche ; une réponse antérieure, ou une réponse pour un mot que le curseur a quitté, est écartée.
- Continuer à saisir filtre la liste sur place : la requête est comparée au `filterText` de chaque élément (sinon à son libellé) comme des lettres dans l'ordre, sans tenir compte de la casse, les mots commençant par la requête d'abord, puis les correspondances les plus proches, puis selon `sortText`. Les lettres correspondantes sont mises en évidence. Passez `incomplete: true` (`presentCompletions(id, items, true)`) pour que l'éditeur refasse une demande au fil de la saisie.
- Haut et Bas (et Control+P / Control+N) parcourent la liste, Page précédente et Page suivante par pages, Entrée et Tab acceptent, Échap la ferme. Le pointeur marque un élément et un clic (un appui sur les écrans tactiles) l'accepte. Le `documentation` de l'élément sélectionné s'affiche à côté de la liste.
- Accepter remplace le `range` de l'élément (sinon la requête) par son `insertText` (sinon son libellé), en une seule étape que l'annulation peut défaire, au niveau du curseur et de chaque autre curseur ayant le même texte avant lui, et signale `onCompletionAccept({ item })`.
- La liste se ferme quand le curseur quitte le mot, sur une espace ou une autre ponctuation, quand l'éditeur perd le focus et quand le curseur sort de la zone visible par défilement.

Une pause dans la saisie (`inlineCompletionDelay`, 300 ms par défaut) sans liste affichée déclenche une demande de complétion en ligne : `onInlineCompletionRequest({ id, offset, position })`. `presentInlineCompletion(id, text)` affiche `text` au niveau du curseur dans une couleur atténuée, Tab l'insère, et Échap, une modification ou un déplacement l'efface.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  completion
  completionTriggerCharacters={["."]}
  onCompletionRequest={async (e) => {
    const items = await server.completion(e.position);
    editor.presentCompletions(e.id, items);
  }}
  onInlineCompletionRequest={async (e) => {
    editor.presentInlineCompletion(e.id, await assistant.suggest(e.offset));
  }}
  class="flex-1"
/>
```

<a id="hovers-and-presses"></a>

### Survols et appuis

- `onHover(event)` : la souris reste sur un caractère sans bouton enfoncé (ordinateurs de bureau et web ; un glisser sélectionne du texte). `event` a son `position`, son `offset` UTF-16, la `range` de son mot, la `pagePosition` du pointeur, la `pageBounds` du mot, les `modifiers` présents et les `diagnostics` à cet endroit, dont l'app affiche les messages. Passer à un autre mot signale aussitôt le survol suivant.
- `onHoverEnd()` : la souris a quitté le mot ou l'éditeur, ou le texte a changé ou défilé sous elle.
- `onTextPress(event)` : un caractère a été pressé, après que l'éditeur a placé son curseur : `{ position, offset, range,
  pagePosition, modifiers, clicks }`.
- `caretBounds()` et `rangeBounds(range)` : l'emplacement du curseur et d'une plage, `{ bounds, pageBounds }` (dans l'éditeur et dans la vue racine) : un popup de l'app s'ouvre à cet endroit.

```tsx
const hover = signal<EditorHoverEvent | null>(null);

<Editor
  ref={editor}
  value={source()}
  language="ts"
  onHover={(event) => hover.set(event)}
  onHoverEnd={() => hover.set(null)}
  class="flex-1"
/>
<If when={hover()}>
  {(event) => (
    <Overlay anchor={event().pageBounds} placement="top" class="rounded-md border border-border bg-popover p-2">
      <Text>{event().diagnostics.map((d) => d.message).join("\n") || describe(event().range)}</Text>
    </Overlay>
  )}
</If>
```

<a id="go-to-definition-and-code-actions"></a>

### Aller à la définition et actions de code

Maintenir Mod (Command sur macOS et iOS, Control ailleurs) transforme les mots sous la souris en liens, comme dans les éditeurs de code :

- Avec Mod maintenu sur un mot (pressé pendant que la souris s'y trouve, ou souris déplacée là avec la touche maintenue), l'éditeur envoie une demande avec `onDefinitionRequest(event)`, déclencheur `"hover"` : `event` a son `id`, le `position` et le `offset` du caractère, et la `range` du mot. Répondez avec `presentDefinitionLink(event.id, range)` quand le serveur de langage trouve une définition : la plage est soulignée (la partie `definitionLink`) et le pointeur devient une main au-dessus. Le lien disparaît quand Mod est relâché, que la souris le quitte, que le texte change ou défile, ou avec `hideDefinitionLink()`. La réponse à la dernière demande s'affiche ; une réponse antérieure est écartée.
- Un Mod-clic sur un mot envoie une demande avec le déclencheur `"press"` ; sur le lien, le curseur reste où il est. F12 (`goToDefinition`, `run("goToDefinition")`) envoie une demande pour le mot au niveau du curseur, déclencheur `"key"`. L'app va à la définition : `revealPosition` et `setSelections` pour une définition située dans le même texte, sa propre navigation pour un autre fichier.
- Mod+. (`showCodeActions`, `run("showCodeActions")`) signale `onCodeActionRequest({ range, position, bounds })` : la sélection principale (début en premier), le curseur et sa boîte. L'app demande des actions à son serveur de langage, affiche son menu à `bounds.pageBounds` (un [`Menu`](./menu.md) ou un `Overlay`), et applique les modifications de l'action choisie avec `edit(edits)`.

```tsx
let editor!: EditorRef;

<Editor
  ref={(r) => (editor = r)}
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="ts"
  onDefinitionRequest={async (e) => {
    const target = await server.definition(e.position);
    if (!target) return;
    if (e.trigger === "hover") editor.presentDefinitionLink(e.id, target.originRange ?? e.range);
    else editor.revealPosition(target.range.start, true);
  }}
  onCodeActionRequest={async (e) => {
    const actions = await server.codeActions(e.range);
    const picked = await choose(actions, e.bounds?.pageBounds);
    if (picked) editor.edit(picked.edits);
  }}
  class="flex-1"
/>
```

<a id="size-and-scrolling"></a>

## Taille et défilement

Avec `minRows` et / ou `maxRows`, l'éditeur grandit avec son texte : il est aussi haut que ses lignes, au moins `minRows` d'entre elles, et à partir de `maxRows` son texte défile, comme une boîte de message ou une cellule de notebook. Sinon, c'est l'app qui le dimensionne, et `scrollBeyondLastLine` laisse le texte défiler au-delà de sa dernière ligne : jusqu'à un écran (`true`, la valeur par défaut), pas du tout (`false`) ou un nombre de lignes. Quand le curseur se déplace, `cursorSurroundingLines` lignes restent visibles autour de lui. Faire glisser une sélection au-delà des bords de l'éditeur fait défiler davantage, d'autant plus vite que le pointeur s'éloigne.

`showWhitespaces` affiche un `·` pour chaque espace et un `→` pour chaque tabulation (la partie `whitespace`), et `rulers` trace une ligne à chacune de ses colonnes (la partie `ruler`), comme repères de longueur de ligne.

```tsx
<Editor
  defaultValue={message()}
  language="markdown"
  minRows={2}
  maxRows={8}
  rulers={[72]}
  showWhitespaces
/>
```

<a id="methods"></a>

## Méthodes

`ref={editor}` donne les méthodes de l'éditeur (`EditorRef`), pour les boutons, menus et touches de l'app. Les méthodes qui renvoient une valeur (`value()`, `selections()`, `replaceAll()`, `canUndo()`, `caretBounds()`, `folds()`, ...) en renvoient une `Promise` en JS, donc `await` : `const text = await editor.value()`. Une méthode à laquelle on donne une ligne située au-delà du texte (`fold`, `scrollToLine`, `goToLine`, ...) ne change rien et journalise un avertissement nommant la méthode et la ligne.

| Méthode | Description |
|---|---|
| `focus()`, `blur()` | Prend le focus, ou le rend. |
| `value()` | `Promise<string>` : le texte. |
| `setValue(value)` | Remplace le texte, comme une modification que l'annulation peut défaire. |
| `insert(text)` | Saisit `text` à chaque sélection, tel quel (les parenthèses ne se ferment pas). |
| `edit(edits)` | Applique `{ range, text }` remplacements (plages du texte actuel ; un remplacement qui en chevauche un précédent est ignoré) en une seule étape que l'annulation peut défaire ; les sélections suivent le texte qui les entoure. Les actions de code et les modifications de formatage passent par ici. |
| `selections()` | `Promise<EditorSelection[]>` : chaque sélection, `{ anchor, head }`, la principale (la plus récente) en dernier. |
| `setSelections(selections)` | Définit les sélections (la dernière étant la principale) et fait défiler la principale jusqu'à la rendre visible. |
| `run(command)` | Exécute une commande, comme le feraient ses touches ([Commandes](#commands)). |
| `replace(text)` | Remplace la correspondance actuelle et sélectionne la suivante. |
| `replaceAll(text)` | `Promise<EditorReplaceAll>` : remplace chaque correspondance en une seule modification ; `{ count }`, combien. |
| `fold(line)`, `unfold(line)` | Replie les lignes sous la ligne `line` (à partir de 0), ou la déplie. |
| `foldRecursive(line)`, `unfoldRecursive(line)` | Replie le repli de la ligne `line` et chaque repli qu'il contient, ou les déplie tous. |
| `foldLevel(level)` | Replie chaque repli du niveau d'imbrication `level` (1 : le plus externe). |
| `foldRange(range)` | Replie les lignes de `range` (`{ startLine, endLine }`), où que commencent les replis. |
| `folds()` | `Promise<EditorFoldRange[]>` : les plages repliées, y compris les imbriquées. |
| `setFolds(folds)` | Replie exactement `folds`. |
| `scrollToLine(line)` | Fait défiler la ligne `line` jusqu'à la rendre visible, en dépliant ce qui la cache. |
| `canUndo()`, `canRedo()` | `Promise<boolean>` : indique s'il y a une modification à annuler, ou à rétablir. |
| `caretBounds()` | `Promise<EditorBounds \| null>` : la boîte du curseur principal, `{ bounds, pageBounds }`, dans l'éditeur (défilement appliqué) et dans la vue racine ; `null` avant que l'éditeur soit mis en page. |
| `rangeBounds(range)` | `Promise<EditorBounds[]>` : les boîtes de `range`, une par ligne qu'elle couvre. |
| `scrollOffset()`, `setScrollOffset(offset)` | `Promise<Point>` : de combien le texte a défilé ; le fait défiler jusqu'à `{ x, y }`. |
| `visibleRange()` | `Promise<EditorRange>` : le texte que montre la zone visible, du début de sa première ligne à la fin de sa dernière. |
| `selectedText()` | `Promise<string>` : le texte de la sélection principale. |
| `offsetToPosition(offset)`, `positionToOffset(position)` | `Promise<EditorPosition>`, `Promise<number>` : entre les décalages UTF-16 de `value()` et les positions. |
| `revealPosition(position, center)` | Fait défiler `position` jusqu'à le rendre visible, en dépliant ce qui le cache ; jusqu'au milieu avec `center`. |
| `goToLine(line)` | Place le curseur au début de la ligne `line` (à partir de 0) et la fait défiler jusqu'au milieu. |
| `showCompletions()` | Demande des complétions au niveau du curseur, le mot qui le précède servant de requête ([Complétion](#completion)). |
| `presentCompletions(id, items, incomplete?)` | Répond à la demande de complétion `id` : la liste affiche `items`, filtrée par ce qui a été saisi depuis ; avec `incomplete`, continuer à saisir déclenche une nouvelle demande. Sans éléments, la liste se ferme. |
| `hideCompletions()` | Ferme la liste de complétion. |
| `presentInlineCompletion(id, text)`, `hideInlineCompletion()` | Répond à la demande de complétion en ligne `id` avec `text`, affichée au niveau du curseur ; l'efface. |
| `presentDefinitionLink(id, range)`, `hideDefinitionLink()` | Répond à la demande de définition `id` (déclencheur `"hover"`) : `range` est souligné comme un lien ([Aller à la définition](#go-to-definition-and-code-actions)) ; le masque. |

```tsx
let editor!: EditorRef;

<Button onPress={() => editor.run("toggleComment")}><Text>Comment</Text></Button>
<Button onPress={async () => save(await editor.value())}><Text>Save</Text></Button>
<Button onPress={async () => (await editor.canUndo()) && editor.run("undo")}><Text>Undo</Text></Button>
<Button onPress={() => editor.setSelections([{ anchor: { line: 0, column: 0 }, head: { line: 0, column: 0 } }])}>
  <Text>Go to the top</Text>
</Button>
<Editor ref={editor} value={source()} onChange={({ value }) => source.set(value)} language="rs" class="flex-1" />
```
<a id="commands"></a>

### Commandes

`run` accepte les commandes de l'éditeur par leur nom (`EditorCommand`) :

| Commandes | Ce qu'elles font |
|---|---|
| `moveLeft`, `moveRight`, `moveUp`, `moveDown`, `moveWordLeft`, `moveWordRight`, `moveLineStart`, `moveLineEnd`, `movePageUp`, `movePageDown`, `moveDocumentStart`, `moveDocumentEnd` | Déplacent les curseurs. |
| `selectLeft`, `selectRight`, `selectUp`, `selectDown`, `selectWordLeft`, `selectWordRight`, `selectLineStart`, `selectLineEnd`, `selectPageUp`, `selectPageDown`, `selectDocumentStart`, `selectDocumentEnd` | Étendent les sélections. |
| `moveToMatchingBracket` | Va au crochet correspondant à celui du curseur. |
| `selectAll`, `selectLine`, `selectWord`, `selectNextOccurrence`, `selectPreviousOccurrence`, `selectAllOccurrences` | Sélectionnent. |
| `moveSubwordLeft`, `moveSubwordRight`, `selectSubwordLeft`, `selectSubwordRight` | Déplacent ou étendent par partie de mot (bosses du camelCase, parties du snake_case). |
| `moveParagraphUp`, `moveParagraphDown`, `selectParagraphUp`, `selectParagraphDown` | Déplacent ou étendent jusqu'à la ligne vide avant ou après le paragraphe. |
| `expandSelection`, `shrinkSelection` | Agrandissent les sélections d'une unité, ou reviennent en arrière. |
| `undoSelection`, `redoSelection` | Reviennent aux sélections d'avant le dernier déplacement, ou avancent à nouveau. |
| `splitSelectionIntoLines` | Une sélection par ligne de chaque sélection. |
| `addCaretAbove`, `addCaretBelow`, `singleSelection` | Ajoutent un curseur ; reviennent à une seule sélection. |
| `deleteBackward`, `deleteForward`, `deleteWordLeft`, `deleteWordRight`, `deleteToLineStart`, `deleteToLineEnd`, `deleteLine` | Suppriment. |
| `newline`, `newlineBelow`, `newlineAbove`, `indent`, `outdent`, `toggleComment`, `toggleBlockComment` | Lignes, indentation et commentaires. |
| `sortLinesAscending`, `sortLinesDescending` | Trient les lignes sélectionnées (toutes les lignes si seul un curseur est présent). |
| `transformToUppercase`, `transformToLowercase`, `transformToTitleCase` | Changent la casse des sélections (pour un curseur : son mot). |
| `trimTrailingWhitespace` | Supprime les espaces en fin de chaque ligne. |
| `moveLinesUp`, `moveLinesDown`, `duplicateLinesUp`, `duplicateLinesDown`, `joinLines`, `transposeCharacters` | Réorganisent. |
| `undo`, `redo` | Annuler et rétablir. |
| `fold`, `unfold`, `foldAll`, `unfoldAll` | Replient à la ligne du curseur, ou tout. |
| `foldRecursive`, `unfoldRecursive` | Replient le repli du curseur et tous les replis qu'il contient, ou les déplient. |
| `foldSelection` | Replie les lignes de chaque sélection qui en couvre plusieurs. |
| `findNext`, `findPrevious` | Sélectionnent l'occurrence suivante ou précédente de `search`. |
| `findWithSelection` | Signale le texte sélectionné à la barre de recherche (`onFindWithSelection`). |
| `copy`, `cut`, `paste` | Le presse-papiers. |
| `showCompletions` | Demande des complétions au curseur ([Complétion](#completion)). |
| `goToDefinition` | Demande la définition du mot au curseur (`onDefinitionRequest`, déclencheur `"key"`). |
| `showCodeActions` | Demande les actions de code pour la sélection (`onCodeActionRequest`). |

<a id="styling-the-parts"></a>

## Mise en forme des parties

`class` et `style` stylent la boîte de l'éditeur. `classes` accepte des classes Tailwind par partie et `styles` des styles en ligne par partie ; les classes d'une partie viennent après ses propres styles par défaut, donc elles l'emportent, et ses `styles` l'emportent sur ses classes. La police est définie avec `fontFamily`, `fontSize` et `lineHeight`, dans lesquels l'éditeur mesure son texte.

```tsx
<Editor
  value={source()}
  onChange={({ value }) => source.set(value)}
  language="tsx"
  fontFamily="JetBrains Mono"
  fontSize={14}
  lineHeight={22}
  class="flex-1 rounded-lg border border-border"
  classes={{
    gutter: "bg-muted",
    lineNumber: "text-xs",
    activeLine: "bg-yellow-500/10",
    selection: "bg-blue-500/30",
  }}
  styles={{ caret: { backgroundColor: "#f59e0b", width: 3 } }}
/>
```

| Partie | Ce que c'est | Défaut |
|---|---|---|
| `gutter` | La colonne des numéros de ligne et des marqueurs de repli | 12pt avant les numéros, 4pt après les marqueurs |
| `lineNumber` | Chaque numéro de ligne | Aligné à droite, `muted-foreground` |
| `activeLineNumber` | Les numéros des lignes avec un curseur, après `lineNumber` | `foreground` |
| `foldMarker` | Le marqueur d'une ligne où débute un repli | `⌄`, `›` replié, `muted-foreground` |
| `overviewRuler` | La règle d'aperçu le long du bord droit, tant qu'une décoration y a une marque | aucun |
| `content` | La zone de texte à côté de la gouttière | 4pt avant le texte |
| `line` | Chaque ligne de texte | |
| `activeLine` | Derrière les lignes de texte avec un curseur, sous les indicateurs de défilement | `muted`, discret |
| `selection` | Derrière le texte sélectionné | Une teinte de `primary` |
| `caret` | Les curseurs | 2pt de large, `foreground`, clignotants |
| `composition` | Le texte qu'une méthode de saisie est en train de composer | Souligné |
| `searchMatch` | Les occurrences de `search` | Ambre translucide |
| `currentSearchMatch` | L'occurrence sur laquelle se trouve la sélection, après `searchMatch` | Ambre plus intense |
| `matchingBracket` | Le crochet au curseur et son partenaire | Une bordure de 1pt |
| `indentGuide` | Un guide par niveau d'indentation | Un trait de 1pt de `border` |
| `foldPlaceholder` | Ce qu'une ligne repliée affiche après son texte | ` ⋯ `, `muted-foreground` |
| `placeholder` | Affiché tant que le texte est vide | `muted-foreground` |
| `diagnosticError` | Le trait sous une erreur | `destructive` |
| `diagnosticWarning` | Le trait sous un avertissement | Ambre |
| `diagnosticInfo` | Le trait sous une information | Bleu |
| `diagnosticHint` | Le trait sous une suggestion | `muted-foreground` |
| `unnecessaryText` | Le texte d'un diagnostic `unnecessary` | `muted-foreground` |
| `deprecatedText` | Le texte d'un diagnostic `deprecated` | Barré |
| `whitespace` | Les marques des espaces et des tabulations (`showWhitespaces`) | `·` et `→`, `muted-foreground` à 60 % |
| `ruler` | Les traits de `rulers` | Un trait de 1 point de `border` |
| `selectionHandle` | Les boutons des poignées aux extrémités d'une sélection tactile | Un point de 10pt de `primary` |
| `selectionHandleStart`, `selectionHandleEnd` | Le bouton du début (au-dessus de sa ligne) et celui de la fin (en dessous), après `selectionHandle` | |
| `completionMenu` | La boîte de la liste de complétion | `popover`, une `border` de 1pt, arrondie, une ombre |
| `completionItem` | Chaque élément de la liste | La hauteur d'une ligne, 8pt de marge intérieure |
| `selectedCompletionItem` | L'élément sélectionné, après `completionItem` | `accent` |
| `completionMatch` | Les lettres d'un libellé correspondant à la requête | Semi-gras, `primary` |
| `completionDetail` | Le détail d'un élément, après son libellé | Aligné à droite, `muted-foreground` |
| `completionKind` | Le type d'un élément, avant son libellé | Un nom court (`fn`, `var`, `cls`), `muted-foreground` |
| `completionDocumentation` | La documentation de l'élément sélectionné, à côté de la liste | Comme `completionMenu`, 320pt de large au maximum |
| `inlineCompletion` | La complétion en ligne au curseur | `muted-foreground` |
| `definitionLink` | Le soulignement du lien de définition | Un trait de 1pt de `primary` sous le texte |

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | Le texte, contrôlé par l'application (à redéfinir depuis `onChange`). |
| `defaultValue` | `.default_value(..)` | `string` | | Le texte initial, quand l'éditeur garde le sien. |
| `language` | `.language(..)` | `string` | texte brut | Le nom, l'alias, l'extension ou le nom de fichier d'un langage ([Langages](#languages)). |
| `placeholder` | `.placeholder(..)` | `string` | | Affiché tant que le texte est vide. |
| `readOnly` | `.read_only(..)` | `boolean` | `false` | Le texte est sélectionné et copié, mais pas modifié. |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Prend le focus à son apparition. |
| `lineNumbers` | `.line_numbers(..)` | `boolean` | `true` | Les numéros de ligne de la gouttière. |
| `softWrap` | `.soft_wrap(..)` | `boolean` | `false` | Les lignes longues passent à la ligne à la largeur de l'éditeur. |
| `tabSize` | `.tab_size(..)` | `number` | celui du langage | Les colonnes d'une tabulation et d'un niveau d'indentation. |
| `hardTabs` | `.hard_tabs(..)` | `boolean` | celui du langage | Indente avec des tabulations. |
| `folding` | `.folding(..)` | `boolean` | `true` | Les lignes indentées se replient avec les marqueurs de la gouttière. |
| `foldRanges` | `.fold_ranges(..)` | `EditorFoldRange[]` | par indentation | Où débutent les replis, définis par l'application ([Repli](#folding)). |
| `highlighting` | `.highlighting(..)` | `boolean` | `true` | La coloration syntaxique intégrée ([Coloration syntaxique personnalisée](#your-own-highlighting)). |
| `autoClose` | `.auto_close(..)` | `boolean` | `true` | Les crochets et les guillemets se ferment au fur et à mesure de la saisie. |
| `autoIndent` | `.auto_indent(..)` | `boolean` | `true` | Une nouvelle ligne conserve l'indentation et indente après un crochet ouvrant. |
| `activeLine` | `.active_line(..)` | `boolean` | `true` | Les lignes de texte avec un curseur sont mises en surbrillance. |
| `indentGuides` | `.indent_guides(..)` | `boolean` | `true` | Les guides d'indentation. |
| `scrollBeyondLastLine` | `.scroll_beyond_last_line(..)` | `boolean \| number` | `true` | Le texte défile au-delà de sa dernière ligne : jusqu'à un écran (`true`), pas du tout (`false`) ou ce nombre de lignes. |
| `fontFamily` | `.font_family(..)` | `string` | le `font-mono` du thème | La police dans laquelle le texte est dessiné et mesuré. |
| `fontSize` | `.font_size(..)` | `number` | `13` | La taille de police, en points. |
| `lineHeight` | `.line_height(..)` | `number` | `20` | La hauteur d'une ligne, en points. |
| `search` | `.search(..)` | `EditorSearch` | | Ce qu'il faut rechercher ([Recherche et remplacement](#find-and-replace)). |
| `diagnostics` | `.diagnostics(..)` | `EditorDiagnostic[]` | `[]` | Les problèmes à signaler ([Diagnostics](#diagnostics)). |
| `decorations` | `.decorations(..)` | `EditorDecoration[]` | `[]` | Les plages que l'application stylise ([Décorations](#decorations)). |
| `gutterDecorationsWidth` | `.gutter_decorations_width(..)` | `number` | `3` | La largeur de la bande de marques de décorations de la gouttière, en points. |
| `classes` | `.classes(..)` | `EditorClasses` | `{}` | Classes Tailwind par partie. |
| `styles` | `.styles(..)` | `EditorStyles` | `{}` | Styles en ligne par partie, prioritaires sur les classes. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | | Le nom que les lecteurs d'écran donnent à l'éditeur. |
| `showWhitespaces` | `.show_whitespaces(..)` | `boolean` | `false` | Les espaces et les tabulations s'affichent sous la forme de `·` et `→`. |
| `rulers` | `.rulers(..)` | `number[]` | `[]` | Les colonnes où tracer un trait vertical. |
| `minRows` | `.min_rows(..)` | `number` | | L'éditeur grandit avec son texte à partir de ce nombre de lignes ([Taille et défilement](#size-and-scrolling)). |
| `maxRows` | `.max_rows(..)` | `number` | | L'éditeur grandit avec son texte jusqu'à ce nombre de lignes, puis défile. |
| `cursorSurroundingLines` | `.cursor_surrounding_lines(..)` | `number` | `1` | Les lignes gardées visibles au-dessus et en dessous du curseur. |
| `completion` | `.completion(..)` | `boolean` | `false` | L'éditeur demande des suggestions et les affiche sous forme de liste ([Complétion](#completion)). |
| `completionTriggerCharacters` | `.completion_trigger_characters(..)` | `string[]` | `[]` | Ce qui, en dehors de cela, demande des complétions pendant la saisie. |
| `inlineCompletionDelay` | `.inline_completion_delay(..)` | `number` | `300` | Les millisecondes de pause de la saisie avant qu'une complétion en ligne soit demandée. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | | La boîte de l'éditeur. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | Le texte a changé : `{ value }`, le nouveau texte entier. |
| `onSelectionChange` | `.on_selection_change(\|selections: &Vec<EditorSelection>\| ..)` | Les sélections ont changé : `{ selections }`, toutes, la principale en dernier. |
| `onFocus`, `onBlur` | `.on_focus(\|\| ..)`, `.on_blur(\|\| ..)` | L'éditeur a pris ou perdu le focus. |
| `onSearchChange` | `.on_search_change(\|result: &EditorSearchResult\| ..)` | Les occurrences de la recherche ont changé : `{ result }`, un `{ count, current, error }`. |
| `onLineNumberPress` | `.on_line_number_press(\|line: &u32\| ..)` | Un numéro de ligne a été pressé : `{ line }`, la ligne, à partir de 0. |
| `onContextMenu` | `.on_context_menu(\|event: &EditorContextMenuEvent\| ..)` | Le bouton secondaire a été pressé sur le texte, ou un toucher a sélectionné du texte : `{ position, x, y, selection? }`. |
| `onHover` | `.on_hover(\|event: &EditorHoverEvent\| ..)` | La souris survole un caractère ([Fonctionnalités de langage](#language-features)). |
| `onHoverEnd` | `.on_hover_end(\|\| ..)` | Le survol a pris fin. |
| `onTextPress` | `.on_text_press(\|event: &EditorTextPressEvent\| ..)` | Un caractère a été pressé : avec son mot, les modificateurs et les clics. |
| `onFindWithSelection` | `.on_find_with_selection(\|query: &String\| ..)` | `findWithSelection` s'est exécutée : `{ query }`, le texte pour la requête de la barre de recherche. |
| `onFoldChange` | `.on_fold_change(\|folds: &Vec<EditorFoldRange>\| ..)` | Les plages repliées ont changé : `{ folds }`, toutes, y compris les imbriquées. |
| `onCompletionRequest` | `.on_completion_request(\|event: &EditorCompletionRequest\| ..)` | L'éditeur demande des complétions : `{ id, offset, position, query, queryStart, trigger, character? }` ([Complétion](#completion)). |
| `onCompletionAccept` | `.on_completion_accept(\|event: &EditorCompletionAcceptEvent\| ..)` | Un élément a été accepté et inséré : `{ item }`. |
| `onInlineCompletionRequest` | `.on_inline_completion_request(\|event: &EditorInlineCompletionRequest\| ..)` | La saisie s'est interrompue : `{ id, offset, position }`, pour une complétion en ligne. |
| `onDefinitionRequest` | `.on_definition_request(\|event: &EditorDefinitionRequest\| ..)` | L'éditeur demande une définition : `{ id, position, offset, range, trigger }` ([Aller à la définition](#go-to-definition-and-code-actions)). |
| `onCodeActionRequest` | `.on_code_action_request(\|event: &EditorCodeActionRequest\| ..)` | L'utilisateur a demandé des actions de code : `{ range, position, bounds? }`. |

<a id="accessibility"></a>

## Accessibilité

Les lecteurs d'écran désignent l'éditeur par son `accessibilityLabel` ; son focus est celui d'un champ de saisie de texte, de sorte que les services de texte de la plateforme (méthodes de saisie, dictée, claviers virtuels) y fonctionnent.

<a id="related"></a>

## Voir aussi

- [TextView](./text-view.md) : documents Markdown et HTML, dont les blocs de code partagent les couleurs syntaxiques de l'éditeur.
- [DiffView](./diff-view.md) : les différences entre deux textes, avec les couleurs syntaxiques de l'éditeur.
- [Input](./input.md) : champs de texte d'une ou plusieurs lignes avec l'édition native de la plateforme.
- [`keymap`](../modules/nsh.md#keymap) : les touches de l'application pour les commandes de l'éditeur.
- [`nsh/base`](../modules/nsh-base.md) : les autres composants de base.
