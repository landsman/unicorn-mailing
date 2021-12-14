/**
 * Merge deep objects
 * Credit: http://stackoverflow.com/a/20591261/3783469
 * @param target
 * @returns {*}
 */
function mergeObject(target)
{
    for(let i=1; i<arguments.length; ++i)
    {
        let from = arguments[i];
        if(typeof from !== 'object') continue;

        for(let j in from)
        {
            if(from.hasOwnProperty(j))
            {
                target[j] = typeof from[j]==='object'
                    ? mergeObject({}, target[j], from[j])
                    : from[j];
            }
        }
    }

    return target;
}

module.exports.mergeObject = mergeObject;
