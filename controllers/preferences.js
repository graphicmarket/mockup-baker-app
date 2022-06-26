function closePreferences () {
    const {ipcRenderer} = require('electron')
    ipcRenderer.send("closePreferences",true)
}