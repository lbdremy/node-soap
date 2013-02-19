/**
 * Module dependencies
 */

var Element = require('./element'),
    util = require('util');

/**
 * Expose `PortElement` class
 */

module.exports = PortElement;
/**
 * `PortElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function PortElement(nsName, attrs){
    Element.call(this,nsName, attrs);
    this.location = null;
}

// Inherits of `Element`
util.inherits(PortElement,Element);

PortElement.prototype.addChild = function(child) {
    if (child.name === 'address' && typeof(child.$location) !== 'undefined') {
       this.location = child.$location;
    }
};