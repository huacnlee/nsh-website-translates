---
title: "nsh/mobile"
description: "Ce que proposent iOS et Android : TabBar, la barre d'onglets du système, InputAccessoryView sur iOS, BackHandler sur Android, et isAvailable."
order: 12.2
source_hash: 53d6d77de0d6e9ca
---

# nsh/mobile

`nsh/mobile` regroupe les capacités propres à iOS et à Android : la barre d'onglets du système, `TabBar`, sur les deux ; [`InputAccessoryView`](#inputaccessoryview), une barre au-dessus du clavier, sur iOS ; et [`BackHandler`](#backhandler), le bouton retour, sur Android. Le code Rust utilise `nsh_core::mobile` et `nsh_core::prelude` ; le TSX importe `nsh/mobile`. Le module peut être importé sur toutes les plateformes, de sorte qu'un seul bundle s'exécute partout : sur les autres plateformes, ses composants ne prennent aucune place et ses appels retournent immédiatement, et `isAvailable` indique si vous êtes sur iOS ou sur Android (`platform.os` de `nsh` indique lequel). Ce dont disposent les ordinateurs de bureau se trouve dans [nsh/desktop](./nsh-desktop.md).

```rust tabs
use nsh_core::mobile::{TabBarItem, tab_bar};
```

```tsx tabs
import { BackHandler, InputAccessoryView, isAvailable, TabBar } from "nsh/mobile";
import type { TabBarItem, TabBarProps } from "nsh/mobile";
```

<a id="scope"></a>

## Périmètre

Ce module expose des capacités propres aux plateformes mobiles, comme la barre d'onglets du système pour la navigation de premier niveau d'une application. Les contrôles communs relèvent de [`nsh/base`](./nsh-base.md) : son [Switch](../elements/switch.md), par exemple, partage le même comportement et la même API entre téléphones, ordinateurs de bureau et web, la piste, le curseur et les styles d'état étant fournis par l'application. `TabBar` sert la navigation des applications mobiles ; `Tabs` sert le contenu à onglets sur toutes les plateformes. Seules les capacités dont la sémantique d'interaction est propre au mobile ont leur place ici. Une apparence, une taille ou une animation propre au système ne change pas, à elle seule, le rôle partagé d'un contrôle commun. Cette distinction détermine quelles capacités relèvent de ce module ([Objectifs et principes de conception](../docs/goals.md)).

## isAvailable

```ts
const isAvailable: boolean;
```

`true` sur iOS, le simulateur iOS, Mac Catalyst et Android ; `false` ailleurs. Rust :
`matches!(os(), Os::Ios | Os::Android)`.

## TabBar

Une barre d'onglets permet de passer d'une section de premier niveau d'une application à une autre : enregistrements et statistiques, boîte de réception et réglages. `TabBar` est la barre propre au système : elle a donc l'apparence et le comportement des applications du système : `UITabBar` sur iOS et iPadOS (Liquid Glass et sa sélection sur iOS 26), la barre de navigation de Material 3 sur Android, aux couleurs du système, en clair comme en sombre. L'application fournit les onglets (`items`), indique lequel est sélectionné (`selectedIndex`), reçoit le choix de l'utilisateur (`onChange`), place la barre avec ses propriétés `class` et `style`, et affiche elle-même le contenu de la section sélectionnée. Pour des onglets à l'intérieur d'une page, et sur toutes les plateformes, utilisez les [Tabs](../elements/tabs.md) de `nsh/base`.

```rust tabs
use nsh_core::{
    mobile::{TabBarItem, tab_bar},
    prelude::*,
};

fn sections() -> impl IntoElement {
    let section = signal(0u32);
    view()
        .flex_1()
        .child(text(move || match section.get() {
            0 => "Records",
            _ => "Stats",
        }))
        .child(
            tab_bar()
                .items(vec![
                    TabBarItem::new("Records").icon("list.bullet"),
                    TabBarItem::new("Stats").icon("chart.bar"),
                ])
                .selected_index(section)
                .on_change(move |index: &u32| section.set(*index))
                .absolute()
                .left_0()
                .right_0()
                .bottom_0(),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { TabBar } from "nsh/mobile";
import { platform } from "nsh";

function App() {
  const section = signal(0);
  return (
    <View class="flex-1">
      <Text>{section() === 0 ? "Records" : "Stats"}</Text>
      <TabBar
        items={[
          { title: "Records", icon: platform.select({ ios: "list.bullet", android: "ic_records" }) },
          { title: "Stats", icon: platform.select({ ios: "chart.bar", android: "ic_stats" }) },
        ]}
        selectedIndex={section()}
        onChange={({ index }) => section.set(index)}
        class="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}

mount(App);
```

