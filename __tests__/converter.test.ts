import { dataConverter, Rect, ConnectionPoint, Point } from "../src/converter";

describe("dataConverter", () => {
  const rect1: Rect = { position: { x: 100, y: 100 }, size: { width: 80, height: 40 } };
  const rect2: Rect = { position: { x: 300, y: 200 }, size: { width: 100, height: 60 } };

  it("должен возвращать корректные точки для валидного соединения (горизонтально)", () => {
    const cp1: ConnectionPoint = { point: { x: 140, y: 100 }, angle: 0 };
    const cp2: ConnectionPoint = { point: { x: 250, y: 200 }, angle: 180 };
    const points = dataConverter(rect1, rect2, cp1, cp2);
    expect(points[0]).toEqual(cp1.point);
    expect(points[points.length - 1]).toEqual(cp2.point);
    expect(points.length).toBeGreaterThanOrEqual(3);
  });

  it("должен выдавать ошибку, если точка соединения не на грани", () => {
    const cp1: ConnectionPoint = { point: { x: 120, y: 100 }, angle: 0 };
    const cp2: ConnectionPoint = { point: { x: 250, y: 200 }, angle: 180 };
    expect(() => dataConverter(rect1, rect2, cp1, cp2)).toThrow();
  });

  it("должен выдавать ошибку, если угол не наружу", () => {
    const cp1: ConnectionPoint = { point: { x: 140, y: 100 }, angle: 180 }; 
    const cp2: ConnectionPoint = { point: { x: 250, y: 200 }, angle: 180 };
    expect(() => dataConverter(rect1, rect2, cp1, cp2)).toThrow();
  });

  it("должен работать для вертикального соединения", () => {
    const cp1: ConnectionPoint = { point: { x: 100, y: 80 }, angle: 270 };
    const cp2: ConnectionPoint = { point: { x: 300, y: 230 }, angle: 90 };
    const points = dataConverter(rect1, rect2, cp1, cp2);
    expect(points[0]).toEqual(cp1.point);
    expect(points[points.length - 1]).toEqual(cp2.point);
  });

  it("должен не выдавать ошибку, если прямоугольники пересекаются и соединение валидно", () => {
    const r1 = { position: { x: 100, y: 100 }, size: { width: 100, height: 100 } };
    const r2 = { position: { x: 120, y: 100 }, size: { width: 100, height: 100 } };
    const cp1: ConnectionPoint = { point: { x: 150, y: 100 }, angle: 0 };
    const cp2: ConnectionPoint = { point: { x: 70, y: 100 }, angle: 180 };
    expect(() => dataConverter(r1, r2, cp1, cp2)).not.toThrow();
  });
});
