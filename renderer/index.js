import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { createRoot } from 'react-dom/client';
import Renderer from '../components/Renderer.jsx';

const CLIENT_COMPONENTS = {
  Renderer,
};

const root = createRoot(document.getElementById('root'));

function convertTree(node) {
  if (node.type === 'root') {
    if (node.content.length === 0) {
      return null;
    }

    if (node.content.length === 1) {
      return convertTree(node.content[0]);
    }

    return jsxs(Fragment, {
      children: node.content.map(convertTree),
    });
  }

  if (node.type === 'text') {
    return node.value;
  }

  if (node.type === 'client-node') {
    return jsx(CLIENT_COMPONENTS[node.component], node.props);
  }

  if (node.content.length === 0) {
    return jsx(node.tag, node.props);
  }

  if (node.content.length === 1) {
    return jsx(node.tag, {
      ...node.props,
      children: convertTree(node.content[0]),
    });
  }

  return jsxs(node.tag, {
    ...node.props,
    children: node.content.map(convertTree),
  });
}

window.setTreeUpdateListener((tree) => {
  root.render(convertTree(tree));
});
