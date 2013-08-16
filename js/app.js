var rl = new RateLimiter();
var wsAddr = 'http://mbjs.kepstin.ca/ws/2';

function loadingScreen() {
	$('#body').html('<h1>Loading from MusicBrainz webservice…</h1>');
}

function webserviceError(jqXHR) {
	var error = {
		'header': 'Error ' + jqXHR.status,
		'text': [
			'The MusicBrainz webservice returned the following messages:'
		]
	};
	if (jqXHR.responseText) {
		error['text'].push(jqXHR.responseText);
	}
	$('body').html(layoutTemplate.expand({
		body: errorTemplate.expand(error)
	}));
	fixupLinks();
}

function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
}

function getWikiText(o, callback) {
	if (!o['relations']) {
		callback('');
		return;
	}
	
	var wikiLink;
	for (var i = 0; i < o['relations'].length; ++i) {
		if (o['relations'][i]['type'] == 'wikipedia') {
			wikiLink = parseURL(o['relations'][i]['url']['resource']);
			break;
		}
	}
	if (!wikiLink) {
		callback('');
		return;
	}
	
	console.log(wikiLink);
	// OK, lets fetch the article text from the wikipedia API...
	$.get('http://' + wikiLink['host'] + '/w/api.php', {
		action:  'parse',
		prop:    'text',
		format:  'json',
		/* section: 0, */
		page:     decodeURIComponent(wikiLink['path'].slice(6)),
	}, function (data) {
		console.log(data);
		
		var wikipage = document.createElement('div');
		if (!data['parse']) {
			callback('');
			return;
		}
		wikipage.innerHTML = data['parse']['text']['*'];
		console.log(wikipage);
		
		var summary;
		for (var i = 0; i < wikipage.childNodes.length; ++i) {
			if (wikipage.childNodes.item(i).localName == 'p') {
				summary = wikipage.childNodes.item(i);
				break;
			}
		}
		
		if (!summary) {
			callback('');
			return;
		}
				
		var links = summary.getElementsByTagName('a');
		for (var i = 0; i < links.length; ++i) {
			links[i].href = links[i].href.replace(document.documentURI, wikiLink.source);
			links[i].host = wikiLink.host;
		}
		
		callback(summary.outerHTML /*+ wikiLinkTemplate.expand({link: wikiLink.source})*/);
	}, 'jsonp');
}

function coverArtMissing(image) {
	image.onerror = "";
	image.src = "http://mbjs.kepstin.ca/images/missingart.png";
}

function releaseOrder(a, b) {
	if (!a['date']) {
		if (!b['date']) {
			return 0;
		} else {
			return 1;
		}
	} else {
		if (!b['date']) {
			return -1;
		}
	}
	if (a['date'] < b['date']) {
		return -1;
	} else if (a['date'] > b['date']) {
		return 1;
	} else {
		return 0;
	}
}

