const sharp = require('sharp');

const resizeRender = async (base64, width, height) => {
    return await sharp(Buffer.from(base64, 'base64')).resize({ width, height }).toBuffer();
}

module.exports = resizeRender;