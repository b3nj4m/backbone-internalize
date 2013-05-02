define([
  'underscore',
  'backbone'
],
function(_, Backbone) {
  var Model = Backbone.Model.extend({
    numCurrentRequests: 0,

    //map: attributeName -> class
    internalModels: {},
    //list of events which should be bubbled-up to the containing model (using object for fast single-member lookup)
    internalModelEvents: {
      request: null,
      sync: null,
      error: null,
      change: null,
      add: null,
      remove: null,
      sort: null,
      destroy: null,
      invalid: null
    },

    defaults: function() {
      return {};
    },

    initialize: function() {
      this.on('request', this.loading, this);
      this.on('sync error', this.loaded, this);
      this.on('error', this.error, this);

      if (!_.isEmpty(this.internalModels)) {
        var model;
        for (var name in this.internalModels) {
          model = this.get(name);
          if (!model) {
            model = new this.internalModels[name]();
            this.set(name, model);
          }
          model.on('all', this.internalModelEvent, this);
        }
      }
    },

    //make events from internal models bubble up to the containing model
    internalModelEvent: function(eventName) {
      if (eventName in this.internalModelEvents) {
        var args = [eventName];
        args = args.concat(_.toArray(arguments).slice(1));
        Backbone.Model.prototype.trigger.apply(this, args);
      }
    },

    //include internal models' toJSON
    toJSON: function(request) {
      var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
      if (!_.isEmpty(this.internalModels)) {
        var model;
        for (var name in this.internalModels) {
          model = this.get(name);
          if (model)
            json[name] = model.toJSON(request);
        }
      }

      if (request === undefined)
        json.isLoading = (this.numCurrentRequests > 0);

      return json;
    },

    //handle request events
    loading: function() {
      this.numCurrentRequests++;
      if (this.numCurrentRequests === 1)
        this.trigger('loading');
    },

    //handle sync, error events
    loaded: function() {
      this.numCurrentRequests = Math.max(0, this.numCurrentRequests - 1);
      if (this.numCurrentRequests === 0)
        this.trigger('loaded');
    },

    //handle error events
    error: function() {
      //noop
    }
  });
  return Model;
});
