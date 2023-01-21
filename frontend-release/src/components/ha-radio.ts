import { RadioBase } from "@material/mwc-radio/mwc-radio-base";
import { styles } from "@material/mwc-radio/mwc-radio.css";
import { css } from "lit";
import { customElement } from "lit/decorators";

@customElement("ha-radio")
export class HaRadio extends RadioBase {
  static override styles = [
    styles,
    css`
      :host {
        --mdc-radio-unchecked-color: var(--primary-text-color);
        --mdc-theme-secondary: var(--primary-text-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-radio": HaRadio;
  }
}
