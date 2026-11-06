---
title: "Шрифты"
description: "Системный шрифт и универсальные семейства, списки запасных шрифтов, поставка файлов .ttf, .otf, .woff и .woff2 из ресурсов Rust-крейта или через импорты TSX, семейства с несколькими весами и курсивом, а также шрифты в типизированных стилях и классах Tailwind."
order: 37
group: ui
source_hash: 9fd911f01604c8c3
---

# Шрифты

Текст использует системный шрифт (San Francisco на iOS, Roboto на Android), если семейство шрифтов не указано иначе (`.font_family(..)` в Rust, `fontFamily` в TSX). Семейством может быть generic-семейство, шрифт, установленный на устройстве, или файл шрифта, который вы поставляете вместе с приложением.

<a id="system-and-generic-families"></a>

## Системные и generic-семейства

| `fontFamily` | Шрифт |
|---|---|
| (нет), `"system-ui"`, `"sans-serif"`, `"ui-sans-serif"`, `"-apple-system"` | Системный шрифт |
| `"serif"`, `"ui-serif"` | Системный шрифт с засечками (New York на iOS, Noto Serif на Android) |
| `"monospace"`, `"ui-monospace"` | Системный моноширинный шрифт (SF Mono на iOS) |
| `"ui-rounded"` | Системный шрифт со скруглёнными краями (SF Pro Rounded), только iOS |