function loadArtist(mbid) {
	loadingScreen();
	rl.queue(function() {
		$.get(wsAddr + '/artist/' + mbid, {
			fmt: 'json',
			inc: 'url-rels+artist-rels+annotation',
		}, function (artist) {
			
			var bandmembers = [];
			var memberof = [];
			var legalname = [];
			var performsas = [];
			var voicedby = [];
			var voiceof = [];
			for (var i = 0; i < artist['relations'].length; ++i) {
				if (artist['relations'][i]['type'] == 'member of band') {
					if (artist['relations'][i]['direction'] == 'backward') {
						bandmembers.push(artist['relations'][i]['artist']);
					} else {
						memberof.push(artist['relations'][i]['artist']);
					}
				} else if (artist['relations'][i]['type'] == 'voice actor') {
					if (artist['relations'][i]['direction'] == 'backward') {
						voicedby.push(artist['relations'][i]['artist']);
					} else {
						voiceof.push(artist['relations'][i]['artist']);
					}
				} else if (artist['relations'][i]['type'] == 'is person') {
					if (artist['relations'][i]['direction'] == 'backward') {
						legalname.push(artist['relations'][i]['artist']);
					} else {
						performsas.push(artist['relations'][i]['artist']);
					}
				} else if (artist['relations'][i]['type'] == 'microblog') {
					var url = artist['relations'][i]['url']['resource'];
					var twitter_match = /^http:\/\/twitter\.com\/(.*)/.exec(url)
					if (twitter_match) {
						artist['twitter']  = twitter_match[1];
					}
				} else if (artist['relations'][i]['type'] == 'social network') {
					var url = artist['relations'][i]['url']['resource'];
					var fb_match = /^http:\/\/www\.facebook\.com/.exec(url);
					var gplus_match = /^https:\/\/plus.google.com/.exec(url);
					if (fb_match) {
						artist['facebook'] = url;
					} else if (gplus_match) {
						artist['gplus'] = url;
					}
				} else if (artist['relations'][i]['type'] == 'image') {
					artist['image'] = artist['relations'][i]['url']['resource'];
				}
			}
			if (bandmembers.length > 0) {
				artist['band-members'] = {artists: bandmembers};
			}
			if (memberof.length > 0) {
				artist['member-of'] = {artists: memberof};
			}
			if (voicedby.length > 0) {
				artist['voiced-by'] = {artists: voicedby};
			}
			if (voiceof.length > 0) {
				artist['voice-of'] = {artists: voiceof};
			}
			if (legalname.length > 0) {
				artist['legal-name'] = {artists: legalname};
			}
			if (performsas.length > 0) {
				artist['performs-as'] = {artists: performsas};
			}

			console.log(artist);
			
			getWikiText(artist, function (wikiText) {
				artist['wikipedia'] = wikiText;
				
				rl.queue(function() {
					$.get(wsAddr + '/release-group', {
						artist: artist['id'],
						inc:    'artist-credits',
						limit:  100,
						offset: 0,
						fmt:    'json',
					}, function (data) {
						console.log(data);

						artist['release-groups'] = data['release-groups'];
						artist['release-groups'].sort(function (a,b) {
							if (!a['first-release-date']) {
								if (!b['first-release-date']) {
									return 0;
								} else {
									return 1;
								}
							} else {
								if (!b['first-release-date']) {
									return -1;
								}
							}
							if (a['first-release-date'] < b['first-release-date']) {
								return -1;
							} else if (a['first-release-date'] > b['first-release-date']) {
								return 1;
							} else {
								return 0;
							}
						});
						$('body').html(layoutTemplate.expand({
							body: artistTemplate.expand(artist)
						}));
		
						fixupLinks();
					}, 'json').error(webserviceError);
				});
			});
			
		}, 'json').error(webserviceError);
	});
}

function loadRelease(mbid) {
	loadingScreen();
	rl.queue(function() {
		$.get(wsAddr + '/release/' + mbid, {
			inc: 'artist-credits+labels+discids+recordings+release-groups+annotation',
			fmt: 'json'
		}, renderRelease, 'json').error(webserviceError);
	});
}

function renderRelease(release) {
	console.log(release);
	renderLayout(releaseTemplate.expand(release));
}

function loadRecording(mbid) {
	loadingScreen();
	rl.queue(function() {
		$.get(wsAddr + '/recording/' + mbid, {
			inc: 'artist-credits',
			fmt: 'json',
		}, function (recording) { loadRecordingReleases(recording); }, 'json').error(webserviceError);
	});
}

function loadRecordingReleases(recording, limit = 100, offset = 0) {
	rl.queue(function() {
		$.get(wsAddr + '/release', {
			recording: recording['id'],
			inc:       'artist-credits+media+labels',
			limit:     limit,
			offset:    offset,
			fmt:       'json',
		}, function(data) { loadRecordingReleasesPage(recording, data, limit, offset) }, 'json').error(webserviceError);
	});
}

function loadRecordingReleasesPage(recording, data, limit, offset) {
	// First merge the loaded releases into the recording
	if (recording['releases']) {
		recording['releases'] = recording['releases'].concat(data['releases']);
	} else {
		recording['releases'] = data['releases'];
	}

	// Check if we need to load more releases
	if (data['release-count'] > (offset + limit)) {
		loadRecordingReleases(recording, limit, offset + limit);
	} else {
		renderRecording(recording);
	}
}

