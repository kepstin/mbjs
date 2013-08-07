var templateOptions = {
	more_formatters: {
		'link': formatLink,
		'artist-link': formatArtistLink,
		'release-link': formatReleaseLink,
		'release-group-link': formatReleaseGroupLink,
		'label-link': formatLabelLink,
		'artist-credit': formatArtistCredit,
		'release-tile': formatReleaseTile,
		'release-group-tile': formatReleaseGroupTile,
		'medium-count': formatMediumCount,
		'track-count': formatTrackCount,
		'recording-time': formatRecordingTime,
	}
};

var linkTemplate = jsontemplate.Template('<a href="{url|htmltag}"{.section title} title="{@|htmltag}"{.end}>{text|html}</a>');
function formatLink(link) {	return linkTemplate.expand(link); }
function formatArtistLink(a) { return linkTemplate.expand({ url: '?artist=' + a['id'], title: a['sort-name'], text: a['name'] }); }
function formatReleaseLink(r) { return linkTemplate.expand({ url: '?release=' + r['id'], text: r['title'] }); }
function formatReleaseGroupLink(rg) { return linkTemplate.expand({ url: '?release-group=' + rg['id'], text: rg['title'] }); }
function formatLabelLink(l) { return linkTemplate.expand({ url: '?label=' + l['id'], title: l['sort-name'], text: l['name'] }); }

function formatRecordingTime(t) {
	t = t / 1000
	var seconds = Math.round(t) % 60;
	var minutes = Math.floor(t / 60) % 60;
	var hours = Math.floor(t / 60 / 60);
	if (minutes > 0 && seconds < 10) { seconds = '0' + seconds }
	if (hours > 0 && minutes < 10) { minutes = '0' + minutes }
	return (hours > 0 ? hours + ':' : '') + minutes + ':' + seconds;
}

var artistCreditTemplate = jsontemplate.Template(
	'{.repeated section @}' +
		'<a href="?artist={artist.id|htmltag}">{.section name}{@|html}{.or}{artist.name|html}{.end}</a>' +
		'{.section joinphrase}' +
			'{@|html}' +
		'{.end}' +
	'{.end}',
	templateOptions);
function formatArtistCredit(ac) { return artistCreditTemplate.expand(ac); }

var releaseTemplate = jsontemplate.Template(
	'<div class="row">' +
		'<div class="twelve columns">' +
			'<ul class="breadcrumbs">' +
				'<li>' +
					'{release-group.artist-credit|artist-credit}' +
				'</li>' +
				'<li>' +
					'{release-group|release-group-link}' +
				'</li>' +
				'<li class="current">' +
					'{@|release-link}' +
				'</li>' +
			'</ul>' +
		'</div>' +
	'</div>' +
	'<header class="row">' +
		'<div class="nine columns">' +
			'<h1>' +
				'{@|release-link}' +
				'{.section disambiguation}' +
					' <small>({@|html})</small>' +
				'{.end}' +
				'<br>' +
				'<small>' +
					'{artist-credit|artist-credit}' +
				'</small>' +
			'</h1>' +
			'{@|medium-count}, ' +
			'{@|track-count} tracks, ' +
			'{.section date}{@|html}, {.end}' +
			'{.section country}{@|html}{.end}<br>' +
			'{.repeated section label-info} ' +
				'{.section label}' +
					'{@|label-link}' +
				'{.end} – ' +
				'{.section catalog-number}' +
					'{@|html}' +
				'{.end}' +
			'{.alternates with}' +
				'<br>' +
			'{.end}' +
			'{.section barcode}' +
				'<br>{@|html}' +
			'{.end}' +
			'{.section annotation}' +
				'<p>{@|html}</p>' +
			'{.end}' +
		'</div>' +
		'<div class="three columns">' +
			'<div class="cover-art">' +
				'<img src="http://coverartarchive.org/release/{id}/front-250" onerror="coverArtMissing(this);" alt="">' +
			'</div>' +
		'</div>' +

	'</header>' +
	'{.repeated section media}' +
		'<div class="row">' +
			'<h3>' +
				'{.section format}{@|html}{.or}Medium{.end} {number}' +
				'{.section title}' +
					': {@|html}' +
				'{.end}' +
			'</h3>' +
			'<div class="tracklist">' +
				'<div class="tracklist_header row">' +
					'<div class="six columns offset-by-one track_name">Track</div>' +
					'<div class="five columns credits">Credits</div>' +
				'</div>' +
				'{.repeated section tracks}' +
					'<div class="track row">' +
						'<div class="one column track_number">{.section number}{@|html}{.end}</div>' +
						'<div class="five columns track_name">' +
							'<a href="?recording={recording.id|htmltag}">{title}</a>' +
							'{.section recording}{.section disambiguation} <small>({@|html})</small>{.end}{.end}' +
							'<br>— {artist-credit|artist-credit}' +
						'</div>' +
						'<div class="one column track_length">{.section length}{@|recording-time}{.end}</div>' +
						'<div class="five columns credits"></div>' +
					'</div>' +
					
				'{.end}' +
			'</div>' +
		'</div>' +
	'{.end}' +
	'{.repeated section text}' +
		'<p>{@|html}</p>' +
	'{.end}',
	templateOptions
);

