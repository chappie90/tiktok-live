import React, { useEffect, useState } from "react";
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
  const [loadCanvas, setLoadCanvas] = useState(false);
  // const cameraRotation = interpolate(frame, [0, 1], [-Math.PI, Math.PI]);
  // useFrame((state, delta) => (mesh.current.rotation.y += 0.01));

  useEffect(() => {
    document.getElementById("button")?.click();
  }, []);

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
						#canvas {
							width: 100vw;
							height: 100%;
							display: block;
							background: url('https://apod.nasa.gov/apod/image/1010/iotruecolor_galileo_big.jpg') no-repeat top center;
							background-size: contain;
							background-size: 90% auto;
							background-position: center 5%;
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
      <div className="canvas-overlay">
        {!loadCanvas && (
          <button
            id="button"
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              zIndex: 10,
              width: "500px",
              height: "200px",
              fontSize: "5rem",
            }}
            onClick={() => setLoadCanvas(true)}
          >
            Play me
          </button>
        )}
      </div>
      {loadCanvas && (
        <Canvas>
          <Models speech={speech} />
        </Canvas>
      )}
    </div>
  );
}
