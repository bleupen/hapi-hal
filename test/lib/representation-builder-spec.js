'use strict';

var RepresentationBuilder = require('../../lib/representation-builder').RepresentationBuilder;
var Namespace = require('../../lib/namespace').Namespace;

var should = require("chai").should();
var hapi = require('hapi');

describe('RepresentationBuilder', function () {
    var rb, ns, ui, ordersRel, viewRel;

    beforeEach(function () {
        rb = new RepresentationBuilder('/rels');
        ns = new Namespace('myapp', 'app');
        ui = new Namespace('ui');
        ordersRel = ns.rel({name: 'orders'});
        viewRel = ui.rel({name: 'view'});
    });

    it('should create a new representation for an entity/url', function () {
        var rep = rb.create({name: 'Brad'}, '/users/me');
        rep.name.should.equal('Brad');
        rep._links.self.href.should.equal('/users/me');
    });

    it('should resolve rels in expanded form', function () {
        var href = rb.resolve(ordersRel, true);
        href.should.equal('/rels/myapp/orders');
    });

    it('should resolve rels in curied form', function () {
        var href = rb.resolve(ordersRel);
        href.should.equal('app:orders');
    });

    it('should resolve a rel literal', function () {
        var href = rb.resolve('next');
        href.should.equal('next');
    });

    it('should resolve a rel with no namespace', function () {
        var href = rb.resolve({ name: 'prev'});
        href.should.equal('prev');
    });

    it('should add a curies link to a representation', function () {
        var rep = rb.create({name: 'Brad'}, '/users/me');
        var href = rb.resolve(ordersRel);
        rb.addCuries(rep);
        rep._links.curies.name.should.equal('app');
        rep._links.curies.href.should.equal('/rels/myapp/{rel}');
        rep._links.curies.templated.should.be.true;
    });

    it('should handle multiple curies', function () {
        var rep = rb.create({name: 'Brad'}, '/users/me');
        rb.resolve(ordersRel);
        rb.resolve(viewRel);
        rb.addCuries(rep);
        rep._links.curies.length.should.equal(2);
    });
});