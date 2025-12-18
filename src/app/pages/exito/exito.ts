import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../components/card/card';

@Component({
  selector: 'app-exito',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterLink],
  templateUrl: './exito.html'
})
export class ExitoComponent implements OnInit {
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  codigo: string = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.codigo = params['codigo'];
      
      if (!this.codigo) {
        this.router.navigate(['/']);
      }
    });
  }
}