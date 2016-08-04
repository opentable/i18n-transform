module.exports = function (grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'index.js',
                'lib/**'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        mochaTest: {
            options: {
                reporter: 'spec'
            },
            tests: {
                src: ['tests/tests.js']
            }
        },
        mocha_istanbul: {
            coverage: {
                src: 'tests', // a folder works nicely
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.registerTask('test', ['jshint', 'mochaTest']);
    grunt.registerTask('coverage', ['mocha_istanbul']);
    grunt.registerTask('default', ['test']);
};
