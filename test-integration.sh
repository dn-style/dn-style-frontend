#!/bin/bash

echo " INICIANDO PRUEBAS DE INTEGRACIN NATIVAS (DOCKER + NODE) "

# Esperamos a que el proceso de Node est realmente escuchando
echo " Esperando a que el Backend (puerto 4000) est listo..."
sleep 8

docker exec dn-style-frontend-backend-1 node -e '
const http = require("http");

async function check(url, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  try {
    console.log("--- 1. Probando conexin Backend <-> WP ---");
    const prod = await check("http://localhost:4000/wc/products");
    if (prod.status === 200 && prod.data.includes("id")) {
      console.log(" Conexin OK (Productos obtenidos)");
    } else {
      console.log(" Fallo conexin (" + prod.status + ")");
    }

    console.log("--- 2. Probando Auth (Error Manejado como JSON) ---");
    const auth = await check("http://localhost:4000/auth/login", "POST", {username:"admin", password:"wrong"});
    if (auth.data.includes("\"error\":true")) {
      console.log(" Manejo de errores de Auth OK (JSON detectado)");
    } else {
      console.log(" Error en Auth no devuelto como JSON estandarizado");
      console.log("Respuesta recibida: " + auth.data);
    }
  } catch (e) {
    console.log(" Error fatal durante la prueba: " + e.message);
  }
}

run();
'

echo " PRUEBAS FINALIZADAS."
