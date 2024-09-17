import * as BABYLON from 'babylonjs';

export class HexMetrics {
    static outerRadius: number = 10;
    static innerRadius: number = HexMetrics.outerRadius * 0.866025404; // outerRadius * sqrt(3)/2
    static corners: BABYLON.Vector3[] = [
        new BABYLON.Vector3(0, 0, HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0, 0, -HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0, 0, HexMetrics.outerRadius)
    ];
}