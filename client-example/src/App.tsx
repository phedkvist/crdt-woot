import React, { useState } from 'react';
import './App.css';
import Editor from './components/Editor';
import CRDT, { generateSite, types } from 'crdt-woot';

const { start, end } = generateSite('A');

const print = false;

export interface Site {
  siteId: string;
  isOnline: boolean;
  model?: CRDT;
}

function App() {
  const [siteA, setSiteA] = useState<Site>({ siteId: 'a', isOnline: true });
  const [siteB, setSiteB] = useState<Site>({ siteId: 'b', isOnline: true });

  const toggleOnline = (
    site: Site,
    setSite: React.Dispatch<React.SetStateAction<Site>>,
    otherSite: Site
  ) => {
    const isComingOnline = !site.isOnline;
    if (isComingOnline) {
      // notify other site about the update.
      otherSite.isOnline && otherSite.model?.main();

      // process updates from other sites
      otherSite.isOnline && site.model?.main();
    }
    setSite({ ...site, isOnline: !site.isOnline });
  };

  const updateListeners = (
    payload: types.Payload,
    fromSite: Site,
    otherSite: Site
  ) => {
    otherSite.model?.reception(payload);
    fromSite.isOnline && otherSite.isOnline && otherSite.model?.main();
  };
  return (
    <div className="App">
      <button onClick={() => toggleOnline(siteA, setSiteA, siteB)}>
        a {siteA.isOnline ? 'Online' : 'Offline'}
      </button>
      <Editor
        setListener={(model: CRDT) => setSiteA({ ...siteA, model })}
        updateListeners={(payload: types.Payload) =>
          updateListeners(payload, siteA, siteB)
        }
        site={siteA}
        start={start}
        end={end}
      />
      <button onClick={() => toggleOnline(siteB, setSiteB, siteA)}>
        b {siteB.isOnline ? 'Online' : 'Offline'}
      </button>
      <Editor
        setListener={(model: CRDT) => setSiteB({ ...siteB, model })}
        updateListeners={(payload: types.Payload) =>
          updateListeners(payload, siteB, siteA)
        }
        site={siteB}
        start={start}
        end={end}
      />
    </div>
  );
}

export default App;
