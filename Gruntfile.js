module.exports = function(grunt) {
    grunt.initConfig({
        // Task configuration
        concat: {
            options: {
                separator: ';',
            },
            js_frontend: {
                src: [
                    './bower_components/stackblur-canvas/dist/stackblur.js',
                    './bower_components/jquery/dist/jquery.js',
                    './bower_components/bootstrap/dist/js/bootstrap.js',
                    './bower_components/angular/angular.js',
                    './bower_components/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js',
                    './bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.js', 
                    './bower_components/angular-bootstrap-slider/slider.js', 
                    './assets/javascript/custom.js'
                ],
                dest: './public/assets/javascript/javascript.js'
            }
        },
        less: {
            development: {
                options: {
                    compress: true,  //minifying the result
                },
                files: {
                    "./public/assets/stylesheets/stylesheet.css":"./assets/stylesheets/custom.less"
                }
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            frontend: {
                files: {
                    './public/assets/javascript/javascript.min.js': './public/assets/javascript/javascript.js'
                }
            }
        },
        watch: {
            js_frontend: {
                files: [
                        './assets/javascript/*.js'
                    ],
                tasks: ['concat:js_frontend'],
                options: {
                    livereload: true
                }
            },
            less: {
                files: [
                        './assets/stylesheets/*.less'
                    ],
                tasks: ['less'],
                options: {
                    livereload: true
                }
            },
            files: {
                files: ['./public/*'],
                options: {
                    livereload: true
                }
            },
            grunt: {
                files: ['Gruntfile.js']
            }
        },
        copy: {
            fonts: {
                files: [
                    {expand: true, src: 'bower_components/font-awesome/fonts/*', dest: 'public/assets/fonts'}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['watch']);

    grunt.registerTask('init', ['concat', 'less', 'uglify', 'copy:fonts']);
};
