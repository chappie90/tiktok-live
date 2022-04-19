const { anim } = require("./src/three.js").default;

export const registerCustomAnimation = (host, name, clip, loopCount) => {
  host.AnimationFeature.addLayer(name);
  host.AnimationFeature.addAnimation(name, name, anim.AnimationTypes.single, {
    clip,
    loopCount,
  });
};
