---
title: "성능 보고서"
description: "NSH 앱의 측정 수치를 다룹니다. NSH 기준선(baseline)의 커밋 및 프레임 비용과, Linux, macOS, Windows, iOS에서 페이지별로 측정한 갤러리의 프레임 레이트, CPU, 메모리 사용량을 제공하며, 이를 재현하는 방법도 함께 설명합니다."
order: 62.5
group: tools
source_hash: 8924d78b30d23299
---

# 성능 보고서

NSH 앱의 비용을 실측한 결과입니다. NSH가 앱을 빠르게 유지하는 방법과 내 앱을 측정하는 방법은 [성능](./performance.md)에서 설명합니다.

<a id="baselines"></a>

## 기준 측정값

NSH 자체 기준 측정값입니다(별도 표기가 없으면 Apple silicon 기준).

| 시나리오 | 수치 |
|---|---|
| 카운터 앱, headless (debug) | 첫 프레임 약 0.5–0.65 ms (58 ops / 49 mount items), 탭 한 번 약 0.15 ms |
| 카운터 앱, Mac Catalyst (release) | 첫 프레임 약 1.05–1.15 ms (이 중 약 0.7 ms는 CoreText로 텍스트 10개를 처음 레이아웃하는 데 사용), 탭 한 번 약 0.12 ms |
| Gallery 사진 목록, headless (debug) | 첫 프레임 653 ops / 224 nodes, 약 2.7 ms |
| 사진 목록 스크롤, Catalyst (release) | 천천히 스크롤하며 행 하나를 다시 바인딩하는 데 약 0.4 ms, 빠르게 fling할 때 화면 전체(약 32개 행)는 0.9–1.6 ms |
| 사진 목록 스크롤, Android 에뮬레이터 (arm64, release) | 행 하나 다시 바인딩 약 0.3–0.4 ms (JS 약 60 µs) |
| 엔진 시작 (release) | 약 75–155 µs, 전역 API(`fetch`, `URL` 등)는 처음 사용하기 전까지 비용이 없고 이후 약 90 µs |
| Hot reload | 파일 저장부터 새 버전 실행까지 약 120 ms, 업데이트 적용은 0.2–0.5 ms |

## Linux (GTK 4)

Linux 데스크톱(x86_64, 24 스레드, NVIDIA GPU)에서 release 빌드로 측정했습니다. Gallery를 120 Hz 디스플레이의 1896 × 1030 창에서 실행했고, 모든 측정값은 `examples/gallery/tools/perf.py`(`nsh test --target linux --fps`, 초당 한 줄)이 자동으로 수집했습니다. CPU는 프로세스 전체이며 코어 하나 기준 퍼센트입니다. *Frame p95*는 그려진 프레임당 메인 스레드 소요 시간의 95번째 백분위수이며, 8.3 ms 미만이면 프레임이 120 Hz 주사율 안에 들어옵니다.

<a id="animated-demos"></a>

### 애니메이션 데모

<div class="data-table">

| 데모 | FPS | Frame p95 | CPU |
|---|---|---|---|
| Stocks: 실시간 스파크라인 22개, 장중 차트, 호가창, 체결 내역 | 117–120 | 5–6 ms | 25–29% (1200 × 800), 28–32% (1896 × 1030) |
| Stocks, 4K 144 Hz 디스플레이를 1.6배율로 채운 창 | 143–145 | 4.1–4.4 ms | 26–29% |
| Canvas: 게이지, 시계, 도트 매트릭스 | 120 | 2.6–4.4 ms | 5–10% |
| Animations: 네이티브 루프 3개, 스프링, 시퀀스 | 120 | 2.0 ms | 12–13% |

</div>

<a id="every-page"></a>

### 모든 페이지

Gallery의 모든 페이지를 열 때와 테스트가 스크롤하는 동안, 144 Hz 디스플레이의 1200 × 800 창에서 측정했습니다(같은 머신). NSH는 화면에서 무언가 바뀔 때만 프레임을 그리므로, 여기서 *FPS*는 무언가 움직이는 동안의 속도입니다. 그려진 프레임 사이 간격의 중앙값 하나당 프레임 한 개로 계산하며(`perf.py`의 `moving`), 디스플레이가 144일 때 애니메이션이나 스크롤의 모든 프레임은 직전 프레임에서 한 번의 주사 후에 나옵니다. *Over one refresh*는 프레임이 주사 한 번(6.9 ms)보다 오래 걸린 비율입니다. Images의 GIF와 WebP는 자체 프레임 속도(여기서는 약 50 FPS)로 재생되며 비디오도 마찬가지입니다. Physics, Overlays, Menus는 내용이 짧아서 1200 × 800에서는 몇 프레임 만에 스크롤이 끝에 도달하므로, 스크롤할 공간이 있는 900 × 500 창에서 측정했습니다.

