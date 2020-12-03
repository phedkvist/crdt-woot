import { Site, Char, Payload } from './data';
import { v4 as uuidv4 } from 'uuid';
import WString from './model';

export default class Main {
  site: Site;
  pool: Payload[];

  constructor(start: Char, end: Char) {
    this.site = {
      siteId: uuidv4(),
      clock: 0,
      sequence: new WString(start, end),
      operationPool: [],
    };
    this.pool = [];
  }

  generateIns(position: number, alpha: string) {
    const { sequence, clock, siteId } = this.site;
    const newClock = this.site.clock + 1;

    const newChar = sequence.prepareInsert(position, alpha, siteId, newClock);
    sequence.insert(newChar);
    // TODO: Broadcast newChar
    this.site = { ...this.site, clock: newClock };
  }

  reception(payload: Payload) {
    this.pool.push(payload);
  }
}
