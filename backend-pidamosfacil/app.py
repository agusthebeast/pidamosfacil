from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import os
import uuid

app = Flask(__name__)
CORS(app)

# Ruta del archivo Excel
EXCEL_FILE = "pedidos.xlsx"

# Inicializa el archivo Excel si no existe
if not os.path.exists(EXCEL_FILE):
    df = pd.DataFrame(columns=["ID", "Nombre", "Cantidad", "Producto", "Precio", "Mensaje"])
    df.to_excel(EXCEL_FILE, index=False)

@app.route("/add-order", methods=["POST"])
def add_order():
    data = request.json
    order_id = str(uuid.uuid4())[:8]  # Genera un ID único
    nombre = data.get("nombre")
    cantidad = data.get("cantidad")
    producto = data.get("producto")
    precio = data.get("precio")
    mensaje = data.get("mensaje")

    # Agrega los datos al archivo Excel
    df = pd.read_excel(EXCEL_FILE)
    new_row = {"ID": order_id, "Nombre": nombre, "Cantidad": cantidad, "Producto": producto, "Precio": precio, "Mensaje": mensaje}
    df = df.append(new_row, ignore_index=True)
    df.to_excel(EXCEL_FILE, index=False)

    return jsonify({"success": True, "order_id": order_id})

@app.route("/get-orders", methods=["GET"])
def get_orders():
    return send_file(EXCEL_FILE, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
