import { Char, CharId, Site, Operation } from './types';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

interface Sequence {
  [id: string]: Char;
}

export default class WString {
  startChar: CharId;
  startId: string;
  endChar: CharId;
  endId: string;
  sequence: Sequence; // Propably better to some sort of object that still is ordered?

  constructor(start: Char, end: Char) {
    this.startId = start.id;
    this.startChar = start.charId;
    this.endChar = end.charId;
    this.endId = end.id;
    this.sequence = {};
    this.sequence[start.id] = start;
    this.sequence[end.id] = end;
  }

  length(): number {
    return Object.keys(this.sequence).length;
  }

  comesBefore(char1: CharId, char2: CharId): boolean {
    return (
      char1.siteId < char2.siteId ||
      (char1.siteId === char2.siteId && char1.clock < char2.clock)
    );
  }

  prepareInsert(
    position: number,
    alpha: string,
    siteId: string,
    clock: number
  ): Char {
    const { nextId, prevId } = this.position(position);
    return {
      id: uuidv4(),
      charId: {
        siteId,
        clock,
      },
      value: alpha,
      visible: true,
      prevId,
      nextId,
    };
  }

  insert(char: Char) {
    // TODO: Local insert should just make the insert between prev and next
    const { sequence } = this;

    if (!sequence[char.nextId] && !sequence[char.prevId]) {
      throw Error("Can't find the prevChar.id or nextChar.id");
    }

    const prevChar = { ...sequence[char.prevId], nextId: char.id };
    const nextChar = { ...sequence[char.nextId], prevId: char.id };
    sequence[char.id] = char;
    sequence[char.prevId] = prevChar;
    sequence[char.nextId] = nextChar;
  }

  // TODO: Start using _.deepClone here.
  integrateIns(incomingChar: Char) {
    const { prevId: prev, nextId: next } = incomingChar;
    const subseq = this.subseq(prev, next);
    console.log(subseq);
    if (subseq.length === 0) {
      this.sequence[incomingChar.id] = incomingChar;
      this.sequence[prev].nextId = incomingChar.id;
      this.sequence[next].prevId = incomingChar.id;
    } else {
      let i = 0;
      let nextValue = subseq[i];
      while (
        i < subseq.length &&
        nextValue &&
        this.comesBefore(nextValue.charId, incomingChar.charId)
      ) {
        i += 1;
        nextValue = subseq[i];
      }
      if (!nextValue) {
        // Incoming element is inserted at the end of the subseq
        i -= 1;
        nextValue = subseq[i];
        // SEEMS LIKE WE SHOULD NOT KEEP CHANGING THE IDs,
        // as it mutates the operations.

        this.sequence[incomingChar.id] = {
          ...incomingChar,
          nextId: _.clone(nextValue.nextId),
          prevId: _.clone(nextValue.id),
        };
        this.sequence[nextValue.id] = {
          ...this.sequence[nextValue.id],
          nextId: _.clone(incomingChar.id),
        };
        this.sequence[nextValue.nextId] = {
          ...this.sequence[nextValue.nextId],
          prevId: _.clone(incomingChar.id),
        };
      } else {
        // Incoming element is inserted before next value.
        this.sequence[incomingChar.id] = {
          ...incomingChar,
          nextId: _.clone(nextValue.id),
          prevId: _.clone(nextValue.prevId),
        };
        this.sequence[nextValue.id].prevId = incomingChar.id;
        this.sequence[nextValue.prevId].nextId = incomingChar.id;
      }
    }
  }

  delete(char: Char) {
    this.sequence[char.id] = { ...this.sequence[char.id], visible: false };
  }

  subseq(start: string, end: string): Char[] {
    const startChar = this.sequence[start];
    if (!startChar) {
      throw Error('Cant find start char');
    }
    let subseq = [];
    let nextId = startChar.nextId;
    while (nextId !== end) {
      const nextChar = _.cloneDeep(this.sequence[nextId]);
      subseq.push(nextChar);
      nextId = _.clone(nextChar.nextId);
    }
    return subseq;
  }

  // Lets make the assumption first char is 0 indexed.
  position(index: number) {
    let nextChar: Char = this.sequence[this.startId];
    let i = 0;

    let nextId: string, prevId: string;
    while (i <= index) {
      if (i == index) {
        prevId = nextChar.id;
        nextId = nextChar.nextId;
        break;
      }
      nextChar = this.sequence[nextChar.nextId];
      i += 1;
    }
    return {
      prevId,
      nextId,
    };
  }

  contains(id: string): boolean {
    return id in this.sequence;
  }

  value(char: Char) {
    return char.value;
  }

  isExecutable(char: Char, operation: Operation) {
    if (operation === Operation.Delete) {
      return this.contains(char.id);
    } else if (Operation.Insert) {
      return this.contains(char.nextId) && this.contains(char.prevId);
    } else {
      throw Error('Unknow operation');
    }
  }

  isVisible(id: string): boolean {
    if (!(id in this.sequence)) {
      throw Error(`Char with id: ${id} could not be found in the sequence`);
    }
    return this.sequence[id].visible;
  }

  getState() {
    let text = '';
    let i = 0;
    let nextId = this.startId;
    const len = Object.keys(this.sequence).length - 1;
    while (i < len) {
      const char = this.sequence[nextId];
      if (!char) {
        throw Error('Cant find next char value');
      }
      if (!char.value && char.visible) {
        throw Error('Cant find char value: ');
      }
      if (char.value && char.visible) {
        text += char.value;
      }

      nextId = char.nextId;
      i++;
    }
    return text;
  }
}
