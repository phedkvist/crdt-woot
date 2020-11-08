import { Char } from './char';

export interface Site {
  siteId: string; // unique id for each site
  clock: number;
  sequence: Char[];
  operationPool: Char[];
}

interface VectorClock {
  siteId: string;
  clock: number;
}
