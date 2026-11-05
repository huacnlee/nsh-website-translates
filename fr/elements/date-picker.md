---
title: "DatePicker"
description: "Le composant DatePicker : une date, une plage de dates ou une date et une heure sélectionnées depuis un calendrier dans une fenêtre contextuelle à l'emplacement de son déclencheur sur ordinateur, et dans une feuille modale sur téléphone, avec un style défini par l'application."
group: base
demo: el-date-picker
source_hash: ba9910b03fe753f3
---

# DatePicker

Un date picker définit une date à partir d'un [Calendar](./calendar.md) qui s'ouvre depuis le déclencheur de l'app : une échéance, un anniversaire, avec `range` les jours d'un voyage, avec `timePrecision` une date et une heure de la journée. Comme [Select](./select.md), il s'ouvre de la manière attendue sur chaque appareil :

- Sur les ordinateurs de bureau et dans les navigateurs de bureau, une popup au niveau du déclencheur ; son ouverture place le clavier sur les jours.
- Sur les téléphones et les tablettes, une feuille en bas de l'écran, au-dessus d'un arrière-plan.

Le picker gère le comportement : la valeur (celle de l'app, ou la sienne), l'état d'ouverture, le calendrier, l'heure, les préréglages, le clavier et ce qu'entendent les lecteurs d'écran. L'apparence revient à l'app : elle dessine le déclencheur (avec la valeur, un placeholder, une icône) et stylise la popup, les parties du calendrier, les préréglages et le champ d'heure.

```rust tabs
use chrono::NaiveDate;
use nsh_base::{DateRangePreset, DateTime, PickedDate, date_picker, theme};
use nsh_core::prelude::*;

fn trip_dates() -> impl IntoElement {
    let trip = signal(DateTime::Range(None, None));
    let title = move || {
        trip.get()
            .format("%b %-d")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Pick dates".to_string())
    };
    let day = |m, d| NaiveDate::from_ymd_opt(2026, m, d).unwrap();
    date_picker()
        .range(true)
        .number_of_months(2)
        .value(move || trip.get())
        .on_change(move |next: &PickedDate| trip.set(next.value))
        .presets(vec![
            DateRangePreset::range("This week", day(10, 25), day(10, 31)),
            DateRangePreset::range("Next week", day(11, 1), day(11, 7)),
        ])
        .accessibility_label("Trip")
        .offset(px(4.0))
        .popup_style(|s| {
            s.p_3()
                .rounded_lg()
                .border_1()
                .border_color(move || theme().border)
                .bg(move || theme().popover)
                .shadow_md()
        })
        .trigger(
            view()
                .h_9()
                .w_56()
                .px_3()
                .justify_center()
                .rounded_md()
                .border_1()
                .border_color(move || theme().input)
                .child(text(title)),
        )
}
```

```tsx tabs
import { mount, signal, Text, View } from "nsh";
import { DatePicker, type DatePickerValue } from "nsh/base";

function App() {
  const due = signal<DatePickerValue>(null);
  return (
    <DatePicker
      value={due()}
      onChange={({ value }) => due.set(value)}
      timePrecision="minute"
      cleanable
      clearButton={<Text>×</Text>}
      clearButtonAccessibilityLabel="Clear the due date"
      presets={[{ label: "Tomorrow 9:00", value: "2026-10-29T09:00" }]}
      accessibilityLabel="Due"
      offset={4}
      popupClass="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
      backdropClass="bg-black/40"
      contentClass="flex-row gap-3"
      presetClass="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
      headerClass="flex-row items-center justify-between"
      rowClass="flex-row justify-between"
      itemClass="h-8 min-w-8 items-center justify-center rounded-md text-sm focus:ring-2 focus:ring-ring selected:bg-primary selected:text-primary-foreground disabled:opacity-50"
      timeClass="mt-2 gap-3"
      timeLabel={<Text class="text-sm">Time</Text>}
      timeAccessibilityLabel="Due time"
      timeFieldClass="flex-row rounded-md border border-input px-2 py-1"
      segmentClass="text-sm tabular-nums focus:bg-accent"
      trigger={
        <View class="h-9 w-56 justify-center rounded-md border border-input px-3 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Text>{typeof due() === "string" ? (due() as string).replace("T", " ") : "Pick a date"}</Text>
        </View>
      }
    />
  );
}

mount(App);
```

`DatePicker` provient de [`nsh/base`](../modules/nsh-base.md), le crate `nsh-base` en Rust. En Rust, `date_picker()` en crée un avec un setter par prop (`.value(..)`, `.range(..)`, `.time_precision(..)`) et un listener par événement (`.on_change(..)`). Sa valeur est un `DateTime` (`DateTime::Single`, `DateTime::Range`, de `chrono` dates ou dates et heures) ; `onChange` donne un `PickedDate`, la valeur avec la précision d'heure du picker.

<a id="value"></a>

## Valeur

La valeur prend les formes des inputs HTML : une date ISO, `"2026-10-28"`, comme celle de `<input type="date">` ; avec `range` `[start, end]` ; avec `timePrecision` une date et une heure, `"2026-10-28T09:30"` (`"2026-10-28T09:30:15"` aux secondes), comme celle de `<input type="datetime-local">` ; `null` signifie aucune valeur. Avec `value`, l'app la possède : le picker l'affiche et signale chaque changement avec `onChange({ value })` ; l'app définit `value` pour le suivre. Si elle est omise, le picker garde sa propre valeur, à partir de `defaultValue` au départ.

- Une seule date : un appui sur un jour définit la valeur et ferme la popup.
- Avec `range`, le premier appui commence la plage et le second la termine, comme dans [un calendrier](./calendar.md#value) ; la plage complète définit la valeur et ferme la popup.
- Avec `timePrecision` (une seule date uniquement), un champ d'heure s'affiche sous le calendrier et chaque modification de l'heure est signalée. Sur les ordinateurs de bureau, choisir un jour garde la popup ouverte pour l'heure et signale la date avec son heure ; un nouvel appui sur le jour sélectionné ferme la popup. Sur les téléphones et les tablettes, un appui sur un jour le choisit à son heure et ferme la feuille, comme pour une seule date ; la feuille se rouvre pour l'heure. Un jour choisi avant toute heure reçoit `defaultTime` (par défaut `00:00`). `hourCycle` est la manière dont le champ compte les heures.

`cleanable` ajoute un bouton d'effacement tant qu'il y a une valeur : un appui l'efface (`onChange({ value: null })`). Il vient après le déclencheur, pas dedans, de sorte qu'un appui dessus n'ouvre jamais la popup ; l'app le place et le remplit (`clearButton`), comme pour [le bouton d'effacement d'un select](./select.md#value).

<a id="presets"></a>

## Préréglages

Les `presets` sont des boutons à côté du calendrier qui définissent la valeur : « Aujourd'hui », « 7 derniers jours », « Demain à 9 h ». Chacun est `{ label, value }`, `value` une date, une plage ou des dates et heures, conservées telles quelles ; un appui la définit et ferme la popup. `contentClass` dispose la colonne des préréglages et le calendrier avec l'heure (une ligne, `flex-row`) ; `presetsClass` stylise la colonne, `presetClass` chaque bouton.

<a id="the-calendar"></a>

## Le calendrier

Chaque prop de [Calendar](./calendar.md) sauf sa valeur est transmise à celles du picker : `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange`, `previousAccessibilityLabel`, `nextAccessibilityLabel`, les parties (`headerClass` à `itemStyle`) et `renderItem`. `calendarClass` et `calendarStyle` stylisent le calendrier lui-même. Ses vues et ses touches sont celles d'un calendrier.

La ligne de l'heure (`timeClass`, `timeStyle`) contient `timeLabel`, le texte de l'app pour la désigner (« Heure »), à son début et le champ d'heure (`timeFieldClass`, `timeFieldStyle`, `timeAccessibilityLabel`) à sa fin : une ligne dont les éléments sont centrés et espacés (`flex-row items-center justify-between`, comme ceux de `gpui-component`). Les segments du champ sont ceux d'un [TimeField](./time-field.md) (`segmentClass`, `separatorClass`, `renderSegment`).

## Props

| Prop | Rust | Type | Défaut | Description |
|---|---|---|---|---|
| `value` | `.value(..)` | `DatePickerValue` | aucun | La valeur, possédée par l'app. |
| `defaultValue` | `.default_value(..)` | `DatePickerValue` | `null` | La valeur au départ, sans `value`. |
| `range` | `.range(..)` | `boolean` | `false` | Choisir une plage de dates. |
| `open`, `defaultOpen` | `.open(..)`, `.default_open(..)` | `boolean` | `false` | L'état d'ouverture, celui de l'app ou celui du picker. |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Il reste fermé et ne reçoit ni appuis ni focus clavier. |
| `accessibilityLabel` | `.accessibility_label(..)` | `string` | aucun | Comment les lecteurs d'écran le nomment. |
| `dateFormat` | `.date_format(..)` | `string` | `"%Y/%m/%d"` et l'heure | Comment les lecteurs d'écran énoncent la valeur, au format de `chrono`. |
| `timePrecision` | `.time_precision(..)` | `"minute" \| "second"` | aucun | Modifier aussi l'heure de la journée, jusqu'à cette précision. |
| `hourCycle` | `.hour_cycle(..)` | `"h23" \| "h12"` | `"h23"` | Comment le champ d'heure compte les heures. |
| `defaultTime` | `.default_time(..)` | `string` | `"00:00"` | L'heure qu'une date reçoit avant que l'utilisateur n'en définisse une. |
| `cleanable` | `.cleanable(..)` | `boolean` | `false` | Un bouton d'effacement tant qu'il y a une valeur. |
| `presets` | `.presets(..)` | `DateRangePreset[]` | `[]` | Des boutons dans la popup qui définissent la valeur. |
| `numberOfMonths`, `firstDayOfWeek`, `disabledMatcher`, `yearRange` | comme `Calendar` | comme `Calendar` | comme `Calendar` | Les mois, semaines, dates désactivées et années du calendrier. |
| `previousAccessibilityLabel`, `nextAccessibilityLabel` | comme `Calendar` | `string` | aucun | Ce que disent les lecteurs d'écran pour Précédent et Suivant du calendrier. |
| `placement`, `align`, `offset`, `margin` | `.placement(..)`, ... | comme `Select` | `"bottom"`, `"start"`, 0, 0 | Ordinateurs de bureau : où la popup se place par rapport au déclencheur. |
| `popupClass`, `popupStyle` | `.popup_class(..)`, `.popup_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La popup (ordinateurs de bureau) ou la feuille (écrans tactiles). |
| `backdropClass`, `backdropStyle` | `.backdrop_class(..)`, `.backdrop_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | L'arrière-plan derrière la feuille. |
| `contentClass`, `contentStyle` | `.content_class(..)`, `.content_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le contenu de la popup : les préréglages à côté du calendrier et l'heure. |
| `presetsClass`, `presetsStyle` | `.presets_class(..)`, `.presets_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La colonne des préréglages. |
| `presetClass`, `presetStyle` | `.preset_class(..)`, `.preset_style(..)` | `string`, `StyleProp<TextStyle>` | aucun | Le bouton de chaque préréglage. |
| `calendarClass`, `calendarStyle` | `.calendar_class(..)`, `.calendar_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le calendrier. |
| `headerClass` … `itemStyle` | comme `Calendar` | comme `Calendar` | aucun | L'en-tête, le corps, les mois, les lignes et les éléments du calendrier. |
| `renderItem` | `.render_item(..)` | `(item: CalendarEntry) => JSX.Element` | aucun | Chaque élément du calendrier, dessiné par l'app d'après ce qu'il est ; ses états sont les classes des éléments, comme celles de `Calendar`. |
| `timeClass`, `timeStyle` | `.time_class(..)`, `.time_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | La ligne de l'heure : son libellé au début, le champ à la fin. |
| `timeLabel` | `.time_label(..)` | `JSX.Element` | aucun | Ce que la ligne de l'heure affiche avant le champ. |
| `timeFieldClass`, `timeFieldStyle` | `.time_field_class(..)`, `.time_field_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le champ d'heure. |
| `timeAccessibilityLabel` | `.time_accessibility_label(..)` | `string` | aucun | Comment les lecteurs d'écran nomment le champ d'heure. |
| `segmentClass`, `segmentStyle`, `separatorClass`, `separatorStyle`, `renderSegment` | comme `TimeField` | comme `TimeField` | aucun | Les segments du champ d'heure et `:`. |
| `clearButtonClass`, `clearButtonStyle` | `.clear_button_class(..)`, `.clear_button_style(..)` | `string`, `StyleProp<ViewStyle>` | aucun | Le bouton d'effacement (`cleanable`). |
| `clearButton` | `.clear_button(..)` | `JSX.Element` | aucun | Le contenu du bouton d'effacement. |
| `clearButtonAccessibilityLabel` | `.clear_button_accessibility_label(..)` | `string` | aucun | Comment les lecteurs d'écran nomment le bouton d'effacement. |
| `trigger` | `.trigger(..)` | `JSX.Element` | aucun | Ce qui ouvre la popup lorsqu'on appuie dessus ; la popup est placée par rapport à lui. |
| `class`, `style` | méthodes de style | `string`, `StyleProp<ViewStyle>` | aucun | La vue autour du déclencheur. |

<a id="events"></a>

## Événements

| Événement | Rust | Description |
|---|---|---|
| `onChange` | `.on_change(\|value\| ..)` | La valeur a changé (un jour, la fin d'une plage, un préréglage, l'heure, le bouton d'effacement) : `{ value }`. Définissez `value` pour le suivre. |
| `onOpenChange` | `.on_open_change(\|e\| ..)` | La popup s'est ouverte ou fermée, avec la raison (`{ open, reason }`). Définissez `open` pour le suivre. |
| `onOpen`, `onClose` | `.on_open(..)`, `.on_close(..)` | La popup est affichée, ou a disparu. |
| `onCancel` | `.on_cancel(..)` | L'utilisateur a fermé la popup sans faire de choix (Échap ou retour, un appui à l'extérieur ou sur l'arrière-plan). |

<a id="parts"></a>

## Parties

| Partie | Où | Stylisée avec |
|---|---|---|
| Le déclencheur | la vue du picker | l'élément propre à l'app (`trigger`) |
| Le bouton d'effacement | la vue du picker, après le déclencheur (`cleanable`, tant qu'il y a une valeur) | `clearButtonClass`, `clearButtonStyle` ; son contenu `clearButton` |
| La popup ou la feuille | au-dessus de tout, au niveau du déclencheur (ordinateurs de bureau) ou en bas (écrans tactiles) | `popupClass`, `popupStyle` |
| L'arrière-plan | derrière la feuille (écrans tactiles) | `backdropClass`, `backdropStyle` |
| Le contenu | la popup | `contentClass`, `contentStyle` |
| Les préréglages | le contenu, en premier (`presets`) | `presetsClass`, `presetsStyle` ; chacun `presetClass`, `presetStyle` |
| Le calendrier | le contenu | `calendarClass`, `calendarStyle`, et les parties de [Calendar](./calendar.md#parts) |
| La ligne de l'heure | sous le calendrier (`timePrecision`) | `timeClass`, `timeStyle` ; son libellé `timeLabel` |
| Le champ d'heure | la ligne de l'heure | `timeFieldClass`, `timeFieldStyle`, et les parties de [TimeField](./time-field.md#parts) |

<a id="keyboard"></a>

## Clavier

| Touche | Action |
|---|---|
| Entrée (sur le déclencheur) | Ouvre la popup, ou la ferme. |
| Suppr, Retour arrière (sur le déclencheur) | Efface la valeur tant que la popup est fermée. |
| Échap | Ferme la popup sans faire de choix. |

Dans la popup, les touches du calendrier permettent de se déplacer entre les jours et d'en choisir un (voir [Clavier](./calendar.md#keyboard)) et celles du champ d'heure modifient l'heure (voir [Clavier](./time-field.md#keyboard)).

<a id="accessibility"></a>

## Accessibilité

- Le déclencheur est une combobox pour les lecteurs d'écran : son libellé est `accessibilityLabel`, sa valeur la date telle que `dateFormat` l'écrit (par défaut `2026/10/28`, avec l'heure à `timePrecision`), et il indique si la popup est développée. `disabled` l'atténue.
- Les jours du calendrier sont des boutons nommés par leurs dates ISO (voir [Accessibilité](./calendar.md#accessibility)) ; les préréglages sont des boutons nommés par leurs libellés ; le champ d'heure est nommé par `timeAccessibilityLabel`.
- Le bouton d'effacement est un bouton nommé par `clearButtonAccessibilityLabel`.

Voir [Accessibilité](../docs/accessibility.md) pour les libellés, les rôles et les annonces en général.
