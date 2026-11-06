---
title: "아키텍처"
description: "NSH 앱이 실행되는 방식: 빌드 파이프라인, 엔진 스레드와 메인 스레드, 시그널 변경에서 네이티브 뷰까지의 경로, 네이티브 리액티브 그래프, 텍스트 레이아웃, 그리고 크레이트."
order: 63
group: tools
source_hash: 03fd3f0b9b408f5b
---

# 아키텍처

이 페이지는 Rust 또는 TSX로 작성된 앱에서 `count.set(1)`부터 화면의 레이블이 바뀌기까지 어떤 일이 일어나는지 알고 싶은 앱 개발자를 위한 문서입니다.
앱을 작성하는 데 꼭 필요한 내용은 아니지만, NSH가 왜 지금처럼 동작하는지 설명해 줍니다. 컴포넌트가 왜 한 번만 실행되는지, JS가 바쁜 동안에도 애니메이션이 왜 부드럽게 유지되는지, 메인 스레드가 왜 여러분의 코드를 기다리지 않는지를 다룹니다.

<a id="the-big-picture"></a>

## 전체 그림

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/architecture-light.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
<img class="diagram diagram-dark" src="/diagrams/architecture-dark.svg" alt="How an nsh app runs: the nsh CLI builds App.tsx into bytecode; on the engine thread, QuickJS runs a handler, the reactive graph in nsh-js queues ops, and nsh-core commits one MountBatch; it crosses to the main thread in one hop, which applies it to UIKit or Android views; touches go back as events. Native animations run on the main thread without JavaScript.">
</div>

<a id="building-only-your-code-becomes-js"></a>

## 빌드: 여러분의 코드만 JS가 됩니다

`nsh build`, `nsh dev` 및 다른 명령어는 Rust로 작성된 툴체인(Node.js 없음)으로 앱을 번들링합니다.

1. **Oxc**가 TypeScript 타입을 제거합니다.
2. **NSH의 JSX 컴파일러**가 같은 패스에서 JSX를 네이티브 렌더러에 대한 직접 호출로 변환합니다. 정적 props와 children은 한 번만 설정되고, 변경될 수 있는 표현식(함수를 호출하거나 프로퍼티를 읽는 것)은 렌더러가 추적하는 바인딩이 됩니다. 컴포넌트는 일반 함수 호출이 되며, 변경되는 props는 getter로 전달되는 props 객체를 받습니다.
3. **rolldown**이 모듈들을 하나의 ES 모듈로 번들링합니다. NSH의 모듈(`nsh`, `nsh/mobile`, `nsh/base` 등)에 대한 import는 그대로 import로 남습니다. 이 모듈들은 네이티브이며 런타임이 제공합니다. **번들에는 여러분 앱의 코드만 들어갑니다.** 카운터 예제의 JS는 1 KB 미만입니다.
4. 번들은 소스보다 빠르게 로드되는 **바이트코드**(`bundle.nshc`)로 컴파일되며, 모든 단계에 걸쳐 **소스 맵**이 합성되어 스택 트레이스가 여러분의 `.tsx` 라인을 가리킵니다.

import한 이미지와 폰트는 에셋으로 수집되고, 에디터용 타입 선언은 `.nsh/types`에 기록됩니다.

Rust로 작성된 앱에는 번들이 없습니다. Cargo가 여러분의 크레이트를 링크한 각 타깃의 러너를 빌드하고, `nsh.json`가 지정하는 루트 컴포넌트가 엔진에서 네이티브로 실행됩니다. 아래 내용은 모두 Rust 앱에도 그대로 적용되며, TSX 앱에서는 QuickJS에서 실행되는 컴포넌트 코드가 Rust에서 실행된다는 점만 다릅니다.

<a id="running-two-threads-per-app"></a>

## 실행: 앱당 두 개의 스레드

