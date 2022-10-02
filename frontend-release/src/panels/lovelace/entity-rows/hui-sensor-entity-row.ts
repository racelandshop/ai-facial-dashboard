import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import { UNAVAILABLE_STATES } from "../../../data/entity";
import { ActionHandlerEvent } from "../../../data/lovelace";
import { SENSOR_DEVICE_CLASS_TIMESTAMP } from "../../../data/sensor";
import { HomeAssistant } from "../../../types";
import { EntitiesCardEntityConfig } from "../cards/types";
import { actionHandler } from "../common/directives/action-handler-directive";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import "../components/hui-timestamp-display";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { TimestampRenderingFormat } from "../components/types";
import { LovelaceRow } from "./types";

interface SensorEntityConfig extends EntitiesCardEntityConfig {
  format?: TimestampRenderingFormat;
}

@customElement("hui-sensor-entity-row")
class HuiSensorEntityRow extends LitElement implements LovelaceRow {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: SensorEntityConfig;

  public setConfig(config: SensorEntityConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = config;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps);
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

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${this._config}>
        <div
          class="text-content"
          @action=${this._handleAction}
          .actionHandler=${actionHandler({
            hasHold: hasAction(this._config.hold_action),
            hasDoubleClick: hasAction(this._config.double_tap_action),
          })}
        >
          ${stateObj.attributes.device_class ===
            SENSOR_DEVICE_CLASS_TIMESTAMP &&
          !UNAVAILABLE_STATES.includes(stateObj.state)
            ? html`
                <hui-timestamp-display
                  .hass=${this.hass}
                  .ts=${new Date(stateObj.state)}
                  .format=${this._config.format}
                  capitalize
                ></hui-timestamp-display>
              `
            : computeStateDisplay(
                this.hass!.localize,
                stateObj,
                this.hass.locale
              )}
        </div>
      </hui-generic-entity-row>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.hass!, this._config!, ev.detail.action);
  }

  static get styles(): CSSResultGroup {
    return css`
      div {
        text-align: right;
      }
      .text-content {
        max-width: 33px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-sensor-entity-row": HuiSensorEntityRow;
  }
}