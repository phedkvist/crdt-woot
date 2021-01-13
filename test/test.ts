import { expect } from 'chai';
import _ from 'lodash';
import Controller from '../src/controller';
import * as model from '../src/model';
import { Char, Operation, Payload } from '../src/types';
import { generateChar, generateSite } from './utils';

describe('CRDT WOOT', function () {
  describe.only('Model', () => {
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
        nextId: start.nextId,
      });
      expect(model.position(1, [start, c1, c2, c3, end])).to.eql({
        prevId: c1.id,
        nextId: c1.nextId,
      });
      expect(model.position(2, [start, c1, c2, c3, end])).to.eql({
        prevId: c2.id,
        nextId: c2.nextId,
      });
      expect(model.position(3, [start, c1, c2, c3, end])).to.eql({
        prevId: c3.id,
        nextId: c3.nextId,
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
    it('integrate insert operations such that all sites end up with 3124', () => {
      const site1 = '1';
      const site2 = '2';
      const site3 = '3';
      const { start, end } = generateSite(site1);
      const c1: Char = generateChar(site1, 0, '1', start.id, end.id);
      const c2: Char = generateChar(site2, 0, '2', start.id, end.id);
      const c3: Char = generateChar(site3, 0, '3', start.id, c1.id);
      const seq = model.insert(
        c3,
        model.integrateIns(c1, start, end, [start, end])
      );
      expect(model.getState(seq)).to.eql('31');
      const c4: Char = generateChar(site3, 1, '4', c1.id, end.id);
      const seq2 = model.insert(c4, seq);
      expect(model.getState(seq2)).to.eql('314');
      const seqTmp = model.integrateIns(c2, start, end, [start, c1, end]);
      expect(model.getState(seqTmp)).to.eql('12');
      const seq3 = model.integrateIns(c2, start, end, seq2);
      expect(model.getState(seq3)).to.eql('3124');
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

      describe('Each site should result in document a312b', () => {
        beforeEach(() => {
          const { start, end, siteId } = generateSite();

          c1 = new Controller(_.cloneDeep(start), _.cloneDeep(end), siteId);
          c2 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '2');
          c3 = new Controller(_.cloneDeep(start), _.cloneDeep(end), '3');

          const op01 = c1.generateIns(0, 'a');
          const op02 = c1.generateIns(1, 'b');

          c2.reception(_.cloneDeep(op01));
          c2.reception(_.cloneDeep(op02));
          c2.main();
          expect(c2.getState()).to.eql('ab');

          c3.reception(_.cloneDeep(op01));
          c3.reception(_.cloneDeep(op02));
          c3.main();
          expect(c3.getState()).to.eql('ab');
        });

        it('Site 3 integrate op1, op2, op3', () => {
          const op1 = c1.generateIns(1, '1');
          c3.reception(_.cloneDeep(op1));
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
          c3.reception(op01);
          c3.main();
          const op03 = c3.generateIns(0, '3');
          expect(c3.getState()).to.eql('31');
          const op04 = c3.generateIns(2, '4');
          expect(c3.getState()).to.eql('314');
          c3.reception(op02);
          c3.main();
          expect(c3.getState()).to.eql('3124');
        });
      });
    });
  });
});
