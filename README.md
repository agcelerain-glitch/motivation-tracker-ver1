# モチトラ — フロントエンド

Next.js 15 (App Router) で実装されたモチトラのフロントエンドです。

詳細なセットアップ手順・デプロイ方法・設計ルールは **プロジェクトルートの `README.md`** を参照してください。

## クイックスタート

```bash
cp .env.local.example .env.local
# .env.local を編集してFirebaseの設定値を入力
npm install
npm run dev
```

## コマンド

```bash
npm run dev                        # 開発サーバー起動（localhost:3000）
npm run dev -- --hostname 0.0.0.0  # スマホからLAN経由でアクセスする場合
npm run build                      # 本番ビルド確認
npm run lint                       # ESLint
npx tsc --noEmit                   # 型チェック
npm test                           # Vitestテスト
```

## デプロイ

mainブランチへpushすると**Vercelが自動デプロイ**します。

```bash
npm run lint && npx tsc --noEmit
git add <変更ファイル> && git commit -m "..." && git push origin main
```
