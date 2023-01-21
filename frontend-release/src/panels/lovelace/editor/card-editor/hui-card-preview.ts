import { mdiPlus } from "@mdi/js";
import { PropertyValues, ReactiveElement, css, CSSResultGroup } from "lit";
import { property } from "lit/decorators";
import { fireEvent } from "../../../../common/dom/fire_event";
import { computeRTL } from "../../../../common/util/compute_rtl";
import { HaCard } from "../../../../components/ha-card";
import { LovelaceCardConfig } from "../../../../data/lovelace";
import { HomeAssistant } from "../../../../types";
import { createCardElement } from "../../create-element/create-card-element";
import { createErrorCardConfig } from "../../create-element/create-element-base";
import { LovelaceCard } from "../../types";

export class HuiCardPreview extends ReactiveElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ type: Object }) public config?: LovelaceCardConfig;

  @property({ type: Number }) public selectedCard? = 0;

  @property({ type: Boolean }) public removeShadows? = false;

  private _element?: LovelaceCard;

  private _plusCard?: HaCard = document.createElement("ha-card");

  private _plusSign: any = document.createElement("ha-svg-icon");

  private get _error() {
    return this._element?.tagName === "HUI-ERROR-CARD";
  }

  constructor() {
    super();

    this.addEventListener("ll-rebuild", () => {
      this._cleanup();
      if (this.config) {
        this._createCard(this.config);
      }
    });
  }

  protected createRenderRoot() {
    return this;
  }

  protected firstUpdated(
    _changedProperties: Map<string | number | symbol, unknown>
  ): void {
    this.selectedCard = 0;
    this._plusSign.path = mdiPlus;
    this._plusSign.style.color = "white";
    this._plusSign.style.position = "absolute";
    this._plusSign.style.transform = "translate(-50%,-50%)";
    this._plusSign.style.top = "50%";
    this._plusSign.style.left = "50%";
    this._plusSign.style.width = "5vh";
    this._plusSign.style.height = "auto";
    this._plusSign.style.borderRadius = "100%";
    this._plusCard!.style.borderRadius = "1.5rem";
    this._plusCard!.style.backgroundColor =
      "var(--mdc-dialog-scroll-divider-color)";
    this._plusCard!.style.border = "1px solid rgba(100%, 100%,100%, 30%)";
    this._plusCard!.style.minHeight = "10vh";
    this.updateComplete.then(() => {
      this._plusCard?.appendChild(this._plusSign);
    });
    this.requestUpdate();
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.updateComplete.then(() => {
      const childsels: any =
        this._element!.shadowRoot?.getElementById("root")?.children;
      const rootElement: any =
        this._element!.shadowRoot?.getElementById("root");
      if (childsels && childsels.length > 0) {
        const nchilds = childsels.length;
        for (let i = 0; i < nchilds; i++) {
          childsels[i].updateComplete.then(() => {
            // remove pointer events from cards
            const childCard =
              childsels[i]!.shadowRoot!.querySelector("ha-card");
            if (childCard) {
              childCard.style.setProperty(
                "--mdc-switch__pointer_events",
                "none"
              );
              childCard.style.pointerEvents = "none";
            }

            if ((!this.removeShadows && i === nchilds - 1) || !childsels) {
              if (!this._plusCard!.getAttribute("naovirgem") === true) {
                this._plusCard!.addEventListener("click", () => {
                  fireEvent(this, "handle-selected-card", {
                    cardId: childsels.length - 1,
                  });
                });
                this._plusCard!.setAttribute("naovirgem", "true");
              }
              rootElement.appendChild(this._plusCard!);
            }
            // give events to children of root
            if (!childsels[i].getAttribute("naovirgem") === true) {
              childsels[i].addEventListener("click", () => {
                fireEvent(this, "handle-selected-card", {
                  cardId: i,
                });
              });
              childsels[i].setAttribute("naovirgem", true);
            }

            if (i === this.selectedCard && !this.removeShadows) {
              childsels[i].style.boxShadow =
                "0 0 10px var(--mdc-theme-secondary, #018786), 0 0 10px var(--mdc-theme-secondary, #018786)";
              childsels[i].style.borderRadius = "1.5rem";
            } else {
              childsels[i].style.boxShadow = "";
            }
          });
        }
      } else {
        rootElement.appendChild(this._plusCard!);
      }
    });
  }

  protected update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    // if (changedProperties.has("selectedCard")) {
    //   // setTimeout(() => {
    //   this.requestUpdate();
    //   // }, 32);
    // }

    if (changedProperties.has("config")) {
      //                                      for some reason this timeout is important on safari. Solved issue on Safari not displaying border on add card.
      setTimeout(() => {
        this.requestUpdate();
      }, 32);
      const oldConfig = changedProperties.get("config") as
        | undefined
        | LovelaceCardConfig;

      if (!this.config) {
        this._cleanup();
        return;
      }

      if (!this.config.type) {
        this._createCard(
          createErrorCardConfig("No card type found", this.config)
        );
        return;
      }

      if (!this._element) {
        this._createCard(this.config);
        return;
      }

      if (!this._error && oldConfig && this.config!.type === oldConfig.type) {
        try {
          this._element!.setConfig(this.config!);
        } catch (err: any) {
          this._createCard(createErrorCardConfig(err.message, this.config));
        }
      } else {
        this._createCard(this.config!);
      }
    }

    if (changedProperties.has("hass")) {
      const oldHass = changedProperties.get("hass") as
        | HomeAssistant
        | undefined;
      if (!oldHass || oldHass.language !== this.hass!.language) {
        this.style.direction = computeRTL(this.hass!) ? "rtl" : "ltr";
      }

      if (this._element) {
        this._element.hass = this.hass;
      }
    }
  }

  private _createCard(configValue: LovelaceCardConfig): void {
    this._cleanup();
    this._element = createCardElement(configValue);

    if (this.hass) {
      this._element!.hass = this.hass;
    }
    this.appendChild(this._element!);
  }

  private _cleanup() {
    if (!this._element) {
      return;
    }
    this.removeChild(this._element);
    this._element = undefined;
  }

  static get styles(): CSSResultGroup {
    return css``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-card-preview": HuiCardPreview;
  }
}

customElements.define("hui-card-preview", HuiCardPreview);
