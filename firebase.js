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

let recuerdos = [];
let indiceActual = -1;
let modalAbierto = false;
let inicioX = 0;

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

    contenedor.innerHTML = "";
    recuerdos = [];
    consulta.forEach((doc) => {

        const datos = doc.data();

        recuerdos.push({
            id: doc.id,
            ...datos
        });
        if (datos.tipo === "video") {
            videos++;
        } else {
            fotos++;
        }

        let multimedia = "";




       if (datos.tipo === "video") {

    multimedia = `
        <video 
            class="imagen-recuerdo"
            muted
            playsinline
            preload="metadata">
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

    if (!foto || !titulo || !mensaje || !fecha) {
        mostrarNotificacion("⚠️ Completa todos los campos");
        return;
    }

    botonGuardar.disabled = true;
    botonGuardar.textContent = "⏳ Subiendo...";
    mostrarNotificacion("⏳ Subiendo recuerdo...");

    const datosImagen = new FormData();

    datosImagen.append("file", foto);
    datosImagen.append("upload_preset", "nuestra_historia");

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

        mostrarNotificacion("❌ Error de conexión al subir");

        botonGuardar.disabled = false;
        botonGuardar.textContent = "Guardar";

        return;
    }

    if (!datosCloudinary.secure_url) {

        mostrarNotificacion("❌ Error al subir archivo");

        botonGuardar.disabled = false;
        botonGuardar.textContent = "Guardar";

        return;
    }

    const urlFoto = datosCloudinary.secure_url;
    const idFoto = datosCloudinary.public_id;

    try {

        await addDoc(collection(db, "recuerdos"), {
            titulo: titulo,
            mensaje: mensaje,
            fecha: fecha,
            foto: urlFoto,
            public_id: idFoto,
            tipo: tipoArchivo
        });

        mostrarNotificacion("✅ Recuerdo guardado");

        botonGuardar.textContent = "✅ Guardado";

        setTimeout(() => {
            location.reload();
        }, 900);

    } catch(error) {

        console.error(error);

        mostrarNotificacion("❌ Error al guardar recuerdo");

        botonGuardar.disabled = false;
        botonGuardar.textContent = "Guardar";
    }

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

       abrirModalPorId(id);

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
function abrirModalPorId(id) {

    const indice = recuerdos.findIndex(recuerdo => recuerdo.id === id);

    if (indice === -1) {
        return;
    }

    indiceActual = indice;

    mostrarRecuerdo(indiceActual);

    const modal = document.getElementById("modal-recuerdo");

    modal.style.display = "flex";

    modalAbierto = true;

    document.body.style.overflow = "hidden";

    history.pushState({ modal: true }, "", window.location.pathname);
}


function mostrarRecuerdo(indice) {

    detenerTodosLosVideos();

    const datos = recuerdos[indice];

    const multimedia = document.getElementById("modal-multimedia");

    const titulo = document.getElementById("modal-titulo");

    const mensaje = document.getElementById("modal-mensaje");

    const fecha = document.getElementById("modal-fecha");


    if (datos.tipo === "video") {

        multimedia.innerHTML = `
            <video controls autoplay playsinline>
                <source src="${datos.foto}">
                Tu navegador no soporta videos.
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
}


function cerrarModal() {

    detenerTodosLosVideos();

    document.getElementById("modal-recuerdo").style.display = "none";

    document.getElementById("modal-multimedia").innerHTML = "";

    modalAbierto = false;

    indiceActual = -1;

    document.body.style.overflow = "";
}


function siguienteRecuerdo() {

    if (indiceActual === -1) return;

    indiceActual++;

    if (indiceActual >= recuerdos.length) {
        indiceActual = 0;
    }

    mostrarRecuerdo(indiceActual);
}


function anteriorRecuerdo() {

    if (indiceActual === -1) return;

    indiceActual--;

    if (indiceActual < 0) {
        indiceActual = recuerdos.length - 1;
    }

    mostrarRecuerdo(indiceActual);
}

document.getElementById("cerrar-modal")
.addEventListener("click", () => {

    cerrarModal();

});

document.getElementById("btn-anterior")
.addEventListener("click", (evento) => {

    evento.stopPropagation();

    anteriorRecuerdo();

});


document.getElementById("btn-siguiente")
.addEventListener("click", (evento) => {

    evento.stopPropagation();

    siguienteRecuerdo();

});

window.addEventListener("popstate", () => {

    if (modalAbierto) {

        cerrarModal();

    }

});


const modalContenido = document.querySelector(".modal-contenido");

modalContenido.addEventListener("touchstart", (evento) => {

    inicioX = evento.touches[0].clientX;

});


modalContenido.addEventListener("touchend", (evento) => {

    const finX = evento.changedTouches[0].clientX;

    const diferencia = finX - inicioX;

    if (Math.abs(diferencia) > 60) {

        if (diferencia < 0) {

            siguienteRecuerdo();

        } else {

            anteriorRecuerdo();

        }

    }

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
