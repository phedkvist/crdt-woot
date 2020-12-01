import { Char, CharId } from '../data/char';

interface Sequence {
  [id: string]: Char;
}

export class WString {
  startChar: CharId;
  startId: string;
  endChar: CharId;
  endId: string;
  sequence: Sequence; // Propably better to some sort of object that still is ordered?

  constructor(start: Char, end: Char) {
    this.startChar = start.charId;
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
      char1.siteId < char2.siteId || (char1.siteId === char2.siteId && char1.clock < char2.clock)
    );
  }

  integrateIns(char: Char, prev: string, next: string) {
    const subseq = this.subseq(prev, next);

    if (subseq.length === 0) {
      this.sequence[char.id] = char;
      this.sequence[prev].id_next = char.id;
      this.sequence[next].id_prev = char.id;
    } else {
      let i = 0;
      let nextValue = subseq[i];
      while (i < subseq.length - 1 && this.comesBefore(nextValue.charId, char.charId)) {
        i += 1;
        nextValue = subseq[i];
      }
      // Now we have found the correct index. Add char with id_prev

      // Insert char between the characters
      this.sequence[char.id] = { ...char, id_next: nextValue.id, id_prev: nextValue.id_prev };

      // Will update adjacent character ids
      this.sequence[nextValue.id].id_prev = char.id;
      this.sequence[nextValue.id_prev].id_next = char.id;
    }
  }

  delete(char: Char) {
    if (char.id in this.sequence) {
      this.sequence[char.id] = { ...this.sequence[char.id], visible: false };
    }
    // TODO: Return something indicating that the char doesn't exist yet?
  }

  subseq(start: string, end: string): Char[] {
    const startChar = this.sequence[start];
    if (!startChar) {
      throw Error('Cant find start char');
    }
    let subseq = [];
    let nextId = startChar.id_next;
    while (nextId !== end) {
      const nextChar = { ...this.sequence[nextId] };
      subseq.push(nextChar);
      nextId = nextChar.id_next;
      if (nextId === this.endId) {
        throw Error('Cant find end char');
      }
    }
    return subseq;
  }

  contains(id: string): boolean {
    return id in this.sequence;
  }

  value(char: Char) {
    return char.value;
  }

  isVisible(id: string): boolean {
    if (!(id in this.sequence)) {
      throw Error(`Char with id: ${id} could not be found in the sequence`);
    }
    return this.sequence[id].visible;
  }
}
