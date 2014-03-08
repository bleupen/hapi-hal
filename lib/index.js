'use strict';

var hoek = require('hoek');
var path = require('path');
var util = require('util');
var hal = require('hal');
var template = require('url-template');
var _ = require('lodash');

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

function RepresentationBuilder(settings) {
    this.settings = settings;
}

RepresentationBuilder.prototype.create = function(entity, url) {
    return new hal.Resource(entity, url);
};

/**
 *
 * @param {Rel} rel
 * @param {string} expanded
 */
RepresentationBuilder.prototype.resolve = function (rel, expanded) {
    if (!rel.namespace) {
        return _.isObject(rel) ? rel.name : rel.toString();
    }
    if (expanded) {
        return path.resolve(this.settings.relsUrl, rel.namespace.name, rel.name);
    } else {
        return util.format('%s:%s', rel.namespace.prefix, rel.name);
    }
};

exports.Namespace = require('./namespace').Namespace;
exports.Rel = require('./rel').Rel;

exports.register = function (plugin, options, next) {
    plugin.views({
        engines: {
            html: 'swig'
        },
        path: './views'
    });

    var settings = hoek.applyToDefaults(internals.defaults, options);

    function addCuries(rep) {
        for (var i = 0; i < settings.namespaces.length; i++) {
            var ns = settings.namespaces[i];
            var link = new hal.Link('curies', path.resolve(settings.relsUrl, ns.name, '{rel}'));
            link.name = ns.prefix;
            link.templated = true;
            rep.link(link);
        }
    }

    function representationBuilder(entity, url) {
        return new hal.Resource(entity, url);
    }


    var rb = new RepresentationBuilder(settings);

    function apiHandler(req, reply) {
        var resource = new hal.Resource({}, req.url);
        var routes = req.server.table();
        for (var i = 0; i < routes.length; i++) {
            var route = routes[i];
            var rel = route.settings.app && route.settings.app.hal && route.settings.app.hal.apiRel;

            if (rel) {
                var href = routes[i].path;
                var link = new hal.Link(rb.resolve(rel), href);
                if (/{.*}/.test(href)) {
                    link.templated = true;
                }
                resource.link(link);
            }
        }
        addCuries(resource);
        reply(resource).type('application/hal+json');
    }

    plugin.ext('onPreResponse', function (request, extNext) {
        var halConfig = request.route.app && request.route.app.hal;
        if (halConfig && isFunction(halConfig.representation)) {
            halConfig.representation(request.response.source, request.path, rb, function(err, result) {
                if (err) {
                    extNext(err).status(500);
                } else {
                    addCuries(result);
                    extNext(result).type('application/hal+json');
                }
            });
        } else {
            extNext();
        }
    });

    function relHandler(namespace) {
        return function(req, reply) {
            var rel = namespace.rels[req.params.rel];
            if (rel) {
                reply.view('rel', rel);
            } else {
                reply('Not found').code(404);
            }
        };
    }

    plugin.route({ method: 'GET', path: settings.apiUrl + '/', handler: apiHandler});
    plugin.route({ method: 'GET', path: settings.apiUrl, handler: function (req, reply) {
        reply().redirect(settings.apiUrl + '/');
    }});

    for (var i = 0; i < settings.namespaces.length; i++) {
        var ns = settings.namespaces[i];
        plugin.route( { method: 'GET', path: util.format('%s/%s/{rel}', settings.relsUrl, ns.name), handler: relHandler(ns)} );
    }
    next();
};