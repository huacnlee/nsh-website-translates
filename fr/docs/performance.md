---
title: "Performance"
description: "Comment NSH garde les applications rapides (applications Rust, runtime natif, passages groupés, animations natives, listes virtualisées), ce que cela implique pour votre code, et comment mesurer en mode headless et à l'écran."
order: 62
group: tools
source_hash: f8f220699bc54685
---

# Performances

La performance est la première priorité de NSH, et l'essentiel se décide dans le framework plutôt que dans votre app : le runtime est natif, chaque mise à jour ne traverse les threads qu'une seule fois, les animations et la virtualisation des listes s'exécutent sans JS, et une app écrite en Rust n'exécute aucun JS. Cette page présente les règles que suit NSH, ce qu'elles impliquent pour le code que vous écrivez, en Rust comme en TSX, et comment mesurer.

<a id="the-rules"></a>

## Les règles

<a id="1-js-does-as-little-as-possible"></a>

### 1. Le JS en fait le moins possible

**Une app écrite en Rust est du code natif de bout en bout** : ses composants, son état et ses handlers sont compilés avec le moteur de NSH, et aucun interpréteur ne s'exécute ([Building with Rust](./rust.md)). C'est la manière la plus rapide d'écrire une app, et celle à choisir pour une logique métier exigeante.

Dans une app TSX, QuickJS est un interpréteur : petit, rapide à démarrer, mais bien plus lent que le code natif pour les traitements lourds. Dans NSH, **seul le code de votre app est en JS**. Le graphe réactif (signaux, valeurs calculées, effets), le renderer appelé par votre JSX compilé, le moteur de layout, la virtualisation des listes, l'animation et chaque module que vous importez sont en Rust. Le parsing, le diffing, le layout et le traitement des chaînes se font nativement.

L'effet est mesurable. La même app de compteur sur l'ancien runtime JS de NSH et sur le runtime natif (builds release) :

| | Ancien runtime JS | Runtime natif |
|---|---|---|
| Taille du bundle | 14 Ko JS / 19,6 Ko de bytecode | 886 o JS / 1,7 Ko de bytecode |
| Évaluation du bundle | ~390 µs | ~95 µs |
| Temps JS d'un tap (médiane) | ~14 µs | ~5 µs |
| Commit d'un tap | ~22 µs | ~15 µs |
| Défilement d'une liste de 1000 lignes, JS par frame de rebinding | ~150 µs | ~77 µs |

Il en va de même pour les composants : un bouton écrit comme composant Rust face à un bouton TSX équivalent, 200 de chaque :

| | Bouton Rust : JS / cœur | Bouton TSX : JS / cœur |
|---|---|---|
| Première frame (ops) | 1,32 ms / 0,77 ms (1015) | 2,32 ms / 0,70 ms (2415) |
| Mise à jour des 200 titres (ops) | 0,42 ms / 0,42 ms (200) | 0,77 ms / 0,36 ms (600) |

(Mesuré sur Apple silicon ; le second tableau sur l'ancien runtime. Les deux proviennent des baselines de performance de NSH.)

**Pour votre code :** gardez les handlers d'événements et les valeurs calculées légers. Les calculs lourds (parsing de gros payloads, tri de milliers d'éléments à chaque frappe) coûtent plus cher dans QuickJS que ce à quoi vous êtes habitué avec V8 ou JavaScriptCore et leur JIT. Faites-les une seule fois, mettez le résultat en cache dans un `computed`, ou sortez-les du chemin d'interaction.

<a id="2-cross-threads-in-batches"></a>

### 2. Traverser les threads par lots

Le code de votre app, Rust ou JS, s'exécute sur un thread du moteur, jamais sur le thread principal. Un tour, par exemple un handler d'événement avec tout ce qu'il modifie, devient **un seul commit** : le runtime rend les composants, calcule le layout, effectue le diff et produit un lot d'opérations de vues natives, qui atteint le thread principal en **un seul saut**. Il n'y a pas de message de bridge par vue ni de sérialisation par prop.

**Pour votre code :** vous n'avez pas besoin de regrouper les écritures pour la performance ; dix appels à `set` dans un même handler produisent toujours un seul commit, en Rust comme en TSX. Utilisez `batch` quand vous voulez que les effets et les valeurs calculées voient toutes les écritures d'un coup, au lieu de s'exécuter après chacune.

<a id="3-fine-grained-updates"></a>

### 3. Mises à jour fines

Les composants s'exécutent **une seule fois**, en Rust comme en TSX. Ensuite, seuls les bindings qui lisent un signal se réexécutent quand il change : un texte, une propriété de style, une branche de `when` (`<If>`), les lignes de `each` (`<Each>`). Rien ne refait le rendu de tout un sous-arbre pour déterminer ce qui a changé.

```rust tabs
use nsh_core::prelude::*;

#[derive(Clone, PartialEq)]
struct Quote {
    price: f64,
    change: f64,
}

fn price(quote: Signal<Quote>) -> impl IntoElement {
    // Runs once. When the quote changes, only the text and the color update.
    text(move || format!("{:.2}", quote.with(|q| q.price))).text_color(move || {
        if quote.with(|q| q.change < 0.0) { rgb(0xcf222e) } else { rgb(0x1a7f37) }
    })
}
```

