---
title: "Input"
description: "Le champ de texte natif : texte contrôlé et non contrôlé, claviers, remplissage automatique, sélection, champs multilignes et focus."
group: base
demo: el-input
source_hash: 1f03d974252777de
---


# Input

`Input` est un champ de texte natif : un UITextField (une seule ligne) ou un UITextView (plusieurs lignes) sur iOS et Mac Catalyst, un
EditText sur Android. La saisie, le curseur, la sélection, la correction automatique et le remplissage automatique sont ceux de la plateforme. En Rust, on en crée un
avec `nsh_base::input()`, en TSX avec `<Input>` depuis `nsh/base`.

```rust tabs
use nsh_base::input;
use nsh_core::prelude::*;

fn name_field() -> impl IntoElement {
    let name = signal(String::new());
    input()
        .value(name)
        .on_change(move |text: &str| name.set(text.to_string()))
        .placeholder("Your name")
        .auto_capitalize(AutoCapitalize::Words)
        .return_key_type(ReturnKeyType::Done)
        .text_base()
        .p_3()
        .border_1()
        .border_color(rgb(0xd0d7de))
        .rounded(px(8.0))
}
```

```tsx tabs
import { signal } from "nsh";
import { Input } from "nsh/base";

function NameField() {
  const name = signal("");
  return (
    <Input
      value={name()}
      onChange={({ value }) => name.set(value)}
      placeholder="Your name"
      autoCapitalize="words"
      returnKeyType="done"
      style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: "#d0d7de", borderRadius: 8 }}
    />
  );
}
```

<a id="controlled-and-uncontrolled"></a>

## Contrôlé et non contrôlé

- **Contrôlé** : passez `value` et mettez-le à jour dans `onChange`. L'application peut réécrire ce que l'utilisateur a saisi (le tronquer, le formater) : le texte affiche la modification immédiatement et est corrigé à l'arrivée du nouveau `value`. Chaque modification native porte un compteur, et un `value` de l'application est appliqué lorsqu'il repose sur la dernière modification, de sorte que la saisie la plus récente l'emporte toujours sur une mise à jour lente.
- **Non contrôlé** : passez `defaultValue` (`.default_value(..)`, ou rien) et lisez le texte depuis `onChange` ou
  `onSubmit`.

Les règles qui doivent s'appliquer pendant la saisie sont des props, traitées nativement : `maxLength` limite la longueur et
`submitBehavior` décide de ce que fait la touche Retour. Voir [formulaires et clavier](../docs/forms-and-keyboard.md).

## Props

