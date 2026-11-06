---
title: "Веб-представление и видео"
description: "Отображение веб-страниц с помощью WebView и воспроизведение видео с помощью Video: источники, обмен сообщениями между страницей и приложением, навигация, управление воспроизведением, refs и возможности."
order: 45
group: ui
source_hash: f15d6d5032c41887
---

# Веб-представление и видео

Веб-представление и видеоплеер встраивают собственный веб-движок и медиаплеер платформы как обычные представления: `web_view` и `video` в Rust (`nsh_core::prelude`), `WebView` и `Video` из `nsh` в TSX. Поскольку NSH рендерит нативными представлениями, они располагаются в вашем лейауте как любой другой элемент: прокручиваются вместе с родителем, поддерживают скруглённые углы и обрезку, а другие представления могут перекрывать их без проблем со слоями.

| Компонент | iOS | Android | macOS | Linux | Windows |
|---|---|---|---|---|---|
| `WebView` | WKWebView | `android.webkit.WebView` | WKWebView | `WebKitWebView` из WebKitGTK 6.0 | WebView2 в дочернем окне |
| `Video` | AVPlayerLayer; AVPlayerViewController с `controls` | MediaPlayer на TextureView; MediaController с `controls` | AVPlayerLayer; AVPlayerView из AVKit с `controls` | медиапоток GTK (GStreamer) в `GtkPicture`; `GtkVideo` с `controls` | медиадвижок Media Foundation, кадры рисуются через Direct2D; собственная панель управления NSH с `controls` |

Фреймворки, на которых они построены (WebKit, AVFoundation), загружаются при первом использовании в приложении, поэтому приложения, которые никогда не показывают веб-страницу или видео, не платят за них при запуске.

В [macOS](./macos.md) у веб-представления нет собственного scroll view: при `scrollable={false}` колесо мыши и трекпад прокручивают окружающие его scroll view приложения, а не страницу, которая по-прежнему прокручивается с клавиатуры и собственными скриптами.

В [Linux](./linux.md) веб-представление — это страница WebKitGTK, нарисованная внутри своего представления: контент NSH поверх неё (диалог, sheet) перекрывает её, а родители обрезают. Разрешение `webview` действует и на навигацию фреймов (`iframe` хоста, которому доступ не выдан, остаётся пустым), а `scrollable: false` не даёт прокручиваться самой странице (элементы внутри неё по-прежнему прокручиваются). Приложениям нужен установленный WebKitGTK 6.0; среда выполнения, собранная без него, показывает нейтральную заглушку. Видео воспроизводятся в форматах, которые декодируют установленные плагины GStreamer; `rate` не поддерживается (воспроизведение идёт в 1×), а `onEnd` доступно только для видео без зацикливания.

В [Windows](./windows.md) веб-представление — это элемент WebView2 в дочернем окне, которое следует за своим представлением: оно обрезается родителями и скруглёнными углами, но контент NSH, нарисованный поверх него (диалог, sheet), остаётся под ним. Требуется WebView2 Runtime (входит в Windows 11; на Windows 10 устанавливается вместе с Edge), иначе показывается заглушка; `baseUrl` для HTML, `scrollable` и `allowsBackForwardNavigationGestures` не поддерживаются. Видео — обычный контент (обрезается, трансформируется и перекрывается как любое представление) и воспроизводится в форматах, которые декодируют установленные кодеки Media Foundation; `rate` работает, постера нет, а панель управления всегда показана, пока включено `controls`.

## WebView

```rust tabs
use nsh_core::prelude::*;

#[component]
pub fn App() -> impl IntoElement {
    web_view("https://en.m.wikipedia.org/wiki/Swift_(programming_language)").flex_1()
}
```

```tsx tabs
import { mount, WebView } from "nsh";

function App() {
  return <WebView src="https://en.m.wikipedia.org/wiki/Swift_(programming_language)" style={{ flex: 1 }} />;
}

mount(App);
```

<a id="sources"></a>

### Источники

Веб-представление показывает что-то одно из `src` и `html`:

