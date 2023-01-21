import { SelectBase } from "@material/mwc-select/mwc-select-base";
import { styles } from "@material/mwc-select/mwc-select.css";
import { css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators";
import { debounce } from "../common/util/debounce";
import { nextRender } from "../common/util/render-status";

@customElement("ha-select")
export class HaSelect extends SelectBase {
  // @ts-ignore
  @property({ type: Boolean }) public icon?: boolean;

  protected override renderLeadingIcon() {
    if (!this.icon) {
      return nothing;
    }

    return html`<span class="mdc-select__icon"
      ><slot name="icon"></slot
    ></span>`;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("translations-updated", this._translationsUpdated);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      "translations-updated",
      this._translationsUpdated
    );
  }

  private _translationsUpdated = debounce(async () => {
    await nextRender();
    this.layoutOptions();
  }, 500);

  static override styles = [
    styles,
    css`
      .mdc-line-ripple::before {
        border-bottom-width: 0px;
        z-index: 1;
      }
      .mdc-select:not(.mdc-select--disabled) .mdc-select__icon {
        color: var(--secondary-text-color);
      }
      .mdc-select__anchor {
        width: var(--ha-select-min-width, 200px);
        /* border-radius: 1.5rem !important; */
      }

      :host {
        /* --mdc-theme-surface: var(--input-fill-color); */
        border-bottom: 2px solid var(--form-border);
      }

      /* :host(:not([disabled]))
        .mdc-select.mdc-select--focused:not(.mdc-select--invalid)
        .mdc-floating-label {
        color: black;
      } */

      /* :host(:not([disabled]))
        .mdc-select.mdc-select--focused:not(.mdc-select--invalid)
        .mdc-select__dropdown-icon {
        fill: black;
      }*/

      .mdc-select--filled .mdc-select__anchor {
        height: 46px;
      }
      .mdc-select--filled:not(.mdc-select--disabled) .mdc-line-ripple::after {
        /* border-bottom-color: black; */
        border-bottom: none;
      }
    `,
  ];
}
declare global {
  interface HTMLElementTagNameMap {
    "ha-select": HaSelect;
  }
}
