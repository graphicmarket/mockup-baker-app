const electron = require('electron');
const url = require('url');
const path = require('path');
const util = require('util');
const { MenuItem } = require('electron');
const exec = util.promisify(require('child_process').exec);

const {app, BrowserWindow, Menu, ipcMain, Tray, nativeTheme, dock} = electron;

let mainWindow;
let tray = null;
let menuFLoat = new Menu();

ipcMain.on("showFloatMenu", async (event,data) =>{
    menuFLoat.popup(mainWindow)
})
ipcMain.on("closePreferences", async (event,data) =>{
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views','home','main.html'),
        protocol: 'file:',
        slashes: true
    }));
})
ipcMain.on("installPlugin", async (event,data) =>{
    let result;
    if (process.platform == 'darwin') {
        let { stdout, stderr } = await exec('./cmd/osx/installPluginMac.sh');
        result = stdout.match(/[^\r\n]+/g)
    } else {
        plug_route = path.join(__dirname, 'Plugin', '234a7e6c_PS.ccx')
        let { stdout, stderr } = await exec('"C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe" /install ' + plug_route);
        result = stdout.match(/[^\r\n]+/g)
    }
    if(result[1].includes('Installation Successful')){
        event.reply("replyInstallPlugin", true)
    }else{
        event.reply("replyInstallPlugin", false)
    }
})
ipcMain.on("uninstallPlugin", async (event,data) =>{
    let parseResult;
    if (process.platform == 'darwin') {
        let { stdout, stderr } = await exec('./cmd/osx/uninstallPluginMac.sh');
        parseResult = stdout.match(/[^\r\n]+/g);
    } else {
        plug_route = path.join(__dirname, 'Plugin', '234a7e6c_PS.ccx')
        let { stdout, stderr } = await exec('"C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe" /remove "Mockup Baker"');
        parseResult = stdout.match(/[^\r\n]+/g)
    }
    if(parseResult[1].includes('Removal Successful')){
        event.reply("replyUninstallPlugin", true)
    }else{
        event.reply("replyUninstallPlugin", false)
    }
})
ipcMain.on("validatePlugin", async (event,data) =>{
    let parseResult;
    if (process.platform == 'darwin') {
        let { stdout, stderr } = await exec('./cmd/osx/verifyPlugin.sh');
        parseResult = stdout.match(/[^\r\n]+/g);
    } else {
        let { stdout, stderr } = await exec('"C:/Program Files/Common Files/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.exe" /list all');
        parseResult = stdout.match(/[^\r\n]+/g);
    }
    for (let line of parseResult) {
        if (line.includes("Mockup Baker") && !line.includes("Mockup Baker Assemblers")) {
            event.reply("replyValidatePlugin", true)
            return
        }
    }
    event.reply("replyValidatePlugin", false)
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
})
//Listen for app to be ready 
app.on('ready', function() {
    // app.dock.setIcon('./assets/baker-dock-icon.png')
    //Create new window
    mainWindow = new BrowserWindow({
        width: 350, // here I have set the width and height
        height: 490,
        resizable: true,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'controllers','preload.js')
        },
    });
    //hideFromDock()
    //Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views','home','main.html'),
        protocol: 'file:',
        slashes: true
    }));

    //Build menu form template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu 
    //Menu.setApplicationMenu(mainMenu)

    menuFLoat.append(new MenuItem({
        label:'File',
        submenu: [
            {
                label: 'Preferences',
            },
            {
                label: 'Close',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            },
        ]
    }))
    menuFLoat.append(new MenuItem({
        label:'Preferences',
        accelerator: process.platform == 'darwin' ? 'Command+K' : 'Ctrl+K',
        click(){
            mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'views','preferences','preferences.html'),
                protocol: 'file:',
                slashes: true
            }));
        }
    }))
    menuFLoat.append(new MenuItem({
        label: 'Close',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click(){
            app.quit();
        }
    }))

})

const hideFromDock = async () => {
    if (process.platform == 'darwin') {
        app.dock.hide()
    } else {
        mainWindow.setSkipTaskbar(true)
    }
}

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
                label: 'Preferences',
                click(){
                    mainWindow.loadURL(url.format({
                        pathname: path.join(__dirname, 'views','preferences','preferences.html'),
                        protocol: 'file:',
                        slashes: true
                    }));
                }
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
