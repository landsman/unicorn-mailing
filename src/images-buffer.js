const path = require('path');
const {copyFile} = require("./file-system");
const {removeFile} = require("./file-system");
const {readFileSync, saveDist} = require("./file-system");

/**
 * Get JSON data from buffer file
 */
function getContent(configuration)
{
    let output = [];

    try
    {
        // is file exist? have value?
        const currentContent = readFileSync(configuration.imageBufferPath);
        output = JSON.parse(currentContent);
    }
    catch (error) {

        // file not found => create new one
        if (error.code === 'ENOENT') {
            //console.info('Image buffer file was not created yet.');
        }
        else
        {
            throw error;
        }
    }

    return output;
}


/**
 * File which contains image paths which we want to move to build folder, after html build.
 * And for sure deploy them with templates to GCP.
 */
function persist(arrayData, configuration)
{
    // do not run if there are no parsed images
    if(null == arrayData || arrayData.length === 0) {
        return;
    }

    const bufferContent = getContent(configuration);

    // merge content in file with our array
    const merged = bufferContent.concat(arrayData);
    const toJson = JSON.stringify(merged);

    // store it back
    saveDist(configuration.imageBufferPath, toJson);
}

/**
 * get data and do rsync
 */
function flush(configuration)
{
    const bufferContent = getContent(configuration);
    if(bufferContent.length === 0) {
        return;
    }

    bufferContent.map(image => {
        copyFile(image.localAbsolutePath, image.buildAbsolutePath);
    })

    // @todo: files count, size to log
}


module.exports.ImagesBufferContent = getContent;
module.exports.ImagesBufferPersist = persist;
module.exports.ImagesBufferFlush = flush;
