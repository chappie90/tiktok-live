import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import AWS from "aws-sdk";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import glsl from "babel-plugin-glsl/macro";

import { ANIMATIONS_MAP, ANIMATION_FILES } from "./constants";
import { registerCustomAnimation } from "./utils";

// import glsl from "glslify";
const { aws } = require("./src/three.js").default;
const { HostObject, LipsyncFeature, GestureFeature, PointOfInterestFeature } =
  require("./src/three.js").default;
const { anim } = require("./src/three.js").default;
const glsl = require("glslify");

// console.log(
//   glsl(`
//   #pragma glslify: noise = require('glsl-noise/simplex/3d')

//   precision mediump float;
//   varying vec3 vpos;
//   void main () {
//     gl_FragColor = vec4(noise(vpos*25.0),1);
//   }
// `)
// );

let globalHost;

// Define the glTF assets that will represent the host
const characterFile = "models/characters/alien/alien.gltf";
// Read the gesture config file. This file contains options for splitting up
// each animation in gestures.glb into 3 sub-animations and initializing them
// as a QueueState animation.
const gestureConfigJson = "/models/animations/alien/gesture.json";
// Read the point of interest config file. This file contains options for
// creating Blend2dStates from look pose clips and initializing look layers
// on the PointOfInterestFeature.
const poiConfigJson = "/models/animations/alien/poi.json";

const AWS_CONFIG = {
  REGION: "us-east-1",
  IDENTITY_POOL_ID: "us-east-1:f3797df3-e57d-4a55-a04f-12bbb1ec0e01",
};

