import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { styleMap } from "lit/directives/style-map";
import { fireEvent } from "../../frontend-release/src/common/dom/fire_event";
import { PersonInfo } from "../types";
import { classMap } from "lit/directives/class-map";
import { localize } from "../localize/localize";

@customElement("person-big-badge")
class PersonBigBadge extends LitElement {
  @property({ attribute: false })
  public person!: PersonInfo;

  protected showAiDialog(ev) {
    fireEvent(this, "update-person-info", { personInfo: this.person });
  }

  protected render(): TemplateResult {
    if (!this.person) {
      return html``;
    }

    const picture = this.person.picture;

    //TODO: Style with CSS the cursor
    if (picture) {
      return html`<div
          @click=${this.showAiDialog}
          style=${styleMap({ backgroundImage: `url(${picture})` })}
          class="picture"
        ></div>
        <paper-item-body class="entry-text"> ${this.person.name}</paper-item-body>
        <paper-item-body
          class="entry-text ${classMap({
            registered: this.person.registered_status === true,
            unregistered: this.person.registered_status === false,
          })}"
        >
          ${this.computeStatusString(this.person.registered_status)}
        </paper-item-body>`;
    }
    return html`<div @click=${this.showAiDialog} class="initials">${this.person.name}</div>`;
  }

  protected computeStatusString(registered_status: boolean): string {
    if (registered_status) {
      return localize("status.person_registered");
    }
    return localize("status.person_unregistered");
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: contents;
      }
      .picture {
        width: 200px;
        height: 200px;
        background-size: cover;
        border-radius: 50%;
      }
      .initials {
        width: 200px;
        height: 200px;
        background-size: cover;
        background-color: gray;
        border-radius: 50%;
        text-align: center;
        font-size: 250%;
      }
      .entry-text {
        font-size: 200%;
        margin-top: 10%;
        margin-right: 20%;
      }
      .entry-text.registered {
        font-size: 150%;
      }
      .entry-text.unregistered {
        font-size: 150%;
        color: blue;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "person-big-badge": PersonBigBadge;
  }
}
