const { ipcRenderer, contextBridge } = require('electron');

let onTreeUpdate;
let callbackCache = new Map();

function addIPCCallbacks(node, newCallbackCache) {
  if (node.type === 'root') {
    return {
      ...node,
      content: node.content.map((child) =>
        addIPCCallbacks(child, newCallbackCache),
      ),
    };
  }

  if (node.type === 'text') {
    return node;
  }

  const { ipc, props, ...rest } = node;

  const mappedIPC = {};
  for (const [key, value] of Object.entries(ipc)) {
    const fn =
      callbackCache.get(value) ??
      ((...originalArgs) => {
        const args = originalArgs.map((arg) => {
          // Filter out SyntheticBaseEvent
          if (typeof arg === 'object' && arg !== null && '_reactName' in arg) {
            return null;
          }

          return arg;
        });

        return ipcRenderer.sendSync('react-ipc:invokeCallback', value, args);
      });
    newCallbackCache.set(value, fn);

    mappedIPC[key] = fn;
  }

  return {
    ...node,
    props: {
      ...props,
      ...mappedIPC,
    },
    content: node.content.map((child) =>
      addIPCCallbacks(child, newCallbackCache),
    ),
  };
}

function prepareTree(tree) {
  const newCallbackCache = new Map();
  const result = addIPCCallbacks(tree, newCallbackCache);
  callbackCache = newCallbackCache;
  return result;
}

ipcRenderer.on('react-ipc:treeUpdate', (_event, tree) => {
  onTreeUpdate?.(prepareTree(tree));
});

contextBridge.exposeInMainWorld('setTreeUpdateListener', async (listener) => {
  onTreeUpdate = listener;
  const initial = await ipcRenderer.invoke('react-ipc:getTree');
  onTreeUpdate(prepareTree(initial));
});
