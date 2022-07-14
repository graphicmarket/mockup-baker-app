function getPort() {
    const { ipcRenderer } = require('electron');
    let aplicationPort = document.getElementById("aplicationPort");
    let numberText = document.getElementById("numberText");

    const validateFunction = (e) => {
        if (e.key === "Enter" && e.type == "keypress") {
            e.preventDefault();
        } else if (e.type == "keyup") {
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
        console.log('send port')
        ipcRenderer.on("setPort", (event, data) => {
            if (data) {
                aplicationPort.classList.remove("borderRed");
                numberText.classList.add("numberTextSuccess");
                numberText.innerHTML = "Port changed successfully";
                //Timeout para quitar el texto y la clase numberTextSuccess
            } else {
                getPort();
            }
        });
    }
}

function showAplicationIcon(data,state) {
    let checkShowAplicationIcon = document.getElementById("checkShowAplicationIcon");
    checkShowAplicationIcon.checked = data;
    if (state !== null) {
        checkShowAplicationIcon.setAttribute('disabled','')
        setTimeout(() => {
            checkShowAplicationIcon.removeAttribute('disabled', "")
        }, 800);
    }
}

function getStateDock(state) {
    console.log('getStateDock', state)
    const { ipcRenderer } = require('electron');
    ipcRenderer.send("showDockIcon", state);
    ipcRenderer.on("showDockIcon", (event, data) => {
        showAplicationIcon(data,state);
    });
}

function clearCache() {
    let cacheText = document.getElementById("cacheText");
    let btnClearCache = document.getElementById("btnClearCache");
    const { ipcRenderer } = require('electron');
    ipcRenderer.send("clearCache", true);
    ipcRenderer.on("removeCache", (event, data) => {
        if (data) {
            cacheText.style.display = "block";
            btnClearCache.setAttribute('disabled', "")
            btnClearCache.classList.add("buttonDisabled")
            setTimeout(() => {
                cacheText.style.display = "none";
                btnClearCache.removeAttribute('disabled', "")
                btnClearCache.classList.remove("buttonDisabled")
            }, 1000);
        }
    });
}

function getVersion() {
    const { ipcRenderer } = require('electron');
    let versionText = document.getElementById("versionText");
    ipcRenderer.send("getVersion", true);
    ipcRenderer.on("sendVersion", (event, data) => {
        if (data) {
            versionText.innerHTML = `Version ${data}`;
        }
    });
}
function getIcon() {
    const { ipcRenderer } = require('electron');
    let icon = document.getElementById("iconBaker");
    ipcRenderer.send("getIcon", true);
    ipcRenderer.on("sendIconPath", (event, data) => {
        if (data) {
            icon.setAttribute("src", data)
        }
    });
}

/* // Change theme
require('electron').ipcRenderer.on('changeTheme', (event, message) => {
    if (message) {
        document.body.style.backgroundColor = 'rgb(42, 40, 41)'
    } else {
        document.body.style.backgroundColor = 'rgb(242, 240, 241)'
    }
})
*/

global.getPort = getPort