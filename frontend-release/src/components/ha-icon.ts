import "@polymer/iron-icon/iron-icon";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import { debounce } from "../common/util/debounce";
import { CustomIcon, customIcons } from "../data/custom_icons";
import {
  checkCacheVersion,
  Chunks,
  findIconChunk,
  getIcon,
  Icons,
  MDI_PREFIXES,
  writeCache,
} from "../data/iconsets";
import "./ha-svg-icon";

interface DeprecatedIcon {
  [key: string]: {
    removeIn: string;
    newName?: string;
  };
}

const mdiDeprecatedIcons: DeprecatedIcon = {};

const traducoes = {
  conta: "account",
  alerta: "alert",
  "círculo de alerta": "alert-circle",
  altímetro: "altimeter",
  altimetro: "altimeter",
  "apple safari": "apple-safari",
  apps: "apps",
  "seta inferior esquerdo": "arrow-bottom-left",
  "seta para baixo": "arrow-down",
  "seta para a esquerda": "arrow-left",
  "seta para a direita": "arrow-right",
  "seta superior direita": "arrow-top-right",
  "seta para cima": "arrow-up",
  "Auto-renovação": "autorenew",
  bateria: "battery",
  "bateria-": "battery-",
  "alerta de bateria": "battery-alert",
  "contorno da bateria": "battery-outline",
  "bateria desconhecida": "battery-unknown",
  sino: "bell",
  "contorno de sino": "bell-outline",
  "bell-plus": "bell-plus",
  campainha: "bell-ring",
  câmara: "camera",
  camara: "camera",
  computador: "laptop",
  "sono de sino": "bell-sleep",
  "marca páginas": "bookmark",
  "brilho-": "brightness-",
  "brilho-5": "brightness-5",
  vassoura: "broom",
  calendário: "calendar",
  "relógio-calendário": "calendar-clock",
  cancelar: "cancel",
  elenco: "cast",
  "ligado ao elenco": "cast-connected",
  "linha do gráfico": "chart-line",
  verifica: "check",
  "círculo marcado com caixa de seleção": "checkbox-marked-circle",
  "verificar contorno do círculo": "check-circle-outline",
  "chevron-down": "chevron-down",
  "divisa esquerda": "chevron-left",
  "chevron-right": "chevron-right",
  "chevron-up": "chevron-up",
  relógio: "clock",
  "relógio rápido": "clock-fast",
  fechar: "close",
  "upload na nuvem": "cloud-upload",
  "tags de código": "code-tags",
  engrenagem: "cog",
  "comentar-alerta": "comment-alert",
  "salvar conteúdo": "content-save",
  "recorte-retrato": "crop-portrait",
  "ponteiro do cursor": "cursor-pointer",
  excluir: "delete",
  "Porta fechada": "door-closed",
  "porta aberta": "door-open",
  "pontos-horizontal": "dots-horizontal",
  "pontos-vertical": "dots-vertical",
  desenhando: "drawing",
  emoticon: "emoticon",
  "emoticon morto": "emoticon-dead",
  "emoticon-cocô": "emoticon-poop",
  "sair para o aplicativo": "exit-to-app",
  olho: "eye",
  "olho fechado": "eye-off",
  ventoinha: "fan",
  "arquivo-documento": "file-document",
  "arquivo-múltiplo": "file-multiple",
  "arquivo-palavra-caixa": "file-word-box",
  "arquivo-xml": "file-xml",
  "variante de filtro": "filter-variant",
  fogo: "fire",
  luz: "flash",
  eletricidade: "flash",
  "Flash desligado": "flash-off",
  flor: "flower",
  "format-list-bulleted": "format-list-bulleted",
  garagem: "garage",
  "garagem aberta": "garage-open",
  medidor: "gauge",
  "google-circles-Communities": "google-circles-communities",
  "google-pages": "google-pages",
  martelo: "hammer",
  "círculo de ajuda": "help-circle",
  casa: "home",
  "assistente de casa": "home-assistant",
  "automação residencial": "home-automation",
  "marcador de mapa de casa": "home-map-marker",
  "esboço de casa": "home-outline",
  "variante doméstica": "home-variant",
  "imagem-filtro-centro-foco": "image-filter-center-focus",
  "frames de filtro de imagem": "image-filter-frames",
  "esboço de informação": "information-outline",
  folha: "leaf",
  lâmpada: "lightbulb",
  lampada: "lightbulb",
  ligação: "link",
  trancar: "lock",
  "fechadura aberta": "lock-open",
  "variante de login": "login-variant",
  "caixa de correio": "mailbox",
  "marcador de mapa": "map-marker",
  cardápio: "menu",
  "menu para baixo": "menu-down",
  "menu-up": "menu-up",
  microfone: "microphone",
  "Nota musical": "music-note",
  "música-nota-off": "music-note-off",
  natureza: "nature",
  "notificação-limpar-tudo": "notification-clear-all",
  "aberto em novo": "open-in-new",
  "ícone-original": "original-icon",
  paleta: "palette",
  pausa: "pause",
  lápis: "pencil",
  "lápis desligado": "pencil-off",
  começar: "play",
  "reproduzir lista de reprodução": "playlist-play",
  "começar pausar": "play-pause",
  mais: "plus",
  "círculo positivo": "plus-circle",
  "caixa de votação": "poll-box",
  potência: "power",
  tomada: "power-plug",
  "power-plug-off": "power-plug-off",
  "poder dormir": "power-sleep",
  "caixa de rádio em branco": "radiobox-blank",
  "torre de rádio": "radio-tower",
  "raio-vértice": "ray-vertex",
  refrescar: "refresh",
  comando: "remote",
  "robô-vácuo": "robot-vacuum",
  "vire à esquerda": "rotate-left",
  "vire à direita": "rotate-right",
  corre: "run",
  segurança: "security",
  mandar: "send",
  "rede de servidor": "server-network",
  "servidor-rede-desligado": "server-network-off",
  definições: "settings",
  "verificação de escudo": "shield-check",
  "escudo doméstico": "shield-home",
  "trava de proteção": "shield-lock",
  "contorno de escudo": "shield-outline",
  "pular próximo": "skip-next",
  "pular anterior": "skip-previous",
  dormir: "sleep",
  "floco de neve": "snowflake",
  quadrado: "square",
  "contorno quadrado": "square-outline",
  pare: "stop",
  "variante-alvo": "target-variant",
  televisão: "television",
  televisao: "television",
  "caixa de televisão": "television-box",
  "desligado da televisão": "television-off",
  "caixa de texto": "textbox",
  "texto para voz": "text-to-speech",
  termômetro: "thermometer",
  termometro: "thermometer",
  termostato: "thermostat",
  cronômetro: "timer",
  cronometro: "timer",
  "temporizador off": "timer-off",
  "areia do cronômetro": "timer-sand",
  "tooltip-account": "tooltip-account",
  desfazer: "undo",
  "ícone do usuário": "user-icon",
  vibrar: "vibrate",
  vídeo: "video",
  video: "video",
  projetor: "video",
  "painel de visualização": "view-dashboard",
  "volume alto": "volume-high",
  "volume médio": "volume-medium",
  "volume-menos": "volume-minus",
  "volume desligado": "volume-off",
  "volume mais": "volume-plus",
  andar: "walk",
  agua: "water",
  água: "water",
  "sem água": "water-off",
  "por cento de água": "water-percent",
  "tempo nublado": "weather-cloudy",
  "névoa do tempo": "weather-fog",
  granizo: "weather-hail",
  "relâmpago do tempo": "weather-lightning",
  "tempo-relâmpago-chuvoso": "weather-lightning-rainy",
  "clima noite": "weather-night",
  "tempo parcialmente nublado": "weather-partlycloudy",
  "verter o tempo": "weather-pouring",
  "tempo chuvoso": "weather-rainy",
  nevado: "weather-snowy",
  "tempo nevado-chuvoso": "weather-snowy-rainy",
  "tempo ensolarado": "weather-sunny",
  "vento forte": "weather-windy",
  "variante do clima ventoso": "weather-windy-variant",
  "balanço de branco ensolarado": "white-balance-sunny",
  "janela fechada": "window-closed",
  "janela aberta": "window-open",
  "onda z": "z-wave",
};