<div class="data-table">

| 페이지 | 프레임의 출처 | FPS | Frame p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | 실시간 데이터, 네이티브 루프 | 144 | 4.1 ms | 0% | 26% |
| Stocks, scrolling | 실시간 데이터, 스크롤 | 144 | 4.1 ms | 0% | 25% |
| Photos, scrolling | 스크롤 | 144 | 2.8 ms | 2% | 9% |
| Lists, scrolling | 스크롤 | 143 | 1.7 ms | 0% | 7% |
| Scrolling, scrolling | 스크롤 | 144 | 1.6 ms | 1% | 4% |
| Navigation, scrolling | 스크롤 | 143 | 1.7 ms | 0% | 2% |
| Form, scrolling | 스크롤 | 144 | 1.3 ms | 0% | 4% |
| Resizable, scrolling | 스크롤 | 143 | 0.6 ms | 0% | 1% |
| Dock, scrolling | 스크롤 | 142 | 0.5 ms | 1% | 1% |
| Gestures | 스프링, 맥동하는 링 | 144 | 1.6 ms | 0% | 1–5% |
| Physics, scrolling | 스크롤 (900 × 500 창) | 144 | 1.6 ms | 1% | 1% |
| Animations | 네이티브 루프 | 144 | 2.6 ms | 0–1% | 5% |
| Canvas, scrolling | 스크롤, 네이티브 루프 | 144 | 4.2 ms | 0% | 1–4% |
| Styles, scrolling | 스크롤 | 144 | 2.3 ms | 2% | 3% |
| Tailwind | `animate-*` 유틸리티 | 144 | 1.7 ms | 0% | 3–8% |
| Text, scrolling | 스크롤 | 144 | 1.9 ms | 0% | 4% |
| Text View, scrolling | 스크롤 | 141 | 1.8 ms | 2% | 7% |
| Images, scrolling | 스크롤, GIF 및 WebP 프레임 | 143 | 2.9 ms | 2% | 8% |
| Components, scrolling | 스크롤 | 144 | 1.4 ms | 0% | 3% |
| Overlays, scrolling | 스크롤 (900 × 500 창) | 144 | 1.7 ms | 0% | 2% |
| Menus, scrolling | 스크롤 (900 × 500 창) | 144 | 1.9 ms | 0% | 2% |
| Controls | 전환 | 144 | 0.9 ms | 0% | 1–4% |
| Web and video | 비디오 프레임, 페이지 | 135–142 | 1.0 ms | 0% | 7–8% |

</div>

<a id="memory"></a>

### 메모리

시작 3초 후 유휴 상태 기준입니다(release 러너, 480 × 640 창). *Private*은 해당 프로세스만 소유한 메모리(USS)이고, *resident*는 여기에 공유 라이브러리(GTK, GPU 드라이버)의 페이지를 더한 값으로, 머신의 모든 GTK 앱이 이를 공유합니다.

<div class="data-table">

| 앱 | 렌더러 | Private (USS) | Resident (RSS) |
|---|---|---|---|
| Rust 앱 (`nsh init --template rust`) | GL (`ngl`) | 약 49 MB | 약 142 MB |
| Rust 앱 | Cairo (`GSK_RENDERER=cairo`) | 약 28 MB | 약 95 MB |
| TSX 카운터 (`examples/counter`) | GL | 약 79 MB | 약 166 MB |
| 레이블 하나가 있는 GTK 4 창 (참고용) | Vulkan / Cairo | 약 62 / 약 40 MB | 약 132 / 약 109 MB |

</div>

페이지를 다시 방문해도 메모리는 늘지 않습니다. 페이지를 처음 방문하면 의도적으로 캐시하는 것(디코딩된 이미지, 최대 128 MB)과 처음 사용할 때 로드되는 라이브러리(웹 뷰의 경우 WebKitGTK)만큼 프로세스가 커집니다.

<a id="app-size"></a>

### 앱 크기

`nsh init`로 각 템플릿에서 만든 hello world 앱과 사람들이 실제로 쓰는 앱 두 개를, `nsh package --target linux`이 x86_64용으로 빌드한 결과입니다. 러너는 앱의 유일한 실행 파일이고, 아카이브는 앱이 배포되는 `.tar.gz`입니다. hello world 앱은 링크 타임 최적화를 적용하고 strip하여 빌드했습니다(`CARGO_PROFILE_RELEASE_LTO=fat`, `CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`, `CARGO_PROFILE_RELEASE_STRIP=true`).

