import { SwitchBase } from "@material/mwc-switch/deprecated/mwc-switch-base";
import { styles } from "@material/mwc-switch/deprecated/mwc-switch.css";
import { css } from "lit";
import { customElement, property } from "lit/decorators";
import { forwardHaptic } from "../data/haptics";

@customElement("ha-switch")
export class HaSwitch extends SwitchBase {
  // Generate a haptic vibration.
  // Only set to true if the new value of the switch is applied right away when toggling.
  // Do not add haptic when a user is required to press save.
  @property({ type: Boolean }) public haptic = false;

  protected firstUpdated() {
    super.firstUpdated();
    this.addEventListener("change", () => {
      if (this.haptic) {
        forwardHaptic("light");
      }
    });

    /**
     *               childCard.addEventListener(
                "click",
                (ev: { preventDefault: () => void }) => {
                  ev.preventDefault();
                }
              );
     */
  }

  static override styles = [
    styles,
    css`
      :host {
        /* transform: scale(0.9); */
        --mdc-theme-secondary: var(--switch-checked-color);
      }
      .mdc-switch.mdc-switch--checked .mdc-switch__thumb {
        width: 16px;
        height: 16px;
        border: 8px solid;
        background-color: var(--switch-checked-button-color);
        /* border-color: var(--switch-checked-button-color);
        border-color: var(--switch-unchecked-button-color); */
        border-color: #ffffff;
        box-shadow: none;
      }
      .mdc-switch.mdc-switch--checked .mdc-switch__track {
        width: 36px;
        height: 18px;
        border: 0px solid transparent;
        border-radius: 20px;
        background-color: var(--switch-checked-track-color);
        /* border-color: var(--switch-checked-track-color); */
        /* border-color: var(--switch-unchecked-button-color); */
        border-color: #ffffff;
        opacity: 100 !important;
      }

      .mdc-switch:not(.mdc-switch--checked) .mdc-switch__thumb {
        width: 16px;
        height: 16px;
        border: 8px solid;
        background-color: var(--switch-unchecked-button-color);
        /* border-color: var(--switch-unchecked-button-color); */
        border-color: #ffffff;
        box-shadow: none;
      }
      .mdc-switch:not(.mdc-switch--checked) .mdc-switch__track {
        width: 36px;
        height: 18px;
        border: 0px solid transparent;
        border-radius: 20px;
        background-color: var(--switch-unchecked-track-color);
        border-color: var(--switch-unchecked-track-color);
      }

      .mdc-switch__thumb-underlay {
        left: -15px;
        right: initial;
        top: -15px;
        width: 48px;
        height: 48px;
      }

      .mdc-switch--checked .mdc-switch__thumb-underlay {
        transform: translateX(18px);
      }

      .mdc-switch__thumb-underlay > mwc-ripple {
        transform: translate(3px, 3px) scale(0.1);
      }

      .mdc-switch__native-control {
        pointer-events: var(--mdc-switch__pointer_events, "all");
        width: 48px;
        height: 48px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-switch": HaSwitch;
  }
}
