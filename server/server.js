const url = require('url');
const path = require('path');
const express = require('express');
const puppeteer = require('puppeteer')
require('dotenv').config()
const AWS = require('aws-sdk')
const { fileURL } = require('./utils')
const {ipcRenderer} = require('electron')

const server = express();
server.use(express.json({limit: '10gb'}))
var serverListener = undefined
let port = '8008'

async function serverStatus  (data) {
    console.log('received', data)

    if(data.server){
        serverListener = await server.listen(port, ()=> {
            console.log(`Example app listening on port ${port}`)
        });
    }else{
        serverListener.close(() => {
            console.log('Closed out remaining connections');
        });
    }
    return true
}

server.post('/render', async (req, res) => {
    let body = req.body
    // let response = false
    if (body.folder === '' || body.folder === undefined) {
        res.setHeader('Content-Type', 'Response')
        res.status(400).send()
    }else{
        try{
            let response = await renderProcess(body)
            if(response){
                res.setHeader('Content-Type', 'application/json')
                res.json({
                    b64: response
                })
                res.status(200).send()
            }else{
                res.status(400).send()
            }
        }catch(error){
            console.log('in calling function')
            res.status(400).send()
        }
    }
});

async function renderProcess({camera, folder, scene, targetMaterialName, texture, colladaEncrypt, webGl}){
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })
    const s3 = new AWS.S3()
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: folder + '/collada.dae'
    }
    try{
        await s3.headObject(params).promise()
        params.Expires = 30
        const signedUrl = await s3.getSignedUrl('getObject', params)
        console.log('signed -> ', signedUrl)
        const itemData = {
            sceneFileURL: signedUrl,
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
        await browser.close()

        return base64

    }catch(error){
        console.log('Throwing...', error.code, error.message)
        throw new Error()
    }
}

module.exports = { serverStatus }
