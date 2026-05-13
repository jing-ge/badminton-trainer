const fs = require('fs');
// 这是一个全球公认的最标准、最精简的 1x1 纯透明 PNG 的 Base64，绝对不会被任何图片解析库报错
const transparentPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const iconBuffer = Buffer.from(transparentPngBase64, 'base64');

fs.mkdirSync('./assets/images', { recursive: true });
fs.writeFileSync('./assets/images/icon.png', iconBuffer);
fs.writeFileSync('./assets/images/splash.png', iconBuffer);
console.log("Safe transparent PNGs created!");