```tsx tabs
import type { Accessor } from "nsh";
import { Text } from "nsh";

type Quote = { price: number; change: number };

function Price(props: { quote: Accessor<Quote> }) {
  // Runs once. When quote() changes, only the text and the color update.
  return (
    <Text style={{ color: props.quote().change < 0 ? "#cf222e" : "#1a7f37" }}>
      {props.quote().price.toFixed(2)}
    </Text>
  );
}
```

**Pour votre code :**

- Lisez les signaux là où ils sont utilisés (dans les bindings, les closures `move ||` en Rust et les expressions JSX en TSX, ainsi que dans `computed` et `effect`), pas en haut d'un composant, afin que le binding le plus étroit soit mis à jour.
- Utilisez `each` / `<Each>` (lignes conservées par clé) ou une [liste virtuelle](./lists.md) pour les collections ; des lignes recréées à partir de la collection entière (`dynamic` en Rust, un simple `.map()` en JSX) sont toutes recréées à chaque changement.
- Dérivez les valeurs avec `computed` lorsque plusieurs bindings les utilisent, afin qu'elles soient calculées une seule fois par changement.

Ajout d'un quatrième élément à une liste de trois, tel que `nsh test --trace` l'affiche :

```rust tabs
// 22 mount items: 3 views removed, 4 created
dynamic(move || items.get().into_iter().map(|n| text(format!("row {n}"))).collect::<Vec<_>>())
// 4 mount items: 1 view created
each(move || items.get(), |n: &u32| *n, |n, _| text(move || format!("row {}", n.get())))
```

```tsx tabs
{items().map((n) => <Text>{`row ${n}`}</Text>)}                   // 22 mount items: 3 views removed, 4 created
<Each of={items()}>{(n) => <Text>{`row ${n()}`}</Text>}</Each>      // 4 mount items: 1 view created
```

Voir [Reactivity](./reactivity.md).

<a id="4-do-not-send-what-is-not-needed"></a>

### 4. Ne pas envoyer ce qui n'est pas nécessaire

Le cœur n'envoie que ce qui a changé : les nouvelles vues ne reçoivent ni style par défaut ni masque d'événements vide, les styles et frames inchangés ne sont pas envoyés, et un changement de couleur de texte ne relance pas le layout du texte. Un tap qui modifie un seul nombre envoie un seul élément de texte. Vous pouvez le constater dans la sortie de `nsh test --trace` (ci-dessous).

<a id="5-animate-natively"></a>

### 5. Animer nativement

Une animation pilotée depuis le thread du moteur (un signal écrit à chaque frame) coûte un commit par frame, ainsi qu'un appel JS en TSX, et saccade quand le thread du moteur est occupé. Les valeurs animées ([Animation](./animation.md) : `animated_value` en Rust, [l'API d'animation de `nsh`](../modules/nsh.md#animation) en TSX) exécutent plutôt les animations nativement :

```rust tabs
use nsh_core::prelude::*;

let scroll_y = animated_value(0.0);

view()
    .bind_opacity(&scroll_y.interpolate(&[0.0, 120.0], &[1.0, 0.35]))
    .bind_translate_y(&scroll_y.interpolate(&[0.0, 120.0], &[0.0, -6.0]));
virtual_list(move || photos.with(Vec::len), move |at| photo_row(photos, at))
    .scroll_value(&scroll_y)
    .estimated_item_size(px(64.0))
    .flex_1();
```

```tsx tabs
import { List, View } from "nsh";
import { createAnimatedValue } from "nsh";

const scrollY = createAnimatedValue(0);

<View
  style={{
    opacity: scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.35] }),
    translate: [0, scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -6] })],
  }}
/>;
<List each={photos()} scrollValue={scrollY} estimatedItemSize={64} style={{ flex: 1 }}>
  {(photo) => <Row photo={photo()} />}
</List>;
```

