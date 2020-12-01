export interface Char {
  id: string;
  charId: CharId;
  value: string;
  visible: boolean;
  id_prev: string;
  id_next: string;
}

export interface CharId {
  siteId: string;
  clock: number;
}
