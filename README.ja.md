# orchester

> AIコーディングツール向けTUIプロファイルマネージャー — ワンキーでオーケストレーションレイヤーを切替

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green" alt="node" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="license" />
</p>

## orchesterとは？

Claude Code、Codex CLI、OpenCodeなどのAIコーディングツールは、agents、skills、hooks、pluginsといったオーケストレーションレイヤーをサポートしています。代表的なオーケストレーションパッケージには**omc**、**ecc**、**bkit**などがあります。

問題点：**一度に使えるオーケストレーションレイヤーは1つだけ**であり、切り替えには`~/.claude/`や`~/.config/opencode/`のファイルを手動で移動する必要があります。

**orchester**はオーケストレーションプロファイルを分離管理し、美しいターミナルUIでワンキー切替を実現します。

## 機能

- **ワンキー切替** — プロファイルを選択してEnterを押すだけ
- **バニラスナップショット** — 初回起動時に既存設定を自動バックアップ。「none」でいつでも復元可能
- **安全なsymlink** — ファイルコピーではなくsymlinkを使用。オリジナルは一切変更されません
- **自動ロールバック** — 切替中にエラーが発生した場合、自動的に前の設定を復元
- **ビルトインレジストリ** — omc、ecc、bkitなどの人気パッケージをTUIから直接インストール
- **カスタムURLインストール** — 任意のGitリポジトリをカスタムプロファイルとして追加
- **ランタイム検出** — システムにインストールされたAIツール（Claude Code、Codex、OpenCode、Geminiなど）を表示
- **使用量ダッシュボード** — すべてのAIコーディングツールのトークン使用量を一覧表示
- **差分プレビュー** — プロファイル切替前に変更内容を確認
- **多言語対応** — 英語、韓国語、日本語、中国語インターフェース

## クイックスタート

```bash
# クローンしてインストール
git clone https://github.com/brandsmore/orchester.git
cd orchester
npm install

# 実行
npm run dev
```

初回起動時、orchesterは以下を実行します：
1. インストール済みAIコーディングツールを検出
2. 既存のオーケストレーション設定をスキャン
3. バニラスナップショットを作成（現在の設定のバックアップ）

## 使い方

### メイン画面

```
╭─────────────────────────────────────────────╮
│ orchester v0.1  プロファイル管理              │
├─────────────────────────────────────────────┤
│ ランタイム  claude ✓  codex ✓  opencode ✗   │
├─────────────────────────────────────────────┤
│ ● omc — 5モード, 32エージェント [orchestration]│
│ ○ ecc — 包括的スターターキット               │
│ ○ bkit — PDCAワークフロー                    │
│ ○ none（バニラ）                              │
├─────────────────────────────────────────────┤
│ Enter 選択  i インストール  u 使用量  h ヘルプ │
╰─────────────────────────────────────────────╯
```

### キーバインド

| キー | アクション |
|------|-----------|
| `↑` `↓` | プロファイルを移動 |
| `Enter` | プロファイルを選択・アクティブ化 |
| `i` | インストールレジストリを開く |
| `u` | 使用量ダッシュボードを表示 |
| `h` | ヘルプオーバーレイ |
| `l` | 言語変更 |
| `q` | 終了 |

### インストール画面

| キー | アクション |
|------|-----------|
| `↑` `↓` | レジストリを移動 |
| `Enter` | 選択したプロファイルをインストール |
| `a` | Git URLからプロファイルを追加 |
| `d` | プロファイルを削除 |
| `Esc` | 戻る |

## 仕組み

orchesterは**2フェーズモデル**を使用します：

### フェーズ1：インストール
オーケストレーションパッケージを`~/.orchester/profiles/`にダウンロード。ファイルをローカルに保存するだけで、**アクティブ化はしません**。

### フェーズ2：アクティブ化
プロファイルのファイルからターゲットツールの設定ディレクトリ（例：`~/.claude/agents/`）へsymlinkを作成。一度にアクティブにできるプロファイルは1つだけです。

