import { useState, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import CRDT, { types } from 'crdt-woot';
import 'react-quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import { Site } from '../App';
import { VisualizedSequence } from './VisualizedSequence';

Quill.register('modules/cursors', QuillCursors);

const modules = {
  cursors: {
    hideDelayMs: 5000,
    transformOnTextChange: true,
  },
};

const printEditor = false;

function Editor({
  setListener,
  updateListeners,
  site,
  start,
  end,
}: {
  setListener: (crdt: CRDT) => void;
  updateListeners: (p: types.Payload, fromSiteId: string) => void;
  site: Site;
  start: types.Char;
  end: types.Char;
}) {
  const { siteId } = site;
  const ref = useRef<ReactQuill | null>(null);

  const [editor, setEditor] = useState<CRDT | null>(null);
  const [sequence, setSequence] = useState<types.Char[]>([]);

  const updateCursors = (
    cursorModule: QuillCursors | null,
    index: number,
    siteId: string
  ) => {
    if (cursorModule !== null) {
      const qC = cursorModule
        .cursors()
        .find((c: { id: string }) => c.id === siteId);
      if (qC) {
        cursorModule.moveCursor(qC.id, { index: index + 1, length: 0 });
      } else {
        cursorModule.createCursor(siteId, siteId, '#0000FF');
        cursorModule.moveCursor(siteId, { index: index + 1, length: 0 });
      }
    }
  };

  useEffect(() => {
    if (ref !== null && editor === null) {
      const insert = (index: number, value: string, siteId: string) => {
        ref.current?.getEditor().insertText(index, value, 'silent');
        const cursorModule = ref.current
          ?.getEditor()
          .getModule('cursors') as QuillCursors;
        updateCursors(cursorModule, index, siteId);
      };
      const del = (index: number, siteId: string) => {
        ref.current?.getEditor().deleteText(index, 1);
        const cursorModule = ref.current
          ?.getEditor()
          .getModule('cursors') as QuillCursors;
        updateCursors(cursorModule, index, siteId);
      };
      const updateSequence = (s: types.Char[]) => setSequence(s);
      const editor = new CRDT(
        start,
        end,
        siteId,
        insert,
        del,
        () => {},
        updateSequence
      );
      printEditor && console.log('NEW EDITOR: ', editor.site.siteId);
      setListener(editor);
      setEditor(editor);
      setSequence(editor.site.sequence);
    }
  }, [ref]);

  const inspectDelta = (ops: any, index: number, source: string) => {
    if (ops['insert']) {
      const chars = ops['insert'];
      const attributes = ops['attributes'];
      const p = editor && editor.generateIns(index, chars);
      if (p) {
        updateListeners(p, siteId);
      }
    } else if (ops['delete']) {
      const len = ops['delete'];
      let itemsRemaining = len;

      while (itemsRemaining > 0) {
        const p = editor && editor.generateDel(index + itemsRemaining - 1);
        printEditor && console.log('GENERATE DEL FROM: ', siteId, p);
        if (p) {
          updateListeners(p, siteId);
        }
        itemsRemaining = itemsRemaining - 1;
      }
    } else if (ops['retain']) {
      const len = ops['retain'];
      const attributes = ops['attributes'];
      // console.log(index, len, attributes, source);
      // this.retain(index, len, attributes, source);
    }
  };

  const onChange = (value: string, delta: any, source: any) => {
    let index = delta.ops[0]['retain'] || 0;
    printEditor && console.log(siteId, value, delta, source);
    if (source === 'user') {
      if (delta.ops.length === 4) {
        const deleteOps_1 = delta.ops[1];
        inspectDelta(deleteOps_1, index, source);
        index += delta.ops[2]['retain'];
        const deleteOps_2 = delta.ops[3];
        inspectDelta(deleteOps_2, index, source);
      } else if (delta.ops.length === 3) {
        const deleteOps = delta.ops[2];
        inspectDelta(deleteOps, index, source);
        const insert = delta.ops[1];
        inspectDelta(insert, index, source);
      } else if (delta.ops.length === 2) {
        inspectDelta(delta.ops[1], index, source);
      } else {
        inspectDelta(delta.ops[0], index, source);
      }
    }
  };

  return (
    <div className="App">
      <div className="editor">
        <VisualizedSequence sequence={sequence} />
        <ReactQuill
          id={siteId}
          ref={ref}
          theme="snow"
          onChange={onChange}
          modules={modules}
        />
      </div>
    </div>
  );
}

export default Editor;