const chunks: Chunks = {};

// Supervisor doesn't use icons, and should not update/downgrade the icon DB.
if (!__SUPERVISOR__) {
  checkCacheVersion();
}

const debouncedWriteCache = debounce(() => writeCache(chunks), 2000);

const cachedIcons: Record<string, string> = {};

@customElement("ha-icon")
export class HaIcon extends LitElement {
  @property() public icon?: string;

  @state() private _path?: string;

  @state() private _viewBox?: string;

  @state() private _legacy = false;

  public willUpdate(changedProps: PropertyValues) {
    super.willUpdate(changedProps);
    if (changedProps.has("icon")) {
      this._path = undefined;
      this._viewBox = undefined;
      this._loadIcon();
    }
  }

  protected render(): TemplateResult {
    if (!this.icon) {
      return html``;
    }
    if (this._legacy) {
      return html`<iron-icon .icon=${this.icon}></iron-icon>`;
    }
    return html`<ha-svg-icon
      .path=${this._path}
      .viewBox=${this._viewBox}
    ></ha-svg-icon>`;
  }

  private async _loadIcon() {
    if (!this.icon) {
      return;
    }
    const requestedIcon = this.icon;
    // const [iconPrefix, origIconName] = this.icon.split(":", 2);

    let iconPrefix: string;
    let origIconName: string;
    if (this.icon.split(":", 2).length > 1) {
      [iconPrefix, origIconName] = this.icon.split(":", 2);
    } else {

      if (this.icon in traducoes) {
        origIconName = traducoes[this.icon];
      } else {
        origIconName = this.icon;
      }

      iconPrefix = "hass";
    }

    let iconName = origIconName;

    if (!iconPrefix || !iconName) {
      return;
    }

    if (!MDI_PREFIXES.includes(iconPrefix)) {
      if (iconPrefix in customIcons) {
        const customIcon = customIcons[iconPrefix];
        if (customIcon && typeof customIcon.getIcon === "function") {
          this._setCustomPath(customIcon.getIcon(iconName), requestedIcon);
        }
        return;
      }
      this._legacy = true;
      return;
    }

    this._legacy = false;

    if (iconName in mdiDeprecatedIcons) {
      const deprecatedIcon = mdiDeprecatedIcons[iconName];
      let message: string;

      if (deprecatedIcon.newName) {
        message = `Icon ${iconPrefix}:${iconName} was renamed to ${iconPrefix}:${deprecatedIcon.newName}, please change your config, it will be removed in version ${deprecatedIcon.removeIn}.`;
        iconName = deprecatedIcon.newName!;
      } else {
        message = `Icon ${iconPrefix}:${iconName} was removed from MDI, please replace this icon with an other icon in your config, it will be removed in version ${deprecatedIcon.removeIn}.`;
      }
      // eslint-disable-next-line no-console
      console.warn(message);
      fireEvent(this, "write_log", {
        level: "warning",
        message,
      });
    }

    if (iconName in cachedIcons) {
      this._path = cachedIcons[iconName];
      return;
    }

    let databaseIcon: string | undefined;
    try {
      databaseIcon = await getIcon(iconName);
    } catch (_err) {
      // Firefox in private mode doesn't support IDB
      // iOS Safari sometimes doesn't open the DB
      databaseIcon = undefined;
    }

    if (databaseIcon) {
      if (this.icon === requestedIcon) {
        this._path = databaseIcon;
      }
      cachedIcons[iconName] = databaseIcon;
      return;
    }
    const chunk = findIconChunk(iconName);

    if (chunk in chunks) {
      this._setPath(chunks[chunk], iconName, requestedIcon);
      return;
    }

    const iconPromise = fetch(`/static/mdi/${chunk}.json`).then((response) =>
      response.json()
    );
    chunks[chunk] = iconPromise;
    this._setPath(iconPromise, iconName, requestedIcon);
    debouncedWriteCache();
  }

  private async _setCustomPath(
    promise: Promise<CustomIcon>,
    requestedIcon: string
  ) {
    const icon = await promise;
    if (this.icon !== requestedIcon) {
      return;
    }
    this._path = icon.path;
    this._viewBox = icon.viewBox;
  }

  private async _setPath(
    promise: Promise<Icons>,
    iconName: string,
    requestedIcon: string
  ) {
    const iconPack = await promise;
    if (this.icon === requestedIcon) {
      this._path = iconPack[iconName];
    }
    cachedIcons[iconName] = iconPack[iconName];
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        fill: currentcolor;
      }
    `;
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "ha-icon": HaIcon;
  }
}
