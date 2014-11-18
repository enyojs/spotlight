enyo.kind({
	name    : 'enyo.Spotlight.ContainerSample',
	classes : 'sample',
	fit     : true,
	
	handlers: {
		onSpotlightFocused: 'buttonFocused'
	},
	
	components: [
		{name: 'c1', spotlight: 'container', onSpotlightContainerEnter: 'enterContainer', onSpotlightContainerLeave: 'leaveContainer', components: [
			{name: 'c1b1', kind: 'enyo.Button', spotlight: true, content: 'c1b1'},
			{name: 'c1b2', kind: 'enyo.Button', spotlight: true, content: 'c1b2'}
		]},
		{name: 'c2', spotlight: 'container', onSpotlightContainerEnter: 'enterContainer', onSpotlightContainerLeave: 'leaveContainer', components: [
			{name: 'c2b1', kind: 'enyo.Button', spotlight: true, content: 'c2b1'},
			{name: 'c2b2', kind: 'enyo.Button', spotlight: true, content: 'c2b2'},
			{name: 'c2c1', spotlight: 'container', onSpotlightContainerEnter: 'enterContainer', onSpotlightContainerLeave: 'leaveContainer', components: [
				{name: 'c2c1b1', kind: 'enyo.Button', spotlight: true, content: 'c2c1b1'},
				{name: 'c2c1b2', kind: 'enyo.Button', spotlight: true, content: 'c2c1b1'}
			]}
		]}
	],

	buttonFocused: function (sender, event) {
		this.log('Button Focused', event.originator.id);
	},

	enterContainer: function (sender, event) {
		this.log('Container Entered:', event.originator.id);
		sender.applyStyle('border', '2px solid red');
	},

	leaveContainer: function (sender, event) {
		this.log('Container Left:', event.originator.id);
		sender.applyStyle('border', null);
	}
});

enyo.Spotlight.verbose();
