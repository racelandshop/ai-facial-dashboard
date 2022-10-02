/* eslint-disable lit/binding-positions */
/* eslint-disable lit/no-template-arrow */
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators";
import { mdiClose, mdiPencil, mdiPlus } from "@mdi/js";
import { classMap } from "lit/directives/class-map";
import { ifDefined } from "lit/directives/if-defined";
import type { HassDialog } from "../../dialogs/make-dialog-manager";
import { fireEvent } from "../../common/dom/fire_event";
import type { HomeAssistant } from "../../types";
import "../../components/ha-dialog";
import "../../components/ha-header-bar";
import { ZonesDialogParams } from "./helpers/show-zones-dialog";
import type { Lovelace } from "./types";
import { LovelaceConfig, LovelaceViewConfig } from "../../data/lovelace";
// import type { LovelaceViewConfig } from "../../../../data/lovelace";
// import { haStyleDialog } from "../../resources/styles";
import { showEditLovelaceDialog } from "./editor/lovelace-editor/show-edit-lovelace-dialog";
import { navigate } from "../../common/navigate";
import {
  addSearchParam,
  // extractSearchParam,
} from "../../common/url/search-params";
import "../../components/ha-icon";
import "../../components/ha-icon-button-arrow-prev";
import { swapView } from "./editor/config-util";
import { showEditViewDialog } from "./editor/view-editor/show-edit-view-dialog";
import "../../components/ha-icon-button-arrow-next";
import "../../components/ha-tabtop";
// import { debounce } from "../../common/util/debounce";

declare global {
  // for fire event
  interface HASSDomEvents {
    "lovelace-root-changed": { lovelace: Lovelace };
  }
}

