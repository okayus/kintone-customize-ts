export const FIELD_CODES = {
  TABLE: "テーブル",
  TABLE_USER_FIELD_1: "テーブル内ユーザーフィールド1",
  TABLE_USER_FIELD_2: "テーブル内ユーザーフィールド2",
  EXTERNAL_USER_FIELD_1: "テーブル外ユーザーフィールド1",
  EXTERNAL_USER_FIELD_2: "テーブル外ユーザーフィールド2",
} as const;

export type FieldCodes = typeof FIELD_CODES;
export type FieldCode = FieldCodes[keyof FieldCodes];
