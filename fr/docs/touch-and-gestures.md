---
title: "Toucher et gestes"
description: "Pressions et retour visuel lors d'une pression, zones de toucher, événements de pointeur, touches brutes, système de répondeur, PanResponder, et gestes natifs de panoramique, de pincement et de rotation."
order: 38
group: ui
demo: guide-gestures
source_hash: 00e684506892cb71
---

# Toucher et gestes

NSH propose trois niveaux de gestion du toucher. Les **appuis** (`.on_press` en Rust, `onPress` en TSX, et leurs variantes) couvrent les boutons, les lignes et les liens, avec un retour d'appui dessiné nativement. Les **gestes natifs** (pan, pinch et rotation) déplacent des [valeurs animées](./animation.md#animated-values) sur le thread UI, de sorte qu'une carte déplacée suit le doigt même quand votre code est occupé. Les **touches brutes et le système de responder** (`.on_touch` et `.claim_touches` avec les gestionnaires `.on_responder_*` en Rust ; `onTouchStart`, `onResponderMove` et `PanResponder` en TSX) donnent à votre code la position de chaque doigt pour tout ce que les deux autres niveaux ne peuvent pas exprimer, comme le dessin.

Choisissez le niveau le plus haut qui fait le travail : plus le niveau est élevé, moins le travail passe du thread UI à votre code.

<a id="presses"></a>

## Appuis

Tout élément accepte les gestionnaires d'appui ; il n'existe pas de composant « touchable » séparé. Placez `.on_press` / `onPress` sur une vue, un texte, une image ou n'importe quel autre élément.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view().flex_1().items_center().justify_center().child(
        view()
            .on_press(move || count.update(|n| *n += 1))
            .on_long_press(move || count.set(0))
            .active(|s| s.opacity(0.6))
            .role(AccessibilityRole::Button)
            .px(px(20.0))
            .py(px(12.0))
            .rounded(px(10.0))
            .bg(rgb(0x0969da))
            .child(
                text(move || format!("Pressed {} times", count.get()))
                    .text_color(white())
                    .font_weight(FontWeight::SEMIBOLD),
            ),
    )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        onPress={() => count.update((n) => n + 1)}
        onLongPress={() => count.set(0)}
        activeStyle={{ opacity: 0.6 }}
        role="button"
        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: "#0969da" }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "600" }}>Pressed {count()} times</Text>
      </View>
    </View>
  );
}

mount(App);
```

| Rust | TSX | Défaut | Description |
|---|---|---|---|
| `.on_press(..)` | `onPress` | | Le doigt s'est levé à l'intérieur de la vue (après un appui, pas un appui long). |
| `.on_long_press(..)` | `onLongPress` | | Le doigt est resté posé pendant le délai d'appui long. Le gestionnaire d'appui ne suit pas. |
| `.on_press_down(..)` | `onPressDown` | | L'appui a commencé. |
| `.on_press_up(..)` | `onPressUp` | | L'appui s'est terminé : doigt levé, sorti de la vue, ou récupéré par une scroll view. |
| `.long_press_delay(ms)` | `delayLongPress` | `500` | Millisecondes avant qu'un appui devienne un appui long. |
| `.disabled(..)` | `disabled` | `false` | Ne reçoit aucun appui et n'affiche aucun retour visuel ; applique le style désactivé ; les lecteurs d'écran indiquent qu'il est désactivé. |

Comportement des appuis :

- **Seule la vue appuyable la plus interne répond.** Une ligne appuyable contenant un bouton appuyable ne reçoit aucun appui quand on appuie sur le bouton.
- **Dans une scroll view, l'appui attend environ 130 ms** avant de démarrer (et d'afficher le retour visuel), afin qu'un glissement qui commence sur un bouton fasse défiler au lieu d'appuyer dessus.
- **Sortir de la vue annule.** Déplacer le doigt hors de la vue termine l'appui avec le gestionnaire de relâchement et sans appui.
- **Désactiver retire les écouteurs d'appui** de ce qui est monté, si bien que la vue n'affiche aucun retour visuel, et le style désactivé s'applique (`.disabled_style(..)`, `class="disabled:opacity-40"`).
- **Les spans de texte imbriqués dotés d'un gestionnaire d'appui sont des liens.** Le paragraphe est une seule vue native ; l'appui va au span situé sous le doigt. Voir [Text](./text.md).

<a id="press-feedback"></a>

## Retour visuel de l'appui

Le retour visuel de l'appui appartient à l'application : ce sont les styles que prend la vue lorsqu'elle est pressée, survolée, ciblée ou désactivée. Ils sont appliqués nativement dès que l'état change, sans aller-retour avec votre code. Chaque état possède une méthode Rust, une prop de style TSX et une [variante Tailwind](./tailwind.md) :

| Rust | Prop TSX | Classe | Description |
|---|---|---|---|
| `.active(\|s\| ..)` | `activeStyle` | `active:` | Pendant l'appui. |
| `.hover(\|s\| ..)` | `hoverStyle` | `hover:` | Tant qu'un pointeur la survole (ordinateurs, pointeurs d'iPad, navigateurs). |
| `.focus(\|s\| ..)` | `focusStyle` | `focus:` | Tant qu'elle a le focus. |
| `.focus_within(\|s\| ..)` | `focusWithinStyle` | `focus-within:` | Tant qu'elle ou une vue qu'elle contient a le focus : le cadre d'un champ autour de l'input qui l'édite. |
| `.disabled_style(\|s\| ..)` | `disabledStyle` | `disabled:` | Tant qu'elle est désactivée. |
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | | L'ondulation (ripple) material d'Android (`color`, `borderless`, `radius`, `foreground`), en plus des styles. |

Les styles d'état se superposent aux styles propres de la vue. Les états ultérieurs l'emportent (hover, focus, active), le style désactivé l'emporte sur tous, et les autres ne s'appliquent pas tant que la vue est désactivée.

```rust tabs
use nsh_core::{Ripple, prelude::*};

