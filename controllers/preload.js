
async function validatePlugin () {
    const {ipcRenderer} = require('electron')
    ipcRenderer.send("validatePlugin",'validate')
    ipcRenderer.on ("replyValidatePlugin", (event,data) => {
        if (data) {
            document.querySelector(".buttonInstall").style.display = 'none';
            document.querySelector(".buttonUninstall").style.display = 'block';
            document.getElementById('togglerServer').setAttribute('checked', true)
            toggleServer(true)
        }
    })
}

function toogleSwitch(switcher){
    let status = switcher.getAttribute('checked');
    console.log('is checked? ', status === null);
    toggleServer(status === null);
    // toggleServer(true);
}

function installPlugin () {
    const {ipcRenderer} = require('electron')
    ipcRenderer.send("installPlugin",'shows app window')
    document.querySelector(".buttonInstall").style.display = 'none';
    document.querySelector(".buttonTry").style.display = 'none';
    document.querySelector(".progress-custom").style.display = 'block';
    ipcRenderer.on ("replyInstallPlugin", (event,data) => {
        document.querySelector(".progress-custom").style.display = 'none';
        if(data) {
            document.querySelector(".detailError").style.display = 'none';
            document.querySelector(".buttonUninstall").style.display = 'block';
            document.getElementById('installer_success').style.display = 'flex'
            setTimeout(() =>{
                setTimeout(hideElement(document.getElementById('server_status_off')), 500)
            }, 3000)
            document.getElementById('togglerServer').setAttribute('checked', true)
            toggleServer(true)
        } else {
            document.querySelector(".buttonTry").style.display = 'block';
            document.querySelector(".detailError").style.display = 'block';
            document.getElementById('installer_fail').style.display = 'flex'
            setTimeout(() =>{
                setTimeout(hideElement(document.getElementById('server_status_off')), 500)
            }, 3000)
        }
    })
}

function uninstallPlugin(){
    const {ipcRenderer} = require('electron')
    ipcRenderer.send("uninstallPlugin",'shows app window')
    document.querySelector(".buttonUninstall").style.display = 'none';
    document.querySelector(".buttonTry").style.display = 'none';
    document.querySelector(".progress-custom").style.display = 'block';
    ipcRenderer.on ("replyUninstallPlugin", (event,data) => {
        document.querySelector(".progress-custom").style.display = 'none';
        if(data) {
            document.querySelector(".detailError").style.display = 'none';
            document.getElementById('installer_success').style.display = 'none';
            document.querySelector(".buttonInstall").style.display = 'block';
            setTimeout(() =>{
                setTimeout(hideElement(document.getElementById('server_status_off')), 500)
            }, 3000)
            document.getElementById('togglerServer').removeAttribute('checked')
            toggleServer(false)
        } else {
            document.querySelector(".buttonTry").style.display = 'block';
            document.querySelector(".detailError").style.display = 'block';
            document.getElementById('installer_fail').style.display = 'flex'
            setTimeout(() =>{
                setTimeout(hideElement(document.getElementById('server_status_off')), 500)
            }, 3000)
        }
    })
}

async function toggleServer(status){
    const {ipcRenderer} = require('electron');
    const { serverStatus } = require('../../server/server')
    let result = await serverStatus({server: status})
    if(result){
        if(status){
            document.getElementById('server_status_on').style.display = 'flex'
            setTimeout(() =>{
                setTimeout(hideElement(document.getElementById('server_status_on')), 500)
            }, 3000)
        }else{
            document.getElementById('server_status_off').style.display = 'flex'
            setTimeout(() =>{
                setTimeout(hideElement(document.getElementById('server_status_off')), 500)
            }, 3000)
        }
    }else{
        document.getElementById('server_status_error').style.display = 'flex'
        setTimeout(() =>{
            setTimeout(hideElement(document.getElementById('server_status_off')), 500)
        }, 3000)
    }
}

function hideElement(el){
    el.style.display = 'none'
}

function showFloatMenu() {
    const {ipcRenderer} = require('electron')
    ipcRenderer.send("showFloatMenu",true)
}

  
global.installPlugin = installPlugin