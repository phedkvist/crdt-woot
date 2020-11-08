import { Char } from '../data/char';

export class Sequence {
  start: Char;
  end: Char;
  sequence: Char[]; // Propably better to some sort of object that still is ordered?

  constructor(start: Char, end: Char) {
    this.start = start;
    this.end = end;
    this.sequence = [start, end];
  }

  length(): number {
    return this.sequence.length;
  }

  position(char: Char): number {
    return this.sequence.findIndex((c) => c.id === char.id);
  }

  insert(char: Char, position: number) {
    const seq = [...this.sequence];
    seq.splice(position, 0, char);
    this.sequence = seq;
  }

  delete(char: Char) {
    if (this.contains(char)) {
      const pos = this.position(char);
      const seq = [...this.sequence];
      seq[pos] = { ...char, visible: false };
      this.sequence = seq;
    }
  }

  subseq(start: Char, end: Char): Char[] {
    const startPos = this.position(start);
    const endPos = this.position(end);

    if (startPos || endPos) {
      throw Error('Cant find the characters in the sub sequence');
    }
    const subseq = [];
    for (let i = startPos; i <= endPos; i++) {
      subseq.push(this.sequence[i]);
    }
    return subseq;
  }

  contains(char: Char): boolean {
    return this.position(char) !== -1;
  }

  value(char: Char) {
    return char.value;
  }

  isVisible(index) {
    const char = this.sequence;
  }
}
