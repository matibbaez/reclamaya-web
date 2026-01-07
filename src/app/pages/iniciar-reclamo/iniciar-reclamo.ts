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
  
  // LISTA DE PROVINCIAS (NUEVO)
  provincias = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 
    'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
  ];

  aseguradoras = [
    'Federacion Patronal', 'Allianz', 'Zurich', 'San Cristobal', 'La Caja Seguros',
    'La Equitativa del Plata', 'Sancor', 'La Meridional', 'Mapfre', 'Provincia Seguros',
    'HDI', 'S.M.G', 'Experta', 'Rivadavia', 'Galicia', 'Integrity', 'La Segunda',
    'Nacion', 'Segurcoop', 'Mercantil Andina', 'Berkley', 'Colon', 'Victoria',
    'El Norte', 'La Holando Sudamericana', 'Cooperacion Mutual', 'Otra'
  ];

  // --- PATRONES ---
  // Permitimos números en el nombre por si es Razón Social (ej: "Transportes 123 S.A.")
  private nombrePattern = /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s.]+$/; 
  private dniPattern = /^[0-9]{7,11}$/; // Extendemos a 11 por si ponen CUIT
  private telPattern = /^[0-9]{10,13}$/;
  private patentePattern = /^[a-zA-Z0-9]{6,7}$/;
  private cbuPattern = /^[0-9]{22}$/;

  reclamoForm = this.fb.group({
    codigo_ref: [''],
    
    // --- PASO 1 ---
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(this.nombrePattern), this.noWhitespaceValidator]],
    dni: ['', [Validators.required, Validators.pattern(this.dniPattern)]], // DNI o CUIT
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(this.telPattern)]],
    domicilio_usuario: ['', [Validators.required, this.noWhitespaceValidator]],
    cbu: ['', [Validators.pattern(this.cbuPattern)]],

    rol_victima: ['', Validators.required],
    tiene_seguro: [true], 
    sufrio_lesiones: [false], 
    in_itinere: [false],
    posee_art: [false],

    fecha_hecho: ['', [Validators.required, this.fechaValidator]], 
    hora_hecho: [''],
    lugar_hecho: ['', [Validators.required, Validators.minLength(5), this.noWhitespaceValidator]],
    localidad: ['', [Validators.required, Validators.minLength(4), this.noWhitespaceValidator]],
    provincia: ['', Validators.required], // NUEVO CAMPO
    relato_hecho: [''], 
    
    intervino_policia: [false],
    intervino_ambulancia: [false],
    patente_propia: ['', [Validators.pattern(this.patentePattern)]], 

    // --- PASO 2 ---
    aseguradora_tercero: ['', Validators.required],
    patente_tercero: ['', [Validators.pattern(this.patentePattern)]],
    
    tercero_nombre: [''],
    tercero_apellido: [''],
    tercero_dni: [''],
    tercero_marca_modelo: [''],

    fileDNI: [null],
    fileLicencia: [null],
    fileCedula: [null],
    fileSeguro: [null],
    fileDenuncia: [null],
    filePresupuesto: [null],
    fileFotos: [null], 
    fileMedicos: [null],
    fileCBU: [null],
    fileDenunciaPenal: [null]
  });

  ngOnInit(): void {
    const valoresIniciales = {
      nombre: '',
      dni: '',
      email: '',
      telefono: '',
      domicilio_usuario: '',
      cbu: '',
      rol_victima: '', // Vacío para obligar a elegir
      
      // Booleans por defecto
      tiene_seguro: true, 
      sufrio_lesiones: false,
      in_itinere: false,
      posee_art: false,
      intervino_policia: false,
      intervino_ambulancia: false,

      // Resto de campos vacíos o nulos
      fecha_hecho: '',
      hora_hecho: '',
      lugar_hecho: '',
      localidad: '',
      provincia: '',
      relato_hecho: '',
      patente_propia: '',
      
      aseguradora_tercero: '',
      patente_tercero: '',
      tercero_nombre: '',
      tercero_apellido: '',
      tercero_dni: '',
      tercero_marca_modelo: '',

      fileDNI: null,
      fileLicencia: null,
      fileCedula: null,
      fileSeguro: null,
      fileDenuncia: null,
      filePresupuesto: null,
      fileFotos: null,
      fileMedicos: null,
      fileCBU: null,
      fileDenunciaPenal: null,
      
      codigo_ref: '' // Se sobreescribe abajo si hay URL
    };

    // 1. RESET FUERTE AL ESTADO INICIAL
    this.reclamoForm.reset(valoresIniciales);
    
    // 2. Reiniciar variables de control
    this.pasoActual = 0;
    this.isLoading = false;

    // 3. Chequear si hay referido en la URL
    this.route.queryParams.subscribe((params: any) => {
      const referido = params['ref'];
      if (referido) {
        this.reclamoForm.patchValue({ codigo_ref: referido });
      }
    });
  }

  // --- VALIDATORS ---
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

  // --- NAVEGACIÓN ---
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

  volverAStep1() { 
    this.pasoActual = 0; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // VALIDACIÓN PASO 1 (Actualizada con Provincia)
  avanzarAPaso2() {
    const fieldsPaso1 = [
      'nombre', 'dni', 'email', 'telefono', 'domicilio_usuario',
      'fecha_hecho', 'lugar_hecho', 'localidad', 'provincia', 'relato_hecho'
    ];

    if (this.esConductor) {
      fieldsPaso1.push('patente_propia');
    }

    let errorEncontrado = false;
    fieldsPaso1.forEach(field => {
      const control = this.reclamoForm.get(field);
      if (control?.invalid) {
        control.markAsTouched();
        errorEncontrado = true;
      }
    });

    if (this.reclamoForm.get('fecha_hecho')?.errors) {
        this.notificacionService.showError('Verificá la fecha del siniestro.');
        return;
    }

    if (errorEncontrado) {
      this.notificacionService.showError('Completá los campos obligatorios del Paso 1.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.pasoActual = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAPaso1() {
    this.pasoActual = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  irAConfirmacion() {
    if (this.reclamoForm.invalid) {
      this.reclamoForm.markAllAsTouched();
      this.notificacionService.showError('Faltan datos obligatorios o documentos.');
      return;
    }
    
    if (!this.reclamoForm.get('fileFotos')?.value) {
        this.notificacionService.showError('Las fotos del daño son obligatorias.');
        return;
    }

    this.pasoActual = 3;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editarDatos() {
    this.pasoActual = 1; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleSeguro(checked: boolean) {
    this.reclamoForm.patchValue({ tiene_seguro: checked });
    this.actualizarValidaciones(this.reclamoForm.get('rol_victima')?.value || 'Conductor');
  }

  actualizarValidaciones(rol: string) {
    const c = this.reclamoForm.controls;
    const tieneSeguro = this.reclamoForm.get('tiene_seguro')?.value;

    ['patente_propia', 'patente_tercero', 'relato_hecho', 'fileLicencia', 'fileCedula', 
     'fileSeguro', 'fileDenuncia', 'fileMedicos', 'filePresupuesto',
     'tercero_nombre', 'tercero_apellido', 'tercero_dni', 'tercero_marca_modelo'
    ].forEach(key => {
        // @ts-ignore
        c[key]?.clearValidators();
        // @ts-ignore
        c[key]?.updateValueAndValidity();
        
        if (key.includes('patente')) {
            // @ts-ignore
            c[key]?.addValidators(Validators.pattern(this.patentePattern));
        }
    });

    if (rol === 'Conductor') {
        c.patente_propia.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
    }
    c.relato_hecho.setValidators([Validators.required, Validators.minLength(20), this.noWhitespaceValidator]);

    c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
    
    if (!tieneSeguro || rol !== 'Conductor') {
        c.tercero_nombre.setValidators([Validators.required]);
        c.tercero_apellido.setValidators([Validators.required]);
        c.tercero_dni.setValidators([Validators.required, Validators.pattern(this.dniPattern)]);
        c.tercero_marca_modelo.setValidators([Validators.required]);
    }

    c.fileFotos.setValidators([Validators.required]);
    c.fileDNI.setValidators([Validators.required]);

    if (rol === 'Conductor') {
        c.fileLicencia.setValidators([Validators.required]);
        c.fileCedula.setValidators([Validators.required]);
        
        if (tieneSeguro) {
            c.fileSeguro.setValidators([Validators.required]);
            c.fileDenuncia.setValidators([Validators.required]);
            c.filePresupuesto.setValidators([Validators.required]);
        }
    }
    this.reclamoForm.updateValueAndValidity();
  }

  onFileChange(event: any, controlName: string) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
        this.notificacionService.showError('Archivo muy pesado (Máx 10MB).');
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

  confirmarReclamo() {
    this.isLoading = true;
    const v = this.reclamoForm.value;
    const formData = new FormData();

    Object.keys(v).forEach(key => {
        if (key.startsWith('file')) {
            // @ts-ignore
            if (v[key]) formData.append(key, v[key]);
        } else if (typeof v[key as keyof typeof v] === 'boolean') {
             // @ts-ignore
             formData.append(key, String(v[key]));
        } else {
             // @ts-ignore
             if (v[key]) formData.append(key, v[key]);
        }
    });

    this.reclamosService.crearReclamo(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.router.navigate(['/exito'], { state: { codigo: res.codigo_seguimiento, nombre: v.nombre } });
      },
      error: (err) => {
        this.isLoading = false;
        this.notificacionService.showError('Error de conexión. Intente nuevamente.');
        console.error(err);
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