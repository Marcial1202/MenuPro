
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  disponible: boolean;
  categoria: Categoria;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  private readonly categoriasUrl =
    'http://localhost:8080/api/categorias';

  private readonly productosUrl =
    'http://localhost:8080/api/productos';

  categorias: Categoria[] = [];
  productos: Producto[] = [];

  // Filtro de la carta digital
  categoriaSeleccionada: number | null = null;
  productosFiltrados: Producto[] = [];

  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';

  editandoId: number | null = null;
  editandoProductoId: number | null = null;

  nuevaCategoria = {
    nombre: '',
    descripcion: '',
    activa: true
  };

  categoriaEditada = {
    nombre: '',
    descripcion: '',
    activa: true
  };

  nuevoProducto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    imagenUrl: '',
    disponible: true,
    categoriaId: null as number | null
  };

  productoEditado = {
    nombre: '',
    descripcion: '',
    precio: 0,
    imagenUrl: '',
    disponible: true,
    categoriaId: null as number | null
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.listarCategorias();
    this.listarProductos();
  }

  // Nombre de la categoría seleccionada
  get nombreCategoriaSeleccionada(): string {
    if (this.categoriaSeleccionada === null) {
      return 'Nuestros platos';
    }

    return this.categorias.find(
      categoria =>
        Number(categoria.id) === Number(this.categoriaSeleccionada)
    )?.nombre ?? 'Nuestros platos';
  }

  // =========================
  // CRUD DE CATEGORÍAS
  // =========================

  listarCategorias(): void {
    this.cargando = true;
    this.error = '';

    this.http.get<Categoria[]>(this.categoriasUrl).subscribe({
      next: datos => {
        this.categorias = datos ?? [];
        this.cargando = false;
        this.filtrarProductos();
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error al listar categorías:', err);
        this.error = 'No se pudieron cargar las categorías.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  crearCategoria(): void {
    this.error = '';
    this.mensaje = '';

    const nombre = this.nuevaCategoria.nombre.trim();

    if (!nombre) {
      this.error = 'Escribe el nombre de la categoría.';
      return;
    }

    const categoria = {
      nombre,
      descripcion: this.nuevaCategoria.descripcion.trim(),
      activa: this.nuevaCategoria.activa
    };

    this.guardando = true;

    this.http.post<Categoria>(
      this.categoriasUrl,
      categoria
    ).subscribe({
      next: () => {
        this.mensaje = 'Categoría registrada correctamente.';

        this.nuevaCategoria = {
          nombre: '',
          descripcion: '',
          activa: true
        };

        this.guardando = false;
        this.listarCategorias();
      },
      error: err => {
        console.error('Error al registrar categoría:', err);
        this.error = 'No se pudo registrar la categoría.';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  editarCategoria(categoria: Categoria): void {
    this.editandoId = categoria.id;

    this.categoriaEditada = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      activa: categoria.activa
    };

    this.error = '';
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    this.editandoId = null;

    this.categoriaEditada = {
      nombre: '',
      descripcion: '',
      activa: true
    };
  }

  actualizarCategoria(): void {
    if (this.editandoId === null) return;

    this.error = '';
    this.mensaje = '';

    const nombre = this.categoriaEditada.nombre.trim();

    if (!nombre) {
      this.error = 'El nombre de la categoría es obligatorio.';
      return;
    }

    const id = this.editandoId;

    const categoria = {
      nombre,
      descripcion: this.categoriaEditada.descripcion.trim(),
      activa: this.categoriaEditada.activa
    };

    this.guardando = true;

    this.http.put<Categoria>(
      `${this.categoriasUrl}/${id}`,
      categoria
    ).subscribe({
      next: () => {
        this.mensaje = 'Categoría actualizada correctamente.';
        this.cancelarEdicion();
        this.guardando = false;
        this.listarCategorias();
      },
      error: err => {
        console.error('Error al actualizar categoría:', err);
        this.error = 'No se pudo actualizar la categoría.';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarCategoria(categoria: Categoria): void {
    const confirmar = confirm(
      `¿Seguro que deseas eliminar la categoría "${categoria.nombre}"?`
    );

    if (!confirmar) return;

    this.error = '';
    this.mensaje = '';

    this.http.delete<void>(
      `${this.categoriasUrl}/${categoria.id}`
    ).subscribe({
      next: () => {
        this.mensaje = 'Categoría eliminada correctamente.';

        if (Number(this.editandoId) === Number(categoria.id)) {
          this.cancelarEdicion();
        }

        if (
          this.categoriaSeleccionada !== null &&
          Number(this.categoriaSeleccionada) === Number(categoria.id)
        ) {
          this.categoriaSeleccionada = null;
        }

        this.listarCategorias();
        this.listarProductos();
      },
      error: err => {
        console.error('Error al eliminar categoría:', err);
        this.error =
          'No se pudo eliminar la categoría. Puede tener productos asociados.';
        this.cdr.detectChanges();
      }
    });
  }

  // =========================
  // CARTA DIGITAL: FILTROS
  // =========================

  filtrarPorCategoria(categoriaId: number | string | null): void {
    this.categoriaSeleccionada =
      categoriaId === null ? null : Number(categoriaId);

    this.filtrarProductos();
    this.cdr.detectChanges();
  }

  filtrarProductos(): void {
    // En la carta pública solo mostramos productos disponibles.
    const disponibles = this.productos.filter(
      producto => producto.disponible === true
    );

    if (this.categoriaSeleccionada === null) {
      this.productosFiltrados = disponibles;
      return;
    }

    this.productosFiltrados = disponibles.filter(producto => {
      const idCategoriaProducto = Number(producto.categoria?.id);
      const idCategoriaSeleccionada = Number(this.categoriaSeleccionada);

      return (
        Number.isFinite(idCategoriaProducto) &&
        idCategoriaProducto === idCategoriaSeleccionada
      );
    });
  }

  // =========================
  // CRUD DE PRODUCTOS
  // =========================

  listarProductos(): void {
    this.http.get<Producto[]>(this.productosUrl).subscribe({
      next: datos => {
        this.productos = datos ?? [];
        this.filtrarProductos();
        this.cdr.detectChanges();

        console.log('Productos recibidos:', this.productos);
      },
      error: err => {
        console.error('Error al listar productos:', err);
        this.error = 'No se pudieron cargar los productos.';
        this.cdr.detectChanges();
      }
    });
  }

  crearProducto(): void {
    this.error = '';
    this.mensaje = '';

    const nombre = this.nuevoProducto.nombre.trim();

    if (!nombre) {
      this.error = 'Escribe el nombre del producto.';
      return;
    }

    if (this.nuevoProducto.precio < 0) {
      this.error = 'El precio no puede ser negativo.';
      return;
    }

    if (this.nuevoProducto.categoriaId === null) {
      this.error = 'Selecciona una categoría para el producto.';
      return;
    }

    const producto = {
      nombre,
      descripcion: this.nuevoProducto.descripcion.trim(),
      precio: this.nuevoProducto.precio,
      imagenUrl: this.nuevoProducto.imagenUrl.trim(),
      disponible: this.nuevoProducto.disponible,
      categoria: {
        id: this.nuevoProducto.categoriaId
      }
    };

    this.guardando = true;

    this.http.post<Producto>(
      this.productosUrl,
      producto
    ).subscribe({
      next: () => {
        this.mensaje = 'Producto registrado correctamente.';

        this.nuevoProducto = {
          nombre: '',
          descripcion: '',
          precio: 0,
          imagenUrl: '',
          disponible: true,
          categoriaId: null
        };

        this.guardando = false;
        this.listarProductos();
      },
      error: err => {
        console.error('Error al registrar producto:', err);
        this.error =
          'No se pudo registrar el producto. Verifica los datos y la categoría.';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  editarProducto(producto: Producto): void {
    this.editandoProductoId = producto.id;

    this.productoEditado = {
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      precio: producto.precio,
      imagenUrl: producto.imagenUrl ?? '',
      disponible: producto.disponible,
      categoriaId: producto.categoria?.id == null
        ? null
        : Number(producto.categoria.id)
    };

    this.error = '';
    this.mensaje = '';
  }

  cancelarEdicionProducto(): void {
    this.editandoProductoId = null;

    this.productoEditado = {
      nombre: '',
      descripcion: '',
      precio: 0,
      imagenUrl: '',
      disponible: true,
      categoriaId: null
    };
  }

  actualizarProducto(): void {
    if (this.editandoProductoId === null) return;

    this.error = '';
    this.mensaje = '';

    const nombre = this.productoEditado.nombre.trim();

    if (!nombre) {
      this.error = 'El nombre del producto es obligatorio.';
      return;
    }

    if (this.productoEditado.precio < 0) {
      this.error = 'El precio no puede ser negativo.';
      return;
    }

    if (this.productoEditado.categoriaId === null) {
      this.error = 'Selecciona una categoría.';
      return;
    }

    const id = this.editandoProductoId;

    const producto = {
      nombre,
      descripcion: this.productoEditado.descripcion.trim(),
      precio: this.productoEditado.precio,
      imagenUrl: this.productoEditado.imagenUrl.trim(),
      disponible: this.productoEditado.disponible,
      categoria: {
        id: this.productoEditado.categoriaId
      }
    };

    this.guardando = true;

    this.http.put<Producto>(
      `${this.productosUrl}/${id}`,
      producto
    ).subscribe({
      next: () => {
        this.mensaje = 'Producto actualizado correctamente.';
        this.cancelarEdicionProducto();
        this.guardando = false;
        this.listarProductos();
      },
      error: err => {
        console.error('Error al actualizar producto:', err);
        this.error = 'No se pudo actualizar el producto.';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    const confirmar = confirm(
      `¿Seguro que deseas eliminar el producto "${producto.nombre}"?`
    );

    if (!confirmar) return;

    this.error = '';
    this.mensaje = '';

    this.http.delete<void>(
      `${this.productosUrl}/${producto.id}`
    ).subscribe({
      next: () => {
        this.mensaje = 'Producto eliminado correctamente.';
        this.listarProductos();
      },
      error: err => {
        console.error('Error al eliminar producto:', err);
        this.error = 'No se pudo eliminar el producto.';
        this.cdr.detectChanges();
      }
    });
  }
}
