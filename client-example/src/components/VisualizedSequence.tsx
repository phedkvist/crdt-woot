import React from 'react';
import CRDT, { types } from 'crdt-woot';
import './VisualizedSequence.css';

export const VisualizedSequence = ({
  sequence,
}: {
  sequence: types.Char[];
}) => {
  console.log('sequence: ', sequence);
  return (
    <div className="sequence-container">
      {sequence.map((c, i) => (
        <div
          key={c.id}
          className={`char ${c.visible ? '' : 'tombstone'} ${
            c.value === ' ' ? 'space' : ''
          } ${i === 0 ? 'first' : ''}`}
        >
          {c.value}
        </div>
      ))}
    </div>
  );
};
