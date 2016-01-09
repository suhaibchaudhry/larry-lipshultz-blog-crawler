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
  var lastPage = false;
  yield nightmare
  .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
  .goto("http://www.larrylipshultz.com/blog")
  .wait();

  while(i <= perpage) {
    if(i == 1) {
      //Reset number of items per page.
      perpage = yield nightmare.wait('#post_list').evaluate(function() {
          return $('#post_list .post').length;
      });
    }

    item = yield nightmare
    //Wait for index page to load.
    .wait('.pagination')
    //Click read more button of current post.
    .click('#post_list .post:nth-child('+(((i-1)*2)+6)+') .meta.last-child a')/*.wait('h1.ng-binding')*/
    .wait(1000)
    //Wait for third breadcrumb to be available, suggesting inside page has loaded.
    .wait('#breadcrumb li:nth-child(3)')
    //Extract Fields.
    .evaluate(function() {
      var item = {};
      item['title'] = $('.headline').text();
      item['tags'] = $('.info a').map(function() {return $(this).text()}).toArray();
      //Remove all tags
      $('.info a').remove();
      //Tokenize Remaining Info
      var info = $('.info').text().split(/\W{2,}by\W*|\W{4,}/);
      item['author'] = info[1];
      //Convert time to unix time stamp and Bump up created time to 12 PM.
      item['created'] = Math.floor(new Date(info[0]).getTime()/1000)+(12*60*60);
      item['body'] = $('.body').html();
      return item;
    });
    yield nightmare.back().wait('.pagination');
    items.push(item);
    console.log(item);
    //On last item.
    if(i == perpage) {
      //Figure out if we are on the last page.
      lastPage = yield nightmare.evaluate(function() {
        return !Boolean($('.pagination .next a').length);
      });

      if(lastPage) {
        console.log("Total Posts: "+j);
      } else {
        //Reset for next page and go.
        i = 0;
        yield nightmare.click('.pagination .next a');
      }
    }
    i++;
    j++;
  }

  yield nightmare.end();
}
