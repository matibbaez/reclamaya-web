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
  private cbuPattern = /^[0-9]{22}$/;

  reclamoForm = this.fb.group({
    codigo_ref: [''],
    // Paso 1: Datos Personales
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(this.nombrePattern), this.noWhitespaceValidator]],
    dni: ['', [Validators.required, Validators.pattern(this.dniPattern)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(this.telPattern)]],
    domicilio_usuario: ['', [Validators.required, Validators.minLength(5), this.noWhitespaceValidator]],
    
    // Rol y preguntas iniciales
    rol_victima: ['', Validators.required],
    tiene_seguro: [true], 
    sufrio_lesiones: [false], // Nuevo: Checkbox lesiones
    
    // Paso 2: Detalles del Hecho
    in_itinere: [false],
    posee_art: [false],
    fecha_hecho: ['', [Validators.required, this.fechaValidator]], 
    hora_hecho: [''],
    lugar_hecho: ['', [Validators.required, Validators.minLength(5), this.noWhitespaceValidator]],
    localidad: ['', [Validators.required]],
    relato_hecho: [''], // Obligatorio si no hay seguro
    intervino_policia: [false], // Nuevo
    intervino_ambulancia: [false], // Nuevo

    // Datos del Tercero (Paso 3)
    tercero_nombre: [''], // Nuevo
    tercero_apellido: [''], // Nuevo
    tercero_dni: [''], // Nuevo
    tercero_marca_modelo: [''], // Nuevo
    aseguradora_tercero: ['', Validators.required],
    patente_tercero: ['', [Validators.pattern(this.patentePattern)]],
    
    // Datos Propios (Si es conductor)
    patente_propia: ['', [Validators.pattern(this.patentePattern)]], 
    cbu: ['', [Validators.pattern(this.cbuPattern)]], // CBU numerico

    // Archivos
    fileDNI: [null],
    fileLicencia: [null],
    fileCedula: [null],
    fileSeguro: [null],
    fileDenuncia: [null],
    fileFotos: [null, Validators.required],
    fileMedicos: [null],
    
    // Archivos Nuevos
    filePresupuesto: [null], // Presupuesto o franquicia
    fileCBU: [null],         // Comprobante de CBU
    fileDenunciaPenal: [null] // Para peatones
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: any) => {
      const referido = params['ref'];
      if (referido) this.reclamoForm.patchValue({ codigo_ref: referido });
    });
  }

  // --- VALIDADORES CUSTOM ---
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }

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
  get v() { return this.reclamoForm.value; } 

  aceptarTerminos() { this.mostrarTerminos = false; }
  cancelarTerminos() { this.router.navigate(['/']); }

  // --- LÓGICA DE ROLES ---
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
    const sufrioLesiones = this.reclamoForm.get('sufrio_lesiones')?.value;

    // 1. Limpieza inicial de validadores condicionales
    const camposCondicionales = [
      'patente_propia', 'patente_tercero', 'relato_hecho', 
      'fileLicencia', 'fileCedula', 'fileSeguro', 'fileDenuncia', 'filePresupuesto', 'fileMedicos',
      'tercero_nombre', 'tercero_apellido', 'tercero_dni', 'tercero_marca_modelo', 'fileDenunciaPenal'
    ];

    camposCondicionales.forEach(key => {
        // @ts-ignore
        c[key]?.clearValidators();
        // @ts-ignore
        c[key]?.updateValueAndValidity();
    });

    // Validadores de patente siempre activos si hay texto escrito
    if (c.patente_propia.value) c.patente_propia.setValidators([Validators.pattern(this.patentePattern)]);
    if (c.patente_tercero.value) c.patente_tercero.setValidators([Validators.pattern(this.patentePattern)]);

    // --- LÓGICA DE ROLES ---

    if (rol === 'Conductor') {
        c.fileLicencia.setValidators([Validators.required]);
        c.fileCedula.setValidators([Validators.required]);
        c.patente_propia.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
        
        if (tieneSeguro) {
            // CASO 1: CON SEGURO -> Tercero manual es OPCIONAL (se saca de la denuncia)
            c.fileSeguro.setValidators([Validators.required]);
            c.fileDenuncia.setValidators([Validators.required]);
            c.filePresupuesto.setValidators([Validators.required]);
            // Patente tercero sí es requerida siempre para identificar
            c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
        } else {
            // CASO 2: SIN SEGURO -> Tercero manual es OBLIGATORIO
            this.setTerceroRequerido();
            c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
            c.relato_hecho.setValidators([Validators.required, Validators.minLength(20), this.noWhitespaceValidator]);
        }
    } 
    else {
        // CASO 3: PEATÓN / ACOMPAÑANTE -> Tercero manual es OBLIGATORIO
        // (Porque no tienen denuncia administrativa propia)
        this.setTerceroRequerido();
        c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
        c.relato_hecho.setValidators([Validators.required, Validators.minLength(20), this.noWhitespaceValidator]);
    }

    // --- LÓGICA DE LESIONES ---
    if (sufrioLesiones) {
        c.fileMedicos.setValidators([Validators.required]);
    }

    c.fileFotos.setValidators([Validators.required]);
    this.reclamoForm.updateValueAndValidity();
  }

  // Helper para no repetir código
  private setTerceroRequerido() {
    const c = this.reclamoForm.controls;
    c.tercero_nombre.setValidators([Validators.required, Validators.minLength(3), Validators.pattern(this.nombrePattern), this.noWhitespaceValidator]);
    c.tercero_apellido.setValidators([Validators.required, Validators.minLength(3), Validators.pattern(this.nombrePattern), this.noWhitespaceValidator]);
    c.tercero_dni.setValidators([Validators.required, Validators.pattern(this.dniPattern)]);
    c.tercero_marca_modelo.setValidators([Validators.required, this.noWhitespaceValidator]);
    
    c.tercero_nombre.updateValueAndValidity();
    c.tercero_apellido.updateValueAndValidity();
    c.tercero_dni.updateValueAndValidity();
    c.tercero_marca_modelo.updateValueAndValidity();
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

  // --- NAVEGACIÓN ---
  irAConfirmacion() {
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
    this.pasoActual = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editarDatos() {
    this.pasoActual = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- ENVÍO FINAL ---
  confirmarReclamo() {
    this.isLoading = true;
    const v = this.reclamoForm.value;
    const formData = new FormData();

    // 1. Appendeamos campos de texto y booleanos convertidos
    Object.keys(v).forEach(key => {
        // @ts-ignore
        const value = v[key];
        
        if (key.startsWith('file')) {
            // Los archivos se procesan después o si no son nulos
        } else if (typeof value === 'boolean') {
             formData.append(key, String(value)); // 'true' o 'false'
        } else {
             if (value) formData.append(key, value);
        }
    });

    // 2. Ajuste manual de in_itinere/art logic si es conductor
    if (v.rol_victima === 'Conductor') {
         // Conductor no suele tener in_itinere/art salvo casos específicos, aseguramos false si no aplica
         if (!v.in_itinere) formData.set('posee_art', 'false');
    }

    // 3. Appendeamos Archivos
    const fileKeys = [
        'fileDNI', 'fileLicencia', 'fileCedula', 'fileSeguro', 'fileDenuncia', 
        'fileFotos', 'fileMedicos', 'filePresupuesto', 'fileCBU', 'fileDenunciaPenal'
    ];

    fileKeys.forEach(key => {
        // @ts-ignore
        const file = v[key];
        if (file instanceof File) {
            formData.append(key, file);
        }
    });

    // 4. Enviar
    this.reclamosService.crearReclamo(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.router.navigate(['/exito'], { state: { codigo: res.codigo_seguimiento, nombre: v.nombre } });
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        const msg = err.error?.message || 'Error de conexión. Intente nuevamente.';
        this.notificacionService.showError(msg);
      }
    });
  }

  getFileName(controlName: string): string {
    const file = this.reclamoForm.get(controlName)?.value;
    return (file && file instanceof File) ? file.name : '';
  }

  get esConductor(): boolean { return this.reclamoForm.get('rol_victima')?.value === 'Conductor'; }
  get tieneSeguro(): boolean { return this.reclamoForm.get('tiene_seguro')?.value === true; }
  get isInItinere(): boolean { 
    return this.reclamoForm.get('in_itinere')?.value === true; 
  }
}