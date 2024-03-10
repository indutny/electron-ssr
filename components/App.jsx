import { useState, useCallback } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  const addOne = useCallback(() => {
    setCount((n) => n + 1);
  }, []);

  const removeOne = useCallback(() => {
    setCount((n) => Math.max(0, n - 1));
  }, []);

  return (
    <div className="main">
      <h3>This runs in main process</h3>

      <p>Current count: {count}</p>

      <electron:renderer
        component="Renderer"
        props={{ count, addOne, removeOne }}
      />
    </div>
  );
}
