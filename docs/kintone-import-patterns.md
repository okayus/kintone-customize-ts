# Kintone REST API Client のインポートパターン

## 質問：なぜ一部の型は深いパスからしかインポートできないのか？

```typescript
// ❌ これはできない
import { AppID, Record } from "@kintone/rest-api-client";

// ✅ これが必要
import type { AppID, Record } from "@kintone/rest-api-client/lib/src/client/types";
```

## 答え：選択的エクスポート設計

### 1. メインエクスポートの構造

`@kintone/rest-api-client` のメインエントリーポイント（`index.d.ts`）は、以下のもののみをエクスポートしています：

```typescript
// lib/src/index.d.ts
export { KintoneRestAPIClient } from "./KintoneRestAPIClient";
export * from "./error";
export * as KintoneRecordField from "./KintoneFields/exportTypes/field";
export * as KintoneFormLayout from "./KintoneFields/exportTypes/layout";
export * as KintoneFormFieldProperty from "./KintoneFields/exportTypes/property";
```

### 2. エクスポートされていない理由

#### 理由1: 使用頻度による分類
- **高頻度**: フィールド型（UserSelect, Subtable など）→ 名前空間エクスポート
- **中頻度**: クライアントクラス → 直接エクスポート
- **低頻度**: クライアント型（AppID, Record など）→ 深いパスから

#### 理由2: 型の責任分離
```typescript
// フィールド関連（アプリ開発者が頻繁に使用）
import { KintoneRecordField } from "@kintone/rest-api-client";

// クライアント関連（ライブラリ内部で主に使用）
import type { AppID, Record } from "@kintone/rest-api-client/lib/src/client/types";
```

#### 理由3: 名前空間の汚染防止
- `Record` という型名は一般的すぎる
- メインエクスポートに含めると、他の `Record` 型と衝突する可能性

### 3. 実際の使い分けパターン

#### パターン1: 推奨される使い方（現在のコード）
```typescript
// メインエクスポートから
import { KintoneRestAPIClient } from "@kintone/rest-api-client";

// 深いパスから
import type { AppID, Record } from "@kintone/rest-api-client/lib/src/client/types";

export class MyService {
  constructor(private client: KintoneRestAPIClient) {}
  
  async getRecords(appId: AppID): Promise<Record[]> {
    // ...
  }
}
```

#### パターン2: 名前空間インポート（多くの型が必要な場合）
```typescript
import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type * as KintoneTypes from "@kintone/rest-api-client/lib/src/client/types";

export class ExtendedService {
  async processApp(appId: KintoneTypes.AppID): Promise<KintoneTypes.Record[]> {
    // ...
  }
}
```

#### パターン3: 個別インポート（特定の型のみ）
```typescript
import type { AppID } from "@kintone/rest-api-client/lib/src/client/types";
import type { Record } from "@kintone/rest-api-client/lib/src/client/types/record";
```

### 4. 他のライブラリとの比較

#### React（同様のパターン）
```typescript
// メインから
import React from "react";

// 深いパスから
import type { ComponentProps } from "react";
import type { RefObject } from "react";
```

#### Node.js標準ライブラリ
```typescript
// メインから
import fs from "fs";

// 深いパスから
import type { Stats } from "fs";
```

### 5. 設計思想の理解

この設計は以下の原則に基づいています：

1. **Progressive Disclosure**: よく使う機能を前面に、詳細は奥に
2. **Separation of Concerns**: 異なる責任を持つ型を分離
3. **API Surface Minimization**: 公開APIを最小限に抑制

### 6. 実践的なTips

#### Tip1: エイリアスでパスを短縮
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@kintone-types/*": ["node_modules/@kintone/rest-api-client/lib/src/client/types/*"]
    }
  }
}

// 使用
import type { AppID, Record } from "@kintone-types";
```

#### Tip2: 型定義ファイルで再エクスポート
```typescript
// src/types/kintone.ts
export type { AppID, Record } from "@kintone/rest-api-client/lib/src/client/types";
export { KintoneRecordField } from "@kintone/rest-api-client";

// 使用
import type { AppID, Record } from "@/types/kintone";
```

#### Tip3: 型チェック用のユーティリティ
```typescript
// src/utils/typeGuards.ts
import type { Record } from "@kintone/rest-api-client/lib/src/client/types";

export const isRecord = (value: unknown): value is Record => {
  return typeof value === 'object' && value !== null && '$id' in value;
};
```

## まとめ

現在の深いパスからのインポートは、ライブラリの**意図された設計**に従った正しい使い方です。

- **フィールド型**: `KintoneRecordField.*` で名前空間アクセス
- **クライアント型**: 深いパスから直接インポート
- **クライアントクラス**: メインエクスポートから

この理解により、他の大規模TypeScriptライブラリの設計パターンも読み解けるようになります。