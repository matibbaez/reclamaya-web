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
    
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(this.nombrePattern), this.noWhitespaceValidator]],
    dni: ['', [Validators.required, Validators.pattern(this.dniPattern)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(this.telPattern)]],
    domicilio_usuario: ['', [Validators.required, this.noWhitespaceValidator]],
    cbu: ['', [Validators.pattern(this.cbuPattern)]],

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
      nombre: '', dni: '', email: '', telefono: '', domicilio_usuario: '', cbu: '',
      rol_victima: '', 
      tiene_seguro: true, sufrio_lesiones: false, in_itinere: false, posee_art: false,
      intervino_policia: false, intervino_ambulancia: false,
      fecha_hecho: '', hora_hecho: '', lugar_hecho: '', localidad: '', provincia: '', relato_hecho: '',
      patente_propia: '', aseguradora_tercero: '', patente_tercero: '',
      tercero_nombre: '', tercero_apellido: '', tercero_dni: '', tercero_marca_modelo: '',
      fileDNI: null, fileLicencia: null, fileCedula: null, fileSeguro: null, fileDenuncia: null,
      filePresupuesto: null, fileFotos: null, fileMedicos: null, fileCBU: null, fileDenunciaPenal: null,
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

  get textoPoder(): string {
    return `CARTA PODER - REPRESENTACIÓN LETRADA
    
    Por la presente, yo, ${this.v.nombre}, titular del DNI Nº ${this.v.dni}, otorgo poder suficiente a los letrados de RECLAMA YA para que actúen en mi nombre y representación ante la compañía aseguradora correspondiente, organismos administrativos y/o judiciales, en relación al siniestro denunciado.

    Faculto a los mismos para presentar documentación, realizar denuncias, tramitar el reclamo y percibir indemnizaciones.`;
  }

  get textoHonorarios(): string {
    return `CONVENIO DE HONORARIOS PROFESIONALES

    Entre el cliente, ${this.v.nombre}, y RECLAMA YA, se acuerda lo siguiente:

    PRIMERO: Los honorarios profesionales por la gestión extrajudicial del reclamo se pactan en el 20% (veinte por ciento) del monto total bruto que se obtenga como indemnización por parte de la compañía aseguradora.

    SEGUNDO: Dicho porcentaje será abonado una vez que el cliente perciba efectivamente la indemnización.

    TERCERO: En caso de no obtenerse indemnización alguna, el cliente no deberá abonar honorarios (resultado negativo).`;
  }

  get textoNoSeguro(): string {
    return `DECLARACIÓN JURADA - INEXISTENCIA DE SEGURO

    Por la presente, declaro bajo juramento que al momento del siniestro ocurrido el día ${this.v.fecha_hecho} en ${this.v.lugar_hecho}, mi vehículo NO poseía cobertura de seguro vigente.

    Asimismo, ratifico el relato de los hechos declarado en este formulario.`;
  }

  onFirmaRealizada() {
    this.errorFirma = false;
  }

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

  get hizoDenuncia(): boolean { return this.reclamoForm.get('hizo_denuncia')?.value === true; }

  toggleDenuncia(checked: boolean) {
    this.reclamoForm.patchValue({ hizo_denuncia: checked });
    // Forzamos actualización de validaciones
    this.actualizarValidaciones(this.reclamoForm.get('rol_victima')?.value || 'Conductor');
  }

  toggleSeguro(checked: boolean) {
    this.reclamoForm.patchValue({ tiene_seguro: checked });
    this.actualizarValidaciones(this.reclamoForm.get('rol_victima')?.value || 'Conductor');
  }

  // En iniciar-reclamo.ts

  actualizarValidaciones(rol: string) {
    const c = this.reclamoForm.controls;
    const tieneSeguro = this.reclamoForm.get('tiene_seguro')?.value;
    const hizoDenuncia = this.reclamoForm.get('hizo_denuncia')?.value;

    // 1. Lista de campos dinámicos
    const camposSiniestro = ['fecha_hecho', 'hora_hecho', 'lugar_hecho', 'localidad', 'provincia', 'relato_hecho'];
    
    // Campos que siempre vamos a resetear primero
    const camposDinamicos = [
        ...camposSiniestro, 
        'patente_propia', 'patente_tercero', 
        'fileLicencia', 'fileCedula', 'fileSeguro', 'fileDenuncia', 'fileMedicos', 'filePresupuesto',
        'tercero_nombre', 'tercero_apellido', 'tercero_dni', 'tercero_marca_modelo'
    ];

    // Limpiamos validadores previos
    camposDinamicos.forEach(key => {
        // @ts-ignore
        c[key]?.clearValidators();
        // @ts-ignore
        c[key]?.updateValueAndValidity({ emitEvent: false }); // No emitimos evento todavía para no saturar
    });

    // --- REGLAS DE VALIDACIÓN ---

    // 2. Detalles del Siniestro (Si no hizo denuncia, son obligatorios)
    if (!hizoDenuncia) {
        c.fecha_hecho.setValidators([Validators.required, this.fechaValidator]);
        c.hora_hecho.setValidators([Validators.required]);
        c.lugar_hecho.setValidators([Validators.required, Validators.minLength(5), this.noWhitespaceValidator]);
        c.localidad.setValidators([Validators.required, Validators.minLength(4), this.noWhitespaceValidator]);
        c.provincia.setValidators([Validators.required]);
        c.relato_hecho.setValidators([Validators.required, Validators.minLength(20), this.noWhitespaceValidator]);
    }

    // 3. Patente Propia (Obligatoria para Conductor)
    if (rol === 'Conductor') {
        c.patente_propia.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
    }
    
    // 4. Patente Tercero (SIEMPRE Obligatoria)
    c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
    
    // 5. Datos Tercero (Si no hay seguro o no es conductor, son obligatorios)
    if (!tieneSeguro || rol !== 'Conductor') {
        c.tercero_nombre.setValidators([Validators.required]);
        c.tercero_apellido.setValidators([Validators.required]);
        c.tercero_dni.setValidators([Validators.required, Validators.pattern(this.dniPattern)]);
        c.tercero_marca_modelo.setValidators([Validators.required]);
    }

    // 6. Archivos (Obligatorios según caso)
    c.fileFotos.setValidators([Validators.required]);
    c.fileDNI.setValidators([Validators.required]);
    c.fileCBU.setValidators([Validators.required]);

    if (rol === 'Conductor') {
      c.fileLicencia.setValidators([Validators.required]);
      c.fileCedula.setValidators([Validators.required]);
      c.filePresupuesto.setValidators([Validators.required]);
        if (tieneSeguro) {
            c.fileSeguro.setValidators([Validators.required]);
            if (hizoDenuncia) {
                c.fileDenuncia.setValidators([Validators.required]);
            }
        }
    }
    
    if (this.reclamoForm.get('sufrio_lesiones')?.value) {
        c.fileMedicos.setValidators([Validators.required]);
    }

    // --- CORRECCIÓN FINAL ---
    // Aplicamos los cambios llamando a updateValueAndValidity() en CADA campo modificado
    camposDinamicos.forEach(key => {
        // @ts-ignore
        c[key]?.updateValueAndValidity({ emitEvent: false });
    });
    
    // Aseguradora tercero no es dinámico, pero aseguramos su validación
    c.aseguradora_tercero.updateValueAndValidity();

    // Actualizamos el estado general del formulario
    this.reclamoForm.updateValueAndValidity();
  }

  // MÉTODO MODIFICADO: ACUMULA LAS FOTOS EN LUGAR DE REEMPLAZARLAS
  onFileChange(event: any, controlName: string) {
    const input = event.target;
    
    // Lógica especial para FOTOS (Acumulativa)
    if (controlName === 'fileFotos') {
      const newFiles = Array.from(input.files || []) as File[];
      
      // AQUÍ ESTÁ EL FIX: Usamos 'as any' para evitar el error 'left-hand side of instanceof...'
      const currentVal = this.reclamoForm.get('fileFotos')?.value as any;
      let currentFiles: File[] = [];

      if (currentVal) {
        currentFiles = (currentVal instanceof FileList) 
          ? Array.from(currentVal) 
          : currentVal as File[];
      }

      // Combinamos (spread operator)
      const combinedFiles = [...currentFiles, ...newFiles];

      // Validamos máximo
      if (combinedFiles.length > 5) {
        this.notificacionService.showError(`Máximo 5 fotos. Tenés ${combinedFiles.length}.`);
        input.value = ''; // Reseteamos input para que pueda intentar de nuevo
        return;
      }

      // Guardamos el ARRAY acumulado en el form
      this.reclamoForm.patchValue({ fileFotos: combinedFiles as any });
      
      // Reseteamos el input HTML para permitir volver a cargar la misma foto si se borró
      // o para que el evento (change) se dispare de nuevo al agregar otra foto
      input.value = ''; 
      return;
    }

    // Lógica estándar para el resto de archivos (únicos)
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

  // MÉTODO NUEVO: Permite borrar una foto individual del array acumulado
  borrarFoto(index: number) {
    // AQUÍ ESTÁ EL FIX: Usamos 'as any' para evitar el error
    const currentVal = this.reclamoForm.get('fileFotos')?.value as any;
    
    if (currentVal) {
      const currentFiles = (currentVal instanceof FileList) 
          ? Array.from(currentVal) 
          : currentVal as File[]; 
      
      // Borramos por índice
      currentFiles.splice(index, 1);
      
      // Si el array queda vacío, seteamos null para que salte la validación 'required'
      const newValue = currentFiles.length > 0 ? currentFiles : null;
      this.reclamoForm.patchValue({ fileFotos: newValue as any });
    }
  }

  // MODIFICADO: Soporte para Array<File> en fileFotos
  async confirmarConFirma() {
    // Validar si firmó
    if (this.firmaPad.isEmpty()) {
      this.errorFirma = true;
      this.notificacionService.showError('Por favor, firme en el recuadro para continuar.');
      return;
    }

    this.isLoading = true;
    const v = this.reclamoForm.value;
    const formData = new FormData();

    // A. AGREGAR LA FIRMA AL FORMDATA
    const firmaBlob = await this.firmaPad.getSignatureBlob();
    // Le ponemos nombre 'fileFirma' para que el backend lo reciba
    formData.append('fileFirma', firmaBlob, 'firma_digital.png'); 

    // B. LÓGICA DE DATOS (IGUAL A LA TUYA PERO DENTRO DE ESTE PROCESO)
    for (const key of Object.keys(v)) {
        // @ts-ignore
        const value = v[key];

        if (key === 'fileFotos' && (Array.isArray(value) || value instanceof FileList)) {
            const fotosArray = Array.isArray(value) ? value : Array.from(value);
            const compressedFiles = await Promise.all(
                fotosArray.map((file: any) => this.imageCompressService.compressFile(file))
            );
            compressedFiles.forEach(file => formData.append('fileFotos', file));
        } 
        else if (key.startsWith('file') && value instanceof File) {
            const compressedFile = await this.imageCompressService.compressFile(value);
            formData.append(key, compressedFile);
        } 
        else if (typeof value === 'boolean') {
             formData.append(key, String(value));
        } 
        else if (value !== null && value !== undefined && value !== '') {
             formData.append(key, value);
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
        this.notificacionService.showError('Error de conexión. Intente nuevamente.');
        console.error(err);
      }
    });
  }

  // MODIFICADO: Soporte para Array<File>
  getFileName(controlName: string): string {
    const file = this.reclamoForm.get(controlName)?.value as any; 
    
    if (Array.isArray(file)) {
        return `${file.length} archivos seleccionados`;
    }
    if (file instanceof FileList) {
        return `${file.length} archivos seleccionados`;
    }
    return (file && file instanceof File) ? file.name : '';
  }
  
  // MODIFICADO: Soporte para Array<File>
  get fotosList(): string[] {
    const files = this.reclamoForm.get('fileFotos')?.value as any;
    
    if (!files) return [];

    if (Array.isArray(files)) {
        return files.map((f: any) => f.name);
    }
    
    if (files instanceof FileList) {
        return Array.from(files).map((f: any) => f.name);
    }
    return [];
  }

  get esConductor(): boolean { return this.reclamoForm.get('rol_victima')?.value === 'Conductor'; }
  get tieneSeguro(): boolean { return this.reclamoForm.get('tiene_seguro')?.value === true; }
  get isInItinere(): boolean { return this.reclamoForm.get('in_itinere')?.value === true; }
}