const url = require('url');
const fs = require('fs');
const path = require('path');
const {join} = require('path');
const express = require('express');
const puppeteer = require('puppeteer')
const { fileURL } = require('./utils/fileURL')
const resizeRender = require('./utils/resizeRender');

const log = require('electron-log');
log.transports.file.resolvePath = () => path.join(__dirname,'..','log.js');

//Config server
const server = express();
server.use(express.json({limit: '10gb'}))
server.use(express.static(join(__dirname, 'public')))
server.use(express.urlencoded({ limit: '100mb', extended: true }))
server.use(express.static(join(__dirname, 'mockups')))
server.use(express.static(join(__dirname, 'Plugin')))

var serverListener = undefined
let port = '8008'

async function serverStatus(data) {
    try{
        if (data.server) {
            serverListener = await server.listen(port, () => {
                console.log(`Example app listening on port ${port}`)
                log.info(`Example app listening on port ${port}`)
            });
        } else {
            serverListener.close(() => {
                console.log('Closed out remaining connections');
                log.info('Closed out remaining connections');
            });
        }
        return true
    }catch(e){
        return false
    }
}
server.get('/collada',function(req,res) {
    res.sendFile(path.resolve(__dirname, 'mockups', 'collada.dae'));
});
server.get('/colladaPath',function(req,res) {
    res.send(path.resolve(__dirname, 'mockups', 'collada.dae'));
});
server.get('/plugin',function(req,res) {
    res.sendFile(path.resolve(__dirname, '..','Plugin', '234a7e6c_PS.ccx'))
});
server.get('/pluginPath',function(req,res) {
    res.send(path.resolve(__dirname, '..','Plugin', '234a7e6c_PS.ccx'))
});
server.get('/log',function(req,res) {
    log.info('Exporting log')
    res.sendFile(path.resolve(__dirname, '..','log.js'))
});
server.post('/render', async (req, res) => {
    const { body } = req;
    // let response = false
    if (body.folder === '' || body.folder === undefined) {
        res.setHeader('Content-Type', 'Response')
        res.status(400).send()
    } else {
        try {
            let response = await renderProcess(body)
            if (response) {
                res.setHeader('Content-Type', 'application/json')
                res.json({
                    b64: response
                })
                res.status(200).send()
            } else {
                res.status(400).send()
            }
        } catch (error) {
            log.warn('in calling function', error)
            res.json({
                error: error.message
            })
            res.status(400).send()
        }
    }
});


async function renderProcess({ camera, folder, scene, targetMaterialName, texture, finalFrameWidth, finalFrameHeight, colladaEncrypt, webGl }) {
    try {
        //Write collada
        // await fs.writeFile(`./server/mockups/collada.dae`, Buffer.from(colladaEncrypt), (err) => {
        //     if (err) {throw new Error (err.message)}
        // });


        const itemData = {
            sceneFileURL: 'http://127.0.0.1:8008/collada',
            texture,
            targetMaterialName,
            camera,
            scene
        }
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins',
                '--disable-site-isolation-trials',
                "--enable-webgl",
                "--use-gl=angle"
            ]
        })

        const page = await browser.newPage()
        const index = fileURL(path.resolve(__dirname, 'public', 'index.html'), {
            resolve: false
        })

        await page.goto(index, { waitUntil: 'networkidle0' })
        await page.evaluateHandle(async (itemData) => {
            return await window.renderScene(itemData)
        }, itemData)

        await page.waitForSelector('#rendered')

        const data = await page.evaluate(() => {
            return document.querySelector('canvas#app').toDataURL()
        })
        base64 = data.split(';base64,')[1]
        await browser.close();
        //Remove collada
        // await fs.unlink('./mockups/collada.dae', (err) => {
        //     if (err) {throw err;}
        // });
        if( camera.finalFrameWidth !== camera.frameWidth && camera.finalFrameHeight !== camera.frameHeight) {
            base64 = await resizeRender(base64, camera.finalFrameWidth, camera.finalFrameHeight);
        }
        return base64.toString('base64')

    } catch (error) {
        log.error('Throwing...',  error.message)
        throw new Error(error)
    }
}

module.exports = { serverStatus }
