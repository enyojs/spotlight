Spotlight
=========

Spotlight package for Moonraker project
Author: Lex Podgorny

Used for keyboard/pointer navigation through components of an enyo application.
This is accomplished by moving "spotlight", an artificial focus, between them.
Spotlight works in two modes: Keyboard and Pointer.

How to use:

1. Include Spotlight package into your application
2. Add enyo.Spotlight component into your application components block:
	
	...
	enyo.kind({
		name: 'App',
		components:[
			{kind: 'enyo.Spotlight', defaultControl: 'button1a'},
	...
			
3. Add "spotlight: true" property to any component that you would like to receive spotlight:

	...
	{name: 'button1', kind: 'Button', content: 'Button 1', spotlight: true, ontap: 'onButtonTap'}
	...
	
4. To create a navigational hierarchy of spotlight components use set "spotlight: true" on component owners:

	...
	{kind: 'onyx.Toolbar', spotlight: true, components: [
		{name: 'button1', kind: 'Button', content: 'Button 1', spotlight: true, ontap: 'onButtonTap'},
		{name: 'button2', kind: 'Button', content: 'Button 2', spotlight: true, ontap: 'onButtonTap'},
	]
	...
	
5. With lists, use enyo.Spotlight.ListDecorator to make list items able to receive spotlight

	...
	{name: 'panel1', components: [
		{kind: 'enyo.Spotlight.ListDecorator', components: [
			{name: 'list1', kind: 'List', spotlight: true, count: 10, onSetupItem: 'setupItem', components: [
				{name: 'item1', classes: 'panels-sample-item'}
			]}
		]}
	]},
	...
	
6. To switch between Keyboard and Pointer modes pass a boolean value to enyo.Spotlight.setPointerMode(true|false).