import { Site, Char, Payload, Operation } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as model from './model';

export default class Controller {
  site: Site;
  pool: Payload[];

  constructor(start: Char, end: Char, siteId: string) {
    this.site = {
      siteId,
      clock: 0,
      sequence: [start, end],
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
      if (model.isExecutable(char, operation, sequence)) {
        if (operation === Operation.Insert) {
          const newSequence = model.integrateIns(char, sequence);
          this.site = { ...this.site, sequence: newSequence };
        } else if (operation === Operation.Delete) {
          const newSequence = model.deleteChar(char, sequence);
          this.site = { ...this.site, sequence: newSequence };
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

    const newChar = model.prepareInsert(
      position,
      alpha,
      siteId,
      newClock,
      sequence
    );
    const payload = {
      char: { ...newChar },
      operation: Operation.Insert,
      id: uuidv4(),
    };
    const newSequence = model.insert(newChar, sequence);
    // TODO: Broadcast newChar
    this.site = { ...this.site, clock: newClock, sequence: newSequence };
    return payload;
  }

  reception(payload: Payload) {
    this.pool.push(payload);
  }

  deleteChar(char: Char) {
    const newSequence = model.deleteChar(char, this.site.sequence);
    this.site = { ...this.site, sequence: newSequence };
  }

  getState() {
    return model.getState(this.site.sequence);
  }
}
