import { Char } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

let siteId = '0';

export const generateSite = () => {
  const startId = uuidv4();
  const endId = uuidv4();
  const start: Char = {
    id: startId,
    charId: {
      siteId,
      clock: 0,
    },
    value: '',
    visible: false,
    prevId: null,
    nextId: endId,
  };
  const end: Char = {
    id: endId,
    charId: {
      siteId,
      clock: 1,
    },
    value: '',
    visible: false,
    prevId: startId,
    nextId: null,
  };
  return { start, end, siteId };
};

export const generateChar = (
  siteId: string,
  clock: number,
  alpha: string,
  prevId: string,
  nextId: string
): Char => ({
  id: uuidv4(),
  charId: {
    siteId,
    clock,
  },
  value: alpha,
  visible: true,
  prevId,
  nextId,
});
