import { TextFieldBase } from "@material/mwc-textfield/mwc-textfield-base";
import { styles } from "@material/mwc-textfield/mwc-textfield.css";
import { TemplateResult, html, PropertyValues, css } from "lit";
import { customElement, property } from "lit/decorators";

@customElement("ha-textfield")
export class HaTextField extends TextFieldBase {
  @property({ type: Boolean }) public invalid?: boolean;

  @property({ attribute: "error-message" }) public errorMessage?: string;

  // @ts-ignore
  @property({ type: Boolean }) public icon?: boolean;

  // @ts-ignore
  @property({ type: Boolean }) public iconTrailing?: boolean;

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (
      (changedProperties.has("invalid") &&
        (this.invalid || changedProperties.get("invalid") !== undefined)) ||
      changedProperties.has("errorMessage")
    ) {
      this.setCustomValidity(
        this.invalid ? this.errorMessage || "Invalid" : ""
      );
      this.reportValidity();
    }
  }

  protected override renderIcon(
    _icon: string,
    isTrailingIcon = false
  ): TemplateResult {
    const type = isTrailingIcon ? "trailing" : "leading";

    return html`
      <span
        class="mdc-text-field__icon mdc-text-field__icon--${type}"
        tabindex=${isTrailingIcon ? 1 : -1}
      >
        <slot name="${type}Icon"></slot>
      </span>
    `;
  }

  static override styles = [
    styles,
    css`
      :host {
        border-bottom: 2px solid var(--form-border); /** todo make it a variable */
      }

      .mdc-text-field__input {
        width: var(--ha-textfield-input-width, 100%);
        height: 100%;
      }
      .mdc-text-field--filled {
        height: 46px;
      }
      .mdc-text-field:not(.mdc-text-field--with-leading-icon) {
        padding: var(--text-field-padding, 0px 16px);
      }
      .mdc-text-field__affix--suffix {
        padding-left: var(--text-field-suffix-padding-left, 12px);
        padding-right: var(--text-field-suffix-padding-right, 0px);
      }

      .mdc-text-field:not(.mdc-text-field--disabled)
        .mdc-text-field__affix--suffix {
        color: var(--secondary-text-color);
      }

      .mdc-text-field__icon {
        color: var(--secondary-text-color);
      }

      input {
        text-align: var(--text-field-text-align);
      }

      /* Chrome, Safari, Edge, Opera */
      :host([no-spinner]) input::-webkit-outer-spin-button,
      :host([no-spinner]) input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Firefox */
      :host([no-spinner]) input[type="number"] {
        -moz-appearance: textfield;
      }

      .mdc-text-field--with-leading-icon.mdc-text-field--with-trailing-icon {
        padding-left: 5px;
        padding-right: 15px;
      }

      :host(:not([disabled]))
        .mdc-text-field.mdc-text-field--focused:not(.mdc-text-field--invalid)
        .mdc-floating-label {
        color: var(--accent-color);
      }

      .mdc-text-field .mdc-text-field__input {
        caret-color: var(--input-label-ink-color);
      }

      .mdc-text-field__ripple {
        overflow: hidden;
        /* border-radius: 1.5rem; */
      }

      .mdc-text-field {
        overflow: var(--text-field-overflow);
        /* border-radius: 1.5rem; */
      }
      .mdc-line-ripple::before {
        border-bottom-width: 0px;
        z-index: 1;
      }
      .mdc-line-ripple::after {
        border-bottom-width: 0px;
        z-index: 1;
      }

      .mdc-text-field .mdc-floating-label {
        top: 70%;
        transform: translateY(-50%);
        pointer-events: none;
      }

      .mdc-text-field--filled .mdc-floating-label--float-above {
        transform: translateY(-160%) scale(0.75);
      }

      .mdc-text-field__icon {
        align-self: end;
        cursor: pointer;
      }

      .mdc-text-field__icon--leading {
        margin-left: 8px;
        margin-right: 8px;
      }

      .mdc-text-field__icon--trailing {
        padding: 0;
        margin-left: 0px;
        margin-right: 0px;
      }

      .mdc-text-field + .mdc-text-field-helper-line {
        padding-right: 16px;
        padding-left: 16px;
        height: 0;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-textfield": HaTextField;
  }
}
