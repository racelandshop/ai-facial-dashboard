import { LitElement, PropertyValues } from "lit";
import { property } from "lit/decorators";
import { Hacs } from "./data/hacs";
import { localize } from "./localize/localize";
import { ProvideHassLitMixin } from "../frontend-release/src/mixins/provide-hass-lit-mixin";

export class Dashboard extends ProvideHassLitMixin(LitElement) {
  //Left this file as is might be usefull for future use
  @property({ attribute: false }) public racelandDashoardData!: Hacs; //replace this with something else

  public connectedCallback() {
    super.connectedCallback();

    if (this.racelandDashoardData === undefined) {
      this.racelandDashoardData = {
        language: "en",
        updates: [],
        resources: [],
        removed: [],
        sections: [],
        localize: (string: string, replace?: Record<string, any>) =>
          localize(this.racelandDashoardData?.language || "en", string, replace),
      };
    }

    this.addEventListener("update-hacs", (e) =>
      this._updateHacs((e as any).detail as Partial<Hacs>)
    );
  }

  protected _updateHacs(obj: Partial<Hacs>) {
    let shouldUpdate = false;

    Object.keys(obj).forEach((key) => {
      if (JSON.stringify(this.racelandDashoardData[key]) !== JSON.stringify(obj[key])) {
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      this.racelandDashoardData = { ...this.racelandDashoardData, ...obj };
    }
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (this.racelandDashoardData.language && this.racelandDashoardData.configuration) {
      this.racelandDashoardData.sections = sectionsEnabled(
        this.racelandDashoardData.language,
        this.racelandDashoardData.configuration
      );
    }
  }
}
