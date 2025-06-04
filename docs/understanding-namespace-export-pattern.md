# TypeScriptのNamespace Export パターンの理解

## 疑問：なぜKintoneRecordFieldは名前空間のように使えるのか？

`import { KintoneRecordField } from "@kintone/rest-api-client"` でインポートすると、`KintoneRecordField.UserSelect` のようにドット記法でアクセスできます。しかし、実際の型定義ファイルを見ると `export type` で個別にエクスポートされています。なぜでしょうか？

## 答え：`export * as` 構文による名前空間エクスポート

### 1. モジュール名前空間エクスポートの仕組み

```typescript
// index.d.ts（メインエントリーポイント）
export * as KintoneRecordField from "./KintoneFields/exportTypes/field";
```

この `export * as` 構文は、TypeScript/JavaScript の比較的新しい機能で、モジュールのすべてのエクスポートを単一のオブジェクト（名前空間）としてまとめて再エクスポートします。

### 2. 3層構造のエクスポートパターン

kintone-rest-api-clientは以下の3層構造を採用しています：

```
レイヤー1: 定義層（Definition Layer）
├── /types/field.d.ts
│   └── export type UserSelect = { ... }  // 実際の型定義
│   └── export type Subtable<T> = { ... }
│
レイヤー2: エクスポート層（Export Layer）
├── /exportTypes/field.d.ts
│   └── export type { UserSelect, Subtable, ... } from "../types/field"
│
レイヤー3: 名前空間層（Namespace Layer）
└── /index.d.ts
    └── export * as KintoneRecordField from "./KintoneFields/exportTypes/field"
```

### 3. なぜこのパターンを使うのか？

#### 利点1: クリーンなAPI
```typescript
// ❌ 名前空間エクスポートがない場合
import { 
  UserSelect, 
  SingleLineText, 
  Number, 
  Subtable,
  // ... 30個以上の型をインポート
} from "@kintone/rest-api-client/lib/src/KintoneFields/types/field";

// ✅ 名前空間エクスポートがある場合
import { KintoneRecordField } from "@kintone/rest-api-client";
// すべての型にKintoneRecordField.を通じてアクセス
```

#### 利点2: 名前の衝突を防ぐ
```typescript
// Number型が競合する例
import { Number } from "@kintone/rest-api-client"; // Kintoneの数値フィールド型
// JavaScript組み込みのNumberと競合！

// 名前空間なら安全
import { KintoneRecordField } from "@kintone/rest-api-client";
type MyNumberField = KintoneRecordField.Number; // 競合しない
```

#### 利点3: 関連する型のグループ化
```typescript
// フィールド関連の型が明確にグループ化される
KintoneRecordField.UserSelect
KintoneRecordField.SingleLineText
KintoneRecordField.Subtable<T>

// フォームレイアウト関連も同様
KintoneFormLayout.Row
KintoneFormLayout.Field
```

### 4. 実装例：同じパターンを自分のプロジェクトで使う

```typescript
// myTypes/user.ts
export type UserProfile = {
  name: string;
  email: string;
};

export type UserSettings = {
  theme: "light" | "dark";
  notifications: boolean;
};

// myTypes/index.ts
export * as User from "./user";

// 使用側
import { User } from "./myTypes";

const profile: User.UserProfile = { name: "Alice", email: "alice@example.com" };
const settings: User.UserSettings = { theme: "dark", notifications: true };
```

### 5. 従来のnamespace宣言との違い

```typescript
// 従来のnamespace（非推奨）
namespace MyNamespace {
  export interface User { name: string; }
  export type ID = string | number;
}

// モダンなexport * as（推奨）
// types.ts
export interface User { name: string; }
export type ID = string | number;

// index.ts
export * as MyNamespace from "./types";
```

## まとめ：現代的なTypeScriptのベストプラクティス

1. **`export * as`** は、モジュールベースの名前空間を作成する現代的な方法
2. **型の整理**: 関連する型をグループ化してAPIを整理
3. **名前の衝突回避**: グローバルスコープを汚染しない
4. **IDE対応**: 自動補完やドキュメント表示が効きやすい

このパターンを理解することで、大規模なTypeScriptライブラリの設計思想が見えてきます。kintone-rest-api-clientは、このパターンを効果的に活用している良い例です。

## 実践的なTips

### VSCodeでの追跡方法
1. `Cmd/Ctrl + Click` で定義へジャンプ
2. さらに `Cmd/Ctrl + Click` を続けて、re-exportのチェーンを辿る
3. 最終的な定義元に到達するまで追跡

### デバッグ時の型の確認
```typescript
// 型の完全修飾名を確認
type DebugType = KintoneRecordField.UserSelect;
//   ^? type DebugType = { type: "USER_SELECT"; value: Entity[]; }

// 名前空間オブジェクト全体の確認
type AllFields = typeof KintoneRecordField;
//   ^? 利用可能なすべての型が表示される
```