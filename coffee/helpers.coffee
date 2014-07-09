parseURL = (url) ->
  a = document.createElement 'a'
  a.href = url
  {
    source: url
    protocol: a.protocol.replace(':','')
    host: a.hostname
    port: a.port
    query: a.search
    params: (->
      params_hash = {}
      for segment in a.search.replace(/^\?/,'').split('&')
        if segment?
          s = segment.split('=')
          params_hash[s[0]] = s[1]
      params_hash
    )()
    file: a.pathname.match(/\/([^\/?#]+)$/i)?[1] ? ''
    hash: a.hash.replace('#', '')
    path: a.pathname.replace(/^([^\/])/,'/$1')
    relative: a.href.match(tps?:\/\/[^\/]+(.+)/)?[1] ? ''
    segments: a.pathname.replace(/^///,'').split('/')
  }
