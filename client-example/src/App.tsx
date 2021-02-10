import React, { useState } from 'react';
// import crdt from 'crdt-woot';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';

function App() {
  const [value, setValue] = useState('');

  return (
    <div className="App">
      <div className="editor">
        <ReactQuill theme="snow" value={value} onChange={setValue} />
      </div>
    </div>
  );
}

export default App;
