import * as THREE from "../three/build/three.module.js";

export default class PointModel {
  constructor(config = {}) {
    this.config = {
      num: 20,
      color: "blue",

      ...config,
    };

    this.points = this.createPoint(this.config);
  }

  createPoint(config) {
    console.log("🚀 ~ PointModel ~ createPoint ~ config:", config);
    const positions = new Float32Array(config.num * 3); // XYZ
    // 2. 随机填充数据
    for (let i = 0; i < config.num; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1000; // X: -100 到 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1000; // Y: -100 到 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1000; // Z: -100 到 100
    }

    // 3. 创建几何体
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 20, // 点大小
      alphaTest: 0.1,
      transparent: true,
      map: this.createCircleTexture(config.color), // 使用动态圆形纹理
    });

    return new THREE.Points(geometry, material);
  }

  // 动态生成圆形纹理的函数
  createCircleTexture(color, size = 64) {
    console.log("🚀 ~ PointModel ~ createCircleTexture ~ color:", color);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }
}
