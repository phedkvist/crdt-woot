export interface Site {
  siteId: string; // unique id for each site
  clock: number;
  sequence: Char[];
  operationPool: Char[];
}

export interface Char {
  id: string;
  charId: CharId;
  value: string;
  visible: boolean;
  prevId: string;
  nextId: string;
}

export interface CharId {
  siteId: string;
  clock: number;
}

export enum Operation {
  Insert = 'insert',
  Delete = 'delete',
}

export interface Payload {
  char: Char;
  operation: Operation;
  id: string;
}
