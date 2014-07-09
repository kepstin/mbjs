MBJS.Router.map ->
  this.resource('artist', path: '/artist/:artist_id')
  this.resource('area', path: '/area/:area_id')

MBJS.IndexRoute = Ember.Route.extend
  renderTemplate: ->
    @render 'index/header', outlet: 'header'
    @render 'index'

MBJS.ArtistRoute = Ember.Route.extend
  renderTemplate: ->
    @render 'artist/header', outlet: 'header'
    @render 'artist'
