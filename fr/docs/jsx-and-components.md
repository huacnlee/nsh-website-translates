---
title: "JSX et composants"
description: "Comment NSH décrit l'interface utilisateur en Rust et en TSX : éléments, composants, props, enfants, flux de contrôle, refs et spreads, et comment le compilateur JSX et les builders de Rust produisent les mêmes éléments natifs."
order: 30
group: ui
demo: guide-components
source_hash: fd68c16e30d24adc
---

# JSX et composants

Les applications NSH décrivent leur UI avec des éléments et des composants, en Rust ou en TSX. Rust construit les éléments avec des fonctions et des méthodes de builder typées (`view().gap_4().child(..)`) ; TSX les écrit en JSX, que le compilateur de NSH transforme en appels directs du même moteur de rendu natif, sans React ni DOM virtuel. Dans les deux cas, un composant est une fonction qui s'exécute une seule fois pour construire sa partie de l'arbre. Ce qui maintient ensuite l'UI à jour, c'est la [réactivité](./reactivity.md) : les liaisons qui lisent des signaux sont suivies nativement, et seules elles s'exécutent à nouveau.

<a id="elements"></a>

## Éléments

Les **éléments hôtes** sont chacun adossés à une vue native. Rust les crée avec les fonctions du prelude ; TSX les importe depuis `nsh` comme des composants, et seuls `If` et `Each` sont des globaux qui n'ont pas besoin d'import :

| Rust | TSX | Vue native | Page |
|---|---|---|---|
| `view()` | `<View>` | `UIView` / `ViewGroup` : une boîte pour la mise en page, le style et les interactions tactiles | [View](../elements/view.md) |
| `text(..)` | `<Text>` | Une vue de texte native ; les éléments de texte imbriqués sont des spans | [Text](../elements/text.md) |
| `image(src)` | `<Image>` | Une vue d'image (ressources locales et URL) | [Image](../elements/image.md) |
| `scroll()` | `<Scroll>` | `UIScrollView` / `ScrollView` | [Scroll](../elements/scroll.md) |
| `input()` | `<Input>` | `UITextField` / `UITextView` / `EditText` | [Input](../elements/input.md) |
| `virtual_list(count, row)` | `<List>` | Une liste virtualisée à recyclage de vues | [List](../elements/list.md) |
| `canvas(..)`, `web_view(url)`, `video(url)` | `<Canvas>`, `<WebView>`, `<Video>` | Un dessin, une page web, un lecteur vidéo | [Éléments](../elements/index.md) |
| `nsh_base::dialog()` | `<Dialog>` depuis `nsh/base` | Une couche présentée | [Éléments](../elements/index.md) |
| `when(..)`, `each(..)` | `<If>`, `<Each>` | Flux de contrôle, sans vue propre | [Flux de contrôle](../elements/control-flow.md) |

```rust tabs
use nsh_core::prelude::*;   // view, text, image, scroll, input, virtual_list, ..., when, each
```

```tsx tabs
import { Image, mount, Text, View } from "nsh";
```

En Rust, les styles sont des méthodes typées nommées comme les utilitaires de Tailwind (`.px_4()`, `.rounded_lg()`, `.bg(..)`), et les écouteurs sont aussi des méthodes (`.on_press(..)`) ; les réglages propres à une plateforme ont leurs propres méthodes. En TSX, les props gardent leurs noms en camelCase (`onPress`, `allowFontScaling`, `backgroundColor`) ; chaque élément accepte `style`, `class` / `classList` ([Tailwind](./tailwind.md)), `ref`, des gestionnaires tactiles, des props d'accessibilité et `testID`, et les props propres à une plateforme vont dans `ios={{…}}` et `android={{…}}`, où seul l'objet de la plateforme courante est envoyé :

```rust tabs
view()
    .rounded(px(12.0))
    .bg(move || theme().background)
    .on_press(move || open.set(true))
    .child(text("Open").font_weight(FontWeight::SEMIBOLD))
```

```tsx tabs
<View android={{ elevation: 4, ripple: { color: "#0001" } }} style={{ borderRadius: 12 }} onPress={() => open.set(true)}>
  <Text style={{ fontWeight: "600" }}>Open</Text>
</View>
```

