'use strict';

var hoek = require('hoek');
var path = require('path');
var util = require('util');
var hal = require('hal');
var template = require('url-template');
var RepresentationBuilder = require('./representation-builder').RepresentationBuilder;
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

function isFunction(value) {
    return typeof value === 'function';
}


module.exports.Namespace = require('./namespace').Namespace;
module.exports.Rel = require('./rel').Rel;
module.exports.representations = require('./representations');

module.exports.register = function (plugin, options, next) {
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
     * @param namespace
     * @returns {Function}
     */
    function relHandler(namespace) {
        return function (req, reply) {
            var rel = namespace.rels[req.params.rel];
            if (rel) {
                reply.view('rel', rel);
            } else {
                reply('Not found').code(404);
            }
        };
    }

    /**
     * Attaches a response handler to handle HAL representation building specified by the route config
     */
    plugin.ext('onPreResponse', function (request, extNext) {
        var halConfig = request.route.app && request.route.app.hal;

        // eventually will support declarative reps but for now just a function
        if (halConfig && isFunction(halConfig.representation)) {
            var statusCode = request.response.statusCode;
            if (statusCode === 200 || statusCode === 201) {
                var rb = new RepresentationBuilder(settings.relsUrl);
                halConfig.representation(request.response.source, request.path, rb, function (err, result) {
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
        } else {
            extNext();
        }
    });

    // bind the API handler to api root + '/'. Ending with '/' is necessary for resolving relative links on the client
    plugin.route({ method: 'GET', path: settings.apiUrl + '/', config: { auth: false, handler: apiHandler} });

    // set up a redirect top api root + '/'
    plugin.route({ method: 'GET', path: settings.apiUrl, handler: function (req, reply) {
        reply().redirect(settings.apiUrl + '/');
    }});

    // bind rel handlers to each namespace
    for (var i = 0; i < settings.namespaces.length; i++) {
        var ns = settings.namespaces[i];
        plugin.route({ method: 'GET', path: util.format('%s/%s/{rel}', settings.relsUrl, ns.name), handler: relHandler(ns)});
    }
    next();
};