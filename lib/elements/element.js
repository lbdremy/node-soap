/**
 * Module dependencies
 */

var utils = require('../utils'),
    splitNSName = utils.splitNSName,
    extend = utils.extend;

/**
 * Expose `Element` class
 */

module.exports = Element;


/**
 * `Element` class
 *
 * @param {String} nsName -
 * @param {Array} attrs -
 *
 * @constructor
 * @api private
 */

function Element(nsName, attrs) {
    var parts = splitNSName(nsName);

    this.nsName = nsName;
    this.namespace = parts.namespace;
    this.name = parts.name;
    this.children = [];
    this.xmlns = {};
    for (var key in attrs) {
        var match = /^xmlns:?(.*)$/.exec(key);
        if (match) {
            this.xmlns[match[1]] = attrs[key];
        }
        else {
            this['$'+key] = attrs[key];
        }
    }
}

Element.prototype.deleteFixedAttrs = function() {
    this.children && this.children.length === 0 && delete this.children;
    this.xmlns && Object.keys(this.xmlns).length === 0 && delete this.xmlns;
    delete this.nsName;
    delete this.namespace;
    delete this.name;
}

Element.prototype.allowedChildren = [];

Element.prototype.startElement= function(stack, nsName, attrs) {
    if (!this.allowedChildren) return;

    var childClass = this.allowedChildren[splitNSName(nsName).name],
        element = null;

    if (childClass) {
        stack.push(new childClass(nsName, attrs));
    }
    else {
        this.unexpected(nsName);
    }

}

Element.prototype.endElement = function(stack, nsName) {
    if (this.nsName === nsName) {
        if(stack.length < 2 ) return;
        var parent = stack[stack.length - 2];
        if (this !== stack[0]) {
            extend(stack[0].xmlns, this.xmlns);
            // delete this.xmlns;
            parent.children.push(this);
            parent.addChild(this);
        }
        stack.pop();
    }
}

Element.prototype.addChild = function(child) { return; }

Element.prototype.unexpected = function(name) {
    throw new Error('Found unexpected element (' + name + ') inside ' + this.nsName);
}

Element.prototype.description = function(definitions) {
    return this.$name || this.name;
}