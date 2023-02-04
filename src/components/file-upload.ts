import "@material/mwc-button/mwc-button";
import { styles } from "@material/mwc-textfield/mwc-textfield.css";
import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import { fireEvent } from "../../frontend-release/src/common/dom/fire_event";
import type { HomeAssistant } from "../../frontend-release/src/types";
import { localize } from "../localize/localize";
import { createImage, generateImageThumbnailUrl } from "../../frontend-release/src/data/image";

declare global {
  interface HASSDomEvents {
    "files-url-generated": { url_list: string[] | undefined };
  }
}

@customElement("file-upload")
export class HaFileUpload extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public accept!: string;

  @property({ type: Boolean, attribute: "auto-open-file-dialog" })
  private autoOpenFileDialog = false;

  @query("#input") private _input?: HTMLInputElement;

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    if (this.autoOpenFileDialog) {
      this._openFilePicker();
    }
  }

  public render(): TemplateResult {
    return html`<mwc-button class="button-upload">
      <label for="input" class="mdc-field mdc-field--filled">
        <input
          id="input"
          type="file"
          multiple
          class="mdc-text-field__input file"
          accept=${this.accept}
          @change=${this._handleFilePicked}
          aria-labelledby="label"
        />${localize("common.upload_confirm")}
      </label>
    </mwc-button>`;
  }

  private async _handleFilePicked(ev) {
    const url_list = [];
    const n_files = ev.target.files.length;
    const file_list = ev.target.files;
    for (let i = 0; i <= n_files - 1; i++) {
      const media = await createImage(this.hass, file_list[i]);
      const url = this.generateImageUrl(media);
      url_list.push(url);
    }
    fireEvent(this, "files-url-generated", { url_list: url_list });
  }

  private generateImageUrl(media) {
    const url = generateImageThumbnailUrl(media.id, 512);

    const current_url = window.location.href;
    const url_object = new URL(current_url);

    const protocol = url_object.protocol;
    const domain = url_object.hostname;
    const port = url_object.port;

    return protocol + "//" + domain + ":" + port + url;
  }

  private _openFilePicker() {
    this._input?.click();
  }

  static get styles() {
    return [
      styles,
      css`
        :host {
          display: block;
        }
        .mdc-text-field--filled {
          height: auto;
          padding-top: 16px;
          cursor: pointer;
        }
        .mdc-text-field--filled.mdc-text-field--with-trailing-icon {
          padding-top: 28px;
        }
        .mdc-text-field:not(.mdc-text-field--disabled) .mdc-text-field__icon {
          color: var(--secondary-text-color);
        }
        .mdc-text-field--filled.mdc-text-field--with-trailing-icon .mdc-text-field__icon {
          align-self: flex-end;
        }
        .mdc-text-field__icon--leading {
          margin-bottom: 12px;
        }
        .mdc-text-field--filled .mdc-floating-label--float-above {
          transform: scale(0.75);
          top: 8px;
        }
        .mdc-text-field--filled .mdc-floating-label {
          left: 8px;
        }
        input.file {
          display: none;
        }
        label.mdc-field {
          cursor: pointer;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "file-upload": HaFileUpload;
  }
}
