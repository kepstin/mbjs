var templateOptions = {
	more_formatters: {
		'link': formatLink,
		'artist-link': formatArtistLink,
		'release-link': formatReleaseLink,
		'release-group-link': formatReleaseGroupLink,
		'label-link': formatLabelLink,
		'recording-link': formatRecordingLink,
		'artist-credit': formatArtistCredit,
		'release-tile': formatReleaseTile,
		'release-group-tile': formatReleaseGroupTile,
		'medium-count': formatMediumCount,
		'track-count': formatTrackCount,
		'recording-time': formatRecordingTime,
		'release-cover-art': formatReleaseCoverArt,
		'relation-name': formatRelationName
	}
};

var linkTemplate = jsontemplate.Template('<a href="{url|htmltag}"{.section title} title="{@|htmltag}"{.end}>{text|html}</a>');
function formatLink(link) {	return linkTemplate.expand(link); }
function formatArtistLink(a) { return linkTemplate.expand({ url: '?artist=' + a['id'], title: a['sort-name'], text: a['name'] }); }
function formatReleaseLink(r) { return linkTemplate.expand({ url: '?release=' + r['id'], text: r['title'] }); }
function formatReleaseGroupLink(rg) { return linkTemplate.expand({ url: '?release-group=' + rg['id'], text: rg['title'] }); }
function formatLabelLink(l) { return linkTemplate.expand({ url: '?label=' + l['id'], title: l['sort-name'], text: l['name'] }); }
function formatRecordingLink(r) { return linkTemplate.expand({ url: '?recording=' + r['id'], text: r['title'] }); }

var coverArtTemplate = jsontemplate.Template(
	'<div class="cover-art">' +
		'<img src="{url}" onerror="coverArtMissing(this);" alt="">' +
	'</div>'
);

function formatReleaseCoverArt(r) {
	coverArtURL = "http://mbjs.kepstin.ca/images/missingart.png";
	if (r['cover-art-archive']) {
		if (r['cover-art-archive']['front']) {
			coverArtURL = "http://coverartarchive.org/release/" + r['id'] + "/front-250";
		}
	} else {
		coverArtURL = "http://coverartarchive.org/release/" + r['id'] + "/front-250";
	}
	return coverArtTemplate.expand({ url: coverArtURL });
}

function formatRecordingTime(t) {
	t = t / 1000
	var seconds = Math.round(t) % 60;
	var minutes = Math.floor(t / 60) % 60;
	var hours = Math.floor(t / 60 / 60);
	if (minutes > 0 && seconds < 10) { seconds = '0' + seconds }
	if (hours > 0 && minutes < 10) { minutes = '0' + minutes }
	return (hours > 0 ? hours + ':' : '') + minutes + ':' + seconds;
}


var relationNames = {
	'75c09861-6857-4ec0-9729-84eefde7fc86': {
		forward: '{additional} {minor} collaborator on',
		reverse: '{additional} {minor} collaborators'
	},
	'e259a3f5-ce8e-45c1-9ef7-90ff7d0c7589': {
		forward: 'voice of',
		reverse: 'voiced by'
	},
	'eb535226-f8ca-499d-9b18-6a144df4ae6f': {
		forward: 'blog'
	}
}
function formatRelationName(rel) {
	return "" + rel;
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
			'{@|release-cover-art}' +
		'</div>' +

	'</header>' +
	'{.repeated section media}' +
		'<h3>' +
			'{.section format}{@|html}{.or}Medium{.end} {position}' +
			'{.section title}' +
				': {@|html}' +
			'{.end}' +
		'</h3>' +
		'<div class="tracklist">' +
			'{.repeated section tracks}' +
				'<div class="track">' +
					'<div class="row">' +
						'<div class="seven columns">' +
							'<div class="row">' +
								'<div class="two mobile-one column track_number">{.section number}{@|html}{.end}</div>' +
								'<div class="eight mobile-two columns track_name">' +
									'{artist-credit|artist-credit} – ' +
									'<a href="?recording={recording.id|htmltag}">{title}</a>' +
									'{.section recording}{.section disambiguation} <small>({@|html})</small>{.end}{.end}' +
								'</div>' +
								'<div class="two mobile-one column track_length">{.section length}{@|recording-time}{.end}</div>' +
							'</div>' +
						'</div>' +
						'<div class="five columns credits"></div>' +
					'</div>' +
				'</div>' +
			'{.end}' +
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
			'{@|release-cover-art}' +
		'</div>' +
		'<div class="nine mobile-three columns">' +
			'<h3>' +
				'{@|release-link}' +
				'{.section disambiguation}' +
					' <small>({@|html})</small>' +
				'{.end}' +
				'<br>' +
				'<small>{artist-credit|artist-credit}</small>' +
			'</h3>' +
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
				'<br>' +
				'<small>' +
					'{artist-credit|artist-credit}' +
				'</small>' +
			'</h3>' +
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
			'<div class="nine columns">' +
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
				'{.section area}' +
					', {name|html}' +
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
		/*	'{.section annotation}' +
				'<p>{@|html}</p>' +
			'{.end}' + */
		'</div>' +
		'{.section image}' +
			'<div class="three columns">' +
				'<div class="artist-image">' +
					'<img src="{image|htmltag}" alt="">' +
				'</div>' +
			'</div>' +
		'{.end}' +
	'</header>' +
	'<p class="credits">' +
		'{.section band-members}' +
			'<b>Members:</b> ' +
			'{.repeated section artists}' +
				'{@|artist-link}' +
			'{.alternates with}' +
				', ' +
			'{.end}' +
			'<br>' +
		'{.end}' +
		'{.section member-of}' +
			'<b>Member of:</b> ' +
			'{.repeated section artists}' +
				'{@|artist-link}' +
			'{.alternates with}' +
				', ' +
			'{.end}' +
			'<br>' +
		'{.end}' +
		'{.section voiced-by}' +
			'<b>Voiced by:</b> ' +
			'{.repeated section artists}' +
				'{@|artist-link}' +
			'{.alternates with}' +
				', ' +
			'{.end}' +
			'<br>' +
		'{.end}' +
		'{.section voice-of}' +
			'<b>Voice of:</b> ' +
			'{.repeated section artists}' +
				'{@|artist-link}' +
			'{.alternates with}' +
				', ' +
			'{.end}' +
			'<br>' +
		'{.end}' +
		'{.section legal-name}' +
			'<b>Legal name:</b> ' +
			'{.repeated section artists}' +
				'{@|artist-link}' +
			'{.alternates with}' +
				', ' +
			'{.end}' +
			'<br>' +
		'{.end}' +
		'{.section performs-as}' +
			'<b>Performs as:</b> ' +
			'{.repeated section artists}' +
				'{@|artist-link}' +
			'{.alternates with}' +
				', ' +
			'{.end}' +
			'<br>' +
		'{.end}' +
	'</p>' +
	'<ul class="block-grid two-up mobile">' +
		'{.repeated section release-groups}' +
			'<li>' +
				'{@|release-group-tile}' +
			'</li>' +
		'{.end}' +
	'</ul>',
	templateOptions);

