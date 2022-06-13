function example(switcher){
    console.log(switcher)
    let status = switcher.getAttribute('checked');
    console.log('is checked? ', status === null);
    toggleServer(status === null);
    // toggleServer(true);
}

function installPlugin () {
    const {ipcRenderer} = require('electron')
    ipcRenderer.send("msg",'shows app window')
    document.querySelector(".buttonInstall").style.display = 'none';
    document.querySelector(".buttonTry").style.display = 'none';
    document.querySelector(".progress-custom").style.display = 'block';
    ipcRenderer.on ("replyInstallPlugin", (event,data) => {
        console.log(data)
        document.querySelector(".progress-custom").style.display = 'none';
        if(data) {
            document.querySelector(".detailError").style.display = 'none';
        } else {
            document.querySelector(".buttonTry").style.display = 'block';
            document.querySelector(".detailError").style.display = 'block';
        }
    })
}

async function toggleServer(status){
    const {ipcRenderer} = require('electron');
    const { serverStatus } = require('../server/server')
    let result = await serverStatus({server: status})
    if(result){
        if(status){
            document.getElementById('server_status_on').style.display = 'inline-flex'
            setTimeout(() =>{
                hideElement(document.getElementById('server_status_on'))
            }, 3000)
        }else{
            document.getElementById('server_status_off').style.display = 'inline-flex'
            setTimeout(() =>{
                setTimeout(hideElement(document.getElementById('server_status_off')), 500)
            }, 3000)
        }
    }else{
        document.getElementById('server_status_error').style.display = 'inline-flex'
        setTimeout(() =>{
            setTimeout(hideElement(document.getElementById('server_status_off')), 500)
        }, 3000)
    }
}

function hideElement(el){
    el.style.display = 'none'
}

  
global.installPlugin = installPlugin