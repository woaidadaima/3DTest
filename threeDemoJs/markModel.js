import * as THREE from "../three/build/three.module.js";
export default class MarkModel {
  constructor(markModelConfig, markTagConfig) {
    const { SphereGeometry, CircleGeometry } = markModelConfig;
    this.tagDom = null;
    this.mixer = null;
    this.circleMixer = null;
    this.position = null;
    this.marksGroup = this.createMarksGroup(
      SphereGeometry,
      CircleGeometry,
      markTagConfig
    );
    this.setupAnimations(SphereGeometry, CircleGeometry); // 初始化动画
  }

  createTagDom(markTagConfig) {
    const { style, scale, domContainer } = markTagConfig;
    this.tagDom = domContainer;
    const context = this.tagDom.getContext("2d");
    this.tagDom.width = style.width * style.pixelRatio;
    this.tagDom.height = style.height * style.pixelRatio;
    this.tagDom.style.width = `${style.width}px`;
    this.tagDom.style.height = `${style.height}px`;
    context.scale(style.pixelRatio, style.pixelRatio);
    context.fillStyle = style.background;
    context.fillRect(0, 0, style.width, style.height);
    context.font = style.fontStyle;
    context.fillStyle = style.textColor;
    context.textAlign = style.textAlign;
    context.textBaseline = style.textBaseline;
    context.fillText(style.text, style.width / 2, style.height / 2);

    // 2. 转换为 Three.js 纹理并创建 Sprite
    const texture = new THREE.CanvasTexture(this.tagDom);
    texture.minFilter = THREE.LinearFilter; // 缩小过滤
    texture.magFilter = THREE.LinearFilter; // 放大过滤
    // texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // 各向异性过滤
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(...scale);
    sprite.position.copy(this.position).add(new THREE.Vector3(0, 50, 0));
    return sprite;
  }

  createSphere(SphereGeometry) {
    const { radius, widthSegments, heightSegments } = SphereGeometry.geometry;
    this.position = new THREE.Vector3(
      SphereGeometry.position[0],
      SphereGeometry.position[1],
      SphereGeometry.position[2]
    );
    const geometry = new THREE.SphereGeometry(
      radius,
      widthSegments,
      heightSegments
    );
    const material = new THREE.MeshBasicMaterial(SphereGeometry.material);
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(this.position);
    sphere.name = SphereGeometry.name;
    return sphere;
  }

  createSphereAnimation(SphereGeometry) {
    const { animation } = SphereGeometry;
    const times = [0, animation.duration / 2, animation.duration];
    const values = [
      ...SphereGeometry.position,
      ...SphereGeometry.position.map((item, index) => {
        if (animation.axis === "y" && index === 1) {
          return item + animation.maxDistance;
        }
        if (animation.axis === "x" && index === 0) {
          return item + animation.maxDistance;
        }
        if (animation.axis === "z" && index === 2) {
          return item + animation.maxDistance;
        }
        return item;
      }),
      ...SphereGeometry.position,
    ];

    const posKF = new THREE.KeyframeTrack(
      `${SphereGeometry.name}.position`, // 正确路径
      times,
      values
    );
    return new THREE.AnimationClip("sphereAnim", animation.duration, [posKF]);
  }

  createCircle(CircleGeometry) {
    const { radius, segments } = CircleGeometry.geometry;
    const geometry = new THREE.CircleGeometry(radius, segments);
    const material = new THREE.MeshBasicMaterial(CircleGeometry.material);
    const circle = new THREE.Mesh(geometry, material);
    const circlePosition = this.position.clone();
    circlePosition.y -= 10;
    console.log(
      "🚀 ~ MarkModel ~ createCircleAndAnimation ~ circlePosition:",
      circlePosition,
      this.position
    );
    circle.position.copy(circlePosition);
    circle.rotation.x = -Math.PI / 2;
    circle.name = CircleGeometry.name;
    return circle;
  }

  createCircleAnimation(CircleGeometry) {
    const { animation } = CircleGeometry;
    const times = [0, animation.duration / 2, animation.duration];
    const values = [
      ...animation.initXYZ,
      ...animation.initXYZ.map((item) => item * animation.maxRadiusRatio),
      ...animation.initXYZ,
    ];
    const radiusKF = new THREE.KeyframeTrack(
      `${CircleGeometry.name}.scale`,
      times,
      values
    );
    return new THREE.AnimationClip("circleAnim", animation.duration, [
      radiusKF,
    ]);
  }

  createMarksGroup(SphereGeometry, CircleGeometry, markTagConfig) {
    this.marksGroup = new THREE.Group();
    this.marksGroup.add(this.createSphere(SphereGeometry));
    this.marksGroup.add(this.createCircle(CircleGeometry));
    this.marksGroup.add(this.createTagDom(markTagConfig));
    return this.marksGroup;
  }

  setupAnimations(SphereGeometry, CircleGeometry) {
    // 创建 Group 的 AnimationMixer
    this.mixer = new THREE.AnimationMixer(this.marksGroup);

    // 合并两个动画 Clip
    const sphereClip = this.createSphereAnimation(SphereGeometry);
    const circleClip = this.createCircleAnimation(CircleGeometry);

    // 播放动画
    this.mixer.clipAction(sphereClip).play();
    this.mixer.clipAction(circleClip).play();
  }
}
