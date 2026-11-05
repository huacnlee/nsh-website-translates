---
title: "Dialog"
description: "Компонент Dialog: модальная поверхность поверх всего остального для полноэкранных сценариев, выдвижных панелей и диалогов, оформление которых задаёт само приложение."
group: base
demo: el-dialog
source_hash: a054e14119bef924
---

# Dialog

Dialog показывает содержимое поверх остального приложения в собственном нативном оконном слое: это presented view controller на iOS и Mac Catalyst, Dialog на Android и слой поверх всего окна на десктопах и в вебе. Он используется для полноэкранных сценариев, листов (sheets) и диалогов. Системные жесты (смахивание листа вниз, кнопка «Назад» на Android, Escape) работают, и обрабатываются они нативно. В Rust его создают с помощью `nsh_base::dialog()`, в TSX — с помощью `<Dialog>` из `nsh/base`.

Диалог сам управляет своим поведением, а внешний вид оставляет приложению: его стили оформляют popup (представление, в котором лежат дочерние элементы), а в TSX `backdropClass` / `backdropStyle` добавляют подложку позади него.

```rust tabs
use nsh_base::{button, dialog};
use nsh_core::prelude::*;

/// A blue button with a white label.
fn primary(label: &'static str, on_press: impl Fn() + 'static) -> impl IntoElement {
    button()
        .on_press(on_press)
        .items_center()
        .rounded_lg()
        .bg(rgb(0x2563eb))
        .px_4()
        .py_3()
        .active(|s| s.opacity(0.7))
        .child(text(label).font_weight(FontWeight::SEMIBOLD).text_color(white()))
}

fn example() -> impl IntoElement {
    let open = signal(false);
    view()
        .flex_1()
        .justify_center()
        .p_6()
        .child(primary("Open", move || open.set(true)))
        .child(when(open, move || {
            dialog()
                .presentation(ModalPresentation::PageSheet)
                .on_cancel(move || open.set(false))
                .flex_1()
                .bg(white())
                .child(
                    view()
                        .flex_1()
                        .px_5()
                        .pt_safe_area_plus(px(20.0))
                        .pb_safe_area_plus(px(20.0))
                        .gap_3()
                        .child(text("A sheet").text_2xl().font_weight(FontWeight::BOLD))
                        .child(primary("Close", move || open.set(false))),
                )
        }))
}
```

```tsx tabs
import { signal, Text, View } from "nsh";
import { Button, Dialog } from "nsh/base";

function Example() {
  const open = signal(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Button onPress={() => open.set(true)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
        <Text class="font-semibold text-white">Open</Text>
      </Button>
      <Dialog open={open()} presentation="pageSheet" onOpenChange={(e) => open.set(e.open)} class="flex-1 bg-white">
        <View
          style={{
            flex: 1,
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: "calc(env(safe-area-inset-top) + 20px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700" }}>A sheet</Text>
          <Button onPress={() => open.set(false)} class="items-center rounded-lg bg-blue-600 px-4 py-3 active:opacity-70">
            <Text class="font-semibold text-white">Close</Text>
          </Button>
        </View>
      </Dialog>
    </View>
  );
}
```

В TSX диалог показывается, пока `open` не равно `false`, и закрывается, когда оно становится `false`. В Rust он презентуется, пока находится в представлении, и закрывается, когда покидает его, поэтому `when` удерживает его. В обоих случаях он передаёт своему содержимому отступы safe area диалога, которые читают переменные [`env(safe-area-inset-*)`](./safe-area.md) и `safeAreaInsets()` (`cx.insets()` в компоненте на Rust) внутри него. [`Button`](./button.md), также из `nsh/base`, — это цель нажатия, оформляемая приложением.

В `nsh_core::prelude` есть также более старая, устаревшая функция `dialog`: импортируйте `nsh_base::dialog` по имени, как показано выше, и явный импорт займёт её место. Для системного alert или action sheet используйте [`AlertDialog`](./alert-dialog.md).

## Props

