---
title: "Codice specifico per piattaforma"
description: "Scrivere un'unica app per telefoni, desktop e browser - prop esclusive per piattaforma in ios={{}} / android={{}} / desktop={{}} / web={{}}, i moduli nsh/mobile e nsh/desktop, platform.os e platform.select, e varianti Tailwind per piattaforma."
order: 17
group: platforms
source_hash: 3943d421295a93f3
---

# Codice specifico della piattaforma

Un solo bundle NSH funziona su iOS, Android, macOS, Windows e Linux (e in Mac Catalyst), e nei browser tramite il [web runtime](./web.md). La maggior parte di un'app non richiede alcun controllo della piattaforma: elementi, stili, layout e moduli si comportano allo stesso modo ovunque, e i componenti che costruisci con essi hanno lo stesso aspetto ovunque. Quando qualcosa è davvero specifico di una piattaforma, NSH gli riserva un posto ben definito, così il codice di piattaforma resta visibile e circoscritto:

| Rust | TSX | Per |
|---|---|---|
| [Metodi builder (`.ripple(..)`, `.input_accessory(..)`)](#platform-only-props) | [`ios={{…}}`, `android={{…}}`, `desktop={{…}}`, `web={{…}}`](#platform-only-props) | Prop che esistono solo su una piattaforma. |
| [`on_back_press`, `nsh_core::element::desktop`](#platform-modules) | [`nsh/mobile`, `nsh/desktop`](#platform-modules) | API presenti solo sulle piattaforme mobile o solo sui desktop. |
| [`os()`, `idiom()`, `is_desktop()`](#platformos-and-platformselect) | [`platform.os`, `platform.desktop`, `platform.select`](#platformos-and-platformselect) | Scegliere valori o codice per piattaforma. |
| [`.when(os() == Os::Ios, ..)`](#platform-variants-in-tailwind) | [Classi `ios:` / `android:` / `web:`](#platform-variants-in-tailwind) | Stili per piattaforma. |

<a id="desktop-and-mobile"></a>

## Desktop e mobile

Ogni piattaforma è desktop o mobile, secondo un'unica regola. Desktop sono macOS, Windows, Linux e i browser nell'idioma desktop (un mouse e una finestra ampia, [il web](./web.md)). Mobile sono iOS, Android e i browser nell'idioma telefono o tablet; Mac Catalyst esegue il backend iOS, quindi è anch'esso mobile, con prop `ios={{…}}`. Seguono questa regola le prop `desktop={{…}}`, `platform.select({ desktop, mobile })`, `platform.desktop` e `platform.idiom === "desktop"`, così come i componenti di `nsh/base` (un menu è un popup sui desktop e un foglio su mobile) e, in Rust, `is_desktop()`.

Il `isAvailable` di `nsh/desktop` risponde a una domanda più ristretta: se le API di finestra e menu di quel modulo funzionano, il che avviene su macOS, Windows e Linux. Usa `platform.desktop` per condizionare layout, densità e input, e `isAvailable` per le chiamate a `Window` e `Menu`.

<a id="platform-only-props"></a>

## Prop specifiche della piattaforma

In Rust, una prop che esiste su una sola piattaforma è un metodo builder come gli altri (`.ripple(..)`, `.elevation(..)` per Android, `.input_accessory(..)` per iOS, `.window_drag(..)` per i desktop); le altre piattaforme la ignorano. In TSX, le prop che esistono su una sola piattaforma sono raggruppate in un oggetto che porta il suo nome. Ogni elemento accetta `ios`, `android`, `desktop` (macOS, Windows, Linux e i browser nell'idioma desktop) e `web` (browser); sulle altre piattaforme l'oggetto viene ignorato e, sulla piattaforma di appartenenza, vengono applicate solo le sue chiavi. Un browser desktop applica sia `desktop` sia `web`.

```rust tabs
use nsh_base::dialog;
use nsh_core::{
    Ripple,
    element::{AutoFill, Orientation}, prelude::*,
};

view()
    .on_press(open)
    .active(|s| s.opacity(0.6))
    .ripple(Ripple {
        color: Some(rgba(0x0000001f).into()),
        ..Ripple::default()
    })
    .elevation(px(4.0))
    .p_4()
    .rounded(px(12.0))
    .bg(white())
    .child(text("Open"))

input().placeholder("Code").auto_fill(AutoFill::OneTimeCode)

when(shown, || {
    dialog()
        .supported_orientations([Orientation::Portrait])
        .status_bar_translucent(true)
        .child(…)
})
```

```tsx tabs
<View
  onPress={open}
  activeStyle={{ opacity: 0.6 }}
  android={{ ripple: { color: "rgba(0,0,0,0.12)" }, elevation: 4 }}
  style={{ padding: 16, borderRadius: 12, backgroundColor: "#ffffff" }}
>
  <Text>Open</Text>
</View>

<Input
  placeholder="Code"
  ios={{ textContentType: "oneTimeCode" }}
/>

<Dialog open={open()} ios={{ supportedOrientations: ["portrait"] }} android={{ statusBarTranslucent: true }}>
  …
</Dialog>
```

Gli oggetti TSX sono reattivi come qualsiasi prop; una chiave rimossa dall'oggetto viene azzerata.

Ciò che esiste oggi:

| Rust | TSX | Su | Descrizione |
|---|---|---|---|
| `.ripple(Ripple { .. })` | `android={{ ripple }}` | ogni elemento | L'effetto ripple material durante la pressione: color, borderless, radius, foreground. |
| `.elevation(..)` | `android={{ elevation }}` | ogni elemento | L'ombra material, in punti, a partire dalla forma della vista. |
| | `android={{ accessibilityLiveRegion }}` | ogni elemento | `"none"`, `"polite"` o `"assertive"`: TalkBack annuncia i cambiamenti della vista. |
| `.status_bar_translucent(..)` | `android={{ statusBarTranslucent }}` | `Dialog` | Il contenuto del dialogo si estende sotto la barra di stato. |
| `.input_accessory(..)` | `ios={{ inputAccessoryViewID }}` | `Input` | Il `InputAccessoryView` mostrato sopra la tastiera. |
| `.auto_fill(..)` | `ios={{ textContentType }}` | `Input` | I nomi di iOS per i tipi di compilazione automatica (`AutoFill` di Rust copre entrambe le piattaforme). |
| `.supported_orientations(..)` | `ios={{ supportedOrientations }}` | `Dialog` | Gli orientamenti che consente. |
| `.back_forward_gestures(..)` | `ios={{ allowsBackForwardNavigationGestures }}` | `WebView` | Scorrimento indietro e avanti nella cronologia delle pagine. |
| `.header_right_system_item(..)` | `ios={{ headerRightSystemItem }}` | `NavPage` | Il pulsante di barra nativo di UIKit alla fine dell'intestazione, che esegue `headerRight` alla pressione. |
| `.header_left_system_item(..)` | `ios={{ headerLeftSystemItem }}` | `NavPage` | Il pulsante di barra nativo di UIKit all'inizio dell'intestazione, che esegue `headerLeft` alla pressione. |
| `.header_right_symbol(..)` | `ios={{ headerRightSymbol }}` | `NavPage` | Il pulsante di barra nativo di UIKit che mostra un SF Symbol alla fine dell'intestazione, che esegue `headerRight` alla pressione. |
| `.header_left_symbol(..)` | `ios={{ headerLeftSymbol }}` | `NavPage` | Il pulsante di barra nativo di UIKit che mostra un SF Symbol all'inizio dell'intestazione, che esegue `headerLeft` alla pressione. |
| `.back_forward_gestures(..)` | `desktop={{ allowsBackForwardNavigationGestures }}` | `WebView` | macOS: gli swipe a due dita sul trackpad vanno indietro e avanti nella cronologia delle pagine; Windows: swipe sul touchscreen; Linux: swipe sul touchpad. |
| `.window_drag(..)` | `desktop={{ windowDrag }}` | ogni elemento | Premendolo si trascina la finestra, come farebbe la barra del titolo di sistema (vedi [nsh/desktop](../modules/nsh-desktop.md#a-title-bar-of-your-own)). |

In TSX, `desktop={{…}}` e `web={{…}}` sono accettati ovunque. I tipi (`IOSProps`, `AndroidProps`, `DesktopProps` e le loro forme per elemento) indicano al tuo editor cosa accetta ciascun elemento.

Ciò che un elemento significa su ogni piattaforma è una prop di primo livello (in Rust un metodo con lo stesso nome), applicata dove ha un significato: `title`, `headerStyle`, `headerLargeTitle` e `headerBackTitle` di `NavPage` configurano l'intestazione di sistema di iOS e Android, il suo slot `header` è l'intestazione dei desktop e del web, e `presentation` di `Dialog` sceglie i fogli di iOS. `closeOnBackdropPress`, `pagingEnabled`, `refreshing`, `hitSlop` e le altre di `AlertDialog.show` funzionano su ogni piattaforma. Una funzionalità di sistema propria di una piattaforma va nel suo oggetto e, quando più piattaforme la hanno, in ciascuno dei rispettivi oggetti con lo stesso nome: `allowsBackForwardNavigationGestures` di `WebView`, gli swipe di sistema nella cronologia delle pagine, si trova in `ios={{…}}` e `desktop={{…}}`.

<a id="platform-modules"></a>

## Moduli di piattaforma

In Rust, le API che esistono su una sola piattaforma sono funzioni di `nsh_core::prelude` (`on_back_press`, `input_accessory_view`) e di `nsh_core::element::desktop` (la finestra: `set_title`, `set_title_bar`, `title_bar`, `minimize`, `toggle_maximize`, `toggle_full_screen`, `set_frame`, `set_level`, `order_front`, `close_window`; i menu: `set_application_menu`, `popup_menu`); altrove non fanno nulla. In TSX, `nsh/mobile` contiene le API di iOS e Android (alcune di una sola piattaforma), `nsh/desktop` quelle dei desktop. Entrambi si possono importare su ogni piattaforma, così un solo bundle funziona ovunque: sulle altre piattaforme le loro funzioni ritornano subito e i loro componenti non occupano spazio. Ognuno esporta `isAvailable`, che è `true` sulle proprie piattaforme; `platform.os` permette di distinguerli.

### nsh/mobile

`isAvailable` è `true` su iOS (con Mac Catalyst) e Android. Entrambe le piattaforme hanno [`TabBar`](../modules/nsh-mobile.md#tabbar), la barra delle schede di sistema.

#### BackHandler (Android)

| Rust | TSX | Descrizione |
|---|---|---|
| `on_back_press(listener)` | `BackHandler.on("press", listener)` | Ascolta il pulsante indietro dopo i dialoghi e prima degli stack; restituisci `true` quando è gestito. Il listener segue il componente (o l'effetto) che lo ha aggiunto; in TSX la chiamata restituisce anche una funzione che lo ferma prima. |
| | `BackHandler.exitApp()` | Esce dall'app. |

```rust tabs
use nsh_core::prelude::*;

fn player() -> impl IntoElement {
    let full_screen = signal(false);
    // Back leaves full screen before it leaves the page. The listener goes
    // with the view.
    on_back_press(move || {
        if !full_screen.get_untracked() {
            return false;
        }
        full_screen.set(false);
        true
    });
    // …
}
```

```tsx tabs
import { BackHandler } from "nsh/mobile";

function Player() {
  // Back leaves full screen before it leaves the page. The listener goes
  // with the component.
  BackHandler.on("press", () => {
    if (!fullScreen()) return false;
    fullScreen.set(false);
    return true;
  });
  // …
}
```

Il pulsante indietro viene gestito prima dal dialogo in primo piano, poi dai listener di ritorno (il più recente per primo), poi dallo stack di navigazione in primo piano, e l'app termina se nessuno lo ha gestito. Vedi [Navigation](./navigation.md#the-android-back-button).

#### InputAccessoryView (iOS)

| Rust | TSX | Descrizione |
|---|---|---|
| `input_accessory_view(native_id)` | `InputAccessoryView` | Una barra sopra la tastiera degli input che indicano il suo native id (`.input_accessory(..)`, `ios={{ inputAccessoryViewID }}`). |

Vedi [Forms and the keyboard](./forms-and-keyboard.md#a-bar-over-the-keyboard-ios-inputaccessoryview).

### nsh/desktop

Le app Rust disegnano le proprie barre del titolo con `nsh_core::element::desktop` ([Building with Rust](./rust.md#desktop-title-bars)). Il modulo TSX:

| Export | Descrizione |
|---|---|
| `Window` | La finestra: `setTitle`, `setTitleBar({ style: "hidden" })` per una barra del titolo propria dell'app, `minimize`, `toggleMaximize`, `toggleFullScreen`, `close`. |
| `titleBar` | L'altezza della barra del titolo nascosta e lo spazio occupato dai controlli di finestra del sistema (reattivo). |
| `Menu` | `setApplicationMenu(items)` (la barra dei menu, con scorciatoie) e `popup(items, at?)` (menu contestuali). |
| `isAvailable` | `true` dove le API di finestra e menu funzionano: macOS, Windows e Linux. I browser desktop hanno `platform.desktop` e mantengono la finestra e i menu del browser. |

Vedi [nsh/desktop](../modules/nsh-desktop.md).

<a id="the-status-bar"></a>

### La barra di stato

Su entrambe le piattaforme la barra di stato appartiene alla pagina o al dialogo in primo piano, come in UIKit, dove decide il view controller più in alto: [`NavPage` e `Dialog` accettano `statusBar`](../modules/nsh-base.md#status-bar) (in Rust `.status_bar(StatusBarStyle::Light)`, oppure un `StatusBarSetting` per gli altri campi) con `foreground` (`"auto"`, `"light"` per sfondi scuri, `"dark"` per sfondi chiari), `hidden` e `animated`. Vince la pagina o il dialogo mostrato più di recente, campo per campo, e quando scompare si applica di nuovo quello sottostante. `"statusBar"` di `nsh.json` è il valore predefinito dell'app sotto di essi.

```rust tabs
use nsh_base::nav_page;
use nsh_core::prelude::*;

fn photo_viewer() -> impl IntoElement {
    nav_page()
        .header_visible(false)
        .status_bar(StatusBarStyle::Light)
        .child(view().flex_1().bg(black()))
}
```

```tsx tabs
import { View } from "nsh";
import { NavPage } from "nsh/base";

function PhotoViewer() {
  return (
    <NavPage headerVisible={false} statusBar={{ foreground: "light" }}>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>…</View>
    </NavPage>
  );
}
```

In un'app incorporata in un'app nativa, su iOS è il view controller dell'app host a decidere la barra di stato. Un'app che dichiara `"capabilities"` in `nsh.json` ha bisogno di `"statusBar": true` per modificarla.

<a id="platformos-and-platformselect"></a>

## platform.os e platform.select

`os()` in Rust e la costante `platform` da `nsh` in TSX indicano dove viene eseguita l'app: `Os::Ios`, `Os::Android`, `Os::MacOs`, `Os::Windows`, `Os::Linux` o `Os::Web`, e `platform.os` `"ios"`, `"android"`, `"macos"`, `"windows"`, `"linux"` o `"web"` (Mac Catalyst è `"ios"`, con `platform.catalyst` in entrambi i suoi idiomi; il [backend macOS](./macos.md) è `"macos"`, il [backend Linux](./linux.md) `"linux"` e il [backend Windows](./windows.md) `"windows"`, e i loro elementi applicano le prop `desktop`; i [browser](./web.md) sono `"web"` e applicano anche le prop `desktop` quando `platform.desktop` è `true`). Vedi [Device and environment](./device-and-environment.md#the-platform) per la versione, l'idioma e il resto.

```rust tabs
use nsh_core::{element::Os, prelude::*};

if os() == Os::Android {
    // …
}
```

```tsx tabs
import { platform } from "nsh";

if (platform.os === "android") {
  // …
}
```

### platform.select

In Rust un `match os()` sceglie il valore, con `is_desktop()` per i desktop. In TSX, `platform.select(spec)` restituisce il valore per questa piattaforma. Cerca la chiave propria del sistema operativo, poi `desktop` o `mobile` secondo [la regola sopra](#desktop-and-mobile) (`platform.desktop`), poi `native` (ogni piattaforma tranne il web), poi `default`:

```rust tabs
use nsh_core::{element::Os, prelude::*};

fn card() -> View {
    let card = view().rounded(px(12.0)).bg(white());
    match os() {
        Os::Ios => card.shadow_md(),
        Os::Android => card.border_1().border_color(rgb(0xe5e7eb)),
        _ => card,
    }
}

let hint = match os() {
    Os::Ios => "Swipe down to close",
    Os::Android => "Press back to close",
    _ => "Close",
};
```

```tsx tabs
const styles = {
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    ...platform.select({
      ios: { boxShadow: "0px 2px 8px rgb(0 0 0 / 0.12)" },
      android: { borderWidth: 1, borderColor: "#e5e7eb" },
    }),
  },
};

const hint = platform.select({ ios: "Swipe down to close", android: "Press back to close", default: "Close" });
```

Restituisce `undefined` quando nulla corrisponde e non c'è `default`.

<a id="rendering-different-components"></a>

### Rendere componenti diversi

Scegli i componenti nello stesso modo, a livello di modulo (TSX) quando la scelta non cambia mai:

```rust tabs
fn spinner() -> AnyElement {
    if os() == Os::Ios {
        ios_spinner().into_element()
    } else {
        material_spinner().into_element()
    }
}
```

```tsx tabs
const Spinner = platform.select({ ios: IosSpinner, default: MaterialSpinner })!;
```

oppure inline con [`when` / `<If>`](../elements/control-flow.md):

```rust tabs
when(os() == Os::Ios, || input_accessory_view("bar").child(…))
    .otherwise(|| text("Android has no input accessories."))
```

```tsx tabs
<If when={platform.os === "ios"} else={<Text>Android has no input accessories.</Text>}>
  <InputAccessoryView nativeID="bar">…</InputAccessoryView>
</If>
```

<a id="platform-variants-in-tailwind"></a>

## Varianti di piattaforma in Tailwind

Rust applica gli stili per piattaforma con `.when(os() == Os::Ios, |v| ..)`; in TSX, le varianti `ios:`, `android:` e `web:` applicano classi su una sola piattaforma:

```rust tabs
view()
    .rounded_xl()
    .bg(white())
    .p_4()
    .when(os() == Os::Ios, |v| v.shadow_md())
    .when(os() == Os::Android, |v| v.border_1().border_color(rgb(0xe4e4e7)))
```

```tsx tabs
<View class="rounded-xl bg-white p-4 ios:shadow-md android:border android:border-zinc-200">…</View>
<Text class="text-base android:font-medium">Title</Text>
```

<a id="prefer-shared-behavior"></a>

## Preferisci il comportamento condiviso

Prima di ricorrere a un controllo della piattaforma, valuta se la differenza conta davvero per i tuoi utenti. Elementi e stili si adattano già al comportamento nativo di ciascuna piattaforma dove deve differire (fisica dello scorrimento, rendering del testo, tastiere, accessibilità), restando uguali dove gli utenti si aspettano coerenza (l'aspetto proprio della tua app). I controlli della piattaforma è meglio riservarli alle convenzioni di piattaforma su cui gli utenti fanno affidamento: il pulsante indietro e i toast di Android, i fogli e i titoli grandi di iOS, i nomi di compilazione automatica, il ripple di Android.

<a id="related"></a>

## Vedi anche

- [`InputAccessoryView`](../modules/nsh-mobile.md#inputaccessoryview) e [`BackHandler`](../modules/nsh-mobile.md#backhandler): i riferimenti.
- [API del dispositivo di `nsh`](../modules/nsh.md#device): `platform`.
- [Native components](./native-components.md): usare le viste fornite dalla tua app host su ciascuna piattaforma.
- [Tailwind](./tailwind.md): tutte le varianti.
