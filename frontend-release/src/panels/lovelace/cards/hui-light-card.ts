import { mdiDotsVertical } from "@mdi/js";
// import "@thomasloven/round-slider";
import "../../../components/round-slider";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { styleMap } from "lit/directives/style-map";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { fireEvent } from "../../../common/dom/fire_event";
import { computeStateName } from "../../../common/entity/compute_state_name";
import "../../../components/ha-card";
import "../../../components/ha-icon-button";
import "../../../components/ha-state-icon";
import { UNAVAILABLE, UNAVAILABLE_STATES } from "../../../data/entity";
import { LightEntity, lightSupportsDimming } from "../../../data/light";
import { ActionHandlerEvent } from "../../../data/lovelace";
import { HomeAssistant } from "../../../types";
import { actionHandler } from "../common/directives/action-handler-directive";
import { findEntities } from "../common/find-entities";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { LovelaceCard, LovelaceCardEditor } from "../types";
import { LightCardConfig } from "./types";
import "../../../components/unavailable-icon";

@customElement("hui-light-card")
export class HuiLightCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-light-card-editor");
    return document.createElement("hui-light-card-editor");
  }

  @property({ type: Boolean }) public statusslider = true;

  @property({ type: Boolean }) public dialog = false;

  @property({ type: String }) public layout = "big";

  public static getStubConfig(
    hass: HomeAssistant,
    entities: string[],
    entitiesFallback: string[]
  ): LightCardConfig {
    const includeDomains = ["light"];
    const maxEntities = 1;
    const foundEntities = findEntities(
      hass,
      maxEntities,
      entities,
      entitiesFallback,
      includeDomains
    );

    return { type: "light", entity: foundEntities[0] || "" };
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: LightCardConfig;

  private _brightnessTimout?: number;

  public getCardSize(): number {
    return 5;
  }

  public setConfig(config: LightCardConfig): void {
    if (!config.entity || config.entity.split(".")[0] !== "light") {
      throw new Error("Missing light entity");
    }

    this._config = {
      tap_action: { action: "toggle" },
      hold_action: { action: "more-info" },
      ...config,
    };
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const stateObj = this.hass.states[this._config!.entity] as LightEntity;

    if (!stateObj) {
      return html`
        <hui-warning>
          ${createEntityNotFoundWarning(this.hass, this._config.entity)}
        </hui-warning>
      `;
    }

    const brightness =
      Math.round((stateObj.attributes.brightness / 255) * 100) || 0;

    const name = this._config.name ?? computeStateName(stateObj);

    return html`
      <ha-card>
        <ha-icon-button
          class="more-info"
          .label=${this.hass!.localize(
            "ui.panel.lovelace.cards.show_more_info"
          )}
          .path=${mdiDotsVertical}
          @click=${this._handleMoreInfo}
          tabindex="0"
        ></ha-icon-button>

        <div
          class=${classMap({
            "content-big": this.layout === "big",
            "content-small":
              this.layout === "small" || this.layout === "medium",
            unavailable: UNAVAILABLE_STATES.includes(stateObj.state),
          })}
        >
          <div
            class=${classMap({
              "controls-big": this.layout === "big",
              "controls-small":
                this.layout === "small" || this.layout === "medium",
            })}
          >
            <div
              class=${classMap({
                "slider-big": this.layout === "big",
                "slider-small":
                  this.layout === "small" || this.layout === "medium",
              })}
            >
              ${this.layout === "big"
                ? html`
                    <round-slider2
                      class="round-slider"
                      min="0"
                      max="100"
                      .value=${brightness}
                      .disabled=${UNAVAILABLE_STATES.includes(stateObj.state)}
                      @value-changing=${this._dragEvent}
                      @value-changed=${this._setBrightness}
                      style=${styleMap({
                        visibility: lightSupportsDimming(stateObj)
                          ? "visible"
                          : "hidden",
                      })}
                    ></round-slider2>
                  `
                : html``}

              <ha-icon-button
                class=${classMap({
                  "light-button": this.layout === "big",
                  "light-button-small":
                    this.layout === "small" || this.layout === "medium",
                  "slider-left": lightSupportsDimming(stateObj),
                  "state-on": stateObj.state === "on",
                  "state-unavailable": stateObj.state === UNAVAILABLE,
                })}
                .disabled=${UNAVAILABLE_STATES.includes(stateObj.state)}
                style=${styleMap({
                  filter: this._computeBrightness(stateObj),
                  color: this._computeColor(stateObj),
                })}
                @action=${this._handleAction}
                .actionHandler=${actionHandler({
                  hasHold: hasAction(this._config!.hold_action),
                  hasDoubleClick: hasAction(this._config!.double_tap_action),
                })}
                tabindex="0"
              >
                <div class="container-icon">
                  <ha-state-icon
                    .icon=${this._config.icon}
                    .state=${stateObj}
                  ></ha-state-icon>
                </div>
              </ha-icon-button>
            </div>
          </div>
          <div
            class=${classMap({
              info: this.layout === "big",
              "info-small": this.layout === "small",
              "info-medium": this.layout === "medium",
            })}
            .title=${name}
          >
            ${UNAVAILABLE_STATES.includes(stateObj.state)
              ? html` <unavailable-icon></unavailable-icon> `
              : html`
                  <div
                    class=${classMap({
                      brightness: this.layout === "big",
                      "brightness-null":
                        this.layout === "small" || this.layout === "medium",
                    })}
                  >
                    %
                  </div>
                `}
            ${name}
          </div>
        </div>
      </ha-card>
    `;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.hass) {
      return;
    }

    const stateObj = this.hass!.states[this._config!.entity];

    if (!stateObj) {
      return;
    }

    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    const oldConfig = changedProps.get("_config") as
      | LightCardConfig
      | undefined;

    if (
      !oldHass ||
      !oldConfig ||
      oldHass.themes !== this.hass.themes ||
      oldConfig.theme !== this._config.theme
    ) {
      applyThemesOnElement(this, this.hass.themes, this._config.theme);
    }
  }

  private _dragEvent(e: any): void {
    this.shadowRoot!.querySelector(
      ".brightness"
    )!.innerHTML = `${e.detail.value} %`;
    this._showBrightness();
    this._hideBrightness();
  }

  private _showBrightness(): void {
    clearTimeout(this._brightnessTimout);
    this.shadowRoot!.querySelector(".brightness")!.classList.add(
      "show_brightness"
    );
  }

  private _hideBrightness(): void {
    this._brightnessTimout = window.setTimeout(() => {
      this.shadowRoot!.querySelector(".brightness")!.classList.remove(
        "show_brightness"
      );
    }, 500);
  }

  private _setBrightness(e: any): void {
    this.hass!.callService("light", "turn_on", {
      entity_id: this._config!.entity,
      brightness_pct: e.detail.value,
    });
  }

  private _computeBrightness(stateObj: LightEntity): string {
    if (stateObj.state === "off" || !stateObj.attributes.brightness) {
      return "";
    }
    const brightness = stateObj.attributes.brightness;
    return `brightness(${(brightness + 245) / 5}%)`;
  }

  private _computeColor(stateObj: LightEntity): string {
    if (stateObj.state === "off") {
      return "";
    }
    return stateObj.attributes.rgb_color
      ? `rgb(${stateObj.attributes.rgb_color.join(",")})`
      : "";
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.hass!, this._config!, ev.detail.action!);
  }

  private _handleMoreInfo() {
    fireEvent(this, "hass-more-info", {
      entityId: this._config!.entity,
    });
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-card {
        height: 100%;
        padding: 4% 0;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        border-radius: 1.5rem;
      }

      .light-button-small {
        color: var(--paper-item-icon-color, #7b7b7b);
        width: var(--mdc-icon-size, 24px);
        height: var(--mdc-icon-size, 24px);
        border-radius: 100%;
        --mdc-icon-button-size: 100%;
        --mdc-icon-size: 100%;
      }

      .light-button {
        color: var(--paper-item-icon-color, #7b7b7b);
        grid-row-start: 1;
        grid-column-start: 1;
        margin-top: 8%;
        margin-left: 20%;
        width: 60%;
        height: 60%;
        box-sizing: border-box;
        border-radius: 100%;
        --mdc-icon-button-size: 100%;
        --mdc-icon-size: 100%;
      }
      mwc-icon-button {
        height: 100%;
        width: 100%;
      }
      .content-big {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .content-small {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: left;
      }
      .container-icon {
        height: 100%;
        width: 100%;
      }

      .controls-big {
        width: 50%;
        text-align: center;
      }

      .controls-small {
        width: 63%;
        height: 70%;
        margin-right: 40%;
        text-align: center;
      }

      .info {
        text-align: center;
        padding: 5%;
        padding-top: 0%;
        font-size: 2.3rem;
        font-weight: 450;
        white-space: nowrap;
        display: inline-block;
        overflow: hidden;
        max-width: 80%;
        text-overflow: ellipsis;
        justify-content: space-between;
      }

      .info-medium {
        padding: 5%;
        font-size: 1.8rem;
        font-weight: 450;
        padding-bottom: 4%;
        margin-bottom: 4%;
        margin-left: 7%;
        white-space: nowrap;
        display: inline-block;
        overflow: hidden;
        max-width: 200px;
        float: left;
        text-overflow: ellipsis;
      }

      .info-small {
        padding: 5%;
        font-size: 1.2rem;
        font-weight: 450;
        padding-bottom: 4%;
        margin-bottom: 4%;
        margin-left: 7%;
        display: inline-block;
        max-width: 110px;
        white-space: nowrap;
        float: left;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      ha-state-icon {
        width: 100%;
        height: 100%;
      }

      ha-icon-button + span {
        text-align: center;
      }

      .more-info {
        position: absolute;
        cursor: pointer;
        top: 0;
        right: 0;
        border-radius: 100%;
        color: var(--secondary-text-color);
        z-index: 1;
      }
      unavailable-icon {
        position: absolute;
        top: 11px;
        right: 25%;
      }
      .slider-big {
        height: 100%;
        width: 100%;
        position: relative;
        display: grid;
        align-items: center;
        justify-content: center;
        grid-template-columns: 1fr;
        /* max-width: 150px; */
      }

      .slider-small {
        height: 90%;
        width: 100%;
        position: relative;
        /* max-width: 200px; */
      }
      .round-slider {
        grid-row-start: 1;
        grid-column-start: 1;
        --round-slider-path-color: var(--slider-track-color);
        --round-slider-bar-color: var(--accent-color);
        float: top;
      }

      .light-button.state-on {
        color: var(--state-light-active-color, #ffbd4b);
      }
      .light-button-small.state-on {
        color: var(--state-light-active-color, #ffbd4b);
      }

      .light-button.state-unavailable {
        color: var(--state-icon-unavailable-color);
      }
      .light-button-small.state-unavailable {
        color: var(--state-icon-unavailable-color);
      }

      .brightness {
        font-size: 1.3rem;
        padding-bottom: 10%;
        padding-left: 2%;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        -moz-transition: opacity 0.5s ease-in-out;
        -webkit-transition: opacity 0.5s ease-in-out;
      }

      .brightness-null {
        display: none;
      }

      .show_brightness {
        opacity: 1;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-light-card": HuiLightCard;
  }
}
