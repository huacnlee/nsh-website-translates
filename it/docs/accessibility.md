---
title: "Accessibilità"
description: "Come rendere le app compatibili con VoiceOver e TalkBack: etichette, ruoli, stati, valori, azioni personalizzate, raggruppamento e occultamento, annunci e focus, dimensione del testo e riduzione del movimento."
order: 48
group: ui
source_hash: 0f504242ebec73ee
---

# Accessibilità

NSH esegue il rendering con viste native, quindi le tecnologie assistive delle piattaforme (VoiceOver su iOS e Mac Catalyst, TalkBack su Android, Switch Control, Voice Control, ...) vedono la vera gerarchia di viste della tua app. Quello che aggiungi tu sono le descrizioni che quelle tecnologie non possono dedurre: cos'è un elemento, cosa dice, in quale stato si trova e cosa può fare. Ogni elemento accetta i metodi (Rust) e le prop (TSX) qui sotto.

<a id="what-you-get-without-doing-anything"></a>

## Cosa ottieni senza fare nulla

- **Il testo viene letto.** Un elemento di testo è un elemento di accessibilità la cui etichetta è il suo testo. Una vista senza etichetta viene letta come i testi che contiene.
- **Le viste premibili sono elementi.** Una vista con un gestore di pressione o pressione prolungata (`.on_press`, `onPress`) è per impostazione predefinita un elemento di accessibilità, e attivarla (doppio tocco con VoiceOver o TalkBack) la preme.
- **Gli input sono campi di testo**, con il loro segnaposto, valore e tastiera.
- **Il testo segue l'impostazione di dimensione dell'utente.** Vedi [Dimensione del testo](#text-size).

<a id="labels-hints-and-roles"></a>

## Etichette, suggerimenti e ruoli

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

| Rust | TSX | Tipo | Descrizione |
|---|---|---|---|
| `.accessible(..)` | `accessible` | `boolean` | La vista è un unico elemento per le tecnologie assistive; i suoi figli non vengono esposti separatamente. |
| `.label(..)` | `accessibilityLabel` | `string` | Ciò che gli screen reader leggono, al posto dei testi contenuti. |
| `.hint(..)` | `accessibilityHint` | `string` | Ciò che fa l'attivazione dell'elemento, letto dopo una pausa. |
| `.role(..)` | `role` | `AccessibilityRole` | Cos'è l'elemento. |
| `.accessibility_state(..)` | `accessibilityState` | `AccessibilityState` | Il suo stato: disabled, selected, checked, busy, expanded, pressed, current. `selected` applica anche lo stile selected, `checked` lo stile checked quando è true e lo stile indeterminate quando è `"mixed"`, `pressed` lo stile pressed quando è true. |
| `.accessibility_level(..)` | `accessibilityLevel` | `number` | Il livello di un'intestazione (1 il più alto), la profondità di un elemento di un albero (1 in cima). |
| `.accessibility_value(..)` | `accessibilityValue` | `{ min?, max?, now?, text? }` | Il valore di un elemento di intervallo o testuale. |
| | `accessibilityActions` | `{ name, label? }[]` | Azioni offerte alle tecnologie assistive. |
| `.on_accessibility_action(..)` | `onAccessibilityAction` | `(e: { actionName }) => void` | È stata eseguita un'azione (Rust: il suo nome). |
| `.accessibility_elements_hidden(..)` | `accessibilityElementsHidden` | `boolean` | Nasconde la vista e il suo sottoalbero alle tecnologie assistive. |
| | `importantForAccessibility` | `"auto" \| "yes" \| "no" \| "no-hide-descendants"` | Indica se la vista (e il suo sottoalbero) è esposta. |
| | `android={{ accessibilityLiveRegion }}` | `"none" \| "polite" \| "assertive"` | Android: come le modifiche della vista vengono annunciate a TalkBack. |
| `.test_id(..)` | `testID` | `string` | Un identificatore per i test della UI (l'accessibility identifier su iOS, il resource id su Android); non viene letto ad alta voce. |

Dai un'etichetta a ogni controllo con sola icona: uno screen reader non può leggere un glifo o un'immagine. Mantieni le etichette brevi e non includere il ruolo ("Riproduci", non "Pulsante riproduci"): il ruolo viene annunciato separatamente.

<a id="roles"></a>

### Ruoli

Il ruolo (`.role(AccessibilityRole::Header)`, `role="header"`) dice all'utente che tipo di elemento è e come usarlo. In Rust è una variante di `AccessibilityRole` (`Button`, `Header`, `Switch`, ...); i valori TSX sono `"none"`, `"button"`, `"link"`, `"search"`, `"image"`, `"imagebutton"`, `"keyboardkey"`, `"text"`, `"adjustable"`, `"header"`, `"summary"`, `"alert"`, `"checkbox"`, `"combobox"`, `"menu"`, `"menubar"`, `"menuitem"`, `"progressbar"`, `"radio"`, `"radiogroup"`, `"scrollbar"`, `"spinbutton"`, `"switch"`, `"tab"`, `"tablist"`, `"timer"`, `"toolbar"`, `"list"`, `"grid"`, `"table"`, `"rowgroup"`, `"row"`, `"columnheader"` e `"cell"` (i ruoli delle parti di [`Table`](../elements/table.md)), `"listbox"` e `"option"` (un elenco di opzioni tra cui scegliere, come l'elenco di [`Select`](../elements/select.md), e le sue opzioni, con quella scelta indicata da `accessibilityState.selected`), `"group"` (elementi correlati che stanno insieme), `"region"` (una sezione che vale la pena raggiungere da sola, come il pannello di un accordion), `"navigation"` (link che si muovono nell'app, come una paginazione), `"tree"` e `"treeitem"` (elementi che si espandono e si comprimono, ciascuno al proprio `accessibilityLevel`), `"menuitemcheckbox"` e `"menuitemradio"` (voci di menu selezionabili, da sole o come una scelta di un gruppo).

I più utili:

- `"button"` per qualsiasi elemento premibile che non sia un link; `"link"` per la navigazione verso un contenuto.
- `"header"` per i titoli di sezione: gli utenti di screen reader saltano tra le intestazioni per scorrere una schermata. `accessibilityLevel` indica il suo livello (1 il più alto) dove la piattaforma ne legge uno.
- `"button"` con `accessibilityState.pressed` per un pulsante a commutazione, che resta attivo o disattivo (il grassetto in una barra degli strumenti).
- `"navigation"` attorno ai link che si spostano tra le pagine, con il link della pagina mostrata marcato da `accessibilityState.current: "page"`.
- `"switch"`, `"checkbox"`, `"radio"` con `accessibilityState.checked`.
- `"adjustable"` per slider e stepper, con `accessibilityValue` e le azioni `increment` / `decrement`
  (ogni thumb di un [`Slider`](../elements/slider.md) ne è uno).
- `"spinbutton"` per un campo che contiene un numero che l'utente può anche incrementare o decrementare, con lo stesso valore e le stesse azioni (il
  campo di un [`NumberInput`](../elements/number-input.md)).
- `"image"` per le immagini significative, con un'etichetta; le immagini decorative vanno invece nascoste.

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

### Stati e valori

Per un controllo on / off in un'app, usa [`Switch`](../elements/switch.md) da `nsh/base`, che imposta da solo ruolo e stato. L'esempio mostra cosa fanno un ruolo e uno stato su una vista.

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

Lo stato è `AccessibilityState { disabled, selected, checked: Option<Checked>, busy, expanded, pressed: Option<Checked>, current: Option<AccessibilityCurrent> }` in Rust e `{ disabled?, selected?, checked?: boolean | "mixed", busy?, expanded?, pressed?: boolean | "mixed", current?: boolean | "page" | "step" | "location" | "date" | "time" }` in TSX. `pressed` rende un pulsante un pulsante a commutazione (`aria-pressed` di ARIA); `current` marca l'elemento corrente di un insieme (`aria-current` di ARIA): la pagina di una paginazione, il passo di un wizard. `disabled` è implicito anche quando si disabilita la vista (`.disabled(..)`, `disabled`). `accessibilityValue` con `min`, `max` e `now` viene letto come percentuale; con `text` viene letto così com'è ("3 di 10", "Medio").

<a id="actions"></a>

## Azioni

Una vista premibile supporta già l'attivazione. Per tutto il resto, dichiara le azioni con `accessibilityActions` e gestiscile con `onAccessibilityAction`; un componente Rust riceve il nome dell'azione eseguita con `.on_accessibility_action(|name: &str| ..)`:

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

Alcuni nomi di azione sono standard e corrispondono ai gesti propri delle piattaforme:

| Nome | iOS (VoiceOver) | Android (TalkBack) |
|---|---|---|
| `activate` | Doppio tocco | Doppio tocco (click) |
| `increment`, `decrement` | Scorrimento verso l'alto / il basso, poi VoiceOver legge il nuovo valore | Scorrimento in avanti / indietro |
| `longpress` | | Doppio tocco e pressione prolungata |
| `expand`, `collapse` | | Espandi / comprimi |
| `magicTap` | Doppio tocco con due dita | |
| `escape` | Gesto a Z con due dita | |

Un elemento con `increment` o `decrement` è regolabile qualunque sia il suo ruolo: un grafico mantiene il ruolo `"image"` e scorre tra i suoi punti con gli swipe di VoiceOver e gli scorrimenti di TalkBack, con il suo `accessibilityValue` letto dopo ogni passo.

Qualsiasi altro nome diventa un'azione personalizzata, elencata nel rotore delle azioni di VoiceOver e nel menu delle azioni di TalkBack con il suo `label` (o il suo nome). Le azioni personalizzate sono la forma accessibile dello swipe-to-delete e di gesti simili:

```tsx
<View
  accessibilityActions={[{ name: "archive", label: "Archive" }, { name: "delete", label: "Delete" }]}
  onAccessibilityAction={(e) => (e.actionName === "archive" ? archive(mail.id) : remove(mail.id))}
>
  …
</View>
```

<a id="grouping-and-hiding"></a>

## Raggruppare e nascondere

Rendere accessibile una vista (`.accessible(true)`, `accessible`) ne fa un unico elemento: una card con titolo, sottotitolo e prezzo viene letta in un colpo solo, invece di far scorrere l'utente tra tre testi.

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

Nascondi ciò che non aggiunge nulla: immagini decorative, divisori, un'icona accanto a un testo che dice già la stessa cosa.

```tsx
<Image src={decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
```

`accessibilityElementsHidden` (il nome su iOS) e `importantForAccessibility="no-hide-descendants"` (quello su Android) nascondono entrambi il sottoalbero su entrambe le piattaforme; impostarli entrambi è innocuo.

<a id="the-screen-reader-and-the-users-settings"></a>

## Lo screen reader e le impostazioni dell'utente

In Rust, il prelude riporta le impostazioni dell'utente e dialoga con lo screen reader: `screen_reader()` e `reduce_motion()` sono reattivi, `announce_for_accessibility(message)` fa leggere un messaggio allo screen reader, e il `element_ref()` di un elemento sposta su di esso il focus dello screen reader con `set_accessibility_focus()`. In TSX, l'API di accessibilità di `nsh` riporta le impostazioni dell'utente e permette di dialogare con lo screen reader.

| Membro | Descrizione |
|---|---|
| `screenReaderEnabled()` | Indica se VoiceOver o TalkBack è in esecuzione (reattivo). |
| `reduceMotion()` | Indica se l'utente ha richiesto meno movimento (reattivo). |
| `announce(message)` | Lo screen reader legge `message`. |
| `setAccessibilityFocus(ref)` | Sposta il focus dello screen reader su una vista. |

Le impostazioni sono accessor: leggile in un binding o in un effect, e ciò che le legge si aggiorna quando l'utente cambia l'impostazione, senza alcuna pulizia.

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

Annuncia le modifiche che l'utente altrimenti perderebbe: un salvataggio in background che termina, un errore che compare lontano dal focus, un timer che finisce. Su Android, `android={{ accessibilityLiveRegion: "polite" }}` su una vista fa sì che TalkBack annunci da solo le sue modifiche.

<a id="text-size"></a>

## Dimensione del testo

Testo e input seguono la dimensione del testo di sistema (Dynamic Type su iOS, dimensione del carattere su Android) a meno che tu non la disattivi (`.allow_font_scaling(false)`, `allowFontScaling={false}`). Invece di disattivarla, progetta tenendone conto:

- Lascia che il testo vada a capo: evita altezze fisse sulle viste che contengono testo.
- Limita i titoli molto grandi con `.max_font_size_multiplier(..)` / `maxFontSizeMultiplier` invece di disabilitare il ridimensionamento.
- Cambia i layout quando il testo è grande: leggi `font_scale()` (Rust) o `fontScale()` da `nsh` (TSX) (per esempio, impila verticalmente un'etichetta e il suo valore sopra 1.3).

Vedi [Dispositivo e ambiente](./device-and-environment.md#text-size).

<a id="reduced-motion"></a>

## Movimento ridotto

`reduce_motion()` (Rust) e `reduceMotion()` (TSX) sono `true` quando l'utente ha attivato Reduce Motion di iOS o l'impostazione di rimozione delle animazioni di Android. Le tue animazioni vengono eseguite come le scrivi, quindi usalo, oppure usa le varianti Tailwind `motion-reduce:` e `motion-safe:`, per sostituire i grandi movimenti con una dissolvenza o un cambio istantaneo:

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

## Aree di tocco

Rendi gli elementi premibili di almeno 44 × 44 punti. Quando un controllo deve apparire più piccolo, estendi la sua area di tocco con l'hit slop (`.hit_slop(..)`, `hitSlop`) invece della sua dimensione; vedi [Tocco e gesti](./touch-and-gestures.md#hit-areas-hitslop).

<a id="checking-your-app"></a>

## Verificare la tua app

- Attiva VoiceOver (Impostazioni di iOS, Accessibilità, oppure triplo clic sul tasto laterale se configurato) o TalkBack, e usa l'app senza guardare: ogni controllo dovrebbe dire cos'è e cosa fa.
- Sui simulatori iOS, l'Accessibility Inspector di Xcode mostra etichetta, tratti e valore di ogni elemento.
- Prova la dimensione di testo più grande e la modalità scura.
- Un test id (`.test_id(..)`, `testID`) offre ai test della UI un riferimento stabile che non cambia con la lingua dell'etichetta.

<a id="related"></a>

## Vedi anche

- [API di accessibilità di `nsh`](../modules/nsh.md#accessibility): il riferimento.
- [`View`](../elements/view.md): ogni prop di accessibilità.
- [Animazione](./animation.md#reduced-motion) e [Dispositivo e ambiente](./device-and-environment.md).
