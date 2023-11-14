import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

let isToggle = true;

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },
  toggle(channel: string, value1: unknown, value2: unknown) {
    if (isToggle) {
      ipcRenderer.send(channel, value1);
      isToggle = false;
    } else {
      ipcRenderer.send(channel, value2);
      isToggle = true;
    }
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
