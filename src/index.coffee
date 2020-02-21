Q = require 'q'
fs = require 'fs'
path = require 'path'
async = require 'async'
PluginError = require 'plugin-error'
through = require 'through2'
cssParser = require 'css'

URL_REGEXP = /url\s*\(\s*(['"])?([^\)'"]+?)\1?\s*\)/

cssDeclarations = (filePath, declarations, opt = {}) ->
	Q.Promise (resolve, reject) ->
		async.eachSeries(
			declarations
			(declaration, cb) =>
				if declaration.property in ['background-image', 'background']
					m = declaration.value.match URL_REGEXP
					imgPath = m?[2]
					if imgPath and not (/^data:|\/\//i).test(imgPath)
						if imgPath.indexOf('/') is 0 and opt.basePath
							imgPath = path.join opt.basePath, imgPath
						else
							imgPath = path.resolve path.dirname(filePath), imgPath
						if fs.existsSync imgPath
							if opt.maxSize and fs.statSync(imgPath).size > opt.maxSize
								cb()
							else
								declaration.value = declaration.value.replace URL_REGEXP, ->
									ext = path.extname(imgPath).replace(/^\./, '').toLowerCase()
									if ext is 'svg'
										ext = 'svg+xml'
									content = fs.readFileSync imgPath, 'base64'
									'url("data:image/' + ext + ';base64,' + content + '")'
								cb()
						else
							cb()
					else
						cb()
				else
					cb()
			(err) =>
				if err
					reject err
				else
					resolve()
		)

cssRules = (filePath, rules, opt = {}) ->
	Q.Promise (resolve, reject) ->
		async.eachSeries(
			rules
			(rule, cb) =>
				if rule.rules
					cssRules(filePath, rule.rules, opt).then(
						=>
							cb()
						(err) =>
							reject err
					).done()
				if rule.declarations
					cssDeclarations(filePath, rule.declarations, opt).then(
						=>
							cb()
						(err) =>
							reject err
					).done()
				else if not rule.rules
					cb()
			(err) =>
				if err
					reject err
				else
					resolve()
		)

cssContent = (content, filePath, opt = {}) ->
	throw new PluginError('gulp-img-css-sprite', 'filePath is needed') if not filePath
	Q.Promise (resolve, reject) ->
		if URL_REGEXP.test content
			ast = cssParser.parse content, opt
			cssRules(filePath, ast.stylesheet.rules || [], opt).then(
				=>
					content = cssParser.stringify(ast, opt)
					resolve content
				(err) =>
					reject err
			).done()
		else
			resolve content

module.exports = (opt = {}) ->
	through.obj (file, enc, next) ->
		return @emit 'error', new PluginError('gulp-sus', 'File can\'t be null') if file.isNull()
		return @emit 'error', new PluginError('gulp-sus', 'Streams not supported') if file.isStream()
		return @emit 'error', new PluginError('gulp-sus', 'File type not supported') if path.extname(file.path).toLowerCase() isnt '.css'
		cssContent(file.contents.toString(), file.path, opt).then(
			(content) =>
				file.contents = new Buffer content
				@push file
				next()
			(err) =>
				@emit 'error', new PluginError('gulp-sus', err) if err
		).done()

module.exports.cssContent = cssContent