```
~/.orchester/
├── state.json              # アクティブプロファイル追跡
├── vanilla/                # オリジナル設定のバックアップ
├── custom-registry.json    # ユーザー追加プロファイル
└── profiles/
    ├── omc/
    │   ├── manifest.yaml   # プロファイルメタデータ + リンク定義
    │   └── files/          # agents/, skills/, hooks/
    ├── ecc/
    └── bkit/
```

### 切替フロー（4フェーズ）

```
検証 → 旧設定の無効化 → 新設定のアクティブ化 → 検証
              ↓（失敗時）
         バニラ自動復元
```

## ビルトインレジストリ

| 名前 | Stars | 説明 | ツール |
|------|-------|------|--------|
| omc | 6.4K | 28エージェント、37スキル、Teamモード | Claude Code |
| ecc | 44.7K | 13エージェント、30+スキル、ハッカソン優勝 | Claude Code |
| bkit | 91 | PDCAベースAIネイティブワークフロー | Claude Code |
| wshobson-agents | 28.7K | 73プラグイン、112エージェント、146スキル | Claude Code |
| oh-my-opencode | 31.6K | Sisyphusオーケストレーター、マルチエージェント | OpenCode |
| claude-orchestra | 32 | 47エージェント、10チーム組織図構造 | Claude Code |

`a`キーで任意のGitリポジトリをカスタムプロファイルとして追加できます。

## 対応ランタイム

| ランタイム | 検出 | 使用量データ |
|-----------|------|-------------|
| Claude Code | `~/.claude/` | stats-cache.jsonからトークン使用量 |
| Codex CLI | `~/.codex/` | セッションレベルのトークン追跡 |
| OpenCode | `~/.config/opencode/` | セッション数 |
| Gemini CLI | `~/.gemini/` | 検出のみ |
| Cursor | `~/.cursor/` | 検出のみ |
| Antigravity | `~/.antigravity/` | 検出のみ |

## 技術スタック

- **[Ink](https://github.com/vadimdemedes/ink)** — CLI向けReact
- **[@inkjs/ui](https://github.com/vadimdemedes/ink-ui)** — UIコンポーネント（Spinner、Alert、Badge）
- **TypeScript** — 完全な型安全性
- **meow** — CLI引数パーサー

## プロジェクト構造

```
source/
├── cli.tsx              # エントリーポイント
├── app.tsx              # ルートコンポーネント（ビュールーティング）
├── types.ts             # 型定義
├── core/
│   ├── manifest.ts      # manifest.yamlパーサー
│   ├── state.ts         # state.json管理
│   ├── vanilla.ts       # バニラスナップショット バックアップ/復元
│   ├── linker.ts        # Symlink管理
│   ├── switcher.ts      # 4フェーズプロファイル切替
│   ├── detector.ts      # ランタイム＆ツール検出
│   ├── registry.ts      # プロファイルレジストリ＆インストーラー
│   ├── usage.ts         # トークン使用量集計
│   └── i18n.ts          # 国際化（en/ko/ja/zh）
├── hooks/
│   └── useOrch.ts       # メイン状態フック
└── views/
    ├── InitView.tsx      # 初回セットアップ
    ├── ProfileList.tsx   # プロファイル選択
    ├── DiffPreview.tsx   # 切替前の変更プレビュー
    ├── ResultView.tsx    # 切替結果
    ├── InstallView.tsx   # レジストリブラウザ＆インストーラー
    └── UsageView.tsx     # トークン使用量ダッシュボード
```

## 既知の制限事項

- **プラグインベースのツール未管理** — Claude Codeの`/plugin install`でインストールされたオーケストレーションツール（例：bkit、omc）は、プロファイル切替時に自動無効化されません。orchesterで管理するには、まず`/plugin uninstall <名前>`を手動実行する必要があります。プラグインライフサイクル管理はv0.2で対応予定です。

## ロードマップ

- **v0.2** — プラグインライフサイクル管理（切替時の自動有効/無効化）、MCP名前空間分離、プロジェクト別プロファイル
- **v0.3** — プロファイル合成（ミックス＆マッチ）、プロファイルバージョニング
- **v1.0** — マルチランタイム完全対応、プロファイルマーケットプレイス

## ライセンス

MIT

---

[English](./README.md) · [한국어](./README.ko.md) · [中文](./README.zh.md)
