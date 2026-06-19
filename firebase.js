import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    addDoc,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAtWkN0TcPMkGcHFYbsowMWn4CcUxhB4",
    authDomain: "nuestra-historia-c73ce.firebaseapp.com",
    projectId: "nuestra-historia-c73ce",
    storageBucket: "nuestra-historia-c73ce.firebasestorage.app",
    messagingSenderId: "928669584321",
    appId: "1:928669584321:web:47ed6379c5824969f93d40"
};

const modalEliminar = document.getElementById("modal-eliminar");
const btnAceptarEliminar = document.getElementById("aceptar-eliminar");
const btnCancelarEliminar = document.getElementById("cancelar-eliminar");

let recuerdoAEliminar = null;

btnCancelarEliminar.addEventListener("click", () => {

    modalEliminar.style.display = "none";

    recuerdoAEliminar = null;

});


btnAceptarEliminar.addEventListener("click", async () => {

    if (recuerdoAEliminar) {

        modalEliminar.style.display = "none";

        await eliminarRecuerdo(recuerdoAEliminar);

        recuerdoAEliminar = null;
    }

});


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

let modo = "";


function mostrarNotificacion(texto) {

    const aviso = document.getElementById("notificacion");

    aviso.textContent = texto;

    aviso.classList.add("mostrar");


    setTimeout(() => {

        aviso.classList.remove("mostrar");

    }, 2000);
}

async function cargarRecuerdos() {

    let fotos = 0;
let videos = 0;

    const consulta = await getDocs(collection(db, "recuerdos"));

    const contenedor = document.getElementById("lista-recuerdos");

    consulta.forEach((doc) => {

        const datos = doc.data();

        if(datos.tipo === "video") {
    videos++;
} else {
    fotos++;
}

        let multimedia = "";

        if (datos.tipo === "video") {

            multimedia = `
   <video 
class="imagen-recuerdo"
controls
onclick="event.stopPropagation()">
        <source src="${datos.foto}">
        Tu navegador no soporta videos.
    </video>
    `;

        } else {

            multimedia = `
    <img src="${datos.foto}" class="imagen-recuerdo">
    `;

        }



        contenedor.innerHTML += `
<div class="foto" 
     id="recuerdo-${doc.id}"
     onclick="accionRecuerdo('${doc.id}', this)">





${multimedia}


<div class="contenido-recuerdo">

<h3>${datos.titulo}</h3>

<p>${datos.mensaje}</p>

<small>${datos.fecha}</small>

</div>


<div class="editar-recuerdo" style="display:none">

<input class="edit-titulo" value="${datos.titulo}">

<textarea class="edit-mensaje">${datos.mensaje}</textarea>

<input type="date" class="edit-fecha" value="${datos.fecha}">


<button onclick="guardarEdicion('${doc.id}', this)">
💾 Guardar cambios
</button>

</div>


</div>
`;

    });

document.getElementById("contador-fotos").textContent =
    fotos + " recuerdos";

document.getElementById("contador-videos").textContent =
    videos + " recuerdos"; 

}




cargarRecuerdos();




document.getElementById("modo-editar").addEventListener("click", () => {

    modo = "editar";

    mostrarNotificacion("✏️ Toca un recuerdo para editar");

});


document.getElementById("modo-eliminar").addEventListener("click", () => {

    modo = "eliminar";

    mostrarNotificacion("🗑️ Toca un recuerdo para eliminar");

});

const botonGuardar = document.getElementById("guardar-recuerdo");

botonGuardar.addEventListener("click", async () => {

    const foto = document.getElementById("foto").files[0];

    const titulo = document.getElementById("titulo").value;
    const mensaje = document.getElementById("mensaje").value;
    const fecha = document.getElementById("fecha").value;

    const datosImagen = new FormData();

    datosImagen.append("file", foto);
    datosImagen.append("upload_preset", "nuestra_historia");


    // Detectar si es imagen o video
    const tipoArchivo = foto.type.startsWith("video")
        ? "video"
        : "image";

    
    
    
let datosCloudinary;

try {

    const respuesta = await fetch(
        `https://api.cloudinary.com/v1_1/dqw7lrbuy/${tipoArchivo}/upload`,
        {
            method: "POST",
            body: datosImagen
        }
    );

    datosCloudinary = await respuesta.json();

    console.log(datosCloudinary);

} catch(error) {

    console.error(error);

    mostrarNotificacion("❌ Error de conexión con Cloudinary");

    return;
}

    if (!datosCloudinary.secure_url) {
       mostrarNotificacion("Eror al subir archivo");
        return;
    }

    const urlFoto = datosCloudinary.secure_url;
    const idFoto = datosCloudinary.public_id;

    await addDoc(collection(db, "recuerdos"), {
        titulo: titulo,
        mensaje: mensaje,
        fecha: fecha,
        foto: urlFoto,
        public_id: idFoto,
        tipo: tipoArchivo
    });


    mostrarNotificacion("Recuerdo guardado");

    location.reload();

});

