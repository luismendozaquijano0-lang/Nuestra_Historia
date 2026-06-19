function actualizarTiempo() {

    const fechaInicio = new Date("2026-04-16T00:00:00");
    const ahora = new Date();

    const diferencia = ahora - fechaInicio;


    const segundosTotales = Math.floor(diferencia / 1000);

    const dias = Math.floor(segundosTotales / 86400);

    const horas = Math.floor((segundosTotales % 86400) / 3600);

    const minutos = Math.floor((segundosTotales % 3600) / 60);

    const segundos = segundosTotales % 60;


    document.getElementById("dias").textContent = dias;

    document.getElementById("horas").textContent = horas;

    document.getElementById("minutos").textContent = minutos;

    document.getElementById("segundos").textContent = segundos;
}


actualizarTiempo();

setInterval(actualizarTiempo, 1000);

const btnAgregar = document.getElementById("btn-agregar");
const formulario = document.getElementById("formulario-recuerdo");


btnAgregar.addEventListener("click", () => {

    if (formulario.style.display === "grid") {

        formulario.style.display = "none";
        btnAgregar.textContent = "➕ Agregar recuerdo";

    } else {

        formulario.style.display = "grid";
        btnAgregar.textContent = "❌ Cancelar";

    }

});