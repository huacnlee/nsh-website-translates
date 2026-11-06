---
title: "NavStack"
description: "Native Navigations-Stacks: NavStack, NavPage und createNavStack, Seiten per Push und Pop verwalten, Header-Slots, das Verlassen einer Seite und wie die einzelnen Plattformen einen Stack darstellen."
group: base
demo: ui-navigation
source_hash: 3459db26c62a0d4c
---


# NavStack

Ein Navigations-Stack zeigt jeweils eine Seite und behält die darunterliegenden Seiten bei: `UINavigationController` auf iOS und Mac
Catalyst, mit System-Header und Swipe-Back, und auf Android ein Stack von Seiten mit Toolbar und Predictive Back.
Auf den Desktop-Plattformen (macOS, Windows, Linux, GPUI) und im Web zeigt jede Seite oben den app-eigenen Header, und die
Zurück-Tasten sowie der Zurück-Button des Browsers entfernen die Seite vom Stack. `NavStack` ist der Stack, `NavPage` eine seiner Seiten.

Der Stack verantwortet das Navigationsverhalten (Übergänge, Zurück-Gesten und -Buttons, den Zustand der Seiten, solange sie verdeckt sind); der Inhalt der Seiten und der Desktop-Header gehören der App.

```rust tabs
use nsh_base::{button, nav_page, nav_stack};
use nsh_core::prelude::*;

/// A button with the app's look.
fn action(title: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .child(text(title).text_color(white()).font_weight(FontWeight::SEMIBOLD))
}

/// The header on the desktops and the web, with a back button over the first page.
fn bar(title: impl Into<SharedString>, routes: Signal<Vec<u32>>) -> impl IntoElement {
    view()
        .flex_row()
        .items_center()
        .gap_3()
        .px_4()
        .py_3()
        .border_b_1()
        .border_color(rgb(0xe5e5e5))
        .child(when(
            move || !routes.with(Vec::is_empty),
            move || {
                action("Back", move || {
                    routes.update(|r| {
                        r.pop();
                    })
                })
            },
        ))
        .child(text(title.into()).text_lg().font_weight(FontWeight::SEMIBOLD))
}

fn app() -> impl IntoElement {
    // The messages pushed over the inbox, bottom to top.
    let routes = signal(Vec::<u32>::new());
    nav_stack()
        .flex_1()
        .child(
            nav_page()
                .title("Inbox")
                .header(bar("Inbox", routes))
                .child(view().flex_1().p_4().child(action("Open message 1", move || {
                    routes.update(|r| r.push(1))
                }))),
        )
        .child(each(
            move || routes.get(),
            |id: &u32| *id,
            move |id, depth| {
                let title: SharedString = format!("Message {}", id.get_untracked()).into();
                nav_page()
                    .title(title.clone())
                    .header(bar(title, routes))
                    // The user went back natively: this page and those above it are gone.
                    .on_dismiss(move || routes.update(|r| r.truncate(depth.get_untracked())))
                    .child(view().flex_1().p_4().child(text("The message.")))
            },
        ))
}
```

```tsx tabs
import { mount, Text, View } from "nsh";
import { Button, createNavStack, NavPage, NavStack } from "nsh/base";

type Route = { name: "home" } | { name: "detail"; id: number };

const nav = createNavStack<Route>([{ name: "home" }]);

function Action(props: { title: string; onPress: () => void }) {
  return (
    <Button onPress={props.onPress} class="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
      <Text class="text-center text-base font-semibold text-white">{props.title}</Text>
    </Button>
  );
}

function Bar(props: { title: string }) {
  return (
    <View class="flex-row items-center gap-3 border-b border-neutral-200 px-4 py-3">
      {nav.routes().length > 1 && <Action title="Back" onPress={() => nav.pop()} />}
      <Text class="text-lg font-semibold">{props.title}</Text>
    </View>
  );
}

function Home() {
  return (
    <NavPage title="Inbox" header={<Bar title="Inbox" />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Action title="Open message 1" onPress={() => nav.push({ name: "detail", id: 1 })} />
      </View>
    </NavPage>
  );
}

function Detail(props: { id: number }) {
  const title = `Message ${props.id}`;
  return (
    <NavPage title={title} header={<Bar title={title} />}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text>The message.</Text>
      </View>
    </NavPage>
  );
}

function App() {
  return (
    <NavStack state={nav} style={{ flex: 1 }}>
      {(route) => (route.name === "home" ? <Home /> : <Detail id={route.id} />)}
    </NavStack>
  );
}

mount(App);
```

