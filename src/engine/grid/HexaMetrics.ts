import * as BABYLON from 'babylonjs';
import { HexDirection } from './HexDirection';

export class HexMetrics {
    static outerRadius: number = 10;
    static innerRadius: number = HexMetrics.outerRadius * 0.866025404; // outerRadius * sqrt(3)/2
    static solidFactor: number = 0.75;
    static blendFactor: number = 1 - HexMetrics.solidFactor;
    static elevationStep: number = 5;
    static terracesPerSlope: number = 2;
    static terraceSteps: number = HexMetrics.terracesPerSlope * 2 + 1;
    static horizontalTerraceStepSize: number = 1 / HexMetrics.terraceSteps;
    static verticalTerraceStepSize: number = 1 / (HexMetrics.terracesPerSlope + 1);

    static corners: BABYLON.Vector3[] = [
        new BABYLON.Vector3(0, 0, HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0, 0, -HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0, 0, HexMetrics.outerRadius)
    ];

    static getFirstCorner(direction: HexDirection): BABYLON.Vector3 {
        return this.corners[direction];
    }

    static getSecondCorner(direction: HexDirection): BABYLON.Vector3 {
        return this.corners[direction + 1];
    }

    static getFirstSolidCorner(direction: HexDirection): BABYLON.Vector3 {
        return this.corners[direction].scale(this.solidFactor);
    }

    static getSecondSolidCorner(direction: HexDirection): BABYLON.Vector3 {
        return this.corners[direction + 1].scale(this.solidFactor);
    }

    static getBridge(direction: HexDirection): BABYLON.Vector3 {
        return this.corners[direction].add(this.corners[direction + 1]).scale(this.blendFactor);
    }

    static terraceLerp(a: BABYLON.Vector3, b: BABYLON.Vector3, step: number): BABYLON.Vector3 {
        const h = step * HexMetrics.horizontalTerraceStepSize;
        const v = ((step + 1) / 2) * HexMetrics.verticalTerraceStepSize;
        return BABYLON.Vector3.Lerp(a, b, h).add(new BABYLON.Vector3(0, BABYLON.Vector3.Lerp(a, b, v).y - a.y, 0));
    }

    static colorLerp(a: BABYLON.Color4, b: BABYLON.Color4, step: number): BABYLON.Color4 {
        const h = step * HexMetrics.horizontalTerraceStepSize;
        return BABYLON.Color4.Lerp(a, b, h);
    }
}