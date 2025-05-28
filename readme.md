# Bookmarklet for Sales Report Auto-Fill

## 概要

このプロジェクトは、営業日報システムのフォーム入力を自動化するBookmarkletです。AWS API Gateway経由でDynamoDBからデータを取得し、Webフォームの指定されたplaceholderを持つ要素に自動的にデータを入力します。

## 主な機能

- **データ取得**: AWS API Gateway経由でDynamoDBから営業データを取得
- **フォーム自動入力**: 取得したデータを対応するフォームフィールドに自動入力
- **デバッグ機能**: 詳細なデバッグ情報をコンソールとアラートで表示
- **エラーハンドリング**: API呼び出しやデータ処理のエラーを適切に処理
- **React対応**: React アプリケーションでのフォーム入力に対応（inputとchangeイベントを発火）

## ファイル構成

```
├── index.html          # テスト用のサンプル営業日報フォーム
├── code.js             # メインのBookmarkletソースコード（開発用）
├── paste.txt           # code.jsのフォーマット済みバージョン
├── bookmarklet.js      # 圧縮されたBookmarkletコード（本番用）
├── minify.js           # JavaScriptコード圧縮ツール
├── test.js             # 動作確認用のシンプルなBookmarklet
└── readme.md           # このドキュメント
```

## CORS問題の解決

このBookmarkletはAPI呼び出しを行うため、ローカルファイル（`file://`）では動作しません。以下の方法でローカルサーバーを起動してテストしてください。

### 方法1: Node.jsローカルサーバー（推奨）

1. **サーバー起動**:
   ```bash
   # 基本的な起動
   node server.js
   
   # またはnpmスクリプトを使用
   npm start
   ```

2. **ブラウザでアクセス**: 
   - `http://localhost:8000` にアクセス
   - `index.html` をクリックして開く

3. **Bookmarkletのテスト**:
   - 作成したBookmarkletをクリックして動作確認

### 方法2: 別のポートを使用

```bash
# ポート3000で起動
PORT=3000 node server.js

# Windows の場合
set PORT=3000 && node server.js
```

### 2. Bookmarkletの作成

1. **コードの圧縮**:
   ```bash
   node minify.js code.js
   ```

2. **Bookmarkletの登録**:
   - 生成された`bookmarklet.js`の内容をコピー
   - ブラウザのブックマークバーに新しいブックマークを作成
   - URLフィールドにコピーしたコードを貼り付け
   - 適切な名前（例：「営業日報自動入力」）を設定して保存

### 3. 実行方法

1. **テスト環境での確認**:
   - `index.html`をブラウザで開く
   - 作成したBookmarkletをクリック
   - Employee IDの入力を求められた場合は適切なIDを入力

2. **本番環境での使用**:
   - 営業日報フォームのページでBookmarkletを実行
   - URLパラメータに`?employeeId=YOUR_ID`が含まれている場合は自動的に使用
   - 含まれていない場合はプロンプトでEmployee IDの入力を求められます

## 技術仕様

### API接続

- **エンドポイント**: AWS API Gateway
- **認証**: なし（パブリックAPI）
- **データ形式**: JSON
- **HTTPメソッド**: GET

### データ構造

DynamoDBから取得される想定データ構造：
```javascript
{
  "sk": "20250521095554",
  "meeting_data": {
    "meeting_purpose": "営業会議の内容...",
    // その他のフィールド
  }
}
```

### フォームフィールド対応

現在対応しているフィールド：
```javascript
var fieldMap = {
  'meeting_purpose': '日報を入力'
  // 必要に応じて他のフィールドも追加可能
};
```

### ブラウザ互換性

- **Chrome**: 完全対応
- **Safari（macOS/iOS）**: 対応確認済み
- **Firefox**: 対応
- **その他**: XMLHttpRequestを使用しているため、現代的なブラウザで動作

## カスタマイズ

### フィールドマッピングの追加

`code.js`内の`fieldMap`オブジェクトを編集して、新しいフィールド対応を追加できます：

```javascript
var fieldMap = {
  'meeting_purpose': '日報を入力',
  'cost': 'コスト',
  'hearing_contents': 'ヒアリング内容',
  'proposal': '提案内容',
  'reaction': '反応'
};
```

### デバッグモードの切り替え

開発時は`DEBUG_MODE = true`、本番時は`false`に設定：

```javascript
var DEBUG_MODE = false; // 本番環境では false に設定
```

## トラブルシューティング

### よくある問題

1. **「データが見つかりません」エラー**
   - ソートキー（SK）の値を確認
   - Employee IDが正しいか確認
   - API エンドポイントにアクセス可能か確認

2. **フォームに入力されない**
   - placeholder属性の値がfieldMapと一致しているか確認
   - React アプリケーションの場合、イベントが正しく発火されているか確認

3. **ネットワークエラー**
   - CORS設定を確認
   - API Gateway の設定を確認

### デバッグ情報の確認

デバッグモードが有効な場合、以下の情報が表示されます：
- API呼び出しの詳細
- 取得したデータの構造
- フォーム要素の検索結果
- 入力処理の成功/失敗

## セキュリティ注意事項

- **APIキー**: 現在はパブリックAPIを使用していますが、本番環境では適切な認証を実装してください
- **データの機密性**: 営業データが含まれるため、HTTPS通信を必須としてください
- **クロスサイトスクリプティング**: 入力データの検証を適切に行ってください

## 開発者向け情報

### コード構造

```javascript
// 1. 設定値の定義
// 2. ヘルパー関数の定義
// 3. API呼び出し関数
// 4. フォーム入力関数
// 5. メイン処理の実行
```

### 拡張方針

- 複数のフィールドタイプ対応
- エラー処理の強化
- ユーザーインターフェースの改善
- 設定の外部化

---

**検証**: MONO-X [山下](manapuraza.com)  
**最終更新**: 2025年5月28日  
