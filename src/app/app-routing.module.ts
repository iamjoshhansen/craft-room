import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CraftRoomPageComponent } from './pages/craft-room-page/craft-room-page.component';

const routes: Routes = [
  {
    path: '',
    component: CraftRoomPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
