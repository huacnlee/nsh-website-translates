---
title: "Accessibilité"
description: "Rendre les applications compatibles avec VoiceOver et TalkBack : libellés, rôles, états, valeurs, actions personnalisées, regroupement et masquage, annonces et focus, taille du texte et réduction des animations."
order: 48
group: ui
source_hash: 0f504242ebec73ee
---

# Accessibilité

NSH effectue le rendu avec des vues natives : les technologies d'assistance des plateformes (VoiceOver sur iOS et Mac Catalyst, TalkBack sur Android, Switch Control, Voice Control, ...) voient donc la véritable hiérarchie de vues de votre app. Vous ajoutez ce que ces technologies ne peuvent pas déduire : ce qu'est un élément, ce qu'il dit, dans quel état il se trouve et ce qu'il peut faire. Tous les éléments acceptent les méthodes (Rust) et les props (TSX) ci-dessous.

<a id="what-you-get-without-doing-anything"></a>

## Ce que vous obtenez sans rien faire

- **Le texte est lu.** Un élément de texte est un élément d'accessibilité dont le label est son texte. Une vue sans label est lue comme les textes qu'elle contient.
- **Les vues pressables sont des éléments.** Une vue dotée d'un gestionnaire de pression ou de pression longue (`.on_press`, `onPress`) est par défaut un élément d'accessibilité, et l'activer (double toucher avec VoiceOver ou TalkBack) la presse.
- **Les champs de saisie sont des champs de texte**, avec leur placeholder, leur valeur et leur clavier.
- **Le texte suit le réglage de taille de l'utilisateur.** Voir [Taille du texte](#text-size).

<a id="labels-hints-and-roles"></a>

## Labels, indices et rôles

```rust tabs
view()
    .on_press(play)
    .role(AccessibilityRole::Button)
    .label("Play")
    .hint("Starts the song")
    .size(px(44.0))
    .items_center()
    .justify_center()
    .child(text("▶"))
```

```tsx tabs
<View
  onPress={play}
  role="button"
  accessibilityLabel="Play"
  accessibilityHint="Starts the song"
  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
>
  <Text>▶</Text>
</View>
```

| Rust | TSX | Type | Description |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | La vue est un seul élément pour les technologies d'assistance ; ses enfants ne sont pas exposés séparément. |
| `.label(..)` | `accessibilityLabel` | `string` | Ce que lisent les lecteurs d'écran, à la place des textes contenus. |
| `.hint(..)` | `accessibilityHint` | `string` | Ce que fait l'activation de l'élément, lu après une pause. |
| `.role(..)` | `role` | `AccessibilityRole` | Ce qu'est l'élément. |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | Son état : désactivé, sélectionné, coché, occupé, développé, pressé, courant. `selected` applique aussi le style sélectionné, `checked` le style coché lorsque la valeur est vraie et le style indéterminé lorsque `"mixed"`, `pressed` le style pressé lorsque la valeur est vraie. |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | Le niveau d'un titre (1 étant le plus haut), la profondeur d'un élément d'arbre (1 en haut). |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | La valeur d'un élément de type plage ou textuel. |
| | `accessibilityActions` | `{ name, label? }[]` | Actions proposées aux technologies d'assistance. |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | Une action a été effectuée (Rust : son nom). |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | Masque la vue et son sous-arbre aux technologies d'assistance. |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Indique si la vue (et son sous-arbre) est exposée. |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android : la façon dont les changements de la vue sont annoncés à TalkBack. |
| `.test_id(..)` | `testID` | `string` | Un identifiant pour les tests d'interface (l'accessibility identifier sur iOS, le resource id sur Android) ; il n'est pas lu à voix haute. |

Donnez un label à chaque contrôle réduit à une icône : un lecteur d'écran ne peut pas lire un glyphe ou une image. Gardez les labels courts et n'y incluez pas le rôle (« Lecture », et non « Bouton de lecture ») : le rôle est annoncé séparément.

<a id="roles"></a>

### Rôles

