# SPOTLIGHT DOCUMENTATION #



## WHAT IS SPOTLIGHT? ##

Spotlight is an Enyo package that empowers navigation through an Enyo application using only **UP, DOWN, LEFT, RIGHT** and **RETURN** keys. Additionally, it responds to Point-and-Click events.
TV remote controlling and keyboard navigation are the use cases where Spotlight is an essential tool.


## MODES: ##

Spotlight functions in two mutually exclusive modes: **5-way** and **Pointer** mode.
Currently it is configured to switch between modes whenever corresponding input is received. I.e. it switches to pointer mode on mousemove, and back to 5-way on keydown.
However, Spotlight API provides a way to explicitly perform the switch by calling 

> `Enyo.Spotlight.setPointerMode([BOOLEAN]);`


## NAVIGATION: ##

Spotlight allows navigation between Enyo controls by setting spotlight focus to one control at a time. 
When control is focused, it is assigned a CSS class ".spotlight" which allows to style focused controls on per-kind basis using `.<kindClass>.spotlight` selectors.

In order to make a control focusable with Spotlight ( **Spottable** ), simply set it's "spotlight" property to TRUE, like so:

> `{name: 'mybutton', tag: 'button', spotlight: true}`
	
When application loads, spotlight searches for a control name specified by it's **defaultControl** property, 
if defaultControl is not specified, spotlight focuses on the first available spottable control.

In 5-way mode, spotlight uses Nearest Neighbor algorithm to determine what spottable control is nearest in the direction of navigation. 
The coordinates of spottable controls are derived from their actual position on the screen.

It's worth noting, that spottable controls don't have to be found on the same hierarchal level of an Enyo component tree. 
Spotlight takes care of allowing seamless navigation between topmost spottable components found in the tree.


## CONTAINERS: ##

In order to organize controls into navigation groups we have created Spotlight containers. 
A good use case for containers is a set of radio buttons that need to be navigable independently from the rest of controls.

When Spotlight container is focused it passes the focus to it's own hierarchy of spottable child controls, 
namely to the spottable child, which has been focused last before the focus has moved outside of the container.
If the container in question has never been focused, it focuses it's first spottable child.

To define a container, set control's `spotlight` property to "container":

> `{name: 'mycontainer', spotlight: 'container', components: [<A LIST OF spotlight:true CONTROLS>]}`
	
In a way, containers are the branches and `spotlight:true` controls are the leaves of Spotlight navigation tree.
	

## NESTING ##

The containers can be nested. The inner containers can be remembered by outer as their "last focused children", and act as conduits of focus passed by the outer ones.

Nesting `spotlight:true` controls was not found to be useful. 
As of now, they act as the leaves of the spottable tree and don't conduct focus, however this behavior can be overridden on per-control basis. 


## EVENTS ##

![Spotlight keyboard events](docs/chart_spotlight_5way_events.jpg)


## EXTENDING SPOTLIGHT ##

There are two ways to extend spotlight functionality 





