(function () {

    'use strict';

    // レンダラを生成
    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    document.body.appendChild(renderer.domElement);

    // シーンを生成
    var scene = new THREE.Scene();

    // カメラを生成
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);


    //////////////////////////////////////////////////


    /**
     *  プレイヤー（視点）クラス
     *
     *  @param camera カメラオブジェクト
     */
    function PlayerController(character, position, origin) {
        this.object = new THREE.Object3D();
        this.character = character;
        this.object.add(this.character);

        this.init();
    }
    PlayerController.prototype = {

        constructor: PlayerController,

        /**
         *  初期化処理
         */
        init: function () {
            this.speed = 1;

            this.origin   = new THREE.Vector3(0, 0, 0);
            this.position = new THREE.Vector3(0, 1, 0);
            this.forward  = new THREE.Vector3(0, 0, 1);
            this.previousForward = new THREE.Vector3(0, 0, 1);

            this.extractVector = new THREE.Vector4(0, 0, 1, 0);

            // 初期姿勢を未設定に
            this.initializedPose = false;
        },

        /**
         *  初期姿勢を初期化
         */
        initPose: function () {
            var z = this.forward.normalize();
            var y = this.position.clone().sub(this.origin).normalize();
            var x = y.clone().cross(z).normalize();

            // 初期のZ軸（進行方向）を保持
            this.previousForward = z;

            var mat = new THREE.Matrix4();
            var e   = mat.elements;

            e[0 * 4 + 0] = x.x;
            e[0 * 4 + 1] = x.y;
            e[0 * 4 + 2] = x.z;
            e[0 * 4 + 3] = 0;

            e[1 * 4 + 0] = y.x;
            e[1 * 4 + 1] = y.y;
            e[1 * 4 + 2] = y.z;
            e[1 * 4 + 3] = 0;

            e[2 * 4 + 0] = z.x;
            e[2 * 4 + 1] = z.y;
            e[2 * 4 + 2] = z.z;
            e[2 * 4 + 3] = 0;

            e[3 * 4 + 0] = this.position.x;
            e[3 * 4 + 1] = this.position.y;
            e[3 * 4 + 2] = this.position.z;
            e[3 * 4 + 3] = 1;

            this.object.matrixAutoUpdate = false;
            this.object.matrix           = mat;
            this.object.updateMatrixWorld();
        },

        /**
         *  プレイヤーをカメラの向いている先に移動させる
         */
        move: function () {

            if (!this.initializedPose) {
                this.initPose();
                this.initializedPose = true;
            }

            var forwardVec4 = this.extractVector.clone().applyMatrix4(this.object.matrixWorld);
            var forward     = new THREE.Vector3(forwardVec4.x, forwardVec4.y, forwardVec4.z).setLength(this.speed);

            // 進行方向に少しだけ距離を加算
            this.position.sub(forward);

            var y = this.position.clone().sub(this.origin).normalize();
            var x = y.clone().cross(this.previousForward).normalize();
            var z = x.clone().cross(y).normalize();

            // 初期のZ軸（進行方向）を保持
            this.previousForward = z;

            var mat = new THREE.Matrix4();
            var e   = mat.elements;

            e[0 * 4 + 0] = x.x;
            e[0 * 4 + 1] = x.y;
            e[0 * 4 + 2] = x.z;
            e[0 * 4 + 3] = 0;

            e[1 * 4 + 0] = y.x;
            e[1 * 4 + 1] = y.y;
            e[1 * 4 + 2] = y.z;
            e[1 * 4 + 3] = 0;

            e[2 * 4 + 0] = z.x;
            e[2 * 4 + 1] = z.y;
            e[2 * 4 + 2] = z.z;
            e[2 * 4 + 3] = 0;

            e[3 * 4 + 0] = this.position.x;
            e[3 * 4 + 1] = this.position.y;
            e[3 * 4 + 2] = this.position.z;
            e[3 * 4 + 3] = 1;

            this.object.matrixAutoUpdate = false;
            this.object.matrix           = mat;
            this.object.updateMatrixWorld();
        }
    };


    //////////////////////////////////////////////////
    // 各種オブジェクトのセットアップ

    // Skysphereの生成
    var skysphereLoader = new THREE.TextureLoader();
    function onSkysphereTextureLoaded(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);

        var geometry = new THREE.SphereGeometry(5000, 128, 128);
        var material = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff,
            side: THREE.BackSide
        });

        var skysphere = new THREE.Mesh(geometry, material);
        skysphere.position.z = 0;
        scene.add(skysphere);
    }
    skysphereLoader.load('img/bg_skyplane.png', onSkysphereTextureLoaded);

    // 地球オブジェクトの生成
    var earth = new THREE.Object3D();
    var earthLoader = new THREE.TextureLoader();
    function onEarthTextureLoaded(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        var geometry = new THREE.SphereGeometry(0.3, 32, 32);
        var material = new THREE.MeshLambertMaterial({
            map: texture,
            color: 0xffffff
        });

        earth = new THREE.Mesh(geometry, material);
        earth.position.z = -1;
        scene.add(earth);
    }
    earthLoader.load('img/earth.jpg', onEarthTextureLoaded);

    // ライトの生成
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    var geometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    var material = new THREE.MeshLambertMaterial({
        color: 0x99ccff
    });
    var cube = new THREE.Mesh(geometry, material);

    var playerController = new PlayerController(cube);
    playerController.forward  = new THREE.Vector3(1, 0, 0);
    playerController.position = new THREE.Vector3(0, 0.5, -1);
    playerController.origin   = new THREE.Vector3(0, 0, -1);
    playerController.speed = 0.01;
    scene.add(playerController.object);


    //////////////////////////////////////////////////

    // アニメーションループ
    var lastRender = 0;
    function animate(timestamp) {
        var delta = Math.min(timestamp - lastRender, 500);
        lastRender = timestamp;

        earth.rotation.x += delta * 0.000015;
        earth.rotation.y += delta * 0.000025;

        playerController.move();

        renderer.render(scene, camera);

        // アニメーションループ
        requestAnimationFrame(animate);
    }

    // アニメーションの開始
    animate(performance ? performance.now() : Date.now());

}());