import * as THREE from "../three/build/three.module.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "../three/examples/jsm/renderers/CSS3DRenderer.js";

class LineModel {
  constructor(lineModelConfig, lineTagConfig) {
    const { basicMaterial, dataSource } = lineModelConfig;
    const {dom} = lineTagConfig
    console.log("🚀 ~ LineModel ~ constructor ~ window:", window,lineTagConfig)
    this.defaultMaterial = {
      color: "#00FF41", // 更鲜艳的绿色
      linewidth: "100", // 增加线条粗细
      transparent: true,
      opacity: 0.9,
    };
    this.vec3Array = [];
    console.log("🚀 ~ LineModel ~ constructor ~  this.vec3Array:",  this.vec3Array)
    this.line = this.createLine(dataSource, basicMaterial);
    this.tag = this.createTag(dom);
    this.group = this.createGroup();
  }

  handleDataSource(dataSource) {
    if (!(dataSource instanceof Array)) {
      throw Error("dataSource must be Array");
    }
     this.vec3Array = dataSource.map((item) => new THREE.Vector3(...item));
    const geometry = new THREE.BufferGeometry();
    return geometry.setFromPoints(this.vec3Array);
  }

  createLine(dataSource, basicMaterial) {
    const geometry = this.handleDataSource(dataSource);
    const material = new THREE.LineBasicMaterial(
        basicMaterial ?? this.defaultMaterial
      );
    return new THREE.Line(geometry, material);
  }

  createTag(dom) {
    const tag = new CSS3DObject(dom);
    //位置放在线段的中间
    const midIndex = Math.floor(this.vec3Array.length / 2);
    console.log(this.vec3Array[midIndex],666);
    
    tag.position.set(this.vec3Array[midIndex].x, this.vec3Array[midIndex].y, this.vec3Array[midIndex].z);
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
