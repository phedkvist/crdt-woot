import { expect } from 'chai';
import _, { forEach } from 'lodash';
import Controller from '../src/controller';
import * as model from '../src/model';
import { Char, Operation, Payload } from '../src/types';
import {
  generateArray,
  generateChar,
  generateSite,
  randomElementsBetween,
} from './utils';

describe('CRDT WOOT', function () {
  describe('Model', () => {
    it('determine precedence between two characters from different sites', () => {
      const site1 = '1';
      const site2 = '2';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const c2: Char = generateChar(site2, 0, 'b', start.id, end.id);
      expect(model.comesBefore(c1.charId, c2.charId)).to.eql(true);
    });
    it('determine precedence between two characters from same sites', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const c2: Char = generateChar(site1, 1, 'b', start.id, end.id);
      expect(model.comesBefore(c1.charId, c2.charId)).to.eql(true);
    });
    it('get items in subsequence', () => {
      const site1 = '1';
      const site2 = '2';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      expect(model.subseq(start.id, end.id, [start, c1, end])).to.eql([c1]);
      const c2: Char = generateChar(site2, 0, 'b', start.id, end.id);
      expect(model.subseq(start.id, end.id, [start, c1, c2, end])).to.eql([
        c1,
        c2,
      ]);
    });
    it('mark a deleted char as not visible', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      expect(model.deleteChar(c1, [c1])).to.eql([{ ...c1, visible: false }]);
    });
    it('get the whole state of the sequence', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const c2: Char = generateChar(site1, 1, 'b', start.id, end.id);
      const c3: Char = generateChar(site1, 2, 'c', start.id, end.id);
      expect(model.getState([start, c1, c2, c3, end])).to.eql('abc');
    });
    it('get the position of neighbouring characters', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const c2: Char = generateChar(site1, 1, 'b', start.id, end.id);
      const c3: Char = generateChar(site1, 2, 'c', start.id, end.id);
      expect(model.position(0, [start, c1, c2, c3, end])).to.eql({
        prevId: start.id,
        nextId: c1.id,
      });
      expect(model.position(1, [start, c1, c2, c3, end])).to.eql({
        prevId: c1.id,
        nextId: c2.id,
      });
      expect(model.position(2, [start, c1, c2, c3, end])).to.eql({
        prevId: c2.id,
        nextId: c3.id,
      });
      expect(model.position(3, [start, c1, c2, c3, end])).to.eql({
        prevId: c3.id,
        nextId: end.id,
      });
    });
    it('check if the characters exists in sequence', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const c2: Char = generateChar(site1, 1, 'b', start.id, end.id);
      const c3: Char = generateChar(site1, 2, 'c', start.id, end.id);
      expect(model.contains(c3.id, [start, c1, c2, end])).to.eql(false);
      expect(model.contains(c2.id, [start, c1, c2, end])).to.eql(true);
      expect(model.contains(c1.id, [start, c1, c2, end])).to.eql(true);
    });
    it('check if insert operation is executable', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const c2: Char = generateChar(site1, 1, 'b', c1.id, end.id);
      const c3: Char = generateChar(site1, 2, 'c', c2.id, end.id);
      expect(
        model.isExecutable(c3, Operation.Insert, [start, c1, c2, end])
      ).to.eql(true);
      expect(model.isExecutable(c3, Operation.Insert, [start, c1, end])).to.eql(
        false
      );
    });
    it('check if delete operation is executable', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      expect(model.isExecutable(c1, Operation.Delete, [start, c1, end])).to.eql(
        true
      );
      expect(model.isExecutable(c1, Operation.Delete, [start, end])).to.eql(
        false
      );
    });
    it('local insert operation should insert', () => {
      const site1 = '1';
      const { start, end } = generateSite(site1);
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const seq = model.insert(c1, [start, end]);
      expect(seq[1]).to.eql(c1);
    });
    it('integrate insert operation', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const seq = model.integrateIns(c1, start, end, [start, end]);
      expect(seq[1]).to.eql(c1);
    });
    it('integrate insert operation from other site that is inserted at the same position', () => {
      const site1 = '1';
      const { start, end } = generateSite(site1);
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const seq = model.insert(c1, [start, end]);
      expect(seq[1]).to.eql(c1);
      const site2 = '2';
      const c2: Char = generateChar(site2, 0, 'b', start.id, end.id);
      const seq2 = model.integrateIns(c2, start, end, seq);
      expect(model.comesBefore(c1.charId, c2.charId)).to.eql(true);
      expect(seq2[1]).to.eql(c1);
      expect(seq2[2]).to.eql(c2);
      const site3 = '3';
      const c3: Char = generateChar(site3, 0, 'c', start.id, end.id);
      const seq3 = model.integrateIns(c3, start, end, seq2);
      expect(seq3[1]).to.eql(c1);
      expect(seq3[2]).to.eql(c2);
      expect(seq3[3]).to.eql(c3);
    });
    it('integrate insert operations such that site ends ups with a312b', () => {
      const site1 = '1';
      const { start, end } = generateSite(site1);
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const c2: Char = generateChar(site1, 1, 'b', c1.id, end.id);
      const c3: Char = generateChar(site1, 2, '1', c1.id, c2.id);
      const c4: Char = generateChar(site1, 3, '3', c1.id, c2.id);
      const seq = model.insert(
        c4,
        model.insert(c3, model.insert(c2, model.insert(c1, [start, end])))
      );
      expect(model.getState(seq)).to.eql('a31b');
      const site2 = '2';
      const c5: Char = generateChar(site2, 0, '2', c1.id, c2.id);
      const seq2 = model.integrateIns(c5, c1, c2, seq);
      expect(model.comesBefore(c5.charId, c3.charId)).to.eql(false);
      expect(model.getState(seq2)).to.eql('a312b');
    });
    it('integrate insert operations such that site 3 end up with 3124', () => {
      const site1 = '1';
      const site2 = '2';
      const site3 = '3';
      const { start, end } = generateSite(site1);

      const c1: Char = generateChar(site1, 3, '1', start.id, end.id);
      const c2: Char = generateChar(site2, 1, '2', start.id, end.id);
      const c3: Char = generateChar(site3, 1, '3', start.id, c1.id);
      const c4: Char = generateChar(site3, 2, '4', c1.id, end.id);

      const seq = model.insert(
        c3,
        model.integrateIns(c1, start, end, [start, end])
      );
      expect(model.getState(seq)).to.eql('31');
      const seq2 = model.insert(c4, seq);
      expect(model.getState(seq2)).to.eql('314');
      const seq3 = model.integrateIns(c2, start, end, seq2, false);
      expect(model.getState(seq3)).to.eql('3124');
    });
    it('integrate insert operations such that site 2 end up with 3124', () => {
      const site1 = '1';
      const site2 = '2';
      const site3 = '3';
      const { start, end } = generateSite(site1);

      const c1: Char = generateChar(site1, 3, '1', start.id, end.id);
      const c2: Char = generateChar(site2, 1, '2', start.id, end.id);
      const c3: Char = generateChar(site3, 1, '3', start.id, c1.id);
      const c4: Char = generateChar(site3, 2, '4', c1.id, end.id);

      const seq = model.insert(c2, [start, end]);
      expect(model.getState(seq)).to.eql('2');
      const seq2 = model.integrateIns(c1, start, end, seq);
      expect(model.getState(seq2)).to.eql('12');
      const seq3 = model.integrateIns(c3, start, c1, seq2, false);
      expect(model.getState(seq3)).to.eql('312');
      const seq4 = model.integrateIns(c4, c1, end, seq3, false);
      expect(model.getState(seq4)).to.eql('3124');
    });
    it('integrate delete and insert operations such that both sites end up with ab1c̶', () => {
      const site1 = '1';
      const site2 = '2';
      const { start, end } = generateSite(site1);
      const c1: Char = generateChar(site1, 1, 'a', start.id, end.id);
      const c2: Char = generateChar(site1, 2, 'b', c1.id, end.id);
      const c3: Char = generateChar(site1, 3, 'c', c2.id, end.id);

      const seqSite1 = model.insert(
        c3,
        model.insert(c2, model.insert(c1, [start, end]))
      );
      expect(model.getState(seqSite1)).to.eql('abc');

      const seqSite2 = model.integrateIns(
        c3,
        c2,
        end,
        model.integrateIns(
          c2,
          c1,
          end,
          model.integrateIns(c1, start, end, [start, end])
        )
      );
      expect(model.getState(seqSite2)).to.eql('abc');

      const c4: Char = generateChar(site2, 1, '1', c2.id, c3.id);
      const seq2Site1 = model.insert(c4, seqSite1);
      expect(model.getState(seq2Site1)).to.eql('ab1c');

      const seq2Site2 = model.deleteChar(c3, seqSite2);
      expect(model.getState(seq2Site2)).to.eql('ab');

      const seq3Site1 = model.deleteChar(c3, seq2Site1);
      expect(model.getState(seq3Site1)).to.eql('ab1');

      const seq3Site2 = model.insert(c4, seq2Site2);
      expect(model.getState(seq3Site2)).to.eql('ab1');
    });
    it('integrate delete operations such that both sites ends up with ab̶c̶', () => {
      const site1 = '1';
      const site2 = '2';
      const { start, end } = generateSite(site1);
      const c1: Char = generateChar(site1, 1, 'a', start.id, end.id);
      const c2: Char = generateChar(site1, 2, 'b', c1.id, end.id);
      const c3: Char = generateChar(site1, 3, 'c', c2.id, c1.id);

      const seqSite1 = model.insert(
        c3,
        model.insert(c2, model.insert(c1, [start, end]))
      );
      expect(model.getState(seqSite1)).to.eql('abc');

      const seqSite2 = model.integrateIns(
        c3,
        c2,
        end,
        model.integrateIns(
          c2,
          c1,
          end,
          model.integrateIns(c1, start, end, [start, end])
        )
      );
      expect(model.getState(seqSite2)).to.eql('abc');

      const seq2Site1 = model.deleteChar(c2, seqSite1);
      expect(model.getState(seq2Site1)).to.eql('ac');

      const seq2Site2 = model.deleteChar(c3, seqSite2);
      expect(model.getState(seq2Site2)).to.eql('ab');

      const seq3Site1 = model.deleteChar(c3, seq2Site1);
      expect(model.getState(seq3Site1)).to.eql('a');

      const seq3Site2 = model.deleteChar(c2, seq2Site2);
      expect(model.getState(seq3Site2)).to.eql('a');
    });
  });
  describe('Controller', () => {
    describe('Integrate local operations', () => {
      let controller: Controller;
      beforeEach(() => {
        const { start, end } = generateSite();
        controller = new Controller(start, end, '0');
      });

      it('Should insert text in a document', () => {
        controller.generateIns(0, 'a');
        controller.generateIns(1, 'b');
        controller.generateIns(2, 'c');
        const text = controller.getState();
        expect(text).to.eql('abc');
      });

      it('Should delete a character in a document', () => {
        controller.generateIns(0, 'a');
        const { char } = controller.generateIns(1, 'b');
        controller.generateIns(2, 'c');
        controller.deleteChar(char);
        const text = controller.getState();
        expect(text).to.eql('ac');
      });
    });
    describe('Integrate cross-site operations', () => {
      let c1: Controller;
      let c2: Controller;
      let c3: Controller;
      const { start, end, siteId } = generateSite();

      describe('Each site should result in document a312b', () => {
        it('Site 3 integrate op1, op2, op3', () => {
          const c1 = new Controller(
            _.cloneDeep(start),
            _.cloneDeep(end),
            siteId
          );
          const c2 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '2');
          const c3 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '3');
          const op01 = c1.generateIns(0, 'a');
          expect(op01.char.prevId).to.eql(start.id);
          expect(op01.char.nextId).to.eql(end.id);

          const op02 = c1.generateIns(1, 'b');
          expect(op02.char.prevId).to.eql(op01.char.id);
          expect(op02.char.nextId).to.eql(end.id);

          expect(c1.getState()).to.eql('ab');

          c2.reception(_.cloneDeep(op01));
          c2.reception(_.cloneDeep(op02));
          c2.main();

          expect(c2.getState()).to.eql('ab');

          c3.reception(_.cloneDeep(op01));
          c3.reception(_.cloneDeep(op02));
          c3.main();
          expect(c3.getState()).to.eql('ab');

          const op03 = c1.generateIns(1, '1');
          expect(op03.char.prevId).to.eql(op01.char.id);
          expect(op03.char.nextId).to.eql(op02.char.id);
          expect(c1.getState()).to.eql('a1b');

          c3.reception(_.cloneDeep(op03));
          c3.main();
          expect(c3.getState()).to.eql('a1b');

          const op2 = c2.generateIns(1, '2');
          c3.reception(_.cloneDeep(op2));
          c3.main();
          expect(c3.getState()).to.eql('a12b');

          const op3 = c1.generateIns(1, '3');
          c3.reception(op3);
          c3.main();

          expect(c3.getState()).to.eql('a312b');
        });
        it('Site 1 integrate op1, op2, op3', () => {
          const c1 = new Controller(
            _.cloneDeep(start),
            _.cloneDeep(end),
            siteId
          );
          const c2 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '2');
          const c3 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '3');

          const op01 = c1.generateIns(0, 'a');
          expect(op01.char.prevId).to.eql(start.id);
          expect(op01.char.nextId).to.eql(end.id);

          const op02 = c1.generateIns(1, 'b');
          expect(op02.char.prevId).to.eql(op01.char.id);
          expect(op02.char.nextId).to.eql(end.id);
          expect(c1.getState()).to.eql('ab');

          c2.reception(_.cloneDeep(op01));
          c2.reception(_.cloneDeep(op02));
          c2.main();
          expect(c2.getState()).to.eql('ab');

          c3.reception(_.cloneDeep(op01));
          c3.reception(_.cloneDeep(op02));
          c3.main();
          expect(c3.getState()).to.eql('ab');

          c1.generateIns(1, '1');
          expect(c1.getState()).to.eql('a1b');
          c1.generateIns(1, '3');
          expect(c1.getState()).to.eql('a31b');

          const op2 = c2.generateIns(1, '2');
          c1.reception(_.cloneDeep(op2));
          c1.main();
          expect(c1.getState()).to.eql('a312b');
        });
      });
      describe('Each site should result in document 3124', () => {
        let op01, op02: Payload;
        beforeEach(() => {
          const { start, end, siteId } = generateSite();
          c1 = new Controller(_.cloneDeep(start), _.cloneDeep(end), siteId);
          c2 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '2');
          c3 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '3');

          op01 = c1.generateIns(0, '1');
          op02 = c2.generateIns(0, '2');
        });

        it('Site 3 integrates op1, op2, op3, op4', () => {
          c3.reception(_.cloneDeep(op01));
          c3.main();
          const op03 = c3.generateIns(0, '3');
          expect(c3.getState()).to.eql('31');
          const op04 = c3.generateIns(2, '4');
          expect(c3.getState()).to.eql('314');
          c3.reception(op02);
          c3.main();
          expect(c3.getState()).to.eql('3124');
        });
        it('Site 2 integrates op1, op3, op4', () => {
          c2.reception(_.cloneDeep(op01));
          c2.main();
          expect(c2.getState()).to.eql('12');

          c3.reception(_.cloneDeep(op01));
          c3.main();
          const op03 = c3.generateIns(0, '3');
          expect(c3.getState()).to.eql('31');
          const op04 = c3.generateIns(2, '4');
          expect(c3.getState()).to.eql('314');

          c2.reception(_.cloneDeep(op03));
          c2.main();
          expect(c2.getState()).to.eql('312');

          c2.reception(_.cloneDeep(op04));
          c2.main();
          expect(c2.getState()).to.eql('3124');
        });
      });
      describe('Commutation of (del, ins) and (del, del)', () => {
        it('Site 1 & 2 should end up with ab1c̶', () => {
          const c1 = new Controller(
            _.cloneDeep(start),
            _.cloneDeep(end),
            siteId
          );
          const c2 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '2');

          const op1 = c1.generateIns(0, 'a');
          const op2 = c1.generateIns(1, 'b');
          const op3 = c1.generateIns(2, 'c');
          expect(c1.getState()).to.eql('abc');

          c2.reception(op1);
          c2.reception(op2);
          c2.reception(op3);
          c2.main();
          expect(c2.getState()).to.eql('abc');

          const op4 = c2.generateDel(2);
          expect(c2.getState()).to.eql('ab');

          const op5 = c1.generateIns(2, '1');
          expect(c1.getState()).to.eql('ab1c');

          c1.reception(op4);
          c1.main();
          expect(c1.getState()).to.eql('ab1');

          c2.reception(op5);
          c2.main();
          expect(c2.getState()).to.eql('ab1');
        });
        it('Site 1 & 2 should end up with a', () => {
          const c1 = new Controller(
            _.cloneDeep(start),
            _.cloneDeep(end),
            siteId
          );
          const c2 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '2');

          const op1 = c1.generateIns(0, 'a');
          const op2 = c1.generateIns(1, 'b');
          const op3 = c1.generateIns(2, 'c');
          expect(c1.getState()).to.eql('abc');

          c2.reception(op1);
          c2.reception(op2);
          c2.reception(op3);
          c2.main();
          expect(c2.getState()).to.eql('abc');

          const op4 = c1.generateDel(1);
          expect(c1.getState()).to.eql('ac');

          const op5 = c2.generateDel(2);
          expect(c2.getState()).to.eql('ab');

          c1.reception(op5);
          c1.main();
          expect(c1.getState()).to.eql('a');

          c2.reception(op4);
          c2.main();
          expect(c2.getState()).to.eql('a');
        });
      });
      describe('Receive operations in random order and end up with same state', () => {
        it('10 insert operations retrieved in random order', () => {
          const c1 = new Controller(
            _.cloneDeep(start),
            _.cloneDeep(end),
            siteId
          );
          const c2 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '2');

          let text = '';
          const payloads = generateArray(10).map((v, i) => {
            text += i.toString();
            return c1.generateIns(i, i.toString());
          });

          const state = c1.getState();
          expect(state).to.eql(text);

          const shuffledPayloads = _.shuffle(payloads);
          shuffledPayloads.forEach((p) => {
            c2.reception(p);
          });

          c2.main();
          expect(c2.getState()).to.eql(state);
        });
        it('10 insert operations and 5 delete operations retrieved in random order', () => {
          const c1 = new Controller(
            _.cloneDeep(start),
            _.cloneDeep(end),
            siteId
          );
          const c2 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '2');

          let text = '';
          const insertPayloads = generateArray(10).map((i) => {
            text += i.toString();
            return c1.generateIns(i, i.toString());
          });

          const deletePayloads = randomElementsBetween(5, 5).map((i) => {
            return c1.generateDel(i);
          });

          const payloads = [...insertPayloads, ...deletePayloads];

          const shuffledPayloads = _.shuffle(payloads);
          shuffledPayloads.forEach((p) => {
            c2.reception(p);
          });

          c2.main();
          expect(c2.getState()).to.eql(c1.getState());
        });
      });
    });
  });
});