function formatMediumCount(r) {
	var media_count = {};
	
	r['media'].forEach(function (medium) {
		if (!media_count[medium['format']]) {
			media_count[medium['format']] = 1;
		} else {
			media_count[medium['format']]++;
		}
	});
	
	var medium_types = Object.keys(media_count);
	medium_types.sort;
	
	var media = [];
	medium_types.forEach(function (medium) {
		media.push(
			(media_count[medium] > 1 ? media_count[medium] + '×' : '') + medium
		);
	});
	
	return media.join(' + ');
}

function formatTrackCount(r) {
	var tracks = [];
	var totalTracks = 0;
	
	r['media'].forEach(function (medium) {
		tracks.push(medium['track-count']);
		totalTracks += medium['track-count'];
	});
	
	if (tracks.length > 4) {
		return totalTracks;
	} else {
		return tracks.join(' + ');
	}
}

var releaseTileTemplate = jsontemplate.Template(
	'<div class="row release-tile">' +
		'<div class="three mobile-one columns">' +
			'<div class="cover-art">' +
				'<img src="http://coverartarchive.org/release/{id}/front-250" onerror="coverArtMissing(this);" alt="">' +
			'</div>' +
		'</div>' +
		'<div class="nine mobile-three columns">' +
			'<h3>' +
				'{@|release-link}' +
				'{.section disambiguation}' +
					' <small>({@|html})</small>' +
				'{.end}' +
			'</h3>' +
			'<h4>' +
				'{artist-credit|artist-credit}' +
			'</h4>' +
			'<p>' +
				'{@|medium-count}, ' +
				'{@|track-count} tracks, ' +
				'{.section date}{@|html}, {.end}' +
				'{.section country}{@|html}{.end}<br>' +
				'{.repeated section label-info} ' +
					'{.section label}' +
						'{@|label-link}' +
					'{.end} – ' +
					'{.section catalog-number}' +
						'{@|html}' +
					'{.end}' +
				'{.alternates with}' +
					'<br>' +
				'{.end}' +
				'{.section barcode}' +
					'<br>{@|html}' +
				'{.end}' +
			'</p>' +
		'</div>' +
	'</div>',
templateOptions);
function formatReleaseTile(r) { return releaseTileTemplate.expand(r); }

var releaseGroupTileTemplate = jsontemplate.Template(
	'<div class="row release-group-tile">' +
		'<div class="three mobile-one columns">' +
			'<div class="cover-art">' +
				'<img src="http://coverartarchive.org/release-group/{id}/front-250" onerror="coverArtMissing(this);" alt="">' +
			'</div>' +
		'</div>' +
		'<div class="nine mobile-three columns">' +
			'<h3>' +
				'{@|release-group-link}' +
				'{.section disambiguation}' +
					' <small>({@|html})</small>' +
				'{.end}' +
				'{.section primary-type}' +
					' <span class="label">' +
						'{@|html}' +
					'</span>' +
				'{.end}' +
				'{.repeated section secondary-types}' +
					' <span class="secondary label">' +
						'{@|html}' +
					'</span>' +
				'{.end}' +
			'</h3>' +
			'<h4>' +
				'{artist-credit|artist-credit}' +
			'</h4>' +
			/*'<p>' +
				'{.section first-release-date}' +
					'{@|html}' +
				'{.end}' +
			'</p>' +*/
		'</div>' +
	'</div>',
	templateOptions
);
function formatReleaseGroupTile(r) { return releaseGroupTileTemplate.expand(r); }

