import { useState, useCallback } from 'react';

let t;

export default function App() {
  const [count, setCount] = useState(0);

  const addOne = useCallback(() => {
    setCount((n) => n + 1);
  }, []);

  const removeOne = useCallback(() => {
    setCount((n) => Math.max(0, n - 1));
  }, []);

  return (
    <div className={count > 5 ? 'red' : null}>
      <h1>React in Main Process</h1>

      <section className="controls">
        <button onClick={addOne}>Add one</button>
        <button onClick={removeOne}>Remove one</button>
      </section>

      <section className="results">
        {count > 5 ? <div>You clicked so much</div> : null}

        <div>Times clicked: {count}</div>
      </section>
    </div>
  );
}
