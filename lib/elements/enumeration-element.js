/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util');

/**
 * Expose `EnumerationElement` class
 */

module.exports = EnumerationElement;

/**
 * `EnumerationElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function EnumerationElement(nsName, attrs){
	Element.call(this,nsName, attrs);
}

// Inherits of `Element`
util.inherits(EnumerationElement,Element);

EnumerationElement.prototype.description = function() {
   return this.$value;
};