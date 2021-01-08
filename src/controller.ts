import { Site, Char, Payload, Operation } from './types';
import { v4 as uuidv4 } from 'uuid';
import WString from './model';

export default class Controller {
  site: Site;
  pool: Payload[];

  constructor(start: Char, end: Char, siteId: string) {
    this.site = {
      siteId,
      clock: 0,
      sequence: new WString(start, end),
      operationPool: [],
    };
    this.pool = [];
  }

  main() {
    const {
      site: { sequence },
      pool,
    } = this;
    const integratedIds = [];

    pool.map(({ char, operation, id }) => {
      if (sequence.isExecutable(char, operation)) {
        if (operation === Operation.Insert) {
          sequence.integrateIns(char);
        } else if (operation === Operation.Delete) {
          sequence.delete(char);
        }
        integratedIds.push(id);
      } else {
      }
    });
    this.pool = this.pool.filter((p) => !integratedIds.includes(p.id));
  }

  generateDel(position: number) {
    // Find element at position and mark as deleted.
  }

  generateIns(position: number, alpha: string): Payload {
    const { sequence, clock, siteId } = this.site;
    const newClock = clock + 1;

    const newChar = sequence.prepareInsert(position, alpha, siteId, newClock);
    const payload = {
      char: { ...newChar },
      operation: Operation.Insert,
      id: uuidv4(),
    };
    sequence.insert(newChar);
    // TODO: Broadcast newChar
    this.site = { ...this.site, clock: newClock };
    return payload;
  }

  reception(payload: Payload) {
    this.pool.push(payload);
  }

  getState() {
    return this.site.sequence.getState();
  }
}