`TabBar` provient de `nsh/mobile`, et `nsh_core::mobile` en Rust. La sélection appartient à l'application : un appui signale `onChange` avec l'index de l'onglet (`{ index }`), la barre affiche aussitôt le choix, comme le fait celle du système, puis l'application affiche cette section et renvoie l'index sous la forme `selectedIndex`. Sa hauteur est celle du système lorsque le style ne la fixe pas.
En Rust, `tab_bar()` en crée une, avec un setter par propriété (`.items(..)`, `.selected_index(..)`), un écouteur par événement (`.on_change(..)`) et les méthodes de style typées ; `TabBarItem::new(title).icon(name)` crée un onglet.

<a id="props"></a>

### Propriétés

| Propriété | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `items` | `.items(..)` | `TabBarItem[]` | `[]` | Les onglets, dans l'ordre. |
| `selectedIndex` | `.selected_index(..)` | `number` | `0` | L'onglet sélectionné, par index ; un index au-delà des onglets n'en sélectionne aucun. |
| `hidden` | `.hidden(..)` | `boolean` | `false` | iOS : masque la barre sans transition. L'application détient cette valeur lors des empilements et dépilements. La barre s'affiche lorsque cette propriété et la demande `hidesBottomBarWhenPushed` de la pile visible sont toutes deux fausses. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | L'emplacement de la barre : sa position et sa taille. Son apparence est celle du système, l'onglet sélectionné prenant la couleur `primary` du thème. |
| `testID` | `.test_id(..)` | `string` | aucun | Permet de trouver la barre dans les tests et `nsh test --trace`. |

#### TabBarItem

