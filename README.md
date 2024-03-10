# electron-ssr

**This is an educational project, please don't use it in production**

In this experiment I tried to extend the idea of React's
[Server-Side Rendering](https://react.dev/reference/react/use-client) (SSR), and
transplant it into the dichotomy of Main and Renderer processes in
[Electron](https://www.electronjs.org/).

## Why?

Just for fun!

## How it works?

Unlike in a plain node.js server it is possible to maintain a persistent react
virtual DOM state in the main process of the Electron. Therefore it isn't
necessary to send over the html and perform hydration on the client as it'd be
typically done in SSR, and instead main process can send the pre-rendered
react tree and let renderer hydrate only specific child components.

Since main and renderer processes can only communicate between each other
through IPC, the component/element callbacks has to be translated on the fly and
mapped to their original functions via IPC calls.

## TODO

- [x] Reconciliate tree in the main
- [x] Wrap callbacks with ipc calls
- [x] Client components
- [ ] Syntax sugar for client components ('use client' and so forth)

## Running

```sh
npm install
npm build
npm start
```

Fun tips: try refreshing the page in renderer's Dev Tools! It preserves the
state.

## LICENSE

This software is licensed under the MIT License.