view().on_press(open).active(|s| s.opacity(0.5))

view().on_press(open).active(|s| s.bg(rgb(0xddf4ff))).p(px(16.0))

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0969da4d).into()),
        ..Ripple::default()
    })
```

```tsx tabs
<View onPress={open} activeStyle={{ opacity: 0.5 }}>…</View>

<View onPress={open} activeStyle={{ backgroundColor: "#ddf4ff" }} style={{ padding: 16 }}>…</View>

<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(9,105,218,0.3)" } }}
>
  …
</View>
```

Un ripple sans bordure se propage en dehors de la vue, ce qui convient aux boutons d'icône : `Ripple { borderless: true, radius: Some(px(24.0)), .. }`, `android={{ ripple: { borderless: true, radius: 24 } }}`. Voir [Platform-specific code](./platform-specific.md).

Avec une transition (`.transition()`, la classe `transition`), le changement d'état est animé. `.group()` (la classe `group`) fait d'une vue un groupe, et `.group_active(..)` (`group-active:`) stylise ses enfants pendant qu'elle est pressée :

```rust tabs
view()
    .on_press(save)
    .group()
    .rounded_xl()
    .bg(rgb(0x059669))
    .p_4()
    .transition()
    .active(|s| s.scale(0.95).bg(rgb(0x065f46)))
    .child(
        text("Save")
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(white())
            .group_active(|s| s.opacity(0.85)),
    )
```

```tsx tabs
<View
  onPress={save}
  class="group rounded-xl bg-emerald-600 p-4 transition active:scale-95 active:bg-emerald-800"
>
  <Text class="font-semibold text-white group-active:opacity-85">Save</Text>
</View>
```

<a id="hit-areas-hitslop"></a>

## Zones de toucher : hitSlop

Le hit slop (`.hit_slop(..)`, `hitSlop`) étend la zone qui reçoit les touches au-delà des limites de la vue, sans modifier sa mise en page. Utilisez-le pour les petites cibles comme les boutons de fermeture et les interrupteurs.

```rust tabs
view().hit_slop(EdgeInsets::all(px(12.0))).on_press(close).size(px(20.0))

view()
    .hit_slop(EdgeInsets { top: px(10.0), bottom: px(10.0), left: px(4.0), right: px(4.0) })
    .on_press(next)
