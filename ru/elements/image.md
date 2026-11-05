---
title: "Image"
description: "Элемент, который отображает встроенное в приложение или удалённое изображение и поддерживает плейсхолдеры, размытие, плавное появление, тонирование и события загрузки."
order: 30
group: primitives
demo: el-image
source_hash: df0573015c43b823
---

# Image

`Image` показывает изображение из ресурсов приложения или по URL. Изображения загружаются и декодируются вне главного потока, уменьшаются до размера, в котором их показывает представление, и кэшируются в памяти. Анимированные GIF, WebP и APNG воспроизводятся. В Rust его создаёт `image(src)`, в TSX — `<Image>` из `nsh`.

```rust tabs
use nsh_core::prelude::*;

// assets/logo.png in the app's crate.
const LOGO: ImageAsset = asset!("logo.png");

view()
    .flex_row()
    .gap_3()
    .child(image(LOGO))
    .child(
        image("https://example.com/avatar.jpg")
            .placeholder(LOGO)
            .object_fit(ResizeMode::Cover)
            .size(px(64.0))
            .rounded_full(),
    )
```

```tsx tabs
import { Image, View } from "nsh";
import logo from "./assets/logo.png";

<View style={{ flexDirection: "row", gap: 12 }}>
  <Image src={logo} />
  <Image
    src="https://example.com/avatar.jpg"
    placeholder={logo}
    style={{ width: 64, height: 64, borderRadius: 32 }}
  />
</View>;
```

Размер ресурса известен заранее: если не заданы ни ширина, ни высота, изображение берёт его, а если задана одна из сторон, вторая вычисляется по соотношению сторон ресурса. Размер URL становится известен только после загрузки, поэтому удалённым изображениям задавайте и ширину, и высоту (или соотношение сторон и одну из них).

<a id="sources"></a>

## Источники

Источник (`src` и `placeholder`; `image(..)` и `.placeholder(..)` в Rust) принимает:

