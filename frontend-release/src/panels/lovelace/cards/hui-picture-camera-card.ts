import "@material/mwc-ripple";
import type { Ripple } from "@material/mwc-ripple";
import { RippleHandlers } from "@material/mwc-ripple/ripple-handlers";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { classMap } from "lit/directives/class-map";
import {
  customElement,
  property,
  state,
  eventOptions,
  queryAsync,
} from "lit/decorators";
import { ifDefined } from "lit/directives/if-defined";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { computeDomain } from "../../../common/entity/compute_domain";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import { computeStateName } from "../../../common/entity/compute_state_name";
import "../../../components/ha-card";
import { ActionHandlerEvent } from "../../../data/lovelace";
import { HomeAssistant } from "../../../types";
import { actionHandler } from "../common/directives/action-handler-directive";
import { findEntities } from "../common/find-entities";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-image";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { LovelaceCard, LovelaceCardEditor } from "../types";
import { PictureEntityCardConfig } from "./types";
import { UNAVAILABLE } from "../../../data/entity";
import "../../../components/button-recorder";
import "../../../components/unavailable-icon";

@customElement("hui-picture-camera-card")
class HuiPictureEntityCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-picture-camera-card-editor");
    return document.createElement("hui-picture-camera-card-editor");
  }

  @property({ type: String }) public layout = "big";

  @property({ type: Boolean })
  public toggleCam = false;

  public static getStubConfig(
    hass: HomeAssistant,
    entities: string[],
    entitiesFallback: string[]
  ): PictureEntityCardConfig {
    const maxEntities = 1;
    const foundEntities = findEntities(
      hass,
      maxEntities,
      entities,
      entitiesFallback,
      ["camera"]
    );

    return {
      type: "picture-camera",
      entity: foundEntities[0] || "",
      camera_image: "",
    };
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: PictureEntityCardConfig;

  @queryAsync("mwc-ripple") private _ripple!: Promise<Ripple | null>;

  @state() private _shouldRenderRipple = false;

  public getCardSize(): number {
    return 3;
  }

  public setConfig(config: PictureEntityCardConfig): void {
    if (!config || !config.entity) {
      throw new Error("Entity must be specified");
    }

    if (
      computeDomain(config.entity) !== "camera" &&
      !config.image &&
      !config.state_image &&
      !config.camera_image
    ) {
      throw new Error("No image source configured");
    }

    this._config = { show_name: true, show_state: true, ...config };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.hass) {
      return;
    }
    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    const oldConfig = changedProps.get("_config") as
      | PictureEntityCardConfig
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

  protected render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }

    const stateObj = this.hass.states[this._config.entity];

    if (!stateObj) {
      return html`
        <hui-warning>
          ${createEntityNotFoundWarning(this.hass, this._config.entity)}
        </hui-warning>
      `;
    }

    const name = this._config.name || computeStateName(stateObj);
    const entityState = computeStateDisplay(
      this.hass!.localize,
      stateObj,
      this.hass.locale
    );

    let footer: TemplateResult | string = "";
    if (this._config.show_name && this._config.show_state) {
      footer = html`
        <div class="footer both">
          <div>${name}</div>
          <svg
            class="togcam"
            width="50"
            height="50"
            viewBox="0 0 50 50"
            fill="#FFFFFF"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M31.21 38.19H7.46997C5.80997 38.19 4.46997 36.85 4.46997 35.19V13.46C4.46997 11.8 5.80997 10.46 7.46997 10.46H31.21C32.87 10.46 34.21 11.8 34.21 13.46V35.19C34.21 36.85 32.87 38.19 31.21 38.19Z M28.0699 23.4799L41.6499 13.1899C42.3499 12.6599 43.3499 13.1599 43.3499 14.0399V34.6299C43.3499 35.5099 42.3499 35.9999 41.6499 35.4799L28.0699 25.1699C27.5099 24.7499 27.5099 23.8999 28.0699 23.4799Z"
            />
          </svg>
        </div>
      `;
    } else if (this._config.show_name) {
      footer = html`<div class="footer single">${name}</div>`;
    }

    return html`
      ${this.layout !== "small"
        ? html` <ha-card class="ha-card-og">
            <!-- <button-recorder></button-recorder> -->
            ${stateObj.state === UNAVAILABLE
              ? html`<unavailable-icon></unavailable-icon>`
              : html``}
            <hui-image
              class=${classMap({
                "hui-image-medium": this.layout === "medium",
                "hui-image-big": this.layout === "big",
              })}
              .hass=${this.hass}
              .image=${this._config?.image}
              .stateImage=${this._config?.state_image}
              .stateFilter=${this._config?.state_filter}
              .cameraImage=${computeDomain(this._config!.entity) === "camera"
                ? this._config?.entity
                : this._config?.camera_image}
              .cameraView=${this._config?.camera_view}
              .entity=${this._config?.entity}
              .aspectRatio=${this._config?.aspect_ratio}
              @action=${this._handleAction}
              .actionHandler=${actionHandler({
                hasHold: hasAction(this._config!.hold_action),
                hasDoubleClick: hasAction(this._config!.double_tap_action),
              })}
              tabindex=${ifDefined(
                hasAction(this._config?.tap_action) || this._config?.entity
                  ? "0"
                  : undefined
              )}
            >
            </hui-image>
            ${footer}
          </ha-card>`
        : html`
            ${
              /* @click=${ this._handleAction }
                @focus=${ this.handleRippleFocus }
                @blur=${ this.handleRippleBlur }
                @mousedown=${ this.handleRippleActivate }
                @mouseup=${ this.handleRippleDeactivate }
                @touchstart=${ this.handleRippleActivate }
                @touchend=${ this.handleRippleDeactivate }
                @touchcancel=${ this.handleRippleDeactivate }
                @keydown=${ this._handleKeyDown }
              */ html``
            }
            <ha-card
              @click=${this._handleAction}
              @focus=${this.handleRippleFocus}
              @blur=${this.handleRippleBlur}
              @mousedown=${this.handleRippleActivate}
              @mouseup=${this.handleRippleDeactivate}
              @touchstart=${this.handleRippleActivate}
              @touchend=${this.handleRippleDeactivate}
              @touchcancel=${this.handleRippleDeactivate}
              @keydown=${this._handleKeyDown}
              class=${classMap({
                "ha-card-small": this.layout === "small",
              })}
            >
              <!-- <button-recorder></button-recorder> -->
              ${stateObj.state === UNAVAILABLE
                ? html` <svg
                      class="ha-status-icon-small"
                      width="50"
                      height="50"
                      viewBox="0 0 50 50"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M31.21 38.19H7.46997C5.80997 38.19 4.46997 36.85 4.46997 35.19V13.46C4.46997 11.8 5.80997 10.46 7.46997 10.46H31.21C32.87 10.46 34.21 11.8 34.21 13.46V35.19C34.21 36.85 32.87 38.19 31.21 38.19Z M28.0699 23.4799L41.6499 13.1899C42.3499 12.6599 43.3499 13.1599 43.3499 14.0399V34.6299C43.3499 35.5099 42.3499 35.9999 41.6499 35.4799L28.0699 25.1699C27.5099 24.7499 27.5099 23.8999 28.0699 23.4799Z"
                      />
                      <path
                        d="M32.45 42.9499L33.73 41.9799C34.15 41.6599 34.23 41.0699 33.91 40.6599L7.55 5.87988C7.23 5.46988 6.64 5.37988 6.23 5.69988L4.95 6.66988C4.53 6.98988 4.45 7.57988 4.77 7.98988L31.14 42.7699C31.44 43.1799 32.04 43.2699 32.45 42.9499Z"
                        fill="#999999"
                      />
                    </svg>
                    <unavailable-icon></unavailable-icon>`
                : html`<svg
                    class="ha-status-icon-small"
                    width="50"
                    height="50"
                    viewBox="0 0 50 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M31.21 38.19H7.46997C5.80997 38.19 4.46997 36.85 4.46997 35.19V13.46C4.46997 11.8 5.80997 10.46 7.46997 10.46H31.21C32.87 10.46 34.21 11.8 34.21 13.46V35.19C34.21 36.85 32.87 38.19 31.21 38.19Z M28.0699 23.4799L41.6499 13.1899C42.3499 12.6599 43.3499 13.1599 43.3499 14.0399V34.6299C43.3499 35.5099 42.3499 35.9999 41.6499 35.4799L28.0699 25.1699C27.5099 24.7499 27.5099 23.8999 28.0699 23.4799Z"
                    />
                  </svg> `}
              <span class="rect-card-small" tabindex="-1" .title=${name}
                >${name}</span
              >
              ${this._shouldRenderRipple ? html`<mwc-ripple></mwc-ripple>` : ""}
            </ha-card>
          `}
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .ha-card-og {
        min-height: 75px;
        overflow: hidden;
        position: relative;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 1.5rem;
      }

      .ha-card-medium {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: left;
        text-align: left;
        padding: 4% 0;
        font-size: 1.5rem;
        height: 100%;
        box-sizing: border-box;
        justify-content: center;
        position: relative;
        overflow: hidden;
        border-radius: 1.5rem;
        font-weight: 450;
      }
      .ha-card-small {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: left;
        text-align: left;
        padding: 4% 0;
        font-size: 1.2rem;
        height: 100%;
        box-sizing: border-box;
        justify-content: center;
        position: relative;
        overflow: hidden;
        border-radius: 1.5rem;
        font-weight: 450;
      }
      .rect-card-small {
        padding: 5%;
        padding-bottom: 4%;
        margin-bottom: 4%;
        margin-left: 7%;
        white-space: nowrap;
        display: inline-block;
        overflow: hidden;
        max-width: 110px;
        /* float: left; */
        text-overflow: ellipsis;
      }
      .ha-status-icon-small {
        width: 63%;
        height: auto;
        fill: var(--paper-item-icon-color, #44739e);
        --mdc-icon-size: 100%;
        margin-left: 5%;
      }

      hui-image {
        width: 100%;
        cursor: pointer;
      }

      .footer {
        /* start paper-font-common-nowrap style */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        /* end paper-font-common-nowrap style */

        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(
          --ha-picture-card-background-color,
          rgba(0, 0, 0, 0.3)
        );
        padding: 16px;
        font-size: 16px;
        line-height: 16px;
        color: var(--ha-picture-card-text-color, white);
      }

      .both {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .togcam {
        width: 24px;
        height: 24px;
      }

      .single {
        text-align: center;
      }
    `;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.hass!, this._config!, ev.detail.action!);
  }

  private _rippleHandlers: RippleHandlers = new RippleHandlers(() => {
    this._shouldRenderRipple = true;
    return this._ripple;
  });

  private _handleKeyDown(ev: KeyboardEvent) {
    if (ev.key === "Enter" || ev.key === " ") {
      handleAction(this, this.hass!, this._config!, "tap");
    }
  }

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
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-picture-camera-card": HuiPictureEntityCard;
  }
}
