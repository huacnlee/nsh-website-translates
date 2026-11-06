---
title: "OtpInput"
description: "Le composant OtpInput : un code à usage unique numérique de longueur fixe, saisi, collé ou rempli automatiquement dans un seul champ natif, affiché en cellules, en groupes et avec un curseur que l'application stylise."
group: base
demo: el-otp-input
source_hash: 80ea5e26b79a21ac
---

# OtpInput

Un champ de code à usage unique accepte un nombre fixe de chiffres (un code de vérification reçu par SMS, le code d'un authentificateur) et les affiche dans des cellules. Il gère le comportement : un seul champ de texte natif, transparent et placé au-dessus des cellules, reçoit le clavier. La saisie, les méthodes de saisie, le collage, le pavé numérique et le remplissage automatique de code du système (« Depuis Messages » sur iOS, les suggestions de SMS sur Android) sont donc ceux de la plateforme, et les lecteurs d'écran ne trouvent qu'un seul champ de texte. Seuls les chiffres sont acceptés, jusqu'à `length` ; Retour arrière supprime le dernier, et `onComplete` indique quand le code est complet. L'apparence est celle de l'app : un `OtpInput` n'a ni couleurs, ni tailles, ni bordures, ni libellé propres. Ses parties sont les cellules, les groupes dans lesquels elles sont réparties et un curseur, et l'app style chacune d'elles.

```rust tabs
use nsh_base::{OtpInputCompleteEvent, otp_input, theme};
use nsh_core::prelude::*;

fn verification(verify: impl Fn(&str) + 'static) -> impl IntoElement {
    let code = signal(SharedString::default());
    otp_input()
        .length(6)
        .groups(2)
        .value(move || Some(code.get()))
        .on_change(move |next: &SharedString| code.set(next.clone()))
        .on_complete(move |e: &OtpInputCompleteEvent| verify(&e.value))
        .accessibility_label("Verification code, 6 digits")
        .flex_row()
        .gap_3()
        .group_style(|s| s.flex_row().gap_2())
        .cell_style(|s| {
            s.w(px(40.0))
                .h(px(48.0))
                .items_center()
                .justify_center()
                .rounded(px(8.0))
                .border_1()
                .border_color(move || theme().input)
                .text_xl()
        })
        // The cell that takes the next digit, while the code has the focus,
        // and the cells that hold a digit.
        .cell_class("focus:border-ring data-filled:bg-muted")
        .caret_style(|s| s.w(px(2.0)).h(px(24.0)).bg(move || theme().foreground))
}
```

```tsx tabs
import { mount, signal } from "nsh";
import { OtpInput } from "nsh/base";

function App() {
  const code = signal("");
  const verify = (value: string) => console.log(`checking ${value}`);
  return (
    <OtpInput
      length={6}
      groups={2}
      value={code()}
      onChange={({ value }) => code.set(value)}
      onComplete={({ value }) => verify(value)}
      accessibilityLabel="Verification code, 6 digits"
      class="flex-row gap-3"
      groupClass="flex-row gap-2"
      cellClass="w-10 h-12 items-center justify-center rounded-lg border border-input text-xl focus:border-ring data-filled:bg-muted"
      caretClass="w-0.5 h-6 bg-foreground"
    />
  );
}

mount(App);
```

`OtpInput` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `otp_input()` en crée un avec un setter par prop (`.length(..)`, `.cell_style(..)`), une méthode d'écoute par événement (`.on_complete(..)`) et les méthodes de style typées pour le champ lui-même.

<a id="the-code"></a>

## Le code

- **Contrôlé** : passez `value` et mettez-le à jour dans `onChange`. Les cellules affichent le `value` transmis par l'app, tel quel ; une valeur définie par l'app (effacer le code après une erreur) n'est jamais signalée.
- **Non contrôlé** : passez `defaultValue` (ou rien), et lisez le code depuis `onChange` et `onComplete`.

Ce que fait l'utilisateur est lu depuis le champ, le curseur étant toujours à la fin :

| L'utilisateur | Le code |
|---|---|
| Saisit un chiffre | Il est ajouté à la fin tant que le code est plus court que `length` ; une fois le code complet, rien ne change. |
| Saisit un chiffre pleine chasse (`０`–`９`, celui d'une méthode de saisie d'Asie de l'Est) | Le chiffre ASCII est ajouté. |
| Saisit autre chose | Rien ne change ; le champ l'ignore. |
| Appuie sur Retour arrière | Le dernier chiffre est supprimé. |
| Colle un texte, ou le système remplit automatiquement un code | Ses chiffres sont ajoutés de la même manière ; un texte contenant `length` chiffres ou plus (`123-456`, le code d'un message) remplace le code par ses `length` premiers chiffres. |

`onChange` signale chaque changement avec le nouveau code, et `onComplete` le suit lorsque le changement a rempli la dernière cellule ; c'est là que l'app vérifie le code.

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `length` | `.length(..)` | `number` | requis | Le nombre de chiffres du code : une cellule chacun. |
| `value` | `.value(..)` | `string` | aucun | Le code, contrôlé par l'app (affiché tel quel). Sans cette prop, le champ conserve son propre code. |
| `defaultValue` | `.default_value(..)` | `string` | aucun | Le code initial, tant que `value` n'est pas défini. |
| `masked` | `.masked(..)` | `boolean` | `false` | Les cellules remplies affichent une puce au lieu de leur chiffre, et le champ est un champ sécurisé : les lecteurs d'écran ne lisent pas le code, et le système l'exclut de ses suggestions. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Ni focus ni édition ; les styles `disabled:` s'appliquent au champ et à ses parties, et les lecteurs d'écran indiquent qu'il est grisé. |
| `groups` | `.groups(..)` | `number` | `1` | Le nombre de groupes en lesquels les cellules sont réparties, aussi équitablement que possible (3 + 3 pour six chiffres en deux) ; au moins un, au plus un par cellule. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Ce que les lecteurs d'écran annoncent pour le champ : à quoi sert le code et combien de chiffres il comporte. |
| `cellClass`, `cellStyle` | `.cell_class(..)`, `.cell_style(\|s\| ..)` | `string`, `StyleProp<TextStyle>` | aucun | Chaque cellule : sa taille, sa bordure et son texte (`color`, `fontSize`, que son chiffre hérite) ; `focus:` et `data-filled:` stylent ses états (voir Parties). |
| `groupClass`, `groupStyle` | `.group_class(..)`, `.group_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Chaque groupe de cellules (`flex-row gap-2`). |
| `caretClass`, `caretStyle` | `.caret_class(..)`, `.caret_style(\|s\| ..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le curseur : sa largeur, sa hauteur et sa couleur. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | Le champ lui-même : la ligne (ou la colonne) autour de ses groupes. |

<a id="events"></a>

## Événements

| Événement | Rust | Données | Quand |
|---|---|---|---|
| `onChange` | `.on_change(\|value: &SharedString\| ..)` | `(e: { value: string })` | L'utilisateur a modifié le code : saisie, suppression, collage ou remplissage automatique. |
| `onComplete` | `.on_complete(\|e: &OtpInputCompleteEvent\| ..)` | `{ value }` | La modification de l'utilisateur a rempli la dernière cellule, après son `onChange`. |
| `onFocus` / `onBlur` | `.on_focus` / `.on_blur` | aucune | Le champ a pris / perdu le focus du clavier. |

<a id="ref-methods"></a>

## Méthodes de ref

| Méthode | Rust | Description |
|---|---|---|
| `focus()` | `focus()` (`OtpInputApi`) | Prend le focus du clavier et affiche le clavier logiciel, comme un appui sur le champ. |

<a id="parts"></a>

## Parties

| Partie | Contenue dans | Stylée avec |
|---|---|---|
| Le champ | | `class`, `style` |
| Un groupe | le champ, un par groupe | `groupClass`, `groupStyle` ; `disabled:` suit le champ |
| Une cellule | son groupe, une par chiffre | `cellClass`, `cellStyle` ; `focus:` sur la cellule qui recevra le prochain chiffre tant que le champ a le focus, `data-filled:` sur chaque cellule qui contient un chiffre, `disabled:` suit le champ |
| Le chiffre | une cellule remplie | les styles de texte de la cellule (`text-xl`, `font-semibold`) ; `•` tant que `masked` |
| Le curseur | la cellule vide qui recevra le prochain chiffre, tant que le champ a le focus | `caretClass`, `caretStyle` |

La cellule qui reçoit le prochain chiffre est celle qui suit le dernier chiffre, ou la dernière cellule une fois le code complet. Le curseur clignote comme celui d'un champ de texte (une demi-seconde allumé, une demi-seconde éteint, et fixe un instant après chaque modification), par son opacité, de façon native, tout en gardant sa place dans la mise en page ; avec la réduction des animations, il reste immobile. Un appui n'importe où sur le champ lui donne le focus : le champ de texte est placé au-dessus des cellules.

Une cellule qui contient un chiffre, masqué ou non, porte l'attribut `data-filled`, de sorte que les classes `data-filled:` stylent les cellules que l'utilisateur a remplies (une bordure plus marquée, un fond : `data-filled:border-foreground data-filled:bg-muted`), à la manière dont shadcn/ui écrit ses états. Avec `group` dans `cellClass`, les classes `group-data-filled:` stylent l'intérieur d'une cellule remplie, c'est-à-dire son chiffre. Les cellules changent de classes, jamais de contenu, de sorte qu'une touche restyle une seule cellule et ne redessine rien d'autre.

<a id="accessibility"></a>

## Accessibilité

- Les lecteurs d'écran trouvent un seul champ de texte, nommé par `accessibilityLabel` (indiquez à quoi sert le code et sa longueur : « Code de vérification, 6 chiffres ») avec le code comme valeur ; les cellules leur sont masquées. Tant que `masked`, le champ est sécurisé, donc le code n'est pas lu à voix haute.
- Le clavier est celui de la plateforme : le pavé numérique sur téléphone, n'importe quel clavier sur ordinateur (seuls les chiffres sont acceptés), et Retour arrière. La touche Tab atteint le champ comme n'importe quel champ de texte.
- Tant que `disabled`, il ne prend pas le focus, et les lecteurs d'écran indiquent qu'il est grisé.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.

<a id="platform-notes"></a>

## Notes de plateforme

- iOS : le champ est un champ de code (`textContentType` `oneTimeCode`), de sorte que la barre QuickType propose un code provenant de Messages ou de Mail ; le pavé numérique s'affiche. Un champ `masked` repart de zéro lorsqu'on y saisit à nouveau du texte après qu'il a perdu le focus, comme les champs sécurisés d'iOS.
- Android : `autofillHints` `smsOTPCode` permet au clavier et au service de remplissage automatique de proposer le code d'un SMS ; le clavier numérique s'affiche.
- macOS, Windows, Linux et le web : la saisie et le collage vont au champ (dans le navigateur, avec `inputmode="numeric"` pour le clavier numérique d'un téléphone), et le pointeur en I s'affiche au-dessus des cellules.
