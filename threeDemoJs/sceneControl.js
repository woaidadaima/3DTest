import * as THREE from "../three/build/three.module.js";
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";
import { CSS3DRenderer } from "../three/examples/jsm/renderers/CSS3DRenderer.js";
import * as TWEEN from "../tween.js-main/dist/tween.esm.js";
import SphereModel from "./sphereModel.js";

/**
 * 全景场景控制器
 * 负责管理场景切换、相机控制、渲染器设置等
 */
export class SceneControl {
  constructor(config = {}) {
    // 默认配置
    this.config = {
      camera: {
        fov: 80,
        near: 0.1,
        far: 20000,
        position: { x: 0, y: 0, z: 100 },
      },
      sceneContainerId: "c",
      background: 0xc1dbfe,
      controls: {
        enableZoom: true,
        zoomSpeed: 1.5,
        enablePan: false,
        minDistance: 0.5,
        maxDistance: 1500,
        minPolarAngle: Math.PI / 8,
        maxPolarAngle: Math.PI - Math.PI / 8,
      },
      ...config,
    };

    // 核心对象
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.css3Renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // 场景管理
    this.currentScene = "scene1";
    this.sceneStates = {};
    this.sphereModel = null;

    // 交互
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 动画
    this.animationMixers = [];
    this.tweens = [];

    this.init();
  }

