import { css, CSSResultGroup, LitElement, svg, SVGTemplateResult } from "lit";
import { customElement } from "lit/decorators";

@customElement("ha-logo-svg")
export class HaLogoSvg extends LitElement {
  protected render(): SVGTemplateResult {
    return svg`
      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="256.000000pt" height="180.000000pt" viewBox="0 0 256.000000 180.000000"
 preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,180.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M1510 1554 c-403 -47 -745 -184 -954 -383 -82 -79 -146 -173 -177
-262 -28 -81 -31 -209 -6 -289 60 -197 259 -377 546 -494 87 -35 89 -32 6 12
-159 85 -291 196 -363 306 -69 106 -101 237 -83 342 62 354 462 631 1056 730
85 15 163 19 349 19 143 0 223 3 200 8 -42 8 -517 18 -574 11z"/>
<path d="M1534 1279 c-88 -11 -140 -26 -219 -64 -147 -70 -226 -178 -227 -311
-1 -120 32 -202 130 -325 93 -117 247 -238 410 -322 102 -53 139 -64 47 -14
-321 174 -533 445 -512 653 20 192 183 326 455 373 106 19 107 19 42 19 -36 0
-93 -4 -126 -9z"/>
<path d="M948 1228 c-62 -22 -13 -58 78 -58 30 0 64 5 75 10 68 37 -69 79
-153 48z"/>
<path d="M783 1043 c-12 -2 -27 -11 -34 -19 -41 -49 128 -81 198 -38 62 39
-53 79 -164 57z"/>
<path d="M730 812 c-74 -37 -30 -82 80 -82 70 0 130 25 130 55 0 41 -145 60
-210 27z"/>
<path d="M823 541 c-40 -19 -61 -50 -47 -72 11 -18 70 -39 109 -39 93 0 183
50 159 88 -28 45 -145 57 -221 23z"/>
</g>
</svg>`;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: var(--ha-icon-display, inline-flex);
        align-items: center;
        justify-content: center;
        position: relative;
        vertical-align: middle;
        fill: currentcolor;
        width: var(--mdc-icon-size, 24px);
        height: var(--mdc-icon-size, 24px);
      }
      svg {
        width: 100%;
        height: 100%;
        pointer-events: none;
        display: block;
      }
    `;
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "ha-logo-svg": HaLogoSvg;
  }
}
