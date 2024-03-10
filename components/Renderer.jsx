import { useState, useCallback } from 'react';

export default function Renderer(props) {
  const { count, addOne, removeOne } = props;

  const [local, setLocal] = useState(0);

  const addLocal = useCallback(() => {
    setLocal((n) => n + 1);
  }, []);

  const removeLocal = useCallback(() => {
    setLocal((n) => Math.max(0, n - 1));
  }, []);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="renderer">
      <h3>This runs in renderer process</h3>

      <section className="controls">
        <button onClick={addOne}>Add globally</button>
        <button onClick={removeOne}>Remove globally</button>
      </section>

      <section className="controls">
        <button onClick={addLocal}>Add locally</button>
        <button onClick={removeLocal}>Remove locally</button>
      </section>

      {local + count > 5 ? (
        <div>
          <b>You clicked so much</b>
        </div>
      ) : null}

      <section className="results">
        <div>Global Count: {count}</div>
        <div>Local Count: {local}</div>
      </section>

      <button onClick={reload}>Reload Window</button>
    </div>
  );
}
