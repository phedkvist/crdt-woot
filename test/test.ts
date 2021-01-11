import { expect } from 'chai';
import _ from 'lodash';
import Controller from '../src/controller';
import * as model from '../src/model';
import { Char, Payload } from '../src/types';
import { generateChar, generateSite } from './utils';

describe('CRDT WOOT', function () {
  describe.only('Model', () => {
    it('Should determine precedence between two characters from different sites', () => {
      const site1 = '1';
      const site2 = '2';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const c2: Char = generateChar(site2, 0, 'b', start.id, end.id);
      expect(model.comesBefore(c1.charId, c2.charId)).to.eql(true);
    });
    it('Should determine precedence between two characters from same sites', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      const c2: Char = generateChar(site1, 1, 'b', start.id, end.id);
      expect(model.comesBefore(c1.charId, c2.charId)).to.eql(true);
    });
    it('Should get items in subsequence', () => {
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
    it('Should mark a deleted char as not visible', () => {
      const site1 = '1';
      const { start, end } = generateSite();
      const c1: Char = generateChar(site1, 0, 'a', start.id, end.id);
      expect(model.deleteChar(c1, [c1])).to.eql([{ ...c1, visible: false }]);
    });
  });
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
