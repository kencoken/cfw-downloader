'use strict';

var fs = require('graceful-fs');
var _ = require('underscore');

function ImageSplit() {
  var self = this;

  // function exports
  self.split = split;

  // private variables
  var inputDir = '/data/ken/datasets/msra-cfw/annochecked_nospaces';
  var outputFile = '/data/ken/datasets/msra-cfw/spliti_<SET>.txt';
  var outputClasses = '/data/ken/datasets/msra-cfw/classes.txt';//'';
  var relativePaths = false;
  var delim = ' ';

  ////////

  function split() {

    var outputStreamTrain = fs.createWriteStream(outputFile.replace('<SET>', 'train'));
    var outputStreamTest = fs.createWriteStream(outputFile.replace('<SET>', 'test'));
    if (outputClasses) {
      var outputStreamClasses = fs.createWriteStream(outputClasses);
    }

    var files = fs.readdirSync(inputDir);
    console.log('Scanning files from: ' + inputDir);
    console.log(files.length + ' items to process');

    var classId = -1;

    var promise = files.reduce(function(promise, file) {
      return promise.then(function() {

        var subdir = file;
        var subpath = inputDir + "/" + file;

        var stat = fs.statSync(subpath);

        if (stat && stat.isDirectory()) {
          console.log('Scanning ' + subpath + '...');

          classId += 1;
          return splitSubdir_(subpath, subdir, outputStreamTrain, outputStreamTest,
                              outputStreamClasses, classId, relativePaths, delim);
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

  function splitSubdir_(subpath, subdir, outputStreamTrain, outputStreamTest,
                        outputStreamClasses, classId, relativePaths, delim) {

    var train_prop = 0.9;
    var test_prop = 0.1;

    var promise = new Promise(function(resolve, reject) {
      fs.readdir(subpath, function(err, files) {
        if (err) return reject(err);

        files = files.filter(function(x) {
          return ((x.substring(x.length-4) == '.jpg') &&
                  (x.substring(0, 1) != '.'));
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

        var classLabel = subdir;
        if (outputStreamClasses) {
          if (classId == undefined) throw new Error('Must specify valid class ID');
          classLabel = classId;
        }

        trainIdxs.forEach(function(idx) {
          var filepath = (relativePaths ? subdir : subpath) + '/' + files[idx];
          var line = filepath + delim + classLabel + '\n';
          outputStreamTrain.write(line);
        });
        testIdxs.forEach(function(idx) {
          var filepath = (relativePaths ? subdir : subpath) + '/' + files[idx];
          var line = filepath + delim + classLabel + '\n';
          outputStreamTest.write(line);
        });

        if (outputStreamClasses) {
          var line = subdir + delim + classId + '\n';
          outputStreamClasses.write(line);
        }

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