Auf iOS und Android zeigt die Seite den System-Header mit `title` und einem Zurück-Button; auf den Desktop-Plattformen und im Web
zeigt sie `header`. Eine App, die nur Smartphones adressiert, lässt `header` weg; eine App, die nur Desktops adressiert, lässt die
Optionen des System-Headers weg. Der [Navigationsleitfaden](../docs/navigation.md) führt durch die Navigation einer ganzen App: den
Zustand des Stacks, Dialoge, den Android-Zurück-Button und Tabs.

<a id="how-a-stack-works"></a>

## Funktionsweise eines Stacks

- Die Seiten des Stacks sind **Routen**: Werte deiner Wahl, vom unteren Ende des Stacks bis zum oberen. Eine Route
  benennt in der Regel die Seite und trägt deren Parameter.
- In TSX liegen die Routen in dem Zustand, den `createNavStack` erzeugt. `NavStack` ruft seine Child-Funktion einmal pro Push auf
  und zeigt das Ergebnis als Seite. Der Stack behält diese Seite, solange ihre Route im Stack liegt, sodass eine Seite ihren Zustand
  (Signals, Scroll-Position, Eingaben) behält, während andere Seiten sie verdecken.
- In Rust sind die Children des Stacks seine Seiten: Ein `nav_page()`, das in `nav_stack()` eingefügt wird, wird gepusht, und eines, das fehlt,
  wird entfernt. Halte die Routen in einem Signal und rendere die Seiten mit `each(..)`, nach Route geschlüsselt, damit die darunterliegenden Seiten
  ihren Zustand behalten.
- Jeder Push ist eine eigene Seite, auch wenn derselbe Routenwert zweimal gepusht wird.
- Verlässt der Nutzer eine Seite nativ (Zurück-Button, Swipe-Back, Android-Zurück, die Zurück-Tasten der Desktops, der
  Zurück-Button des Browsers), verschwindet die Seite. In TSX entfernt der Stack ihre Route aus dem Zustand, sodass `nav.routes()` immer dem entspricht,
  was der Nutzer sieht. In Rust meldet die Seite `on_dismiss`, und dort entfernst du ihre Route (und die Routen darüber).
- Gibt in TSX eine Child-Funktion etwas anderes als ein `<NavPage>` zurück, entsteht eine Seite mit Standardoptionen. Gib
  ein `<NavPage>` zurück, um den Header und weitere Optionen zu setzen.

## createNavStack

```ts
function createNavStack<R>(routes: R[]): NavStackState<R>
```

Erzeugt den Zustand eines Stacks, der mit `routes` beginnt, von unten nach oben. Erzeuge ihn einmal, zum Beispiel auf Modulebene,
und übergib ihn an `<NavStack state>`. Jeder Code kann ihn importieren, um zu navigieren.

| Member | Beschreibung |
|---|---|
| `routes: Accessor<readonly R[]>` | Die Routen, von unten nach oben. Reaktiv. |
| `push(route: R): void` | Pusht eine Seite. |
| `pop(count?: number): void` | Entfernt `count` Seiten (Standard 1). Mindestens eine Seite bleibt immer erhalten. |
| `popToRoot(): void` | Entfernt Seiten, bis nur die erste übrig ist. |
| `replace(route: R): void` | Ersetzt die oberste Seite. |
| `setRoutes(routes: R[]): void` | Ersetzt die Seiten; eine Route, die bleibt (derselbe Wert), behält ihre Seite und ihren Zustand. |
| `remove(route: R): void` | Entfernt die oberste Seite von `route` (verglichen mit `===`), egal wo im Stack sie liegt. |

In Rust sind dieselben Operationen Änderungen an deinem Routen-Signal: `routes.update(|r| r.push(route))` pusht,
`r.pop()` entfernt die oberste Seite, `r.truncate(1)` entfernt Seiten bis zur ersten Seite, die du darin behältst, und `routes.set(..)` ersetzt die Seiten.

```rust tabs
routes.update(|r| r.push(7));
routes.update(|r| r.truncate(r.len().saturating_sub(2)));
routes.set(vec![1, 2]);
let depth = move || routes.with(Vec::len);
```

