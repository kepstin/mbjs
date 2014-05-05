var rl = new RateLimiter();
var wsAddr = 'http://mbjs.kepstin.ca/ws/2';
var browseLimit = 100;
var progressWork = 1;
var progress = 0;

function loadingScreen() {
	$('body').html(layoutTemplate.expand({
		body: loadingTemplate.expand()
	}));
	progressWork = 1;
	progress = 0;
	fixupLinks();
}

function loadingProgressAddWork(number) {
	if (number === undefined) {
		number = 1;
	}
	progressWork += number;
	updateLoadingProgress();
}
function loadingProgress(number) {
	if (number === undefined) {
		number = 1;
	}
	progress += number;
	updateLoadingProgress();
}

function updateLoadingProgress() {
	var progressBar = document.getElementById('loading-progress');
	if (!progressBar) {
		console.log('updateLoadingProgress called, but no progress bar!');
		return;
	}
	var progressPercent = progress / progressWork * 100;
	console.log('Progress is ' + progress + ' out of ' + progressWork + '(' + progressPercent + '%)');
	progressBar.style.width = '' + progressPercent + '%';
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
		
		callback(summary.outerHTML + wikiLinkTemplate.expand({link: wikiLink.source}));
	}, 'jsonp');
}

function coverArtMissing(image) {
	image.onerror = "";
	image.src = "http://mbjs.kepstin.ca/images/missingart.png";
}

function groupRelations(entity) {
	if (!entity['relations']) return;

	var groupedRels = new Object();
	for (var i = 0; i < entity['relations'].length; ++i) {
		var rel = entity['relations'][i];
		var entityType = undefined;
		var type_id = rel['type'];
		var direction = rel['direction'];

		if (rel['artist']) entityType = 'artist';
		if (rel['url']) entityType = 'url';
		if (rel['work']) entityType = 'work';
		if (rel['recording']) entityType = 'recording';
		var linkedEntity = rel[entityType];
		if (!entityType) {
			console.log("Couldn't determine entity type for relation:");
			console.log(rel);
			continue;
		}

		if (!groupedRels[entityType])
			groupedRels[entityType] = {};
		if (!groupedRels[entityType][type_id])
			groupedRels[entityType][type_id] = {};
		if (!groupedRels[entityType][type_id][direction]) {
			groupedRels[entityType][type_id][direction] = [rel];
		} else {
			groupedRels[entityType][type_id][direction].push(rel);
		}
		
		groupRelations(linkedEntity);
	}

	entity['groupedRelations'] = groupedRels;
}

function groupReleaseGroupsByYear(entity) {
	releaseGroups = entity['release-groups'];
	groupedReleaseGroups = [];
	releaseGroupGroup = {
		year: undefined
	};
	
	for (var i = 0; i < releaseGroups.length; ++i) {
		rg = releaseGroups[i]
		year = rg['first-release-date'].split('-')[0]
		if (year == '') year = '????';

		if (releaseGroupGroup['year'] != year) {
			releaseGroupGroup = { year: year, releaseGroups: [] }
			groupedReleaseGroups.push(releaseGroupGroup);
		}

		releaseGroupGroup['releaseGroups'].push(rg);
	}

	entity['groupedReleaseGroups'] = groupedReleaseGroups;
}

