---
title: "Formulaires et clavier"
description: "Saisie de texte avec l'élément input : valeurs contrôlées et non contrôlées, types de clavier, touche retour, focus, sélection, champs multilignes extensibles, et protection du contenu contre le clavier logiciel."
order: 42
group: ui
demo: guide-forms
source_hash: a7bed0645c77c155
---

# Formulaires et clavier

La saisie de texte passe par l'élément input, `input()` en Rust et `<Input>` en TSX : un UITextField ou un UITextView sur iOS, un EditText sur Android. La frappe, le curseur, la sélection, la correction automatique et le remplissage automatique sont ceux de la plateforme ; votre app reçoit le texte via des événements et peut le contrôler. NSH garde aussi de lui-même les champs ayant le focus au-dessus du clavier logiciel, et vous donne la hauteur du clavier sous forme de valeur réactive pour les cas qu'il ne peut pas gérer seul.

Un input accepte des styles comme n'importe quelle vue (méthodes de style typées en Rust, styles et classes Tailwind en TSX), de sorte que les champs d'un formulaire ont l'apparence propre à votre app. Un champ avec libellé est un petit composant à vous :

```rust tabs
use nsh_core::prelude::*;

fn field(label: &'static str, value: Signal<String>, masked: bool) -> impl IntoElement {
    let focused = signal(false);
    view()
        .gap_1()
        .child(text(label).text_sm().text_color(rgb(0x737373)))
        .child(
            input()
                .value(move || value.get())
                .on_change(move |text: &str| value.set(text.to_owned()))
                .masked(masked)
                .on_focus(move || focused.set(true))
                .on_blur(move || focused.set(false))
                .rounded_lg()
                .border_1()
                .px_3()
                .py_2()
                .text_base()
                .border_color(move || if focused.get() { rgb(0x0969da) } else { rgb(0xd0d7de) }),
        )
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function Field(props: { label: string; value: string; onChange: (e: { value: string }) => void; masked?: boolean }) {
  const focused = signal(false);
  return (
    <View class="gap-1">
      <Text class="text-sm text-neutral-500">{props.label}</Text>
      <Input
        value={props.value}
        onChange={props.onChange}
        masked={props.masked}
        onFocus={() => focused.set(true)}
        onBlur={() => focused.set(false)}
        class="rounded-lg border px-3 py-2 text-base"
        style={{ borderColor: focused() ? "#0969da" : "#d0d7de" }}
      />
    </View>
  );
}
```

<a id="controlled-and-uncontrolled-inputs"></a>

## Inputs contrôlés et non contrôlés

Un input est **contrôlé** quand vous lui passez sa valeur (`.value(..)`, TSX `value`) : il affiche ce que contient votre signal, et vous mettez à jour le signal depuis l'événement de changement (`.on_change(..)`, TSX `onChange`).

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    let name = signal(String::new());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(8.0))
        .child(
            input()
                .value(move || name.get())
                .on_change(move |text: &str| name.set(text.to_owned()))
                .placeholder("Your name")
                .text_size(px(17.0))
                .border_1()
                .border_color(rgb(0xd0d7de))
                .rounded(px(10.0))
                .p(px(12.0)),
        )
        .child(text(move || {
            let name = name.get();
            format!("Hello, {}", if name.is_empty() { "stranger" } else { &name })
        }))
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { Input } from "nsh/base";

function App() {
  const name = signal("");
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 8 }}>
      <Input
        value={name()}
        onChange={({ value }) => name.set(value)}
        placeholder="Your name"
        style={{ fontSize: 17, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, padding: 12 }}
      />
      <Text>Hello, {name() || "stranger"}</Text>
    </View>
  );
}

mount(App);
```

Comme vous contrôlez la valeur, vous pouvez transformer ce que l'utilisateur saisit : `.on_change(move |t: &str| tag.set(t.to_uppercase()))` met en majuscules, `onChange={({ value }) => code.set(value.replace(/[^0-9]/g, ""))}` ne garde que les chiffres.

<a id="input-methods"></a>

### Méthodes de saisie

Les méthodes de saisie chinoise, japonaise et coréenne composent le texte avant de le valider : le pinyin devient 腾 une fois un caractère choisi. `onCompositionChange` (Rust `.on_composition_change(..)`) signale la composition au fil de l'eau, `{ composing: true, text: "teng" }` pendant que l'utilisateur tape et `{ composing: false, text: "" }` quand elle se termine ; le texte validé parvient à `onChange` avant la fin. Sur iOS, Android, macOS et le web, `onChange` signale aussi le texte en cours de composition, car ces systèmes le conservent dans le champ ; sur Windows, Linux et GPUI, il signale le texte validé. Un input contrôlé maintient la composition quoi que l'app fasse de la valeur : un `value` défini pendant que l'utilisateur compose s'affiche une fois la composition terminée, si bien qu'un input qui met son texte en majuscules ou le filtre accepte le pinyin tel qu'il est saisi.

Une zone de recherche qui ne cherche que le texte validé :

```rust tabs
let query = signal(String::new());
let composing = signal(false);
input()
    .value(move || query.get())
    .on_change(move |text: &str| {
        query.set(text.to_owned());
        if !composing.get() {
            search(text);
        }
    })
    .on_composition_change(move |e: &Composition| {
        composing.set(e.composing);
        if !e.composing {
            search(&query.get());
        }
    })