- `timing`, `spring` et `decay` s'exécutent sur le thread UI de la plateforme, frame par frame, sans aucun travail sur le thread du moteur à chaque frame.
- `scroll_value` (`scrollValue`) écrit un offset de défilement dans une valeur animée au sein de la même frame ; un pan (`pan={{ x, y }}`) permet aux glissements de déplacer directement une vue. Votre code est informé de la fin (l'animation se termine, la fin du pan reçoit la vélocité).
- `Animated.sequence` / `parallel` / `stagger` / `loop` s'exécutent comme un seul arbre natif : chaque étape démarre à l'instant où la précédente se termine, sans délai d'attente du JS.
- `LayoutAnimation.configureNext` anime nativement les frames, insertions et suppressions du prochain commit.

<a id="6-virtualize-long-lists"></a>

### 6. Virtualiser les longues listes

[`List`](./lists.md) ne garde que les lignes proches du viewport, recycle leurs cellules, et calcule nativement les positions, les colonnes, les en-têtes collants et la visibilité (viewability). Les frames de défilement qui ne révèlent aucune nouvelle ligne n'exécutent aucun de vos codes et ne produisent aucun lot ; une frame qui lie une nouvelle ligne de la liste de photos de la galerie représente 4 opérations et 4 éléments de montage.

**Pour votre code :**

- Donnez à `estimated_item_size` (`estimatedItemSize`) une valeur proche de la hauteur réelle des lignes.
- Gardez l'état propre à chaque élément dans vos données (indexé par id), pas dans des signaux créés à l'intérieur de la ligne : les cellules sont réutilisées pour d'autres éléments, et la position de la ligne (`at.index()` ; `item()` / `index()` en TSX) change lorsqu'elles le sont.
- Gardez des lignes peu coûteuses : une ligne est liée à chaque recyclage, son code s'exécute donc pendant que l'utilisateur fait défiler.
- Utilisez `scroll_value` (`scrollValue`) plutôt que `on_scroll` (`onScroll`) pour les effets qui suivent la position de défilement. Un listener de scroll reçoit au plus un événement par tour du moteur, mais chacun reste un appel dans votre code (dans le JS, en TSX).

<a id="measuring"></a>

## Mesurer

<a id="headless-50"></a>

### Headless : `--trace`

Dans un test Rust, `EngineConfig::trace` journalise les mêmes lignes `perf` et `Headless::observe` voit chaque lot ([Testing](./testing-and-trace.md#tracing-with-trace)). `nsh test --trace` les affiche pour TSX :

```sh
echo 'await app.press("Add")' | nsh test App.tsx --trace                 # first frame + a press
echo 'await app.scroll("id:feed", 3000)' | nsh test App.tsx --trace       # scrolling, 10 pt per frame
```

```text
perf commit: 56 ops, 395µs (list js 6µs), 49 mount items, 21 nodes
perf first frame: eval 271µs, total 1235µs
perf event js: 88µs
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

Ce qu'il faut regarder :

- **ops** (opérations mises en file par votre JS) et **mount items** (opérations de vues natives) : ces valeurs sont déterministes. Si un tap censé modifier un seul label produit 40 éléments, quelque chose recrée des vues qu'il devrait mettre à jour.
- **event js** : le coût JS d'un handler et de ce qu'il a déclenché.
- **commit** : le coût, côté cœur, du rendu des composants, du layout et du diffing.
- **list js** : le temps JS passé à lier les lignes de liste pendant ce commit.

Guide complet : [Testing](./testing-and-trace.md).

<a id="on-a-device-55"></a>

### Sur un appareil : `--trace`

```sh
nsh run App.tsx --trace
nsh run App.tsx --target android --trace --release
```

journalise les mêmes lignes de commit depuis l'hôte réel d'une app TSX, avec le moteur de texte propre à la plateforme. `NshAppView(trace: true)` et `new NshView(context, true)` font de même dans une app d'embarquement.

<a id="on-screen-58"></a>

### À l'écran : `--fps`

```sh
nsh run App.tsx --target macos --fps --release
```

(`AppOptions { fps: true, .. }` dans le `run_app` d'une app Rust) affiche la fréquence d'images et le coût des frames et des commits au-dessus de l'app en cours d'exécution, avec le CPU, le GPU et la mémoire ([macOS: performance monitor](./macos.md#performance-monitor)). Sur Linux et Windows, `--target linux --fps` et `--target windows --fps` journalisent les mêmes mesures une fois par seconde, avec la durée de chaque phase d'une frame ; `nsh test --target linux --fps -v` (ou `windows`) les relève pendant qu'un test pilote l'app.

> [!TIP]
> Les mesures isolées sont dominées par l'état d'horloge du CPU : un thread qui vient de dormir s'exécute plus lentement pendant un moment.
> Comparez le minimum de plusieurs exécutions, sur la même machine, et privilégiez les builds release pour mesurer le temps.

<a id="reference-numbers"></a>

## Chiffres de référence

Les chiffres mesurés, les baselines de NSH et la galerie page par page sous Linux figurent dans le [rapport de performance](./performance-report.md).

## Checklist

- Langage : écrivez l'app, ou les parties les plus sollicitées, en Rust ([Building with Rust](./rust.md)) ; gardez TSX pour ce qui change souvent ou est livré à l'exécution.
- Interactions : un tap modifie une poignée de mount items, pas des dizaines.
- Listes : une liste virtuelle (`virtual_list`, `List`) pour tout ce qui est long, avec une taille d'élément estimée ; l'état par élément dans les données.
- Animations : des valeurs animées, pas des signaux écrits à chaque frame.
- Effets de défilement : `scroll_value` (`scrollValue`), pas un listener de scroll.
- Handlers : aucun traitement lourd par frappe ou par événement de scroll ; mettez en cache dans `computed`.

<a id="see-also"></a>

## Voir aussi

- [Rapport de performance](./performance-report.md)
- [Architecture](./architecture.md)
- [Testing](./testing-and-trace.md)
- [Lists](./lists.md), [Animation](./animation.md), [Reactivity](./reactivity.md)
