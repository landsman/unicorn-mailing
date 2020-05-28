const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const juice = require('juice');
const fm = require('front-matter');

//
// config
//
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
    loadLayoutData(layout, page.body, filePath);
}


//
// merge template with layout and do inline-css
//
function loadLayoutData(layoutName, pageHtml, filePath)
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

        const finalHtml = layoutHtml.replace(replacement, pageHtml);
        inlineCSS(finalHtml, filePath);
    });
}


//
// convert <style> to inline css on each element
//
function inlineCSS(data, filePath)
{
    let html = juice(data);
    saveDist(filePath, html);
}


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