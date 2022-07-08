let aplicationPort = document.getElementById("aplicationPort");

aplicationPort.addEventListener('focusout', (e) => {
    const { ipcRenderer } = require('electron');
    e.preventDefault();
    ipcRenderer.send("setPort", aplicationPort.value)
    ipcRenderer.on("setPort", (event, data) => {
        if(!data) {
            getPort();
        }
    })
});

function getPort() {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send("getPort", true);
    ipcRenderer.on("sendPort", (event, data) => {
        if(data) {
            aplicationPort.value = data
        }
    })
}

global.getPort = getPort