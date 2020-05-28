const fs = require('fs');
const path = require('path');

const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
};

const writeLog = (logFile, item) =>
{
    ensureDirectoryExistence(logFile);
    fs.appendFile(logFile, item, (err) => {
        if (err) console.log(err);
    });
};

const trim = (s) => {
    s = s.replace(/(^\s*)|(\s*$)/gi,"");
    s = s.replace(/[ ]{2,}/gi," ");
    s = s.replace(/\n /,"\n");
    return s;
};

module.exports.log = writeLog;
module.exports.trim = trim;
module.exports.ensureDirectoryExistence = ensureDirectoryExistence;