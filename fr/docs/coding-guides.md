---
title: "Guides de codage"
description: "Conventions d'architecture et de codage pour des applications et des bibliothèques de composants Native Shell maintenables, en Rust et en TSX."
order: 29.5
group: ui
source_hash: 221afca7c1c61f24
---

# Guides de codage

Ce guide décrit l'architecture d'application et les patterns de code qui se sont révélés durables dans les applications Native Shell. Il
s'adresse aussi bien aux ingénieurs qu'aux agents de codage : développeurs d'applications NSH (modules TSX, composants Rust, applications natives
qui embarquent NSH) et auteurs de bibliothèques de composants construites sur `nsh/base`. Lisez d'abord les Guides de conception : la structure du code
doit préserver l'intention du produit, non la remplacer.

Ce guide est normatif. **Doit** marque les contraintes de cycle de vie, de correction ou d'écosystème ; **devrait** désigne l'architecture par défaut
et exige une raison concrète pour s'en écarter. Le code source actuel, les pages de référence et les
déclarations de `.nsh/types` restent la référence pour les signatures exactes.

<a id="make-the-common-path-inexpensive"></a>

## Rendre le chemin courant peu coûteux

**Principe de conception : choisir les types du framework et la propriété de façon à ce que l'usage ordinaire des composants soit peu coûteux par défaut.**
Les développeurs doivent pouvoir construire et réutiliser une UI sans ajouter un cache à chaque site d'appel. Les composants qui s'exécutent une seule fois et les
[signaux](./reactivity.md) lus là où ils sont utilisés en sont des exemples : un composant construit sa partie de l'arbre une seule fois,
puis seules les liaisons qui lisent un signal modifié s'exécutent à nouveau, ce qui évite au chemin courant tout travail répété. Le
graphe réactif, le moteur de rendu, la mise en page et les listes sont natifs, et un tour de code de l'application devient un lot d'opérations
natives. De petits coûts se multiplient toutefois avec les éléments et les mises à jour, surtout en TSX, dont le code s'exécute dans un
interpréteur ; mesurez les chemins critiques exceptionnels avant d'ajouter des caches ([Performance](./performance.md)). Aucun des deux choix
ne promet un coût nul. Les [règles de propriété de l'état](#state-ownership) et les sections de rendu suivantes expliquent le mécanisme.

<a id="architecture-at-a-glance"></a>

## L'architecture en un coup d'œil

<img class="diagram diagram-light" src="/diagrams/application-layers-light.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">
<img class="diagram diagram-dark" src="/diagrams/application-layers-dark.svg" alt="NSH application architecture: the App Shell, Pages and App Components above a Component Library, nsh/base and nsh; dependencies point downward.">

Les dépendances pointent vers le bas. Les couches hautes possèdent le sens métier et l'orchestration ; les couches basses possèdent la
présentation ou le comportement réutilisables. Ne faites pas dépendre un composant réutilisable d'une page d'application, ni une bibliothèque de composants
du thème d'une seule application ([Trois couches](./architecture.md#three-layers)).

Utilisez ces frontières :

- **shell de l'application :** l'entrée (`App.tsx`, ou `nsh.json` `"root"`) compose la racine et les piles de navigation tout en
  gardant la logique des pages à l'extérieur ;
- **page :** un `NavPage` avec son contenu, ses dialogues et le travail qu'elle lance ;
- **composant d'application :** un pattern répété qui connaît le domaine ;
- **bibliothèque de composants :** une UI stylée et généraliste, celle de l'application ou celle de la communauté, construite sur `nsh/base` ;
- **`nsh/base` :** un comportement réutilisable sans présentation produit : navigation, dialogues, popovers, menus, sheets, une
  cible de pression ;
- **`nsh` :** les primitives, les styles, la mise en page, la réactivité et l'environnement.

<a id="lay-out-an-apps-files"></a>

### Organiser les fichiers d'une application

Les fichiers d'une application suivent les conventions de NSH, il n'y a donc rien à configurer : `App.tsx` est l'entrée et `nsh.json`
se trouve à côté, et les deux sont trouvés par convention.

```text
App.tsx            # the entry, by convention: mount(App)
nsh.json
Cargo.toml         # the app's crate, with Rust components ("rust": ".")
src/
  lib.rs
pages/
  Inbox.tsx
  Compose.tsx
  Settings.tsx
components/
  Card.tsx
store.ts
```

- `pages/` contient un fichier par `NavPage`. Une page ne se répartit en plusieurs fichiers que lorsque c'est nécessaire.
- `components/` contient les composants réutilisables de l'application, ceux que plusieurs pages utilisent.
- `store.ts` contient l'état de l'application : ses signaux et les fonctions qui les modifient. Les pages lisent les signaux et appellent
  les fonctions.
- Les tests sont des fichiers `*.test.tsx` placés à côté de ce qu'ils testent (`App.test.tsx`, `pages/Inbox.test.tsx`).
- `Cargo.toml` et `src/lib.rs` forment le crate propre à l'application, avec ses composants Rust (`nsh.json` `"rust": "."`) ; son
  `#[native_module]` dans `src/lib.rs` nomme ce que TSX importe. Une application écrite uniquement en Rust est le même projet Cargo,
  avec son composant racine dans `src/lib.rs` ([Structure du projet](./project-structure.md)).

Le shell de l'application compose les pages mais contient peu de logique de page. Les pages lisent les signaux du store et appellent ses fonctions ;
elles n'écrivent jamais l'état d'une autre page. Gardez les signaux du store privés et exportez ce qui les lit et les modifie, afin que
l'état mutable reste derrière ses fonctions publiques :

```rust tabs
/// The app's workspace: its state stays behind these functions.
#[derive(Clone, Copy)]
pub struct Workspace {
    name: Signal<SharedString>,
}

impl Workspace {
    /// A workspace named "Untitled".
    pub fn new() -> Self {
        Self { name: signal(SharedString::from("Untitled")) }
    }

    /// Its name (tracked where it is read).
    pub fn name(&self) -> SharedString {
        self.name.get()
    }

    /// Renames it.
    pub fn rename(&self, name: impl Into<SharedString>) {
        self.name.set(name.into());
    }
}
```

```tsx tabs
// store.ts
import { signal } from "nsh";

const name = signal("Untitled");

/** The workspace's name (tracked where it is read). */
export const workspaceName = () => name();

/** Renames the workspace. */
export function renameWorkspace(next: string) {
  name.set(next);
}
```

Une page peut détenir le workspace et transmettre son id à la recherche ; la recherche n'a pas besoin de toute la collection du workspace ni de ses
signaux privés. Une forme de dépendances simple et acyclique est :

```text
App.tsx ──▶ pages/ ──▶ store.ts
              └──────▶ components/ ──▶ nsh/base, nsh
```

Les pages peuvent dépendre du store et des composants, mais pas du shell ni des parties privées d'une autre page. Si une page
doit modifier ce qu'une autre affiche, faites-le par le store. Ces frontières permettent à différents ingénieurs ou agents d'IA de travailler
en parallèle sur des pages distinctes, avec moins de conflits de fichiers et moins de couplage d'état partagé ; le store exige toutefois
de la coordination.

<a id="bootstrap-and-root-ownership"></a>

## Amorçage et propriété de la racine

Montez l'application une seule fois et donnez à la racine toute la surface : une entrée TSX appelle `mount(App)`, une application Rust nomme son composant
racine dans `nsh.json` (`"root": "App"`). La racine remplit la surface avec `flex: 1` et un arrière-plan issu du thème :

```rust tabs
#[component]
pub fn App() -> impl IntoElement {
    provide_context(Workspace::new());
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(inbox())
}
```

```tsx tabs
import { mount, View } from "nsh";

mount(() => (
  <View class="flex-1 bg-background">
    <App />
  </View>
));
```

La racine coordonne ce qui appartient à l'ensemble de la surface : la pile de navigation, les dialogues, popovers, menus, sheets et
infobulles affichés par-dessus tout son contenu, et la safe area. Ne montez pas une seconde racine par page au sein d'une même surface.
Une surface correspond à un moteur : chaque `NshAppView`, `NshView` ou `AppView` qu'une application native embarque exécute sa propre VM, son propre état de module
et son propre graphe réactif, de sorte que plusieurs surfaces dans une même application hôte ne partagent jamais d'état par accident.

<a id="understand-what-runs-once-and-what-runs-again"></a>

## Comprendre ce qui s'exécute une fois et ce qui s'exécute à nouveau

NSH repose sur un état persistant avec une construction déclarative, selon le modèle de Solid ([Réactivité](./reactivity.md)). Un signal
survit aux mises à jour ; le corps d'un composant décrit sa partie de l'arbre une seule fois, lors de sa création. Gardez cette
distinction explicite :

| Ce que vous écrivez | S'exécute | S'exécute à nouveau quand |
| --- | --- | --- |
| Un corps de composant | Une fois, à sa création | Jamais |
| Une liaison : une closure (Rust) ou une expression qui appelle ou lit une propriété (TSX) là où une valeur est attendue | Une fois | Un signal qu'elle a lu change ; seuls cette prop ou cet enfant sont mis à jour |
| `computed(fn)` | À sa création | Un signal qu'il a lu change |
| `effect(fn)` | Une fois les éléments de la passe créés | Un signal qu'il a lu change |
| Une ligne de `each` / `<Each>` | Quand sa clé apparaît pour la première fois | Jamais ; ses signaux d'élément et d'index changent |
| Une cellule de `virtual_list` / `<List>` | Une fois par cellule | Jamais ; la cellule reçoit d'autres lignes |

- le composant en cours d'exécution est le **propriétaire** (owner) : les effets, valeurs calculées, tâches, minuteurs, raccourcis clavier et nettoyages créés
  pendant son exécution lui appartiennent et sont libérés avec lui ;
- le **contexte** (`provide_context` / `use_context`, `context()` et `<Ctx.Provider>`) donne une valeur à un sous-arbre sans
  impliquer que les éléments qui la lisent en soient propriétaires ;
- le **`Scope`** d'un composant Rust (`cx`) émet ses événements et lit les insets qui lui sont fournis ;
- les **refs** (`element_ref()`, `ref`) désignent un élément hôte pour des appels impératifs (`focus()`, `scroll_to()`, `measure()`) ;
- la mise en page et la mesure sont des phases natives ultérieures ; n'utilisez `onLayout` et `measure()` que lorsque la géométrie résolue est
  réellement nécessaire.

Ne lisez jamais un contexte dans un gestionnaire d'événement ou un minuteur, où aucun composant ne permet de le retrouver : lisez-le dans le
corps et conservez ce qu'il a fourni. Conservez des handles typés (signaux, ressources, refs, ids de domaine), qui sont `Copy` en Rust et
cessent de fonctionner une fois leur propriétaire disparu.

<a id="choose-the-right-unit"></a>

## Choisir la bonne unité

<a id="use-a-plain-function-for-value-like-elements"></a>

### Utiliser une fonction simple pour les éléments de type valeur

**Utilisez par défaut une fonction simple pour les morceaux d'UI légers et réutilisables.** L'appelant fournit les props et les
gestionnaires courants, la fonction renvoie des éléments, et il ne reste rien d'elle hormis les liaisons qu'elle a créées. Ses arguments sont ses
props ; le libellé affiché, la valeur et les callbacks proviennent de l'état courant de l'appelant. Elle s'exécute tout de même une seule fois, comme tout
composant : ce qui change ensuite, ce sont ses liaisons.

```rust tabs
fn empty_state(title: impl Into<SharedString>) -> impl IntoElement {
    view()
        .gap_2()
        .items_center()
        .child(text(title.into()).text_color(move || theme().muted_foreground))
}
```

```tsx tabs
function EmptyState(props: { title: string }) {
  return (
    <View class="items-center gap-2">
      <Text class="text-muted-foreground">{props.title}</Text>
    </View>
  );
}
```

<a id="use-a-component-for-retained-behavior"></a>

### Utiliser un composant pour un comportement persistant

Utilisez un `#[component]` (ou un composant TSX qui crée des signaux) lorsqu'un morceau d'UI possède un état persistant ou un cycle de vie
indépendant : signaux, effets, travail asynchrone, minuteurs, raccourcis clavier. Créez cet état dans le corps du composant,
une seule fois, jamais à l'intérieur d'une liaison.

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchProps {
    /// Shown while the field is empty.
    pub placeholder: Prop<SharedString>,
}

#[component]
pub fn Search(props: SearchProps) -> impl IntoElement {
    let query = signal(String::new());
    input()
        .value(move || query.get())
        .on_change(move |text: &str| query.set(text.to_owned()))
        .placeholder(move || props.placeholder.get().to_string())
}
```

```tsx tabs
function Search(props: { placeholder: string }) {
  const query = signal("");
  return <Input value={query()} onChange={({ value }) => query.set(value)} placeholder={props.placeholder} />;
}
```

Un `#[component]` possède des props typées (`#[derive(Props)]`) et des événements (`#[derive(Event)]`) ; TSX l'importe avec
des déclarations générées à partir d'eux. L'état persistant que TSX utilise avec `new` (un registre, un parseur, une session) est un
`#[class]`, et les fonctions forment un `#[module]` ([Développer avec Rust](./rust.md#extending-a-rust-app-with-tsx)). Écrivez en Rust, qui est du code natif de bout en bout, les
parties que l'application utilise le plus, les bibliothèques de composants et la logique exigeante ; réservez TSX à ce qui change souvent ou est livré à l'exécution.

Ne transformez pas chaque fragment visuel en composant. Les frontières de composants ont des coûts de cycle de vie et de coordination ; utilisez-les
là où l'identité persistante compte.

<a id="elements-views-and-behavior-systems-are-different"></a>

### Éléments, vues et systèmes de comportement sont différents

Ne forcez pas chaque composant dans un même modèle. L'écosystème contient :

- des éléments sémantiques tels que `Button`, `Switch` et `MenuItem` ;
- des racines de comportement composées telles que `Dialog`, `Popover`, `Menu`, `ContextMenu`, `Sheet` et `NavStack` ;
- des systèmes à état tels que `Input`, `List`, `TextView` et l'état d'une pile de navigation ;
- de l'infrastructure telle que les overlays et leur placement, la virtualisation, le défilement, les safe areas, le clavier et
  l'animation.

Un élément peut être complexe en interne tout en restant de type valeur pour son appelant. Un système à état peut exposer des fonctions de rendu
afin que les applications possèdent la présentation sans réimplémenter le comportement. Choisissez l'interface publique d'après le comportement, et non
d'après le nombre de vues présentes dans sa sortie.

<a id="state-ownership"></a>

## Propriété de l'état

<a id="own-persistent-ui-text-with-103"></a>

### Posséder le texte d'UI persistant avec `SharedString`

**En Rust, il faut privilégier `SharedString` pour le texte d'UI conservé entre les mises à jour ou les closures de callback**, y compris les
libellés, titres et placeholders de composants : les props l'acceptent (`Prop<SharedString>`), et le cloner dans une liaison ne copie pas
le texte. Pour un tampon d'édition modifiable ou un texte assemblé avec du formatage, utilisez `String` et convertissez lorsque le résultat est
prêt ; pour un accès temporaire en lecture seule pendant un appel, utilisez `&str`. En TSX, les chaînes sont les valeurs propres à l'application ; gardez le texte
calculé à partir de l'état dans un `computed` ou une closure plutôt que de le reconstruire à plusieurs endroits.

Pour un texte de réponse immuable que l'UI conservera, gardez la valeur reçue intacte et placez le texte de présentation dérivé ou formaté dans une
valeur de domaine distincte plutôt que de réécrire la réponse.

Placez chaque état chez le plus petit propriétaire capable de le garder correct :

- l'état de domaine appartient au store (`store.ts`) ou au crate de l'application ;
- l'état de vue transitoire appartient au composant qui l'affiche, sous forme de signal ;
- l'état comportemental réutilisable appartient au composant conçu pour cela (un `Menu` ou `Popover` sans `open` garde le sien) ;
- l'état qu'un sous-arbre partage est un signal fourni par le [contexte](./reactivity.md#context) ;
- ce qui survit à une exécution relève du [stockage](../modules/nsh.md#storage) ou d'un serveur.

Préférez les valeurs contrôlées pour la sélection et les bascules ordinaires : passez la valeur courante au composant, recevez un
changement demandé, mettez à jour le propriétaire, et les liaisons suivent. Un callback signale une intention ; il ne doit pas créer une seconde
source de vérité cachée.

```rust tabs
switch()
    .checked(show_hidden)
    .on_change(move |next: &bool| show_hidden.set(*next))
    .child(text("Show hidden files"))
```

```tsx tabs
<Switch checked={showHidden()} onChange={({ checked }) => showHidden.set(checked)}>
  <Text>Show hidden files</Text>
</Switch>
```

Il n'y a rien à notifier : écrire un signal met à jour exactement les liaisons qui le lisent. Un composant Rust émet un
événement sémantique que son propriétaire doit traiter avec `cx.emit(..)` ; un effet suit un signal tant que son propriétaire
existe. Écrivez plusieurs champs formant un même invariant dans un seul [`batch`](./reactivity.md#batch), afin que les effets et les valeurs
calculées les voient ensemble.

Un composant contrôlé propre à l'application suit le même contrat. Un stepper de quantité, contrôle de domaine écrit une fois
en Rust et placé depuis Rust et TSX :

```rust tabs
use nsh_base::{button, theme};
use nsh_core::prelude::*;

/// The props of [`QuantityStepper`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct QuantityStepperProps {
    /// The quantity: the app owns the value.
    #[prop(default)]
    pub value: Prop<u32>,
    /// The smallest quantity (0 when left out).
    #[prop(default)]
    pub min: Prop<u32>,
    /// The largest quantity (99 when left out).
    #[prop(default = 99)]
    pub max: Prop<u32>,
    /// What screen readers say for the button that takes one away.
    pub decrement_label: Prop<SharedString>,
    /// What screen readers say for the button that adds one.
    pub increment_label: Prop<SharedString>,
}

/// What a [`QuantityStepper`] reports.
#[derive(Debug, Clone, PartialEq, Event)]
pub enum QuantityStepperEvent {
    /// The user asked for another quantity; the owner sets `value`.
    Change(u32),
}

/// A quantity with a button to take one away and one to add one.
#[component]
pub fn QuantityStepper(props: QuantityStepperProps, cx: Scope<QuantityStepperEvent>) -> impl IntoElement {
    // Read untracked: the user's act, measured against the owner's current value.
    let step = move |delta: i64| {
        let value = props.value.get_untracked();
        let (min, max) = (props.min.get_untracked(), props.max.get_untracked());
        let next = (i64::from(value) + delta).clamp(i64::from(min), i64::from(max)) as u32;
        if next != value {
            cx.emit(QuantityStepperEvent::Change(next));
        }
    };
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .child(step_button(
            "−",
            move || props.decrement_label.get(),
            move || props.value.get() <= props.min.get(),
            move || step(-1),
        ))
        .child(text(move || props.value.get().to_string()).text_color(move || theme().foreground))
        .child(step_button(
            "+",
            move || props.increment_label.get(),
            move || props.value.get() >= props.max.get(),
            move || step(1),
        ))
}

fn step_button(
    symbol: &'static str,
    label: impl Fn() -> SharedString + 'static,
    disabled: impl Fn() -> bool + 'static,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .disabled(disabled)
        .accessibility_label(move || Some(label()))
        .on_press(on_press)
        .w(px(32.0))
        .h(px(32.0))
        .items_center()
        .justify_center()
        .rounded(move || theme().radius)
        .bg(move || theme().muted)
        .active(|s| s.opacity(0.6))
        .disabled_style(|s| s.opacity(0.4))
        .child(text(symbol).text_color(move || theme().foreground))
}

// The owner:
let quantity = signal(1_u32);
quantity_stepper()
    .value(quantity)
    .min(1)
    .max(10)
    .decrement_label("Fewer")
    .increment_label("More")
    .on_change(move |next: &u32| quantity.set(*next))
```

```tsx tabs
import { signal } from "nsh";
import { QuantityStepper } from "my-app";   // the Rust component: src/lib.rs has #[native_module("my-app")]

function CartRow() {
  const quantity = signal(1);
  return (
    <QuantityStepper
      value={quantity()}
      min={1}
      max={10}
      decrementLabel="Fewer"
      incrementLabel="More"
      onChange={({ value }) => quantity.set(value)}
    />
  );
}
```

Le même contrat en TSX, un composant dans `components/` :

```tsx
import { Text, View } from "nsh";
import { Button } from "nsh/base";

export interface QuantityStepperProps {
  /** The quantity: the app owns the value. */
  value: number;
  /** The smallest quantity (0 when left out). */
  min?: number;
  /** The largest quantity (99 when left out). */
  max?: number;
  /** What screen readers say for the button that takes one away. */
  decrementLabel: string;
  /** What screen readers say for the button that adds one. */
  incrementLabel: string;
  /** The user asked for another quantity; the owner sets `value`. */
  onChange?: (e: { value: number }) => void;
}

export function QuantityStepper(props: QuantityStepperProps) {
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 99;
  const step = (delta: number) => {
    const next = Math.min(max(), Math.max(min(), props.value + delta));
    if (next !== props.value) props.onChange?.({ value: next });
  };
  const buttonClass = "size-8 items-center justify-center rounded-(--radius) bg-muted active:opacity-60 disabled:opacity-40";
  return (
    <View class="flex-row items-center gap-3">
      <Button disabled={props.value <= min()} accessibilityLabel={props.decrementLabel} onPress={() => step(-1)} class={buttonClass}>
        <Text class="text-foreground">−</Text>
      </Button>
      <Text class="text-foreground">{props.value}</Text>
      <Button disabled={props.value >= max()} accessibilityLabel={props.incrementLabel} onPress={() => step(1)} class={buttonClass}>
        <Text class="text-foreground">+</Text>
      </Button>
    </View>
  );
}
```
<a id="keep-ownership-links-and-subscriptions-bounded"></a>

### Garder bornés les liens de propriété et les abonnements

Un composant possède ce qu'il crée, et tout ce qu'il a créé disparaît avec lui : lorsque sa branche `<If>` se masque, que sa ligne est supprimée ou que sa page est dépilée. En Rust, les tâches, minuteurs et intervalles (`spawn`, `set_timeout`, `set_interval`) et les raccourcis clavier (`on_key`) prennent fin avec le propriétaire sous lequel ils ont été créés ; en TSX, enregistrez l'arrêt avec [`cleanup`](./reactivity.md#cleanup) ou retournez-le depuis l'effet. L'écoute passe par `on(event, listener)`
(`host.on(name, listener)`, `BackHandler.on("press", listener)`), qui renvoie une fonction qui l'arrête
(`() => void`, depuis Rust un `Stop`), et ce qui est enregistré pendant le rendu d'un composant disparaît avec le composant, comme
les raccourcis de `keymap.bind`.

Lorsque quelque chose continue de s'exécuter de façon inattendue, inspectez d'abord les effets et les valeurs calculées créés en dehors d'un composant (dans
un gestionnaire d'événement ou un callback de minuteur, ils n'ont pas de propriétaire et vivent indéfiniment), les écouteurs enregistrés sans leur arrêt,
et le travail lancé depuis un store qu'aucun composant ne possède. Un chargement `resource` abandonné est annulé (`info.signal` en TSX) ;
il ne maintient pas son composant en vie. Ce sont des points de départ courants, pas une liste exhaustive.

N'écrivez pas un signal simplement parce qu'une valeur a été lue ou dérivée. Évitez les écritures inconditionnelles depuis un binding ou un
effet qui lit le même signal : il se relance lui-même jusqu'à ce que NSH l'arrête avec une erreur. Une valeur calculée à partir d'un autre
état est un `computed`, pas un effet qui écrit un second signal.

<a id="avoid-state-feedback-loops"></a>

### Éviter les boucles de rétroaction d'état

La saisie de texte, la sélection, les filtres et les popups contrôlés ont couramment deux chemins : un propriétaire externe met à jour la valeur, et
l'interaction de l'utilisateur demande une nouvelle valeur. Ne renvoyez pas une valeur fournie par le propriétaire via le callback utilisateur pendant la synchronisation.
Lisez la valeur courante du propriétaire sans suivi lors du traitement de l'action de l'utilisateur (`props.value.get_untracked()` en Rust, comme
ci-dessus ; un gestionnaire d'événement TSX est déjà sans suivi) et comparez-la à la suivante, afin que chaque changement logique soit signalé
une seule fois. Rendez les callbacks sûrs face à la réentrance lorsqu'un callback peut fermer, remplacer ou mettre à jour de façon synchrone le composant
qui l'a invoqué.

<a id="stable-identity"></a>

## Identité stable

Une clé fait partie du comportement. Elle donne à une ligne, une page ou un contrôle répété une identité stable, et détermine lequel conserve
son état, son focus et ses mesures lorsque les données changent.

- Utilisez des identifiants de domaine stables pour les lignes, onglets, pages et contrôles répétés : `each(projects, |p| p.id, ..)`,
  `<Each of={projects()} key={(p) => p.id}>`, le `keyExtractor` d'une liste.
- Préfixez les identifiants de test avec leur objet propriétaire lorsque le même contrôle se répète (`delete-${project.id}`).
- Ne dérivez jamais l'identité d'un libellé traduit ni d'un index de liste modifiable lorsque des éléments peuvent être insérés ou réordonnés.
- Ne générez pas de clé ou d'identifiant aléatoire neuf pendant le rendu.

```rust tabs
each(projects, |p| p.id, move |project, _index| {
    let id = project.get_untracked().id;
    button()
        .on_press(move || delete(id))
        .child(text("Delete").test_id(&format!("delete-{id}")))
})
```

```tsx tabs
<Each of={projects()} key={(p) => p.id}>
  {(project) => (
    <Button onPress={() => remove(project().id)}>
      <Text testID={`delete-${project().id}`}>Delete</Text>
    </Button>
  )}
</Each>
```

Une clé modifiée signifie une identité d'interface modifiée. Considérez cette réinitialisation comme délibérée.

La même règle s'applique aux routes de navigation, aux clés de liste, aux clés de stockage et aux identifiants de test. Une route qui reste dans `setRoutes`
conserve sa page et son état ; si deux comportements retenus indépendamment partagent une clé, ils peuvent écraser l'état
l'un de l'autre ; si un comportement change de clé à chaque mise à jour, il n'accumule jamais d'état.

<a id="rendering-and-composition"></a>

## Rendu et composition

Gardez le corps d'un composant déclaratif : lisez l'état courant, dérivez les valeurs de présentation et composez les éléments. Déplacez les opérations
de domaine, l'analyse et les mutations non triviales vers des fonctions nommées du store ou du crate de l'application.

```rust tabs
#[component]
pub fn ProjectPage() -> impl IntoElement {
    view()
        .flex_1()
        .child(toolbar())
        .child(content())
}
```

```tsx tabs
function ProjectPage() {
  return (
    <View class="flex-1">
      <Toolbar />
      <Content />
    </View>
  );
}
```

Extrayez un helper lorsqu'il nomme une région significative et réduit la quantité d'état qu'un lecteur doit garder en tête à la fois.
Extrayez un nouveau composant lorsque la région a son propre contrat réutilisable ou son propre cycle de vie retenu, et non simplement parce qu'une
chaîne de builders ou un bloc JSX est long.

Utilisez les méthodes de style typées et les builders des composants de façon cohérente en Rust, et des classes en TSX. Préférez
`.when(..)` / `.when_some(..)` (Rust) et `classList` (TSX) pour de petits raffinements conditionnels ; utilisez `when` / `<If>`
lorsque les branches représentent des interfaces substantiellement différentes, car un ternaire dans une closure reconstruit sa branche à nouveau
chaque fois que quelque chose qu'il lit change.

Composez à partir du composant sémantique standard avant de construire une surface personnalisée. Ne reproduisez pas un menu, un popover, une
sheet ou un dialog à partir de vues génériques simplement pour correspondre à une capture d'écran : `Menu`, `ContextMenu`, `Popover`, `Sheet`,
`Tooltip` et `Dialog` de `nsh/base` préservent le placement, le transfert du focus, la navigation au clavier, la sélection, l'état désactivé,
la fermeture par Échap et par retour, ainsi que le contrat d'accessibilité. Si le composant standard ne peut pas exprimer un
motif valide récurrent, améliorez son API explicite au lieu de styliser des descendants arbitraires à chaque site d'appel.

Les fonctions de rendu fournies par le code de l'application doivent être sans effet de bord. La ligne d'une liste, le `renderCodeBlock` d'un `TextView` ou les éléments d'un
menu peuvent s'exécuter chaque fois que leur propriétaire a besoin d'une cellule, d'une partie ou d'une ouverture. Ils ne doivent pas effectuer d'opération
métier, ajouter des données ni démarrer un abonnement non borné.

<a id="behavior-and-presentation-boundary"></a>

## Frontière entre comportement et présentation

La règle durable de Base est la suivante :

> Base possède le comportement réutilisable et la structure nécessaire pour l'implémenter. La couche de présentation possède le
> langage visuel du produit.

« Sans style » ne signifie pas « une seule vue vide ». Le placement des overlays, la navigation au clavier, l'édition, la virtualisation, la navigation
arrière, la fermeture et les zones sûres exigent une structure interne et un état. Déléguer ce travail à chaque appelant ne
créerait pas de flexibilité ; cela dupliquerait un comportement fragile.

À l'inverse, Base ne doit pas choisir les couleurs de marque, la typographie, la densité, les icônes finales, les variantes de composants, les chaînes de caractères ni
la composition de l'application. Exposez la présentation via `class` / `style` sur la partie principale, `<part>Class` /
`<part>Style` pour chaque autre partie, des styles d'état typés (`active`, `hover`, `focus`, `selected`, `checked`, `disabled`),
des slots nommés (`trigger`, `header`, `footer`) et des fonctions de rendu. N'inspectez pas des descendants arbitraires pour découvrir
des titres, des descriptions ou des boutons de fermeture : rendez les parties sémantiques explicites, et recevez chaque libellé comme prop ou comme enfant.

<a id="theme-and-styling"></a>

## Thème et style

Lisez les valeurs sémantiques depuis le thème et appliquez la mise en page avec les méthodes de style typées en Rust et les classes Tailwind en TSX
([Tailwind](./tailwind.md), [tokens de thème](./tailwind.md#theme-tokens)) :

```rust tabs
view()
    .bg(move || theme().background)
    .text_color(move || theme().foreground)
    .border_1()
    .border_color(move || theme().border)
    .rounded(move || theme().radius)
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-background text-foreground" />
```

Règles :

- ne codez pas en dur les couleurs du produit, les rayons de coin, les espacements ni la géométrie des contrôles ;
- le code de l'application ne doit pas introduire de valeurs hexadécimales brutes, `rgb` / `rgba` ou `hsla` ; lisez une couleur sémantique depuis `theme()` ou une
  classe de token (`bg-primary`), ou ajoutez le rôle manquant au fichier de thème de l'application ;
- la mise en page de l'application doit utiliser les échelles d'espacement et de typographie (`p-2`, `gap-3`, `w-64`, `text-sm` ; `.p_2()`, `.gap_3()`,
  `.w_64()`, `.text_sm()`) plutôt que des valeurs arbitraires (`p-[13px]`, `px(13.0)`) ;
- les classes signifient exactement ce qu'elles signifient dans Tailwind CSS v4, et les valeurs de style ce que la
  [référence des styles](../modules/style-reference.md) leur donne (celles de CSS, sous des formes natives : les nombres sont des points) ; un
  avertissement `unknown class` est un constat à corriger ;
- utilisez des tokens sémantiques pour le sens, pas pour la position dans la palette ;
- gardez la géométrie indépendante de l'état dans la chaîne de builders ordinaire ou la chaîne de classes ;
- utilisez `active:`, `hover:` et `focus:` (`.active(..)`, `.hover(..)`, `.focus(..)`) pour les états d'interaction à l'exécution ;
  ils s'appliquent nativement, sans aller-retour vers le code de l'application ;
- utilisez les styles d'état sémantiques d'un composant (`selected:`, `checked:`, `disabled:`) pour l'apparence coché, sélectionné, appuyé ou
  désactivé ;
- gardez la propriété du popup dans un état explicite (`open` avec `onOpenChange`) afin que son déclencheur puisse afficher l'apparence ouverte ou appuyée
  jusqu'à la fermeture ;
- gardez les variantes de composants peu nombreuses et significatives plutôt que d'ajouter une variante pour chaque site d'appel ;
- liez le style principal à la véritable validation par défaut de la zone de décision et à son action de la touche Entrée ; ne le dérivez pas
  du nombre d'actions, de leur fréquence ou de la position dans la barre d'outils ;
- gardez les variantes de badge et d'alerte sémantiques et rares. Les métadonnées ordinaires restent neutres ; ne faites pas correspondre chaque cas d'enum
  ou chaque section à une couleur différente simplement parce qu'une variante existe.

La précédence effective est : le style propre de l'élément, puis les styles d'état, les états ultérieurs l'emportant, avec `disabled`
au-dessus de tout. Les couches ultérieures ne remplacent que les champs qu'elles définissent.

Préférez les tokens sémantiques du thème pour toute nouvelle présentation propre à l'application. Chaque nom du fichier de thème de l'application est un token, tout comme
une variable de `@theme` de Tailwind (`"up": "#16a34a"` donne `text-up`, `bg-up/30`, `token("up")` en TSX et
`theme().color("up")` en Rust), et le thème a des valeurs claires et sombres, de sorte qu'un token suit l'apparence sans
classe `dark:`. Nommez les tokens d'après des rôles, pas des composants, afin qu'ils ne deviennent pas le point d'extension
de chaque widget.

Modifiez le thème via le fichier de thème de l'application (`nsh.json` `"theme"`), ou laissez l'application hôte fournir le sien : les classes
nommant des tokens et les bindings Rust lisant `theme()` sont restylés nativement à chaque changement, sans aucun
JavaScript en cours d'exécution. Le code qui copie la valeur d'un token dans son propre signal cesse de le suivre.

Un anneau de focus extérieur a besoin d'espace physique. Un ancêtre avec `overflow: hidden` (`overflow-hidden`) le coupe. Préférez les
mises en page qui laissent de la place ; si un produit doit couper fortement, dessinez l'état focalisé à l'intérieur du contrôle plutôt que de
masquer silencieusement tout le focus clavier.

<a id="the-users-text-size-is-the-apps-zoom"></a>

### La taille de texte de l'utilisateur est le zoom de l'application

Le texte suit la taille de texte de l'utilisateur (Dynamic Type, l'échelle de police d'Android, les réglages des environnements de bureau) : `fontScale()` en TSX,
`font_scale()` en Rust, tous deux réactifs. L'échelle typographique (`text-sm`, `text-base` : 16 points, la taille du corps de texte) fixe
la référence, et le réglage de l'utilisateur la met à l'échelle. Cela suit délibérément
la partie utile du modèle de Tailwind : des paliers nommés de typographie, d'espacement et de taille plutôt que des constantes en points sans lien entre elles.

Laissez les conteneurs de texte croître avec leur texte : donnez-leur des hauteurs minimales et du padding plutôt que des hauteurs fixes. Un composant
personnalisé qui combine du texte mis à l'échelle avec une géométrie fixe autour doit documenter pourquoi cette partie ne doit pas croître.

Considérez chaque valeur en points arbitraire et chaque constructeur de couleur brute dans l'interface de l'application comme un constat de revue. Ne l'acceptez que pour une
frontière physique ou de plateforme documentée, une géométrie mesurée à l'exécution, une couleur raster ou de données, ou la définition du thème
elle-même. La commodité et la correspondance avec une capture d'écran ne sont pas des exceptions valables.

Tout ce qui est mis en cache à partir de la mise en page résolue doit inclure l'échelle de police dans sa clé d'invalidation, directement ou via une
révision qui change avec elle : les hauteurs de lignes communiquées à une liste, les mesures de texte, la géométrie des popups, les tailles d'icônes dérivées
du texte et les métriques de canvas personnalisées.
<a id="events-commands-and-focus"></a>

## Événements, commandes et focus

Utilisez les appuis pour l'activation : `onPress`, `onLongPress`, `onPressDown` et `onPressUp` signifient la même chose avec un doigt, un stylet,
une souris ou le clavier. N'utilisez les gestionnaires tactiles et les gestes que pour ce qui suit le doigt (un panoramique, un glisser). Utilisez
les raccourcis clavier (`keymap.bind`, `on_key`) et les éléments de menu pour les commandes qui doivent prendre en charge des raccourcis, des menus ou
une distribution depuis plusieurs entrées. Gardez les gestionnaires proches de la page qui possède la commande.

Modélisez une commande logique une seule fois. Un `Button`, un élément `Menu`, un élément `ContextMenu`, un élément de menu d'application de
`nsh/desktop` et un raccourci clavier doivent appeler la même fonction du store au lieu de copier cinq mutations.
Dérivez leur libellé, leur icône, leur raccourci et leur état désactivé d'une seule politique de commande lorsque c'est possible (`key_label("mod+s")`
écrit un raccourci à la manière de la plateforme), afin que les points d'entrée ne puissent pas diverger. Le menu gère la navigation et la fermeture ; la
page décide toujours si la commande est autorisée et ce qu'elle fait.

```rust tabs
on_key("mod+s", move |_| save());
view()
    .child(button().on_press(save).child(text("Save")))
    .child(
        menu()
            .trigger(view().px_3().py_2().child(text("File")))
            .child(menu_item().on_select(save).child(text(format!("Save  {}", key_label("mod+s"))))),
    )
```

```tsx tabs
keymap.bind("mod+s", save);

<View>
  <Button onPress={save}><Text>Save</Text></Button>
  <Menu trigger={<View class="px-3 py-2"><Text>File</Text></View>}>
    <MenuItem onSelect={save}><Text>Save  {keymap.label("mod+s")}</Text></MenuItem>
  </Menu>
</View>
```

Préservez les rôles sémantiques dans le choix de l'élément. Utilisez `Button` pour les commandes, même lorsque le rendu souhaité est discret ;
donnez-lui un style discret au lieu de le remplacer par un lien. Les applications NSH réservent le rôle `link` aux cibles ouvertes en dehors de
l'application, comme une URL ou une adresse e-mail ; utilisez la navigation pour une destination dans l'application et `Button` pour une commande.

N'arrêtez la propagation (`stopPropagation()` sur un événement tactile) que lorsqu'une interaction imbriquée doit empêcher son parent de
traiter le même toucher. Les arrêts de propagation systématiques cassent le défilement, les appuis et les gestes d'une manière difficile
à diagnostiquer.

**Le thread principal n'attend jamais le code de l'application.** Lorsque le système a besoin d'une réponse immédiate (cette page peut-elle être dépilée, cette
feuille ou ce popover peut-il se fermer, ce texte peut-il changer), NSH répond nativement à partir de props montées au préalable, puis un événement
informe l'application après coup. Une décision est donc une prop, définie dès qu'elle est connue, et non un callback qui renvoie true ou false :
`popOnBack={!dirty()}` avec `onBackPress` pour confirmer ([popOnBack](./navigation.md#keeping-the-user-on-a-page-poponback)),
`closeOnEscape` et `closeOnBackdropPress` avec `onCancel` pour être informé de la tentative, `maxLength` sur un champ de saisie, `disabled` sur
un bouton.

Le `shortcut` (`nsh/desktop`) d'un élément de menu lie sa touche tant que le menu est défini, et le menu l'affiche selon le
style de la plateforme ; une liaison `keymap` de la même combinaison de touches a priorité. Donnez à chaque combinaison de touches un seul propriétaire, et redéfinissez le menu
de l'application lorsque ses éléments ou ses raccourcis changent.

Rendez explicite la propriété du focus :

- `Button`, `Switch` et les éléments de menu sont des arrêts de focus clavier sur les bureaux et le web ; construisez les contrôles à partir d'eux plutôt
  qu'à partir de vues brutes ;
- déplacez le focus avec le `focus()` d'une ref depuis un événement ou un effet qui suit un changement d'état, et déplacez celui du lecteur
  d'écran avec `set_accessibility_focus()` (Rust) ou `setAccessibilityFocus` depuis `nsh` (TSX) ;
- affichez un état `focus:` visible ;
- ne demandez pas le focus de façon inconditionnelle pendant le rendu.

Les widgets composites doivent implémenter le modèle de navigation complet (déplacement avec les flèches, Home / End ou déplacement par page lorsque
c'est pertinent, confirmation, annulation et comportement de Tab) plutôt que quelques raccourcis isolés.

Les overlays se ferment par le haut : Échap et le bouton retour d'Android vont à l'overlay supérieur qui écoute (`onCancel`).
Gérez les séquences rapides de fermeture et d'ouverture sans agir sur une surface intermédiaire déjà en cours de fermeture.

<a id="async-work-and-side-effects"></a>

## Travail asynchrone et effets de bord

Démarrez le travail asynchrone depuis un événement, un effet ou un [`resource`](./reactivity.md#resource), et non comme un effet de bord
inconditionnel du corps d'un composant. Un effet ne suit que ce qu'il lit de façon synchrone : lisez d'abord les signaux, puis démarrez
le travail. Lorsque le travail se termine, mettez à jour l'état via des signaux, acceptez que le composant puisse avoir disparu et écrivez
ensemble les changements cohérents.

Gardez le travail récurrent sous un propriétaire afin que sa disparition l'annule : les tâches et minuteurs Rust se terminent avec leur propriétaire, les minuteurs TSX
s'arrêtent dans `cleanup`. Une tâche ponctuelle qui doit se terminer indépendamment peut être démarrée depuis le store, mais elle renonce à cette
annulation. Gérez explicitement les erreurs et les requêtes échouées.

Représentez les opérations asynchrones par des états explicites : le `state()` d'une ressource est `unresolved`, `pending`, `ready`,
`refreshing` ou `errored`. Préservez les données précédentes utilisables pendant l'actualisation : une ressource conserve sa valeur pendant
qu'elle se recharge. Empêchez les soumissions destructives en double et affichez les erreurs récupérables dans l'interface ; ne comptez pas sur les journaux comme retour
à l'utilisateur.

```rust tabs
let results = resource(
    move || {
        let q = query.get();
        (!q.is_empty()).then_some(q)
    },
    |q, _info| async move {
        let response = fetch(format!("https://api.example.com/search?q={q}")).await?;
        if !response.ok() {
            return Err(format!("HTTP {}", response.status()));
        }
        Ok(response.text())
    },
);
```

```tsx tabs
const results = resource(
  () => query() || undefined,
  async (q, { signal }) => {
    const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(q)}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as SearchHit[];
  },
);
```

Sortez l'analyse ou le calcul coûteux des gestionnaires TSX : placez-les dans un `computed`, hors du chemin d'interaction, ou en Rust.
Les résultats peuvent arriver après que la requête, la page ou la sélection a changé : une ressource abandonne les chargements obsolètes, et votre propre
travail y associe une révision ou une identité et rejette les résultats périmés plutôt que de les appliquer au nouvel état.

<a id="layout-measurement-and-scrolling"></a>

## Mise en page, mesure et défilement

Une vue dispose ses enfants en colonne, et les enfants s'étirent par défaut sur toute la largeur ; `class="flex"` (`.flex_row()`)
est une ligne, comme en CSS. Une ligne de contrôles veut ses enfants centrés (`items-center`), ce qui l'exprime clairement. Une ligne
de colonnes pleine hauteur conserve l'étirement par défaut, de sorte qu'une colonne remplit la hauteur de la ligne et que son en-tête reste en haut :

```rust tabs
view()
    .flex_row()
    .flex_1()
    .child(sidebar())
    .child(content())
```

```tsx tabs
<View class="flex flex-1">
  <Sidebar />
  <Content />
</View>
```

La plupart des interfaces doivent s'appuyer sur la mise en page plutôt que de mesurer elles-mêmes ([Mise en page](./layout.md)). La mesure (`onLayout`, `measure()`)
est un outil de comportement avancé pour les overlays, la virtualisation, les éditeurs, les graphiques et les composants similaires dont la justesse dépend
de la géométrie résolue.

- Placez la mesure et la géométrie dans la couche qui possède le comportement.
- N'observez la mise en page que lorsque la mise en page ordinaire ne peut pas exprimer la relation.
- N'écrivez jamais d'état d'application sans rapport à chaque événement de mise en page.
- Traitez les données mesurées comme limitées à une révision ; elles peuvent devenir périmées après un changement de taille de texte, de largeur, de thème ou de contenu.
- Laissez les overlays de `nsh/base` placer les popups : leur placement, leur retournement et leurs marges de zone sûre suivent une seule politique.

Pour les invariants d'alignement, préférez la construction à la correction : les régions sœurs doivent consommer le même jeton d'espacement
ou la même marge intérieure partagée au lieu de répéter des littéraux égaux. Ajoutez des vérifications de géométrie ou des captures d'écran sur une vraie plateforme
(`nsh test --target`) pour les bords, colonnes et espacements répétés critiques. Testez plus que la fenêtre par défaut : une grande
taille de texte et une mise à l'échelle de l'affichage peuvent transformer des coordonnées fractionnaires en une dérive d'un pixel, même lorsque la capture d'écran par défaut
semble alignée.

Mesurez le résultat résolu lors de la revue de précision, mais n'encodez pas une correction mesurée sous forme de valeur arbitraire.
Remontez de l'écart jusqu'au remplissage dupliqué, aux marges intérieures imbriquées, à la propriété des bordures, aux métriques de police ou à l'arrondi, puis corrigez
le propriétaire structurel.

Chaque région défilante doit avoir un seul propriétaire. Évitez le défilement imbriqué accidentel sur le même axe. Donnez au scroll view
l'élément qui possède la page, le panneau ou la liste entiers, afin que son indicateur se résolve par rapport au bord de la région, et placez la marge intérieure
du contenu à l'intérieur (`contentClass` / `contentStyle`) plutôt que d'envelopper le scroll view dans un conteneur avec remplissage. Un
indicateur flottant entre le contenu et la limite de la page révèle généralement un mauvais propriétaire du défilement ou un remplissage sur la mauvaise couche. Restez à l'écart de la zone sûre et du clavier avec `env(safe-area-inset-*)` et `env(keyboard-inset-height)` dans
le remplissage et la marge (lisez les valeurs avec leurs accesseurs), qui suivent nativement la rotation et le clavier.

<a id="lists-tables-and-large-data"></a>

## Listes, tableaux et grands volumes de données

Utilisez [`List`](./lists.md) (`virtual_list` en Rust) lorsque les données peuvent dépasser une petite collection bornée. Séparez l'identité d'une ligne de sa position visible et évitez de copier l'ensemble des données à chaque mise à jour. Laissez la liste gérer
le recyclage, la coordination du défilement et la plage visible, tandis que les fonctions de ligne gèrent la présentation des lignes.

Séparez :

- les données sources et les identifiants du domaine ;
- l'état de filtrage et de tri ;
- l'état de sélection ;
- l'état de défilement ;
- le rendu des lignes.

Cela garde les mises à jour locales et évite que l'arbre de vues devienne le modèle de données.

La virtualisation est un contrat de comportement, pas seulement un interrupteur de performance. Une fonction de ligne s'exécute une fois par cellule, et les cellules
sont réutilisées pour d'autres lignes :

- **doit conserver l'état par élément dans des données indexées par id**, et non dans un signal créé à l'intérieur de la ligne, qui voyage avec la
  cellule vers l'élément suivant ;
- **doit lire l'élément là où il est utilisé**, dans les bindings : une valeur copiée en haut de la fonction de ligne appartient à la
  première ligne que la cellule a affichée ;
- mettez à jour de façon immuable en TSX (un nouveau tableau, les éléments inchangés réutilisés, un élément modifié devient un nouvel objet), et donnez une
  `estimatedItemSize` proche de la ligne typique ;
- le défilement vers un élément (`scrollToIndex`) fonctionne en coordonnées de données, même lorsque la plupart des lignes n'existent pas.

```rust tabs
let liked = signal(HashSet::<u32>::new());

virtual_list(move || posts.with(Vec::len), move |at| {
    let post = computed(move || posts.with(|p| p[at.index()].clone()));
    view()
        .flex_row()
        .p_4()
        .child(text(move || post.with(|p| p.title.clone())).flex_1())
        .child(
            text(move || if liked.with(|s| s.contains(&post.with(|p| p.id))) { "♥" } else { "♡" })
                .on_press(move || toggle(post.with(|p| p.id))),
        )
})
.estimated_item_size(px(64.0))
```

```tsx tabs
const liked = signal<Set<number>>(new Set());

<List each={posts()} estimatedItemSize={64} class="flex-1">
  {(post) => (
    <View class="flex-row p-4">
      <Text class="flex-1">{post().title}</Text>
      <Text onPress={() => toggle(post().id)}>{liked().has(post().id) ? "♥" : "♡"}</Text>
    </View>
  )}
</List>
```

<a id="public-api-design"></a>

## Conception de l'API publique

Pour les composants réutilisables :

- les props établissent des valeurs par défaut valides : `#[prop(default)]` ou `#[prop(default = …)]` en Rust, `??` à l'endroit où la prop est lue
  en TSX ;
- chaque prop, événement et export a un commentaire de documentation ; en Rust, il devient la déclaration TypeScript que voit TSX ;
- les callbacks décrivent les changements demandés et n'incluent des détails du pointeur que lorsqu'ils sont significatifs ;
- les parties explicites, les slots et les fonctions de rendu sont préférables à l'inspection de descendants arbitraires ;
- l'ajout d'un comportement réutilisable ne doit pas imposer un choix visuel au niveau du produit.

Les applications sont livrées aux applications hôtes sous forme de paquets signés et peuvent ne jamais être recompilées : chaque version ultérieure de NSH les exécute
telles quelles. Appliquez la même discipline à ce qu'une application ou une bibliothèque de composants expose aux autres (les props
et événements de ses composants, les exports de son crate, les fonctions que reçoivent les composants et modules natifs d'une application hôte) :

- les entrées ne gagnent que des membres optionnels ; les types ne font que s'élargir ; les valeurs par défaut et le comportement restent (tout nouveau comportement est optionnel) ;
- une fonction dont les paramètres peuvent s'étendre reçoit ses options sous forme d'un seul objet (`scrollTo({ x, y, animated })`), jamais
  un paramètre positionnel supplémentaire ; les paramètres qui ne grandiront jamais, comme le début et la fin d'une plage, restent positionnels ;
- un mode est une union de chaînes, qui peut gagner des valeurs, plutôt qu'un booléen qui aurait plus tard besoin d'un troisième état ;
- une valeur a un seul type : `version: string`, jamais `string | number` ;
- ce qu'une fonction renvoie est un objet, qui peut gagner un champ, plutôt qu'un tuple ou une valeur brute ;
- une fonction qui renvoie une Promise signale chaque échec en la rejetant, et un échec que l'appelant peut gérer porte un
  `code`, comme ceux de NSH : les appelants se branchent sur les codes, tandis que les messages sont destinés aux humains et peuvent changer ;
- un renommage conserve l'ancien nom comme alias `@deprecated` de la même implémentation.

En Rust, les champs privés sont le choix par défaut pour l'état comportemental qui doit évoluer sans casser les appelants. Les champs publics
conviennent à la configuration délibérément de type enregistrement et aux données sérialisées. Chaque struct publique avec des champs publics
doit porter `#[non_exhaustive]` et implémenter `Default`, afin que les appelants puissent créer des valeurs sans littéraux de struct exhaustifs
et qu'un champ puisse être ajouté sans les casser.

Gardez les chemins d'import publics stables pendant la réorganisation des éléments internes : le spécificateur `#[native_module]` d'un crate et ses exports,
ainsi que les exports d'un module TSX, sont ce que le reste du code importe. Préférez la terminologie des contrôles de la plateforme et le vocabulaire établi de NSH
au vocabulaire des frameworks web.
<a id="platform-and-capability-boundaries"></a>

## Limites des plateformes et des capacités

Ne supposez pas que toutes les plateformes offrent les mêmes fonctionnalités. Les barres de titre et les contrôles de fenêtre, l'accessibilité, le presse-papiers, le retour haptique, la physique de défilement, les polices et le timing peuvent différer. Un même bundle s'exécute partout ([Code spécifique à une plateforme](./platform-specific.md)) : placez le code spécifique à une plateforme là où NSH lui donne une place, et définissez le comportement de repli :

- ce qu'un élément signifie sur toutes les plateformes est une prop de premier niveau ; une fonctionnalité système propre à une plateforme se place dans `ios={{…}}`, `android={{…}}`, `desktop={{…}}` ou `web={{…}}` (une méthode de builder en Rust), pour chacune des plateformes qui la proposent, et seul l'objet de la plateforme courante est appliqué ;
- les API des plateformes mobiles viennent de `nsh/mobile`, celles des ordinateurs de bureau de `nsh/desktop` ;
- les styles par plateforme sont des classes `ios:`, `android:` et `web:`.

Une branche propre à une plateforme doit préserver le contrat sémantique même si la présentation diffère. Par exemple, une boîte de dialogue est une feuille sur iOS et une couche au-dessus de la fenêtre sur les ordinateurs de bureau, mais l'app a toujours besoin d'un état d'ouverture cohérent. Testez le comportement partagé en headless, et la partie propre à la plateforme avec `nsh test --target`. Donnez à chaque branche sur une valeur que NSH rapporte (`platform.os`, un état, une raison) un `default` : les versions ultérieures ajoutent des plateformes et des cas, et une app livrée aujourd'hui s'exécute sur ceux-ci ([Compatibilité](./compatibility.md)).

Une app déclare ce qu'elle atteint en dehors de sa VM dans `nsh.json` `"capabilities"` : les hôtes depuis lesquels elle effectue des requêtes, les pages qu'affiche une web view, le presse-papiers, la barre d'état ([Sandbox et capacités](./sandbox-and-capabilities.md)). Une app destinée à être livrée dans d'autres apps liste exactement ce qu'elle utilise, et traite une requête refusée comme une requête échouée : une app hôte peut accorder moins que ce que l'app déclare. Un appel refusé échoue avec `code` `"ERR_ACCESS_DENIED"`, dont `permission` nomme la capacité et `resource` ce qui a été demandé.

<a id="file-and-naming-conventions"></a>

## Conventions de fichiers et de nommage

- Nommez les pages et les composants d'après des concepts du produit : `ProjectList`, `ProjectEditor`, `SettingsPage`.
- Nommez les gestionnaires d'événements d'après l'intention : `confirmDelete`, `openProject`, `onQueryChange`.
- Gardez une seule responsabilité principale par module ; scindez un fichier lorsque la propriété de l'état ou le cycle de vie ne peut plus être compris sans lire un comportement sans rapport.
- Gardez ensemble le module d'un composant, ses props, ses événements et ses tests ciblés lorsqu'ils changent ensemble.
- Documentez les invariants et les contraintes de cycle de vie surprenantes ; ne commentez pas les appels évidents au builder.
- Utilisez `rustfmt` et respectez Clippy en Rust, et `nsh check` en TSX. Évitez les attributs `allow` trop larges qui masquent des avertissements sans rapport.

<a id="vocabulary-is-part-of-the-api"></a>

### Le vocabulaire fait partie de l'API

Utilisez le même mot pour le même concept dans tous les composants. Avant de nommer une prop ou un événement, cherchez le terme dans l'API de NSH elle-même, puis dans `gpui-base` de GPUI Kit, dans GPUI et dans `gpui-component`, puis dans les contrôles des plateformes. Ce qu'affiche une primitive et les API globales tirent leurs noms de HTML, du DOM et de CSS (`src`, `html`, `placeholder`). Les noms Rust sont en `snake_case` et se traduisent en `camelCase` en TSX (`on_open_change` devient `onOpenChange`) ; un mot reste un seul mot (`readonly`, `multiline`).

| Concept | Modèle de nommage | Exemple |
| --- | --- | --- |
| Un composant | Un nom, `PascalCase` | `Button`, `Dialog`, `QuantityStepper` |
| Ses props et ses événements (Rust) | `<Component>Props`, `<Component>Event` | `ButtonProps`, `ButtonEvent::Press` → `onPress` |
| L'objet d'état d'un comportement | `<Control>State`, créé par `create<Control>` | `NavStackState`, `createNavStack` |
| Pourquoi une valeur a changé | `<Control>ChangeReason`, une union de chaînes | `DialogChangeReason` : `"cancel"`, `"backdropPress"` |
| Un état | Un adjectif, positif, sans préfixe `is` | `open`, `hidden`, `disabled`, `selected`, `checked`, `readonly` |
| Ce que l'utilisateur peut faire | L'adjectif | `scrollable`, `zoomable`, `selectable`, `resizable` |
| Une fonctionnalité sans adjectif | `<feature>Enabled` | `pagingEnabled` |
| Si une partie s'affiche | Un booléen nommé d'après la partie, par défaut `true` | `scrollbar`, `caret` (`scrollbar={false}`) |
| Si un slot s'affiche | `<slot>Visible`, par défaut `true` | `headerVisible` (`header` est le slot d'une page) |
| Les styles d'une partie | `<part>Class`, `<part>Style` | `backdropClass`, `contentStyle` |
| Les styles d'un état | Classes `<state>Style`, `<state>:` | `activeStyle`, `disabled:` |
| Un slot | Ce qu'il est | `header`, `footer`, `trigger`, `content`, `empty` |
| Contenu de l'app | `render<Part>` | `renderCodeBlock` |
| Un indicateur de fermeture | `closeOn<Trigger>`, par défaut `true` | `closeOnEscape`, `closeOnBackdropPress` |
| Le changement d'une valeur | `on<Value>Change({ <value>, ... })`, un seul objet | `onChange({ value })`, `onOpenChange({ open, reason })` |
| Tout autre événement | `on<Event>`, au présent, un seul objet | `onPress()`, `onSubmit({ text })` |
| Une phase | `<act>Start`, `<act>End` | `onPanStart`, `onLoadStart` |
| La souris sur une vue | `Enter` / `Move` / `Leave`, ceux du DOM | `onMouseEnter`, `onMouseMove`, `onMouseLeave` |
| Commencer à écouter | `on(event, listener)`, renvoie `() => void` | `host.on(name, l)`, `BackHandler.on("press", l)` |
| Une valeur de l'environnement | Un accesseur, `set<Value>` à côté | `colorScheme()`, `setColorScheme` |
| Un booléen en lecture seule | `is<Adjective>`, `has<Noun>` | `isAvailable` |

Les props ne sont jamais `is<Adjective>` : cette forme est réservée à ce qui ne fait que lire un booléen (une constante, un champ d'une charge utile). Une partie qui s'affiche est nommée d'après la partie, jamais `<part>Shown`, `<part>Hidden` ni `shows<Part>`.

Un builder Rust prend et renvoie `Self` et porte le nom de la prop qu'il définit, sans `set_` (`.disabled(..)`, `.checked(..)`, `.on_change(..)`) ; la mutation sur place se fait avec `set_<field>` (`setRoutes`, `setColorScheme`). Un lecteur booléen est soit `has<Noun>`, lorsque la valeur contient quelque chose, soit `is<Adjective>`, lorsqu'il décrit un état ou une permission. Privilégiez l'adjectif chaque fois que l'action en a un : `isClosable` plutôt que `canClose`, `isZoomable` plutôt que `canZoom`. Lorsque l'action est une locution verbale sans forme adjectivale, nommez plutôt ce dont elle a besoin : `hasDefinition`, et non `canGoToDefinition`. N'ajoutez pas de nouveaux lecteurs `can`.

<a id="let-the-enclosing-name-carry-the-context"></a>

### Laissez le nom englobant porter le contexte

Un nom est lu à l'intérieur de quelque chose : une prop à l'intérieur de son composant, un champ à l'intérieur de son type. Ni l'un ni l'autre ne répète ce qui les englobe (`contentStyle`, et non `contentContainerStyle` ; `backdropClass` de `Dialog`, et non `dialogBackdropClass`). Gardez les champs d'un même type au même niveau d'abréviation.

<a id="use-precise-domain-words"></a>

### Utilisez des mots de domaine précis

- **selected** désigne l'appartenance ou l'élément courant ; **checked** et **pressed** sont la valeur d'une case à cocher ou d'un bouton à bascule ; **focused** est la cible du clavier ; **hovered** est la présence du pointeur. Ne les utilisez jamais de manière interchangeable.
- **open / close** est l'état d'une superposition ; **show / hide** une demande transitoire ; **expand / collapse** la structure.
- **disabled** bloque l'interaction ; **readonly** permet de sélectionner et de naviguer mais pas de modifier ; **loading** empêche le travail en double pendant qu'une opération s'exécute.
- **press** est l'activation par n'importe quelle entrée, et les événements de NSH disent press (`onPress`) ; **click** est celui d'une souris.
- **index** est une position ; **id** est une identité. Ne persistez pas et n'indexez pas par position des données réordonnables.
- **value** est une donnée de domaine contrôlée ; **state** est un comportement retenu.
- **src** est la ressource qu'un élément affiche (une image, une vidéo, une page) ; toute autre adresse est une **url**.
- **role** dit ce que signifie un choix (`"cancel"`, `"destructive"`) ; l'apparence relève de l'app.

Évitez les noms vagues tels que `data`, `item2`, `handleAction`, `updateUi`, `process`, `manager` ou `config` lorsqu'un terme de domaine plus précis existe.

<a id="type-and-module-style"></a>

### Style des types et des modules

- Les types Rust sont en `UpperCamelCase` ; les modules, fonctions, méthodes, champs et variables locales en `snake_case` ; les constantes en `SCREAMING_SNAKE_CASE`. Nommez les bindings de contexte `cx`.
- Les composants TSX et leurs balises sont en `PascalCase` ; les props, fonctions et variables locales en `camelCase`. Les primitives viennent de `nsh`, les composants de base de `nsh/base`.
- Un module nommé d'après un composant possède sa jonction publique ; scindez son état, ses parties et ses tests en fichiers sans changer ce que les autres importent.
- Utilisez des noms de modules au singulier pour un seul concept de composant et des noms établis pour les familles (`menu` pour `Menu`, `MenuItem` et `Submenu`).
- Suffixez les identifiants avec `Id`, et les collections avec des pluriels significatifs. N'alternez pas `idx`, `index` et `ix` dans un même sous-système.
- Nommez les prédicats de façon positive lorsque c'est possible. Un état positif se compose plus facilement que plusieurs négations, mais conservez les termes établis tels que `disabled` lorsqu'ils correspondent à la sémantique du contrôle.

<a id="callback-and-event-wording"></a>

### Formulation des callbacks et des événements

- Chaque événement transmet un seul objet, même avec un seul champ et aussi pour le changement d'une valeur, ses champs portant le nom des props qu'ils rapportent : `onChange({ value })`, `onOpenChange({ open, reason })`, `onLinkPress({ url })`. Un champ ultérieur est alors un ajout. Un type de données de l'API est un champ, jamais la charge utile elle-même (`onImagePress({ image })`) ; un événement qui n'a rien à rapporter ne transmet rien.
- Nommez l'acte, et non le passé ou une demande : `onPress`, `onClose`, `onCancel`, `onBackPress`.
- Nommez l'intention plutôt que la géométrie lorsque l'acte a un nom : `onLoadMore`, et non « la fin a été atteinte ».
- Les paires de cycle de vie sont `onOpen` / `onClose` ; les phases sont `Start` / `End`, jamais `Begin` ; la souris sur une vue est `onMouseEnter` / `onMouseMove` / `onMouseLeave` (les noms du DOM), un fichier glissé dessus `Enter` / `Leave`.
- Documentez si un callback s'exécute avant ou après le changement d'état propre au composant, et s'il peut rappeler le composant de manière réentrante.

<a id="documentation-and-copy-style"></a>

### Style de la documentation et des textes

La documentation publique doit commencer par ce que fait un composant et par qui possède son état. Les exemples doivent utiliser les API actuelles et montrer des ids stables. Documentez les valeurs par défaut, les différences entre plateformes, le comportement du focus, l'ordre des callbacks, et les props que le thread principal lit nativement.

Suivez les règles de langage d'interface des Design Guides pour les libellés, les commandes, les boîtes de dialogue de confirmation, les majuscules et les points de suspension. Conservez un terme canonique pour chaque objet de domaine, commande et état.

Les clés de traduction décrivent une intention stable (`dialog.deleteProject.title`), et non une phrase de la langue source ni une coordonnée d'écran. N'assemblez jamais une phrase à partir de fragments traduits et ne réutilisez pas une clé pour des sens qui se trouvent partager le même texte anglais.

Localisez l'intention, pas la syntaxe. Donnez à chaque locale le contrôle de l'ordre des mots, des pluriels, de la ponctuation et de la quantité de contexte dont elle a besoin. Les tests doivent détecter les clés manquantes et les termes fixes incohérents ; la relecture humaine décide encore si une répétition se justifie par le contexte. Vérifiez chaque chaîne dans son composant avec un contenu réaliste, une expansion du texte et une grande taille de texte.

<a id="testing-strategy"></a>

## Stratégie de test

Testez à la couche la plus basse capable de prouver le comportement ([Tests](./testing-and-trace.md)) :

1. des tests purs pour les transitions d'état, le formatage, l'analyse et l'ordonnancement (`cargo test` des fonctions d'un crate, un fichier de test des fonctions du store) ;
2. des tests d'app headless pour les composants, les événements et les durées de vie : le vrai moteur, le moteur de rendu, la mise en page et les listes, avec des frames d'affichage à 60 Hz, dans `nsh test` (`nsh/test`) ou `cargo test` (`nsh_testing::Headless`) ;
3. des tests d'interaction pour le focus, le clavier, le pointeur, la mise en page et l'état rendu, avec les étapes qu'effectue un utilisateur (`press`, `type`, `scroll`, `drag`, `keyboard.press`), en headless et sur une vraie plateforme (`nsh test --target macos`, `ios`, `android`, `web`, ...) ;
4. des tests de fumée d'exemples ou d'apps pour les workflows complets, et `nsh test --trace` pour ce que coûte une interaction.

```rust tabs
#[test]
fn a_tap_counts() {
    let mut app = Headless::start(EngineConfig::new(Root::of::<my_app::App>())).unwrap();
    app.wait_for("Count: 0").unwrap();
    app.press("Tap").unwrap();
    app.wait_for("Count: 1").unwrap();
}
```

```tsx tabs
import { expect, open, test } from "nsh/test";

test("a tap counts", async () => {
  const app = await open("./App.tsx");
  await app.press("role:button[Tap]");
  expect(app.texts()).toContain("Count: 1");
});
```

Pour un composant interactif, couvrez le contrat sémantique plutôt que ses détails d'implémentation : activation par pression et au clavier, changements de valeur contrôlés, comportement désactivé, déplacement du focus, nombre et ordre des événements, identité stable, et états vides ou d'échec importants. Simulez le réseau (routes `network`) et contrôlez le temps (une horloge manuelle) plutôt que d'attendre les vrais. Ajoutez un test de régression avant de corriger un bug chaque fois que l'échec peut être reproduit de façon déterministe.

Trouvez les vues comme le fait un utilisateur : par rôle et nom, libellé ou texte (`role:button[Save]`, `label:Close`), et par un `testID` stable lorsque rien d'autre ne les nomme. Les sélecteurs sont relus à chaque étape, de sorte qu'une étape n'agit jamais sur un instantané périmé. Utilisez des captures d'écran (`app.screenshot`, sur une vraie plateforme) pour les faits visuels que les sélecteurs ne peuvent pas exprimer ; n'utilisez les coordonnées qu'en dernier recours. Rapportez séparément les preuves automatisées et manuelles.

<a id="performance-rules"></a>

## Règles de performance

- N'écrivez pas d'état de manière inconditionnelle depuis un binding ou un effet qui le lit.
- Évitez de créer des signals, des effets, des raccourcis clavier et des structures de données coûteuses à l'intérieur des bindings ou des fonctions de ligne.
- Lisez les signals dans les bindings, afin qu'un changement cohérent mette à jour la plus petite partie de l'arbre.
- Utilisez `List` pour les longues collections et ne rendez que la plage visible.
- Évitez de cloner de grandes chaînes ou collections uniquement pour satisfaire une closure ; capturez des handles `Copy` ou des données partagées (`SharedString`, `Rc`).
- Gardez les gestionnaires et les valeurs calculées TSX légers ; déplacez le travail lourd hors du chemin d'interaction ou vers Rust.
- Mesurez avec `nsh test --trace` avant d'ajouter des caches. Un cache doit avoir un responsable clair de l'invalidation.
- Gardez le travail d'animation borné : des valeurs animées sur le thread d'UI plutôt que des signals écrits à chaque frame, `scrollValue` plutôt qu'un écouteur de défilement ([Animation](./animation.md)), et respectez la réduction des animations (`reduceMotion()`).
<a id="common-failure-modes"></a>

## Modes d'échec courants

Évitez ces schémas :

- un seul signal contenant l'état sans rapport de l'application ;
- une logique métier et des requêtes réseau intégrées dans le corps d'un long composant ;
- des clés aléatoires ou basées sur l'index pour du contenu réordonnable ;
- un état par ligne dans des signaux créés à l'intérieur d'une ligne `List` ;
- la lecture d'une prop ou d'un signal dans le corps d'un composant en s'attendant à ce qu'elle se mette à jour ;
- des couleurs et des rayons littéraux qui cassent les thèmes personnalisés et le mode sombre ;
- des vues pressables personnalisées là où un composant sémantique fournit déjà le focus, le clavier, l'état désactivé et
  le comportement d'accessibilité ;
- un état local dupliqué qui dérive par rapport à une valeur contrôlée ;
- des effets qui copient un signal dans un autre, et des écritures qui bouclent via un binding ;
- une décision dont le système a besoin immédiatement laissée à un callback, au lieu d'une prop définie au préalable ;
- des vues de défilement imbriquées sans propriétaire explicite ;
- une nouvelle variante de composant pour un écran ponctuel ;
- des boîtes de dialogue de confirmation pour des actions réversibles et à faible risque ;
- des tests qui appellent des fonctions internes mais n'appuient, ne saisissent ni ne font jamais défiler.

<a id="rules-for-coding-agents"></a>

## Règles pour les agents de code

Avant de modifier du code, un agent doit lire l'implémentation la plus proche, ses tests, les exports publics du module et la
page de référence pertinente. Il doit rechercher les signatures dans le code source actuel et `.nsh/types` au lieu de traduire un
exemple React, React Native, CSS ou GPUI par analogie : les composants NSH s'exécutent une seule fois, et les bindings suivent les signaux qu'ils
lisent.

Pour chaque modification, l'agent doit être capable d'indiquer :

1. le propriétaire du comportement et le propriétaire de la présentation ;
2. l'identité conservée et le cycle de vie de l'état ;
3. le contrat d'appui, de clavier, de focus et d'accessibilité ;
4. le propriétaire de la mise en page et du défilement ;
5. les tokens de thème et les exceptions intentionnelles ;
6. le test qui échouerait en cas de régression du comportement.

Le code généré doit être relu et testé par une personne. « Ça compile » n'est pas un critère de qualité pour une interface, et une refonte étendue qui
ne fait que rendre le code généré plus propre ne remplace pas le respect de l'architecture de l'application.

<a id="implementation-checklist"></a>

## Liste de vérification de l'implémentation

Avant d'ouvrir une modification pour relecture, vérifiez que :

- la propriété de l'état et des effets de bord est explicite ;
- le choix entre une fonction simple et un composant est fait délibérément, et les props et les signaux sont lus là où ils sont utilisés ;
- les éléments répétés ont des clés et des identifiants de test stables, fondés sur le domaine ;
- les tokens de thème et l'échelle Tailwind remplacent les littéraux visuels isolés ;
- les appuis, les raccourcis clavier, le focus, l'état désactivé et les overlays fonctionnent ensemble ;
- les décisions dont le système a besoin immédiatement sont des props, définies au préalable ;
- les chemins de chargement, d'état vide, d'erreur et d'annulation sont représentés ;
- les grands jeux de données utilisent `List`, avec l'état par élément conservé dans les données ;
- les ajouts à l'API publique ne font qu'élargir celle-ci, et préservent le sens des dépendances et l'encapsulation ;
- les tests prouvent le comportement au niveau approprié, en mode headless et sur les plateformes concernées par la modification ;
- le formatage, Clippy, `nsh check`, les tests ciblés et les exemples pertinents passent.

Consultez [Premiers pas](./getting-started.md) pour la configuration de l'application, ainsi que les références [Elements](../elements/index.md) et
[API](../modules/index.md) pour les détails actuels de l'API.
