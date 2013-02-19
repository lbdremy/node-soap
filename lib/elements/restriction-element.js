/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util');

/**
 * Expose `RestrictionElement` class
 */

module.exports = RestrictionElement;

/**
 * `RestrictionElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function RestrictionElement(nsName, attrs){
	Element.call(this,nsName, attrs);
}

// Inherits of `Element`
util.inherits(RestrictionElement,Element);

RestrictionElement.prototype.description = function() {
    var base = this.$base ? this.$base+"|" : "";
    return base + this.children.map( function(child) {
       return child.description();
    } ).join(",");
};