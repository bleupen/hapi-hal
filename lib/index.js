'use strict';

var hoek = require('hoek');
var path = require('path');
var util = require('util');
var hal = require('hal');
var RepresentationBuilder = require('./representation-builder').RepresentationBuilder;
var Rel = require('./rel').Rel;
var Namespace = require('./namespace').Namespace;
var Collection = require('./collection').Collection;
var _ = require('lodash');

// Declare internals

var internals = {};


// Defaults

internals.defaults = {
    relsUrl: '/rels',
    apiUrl: '/api',
    apiServerLabel: null
};

// Version
internals.version = hoek.loadPackage(path.join(__dirname, '..')).version;
internals.namespaces = [];

module.exports.Namespace = Namespace;
module.exports.Rel = Rel;
module.exports.Collection = Collection;

module.exports.namespace = function (name, prefix, rels) {
    return new Namespace(name, prefix, rels);
};

module.exports.rel = function (config, namespace) {
    return new Rel(config, namespace);
};

module.exports.collection = function (items, start, limit, total) {
    return new Collection(items, start, limit, total);
};

module.exports.representations = require('./representations');

module.exports.register = function (plugin, options, next) {
    plugin.expose('namespaces', function (namespaces) {
        internals.namespaces = {};
        namespaces.forEach(function (ns) {
            internals.namespaces[ns.name] = ns;
        });
    });

    plugin.expose('namespace', function(name, prefix, rels) {
        if (internals.hasOwnProperty(name)) {
            throw new Error('A namespace with that name already exists');
        }

        var namespace = module.exports.namespace(name, prefix, rels);
        internals.namespaces[namespace.name] = namespace;
        return namespace;
    });

    plugin.views({
        engines: {
            html: 'swig'
        },
        path: './views'
    });

    var settings = hoek.applyToDefaults(internals.defaults, options);

    // strip trailing / from api root
    if (settings.apiUrl.charAt(settings.apiUrl.length - 1) === '/') {
        settings.apiUrl = settings.apiUrl.substr(0, settings.apiUrl.length - 1);
    }

    /**
     * Aggregates all routes tagged with app.hal.apRel into a root api HAL representation.
     *
     * @param req the Hapi request
     * @param reply the Hapi reply
     */
    function apiHandler(req, reply) {

        var rb = new RepresentationBuilder(settings.relsUrl);
        var resource = rb.create({}, req.url);

        // grab the routing table and iterate
        var routes = req.server.table();
        for (var i = 0; i < routes.length; i++) {
            var route = routes[i];

            // :\
            var halConfig = route.settings.app && route.settings.app.hal;

            if (halConfig && halConfig.apiRel) {
                var rel = halConfig.apiRel;
                var href = routes[i].path;

                // grab query options
                if (halConfig.query) {
                    href += halConfig.query;
                }

                // check if link is templated
                var link = new hal.Link(rb.resolve(rel), href);
                if (/{.*}/.test(href)) {
                    link.templated = true;
                }

                // todo process validations for query parameters
                resource.link(link);
            }
        }

        // handle any curies
        rb.addCuries(resource);
        reply(resource).type('application/hal+json');
    }

    /**
     * Handles all the rels for a given namespace
     * @param req
     * @param reply
     */
    function relHandler(req, reply) {
        var rel = internals.namespaces[req.params.namespace] && internals.namespaces[req.params.namespace][req.params.rel];
        if (rel) {
            reply.view('rel', rel);
        } else {
            reply('Not found').code(404);
        }
    }

    var selection = settings.apiServerLabel ? plugin.select(settings.apiServerLabel) : plugin;

    /**
     * Attaches a response handler to handle HAL representation building specified by the route config
     */
    selection.ext('onPreResponse', function (request, extNext) {
        var statusCode = request.response.statusCode;

        if (request.headers.accept &&
            request.headers.accept.indexOf('application/hal+json') >= 0 &&
            (statusCode === 200 || statusCode === 201) &&
            _.isObject(request.response.source)) {

            var halConfig = (request.route.app && request.route.app.hal) || {};
            var entity = request.response.source;
            var rb = new RepresentationBuilder(settings.relsUrl, request);
            rb.toHal(entity, request.path, halConfig, function (err, result) {
                if (err) {
                    extNext(err).code(500);
                } else {
                    rb.addCuries(result);
                    extNext(result).type('application/hal+json');
                }
            });
        } else {
            extNext();
        }
    });

    // bind the API handler to api root + '/'. Ending with '/' is necessary for resolving relative links on the client
    selection.route({ method: 'GET', path: settings.apiUrl + '/', config: { auth: false, handler: apiHandler} });

    // set up a redirect to api root + '/'
    if (settings.apiUrl.length > 0) {
        selection.route({
            method: 'GET',
            path: settings.apiUrl,
            config: {
                auth: false,
                handler: function (req, reply) {
                    reply().redirect(settings.apiUrl + '/');
                }
            }
        });
    }

    selection.route({
        method: 'GET',
        path: util.format('%s/{namespace}/{rel}', settings.relsUrl),
        config: {
            auth: false,
            handler: relHandler
        }
    });

    next();
};