```

```tsx tabs
const query = signal("");
let composing = false;
<Input
  value={query()}
  onChange={({ value }) => {
    query.set(value);
    if (!composing) search(value);
  }}
  onCompositionChange={(e) => {
    composing = e.composing;
    if (!e.composing) search(query());
  }}
/>
```

Un input est **non contrôlé** sans valeur : il garde son propre texte, en partant de sa valeur par défaut (`.default_value(..)`, TSX `defaultValue`), et vous le lisez depuis l'événement de changement ou de soumission quand vous en avez besoin. Utilisez-le pour les champs que vous ne lisez qu'à la soumission, comme un mot de passe.

> [!NOTE]
> Un input contrôlé ne perd jamais de frappes. Chaque modification native porte un compteur de modifications, et un `value` renvoyé par JS n'est appliqué que s'il répond à la dernière modification. Si JS est lent et que l'utilisateur a tapé davantage entre-temps, la valeur périmée est abandonnée au lieu d'écraser le texte plus récent.

## Props

En Rust, chaque prop est une méthode de `input()` nommée en snake case (`.placeholder(..)`, `.masked(true)`, `.max_length(6)`, `.return_key_type(ReturnKeyType::Next)`, `.selected_range((0, 4))`), avec ces noms propres : `.keyboard_type(KeyboardType::Email)` et les autres variantes de `KeyboardType`, `.auto_fill(AutoFill::Email)` pour `autoComplete`, `.keyboard_appearance(..)` et `.input_accessory(..)` pour les props `ios={{ … }}`. Chaque événement est une méthode `on_` : `.on_change(|text: &str| ..)`, `.on_submit(|text: &str| ..)`, `.on_focus(..)`, `.on_blur(..)`, `.on_selection_change(|s: &Selection| ..)`, `.on_key_press(|key: &str| ..)`, `.on_content_size_change(|size: &Size<Points>| ..)`.

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `value` | `string` | | Le texte, contrôlé par JS. |
| `defaultValue` | `string` | | Le texte initial d'un input non contrôlé. |
| `placeholder` | `string` | | Affiché tant que l'input est vide. |
| `masked` | `boolean` | `false` | Masque le texte (mots de passe). |
| `keyboardType` | `KeyboardType` | `"default"` | La disposition du clavier. |
| `returnKeyType` | `ReturnKeyType` | `"default"` | Le libellé de la touche Entrée. |
| `autoCapitalize` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Mise en majuscules automatique. |
| `autoCorrect` | `boolean` | `true` | Les corrections du système. |
| `autoComplete` | `AutoComplete` | | Ce que contient l'input, pour le remplissage automatique. |
| `multiline` | `boolean` | `false` | Plusieurs lignes ; Entrée insère un saut de ligne sauf si `submitBehavior` en dispose autrement. |
| `maxLength` | `number` | | Le nombre maximal de caractères que l'utilisateur peut saisir. |
| `readonly` | `boolean` | `false` | L'utilisateur peut sélectionner et copier le texte, mais pas le modifier. |
| `autoFocus` | `boolean` | `false` | Prend le focus à son apparition. |
| `submitBehavior` | `"submit" \| "blurAndSubmit" \| "newline"` | une ligne `"blurAndSubmit"`, multiligne `"newline"` | Ce que fait Entrée : soumettre et garder le focus, soumettre et retirer le focus, ou insérer un saut de ligne (multiligne uniquement). |
| `pasteBehavior` | `"insert" \| "report"` | `"insert"` | Ce que fait un collage : insérer son texte, ou rien ([collage](#pasting-images-and-files)). |
| `caret` | `boolean` | `true` | Le curseur est dessiné ; `false` le masque. |
| `ios={{ keyboardAppearance }}` | `"default" \| "light" \| "dark"` | `"default"` | L'apparence du clavier (iOS). |
| `selectedRange` | `{ start: number; end?: number }` | | La sélection contrôlée, en unités UTF-16. |
| `allowFontScaling` | `boolean` | `true` | Suit la taille de texte du système. |
| `maxFontSizeMultiplier` | `number` | | La borne supérieure de l'échelle du système (0 : aucune). |
| `ios={{ inputAccessoryViewID }}` | `string` | | iOS : la barre affichée au-dessus du clavier (voir ci-dessous). |
| `ios={{ textContentType }}` | `TextContentType` | | Les noms qu'iOS donne aux valeurs de `autoComplete`. |

Événements :

| Événement | Données | Quand |
|---|---|---|
| `onChange` | `{ value }` | Le texte a changé : `value` est le texte actuel. |
| `onSubmit` | `{ text }` | La touche Entrée a été pressée dans un input qui soumet (une seule ligne, ou `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | | L'input a gagné / perdu le focus. |
| `onSelectionChange` | `{ start, end }` | Le curseur ou la sélection a bougé (unités UTF-16). |
| `onPaste` | `{ text, html, files, uris }` | L'utilisateur a collé : du texte, son HTML (Linux, web), des images sous forme de `File`s, des URL de fichiers locaux ([collage](#pasting-images-and-files)). |
| `onCaretMove` | `{ bounds, pageBounds }` | Le curseur a bougé : où il se trouve dans l'input et dans la fenêtre ([le curseur](#the-caret)). |
| `onKeyPress` | `{ key }` | Avant que le texte change : `key` est le texte saisi, `"Backspace"` ou `"Enter"`. |
| `onContentSizeChange` | `{ size }` | La taille du texte (`size`) a changé (à la largeur de l'input en multiligne), au fil de la saisie ; un input vide signale une ligne vide, quel que soit son placeholder. |
| `onCompositionChange` | `{ composing, text }` | La composition d'une méthode de saisie a commencé, changé ou pris fin (voir [Méthodes de saisie](#input-methods)). |

Un input se style comme du texte : `fontSize`, `color`, `fontFamily`, `textAlign`, `letterSpacing` et le reste des [styles de texte](./text.md), plus les bordures, le padding et les arrière-plans. Le style de focus (`.focus(|s| ..)` en Rust, la variante Tailwind `focus:` ou `focusStyle` en TSX) s'applique tant que l'input a le focus. La couleur du placeholder est `.placeholder_color(..)` (la clé de style
`placeholderColor`, `placeholder:text-*`), celle du curseur est `.caret_color(..)` (`caretColor`, `caret-*`), et celle de la surbrillance de la sélection est `.selection_color(..)`
(`selectionColor`, `selection:text-*`) ; UIKit teinte le curseur et la sélection d'une seule couleur, celle du curseur si elle est définie :

```rust tabs
input()
    .placeholder("Search")
    .rounded_lg()
    .border_1()
    .border_color(rgb(0xd4d4d8))
    .px_3()
    .py_2()
    .text_base()
    .focus(|s| s.border_color(rgb(0x3b82f6)))
    .placeholder_color(rgb(0xa1a1aa))
    .selection_color(rgb(0x2563eb))
```

```tsx tabs
<Input
  class="rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-blue-500 placeholder:text-zinc-400 selection:text-blue-600"
  placeholder="Search"
/>
```

<a id="keyboards-and-autofill"></a>

## Claviers et remplissage automatique

Le type de clavier (`.keyboard_type(..)`, TSX `keyboardType`) détermine la disposition :

| Rust | TSX | Clavier |
|---|---|---|
| `KeyboardType::Default` | `"default"` | Texte. |
| `KeyboardType::Email` | `"email-address"` | Texte avec `@` et `.` à portée de main. |
| `KeyboardType::Url` | `"url"` | Texte avec `/` et `.com`. |
| `KeyboardType::Number` | `"number-pad"` | Chiffres uniquement : ni signe, ni séparateur décimal (codes, codes PIN). |
| `KeyboardType::Decimal` | `"decimal-pad"` | Chiffres et séparateur décimal. |
| `KeyboardType::Numeric` | `"numeric"` | Comme React Native : le pavé décimal d'iOS ; sur Android, des chiffres avec un signe et un séparateur décimal. |
| `KeyboardType::NumbersAndPunctuation` | `"numbers-and-punctuation"` | Chiffres, signe moins et ponctuation (le clavier de chiffres et de ponctuation d'iOS ; sur Android, des chiffres avec un signe et un séparateur décimal). Utilisez-le pour les nombres négatifs sur iOS. |
| `KeyboardType::Phone` | `"phone-pad"` | Un pavé de composition téléphonique. |

Sur iOS, `.keyboard_appearance(KeyboardAppearance::Dark)` (TSX `ios={{ keyboardAppearance: "dark" }}` ; ou light, par défaut) donne au clavier une apparence claire ou sombre indépendamment de l'apparence du système, pour une app sombre en mode clair. Les claviers d'Android suivent toujours le thème du système.

Le remplissage automatique (`.auto_fill(AutoFill::Email)`, TSX `autoComplete`) indique au système ce que contient le champ, afin qu'il puisse proposer des noms, adresses, mots de passe enregistrés et codes à usage unique issus des messages. Le `AutoFill` de Rust a une variante par type (`Name`, `GivenName`, `FamilyName`, `Email`, `Tel`, `Username`, `Password`, `NewPassword`, `OneTimeCode`, `StreetAddress`, `PostalCode`, `Country`, `CreditCardNumber`, `Url`, `Birthdate`, ..., et `Off`). TSX accepte ces valeurs : `"name"`, `"given-name"`, `"family-name"`, `"email"`, `"tel"`, `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"street-address"`, `"postal-code"`, `"country"`, `"cc-number"`, `"cc-exp"`, `"cc-csc"`, `"url"`, `"birthdate-full"` et d'autres, ou `"off"` ; les noms propres à iOS (`"emailAddress"`, `"oneTimeCode"`, ...) sont aussi acceptés, dans `autoComplete` ou `ios={{ textContentType }}`.

```rust tabs
use nsh_core::element::AutoFill;

input()
    .keyboard_type(KeyboardType::Email)
    .auto_capitalize(AutoCapitalize::None)
    .auto_correct(false)
    .auto_fill(AutoFill::Email)
    .placeholder("E-mail")
input().masked(true).auto_fill(AutoFill::NewPassword).placeholder("Password")
input()
    .keyboard_type(KeyboardType::Number)
    .auto_fill(AutoFill::OneTimeCode)
    .max_length(6)
    .placeholder("Code")
```

```tsx tabs
<Input keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" placeholder="E-mail" />
<Input masked autoComplete="new-password" placeholder="Password" />
<Input keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="Code" />
```

<a id="the-return-key-and-moving-between-fields"></a>

## La touche Entrée et le passage d'un champ à l'autre

Le type de touche Entrée (`.return_key_type(ReturnKeyType::Next)`, TSX `returnKeyType`) donne son libellé à la touche : default, done, go, next, search ou send. Le comportement de soumission (`.submit_behavior(..)`, TSX `submitBehavior`) définit ce qui se passe quand on la presse :

| Rust | TSX | Entrée | Par défaut pour |
|---|---|---|---|
| `SubmitBehavior::BlurAndSubmit` | `"blurAndSubmit"` | déclenche l'événement de soumission, puis l'input perd le focus | inputs d'une seule ligne |
| `SubmitBehavior::Submit` | `"submit"` | déclenche l'événement de soumission ; l'input garde le focus | |
| `SubmitBehavior::Newline` | `"newline"` | insère un saut de ligne (inputs multilignes uniquement) | inputs multilignes |

Un input multiligne avec `"submit"` ou `"blurAndSubmit"` envoie sur Entrée, comme les zones de saisie de messagerie, tout en continuant de renvoyer ses lignes à la ligne ; sur un clavier physique (ordinateurs de bureau, Mac, clavier de tablette), Maj+Entrée ou Option / Alt+Entrée insère un saut de ligne. Une touche Entrée qui valide la composition d'une méthode de saisie (saisie chinoise ou japonaise, par exemple) ne fait que la valider et ne soumet jamais.

Pour passer au champ suivant, gardez des refs vers les inputs (`element_ref()` et `.element_ref(&r)` en Rust, `ref` en TSX) et appelez `focus()` :

```rust tabs
use nsh_core::prelude::*;

pub fn sign_in() -> impl IntoElement {
    let email = signal(String::new());
    let password = element_ref();
    let submit = move || log::info!("sign in {}", email.get());
    view()
        .flex_1()
        .p(px(16.0))
        .pt(px(60.0))
        .gap(px(12.0))
        .child(
            input()
                .value(move || email.get())
                .on_change(move |t: &str| email.set(t.to_owned()))
                .keyboard_type(KeyboardType::Email)
                .auto_capitalize(AutoCapitalize::None)
                .return_key_type(ReturnKeyType::Next)
                .submit_behavior(SubmitBehavior::Submit)
                .on_submit(move |_: &str| password.focus())
                .placeholder("E-mail"),
        )
        .child(
            input()
                .element_ref(&password)
                .masked(true)
                .return_key_type(ReturnKeyType::Go)
                .on_submit(move |_: &str| submit())
                .placeholder("Password"),
        )
}
```

```tsx tabs
import { type InputRef, mount, signal, View } from "nsh";
import { Input } from "nsh/base";

function SignIn() {
  const email = signal("");
  let password!: InputRef;
  const submit = () => console.log("sign in", email());
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, gap: 12 }}>
      <Input
        value={email()}
        onChange={({ value }) => email.set(value)}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmit={() => password.focus()}
        placeholder="E-mail"
      />
      <Input ref={password} masked returnKeyType="go" onSubmit={submit} placeholder="Password" />
    </View>
  );
}

mount(SignIn);
```

Soumettre sans retirer le focus (`SubmitBehavior::Submit`, `submitBehavior="submit"`) sur le premier champ garde le clavier affiché pendant que le focus se déplace, de sorte qu'il ne s'abaisse pas pour remonter aussitôt. Un input de chat qui envoie sur Entrée et garde le focus soumet de la même façon (voir la zone de saisie [plus bas](#content-outside-scroll-views)).

La longueur maximale comme le comportement de soumission sont appliqués nativement : la plateforme demande « ce caractère peut-il être ajouté ? » et « Entrée doit-elle terminer l'édition ? » pendant la saisie, et NSH répond à partir des props sans attendre JS.

<a id="focus-from-code"></a>

## Focus depuis le code

La ref d'un input propose :

| Rust | TSX | Description |
|---|---|---|
| `focus()` | `focus()` | Donne le focus à l'input et affiche le clavier. |
| `blur()` | `blur()` | Lui retire le focus. |
| `set_selection(start, end)` | `setSelection(start, end?)` | Sélectionne `start..end` (unités UTF-16) ; un curseur lorsqu'ils sont égaux (TSX : sans `end`). |

Sur macOS et le web, `focus()` et `blur()` sur la ref d'une vue qui accepte les appuis déplacent le focus clavier comme le fait Tab ([focus clavier](../elements/index.md#keyboard-focus)).

`dismiss_keyboard()` en Rust et `Keyboard.dismiss()` de `nsh` en TSX retirent le focus de l'input qui l'a :

```rust tabs
view().on_press(|| dismiss_keyboard())
```

```tsx tabs
import { View, Keyboard } from "nsh";

<View onPress={() => Keyboard.dismiss()}>…</View>
```

<a id="selection"></a>

## Sélection

L'événement de sélection (`.on_selection_change(..)`, TSX `onSelectionChange`) signale le curseur et la sélection ; le `set_selection` de la ref ou la plage sélectionnée (`.selected_range(..)`, TSX `selectedRange`) les définissent. Les positions sont des unités de code UTF-16, comme les indices des chaînes JavaScript, donc en TSX `text.slice(start, end)` est le texte sélectionné ; en Rust, découpez les unités UTF-16 du texte.

```rust tabs
/// `start..end` of `text` in UTF-16 units, as inputs count.
fn utf16_slice(text: &str, start: u32, end: u32) -> String {
    let units: Vec<u16> = text.encode_utf16().collect();
    let end = (end as usize).min(units.len());
    String::from_utf16_lossy(&units[(start as usize).min(end)..end])
}

let content = signal("Select part of this text".to_owned());
let range = signal(Selection::default());
let field = element_ref();

view()
    .child(
        input()
            .element_ref(&field)
            .value(move || content.get())
            .on_change(move |t: &str| content.set(t.to_owned()))
            .on_selection_change(move |r: &Selection| range.set(*r)),
    )
    .child(text(move || {
        let r = range.get();
        format!("Selected: \"{}\"", content.with(|t| utf16_slice(t, r.start, r.end)))
    }))
    .child(
        view()
            .on_press(move || {
                let len = content.with(|t| t.encode_utf16().count()) as u32;
                field.set_selection(0, len);
            })
            .child(text("Select all")),
    )
```

```tsx tabs
const text = signal("Select part of this text");
const range = signal({ start: 0, end: 0 });
const selection = signal<{ start: number; end?: number } | undefined>(undefined);

<Input
  value={text()}
  onChange={({ value }) => text.set(value)}
  selectedRange={selection()}
  onSelectionChange={(r) => range.set(r)}
/>
<Text>Selected: "{text().slice(range().start, range().end)}"</Text>
<View onPress={() => selection.set({ start: 0, end: text().length })}><Text>Select all</Text></View>
```

<a id="the-caret"></a>

## Le curseur

L'événement de curseur (`.on_caret_move(..)`, TSX `onCaretMove`) indique où se trouve le curseur, afin que ce qui lui est associé puisse s'ouvrir à cet endroit : suggestions pour une mention `@`, menu d'une commande slash, sélecteur d'emoji. `bounds` est un `Bounds`
dans l'input (`origin` et `size`, avec le padding et le défilement de l'input appliqués), aussi large que la plateforme dessine le
curseur et aussi haut que sa ligne ; `pageBounds` est la même boîte dans la fenêtre (ou la boîte de dialogue où se trouve l'input), qu'un
overlay prend comme son `anchor`. L'événement arrive tant que l'input a le focus, chaque fois que le curseur bouge : avec la
sélection, et quand le texte de l'input défile ou passe à d'autres lignes. En Rust, un overlay se place par rapport à une boîte
avec `.anchor_bounds(..)`.

```rust tabs
let draft = signal(String::new());
let end = signal(0u32);
let caret = signal(None::<Bounds<Points>>);

view()
    .child(
        input()
            .multiline(true)
            .value(move || draft.get())
            .on_change(move |t: &str| draft.set(t.to_owned()))
            .on_selection_change(move |s: &Selection| end.set(s.end))
            .on_caret_move(move |e: &CaretEvent| {
                // Suggestions while the word before the caret starts with "@".
                let typed = draft.with(|t| utf16_slice(t, 0, end.get()));
                let word = typed.rsplit(char::is_whitespace).next().unwrap_or("");
                caret.set(word.starts_with('@').then_some(e.page_bounds));
            })
            .p_2(),
    )
    .child(when(
        move || caret.get().is_some(),
        move || {
            overlay()
                .anchor_bounds(move || caret.get().unwrap_or_default())
                .placement(Placement::Bottom)
                .align(Align::Start)
                .offset(px(4.0))
                .child(text("@ada"))
                .child(text("@grace"))
        },
    ))
```

```tsx tabs
import { type Bounds, Overlay, Text, View, signal } from "nsh";
import { Input } from "nsh/base";

const draft = signal("");
const end = signal(0);
const caret = signal<Bounds | null>(null);

<View>
  <Input
    multiline
    value={draft()}
    onChange={({ value }) => draft.set(value)}
    onSelectionChange={(e) => end.set(e.end)}
    onCaretMove={(e) => {
      // Suggestions while the word before the caret starts with "@".
      const word = draft().slice(0, end()).split(/\s/).pop() ?? "";
      caret.set(word.startsWith("@") ? e.pageBounds : null);
    }}
    class="p-2"
  />
  <If when={caret()}>
    <Overlay anchor={caret()} placement="bottom" align="start" offset={4}>
      <Text>@ada</Text>
      <Text>@grace</Text>
    </Overlay>
  </If>
</View>;
```

`pageBounds` est l'endroit où se trouvait le curseur à l'arrivée de l'événement : une page qui défile sous l'input déplace l'input mais
n'envoie aucun événement ; fermez donc les suggestions au défilement, ou ancrez-les à l'input lui-même.

<a id="pasting-images-and-files"></a>

## Coller des images et des fichiers

L'événement de collage (`.on_paste(..)`, TSX `onPaste`) indique ce que l'utilisateur a collé, via le raccourci clavier, le Coller d'un menu ou l'image d'un clavier : `text`, `html`, `files` et `uris`. `html` est le même contenu avec sa mise en forme, tel qu'un navigateur, une suite bureautique ou un éditeur de texte riche l'a copié (sur Linux et le web). `files` correspond à ce que le presse-papiers contenait comme données, comme une capture d'écran ou une image copiée depuis une page ou une autre app : des `File`s dont l'app peut téléverser ou afficher les octets, nommés
`image.png` (ou du type qu'il est). `uris` correspond aux URL `file:` de fichiers copiés dans un gestionnaire de fichiers, comme celles d'un glisser-déposer de fichiers.
La plateforme lit le presse-papiers au moment où l'utilisateur colle, et seulement alors.

L'input insère lui-même le texte collé, comme toujours : l'événement arrive avant le `onChange` de ce texte.
Les images et les fichiers ne sont jamais insérés, puisqu'un input contient du texte. Avec `pasteBehavior` `"report"`, l'input n'insère
rien, et c'est l'app qui décide de ce que fait un collage : envoyer un long texte en pièce jointe, ou insérer une version nettoyée.
L'input décide immédiatement, à partir de la prop, car le système le lui demande sur-le-champ.

```rust tabs
let attachments = signal(Vec::<PastedFile>::new());

input()
    .multiline(true)
    .placeholder("Message")
    .on_paste(move |e: &PasteEvent| {
        // A screenshot pasted into the message goes along as an image.
        attachments.update(|a| a.extend(e.files.iter().cloned()));
    })
    .p_2()
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

const attachments = signal<File[]>([]);

<Input
  multiline
  placeholder="Message"
  onPaste={(e) => {
    // A screenshot pasted into the message goes along as an image.
    attachments.update((a) => [...a, ...e.files]);
  }}
  class="p-2"
/>;
```

Téléversez un fichier collé comme n'importe quel `File`, avec `fetch` et `FormData` (`form.append("image", file)`) ; ses octets restent
natifs jusqu'à leur envoi. Sur Android, les claviers qui insèrent des images (GIF, stickers) les signalent de la même façon. Sur
Linux, le presse-papiers est lu de manière asynchrone, l'événement peut donc arriver après le `onChange` du texte qu'il insère.
Les inputs masqués sur macOS conservent le collage propre d'AppKit et ne signalent rien.

<a id="multiline-inputs-that-grow"></a>

## Inputs multilignes qui grandissent

Un input multiligne (`.multiline(true)`, TSX `multiline`) fait défiler son texte dans sa propre hauteur. Pour le faire grandir avec son contenu, réinjectez la hauteur de l'événement de taille du contenu (`.on_content_size_change(..)`, TSX `onContentSizeChange`) dans son style, avec une limite :

```rust tabs
let height = signal(px(0.0));

input()
    .multiline(true)
    .placeholder("Write a comment")
    .on_content_size_change(move |e: &Size<Points>| height.set(e.height.min(px(120.0))))
    .text_size(px(16.0))
    .p(px(10.0))
    .border_1()
    .border_color(rgb(0xd0d7de))
    .rounded(px(10.0))
    .h(move || height.get().max(px(20.0)) + px(20.0))
```

```tsx tabs
const height = signal(0);

<Input
  multiline
  placeholder="Write a comment"
  onContentSizeChange={({ size }) => height.set(Math.min(size.height, 120))}
  style={{ fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 10, height: Math.max(height(), 20) + 20 }}
/>
```

La hauteur signalée est celle du texte (à la largeur de l'input) ; ajoutez donc vous-même le padding vertical, comme ci-dessus.
<a id="keeping-inputs-above-the-keyboard"></a>

## Garder les champs de saisie au-dessus du clavier

<a id="inside-scroll-views-automatic"></a>

### Dans les scroll views : automatique

Lorsque le clavier apparaît au-dessus d'un champ de saisie ayant le focus et situé dans une scroll view ou une liste, NSH donne à la scroll view une marge intérieure basse aussi haute que le clavier et fait défiler le champ jusqu'à le rendre visible. Cela se fait nativement et ne demande aucun code. Un long formulaire n'est simplement qu'une scroll view de champs de saisie :

```rust tabs
scroll()
    .flex_1()
    .keyboard_dismiss_mode(KeyboardDismissMode::OnDrag)
    .keyboard_taps(KeyboardTaps::Handled)
    .child(view().p(px(16.0)).gap(px(12.0)) /* inputs */)
```

```tsx tabs
<Scroll style={{ flex: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
  <View style={{ padding: 16, gap: 12 }}>
    {/* inputs */}
  </View>
</Scroll>
```

Le mode de fermeture (`.keyboard_dismiss_mode(..)`, TSX `keyboardDismissMode` : none, on drag, interactive) permet de masquer le clavier en faisant glisser le formulaire ; les taps gérés (`.keyboard_taps(KeyboardTaps::Handled)`, TSX `keyboardShouldPersistTaps="handled"`) permettent à un tap sur un bouton d'être pris en compte pendant que le clavier est affiché, au lieu de se contenter de le fermer. Voir [Défilement](./scrolling.md#scroll-views-and-the-keyboard).

<a id="content-outside-scroll-views"></a>

### Contenu en dehors des scroll views

Sur iOS, lorsque le clavier couvrirait un champ de saisie ayant le focus et ne se trouvant dans aucune scroll view, NSH déplace le contenu de son écran (ou de sa boîte de dialogue) vers le haut jusqu'à ce que le champ soit juste au-dessus du clavier, en suivant la courbe d'animation du clavier, puis le ramène vers le bas quand le clavier se masque ou que le champ perd le focus, comme le fait SwiftUI (sur Android, une fenêtre en mode `adjustPan` est décalée par le système). NSH ne le fait que pour ce que la mise en page de l'application laisse couvert : une application qui ménage elle-même la place, comme ci-dessous, n'est pas déplacée une seconde fois.

Cela déplace toute la page. Une barre de message ancrée en bas d'un écran devrait plutôt suivre le clavier pendant que le contenu au-dessus se réduit : ajoutez au bas de l'écran un padding égal à `env(keyboard-inset-height)` en CSS (`paddingBottom: "env(keyboard-inset-height)"`, Tailwind `pb-[env(keyboard-inset-height)]`, Rust `.pb_keyboard()`) : cela ménage en bas un espace aussi haut que le clavier, animé nativement avec le clavier.

```rust tabs
use nsh_core::prelude::*;

pub fn chat_screen() -> impl IntoElement {
    let draft = signal(String::new());
    let send = move || {
        let text = draft.get();
        if !text.trim().is_empty() {
            log::info!("send {text}");
        }
        draft.set(String::new());
    };
    view()
        .flex_1()
        .pb_keyboard()
        .child(scroll().flex_1().keyboard_dismiss_mode(KeyboardDismissMode::Interactive) /* messages */)
        .child(
            view()
                .flex_row()
                .p(px(8.0))
                // Above the home indicator, unless the keyboard covers it.
                .pb(move || {
                    px(8.0) + if keyboard_height() > px(0.0) { px(0.0) } else { safe_area().bottom }
                })
                .child(
                    input()
                        .value(move || draft.get())
                        .on_change(move |t: &str| draft.set(t.to_owned()))
                        .multiline(true)
                        .submit_behavior(SubmitBehavior::Submit)
                        .return_key_type(ReturnKeyType::Send)
                        .on_submit(move |_: &str| send())
                        .placeholder("Message")
                        .flex_1()
                        .max_h(px(120.0)),
                ),
        )
}
```

```tsx tabs
import { Scroll, signal, View, keyboardFrame, safeAreaInsets } from "nsh";
import { Input } from "nsh/base";

function ChatScreen() {
  const insets = safeAreaInsets();
  const draft = signal("");
  const send = () => {
    if (draft().trim()) console.log("send", draft());
    draft.set("");
  };
  return (
    <View style={{ flex: 1, paddingBottom: "env(keyboard-inset-height)" }}>
      <Scroll style={{ flex: 1 }} keyboardDismissMode="interactive">
        {/* messages */}
      </Scroll>
      <View
        style={{
          flexDirection: "row",
          padding: 8,
          // Above the home indicator, unless the keyboard covers it.
          paddingBottom: 8 + (keyboardFrame().height > 0 ? 0 : insets().bottom),
        }}
      >
        <Input
          value={draft()}
          onChange={({ value }) => draft.set(value)}
          multiline
          submitBehavior="submit"
          returnKeyType="send"
          onSubmit={send}
          placeholder="Message"
          style={{ flex: 1, maxHeight: 120 }}
        />
      </View>
    </View>
  );
}
```

Le padding (`.pb_keyboard()`) réduit le contenu au-dessus tandis que l'arrière-plan atteint le bas de l'écran ; une marge basse (`marginBottom: "env(keyboard-inset-height)"`, `.mb_keyboard()`) fait terminer toute la vue au sommet du clavier. `calc(env(keyboard-inset-height) + <length>)` (Rust `.pb_keyboard_plus(..)`, `.mb_keyboard_plus(..)`) ajoute une longueur, par exemple moins la hauteur d'une barre d'onglets située sous la vue.

La hauteur complète convient à une vue qui atteint le bas de la surface, comme le fait le contenu d'un écran. Sur un hôte Android dont la fenêtre est redimensionnée pour le clavier, c'est la fenêtre elle-même qui rétrécit et la variable vaut 0. Voir [Clavier](../elements/keyboard.md).

<a id="the-keyboard-accessor"></a>

### L'accesseur du clavier

`keyboard_height()` et `keyboard_duration()` en Rust, ainsi que `keyboardFrame()` depuis `nsh` en TSX (un `{ height, duration }`), sont réactifs : ils donnent jusqu'où le clavier s'avance dans la surface (0 lorsqu'il est masqué ; la zone sûre inférieure située sous lui est incluse) et la durée de son animation en millisecondes. Utilisez-les pour tout besoin personnalisé : masquer un bouton flottant pendant la saisie, ou dimensionner un panneau. Ce qui change avec eux dans la mise à jour où démarre le mouvement du clavier suit le clavier, sur sa courbe et chronométré à partir du moment où il a commencé à bouger (`LayoutCurve::Keyboard`), comme le fait `env(keyboard-inset-height)` ; une animation que l'application configure pour cette mise à jour (`LayoutAnimation.configureNext`) prévaut.

```rust tabs
view().child(when(
    || keyboard_height() == px(0.0),
    || view().absolute().right(px(16.0)).bottom(px(16.0)), /* … */
))
```

```tsx tabs
import { View, keyboardFrame } from "nsh";

<If when={keyboardFrame().height === 0}>
  <View style={{ position: "absolute", right: 16, bottom: 16 }}>…</View>
</If>
```

<a id="a-bar-over-the-keyboard-ios-inputaccessoryview"></a>

## Une barre au-dessus du clavier (iOS) : InputAccessoryView

`input_accessory_view(id)` en Rust et `InputAccessoryView` depuis `nsh/mobile` en TSX affichent une barre attachée au sommet du clavier tant qu'un champ de saisie qui la désigne a le focus : le `inputAccessoryView` d'iOS. Elle suit nativement le clavier, y compris pendant une fermeture interactive. Elle ne prend aucune place là où elle est placée dans l'arbre ; les champs de saisie y font référence par son id (`.input_accessory(id)`, TSX `ios={{ inputAccessoryViewID }}` et `nativeID`) :

```rust tabs
use nsh_core::prelude::*;

pub fn note() -> impl IntoElement {
    let content = signal(String::new());
    let field = element_ref();
    view()
        .p(px(16.0))
        .child(
            input()
                .element_ref(&field)
                .value(move || content.get())
                .on_change(move |t: &str| content.set(t.to_owned()))
                .input_accessory("note-bar")
                .placeholder("A note"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf6f8fa)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(8.0))
                    .child(
                        text(move || format!("{} characters", content.with(|t| t.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x57606a)),
                    )
                    .child(
                        text("Done")
                            .on_press(move || field.blur())
                            .text_color(rgb(0x0969da))
                            .font_weight(FontWeight::SEMIBOLD),
                    ),
            ),
        )
}
```

```tsx tabs
import { type InputRef, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { InputAccessoryView } from "nsh/mobile";

function Note() {
  const text = signal("");
  let input!: InputRef;
  return (
    <View style={{ padding: 16 }}>
      <Input
        ref={input}
        value={text()}
        onChange={({ value }) => text.set(value)}
        ios={{ inputAccessoryViewID: "note-bar" }}
        placeholder="A note"
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f6f8fa" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 8 }}>
          <Text style={{ flex: 1, color: "#57606a" }}>{text().length} characters</Text>
          <Text onPress={() => input.blur()} style={{ color: "#0969da", fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

La barre est aussi large que la fenêtre et aussi haute que son contenu. Les input accessories sont propres à iOS : sur Android, la barre est une vue vide et masquée, il faut donc y placer ces contrôles ailleurs, par exemple au-dessus du champ de saisie (`os() == Os::Android` en Rust, `platform.os === "android"` en TSX).

<a id="related"></a>

## Voir aussi

- [`Input`](../elements/input.md) : la référence de l'élément.
- [Clavier](../elements/keyboard.md) et [`Keyboard`](../modules/nsh.md#keyboard-and-keyboardframe).
- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) : `InputAccessoryView`.
- [Défilement](./scrolling.md#scroll-views-and-the-keyboard) : fermeture du clavier et taps dans les scroll views.
