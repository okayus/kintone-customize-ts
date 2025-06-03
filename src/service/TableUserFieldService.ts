import type {
  InSubtable,
  Subtable,
  UserSelect,
} from "@kintone/rest-api-client/lib/src/KintoneFields/types/field";

type UserEntity = {
  code: string;
  name?: string;
};

type SubtableValue<T> = {
  id: string;
  value: T;
};

export function extractUserCodesFromTable<
  T extends Record<string, InSubtable<UserSelect>>,
>(tableData: Subtable<T>, fieldCode: keyof T): string[] {
  const userCodes = new Set<string>();

  if (!tableData.value || tableData.value.length === 0) {
    return [];
  }

  for (const row of tableData.value) {
    const userField = row.value[fieldCode] as InSubtable<UserSelect>;
    if (userField && userField.value && Array.isArray(userField.value)) {
      for (const user of userField.value) {
        if (user.code) {
          userCodes.add(user.code);
        }
      }
    }
  }

  return Array.from(userCodes);
}

export function createUserSelectValue(
  userCodes: string[],
): Array<{ code: string }> {
  return userCodes.map((code) => ({ code }));
}

interface RecordWithUserFields {
  テーブル?: Subtable<{
    テーブル内ユーザーフィールド1?: InSubtable<UserSelect>;
    テーブル内ユーザーフィールド2?: InSubtable<UserSelect>;
  }>;
  テーブル外ユーザーフィールド1?: UserSelect;
  テーブル外ユーザーフィールド2?: UserSelect;
  [key: string]: any;
}

export function copyTableUsersToFields(
  record: RecordWithUserFields,
): RecordWithUserFields {
  if (!record.テーブル || !record.テーブル.value) {
    return record;
  }

  const updatedRecord = { ...record };

  // テーブル内ユーザーフィールド1の処理
  const userCodes1 = extractUserCodesFromTable(
    record.テーブル,
    "テーブル内ユーザーフィールド1",
  );
  if (updatedRecord.テーブル外ユーザーフィールド1) {
    updatedRecord.テーブル外ユーザーフィールド1 = {
      ...updatedRecord.テーブル外ユーザーフィールド1,
      value: createUserSelectValue(userCodes1),
    };
  }

  // テーブル内ユーザーフィールド2の処理
  const userCodes2 = extractUserCodesFromTable(
    record.テーブル,
    "テーブル内ユーザーフィールド2",
  );
  if (updatedRecord.テーブル外ユーザーフィールド2) {
    updatedRecord.テーブル外ユーザーフィールド2 = {
      ...updatedRecord.テーブル外ユーザーフィールド2,
      value: createUserSelectValue(userCodes2),
    };
  }

  return updatedRecord;
}
