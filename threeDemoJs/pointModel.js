import * as THREE from "../three/build/three.module.js";
import { CSS2DObject } from "../three/examples/jsm/renderers/CSS2DRenderer.js";
export default class PointModel {
  constructor(config = {}) {
    this.config = {
      num: 2,
      color: 0xff0000,
      geometryAttr: {
        radius: 30,
        widthSegments: 16,
        heightSegments: 16,
      },

      ...config,
    };

    this.points = this.createPoint(this.config);
  }

  createPoint(config) {
    console.log("🚀 ~ PointModel ~ createPoint ~ config:", config);
    const {
      geometryAttr: { radius, widthSegments, heightSegments },
      color,
      num,
    } = config;
    const pointGroup = new THREE.Group();
    const position = [
      [-1970, -459, -2213],
      [2521, -339, -1586],
    ];
    // 2. 随机填充数据
    for (let i = 0; i < num; i++) {
      const geometry = new THREE.SphereGeometry(
        radius,
        widthSegments,
        heightSegments
      ); // 半径 10
      const material = new THREE.MeshBasicMaterial({ color });
      const point = new THREE.Mesh(geometry, material);
      point.name = "point";
      point.position.set(position[i][0], position[i][1], position[i][2]);

      // 创建文字标签
      const labelDiv = document.createElement("div");
      labelDiv.className = "point-label";
      labelDiv.textContent = `ID:${i}`;
      labelDiv.style.color = "white";
      labelDiv.style.fontSize = "16px";
      labelDiv.style.fontFamily = "Arial";
      labelDiv.style.fontWeight = "bold";
      labelDiv.style.textShadow = "0 0 5px black";

      const label = new CSS2DObject(labelDiv);
      label.position.set(0, radius * 4, 0); // 放在圆点上方
      point.add(label);

      pointGroup.add(point);
    }
    return pointGroup;
  }
}
