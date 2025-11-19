// dependencies
const path = require('path');
const {ImagesBufferPersist} = require("./images-buffer");
const {ImageObject} = require("./images-object");
const {
    readFileSync,
    getImagePathInLayout,
    getTemplateImagesDestination
} = require("./file-system");


/**
 * replacements config
 */
const injectors = {
    template: /<hr id="replacement" \/>/,
    signature: /<hr id="signature" \/>/,
    cssReplacement: /<style id="cssReplacement" \/>/,
    cssInlineReplacement: /<style id="inlineCssReplacement" \/>/,
    cssInlineFiles: `inlineCssReplacement"`,
    emailPreview: /\$emailPreview/,
    currentYear: /{{currentYear}}/,
    imagePathTemplate: `src="_img/`,
    imagePathLayout: `src="`,
    defaultUtm: 'utm_source=mail&utm_medium=email&utm_campaign='
}


/**
 * inject css files from template to layout
 *
 * @param html
 * @param styleFilesArray
 * @returns {*}
 */
function injectLinkStyleSheet(html, styleFilesArray)
{
    if (!styleFilesArray) {
        return html.replace(injectors.cssReplacement, '');
    }

    let styles = styleFilesArray.map(path => `<link rel="stylesheet" href="${path}" />`).join('\n');
    html = html.replace(injectors.cssReplacement, styles)

    // fallback replace with empty line for case without custom css files
    html = html.replace(injectors.cssReplacement, '');

    return html;
}


/**
 * Get content of style files and put it as inline styles to head of the email
 *
 * @param html
 * @param sharedHeadStyles
 * @returns {*}
 */
function injectSharedHeadStyles(html, sharedHeadStyles)
{
    const layoutSpecified = inlineCssFileParser(html);

    // merge with other parser
    if(null !== layoutSpecified) {
        sharedHeadStyles = null == sharedHeadStyles ? [] : sharedHeadStyles;
        sharedHeadStyles = sharedHeadStyles.concat(layoutSpecified);
    }

    if (!sharedHeadStyles) {
        return html.replace(injectors.cssInlineReplacement, '');
    }

    // if property is not type of array, just string, convert it to array
    let consume = !sharedHeadStyles.isArray ? Array.from(sharedHeadStyles) : sharedHeadStyles;

    let headerCss = consume.map(path => `<style type="text/css">${readFileSync(path)}</style>`).join('\n');
    html = html.replace(injectors.cssInlineReplacement, headerCss);

    return html;
}


/**
 * Create nice preview for email clients - text next to subject
 *
 * @param html
 * @param emailPreview
 * @returns {*}
 */
function injectEmailPreview(html, emailPreview) {
    const preview = emailPreview ? emailPreview : 'logo';
    return html.replace(injectors.emailPreview, preview);
}


/**
 * replace variables in URLs for nice UTM campaigns
 * utmCampaigns is array of key:value
 * @see: https://ga-dev-tools.appspot.com/campaign-url-builder/
 *
 * @param pageHtml
 * @param utmCampaigns
 * @returns {*}
 */
function injectMarketingUTM(pageHtml, utmCampaigns)
{
    if (!utmCampaigns) {
        return pageHtml;
    }

    utmCampaigns.forEach(campaign => {
        let key = Object.keys(campaign)[0];
        let value = campaign[key];
        let regex = new RegExp(`\\\${UTM_${key}}`, 'gm');

        pageHtml = pageHtml.replace(regex, `${injectors.defaultUtm}${value}`);
    });

    // @todo:
    // find missing variables, show console warning and remove them from final build

    return pageHtml;
}


/**
 * Layouts can have defined subject for better organization
 *
 * @param html
 * @param subject
 * @returns {*}
 */
function injectSubject(html, subject) {
    if(null == subject) {
        return html;
    }

    return html.replace("<title>", "<title>" + subject + " ");
}


/**
 * Copyright in footer
 *
 * @param html
 * @returns {*}
 */
function injectCopyright(html) {
    return html.replace(injectors.currentYear, new Date().getFullYear());
}


/**
 * Images parser for own images
 *
 * @param html
 * @returns {null|[]|*}
 */
function getImagesFromHtml(html) {

    let images = imagesParser(html);

    // no images, no pain
    if(images.length === 0) {
        return null;
    }

    let list = [];
    images
        .filter(file => file.includes("_img/"))
        .filter(file => !file.includes("http"))
        .map(file => list.push(file));

    // @todo filter duplicates


    if(list.length === 0) {
        return null;
    }

    return list;
}


/**
 * Search in layout for images and replace their paths by remote CDN URL
 *
 * Example:
 *
 * from:  <img src='../_img/batman.png' />
 * to:    <img src='https://unicorn-mailing.landsman.dev/0.0.2/_layouts/fancy/_img/batman.png' />
 *
 * @param html
 * @param layoutPaths
 * @param configuration
 * @returns {*}
 */
