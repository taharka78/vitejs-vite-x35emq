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

    const defaultColor = new BABYLON.Color4(1, 1, 1, 1);
    const hexGrid = new HexGrid(scene, 6, 6, defaultColor);

    // Color picker
    const colors = [
        new BABYLON.Color4(1, 0, 0, 1),
        new BABYLON.Color4(0, 1, 0, 1),
        new BABYLON.Color4(0, 0, 1, 1),
        new BABYLON.Color4(1, 1, 0, 1)
    ];
    let activeColorIndex = 0;
    let activeElevation = 0;

    // Create UI
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
    // Color panel
    const colorPanel = new GUI.StackPanel();
    colorPanel.width = "100px";
    colorPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    colorPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    advancedTexture.addControl(colorPanel);

    colors.forEach((color, index) => {
        const button = GUI.Button.CreateSimpleButton("colorBtn" + index, "");
        button.width = "30px";
        button.height = "30px";
        button.color = "white";
        button.background = color.toHexString();
        button.onPointerUpObservable.add(() => {
            activeColorIndex = index;
        });
        colorPanel.addControl(button);
    });

    // Elevation slider
    const elevationSlider = new GUI.Slider();
    elevationSlider.minimum = 0;
    elevationSlider.maximum = 6;
    elevationSlider.value = 0;
    elevationSlider.height = "200px";
    elevationSlider.width = "20px";
    elevationSlider.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    elevationSlider.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    elevationSlider.left = "120px";
    elevationSlider.isVertical = true;
    elevationSlider.onValueChangedObservable.add((value) => {
        activeElevation = Math.round(value);
    });
    advancedTexture.addControl(elevationSlider);

    // Elevation text
    const elevationText = new GUI.TextBlock();
    elevationText.text = "Elevation: 0";
    elevationText.color = "white";
    elevationText.height = "30px";
    elevationText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    elevationText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    elevationText.left = "120px";
    elevationText.top = "-30px";
    advancedTexture.addControl(elevationText);

    elevationSlider.onValueChangedObservable.add((value) => {
        activeElevation = Math.round(value);
        elevationText.text = `Elevation: ${activeElevation}`;
    });

    // Cell editing
    scene.onPointerDown = function(evt, pickResult) {
        if (pickResult.hit && pickResult.pickedMesh === hexGrid.getMesh() && pickResult.pickedPoint) {
            const x = Math.round((pickResult.pickedPoint.x / (HexMetrics.innerRadius * 2) - pickResult.pickedPoint.z / (HexMetrics.outerRadius * 3)));
            const z = Math.round((pickResult.pickedPoint.z / (HexMetrics.outerRadius * 1.5)));
            hexGrid.editCell(x, z, activeElevation, colors[activeColorIndex]);
            alert();
        }
    };

    return scene;
};

const scene = createScene();

engine.runRenderLoop(function() {
    scene.render();
});

window.addEventListener("resize", function() {
    engine.resize();
});
