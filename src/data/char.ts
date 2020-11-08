export interface Char {
  id: CharId;
  value: string;
  visible: boolean;
  id_prev: string;
  id_next: string;
}

interface CharId {
  siteId: string;
  clock: number;
}
