import { KintoneSdk } from "../util/kintoneSdk";

import type {
  AppID,
  Record,
} from "@kintone/rest-api-client/lib/src/client/types";

export class MessageService {
  private kintoneSdk: KintoneSdk;

  constructor(kintoneSdk: KintoneSdk) {
    this.kintoneSdk = kintoneSdk;
  }

  public async fetchRecords(appId: AppID): Promise<Record[]> {
    const condition = kintone.app.getQueryCondition() || "";
    const records = (await this.kintoneSdk.getRecords(appId, [], condition))
      .records;

    if (!records.length) {
      return [];
    }

    return records;
  }

  public alertMessage(records: Record[]): void {
    if (records.length === 0) {
      return;
    }
    alert(this.generateMessage(records));
  }

  public generateMessage(records: Record[]): string {
    const messageFromRecords: string = records
      .map((record) => record.$id.value)
      .join("\n");
    return messageFromRecords;
  }
}
