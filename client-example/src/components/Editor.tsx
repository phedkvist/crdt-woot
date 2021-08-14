import { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import CRDT, { generateSite, types } from 'crdt-woot';

import 'react-quill/dist/quill.snow.css';

function Editor({
  setListener,
  updateListeners,
  siteId,
  start,
  end,
}: {
  setListener: (crdt: CRDT) => void;
  updateListeners: (p: types.Payload) => void;
  siteId: string;
  start: types.Char;
  end: types.Char;
}) {
  const [value, setValue] = useState(null);
  const ref = useRef<ReactQuill | null>(null);

  const [editor, setEditor] = useState<CRDT | null>(null);

  useEffect(() => {
    // console.log(ref, editor);
    if (ref !== null && editor === null) {
      const insert = (index: number, value: string) =>
        ref.current?.getEditor().insertText(index, value, 'silent');
      const del = (index: number) =>
        ref.current?.getEditor().deleteText(index, 1);
      // console.log('SITE ID: ', siteId);
      const editor = new CRDT(start, end, siteId, insert, del);
      console.log('INIT TEXT: ', ref.current?.getEditor().getContents());
      setListener(editor);
      setEditor(editor);
    }
  }, [ref]);

  const inspectDelta = (ops: any, index: number, source: string) => {
    console.log('OPS: ', ops);
    if (ops['insert']) {
      // console.log('INSERT', ' RANGE: ', this.state.selectedRange);
      const chars = ops['insert'];
      const attributes = ops['attributes'];
      // console.log(chars, index, attributes, source);
      const p = editor && editor.generateIns(index, chars);
      console.log('SENDING INSERT: ', p);
      if (p) {
        updateListeners(p);
      }
      // insert(chars, index, attributes, source);
    } else if (ops['delete']) {
      const len = ops['delete'];
      // console.log('DELETE: ', index, len, source);
      let itemsRemaining = len;
      // console.log(len, itemsRemaining);
      while (itemsRemaining > 0) {
        // console.log('deleting at ', index + itemsRemaining);
        console.log('GENERATE DEL AT: ', index + itemsRemaining - 1);
        const p = editor && editor.generateDel(index + itemsRemaining - 1);
        if (p) {
          updateListeners(p);
        }
        itemsRemaining = itemsRemaining - 1;
      }
      // editor.generateDel(index);
      // this.delete(index, len, source);
    } else if (ops['retain']) {
      const len = ops['retain'];
      const attributes = ops['attributes'];
      console.log(index, len, attributes, source);
      // this.retain(index, len, attributes, source);
    }
    // console.log(editor && editor.getState());
  };

  const onChange = (value: string, delta: any, source: any) => {
    let index = delta.ops[0]['retain'] || 0;
    console.log(siteId, value, delta, source);
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
    // setValue(value);
  };

  return (
    <div className="App">
      <div className="editor">
        <ReactQuill ref={ref} theme="snow" onChange={onChange} />
      </div>
    </div>
  );
}

export default Editor;
