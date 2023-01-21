import { property } from "lit/decorators";
import { Lovelace } from "../panels/lovelace/types";
import { CardConfigGroup } from "../types";
import { BaseColumnLayout } from "./base-column-layout";

class HorizontalLayout extends BaseColumnLayout {
  @property({ attribute: false }) public lovelace?: Lovelace;

  isBreak(_card: any) {
    throw new Error("Method not implemented.");
  }

  getCardElement(_c: CardConfigGroup): any {
    throw new Error("Method not implemented.");
  }

  async _placeColumnCards(cols: Array<Node>, cards: CardConfigGroup[]) {
    let i = 0;
    for (const c of cards) {
      i += 1;
      if (c.config.view_layout?.column) i = c.config.view_layout.column;
      const col = cols[(i - 1) % cols.length];
      col.appendChild(this.getCardElement(c));
      if (this.isBreak(c.card)) {
        i = 0;
        if (!this.lovelace?.editMode) {
          col.removeChild(c.card);
        }
      }
    }
  }
}

customElements.define("horizontal-layout", HorizontalLayout);

declare global {
  interface HTMLElementTagNameMap {
    "horizontal-layout": HorizontalLayout;
  }
}
