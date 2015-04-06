var
	kind = require('enyo/kind'),
	Button = require('enyo/Button'),
	Control = require('enyo/Control');

var
	Spotlight = require('spotlight');

var Barracuda = kind({
	name     : 'Barracuda',
	kind     : Control,
	classes  : 'barracuda',
	spotlight: true,
	
	handlers: {
		ondown : 'mousedown',
		onup   : 'mouseup',
		ondrag : 'drag'
	},
	
	components: [
		{name: 'corner', classes: 'barracuda-corner'}
	],
	
	index       : null,
	resizing    : false,
	cornerWidth : 20,
	initY       : null,
	initX       : null,
	initHeight  : null,
	initWidth   : null,
	
	rendered: function () {
		Control.prototype.rendered.apply(this, arguments);
		this.$.corner.addStyles('height:' + this.cornerWidth + 'px;width:' + this.cornerWidth + 'px;');
		this.index = this.parent.children.length;
	},
	
	mousedown: function (sender, event) {
		Spotlight.TestMode.disable();
		// check if resizing
		this.resizing = this.isResizing(event);

		// save initial values
		var bounds = this.getBounds();
		this.initY = bounds.top;
		this.initX = bounds.left;
		this.initWidth = bounds.width;
		this.initHeight = bounds.height;
	},
	
	mouseup: function (sender, event) {
		Spotlight.TestMode.enable();
	},
	
	drag: function (sender, event) {
		if(this.resizing) {
			this.doResize(event);
		} else {
			this.doDrag(event);
		}
	},
	
	isResizing: function (event) {
		var bounds = this.getAbsoluteBounds(),
			relativeTop = event.clientY - bounds.top,
			relativeLeft = event.clientX - bounds.left,
			relativeBottom = bounds.height - relativeTop,
			relativeRight = bounds.width - relativeLeft;

		this.resizingX = (relativeLeft < this.cornerWidth)
			? -1 
			: (relativeRight < this.cornerWidth) 
				? 1
				: 0;

		this.resizingY = (relativeTop < this.cornerWidth)
			? -1
			: (relativeBottom < this.cornerWidth)
				? 1
				: 0;

		//	TODO - only pay attention to bottom right for resizing for now
		return (relativeRight < this.cornerWidth && relativeBottom < this.cornerWidth);
		// return this.resizingX !== 0 && this.resizingY !== 0;
	},
	
	doResize: function (event) {
		this.addStyles('width:' + (event.dx + this.initWidth) + 'px;height:' + (event.dy + this.initHeight)+'px;');
	},
	
	doDrag: function (event) {
		this.addStyles('left:' + (event.dx + this.initX) + 'px;top:' + (event.dy + this.initY)+'px;');
	}
});

module.exports = kind({
	name: 'enyo.sample.SpotlightSandboxSample',
	classes: 'spotlight-sample',
	fit: false,
	components:[
		{components: [
			{kind: Button, spotlight: true, content: 'Add Control', ontap: 'addBarracuda'}
		]},
		{name: 'container', style: 'position:relative;'}
	],
	rendered: function () {
		this.inherited(arguments);
		Spotlight.TestMode.enable();
		for (var y=0; y<2; y++) {
			for (var x=0; x<4; x++) {
				var b = this.$.container.createComponent({kind: Barracuda}).render();
				b.applyStyle('top', (100*(y+1)) + 'px');
				b.applyStyle('left', (100 + x * 100) + 'px');
			}
		}
	},
	addBarracuda: function () {
		var b = this.$.container.createComponent({kind: Barracuda}).render();
		b.applyStyle('z-index:'+this.$.container.getClientControls().length+';');
	}
});