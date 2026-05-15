const noticias = [
    {
        titulo: "5 averías que pueden destruir tu coche",
        descripcion: "Descubre los fallos silenciosos que pueden acabar en reparaciones muy caras.",
        fecha: "",
        imagen: "css/img/averias.jpg",
        url: "noticia-averias.html"
    },
    {
        titulo: "La regla de los 2 segundos",
        descripcion: "El truco más simple para evitar sustos innecesarios en la carretera.",
        fecha: "",
        imagen: "css/img/regla2Segundos.jpg",
        url: "noticia-seguridad.html"
    },
    {
        titulo: "Psicología al volante",
        descripcion: "Por qué tu cerebro 'recorta' la carretera y cómo recuperar el control.",
        fecha: "",
        imagen: "css/img/psicologiaVolante.jpg",
        url: "noticia-psicologia.html"
    },
    {
        titulo: "Mantenimiento Preventivo",
        descripcion: "Guía básica para conductores primerizos sobre el cuidado del motor.",
        fecha: "",
        imagen: "ruta/imagen4.jpg",
        url: "noticia-mantenimiento.html"
    }
];

function cargarNoticias() {
    const contenedor = document.getElementById('news-grid');
    if (!contenedor) return;

    let htmlContent = "";

    noticias.forEach(noticia => {
        htmlContent += `
            <a href="${noticia.url}" class="news-card-link">
                <article class="news-card">
                    <div class="news-image">
                        <img src="${noticia.imagen}" alt="${noticia.titulo}">
                    </div>
                    <div class="news-content">
                        <h2 class="news-title">${noticia.titulo}</h2>
                        <p class="news-excerpt">${noticia.descripcion}</p>
                        <div class="news-meta">
                            <span><i class="far fa-calendar-alt"></i> ${noticia.fecha}</span>
                        </div>
                    </div>
                </article>
            </a>
        `;
    });

    contenedor.innerHTML = htmlContent;
}

// Se ejecuta cuando el DOM está listo
document.addEventListener('DOMContentLoaded', cargarNoticias);