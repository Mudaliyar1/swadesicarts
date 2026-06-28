const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'models', 'nsfwjs');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return download(response.headers.location, dest).then(resolve).catch(reject);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

const baseUrl = 'https://s3.amazonaws.com/ir_public/nsfwjscdn/tfjs_quant_nsfw_mobilenet/';

Promise.all([
    download(baseUrl + 'model.json', path.join(dir, 'model.json')),
    download(baseUrl + 'group1-shard1of1.bin', path.join(dir, 'group1-shard1of1.bin'))
]).then(() => {
    console.log('Model downloaded successfully to public/models/nsfwjs');
}).catch(err => {
    console.error('Error downloading model:', err);
});
