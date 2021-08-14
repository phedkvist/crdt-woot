import React, { useState } from 'react';
import './App.css';
import Editor from './components/Editor';
import CRDT, { generateSite, types } from 'crdt-woot';

const { start, end } = generateSite('A');

function App() {
  const [listeners, setListeners] = useState<CRDT[]>([]);

  const updateListeners = (payload: types.Payload) => {
    const siteId = payload.char.charId.siteId;
    /*console.log('SITE ID: ', siteId);
    console.log(
      'Listeners: ',
      listeners.map((c) => c.site.siteId)
    );*/
    listeners.forEach((l) => {
      if (l.site.siteId !== siteId) {
        l.reception(payload);
        l.main(true);
        /*console.log(
          'SENT PAYLOAD TO',
          l.site.siteId,
          ', FROM: ',
          siteId,
          ', VAL: ',
          payload.char.value
        );*/
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