var artistTemplate = jsontemplate.Template(
	'<header class="row">' +
		'{.section image}' +
			'<div class="nine mobile-three columns">' +
		'{.or}' +
			'<div class="twelve columns">' +
		'{.end}' +
			'<h1>' +
				'{@|artist-link}' +
			'</h1>' +
			'<p>' +
				'{.section type}' +
					'{type|html}' +
				'{.or}' +
					'Unknown' +
				'{.end}' +
				'{.section gender}' +
					', {@|html}' +
				'{.end}' +
				'{.section country}' +
					', {@|html}' +
				'{.end}' +
				'{.section life-span}' +
					', ' +
					'{.section begin}' +
						'{@|html}' +
					'{.end}' +
					'–' +
					'{.section end}' +
						'{@|html}' +
					'{.or}' +
						'{.section ended}' +
							'?' +
						'{.end}' +
					'{.end}' +
				'{.end}' +
			'</p>' +
			'{.section twitter}' +
				'<a href="https://twitter.com/{@|htmltag}" class="twitter-follow-button" data-show-count="true" data-dnt="true">Follow @{@|html}</a>' +
			'{.end}' +
			'{.section facebook}' +
				'<div class="fb-subscribe" data-show-faces="false" data-href="{@|htmltag}"></div>' +
			'{.end}' +
			'{.section gplus}' +
				'<div class="g-plus" data-height="69" data-href="{@|htmltag}"></div>' +
			'{.end}' +
			'{.section wikipedia}' +
				'{@}' +
			'{.end}' +
			'{.section annotation}' +
				'<p>{@|html}</p>' +
			'{.end}' +
			'<div class="credits">' +
				'{.section band-members}' +
					'<div class="credit">' +
						'<b>Members:</b> ' +
						'{.repeated section artists}' +
							'{@|artist-link}' +
						'{.alternates with}' +
							', ' +
						'{.end}' +
					'</div>' +
				'{.end}' +
				'{.section member-of}' +
					'<div class="credit">' +
						'<b>Member of:</b> ' +
						'{.repeated section artists}' +
							'{@|artist-link}' +
						'{.alternates with}' +
							', ' +
						'{.end}' +
					'</div>' +
				'{.end}' +
				'{.section voiced-by}' +
					'<p><b>Voiced by:</b> ' +
					'{.repeated section artists}' +
						'{@|artist-link}' +
					'{.alternates with}' +
						', ' +
					'{.end}' +
					'</p>' +
				'{.end}' +
				'{.section voice-of}' +
					'<p><b>Voice of:</b> ' +
					'{.repeated section artists}' +
						'{@|artist-link}' +
					'{.alternates with}' +
						', ' +
					'{.end}' +
					'</p>' +
				'{.end}' +
				'{.section legal-name}' +
					'<p><b>Legal name:</b> ' +
					'{.repeated section artists}' +
						'{@|artist-link}' +
					'{.alternates with}' +
						', ' +
					'{.end}' +
					'</p>' +
				'{.end}' +
				'{.section performs-as}' +
					'<p><b>Performs as:</b> ' +
					'{.repeated section artists}' +
						'{@|artist-link}' +
					'{.alternates with}' +
						', ' +
					'{.end}' +
					'</p>' +
				'{.end}' +
			'</div>' +
		'</div>' +
		'{.section image}' +
			'<div class="three mobile-one columns">' +
				'<div class="artist-image">' +
					'<img src="{image|htmltag}" alt="">' +
				'</div>' +
			'</div>' +
		'{.end}' +
	'</header>' +
	'<div class="row">' +
		'<div class="twelve columns">' +
			'<ul class="block-grid two-up mobile">' +
				'{.repeated section release-groups}' +
					'<li>' +
						'{@|release-group-tile}' +
					'</li>' +
				'{.end}' +
			'</ul>' +
		'</div>' +
	'</div>',
templateOptions);

