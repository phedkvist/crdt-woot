import React, { useState } from 'react';
import './App.css';
import Editor from './components/Editor';
import CRDT, { generateSite, types } from 'crdt-woot';

const { start, end } = generateSite('A');

const print = false;

function App() {
  const [listeners, setListeners] = useState<CRDT[]>([]);

  const updateListeners = (payload: types.Payload, fromSiteId: string) => {
    const siteId = payload.char.charId.siteId;

    listeners.forEach((l) => {
      if (l.site.siteId !== fromSiteId) {
        l.reception(payload);
        l.main(print);
      }
    });
  };
  return (
    <div className="App">
      <Editor
        setListener={(l: CRDT) => setListeners([...listeners, l])}
        updateListeners={updateListeners}
        siteId={'A'}
        start={start}
        end={end}
      />
      {/* Silly hack to make sure the setListeners state doesn't overwrite each other on first state update */}
      {listeners.length > 0 && (
        <Editor
          setListener={(l: CRDT) => setListeners([...listeners, l])}
          updateListeners={updateListeners}
          siteId={'B'}
          start={start}
          end={end}
        />
      )}
    </div>
  );
}

export default App;
