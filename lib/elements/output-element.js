/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util');

/**
 * Expose `OutputElement` class
 */

module.exports = OutputElement;

/**
 * `OutputElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function OutputElement(nsName, attrs){
	Element.call(this,nsName, attrs);
}

// Inherits of `Element`
util.inherits(OutputElement,Element);

OutputElement.prototype.addChild = function(child) {
    if (child.name === 'body') {
        this.use = child.$use;
        if (this.use === 'encoded') {
            this.encodingStyle = child.$encodingStyle;
        }
        this.children.pop();
    }
};