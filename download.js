'use strict';

var request = require('request');
var fs = require('graceful-fs');
var readline = require('linebyline');

function ImageDownloader() {
  var self = this;

  // function exports
  self.download = download;

  // private variables
  var inputDir = '/Data/Projects/faces/download/images';
  var outputDir = '/Data/Projects/faces/download/output';

  ////////

  function download() {

    var files = fs.readdirSync(inputDir);
    console.log('Scanning files from: ' + inputDir);
    console.log(files.length + ' items to process');

    var promise = files.reduce(function(promise, file) {
      return promise.then(function() {

        //if ((file === '.') || (file === '..')) return;
        var subdir = file;
        var subpath = inputDir + "/" + file;

        var stat = fs.statSync(subpath);

        if (stat && stat.isDirectory()) {
          console.log('Scanning ' + subpath + '...');

          return downloadFiles_(subpath, subdir, outputDir);
        } else {
          return Promise.resolve();
        }

      });
    }, Promise.resolve());

    return promise;

  }

  ////////

  function reqRecursive_(urlMirrors, dest) {

    var promise = new Promise(function(resolve, reject) {

      var urls = urlMirrors.reverse();
      var url = urls.pop();

      if (url === undefined) {
        return reject(new Error('Could not download any of the url mirrors'));
      }

      //console.log('   Attempting mirror download: ' + url);

      var reqObj = {
        method: 'GET',
        uri: url,
        encoding: 'binary'
      };

      request(reqObj, function(error, response, body) {
        if (!error && response.statusCode == 200) {

          //console.log('WRITING To: ' + dest);
          fs.writeFile(dest, body, 'binary', function(err) {
            if (err) {
              fs.exists(dest, function(exists) {
                if (exists) fs.unlink(dest);

                console.log(err);
                reqRecursive_(urls, dest)
                .then(resolve)
                .catch(reject);
              });
            }
          });

        } else {
          //console.log(error);
          reqRecursive_(urls, dest)
          .then(resolve)
          .catch(reject);
        }
      });

    });

    return promise;

  }

  function downloadFile_(urlMirrors, dest) {

    var urls = urlMirrors.slice();
    return reqRecursive_(urls, dest);

  }

  function downloadFiles_(subpath, subdir, outputDir) {
    var inputFile = subpath + '/info.txt';
    var rl = readline(inputFile);

    var num_ims = 0;
    var outputFile = '';
    var urls = [];

    var promise = new Promise(function(resolve, reject) {

      rl.on('line', function(line, lineCount, byteCount) {
        if (num_ims == 0) {
          // process urls from last batch
          if (urls.length > 0) {
            console.log('Saving urls to: ' + outputFile);
            downloadFile_(urls, outputFile);
          }
          // ensure new output path exists
          var outputFullPath = outputDir + '/' + subdir;
          try {
            var statRes = fs.statSync(outputFullPath);
          } catch (e) {
            console.log(e);
            fs.mkdirSync(outputFullPath);
          }
          // read header line
          var parts = line.split('\t');
          num_ims = parseInt(parts[0]);
          outputFile = outputFullPath + '/' + parts[1];
          urls = [parts[2]];
        } else {
          // read mirrors
          urls.push(line);
          num_ims = num_ims - 1;
        }
      })
      .on('error', reject)
      .on('end', resolve);

    });

    return promise;
  }

}

var main = function(){
  var imageDownloader = new ImageDownloader();
  var promise = imageDownloader.download();

  promise.then(function() {
    console.log('all done!');
  });
}

if (require.main === module) {
  main();
}
