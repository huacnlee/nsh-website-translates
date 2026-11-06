---
title: "Calendar"
description: "Le composant Calendar : une date ou une plage de dates choisie parmi des mois de jours, avec des vues par mois et par année et la prise en charge du clavier, stylisé par l'application."
group: base
demo: el-date-picker
source_hash: 48766bd0cb573ae0
---

# Calendar

Un calendrier choisit une date, ou avec `range` une plage de dates, parmi des mois de jours disposés en semaines : une date d'échéance dans un formulaire, les nuits d'un séjour, les jours d'un rapport. Il affiche un mois ou plusieurs côte à côte, fait défiler les mois avec Précédent et Suivant, et bascule vers une vue des mois de l'année ou une page d'années pour aller plus loin. C'est le calendrier de la fenêtre contextuelle de [DatePicker](./date-picker.md), utilisé seul dans la page.

Le calendrier gère le comportement : la valeur (celle de l'app, ou la sienne), le mois affiché, les vues, les jours qui ne peuvent pas être choisis, le clavier et ce qu'entendent les lecteurs d'écran. L'apparence revient à l'app : elle style l'en-tête, le corps, chaque mois, chaque ligne et chaque item, et dessine le contenu des items (les noms des mois et des jours de la semaine, la marque du jour courant, la bande de la plage). La grille remplit la largeur qui lui est donnée, comme les colonnes d'un tableau : les mois se la partagent et les items d'une ligne se partagent la ligne à parts égales. Ainsi, un calendrier dans la feuille d'un téléphone occupe tout l'écran, et un calendrier dans une fenêtre contextuelle dimensionnée selon son contenu garde la largeur de ses items (`flex-none` dans `itemClass` ou `monthClass` garde un item ou un mois à sa propre largeur).

```rust tabs
use nsh_base::{CalendarEntry, CalendarItemKind, Date, Matcher, calendar};
use nsh_core::prelude::*;

const MONTHS: [&str; 12] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

fn due_date() -> impl IntoElement {
    let due = signal(Date::default());
    calendar()
        .value(move || due.get())
        .on_change(move |next: &Date| due.set(*next))
        .disabled_matcher(Matcher::DayOfWeek(vec![0, 6]))
        .previous_accessibility_label("Previous month")
        .next_accessibility_label("Next month")
        .item_class("rounded-md selected:bg-primary selected:text-primary-foreground disabled:opacity-50")
        .render_item(|item: &CalendarEntry| {
            let label = match item.kind {
                CalendarItemKind::Previous => "‹".to_string(),
                CalendarItemKind::Next => "›".to_string(),
                CalendarItemKind::Weekday => WEEKDAYS[item.value as usize].to_string(),
                CalendarItemKind::MonthToggle | CalendarItemKind::Month => {
                    MONTHS[item.value as usize - 1].to_string()
                }
                _ => item.value.to_string(),
            };
            view()
                .w_8()
                .h_8()
                .items_center()
                .justify_center()
                .child(text(label).text_sm())
        })
}
```

```tsx tabs
import { mount, signal, Text } from "nsh";
import { Calendar, type CalendarValue } from "nsh/base";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function App() {
  const due = signal<CalendarValue>(null);
  return (
    <Calendar
      value={due()}
      onChange={({ value }) => due.set(value)}
      disabledMatcher={[0, 6]}
      previousAccessibilityLabel="Previous month"
      nextAccessibilityLabel="Next month"
      class="w-72 gap-2 rounded-lg border border-border p-3"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="group h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-outside:text-muted-foreground disabled:opacity-50"
      renderItem={(item) => (
        <Text class={item.today ? "font-semibold" : ""}>
          {item.kind === "weekday"
            ? WEEKDAYS[item.value]
            : item.kind === "month" || item.kind === "monthToggle"
              ? MONTHS[item.value - 1]
              : item.kind === "previous"
                ? "‹"
                : item.kind === "next"
                  ? "›"
                  : String(item.value)}
        </Text>
      )}
    />
  );
}

mount(App);
```

`Calendar` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `calendar()` en construit un avec un setter par prop (`.value(..)`, `.range(..)`, `.number_of_months(..)`) et un listener par événement (`.on_change(..)`). Sa valeur est un `Date` (`Date::Single`, `Date::Range`, à partir d'un `chrono::NaiveDate` ou d'une paire de ceux-ci), et les jours qu'il désactive sont un `Matcher`.

<a id="value"></a>

## Valeur

La valeur est une date ISO, `"2026-10-28"`, comme celle d'un `<input type="date">` HTML ; avec `range` c'est `[start, end]`, et `null` signifie aucune date. Avec `value`, l'app la possède : le calendrier l'affiche comme sélectionnée et signale un choix avec `onChange({ value })` ; l'app définit `value` pour la suivre. Si elle est omise, le calendrier garde sa propre valeur, à partir de `defaultValue` au départ.

`onChange` ne signale que des valeurs complètes, comme le `Selected` de `gpui-base` : un jour pressé, ou la fin d'une plage.

- Sans `range`, une pression sur un jour le choisit.
- Avec `range`, la première pression commence la plage et la seconde la termine, les jours entre les deux faisant partie de la plage (chacun `selected`, extrémités comprises, voir [Items](#items)). Une seconde pression sur un jour antérieur recommence la plage à partir de celui-ci, tout comme une pression une fois la plage complète. Une demi-plage s'affiche jusqu'à ce qu'elle soit complète, et n'est signalée qu'à ce moment-là.

Le calendrier s'ouvre sur le mois de la valeur (le début d'une plage), sinon sur celui d'aujourd'hui.

<a id="months-and-views"></a>

## Mois et vues

`numberOfMonths` affiche autant de mois côte à côte, à partir du mois affiché ; Précédent et Suivant les font défiler d'un mois à la fois. `firstDayOfWeek` est le jour par lequel commencent les semaines, de `0` dimanche (par défaut) à `6` samedi.

L'en-tête contient Précédent, deux bascules et Suivant :

- La vue des jours affiche les jours des mois, chaque mois formant une colonne avec sa ligne de jours de la semaine et ses semaines ; les jours des mois précédent et suivant complètent les semaines (`outside`, `data-outside`).
- La bascule du mois (`monthToggle`) ouvre la vue des mois : les douze mois, en lignes de trois. En choisir un l'affiche dans la vue des jours.
- La bascule de l'année (`yearToggle`) ouvre la vue des années : une page de 20 années, en lignes de cinq, Précédent et Suivant faisant défiler la page. En choisir une affiche cette année dans la vue des jours. `yearRange` désigne les années que parcourent les pages, `[start, end)` (par défaut : de 50 ans avant l'année en cours à 50 ans après).

Avec plusieurs mois, l'en-tête affiche le titre de chaque mois au lieu des bascules (un item `monthToggle` qui ne prend aucune pression), comme celui de `gpui-base`.

<a id="disabled-dates"></a>

## Dates désactivées

`disabledMatcher` désigne les jours que l'utilisateur ne peut pas choisir, comme le `Matcher` de `gpui-base`, sous l'une de ces quatre formes :

| Forme | Désactive |
|---|---|
| `[0, 6]` | Ces jours de la semaine, `0` dimanche à `6` samedi. |
| `{ before, after }` | Les jours avant `before` et après `after` (l'un ou l'autre peut être omis). |
| `{ from, to }` | Les jours de `from` à `to`, inclus (une borne omise reste ouverte). |
| `(date) => boolean` | Les jours pour lesquels la fonction renvoie `true`, à partir de la date ISO de chaque jour affiché. |

La fonction est appelée une fois par jour affiché, au prochain tour JS, et pas de nouveau pour un jour auquel elle a déjà répondu : faire défiler les mois ne l'interroge que sur les jours qu'ils apportent, sa réponse doit donc être une fonction pure de la date. Passer une autre fonction relance l'interrogation. Un jour désactivé est `disabled:` : il ne prend aucune pression, et Retour et Espace ne le choisissent pas.

## Items

Chaque cible de pression et chaque libellé du calendrier est un item : Précédent, les bascules, Suivant, les jours de la semaine, les jours, les mois et les années. Chacun est dessiné dans une partie stylée par `itemClass` et `itemStyle`, dont les variantes suivent son état :

| Variante | L'item |
|---|---|
| `selected:` | Est sélectionné : la date, chaque jour d'une plage complète (extrémités comprises, comme le range calendar de React Aria), le début d'une demi-plage, le mois ou l'année affichés, la bascule de la vue ouverte. Les lecteurs d'écran l'annoncent comme sélectionné. |
| `disabled:` | Ne prend aucune pression : une date désactivée, un jour de la semaine, le titre d'un mois, Précédent et Suivant dans la vue des mois ou aux limites des années. |
| `focus:` | A le clavier. |
| `data-range-start:`, `data-range-end:` | Est le premier ou le dernier jour d'une plage complète (une plage d'un seul jour est les deux). |
| `data-range-middle:` | Est un jour à l'intérieur d'une plage complète, hors extrémités. |
| `data-today:` | Est aujourd'hui. |
| `data-outside:` | Est un jour du mois précédent ou suivant, complétant ses semaines. |