Les balises TSX sont en PascalCase afin que TypeScript vérifie chacune d'elles par rapport à la liaison qu'elle nomme : une balise en minuscules est vérifiée par rapport à un type global par nom, de sorte qu'un composant générique comme `List` ou `Each` ne pourrait pas déduire le type de ses lignes à partir de `each` / `of`, et les composants propres à une application ne seraient pas typés du tout. Les imports ne coûtent rien à l'exécution : le compilateur reconnaît les primitives via leurs imports (alias compris) et crée l'élément natif sur place, de sorte que `<View>` est un appel direct du moteur de rendu et que l'import est retiré du bundle. Une balise en minuscules est une erreur de build qui indique quoi écrire :

```text
x lowercase tag <view>: tags are PascalCase components: write <View> and
| `import { View } from "nsh"`
```

> [!IMPORTANT]
> Le texte ne s'affiche qu'à l'intérieur d'un élément de texte : `text(..)` en Rust, `<Text>` en TSX. Une chaîne placée directement dans un `<View>` ne crée aucune vue native et n'est pas affichée.

<a id="components"></a>

## Composants

L'apparence d'une application lui appartient. NSH fournit deux couches : les primitives (les éléments ci-dessus, les styles, les classes Tailwind) et les composants de base sans style de [`nsh/base`](../modules/nsh-base.md) (`nsh_base` en Rust), qui gèrent des comportements comme la navigation, les dialogues, le clavier, la barre d'état et les zones sûres. La troisième couche, la bibliothèque de composants, est la vôtre : boutons, cartes et tous les autres éléments de votre UI sont des composants que vous écrivez sur ces deux couches, dans le crate de votre application ([Développer avec Rust](./rust.md)) ou en TSX, ou une bibliothèque de la communauté ([Trois couches](./architecture.md#three-layers)).

Un composant Rust est un `#[component] fn` qui prend sa struct de props (et, quand il a des événements, un `Scope` pour les émettre) et renvoie ses éléments. `#[component]` crée aussi son constructeur, le nom de la fonction en snake case : `Badge` se place avec `badge()`, comme `view()` place une vue, avec un setter par prop (`.label(..)`, `.color(..)` : une valeur, un signal ou une closure). Un composant TSX est une fonction qui prend un objet de props et renvoie du JSX :

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct BadgeProps {
    /// The text.
    pub label: Prop<SharedString>,
    /// The background (light blue when left out).
    #[prop(default = Hsla::from(rgb(0xddf4ff)))]
    pub color: Prop<Hsla>,
}

/// A small rounded label.
#[component]
pub fn Badge(props: BadgeProps) -> impl IntoElement {
    view()
        .rounded_full()
        .px(px(10.0))
        .py_1()
        .bg(move || props.color.get())
        .child(text(props.label).text_size(px(13.0)).font_weight(FontWeight::SEMIBOLD))
}

// Placed in another component's view:
badge()
    .label(move || format!("{} new", unread.get()))
    .color(rgb(0xfff8c5))
```

```tsx tabs
function Badge(props: { label: string; color?: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: props.color ?? "#ddf4ff" }}>
      <Text style={{ fontSize: 13, fontWeight: "600" }}>{props.label}</Text>
    </View>
  );
}

<Badge label={`${unread()} new`} color="#fff8c5" />
```

La fonction s'exécute **une seule fois**, à la création du composant, et ne suit pas ce qu'elle lit : il n'y a pas de re-rendu. Le code de son corps (création de signaux, démarrage d'effets, calcul de constantes) s'exécute une seule fois. Les éléments qu'elle renvoie restent connectés aux props et aux signaux qu'ils lisent, de sorte que `Badge` ci-dessus met à jour son texte chaque fois que `unread` change, sans réexécuter `Badge`.

Écrivez un `#[component]` quand l'UI a ses propres props ou événements, ou quand une entrée TSX l'importe : un composant Rust est enregistré sous son type (`registry.register::<Badge>()`), avec des props typées à partir de la struct ([Développer avec Rust](./rust.md#extending-a-rust-app-with-tsx)). Pour un morceau d'UI que seul Rust utilise, une simple fonction renvoyant `impl IntoElement` suffit, ses arguments étant les props. En TSX, un composant peut renvoyer un élément, une chaîne ou un nombre, un tableau, `null`, ou une fonction renvoyant l'un de ceux-ci (que le moteur de rendu suit) ; le type `Component<P>` de `nsh` en décrit un :

