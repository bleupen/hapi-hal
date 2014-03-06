'use strict';

var hoek = require('hoek');
var path = require('path');

// Declare internals

var internals = {};


// Defaults

internals.defaults = {

};

// Version
internals.version = hoek.loadPackage(path.join(__dirname, '..')).version;

exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);

    if (settings.version) {
        plugin.route({
            method: 'GET',
            path: settings.version,
            handler: function (request, reply) {

                reply(internals.version);
            },
            config: {
                description: "Display the version number of the current root module."
            }
        });
    }

    if (settings.plugins) {
        plugin.route({
            method: 'GET',
            path: settings.plugins,
            handler: function (request, reply) {

                reply(listPlugins(request.server));
            },
            config: {
                description: "Display a list of the plugins loaded in the server with their versions."
            }
        });
    }

    var listPlugins = function (server) {

        var plugins = [];
        Object.keys(server.pack.list).forEach(function (name) {

            var plug = server.pack.list[name];
            plugins.push({
                name: plug.name,
                version: plug.version
            });
        });

        return plugins;
    };

    plugin.expose({ plugins: listPlugins });

    next();
};