```

```tsx tabs
<View hitSlop={12} onPress={close} style={{ width: 20, height: 20 }}>…</View>
<View hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={next}>…</View>
```

| Rust | TSX | Description |
|---|---|---|
| `.hit_slop(EdgeInsets)` | `hitSlop: number \| { top?, right?, bottom?, left? }` | Points ajoutés autour des limites. `EdgeInsets::all(..)` et un nombre en TSX s'appliquent aux quatre côtés. |

Gardez la zone étendue à l'intérieur des limites du parent (donnez à la petite vue une marge ou un padding autour d'elle) : le hit testing atteint un enfant à travers son parent, donc une touche en dehors du parent n'arrive jamais jusqu'au slop de l'enfant.

<a id="children-outside-their-parent"></a>

## Enfants hors de leur parent

Un enfant placé en dehors des limites de son parent (positionné de façon absolue avec `overflow` et laissé visible, comme un menu déroulant sous son champ) reçoit les touches là où il est dessiné, comme n'importe quelle autre vue : NSH effectue nativement le hit testing des descendants qui dépassent d'une vue. Un parent qui rogne son débordement les rogne, et ils ne s'affichent plus ni ne reçoivent de touches à cet endroit. La zone est calculée à partir de la mise en page, donc un enfant sorti de son parent par une transformation ne reçoit les touches qu'à l'intérieur des limites du parent.

Faites attention à l'ordre de dessin : un menu déroulant n'est dessiné au-dessus des frères de son champ que si le champ vient après eux ou possède un `z-index` plus élevé, et les touches vont à ce qui est dessiné au-dessus.

## pointerEvents

La clé de style `pointerEvents` (`.pointer_events(..)` en Rust) décide quelles vues d'un sous-arbre peuvent être la cible d'une touche. Elle est évaluée nativement pendant le hit testing, donc elle ne coûte rien par touche.

| Rust | TSX | La vue | Ses enfants |
|---|---|---|---|
| `PointerEvents::Auto` (défaut) | `"auto"` | Reçoit les touches | Reçoivent les touches |
| `PointerEvents::None` | `"none"` | Jamais la cible | Jamais la cible, sauf si l'un d'eux définit `"auto"` : les touches traversent jusqu'à ce qui se trouve derrière |
| `PointerEvents::BoxNone` | `"box-none"` | Jamais la cible | Reçoivent les touches |
| `PointerEvents::BoxOnly` | `"box-only"` | Reçoit les touches | Jamais la cible |

Les usages typiques : une surcouche qui ne doit pas bloquer ce qu'il y a dessous (none), un conteneur plein écran dont l'espace vide doit laisser passer les touches vers le contenu situé derrière tandis que ses boutons fonctionnent toujours (box-none), et une ligne qui doit recevoir un appui même quand le doigt tombe sur un enfant (box-only).

```rust tabs
view().flex_1().child(map()).child(
    // A floating toolbar: the empty area passes touches to the map.
    view()
        .pointer_events(PointerEvents::BoxNone)
        .absolute()
        .inset_0()
        .justify_end()
        .p(px(16.0))
        .child(
            view()
                .on_press(locate)
                .self_end()
                .p(px(12.0))
                .rounded(px(24.0))
                .bg(white())
                .child(text("Locate")),
        ),
)
```

```tsx tabs
<View style={{ flex: 1 }}>
  <Map />
  {/* A floating toolbar: the empty area passes touches to the map. */}
  <View style={{ pointerEvents: "box-none", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", padding: 16 }}>
    <View onPress={locate} style={{ alignSelf: "flex-end", padding: 12, borderRadius: 24, backgroundColor: "#ffffff" }}>
      <Text>Locate</Text>
    </View>
  </View>
</View>
```

`"none"` s'hérite comme le `pointer-events` de CSS : une vue à l'intérieur qui définit `"auto"` reçoit à nouveau les touches. `"box-none"` et `"box-only"` s'appliquent à la vue qui les définit. Les classes Tailwind `pointer-events-none` et `pointer-events-auto` définissent `"none"` et `"auto"`, et en tant que clé de style, `pointerEvents` accepte aussi des styles d'état (`activeStyle`, ...) et des variantes.

<a id="native-gestures-pan-pinch-and-rotation"></a>

## Gestes natifs : pan, pinch et rotation

Pour les glissements, pincements et rotations qui déplacent quelque chose à l'écran, liez des [valeurs animées](./animation.md#animated-values) au geste. Le reconnaisseur de gestes de la plateforme écrit les valeurs sur le thread UI et les vues qui y sont liées bougent dans la même frame ; votre code est averti quand le geste commence et se termine.

```rust tabs
use nsh_core::prelude::*;

#[component]
fn App() -> impl IntoElement {
    let x = animated_value(0.0);
    let y = animated_value(0.0);
    view().flex_1().items_center().justify_center().child(
        view()
            .pan_values(Some(&x), Some(&y))
            .on_pan_end(move |e: &PanEvent| {
                // Spring back, starting at the speed the finger let go with.
                let spring = |velocity| Spring { velocity: Some(velocity), ..Spring::default() };
                x.spring(0.0, spring(e.velocity_x));
                y.spring(0.0, spring(e.velocity_y));
            })
            .size(px(120.0))
            .rounded(px(24.0))
            .bg(rgb(0x8250df))
            .bind_translate_x(&x)
            .bind_translate_y(&y),
    )
}
```

```tsx tabs
import { mount, View } from "nsh";
import { createAnimatedValue } from "nsh";

function App() {
  const x = createAnimatedValue(0);
  const y = createAnimatedValue(0);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        pan={{ x, y }}
        onPanEnd={(e) => {
          // Spring back, starting at the speed the finger let go with.
          x.spring(0, { velocity: e.velocity.x });
          y.spring(0, { velocity: e.velocity.y });
        }}
        style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: "#8250df", translate: [x, y] }}
      />
    </View>
  );
}

