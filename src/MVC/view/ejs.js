
/*!
 * EJS
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */


/*
 * Modifeid by Jackey to make it a Requirejs module
 *
 * */

define(['./filters'], function(filters) {
  var exports = {};
  exports.filters = filters;
  var basedir = '';

  exports.setBase = function(url) {
    basedir = trimSlash(url);
  };

  var utils = {
    escape: function(html){
      return String(html)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;');
    }
  }

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

  var read = function(path, charset) {
    var request = newRequest()
    request.open("GET", path, false);
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

  /**
   * Intermediate js cache.
   *
   * @type Object
   */

  var cache = {};

  /**
   * Clear intermediate js cache.
   *
   * @api public
   */

  exports.clearCache = function(){
    cache = {};
  };

  /**
   * Translate filtered code into function calls.
   *
   * @param {String} js
   * @return {String}
   * @api private
   */

  function filtered(js) {
    return js.substr(1).split('|').reduce(function(js, filter){
      var parts = filter.split(':')
        , name = parts.shift()
        , args = parts.join(':') || '';
      if (args) args = ', ' + args;
      return 'filters.' + name + '(' + js + args + ')';
    });
  };

  /**
   * Re-throw the given `err` in context to the
   * `str` of ejs, `filename`, and `lineno`.
   *
   * @param {Error} err
   * @param {String} str
   * @param {String} filename
   * @param {String} lineno
   * @api private
   */

  function rethrow(err, str, filename, lineno){
    var lines = str.split('\n')
      , start = Math.max(lineno - 3, 0)
      , end = Math.min(lines.length, lineno + 3);

    // Error context
    var context = lines.slice(start, end).map(function(line, i){
      var curr = i + start + 1;
      return (curr == lineno ? ' >> ' : '    ')
        + curr
        + '| '
        + line;
    }).join('\n');

    // Alter exception message
    err.path = filename;
    err.message = (filename || 'ejs') + ':'
      + lineno + '\n'
      + context + '\n\n'
      + err.message;

    throw err;
  }

  /**
   * Parse the given `str` of ejs, returning the function body.
   *
   * @param {String} str
   * @return {String}
   * @api public
   */

  var parse = exports.parse = function(str, options){
    var options = options || {}
      , open = options.open || exports.open || '<%'
      , close = options.close || exports.close || '%>'
      , filename = options.filename
      , compileDebug = options.compileDebug !== false
      , buf = "";

    buf += 'var buf = [];';
    if (false !== options._with) buf += '\nwith (locals || {}) { (function(){ ';
    buf += '\n buf.push(\'';

    var lineno = 1;

    var consumeEOL = false;
    for (var i = 0, len = str.length; i < len; ++i) {
      var stri = str[i];
      if (str.slice(i, open.length + i) == open) {
        i += open.length

        var prefix, postfix, line = (compileDebug ? '__stack.lineno=' : '') + lineno;
        switch (str[i]) {
          case '=':
            prefix = "', escape((" + line + ', ';
            postfix = ")), '";
            ++i;
            break;
          case '-':
            prefix = "', (" + line + ', ';
            postfix = "), '";
            ++i;
            break;
          default:
            prefix = "');" + line + ';';
            postfix = "; buf.push('";
        }

        var end = str.indexOf(close, i);

        if (end < 0){
          throw new Error('Could not find matching close tag "' + close + '".');
        }

        var js = str.substring(i, end)
          , start = i
          , include = null
          , n = 0;

        if ('-' == js[js.length-1]){
          js = js.substring(0, js.length - 2);
          consumeEOL = true;
        }

        if (0 == js.trim().indexOf('include')) {
          var path = js.trim().slice(7).trim();
          if (!isAbsolute(path)) {
            var base;
            if (filename) {
              base = baseUrl(filename);
            } else {
              base = basedir;
            }
            path = concatAndResolveUrl(base,  path);
          }
          include = read(path, 'utf8');
          include = exports.parse(include, {filename: path, _with: false, open: open, close: close, compileDebug: compileDebug });
          buf += "' + (function(){" + include + "})() + '";
          js = '';
        }

        while (~(n = js.indexOf("\n", n))) n++, lineno++;
        if (js.substr(0, 1) == ':') js = filtered(js);
        if (js) {
          if (js.lastIndexOf('//') > js.lastIndexOf('\n')) js += '\n';
          buf += prefix;
          buf += js;
          buf += postfix;
        }
        i += end - start + close.length - 1;

      } else if (stri == "\\") {
        buf += "\\\\";
      } else if (stri == "'") {
        buf += "\\'";
      } else if (stri == "\r") {
        // ignore
      } else if (stri == "\n") {
        if (consumeEOL) {
          consumeEOL = false;
        } else {
          buf += "\\n";
          lineno++;
        }
      } else {
        buf += stri;
      }
    }

    if (false !== options._with) buf += "'); })();\n} \nreturn buf.join('');";
    else buf += "');\nreturn buf.join('');";
    return buf;
  };

  /**
   * Compile the given `str` of ejs into a `Function`.
   *
   * @param {String} str
   * @param {Object} options
   * @return {Function}
   * @api public
   */

  var compile = exports.compile = function(str, options){
    options = options || {};
    var escape = options.escape || utils.escape;

    var input = JSON.stringify(str)
      , compileDebug = options.compileDebug !== false
      , client = options.client
      , filename = options.filename
          ? JSON.stringify(options.filename)
          : 'undefined';

    if (compileDebug) {
      // Adds the fancy stack trace meta info
      str = [
        'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
        rethrow.toString(),
        'try {',
        exports.parse(str, options),
        '} catch (err) {',
        '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
        '}'
      ].join("\n");
    } else {
      str = exports.parse(str, options);
    }

    if (options.debug) console.log(str);
    if (client) str = 'escape = escape || ' + escape.toString() + ';\n' + str;

    try {
      var fn = new Function('locals, filters, escape, rethrow', str);
    } catch (err) {
      if ('SyntaxError' == err.name) {
        err.message += options.filename
          ? ' in ' + filename
          : ' while compiling ejs';
      }
      throw err;
    }

    if (client) return fn;

    return function(locals){
      return fn.call(this, locals, filters, escape, rethrow);
    }
  };

  /**
   * Render the given `str` of ejs.
   *
   * Options:
   *
   *   - `locals`          Local variables object
   *   - `cache`           Compiled functions are cached, requires `filename`
   *   - `filename`        Used by `cache` to key caches
   *   - `scope`           Function execution context
   *   - `debug`           Output generated function body
   *   - `open`            Open tag, defaulting to "<%"
   *   - `close`           Closing tag, defaulting to "%>"
   *
   * @param {String} str
   * @param {Object} options
   * @return {String}
   * @api public
   */

  exports.render = function(str, options){
    var fn
      , options = options || {};

    if (options.cache) {
      if (options.filename) {
        fn = cache[options.filename] || (cache[options.filename] = compile(str, options));
      } else {
        throw new Error('"cache" option requires "filename".');
      }
    } else {
      fn = compile(str, options);
    }

    options.__proto__ = options.locals;
    return fn.call(options.scope, options);
  };

  /**
   * Render an EJS file at the given `path` and callback `fn(err, str)`.
   *
   * @param {String} path
   * @param {Object|Function} options or callback
   * @param {Function} fn
   * @api public
   */

  exports.renderFile = function(path, options) {
    if (!isAbsolute(path)) {
      path = concatAndResolveUrl(basedir,  path)
    }

    var key = path + ':string';
    options = options || {};
    options.filename = path;
    // Default use cache
    options.cache = options.cache === false ? false : true;

    var str;
    try {
      str = options.cache
        ? cache[key] || (cache[key] = read(path, 'utf8'))
        : read(path, 'utf8');
    } catch (err) {
      console.error(err);
      return;
    }
    return exports.render(str, options);
  };

  function concatAndResolveUrl(base, concat) {
    var url1 = base.split('/');
    var url2 = concat.split('/');
    var url3 = [ ];
    for (var i = 0, l = url1.length; i < l; i ++) {
      if (url1[i] === '..') {
        url3.pop();
      } else if (url1[i] === '.' || url1[i] === '') {
        continue;
      } else {
        url3.push(url1[i]);
      }
    }
    for (var i = 0, l = url2.length; i < l; i ++) {
      if (url2[i] === '..') {
        url3.pop();
      } else if (url2[i] === '.' || url2[i] === '') {
        continue;
      } else {
        url3.push(url2[i]);
      }
    }
    return url3.join('/');
  }

  function trimSlash(url) {
    url = url.replace(/^[\/]+/, "");
    url = url.replace(/[\/]+$/, "");
    return url;
  }

  function isAbsolute(url) {
    url = trimSlash(url);
    return url.indexOf(basedir) === 0;
  }

  function baseUrl(path) {
    if (!isAbsolute(path)) {
      path = concatAndResolveUrl(basedir, path);
    }
    path = concatAndResolveUrl(path, '../');
    return path;
  }

  return exports;
});
