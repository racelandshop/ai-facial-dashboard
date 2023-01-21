/* eslint-disable lit/no-template-arrow */
import "@material/mwc-list/mwc-list-item";
import { tinycolor, TinyColor } from "@ctrl/tinycolor";
import { mdiPalette } from "@mdi/js";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators";
import memoizeOne from "memoize-one";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import { stopPropagation } from "../../../common/dom/stop_propagation";
import { supportsFeature } from "../../../common/entity/supports-feature";
import "../../../components/ha-attributes";
import "../../../components/ha-button-toggle-group";
import "../../../components/ha-color-picker";
import "../../../components/ha-icon-button";
import "../../../components/ha-labeled-slider";
import "../../../components/ha-select";
import {
  getLightCurrentModeRgbColor,
  LightColorModes,
  LightEntity,
  lightIsInColorMode,
  lightSupportsColor,
  lightSupportsColorMode,
  lightSupportsDimming,
  SUPPORT_EFFECT,
} from "../../../data/light";
import type { HomeAssistant } from "../../../types";
import { classMap } from "lit/directives/class-map";

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

@customElement("more-info-light")
class MoreInfoLight extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public stateObj?: LightEntity;

  @state() private _brightnessSliderValue = 0;

  @state() private _ctSliderValue?: number;

  @state() private _cwSliderValue?: number;

  @state() private _wwSliderValue?: number;

  @state() private _wvSliderValue?: number;

  @state() private _colorBrightnessSliderValue?: number;

  @state() private _brightnessAdjusted?: number;

  @state() private _hueSegments = 24;

  @state() private _saturationSegments = 8;

  @state() private _colorPickerColor?: [number, number, number];

  @state() private _mode?: "color" | LightColorModes;

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

  protected updated(): void {
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
    if (!this.hass || !this.stateObj) {
      return html``;
    }

    return html`
      ${this.settingsOn === true
        ? this._render_slider()
        : this._render_colorPicker()}
    `;
  }

  private _render_slider() {
    if (!this.hass || !this.stateObj) {
      return html``;
    }

    const supportDimming = lightSupportsDimming(this.stateObj);
    const brightness = this.stateObj?.attributes.brightness
      ? Math.round(this.stateObj.attributes.brightness / 2.55)
      : 0;

    const switchValue = this.stateObj?.state === "on" ? 1 : 0;

    const color = this._getColorForLightEntity(
      this.stateObj,
      undefined,
      undefined
    );

    let actions;
    const entity = this.stateObj?.entity_id;
    if (
      this.stateObj?.attributes.supported_color_modes[0] === "hs" ||
      this.stateObj?.attributes.supported_color_modes[0] === "rgb" ||
      this.stateObj?.attributes.supported_color_modes[0] === "rgbw"
    ) {
      actions = [
        {
          service_data: { entity_id: entity, rgb_color: [240, 85, 68] },
          color: "#f05544",
        },
        {
          service_data: { entity_id: entity, rgb_color: [125, 219, 84] },
          color: "#7DDB54",
        },
        {
          service_data: { entity_id: entity, rgb_color: [17, 34, 68] },
          color: "#112244",
        },
        {
          service_data: { entity_id: entity, rgb_color: [247, 217, 89] },
          color: "#f7d959",
        },
        {
          service_data: { entity_id: entity, rgb_color: [136, 119, 119] },
          color: "#887777",
        },
        {
          service_data: { entity_id: entity, rgb_color: [255, 181, 245] },
          color: "#FFB5F5",
        },
      ];
    } else if (
      this.stateObj?.attributes.supported_color_modes[0] === "brightness"
    ) {
      actions = [
        {
          service_data: { entity_id: entity, brightness: 65 },
          color: "#D1CFCF",
        },
        {
          service_data: { entity_id: entity, brightness: 120 },
          color: "#DCDCDC",
        },
        {
          service_data: { entity_id: entity, brightness: 220 },
          color: "#F0F0F0",
        },
      ];
    }
    let actionRowCount = 0;
    if (actions) {
      const numberOfRows = Math.ceil(actions.length / 3);
      for (let i = 0; i < numberOfRows; i++) {
        this.actionRows[i] = [];
        for (let j = 0; j < 3; j++) {
          if (actions[i * 3 + j]) {
            this.actionRows[i][j] = actions[i * 3 + j];
          }
        }
      }
    }

    return html` <div class="content">
      ${supportDimming
        ? html`
            <h2 id="brightnessValue">
              ${this.stateObj?.state === "off"
                ? this.hass.localize("component.light.state._.off")
                : brightness + "%"}
            </h2>
            <div class="range-holder">
              <input
                type="range"
                id="iosSlider"
                style=" --slider-width: 130px;
              --slider-height: 330px; --slider-border-radius: 40px;
              --slider-color:${color}; --slider-thumb-color:#ddd;
              --slider-track-color:#ddd"
                .value=${this.stateObj?.state === "off"
                  ? String(0)
                  : String(brightness)}
                @change=${(e) =>
                  this._setBrightness(this.stateObj, e.target.value)}
              />
            </div>
          `
        : html`
            <h2 id="switchValue">
              ${computeStateDisplay(
                this.hass.localize,
                this.stateObj,
                this.hass.locale
              )}
            </h2>

            <!-- <label id="SwitchContainer">
              <input
                id="iosSwitch"
                type="checkbox"
                ?checked=${!!switchValue}
                @change=${() => this._switch(this.stateObj)}
              />
              <div id="SliderTrack"></div>
            </label> -->
            <div class="switch-holder">
              <input
                class="sliderOnOff ${classMap({
                  switchON: switchValue === 1,
                  switchOFF: switchValue === 0,
                })}"
                type="range"
                id="iosSlider"
                style="--switch-width: 150px;
                --switch-height: 380px;
                --slider-border-radius: 40px;
                --switch-track-color: #ddd;"
                value="0"
                min="0"
                max="1"
                .value=${String(switchValue)}
                @change=${() => this._switch(this.stateObj)}
              />
            </div>
          `}
      ${actions && actions.length > 0
        ? html`
            <div class="action-holder">
              ${this.actionRows.map((actionRow) => {
                actionRowCount++;
                let actionCount = 0;
                return html` <div class="action-row">
                  ${actionRow.map((action) => {
                    actionCount++;
                    return html` <div
                      class="action"
                      style="--size: 45px;"
                      @click=${(e) => this._activateAction(e)}
                      data-service="${actionRowCount}#${actionCount}"
                    >
                      <span
                        class="color"
                        style="background-color:${action.color};
                                        border-color:${action.color};
                                        --size:50px"
                        ;
                      >
                      </span>
                    </div>`;
                  })}
                </div>`;
              })}
            </div>
          `
        : html``}
      <div class="contentfooter">
        <ha-icon-button
          class="settings"
          .path=${"M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z"}
          @click=${() => this._openSettings()}
        ></ha-icon-button>
      </div>
    </div>`;
  }

  private _render_colorPicker() {
    if (!this.hass || !this.stateObj) {
      return html``;
    }

    const supportsTemp = lightSupportsColorMode(
      this.stateObj,
      LightColorModes.COLOR_TEMP
    );

    const supportsWhite = lightSupportsColorMode(
      this.stateObj,
      LightColorModes.WHITE
    );

    const supportsRgbww = lightSupportsColorMode(
      this.stateObj,
      LightColorModes.RGBWW
    );

    const supportsRgbw =
      !supportsRgbww &&
      lightSupportsColorMode(this.stateObj, LightColorModes.RGBW);

    const supportsColor =
      supportsRgbww || supportsRgbw || lightSupportsColor(this.stateObj);

    return html`
      <div class="content">
        ${lightSupportsDimming(this.stateObj)
          ? html`
              <ha-labeled-slider
                caption=${this.hass.localize("ui.card.light.brightness")}
                icon="hass:brightness-5"
                min="0"
                max="100"
                value=${this._brightnessSliderValue}
                @change=${this._brightnessSliderChanged}
                pin
              ></ha-labeled-slider>
            `
          : ""}
        ${this.stateObj.state === "on"
          ? html`
              ${supportsTemp || supportsColor ? html`<hr />` : ""}
              ${supportsColor && (supportsTemp || supportsWhite)
                ? html`<ha-button-toggle-group
                    fullWidth
                    .buttons=${this._toggleButtons(supportsTemp, supportsWhite)}
                    .active=${this._mode}
                    @value-changed=${this._modeChanged}
                  ></ha-button-toggle-group>`
                : ""}
              ${supportsTemp &&
              ((!supportsColor && !supportsWhite) ||
                this._mode === LightColorModes.COLOR_TEMP)
                ? html`
                    <ha-labeled-slider
                      class="color_temp"
                      caption=${this.hass.localize(
                        "ui.card.light.color_temperature"
                      )}
                      icon="hass:thermometer"
                      .min=${this.stateObj.attributes.min_mireds}
                      .max=${this.stateObj.attributes.max_mireds}
                      .value=${this._ctSliderValue}
                      @change=${this._ctSliderChanged}
                      pin
                    ></ha-labeled-slider>
                  `
                : ""}
              ${supportsColor &&
              ((!supportsTemp && !supportsWhite) || this._mode === "color")
                ? html`
                    <div class="segmentationContainer">
                      <ha-color-picker
                        class="color"
                        @colorselected=${this._colorPicked}
                        .desiredRgbColor=${this._colorPickerColor}
                        throttle="500"
                        .hueSegments=${this._hueSegments}
                        .saturationSegments=${this._saturationSegments}
                      >
                      </ha-color-picker>
                      <ha-icon-button
                        .path=${mdiPalette}
                        @click=${this._segmentClick}
                        class="segmentationButton"
                      ></ha-icon-button>
                    </div>

                    ${supportsRgbw || supportsRgbww
                      ? html`<ha-labeled-slider
                          .caption=${this.hass.localize(
                            "ui.card.light.color_brightness"
                          )}
                          icon="hass:brightness-7"
                          max="100"
                          .value=${this._colorBrightnessSliderValue}
                          @change=${this._colorBrightnessSliderChanged}
                          pin
                        ></ha-labeled-slider>`
                      : ""}
                    ${supportsRgbw
                      ? html`
                          <ha-labeled-slider
                            .caption=${this.hass.localize(
                              "ui.card.light.white_value"
                            )}
                            icon="hass:file-word-box"
                            max="100"
                            .name=${"wv"}
                            .value=${this._wvSliderValue}
                            @change=${this._wvSliderChanged}
                            pin
                          ></ha-labeled-slider>
                        `
                      : ""}
                    ${supportsRgbww
                      ? html`
                          <ha-labeled-slider
                            .caption=${this.hass.localize(
                              "ui.card.light.cold_white_value"
                            )}
                            icon="hass:file-word-box-outline"
                            max="100"
                            .name=${"cw"}
                            .value=${this._cwSliderValue}
                            @change=${this._wvSliderChanged}
                            pin
                          ></ha-labeled-slider>
                          <ha-labeled-slider
                            .caption=${this.hass.localize(
                              "ui.card.light.warm_white_value"
                            )}
                            icon="hass:file-word-box"
                            max="100"
                            .name=${"ww"}
                            .value=${this._wwSliderValue}
                            @change=${this._wvSliderChanged}
                            pin
                          ></ha-labeled-slider>
                        `
                      : ""}
                  `
                : ""}
              ${supportsFeature(this.stateObj, SUPPORT_EFFECT) &&
              this.stateObj!.attributes.effect_list?.length
                ? html`
                    <hr />
                    <ha-select
                      .label=${this.hass.localize("ui.card.light.effect")}
                      .value=${this.stateObj.attributes.effect || ""}
                      fixedMenuPosition
                      naturalMenuWidth
                      @selected=${this._effectChanged}
                      @closed=${stopPropagation}
                    >
                      ${this.stateObj.attributes.effect_list.map(
                        (effect: string) => html`
                          <mwc-list-item .value=${effect}>
                            ${effect}
                          </mwc-list-item>
                        `
                      )}
                    </ha-select>
                  `
                : ""}
            `
          : ""}
        <ha-attributes
          .hass=${this.hass}
          .stateObj=${this.stateObj}
          extra-filters="brightness,color_temp,white_value,effect_list,effect,hs_color,rgb_color,rgbw_color,rgbww_color,xy_color,min_mireds,max_mireds,entity_id,supported_color_modes,color_mode"
        ></ha-attributes>
        <div class="contentfooter">
          <mwc-button
            slot="primaryAction"
            @click=${() => this._closeSettings()}
            class="settings"
          >
            ${this.hass!.localize("ui.common.back")}
          </mwc-button>
        </div>
      </div>
      <!-- <ha-icon-button
        class="settings"
        .path=${"M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z"}
        @click=${() => this._closeSettings()}
      ></ha-icon-button> -->
    `;
  }

  public willUpdate(changedProps: PropertyValues<this>) {
    super.willUpdate(changedProps);

    if (!changedProps.has("stateObj")) {
      return;
    }
    const stateObj = this.stateObj! as LightEntity;
    const oldStateObj = changedProps.get("stateObj") as LightEntity | undefined;

    if (stateObj.state === "on") {
      // Don't change tab when the color mode changes
      if (
        oldStateObj?.entity_id !== stateObj.entity_id ||
        oldStateObj?.state !== stateObj.state
      ) {
        this._mode = lightIsInColorMode(this.stateObj!)
          ? "color"
          : this.stateObj!.attributes.color_mode;
      }

      let brightnessAdjust = 100;
      this._brightnessAdjusted = undefined;
      if (
        stateObj.attributes.color_mode === LightColorModes.RGB &&
        !lightSupportsColorMode(stateObj, LightColorModes.RGBWW) &&
        !lightSupportsColorMode(stateObj, LightColorModes.RGBW)
      ) {
        const maxVal = Math.max(...stateObj.attributes.rgb_color);
        if (maxVal < 255) {
          this._brightnessAdjusted = maxVal;
          brightnessAdjust = (this._brightnessAdjusted / 255) * 100;
        }
      }
      this._brightnessSliderValue = Math.round(
        (stateObj.attributes.brightness * brightnessAdjust) / 255
      );
      this._ctSliderValue = stateObj.attributes.color_temp;
      this._wvSliderValue =
        stateObj.attributes.color_mode === LightColorModes.RGBW
          ? Math.round((stateObj.attributes.rgbw_color[3] * 100) / 255)
          : undefined;
      this._cwSliderValue =
        stateObj.attributes.color_mode === LightColorModes.RGBWW
          ? Math.round((stateObj.attributes.rgbww_color[3] * 100) / 255)
          : undefined;
      this._wwSliderValue =
        stateObj.attributes.color_mode === LightColorModes.RGBWW
          ? Math.round((stateObj.attributes.rgbww_color[4] * 100) / 255)
          : undefined;

      const currentRgbColor = getLightCurrentModeRgbColor(stateObj);

      this._colorBrightnessSliderValue = currentRgbColor
        ? Math.round((Math.max(...currentRgbColor.slice(0, 3)) * 100) / 255)
        : undefined;

      this._colorPickerColor = currentRgbColor?.slice(0, 3) as [
        number,
        number,
        number
      ];
    } else {
      this._brightnessSliderValue = 0;
    }
  }

  private _switch(state) {
    this.hass.callService("homeassistant", "toggle", {
      entity_id: state.entity_id,
    });
  }

  private _setBrightness(stateObj: LightEntity | any, value) {
    this.hass.callService("homeassistant", "turn_on", {
      entity_id: stateObj.entity_id,
      brightness: value * 2.55,
    });
  }

  private _activateAction(e) {
    if (e.target.dataset && e.target.dataset.service) {
      const [row, item] = e.target.dataset.service.split("#", 2);
      const action = this.actionRows[row - 1][item - 1];
      this.hass.callService("light", "turn_on", action.service_data);
    }
  }

  private _getColorForLightEntity(
    stateObj: LightEntity,
    useTemperature,
    useBrightness
  ) {
    let color;
    if (stateObj) {
      if (stateObj.attributes.rgb_color) {
        color = `rgb(${stateObj.attributes.rgb_color.join(",")})`;
        if (stateObj.attributes.brightness) {
          color = this._applyBrightnessToColor(
            color,
            (stateObj.attributes.brightness + 245) / 5
          );
        }
      } else if (
        useTemperature &&
        stateObj.attributes.color_temp &&
        stateObj.attributes.min_mireds &&
        stateObj.attributes.max_mireds
      ) {
        color = this._getLightColorBasedOnTemperature(
          stateObj.attributes.color_temp,
          stateObj.attributes.min_mireds,
          stateObj.attributes.max_mireds
        );
        if (stateObj.attributes.brightness) {
          color = this._applyBrightnessToColor(
            color,
            (stateObj.attributes.brightness + 245) / 5
          );
        }
      } else if (useBrightness && stateObj.attributes.brightness) {
        color = this._applyBrightnessToColor(
          this._getDefaultColorForState(),
          (stateObj.attributes.brightness + 245) / 5
        );
      } else {
        color = this._getDefaultColorForState();
      }
    }
    return color;
  }

  private _applyBrightnessToColor(color: string, brightness) {
    const colorObj = new TinyColor(this._getColorFromVariable(color));
    if (colorObj.isValid) {
      const validColor = colorObj.mix("black", 100 - brightness).toString();
      if (validColor) return validColor;
    }
    return color;
  }

  private _getColorFromVariable(color: string): string {
    if (typeof color !== "undefined" && color.substring(0, 3) === "var") {
      return window
        .getComputedStyle(document.documentElement)
        .getPropertyValue(color.substring(4).slice(0, -1))
        .trim();
    }
    return color;
  }

  private _getLightColorBasedOnTemperature(current, min, max) {
    const high = new TinyColor("rgb(255, 160, 0)"); //  orange-ish
    const low = new TinyColor("rgb(166, 209, 255)"); //  blue-ish
    const middle = new TinyColor("white");
    const mixAmount = ((current - min) / (max - min)) * 100;
    if (mixAmount < 50) {
      return tinycolor(low)
        .mix(middle, mixAmount * 2)
        .toRgbString();
    }
    return tinycolor(middle)
      .mix(high, (mixAmount - 50) * 2)
      .toRgbString();
  }

  private _getDefaultColorForState() {
    return "#f7d959";
  }

  private _openSettings() {
    this.settingsOn = false;
  }

  private _closeSettings() {
    this.settingsOn = true;
  }

  private _toggleButtons = memoizeOne(
    (supportsTemp: boolean, supportsWhite: boolean) => {
      const modes = [{ label: "Color", value: "color" }];
      if (supportsTemp) {
        modes.push({ label: "Temperature", value: LightColorModes.COLOR_TEMP });
      }
      if (supportsWhite) {
        modes.push({ label: "White", value: LightColorModes.WHITE });
      }
      return modes;
    }
  );

  private _modeChanged(ev: CustomEvent) {
    this._mode = ev.detail.value;
  }

  private _effectChanged(ev) {
    const newVal = ev.target.value;

    if (!newVal || this.stateObj!.attributes.effect === newVal) {
      return;
    }

    this.hass.callService("light", "turn_on", {
      entity_id: this.stateObj!.entity_id,
      effect: newVal,
    });
  }

  private _brightnessSliderChanged(ev: CustomEvent) {
    const bri = Number((ev.target as any).value);

    if (isNaN(bri)) {
      return;
    }

    this._brightnessSliderValue = bri;

    if (this._mode === LightColorModes.WHITE) {
      this.hass.callService("light", "turn_on", {
        entity_id: this.stateObj!.entity_id,
        white: Math.min(255, Math.round((bri * 255) / 100)),
      });
      return;
    }

    if (this._brightnessAdjusted) {
      const rgb =
        this.stateObj!.attributes.rgb_color ||
        ([0, 0, 0] as [number, number, number]);

      this.hass.callService("light", "turn_on", {
        entity_id: this.stateObj!.entity_id,
        brightness_pct: bri,
        rgb_color: this._adjustColorBrightness(
          rgb,
          this._brightnessAdjusted,
          true
        ),
      });
      return;
    }

    this.hass.callService("light", "turn_on", {
      entity_id: this.stateObj!.entity_id,
      brightness_pct: bri,
    });
  }

  private _ctSliderChanged(ev: CustomEvent) {
    const ct = Number((ev.target as any).value);

    if (isNaN(ct)) {
      return;
    }

    this._ctSliderValue = ct;

    this.hass.callService("light", "turn_on", {
      entity_id: this.stateObj!.entity_id,
      color_temp: ct,
    });
  }

  private _wvSliderChanged(ev: CustomEvent) {
    const target = ev.target as any;
    let wv = Number(target.value);
    const name = target.name;

    if (isNaN(wv)) {
      return;
    }

    if (name === "wv") {
      this._wvSliderValue = wv;
    } else if (name === "cw") {
      this._cwSliderValue = wv;
    } else if (name === "ww") {
      this._wwSliderValue = wv;
    }

    wv = Math.min(255, Math.round((wv * 255) / 100));

    const rgb = getLightCurrentModeRgbColor(this.stateObj!);

    if (name === "wv") {
      const rgbw_color = rgb || [0, 0, 0, 0];
      rgbw_color[3] = wv;
      this.hass.callService("light", "turn_on", {
        entity_id: this.stateObj!.entity_id,
        rgbw_color,
      });
      return;
    }

    const rgbww_color = rgb || [0, 0, 0, 0, 0];
    while (rgbww_color.length < 5) {
      rgbww_color.push(0);
    }
    rgbww_color[name === "cw" ? 3 : 4] = wv;
    this.hass.callService("light", "turn_on", {
      entity_id: this.stateObj!.entity_id,
      rgbww_color,
    });
  }

  private _colorBrightnessSliderChanged(ev: CustomEvent) {
    const target = ev.target as any;
    let value = Number(target.value);

    if (isNaN(value)) {
      return;
    }

    const oldValue = this._colorBrightnessSliderValue;
    this._colorBrightnessSliderValue = value;

    value = (value * 255) / 100;

    const rgb = (getLightCurrentModeRgbColor(this.stateObj!)?.slice(0, 3) || [
      255, 255, 255,
    ]) as [number, number, number];

    this._setRgbWColor(
      this._adjustColorBrightness(
        // first normalize the value
        oldValue
          ? this._adjustColorBrightness(rgb, (oldValue * 255) / 100, true)
          : rgb,
        value
      )
    );
  }

  private _segmentClick() {
    if (this._hueSegments === 24 && this._saturationSegments === 8) {
      this._hueSegments = 0;
      this._saturationSegments = 0;
    } else {
      this._hueSegments = 24;
      this._saturationSegments = 8;
    }
  }

  private _adjustColorBrightness(
    rgbColor: [number, number, number],
    value?: number,
    invert = false
  ) {
    if (value !== undefined && value !== 255) {
      let ratio = value / 255;
      if (invert) {
        ratio = 1 / ratio;
      }
      rgbColor[0] = Math.min(255, Math.round(rgbColor[0] * ratio));
      rgbColor[1] = Math.min(255, Math.round(rgbColor[1] * ratio));
      rgbColor[2] = Math.min(255, Math.round(rgbColor[2] * ratio));
    }
    return rgbColor;
  }

  private _setRgbWColor(rgbColor: [number, number, number]) {
    if (lightSupportsColorMode(this.stateObj!, LightColorModes.RGBWW)) {
      const rgbww_color: [number, number, number, number, number] = this
        .stateObj!.attributes.rgbww_color
        ? [...this.stateObj!.attributes.rgbww_color]
        : [0, 0, 0, 0, 0];
      this.hass.callService("light", "turn_on", {
        entity_id: this.stateObj!.entity_id,
        rgbww_color: rgbColor.concat(rgbww_color.slice(3)),
      });
    } else if (lightSupportsColorMode(this.stateObj!, LightColorModes.RGBW)) {
      const rgbw_color: [number, number, number, number] = this.stateObj!
        .attributes.rgbw_color
        ? [...this.stateObj!.attributes.rgbw_color]
        : [0, 0, 0, 0];
      this.hass.callService("light", "turn_on", {
        entity_id: this.stateObj!.entity_id,
        rgbw_color: rgbColor.concat(rgbw_color.slice(3)),
      });
    }
  }

  /**
   * Called when a new color has been picked.
   * should be throttled with the 'throttle=' attribute of the color picker
   */
  private _colorPicked(
    ev: CustomEvent<{
      hs: { h: number; s: number };
      rgb: { r: number; g: number; b: number };
    }>
  ) {
    this._colorPickerColor = [
      ev.detail.rgb.r,
      ev.detail.rgb.g,
      ev.detail.rgb.b,
    ];

    if (
      lightSupportsColorMode(this.stateObj!, LightColorModes.RGBWW) ||
      lightSupportsColorMode(this.stateObj!, LightColorModes.RGBW)
    ) {
      this._setRgbWColor(
        this._colorBrightnessSliderValue
          ? this._adjustColorBrightness(
              [ev.detail.rgb.r, ev.detail.rgb.g, ev.detail.rgb.b],
              (this._colorBrightnessSliderValue * 255) / 100
            )
          : [ev.detail.rgb.r, ev.detail.rgb.g, ev.detail.rgb.b]
      );
    } else if (lightSupportsColorMode(this.stateObj!, LightColorModes.RGB)) {
      const rgb_color: [number, number, number] = [
        ev.detail.rgb.r,
        ev.detail.rgb.g,
        ev.detail.rgb.b,
      ];
      if (this._brightnessAdjusted) {
        this.hass.callService("light", "turn_on", {
          entity_id: this.stateObj!.entity_id,
          brightness_pct: this._brightnessSliderValue,
          rgb_color: this._adjustColorBrightness(
            rgb_color,
            this._brightnessAdjusted,
            true
          ),
        });
      } else {
        this.hass.callService("light", "turn_on", {
          entity_id: this.stateObj!.entity_id,
          rgb_color,
        });
      }
    } else {
      this.hass.callService("light", "turn_on", {
        entity_id: this.stateObj!.entity_id,
        hs_color: [ev.detail.hs.h, ev.detail.hs.s * 100],
      });
    }
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        background-color: #000 !important;
      }
      .popup-wrapper {
        margin-top: 64px;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }

      .range-holder {
        --slider-height: 380px;
        --slider-width: 150px;
        height: var(--slider-height);
        width: var(--slider-width);
        position: relative;
        display: block;
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
        width: 25px;
        border-right: 10px solid var(--slider-color);
        border-left: 10px solid var(--slider-color);
        border-top: 20px solid var(--slider-color);
        border-bottom: 20px solid var(--slider-color);
        -webkit-appearance: none;
        height: 80px;
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
        width: 5px;
        border-right: 12px solid var(--slider-color);
        border-left: 12px solid var(--slider-color);
        border-top: 20px solid var(--slider-color);
        border-bottom: 20px solid var(--slider-color);
        height: calc(var(--slider-width) * 0.4);
        cursor: ew-resize;
        background: var(--slider-color);
        box-shadow: -350px 0 0 350px var(--slider-color),
          inset 0 0 0 80px var(--slider-thumb-color);
        border-radius: 0;
        transition: box-shadow 0.2s ease-in-out;
        position: relative;
        top: calc((var(--slider-width) - 80px) / 2);
      }
      #brightnessValue {
        text-align: center;
        margin: 0;
      }
      .switch-holder {
        --switch-height: 380px;
        --switch-width: 150px;
        height: var(--switch-height);
        width: var(--switch-width);
        position: relative;
        display: block;
      }
      #switchValue {
        text-align: center;
      }
      .switch-holder input[type="range"] {
        outline: 0;
        border: 0;
        border-radius: var(--slider-border-radius, 12px);
        width: calc(var(--switch-height) - 20px);
        margin: 0;
        transition: 1s ease-in-out;
        -webkit-transform: rotate(270deg);
        -moz-transform: rotate(270deg);
        -o-transform: rotate(270deg);
        -ms-transform: rotate(270deg);
        transform: rotate(270deg);
        overflow: hidden;
        height: calc(var(--switch-width) - 20px);
        -webkit-appearance: none;
        background-color: var(--switch-track-color);
        padding: 10px;
        position: absolute;
        top: calc(50% - (var(--switch-width) / 2));
        right: calc(50% - (var(--switch-height) / 2));
      }
      .switch-holder input[type="range"]::-webkit-slider-runnable-track {
        height: calc(var(--switch-width) - 20px);
        -webkit-appearance: none;
        color: var(--switch-track-color);
        margin-top: -1px;
        transition: 0.2s ease-in-out;
      }
      .switch-holder input[type="range"]::-webkit-slider-thumb {
        width: calc(var(--switch-height) / 2);
        -webkit-appearance: none;
        height: calc(var(--switch-width) - 20px);
        cursor: ew-resize;
        background: var(--switch-color);
        transition: 0.2s ease-in-out;
        border: none;
        /* box-shadow: -1px 1px 20px 0px rgba(0, 0, 0, 0.75); */
        position: relative;
        top: 0;
        border-radius: var(--slider-border-radius, 12px);
      }

      .action-holder {
        display: flex;
        flex-direction: column;
        /* margin-top: 20px; */
      }
      .action-row {
        display: block;
        margin-left: auto;
        margin-right: auto;
        padding-bottom: 10px;
      }
      .action-row:last-child {
        padding: 0;
      }
      .action-holder .action {
        display: inline-block;
        margin-right: 4px;
        margin-left: 4px;
        cursor: pointer;
      }
      .action-holder.action:nth-child(4n) {
        margin-right: 0;
      }
      .action-holder .action .color {
        width: var(--size);
        height: var(--size);
        border-radius: 50%;
        display: block;
        border: 1px solid #fff;
        line-height: var(--size);
        text-align: center;
        pointer-events: none;
      }
      .action-holder .action .color ha-icon {
        pointer-events: none;
      }
      .action-holder .action .name {
        width: var(--size);
        display: block;
        color: #fff;
        font-size: 9px;
        margin-top: 3px;
        text-align: center;
        pointer-events: none;
      }
      .sliderOnOff input[type="range"] {
        transition: 1s ease-in-out;
      }
      .switchON {
        --switch-color: var(--switch-checked-button-color);
      }
      .switchOFF {
        --switch-color: var(--switch-unchecked-button-color);
      }
      .content {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .content > * {
        width: 100%;
      }
      .contentfooter {
        position: relative;
        width: 100%;
        height: 45px;
      }

      .settings {
        position: absolute;
        bottom: 0;
        right: 0;
        width: auto;
        height: auto;
      }
      .color_temp {
        --ha-slider-background: -webkit-linear-gradient(
          right,
          rgb(255, 160, 0) 0%,
          white 50%,
          rgb(166, 209, 255) 100%
        );
        /* The color temp minimum value shouldn't be rendered differently. It's not "off". */
        --paper-slider-knob-start-border-color: var(--primary-color);
        margin-bottom: 4px;
      }

      .segmentationContainer {
        position: relative;
        max-height: 500px;
        display: flex;
        justify-content: center;
      }

      ha-button-toggle-group {
        margin-bottom: 8px;
      }

      ha-color-picker {
        --ha-color-picker-wheel-borderwidth: 5;
        --ha-color-picker-wheel-bordercolor: white;
        --ha-color-picker-wheel-shadow: none;
        --ha-color-picker-marker-borderwidth: 2;
        --ha-color-picker-marker-bordercolor: white;
      }

      .segmentationButton {
        position: absolute;
        top: 5%;
        left: 0;
        color: var(--secondary-text-color);
      }

      hr {
        border-color: var(--divider-color);
        border-bottom: none;
        margin: 16px 0;
      }

      #SwitchContainer {
        background: #f0f0f0;
        height: 260px;
        width: 90px;
        border-radius: 20px;
        cursor: pointer;
        position: relative;
        margin-top: 15%;
        margin-bottom: 20%;
      }

      #iosSwitch {
        opacity: 0;
        width: 0;
        height: 0;
      }

      #SwitchContainer:before {
        -webkit-transform: translateY(-125px);
        -ms-transform: translateY(-125px);
        transform: translateY(-125px);
      }

      #iosSwitch:checked {
        -webkit-transform: translateY(-125px);
        -ms-transform: translateY(-125px);
        transform: translateY(-125px);
      }

      #SliderTrack {
        -webkit-transition: 0.4s;
        transition: 0.4s;
      }

      #SliderTrack::before {
        position: absolute;
        content: "";
        margin: 5px 0 0 5px;
        height: 125px;
        width: 80px;
        left: 0px;
        top: 125px;
        -webkit-transition: 0.4s;
        transition: 0.4s;
        border-radius: 18px;
        background-color: #f8cc46;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-light": MoreInfoLight;
  }
}