실행 중인 각 앱(iOS의 `NshAppView`, Android의 `NshView`, 패키징된 앱의 창)은 자체 **엔진 스레드**를 가진 하나의 **엔진**이며, TSX의 경우 자체 QuickJS VM도 가집니다. 전역 싱글턴이 없으므로 하나의 호스트 앱에서 여러 앱을 나란히 실행할 수 있습니다.

<a id="the-engine-thread"></a>

### 엔진 스레드

앱 로직에 관한 모든 일이 여기에서 일어납니다.

- **여러분의 코드**가 여기에서 실행됩니다. 컴포넌트, 이벤트 핸들러, 타이머, 이펙트가 해당합니다. Rust 컴포넌트는 네이티브로 실행되고, TSX는 **QuickJS**에서 실행됩니다.
- **리액티브 그래프**(시그널, computed 값, 이펙트, 오너, 컨텍스트)는 네이티브입니다. 노드는 네이티브 클래스의 QuickJS 객체이므로 가비지 컬렉터가 이를 통해 참조를 볼 수 있지만, 의존성 추적과 업데이트 스케줄링은 Rust가 담당합니다(Solid 1.9의 알고리즘을 따릅니다).
- 컴파일된 JSX가 호출하는 **렌더러**는 네이티브입니다. 노드를 생성하고 모든 변경을 네이티브 큐에 직접 푸시되는 **op**로 변환합니다. JSON도, prop마다 보내는 메시지도 없습니다.
- **코어**는 모든 노드의 섀도 트리를 유지합니다. JS 턴이 끝나면 큐에 쌓인 모든 op를 한 번에 가져와 **커밋**합니다. Rust 컴포넌트(`nsh/base`의 컴포넌트와 앱 자체의 컴포넌트)를 렌더링하고, padding과 margin의 `env()` 인셋을 해석하고, 변경된 텍스트를 다시 빌드하고, **Taffy**(flexbox와 grid, 기본값은 column이며 shrink 없음)로 레이아웃을 계산하고, 프레임과 스타일을 diff하여 네이티브 뷰에 필요한 작업 목록인 하나의 **MountBatch**를 생성합니다.

<a id="the-main-thread"></a>

### 메인 스레드

플랫폼의 메인(UI) 스레드는 각 MountBatch를 한 번에 적용합니다. 뷰를 생성하고, 삽입하고, 스타일과 프레임을 설정하고, 레이아웃이 끝난 텍스트를 전달합니다. 그 외에는 메인 스레드에서 반드시 처리해야 하는 일만 합니다.

- 엔진 스레드에서 이미 레이아웃된 **텍스트 그리기**
- **네이티브 애니메이션**: `nsh`의 애니메이션 값은 프레임 단위로 구동되어(iOS의 `CADisplayLink`, Android의 UI 스레드 애니메이터) 뷰에 직접 기록됩니다.
- **제스처와 스크롤**: 터치는 엔진 스레드로 전송되는 이벤트가 되며, `scrollValue`과 `pan`는 같은 프레임에서 애니메이션 값을 공급합니다.

**메인 스레드는 JS를 기다리지 않습니다.** 시스템이 그 자리에서 답을 필요로 하는 경우(이 텍스트를 변경해도 되는지, 뒤로 가기 버튼이 이 화면을 pop해도 되는지, 이 시트를 닫아도 되는지)에는 그 답이 미리 prop으로 마운트되어 있고, JS는 나중에 이벤트를 통해 이를 전달받습니다. 엔진 스레드가 바쁘면 업데이트가 지연될 수는 있지만, 스크롤, 애니메이션, 시스템 제스처가 멈추지는 않습니다.

<a id="from-a-tap-to-the-screen"></a>

## 탭에서 화면까지

```text
 main thread               engine thread                                              main thread
 ───────────               ─────────────────────────────────────────────────────      ───────────
 tap on a view ─ event ─▶  handler runs: count.set(count() + 1)
                           reactive graph: the bindings that read count() run again
                           renderer: one op per changed binding → native queue
                           JS turn ends → core commit: render, text, layout, diff
                           → MountBatch (e.g. 1 Text item)                 ─ hop ─▶   apply: draw the new text
```

