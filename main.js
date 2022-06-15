const electron = require('electron');
const url = require('url');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const {app, BrowserWindow, Menu, ipcMain, Tray, nativeTheme, dock} = electron;

let mainWindow;
let tray = null
ipcMain.on("installPlugin", async (event,data) =>{
    let result;
    if (process.platform == 'darwin') {
        let { stdout, stderr } = await exec('./cmd/osx/installPluginMac.sh');
        result = stdout.split("\n").slice(2).join("\n")
    } else {
        let { stdout, stderr } = await exec('./cmd/win/installPluginWin.sh');
        result = stdout.split("\n").slice(2).join("\n")
    }
    console.log(result)
    if (Array.from(result)[0] == 'I') {
        event.reply("replyInstallPlugin", true)
    } else {
        event.reply("replyInstallPlugin", false)
    }
})
nativeTheme.on('updated', function theThemeHasChanged () {
    console.log(nativeTheme.shouldUseDarkColors)
})

app.whenReady().then(() => {
  tray = new Tray('./assets/baker-tray-icon.png')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App',
        click:  function(){
            mainWindow.show();
        } 
    },
    { label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q', 
        click:  function(){
            app.quit();
        }
    }
  ])
  tray.setToolTip('Toolkit.')
  tray.setContextMenu(contextMenu)
//   tray.on('click', () => {
//     mainWindow.show();
//     //mainWindow.setAlwaysOnTop(true);
//   });
})
//Listen for app to be ready 
app.on('ready', function() {
    app.dock.setIcon('./assets/baker-dock-icon.png')
    //app.dock.hide()
    //Create new window
    mainWindow = new BrowserWindow({
        width: 350, // here I have set the width and height
        height: 470,
        resizable: true,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'controllers','preload.js')
        }
    });
    //Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views','main.html'),
        protocol: 'file:',
        slashes: true
    }));

    //Build menu form template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu 
    //Menu.setApplicationMenu(mainMenu)
})

//Create menu template 
const mainMenuTemplate = [
    {
        label:'File',
        submenu: [
            {
                label: 'Install plugin',
                click(){
                    if (process.platform == 'darwin') {
                        exec('./sh/installPluginMac.sh', (error, stdout, stderr) => {
                            console.log(stdout.toString());
                            console.log(stderr);
                            if (error !== null) {
                                console.log(`exec error: ${error}`);
                            }
                        });
                    } else {
                        exec('./sh/installPluginWin.sh', (error, stdout, stderr) => {
                            console.log(stdout);
                            console.log(stderr);
                            if (error !== null) {
                                console.log(`exec error: ${error}`);
                            }
                        });
                    }
                }
            },
            {
                label: 'Add item'
            },
            {
                label: 'Close',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            },
        ]
    },
];

//Function 
async function verifyPlugin () {
    if (process.platform == 'darwin') {
        let { stdout, stderr } = await exec('./cmd/osx/verifyPlugin.sh');
        //console.log(stdout)
        let parseResult = stdout.match(/[^\r\n]+/g);
        for (let line of parseResult) {
            if (line.includes("Mockup Baker")) {
                console.log("Installed", line)
            }
        }
        result = stdout.split("\n").slice(2).join("\n")
    } else {
        let { stdout, stderr } = await exec('./cmd/win/verifyPlugin.sh');
        result = stdout.split("\n").slice(2).join("\n")
    }
    //console.log(result)
}