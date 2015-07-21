'use strict';

var gm = require('gm');
var fs = require('graceful-fs');

function ImageVerify() {
  var self = this;

  // function exports
  self.verify = verify;

  // private variables
  var inputDir = '/Data/Projects/faces/download/output';
  var outputFile = '/Data/Projects/faces/download/verified.txt';

  ////////

  function verify() {

    var outputStream = fs.createWriteStream(outputFile);

    var files = fs.readdirSync(inputDir);
    console.log('Scanning files from: ' + inputDir);
    console.log(files.length + ' items to process');

    var promise = files.reduce(function(promise, file) {
      return promise.then(function() {

        var subdir = file;
        var subpath = inputDir + "/" + file;

        var stat = fs.statSync(subpath);

        if (stat && stat.isDirectory()) {
          console.log('Scanning ' + subpath + '...');

          return verifySubdir_(subpath, subdir, outputStream);
        } else {
          return Promise.resolve();
        }

      });
    }, Promise.resolve())
    .then(function() {
      console.log('Closing file');
      outputStream.end();
    });

    return promise;

  }

  function verifySubdir_(subpath, subdir, outputStream) {
    var promise = new Promise(function(resolve, reject) {
      fs.readdir(subpath, function(err, files) {
        if (err) return reject(err);

        var subpromises = files.map(function(file) {

          var subpromise = new Promise(function(res, rej) {
            var filepath = subpath + '/' + file;
            fs.stat(filepath, function(err, stat) {
              if (err) rej(err);

              if (stat.isFile()) {
                verifyImage_(filepath)
                .then(function() {
                  console.log('Verified: ' + filepath);
                  var line = filepath + '\t' + subdir + '\n';
                  outputStream.write(line);
                  res();
                })
                .catch(function(err) {
                  console.log('Error for: ' + filepath);
                  res();
                  //rej(err);
                });
              } else {
                res();
              }
            });
          });

          return subpromise;

        });

        Promise.all(subpromises)
        .then(resolve)
        .catch(reject);

      });
    });
    return promise;
  }

  function verifyImage_(path) {
    var promise = new Promise(function(resolve, reject) {
      gm(path).identify(function(err, val) {
        if (err) return reject(err);
        resolve();
      });
    });
    return promise;
  }

}

var main = function(){
  var imageVerify = new ImageVerify();
  var promise = imageVerify.verify();

  promise.then(function() {
    console.log('all done!');
  }).catch(function(err) {
    console.log(err);
  });
}

if (require.main === module) {
  main();
}
