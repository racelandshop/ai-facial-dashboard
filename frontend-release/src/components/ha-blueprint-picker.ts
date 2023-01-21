import "@material/mwc-list/mwc-list-item";
import "./ha-select";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import memoizeOne from "memoize-one";
import { fireEvent } from "../common/dom/fire_event";
import { stopPropagation } from "../common/dom/stop_propagation";
import { stringCompare } from "../common/string/compare";
import { Blueprint, Blueprints, fetchBlueprints } from "../data/blueprint";
import { HomeAssistant } from "../types";
import "./ha-svg-icon";
import { classMap } from "lit/directives/class-map";
import "./entity/state-badge";

@customElement("ha-blueprint-picker")
class HaBluePrintPicker extends LitElement {
  public hass?: HomeAssistant;

  @property() public label?: string;

  @property() public value = "";

  @property() public domain = "automation";

  @property() public blueprints?: Blueprints;

  @property({ type: Boolean }) public disabled = false;

  public open() {
    const select = this.shadowRoot?.querySelector("ha-select");
    if (select) {
      // @ts-expect-error
      select.menuOpen = true;
    }
  }

  private _processedBlueprints = memoizeOne((blueprints?: Blueprints) => {
    if (!blueprints) {
      return [];
    }
    const result = Object.entries(blueprints)
      .filter(([_path, blueprint]) => !("error" in blueprint))
      .map(([path, blueprint]) => ({
        ...(blueprint as Blueprint).metadata,
        path,
      }));
    return result.sort((a, b) => stringCompare(a.group, b.group));
  });

  protected render(): TemplateResult {
    if (!this.hass) {
      return html``;
    }
    return html`
      <!-- <ha-select
        .label=${this.label ||
      this.hass.localize("ui.components.blueprint-picker.label")}
        fixedMenuPosition
        naturalMenuWidth
        .value=${this.value}
        .disabled=${this.disabled}
        @selected=${this._blueprintChanged}
        @closed=${stopPropagation}
      > -->
      <!-- <mwc-list-item value="">
          ${this.hass.localize(
        "ui.components.blueprint-picker.select_blueprint"
      )}
        </mwc-list-item> -->
      <div id="blueprint-list">
        ${this._processedBlueprints(this.blueprints).map(
          (blueprint) =>
            html`
              <mwc-list-item
                twoline
                graphic="icon"
                .value=${blueprint.path}
                @click=${this._blueprintChanged}
                ><div slot="graphic" id="icon">
                  <!-- <ha-icon> -->
                  ${blueprint.icon
                    ? html`<ha-svg-icon .path=${blueprint.icon}></ha-svg-icon>`
                    : html`<ha-svg-icon
                        .path=${"M12,20A7,7 0 0,1 5,13C5,11.72 5.35,10.5 5.95,9.5L15.5,19.04C14.5,19.65 13.28,20 12,20M3,4L1.75,5.27L4.5,8.03C3.55,9.45 3,11.16 3,13A9,9 0 0,0 12,22C13.84,22 15.55,21.45 17,20.5L19.5,23L20.75,21.73L13.04,14L3,4M11,9.44L13,11.44V8H11M15,1H9V3H15M19.04,4.55L17.62,5.97C16.07,4.74 14.12,4 12,4C10.17,4 8.47,4.55 7.05,5.5L8.5,6.94C9.53,6.35 10.73,6 12,6A7,7 0 0,1 19,13C19,14.27 18.65,15.47 18.06,16.5L19.5,17.94C20.45,16.53 21,14.83 21,13C21,10.88 20.26,8.93 19.03,7.39L20.45,5.97L19.04,4.55Z"}
                      ></ha-svg-icon>`}
                  <!-- </ha-icon> -->
                </div>
                <!-- <span id="container-text"> -->
                <span class="name"
                  >${this.hass!.localize(`blueprint.${blueprint.name}`)
                    ? this.hass!.localize(`blueprint.${blueprint.name}`)
                    : blueprint.name}</span
                >
                <span
                  slot="secondary"
                  class="description ${classMap({
                    selected_text: this.value === blueprint.path,
                  })}"
                >
                  ${this.hass!.localize(`blueprint.${blueprint.description}`)
                    ? this.hass!.localize(`blueprint.${blueprint.description}`)
                    : blueprint.description}
                </span>
                <!-- </span> -->
              </mwc-list-item>
            `
        )}
      </div>
      <!-- </ha-select> -->
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    if (this.blueprints === undefined) {
      fetchBlueprints(this.hass!, this.domain).then((blueprints) => {
        this.blueprints = blueprints;
      });
    }
  }

  private _blueprintChanged(ev) {
    const newValue = ev.target.value;
    if (newValue !== this.value) {
      this.value = newValue;
      setTimeout(() => {
        fireEvent(this, "value-changed", { value: newValue });
        fireEvent(this, "change");
      }, 0);
    }
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: inline-block;
      }
      ha-select {
        width: 100%;
        min-width: 200px;
        display: block;
      }
      mwc-list-item {
        display: flex;
        align-items: center;
        /* background-color: var(--background-color-rgb); */
        /* border-radius: 1.5rem; */
        /* height: 100%; */
        max-height: 100px;
        font-size: 1.2rem;
        font-weight: 450;
        padding: 0;
        color: var(--primary-text-color);
        /* width: 100%; */
        /* border: 1px solid var(--divider-color); */
        -webkit-user-select: none; /* Chrome all / Safari all */
        -moz-user-select: none; /* Firefox all */
        -ms-user-select: none; /* IE 10+ */
        user-select: none;
      }
      ha-svg-icon {
        pointer-events: none;
        margin: 0 10px;
      }
      .description {
        color: var(--secondary-text-color);
        font-size: 11px;
        pointer-events: none;
      }
      #container-text {
        display: flex;
        pointer-events: none;
        flex-direction: column;
      }
      #icon {
        pointer-events: none;
      }
      .name {
        pointer-events: none;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-blueprint-picker": HaBluePrintPicker;
  }
}
