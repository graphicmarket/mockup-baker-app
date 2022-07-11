function getPort() {
    const { ipcRenderer } = require('electron');
    let aplicationPort = document.getElementById("aplicationPort");

    const validateFunction = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
        }

        let valuePort = Number(e.target.value);
        if(valuePort !== undefined && valuePort > 0 && valuePort < 65536) {
            aplicationPort.classList.remove("aplicationPort");
            setPort(valuePort);
        } else {
            aplicationPort.classList.add("aplicationPort");
        }    
    }

    window.addEventListener('focusout', validateFunction, false);
    window.addEventListener('keypress', validateFunction, false);

    ipcRenderer.send("getPort", true);
    ipcRenderer.on("sendPort", (event, data) => {
        if (data) {
            aplicationPort.value = data
        }
    });

    ipcRenderer.on("statusServer", (event, data) => {
        console.log(data)
        if (data) {
            console.log('server on');
            aplicationPort.disabled = true;
        }
    });

    const setPort = (valuePort) => {
        ipcRenderer.send("setPort", aplicationPort.value);
        if(valuePort !== undefined && valuePort >= 0 && valuePort < 65536) {
            ipcRenderer.on("setPort", (event, data) => {
                if (!data) {
                    getPort();
                }
            })
        } else {
            console.log('No cumple');
        }
    }
}

global.getPort = getPort