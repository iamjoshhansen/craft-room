import { Component, HostListener } from '@angular/core';
import { WindowService } from './services/window.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private windowService: WindowService) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.windowService.setSize({
      width: event.target.innerWidth,
      height: event.target.innerHeight,
    });
  }
}
