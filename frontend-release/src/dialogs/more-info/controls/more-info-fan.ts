import "@material/mwc-list/mwc-list-item";
// import "@polymer/iron-flex-layout/iron-flex-layout-classes";
// import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
// import { PolymerElement } from "@polymer/polymer/polymer-element";
import {
  css,
  CSSResultGroup,
  LitElement,
  TemplateResult,
  html,
  PropertyValues,
} from "lit";
import { customElement, property } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import "../../../components/ha-icon";
import "../../../components/ha-icon-button";
import "../../../components/ha-labeled-slider";
import "../../../components/ha-select";
import "../../../components/ha-switch";
import { FanEntity } from "../../../data/fan";
import { HomeAssistant } from "../../../types";

/*
 * @appliesMixin EventsMixin
 */

function trigger(
  element: { dispatchEvent: (arg0: Event) => void },
  type: string
) {
  if (!element || !type) {
    return;
  }

  // Create and dispatch the event
  const event = new Event(type, { bubbles: true });

  // Dispatch the event
  element.dispatchEvent(event);
}

function getDecimalPlaces(value: any) {
  const match = `${value}`.match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);

  if (!match) {
    return 0;
  }

  return Math.max(
    0,
    // Number of digits right of decimal point.
    (match[1] ? match[1].length : 0) -
      // Adjust for scientific notation.
      (match[2] ? +match[2] : 0)
  );
}

function round(number: number, step: number) {
  if (step < 1) {
    const places = getDecimalPlaces(step);
    return parseFloat(number.toFixed(places));
  }
  return Math.round(number / step) * step;
}

