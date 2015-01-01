define(['../../basic/oo',
  '../../basic/util',
  './model',
  '../view/ejs',
  'jquery'], function(oo, util, Model, ejs, $) {
  var E = function(msg) {
    this.errMsg = msg;
  };

  var createEndpoints = function(base, primary, customize) {
    base = base.replace(/[\/]+$/, "");
    var endpoints = {
      'base': base,

      'insert': {
        url: base,
        method: 'POST'
      },

      'update': {
        url: '{= base}/{= ' + primary + '}',
        method:'PUT'
      },

      'remove': {
        url: '{= base}/{= ' + primary + '}',
        method:'DELETE'
      },

      'load': {
        url: base,
        method: 'GET'
      }
    };

    util.extend(endpoints, customize);
    return endpoints;
  };

  var AjaxModel = oo.extend(Model, {
    init: function(opt) {
      var opt = opt || {};
      this.dataType = opt.dataType || 'json';
      this.d = undefined;

      var url = opt.url;
      var self = this;


      if (util.isString(url)) {
        this.endpoints = createEndpoints(url, this.primary);
      } else if (util.isObject(url)) {
        var base = url.base;
        delete url.base;
        this.endpoints = createEndpoints(base, this.primary, url);
      }
    },

    stat: {
      parsers: []
    },

    proto: {
      _processData: function(data, defer) {
        return data;
      },

      _createUrl: function(point, key, postfix) {
        var o = {};
        o[this.primary] = key;
        o['base'] = this.endpoints.base;
        o.close = '}';
        o.open = '{';
        var url = ejs.render(this.endpoints[point].url, o);

        if (postfix) {
          url = url.replace(/[\/]+$/, "") + '/' + postfix;
        }
        return url;
      },

      load: function() {
        var url = this.endpoints.load.url;
        var self = this;
        var _super = util.proxy(this._super, this);
        this.d = $.Deferred(function(defer) {
          $.ajax({
            url: url,
            type: self.endpoints.load.method,
            dataType: self.dataType
          }).done(function(data) {
            data = self._processData(data, defer)
            if (data === false) {
              return;
            }
            _super(data);
            defer.resolve(data);
          }).fail(defer.reject);
        }).promise();

        return this.d;
      },

      once: function() {
        if (!this.loaded()) {
          this.load();
        }
        return this.d;
      },

      loaded: function() {
        return this.d !== undefined;
      },

      insert: function(obj) {
        var rec = new this.Record(obj);
        var errs = rec.validate();

        if (errs.length > 0) {
          throw new E(errs);
        }

        var self = this;
        var url = this.endpoints.insert.url;
        var method = this.endpoints.insert.method;
        var d = $.Deferred(function(defer) {
          $.ajax({
            url: url,
            type: method,
            data: JSON.stringify(rec.data()),
            contentType: 'application/json',
            processData: false,
            dataType: self.dataType
          }).done(function(data) {
            data = self._processData(data, defer)
            if (data === false) {
              return;
            }
            util.extend(rec, data)
            rec._key_ = self._genKey(rec);
            self._store.push(rec);
            self.trigger('onInsert', rec);
            self.trigger('onChange');
            defer.resolve(rec);
          }).fail(defer.reject);
        }).promise();
        return d;
      },

      remove: function(input) {
        var _super = util.proxy(this._super, this);
        var self = this;
        var rec = this._get(input);
        if (!rec) {
          throw new E('The record does not find');
        }

        var d = $.Deferred(function(defer) {
          var url = self._createUrl('remove', rec[self.primary]);
          var method = self.endpoints.remove.method;
          $.ajax({
            url: url,
            type: method,
            dataType: self.dataType
          }).done(function(data) {
            data = self._processData(data, defer)
            if (data === false) {
              return;
            }
            _super(input);
            defer.resolve(rec);
          }).fail(defer.reject);
        }).promise();
        return d;
      },

      update: function(input, obj, postfix) {
        var rec = this._get(input);
        if (!rec) {
          throw new E('The record does not find');
        }

        var oldRec = rec.clone(true);
        var newRec = rec.clone();
        util.extend(newRec, obj);
        var errs = newRec.validate();
        if (errs.length > 0) {
          throw new E(errs);
        }

        var self = this;
        var d = $.Deferred(function(defer) {
          var url = self._createUrl('update', rec[self.primary], postfix);
          var method = self.endpoints.update.method;
          $.ajax({
            url: url,
            type: method,
            dataType: self.dataType,
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(obj)
          }).done(function(data) {
            data = self._processData(data, defer)
            if (data === false) {
              return;
            }
            util.extend(rec, obj);
            self.trigger('onUpdate', oldRec, rec);
            self.trigger('onChange');
            defer.resolve(rec);
          }).fail(defer.reject);
        }).promise();
        return d;
      },
    }
  });

  return AjaxModel;
});