| Свойства | Показывает |
|---|---|
| `src="https://…"` | Веб-страницу. |
| `html="<!doctype html>…"` | HTML из строки, показывается вместо `src`. |
| `html` с `baseUrl="https://example.com/"` | HTML, относительные URL которого разрешаются относительно `baseUrl`. |

В Rust `web_view(url)` показывает страницу, а `web_view_html(html, base_url)` — HTML (`base_url` — `Option<&str>`); URL и HTML могут быть сигналом или замыканием, и тогда страница загружается заново, когда меняется то, что оно читает. Изменение `src` или `html` загружает новую страницу.

<a id="props"></a>

### Свойства

В Rust каждое свойство — метод билдера в snake case (`injected_java_script`, `java_script_enabled`, `scrollable`, `user_agent`; `injected_java_script_before_content` для `injectedJavaScriptBeforeContentLoaded`, `back_forward_gestures` для `allowsBackForwardNavigationGestures` в iOS), а каждое событие — метод `on_…` (`on_navigation_state_change`), слушатель которого получает `WebNavigation` (`url`, `title`, `loading`, `can_go_back`, `can_go_forward`) или, для `on_error` и `on_message`, `&str`.

| Свойство | Тип | По умолчанию | Описание |
|---|---|---|---|
| `src` | `string` | | URL страницы для показа. |
| `html` | `string` | | Встроенный HTML, показывается вместо `src`. |
| `baseUrl` | `string` | | База, относительно которой разрешаются относительные URL из `html`. |
| `injectedJavaScript` | `string` | | Выполняется после загрузки каждой страницы. |
| `injectedJavaScriptBeforeContentLoaded` | `string` | | Выполняется перед собственными скриптами каждой страницы. |
| `javaScriptEnabled` | `boolean` | `true` | Страницы выполняют скрипты. |
| `scrollable` | `boolean` | `true` | Пользователь может прокручивать страницу. |
| `userAgent` | `string` | | Строка user agent браузера. |
| `ios={{ allowsBackForwardNavigationGestures }}` | `boolean` | | iOS: свайп назад и вперёд по истории страниц. |
| `desktop={{ allowsBackForwardNavigationGestures }}` | `boolean` | | macOS: проведите двумя пальцами по трекпаду, чтобы вернуться назад или перейти вперёд; Windows: свайп на сенсорном экране; Linux: свайп на тачпаде. |

События:

| Событие | Данные | Когда |
|---|---|---|
| `onLoadStart` | `WebViewNavigation` | Страница начала загружаться. |
| `onLoad` | `WebViewNavigation` | Страница загрузилась. |
| `onError` | `{ message }` | Загрузка не удалась. |
| `onNavigationStateChange` | `WebViewNavigation` | Изменился URL, заголовок, состояние загрузки или история. |
| `onMessage` | `{ data: string }` | Страница отправила сообщение (см. ниже). |

`WebViewNavigation` — это `{ url, title, loading, canGoBack, canGoForward }`.

<a id="a-browser-with-back-and-forward"></a>

### Браузер с кнопками «назад» и «вперёд»