window.eliminarRecuerdo = async function (id) {

   


    // Buscar datos del recuerdo
    const referencia = doc(db, "recuerdos", id);

    const recuerdo = await getDoc(referencia);

    const datos = recuerdo.data();


    // Borrar imagen en Cloudinary
    if (datos.public_id) {

       await fetch("https://nuestra-historia-api.onrender.com/eliminar-imagen", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                public_id: datos.public_id
            })
        });

    }


    // Borrar documento de Firebase
    await deleteDoc(referencia);


   mostrarNotificacion("🗑️ Recuerdo eliminado");

    location.reload();
}

window.editarRecuerdo = async function (id) {

    const nuevoTitulo = prompt("Nuevo título del recuerdo:");

    if (nuevoTitulo === null) return;

    const nuevoMensaje = prompt("Nuevo mensaje del recuerdo:");

    if (nuevoMensaje === null) return;

    const nuevaFecha = prompt("Nueva fecha (ejemplo 2026-06-16):");

    if (nuevaFecha === null) return;


    await updateDoc(doc(db, "recuerdos", id), {

        titulo: nuevoTitulo,
        mensaje: nuevoMensaje,
        fecha: nuevaFecha

    });


   mostrarNotificacion("✏️ Recuerdo actualizado");

    location.reload();

}

window.accionRecuerdo = async function (id, tarjeta) {

    if (modo === "") {

        // Detener video pequeño si está reproduciéndose
        const videoPequeño = tarjeta.querySelector("video");

        if (videoPequeño) {
            videoPequeño.pause();
            videoPequeño.currentTime = 0;
        }

        const referencia = doc(db, "recuerdos", id);

        const recuerdo = await getDoc(referencia);

        abrirModal(recuerdo.data());

        return;
    }

if (modo === "eliminar") {

    recuerdoAEliminar = id;

    modalEliminar.style.display = "flex";

    return;
}


    if (modo === "editar") {

        const contenido = tarjeta.querySelector(".contenido-recuerdo");
        const editar = tarjeta.querySelector(".editar-recuerdo");

        contenido.style.display = "none";
        editar.style.display = "flex";
    }

}

window.guardarEdicion = async function (id, boton) {

    const tarjeta = boton.parentElement;


    const nuevoTitulo =
        tarjeta.querySelector(".edit-titulo").value;

    const nuevoMensaje =
        tarjeta.querySelector(".edit-mensaje").value;

    const nuevaFecha =
        tarjeta.querySelector(".edit-fecha").value;


    await updateDoc(doc(db, "recuerdos", id), {

        titulo: nuevoTitulo,
        mensaje: nuevoMensaje,
        fecha: nuevaFecha

    });


    mostrarNotificacion("✏️ Recuerdo actualizado");

    location.reload();

}

function abrirModal(datos) {

    detenerTodosLosVideos();

    const modal = document.getElementById("modal-recuerdo");

    const multimedia = document.getElementById("modal-multimedia");

    const titulo = document.getElementById("modal-titulo");

    const mensaje = document.getElementById("modal-mensaje");

    const fecha = document.getElementById("modal-fecha");


    // Mostrar foto o video
    if (datos.tipo === "video") {

        multimedia.innerHTML = `
            <video controls autoplay>
                <source src="${datos.foto}">
            </video>
        `;

    } else {

        multimedia.innerHTML = `
            <img src="${datos.foto}">
        `;

    }


    titulo.textContent = datos.titulo;

    mensaje.textContent = datos.mensaje;

    fecha.textContent = datos.fecha;


    modal.style.display = "flex";

}

document.getElementById("cerrar-modal")
.addEventListener("click", () => {

    detenerTodosLosVideos();

    document.getElementById("modal-recuerdo")
    .style.display = "none";

    document.getElementById("modal-multimedia")
    .innerHTML = "";

});



    function detenerTodosLosVideos() {

    document.querySelectorAll("video").forEach(video => {

        video.pause();
        video.currentTime = 0;

    });

}

document.addEventListener("visibilitychange", () => {

    if (document.hidden) {

        detenerTodosLosVideos();

    }

});

export { db };
