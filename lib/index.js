(function() {
  var EOL, gutil, path, sus, through;

  path = require('path');

  gutil = require('gulp-util');

  through = require('through2');

  sus = require('sus');

  EOL = '\n';

  module.exports = function(opt) {
    if (opt == null) {
      opt = {};
    }
    return through.obj(function(file, enc, next) {
      if (file.isNull()) {
        return this.emit('error', new gutil.PluginError('gulp-sus', 'File can\'t be null'));
      }
      if (file.isStream()) {
        return this.emit('error', new gutil.PluginError('gulp-sus', 'Streams not supported'));
      }
      if (path.extname(file.path).toLowerCase() !== '.css') {
        return this.emit('error', new gutil.PluginError('gulp-sus', 'Streams not supported'));
      }
      return sus(file.contents.toString(), {
        base: path.dirname(file.path)
      }).parse((function(_this) {
        return function(err, parsed) {
          var baseSurfix, filePath, newFile, spritesSurfix;
          if (err) {
            return _this.emit('error', new gutil.PluginError('gulp-sus', err));
          } else {
            filePath = file.path;
            if (opt.baseSurfix !== false) {
              baseSurfix = opt.baseSurfix || '-base';
              file.path = filePath.replace(/\.css$/i, baseSurfix + '.css');
            }
            if (opt.split) {
              spritesSurfix = opt.spritesSurfix || '-sprites';
              newFile = new gutil.File({
                base: file.base,
                cwd: file.cwd,
                path: filePath.replace(/\.css$/i, spritesSurfix + '.css'),
                contents: new Buffer(parsed.sprites())
              });
              file.contents = new Buffer(parsed.base());
              _this.push(file);
              _this.push(newFile);
            } else {
              file.contents = new Buffer(parsed.base() + EOL + parsed.sprites());
              _this.push(file);
            }
            return next();
          }
        };
      })(this));
    });
  };

}).call(this);
