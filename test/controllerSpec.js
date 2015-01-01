define(['src/MVC/controller/controller',
  'src/MVC/view/ejs',
  'jquery',
  'jasmine-jquery'],
  function(Controller, ejs, $) {
  ejs.setBase('base/test/fixtures');
  jasmine.getFixtures().fixturesPath = "base/test/fixtures";
  describe('Property', function() {
    beforeEach(function() {
      loadFixtures("controller/main.html");
    });
    it('Set property', function() {
      var f = function() {}
      var c = new Controller({
      url: 'controller/simple.ejs',
      property: {
        v1: 'v1',
        v2: f
      },
        renderTo: 'screen'
      });
      expect(c.v1).toBe('v1');
      expect(c.v2).toBe(f);
      c.render();
      expect($('#screen').html()).toEqual('<h1>hey</h1>')
    });
  });

  describe('Data', function() {
    beforeEach(function() {
      loadFixtures("controller/main.html");
    });
    it('Render with simple data', function() {
      var c = new Controller({
        data: {
          name: 'tobi'
        },
        url: 'controller/name.ejs',
        renderTo: 'screen'
      });
      c.render();
      expect($('#screen').html()).toEqual('<h1>tobi</h1>')
      expect(c.simpleData()).toBe(true);
      c.render({name: 'bob'})
      expect($('#screen').html()).toEqual('<h1>bob</h1>')
    });

    it('Render with data function', function() {
      var c = new Controller({
        data: function(controller) {
	        return {
	          name: controller.name
	        }
	      },
        url: 'controller/name.ejs',
        renderTo: 'screen',
        property: {
          name: 'tobi'
        }
      });
      c.render();
      expect(c.data).toEqual({name: 'tobi'});
      expect($('#screen').html()).toEqual('<h1>tobi</h1>')
      expect(c.simpleData()).toBe(false);
      c.render({name: 'bob'})
      expect($('#screen').html()).toEqual('<h1>tobi</h1>')
    });
  });

  describe('Handlers', function() {
    beforeEach(function() {
      loadFixtures("controller/main.html");
    });
    it('Handler is triggered', function() {
      var f = jasmine.createSpy('f');
      var c = new Controller({
	    url: 'controller/handler.ejs',
        renderTo: 'screen',
        data: {
          name: 'tobi'
        },
        handlers: {
          'h1 click': f
        }
      });
      c.render();
      $('h1').click();
      expect(f).toHaveBeenCalled();
    });

   it('Handler\'s context', function() {
      var context;
      var f = function() {
	      context =  this;
      }
      var c = new Controller({
	      url: 'controller/handler.ejs',
        renderTo: 'screen',
        data: {
          name: 'tobi'
        },
	      handlers: {
	        'h1 click': f
	      }
      });
      c.render();
      $('h1').click();
      expect(context).toBe(c);
   });
  });

  describe('Events', function() {
    it('Events is triggered', function() {
      var f = jasmine.createSpy('f');
      var c = new Controller({
	      url: 'controller/handler.ejs',
        renderTo: 'screen',
        data: {
          name: 'tobi'
        },
        events: {
          'e1': f
        }
      });
      c.trigger('e1');
      expect(f).toHaveBeenCalled();
    });
  });

  describe('Destroy', function() {
    beforeEach(function() {
      loadFixtures("controller/main.html");
    });

    it('Destroy a view', function() {
      var c = new Controller({
	      url: 'controller/name.ejs',
        renderTo: 'screen',
        data: {
          name: 'tobi'
        }
      });
      c.render();
      expect($('#screen').html()).toEqual('<h1>tobi</h1>');
      c.destroy();
      expect($('#screen').html()).toEqual('');
      expect(c._url).toBeUndefined();
      expect(c.simpleData).toBeUndefined();
      expect(c._renderTo).toBeUndefined();
      expect(c._handlers).toBeUndefined();
      expect(c.data).toBeUndefined();
    });
  });

  describe('Children', function() {
    var p, c1, c2;
    beforeEach(function() {
      loadFixtures("controller/main.html");
      c1 = new Controller({
	    url: 'controller/child.ejs',
        renderTo: 'c1',
        data: {
          item: 'item1'
        }
      });

      c2 = new Controller({
	      url: 'controller/child.ejs',
        renderTo: 'c2',
        data: {
          item: 'item2'
        }
      });

      p = new Controller({
	      url: 'controller/parent.ejs',
        renderTo: 'screen',
	      children: [c1]
      });
    });

    it('Children render', function() {
      expect(p.children).toEqual([c1]);
      expect(c1._parent_).toBe(p);
      p.render();
      expect($('#c1').html()).toBe('<a>item1</a>');
      expect($('#c2').html()).toBe('');
    });

    it('add and remove child', function() {
      p.addChild(c2);
      expect(c1._parent_).toBe(p);
      expect(c2._parent_).toBe(p);
      expect(p.children).toEqual([c1, c2]);
      p.render();
      expect($('#c1').html()).toBe('<a>item1</a>');
      expect($('#c2').html()).toBe('<a>item2</a>');
      p.removeChild(c1);
      expect(c1._parent_).toBeUndefined();
      expect(p.children).toEqual([c2]);
      p.render();
      expect($('#c1').html()).toBe('');
      expect($('#c2').html()).toBe('<a>item2</a>');
    });

    it('Broadcast event', function() {
      p.addChild(c2);
      var f1 = jasmine.createSpy('f1');
      var f2 = jasmine.createSpy('f2');
      c1.bind('e1', f1);
      c2.bind('e1', f2);
      p.broadcast('e1');
      expect(f1).toHaveBeenCalled();
      expect(f2).toHaveBeenCalled();
    });

    it('Broadcast event with data', function() {
      var f1 = jasmine.createSpy('f1');
      c1.bind('e1', f1);
      p.broadcast('e1', 1,'string');
      expect(f1).toHaveBeenCalledWith(1, 'string');
    });

    it('Notify event to parent', function() {
      var f1 = jasmine.createSpy('f1');
      p.bind('e1', f1);
      c1.notify('e1', 1,'string');
      expect(f1).toHaveBeenCalledWith(1, 'string');
    });
  });
});
