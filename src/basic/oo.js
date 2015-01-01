/*
 * All oo related methods defined in this module
 */
define(['./util'], function(util) {
  'use strict';
  var _defaultProto = {
    bind: function(ename, handler) {
      if (!this._callbacks) {
        this._callbacks = {};
      }
      if (!this._callbacks[ename]) {
        this._callbacks[ename] = [];
      }

      if (this._callbacks[ename].indexOf(handler) === -1) {
        this._callbacks[ename].push(handler);
      }
    },

    unbind: function(ename, handler) {
      if (!this._callbacks) {
        return;
      }
      if (this._callbacks[ename]) {
        if (util.equal(handler, undefined)) {
          this._callbacks[ename] = undefined;
          return;
        }
        util.arrayRemove(this._callbacks[ename], handler);
      }
    },

    trigger: function() {
      if (arguments.length > 0) {
        var ename = arguments[0];
      } else {
        return;
      }
      if ((this._callbacks) && (this._callbacks[ename])) {
        var args = Array.prototype.slice.call(arguments, 1);
        var self = this;
        util.each(this._callbacks[ename], function(i, v) {
          v.apply(self, args);
        });
      }
    }
  };

  var _create = function(obj) {
    var klass;
    var constructor;
    obj = obj || {};
    if (util.isFunc(obj.init)) {
      klass = obj.init;
    } else {
      klass = function() {};
    }

    if (util.isObject(obj.stat)) {
      util.each(obj.stat, function(key ,v) {
        klass[key] = util.clone(v, true);
      });
    }

    var f = function() {}
    f.prototype = _defaultProto;

    klass.prototype = new f();
    klass.prototype.construcor = klass;

    if (util.isObject(obj.proto)) {
      util.each(obj.proto, function(k, v) {
        klass.prototype[k] = util.clone(v, true);
      });
    }

    return klass;
  };

  var _extend = function(parent, obj) {
    if (!util.isFunc(parent)) {
      return;
    }
    var klass;
    var init;
    obj = obj || {};

    if (util.isFunc(obj.init)) {
      klass = function() {
        parent.apply(this, arguments)
        obj.init.apply(this, arguments)
      };
    } else {
      klass = function() {
        parent.apply(this, arguments)
      };
    }

    // Static methids and properties cannot be inherited
    if (util.isObject(obj.stat)) {
      util.each(obj.stat, function(k, v) {
        klass[k] = util.clone(v, true);
      });
    }

    var f = function() {};
    f.prototype = parent.prototype;
    klass.prototype = new f();
    klass.prototype.constructor = klass;

    if (util.isObject(obj.proto)) {
      util.each(obj.proto, function(k, v) {
        if (util.isFunc(v) && util.isFunc(parent.prototype[k])) {
          klass.prototype[k] = function() {
            this._super = parent.prototype[k];
            var o = v.apply(this, arguments);
            this._super = undefined;
            return o;
          };
        } else {
          klass.prototype[k] = util.clone(v, true);
        }
      });
    }

    return klass;
  };

  var _Decorator = _create({
    init: function(opt) {
      this._opt = opt;
    },

    proto: {
      apply: function(target) {
        var opt = this._opt;
        var klass = _extend(target);
        util.each(target, function(k, v) {
          klass[k] = v;
        });

        if (util.isObject(opt)) {
          util.each(opt, function(k,f) {
            if (!util.isFunc(f)) {
              return;
            }
            var method = klass.prototype[k]
            if ( util.isFunc(method)) {
              klass.prototype[k] = function() {
                var args = Array.prototype.splice.call(arguments, 0);
                var self = this;
                var instance = {};
                instance.run = function() {
                  return method.apply(self, args);
                }
                return f.call(this, k, instance, args);
              };
            } else if (method === undefined) {
              klass.prototype[k] = f;
            }
          });
        }
        return klass;
      }
    }
  });

  return ({
    defaultProto: _defaultProto,
    /*
     * Create a class
     * For example:
     *  oo = reqire ('./basic');
     *  var klass = oo.create({
     *    int: function(o) {
     *        ...
     *    } // Constructor,
     *    stat: {
     *      stat_func: function() {
     *        ...
     *      }
     *    } // Stastic function,
     *    proto: {
     *      func: function)() {
     *        ...
     *      }
     *    } // function for instacne
     *  });
     *
     *  Moreover there all there pre-defined functions for each class
     *    bind(name, handler) Bind handler to event for the instance
     *    unbind(name, hankler) Unbind handler for an event from the instance
     *    trigger(name) Trigger an event
     * */
    create: _create,

    /*
     * Extend a class
     * For example:
     *  var oo = require('./baisc.js');
     *  var klass= oo.extend(parent, {
     *   init: function() {
     *    ...
     *   },
     *   proto: {
     *    func: function(o) {
     *      this._super(o) // call method from super class
     *      ....
     *    }
     *   }
     * })
     */
    extend: _extend,

    /*
     * A decorator used to extend a set of classes in the same way.
     * It comes from the idea of AOP
     * (https://en.wikipedia.org/wiki/Aspect-oriented_programming)
     *
     * For example, there is a set of model classes, such as model1 and
     * model2, user may way to add a permission checking for insert function
     *
     * User can do like :
     *
     *  var oo = require('./oo');
     *  var modelDecorator = new oo.decorator({
     *    insert: function (methodName, instance, args) {
     *      if (hasPermission()) {
     *        instance.run();
     *      } else {
     *        return;
     *      }
     *    }
     *    // methodName is the function name which you want to modified,
     *    // in this case, 'insert'.
     *    // instance is an object used to call the original function
     *    // by instance.run();
     *    // args is the arguments send to the function
     *  });
     *
     *  var permissionModel1 = modelDecorator.apply(model1);
     *  var permissionModel2 = modelDecorator.apply(model2);
     *
     *  var myModel1 = new permissionModel1({...});
     *  var myModel2 = new permissionModel2({...});
     */
    Decorator: _Decorator
  });
});