mount(App);
```

| Rust | TSX | Description |
|---|---|---|
| `.pan_values(Some(&x), Some(&y))` | `pan={{ x?, y? }}` | Les glissements à un doigt déplacent ces valeurs, en points. |
| `.pinch_value(&scale)` | `pinch={{ scale? }}` | Les pincements à deux doigts pilotent `scale` (un facteur). |
| `.rotation_value(&angle)` | `rotation={{ angle? }}` | Les rotations à deux doigts pilotent `angle`, en degrés. |
| `.on_pan_start` / `.on_pan_end` | `onPanStart` / `onPanEnd` | Le glissement a commencé / s'est terminé, avec un `PanEvent`. |
| `.on_pinch_start` / `.on_pinch_end` | `onPinchStart` / `onPinchEnd` | Le pincement a commencé / s'est terminé : son échelle et sa vitesse (`GestureEvent`). |
| `.on_rotation_start` / `.on_rotation_end` | `onRotationStart` / `onRotationEnd` | La rotation a commencé / s'est terminée : son angle (Rust : `GestureEvent<Radians>`) et sa vitesse. |

Un événement de pan contient la translation (`translation`, un `Point` : points depuis le début), la vitesse (`velocity_x` / `velocity_y` ; TSX : `velocity`, un `Point` : points par **seconde**) et les valeurs liées à ce moment-là (`value_x` / `value_y` ; TSX : `value`, `{ x?, y? }` avec les axes que `pan` lie).

Ce que le côté natif fait pour vous :

- **Un glissement continue là où se trouve la valeur.** Au début, les valeurs sont lues et la translation leur est ajoutée ; saisir une valeur encore en cours d'animation (un ressort qui retourne à sa position) arrête l'animation là où elle en est.
- **Un seul axe laisse l'autre défiler.** Avec seulement une valeur horizontale liée, le glissement ne commence que si le doigt bouge plus horizontalement que verticalement, de sorte qu'une rangée à balayage horizontal dans une scroll view verticale défile toujours verticalement. Cette décision est prise nativement lorsque le système demande si le geste peut commencer.
- **Pan, pinch et rotation fonctionnent ensemble** sur la même vue : une carte peut être déplacée, pincée et tournée en même temps.
- **Vitesse de relâchement pour la physique.** La vitesse de fin du pan alimente directement la vitesse d'un ressort ou d'une décélération ; les valeurs permettent de choisir un point d'accroche.

```rust tabs
// A card that snaps to the left or right edge.
view()
    .pan_values(Some(&x), None)
    .on_pan_end(move |e: &PanEvent| {
        let projected = e.value_x.unwrap_or(0.0) + e.velocity_x * 0.2;
        let to = if projected > 0.0 { 140.0 } else { -140.0 };
        x.spring(to, Spring { velocity: Some(e.velocity_x), ..Spring::default() });
    })
    .bind_translate_x(&x)
```

```tsx tabs
// A card that snaps to the left or right edge.
<View
  pan={{ x }}
  onPanEnd={(e) => {
    const projected = (e.value?.x ?? 0) + e.velocity.x * 0.2;
    x.spring(projected > 0 ? 140 : -140, { velocity: e.velocity.x });
  }}
  style={{ translate: [x, 0] }}
