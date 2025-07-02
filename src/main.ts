import { dataConverter, Rect, ConnectionPoint, Point } from "./converter";

type DragTarget =
  | { type: "rect"; index: number }
  | { type: "cp"; index: number }
  | null;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Начальные данные
let rects: Rect[] = [
  { position: { x: 100, y: 100 }, size: { width: 80, height: 40 } },
  { position: { x: 300, y: 200 }, size: { width: 100, height: 60 } },
];
let cps: ConnectionPoint[] = [
  { point: { x: 140, y: 100 }, angle: 0 },
  { point: { x: 250, y: 200 }, angle: 180 },
];

let dragTarget: DragTarget = null;
let dragOffset = { x: 0, y: 0 };

function drawRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  color: string = "#b5d0e6",
  border: string = "#7fa6c7"
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(
    rect.position.x - rect.size.width / 2,
    rect.position.y - rect.size.height / 2,
    rect.size.width,
    rect.size.height
  );
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCP(
  ctx: CanvasRenderingContext2D,
  cp: ConnectionPoint,
  color: string = "#f7b6b2"
) {
  ctx.save();
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 6;
  ctx.fillStyle = color;
  ctx.strokeStyle = "#e07a7a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cp.point.x, cp.point.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRect(ctx, rects[0], "#e6e6fa", "#b5b5d6");
  drawRect(ctx, rects[1], "#ffe4e1", "#e7b5b5");
  drawCP(ctx, cps[0], "#b5e6d0");
  drawCP(ctx, cps[1], "#f7b6b2");
  try {
    const points = dataConverter(rects[0], rects[1], cps[0], cps[1]);
    // Линия
    ctx.save();
    ctx.strokeStyle = "#a3b7e6";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++)
      ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
    // Больше не рисуем черные точки
  } catch (e) {
    ctx.save();
    ctx.fillStyle = "#e07a7a";
    ctx.font = "16px sans-serif";
    ctx.fillText((e as Error).message, 10, 20);
    ctx.restore();
  }
}

function isPointInRect(pt: Point, rect: Rect) {
  return (
    pt.x >= rect.position.x - rect.size.width / 2 &&
    pt.x <= rect.position.x + rect.size.width / 2 &&
    pt.y >= rect.position.y - rect.size.height / 2 &&
    pt.y <= rect.position.y + rect.size.height / 2
  );
}

function isPointNear(pt: Point, target: Point, r = 10) {
  return (pt.x - target.x) ** 2 + (pt.y - target.y) ** 2 <= r * r;
}

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouse: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  // Проверяем точки соединения
  for (let i = 0; i < cps.length; i++) {
    if (isPointNear(mouse, cps[i].point, 10)) {
      dragTarget = { type: "cp", index: i };
      dragOffset = { x: mouse.x - cps[i].point.x, y: mouse.y - cps[i].point.y };
      return;
    }
  }
  // Проверяем прямоугольники
  for (let i = 0; i < rects.length; i++) {
    if (isPointInRect(mouse, rects[i])) {
      dragTarget = { type: "rect", index: i };
      dragOffset = {
        x: mouse.x - rects[i].position.x,
        y: mouse.y - rects[i].position.y,
      };
      return;
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragTarget) return;
  const rect = canvas.getBoundingClientRect();
  const mouse: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  if (dragTarget.type === "rect") {
    rects[dragTarget.index].position.x = mouse.x - dragOffset.x;
    rects[dragTarget.index].position.y = mouse.y - dragOffset.y;
    // если cp лежит на грани, двигаем её вместе с прямоугольником)
    const cp = cps[dragTarget.index];
    const r = rects[dragTarget.index];
    if (
      Math.abs(cp.point.x - r.position.x) === r.size.width / 2 ||
      Math.abs(cp.point.y - r.position.y) === r.size.height / 2
    ) {
      cp.point.x = cp.point.x + (mouse.x - dragOffset.x - r.position.x);
      cp.point.y = cp.point.y + (mouse.y - dragOffset.y - r.position.y);
    }
  } else if (dragTarget.type === "cp") {
    const idx = dragTarget.index;
    cps[idx].point.x = mouse.x - dragOffset.x;
    cps[idx].point.y = mouse.y - dragOffset.y;
  }
  render();
});

canvas.addEventListener("mouseup", () => {
  if (dragTarget && dragTarget.type === "cp") {
    const cp = cps[dragTarget.index];
    const mx = cp.point.x;
    const my = cp.point.y;
    const snapDist = 10;
    let minDist = Infinity;
    let snapInfo: { x: number; y: number; angle: number } | null = null;
    // Перебираем все прямоугольники и все стороны
    rects.forEach((r) => {
      const left = r.position.x - r.size.width / 2;
      const right = r.position.x + r.size.width / 2;
      const top = r.position.y - r.size.height / 2;
      const bottom = r.position.y + r.size.height / 2;
      // left
      if (my >= top && my <= bottom) {
        const dist = Math.abs(mx - left);
        if (dist < minDist && dist < snapDist) {
          minDist = dist;
          snapInfo = {
            x: left,
            y: Math.max(top, Math.min(my, bottom)),
            angle: 180,
          };
        }
      }
      // right
      if (my >= top && my <= bottom) {
        const dist = Math.abs(mx - right);
        if (dist < minDist && dist < snapDist) {
          minDist = dist;
          snapInfo = {
            x: right,
            y: Math.max(top, Math.min(my, bottom)),
            angle: 0,
          };
        }
      }
      // top
      if (mx >= left && mx <= right) {
        const dist = Math.abs(my - top);
        if (dist < minDist && dist < snapDist) {
          minDist = dist;
          snapInfo = {
            x: Math.max(left, Math.min(mx, right)),
            y: top,
            angle: 270,
          };
        }
      }
      // bottom
      if (mx >= left && mx <= right) {
        const dist = Math.abs(my - bottom);
        if (dist < minDist && dist < snapDist) {
          minDist = dist;
          snapInfo = {
            x: Math.max(left, Math.min(mx, right)),
            y: bottom,
            angle: 90,
          };
        }
      }
    });
    if (snapInfo !== null) {
      cp.point.x = snapInfo.x;
      cp.point.y = snapInfo.y;
      cp.angle = snapInfo.angle;
    }
  }
  dragTarget = null;
  render();
});

canvas.addEventListener("mouseup", () => {
  dragTarget = null;
});

canvas.addEventListener("mouseleave", () => {
  dragTarget = null;
});

render();