카운터 예제에서 탭 한 번의 비용은 Mac의 릴리스 빌드에서 JS와 커밋을 합쳐 약 0.12 ms이며, 소수의 마운트 항목을 생성합니다([Testing](./testing-and-trace.md) 참고).

Rust 앱에서는 핸들러가 Rust 클로저(`count.set(count.get() + 1)`)이며, 같은 그래프, 커밋, 배치가 이어지고 중간에 인터프리터는 없습니다.

이 설계에서 세 가지 특성이 나옵니다.

- **한 턴은 한 번의 커밋입니다.** 핸들러가 시그널을 몇 개 설정하든 뷰는 한 번에 함께 변경됩니다.
- **컴포넌트는 한 번만 실행됩니다.** 바인딩만 다시 실행됩니다. 컴포넌트의 리렌더링도, 가상 DOM diff도 없습니다. 남아 있는 diff는 프레임과 스타일에 대한 코어의 diff이며 Rust로 수행됩니다.
- **변경 사항만 전달됩니다.** 변경되지 않은 스타일과 프레임은 전송되지 않으며, 새 뷰에는 기본값이 설정되지 않습니다.

<a id="text-laid-out-once-off-the-main-thread"></a>

## 텍스트: 메인 스레드 밖에서 한 번만 레이아웃

텍스트는 UI에서 가장 비용이 큰 부분인 경우가 많습니다. NSH는 플랫폼 고유의 텍스트 엔진을 사용해 엔진 스레드에서 텍스트를 레이아웃하므로, 네이티브 텍스트와 똑같이 보입니다.

1. **prepare**: `<Text>`와 그 안에 중첩된 span이 하나의 attributed string이 됩니다(Apple 플랫폼에서는 CoreText, Android에서는 `PrecomputedText` / `StaticLayout`).
2. **measure**: 레이아웃이 요청하는 너비에 맞춰 측정합니다. 측정 결과는 내용과 너비를 기준으로 캐시되므로, 색상만 바뀌면 다시 측정하지 않습니다.
3. **layout**: 최종 크기로 레이아웃합니다.

메인 스레드는 변경 불가능한 결과를 받아 그리기만 합니다. `<Text>` 안에 중첩된 텍스트는 뷰가 아니라 span이며, `<Text>` 밖의 문자열은 아무것도 렌더링하지 않습니다.

<a id="lists"></a>

## 리스트

`List`는 네이티브로 가상화됩니다. 코어가 뷰포트 근처에 있는 행을 결정하고, 위치, 열, 스티키 헤더를 계산하며, 셀을 재활용합니다. 셀에 다른 항목이 필요해지면 런타임이 이를 바인딩합니다(행 함수의 `item()`와 `index()` 접근자가 변경됩니다). 새 행이 드러나지 않는 프레임에서는 JS를 전혀 호출하지 않습니다. [Lists](./lists.md)를 참고하세요.

<a id="everything-else-the-runtime-does"></a>

## 런타임이 하는 그 밖의 일

- **네트워킹**: `fetch`와 다른 전역 API는 네이티브 클래스입니다. 요청은 플랫폼의 HTTP 스택(`NSURLSession`, `HttpURLConnection`)으로 전달되며, 양방향 스트리밍을 지원합니다.
- **이미지**는 메인 스레드 밖에서 뷰의 크기에 맞춰 다운로드 및 디코딩되며, 메모리 캐시를 사용합니다.
- **제한과 capability**는 런타임이 Rust로 강제합니다. [Sandbox and capabilities](./sandbox-and-capabilities.md)를 참고하세요.
- **Hot module replacement** 역시 네이티브입니다. 패치는 런타임이 1밀리초 이내에 적용합니다([Dev server and debugging](./dev-server-and-debugging.md) 참고).

<a id="three-layers"></a>

## 세 개의 레이어

NSH의 UI는 GPUI Kit과 마찬가지로 세 개의 레이어로 구성됩니다.

