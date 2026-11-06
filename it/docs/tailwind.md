---
title: "Tailwind"
description: "Classi Tailwind CSS risolte in modo nativo in TSX e i loro equivalenti tipizzati in Rust: class e classList, varianti per gli stati di pressione, modalità scura e breakpoint, il tema in nsh.json e il controllo delle classi in fase di build."
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---

# Tailwind

Gli stili di NSH seguono Tailwind CSS 4. In Rust, le utility di Tailwind sono metodi di stile tipizzati con gli stessi nomi e valori (`.p_4()` è `p-4`, `.rounded_2xl()` è `rounded-2xl`, `ZINC.shade(900)` è `zinc-900`); in TSX, ogni elemento accetta le classi vere e proprie in `class`, risolte in modo nativo rispetto al tema predefinito di Tailwind 4. Ogni esempio qui sotto mostra prima i metodi tipizzati e poi le classi:

```rust tabs
use nsh_core::element::palette::ZINC;

view()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_2xl()
    .bg(AdaptiveColor::new(white(), ZINC.shade(800)))
    .p_4()
    .shadow_lg()
    .active(|s| s.scale(0.98))
    .child(
        text("Tailwind on native views")
            .text_base()
            .font_weight(FontWeight::SEMIBOLD)
            .text_color(AdaptiveColor::new(ZINC.shade(900), white())),
    )
```

```tsx tabs
<View class="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-lg active:scale-[0.98] dark:bg-zinc-800">
  <Text class="text-base font-semibold text-zinc-900 dark:text-white">Tailwind on native views</Text>
</View>
```

I metodi tipizzati vengono tradotti nelle stesse regole di stile in cui si compilano le classi, senza alcuna stringa da analizzare. Per le classi, non viene generato alcun CSS e nulla viene eseguito in JavaScript: la stringa viene passata al core, che analizza una sola volta ogni stringa di classi distinta (e la memorizza in cache), la trasforma in regole di stile e le applica. Le varianti che dipendono dallo stato (pressed, dark mode, larghezza della finestra) vengono riapplicate dal core quando quello stato cambia, e gli stati di pressione e di focus sono tracciati in modo nativo, quindi il feedback `active:` (`.active(..)` in Rust) non richiede alcun passaggio di andata e ritorno verso il tuo codice.

Le classi e la [prop `style`](./styling.md) producono gli stessi stili nativi e possono essere combinate; questa pagina tratta ciò che è specifico delle classi e dei loro equivalenti tipizzati. Il [riferimento Tailwind](../modules/tailwind-reference.md) elenca tutte le utility supportate.

<a id="class-and-classlist"></a>

## class e classList

```rust tabs
view()
    .rounded_lg()
    .px_4()
    .py_2()
    .transition_colors()
    .bg(move || if selected.get() { INDIGO.shade(600) } else { ZINC.shade(200) })
    .style_when(busy, |s| s.opacity(0.5))
```

```tsx tabs
<View
  class="rounded-lg px-4 py-2 transition-colors"
  classList={{ "bg-indigo-600": selected(), "bg-zinc-200": !selected(), "opacity-50": busy() }}
/>
```

- **`class`** è una stringa di classi. Può essere dinamica: ``class={`h-6 rounded bg-${color()}-500`}`` funziona, perché le classi vengono risolte a run time.
- **`classList`** associa le classi a condizioni: una classe si applica finché il suo valore è truthy. Viene applicata dopo `class`.
- **In Rust**, un metodo a cui viene passata una closure o un signal la segue (`.bg(move || ..)`), `.style_when(condition, |s| ..)` applica gli stili finché una condizione è vera, e `.when(condition, |v| ..)` decide una sola volta, quando l'elemento viene creato.

Come vengono risolti i conflitti:

