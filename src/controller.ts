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

  main(print: boolean = false) {
    const { pool } = this;
    const integratedIds = [];
    let sequence = this.site.sequence;

    pool.map(({ char, operation, id }) => {
      if (model.isExecutable(char, operation, sequence)) {
        if (operation === Operation.Insert) {
          const prev = sequence.find((c) => c.id === char.prevId);
          const next = sequence.find((c) => c.id === char.nextId);
          if (!prev || !next) {
            throw Error("Can't insert operation");
          }
          if (print) {
            console.log(prev);
            console.log(next);
          }
          const newSequence = model.integrateIns(char, prev, next, sequence);
          sequence = newSequence;
        } else if (operation === Operation.Delete) {
          const newSequence = model.deleteChar(char, sequence);
          sequence = newSequence;
        }
        integratedIds.push(id);
      } else {
        if (print) {
          console.log('NOT EXECUTABLE');
        }
      }
    });
    this.site.sequence = sequence;
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