| 레이어 | NSH | GPUI Kit | 설명 |
|---|---|---|---|
| Primitives | `nsh-core`와 런타임(`nsh`, `nsh/mobile`, `nsh/desktop`) | `gpui` | 호스트 엘리먼트, 스타일, 레이아웃, 렌더링, 리액티비티, 환경 |
| Base components | `nsh-base`(`nsh/base`) | `gpui-base` | 동작, 상태, 포커스, 키보드, 접근성을 담당하고 외형은 앱에서 가져오는 스타일 없는 컴포넌트 |
| Component library | 앱 자체 또는 커뮤니티의 라이브러리 | `gpui-component` | 스타일이 적용된 컴포넌트: 버튼, 카드, 외형이 있는 행 |

처음 두 레이어는 Native Shell에 포함됩니다. 세 번째 레이어는 여러분의 몫입니다. 앱은 `nsh/base`와 primitives 위에 TSX나 [자체 크레이트](./rust.md)의 Rust 컴포넌트로 자체 컴포넌트 라이브러리를 만들거나, 커뮤니티가 게시한 라이브러리를 사용하거나, 앱에서 UI를 직접 스타일링합니다.

<a id="the-crates"></a>

## 크레이트

NSH는 Rust 워크스페이스입니다. 앱을 작성하기 위해 NSH를 직접 빌드할 필요는 없지만(배포판에 CLI와 사전 빌드된 런타임이 포함되어 있습니다), 로그와 문서에 이름이 나타납니다.

| 크레이트 | 설명 |
|---|---|
| `nsh-core` | 플랫폼 독립적인 코어: 섀도 트리, 스타일, Taffy 레이아웃, 텍스트 병합, 리스트 가상화, 마운트 항목, CSS 값과 Tailwind, 네이티브 애니메이션 그래프(값, 보간, timing / spring / decay), Rust 컴포넌트의 프레임워크와 테마, 런타임의 Rust 모듈(`nsh/mobile`의 `BackHandler` 등). |
| `nsh-base` | `nsh/base`, 스타일 없는 base components(NSH의 `gpui-base`): 내비게이션, 다이얼로그, 컨트롤, 상태 표시줄. Rust 앱은 이를 `nsh_base`로 사용합니다. |
| `nsh-js` | QuickJS 호스트와 NSH의 런타임: 리액티브 그래프, 렌더러, 모든 네이티브 모듈, 전역 API, hot module replacement, 제한, 그리고 이 모든 것의 TypeScript 선언. |
| `nsh-engine` | 엔진 스레드: `nsh-js`와 `nsh-core`를 구동하고 프레임마다 하나의 배치를 플랫폼에 전달합니다. |
| `nsh-package` | 서명된 패키지: 키, 인증서, 폐기, 신뢰 저장소. |
| `nsh-bundler` | 번들러: rolldown, Oxc, NSH의 JSX 컴파일러, 소스 맵, Tailwind 클래스 검사. |
| `nsh-dev` | 개발 서버와 그 클라이언트. |
| `nsh-platform-ios` | UIKit 백엔드(iOS, 시뮬레이터, Mac Catalyst): 뷰 마운트, CoreText 텍스트 엔진, 입력, 임베딩 SDK. |
| `nsh-platform-android` | Android 백엔드: `libnsh.so`와 Java 런타임(`NshView`, 뷰, 이미지, 네트워킹). |
| `nsh-cli` | `nsh` 명령어. |

의존성 방향은 `nsh-core` ← `nsh-js` ← `nsh-engine` ← 플랫폼이며, `nsh-base`는 `nsh-core` 위에 구축됩니다. 코어는 어떤 플랫폼에도, 어떤 JS 엔진에도 의존하지 않으며, 덕분에 `nsh test`가 어떤 머신에서든 실제 런타임을 헤드리스로 실행할 수 있습니다.

<a id="see-also"></a>

## 관련 문서

- [Performance](./performance.md)
- [Reactivity](./reactivity.md)
