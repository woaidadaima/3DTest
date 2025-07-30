import * as THREE from "../three/build/three.module.js";
import { CSS3DObject } from "../three/examples/jsm/renderers/CSS3DRenderer.js";
import { Line2 } from "../three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "../three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "../three/examples/jsm/lines/LineGeometry.js";
class LineModel {
  constructor(lineModelConfig, lineTagConfig) {
    const { basicMaterial, dataSource } = lineModelConfig;
    const { domId: dom } = lineTagConfig;
    this.defaultMaterial = {
      color: "#00FF41", // 更鲜艳的绿色
      linewidth: 1, // 增加线条粗细
      transparent: true,
      opacity: 0.9,
      worldUnits: true,
    };
    this.line = this.createLine(dataSource, basicMaterial);
    this.tag = this.createTag(dom, dataSource);
    this.group = this.createGroup();
  }

  createLine(dataSource, basicMaterial) {
    if (!Array.isArray(dataSource)) {
      throw Error("dataSource must be Array");
    }
    const points = dataSource.flat(); // 将三维坐标数组展平
    const geometry = new LineGeometry();
    geometry.setPositions(points);
    const material = new LineMaterial({
      ...this.defaultMaterial,
      ...basicMaterial, // 合并默认材质和传入的材质
    });
    return new Line2(geometry, material);
  }

  createTag(dom, dataSource) {
    if (!dom) {
      throw Error("dom is undefined");
    }
    const tag = new CSS3DObject(dom);
    //位置放在线段的中间
    const midIndex = Math.floor(dataSource.length / 2);
    console.log(dataSource[midIndex], 666);

    tag.position.set(...dataSource[midIndex]);
    return tag;
  }

  createGroup() {
    const group = new THREE.Group();
    group.add(this.line);
    group.add(this.tag);
    return group;
  }
}
export default LineModel;
