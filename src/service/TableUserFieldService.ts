import { KintoneRecordField } from "@kintone/rest-api-client";

import { FIELD_CODES } from "../config/fieldConfig";

export function extractUserCodesFromTable<
  T extends Record<string, KintoneRecordField.InSubtable>,
>(tableData: KintoneRecordField.Subtable<T>, fieldCode: keyof T): string[] {
  const userCodes = new Set<string>();

  if (!tableData.value || tableData.value.length === 0) {
    return [];
  }

  for (const row of tableData.value) {
    const userField = row.value[fieldCode] as KintoneRecordField.UserSelect;
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
): KintoneRecordField.UserSelect["value"] {
  return userCodes.map((code) => ({ code, name: "" }));
}

interface RecordWithUserFields {
  [FIELD_CODES.TABLE]?: KintoneRecordField.Subtable<{
    [FIELD_CODES.TABLE_USER_FIELD_1]?: KintoneRecordField.UserSelect;
    [FIELD_CODES.TABLE_USER_FIELD_2]?: KintoneRecordField.UserSelect;
  }>;
  [FIELD_CODES.EXTERNAL_USER_FIELD_1]?: KintoneRecordField.UserSelect;
  [FIELD_CODES.EXTERNAL_USER_FIELD_2]?: KintoneRecordField.UserSelect;
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
