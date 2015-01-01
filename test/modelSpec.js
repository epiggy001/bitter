define(['src/basic/util', 'src/MVC/model/model'], function(util, Model) {
  describe('model', function() {
    var fields = [{name: 'v1', def: 'v1'}, {name: 'v2', def: 10}];
    var validators = {
      'val1': {
        func: function() {
          return this.v1;
        },

        msg: 'msg1'
      },

      'val2': {
        func: function() {
          return this.v2 > 5;
        },

        msg: 'msg2'
      }
    };

    var f1, f2, f3;
    beforeEach(function() {
      f1 = jasmine.createSpy('f1');
      f2 = jasmine.createSpy('f2');
      f3 = jasmine.createSpy('f3');
    });

    it('Simple model', function() {
      var m = new Model();
      expect(m.primary).toBe('id');
      expect(m.count()).toBe(0);
    });

    it('Insert and Get', function() {
      var m = new Model({
        fields: fields,
        validators: validators,
        primary: 'uuid'
      });

      m.bind('onInsert', f1);
      m.bind('onChange', f2);
      m.bind('onInsertError', f3);
      expect(m.primary).toBe('uuid');
      var uuid = util.uuid();
      var rec = m.insert({uuid: uuid});
      expect(m.count()).toBe(1);
      var r = m.get(uuid);
      expect(rec).toBe(r);
      expect(r instanceof m.Record).toBe(true);
      expect(r.v1).toBe('v1');
      expect(r.v2).toBe(10);
      expect(f1).toHaveBeenCalledWith(r);
      expect(f2).toHaveBeenCalled();
      rec = m.insert({uuid: util.uuid(), v2: 2});
      expect(rec).toBeUndefined();
      expect(f3).toHaveBeenCalledWith([{name: 'val2', msg: 'msg2'}]);
    });

    it('Remove', function() {
      var m = new Model();
      m.bind('onRemove', f1);
      m.bind('onChange', f2);
      m.insert({id: 0});
      m.insert({id: 1});
      var r = m.get(0);
      m.remove(0);
      expect(m.count()).toBe(1);
      expect(f1).toHaveBeenCalledWith(r);
      expect(f2).toHaveBeenCalled();
    });

    it('Update', function() {
      var m = new Model({
        fields: fields,
        validators: validators
      });
      m.bind('onUpdate', f1);
      m.bind('onChange', f2);
      m.bind('onUpdateError', f3);
      var r = m.insert({id: 0});
      var old = r.clone();
      m.update(0, {v2: 11});
      expect(r.v2).toBe(11);
      expect(r.v1).toBe('v1');
      expect(f1).toHaveBeenCalledWith(old, r);
      expect(f2).toHaveBeenCalled();
      m.update(0, {v2: 2});
      expect(f3).toHaveBeenCalledWith([{name: 'val2', msg: 'msg2'}]);
      expect(r.v2).toBe(11);
    });

    it('Count', function() {
      var m = new Model();
      m.insert({id: 1});
      m.insert({id: 0});
      expect(m.count()).toBe(2);
      m.remove(1);
      expect(m.count()).toBe(1);
      m.insert({id: 3})
      expect(m.count()).toBe(2);
    });

    describe('Records', function() {
      var m, sorted, sroter;
      beforeEach(function() {
        m = new Model();
        m.insert({id: 0, v1: 1, v2: true});
        m.insert({id: 1, v1: 1, v2: false});
        m.insert({id: 2, v1: 2, v2: false});
        m.insert({id: 3, v1: 2, v2: true});
        m.insert({id: 4, v1: 3, v2: false});

        sorter = function(a, b) {return b.id - a.id;};
        sorted = function(array) {
          var before = Infinity;
          var flag = true;
          util.each(array, function(i, v) {
            if (v.id > before) {
              flag = false;
              return false;
            }
            before = v.id;
          });
          return flag;
        }
      });

      it('Simple', function() {
        var data = m.records();
        expect(data).not.toBe(this._store);
        expect(data.length).toBe(5);
      });

      it('Sorter', function() {
        var data = m.records();
        expect(sorted(data)).toBe(false);
        data = m.records(sorter);
        expect(sorted(data)).toBe(true);
      });

      it('Filters', function() {
        var filter1 = function(r) {
          return r.v1 <= 2;
        };

        var filter2 = function(r) {
          return r.v2;
        }
        var data = m.records(null, filter1);
        expect(data.length).toBe(4);

        data = m.records(null, filter1, filter2);
        expect(data.length).toBe(2);

        data = m.records(null, [filter1, filter2]);
        expect(data.length).toBe(2);

        data = m.records(null, [filter1], filter2);
        expect(data.length).toBe(2);

        data = m.records(null, [filter1], [filter2]);
        expect(data.length).toBe(2);
        expect(sorted(data)).toBe(false);

        data = m.records(sorter, [filter1], [filter2]);
        expect(data.length).toBe(2);
        expect(sorted(data)).toBe(true);
      });
    });

    describe('Load and Clear', function() {
      var m = new Model();
      it('Load', function() {
        m.bind('onLoad', f1);
        m.load([{
          id: 1,
          v1: 'a'
        }, {
          id: 0,
          v1: 'b'

        }, {
          id: 2,
          v1: 'c'
        }]);
        expect(m.count()).toBe(3);
        var r = m.get(1);
        expect(r.v1).toBe('a');
        r = m.get(0);
        expect(r.v1).toBe('b');
        r = m.get(2);
        expect(r.v1).toBe('c');
        expect(f1).toHaveBeenCalled();
      });

      it('Clear', function() {
        m.bind('onClear', f1);
        m.bind('onChange', f2);
        m.clear();
        expect(m.count()).toBe(0);
        m.insert({id: 10});
        expect(m.count()).toBe(1);
        expect(f1).toHaveBeenCalled();
        expect(f2).toHaveBeenCalled();
      });
    });
  });
});
