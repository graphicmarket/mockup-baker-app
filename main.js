const electron = require("electron");
const url = require("url");
const path = require("path");
const util = require("util");
const fs = require('fs');
const exec = util.promisify(require("child_process").exec);
const { serverStatus } = require("./server/server");
const log = require("electron-log");
const { autoUpdater } = require('electron-updater');
const isDev = require("electron-is-dev");
log.transports.file.resolvePath = () => path.join(app.getPath("temp"), "originalMockups" ,"log.js");

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
} = electron;

let mainWindow;
let win = null;
let tray = null;
let status = {
  plugin: null,
  server: null,
};

ipcMain.on("showFloatMenu", async (event, data) => {
  menuFLoat.popup(mainWindow);
});
ipcMain.on("closePreferences", async (event, data) => {
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "views", "home", "main.html"),
      protocol: "file:",
      slashes: true,
    })
  );
});
ipcMain.on("installPlugin", async (event, data) => {
  let result;
  if (process.platform == "darwin") {
    let { stdout, stderr } = await exec("./cmd/osx/installPluginMac.sh");
    result = stdout.match(/[^\r\n]+/g);
  } else {
    plug_route = path.join(__dirname, "Plugin", "234a7e6c_PS.ccx");
    let { stdout, stderr } = await exec(
      '"C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe" /install ' +
        plug_route
    );
    result = stdout.match(/[^\r\n]+/g);
  }
  if (result[1].includes("Installation Successful")) {
    event.reply("replyInstallPlugin", true);
    changeMenu("server-on");
  } else {
    event.reply("replyInstallPlugin", false);
  }
});
ipcMain.on("uninstallPlugin", async (event, data) => {
  let parseResult;
  if (process.platform == "darwin") {
    let { stdout, stderr } = await exec("./cmd/osx/uninstallPluginMac.sh");
    parseResult = stdout.match(/[^\r\n]+/g);
  } else {
    let { stdout, stderr } = await exec(
      '"C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe" /remove "Mockup Baker"'
    );
    parseResult = stdout.match(/[^\r\n]+/g);
  }
  if (parseResult[1].includes("Removal Successful")) {
    event.reply("replyUninstallPlugin", true);
    changeMenu("server-off");
  } else {
    event.reply("replyUninstallPlugin", false);
  }
});
ipcMain.on("validatePlugin", async (event, data) => {
  let parseResult;
  if (process.platform == "darwin") {
    let { stdout, stderr } = await exec("./cmd/osx/verifyPlugin.sh");
    parseResult = stdout.match(/[^\r\n]+/g);
  } else {
    let { stdout, stderr } = await exec(
      '"C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe" /list all'
    );
    parseResult = stdout.match(/[^\r\n]+/g);
  }
  for (let line of parseResult) {
    if (
      line.includes("Mockup Baker") &&
      !line.includes("Mockup Baker Assemblers")
    ) {
      event.reply("replyValidatePlugin", true);
      changeMenu("server-on");
      await serverStatus({ server: true });
      return;
    }
  }
  event.reply("replyValidatePlugin", false);
  changeMenu("server-off");
  await serverStatus({ server: false });
});

app.whenReady().then(async () => {
  try {
    tray = new Tray(
      nativeImage
        .createFromPath(await validateThemeIcon())
        .resize({ width: 16 })
    );
    tray.setToolTip("Mockup Baker App");
    tray.setContextMenu(Menu.buildFromTemplate(menuTrayTemplate));
  } catch (error) {
    log.error(error);
  }
});
app.on("ready", async function () {
  //Create new window
  // mainWindow = new BrowserWindow({
  //     width: 350, // here I have set the width and height
  //     height: 490,
  //     resizable: true,
  //     fullscreenable: false,
  //     webPreferences: {
  //         nodeIntegration: true,
  //         contextIsolation: false,
  //         preload: path.join(__dirname, 'controllers','preload.js')
  //     },
  // });
  await createFolder();
  await validatePlugin();
  //mainWindow.webContents.openDevTools({ mode: 'detach' });
  await hideFromDock();
  //Load html into window
  // mainWindow.loadURL(url.format({
  //     pathname: path.join(__dirname, 'views','home','main.html'),
  //     protocol: 'file:',
  //     slashes: true
  // }));
  if(!isDev){
    console.log('not in dev')
    autoUpdater.checkForUpdates();
  }
});

