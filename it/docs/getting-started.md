---
title: "Per iniziare"
description: "Crea un'app in Rust o TSX con nsh init, eseguila su iOS, Android, macOS, Windows, Linux o sul web, ospita i moduli TSX nella tua app e distribuiscili come pacchetti firmati, oppure crea il pacchetto dell'app in modo autonomo."
order: 4
group: start
demo: guide-getting-started
source_hash: 57c002bb7e893547
---

# Per iniziare

Questa guida crea un'app NSH, la esegue sulle piattaforme di destinazione e la distribuisce. Le app NSH si scrivono in Rust o TSX, sullo stesso motore: Rust compila la tua app in codice nativo senza alcuna VM JavaScript, mentre TSX gira su QuickJS con aggiornamenti a caldo, come moduli che un'app nativa può caricare a run time. La guida segue prima un'app Rust, poi la stessa app in TSX. Presuppone che `nsh` sia installato e nel tuo `PATH` ([Installazione](./installation.md)); in un checkout usa invece `./target/debug/nsh`.

> [!TIP]
> Non hai un progetto di app a portata di mano? Le prime due sezioni non ne richiedono uno: `nsh run` mostra l'app in una finestra sul tuo computer, nel simulatore iOS, su un dispositivo Android o nel browser. Puoi fermarti lì, oppure [impacchettarla come app standalone](#or-ship-it-as-a-standalone-app).

<a id="create-an-app"></a>

## Creare un'app

In un terminale, `nsh init` chiede in cosa è scritta l'app: `rust`, `ts` o `mixed` (TSX con un crate Rust dedicato). `--template` sceglie senza chiedere.

### In Rust

```sh
nsh init my-app --template rust
```

`nsh init` crea la directory e scrive un progetto Cargo:

