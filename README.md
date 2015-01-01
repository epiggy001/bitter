A MVC JS framework

Dependency

  Module management:
    RequireJS with jQuery (http://requirejs.org/)
    User can define a module by the define API and include a module with
    the require API. All modules are referenced by its path

    For example there is a directory in the framework

    root
    |
    |---basic
    |   |
    |   |---oo.js
    |   |
    |   |---util.js
    |
    |---main.js
    |
    |---require-jquery.js
    |
    |---index.html

    util.js defines all the utility functions and oo.js defines all
    class-related functions.

    If one wants to add a new module for ajax call in the basic directory and
    the ajax module will use oo and util module one can define the module like:

      define(['./oo'], ['./util'], function() {oo, util}) {
        var ajax = oo.create({
          ....
        })
        // Now all class-related functions can be used through oo
        // of course, all utility functions can be used through util
        ....
        ....
        return ajax // Return the module you defined
      }

     The direcoty now looks like:

     root
     |
     |---basic
     |   |
     |   |---oo.js
     |   |
     |   |---util.js
     |   |
     |   |---ajax.js
     |
     |---main.js
     |
     |---require-jquery.js
     |
     |---index.html

     Then if one wants to use ajax module in main.js, one must use the require
     API

      require(['./basic/oo', './basic/util', './basic/ajax.js'],
        function(oo, util, ajax) {
         .....
      });

    And in index.html one can include the main.js and RequireJS like:

      <script data-main="main.js" src="require-jquery.js"></script>

    For more information, check the detial RequireJS API in the above link.


  Unit Test:
    Qunit (http://qunitjs.com/)
    jQuery Mockjax (https://github.com/appendto/jquery-mockjax)

    For each module unit tests must be added. All test modules are in the test
    directory and should be named like {ModuleName}_test.js

    For example, one wants to add unit tests for ajax module, a file named
    ajax_test.js must be created in this way:

      define(['../basic/ajax'], function(ajax) {
        'use strict';
         return {
           RunTests: function () {
             module('ajax');
             test('Ajax Text 1', function () {
               // Do some test
             });

             test('Ajax Text 2', function () {
               // Do some test
             });

              ...
            }
          }
        })

      Then include the test file in test/main.js like:

        require(['oo_test', 'util_test', 'MVC_test', 'navigator_test',
          'ajaxModel_test', 'sqlModel_test', 'sqlAjaxModel_test', 'ajax_test'],
        ....

      For more information to write a test case, please read:
        http://qunitjs.com/cookbook/

  Local Sql like database:
    Dome Storage Query Language
    (https://code.google.com/p/dom-storage-query-language/)

  Template Engine:
    EJS (http://embeddedjs.com/)

Main Modules and API

  oo : Defines all class-related functions. Usage can be found in the comments
       of basic/oo.js

  util: All utility functions are defined there. Now there are only two
        functions:
          clonei(obj): Deep clone an object
          randomStr(length, src): Generate randomStr with given length and
                                  source

  MVC: Defines all MVC related functions and classes

       MVC.Record: Define a record used for model. It is used by MVC.model
                    internally

       MVC.Model: Define a model class.Model stores data and do all the
                  data-related function. It is also an interfce any js object
                  implement 'insert', 'remove', 'update', 'load''getData',
                  'findByKey', 'filter', 'find' functions can be used as a
                  modle. MVC.Model use js object to store data

       MVC.AjaxModel: Store data in js object and sync with server with ajax
                      call

       MVC.SqlModel: Store data in local sql-like database

       MVC.AjaxSqlModel: Store data in local sql-like database and sync data
                         with server with ajax call

       MVC.EJS: EJS template engine. EJS template is the view of the MVC

       MVC.Controller: Define a controller class. User link models and views
                       with controller

       Move detail API and usage example is in the comments of the source if
       MVC directory

  navigator: Defines a navigator class used to navigate between browser hash url

       Move detail API and usage example is in the comments of the source if
       navigator directory
