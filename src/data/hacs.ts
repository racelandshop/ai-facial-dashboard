export interface Hacs {
  language: string;
  updates: any[];
  resources: any[];
  removed: any[];
  sections: any;
  localize(string: string, replace?: Record<string, any>): string;
}