| Проп | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `open` | в представлении, пока открыт (`when(open, ..)`) | `boolean` | `true` | Показывается, пока значение true. |
| `animation` | `.animation(ModalAnimation::Fade)` | `"slide" \| "fade" \| "none"` | `"slide"` | Как он появляется и исчезает. |
| `transitionShader` | `.transition_shader(TransitionShader::new(program))` | `{ source: string; uniforms?: Record<string, ShaderUniform>; duration?: number }` | нет | Появляется и исчезает через WGSL-шейдер вместо своего `animation`: `shade(uv)` читает то, что находится позади, как `sample_from`, а диалог — как `sample_to`, пока `nsh.progress` меняется от 0 до 1 за `duration` миллисекунд (по умолчанию 350), а при закрытии — от 1 обратно до 0. Если система просит уменьшить анимацию, используется собственный `animation`. См. [Shader](./shader.md). |
| `presentation` | `.presentation(ModalPresentation::PageSheet)` | `"fullScreen" \| "pageSheet" \| "formSheet"` | `"fullScreen"` | Его форма на iOS: `fullScreen` закрывает экран с прозрачным фоном; `pageSheet` и `formSheet` — системные листы, сквозь которые остаётся видно то, что позади (`formSheet` — более маленький лист по центру на больших экранах). |
| `closeOnEscape` | `.close_on_escape(..)` | `boolean` | `true` | Escape и кнопка «Назад» на Android закрывают его нативно. |
| `closeOnBackdropPress` | `.close_on_backdrop_press(..)` | `boolean` | `true` | Нажатие на подложку закрывает его. |
| `closeOnSwipe` | `.close_on_swipe(..)` | `boolean` | `true` | Смахивание листа вниз (iOS, браузеры на телефонах) закрывает его нативно. |
| `statusBar` | `.status_bar(..)` | `{ foreground?, hidden?, animated? }` | нет | iOS и Android: строка состояния, пока диалог открыт; имеет приоритет над настройкой страниц ([Status bar](../modules/nsh-base.md#status-bar)). |
| `onOpen` | `.on_open(..)` | `() => void` | | Он закончил появляться. |
| `onClose` | `.on_close(..)` | `() => void` | | Он исчез: его закрыл пользователь или убрало приложение. |
| `onCancel` | `.on_cancel(..)` | `() => void` | | Пользователь попытался его закрыть (Escape, «Назад», нажатие на подложку, смахивание вниз) — независимо от того, позволил ли флаг `closeOn*` закрыть его. |
| `onOpenChange` | `.on_cancel(..)` | `(e: { open: boolean; reason: "cancel" \| "backdropPress" \| "swipe" }) => void` | | Пользователь закрыл его: здесь синхронизируйте `open`. В Rust `on_cancel` убирает диалог из представления. |
| `class`, `style` | методы `Styled` | `string`, `StyleProp<ViewStyle>` | | Popup: представление, в котором лежат дочерние элементы. |
| `backdropClass`, `backdropStyle` | дочернее представление, заполняющее диалог | `string`, `StyleProp<ViewStyle>` | | Подложка, заполняющая диалог позади popup; присутствует, если задан любой из этих пропов. |
| `children` | `.child(..)` | `JSX.Element` | | Содержимое. |

| Ключ `ios` | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `supportedOrientations` | `.supported_orientations(..)` | `("portrait" \| "portrait-upside-down" \| "landscape" \| "landscape-left" \| "landscape-right")[]` | как у представляющего контроллера | Ориентации, которые допускает диалог. |

| Ключ `android` | Rust | Тип | По умолчанию | Описание |
|---|---|---|---|---|
| `statusBarTranslucent` | `.status_bar_translucent(..)` | `boolean` | `false` | Содержимое заходит под строку состояния; иначе оно начинается ниже неё. |

<a id="opening-and-closing"></a>

## Открытие и закрытие

Состояние диалога принадлежит приложению. Когда пользователь закрывает диалог (Escape, кнопка «Назад» на Android, нажатие на подложку, смахивание листа вниз), он закрывается нативно и сообщает об этом приложению, которое приводит своё состояние в соответствие: `onOpenChange({ open: false, reason })` в TSX, `on_cancel` в Rust. В TSX, пока `open` остаётся `true`, диалог остаётся закрытым и откроется снова, когда `open` перейдёт из `false` в `true`.

Каждый флаг `closeOn*` читается нативно в момент действия пользователя, поскольку главный поток никогда не ждёт кода приложения. Чтобы запросить подтверждение перед закрытием, установите флаги в `false`: тогда попытка закрыть вызовет `onCancel`, а приложение закроет диалог само (в TSX — установив `open` в `false`, в Rust — убрав его из представления):

```rust tabs
dialog()
    .presentation(ModalPresentation::PageSheet)
    .close_on_escape(false)
    .close_on_backdrop_press(false)
    .close_on_swipe(false)
    .on_cancel(move || ask_to_discard.set(true))
    .flex_1()
    .bg(white())
    .child(form())
```

```tsx tabs
<Dialog
  open={open()}
  presentation="pageSheet"
  closeOnEscape={false}
  closeOnBackdropPress={false}
  closeOnSwipe={false}
  onCancel={() => askToDiscard.set(true)}
  class="flex-1 bg-white"
>
  …
</Dialog>
```

`onCancel` вызывается при каждой попытке, независимо от того, позволяют ли флаги диалогу закрыться.

<a id="a-dialog-with-a-backdrop"></a>

## Диалог с подложкой

Диалог с презентацией `fullScreen` по умолчанию показывает то, что рисует приложение: здесь это затемнённая подложка и карточка по центру поверх неё. Нажатие на подложку закрывает его:

```rust tabs
when(confirm, move || {
    dialog()
        .animation(ModalAnimation::Fade)
        .on_cancel(move || confirm.set(false))
        .flex_1()
        .child(
            // The backdrop: a press on it closes the dialog.
            view()
                .absolute()
                .inset_0()
                .bg(rgba(0x00000066))
                .on_press(move || confirm.set(false)),
        )
        .child(
            view()
                .m(auto())
                .w_80()
                .gap_3()
                .rounded_2xl()
                .bg(white())
                .p_5()
                .child(text("Delete this item?").text_xl().font_weight(FontWeight::BOLD))
                .child(
                    button()
                        .on_press(remove)
                        .items_center()
                        .rounded_lg()
                        .bg(rgb(0xdc2626))
                        .px_4()
                        .py_3()
                        .active(|s| s.opacity(0.7))
                        .child(text("Delete").font_weight(FontWeight::SEMIBOLD).text_color(white())),
                ),
        )
})
```

```tsx tabs
<Dialog
  open={confirm()}
  animation="fade"
  onOpenChange={({ open }) => confirm.set(open)}
  backdropClass="bg-black/40"
  class="m-auto w-80 gap-3 rounded-2xl bg-white p-5"
>
  <Text style={{ fontSize: 20, fontWeight: "700" }}>Delete this item?</Text>
  <Button onPress={remove} class="items-center rounded-lg bg-red-600 px-4 py-3 active:opacity-70">
    <Text class="font-semibold text-white">Delete</Text>
  </Button>
</Dialog>
```

Для системного alert или action sheet используйте [`AlertDialog`](./alert-dialog.md) из `nsh/base`.

<a id="ref-methods"></a>

## Методы ref

Нет.

<a id="platform-notes"></a>

## Особенности платформ

- iOS и Mac Catalyst: `presentation` выбирает форму. `fullScreen` презентуется поверх всего экрана с прозрачным фоном; `pageSheet` и `formSheet` — системные листы с системным фоном, которые следуют за пальцем при смахивании вниз (`closeOnSwipe`).
- Android: диалог заполняет окно и показывает popup и подложку приложения. Кнопка «Назад» сначала обращается к самому верхнему диалогу, раньше стеков и слушателей `BackHandler`.
- Десктопы (macOS, Windows, Linux, GPUI) и веб: диалог — это прозрачный слой поверх всего окна, который показывает popup и подложку приложения. Escape считается попыткой закрыть.
- `supportedOrientations` относится к iOS, `statusBarTranslucent` — к Android. Содержимое диалога на Android начинается ниже строки состояния, если не задан `statusBarTranslucent`.
