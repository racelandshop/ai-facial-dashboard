import "@material/mwc-button/mwc-button";
import { mdiCheckboxMarkedCircle } from "@mdi/js";
import { mdiFaceRecognition, mdiClose } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import "../../../frontend-release/src/components/ha-dialog";
import "../../../frontend-release/src/components/ha-header-bar";
import "../file-upload";
import type { HassDialog } from "../../../frontend-release/src/dialogs/make-dialog-manager";
import { fireEvent } from "../../../frontend-release/src/common/dom/fire_event";
import type { HomeAssistant } from "../../../frontend-release/src/types";
import { aiPersonDialogParams } from "../../helpers/show-ai-dialog";
import { PersonInfo } from "../../types";
import { localize } from "../../localize/localize";
import { teachFaceInformation } from "../../websocket";

declare global {
  interface HASSDomEvents {
    "file-picked": { files: FileList };
  }
}

@customElement("upload-ai-facial-data-dialog")
export class HuiDialogAddAiFacialData
  extends LitElement
  implements HassDialog<aiPersonDialogParams>
{
  @property({ attribute: false }) protected hass!: HomeAssistant;

  @property() public url_list!: string[] | undefined;

  @property({ attribute: false })
  public personInfo!: PersonInfo;

  @property() public uploadErrorMessage!: string | undefined;

  @state() private _params?: aiPersonDialogParams;

  public async showDialog(params: aiPersonDialogParams): Promise<void> {
    this._params = params;
    this.personInfo = params.personInfo;
  }

  public closeDialog(): void {
    this._params = undefined;
    this.url_list = undefined;
    this.uploadErrorMessage = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <ha-dialog
        open
        scrimClickAction
        hideActions
        .heading=${localize("common.upload_facial_data")}
        @closed=${this.closeDialog}
      >
        <div class="header" slot="heading">
          <ha-svg-icon
            dialogAction="close"
            class="cancel-icon"
            slot="icon"
            .path=${mdiClose}
          ></ha-svg-icon>
          <ha-svg-icon class="header-icon" slot="icon" .path=${mdiFaceRecognition}></ha-svg-icon>
        </div>
        <div class="text">
        ${
          this.url_list === undefined && this.uploadErrorMessage === undefined
            ? html`<p class="big-text">${localize("dialog_text.upload_message")}</p>`
            : this.url_list !== undefined
            ? html`<p class="big-text">
                ${localize(
                  "dialog_text.upload_photo_n",
                  "{n_photos}",
                  String(this.url_list.length)
                )}
              </p>`
            : html`<p class="error-text-small">${this.uploadErrorMessage}</p>`
        }
          <p class="small-text">${localize("dialog_text.upload_message_note")}</p>
          </p>
        </div>
        <div class="options">
        <file-upload class="button-upload"
          .hass=${this.hass}
          @files-url-generated=${this._handleFilePicked}
          accept="image/png, image/jpeg, image/gif"
          >
        </file-upload>
          ${
            this.url_list === undefined
              ? html``
              : html` <mwc-button class="button-confirm" @click=${this._confirm}
                  ><ha-svg-icon
                    .path=${mdiCheckboxMarkedCircle}
                    class="confirm-icon"
                    slot="icon"
                  ></ha-svg-icon
                  >${localize("common.confirm")}</mwc-button
                >`
          }
        </div>
      </ha-dialog>
    `;
  }

  private async _handleFilePicked(ev) {
    this.url_list = ev.detail.url_list;
    this.uploadErrorMessage = undefined;
  }

  private async _confirm() {
    if (this.url_list != undefined) {
      const result = await teachFaceInformation(this.hass, this.personInfo?.name, this.url_list);
      if (result === true) {
        fireEvent(this, "update-ai-dashboard");
        this.closeDialog();
      } else {
        this.url_list = undefined;
        this.uploadErrorMessage = localize("error.teachFaceErrorMessage");
      }
    }
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        @media all and (max-width: 450px), all and (max-height: 500px) {
          /* overrule the ha-style-dialog max-height on small screens */
          ha-dialog {
            --mdc-dialog-max-height: 100%;
            height: 100%;
          }
        }
        @media all and (min-width: 800px) {
          ha-dialog {
            --mdc-dialog-min-width: 500px;
          }
        }
        @media all and (max-width: 450px), all and (max-height: 500px) {
          hui-entity-picker-table {
            height: calc(100vh - 158px);
          }
        }
        ha-dialog {
          --mdc-dialog-max-width: 500px;
          --dialog-content-padding: 2px 24px 20px 24px;
          --dialog-z-index: 5;
        }
        ha-header-bar {
          --mdc-theme-on-primary: var(--primary-text-color);
          --mdc-theme-primary: var(--mdc-theme-surface);
          flex-shrink: 0;
          border-bottom: 1px solid var(--mdc-dialog-scroll-divider-color, rgba(0, 0, 0, 0.12));
        }
        file-upload {
          padding: 10px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          border-radius: 30px;
          box-shadow: 0px 0px 5px 0px rgba(1, 1, 1, 0);
          --mdc-theme-primary: white;
          margin-bottom: 40px;
        }
        mwc-button {
          padding: 10px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          border-radius: 30px;
          cursor: pointer;
          box-shadow: 0px 0px 5px 0px rgba(1, 1, 1, 0);
          --mdc-theme-primary: white;
          margin-bottom: 40px;
        }
        .button-confirm {
          background-color: #4ba2ff;
          float: right;
        }
        .button-upload {
          float: left;
          background-color: #4ba2ff;
        }
        input.file {
          display: none;
        }
        label.mdc-field {
          cursor: pointer;
        }
        .header {
          height: 80px;
        }
        .cancel-icon {
          float: right;
          width: 40px;
          height: 40px;
          cursor: pointer;
          padding: 20px 20px 20px 20px;
        }
        .options {
          width: 100%;
        }
        .confirm-icon {
          width: 20px;
          height: 40px;
        }
        .header-icon {
          width: 60px;
          height: 60px;
          margin-top: 10%;
          margin-bottom: 10%;
          margin-left: 6%;
          color: #7b7b7b;
        }
        .text {
          margin-top: 10%;
          width: 100%;
          margin: 0px 0px 20px 0px;
        }
        .big-text {
          font-family: "Roboto";
          font-style: normal;
          font-weight: 500;
          font-size: 24px;
          line-height: 42px;
          color: #303033;
          margin: 10px;
        }
        .small-text {
          font-family: "Roboto";
          font-style: normal;
          font-weight: 400;
          font-size: 24px;
          line-height: 21px;
          color: gray;
          margin: 10px;
        }
        .error-text-small {
          margin-top: 10%;
          font-family: "Roboto";
          font-style: normal;
          font-weight: 400;
          font-size: 24px;
          line-height: 21px;
          color: red;
          text-align: justify;
          text-justify: inter-word;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "upload-camera-dialog": HuiDialogAddAiFacialData;
  }
}
