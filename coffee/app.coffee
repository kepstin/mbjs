window.MBJS = Ember.Application.create
  LOG_TRANSITIONS: true
  LOG_TRANSITIONS_INTERNAL: true
  LOG_VIEW_LOOKUPS: true

incParameters =
  artist: 'aliases+tags+ratings+artist-rels+label-rels+url-rels'

nextId = 0
generateId = -> nextId++

MBJS.ApplicationAdapter = DS.RESTAdapter.extend
  host: 'https://musicbrainz.org'
  namespace: 'ws/2'
  pathForType: (type) -> Ember.String.dasherize(type)
  find: (store, type, id) ->
    url = this.buildURL(type.typeKey, id)
    query = { inc: incParameters[type.typeKey] }
    this.ajax(url, 'GET', data: query)
  findHasMany: (store, record, attrs) ->
    url = this.buildURL(attrs.typeKey)
    query = attrs.query
    query['inc'] = incParameters[attrs.typeKey]
    this.ajax(url, 'GET', data:query)
    

MBJS.ApplicationSerializer = DS.RESTSerializer.extend
  typeForRoot: (key) ->
    type = Ember.String.camelize(Ember.String.singularize(key))
    console.log(type)
    return type
  extractSingle: (store, type, payload, id) ->
    newPayload = {}
    for rel in ['area', 'begin_area', 'end_area']
      if payload[rel]?
        area = payload[rel]
        array = newPayload['areas'] = [] unless newPayload['areas']?
        array.push(area)
        payload[rel] = area['id']
    for rel in ['life-span']
      if payload[rel]?
        lifeSpan = payload[rel]
        array = newPayload['lifeSpans'] = [] unless newPayload['lifeSpans']?
        id = lifeSpan['id'] = generateId()
        array.push(lifeSpan)
        payload[rel] = id
    payload['links'] = {}
    if type.typeKey in [ 'artist' ]
      payload['links'] = 
        recordings:
          typeKey: 'recording'
          query:
            artist: payload['id']
        releaseGroups:
          typeKey: 'releaseGroup'
          query:
            artist: payload['id']
    newPayload[type.typeKey] = payload
    console.log newPayload
    this._super(store, type, newPayload, id)
  extractArray: (store, type, payload) ->
    # TODO!
    delete payload['recording-offset']
    delete payload['recording-count']
    delete payload['release-group-offset']
    delete payload['release-group-count']
    this._super(store, type, payload)
  attrs:
    sortName: 'sort-name'
    beginArea: 'begin_area'
    endArea: 'end_area'
    lifeSpan: 'life-span'
    releaseGroups: 'release-groups'
    releaseGroup: 'release-group'
    
