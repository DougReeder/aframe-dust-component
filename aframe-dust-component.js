// aframe-dust-component.js - A cloud of particles surrounding the user for visual motion indication, or atmosphere.
// Copyright © 2018 by P. Douglas Reeder under the MIT License

AFRAME.registerComponent('dust', {
    schema: {
        color: {type: 'color', default: 'rgb(128, 128, 128)'},
        numPoints: {type: 'number', default: 128},
        dispersion: {type: 'number', default: 100},
        pointSize: {type: 'number', default: Math.max(Math.min(window.devicePixelRatio, screen.availWidth/360), 1)},
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
            requestIdleCallback( () => {
                if (!this.cameraObject3D) {
                    let cameraEl = AFRAME.scenes[0].querySelector('[camera]');
                    console.warn("dust: setCamera not called; using first camera", cameraEl);
                    this.setCamera(cameraEl);
                }
            });
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
        let el = this.el;

        this.geometry = new THREE.Geometry();

        // a box of static specks prevents the bounding box from collapsing
        this.geometry.vertices.push(new THREE.Vector3( 5000,  5000,  5000));
        this.geometry.vertices.push(new THREE.Vector3( 5000,  5000, -5000));
        this.geometry.vertices.push(new THREE.Vector3( 5000, -5000,  5000));
        this.geometry.vertices.push(new THREE.Vector3( 5000, -5000, -5000));
        this.geometry.vertices.push(new THREE.Vector3(-5000,  5000,  5000));
        this.geometry.vertices.push(new THREE.Vector3(-5000,  5000, -5000));
        this.geometry.vertices.push(new THREE.Vector3(-5000, -5000,  5000));
        this.geometry.vertices.push(new THREE.Vector3(-5000, -5000, -5000));

        let cameraWorldPosition = new THREE.Vector3();
        this.cameraObject3D.getWorldPosition(cameraWorldPosition);
        for (let i = 0; i < data.numPoints; i ++ ) {
            // distributes specks in a slightly-lumpy ball
            let speck = new THREE.Vector3(
                THREE.Math.randFloatSpread(data.dispersion * 1.9),
                THREE.Math.randFloatSpread(data.dispersion * 1.9),
                THREE.Math.randFloatSpread(data.dispersion * 1.9)
            );
            speck.clampLength(0, data.dispersion * 0.95);
            speck.add(cameraWorldPosition);

            this.geometry.vertices.push(speck);
        }

        this.material = new THREE.PointsMaterial( { color: data.color, size: data.pointSize, sizeAttenuation: false } );

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
        // console.log("dust move specks", normalizedVelocity);
        for (let i=8; i<this.geometry.vertices.length; ++i) {
            let vertex = this.geometry.vertices[i];
            let relativePosition = vertex.clone().sub(newPosition);
            // console.log("vertex", vertex, relativePosition.dot(normalizedVelocity));
            if (relativePosition.dot(normalizedVelocity) < -this.data.dispersion) {
                offsetSph.set(this.data.dispersion * 0.9,
                    normalizedVelocitySph.phi + THREE.Math.randFloatSpread(THIRD),
                    normalizedVelocitySph.theta + THREE.Math.randFloatSpread(THIRD));
                offset.setFromSpherical(offsetSph);
                vertex.copy(newPosition);
                vertex.add(offset);

                if (this.data.log) {
                    console.log("moved to", vertex, newPosition);
                }
                this.geometry.verticesNeedUpdate = true;
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
