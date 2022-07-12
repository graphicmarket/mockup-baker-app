function getPort() {
    const { ipcRenderer } = require('electron');
    let aplicationPort = document.getElementById("aplicationPort");
    let numberText = document.getElementById("numberText");

    const validateFunction = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
        }

        let valuePort = Number(e.target.value);
        if (!isNaN(valuePort) && valuePort > 0 && valuePort < 65536) {
            numberText.classList.remove("numberTextError");
            setPort(valuePort);
        } else {
            numberText.classList.remove("numberTextSuccess");
            numberText.classList.add("numberTextError");
            aplicationPort.classList.add("aplicationPort");
            numberText.innerHTML = "The port must be between 0 and 65536";
        }
    };

    aplicationPort.addEventListener('keypress', validateFunction, false);
    aplicationPort.addEventListener('keyup', validateFunction, false);

    ipcRenderer.send("getPort", true);
    ipcRenderer.on("sendPort", (event, data) => {
        if (data) {
            aplicationPort.value = data;
        }
    });

    ipcRenderer.on("statusServer", (event, data) => {
        if (data) {
            aplicationPort.setAttribute('disabled', true);
        } else {
            aplicationPort.removeAttribute('disabled');
        }
    });

    const setPort = (valuePort) => {
        ipcRenderer.send("setPort", aplicationPort.value);
        ipcRenderer.on("setPort", (event, data) => {
            if (!data) {
                getPort();
            } else {
                numberText.classList.add("numberTextSuccess");
                aplicationPort.classList.remove("aplicationPort");
                numberText.innerHTML = "Port changed successfully";
                //Timeout para quitar el texto y la clase numberTextSuccess
            }
        });
    }
}

global.getPort = getPort