```tsx tabs
nav.push({ name: "detail", id: 7 });
nav.pop(2);
nav.setRoutes([{ name: "home" }, { name: "detail", id: 1 }]);
const depth = () => nav.routes().length;
```

## NavStack-Props

| Prop | Rust | Typ | Beschreibung |
|---|---|---|---|
| `state` | die Seiten sind seine Children | `NavStackState<R>` | Der Zustand, der die Routen enthält (`createNavStack`). Erforderlich. |
| `children` | `.child(..)` | `(route: R, index: Accessor<number>) => JSX.Element` | Rendert eine Route. Gib ein `<NavPage>` für ihre Optionen zurück. Erforderlich. |
| `style`, `class` | Style-Methoden | | Der Style des Stacks; üblicherweise `flex: 1`. |
| `testID` | `.test_id(..)` | `string` | Findet den Stack in Tests und `nsh test --trace`. |

Die TSX-Child-Funktion erhält den Routenwert selbst und einen Accessor für seine Position im Stack.

## NavPage-Props

`NavPage` ist eine Seite eines Stacks. Es enthält den Inhalt der Seite, ihren `header` auf den Desktop-Plattformen und im Web sowie die
Optionen des System-Headers auf iOS und Android. In Rust gibt `nav_page()` die Seite zurück, und ihre Builder-Methoden heißen wie die
Props, in Snake-Case.

