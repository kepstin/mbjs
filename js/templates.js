var templateOptions = {
	more_formatters: {
		'link': formatLink,
		'artist-link': formatArtistLink,
		'release-link': formatReleaseLink,
		'release-group-link': formatReleaseGroupLink,
		'label-link': formatLabelLink,
		'recording-link': formatRecordingLink,
		'work-link': formatWorkLink,
		'artist-credit': formatArtistCredit,
		'release-tile': formatReleaseTile,
		'release-group-tile': formatReleaseGroupTile,
		'medium-count': formatMediumCount,
		'track-count': formatTrackCount,
		'recording-time': formatRecordingTime,
		'release-cover-art': formatReleaseCoverArt,
		'relation-name': formatRelationName,
		'life-span': formatLifeSpan
	}
};

var linkTemplate = jsontemplate.Template(
	'<a href="{url|htmltag}"{.section title} title="{@|htmltag}"{.end}>' +
		'{text|html}' +
	'</a>' +
	'{.section comment}' +
		' <span class="comment">({@|html})</span>' +
	'{.end}'
);

function formatLink(link) {	return linkTemplate.expand(link); }
function formatArtistLink(a) { return linkTemplate.expand({ url: '?artist=' + a['id'], title: a['sort-name'], text: a['name'] }); }
function formatReleaseLink(r) { return linkTemplate.expand({ url: '?release=' + r['id'], text: r['title'] }); }
function formatReleaseGroupLink(rg) { return linkTemplate.expand({ url: '?release-group=' + rg['id'], text: rg['title'] }); }
function formatLabelLink(l) { return linkTemplate.expand({ url: '?label=' + l['id'], title: l['sort-name'], text: l['name'] }); }
function formatRecordingLink(r) {
	return linkTemplate.expand({
		url: '?recording=' + r['id'],
		text: r['title'],
		comment: r['disambiguation']
	});
}
function formatWorkLink(r) { return linkTemplate.expand({ url: '?work=' + r['id'], text: r['title'] }); }

var coverArtTemplate = jsontemplate.Template(
	'<div class="cover-art">' +
		'<img class="img-responsive" src="{url}" onerror="coverArtMissing(this);" alt="">' +
	'</div>'
);

