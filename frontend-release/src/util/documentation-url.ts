import { HomeAssistant } from "../types";

export const documentationUrl = (hass: HomeAssistant, path: string) =>
  `https://store.automacaoraceland.pt/`;
// docs - domotica / #${ path } #${
//     hass.config.version.includes("b")
//       ? "rc"
//       : hass.config.version.includes("dev")
//       ? "next"
//       : "www"
//   };
// `https://${
//   hass.config.version.includes("b")
//     ? "rc"
//     : hass.config.version.includes("dev")
//     ? "next"
//     : "www"
// }.home-assistant.io${path}`;
