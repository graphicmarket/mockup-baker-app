function installPlugin () {
    const {ipcRenderer} = require('electron')
    ipcRenderer.send("msg",'shows app window')
    document.querySelector(".buttonInstall").style.display = 'none';
    document.querySelector(".buttonTry").style.display = 'none';
    document.querySelector(".spectrum-ProgressCircle").style.display = 'block';
    ipcRenderer.on ("replyInstallPlugin", (event,data) => {
        console.log(data)
        document.querySelector(".spectrum-ProgressCircle").style.display = 'none';
        if(data) {
            document.querySelector(".detailError").style.display = 'none';
        } else {
            document.querySelector(".buttonTry").style.display = 'block';
            document.querySelector(".detailError").style.display = 'block';
        }
    })
}
function toggleSwitch(){
    let switcher = document.getElementById("switch-onoff");
    let status = switcher.getAttribute('checked');
    console.log('is checked? ', status);

    if(status || status == 'true'){
        switcher.removeAttribute('checked');
        let styleElem = document.querySelector('style');
        styleElem.remove();
    }else{
        switcher.setAttribute('checked', true);
        var styleElem = document.head.appendChild(document.createElement("style"));
        styleElem.innerHTML = "span.spectrum-Switch-switch:before {left: 10px;}";
    }
    toggleServer(!status);
}

async function toggleServer(status){
    const {ipcRenderer} = require('electron');
    const { serverStatus } = require('../server/server')
    let result = await serverStatus({server: status})
    console.log(result)
}
  
global.installPlugin = installPlugin