function renderRecording(recording) {
	recording['releases'] = recording['releases'].filter(function (r) {
		return (r['status'] != "Pseudo-Release");
	});
	recording['releases'].sort(releaseOrder);
	console.log(recording);
	renderLayout(recordingTemplate.expand(recording));
}

function renderLayout(body) {
	$('body').html(layoutTemplate.expand({
		body: body
	}));
	fixupLinks();
}

function loadReleaseGroup(mbid) {
	loadingScreen();
	rl.queue(function() {
		$.get(wsAddr + '/release-group/' + mbid, {
			inc: 'artist-credits+url-rels+annotation',
			fmt: 'json',
		}, function (rg) {
			console.log(rg);
			
			getWikiText(rg, function (wikiText) {
				rg['wikipedia'] = wikiText;
				rl.queue(function() {
					$.get(wsAddr + '/release', {
						'release-group': rg['id'],
						inc:             'artist-credits+media+labels',
						limit:           100,
						offset:          0,
						fmt:             'json',
					}, function (data) {
						console.log(data);
					
						rg['releases'] = data['releases'].filter(function (r) {
							return (r['status'] != "Pseudo-Release");
						});
					
						rg['releases'].sort(releaseOrder);
						$('body').html(layoutTemplate.expand({
							body: releaseGroupTemplate.expand(rg)
						}));
		
						fixupLinks();
					}, 'json').error(webserviceError);
				});
			});
		}, 'json').error(webserviceError);
	});
}

function loadPage(state) {
	console.log(state);
	history.replaceState(state, '', window.location.pathname + state['search']);
	var body;
	if (!state['search']) {
		console.log('loaded index page.');
		body = indexTemplate.expand();
	} else {
		if (state['release']) {
			loadRelease(state['release']);
		} else if (state['release-group']) {
			loadReleaseGroup(state['release-group']);
		} else if (state['artist']) {
			loadArtist(state['artist']);
		} else if (state['recording']) {
			loadRecording(state['recording']);
		} else {
			body = errorTemplate.expand({
				header: 'Error 400',
				text: [
					'I couldn’t understand the query parameters included in the URL: ' + state['search']
				]
			});
		}
		console.log('Loaded page ' + state['search']);
	}
	if (body) {
		$('body').html(layoutTemplate.expand({body: body}));
		fixupLinks();
		// For the time being...
		window.scroll(0,0);
	}
}

function parseState(searchString) {
	var state = {};
	if (searchString.charAt(0) == '?') {
		var params = searchString.slice(1).split('&');
		for (var i = 0; i < params.length; i++) {
			var equals = params[i].indexOf('=');
			state[params[i].slice(0,equals)] = params[i].slice(equals+1);
		}
	}
	state['search'] = searchString;
	return state;
}

function navigatePage(searchString) {
	var state = parseState(searchString);
	history.pushState(state, '', window.location.pathname + searchString);
	loadPage(state);
}

function fixupLinks() {
	$('a').each(function() {
		var href = $(this).attr('href');
		if (href == '') {
			$(this).click(function() {
				navigatePage('');
				return false;
			});
		} else if (href.charAt(0) == '?') {
			$(this).click(function() {
				navigatePage(href);
				return false;
			});
		}
	});
	twttr.widgets.load();
	FB.XFBML.parse();
	gapi.plus.go();
}

/* Generate a history "state" object from current browser state */
function generateState() {
	var path = [];
	var pathname = window.location.pathname;
	/*if (pathname.indexOf(basePath) === 0) {
		pathname = pathname.slice(basePath.length);
	}*/
	var path = pathname.split('/');
	return {
		path: path,
		scrollX: window.scrollX,
		scrollY: window.scrollY
	};
}

$(document).ready(function() {
	console.log(generateState());
	if (window.location.search.charAt(0) == '?') {
		var state = parseState(window.location.search);
		loadPage(state);
	} else {
		loadPage({search: ''});
	}

	window.onpopstate = function(event) {
		if (event.state) {
			loadPage(event.state);
		}
	};
})
