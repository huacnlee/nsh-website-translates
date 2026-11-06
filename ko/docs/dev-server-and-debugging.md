---
title: "개발 서버와 디버깅"
description: "nsh run과 nsh dev로 Rust 및 TSX 앱을 실행하고, 시뮬레이터, 에뮬레이터, 실제 기기를 연결하며, 리빌드, 핫 모듈 교체(HMR), 로그, 오류 오버레이, 소스 맵이 적용된 스택 트레이스를 사용하는 방법을 설명합니다."
order: 60
group: tools
source_hash: bce9f1fee0870b27
---

# 개발 서버와 디버깅

개발 중에 NSH는 저장할 때마다 앱을 빌드합니다. Rust 앱(`nsh.json`이 `"root"`를 지정합니다)은 자체 러너로 빌드되고, 이 러너는 `nsh run`이 시작합니다. 크레이트가 바뀌면 다시 빌드하고 앱을 재시작합니다. TSX 앱은 연결된 모든 호스트로 전송되며, 호스트는 그 자리에서 업데이트됩니다. 이를 위한 명령은 두 가지입니다.

- `nsh run`은 앱을 빌드하고 **실행**까지 합니다. Mac Catalyst 또는 AppKit 창, Linux의 GTK 창, Windows의 Win32 창, iOS 시뮬레이터, Android 기기 또는 에뮬레이터, 브라우저 페이지 중 하나가 열립니다. TSX의 경우 개발 호스트가 연결할 개발 서버도 함께 시작합니다.
- `nsh dev --server-only`는 직접 시작하는 호스트를 위해 TSX용 개발 서버를 시작합니다. 개발 SDK가 포함된 자체 앱, 네트워크상의 기기, 또는 여러 호스트를 동시에 사용하는 경우가 이에 해당합니다.

```sh
# A Rust app, from its directory
nsh run                             # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run --target ios                # iOS simulator
nsh run --target android            # Android device or emulator

# A TSX app
nsh run App.tsx                     # AppKit window (macOS); GTK window (Linux); Win32 window (Windows)
nsh run App.tsx --target macos      # AppKit window (macOS)
nsh run App.tsx --target ios        # iOS simulator
nsh run App.tsx --target android    # Android device or emulator
nsh dev App.tsx --server-only       # server only
```

`nsh dev`은 기본적으로 네이티브 호스트도 함께 엽니다. 모바일 호스트는 `--target ios` 또는 `--target android`를 사용합니다.

## `nsh run`

| 플래그 | 설명 |
|---|---|
| `--target <catalyst \| ios \| android \| macos \| linux \| windows \| gpui \| web>` | 실행할 위치입니다. 기본값은 macOS(AppKit)에서 `macos`, Linux에서 `linux`, Windows에서 `windows`입니다. Rust 앱은 루트를 GPUI 앱에 포함하는 `gpui`을 제외한 모든 대상에서 실행됩니다([GPUI](./gpui.md)). |
| `--device <name or UDID>` | 사용할 iOS 시뮬레이터입니다. 기본값: 이미 부팅된 시뮬레이터, 없으면 가장 최신 iPhone(자동으로 부팅됩니다). |
| `--port <port>` | 개발 서버 포트입니다. 기본값은 8790이며, 사용 중이면 다음으로 비어 있는 포트를 사용합니다. |
| `--release` | TSX의 릴리스 빌드를 제공합니다(minify, 디버그 정보 없음, 핫 업데이트 없음). |
| `--trace` | 호스트에서 이루어지는 모든 커밋의 시간을 기록합니다(TSX 앱). |

각 대상의 동작은 다음과 같습니다.

