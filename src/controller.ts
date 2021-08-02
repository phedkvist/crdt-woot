import { Site, Char, Payload, Operation } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as model from './model';

export default class Controller {
  site: Site;
  pool: Payload[];
  editorInsert?: (index: number, value: string) => void;
  editorDelete?: (index: number) => void;

  constructor(
    start: Char,
    end: Char,
    siteId: string,
    insert?: (index: number, value: string) => void,
    del?: (index: number) => void
  ) {
    this.site = {
      siteId,
      clock: 0,
      sequence: [start, end],
      operationPool: [],
    };
    this.editorInsert = insert;
    this.editorDelete = del;
    this.pool = [];
  }

  main(print: boolean = false) {
    let integratedIds: string[] = [];
    let sequence = this.site.sequence;
    let executablePayloads = this.pool.filter(({ char, operation }) =>
      model.isExecutable(char, operation, sequence)
    );

    // TODO: Should remove payloads that have already been applied.
    while (executablePayloads.length) {
      executablePayloads.map(({ char, operation, id }) => {
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
          const { sequence: newSequence, index } = model.integrateIns(
            char,
            prev,
            next,
            sequence
          );
          if (this.editorInsert) {
            this.editorInsert(index, char.value);
          }
          sequence = newSequence;
        } else if (operation === Operation.Delete) {
          const newSequence = model.deleteChar(char, sequence);
          if (this.editorDelete) {
            const visibleCharacters = sequence.filter((c) => c.visible);
            const index = visibleCharacters.findIndex((c) => c.id === char.id);
            if (index !== -1) {
              this.editorDelete(index);
            } else {
              throw Error('Could not find character to be deleted');
            }
          }
          // const index = model.position(char, sequence);
          sequence = newSequence;
        }
        integratedIds.push(id);
      });
      this.pool = this.pool.filter((p) => !integratedIds.includes(p.id));
      integratedIds = [];
      executablePayloads = this.pool.filter(({ char, operation }) =>
        model.isExecutable(char, operation, sequence)
      );
    }

    // TODO: These changes needs to be passed to the editor. Insert and delete operations.
    this.site.sequence = sequence;
  }

  generateDel(position: number, print: boolean = false): Payload {
    // Find element at position and mark as deleted.
    const adjustedPosition = position + 1; // account for first element that is invisible
    const { prevId } = model.position(adjustedPosition, this.site.sequence);
    const char = this.site.sequence.find((c) => c.id === prevId);
    if (print) {
      console.log(char);
    }
    this.deleteChar(char);
    return {
      operation: Operation.Delete,
      char,
      id: uuidv4(),
    };
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
