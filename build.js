const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const juice = require('juice');
const fm = require('front-matter');
const util = require('util');
const getStylesheetList = require('list-stylesheets');

//
// config
//

// Convert fs.readFile into Promise version of same
const readFilePromise = util.promisify(fs.readFile);
const destination = process.env.DESTINATION || path.join(__dirname, 'build');
const sourceTemplates = process.env.SOURCE || path.join(__dirname, 'templates', '/**/!(_*).html');
const sourceLayouts = process.env.LAYOUTS || path.join(__dirname, 'layouts');
const defaultLayout = 'default';
const replacement = /<hr id="replacement" \/>/;

//
// checks
//
let countExists = 0;
let processed = 0;


//
// remove old build and start the new one
//
function startBuild()
{
    fs.remove(destination, err =>
    {
        if (err){
            console.error(err);
        }
        dist();
    });
}


//
// find templates, do inline-css and save to public folder
//
function dist()
{
    // array with absolute paths to templates
    const diskPages = glob.sync(sourceTemplates);
    countExists = diskPages.length;

    if(countExists > 0) {
        console.info('Found templates:', countExists);
    }
    else {
        console.error("No templates found!");
        return;
    }

    const diskPagesRelativePaths = diskPages.reduce((acc, item) =>
    {
        const relativePath = item.split('/templates').slice(-1)[0];
        fs.readFile(item, 'utf8', function(err, data)
        {
            if (err){
                console.error(err);
            }

            pageLayoutCheck(data, destination + relativePath);
        });

        ++processed;

    }, []);

    //
    // final message
    //
    if(countExists === processed) {
        console.info('✔ Processed all ' + processed + ' from ' + countExists + ' templates');
    } else {
        console.error('🛑️ Processed only ' + processed + ' from ' + countExists + ' templates!');
    }
}


//
// load defined layout in template or fallback to default
//
function pageLayoutCheck(pageHtml, filePath)
{
    let page = fm(pageHtml);
    let layout = page.attributes.layout || defaultLayout;
    let subject = page.attributes.subject || null;
    loadLayoutData(layout, subject, page.body, filePath);
}


//
// merge template with layout and do inline-css
//
function loadLayoutData(layoutName, subject, pageHtml, filePath)
{
    let layoutPath = path.join(sourceLayouts, layoutName + '.html');

    if (!fs.existsSync(layoutPath)) {
        console.error("Layout not found at path: " + layoutPath);
        return;
    }

    fs.readFile(layoutPath, 'utf8', (err, layoutHtml) =>
    {
        if (err){
            console.error(err);
        }

        if(null !== subject){
            layoutHtml = layoutHtml.replace("<title>", "<title>" + subject + " ");
        }

        pageHtml = layoutHtml.replace(replacement, pageHtml);
        inlineCSS(pageHtml, filePath);
    });
}


//
// convert <style> to inline css on each element
//
async function inlineCSS(data, filePath) {
    const fileParser = getStylesheetList(data, {
        applyLinkTags: true,
        removeLinkTags: true
    });

    const allCss = await getCssContent(fileParser.hrefs);
    const finalHtml = juice.inlineContent(fileParser.html, allCss);

    saveDist(filePath, finalHtml);
}

//
// read css files content and merge them to one string
//
async function getCssContent(filesArray) {
    let output = "";
    for (const file of filesArray) {
        output += await readFile(file);
        output += "\n\n"
    }

    return output;
}

//
// async file reading handler
//
const readFile = async (path) => {
    return await readFilePromise(path);
};


//
// create folder structure and save dist
//
function saveDist(filePath, data)
{
    ensureDirectoryExistence(filePath);

    // finally save
    fs.writeFileSync(filePath, data);
}


//
// file system helper
//
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}


//
// start process
//
startBuild();