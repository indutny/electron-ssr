import { createElement } from 'react';
import Reconciler from 'react-reconciler';
import {
  ConcurrentRoot,
  DefaultEventPriority,
} from 'react-reconciler/constants.js';

function createTextInstance(value) {
  return { type: 'text', value };
}

function appendChild(parent, child) {
  parent.content.push(child);
}

function insertBefore(parent, child, before) {
  const index = parent.content.indexOf(before);
  if (index === -1) {
    throw new Error('Before node not found');
  }
  parent.content.splice(index, 0, child);
}

function removeChild(parent, child) {
  const index = parent.content.indexOf(child);
  if (index !== -1) {
    parent.content.splice(index, 1);
  }
}

function clearContainer(container) {
  container.content.length = 0;
}

function commitTextUpdate(node, oldText, newText) {
  node.value = newText;
}

function commitUpdate(instance, { ipc, props }) {
  instance.ipc = ipc;
  instance.props = props;
}

const CONFIG = {
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  // Shared
  getPublicInstance: (instance) => instance,
  getRootHostContext: () => null,
  getChildHostContext: (parentHostContext) => parentHostContext,
  prepareForCommit: () => null,
  resetAfterCommit: () => null,
  shouldSetTextContent: () => false,
  finalizeInitialChildren: () => false,
  createTextInstance,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: undefined,
  isPrimaryRenderer: true,
  warnsIfNotActing: true,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: () => null,
  afterActiveInstanceBlur: () => null,
  preparePortalMount: () => null,
  prepareScopeUpdate: () => null,
  getInstanceFromScope: () => null,
  getCurrentEventPriority: () => DefaultEventPriority,

  // Mutation
  appendInitialChild: appendChild,
  appendChild,
  appendChildToContainer: appendChild,
  commitTextUpdate,
  commitUpdate,
  insertBefore,
  insertInContainerBefore: insertBefore,
  removeChild,
  removeChildFromContainer: removeChild,
  clearContainer,

  // Technically part of mutation, but only run with suspense
  hideInstance: () => {
    throw new Error('Suspense is not supported');
  },
  hideTextInstance: () => {
    throw new Error('Suspense is not supported');
  },
  unhideInstance: () => {
    throw new Error('Suspense is not supported');
  },
  unhideTextInstance: () => {
    throw new Error('Suspense is not supported');
  },
  resetTextContext: () => {
    throw new Error('shouldSetTextContent returns false');
  },
  commitMount: () => {
    throw new Error('finalizeInitialChildren is false');
  },
};

export default class ReactIPC {
  #root = { type: 'root', content: [] };

  #reconciler = Reconciler({
    ...CONFIG,

    resetAfterCommit: () => this.#resetAfterCommit(),

    createInstance: (tag, props) => this.#createInstance(tag, props),
    prepareUpdate: (instance, _type, _oldProps, newProps) => {
      return this.#prepareUpdate(instance, newProps);
    },
    detachDeletedInstance: (instance) => this.#detachDeletedInstance(instance),
  });

  #container = this.#reconciler.createContainer(
    this.#root,
    ConcurrentRoot,
    /* hydrationCallbacks */
    null,
    /* isStrictMode */
    false,
    /* concurrentUpdatesByDefaultOverride */
    null,
    /* identifierPrefix */
    '',
    /* onRecoverableError */
    (error) => console.error('Recoverable error', error),
    /* transitionCallbacks */
    null,
  );

  #webContents;

  #callbackToId = new WeakMap();
  #idToCallbackEntry = new Map();
  #nextCallbackId = 0n;

  constructor(webContents) {
    this.#webContents = webContents;

    const { ipc } = webContents;

    ipc.handle('react-ipc:getTree', () => {
      return this.#getTree();
    });

    ipc.on('react-ipc:invokeCallback', (event, id, args) => {
      event.returnValue = this.#invokeCallback(id, args);
    });
  }

  render(elem, callback) {
    this.#reconciler.updateContainer(elem, this.#container, null, () => {
      callback?.();
    });
  }

  #getTree() {
    return this.#root;
  }

  #invokeCallback(id, args) {
    const entry = this.#idToCallbackEntry.get(id);
    if (entry === undefined) {
      throw new Error(`IPC callback ${id} not found`);
    }

    return entry.fn(...args);
  }

  #resetAfterCommit() {
    this.#webContents.send('react-ipc:treeUpdate', this.#root);
  }

  #createInstance(tag, inputProps) {
    const { ipc, props } = this.#convertProps(inputProps);

    return {
      type: 'node',
      tag,
      ipc,
      props,
      content: [],
    };
  }

  #prepareUpdate(instance, newProps) {
    this.#invalidateIPCProps(instance.ipc);
    return this.#convertProps(newProps);
  }

  #detachDeletedInstance(instance) {
    this.#invalidateIPCProps(instance.ipc);
  }

  #convertProps(props) {
    const result = {
      props: {},
      ipc: {},
    };

    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'function') {
        result.ipc[key] = this.#registerCallback(value);
      } else if (key !== 'children') {
        result.props[key] = value;
      }
    }
    return result;
  }

  #invalidateIPCProps(ipc) {
    for (const [key, value] of Object.entries(ipc)) {
      this.#unregisterCallback(value);
    }
  }

  #registerCallback(fn) {
    let id = this.#callbackToId.get(fn);
    if (id === undefined) {
      id = this.#nextCallbackId.toString();
      this.#nextCallbackId += 1n;
      this.#callbackToId.set(fn, id);
    }

    let entry = this.#idToCallbackEntry.get(id);
    if (entry === undefined) {
      entry = {
        refs: 0,
        fn,
      };
      this.#idToCallbackEntry.set(id, entry);
    }
    entry.refs += 1;

    return id;
  }

  #unregisterCallback(id) {
    const entry = this.#idToCallbackEntry.get(id);
    if (entry === undefined) {
      throw new Error(`IPC callback ${id} not found`);
    }

    entry.refs -= 1;
    if (entry.refs === 0) {
      this.#idToCallbackEntry.delete(id);
      // Intentionally not deleting from #callbackToId
    }
  }
}
