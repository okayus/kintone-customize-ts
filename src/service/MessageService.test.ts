import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";

import { KintoneSdk } from "../util/kintoneSdk";

import { MessageService } from "./MessageService";

import type { Record } from "@kintone/rest-api-client/lib/src/client/types";

vi.mock("../shared/util/kintoneSdk");

describe("MessageService", () => {
  let mockkintoneSdk: Mocked<KintoneSdk>;
  let mockRestApiClient: Mocked<KintoneRestAPIClient>;
  let kintone: any;

  beforeEach(() => {
    kintone = {
      app: {
        getQueryCondition: vi.fn(),
      },
    };
    global.kintone = kintone;

    mockRestApiClient = {
      record: {
        getRecords: vi.fn(),
      },
    } as unknown as Mocked<KintoneRestAPIClient>;
    mockkintoneSdk = new KintoneSdk(mockRestApiClient) as Mocked<KintoneSdk>;
    mockkintoneSdk.getRecords = vi.fn();
  });

  describe("fetchRecords", () => {
    it("取得したレコードを返す", async () => {
      const messageService = new MessageService(mockkintoneSdk);
      const appId = "1";

      vi.spyOn(kintone.app, "getQueryCondition").mockReturnValue("");
      mockkintoneSdk.getRecords.mockResolvedValue({
        records: [
          {
            field1: { type: "SINGLE_LINE_TEXT", value: "value1" },
            field2: { type: "SINGLE_LINE_TEXT", value: "value2" },
          },
        ] as Record[],
      });

      const records = await messageService.fetchRecords(appId);
      expect(records).toEqual([
        {
          field1: { type: "SINGLE_LINE_TEXT", value: "value1" },
          field2: { type: "SINGLE_LINE_TEXT", value: "value2" },
        },
      ]);
    });
  });

  describe("generateMessages", () => {
    it("フィールド値を含むメッセージを返す", () => {
      const messageService = new MessageService(mockkintoneSdk);

      const records: Record[] = [
        {
          $id: {
            type: "__ID__",
            value: "1",
          },
        },
        {
          $id: {
            type: "__ID__",
            value: "2",
          },
        },
        {
          $id: {
            type: "__ID__",
            value: "3",
          },
        },
      ];
      const message = messageService.generateMessage(records);

      expect(message).toBe("1\n2\n3");
    });
  });
});
