import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import {
  customElement,
  eventOptions,
  property,
  query,
  queryAsync,
  state,
} from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { Ripple } from "@material/mwc-ripple/mwc-ripple";
import { RippleHandlers } from "@material/mwc-ripple/ripple-handlers";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { fireEvent } from "../../../common/dom/fire_event";
import { alarmPanelIcon } from "../../../common/entity/alarm_panel_icon";
import "../../../components/ha-card";
import "../../../components/ha-chip";
import type { HaTextField } from "../../../components/ha-textfield";
import "../../../components/ha-textfield";
import {
  callAlarmAction,
  FORMAT_NUMBER,
} from "../../../data/alarm_control_panel";
import { UNAVAILABLE } from "../../../data/entity";
import type { HomeAssistant } from "../../../types";
import { findEntities } from "../common/find-entities";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import type { LovelaceCard } from "../types";
import { AlarmPanelCardConfig } from "./types";
import "../../../components/unavailable-icon";

const BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "clear"];

@customElement("hui-alarm-panel-card")
class HuiAlarmPanelCard extends LitElement implements LovelaceCard {
  public static async getConfigElement() {
    await import("../editor/config-elements/hui-alarm-panel-card-editor");
    return document.createElement("hui-alarm-panel-card-editor");
  }

  public static getStubConfig(
    hass: HomeAssistant,
    entities: string[],
    entitiesFallback: string[]
  ): AlarmPanelCardConfig {
    const includeDomains = ["alarm_control_panel"];
    const maxEntities = 1;
    const foundEntities = findEntities(
      hass,
      maxEntities,
      entities,
      entitiesFallback,
      includeDomains
    );

    return {
      type: "alarm-panel",
      states: ["arm_home", "arm_away"],
      entity: foundEntities[0] || "",
    };
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: AlarmPanelCardConfig;

  @query("#alarmCode") private _input?: HaTextField;

  @property({ type: String }) public layout = "big";

  @state() private _shouldRenderRipple = false;

  @state() private _show_lock = false;

  @queryAsync("mwc-ripple") private _ripple!: Promise<Ripple | null>;

  public async getCardSize(): Promise<number> {
    if (!this._config || !this.hass) {
      return 9;
    }

    const stateObj = this.hass.states[this._config.entity];

    return !stateObj || stateObj.attributes.code_format !== FORMAT_NUMBER
      ? 4
      : 9;
  }

  public setConfig(config: AlarmPanelCardConfig): void {
    if (
      !config ||
      !config.entity ||
      config.entity.split(".")[0] !== "alarm_control_panel"
    ) {
      throw new Error("Invalid configuration");
    }

    const defaults = {
      states: ["arm_away", "arm_home"],
    };

    this._config = { ...defaults, ...config };
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.hass) {
      return;
    }
    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    const oldConfig = changedProps.get("_config") as
      | AlarmPanelCardConfig
      | undefined;

    if (
      !oldHass ||
      !oldConfig ||
      oldHass.themes !== this.hass.themes ||
      oldConfig.theme !== this._config.theme
    ) {
      applyThemesOnElement(this, this.hass.themes, this._config.theme);
    }

    if (
      oldHass &&
      (oldHass!.states[this._config!.entity].state === "disarmed" ||
        oldHass!.states[this._config!.entity].state === "arming") &&
      this.hass!.states[this._config!.entity].state !== "disarmed" &&
      this.hass!.states[this._config!.entity].state !== "arming"
    ) {
      this._show_lock = true;
      setTimeout(() => {
        this._show_lock = false;
      }, 1500);
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has("_config")) {
      return true;
    }

    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;

    if (
      !oldHass ||
      oldHass.themes !== this.hass!.themes ||
      oldHass.locale !== this.hass!.locale
    ) {
      return true;
    }
    return (
      oldHass.states[this._config!.entity] !==
      this.hass!.states[this._config!.entity]
    );
  }

