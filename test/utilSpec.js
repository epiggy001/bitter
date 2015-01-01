define(['src/basic/util'], function(util) {

  var _f = function() {}
  var _func = function() {
    this.key1 = 'string',
    this.key2 = 'number',
    this.key3 = new RegExp('\\s'),
    this.key4 = [1, 2, 3],
    this.key5 = {
      subkey1: 1,
      subkey2: 'string',
      subkey3: _f
    }
  };
  var p = {
    pkey1: 'p1',
  }

  _func.prototype = p;
  _func.prototype.constructor = _func;

  var createObject = function(o) {
    if (o) {
      return _func.call(o);
    } else {
      return new _func();
    }
  };

  var createArray = function() {
    return [
      'string',
      'number',
      new RegExp('\\s'),
      [1, 2, 3],
      {subkey1: 1, subkey2: 'string'}
    ];
  };

  describe('Test Util', function() {
    it('isObject', function() {
      expect(util.isObject({})).toBe(true);
      expect(util.isObject([])).toBe(false);
      expect(util.isObject(1)).toBe(false);
      expect(util.isObject('string')).toBe(false);
      expect(util.isObject(true)).toBe(false);
    });

    it('isArray', function() {
      expect(util.isArray({})).toBe(false);
      expect(util.isArray(1)).toBe(false);
      expect(util.isArray('string')).toBe(false);
      expect(util.isArray(true)).toBe(false);
      expect(util.isArray([])).toBe(true);
    });

    it('isString', function() {
      expect(util.isString({})).toBe(false);
      expect(util.isString([])).toBe(false);
      expect(util.isString(1)).toBe(false);
      expect(util.isString('string')).toBe(true);
      expect(util.isString(true)).toBe(false);

    });

    it('isFunc', function() {
      expect(util.isFunc({})).toBe(false);
      expect(util.isFunc(1)).toBe(false);
      expect(util.isFunc([])).toBe(false);
      expect(util.isFunc(Boolean)).toBe(true);
      expect(util.isFunc(function() {})).toBe(true);
      var f = function() {};
      expect(util.isFunc(f)).toBe(true);
      var o = {};
      o.f = function() {};
      expect(util.isFunc(o.f)).toBe(true);
    });

    describe('each', function() {
      beforeEach(function() {
        this.f = function(k, v) {

        }
        spyOn(this, 'f');
      });

      it('Simple Value', function() {
        util.each(1, this.f);
        expect(this.f.calls.any()).not.toBe(true);
      });

      it('Array', function() {
        var a = ['a', 'b', 'c', 'd'];
        util.each(a, this.f);
        expect(this.f.calls.count()).toEqual(a.length);
        for (var i = 0; i < this.f.calls.count(); i ++) {
          expect(this.f.calls.argsFor(i)).toEqual([i, a[i]]);
        }
      });

      it('Object', function() {
        var a = createObject();
        util.each(a, this.f);
        expect(this.f.calls.count()).toEqual(5);
        for (var i = 0; i < this.f.calls.count(); i ++) {
          var args = this.f.calls.argsFor(i);
          expect(a[args[0]] === args[1]).toBe(true);
        }
      });
    });

    describe('clone', function() {
      describe('Not Deep', function() {
        it('Simple Value', function() {
          expect(util.clone(1)).toEqual(1);
          expect(util.clone('string')).toEqual('string');
          expect(util.clone(true)).toBe(true);
        });

        it('Special Value', function() {
          expect(util.clone(undefined)).toBeUndefined();
          expect(util.clone(null)).toBeNull();
          expect(util.clone(NaN)).toBeNaN();
          expect(util.clone(Infinity)).toEqual(Infinity);
          expect(util.clone(-Infinity)).toEqual(-Infinity)
        });

        it('Object', function() {
          var o = {
            key1: 1,
            key2: {}
          };

          var c = util.clone(o);
          expect(o).toEqual(c);
          expect(o).not.toBe(c);
          expect(o.key2).toBe(c.key2);
        });

        it('Array', function() {
          var o = [1, {}];

          var c = util.clone(o);
          expect(o).toEqual(c);
          expect(o).not.toBe(c);
          expect(o[1]).toBe(c[1]);
        });
      });

      describe('Deep clone', function() {
        it('Simple Value', function() {
          expect(util.clone(1, true)).toEqual(1);
          expect(util.clone('string', true)).toEqual('string');
          expect(util.clone(true, true)).toBe(true);
        });

        it('Special Value', function() {
          expect(util.clone(undefined, true)).toBeUndefined();
          expect(util.clone(null, true)).toBeNull();
          expect(util.clone(NaN, true)).toBeNaN();
          expect(util.clone(Infinity, true)).toEqual(Infinity);
          expect(util.clone(-Infinity, true)).toEqual(-Infinity)
        });

        it('Predefined Object', function() {
          var test = function(func, arg1, arg2) {
            var o;
            if (!arg2) {
              o = new func(arg1);
            } else {
              o = new func(arg1, arg2);
            }
            var c = util.clone(o, true);
            expect(o).toEqual(c);
            if (func !== RegExp) {
              expect(o).not.toBe(c);
            }
          }
          test(Number, 5);
          test(String, 'string');
          test(Date, 1000);
          test(RegExp, '\\s', 'i');
          test(Boolean, 1);
          test(Boolean, 0);
        });

        it('Self-defined Object', function() {
          var o = createObject();
          var c = util.clone(o, true);
          expect(o).not.toBe(c);
          o = {};
          createObject(o)
          expect(c).toEqual(o);

          o.key6 = {
            subkey1: o
          };

          c = util.clone(o, true);
          expect(o).toEqual(c);
          expect(o).not.toBe(c);
          expect(c.key6.subkey1).toBe(c);
        });

        it('Array', function() {
          var o = createArray();
          var c = util.clone(o, true);
          expect(o).toEqual(c);
          expect(o).not.toBe(c);

          var o = createArray();
          o[3].push(o)
          var c = util.clone(o, true);
          expect(o).toEqual(c);
          expect(o).not.toBe(c);
          expect(o[3].pop()).not.toBe(c);
        });
      });
    });

    describe('equal', function() {
      describe('Specail Value', function() {
        it('Null', function() {
          expect(util.equal(1, null)).toBe(false);
          expect(util.equal(true, null)).toBe(false);
          expect(util.equal(false, null)).toBe(false);
          expect(util.equal('string', null)).toBe(false);
          expect(util.equal(undefined, null)).toBe(false);
          expect(util.equal(NaN, null)).toBe(false);
          expect(util.equal([], null)).toBe(false);
          expect(util.equal({}, null)).toBe(false);
          expect(util.equal(null, null)).toBe(true);
          expect(util.equal(NaN, null)).toBe(false);
        });

        it('Undefined', function() {
          expect(util.equal(1, undefined)).toBe(false);
          expect(util.equal(true, undefined)).toBe(false);
          expect(util.equal(false, undefined)).toBe(false);
          expect(util.equal('string', undefined)).toBe(false);
          expect(util.equal(undefined, undefined)).toBe(true);
          expect(util.equal(NaN, undefined)).toBe(false);
          expect(util.equal([], undefined)).toBe(false);
          expect(util.equal({}, undefined)).toBe(false);
          expect(util.equal(null, undefined)).toBe(false);
          expect(util.equal(NaN, undefined)).toBe(false);
        });
      });

      describe('Number', function() {
        it('Simple Number', function() {
          expect(util.equal(1, 2)).toBe(false);
          expect(util.equal(1, 1)).toBe(true);
          expect(util.equal(1, new Number(1))).toBe(true);
          expect(util.equal(1, new Number(2))).toBe(false);
          expect(util.equal(new Number(1), new Number(1))).toBe(true);
          expect(util.equal(new Number(1), new Number(2))).toBe(false);
          expect(util.equal(new Number(0), new Number(0))).toBe(true);
          expect(util.equal(new Number(0), Number(-0))).toBe(false);
          expect(util.equal(1, NaN)).toBe(false);
          expect(util.equal(1, Infinity)).toBe(false);
        });

        it('Specail Number', function() {
          expect(util.equal(NaN, NaN)).toBe(true);
          expect(util.equal(0, -0)).toBe(false);
          expect(util.equal(0, 0)).toBe(true);
          expect(util.equal(Infinity, Infinity)).toBe(true);
          expect(util.equal(-Infinity, -Infinity)).toBe(true);
          expect(util.equal(Infinity, -Infinity)).toBe(false);
        });
      });

      it('String', function() {
        expect(util.equal('string', 'string')).toBe(true);
        expect(util.equal('string', 'string2')).toBe(false);
        expect(util.equal('string', new String('string2'))).toBe(false);
        expect(util.equal('string', new String('string'))).toBe(true);
        expect(util.equal(new String('string'), new String('string2'))).toBe(false);
        expect(util.equal(new String('string'), new String('string'))).toBe(true);
      });

      describe('Boolean', function() {
        it('True', function() {
          expect(util.equal(true, true)).toBe(true);
          expect(util.equal(true, new Boolean(1))).toBe(true);
          expect(util.equal(true, new Boolean(0))).toBe(false);
          expect(util.equal(new Boolean(1), new Boolean(1))).toBe(true);
          expect(util.equal(new Boolean(1), new Boolean(0))).toBe(false);
          expect(util.equal(true, 1)).toBe(false);
          expect(util.equal(true, "string")).toBe(false);
          expect(util.equal(true, false)).toBe(false);
          expect(util.equal(true, {})).toBe(false);
          expect(util.equal(true, [])).toBe(false);
        });

        it('False', function() {
          expect(util.equal(false, false)).toBe(true);
          expect(util.equal(false, new Boolean(0))).toBe(true);
          expect(util.equal(false, new Boolean(1))).toBe(false);
          expect(util.equal(new Boolean(0), new Boolean(0))).toBe(true);
          expect(util.equal(false, 0)).toBe(false);
          expect(util.equal(false, "string")).toBe(false);
          expect(util.equal(false, true)).toBe(false);
          expect(util.equal(false, {})).toBe(false);
          expect(util.equal(false, [])).toBe(false);
        });
      });

      it('Date', function() {
        expect(util.equal(new Date(1000), new Date(1000))).toBe(true);
        expect(util.equal(new Date(1000), new Date(1001))).toBe(false);
      });

      it('Regex', function() {
        expect(util.equal(/ab+c/g, /ab+c/g)).toBe(true);
        expect(util.equal(/ab+c/g, /abc/g)).toBe(false);
        expect(util.equal(/ab+c/g, /ab+c/ig)).toBe(false);
        expect(util.equal(/ab+c/g, /ab+c/mg)).toBe(false);
      });

      it('Object', function() {
        var o = createObject();
        var c = createObject();
        expect(util.equal(o, o)).toBe(true);
        expect(util.equal(o, c)).toBe(true);

        delete c.key5.subkey1;
        expect(util.equal(o, c)).toBe(false);

        c.key5.subkey1 = "value";
        expect(util.equal(o, c)).toBe(false);

        o = createObject();
        c = createObject();
        delete o.key1;
        expect(util.equal(o, c)).toBe(false);

        o = createObject();
        c = createObject();
        o.key5.subkey3 = o;
        c.key5.subkey3 = c;
        expect(util.equal(o, c)).toBe(true);
        c.key5.subkey3 = o;
        expect(util.equal(o, c)).toBe(true);
      });

      it('Array', function() {
        var o = createArray();
        var c = createArray();
        expect(util.equal(o, o)).toBe(true);
        expect(util.equal(o, c)).toBe(true);

        delete c[4].subkey1;
        expect(util.equal(o, c)).toBe(false);

        o = createArray();
        c = createArray();
        o.pop();
        expect(util.equal(o, c)).toBe(false);

        o = createArray();
        c = createArray();
        o[4].subkey3 = o;
        c[4].subkey3 = c;
        expect(util.equal(o, c)).toBe(true);
        c[4].subkey3 = o;
        expect(util.equal(o, c)).toBe(true);
      });
    });

    it('randomStr', function() {
      var s = util.randomStr(0);
      expect(s).toEqual('');
      s = util.randomStr(10);
      expect(s.length).toEqual(10);
      var s2 = util.randomStr(10);
      expect(s).not.toEqual(s2);

      s = util.randomStr(10, '123456789');
      expect(new Number(s)).not.toEqual(NaN);
    });

    it('uuid', function() {
      var a = [];
      for (var i = 0; i < 1000; i++) {
        a.push(util.uuid());
      }
      a.sort();
      var flag = false;
      for (i = 1; i < 1000; i ++) {
        if (a[i] === a[i-1]) {
          flag = true;
          break;
        }
      }
      expect(flag).not.toBe(true);
    });

    it('arrayRemove', function() {
      var a = [1, 2, 3, 4];
      util.arrayRemove(a, 5);
      expect(a).toEqual([1, 2, 3, 4]);
      util.arrayRemove(a, 1);
      expect(a).toEqual([2, 3, 4]);
    });
  });

});
