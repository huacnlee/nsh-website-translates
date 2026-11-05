---
title: "LayerFS를 이용한 로컬 개발"
description: "Native Shell 체크아웃의 Linux LayerFS 트라이얼을 사용하여 Cargo 빌드 결과물을 캡처하고, 워크스페이스를 포크하며, 스냅샷 재사용을 확인합니다."
order: 61.5
group: tools
source_hash: 827ff94d53cb27ed
---

Native Shell 저장소에는 재사용 가능한 빌드 워크스페이스를 테스트하기 위한 로컬 LayerFS 워크플로가 포함되어 있습니다. 이 워크플로는 커밋된 소스 트리를 가져와 Linux Sandbox 안에서 Cargo를 실행하고, 생성된 파일을 저장한 다음, 저장된 상태에서 분기(fork)한 워크스페이스에서 테스트를 다시 실행합니다. 소스 편집과 Git 커밋은 기존 NSH 체크아웃에서 수행합니다.

> [!IMPORTANT]
> 이 워크플로에는 Docker Engine과 Linux FUSE가 필요합니다. Docker는 제어 프로세스와 Sandbox를 실행하고, FUSE는 Sandbox 내부에 워크스페이스를 마운트합니다. macOS에서는 개발 명령이 OrbStack과 같은 로컬 Docker 엔진을 통해 이 Linux 배포 환경을 준비합니다.

<a id="what-the-snapshot-saves"></a>

## 스냅샷이 저장하는 내용

LayerFS는 파일 시스템 트리를 저장합니다. 여기에는 소스 파일, Git 메타데이터, 무시된 파일, 그리고 워크스페이스 안에서 생성된 빌드 출력이 포함됩니다. fork는 저장된 트리에서 시작하며 자체 변경 사항을 별도로 기록합니다. 따라서 여러 작업이 동일한 빌드 상태에서 시작하면서도 각자의 변경 사항을 분리해서 유지할 수 있습니다.

NSH의 로컬 시험에서 첫 번째 브랜치는 `nsh-package`의 테스트를 실행하고 `target/`와 무시되는 프로브 파일을 저장합니다. 두 번째 브랜치는 해당 커밋에서 시작하여 그 파일들을 확인하고 오프라인 상태에서 테스트를 반복합니다. 세 번째 브랜치는 원래 소스 상태에서 시작하여 격리가 유지되는지 검증합니다.

| 단계 | 수행 내용 |
| --- | --- |
| Init | 체크아웃의 `HEAD` 커밋을 내보낸 결과와 새로운 `.git` 디렉터리를 가져옵니다 |
| Build | 워크스페이스를 fork하고 `cargo +1.98.1 test --locked -p nsh-package`를 실행합니다 |
| Commit | 생성된 `target/`와 프로브 파일을 LayerFS 히스토리에 저장합니다 |
| Reuse | 저장된 브랜치를 fork하여 마운트하고 `--offline`로 테스트를 반복합니다 |
| Verify | 커밋 히스토리를 읽고 원래 소스 브랜치가 깨끗하게 유지되는지 확인합니다 |

각 실행은 새로운 Store를 만들고 이 전체 순서를 수행합니다. 스냅샷 재사용은 해당 실행 내의 브랜치 사이에서 이루어집니다. 이 시험에서 측정할 이점은 마운트, 커밋, 언마운트 시간을 포함하여, 테스트까지 마친 사용 가능한 또 다른 워크스페이스에 도달하는 데 드는 비용입니다.

<a id="prepare-the-development-environment"></a>

## 개발 환경 준비

