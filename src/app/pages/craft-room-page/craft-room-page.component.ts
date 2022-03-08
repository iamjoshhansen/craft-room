import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { delay, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Size, WindowService } from 'src/app/services/window.service';

enum Dir {
  U,
  D,
  L,
  R,
}

type Spec = [Dir, number];

const specs: Spec[] = [
  [Dir.R, 77.5],
  [Dir.U, 42],
  [Dir.R, 76], // tip-top
  [Dir.D, 42],
  [Dir.R, 101.75],
  [Dir.D, 180.5], // right wall
  [Dir.L, 255],
  [Dir.U, 18.5], // small unknown
  [Dir.L, 6.75], // small unknown
  [Dir.U, 47.5], // stairs
  [Dir.R, 30],
  [Dir.U, 47.5], // stairs
  [Dir.L, 23.5],
  [Dir.U, 67],
];

interface Point {
  x: number;
  y: number;
}

interface Segment {
  a: Point;
  b: Point;
}

const walls: Segment[] = [];

function getPointFromSpec({ x, y }: Point, [dir, amount]: Spec): Point {
  switch (dir) {
    case Dir.D:
      return {
        x,
        y: y + amount,
      };
    case Dir.L:
      return {
        x: x - amount,
        y,
      };
    case Dir.U:
      return {
        x,
        y: y - amount,
      };
    case Dir.R:
      return {
        x: x + amount,
        y,
      };
  }
}

class Viewport {
  private pointMap = new Map<string, Point>();

  get points() {
    return [...this.pointMap.values()];
  }

  constructor(points: Point[] = []) {
    points.forEach((point) => this.addPoint(point));
  }

  static pointKey(point: Point): string {
    return `${point.x}_${point.y}`;
  }

  addPoint(point: Point) {
    this.pointMap.set(Viewport.pointKey(point), point);
  }

  get left() {
    return Math.min(...this.points.map((point) => point.x));
  }

  get right() {
    return Math.max(...this.points.map((point) => point.x));
  }

  get top() {
    return Math.max(...this.points.map((point) => point.y));
  }

  get bottom() {
    return Math.min(...this.points.map((point) => point.y));
  }

  get size(): Size {
    return {
      width: this.right - this.left,
      height: this.top - this.bottom,
    };
  }

  get center(): Point {
    const size = this.size;
    return {
      x: this.left + size.width / 2,
      y: this.top + size.height / 2,
    };
  }

  boundaries(padding = 0) {
    const left = this.left - padding;
    const right = this.right + padding;
    const top = this.top + padding;
    const bottom = this.bottom - padding;
    const width = right - left;
    const height = top - bottom;
    const centerX = left + width / 2;
    const centerY = bottom + height / 2;

    return {
      left,
      right,
      top,
      bottom,
      width,
      height,
      centerX,
      centerY,
    };
  }
}

const cursor: Point = { x: 0, y: 0 };
specs.forEach((spec) => {
  const a = JSON.parse(JSON.stringify(cursor));
  const b = getPointFromSpec(a, spec);
  walls.push({
    a,
    b,
  });
  cursor.x = b.x;
  cursor.y = b.y;
});

@Component({
  selector: 'app-craft-room-page',
  templateUrl: './craft-room-page.component.html',
  styleUrls: ['./craft-room-page.component.scss'],
})
export class CraftRoomPageComponent implements AfterViewInit, OnDestroy {
  private destroyed = new Subject<void>();

  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  canvasStyle = { width: '0', height: '0' };

  // offsetX$ = of(0);
  // offsetY$ = of(0);

  private offsetXSubject = new BehaviorSubject<number>(0);
  readonly offsetX$ = this.offsetXSubject.pipe(distinctUntilChanged());
  get offsetX() {
    return this.offsetXSubject.value;
  }
  set offsetX(val: number) {
    this.offsetXSubject.next(val);
  }

  private offsetYSubject = new BehaviorSubject<number>(0);
  readonly offsetY$ = this.offsetYSubject.pipe(distinctUntilChanged());
  get offsetY() {
    return this.offsetYSubject.value;
  }
  set offsetY(val: number) {
    this.offsetYSubject.next(val);
  }

  constructor(private windowService: WindowService) {}

  ngAfterViewInit(): void {
    combineLatest([this.windowService.size$, this.offsetX$, this.offsetY$])
      .pipe(takeUntil(this.destroyed), delay(10))
      .subscribe(([size, offsetX, offsetY]) => {
        this.canvasStyle = {
          width: `${size.width}px`,
          height: `${size.height}px`,
        };

        const canvas: undefined | HTMLCanvasElement =
          this.canvasRef?.nativeElement;

        if (canvas) {
          canvas.width = size.width;
          canvas.height = size.height;
          const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
          this.draw(ctx, size, {
            x: offsetX,
            y: offsetY,
          });
        }
      });
  }

  ngOnDestroy() {
    this.destroyed.next();
  }

  private draw(ctx: CanvasRenderingContext2D, size: Size, offset: Point) {
    ctx.save();

    const viewport = new Viewport([
      ...walls.map((wall) => wall.a),
      ...walls.map((wall) => wall.b),
    ]);

    const { width, height, centerX, centerY, left, bottom, top, right } =
      viewport.boundaries(10);

    const splitScale = {
      x: size.width / width,
      y: size.height / height,
    };
    const scale = Math.min(splitScale.x, splitScale.y);

    ctx.translate(size.width / 2, size.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    ctx.save();
    walls.forEach((wall, i) => {
      ctx[i === 0 ? 'moveTo' : 'lineTo'](wall.a.x, wall.a.y);
    });
    ctx.fillStyle = `#fff`;
    ctx.fill();
    ctx.clip();

    ctx.lineWidth = 1 / scale;

    ctx.beginPath();
    let leftI = left + offset.x;
    while (leftI < right) {
      ctx.moveTo(leftI, top);
      ctx.lineTo(leftI, bottom);
      leftI += 12;
    }

    let bottomI = bottom + offset.y;
    while (bottomI < top) {
      ctx.moveTo(left, bottomI);
      ctx.lineTo(right, bottomI);
      bottomI += 12;
    }

    ctx.stroke();
    ctx.closePath();

    ctx.restore();

    // Draw the Walls

    ctx.lineWidth = 3 / scale;
    ctx.lineCap = 'square';

    walls.forEach((wall) => {
      ctx.beginPath();
      ctx.moveTo(wall.a.x, wall.a.y);
      ctx.lineTo(wall.b.x, wall.b.y);
      ctx.stroke();
      ctx.closePath();
    });

    ctx.restore();
  }
}
