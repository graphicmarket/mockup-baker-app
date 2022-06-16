const electron = require('electron');
const url = require('url');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { app, BrowserWindow, Menu, ipcMain, Tray, nativeImage } = electron;

let mainWindow;
let tray = null;
ipcMain.on('msg', async (event, data) => {
  let result;
  if (process.platform == 'darwin') {
    let { stdout, stderr } = await exec('./cmd/installPluginMac.sh');
    result = stdout.split('\n').slice(2).join('\n');
  } else {
    let { stdout, stderr } = await exec('./cmd/installPluginWin.sh');
    result = stdout.split('\n').slice(2).join('\n');
  }
  console.log(result);
  if (Array.from(result)[0] == 'I') {
    event.reply('replyInstallPlugin', true);
  } else {
    event.reply('replyInstallPlugin', false);
  }
});

app.whenReady().then(() => {
  tray = new Tray('./assets/baker-min.png');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Minimize',
      click: function () {
        mainWindow.minimize();
      },
    },
    {
      label: 'Quit',
      accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
      click: function () {
        app.quit();
      },
    },
  ]);
  tray.setToolTip('Toolkit.');
  //tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true);
  });
});
//Listen for app to be ready
app.on('ready', function () {
  //Create new window
  mainWindow = new BrowserWindow({
    width: 350, // here I have set the width and height
    height: 450,
    resizable: true,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'controllers', 'preload.js'),
    },
  });
  //Load html into window
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'views', 'main.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  //Build menu form template
  const mainMenu = Menu.buildFromTemplate(template);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);
});

//Create menu template
const template = [
  // { role: 'appMenu' }
  ...(process.platform == 'darwin'
    ? [
        {
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            {
              label: 'preferences',
              click: () => {
                loadPreferences();
              },
            },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
      ]
    : []),
  {
    role: 'help',
    submenu: [
      {
        label: 'help online',
        click: async () => {
          const { shell } = require('electron');
          await shell.openExternal('https://electronjs.org');
        },
      },
    ],
  },
];

let windowPreferences = null;
const loadPreferences = () => {
  windowPreferences = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    show: false,
    width: 400,
    height: 250,
    resizable: true,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  windowPreferences.loadURL(
    url.format({
      pathname: path.join(__dirname, 'views', 'preferences.html'),
      protocol: 'file:',
      slashes: true,
    })
  );
  windowPreferences.setMenu(null);
  windowPreferences.once('ready-to-show', () => {
    windowPreferences.show();
  });
};
