import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
// import { classMap } from "lit/directives/class-map";

@customElement("button-recorder")
class BtnRecorder extends LitElement {
  @property({ type: Number })
  public startingSec = 0;

  @property({ type: Number })
  public startingMin = 0;

  @property({ type: Number })
  public startingHour = 0;

  @property({ type: Boolean })
  public checked = false;

  @state() sec = 0;

  @state() min = 0;

  @state() hour = 0;

  @state() timerID: NodeJS.Timeout;

  protected firstUpdated(): void {
    this.sec = this.startingSec;
    this.min = this.startingMin;
    this.hour = this.startingHour;

    const banner: HTMLElement | null =
      this.shadowRoot!.querySelector(".banner");
    banner!.style.width = "27px";

    const divtime: HTMLElement | null = this.shadowRoot!.getElementById("time");
    divtime!.style.display = "none";

    if (this.checked) {
      this.startTime();
    } else {
      this.resetTime();
    }
  }

  protected render(): TemplateResult {
    return html`
      <div class="component">
        <input
          @change=${this._checkboxChanged}
          .checked=${this.checked}
          type="checkbox"
          name="recorder"
          class="recorder"
          id="recorder"
        />
        <label for="recorder"></label>
      </div>
      <div class="banner">
        <div id="time">
          <p class="t" id="hour" data-time="hour">
            ${this.hour < 10 ? String(this.hour).padStart(2, "0") : this.hour}:
          </p>
          <p class="t" id="min" data-time="min">
            ${this.min < 10 ? String(this.min).padStart(2, "0") : this.min}:
          </p>
          <p class="t" id="sec" data-time="sec">
            ${this.sec < 10 ? String(this.sec).padStart(2, "0") : this.sec}
          </p>
        </div>
      </div>
    `;
  }

  private startTime(): void {
    const banner: HTMLElement | null =
      this.shadowRoot!.querySelector(".banner");
    banner!.style.width = "130px";

    setTimeout(() => {
      const divtime: HTMLElement | null =
        this.shadowRoot!.getElementById("time");
      divtime!.style.display = "flex";
    }, 200);

    this.timerID = setInterval(() => {
      this.sec++;
      if (this.sec >= 60) {
        this.sec = 0;
        this.min++;
      }
      if (this.min >= 60) {
        this.min = 0;
        this.hour++;
      }
    }, 1000);
  }

  private closeSeconds(): void {
    clearInterval(this.timerID);
  }

  private resetTime(): void {
    const banner: HTMLElement | null =
      this.shadowRoot!.querySelector(".banner");
    banner!.style.width = "27px";
    const divtime: HTMLElement | null = this.shadowRoot!.getElementById("time");
    divtime!.style.display = "none";
    this.closeSeconds();
    this.sec = 0;
    this.min = 0;
    this.hour = 0;
  }

  private _checkboxChanged(): void {
    this.checked = !this.checked;
    if (this.checked) {
      this.startTime();
    } else {
      this.resetTime();
    }
  }

  static get styles(): CSSResultGroup {
    return css`
      #time {
        display: flex;
        color: white;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .component {
        position: absolute;
        left: 20px;
        top: 15px;
      }

      .banner {
        background-color: rgba(30, 30, 30);
        opacity: 90%;
        height: 27px;
        width: 27px;
        border-radius: 1rem;
        transition: width 200ms;

        position: absolute;
        left: 17px;
        top: 12px;
      }

      #time {
        height: 27px;
        display: none;
        color: white;
        transition: 300ms ease-in all;
        align-items: center;
        justify-content: center;
      }
      #time p {
        font-size: 1em;
      }

      /* button-------------- */

      /* function */
      @keyframes ripple {
        from {
          transform: scale(1);
        }
        to {
          transform: scale(1.05);
        }
      }

      /* component recorder */
      .recorder {
        display: none;
      }

      .recorder + label {
        --size: 80%;
        --radius: 50%;
        border: 2px solid white;
        border-radius: var(--radius);
        cursor: pointer;
        display: inline-block;
        height: 17px;
        width: 17px;
        position: relative;
        z-index: 1;
      }

      .recorder + label:before {
        background-color: red;
        border-radius: var(--radius);
        bottom: 0;
        content: "";
        height: var(--size);
        left: 0;
        margin: auto;
        position: absolute;
        right: 0;
        top: 0;
        transition: all 0.25s cubic-bezier(1, 0, 0, 0.2);
        width: var(--size);
      }

      .recorder:checked + label {
        animation: 0.15s ripple 0.25s;
      }

      .recorder:checked + label:before {
        --size: 50%;
        --radius: 10%;
        transform: rotateZ(180deg);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "button-recorder": BtnRecorder;
  }
}
