import { Component, inject, OnInit, ViewChild, PLATFORM_ID } from '@angular/core'; // <-- 1. PLATFORM_ID
import { CommonModule, isPlatformBrowser } from '@angular/common'; // <-- 2. isPlatformBrowser
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TerminosModalComponent } from '../../components/terminos-modal/terminos-modal';
import { ReclamosService } from '../../services/reclamos.service';
import { NotificacionService } from '../../services/notificacion';
import { ImageCompressService } from '../../services/image-compress.service';
import { UiSignatureComponent } from '../../components/ui-signature/ui-signature'; // <-- DESCOMENTADO
import { AuthService } from '../../services/auth.service'; 
import { SeoService } from '../../services/seo.service'; 

@Component({
  selector: 'app-iniciar-reclamo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TerminosModalComponent, UiSignatureComponent], // <-- DESCOMENTADO
  templateUrl: './iniciar-reclamo.html',
  styleUrl: './iniciar-reclamo.scss'
})
export class IniciarReclamoComponent implements OnInit {

  // 🔥 3. LA CAPA DE INVISIBILIDAD
  private platformId = inject(PLATFORM_ID);
  public isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('firmaPad') firmaPad!: UiSignatureComponent; // <-- DESCOMENTADO
  errorFirma = false;
  
  private fb = inject(FormBuilder);
  private reclamosService = inject(ReclamosService); 
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificacionService = inject(NotificacionService);
  private imageCompressService = inject(ImageCompressService);
  private authService = inject(AuthService); 
  private seoService = inject(SeoService); 

