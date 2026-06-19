const express = require("express");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


cloudinary.config({
    cloud_name: "dqw7lrbuy",
    api_key: "727565742851852",
    api_secret: "h0EFD03kDaFU_g6e86z1aEpgeiw"
});


// Ruta para borrar una imagen
app.post("/eliminar-imagen", async (req, res) => {

    try {

        const public_id = req.body.public_id;

        const resultado = await cloudinary.uploader.destroy(public_id);

        res.json(resultado);

    } catch(error) {

        res.status(500).json(error);
    }

});


// Encender servidor
app.listen(3000, () => {
    console.log("Servidor funcionando en puerto 3000");
});