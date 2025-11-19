/**
 * Wrapper for FrontMatter to have specified allowed attributes in code
 *
 * @param FrontMatterResult
 * @param configuration
 */
function getTemplateVariables(FrontMatterResult, configuration) {
    const a = FrontMatterResult.attributes;

    return {
        body: FrontMatterResult.body,
        layout: a.layout || configuration.defaultLayout,
        subject: a.subject || null,
        cssFiles: a.cssFiles || null,
        utmCampaigns: a.utmCampaigns || null,
        sharedHeadCss: a.sharedHeadCss || null,
        emailPreview: a.emailPreview || null,
        signature: a.signature || null
    }
}

/**
 * Response object for template and layout files
 *
 * @param fileName
 * @param relativePath
 * @param fileDestinationPath
 * @returns {{fileName: *, relativePath: *, fileDestinationPath: *}}
 */
function filePathsObject(fileName, relativePath, fileDestinationPath) {
    return {
        fileName: fileName,
        relativePath: relativePath,
        fileDestinationPath: fileDestinationPath
    }
}

module.exports.getTemplateVariables = getTemplateVariables;
module.exports.filePathsObject = filePathsObject;