<div class="data-table">

| 앱 | 작성 언어 | 러너 | 아카이브 |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 16.5 MB | 7.5 MB |
| Hello world (`--template ts`) | TSX, QuickJS 기반 | 25.7 MB | 11.6 MB |
| Hello world (`--template mixed`) | TSX와 Rust crate | 25.8 MB | 11.7 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 20.9 MB (strip됨) | 9.7 MB |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 22.3 MB | 9.8 MB |

</div>

TSX 러너에는 QuickJS 런타임, 네이티브 모듈, 렌더러가 들어 있습니다. 앱 자체 코드는 러너 옆에 있는 번들이며, hello world의 경우 1 KB 미만입니다.

이 수치를 만드는 요소는 다음과 같습니다.

- **렌더러**: NVIDIA 드라이버에서는 NSH가 GSK의 GL 렌더러로 그립니다. 이 환경에서 GL 렌더러의 프레임 비용은 Vulkan 렌더러의 일부에 불과합니다(Animations 데모: 프레임당 그리기 약 1 ms, Vulkan은 약 9.5 ms). 최종 선택은 여전히 `GSK_RENDERER`가 합니다.
- **Canvas 래스터**: 각 canvas는 GPU에 보관되는 256 px 타일로 한 번 래스터화됩니다. 애니메이션 값이 바뀌면 그 값을 읽는 연산이 덮는 영역만, 그림의 정적 부분에서 보관된 픽셀 위에 다시 그립니다. 화면 밖에 있는 canvas는 스크롤해서 보이게 될 때까지 기다립니다.
- **한 번만 따로 보관되는 경로**: 긴 경로 뒤에 오는 `fillRect`과 `fillText`은 그 경로가 다시 사용될 때까지 그대로 둡니다(400-point 선 다음 막대 240개: 0.63 ms).

## macOS (AppKit)

MacBook Pro(Apple M3, 24 GB)의 내장 120 Hz ProMotion 디스플레이에서 release 빌드로 측정했습니다. Gallery를 1200 × 800 창에서 실행했고, 모든 측정값은 `examples/gallery/tools/perf.py`(`nsh test --target macos --fps`, 초당 한 줄)이 자동으로 수집했습니다. CPU는 프로세스 전체이며 코어 하나 기준 퍼센트이고, GPU는 GPU 점유율입니다. 단계(phase)는 프레임당 메인 스레드 기준이며, *tick*(디스플레이 링크의 네이티브 애니메이션)과 *canvas*(그림 재생)가 있습니다.

<a id="animated-demos-1"></a>

### 애니메이션 데모

<div class="data-table">

| 데모 | FPS | Frame p95 | CPU | GPU |
|---|---|---|---|---|
| Stocks: 실시간 스파크라인 22개, 장중 차트, 호가창, 체결 내역 | 120 | 2.7–3.7 ms | 33–36% | 18–22% |
| Canvas: 게이지, 시계, 도트 매트릭스 | 119–120 | 0.6–0.7 ms | 4–7% | 0% |
| Animations: 네이티브 루프 3개, 스프링, 시퀀스 | 119–120 | 0.3–1.6 ms | 5–8% | 0% |

</div>

Stocks에서 프레임당 메인 스레드 시간은 tick이 약 1.6 ms이고, 이 중 약 0.45 ms는 canvas의 애니메이션 부분을 재생하는 데 쓰입니다. 각 canvas의 나머지는 Core Animation이 자체 스레드에서 그립니다.

<a id="every-page-1"></a>

### 모든 페이지

Gallery의 모든 페이지를 열 때와 테스트가 스크롤하는 동안, 같은 1200 × 800 창에서 측정했습니다. Linux와 마찬가지로 *FPS*는 무언가 움직이는 동안의 속도(그려진 프레임 사이 간격의 중앙값 하나당 프레임 한 개)이며, 디스플레이가 120일 때 애니메이션이나 스크롤의 모든 프레임은 직전 프레임에서 한 번의 주사 후에 나옵니다. *Over one refresh*는 프레임이 주사 한 번(8.3 ms)보다 오래 걸린 비율입니다. 유휴 상태의 페이지는 프레임을 그리지 않으며 CPU를 2–5% 사용합니다. Images의 GIF와 WebP는 Core Animation에서, 비디오는 AVFoundation에서 각자의 프레임 속도로 재생됩니다.

