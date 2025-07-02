export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = { position: Point; size: Size };
export type ConnectionPoint = { point: Point; angle: number };

const DEG_TO_RAD = Math.PI / 180;
const EPSILON = 1e-6;

function nearlyEqual(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

function isPointOnRectEdge(point: Point, rect: Rect): boolean {
  const { x, y } = point;
  const left = rect.position.x - rect.size.width / 2;
  const right = rect.position.x + rect.size.width / 2;
  const top = rect.position.y - rect.size.height / 2;
  const bottom = rect.position.y + rect.size.height / 2;

  const onVertical =
    (nearlyEqual(x, left) || nearlyEqual(x, right)) && y >= top && y <= bottom;
  const onHorizontal =
    (nearlyEqual(y, top) || nearlyEqual(y, bottom)) && x >= left && x <= right;

  return onVertical || onHorizontal;
}

function isAngleValid(point: Point, angle: number, rect: Rect): boolean {
  const rad = angle * DEG_TO_RAD;
  const dir: Point = { x: Math.cos(rad), y: Math.sin(rad) };

  const dx = point.x - rect.position.x;
  const dy = point.y - rect.position.y;
  const w = rect.size.width / 2;
  const h = rect.size.height / 2;

  if (nearlyEqual(Math.abs(dx), w)) {
    return dx * dir.x > 0 && nearlyEqual(dir.y, 0);
  } else if (nearlyEqual(Math.abs(dy), h)) {
    return dy * dir.y > 0 && nearlyEqual(dir.x, 0);
  }

  return false;
}

function getExitPoint(cp: ConnectionPoint): Point {
  const angleRad = cp.angle * DEG_TO_RAD;
  const OFFSET = 10;
  return {
    x: cp.point.x + Math.cos(angleRad) * OFFSET,
    y: cp.point.y + Math.sin(angleRad) * OFFSET,
  };
}

export const dataConverter = (
  rect1: Rect,
  rect2: Rect,
  cPoint1: ConnectionPoint,
  cPoint2: ConnectionPoint
): Point[] => {
  if (!isPointOnRectEdge(cPoint1.point, rect1)) {
    throw new Error(
      "Точка соединения 1 не лежит на грани первого прямоугольника"
    );
  }
  if (!isPointOnRectEdge(cPoint2.point, rect2)) {
    throw new Error(
      "Точка соединения 2 не лежит на грани второго прямоугольника"
    );
  }
  if (!isAngleValid(cPoint1.point, cPoint1.angle, rect1)) {
    throw new Error("Угол 1 не перпендикулярен грани или не направлен наружу");
  }
  if (!isAngleValid(cPoint2.point, cPoint2.angle, rect2)) {
    throw new Error("Угол 2 не перпендикулярен грани или не направлен наружу");
  }

  const start = getExitPoint(cPoint1);
  const end = getExitPoint(cPoint2);

  const points: Point[] = [cPoint1.point, start];

  if (nearlyEqual(start.x, end.x) || nearlyEqual(start.y, end.y)) {
    points.push(end);
  } else {
    const mid1: Point = { x: end.x, y: start.y };
    const mid2: Point = { x: end.x, y: end.y };

    points.push(mid1, mid2);
  }

  points.push(cPoint2.point);
  return points;
};
