import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import {
  customElement,
  // property,
  // state
} from "lit/decorators";
// import { classMap } from "lit/directives/class-map";

@customElement("unavailable-icon")
class UnavailableIcon extends LitElement {
  protected render(): TemplateResult {
    return html`
      <svg
        class="unavailableIcon"
        width="50"
        height="50"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.12 7.01043L3.87 39.7804C2.64 41.9804 4.24 44.6904 6.75 44.6904H43.25C45.77 44.6904 47.36 41.9804 46.13 39.7804L27.88 7.01043C26.63 4.75043 23.37 4.75043 22.12 7.01043Z"
          fill="#FF0000"
        />
        <path
          d="M25.0001 34.6201C24.3901 34.6201 23.8701 34.1601 23.8501 33.5901L23.1901 14.6201C23.1401 13.1201 23.9501 11.8301 25.0101 11.8301C26.0601 11.8301 26.8801 13.1201 26.8301 14.6201L26.1701 33.5901C26.1301 34.1601 25.6101 34.6201 25.0001 34.6201Z"
          fill="white"
        />
        <path
          d="M25.0001 40.2396C26.0052 40.2396 26.8201 39.4248 26.8201 38.4196C26.8201 37.4145 26.0052 36.5996 25.0001 36.5996C23.9949 36.5996 23.1801 37.4145 23.1801 38.4196C23.1801 39.4248 23.9949 40.2396 25.0001 40.2396Z"
          fill="white"
        />
      </svg>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .unavailableIcon {
        width: 22px;
        height: 22px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "unavailable-icon": UnavailableIcon;
  }
}
