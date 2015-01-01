define(['../../basic/oo',
  '../../basic/util',
  './controller',
  '../view/ejs',
  'jquery'],
  function(oo, util, Controller, ejs, $) {
  var ListController = oo.extend(Controller, {
    init: function(opt) {
      var opt = opt || {};
      this.pageSize = opt.pageSize || -1;
      this.pageNum = 1;
      this.sorters = opt.sorters || {};
      this.filters = opt.filters || {};
      this.customizedFilters = opt.customizedFilters || [];
      this._property = opt.property ? util.clone(opt.property) : {};
      var self = this;
      if (opt.model && opt.data === undefined) {
        this.model = opt.model;
        Object.defineProperty(this, "data", {
          configurable: true,
          enumerable: true,
          get: function() {
            var sorter = self._createSorter();
            var searchFilter = self._createSearchFilter();
            var customizedFilters = self._createCustomizedFilters();
            var data = self.model.records(sorter, searchFilter, customizedFilters);
            return self._paging(data);
          }
        });
        this.simpleData = function() {
          return false;
        }
      }
      this._searchKey = '';
      this._sortBy = this.model.primary;
      this._sortOrder = 'DESC';

      // Bind events
      this.bind('searchBy', function(key) {
        this.searchBy(key);
      });

      this.bind('sortBy', function(key, order) {
        this.sortBy(key, order);
      });

      this.bind('pageTo', function(page) {
        this.pageTo(page)
      });

      this.bind('reset', function() {
        this.reset()
      });

      this.bind('delegate', function() {
        if (arguments.length === 0) {
          return;
        }

        var fname = arguments[0];
        var fn = this[fname];
        if (!util.isFunc(fn)) {
          return;
        }
        var args = Array.prototype.slice.call(arguments, 1);
        fn.apply(this, args);
      })
    },

    proto: {
      tagData: function(tagName) {
        this.data.forEach(function(v) {
          v.tag(tagName)
        });
      },

      untagData: function(tagName) {
        this.data.forEach(function(v) {
          v.untag(tagName)
        });
      },

      tagModel: function(tagName) {
        this.model.records().forEach(function(v) {
          v.tag(tagName)
        });
      },

      untagModel: function(tagName) {
        this.model.records().forEach(function(v) {
          v.untag(tagName)
        });
      },

      reset: function() {
        util.extend(this, this._property);
        this._searchKey = '';
        this._sortBy = this.model.primary;
        this._sortOrder = 'DESC';
        this.pageNum = 1;
      },

      searchBy: function(key) {
        this._searchKey = key;
        this.pageTo(1);
      },

      sortBy: function(key, order) {
        this._sortBy = key;
        this._sortOrder = order;
        this.pageTo(1);
      },

      pageTo: function(page) {
        this.pageNum = page;
        this.render();
      },

      _createCustomizedFilters: function() {
        var self = this;
        var filters = this.customizedFilters.map(function(f) {
          return util.proxy(f, self);
        });

        return filters;
      },

      _paging: function(data) {
        if (this.pageSize !== -1) {
          this.totalPages = Math.ceil(data.length / this.pageSize);
          this.pageNum = Math.min(this.totalPages, this.pageNum);
          this.pageNum = Math.max(1, this.pageNum);
          var start = (this.pageNum - 1) * this.pageSize;
          var end = start + this.pageSize;
          data = data.slice(start, end);
        } else {
          this.totalPages = 1;
          this.pageNum = 1;
        }
        return data;
      },

      _createSorter: function() {
        var key = this._sortBy;
        var order = this._sortOrder.toLowerCase();
        var sorter = this.sorters[key];
        return function(a, b) {
          if (sorter === undefined || !util.isFunc(sorter)) {
            sorter = function(_a, _b, k) {
              if (_a[k] == _b[k]) {
                return 0;
              }
              return _a[k] >  _b[k] ? 1 : -1;
            }
          }
          if (order === 'asc') {
            return sorter(a, b, key);
          } else {
            return sorter(b, a, key);
          }
        }
      },

      _createSearchFilter: function() {
        var key = this._searchKey;
        var self = this;
        return function(rec, index) {
          if (!key) {
            return true
          }
          var flag = true;
          util.each(self.filters, function(k, v) {
            if (!util.isString(k)) {
              return;
            }
            var value = rec[k];
            if (value === 'undefined') {
              flag = false;
            }

            if (v === 'd') {
              value = value.toString().toLowerCase();
              flag = value.indexOf(key.toString().toLowerCase()) !== -1
            } else if (util.isFunc(v)) {
              flag = v(value, key, index);
            }

            if (flag === true) {
              return false;
            }
          });
          return flag;
        }
      },

      _render: function(input) {
        var self = this;
        this.trigger('beforeRender');
        $('#' + this._renderTo).empty();
        var html, elem;
        util.each(input, function(i, v) {
          html = ejs.renderFile(self._url, {locals:v});
          elem = $(html);
          $('#' + self._renderTo).append(elem);
          util.each(self._handlers, function(k, f) {
            if (util.isString(k) && util.isFunc(f)) {
              var temp = k.split(" ");
              var ev = temp.pop().trim();
              var selector = temp.join(" ").trim();
              elem.delegate(selector, ev, function(event) {
                f.call(self, event, v, $(event.currentTarget));
              });
            }
          });
        });
	      elem = undefined;
        this.trigger('afterRender');
        this.broadcast('listRender', this, this.pageNum, this.totalPages);
        this.notify('listRender', this, this.pageNum, this.totalPages);
      }
    }
  });
  return ListController;
});