  docActivo: 'poder' | 'honorarios' | 'no_seguro' = 'poder';
  mostrarTerminos = true; 
  isLoading = false;
  isCompressing = false; 
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
    fileFotos: [null], 
    fileComplementaria: [null],
    fileSeguro: [null], 
    fileDenuncia: [null], 
    filePresupuesto: [null], 
    fileMedicos: [null], 
    fileCBU: [null], 
    fileDenunciaPenal: [null] 
  });

  ngOnInit(): void {
    this.seoService.actualizarMetaTags({
      title: 'Iniciar Reclamo | ReclamaYa',
      description: 'Iniciá tu reclamo de forma 100% online y gratuita. Completá el formulario, adjuntá la documentación y seguí tu expediente.',
      ogImage: 'https://reclamaya.ar/logo-seo.png', 
      ogUrl: 'https://reclamaya.ar/iniciar-reclamo'
    });

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

  get noRequiereFirma(): boolean {
    return this.authService.isAuthenticated(); 
  }

  get textoPoder(): string {
    return `SE PRESENTA – DESIGNA LETRADO – CONSTITUYE DOMICILIO

      ${this.v.nombre}, DNI ${this.v.dni}, por derecho propio, conjuntamente con mi abogado patrocinante, el Dr. Agustín Exequiel Simonelli, Tº 141, Fº 755, CPACF, CUIT 20-36045548-4, constituyendo domicilio legal en Gallo 1435 piso 9 de Capital Federal, teléfono 11-3336-0425, ante quien corresponda me presento y respetuosamente digo:

      Que vengo a presentarme, designando como único letrado patrocinante al Dr. Agustín Exequiel Simonelli, cuyos datos personales se consignaron anteriormente, otorgándole poder suficiente para realizar todas las gestiones extrajudiciales y administrativas necesarias ante la compañía aseguradora correspondiente, a fin de obtener la indemnización por los daños materiales y/o físicos sufridos.`;
  }

  get textoHonorarios(): string {
    const fecha = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    return `CONVENIO DE HONORARIOS PROFESIONALES

      En la ciudad de Buenos Aires, a los ${fecha}, ENTRE: ${this.v.nombre}, DNI ${this.v.dni}, en adelante “EL CLIENTE”, por una parte, y el señor AGUSTIN EXEQUIEL SIMONELLI, Tº141 Fº755 C.P.A.C.F, CUIT: 20-36045548-4, por otra, en adelante “EL LETRADO”, se conviene celebrar el presente convenio:

      PRIMERO: EL CLIENTE encarga a EL LETRADO y este acepta la labor profesional de letrado patrocinante en el reclamo extrajudicial y/o judicial que iniciará EL CLIENTE por el siniestro denunciado.

      SEGUNDO: El honorario básico de los profesionales se conviene en el 20% (VEINTE POR CIENTO) del monto total que por todo concepto se recaude del pleito o gestión. Dicho porcentaje incorpora todo gasto de letrado, cotizaciones, certificados, tasas, aranceles e impuestos.

      TERCERO: El pago de honorarios deberá realizarlo EL CLIENTE al LETRADO en efectivo o transferencia bancaria únicamente al momento de percibir el monto que se recaude (Resultado Positivo).`;
  }

  get textoNoSeguro(): string {
    const fecha = new Date().toLocaleDateString('es-AR');
    
    return `DECLARACIÓN JURADA - INEXISTENCIA DE SEGURO
      Buenos Aires, ${fecha}

      Por la presente, yo, ${this.v.nombre}, titular del DNI Nº ${this.v.dni}, declaro bajo juramento que al momento del siniestro ocurrido el día ${this.v.fecha_hecho} en ${this.v.lugar_hecho}, mi vehículo NO poseía cobertura de seguro vigente por cuestiones ajenas a mi voluntad.

      Asimismo, describo los hechos ocurridos de la siguiente manera:
      "${this.v.relato_hecho || 'No especificado'}"`;
  }

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
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' }); // <-- BLINDADO
  }

  volverAStep1() { 
    this.pasoActual = 0; 
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' }); // <-- BLINDADO
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
      if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.pasoActual = 2;
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAPaso1() {
    this.pasoActual = 1;
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  irAConfirmacion() {
    if (this.reclamoForm.invalid) {
      this.reclamoForm.markAllAsTouched();
      this.notificacionService.showError('Faltan datos obligatorios o documentos.');
      return;
    }
    
    if (!this.reclamoForm.get('fileFotos')?.value && this.esConductor) {
       this.notificacionService.showError('Las fotos del daño son obligatorias para vehículos.');
       return;
    }

    this.pasoActual = 3;
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editarDatos() {
    this.pasoActual = 1; 
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  actualizarValidaciones(rol: string) {
    const c = this.reclamoForm.controls;
    const tieneSeguro = this.reclamoForm.get('tiene_seguro')?.value;
    const hizoDenuncia = this.reclamoForm.get('hizo_denuncia')?.value;

    const camposDinamicos = [
        'fecha_hecho', 'hora_hecho', 'lugar_hecho', 'localidad', 'provincia', 'relato_hecho',
        'patente_propia', 'patente_tercero', 
        'fileLicencia', 'fileCedula', 'fileSeguro', 'fileDenuncia', 'fileMedicos', 'filePresupuesto', 'fileFotos',
        'tercero_nombre', 'tercero_apellido', 'tercero_dni', 'tercero_marca_modelo'
    ];

    camposDinamicos.forEach(key => {
        // @ts-ignore
        c[key]?.clearValidators();
        // @ts-ignore
        c[key]?.updateValueAndValidity({ emitEvent: false });
    });

    if (!hizoDenuncia) {
       c.fecha_hecho.setValidators([Validators.required, this.fechaValidator]);
       c.hora_hecho.setValidators([Validators.required]);
       c.lugar_hecho.setValidators([Validators.required, Validators.minLength(5), this.noWhitespaceValidator]);
       c.localidad.setValidators([Validators.required, Validators.minLength(4), this.noWhitespaceValidator]);
       c.provincia.setValidators([Validators.required]);
       c.relato_hecho.setValidators([Validators.required, Validators.minLength(20), this.noWhitespaceValidator]);
    }

    c.fileDNI.setValidators([Validators.required]);
    c.fileCBU.setValidators([Validators.required]);
    c.patente_tercero.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);

    if (rol === 'Conductor') {
       c.patente_propia.setValidators([Validators.required, Validators.pattern(this.patentePattern)]);
       c.fileLicencia.setValidators([Validators.required]);
       c.fileCedula.setValidators([Validators.required]);
       c.fileFotos.setValidators([Validators.required]); 
       c.filePresupuesto.setValidators([Validators.required]); 

       if (tieneSeguro) {
           c.fileSeguro.setValidators([Validators.required]);
           if (hizoDenuncia) {
               c.fileDenuncia.setValidators([Validators.required]);
           }
       }
    } else {
       c.fileMedicos.setValidators([Validators.required]);
    }

    if (!tieneSeguro || rol !== 'Conductor') {
        c.tercero_nombre.setValidators([Validators.required]);
        c.tercero_apellido.setValidators([Validators.required]);
        c.tercero_dni.setValidators([Validators.required, Validators.pattern(this.dniPattern)]);
        c.tercero_marca_modelo.setValidators([Validators.required]);
    }
    
    if (this.reclamoForm.get('sufrio_lesiones')?.value) {
        c.fileMedicos.setValidators([Validators.required]);
    }

    camposDinamicos.forEach(key => {
        // @ts-ignore
        c[key]?.updateValueAndValidity({ emitEvent: false });
    });
    c.aseguradora_tercero.updateValueAndValidity();
    this.reclamoForm.updateValueAndValidity();
  }

  async onFileChange(event: any, controlName: string) {
    const input = event.target;
    if (!input.files || input.files.length === 0) return;

    const isMultiple = [
        'fileFotos', 'fileDNI', 'fileLicencia', 'fileCedula', 
        'fileSeguro', 'fileDenuncia', 'fileMedicos', 'filePresupuesto', 
        'fileCBU', 'fileDenunciaPenal', 'fileComplementaria'
    ].includes(controlName);
    
    let maxFiles = 4; 
    
    if (controlName === 'fileFotos') {
        maxFiles = 7; 
    } 

    const newFiles = Array.from(input.files) as File[];
    this.isCompressing = true;
    this.isLoading = true; 

    try {
      const compressedNewFiles: File[] = [];
      for (const file of newFiles) {
        const compressed = await this.imageCompressService.compressFile(file);
        compressedNewFiles.push(compressed);
      }

      if (isMultiple) {
        const currentVal = this.reclamoForm.get(controlName)?.value as any;
        let currentFiles: File[] = [];

        if (currentVal) {
            currentFiles = (currentVal instanceof FileList) 
              ? Array.from(currentVal) 
              : (Array.isArray(currentVal) ? currentVal : [currentVal]);
        }
        
        if (currentFiles.length + compressedNewFiles.length > maxFiles) {
            this.notificacionService.showError(`Máximo ${maxFiles} archivos permitidos para este campo.`);
        } else {
            const combinedFiles = [...currentFiles, ...compressedNewFiles];
            this.reclamoForm.patchValue({ [controlName]: combinedFiles as any });
        }

      } else {
        if (newFiles.length > 1) {
            this.notificacionService.showError('Solo se permite un archivo para este campo.');
        }
        this.reclamoForm.patchValue({ [controlName]: compressedNewFiles[0] });
      }
      
      this.reclamoForm.get(controlName)?.updateValueAndValidity();

    } catch {
      this.notificacionService.showError('Error al procesar el archivo. Intente nuevamente.');
    } finally {
      this.isCompressing = false;
      this.isLoading = false;
      input.value = ''; 
    }
  }

  borrarArchivo(controlName: string, index: number) {
     const currentVal = this.reclamoForm.get(controlName)?.value as any;
     
     if (currentVal) {
        let currentFiles: File[] = [];
        if (Array.isArray(currentVal)) {
            currentFiles = [...currentVal]; 
        } else if (currentVal instanceof FileList) {
            currentFiles = Array.from(currentVal);
        } else {
            this.reclamoForm.patchValue({ [controlName]: null });
            return;
        }

        currentFiles.splice(index, 1);
        
        const newValue = currentFiles.length > 0 ? currentFiles : null;
        this.reclamoForm.patchValue({ [controlName]: newValue as any });
     }
  }

  borrarFoto(index: number) {
      this.borrarArchivo('fileFotos', index);
  }

  getFilesList(controlName: string): string[] {
      const files = this.reclamoForm.get(controlName)?.value as any;
      if (!files) return [];
      
      if (Array.isArray(files)) return files.map((f: any) => f.name);
      if (files instanceof FileList) return Array.from(files).map((f: any) => f.name);
      if (files instanceof File) return [files.name];
      
      return [];
  }

  getFileName(controlName: string): string {
     const list = this.getFilesList(controlName);
     if (list.length === 0) return '';
     if (list.length === 1) return list[0];
     return `${list.length} archivos seleccionados`;
  }
  
  get fotosList(): string[] {
      return this.getFilesList('fileFotos');
  }

  // <-- DESCOMENTADO
  async confirmarConFirma() {
    if (!this.noRequiereFirma && this.firmaPad.isEmpty()) {
      this.errorFirma = true;
      this.notificacionService.showError('Por favor, firme en el recuadro para continuar.');
      return;
    }

    this.isLoading = true;
    const v = this.reclamoForm.value;
    const formData = new FormData();

    // 🔥 4. SÓLO BUSCAMOS EL BLOB SI ESTAMOS EN EL NAVEGADOR
    if (!this.noRequiereFirma && this.isBrowser) {
      const firmaBlob = await this.firmaPad.getSignatureBlob();
      formData.append('fileFirma', firmaBlob, 'firma_digital.png'); 
    }

    for (const key of Object.keys(v)) {
        // @ts-ignore
        const value = v[key];

        if (!value) continue; 

        if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
            value.forEach((file: File) => {
                formData.append(key, file); 
            });
        }
        else if (value instanceof File) {
            formData.append(key, value);
        }
        else if (typeof value === 'boolean') {
             formData.append(key, String(value));
        }
        else {
             formData.append(key, String(value));
        }
    }

    this.reclamosService.crearReclamo(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.router.navigate(['/exito'], { state: { codigo: res.codigo_seguimiento, nombre: v.nombre } });
      },
      error: (err) => {
        this.isLoading = false;
        const mensaje = err.error?.message || 'Error de conexión o datos inválidos.';
        this.notificacionService.showError(mensaje);
      }
    });
  }
}