다음 조건을 갖춘 [NSH 저장소](https://github.com/longbridge/nsh) 체크아웃을 사용합니다.

- Store 볼륨에 ext4, XFS 또는 Btrfs를 사용하는 로컬 Linux Docker 엔진. Linux에서 실행하거나 OrbStack 같은 macOS 환경을 통해 실행합니다.
- API 1.54 이상을 제공하는 Docker Engine. 검증된 로컬 환경은 Engine 29.7.2를 사용합니다.
- `/dev/fuse`. Docker가 해당 장치와 `CAP_SYS_ADMIN`를 Sandbox에 노출할 수 있도록 허용되어 있어야 합니다.
- Git과 Python 3.12 이상. Linux에서는 rustup과 C/C++ 컴파일러도 필요합니다.
- 고정된 LayerFS 소스, Cargo 의존성, 런타임 이미지를 가져올 수 있는 네트워크 접근.

이 시험은 소스 커밋 `2aaf2552ce21154928b9f9c83582e41a637f5910`에 고정된 LayerFS **1.0.0**을 빌드합니다. 런타임 이미지는 Linux 프로세스용으로 Rust 1.98.1, Node, clang을 제공합니다. [업스트림 SDK 가이드](https://github.com/Ephemeral-AI-Lab/layerfs/blob/v1.0.0/sdk/js/README.md)에서 Store와 Sandbox의 수명 주기를 설명합니다.

다음 명령은 NSH 체크아웃의 루트에서 실행합니다.

```sh
./scripts/layerfs prepare
./scripts/layerfs smoke
./scripts/layerfs status
```

이 실행 파일은 macOS의 Homebrew 설치본을 포함하여 Python 3.12 이상을 선택하고, 활성 Docker 컨텍스트에서 소켓을 찾아냅니다. 로컬 소켓을 명시적으로 선택하려면 `--docker-socket PATH`를 사용하세요.

`prepare`는 Docker API를 확인하고, Rust 1.85.1을 설치하며, 고정된 데몬, Node 애드온, 런타임 이미지를 빌드합니다. macOS에서는 임시 Linux 빌드 컨테이너에서 이를 준비합니다. 일반적인 Cargo 레지스트리와 `target/`를 재사용하며, 기존 `CARGO_TARGET_DIR` 설정도 그대로 따릅니다. 정확한 런타임 이미지 ID와 데몬 경로는 `.nsh/layerfs/deployment.json`에 기록됩니다. `status`는 저장된 빌드 출력과 이미지를 확인하고 최신 검증 결과를 보여줍니다.

`smoke`는 체크아웃의 **커밋된 `HEAD`**에서 `.nsh/layerfs/nsh-<id>/input`를 생성한 다음, 해당 입력을 새로운 Store로 가져옵니다. 소스 편집 내용을 포함하려면 실행하기 전에 토픽 브랜치에 커밋하세요. 생성된 입력은 새로운 Git 저장소로 시작하며, 빌드 출력은 Sandbox 안에서 얻습니다.

제어 프로세스는 이름이 지정된 로컬 Docker 볼륨에서 Store를 엽니다. Sandbox 데몬은 동일한 Store를 열어 브랜치의 파일 시스템 뷰를 마운트하며, Cargo는 마운트된 워크스페이스에서 실행됩니다. 소스 변경 사항을 편집하고 커밋하는 곳은 여전히 일반 체크아웃입니다.

<a id="read-the-result"></a>

## 결과 확인

이 명령은 영수증(receipt) 디렉터리와 Store 볼륨 이름을 출력합니다. 생성된 `result.json`를 열어 `"ok": true`와 각 단계별 소요 시간을 확인하세요. 같은 디렉터리에는 소스 커밋과 이미지를 식별하는 `settings.json`와 SDK 호출을 기록하는 `trace.jsonl`도 있습니다.

로컬 검증에서는 빌드 단계와 재사용 단계에서 각각 22개의 패키지 테스트를 실행했습니다. 초기 빌드/테스트 단계에는 의존성 다운로드가 포함되었고, 오프라인 단계에서는 저장된 `target/`와 동일한 Sandbox의 Cargo 레지스트리를 사용했습니다. 그 가치를 평가할 때는 전체 사이클을 사용자의 워크로드에서 수행한 일반 Cargo 빌드와 비교하세요.

빌드된 상태를 재사용할 때는 운영 체제, 아키텍처, 툴체인, 의존성이 일치하는 환경을 사용하세요. 이 가이드의 워크로드는 Linux `nsh-package` 테스트 스위트이며, 플랫폼 UI 검사는 각 플랫폼 환경에서 수행합니다([Testing](./testing-and-trace.md)).

<a id="keep-useful-work-and-manage-the-store"></a>

## 유용한 작업 보존과 Store 관리

소스 변경 사항은 Git에 보관하고 pull request를 통해 제출하세요. 이 시험은 다시 빌드할 수 있는 워크스페이스 히스토리를 위해 LayerFS의 **Disposable** Store 프로필을 사용합니다. 측정 결과를 기록할 때는 유용한 영수증을 별도로 보관하세요.

생성된 입력은 초기 커밋 중에 Git 자동 유지 관리를 비활성화하여, LayerFS가 가져오는 동안 객체 데이터베이스가 안정적으로 유지되도록 합니다. 시험 내부의 Git 상태 확인에는 `--no-optional-locks`를 사용하므로, 상태를 읽어도 원래 인덱스가 보존됩니다. 사용자 지정 스크립트에서는 트리를 가져오거나 커밋하기 전에 백그라운드 쓰기 작업을 모두 끝내세요.

정상적으로 언마운트된 Sandbox는 LayerFS의 유휴 타임아웃 이후 중지됩니다. 각 시험은 자체 Store 볼륨을 유지하므로, 영수증에 있는 식별자를 기준으로 해당 볼륨과 컨테이너를 관리하세요. 실패한 작업은 진단을 위해 기록된 상태를 그대로 유지합니다. 스크립트, 영수증, 리소스 정리에 대해서는 [유지 관리자 참조 문서](../../docs/dev/layerfs.md)를 확인하세요.
