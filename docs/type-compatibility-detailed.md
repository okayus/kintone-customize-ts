# TypeScriptの型の互換性チェック - 詳細解説

## 基本概念：構造的型付け（Structural Typing）

TypeScriptは**構造的型付け**を採用しています。これは、型の名前ではなく、型の構造（形）で互換性を判断する仕組みです。

```typescript
interface Named {
  name: string;
}

class Person {
  name: string;
  age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// Personクラスは明示的にNamedを実装していないが、
// name: stringプロパティを持つため、Namedと互換性がある
const p: Named = new Person("Alice", 25); // OK
```

## 1. 代入による互換性チェック

### 基本ルール：必要なプロパティがすべて存在すればOK

```typescript
interface Point2D {
  x: number;
  y: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

let point2D: Point2D = { x: 1, y: 2 };
let point3D: Point3D = { x: 1, y: 2, z: 3 };

// ✅ OK: Point3DはPoint2Dのすべてのプロパティを持つ
point2D = point3D;

// ❌ エラー: Point2Dにはzプロパティがない
// point3D = point2D; // Property 'z' is missing
```

### 関数の互換性

```typescript
// パラメータは反変（contravariant）
type Handler2D = (point: Point2D) => void;
type Handler3D = (point: Point3D) => void;

const handle2D: Handler2D = (p) => console.log(p.x, p.y);
const handle3D: Handler3D = (p) => console.log(p.x, p.y, p.z);

// ✅ OK: より少ないプロパティを期待する関数は代入可能
const handler: Handler3D = handle2D;

// ❌ エラー: より多くのプロパティを期待する関数は代入不可
// const handler2: Handler2D = handle3D;
```

## 2. extendsを使った互換性チェック

### 条件型（Conditional Types）での使用

```typescript
// 基本的な互換性チェック
type IsCompatible<T, U> = T extends U ? true : false;

// 例
type Test1 = IsCompatible<Point3D, Point2D>; // true
type Test2 = IsCompatible<Point2D, Point3D>; // false
type Test3 = IsCompatible<string, number>;   // false
type Test4 = IsCompatible<"hello", string>;  // true (リテラル型は基本型と互換)
```

### より実用的な条件型

```typescript
// Kintoneのフィールド型チェック
type IsUserSelectField<T> = T extends { type: "USER_SELECT"; value: any } ? true : false;

type UserField = {
  type: "USER_SELECT";
  value: Array<{ code: string; name: string }>;
};

type TextField = {
  type: "SINGLE_LINE_TEXT";
  value: string;
};

type Test5 = IsUserSelectField<UserField>; // true
type Test6 = IsUserSelectField<TextField>; // false
```

## 3. ユーティリティ型を使った互換性チェック

```typescript
// Required: すべてのプロパティを必須にする
interface PartialUser {
  name?: string;
  email?: string;
}

interface RequiredUser {
  name: string;
  email: string;
}

// Requiredを使って変換
type ConvertedUser = Required<PartialUser>;

// 互換性チェック
type IsExactMatch = ConvertedUser extends RequiredUser ? 
  RequiredUser extends ConvertedUser ? true : false : false; // true
```

## 4. 実践的な互換性チェックパターン

### パターン1: API応答の検証

```typescript
// APIから期待される応答
interface ExpectedResponse {
  status: "success" | "error";
  data?: {
    users: Array<{ code: string; name: string }>;
  };
}

// 実際の応答の型をチェック
function validateResponse<T>(response: T): response is T & ExpectedResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    (response as any).status === 'success' || (response as any).status === 'error'
  );
}
```

### パターン2: Kintoneレコードの型チェック

```typescript
import { KintoneRecordField } from "@kintone/rest-api-client";

// 期待するレコード構造
interface ExpectedRecord {
  ユーザー: KintoneRecordField.UserSelect;
  テキスト: KintoneRecordField.SingleLineText;
}

// 実際のレコードが期待する構造を持つかチェック
type ValidateRecord<T> = T extends ExpectedRecord ? true : false;

// 使用例
type ActualRecord = {
  ユーザー: KintoneRecordField.UserSelect;
  テキスト: KintoneRecordField.SingleLineText;
  追加フィールド: KintoneRecordField.Number;
};

type IsValid = ValidateRecord<ActualRecord>; // true（追加プロパティがあってもOK）
```

### パターン3: 厳密な型一致チェック

```typescript
// 完全一致を確認する型
type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;

// 例
type A = { x: number; y: string };
type B = { x: number; y: string };
type C = { x: number; y: string; z: boolean };

type Test7 = Equals<A, B>; // true
type Test8 = Equals<A, C>; // false（Cには追加プロパティがある）
type Test9 = A extends C ? true : false; // false
type Test10 = C extends A ? true : false; // true（CはAのすべてを持つ）
```

## 5. 型の互換性のデバッグテクニック

### テクニック1: エラーメッセージから原因を特定

```typescript
interface Config {
  apiKey: string;
  endpoint: string;
  timeout: number;
}

const myConfig = {
  apiKey: "123",
  endpoint: "https://api.example.com",
  // timeoutが欠けている
};

// エラーメッセージが詳細を教えてくれる
// const config: Config = myConfig;
// Error: Property 'timeout' is missing in type '{ apiKey: string; endpoint: string; }'
```

### テクニック2: 段階的な型チェック

```typescript
// 複雑な型を段階的に分解
type ComplexType = {
  user: {
    profile: {
      name: string;
      settings: {
        notifications: boolean;
        theme: "light" | "dark";
      };
    };
  };
};

// 段階的にチェック
type Step1 = ComplexType["user"];
type Step2 = Step1["profile"];
type Step3 = Step2["settings"];
type Step4 = Step3["theme"]; // "light" | "dark"

// 互換性も段階的に確認
const testData = { theme: "light" as const };
type IsThemeCompatible = typeof testData.theme extends Step4 ? true : false; // true
```

### テクニック3: 型の差分を可視化

```typescript
// 型の差分を抽出するユーティリティ
type Diff<T, U> = T extends U ? never : T;

type RequiredFields = {
  id: string;
  name: string;
  email: string;
  age: number;
};

type ProvidedFields = {
  id: string;
  name: string;
};

// 不足しているフィールドを特定
type MissingFields = Diff<keyof RequiredFields, keyof ProvidedFields>;
// type MissingFields = "email" | "age"
```

## まとめ：型の互換性チェックのベストプラクティス

1. **構造的型付けを理解する**: 名前ではなく構造で判断される
2. **代入で実践的にチェック**: 最も直感的な方法
3. **条件型で宣言的にチェック**: 型レベルでの検証
4. **エラーメッセージを活用**: TypeScriptは詳細な情報を提供
5. **段階的にデバッグ**: 複雑な型は分解して理解
6. **ユーティリティ型を活用**: Required, Partial, Pick, Omitなど

これらのテクニックを組み合わせることで、型の互換性に関する問題を効率的に解決できます。