```rust tabs
fn row(title: impl Into<SharedString>, content: impl IntoElement) -> impl IntoElement {
    view()
        .flex_row()
        .gap_2()
        .child(text(title.into()))
        .child(content)
}
```

```tsx tabs
import type { Component, JSX } from "nsh";
import { Text, View } from "nsh";

const Row: Component<{ title: string; children?: JSX.Element }> = (props) => (
  <View style={{ flexDirection: "row", gap: 8 }}>
    <Text>{props.title}</Text>
    {props.children}
  </View>
);
```

<a id="what-runs-again"></a>

### Ce qui s'exécute à nouveau

Une valeur donnée à un élément est définie une seule fois ; une liaison suit ce qu'elle lit. En Rust, une liaison est une closure (ou un signal, un memo, une prop) donnée là où va une valeur. En TSX, le compilateur décide pour chaque expression du JSX : une expression change quand elle **appelle une fonction ou lit une propriété** (hors fonctions imbriquées), et tout le reste est défini une seule fois :

```rust tabs
text(move || format!("{}", count.get()))     // follows count
text(props.title)                            // follows the prop
text(label.clone())                          // a plain value: set once
view().opacity(move || if busy.get() { 0.5_f32 } else { 1.0 })   // follows busy
```

```tsx tabs
<Text>{count()}</Text>              // follows count
<Text>{props.title}</Text>          // follows the prop
<Text>{user.name}</Text>            // re-read when something it depends on changes
<Text>{label}</Text>                // a plain variable: set once
<View style={{ opacity: busy() ? 0.5 : 1 }} />   // the style object is rebuilt when busy changes
```

Une prop ou un enfant qui change est un petit effet natif qui définit cette seule prop ou remplace ce seul enfant. Les styles sont comparés (diff) en Rust, de sorte qu'un style qui change n'envoie que les propriétés modifiées.

Les gestionnaires d'événements sont définis une seule fois : une closure en Rust, une fonction ou un nom en TSX (`onPress={() => …}`, `onPress={save}`). En TSX, les autres expressions sont suivies (`onPress={props.onPress}` suit la prop).

### Props

Les props d'un composant Rust sont les champs de sa struct `#[derive(Props)]`, chacun un `Prop<T>` : une valeur, ou une liaison transmise par le parent. Lisez-en une dans une liaison (`text(props.title)`, `move || props.title.get()`) pour la suivre ; `props.title.get()` dans le corps la lit une seule fois. Les champs avec `#[prop(default)]` ou `#[prop(default = …)]`, et les `Option`, sont optionnels. Le constructeur initialise chaque prop à sa valeur par défaut, et un parent appelle les setters de celles dont il a besoin : `badge().label("New")`.

Une prop TSX qui reçoit une expression changeante est passée sous forme de getter : lire `props.title` l'appelle, ce qui permet au JSX qui la lit de la suivre. Les props statiques sont de simples valeurs. Dans les deux cas, les props sont lues là où elles sont utilisées :

```rust tabs
// Wrong: reads the prop once, when the component runs.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    let content = props.text.get();
    text(content)
}

// Right: binds the text to the prop.
#[component]
fn Title(props: TitleProps) -> impl IntoElement {
    text(props.text)
}
```

```tsx tabs
// Wrong: reads the prop once, when the component runs.
function Title(props: { text: string }) {
  const { text } = props;
  return <Text>{text}</Text>;
}

// Right: reads it in JSX, which follows it.
function Title(props: { text: string }) {
  return <Text>{props.text}</Text>;
}
```

Un composant TSX qui décompose ses props dans son paramètre, `function Title({ text }: …)`, les lit de la même façon une seule fois, et le build avertit en indiquant les props à lire à la place :

```text
warn App.tsx:3:16: Title takes its props apart (`{ text }`): each is read once, when Title runs, and does not follow changes; take `props` and read `props.text` where it is used (`split(props, [...])` to pass the rest on)
```

Une prop dont le composant n'a besoin qu'une fois, comme un id avec lequel il démarre, se lit dans le corps (`props.id.get_untracked()`, `const { id } = props;`), ce qui l'indique clairement.

En TSX, la même règle s'applique aux valeurs par défaut : écrivez `props.color ?? "#ddf4ff"` dans le JSX plutôt que de déstructurer avec une valeur par défaut. Pour calculer quelque chose à partir des props, utilisez une closure ou [`computed`](./reactivity.md#computed) :

