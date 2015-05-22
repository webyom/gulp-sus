(function() {
  var Q, URL_REGEXP, async, cssContent, cssDeclarations, cssParser, cssRules, fs, gutil, path, through;

  Q = require('q');

  fs = require('fs');

  path = require('path');

  async = require('async');

  gutil = require('gulp-util');

  through = require('through2');

  cssParser = require('css');

  URL_REGEXP = /url\s*\(\s*(['"])?([^\)'"]+?)\1?\s*\)/;

  cssDeclarations = function(filePath, declarations, opt) {
    if (opt == null) {
      opt = {};
    }
    return Q.Promise(function(resolve, reject) {
      return async.eachSeries(declarations, (function(_this) {
        return function(declaration, cb) {
          var imgPath, m, ref;
          if ((ref = declaration.property) === 'background-image' || ref === 'background') {
            m = declaration.value.match(URL_REGEXP);
            imgPath = m != null ? m[2] : void 0;
            if (imgPath && !/^data:|\/\//i.test(imgPath)) {
              imgPath = path.resolve(path.dirname(filePath), imgPath);
              if (fs.existsSync(imgPath)) {
                declaration.value = declaration.value.replace(URL_REGEXP, function() {
                  return 'url("data:image/' + path.extname(imgPath).replace(/^\./, '') + ';base64,' + fs.readFileSync(imgPath, 'base64') + '")';
                });
                return cb();
              } else {
                return cb();
              }
            } else {
              return cb();
            }
          } else {
            return cb();
          }
        };
      })(this), (function(_this) {
        return function(err) {
          if (err) {
            return reject(err);
          } else {
            return resolve();
          }
        };
      })(this));
    });
  };

  cssRules = function(filePath, rules, opt) {
    if (opt == null) {
      opt = {};
    }
    return Q.Promise(function(resolve, reject) {
      return async.eachSeries(rules, (function(_this) {
        return function(rule, cb) {
          if (rule.rules) {
            cssRules(filePath, rule.rules, opt).then(function() {
              return cb();
            }, function(err) {
              return reject(err);
            }).done();
          }
          if (rule.declarations) {
            return cssDeclarations(filePath, rule.declarations, opt).then(function() {
              return cb();
            }, function(err) {
              return reject(err);
            }).done();
          } else if (!rule.rules) {
            return cb();
          }
        };
      })(this), (function(_this) {
        return function(err) {
          if (err) {
            return reject(err);
          } else {
            return resolve();
          }
        };
      })(this));
    });
  };

  cssContent = function(content, filePath, opt) {
    if (opt == null) {
      opt = {};
    }
    if (!filePath) {
      throw new gutil.PluginError('gulp-img-css-sprite', 'filePath is needed');
    }
    return Q.Promise(function(resolve, reject) {
      var ast;
      if (URL_REGEXP.test(content)) {
        ast = cssParser.parse(content, opt);
        return cssRules(filePath, ast.stylesheet.rules || [], opt).then((function(_this) {
          return function() {
            content = new Buffer(cssParser.stringify(ast, opt));
            return resolve(content);
          };
        })(this), (function(_this) {
          return function(err) {
            return reject(err);
          };
        })(this)).done();
      } else {
        return resolve(content);
      }
    });
  };

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
        return this.emit('error', new gutil.PluginError('gulp-sus', 'File type not supported'));
      }
      return cssContent(file.contents.toString(), file.path, opt).then((function(_this) {
        return function(content) {
          file.contents = new Buffer(content);
          _this.push(file);
          return next();
        };
      })(this), (function(_this) {
        return function(err) {
          if (err) {
            return _this.emit('error', new gutil.PluginError('gulp-sus', err));
          }
        };
      })(this)).done();
    });
  };

  module.exports.cssContent = cssContent;

}).call(this);
