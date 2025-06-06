# TypeScript & Kintone 開発のフラッシュカード

## TypeScript 基礎編

### カード1: ジェネリック型
**Q: ジェネリック型とは何ですか？**

**A:** 
- 型をパラメータとして受け取る型
- 例: `Array<T>`, `Promise<T>`, `Map<K, V>`
- 使用例:
  ```typescript
  function identity<T>(arg: T): T {
    return arg;
  }
  ```

---

### カード2: ユニオン型
**Q: ユニオン型の特徴と使い方は？**

**A:**
- 複数の型のいずれかを表す型
- `|` 演算子で結合
- 例:
  ```typescript
  type Status = "pending" | "success" | "error";
  type NumberOrString = number | string;
  ```

---

### カード3: 型エラー "is not generic"
**Q: "Type 'X' is not generic" エラーの意味は？**

**A:**
- 型パラメータを受け付けない型に対して、型パラメータを渡そうとしている
- 例: `string<T>` はエラー（stringはジェネリックではない）
- 解決: その型の正しい使用方法を確認する

---

### カード4: 名前空間（namespace）
**Q: TypeScriptの名前空間とは？**

**A:**
- 関連する型、インターフェース、関数をグループ化する仕組み
- ドット記法でアクセス: `Namespace.Type`
- 例:
  ```typescript
  namespace MyLib {
    export interface User { name: string; }
    export type ID = string | number;
  }
  // 使用: MyLib.User
  ```

---

## Kintone REST API Client 編

### カード5: KintoneRecordField
**Q: KintoneRecordFieldの使い方は？**

**A:**
```typescript
import { KintoneRecordField } from "@kintone/rest-api-client";

// フィールド型へのアクセス
type User = KintoneRecordField.UserSelect;
type Table = KintoneRecordField.Subtable<{
  field1: KintoneRecordField.SingleLineText;
}>;
```

---

### カード6: InSubtable型
**Q: InSubtable型の正体は？**

**A:**
- **ユニオン型**（ジェネリック型ではない！）
- サブテーブル内で使用可能なすべてのフィールド型の集合
- UserSelect, SingleLineText, Number などを含む
- 使い方: 型制約として使用
  ```typescript
  T extends { [key: string]: InSubtable }
  ```

---

### カード7: Subtable型の構造
**Q: Subtable型の定義と使い方は？**

**A:**
```typescript
type Subtable<T extends { [fieldCode: string]: InSubtable }> = {
  type: "SUBTABLE";
  value: Array<{
    id: string;
    value: T;
  }>;
};

// 使用例
type MyTable = KintoneRecordField.Subtable<{
  user: KintoneRecordField.UserSelect;
  text: KintoneRecordField.SingleLineText;
}>;
```

---

### カード8: UserSelect型の構造
**Q: UserSelect型の定義は？**

**A:**
```typescript
type UserSelect = {
  type: "USER_SELECT";
  value: Entity[];
};

type Entity = {
  code: string;  // ユーザーコード（必須）
  name: string;  // ユーザー名（必須）
};
```

---

## デバッグ・調査編

### カード9: 型定義の調査方法
**Q: npmパッケージの型定義を調査する方法は？**

**A:**
1. **VSCode**: Cmd/Ctrl + クリック or F12で定義にジャンプ
2. **CLI**: `find node_modules/@package -name "*.d.ts"`
3. **GitHub**: パッケージのリポジトリで`.d.ts`ファイルを確認
4. **npm**: `npm info @package` でリポジトリURLを確認

---

### カード10: 型エラーのデバッグ手法
**Q: 複雑な型エラーをデバッグする手順は？**

**A:**
1. **エラーメッセージを正確に読む**
2. **型を段階的に分解**:
   ```typescript
   type Step1 = typeof complexObject;
   type Step2 = Step1['property'];
   type Step3 = Step2[0]; // 配列の要素型
   ```
3. **型の互換性を確認**
4. **最小限の再現コードを作成**

---

### カード11: import文の種類
**Q: TypeScriptでの各種import文の違いは？**

**A:**
```typescript
// 名前付きインポート
import { Type1, Type2 } from "module";

// 型のみのインポート（実行時に削除）
import type { Type1, Type2 } from "module";

// 名前空間インポート
import * as MyModule from "module";

// デフォルトインポート
import MyDefault from "module";
```

---

### カード12: 型の互換性チェック
**Q: 2つの型が互換性があるか確認する方法は？**

**A:**
**構造的型付け**: TypeScriptは型の「形」で互換性を判断

```typescript
// 1. 代入で確認（最も実践的）
type Point2D = { x: number; y: number };
type Point3D = { x: number; y: number; z: number };

const p3d: Point3D = { x: 1, y: 2, z: 3 };
const p2d: Point2D = p3d; // ✅ OK: Point3DはPoint2Dに必要なものを全て持つ
// const p3d2: Point3D = p2d; // ❌ エラー: zが不足

// 2. extendsで型レベル確認
type IsCompatible<T, U> = T extends U ? true : false;
type Test1 = IsCompatible<Point3D, Point2D>; // true
type Test2 = IsCompatible<Point2D, Point3D>; // false

// 3. 実用例：Kintoneフィールド
type HasUserField<T> = T extends { ユーザー: any } ? true : false;
type Record1 = { ユーザー: KintoneRecordField.UserSelect; 名前: any };
type Check = HasUserField<Record1>; // true
```