/>
```

> [!TIP]
> Liez des valeurs animées au geste plutôt que de le suivre via le responder chaque fois que le glissement ne fait que déplacer des éléments. Avec des valeurs liées, un code d'application occupé ne peut pas faire saccader le glissement ; avec le responder, chaque déplacement est un événement pour votre code et une mise à jour de ce que la vue affiche.

<a id="raw-touches"></a>

## Touches brutes

Les gestionnaires de touches signalent chaque doigt lorsqu'il se pose, bouge et se lève. Ils sont utiles pour la journalisation, le hit testing personnalisé et la réaction au multi-touch ; ils ne revendiquent pas la touche (les appuis et les scroll views continuent de fonctionner).

En Rust, `.on_touch(..)` entend chaque phase sous la forme d'un `TouchEvent` : son `phase` (`TouchPhase::Start`, `Move`, `End`, `Cancel`), son `timestamp` et son `points`, c'est-à-dire chaque doigt posé, chacun avec son `id`, son `location` dans la vue sur laquelle il s'est posé, sa position `page` dans la surface, et `changed` pour les doigts concernés par l'événement. En TSX, chaque phase a son propre gestionnaire :

| TSX | Description |
|---|---|
| `onTouchStart` | Un doigt s'est posé sur la vue ou à l'intérieur. |
| `onTouchMove` | Un doigt a bougé. Les déplacements sont fusionnés par tour de moteur. |
| `onTouchEnd` | Un doigt s'est levé. |
| `onTouchCancel` | Le système a pris la touche (une scroll view a commencé à défiler, un appel est arrivé). |
| `onTouchStartCapture`, `onTouchMoveCapture`, `onTouchEndCapture`, `onTouchCancelCapture` | Les mêmes, appelés de l'extérieur vers l'intérieur, avant les gestionnaires de bubbling. |

Chaque gestionnaire TSX reçoit un `GestureResponderEvent` :

| Champ | Description |
|---|---|
| `identifier` | Identifie le doigt tant qu'il est posé. |
| `locationX`, `locationY` | Position dans la vue sur laquelle le doigt s'est posé (`target`). |
| `pageX`, `pageY` | Position dans la surface. |
| `target` | L'id de la vue sur laquelle le doigt s'est posé. |
| `timestamp` | Millisecondes. |
| `touches` | Tous les doigts posés. |
| `changedTouches` | Les doigts concernés par cet événement. |
| `nativeEvent` | L'événement lui-même, donc `e.nativeEvent.locationX` fonctionne aussi. |
| `stopPropagation()` | Les vues plus externes ne voient pas cet événement de touche. |

```rust tabs
use nsh_core::{TouchPhase, element::{TouchEvent}, prelude::*};

view().on_touch(|e: &TouchEvent| {
    let Some(p) = e.points.iter().find(|p| p.changed) else { return };
    match e.phase {
        TouchPhase::Start => log::info!("down {:?} {}", p.location, e.points.len()),
        TouchPhase::Move => log::info!("move {:?}", p.page),
        TouchPhase::End | TouchPhase::Cancel => log::info!("up"),
    }
})
```

```tsx tabs
<View
  onTouchStart={(e) => console.log("down", e.locationX, e.locationY, e.touches.length)}
  onTouchMove={(e) => console.log("move", e.pageX, e.pageY)}
  onTouchEnd={() => console.log("up")}
/>
```

<a id="where-a-view-is-measure"></a>

### Où se trouve une vue : measure

La position d'une touche est relative à la vue sur laquelle le doigt s'est posé, qui peut être un enfant de la vue qui vous intéresse (le curseur d'un slider). Mesurer une vue vous indique où elle se trouve, ce qui vous permet d'utiliser la position dans la page à la place. En Rust, placez un `element_ref()` sur la vue et attendez son `measure()` ; en TSX, appelez `measure()` sur sa ref :

```rust tabs
let track = element_ref();
let origin = stored(px(0.0));
view()
    .element_ref(&track)
    .claim_touches(TouchClaim::on_start())
    .on_responder_grant(move |e: &ResponderEvent| {
        let x = e.page.x;
        spawn(async move {
            let page = track.measure().await.map_or(px(0.0), |m| m.page.x);
            origin.replace(page);
            seek(x - page);
        });
    })
    .on_responder_move(move |e: &ResponderEvent| seek(e.page.x - origin.get()))
```

```tsx tabs
let track!: ViewRef;
let origin = 0;
<View
  ref={track}
  onStartShouldSetResponder={() => true}
  onResponderGrant={async (e) => {
    const x = e.pageX;
    origin = (await track.measure())?.pagePosition.x ?? 0;
    seek(x - origin);
  }}
  onResponderMove={(e) => seek(e.pageX - origin)}
