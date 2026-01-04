import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TerminosModalComponent } from '../../components/terminos-modal/terminos-modal';
import { ReclamosService } from '../../services/reclamos.service';
import { NotificacionService } from '../../services/notificacion';

@Component({
  selector: 'app-iniciar-reclamo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TerminosModalComponent],
  templateUrl: './iniciar-reclamo.html',
  styleUrl: './iniciar-reclamo.scss'
})
export class IniciarReclamoComponent implements OnInit {

  private fb = inject(FormBuilder);
  private reclamosService = inject(ReclamosService); 
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificacionService = inject(NotificacionService);

  mostrarTerminos = true; 
  isLoading = false;
  pasoActual = 0; 
  
  aseguradoras = [
    'Federacion Patronal', 'Allianz', 'Zurich', 'San Cristobal', 'La Caja Seguros',
    'La Equitativa del Plata', 'Sancor', 'La Meridional', 'Mapfre', 'Provincia Seguros',
    'HDI', 'S.M.G', 'Experta', 'Rivadavia', 'Galicia', 'Integrity', 'La Segunda',
    'Nacion', 'Segurcoop', 'Mercantil Andina', 'Berkley', 'Colon', 'Victoria',
    'El Norte', 'La Holando Sudamericana', 'Cooperacion Mutual', 'Otra'
  ];

  // --- PATRONES ---
  private nombrePattern = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/;
  private dniPattern = /^[0-9]{7,8}$/;
  private telPattern = /^[0-9]{10,13}$/;
  private patentePattern = /^[a-zA-Z0-9]{6,7}$/;

  reclamoForm = this.fb.group({
    codigo_ref: [''],
    
    // 👇 APLICAMOS EL VALIDADOR DE ESPACIOS
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(this.nombrePattern), this.noWhitespaceValidator]],
    
    dni: ['', [Validators.required, Validators.pattern(this.dniPattern)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(this.telPattern)]],

    rol_victima: ['', Validators.required],
    tiene_seguro: [true], 
    in_itinere: [false],
    posee_art: [false],

    fecha_hecho: ['', [Validators.required, this.fechaValidator]], 
    hora_hecho: [''],
    
    // 👇 TAMBIÉN ACÁ
    lugar_hecho: ['', [Validators.required, Validators.minLength(5), this.noWhitespaceValidator]],
    localidad: ['', [Validators.required, Validators.minLength(4), this.noWhitespaceValidator]],
    
    relato_hecho: [''], // Se valida dinámicamente

    aseguradora_tercero: ['', Validators.required],
    patente_tercero: ['', [Validators.pattern(this.patentePattern)]],
    patente_propia: ['', [Validators.pattern(this.patentePattern)]], 