У ref веб-представления (`element_ref()`, привязанный к нему через `.element_ref(&web)` в Rust и `ref` в TSX) есть `reload`, `go_back` / `goBack`, `go_forward` / `goForward`, `stop_loading` / `stopLoading`, `inject_java_script` / `injectJavaScript(script)`, `post_message` / `postMessage(data)` и `send_input` / `sendInput(input)` ([ниже](#input-as-the-users-own)):

```rust tabs
use nsh_core::prelude::*;

pub fn browser() -> impl IntoElement {
    let web = element_ref();
    let nav = signal(None::<WebNavigation>);
    let button = move |label: &'static str, enabled: fn(&WebNavigation) -> bool, action: fn(&ElementRef)| {
        let enabled = move || nav.with(|n| n.as_ref().is_some_and(enabled));
        text(label)
            .p(px(12.0))
            .text_color(move || if enabled() { rgb(0x0969da) } else { rgb(0x8c959f) })
            .disabled(move || !enabled())
            .on_press(move || action(&web))
    };
    view()
        .flex_1()
        .pt(px(50.0))
        .child(
            text(move || {
                nav.with(|n| match n {
                    Some(n) if n.loading => "Loading…".to_owned(),
                    Some(n) => n.title.clone(),
                    None => String::new(),
                })
            })
            .number_of_lines(1)
            .px(px(12.0))
            .text_color(rgb(0x57606a)),
        )
        .child(
            web_view("https://developer.mozilla.org/")
                .element_ref(&web)
                .flex_1()
                .on_navigation_state_change(move |n: &WebNavigation| nav.set(Some(n.clone())))
                .back_forward_gestures(true),
        )
        .child(
            view()
                .flex_row()
                .justify_around()
                .child(button("Back", |n| n.can_go_back, |web| web.go_back()))
                .child(button("Forward", |n| n.can_go_forward, |web| web.go_forward()))
                .child(button("Reload", |_| true, |web| web.reload())),
        )
}
```

```tsx tabs
import { mount, signal, Text, View, WebView, type WebViewNavigation, type WebViewRef } from "nsh";

function Browser() {
  let web!: WebViewRef;
  const nav = signal<WebViewNavigation | null>(null);
  const button = (label: string, enabled: boolean, action: () => void) => (
    <Text onPress={enabled ? action : undefined} style={{ padding: 12, color: enabled ? "#0969da" : "#8c959f" }}>
      {label}
    </Text>
  );
  return (
    <View style={{ flex: 1, paddingTop: 50 }}>
      <Text style={{ numberOfLines: 1, paddingHorizontal: 12, color: "#57606a" }}>
        {nav()?.loading ? "Loading…" : nav()?.title ?? ""}
      </Text>
      <WebView
        ref={web}
        src="https://developer.mozilla.org/"
        style={{ flex: 1 }}
        onNavigationStateChange={(n) => nav.set(n)}
        ios={{ allowsBackForwardNavigationGestures: true }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        {button("Back", !!nav()?.canGoBack, () => web.goBack())}
        {button("Forward", !!nav()?.canGoForward, () => web.goForward())}
        {button("Reload", true, () => web.reload())}
      </View>
    </View>
  );
}

mount(Browser);
```

<a id="messaging-between-the-page-and-the-app"></a>

### Обмен сообщениями между страницей и приложением

Страницы общаются с приложением через `window.nsh.postMessage(string)`, и сообщение приходит как `on_message` (`onMessage`). Приложение общается со страницей через `post_message` ref (`postMessage(string)`), и сообщение приходит на страницу как событие `message` на `window`. Сообщения — строки; для структурированных данных отправляйте JSON.

```rust tabs
use nsh_core::prelude::*;

const PAGE: &str = r#"<!doctype html>
<html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, sans-serif; margin: 16px">
  <button onclick="window.nsh.postMessage(JSON.stringify({ type: 'hello', at: Date.now() }))">
    Post to the app
  </button>
  <p id="got">Nothing from the app yet.</p>
  <script>
    window.addEventListener("message", (e) => {
      document.getElementById("got").textContent = "The app says: " + e.data;
    });
  </script>
</body></html>"#;

#[component]
pub fn App() -> impl IntoElement {
    let web = element_ref();
    let last = signal(String::new());
    view()
        .flex_1()
        .pt(px(50.0))
        .gap(px(12.0))
        .child(
            web_view_html(PAGE, None)
                .element_ref(&web)
                .h(px(240.0))
                .on_message(move |data: &str| {
                    let message: serde_json::Value = serde_json::from_str(data).unwrap_or_default();
                    last.set(message["type"].as_str().unwrap_or_default().to_owned());
                }),
        )
        .child(
            text("Post to the page")
                .p(px(16.0))
                .text_color(rgb(0x0969da))
                .on_press(move || web.post_message("hi from nsh")),
        )
        .child(text(move || format!("Last message: {}", last.get())).px(px(16.0)))
}
```

```tsx tabs
import { mount, signal, Text, View, WebView, type WebViewRef } from "nsh";

const page = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, sans-serif; margin: 16px">
  <button onclick="window.nsh.postMessage(JSON.stringify({ type: 'hello', at: Date.now() }))">
    Post to the app
  </button>
  <p id="got">Nothing from the app yet.</p>
  <script>
    window.addEventListener("message", (e) => {
      document.getElementById("got").textContent = "The app says: " + e.data;
    });
  </script>
</body></html>`;

function App() {
  let web!: WebViewRef;
  const last = signal("");
  return (
    <View style={{ flex: 1, paddingTop: 50, gap: 12 }}>
      <WebView
        ref={web}
        html={page}
        style={{ height: 240 }}
        onMessage={(e) => last.set(JSON.parse(e.data).type)}
      />
      <Text onPress={() => web.postMessage("hi from nsh")} style={{ padding: 16, color: "#0969da" }}>
        Post to the page
      </Text>
      <Text style={{ paddingHorizontal: 16 }}>Last message: {last()}</Text>
    </View>
  );
}

mount(App);
```

`inject_java_script` ref (`injectJavaScript(script)`) выполняет код на текущей странице в любой момент; `injected_java_script` и `injected_java_script_before_content` (`injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded`) срабатывают при каждой загрузке страницы, до или после её собственных скриптов — здесь удобно устанавливать хуки:

```rust tabs
web_view("https://example.com")
    .injected_java_script_before_content("window.isNativeApp = true;")
    .injected_java_script("window.nsh.postMessage(document.title);")
    .on_message(|title: &str| log::info!("title {title}"))
```

```tsx tabs
<WebView
  src="https://example.com"
  injectedJavaScriptBeforeContentLoaded={`window.isNativeApp = true;`}
  injectedJavaScript={`window.nsh.postMessage(document.title);`}
  onMessage={(e) => console.log("title", e.data)}
/>
```

<a id="input-as-the-users-own"></a>

### Ввод как от самого пользователя

`injectJavaScript` может создавать только синтетические события, которые страница считает недоверенными (`event.isTrusted` — `false`), а некоторые виджеты их игнорируют. `send_input` ref (`sendInput(input)`) передаёт странице ввод так, как это сделали бы руки самого пользователя, поэтому его события доверенные:

- `{ type: "click", x, y }` кликает в точку viewport в CSS-пикселях (то, что сообщает `getBoundingClientRect()`).
- `{ type: "text", text }` печатает текст в элемент, у которого фокус страницы, по одной клавише: каждый символ — на соответствующей клавише раскладки US, перевод строки — как Enter, а то, что нельзя набрать клавишей US (`é`, CJK, эмодзи), — без клавиши (`code` — `"Unidentified"`).
- `{ type: "key", key }` нажимает `Enter`, `Tab`, `Escape` или `Backspace`.

```rust tabs
use nsh_core::{WebInput, WebKey, prelude::*};
use std::time::Duration;

fn search(web: &ElementRef) {
    web.send_input(WebInput::Click { x: px(120.0), y: px(40.0) });
    let web = *web;
    set_timeout(Duration::from_millis(50), move || {
        web.send_input(WebInput::Text("espresso".into()));
        web.send_input(WebInput::Key(WebKey::Enter));
    });
}
```

```tsx tabs
web.sendInput({ type: "click", x: 120, y: 40 });
setTimeout(() => {
  web.sendInput({ type: "text", text: "espresso" });
  web.sendInput({ type: "key", key: "Enter" });
}, 50);
```

В Rust это `WebInput::Click { x, y }`, `WebInput::Text(text)` и `WebInput::Key(WebKey::Enter)`.

Доверенный ввод несёт пользовательскую активацию (он может открывать окна, писать в буфер обмена, открывать системную файловую панель или нажимать кнопку подтверждения на странице), поэтому это отдельное разрешение: приложению нужен `"webview": { "input": true }` в `capabilities` из `nsh.json` ([`webview`](./sandbox-and-capabilities.md#webview)), даже если приложение не объявляет никаких разрешений, иначе ядро отбрасывает вызов.

Как и клик, `sendInput` забирает фокус клавиатуры для веб-представления у собственного `Input` приложения. Страница обрабатывает ввод в своём темпе: события клика могут быть ещё в пути, когда начинается следующий вызов, поэтому дайте клику «осесть» (примерно кадр), прежде чем печатать после него. macOS доставляет ввод; остальные платформы пока его игнорируют.

Прежде чем предлагать что-либо, что от этого зависит, спросите, работает ли это здесь: `web_input_available()` (`WebView.inputAvailable()`) разрешается в `true` только там, где платформа доставляет ввод и у приложения есть `webview.input`, поэтому на платформах, игнорирующих вызов, и в приложениях без этого разрешения это `false`.

```rust tabs
use nsh_core::prelude::*;

let input = signal(false);
spawn(async move { input.set(web_input_available().await) });
```

```tsx tabs
import { signal, WebView } from "nsh";

const input = signal(false);
WebView.inputAvailable().then((available) => input.set(available));
```

<a id="which-sites-a-web-view-may-show"></a>

### Какие сайты может показывать веб-представление

Если ваш `nsh.json` объявляет `"capabilities"`, веб-представление может показывать и открывать только хосты, перечисленные в `webview`:

```json
{
  "capabilities": {
    "webview": { "hosts": ["example.com", "*.example.com"] }
  }
}
```

Проверка охватывает `src` веб-представления и каждую навигацию верхнего уровня, которую совершает страница (ссылки, редиректы, изменения `location`); решение принимается нативно, когда платформа спрашивает, можно ли продолжить навигацию. Собственные подресурсы страницы (скрипты, изображения, фреймы) — забота веб-контента и не проверяются. `*.example.com` соответствует только поддоменам; для основного домена перечислите также `example.com`. Приложение без ключа `"capabilities"` может показывать любую страницу. См. [Песочница и разрешения](./sandbox-and-capabilities.md).

<a id="video"></a>

## Видео

```rust tabs
use nsh_core::prelude::*;

pub fn player() -> impl IntoElement {
    let player = element_ref();
    let paused = signal(true);
    let time = signal(String::new());
    let link = |label: &'static str| text(label).text_color(rgb(0x0969da));
    view()
        .flex_1()
        .justify_center()
        .p(px(16.0))
        .gap(px(12.0))
        .child(
            video("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4")
                .element_ref(&player)
                .paused(paused)
                .repeat(true)
                .object_fit(ResizeMode::Contain)
                .h(px(220.0))
                .rounded(px(12.0))
                .overflow_hidden()
                .bg(rgb(0x000000))
                .on_progress(move |e: &VideoProgress| {
                    time.set(format!("{:.1} / {:.1} s", e.current_time, e.duration))
                })
                .on_end(move || paused.set(true)),
        )
        .child(
            view()
                .flex_row()
                .gap(px(16.0))
                .items_center()
                .child(
                    text(move || if paused.get() { "Play" } else { "Pause" })
                        .text_color(rgb(0x0969da))
                        .font_weight(FontWeight::SEMIBOLD)
                        .on_press(move || paused.update(|p| *p = !*p)),
                )
                .child(link("Restart").on_press(move || player.seek(0.0)))
                .child(text(move || time.get()).text_color(rgb(0x57606a))),
        )
}
```

```tsx tabs
import { mount, signal, Text, Video, type VideoRef, View } from "nsh";

function Player() {
  let video!: VideoRef;
  const paused = signal(true);
  const time = signal("");
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 12 }}>
      <Video
        ref={video}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        paused={paused()}
        repeat
        style={{ height: 220, borderRadius: 12, overflow: "hidden", backgroundColor: "#000000" }}
        onProgress={(e) => time.set(`${e.currentTime.toFixed(1)} / ${e.duration.toFixed(1)} s`)}
        onEnd={() => paused.set(true)}
      />
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <Text onPress={() => paused.set(!paused())} style={{ color: "#0969da", fontWeight: "600" }}>
          {paused() ? "Play" : "Pause"}
        </Text>
        <Text onPress={() => video.seek(0)} style={{ color: "#0969da" }}>
          Restart
        </Text>
        <Text style={{ color: "#57606a" }}>{time()}</Text>
      </View>
    </View>
  );
}