function injectImagePathsLayout(html, layoutPaths, configuration) {

    let imagesObject = getImagesFromHtml(html);

    // no images, no pain
    if(imagesObject === null) {
        return html;
    }

    let images = new ImageObject();
    imagesObject.map(file =>
    {
        const localPath = path.join(layoutPaths.relativePath, getImagePathInLayout(file))
        const localAbsolutePath = path.join(configuration.sourceLayouts, localPath)

        const futureFolder = '_layouts';
        const remotePath = `${configuration.bucketDestination}/${futureFolder}${localPath}`;
        const buildPath = path.join(configuration.destination, futureFolder, localPath);

        images.add(file, remotePath, localAbsolutePath, buildPath)
    });

    return replaceImagesFromArray(html, images.get(), configuration);
}


/**
 * Search in template for images and replace their paths by remote CDN URL
 *
 * Example:
 *
 * from:  <img src='_img/batman.png' />
 * to:    <img src='https://unicorn-mailing.landsman.dev/0.0.2/examples/_img/batman.png' />
 *
 * @param html
 * @param templatePath
 * @param configuration
 * @returns {*}
 */
function injectImagePathsTemplate(html, templatePath, configuration) {

    let parsed = getImagesFromHtml(html);

    // no images, no pain
    if(parsed === null) {
        return html;
    }

    let images = new ImageObject();
    parsed.map(file =>
    {
        const localPath = getTemplateImagesDestination(file, templatePath.relativePath);
        const localAbsolutePath = path.join(configuration.sourceTemplates, localPath);

        const remotePath = `${configuration.bucketDestination}${localPath}`;
        const buildPath = path.join(configuration.destination, localPath);

        images.add(file, remotePath, localAbsolutePath, buildPath)
    });

    return replaceImagesFromArray(html, images.get(), configuration);
}


/**
 * Search image local path and replace him for remote
 *
 * @param html
 * @param toReplace
 * @param configuration
 */
function replaceImagesFromArray(html, toReplace, configuration) {

    // put img array for later moving
    ImagesBufferPersist(toReplace, configuration);

    toReplace.map(row =>
    {
        const localhostUrl = `file:///${row.buildAbsolutePath}`;
        const imageURL = configuration.localhost ? localhostUrl : row.toRemoteURL;

        html = html.replace(row.fromProvidedPath, imageURL);
    })

    return html;
}


/**
 * Replace signature replacement with signature html
 *
 * @param layoutHtml
 * @param signatureHtml
 * @returns {*}
 */
function injectSignature(layoutHtml, signatureHtml) {
    if(!signatureHtml) {
        return layoutHtml.replace(injectors.signature, '');
    }

    return layoutHtml.replace(injectors.signature, signatureHtml);
}


/**
 * Merge layout with template
 *
 * @param layoutHtml
 * @param templateHtml
 * @returns {*}
 */
function injectTemplateToLayout(layoutHtml, templateHtml) {
    return layoutHtml.replace(injectors.template, templateHtml);
}


/**
 * Trim string very well
 *
 * @param s
 * @returns {*}
 */
const trim = (s) => {
    s = s.replace(/(^\s*)|(\s*$)/gi,"");
    s = s.replace(/[ ]{2,}/gi," ");
    s = s.replace(/\n /,"\n");

    return s;
};


/**
 * Parse html, find image source values
 *
 * @param string
 * @returns {[]}
 */
function imagesParser(string) {
    const imgRex = /<img.*?src="(.*?)"[^>]+>/g;
    const images = [];
    let img;
    while ((img = imgRex.exec(string))) {
        images.push(img[1]);
    }

    return images;
}


/**
 * Parse html, find link elements with our special class
 * @param string
 * @returns {[]}
 */
function inlineCssFileParser(string) {
    // @todo: use injector variable here
    const styleRex = /<link.*?href="(.*?)"*class=.inlineCssReplacement.[^>]+>/g;
    const cssFiles = [];
    let file;
    while ((file = styleRex.exec(string))) {
        // clean up, regex would be better
        const cleaned = trim(file[1]).replace('"', '');
        cssFiles.push(cleaned);
    }

    return cssFiles;
}


module.exports.trim = trim;
module.exports.injectLinkStyleSheet = injectLinkStyleSheet;
module.exports.injectEmailPreview = injectEmailPreview;
module.exports.injectMarketingUTM = injectMarketingUTM;
module.exports.injectSharedHeadStyles = injectSharedHeadStyles;
module.exports.injectSubject = injectSubject;
module.exports.injectCopyright = injectCopyright;
module.exports.injectImagePathsTemplate = injectImagePathsTemplate;
module.exports.injectTemplateToLayout = injectTemplateToLayout;
module.exports.injectSignature = injectSignature;
module.exports.injectImagePathsLayout = injectImagePathsLayout;