function groupReleasesByYear(entity) {
	releases = entity['releases'];
	groupedReleases = [];
	releaseGroup = {
		year: undefined
	};

	for (var i = 0; i < releases.length; ++i) {
		var r = releases[i]
		var year = '????';
		if (r['date']) {
			year = r['date'].split('-')[0];
		}
		if (year == '') year = '????';

		if (releaseGroup['year'] != year) {
			releaseGroup = { year: year, releases: [] }
			groupedReleases.push(releaseGroup);
		}

		releaseGroup['releases'].push(r);
	}

	entity['groupedReleases'] = groupedReleases;
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

function releaseGroupOrder(a, b) {
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
}

function loadArtist(mbid) {
	loadingScreen();
	rl.queue(function() {
		$.get(wsAddr + '/artist/' + mbid, {
			fmt: 'json',
			inc: 'url-rels+artist-rels',
		}, loadArtistResult, 'json').error(webserviceError);
	});
}

function loadArtistResult(artist) {
	loadArtistWikipedia(artist);

	// Special-case to skip release group loading on Various Artists
	if (artist['id'] == '89ad4ac3-39f7-470e-963a-56509c546377') {
		artist['loadedReleaseGroups'] = true;
		artist['release-groups'] = [];
		artist['text'] = ["For performance reasons, the release groups for Various Artists are blocked."];
		loadingProgress();
		renderArtist(artist);
	} else {
		loadArtistReleaseGroups(artist);
		loadingProgress();
	}
}

function loadArtistWikipedia(artist) {
	loadingProgressAddWork();
	getWikiText(artist, function (wikiText) {
		artist['wikipedia'] = wikiText;
		artist['loadedWikipedia'] = true;
		loadingProgress();
		renderArtist(artist);
	});
}

function loadArtistReleaseGroups(artist, offset) {
	if (offset === undefined) {
		loadingProgressAddWork();
		offset = 0;
	}
	rl.queue(function() {
		$.get(wsAddr + '/release-group', {
			artist: artist['id'],
			inc:    'artist-credits',
			limit:  browseLimit,
			offset: offset,
			fmt:    'json',
		}, function(data) {
			loadArtistReleaseGroupsPage(artist, data, offset)
		}, 'json').error(webserviceError);
	});
}

function loadArtistReleaseGroupsPage(artist, data, offset) {
	loadingProgress();
	// First merge the loaded release groups into the artist
	if (artist['release-groups']) {
		artist['release-groups'] = artist['release-groups'].concat(data['release-groups']);
	} else {
		artist['release-groups'] = data['release-groups'];
	}
	
	// Add work if there's more pages
	if (offset == 0) {
		var remainingPages = Math.ceil(data['release-group-count'] / browseLimit) - 1;
		loadingProgressAddWork(remainingPages);
	}

	// Check if we need to load more release groups
	if (data['release-group-count'] > (offset + browseLimit)) {
		loadArtistReleaseGroups(artist, offset + browseLimit);
	} else {
		artist['loadedReleaseGroups'] = true;
		renderArtist(artist);
	}
}

function renderArtist(artist) {
	if (!artist['loadedWikipedia']) {
		console.log("renderArtist called, but Wikipedia isn't ready yet");
		return;
	}

	if (!artist['loadedReleaseGroups']) {
		console.log("renderArtist called, but release groups aren't ready yet");
		return;
	}

	groupRelations(artist);

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

	artist['release-groups'].sort(releaseGroupOrder);
	groupReleaseGroupsByYear(artist);

	console.log(artist);
	renderLayout(artistTemplate.expand(artist));
}

function loadRelease(mbid) {
	loadingScreen();
	rl.queue(function() {
		$.get(wsAddr + '/release/' + mbid, {
			inc: 'artist-credits+labels+discids+recordings+release-groups+artist-rels+recording-rels+work-rels+recording-level-rels+work-level-rels',
			fmt: 'json'
		}, renderRelease, 'json').error(webserviceError);
	});
}

function renderRelease(release) {
	groupRelations(release);
	for (var i = 0; i < release['media'].length; ++i) {
		var media = release['media'][i];
		for (var j = 0; j < media['tracks'].length; ++j) {
			var recording = media['tracks'][j]['recording'];
			if (recording) groupRelations(recording);
		}
	}

	console.log(release);
	renderLayout(releaseTemplate.expand(release));
}

function loadRecording(mbid) {
	loadingScreen();
	rl.queue(function() {
		$.get(wsAddr + '/recording/' + mbid, {
			inc: 'artist-credits+artist-rels+work-rels+work-level-rels',
			fmt: 'json',
		}, function (recording) {
			loadRecordingReleases(recording);
		}, 'json').error(webserviceError);
	});
}

function loadRecordingReleases(recording, offset) {
	if (offset === undefined) {
		offset = 0;
	}
	rl.queue(function() {
		$.get(wsAddr + '/release', {
			recording: recording['id'],
			inc:       'artist-credits+media+labels',
			limit:     browseLimit,
			offset:    offset,
			fmt:       'json',
		}, function(data) {
			loadRecordingReleasesPage(recording, data, offset)
		}, 'json').error(webserviceError);
	});
}

function loadRecordingReleasesPage(recording, data, offset) {
	// First merge the loaded releases into the recording
	if (recording['releases']) {
		recording['releases'] = recording['releases'].concat(data['releases']);
	} else {
		recording['releases'] = data['releases'];
	}

	// Check if we need to load more releases
	if (data['release-count'] > (offset + browseLimit)) {
		loadRecordingReleases(recording, offset + browseLimit);
	} else {
		renderRecording(recording);
	}
}

function renderRecording(recording) {
	groupRelations(recording);
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
	window.scroll(0,0);
}

function loadReleaseGroup(mbid) {
	loadingScreen();
	rl.queue(function() {
		$.get(wsAddr + '/release-group/' + mbid, {
			inc: 'artist-credits+url-rels+annotation',
			fmt: 'json',
		}, function (releaseGroup) {
			loadReleaseGroupWikipedia(releaseGroup);
			loadReleaseGroupReleases(releaseGroup);
		}, 'json').error(webserviceError);
	});
}

function loadReleaseGroupWikipedia(releaseGroup) {
	getWikiText(releaseGroup, function (wikiText) {
		releaseGroup['wikipedia'] = wikiText;
		releaseGroup['loadedWikipedia'] = true;
		renderReleaseGroup(releaseGroup);
	});
}

function loadReleaseGroupReleases(releaseGroup, offset) {
	if (offset === undefined) {
		offset = 0;
	}
	rl.queue(function() {
		$.get(wsAddr + '/release', {
			'release-group': releaseGroup['id'],
			inc:             'artist-credits+media+labels',
			limit:           browseLimit,
			offset:          offset,
			fmt:             'json',
		}, function(data) {
			loadReleaseGroupReleasesPage(releaseGroup, data, offset)
		}, 'json').error(webserviceError);
	});
}

function loadReleaseGroupReleasesPage(releaseGroup, data, offset) {
	// First merge the loaded releases into the release group
	if (releaseGroup['releases']) {
		releaseGroup['releases'] = releaseGroup['releases'].concat(data['releases']);
	} else {
		releaseGroup['releases'] = data['releases'];
	}

	// Check if we need to load more releases
	if (data['release-count'] > (offset + browseLimit)) {
		loadReleaseGroupReleases(releaseGroup, offset + browseLimit);
	} else {
		releaseGroup['loadedReleases'] = true;
		renderReleaseGroup(releaseGroup);
	}
}

function renderReleaseGroup(releaseGroup) {
	if (!releaseGroup['loadedWikipedia']) {
		console.log("Called renderReleaseGroup but Wikipedia isn't ready yet");
		return;
	}
	if (!releaseGroup['loadedReleases']) {
		console.log("Called renderReleaseGroup but releases aren't ready yet");
		return;
	}

	
	releaseGroup['releases'] = releaseGroup['releases'].filter(function (r) {
		return (r['status'] != "Pseudo-Release");
	});

	releaseGroup['releases'].sort(releaseOrder);
	console.log(releaseGroup);
	groupReleasesByYear(releaseGroup);

	console.log(releaseGroup);

	renderLayout(releaseGroupTemplate.expand(releaseGroup));
}

function loadWork(mbid) {
	loadingScreen();
	rl.queue(function() {
		$.get(wsAddr + '/work/' + mbid, {
			inc: 'artist-rels+recording-rels+work-rels+url-rels+annotation',
			fmt: 'json',
		}, function (work) {
			loadWorkWikipedia(work);
		}, 'json').error(webserviceError);
	});
}

function loadWorkWikipedia(work) {
	getWikiText(work, function (wikiText) {
		work['wikipedia'] = wikiText;
		work['loadedWikipedia'] = true;
		renderWork(work);
	});
}

function renderWork(work) {
	if (!work['loadedWikipedia']) {
		console.log("Called renderWork but Wikipedia isn't ready yet");
		return;
	}
	
	groupRelations(work);
	
	console.log(work);

	renderLayout(workTemplate.expand(work));
}

function luceneTermEscape(term) {
	return term.replace(/[+!(){}\[\]^"~*:\\\/-]|&&|\|\|/g, "\\$&");
}

function luceneBuildQuery(searchString) {
	var terms = searchString.split(/\s+/);
	var escapedTerms = terms.map(luceneTermEscape);
	var fuzzyTerms = escapedTerms.map(function(term) { return term + "~" });
	return '(' + ' "' + escapedTerms.join(' ') + '" ' + ")^2 OR (" +
		escapedTerms.join(' AND ') + ') OR (' +
		fuzzyTerms.join(' AND ') + ')^0.75' /* OR (' +
		escapedTerms.join(' OR ') + ')^0.5 OR (' +
		fuzzyTerms.join(' OR ') + ')^0.25'*/;
}

function loadSearchArtist(query) {
	var escapedQuery = luceneBuildQuery(query);
	var fullQuery = 'artist:(' +
			escapedQuery + ')^1.0 OR alias:(' +
			escapedQuery + ')^1.0 OR sortname:(' +
			escapedQuery + ')^0.75 OR comment:(' +
			escapedQuery + ')^0.5 OR tag:(' +
			escapedQuery + ')^0.5 OR artistaccent:(' +
			escapedQuery + ')^1.1';
	rl.queue(function() {
		$.get(wsAddr + '/artist', {
			'query': fullQuery,
			fmt:     'json',
		}, function(searchResult) {
			renderSearchArtist(searchResult, query);
		}, 'json').error(webserviceError);
	});
}

function renderSearchArtist(searchResult, originalQuery) {
	searchResult['query'] = originalQuery;

	console.log(searchResult);

	renderLayout(searchArtistTemplate.expand(searchResult));
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
		} else if (state['work']) {
			loadWork(state['work']);
		} else if (state['query'] && state['entity'] == 'artist') {
			loadSearchArtist(decodeURIComponent(state['query'].replace(/\+/g, '%20')));
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
	if (typeof twttr !== 'undefined') {
		twttr.widgets.load();
	}
	if (typeof FB !== 'undefined') {
		FB.XFBML.parse();
	}
	if (typeof gapi !== 'undefined') {
		gapi.plus.go();
	}
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