- **`catalyst`**(macOS)은 개발 호스트를 Mac 앱으로 실행합니다. `nsh run`을 중지하면(Ctrl-C 또는 `kill`) 호스트가 닫히고, 창을 닫으면 `nsh run`가 종료됩니다.
- **`macos`**(macOS)은 AppKit 개발 호스트를 같은 방식으로 1200×800 창의 데스크톱 앱으로 실행합니다. Cmd+R을 누르면 최신 빌드를 다시 불러옵니다. macOS 14 이상이 필요합니다([macOS](./macos.md)).
- **`linux`**(Linux)은 GTK 개발 호스트를 390×844 창에서 같은 방식으로 실행합니다. `nsh run`을 중지하면 호스트가 닫히고, 창을 닫으면 `nsh run`가 종료됩니다. GTK 4.14 이상이 필요합니다([Linux](./linux.md)).
- **`windows`**(Windows)은 Win32 개발 호스트를 1200×800 창에서 같은 방식으로 실행합니다. 콘솔이 닫혀도 호스트는 `nsh run`보다 오래 살아남지 않습니다. Windows 10 1809 이상이 필요합니다([Windows](./windows.md)).
- **`ios`**은 시뮬레이터에 개발 호스트를 설치하고, 개발 서버를 가리키도록 실행한 뒤 계속 감시합니다. 시뮬레이터는 Mac의 네트워크를 공유하므로 호스트는 `127.0.0.1`에서 서버에 접근합니다. `nsh run`을 중지(Ctrl-C)하면 호스트가 닫힙니다. 그렇지 않으면 호스트가 다음 세션에 참여하게 됩니다. Xcode가 필요합니다.
- **`android`**는 개발 호스트 APK를 설치하고(런타임이 바뀐 경우에만 다시 설치), 기기 자체의 `127.0.0.1`이 서버에 닿도록 `adb reverse tcp:<port> tcp:<port>`를 실행한 뒤 호스트를 시작합니다. 에뮬레이터와 USB 기기 모두에서 동작합니다. Android SDK(`ANDROID_HOME`)가 필요합니다. `nsh run`가 종료되면(Ctrl-C 포함) 호스트를 중지하고 해당 포트 포워딩을 제거하므로, 호스트가 다음 세션에 참여하지 않습니다.

`nsh run`가 어떤 방식으로 종료되든, 시작했던 호스트를 중지합니다. Catalyst 앱을 종료하거나, macOS·Linux·Windows 호스트를 닫거나, 시뮬레이터의 개발 호스트를 종료하거나, 기기에서 강제로 중지합니다.

Rust 앱의 경우 각 대상은 해당 크레이트로 빌드된 앱 자체의 러너를 실행합니다. 데스크톱에서는 디버그 빌드를 그 자리에서 실행하며 출력은 터미널에 표시되고, iOS와 Android에서는 패키지로 만들어 설치합니다. TSX의 경우 호스트는 범용이어서 서버가 보내는 어떤 NSH 앱이든 실행하므로, 앱마다 따로 빌드할 것이 없습니다(자체 크레이트가 있는 앱은 그 크레이트로 빌드된 호스트를 사용합니다).

## `nsh dev`

```sh
nsh dev App.tsx
```

```text
✓ built App.tsx (3.2 KB js, 9.8 KB bytecode, 21ms)
→ dev server ws://127.0.0.1:8790/ws
  devices on this network: ws://192.168.1.20:8790/ws
```

| 플래그 | 설명 |
|---|---|
| `--port <port>` | 개발 서버 포트입니다. 기본값은 8790입니다(사용 중이면 다음으로 비어 있는 포트). |
| `--release` | 릴리스 빌드를 제공합니다. |

출력된 URL에 호스트를 연결하세요.

