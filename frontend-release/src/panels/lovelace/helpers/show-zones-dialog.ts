/*
import { fireEvent } from "../../../common/dom/fire_event";
import { Lovelace } from "../types";

export interface ZonesDialogParams {
  lovelace?: Lovelace;
}

export const importZonesDialog = () => import("../zones-dialog");

export const showZonesDialog = (
  element: HTMLElement,
  ZonesDialogParams: ZonesDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "zones-dialog",
    dialogImport: importZonesDialog,
    dialogParams: ZonesDialogParams,
  });
};
*/

/*

***********************************
this.addEventListener("show-zones", () => {
    showZonesDialog(this, { database: cameraDatabase }); //Keep the config for now if I need to add information, remove in the future if no information is required
  });

  */

import { fireEvent, HASSDomEvent } from "../../../common/dom/fire_event";
// import { LovelaceViewConfig } from "../../../data/lovelace";
import { Lovelace } from "../types";

declare global {
  // for fire event
  interface HASSDomEvents {
    "reload-lovelace": undefined;
    "show-zones-dialog": ZonesDialogParams;
  }
  // for add event listener
  interface HTMLElementEventMap {
    "reload-lovelace": HASSDomEvent<undefined>;
  }
}

let registeredDialog = false;
const dialogShowEvent = "show-zones-dialog";
const dialogTag = "zones-dialog";

export interface ZonesDialogParams {
  lovelace: Lovelace;
  viewIndex?: number;
  route?: { path: string; prefix: string };
}

const registerZonesDialog = (element: HTMLElement): Event =>
  fireEvent(element, "register-dialog", {
    dialogShowEvent,
    dialogTag,
    dialogImport: () => import("../zones-dialog"),
  });

export const showZonesDialog = (
  element: HTMLElement,
  ZonesDialogParams: ZonesDialogParams
): void => {
  if (!registeredDialog) {
    registeredDialog = true;
    registerZonesDialog(element);
  }
  fireEvent(element, dialogShowEvent, ZonesDialogParams);
};