@customElement("zones-dialog")
export class ZonesDialog
  extends LitElement
  implements HassDialog<ZonesDialogParams>
{
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lovelace?: Lovelace;

  @property({ type: Boolean }) public narrow = false;

  @property({ type: Object }) public route?: { path: string; prefix: string };

  @state() private _curView?: number | "hass-unused-entities";

  @state() private _params?: ZonesDialogParams;

  public async showDialog(params: ZonesDialogParams): Promise<void> {
    this._params = params;
    this.lovelace = params.lovelace;
    if (params.viewIndex) this._curView = params.viewIndex;
    else {
      this._curView = 0;
    }
    if (params.route) this.route = params.route;
    fireEvent(this, "zones-opened", {
      zonesOpened: true,
    });
  }

  public closeDialog(): boolean {
    this._params = undefined;
    this._curView = 0;
    this.route = undefined;

    fireEvent(this, "dialog-closed", { dialog: this.localName });
    fireEvent(this, "zones-opened", {
      zonesOpened: false,
    });
    return true;
  }

  private get config(): LovelaceConfig {
    return this.lovelace!.config;
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    window.addEventListener("lovelace-root-changed", (ev) => {
      this.lovelace = ev.detail.lovelace;
    });
    // setTimeout(() => {
    //   this.requestUpdate();
    // }, 32);
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }

    return html`
      <ha-dialog
        open
        @closed=${this.closeDialog}
        .heading=${this.hass!.localize(
          "ui.panel.lovelace.editor.edit_lovelace.header"
        )}
      >
        <div slot="heading" class="heading">
          <ha-header-bar>
            <div
              slot="title"
              class="main-title"
              .title=${this.hass!.localize("ui.panel.lovelace.menu.zones")}
            >
              ${this.hass!.localize("ui.panel.lovelace.menu.zones")}
            </div>
            <ha-icon-button
              slot="navigationIcon"
              dialogAction="cancel"
              .label=${this.hass!.localize(
                "ui.dialogs.more_info_control.dismiss"
              )}
              .path=${mdiClose}
            ></ha-icon-button>
            ${this.hass!.user?.is_admin
              ? html`
                  ${this._editMode
                    ? html`
                        <mwc-button
                          outlined
                          slot="actionItems"
                          class="exit-edit-mode"
                          .label=${this.hass!.localize(
                            "ui.panel.lovelace.menu.exit_edit_mode"
                          )}
                          @click=${this._editModeDisable}
                        ></mwc-button>
                      `
                    : html`
                        <ha-tabtop
                          slot="actionItems"
                          style="padding: 0; width: 64px; margin-right: 16px;"
                          .hass=${this.hass}
                          .active=${true}
                          .narrow=${true}
                          .name=${this.hass!.localize(
                            "ui.panel.lovelace.menu.configure_ui"
                          )}
                          @click=${this._handleEnableEditMode}
                        >
                          <ha-svg-icon
                            style="margin-bottom: 5px;margin-top: 7px; color: var(--accent-color);"
                            slot="icon"
                            .path=${mdiPencil}
                          ></ha-svg-icon>
                        </ha-tabtop>
                      `}
                `
              : html``}
            <!-- ${this._editMode
              ? html`<ha-icon-button
                  slot="actionItems"
                  .label=${this.hass!.localize(
                    "ui.panel.lovelace.menu.exit_edit_mode"
                  )}
                  .path=${mdiPencil}
                  @click=${this._editModeDisable}
                ></ha-icon-button> `
              : html`<ha-icon-button
                  slot="actionItems"
                  .label=${this.hass!.localize(
                    "ui.panel.lovelace.editor.menu.open"
                  )}
                  .path=${mdiPencil}
                  @click=${this._handleEnableEditMode}
                ></ha-icon-button>`} -->
          </ha-header-bar>
        </div>
        <div class="contentFather">
          <div class="content">
            <div main-title id="mainTitle">
              <h1>
                ${this.config.title ||
                this.hass!.localize("ui.panel.lovelace.editor.header")}
              </h1>
              ${this._editMode
                ? html`
                    <ha-icon-button
                      .label=${this.hass!.localize(
                        "ui.panel.lovelace.editor.edit_lovelace.edit_title"
                      )}
                      .path=${mdiPencil}
                      class="edit-icon"
                      @click=${this._editLovelace}
                    ></ha-icon-button>
                  `
                : ""}
            </div>
            <div class="dialogzones">
              ${this.lovelace!.config.views.length > 0
                ? html`
                    ${this.lovelace!.config.views.map(
                      (view, index) => html`
                        <div class="dialogViewZones">
                          <ha-card
                            class="dialogViews ${classMap({
                              vselected: index === this._curView,
                              vnotselected: index !== this._curView,
                              noclick: this._editMode,
                            })}"
                            @click=${() => {
                              this._handleViewSelected(index);
                            }}
                          >
                            ${view.icon
                              ? html`
                                  <ha-icon
                                    style="height:50%;"
                                    title=${ifDefined(view.title)}
                                    .icon=${view.icon}
                                  ></ha-icon>
                                `
                              : ""}
                            ${view.title
                              ? html`<p>${view.title}</p>`
                              : html`<p>
                                    ${this.hass!.localize(
                                      "ui.panel.lovelace.menu.zones"
                                    )}
                                  </p>
                                  <div id="explanation">
                                    ${this.hass!.localize(
                                      "ui.panel.lovelace.menu.zones_explanation"
                                    )}
                                  </div>`}
                          </ha-card>
                          ${this._editMode
                            ? html`
                                <div class="dialogZoneOptions">
                                  <ha-icon-button-arrow-prev
                                    .hass=${this.hass}
                                    .label=${this.hass!.localize(
                                      "ui.panel.lovelace.editor.edit_view.move_left"
                                    )}
                                    @click=${() => {
                                      this._moveViewLeft(index);
                                    }}
                                    ?disabled=${index === 0}
                                  ></ha-icon-button-arrow-prev>
                                  <ha-svg-icon
                                    style="cursor: pointer;"
                                    title=${this.hass!.localize(
                                      "ui.panel.lovelace.editor.edit_view.edit"
                                    )}
                                    .path=${mdiPencil}
                                    @click=${() => {
                                      this._editView(index);
                                    }}
                                  ></ha-svg-icon>
                                  <ha-icon-button-arrow-next
                                    .hass=${this.hass}
                                    .label=${this.hass!.localize(
                                      "ui.panel.lovelace.editor.edit_view.move_right"
                                    )}
                                    @click=${() => {
                                      this._moveViewRight(index);
                                    }}
                                    ?disabled=${index + 1 ===
                                    this.lovelace!.config.views.length}
                                  ></ha-icon-button-arrow-next>
                                </div>
                              `
                            : ""}
                        </div>
                      `
                    )}
                    ${this._editMode
                      ? html`
                          <ha-card
                            class="dialogViews ${classMap({
                              vselected:
                                this.lovelace!.config.views.length ===
                                this._curView,
                              vnotselected:
                                this.lovelace!.config.views.length !==
                                this._curView,
                            })}"
                            @click=${() => {
                              // this._curView =
                              //   this.lovelace!.config.views.length;
                              // const addindex =
                              //   this.lovelace!.config.views.length;
                              // this._curView = addindex;
                              this._addView();
                            }}
                          >
                            <ha-svg-icon
                              style="height:50%;width:50%"
                              .path=${mdiPlus}
                            ></ha-svg-icon>
                          </ha-card>
                        `
                      : ""}
                  `
                : html`<ha-card
                    class="dialogViews ${classMap({
                      vselected:
                        this.lovelace!.config.views.length === this._curView,
                      vnotselected:
                        this.lovelace!.config.views.length !== this._curView,
                    })}"
                    @click=${() => {
                      // this._curView =
                      //   this.lovelace!.config.views.length;
                      // const addindex =
                      //   this.lovelace!.config.views.length;
                      // this._curView = addindex;
                      this._addView();
                    }}
                  >
                    <ha-svg-icon
                      style="height:50%;width:50%"
                      .path=${mdiPlus}
                    ></ha-svg-icon>
                  </ha-card>`}
            </div>
          </div>
        </div>
      </ha-dialog>
    `;
  }

  private get _editMode() {
    return this.lovelace!.editMode;
  }

  private _handleEnableEditMode(): void {
    this.lovelace!.setEditMode(true);
  }

  private _editModeDisable(): void {
    this.lovelace!.setEditMode(false);
  }

  // private _cancel(ev?: Event) {
  //   console.log("cancel");
  //   if (ev) {
  //     ev.stopPropagation();
  //   }
  //   this.closeDialog();
  // }

  // private _ignoreKeydown(ev: KeyboardEvent) {
  //   ev.stopPropagation();
  // }

  private _editLovelace() {
    showEditLovelaceDialog(this, this.lovelace!);
  }

  private _handleViewSelected(viewIndex: number) {
    if (viewIndex !== this._curView) {
      const path = this.config.views[viewIndex].path || viewIndex;
      this._navigateToView(path);
    }
    this._curView = viewIndex;

    setTimeout(() => {
      // this.requestUpdate();
      this.closeDialog();
    }, 250);
    // scrollToTarget(this, this._layout.header.scrollTarget);
  }

  private _navigateToView(path: string | number, replace?: boolean) {
    if (!this.lovelace!.editMode) {
      navigate(`${this.route!.prefix}/${path}${location.search}`, { replace });
      return;
    }
    navigate(`${this.route!.prefix}/${path}?${addSearchParam({ edit: "1" })}`, {
      replace,
    });
  }

  private _moveViewLeft(i: number) {
    // ev.stopPropagation();
    if (i === 0) {
      return;
    }
    const lovelace = this.lovelace!;
    const oldIndex = i;
    const newIndex = i - 1;
    // console.log("left", oldIndex, newIndex, lovelace);
    // this._curView = newIndex;
    lovelace.saveConfig(swapView(lovelace.config, oldIndex, newIndex));
    if (oldIndex === this._curView) {
      const path = this.config.views[newIndex].path || newIndex;
      this._navigateToView(path);
      this._curView = newIndex;
    } else if (newIndex === this._curView) {
      const path = this.config.views[oldIndex].path || oldIndex;
      this._navigateToView(path);
      this._curView = oldIndex;
    }
  }

  private _moveViewRight(i: number) {
    // ev.stopPropagation();
    if (i + 1 === this.lovelace!.config.views.length) {
      return;
    }
    const lovelace = this.lovelace!;
    const oldIndex = i;
    const newIndex = i + 1;
    // this._curView = newIndex;
    lovelace.saveConfig(swapView(lovelace.config, oldIndex, newIndex));
    if (oldIndex === this._curView) {
      const path = this.config.views[newIndex].path || newIndex;
      this._navigateToView(path);
      this._curView = newIndex;
    } else if (newIndex === this._curView) {
      const path = this.config.views[oldIndex].path || oldIndex;
      this._navigateToView(path);
      this._curView = oldIndex;
    }
  }

  private _editView(i: number) {
    console.log("LOCELACE", this.lovelace);
    showEditViewDialog(this, {
      lovelace: this.lovelace!,
      viewIndex: i,
    });
  }

  private _addView() {
    showEditViewDialog(this, {
      lovelace: this.lovelace!,
      saveCallback: (viewIndex: number, viewConfig: LovelaceViewConfig) => {
        const path = viewConfig.path || viewIndex;
        this._navigateToView(path);
      },
    });
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        /* @media all and (max-width: 450px), all and (max-height: 500px) {
          ha-dialog {
            --mdc-dialog-max-height: 100%;
            --mdc-dialog-min-width: 100vw;
            --mdc-dialog-min-height: 100vh;
            height: 100%;
          }
        }
        @media all and (min-width: 1000px) {
          ha-dialog {
            --mdc-dialog-max-height: 100%;
            --mdc-dialog-min-width: 100vw;
            --mdc-dialog-min-height: 100vh;
            height: 100%;
          }
        } */

        ha-dialog {
          --mdc-dialog-min-width: calc(
            100vw - env(safe-area-inset-right) - env(safe-area-inset-left)
          );
          --mdc-dialog-max-width: calc(
            100vw - env(safe-area-inset-right) - env(safe-area-inset-left)
          );
          --mdc-dialog-min-height: 100%;
          --mdc-dialog-max-height: 100%;
          --vertial-align-dialog: flex-end;
          --ha-dialog-border-radius: 0px;
        }
        ha-header-bar {
          --mdc-theme-on-primary: var(--primary-text-color);
          --mdc-theme-primary: var(--mdc-theme-surface);
          flex-shrink: 0;
          border-bottom: 1px solid
            var(--mdc-dialog-scroll-divider-color, rgba(0, 0, 0, 0.12));
        }

        .cancel {
          cursor: pointer;
          padding: 20px 20px 20px 20px;
        }

        .vselected {
          box-shadow: 0 0 10px var(--mdc-theme-secondary, #018786),
            0 0 10px var(--mdc-theme-secondary, #018786);
        }

        .vnotselected {
          /* border: solid 1px red; */
        }

        .dialogzones {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          grid-gap: 15px;
          width: 100%;
        }

        .dialogViews {
          background: var(--header-card-picker-background);
          aspect-ratio: 1;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4% 0;
          font-size: 1rem;
          /* height: 100%; */
          box-sizing: border-box;
          justify-content: space-evenly;
          position: relative;
          overflow: hidden;
          border-radius: 1.5rem;
        }

        #mainTitle {
          display: flex;
          align-content: center;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 3%;
        }

        .dialogZoneOptions {
          display: flex;
          align-content: center;
          justify-content: space-around;
          align-items: center;
          margin-top: 10px;
          border-radius: 1.5rem;
          background: var(--header-card-picker-background);
          /* border: solid 1px red; */
        }

        .noclick {
          /* pointer-events: none; */
        }

        .content {
          width: 100%;
          max-width: 1000px;
        }

        .contentFather {
          display: flex;
          width: 85vw;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          align-content: space-around;
        }

        ha-icon-button-arrow-prev,
        ha-icon-button-arrow-next,
        ha-icon-button,
        ha-svg-icon {
          color: var(--primary-text-color);
        }

        ha-icon {
          --mdc-icon-size: 100%;
          height: 40%;
          width: 100%;
        }

        p,
        h1 {
          font-size: 1.8rem;
          font-weight: 450;
          color: var(--primary-text-color);
          margin: 10px;
        }

        .exit-edit-mode {
          --mdc-theme-primary: var(--app-header-edit-text-color, #fff);
          --mdc-button-outline-color: var(--app-header-edit-text-color, #fff);
          --mdc-typography-button-font-size: 14px;
          padding: 0;
          width: 64px;
          margin-right: 16px;
          /* margin-top: 10px; */
        }
        #explanation {
          font-size: 12px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "zones-dialog": ZonesDialog;
  }
}