Le rôle (`.role(AccessibilityRole::Header)`, `role="header"`) indique à l'utilisateur de quel type d'élément il s'agit et comment l'utiliser. En Rust, c'est une variante de `AccessibilityRole` (`Button`, `Header`, `Switch`, ...) ; les valeurs TSX sont `"none"`, `"button"`, `"link"`, `"search"`, `"image"`, `"imagebutton"`, `"keyboardkey"`, `"text"`, `"adjustable"`, `"header"`, `"summary"`, `"alert"`, `"checkbox"`, `"combobox"`, `"menu"`, `"menubar"`, `"menuitem"`, `"progressbar"`, `"radio"`, `"radiogroup"`, `"scrollbar"`, `"spinbutton"`, `"switch"`, `"tab"`, `"tablist"`, `"timer"`, `"toolbar"`, `"list"`, `"grid"`, `"table"`, `"rowgroup"`, `"row"`, `"columnheader"` et `"cell"` (les rôles des parties de [`Table`](../elements/table.md)), `"listbox"` et `"option"` (une liste d'options à choisir, comme la liste de [`Select`](../elements/select.md), et ses options, l'option choisie étant marquée par `accessibilityState.selected`), `"group"` (éléments liés qui vont ensemble), `"region"` (une section qui mérite d'être atteinte directement, comme le panneau d'un accordéon), `"navigation"` (liens qui permettent de naviguer dans l'app, comme une pagination), `"tree"` et `"treeitem"` (éléments qui se développent et se réduisent, chacun à son `accessibilityLevel`), `"menuitemcheckbox"` et `"menuitemradio"` (éléments de menu cochés, seuls ou comme choix unique d'un groupe).

Les plus utiles :

- `"button"` pour tout élément pressable qui n'est pas un lien ; `"link"` pour la navigation vers un contenu.
- `"header"` pour les titres de section : les utilisateurs de lecteurs d'écran sautent d'un titre à l'autre pour parcourir un écran. `accessibilityLevel` donne son niveau (1 étant le plus haut) là où la plateforme le lit.
- `"button"` avec `accessibilityState.pressed` pour un bouton à bascule, qui reste activé ou désactivé (gras dans une barre d'outils).
- `"navigation"` autour des liens qui permettent de passer d'une page à l'autre, le lien de la page affichée portant `accessibilityState.current: "page"`.
- `"switch"`, `"checkbox"`, `"radio"` avec `accessibilityState.checked`.
- `"adjustable"` pour les curseurs et les steppers, avec `accessibilityValue` et les actions `increment` / `decrement`
  (chaque poignée d'un [`Slider`](../elements/slider.md) en est un).
- `"spinbutton"` pour un champ qui contient un nombre que l'utilisateur peut aussi incrémenter ou décrémenter, avec la même valeur et les mêmes actions (le
  champ d'un [`NumberInput`](../elements/number-input.md)).
- `"image"` pour les images porteuses de sens, avec un label ; les images décoratives doivent plutôt être masquées.

```rust tabs
text("Settings")
    .role(AccessibilityRole::Header)
    .text_size(px(22.0))
    .font_weight(FontWeight::BOLD)
```

```tsx tabs
<Text role="header" style={{ fontSize: 22, fontWeight: "700" }}>Settings</Text>
```

<a id="states-and-values"></a>

### États et valeurs

Pour un contrôle activé / désactivé dans une app, utilisez [`Switch`](../elements/switch.md) de `nsh/base`, qui définit lui-même le rôle et l'état. L'exemple montre ce que font un rôle et un état sur une vue.

```rust tabs
use nsh_core::{Checked, prelude::*};

// A toggle drawn with views.
view()
    .on_press(move || on.update(|v| *v = !*v))
    .role(AccessibilityRole::Switch)
    .label("Wi-Fi")
    .accessibility_state(move || AccessibilityState {
        checked: Some(if on.get() { Checked::True } else { Checked::False }),
        ..AccessibilityState::default()
    })
    .hit_slop(EdgeInsets::all(px(8.0)))
    .w(px(51.0))
    .h(px(31.0))
    .rounded_full()
    .p(px(2.0))
    .bg(move || if on.get() { rgb(0x22c55e) } else { rgb(0xd4d4d8) })
    .child(
        view()
            .size(px(27.0))
            .rounded_full()
            .bg(white())
            .style_with(move |s| s.translate_x(px(if on.get() { 20.0 } else { 0.0 }))),
    )
```

```tsx tabs
// A toggle drawn with views.
<View
  onPress={() => on.set(!on())}
  role="switch"
  accessibilityLabel="Wi-Fi"
  accessibilityState={{ checked: on() }}
  hitSlop={8}
  class="h-[31px] w-[51px] rounded-full p-0.5 transition-colors"
  classList={{ "bg-green-500": on(), "bg-zinc-300": !on() }}
>
  <View class="size-[27px] rounded-full bg-white transition-transform" classList={{ "translate-x-5": on() }} />
</View>
```

L'état s'écrit `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }` en Rust et `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }` en TSX. `pressed` fait d'un bouton un bouton à bascule (`aria-pressed` d'ARIA) ; `current` marque l'élément courant d'un ensemble (`aria-current` d'ARIA) : la page d'une pagination, l'étape d'un assistant. `disabled` est aussi impliqué par la désactivation de la vue (`.disabled(..)`, `disabled`). `accessibilityValue` avec `min`, `max` et `now` est lu sous forme de pourcentage ; avec `text`, il est lu tel quel (« 3 sur 10 », « Moyen »).

## Actions

Une vue pressable prend déjà en charge l'activation. Pour tout le reste, déclarez des actions avec `accessibilityActions` et gérez-les avec `onAccessibilityAction` ; un composant Rust reçoit le nom de l'action effectuée avec `.on_accessibility_action(|name: &str| ..)` :

```tsx
function Quantity() {
  const n = signal(1);
  return (
    <View
      accessible
      role="adjustable"
      accessibilityLabel="Quantity"
      accessibilityValue={{ text: String(n()) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (e.actionName === "increment") n.update((v) => v + 1);
        if (e.actionName === "decrement") n.update((v) => Math.max(0, v - 1));
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View onPress={() => n.update((v) => Math.max(0, v - 1))}><Text>−</Text></View>
      <Text>{n()}</Text>
      <View onPress={() => n.update((v) => v + 1)}><Text>+</Text></View>
    </View>
  );
}
```

Certains noms d'action sont standard et correspondent aux gestes propres à chaque plateforme :

| Nom | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | Double toucher | Double toucher (clic) |
| `increment`, `decrement` | Balayage vers le haut / le bas, puis VoiceOver lit la nouvelle valeur | Défilement avant / arrière |
| `longpress` | | Double toucher et maintien |
| `expand`, `collapse` | | Développer / réduire |
| `magicTap` | Double toucher à deux doigts | |
| `escape` | Geste en Z à deux doigts | |

Un élément doté de `increment` ou `decrement` est ajustable quel que soit son rôle : un graphique conserve son rôle `"image"` et parcourt ses points avec les balayages de VoiceOver et les défilements de TalkBack, sa `accessibilityValue` étant lue après chaque pas.

Tout autre nom devient une action personnalisée, listée dans le rotor d'actions de VoiceOver et dans le menu d'actions de TalkBack avec son `label` (ou son nom). Les actions personnalisées sont la forme accessible du balayage pour supprimer et des gestes similaires :

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## Regroupement et masquage

Rendre une vue accessible (`.accessible(true)`, `accessible`) en fait un seul élément : une carte avec un titre, un sous-titre et un prix est lue d'un trait, au lieu que l'utilisateur balaie trois textes.

```rust tabs
view()
    .accessible(true)
    .on_press(open)
    .role(AccessibilityRole::Button)
    .p(px(16.0))
    .child(text("Blue jacket"))
    .child(text("Size M"))
    .child(text("$120"))
```

```tsx tabs
<View accessible onPress={open} role="button" style={{ padding: 16 }}>
  <Text>Blue jacket</Text>
  <Text>Size M</Text>
  <Text>$120</Text>
</View>
```

Masquez ce qui n'apporte rien : images décoratives, séparateurs, icône à côté d'un texte qui dit déjà la même chose.

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden` (le nom côté iOS) et `importantForAccessibility="no-hide-descendants"` (celui côté Android) masquent tous deux le sous-arbre sur les deux plateformes ; les définir tous les deux est sans danger.

<a id="the-screen-reader-and-the-users-settings"></a>

## Le lecteur d'écran et les réglages de l'utilisateur

En Rust, le prelude rend compte des réglages de l'utilisateur et communique avec le lecteur d'écran : `screen_reader()` et `reduce_motion()` sont réactifs, `announce_for_accessibility(message)` fait lire un message par le lecteur d'écran, et le `element_ref()` d'un élément déplace le focus du lecteur d'écran vers lui avec `set_accessibility_focus()`. En TSX, l'API d'accessibilité de `nsh` rend compte des réglages de l'utilisateur et vous permet de communiquer avec le lecteur d'écran.

| Membre | Description |
|---|---|
| `screenReaderEnabled()` | Indique si VoiceOver ou TalkBack est actif (réactif). |
| `reduceMotion()` | Indique si l'utilisateur a demandé moins de mouvement (réactif). |
| `announce(message)` | Le lecteur d'écran lit `message`. |
| `setAccessibilityFocus(ref)` | Déplace le focus du lecteur d'écran vers une vue. |

Les réglages sont des accesseurs : lisez-les dans un binding ou un effet, et ce qui les lit se met à jour lorsque l'utilisateur modifie le réglage, sans nettoyage.

```rust tabs
use nsh_core::prelude::*;

fn upload() -> impl IntoElement {
    let done = signal(false);
    let result = element_ref();
    let finish = move || {
        done.set(true);
        announce_for_accessibility("Upload complete");
        result.set_accessibility_focus();
    };
    view()
        .gap(px(12.0))
        // Autoplaying carousels are hard to use with a screen reader: show a list instead.
        .child(when(move || !screen_reader(), photo_carousel).otherwise(photo_list))
        .child(
            text(move || if done.get() { "Uploaded 3 photos" } else { "Uploading…" })
                .element_ref(&result),
        )
}
```

```tsx tabs
import { signal, Text, View, type ViewRef } from "nsh";
import { announce, screenReaderEnabled, setAccessibilityFocus } from "nsh";

function Upload() {
  const done = signal(false);
  let result!: ViewRef;
  const finish = () => {
    done.set(true);
    announce("Upload complete");
    setAccessibilityFocus(result);
  };
  return (
    <View style={{ gap: 12 }}>
      {/* Autoplaying carousels are hard to use with a screen reader: show a list instead. */}
      <If when={!screenReaderEnabled()} else={<PhotoList />}>
        <PhotoCarousel />
      </If>
      <Text ref={result}>{done() ? "Uploaded 3 photos" : "Uploading…"}</Text>
    </View>
  );
}
```

Annoncez les changements que l'utilisateur manquerait autrement : la fin d'une sauvegarde en arrière-plan, une erreur qui apparaît loin du focus, la fin d'un minuteur. Sur Android, `android={{ accessibilityLiveRegion: "polite" }}` sur une vue fait annoncer ses changements par TalkBack de lui-même.

<a id="text-size"></a>

## Taille du texte

Le texte et les champs de saisie suivent la taille de texte du système (Dynamic Type sur iOS, taille de police sur Android), sauf si vous la désactivez (`.allow_font_scaling(false)`, `allowFontScaling={false}`). Plutôt que de la désactiver, concevez en en tenant compte :

- Laissez le texte passer à la ligne : évitez les hauteurs fixes sur les vues qui contiennent du texte.
- Plafonnez les très grands titres avec `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier` au lieu de désactiver la mise à l'échelle.
- Changez de disposition lorsque le texte est grand : lisez `font_scale()` (Rust) ou `fontScale()` depuis `nsh` (TSX) (par exemple, empilez verticalement un label et sa valeur au-delà de 1,3).

Voir [Appareil et environnement](./device-and-environment.md#text-size).

<a id="reduced-motion"></a>

## Mouvement réduit

`reduce_motion()` (Rust) et `reduceMotion()` (TSX) valent `true` lorsque l'utilisateur a activé Réduire les animations sur iOS ou le réglage de suppression des animations sur Android. Vos animations s'exécutent telles que vous les écrivez ; utilisez donc cette valeur, ou les variantes Tailwind `motion-reduce:` et `motion-safe:`, pour remplacer les grands mouvements par un fondu ou un changement instantané :

```rust tabs
use nsh_core::{element::LayoutAnimation, prelude::*};

let toggle = move || {
    if !reduce_motion() {
        animate_layout(LayoutAnimation::SPRING);
    }
    expanded.update(|e| *e = !*e);
};

view()
    .on_press(toggle)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.95)))
