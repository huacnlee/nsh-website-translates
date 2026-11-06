---
title: "使用 LayerFS 進行本機開發"
description: "使用 Native Shell checkout 的 Linux LayerFS 試用功能來擷取 Cargo 建置輸出、分叉工作區,並驗證快照重複使用。"
order: 61.5
group: tools
---

Native Shell 的儲存庫包含一套本機 LayerFS 工作流程，用來測試可重複使用的建置工作區。它會匯入已提交的原始碼樹，在 Linux Sandbox 內執行 Cargo，儲存產生的檔案，並從該儲存狀態的 fork 再次執行測試。原始碼編輯與 Git 提交仍在你現有的 NSH checkout 中進行。

> [!IMPORTANT]
> 此工作流程需要 Docker Engine 與 Linux FUSE。Docker 負責執行控制程序與 Sandbox；FUSE 則在 Sandbox 內掛載工作區。在 macOS 上，開發指令會透過 OrbStack 等本機 Docker engine 準備此 Linux 部署。

<a id="what-the-snapshot-saves"></a>

## 快照會儲存什麼

LayerFS 儲存的是檔案系統樹：原始碼檔案、Git 中繼資料、被忽略的檔案，以及在工作區內產生的建置輸出。fork 會從已儲存的樹開始，並記錄自己的變更。如此一來，多個任務可以從同一個已建置的狀態出發，同時保持各自的變更互相獨立。

在 NSH 的本機試驗中，第一個分支會執行 `nsh-package` 的測試，並儲存 `target/` 以及一個被忽略的探測檔案。第二個分支從該 commit 開始，檢查這些檔案，並在離線狀態下重複執行測試。第三個分支則從原始的原始碼狀態開始，用來驗證隔離性。

| 階段 | 執行內容 |
| --- | --- |
| Init | 匯入 checkout 的 `HEAD` commit 匯出內容，以及全新的 `.git` 目錄 |
| Build | fork 一個工作區並執行 `cargo +1.98.1 test --locked -p nsh-package` |
| Commit | 將產生的 `target/` 與探測檔案儲存至 LayerFS 歷史紀錄 |
| Reuse | fork 已儲存的分支、掛載它，並以 `--offline` 重複執行測試 |
| Verify | 讀取 commit 歷史紀錄，並確認原始的原始碼分支維持乾淨 |

每次呼叫都會建立全新的 Store，並執行完整的上述流程。快照的重複使用發生在該次呼叫的各個分支之間。此試驗要衡量的效益，是取得另一個可用且已通過測試的工作區所需的成本，包括掛載、commit 與卸載的時間。

<a id="prepare-the-development-environment"></a>

## 準備開發環境

請使用 [NSH 儲存庫](https://github.com/longbridge/nsh)的 checkout，並具備以下條件：

- 一個本機 Linux Docker engine，其 Store volume 使用 ext4、XFS 或 Btrfs，可在 Linux 上執行，或透過 OrbStack 等 macOS 環境執行。
- Docker Engine 提供 API 1.54 或更新版本；已驗證的本機設定使用 Engine 29.7.2。
- `/dev/fuse`，且 Docker 須允許將該裝置與 `CAP_SYS_ADMIN` 暴露給 Sandbox。
- Git 與 Python 3.12 或更新版本；在 Linux 上還需要 rustup 與 C/C++ 編譯器。
- 可連線的網路，用於取得固定版本的 LayerFS 原始碼、Cargo 相依套件與執行階段映像檔。

此試驗會建置 LayerFS **1.0.0**，固定於原始碼 commit `2aaf2552ce21154928b9f9c83582e41a637f5910`。其執行階段映像檔為 Linux 程序提供 Rust 1.98.1、Node 與 clang。[上游 SDK 指南](https://github.com/Ephemeral-AI-Lab/layerfs/blob/v1.0.0/sdk/js/README.md)說明了 Store 與 Sandbox 的生命週期。

請在 NSH checkout 的根目錄執行以下指令：

```sh
./scripts/layerfs prepare
./scripts/layerfs smoke
./scripts/layerfs status
```

此可執行檔會選用 Python 3.12 或更新版本（包括 macOS 上 Homebrew 安裝的版本），並從目前作用中的 Docker context 找出 socket。可使用 `--docker-socket PATH` 明確指定本機 socket。

`prepare` 會檢查 Docker API、安裝 Rust 1.85.1，並建置固定版本的 daemon、Node addon 與執行階段映像檔。在 macOS 上，這些項目會在暫時的 Linux 建置容器中準備。它會重複使用一般的 Cargo registry 與 `target/`，包括既有的 `CARGO_TARGET_DIR` 設定。確切的執行階段映像檔 ID 與 daemon 路徑會記錄於 `.nsh/layerfs/deployment.json`。`status` 會檢查已儲存的建置輸出與映像檔，並顯示最近一次的驗證結果。

`smoke` 會從 checkout 中**已提交的 `HEAD`** 建立 `.nsh/layerfs/nsh-<id>/input`，然後將該輸入匯入新的 Store。若要包含原始碼的編輯內容，請在執行前先將它們提交到你的主題分支。產生的輸入會從全新的 Git 儲存庫開始，並在 Sandbox 內取得其建置輸出。

控制程序會在具名的本機 Docker volume 中開啟 Store。Sandbox daemon 會開啟同一個 Store，並掛載該分支的檔案系統檢視；Cargo 在該掛載的工作區中執行。你一般的 checkout 仍是編輯與提交原始碼變更的地方。

<a id="read-the-result"></a>

## 讀取結果

此指令會印出收據目錄與 Store volume 名稱。開啟產生的 `result.json`，即可查看 `"ok": true` 以及各階段的耗時。同一個目錄中還有用來識別原始碼 commit 與映像檔的 `settings.json`，以及記錄 SDK 呼叫的 `trace.jsonl`。

本機驗證在 build 與 reuse 階段各執行了 22 個套件測試。初始的建置／測試階段包含相依套件的下載；離線階段則使用已儲存的 `target/` 與同一個 Sandbox 的 Cargo registry。在評估其價值時，請將完整週期與你工作負載上一般的 Cargo 建置相比較。

重複使用已建置的狀態時，請使用相同的作業系統、架構、工具鏈與相依套件。本指南的工作負載是 Linux 的 `nsh-package` 測試套件；平台 UI 檢查則使用各自的平台環境（[Testing](./testing-and-trace.md)）。

<a id="keep-useful-work-and-manage-the-store"></a>

## 保留有用的工作並管理 Store

請將原始碼變更保存在 Git 中，並透過 pull request 提交。此試驗使用 LayerFS 的 **Disposable** Store 設定檔，用於可重新建置的工作區歷史紀錄。記錄量測結果時，請另外保留有用的收據。

產生的輸入會在其初始 commit 期間停用 Git 自動維護，使物件資料庫在 LayerFS 匯入時保持穩定。試驗中的 Git 狀態檢查使用 `--no-optional-locks`，讓讀取狀態時能保留原始的 index。對於自訂指令碼，請在匯入或提交樹之前，先結束所有背景寫入程序。

成功且已卸載的 Sandbox 會在 LayerFS 的閒置逾時後停止。每次試驗都會保留其 Store volume；請依收據中的識別碼管理該特定的 volume 及其容器。失敗的操作會保留其記錄的狀態以供診斷。[維護者參考文件](../../docs/dev/layerfs.md)涵蓋了指令碼、收據與資源清理。
