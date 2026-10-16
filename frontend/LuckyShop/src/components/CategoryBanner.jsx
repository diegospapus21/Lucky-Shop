/**
 * CategoryBanner — Banner decorativo de categoría con foto de fondo.
 * Muestra título en mayúsculas + descripción sobre una imagen premium.
 */
import bannerBg from '../assets/fondoCategoria.jpg'

const CategoryBanner = ({ titulo, descripcion, subcategorias = [], onSubcat, subcatActiva }) => (
  // Contenedor principal del banner, con imagen de fondo y degradado rosado encima
  <div
    className="relative overflow-hidden"
    style={{
      backgroundImage: `linear-gradient(90deg, rgba(251,220,230,0.75) 0%, rgba(251,220,230,0.25) 45%, rgba(255,255,255,0) 75%), url(${bannerBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: '#fbdce6',
      minHeight: '200px',
    }}
    id="category-banner"
  >
    {/* Contenido del banner: texto a la izquierda y subcategorías a la derecha */}
    <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
      {/* Título y descripción de la categoría */}
      <div className="max-w-md">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-wider mb-3">
          {titulo}
        </h1>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-light">
          {descripcion}
        </p>
      </div>

      {/* Lista de subcategorías (solo se muestra si vienen datos) */}
      {subcategorias.length > 0 && (
        <div className="flex gap-4 flex-wrap justify-start sm:justify-end">
          {subcategorias.map((s) => (
            // Botón circular de cada subcategoría; al hacer clic activa/desactiva el filtro
            <button
              key={s.value}
              onClick={() => onSubcat?.(s.value === subcatActiva ? '' : s.value)}
              className="flex flex-col items-center gap-1.5 group"
              id={`subcat-${s.value}`}
            >
              {/* Círculo con la imagen (o ícono) de la subcategoría, resaltado si está activa */}
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                subcatActiva === s.value
                  ? 'border-pink-500 shadow-lg shadow-pink-200/50 scale-105'
                  : 'border-white/80 hover:border-pink-300 hover:shadow-md'
              } bg-white/70 backdrop-blur-sm`}>
                {s.img ? (
                  <img src={s.img} alt={s.label} className={`w-full h-full ${s.imgClass || 'object-contain p-2.5'}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {s.icon || ''}
                  </div>
                )}
              </div>
              {/* Nombre de la subcategoría debajo del círculo */}
              <span className={`text-xs font-medium text-center leading-tight transition-colors ${
                subcatActiva === s.value ? 'text-pink-600' : 'text-gray-700 group-hover:text-pink-500'
              }`}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
)

export default CategoryBanner;