var lifeSpanTemplate = jsontemplate.Template(
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
	'{.end}'
);
function formatLifeSpan(ls) { return lifeSpanTemplate.expand(ls); }

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
	'0fdbe3c6-7700-4a31-ae54-b53f06ae1cfa': {
		forward: '{additional} {guest} {solo} {*:%|vocals}',
		backward: '{additional} {guest} {solo} {*:%|vocals}'
	},
	'12ac9db0-ec26-3567-be3a-2e662e617803': { /* deprecated */
		forward: 'medley of',
		backward: 'referred to in medleys'
	},
	'22661fb8-cdb7-4f67-8385-b2a8be6c9f0d': {
		forward: '{additional:additionally} arranged',
		backward: '{additional} arranger'
	},
	'3e48faba-ec01-47fd-8e89-30e81161661c': {
		forward: '{additional} {translated} lyrics',
		backward: '{additional} {translated:translator|lyricist}'
	},
	'59054b12-01ac-43ee-a618-285fd397e461': {
		forward: '{additional} {guest} {solo} {*:%|instruments}',
		backward: '{additional} {guest} {solo} {*:%|instruments}'
	},
	'628a9658-f54c-4142-b0c0-95f031b544da': {
		forward: '{additional:additionally} {guest} {solo} performed',
		backward: '{additional} {guest} {solo} performer'
	},
	'75c09861-6857-4ec0-9729-84eefde7fc86': {
		forward: '{additional} {minor} collaborator on',
		backward: '{additional} {minor} collaborators'
	},
	'a255bca1-b157-4518-9108-7b147dc3fc68': {
		forward: '{additional:additionally} wrote',
		backward: '{additional} writer'
	},
	'a3005666-a872-32c3-ad06-98af558e99b0': {
		forward: '{live} {medley:medley including a} {partial} {instrumental} {cover} recording of',
		backward: '{live} {medley:medleys including} {partial} {instrumental} {cover} recordings'
	},
	'd59d99ea-23d4-4a80-b066-edca32ee158f': {
		forward: '{additional:additionally} composed',
		backward: '{additional} composer'
	},
	'e259a3f5-ce8e-45c1-9ef7-90ff7d0c7589': {
		forward: 'voice of',
		backward: 'voiced by'
	},
	'eb535226-f8ca-499d-9b18-6a144df4ae6f': {
		forward: 'blog'
	}
}
function formatRelationName(rel) {
	var dir = rel['direction'];
	var id = rel['type-id'];
	var attrs = rel['attributes'].slice(0);
	var usedAttrs = [];
	var unusedAttrs = [];
	var phrase = relationNames[id][dir];
	var matches = undefined;
	do {
		matches = /\{([^*:|}]+)(?::([^|}]*)(?:\|([^\}]+))?)?\}/.exec(phrase);
		console.log(matches);
		if (matches) {
			console.log('Found substitution ' + matches[0]);
			var attr = matches[1];
			var mode = matches[2]
			// Check if the attr is present
			var present = false;
			if (attrs.indexOf(attr) != -1) {
				present = true;
				if (usedAttrs.indexOf(attr) == -1) usedAttrs.push(attr);
			}
			if (present) {
				console.log("Attribute is present");
				if (matches[2] === undefined || matches[2] === '%')
					replace = attr;
				else
					replace = matches[2];
			} else {
				console.log("Attribute is not present");
				replace = matches[3] === undefined ? '' : matches[3];
			}
			console.log("Replacing with " + replace);
			phrase = phrase.replace(matches[0], replace);
		}
	} while (matches);
	for (var i = 0; i < attrs.length; ++i) {
		var attr = attrs[i];
		if (usedAttrs.indexOf(attr) == -1) {
			unusedAttrs.push(attr);
		}
	}
	do {
		matches = /\{\*(?::([^|}]*)(?:\|([^\}]+))?)?\}/.exec(phrase);
		console.log(matches);
		if (matches) {
			present = (unusedAttrs.length > 0)
			if (present) {
				console.log("Attribute is present");
				if (matches[1] === undefined || matches[1] === '%')
					replace = unusedAttrs.join(', ');
				else
					replace = matches[1];
			} else {
				console.log("Attribute is not present");
				replace = matches[2] === undefined ? '' : matches[2];
			}
			console.log("Replacing with " + replace);
			phrase = phrase.replace(matches[0], replace);
		}
	} while (matches)
	console.log(unusedAttrs);
	return phrase.trim();
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
	'<ol class="breadcrumb">' +
		'<li>' +
			'{release-group.artist-credit|artist-credit}' +
		'</li>' +
		'<li>' +
			'{release-group|release-group-link}' +
		'</li>' +
		'<li class="current">' +
			'{@|release-link}' +
		'</li>' +
	'</ol>' +
	'<header>' +
		'<div class="row">' +
			'<div class="col-sm-9">' +
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
					'{.end}' +
					'{.section label}{.section catalog-number} – {.end}{.end}' +
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
			'<div class="col-sm-3">' +
				'{@|release-cover-art}' +
			'</div>' +
		'</div>' +
	'</header>' +
	'{.repeated section media}' +
		'<div class="tracklist">' +
			'<h3>' +
				'{.section format}{@|html}{.or}Medium{.end} {position}' +
				'{.section title}' +
					': {@|html}' +
				'{.end}' +
			'</h3>' +
			'{.repeated section tracks}' +
				'<div class="track">' +
					'<div class="row">' +
						'<div class="col-md-7">' +
							'<div class="row">' +
								'<div class="col-xs-2 col-md-2 track_number">{.section number}{@|html}{.end}</div>' +
								'<div class="col-xs-8 col-md-8 track_name">' +
									'{recording|recording-link}<br>' +
									'{artist-credit|artist-credit}' +
								'</div>' +
								'<div class="col-xs-2 track_length">{.section length}{@|recording-time}{.end}</div>' +
							'</div>' +
						'</div>' +
						'<div class="col-xs-10 col-xs-offset-2 col-md-offset-0 col-md-5 credits">' +
	'{.section recording}{.section groupedRelations}{.section work}{.section performance}' +
		'{.repeated section forward}' +
			'{@|relation-name} {work|work-link}<br>' +
		'{.end}' +
	'{.end}{.end}{.end}{.end}' +
						'</div>' +
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
	'<div class="release-tile">' +
		'<div class="row">' +
			'<div class="col-xs-3">' +
				'{@|release-cover-art}' +
			'</div>' +
			'<div class="col-xs-9">' +
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
						'{.end}' +
						'{.section label}{.section catalog-number} – {.end}{.end}' +
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
		'</div>' +
	'</div>',