```

```tsx tabs
import { View } from "nsh";
import { reduceMotion } from "nsh";
import { LayoutAnimation } from "nsh";

const toggle = () => {
  if (!reduceMotion()) LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  expanded.set(!expanded());
};

<View onPress={open} class="transition active:scale-95 motion-reduce:transition-none" />
<View class="motion-safe:animate-bounce" />
```

<a id="touch-targets"></a>

## Zones tactiles

Donnez aux éléments pressables au moins 44 × 44 points. Lorsqu'un contrôle doit paraître plus petit, étendez sa zone tactile avec le hit slop (`.hit_slop(..)`, `hitSlop`) plutôt que sa taille ; voir [Toucher et gestes](./touch-and-gestures.md#hit-areas-hitslop).

<a id="checking-your-app"></a>

## Vérifier votre app

- Activez VoiceOver (Réglages iOS, Accessibilité, ou triple clic sur le bouton latéral s'il est configuré) ou TalkBack, et utilisez l'app sans regarder : chaque contrôle doit dire ce qu'il est et ce qu'il fait.
- Sur les simulateurs iOS, l'Accessibility Inspector de Xcode affiche le label, les traits et la valeur de chaque élément.
- Essayez la plus grande taille de texte et le mode sombre.
- Un identifiant de test (`.test_id(..)`, `testID`) donne aux tests d'interface une référence stable qui ne change pas avec la langue du label.

<a id="related"></a>

## Voir aussi

- [L'API d'accessibilité de `nsh`](../modules/nsh.md#accessibility) : la référence.
- [`View`](../elements/view.md) : toutes les props d'accessibilité.
- [Animation](./animation.md#reduced-motion) et [Appareil et environnement](./device-and-environment.md).