| Prop | Rust | Typ | Standard | Beschreibung |
|---|---|---|---|---|
| `header` | `.header(..)` | `JSX.Element` | keiner | Desktops und Web: der Header der Seite, oben auf der Seite platziert, so breit wie die Seite und so hoch, wie er sich layoutet, mit dem Inhalt darunter. |
| `title` | `.title(..)` | `string` | keiner | iOS und Android: der Titel des System-Headers. |
| `headerVisible` | `.header_visible(..)` | `boolean` | `true` | iOS und Android: der System-Header wird angezeigt. |
| `headerTransparent` | `.header_transparent(..)` | `boolean` | `false` | iOS und Android: der Inhalt reicht unter einen transparenten System-Header. |
| `hidesBottomBarWhenPushed` | `.hides_bottom_bar_when_pushed(..)` | `boolean` | `false` | iOS: Die System-Tab-Bar verschwindet, solange diese Seite oben liegt, und bewegt sich dabei im Übergang mit – dieselbe Animation wie die Seite, und die Bar wird nie neu aufgebaut; sie kommt zurück, wenn die Seite entfernt wird. |
| `headerLargeTitle` | `.header_large_title(..)` | `boolean` | `false` | iOS: ein großer Titel, der beim Scrollen des Inhalts in die Bar schrumpft; der Inhalt scrollt unter den Header. |
| `headerBackTitle` | `.header_back_title(..)` | `string` | keiner | iOS und Android: die Beschriftung des Zurück-Buttons, der zu dieser Seite zurückführt (auf Android seine Beschreibung für Screenreader). |
| `headerBackVisible` | `.header_back_visible(..)` | `boolean` | `true` | iOS und Android: der Zurück-Button wird angezeigt. |
| `headerLeft` | `.header_left(..)` | `JSX.Element` | keiner | iOS und Android: Inhalt am vorderen Rand des System-Headers, anstelle des Zurück-Buttons. |
| `headerRight` | `.header_right(..)` | `JSX.Element` | keiner | iOS und Android: Inhalt am hinteren Rand des System-Headers. |
| `headerTitle` | `.header_title(..)` | `JSX.Element` | keiner | iOS und Android: Inhalt, der den Titel ersetzt. |
| `headerStyle` | `.header_style(..)` | `{ backgroundColor?, color?, tintColor? }` | Plattform | iOS und Android: die Farben des System-Headers: sein Hintergrund, die des Titels (`color`) und die der Buttons (`tintColor`). |
| `headerClass` | `.header_style_with(\|s\| ..)` | `string` | keiner | Dieselben Farben als Klassen: `bg-*`, `text-*` für den Titel, `tint-*` für die Buttons (in Rust `.bg(..)`, `.text_color(..)`, `.tint_color(..)`, Theme-Farben, die dem Erscheinungsbild folgen). `headerStyle` hat Vorrang. |
| `popOnBack` | `.pop_on_back(..)` | `boolean` | `true` | Die Zurück-Buttons und Swipe-Back entfernen die Seite. Siehe [Eine Seite verlassen](#leaving-a-page). |
| `popOnSwipe` | `.pop_on_swipe(..)` | `boolean` | `true` | Die interaktive Zurück-Geste entfernt die Seite: Swipe-Back auf iOS, Predictive Back auf Android, das dem Finger folgt. Die Zurück-Buttons entfernen die Seite in jedem Fall. |
| `animation` | `.animation(..)` | `"default" \| "slide" \| "fade" \| "none"` | `"default"` | Wie die Seite eintritt und verschwindet. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | keiner | Die Seite tritt über einen WGSL-Shader ein und verschwindet über ihn, anstelle ihres `animation`: `shade(uv)` liest die darunterliegende Seite als `sample_from` und diese Seite als `sample_to`, während `nsh.progress` über `duration` Millisekunden (standardmäßig 350) von 0 auf 1 läuft und beim Verlassen der Seite von 1 zurück auf 0. Wenn das System reduzierte Bewegung verlangt, verwendet die Seite ihr eigenes `animation`. Siehe [Shader](./shader.md). |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | keiner | iOS und Android: die Statusleiste, solange die Seite oben liegt. Siehe [Statusleiste](../modules/nsh-base.md#status-bar). |
| `style`, `class` | Style-Methoden | | keiner | Der Style der Seite. |
| `children` | `.child(..)` | `JSX.Element` | keiner | Der Inhalt. |
| `testID` | `.test_id(..)` | `string` | keiner | Findet die Seite in Tests und `nsh test --trace`. |

## NavPage-Events

| Event | Rust | Beschreibung |
|---|---|---|
| `onBackPress` | `.on_back_press(..)` | Der Nutzer hat auf der Seite Zurück gedrückt (Zurück-Button des Headers, Android-Zurück, Escape, Alt+Links oder die Zurück-Taste einer Maus auf den Desktops, Zurück im Browser), unabhängig davon, ob `popOnBack` das Entfernen erlaubt hat. |
| `onDismiss` | `.on_dismiss(..)` | Der Nutzer hat die Seite entfernt (Zurück-Button, Swipe); ihre Route ist in TSX verschwunden, und Rust entfernt sie hier. |

## Header-Slots

`header`, `headerLeft`, `headerRight` und `headerTitle` sind Slots: gewöhnliche Elemente, die Signals lesen, Eingaben verarbeiten
und sich aktualisieren, solange die Seite angezeigt wird. `header` ist auf den Desktop-Plattformen und im Web der gesamte Header der App; die anderen drei
gehören auf iOS und Android in den System-Header.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn profile(edit: impl Fn() + 'static) -> Screen {
    nav_page()
        .title("Profile")
        .header(profile_bar())
        .header_style_with(|s| s.bg(rgb(0x1a7f37)).text_color(white()).tint_color(white()))
        .header_right(text("Edit").text_color(white()).on_press(move || edit()))
        .child(scroll().flex_1())
}
```

```tsx tabs
<NavPage
  title="Profile"
  header={<ProfileBar />}
  headerStyle={{ backgroundColor: "#1a7f37", color: "#ffffff", tintColor: "#ffffff" }}
  headerRight={<Text onPress={edit} style={{ color: "#ffffff", fontSize: 17 }}>Edit</Text>}
>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

Der Inhalt der Seite beginnt unterhalb des Headers: unterhalb eines undurchsichtigen System-Headers auf iOS und Android, unterhalb von `header` auf den
Desktop-Plattformen und im Web. Mit `headerTransparent`, `headerLargeTitle` oder `headerVisible={false}` beginnt er auf iOS und Android am oberen Rand der
Seite; verwende [`env(safe-area-inset-top)`](./safe-area.md) oder `safeAreaInsets()`, um ihn vom
Header und von der Statusleiste freizuhalten.

Auf iOS lässt `headerVisible={false}` Swipe-Back aktiviert, solange `popOnSwipe` und `popOnBack` wahr sind.
Eine akzeptierte interaktive Zurück-Geste beendet die Bearbeitung, sobald der Übergang beginnt, sodass die Tastatur während des
Ziehens verschwindet. Wird der Übergang abgebrochen, erhält derselbe Editor wieder den Fokus, sofern kein anderes Steuerelement ihn übernommen hat.

```rust tabs
nav_page()
    .title("Large title")
    .header_large_title(true)
    .child(scroll().flex_1())
```

```tsx tabs
<NavPage title="Large title" headerLargeTitle>
  <Scroll style={{ flex: 1 }}>…</Scroll>
</NavPage>
```

<a id="leaving-a-page"></a>

## Eine Seite verlassen

`popOnBack={false}` hält den Nutzer auf einer Seite, zum Beispiel solange ein Formular ungespeicherte Änderungen enthält. Solange es false ist, ist Swipe-Back
deaktiviert, und die Zurück-Buttons und -Tasten rufen `onBackPress` auf, ohne die Seite zu entfernen. Frage den Nutzer und entferne die Seite dann selbst:

```rust tabs
use nsh_base::{alert_dialog, nav_page};
use nsh_core::prelude::*;

fn edit_note(routes: Signal<Vec<u32>>) -> Screen {
    let note = signal(String::new());
    let confirm = move || {
        spawn(async move {
            let choice = alert_dialog()
                .title("Discard your changes?")
                .cancel("keep", "Keep editing")
                .destructive("discard", "Discard")
                .show()
                .await;
            if choice.is_ok_and(|r| r.action.as_deref() == Some("discard")) {
                routes.update(|r| {
                    r.pop();
                });
            }
        });
    };
    nav_page()
        .title("Edit")
        .pop_on_back(move || note.with(String::is_empty))
        .on_back_press(move || {
            if !note.with(String::is_empty) {
                confirm();
            }
        })
        .child(
            input()
                .value(note)
                .on_change(move |v: &str| note.set(v.to_owned()))
                .placeholder("A note"),
        )
}
```

```tsx tabs
import { signal } from "nsh";
import { AlertDialog, NavPage, Input } from "nsh/base";

function EditNote() {
  const text = signal("");
  const confirm = async () => {
    const { action } = await AlertDialog.show({
      title: "Discard your changes?",
      actions: [
        { label: "Keep editing", role: "cancel", id: "keep" },
        { label: "Discard", role: "destructive", id: "discard" },
      ],
    });
    if (action === "discard") nav.pop();
  };
  return (
    <NavPage title="Edit" popOnBack={text().length === 0} onBackPress={() => text().length > 0 && confirm()}>
      <Input value={text()} onChange={({ value }) => text.set(value)} placeholder="A note" />
    </NavPage>
  );
}
```

> [!IMPORTANT]
> Das System fragt im Main-Thread, ob der Nutzer zurückgehen darf, und zwar in dem Moment, in dem der Nutzer handelt; der Main-Thread
> wartet nie auf JS oder auf deinen Rust-Code. Deshalb antwortet NSH mit dem bereits gemounteten Wert von `popOnBack`. Setze
> `popOnBack={false}`, sobald es etwas zu verlieren gibt, noch bevor der Nutzer zurückgeht.

`onBackPress` wird bei jedem Drücken von Zurück aufgerufen, auch wenn die Seite entfernt wird, und zeigt dir daher auch an, dass der Nutzer zurückgegangen ist.
Um nur die Swipe-Geste zu deaktivieren und die Zurück-Buttons beizubehalten, verwende `popOnSwipe={false}`. Die Bestätigung selbst ist ein
[AlertDialog](./alert-dialog.md).

<a id="platform-notes"></a>

## Hinweise zu den Plattformen

- **iOS**: `UINavigationController` mit System-Header, Zurück-Button und Swipe-Back; `headerLargeTitle` ist der große Titel von UIKit.
  Änderungen am Stack, die während eines laufenden Übergangs eintreffen, werden angewendet, wenn dieser endet.
- **Android**: ein Stack mit Toolbar. Der System-Zurück-Button entfernt die oberste Seite, mit Predictive Back auf Android-Versionen,
  die es unterstützen; die Beschreibung des Aufwärtspfeils für Screenreader ist das `headerBackTitle` der darunterliegenden Seite oder die
  des Systems. Siehe `BackHandler` in [`BackHandler`](../modules/nsh-mobile.md#backhandler), um den Zurück-Button selbst zu behandeln.
- **Mac Catalyst**: wie auf iOS.
- **Desktops (macOS, Windows, Linux, GPUI) und Web**: Jede Seite zeigt oben ihren `header` und darunter ihren Inhalt.
  Escape, Alt+Links und die Zurück-Taste einer Maus gehen auf den Desktops zurück, auf dem Web der Zurück-Button des Browsers.

Für Inhalte, die über dem Stack und seinem Header erscheinen, etwa ein Sheet oder ein Vollbild-Flow, verwende einen
[Dialog](./dialog.md).
