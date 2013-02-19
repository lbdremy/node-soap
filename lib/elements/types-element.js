/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
	SchemaElement = require('./schema-element'),
    assert = require('assert').ok;

/**
 * Expose `TypesElement` class
 */

module.exports = TypesElement;

/**
 * `TypesElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function TypesElement(nsName, attrs){
	Element.call(this,nsName, attrs);
	this.schemas = {};
}

// Inherits of `Element`
util.inherits(TypesElement,Element);

TypesElement.prototype.addChild = function(child) {
    assert(child instanceof SchemaElement);
    this.schemas[child.$targetNamespace] = child;
};