//Update Theme
nativeTheme.on("updated", () => {
  if (nativeTheme.shouldUseDarkColors) {
    trayImage = app.isPackaged
    ? path.join(process.resourcesPath, "assets","baker-tray-icon-light.png")
    : path.join(__dirname, `assets/baker-tray-icon-light.png`);
    tray.setImage(trayImage);
  } else {
    trayImage = app.isPackaged
    ? path.join(process.resourcesPath,"assets","baker-tray-icon.png")
    : path.join(__dirname, `assets/baker-tray-icon.png`);
    tray.setImage(trayImage);
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
const changeMenu = async (event) => {
  switch (event) {
    case "server-on":
      status.plugin = true;
      status.server = true;
      menuTrayTemplate.find((item) => item.id == "server").label =
        "Stop Server";
      menuTrayTemplate.find((item) => item.id == "plugin").label =
        "Uninstall Plugin";
      break;
    case "server-off":
      status.plugin = false;
      status.server = false;
      menuTrayTemplate.find((item) => item.id == "server").label =
        "Start Server";
      menuTrayTemplate.find((item) => item.id == "plugin").label =
        "Install Plugin";
      break;
  }
  tray.setContextMenu(Menu.buildFromTemplate(menuTrayTemplate));
};
const hideFromDock = async () => {
  if (process.platform == "darwin") {
    app.dock.hide();
  } else {
    mainWindow.setSkipTaskbar(true);
  }
};
let menuTrayTemplate = [
  {
    label: "About Mockup Baker..",
    enabled: false,
    icon: nativeImage
      .createFromPath(
        nativeTheme.shouldUseDarkColors
          ? app.isPackaged
            ? path.join(
                process.resourcesPath,
                "assets",
                "baker-tray-icon-light.png"
              )
            : path.join(__dirname, `assets/baker-tray-icon-light.png`)
          : app.isPackaged
          ? path.join(process.resourcesPath, "assets", "baker-tray-icon.png")
          : path.join(__dirname, `assets/baker-tray-icon.png`)
      )
      .resize({ width: 16 }),
    click: function () {},
  },
  {
    type: "separator",
  },
  {
    label: "Install Plugin",
    id: "plugin",
    click: function () {
      log.info(status.plugin);
      if (status.plugin == false) {
        installPlugin();
      } else {
        uninstallPlugin();
      }
    },
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
    label: "Help",
    id: "help",
    click: function () {
      shell.openExternal("https://originalmockups.com");
    },
  },
  {
    label: "Check for updates",
    id: "updates",
    enabled: false,
    click: function () {
      autoUpdater.checkForUpdates();
    },
  },
  {
    label: "Preferences",
    id: "preferences",
    enabled: false,
    accelerator: process.platform == "darwin" ? "Command+," : "Ctrl+Q",
    click: function () {},
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
const validatePlugin = async () => {
  let parseResult;
  if (process.platform == "darwin") {
    let { stdout, stderr } = await exec(
      '"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" --list all'
    );
    parseResult = stdout.match(/[^\r\n]+/g);
  } else {
    let { stdout, stderr } = await exec(
      '"C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe" /list all'
    );
    parseResult = stdout.match(/[^\r\n]+/g);
  }
  for (let line of parseResult) {
    if (
      line.includes("Mockup Baker") &&
      !line.includes("Mockup Baker Assemblers")
    ) {
      changeMenu("server-on");
      await serverStatus({ server: true });
      return;
    }
  }
  changeMenu("server-off");
  await serverStatus({ server: false });
};
const installPlugin = async () => {
  try {
    let result;
    let plug_route = app.isPackaged
        ? path.join(process.resourcesPath, "Plugin","234a7e6c_PS.ccx")
        : path.join(__dirname, "Plugin", "234a7e6c_PS.ccx");
    let plug_dest = path.join(app.getPath("temp"), "originalMockups","234a7e6c_PS.ccx")
    fs.copyFile(plug_route, plug_dest, (err) => {
        if (err) throw err;
        console.log('source.txt was copied to destination.txt');
        });
    log.info(plug_route)
    if (process.platform == "darwin") {
      let { stdout, stderr } = await exec(
        '"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" --install ' +
        plug_dest
      );
      result = stdout.match(/[^\r\n]+/g);
    } else {
      let { stdout, stderr } = await exec(
        '"C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe" /install ' +
        plug_dest
      );
      result = stdout.match(/[^\r\n]+/g);
    }
    log.info(result)
    if (result[1].includes("Installation Successful")) {
      fs.unlinkSync(plug_dest)
      if (!status.server) {await serverStatus({ server: true })}
      changeMenu("server-on");
    } else {
    }
  } catch (error) {
    log.error(error);
  }
};
const uninstallPlugin = async () => {
  let parseResult;
  if (process.platform == "darwin") {
    let { stdout, stderr } = await exec(
      '"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" --remove "Mockup Baker"'
    );
    parseResult = stdout.match(/[^\r\n]+/g);
  } else {
    let { stdout, stderr } = await exec(
      '"C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe" /remove "Mockup Baker"'
    );
    parseResult = stdout.match(/[^\r\n]+/g);
  }
  if (parseResult[1].includes("Removal Successful")) {
    changeMenu("server-off");
    await serverStatus({ server: false });
  } else {
  }
};
const changeServer = async (statusServer) => {
  await serverStatus({ server: statusServer });
  if (statusServer) {
    status.server = true;
    menuTrayTemplate.find((item) => item.id == "server").label = "Stop Server";
  } else {
    status.server = false;
    menuTrayTemplate.find((item) => item.id == "server").label = "Start Server";
  }
  changeMenu();
};
const validateThemeIcon = async () => {
  if (nativeTheme.shouldUseDarkColors) {
    return app.isPackaged
      ? path.join(process.resourcesPath, "assets","baker-tray-icon-light.png")
      : path.join(__dirname, `assets/baker-tray-icon-light.png`);
  } else {
    return app.isPackaged
      ? path.join(process.resourcesPath,"assets","baker-tray-icon.png")
      : path.join(__dirname, `assets/baker-tray-icon.png`);
  }
};
const createFolder = async () => {
    let configfile = path.join(app.getPath("temp"), "originalMockups");
    if (!fs.existsSync(configfile)){
        await fs.mkdirSync(configfile);
    }
}
const deleteFolder = async () => {
    let configfile = path.join(app.getPath("temp"), "originalMockups");
    fs.rmSync(configfile, { recursive: true, force: true });
}
//Updates 
autoUpdater.on("update-available", (_event, releasesNotes, releaseName) =>{
  const dialogOpts = {
      type: "info",
      buttons: ['Ok'],
      title: "Application Update",
      message: "Notas de versión",
      detail: "A new version is being downloaded."
  }

  dialog.showMessageBox(dialogOpts, (response) => {});
})
// autoUpdater.on("update-not-available", (info) => {
//   const dialogOpts = {
//       type: 'info',
//       buttons: ['Ok'],
//       title: 'Application already update',
//       message: "Yay",
//       detail: 'No new updates.'
//     }
//     dialog.showMessageBox(dialogOpts, (response) => {

//     });
// });
autoUpdater.on("update-downloaded", (_event, releasesNotes, releaseName) => {
  const dialogOpts = {
      type: "info",
      buttons: ['Restart', 'Later'],
      title: "Application Update",
      message: "Notas de versión",
      detail: "Restart the application."
  }
  
  dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if(returnValue.response === 0) autoUpdater.quitAndInstall();
  });
})

autoUpdater.on('error', (message) => {
  const dialogOpts = {
      type: "info",
      buttons: [':('],
      title: "Error",
      message: "Error",
      detail: message.message
  }
  
  dialog.showMessageBox(dialogOpts).then((returnValue) => {});
})