import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { styleMap } from "lit/directives/style-map";
import { fireEvent } from "../../frontend-release/src/common/dom/fire_event";
import { PersonInfo } from "../types";

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

    if (picture) {
      return html`<div
        @click=${this.showAiDialog}
        style=${styleMap({ backgroundImage: `url(${picture})` })}
        class="picture"
      ></div>`;
    }
    return html`<div @click=${this.showAiDialog} class="initials">${this.person.name}</div>`;
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "erson-big-badge": PersonBigBadge;
  }
}
