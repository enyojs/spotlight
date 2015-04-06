var
	kind = require('enyo/kind'),
	Button = require('enyo/Button');

module.exports = kind({
	name: 'enyo.sample.SpotlightTest',
	classes: 'spotlight-sample',
	fit: false,
	components:[
		{style: 'position:relative;', components: [
			{kind: Button, spotlight: true, content: 'A', style: 'top:20px; left:140px; width:300px;'},
			{name: 'bigItem', kind: Button, spotlight: true, content: 'B', classes: 'big-item', style: 'top:100px; left:40px; width:1000px; height:40px;'},
			{kind: Button, spotlight: true, content: 'C', style: 'top:200px; left:140px;'}
		]},
		{style: 'position:relative;top:300px;left:100px;', components: [
			{kind: Button, spotlight: true, content: 'D', style: 'top:140px; left:40px; width:40px; height:300px;'},
			{name: 'bigItem2', kind: Button, spotlight: true, content: 'E', classes: 'big-item', style: 'top:40px; left:140px; width:40px; height:1000px;'},
			{kind: Button, spotlight: true, content: 'F', style: 'top:140px; left:240px; width:40px; height:300px;'}
		]}
	]
});
