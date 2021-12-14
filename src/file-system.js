const fsb = require('fs');
const fs = require('fs-extra');
const util = require('util');
const path = require('path');
const {filePathsObject} = require("./schema");

/**
 * Helper to get file path without file name
 *
 * @param dirname
 * @returns {string}
 */
function getPathWithoutFile(dirname)
{
    return path.parse(dirname).dir
}

/**
 * Setup and verify path to the layout
 *
 * @param sourceLayouts
 * @param layoutName
 */
function getLayoutPath(sourceLayouts, layoutName)
{
    let fileAbsolutePath = path.join(sourceLayouts, layoutName + '.html');

    if (!fs.existsSync(fileAbsolutePath)) {
        throw new Error(`Layout not found at path: ${fileAbsolutePath}`);
    }

    const localFullPath = fileAbsolutePath.split('/layouts').slice(-1)[0];
    const localPath = getPathWithoutFile(localFullPath);
    const fileName = localFullPath.split("/").slice(-1);

    return filePathsObject(fileName, localPath, fileAbsolutePath);
}

/**
 * file paths helper
 *
 * @param fileAbsolutePath
 * @param destinationPath
 */
function templatePaths(fileAbsolutePath, destinationPath)
{
    //
    // example: /examples/billing_en.html
    const localFullPath = fileAbsolutePath.split('/templates').slice(-1)[0];

    //
    // example: billing_en.html
    const fileName = localFullPath.split("/").slice(-1);

    //
    // example: /examples
    const localPath = getPathWithoutFile(localFullPath);

    //
    // example: /home/landsman/projects/unicorn-mailing/build/0.0.2/examples/billing_en.html
    const fileDestinationPath = path.join(destinationPath, localFullPath);

    return filePathsObject(fileName, localPath, fileDestinationPath);
}


/**
 * get local path after "_img/"
 *
 * @param imagePath
 */
function getImagePathInLayout(imagePath)
{
    if(null == imagePath) {
        return null;
    }

    const layoutRoot = imagePath.split('_img/').slice(-1)[0];

    return path.join('_img', layoutRoot);
}

/**
 * @todo
 *
 * @param fileName
 * @param templateName
 * @returns {string}
 */
function getTemplateImagesDestination(fileName, templateName)
{
    const localPath = getImagePathInLayout(fileName);
    return path.join(templateName, localPath);
}

/**
 * Read css files content and merge them to one string
 *
 * @param filesArray
 * @returns {string}
 */
function getCssContent(filesArray)
{
    let output = "";
    for (const file of filesArray) {
        output += readFileSync(file);
        output += "\n\n"
    }

    return output;
}

/**
 * Check for bat paths in css files and return same array
 *
 * @param cssFiles
 * @returns {*[]}
 */
function prepareCssFiles(cssFiles)
{
    if(cssFiles == null) {
        return null;
    }

    // convert one file to array, to have same type every time
    if (cssFiles && !Array.isArray(cssFiles)) {
        cssFiles = [cssFiles];
    }

    cssFiles && cssFiles.map(path => {
        if(!fs.existsSync(path)){
            throw new Error(`File not found: ${path}`);
        }
    });

    return cssFiles;
}


/**
 * Get signature html from signature name
 *
 * @param signatureName
 * @param filePaths
 * @returns {null|Buffer}
 */
function prepareSignatureFile(signatureName, filePaths)
{
    if(!signatureName) {
        return null
    }

    const folder = getPathWithoutFile(filePaths.fileDestinationPath);
    const signaturePath = path.join(folder, 'signatures', `${signatureName}.html`);

    if (!fs.existsSync(signaturePath)) {
        throw new Error(`Signature not found at path: ${signaturePath}`);
    }

    return readFileSync(signaturePath);
}


/**
 * Async file reading handler.
 * Convert fs.readFile into Promise version of same
 *
 * @param path
 * @returns {Promise<*>}
 */
async function readFile(path)
{
    const readFilePromise = util.promisify(fs.readFile);
    return await readFilePromise(path);
}


/**
 * Return file content
 *
 * @param path
 * @returns {Buffer}
 */
function readFileSync(path)
{
    return fs.readFileSync(path, 'utf8');
}


/**
 * create folder structure and save dist
 *
 * @param filePath
 * @param data
 */
function saveDist(filePath, data)
{
    ensureDirectoryExistence(filePath);

    fs.writeFileSync(filePath, data);
}

/**
 * check if directory path exist
 * if not, create it
 *
 * @param filePath
 * @returns {boolean}
 */
function ensureDirectoryExistence(filePath)
{
    const dirname = path.dirname(filePath);
    if (fsb.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);

    fsb.mkdirSync(dirname);
}


/**
 * Write log to file
 *
 * @param logFile
 * @param item
 */
function writeLog(logFile, item)
{
    ensureDirectoryExistence(logFile);

    fs.appendFile(logFile, item, (err) => {
        if (err) console.log(err);
    });
}


/**
 * Copy file from source to build folder
 *
 * @param from
 * @param to
 */
function copyFile(from, to)
{
    ensureDirectoryExistence(to);

    fs.copy(from, to, (err) => {
        if (err) throw err;
    });
}

module.exports.writeLog = writeLog;
module.exports.readFile = readFile;
module.exports.readFileSync = readFileSync;
module.exports.saveDist = saveDist;
module.exports.ensureDirectoryExistence = ensureDirectoryExistence;
module.exports.getCssContent = getCssContent;
module.exports.prepareCssFiles = prepareCssFiles;
module.exports.getLayoutPath = getLayoutPath;
module.exports.templatePaths = templatePaths;
module.exports.prepareSignatureFile = prepareSignatureFile;
module.exports.getImagePathInLayout = getImagePathInLayout;
module.exports.getTemplateImagesDestination = getTemplateImagesDestination;
module.exports.copyFile = copyFile;
