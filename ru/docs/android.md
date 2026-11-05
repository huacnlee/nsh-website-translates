---
title: "Android"
description: "Запускайте приложения NSH на Rust и TSX на Android с использованием Android views, на эмуляторе или устройстве, упаковывайте их в .apk и встраивайте в существующее приложение Android с помощью nsh.aar и NshView."
order: 12
group: platforms
source_hash: 0e8dcab076c0aa59
---

# Android

Приложения NSH работают на Android с обычными Android views и `StaticLayout` текстом, начиная с Android 9 (API 28), на `arm64-v8a`,
`armeabi-v7a` и `x86_64`. Целые приложения, написанные на Rust и на TSX, запускаются и упаковываются так же, как на других платформах, а существующее приложение
может встроить модули в `NshView` и загружать скачанные подписанные пакеты с лимитами и возможностями (capabilities), которые оно задаёт. На Android `os()` — это `Os::Android` (`platform.os` — это `"android"` в TSX), и применяются props `android={{…}}` из TSX.

<a id="requirements"></a>

## Требования

- **Android SDK** (с `platforms;android-35`, build tools и `platform-tools`) и **JDK** на macOS, Windows
  или Linux. См. [Установка](./installation.md#android).
- Эмулятор или устройство, подключённое по `adb`.

<a id="running-an-app"></a>

## Запуск приложения

Rust-приложение запускается из своего каталога, а для TSX-приложения указывается точка входа:

```sh
nsh run --target android               # a Rust app
nsh run App.tsx --target android       # a TSX app
```

Сначала запустите эмулятор или подключите устройство (`adb devices` выводит их список; NSH использует первое). Для Rust-приложения `nsh`
собирает `libnsh.so` приложения вместе с вашим crate, устанавливает APK и запускает его; при изменении Rust-кода crate
сборка и установка выполняются заново. Для TSX-приложения устанавливается APK dev-хоста (пересобирается только при изменении рантайма) и
пробрасывается порт dev-сервера через `adb reverse`, поэтому всё работает по USB без общей сети; приложение обновляется по мере
сохранения файлов, а логи выводятся в терминал.

<a id="packaging"></a>

## Упаковка

```sh
nsh package --target android --run             # a Rust app: .nsh/out/<Name>.apk, installed and launched
nsh package App.tsx --target android --run     # a TSX app
```

APK Rust-приложения содержит собственный `libnsh.so`, собранный вместе с вашим crate, а его activity монтирует корневой компонент.

APK собирается с помощью build tools из SDK, без Gradle, и подписывается debug-ключом, если не передан release-
keystore. Подпись для релиза и иконки: [Упаковка](./packaging.md#android).

NSH собирает `libnsh.so` с выравниванием ELF по 16 КБ и упаковывает несжатые нативные библиотеки по границам ZIP в 16 КБ.
Release APK содержит `libnsh.so` без таблиц символов и отладочной информации. Полная библиотека лежит рядом с
рантаймом в `symbols/<abi>/libnsh.so` (для Rust-приложения — в `.nsh/rust/android-rust-release/symbols/<abi>/`): передайте её
`ndk-stack` или загрузите в Play Console как нативные отладочные символы, чтобы читать стеки нативных падений.

<a id="embedding-in-an-android-app"></a>

## Встраивание в Android-приложение

Существующее Android-приложение может показывать приложения NSH внутри собственного UI. Рантайм поставляется как Android-библиотека `nsh.aar`: вы
создаёте `com.longbridge.nsh.NshView` (`FrameLayout`), добавляете его в любой layout и загружаете в него TSX-приложение или подписанный пакет.
Приложение на Rust поставляется на Android как APK, который собирает `nsh package --target android`. Приложение NSH
отрисовывается обычными Android views рядом с вашими.

Каждый `NshView` — это один независимый движок со своей JS VM; глобальных синглтонов нет, поэтому несколько экземпляров могут работать
одновременно.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/host-app-light.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
<img class="diagram diagram-dark" src="/diagrams/host-app-dark.svg" alt="One host app with two nsh views (NshAppView on iOS, NshView on Android): each is its own engine with its own thread, VM, limits and capabilities; the host grants capabilities, sets limits and registers native components such as a map.">
</div>

<a id="get-the-library"></a>

## Получение библиотеки

Дистрибутив содержит оба варианта:

```text
dist/nsh/embed/android/nsh.aar       release: bundles and signed packages
dist/nsh/embed/android/nsh-dev.aar   also connects to a `nsh dev` server
```

AAR содержит Java-рантайм и `libnsh.so` для `arm64-v8a`, `armeabi-v7a` и `x86_64` вместе с их символами: Gradle-сборка
приложения удаляет их при упаковке и сохраняет символы для отчётов о падениях. AAR объявляет разрешение
`INTERNET` и требует **API 28** (Android 9) или новее. Он содержит свои правила R8 (`proguard.txt`), которые
минифицированная сборка применяет сама: нативная библиотека находит классы рантайма по имени, поэтому `com.longbridge.nsh`
остаётся без изменений.

Добавьте его в модуль приложения, например из папки `libs`:

```kotlin
// app/build.gradle.kts
dependencies {
    debugImplementation(files("libs/nsh-dev.aar"))
    releaseImplementation(files("libs/nsh.aar"))
}
```

<a id="ship-a-bundle-with-the-app"></a>

## Поставка бандла вместе с приложением

Соберите TSX-приложение в assets приложения:

```sh
nsh build App.tsx --release --out app/src/main/assets/nsh
```

Эта команда записывает `bundle.nshc` (байткод), `bundle.js` (исходный код), `bundle.js.map`, `capabilities.json` (когда `nsh.json`
объявляет [capabilities](./sandbox-and-capabilities.md)) и `assets/` (изображения и шрифты, которые импортирует приложение).

<a id="show-the-app"></a>

## Показ приложения

```java
import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import com.longbridge.nsh.NshView;

public final class MainActivity extends Activity {
    private NshView nsh;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        nsh = new NshView(this);
        nsh.setErrorListener(message -> Log.e("nsh", message));
        setContentView(nsh);
        nsh.loadAssetBundle("nsh");   // runs assets/nsh/bundle.nshc
    }

    @Override
    protected void onDestroy() {
        nsh.destroy();
        super.onDestroy();
    }
}
```

На Kotlin:

```kotlin
class MainActivity : Activity() {
    private lateinit var nsh: NshView

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        nsh = NshView(this)
        nsh.setErrorListener { message -> Log.e("nsh", message) }
        setContentView(nsh)
        nsh.loadAssetBundle("nsh")
    }

    override fun onDestroy() {
        nsh.destroy()
        super.onDestroy()
    }
}
```

`NshView` также можно поместить в любой layout, например под собственный тулбар:

```java
LinearLayout column = new LinearLayout(this);
column.setOrientation(LinearLayout.VERTICAL);
column.addView(toolbar);
column.addView(nsh, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
setContentView(column);
```

Размер view — это окно приложения: NSH раскладывает приложение по размеру view и заново при каждом его изменении. Повторная
загрузка заменяет запущенное приложение. Полный пример находится в
`examples/embed-android/src/com/longbridge/nsh/embeddemo/MainActivity.java`.

## `NshView`

| Метод | Описание |
|---|---|
| `NshView(Context context)`, `NshView(Context context, boolean trace)` | Создаёт пустой view. `trace` логирует время каждого коммита. |
| `setErrorListener(ErrorListener listener)` | Получает фатальные ошибки приложения (сбои загрузки, необработанные JS-исключения, VM, остановленная лимитом) в UI-потоке. Они всегда логируются. |
| `setLimits(int memoryMb, int stackKb, int loadMs, int callMs, int maxNodes)` | Лимиты VM для приложений, загружаемых следующими; 0 оставляет значение по умолчанию. |
| `setGrantedCapabilities(String json)` | Максимум, что могут делать приложения, загружаемые следующими, в виде JSON в форме `capabilities` из `nsh.json`; `null` выдаёт то, что объявляет каждое приложение. Возвращает `false` (и игнорируется) при недопустимом grant. |
| `setLocale(Locale locale)` | Язык и регион приложения вместо пользовательских: `Intl`, `locale()` и компоненты сразу следуют им, а приложения, загружаемые позже, стартуют с ними. `null` следует системным настройкам. |
| `setFontScale(float scale)` | Размер текста вместо системного размера шрифта (1 — по умолчанию): тексты и поля ввода заново раскладываются с ним, и `fontScale()` его читает — сразу и для приложений, загружаемых позже; длины сохраняют свой размер. `0` следует системным настройкам. |
| `setThemeOverrides(String json)` | Бренд хоста поверх [темы](./tailwind.md#theme-tokens) приложения: файл темы в формате `"theme"` из `nsh.json`. Его токены имеют приоритет над токенами приложения с теми же именами, в светлом и тёмном режимах, а остальные токены приложения сохраняются. Применяется сразу и к приложениям, загружаемым позже; `null` возвращает приложению его собственную тему. Выбрасывает `IllegalArgumentException` для файла, который не разбирается. |
| `setStorageDirectory(File dir)` | Где приложения, загружаемые следующими, хранят своё [хранилище](../modules/nsh.md#storage); `null`: `files/nsh/<app id>` в приватном каталоге приложения, по собственному id приложения. |
| `setCacheOptions(NshCacheOptions options)` | Где приложения, загружаемые следующими, хранят кэши, [скачиваемые ими изображения](./images-and-assets.md#kept-on-disk), и сколько хранит каждое. Создаётся с помощью `NshCacheOptions.builder()`: `location(File)`, `systemLocation()` (по умолчанию: `nsh` в каталоге кэша, каждое приложение в `<app id>`) или `noDiskCache()`; `imagesMaxMegabytes(int)` (по умолчанию 256) или `imagesOff()`. |
| `loadAssetBundle(String dir)` | Запускает `dir/bundle.nshc` из assets APK; assets приложения берутся из `dir/assets/`. Возвращает `false`, если файл не удаётся прочитать (об этом также сообщается слушателю ошибок). |
| `loadBundleFile(File file)` | Запускает файл `bundle.js`; assets берутся из `assets/` рядом с ним. Отклоняет файлы `.nshc`. |
| `runPackage(NshPackage pkg)` | Запускает проверенный подписанный пакет, заменяя запущенное приложение. Пакет запускается один раз. |
| `registerComponent(String name, NshComponent.Factory factory)` | Регистрирует [нативный компонент](./native-components.md). |
| `setParams(Object params)` | Параметры запуска приложений, загружаемых следующими (`Map` или `JSONObject`): приложение читает их при старте как `host.params` ([`host`](../modules/nsh.md#host)). Возвращает `false`, если они не являются JSON-объектом. |
| `send(String name, Object data)` | Отправляет событие приложению (`host.on(name, …)`); хранится, пока приложение не начнёт его слушать, либо для следующего приложения, пока никакое не запущено. Любой поток; возвращает `false` после `destroy()`. |
| `handle(String name, HostHandler handler)` | Обрабатывает вызовы приложения (`host.call`) и посты (`host.post`) для `name` в UI-потоке; `null` удаляет обработчик. Обработчик отвечает через свой `NshHostReply` один раз, из любого потока. |
| `connectDevServer(String url)` | Разработка: загружает с сервера `nsh dev` и перезагружает при каждом изменении. Возвращает `false` с release AAR. |
| `handleBack()` | Позволяет приложению обработать нажатие «назад» (закрывает диалоги, снимает страницы, запускает слушатели `BackHandler`); возвращает, обработало ли оно его. |
| `destroy()` | Останавливает приложение и вызывает `destroy()` у каждого из его нативных компонентов. Этот view больше нельзя использовать. |

> [!IMPORTANT]
> Скомпилированный байткод (`.nshc`) загружается только из собственных assets APK или из подписанного пакета. Файлы в хранилище можно подменить,
> а QuickJS не проверяет байткод, поэтому `loadBundleFile` принимает только JS-исходники. Код, который приложение скачивает, должен
> приходить как [подписанный пакет](./signed-packages.md).

`setLimits`, `setGrantedCapabilities`, `setStorageDirectory` и `setCacheOptions` применяются со следующей загрузки: вызывайте их до `loadAssetBundle` и подобных методов.

Каждое приложение хранит своё хранилище под собственным id без какой-либо настройки: подписанный пакет — под id, за который ручается сертификат его release-ключа, бандл — под `id` из его `nsh.json` (`nsh/app.json` среди assets APK, записывается `nsh package`). Вызовите `setStorageDirectory`, чтобы хранить данные приложения в месте по выбору хоста:

```java
nsh.setStorageDirectory(new File(getFilesDir(), "nsh/com.example.orders"));
nsh.loadAssetBundle("orders");
```

<a id="talking-to-the-app"></a>

## Общение с приложением

View и запущенное в нём приложение общаются через собственный канал ([`host`](../modules/nsh.md#host)): параметры
запуска, которые приложение читает при старте, события от хост-приложения, а также вызовы и посты от приложения, с JSON-данными (на этой стороне это maps,
lists, строки, числа и булевы значения). Для этого не нужны ни view в приложении, ни нативный компонент.

```java
// Before loading: what the app opens first (`host.params` in TSX).
nsh.setParams(Map.of("conversation", intent.getStringExtra("conversation")));
nsh.loadAssetBundle("nsh");

// The app's `await host.call("user.profile", { id })`, on the UI thread.
nsh.handle("user.profile", (data, reply) -> {
    Object id = ((Map<?, ?>) data).get("id");
    api.profile(id, profile -> reply.resolve(Map.of("id", id, "name", profile.name)),
            error -> reply.reject(error.getMessage()));
});

// The app's `host.post("analytics", …)`: no answer.
nsh.handle("analytics", (data, reply) -> analytics.log(data));

// Later: the app hears `host.on("conversation.open", …)`.
nsh.send("conversation.open", Map.of("id", tappedConversation));
```

На Kotlin:

```kotlin
nsh.handle("user.profile") { data, reply ->
    val id = (data as Map<*, *>)["id"]
    lifecycleScope.launch {
        runCatching { api.profile(id) }
            .onSuccess { reply.resolve(mapOf("id" to id, "name" to it.name)) }
            .onFailure { reply.reject(it.message ?: "failed") }
    }
}
```

Обработчики выполняются в UI-потоке; вызов ждёт ответа в приложении, не блокируя ни одну из сторон. Ответ, который
так и не был дан, приводит к сбою вызова после сборки мусора, а вызов с именем, у которого нет обработчика, завершается сбоем сразу. События с именами,
которые приложение ещё не слушает, хранятся, пока оно не начнёт их слушать, а события, отправленные, пока приложение не запущено (до `loadAssetBundle`,
во время перезагрузки), попадают в следующее.

<a id="theme-overrides"></a>

## Переопределение темы

Одно приложение, встроенное в несколько брендированных хост-приложений, принимает бренд каждого хоста: хост задаёт токены, которые меняет его бренд,
в виде файла темы в формате `"theme"` из `nsh.json` (`cssVars` из shadcn/ui, значения записываются как в CSS). Они имеют приоритет
над токенами приложения с теми же именами; остальные токены приложения сохраняются. Задайте значение токена для тёмного режима в `dark`
(набор только в `light` или `theme` означает этот цвет в обоих режимах):

```java
nsh.setThemeOverrides("{ \"cssVars\": {"
        + " \"theme\": { \"radius\": \"0.75rem\" },"
        + " \"light\": { \"primary\": \"#e11d48\", \"primary-foreground\": \"#ffffff\" },"
        + " \"dark\": { \"primary\": \"#fb7185\", \"primary-foreground\": \"#1c1917\" } } }");
nsh.loadAssetBundle("orders");
```

Вызывайте до или после загрузки: классы вроде `bg-primary` и `rounded-(--radius)` перестилизуются сразу, а каждое приложение,
загружаемое позже, стартует с переопределениями уже в первом кадре. `setThemeOverrides(null)` возвращает приложению его собственную тему.

<a id="links-the-app-opens"></a>

## Ссылки, которые открывает приложение

URL, которые открывает приложение ([`openUrl`](../modules/nsh.md#openurl), ссылки `TextView` с `links="open"`),
сначала попадают в `OpenUrlHandler` view, в UI-потоке: верните `true`, если хост-приложение обработало URL, например
передав его своему роутеру, и `false`, чтобы система открыла его через intent `ACTION_VIEW`. Без
обработчика система открывает каждый URL. URL доходят до него после того, как их разрешила возможность `openUrl` приложения.

```java
nsh.setOpenUrlHandler(url -> {
    Uri uri = Uri.parse(url);
    // The host app's own links open in the host app.
    if ("lb".equals(uri.getScheme()) || "longbridge.com".equals(uri.getHost())) {
        router.open(uri);
        return true;
    }
    return false;
});
```

<a id="limits"></a>

## Лимиты

```java
// 128 MB heap, default stack, 10 s to load, 1 s per call, 50 000 nodes
nsh.setLimits(128, 0, 10_000, 1_000, 50_000);
```

По умолчанию заданы heap 256 МБ, стек 4096 КБ, 10 с на загрузку, 2 с на вызов и 200 000 узлов. Что делает каждый лимит,
когда он достигнут: [Песочница и capabilities](./sandbox-and-capabilities.md).

## Capabilities

```java
nsh.setGrantedCapabilities(
    "{\"network\": {\"hosts\": [\"api.example.com\"]}, \"webview\": {\"hosts\": [\"help.example.com\"]}}");
nsh.loadAssetBundle("nsh");
```

Запрос должен быть разрешён и тем, что приложение объявляет в своём `nsh.json`, и grant. См.
[Песочница и capabilities](./sandbox-and-capabilities.md).

<a id="signed-packages"></a>

## Подписанные пакеты

Проверяйте скачанные пакеты вне UI-потока, а затем запускайте их в нём:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);   // the contents of root.pub from `nsh keygen`

executor.execute(() -> {
    try {
        NshPackage pkg = trust.openPackage(downloadedFile);
        runOnUiThread(() -> nsh.runPackage(pkg));
    } catch (NshPackage.RefusedException e) {
        Log.w("nsh", "refused: " + e.getMessage());   // the running app stays
    }
});
```

| API | Описание |
|---|---|
| `new NshTrust(File stateDir)` | Открывает или создаёт хранилище доверия. Его состояние (новейший список отзыва, наивысшая принятая сборка для каждого приложения) сохраняется там, и assets пакетов извлекаются в него. Не доверяет ни одному ключу до `addRoot`. Можно вызывать из любого потока; `close()` по завершении. |
| `boolean addRoot(String publicKey)` | Доверяет корневому открытому ключу (base64, содержимое файла `.pub`). `false` для недопустимого ключа. |
| `boolean updateRevocations(String json)` | Применяет список отзыва из `nsh revoke`, подписанный доверенным корнем и более новый, чем в хранилище. |
| `NshPackage openPackage(File file) throws NshPackage.RefusedException` | Проверяет, извлекает assets и принимает пакет (более старые сборки приложения после этого отклоняются). Медленно для больших пакетов: вызывайте вне UI-потока. |
| `NshPackage` | `appId`, `appName`, `version`, `build`; `close()`, если он не запускается. |

Как работают ключи, сертификаты и отзыв: [Подписанные пакеты](./signed-packages.md).

<a id="development"></a>

## Разработка

С `nsh-dev.aar`:

```java
if (BuildConfig.DEBUG) {
    nsh.connectDevServer("ws://127.0.0.1:8790/ws");
} else {
    nsh.loadAssetBundle("nsh");
}
```

Запустите `nsh dev App.tsx` на своём компьютере. Для эмулятора или USB-устройства пробросьте порт, чтобы собственный
`127.0.0.1` устройства достигал сервера:

```sh
adb reverse tcp:8790 tcp:8790
```

В остальных случаях используйте LAN-адрес, который выводит `nsh dev`. Assets приходят с dev-сервера по обычному HTTP, поэтому `nsh-dev.aar`
объявляет `android:usesCleartextTraffic="true"`, что применяется к приложению при слиянии манифестов (network security
config приложения может это переопределить). Release `nsh.aar` этого не делает.

<a id="activity-setup"></a>

## Настройка Activity

- **Кнопка «назад».** `NshView` сам получает нажатия «назад», пока приложение их хочет (открытый диалог, добавленная страница,
  слушатель `BackHandler`), а в остальных случаях оставляет их activity. С `android:enableOnBackInvokedCallback="true"`
  на Android 13 и новее он регистрирует `OnBackInvokedCallback`; в остальных случаях (Android 12 и старше или при выключенном
  атрибуте) он перехватывает клавишу «назад» раньше `onBackPressed` activity, то есть раньше `OnBackPressedDispatcher` из AndroidX
  и колбэков фрагментов. Пробрасывать ничего не нужно, ни в activity, ни во фрагменте. Хост, который уже передаёт
  нажатия в `handleBack()`, продолжает работать: нажатие попадает в приложение один раз.

  Для predictive back на Android 13+ задайте `android:enableOnBackInvokedCallback="true"` у `<application>`, как это делают
  упакованные приложения NSH.
- **Клавиатура.** `NshView` сам прокручивает поля ввода в фокусе так, чтобы клавиатура их не закрывала. Оставьте `android:windowSoftInputMode` не заданным
  или используйте `adjustResize`; при `adjustPan` система вместо этого сдвигает всё окно.
- **Safe area.** View сообщает в виде insets только те части системных панелей и клавиатуры, которые его перекрывают, поэтому
  `NshView` под тулбаром не получает верхнего inset. Для контента от края до края рисуйте под системными панелями и позвольте приложению использовать
  padding `env(safe-area-inset-*)` / `safeAreaInsets()` (`safe_area()` в Rust).
- **Изменения конфигурации.** Activity, пересоздаваемая при повороте или смене темы, уничтожает view, и приложение запускается
  заново с нуля. Чтобы оно продолжало работать, объявите изменения, которые activity обрабатывает сама; упакованные приложения NSH используют:

  ```xml
  <activity android:name=".MainActivity"
      android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboard|keyboardHidden|navigation|uiMode|density|fontScale|locale|layoutDirection"
      android:windowSoftInputMode="adjustResize" />
  ```

  `NshView` сам следует новому размеру, цветовой схеме, масштабу шрифта, плотности экрана и направлению layout; приложение сохраняет
  своё состояние. Позиции прокрутки восстанавливаются в логических координатах в пределах новых границ контента. Sticky views и
  открытые модальные окна тоже следуют новой плотности.
- **Жизненный цикл.** Вызовите `destroy()`, когда хостящая activity или фрагмент уничтожается.
<a id="see-also"></a>

## См. также

- [Сборка с Rust](./rust.md)
- [Встраивание в приложения iOS](./ios.md)
- [Нативные компоненты](./native-components.md)
- [Подписанные пакеты](./signed-packages.md)
- [Упаковка](./packaging.md): автономный APK без написания кода на Java
