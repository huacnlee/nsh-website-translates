---
title: "Tailwind"
description: "Classes Tailwind CSS résolues nativement dans TSX et leurs équivalents typés en Rust : class et classList, variantes pour les états pressés, mode sombre et points de rupture, thème dans nsh.json, et vérification des classes au moment du build."
order: 33
group: ui
demo: guide-tailwind
source_hash: 1112d3bac3b2b097
---

# Tailwind

Les styles de NSH suivent Tailwind CSS 4. En Rust, les utilitaires de Tailwind sont des méthodes de style typées, avec les mêmes noms et les mêmes valeurs (`.p_4()` correspond à `p-4`, `.rounded_2xl()` à `rounded-2xl`, `ZINC.shade(900)` à `zinc-900`) ; en TSX, chaque élément accepte directement les classes dans `class`, résolues nativement par rapport au thème par défaut de Tailwind 4. Chaque exemple ci-dessous présente d'abord les méthodes typées, puis les classes :

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

Les méthodes typées se ramènent aux mêmes règles de style que celles vers lesquelles les classes sont compilées, sans chaîne à analyser. Pour les classes, aucun CSS n'est généré et rien ne s'exécute en JavaScript : la chaîne est transmise au cœur, qui analyse chaque chaîne de classes distincte une seule fois (et la met en cache), la transforme en règles de style, puis les applique. Les variantes qui dépendent d'un état (pressé, mode sombre, largeur de fenêtre) sont réappliquées par le cœur lorsque cet état change, et les états pressé et focalisé sont suivis nativement : le retour visuel `active:` (`.active(..)` en Rust) ne fait donc aucun aller-retour avec votre code.

Les classes et la [prop `style`](./styling.md) produisent les mêmes styles natifs et peuvent être combinées ; cette page couvre ce qui est propre aux classes et à leurs équivalents typés. La [référence Tailwind](../modules/tailwind-reference.md) liste tous les utilitaires pris en charge.

<a id="class-and-classlist"></a>

## class et classList

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

- **`class`** est une chaîne de classes. Elle peut être dynamique : ``class={`h-6 rounded bg-${color()}-500`}`` fonctionne, car les classes sont résolues à l'exécution.
- **`classList`** associe des classes à des conditions : une classe s'applique tant que sa valeur est vraie. Il est appliqué après `class`.
- **En Rust**, une méthode qui reçoit une closure ou un signal le suit (`.bg(move || ..)`), `.style_when(condition, |s| ..)` applique des styles tant qu'une condition est vraie, et `.when(condition, |v| ..)` décide une seule fois, à la création de l'élément.

Résolution des conflits :

1. **Les dernières classes l'emportent** sur les précédentes dans la même chaîne : `"p-2 p-4"` donne `p-4`. Inutile de recourir à `tailwind-merge` : un composant peut ajouter à la suite le `class` transmis par son appelant. En Rust aussi, les dernières méthodes l'emportent.
2. **Les classes à variante s'appliquent après les classes simples**, selon l'ordre des variantes de Tailwind (`hover:` avant `active:`, `max-*:` de la plus large à la plus étroite, points de rupture par ordre croissant, `dark:` en dernier), quelle que soit leur position dans la chaîne. Comme dans Tailwind, la variante la plus haute d'une classe décide, puis la suivante, et une classe avec une variante de plus vient plus tard : `dark:hover:bg-a dark:bg-b` donne `bg-a` au survol en mode sombre, et `max-md:p-2 max-lg:p-4` donne `p-2` en dessous de `md`. Comme en CSS, `odd:bg-a last:bg-b` donne à une dernière ligne impaire `bg-a`, car Tailwind trie `odd` après `last`.
3. **`style` l'emporte sur les classes.** Une clé de style est la propriété CSS de son nom, celle que définissent les classes ; elle ne remplace donc que cette propriété : `style={{ paddingLeft: 8 }}` remplace `pl-4` et conserve `pr-4`.
4. `!` rend une classe prioritaire : `!p-0`.

Les composants Rust (ceux de `nsh/base` et ceux du crate propre à une application) acceptent aussi `class` et `classList` depuis TSX ; vos classes sont fusionnées après les styles propres du composant et l'emportent à rang égal.

<a id="variants"></a>

## Variantes

