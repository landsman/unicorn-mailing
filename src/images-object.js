/**
 * Response from image parser
 *
 * @param from
 * @param to
 * @param localPath
 */
class ImageObject {
    constructor() {
        this.images = []
    }
    add(from, to, localPath, buildPath) {
        this.images.push({
            fromProvidedPath: from,
            toRemoteURL: to,
            localAbsolutePath: localPath,
            buildAbsolutePath: buildPath
        })
    }
    get() {
        return this.images;
    }
}

module.exports.ImageObject = ImageObject;
