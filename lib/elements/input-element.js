/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util');

/**
 * Expose `InputElement` class
 */

module.exports = InputElement;

/**
 * `InputElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function InputElement(nsName, attrs){
	Element.call(this,nsName, attrs);
}

// Inherits of `Element`
util.inherits(InputElement,Element);

InputElement.prototype.addChild = function(child) {
    if (child.name === 'body') {
        this.use = child.$use;
        if (this.use === 'encoded') {
            this.encodingStyle = child.$encodingStyle;
        }
        this.children.pop();
    }
};