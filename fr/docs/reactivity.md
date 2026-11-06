---
title: "Réactivité"
description: "Signals, valeurs calculées, effets, ressources, batch, untracked, nettoyage et contexte en Rust et TSX : comment NSH met à jour exactement ce qui a changé, et les erreurs à éviter."
order: 31
group: ui
demo: guide-reactivity
source_hash: 58faf0c4997a1dea
---

# Réactivité

NSH met à jour l'interface avec des **signaux** : des valeurs qui savent qui les lit. Quand un signal change, NSH réexécute exactement les calculs qui l'ont lu (un texte, un style, un effet) et rien d'autre. Les composants ne se re-rendent pas. Le modèle est celui de Solid, et le graphe réactif lui-même est natif : les composants Rust et TSX s'exécutent sur le même graphe, écrit en Rust, si bien qu'en TSX aussi l'ordonnancement, le suivi des dépendances et le nettoyage se font hors de l'interpréteur.

Les composants Rust prennent tout ce qui figure sur cette page dans le prelude ; TSX l'importe depuis `nsh` :

```rust tabs
use nsh_core::prelude::*;   // signal, computed, effect, resource, batch, untracked, cleanup, provide_context, use_context
```

```tsx tabs
import { batch, cleanup, computed, context, effect, resource, signal, untracked } from "nsh";
```

<a id="signals"></a>

## Signaux

`signal(value)` crée un signal. Lisez-le avec `get()` en Rust, en l'appelant en TSX ; `set` et `update` l'écrivent :

```rust tabs
let count = signal(0);

count.get();                    // 0, and tracks the read
count.set(5);
count.update(|n| *n += 1);      // 6
```

```tsx tabs
const count = signal(0);

count();                     // 0, and tracks the read
count.set(5);
count.update((n) => n + 1);  // 6
```

Une lecture dans un scope de suivi (un binding, `computed`, `effect`) abonne ce scope au signal. Une écriture notifie les abonnés quand la valeur a changé : comparée avec `PartialEq` en Rust, avec `===` en TSX.

```rust tabs
fn counter() -> impl IntoElement {
    let count = signal(0);
    view()
        .on_press(move || count.update(|n| *n += 1))
        .child(text(move || format!("Tapped {} times", count.get())))
}
```

```tsx tabs
function Counter() {
  const count = signal(0);
  return (
    <View onPress={() => count.update((n) => n + 1)}>
      <Text>Tapped {count()} times</Text>
    </View>
  );
}
```

Appuyer met à jour l'unique nœud de texte qui lit `count`. `counter()` / `Counter` lui-même ne s'exécute qu'une fois. Un signal Rust est un handle `Copy`, donc les closures le prennent avec `move` et l'utilisent librement.

Un signal peut compter chaque écriture comme un changement, et TSX peut comparer les valeurs à sa manière :

```rust tabs
let tick = signal_with(0, SignalEquals::Never);   // every write notifies
```

```tsx tabs
const tick = signal(0, { equals: false });   // every write notifies
const position = signal({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

En TSX, `signal<T>()` sans valeur démarre à `undefined` et est typé `Signal<T | undefined>` ; en Rust, un `Option` dit la même chose (`signal(None::<User>)`).

<a id="objects-and-arrays"></a>

### Objets et tableaux

En Rust, `update` modifie la valeur sur place et notifie les lecteurs ; `set` la remplace. En TSX, les signaux se comparent avec `===`, donc une valeur mutée sur place n'est pas un changement : écrivez un nouvel objet ou un nouveau tableau.

```rust tabs
let todos = signal(Vec::<Todo>::new());

todos.update(|list| list.push(Todo { id: 3, title: "New".into(), done: false }));   // notifies
todos.update(|list| {
    if let Some(todo) = list.iter_mut().find(|t| t.id == id) {
        todo.done = true;
    }
});
```

```tsx tabs
const todos = signal<Todo[]>([]);

