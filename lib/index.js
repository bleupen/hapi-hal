'use strict';

var hoek = require('hoek');
var path = require('path');
var util = require('util');
var hal = require('hal');
var template = require('url-template');

// Declare internals

var internals = {};


// Defaults

internals.defaults = {
    relsUrl: '/rels',
    namespace: 'app'
};

// Version
internals.version = hoek.loadPackage(path.join(__dirname, '..')).version;

function isFunction(value) { return typeof value === 'function'; }

function ResponseBuilder(config) {
    this.config = config;
}

ResponseBuilder.prototype.build = function(request, extNext) {
    var entity = request.response.source;

    var resource = new hal.Resource(entity, request.path);
    for (var rel in this.config.links) {
        var link = new hal.Link(rel, this.config.links[rel]);
        var href = /{\w*}/.test(link.href) ? template.parse(link.href).expand(entity) : link.href;
        link.href = path.resolve(request.path, href);
        resource.link(link);
    }
    extNext(resource).type('application/hal+json');
};

exports.register = function (plugin, options, next) {

    var settings = hoek.applyToDefaults(internals.defaults, options);

    plugin.ext('onPreResponse', function (request, extNext) {
        var halConfig = request.route.app && request.route.app.hal;
        if (isFunction(halConfig)) {
            var rep = new hal.Resource()
            halConfig(request.response.source, request.path, function(err, result) {
                if (err) {
                    extNext(err).status(500);
                } else {
                    extNext(result);
                }
            });
        } else {
            extNext();
        }
    });

//    plugin.expose({ plugins: listPlugins });

    next();
};