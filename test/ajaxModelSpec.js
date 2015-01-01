define(['src/MVC/model/ajaxModel',
  'src/basic/util',
  'mock-ajax'], function(AjaxModel, util) {
  describe('Create a AjaxModel', function() {
    it('Constructor with defualt settings', function() {
      var m = new AjaxModel({
        url: 'record'
      });
      expect(m.primary).toBe('id');
      expect(m.Record).not.toBeUndefined();
      expect(m.d).toBeUndefined();
      expect(m.dataType).toBe('json');

      expect(m.endpoints.base).toBe('record');
      expect(m.endpoints.insert.url).toBe('record');
      expect(m.endpoints.load.url).toBe('record');
      expect(m.endpoints.update.url).toBe('{= base}/{= id}');
      expect(m.endpoints.remove.url).toBe('{= base}/{= id}');

      expect(m.endpoints.insert.method).toBe('POST');
      expect(m.endpoints.load.method).toBe('GET');
      expect(m.endpoints.update.method).toBe('PUT');
      expect(m.endpoints.remove.method).toBe('DELETE');
    });

    it('Constructor with customized settings', function() {
      var m = new AjaxModel({
        dataType: 'xml',
        primary: 'rid',
        url: {
          base: 'record',
          remove: {
            url: 'remove?id={= rid}',
            method: 'GET'
          }
        }
      });

      expect(m.dataType).toBe('xml');
      expect(m.primary).toBe('rid');
      expect(m.endpoints.base).toBe('record');
      expect(m.endpoints.insert.url).toBe('record');
      expect(m.endpoints.load.url).toBe('record');
      expect(m.endpoints.update.url).toBe('{= base}/{= rid}');
      expect(m.endpoints.remove.url).toBe('remove?id={= rid}');

      expect(m.endpoints.insert.method).toBe('POST');
      expect(m.endpoints.load.method).toBe('GET');
      expect(m.endpoints.update.method).toBe('PUT');
      expect(m.endpoints.remove.method).toBe('GET');
    });
  });

  describe('ajax functions', function() {
    var done, fail, data, request;

    beforeEach(function() {
      done = jasmine.createSpy('done');
      fail = jasmine.createSpy('fail');
      jasmine.Ajax.install();
      data = [];
      for (var i = 0;i < 10; i++) {
        data.push({id:i, val: i * 2});
      }

      reset();
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    var reset = function() {
      done.calls.reset();
      fail.calls.reset();
    };

    describe('load', function() {
      var m = new AjaxModel({
        url: '/record'
      });

      it('Load data', function() {
        expect(m.loaded()).toBe(false);
        m.load().done(done).fail(fail);
        expect(m.loaded()).toBe(true);

        request = jasmine.Ajax.requests.mostRecent();
        request.response({
          'status': 200,
          'responseText': JSON.stringify(data)
        });

        expect(request.method).toBe('GET');
        expect(request.url).toBe('/record');
        expect(m.count()).toBe(10);
        expect(done).toHaveBeenCalled();
        expect(fail).not.toHaveBeenCalled();

      });

      it('Load error', function() {
        m.load().done(done).fail(fail);
        request = jasmine.Ajax.requests.mostRecent();
        request.response({
          'status': 500,
        });

        m.load().done(done).fail(fail);
        expect(done).not.toHaveBeenCalled();
        expect(fail).toHaveBeenCalled();
      });
    });

    describe('insert', function() {
      var m = new AjaxModel({
        url: '/record',
        fields: [{name: 'v2', def: 10}],
        validators: {
          'v2': {
            func: function() {
              return this.v2 > 5;
            },
            msg: 'msg1'
          }
        }
      });

      it('Throw an error', function() {
        try {
          m.insert({v1: 5, v2: 5})
        } catch(e) {
          expect(e.errMsg).toEqual([{name: 'v2', msg: 'msg1'}]);
        }
      });

      it('Insert done', function() {
        m.insert({v1: 5}).done(done).fail(fail);

        request = jasmine.Ajax.requests.mostRecent();
        expect(request.method).toBe('POST');
        expect(request.url).toBe('/record');
        expect(JSON.parse(request.params)).toEqual({v1: 5, v2: 10});
        request.response({
          'status': 200,
          'responseText': JSON.stringify({id: 1})
        });

        expect(m.count()).toBe(1);
        expect(done).toHaveBeenCalled();
        expect(fail).not.toHaveBeenCalled();

        var rec = m.get(1);
        expect(rec.id).toBe(1);
        expect(rec.v2).toBe(10);
      });

      it('Insert fail', function() {
        m.insert({v1: 5}).done(done).fail(fail);

        request = jasmine.Ajax.requests.mostRecent();
        request.response({
          'status': 500
        });

        expect(m.count()).toBe(1);
        expect(done).not.toHaveBeenCalled();
        expect(fail).toHaveBeenCalled();
      });
    });

    describe('Remove', function() {
      var m;
      beforeEach(function() {
        m = new AjaxModel({
          url: '/record',
        });
        m.load();
        request = jasmine.Ajax.requests.mostRecent();
        request.response({
          'status': 200,
          'responseText': JSON.stringify(data)
        });
      });

      it('Remove error', function() {
        try {
          m.remove(11);
        } catch(e) {
          expect(e.errMsg).toBe('The record does not find');
        }
      });

      it('Remove done', function() {
        m.remove(0).done(done).fail(fail);

        request = jasmine.Ajax.requests.mostRecent();
        expect(request.method).toBe('DELETE');
        expect(request.url).toBe('/record/0');
        request.response({
          'status': 200,
          'responseText': JSON.stringify({})
        });

        expect(m.count()).toBe(9);
        expect(done).toHaveBeenCalled();
        expect(fail).not.toHaveBeenCalled();
      });

      it('Remove fail', function() {
        m.remove(0).done(done).fail(fail);

        request = jasmine.Ajax.requests.mostRecent();
        request.response({
          'status': 500
        });

        expect(m.count()).toBe(10);
        expect(done).not.toHaveBeenCalled();
        expect(fail).toHaveBeenCalled();
      });
    });

    describe('Update', function() {
      var m;
      beforeEach(function() {
        m = new AjaxModel({
          url: '/record',
          fields: [{name: 'v2', def: 10}],
          validators: {
            'v': {
              func: function() {
                return this.val > 0;
              },
              msg: 'msg1'
            }
          }
        });
        m.load();
        request = jasmine.Ajax.requests.mostRecent();
        request.response({
          'status': 200,
          'responseText': JSON.stringify(data)
        });
      });

      it('Throw error', function() {
        try {
          m.update(0, {val: -1});
        } catch(e) {
          expect(e.errMsg).toEqual([{name: 'v', msg: 'msg1'}]);
        }

        try {
          m.update(11, {val: 10});
        } catch(e) {
          expect(e.errMsg).toEqual('The record does not find');
        }
      });

      it('Update done', function() {
        m.update(0, {val: 10}).done(done).fail(fail);

        request = jasmine.Ajax.requests.mostRecent();
        expect(request.method).toBe('PUT');
        expect(request.url).toBe('/record/0');
        request.response({
          'status': 200,
          'responseText': JSON.stringify({})
        });

        expect(done).toHaveBeenCalled();
        expect(fail).not.toHaveBeenCalled();

        var rec = m.get(0);
        expect(rec.val).toEqual(10);
      });

      it('Update fail', function() {
        m.update(0, {val: 10}).done(done).fail(fail);

        request = jasmine.Ajax.requests.mostRecent();
        request.response({
          'status': 500
        });

        expect(done).not.toHaveBeenCalled();
        expect(fail).toHaveBeenCalled();
      });
    });
  });
});