1. **Le classi successive prevalgono** su quelle precedenti nella stessa stringa: `"p-2 p-4"` è `p-4`. Non serve `tailwind-merge`: un componente può aggiungere in coda il `class` passato dal chiamante. Anche in Rust i metodi successivi prevalgono.
2. **Le classi con variante si applicano dopo quelle semplici**, ordinate secondo l'ordine delle varianti di Tailwind (`hover:` prima di `active:`, `max-*:` dal più ampio, breakpoint in ordine crescente, `dark:` per ultimo), indipendentemente dalla loro posizione nella stringa. Come in Tailwind, decide la variante più alta di una classe, poi la successiva più alta, e una classe con una variante in più viene dopo: `dark:hover:bg-a dark:bg-b` è `bg-a` in hover in dark mode, e `max-md:p-2 max-lg:p-4` è `p-2` sotto `md`. Come in CSS, `odd:bg-a last:bg-b` dà a una riga finale dispari `bg-a`, perché Tailwind ordina `odd` dopo `last`.
3. **`style` prevale sulle classi.** Una chiave di stile è la proprietà CSS con il suo nome, quella che impostano le classi, quindi sostituisce solo quella proprietà: `style={{ paddingLeft: 8 }}` sostituisce `pl-4` e mantiene `pr-4`.
4. `!` rende importante una classe: `!p-0`.

