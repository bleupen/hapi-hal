'use strict';

var hoek = require('hoek');
var path = require('path');
var util = require('util');
var hal = require('hal');
var template = require('url-template');
var _ = require('_');

// Declare internals

var internals = {};


// Defaults

internals.defaults = {
    relsUrl: '/rels',
    apiUrl: '/api',
    namespaces: {}
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

function apiHandler(req, reply) {
    var resource = new hal.Resource({}, req.url);
    var routes = req.server.table();
    for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        var rel = route.settings.app && route.settings.app.hal && route.settings.app.hal.apiRel;

        if (rel) {
            resource.link(rel.name, routes[i].path);
        }
    }
    reply(resource);
}

function relsHandler(req, reply) {
    var resource = new hal.Resource({}, req.url);
    var routes = req.server.table();
    for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        var rel = route.settings.app && route.settings.app.hal && route.settings.app.hal.apiRel;

        if (rel) {
            resource.link(rel.name, routes[i].path);
        }
    }
    reply(resource);
}

exports.register = function (plugin, options, next) {

    var settings = hoek.applyToDefaults(internals.defaults, options);
    var rels = _.reduce(settings.rels, function (result, rel) {
        rels[rel.name] = rel;
    }, {});

    plugin.ext('onPreResponse', function (request, extNext) {
        var halConfig = request.route.app && request.route.app.hal;
        if (isFunction(halConfig)) {
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

    function relHandler(req, reply) {
        var rel = req.params.rel;
        var resource = new hal.Resource({}, req.url);
        var routes = req.server.table();
        for (var i = 0; i < routes.length; i++) {
            var route = routes[i];
            var rel = route.settings.app && route.settings.app.hal && route.settings.app.hal.apiRel;

            if (rel) {
                resource.link(rel.name, routes[i].path);
            }
        }
        reply(resource);
    }

    plugin.route({ method: 'GET', path: settings.apiUrl, handler: apiHandler});
    plugin.route({ method: 'GET', path: settings.relsUrl+'/{rel}', handler: apiHandler});
//    plugin.expose({ plugins: listPlugins });

    next();
};