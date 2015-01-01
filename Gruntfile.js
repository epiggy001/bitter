module.exports = function(grunt) {
  grunt.initConfig({
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    jshint: {
      target: {
        options: {
          "eqeqeq": true,
          "strict": true
        },
        src: ['test/**/*.js', 'src/**/*.js']
      }
    }
  });
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('default', ['karma']);
};