I componenti Rust (quelli di `nsh/base` e quelli del crate dell'app) accettano `class` e `classList` anche da TSX; le tue classi vengono unite dopo gli stili propri del componente e prevalgono a parità di priorità.

<a id="variants"></a>

## Varianti

| Variante | Si applica quando | Rust |
|---|---|---|
| `active:` | La view è premuta | `.active(\|s\| ..)` |
| `hover:` | Un puntatore è sopra la view (puntatori di iPad e Mac) | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | Un input ha il focus | `.focus(\|s\| ..)` |
| `focus-within:` | La view o un discendente ha il focus (il contenuto di un `Overlay` è un discendente della view in cui si trova) | `.focus_within(..)` |
| `disabled:`, `enabled:` | La prop `disabled` dell'elemento è true / false | `.disabled_style(\|s\| ..)` |
| `selected:` | L'elemento è selezionato (`selected` di un `Button`, `accessibilityState.selected`) | `.selected_style(..)` |
| `checked:` | L'elemento è checked (`accessibilityState.checked` è `true`; `"mixed"` non è checked) | `.checked_style(..)` |
| `indeterminate:` | L'elemento è indeterminate (`accessibilityState.checked` è `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | L'elemento è expanded (`accessibilityState.expanded` è `true`): il trigger di un `Popover` o di un `Menu` mentre il suo popup è aperto | `.expanded_style(..)` |
| `aria-pressed:` | L'elemento è un toggle button attivo (`accessibilityState.pressed` è `true`; `"mixed"` non è premuto). Non `active:`, una pressione in corso | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`, `checked` (`true`, non `"mixed"`) o `selected` è `true`, come le varianti `aria-*` di Tailwind: dopo le pseudo-classi, nell'ordine dei loro nomi | |
| `data-<name>:` | L'elemento ha l'attributo `data-*` `name`, come le varianti booleane `data-*` di Tailwind (`&[data-range-start]`): ciò che la parte di un componente mostra oltre ai suoi stati, ad esempio il giorno di un calendario all'inizio di un intervallo (`data-range-start:`). Dopo le varianti `aria-*`, nell'ordine dei loro nomi | `Interactive::project_data(name, ..)` ne imposta uno sulla parte di un componente |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | L'antenato più vicino con la classe `group` si trova in quello stato, oppure ha quell'attributo `data-*` | `.group()` sull'antenato; `.group_active(..)`, `.group_hover(..)`, `.group_focus_within(..)` all'interno |
| `group-active/name:` ... | Lo stesso, per un antenato contrassegnato con `group/name` | `.group_named("name")`; `.group_active_named("name", ..)`, ... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | La posizione dell'elemento stesso tra i suoi fratelli. Per colorare l'etichetta di una riga in base alla posizione della riga, metti `last:text-*` sulla riga: l'etichetta lo eredita | Rust semplice a partire dall'indice della riga (`at.is_first()`, `at.is_last()`, `at.index() % 2`) |
| `placeholder:` | Stilizza il placeholder di un input (`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | Colora l'evidenziazione della selezione di un input o di un testo selezionabile, e di quelli al suo interno (`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | L'aspetto del sistema è scuro | Un `AdaptiveColor`, oppure `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | La finestra è larga almeno 640, 768, 1024, 1280, 1536 punti | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | La finestra è più stretta del breakpoint | Lo stesso, con `<` |
| `min-[600px]:`, `max-[600px]:` | Breakpoint arbitrari | Lo stesso |
| `portrait:`, `landscape:` | L'orientamento della finestra | `window().width > window().height` |
| `ios:`, `android:`, `web:` | La piattaforma | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | La [direzione del layout](./layout.md#right-to-left) | `.direction(LayoutDirection::..)` su una view |
| `motion-safe:`, `motion-reduce:` | L'impostazione di riduzione del movimento dell'utente | `reduce_motion()` |

Le varianti si combinano: `dark:active:bg-zinc-700`, `md:landscape:flex-row`. In Rust, un `AdaptiveColor` in uno stile `.active(..)` è `dark:active:`.

```rust tabs
view()
    .group()
    .flex_row()
    .items_center()
    .gap_3()
    .rounded_xl()
    .bg(white())
    .p_3()
    .active(|s| s.bg(ZINC.shade(50)))
    .child(text("Settings").flex_1().text_color(ZINC.shade(900)))
    .child(
        text("›")
            .text_color(ZINC.shade(300))
            .transition_transform()
            .group_active(|s| s.translate_x(px(4.0))),
    )
```

```tsx tabs
<View class="group flex-row items-center gap-3 rounded-xl bg-white p-3 active:bg-zinc-50">
  <Text class="flex-1 text-zinc-900">Settings</Text>
  <Text class="text-zinc-300 transition-transform group-active:translate-x-1">›</Text>
</View>
```

`disabled` su qualsiasi elemento (`.disabled(..)` in Rust) applica le classi `disabled:` (`.disabled_style(..)`) e rimuove i suoi gestori di pressione da ciò che è montato, quindi non mostra nemmeno alcun feedback di pressione:

```rust tabs
view()
    .disabled(saving)
    .on_press(save)
    .rounded_lg()
    .bg(EMERALD.shade(500))
    .px_4()
    .py_2()
    .active(|s| s.bg(EMERALD.shade(600)))
    .disabled_style(|s| s.opacity(0.4))
    .child(text("Save").font_weight(FontWeight::MEDIUM).text_color(white()))
```

```tsx tabs
<View disabled={saving()} onPress={save} class="rounded-lg bg-emerald-500 px-4 py-2 active:bg-emerald-600 disabled:opacity-40">
  <Text class="font-medium text-white">Save</Text>
</View>
```

I breakpoint si confrontano con la finestra (la superficie in cui NSH esegue il rendering), non con il dispositivo: in una split view di iPad o in una finestra ridimensionabile, seguono la larghezza della finestra, come fa `window()`.

<a id="what-differs-from-tailwind-on-the-web"></a>

## Differenze rispetto a Tailwind sul web

- **Le unità sono punti.** `p-4` (`.p_4()`) vale 16 punti (1 passo di spaziatura = 4pt, 1rem = 16pt). Anche i valori arbitrari in `px` sono in punti: `p-[13px]` (`.p(px(13.0))`) vale 13pt.
- **`flex` è una riga**, come in CSS: `class="flex"` dispone i suoi figli in riga a meno che una classe di direzione dica altrimenti (in qualsiasi punto della stringa: `flex-col flex` è una colonna). Anche `display: "flex"` di uno stile e `.flex()` di Rust sono righe allo stesso modo, e una view che non imposta alcun display mantiene la colonna predefinita di NSH. `block` e `flow-root` usano il layout a blocchi, e lo stesso vale per `inline` e `inline-block`, come un browser li dispone in un genitore flex o grid. In Rust, `.flex_row()` e `.flex_col()` impostano la direzione.
- **Le classi di testo sulle view vengono ereditate.** `text-*`, `font-*`, `leading-*`, `tracking-*` e le altre utility di testo su una view (`.text_color(..)`, `.font_weight(..)`, ... in Rust) passano agli elementi di testo e di input al suo interno, come fa l'ereditarietà CSS: `<View class="text-white">` rende bianche le sue etichette.
- **Ogni view è un box a sé.** `overflow-x-hidden` e `overflow-y-hidden` tagliano entrambi gli assi, come fa `overflow-hidden` (lo scorrimento è compito dell'elemento [scroll](../elements/scroll.md)); `invisible` nasconde la view e tutto ciò che contiene; `mix-blend-*` fonde una view con tutto ciò che è disegnato dietro di essa; i box `block` tengono separati i propri margini da quelli dei figli; una view `absolute` viene posizionata rispetto all'antenato posizionato più vicino, come in CSS; `fixed` dispone una view nella sua root view (gli altri elementi vengono posizionati come `absolute`).
- **Il testo mantiene gli spazi bianchi.** Spazi e a capo in una stringa vengono disegnati come scritti, e `whitespace-*` imposta il wrapping; il compilatore JSX comprime gli spazi bianchi del testo JSX letterale, come fa JSX.
- **Le transizioni animano gruppi di proprietà**: `transition` anima colori, opacità, ombre e trasformazioni, `transition-all` anima anche i raggi degli angoli e gli spessori dei bordi; filtri, filtri di sfondo, gradienti e layout assumono i nuovi valori immediatamente.
- **`focus-visible:` è `focus:`**: si applica ogni volta che l'elemento ha il focus.
- **Gli sfondi di stato si vedono sopra i gradienti.** In CSS un gradiente copre `background-color`, quindi `active:bg-*` su una superficie `bg-linear-*` non si vedrebbe mai; in NSH un colore di sfondo da `active:`, `hover:`, `focus:` o `group-*:` sostituisce il gradiente finché quello stato è attivo (a meno che lo stato imposti un proprio gradiente, come `active:from-*`). Lo stesso vale per `activeStyle` e per gli altri stili di stato, e per i colori di sfondo animati.
- **Le impostazioni di testo e di tocco sono chiavi di stile**: `line-clamp-*` imposta `numberOfLines`, `text-ellipsis` e `text-clip` impostano `textOverflow`, `truncate` entrambi, `select-*` imposta `userSelect` e `pointer-events-*` imposta `pointerEvents`, quindi funzionano nelle varianti di stato e perdono contro `style` inline come ogni classe; `caret-*`, `placeholder:text-*` e `selection:bg-*` impostano allo stesso modo gli stili `caretColor`, `placeholderColor` e `selectionColor`. In Rust sono metodi `Styled` (`.number_of_lines(..)`, `.truncate()`, `.text_overflow(..)`, `.select_text()`, `.pointer_events(..)`, ...). `whitespace-nowrap` mantiene un testo su una sola riga come classe. `object-*` impostano gli stili `objectFit` e `objectPosition` di immagini e video, che le chiavi di uno stile sostituiscono come qualsiasi altra.
- **L'insieme supportato**: utility e varianti di Tailwind 4 che hanno un significato nativo. Le varianti `peer-*`, i pseudo-elementi (`before:`, `after:`) e le proprietà arbitrarie (`[mask-type:luminance]`) vengono segnalati come classi sconosciute, così come ogni utility per cui NSH non ha un significato nativo, in modo che una classe non significhi mai qualcosa di diverso rispetto a un browser. Gli hint di rendering (`antialiased`, `will-change-transform`, `appearance-none`, `box-border`, ...) sono accettati e non cambiano nulla.

Tutto il resto funziona come documentato da Tailwind 4: la palette di colori, i modificatori di opacità (`bg-black/40`), i valori arbitrari (`bg-[#34c759]`, `w-[72px]`, `grid-cols-[1fr_2fr]`; su `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` e sulle utility `m` anche le variabili di ambiente, `pt-[env(safe-area-inset-top)]`, `pb-[calc(env(keyboard-inset-height)+49px)]`, vedi [Safe area](../elements/safe-area.md) e [Keyboard](../elements/keyboard.md)), le frazioni (`w-1/2`, `translate-x-1/2`), ombre e ring, gradienti (`bg-linear-to-r`, `bg-radial`, `bg-conic` con `from-` / `via-` / `to-`), filtri, `backdrop-blur-*`, `mix-blend-*`, trasformazioni, `transition-*` e `duration-*`, `animate-spin` / `ping` / `pulse` / `bounce`, e grid, ciascuno con il proprio metodo tipizzato in Rust. I limiti di piattaforma di [filtri e blending](./styling.md#filters-and-blending) valgono anche per le classi.

<a id="theme"></a>

## Tema

Le classi vengono risolte rispetto al tema predefinito di Tailwind 4. Estendilo in `nsh.json` sotto `"tailwind"`; le tue voci vengono aggiunte a quelle predefinite (oppure sostituiscono quella predefinita con lo stesso nome):

```json
{
  "tailwind": {
    "colors": {
      "brand": { "50": "#f5f3ff", "500": "#7c3aed", "600": "#6d28d9", "DEFAULT": "#7c3aed" },
      "ink": "#1f2328"
    },
    "radius": { "card": 14 },
    "fontFamily": { "display": "Pacifico" },
    "breakpoints": { "tablet": 600 }
  }
}
```

Con questo tema, `bg-brand-500`, `text-brand` (la sfumatura `DEFAULT`), `border-ink`, `rounded-card`, `font-display` e `tablet:flex-row` sono classi valide.

| Chiave | Valori | Genera |
|---|---|---|
| `colors` | Un colore CSS, o un oggetto di sfumature (`"DEFAULT"` per il nome semplice) | `bg-*`, `text-*`, `border-*`, `from-*`, `ring-*`, ... |
| `spacing` | Punti per passo di spaziatura (predefinito 4) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | Punti per `rem` nei valori arbitrari (predefinito 16) | |
| `breakpoints` | Punti | Varianti `name:` |
| `container` | Punti | Dimensioni `max-w-*` |
| `fontSize` | Punti, oppure `[size, lineHeight]` con l'altezza di riga multipla della dimensione | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | Il nome di una famiglia (una famiglia di sistema o il nome di un [font importato](./fonts.md)) | `font-*` |
| `tracking` | Em | `tracking-*` |
| `leading` | Multipli della dimensione del font | `leading-*` |
| `radius` | Punti | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | Un `box-shadow` CSS | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | Punti | `blur-*`, `backdrop-blur-*` |
| `perspective` | Punti | `perspective-*` |
| `aspect` | Un rapporto (`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

Le chiavi sconosciute e i valori non validi sono errori di build (`nsh.json: tailwind: unknown theme key 'colours'`). Il tema viene compilato nel bundle e applicato prima del primo frame.

Il tema di Tailwind dà forma alle tue classi. I metodi tipizzati mantengono le scale predefinite di Tailwind, così un componente Rust ha lo stesso aspetto in ogni app, e ricavano l'aspetto dell'app dai design token del suo tema, `"theme"` in `nsh.json` ([Rust](./rust.md#theme)).
<a id="theme-tokens"></a>

## Token del tema

Il tema dell'app (`"theme"` in `nsh.json`) contiene i suoi design token: i colori di shadcn/ui (`background`, `foreground`, `primary`, `muted-foreground`, `border`, `ring`, `chart-1`, `sidebar`, ...), il suo `radius`, i suoi font `font-sans` e `font-mono`, e qualsiasi token aggiunto dall'app. Le classi li nominano come Tailwind nomina le variabili di un `@theme` CSS, i componenti Rust li leggono con `theme()` da `nsh_base`, e TSX li legge con `token()` da `nsh`, così una schermata TSX e i componenti Rust seguono lo stesso tema:

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().card)
    .p_4()
    .child(text("Balance").text_color(move || theme().card_foreground))
    .child(text("Updated just now").text_color(move || theme().muted_foreground))
    .child(
        view()
            .rounded(move || theme().radius)
            .bg(move || theme().primary)
            .px_4()
            .py_2()
            .active(|s| s.bg(move || theme().primary.opacity(0.9)))
            .child(text("Continue").text_color(move || theme().primary_foreground)),
    )
```

```tsx tabs
<View class="rounded-(--radius) border border-border bg-card p-4">
  <Text class="text-card-foreground">Balance</Text>
  <Text class="text-muted-foreground">Updated just now</Text>
  <View class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
    <Text class="text-primary-foreground">Continue</Text>
  </View>
</View>
```

Il nome di un token è quello della sua variabile CSS senza `--`, come lo scrive il file del tema: `muted-foreground`, `radius`, `chart-1`. In Rust, i token di shadcn sono metodi di `theme()` (`primary()`, `muted_foreground()`, `radius()`, `font_mono()`), e ogni token è `theme().color("up")`, `theme().number("radius-card")` oppure `theme().font("font-display")`.

| Forma | Accetta | Esempio |
|---|---|---|
| Un nome di colore in qualsiasi utility di colore | Un colore del tema, anche con opacità | `bg-primary`, `text-muted-foreground/70`, `bg-up/30`, `border-t-border`, `ring-ring`, `from-accent`, `placeholder:text-muted-foreground` |
| `(--name)`, la scorciatoia di variabile di Tailwind 4 | Un colore del tema o un numero | `bg-(--primary)`, `rounded-(--radius)`, `p-(--gap-card)` |
| `(color:--name)`, `(length:--name)`, `(number:--name)`, `(family-name:--name)` | Lo stesso, con tipo esplicito dove una utility accetta più tipi di valore | `text-(color:--up)`, `text-(length:--text-title)`, `font-(family-name:--font-mono)` |
| `font-sans`, `font-mono` | I font del tema, quando li imposta | `font-mono` |

- **I tuoi token.** Ogni nome nel file del tema è un token, così come lo è ogni variabile di un `@theme` CSS: `"up": "#16a34a"` genera `bg-up`, `text-up` e `bg-up/30`; `"radius-card": "14px"` genera `rounded-(--radius-card)`; `"font-display": "Pacifico"` genera `font-(family-name:--font-display)`. Le lunghezze sono in punti; `(number:--name)` passa il numero semplice.
- **Font.** `font-sans` è il font dell'app: ogni testo che non imposta una propria famiglia viene disegnato con esso, come una pagina con `--font-sans` di Tailwind. `font-mono` è il font di `font-mono` e del codice in `TextView`. Se non impostati, entrambi sono i font di sistema.
- **Entrambe le modalità di aspetto.** Un token ha il valore chiaro e quello scuro del tema: `bg-primary`, `theme().primary` e `token("primary")` cambiano automaticamente con l'aspetto, senza la classe `dark:`. Un colore che il tema imposta in una sola modalità viene usato in entrambe.
- **I tuoi colori Tailwind hanno la precedenza.** Un nome in `"tailwind"` `colors` o nella palette di Tailwind corrisponde a quel colore, quindi `bg-primary` è un token del tema quando il tema Tailwind non ha alcun colore `primary`.
- **Il tema può cambiare mentre l'app è in esecuzione.** Quando a un'app incorporata in un'app nativa viene fornito il tema di quest'ultima, e ogni volta che il tema cambia, le classi che nominano token, i binding Rust che leggono `theme()` e il codice TSX che legge `token()` vengono aggiornati, le classi e i binding in modo nativo. I token che il tema dell'app ospitante non ha mantengono i valori del `"theme"` dell'app stessa (poi quelli del tema predefinito). Un host che aggiunge soltanto il proprio brand fornisce override del tema, ossia i token che il suo brand modifica, nello stesso formato di file ([iOS](./ios.md#theme-overrides), [Android](./android.md#theme-overrides), `AppView::set_theme_overrides` sui desktop).
- **Verificate come le altre classi.** Un nome che non è un token del tema predefinito né del `"theme"` dell'app è una classe sconosciuta durante la build (`unknown class 'bg-chart-up'`). Per usare un token fornito solo dall'app ospitante, assegnagli un valore anche nel `"theme"` dell'app: quel valore viene mostrato quando l'app viene eseguita da sola.

Le classi che nominano token vengono risolte una volta per tema, come qualsiasi altra classe: disegnarle costa quanto un colore della palette.

### `token()` in TSX

`token(name)` da `nsh` è il valore di un token nell'aspetto mostrato: un colore come `#rrggbbaa`, una lunghezza come numero di punti, un font come nome della sua famiglia. È reattivo, quindi il codice che lo legge in un componente, in un memo o in un effect viene eseguito di nuovo quando cambiano il tema o l'aspetto, il che è adatto a valori che vanno dove non arriva nessuna classe, come un canvas o un grafico:

```tsx
import { Canvas, token } from "nsh";

<Canvas
  style={{ height: 160 }}
  draw={(cx, { width, height }) => {
    cx.beginPath();
    cx.moveTo(0, height);
    cx.lineTo(width, 0);
    cx.strokeStyle = token("chart-1");
    cx.lineWidth = 2;
    cx.stroke();
  }}
/>
```

I nomi sono tipizzati: NSH scrive i token dell'app in `.nsh/types/nsh/tokens.d.ts` a partire dal suo tema, quindi `token("up")` è un `string` una volta che `"up"` è presente nel tema, e un nome che il tema non ha è un errore di tipo.

<a id="the-class-check"></a>

## Il controllo delle classi

`nsh build`, `nsh dev`, `nsh run` e `nsh test` verificano i nomi di classe statici nel tuo JSX (stringhe letterali in `class` e le chiavi di `classList`) con lo stesso parser e lo stesso tema usati dal runtime, e segnalano le classi che non esistono:

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

I warning non fanno fallire la build. Le classi costruite a runtime (``bg-${color()}-500``) vengono verificate quando il runtime le incontra per la prima volta, e registra nel log ogni classe sconosciuta una sola volta (`unknown classes: ...`). I metodi tipizzati sono verificati dal compilatore Rust.

<a id="classes-or-styles"></a>

## Classi o stili?

Entrambi vengono risolti in modo nativo e hanno più o meno lo stesso costo. Le classi sono più brevi e offrono le varianti (stati di pressione, dark mode, breakpoint) senza codice. Gli stili inline accettano valori calcolati in JavaScript e [valori animati nativi](./animation.md) (`opacity: fade`, `translate: [x, 0]`). La maggior parte delle app TSX usa le classi per l'aspetto statico e `style` per ciò che è calcolato o animato. I componenti Rust usano metodi tipizzati per entrambi, e collegano i valori animati con `.bind_opacity(..)`, `.bind_translate_x(..)` e gli altri binding.

<a id="related"></a>

## Vedi anche

- [Styling](./styling.md): la prop style, i metodi tipizzati e i limiti degli effetti sulle varie piattaforme.
- [Riferimento Tailwind](../modules/tailwind-reference.md): ogni utility e variante.
- [Layout](./layout.md): flexbox e grid, disponibili anche come classi.
