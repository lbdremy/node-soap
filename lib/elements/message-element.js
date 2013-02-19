/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
	utils = require('../utils'),
    splitNSName = utils.splitNSName,
    assert = require('assert').ok;

/**
 * Expose `MessageElement` class
 */

module.exports = MessageElement;

/**
 * `MessageElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function MessageElement(nsName, attrs){
	Element.call(this,nsName, attrs);
	this.element = null;
    this.parts = null;
}

// Inherits of `Element`
util.inherits(MessageElement,Element);

MessageElement.prototype.description = function(definitions) {
    if (this.element) {
        return this.element && this.element.description(definitions);
    }
    var desc = {};
    desc[this.$name] = this.parts;
    return desc;
};

MessageElement.prototype.postProcess = function(definitions) {
    var part = null, child,
        children = this.children || [];

    for (var i in children) {
        if ((child = children[i]).name === 'part') {
            part = child;
            break;
        }
    }
    if (!part) return;
    if (part.$element) {
        delete this.parts;
        var nsName = splitNSName(part.$element);
        var ns = nsName.namespace;
        this.element = definitions.schemas[definitions.xmlns[ns]].elements[nsName.name];
        this.element.targetNSAlias = ns;
        this.element.targetNamespace = definitions.xmlns[ns];
        this.children.splice(0,1);
    }
    else {
        // rpc encoding
        this.parts = {};
        delete this.element;
        for (var i=0, part; part = this.children[i]; i++) {
            assert(part.name === 'part', 'Expected part element');
            var nsName = splitNSName(part.$type);
            var ns = definitions.xmlns[nsName.namespace];
            var type = nsName.name;
            var schemaDefinition = definitions.schemas[ns];
            if (typeof schemaDefinition !== 'undefined') {
                this.parts[part.$name] = definitions.schemas[ns].types[type] || definitions.schemas[ns].complexTypes[type];
            } else {
                this.parts[part.$name] = part.$type;
            }
            this.parts[part.$name].namespace = nsName.namespace;
            this.parts[part.$name].xmlns = ns;
            this.children.splice(i--,1);
        }
    }
    this.deleteFixedAttrs();
};