En plus des [props communes](./index.md#common-props) (avec `style` typé comme `TextStyle` : la police, la couleur, l'alignement et les
styles de vue s'appliquent) :

<a id="text"></a>

### Texte

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `string` | | Le texte, contrôlé par l'application. |
| `defaultValue` | `.default_value(..)` | `string` | | Le texte initial. |
| `placeholder` | `.placeholder(..)` | `string` | | Affiché tant que le champ est vide. |
| `multiline` | `.multiline(..)` | `boolean` | `false` | Plusieurs lignes ; Retour insère un saut de ligne, sauf si `submitBehavior` indique le contraire. |
| `scrollbar` | `.scrollbar(..)` | `boolean \| ScrollbarTheme` | `true` | La barre de défilement d'un champ multiligne : l'indicateur de la plateforme, ou la barre intégrée de l'application dès qu'elle en a défini une ([Scrollbar](./scrollbar.md#built-in-bars)) ; un objet constitue un thème à part entière, `false` aucun. |
| `maxLength` | `.max_length(..)` | `number` | | Le nombre maximal de caractères que l'utilisateur peut saisir. |
| `readonly` | `.readonly(..)` | `boolean` | `false` | L'utilisateur peut sélectionner et copier le texte, mais pas le modifier. |
| `masked` | `.masked(..)` | `boolean` | `false` | Le texte est masqué (mots de passe). |
| `allowFontScaling` | | `boolean` | `true` | Suit la taille de texte du système. |
| `maxFontSizeMultiplier` | | `number` | `0` | La borne supérieure de l'échelle du système (0 signifie aucune). |

<a id="keyboard"></a>

### Clavier

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `keyboardType` | `.keyboard_type(KeyboardType::Email)` | `"default" \| "number-pad" \| "decimal-pad" \| "numeric" \| "numbers-and-punctuation" \| "email-address" \| "phone-pad" \| "url"` | `"default"` | La disposition du clavier ([les valeurs](../docs/forms-and-keyboard.md#keyboards-and-autofill) ; `numbers-and-punctuation` comporte un signe moins sur iOS). |
| `returnKeyType` | `.return_key_type(ReturnKeyType::Next)` | `"default" \| "done" \| "go" \| "next" \| "search" \| "send"` | `"default"` | Le libellé de la touche Retour. |
| `autoCapitalize` | `.auto_capitalize(AutoCapitalize::None)` | `"none" \| "sentences" \| "words" \| "characters"` | `"sentences"` | Mise en majuscules automatique. |
| `autoCorrect` | `.auto_correct(..)` | `boolean` | `true` | Les corrections du système. |
| `autoComplete` | `.auto_fill(AutoFill::OneTimeCode)` | `AutoComplete \| TextContentType` | | Ce que contient le champ, pour le remplissage automatique sur iOS, Android et le web : `"username"`, `"current-password"`, `"new-password"`, `"one-time-code"`, `"email"`, `"tel"`, `"postal-code"`, `"cc-number"`, `"off"`, … |
| `pasteBehavior` | `.paste_behavior(PasteBehavior::Report)` | `"insert" \| "report"` | `"insert"` | Ce que fait un collage : `"insert"` insère le texte collé, `"report"` n'insère rien, pour que l'application traite ce que `onPaste` signale. Les images et les fichiers ne sont jamais insérés. |
| `submitBehavior` | `.submit_behavior(SubmitBehavior::Submit)` | `"submit" \| "blurAndSubmit" \| "newline"` | `"blurAndSubmit"` (une ligne), `"newline"` (multiligne) | Ce que fait Retour : `"submit"` signale `onSubmit` et conserve le focus, `"blurAndSubmit"` retire aussi le focus, `"newline"` insère un saut de ligne (multiligne ; un champ d'une seule ligne valide). Un champ multiligne qui valide accepte tout de même les sauts de ligne avec Maj+Retour ou Option / Alt+Retour sur les claviers physiques. `"submit"` garde le clavier affiché (par exemple pour envoyer plusieurs messages). |
| `autoFocus` | `.auto_focus(..)` | `boolean` | `false` | Reçoit le focus à son apparition. |

<a id="caret-and-selection"></a>

### Curseur et sélection

| Prop | Rust | Type | Description |
|---|---|---|---|
| `caret` | `.caret(..)` | `boolean` | Le curseur est dessiné (`true` par défaut ; `false` le masque). |
| `selectedRange` | `.selected_range((start, end))` | `{ start: number; end?: number }` | La sélection contrôlée, en unités UTF-16 ; `end` vaut par défaut `start` (un curseur). |

Le curseur clignote tant que sa fenêtre est affichée et active. Dans les fenêtres GPUI sous Linux, il reste affiché après dix secondes
sans saisie ni déplacement, comme dans les applications GTK, de sorte qu'un champ ayant le focus et laissé seul ne coûte aucune image.

<a id="colors"></a>

### Couleurs

Les couleurs du placeholder, du curseur et de la surbrillance de la sélection sont des clés de style, avec leurs classes Tailwind, et
des méthodes en Rust (UIKit teinte le curseur et la sélection avec une seule couleur, celle du curseur lorsqu'elle est définie) :

| Clé de style | Rust | Classe | Description |
|---|---|---|---|
| `placeholderColor` | `.placeholder_color(..)` | `placeholder:text-*` | La couleur du placeholder. |
| `caretColor` | `.caret_color(..)` | `caret-*` | La couleur du curseur. |
| `selectionColor` | `.selection_color(..)` | `selection:text-*` | La couleur de la surbrillance de la sélection. |

```rust tabs
input()
    .placeholder("Search")
    .text_color(rgb(0x18181b))
    .placeholder_color(rgb(0x9ca3af))
    .caret_color(rgb(0x2563eb))
    .selection_color(rgb(0x93c5fd))
```

```tsx tabs
<Input placeholder="Search" class="text-zinc-900 placeholder:text-zinc-400 selection:text-blue-600" />
<Input placeholder="Search" style={{ placeholderColor: "#9ca3af", caretColor: "#2563eb", selectionColor: "#93c5fd" }} />
```

### iOS

| Clé `ios` | Rust | Type | Description |
|---|---|---|---|
| `textContentType` | `.auto_fill(..)` | `AutoComplete \| TextContentType` | Les noms d'iOS pour `autoComplete` (`"oneTimeCode"`, `"newPassword"`, …). |
| `inputAccessoryViewID` | `.input_accessory(id)` | `string` | Le `nativeID` d'un `InputAccessoryView` ([`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview)) affiché au-dessus du clavier tant que le champ a le focus. |
| `keyboardAppearance` | `.keyboard_appearance(KeyboardAppearance::Dark)` | `"default" \| "light" \| "dark"` | L'apparence du clavier ; `"default"` suit l'apparence du système. Les claviers d'Android suivent le thème du système. |

```rust tabs
use nsh_core::element::AutoFill;

input().auto_fill(AutoFill::OneTimeCode).keyboard_type(KeyboardType::Number)
```

```tsx tabs
<Input autoComplete="one-time-code" keyboardType="number-pad" ios={{ textContentType: "oneTimeCode" }} />
```

<a id="events"></a>

## Événements

| Événement | Rust | Charge utile | Quand |
|---|---|---|---|
| `onChange` | `.on_change(\|text: &str\| ..)` | `{ value }` | L'utilisateur a modifié le texte : `value` est le texte actuel. |
| `onSubmit` | `.on_submit(\|text: &str\| ..)` | `{ text }` | La touche Retour a été pressée dans un champ qui valide (une seule ligne, ou `submitBehavior` `"submit"` / `"blurAndSubmit"`). |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | aucune | Le champ a gagné / perdu le focus. |
| `onSelectionChange` | `.on_selection_change(\|s: &Selection\| ..)` | `{ start, end }` | Le curseur ou la sélection a bougé (unités UTF-16). |
| `onPaste` | `.on_paste(\|e: &PasteEvent\| ..)` | `{ text, html, files, uris }` | L'utilisateur a collé : le texte, sa mise en forme en HTML (Linux, web), les images (une capture d'écran) sous forme de `File`, les URL `file:` des fichiers locaux. Avant le `onChange` du texte qu'il insère ([formulaires et clavier](../docs/forms-and-keyboard.md#pasting-images-and-files)). |
| `onCaretMove` | `.on_caret_move(\|e: &CaretEvent\| ..)` | `{ bounds, pageBounds }` | Le curseur a bougé, avec la sélection ou lorsque le texte défile ou passe à la ligne : `bounds` est sa position dans le champ, `pageBounds` dans la fenêtre, le `anchor` d'un `Overlay` ([formulaires et clavier](../docs/forms-and-keyboard.md#the-caret)). |
| `onKeyPress` | `.on_key_press(\|key: &str\| ..)` | `{ key }` | Avant que le texte ne change : `key` est le texte saisi, `"Backspace"` ou `"Enter"`. |
| `onContentSizeChange` | `.on_content_size_change(\|size: &Size<Points>\| ..)` | `{ size }` | La taille du texte a changé (à la largeur du champ s'il est multiligne), au fil de la saisie ; un champ vide signale une ligne vide, quel que soit son placeholder. |
| `onCompositionChange` | `.on_composition_change(\|e: &Composition\| ..)` | `{ composing, text }` | Une composition de méthode de saisie a commencé, changé ou pris fin : `text` est ce qui est en cours de composition (pinyin avant le choix d'un caractère, kana avant la conversion), `""` une fois terminée. Le texte validé parvient à `onChange` avant la fin. |

Un champ multiligne qui s'agrandit avec son texte :

```rust tabs
let height = signal(px(40.0));

input()
    .multiline(true)
    .on_content_size_change(move |size: &Size<Points>| {
        height.set(px((size.height.0 + 16.0).clamp(40.0, 120.0)));
    })
    .h(move || height.get())
    .px_3()
    .py_2()
```

```tsx tabs
const height = signal(40);
<Input
  multiline
  onContentSizeChange={({ size }) => height.set(Math.min(120, Math.max(40, size.height + 16)))}
  style={{ height: height(), paddingHorizontal: 12, paddingVertical: 8 }}
/>;
```

<a id="ref-methods"></a>

## Méthodes de ref

| Méthode | Rust | Description |
|---|---|---|
| `focus()` | `focus()` | Donne le focus au champ et affiche le clavier. |
| `blur()` | `blur()` | Lui retire le focus. |
| `setSelection(start, end?)` | `set_selection(start, end)` | Sélectionne `start..end` (unités UTF-16) ; un curseur lorsqu'ils sont égaux. |

Passer le focus au champ suivant avec Retour :

```rust tabs
use nsh_core::element::AutoFill;

let password = element_ref();

view()
    .child(input().return_key_type(ReturnKeyType::Next).on_submit(move |_: &str| password.focus()))
    .child(input().element_ref(&password).masked(true).auto_fill(AutoFill::Password))
```

```tsx tabs
let password!: InputRef;
<>
  <Input returnKeyType="next" onSubmit={() => password.focus()} />
  <Input ref={password} masked autoComplete="current-password" />
</>;
```

`Keyboard.dismiss()` depuis `nsh` (`dismiss_keyboard()` en Rust) masque le clavier, quel que soit le champ qui l'a.

<a id="platform-notes"></a>

## Notes par plateforme

- Sur macOS, le texte d'une seule ligne, les placeholders et les curseurs partagent les métriques de police du champ natif et sont centrés ensemble
  dans la boîte de contenu. `lineHeight` participe à la mise en page ; les éditeurs multilignes l'utilisent aussi pour l'espacement des paragraphes.
- Les champs placés dans une [scroll view](./scroll.md#keyboard) restent dégagés du clavier de façon native. Ailleurs, utilisez
  un padding ou une marge en bas égal à [`env(keyboard-inset-height)`](./keyboard.md).
- `disabled` désactive le champ (pas de focus) en plus d'appliquer les styles désactivés ; un champ `readonly` conserve son
  focus et sa sélection.
- `inputAccessoryViewID` s'applique sur iOS, où le clavier possède une barre d'accessoires.
