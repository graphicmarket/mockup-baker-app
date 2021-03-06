const electron = require("electron");
const url = require("url");
const path = require("path");
const util = require("util");
const fs = require('fs');
const exec = util.promisify(require("child_process").exec);
const { serverStatus } = require("./server/server");
const log = require("electron-log");
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');

log.transports.file.resolvePath = () => path.join(app.getPath("temp"), "originalMockups", "OM.log");
const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  Tray,
  nativeTheme,
  dock,
  nativeImage,
  shell,
  dialog
} = electron;

let mainWindow;
let newPreferenceWindow;
let win = null;
let tray = null;
let status = {
  plugin: null,
  server: null,
};
let store = new Store();

ipcMain.on("closePreferences", async (event, data) => {
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "views", "home", "main.html"),
      protocol: "file:",
      slashes: true,
    })
  );
});

ipcMain.on("getVersion", async (event, data) => {
  event.reply("sendVersion", app.getVersion());
});
ipcMain.on("getIcon", async (event, data) => {
  let path = getResourceAtPath(["assets", `baker-dock-icon.png`]);
  event.reply("sendIconPath", path);
});

ipcMain.on("getPort", async (event, data) => {
  if (!store.get('port')) {
    store.set('port', 8008)
  }
  event.reply("sendPort", store.get('port'));
  event.reply("statusServer", status.server);
});

ipcMain.on("setPort", async (event, data) => {
  console.log(data)
  if (data !== null) {
    store.set('port', data)
    if (status.server) {
      await serverStatus({ server: false });
      await serverStatus({ server: true, port: store.get('port') });
    }
    store.get('port') === data ? event.reply('setPort', true) : event.reply('setPort', false);
  }
});

const getInitialPort = () => {
  if (!store.get('port')) {
    store.set('port', 8008)
  }
};

app.whenReady().then(async () => {
  try {
    tray = new Tray(await getNativeIcon('baker-tray-icon'));
    tray.setToolTip("Mockup Baker App");
    tray.setContextMenu(Menu.buildFromTemplate(menuTrayTemplate));
  } catch (error) {
    log.error(error);
  }
});
app.on("ready", async function () {
  await getInitialPort();
  await validateAplicactionFolder();
  await createFolder();
  await initialTrayIcons();
  await validatePlugin();
  await hideFromDock();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    //app.quit();
  }
});
//Update Theme
nativeTheme.on("updated", async () => {
  try {
    trayImage = await getNativeIcon('baker-tray-icon')
    tray.setImage(trayImage);
    await changeAtributteMenu('plugin', '', 'baker-tray-menu-install-plugin')
    await changeAtributteMenu('server', '', `baker-try-menu-server-${status.server ? 'start' : 'stop'}`)
    await changeAtributteMenu('about', '', 'baker-tray-icon')
    changeMenu()
  } catch (error) {
    log.error(error)
  }
});

const changeMenu = async (event) => {
  switch (event) {
    case "server-on":
      status.plugin = true;
      status.server = true;
      await changeAtributteMenu('server', 'Stop server', 'baker-try-menu-server-start');
      await changeAtributteMenu('plugin', 'Uninstall Plugin');
      break;
    case "server-off":
      status.plugin = false;
      status.server = false;
      await changeAtributteMenu('server', 'Start server', 'baker-try-menu-server-stop')
      await changeAtributteMenu('plugin', 'Install Plugin')
      break;
  }
  tray.setContextMenu(Menu.buildFromTemplate(menuTrayTemplate));
};
const changeAtributteMenu = async (id, label = '', icon = '') => {
  if (label != '') {
    menuTrayTemplate.find((item) => item.id == id).label = label;
  }
  if (icon != '') {
    menuTrayTemplate.find((item) => item.id == id).icon = await getNativeIcon(icon);
  }
}
const validateAplicactionFolder = async () => {
  if (app.isPackaged && process.platform == 'darwin') {
    const result = await app.isInApplicationsFolder()
    if (!result) {
      const dialogOpts = {
        type: 'question',
        buttons: ['Move to Applications', 'Do Not Move'],
        message: 'Move to Applications folder?',
        detail: "Mockup Baker App require to run from the Aplication folder, please move to aplication to continue."
      }
      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
          app.moveToApplicationsFolder()
        } else {
          app.quit()
        }
      });
    }
  }
}
const hideFromDock = async () => {
  if (process.platform == "darwin") {
    app.dock.hide();
  }
};
const initialTrayIcons = async () => {
  await changeAtributteMenu('plugin', '', 'baker-tray-menu-install-plugin')
  await changeAtributteMenu('about', '', 'baker-tray-icon')
}