templateOptions);
function formatReleaseTile(r) { return releaseTileTemplate.expand(r); }

var releaseGroupTileTemplate = jsontemplate.Template(
	'<div class="release-group-tile">' +
		'<div class="row">' +
			'<div class="col-xs-3">' +
				'<div class="cover-art">' +
					'<img class="img-responsive" src="http://coverartarchive.org/release-group/{id}/front-250" onerror="coverArtMissing(this);" alt="">' +
				'</div>' +
			'</div>' +
			'<div class="col-xs-9">' +
				'<div class="tile-labels">' +
					'{.section primary-type}' +
						' <span class="label label-primary">' +
							'{@|html}' +
						'</span>' +
					'{.end}' +
					'{.repeated section secondary-types}' +
						' <span class="label label-default">' +
							'{@|html}' +
						'</span>' +
					'{.end}' +
				'</div>' +
				'<h3>' +
					'{@|release-group-link}' +
					'{.section disambiguation}' +
						' <small>({@|html})</small>' +
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
		'</div>' +
	'</div>',
	templateOptions
);
function formatReleaseGroupTile(r) { return releaseGroupTileTemplate.expand(r); }

var artistTemplate = jsontemplate.Template(
	'<header>' +
		'<div class="row">' +
			'{.section image}' +
				'<div class="col-sm-9">' +
			'{.or}' +
				'<div class="col-sm-12">' +
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
						', {@|life-span}' +
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
				'<div class="col-sm-3">' +
					'<div class="artist-image">' +
						'<img class="img-responsive" src="{image|htmltag}" alt="">' +
					'</div>' +
				'</div>' +
			'{.end}' +
		'</div>' +
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
	'<ul class="nav nav-tabs">' +
		'<li class="active"><a href="#">Release Groups</a></li>' +
		'<li><a href="#">Recordings</a></li>' +
		'<li><a href="#">Works</a></li>' +
	'</ul>' +
	'<dl class="sub-nav">' +
		'<dt>Artist</dt>' +
		'<dd class="active"><a href="#">This Artist</a></dd>' +
		'<dd><a href="#">Various Artists</a></dd>' +
		'<dt>Type</dt>' +
		'<dd class="active"><a href="#">Single</a></dd>' +
		'<dd class="active"><a href="#">Album</a></dd>' +
	'</dl>' +
	'{.repeated section groupedReleaseGroups}' +
		'<div class="row">' +
			'<div class="col-md-1">' +
				'<h4>{year|html}</h4>' +
			'</div>' +
			'<div class="col-md-11">' +
				'<div class="row release-group-tiles">' +
					'{.repeated section releaseGroups}' +
						'<div class="col-sm-6 col-lg-4">' +
							'{@|release-group-tile}' +
						'</div>' +
					'{.end}' +
				'</div>' +
			'</div>' +
		'</div>' +
	'{.end}' +
	'{.repeated section text}' +
		'<p>{@|html}</p>' +
	'{.end}',
	templateOptions);