- **자체 iOS 앱**은 `NativeShellDev.xcframework`과 링크한 뒤 `try app.connectDevServer(URL(string: "ws://192.168.1.20:8790/ws")!)`를 사용합니다. [Embedding in iOS apps](./ios.md#development)를 참고하세요.
- **자체 Android 앱**은 `nsh-dev.aar`과 함께 `nsh.connectDevServer("ws://192.168.1.20:8790/ws")`를 사용하거나, `adb reverse tcp:8790 tcp:8790`와 `ws://127.0.0.1:8790/ws`를 사용합니다. [Embedding in Android apps](./android.md#development)를 참고하세요.

호스트는 몇 개든 동시에 연결할 수 있으며, 모든 빌드가 전부에 전달됩니다. 나중에 연결한 호스트는 현재 빌드를 즉시 받습니다. 앱이 가져오는 UI 세트가 없어서(다른 앱용으로 빌드된 개발 호스트 등) 앱을 실행할 수 없는 호스트는 빌드를 받지 못합니다. 이 경우 호스트가 그 이유를 표시하고, 터미널에는 앱의 호스트를 설치하는 명령과 함께 `warn` 줄이 출력됩니다.

> [!NOTE]
> LAN의 기기는 개발 서버 포트로 컴퓨터에 접근할 수 있어야 합니다. 같은 네트워크여야 하며 사이에 방화벽이 없어야 합니다.
> 에셋(이미지, 글꼴)은 같은 포트에서 일반 HTTP로 제공됩니다.

<a id="rust-edits"></a>

## Rust 편집

Rust는 컴파일 언어입니다. 앱의 크레이트나 경로로 의존하는 크레이트가 바뀌면 앱을 다시 빌드하고, `nsh run`가 새 코드로 앱을 재시작합니다. 앱의 상태는 새로 시작되므로, 재시작 후에도 유지해야 하는 것은 [storage](../modules/nsh.md#storage)에 보관하세요. 빌드 오류는 터미널에 출력되며, 컴파일에 성공하는 다음 저장 때 다시 실행됩니다. Rust와 TSX가 함께 있는 앱에서는 TSX 편집은 핫 업데이트(아래 참조)로 처리되고 Rust 편집은 앱을 재시작합니다.

<a id="hot-module-replacement"></a>

## 핫 모듈 교체

TSX 개발 빌드는 소스 파일마다 모듈 하나를 유지합니다. 저장하면 NSH가 다시 빌드하고, 모듈을 마지막 정상 빌드와 비교한 뒤 변경된 모듈만 담은 **패치**를 보냅니다. 호스트는 이를 1밀리초보다 훨씬 짧은 시간에 그 자리에서 적용하며, 파일을 저장한 뒤 변경이 보이기까지 대략 120ms가 걸립니다.

앱에서 일어나는 일은 다음과 같습니다.

- **편집한 컴포넌트만 다시 렌더링됩니다.** 모든 최상위 컴포넌트(JSX를 반환하는, 대문자로 시작하는 함수)는 안정적인 프록시로 감싸져 있습니다. 컴포넌트의 코드(또는 그 컴포넌트가 사용할 수 있는 모듈의 나머지 코드)가 바뀌면 해당 인스턴스가 새 코드로 다시 렌더링됩니다. 코드가 바뀌지 않은 컴포넌트는 인스턴스를 유지하며, 시그널과 상태도 그대로 유지됩니다. 버튼의 스타일을 편집해도 화면은 그대로 있고, 입력한 텍스트와 스크롤 위치도 같습니다.
- **변경된 모듈은 다시 실행되며**, 변경된 모듈을 가져오면서 업데이트를 스스로 받을 수 없는 모듈도 엔트리까지 거슬러 올라가며 다시 실행됩니다. 따라서 모듈 수준 코드는 다시 실행되지만, 상태를 유지하는 것은 예외입니다.
- **최상위 시그널과 내비게이션 스택은 상태를 유지합니다.** 모듈 최상위에서 `signal(…)` 또는 `createNavStack(…)`로 만든 `const`은 자체 초기화 식이 같은 한 편집 전반에 걸쳐 값(스택의 경우 페이지)을 유지합니다. 새로 시작하려면 초기화 식을 바꾸세요(`signal(0)`을 `signal(10)`으로).
- **최상위 `context()` 객체는 정체성(identity)을 유지하면서** 새 기본값을 받으므로, 서로 다른 모듈의 프로바이더와 컨슈머가 계속 일치합니다.
- **엔트리를 편집해도 앱은 마운트된 상태로 유지됩니다.** 같은 컴포넌트로 `mount(App)`(또는 `mount(() => <App />)`)가 다시 실행되면 마운트된 것이 유지되고, 편집한 컴포넌트만 다시 렌더링됩니다. `App` 자체를 편집하면 이 컴포넌트가 렌더링하는 것과 함께 다시 렌더링되지만(그 컴포넌트들의 상태는 새로 시작됩니다), 모듈 최상위에서 만든 내비게이터는 라우트를 유지하므로 푸시된 화면은 그대로 푸시된 상태로 남습니다. 변경된 `mount` 호출(다른 컴포넌트, 다른 props)은 앱을 다시 마운트합니다.
- **예외를 던지는 컴포넌트**는 오류를 보고하고 고칠 때까지 아무것도 렌더링하지 않으며, 앱의 나머지 부분은 계속 실행됩니다. 다음에 정상적으로 저장하면 복구됩니다.

다음 경우에는 호스트가 패치하는 대신 **앱 전체를 다시 불러옵니다**.

- 실행 중인 앱이 아직 가져오지 않은 NSH 모듈을 변경 사항이 가져오는 경우(예: 처음 사용하는 `import … from "nsh"`)
- `nsh.json`에 있는 앱의 `capabilities`이 변경된 경우
- 호스트가 패치의 기반이 되는 빌드를 실행하고 있지 않은 경우(방금 연결했거나 이전 로드가 실패한 경우)
- 패치를 적용할 수 없는 경우

> [!TIP]
> 컴포넌트가 자신의 시그널에 보관하는 상태는 해당 컴포넌트나 그것을 렌더링하는 컴포넌트를 편집하면 초기화됩니다. 편집 후에도 유지해야 하는 상태는 최상위 시그널(또는 스토어 모듈)에 두고, 내비게이터는 모듈 최상위에서 만드세요.

`--release`는 핫 업데이트 없이 릴리스 빌드를 제공하므로, 저장할 때마다 앱이 다시 로드됩니다. minify된 빌드를 확인할 때 사용하세요. `--release` 여부와 관계없이 개발 서버에서 로드한 모든 것은 런타임의 하드닝(`eval`은 계속 사용할 수 있습니다)을 적용받지 않습니다. [Sandbox and capabilities](./sandbox-and-capabilities.md#hardening)를 참고하세요.

<a id="logs"></a>

## 로그

Rust 앱은 `log` 크레이트(`log::info!`, `log::warn!`, `log::error!`)로 로그를 남깁니다. `nsh run`은 데스크톱과 iOS 시뮬레이터에서 앱의 출력과 함께 해당 줄을 터미널에 표시합니다.

TSX에서는 `console.log`, `console.info`, `console.debug`, `console.warn`, `console.error`이 target `js`로 네이티브 로그에 기록됩니다. 호스트가 연결되어 있는 동안 해당 로그 줄은 `nsh run` / `nsh dev`를 실행 중인 터미널로 전달됩니다. `console.log` 줄은 그대로(여러 기기가 연결된 경우 기기 이름을 앞에 붙여서), 경고와 오류는 기기 이름 뒤에 표시됩니다.

```text
• iPhone 16 Pro connected, build 1
loading more after 1000
warn iPhone 16 Pro: deprecated option
error iPhone 16 Pro: uncaught exception: TypeError: cannot read property 'id' of undefined
          at Row (demos/Photos.tsx:18:22)
```

`console.log`은 값을 브라우저 콘솔처럼 포맷합니다. 문자열은 그대로, 오류는 스택과 함께, 함수는 이름으로, 객체와 배열은 JSON으로 표시합니다. 호스트가 연결되어 있지 않으면 로그는 플랫폼의 로그로 전달됩니다(iOS에서는 Xcode 콘솔 / 통합 로그, Android에서는 `adb logcat`).

거부된 프로미스에 그 거부를 일으킨 작업이 끝날 때까지(마이크로태스크가 실행된 뒤까지) 핸들러가 없으면, 브라우저가 보고하는 방식과 마찬가지로 이것도 오류로 기록됩니다. 아무도 await하지 않는 상태에서 예외를 던지는 `async` 함수, 아무도 catch하지 않는 `Promise.reject(…)`, 기다리는 대상이 없는 상태에서 실패하는 Rust 호출이 그 예입니다. 이 줄은 `console.error`이 출력되는 곳(터미널, 플랫폼 로그, 웹에서는 브라우저 콘솔)에 기록되며, 스택은 사용자의 소스를 가리킵니다.

```text
error iPhone 16 Pro: unhandled rejection: Error: HTTP 404
          at loadProfile (App.tsx:12:11)
```

같은 턴에서 나중에 연결한 핸들러(`const p = load(); …; p.catch(…)`)도 처리한 것으로 간주됩니다. 실패가 중요한 곳에서는 프로미스를 await하거나 `.catch`를 붙이세요.

터미널의 나머지 출력은 단계당 한 줄입니다(`✓`은 완료, `→`는 연결 위치, `•`는 기기가 수행한 작업). NSH가 실행하는 도구(cargo, 호스트 자체)의 출력은 실패했을 때만 출력됩니다. `nsh run -v`(또는 `NSH_VERBOSE=1`)는 모든 것을 출력합니다. 레벨과 출처가 붙은 모든 로그 줄, cargo의 출력, 호스트 자체의 출력이 포함됩니다.

`--trace`는 모든 커밋의 비용을 추가로 표시합니다.

```text
perf commit: 10 ops, 151µs (list js 2µs), 8 mount items, 27 nodes
```

이 수치가 의미하는 바는 [Testing](./testing-and-trace.md)을 참고하세요.

<a id="the-error-overlay"></a>

## 오류 오버레이

다음 오류는 호스트의 앱 위에 메시지와 스택이 담긴 빨간색 오버레이로 표시됩니다.

- 빌드 실패(구문 오류, 알 수 없는 요소, 누락된 import). 해당 줄을 가리키는 코드 프레임이 함께 표시됩니다.
- 번들을 평가하는 동안 발생한 오류
- 이벤트 핸들러, 타이머 또는 이펙트에서 발생한 잡히지 않은 예외

오버레이를 탭하면 닫힙니다. 다음에 다시 로드에 성공할 때도 사라집니다. 빌드 실패는 터미널에도 출력됩니다.

```text
error building App.tsx failed
App.tsx

  x <Buton> names nothing in scope
   ,-[3:11]
 2 | function App() {
 3 |   return <Buton />;
   :           ^^^^^
 4 | }
```

번들러는 TypeScript 타입을 검사하지 않고 제거만 합니다. 타입 오류는 [`nsh check`](./cli.md#nsh-check)(`tsconfig.json` `nsh init` 출력을 사용하는 TypeScript 네이티브 컴파일러이며 Node가 필요 없습니다)를 실행하거나 편집기에 의존하세요.

릴리스 빌드(릴리스 SDK를 사용하는 임베딩 앱, 패키지된 앱)에서는 오류가 기록되고 호스트 앱의 오류 핸들러(`NshAppView.onError`, `NshView.setErrorListener`)로 전달되지만, 앱 위에 표시되지는 않습니다.

<a id="source-maps-and-stack-traces"></a>

## 소스 맵과 스택 트레이스

번들링은 모든 단계(TypeScript → JSX → 번들)를 합성한 소스 맵을 생성하며, 이 맵은 각 빌드와 함께 전송됩니다. 스택 트레이스가 출력되거나 표시되기 전에 런타임이 번들의 위치를 사용자의 소스로 다시 매핑하므로, 스택은 번들이 아니라 `App.tsx:2:28`를 가리킵니다.

```text
error Mac Catalyst: uncaught exception: Error: tap boom
          at <anonymous> (App.tsx:2:58)
```

`nsh build`는 맵을 `bundle.js.map`로 기록합니다. 폴더에서 번들을 로드하는 임베딩 앱은 번들 옆에서 맵을 읽으며, [signed packages](./signed-packages.md)에도 맵이 포함됩니다. 단, 맵을 패키지 옆에 따로 보관하고 `nsh symbolicate`로 적용하는 경우는 제외입니다([Errors from published packages](./signed-packages.md#errors-from-published-packages)).

<a id="debugging-tips"></a>

## 디버깅 팁

- **편집 후 아무것도 업데이트되지 않음**: 터미널에서 빌드 오류를 확인하세요. 호스트의 오버레이에도 표시됩니다.
- **초기화되기를 기대한 상태가 그대로 남아 있음**: 핫 교체는 변경되지 않은 컴포넌트의 상태, 최상위 시그널, 내비게이터를 의도적으로 유지합니다. Ctrl-C로 종료한 뒤 `nsh run`로 다시 시작하거나, 상태의 초기화 식을 바꾸세요.
- **패키지되거나 임베딩된 빌드에서만 요청이 실패함**: 앱의 [capabilities](./sandbox-and-capabilities.md)를 확인하세요. 거부된 요청은 추가해야 할 키와 함께 기록됩니다.
- **무언가 느림**: 모든 네이티브 뷰 연산을 출력하는 [`nsh test --trace`](./testing-and-trace.md)로 헤드리스 환경에서 재현하거나, TSX 앱을 `--trace`와 함께 실행하세요.
- **편집기의 타입 오류**: `nsh run`와 `nsh dev`가 `.nsh/types`를 최신 상태로 유지합니다. [Project structure](./project-structure.md)를 참고하세요.

<a id="see-also"></a>

## 참고

- [CLI](./cli.md)
- [Testing](./testing-and-trace.md)
- [Embedding in iOS apps](./ios.md), [Embedding in Android apps](./android.md)
