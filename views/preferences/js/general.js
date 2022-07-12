function getPort() {
    const { ipcRenderer } = require('electron');
    let aplicationPort = document.getElementById("aplicationPort");
    let numberText = document.getElementById("numberText");

    const validateFunction = (e) => {
        console.log(e.target.value)
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
            aplicationPort.classList.add("borderRed");
            numberText.innerHTML = "The port must be between 0 and 65535";
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

    const setPort = () => {
        ipcRenderer.send("setPort", aplicationPort.value);
        ipcRenderer.on("setPort", (event, data) => {
            console.log(data)
            if (data) {
                aplicationPort.classList.remove("borderRed");
                numberText.classList.add("numberTextSuccess");
                numberText.innerHTML = "Port changed successfully";
                //Timeout para quitar el texto y la clase numberTextSuccess
                setTimeout(() => {
                    numberText.innerHTML = "";
                }, 2000);
            } else {
                getPort();
            }
        });
    }
}

global.getPort = getPort