import "@material/mwc-tab-bar/mwc-tab-bar";
import "@material/mwc-tab/mwc-tab";
import Fuse from "fuse.js";
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
import { until } from "lit/directives/until";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/search-input";
import "../../../../components/ha-circular-progress";
import { UNAVAILABLE_STATES } from "../../../../data/entity";
import type {
  LovelaceCardConfig,
  LovelaceConfig,
} from "../../../../data/lovelace";
import {
  CustomCardEntry,
  customCards,
  CUSTOM_TYPE_PREFIX,
  getCustomCardEntry,
} from "../../../../data/lovelace_custom_cards";
import type { HomeAssistant } from "../../../../types";
import {
  calcUnusedEntities,
  computeUsedEntities,
} from "../../common/compute-unused-entities";
import { tryCreateCardElement } from "../../create-element/create-card-element";
import type { LovelaceCard } from "../../types";
import { getCardStubConfig } from "../get-card-stub-config";
import { coreCards } from "../lovelace-cards";
import type { Card, CardPickTarget } from "../types";

interface CardElement {
  card: Card;
  element: TemplateResult;
}

@customElement("hui-card-picker")
export class HuiCardPicker extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _cards: CardElement[] = [];

  public lovelace?: LovelaceConfig;

  public cardPicked?: (cardConf: LovelaceCardConfig) => void;

  @state() private _filter = "";

  @state() private _width?: number;

  @state() private _height?: number;

  @property({ type: Boolean }) public virginity? = true;

  private _unusedEntities?: string[];

  private _usedEntities?: string[];

  private _filterCards = memoizeOne(
    (cardElements: CardElement[], filter?: string): CardElement[] => {
      if (!filter) {
        return cardElements;
      }
      let cards = cardElements.map(
        (cardElement: CardElement) => cardElement.card
      );
      const options: Fuse.IFuseOptions<Card> = {
        keys: ["type", "name", "description"],
        isCaseSensitive: false,
        minMatchCharLength: 2,
        threshold: 0.2,
      };
      const fuse = new Fuse(cards, options);
      cards = fuse.search(filter).map((result) => result.item);
      return cardElements.filter((cardElement: CardElement) =>
        cards.includes(cardElement.card)
      );
    }
  );

  protected render(): TemplateResult {
    if (
      !this.hass ||
      !this.lovelace ||
      !this._unusedEntities ||
      !this._usedEntities
    ) {
      return html``;
    }

    return html`
      <search-input
        .hass=${this.hass}
        .filter=${this._filter}
        @value-changed=${this._handleSearchChange}
        .label=${this.hass.localize(
          "ui.panel.lovelace.editor.edit_card.search_cards"
        )}
      ></search-input>
      <div
        id="content"
        style=${styleMap({
          width: this._width ? `${this._width}px` : "auto",
          height: this._height ? `${this._height}px` : "auto",
        })}
      >
        <div class="cards-container">
          ${this._filterCards(this._cards, this._filter).map(
            (cardElement: CardElement) => cardElement.element
          )}
        </div>
      </div>
    `;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    if (!oldHass) {
      return true;
    }

    if (oldHass.locale !== this.hass!.locale) {
      return true;
    }

    return false;
  }

  protected firstUpdated(): void {
    if (!this.hass || !this.lovelace) {
      return;
    }

    const usedEntities = computeUsedEntities(this.lovelace);
    const unusedEntities = calcUnusedEntities(this.hass, usedEntities);

    this._usedEntities = [...usedEntities].filter(
      (eid) =>
        this.hass!.states[eid] &&
        !UNAVAILABLE_STATES.includes(this.hass!.states[eid].state)
    );
    this._unusedEntities = [...unusedEntities].filter(
      (eid) =>
        this.hass!.states[eid] &&
        !UNAVAILABLE_STATES.includes(this.hass!.states[eid].state)
    );

    this._loadCards();
  }

  private _loadCards() {
    let cards: Card[] = coreCards.map((card: Card) => ({
      name: this.hass!.localize(
        `ui.panel.lovelace.editor.card.${card.type}.name`
      ),
      description: this.hass!.localize(
        `ui.panel.lovelace.editor.card.${card.type}.description`
      ),
      ...card,
    }));

    if (customCards.length > 0) {
      const customCardToRemove = ["Browser Player"]; // add the rest
      // TODO: discover type
      cards = (customCards as any)
        .filter(
          (ccard: CustomCardEntry) =>
            !customCardToRemove.includes(ccard.name ? ccard.name : "")
        )
        .map((ccard: CustomCardEntry) => ({
          type: ccard.type,
          name: ccard.name,
          description: ccard.description,
          showElement: ccard.preview,
          isCustom: true,
        }))
        .concat(cards);
    }
    this._cards = cards.map((card: Card) => ({
      card: card,
      element: html`${until(
        this._renderCardElement(card),
        html`
          <div class="card spinner">
            <ha-circular-progress active alt="Loading"></ha-circular-progress>
          </div>
        `
      )}`,
    }));
  }

  private _handleSearchChange(ev: CustomEvent) {
    const value = ev.detail.value;

    if (!value) {
      // Reset when we no longer filter
      this._width = undefined;
      this._height = undefined;
    } else if (!this._width || !this._height) {
      // Save height and width so the dialog doesn't jump while searching
      const div = this.shadowRoot!.getElementById("content");
      if (div && !this._width) {
        const width = div.clientWidth;
        if (width) {
          this._width = width;
        }
      }
      if (div && !this._height) {
        const height = div.clientHeight;
        if (height) {
          this._height = height;
        }
      }
    }

    this._filter = value;
  }

  private _cardPicked(ev: Event): void {
    let config: LovelaceCardConfig = (ev.currentTarget! as CardPickTarget)
      .config;

    if (config.type !== "grid" && this.virginity) {
      config = { type: "grid", cards: [config] };
    }
    fireEvent(this, "config-changed", { config });
  }

  private _tryCreateCardElement(cardConfig: LovelaceCardConfig) {
    const element = tryCreateCardElement(cardConfig) as LovelaceCard;
    element.hass = this.hass;
    element.addEventListener(
      "ll-rebuild",
      (ev) => {
        ev.stopPropagation();
        this._rebuildCard(element, cardConfig);
      },
      { once: true }
    );
    return element;
  }

  private _rebuildCard(
    cardElToReplace: LovelaceCard,
    config: LovelaceCardConfig
  ): void {
    let newCardEl: LovelaceCard;
    try {
      newCardEl = this._tryCreateCardElement(config);
    } catch (err: any) {
      return;
    }
    if (cardElToReplace.parentElement) {
      cardElToReplace.parentElement!.replaceChild(newCardEl, cardElToReplace);
    }
  }

  private async _renderCardElement(card: Card): Promise<TemplateResult> {
    let { type } = card;
    const { showElement, isCustom, name, description } = card;
    const customCard = isCustom ? getCustomCardEntry(type) : undefined;
    if (isCustom) {
      type = `${CUSTOM_TYPE_PREFIX}${type}`;
    }

    let element: LovelaceCard | undefined;
    let cardConfig: LovelaceCardConfig = { type };

    if (this.hass && this.lovelace) {
      cardConfig = await getCardStubConfig(
        this.hass,
        type,
        this._unusedEntities!,
        this._usedEntities!
      );

      if (showElement) {
        try {
          element = this._tryCreateCardElement(cardConfig);
        } catch (err: any) {
          element = undefined;
        }
      }
    }

    return html`
      <div class="card">
        <div
          class="overlay"
          @click=${this._cardPicked}
          .config=${cardConfig}
        ></div>
        <div
          class="preview ${classMap({
            description: !element || element.tagName === "HUI-ERROR-CARD",
          })}"
        >
          ${element && element.tagName !== "HUI-ERROR-CARD"
            ? element
            : customCard
            ? this.hass!.localize(
                `ui.panel.lovelace.editor.card.${customCard.description}`
              ) || customCard.description
            : description}
        </div>
        <div class="card-header">
          ${customCard
            ? `${
                this.hass!.localize(
                  `ui.panel.lovelace.editor.card.${customCard.type}`
                ) ||
                customCard.name ||
                customCard.type
              }`
            : name}
        </div>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        search-input {
          display: block;
          --mdc-shape-small: var(--card-picker-search-shape);
          /* margin: var(--card-picker-search-margin); */
          margin: 0%;
        }

        .cards-container {
          display: grid;
          grid-gap: 8px 8px;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          margin-top: 20px;
          justify-items: center;
          justify-content: center;
        }

        .card {
          height: 100%;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          border-radius: var(--ha-card-border-radius, 4px);
          background: var(--primary-background-color, #fafafa);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          border-radius: 1.5rem;
        }
        @media only screen and (max-width: 390px) {
          .card {
            height: 100%;
            max-width: 67vw;
            display: flex;
            flex-direction: column;
            border-radius: var(--ha-card-border-radius, 4px);
            background: var(--primary-background-color, #fafafa);
            cursor: pointer;
            position: relative;
            overflow: hidden;
            border-radius: 1.5rem;
          }
        }

        .card-header {
          color: var(--app-header-text-color);
          font-family: var(--ha-card-header-font-family, inherit);
          font-size: 16px;
          font-weight: bold;
          letter-spacing: -0.012em;
          line-height: 20px;
          padding: 12px 16px;
          display: block;
          text-align: center;
          background: var(--header-card-picker-background);
          border-top: 1px solid var(--divider-color);
        }

        .preview {
          pointer-events: none;
          margin: 20px;
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview > :first-child {
          zoom: 0.9;
          display: block;
          width: 100%;
        }

        .description {
          text-align: center;
        }

        .spinner {
          align-items: center;
          justify-content: center;
        }

        .overlay {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 1;
          box-sizing: border-box;
          border: var(--ha-card-border-width, 1px) solid
            var(--ha-card-border-color, var(--divider-color));
          border-radius: 1.5rem;
        }

        .manual {
          max-width: none;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-card-picker": HuiCardPicker;
  }
}
