var async = require('async');
var template = require('url-template');

/**
 * Creates a simple representation annotated with only _self link
 * @param request the request
 * @param config the HAL config on the route
 * @param rb representation builder
 * @param done callback
 */
module.exports.simple = function(request, config, rb, done) {
    done(null, rb.create(this, request.path));
};

/**
 * Creates a collection representation builder function
 * @param rel
 * @param embeddedRep
 * @param urlTemplate
 * @return {Function}
 */
module.exports.collection = function (rel, embeddedRep, urlTemplate) {
    urlTemplate = template.parse(urlTemplate);

    return function (entity, url, rb, done) {
        function embed(entity, cb) {
            var embedUrl = urlTemplate.expand(entity);
            embeddedRep(entity, path.resolve(url, embedUrl), rb, cb);
        }

        var rep = rb.create(entity, url);
        delete rep.items;

        async.map(entity.items, embed, function (err, results) {
            rep.embed(rb.resolve(rel), results, false);
            done(null, rep);
        });
    };
};