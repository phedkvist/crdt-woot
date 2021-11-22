import { Site, Char, Payload, Operation } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as model from './model';

export default class Controller {
  site: Site;
  pool: Payload[];
  editorInsert?: (index: number, value: string) => void;
  editorDelete?: (index: number) => void;
  sendPayload?: (payload: Payload) => void;
  updateLocalSequence: (s: Char[]) => void;

  constructor(
    start: Char,
    end: Char,
    siteId: string,
    editorInstert?: (index: number, value: string) => void,
    editorDelete?: (index: number) => void,
    sendPayload?: (payload: Payload) => void,
    updateLocalSequence?: (s: Char[]) => void
  ) {
    this.site = {
      siteId,
      clock: 0,
      sequence: [start, end],
      operationPool: [],
    };
    this.editorInsert = editorInstert;
    this.editorDelete = editorDelete;
    this.sendPayload = sendPayload;
    this.updateLocalSequence = updateLocalSequence;
    this.pool = [];
  }

  main(print: boolean = false) {
    let integratedIds: string[] = [];
    let sequence = this.site.sequence;
    let executablePayloads = this.pool.filter(({ char, operation }) =>
      model.isExecutable(char, operation, sequence)
    );

    while (executablePayloads.length) {
      executablePayloads.map(({ char, operation, id }) => {
        if (operation === Operation.Insert) {
          const prev = sequence.find((c) => c.id === char.prevId);
          const next = sequence.find((c) => c.id === char.nextId);
          if (!prev || !next) {
            throw Error("Can't insert operation");
          }
          const { sequence: newSequence } = model.integrateIns(
            char,
            prev,
            next,
            sequence
          );
          const index = newSequence
            .filter((c) => c.visible)
            .findIndex((c) => c.id === char.id);
          if (this.editorInsert) {
            this.editorInsert(index, char.value);
          }
          sequence = newSequence;
        } else if (operation === Operation.Delete) {
          if (this.editorDelete) {
            const visibleCharacters = sequence.filter((c) => c.visible);
            const index = visibleCharacters.findIndex((c) => c.id === char.id);

            if (index !== -1) {
              this.editorDelete(index);
            } else {
              // throw Error('Could not find character to be deleted');
            }
          }
          const newSequence = model.deleteChar(char, sequence);
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
    this.site.sequence = sequence;
    this.updateLocalSequence && this.updateLocalSequence(sequence);
  }

  generateDel(position: number, print: boolean = false): Payload {
    const adjustedPosition = position + 1; // account for first element that is invisible
    const { prevId } = model.position(adjustedPosition, this.site.sequence);
    const char = this.site.sequence.find((c) => c.id === prevId);
    print && console.log(char);
    this.deleteChar(char);
    return {
      operation: Operation.Delete,
      char,
      id: uuidv4(),
    };
  }

  generateIns(
    position: number,
    alpha: string,
    print: boolean = false
  ): Payload {
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
    this.site = { ...this.site, clock: newClock, sequence: newSequence };
    this.updateLocalSequence && this.updateLocalSequence(newSequence);

    return payload;
  }

  reception(payload: Payload) {
    this.pool.push(payload);
  }

  deleteChar(char: Char) {
    const newSequence = model.deleteChar(char, this.site.sequence);
    this.site = { ...this.site, sequence: newSequence };
    this.updateLocalSequence && this.updateLocalSequence(newSequence);
  }

  getState() {
    return model.getState(this.site.sequence);
  }
}
