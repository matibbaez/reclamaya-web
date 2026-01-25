import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TerminosModalComponent } from '../../components/terminos-modal/terminos-modal';
import { ReclamosService } from '../../services/reclamos.service';
import { NotificacionService } from '../../services/notificacion';
import { ImageCompressService } from '../../services/image-compress.service';
import { UiSignatureComponent } from '../../components/ui-signature/ui-signature';

@Component({
  selector: 'app-iniciar-reclamo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TerminosModalComponent, UiSignatureComponent],
  templateUrl: './iniciar-reclamo.html',
  styleUrl: './iniciar-reclamo.scss'
})
export class IniciarReclamoComponent implements OnInit {

  @ViewChild('firmaPad') firmaPad!: UiSignatureComponent;
  errorFirma = false;
  
  private fb = inject(FormBuilder);
  private reclamosService = inject(ReclamosService); 
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificacionService = inject(NotificacionService);
  private imageCompressService = inject(ImageCompressService);

  docActivo: 'poder' | 'honorarios' | 'no_seguro' = 'poder';
  mostrarTerminos = true; 
  isLoading = false;
  pasoActual = 0; 
  
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

  private nombrePattern = /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s.]+$/; 
  private dniPattern = /^[0-9]{7,11}$/; 
  private telPattern = /^[0-9]{10,13}$/;
  private patentePattern = /^[a-zA-Z0-9]{6,7}$/;
  private cbuPattern = /^[0-9]{22}$/;

  reclamoForm = this.fb.group({
    codigo_ref: [''],
    
    // --- DATOS PERSONALES ---
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(this.nombrePattern), this.noWhitespaceValidator]],
    dni: ['', [Validators.required, Validators.pattern(this.dniPattern)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(this.telPattern)]],
    domicilio_usuario: ['', [Validators.required, this.noWhitespaceValidator]],
    cbu: ['', [Validators.pattern(this.cbuPattern)]], // Ahora es requerido dinámicamente según archivo, pero validamos formato si escriben

    // --- DATOS SINIESTRO ---
    rol_victima: ['', Validators.required],
    tiene_seguro: [true], 
    hizo_denuncia: [false],
    sufrio_lesiones: [false], 
    in_itinere: [false],
    posee_art: [false],

    fecha_hecho: ['', [Validators.required, this.fechaValidator]], 
    hora_hecho: ['', Validators.required],
    lugar_hecho: ['', [Validators.required, Validators.minLength(5), this.noWhitespaceValidator]],
    localidad: ['', [Validators.required, Validators.minLength(4), this.noWhitespaceValidator]],
    provincia: ['', Validators.required],
    relato_hecho: [''], 
    
    intervino_policia: [false],
    intervino_ambulancia: [false],
    patente_propia: ['', [Validators.pattern(this.patentePattern)]], 

    // --- TERCERO ---
    aseguradora_tercero: ['', Validators.required],
    patente_tercero: ['', [Validators.pattern(this.patentePattern)]],
    tercero_nombre: [''],
    tercero_apellido: [''],
    tercero_dni: [''],
    tercero_marca_modelo: [''],

    // --- ARCHIVOS (Null o Array<File>) ---
    fileDNI: [null],           // Múltiple
    fileLicencia: [null],      // Múltiple
    fileCedula: [null],        // Múltiple
    fileFotos: [null],         // Múltiple
    fileComplementaria: [null],// Múltiple (NUEVO)
    
    fileSeguro: [null],        // Único
    fileDenuncia: [null],      // Único
    filePresupuesto: [null],   // Único
    fileMedicos: [null],       // Único
    fileCBU: [null],           // Único
    fileDenunciaPenal: [null]  // Único
  });

  ngOnInit(): void {
    const valoresIniciales = {
      nombre: '', dni: '', email: '', telefono: '', domicilio_usuario: '', cbu: '',
      rol_victima: '', 
      tiene_seguro: true, sufrio_lesiones: false, in_itinere: false, posee_art: false,
      intervino_policia: false, intervino_ambulancia: false,
      fecha_hecho: '', hora_hecho: '', lugar_hecho: '', localidad: '', provincia: '', relato_hecho: '',
      patente_propia: '', aseguradora_tercero: '', patente_tercero: '',
      tercero_nombre: '', tercero_apellido: '', tercero_dni: '', tercero_marca_modelo: '',
      fileDNI: null, fileLicencia: null, fileCedula: null, fileSeguro: null, fileDenuncia: null,
      filePresupuesto: null, fileFotos: null, fileMedicos: null, fileCBU: null, fileDenunciaPenal: null,
      fileComplementaria: null,
      codigo_ref: ''
    };

    this.reclamoForm.reset(valoresIniciales);
    this.pasoActual = 0;
    this.isLoading = false;

    this.route.queryParams.subscribe((params: any) => {
      const referido = params['ref'];
      if (referido) {
        this.reclamoForm.patchValue({ codigo_ref: referido });
      }
    });
  }

  // --- GETTERS DE TEXTOS LEGALES ---
  get textoPoder(): string {
    return `CARTA PODER - REPRESENTACIÓN LETRADA\n\nPor la presente, yo, ${this.v.nombre}, titular del DNI Nº ${this.v.dni}, otorgo poder suficiente a los letrados de RECLAMA YA para que actúen en mi nombre y representación ante la compañía aseguradora correspondiente, organismos administrativos y/o judiciales, en relación al siniestro denunciado.\n\nFaculto a los mismos para presentar documentación, realizar denuncias, tramitar el reclamo y percibir indemnizaciones.`;
  }

  get textoHonorarios(): string {
    return `CONVENIO DE HONORARIOS PROFESIONALES\n\nEntre el cliente, ${this.v.nombre}, y RECLAMA YA, se acuerda lo siguiente:\n\nPRIMERO: Los honorarios profesionales por la gestión extrajudicial del reclamo se pactan en el 20% (veinte por ciento) del monto total bruto que se obtenga como indemnización por parte de la compañía aseguradora.\n\nSEGUNDO: Dicho porcentaje será abonado una vez que el cliente perciba efectivamente la indemnización.\n\nTERCERO: En caso de no obtenerse indemnización alguna, el cliente no deberá abonar honorarios (resultado negativo).`;
  }

  get textoNoSeguro(): string {
    return `DECLARACIÓN JURADA - INEXISTENCIA DE SEGURO\n\nPor la presente, declaro bajo juramento que al momento del siniestro ocurrido el día ${this.v.fecha_hecho} en ${this.v.lugar_hecho}, mi vehículo NO poseía cobertura de seguro vigente.\n\nAsimismo, ratifico el relato de los hechos declarado en este formulario.`;
  }

  // --- VALIDATORS HELPERS ---
  onFirmaRealizada() { this.errorFirma = false; }

  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return !isWhitespace ? null : { 'whitespace': true };
  }

  fechaValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const fecha = new Date(control.value);
    const hoy = new Date();
    const limitePasado = new Date();
    limitePasado.setFullYear(hoy.getFullYear() - 3); // 3 años prescripción
    if (fecha > hoy) return { futuro: true };
    if (fecha < limitePasado) return { prescripto: true };
    return null;
  }

  get f() { return this.reclamoForm.controls; }
  get v() { return this.reclamoForm.value; }

  // --- NAVEGACIÓN Y STEPS ---
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

  volverAStep1() { 
    this.pasoActual = 0; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  avanzarAPaso2() {
    const fieldsPaso1 = [
      'nombre', 'dni', 'email', 'telefono', 'domicilio_usuario',
      'fecha_hecho', 'hora_hecho', 'lugar_hecho', 'localidad', 'provincia', 'relato_hecho'
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
    
    // Validar fotos SOLO si no es Peatón (Peatón las tiene opcionales en complementaria)
    if (!this.reclamoForm.get('fileFotos')?.value && this.esConductor) {
       this.notificacionService.showError('Las fotos del daño son obligatorias para vehículos.');
       return;
    }

    this.pasoActual = 3;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editarDatos() {
    this.pasoActual = 1; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- LOGICA TOGGLES ---
  get hizoDenuncia(): boolean { return this.reclamoForm.get('hizo_denuncia')?.value === true; }
  get esConductor(): boolean { return this.reclamoForm.get('rol_victima')?.value === 'Conductor'; }
  get tieneSeguro(): boolean { return this.reclamoForm.get('tiene_seguro')?.value === true; }
  get isInItinere(): boolean { return this.reclamoForm.get('in_itinere')?.value === true; }

  toggleDenuncia(checked: boolean) {
    this.reclamoForm.patchValue({ hizo_denuncia: checked });
    this.actualizarValidaciones(this.reclamoForm.get('rol_victima')?.value || 'Conductor');
  }

  toggleSeguro(checked: boolean) {
    this.reclamoForm.patchValue({ tiene_seguro: checked });
    this.actualizarValidaciones(this.reclamoForm.get('rol_victima')?.value || 'Conductor');
  }

  // --- ACTUALIZACIÓN DINÁMICA DE VALIDACIONES ---
  actualizarValidaciones(rol: string) {
    const c = this.reclamoForm.controls;
    const tieneSeguro = this.reclamoForm.get('tiene_seguro')?.value;
    const hizoDenuncia = this.reclamoForm.get('hizo_denuncia')?.value;

    // 1. Campos a resetear validación
    const camposDinamicos = [
        'fecha_hecho', 'hora_hecho', 'lugar_hecho', 'localidad', 'provincia', 'relato_hecho',
        'patente_propia', 'patente_tercero', 
        'fileLicencia', 'fileCedula', 'fileSeguro', 'fileDenuncia', 'fileMedicos', 'filePresupuesto', 'fileFotos',
        'tercero_nombre', 'tercero_apellido', 'tercero_dni', 'tercero_marca_modelo'
    ];

    // Limpiamos validadores previos
    camposDinamicos.forEach(key => {
        // @ts-ignore
        c[key]?.clearValidators();
        // @ts-ignore
        c[key]?.updateValueAndValidity({ emitEvent: false });
    });

    // 2. Detalles del Siniestro (Si NO hizo denuncia en su seguro, estos datos son CRÍTICOS)
    if (!hizoDenuncia) {
       c.fecha_hecho.setValidators([Validators.required, this.fechaValidator]);
       c.hora_hecho.setValidators([Validators.required]);
       c.lugar_hecho.setValidators([Validators.required, Validators.minLength(5), this.noWhitespaceValidator]);
       c.localidad.setValidators([Validators.required, Validators.minLength(4), this.noWhitespaceValidator]);
       c.provincia.setValidators([Validators.required]);
       c.relato_hecho.setValidators([Validators.required, Validators.minLength(20), this.noWhitespaceValidator]);
    }

    // 3. Documentación y Datos según ROL
    c.fileDNI.setValidators([Validators.required]);
    c.fileCBU.setValidators([Validators.required]);
    c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);

    if (rol === 'Conductor') {
       // CONDUCTOR: Necesita todo lo del auto
       c.patente_propia.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
       c.fileLicencia.setValidators([Validators.required]);
       c.fileCedula.setValidators([Validators.required]);
       c.fileFotos.setValidators([Validators.required]); 
       c.filePresupuesto.setValidators([Validators.required]); // Factura o Presupuesto

       if (tieneSeguro) {
           c.fileSeguro.setValidators([Validators.required]);
           if (hizoDenuncia) {
               c.fileDenuncia.setValidators([Validators.required]);
           }
       }
    } else {
       // PEATÓN / ACOMPAÑANTE / CICLISTA
       // NO pide patente propia, ni licencia, ni cédula, ni fotos obligatorias (van en complementaria)
       c.fileMedicos.setValidators([Validators.required]);
    }

    // 4. Datos del Tercero (Si no hay seguro propio o es peatón, necesitamos saber a quién reclamar sí o sí)
    if (!tieneSeguro || rol !== 'Conductor') {
        c.tercero_nombre.setValidators([Validators.required]);
        c.tercero_apellido.setValidators([Validators.required]);
        c.tercero_dni.setValidators([Validators.required, Validators.pattern(this.dniPattern)]);
        c.tercero_marca_modelo.setValidators([Validators.required]);
    }
    
    // Si marcó lesiones manualmente (aunque sea conductor)
    if (this.reclamoForm.get('sufrio_lesiones')?.value) {
        c.fileMedicos.setValidators([Validators.required]);
    }

    // Aplicar cambios
    camposDinamicos.forEach(key => {
        // @ts-ignore
        c[key]?.updateValueAndValidity({ emitEvent: false });
    });
    c.aseguradora_tercero.updateValueAndValidity();
    this.reclamoForm.updateValueAndValidity();
  }

  // --- MANEJO DE ARCHIVOS (Múltiples y Únicos) ---
  async onFileChange(event: any, controlName: string) {
    const input = event.target;
    if (!input.files || input.files.length === 0) return;

    // Campos que permiten MÚLTIPLES archivos
    const isMultiple = ['fileFotos', 'fileDNI', 'fileLicencia', 'fileCedula', 'fileComplementaria'].includes(controlName);
    
    // --- CAMBIO AQUÍ: Definimos límites específicos ---
    let maxFiles = 5; // Por defecto (ej: complementaria)
    
    if (controlName === 'fileFotos') {
        maxFiles = 7; // Fotos del choque
    } else if (['fileDNI', 'fileLicencia', 'fileCedula'].includes(controlName)) {
        maxFiles = 2; // Documentos personales (Frente y Dorso)
    }
    // -------------------------------------------------

    // 1. PROCESAR ARCHIVOS NUEVOS
    const newFiles = Array.from(input.files) as File[];
    
    this.isLoading = true; 

    try {
      // Comprimimos todo lo que entra
      const compressedNewFiles = await Promise.all(
        newFiles.map(file => this.imageCompressService.compressFile(file))
      );

      if (isMultiple) {
        // --- LÓGICA ACUMULATIVA ---
        const currentVal = this.reclamoForm.get(controlName)?.value as any;
        let currentFiles: File[] = [];

        if (currentVal) {
            currentFiles = (currentVal instanceof FileList) 
              ? Array.from(currentVal) 
              : (Array.isArray(currentVal) ? currentVal : [currentVal]);
        }
        
        // Validar Cantidad
        if (currentFiles.length + compressedNewFiles.length > maxFiles) {
            this.notificacionService.showError(`Máximo ${maxFiles} archivos permitidos para este campo.`);
            // No agregamos los nuevos, mantenemos los viejos
        } else {
            // Combinar
            const combinedFiles = [...currentFiles, ...compressedNewFiles];
            this.reclamoForm.patchValue({ [controlName]: combinedFiles as any });
        }

      } else {
        // --- LÓGICA ARCHIVO ÚNICO (Reemplazo) ---
        if (newFiles.length > 1) {
            this.notificacionService.showError('Solo se permite un archivo para este campo.');
        }
        this.reclamoForm.patchValue({ [controlName]: compressedNewFiles[0] });
      }
      
      // Forzar validación visual
      this.reclamoForm.get(controlName)?.updateValueAndValidity();

    } catch (e) {
      console.error("Error procesando archivos", e);
      this.notificacionService.showError('Error al procesar la imagen. Intente con otra.');
    } finally {
      this.isLoading = false;
      input.value = ''; 
    }
  }

  // Método genérico para borrar un archivo de un array
  borrarArchivo(controlName: string, index: number) {
     const currentVal = this.reclamoForm.get(controlName)?.value as any;
     
     if (currentVal) {
        let currentFiles: File[] = [];
        if (Array.isArray(currentVal)) {
            currentFiles = [...currentVal]; // Clonar para mutar
        } else if (currentVal instanceof FileList) {
            currentFiles = Array.from(currentVal);
        } else {
            // Era un archivo único, si borran index 0, se vacía
            this.reclamoForm.patchValue({ [controlName]: null });
            return;
        }

        currentFiles.splice(index, 1);
        
        // Si queda vacío, ponemos null para que salte required si corresponde
        const newValue = currentFiles.length > 0 ? currentFiles : null;
        this.reclamoForm.patchValue({ [controlName]: newValue as any });
     }
  }

  // Alias para compatibilidad con el HTML viejo si usa 'borrarFoto'
  borrarFoto(index: number) {
      this.borrarArchivo('fileFotos', index);
  }

  // Helper para el HTML: Obtener lista de nombres para mostrar "tags"
  getFilesList(controlName: string): string[] {
      const files = this.reclamoForm.get(controlName)?.value as any;
      if (!files) return [];
      
      if (Array.isArray(files)) return files.map((f: any) => f.name);
      if (files instanceof FileList) return Array.from(files).map((f: any) => f.name);
      if (files instanceof File) return [files.name];
      
      return [];
  }

  // Helper simple para mostrar nombre único (para inputs simples)
  getFileName(controlName: string): string {
     const list = this.getFilesList(controlName);
     if (list.length === 0) return '';
     if (list.length === 1) return list[0];
     return `${list.length} archivos seleccionados`;
  }
  
  // Getter específico para fotos (usado en tu HTML actual)
  get fotosList(): string[] {
      return this.getFilesList('fileFotos');
  }

  // --- ENVÍO DEL FORMULARIO ---
  async confirmarConFirma() {
    if (this.firmaPad.isEmpty()) {
      this.errorFirma = true;
      this.notificacionService.showError('Por favor, firme en el recuadro para continuar.');
      return;
    }

    this.isLoading = true;
    const v = this.reclamoForm.value;
    const formData = new FormData();

    // A. FIRMA
    const firmaBlob = await this.firmaPad.getSignatureBlob();
    formData.append('fileFirma', firmaBlob, 'firma_digital.png'); 

    // B. DATOS TEXTO Y ARCHIVOS
    for (const key of Object.keys(v)) {
        // @ts-ignore
        const value = v[key];

        if (!value) continue; // Skip null/undefined/empty

        // Caso: Array de Archivos (Fotos, DNI, Licencia, Cedula, Complementaria)
        if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
            value.forEach((file: File) => {
                formData.append(key, file); // Multer recibe array con el mismo keyname
            });
        }
        // Caso: Archivo Único (Poliza, CBU, etc)
        else if (value instanceof File) {
            formData.append(key, value);
        }
        // Caso: Booleanos
        else if (typeof value === 'boolean') {
             formData.append(key, String(value));
        }
        // Caso: Textos / Números
        else {
             formData.append(key, String(value));
        }
    }

    // C. ENVIAR
    this.reclamosService.crearReclamo(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.router.navigate(['/exito'], { state: { codigo: res.codigo_seguimiento, nombre: v.nombre } });
      },
      error: (err) => {
        this.isLoading = false;
        this.notificacionService.showError('Error de conexión o datos inválidos.');
        console.error(err);
      }
    });
  }
}