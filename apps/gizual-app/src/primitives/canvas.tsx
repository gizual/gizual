import React from "react";

function render(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.fillStyle = "green";
  ctx.fillRect(10, 10, 100, 100);
  ctx.stroke();
}

// Todo: Simple bar top-down layout for now.
function layout() { }

function Canvas() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  React.useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) render(ctx);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="gizual-main"
      width="100%"
      height="100%"
      style={{ backgroundColor: "black" }}
    />
  );
}

export default Canvas;
