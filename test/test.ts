import { expect } from 'chai';
import _ from 'lodash';
import Controller from '../src/controller';
import { generateSite } from './utils';

describe('CRDT WOOT', function () {
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
      controller.site.sequence.delete(char);
      const text = controller.getState();
      expect(text).to.eql('ac');
    });
  });
  describe('Integrate cross-site operations', () => {
    let c1: Controller;
    let c2: Controller;
    let c3: Controller;
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
});
