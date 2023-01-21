import {
  HassEntityAttributeBase,
  HassEntityBase,
} from "home-assistant-js-websocket";

export const SUPPORT_SET_SPEED = 1;
export const SUPPORT_OSCILLATE = 2;
export const SUPPORT_DIRECTION = 4;
export const SUPPORT_PRESET_MODE = 8;

interface FanEntityAttributes extends HassEntityAttributeBase {
  min_mireds: number;
  max_mireds: number;
  friendly_name: string;
  preset_mode: any;
  percentage: string;
  oscillating: any;
}

export interface FanEntity extends HassEntityBase {
  attributes: FanEntityAttributes;
}
