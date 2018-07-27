// dust-component-spec.js - unit tests for dust component
// Copyright © 2018 P. Douglas Reeder; Licensed under the MIT License

describe("dust-component (stubbed A-Frame)", function () {
    beforeEach(function () {
        var el = document.createElement('a-dust');
    });

   it("should exist", function () {
       let dustComp = componentParam.dust;

       expect(dustComp).toBeTruthy();
   });

    it("shouldn't move specs every tick", function () {
        componentParam.dust.data = {
            color: 'rgb(128, 128, 128)',
            numPoints: 4,
            dispersion: 100,
            pointSize: 0.5,
            log: false
        };
        componentParam.dust.el = new MockElement();

        let mockCamera = {
            object3D: new THREE.PerspectiveCamera( 45, 4 / 3, 1, 1000 )
        };

        let moveSpecksSpy = spyOn(componentParam.dust, 'moveSpecks');
        componentParam.dust.setCamera(mockCamera);
        componentParam.dust.tick(99);
        expect(moveSpecksSpy).not.toHaveBeenCalled();
    });

    it("should move specks 10 times a second", function () {
        componentParam.dust.data = {
            color: 'rgb(128, 128, 128)',
            numPoints: 4,
            dispersion: 100,
            pointSize: 0.5,
            log: false
        };
        componentParam.dust.el = new MockElement();

        let mockCamera = {
            object3D: new THREE.PerspectiveCamera( 45, 4 / 3, 1, 1000 )
        };

        let moveSpecksSpy = spyOn(componentParam.dust, 'moveSpecks');
        componentParam.dust.setCamera(mockCamera);
        componentParam.dust.tick(100);
        expect(moveSpecksSpy).toHaveBeenCalled();
    })

});

// it("shouldn't move specs every tick", function () {
//     var cameraEl = document.createElement('a-entity');
//     cameraEl.setAttribute('camera');
//
//     var dustEl = document.createElement('a-entity');
//     // var dustEl = document.createElement('a-dust');
//
//     dustEl.setAttribute('dust', {
//         log: true
//     });
//
//     var sceneEl = document.querySelector('a-scene');
//     sceneEl.appendChild(cameraEl);
//     sceneEl.appendChild(dustEl);
//
//     console.log("dust component:", dustEl.getAttribute('dust'));
//
//     // dustEl.components.dust.setCamera(cameraEl);
// });
