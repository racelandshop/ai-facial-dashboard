import { css, CSSResultGroup } from "lit";
import { HassEntity } from "home-assistant-js-websocket/dist/types";
import { customElement } from "lit/decorators";
import { computeDomain } from "../../../common/entity/compute_domain";
import { HomeAssistant } from "../../../types";
import { findEntities } from "../common/find-entities";
import { GraphHeaderFooterConfig } from "../header-footer/types";
import { LovelaceCardEditor } from "../types";
import { HuiEntityCard } from "./hui-entity-card";
import { EntityCardConfig, SensorCardConfig } from "./types";

const includeDomains = ["counter", "input_number", "number", "sensor"];

@customElement("hui-sensor-card")
class HuiSensorCard extends HuiEntityCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-sensor-card-editor");
    return document.createElement("hui-sensor-card-editor");
  }

  public static getStubConfig(
    hass: HomeAssistant,
    entities: string[],
    entitiesFallback: string[]
  ): SensorCardConfig {
    const maxEntities = 1;
    const entityFilter = (stateObj: HassEntity): boolean =>
      !isNaN(Number(stateObj.state)) &&
      !!stateObj.attributes.unit_of_measurement;

    const foundEntities = findEntities(
      hass,
      maxEntities,
      entities,
      entitiesFallback,
      includeDomains,
      entityFilter
    );

    return { type: "sensor", entity: foundEntities[0] || "", graph: "line" };
  }

  public setConfig(config: SensorCardConfig): void {
    if (
      !config.entity ||
      !includeDomains.includes(computeDomain(config.entity))
    ) {
      throw new Error("Missing sensor entity");
    }

    const { graph, detail, hours_to_show, ...cardConfig } = config;

    const entityCardConfig: EntityCardConfig = {
      ...cardConfig,
      type: "entity",
    };

    if (graph === "line") {
      const footerConfig: GraphHeaderFooterConfig = {
        type: "graph",
        entity: config.entity,
        detail: detail || 1,
        hours_to_show: hours_to_show || 24,
        limits: config.limits!,
      };

      entityCardConfig.footer = footerConfig;
    }

    super.setConfig(entityCardConfig);
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        cursor: pointer;
        outline: none;
        border-radius: 1.5rem;
        overflow: hidden;
      }
      .header {
        display: flex;
        padding: 8px 16px 0;
        justify-content: space-between;
      }
      .name {
        color: var(--accent-color);
        line-height: 40px;
        font-weight: 500;
        font-size: 16px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .icon {
        color: var(--state-icon-color, #44739e);
        line-height: 40px;
      }
      @media only screen and (max-width: 768px) {
        .info {
          font-size: 3rem;
        }
      }
      .info {
        padding-left: 10%;
        padding-bottom: 10%;
        margin-top: -4px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        line-height: 28px;
        font-size: 1.5vmax;
        font-weight: 450;
      }
      svg {
        border-radius: 1.5rem;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-sensor-card": HuiSensorCard;
  }
}