/>;
```

Elle se résout une fois que les changements effectués jusque-là ont été mis en page : en Rust vers un `Measurement` (`frame`, le cadre dans le parent tel que le rapporte le gestionnaire de mise en page, et `page`, le coin supérieur gauche), en TSX vers `{ bounds, pagePosition }`. Le coin est exprimé dans la surface, ou dans la boîte de dialogue qui contient la vue, dans les mêmes coordonnées que les positions de page des touches. Les décalages des scroll views et des listes qui l'entourent sont pris en compte ; les transformations (animations comprises) ne le sont pas. Elle se résout vers `None` / `null` pour une vue qui n'est pas à l'écran.
<a id="the-responder-system"></a>

## Le système de responder

Quand votre code doit prendre en charge une séquence tactile (dessin au doigt, curseur personnalisé, geste que les reconnaisseurs natifs n'offrent pas), utilisez le système de gesture responder. Une seule vue à la fois est le **responder** et reçoit les déplacements ; les vues négocient pour déterminer laquelle.

Devenir le responder :

| Rust | TSX | Description |
|---|---|---|
| `.claim_touches(TouchClaim::on_start())` | `onStartShouldSetResponder` retournant `true` | Demandé quand un doigt se pose, de la cible vers l'extérieur. |
| `.claim_touches(TouchClaim::on_move())` | `onMoveShouldSetResponder` retournant `true` | Demandé à chaque déplacement tant qu'il n'y a pas de responder (ou pour le reprendre). |
| `TouchClaim::on_start().capture()` | `onStartShouldSetResponderCapture` | Comme ci-dessus, demandé de l'extérieur vers l'intérieur, avant les versions bouillonnantes (bubbling). Un parent l'utilise pour retirer un toucher à ses enfants. |
| `TouchClaim::on_move().capture()` | `onMoveShouldSetResponderCapture` | La version pour les déplacements. |

Une revendication se décide à partir de la vue seule, sans exécuter votre code, sauf si elle le demande : `TouchClaim::on_move().ask(|r: &ClaimRequest| ..)` revendique quand l'écouteur appelle `r.claim()`, en décidant d'après le geste jusque-là (`r.event.gesture`). Les handlers TSX reçoivent le geste comme second argument, `gestureState`, avec les mêmes champs que ceux de [PanResponder](#panresponder) (`dx`, `dy`, `vx`, `vy`, `moveX`, `moveY`, `x0`, `y0`, `numberActiveTouches`). Un balayage qui ne revendique que les déplacements horizontaux : `onMoveShouldSetResponder={(e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy)}`. Cette décision arrive tout de même un déplacement trop tard, si bien qu'une scroll view englobante peut commencer à défiler en premier ; pour les glissements à l'intérieur de scroll views, utilisez l'[activation du pan](#pans-inside-scroll-views-panactivation).

Pendant que la vue est responder :

| Rust | TSX | Description |
|---|---|---|
| `.on_responder_grant(..)` | `onResponderGrant` | Cette vue est maintenant le responder. Rust empêche par défaut les scroll views natives de prendre les touchers (`TouchClaim::block_native(false)` les y autorise) ; en TSX, retournez `true` pour cela. |
| `.on_responder_reject(..)` | `onResponderReject` | Une autre vue est le responder et n'a pas voulu céder. |
| `.on_responder_start(..)` | `onResponderStart` | Un autre doigt s'est posé. |
| `.on_responder_move(..)` | `onResponderMove` | Un doigt s'est déplacé. |
| `.on_responder_end(..)` | `onResponderEnd` | Un doigt s'est levé. |
| `.on_responder_release(..)` | `onResponderRelease` | Le dernier doigt s'est levé : le geste est terminé. |
| `.keep_touches(true)` | `onResponderTerminationRequest` retournant `false` | Une autre vue veut les touchers : les conserver (par défaut, ils lui sont cédés). |
| `.on_responder_terminate(..)` | `onResponderTerminate` | Une autre vue, ou un geste natif, a pris les touchers. |

Le responder d'un composant Rust reste pressé depuis son octroi jusqu'à la fin de ses touchers, où que aille le doigt ou le pointeur, comme le `:active` du CSS reste actif jusqu'au relâchement du bouton : ses styles `.active(..)` et les classes `group-active:` qu'il contient gardent leur aspect pendant tout le glissement (une poignée de redimensionnement déplacée hors de sa bande).

Les handlers Rust reçoivent un `ResponderEvent` : le `location` du doigt dans la vue où il s'est posé, sa position `page`, le `timestamp` et le `gesture` depuis l'octroi.

```rust tabs
use nsh_core::prelude::*;

fn sketch() -> impl IntoElement {
    let strokes = signal(Vec::<Vec<Point<Points>>>::new());
    canvas(move || {
        strokes.with(|all| {
            all.iter().fold(Painter::new().line_width(3.0), |p, s| {
                let mut p = p.begin_path();
                for (i, pt) in s.iter().enumerate() {
                    p = if i == 0 { p.move_to(pt.x, pt.y) } else { p.line_to(pt.x, pt.y) };
                }
                p.stroke()
            })
        })
    })
    .flex_1()
    // The responder: the scroll view around does not take the touches.
    .claim_touches(TouchClaim::on_start())
    .keep_touches(true)
    .on_responder_grant(move |e: &ResponderEvent| strokes.update(|all| all.push(vec![e.location])))
    .on_responder_move(move |e: &ResponderEvent| {
        strokes.update(|all| {
            if let Some(last) = all.last_mut() {
                last.push(e.location);
            }
        })
    })
}
```

```tsx tabs
import { Canvas, type GestureResponderEvent, mount, signal } from "nsh";