todos.update((list) => [...list, { id: 3, title: "New" }]);                 // notifies
todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: true } : t)));

todos().push(item);    // does not notify anyone
todos.set(todos());    // still the same array: no change
```

`each` / `<Each>` identifie les lignes par élément, donc modifier un élément ne reconstruit que sa ligne ([JSX et composants](./jsx-and-components.md#control-flow)).

## computed

`computed(fn)` dérive une valeur d'autres signaux. Il exécute `fn`, mémorise le résultat, et le réexécute quand un signal lu change. Le lire revient à lire un signal :

```rust tabs
let price = signal(12);
let quantity = signal(2);
let total = computed(move || price.get() * quantity.get());

text(move || format!("Total: {}", total.get()))
```

```tsx tabs
const price = signal(12);
const quantity = signal(2);
const total = computed(() => price() * quantity());

<Text>Total: {total()}</Text>
```

Utilisez `computed` quand une valeur dérivée est lue à plusieurs endroits ou coûteuse à calculer : il s'exécute une fois par changement quel que soit le nombre de lecteurs, et les lecteurs ne sont notifiés que si son résultat change. Pour une valeur peu coûteuse lue une seule fois, une simple closure suffit :

```rust tabs
let label = move || format!("{} items", quantity.get());
text(label)
```

```tsx tabs
const label = () => `${quantity()} items`;
<Text>{label()}</Text>
```

En TSX, `fn` reçoit la valeur précédente (`undefined` la première fois), pour les valeurs qui s'accumulent :

```tsx
const max = computed((prev: number | undefined) => Math.max(prev ?? 0, speed()));
```

## effect

`effect(fn)` exécute `fn`, puis à nouveau chaque fois qu'un signal lu change. Les effets servent aux effets de bord : journalisation, timers, requêtes réseau, appels impératifs sur des [refs](./jsx-and-components.md#refs).

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// What to search for.
    pub query: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let results = signal(Vec::<SharedString>::new());
    effect(move || {
        let q = props.query.get();          // tracked: runs again when the prop changes
        if q.is_empty() {
            return;
        }
        spawn(async move {
            if let Ok(response) = fetch(format!("https://api.example.com/search?q={q}")).await {
                results.set(response.text().lines().map(|line| SharedString::from(line.to_owned())).collect());
            }
        });
    });
    view().child(each(results, |item| item.clone(), |item, _| text(item)))
}
```

```tsx tabs
function Search(props: { query: string }) {
  const results = signal<string[]>([]);
  effect(() => {
    const q = props.query;          // tracked: runs again when the prop changes
    if (!q) return;
    fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => results.set(data.items));
  });
  return <Each of={results()}>{(item) => <Text>{item()}</Text>}</Each>;
}
```

Un effet suit les lectures faites pendant son exécution synchrone. Les lectures dans une tâche, un callback `.then` ou après un `await` ne sont pas suivies.

