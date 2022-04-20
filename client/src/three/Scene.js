import React from "react";
import { Canvas } from "@react-three/fiber";

import Models from "./Models";

const container = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "black",
};

export default function Scene({ speech }) {
  return (
    <div style={container}>
      {/* Loading screen */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
						.panel {
							height: 500px;
							font-size: 25px;
							display: none;
						}
						.current {
							background-color: white;
							border-bottom-color: white;
							font-weight: bold;
						}
						.canvas-overlay {
							position: absolute;
							top: 0;
							left: 0;
							right: 0;
							bottom: 0;
							z-index: 10;
						}
					`,
        }}
      />
      <div className="canvas-overlay"></div>
      <Canvas>
        <Models speech={speech} />
      </Canvas>
    </div>
  );
}
