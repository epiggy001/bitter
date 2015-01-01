/*
 * Define a class of record for model to store
 */
define(['../../basic/oo', '../../basic/util'], function(oo, util) {
 'use strict';
  var _create = function(opt) {
    opt = opt || {};
    var validators = opt.validators || {};
    var fields = {};
    util.each(opt.fields, function(i, v) {
      if (util.isString(v.name)) {
        fields[v.name] = v;
      }
    });

    var klass = oo.create({
      init: function(data) {
        var data = data || {};
        var self = this;
        this._tags_ = data._tags_ || [];
        util.each(fields, function(k, v) {
          self[k] = util.clone(v.def);
        });

        util.each(data, function(k, v) {
          self[k] = v;
        });
      },

      proto: {
        clone: function(deep) {
          var data = {};
          util.each(this, function(k, v) {
            data[k] = util.clone(v, deep);
          });
          return new klass(data);
        },

        tags: function() {
          return util.clone(this._tags_);
        },

        tag: function(tagName) {
          if (!util.isString(tagName)) {
            return;
          }
          var index = this._tags_.indexOf(tagName);
          if (index === -1) {
            this._tags_.push(tagName);
          }
        },

        untag: function(tagName) {
          util.arrayRemove(this._tags_, tagName);
        },

        hasTag: function(tagName) {
          return this._tags_.indexOf(tagName) !== -1;
        },

        validate: function() {
          var errors = [];
          var flag;
          var self = this;
          util.each(validators, function(k, v) {
            flag = v.func.call(self.clone(true));
            if (flag === false) {
              errors.push({name: k, msg: v.msg});
            }
          });
          return errors;
        },

        data: function() {
          var data = {};
          util.each(this, function(k, v) {
            if (k.charAt(0) !== '_') {
              data[k] = util.clone(v, true);
            }
          });
          return data;
        }
      }
    });
    return klass;
  };

  return {
    create: _create
  }
});
