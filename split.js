'use strict';

var fs = require('graceful-fs');
var _ = require('underscore');

function ImageSplit() {
  var self = this;

  // function exports
  self.split = split;

  // private variables
  var inputDir = '/Data/Projects/faces/download/annochecked';
  var outputFile = '/Data/Projects/faces/download/split_<SET>.txt';

  ////////

  function split() {

    var outputStreamTrain = fs.createWriteStream(outputFile.replace('<SET>', 'train'));
    var outputStreamTest = fs.createWriteStream(outputFile.replace('<SET>', 'test'));

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

          return splitSubdir_(subpath, subdir, outputStreamTrain, outputStreamTest);
        } else {
          return Promise.resolve();
        }

      });
    }, Promise.resolve())
    .then(function() {
      console.log('Closing file');
      outputStreamTrain.end();
      outputStreamTest.end();
    });

    return promise;

  }

  function splitSubdir_(subpath, subdir, outputStreamTrain, outputStreamTest) {

    var train_prop = 0.9;
    var test_prop = 0.1;

    var promise = new Promise(function(resolve, reject) {
      fs.readdir(subpath, function(err, files) {
        if (err) return reject(err);

        files = files.filter(function(x) {
          return (x.substring(x.length-4) == '.jpg');
        });

        var count = files.length;
        var minCount = 2;
        var testCount = Math.max(Math.floor(count*test_prop), minCount);
        var trainCount = count - testCount;
        if (trainCount < minCount) throw new Error('too few images');
        if ((testCount == minCount) && (trainCount > minCount)) {
          trainCount -= 1;
          testCount += 1;
        }
        console.log('trainCount: ' + trainCount + ', testCount: ' + testCount);

        var randIdxs = _.shuffle(_.range(files.length));

        var trainIdxs = randIdxs.slice(0, trainCount);
        var testIdxs = randIdxs.slice(trainCount);

        trainIdxs.forEach(function(idx) {
          var filepath = subpath + '/' + files[idx];
          var line = filepath + '\t' + subdir + '\n';
          outputStreamTrain.write(line);
        });
        testIdxs.forEach(function(idx) {
          var filepath = subpath + '/' + files[idx];
          var line = filepath + '\t' + subdir + '\n';
          outputStreamTest.write(line);
        });

        resolve();
      });
    });
    return promise;
  }

}

var main = function(){
  var imageSplit = new ImageSplit();
  var promise = imageSplit.split();

  promise.then(function() {
    console.log('all done!');
  }).catch(function(err) {
    console.log(err);
  });
}

if (require.main === module) {
  main();
}
