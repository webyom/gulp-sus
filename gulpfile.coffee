gulp = require 'gulp'
coffee = require 'gulp-coffee'

gulp.task 'compile', ->
	gulp.src('src/**/*.coffee')
		.pipe coffee()
		.pipe gulp.dest('lib')

gulp.task 'example', ->
	sus = require './lib/index'
	gulp.src('example/src/style.css')
		.pipe sus
			basePath: 'example/src',
			maxSize: 3000
		.pipe gulp.dest('example/dest')

gulp.task 'default', ['compile']