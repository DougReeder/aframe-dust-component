aframe-dust-component
===

An [A-Frame](https://aframe.io) [WebVR](https://webvr.info/) component that surrounds the user
with a cloud of points. 
As the user moves, points from behind the user respawn in front
(so you don't have to fill the whole space with points).

This provides visual feedback on the user's motion, which is useful when flying or
moving in unearthly spaces.

Can also be used to add atmosphere - pink fairy lights for a paradise,
black ash for a hellscape.

The performance cost is modest, unless you use tens of thousands of points.

![sample screenshot](sample.png)

[live example scene](https://dougreeder.github.io/aframe-dust-component/example.html)


Basic Usage
---
```html
<a-dust></a-dust>
```
Leave the position at 0 0 0, and place the dust as a direct child of the scene.

You should explicitly set a camera in JavaScript:
```javascript
let cameraEl = sceneEl.querySelector('[camera]');
let dustEl = sceneEl.querySelector('a-dust');

// delays setup until there's some slack time
requestIdleCallback( () => {
	dustEl.components.dust.setCamera(cameraEl);
});

```


Advanced Usage
---
```html
<a-dust num-points="24576" dispersion="200" color="black" point-size="4"></a-dust>
```

```javascript
let cameraEl = sceneEl.querySelector('[camera]');
let dustEl = sceneEl.querySelector('a-dust');

// delays setup until there's some slack time
requestIdleCallback( () => {
	dustEl.components.dust.setCamera(cameraEl);
});

```

Properties
---

### color
CSS color of specks; default gray

### num-points
The number of points; default 64

### dispersion
How close the specks will stay to the user, in meters; default 100

### point-size
The size of points, in pixels; default 2
