import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KintoneSdk } from "./kintoneSdk";

vi.mock("@kintone/rest-api-client");

describe("kintoneSdk.getRecords", () => {
  let mockClient: any;
  let kintoneApiService: KintoneSdk;

  beforeEach(() => {
    vi.clearAllMocks();

    // モッククライアントの作成
    mockClient = {
      record: {
        getRecords: vi.fn(),
      },
    };

    // モックされたコンストラクタがモッククライアントを返すように設定
    vi.mocked(KintoneRestAPIClient).mockImplementation(() => mockClient as any);

    kintoneApiService = new KintoneSdk(mockClient);
  });

  const appId = 123;
  const fields = ["field1", "field2"];
  const query = "status = 'completed'";

  it("制限内のすべてのレコードを取得できること", async () => {
    const mockRecords = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }));

    mockClient.record.getRecords
      .mockResolvedValueOnce({ records: mockRecords.slice(0, 500) })
      .mockResolvedValueOnce({ records: mockRecords.slice(500, 1000) })
      .mockResolvedValueOnce({ records: [] });

    const result = await kintoneApiService.getRecords(appId, fields, query);

    expect(result.records).toHaveLength(1000);
    expect(mockClient.record.getRecords).toHaveBeenCalledTimes(3);

    // 最初の呼び出しの検証
    expect(mockClient.record.getRecords).toHaveBeenNthCalledWith(1, {
      app: appId,
      fields,
      query: "status = 'completed' limit 500 offset 0",
    });

    // 2回目の呼び出しの検証
    expect(mockClient.record.getRecords).toHaveBeenNthCalledWith(2, {
      app: appId,
      fields,
      query: "status = 'completed' limit 500 offset 500",
    });

    // 3回目の呼び出しの検証（空配列を返す）
    expect(mockClient.record.getRecords).toHaveBeenNthCalledWith(3, {
      app: appId,
      fields,
      query: "status = 'completed' limit 500 offset 1000",
    });
  });

  it("取得するレコードが最大件数に達した場合を処理できること", async () => {
    mockClient.record.getRecords.mockResolvedValue({
      records: Array(500).fill({}),
    });

    const result = await kintoneApiService.getRecords(1);
    expect(result.records.length).toBe(10000);
  });

  it("結果が空の場合に正しく処理できること", async () => {
    mockClient.record.getRecords.mockResolvedValueOnce({ records: [] });

    const result = await kintoneApiService.getRecords(appId, fields, query);

    expect(result.records).toHaveLength(0);
  });
});
