MBJS.Router.map ->
  this.resource('artist', path: '/artist/:artist_id')
  this.resource('area', path: '/area/:area_id')

MBJS.ArtistRoute = Ember.Route.extend
  renderTemplate: ->
    @render 'artist/header', outlet: 'header'
    @render 'artist'
