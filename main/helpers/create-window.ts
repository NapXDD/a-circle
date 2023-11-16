import {
  screen,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Rectangle,
  ipcMain,
} from "electron";
import Store from "electron-store";

let earlyX: number, earlyY: number;
let newX: number, newY: number;

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
  let state = {};
  let display = screen.getPrimaryDisplay();
  let widtho = display.bounds.width;
  let heighto = display.bounds.height;
  let wind_height = 330;
  let wind_width = 376;
  let minusX = 608;
  let minusY = 376;

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
    useContentSize: true,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      ...options.webPreferences,
    },
    frame: false,
    transparent: true,
  });

  earlyX = widtho - minusX;
  earlyY = heighto - minusY;

  win.setBounds({
    width: win.getSize()[0],
    height: win.getSize()[1],
    x: earlyX,
    y: earlyY,
  });

  win.setAspectRatio(16 / 9);

  ipcMain.handle("setnewpos", async (event, args: { x: number; y: number }) => {
    win.setBounds({
      width: wind_width || win.getSize()[0],
      height: wind_height,
      x: earlyX + args.x,
      y: earlyY + args.y,
    });
    newX = earlyX + args.x;
    newY = earlyY + args.y;
    if (wind_width === 0) {
      wind_width = Math.ceil((wind_height * 16) / 9);
    }
  });

  ipcMain.handle(
    "settlenewpos",
    async (event, args: { x: number; y: number }) => {
      earlyX += earlyX + args.x;
      earlyY += earlyY + args.y;
      newX = earlyX;
      newY = earlyY;
    }
  );

  ipcMain.on("settlemergency", () => {
    earlyX = newX;
    earlyY = newY;
  });

  win.on("will-resize", (event, newBounds) => {
    earlyX = newBounds.x;
    earlyY = newBounds.y;
    newX = earlyX;
    newY = earlyY;
    wind_height = newBounds.height;
    wind_width = newBounds.width;
  });

  win.on("close", saveState);

  return win;
};