const validatePlugin = async () => {
  let result = (await execUPA('validate')).stdout.match(/[^\r\n]+/g);
  log.info("Validation Plugin",result)
  for (let line of result) {
    if (
      line.includes("Mockup Baker") &&
      !line.includes("Mockup Baker Assemblers")
    ) {
      changeMenu("server-on");
      await serverStatus({ server: true, port: store.get('port') });
      return;
    }
  }
  changeMenu("server-off");
  await serverStatus({ server: false });
};
const installPlugin = async () => {
  try {
    let result = (await execUPA('install')).stdout.match(/[^\r\n]+/g);
    log.info("Install Plugin",result)
    if (result[1].includes("Installation Successful")) {
      if (!status.server) { await serverStatus({ server: true, port: store.get('port') }) }
      changeMenu("server-on");
    } else {
    }
  } catch (error) {
    log.error(error);
  }
};
const uninstallPlugin = async () => {

  let result = (await execUPA('uninstall')).stdout.match(/[^\r\n]+/g);
  log.info("Uninstall Plugin",result)
  if (result[1].includes("Removal Successful")) {
    changeMenu("server-off");
    await serverStatus({ server: false });
  } else {
  }
};
const execUPA = async (event) => {
  let command = "C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe"
  if (process.platform == 'darwin') {
    command = "/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent"
  }
  switch (event) {
    case 'install':
      let plug_route = getResourceAtPath(["Plugin","234a7e6c_PS.ccx"]);
      return { stdout, stderr } = await exec(`"${command}" ${getUPAextension()}install "${plug_route}"`);
    case 'uninstall':
      return { stdout, stderr } = await exec(`"${command}" ${getUPAextension()}remove "Mockup Baker"`);
    case 'validate':
      return { stdout, stderr } = await exec(`"${command}" ${getUPAextension()}list all`);
  }
}
const getUPAextension = () => {
  return process.platform == 'darwin' ? '--' : '/'
}
const changeServer = async (statusServer) => {
  await serverStatus({ server: statusServer, port: store.get('port') });
  if (statusServer) {
    await changeAtributteMenu('server', 'Stop server', 'baker-try-menu-server-start');
  } else {
    await changeAtributteMenu('server', 'Start server', 'baker-try-menu-server-stop');
  }
  status.server = statusServer;
  if(newPreferenceWindow){
    newPreferenceWindow.webContents.send("statusServer", statusServer);
  }
  changeMenu();
};
const createFolder = async () => {
  let configfile = path.join(app.getPath("temp"), "originalMockups");
  if (!fs.existsSync(configfile)) {
    await fs.mkdirSync(configfile);
  }
}
const deleteFolder = async () => {
  let configfile = path.join(app.getPath("temp"), "originalMockups");
  if (fs.existsSync(configfile)) {
    fs.rmSync(configfile, { recursive: true, force: true });
  }
}
const removeCache = async () => {
  let configfile = path.join(app.getPath("temp"), "originalMockups");
  try {
    await fs.readdir(configfile, (err, files) => {
      if (err) throw err;
    
      for (const file of files) {
        if (/\.(dae|gltf)$/i.test(file)) {
          fs.unlink(path.join(configfile, file), err => {
            if (err) throw err;
          });
        }
      }
    });
    log.info('Cache cleared')
  } catch (error) {
    log.error(error.message)
  }
}
const getResourceAtPath = (params) => {
  // params = [
  //   getResourcePath(),
  //   ...params
  // ];

  return path.join(getResourcePath(), ...params)
}
const getResourcePath = () => {
  return app.isPackaged ? process.resourcesPath : __dirname;
}
const getIconPath = async (iconID) => {
  let theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  return getResourceAtPath(["assets", `${iconID}-${theme}.png`]);
}
const getNativeIcon = async (iconId) => {
  return nativeImage.createFromPath(await getIconPath(iconId)).resize({ width: 16 })
}