| File | Cos'è |
|---|---|
| `src/lib.rs` | L'app: il suo componente radice, lo stato e gli handler |
| `src/main.rs` | Monta la stessa radice su macOS, Windows o Linux per `cargo run` |
| `Cargo.toml` | Il crate, che dipende da `nsh-core` e `nsh-base` alla versione della CLI |
| `nsh.json` | Il nome, l'id, la versione e il numero di build dell'app, il suo crate (`"rust": "."`) e il componente radice (`"root": "App"`) ([Struttura del progetto](./project-structure.md#nshjson)) |
| `App.test.tsx` | Il test della radice, in TypeScript (`nsh test`), con `tsconfig.json` e `.nsh/types` per il tuo editor |
| `README.md` | Come eseguire, testare e impacchettare l'app, e come aggiungere più avanti un entry TSX |
| `.gitignore` | Ignora `.nsh/` e `target/` |

Lo sviluppo in Rust richiede una toolchain Rust ([rustup](https://rustup.rs)); i comandi `nsh` compilano i runner dell'app dai crate di NSH su crates.io, alla versione della CLI.

### In TSX

```sh
nsh init my-app --template ts
```

Un'app TSX è composta da uno o più file `.tsx` con un entry: ciò che esegue `nsh run` e ciò che un'app host carica come modulo.

| File | Cos'è |
|---|---|
| `App.tsx` | Il modulo entry: renderizza l'app con `mount` |
| `App.test.tsx` | Il suo test (`nsh test`) |
| `nsh.json` | Il nome, l'id, la versione e il numero di build dell'app ([Struttura del progetto](./project-structure.md#nshjson)) |
| `tsconfig.json` | Estende `.nsh/tsconfig.json`, le impostazioni TypeScript di NSH, che risolvono `nsh` nelle dichiarazioni in `.nsh/types` |
| `.gitignore` | Ignora `.nsh/` e `target/` |
| `.nsh/types/` | Dichiarazioni generate di ogni modulo NSH, per il tuo editor |

I file già esistenti vengono mantenuti, quindi puoi eseguirlo in una directory che ne contiene alcuni; un'app Rust viene creata in una nuova directory.

In entrambi i casi il nome visualizzato è per impostazione predefinita il nome della directory; passa `--name "My App"` per sceglierne un altro. L'id diventa `com.example.<name>`: modificalo in `nsh.json` prima della distribuzione. `nsh init my-app --template mixed` crea un'app TSX che è anche un crate Rust (`Cargo.toml` e `src/lib.rs` accanto a `App.tsx`), il cui componente, modulo e classe sono importati da `App.tsx` ([Sviluppo con Rust](./rust.md)).

<a id="the-root-component"></a>

### Il componente radice

I due template producono la stessa app, un contatore:

```rust tabs
// src/lib.rs
use nsh_base::theme;
use nsh_core::prelude::*;

/// The crate's UI set: what a TSX entry may import from `my-app/native`.
#[native_module("my-app/native")]
fn native(registry: &mut Registry) {
    registry.register::<App>();
}

/// The application's root component.
#[component]
pub fn App() -> impl IntoElement {
    let count = signal(0_u32);
    view()
        .flex_1()
        .bg(move || theme().background)
        .text_color(move || theme().foreground)
        .child(
            view()
                .flex_1()
                .p_safe_area()
                .child(
                    view()
                        .flex_1()
                        .items_center()
                        .justify_center()
                        .gap_4()
                        .child(text(move || format!("Count: {}", count.get())).text_size(px(28.0)))
                        .child(
                            view()
                                .px_5()
                                .py_3()
                                .rounded(px(10.0))
                                .bg(move || theme().primary)
                                .active(|s| s.opacity(0.6))
                                .on_press(move || count.update(|value| *value += 1))
                                .child(
                                    text("Tap")
                                        .text_size(px(17.0))
                                        .text_color(move || theme().primary_foreground),
                                ),
                        ),
                ),
        )
}
```

```tsx tabs
// App.tsx
import { mount, signal, Text, View } from "nsh";

function App() {
  const count = signal(0);
  return (
    <View class="flex-1 items-center justify-center gap-4 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Text class="text-3xl font-semibold text-foreground">{count()}</Text>
      <View
        onPress={() => count.update((c) => c + 1)}
        role="button"
        class="rounded-(--radius) bg-primary px-5 py-3 active:bg-primary/90"
      >
        <Text class="text-lg text-primary-foreground">Tap</Text>
      </View>
    </View>
  );
}

mount(App);
```

In Rust:

- **`use nsh_core::prelude::*`** porta le primitive (`view()`, `text()`, `scroll()`, `input()`, `image()`, ...), i [signal](./reactivity.md) e i metodi di stile tipizzati (`.p_safe_area()` aggiunge padding a una view in base all'[area sicura](../elements/safe-area.md)); **`nsh_base`** contiene i componenti di base senza stile (`button()`, la tastiera, i dialoghi) e `theme()`, i colori e i raggi con cui disegnano i componenti dell'app ([Tema](./rust.md#theme)).
- **`#[component] pub fn App()`** è un componente: una funzione che viene eseguita **una sola volta** e restituisce i suoi elementi. `"root": "App"` di `nsh.json` lo nomina e `nsh run` lo monta. `signal(0_u32)` crea un valore che cambia nel tempo.
- **`text(move || format!(…, count.get()))`** collega il testo al signal: quando `count` cambia, NSH esegue di nuovo questa closure e aggiorna solo questo testo, nient'altro. Gli stili accettano closure allo stesso modo: `.bg(move || theme().primary)` segue il tema in dark mode.
- **`.on_press(..)`** fa rispondere la view alle pressioni; `.active(|s| s.opacity(0.6))` è il suo stile durante la pressione, applicato in modo nativo. Il pulsante è dell'app: NSH fornisce le primitive e le capability, e l'app disegna la propria UI a partire da esse.
- **`.px_5()`, `.rounded(px(10.0))`, `.gap_4()`** sono metodi di stile tipizzati con i nomi delle utility di Tailwind, in punti (`px`). Il layout è flexbox e i figli si dispongono in colonna per impostazione predefinita ([Layout](./layout.md)).
- **`#[native_module("my-app/native")]`** indica cosa un entry TSX può importare dal crate, per quando aggiungi schermate TSX sopra di esso ([Sviluppo con Rust](./rust.md#extending-a-rust-app-with-tsx)).

In TSX:

- **`import { mount, signal, Text, View } from "nsh"`**: `nsh` è il modulo core: signal, `mount`, le altre primitive reattive e gli elementi host. È servito dal runtime nativo, non incluso nel bundle. **`nsh/base`** contiene i componenti di base, come fa `nsh_base` in Rust.
- **`function App()`** è un componente che viene eseguito **una sola volta**. **`{count()}`** legge il signal dentro il JSX: il compilatore vede una chiamata e fa sì che questo testo segua il signal.
- **`<View onPress>`** è una view nativa che reagisce alle pressioni; le classi `active:` sono il suo stile durante la pressione. `View`, `Text`, `Image`, `Scroll` e gli altri [elementi host](../elements/index.md) si importano da `nsh` (`Input` da `nsh/base`); solo `If` e `Each` non richiedono import.
- **`class`** accetta classi [Tailwind](./tailwind.md); `style={{ … }}` accetta un oggetto di proprietà di stile in camelCase, con numeri in punti. `bg-background`, `bg-primary`, `text-primary-foreground` e `rounded-(--radius)` nominano i token del tema dell'app ([Token del tema](./tailwind.md#theme-tokens)): seguono da soli la dark mode, e `"theme"` in `nsh.json` li ristila.
- **`mount(App)`** renderizza il componente nella superficie dell'app.

> [!IMPORTANT]
> Il testo si mostra in un elemento di testo: `text(..)` in Rust, `<Text>` in TSX. In TSX, il testo scritto direttamente in un `<View>` (`<View>Hello</View>`) è un errore di build che lo segnala, e una stringa che un'espressione vi inserisce (`<View>{name}</View>`) viene riportata nel log.

<a id="develop-it"></a>

## Svilupparla

<a id="run-it"></a>

### Eseguirla

`nsh run` compila l'app, la avvia e la ricompila mentre modifichi; i log dell'app compaiono nel terminale. Passagli la directory dell'app: esegue la radice di un'app Rust, oppure `App.tsx` di un'app TSX (`nsh run my-app/App.tsx` indica un altro entry).

Per un'app Rust, `nsh run` compila il runner dell'app per la destinazione, con il tuo crate e la radice montata e senza QuickJS, e lo avvia; una modifica al codice Rust lo ricompila e riavvia l'app. `cargo run` nella directory dell'app avvia la stessa radice direttamente sul backend desktop. Per un'app TSX, `nsh run` avvia un dev server e un host di sviluppo che carica l'app da esso, e applica una patch all'app in esecuzione a ogni salvataggio.

Senza `--target`, `nsh run` usa la macchina su cui ti trovi: una finestra AppKit su macOS, una finestra Win32 su Windows e una finestra GTK su Linux. Scegli un'altra piattaforma con `--target`:

| Destinazione | Comando | Si avvia da |
|---|---|---|
| Simulatore iOS | `nsh run my-app --target ios` | macOS con Xcode |
| Android | `nsh run my-app --target android` | macOS, Windows, Linux |
| macOS (AppKit) | `nsh run my-app` | macOS (predefinito) |
| Windows | `nsh run my-app` | Windows (predefinito) |
| Linux (GTK 4) | `nsh run my-app` | Linux (predefinito) |
| Web | `nsh run my-app --target web` | macOS, Windows, Linux |
| Mac Catalyst | `nsh run my-app --target catalyst` | macOS |

<a id="ios-simulator"></a>

#### Simulatore iOS

```sh
nsh run my-app --target ios
nsh run my-app --target ios --device "iPhone 16 Pro"
```

`nsh` usa un simulatore già avviato, oppure avvia l'iPhone più recente se nessuno è in esecuzione, e vi installa l'app (il runner di un'app Rust, o l'host di sviluppo). `--device` sceglie un simulatore per nome o UDID.

#### Android

```sh
nsh run my-app --target android
```

Avvia prima un emulatore o collega un dispositivo (`adb devices` li elenca; NSH usa il primo). `nsh` vi installa l'app: il `libnsh.so` dell'app Rust, oppure un APK host di sviluppo (ricompilato solo quando cambia il runtime) la cui porta del dev server viene inoltrata al dispositivo con `adb reverse`, così funziona via USB senza una rete condivisa.

#### macOS (AppKit)

```sh
nsh run my-app --target macos
```

L'app si apre come app desktop per Mac (AppKit, in una finestra ridimensionabile), con input da mouse, trackpad e tastiera al posto dei tocchi. Richiede macOS 14 o successivo; vedi [macOS](./macos.md).

<a id="windows-default-on-windows"></a>

#### Windows (predefinito su Windows)

```sh
nsh run my-app
```

L'app si apre in una finestra desktop (1200×800 punti), con input da mouse, touchpad, touch e tastiera. Richiede Windows 10 1809 o successivo; vedi [Windows](./windows.md).

<a id="linux-default-on-linux"></a>

#### Linux (predefinito su Linux)

```sh
nsh run my-app
```

L'app si apre in una finestra GTK (390×844 punti). Richiede GTK 4.14 o successivo; vedi [Linux](./linux.md).

#### Web

```sh
nsh run my-app --target web
```

`nsh` stampa l'indirizzo della pagina; aprilo in un browser. Un'app Rust gira come WebAssembly con il tuo crate, e la pagina aperta carica da sola la nuova build dopo una modifica; vedi [Web](./web.md).

#### Mac Catalyst

```sh
nsh run my-app --target catalyst
```

L'app si apre in una finestra delle dimensioni di un iPhone (390×844 punti) sul tuo Mac. È il modo più rapido per vedere un'app come la mostra un telefono: nessun simulatore da avviare. Usa UIKit come iOS, quindi ciò che vedi è ciò che mostra un iPhone, a parte i comportamenti specifici del Mac come lo scorrimento con la rotella del mouse. Per l'app Mac vera e propria, usa `--target macos`.

<a id="edit-it"></a>

### Modificarla

Lascia `nsh run` in esecuzione e cambia l'etichetta del pulsante:

```rust tabs
text("Add one")
    .text_size(px(17.0))
    .text_color(move || theme().primary_foreground)
```

```tsx tabs
<Text style={{ color: "white", fontSize: 17 }}>Add one</Text>
```

Salva. Un'app Rust viene ricompilata e riparte con la nuova etichetta; il conteggio ricomincia da capo. Un'app TSX riceve un aggiornamento a caldo: la CLI ricompila e invia una patch, e l'host esegue di nuovo il modulo modificato e renderizza di nuovo solo i componenti il cui codice è cambiato. Qui si tratta di `App`, che possiede il signal `count`, quindi anche il conteggio ricomincia da capo.

Le parti di UI si spostano in componenti propri, o in semplici funzioni che restituiscono elementi:

```rust tabs
/// The app's button: a view that answers presses.
fn tap_button(on_press: impl Fn() + 'static) -> impl IntoElement {
    view()
        .p_3()
        .rounded(px(10.0))
        .bg(move || theme().primary)
        .active(|s| s.opacity(0.6))
        .on_press(on_press)
        .child(text("Tap").text_size(px(17.0)).text_color(move || theme().primary_foreground))
}

// In App: .child(tap_button(move || count.update(|value| *value += 1)))
```

```tsx tabs
function TapButton(props: { onPress: () => void }) {
  return (
    <View onPress={props.onPress} activeStyle={{ opacity: 0.6 }} style={{ padding: 12, borderRadius: 10, backgroundColor: "#0969da" }}>
      <Text style={{ color: "white", fontSize: 17 }}>Tap</Text>
    </View>
  );
}

// In App: <TapButton onPress={() => count.update((c) => c + 1)} />
```

In TSX, lo stato sopravvive quando modifichi un componente che non lo possiede: tocca qualche volta, poi cambia il colore di `TapButton`, e il pulsante si aggiorna mentre il conteggio resta. La sostituzione a caldo funziona per componente di primo livello: una funzione con nome maiuscolo il cui corpo contiene JSX. Un componente viene renderizzato di nuovo quando cambia il suo codice, o quando cambia il codice del modulo esterno ai componenti (una costante che usa, un helper). Se una modifica non può essere applicata sul posto (per esempio, importa un modulo NSH che l'app in esecuzione non aveva ancora importato, oppure cambia le capability di `nsh.json`), l'host ricarica l'intera app.

<a id="errors"></a>

#### Errori

Un errore di compilazione Rust viene stampato nel terminale con l'output di cargo, e `nsh run` ricompila al salvataggio successivo. Un errore di build TSX viene stampato nel terminale e mostrato sul dispositivo come overlay rosso con file, riga e colonna; l'app continua a eseguire l'ultima build valida. L'overlay scompare con la build riuscita successiva (toccalo per chiuderlo prima). Un'eccezione lanciata a run time viene mostrata allo stesso modo, con il suo stack ricondotto al sorgente `.tsx`.

<a id="host-it-in-your-app"></a>

## Ospitarla nella tua app

Un'app nativa mostra NSH in una view dedicata: `NshAppView` (una `UIView`) su iOS, `NshView` (una `View` Android) su Android, `AppView` su macOS, Windows, Linux e nelle app GPUI. Posizionala come qualsiasi altra view, in qualsiasi schermata, tutte le volte che ti serve.

Una radice Rust fa parte della build dell'app: l'app collega il tuo crate e monta la radice con `AppSource::Rust` sul `AppView` di macOS, Windows, Linux, GPUI e iOS ([Sviluppo con Rust](./rust.md#an-app-written-in-rust)). Un'app TSX è un modulo che la view carica: durante lo sviluppo dal dev server, in release da un bundle compilato o da un pacchetto firmato scaricato. Le sezioni seguenti caricano moduli TSX.

### iOS

Collega `NativeShellDev.xcframework` in Debug e `NativeShell.xcframework` in Release ([Embedding nelle app iOS](./ios.md)), poi:

```swift
import NativeShell

let app = NshAppView()
app.onError = { message in print("nsh error: \(message)") }
view.addSubview(app)   // and constrain it like any view

#if DEBUG
try app.connectDevServer(URL(string: "ws://127.0.0.1:8790/ws")!)   // `nsh dev my-app` on your Mac
#else
try app.loadBundle(at: Bundle.main.url(forResource: "bundle", withExtension: "nshc", subdirectory: "nsh")!)
#endif
```

`nsh dev my-app` serve il modulo all'app e invia ogni salvataggio, come fa `nsh run` con il proprio host. Per la build di release, `nsh build my-app --release --out MyApp/nsh` scrive il bundle in una cartella che aggiungi alle risorse dell'app.

### Android

Aggiungi `nsh-dev.aar` per le build di debug e `nsh.aar` per le build di release ([Embedding nelle app Android](./android.md)), poi:

```kotlin
val nsh = NshView(this)
nsh.setErrorListener { message -> Log.e("nsh", message) }
setContentView(nsh)   // or add it to any layout

if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws")   // with `adb reverse tcp:8790 tcp:8790`
} else {
    nsh.loadAssetBundle("nsh")   // assets/nsh, from `nsh build my-app --release --out app/src/main/assets/nsh`
}
```

<a id="macos-windows-and-linux"></a>

### macOS, Windows e Linux

Le app desktop scritte in Rust incorporano NSH con `AppView`, dai crate `nsh-platform-macos`, `nsh-platform-windows`, `nsh-platform-linux` e `nsh-platform-gpui`: un `NSView`, una finestra figlia, un widget GTK o una view GPUI che monta una radice Rust o carica un bundle compilato. Vedi [macOS](./macos.md#embedding-in-a-mac-app), [Windows](./windows.md#embedding-in-a-win32-app), [Linux](./linux.md#embedding-in-a-gtk-app) e [GPUI](./gpui.md), e [Piattaforme](./platforms.md#embed-in-a-native-app) per tutti gli host affiancati.

<a id="what-the-module-may-do"></a>

### Cosa può fare il modulo

Su iOS e Android, l'host decide prima del caricamento cosa può fare un modulo: `grantCapabilities` imposta gli host di rete e le altre capability che può raggiungere, e i limiti pongono un tetto alla sua memoria, al tempo di chiamata e al numero di nodi ([Sandbox e capability](./sandbox-and-capabilities.md)). Per fornire ai moduli le tue view native (una mappa, un grafico, un componente del design system), registrale come [componenti nativi](./native-components.md).

<a id="ship-updates-as-signed-packages"></a>

## Distribuire aggiornamenti come pacchetti firmati

Un modulo TSX che l'app scarica dopo il rilascio arriva come pacchetto firmato. Crea una chiave radice una volta sola e tienila offline, certifica con essa una chiave di release e pubblica:

```sh
nsh keygen keys/root && nsh keygen keys/release
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
nsh publish my-app --key keys/release.secret --cert keys/release.cert --build 2
```

L'app considera attendibile la chiave pubblica della radice e carica ciò che scarica; NSH verifica la firma, il certificato e la lista di revoca prima di eseguire qualsiasi cosa:

```swift
let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
let trust = try NshTrust(stateDirectory: support.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)   // the contents of keys/root.pub
let info = try await app.loadPackage(at: downloadedFile, trust: trust)
```

Android ha lo stesso flusso con `NshTrust` e `NshPackage`. Hosting, distribuzione e revoca nel dettaglio: [Pacchetti firmati](./signed-packages.md).
<a id="or-ship-it-as-a-standalone-app"></a>

## Oppure distribuiscila come app standalone

`nsh package` crea un'app installabile, in Rust o TSX, senza bisogno di un progetto Xcode o di una build Gradle propri:

```sh
nsh package my-app --target ios-simulator --run
nsh package my-app --target android
nsh package my-app --target macos
nsh package my-app --target linux
nsh package my-app --target windows
nsh package my-app --target web
```

Un'app Rust viene pacchettizzata con un proprio runner, costruito a partire dal tuo crate e dai crate di NSH, con la sua root montata; un'app TSX con il runtime precompilato. Opzioni, firma e icone: [Packaging](./packaging.md).

<a id="try-it-in-the-terminal"></a>

## Provala nel terminale

`nsh test` esegue un'app in modalità headless, senza dispositivo né finestra. Dato il `nsh.json` di un'app Rust o l'entry di un'app TSX, apre l'app, la lascia in esecuzione e stampa ciò che monta; con `--trace`, stampa anche le operazioni native sulle view e il tempo di ogni commit ([Testing](./testing-and-trace.md)):

```sh
nsh test my-app/nsh.json --trace     # a Rust app's root
nsh test my-app/App.tsx --trace      # a TSX app's entry
```

Data una directory, esegue i test dell'app: il `App.test.tsx` di ogni template apre l'app, preme il suo pulsante e verifica ciò che mostra (`nsh test my-app`). Quello di un'app Rust apre la sua root (`open(".")`); può anche essere testata in `cargo test` con `nsh_testing::Headless` ([Building with Rust](./rust.md#testing)).

<a id="next-steps"></a>

## Prossimi passi

- [Building with Rust](./rust.md): app Rust, il loro tema e TSX sopra un crate Rust.
- [JSX and components](./jsx-and-components.md) e [Reactivity](./reactivity.md): componenti e signal, in Rust e TSX.
- [Platforms](./platforms.md): cosa supporta ogni piattaforma e la sua pagina dedicata ([iOS](./ios.md), [Android](./android.md), [macOS](./macos.md), [Windows](./windows.md), [Linux](./linux.md)).
- [Signed packages](./signed-packages.md) e [Sandbox and capabilities](./sandbox-and-capabilities.md): distribuzione e cosa possono fare i moduli.
- [Project structure](./project-structure.md): cosa va in `nsh.json`, asset, file.
