import { describe, expect, it } from "vitest";

import {
  copyTableUsersToFields,
  createUserSelectValue,
  extractUserCodesFromTable,
} from "./TableUserFieldService";

import type {
  InSubtable,
  Subtable,
  UserSelect,
} from "@kintone/rest-api-client/lib/src/KintoneFields/types/field";

describe("TableUserFieldService", () => {
  describe("extractUserCodesFromTable", () => {
    it("テーブル内の単一ユーザーフィールドからユーザーコードを抽出できる", () => {
      const tableData: Subtable<{
        テーブル内ユーザーフィールド1: InSubtable<UserSelect>;
      }> = {
        type: "SUBTABLE",
        value: [
          {
            id: "1",
            value: {
              テーブル内ユーザーフィールド1: {
                type: "USER_SELECT",
                value: [
                  { code: "user1", name: "User 1" },
                  { code: "user2", name: "User 2" },
                ],
              },
            },
          },
          {
            id: "2",
            value: {
              テーブル内ユーザーフィールド1: {
                type: "USER_SELECT",
                value: [{ code: "user3", name: "User 3" }],
              },
            },
          },
        ],
      };

      const result = extractUserCodesFromTable(
        tableData,
        "テーブル内ユーザーフィールド1",
      );
      expect(result).toEqual(["user1", "user2", "user3"]);
    });

    it("テーブル内の複数行から重複を除いたユーザーコードを抽出できる", () => {
      const tableData: Subtable<{
        テーブル内ユーザーフィールド1: InSubtable<UserSelect>;
      }> = {
        type: "SUBTABLE",
        value: [
          {
            id: "1",
            value: {
              テーブル内ユーザーフィールド1: {
                type: "USER_SELECT",
                value: [
                  { code: "user1", name: "User 1" },
                  { code: "user2", name: "User 2" },
                ],
              },
            },
          },
          {
            id: "2",
            value: {
              テーブル内ユーザーフィールド1: {
                type: "USER_SELECT",
                value: [
                  { code: "user2", name: "User 2" },
                  { code: "user3", name: "User 3" },
                ],
              },
            },
          },
        ],
      };

      const result = extractUserCodesFromTable(
        tableData,
        "テーブル内ユーザーフィールド1",
      );
      expect(result).toEqual(["user1", "user2", "user3"]);
    });

    it("空のテーブルの場合は空配列を返す", () => {
      const tableData: Subtable<{
        テーブル内ユーザーフィールド1: InSubtable<UserSelect>;
      }> = {
        type: "SUBTABLE",
        value: [],
      };

      const result = extractUserCodesFromTable(
        tableData,
        "テーブル内ユーザーフィールド1",
      );
      expect(result).toEqual([]);
    });

    it("ユーザーフィールドが空の行がある場合も正しく処理する", () => {
      const tableData: Subtable<{
        テーブル内ユーザーフィールド1: InSubtable<UserSelect>;
      }> = {
        type: "SUBTABLE",
        value: [
          {
            id: "1",
            value: {
              テーブル内ユーザーフィールド1: {
                type: "USER_SELECT",
                value: [],
              },
            },
          },
          {
            id: "2",
            value: {
              テーブル内ユーザーフィールド1: {
                type: "USER_SELECT",
                value: [{ code: "user1", name: "User 1" }],
              },
            },
          },
        ],
      };

      const result = extractUserCodesFromTable(
        tableData,
        "テーブル内ユーザーフィールド1",
      );
      expect(result).toEqual(["user1"]);
    });
  });

  describe("createUserSelectValue", () => {
    it("ユーザーコードの配列からUserSelect型のvalueを作成できる", () => {
      const userCodes = ["user1", "user2", "user3"];

      const result = createUserSelectValue(userCodes);
      expect(result).toEqual([
        { code: "user1" },
        { code: "user2" },
        { code: "user3" },
      ]);
    });

    it("空配列の場合は空配列を返す", () => {
      const userCodes: string[] = [];

      const result = createUserSelectValue(userCodes);
      expect(result).toEqual([]);
    });
  });

  describe("copyTableUsersToFields", () => {
    it("テーブル内の2つのユーザーフィールドをそれぞれ対応する外部フィールドにコピーする", () => {
      const record = {
        テーブル: {
          type: "SUBTABLE" as const,
          value: [
            {
              id: "1",
              value: {
                テーブル内ユーザーフィールド1: {
                  type: "USER_SELECT" as const,
                  value: [
                    { code: "user1", name: "User 1" },
                    { code: "user2", name: "User 2" },
                  ],
                },
                テーブル内ユーザーフィールド2: {
                  type: "USER_SELECT" as const,
                  value: [{ code: "user3", name: "User 3" }],
                },
              },
            },
            {
              id: "2",
              value: {
                テーブル内ユーザーフィールド1: {
                  type: "USER_SELECT" as const,
                  value: [
                    { code: "user2", name: "User 2" },
                    { code: "user4", name: "User 4" },
                  ],
                },
                テーブル内ユーザーフィールド2: {
                  type: "USER_SELECT" as const,
                  value: [
                    { code: "user3", name: "User 3" },
                    { code: "user5", name: "User 5" },
                  ],
                },
              },
            },
          ],
        },
        テーブル外ユーザーフィールド1: {
          type: "USER_SELECT" as const,
          value: [],
        },
        テーブル外ユーザーフィールド2: {
          type: "USER_SELECT" as const,
          value: [],
        },
      };

      const result = copyTableUsersToFields(record);

      expect(result.テーブル外ユーザーフィールド1.value).toEqual([
        { code: "user1" },
        { code: "user2" },
        { code: "user4" },
      ]);

      expect(result.テーブル外ユーザーフィールド2.value).toEqual([
        { code: "user3" },
        { code: "user5" },
      ]);
    });

    it("テーブルが存在しない場合はそのまま返す", () => {
      const record = {
        テーブル外ユーザーフィールド1: {
          type: "USER_SELECT" as const,
          value: [],
        },
        テーブル外ユーザーフィールド2: {
          type: "USER_SELECT" as const,
          value: [],
        },
      };

      const result = copyTableUsersToFields(record);
      expect(result).toEqual(record);
    });
  });
});
