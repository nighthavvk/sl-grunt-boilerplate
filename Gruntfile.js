/*!
 * @author Maks Charuk
 */

'use strict';

/**
 * Livereload and connect variables
 */
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({
  port: LIVERELOAD_PORT
});
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

/**
 * Grunt module
 */
module.exports = function (grunt) {

  /**
   * Dynamically load npm tasks
   */
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  /**
   * FireShell Grunt config
   */
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    /**
     * Set project info
     */
    project: {
      src: 'src',
      app: 'app',
      assets: '<%= project.app %>/assets',
      css: {
        root: [
          '<%= project.src %>/scss/*.{scss,sass}'
        ],
        all: [
          '<%= project.src %>/scss/{,*/}*.{scss,sass}'
        ]
      },
      js: [
        '<%= project.src %>/js/{,*/}*.js'
      ],
      html: {
        root: [
          '<%= project.src %>/html/*.html'
        ],
        all: [
          '<%= project.src %>/html/{,*/}*.html'
        ]
      }
    },

    /**
     * Project banner
     * Dynamically appended to CSS/JS files
     * Inherits text from package.json
     */
    tag: {
      banner: '/*!\n' +
              ' * <%= pkg.name %>\n' +
              ' * <%= pkg.title %>\n' +
              ' * <%= pkg.url %>\n' +
              ' * @author <%= pkg.author %>\n' +
              ' * @version <%= pkg.version %>\n' +
              ' * Copyright <%= pkg.copyright %>. <%= pkg.license %> licensed.\n' +
              ' */\n'
    },

    /**
     * Connect port/livereload
     * https://github.com/gruntjs/grunt-contrib-connect
     * Starts a local webserver and injects
     * livereload snippet
     */
    connect: {
      options: {
        port: 9000,
        hostname: '*'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [lrSnippet, mountFolder(connect, 'app')];
          }
        }
      }
    },

    /**
     * JSHint
     * https://github.com/gruntjs/grunt-contrib-jshint
     * Manage the options inside .jshintrc file
     */
    jshint: {
      files: ['<%= project.assets %>/js/scripts.min.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    /**
     * Concatenate JavaScript files
     * https://github.com/gruntjs/grunt-contrib-concat
     * Imports all .js files and appends project banner
     */
    concat: {
      dev: {
        src: ['<%= project.src %>/js/vendor/*.js',
              '<%= project.src %>/js/classes/*.js',
              '<%= project.src %>/js/pages/*.js',
              '<%= project.src %>/js/*.js',
              '<%= project.src %>/js/tests/*.js'
             ],
        dest: '<%= project.assets %>/js/scripts.min.js'
      },
      options: {
        stripBanners: true,
        nonull: true,
        banner: '<%= tag.banner %>'
      }
    },

    /**
     * Uglify (minify) JavaScript files
     * https://github.com/gruntjs/grunt-contrib-uglify
     * Compresses and minifies all JavaScript files into one
     */
    uglify: {
      options: {
        banner: "<%= tag.banner %>"
      },
      dist: {
        files: {
          '<%= project.assets %>/js/scripts.min.js': '<%= project.js %>'
        }
      }
    },

    /**
     * Compile Sass/SCSS files
     * https://github.com/gruntjs/grunt-contrib-sass
     * Compiles all Sass/SCSS files and appends project banner
     */
    sass: {
      dev: {
        options: {
          style: 'expanded',
          banner: '<%= tag.banner %>'
        },
        files: {
          '<%= project.assets %>/css/style.min.css': '<%= project.css.root %>'
        }
      },
      dist: {
        options: {
          style: 'compressed',
          banner: '<%= tag.banner %>'
        },
        files: {
          '<%= project.assets %>/css/style.min.css': '<%= project.css.root %>'
        }
      }
    },

    /**
     * Add prefixes to css
     * https://github.com/nDmitry/grunt-autoprefixer
     */
    autoprefixer: {
        options: {
            browsers: ['last 2 versions', 'ie 8', 'ie 9', '> 1%']
        },
        main: {
            expand: true,
            flatten: true,
            src: 'app/assets/css/*.css',
            dest: 'app/assets/css/'
        }
    },

    /**
     * A grunt task for including a file within another file.
     * https://github.com/vanetix/grunt-includes
     */
    includes: {
      files: {
        src: '<%= project.html.root %>',
        dest: '<%= project.app %>/',
        flatten: true,
        cwd: '.',
        options: {
          silent: true,
          filenameSuffix: '.html'
        }
      }
    },


    /**
     * Minify images using imagemin.
     * https://github.com/gruntjs/grunt-contrib-imagemin
     */
    imagemin: {
      dynamic: {
        files: [{
          expand: true,
          cwd: '<%= project.src %>/img',
          src: ['{,*/}*.{png,jpg,gif,svg}'],
          dest: '<%= project.assets %>/img/'
        }]
      }
    },

    /**
     * Opens the web server in the browser
     * https://github.com/jsoverson/grunt-open
     */
    open: {
      server: {
        path: 'http://0.0.0.0:<%= connect.options.port %>'
      }
    },

    /**
     * Runs tasks against changed watched files
     * https://github.com/gruntjs/grunt-contrib-watch
     * Watching development files and run concat/compile tasks
     * Livereload the browser once complete
     */
    watch: {
      concat: {
        files: '<%= project.js %>',
        tasks: ['concat:dev']
      },
      sass: {
        files: '<%= project.css.all %>',
        tasks: ['sass:dev', 'autoprefixer']
      },
      includes: {
        files: '<%= project.html.all %>',
        tasks: ['includes']
      },
      imagemin: {
        files: '<%= project.src %>/img/{,*/}*.{png,jpg,gif,svg}',
        tasks: ['newer:imagemin']
      },
      livereload: {
        options: {
          livereload: LIVERELOAD_PORT
        },
        files: [
          '<%= project.app %>/{,*/}*.html',
          '<%= project.assets %>/css/*.css',
          '<%= project.assets %>/js/{,*/}*.js',
          '<%= project.assets %>/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    }
  });

  /**
   * Default task
   * Run `grunt` on the command line
   */
  grunt.registerTask('default', [
    'imagemin',
    'sass:dev',
    'autoprefixer',
    'includes',
    'concat:dev',
    // 'jshint',
    'connect:livereload',
    'open',
    'watch'
  ]);

  /**
   * Build task
   * Run `grunt build` on the command line
   * Then compress all JS/CSS files
   */
  grunt.registerTask('build', [
    'imagemin',
    'sass:dist',
    'autoprefixer',
    'includes',
    // 'jshint',
    'uglify'
  ]);

};
