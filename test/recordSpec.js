define(['src/MVC/model/record'], function(record) {
  describe('record', function() {
    var array = [1, 2 ,3];
    var object = {
      key: 'key'
    };

    it('Simple record', function() {
      var R = record.create();
      var r = new R({
        v1: 1,
        v2: 'string',
        v3: true,
        v4: array,
        v5: object,
      });
      expect(r.v1).toBe(1);
      expect(r.v2).toBe('string');
      expect(r.v3).toBe(true);
      expect(r.v4).toBe(array);
      expect(r.v5).toBe(object);
    });

    it('Default value', function() {
      var R = record.create({
        fields: [{
          name: 'v1',
          def: 1
        }, {
          name: 'v2',
          def: array
        }]
      });

      var r = new R({
        v3: 'string'
      });

      expect(r.v1).toBe(1);
      expect(r.v2).not.toBe(array);
      expect(r.v2).toEqual(array);
      expect(r.v3).toBe('string');
    });

    it('Validator', function() {
      var R = record.create({
        validators: {
          'val1': {
            func: function() {
              return this.v1;
            },

            msg: 'msg1'
          },

          'val2': {
            func: function() {
              return this.v2 > 10;
            },

            msg: 'msg2'
          }
        }
      });

      var r = new R({
        v1: false,
        v2: 9,
      });

      var errors = r.validate();
      expect(errors).toEqual([{name: 'val1', msg: 'msg1'},
        {name: 'val2', msg: 'msg2'}]);

      r = new R({
        v1: false,
        v2: 11,
      });

      errors = r.validate();
      expect(errors).toEqual([{name: 'val1', msg: 'msg1'}]);

      r = new R({
        v1: true,
        v2: 11,
      });

      errors = r.validate();
      expect(errors).toEqual([]);
    });

    it('Data', function() {
      var R = record.create();
      var r = new R({
        _v1: 1,
        v2: 'string',
        v3: true,
        v4: array,
        v5: object,
      });
      expect(r._v1).toBe(1);
      expect(r.v2).toBe('string');
      expect(r.v3).toBe(true);
      expect(r.v4).toBe(array);
      expect(r.v5).toBe(object);

      var data = r.data();
      expect(data._v1).toBeUndefined();
      expect(data._tags_).toBeUndefined();
      expect(data.v2).toBe('string');
      expect(data.v3).toBe(true);
      expect(data.v4).not.toBe(array);
      expect(data.v5).not.toBe(object);
      expect(data.v4).toEqual(array);
      expect(data.v5).toEqual(object);
    });

    it('tags', function() {
      var R = record.create();
      var r = new R();
      expect(r._tags_).toEqual([]);
      r.tag({});
      expect(r._tags_).toEqual([]);
      r.tag('tag1');
      r.tag('tag1');
      expect(r._tags_).toEqual(['tag1']);
      r.tag('tag2');
      expect(r._tags_).toEqual(['tag1', 'tag2']);
      r.untag('tag1');
      expect(r._tags_).toEqual(['tag2']);
      expect(r.hasTag('tag2')).toBe(true);
      expect(r.hasTag('tag1')).toBe(false);
    });

    it('clone', function() {
      var R = record.create();
      var r = new R({
        _v1: 1,
        v2: 'string',
        v3: true,
        v4: array,
        v5: object,
      });
      r.tag('t1');
      var r2 = r.clone();
      expect(r2 instanceof R).toBe(true);
      expect(r2._v1).toBe(1);
      expect(r2.v2).toBe('string');
      expect(r2.v3).toBe(true);
      expect(r2.v4).toEqual(array);
      expect(r2.v5).toEqual(object);
      expect(r2._tags_).toEqual(['t1']);
    });
  });
});