| Variante | S'applique quand | Rust |
|---|---|---|
| `active:` | La vue est pressée | `.active(\|s\| ..)` |
| `hover:` | Un pointeur survole la vue (pointeurs iPad et Mac) | `.hover(\|s\| ..)` |
| `focus:`, `focus-visible:` | Un champ de saisie a le focus | `.focus(\|s\| ..)` |
| `focus-within:` | La vue ou l'un de ses descendants a le focus (le contenu d'un `Overlay` est un descendant de la vue dans laquelle il se trouve) | `.focus_within(..)` |
| `disabled:`, `enabled:` | La prop `disabled` de l'élément vaut true / false | `.disabled_style(\|s\| ..)` |
| `selected:` | L'élément est sélectionné (pour un `Button` : `selected`, `accessibilityState.selected`) | `.selected_style(..)` |
| `checked:` | L'élément est coché (`accessibilityState.checked` vaut `true` ; `"mixed"` n'est pas coché) | `.checked_style(..)` |
| `indeterminate:` | L'élément est indéterminé (`accessibilityState.checked` vaut `"mixed"`) | `.indeterminate_style(..)` |
| `aria-expanded:` | L'élément est développé (`accessibilityState.expanded` vaut `true`) : le déclencheur d'un `Popover` ou d'un `Menu` tant que sa popup est ouverte | `.expanded_style(..)` |
| `aria-pressed:` | L'élément est un bouton à bascule activé (`accessibilityState.pressed` vaut `true` ; `"mixed"` n'est pas pressé). À ne pas confondre avec `active:`, un appui en cours | `.aria_pressed(..)`, `.pressed_style(..)` |
| `aria-busy:`, `aria-checked:`, `aria-selected:` | `accessibilityState.busy`, `checked` (`true`, et non `"mixed"`) ou `selected` vaut `true`, comme les variantes `aria-*` de Tailwind : après les pseudo-classes, dans l'ordre de leurs noms | |
| `data-<name>:` | L'élément possède l'attribut `data-*` `name`, comme les variantes booléennes `data-*` de Tailwind (`&[data-range-start]`) : ce que la partie d'un composant montre au-delà de ses états, par exemple le jour d'un calendrier au début d'une plage (`data-range-start:`). Après les variantes `aria-*`, dans l'ordre de leurs noms | `Interactive::project_data(name, ..)` en définit un sur la partie d'un composant |
| `group-active:`, `group-hover:`, `group-focus:`, `group-focus-within:`, `group-disabled:`, `group-selected:`, `group-checked:`, `group-indeterminate:`, `group-aria-expanded:`, `group-aria-pressed:`, `group-aria-busy:`, `group-aria-checked:`, `group-aria-selected:`, `group-data-<name>:` | L'ancêtre le plus proche portant la classe `group` est dans cet état, ou possède cet attribut `data-*` | `.group()` sur l'ancêtre ; `.group_active(..)`, `.group_hover(..)`, `.group_focus_within(..)` à l'intérieur |
| `group-active/name:` ... | Idem, pour un ancêtre marqué `group/name` | `.group_named("name")` ; `.group_active_named("name", ..)`, ... |
| `first:`, `last:`, `odd:`, `even:`, `only:` | La position propre de l'élément parmi ses frères et sœurs. Pour colorer le libellé d'une ligne selon la position de celle-ci, placez `last:text-*` sur la ligne : le libellé en hérite | Du Rust ordinaire à partir de l'index de la ligne (`at.is_first()`, `at.is_last()`, `at.index() % 2`) |
| `placeholder:` | Stylise le placeholder d'un champ de saisie (`placeholder:text-zinc-400`) | `.placeholder_color(..)` |
| `selection:` | Colore la surbrillance de sélection d'un champ de saisie ou d'un texte sélectionnable, ainsi que de ceux qui se trouvent dans l'élément (`selection:bg-violet-200`) | `.selection_color(..)` |
| `dark:` | L'apparence du système est sombre | Un `AdaptiveColor`, ou `.dark(\|s\| ..)` |
| `sm:`, `md:`, `lg:`, `xl:`, `2xl:` | La fenêtre fait au moins 640, 768, 1024, 1280, 1536 points de large | `.style_when(\|\| window().width >= px(768.0), \|s\| ..)` |
| `max-sm:`, `max-md:`, ... | La fenêtre est plus étroite que le point de rupture | Idem, avec `<` |
| `min-[600px]:`, `max-[600px]:` | Points de rupture arbitraires | Idem |
| `portrait:`, `landscape:` | L'orientation de la fenêtre | `window().width > window().height` |
| `ios:`, `android:`, `web:` | La plateforme | `.when(os() == Os::Ios, \|v\| ..)` |
| `rtl:`, `ltr:` | La [direction de mise en page](./layout.md#right-to-left) | `.direction(LayoutDirection::..)` sur une vue |
| `motion-safe:`, `motion-reduce:` | Le réglage de réduction des animations de l'utilisateur | `reduce_motion()` |

Les variantes se combinent : `dark:active:bg-zinc-700`, `md:landscape:flex-row`. En Rust, un `AdaptiveColor` dans un style `.active(..)` correspond à `dark:active:`.

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

`disabled` sur n'importe quel élément (`.disabled(..)` en Rust) applique les classes `disabled:` (`.disabled_style(..)`) et retire ses gestionnaires d'appui de ce qui est monté ; il n'affiche donc pas non plus de retour visuel à l'appui :

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

Les points de rupture se comparent à la fenêtre (la surface dans laquelle NSH effectue le rendu), et non à l'appareil : dans une vue scindée sur iPad ou une fenêtre redimensionnable, ils suivent la largeur de la fenêtre, comme le fait `window()`.

<a id="what-differs-from-tailwind-on-the-web"></a>

## Ce qui diffère de Tailwind sur le web

- **Les unités sont des points.** `p-4` (`.p_4()`) vaut 16 points (1 pas d'espacement = 4 pt, 1rem = 16 pt). Les valeurs arbitraires dans `px` sont aussi des points : `p-[13px]` (`.p(px(13.0))`) vaut 13 pt.
- **`flex` est une ligne**, comme en CSS : `class="flex"` dispose ses enfants en ligne, sauf si une classe de direction indique autre chose (n'importe où dans la chaîne : `flex-col flex` est une colonne). Le `display: "flex"` d'un style et le `.flex()` de Rust sont des lignes de la même façon, et une vue qui ne définit aucun display conserve la colonne par défaut de NSH. `block` et `flow-root` utilisent la mise en page en bloc, tout comme `inline` et `inline-block`, comme un navigateur les dispose dans un parent flex ou grid. En Rust, `.flex_row()` et `.flex_col()` définissent la direction.
- **Les classes de texte sur les vues sont héritées.** `text-*`, `font-*`, `leading-*`, `tracking-*` et les autres utilitaires de texte sur une vue (`.text_color(..)`, `.font_weight(..)`, ... en Rust) sont transmis aux éléments de texte et de saisie qu'elle contient, comme le fait l'héritage CSS : `<View class="text-white">` rend ses libellés blancs.
- **Chaque vue est une boîte à part entière.** `overflow-x-hidden` et `overflow-y-hidden` rognent les deux axes, comme le fait `overflow-hidden` (le défilement relève de l'élément [scroll](../elements/scroll.md)) ; `invisible` masque la vue et tout son contenu ; `mix-blend-*` mélange une vue avec tout ce qui est dessiné derrière elle ; les boîtes `block` gardent séparées leurs propres marges et celles de leurs enfants ; une vue `absolute` est placée dans son ancêtre positionné le plus proche, comme en CSS ; `fixed` dispose une vue dans sa vue racine (les autres éléments sont placés comme `absolute`).
- **Le texte conserve ses espaces.** Les espaces et les sauts de ligne d'une chaîne sont dessinés tels qu'écrits, et `whitespace-*` définit le retour à la ligne ; le compilateur JSX réduit les espaces du texte JSX littéral, comme le fait JSX.
- **Les transitions animent des groupes de propriétés** : `transition` anime les couleurs, l'opacité, les ombres et les transformations, `transition-all` anime aussi les rayons de coin et les largeurs de bordure ; les filtres, les filtres d'arrière-plan, les dégradés et la mise en page prennent immédiatement leurs nouvelles valeurs.
- **`focus-visible:` est `focus:`** : il s'applique dès que l'élément a le focus.
- **Les arrière-plans d'état s'affichent par-dessus les dégradés.** En CSS, un dégradé recouvre `background-color`, donc `active:bg-*` sur une surface `bg-linear-*` ne serait jamais visible ; dans NSH, une couleur d'arrière-plan issue de `active:`, `hover:`, `focus:` ou `group-*:` remplace le dégradé tant que cet état persiste (sauf si l'état définit son propre dégradé, comme `active:from-*`). Il en va de même pour `activeStyle` et les autres styles d'état, ainsi que pour les couleurs d'arrière-plan animées.
- **Les réglages de texte et de toucher sont des clés de style** : `line-clamp-*` définit `numberOfLines`, `text-ellipsis` et `text-clip` définissent `textOverflow`, `truncate` les deux, `select-*` définit `userSelect` et `pointer-events-*` définit `pointerEvents` ; ils fonctionnent donc dans les variantes d'état et sont écrasés par le `style` en ligne, comme toute classe ; `caret-*`, `placeholder:text-*` et `selection:bg-*` définissent de la même façon les styles `caretColor`, `placeholderColor` et `selectionColor`. En Rust, ce sont des méthodes `Styled` (`.number_of_lines(..)`, `.truncate()`, `.text_overflow(..)`, `.select_text()`, `.pointer_events(..)`, ...). `whitespace-nowrap` garde un texte sur une seule ligne en tant que classe. `object-*` définissent les styles `objectFit` et `objectPosition` des images et des vidéos, que les clés d'un style remplacent comme n'importe quelles autres.
- **Le sous-ensemble pris en charge** : les utilitaires et variantes de Tailwind 4 qui ont une signification native. Les variantes `peer-*`, les pseudo-éléments (`before:`, `after:`) et les propriétés arbitraires (`[mask-type:luminance]`) sont signalés comme classes inconnues, tout comme chaque utilitaire pour lequel NSH n'a pas de signification native, de sorte qu'une classe ne signifie jamais autre chose que dans un navigateur. Les indications de rendu (`antialiased`, `will-change-transform`, `appearance-none`, `box-border`, ...) sont acceptées et ne changent rien.

Tout le reste fonctionne comme documenté par Tailwind 4 : la palette de couleurs, les modificateurs d'opacité (`bg-black/40`), les valeurs arbitraires (`bg-[#34c759]`, `w-[72px]`, `grid-cols-[1fr_2fr]` ; sur `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl` et les utilitaires `m`, également les variables d'environnement, `pt-[env(safe-area-inset-top)]`, `pb-[calc(env(keyboard-inset-height)+49px)]`, voir [zone de sécurité](../elements/safe-area.md) et [clavier](../elements/keyboard.md)), les fractions (`w-1/2`, `translate-x-1/2`), les ombres et les anneaux, les dégradés (`bg-linear-to-r`, `bg-radial`, `bg-conic` avec `from-` / `via-` / `to-`), les filtres, `backdrop-blur-*`, `mix-blend-*`, les transformations, `transition-*` et `duration-*`, `animate-spin` / `ping` / `pulse` / `bounce`, et grid, chacun avec sa méthode typée en Rust. Les limites de plateforme des [filtres et de la fusion](./styling.md#filters-and-blending) s'appliquent aussi aux classes.

<a id="theme"></a>

## Thème

Les classes sont résolues par rapport au thème par défaut de Tailwind 4. Étendez-le dans `nsh.json` sous `"tailwind"` ; vos entrées s'ajoutent aux valeurs par défaut (ou remplacent celle du même nom) :

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

Avec ce thème, `bg-brand-500`, `text-brand` (la teinte `DEFAULT`), `border-ink`, `rounded-card`, `font-display` et `tablet:flex-row` sont des classes valides.

| Clé | Valeurs | Génère |
|---|---|---|
| `colors` | Une couleur CSS, ou un objet de teintes (`"DEFAULT"` pour le nom seul) | `bg-*`, `text-*`, `border-*`, `from-*`, `ring-*`, ... |
| `spacing` | Points par pas d'espacement (4 par défaut) | `p-*`, `m-*`, `gap-*`, `w-*`, ... |
| `rem` | Points par `rem` dans les valeurs arbitraires (16 par défaut) | |
| `breakpoints` | Points | variantes `name:` |
| `container` | Points | tailles `max-w-*` |
| `fontSize` | Des points, ou `[size, lineHeight]` avec une hauteur de ligne multiple de la taille | `text-*` |
| `fontWeight` | 1–1000 | `font-*` |
| `fontFamily` | Un nom de famille (famille système ou nom d'une [police importée](./fonts.md)) | `font-*` |
| `tracking` | Em | `tracking-*` |
| `leading` | Multiples de la taille de police | `leading-*` |
| `radius` | Points | `rounded-*` |
| `shadow`, `insetShadow`, `dropShadow` | Un `box-shadow` CSS | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `blur` | Points | `blur-*`, `backdrop-blur-*` |
| `perspective` | Points | `perspective-*` |
| `aspect` | Un ratio (`1.5`) | `aspect-*` |
| `ease` | `[x1, y1, x2, y2]` | `ease-*` |

Les clés inconnues et les valeurs invalides sont des erreurs de build (`nsh.json: tailwind: unknown theme key 'colours'`). Le thème est compilé dans le bundle et appliqué avant la première image.

Le thème Tailwind façonne vos classes. Les méthodes typées conservent les échelles par défaut de Tailwind, de sorte qu'un composant Rust a le même aspect dans toutes les applications, et tirent l'apparence de l'application des design tokens de son thème, `"theme"` dans `nsh.json` ([Rust](./rust.md#theme)).
<a id="theme-tokens"></a>

## Tokens de thème

Le thème de l'app (`"theme"` dans `nsh.json`) contient ses design tokens : les couleurs de shadcn/ui (`background`, `foreground`, `primary`, `muted-foreground`, `border`, `ring`, `chart-1`, `sidebar`, ...), son `radius`, ses polices `font-sans` et `font-mono`, ainsi que tout token que l'app ajoute. Les classes les nomment comme Tailwind nomme les variables d'un `@theme` CSS, les composants Rust les lisent avec `theme()` depuis `nsh_base`, et TSX les lit avec `token()` depuis `nsh`, de sorte qu'un écran TSX et les composants Rust suivent le même thème :

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

Le nom d'un token est celui de sa variable CSS sans `--`, tel que le fichier de thème l'écrit : `muted-foreground`, `radius`, `chart-1`. En Rust, les tokens de shadcn sont des méthodes de `theme()` (`primary()`, `muted_foreground()`, `radius()`, `font_mono()`), et chaque token est `theme().color("up")`, `theme().number("radius-card")` ou `theme().font("font-display")`.

| Forme | Accepte | Exemple |
|---|---|---|
| Un nom de couleur dans n'importe quel utilitaire de couleur | Une couleur du thème, avec aussi une opacité | `bg-primary`, `text-muted-foreground/70`, `bg-up/30`, `border-t-border`, `ring-ring`, `from-accent`, `placeholder:text-muted-foreground` |
| `(--name)`, le raccourci de variable de Tailwind 4 | Une couleur ou un nombre du thème | `bg-(--primary)`, `rounded-(--radius)`, `p-(--gap-card)` |
| `(color:--name)`, `(length:--name)`, `(number:--name)`, `(family-name:--name)` | Idem, typés là où un utilitaire accepte plusieurs types de valeurs | `text-(color:--up)`, `text-(length:--text-title)`, `font-(family-name:--font-mono)` |
| `font-sans`, `font-mono` | Les polices du thème, quand il en définit | `font-mono` |

- **Vos propres tokens.** Chaque nom du fichier de thème est un token, comme chaque variable d'un `@theme` CSS : `"up": "#16a34a"` produit `bg-up`, `text-up` et `bg-up/30` ; `"radius-card": "14px"` produit `rounded-(--radius-card)` ; `"font-display": "Pacifico"` produit `font-(family-name:--font-display)`. Les longueurs sont en points ; `(number:--name)` transmet le nombre brut.
- **Polices.** `font-sans` est la police de l'app : tout texte qui ne définit pas sa propre famille est dessiné avec elle, comme une page l'est avec `--font-sans` de Tailwind. `font-mono` est la police de `font-mono` et du code dans `TextView`. Sans définition, les deux sont les polices du système.
- **Les deux apparences.** Un token a la valeur claire et la valeur sombre du thème : `bg-primary`, `theme().primary` et `token("primary")` changent d'eux-mêmes avec l'apparence, sans classe `dark:`. Une couleur que le thème ne définit que pour une seule apparence est utilisée dans les deux.
- **Vos couleurs Tailwind l'emportent.** Un nom dans `"tailwind"` `colors` ou dans la palette de Tailwind désigne cette couleur, donc `bg-primary` est un token du thème quand le thème Tailwind n'a pas de couleur `primary`.
- **Le thème peut changer pendant l'exécution de l'app.** Quand une app intégrée dans une app native reçoit le thème de cette dernière, et à chaque changement du thème, les classes nommant des tokens, les liaisons Rust lisant `theme()` et le code TSX lisant `token()` sont mis à jour, les classes et les liaisons de façon native. Les tokens que le thème de l'app hôte n'a pas gardent les valeurs du `"theme"` de l'app elle-même (puis celles du thème par défaut). Un hôte qui ajoute seulement sa marque fournit des surcharges de thème, c'est-à-dire les tokens que sa marque modifie, dans le même format de fichier ([iOS](./ios.md#theme-overrides), [Android](./android.md#theme-overrides), `AppView::set_theme_overrides` sur les ordinateurs de bureau).
- **Vérifié comme les autres classes.** Un nom qui n'est un token ni du thème par défaut ni du `"theme"` de l'app est une classe inconnue à la compilation (`unknown class 'bg-chart-up'`). Pour utiliser un token que seule l'app hôte fournit, donnez-lui aussi une valeur dans le `"theme"` de l'app : cette valeur s'affiche quand l'app s'exécute seule.

Les classes nommant des tokens sont résolues une fois par thème, comme n'importe quelle autre classe : les dessiner coûte autant qu'une couleur de palette.

<a id="445-in-tsx"></a>

### `token()` en TSX

`token(name)` depuis `nsh` renvoie la valeur d'un token dans l'apparence affichée : une couleur sous la forme `#rrggbbaa`, une longueur sous la forme d'un nombre de points, une police sous la forme du nom de sa famille. Elle est réactive : le code qui la lit dans un composant, un memo ou un effet s'exécute de nouveau quand le thème ou l'apparence change, ce qui convient aux valeurs qui vont là où aucune classe ne peut aller, comme un canvas ou un graphique :

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

Les noms sont typés : NSH écrit les tokens de l'app dans `.nsh/types/nsh/tokens.d.ts` à partir de son thème, donc `token("up")` est un `string` dès que `"up"` figure dans le thème, et un nom absent du thème est une erreur de type.

<a id="the-class-check"></a>

## La vérification des classes

`nsh build`, `nsh dev`, `nsh run` et `nsh test` vérifient les noms de classes statiques de votre JSX (les littéraux de chaîne dans `class` et les clés de `classList`) avec le même parseur et le même thème que ceux du runtime, et signalent les classes qui n'existent pas :

```text
 warn nsh::build App.tsx:12:36: unknown class `bg-brand-550`
```

Les avertissements ne font pas échouer le build. Les classes construites à l'exécution (``bg-${color()}-500``) sont vérifiées la première fois que le runtime les voit, et il journalise une seule fois chaque classe inconnue (`unknown classes: ...`). Les méthodes typées sont vérifiées par le compilateur Rust.

<a id="classes-or-styles"></a>

## Classes ou styles ?

Les deux sont résolus nativement et coûtent à peu près autant. Les classes sont plus courtes et offrent des variantes (états pressés, mode sombre, points de rupture) sans code. Les styles en ligne acceptent des valeurs calculées en JavaScript ainsi que des [valeurs animées natives](./animation.md) (`opacity: fade`, `translate: [x, 0]`). La plupart des apps TSX utilisent des classes pour l'apparence statique et `style` pour ce qui est calculé ou animé. Les composants Rust utilisent des méthodes typées pour les deux, et lient les valeurs animées avec `.bind_opacity(..)`, `.bind_translate_x(..)` et les autres liaisons.

<a id="related"></a>

## Voir aussi

- [Styling](./styling.md) : la prop style, les méthodes typées et les limites des effets selon la plateforme.
- [Référence Tailwind](../modules/tailwind-reference.md) : chaque utilitaire et chaque variante.
- [Layout](./layout.md) : flexbox et grid, également disponibles sous forme de classes.
