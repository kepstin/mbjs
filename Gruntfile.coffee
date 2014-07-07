module.exports = (grunt) ->
  
  grunt.loadNpmTasks('grunt-bower-task')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-compress')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-ember-template-compiler')

  grunt.initConfig
    bower:
      install:
        options:
          cleanTargetDir: true
          layout: 'byComponent'
    clean:
      build:
        src: [
          "css/*.css",
          "css/*.map",
          "js/*.js",
          "js/*.map"
        ]
      dist:
        src: "dist"
    coffee:
      build:
        options:
          sourceMap: true
        src: "coffee/**/*.coffee"
        dest: "js/app.js"
    compress:
      static_gz:
        options:
          mode: 'gzip'
          level: 9
          pretty: true
        files: [
          {
            expand: true
            extDot: 'last'
            src: ['dist/**/*.css']
            ext: '.css.gz'
          }
          {
            expand: true
            extDot: 'last'
            src: ['dist/**/*.js']
            ext: '.js.gz'
          }
          {
            expand: true
            extDot: 'last'
            src: ['dist/**/*.map']
            ext: '.map.gz'
          }
          { expand: true, src: ['dist/**/*.coffee'], ext: '.coffee.gz' }
          { expand: true, src: ['dist/**/*.less'], ext: '.less.gz' }
        ]
    copy:
      build_lib:
        files: [
          { src: 'lib/jquery/js/jquery.min.js', dest: 'js/jquery.min.js' }
          { src: 'lib/jquery/js/jquery.min.map', dest: 'js/jquery.min.map' }
        ]
      dist:
        files: [
          # Built output files
          {
            expand: true
            src: [
              'js/*.min.js'
              'js/*.min.js.map'
              'js/*.min.map'
              'css/*.min.css'
              'css/*.min.css.map'
            ]
            dest: 'dist/'
          }
          # Static files
          {
            expand: true
            src: [ 'index.html' ]
            dest: 'dist/'
          }
          # Source files used by source maps
          {
            expand: true
            src: [
              'js/*.coffee'
              'less/**/*.less'
              'lib/bootstrap/less/**/*.less'
              'lib/bootstrap/js/bootstrap.js'
              'lib/ember/js/ember.js'
              'lib/ember-data/js/ember-data.prod.js'
              'lib/handlebars/js/handlebars.runtime.js'
            ]
            dest: 'dist/'
          }
          {
            src: 'lib/jquery/js/jquery.js'
            dest: 'dist/js/jquery.js'
          }
        ]
    emberhandlebars:
      build:
        options:
          templateName: (source_file) ->
            source_file.replace('handlebars/','').replace('.handlebars','')
        files: ['handlebars/**/*.handlebars' ]
        dest: 'js/templates.js'
    less:
      build:
        options:
          sourceMap: true
          sourceMapFilename: "css/app.min.css.map"
          sourceMapRootpath: "../"
          cleancss: true
          paths: [ "lib/bootstrap/less" ]
        src: "less/app.less"
        dest: "css/app.min.css"
    uglify:
      build_app:
        options:
          sourceMap: true
          sourceMapIn: "js/app.js.map"
          sourceMapIncludeSources: true
        src: "js/app.js"
        dest: "js/app.min.js"
      build_templates:
        src: 'js/templates.js'
        dest: 'js/templates.min.js'
      build_lib:
        options:
          sourceMap: true
        files: [
          {
            src: 'lib/bootstrap/js/bootstrap.js'
            dest: 'js/bootstrap.min.js'
          }
          {
            src: 'lib/ember/js/ember.js'
            dest: 'js/ember.min.js'
          }
          {
            src: 'lib/ember-data/js/ember-data.prod.js'
            dest: 'js/ember-data.min.js'
          }
          {
            src: 'lib/handlebars/js/handlebars.runtime.js'
            dest: 'js/handlebars.min.js'
          }
        ]

  grunt.registerTask('install', ['bower:install'])

  grunt.registerTask('build', [
    'clean:build'
    'less:build'
    'coffee:build'
    'emberhandlebars:build'
    'uglify:build_app'
    'uglify:build_templates'
    'copy:build_lib'
    'uglify:build_lib'
  ])

  grunt.registerTask('dist', ['clean:dist', 'copy:dist'])

  grunt.registerTask('default', ['install', 'build', 'dist' ])

  grunt.registerTask('static_gz', ['compress:static_gz'])
