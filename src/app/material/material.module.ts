import { NgModule } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';

const material =[
  MatMenuModule,
  MatIconModule,
  MatCardModule,
  MatDialogModule
]
@NgModule({
  imports: [material],
  exports: [material]
})
export class MaterialModule { }