@customElement("more-info-fan")
class MoreInfoFan extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public stateObj?: FanEntity;

  @property({ type: Boolean }) public oscillationToggleChecked? = false;

  @property({ type: String }) public percentageSliderValue? = "0";

  @property({ attribute: false }) public actionRows: any = [];

  @property({ attribute: false }) public settingsOn = true;

  private get(event: { target: any; changedTouches: any[] }) {
    const confvertical = true;
    const confthumbWidth = 0;
    const input = event.target;
    const touch = event.changedTouches[0];
    const min = parseFloat(input.getAttribute("min")) || 0;
    const max = parseFloat(input.getAttribute("max")) || 100;
    const step = parseFloat(input.getAttribute("step")) || 1;
    const delta = max - min;

    // Calculate percentage
    let percent: number;
    const clientRect = input.getBoundingClientRect();
    const thumbWidth = ((100 / clientRect.width) * (confthumbWidth / 2)) / 100;

    // Determine left percentage
    if (confvertical) {
      percent =
        100 - (100 / clientRect.height) * (touch.clientY - clientRect.top);
    } else {
      percent = (100 / clientRect.width) * (touch.clientX - clientRect.left);
    }

    // Don't allow outside bounds
    if (percent < 0) {
      percent = 0;
    } else if (percent > 100) {
      percent = 100;
    }

    // Factor in the thumb offset
    if (percent < 50) {
      percent -= (100 - percent * 2) * thumbWidth;
    } else if (percent > 50) {
      percent += (percent - 50) * 2 * thumbWidth;
    }

    // Find the closest step to the mouse position
    return min + round(delta * (percent / 100), step);
  }

  private set(event: any) {
    // Prevent text highlight on iOS
    event.preventDefault();

    // Set value
    // eslint-disable-next-line no-param-reassign
    event.target.value = this.get(event);

    // Trigger event
    trigger(event.target, event.type === "touchend" ? "change" : "input");
  }

  protected firstUpdated(): void {
    if ("ontouchstart" in document.documentElement) {
      // console.log("firstUpdated", this.shadowRoot!.getElementById("iosSlider"));
      const slider = this.shadowRoot!.getElementById("iosSlider");
      slider!.style.userSelect = "none";
      slider!.style.touchAction = "manipulation";

      // Listen for events
      ["touchstart", "touchmove", "touchend"].forEach((type) => {
        slider!.addEventListener(type, (event: any) => this.set(event), false);
      });
    }
  }

  protected render(): TemplateResult {
    return html`
      <div class="sliderContent">
        <div class="range-holder">
          <input
            type="range"
            id="iosSlider"
            class="iosSlider ${classMap({
              // sliderOff: this.stateObj?.state === "off",
            })}"
            list="steplist"
            step="33"
            value="0"
            min="0"
            max="99"
            style=" --slider-width: 150px;
              --slider-height: 378px; --slider-border-radius: 40px;
               --slider-thumb-color:#ddd;
              "
            .value=${this.stateObj?.state === "off"
              ? String(0)
              : String(this.percentageSliderValue)}
            @change=${this.percentageChanged}
          />
          <div class="datals">
            <span class="opt"></span>
            <span class="opt"></span>
            <span class="opt"></span>
          </div>
          <svg
            version="1.1"
            id="Camada_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 150 95"
            style="enable-background:new 0 0 150 95;"
            xml:space="preserve"
          >
            <path
              class="st0"
              d="M0,55c0,22.1,17.9,40,40,40h70c22.1,0,40-17.9,40-40V0H0V55z"
            />
          </svg>
        </div>
      </div>
    `;
  }

  presetModeChanged(ev) {
    const oldVal = this.stateObj?.attributes.preset_mode;
    const newVal = ev.target.value;

    if (!newVal || oldVal === newVal) return;

    this.hass.callService("fan", "set_preset_mode", {
      entity_id: this.stateObj?.entity_id,
      preset_mode: newVal,
    });
  }

  public willUpdate(changedProps: PropertyValues<this>) {
    if (!changedProps.has("stateObj")) {
      return;
    }
    const oldVal = changedProps.get("stateObj") as FanEntity | undefined;
    const newVal = this.stateObj! as FanEntity;
    if (newVal) {
      this.oscillationToggleChecked = newVal.attributes.oscillating;
      this.percentageSliderValue = newVal.attributes.percentage;
    }

    if (newVal.state === "on") {
      // Don't change tab when the color mode changes
      if (
        oldVal?.entity_id !== newVal.entity_id ||
        oldVal?.attributes.percentage !== newVal.attributes.percentage
      ) {
        this.oscillationToggleChecked = newVal.attributes.oscillating;
        this.percentageSliderValue = newVal.attributes.percentage;
      } else {
        this.percentageSliderValue = "0";
      }
    }
  }

  stopPropagation(ev) {
    ev.stopPropagation();
  }

  percentageChanged(ev) {
    const oldVal = parseInt(this.stateObj!.attributes.percentage, 10);
    const newVal = ev.target.value;

    if (isNaN(newVal) || oldVal === newVal) return;

    this.percentageSliderValue = newVal;

    this.hass.callService("fan", "set_percentage", {
      entity_id: this.stateObj?.entity_id,
      percentage: newVal,
    });
  }

  oscillationToggleChanged(ev) {
    const oldVal = this.stateObj?.attributes.oscillating;
    const newVal = ev.target.checked;

    if (oldVal === newVal) return;

    this.hass.callService("fan", "oscillate", {
      entity_id: this.stateObj?.entity_id,
      oscillating: newVal,
    });
  }

  onDirectionReverse() {
    this.hass.callService("fan", "set_direction", {
      entity_id: this.stateObj?.entity_id,
      direction: "reverse",
    });
  }

  onDirectionForward() {
    this.hass.callService("fan", "set_direction", {
      entity_id: this.stateObj?.entity_id,
      direction: "forward",
    });
  }

  computeIsRotatingReverse(stateObj) {
    return stateObj.attributes.direction === "reverse";
  }

  computeIsRotatingForward(stateObj) {
    return stateObj.attributes.direction === "forward";
  }

  static get styles(): CSSResultGroup {
    return css`
      #Camada_1 {
        position: absolute;
        bottom: 0;
        width: calc(100% + 1px);
        height: auto;
        /* right: calc(50% - (380px / 2)); */
        fill: grey;
        user-select: none;
        pointer-events: none;
      }

      .range-holder {
        --slider-height: 379px;
        --slider-width: 150px;
        height: var(--slider-height);
        width: var(--slider-width);
        position: relative;
        display: block;
        overflow: hidden;
      }
      .range-holder input[type="range"] {
        outline: 0;
        border: 0;
        border-radius: var(--slider-border-radius, 12px);
        width: var(--slider-height);
        margin: 0;
        transition: box-shadow 0.2s ease-in-out;
        -webkit-transform: rotate(270deg);
        -moz-transform: rotate(270deg);
        -o-transform: rotate(270deg);
        -ms-transform: rotate(270deg);
        transform: rotate(270deg);
        overflow: hidden;
        height: var(--slider-width);
        -webkit-appearance: none;
        background-color: var(--slider-track-color);
        position: absolute;
        top: calc(50% - (var(--slider-width) / 2));
        right: calc(50% - (var(--slider-height) / 2));
      }
      .range-holder input[type="range"]::-webkit-slider-runnable-track {
        height: var(--slider-width);
        -webkit-appearance: none;
        background-color: var(--slider-track-color);
        margin-top: -1px;
        transition: box-shadow 0.2s ease-in-out;
      }
      .range-holder input[type="range"]::-webkit-slider-thumb {
        width: calc(var(--slider-height) / 4);
        border-right: 10px solid var(--slider-color);
        border-left: 10px solid var(--slider-color);
        border-top: 20px solid var(--slider-color);
        border-bottom: 20px solid var(--slider-color);
        -webkit-appearance: none;
        height: 0px;
        cursor: grabbing;
        background: var(--slider-color);
        box-shadow: -350px 0 0 350px var(--slider-color),
          inset 0 0 0 80px var(--slider-thumb-color);
        border-radius: 0;
        transition: box-shadow 0.2s ease-in-out;
        position: relative;
        top: calc((var(--slider-width) - 80px) / 2);
      }
      .range-holder input[type="range"]::-moz-thumb-track {
        height: var(--slider-width);
        background-color: var(--slider-track-color);
        margin-top: -1px;
        transition: box-shadow 0.2s ease-in-out;
      }
      .range-holder input[type="range"]::-moz-range-thumb {
        width: 0px;
        border-right: 12px solid var(--slider-color);
        border-left: 12px solid var(--slider-color);
        border-top: 20px solid var(--slider-color);
        border-bottom: 20px solid var(--slider-color);
        height: calc(var(--slider-width) * 0.4);
        cursor: grabbing;
        background: var(--slider-color);
        box-shadow: -350px 0 0 350px var(--slider-color),
          inset 0 0 0 80px var(--slider-thumb-color);
        border-radius: 0;
        transition: box-shadow 0.2s ease-in-out;
        position: relative;
        top: calc((var(--slider-width) - 80px) / 2);
      }
      .iosSlider {
        --slider-color: var(--accent-color);
      }
      .sliderOff {
        --slider-color: grey;
      }
      .sliderContent {
        margin: 50px 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @media only screen and (max-width: 600px) {
        .sliderContent {
          margin-top: 50%;
          margin-bottom: 50px;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
      .datals {
        height: 380px;
        width: 150px;
        display: grid;
        grid-template-columns: repeat(1, 100%);
        grid-template-rows: repeat(4, 25%);
        position: absolute;
        top: 0;
        /* right: calc(50% - (380px / 2)); */
        user-select: none;
        pointer-events: none;
      }

      .opt {
        content: "";
        display: block;
        border-bottom: 1px solid grey;
        width: 100%;
        z-index: 2;
        user-select: none;
        pointer-events: none;
      }

      .range__list__opt:before {
        content: "";
        display: block;
        width: 0;
        height: auto;
        padding-left: 3px;
        text-indent: 0;
      }
    `;
  }
}

// customElements.define("more-info-fan", MoreInfoFan);

declare global {
  interface HTMLElementTagNameMap {
    "more-info-fan": MoreInfoFan;
  }
}
