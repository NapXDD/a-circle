import {
  screen,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Rectangle,
  ipcMain,
} from "electron";
import Store from "electron-store";

export const createWindow = (
  windowName: string,
  options: BrowserWindowConstructorOptions
): BrowserWindow => {
  const key = "window-state";
  const name = `window-state-${windowName}`;
  const store = new Store<Rectangle>({ name });
  const defaultSize = {
    width: options.width,
    height: options.height,
  };
  let state: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = { x: 0, y: 0, width: 500, height: 500 };

  const restore = () => store.get(key, defaultSize);

  const getCurrentPosition = () => {
    const position = win.getPosition();
    const size = win.getSize();
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    };
  };

  const windowWithinBounds = (windowState, bounds) => {
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    );
  };

  const resetToDefaults = () => {
    const bounds = screen.getPrimaryDisplay().bounds;
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2,
    });
  };

  const ensureVisibleOnSomeDisplay = (windowState) => {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(windowState, display.bounds);
    });
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults();
    }
    return windowState;
  };

  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition());
    }
    store.set(key, state);
  };

  state = ensureVisibleOnSomeDisplay(restore());

  const win = new BrowserWindow({
    ...state,
    ...options,
    resizable: false,
    // useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      ...options.webPreferences,
    },
    frame: false,
    transparent: true,
  });

  win.setBounds({
    width: win.getSize()[0],
    height: win.getSize()[1],
    x: state.x,
    y: state.y,
  });

  ipcMain.handle("setnewpos", async (event, args: { x: number; y: number }) => {
    win.setBounds({
      x: state.x + args.x,
      y: state.y + args.y,
    });
  });

  ipcMain.handle(
    "settlenewpos",
    async (event, args: { x: number; y: number }) => {
      state.x += args.x;
      state.y += args.y;
    }
  );

  ipcMain.on(
    "settlemergency",
    async (event, args: { x: number; y: number }) => {
      state.x += args.x;
      state.y += args.y;
    }
  );

  win.on("close", saveState);

  return win;
};
