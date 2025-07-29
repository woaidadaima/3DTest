import * as THREE from "../three/build/three.module.js";
import { CSS3DObject } from "../three/examples/jsm/renderers/CSS3DRenderer.js";

class LineModel {
  constructor(lineModelConfig, lineTagConfig) {
    const { basicMaterial, dataSource } = lineModelConfig;
    const { domId: dom } = lineTagConfig;
    this.defaultMaterial = {
      color: "#00FF41", // 更鲜艳的绿色
      linewidth: "100", // 增加线条粗细
      transparent: true,
      opacity: 0.9,
    };
    this.line = this.createLine(dataSource, basicMaterial);
    this.tag = this.createTag(dom, dataSource);
    this.group = this.createGroup();
  }

  handleDataSource(dataSource) {
    if (!(dataSource instanceof Array)) {
      throw Error("dataSource must be Array");
    }
    const vec3Array = dataSource.map((item) => new THREE.Vector3(...item));
    const geometry = new THREE.BufferGeometry();
    return geometry.setFromPoints(vec3Array);
  }

  createLine(dataSource, basicMaterial) {
    const geometry = this.handleDataSource(dataSource);
    const material = new THREE.LineBasicMaterial(
      basicMaterial ?? this.defaultMaterial
    );
    return new THREE.Line(geometry, material);
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
