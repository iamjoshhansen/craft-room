import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export interface Size {
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root',
})
export class WindowService {
  private sizeSubject = new BehaviorSubject<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  readonly size$ = this.sizeSubject.pipe(
    distinctUntilChanged((a, b) => a.width === b.width && a.height === b.height)
  );
  get size() {
    return this.sizeSubject.value;
  }

  get width() {
    return this.size.width;
  }

  get height() {
    return this.size.height;
  }

  width$ = this.size$.pipe(
    map((size) => size.width),
    distinctUntilChanged()
  );

  height$ = this.size$.pipe(
    map((size) => size.height),
    distinctUntilChanged()
  );

  constructor() {}

  setSize(size: Size) {
    this.sizeSubject.next(size);
  }
}
