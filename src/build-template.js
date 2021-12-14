const fm = require('front-matter');
const {getTemplateVariables} = require("./schema");
const {toInlineStyles} = require("./optimalization");
const {
    readFileSync,
    prepareCssFiles,
    getLayoutPath,
    prepareSignatureFile
} = require("./file-system");
const {
    injectSubject,
    injectCopyright,
    injectSharedHeadStyles,
    injectEmailPreview,
    injectLinkStyleSheet,
    injectMarketingUTM,
    injectImagePathsTemplate,
    injectImagePathsLayout,
    injectTemplateToLayout,
    injectSignature
} = require("./injectors");


/**
 * Whole HTML build process
 *
 * @param templateData
 * @param templatePath
 * @param configuration
 * @returns {string}
 */
function buildTemplate(templateData, templatePath, configuration)
{
    // get all variables
    const page = getTemplateVariables(fm(templateData), configuration);

    // transform them
    const cssFiles = prepareCssFiles(page.cssFiles);
    const layoutPaths = getLayoutPath(configuration.sourceLayouts, page.layout)
    const signature = prepareSignatureFile(page.signature, layoutPaths);

    // replacing
    let layoutHtml = readFileSync(layoutPaths.fileDestinationPath);
    layoutHtml = injectSubject(layoutHtml, page.subject);
    layoutHtml = injectLinkStyleSheet(layoutHtml, cssFiles);
    layoutHtml = injectEmailPreview(layoutHtml, page.emailPreview);
    layoutHtml = injectSharedHeadStyles(layoutHtml, page.sharedHeadCss);
    layoutHtml = injectSignature(layoutHtml, signature);
    layoutHtml = injectImagePathsLayout(layoutHtml, layoutPaths, configuration);

    let templateHtml = page.body;
    templateHtml = injectImagePathsTemplate(templateHtml, templatePath, configuration)
    templateHtml = injectCopyright(templateHtml);
    templateHtml = injectMarketingUTM(templateHtml, page.utmCampaigns);

    let finalTemplate = injectTemplateToLayout(layoutHtml, templateHtml);
    finalTemplate = finalTemplate = toInlineStyles(finalTemplate);

    return finalTemplate;
}

module.exports.buildTemplate = buildTemplate;
