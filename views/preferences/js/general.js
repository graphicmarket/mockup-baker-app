let aplicationPort = document.getElementById("aplicationPort");

aplicationPort.addEventListener('focusout', (e) => {
    //let aplicationPort = document.getElementById("aplicationPort");
    const { ipcRenderer } = require('electron');
    console.log('focusout');
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
    console.log('getPort')
    //let aplicationPort = document.getElementById("aplicationPort");

    ipcRenderer.send("getPort", true);
    ipcRenderer.on("sendPort", (event, data) => {
        console.log(data)
        if(data) {
            aplicationPort.value = data
        }
    })
}

global.getPort = getPort