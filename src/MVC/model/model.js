/*
 * Base class of model. Use a object to store data in memory
 * For exmaple:
 * var model = require('./model');
 * var jobModel = new model({
 *   fields: [{name: 'field1' ,default:'my-field'}, {name:'field2'}],
 *   primary: 'field1', // Required, default value is ID,
 *   validate: function(rec) {
 *    ...
 *   }
 *  // Validation function for each record,
 *  // if is valid return true else return false
 * });
 */

define(['../../basic/oo', '../../basic/util', './record'], function(oo, util,
  record) {
  'use strict';
  var Model = oo.create({
    init: function(opt) {
      var opt = opt || {};
      this._store = [];
      this.Record = new record.create({
        fields: opt.fields,
        validators: opt.validators
      });
      this.primary = opt.primary ? opt.primary : 'id';
    },

    proto: {
      _genKey: function(rec) {
        return rec[this.primary] !== undefined ? rec[this.primary] :
          util.uuid();
      },

      _get: function(input) {
        var key;
        if (util.isObject(input) && input._key_ !== undefined) {
          key = input._key_;
        } else {
          key = input;
        }
        return this._store.
          filter(function(v, i) {return key === v._key_}).pop();
      },

      // Insert a record
      insert: function(obj) {
        var rec = new this.Record(obj);
        var errs = rec.validate();
        if (errs.length > 0) {
          this.trigger('onInsertError', errs);
          return;
        }

        rec._key_ = this._genKey(rec);
        this._store.push(rec);
        this.trigger('onInsert', rec);
        this.trigger('onChange');
        return rec;
      },

      // Delete a record
      remove: function(input) {
        var rec = this._get(input);
        if (rec) {
          util.arrayRemove(this._store, rec);
          this.trigger('onRemove', rec);
          this.trigger('onChange');
        }
      },

      // Update a record
      update: function(input, obj) {
        var rec = this._get(input);
        if (rec) {
          var oldRec = rec.clone(true);
          var newRec = rec.clone();
          util.extend(newRec, obj);
          var errs = newRec.validate();
          if (errs.length > 0) {
            this.trigger('onUpdateError', errs);
            return;
          }
          util.extend(rec, obj);
          this.trigger('onUpdate', oldRec, rec);
          this.trigger('onChange');
        }
        return rec;
      },

      // Given length of the model
      count: function() {
        return this._store.length;
      },


      records: function() {
        var data = this._store.slice(0);
        if (arguments.length === 0) {
          return data;
        }
        var sorter = arguments[0]
        if (util.isFunc(sorter)) {
          data.sort(sorter);
        }
        var filters = Array.prototype.slice.call(arguments, 1);
        filters = Array.prototype.concat.apply([], filters);
        util.each(filters, function(i, f) {
          if (util.isFunc(f)) {
            data = data.filter(f);
          }
        });
        return data;
      },

      // Reload the model with given data
      load: function(data) {
        if (util.isArray(data)) {
          var self = this;
          this._store = [];
          util.each(data, function(i, o) {
            var rec = new self.Record(o);
            var errs = rec.validate();
            if (errs.length > 1) {
              console.error('Fail to create record', errs);
            }
            rec._key_ = self._genKey(rec);
            self._store.push(rec);
          });
          this.trigger('onLoad');
        }
      },

      // Clear all data
      clear: function() {
        this._store = [];
        this.trigger('onClear');
        this.trigger('onChange');
      },

      // Find a record with its primary key
      get: function(key) {
        return this._get(key);
      }
    }
  });
  return Model;
});
