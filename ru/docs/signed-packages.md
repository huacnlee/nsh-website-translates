---
title: "Подписанные пакеты"
description: "Доставка кода приложения, который хост-приложения загружают и проверяют: ключи, сертификаты, nsh publish, повторная подпись, проверка, отзыв и защита от отката версий."
order: 20
group: delivery
source_hash: 49e29fdbf6c32367
---

# Подписанные пакеты

Подписанный пакет (`.nshpkg`) позволяет хост-приложению запускать код NSH, который не входил в его поставку: обновление собственных экранов NSH или стороннее мини-приложение. `nsh publish` собирает приложение и подписывает его; прежде чем что-либо запустится, хост-приложение проверяет подпись, цепочку сертификатов, отзывы и номер сборки.

Пакет содержит TSX. Rust-код хост-приложения (приложение, написанное на Rust, компоненты, модули и классы его крейтов) является частью самого хост-приложения и поставляется вместе с ним, а TSX пакета импортирует его по спецификаторам, как и любой другой TSX ([Building with Rust](./rust.md#extending-a-rust-app-with-tsx)). Так Rust-приложение сохраняет ядро на Rust, а экраны, которые часто меняются, доставляет как подписанные пакеты.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/signed-packages-light.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
<img class="diagram diagram-dark" src="/diagrams/signed-packages-dark.svg" alt="Signed packages: an offline root key certifies a release key for app ids; nsh publish signs the package with it; on the device, NshTrust trusts only the root and the newest revocation list, checks the certificate, revocations, signature, app id, file hashes and build number, then runs the module or refuses it.">
</div>

> [!NOTE]
> NSH проверяет и запускает пакеты, но не доставляет их. Откуда берутся пакеты (ваш сервер обновлений, CDN, магазин мини-приложений) и когда приложение их загружает, решает хост-приложение.

<a id="why-packages-are-signed"></a>

## Зачем подписывать пакеты

JS, который запускает хост-приложение, может добраться до всего, что приложение [разрешило](./sandbox-and-capabilities.md), поэтому он должен поступать от того, кому приложение доверяет. Есть и вторая причина: NSH поставляет приложения в виде байткода QuickJS, который загружается быстрее исходного кода, но QuickJS не проверяет байткод, а специально созданный байткод может повредить память. Поэтому NSH загружает байткод только из собственных ресурсов приложения (подписанных системой), с dev-сервера, к которому подключился разработчик, и из проверенных пакетов. Всё остальное должно быть исходным кодом JS.

<a id="keys-two-levels"></a>

## Ключи: два уровня

- **Корневой ключ** хранится офлайн. Хост-приложения доверяют его открытому ключу; корневых ключей может быть несколько, так выполняется ротация корня.
- Корневой ключ **сертифицирует релизные ключи**: сертификат называет релизный ключ, идентификаторы приложений, которые он может подписывать, и временное окно.
- **Пакеты подписываются релизным ключом** и содержат его сертификат. Поэтому релизные ключи можно ротировать (или отзывать) без обновления хост-приложений, которым известен только корневой ключ.

У каждого ключа есть идентификатор, полученный из его открытого ключа (первые 8 байт его SHA-256 в шестнадцатеричном виде); его выводит каждая команда.

<a id="create-the-keys"></a>

### Создание ключей

```sh
nsh keygen keys/root
nsh keygen keys/release
```

```text
key 4e0b637f5e10f6a6: keys/root.secret (keep it secret), keys/root.pub
key 3428d7136788c9ee: keys/release.secret (keep it secret), keys/release.pub
```

Каждый ключ состоит из двух файлов: `<name>.secret` (доступен для чтения только владельцу) и `<name>.pub`, оба содержат одну строку в base64. `nsh keygen` никогда не перезаписывает существующий ключ.

> [!CAUTION]
> Храните `root.secret` офлайн, например на зашифрованном диске в сейфе. Тот, у кого он есть, может сертифицировать ключи, которые примут все хост-приложения, доверяющие этому корню. Релизные ключи должны находиться на сборочной машине или в секретах CI.

<a id="certify-a-release-key"></a>

### Сертификация релизного ключа

```sh
nsh certify --root keys/root.secret --key keys/release.pub --apps 'com.example.*' -o keys/release.cert
```

```text
keys/release.cert: key 3428d7136788c9ee certified by root 4e0b637f5e10f6a6 for com.example.* until 365 days from now
```

| Флаг | Описание |
|---|---|
| `--root <file>` | Секретный ключ корня. |
| `--key <file>` | Открытый ключ релизного ключа. |
| `--apps <pattern>` | Идентификаторы приложений, которые он может подписывать: `*` (любые), `com.example.*` (идентификаторы внутри `com.example.`) или точный идентификатор. Можно повторять. |
| `--days <n>` | Как долго он может подписывать, считая с текущего момента. По умолчанию 365. |
| `-o, --out <file>` | Сертификат, который нужно записать. |

Сертификат представляет собой небольшой JSON-файл; он не секретный.

<a id="publish-a-package"></a>

## Публикация пакета

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert
```

```text
.nsh/out/com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), 0 assets, 12 KB, signed by 3428d7136788c9ee, for runtime 0.1.1 or newer
```

`nsh publish` собирает приложение в режиме release и подписывает его. Идентификатор приложения, имя, версия и номер сборки берутся из `nsh.json` рядом с точкой входа и переопределяются флагами:

| Флаг | Описание |
|---|---|
| `--key <file>` | Секретный ключ релизного ключа. |
| `--cert <file>` | Его сертификат. |
| `-o, --out <file>` | Пакет, который нужно записать. По умолчанию `.nsh/out/<id>-<build>.nshpkg`. |
| `--id <id>` | Идентификатор приложения, например `com.example.app`. |
| `--app-version <version>` | Версия, например `1.2.0`. |
| `--build <n>` | Номер сборки. Обязателен (здесь или в `nsh.json`); он должен расти с каждым релизом. |
| `--source-map <where>` | `package` (по умолчанию): внутри пакета. `file`: в `<package>.map` рядом с ним, не в пакете. `none`: не создаётся. См. [Errors from published packages](#errors-from-published-packages). |
| `--strip-debug` | Не включать в байткод таблицы строк и столбцов: пакет получается меньше, а в стеках ошибок нет позиций. |
| `--min-runtime <version>` | Самая ранняя версия рантайма, которая запускает пакет, например `0.2.0` (`nsh.json` `minRuntime`). По умолчанию: версия этого CLI. См. [Which runtimes run a package](#which-runtimes-run-a-package). |

`nsh publish` отказывается подписывать то, что устройство всё равно отклонит: сертификат должен покрывать идентификатор приложения и текущее время.

```text
error the release key's certificate does not cover this package: it does not cover app `com.example.counter` (only com.other.app)
```

<a id="which-runtimes-run-a-package"></a>

### Какие рантаймы запускают пакет

Пакет указывает самый ранний рантайм NSH, который его запускает, а хост-приложения с более старым рантаймом отклоняют его, прежде чем что-либо запустится:

```text
error the package needs runtime 0.2.0 or newer; this runtime is 0.1.1
```

По умолчанию это версия CLI, которым собран пакет: бандл компилируется относительно модулей этого CLI, поэтому именно для этого рантайма точно известно, что он пакет запускает. Если у хост-приложений в эксплуатации рантайм старше, а приложение использует только то, что в нём есть, публикуйте для него с помощью `--min-runtime` (или `minRuntime` в `nsh.json`):

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --min-runtime 0.1.0
```

Версия записывается как `MAJOR.MINOR.PATCH`; суффикс предварительной версии (`0.2.0-beta.1`) считается той же версией без него. Она не может быть новее CLI. Проверьте пакет на хост-приложении с таким рантаймом, прежде чем загружать его: импорт или функция, которых нет в более старом рантайме, приведут к ошибке при загрузке модуля.

<a id="what-a-package-holds"></a>

### Что содержит пакет

Пакет представляет собой один файл: JSON-заголовок (идентификатор приложения, имя, версия, номер сборки, объявленные capabilities, версия байткода, минимальный рантайм, время подписи, сертификат релизного ключа и таблица файлов с их SHA-256), затем сами файлы, затем подпись релизного ключа Ed25519 над всем, что стоит перед ней. Файлы такие:

- исходный код JS приложения (всегда),
- его байткод, который используется, только если у рантайма устройства та же версия байткода (иначе запускается исходный код, поэтому пакет продолжает работать на более новых рантаймах),
- его source map (если пакет не был опубликован с `--source-map file` или `none`),
- ресурсы, которые он импортирует (изображения, шрифты).

Идентичность пакета, по которой его отзывают, это SHA-256 всего файла.

<a id="packages-from-newer-versions-of-nsh"></a>

### Пакеты от более новых версий NSH

Хост-приложение запускает пакеты, подписанные более новым `nsh publish`, если его рантайм не старше [минимального рантайма](#which-runtimes-run-a-package) пакета. То, что добавила новая версия и чего не знает рантайм хоста, отбрасывается и никогда не расширяет возможности пакета:

- поля заголовка и файлы, которых он не знает, игнорируются (они по-прежнему покрыты подписью и своими хешами), если только пакет не помечает поле как обязательное для понимания рантаймом: тогда более старые рантаймы его отклоняют;
- неизвестные ему [capabilities](./sandbox-and-capabilities.md) не выдаются, а capability или разрешение `http` с неизвестным ему ключом отбрасывается целиком, поскольку этот ключ может его ограничивать.

То, что было отброшено, записывается в журнал при загрузке пакета.

<a id="sign-a-package-again"></a>

## Повторная подпись пакета

Платформа, распространяющая пакеты нескольких приложений, может подписывать их все одним собственным ключом: CI собирает каждый пакет и подписывает его ключом, которому доверяют тестовые приложения, а платформа подписывает его повторно ключом, которому доверяют боевые приложения.

```sh
nsh publish ci/com.example.counter-2.nshpkg --key keys/platform.secret --cert keys/platform.cert -o com.example.counter-2.nshpkg
```

```text
com.example.counter-2.nshpkg: com.example.counter 1.0.0 (build 2), signed again by d0eb0d3cb453b71b, for runtime 0.3.0 or newer
```

| Флаг | Описание |
|---|---|
| `--key <file>` | Секретный ключ релизного ключа. |
| `--cert <file>` | Его сертификат. |
| `-o, --out <file>` | Пакет, который нужно записать. Может совпадать с прочитанным пакетом. По умолчанию: `.nsh/out/<id>-<build>.nshpkg`. |

Пакет сохраняет всё, что в него положил CI: файлы, идентификатор приложения, версию и номер сборки, объявленные capabilities, [минимальный рантайм](#which-runtimes-run-a-package) и то, что записала [более новая версия NSH](#packages-from-newer-versions-of-nsh). Сертификат, время подписи и подпись становятся принадлежащими новому ключу, поэтому у пакета появляется собственный SHA-256, по которому его можно [отозвать](#revoke-keys-and-packages).

Перед подписью `nsh publish` проверяет, что пакет цел (подписан ключом, который называет его сертификат, таблица файлов покрывает данные, каждый файл соответствует своему хешу) и что новый сертификат покрывает идентификатор приложения и текущее время. С этого момента за пакет, включая его байткод, ручается новая подпись, поэтому платформа повторно подписывает пакеты, собранные её собственными сборками. Инструменты на Rust выполняют повторную подпись с помощью `nsh_package::resign(&bytes, &key, &certificate)`.

<a id="verify-a-package"></a>

## Проверка пакета

`nsh verify` проверяет пакет точно так же, как это сделало бы хост-приложение, доверяющее указанным корням:

```sh
nsh verify .nsh/out/com.example.counter-2.nshpkg --root keys/root.pub
```

```text
valid: com.example.counter 1.0.0 (build 2), release key 3428d7136788c9ee, sha256 f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4, 0 assets, bytecode for this runtime
```

| Флаг | Описание |
|---|---|
| `--root <file>` | Открытый ключ доверенного корня. Можно повторять. Если флагов нет, проверяется только собственная подпись пакета. |
| `--revocations <file>` | Список отзыва, который нужно применить первым. |

Устройство проверяет по порядку:

1. подпись сертификата доверенным корнем;
2. что релизный ключ не отозван;
3. подпись пакета релизным ключом;
4. что сертификат покрывает идентификатор приложения и время подписи;
5. минимальный рантайм, который нужен пакету;
6. что таблица файлов точно покрывает данные и каждый файл соответствует своему хешу;
7. что сам пакет не отозван;
8. что его сборка не старше самой высокой из ранее принятых сборок этого приложения (защита от отката).

Отклонённый пакет вызывает ошибку, в которой указано, какая проверка не пройдена; приложение, которое работало, продолжает работать.

<a id="revoke-keys-and-packages"></a>

## Отзыв ключей и пакетов

Корень подписывает **списки отзыва**: релизные ключи и пакеты, которые больше не должны загружаться.

```sh
# The first list.
nsh revoke --root keys/root.secret --sequence 1 \
  --package f40565358c13fafce369792e41125fea7f93fe87dd1bc24fd575dabc09b34fd4 -o revocations.json

# Later: keep everything in the last list and add a release key (sequence becomes 2).
nsh revoke --root keys/root.secret --extend revocations.json --key 3428d7136788c9ee -o revocations-2.json
```

| Флаг | Описание |
|---|---|
| `--root <file>` | Секретный ключ корня. |
| `--extend <file>` | Сохранить записи этого списка (последнего опубликованного). |
| `--sequence <n>` | Номер списка, больший, чем у любого опубликованного ранее. Вместе с `--extend` по умолчанию равен номеру того списка плюс один. |
| `--key <id>` | Идентификатор релизного ключа, который нужно отозвать. Можно повторять. |
| `--package <sha256>` | SHA-256 пакета (в том виде, как его выводит `nsh verify`), который нужно отозвать. Можно повторять. |
| `-o, --out <file>` | Список, который нужно записать. |

Хранилище доверия принимает только список с порядковым номером выше, чем у имеющегося, поэтому старый список нельзя воспроизвести повторно, чтобы снять отзыв. Публикуйте самый новый список там, откуда ваши приложения его получают, и применяйте его с помощью `updateRevocations` перед открытием пакетов.

<a id="rollback-protection"></a>

## Защита от отката

Когда хост-приложение принимает пакет, его хранилище доверия записывает номер сборки для этого идентификатора приложения и с этого момента отклоняет более старые сборки. Злоумышленник, получивший более старый подписанный пакет с известной уязвимостью, не сможет заставить приложение его запустить. Запись сохраняется в каталоге состояния хранилища (`nsh-trust.json`), поэтому переживает перезапуски. В GPUI хост-приложение может записать её позже, когда новый пакет докажет свою работоспособность (`verify_package`, затем `accept_package`; см. ниже).

<a id="loading-packages-in-a-host-app"></a>

## Загрузка пакетов в хост-приложении

Проверка хеширует весь пакет и извлекает его ресурсы (один раз для каждого пакета, в каталог хранилища доверия), поэтому она выполняется вне UI-потока; запуск результата происходит в нём.

**GPUI (Rust)**, где хост-приложение может также принять пакет только после того, как он доказал свою работоспособность:

```rust
use nsh_platform_gpui::{accept_package, package::{PublicKey, TrustStore}, verify_package};

let mut trust = TrustStore::open(state_dir)?;
trust.add_root(PublicKey::from_base64(ROOT_PUB)?);

// Off the main thread: verified as strictly as ever, but the build is not recorded yet.
let package = verify_package(&trust, &bytes, &packages_dir)?;
view.read(cx).run_package(&package);
// Later, once its first frame showed and no fatal error came for a while:
accept_package(&mut trust, &package)?;
```

**iOS (Swift)**:

```swift
let trust = try NshTrust(stateDirectory: applicationSupport.appendingPathComponent("nsh"))
try trust.addRoot(rootPublicKey)                // the contents of root.pub
try trust.updateRevocations(latestListJSON)     // when you have one

let info = try await app.loadPackage(at: downloaded, trust: trust)   // verify off the main thread, then run
```

**Android (Java)**:

```java
NshTrust trust = new NshTrust(new File(getFilesDir(), "nsh"));
trust.addRoot(rootPublicKey);
trust.updateRevocations(latestListJson);

NshPackage pkg = trust.openPackage(downloaded);   // off the UI thread; throws NshPackage.RefusedException
runOnUiThread(() -> nsh.runPackage(pkg));
```

Пока пакет не принят, сборка, принятая до него, по-прежнему проходит проверку, поэтому хост-приложение, у которого новый пакет не заработал, может вернуться к тому, что запускало раньше (сигналами служат фатальные ошибки `AppView::on_error` или сбой до принятия). Сборки старше принятой остаются отклонёнными, а пакет, отозванный в промежутке, не принимается. `load_package` проверяет и принимает сразу, как это делает `openPackage` на iOS и Android.

Объявленные [capabilities](./sandbox-and-capabilities.md) пакета передаются вместе с ним: пакет может делать только то, что он объявил, и только то, что хост-приложение дополнительно разрешило.

Полный API: [GPUI](./gpui.md#embedding-in-a-gpui-app), [Embedding in iOS apps](./ios.md#signed-packages), [Embedding in Android apps](./android.md#signed-packages).

<a id="errors-from-published-packages"></a>

## Ошибки опубликованных пакетов

Байткод пакета сохраняет таблицы строк и столбцов, поэтому у его ошибок есть позиции, а рантайм сопоставляет их с вашими исходниками с помощью source map пакета, прежде чем передать обработчику ошибок хост-приложения:

```text
Error: boom
    at n (App.tsx:5:3)
```

Source map содержит исходники вашего приложения и часто оказывается самым большим файлом в пакете: около половины от 2,6 МБ в примере gallery. Чтобы оставить её только у себя, опубликуйте её рядом с пакетом:

```sh
nsh publish App.tsx --key keys/release.secret --cert keys/release.cert --source-map file
```

```text
✓ wrote the source map to .nsh/out/com.example.counter-2.nshpkg.map (6.1 KB)
```

Тогда устройства сообщают позиции в бандле (`at n (bundle.js:1:80)`). Храните карту вместе с пакетом, которому она принадлежит, и сопоставляйте то, о чём сообщило хост-приложение, с помощью `nsh symbolicate`:

```sh
nsh symbolicate .nsh/out/com.example.counter-2.nshpkg.map report.txt
```

```text
Error: boom
    at n (App.tsx:5:3)
```

`nsh symbolicate` читает текст ошибки из файла или стандартного ввода и принимает файл карты или пакет, который её содержит. Таблицы строк добавляют около пятой части к байткоду (3–5% пакета вместе с его картой); `--strip-debug` не включает их, и тогда стеки выглядят как `at n (<null>:0:1)`, а сопоставлять нечего.

<a id="trying-a-package-in-development"></a>

## Проверка пакета в разработке

Хосты для разработки, которые устанавливает `nsh run`, могут запускать пакет так, как это делало бы встраивающее приложение.

На iOS исполняемый файл хоста принимает `--package <file>` и один или несколько `--root <root.pub>`. После того как `nsh run` установил хост в симулятор (`--target ios`):

```sh
xcrun simctl launch booted com.longbridge.nsh.host \
  --package "$PWD/.nsh/out/com.example.counter-2.nshpkg" --root "$PWD/keys/root.pub"
```

На Android хост для разработки (`DevActivity`, устанавливается командой `nsh run --target android`) принимает extras `package` (путь на устройстве) и `root` (открытые ключи в base64, через запятую):

```sh
adb push .nsh/out/com.example.counter-2.nshpkg /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg
adb shell am start -S -n com.longbridge.nsh.host/com.longbridge.nsh.DevActivity \
  --es package /sdcard/Android/data/com.longbridge.nsh.host/files/app.nshpkg \
  --es root "$(cat keys/root.pub)"
```

Их состояние доверия хранится во временном (iOS) или кеш-каталоге (Android), поэтому сборки старше уже принятых ими там тоже отклоняются.
<a id="a-release-checklist"></a>

## Контрольный список выпуска

1. Храните корневой ключ офлайн; сертифицируйте ключ выпуска для каждой команды или семейства приложений на срок не более года.
2. Увеличивайте `build` в `nsh.json` при каждом выпуске; `nsh publish` отклоняет пакет без этого значения.
3. Запускайте `nsh verify --root root.pub` для пакета перед его загрузкой.
4. Поставляйте `root.pub` внутри хост-приложения; списки отзыва поставляйте отдельно, чтобы можно было отозвать ключ без обновления приложения.
5. Если ключ выпуска скомпрометирован, отзовите его (`nsh revoke --extend … --key <id>`), сертифицируйте новый и опубликуйте выпуск заново.
6. Если платформа подписывает пакеты для своих приложений, выделите CI собственный корневой ключ, которому доверяют только тестовые приложения, а корневой ключ платформы поставляйте в рабочих приложениях; платформа повторно подписывает пакеты CI (`nsh publish <package>`).

<a id="see-also"></a>

## См. также

- [Sandbox and capabilities](./sandbox-and-capabilities.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
- [CLI](./cli.md)
