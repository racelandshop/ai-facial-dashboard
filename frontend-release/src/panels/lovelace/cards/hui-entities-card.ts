/* eslint-disable lit/binding-positions */
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { property, customElement, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { DOMAINS_TOGGLE } from "../../../common/const";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { computeDomain } from "../../../common/entity/compute_domain";
import "../../../components/ha-card";
import { HomeAssistant } from "../../../types";
import { computeCardSize } from "../common/compute-card-size";
import { findEntities } from "../common/find-entities";
import { processConfigEntities } from "../common/process-config-entities";
import "../components/hui-entities-toggle";
import { createHeaderFooterElement } from "../create-element/create-header-footer-element";
import { createRowElement } from "../create-element/create-row-element";
import {
  EntityConfig,
  LovelaceRow,
  LovelaceRowConfig,
} from "../entity-rows/types";
import {
  LovelaceCard,
  LovelaceCardEditor,
  LovelaceHeaderFooter,
} from "../types";
import { EntitiesCardConfig } from "./types";

@customElement("hui-entities-card")
class HuiEntitiesCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-entities-card-editor");
    return document.createElement("hui-entities-card-editor");
  }

  @property({ type: Boolean }) public hideInteract = false;

  @property({ type: String }) public layout = "big";

  public static getStubConfig(
    hass: HomeAssistant,
    entities: string[],
    entitiesFallback: string[]
  ): EntitiesCardConfig {
    const maxEntities = 3;
    const foundEntities = findEntities(
      hass,
      maxEntities,
      entities,
      entitiesFallback,
      ["light", "switch"]
    );

    return { type: "entities", entities: foundEntities };
  }

  @state() private _config?: EntitiesCardConfig;

  private _hass?: HomeAssistant;

  private _configEntities?: LovelaceRowConfig[];

  private _showHeaderToggle?: boolean;

  private _headerElement?: LovelaceHeaderFooter;

  private _footerElement?: LovelaceHeaderFooter;

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.shadowRoot
      ?.querySelectorAll("#states > div > *")
      .forEach((element: unknown) => {
        (element as LovelaceRow).hass = hass;
      });
    if (this._headerElement) {
      this._headerElement.hass = hass;
    }
    if (this._footerElement) {
      this._footerElement.hass = hass;
    }
    const entitiesToggle = this.shadowRoot?.querySelector(
      "hui-entities-toggle"
    );
    if (entitiesToggle) {
      (entitiesToggle as any).hass = hass;
    }
  }

  public async getCardSize(): Promise<number> {
    if (!this._config) {
      return 0;
    }
    // +1 for the header
    let size = (this._config.title || this._showHeaderToggle ? 2 : 0) + 1; // + (this._config.entities.length || 1);
    if (this._headerElement) {
      const headerSize = computeCardSize(this._headerElement);
      size += headerSize instanceof Promise ? await headerSize : headerSize;
    }
    if (this._footerElement) {
      const footerSize = computeCardSize(this._footerElement);
      size += footerSize instanceof Promise ? await footerSize : footerSize;
    }

    return size;
  }

  public setConfig(config: EntitiesCardConfig): void {
    if (!config.entities || !Array.isArray(config.entities)) {
      throw new Error("Entities must be specified");
    }

    const entities = processConfigEntities(config.entities);

    this._config = config;
    this._configEntities = entities;
    if (config.title !== undefined && config.show_header_toggle === undefined) {
      // Default value is show toggle if we can at least toggle 2 entities.
      let toggleable = 0;
      for (const rowConf of entities) {
        if (!("entity" in rowConf)) {
          continue;
        }
        toggleable += Number(DOMAINS_TOGGLE.has(computeDomain(rowConf.entity)));
        if (toggleable === 2) {
          break;
        }
      }
      this._showHeaderToggle = toggleable === 2;
    } else {
      this._showHeaderToggle = config.show_header_toggle;
    }

    if (this._config.header) {
      this._headerElement = createHeaderFooterElement(
        this._config.header
      ) as LovelaceHeaderFooter;
      this._headerElement.type = "header";
      if (this._hass) {
        this._headerElement.hass = this._hass;
      }
    } else {
      this._headerElement = undefined;
    }

    if (this._config.footer) {
      this._footerElement = createHeaderFooterElement(
        this._config.footer
      ) as LovelaceHeaderFooter;
      this._footerElement.type = "footer";
      if (this._hass) {
        this._footerElement.hass = this._hass;
      }
    } else {
      this._footerElement = undefined;
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this._hass) {
      return;
    }

    const oldHass = changedProps.get("_hass") as HomeAssistant | undefined;
    const oldConfig = changedProps.get("_config") as
      | EntitiesCardConfig
      | undefined;

    if (
      (changedProps.has("_hass") &&
        (!oldHass || oldHass.themes !== this._hass.themes)) ||
      (changedProps.has("_config") &&
        (!oldConfig || oldConfig.theme !== this._config.theme))
    ) {
      applyThemesOnElement(this, this._hass.themes, this._config.theme);
    }
  }

  protected render(): TemplateResult {
    if (!this._config || !this._hass) {
      return html``;
    }
    if (this.layout === "medium") {
      this.hideInteract =
        // eslint-disable-next-line no-unneeded-ternary
        this._config?.entities.length && this._config?.entities.length > 4
          ? true // hide interact
          : false; // show interact
    }
    if (this.layout === "small") {
      this.hideInteract = true;
    }

    return html`
      <ha-card
        class=${classMap({
          squared: this.layout !== "big",
        })}
      >
        <div
          id="states"
          class=${classMap({
            "card-content": this.layout === "big",
            "card-content-medium2":
              this.layout === "medium" &&
              this._config?.entities.length &&
              this._config?.entities.length > 4,
            "card-content-medium":
              this.layout === "medium" &&
              (!this._config?.entities.length ||
                this._config?.entities.length <= 4),
            "card-content-small": this.layout === "small",
          })}
        >
          ${!this._config.title && !this._showHeaderToggle && !this._config.icon
            ? ""
            : html`
                <div
                  class=${classMap({
                    "card-header": this.layout === "big",
                    "card-header-medium": this.layout === "medium",
                    "card-header-small": this.layout === "small",
                  })}
                >
                  <div
                    class=${classMap({
                      name: this.layout === "big" || this.layout === "medium",
                      "name-small": this.layout === "small",
                    })}
                  >
                    ${this._config.icon
                      ? html`
                          <ha-icon
                            class="icon"
                            .icon=${this._config.icon}
                          ></ha-icon>
                        `
                      : ""}
                    ${this._config.title}
                  </div>
                  ${!this._showHeaderToggle
                    ? html``
                    : html`
                        <hui-entities-toggle
                          .hass=${this._hass}
                          .entities=${(
                            this._configEntities!.filter(
                              (conf) => "entity" in conf
                            ) as EntityConfig[]
                          ).map((conf) => conf.entity)}
                        ></hui-entities-toggle>
                      `}
                </div>
              `}
          ${this._configEntities!.map((entityConf) =>
            this.renderEntity(entityConf)
          )}
        </div>

        ${this._footerElement
          ? html`<div class="header-footer footer">${this._footerElement}</div>`
          : ""}
      </ha-card>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-card {
        height: 100%;
        width: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-radius: 1.5rem;
        overflow: hidden;
      }

      .squared {
        aspect-ratio: 1;
      }

      .card-header .name {
        max-width: 70%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card-header-medium .name {
        max-width: 70%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .name-small {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 50%;
        padding-left: 5%;
      }

      #states > * {
        margin: 0;
        margin-bottom: 3%;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-content: space-between;
        align-items: center;
        margin: 0px;
        width: 100%;
        height: 35px;
      }

      .card-header-medium {
        display: flex;
        justify-content: space-between;
        align-content: space-between;
        align-items: center;
        margin: 0px;
        width: 100%;
        height: 0px;
      }

      .card-header-small {
        display: flex;
        justify-content: space-between;
        align-content: space-between;
        align-items: center;
        margin: 0px;
        width: 95%;
        height: 0px;
      }

      .card-content-small {
        height: 90%;
        width: 90%;
        display: grid;
        justify-content: space-between;
        margin: 5%;
        margin-left: 10%;
        align-items: center;
        grid-template-columns: repeat(1, 100%);
        grid-template-rows: repeat(3, 34%);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-content-medium {
        height: 90%;
        width: 90%;
        display: grid;
        justify-content: center;
        margin: 3%;
        align-items: center;
        grid-template-columns: repeat(1, 90%);
        grid-template-rows: repeat(4, 25%);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-content-medium2 {
        height: 90%;
        width: 90%;
        display: grid;
        justify-content: center;
        margin: 5%;
        align-items: center;
        grid-template-columns: repeat(2, 50%);
        grid-template-rows: repeat(4, 25%);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-content-medium2 .card-header {
        grid-column-start: 1;
        grid-column-end: 3;
      }

      .card-content-medium2 .card-header-medium {
        grid-column-start: 1;
        grid-column-end: 3;
      }

      #states > div > * {
        overflow: clip visible;
      }

      #states > div {
        position: relative;
      }
    `;
  }

  private renderEntity(entityConf: LovelaceRowConfig): TemplateResult {
    const element = createRowElement(
      (!("type" in entityConf) || entityConf.type === "conditional") &&
        this._config!.state_color
        ? ({
            state_color: true,
            hideInteract: this.hideInteract,
            layout: this.layout,
            ...(entityConf as EntityConfig),
          } as EntityConfig)
        : ({
            hideInteract: this.hideInteract,
            layout: this.layout,
            ...(entityConf as EntityConfig),
          } as EntityConfig)
    );
    if (this._hass) {
      element.hass = this._hass;
    }

    return html`<div>${element}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-entities-card": HuiEntitiesCard;
  }
}
