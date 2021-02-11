import React, { useState } from 'react';
import CRDT from '../../src/controller';
import { generateSite } from '../../src/utils';
import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';
import './App.css';

const { start, end, siteId } = generateSite();
const editor = new CRDT(start, end, siteId);

function App() {
  const [value, setValue] = useState('');

  const onChange = (content: string, delta: any, source: any) => {
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