  /**
   * 初始化场景、相机、渲染器等
   */
  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initCSS3DRenderer();
    this.initSphereModel();
    this.bindEvents();
  }

  /**
   * 初始化场景
   */
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.background);
  }

  /**
   * 初始化相机
   */
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.config.camera.fov,
      window.innerWidth / window.innerHeight,
      this.config.camera.near,
      this.config.camera.far
    );

    const pos = this.config.camera.position;
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 初始化WebGL渲染器
   */
  initRenderer() {
    const canvas = document.getElementById(this.config.sceneContainerId);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  /**
   * 初始化CSS3D渲染器
   */
  initCSS3DRenderer() {
    this.css3Renderer = new CSS3DRenderer();
    this.css3Renderer.setSize(window.innerWidth, window.innerHeight);
    this.css3Renderer.domElement.style.position = "absolute";
    this.css3Renderer.domElement.style.top = "0px";
    this.css3Renderer.domElement.style.pointerEvents = "none";
    document.body.appendChild(this.css3Renderer.domElement);
  }

  /**
   * 初始化轨道控制器
   */
  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    const controlsConfig = this.config.controls;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    this.controls.enableZoom = controlsConfig.enableZoom;
    this.controls.zoomSpeed = controlsConfig.zoomSpeed;
    this.controls.enablePan = controlsConfig.enablePan;
    this.controls.minDistance = controlsConfig.minDistance;
    this.controls.maxDistance = controlsConfig.maxDistance;
    this.controls.minPolarAngle = controlsConfig.minPolarAngle;
    this.controls.maxPolarAngle = controlsConfig.maxPolarAngle;
  }

  /**
   * 初始化球体模型
   */
  initSphereModel() {
    this.sphereModel = new SphereModel();
  }

  /**
   * 添加场景状态
   * @param {string} sceneId - 场景ID
   * @param {Object} sceneConfig - 场景配置
   */
  addScene(sceneId, sceneConfig) {
    this.sceneStates[sceneId] = {
      texture: sceneConfig.texture,
      markers: sceneConfig.markers || null,
      points: sceneConfig.points || null,
      lines: sceneConfig.lines || null,
      css3D: sceneConfig.css3D !== false,
      onEnter: sceneConfig.onEnter || null,
      onExit: sceneConfig.onExit || null,
    };
  }

  /**
   * 切换到指定场景
   * @param {string} targetScene - 目标场景ID
   * @returns {Promise} 切换完成的Promise
   */
  async switchToScene(targetScene) {
    if (this.currentScene === targetScene) return;

    const currentState = this.sceneStates[this.currentScene];
    const targetState = this.sceneStates[targetScene];

    if (!targetState) {
      console.error(`Scene '${targetScene}' not found`);
      return;
    }
    // 保存当前透明度
    const originalOpacity = this.sphereModel.material.opacity;
    const originalTransparent = this.sphereModel.material.transparent;

    // 淡出动画
    const fadeOutTween = new TWEEN.Tween({ opacity: originalOpacity })
      .to({ opacity: 0.0 }, 1000)
      .onStart(() => {
        // 启用透明度
        this.sphereModel.material.transparent = true;
      })
      .onUpdate((obj) => {
        this.sphereModel.material.opacity = obj.opacity;
      })
      .onComplete(async () => {
        try {
          // 执行当前场景退出回调
          if (currentState && currentState.onExit) {
            currentState.onExit();
          }

          // 移除当前场景元素
          if (currentState) {
            if (currentState.markers) this.scene.remove(currentState.markers);
            if (currentState.lines) this.scene.remove(currentState.lines);
            if (currentState.points) this.scene.remove(currentState.points);
            if (currentState.css3D && this.css3Renderer.domElement.parentNode) {
              this.css3Renderer.domElement.parentNode.removeChild(
                this.css3Renderer.domElement
              );
            }
          }

          // 加载新场景纹理
          await this.sphereModel.updateTexture(targetState.texture);

          // 添加新场景元素
          if (targetState.markers) this.scene.add(targetState.markers);
          if (targetState.lines) this.scene.add(targetState.lines);
          if (targetState.points) this.scene.add(targetState.points);
          if (targetState.css3D) {
            document.body.appendChild(this.css3Renderer.domElement);
          }

          this.currentScene = targetScene;

          // 执行新场景进入回调
          if (targetState.onEnter) {
            targetState.onEnter();
          }

          // 淡入动画
          const fadeInTween = new TWEEN.Tween({ opacity: 0.0 })
            .to({ opacity: originalOpacity }, 1000)
            .onUpdate((obj) => {
              this.sphereModel.material.opacity = obj.opacity;
            })
            .onComplete(() => {
              // 恢复原始透明度设置
              this.sphereModel.material.transparent = originalTransparent;
              this.sphereModel.material.opacity = originalOpacity;
            })
            .start();

          this.tweens.push(fadeInTween);
        } catch (error) {
          console.error(`Failed to switch to ${targetScene}:`, error);
          // 恢复原始状态
          this.sphereModel.material.transparent = originalTransparent;
          this.sphereModel.material.opacity = originalOpacity;
        }
      })
      .start();
    this.tweens.push(fadeOutTween);
  }

  /**
   * 加载初始场景
   * @param {string} sceneId - 场景ID
   * @param {string} texturePath - 纹理路径
   */
  async loadInitialScene(sceneId, texturePath) {
    try {
      const { mesh } = await this.sphereModel.loadTexture(texturePath);
      this.scene.add(mesh);

      // 添加初始场景的其他元素
      const sceneState = this.sceneStates[sceneId];
      if (sceneState) {
        if (sceneState.markers) this.scene.add(sceneState.markers);
        if (sceneState.lines) this.scene.add(sceneState.lines);
        if (sceneState.points) this.scene.add(sceneState.points);
        if (sceneState.onEnter) sceneState.onEnter();
      }

      this.currentScene = sceneId;
    } catch (error) {
      console.error("Failed to load initial scene:", error);
    }
  }

  /**
   * 添加相机动画
   * @param {Object} targetPosition - 目标位置
   * @param {number} duration - 动画时长
   * @param {Function} easing - 缓动函数
   */
  animateCamera(
    targetPosition,
    duration = 6000,
    easing = TWEEN.Easing.Quadratic.Out
  ) {
    const tween = new TWEEN.Tween(this.camera.position)
      .to(targetPosition, duration)
      .onUpdate(() => {
        this.camera.lookAt(0, 0, 0);
      })
      .easing(easing)
      .start();

    this.tweens.push(tween);
    return tween;
  }

  /**
   * 添加动画混合器
   * @param {THREE.AnimationMixer} mixer - 动画混合器
   */
  addAnimationMixer(mixer) {
    this.animationMixers.push(mixer);
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 点击事件
    window.addEventListener("click", this.onMouseClick.bind(this));
    // 鼠标移动事件
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    // 窗口大小调整事件
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  /**
   * 鼠标点击事件处理
   */
  onMouseClick(event) {
    this.updateMousePosition(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const currentState = this.sceneStates[this.currentScene];
    if (!currentState || !currentState.markers) return;

    const intersects = this.raycaster.intersectObjects([
      currentState.markers,
      currentState.points,
    ]);

    if (intersects.length > 0) {
      // 触发场景切换
      const sceneIds = Object.keys(this.sceneStates);
      const currentIndex = sceneIds.indexOf(this.currentScene);
      const nextIndex = (currentIndex + 1) % sceneIds.length;
      const targetScene = sceneIds[nextIndex];

      this.switchToScene(targetScene);
    }
  }

  /**
   * 鼠标移动事件处理
   */
  onMouseMove(event) {
    this.updateMousePosition(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const currentState = this.sceneStates[this.currentScene];

    if (!currentState || !currentState.markers) {
      this.renderer.domElement.style.cursor = "auto";
      return;
    }

    const intersects = this.raycaster.intersectObjects([
      currentState.markers,
      currentState.points,
    ]);
    console.log(
      "🚀 ~ SceneControl ~ onMouseMove ~ intersects:",
      intersects,
      currentState.points
    );
    this.renderer.domElement.style.cursor =
      intersects.length > 0 ? "pointer" : "auto";
  }

  /**
   * 更新鼠标位置
   */
  updateMousePosition(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * 窗口大小调整事件处理
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.css3Renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * 渲染循环
   */
  render() {
    // 更新动画
    const deltaTime = this.clock.getDelta();

    // 更新Tween动画
    this.tweens.forEach((tween) => tween.update());

    // 更新动画混合器
    this.animationMixers.forEach((mixer) => mixer.update(deltaTime));

    // 渲染场景
    this.renderer.render(this.scene, this.camera);
    this.css3Renderer.render(this.scene, this.camera);
  }

  /**
   * 开始动画循环
   */
  startAnimation() {
    const animate = () => {
      this.render();
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * 销毁资源
   */
  dispose() {
    // 销毁球体模型
    if (this.sphereModel) {
      this.sphereModel.dispose();
    }

    // 移除事件监听器
    window.removeEventListener("click", this.onMouseClick);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("resize", this.onWindowResize);

    // 销毁渲染器
    if (this.css3Renderer && this.css3Renderer.domElement.parentNode) {
      this.css3Renderer.domElement.parentNode.removeChild(
        this.css3Renderer.domElement
      );
    }
  }
}

export default SceneControl;
