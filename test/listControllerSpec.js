define(['src/MVC/controller/controller',
  'src/MVC/controller/listController',
  'src/MVC/model/model',
  'src/MVC/view/ejs',
  'jquery',
  'jasmine-jquery'],
  function(Controller, ListController, Model, ejs, $) {
  ejs.setBase('base/test/fixtures');
  jasmine.getFixtures().fixturesPath = "base/test/fixtures";
  var model = new Model();
  model.load([{
    id:0,
    name: 'bob',
    des: 'friend of tobi'
  }, {
    id: 1,
    name: 'tobi',
    des: 'friend of bob and happy'
  }, {
    id: 2,
    name: 'lisa',
    des: 'friend of happy',
  }, {
    id: 3,
    name: 'happy',
    des: 'friend of lisa'
  }]);

  describe('ListController', function() {
    beforeEach(function() {
      loadFixtures("controller/main.html");
    });

    describe('Render', function() {
      it('Simple render', function() {
        var list = new ListController({
          url: 'controller/item.ejs',
          renderTo: 'screen',
          model: model
        });
        list.render();
        expect($('#screen li').length).toBe(4);
        expect($('#screen').html()).toBe('<li>happy</li><li>lisa' +
          '</li><li>tobi</li><li>bob</li>');
      });

      it('Render with default sorter', function() {
        var list = new ListController({
          url: 'controller/item.ejs',
          renderTo: 'screen',
          model: model
        });
        list.trigger('sortBy', 'id', 'asc');
        expect($('#screen').html()).toBe('<li>bob</li><li>tobi</li>' +
          '<li>lisa</li><li>happy</li>');
        list.trigger('sortBy', 'name', 'asc');
        expect($('#screen').html()).toBe('<li>bob</li><li>happy</li>' +
          '<li>lisa</li><li>tobi</li>');
      });

      it('Render with customzied sorter', function() {
        var wiredLetterOrder = ['h', 't', 'b', 'l' ];
        var list = new ListController({
          url: 'controller/item.ejs',
          renderTo: 'screen',
          model: model,
          sorters: {
            name: function(a, b, k) {
              var al = a[k].charAt(0);
              var bl = b[k].charAt(0);
              var ai = wiredLetterOrder.indexOf(al)
              var bi = wiredLetterOrder.indexOf(bl)
              if (ai === bi) {
                return 0;
              }
              return ai > bi ? 1 : -1;
            }
          }
        });
        list.trigger('sortBy', 'name', 'asc');
        expect($('#screen').html()).toBe('<li>happy</li><li>tobi' +
          '</li><li>bob</li><li>lisa</li>');
        list.trigger('sortBy', 'name', 'desc');
        expect($('#screen').html()).toBe('<li>lisa</li><li>bob' +
          '</li><li>tobi</li><li>happy</li>');
      });

      it('Render with default search filter', function() {
        var list = new ListController({
          url: 'controller/item.ejs',
          renderTo: 'screen',
          model: model,
          filters: {
            name: 'd',
            des: 'd'
          }
        });
        list.trigger('searchBy', 'bo');
        expect($('#screen').html()).toBe('<li>tobi</li><li>bob</li>');
        list.trigger('searchBy', 'sa');
        expect($('#screen').html()).toBe('<li>happy</li><li>lisa</li>');
      });

      it('Render with customized search filter', function() {
        var list = new ListController({
          url: 'controller/item.ejs',
          renderTo: 'screen',
          model: model,
          filters: {
            id: function(id, number) {
              return id > number;
            }
          }
        });
        list.trigger('searchBy', 1);
        expect($('#screen').html()).toBe('<li>happy</li><li>lisa</li>');
        list.trigger('searchBy', 2);
        expect($('#screen').html()).toBe('<li>happy</li>');
      });

      it('Render with customized filter', function() {
        var list = new ListController({
          url: 'controller/item.ejs',
          renderTo: 'screen',
          model: model,
          customizedFilters: [function(rec, index){
            return rec.id > this.idlimited;
          }],
          property: {
            idlimited: 1
          }
        });
        list.render();
        expect($('#screen').html()).toBe('<li>happy</li><li>lisa</li>');
      });

      it('Render with paging', function() {
        var list = new ListController({
          url: 'controller/item.ejs',
          renderTo: 'screen',
          model: model,
          pageSize: 3
        });
        list.trigger('pageTo', 1);
        expect($('#screen').html()).toBe('<li>happy</li><li>lisa</li>'
          + '<li>tobi</li>');
        expect(list.pageNum).toBe(1);
        expect(list.totalPages).toBe(2);
        list.trigger('pageTo', 2);
        expect(list.pageNum).toBe(2);
        expect($('#screen').html()).toBe('<li>bob</li>');
        list.trigger('pageTo', 0);
        expect($('#screen').html()).toBe('<li>happy</li><li>lisa</li>'
          + '<li>tobi</li>');
        expect(list.pageNum).toBe(1);
        list.trigger('pageTo', 10);
        expect(list.pageNum).toBe(2);
        expect($('#screen').html()).toBe('<li>bob</li>');
      });
    });

    it('Event trigger', function() {
      var f1 = jasmine.createSpy('f1');
      var f2 = jasmine.createSpy('f2');
      var footer = new Controller({
        url: 'controller/footer.ejs',
        renderTo: 'footer'
      });

      var list = new ListController({
        url: 'controller/item.ejs',
        renderTo: 'menu',
        model: model,
        pageSize: 3,
        children: [footer]
      });

      var c = new Controller({
        url:'controller/menu.ejs',
        renderTo: 'screen',
        children: [list]
      });

      c.bind('listRender', f1);
      footer.bind('listRender', f2);
      c.render();
      expect(f1).toHaveBeenCalledWith(list, 1, 2);
      expect(f2).toHaveBeenCalledWith(list, 1, 2);
      list.pageTo(2);
      expect(f1).toHaveBeenCalledWith(list, 2, 2);
      expect(f2).toHaveBeenCalledWith(list, 2, 2);
    });

    it('Event handler', function() {
      var f1 = jasmine.createSpy('f1');
      var f2 = jasmine.createSpy('f2');
      var list = new ListController({
        url: 'controller/item-handler.ejs',
        renderTo: 'menu',
        model: model,
        handlers: {
          '#item-1 click': f1,
          '#item-2 click': f2
        }
      });

      var c = new Controller({
        url:'controller/menu.ejs',
        renderTo: 'screen',
        children: [list]
      });

      c.render();
      $('#item-1').click();
      expect(f1).toHaveBeenCalled();
      $('#item-2').click();
      expect(f2).toHaveBeenCalled();
      expect(f1.calls.argsFor(0)[1]).toBe(model.get(1))
      expect(f2.calls.argsFor(0)[1]).toBe(model.get(2))
    });

    it('Reset view', function() {
      var list = new ListController({
        url: 'controller/item.ejs',
        renderTo: 'screen',
        model: model,
        pageSize: 2,
        filters: {
          name: 'd',
          des: 'd'
        }
      });

      list.sortBy('id', 'asc');
      list.searchBy('happy');
      list.pageTo(2);
      expect($('#screen').html()).toBe('<li>happy</li>');
      list.reset();
      list.render();
      expect($('#screen').html()).toBe('<li>happy</li><li>lisa</li>');
    });
  });
});