const preferencesWindow = (preferencesView) => {
  newPreferenceWindow = new BrowserWindow({
    width: 592,
    height: 346,
    title: 'Mockup Baker',
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preferences', 'js', 'general.js')
    },
  });
  newPreferenceWindow.setMenu(null);

  newPreferenceWindow.loadURL(url.format({
    pathname: path.join(__dirname, `preferences/views/${preferencesView}.html`),
    protocol: 'file',
    slashes: true
  }));
  newPreferenceWindow.on('closed', (evnt) => {
    //evnt.preventDefault();
    //newPreferenceWindow.hide();
    newPreferenceWindow = null;
  });
};

let menuTrayTemplate = [
  {
    label: "About Mockup Baker",
    id: "about",
    enabled: true,
    click: function () {
      if (newPreferenceWindow != undefined) {
        newPreferenceWindow.show()
      } else {
        preferencesWindow('info');
      }
    },
  },
  {
    type: "separator",
  },
  {
    label: "Install Plugin",
    id: "plugin",
    click: function () {
      if (status.plugin == false) {
        installPlugin();
      } else {
        uninstallPlugin();
      }
    },
  },
  {
    label: "Plugins",
    id: "allPlugin",
    visible: false,
    submenu: [
      {
        label: 'Install Mockup Baker Plugin'
      },
      {
        label: 'Install Assembler Plugin'
      },
    ],
  },
  {
    label: "Start Server",
    id: "server",
    click: async function () {
      changeServer(!status.server);
    },
  },
  {
    type: "separator",
  },
  {
    label: "Check for updates",
    id: "updates",
    enabled: false,
    click: function () {
      if (app.isPackaged) {
        autoUpdater.checkForUpdates();
      }
    },
  },
  {
    label: "Preferences",
    id: "preferences",
    enabled: true,
    accelerator: process.platform == "darwin" ? "Command+," : "Ctrl+Q",
    click: () => {
      if (newPreferenceWindow != undefined) {
        newPreferenceWindow.show()
      } else {
        preferencesWindow('general');
      }
    },
  },
  {
    label: "Clear cache",
    id: "cache",
    enabled: true,
    click: function () {
      removeCache()
    },
  },
  {
    label: "Help",
    id: "help",
    click: function () {
      shell.openExternal("https://originalmockups.com");
    },
  },
  {
    type: "separator",
  },
  {
    label: "Quit",
    accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
    click: async function () {
      await deleteFolder()
      app.quit();
    },
  },
];
//Updates 
autoUpdater.on("update-available", (_event, releasesNotes, releaseName) => {
  const dialogOpts = {
    type: "question",
    buttons: ['Ok'],
    title: "Application Update",
    message: "Application Update",
    detail: "A new version is being downloaded."
  }
  dialog.showMessageBox(dialogOpts, (response) => { });
})
autoUpdater.on("update-not-available", (info) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Ok'],
    message: "Application already update",
    detail: 'No new updates.'
  }
  dialog.showMessageBox(dialogOpts, (response) => {

  });
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info("Process download", log_message);
})
autoUpdater.on("update-downloaded", (_event, releasesNotes, releaseName) => {
  const dialogOpts = {
    type: "info",
    buttons: ['Restart', 'Later'],
    title: "Application Updated",
    message: "Notas de versi??n",
    detail: "Restart the application."
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
})
autoUpdater.on('error', (message) => {
  const dialogOpts = {
    type: "warning",
    buttons: [':('],
    title: "Error",
    message: "Error",
    detail: message.message
  }
  dialog.showMessageBox(dialogOpts).then((returnValue) => { });
})