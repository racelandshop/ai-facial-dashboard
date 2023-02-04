import "@material/mwc-button/mwc-button";
import { mdiDelete, mdiClose, mdiFaceRecognition, mdiCheckboxMarkedCircle } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HassDialog } from "../../../frontend-release/src/dialogs/make-dialog-manager";
import { fireEvent } from "../../../frontend-release/src/common/dom/fire_event";
import type { HomeAssistant } from "../../../frontend-release/src/types";
import "../../../frontend-release/src/components/ha-dialog";
import "../../../frontend-release/src/components/ha-header-bar";
import "../file-upload";
import { aiPersonDialogParams } from "../../helpers/show-ai-dialog";
import { PersonInfo } from "../../types";
import { deleteFaceInformation, teachFaceInformation } from "../../websocket";
import { localize } from "../../localize/localize";

@customElement("update-ai-facial-data-dialog")
export class HuiDeleteDialogAiFacialData
  extends LitElement
  implements HassDialog<aiPersonDialogParams>
{
  @property({ attribute: false }) protected hass!: HomeAssistant;

  @property({ attribute: false })
  public personInfo!: PersonInfo;

  @property() public url_list!: string[] | undefined;

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
        .heading=${localize("common.update_facial_data")}
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
          ${this.url_list === undefined && this.uploadErrorMessage === undefined
            ? html`<p class="big-text">${localize("common.update_facial_data")}</p>`
            : this.url_list !== undefined
            ? html`<p class="big-text">
                ${localize(
                  "dialog_text.upload_photo_n",
                  "{n_photos}",
                  String(this.url_list.length)
                )}
              </p>`
            : html`<p class="error-text-small">${this.uploadErrorMessage}</p>`}
          <p class="small-text">${localize("dialog_text.verify_action")}</p>
        </div>
        <div class="options">
          <file-upload
            class="button-upload"
            .hass=${this.hass}
            @files-url-generated=${this._handleFilePicked}
            accept="image/png, image/jpeg, image/gif"
          >
          </file-upload>
          ${this.url_list === undefined
            ? html`<mwc-button class="button-delete" @click=${this._delete}
                ><ha-svg-icon class="confirm-icon" slot="icon" .path=${mdiDelete}></ha-svg-icon
                >${localize("common.delete")}</mwc-button
              >`
            : html`<mwc-button class="button-confirm" @click=${this._confirm}
                ><ha-svg-icon
                  .path=${mdiCheckboxMarkedCircle}
                  class="confirm-icon"
                  slot="icon"
                ></ha-svg-icon
                >${localize("common.confirm")}</mwc-button
              >`}
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

  private async _delete(ev?: Event) {
    if (ev) {
      ev.stopPropagation();
    }

    const result = await deleteFaceInformation(this.hass, this.personInfo?.name);
    if (result === true) {
      fireEvent(this, "update-ai-dashboard");
      this.closeDialog();
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
          border-bottom: none;
        }
        .button-upload {
          background-color: #4ba2ff;
          float: left;
        }
        .button-confirm {
          background-color: #4ba2ff;
          float: right;
        }
        .button-delete {
          background-color: #4ba2ff;
          float: right;
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
        .cancel-icon {
          float: right;
          width: 40px;
          height: 40px;
          cursor: pointer;
          padding: 20px 20px 20px 20px;
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
    "delete-camera-dialog": HuiDeleteDialogAiFacialData;
  }
}