| Значение | Пример | Описание |
|---|---|---|
| Ресурс | Rust `asset!("logo.png")`, TSX `import logo from "./logo.png"` | `ImageAsset` `{ url, size, scales? }` с размером в пунктах: файл `@2x` считается как половина его пикселей. Если `logo@2x.png` / `logo@3x.png` лежат рядом с `logo.png`, загружается вариант для плотности пикселей экрана ([плотности пикселей](../docs/images-and-assets.md#pixel-densities)). Можно импортировать `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` и `.heic`, а также `.svg` с размером по `width` и `height` или `viewBox` ([SVG-изображения](../docs/images-and-assets.md#svg-images)). |
| URL | `"https://example.com/a.jpg"` | Загружается и кэшируется. Загрузки одного и того же URL разделяются между представлениями. |
| Путь к ресурсу | `"asset:/images/a.png"` | Файл из ресурсов приложения. |
| URI `data:` | `"data:image/png;base64,iVBOR…"` | Байты в самом URI в base64 или с процентным кодированием (`data:image/svg+xml,%3Csvg…`). |
| URL `blob:` | `URL.createObjectURL(blob)` | Байты `Blob` или `File` (TSX). Изображение сохраняет их: после отзыва URL оно по-прежнему показывается целиком. |

Изображение из байтов, которые уже есть у приложения, показывается без запроса. Чат показывает выбранное фото из его blob, пока оно загружается, а затем переключает `src` на URL фото:

```rust tabs
// Bytes in a `data:` URI (an image the app made or received inline).
image(format!("data:image/png;base64,{encoded}")).size(px(64.0))
```

```tsx tabs
import { Image, signal } from "nsh";

const preview = URL.createObjectURL(photo); // the picked `File`
const src = signal(preview);
upload(photo).then((url) => {
  src.set(url);
  URL.revokeObjectURL(preview);
});

<Image src={src()} style={{ width: 240, height: 180 }} />;
```

Одинаковые байты — это одно изображение: одна и та же картинка в виде URI `data:` и в виде blob декодируется один раз и использует общий кэш.

Во время разработки ресурсы раздаёт dev-сервер; `nsh build` и `nsh package` копируют их в приложение (крейт Rust поставляет свой каталог `assets/` вместе с `registry.assets(assets!())`). См. [изображения и ресурсы](../docs/images-and-assets.md).

> [!NOTE]
> Если приложение объявляет [capabilities](../docs/sandbox-and-capabilities.md), удалённые изображения загружаются с перечисленных в них хостов; изображение с любого другого хоста не запрашивается и завершается ошибкой `onError`, у которой `code` равен `"ERR_ACCESS_DENIED"`. URI `asset:`, URI `data:` и URL `blob:` загружаются всегда.

<a id="props"></a>

## Свойства

Помимо [общих свойств](./index.md#common-props) (где `style` имеет тип `ImageStyle`):

| Свойство | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `src` | `image(src)` | `string \| ImageAsset` | | Изображение. |
| `placeholder` | `.placeholder(src)` | `string \| ImageAsset` | | Показывается, пока не загрузится `src`; лучше всего подходит локальный ресурс. |
| `blurRadius` | `.blur_radius(px(..))` | `number` | | Размывает изображение с этим радиусом в пунктах (применяется один раз при декодировании, вне главного потока). |
| `fadeDuration` | `.fade_duration(ms)` | `number` | iOS `0`, Android `300` | Сколько миллисекунд загруженное изображение плавно появляется. |
| `tintColor` (стиль) | `.tint_color(..)` | `ColorValue` | | Перекрашивает шаблонное изображение (значок, нарисованный одним цветом). |
| `objectFit` (стиль) | `.object_fit(ResizeMode::Contain)` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"cover"` | Как изображение вписывается в свой блок, как CSS `object-fit` (классы `object-*`): `"cover"` заполняет блок и обрезает, `"contain"` вписывает внутрь, `"fill"` растягивает, `"none"` показывает в натуральном размере, `"scale-down"` — то же, но уменьшает, если изображение больше блока. |
| `objectPosition` (стиль) | `.object_position(..)`, `.object_top()`, ... | `string` | `"center"` | Где изображение располагается в своём блоке после того, как `objectFit` задал размер, как CSS `object-position` (`"top"`, `"25% 75%"`, `"right 10px bottom 20%"`); заполняющее изображение обрезается вокруг этой точки. |
| `onLoadStart` | `.on_load_start(..)` | `() => void` | | Загрузка началась. |
| `onProgress` | `.on_progress(..)` | `(e: { loaded: number; total: number }) => void` | | Ход загрузки в байтах (`total` равно 0, если неизвестно), не чаще чем раз в 100 мс. |
| `onLoad` | `.on_load(..)` | `(e: { size: PixelSize }) => void` | | Загружено; размер исходного изображения в пикселях (не декодированного и уменьшенного; размер SVG — в пунктах, [в вебе так, как его измеряет браузер](../docs/images-and-assets.md#svg-images)); для изображения с вариантами — размер загруженного варианта. |
| `onError` | `.on_error(..)` | `(e: { message: string; code?: string }) => void` | | Загрузка не удалась; `code` равен `"ERR_ACCESS_DENIED"` для URL, не разрешённого capabilities приложения. |
| `onLoadEnd` | `.on_load_end(..)` | `() => void` | | После `onLoad` или `onError`. |

`ImageStyle` добавляет к стилям представления `tintColor`, который перекрашивает шаблонное изображение (значок, нарисованный одним цветом), и `objectPosition`, который размещает изображение в его блоке ([Позиция изображения](../docs/images-and-assets.md#image-position)).

```rust tabs
image(ICON).size(px(24.0)).tint_color(rgb(0x0969da))
```

```tsx tabs
<Image src={icon} style={{ width: 24, height: 24, tintColor: "#0969da" }} />
```

<a id="events"></a>

## События

| Событие | Rust | Данные | Когда |
|---|---|---|---|
| `onLoadStart` | `.on_load_start` | нет | Загрузка началась. |
| `onProgress` | `.on_progress` | `{ loaded, total }` (`ImageProgress`) | Пришли байты (не чаще чем раз в 100 мс). |
| `onLoad` | `.on_load` | `{ size }` (`Size<DevicePixels>`) | Изображение показано; размер исходного изображения в пикселях (для SVG — в пунктах, [в вебе так, как его измеряет браузер](../docs/images-and-assets.md#svg-images)). |
| `onError` | `.on_error` | `{ message, code? }` (`&str`, сообщение) | Загрузка или декодирование не удались, либо хост не входит в capabilities приложения (`code` `"ERR_ACCESS_DENIED"`). |
| `onLoadEnd` | `.on_load_end` | нет | После `onLoad` или `onError`. |

```rust tabs
let state = signal(SharedString::from("loading"));

image(url)
    .w_full()
    .aspect_ratio(16.0 / 9.0)
    .on_load(move |size: &Size<DevicePixels>| state.set(format!("{}×{}", size.width.0, size.height.0).into()))
    .on_error(move |message: &str| state.set(message.to_string().into()))
```

```tsx tabs
const state = signal("loading");
<Image
  src={url}
  style={{ width: "100%", aspectRatio: 16 / 9 }}
  onLoad={({ size }) => state.set(`${size.width}×${size.height} px`)}
  onError={(e) => state.set(e.message)}
/>;
```

Изображение с [вариантами для разных плотностей пикселей](../docs/images-and-assets.md#pixel-densities) загружает один из своих файлов, и `onLoad` сообщает размер этого файла в пикселях: 192×192 для `logo@3x.png` на экране 3× при `logo.png` размером 64×64 пункта. Когда плотность пикселей меняется и изображение загружает другой вариант, оно сообщает и об этой загрузке: `onLoadStart`, затем `onLoad` с размером нового файла (или `onError`), затем `onLoadEnd`.

Чтобы узнать размер изображения или загрузить его до показа, в TSX вызывают `Image.getSize(src)` и `Image.prefetch(src)` (их несёт тот же `Image`, что отрисовывает элемент; см. [Image API](../modules/nsh-image.md)), а в Rust — `image_size(src)` и `prefetch_image(src)`, с ожиданием в задаче. Для импортированного изображения с вариантами `Image.getSize` и `Image.prefetch` загружают вариант, который показывает этот экран, а `getSize` возвращает размер импортированного файла (64×64 для `logo.png`).

<a id="ref-methods"></a>

## Методы ref

Собственных методов нет.

<a id="platform-notes"></a>

## Особенности платформ

- Ключ кэша включает размер декодирования и радиус размытия: один и тот же URL, показанный в двух размерах, декодируется дважды, а загружается один раз.
- iOS воспроизводит анимированные изображения как покадровую анимацию (до 600 кадров); анимированное изображение с наложенным цветом показывает только первый кадр.
- Android воспроизводит анимированные изображения начиная с API 28 (`AnimatedImageDrawable`), без кэширования и без размытия.
- На Android границы рисуются поверх изображения, как и на iOS.
