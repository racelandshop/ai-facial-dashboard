import { html, TemplateResult } from "lit";
import { customElement } from "lit/decorators";
import {
  any,
  array,
  assert,
  assign,
  boolean,
  // number,
  object,
  optional,
  string,
} from "superstruct";
import { fireEvent } from "../../../../common/dom/fire_event";
import type { HaFormSchema } from "../../../../components/ha-form/types";
import type { GridCardConfig } from "../../cards/types";
import { baseLovelaceCardConfig } from "../structs/base-card-struct";
import { HuiStackCardEditor } from "./hui-stack-card-editor";

const cardConfigStruct = assign(
  baseLovelaceCardConfig,
  object({
    cards: array(any()),
    title: optional(string()),
    square: optional(boolean()),
    columns: optional(string()),
  })
);

@customElement("hui-grid-card-editor")
export class HuiGridCardEditor extends HuiStackCardEditor {
  public setConfig(config: Readonly<GridCardConfig>): void {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const SCHEMA: HaFormSchema[] = [
      {
        type: "grid",
        name: "",
        schema: [
          {
            name: "columns",
            selector: {
              select: {
                options: [
                  {
                    value: "1",
                    label: this.hass!.localize(
                      `ui.panel.lovelace.editor.card.grid.big`
                    ),
                  },
                  {
                    value: "2",
                    label: this.hass!.localize(
                      `ui.panel.lovelace.editor.card.grid.medium`
                    ),
                  },
                  {
                    value: "3",
                    label: this.hass!.localize(
                      `ui.panel.lovelace.editor.card.grid.small`
                    ),
                  },
                ],
              },
            },
          },
          { name: "title", selector: { text: {} } },
          // { name: "square", selector: { boolean: {} } },
        ],
      },
    ];

    const data = {
      title: "",
      square: true,
      columns: "3",
      ...this._config,
    };

    return html`
      <div class="formContainer" style="width:90%;margin-left:5%">
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${SCHEMA}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
      ${super.render()}
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    fireEvent(this, "config-changed", { config: ev.detail.value });
  }

  private _computeLabelCallback = (schema: HaFormSchema) =>
    this.hass!.localize(`ui.panel.lovelace.editor.card.grid.${schema.name}`);
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-grid-card-editor": HuiGridCardEditor;
  }
}
