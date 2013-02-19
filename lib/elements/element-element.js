/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
	Primitives = require('../utils').Primitives,
	utils = require('../utils'),
    splitNSName = utils.splitNSName,
    ComplexTypeElement = require('./complex-type-element');

/**
 * Expose `ElementElement` class
 */

module.exports = ElementElement;

/**
 * `ElementElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function ElementElement(nsName, attrs){
	Element.call(this,nsName, attrs);
}

// Inherits of `Element`
util.inherits(ElementElement,Element);

ElementElement.prototype.description = function(definitions) {
    var element = {},
        name = this.$name,
        schema;
    if (this.$minOccurs !== this.$maxOccurs) {
        name += '[]';
    }

    if (this.$type) {
        var typeName = splitNSName(this.$type).name,
            ns = definitions.xmlns[splitNSName(this.$type).namespace],
            schema = definitions.schemas[ns],
            typeElement = schema && ( schema.complexTypes[typeName] || schema.types[typeName] );
        if (typeElement && !(typeName in Primitives)) {
            element[name] = typeElement.description(definitions);
        }
        else
            element[name] = this.$type;
    }
    else {
        var children = this.children;
        element[name] = {};
        for (var i=0, child; child=children[i]; i++) {
            if (child instanceof ComplexTypeElement)
                element[name] = child.description(definitions);
        }
    }
    return element;
};