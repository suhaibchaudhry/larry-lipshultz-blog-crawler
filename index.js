#!/usr/bin/env node
var Nightmare = require('nightmare');
var vo = require('vo');

vo(run)(function(err, result) {
  if (err) throw err;
});

function *run() {
  redirected = false;
  var perpage = 10;
  var nightmare = Nightmare();
  var i = 1;
	var j = 0;
  var lastPage;
  var item;
  var items = [];
  var lastPage = false;
  var firstPage = true;
  var indexPage = "http://www.larrylipshultz.com/blog?page=7";
  yield nightmare
  .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
  .goto(indexPage)
  .wait();

  yield nightmare.on('did-get-redirect-request', function(h) {
    redirected = true;
  });

  while(i <= perpage) {
    redirected = false;
    if(i == 1) {
      //Reset number of items per page.
      perpage = yield nightmare.wait('#post_list').evaluate(function() {
          return $('#post_list .post').length;
      });
    }

    yield nightmare
    //Wait for index page to load.
    .wait('.pagination')
    //Click read more button of current post.
    .click('#post_list .post:nth-child('+(((i-1)*2)+6)+') .meta.last-child a')/*.wait('h1.ng-binding')*/
    .wait(1000);
    //console.log(redirected);
    //Extract Fields.
    if(redirected) {
      //Get summary if page is broken due to redirect.
      item  = yield nightmare.back().wait('.pagination').evaluate(function(i) {
        var item = {};
        var $post = $('#post_list .post:nth-child('+(((i-1)*2)+6)+')');
        item['title'] =  $post.find('h2.title').text();
        item['tags'] = $post.find('.info a').map(function() {return $(this).text()}).toArray().join(',');
        //Remove all tags
        $post.find('.info a').remove();
        //Tokenize Remaining Info
        var info = $post.find('.info').text().split(/\W{2,}by\W*|\W{4,}/);
        item['author'] = info[1];
        //Convert time to unix time stamp and Bump up created time to 12 PM.
        item['created'] = Math.floor(new Date(info[0]).getTime()/1000)+(12*60*60);
        item['body'] = $post.find('.body').html();
        item['path'] = $post.find('h2.title a').attr('href').substr(1);
        return item;
      }, i);
      //console.log(item);
    } else {
      //Wait for third breadcrumb to be available, suggesting inside page has loaded.
      item = yield nightmare.wait('#breadcrumb li:nth-child(3)').evaluate(function() {
        var item = {};
        item['title'] = $('.headline').text();
        item['tags'] = $('.info a').map(function() {return $(this).text()}).toArray().join(',');
        //Remove all tags
        $('.info a').remove();
        //Tokenize Remaining Info
        var info = $('.info').text().split(/\W{2,}by\W*|\W{4,}/);
        item['author'] = info[1];
        //Convert time to unix time stamp and Bump up created time to 12 PM.
        item['created'] = Math.floor(new Date(info[0]).getTime()/1000)+(12*60*60);
        item['body'] = $('.body').html();
        item['path'] = window.location.pathname.substr(1);
        return item;
      });
      yield nightmare.back().wait('.pagination');
    }
    items.push(item);

    //On last item.
    if(i == perpage) {
      console.log(toCsv(items, firstPage));
      items = [];
      //Figure out if we are on the last page.
      lastPage = yield nightmare.evaluate(function() {
        return !Boolean($('.pagination .next a').length);
      });

      if(lastPage) {
        console.log("Total Posts: "+j);
      } else {
        //Reset for next page and go.
        i = 0;
        firstPage = false;
        yield nightmare.click('.pagination .next a');
      }
    }
    i++;
    j++;
  }

  yield nightmare.end();
}

/**
* Converts a value to a string appropriate for entry into a CSV table.  E.g., a string value will be surrounded by quotes.
* @param {string|number|object} theValue
* @param {string} sDelimiter The string delimiter.  Defaults to a double quote (") if omitted.
*/
function toCsvValue(theValue, sDelimiter) {
	var t = typeof (theValue), output;

	if (typeof (sDelimiter) === "undefined" || sDelimiter === null) {
		sDelimiter = '"';
	}

	if (t === "undefined" || t === null) {
		output = "";
	} else if (t === "string") {
		output = sDelimiter + theValue.replace(/\"/g, '""').replace(/^\s+/g, '').replace(/\n\s+/g, "\n") + sDelimiter;
	} else {
		output = String(theValue);
	}

	return output;
}

/**
* Converts an array of objects (with identical schemas) into a CSV table.
* @param {Array} objArray An array of objects.  Each object in the array must have the same property list.
* @param {string} sDelimiter The string delimiter.  Defaults to a double quote (") if omitted.
* @param {string} cDelimiter The column delimiter.  Defaults to a comma (,) if omitted.
* @return {string} The CSV equivalent of objArray.
*/
function toCsv(objArray, header, sDelimiter, cDelimiter) {
	var i, l, names = [], name, value, obj, row, output = "", n, nl;

	// Initialize default parameters.
	if (typeof (sDelimiter) === "undefined" || sDelimiter === null) {
		sDelimiter = '"';
	}
	if (typeof (cDelimiter) === "undefined" || cDelimiter === null) {
		cDelimiter = ",";
	}

  if (typeof (header) === "undefined" || header === null) {
		header = false;
	}

	for (i = 0, l = objArray.length; i < l; i += 1) {
		// Get the names of the properties.
		obj = objArray[i];
		row = "";
		if (i === 0) {
			// Loop through the names
			for (name in obj) {
				if (obj.hasOwnProperty(name)) {
					names.push(name);
					row += [sDelimiter, name, sDelimiter, cDelimiter].join("");
				}
			}
			row = row.substring(0, row.length - 1);
      if(header) {
			     output += row+"\n";
      }
		}

		row = "";
		for (n = 0, nl = names.length; n < nl; n += 1) {
			name = names[n];
			value = obj[name];
			if (n > 0) {
				row += ","
			}
			row += toCsvValue(value, '"');
		}
		output += row;
    if(i != l-1) {
      output += "\n";
    }
	}

	return output;
}
