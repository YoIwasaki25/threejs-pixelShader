import * as THREE from 'three';
import '../scss/styles.scss';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
//@ts-ignore
import { RenderPixelatedPass } from './RenderPixelatedPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GUI } from 'lil-gui';

import checkerImg from './textures/checker.png';

window.addEventListener('DOMContentLoaded', () => {
    const pixelArt = new PixelArt();
    pixelArt.animate();
});

class PixelArt {
    private width: number;
    private height: number;
    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initPostProcessing();
        this.initTexture();
        this.initMaterial();
        this.initGeometry();
        // this.initModel();
        this.initLight();

        this.initGUI();

        // this.initHelper();
        window.addEventListener('resize', this.onResizeWindow);
    }

    //Scene
    private scene: THREE.Scene;
    initScene = () => {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x151729);
    };

    private gridHelper: THREE.GridHelper;
    private axesHelper: THREE.AxesHelper;
    initHelper = () => {
        this.gridHelper = new THREE.GridHelper();
        this.axesHelper = new THREE.AxesHelper();
        this.scene.add(this.gridHelper);
        this.scene.add(this.axesHelper);
    };

    //Camera
    private camera: THREE.OrthographicCamera;
    private controls: OrbitControls;
    initCamera = () => {
        const aspectRatio = this.width / this.height;
        this.camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, 0.4, 100);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.controls.target.set(0, 0, 0);
        this.camera.position.z = 2;
        this.camera.position.y = 2 * Math.tan(Math.PI / 6);
    };

    //Renderer
    private renderer: THREE.WebGLRenderer;
    initRenderer = () => {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('myCanvas'),
            antialias: false,
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    };

    //PostProcessing
    private composer: EffectComposer;
    private renderPixelatedPass: RenderPixelatedPass;
    initPostProcessing = () => {
        this.composer = new EffectComposer(this.renderer);
        this.renderPixelatedPass = new RenderPixelatedPass((this.width, this.height), 6, this.scene, this.camera);
        this.composer.addPass(this.renderPixelatedPass);
    };

    // private texLoader: THREE.TextureLoader;
    private tex_checker: THREE.Texture;
    private tex_checker2: THREE.Texture;
    initTexture = () => {
        const img = new Image();
        const texture = new THREE.Texture(img);
        img.onload = () => {
            texture.needsUpdate = true;
        };
        img.src = checkerImg;

        const pixelTexture = (texture: THREE.Texture) => {
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            texture.generateMipmaps = false;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        };
        this.tex_checker = pixelTexture(texture);
        this.tex_checker2 = pixelTexture(texture);
        // this.texLoader = new THREE.TextureLoader();
        // this.tex_checker = this.pixelTexture(this.texLoader.load('./textures/checker.png'));

        this.tex_checker.repeat.set(3, 3);
        // this.tex_checker2.repeat.set(1.5, 1.5);
    };

    private boxMaterial: THREE.MeshPhongMaterial;
    initMaterial = () => {
        this.boxMaterial = new THREE.MeshPhongMaterial({
            map: this.tex_checker2,
        });
    };

    private crystalMesh: THREE.Mesh;
    initGeometry = () => {
        const addBox = (boxSideLength: number, x: number, z: number, rotation: number) => {
            let mesh = new THREE.Mesh(
                new THREE.BoxGeometry(boxSideLength, boxSideLength, boxSideLength),
                this.boxMaterial
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.rotation.y = rotation;
            mesh.position.y = boxSideLength / 2;
            mesh.position.set(x, boxSideLength / 2 + 0.0001, z);
            this.scene.add(mesh);
            return mesh;
        };

        addBox(0.4, 0, 0, Math.PI / 4);
        addBox(0.5, -0.5, -0.5, Math.PI / 4);

        const planeSideLength = 2;
        const planeMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(planeSideLength, planeSideLength),
            new THREE.MeshPhongMaterial({
                map: this.tex_checker,
                side: THREE.DoubleSide,
            })
        );
        planeMesh.receiveShadow = true;
        planeMesh.rotation.x = -Math.PI / 2;
        this.scene.add(planeMesh);

        const radius = 0.2;
        const geometry = new THREE.IcosahedronGeometry(radius);

        this.crystalMesh = new THREE.Mesh(
            geometry,
            new THREE.MeshPhongMaterial({
                color: 0x2379cf,
                emissive: 0x143542,
                shininess: 10,
                specular: 0xffffff,
            })
        );

        this.crystalMesh.receiveShadow = true;
        this.crystalMesh.castShadow = true;
        this.crystalMesh.position.y = 0.7;
        this.scene.add(this.crystalMesh);
    };

    initModel = () => {
        const charModel = 'https://raw.githubusercontent.com/pizza3/asset/master/chaassets/char8.glb';

        const loader = new GLTFLoader();
        loader.load(charModel, (gltf) => {
            gltf.scene.traverse(function (node) {
                //@ts-ignore
                if ((node as Mesh).isMesh) {
                    node.castShadow = true;
                }
            });

            gltf.scene.scale.set(0.03, 0.03, 0.03);
            gltf.scene.position.set(0, 0, 0);
            gltf.scene.rotation.set(0, Math.PI / 6, 0);

            this.scene.add(gltf.scene);
        });
    };

    initLight = () => {
        this.scene.add(new THREE.AmbientLight(0x2d3645, 1.5));

        const dirLight1 = new THREE.DirectionalLight(0xffc9c, 1);
        dirLight1.position.set(100, 100, 100);
        dirLight1.castShadow = true;
        dirLight1.shadow.mapSize.set(2048, 2048);
        this.scene.add(dirLight1);

        const spotLight = new THREE.SpotLight(0xff8800, 1, 10, Math.PI / 16, 0.02, 2);
        spotLight.position.set(2, 2, 0);
        const target = spotLight.target;
        this.scene.add(target);

        target.position.set(0, 0, 0);
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    };

    initGUI = () => {
        const gui = new GUI();
        const params = {
            pixelSize: 6,
            normalEdgeStrength: 0.3,
            depthEdgeStrength: 0.4,
        };

        gui.add(params, 'pixelSize')
            .min(1)
            .max(16)
            .step(1)
            .onChange(() => {
                this.renderPixelatedPass.setPixelSize(params.pixelSize);
            });

		gui.add ( this.renderPixelatedPass, 'normalEdgeStrength', ).min(0).max(2).step(.05);
		gui.add ( this.renderPixelatedPass, 'depthEdgeStrength', ).min(0).max(1).step(.05);
    };

    onResizeWindow = () => {};

    animate = () => {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.composer.render();
    };
}
