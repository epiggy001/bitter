/*
 * Define the controller class there. User can bind events
 * and render a view here
 * For example
 * var controller = require('./controller')
 * var jobController = new controller({
 *   model: myModel // Set related model,
 *   tmpl: 'joblist.ejs' //Set related the view template,
 *   renderTo: 'jobList' // Id of the DOM element to render the view,
 *   events: {
 *    'event1': func1,
 *    'event2': func2
 *   } // Define events and their handlers for related view. The events are
 *     // binded on the controller. User can trigger the event
 *     // by controller.trigger('event1');
 *   handlers: {
 *    '.item click': function(event) {
 *      ...
 *    },
 *    '#add click': function(event) {
 *      ...
 *    }
 *   } // Add handlers to DOM element of the related view. For example,
 *     // '.item click' means elem.delegate('.item', 'click', function(event) {
 *     //   ....
 *     // });
 * })
 */
define(['../../basic/oo', '../../basic/util', '../view/ejs', 'jquery'],
  function(oo, util, ejs, $) {
  'use strict';

  var Controller = oo.create({
    init: function(opt) {
      var opt = opt || {};
      util.extend(this, opt.property);
      var self = this;

      var _simpleData = true;
      if (util.isFunc(opt.data)) {
        var f = opt.data;
        Object.defineProperty(this, "data", {
          configurable: true,
          enumerable: true,
          get: function() {
            return f(self);
          }
        });
        _simpleData = false;
      } else {
        this.data = opt.data || {};
      }

      this.simpleData = function() {
        return _simpleData;
      }

      this._url = opt.url;
      this._renderTo = opt.renderTo;
      this._handlers = opt.handlers || {};
      this.children = opt.children || []
      this.children.forEach(function(v) {
	      v._parent_ = self;
      });

      if (util.isObject(opt.events)) {
        util.each(opt.events, function(k, v) {
          if (util.isString(k) && util.isFunc(v)) {
            self.bind(k, v);
          }
        });
      }
    },

    proto: {
      _render: function(input) {
        var self = this;
        var html = ejs.renderFile(this._url, {locals: input});
        var elem = $(html);
        this.trigger('beforeRender');
        $('#' + this._renderTo).empty().append(elem);

        util.each(this._handlers, function(k, f) {
          if (util.isString(k) && util.isFunc(f)) {
            var temp = k.split(" ");
            var ev = temp.pop().trim();
            var selector = temp.join(" ").trim();
            elem.delegate(selector, ev, function(event) {
              f.call(self, event, $(event.currentTarget));
            });
          }
        });
	elem = undefined;
        this.trigger('afterRender');
      },

      addChild: function(view) {
        this.children.push(view);
        view._parent_ = this;
      },

      removeChild: function(view) {
        util.arrayRemove(this.children, view);
        delete view._parent_
      },

      broadcast: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        util.each(this.children, function(i, v) {
          v.trigger.apply(v, args)
        });
      },

      notify: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (this._parent_) {
          this._parent_.trigger.apply(this._parent_, args)
        }
      },

      render: function(data) {
        if (this.simpleData()) {
          this.data = data || this.data;
        }

        if ($('#' + this._renderTo).length === 0) {
          this.notify('childNoRenderTarget');
          return;
        }
        this._render(this.data);
        util.each(this.children, function(i, v) {
          v.render();
        });
      },

      destroy: function() {
        $('#' + this._renderTo).empty();
	      var self = this;
        util.each(this, function(k, v) {
          try {
            self[k] = undefined;
          } catch(e) {
          }
        });
      }
    }
  });
  return Controller;
});