function AlienModel() {
  const getState = useThree((state) => state.get);
  const renderFn = [];
  const hostRef = useRef();

  // Configure AWS SDK to use anonymous identity and create Polly service objects
  async function main() {
    AWS.config.update({
      region: AWS_CONFIG.REGION,
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: AWS_CONFIG.IDENTITY_POOL_ID,
      }),
    });
    const polly = new AWS.Polly();
    const presigner = new AWS.Polly.Presigner();
    const speechInit = aws.TextToSpeechFeature.initializeService(
      polly,
      presigner,
      AWS.VERSION
    );

    const audioAttachJoint = "charhead"; // Name of the joint to attach audio to
    const lookJoint = "chargaze"; // Name of the joint to use for point of interest target tracking
    const voice = "Kevin";
    // const voice = "Kevin / Matthew / Justin / Russell (aka Doomer :)"; // Polly voice. Full list of available voices at: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
    const voiceEngine = "neural"; // Neural engine is not available for all voices in all regions: https://docs.aws.amazon.com/polly/latest/dg/NTTS-main.html

    // Set up the scene and host
    const { scene, camera, clock } = createScene();
    const {
      character: character2,
      clips: clips2,
      bindPoseOffset: bindPoseOffset2,
    } = await loadCharacter(scene, characterFile, ANIMATION_FILES);

    character2.position.set(0, 0, 1);
    character2.rotateY(0);

    // Find the joints defined by name
    const audioAttach2 = character2.getObjectByName(audioAttachJoint);
    const lookTracker2 = character2.getObjectByName(lookJoint);

    // Read the gesture config file. This file contains options for splitting up
    // each animation in gestures.glb into 3 sub-animations and initializing them
    // as a QueueState animation.
    const gestureConfig2 = await fetch(gestureConfigJson).then((response) =>
      response.json()
    );

    // Read the point of interest config file. This file contains options for
    // creating Blend2dStates from look pose clips and initializing look layers
    // on the PointOfInterestFeature.
    const poiConfig2 = await fetch(poiConfigJson).then((response) =>
      response.json()
    );

    const [
      idleClips2,
      lipsyncClips2,
      gestureClips2,
      emoteClips2,
      faceClips2,
      blinkClips2,
      poiClips2,
      hipHopClips,
      rumbaClips,
      joyfulJumpClips,
      thrillerPart3Clips,
      capoeiraClips,
      catwalkWalkTurn180TightClips,
      offensiveIdleClips,
      martelo2Clips,
      chapaGiratoriaClips,
      brooklynUprockClips,
      floatingClips,
      robotHipHopDanceClips,
      surprisedClips,
      sambaDancingClips,
      sittingClips,
      jumpingClips,
      hipHopDancing2Clips,
      spinInPlaceClips,
      fistFightAClips,
      breakDanceUprockVar2Clips,
      swingDancingClips,
      goalkeeperDropKickClips,
      breakdanceEnding2Clips,
      kickingClips,
      hipHopDancing3Clips,
      jazzDancingClips,
    ] = clips2;

    const host2 = createHost({
      character: character2,
      audioAttachJoint: audioAttach2,
      voice: voice,
      engine: voiceEngine,
      idleClip: idleClips2[0],
      faceIdleClip: faceClips2[0],
      lipsyncClips: lipsyncClips2,
      gestureClips: gestureClips2,
      gestureConfig: gestureConfig2,
      emoteClips: emoteClips2,
      blinkClips: blinkClips2,
      poiClips: poiClips2,
      hipHopClips: hipHopClips[0],
      rumbaClips: rumbaClips[0],
      joyfulJumpClips: joyfulJumpClips[0],
      thrillerPart3Clips: thrillerPart3Clips[0],
      capoeiraClips: capoeiraClips[0],
      catwalkWalkTurn180TightClips: catwalkWalkTurn180TightClips[0],
      offensiveIdleClips: offensiveIdleClips[0],
      martelo2Clips: martelo2Clips[0],
      chapaGiratoriaClips: chapaGiratoriaClips[0],
      brooklynUprockClips: brooklynUprockClips[0],
      floatingClips: floatingClips[0],
      robotHipHopDanceClips: robotHipHopDanceClips[0],
      surprisedClips: surprisedClips[0],
      sambaDancingClips: sambaDancingClips[0],
      sittingClips: sittingClips[0],
      jumpingClips: jumpingClips[0],
      hipHopDancing2Clips: hipHopDancing2Clips[0],
      spinInPlaceClips: spinInPlaceClips[0],
      fistFightAClips: fistFightAClips[0],
      breakDanceUprockVar2Clips: breakDanceUprockVar2Clips[0],
      swingDancingClips: swingDancingClips[0],
      goalkeeperDropKickClips: goalkeeperDropKickClips[0],
      breakdanceEnding2Clips: breakdanceEnding2Clips[0],
      kickingClips: kickingClips[0],
      hipHopDancing3Clips: hipHopDancing3Clips[0],
      jazzDancingClips: jazzDancingClips[0],
      poiConfig: poiConfig2,
      lookJoint: lookTracker2,
      bindPoseOffset: bindPoseOffset2,
      clock,
      camera,
      scene,
    });

    globalHost = host2;

    await speechInit;

    return host2;
  }

  // Set up base scene
  function createScene() {
    // Base scene
    const { camera, clock, gl: renderer, scene } = getState();
    // scene.background = new THREE.Color(0x000000);
    // scene.fog = new THREE.Fog(0x000000, 0, 10);

    // Renderer
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    // renderer.setClearColor(0x000000);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 0.6, 3.2);
    controls.target = new THREE.Vector3(0, 1.4, 0);
    controls.screenSpacePanning = true;
    controls.update();

    // Render loop
    function render() {
      requestAnimationFrame(render);
      renderFn.forEach((fn) => {
        fn();
      });
    }

    render();

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
    hemiLight.position.set(0, 1, 0);
    hemiLight.intensity = 0.6;
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 5, 5);

    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.top = 2.5;
    dirLight.shadow.camera.bottom = -2.5;
    dirLight.shadow.camera.left = -2.5;
    dirLight.shadow.camera.right = 2.5;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);

    const dirLightTarget = new THREE.Object3D();
    dirLight.add(dirLightTarget);
    dirLightTarget.position.set(0, -0.5, -1.0);
    dirLight.target = dirLightTarget;

    // Environment
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x808080,
      depthWrite: false,
    });
    var texture = new THREE.TextureLoader().load("/moon_texture.jpeg");
    var texture2 = new THREE.TextureLoader().load("/moon_texture_2.jpeg");

    var moonSurface = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: texture,
      displacementMap: texture2,
      displacementScale: 0.06,
      bumpMap: texture2,
      bumpScale: 0.24,
      reflectivity: 0,
      shininess: 0,
    });

    // groundMat.metalness = 0;
    // groundMat.refractionRatio = 0;
    const ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(100, 100),
      moonSurface
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    return { scene, camera, clock };
  }

  // Load character model and animations
  async function loadCharacter(scene, characterFile, animationFiles) {
    // Asset loader
    const gltfLoader = new GLTFLoader();

    function loadAsset(loader, assetPath, onLoad) {
      return new Promise((resolve) => {
        loader.load(assetPath, async (asset) => {
          if (onLoad[Symbol.toStringTag] === "AsyncFunction") {
            const result = await onLoad(asset);
            resolve(result);
          } else {
            resolve(onLoad(asset));
          }
        });
      });
    }

    // Load character model
    const { character, bindPoseOffset } = await loadAsset(
      gltfLoader,
      characterFile,
      (gltf) => {
        // Transform the character
        const character = gltf.scene;
        scene.add(character);

        // Make the offset pose additive
        const [bindPoseOffset] = gltf.animations;
        if (bindPoseOffset) {
          THREE.AnimationUtils.makeClipAdditive(bindPoseOffset);
        }

        // Cast shadows
        character.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = true;
          }
        });

        return { character, bindPoseOffset };
      }
    );

    // Load animations
    const clips = await Promise.all(
      animationFiles.map((file, index) => {
        return loadAsset(gltfLoader, file, async (gltf) => {
          return gltf.animations;
        });
      })
    );

    return { character, clips, bindPoseOffset };
  }

  // Initialize the host
  const createHost = ({
    character,
    audioAttachJoint,
    voice,
    engine,
    idleClip,
    faceIdleClip,
    lipsyncClips,
    gestureClips,
    gestureConfig,
    emoteClips,
    blinkClips,
    poiClips,
    hipHopClips,
    rumbaClips,
    joyfulJumpClips,
    thrillerPart3Clips,
    capoeiraClips,
    catwalkWalkTurn180TightClips,
    offensiveIdleClips,
    martelo2Clips,
    chapaGiratoriaClips,
    brooklynUprockClips,
    floatingClips,
    robotHipHopDanceClips,
    surprisedClips,
    sambaDancingClips,
    sittingClips,
    jumpingClips,
    hipHopDancing2Clips,
    spinInPlaceClips,
    fistFightAClips,
    breakDanceUprockVar2Clips,
    swingDancingClips,
    goalkeeperDropKickClips,
    breakdanceEnding2Clips,
    kickingClips,
    hipHopDancing3Clips,
    jazzDancingClips,
    poiConfig,
    lookJoint,
    bindPoseOffset,
    clock,
    camera,
    scene,
  }) => {
    // Add the host to the render loop
    const host = new HostObject({ owner: character, clock });
    renderFn.push(() => {
      host.update();
    });
    // Set up text to speech
    const audioListener = new THREE.AudioListener();
    camera.add(audioListener);
    host.addFeature(aws.TextToSpeechFeature, false, {
      listener: audioListener,
      attachTo: audioAttachJoint,
      voice,
      engine,
    });

    // Set up animation
    host.addFeature(anim.AnimationFeature);

    // Base idle
    host.AnimationFeature.addLayer("Base");
    host.AnimationFeature.addAnimation(
      "Base",
      idleClip.name,
      anim.AnimationTypes.single,
      { clip: idleClip }
    );
    host.AnimationFeature.playAnimation("Base", idleClip.name);

    // Face idle
    host.AnimationFeature.addLayer("Face", {
      blendMode: anim.LayerBlendModes.Additive,
    });
    THREE.AnimationUtils.makeClipAdditive(faceIdleClip);
    host.AnimationFeature.addAnimation(
      "Face",
      faceIdleClip.name,
      anim.AnimationTypes.single,
      {
        clip: THREE.AnimationUtils.subclip(
          faceIdleClip,
          faceIdleClip.name,
          1,
          faceIdleClip.duration * 30,
          30
        ),
      }
    );
    host.AnimationFeature.playAnimation("Face", faceIdleClip.name);

    // Blink
    host.AnimationFeature.addLayer("Blink", {
      blendMode: anim.LayerBlendModes.Additive,
      transitionTime: 0.075,
    });
    blinkClips.forEach((clip) => {
      THREE.AnimationUtils.makeClipAdditive(clip);
    });
    host.AnimationFeature.addAnimation(
      "Blink",
      "blink",
      anim.AnimationTypes.randomAnimation,
      {
        playInterval: 3,
        subStateOptions: blinkClips.map((clip) => {
          return {
            name: clip.name,
            loopCount: 1,
            clip,
          };
        }),
      }
    );
    host.AnimationFeature.playAnimation("Blink", "blink");

    // Talking idle
    host.AnimationFeature.addLayer("Talk", {
      transitionTime: 0.75,
      blendMode: anim.LayerBlendModes.Additive,
    });
    host.AnimationFeature.setLayerWeight("Talk", 0);
    const talkClip = lipsyncClips.find((c) => c.name === "stand_talk");
    lipsyncClips.splice(lipsyncClips.indexOf(talkClip), 1);
    host.AnimationFeature.addAnimation(
      "Talk",
      talkClip.name,
      anim.AnimationTypes.single,
      { clip: THREE.AnimationUtils.makeClipAdditive(talkClip) }
    );
    host.AnimationFeature.playAnimation("Talk", talkClip.name);

    // Gesture animations
    host.AnimationFeature.addLayer("Gesture", {
      transitionTime: 0.5,
      blendMode: anim.LayerBlendModes.Additive,
    });
    gestureClips.forEach((clip) => {
      const { name } = clip;
      const config = gestureConfig[name];
      THREE.AnimationUtils.makeClipAdditive(clip);

      if (config !== undefined) {
        config.queueOptions.forEach((option, index) => {
          // Create a subclip for each range in queueOptions
          option.clip = THREE.AnimationUtils.subclip(
            clip,
            `${name}_${option.name}`,
            option.from,
            option.to,
            30
          );
        });
        host.AnimationFeature.addAnimation(
          "Gesture",
          name,
          anim.AnimationTypes.queue,
          config
        );
      } else {
        host.AnimationFeature.addAnimation(
          "Gesture",
          name,
          anim.AnimationTypes.single,
          { clip }
        );
      }
    });

    // Emote animations
    host.AnimationFeature.addLayer("Emote", {
      transitionTime: 0.5,
    });

    emoteClips.forEach((clip) => {
      const { name } = clip;
      host.AnimationFeature.addAnimation(
        "Emote",
        name,
        anim.AnimationTypes.single,
        { clip, loopCount: 1 }
      );
    });

    // Custom animations
    // Hip Hop Dancing
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.HIP_HOP_DANCING,
      hipHopClips,
      1
    );
    // Rumba Dancing
    registerCustomAnimation(host, ANIMATIONS_MAP.RUMBA_DANCING, rumbaClips, 4);
    // Joyful Jump
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.JOYFUL_JUMP,
      joyfulJumpClips,
      3
    );
    // Thriller Part 3
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.THRILLER_PART_3,
      thrillerPart3Clips,
      1
    );
    // Capoeira
    registerCustomAnimation(host, ANIMATIONS_MAP.CAPOEIRA, capoeiraClips, 3);
    // Catwalk Walk Turn 180 Tight
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.CATWALK_WALK_TURN_180_TIGHT,
      catwalkWalkTurn180TightClips,
      3
    );
    // Offensive Idle
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.OFFENSIVE_IDLE,
      offensiveIdleClips,
      1
    );
    // Martelo 2
    registerCustomAnimation(host, ANIMATIONS_MAP.MARTELO_2, martelo2Clips, 3);
    // Chapa Giratoria
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.CHAPA_GIRATORIA,
      chapaGiratoriaClips,
      1
    );
    // Brooklyn Uprock
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.BROOKLYN_UPROCK,
      brooklynUprockClips,
      1
    );
    // Floating
    registerCustomAnimation(host, ANIMATIONS_MAP.FLOATING, floatingClips, 1);
    // Robot Hip Hop Dance
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.ROBOT_HIP_HOP_DANCE,
      robotHipHopDanceClips,
      1
    );
    // Surprised
    registerCustomAnimation(host, ANIMATIONS_MAP.SURPRISED, surprisedClips, 1);
    // Samba Dancing
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.SAMBA_DANCING,
      sambaDancingClips,
      1
    );
    // Sitting
    registerCustomAnimation(host, ANIMATIONS_MAP.SITTING, sittingClips, 1);
    // Jumping
    registerCustomAnimation(host, ANIMATIONS_MAP.JUMPING, jumpingClips, 1);
    // Hip Hop Dancing 2
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.HIP_HOP_DANCING_2,
      hipHopDancing2Clips,
      1
    );
    // Spin in Place
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.SPIN_IN_PLACE,
      spinInPlaceClips,
      1
    );
    // Fist Fight A
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.FIST_FIGHT_A,
      fistFightAClips,
      1
    );
    // Breakdance Uprock Var 2
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.BREAKDANCE_UPROCK_VAR_2,
      breakDanceUprockVar2Clips,
      1
    );
    // Swing Dancing
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.SWING_DANCING,
      swingDancingClips,
      1
    );
    // Goalkeeper Drop Kick
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.GOALKEEPER_DROP_KICK,
      goalkeeperDropKickClips,
      1
    );
    // Breakdance Ending 2
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.BREAKDANCE_ENDING_2,
      breakdanceEnding2Clips,
      1
    );
    // Kicking
    registerCustomAnimation(host, ANIMATIONS_MAP.KICKING, kickingClips, 1);
    // Hip Hop Dancing 3
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.HIP_HOP_DANCING_3,
      hipHopDancing3Clips,
      1
    );
    // Jazz Dancing
    registerCustomAnimation(
      host,
      ANIMATIONS_MAP.JAZZ_DANCING,
      jazzDancingClips,
      1
    );

    // Viseme poses
    host.AnimationFeature.addLayer("Viseme", {
      transitionTime: 0.12,
      blendMode: anim.LayerBlendModes.Additive,
    });
    host.AnimationFeature.setLayerWeight("Viseme", 0);

    // Slice off the reference frame
    const blendStateOptions = lipsyncClips.map((clip) => {
      THREE.AnimationUtils.makeClipAdditive(clip);
      return {
        name: clip.name,
        clip: THREE.AnimationUtils.subclip(clip, clip.name, 1, 2, 30),
        weight: 0,
      };
    });
    host.AnimationFeature.addAnimation(
      "Viseme",
      "visemes",
      anim.AnimationTypes.freeBlend,
      { blendStateOptions }
    );
    host.AnimationFeature.playAnimation("Viseme", "visemes");

    // POI poses
    poiConfig.forEach((config) => {
      host.AnimationFeature.addLayer(config.name, {
        blendMode: anim.LayerBlendModes.Additive,
      });

      // Find each pose clip and make it additive
      config.blendStateOptions.forEach((clipConfig) => {
        const clip = poiClips.find((clip) => clip.name === clipConfig.clip);
        THREE.AnimationUtils.makeClipAdditive(clip);
        clipConfig.clip = THREE.AnimationUtils.subclip(
          clip,
          clip.name,
          1,
          2,
          30
        );
      });

      host.AnimationFeature.addAnimation(
        config.name,
        config.animation,
        anim.AnimationTypes.blend2d,
        { ...config }
      );

      host.AnimationFeature.playAnimation(config.name, config.animation);

      // Find and store reference objects
      config.reference = character.getObjectByName(
        config.reference.replace(":", "")
      );
    });

    // Apply bindPoseOffset clip if it exists
    if (bindPoseOffset !== undefined) {
      host.AnimationFeature.addLayer("BindPoseOffset", {
        blendMode: anim.LayerBlendModes.Additive,
      });
      host.AnimationFeature.addAnimation(
        "BindPoseOffset",
        bindPoseOffset.name,
        anim.AnimationTypes.single,
        {
          clip: THREE.AnimationUtils.subclip(
            bindPoseOffset,
            bindPoseOffset.name,
            1,
            2,
            30
          ),
        }
      );
      host.AnimationFeature.playAnimation(
        "BindPoseOffset",
        bindPoseOffset.name
      );
    }

    // Set up Lipsync
    const visemeOptions = {
      layers: [{ name: "Viseme", animation: "visemes" }],
    };
    const talkingOptions = {
      layers: [
        {
          name: "Talk",
          animation: "stand_talk",
          blendTime: 0.75,
          easingFn: anim.Easing.Quadratic.InOut,
        },
      ],
    };
    host.addFeature(LipsyncFeature, false, visemeOptions, talkingOptions);

    // Set up Gestures
    host.addFeature(GestureFeature, false, {
      layers: {
        Gesture: { minimumInterval: 3 },
        Emote: {
          blendTime: 0.5,
          easingFn: anim.Easing.Quadratic.InOut,
        },
      },
    });

    // Set up Point of Interest
    host.addFeature(
      PointOfInterestFeature,
      false,
      {
        target: camera,
        lookTracker: lookJoint,
        scene,
      },
      {
        layers: poiConfig,
      },
      {
        layers: [{ name: "Blink" }],
      }
    );

    console.log("host");
    console.log(host);

    return host;
  };

  function createImageParticles() {
    const { scene } = getState();

    let texture = new THREE.TextureLoader().load("/image_particles.png");

    const geometry = new THREE.InstancedBufferGeometry();

    // Positions
    const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
    positions.setXYZ(0, -0.5, 0.5, 0.0);
    positions.setXYZ(1, 0.5, 0.5, 0.0);
    positions.setXYZ(2, -0.5, -0.5, 0.0);
    positions.setXYZ(3, 0.5, -0.5, 0.0);
    geometry.setAttribute("position", positions);

    // UVs
    const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
    uvs.setXYZ(0, 0.0, 0.0);
    uvs.setXYZ(1, 1.0, 0.0);
    uvs.setXYZ(2, 0.0, 1.0);
    uvs.setXYZ(3, 1.0, 1.0);
    geometry.setAttribute("uv", uvs);

    // Index
    geometry.setIndex(
      new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]))
    );

    const width = 320;
    const height = 180;
    const numPoints = width * height;

    // Loop through the pixels of the image and assign our instanced attributes
    const indices = new Uint16Array(numPoints);
    const offsets = new Float32Array(numPoints * 3);
    const angles = new Float32Array(numPoints);

    for (let i = 0; i < numPoints; i++) {
      offsets[i * 3 + 0] = i % width;
      offsets[i * 3 + 1] = Math.floor(i / width);

      indices[i] = i;
      angles[i] = Math.random() * Math.PI;
    }

    geometry.setAttribute(
      "pindex",
      new THREE.InstancedBufferAttribute(indices, 1, false)
    );
    geometry.setAttribute(
      "offset",
      new THREE.InstancedBufferAttribute(offsets, 3, false)
    );
    geometry.setAttribute(
      "angle",
      new THREE.InstancedBufferAttribute(angles, 1, false)
    );

    const uniforms = {
      uTime: { value: 0 },
      uRandom: { value: 1.0 },
      uDepth: { value: 2.0 },
      uSize: { value: 0.0 },
      uTextureSize: { value: new THREE.Vector2(width, height) },
      uTexture: { value: texture },
      uTouch: { value: null },
    };

    const material = new THREE.RawShaderMaterial({
      uniforms,
      vertexShader: glsl(require("./shaders/particle-compiled.vert")),
      fragmentShader: glsl(require("./shaders/particle-compiled.frag")),
      // vertexShader,
      // fragmentShader,
      depthTest: false,
      transparent: true,
    });

    // See if you need to add optimisation of discarding dark pixels
    const partImg = new THREE.Mesh(geometry, material);
    partImg.position.set([2, 2, 2]);
    // console.log(partImg);
    scene.add(partImg);
  }

  function createStarParticles() {
    let particleSystem, geometry;
    geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    const color = new THREE.Color();
    const particles = 6000;
    const radius = 200;

    for (let i = 0; i < particles; i++) {
      positions.push(Math.random() * 600 - 300);
      positions.push(Math.random() * 600 - 300);
      positions.push(Math.random() * 600 - 300);
      color.setHSL(i / particles, 1.0, 0.5);

      colors.push(color.r, color.g, color.b);

      sizes.push(0.7);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(sizes, 1).setUsage(
        THREE.DynamicDrawUsage
      )
    );

    let sprite = new THREE.TextureLoader().load("/star.png");
    let starMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.7,
      map: sprite,
    });

    particleSystem = new THREE.Points(geometry, starMaterial);
    const { scene } = getState();
    scene.add(particleSystem);

    // Animate stars background
    renderFn.push(() => {
      const time = Date.now() * 0.0015;
      particleSystem.rotation.z = 0.01 * time;
    });
  }

  // function createImageParticles2() {
  //   const { scene } = getState();

  //   const ww = window.innerWidth;
  //   const wh = window.innerHeight;
  //   const speed = 10;
  //   let particles;

  //   const centerVector = new THREE.Vector3(0, 0, 0);

  //   const getImageData = (image) => {
  //     const canvas = document.createElement("canvas");
  //     canvas.width = image.width;
  //     canvas.height = image.height;

  //     const ctx = canvas.getContext("2d");
  //     ctx.drawImage(image, 0, 0);

  //     return ctx.getImageData(0, 0, image.width, image.height);
  //   };

  //   const drawTheMap = () => {
  //     const geometry = new THREE.BufferGeometry();
  //     const material = new THREE.PointsMaterial({
  //       size: 3,
  //       color: 0x024059,
  //       sizeAttenuation: false,
  //     });
  //     const radius = 0.02;
  //     // let vertices = [];
  //     const positions = [];
  //     const sizes = [];
  //     console.log(imagedata);

  //     for (var y = 0, y2 = imagedata.height; y < y2; y += 2) {
  //       for (var x = 0, x2 = imagedata.width; x < x2; x += 2) {
  //         if (imagedata.data[x * 4 + y * 4 * imagedata.width] < 128) {
  //           // var vertex = new THREE.Vector3();
  //           // vertex.x = x - imagedata.width / 2;
  //           // vertex.y = -y + imagedata.height / 2;
  //           // vertex.z = -Math.random() * 500;

  //           const _x = x - imagedata.width / 2;
  //           const _y = -y + imagedata.height / 2;
  //           const _z = -Math.random() * 500;
  //           // vertices.push(_x, _y, _z);
  //           positions.push(_x * radius);
  //           positions.push(_y * radius);
  //           positions.push(_z * radius);

  //           // sizes.push(20);

  //           // // vertex.speed = Math.random() / speed + 0.015;

  //           // vertices.push(vertex);
  //         }
  //       }
  //     }
  //     console.log(positions);

  //     geometry.setAttribute(
  //       "position",
  //       new THREE.Float32BufferAttribute(positions, 3)
  //     );
  //     geometry.setAttribute(
  //       "size",
  //       new THREE.Float32BufferAttribute(sizes, 1).setUsage(
  //         THREE.DynamicDrawUsage
  //       )
  //     );
  //     particles = new THREE.Points(geometry, material);

  //     scene.add(particles);
  //   };

  //   const image = new Image();
  //   // image.src = "/star.png";
  //
  //
  //   image.width = 100;
  //   image.height = 100;
  //   const imagedata = getImageData(image);
  //   drawTheMap();
  // }

  function createGlobeParticles() {
    const { scene } = getState();
    let g = new THREE.SphereGeometry(1.2, 360, 180);
    // let g = new THREE.SphereGeometry(10, 360, 180);
    let m = new THREE.PointsMaterial({
      // size: 0.05,
      size: 0.01,
      onBeforeCompile: (shader) => {
        shader.uniforms.tex = {
          value: new THREE.TextureLoader().load(
            // "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/64a89c3da47c729eac4e6aaf600873fd~c5_100x100.jpeg?x-expires=1649455200&x-signature=CzFZEeITdFx2jmWWP9%2B5Zsy6eCs%3D"
            "https://dummyimage.com/1920x1920/000/fff.png&text=Thank+you"
          ),
        };
        shader.vertexShader = `
    varying vec2 vUv;
    ${shader.vertexShader}
  `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
      vUv = uv;
    `
        );
        //console.log(shader.vertexShader);
        shader.fragmentShader = `
    uniform sampler2D tex;
    varying vec2 vUv;
    ${shader.fragmentShader}
  `.replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `
    vec3 col = texture2D(tex, vUv).rgb;
    col *= diffuse;
    vec4 diffuseColor = vec4( col, opacity );`
        );
        //console.log(shader.fragmentShader);
      },
    });
    let p = new THREE.Points(g, m);
    p.position.set(0, 1.8, 0);
    scene.add(p);
  }

  useEffect(() => {
    (async () => {
      try {
        hostRef.current = await main();
      } catch (err) {
        console.log(err);
      }
      createStarParticles();
      createImageParticles();
      // createImageParticles2();
      // createGlobeParticles();
    })();
  }, []);

  return <></>;
}

export default function Models() {
  return <AlienModel />;
}

export const hostSpeak = async (text) => {
  // const speech = `
  // <speak>
  //   <prosody rate="95%">
  //     ${text}
  //   </prosody>
  // </speak>
  // `
  const speech = text;
  await globalHost.TextToSpeechFeature.play(speech);
};

export const hostPlayGesture = async (gestureName, emoteType) => {
  await globalHost.GestureFeature.playGesture(gestureName, emoteType);
};

// useGLTF.preload(alienModel);