```rust tabs
#[component]
fn Price(props: PriceProps) -> impl IntoElement {
    let formatted = move || format!("${:.2}", props.cents.get() as f64 / 100.0);
    text(formatted)
}
```

```tsx tabs
function Price(props: { cents: number }) {
  const formatted = () => `$${(props.cents / 100).toFixed(2)}`;
  return <Text>{formatted()}</Text>;
}
```

<a id="children"></a>

### Enfants

Ce qu'un parent place dans un composant arrive comme ses enfants : un champ `children: Prop<Children>` en Rust, que le parent remplit avec `.child(..)` ; `props.children` en TSX, un getter qui construit ces éléments quand il est lu :

```rust tabs
#[derive(Debug, Clone, PartialEq, Props)]
pub struct CardProps {
    /// The title.
    pub title: Prop<SharedString>,
    /// The content.
    pub children: Prop<Children>,
}

#[component]
pub fn Card(props: CardProps) -> impl IntoElement {
    view()
        .p(px(14.0))
        .rounded(px(12.0))
        .bg(move || theme().background)
        .gap_2()
        .child(text(props.title).font_weight(FontWeight::SEMIBOLD))
        .child(props.children)
}

card()
    .title("Account")
    .child(text(move || format!("Signed in as {}", user.get().name)))
```

```tsx tabs
function Card(props: { title: string; children?: JSX.Element }) {
  return (
    <View style={{ padding: 14, borderRadius: 12, backgroundColor: "#ffffff", gap: 8 }}>
      <Text style={{ fontWeight: "600" }}>{props.title}</Text>
      {props.children}
    </View>
  );
}

<Card title="Account">
  <Text>Signed in as {user().name}</Text>
</Card>
```

En TSX, chaque lecture de `props.children` reconstruit les enfants (de nouvelles vues natives) : lisez-le une fois, à l'endroit où vont les enfants. Parmi plusieurs enfants, celui qui change (un `<If>`, un `<Each>`, `{cond() ? a : b}`) arrive sous forme de fonction, et `{props.children}` met à jour celui-là seul : ses frères gardent leurs vues, un champ de saisie son texte et son focus. Les fragments (`<>…</>`) regroupent des éléments sans vue.

Les enfants peuvent aussi être produits par une fonction que le composant appelle avec des arguments, un render callback :

```rust tabs
fn repeat<E: IntoElement>(times: usize, row: impl Fn(usize) -> E) -> impl IntoElement {
    view().child((0..times).map(row))
}

repeat(3, |i| text(format!("Row {i}")))
```

```tsx tabs
function Repeat(props: { times: number; children: (i: number) => JSX.Element }) {
  return <View>{Array.from({ length: props.times }, (_, i) => props.children(i))}</View>;
}

<Repeat times={3}>{(i) => <Text>Row {i}</Text>}</Repeat>
```

<a id="control-flow"></a>

## Flux de contrôle

`when` et `each` en Rust, `<If>` et `<Each>` en TSX, sont des structures de flux de contrôle intégrées. Elles ne rendent aucune vue propre.

```rust tabs
when(move || user.get().is_some(), move || {
    text(move || format!("Hello, {}", user.get().map(|u| u.name).unwrap_or_default()))
})
.otherwise(|| text("Signed out"))

each(todos, |todo| todo.id, |todo, index| {
    text(move || format!("{}. {}", index.get() + 1, todo.get().title))
})
```

```tsx tabs
<If when={user()} else={<Text>Signed out</Text>}>
  {(u) => <Text>Hello, {u().name}</Text>}
</If>

<Each of={todos()} key={(t) => t.id}>
  {(todo, index) => (
    <Text>
      {index() + 1}. {todo().title}
    </Text>
  )}
</Each>
```

