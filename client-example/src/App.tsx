import React, { useState } from 'react';
import CRDT, { generateSite } from 'crdt-woot';
import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';
import './App.css';

const { start, end, siteId } = generateSite();
const editor = new CRDT(start, end, siteId);

function App() {
  const [value, setValue] = useState('');

  /*
  const insert = (
    chars: String,
    startIndex: number,
    attributes: object,
    source: string
  ) => {
    //console.log('insert: ', startIndex, ' ', chars)
    let index = startIndex;
    for (let i in chars) {
      let char = chars[i];
      let crdtIndex = this.state.history.getRelativeIndex(index);
      // this.state.history.insert(crdtIndex[0].index, crdtIndex[1].index, char, attributes, source);
      index += 1;
    }
  };

  remoteInsert = (index: number, char: Char) => {
    if (this.reactQuillRef.current) {
      this.reactQuillRef.current.getEditor().insertText(index, char.char, {
        'italic': char.italic,
        'bold': char.bold,
        'underline': char.underline,
      }, "silent");
    }


  const deleteCharacters = (startIndex: number, length: number, source: string) => {
    //console.log('delete: ', startIndex, length)
    let index = startIndex;
    for (let i = 0; i < length; i++) {
      try {
        // let chars = this.state.history.getRelativeIndex(index);
        // this.state.history.delete(chars[1], source);
      } catch {
        alert("failed to find relative index");
      }
    }
  }
  */

  const inspectDelta = (ops: any, index: number, source: string) => {
    if (ops['insert'] != null) {
      //console.log('INSERT', ' RANGE: ', this.state.selectedRange);
      let chars = ops['insert'];
      let attributes = ops['attributes'];
      console.log(chars, index, attributes, source);
      editor.generateIns(index, chars);
      // insert(chars, index, attributes, source);
    } else if (ops['delete'] != null) {
      let len = ops['delete'];
      console.log('DELETE: ', index, len, source);
      let itemsRemaining = len;
      console.log(len, itemsRemaining);
      while (itemsRemaining > 0) {
        console.log('deleting at ', index + itemsRemaining);
        editor.generateDel(index + itemsRemaining - 1);
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
    console.log(editor.getState());
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
        <ReactQuill theme="snow" value={value} onChange={onChange} />
      </div>
    </div>
  );
}

export default App;
