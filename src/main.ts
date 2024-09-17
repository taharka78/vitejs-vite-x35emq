import './style.css'

// src/main.ts
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { HexGrid } from './engine/grid/HexaGrid';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="renderCanvas"></canvas>
`
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

const createScene = function(): BABYLON.Scene {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.75, 0.75, 0.75, 1);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 100, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    const hexGrid = new HexGrid(scene, 6, 6);

    // Simple color picker
    const colors = [
        new BABYLON.Color3(1, 0, 0),
        new BABYLON.Color3(0, 1, 0),
        new BABYLON.Color3(0, 0, 1),
        new BABYLON.Color3(1, 1, 0)
    ];
    let activeColorIndex = 0;

    scene.onPointerDown = function(evt, pickResult) {
        if (pickResult.hit && pickResult.pickedMesh === hexGrid.getMesh() && pickResult.pickedPoint) {
            hexGrid.colorCell(pickResult.pickedPoint, colors[activeColorIndex]);
        }
    };

    // Simple UI for color selection
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    const panel = new GUI.StackPanel();
    panel.width = "100px";
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    advancedTexture.addControl(panel);

    colors.forEach((color, index) => {
        const button = GUI.Button.CreateSimpleButton("colorBtn" + index, "");
        button.width = "30px";
        button.height = "30px";
        button.color = "white";
        button.background = color.toHexString();
        button.onPointerUpObservable.add(() => {
            activeColorIndex = index;
        });
        panel.addControl(button);
    });

    return scene;
};


const scene = createScene();

engine.runRenderLoop(function() {
    scene.render();
});

window.addEventListener("resize", function() {
    engine.resize();
});
