import WString from '../src/model';
import { Char } from '../src/data';
import { v4 as uuidv4 } from 'uuid';
var assert = require('assert');

describe('CRDT WOOT', function () {
  let sequence: WString;
  const siteOne = '1';
  before(() => {
    const startId = uuidv4();
    const endId = uuidv4();
    const start: Char = {
      id: startId,
      charId: {
        siteId: siteOne,
        clock: 0,
      },
      value: '',
      visible: true,
      prevId: null,
      nextId: endId,
    };
    const end: Char = {
      id: endId,
      charId: {
        siteId: siteOne,
        clock: 0,
      },
      value: '',
      visible: true,
      prevId: startId,
      nextId: null,
    };
    sequence = new WString(start, end);
  });

  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});
