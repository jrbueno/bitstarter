#!/usr/bin/env node
/*
 * Automatically grade files for the presence of specified HTML tags/attributes.
 * uses commander.js and cheerio. Teaches command line application developement
 * and basic DOM parsing.
 *
 * References:
 * 
 * + cheerio
 *  https://github.com/MatthewMueller/cheerio
 *  https://encosia.com/cheerio-faster-windows-friendly-alternatice-jsdom/
 *  http://maxogden.com/scraping-with-node.html
 *
 * + commander.js
 *  https://github.com/visionmedia/commander.js
 *  http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy
 * + JSON
 *  http://en.wikipedia.org/wiki/JSON
 *  https://developer.mozilla.org/en-US/docs/JSON
 *  https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 *
 * + restler
 *  http://github.com/danwrong/restler
 *
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile){
  var instr = infile.toString();
  if(!fs.existsSync(instr)){
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1); //http://nodejs.org/api/process.html#process_process_exit_code
  }
  return instr;
};

var cheerioHtmlFile = function(htmlfile){
  var filedata = fs.readFileSync(htmlfile);
  return loadCheerio(filedata);
};

var loadCheerio = function(data){
  return cheerio.load(data);
};

var loadChecks = function(checksfile){
  return JSON.parse(fs.readFileSync(checksfile));
};

var grabHtml = function(url){
  return url;
};

var checkUrl = function(url, checksfile){
  var htmldata; 
  return rest.get(url).on('complete', function(result) {
    if (result instanceof Error) {
      console.error('Error:' + result.message);
    } else {
      $ = loadCheerio(result);
      displayChecks(runChecks(checksfile));
    }
  });
};

var checkHtmlFile = function(htmlfile, checksfile){
  $ = cheerioHtmlFile(htmlfile);
  return runChecks(checksfile);
};

var runChecks = function(checksfile){
  //$ = cheerioHtmlFile(htmlfile);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for(var ii in checks){
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var displayChecks = function(checksJson){
  var outJson = JSON.stringify(checksJson,null,4);
  console.log(outJson);
};

var clone = function(fn){
  // Workaround for commander.js issue
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

if(require.main == module){
  program.option('-c, --checks <checks_file>', 'Path to checks.json',clone(assertFileExists),CHECKSFILE_DEFAULT)
  .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
  .option('-u, --url <url to check>', 'URL to do checks on', clone(grabHtml))
  .parse(process.argv);

  var checkJson;
  if (program.file && program.url){
    console.error("Unable to process both a file and a URL options, choose one!\nPlease use --help")
  } else { 
    if(program.file){
      checkJson = checkHtmlFile(program.file, program.checks);
      displayChecks(checkJson);
    };
    if(program.url){
      checkJson = checkUrl(program.url, program.checks);
    }; 
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
  exports.checkUrl = checkUrl;
}
