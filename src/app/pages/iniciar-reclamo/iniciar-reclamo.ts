import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TerminosModalComponent } from '../../components/terminos-modal/terminos-modal';

// Servicios
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

  // --- INYECCIONES ---
  private fb = inject(FormBuilder);
  private reclamosService = inject(ReclamosService); 
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificacionService = inject(NotificacionService);

  // --- VARIABLES DE ESTADO ---
  mostrarTerminos = true; 
  isLoading = false;
  pasoActual = 0; // 0: Selección de Rol, 1: Formulario
  
  // Lista de Aseguradoras
  aseguradoras = [
    'Federacion Patronal', 'Allianz', 'Zurich', 'San Cristobal', 'La Caja Seguros',
    'La Equitativa del Plata', 'Sancor', 'La Meridional', 'Mapfre', 'Provincia Seguros',
    'HDI', 'S.M.G', 'Experta', 'Rivadavia', 'Galicia', 'Integrity', 'La Segunda',
    'Nacion', 'Segurcoop', 'Mercantil Andina', 'Berkley', 'Colon', 'Victoria',
    'El Norte', 'La Holando Sudamericana', 'Cooperacion Mutual', 'Otra'
  ];

  // --- CONFIGURACIÓN DEL FORMULARIO ---
  reclamoForm = this.fb.group({
    // Datos Personales
    codigo_ref: [''],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    dni: ['', [Validators.required, Validators.minLength(7), Validators.pattern(/^[0-9]*$/)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required]],

    // Configuración del Siniestro
    rol_victima: ['', Validators.required], // 'Conductor', 'Acompanante', 'Peaton'
    tiene_seguro: [true], 

    // Datos del Hecho (Texto)
    fecha_hecho: [''],
    hora_hecho: [''],
    lugar_hecho: [''],
    localidad: [''],
    relato_hecho: [''], 

    // Datos del Tercero
    aseguradora_tercero: ['', Validators.required],
    patente_tercero: [''],
    patente_propia: [''], 

    // Archivos (Inicializados en null)
    fileDNI: [null],
    fileLicencia: [null],
    fileCedula: [null],
    fileSeguro: [null],
    fileDenuncia: [null],
    fileFotos: [null], 
    fileMedicos: [null],
  });

  ngOnInit(): void {
    // Detectar referidos desde la URL (ej: ?ref=MATIAS123)
    this.route.queryParams.subscribe((params: any) => {
      const referido = params['ref'];
      if (referido) {
        this.reclamoForm.patchValue({ codigo_ref: referido });
      }
    });
  }

  // =========================================================
  // ⚖️ TÉRMINOS Y CONDICIONES
  // =========================================================
  aceptarTerminos() {
    this.mostrarTerminos = false;
  }

  cancelarTerminos() {
    this.router.navigate(['/']);
  }

  // =========================================================
  // 🔄 LÓGICA DE PASOS Y ROLES
  // =========================================================
  seleccionarRol(rol: string) {
    // 1. Seteamos el rol
    this.reclamoForm.patchValue({ rol_victima: rol });
    
    // 2. Pre-configuramos el seguro según el rol
    if (rol !== 'Conductor') {
      this.reclamoForm.patchValue({ tiene_seguro: false });
    } else {
      this.reclamoForm.patchValue({ tiene_seguro: true });
    }

    // 3. Actualizamos validadores
    this.actualizarValidaciones(rol);
    
    // 4. Avanzamos de paso
    this.pasoActual = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAStep1() {
    this.pasoActual = 0;
  }

  toggleSeguro(checked: boolean) {
    this.reclamoForm.patchValue({ tiene_seguro: checked });
    this.actualizarValidaciones(this.reclamoForm.get('rol_victima')?.value || 'Conductor');
  }

  // =========================================================
  // 🧠 CEREBRO DE VALIDACIONES DINÁMICAS
  // =========================================================
  actualizarValidaciones(rol: string) {
    const c = this.reclamoForm.controls;
    const tieneSeguro = this.reclamoForm.get('tiene_seguro')?.value;

    // 1. Limpiamos validadores condicionales para empezar de cero
    const camposOpcionales = [
      'patente_propia', 'patente_tercero', 'relato_hecho', 
      'fecha_hecho', 'lugar_hecho', 'hora_hecho',
      'fileLicencia', 'fileCedula', 'fileSeguro', 'fileDenuncia', 'fileMedicos'
    ];
    
    camposOpcionales.forEach(key => {
        // @ts-ignore
        c[key]?.clearValidators();
        // @ts-ignore
        c[key]?.updateValueAndValidity();
    });

    // 2. Aplicamos reglas según el caso

    // --- CASO A: CONDUCTOR CON SEGURO ---
    if (rol === 'Conductor' && tieneSeguro) {
        c.patente_propia.setValidators([Validators.required]);
        c.patente_tercero.setValidators([Validators.required]);
        
        c.fileLicencia.setValidators([Validators.required]);
        c.fileCedula.setValidators([Validators.required]);
        c.fileSeguro.setValidators([Validators.required]);
    }
    
    // --- CASO B: CONDUCTOR SIN SEGURO (Carta de No Seguro) ---
    else if (rol === 'Conductor' && !tieneSeguro) {
        c.patente_propia.setValidators([Validators.required]);
        c.patente_tercero.setValidators([Validators.required]);

        c.fileLicencia.setValidators([Validators.required]);
        c.fileCedula.setValidators([Validators.required]);
        
        // ¡IMPORTANTE! El relato es obligatorio para generar el PDF legal
        c.relato_hecho.setValidators([Validators.required, Validators.minLength(20)]);
        c.fecha_hecho.setValidators([Validators.required]);
        c.lugar_hecho.setValidators([Validators.required]);
    }

    // --- CASO C: PEATÓN O ACOMPAÑANTE ---
    else {
        c.patente_tercero.setValidators([Validators.required]);
        
        // Necesitamos detalles del hecho sí o sí
        c.relato_hecho.setValidators([Validators.required]);
        c.fecha_hecho.setValidators([Validators.required]);
        c.lugar_hecho.setValidators([Validators.required]);
    }

    // Las fotos siempre son obligatorias
    c.fileFotos.setValidators([Validators.required]);

    this.reclamoForm.updateValueAndValidity();
  }

  // =========================================================
  // 📂 MANEJO DE ARCHIVOS
  // =========================================================
  onFileChange(event: any, controlName: string) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificacionService.showError('El archivo es muy pesado (Máx 5MB)');
        event.target.value = ''; // Limpiar input
        return;
      }
      // Asignar al formulario
      this.reclamoForm.patchValue({ [controlName]: file });
    }
  }

  // =========================================================
  // 🚀 ENVÍO DEL FORMULARIO
  // =========================================================
  onSubmit() {
    if (this.reclamoForm.invalid) {
      this.reclamoForm.markAllAsTouched();
      this.notificacionService.showError('Faltan completar campos obligatorios o subir fotos.');
      return;
    }

    this.isLoading = true;
    const v = this.reclamoForm.value;
    const formData = new FormData();

    // 1. Datos de Texto
    formData.append('nombre', v.nombre!);
    formData.append('dni', v.dni!);
    formData.append('email', v.email!);
    formData.append('telefono', v.telefono!);

    if (v.codigo_ref) formData.append('codigo_ref', v.codigo_ref);
    
    formData.append('rol_victima', v.rol_victima!);
    formData.append('tiene_seguro', String(v.tiene_seguro)); 
    
    formData.append('aseguradora_tercero', v.aseguradora_tercero!);
    if (v.patente_tercero) formData.append('patente_tercero', v.patente_tercero);
    if (v.patente_propia) formData.append('patente_propia', v.patente_propia);
    
    // Datos del hecho
    if (v.relato_hecho) formData.append('relato_hecho', v.relato_hecho);
    if (v.fecha_hecho) formData.append('fecha_hecho', v.fecha_hecho);
    if (v.hora_hecho) formData.append('hora_hecho', v.hora_hecho);
    if (v.lugar_hecho) formData.append('lugar_hecho', v.lugar_hecho);
    if (v.localidad) formData.append('localidad', v.localidad);

    // 2. Archivos
    if (v.fileDNI) formData.append('fileDNI', v.fileDNI);
    if (v.fileLicencia) formData.append('fileLicencia', v.fileLicencia);
    if (v.fileCedula) formData.append('fileCedula', v.fileCedula);
    if (v.fileSeguro) formData.append('fileSeguro', v.fileSeguro);
    if (v.fileDenuncia) formData.append('fileDenuncia', v.fileDenuncia);
    if (v.fileFotos) formData.append('fileFotos', v.fileFotos);
    if (v.fileMedicos) formData.append('fileMedicos', v.fileMedicos);

    // 3. Llamada al Servicio
    this.reclamosService.crearReclamo(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        // ✨ AQUÍ ESTÁ EL CAMBIO CLAVE ✨
        // Navegamos a la página de éxito pasando los datos
        this.router.navigate(['/exito'], { 
          state: { 
            codigo: res.codigo_seguimiento, 
            nombre: this.reclamoForm.value.nombre 
          } 
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.notificacionService.showError('Hubo un error al enviar. Verificá tu conexión.');
      }
    });
  }

  getFileName(controlName: string): string {
    const file = this.reclamoForm.get(controlName)?.value;
    if (file && file instanceof File) {
      return file.name;
    }
    return '';
  }

  // Getters para el HTML
  get esConductor(): boolean { return this.reclamoForm.get('rol_victima')?.value === 'Conductor'; }
  get tieneSeguro(): boolean { return this.reclamoForm.get('tiene_seguro')?.value === true; }
}