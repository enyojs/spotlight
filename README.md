# SPOTLIGHT DOCUMENTATION #



## WHAT IS SPOTLIGHT? ##

Spotlight is an enyo package that empowers navigation through an enyo application using only **UP, DOWN, LEFT, RIGHT** and **RETURN** keys. Additionally, it responds to Point-and-Click events.
TV remote controlling and keyboard navigation are the use cases where Spotlight is an essential tool.


## MODES: ##

Spotlight functions in two mutually exclusive modes: **5-way** and **Pointer** mode.
Currently it is configured to switch between modes whenever corresponding input is received. I.e. it switches to pointer mode on mousemove, and back to 5-way on keydown.
However, Spotlight API provides a way to explicitly perform the switch by calling 

> `enyo.Spotlight.setPointerMode([BOOLEAN]);`


## NAVIGATION: ##

Spotlight allows navigation between enyo controls by setting spotlight focus to one control at a time. 
When control is focused, it is assigned a CSS class ".spotlight" which allows to style focused controls on per-kind basis using `.<kindClass>.spotlight` selectors.

In order to make a control focusable with Spotlight ( **Spottable** ), simply set it's "spotlight" property to TRUE, like so:

> `{name: 'mybutton', tag: 'button', spotlight: true}`

In 5-way mode, spotlight uses Nearest Neighbor algorithm to determine what spottable control is nearest in the direction of navigation. 
The coordinates of spottable controls are derived from their actual position on the screen.

It's worth noting, that spottable controls don't have to be found on the same hierarchal level of an enyo component tree. 
Spotlight takes care of allowing seamless navigation between topmost spottable components found in the tree.

## CONTAINERS: ##

In order to organize controls into navigation groups we have created Spotlight containers. 
A good use case for containers is a set of radio buttons that need to be navigable independently of the rest of controls.
When Spotlight container is focused it passes the focus to it's own hierarchy of spottable controls, 
namely to the spottable child, which has been focused last before the focus moved outside of the container.
If the container in question has never been focused, it focuses it's first spottable child.