<div class="data-table">

| 페이지 | 프레임의 출처 | FPS | Frame p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | 실시간 데이터, 네이티브 루프 | 120 | 3.2 ms | 0% | 35% |
| Stocks, scrolling | 실시간 데이터, 스크롤 | 120 | 3.5 ms | 0% | 36% |
| AI Chat, scrolling | 스크롤 | 120 | 2.4 ms | 1% | 5% |
| Photos, scrolling | 스크롤 | 120 | 1.4 ms | 0% | 10% |
| Lists, scrolling | 스크롤 | 120 | 1.6 ms | 0% | 8% |
| Scrolling, scrolling | 스크롤 | 120 | 2.7 ms | 0% | 6% |
| Navigation, scrolling | 스크롤 | 120 | 0.2 ms | 0% | 4% |
| Form, scrolling | 스크롤 | 120 | 0.6 ms | 0% | 5% |
| Resizable, scrolling | 스크롤 | 120 | 0.3 ms | 0% | 4% |
| Dock, scrolling | 스크롤 | 120 | 0.3 ms | 1% | 5% |
| Gestures | 스프링, 맥동하는 링 | 120 | 0.4 ms | 0% | 4% |
| Physics, scrolling | 스크롤 | 120 | 0.3 ms | 0% | 4% |
| Animations | 네이티브 루프 | 120 | 0.3 ms | 0% | 5% |
| Canvas, scrolling | 스크롤, 네이티브 루프 | 120 | 1.2 ms | 0% | 7% |
| Styles, scrolling | 스크롤, 흔들리는 transform | 120 | 1.0 ms | 0% | 6% |
| Tailwind | `animate-*` 유틸리티 | 120 | 0.5 ms | 0% | 4% |
| Text, scrolling | 스크롤 | 120 | 0.3 ms | 0% | 5% |
| Text View, scrolling | 스크롤 | 120 | 0.7 ms | 0% | 5% |
| Images, scrolling | 스크롤 | 120 | 0.4 ms | 0% | 5% |
| Components, scrolling | 스크롤 | 120 | 0.3 ms | 0% | 5% |
| Overlays, scrolling | 스크롤 | 120 | 0.3 ms | 0% | 4% |
| Menus, scrolling | 스크롤 | 120 | 0.3 ms | 0% | 5% |
| Controls | 전환 | 120 | 0.3 ms | 0% | 4% |
| Web and video, scrolling | 스크롤 | 120 | 0.2 ms | 0% | 6% |
| System | `requestAnimationFrame`, 타이머 | 120 | 0.2 ms | 0% | 3% |
| Standard APIs, scrolling | 스크롤 | 120 | 0.3 ms | 0% | 5% |
| Storage, scrolling | 스크롤 | 120 | 0.3 ms | 0% | 5% |

</div>

<a id="memory-1"></a>

### 메모리

시작 3초 후 유휴 상태 기준입니다(release 러너). *Footprint*는 macOS가 프로세스에 부과하는 메모리(Activity Monitor에 표시되는 값)이고, *resident*는 여기에 시스템 공유 라이브러리의 페이지를 더한 값입니다.

<div class="data-table">

| 앱 | 창 | Footprint | Resident (RSS) |
|---|---|---|---|
| Rust 앱 (`nsh init --template rust`) | 1200 × 800 | 약 19 MB | 약 86 MB |
| TSX 카운터 (`examples/counter`) | 1200 × 800 | 약 20 MB | 약 89 MB |
| 레이블 하나가 있는 AppKit 창 (참고용) | 480 × 640 | 약 17 MB | 약 80 MB |

</div>

Gallery 투어를 진행하는 동안 프로세스는 Canvas 페이지까지 84–230 MB, Text View 페이지부터는 약 350–360 MB를 차지합니다. 여기에는 의도적으로 캐시하는 것(디코딩된 이미지, 최대 128 MB, Text View 페이지의 문서)과 처음 사용할 때 로드되는 프레임워크(웹 뷰의 경우 WebKit)가 포함됩니다. Canvas 페이지의 래스터는 canvas 세 개가 모두 화면에 있을 때 최대 약 310 MB이며, 페이지를 닫으면 해제됩니다.
<a id="app-size-1"></a>

### 앱 크기

