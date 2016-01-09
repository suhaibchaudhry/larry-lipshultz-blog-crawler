#!/usr/bin/env node
var Nightmare = require('nightmare');
var vo = require('vo');

vo(run)(function(err, result) {
  if (err) throw err;
});

function *run() {
	var skipPages = 0;
  var perpage = 10;
  var nightmare = Nightmare();
  var i = 1;
	var j = 0;
  var lastPage;
  var item;
  var items = [];
  yield nightmare
  .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
  .goto("http://www.larrylipshultz.com/blog")
  .wait();

  while(i <= perpage) {
    item = yield nightmare
    //.wait(500).screenshot('scr2.png')
    .wait('.pagination')
    //.wait(500).screenshot('scr3.png')
    .click('#post_list .post:nth-child('+i*6+') .meta.last-child a')/*.wait('h1.ng-binding')*/
    //.wait(500).screenshot('scr4.png')
    .wait(1000)
    .wait('#breadcrumb li:nth-child(3)')
    //.wait(500).screenshot('scr5.png')
    .evaluate(function() {
      var item = {};
      item['body'] = $('.body').html();
      return item;
    });
    yield nightmare.back().wait('.pagination');
    items.push(item);
    console.log(item);
    i++;
  }

  yield nightmare.end();
}