var wikiLinkTemplate = jsontemplate.Template(
	'<p class="text-right" style="margin-top: 0"><small>' +
		'Text from <a href="{link}">Wikipedia</a>, used under the terms of the ' +
		'<a href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> license.' +
	'</small></p>',
templateOptions);

var releaseGroupTemplate = jsontemplate.Template(
	'<ul class="breadcrumbs">' +
		'<li>' +
			'{artist-credit|artist-credit}' +
		'</li>' +
		'<li class="current">' +
			'{@|release-group-link}' +
		'</li>' +
	'</ul>' +
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
			'</h1>' +
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
	'<ul class="block-grid two-up mobile">' +
		'{.repeated section releases}' +
			'<li>' +
				'{@|release-tile}' +
			'</li>' +
		'{.end}' +
	'</ul>',
	templateOptions);

var recordingTemplate = jsontemplate.Template(
	'<ul class="breadcrumbs">' +
		'<li>' +
			'{artist-credit|artist-credit}' +
		'</li>' +
		'<li class="current">' +
			'{@|recording-link}' +
		'</li>' +
	'</ul>' +
	'<header>' +
		'<h1>' +
			'{@|recording-link}' +
			'{.section disambiguation}' +
				' <small>({@|html})</small>' +
			'{.end}' +
			'<br>' +
			'<small>' +
				'{artist-credit|artist-credit}' +
			'</small>' +
		'</h1>' +
	'</header>' +
	'<ul class="block-grid two-up mobile">' +
		'{.repeated section releases}' +
			'<li>' +
				'{@|release-tile}' +
			'</li>' +
		'{.end}' +
	'</ul>',
	templateOptions
);

var layoutTemplate = jsontemplate.Template(
	'<nav class="top-bar">' +
		'<ul>' +
			'<li class="name">' +
				'<h1><a href="">MB JS Demo</a></h1>' +
			'</li>' +
		'</ul>' +
	'</nav>' +
	'<section class="row">' +
		'<div id="body" class="twelve columns">' +
			'{body|raw}' +
		'</div>' +
	'</section>' +
	'<footer class="row">' +
		'<div class="twelve columns">' +
			'<p>This is an experimental page, using Javascript and the MusicBrainz JSON webservice to render pages. It is not associated with the official <a href="http://musicbrainz.org">MusicBrainz</a> site.</p>' +
			'<p><a href="http://github.com/kepstin/mbjs">Check out the source on Github</a></p>' +
		'</div>' +
	'</footer>'
);

var indexTemplate = jsontemplate.Template(
	'<h1>Magic Javascript MusicBrainz site thing.</h1>' +
	'<p>This page exists as a tech demo. It will load pages from the MusicBrainz webservice, then format them into page templates in Javascript. The idea is to see how much you can do nowadays with a “static” HTML page by itself.</p>' +
	'<p>Try adding a “?release-group=mbid” or “?release=mbid” query parameter. Or <a href="?release-group=d288b7b2-5f6b-4343-ab51-2a8c754ee02a">follow this link</a>, <a href="?release=bef90838-a09d-4853-ae85-6314d3ab5a4b">this link</a>, or even <a href="?recording=8d8f94eb-d7be-46f7-9b01-4ec81a449e09">this link</a> for an example.</p>'
);

var errorTemplate = jsontemplate.Template(
	'{.section header}' +
		'<h1>{@|html}</h1>' +
	"{.end}" +
	"{.section text}" +
		"{.repeated section @}" +
			"<p>{@|html}</p>" +
		"{.end}" +
	"{.end}" +
	'<a href="">Return to index page</a>'
);
