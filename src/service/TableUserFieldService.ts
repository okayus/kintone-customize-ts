import { FIELD_CODES } from "../config/fieldConfig";

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
  [FIELD_CODES.TABLE]?: Subtable<{
    [FIELD_CODES.TABLE_USER_FIELD_1]?: InSubtable<UserSelect>;
    [FIELD_CODES.TABLE_USER_FIELD_2]?: InSubtable<UserSelect>;
  }>;
  [FIELD_CODES.EXTERNAL_USER_FIELD_1]?: UserSelect;
  [FIELD_CODES.EXTERNAL_USER_FIELD_2]?: UserSelect;
  [key: string]: any;
}

export function copyTableUsersToFields(
  record: RecordWithUserFields,
): RecordWithUserFields {
  const tableField = record[FIELD_CODES.TABLE];
  if (!tableField || !tableField.value) {
    return record;
  }

  const updatedRecord = { ...record };

  // テーブル内ユーザーフィールド1の処理
  const userCodes1 = extractUserCodesFromTable(
    tableField,
    FIELD_CODES.TABLE_USER_FIELD_1,
  );
  const externalField1 = updatedRecord[FIELD_CODES.EXTERNAL_USER_FIELD_1];
  if (externalField1) {
    updatedRecord[FIELD_CODES.EXTERNAL_USER_FIELD_1] = {
      ...externalField1,
      value: createUserSelectValue(userCodes1),
    };
  }

  // テーブル内ユーザーフィールド2の処理
  const userCodes2 = extractUserCodesFromTable(
    tableField,
    FIELD_CODES.TABLE_USER_FIELD_2,
  );
  const externalField2 = updatedRecord[FIELD_CODES.EXTERNAL_USER_FIELD_2];
  if (externalField2) {
    updatedRecord[FIELD_CODES.EXTERNAL_USER_FIELD_2] = {
      ...externalField2,
      value: createUserSelectValue(userCodes2),
    };
  }

  return updatedRecord;
}
