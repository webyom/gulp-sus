path = require 'path'
gutil = require 'gulp-util'
through = require 'through2'
sus = require 'sus'

EOL = '\n'

module.exports = (opt = {}) ->
	through.obj (file, enc, next) ->
		return @emit 'error', new gutil.PluginError('gulp-sus', 'File can\'t be null') if file.isNull()
		return @emit 'error', new gutil.PluginError('gulp-sus', 'Streams not supported') if file.isStream()
		return @emit 'error', new gutil.PluginError('gulp-sus', 'Streams not supported') if path.extname(file.path).toLowerCase() isnt '.css'
		sus file.contents.toString(),
			base: path.dirname(file.path)
		.parse (err, parsed) =>
			if err
				@emit 'error', new gutil.PluginError('gulp-sus', err)
			else
				filePath = file.path
				if opt.baseSurfix isnt false
					baseSurfix = opt.baseSurfix || '-base'
					file.path = filePath.replace(/\.css$/i, baseSurfix + '.css')
				if opt.split
					spritesSurfix = opt.spritesSurfix || '-sprites'
					newFile = new gutil.File
						base: file.base
						cwd: file.cwd
						path: filePath.replace(/\.css$/i, spritesSurfix + '.css')
						contents: new Buffer parsed.sprites()
					file.contents = new Buffer parsed.base()
					@push file
					@push newFile
				else
					file.contents = new Buffer parsed.base() + EOL + parsed.sprites()
					@push file
				next()
