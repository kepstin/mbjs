MBJS.ReleaseGroup = DS.Model.extend
  artistCredit: DS.belongsTo('artistCredit')
  disambiguation: DS.attr('string')
  firstReleaseDate: DS.attr('string')
  primaryType: DS.attr('string')
  title: DS.attr('string')