var wikiLinkTemplate = jsontemplate.Template(
	'<p class="text-right" style="margin-top: 0"><small>' +
		'Text from <a href="{link}">Wikipedia</a>, used under the terms of the ' +
		'<a href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> license.' +
	'</small></p>',
templateOptions);

var releaseGroupTemplate = jsontemplate.Template(
	'<ol class="breadcrumb">' +
		'<li>' +
			'{artist-credit|artist-credit}' +
		'</li>' +
		'<li class="current">' +
			'{@|release-group-link}' +
		'</li>' +
	'</ol>' +
	'<header>' +
		'<div class="row">' +
			'<div class="col-sm-9">' +
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
			'<div class="col-sm-3">' +
				'<div class="cover-art">' +
					'<img class="img-responsive" src="http://coverartarchive.org/release-group/{id}/front-250" onerror="coverArtMissing(this);" alt="">' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</header>' +
	'{.repeated section groupedReleases}' +
		'<div class="row">' +
			'<div class="col-md-1">' +
				'<h4>{year|html}</h4>' +
			'</div>' +
			'<div class="col-md-11">' +
				'<div class="row release-tiles">' +
					'{.repeated section releases}' +
						'<div class="col-sm-6 col-lg-4">' +
							'{@|release-tile}' +
						'</div>' +
					'{.end}' +
				'</div>' +
			'</div>' +
		'</div>' +
	'{.end}',
	templateOptions);

var recordingTemplate = jsontemplate.Template(
	'<ol class="breadcrumb">' +
		'<li>' +
			'{artist-credit|artist-credit}' +
		'</li>' +
		'<li class="current">' +
			'{@|recording-link}' +
		'</li>' +
	'</ol>' +
	'<header>' +
		'<h1>' +
			'{@|recording-link}' +
			'<br>' +
			'<small>' +
				'{artist-credit|artist-credit}' +
			'</small>' +
		'</h1>' +
	'</header>' +
	'<h3>Credits</h3>' +
	'{.section groupedRelations}' +
		'<div class="credits">' +
		'{.section artist}' +
			'{.section vocal}{.repeated section backward}' +
				'<div>{@|relation-name}: {artist|artist-link}</div>' +
			'{.end}{.end}' +
			'{.section instrument}{.repeated section backward}' +
				'<div>{@|relation-name}: {artist|artist-link}</div>' +
			'{.end}{.end}' +
			'{.section arranger}{.repeated section backward}' +
				'<div>{@|relation-name}: {artist|artist-link}</div>' +
			'{.end}{.end}' +
		'{.end}' +
		'</div>' +
		'{.section work}{.section performance}' +
			'{.repeated section forward}' +
				'<h4>{@|relation-name} {work|work-link}</h4>' +
				'{.section work}{.section groupedRelations}' +
					'<div class="credits">' +
					'{.section artist}' +
						'{.section writer}{.repeated section backward}' +
							'<div>{@|relation-name}: {artist|artist-link}</div>' +
						'{.end}{.end}' +
						'{.section composer}{.repeated section backward}' +
							'<div>{@|relation-name}: {artist|artist-link}</div>' +
						'{.end}{.end}' +
						'{.section lyricist}{.repeated section backward}' +
							'<div>{@|relation-name}: {artist|artist-link}</div>' +
						'{.end}{.end}' +
					'{.end}' +
					'</div>' + 
				'{.end}{.end}' +
			'{.end}' +
		'{.end}{.end}' +
		'{.section work}{.section medley}' +
			'<h4>Medley</h4>' +
			'{.repeated section forward}' +
				'<h5>{@|relation-name} {work|work-link}</h5>' +
				'{.section work}{.section groupedRelations}' +
					'<div class="credits">' +
					'{.section artist}' +
						'{.section writer}{.repeated section backward}' +
							'<div>{@|relation-name}: {artist|artist-link}</div>' +
						'{.end}{.end}' +
						'{.section composer}{.repeated section backward}' +
							'<div>{@|relation-name}: {artist|artist-link}</div>' +
						'{.end}{.end}' +
						'{.section lyricist}{.repeated section backward}' +
							'<div>{@|relation-name}: {artist|artist-link}</div>' +
						'{.end}{.end}' +
					'{.end}' +
					'</div>' + 
				'{.end}{.end}' +
			'{.end}' +
		'{.end}{.end}' +
	'{.end}' +
	'<h3>Appears on Releases</h3>' +
	'{.repeated section groupedReleases}' +
		'<div class="row">' +
			'<div class="col-md-1">' +
				'<h4>{year|html}</h4>' +
			'</div>' +
			'<div class="col-md-11">' +
				'<div class="row release-tiles">' +
					'{.repeated section releases}' +
						'<div class="col-sm-6 col-lg-4">' +
							'{@|release-tile}' +
						'</div>' +
					'{.end}' +
				'</div>' +
			'</div>' +
		'</div>' +
	'{.end}',
	templateOptions
);

