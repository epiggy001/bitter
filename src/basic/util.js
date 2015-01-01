/*
 * All utility functions defined there
 */

/*jshint -W053*/
/*jshint -W041*/
/*jshint eqeqeq: false*/
/*jshint eqnull: true*/
define([], function() {
  'use strict';
  var toString = Object.prototype.toString;
  var _clone = function(obj, stack) {
    // Handle simple type
    if (typeof obj !== 'object') {
      return obj;
    }
    // Handle Object
    // null
    if (obj === null) {
      return null;
    }

    var klass = toString.call(obj);
    // Number object
    if (klass === '[object Number]') {
      return new Number(+obj)
    }
    // Boolean object
    if (klass === '[object Boolean]') {
      if (obj == true) {
        return new Boolean(1);
      } else {
        return new Boolean(0);
      }
    }
    // String object
    if (klass === '[object String]') {
      return new String(obj.toString());
    }
    // Date object
    if (klass === '[object Date]') {
      return new Date(obj.getTime());
    }
    // RegExp object
    if (klass === '[object RegExp]') {
      return new RegExp(obj);
    }

    if (klass === '[object Function]') {
      return obj;
    }

    for (var j = 0; j < stack.length; j++) {
      if (stack[j][0] === obj) {
        return stack[j][1];
      }
    }

    if (klass === '[object Array]') {
      var o = [];
      stack.push([obj, o]);
      for (var i = 0; i < obj.length; i++) {
        o[i] = _clone(obj[i], stack);
      }
    } else {
      var o = {};
      stack.push([obj, o]);
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          o[prop] = _clone(obj[prop], stack);
        }
      }
    }
    stack.pop();
    return o;
  };

  var isFunc = function(f) {
    return toString.call(f) === '[object Function]';
  }

  var _equal = function(a, b, astack, bstack) {
    // Handle simple value
    if (a === b) {
      // 0 !== -0
      return a !== 0 || 1/a == 1/b;
    }
    // Handle null !== undefined
    if (a == null || b == null) {
      return a === b;
    }

    var klass = toString.call(a);
    if (klass !== toString.call(b)) {
      return false;
    }

    if (klass === '[object String]') {
      return a == String(b);
    }

    if (klass === '[object Number]') {
      return a != +a ? b != +b : (a == 0 ? 1/a == 1/b : a == +b);
    }

    if (klass === '[object Date]' || klass === '[object Boolean]') {
      return +a == +b;
    }

    if (klass === '[object RegExp]') {
      return (a.source == b.source && a.global == b.global &&
        a.multiline == b.multiline && a.ignoreCase == b.ignoreCase);
    }


    var ac = a.constructor;
    var bc = b.constructor;
    if (ac !== bc && !(isFunc(ac) && (ac instanceof ac) && isFunc(bc) &&
      (bc instanceof bc)) && ('constructor' in a && 'constructor' in b)) {
      return false;
    }

    for (var i = 0; i < astack.length; i++) {
      if (astack[i] === a) {
        return bstack[i] === b;
      }
    }

    astack.push(a);
    bstack.push(b);

    var result = true;
    if (klass === '[object Array]') {
      if (a.length !== b.length) {
        result = false;
      }
      if (result) {
        for (var i = 0; i < a.length; i++) {
          result = _equal(a[i], b[i], astack, bstack);
          if (!result) {
            break;
          }
        }
      }
    } else {
      var size = 0;
      for (var key in a) {
        if (a.hasOwnProperty(key)) {
          size++;
          result = _equal(a[key], b[key], astack, bstack);
          if (!result) {
            break;
          }
        }
      }

      if (result) {
        for (key in b) {
          if (b.hasOwnProperty(key)) {
            size--;
          }
        }
        if (size != 0) {
          result = false;
        }

      }
    }

    astack.pop();
    bstack.pop();
    return result;
  };

  return {
    isObject: function(obj) {
      return toString.call(obj) === '[object Object]';
    },

    isArray: function(obj) {
      return toString.call(obj) === '[object Array]';
    },

    isString: function(obj) {
      return toString.call(obj) === '[object String]';
    },

    isFunc: isFunc,

    each: function(obj, fn) {
      var flag;
      if (this.isArray(obj)) {
        for (var i = 0; i < obj.length ; i++) {
          flag = fn(i, obj[i]);
          if (flag === false) {
            break;
          }
        }
      } else {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            flag = fn(key, obj[key]);
            if (flag === false) {
              break;
            }
          }
        }
      }
    },

    /*
     * Deap clone an object
     */
    clone: function (obj, deep) {
      if (deep) {
        return _clone(obj, []);
      } else {
        if (this.isObject(obj)) {
          var o = {};
          this.extend(o, obj);
          return o;
        } else if (this.isArray(obj)) {
          return obj.slice(0);
        } else {
          return obj;
        }
      }
    },

    equal: function(a, b) {
      return _equal(a, b, [], []);
    },

    extend: function(src, obj, deep) {
      if (this.isObject(src) && this.isObject(obj)) {
        this.each(obj, function(k, v) {
          if (deep) {
            src[k] = this.clone(v, true);
          } else {
            src[k] = v;
          }
        });
      }
    },
    /*
     * Generate a random string with given length and source
     * If source is not given, use all letters (both cases) and numbers
     * for default
     */
    randomStr: function(length, src) {
      var key = "";
      if (src) {
        var source = src;
      } else {
        var source =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      }
      for (var i = 0; i < length; i++) {
        key += source.charAt(Math.floor(Math.random() * source.length));
      }
      return key;
    },

    uuid: function() {
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
        function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
      });
      return uuid;
    },

    arrayRemove: function(o, e) {
      if (!this.isArray(o)) {
        return
      }
      var index = o.indexOf(e);
      if (index !== -1) {
        o.splice(index, 1);
      }
    },

    proxy: function(fn, context) {
      return function() {
        return fn.apply(context, arguments);
      }
    }
  };
});
