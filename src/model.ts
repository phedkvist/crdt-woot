import { Char, CharId, Operation } from './types';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

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

export function insert(char: Char, sequence: Char[]) {
  const prev = sequence.find((c) => c.id === char.prevId);
  const next = sequence.find((c) => c.id === char.nextId);

  if (!next && !prev) {
    throw Error("Can't find the prevChar.id or nextChar.id");
  }

  const insertIndex = 1 + sequence.findIndex((c) => c.id === char.prevId);

  const tmpSequence = _.cloneDeep(sequence);
  tmpSequence.splice(insertIndex, 0, char);
  return tmpSequence;
}

export function integrateIns(
  incomingChar: Char,
  prev: Char,
  next: Char,
  sequence: Char[],
  print: boolean = false
): { sequence: Char[]; index: number } {
  const lowerbound = sequence.findIndex((c) => c.id === prev.id);
  const upperbound = sequence.findIndex((c) => c.id === next.id);

  const subsequence = sequence.filter(
    (c, i) => i > lowerbound && i < upperbound
  );

  if (print) {
    console.log('lowerbound: ', lowerbound);
    console.log('upperbound: ', upperbound);
    console.log('PREV: ', prev.value, '\n NEXT: ', next.value);
    console.log(
      'SUBSEQ',
      subsequence.map((c) => c.value)
    );
  }

  if (subsequence.length === 0) {
    const tmpSequence = _.cloneDeep(sequence);
    tmpSequence.splice(upperbound, 0, incomingChar);
    return { sequence: tmpSequence, index: upperbound };
  } else {
    const L = [prev];

    subsequence.forEach((char) => {
      const cPrevIndex = sequence.findIndex((c) => c.id === char.prevId);
      const cNextIndex = sequence.findIndex((c) => c.id === char.nextId);
      if (print) {
        console.log('cprev: ', cPrevIndex);
        console.log('cnext: ', cNextIndex);
      }
      if (cPrevIndex <= lowerbound && upperbound <= cNextIndex) {
        L.push(char);
      }
    });
    L.push(next);

    if (print) {
      console.log(
        'L: ',
        L.map((c) => c.value)
      );
    }

    let i = 1;
    while (i < L.length - 1 && comesBefore(L[i].charId, incomingChar.charId)) {
      i = i + 1;
    }
    return integrateIns(incomingChar, L[i - 1], L[i], sequence, print);
  }
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

export function position(index: number, sequence: Char[]) {
  const visibleCharacters = sequence.filter((c) => c.visible);
  visibleCharacters.unshift(sequence[0]);
  visibleCharacters.push(sequence[sequence.length - 1]);

  const prevChar = visibleCharacters[index];
  const nextChar = visibleCharacters[index + 1];
  if (!prevChar || !nextChar) {
    throw Error(
      `Prev char or next char out of bounds. Indexes: (${index}, ${index + 1})
      }. Len visible chars: ${visibleCharacters.length}.
      Len sequence: ${sequence.length}`
    );
  }
  const prevId = prevChar.id;
  const nextId = nextChar.id;
  return {
    prevId,
    nextId,
  };
}

export function contains(id: string, sequence: Char[]): boolean {
  return sequence.find((c) => c.id === id) !== undefined;
}

export function isExecutable(
  char: Char,
  operation: Operation,
  sequence: Char[]
) {
  if (operation === Operation.Delete) {
    return contains(char.id, sequence);
  } else if (operation === Operation.Insert) {
    return (
      contains(char.nextId, sequence) &&
      contains(char.prevId, sequence) &&
      !contains(char.id, sequence)
    );
  } else {
    throw Error('Unknow operation');
  }
}

export function getState(sequence: Char[]) {
  let text = '';
  let i = 0;
  const len = Object.keys(sequence).length - 1;
  while (i < len) {
    const char = sequence[i];
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
