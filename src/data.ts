import WString from './model';

export interface Site {
  siteId: string; // unique id for each site
  clock: number;
  sequence: WString;
  operationPool: Char[];
}

interface VectorClock {
  siteId: string;
  clock: number;
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
  Insert,
  Delete,
}

export interface Payload {
  char: Char;
  operation: Operation;
}
