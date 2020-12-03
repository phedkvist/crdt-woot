import { Char, CharId, Site, Operation } from './data';
import { v4 as uuidv4 } from 'uuid';

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
  }

  integrateIns(char: Char, prev: string, next: string) {
    const subseq = this.subseq(prev, next);

    if (subseq.length === 0) {
      this.sequence[char.id] = char;
      this.sequence[prev].nextId = char.id;
      this.sequence[next].prevId = char.id;
    } else {
      let i = 0;
      let nextValue = subseq[i];
      while (
        i < subseq.length - 1 &&
        this.comesBefore(nextValue.charId, char.charId)
      ) {
        i += 1;
        nextValue = subseq[i];
      }
      // Now we have found the correct index. Add char with prevId

      // Insert char between the characters
      this.sequence[char.id] = {
        ...char,
        nextId: nextValue.id,
        prevId: nextValue.prevId,
      };

      // Will update adjacent character ids
      this.sequence[nextValue.id].prevId = char.id;
      this.sequence[nextValue.prevId].nextId = char.id;
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
      const nextChar = { ...this.sequence[nextId] };
      subseq.push(nextChar);
      nextId = nextChar.nextId;
      if (nextId === this.endId) {
        throw Error('Cant find end char');
      }
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
}