function Sketch() {
  const strokes = signal<[number, number][][]>([]);
  const point = (e: GestureResponderEvent): [number, number] => [e.locationX, e.locationY];
  return (
    <Canvas
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        strokes.set([...strokes(), [point(e)]]);
        return true; // the scroll view around must not take the touches
      }}
      onResponderTerminationRequest={() => false}
      onResponderMove={(e) => {
        const all = strokes();
        strokes.set([...all.slice(0, -1), [...all[all.length - 1], point(e)]]);
      }}
      draw={(cx) => {
        cx.lineWidth = 3;
        for (const s of strokes()) {
          cx.beginPath();
          s.forEach(([x, y], i) => (i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y)));
          cx.stroke();
        }
      }}
    />
  );
}

mount(Sketch);
```

Fonctionnement : une vue dotée d'un handler de toucher ou de responder écoute les touchers de façon native ; la plateforme signale les touchers sur elle (et à l'intérieur) avec le chemin des vues à l'écoute, et la négociation s'exécute dans le cœur Rust de NSH, qui interroge les revendications et appelle vos handlers dans l'ordre : les captures de la vue la plus externe vers l'intérieur, puis les autres de la cible vers l'extérieur. Deux conséquences :

- **Les scroll views natives et les responders sont en concurrence.** Tant qu'un responder les bloque, les scroll views environnantes ne prennent plus les touchers jusqu'à sa fin. Si une scroll view native commence à défiler en premier, c'est elle qui l'emporte : le responder reçoit le handler de terminaison et les handlers de toucher reçoivent une annulation.
- **Chaque déplacement est un événement pour votre code.** Les glissements pilotés par un responder sont aussi fluides que votre code est rapide ; pour les glissements qui ne font que déplacer des vues, préférez les [valeurs liées](#native-gestures-pan-pinch-and-rotation).

## PanResponder

En Rust, les événements du responder portent déjà le geste : `ResponderEvent::gesture` est un `PanGesture` avec la distance depuis le départ, la vélocité et le nombre de doigts. En TSX, `PanResponder` de `nsh` enveloppe le système de responder et ajoute le même état de geste ; étalez son `panHandlers` sur une vue.

```rust tabs
use nsh_core::prelude::*;

fn ball() -> impl IntoElement {
    let pos = signal((0.0_f32, 0.0_f32));
    let start = stored((0.0_f32, 0.0_f32));
    view()
        .size(px(60.0))
        .rounded(px(30.0))
        .bg(rgb(0x0969da))
        .style_with(move |s| {
            let (x, y) = pos.get();
            s.translate_x(px(x)).translate_y(px(y))
        })
        .claim_touches(TouchClaim::on_start())
        .on_responder_grant(move |_: &ResponderEvent| {
            start.replace(pos.get_untracked());
        })
        .on_responder_move(move |e: &ResponderEvent| {
            let (x, y) = start.get();
            let d = e.gesture.delta;
            pos.set((x + d.x.0, y + d.y.0));
        })
        .on_responder_release(move |e: &ResponderEvent| {
            log::info!("released at {} {} pt/s", e.gesture.vx, e.gesture.vy)
        })
}
```

```tsx tabs
import { mount, signal, View } from "nsh";
import { PanResponder } from "nsh";

function Ball() {
  const pos = signal({ x: 0, y: 0 });
  let start = { x: 0, y: 0 };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start = pos();
    },
    onPanResponderMove: (_, g) => pos.set({ x: start.x + g.dx, y: start.y + g.dy }),
    onPanResponderRelease: (_, g) => console.log("released at", g.vx, g.vy, "pt/s"),
  });
  return (
    <View
      {...responder.panHandlers}
      style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#0969da", translate: [pos().x, pos().y] }}
    />
  );
}