Les variantes `data-*` sont celles de Tailwind (`data-range-start:` correspond à `[data-range-start]`), comme le calendrier de shadcn style ses jours ; avec `group` dans `itemClass`, le contenu les suit avec `group-selected:`, `group-data-range-middle:`, et ainsi de suite. `selected:` désigne chaque jour d'une plage : les extrémités d'une plage prennent donc leur apparence par-dessus (les dernières variantes l'emportent : `data-*` vient après `selected:`), et ses jours intermédiaires la leur :

```tsx
<Calendar
  range
  itemClass="group rounded-md selected:bg-primary selected:text-primary-foreground data-range-middle:rounded-none data-range-middle:bg-accent data-range-middle:text-accent-foreground data-range-start:rounded-r-none data-range-end:rounded-l-none data-range-start:data-range-end:rounded-md"
/>
```

`renderItem` dessine le contenu d'un item d'après ce qu'il est, un `CalendarEntry`, jamais d'après son état : le dessin est fait une fois et conservé tant que l'item est sélectionné, focalisé ou placé dans une plage ; ainsi les touches, un choix et le focus ne redessinent rien, et un défilement des mois dessine une fois chacun des jours qu'il apporte (un jour garde son dessin selon son mois et sa date : avec plusieurs mois, les mois toujours affichés gardent le leur).

| Champ | Signification |
|---|---|
| `kind` | `"previous"`, `"monthToggle"`, `"yearToggle"`, `"next"`, `"weekday"`, `"day"`, `"month"` ou `"year"`. |
| `value` | Son numéro : le jour du mois, le mois (1 à 12), l'année, le jour de la semaine (`0` dimanche à `6`) ; `0` pour Précédent et Suivant. |
| `date` | La date ISO d'un jour. |
| `year`, `month` | L'année et le mois auxquels il appartient : ceux d'un jour (le mois dont les semaines l'affichent), ceux de la bascule ou du titre d'un mois, ceux d'un mois de la vue des mois ; l'année propre à la bascule de l'année et à une année. `0` pour Précédent, Suivant et les jours de la semaine (et `month` pour la bascule de l'année et les années). |
| `today` | Le jour est aujourd'hui. |
| `outside` | Le jour appartient au mois précédent ou suivant. |

Sans `renderItem`, un item affiche son numéro, et Précédent et Suivant affichent `‹` et `›`, comme `gpui-base` ; un jour de la semaine affiche aussi son numéro, de `0` à `6`, puisque les noms des mois et des jours de la semaine sont les mots de l'app, dans la langue de l'app.

## Props

| Prop | Rust | Type | Par défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `CalendarValue` | aucune | La valeur, gérée par l'app. |
| `defaultValue` | `.default_value(..)` | `CalendarValue` | `null` | La valeur initiale, sans `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Choisir une plage : la première pression la commence, la seconde la termine. |
| `numberOfMonths` | `.number_of_months(..)` | `number` | `1` | Combien de mois s'affichent côte à côte. |
| `firstDayOfWeek` | `.first_day_of_week(..)` | `number` | `0` | Le jour par lequel commencent les semaines, de `0` dimanche à `6` samedi. |
| `disabledMatcher` | `.disabled_matcher(..)` | `DateMatcher` | aucune | Les dates qui ne peuvent pas être choisies. |
| `yearRange` | `.year_range(..)` | `[number, number]` | 50 ans de chaque côté | Les années que parcourt la vue des années, `[start, end)`. |
| `previousAccessibilityLabel` | `.previous_accessibility_label(..)` | `string` | aucune | Ce que disent les lecteurs d'écran pour Précédent. |
| `nextAccessibilityLabel` | `.next_accessibility_label(..)` | `string` | aucune | Ce que disent les lecteurs d'écran pour Suivant. |
| `headerClass`, `headerStyle` | `.header_class(..)`, `.header_style(..)` | `string`, `StyleProp<ViewStyle>` | aucune | L'en-tête : Précédent, les bascules (ou les titres des mois), Suivant. |
| `bodyClass`, `bodyStyle` | `.body_class(..)`, `.body_style(..)` | `string`, `StyleProp<ViewStyle>` | aucune | Le corps : les mois côte à côte, ou les lignes de la vue des mois ou des années. |
| `monthClass`, `monthStyle` | `.month_class(..)`, `.month_style(..)` | `string`, `StyleProp<ViewStyle>` | aucune | Chaque mois de la vue des jours. |
| `rowClass`, `rowStyle` | `.row_class(..)`, `.row_style(..)` | `string`, `StyleProp<ViewStyle>` | aucune | Chaque ligne : les jours de la semaine, une semaine, une ligne de mois ou d'années. |
| `itemClass`, `itemStyle` | `.item_class(..)`, `.item_style(..)` | `string`, `StyleProp<TextStyle>` | aucune | Chaque item : `selected:`, `disabled:`, `focus:` ; pour un jour, `data-range-start:`, `data-range-end:`, `data-range-middle:`, `data-today:`, `data-outside:` ([Items](#items)). |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | aucune | Le contenu d'un item, dessiné par l'app d'après ce qu'est l'item ; son numéro sinon. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucune | Le calendrier : l'en-tête au-dessus du corps. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | L'utilisateur a choisi une valeur complète : `{ value }`, un jour ou une plage. Définissez `value` pour la suivre. Un `value` passé par l'app n'est jamais signalé. |

<a id="parts"></a>

## Parties

| Partie | Emplacement | Stylée avec |
|---|---|---|
| Le calendrier | la racine | `class`, `style` |
| L'en-tête | le calendrier, en premier | `headerClass`, `headerStyle` |
| Le corps | le calendrier, après l'en-tête | `bodyClass`, `bodyStyle` |
| Un mois | le corps (vue des jours) | `monthClass`, `monthStyle` |
| Une ligne | un mois, ou le corps (vues des mois et des années) | `rowClass`, `rowStyle` |
| Un item | l'en-tête et les lignes | `itemClass`, `itemStyle`, `renderItem` (`group-selected:`, `group-data-range-middle:`, ... à l'intérieur, sous `group` dans `itemClass`) |

<a id="keyboard"></a>

## Clavier

Les jours forment un seul arrêt de Tab : il atterrit sur le jour sélectionné, sinon sur aujourd'hui, sinon sur le premier jour affiché. Ensuite :

| Touche | Action |
|---|---|
| Gauche / Droite | Le jour précédent ou suivant. |
| Haut / Bas | Le même jour une semaine avant ou après. |
| Début / Fin | Le premier ou le dernier jour de la semaine. |
| Page précédente / Page suivante | Le même jour un mois avant ou après. |
| Maj+Page précédente / Maj+Page suivante | Le même jour un an avant ou après. |
| Retour, Espace | Choisit le jour. |

Dans une disposition de droite à gauche, les semaines courent depuis la droite : Gauche est donc le jour suivant et Droite le jour précédent ; Haut et Bas conservent les semaines. Dépasser les mois affichés les fait défiler. Précédent, les bascules, Suivant, les mois et les années prennent des pressions.
Les jours de `gpui-base` ne prennent que des pressions ; les touches sont celles de NSH, d'après la boîte de dialogue de sélection de date de WAI-ARIA.

<a id="accessibility"></a>

## Accessibilité

- Chaque jour est un bouton nommé par sa date ISO, sélectionné tant qu'il est la date ou un jour de la plage (extrémités comprises, comme le range calendar de React Aria), et atténué lorsqu'il est désactivé.
- Précédent et Suivant sont des boutons nommés par `previousAccessibilityLabel` et `nextAccessibilityLabel` ; les bascules, les mois et les années sont des boutons nommés par ce qu'ils affichent.

Voir [Accessibility](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.
