import { html, PropertyValues, TemplateResult, css } from "lit";
import { customElement, property } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import "../frontend-release/src/resources/ha-style";
import "../frontend-release/src/components/search-input";
import "../frontend-release/src/components/ha-fab";
import { showDialog } from "../frontend-release/src/dialogs/make-dialog-manager";
import { applyThemesOnElement } from "../frontend-release/src/common/dom/apply_themes_on_element";
//import { fireEvent } from "../frontend-release/src/common/dom/fire_event";
import { makeDialogManager } from "../frontend-release/src/dialogs/make-dialog-manager";
import { HomeAssistant } from "../frontend-release/src/types";
import "./components/person-big-badge";
import { showPersonAIDataDialog } from "./helpers/show-ai-dialog";
import { localize } from "./localize/localize";
import { Dashboard } from "./hacs";
import { getPersonEntities } from "./helpers/common";
import { PersonInfo } from "./types";

declare global {
  // for fire event
  interface HASSDomEvents {
    "update-person-info": { personInfo: PersonInfo };
  }
}

@customElement("cameras-dashboard")
class cameraFrontend extends Dashboard {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public _personEntities: PersonInfo[] = [];

  public connectedCallback() {
    super.connectedCallback();
  }

  protected async firstUpdated(changedProps) {
    super.firstUpdated(changedProps);

    this._applyTheme();

    this.addEventListener("update-person-info", (ev) => {
      showPersonAIDataDialog(this, { personInfo: ev.detail.personInfo });
    });

    makeDialogManager(this, this.shadowRoot!);
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    if (!oldHass) {
      return;
    }
    if (oldHass.themes !== this.hass.themes) {
      this._applyTheme();
    }
  }

  // protected _updateCameraDashboard() {
  //   this.personEntities = getPersonEntities(this.hass.states);
  // }

  protected computeStatusString(registered_status: boolean): string {
    if (registered_status) {
      return localize("status.person_registered");
    }
    return localize("status.person_unregistered");
  }

  protected render(): TemplateResult | void {
    if (!this.hass) {
      return html``;
    }

    this._personEntities = getPersonEntities(this.hass.states);

    return html`
      <div class="title">${localize("common.person")}</div>
      <div class="person-entities">
        ${this._personEntities.map(
          (entry) =>
            html`<div class="ai-person">
              <person-big-badge slot="item-icon" .person=${entry}></person-big-badge
              ><paper-item-body class="entry-text"> ${entry.name} </paper-item-body>
              <paper-item-body
                class="entry-text ${classMap({
                  registered: entry.registered_status === true,
                  unregistered: entry.registered_status === false,
                })}"
              >
                ${this.computeStatusString(entry.registered_status)}
              </paper-item-body>
            </div>`
        )}
      </div>
    `;
  }

  static get styles() {
    return css`
      .title {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 40px;
        font-weight: bold;
        margin-top: 5%;
        margin-bottom: 5%;
        margin-right: 0;
        margin-left: 5%;
      }
      .person-entities {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
        grid-gap: 8%;
        margin-left: 5%;
        margin-right: 5%;
      }
      .ai-person {
        width: 200px;
      }
      .entry-text {
        font-size: 200%;
        margin-top: 10%;
        margin-right: 20%;
      }
      .entry-text.registered {
        font-size: 150%;
      }
      .entry-text.unregistered {
        font-size: 150%;
        color: blue;
      }
      ha-person-badge {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        border-style: solid;
        border-width: min(var(--ha-card-border-width, 1px), 10px);
        border-color: transparent;
        border-radius: var(--ha-card-border-radius, 4px);
      }
      ha-fab {
        position: sticky;
        float: right;
        right: calc(16px + env(safe-area-inset-right));
        bottom: calc(20px + env(safe-area-inset-bottom));
        z-index: 1;
      }
    `;
  }

  private _applyTheme() {
    let options: Partial<HomeAssistant["selectedTheme"]> | undefined;

    const themeName =
      this.hass.selectedTheme?.theme ||
      (this.hass.themes.darkMode && this.hass.themes.default_dark_theme
        ? this.hass.themes.default_dark_theme!
        : this.hass.themes.default_theme);

    options = this.hass.selectedTheme;
    if (themeName === "default" && options?.dark === undefined) {
      options = {
        ...this.hass.selectedTheme,
      };
    }

    if (this.parentElement) {
      applyThemesOnElement(this.parentElement, this.hass.themes, themeName, {
        ...options,
        dark: this.hass.themes.darkMode,
      });
      this.parentElement.style.backgroundColor = "var(--primary-background-color)";
    }
  }
}