var wikiLinkTemplate = jsontemplate.Template(
	'<p class="text-right"><small>' +
		'Text from <a href="{link}">Wikipedia</a>, used under the terms of the ' +
		'<a href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> license.' +
	'</small></p>',
templateOptions);

var releaseGroupTemplate = jsontemplate.Template(
	'<div class="row">' +
		'<div class="twelve columns">' +
			'<ul class="breadcrumbs">' +
				'<li>' +
					'{artist-credit|artist-credit}' +
				'</li>' +
				'<li class="current">' +
					'{@|release-group-link}' +
				'</li>' +
			'</ul>' +
		'</div>' +
	'</div>' +
	'<header class="row">' +
		'<div class="nine columns">' +
			'<h1>' +
				'{@|release-group-link}' +
				'{.section disambiguation}' +
					' <small>({@|html})</small>' +
				'{.end}' +
				'{.section primary-type}' +
					' <span class="label">' +
						'{@|html}' +
					'</span>' +
				'{.end}' +
				'{.repeated section secondary-types}' +
					' <span class="secondary label">' +
						'{@|html}' +
					'</span>' +
				'{.end}' +
				'<br>' +
				'<small>' +
					'{artist-credit|artist-credit}' +
				'</small>' +
			'</h2>' +
			'{.section wikipedia}' +
				'{@}' +
			'{.end}' +
			'{.section annotation}' +
				'<p>{@|html}</p>' +
			'{.end}' +
		'</div>' +
		'<div class="three columns">' +
			'<div class="cover-art">' +
				'<img src="http://coverartarchive.org/release-group/{id}/front-250" onerror="coverArtMissing(this);" alt="">' +
			'</div>' +
		'</div>' +
	'</header>' +
	'<div class="row">' +
		'<div class="twelve columns">' +
			'<ul class="block-grid two-up">' +
				'{.repeated section releases}' +
					'<li>' +
						'{@|release-tile}' +
					'</li>' +
				'{.end}' +
			'</ul>' +
		'</div>' +
	'</div>',
templateOptions);

var layoutTemplate = jsontemplate.Template(
	'<nav class="top-bar">' +
		'<ul>' +
			'<li class="name">' +
				'<h1><a href="">MB JS Demo</a></h1>' +
			'</li>' +
		'</ul>' +
	'</nav>' +
	'{body|raw}' +
	'<footer class="row">' +
		'<div class="twelve columns">' +
			'<p>This is an experimental page, using Javascript and the MusicBrainz JSON webservice to render pages. It is not associated with the official <a href="http://musicbrainz.org">MusicBrainz</a> site.</p>' +
		'</div>' +
	'</footer>'
);

var indexTemplate = jsontemplate.Template(
	'<div class="row">' +
		'<div class="twelve columns">' +
			'<header id="page-header" class="page-header">' +
			'<h1>Magic Javascript MusicBrainz site thing.</h1>' +
			'</header>' +
			'<p>This page exists as a tech demo. It will load pages from the MusicBrainz webservice, then format them into page templates in Javascript. The idea is to see how much you can do nowadays with a “static” HTML page by itself.</p>' +
			'<p>Try adding a “?release-group=mbid” or “?release=mbid” query parameter. Or <a href="?release-group=d288b7b2-5f6b-4343-ab51-2a8c754ee02a">follow this link</a> or <a href="?release=bef90838-a09d-4853-ae85-6314d3ab5a4b">this link</a>, for an example.</p>' +
		'</div>' +
	'</div>'
);

var errorTemplate = jsontemplate.Template(
	'<div class="row">' +
		'{.section header}' +
			'<div id="page-header" class="page-header">' +
				'<h1>{@|html}</h1>' +
			'</div>' +
		"{.end}" +
		"{.section text}" +
			"{.repeated section @}" +
				"<p>{@|html}</p>" +
			"{.end}" +
		"{.end}" +
		'<a href="">Return to index page</a>' +
	'</div>'
);
