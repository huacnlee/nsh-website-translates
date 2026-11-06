---
title: "使用 LayerFS 進行本機開發"
description: "使用 Native Shell checkout 的 Linux LayerFS 試用功能來擷取 Cargo 建置輸出、分叉工作區,並驗證快照重用。"
order: 61.5
group: tools
source_hash: 827ff94d53cb27ed
---

Native Shell 的儲存庫內含本機 LayerFS 工作流程，用來測試可重用的建置工作區。它會匯入已提交的原始碼樹，在 Linux Sandbox 內執行 Cargo，儲存產生的檔案，再從該已儲存狀態的 fork 再次執行測試。原始碼編輯和 Git 提交都在你現有的 NSH 檢出內進行。

> [!IMPORTANT]
> 此工作流程需要 Docker Engine 和 Linux FUSE。Docker 負責執行控制程序和 Sandbox；FUSE 則在 Sandbox 內掛載工作區。在 macOS 上，開發指令會透過 OrbStack 等本機 Docker engine 準備此 Linux 部署環境。

<a id="what-the-snapshot-saves"></a>

## 快照會儲存甚麼

LayerFS 儲存的是檔案系統樹：原始碼檔案、Git 中繼資料、被忽略的檔案，以及在工作區內產生的建置輸出。Fork 會從已儲存的樹開始，並記錄自己的變更。這讓多個任務可以從同一個已建置的狀態開始，同時保持各自的變更互相獨立。

在 NSH 的本機試驗中，第一個分支會執行 `nsh-package` 的測試，並儲存 `target/` 和一個被忽略的探測檔案。第二個分支從該提交開始，檢查這些檔案，並在離線狀態下重複執行測試。第三個分支則從原始的原始碼狀態開始，用來驗證隔離性。

| 階段 | 發生的事 |
| --- | --- |
| Init | 匯入檢出內容的 `HEAD` 提交匯出內容，以及全新的 `.git` 目錄 |
| Build | Fork 一個工作區並執行 `cargo +1.98.1 test --locked -p nsh-package` |
| Commit | 將產生的 `target/` 和探測檔案儲存到 LayerFS 歷史記錄中 |
| Reuse | Fork 已儲存的分支，掛載它，並以 `--offline` 重複執行測試 |
| Verify | 讀取提交歷史記錄，並檢查原始的原始碼分支維持乾淨 |

每次呼叫都會建立全新的 Store 並執行這個完整流程。快照重用發生在該次呼叫的各個分支之間。此試驗要衡量的好處，是取得另一個可用且已通過測試的工作區所需的成本，包括掛載、提交和卸載的時間。

<a id="prepare-the-development-environment"></a>

## 準備開發環境

請使用 [NSH 儲存庫](https://github.com/longbridge/nsh)的檢出內容，並具備以下條件：

- 一個本機 Linux Docker engine，其 Store 磁碟區使用 ext4、XFS 或 Btrfs，可在 Linux 上執行，或透過 OrbStack 等 macOS 環境執行。
- Docker Engine 提供 API 1.54 或更新版本；已驗證的本機設定使用 Engine 29.7.2。
- `/dev/fuse`，並允許 Docker 向 Sandbox 開放該裝置和 `CAP_SYS_ADMIN`。
- Git 和 Python 3.12 或更新版本；在 Linux 上還需要 rustup 和 C/C++ 編譯器。
- 可連線至網絡，以取得固定版本的 LayerFS 原始碼、Cargo 相依套件和執行環境映像檔。

此試驗建置 LayerFS **1.0.0**，固定於原始碼提交 `2aaf2552ce21154928b9f9c83582e41a637f5910`。其執行環境映像檔為 Linux 程序提供 Rust 1.98.1、Node 和 clang。[上游 SDK 指南](https://github.com/Ephemeral-AI-Lab/layerfs/blob/v1.0.0/sdk/js/README.md)說明了 Store 和 Sandbox 的生命週期。

請在 NSH 檢出內容的根目錄執行以下指令：

```sh
./scripts/layerfs prepare
./scripts/layerfs smoke
./scripts/layerfs status
```

此可執行檔會選用 Python 3.12 或更新版本（包括 macOS 上 Homebrew 的安裝），並從目前使用中的 Docker context 找出 socket。如要明確選擇本機 socket，請使用 `--docker-socket PATH`。

`prepare` 會檢查 Docker API、安裝 Rust 1.85.1，並建置固定版本的 daemon、Node addon 和執行環境映像檔。在 macOS 上，這些項目會在臨時的 Linux 建置容器中準備。它會重用慣常的 Cargo registry 和 `target/`，包括既有的 `CARGO_TARGET_DIR` 設定。確切的執行環境映像檔 ID 和 daemon 路徑會記錄在 `.nsh/layerfs/deployment.json`。`status` 會檢查已儲存的建置輸出和映像檔，並顯示最新的驗證結果。

`smoke` 會根據檢出內容中**已提交的 `HEAD`** 建立 `.nsh/layerfs/nsh-<id>/input`，然後將該輸入匯入新的 Store。如要包含原始碼編輯，請在執行前先將它們提交到你的主題分支。產生的輸入以全新的 Git 儲存庫開始，並在 Sandbox 內取得其建置輸出。

控制程序會在具名的本機 Docker 磁碟區中開啟 Store。Sandbox daemon 開啟同一個 Store，並掛載該分支的檔案系統檢視；Cargo 則在這個已掛載的工作區中執行。你平常的檢出內容仍然是編輯和提交原始碼變更的地方。

<a id="read-the-result"></a>

## 閱讀結果

指令會印出收據目錄和 Store 磁碟區名稱。開啟產生的 `result.json`，檢查 `"ok": true` 以及各階段的所用時間。同一個目錄還包含 `settings.json`（用來識別原始碼提交和映像檔）以及 `trace.jsonl`（記錄 SDK 呼叫）。

本機驗證在建置和重用階段各執行了 22 個套件測試。最初的建置／測試階段包含相依套件下載；離線階段則使用已儲存的 `target/` 以及同一個 Sandbox 的 Cargo registry。評估其價值時，請將完整週期與你的工作負載上的一般 Cargo 建置作比較。

重用已建置的狀態時，請使用相符的作業系統、架構、工具鏈和相依套件。本指南的工作負載是 Linux `nsh-package` 測試套件；平台 UI 檢查則使用各自的平台環境（[測試](./testing-and-trace.md)）。

<a id="keep-useful-work-and-manage-the-store"></a>

## 保留有用的成果並管理 Store

請將原始碼變更保留在 Git 中，並透過 pull request 提交。此試驗為可重新建置的工作區歷史記錄使用 LayerFS 的 **Disposable** Store 設定檔。記錄量度數據時，請另外保留有用的收據。

產生的輸入會在初始提交期間停用 Git 的自動維護，讓 LayerFS 匯入時物件資料庫保持穩定。試驗中的 Git 狀態檢查使用 `--no-optional-locks`，讓讀取狀態時保留原有的 index。如果是自訂腳本，請在匯入或提交樹之前，先讓背景寫入程序完成。

已成功卸載的 Sandbox 會在 LayerFS 的閒置逾時後停止。每次試驗都會保留其 Store 磁碟區；請依收據中的識別碼，管理該特定磁碟區及其容器。失敗的操作會保留其記錄的狀態以供診斷。[維護者參考文件](../../docs/dev/layerfs.md)涵蓋了腳本、收據和資源清理。
