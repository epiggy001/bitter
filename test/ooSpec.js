define(['src/basic/oo', 'src/basic/util'], function(oo, util) {
  describe('create', function() {
    it('Test empty init', function() {
      var klass = oo.create();
      var o = new klass();
      util.each(oo.defaultProto, function(key, v) {
        expect(o[key]).toBe(v);
      });

      var empty = true;
      util.each(o, function() {
        empty = false;
      });
      expect(empty).toBe(true);

      empty = true;
      util.each(o, function(k) {
        if (k !== 'prototype') {
          empty = false;
        }
      });
      expect(empty).toBe(true);
    });

    it('Test init', function() {
      var f = function(opt) {
        this.prop1 = opt;
        this.prop2 = 'prop2';
      };
      var klass =oo.create({
        init: f
      });
      var o = new klass('prop1');
      expect(o.prop1).toBe('prop1');
      expect(o.prop2).toBe('prop2');
    });

    it('Test stat variable', function() {
      var sp2 = function() {};
      var stat = {
        sp1: 'sp1',
        sp2: sp2,
        sp3: {}
      };
      var klass = oo.create({
        stat: stat
      });

      util.each(stat, function(key, v) {
        expect(klass[key]).toEqual(v);
      });

      stat.sp3.p1 = 'p1';

      expect(klass.sp3).toEqual({});
    });

    it('Test prototype', function() {
      var p2 = function() {};
      var proto = {
        p1: 'p1',
        p2: p2
      };

      var klass = oo.create({proto: proto});
      util.each(proto, function(key, v) {
        expect(klass.prototype[key]).toEqual(v);
      });

      var o = new klass();
      util.each(proto, function(key, v) {
        expect(o[key]).toEqual(v);
      });
    });
  });

  describe('default function', function() {
    var klass = oo.create();

    var funcs = {
      f1: function(v) {},

      f2: function(v) {},

      f3: function(v) {}
    };

    var o;

    var reset = function() {
      funcs.f1.calls.reset();
      funcs.f2.calls.reset();
      funcs.f3.calls.reset();
    };

    beforeEach(function() {
      o = new klass();
      spyOn(funcs, 'f1');
      spyOn(funcs, 'f2');
      spyOn(funcs, 'f3');
    });

    it('Bind, trigger, unbind', function() {
      o.bind('e1', funcs.f1);
      o.bind('e2', funcs.f2);
      o.bind('e2', funcs.f3);
      o.trigger('e1');
      o.trigger('e2');
      expect(funcs.f1).toHaveBeenCalled();
      expect(funcs.f2).toHaveBeenCalled();
      expect(funcs.f3).toHaveBeenCalled();
      expect(funcs.f1.calls.count()).toEqual(1);
      expect(funcs.f2.calls.count()).toEqual(1);
      expect(funcs.f3.calls.count()).toEqual(1);

      reset();
      o.trigger('e1');
      expect(funcs.f1.calls.count()).toEqual(1);
      expect(funcs.f2.calls.count()).toEqual(0);
      expect(funcs.f3.calls.count()).toEqual(0);

      reset();
      o.unbind('e2', funcs.f2);
      o.trigger('e1');
      o.trigger('e2');
      expect(funcs.f1.calls.count()).toEqual(1);
      expect(funcs.f2.calls.count()).toEqual(0);
      expect(funcs.f3.calls.count()).toEqual(1);

      reset();
      o.unbind('e1');
      o.trigger('e1');
      expect(funcs.f1.calls.count()).toEqual(0);

      reset();
      o.bind('e1', funcs.f1);
      o.bind('e1', funcs.f2);
      o.trigger('e1');
      expect(funcs.f1.calls.count()).toEqual(1);
      expect(funcs.f2.calls.count()).toEqual(1);
    });

    it('Add default function', function() {
      var f = function() {};
      oo.defaultProto.f = f;
      expect(o.f).toEqual(f);
    });
  });

  describe('extend', function() {
    var klass = oo.create({
      init: function(opt1) {
        this.op1 = opt1;
      },

      stat: {
        s1: 's1',
        s2: {},
      },

      proto: {
        p1: 'p1',
        p2: function(v) {
          v = v + 1;
          return v;
        }
      }
    })


    it('Simple extend', function() {
      var klass2 = oo.extend(klass);
      var o = new klass2('op1');
      expect(klass2.s1).toBeUndefined();
      expect(klass2.s2).toBeUndefined();
      expect(o instanceof klass).toBe(true);
      expect(o.op1).toBe('op1');
      expect(o.p1).toBe('p1');
      spyOn(klass.prototype, 'p2').and.callThrough();
      expect(o.p2(1)).toBe(2);
      expect(klass.prototype.p2).toHaveBeenCalledWith(1);

      util.each(oo.defaultProto, function(key, v) {
        expect(o[key]).toBe(v);
      });
    });

    it('Override', function() {
      var klass2 = oo.extend(klass, {
        init: function(opt1, opt2) {
          this.op2 = opt2
        },

        stat: {
          es1: 'es1'
        },

        proto: {
          p3: 'p3',
        }
      });

      expect(klass2.es1).toBe('es1');
      var o = new klass2('op1', 'op2');
      spyOn(o, 'p2').and.callThrough();;
      expect(o instanceof klass).toBe(true);
      expect(o.op1).toBe('op1');
      expect(o.op2).toBe('op2');
      expect(o.p1).toBe('p1');
      expect(o.p3).toBe('p3');
      expect(o.p2(1)).toBe(2);
      expect(o.p2).toHaveBeenCalledWith(1);
    });

    it('Super key world', function() {
      var klass2 = oo.extend(klass, {
        proto: {
          p3: function(v) {
            v = v - 1;
            return v;
          },

          p4: function() {

          }
        }
      });

      var klass3 = oo.extend(klass2, {
        init: function() {
          this.num = 0
        },

        proto: {
          p2: function(v) {
            this.num = this._super(v);
          },

          p3: function(v, num) {
            this.num = this._super(v) + num;
          }
        }
      });

      var o = new klass3();
      o.p2(1)
      expect(o.num).toBe(2);
      spyOn(klass2.prototype, 'p3').and.callThrough();
      o.p3(10, 10);
      expect(o.num).toBe(19);
      expect(klass2.prototype.p3).toHaveBeenCalledWith(10);
      spyOn(klass2.prototype, 'p4');
      o.p4();
      expect(klass2.prototype.p4).toHaveBeenCalled();
    });
  });

  describe('decorator', function() {
    var dfuncs = {
      f1: function(name, instance, args) {
        instance.run();
        this.num = this.num + 1;
      },

      f2: function(name, instance, args) {
        instance.run();
        this.num = this.num - 1;
      },

      f3: function() {}
    };

    var funcs = {
      f1: function(v) {
        this.num = this.num + v;
      },

      f2: function(v) {
        this.num = this.num - v;
      }
    };
    var klass = oo.create({
      init: function(num) {
        this.num = num;
      },

      stat: {
        s1: 's1'
      },

      proto: funcs
    });

    it('Simple decorator', function() {
      var d = new oo.Decorator();
      var klass2 = d.apply(klass);
      expect(klass2.s1).toEqual('s1');
      expect(klass2.prototype.f1).toEqual(klass.prototype.f1);
      expect(klass2.prototype.f2).toEqual(klass.prototype.f2);
    });

    it('Instance run', function() {
      var d = new oo.Decorator(dfuncs);
      var klass2 = d.apply(klass);
      expect(klass2.prototype.f1).not.toEqual(klass.prototype.f1);
      expect(klass2.prototype.f2).not.toEqual(klass.prototype.f2);
      expect(klass2.prototype.f3).toEqual(dfuncs.f3);

      var o = new klass2(10);
      expect(o.num).toEqual(10);
      o.f1(1);
      expect(o.num).toEqual(12);
      o.f2(2);
      expect(o.num).toEqual(9);
    });
  });
});