Un effet qui appelle une [ref](./jsx-and-components.md#refs) agit sur l'élément qui porte cette ref ; en TSX, les effets s'exécutent après que les éléments créés dans la même passe existent, donc les refs sont définies :

```rust tabs
let input = element_ref();
effect(move || {
    if editing.get() {
        input.focus();
    }
});
```

```tsx tabs
let input: InputRef | undefined;
effect(() => {
  if (editing()) input?.focus();
});
```

> [!TIP]
> N'utilisez pas d'effets pour garder un signal synchronisé avec un autre (`effect(() => b.set(a() * 2))`). Utilisez `computed` : il n'est jamais périmé et ne provoque pas de seconde passe. Un effet qui écrit un signal qu'il lit aussi se réexécute en boucle jusqu'à ce que NSH l'arrête avec une erreur.

## resource

`resource(source, fetcher)` charge une valeur de façon asynchrone et garde l'état du chargement, de sorte qu'un composant affiche des données, un spinner ou une erreur sans avoir à les gérer lui-même :

```rust tabs
let url = signal(SharedString::from("https://api.example.com/quote"));
let quote = resource(move || Some(url.get()), |url, _info| async move {
    let response = fetch(url.to_string()).await?;
    if !response.ok() {
        return Err(format!("HTTP {}", response.status()));
    }
    Ok(response.text())
});

view()
    .child(text(move || match (quote.get(), quote.error()) {
        (_, Some(error)) => format!("Failed: {error}"),
        (Some(quote), None) => quote,
        (None, None) => "Loading…".to_owned(),
    }))
    .child(text("Reload").on_press(move || quote.refetch()))
```

```tsx tabs
import { List, resource, signal, Text } from "nsh";

type Post = { id: number; title: string };

const url = signal("https://jsonplaceholder.typicode.com/posts?_limit=20");
const posts = resource(url, async (u, { signal }) => {
  const response = await fetch(u, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Post[];
});

<If when={posts.error()}>
  <Text>Failed: {String(posts.error())}</Text>
</If>
<List
  each={posts() ?? []}
  refreshing={posts.state() === "refreshing"}
  onRefresh={posts.refetch}
>
  {(post) => <Text>{post().title}</Text>}
</List>
```

`source` est suivie : chaque fois qu'elle donne une nouvelle valeur, `fetcher(value, info)` recharge. En Rust, c'est une closure qui renvoie un `Option`, et `None` ne charge rien ; en TSX, c'est un accesseur (un signal, une fonction) ou une valeur, et `undefined`, `null` ou `false` ne chargent rien : utile pour un utilisateur pas encore connecté ou une sélection vide. Sans source, Rust passe `|| Some(())`, et le `resource(fetcher)` de TSX charge une fois, en appelant `fetcher(info)`. Le fetcher Rust renvoie un `Result` ; celui de TSX renvoie une valeur ou une promise, et un throw est un échec.

| Rust | TSX | Ce que c'est |
|---|---|---|
| `quote.get()` | `posts()` | La dernière valeur : aucune avant la fin du premier chargement, conservée pendant un rechargement et après un échec. |
| `quote.loading()` | `posts.loading()` | Indique si un chargement est en cours. |
| `quote.error()` | `posts.error()` | L'erreur du dernier chargement, aucune dès qu'un chargement donne une valeur. |
| `quote.state()` | `posts.state()` | `Unresolved` / `"unresolved"` (rien à charger), `Pending` (le premier chargement), `Ready`, `Refreshing` (rechargement, valeur conservée), `Errored`. |
| `quote.refetch()` | `posts.refetch()` | Recharge depuis la même source : une nouvelle tentative, un pull to refresh. |
| `quote.mutate(value)` | `posts.mutate(value)` | Définit la valeur sur place sans chargement, pour une mise à jour optimiste, et efface l'erreur. |

Une resource Rust est un handle `Copy`, comme les signaux ; les membres TSX sont liés, donc `onRefresh={posts.refetch}` et `const loading = posts.loading` fonctionnent tels quels.

Seul le dernier chargement compte. Un nouveau chargement abandonne celui en cours, tout comme la disparition du composant ; en TSX, `info.signal` interrompt le `fetch` qu'il reçoit. Un chargement qui se termine après avoir été remplacé ne change rien. `info.refetching` indique que `refetch()` a lancé le chargement. `resource_with_value(value, source, fetcher)` en Rust et `{ initialValue }` en TSX donnent à la resource une valeur dès le départ.

## cleanup

`cleanup(fn)` enregistre `fn` pour qu'elle s'exécute avant la prochaine exécution de l'effet courant, ou quand le composant ou l'effet auquel elle appartient disparaît :

```rust tabs
effect(move || {
    if !running.get() {
        return;
    }
    let ticker = spawn(async move {
        loop {
            timer(Duration::from_millis(100)).await;
            tick();
        }
    });
    cleanup(move || ticker.cancel());   // before the next run, or on removal
});
```

```tsx tabs
function Clock() {
  const now = signal(Date.now());
  const id = setInterval(() => now.set(Date.now()), 1000);
  cleanup(() => clearInterval(id));       // when Clock is removed
  return <Text>{new Date(now()).toLocaleTimeString()}</Text>;
}

effect(() => {
  if (!running()) return;
  const id = setInterval(tick, 100);
  cleanup(() => clearInterval(id));       // before the next run, or on removal
});
```

En Rust, les tâches, timers et intervalles (`spawn`, `set_timeout`, `set_interval`) se terminent déjà avec le propriétaire sous lequel ils ont été créés, donc l'horloge propre à une vue n'a pas besoin de nettoyage :

```rust
use std::time::Duration;

use nsh_core::time::unix_ms;

fn clock() -> impl IntoElement {
    let now = signal(unix_ms());
    set_interval(Duration::from_secs(1), move || now.set(unix_ms()));   // ends with the view clock() made
    text(move || format!("{:.0}", now.get() / 1000.0))
}
```

Un effet TSX peut aussi renvoyer son nettoyage, comme dans React : une fonction que `fn` renvoie s'exécute aux mêmes moments que celle passée à `cleanup`.

```tsx
effect(() => {
  const id = setInterval(tick, 100);
  return () => clearInterval(id);
});
```

Un composant disparaît quand il n'est plus rendu : sa branche `when` / `<If>` est masquée, sa ligne `each` / `<Each>` est retirée, ou sa page est dépilée. Tout ce qu'il a créé (effets, valeurs computed, tâches, nettoyages, composants imbriqués) est libéré avec lui.

## batch

Chaque écriture notifie immédiatement ses abonnés. Pour que plusieurs écritures comptent comme un seul changement, enveloppez-les dans `batch` : les dépendants s'exécutent une seule fois, après la dernière écriture.

```rust tabs
let save = move || {
    batch(|| {
        first_name.set(form.first.clone());
        last_name.set(form.last.clone());
        dirty.set(false);
    })
};
```

```tsx tabs
const save = () =>
  batch(() => {
    firstName.set(form.first);
    lastName.set(form.last);
    dirty.set(false);
  });
```

Les gestionnaires d'événements ne sont pas groupés automatiquement : deux écritures dans un handler de press exécutent deux fois un effet qui lit les deux signaux. `batch` renvoie ce que renvoie sa fonction.

## untracked

`untracked(fn)` exécute `fn` sans s'abonner à ce qu'elle lit. Utilisez-le dans un scope de suivi pour lire une valeur sans en dépendre :

```rust tabs
effect(move || {
    let q = query.get();                          // runs again when query changes
    let filters = untracked(|| active_filters.get());   // read, but not a reason to run again
    search(q, filters);
});
```

```tsx tabs
effect(() => {
  const q = query();                     // runs again when query changes
  const filters = untracked(activeFilters); // read, but not a reason to run again
  search(q, filters);
});
```

`get_untracked()` en Rust lit un signal de la même façon. Un corps de composant est déjà non suivi : y lire un signal ne le lit qu'une fois.

## context

Un contexte est une valeur qu'un composant fournit à tout ce qu'il rend, quelle que soit la profondeur. En Rust, `provide_context(value)` fournit une valeur de son type, et `use_context::<T>()` trouve la plus proche ; en TSX, `context(defaultValue)` crée un contexte, l'appeler lit la valeur fournie la plus proche (ou la valeur par défaut), et `<Ctx.Provider value>` en fournit une :

```rust tabs
#[derive(Clone, Copy)]
struct Dark(bool);

fn label(content: &'static str) -> impl IntoElement {
    let dark = use_context::<Dark>().is_some_and(|d| d.0);
    text(content).text_color(if dark { rgb(0xffffff) } else { rgb(0x1f2328) })
}

fn screen() -> impl IntoElement {
    provide_context(Dark(true));
    view().child(label("Hello"))
}
```

```tsx tabs
const Theme = context<"light" | "dark">("light");

function Label(props: { children: string }) {
  const theme = Theme();
  return <Text style={{ color: theme === "dark" ? "#ffffff" : "#1f2328" }}>{props.children}</Text>;
}

mount(() => (
  <Theme.Provider value="dark">
    <Label>Hello</Label>
  </Theme.Provider>
));
```

Une valeur fournie n'est lue qu'une fois, au moment de la recherche. Pour fournir quelque chose qui change, fournissez un signal (ou une struct de signaux) et lisez-le dans un binding :

```rust tabs
#[derive(Clone, Copy)]
struct Accent(Signal<Hsla>);

#[component]
fn App() -> impl IntoElement {
    provide_context(Accent(signal(rgb(0x0969da).into())));
    view().child(swatch())
}

fn swatch() -> impl IntoElement {
    let Accent(accent) = use_context::<Accent>().expect("an accent");
    view()
        .w(px(40.0))
        .h(px(40.0))
        .bg(move || accent.get())
        .on_press(move || accent.set(rgb(0x8250df).into()))
}
```

```tsx tabs
const Accent = context(signal("#0969da"));

function App() {
  const accent = signal("#0969da");
  return (
    <Accent.Provider value={accent}>
      <Swatch />
    </Accent.Provider>
  );
}

function Swatch() {
  const accent = Accent();
  return <View onPress={() => accent.set("#8250df")} style={{ width: 40, height: 40, backgroundColor: accent() }} />;
}
```

Lisez un contexte dans le corps d'un composant (ou dans du code exécuté pendant la création des composants), pas dans un gestionnaire d'événement ni dans un timer, où il n'y a aucun composant à partir duquel effectuer la recherche. Les composants Rust reçoivent aussi le thème de l'app de cette façon : `theme()` de `nsh_base` ([Thème](./rust.md#theme)).

<a id="error-boundaries"></a>

## Limites d'erreur

Une limite d'erreur confine une défaillance à la partie de la vue concernée. Quand quelque chose en dessous lève une erreur (en Rust : panique) pendant son rendu ou son exécution, par exemple le corps d'un composant, un binding, un effet ou un gestionnaire d'événement, la partie en échec est retirée et la limite affiche à sa place son fallback ; le reste de la vue reste inchangé. En Rust, c'est `catch_error(view, fallback)` ; en TSX, `<ErrorBoundary fallback>` de `nsh`. Le fallback reçoit l'erreur (en TSX la valeur levée elle-même, généralement une `Error`) et un reset qui rend la vue à nouveau :

```rust tabs
fn profile_card(user: Signal<Option<User>>) -> impl IntoElement {
    catch_error(
        move || profile(user),
        |error, reset| {
            view()
                .child(text(format!("Something went wrong: {error}")))
                .child(text("Try again").on_press(move || reset.reset()))
        },
    )
}
```

```tsx tabs
import { ErrorBoundary, Text, View } from "nsh";

function ProfileCard(props: { user: User | undefined }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <View>
          <Text>Something went wrong: {error instanceof Error ? error.message : String(error)}</Text>
          <Text onPress={reset}>Try again</Text>
        </View>
      )}
    >
      <Profile user={props.user} />
    </ErrorBoundary>
  );
}
```

Une défaillance remonte à la limite la plus proche au-dessus de l'endroit où elle s'est produite, et celle survenue dans un fallback remonte à la limite située au-dessus. Sans limite, la défaillance est signalée comme une erreur non interceptée (l'overlay d'erreur de développement, le journal). En TSX, un élément `fallback` est affiché tel quel (`fallback={<Text>Unavailable</Text>}`), et une fonction est appelée avec l'erreur et `reset`, quels que soient les paramètres qu'elle déclare.

<a id="what-runs-and-when"></a>

## Ce qui s'exécute, et quand

| Vous écrivez | S'exécute | S'exécute à nouveau quand |
|---|---|---|
| Corps du composant | Une fois, à sa création | Jamais (hors rechargement à chaud) |
| Un binding : une closure donnée à `text`, à un style ou à une prop en Rust ; `{expr}` ou `prop={expr}` qui appelle ou lit une propriété en TSX | Une fois, à la création de l'élément | Un signal lu change ; seule cette prop ou cet enfant est mis à jour |
| `computed(fn)` | À sa création | Un signal lu change |
| `effect(fn)` | Une fois les éléments de la passe courante créés | Un signal lu change |
| `when(cond, ..)` / `<If when>` | À sa création | La condition change de valeur |
| Ligne `each(..)` / `<Each of>` | Quand sa clé apparaît pour la première fois | Jamais ; ses signaux d'élément et d'index changent à la place |

L'environnement est réactif de la même façon : `window()`, `dark()`, `font_scale()`, `safe_area()` et `keyboard_height()` en Rust, `windowSize()`, `colorScheme()` et `fontScale()` de [`nsh`](../modules/nsh.md#device) ainsi que `safeArea()` et `keyboardFrame()` de [`nsh`](../modules/nsh.md) en TSX, de sorte que les bindings qui les lisent suivent la rotation, le mode sombre ou le clavier.

<a id="common-mistakes"></a>

## Erreurs courantes

**Lire un signal dans le corps du composant en attendant des mises à jour.**

```rust tabs
fn bad() -> impl IntoElement {
    let n = count.get();                       // read once
    text(format!("{n}"))                       // never changes
}

fn good() -> impl IntoElement {
    text(move || format!("{}", count.get()))   // a binding: follows count
}
```

```tsx tabs
function Bad() {
  const n = count();           // read once
  return <Text>{n}</Text>;     // never changes
}

function Good() {
  return <Text>{count()}</Text>;
}
```

**Lire les props une seule fois.** Une prop Rust lue avec `props.title.get()` dans le corps n'est lue qu'une fois ; lisez-la dans un binding (`text(props.title)`, `move || props.title.get()`). En TSX, `const { title } = props` lit `title` une seule fois : lisez `props.title` là où vous l'utilisez, ou séparez les props avec [`split`](./jsx-and-components.md#spreading-props).

**Muter au lieu de définir, en TSX.** `list().push(x)` modifie le tableau mais ne notifie personne. Écrivez un nouveau tableau, comme le fait pour vous `update` en Rust.

**Dériver un état avec des effets.** `effect(() => total.set(price() * qty()))` fonctionne, mais laisse `total` périmé entre l'écriture et l'effet, et coûte une seconde passe. Utilisez `computed`.

**Créer des effets hors des composants.** Les effets et les valeurs computed appartiennent au composant qui les a créés et sont libérés avec lui. Créés dans un gestionnaire d'événement ou un callback de timer, ils n'ont pas de propriétaire et vivent indéfiniment. Créez-les dans le corps d'un composant et laissez-les lire les signaux qui changent.

**Attendre que le code asynchrone soit suivi.** Seules les lectures faites de façon synchrone pendant l'exécution d'un effet ou d'une valeur computed sont suivies. Lisez d'abord les signaux, puis lancez le travail asynchrone.

<a id="related"></a>

## Voir aussi

- [JSX et composants](./jsx-and-components.md) : composants, props, `when` / `<If>` et `each` / `<Each>`, en Rust et en TSX.
- [Développer avec Rust](./rust.md) : apps Rust, tâches et thème.
- [Référence du module `nsh`](../modules/nsh.md) : la signature de chaque fonction TSX.
- [Animation](./animation.md) : valeurs animées qui s'animent sur le thread UI sans signaux.
