var
	kind = require('enyo/kind'),
	ready = require('enyo/ready'),
	Anchor = require('enyo/Anchor'),
	Collection = require('enyo/Collection'),
	Control = require('enyo/Control'),
	DataRepeater = require('enyo/DataRepeater');

var
	samples = {
		Container			: require('./ContainerSample'),
		Disappear			: require('./DisappearSample'),
		Sandbox				: require('./SpotlightSandboxSample'),
		TestPage			: require('./TestPage')
	};

var List = kind({
	kind: Control,
	components: [
		{name: 'list', kind: DataRepeater, components: [
			{style: 'margin: 10px;', components: [
				{name: 'a', kind: Anchor}
			], bindings: [
				{from: 'model.name', to: '$.a.href', transform: function (v) { return '?' + v; }},
				{from: 'model.name', to: '$.a.content', transform: function (v) { return v + ' Sample'; }}
			]}
		]}
	],
	create: function () {
		Control.prototype.create.apply(this, arguments);
		this.$.list.set('collection', new Collection(Object.keys(samples).map(function (key) {
			return {name: key};
		})));
	}
});

ready(function () {
	var name = window.document.location.search.substring(1),
		Sample = samples[name] || List;

	new Sample({samples: samples}).renderInto(document.body);
});