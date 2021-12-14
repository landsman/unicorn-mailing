const juice = require('juice');
const getStylesheetList = require('list-stylesheets');
const {getCssContent} = require("./file-system");

/**
 * convert <style> to inline css on each element
 *
 * @param data
 * @returns {string}
 */
function toInlineStyles(data) {
    const fileParser = getStylesheetList(data, {
        applyLinkTags: true,
        removeLinkTags: true
    });
    const allCss = getCssContent(fileParser.hrefs);

    return juice.inlineContent(fileParser.html, allCss);
}

module.exports.toInlineStyles = toInlineStyles;
