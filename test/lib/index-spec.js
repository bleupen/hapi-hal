'use strict';

var hh = require('../../lib/index');
var Namespace = require('../../lib/namespace').Namespace;

var should = require("chai").should();
var hapi = require('hapi');

describe('Hapi Hal plugin', function () {
    var ns = new Namespace('myapp', 'app');
    var usersRel = ns.rel({ name: 'users'});
    var meRel = ns.rel({ name: 'me'});

    var users = [
        { name: 'Brad' }
    ];

    var usersConfig = {
        handler: function(req, reply) { reply(users)},
        app: {
            hal: {
                query: '{?q}',
                apiRel: usersRel
            }
        }
    };

    var meConfig = {
        handler: function(req, reply) { reply('me')},
        app: {
            hal: {
                apiRel: meRel
            }
        }
    };

    it('should export a register function', function () {
        should.exist(hh.register);
    });

    it('should produce a root api document', function (done) {
        var server = new hapi.Server();
        server.route({ path: '/users', method: 'GET', config: usersConfig});
        server.pack.require('../../', {apiUrl: '/myapi'}, function(err) {
            should.not.exist(err);

            server.inject({ method: 'GET', url: '/myapi/'}, function (res) {
                var rep = res.result;
                rep._links.self.href.should.equal('/myapi/');
                rep._links.self.rel.should.equal('self');
                rep._links.curies.name.should.equal('app');
                rep._links.curies.href.should.equal('/rels/myapp/{rel}');
                rep._links.curies.templated.should.be.true;
                rep._links['app:users'].href.should.equal('/users{?q}');
                rep._links['app:users'].templated.should.be.true;
                done();
            });
        });
    });

    it('should redirect /myapi to /myapi/', function (done) {
        var server = new hapi.Server();
        server.route({ path: '/users', method: 'GET', config: usersConfig});
        server.pack.require('../../', {apiUrl: '/myapi'}, function(err) {
            should.not.exist(err);

            server.inject({ method: 'GET', url: '/myapi'}, function (res) {
                res.statusCode.should.equal(302);
                res.headers.location.should.match(/\/myapi\/$/);

                server.inject({ method: 'GET', url: '/myapi/'}, function (res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });

    it('should handle /myapi/', function (done) {
        var server = new hapi.Server();
        server.route({ path: '/users', method: 'GET', config: usersConfig});
        server.pack.require('../../', {apiUrl: '/myapi/'}, function(err) {
            should.not.exist(err);

            server.inject({ method: 'GET', url: '/myapi'}, function (res) {
                res.statusCode.should.equal(302);
                res.headers.location.should.match(/\/myapi\/$/);
                done();
            });
        });
    });

    it('should produce a rels document', function (done) {
        var server = new hapi.Server();
        server.route({ path: '/users', method: 'GET', config: usersConfig});
        server.pack.require('../../', {relsUrl: '/myrels', namespaces: [ ns ]}, function(err) {
            should.not.exist(err);

            server.inject({ method: 'GET', url: '/myrels/myapp/users'}, function (res) {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    it('should return 404 for a bad rel', function (done) {
        var server = new hapi.Server();
        server.route({ path: '/users', method: 'GET', config: usersConfig});
        server.pack.require('../../', {relsUrl: '/myrels', namespaces: [ ns ]}, function(err) {
            should.not.exist(err);

            server.inject({ method: 'GET', url: '/myrels/myapp/orders'}, function (res) {
                res.statusCode.should.equal(404);
                done();
            });
        });
    });

    it('should build a representation from a response', function (done) {
        usersConfig.app.hal.representation = function(users, url, rb, next) {
            var entity = { items: users };
            next(null, rb.create(entity, url));
        };
        var server = new hapi.Server();
        server.route({ path: '/users', method: 'GET', config: usersConfig});
        server.pack.require('../../', {relsUrl: '/myrels', namespaces: [ ns ]}, function(err) {
            should.not.exist(err);

            server.inject({ method: 'GET', url: '/users'}, function (res) {
                res.statusCode.should.equal(200);
                res.result.items.should.equal(users);
                res.result._links.self.href.should.equal('/users');
                done();
            });
        });
    });

    it('should return status 500 if an error occurs building the representation', function (done) {
        usersConfig.app.hal.representation = function(users, url, rb, next) {
            next('Cannot build representation');
        };
        var server = new hapi.Server();
        server.route({ path: '/users', method: 'GET', config: usersConfig});
        server.pack.require('../../', {relsUrl: '/myrels', namespaces: [ ns ]}, function(err) {
            should.not.exist(err);

            server.inject({ method: 'GET', url: '/users'}, function (res) {
                res.statusCode.should.equal(500);
                res.result.should.equal('Cannot build representation');
                done();
            });
        });
    });

    it('should handle non-templated, non-queried rels', function (done) {
        var server = new hapi.Server();
        server.route({ path: '/me', method: 'GET', config: meConfig});
        server.pack.require('../../', {apiUrl: '/myapi'}, function(err) {
            should.not.exist(err);

            server.inject({ method: 'GET', url: '/myapi/'}, function (res) {
                var rep = res.result;
                rep._links.self.href.should.equal('/myapi/');
                rep._links.self.rel.should.equal('self');
                rep._links.curies.name.should.equal('app');
                rep._links.curies.href.should.equal('/rels/myapp/{rel}');
                rep._links.curies.templated.should.be.true;
                rep._links['app:me'].href.should.equal('/me');
                rep._links['app:me'].should.not.have.property('templated');
                done();
            });
        });
    });
});