var workTemplate = jsontemplate.Template(
	'<header>' +
		'<h1>' +
			'{@|work-link}' +
		'</h1>' +
	'</header>' +
	'<h3>Recordings</h3>' +
	'{.section groupedRelations}{.section recording}' +
		'{.section performance}{.repeated section backward}' +
			'<p>{recording|recording-link}</p>' +
		'{.end}{.end}' +
	'{.end}{.end}',
	templateOptions
);

var searchArtistTemplate = jsontemplate.Template(
	'<header>' +
		'<h1>Artist Search for “{query}”</h1>' +
	'</header>' +
	'{.repeated section artist}' +
		'<p>' +
			'{score} {@|artist-link} {.section disambiguation}({@|html}){.end} {life-span|life-span}' +
		'</p>' +
	'{.end}',
	templateOptions
);

var layoutTemplate = jsontemplate.Template(
	'<nav class="navbar navbar-default navbar-static-top">' +
		'<div class="container">' +
			'<div class="navbar-header">' +
				'<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">' +
					'<span class="sr-only">Toggle navigation</span>' +
					'<span class="icon-bar"></span>' +
					'<span class="icon-bar"></span>' +
					'<span class="icon-bar"></span>' +
				'</button>' +
				'<a href="" class="navbar-brand">' +
					'MB JS Demo' +
				'</a>' +
			'</div>' +
			'<div class="collapse navbar-collapse">' +
				'<form action="" method="get" class="navbar-form navbar-right" role="search">' +
					'<div class="form-group">' +
						'<select name="entity" class="form-control">' +
							'<option value="artist">Artist</option>' +
						'</select>' +
					'</div>' +
					'<div class="form-group">' +
						'<input name="query" type="search" class="form-control" placeholder="Search">' +
					'</div>' +
					'<button type="submit" class="btn btn-default">Submit</button>' +
				'</form>' +
			'</div>' +
		'</div>' +
	'</nav>' +
	'<div class="container">' +
		'<section class="row">' +
			'<div id="body" class="col-xs-12">' +
				'{body|raw}' +
			'</div>' +
		'</section>' +
		'<footer class="row">' +
			'<div class="col-xs-12">' +
				'<p>This is an experimental page, using Javascript and the MusicBrainz JSON webservice to render pages. It is not associated with the official <a href="http://musicbrainz.org">MusicBrainz</a> site.</p>' +
				'<p><a href="http://github.com/kepstin/mbjs">Check out the source on Github</a></p>' +
			'</div>' +
		'</footer>' +
	'</div>'
);

var loadingTemplate = jsontemplate.Template(
	'<h1>Loading from MusicBrainz webservice…</h1>' +
	'<div class="progress"><span class="progress-bar" id="loading-progress" style="width: 0"></span></div>'
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
