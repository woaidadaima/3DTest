import * as THREE from "../three/build/three.module.js";

/**
 * 全景球体模型类
 * 负责创建和管理全景球体，包括纹理加载和材质设置
 */
export class SphereModel {
  constructor(config = {}) {
    // 默认配置
    this.config = {
      radius: 3000,
      widthSegments: 128,
      heightSegments: 64,
      ...config,
    };

    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.textureLoader = new THREE.TextureLoader();

    this.init();
  }

  /**
   * 初始化球体几何体
   */
  init() {
    this.geometry = new THREE.SphereGeometry(
      this.config.radius,
      this.config.widthSegments,
      this.config.heightSegments
    );
    // 反转球体，使纹理显示在内侧
    this.geometry.scale(-1, 1, 1);
  }

  /**
   * 加载纹理并创建球体
   * @param {string} texturePath - 纹理图片路径
   * @param {Function} onLoad - 加载完成回调
   * @param {Function} onError - 加载失败回调
   * @returns {Promise} 返回Promise对象
   */
  loadTexture(texturePath, onLoad, onError) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        texturePath,
        (texture) => {
          console.log(`Loaded texture: ${texturePath}`);

          // 设置纹理属性以获得最佳质量
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;

          // 创建材质和网格
          this.material = new THREE.MeshBasicMaterial({ map: texture });
          this.mesh = new THREE.Mesh(this.geometry, this.material);

          if (onLoad) onLoad(texture, this.mesh);
          resolve({ texture, mesh: this.mesh });
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture: ${texturePath}`, error);
          if (onError) onError(error);
          reject(error);
        }
      );
    });
  }

  /**
   * 更新球体纹理
   * @param {string} texturePath - 新纹理路径
   * @returns {Promise} 返回Promise对象
   */
  updateTexture(texturePath) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        texturePath,
        (newTexture) => {
          newTexture.colorSpace = THREE.SRGBColorSpace;
          newTexture.minFilter = THREE.LinearFilter;
          newTexture.magFilter = THREE.LinearFilter;
          newTexture.generateMipmaps = false;

          if (this.material) {
            this.material.map = newTexture;
            this.material.needsUpdate = true;
          }

          resolve(newTexture);
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture: ${texturePath}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * 获取球体网格对象
   * @returns {THREE.Mesh} 球体网格
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * 销毁球体资源
   */
  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      if (this.material.map) {
        this.material.map.dispose();
      }
      this.material.dispose();
    }
  }
}

export default SphereModel;
