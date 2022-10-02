import "@polymer/paper-styles/paper-styles";
import "@polymer/polymer/lib/elements/custom-style";
import { derivedStyles } from "./styles";

export const DEFAULT_PRIMARY_COLOR = "#FFFFFF";
export const DEFAULT_ACCENT_COLOR = "#4BA2FF";

const documentContainer = document.createElement("template");
documentContainer.setAttribute("style", "display: none;");

documentContainer.innerHTML = `<custom-style>
  <style>
    /*
      Home Assistant default styles.

      In Polymer 2.0, default styles should to be set on the html selector.
      (Setting all default styles only on body breaks shadyCSS polyfill.)
      See: https://github.com/home-assistant/home-assistant-polymer/pull/901
    */
    html {
      font-size: 14px;
      height: 100vh;

      /* variaveis raquel claro */
      --raquel-claro: #FFFFFF;
      --raquel-background: #FEFBFB;
      --raquel-light-grey-1: #FAFAFC;
      --raquel-light-grey-2: #F2F1F6;
      --raquel-dark-1: #7B7B7B;
      --raquel-dark-2: #303033;
      --raquel-blue-1: #9ACBFF;
      --raquel-blue-2: #4BA2FF;

      /* novas variaveis */
      --background-color-rgb: rgb(254,251,251);
      --background-color-rgb-hover: rgb(75,162,255,0.3);
      --paper-input-container-color: var(--raquel-dark-1);
      --paper-input-container-focus-color: var(--raquel-dark-1);
      --ha-card-border-radius: 1.5rem;
      --ha-fab-text-color: var(--raquel-claro);
      --header-card-picker-background: var(--raquel-light-grey-2);
      --app-header-text-color: var(--raquel-dark-2);
      --header-text-color: var(--raquel-dark-2);
      --app-header-edit-background-color: var(--raquel-blue-2);
      --app-header-selection-bar-color: var(--raquel-blue-2);
      --form-border: var(--raquel-dark-1);
      --divider-editor: rgba(0, 0, 0, .2);
      --state-icon-color: var(--raquel-dark-2);
      --state-icon-active-color: var(--raquel-blue-2);
      --sidebar-text-color-select: var(--raquel-blue-2);
      --sidebar-icon-color-select: var(--raquel-blue-2);
      --fab-text-color: var(--raquel-claro);
      --app-header-edit-text-color: var(--raquel-dark-2);
      --switch-unchecked-button-color: var(--raquel-dark-1);
      --switch-unchecked-track-color: "#9b9b9b";
      --switch-checked-button-color: var(--accent-color);
      --switch-checked-track-color: var(--accent-color);



      /* text */
      --primary-text-color:  var(--raquel-dark-2);
      --secondary-text-color: var(--raquel-dark-1);
      --text-light-primary-color: var(--raquel-dark-2);
      --disabled-text-color: #bdbdbd;
      --sidebar-text-color-select: var(--raquel-blue-2);
      --sidebar-icon-color-select: var(--raquel-blue-2);


      /* main interface colors */
      --primary-color: var(--raquel-claro);
      --dark-primary-color: #0288d1;
      --light-primary-color: #b3e5fC;
      --accent-color: var(--raquel-blue-2);
      --divider-color: rgba(0, 0, 0, .12);

      --scrollbar-thumb-color: rgb(194, 194, 194);

      --error-color: #db4437;
      --warning-color: #ffa600;
      --success-color: #43a047;
      --info-color: #039be5;

      /* backgrounds */
      --card-background-color: #ffffff;
      --primary-background-color: var(--raquel-light-grey-2);
      --secondary-background-color: #e5e5e5; /* behind the cards on state */

      /* for header */
      --header-height: 56px;

      /* for label-badge */
      --label-badge-red: #DF4C1E;
      --label-badge-blue: #039be5;
      --label-badge-green: #0DA035;
      --label-badge-yellow: #f4b400;
      --label-badge-grey: #9e9e9e;

      /* states */
      --state-icon-color: var(--raquel-dark-1);
      /* an active state is anything that would require attention */
      --state-icon-active-color: var(--raquel-blue-2);
      /* an error state is anything that would be considered an error */
      /* --state-icon-error-color: #db4437; derived from error-color */

      --state-on-color: #66a61e;
      --state-off-color: #ff0029;
      --state-home-color: #66a61e;
      --state-not_home-color: #ff0029;
      /* --state-unavailable-color: #a0a0a0; derived from disabled-text-color */
      --state-unknown-color: #606060;
      --state-idle-color: #7990a3;

      /* climate state colors */
      --state-climate-auto-color: #008000;
      --state-climate-eco-color: #00ff7f;
      --state-climate-cool-color: #2b9af9;
      --state-climate-heat-color: #ff8100;
      --state-climate-manual-color: #44739e;
      --state-climate-off-color: #8a8a8a;
      --state-climate-fan_only-color: #8a8a8a;
      --state-climate-dry-color: #efbd07;
      --state-climate-idle-color: #8a8a8a;

      /* energy */
      --energy-grid-consumption-color: #488fc2;
      --energy-grid-return-color: #8353d1;
      --energy-solar-color: #ff9800;
      --energy-non-fossil-color: #0f9d58;
      --energy-battery-out-color: #4db6ac;
      --energy-battery-in-color: #f06292;
      --energy-gas-color: #8E021B;

      /* opacity for dark text on a light background */
      --dark-divider-opacity: 0.12;
      --dark-disabled-opacity: 0.38; /* or hint text or icon */
      --dark-secondary-opacity: 0.54;
      --dark-primary-opacity: 0.87;

      /* opacity for light text on a dark background */
      --light-divider-opacity: 0.12;
      --light-disabled-opacity: 0.3; /* or hint text or icon */
      --light-secondary-opacity: 0.7;
      --light-primary-opacity: 1.0;

      /* rgb */
      --rgb-primary-color: 3, 169, 244;
      --rgb-accent-color: 255, 152, 0;
      --rgb-primary-text-color: 33, 33, 33;
      --rgb-secondary-text-color: 114, 114, 114;
      --rgb-text-primary-color: 255, 255, 255;
      --rgb-card-background-color: 255, 255, 255;

      /* input components */
      --input-idle-line-color: rgba(0, 0, 0, 0.42);
      --input-hover-line-color: rgba(0, 0, 0, 0.87);
      --input-disabled-line-color: rgba(0, 0, 0, 0.06);
      --input-outlined-idle-border-color: rgba(0, 0, 0, 0.38);
      --input-outlined-hover-border-color: rgba(0, 0, 0, 0.87);
      --input-outlined-disabled-border-color: rgba(0, 0, 0, 0.06);
      --input-fill-color: rgb(255, 255, 255);
      --input-disabled-fill-color: rgb(250, 250, 250);
      --input-ink-color: rgba(0, 0, 0, 0.87);
      --input-label-ink-color: rgba(0, 0, 0, 0.6);
      --input-disabled-ink-color: rgba(0, 0, 0, 0.37);
      --input-dropdown-icon-color: rgba(0, 0, 0, 0.54);

      /* Vaadin typography */
      --material-h6-font-size: 1.25rem;
      --material-small-font-size: 0.875rem;
      --material-caption-font-size: 0.75rem;
      --material-button-font-size: 0.875rem;

      ${Object.entries(derivedStyles)
        .map(([key, value]) => `--${key}: ${value};`)
        .join("")}
    }
  </style>
</custom-style>`;

document.head.appendChild(documentContainer.content);
