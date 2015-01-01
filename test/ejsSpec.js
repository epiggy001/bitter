define(['src/MVC/view/ejs'], function(ejs) {
  ejs.setBase('base/test/fixtures');

  var newRequest = function() {
	  var factories = [
      function() { return new XMLHttpRequest(); },
      function() { return new ActiveXObject("Msxml2.XMLHTTP"); },
      function() { return new ActiveXObject("Microsoft.XMLHTTP"); }];

	  for(var i = 0; i < factories.length; i++) {
      try {
	      var request = factories[i]();
	      if (request != null) {
          return request;
	      }
      } catch(e) {
        continue;
      }
	  }
  };

  var fixture = function(path, charset) {
    var request = newRequest()
    request.open("GET", 'base/test/fixtures/ejs/' + path, false);
    request.setRequestHeader("charset", charset);
    try{
      request.send(null);
    } catch(e) {
      return null;
    }
    if (request.status == 404 || request.status == 2 || (
      request.status == 0 && request.responseText == '')) {
      return null;
    }
    return request.responseText
  };

  var users = [];
  users.push({ name: 'tobi' });
  users.push({ name: 'loki' });
  users.push({ name: 'jane' });

  describe('ejs.compile(str, options)', function(){
    it('should compile to a function', function(){
      var fn = ejs.compile('<p>yay</p>');
      expect(fn()).toBe('<p>yay</p>');
    })

    it('should throw if there are syntax errors', function(){
      try {
        ejs.compile(fixture('fail.ejs'));
      } catch (err) {
        expect(err.message.indexOf('compiling ejs')).not.toBe(-1);
      }
    });

    it('should allow customizing delimiters', function(){
      var fn = ejs.compile('<p>{= name }</p>', { open: '{', close: '}' });
      expect(fn({ name: 'tobi' })).toBe('<p>tobi</p>');

      var fn = ejs.compile('<p>::= name ::</p>', { open: '::', close: '::' });
      expect(fn({ name: 'tobi' })).toBe('<p>tobi</p>');

      var fn = ejs.compile('<p>(= name )</p>', { open: '(', close: ')' });
      expect(fn({ name: 'tobi' })).toBe('<p>tobi</p>');
    });

    it('should default to using ejs.open and ejs.close', function(){
      ejs.open = '{';
      ejs.close = '}';
      var fn = ejs.compile('<p>{= name }</p>');
      expect(fn({ name: 'tobi' })).toBe('<p>tobi</p>');

      var fn = ejs.compile('<p>|= name |</p>', { open: '|', close: '|' });
      var fn = ejs.compile('<p>{= name }</p>');
      delete ejs.open;
      delete ejs.close;
    });
  });

  describe('ejs.render(str, options)', function(){
    it('should render the template', function(){
      expect(ejs.render('<p>yay</p>')).toBe('<p>yay</p>');
    });

    it('should accept locals', function(){
      expect(ejs.render('<p><%= name %></p>', { name: 'tobi' })).
        toBe('<p>tobi</p>');
    });
  });

  describe('ejs.renderFile(path, options)', function(){
    it('should render a file', function(){
      expect(ejs.renderFile('ejs/para.ejs')).
        toEqual('<p>hey</p>');
    });

    it('should render a file with abolute path', function(){
      expect(ejs.renderFile('/base/test/fixtures/ejs/para.ejs')).
        toEqual('<p>hey</p>');
    });

    it('should accept locals', function(){
      var options = { name: 'tj', open: '{', close: '}' };
      expect(ejs.renderFile('ejs/user.ejs', options)).
        toEqual('<h1>tj</h1>');
    });
  });

  describe('<%=', function(){
    it('should escape &amp;<script>', function(){
      expect(ejs.render('<%= name %>', { name: '&nbsp;<script>' })).
        toEqual('&amp;nbsp;&lt;script&gt;');
    });

    it("should escape '", function(){
      expect(ejs.render('<%= name %>', { name: "The Jones's" })).
        toEqual('The Jones&#39;s');
    });

    it("should escape &foo_bar;", function(){
      expect(ejs.render('<%= name %>', { name: "&foo_bar;" })).
        toEqual('&amp;foo_bar;');
    });
  });

  describe('<%-', function(){
    it('should not escape', function(){
      expect(ejs.render('<%- name %>', { name: '<script>' })).
        toEqual('<script>');
    });

    it('should terminate gracefully if no close tag is found', function(){
      try {
        ejs.compile('<h1>oops</h1><%- name ->')
        throw new Error('Expected parse failure');
      } catch (err) {
        expect(err.message).toEqual('Could not find matching close tag "%>".');
      }
    });
  });

  describe('%>', function(){
    it('should produce newlines', function(){
      expect(ejs.render(fixture('newlines.ejs'), { users: users })).
        toEqual(fixture('newlines.html'));
    });
  });

  describe('-%>', function(){
    it('should not produce newlines', function(){
      var v = ejs.render(fixture('no.newlines.ejs'), { users: users })
      expect(v).toEqual(fixture('no.newlines.html'));
    })
  })

  describe('single quotes', function(){
    it('should not mess up the constructed function', function(){
      expect(ejs.render(fixture('single-quote.ejs'))).
        toEqual(fixture('single-quote.html'));
    });
  });

  describe('double quotes', function(){
    it('should not mess up the constructed function', function(){
      expect(ejs.render(fixture('double-quote.ejs'))).
        toEqual(fixture('double-quote.html'));
    });
  });

  describe('backslashes', function(){
    it('should escape', function(){
      expect(ejs.render(fixture('backslash.ejs'))).
        toEqual(fixture('backslash.html'));
    });
  });

  describe('messed up whitespace', function(){
    it('should work', function(){
      expect(ejs.render(fixture('messed.ejs'), { users: users })).
        toEqual(fixture('messed.html'));
    });
  });

  describe('filters', function(){
    it('should work', function(){
      var items = ['foo', 'bar', 'baz'];
      var v = ejs.render('<%=: items | reverse | first ' +
        '| reverse | capitalize %>',{ items: items });
      expect(v).toEqual('Zab');
    });

    it('should accept arguments', function(){
      var v = ejs.render('<%=: users | map:"name" | join:", " %>',
        { users: users });
        expect(v).toEqual('tobi, loki, jane');
    });

    it('should truncate string', function(){
      var v = ejs.render('<%=: word | truncate: 3 %>', { word: 'World' })
      expect(v).toEqual('Wor');
    });

    it('should append string if string is longer', function(){
      var v = ejs.render('<%=: word | truncate: 2,"..." %>',
        { word: 'Testing' })
      expect(v).toEqual('Te...');
    });

    it('should not append string if string is shorter', function(){
      var v = ejs.render('<%=: word | truncate: 10,"..." %>',
        { word: 'Testing' });
      expect(v).toEqual('Testing');
    })

    it('should accept arguments containing :', function(){
      var v = ejs.render('<%=: users | map:"name" | join:"::" %>',
        { users: users });
      expect(v).toEqual('tobi::loki::jane');
    })
  });

  describe('exceptions', function(){
    it('should produce useful stack traces', function(){
      try {
        ejs.render(fixture('error.ejs'), { filename: 'error.ejs' });
      } catch (err) {
        expect(err.path).toEqual('error.ejs');
      }
    });

    it('should not include __stack if compileDebug is false', function() {
      try {
        ejs.render(fixture('error.ejs'), {
          filename: 'error.ejs',
          compileDebug: false
        });
      } catch (err) {
        expect('path' in err).toBe(false);
      }
    });
  });

  describe('includes', function(){
    it('should include ejs', function(){
      var file = 'include.ejs';
      var v = ejs.renderFile('ejs/include.ejs',
        { filename: file, pets: users, open: '[[', close: ']]' });

      expect(v).toEqual(fixture('include.html'));
    });

    it('should work when nested', function(){
      var file = 'menu.ejs';
      var v = ejs.render(fixture('menu.ejs'), { filename: file, pets: users })
      expect(v.trim()).toEqual(fixture('menu.html').trim());
    });

    it('should include arbitrary files as-is', function(){
      var file = 'include.css.ejs';
      var v = ejs.renderFile('ejs/include.css.ejs',
        { filename: file, pets: users });
      expect(v.trim()).toEqual(fixture('include.css.html').trim());
    });
  });

  describe('comments', function() {
    it('should fully render with comments removed', function() {
      expect(ejs.render(fixture('comments.ejs'))).
        toEqual(fixture('comments.html'));
    })
  });
});