    fileDNI: [null],
    fileLicencia: [null],
    fileCedula: [null],
    fileSeguro: [null],
    fileDenuncia: [null],
    fileFotos: [null], 
    fileMedicos: [null],
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: any) => {
      const referido = params['ref'];
      if (referido) this.reclamoForm.patchValue({ codigo_ref: referido });
    });
  }

  // --- ⛔ VALIDADOR ANTI-ESPACIOS ---
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }

  // --- VALIDADOR DE FECHA ---
  fechaValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const fecha = new Date(control.value);
    const hoy = new Date();
    const limitePasado = new Date();
    limitePasado.setFullYear(hoy.getFullYear() - 3);

    if (fecha > hoy) return { futuro: true };
    if (fecha < limitePasado) return { prescripto: true };

    return null;
  }

  get f() { return this.reclamoForm.controls; }

  aceptarTerminos() { this.mostrarTerminos = false; }
  cancelarTerminos() { this.router.navigate(['/']); }

  seleccionarRol(rol: string) {
    this.reclamoForm.patchValue({ rol_victima: rol });
    if (rol !== 'Conductor') {
      this.reclamoForm.patchValue({ tiene_seguro: false, in_itinere: false, posee_art: false });
    } else {
      this.reclamoForm.patchValue({ tiene_seguro: true });
    }
    this.actualizarValidaciones(rol);
    this.pasoActual = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAStep1() { this.pasoActual = 0; }

  toggleSeguro(checked: boolean) {
    this.reclamoForm.patchValue({ tiene_seguro: checked });
    this.actualizarValidaciones(this.reclamoForm.get('rol_victima')?.value || 'Conductor');
  }

  actualizarValidaciones(rol: string) {
    const c = this.reclamoForm.controls;
    const tieneSeguro = this.reclamoForm.get('tiene_seguro')?.value;

    ['patente_propia', 'patente_tercero', 'relato_hecho', 'fileLicencia', 'fileCedula', 'fileSeguro', 'fileDenuncia', 'fileMedicos']
      .forEach(key => {
        // @ts-ignore
        c[key]?.clearValidators();
        // @ts-ignore
        c[key]?.updateValueAndValidity();
        
        if (key.includes('patente')) {
            // @ts-ignore
            c[key]?.addValidators(Validators.pattern(this.patentePattern));
        }
      });

    // LÓGICA CONDICIONAL CON EL NUEVO VALIDADOR
    if (rol === 'Conductor' && tieneSeguro) {
        c.patente_propia.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
        c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
        c.fileLicencia.setValidators([Validators.required]);
        c.fileCedula.setValidators([Validators.required]);
        c.fileSeguro.setValidators([Validators.required]);
    }
    else if (rol === 'Conductor' && !tieneSeguro) {
        c.patente_propia.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
        c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
        c.fileLicencia.setValidators([Validators.required]);
        c.fileCedula.setValidators([Validators.required]);
        
        // 👇 AQUÍ AGREGAMOS EL VALIDADOR AL RELATO
        c.relato_hecho.setValidators([Validators.required, Validators.minLength(20), this.noWhitespaceValidator]);
    }
    else { 
        c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
        // 👇 Y AQUÍ TAMBIÉN
        c.relato_hecho.setValidators([Validators.required, Validators.minLength(20), this.noWhitespaceValidator]);
    }

    c.fileFotos.setValidators([Validators.required]);
    this.reclamoForm.updateValueAndValidity();
  }

  onFileChange(event: any, controlName: string) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        this.notificacionService.showError('Archivo muy pesado (Máx 5MB).');
        event.target.value = ''; return;
      }
      
      const tiposValidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!tiposValidos.includes(file.type)) {
         this.notificacionService.showError('Formato inválido. Solo JPG, PNG o PDF.');
         event.target.value = ''; return;
      }

      this.reclamoForm.patchValue({ [controlName]: file });
    }
  }

  onSubmit() {
    if (this.reclamoForm.invalid) {
      this.reclamoForm.markAllAsTouched(); 
      
      if (this.reclamoForm.get('fecha_hecho')?.errors?.['futuro']) {
         this.notificacionService.showError('La fecha no puede ser futura.');
         return;
      }
      if (this.reclamoForm.get('fecha_hecho')?.errors?.['prescrito']) {
         this.notificacionService.showError('El reclamo tiene más de 3 años.');
         return;
      }

      this.notificacionService.showError('Revisá los campos marcados en rojo.');
      return;
    }

    this.isLoading = true;
    const v = this.reclamoForm.value;
    const formData = new FormData();

    Object.keys(v).forEach(key => {
        if (key.startsWith('file')) {
            // @ts-ignore
            if (v[key]) formData.append(key, v[key]);
        } else if (key === 'in_itinere' || key === 'posee_art' || key === 'tiene_seguro') {
             // @ts-ignore
             formData.append(key, String(v[key]));
        } else {
             // @ts-ignore
             if (v[key]) formData.append(key, v[key]);
        }
    });

    if (v.rol_victima === 'Conductor' && !v.in_itinere) {
        formData.set('posee_art', 'false');
    }

    this.reclamosService.crearReclamo(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.router.navigate(['/exito'], { state: { codigo: res.codigo_seguimiento, nombre: v.nombre } });
      },
      error: (err) => {
        this.isLoading = false;
        this.notificacionService.showError('Error de conexión. Intente nuevamente.');
      }
    });
  }

  getFileName(controlName: string): string {
    const file = this.reclamoForm.get(controlName)?.value;
    return (file && file instanceof File) ? file.name : '';
  }

  get esConductor(): boolean { return this.reclamoForm.get('rol_victima')?.value === 'Conductor'; }
  get tieneSeguro(): boolean { return this.reclamoForm.get('tiene_seguro')?.value === true; }
  get isInItinere(): boolean { return this.reclamoForm.get('in_itinere')?.value === true; }
}