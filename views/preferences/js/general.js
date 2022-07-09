function getPort() {
    const { ipcRenderer } = require('electron');
    let aplicationPort = document.getElementById("aplicationPort");

    aplicationPort.addEventListener('focusout', (e) => {
        e.preventDefault();
        setPort();
    });

    aplicationPort.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            setPort();
        }
    });

    ipcRenderer.send("getPort", true);
    ipcRenderer.on("sendPort", (event, data) => {
        if (data) {
            aplicationPort.value = data
        }
    })

    const setPort = () => {
        ipcRenderer.send("setPort", aplicationPort.value)
        ipcRenderer.on("setPort", (event, data) => {
            if (!data) {
                getPort();
            }
        })
    }
}

global.getPort = getPort