mount(Ball);
```

L'état du geste :

| Rust (`PanGesture`) | TSX (`gestureState`) | Description |
|---|---|---|
| | `stateID` | Identifie le geste. |
| `position` | `moveX`, `moveY` | La dernière position du centroïde des touchers, en points de la surface. |
| `origin` | `x0`, `y0` | L'endroit où se trouvait le centroïde à l'octroi du responder. |
| `delta` | `dx`, `dy` | Distance parcourue depuis l'octroi. |
| `vx`, `vy` | `vx`, `vy` | Vélocité, en points par seconde. |
| `active_touches` | `numberActiveTouches` | Doigts posés. |

`PanGesture::begin` et `PanGesture::update` suivent un geste à partir des touchers bruts (`.on_touch`) en Rust. Les callbacks TSX reçoivent `(event, gestureState)` : `onStartShouldSetPanResponder(Capture)`, `onMoveShouldSetPanResponder(Capture)`, `onPanResponderGrant`, `onPanResponderReject`, `onPanResponderStart`, `onPanResponderMove`, `onPanResponderEnd`, `onPanResponderRelease`, `onPanResponderTerminate`, `onPanResponderTerminationRequest` et `onShouldBlockNativeResponder`. Ce dernier vaut `true` par défaut : un PanResponder octroyé empêche les scroll views natives de prendre ses touchers.

<a id="pans-inside-scroll-views-panactivation"></a>

## Pans à l'intérieur des scroll views : panActivation

Un graphique parcouru latéralement à l'intérieur d'une scroll view verticale doit prendre les glissements horizontaux et laisser les verticaux à la scroll view. Revendiquer le toucher dès le début bloque le défilement dès le premier pixel, et décider sur les déplacements dans votre code arrive trop tard : le temps que votre code réponde, la scroll view a pu prendre le toucher. L'activation du pan (`TouchClaim::on_pan(..)`, `panActivation`) laisse la plateforme décider sur le thread principal, au fil du déplacement du doigt :

```rust tabs
view()
    .claim_touches(TouchClaim::on_pan(PanActivation::horizontal(px(10.0), px(10.0))))
    .on_responder_grant(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_move(|e: &ResponderEvent| scrub(Some(e.location.x)))
    .on_responder_release(|_: &ResponderEvent| scrub(None))
    .child(chart())
```

```tsx tabs
<View
  panActivation={{ activeOffsetX: 10, failOffsetY: 10 }}
  onResponderGrant={(e) => scrub(e.locationX)}
  onResponderMove={(e) => scrub(e.locationX)}
  onResponderRelease={() => scrub(null)}
>
  <Chart />
</View>
```

| Rust (`PanActivation`) | TSX | Description |
|---|---|---|
| `active_offset_x`, `active_offset_y` | `activeOffsetX`, `activeOffsetY` | Le pan s'active dès que le doigt s'est déplacé de plus que cette valeur depuis son point d'appui, le long de cet axe (dans les deux sens, en points). |
| `fail_offset_x`, `fail_offset_y` | `failOffsetX`, `failOffsetY` | Le pan échoue dès que le doigt s'est déplacé de plus que cette valeur en premier : les scroll views gardent les touchers. |

`PanActivation::horizontal(active, fail)` et `PanActivation::vertical(active, fail)` définissent les paires usuelles. Sans décalages d'activation, le pan s'active après 10 points dans n'importe quelle direction. Tant qu'il n'est pas activé, les scroll views environnantes l'attendent (iOS) et les autres revendications de la vue ne sont pas interrogées. Lorsqu'il s'active, les scroll views ne peuvent plus prendre ces touchers et la vue devient le responder (l'octroi, puis les déplacements) ; lorsqu'il échoue, la scroll view défile normalement. En TSX, les `panHandlers` de `PanResponder` fonctionnent aussi avec lui : étalez-les à côté de la prop, et `onPanResponderGrant` s'exécute à l'activation.

> [!NOTE]
> Toutes les vélocités sont en points par seconde : `vx` / `vy` du geste du responder, la vélocité d'un pan et celle d'un spring ou d'un decay, de sorte que `vx` se transmet tel quel à un spring ou à un decay.

<a id="why-some-answers-are-props"></a>

## Pourquoi certaines réponses sont des props

Le thread principal n'attend jamais votre code. Quand le système a besoin d'une réponse immédiate (ce geste de pan peut-il commencer, ce point touche-t-il la vue, ce tap doit-il fermer le clavier), NSH répond nativement à partir de ce qui a été monté au préalable : les valeurs de pan liées (leurs axes), la valeur de pincement, la hit slop, les événements de pointeur, le réglage des taps clavier des scroll views, l'activation du pan. Vos handlers sont informés de ce qui s'est passé après coup. C'est pourquoi ce sont des réglages déclaratifs plutôt que des callbacks, et pourquoi la négociation du responder, qui exécute bien votre code, ne départage que des responders et ne bloque jamais un geste natif.

<a id="related"></a>

## Voir aussi

- [`View`](../elements/view.md) : toutes les props tactiles de l'élément de base.
- [Animation](./animation.md) : valeurs animées, springs et decay pour les mouvements pilotés par les gestes.
- [Scrolling](./scrolling.md) : le réglage des taps clavier, les scroll views et les gestes imbriqués.
- [`PanResponder`](../modules/nsh.md#panresponder) : la référence de `PanResponder`.
- [Accessibility](./accessibility.md) : les vues pressables sont des éléments d'accessibilité ; donnez-leur un rôle et un libellé.
