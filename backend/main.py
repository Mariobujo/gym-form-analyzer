"""
GymForm Analyzer - Backend Principal
FastAPI server con MySQL directo (sin SQLAlchemy por ahora)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import mysql.connector
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Crear instancia de FastAPI
app = FastAPI(
    title=os.getenv("APP_NAME", "GymForm Analyzer"),
    version=os.getenv("APP_VERSION", "1.0.0"),
    description="API para análisis y corrección de técnica en ejercicios de gimnasio",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc"  # ReDoc
)

# Configurar CORS
origins = [
    "http://localhost:3000",  # React development server
    "http://127.0.0.1:3000",
    "http://localhost:8080",  # Alternativa
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# =====================================
# FUNCIONES DE BASE DE DATOS
# =====================================

def get_mysql_connection():
    """Obtener conexión directa a MySQL"""
    try:
        config = {
            'host': os.getenv("DB_HOST", "localhost"),
            'port': int(os.getenv("DB_PORT", "3306")),
            'user': os.getenv("DB_USER", "root"),
            'password': os.getenv("DB_PASSWORD", ""),
            'database': os.getenv("DB_NAME", "gymform_analyzer"),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci'
        }
        
        connection = mysql.connector.connect(**config)
        return connection
    except mysql.connector.Error as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return None

def test_mysql_connection():
    """Probar conexión a MySQL"""
    try:
        connection = get_mysql_connection()
        if connection:
            cursor = connection.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            connection.close()
            return True
        return False
    except Exception as e:
        print(f"❌ Error en test de conexión: {e}")
        return False

def create_database_if_not_exists():
    """Crear base de datos si no existe"""
    try:
        # Conectar sin especificar base de datos
        config = {
            'host': os.getenv("DB_HOST", "localhost"),
            'port': int(os.getenv("DB_PORT", "3306")),
            'user': os.getenv("DB_USER", "root"),
            'password': os.getenv("DB_PASSWORD", ""),
            'charset': 'utf8mb4'
        }
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        db_name = os.getenv("DB_NAME", "gymform_analyzer")
        
        # Verificar si existe
        cursor.execute(f"SHOW DATABASES LIKE '{db_name}'")
        if not cursor.fetchone():
            # Crear base de datos
            cursor.execute(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ Base de datos '{db_name}' creada!")
        else:
            print(f"✅ Base de datos '{db_name}' ya existe!")
            
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creando base de datos: {e}")
        return False

# =====================================
# EVENTOS DE APLICACIÓN
# =====================================

@app.on_event("startup")
async def startup_event():
    """Evento que se ejecuta al iniciar la aplicación"""
    print("🔧 Configurando base de datos...")
    if create_database_if_not_exists():
        print("✅ Base de datos configurada!")
    else:
        print("❌ Error configurando base de datos!")

# =====================================
# RUTAS BÁSICAS
# =====================================

@app.get("/")
async def root():
    """Endpoint de bienvenida"""
    return {
        "message": "¡Bienvenido a GymForm Analyzer API!",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Endpoint para verificar que el servidor está funcionando"""
    return {
        "status": "healthy",
        "service": "gymform-analyzer-backend",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database_connected": test_mysql_connection()
    }

@app.get("/api/test")
async def test_endpoint():
    """Endpoint de prueba para el frontend"""
    return {
        "message": "Conexión exitosa con el backend",
        "data": {
            "server": "FastAPI",
            "database": "MySQL",
            "ai_ready": False,  # Cambiaremos a True cuando integremos la IA
            "database_connected": test_mysql_connection()
        }
    }

@app.get("/api/db-test")
async def test_database_connection():
    """Endpoint para probar la conexión a la base de datos"""
    try:
        connection = get_mysql_connection()
        if connection:
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            cursor.close()
            connection.close()
            
            return {
                "status": "success",
                "message": "Conexión a MySQL exitosa",
                "database": os.getenv("DB_NAME", "gymform_analyzer"),
                "mysql_version": version[0] if version else "unknown"
            }
        else:
            return {
                "status": "error",
                "message": "No se pudo conectar a MySQL",
                "database": os.getenv("DB_NAME", "gymform_analyzer")
            }
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Error conectando a MySQL: {str(e)}",
            "database": os.getenv("DB_NAME", "gymform_analyzer")
        }

# =====================================
# MANEJO DE ERRORES
# =====================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint no encontrado",
            "message": "La ruta solicitada no existe",
            "docs": "/docs"
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Error interno del servidor",
            "message": "Ha ocurrido un error inesperado"
        }
    )

# =====================================
# FUNCIÓN PRINCIPAL
# =====================================

if __name__ == "__main__":
    # Configuración del servidor
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    print(f"🚀 Iniciando GymForm Analyzer Backend...")
    print(f"📍 Servidor: http://{host}:{port}")
    print(f"📚 Documentación: http://{host}:{port}/docs")
    print(f"🔧 Modo debug: {debug}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,  # Auto-reload en desarrollo
        log_level="info"
    )