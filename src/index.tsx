import { KintoneRestAPIClient } from "@kintone/rest-api-client";

import { renderExecutionButton } from "./components/desktopUIHelpers";
import { MessageService } from "./service/MessageService";
import { copyTableUsersToFields } from "./service/TableUserFieldService";
import { KintoneSdk } from "./util/kintoneSdk";

import type { Record } from "@kintone/rest-api-client/lib/src/client/types";
import type { KintoneEvent } from "src/types/KintoneTypes";

// メイン処理
(() => {
  kintone.events.on("app.record.index.show", async (event: KintoneEvent) => {
    const restApiClient = new KintoneRestAPIClient();
    const kintoneSdk = new KintoneSdk(restApiClient);
    const messageService = new MessageService(kintoneSdk);

    const handleAlertButtonClick = async () => {
      try {
        const records = await messageService.fetchRecords(event.appId);
        if (records.length > 0) {
          messageService.alertMessage(records as Record[]);
        }
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    };

    renderExecutionButton(
      "alert-button",
      handleAlertButtonClick,
      "メッセージを表示",
    );
  });

  // レコード追加・編集時のイベントハンドラー
  kintone.events.on(
    ["app.record.create.submit", "app.record.edit.submit"],
    (event: any) => {
      // テーブル内のユーザーフィールドをテーブル外にコピー
      event.record = copyTableUsersToFields(event.record);
      return event;
    },
  );
})();