Системный шрифт поддерживает все начертания по насыщенности от 100 до 900. Классы Tailwind `font-sans`, `font-serif` и `font-mono` соответствуют первым трём строкам, а `font-sans` и `font-mono` — шрифтам темы, если она их задаёт ([Шрифт приложения по умолчанию](#a-default-font-for-the-app)).

Семейство, установленное на устройстве, можно указать напрямую (`"Georgia"`, `"Avenir Next"` на iOS). Набор установленных шрифтов различается между платформами и версиями, поэтому поставляйте с приложением шрифты, от которых зависит ваш дизайн. На iOS несуществующее семейство заменяется системным шрифтом с предупреждением в логе (`font family 'X' is not available`); чтобы выбрать, что использовать вместо него, укажите список ([Списки замены](#fallback-lists)).

<a id="shipping-a-font"></a>

## Поставка шрифта

Rust-крейт поставляет файлы из своего каталога `assets/`: `registry.assets(assets!())` в функции `#[native_module]` поставляет их все, а `asset!("fonts/Pacifico-Regular.ttf")` — это `FontAsset`, значением `family` которого является имя семейства шрифта, считываемое из файла при компиляции крейта. В TSX импортируйте файл `.ttf`, `.otf`, `.woff` или `.woff2`: импорт вычисляется в имя семейства шрифта. В обоих случаях шрифт регистрируется до первого кадра, поэтому он готов к моменту первой отрисовки текста. Файлы WOFF и WOFF2 — это сжатые шрифты TrueType или OpenType (файл WOFF2 часто вдвое меньше соответствующего TrueType, что экономит размер пакета приложения и веб-загрузок): NSH читает их как шрифты, которые они содержат, на всех платформах:

```rust tabs
use nsh_core::{element::FontAsset, prelude::*};

const PACIFICO: FontAsset = asset!("fonts/Pacifico-Regular.ttf");

#[native_module("app/native")]
fn native(registry: &mut Registry) {
    registry.assets(assets!());
}

text("Custom fonts").font_family(PACIFICO.family).text_size(px(30.0))
```

```tsx tabs
import { Text } from "nsh";
import Pacifico from "./fonts/Pacifico-Regular.ttf";

<Text style={{ fontFamily: Pacifico, fontSize: 30 }}>Custom fonts</Text>
```

`PACIFICO.family` и TSX-импорт `Pacifico` — это строка `"Pacifico"`: имя семейства, записанное в файле шрифта (его типографское имя семейства или, при его отсутствии, имя семейства), а не имя файла. Использование значения ресурса вместо ручного ввода имени позволяет держать их согласованными; отсутствующий или повреждённый файл приводит к ошибке сборки Rust, а импортированный файл гарантированно попадёт в сборку.

Файлы поставляются с приложением, как и любой другой [ресурс](./images-and-assets.md). Шрифты регистрируются только для процесса приложения; на устройство они не устанавливаются.

> [!WARNING]
> В TSX импорт, значение которого нигде не используется, удаляется механизмом import elision в TypeScript, а вместе с ним и шрифт. Если вы ссылаетесь на семейство только по имени (например, в теме Tailwind), импортируйте файл ради побочного эффекта: `import "./fonts/Inter-Bold.ttf";`. Rust-крейт поставляет каждый файл из `assets/` через `assets!()`.

<a id="fallback-lists"></a>

## Списки замены

`fontFamily` принимает список, как в CSS: семейства через запятую, наиболее предпочтительное первым, имя с пробелами можно указывать в кавычках или без них (`"Brand, 'Noto Sans SC', sans-serif"`), а имя в кавычках сохраняет свои запятые (`'ACME, Inc'`). Текст набирается первым семейством, которое есть на платформе, а символ, которого в нём нет (другое письмо, символ), берётся из следующего семейства списка, где он есть, а затем из системных резервных шрифтов. Список позволяет брендовому шрифту, покрывающему только латиницу, показывать китайский текст подходящим шрифтом или указать шрифт, который приложение загружает, вместе с системным шрифтом, который показывается до завершения загрузки:

```rust tabs
text("Brand 品牌").font_family("Brand, 'Noto Sans SC', sans-serif")
```

```tsx tabs
<Text style={{ fontFamily: "Brand, 'Noto Sans SC', sans-serif" }}>Brand 品牌</Text>
```

Каждая платформа сохраняет порядок списка средствами собственной шрифтовой подсистемы: cascade list на iOS и macOS, font fallback на Windows (по одному на абзац: список его первого стиля), список семейств Pango на Linux, список браузера в вебе, резервные шрифты GPUI. На Android текст набирается первым доступным семейством; если это шрифт, зарегистрированный приложением, то зарегистрированные шрифты, следующие за ним в списке, становятся его резервными (Android 10 и новее).

<a id="weights-and-italics"></a>

## Насыщенность и курсив

Семейство обычно состоит из нескольких файлов, по одному на каждое сочетание насыщенности и стиля. Поставляйте каждый из них (в Rust поместите их в `assets/`, в TSX импортируйте каждый); они регистрируются под одним именем семейства, а начертание выбирается по насыщенности и стилю:

```rust tabs
// assets/fonts: Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf, Inter-Italic.ttf
const INTER: FontAsset = asset!("fonts/Inter-Regular.ttf");

text("Regular, ")
    .font_family(INTER.family)
    .text_size(px(16.0))
    .child(text("medium").font_weight(FontWeight::MEDIUM))
    .child(", ")
    .child(text("bold").font_weight(FontWeight::BOLD))
    .child(" and ")
    .child(text("italic").italic())
    .child(".")
```

```tsx tabs
import { Text } from "nsh";
import Inter from "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Medium.ttf";
import "./fonts/Inter-Bold.ttf";
import "./fonts/Inter-Italic.ttf";

const body = { fontFamily: Inter, fontSize: 16 } as const;

<Text style={body}>
  Regular, <Text style={{ fontWeight: "500" }}>medium</Text>, <Text style={{ fontWeight: "bold" }}>bold</Text> and{" "}
  <Text style={{ fontStyle: "italic" }}>italic</Text>.
</Text>
```

Если среди зарегистрированных начертаний нет с точно запрошенной насыщенностью, используется ближайшее. Платформы различаются в поведении, когда начертание отсутствует:

| | iOS | Android |
|---|---|---|
| Насыщенность без начертания | Ближайшее зарегистрированное начертание | Ближайшее начертание, с синтетическим полужирным Android там, где оно применимо |
| Курсив без курсивного начертания | Прямое начертание (без наклона) | Наклонённая версия прямого начертания |

Поставляйте используемые вами начертания, чтобы получить одинаковый результат на обеих платформах.

<a id="fonts-in-typed-styles-and-tailwind-classes"></a>

## Шрифты в типизированных стилях и классах Tailwind

В Rust `.font_family(..)` принимает семейство ресурса везде, где указывается стиль, а методы насыщенности (`.font_weight(FontWeight::SEMIBOLD)`) выбирают начертания. Для классов укажите свои семейства в теме Tailwind в `nsh.json`, чтобы использовать их как классы `font-*`:

```json
{
  "tailwind": {
    "fontFamily": { "display": "Pacifico", "body": "Inter" }
  }
}
```

```rust tabs
use nsh_core::element::palette::VIOLET;

text("Custom fonts").font_family(PACIFICO.family).text_3xl().text_color(VIOLET.shade(600))
text("Bold Inter").font_family(INTER.family).font_weight(FontWeight::BOLD)
```

```tsx tabs
import { Text } from "nsh";
import "./fonts/Pacifico-Regular.ttf";
import "./fonts/Inter-Regular.ttf";
import "./fonts/Inter-Bold.ttf";

<Text class="font-display text-3xl text-violet-600">Custom fonts</Text>
<Text class="font-body font-bold">Bold Inter</Text>
```

Произвольное семейство работает без записи в теме: `font-[Pacifico]`. Классы насыщенности (`font-light`, `font-semibold`, `font-bold`, ...) выбирают начертания так же, как `fontWeight`. Текстовые стили на представлении передаются вложенным в него текстам, поэтому `.font_family(INTER.family)` на представлении или `<View class="font-body">` задаёт семейство для всего экрана.

<a id="a-default-font-for-the-app"></a>

## Шрифт приложения по умолчанию

`font-sans` темы — это шрифт приложения: каждый текст, для которого не задано собственное семейство, отрисовывается им, как в компонентах Rust, так и в TSX, подобно тому, как веб-страница использует `--font-sans` из Tailwind. `font-mono` — это моноширинный шрифт класса `font-mono` и кода в `TextView`. Задайте их в теме приложения (`"theme"` в `nsh.json`, [Rust](./rust.md#theme)) и поставьте файлы шрифтов, как описано выше:

```json
{
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "font-mono": "JetBrains Mono, monospace"
    }
  }
}
```

Шрифтом считается первое семейство списка, не являющееся generic-семейством; если первое семейство generic (`system-ui`, `sans-serif`), используется системный шрифт. Шрифт можно также задать на контейнере: вложенные в него тексты наследуют его.

```rust tabs
#[component]
pub fn Root() -> impl IntoElement {
    view().flex_1().font_family(INTER.family).child(app())
}
```

```tsx tabs
mount(() => (
  <View class="flex-1 font-body">
    <App />
  </View>
));
```

<a id="font-features"></a>

## Возможности шрифта

`fontVariant` включает OpenType-возможности шрифта: `"tabular-nums"`, `"proportional-nums"`, `"lining-nums"`, `"oldstyle-nums"` и `"small-caps"` (`.tabular_nums()`, `.small_caps()`, ... в Rust; [Text](./text.md#text-styles)). Шрифт должен их содержать; системные шрифты содержат.

<a id="related"></a>

## См. также

- [Text](./text.md): текстовые стили, размеры и системная настройка размера текста.
- [Tailwind](./tailwind.md#theme): ключи темы.
- [Изображения и ресурсы](./images-and-assets.md): как поставляются файлы приложения.
