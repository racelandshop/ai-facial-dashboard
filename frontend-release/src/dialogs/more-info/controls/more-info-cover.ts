import { HassEntity } from "home-assistant-js-websocket/dist/types";
import { css, CSSResult, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
// import { attributeClassNames } from "../../../common/entity/attribute_class_names";
// import { featureClassNames } from "../../../common/entity/feature_class_names";
import "../../../components/ha-attributes";
import "../../../components/ha-cover-tilt-controls";
import "../../../components/ha-labeled-slider";
import { CoverEntity } from "../../../data/cover";
import { UNAVAILABLE, UNAVAILABLE_STATES } from "../../../data/entity";
import { HomeAssistant } from "../../../types";
import "../../../components/unavailable-icon";

// const arrowUp =
//   "M3.4375 16.1041L13 6.56246L22.5625 16.1041L25.5 13.1666L13 0.666626L0.5 13.1666L3.4375 16.1041Z";
// const pause =
//   "M17.1667 29.5833H25.5V0.416626H17.1667V29.5833ZM0.5 29.5833H8.83333V0.416626H0.5V29.5833Z";
const arrowDown =
  "M3.4375 0.391357L13 9.95386L22.5625 0.391357L25.5 3.34969L13 15.8497L0.5 3.34969L3.4375 0.391357Z";

@customElement("more-info-cover")
class MoreInfoCover extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public stateObj!: CoverEntity;

  @query(".sc-blind-selector-picker") private picker: any;

  @query(".sc-blind-selector-slide") private slide: any;

  @query(".sc-blind-selector-picture") private picture: any;

  @property({ attribute: false }) public isUpdating!: boolean;

  @property({ attribute: false }) public invertPercentage!: boolean;

  private maxPosition!: number;

  private minPosition!: number;

  protected firstUpdated() {
    this.slide.style.height = this.maxPosition - this.minPosition + "px";
    ["mousedown", "touchstart", "pointerdown"].forEach((type) => {
      this.picker?.addEventListener(type, this._mouseDown);
    });
    this.maxPosition = 156;
    this.minPosition = 0;
    this.isUpdating = false;
  }

  protected render(): TemplateResult {
    if (!this.stateObj) {
      return html``;
    }
    this.stateObj = this.hass.states[this.stateObj.entity_id] as CoverEntity;

    return html`
      <div
        class="sc-blind-position ${classMap({
          positionNull: this.stateObj.state === UNAVAILABLE,
        })}"
        @change=${this.setPickerPosition(
          100 - this.stateObj.attributes.current_position
        )}
      >
        ${this.stateObj.attributes.current_position} %
      </div>
      <div class="container">
        <div
          class="sc-blind-middle"
          .disabled=${UNAVAILABLE_STATES.includes(this.stateObj.state)}
        >
          <div class="sc-blind-selector">
            <div
              class="blindOpen ${classMap({
                "state-on":
                  this.stateObj.state === "open" ||
                  this.stateObj.state === "opening" ||
                  this.stateObj.state === "closing",
                "state-unavailable": this.stateObj.state === UNAVAILABLE,
              })}"
            >
              <svg
                class="sc-blind-selector-picture
                ${classMap({
                  "state-unavailable": this.stateObj.state === UNAVAILABLE,
                })}"
                viewBox="0 0 50 50"
                height="100%"
                width="100%"
              >
                <path
                  d="M45.4199 5H5.08989C4.69989 5 4.38989 5.31 4.38989 5.7V44.88C4.38989 45.27 4.69989 45.58 5.08989 45.58H45.4199C45.8099 45.58 46.1199 45.27 46.1199 44.88V5.7C46.1199 5.31 45.7999 5 45.4199 5ZM24.7199 42.36C24.7199 42.63 24.4999 42.85 24.2299 42.85H6.52989C6.25989 42.85 6.03989 42.63 6.03989 42.36V7.71C6.03989 7.44 6.25989 7.22 6.52989 7.22H24.2299C24.4999 7.22 24.7199 7.44 24.7199 7.71V42.36ZM44.7999 43.35C44.7999 43.62 44.5799 43.84 44.3099 43.84H26.5299C26.2599 43.84 26.0399 43.62 26.0399 43.35V7.67C26.0399 7.4 26.2599 7.18 26.5299 7.18H44.2999C44.5699 7.18 44.7899 7.4 44.7899 7.67V43.35H44.7999Z"
                />
              </svg>
              <svg
                class="top-bar"
                viewBox="0 0 50 50"
                height="100%"
                width="100%"
              >
                <path
                  d="M45.83 8.21H4.66997C4.27997 8.21 3.96997 7.9 3.96997 7.51V5.45C3.96997 5.06 4.27997 4.75 4.66997 4.75H45.82C46.21 4.75 46.52 5.06 46.52 5.45V7.51C46.53 7.89 46.21 8.21 45.83 8.21Z"
                />
              </svg>
            </div>
            <div
              class="sc-blind-selector-slide
            ${classMap({
                "state-unavailable": this.stateObj.state === UNAVAILABLE,
              })}"
            ></div>
            <svg
              class="sc-blind-selector-picker ${classMap({
                "state-unavailable": this.stateObj.state === UNAVAILABLE,
              })}"
              viewBox="0 0 50 50"
              height="100%"
              width="100%"
            >
              <path
                d="M5.54004 44.58C5.54004 44.75 5.67004 44.88 5.84004 44.88H44.66C44.79 44.88 44.87 44.79 44.92 44.68C44.93 44.65 44.96 44.62 44.96 44.58V43.98H5.54004V44.58Z"
                fill="#B3B3B3"
              />
            </svg>
          </div>
          ${UNAVAILABLE_STATES.includes(this.stateObj.state)
            ? html` <unavailable-icon
                class="icon-unavailable"
              ></unavailable-icon>`
            : html``}
          <div id="buttons">
            <div class="buttons">
              <button
                class="openButton ${classMap({
                  "state-on": this.stateObj.state === "opening",
                  "state-unavailable": this.stateObj.state === UNAVAILABLE,
                })}"
                .label=${this.hass.localize(
                  "ui.dialogs.more_info_control.opencover"
                )}
                @click=${this.onOpenTap}
              >
                <ha-svg-icon
                  id="arrow-icon"
                  .path=${"M3.4375 16.1041L13 6.56246L22.5625 16.1041L25.5 13.1666L13 0.666626L0.5 13.1666L3.4375 16.1041Z"}
                >
                </ha-svg-icon>
              </button>
            </div>
            <div class="buttons">
              <button
                class="pause
                ${classMap({
                  "state-unavailable": this.stateObj.state === UNAVAILABLE,
                })}"
                .label=${this.hass.localize(
                  "ui.dialogs.more_info_control.stopcover"
                )}
                @click=${this.onStopTap}
              >
                <ha-svg-icon
                  id="arrow-icon-middle"
                  .path=${"M17.1667 29.5833H25.5V0.416626H17.1667V29.5833ZM0.5 29.5833H8.83333V0.416626H0.5V29.5833Z"}
                >
                </ha-svg-icon>
              </button>
            </div>
            <div class="buttons">
              <button
                class="closeButton ${classMap({
                  "state-on": this.stateObj.state === "closing",
                  "state-unavailable": this.stateObj.state === UNAVAILABLE,
                })}"
                .label=${this.hass.localize(
                  "ui.dialogs.more_info_control.closecover"
                )}
                .path=${arrowDown}
                @click=${this.onCloseTap}
              >
                <ha-svg-icon
                  id="arrow-icon"
                  .path=${"M3.4375 0.391357L13 9.95386L22.5625 0.391357L25.5 3.34969L13 15.8497L0.5 3.34969L3.4375 0.391357Z"}
                >
                </ha-svg-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getPictureTop(picture: Element) {
    if (!picture) {
      return null;
    }

    const pictureBox = picture.getBoundingClientRect();
    const body = document.body;
    const docEl = document.documentElement;

    const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    const clientTop = docEl.clientTop || body.clientTop || 0;
    const pictureTop = pictureBox.top + scrollTop - clientTop;
    return pictureTop;
  }

  private setPickerPosition(position: number) {
    let realPos = (this.maxPosition / 100) * position;
    if (realPos < this.minPosition) realPos = this.minPosition;

    if (realPos > this.maxPosition) realPos = this.maxPosition;

    const posTop = realPos - (this.maxPosition - this.minPosition);
    const slideHeight = realPos - this.minPosition;
    if (!this.hasUpdated) {
      this.updateComplete.then(() => {
        if (this.picker && this.slide) {
          this.slide.style.height = slideHeight + "px";
          this.picker.style.top = posTop + "px";
        }
      });
    } else if (this.picker && this.slide) {
      this.slide.style.height = slideHeight + "px";
      this.picker.style.top = posTop + "px";
    }
  }

  private _mouseDown = (event) => {
    if (event.cancelable) {
      // Disable default drag event

      event.preventDefault();
    }

    this.isUpdating = true;

    this.shadowRoot?.addEventListener("mousemove", this._mouseMove);
    this.shadowRoot?.addEventListener("touchmove", this._mouseMove);
    this.shadowRoot?.addEventListener("pointermove", this._mouseMove);

    this.shadowRoot?.addEventListener("mouseup", this._mouseUp);
    this.shadowRoot?.addEventListener("touchend", this._mouseUp);
    this.shadowRoot?.addEventListener("pointerup", this._mouseUp);
  };

  private _mouseMove = (event) => {
    const newPosition =
      ((event.pageY - this!.getPictureTop(this!.slide)!) * 100) /
      this.maxPosition;
    this?.setPickerPosition(newPosition);
  };

  private _mouseUp = (event) => {
    this.isUpdating = false;
    this.updateComplete.then(() => {
      let newPosition: any = event.pageY - this!.getPictureTop(this!.slide)!;

      if (newPosition < this!.minPosition) newPosition = this?.minPosition;

      if (newPosition > this!.maxPosition) newPosition = this?.maxPosition;

      const percentagePosition =
        ((newPosition - this!.minPosition) * 100) /
        (this!.maxPosition - this!.minPosition);
      this?.setPickerPosition((newPosition * 100) / this.maxPosition);

      if (this.invertPercentage) {
        this.updateBlindPosition(
          this!.hass,
          this.stateObj.entity_id,
          percentagePosition
        );
      } else {
        this.updateBlindPosition(
          this!.hass,
          this.stateObj.entity_id,
          100 - percentagePosition
        );
      }

      this.shadowRoot?.removeEventListener("mousemove", this._mouseMove);
      this.shadowRoot?.removeEventListener("touchmove", this._mouseMove);
      this.shadowRoot?.removeEventListener("pointermove", this._mouseMove);

      this.shadowRoot?.removeEventListener("mouseup", this._mouseUp);
      this.shadowRoot?.removeEventListener("touchend", this._mouseUp);
      this.shadowRoot?.removeEventListener("pointerup", this._mouseUp);
    });
  };

  private updateBlindPosition(
    hass: HomeAssistant,
    entity: string,
    position: number
  ) {
    const blindPosition = Math.round(position);

    hass.callService("cover", "set_cover_position", {
      entity_id: entity,
      position: blindPosition,
    });
  }

  private onOpenTap(): void {
    this.hass.callService("cover", "open_cover", {
      entity_id: this.stateObj.entity_id,
    });
  }

  private onStopTap(): void {
    this.hass.callService("cover", "stop_cover", {
      entity_id: this.stateObj.entity_id,
    });
  }

  private onCloseTap(): void {
    this.hass.callService("cover", "close_cover", {
      entity_id: this.stateObj.entity_id,
    });
  }

  private computeActiveState = (stateObj: HassEntity): string =>
    stateObj?.state;

  static get styles(): CSSResult {
    return css`
      .current_position,
      .tilt {
        max-height: 0px;
        overflow: hidden;
      }

      .has-set_position .current_position,
      .has-current_position .current_position,
      .has-open_tilt .tilt,
      .has-close_tilt .tilt,
      .has-stop_tilt .tilt,
      .has-set_tilt_position .tilt,
      .has-current_tilt_position .tilt {
        max-height: 208px;
      }

      .title {
        margin: 5px 0 8px;
        color: var(--primary-text-color);
      }
      svg {
        display: block;
        .state-on {
          transform: scale(0);
        }
      }

      .more-info {
        position: absolute;
        cursor: pointer;
        top: 0;
        right: 0;
        color: var(--secondary-text-color);
        z-index: 1;
      }

      .buttons:hover {
        cursor: pointer;
      }

      .hassbut.state-off {
        text-align: left;
      }

      .hassbut.state-on {
        text-align: left;
      }

      .hassbut {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .blind-closed {
        position: absolute;
        top: 0;
      }
      .ha-status-icon {
        display: flex;
        justify-content: center;
      }
      .sc-blind-selector {
        position: absolute;
        top: 5px;
        left: -33px;
        width: 210px;
        height: 210px;
      }
      .sc-blind-position {
        display: flex;
        color: var(--secondary-text-color);
        font-size: 18px;
        width: 100%;
        position: relative;
        top: 24px;
        justify-content: center;
      }
      .sc-blind-label {
        color: var(--primary-text-color);
        padding-top: 5px;
        height: 100%;
        padding-bottom: 23px;
        font-size: 2.3rem;
        font-weight: 450;
        white-space: nowrap;
        display: inline-block;
        overflow-x: hidden;
        max-width: 80%;
        text-overflow: ellipsis;
        justify-content: space-between;
      }
      .sc-blind-selector-picture {
        position: relative;
        fill: #666666;
      }
      .top-bar {
        position: absolute;
        fill: #666666;
        width: 100%;
        top: 0px;
        right: 0px;
      }
      .sc-blind-selector-slide {
        background-color: var(--slider-track-color);
        position: absolute;
        cursor: row-resize;
        height: 100%;
        max-width: 230px;
        min-width: 174px;
        max-height: 156px;
        top: 33px;
        left: 19px;
      }
      .sc-blind-selector-picker {
        cursor: row-resize;
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
      }
      .sc-blind-middle {
        display: flex;
        align-items: center;
        position: relative;
        justify-content: center;
        width: 200px;
        height: 200px;
      }
      .window {
        overflow-y: hidden;
        width: 230px;
        height: 172px;
        position: absolute;
        left: 98px;
      }
      .container {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 8px;
        margin-bottom: 25px;
      }
      #buttons {
        top: 22px;
        position: absolute;
        left: 170px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .buttons {
        width: 43px;
        margin: 8px 0;
      }
      .state-div {
        align-items: left;
        padding-top: 19px;
        padding-bottom: 6px;
      }

      .name-div {
        align-items: left;
        padding: 12% 100% 1% 0%;
      }

      #arrow-icon {
        margin-top: 5px;
        height: 20px;
        width: 15px;
        fill: var(--card-background-color);
      }

      #arrow-icon-middle {
        height: 20px;
        width: 15px;
        fill: var(--card-background-color);
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

      @media only screen and (max-width: 600px) {
        #arrow-icon {
          margin-top: 4px;
          height: 20px;
          width: 15px;
          fill: var(--card-background-color);
        }
        #arrow-icon-middle {
          padding: 0;
          margin: 0;
          height: 20px;
          width: 15px;
          fill: var(--card-background-color);
        }
        .sc-blind-position {
          display: flex;
          color: var(--secondary-text-color);
          font-size: 18px;
          width: 100%;
          position: relative;
          top: 24px;
          justify-content: center;
        }
      }

      .positionNull {
        display: none;
      }
      button {
        background-color: var(--secondary-text-color);
        cursor: pointer;
        fill: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        visibility: visible;
        width: 43px;
        height: 43px;
        border-radius: 8px;
        border-width: 0;
      }
      .openButton.state-on {
        background-color: var(--header-card-picker-background) !important;
      }
      .openButton.state-on > #arrow-icon {
        fill: var(--accent-color);
      }
      .blindOpen.state-on > svg {
        fill: var(--accent-color);
      }
      .closeButton.state-on {
        background-color: var(--header-card-picker-background) !important;
      }
      .closeButton.state-on > #arrow-icon {
        fill: var(--accent-color);
      }
      .state-unavailable {
        color: var(--state-icon-unavailable-color, #bdbdbd);
        pointer-events: none;
      }
      .icon-unavailable {
        z-index: 1;
        position: absolute;
        top: 50%;
        left: 32%;
      }
      .pause:active,
      .blindOpen:active,
      .closeButton:active {
        background-color: var(--header-card-picker-background) !important;
      }
      .pause:active > #arrow-icon {
        fill: var(--accent-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-cover": MoreInfoCover;
  }
}
