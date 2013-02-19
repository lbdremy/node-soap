exports.mapElementTypes = function mapElementTypes(types) {
    var types = types.split(' ');
    var rtn = {}
    types.forEach(function(type){
        rtn[type.replace(/^_/,'')] = (ElementTypeMap[type] || [Element]) [0];
    });
    return rtn;
};

exports.splitNSName = function splitNSName(nsName) {
    var i = (nsName != null) ? nsName.indexOf(':') : -1;
    return i < 0 ? {namespace:null,name:nsName} : {namespace:nsName.substring(0, i), name:nsName.substring(i+1)};
};

exports.xmlEscape = function xmlEscape(obj) {
    if (typeof(obj) === 'string') {
        return obj
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
    }

    return obj;
};

var trimLeft = /^[\s\xA0]+/;
var trimRight = /[\s\xA0]+$/;
exports.trim = function trim(text) {
    return text.replace(trimLeft, '').replace(trimRight, '');
};

exports.extend = function extend(base, obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            base[key] = obj[key];
        }
    }
    return base;
};

exports.findKey = function findKey(obj, val) {
    for (var n in obj) if (obj[n] === val) return n;
};

exports.Primitives = {
    string: 1, boolean: 1, decimal: 1, float: 1, double: 1,
    anyType: 1, byte: 1, int: 1, long: 1, short: 1,
    unsignedByte: 1, unsignedInt: 1, unsignedLong: 1, unsignedShort: 1,
    duration: 0, dateTime: 0, time: 0, date: 0,
    gYearMonth: 0, gYear: 0, gMonthDay: 0, gDay: 0, gMonth: 0,
    hexBinary: 0, base64Binary: 0, anyURI: 0, QName: 0, NOTATION: 0
};