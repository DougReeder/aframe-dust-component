// aframe-dust-component.js - A cloud of particles surrounding the user for visual motion indication, or atmosphere.
// Copyright © 2018, 2023 by P. Douglas Reeder under the MIT License

const NUM_FIXED_POINTS = 8;

AFRAME.registerComponent('dust', {
    schema: {
        color: {type: 'color', default: 'rgb(128, 128, 128)'},
        numPoints: {type: 'number', default: 128},
        dispersion: {type: 'number', default: 100},
        pointSize: {type: 'number', default: 1},
        log: {type: 'boolean', default: false}
    },

    cameraObject3D: null,
    prevPosition: new THREE.Vector3(),

    /** Called once when component is attached. Generally for initial setup. */
    init: function () {
        if (this.data.log) {
            console.log("dust init", this.data, this.el);
        }

        setTimeout(() => {   // allows developer a chance to set the camera
            let ensureCameraSet = () => {
                if (!this.cameraObject3D) {
                    let cameraEl = AFRAME.scenes[0].querySelector('[camera]');
                    console.warn("dust: setCamera not called; using first camera", cameraEl);
                    this.setCamera(cameraEl);
                }
            };
            if ('requestIdleCallback' in window) {
                requestIdleCallback(ensureCameraSet);
            } else {
                ensureCameraSet();
            }
        }, 1000)
    },

    /** Called when properties are changed, incl. right after init */
    update: function () {
        if (this.data.log) {
            console.log("dust update", this.data, this.el, this.cameraObject3D);
        }

        if (this.cameraObject3D) {
            this.createSpecks();
        }
    },

    setCamera: function (cameraComp) {
        if (this.data.log) {
            console.log("dust setCamera", cameraComp, cameraComp.object3D.position);
        }

        this.cameraObject3D = cameraComp.object3D;

        if (! this.points) {
            this.createSpecks();
        }

        this.prevTime = AFRAME.scenes[0].time;
        cameraComp.object3D.getWorldPosition(this.prevPosition);
    },

    createSpecks: function () {
        if (this.data.log) {
            console.log("dust createSpecks", this.cameraObject3D);
        }
        let data = this.data;
        data.numPoints += NUM_FIXED_POINTS;
        let el = this.el;

        this.positions = new Float32Array(data.numPoints * 3);

        // a box of static specks prevents the bounding box from collapsing
        this.positions.set([5000, 5000, 5000,  5000, 5000, -5000,  5000, -5000, 5000,  5000, -5000, -5000,  -5000,  5000, 5000,  -5000, 5000, -5000,  -5000, -5000, 5000,  -5000, -5000, -5000], 0);

        let cameraWorldPosition = new THREE.Vector3();
        this.cameraObject3D.getWorldPosition(cameraWorldPosition);
        const speck = new THREE.Vector3();
        for (let i = NUM_FIXED_POINTS; i < data.numPoints; i++) {
            // distributes specks in a slightly-lumpy ball
            speck.set(
                THREE.MathUtils.randFloatSpread(data.dispersion * 1.9),
                THREE.MathUtils.randFloatSpread(data.dispersion * 1.9),
                THREE.MathUtils.randFloatSpread(data.dispersion * 1.9)
            );
            speck.clampLength(0, data.dispersion * 0.95);
            speck.add(cameraWorldPosition);

            speck.toArray(this.positions, i*3)
        }
        this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
        this.positionAttribute.setUsage(THREE.DynamicDrawUsage);
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', this.positionAttribute);

        this.particleTexture = new THREE.TextureLoader().load(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAR5JREFUOMvF011rFEEQheGnshuNxi+iURARJHjr//8rXgQkIWxAza4RNyEyW96chXFcL8WBooaePm9Vne7hfz81XejuPRziGfazvMGqqlbT/fMd4rd4jCc4yqfvWHb3YVVd7ASMxC9wgjd4hAFrnGHW3caQcQfPU/E9PuB1AIXrUTfd3euqWk4B27nfpZOTiBpLzJK/4GnefwMc4BUeRnicjSK+ii/HWHT3rKqGMWAvIe7Pkzt5f2r6tIOfcXvAt8w9zxFeY4WbxGYX4BZfcRlD7wU0RLxILHFTVcMU8Dk+fIzzKzzICGuc4zQFFn90UFW33X0+Gucipm5i4FUgn7bV/3aVD/AS93Mj4QfucDYW7wSMQLMc37bDu3/yN/4CZpdiqUwRBfYAAAAASUVORK5CYII='
        );
        this.material = new THREE.PointsMaterial({
            map: this.particleTexture,
            transparent: true,
            size: data.pointSize/2,
            blending: THREE.AdditiveBlending,
            color: data.color
        });

        this.points = new THREE.Points(this.geometry, this.material);

        el.setObject3D('points', this.points);
    },

    tick: function (time, timeDelta) {
        if (! this.cameraObject3D || time < this.prevTime + 100) {
            return;
        }

        this.moveSpecks(time);
    },

    moveSpecks: function (time) {
        // console.log(this.cameraObject3D.getWorldPosition());
        const THIRD = Math.PI * 2 / 3;
        let newPosition = new THREE.Vector3();
        this.cameraObject3D.getWorldPosition(newPosition);
        let normalizedVelocity = newPosition.clone().sub(this.prevPosition).normalize();
        let normalizedVelocitySph = new THREE.Spherical();
        normalizedVelocitySph.setFromVector3(normalizedVelocity);

        let offsetSph = new THREE.Spherical();
        let offset = new THREE.Vector3();
        let vertex = new THREE.Vector3()
        // console.log("dust move specks", normalizedVelocity);
        for (let i = NUM_FIXED_POINTS; i < this.data.numPoints; i ++ ) {
            vertex.fromArray(this.positions, i*3);
            let relativePosition = vertex.clone().sub(newPosition);
            // console.log("vertex", vertex, relativePosition.dot(normalizedVelocity));
            if (relativePosition.dot(normalizedVelocity) < -this.data.dispersion) {
                offsetSph.set(this.data.dispersion * 0.9,
                    normalizedVelocitySph.phi + THREE.MathUtils.randFloatSpread(THIRD),
                    normalizedVelocitySph.theta + THREE.MathUtils.randFloatSpread(THIRD));
                offset.setFromSpherical(offsetSph);
                vertex.copy(newPosition);
                vertex.add(offset);
                vertex.toArray(this.positions, i*3);

                if (this.data.log) {
                    console.log("moved to", vertex, newPosition);
                }
                this.positionAttribute.needsUpdate = true;
            }
        }
        this.prevTime = time;
        this.prevPosition = newPosition;
    },


    /** Called when a component is removed (e.g., via removeAttribute). */
    remove: function () {
        this.el.removeObject3D('points');
    }
});



AFRAME.registerPrimitive('a-dust', {
    defaultComponents: {
        dust: {}
    },
    mappings: {
        color: 'dust.color',
        'num-points': 'dust.numPoints',
        dispersion: 'dust.dispersion',
        'point-size': 'dust.pointSize',
        log: 'dust.log'
    }
});
