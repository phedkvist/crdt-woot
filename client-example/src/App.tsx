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
  const [siteA, setSiteA] = useState<Site>({ siteId: 'Alice', isOnline: true });
  const [siteB, setSiteB] = useState<Site>({ siteId: 'Bob', isOnline: true });

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
      <Links />
      <div className="header">
        <h2>{siteA.siteId}</h2>
        <button
          className={`btn ${siteA.isOnline ? 'online' : 'offline'}`}
          onClick={() => toggleOnline(siteA, setSiteA, siteB)}
        >
          {siteA.isOnline ? 'Online' : 'Offline'}
        </button>
      </div>
      <Editor
        setListener={(model: CRDT) => setSiteA({ ...siteA, model })}
        updateListeners={(payload: types.Payload) =>
          updateListeners(payload, siteA, siteB)
        }
        site={siteA}
        start={start}
        end={end}
      />

      <div className="header">
        <h2>{siteB.siteId}</h2>
        <button
          className={`btn ${siteB.isOnline ? 'online' : 'offline'}`}
          onClick={() => toggleOnline(siteB, setSiteB, siteA)}
        >
          {siteB.isOnline ? 'Online' : 'Offline'}
        </button>
      </div>
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

const Links = () => {
  return (
    <div>
      <h2>CRDT WOOT</h2>
      <a
        className="external-link"
        target="_blank"
        href="https://github.com/phedkvist/crdt-woot"
      >
        Github
      </a>
      <a
        className="external-link"
        target="_blank"
        href="https://hal.inria.fr/inria-00108523/document"
      >
        Research paper
      </a>
      <hr />
    </div>
  );
};

export default App;