- **`when`** / **`<If>`** affiche sa branche tant que la condition est vraie, sinon la branche `otherwise` / `else`. Il ne rend une branche à nouveau que lorsque la valeur de vérité de la condition change, et non à chaque réévaluation de la condition. En TSX, un enfant fonction reçoit un accesseur de la valeur de `when`, typé sans `null` et `undefined` : `u()` est l'utilisateur tant que la branche s'affiche, et le suit quand il change.
- **`each`** / **`<Each>`** rend une ligne par élément, produite par sa fonction de ligne. Les lignes sont conservées par clé (Rust : la fonction de clé ; TSX : `key`, par défaut l'élément lui-même, les objets par identité et les primitives par valeur) : quand la liste change, les lignes conservées sont déplacées plutôt que reconstruites, et de nouvelles lignes ne sont créées que pour les nouvelles clés. La fonction de ligne reçoit des **signaux** de l'élément et de son index (`todo.get()` et `index.get()` en Rust, `todo()` et `index()` en TSX), car l'élément et la position d'une ligne conservée peuvent changer. En TSX, `key="index"` (ou `key={(item, i) => i}`) conserve plutôt les lignes par position : une liste de chaînes qui change sur place, comme du texte reçu en flux, garde ses lignes et seul leur `item()` change.

Un choix fait dans une closure (`dynamic(move || if busy.get() { … } else { … })` en Rust, un ternaire ou `&&` en TSX) reconstruit sa branche chaque fois que quelque chose qu'il lit change. Préférez `when` / `<If>` quand une branche dépasse quelques éléments.

Pour les listes longues ou infinies, utilisez [`List`](./lists.md) (`virtual_list` en Rust) : il ne crée des vues que pour les lignes à l'écran et les recycle. Voir [Flux de contrôle](../elements/control-flow.md) pour les détails.

## Refs

Une ref désigne un élément hôte pour des appels impératifs : `focus()`, `blur()`, `scroll_to()` / `scrollTo()`, `scroll_to_index()` / `scrollToIndex()`, `measure()` ([où se trouve une vue](./touch-and-gestures.md#where-a-view-is-measure)), ... En Rust, `element_ref()` en crée une et `.element_ref(&handle)` la place sur un élément ; en TSX, `ref` vous donne la ref de l'élément, dont le type est celui de l'élément (`InputRef` ici, `ViewRef` pour un `View` ; voir les [méthodes de ref](../elements/index.md#ref-methods)) :

```rust tabs
fn search() -> impl IntoElement {
    let field = element_ref();
    view()
        .child(input().element_ref(&field).placeholder("Search"))
        .child(text("Focus").on_press(move || field.focus()))
}
```

```tsx tabs
import type { InputRef } from "nsh";
import { Text, View } from "nsh";
import { Input } from "nsh/base";

function Search() {
  let input: InputRef | undefined;
  return (
    <View>
      <Input ref={input} placeholder="Search" />
      <View onPress={() => input?.focus()}>
        <Text>Focus</Text>
      </View>
    </View>
  );
}
```

Une ref Rust est un handle `Copy` ; ses appels vont à l'élément qui la porte, et ne font rien une fois son propriétaire disparu. En TSX, ce que nomme `ref={…}` reçoit le nœud :

- une variable déclarée avec `let` se le voit assigner ;
- un champ (`ref={refs.input}`, `ref={refs[name]}`) se le voit assigner ;
- un [signal](./reactivity.md) y est fixé, de sorte que ce qui lit le signal le suit ;
- une fonction est appelée avec lui (`<Scroll ref={(node) => (scroller = node)} />`).

Un `const` ou un import contient un signal ou une fonction, comme dans `const input = signal<InputRef>()` avec `<Input ref={input} />` et `input()?.focus()` ; un élément qui contient autre chose est signalé à la création de l'élément, avec ce qu'il faut écrire.

La ref est définie à la création de l'élément, avant le retour du composant, elle est donc disponible dans les [effets](./reactivity.md#effect) et les gestionnaires d'événements. Les appels sont envoyés à la vue dans l'ordre, avec les changements faits avant eux. Les composants de base et les composants Rust de votre propre crate acceptent aussi `ref` (en Rust `component_ref()`, placé sur l'élément avec `.component_ref(&r)` : `dialog().component_ref(&r)`).

<a id="spreading-props"></a>

## Propagation des props

En Rust, un parent appelle les setters des props dont il a besoin et les autres gardent leurs valeurs par défaut, et un wrapper transmet ses propres `Prop` telles quelles (`card().title(props.title)`) : un `Prop` continue de suivre ce qu'il a reçu.

En TSX, propagez un objet de props sur un élément ou un composant avec `{...props}`. Les getters restent des getters, donc les props propagées continuent de suivre ce qu'elles lisent. Pour garder certaines props pour soi et transmettre le reste, utilisez `split` :

```tsx
import { split, Text, View } from "nsh";
import { Input, type InputProps } from "nsh/base";

function Field(props: InputProps & { label: string }) {
  const [own, rest] = split(props, ["label"]);
  return (
    <View style={{ gap: 4 }}>
      <Text>{own.label}</Text>
      <Input style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} {...rest} />
    </View>
  );
}

<Field label="Email" value={email()} onChange={({ value }) => email.set(value)} keyboardType="email-address" />
```

`split(props, keys)` renvoie `[picked, rest]`, qui lisent tous deux à travers les props d'origine (déstructurer `{ label, ...rest } = props` lirait chaque prop une fois). Les props d'élément qui viennent plus tard dans le JSX l'emportent sur les précédentes.

`<If>` et `<Each>` n'acceptent pas de props propagées, et les enfants propagés (`{...items}`) ne sont pas pris en charge : utilisez `<Each>` ou une expression de tableau.

<a id="tags-and-names"></a>

## Balises et noms

Un élément Rust est tout ce que le code appelle : la fonction d'une primitive, le constructeur d'un composant (`badge()`, `nsh_base::button()`), ou une fonction à vous. Une balise TSX nomme une liaison dans la portée, comme d'habitude : `<Badge />`, `<Theme.Provider>`, un `<Button>` à vous. Une balise qui ne nomme rien dans la portée est une erreur de build, sauf `<If>` et `<Each>`, qui sont des globaux.

```rust tabs
/// The app's button: a press target styled by the app.
fn primary_button(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .role(AccessibilityRole::Button)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_5()
        .py_3()
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text(title).text_base().font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

primary_button("Save", save)
```

```tsx tabs
import { Text, View } from "nsh";

function Button(props: { title: string; onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} role="button" class="rounded-lg bg-blue-600 px-5 py-3">
      <Text class="text-base font-semibold text-white">{props.title}</Text>
    </View>
  );
}

<Button title="Save" onPress={save} />
```

Le `Button` de `nsh_base` (`button()` en Rust, `<Button>` depuis `nsh/base`) est la cible d'appui sans style, avec les états désactivé et sélectionné et leur accessibilité ; l'application lui donne son apparence : `button().disabled(move || saving.get()).on_press(move || save()).px_4().active(|s| s.opacity(0.6)).child(text("Save"))`.

En TSX, vos liaisons l'emportent sur les globaux : un composant nommé `Each` dans la portée fait de `<Each>` ce composant. Une primitive est reconnue par son import, donc `import { View as Box } from "nsh"` fait de `<Box>` une vue, et un composant à vous nommé `Text` est simplement votre composant. Les primitives sont aussi de vrais composants : `const Tag = inline ? Text : View;` puis `<Tag>…</Tag>` fonctionne.

Les composants sont typés par leurs propres déclarations : les structs de props de Rust sont vérifiées par le compilateur, et TypeScript vérifie les props d'un composant TSX partout où il est utilisé, sans rien à générer. Un composant Rust qu'une entrée TSX importe obtient des déclarations TypeScript générées à partir de sa struct.

<a id="mounting-and-the-root"></a>

## Montage et racine

La racine d'une application Rust est le composant que nomme le `"root"` de `nsh.json` ; `nsh run` et `nsh package` le montent. Une entrée TSX appelle `mount(App)` pour rendre le composant racine (`mount(App, props)` lui passe des props). La vue racine remplit la surface (la fenêtre, ou la vue dans laquelle une application intègre NSH). Donnez à la racine `flex: 1` pour qu'elle remplisse l'écran, et une couleur de fond : l'arrière-plan propre de la surface dépend de la plateforme.

```rust tabs
// nsh.json: { "rust": ".", "root": "App" }
#[component]
pub fn App() -> impl IntoElement {
    view()
        .flex_1()
        .bg(move || theme().background)
        .child(home())
}
```

```tsx tabs
mount(() => (
  <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
    <App />
  </View>
));
```
<a id="related"></a>

## Voir aussi

- [Reactivity](./reactivity.md) : signaux, effets, contexte.
- [Elements](../elements/index.md) : tous les éléments hôtes et leurs props.
- [Styling](./styling.md) et [Tailwind](./tailwind.md) : l'apparence de vos composants.
- [Building with Rust](./rust.md) : applications Rust, composants dans le crate de votre application, et TSX par-dessus.