  protected render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }
    const stateObj = this.hass.states[this._config.entity];

    if (!stateObj) {
      return html`
        <hui-warning> ${createEntityNotFoundWarning(this.hass)} </hui-warning>
      `;
    }

    const stateLabel = this._stateDisplay(stateObj.state);
    console.log("armed", stateObj.state);

    return html`
      ${this.layout === "big"
        ? html`
            <ha-card>
              <div
                class=${classMap({
                  blur_this_b: this._show_lock === true,
                  content_main: this._show_lock === false,
                })}
              >
                <h1 class="card-header">
                  ${this._config.name ||
                  stateObj.attributes.friendly_name ||
                  stateLabel}
                  <ha-chip
                    hasIcon
                    class=${classMap({ [stateObj.state]: true })}
                    @click=${this._handleMoreInfo}
                  >
                    <ha-svg-icon
                      slot="icon"
                      .path=${alarmPanelIcon(stateObj.state)}
                    >
                    </ha-svg-icon>
                    ${stateLabel}
                  </ha-chip>
                </h1>
                <div id="armActions" class="actions">
                  ${(stateObj.state === "disarmed"
                    ? this._config.states!
                    : ["disarm"]
                  ).map(
                    (stateAction) => html`
                      <mwc-button
                        .action=${stateAction}
                        @click=${this._handleActionClick}
                        outlined
                      >
                        ${this._actionDisplay(stateAction)}
                      </mwc-button>
                    `
                  )}
                </div>
                ${!stateObj.attributes.code_format
                  ? html``
                  : html`
                      <ha-textfield
                        id="alarmCode"
                        .label=${this.hass.localize(
                          "ui.card.alarm_control_panel.code"
                        )}
                        type="password"
                        .inputmode=${stateObj.attributes.code_format ===
                        FORMAT_NUMBER
                          ? "numeric"
                          : "text"}
                      ></ha-textfield>
                    `}
                ${stateObj.attributes.code_format !== FORMAT_NUMBER
                  ? html``
                  : html`
                      <div id="keypad">
                        ${BUTTONS.map((value) =>
                          value === ""
                            ? html` <mwc-button disabled></mwc-button> `
                            : html`
                                <mwc-button
                                  .value=${value}
                                  @click=${this._handlePadClick}
                                  outlined
                                  class=${classMap({
                                    numberkey: value !== "clear",
                                  })}
                                >
                                  ${value === "clear"
                                    ? this.hass!.localize(
                                        `ui.card.alarm_control_panel.clear_code`
                                      )
                                    : value}
                                </mwc-button>
                              `
                        )}
                      </div>
                    `}
              </div>
              ${this._show_lock
                ? html`
                    <svg
                      viewBox="-10 -8 70 70"
                      height="100%"
                      width="100%"
                      class="svg-icon"
                    >
                      <path
                        id="svg-lock"
                        d="M 25 3 C 18.3633 3 13 8.3633 13 15 L 13 20 L 37 20 L 37 15 C 37 8.3633 31.6367 3 25 3 Z M 25 5 C 30.5664 5 35 9.4336 35 15 L 35 20 L 15 20 L 15 15 C 15 9.4336 19.4336 5 25 5 Z M 25 3"
                      />
                      <path
                        id="svg-base"
                        d="M 35 20 L 37 20 L 9 20 C 7.3008 20 6 21.3008 6 23 L 6 47 C 6 48.6992 7.3008 50 9 50 L 41 50 C 42.6992 50 44 48.6992 44 47 L 44 23 C 44 21.3008 42.6992 20 41 20 L 35 20 M 35 20 V 20 H 37 M 37 20 M 35 20 L 35 15 L 37 15 L 37 20 Z Z Z Z M 25 30 C 26.6992 30 28 31.3008 28 33 C 28 33.8984 27.6016 34.6875 27 35.1875 L 27 38 C 27 39.1016 26.1016 40 25 40 C 23.8984 40 23 39.1016 23 38 L 23 35.1875 C 22.3984 34.6875 22 33.8984 22 33 C 22 31.3008 23.3008 30 25 30 Z"
                      />
                    </svg>
                  `
                : html``}
            </ha-card>
          `
        : html`
            <ha-card
              @click=${this._handleMoreInfo}
              @focus=${this.handleRippleFocus}
              @blur=${this.handleRippleBlur}
              @mousedown=${this.handleRippleActivate}
              @mouseup=${this.handleRippleDeactivate}
              @touchstart=${this.handleRippleActivate}
              @touchend=${this.handleRippleDeactivate}
              @touchcancel=${this.handleRippleDeactivate}
              class=${classMap({
                "small-card": this.layout === "small",
                "medium-card": this.layout === "medium",
                unavailable: stateObj.state === UNAVAILABLE,
              })}
            >
              <ha-state-icon
                class="ha-status-icon-small"
                .icon=${"shield-home"}
              >
              </ha-state-icon>
              ${this._shouldRenderRipple ? html`<mwc-ripple></mwc-ripple>` : ""}
              ${stateObj.state === UNAVAILABLE
                ? html` <unavailable-icon></unavailable-icon>`
                : html``}</ha-card
            >
          `}
    `;
  }

  private _rippleHandlers: RippleHandlers = new RippleHandlers(() => {
    this._shouldRenderRipple = true;
    return this._ripple;
  });

  @eventOptions({ passive: true })
  private handleRippleActivate(evt?: Event) {
    this._rippleHandlers.startPress(evt);
  }

  private handleRippleDeactivate() {
    this._rippleHandlers.endPress();
  }

  private handleRippleFocus() {
    this._rippleHandlers.startFocus();
  }

  private handleRippleBlur() {
    this._rippleHandlers.endFocus();
  }

  private _actionDisplay(entityState: string): string {
    return this.hass!.localize(`ui.card.alarm_control_panel.${entityState}`);
  }

  private _stateDisplay(entityState: string): string {
    return entityState === UNAVAILABLE
      ? this.hass!.localize("state.default.unavailable")
      : this.hass!.localize(
          `component.alarm_control_panel.state._.${entityState}`
        ) || entityState;
  }

  private _handlePadClick(e: MouseEvent): void {
    const val = (e.currentTarget! as any).value;
    this._input!.value = val === "clear" ? "" : this._input!.value + val;
  }

  private _handleActionClick(e: MouseEvent): void {
    const input = this._input;
    callAlarmAction(
      this.hass!,
      this._config!.entity,
      (e.currentTarget! as any).action,
      input?.value || undefined
    );
    if (input) {
      input.value = "";
    }
  }

  private _handleMoreInfo() {
    fireEvent(this, "hass-more-info", {
      entityId: this._config!.entity,
    });
  }

  static get styles(): CSSResultGroup {
    return css`
      .unavailable {
        pointer-events: none;
      }
      unavailable-icon {
        position: absolute;
        top: 11px;
        right: 10%;
      }

      ha-card:focus {
        outline: none;
      }

      .ha-status-icon-small {
        width: 63%;
        /* margin-left: 5%; */
        height: auto;
        color: var(--paper-item-icon-color, #7b7b7b);
        --mdc-icon-size: 100%;
      }
      .svg-icon {
        fill: var(--paper-item-icon-color, #44739e);
      }

      ha-state-icon,
      span {
        outline: none;
      }
      unavailable-icon {
        position: absolute;
        top: 11px;
        right: 10%;
      }
      .state {
        font-size: 0.9rem;
        color: var(--secondary-text-color);
      }

      ha-card {
        padding-bottom: 16px;
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        --alarm-color-disarmed: var(--label-badge-green);
        --alarm-color-pending: var(--label-badge-yellow);
        --alarm-color-triggered: var(--label-badge-red);
        --alarm-color-armed: var(--label-badge-red);
        --alarm-color-autoarm: rgba(0, 153, 255, 0.1);
        --alarm-state-color: var(--alarm-color-armed);
      }
      .small-card {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        padding: 4% 0;
        font-size: 1.2rem;
        height: 100%;
        box-sizing: border-box;
        justify-content: center;
        overflow: hidden;
        border-radius: 1.5rem;
        font-weight: 450;
        /* aspect-ratio: 1; */
      }
      .medium-card {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        padding: 4% 0;
        font-size: 1.8rem;
        height: 100%;
        box-sizing: border-box;
        justify-content: center;
        overflow: hidden;
        border-radius: 1.5rem;
        font-weight: 450;
        /* aspect-ratio: 1; */
      }

      ha-chip {
        --ha-chip-background-color: var(--alarm-state-color);
        --primary-text-color: var(--text-primary-color);
        line-height: initial;
      }

      .card-header {
        display: flex;
        padding: 0 6%;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        font-size: 1.5rem;
        font-weight: 400;
        box-sizing: border-box;
      }

      ha-chip {
        animation: none;
      }
      .unavailable {
        --alarm-state-color: var(--state-unavailable-color);
      }

      .disarmed {
        --alarm-state-color: var(--alarm-color-disarmed);
        animation: none;
      }

      .triggered {
        --alarm-state-color: var(--alarm-color-triggered);
        animation: pulse 1s infinite;
      }

      .arming {
        --alarm-state-color: var(--alarm-color-pending);
        animation: pulse 1s infinite;
      }

      .pending {
        --alarm-state-color: var(--alarm-color-pending);
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }

      @keyframes lock {
        0% {
          transform: matrix(1, 0, 0, 1, 0, -4.7);
          fill: var(--paper-item-icon-color, #44739e);
        }
        100% {
          transform: matrix(1, 0, 0, 1, 0, 0);
          fill: var(--accent-color);
        }
      }
      @keyframes lock-color {
        0% {
          fill: var(--paper-item-icon-color, #44739e);
        }
        100% {
          fill: var(--accent-color);
        }
      }

      ha-textfield {
        display: block;
        margin: 8px;
        max-width: 150px;
        text-align: center;
      }

      .state {
        margin-left: 16px;
        position: relative;
        bottom: 16px;
        color: var(--alarm-state-color);
        animation: none;
      }

      #keypad {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        margin: auto;
        width: 100%;
        max-width: 300px;
      }

      #keypad mwc-button {
        padding: 8px;
        width: 30%;
        box-sizing: border-box;
      }

      .actions {
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
      }

      .actions mwc-button {
        margin: 0 4px 4px;
      }

      mwc-button#disarm {
        color: var(--error-color);
      }

      mwc-button.numberkey {
        --mdc-typography-button-font-size: var(--keypad-font-size, 0.875rem);
      }

      .blur_this_b {
        transition: 0.8s ease-out;
        filter: blur(1.5rem);
      }
      .content_main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        transition: 0.6s ease-out;
      }
      .svg-icon {
        position: absolute;
        width: 60%;
      }
      #svg-lock {
        animation: lock 1.5s ease-out;
      }
      #svg-base {
        animation: lock-color 1.5s ease-out;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-alarm-panel-card": HuiAlarmPanelCard;
  }
}
