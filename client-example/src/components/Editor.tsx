import { useState, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import CRDT, { types } from 'crdt-woot';
import 'react-quill/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import { Site } from '../App';
import { VisualizedSequence } from './VisualizedSequence';
import IQuillRange from 'quill-cursors/dist/quill-cursors/i-range';
import { debounce } from 'lodash';
import { Sources } from 'quill';

Quill.register('modules/cursors', QuillCursors);

// Constant to simulate a high-latency connection when sending cursor
// position updates.
const CURSOR_LATENCY = 1000;

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
  updateRange,
  site,
  start,
  end,
}: {
  setListener: (
    crdt: CRDT,
    onSelect: (index: number, range: number, siteId: string) => void
  ) => void;
  updateListeners: (p: types.Payload, fromSiteId: string) => void;
  updateRange: (fromIndex: number, toIndex: number) => void;
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
    length: number,
    siteId: string
  ) => {
    if (cursorModule !== null) {
      const qC = cursorModule
        .cursors()
        .find((c: { id: string }) => c.id === siteId);
      if (qC) {
        cursorModule.moveCursor(qC.id, { index: index, length });
      } else {
        cursorModule.createCursor(siteId, siteId, '#0000FF');
        cursorModule.moveCursor(siteId, { index: index, length });
      }
    }
  };

  function selectionChangeHandler(
    updateCursorCallback: (fromIndex: number, toIndex: number) => void
  ) {
    // const debouncedUpdate = debounce(updateCursor, 500);

    return function (
      range: IQuillRange,
      oldRange: IQuillRange,
      source: Sources
    ) {
      console.log('RANGE: ', range);
      if (source === 'user' && range) {
        // If the user has manually updated their selection, send this change
        // immediately, because a user update is important, and should be
        // sent as soon as possible for a smooth experience.
        // updateCursor(range);
        updateCursorCallback(range.index, range.index + range.length);
      } else {
        // Otherwise, it's a text change update or similar. These changes will
        // automatically get transformed by the receiving client without latency.
        // If we try to keep sending updates, then this will undo the low-latency
        // transformation already performed, which we don't want to do. Instead,
        // add a debounce so that we only send the update once the user has stopped
        // typing, which ensures we send the most up-to-date position (which should
        // hopefully match what the receiving client already thinks is the cursor
        // position anyway).
        // debouncedUpdate(range);
      }
    };

    function updateCursor(range: IQuillRange) {
      // Use a timeout to simulate a high latency connection.
      setTimeout(
        () => updateCursorCallback(range.index, range.index + range.length),
        CURSOR_LATENCY
      );
    }
  }

  useEffect(() => {
    if (ref !== null && editor === null) {
      const cursorModule = ref.current
        ?.getEditor()
        .getModule('cursors') as QuillCursors;

      const insert = (index: number, value: string, siteId: string) => {
        ref.current?.getEditor().insertText(index, value, 'silent');
        updateCursors(cursorModule, index + 1, 0, siteId);
      };
      const del = (index: number, siteId: string) => {
        ref.current?.getEditor().deleteText(index, 1);
        updateCursors(cursorModule, index + 1, 0, siteId);
      };
      const select = (index: number, range: number, siteId: string) => {
        console.log('RECEIVING CURSOR UPDATE FROM: ', siteId, index, range);
        updateCursors(cursorModule, index, range, siteId);
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
      setListener(editor, select);
      setEditor(editor);
      setSequence(editor.site.sequence);

      ref.current
        ?.getEditor()
        .on('selection-change', selectionChangeHandler(updateRange));
    }
  }, [ref]);

  useEffect(() => {
    if (ref) {
      ref.current
        ?.getEditor()
        .on('selection-change', selectionChangeHandler(updateRange));
    }
  }, [updateRange]);

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