**覚え方**: 「多い方から少ない方へは代入OK」（スーパーセット→サブセット）

---

## 実践的な思考プロセス編

### カード13: 型エラー解決の思考フロー
**Q: 型エラーに遭遇したときの思考フローは？**

**A:**
1. **エラーメッセージの分析**
   - 何が期待されて、何が提供されたか
2. **型定義の確認**
   - F12で定義にジャンプ
   - ジェネリック？ユニオン？オブジェクト？
3. **使用例の検索**
   - 公式ドキュメント
   - テストコード
   - GitHubでの使用例
4. **段階的な修正**
   - 最小限の変更から始める

---

### カード14: パッケージ構造の理解
**Q: npmパッケージの型定義構造を理解するポイントは？**

**A:**
1. **エントリーポイント**: `package.json`の`types`フィールド
2. **エクスポート方法**:
   - 直接エクスポート
   - 名前空間エクスポート
   - 再エクスポート
3. **ディレクトリ構造**:
   ```
   index.d.ts (メインエントリ)
   lib/
     ├── types/ (型定義)
     └── src/ (実装に対応した型)
   ```

---

### カード15: 型安全性のベストプラクティス
**Q: 型安全性を保つためのベストプラクティスは？**

**A:**
1. **anyを避ける**: unknownやジェネリックを使用
2. **型アサーションより型ガード**:
   ```typescript
   // ❌ 型アサーション（危険）
   const user = data as User;
   
   // ✅ 型ガード（安全）
   interface User {
     code: string;
     name: string;
   }
   
   const isUser = (value: unknown): value is User => {
     return (
       typeof value === 'object' && value !== null &&
       'code' in value && typeof (value as any).code === 'string' &&
       'name' in value && typeof (value as any).name === 'string'
     );
   };
   
   if (isUser(data)) {
     // dataはUser型として安全に使用可能
     console.log(data.code, data.name);
   }
   ```
3. **strictモードを有効化**
4. **型定義を最新に保つ**: `npm update @types/*`

---

### カード16: 型ガード（Type Guards）
**Q: 型ガードとは何で、なぜ型アサーションより安全なのか？**

**A:**
**型ガード**: 実行時に値の型を確認し、TypeScriptに型を伝える関数

```typescript
// Kintoneのユーザーオブジェクト用の型ガード
interface KintoneUser {
  code: string;
  name: string;
}

const isKintoneUser = (value: unknown): value is KintoneUser => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.code === 'string' &&
    typeof obj.name === 'string'
  );
};

// 使用例（API応答の検証など）
async function processKintoneData(data: unknown) {
  if (isKintoneUser(data)) {
    // 型安全：dataは確実にKintoneUser型
    console.log(`User: ${data.code} - ${data.name}`);
  } else {
    throw new Error('Invalid user data');
  }
}
```

**利点**:
- **実行時安全性**: 実際に値を検証
- **型推論**: TypeScriptが自動で型を絞り込み
- **デバッグしやすい**: エラーの原因が特定可能

---

### カード17: export * as によるNamespace Export
**Q: `export * as` とは何で、なぜ使うのか？**

**A:**
**モジュールベースの名前空間を作成する現代的な方法**

```typescript
// 3層構造の例（kintone-rest-api-clientのパターン）
// 1. types/field.ts - 型定義
export type UserSelect = { type: "USER_SELECT"; value: Entity[] };
export type Number = { type: "NUMBER"; value: string };

// 2. exportTypes/field.ts - 選択的再エクスポート
export type { UserSelect, Number } from "../types/field";

// 3. index.ts - 名前空間エクスポート
export * as KintoneRecordField from "./exportTypes/field";

// 使用側
import { KintoneRecordField } from "@kintone/rest-api-client";
type User = KintoneRecordField.UserSelect; // ドット記法でアクセス
```

**利点**:
- 名前の衝突を防ぐ（Numberなど）
- 関連する型をグループ化
- インポート文がシンプル
- 従来の`namespace`より推奨される

---

### カード18: 選択的エクスポート設計
**Q: なぜAppIDやRecord型は深いパスからしかインポートできないの？**

**A:**
**使用頻度と責任による分類**

```typescript
// ❌ できない（メインエクスポートにない）
import { AppID, Record } from "@kintone/rest-api-client";

// ✅ 正しい（深いパスから）
import type { AppID, Record } from "@kintone/rest-api-client/lib/src/client/types";

// ✅ フィールド型は名前空間で提供
import { KintoneRecordField } from "@kintone/rest-api-client";
type User = KintoneRecordField.UserSelect;
```

**設計理由**:
1. **使用頻度**: フィールド型（高頻度）vs クライアント型（低頻度）
2. **責任分離**: アプリ開発用 vs ライブラリ内部用
3. **名前空間汚染防止**: `Record`は一般的すぎる名前

**覚え方**: 「よく使うものは表に、詳細は奥に」（Progressive Disclosure）

---

## 記憶のコツ

### 学習方法
1. **実際にコードを書いて試す**
2. **エラーを意図的に発生させて理解を深める**
3. **型定義ファイルを読む習慣をつける**
4. **小さなサンプルプロジェクトで実験**

### 復習スケジュール
- 1日後
- 3日後
- 1週間後
- 1ヶ月後

### 関連付けて覚える
- ジェネリック = 型の「変数」
- ユニオン = 型の「または」
- 名前空間 = 型の「フォルダ」
- InSubtable = サブテーブル用の「型のセット」