mount(Player);
```

Воспроизведением управляют свойства: задавайте `paused`, `muted`, `volume` и `rate` из сигналов, и плеер следует за ними. У ref есть `seek(seconds)`.

В Rust `video(url)` создаёт плеер (URL — значение, сигнал или замыкание), а каждое свойство — метод билдера в snake case (`paused`, `repeat(true)`, `object_fit(ResizeMode::Contain)` (стиль `objectFit`), `progress_interval` для `progressUpdateInterval`); `on_load` получает `VideoInfo` (`duration`, `size`), `on_progress` — `VideoProgress` (`current_time`, `duration`), а `on_buffer` — `bool`.

| Свойство | Тип | По умолчанию | Описание |
|---|---|---|---|
| `src` | `string` | | URL видео. |
| `paused` | `boolean` | `false` | Воспроизведение приостановлено. |
| `muted` | `boolean` | `false` | Без звука. |
| `volume` | `number` | `1` | 0..1. |
| `rate` | `number` | `1` | Скорость воспроизведения. |
| `repeat` | `boolean` | `false` | В конце воспроизводится заново с начала. |
| `objectFit` (стиль), классы `object-*` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | `"contain"` | Как изображение вписывается в представление, как `object-fit` в CSS (`class="object-cover"`). |
| `controls` | `boolean` | `false` | Элементы управления воспроизведением платформы. |
| `progressUpdateInterval` | `number` | `250` | Миллисекунды между событиями `onProgress`. |

| Событие | Данные | Когда |
|---|---|---|
| `onLoadStart` | | Загрузка началась. |
| `onLoad` | `{ duration, size }` | Видео готово: его длительность в секундах и размер. |
| `onProgress` | `{ currentTime, duration }` | Во время воспроизведения, каждые `progressUpdateInterval` мс. |
| `onBuffer` | `{ isBuffering }` | Воспроизведение остановилось в ожидании данных или возобновилось. |
| `onEnd` | | Воспроизведение достигло конца. |
| `onError` | `{ message }` | Ошибка загрузки или воспроизведения. |

С `controls` платформа рисует собственные кнопку воспроизведения, ползунок перемотки и кнопку полноэкранного режима. Без него рисуйте свои представлениями поверх видео или под ним; поскольку видео — нативное представление в вашем лейауте, оверлеи работают естественно:

```rust tabs
view()
    .h(px(220.0))
    .child(video(url).paused(paused).flex_1())
    .child(
        view()
            .absolute()
            .inset_0()
            .items_center()
            .justify_center()
            .on_press(move || paused.update(|p| *p = !*p))
            .child(when(move || paused.get(), || {
                text("▶").text_size(px(48.0)).text_color(rgb(0xffffff))
            })),
    )
```

```tsx tabs
<View style={{ height: 220 }}>
  <Video src={url} paused={paused()} style={{ flex: 1 }} />
  <View
    onPress={() => paused.set(!paused())}
    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
  >
    <If when={paused()}>
      <Text style={{ fontSize: 48, color: "#ffffff" }}>▶</Text>
    </If>
  </View>
</View>
```

Источники видео — сетевые запросы: при объявленных разрешениях хост видео должен быть разрешён в `network` в `nsh.json`, как для `fetch` и удалённых изображений. Отклонённый источник ничего не показывает, а отказ один раз записывается в лог с ключом, который нужно добавить.

<a id="related"></a>

## См. также

- [`WebView`](../elements/web-view.md) и [`Video`](../elements/video.md): справочники по элементам.
- [Песочница и разрешения](./sandbox-and-capabilities.md): выдача разрешений `webview` и `network`.
- [Нативные компоненты](./native-components.md): встраивание других нативных представлений, которые предоставляет ваше хост-приложение.
