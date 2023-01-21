import "@material/mwc-button/mwc-button";
import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, LitElement, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../../../common/dom/fire_event";
import "../../../components/entity/ha-entity-toggle";
import "../../../components/ha-blueprint-picker";
import "../../../components/ha-card";
import "../../../components/ha-circular-progress";
import "../../../components/ha-markdown";
import "../../../components/ha-selector/ha-selector";
import "../../../components/ha-settings-row";
import "../../../components/ha-textfield";
import {
  BlueprintAutomationConfig,
  triggerAutomationActions,
} from "../../../data/automation";
import {
  BlueprintOrError,
  Blueprints,
  fetchBlueprints,
} from "../../../data/blueprint";
import { haStyle } from "../../../resources/styles";
import { HomeAssistant } from "../../../types";
import "../ha-config-section";
import "../../../components/ha-blueprint-picker-editor";

@customElement("blueprint-automation-editor")
export class HaBlueprintAutomationEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public isWide!: boolean;

  @property({ reflect: true, type: Boolean }) public narrow!: boolean;

  @property() public config!: BlueprintAutomationConfig;

  @property() public stateObj?: HassEntity;

  @state() private _blueprints?: Blueprints;

  @state() private _showDescription = false;

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this._getBlueprints();
  }

  private get _blueprint(): BlueprintOrError | undefined {
    if (!this._blueprints) {
      return undefined;
    }
    return this._blueprints[this.config.use_blueprint.path];
  }

  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (
      !this._showDescription &&
      changedProps.has("config") &&
      this.config.description
    ) {
      this._showDescription = true;
    }
  }

  protected render() {
    const blueprint = this._blueprint;
    // console.log("sdfsdfsd", this.config.use_blueprint);
    return html`
      <ha-config-section vertical .isWide=${this.isWide}>
        ${!this.narrow
          ? html` <span slot="header">${this.config.alias}</span> `
          : ""}
        <span slot="introduction">
          ${this.hass.localize(
            "ui.panel.config.automation.editor.introduction"
          )}
        </span>
        <ha-card>
          <div class="card-content">
            <ha-textfield
              .label=${this.hass.localize(
                "ui.panel.config.automation.editor.alias"
              )}
              name="alias"
              .value=${this.config.alias || ""}
              @change=${this._valueChanged}
            >
            </ha-textfield>
            ${this._showDescription
              ? html`
                  <ha-textarea
                    .label=${this.hass.localize(
                      "ui.panel.config.automation.editor.description.label"
                    )}
                    .placeholder=${this.hass.localize(
                      "ui.panel.config.automation.editor.description.placeholder"
                    )}
                    name="description"
                    autogrow
                    .value=${this.config.description || ""}
                    @change=${this._valueChanged}
                  ></ha-textarea>
                `
              : html`
                  <div class="link-button-row">
                    <button class="link" @click=${this._addDescription}>
                      ${this.hass.localize(
                        "ui.panel.config.automation.editor.description.add"
                      )}
                    </button>
                  </div>
                `}
          </div>
          ${this.stateObj
            ? html`
                <div class="card-actions layout horizontal justified center">
                  <div class="layout horizontal center">
                    <ha-entity-toggle
                      .hass=${this.hass}
                      .stateObj=${this.stateObj!}
                    ></ha-entity-toggle>
                    ${this.hass.localize(
                      "ui.panel.config.automation.editor.enable_disable"
                    )}
                  </div>
                  <div id="buttons-header">
                    <a href="/config/automation/trace/${this.config.id}">
                      <mwc-button>
                        ${this.hass.localize(
                          "ui.panel.config.automation.editor.show_trace"
                        )}
                      </mwc-button>
                    </a>
                    <mwc-button
                      @click=${this._runActions}
                      .stateObj=${this.stateObj}
                    >
                      ${this.hass.localize("ui.card.automation.trigger")}
                    </mwc-button>
                  </div>
                </div>
              `
            : ""}
        </ha-card>
      </ha-config-section>
      <ha-card class="blueprint" id="blueprint-picker">
        <h1 class="card-header">
          ${this.hass.localize(
            "ui.panel.config.automation.editor.blueprint.header"
          )}
        </h1>
        <div class="blueprint-picker-container">
          ${this._blueprints
            ? Object.keys(this._blueprints).length
              ? html`
                  <ha-blueprint-picker-editor
                    .hass=${this.hass}
                    .label=${this.hass.localize(
                      "ui.panel.config.automation.editor.blueprint.blueprint_to_use"
                    )}
                    .blueprints=${this._blueprints}
                    .value=${this.config.use_blueprint.path}
                    @value-changed=${this._blueprintChanged}
                  ></ha-blueprint-picker-editor>
                `
              : this.hass.localize(
                  "ui.panel.config.automation.editor.blueprint.no_blueprints"
                )
            : html`<ha-circular-progress active></ha-circular-progress>`}
        </div>
      </ha-card>
      <ha-card class="blueprint" id="blueprint-editor">
        ${this.config.use_blueprint.path
          ? blueprint && "error" in blueprint
            ? html`<p class="warning padding">
                There is an error in this Blueprint: ${blueprint.error}
              </p>`
            : html`${blueprint?.metadata.description
                ? html`
                    <h1 class="card-header">
                      ${this.hass!.localize(
                        `blueprint.${blueprint?.metadata.name}`
                      )
                        ? this.hass!.localize(
                            `blueprint.${blueprint?.metadata.name}`
                          )
                        : blueprint?.metadata.name}
                    </h1>
                  `
                : ""}
              ${blueprint?.metadata?.input &&
              Object.keys(blueprint.metadata.input).length
                ? Object.entries(blueprint.metadata.input).map(
                    ([key, value]) =>
                      html` <ha-settings-row .narrow=${this.narrow}>
                        <span slot="heading"
                          >${this.hass!.localize(`blueprint.${value!.name}`)
                            ? this.hass!.localize(`blueprint.${value!.name}`)
                            : value!.name || key}</span
                        >
                        <!-- E aqui -->
                        <span slot="description"
                          >${this.hass!.localize(
                            `blueprint.${value!.description}`
                          )
                            ? this.hass!.localize(
                                `blueprint.${value!.description}`
                              )
                            : value!.description}</span
                        >
                        ${value?.selector
                          ? html`<ha-selector
                              .hass=${this.hass}
                              .selector=${value.selector}
                              .key=${key}
                              .value=${(this.config.use_blueprint.input &&
                                this.config.use_blueprint.input[key]) ??
                              value?.default}
                              @value-changed=${this._inputChanged}
                            ></ha-selector>`
                          : html`<ha-textfield
                              .key=${key}
                              required
                              .value=${(this.config.use_blueprint.input &&
                                this.config.use_blueprint.input[key]) ??
                              value?.default}
                              @input=${this._inputChanged}
                            ></ha-textfield>`}
                      </ha-settings-row>`
                  )
                : html`<p class="padding">
                    ${this.hass.localize(
                      "ui.panel.config.automation.editor.blueprint.no_inputs"
                    )}
                  </p>`}`
          : ""}
      </ha-card>
    `;
  }

  private async _getBlueprints() {
    this._blueprints = await fetchBlueprints(this.hass, "automation");
  }

  private _runActions(ev: Event) {
    triggerAutomationActions(this.hass, (ev.target as any).stateObj.entity_id);
  }

  private _blueprintChanged(ev) {
    ev.stopPropagation();
    if (this.config.use_blueprint.path === ev.detail.value) {
      return;
    }
    console.log("ASDSADAS", this._blueprints);
    fireEvent(this, "value-changed", {
      value: {
        ...this.config!,
        use_blueprint: {
          path: ev.detail.value,
        },
      },
    });
  }

  private _inputChanged(ev) {
    ev.stopPropagation();
    const target = ev.target as any;
    console.log("target", target);
    const key = target.key;
    console.log("key", key);
    const value = ev.detail?.value || target.value;
    console.log("value", value);
    if (
      (this.config.use_blueprint.input &&
        this.config.use_blueprint.input[key] === value) ||
      (!this.config.use_blueprint.input && value === "")
    ) {
      return;
    }
    const input = { ...this.config.use_blueprint.input, [key]: value };

    if (value === "" || value === undefined) {
      delete input[key];
    }

    fireEvent(this, "value-changed", {
      value: {
        ...this.config!,
        use_blueprint: {
          ...this.config.use_blueprint,
          input,
        },
      },
    });
  }

  private _valueChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const target = ev.target as any;
    const name = target?.name;
    if (!name) {
      return;
    }
    const newVal = ev.path[0].__value;
    console.log("newval", newVal);
    if ((this.config![name] || "") === newVal) {
      return;
    }
    fireEvent(this, "value-changed", {
      value: { ...this.config!, [name]: newVal },
    });
  }

  private _addDescription() {
    this._showDescription = true;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      css`
        ha-card.blueprint {
          max-width: 1040px;
          margin: 24px auto;
        }
        .padding {
          padding: 12px;
        }
        .link-button-row {
          padding: 14px;
        }
        .blueprint-picker-container {
          padding: 0 16px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media only screen and (max-width: 800px) {
          #blueprint-picker {
            display: none;
          }
          #blueprint-editor {
            border-radius: 0;
          }
          .card-actions layout horizontal justified center {
          }
          .layout horizontal center {
          }
          #buttons-header {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
          }
        }
        ha-textarea,
        ha-textfield {
          display: block;
        }
        h3 {
          margin: 16px;
        }
        span[slot="introduction"] a {
          color: var(--accent-color);
        }
        p {
          margin-bottom: 0;
        }
        ha-entity-toggle {
          margin-right: 8px;
        }
        ha-settings-row {
          --paper-time-input-justify-content: flex-end;
          border-top: 1px solid var(--divider-color);
        }
        :host(:not([narrow])) ha-settings-row ha-textfield,
        :host(:not([narrow])) ha-settings-row ha-selector {
          width: 60%;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "blueprint-automation-editor": HaBlueprintAutomationEditor;
  }
}
