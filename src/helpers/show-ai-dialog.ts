import { fireEvent } from "../../frontend-release/src/common/dom/fire_event";
import { PersonInfo } from "../types";

export interface aiPersonDialogParams {
  personInfo: PersonInfo;
}

export const importDeletePerson = () =>
  import("../components/dialogs/delete-person-facial-info-dialog");

export const importAddPerson = () =>
  import("../components/dialogs/upload-person-facial-info-dialog");

export const showPersonAIDataDialog = (
  element: HTMLElement,
  aiPersonDialog: aiPersonDialogParams
): void => {
  if (aiPersonDialog.personInfo.registered_status === false) {
    fireEvent(element, "show-dialog", {
      dialogTag: "upload-ai-facial-data-dialog",
      dialogImport: importAddPerson,
      dialogParams: aiPersonDialog,
    });
  } else {
    fireEvent(element, "show-dialog", {
      dialogTag: "delete-ai-facial-data-dialog",
      dialogImport: importDeletePerson,
      dialogParams: aiPersonDialog,
    });
  }
};