| Champ | Rust | Type | Description |
|---|---|---|---|
| `title` | `TabBarItem::new(title)` | `string` | Le titre de l'onglet, que les lecteurs d'écran énoncent. |
| `icon` | `.icon(name)` | `string` | L'icône de l'onglet, désignée par le nom que lui donne la plateforme : un [SF Symbol](https://developer.apple.com/sf-symbols/) sur iOS (`"house"`), un drawable de l'application sur Android (`res/drawable/home.xml` est `"home"`, `"android:ic_menu_search"` celui du système). `platform.select` en choisit une par plateforme. |

<a id="events"></a>

### Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|index: &u32\| ..)` | L'utilisateur a choisi un onglet : `{ index }`, son index. La barre affiche aussitôt le choix ; l'application affiche le contenu de l'onglet et définit `selectedIndex`. |

<a id="platform-notes"></a>

### Notes par plateforme

- **iOS et Mac Catalyst** : `UITabBar`, avec l'apparence du système pour la version d'iOS : la barre flottante Liquid Glass et sa sélection sur iOS 26. Les icônes sont des SF Symbols. La couleur `primary` du thème est le `tintColor` de la barre, c'est-à-dire la couleur de l'onglet sélectionné ; les autres onglets gardent celle du système.
- **Android** : la barre de navigation de Material 3, construite à partir des vues de la plateforme : une icône dans son indicateur actif au-dessus de chaque libellé, un effet d'ondulation à l'appui, les couleurs dynamiques du système à partir d'Android 12 et les couleurs de base de Material avant, en clair ou en sombre selon l'apparence de l'application. En bas de la fenêtre, elle s'étend sous la barre de navigation, plus haute de la taille de son inset, comme celle de Material. Les icônes sont des drawables de l'application (teintés par la barre). L'icône et le libellé de l'onglet sélectionné prennent la couleur `primary` du thème, sur un indicateur actif de cette couleur à 12 % d'opacité ; les autres onglets gardent celle du système.
- **Ordinateurs de bureau (macOS, Windows, Linux, GPUI) et web** : les sections s'affichent avec les [Tabs](../elements/tabs.md), dans l'apparence de l'application. `TabBar` n'y prend aucune place, si bien qu'une seule mise en page convient aux deux cas, choisie par `platform.os` ([l'API d'appareil de `nsh`](./nsh.md#device)).

## InputAccessoryView

Sur iOS et Mac Catalyst ; sur Android, c'est une vue vide et masquée.

```ts
function InputAccessoryView(props: InputAccessoryViewProps): JSX.Element;

interface InputAccessoryViewProps {
  nativeID: string;
  style?: StyleProp<ViewStyle>;
  class?: string;
  children?: JSX.Element;
}
```

Une barre au-dessus du clavier (`inputAccessoryView` d'UIKit), affichée tant qu'un champ dont `ios={{ inputAccessoryViewID }}` correspond à son `nativeID` a le focus. Rust : `input_accessory_view(native_id)`, affichée pour les champs dont `.input_accessory(native_id)` correspond. Elle est aussi large que la fenêtre et aussi haute que son contenu, et suit le clavier de façon native.

| Propriété | Type | Rust | Description |
|---|---|---|---|
| `nativeID` | `string` | `input_accessory_view(native_id)` | Les champs ayant ce `inputAccessoryViewID` affichent la barre. |
| `style` | `StyleProp<ViewStyle>` | méthodes `Styled` (`.bg(…)`) | Le style de la barre (son arrière-plan, par exemple). |
| `class` | `string` | | Classes Tailwind. |
| `children` | `JSX.Element` | `.child(…)` | Le contenu de la barre. |

Elle ne rend rien à l'endroit où elle est placée dans l'arbre, et rien du tout sur Android ; vous pouvez donc la placer à côté du champ auquel elle appartient.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn Note() -> impl IntoElement {
    let note = signal(String::new());
    let field = element_ref();
    view()
        .child(
            input()
                .element_ref(&field)
                .value(note)
                .on_change(move |value: &str| note.set(value.to_string()))
                .placeholder("Write a note")
                .input_accessory("note-bar"),
        )
        .child(
            input_accessory_view("note-bar").bg(rgb(0xf1f5f9)).child(
                view()
                    .flex_row()
                    .items_center()
                    .p(px(10.0))
                    .child(
                        text(move || format!("{} characters", note.with(|n| n.chars().count())))
                            .flex_1()
                            .text_color(rgb(0x64748b)),
                    )
                    .child(text("Done").font_weight(FontWeight::SEMIBOLD).on_press(move || field.blur())),
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
  let input: InputRef | undefined;
  return (
    <View>
      <Input
        ref={(n) => (input = n)}
        value={text()}
        onChange={({ value }) => text.set(value)}
        placeholder="Write a note"
        ios={{ inputAccessoryViewID: "note-bar" }}
      />
      <InputAccessoryView nativeID="note-bar" style={{ backgroundColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <Text style={{ flex: 1, color: "#64748b" }}>{text().length} characters</Text>
          <Text onPress={() => input?.blur()} style={{ fontWeight: "600" }}>Done</Text>
        </View>
      </InputAccessoryView>
    </View>
  );
}
```

Voir aussi [Formulaires et clavier](../docs/forms-and-keyboard.md).

## BackHandler

Sur Android ; sur iOS, ses écouteurs sont conservés mais jamais appelés, et `exitApp()` retourne immédiatement.

```ts
const BackHandler: {
  on(event: "press", listener: () => boolean | void): () => void;
  exitApp(): void;
};
```

Le bouton retour du système et le geste de retour. Les boîtes de dialogue traitent l'appui sur retour en premier (une boîte de dialogue se ferme) ; puis les écouteurs de `BackHandler` s'exécutent, le plus récemment ajouté en premier ; si aucun ne le traite, la pile de navigation supérieure dépile, et s'il n'y a plus de page vers laquelle revenir, l'application se ferme.

| Membre | Rust | Description |
|---|---|---|
| `on("press", listener)` | `on_back_press(listener)` | `listener` retourne `true` lorsqu'il a traité l'appui. Retourne une fonction qui arrête l'écoute ; un écouteur ajouté pendant le rendu d'un composant (ou l'exécution d'un effet) s'arrête avec lui, en Rust comme en TSX. |
| `exitApp()` | l'écouteur retourne `false` | Quitte l'application. Un écouteur Rust qui retourne `false` laisse l'appui se poursuivre : la pile revient en arrière ou l'application se ferme. |

```rust tabs
use nsh_base::alert_dialog;
use nsh_core::prelude::*;

#[component]
fn Editor() -> impl IntoElement {
    let dirty = signal(false);
    on_back_press(move || {
        if !dirty.get_untracked() {
            return false; // let the app go back or exit
        }
        spawn(async move {
            let answer = alert_dialog().title("Discard changes?").cancel("keep", "Keep").destructive("discard", "Discard").show().await;
            if answer.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                dirty.set(false); // the next back press leaves
            }
        });
        true
    });
    // ...
}
```

```tsx tabs
import { signal } from "nsh";
import { BackHandler } from "nsh/mobile";
import { AlertDialog } from "nsh/base";

function Editor() {
  const dirty = signal(false);
  // Stops listening when Editor goes.
  BackHandler.on("press", () => {
    if (!dirty()) return false; // let the app go back or exit
    AlertDialog.show({
      title: "Discard changes?",
      actions: [{ label: "Keep", role: "cancel", id: "keep" }, { label: "Discard", role: "destructive", id: "discard" }],
    }).then(({ action }) => action === "discard" && BackHandler.exitApp());
    return true;
  });
  // ...
}
```

> [!NOTE]
> L'écouteur s'exécute après que le système a transmis l'appui : le thread principal n'attend jamais le code de l'application. Tant qu'au moins un écouteur est enregistré, NSH reprend les appuis sur retour que les boîtes de dialogue laissent passer, et revient en arrière dans la pile supérieure ou quitte lui-même l'application lorsqu'aucun écouteur ne retourne `true`.

La barre d'état est définie par `statusBar` des [pages et boîtes de dialogue](./nsh-base.md#status-bar) à partir de `nsh/base`, aussi bien sur iOS que sur Android.
