const fs = require('fs');
const path = require('path');
const glob = require('glob');
const juice = require('juice');

//
// config
//
const destination = process.env.DESTINATION || path.join(__dirname, 'build');
const sourceTemplates = process.env.SOURCE || path.join(__dirname, 'templates', '/**/!(_*).html');

//
// find templates, do inline-css and save to public folder
//
const diskPages = glob.sync(sourceTemplates);
const countExists = diskPages.length;

console.log('Found templates:', countExists);

let processed = 0;
const diskPagesRelativePaths = diskPages.reduce((acc, item) => {

    const fileName = item.split('/templates').slice(-1)[0];

    fs.readFile(item, 'utf8', function(err, data) {
        if (err){
            console.error(err);
            throw err;
        }

        const result = juice(data);
        let filePath = destination + fileName;

        ensureDirectoryExistence(filePath);
        fs.writeFileSync(filePath, result);
    });

    ++processed;

}, []);

if(countExists === processed){
    console.info('🛑 Processed all ' + processed + ' from ' + countExists + ' templates');
}else {
    console.error('✔️ Processed only ' + processed + ' from ' + countExists + ' templates!');
}

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}