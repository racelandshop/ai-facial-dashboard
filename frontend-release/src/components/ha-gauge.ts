import { css, LitElement, PropertyValues, svg, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { styleMap } from "lit/directives/style-map";
import { formatNumber } from "../common/number/format_number";
import { afterNextRender } from "../common/util/render-status";
import { FrontendLocaleData } from "../data/translation";
import { getValueInPercentage, normalize } from "../util/calculate";

const getAngle = (value: number, min: number, max: number) => {
  const percentage = getValueInPercentage(normalize(value, min, max), min, max);
  return (percentage * 180) / 100;
};

export interface LevelDefinition {
  level: number;
  stroke: string;
}

@customElement("ha-gauge")
export class Gauge extends LitElement {
  @property({ type: Number }) public min = 0;

  @property({ type: Number }) public max = 100;

  @property({ type: Number }) public value = 0;

  @property({ type: String }) public valueText?: string;

  @property() public locale!: FrontendLocaleData;

  @property({ type: Boolean }) public needle?: boolean;

  @property() public levels?: LevelDefinition[];

  @property() public label = "";

  @state() private _angle = 0;

  @state() private _updated = false;

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    // Wait for the first render for the initial animation to work
    afterNextRender(() => {
      this._updated = true;
      this._angle = getAngle(this.value, this.min, this.max);
      this._rescale_svg();
    });
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (!this._updated || !changedProperties.has("value")) {
      return;
    }
    this._angle = getAngle(this.value, this.min, this.max);
    this._rescale_svg();
  }

  protected render() {
    return svg`
      <svg viewBox="-50 -50 100 50" class="gauge">
        ${
          !this.needle || !this.levels
            ? svg`
           <path
          class="dial"
          d="M -40 0 A 40 40 0 0 1 40 0"
        ></path>
        `
            : ""
        }

        ${
          this.levels
            ? this.levels
                .sort((a, b) => a.level - b.level)
                .map((level, idx) => {
                  let firstPath: TemplateResult | undefined;
                  if (idx === 0 && level.level !== this.min) {
                    const angle = getAngle(this.min, this.min, this.max);
                    firstPath = svg`<path
                        stroke="var(--accent-color)"
                        class="level"
                        d="M
                          ${0 - 40 * Math.cos((angle * Math.PI) / 180)}
                          ${0 - 40 * Math.sin((angle * Math.PI) / 180)}
                         A 40 40 0 0 1 40 0
                        "
                      ></path>`;
                  }
                  const angle = getAngle(level.level, this.min, this.max);
                  return svg`${firstPath}<path
                      stroke="${level.stroke}"
                      class="level"
                      d="M
                        ${0 - 40 * Math.cos((angle * Math.PI) / 180)}
                        ${0 - 40 * Math.sin((angle * Math.PI) / 180)}
                       A 40 40 0 0 1 40 0
                      "
                    ></path>`;
                })
            : ""
        }
        ${
          this.needle
            ? svg`
            <!-- <path
                class="needle"
                d="M -25 -2.5 L -47.5 0 L -25 2.5 z"
                style=${styleMap({ transform: `rotate(${this._angle}deg)` })}
              > -->
              <!-- <path
                class="pointer"
                d="M -40 0 L -39.945 -0.142 z"
                style=${styleMap({ transform: `rotate(${this._angle}deg)` })}
              > -->
              <circle class="needle" style=${styleMap({
                transform: `rotate(${this._angle}deg)`,
              })} cx="-40" cy="0" r="5"/>

              `
            : svg`<path
                class="value"
                d="M -40 0 A 40 40 0 1 0 40 0"
                style=${styleMap({ transform: `rotate(${this._angle}deg)` })}
              >`
        }
        </path>
        <path
          fill="var(--card-background-color, white)"
          opacity="1"
          d="M -46.6868 -8.7515 A 1 1 0 0 0 -32 -5.9878 L 31.9436 -5.9878 L 32.5 20 L -70 19 L -46.6868 -8.7515 M 31.9436 -5.9878 A 1 1 0 0 0 46.6868 -8.7515 L 64 20 L 32.5 20 L 31.9436 -5.9878"
        ></path>
      </svg>
      <svg class="text">
        <text class="value-text">
          ${
            this.valueText || formatNumber(this.value, this.locale)
          } ${this.label.substring(0, 10)}
        </text>
      </svg>`;
  }

  private _rescale_svg() {
    // Set the viewbox of the SVG containing the value to perfectly
    // fit the text
    // That way it will auto-scale correctly
    const svgRoot = this.shadowRoot!.querySelector(".text")!;
    const box = svgRoot.querySelector("text")!.getBBox()!;
    svgRoot.setAttribute(
      "viewBox",
      `${box.x} ${box!.y} ${box.width} ${box.height}`
    );
  }

  static get styles() {
    return css`
      :host {
        position: relative;
      }
      .dial {
        fill: none;
        stroke: var(--primary-background-color);
        stroke-width: 15;
        /* stroke-linecap: round; */
      }
      .value {
        fill: none;
        stroke-width: 15;
        stroke: var(--gauge-color);
        transition: all 1s cubic-bezier(0.19, 0.47, 0.25, 1) 0s;
        /* stroke-linecap: round; */
      }
      .pointer {
        fill: var(--primary-text-color);
        transition: all 1s ease 0s;
        stroke-width: 10;
        stroke-linecap: round;
      }
      .needle {
        fill: white;
        transition: all 1s ease 0s;
      }
      .level {
        fill: none;
        stroke-width: 15;
        /* stroke-linecap: round; */
      }
      .gauge {
        display: block;
      }
      .text {
        position: absolute;
        max-height: 40%;
        max-width: 120px;
        left: 50%;
        bottom: -6%;
        transform: translate(-50%, 0%);
      }
      .value-text {
        font-size: 1.2rem;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        max-width: 120px;
        fill: var(--primary-text-color);
        text-anchor: middle;
      }
    `;
  }
}
