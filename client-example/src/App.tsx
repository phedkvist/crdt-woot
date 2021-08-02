import React, { useEffect, useRef, useState } from 'react';
import CRDT, { generateSite } from 'crdt-woot';
import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';
import './App.css';

const { start, end, siteId } = generateSite();
// const editor = new CRDT(start, end, siteId);

function App() {
  const [value, setValue] = useState('');
  const ref = useRef<ReactQuill | null>(null);

  const [editor, setEditor] = useState<CRDT>();

  useEffect(() => {
    if (ref !== null && editor === null) {
      const insert = (index: number, value: string) =>
        ref.current?.getEditor().insertText(index, value, 'silent');
      const del = (index: number) =>
        ref.current?.getEditor().deleteText(index, 1);
      setEditor(new CRDT(start, end, siteId, insert, del));
    }
  }, [ref]);

  const inspectDelta = (ops: any, index: number, source: string) => {
    if (ops['insert'] != null) {
      //console.log('INSERT', ' RANGE: ', this.state.selectedRange);
      let chars = ops['insert'];
      let attributes = ops['attributes'];
      console.log(chars, index, attributes, source);
      editor && editor.generateIns(index, chars);
      // insert(chars, index, attributes, source);
    } else if (ops['delete'] != null) {
      let len = ops['delete'];
      console.log('DELETE: ', index, len, source);
      let itemsRemaining = len;
      console.log(len, itemsRemaining);
      while (itemsRemaining > 0) {
        console.log('deleting at ', index + itemsRemaining);
        editor && editor.generateDel(index + itemsRemaining - 1);
        itemsRemaining = itemsRemaining - 1;
      }
      // editor.generateDel(index);
      // this.delete(index, len, source);
    } else if (ops['retain'] != null) {
      let len = ops['retain'];
      let attributes = ops['attributes'];
      console.log(index, len, attributes, source);
      // this.retain(index, len, attributes, source);
    }
    console.log(editor && editor.getState());
  };

  const onChange = (value: string, delta: any, source: any) => {
    let index = delta.ops[0]['retain'] || 0;
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
    setValue(value);
  };

  return (
    <div className="App">
      <div className="editor">
        <ReactQuill
          ref={ref}
          theme="snow"
          defaultValue={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default App;
