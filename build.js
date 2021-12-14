const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const dotenv = require('dotenv');
const {ImagesBufferFlush} = require("./src/images-buffer");
const {buildTemplate} = require("./src/build-template");
const {readFileSync, templatePaths, saveDist} = require("./src/file-system");

//
// config
//
dotenv.config();
const releaseVersion = process.env.RELEASE_VERSION || 'version-not-specified';
const configuration = {
    defaultLayout: 'default',
    imageBufferPath: path.join(__dirname, 'tmp', 'imagesBuffer.json'),
    destination: process.env.DESTINATION || path.join(__dirname, 'build', releaseVersion),
    sourceTemplates: process.env.SOURCE || path.join(__dirname, 'templates'),
    sourceLayouts: process.env.LAYOUTS || path.join(__dirname, 'layouts'),
    bucketDestination: `${process.env.GCP_BUCKET_PUBLIC_URL}/${releaseVersion}`,
    localhost: process.env.STATUS !== 'production'
}



function startBuild()
{
    console.log(`🎬 Started build for release: ${releaseVersion}`);
    removePreviousBuildData();

    if(configuration.localhost) {
        console.log("💬 Images are generating for localhost (NODE_ENV !== production).")
    }
}


function removePreviousBuildData()
{
    fs.remove(configuration.destination)
        .then(() => {

            fs.remove(configuration.imageBufferPath).then(() => {
                startNewBuild();
            })

        })
        .catch(err => console.error(err));
}


function startNewBuild()
{
    //
    // checks
    //
    let countExists, processed = 0;

    // array with absolute paths to templates
    const templates = glob.sync(path.join(configuration.sourceTemplates, '/**/!(_*).html'));
    countExists = templates.length;

    if(countExists > 0) {
        console.info('🔎 Found templates:', countExists);
    }
    else {
        console.error("🛑️ No templates found!");
        process.exit(1);
    }

    templates.reduce((acc, fileAbsolutePath) =>
    {
        const tplPaths = templatePaths(fileAbsolutePath, configuration.destination);

        try {
            const tplContent = readFileSync(fileAbsolutePath);
            const html = buildTemplate(tplContent, tplPaths, configuration);

            saveDist(tplPaths.fileDestinationPath, html);
            ++processed;
        }
        catch (error)
        {
            console.error(`🛑️ Problem during reading templates folder`, error);
            process.exit(1);
        }

    }, []);

    ImagesBufferFlush(configuration);

    if(countExists !== processed) {
        console.error('🛑️ Processed only ' + processed + ' from ' + countExists + ' templates!');
        process.exit(1);
    }

    console.info('👍 Processed all ' + processed + ' from ' + countExists + ' templates');
}

startBuild();
