MBJS
====

This is a project to implement a friendly browsing interface to the
[MusicBrainz][] data via the public web service. I am publicly hosting a copy,
so [check it out][MBJS].

It is implemented entirely in client-side (i.e. in-browser) javascript code.

[MusicBrainz]: https://musicbrainz.org/
[MBJS]: http://mbjs.kepstin.ca/

Installation Instructions
-------------------------

At its simplest, you should be able to deploy this code by simply extracting
it to a directory hosted by a web server, adjusting the configuration to
use an appropriate MusicBrainz server or mirror, then access the index.html
file in your browser.

Life, of course, is not that simple. For the version that I am hosting,
there is some custom configuration done to allow path-based urls to load the
index.html file correctly, and a caching reverse-proxy in front of MusicBrainz
to improve performance.

There's a few optional features, too:

### Webfonts

To improve the look of the page, I'm using a few webfonts. Open Sans is loaded
off Google's font api, but since I do a lot of Japanese stuff on MusicBrainz,
I wanted an interesting Japanese font. I went with the [M+ Outline Fonts][M+]

The M+ fonts are not currently available on any public CDNs. Due to their size,
they are not included in this repository.

Please [download the latest version][M+ Download] and extract the files
"mplus-1p-regular.ttf" and "mplus-1p-bold.ttf" to the `fonts` directory.

[M+]: http://mplus-fonts.sourceforge.jp/mplus-outline-fonts/index-en.html
[M+ Download]: http://mplus-fonts.sourceforge.jp/mplus-outline-fonts/download/index-en.html
