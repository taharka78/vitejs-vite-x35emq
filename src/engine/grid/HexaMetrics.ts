import * as BABYLON from 'babylonjs';
import { HexDirection } from './HexDirection';

export class HexMetrics {
    static outerRadius: number = 10;
    static innerRadius: number = HexMetrics.outerRadius * 0.866025404; // outerRadius * sqrt(3)/2
    static solidFactor: number = 0.75;
    static blendFactor: number = 1 - HexMetrics.solidFactor;

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
}