각 템플릿으로 `nsh init`이(가) 만든 hello world 앱입니다. `nsh package --target macos`이(가) Apple silicon(arm64)용으로 빌드한 것이며, Linux와 마찬가지로 링크 타임 최적화를 적용하고 strip했습니다. 위의 두 앱은 Apple silicon용으로 배포되는 그대로입니다. 실행 파일은 `.app` 안의 러너이고, zip은 `.app`을(를) 압축한 것입니다(`ditto -c -k`):

<div class="data-table">

| 앱 | 작성 언어 | 실행 파일 | Zip 압축 `.app` |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 12.4 MB | 6.0 MB |
| Hello world (`--template ts`) | QuickJS 기반 TSX | 19.8 MB | 9.5 MB |
| Hello world (`--template mixed`) | TSX와 Rust crate | 19.8 MB | 9.5 MB |
| [sysmon](https://github.com/huacnlee/sysmon) 0.1.3 | Rust | 21.6 MB | 8.4 MB (해당 릴리스의 `.tar.gz`) |
| [Omasend](https://github.com/huacnlee/omasend) 0.2.0 | Rust | 18.4 MB | 9.7 MB (해당 릴리스의 `.tar.gz`) |

</div>

이 수치를 만드는 요소는 다음과 같습니다.

- **변경이 있을 때만 프레임 생성**: 네이티브 애니메이션이 실행되는 동안에만 디스플레이 링크가 틱하고, 애니메이션이 끝나면 멈춥니다. 애니메이션은 해당 페이지와 함께 멈춥니다(뷰가 삭제되면 키프레임이 끝나고, 루프는 컴포넌트의 `cleanup`에서 멈춥니다).
- **비용이 가장 적게 드는 곳에서 캔버스 그리기**: 자주 그려지는 캔버스(애니메이션, 실시간 데이터)는 Core Animation의 스레드(`drawsAsynchronously`)에서 그려 메인 스레드를 비워 둡니다. 가끔 다시 그려지는 캔버스는 비동기 그리기가 점유하는 그래픽 메모리 없이 즉시 그립니다. 애니메이션 값은 그 값을 읽는 연산이 덮는 영역만 다시 그립니다.
- **정적인 캔버스 부분 유지**: 그림이 변하지 않는 상태가 되면, 첫 번째 애니메이션 연산 앞의 긴 부분을 레이어로 유지합니다. 각 프레임에서는 그 레이어를 그리고 애니메이션되는 나머지만 메인 스레드에서 즉시 다시 실행합니다(Canvas 페이지의 게이지, 시계, 도트 매트릭스: GPU 작업 없이 메모리 절반).
- **변경될 때만 콘텐츠 그리기**: 텍스트와 캔버스는 각자의 레이어에 그려지며, 콘텐츠나 크기가 바뀔 때 다시 그려지고 이동하거나 스크롤할 때는 다시 그려지지 않습니다.

## Windows (Win32, Direct2D)

Windows 11 데스크톱(Intel Core i7-13700KF, 32 GB, NVIDIA GeForce RTX 3060 Ti)에서 150% 배율의 4K 144 Hz 디스플레이로 측정했습니다. 릴리스 빌드이고, 갤러리는 1200 × 800 창(1800 × 1200 픽셀)이며, 모든 측정값은 `examples/gallery/tools/perf.py`(`nsh test --target windows --fps`, 초당 한 줄)이(가) 자동으로 수집했습니다. CPU는 프로세스 전체이며 코어 하나 기준 백분율입니다. 단계는 프레임당 메인 스레드 기준이며, *paint*(Direct2D가 창을 그리는 시간)와 그 안의 *canvas*(그림을 기록하고 다시 실행하는 시간)로 나뉩니다.

<a id="animated-demos-2"></a>

### 애니메이션 데모

<div class="data-table">

| 데모 | FPS | 프레임 p95 | 프레임당 Paint / canvas | CPU |
|---|---|---|---|---|
| Stocks: 실시간 스파크라인 22개, 일중 차트, 호가창, 체결 내역 | 144 | 3.7–4.3 ms | 1.4 / 0.13 ms | 36–43% |
| Canvas: 게이지, 시계, 도트 매트릭스 | 144 | 1.0–2.0 ms | 0.8–1.4 / 0.05 ms | 21–35% |
| Animations: 네이티브 루프 3개, 스프링, 시퀀스 | 144 | 1.0–3.6 ms | 0.9–1.9 ms | 20–41% |

</div>

Stocks는 초당 16–17회 커밋하며, 각 커밋은 엔진 스레드에서 JS 최대 2.1 ms와 코어 1.7 ms가 걸립니다(p95).

> [!NOTE]
> 큰 영역에 걸쳐 뷰를 움직이는 애니메이션이 있는 페이지는 Linux와 macOS보다 여기서 CPU를 더 많이 사용합니다(Animations 20–41% 대 5–13%, Gestures 36% 대 1–5%). Windows에서는 한 프레임마다 변경된 영역 위의 모든 뷰를 메인 스레드에서 Direct2D로 다시 그립니다. 커지는 링은 매 프레임마다 그 아래의 카드를 다시 그립니다. macOS에서는 Core Animation이 유지 중인 레이어를 다시 그리지 않고 GPU에서 이동, 확대·축소, 페이드하며, Linux에서는 GSK가 변경되지 않은 부분의 렌더 노드를 유지합니다. 또한 이 수치에는 1800 × 1200 픽셀에서 초당 144프레임이 반영되어 있습니다.

<a id="every-page-2"></a>

### 모든 페이지

갤러리의 모든 페이지를, 열릴 때와 테스트가 스크롤하는 동안 동일한 1200 × 800 창에서 측정했습니다. Linux와 macOS에서처럼 *FPS*는 무언가 움직이는 동안의 속도이며(그려진 프레임 사이 간격의 중앙값당 한 프레임), 디스플레이의 144 Hz에서는 애니메이션이나 스크롤의 모든 프레임이 직전 프레임으로부터 한 번의 새로 고침 뒤에 나옵니다. *Over one refresh*는 새로 고침 한 번(6.9 ms)보다 오래 걸린 프레임의 비율입니다. 정지 상태의 페이지는 프레임을 그리지 않으며 CPU를 0–2% 사용합니다. Images의 GIF와 WebP는 각자의 프레임 속도(여기서는 약 40 FPS)로 재생됩니다. Physics, Overlays, Menus, Storage는 스크롤할 공간이 있는 900 × 500 창에서 측정했습니다.

<div class="data-table">

| 페이지 | 프레임 발생원 | FPS | 프레임 p95 | Over one refresh | CPU |
|---|---|---|---|---|---|
| Stocks | 실시간 데이터, 네이티브 루프 | 144 | 3.9 ms | 0% | 36% |
| Stocks, scrolling | 실시간 데이터, 스크롤 | 144 | 4.3 ms | 0% | 43% |
| Photos, scrolling | 스크롤 | 143 | 2.1 ms | 0% | 9% |
| Lists, scrolling | 스크롤 | 144 | 2.0 ms | 1% | 19% |
| Scrolling, scrolling | 스크롤 | 143 | 2.1 ms | 0% | 7% |
| Navigation, scrolling | 스크롤 | 144 | 0.8 ms | 0% | 9% |
| Form, scrolling | 스크롤 | 144 | 0.8 ms | 0% | 12% |
| Resizable, scrolling | 스크롤 | 143 | 0.4 ms | 0% | 4% |
| Dock, scrolling | 스크롤 | 144 | 0.5 ms | 1% | 5% |
| Gestures | 스프링, 맥동하는 링 | 144 | 1.8 ms | 0% | 36% |
| Physics, scrolling | 스크롤 (900 × 500 창) | 144 | 0.8 ms | 0% | 4% |
| Animations | 네이티브 루프 | 144 | 1.0 ms | 0% | 28% |
| Canvas, scrolling | 스크롤, 네이티브 루프 | 144 | 2.0 ms | 0% | 35% |
| Styles, scrolling | 스크롤, 흔들리는 transform | 144 | 2.1 ms | 0% | 39% |
| Tailwind | `animate-*` 유틸리티 | 144 | 0.6 ms | 0% | 19% |
| Text, scrolling | 스크롤 | 144 | 1.6 ms | 0% | 8% |
| Text View, scrolling | 스크롤 | 144 | 1.1 ms | 0% | 10% |
| Images, scrolling | 스크롤, GIF 및 WebP 프레임 | 143 | 4.8 ms | 2% | 23% |
| Components, scrolling | 스크롤 | 144 | 1.0 ms | 1% | 11% |
| Overlays, scrolling | 스크롤 (900 × 500 창) | 144 | 0.6 ms | 0% | 1% |
| Menus, scrolling | 스크롤 (900 × 500 창) | 144 | 0.6 ms | 0% | 2% |
| Controls | 트랜지션 | 117–144 | 1.5 ms | 0% | 22% |
| Web and video, scrolling | 스크롤 | 144 | 1.6 ms | 0% | 15% |
| System | `requestAnimationFrame`, 타이머 | 144 | < 0.1 ms | 0% | 1% |
| Storage, scrolling | 스크롤 (900 × 500 창) | 144 | 0.5 ms | 0% | 1% |

</div>

<a id="memory-2"></a>

### 메모리

시작 3초 후 정지 상태에서 측정했습니다(릴리스 러너, 1200 × 800 창). *Private working set*은 프로세스 단독으로 사용하는 메모리(Task Manager의 Memory 열)이고, *private bytes*는 프로세스가 커밋한 메모리이며, *working set*은 여기에 다른 프로세스와 공유하는 시스템 라이브러리(Direct3D, Direct2D, DirectWrite, GPU 드라이버)의 페이지를 더한 값입니다.

<div class="data-table">

| 앱 | Private working set | Private bytes | Working set |
|---|---|---|---|
| Rust 앱 (`nsh init --template rust`) | ~14 MB | ~60 MB | ~53–71 MB |
| TSX 카운터 (`examples/counter`) | ~15 MB | ~61 MB | ~56–71 MB |

</div>

갤러리 투어 중 working set은 Stocks에서 ~108–115 MB, Canvas 페이지부터 ~230 MB, Text View 페이지부터 ~320–340 MB, Web and video가 WebView2를 연 뒤에는 ~390–405 MB입니다(WebView2의 페이지는 WebView2 자체 프로세스에서 실행됩니다). 여기에는 의도적으로 캐시하는 항목(128 MB로 제한된 디코딩된 이미지, Text View 페이지의 문서)이 포함됩니다.

<a id="app-size-2"></a>

### 앱 크기

각 템플릿으로 `nsh init`이(가) 만든 hello world 앱입니다. `nsh package --target windows`이(가) x86_64용으로 빌드한 것이며(Rust 러너는 Linux와 마찬가지로 링크 타임 최적화를 적용하고 strip함), 실행 파일은 앱의 `<Name>.exe`이고, zip은 해당 디렉터리 옆에 작성되는 `.zip`입니다.

<div class="data-table">

| 앱 | 작성 언어 | 실행 파일 | Zip |
|---|---|---|---|
| Hello world (`--template rust`) | Rust | 15.0 MB | 6.7 MB |
| Hello world (`--template ts`) | QuickJS 기반 TSX | 28.6 MB | 12.4 MB |
| Hello world (`--template mixed`) | TSX와 Rust crate | 26.3 MB | 11.5 MB |

</div>

이 수치를 만드는 요소는 다음과 같습니다.

- **변경이 있을 때만 프레임 생성, 변경된 곳만 그리기**: 컴포지터에 맞춰 동작하는 티커는 네이티브 애니메이션, 트랜지션 또는 프레임 콜백이 실행되는 동안 작동합니다. 프레임은 변경된 뷰의 영역(이전 위치와 현재 위치)을 창이 유지하는 픽셀 위에 그리고, 그 부분만 컴포지터에 표시합니다(Stocks: 프레임당 뷰 ~34개).
- **캔버스는 애니메이션되는 부분을 기록**: 그림은 Direct2D 커맨드 리스트로 기록되어 어떤 배율에서도 벡터로 선명합니다. 애니메이션 값이 바뀌면, 애니메이션 값을 읽는 첫 연산부터 그 이후의 연산만 다시 기록하고 그 앞부분은 유지합니다(Stocks: 맥동하는 스파크라인 22개와 차트에 대해 초당 ~26 ms의 기록).
- **보이는 것만 그리기**: 스크롤 뷰나 클리핑 뷰의 자식 중 화면 밖에 있는 것은 프레임에서 제외되며, 자체 콘텐츠가 없는 뷰는 배경과 테두리만 그립니다.

## iOS (UIKit)

위의 MacBook Pro에서 iOS 시뮬레이터(iPhone 18 Pro Max)로 측정했습니다. 릴리스 빌드이고, 동일한 투어(`perf.py --target ios`: `nsh test --target ios --fps`, UIKit이 받는 그대로의 손가락 터치)를 사용했습니다. 시뮬레이터는 60 Hz로 표시하며, ProMotion 화면이 있는 iPhone에서는 NSH의 디스플레이 링크가 화면의 120 Hz로 실행됩니다(`nsh package`이(가) 빌드하는 앱과 개발 호스트는 `CADisableMinimumFrameDurationOnPhone`(으)로 이를 요청합니다). 단계는 *tick*(네이티브 애니메이션), *drain*(엔진의 배치 적용), *scroll*(스크롤 뷰를 따르는 작업: 리스트, 스티키 셀, 바인딩된 값)입니다.

<div class="data-table">

| 페이지 | 프레임 발생원 | FPS | 프레임 p95 | CPU |
|---|---|---|---|---|
| Home, scrolling | 스크롤 | 60 | 0.1 ms | 6% |
| Stocks | 실시간 데이터, 네이티브 루프 | 60 | 0.3 ms | 22% |
| Stocks, scrolling | 실시간 데이터, 스크롤 | 60 | 0.3 ms | 25% |
| Photos, scrolling | 스크롤 | 60 | 1.2 ms | 6% |
| Lists, scrolling | 스크롤 | 60 | 1.1 ms | 8% |
| Scrolling, scrolling | 스크롤 | 60 | 0.1 ms | 7% |
| Navigation, scrolling | 스크롤 | 60 | 0.2 ms | 7% |
| Form, scrolling | 스크롤 | 60 | 0.3 ms | 7% |
| Gestures | 스프링, 맥동하는 링 | 60 | 0.3 ms | 3% |
| Animations | 네이티브 루프 | 60 | 0.7 ms | 6% |
| Canvas | 네이티브 루프 | 60 | 0.4 ms | 16% |
| Styles | 흔들리는 transform | 60 | 0.4 ms | 4% |
| Tailwind, scrolling | 스크롤 | 60 | 0.2 ms | 7% |
| Text, scrolling | 스크롤 | 60 | 0.1 ms | 7% |
| Text View, scrolling | 스크롤 | 60 | 0.1 ms | 6% |
| Images, scrolling | 스크롤 | 60 | 0.1 ms | 5% |
| Components, scrolling | 스크롤 | 60 | 0.2 ms | 6% |
| Overlays, scrolling | 스크롤 | 60 | 0.1 ms | 6% |
| Menus, scrolling | 스크롤 | 60 | 0.2 ms | 7% |
| Controls, scrolling | 스크롤, 트랜지션 | 60 | 0.2 ms | 5% |
| Web and video, scrolling | 스크롤 | 60 | 0.1 ms | 8% |
| System | `requestAnimationFrame`, 타이머 | 60 | 0.3 ms | 4% |
| Standard APIs, scrolling | 스크롤 | 60 | 0.1 ms | 7% |
| Storage, scrolling | 스크롤 | 60 | 0.1 ms | 8% |

</div>

*FPS*는 위와 마찬가지로 무언가 움직이는 동안의 속도입니다. 시뮬레이터의 60 Hz에서는 모든 프레임이 직전 프레임으로부터 한 번의 새로 고침 뒤에 나옵니다. 움직임이 없는 모든 페이지는 프레임을 그리지 않으며 정지 상태에서 CPU를 1–2% 사용합니다. 프로세스는 갤러리 홈 페이지에서 40 MB, 전체 투어 후에는 ~180 MB를 점유합니다(의도적으로 캐시한 이미지, Text View 페이지의 문서).

iPhone 17 Pro(ProMotion, 120 Hz)에서 개발 호스트와 데모 하나를 화면에 띄운 상태로 측정하면, 애니메이션 페이지는 매 새로 고침마다 프레임을 그립니다.

<div class="data-table">

| 페이지 | 프레임 발생원 | FPS | 프레임 p95 | Over one refresh | CPU | 메모리 |
|---|---|---|---|---|---|---|
| Stocks | 실시간 데이터, 네이티브 루프 | 120 | 0.2–0.3 ms | 0% | 46–70% | 41–43 MB |
| Canvas | 네이티브 루프 | 120 | 0.1 ms | 0% | 25–36% | 37–38 MB |
| Animations | 네이티브 루프 | 120 | 0.2 ms | 0% | 3–11% | 37 MB |

</div>

Stocks는 초당 20회 커밋하며(50 ms마다 틱), 각 커밋은 엔진 스레드에서 JS 1.5 ms와 코어 1.4 ms가 걸립니다(p95는 2.2 ms와 2.0 ms). 이때 엔진 스레드는 시간의 4–6% 동안 사용 중입니다.

<a id="measuring-an-app"></a>

## 앱 측정하기

같은 방식으로 앱을 측정하려면, `--target linux`, `macos`, `windows` 또는 `ios`에서 `--fps`과(와) `-v`(으)로 앱의 테스트나 스텝을 실행하세요.

```sh
cargo build --release -p nsh-cli
python3 examples/gallery/tools/perf.py --target macos --only Stocks,Canvas   # the gallery, page by page
echo 'await app.wait(5000)' | nsh -v test App.tsx --target linux --fps        # any app
```
