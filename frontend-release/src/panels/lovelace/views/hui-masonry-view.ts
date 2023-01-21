import { mdiPlus } from "@mdi/js";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { property, state, queryAsync, eventOptions } from "lit/decorators";
import type { Ripple } from "@material/mwc-ripple";
import { RippleHandlers } from "@material/mwc-ripple/ripple-handlers";
import { classMap } from "lit/directives/class-map";
import { fireEvent } from "../../../common/dom/fire_event";
import { computeRTL } from "../../../common/util/compute_rtl";
import { nextRender } from "../../../common/util/render-status";
import "../../../components/entity/ha-state-label-badge";
import "../../../components/ha-svg-icon";
import type {
  LovelaceViewConfig,
  LovelaceViewElement,
} from "../../../data/lovelace";
import type { HomeAssistant } from "../../../types";
import type { HuiErrorCard } from "../cards/hui-error-card";
import { computeCardSize } from "../common/compute-card-size";
import type { Lovelace, LovelaceBadge, LovelaceCard } from "../types";

// Find column with < 5 size, else smallest column
const getColumnIndex = (columnSizes: number[], index: number) =>
  index % columnSizes.length;

export class MasonryView extends LitElement implements LovelaceViewElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lovelace?: Lovelace;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Number }) public index?: number;

  @property({ type: Boolean }) public isStrategy = false;

  @property({ type: Boolean }) public cardButton = true;

  @property({ attribute: false }) public cards: Array<
    LovelaceCard | HuiErrorCard
  > = [];

  @property({ attribute: false }) public badges: LovelaceBadge[] = [];

  @state() private _columns?: number;

  @queryAsync("mwc-ripple") private _ripple!: Promise<Ripple | null>;

  @state() private _shouldRenderRipple = false;

  @state() private _isMobile = false;

  private _createColumnsIteration = 0;

  private _mqls?: MediaQueryList[];

  private _mqlListenerRef?: () => void;

  public constructor() {
    super();
    this.addEventListener("iron-resize", (ev: Event) => ev.stopPropagation());
  }

  public connectedCallback() {
    super.connectedCallback();
    this._initMqls();
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this._mqls?.forEach((mql) => {
      mql.removeListener(this._mqlListenerRef!);
    });
    this._mqlListenerRef = undefined;
    this._mqls = undefined;
  }

  public setConfig(_config: LovelaceViewConfig): void {}

  protected render(): TemplateResult {
    return html`
      ${this.badges.length > 0
        ? html` <div class="badges">${this.badges}</div>`
        : ""}
      <div id="columns"></div>
      ${this.lovelace?.editMode && !this.cardButton && this._isMobile
        ? html`
            <ha-fab @click=${this._addCard} class="addSimple">
              <ha-svg-icon
                slot="icon"
                .path=${mdiPlus}
                id="iconplus"
              ></ha-svg-icon>
            </ha-fab>
          `
        : ""}
      ${this.lovelace?.editMode && !this.cardButton && !this._isMobile
        ? html`
            <ha-fab
              .label=${this.hass!.localize(
                "ui.panel.lovelace.editor.edit_card.add"
              )}
              extended
              @click=${this._addCard}
              class=${"addSimple " +
              classMap({
                rtl: computeRTL(this.hass!),
              })}
            >
              <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
            </ha-fab>
          `
        : ""}
      ${this.cardButton
        ? html`
            <div id="columns">
              <div class="column">
                <ha-card
                  @click=${this._addCard}
                  class="addCard"
                  @focus=${this.handleRippleFocus}
                  @blur=${this.handleRippleBlur}
                  @mousedown=${this.handleRippleActivate}
                  @mouseup=${this.handleRippleDeactivate}
                  @touchstart=${this.handleRippleActivate}
                  @touchend=${this.handleRippleDeactivate}
                  @touchcancel=${this.handleRippleDeactivate}
                >
                  <ha-svg-icon .path=${mdiPlus} id="icon"></ha-svg-icon>
                  <div id="text">
                    ${this.hass!.localize(
                      "ui.panel.lovelace.editor.edit_card.add"
                    )}
                  </div>
                  ${this._shouldRenderRipple
                    ? html`<mwc-ripple></mwc-ripple>`
                    : ""}
                </ha-card>
              </div>
            </div>
          `
        : ""}
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

  private _initMqls() {
    this._mqls = [300, 600, 900, 1200].map((width) => {
      const mql = window.matchMedia(`(min-width: ${width}px)`);
      if (!this._mqlListenerRef) {
        this._mqlListenerRef = this._updateColumns.bind(this);
      }
      mql.addListener(this._mqlListenerRef);
      return mql;
    });
  }

  private get mqls(): MediaQueryList[] {
    if (!this._mqls) {
      this._initMqls();
    }
    return this._mqls!;
  }

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);

    this._isMobile = window.matchMedia(
      "only screen and (max-width: 760px)"
    ).matches;

    if (this.lovelace?.editMode) {
      import("./default-view-editable");
    }

    if (changedProperties.has("hass")) {
      const oldHass = changedProperties.get("hass") as
        | HomeAssistant
        | undefined;

      if (this.hass!.dockedSidebar !== oldHass?.dockedSidebar) {
        this._updateColumns();
        return;
      }
    }

    if (changedProperties.has("narrow")) {
      this._updateColumns();
      return;
    }

    const oldLovelace = changedProperties.get("lovelace") as
      | Lovelace
      | undefined;

    if (
      changedProperties.has("cards") ||
      (changedProperties.has("lovelace") &&
        oldLovelace &&
        (oldLovelace.config !== this.lovelace!.config ||
          oldLovelace.editMode !== this.lovelace!.editMode))
    ) {
      this._createColumns();
    }
  }

  private _addCard(): void {
    fireEvent(this, "ll-create-card");
    if (this.lovelace) this.lovelace.editMode = true;
  }

  private _createRootElement(columns: HTMLDivElement[]) {
    const root = this.shadowRoot!.getElementById("columns") as HTMLDivElement;

    // Remove old columns
    while (root.lastChild) {
      root.removeChild(root.lastChild);
    }

    columns.forEach((column) => root.appendChild(column));
  }

  private async _createColumns() {
    if (!this._columns) {
      return;
    }

    this._createColumnsIteration++;
    const iteration = this._createColumnsIteration;

    // Track the total height of cards in a columns
    const columnSizes: number[] = [];
    const columnElements: HTMLDivElement[] = [];
    // Add columns to DOM, limit number of columns to the number of cards
    for (let i = 0; i < Math.min(this._columns, this.cards.length); i++) {
      const columnEl = document.createElement("div");
      columnEl.classList.add("column");
      columnSizes.push(0);
      columnElements.push(columnEl);
      columnEl.classList.add("column");
    }

    if (this.cards?.length > 0) {
      this.cardButton = false;
    }

    if (!this.hasUpdated) {
      this.updateComplete.then(() => {
        this._createRootElement(columnElements);
      });
    } else {
      this._createRootElement(columnElements);
    }

    let tillNextRender: Promise<unknown> | undefined;
    let start: Date | undefined;

    // Calculate the size of every card and determine in what column it should go
    for (const [index, el] of this.cards.entries()) {
      if (tillNextRender === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        tillNextRender = nextRender().then(() => {
          tillNextRender = undefined;
          start = undefined;
        });
      }

      let waitProm: Promise<unknown> | undefined;

      // We should work for max 16ms (60fps) before allowing a frame to render
      if (start === undefined) {
        // Save the time we start for this frame, no need to wait yet
        start = new Date();
      } else if (new Date().getTime() - start.getTime() > 16) {
        // We are working too long, we will prevent a render, wait to allow for a render
        waitProm = tillNextRender;
      }

      const cardSizeProm = computeCardSize(el);
      // @ts-ignore
      // eslint-disable-next-line no-await-in-loop
      const [cardSize] = await Promise.all([cardSizeProm, waitProm]);

      if (iteration !== this._createColumnsIteration) {
        // An other create columns is started, abort this one
        return;
      }
      // Calculate in wich column the card should go based on the size and the cards already in there
      this._addCardToColumn(
        columnElements[getColumnIndex(columnSizes, index)],
        index,
        this.lovelace!.editMode
      );
    }

    // Remove empty columns
    columnElements.forEach((column) => {
      if (!column.lastChild) {
        column.parentElement!.removeChild(column);
      }
    });
  }

  private _addCardToColumn(columnEl, index, editMode) {
    const card: LovelaceCard = this.cards[index];
    if (!editMode || this.isStrategy) {
      card.editMode = false;
      columnEl.appendChild(card);
    } else {
      const wrapper = document.createElement("hui-card-options");
      wrapper.hass = this.hass;
      wrapper.lovelace = this.lovelace;
      wrapper.path = [this.index!, index];
      card.editMode = true;
      wrapper.appendChild(card);
      columnEl.appendChild(wrapper);
    }
  }

  private _updateColumns() {
    const matchColumns = this.mqls.reduce(
      (cols, mql) => cols + Number(mql.matches),
      0
    );
    // Do -1 column if the menu is docked and open
    const newColumns = Math.max(
      1,
      matchColumns -
        Number(!this.narrow && this.hass!.dockedSidebar === "docked")
    );
    if (newColumns === this._columns) {
      return;
    }
    this._columns = newColumns;
    this._createColumns();
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        padding-top: 4px;
        height: 100%;
        box-sizing: border-box;
        margin: 3%;
        margin-top: 1%;
      }

      .badges {
        margin: 8px 16px;
        font-size: 85%;
        text-align: center;
      }

      #columns {
        display: flex;
        flex-direction: row;
        justify-content: center;
        margin-left: 4px;
        margin-right: 4px;
      }

      .column {
        flex: 1 0 0;
        max-width: 400px;
        min-width: 0;
      }

      .column > * {
        display: block;
        margin: var(--masonry-view-card-margin, 4px 4px 8px);
      }

      .addCard {
        background-color: var(--card-background-color, white);
        box-shadow: var(
          --mdc-fab-box-shadow,
          0px 3px 5px -1px rgba(0, 0, 0, 0.2),
          0px 6px 10px 0px rgba(0, 0, 0, 0.14),
          0px 1px 18px 0px rgba(0, 0, 0, 0.12)
        );
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 4% 0;
        font-size: 2.3rem;
        height: 100%;
        box-sizing: border-box;
        justify-content: center;
        position: relative;
        overflow: hidden;
        border-radius: 1.5rem;
        font-weight: 450;
      }
      #text {
        text-align: center;
        margin-top: 10%;
        width: 60%;
        font-size: 2rem;
        font-weight: 450;
      }
      .addCard:hover > #icon {
        background-color: var(--sidebar-selected-icon-color);
      }
      .addCard:hover > #text {
        color: var(--sidebar-selected-icon-color);
      }
      #icon {
        background-color: rgb(144, 144, 145);
        color: white;
        border-radius: 100%;
        width: 30%;
        height: auto;
      }
      .addSimple {
        position: sticky;
        float: right;
        right: calc(16px + env(safe-area-inset-right));
        bottom: calc(16px + env(safe-area-inset-bottom));
        z-index: 1;
      }

      @media (max-width: 500px) {
        .column > * {
          margin-left: 0;
          margin-right: 0;
        }
      }

      @media (max-width: 599px) {
        .column {
          max-width: 600px;
        }
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-masonry-view": MasonryView;
  }
}

customElements.define("hui-masonry-view", MasonryView);
