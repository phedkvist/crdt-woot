import { Char, CharId, Site, Operation } from './types';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

function length(sequence: Char[]): number {
  return Object.keys(sequence).length;
}

export function comesBefore(char1: CharId, char2: CharId): boolean {
  return (
    char1.siteId < char2.siteId ||
    (char1.siteId === char2.siteId && char1.clock < char2.clock)
  );
}

export function prepareInsert(
  index: number,
  alpha: string,
  siteId: string,
  clock: number,
  sequence: Char[]
): Char {
  const { nextId, prevId } = position(index, sequence);
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

// TODO: Should test this function
export function insert(char: Char, sequence: Char[]) {
  const prev = sequence.find((c) => c.id === char.prevId);
  const next = sequence.find((c) => c.id === char.nextId);

  if (!next && !prev) {
    throw Error("Can't find the prevChar.id or nextChar.id");
  }

  const prevIndex = sequence.findIndex((c) => c.id === char.prevId);

  const tmpSequence = _.cloneDeep(sequence);
  tmpSequence.splice(prevIndex, 0, char);
  return tmpSequence;
}

export function integrateIns(incomingChar: Char, sequence: Char[]) {
  const { prevId: prev, nextId: next } = incomingChar;
  const subsequence = subseq(prev, next, sequence);

  let i = 0;
  let nextValue = subseq[i];
  while (
    i < subsequence.length &&
    nextValue &&
    this.comesBefore(nextValue.charId, incomingChar.charId)
  ) {
    i += 1;
    nextValue = subsequence[i];
  }
  if (i === this.sequence.length) {
    i = -1;
  }

  return sequence.splice(i, 0, incomingChar);
}

export function deleteChar(char: Char, sequence: Char[]) {
  return _.cloneDeep(sequence).map((c) => {
    if (c.id === char.id) {
      return { ...c, visible: false };
    }
    return c;
  });
}

export function subseq(
  startId: string,
  endId: string,
  sequence: Char[]
): Char[] {
  const startIndex = sequence.findIndex((c) => c.id === startId);
  if (startIndex === -1) {
    throw Error('Cant find start char at site ');
  }

  let subseq = [];
  let index = startIndex + 1;
  while (index <= sequence.length) {
    const nextChar = _.cloneDeep(sequence[index]);
    if (nextChar.id === endId) {
      break;
    }
    subseq.push(nextChar);
    index = index + 1;
  }
  return subseq;
}

// Lets make the assumption first char is 0 indexed.
function position(index: number, sequence: Char[]) {
  let nextChar: Char = sequence[0];
  let i = 0;

  let nextId: string, prevId: string;
  while (i <= index) {
    if (i == index) {
      prevId = nextChar.id;
      nextId = nextChar.nextId;
      break;
    }
    i += 1;
    nextChar = sequence[i];
  }
  return {
    prevId,
    nextId,
  };
}

export function contains(id: string, sequence: Char[]): boolean {
  return sequence.find((c) => c.id === id) !== undefined;
}

export function value(char: Char) {
  return char.value;
}

export function isExecutable(
  char: Char,
  operation: Operation,
  sequence: Char[]
) {
  if (operation === Operation.Delete) {
    return contains(char.id, sequence);
  } else if (Operation.Insert) {
    return contains(char.nextId, sequence) && contains(char.prevId, sequence);
  } else {
    throw Error('Unknow operation');
  }
}

function isVisible(id: string, sequence: Char[]): boolean {
  if (!(id in sequence)) {
    throw Error(`Char with id: ${id} could not be found in the sequence`);
  }
  return sequence[id].visible;
}

export function getState(sequence: Char[]) {
  let text = '';
  let i = 0;
  const len = Object.keys(sequence).length - 1;
  while (i < len) {
    const char = sequence[i];
    if (!char) {
      throw Error('Cant find next char value');
    }
    if (!char.value && char.visible) {
      throw Error('Cant find char value: ');
    }
    if (char.value && char.visible) {
      text += char.value;
    }
    i++;
  }
  return text;
}
